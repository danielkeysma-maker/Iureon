import React from 'react';
import { Link2, Link2Off, Loader2, Search } from 'lucide-react';
import { expedientesApi, type Candidato } from '../services/expedientes.api';
import type { ExpedienteConDetalle } from '../types';

/**
 * TRAER AL EXPEDIENTE LO QUE LA FIRMA YA TIENE.
 *
 * ─── SE TIRA DESDE AQUÍ, NO SE EMPUJA DESDE CADA PANTALLA ──────────────────
 *
 * El gesto natural parecía ser un botón «atar a un expediente» en Entrevistas,
 * Revisiones, Borradores y la Agenda. Se descartó porque un abogado no ata
 * piezas sueltas mientras navega listas: abre el asunto en el que va a
 * trabajar y trae lo suyo. El gesto va donde está la intención.
 *
 * ─── LO YA ATADO SE MUESTRA, NO SE ESCONDE ─────────────────────────────────
 *
 * Esconderlo dejaría al abogado buscando una entrevista que existe y no
 * aparece, sin saber por qué —y esa es una de las formas más frustrantes de
 * fallar, porque no hay error que leer—. Se muestra, se dice si ya es de otro
 * expediente, y se puede mover: cambiar de carpeta es una corrección legítima.
 */
export const TraerAlExpediente: React.FC<{
  expediente: ExpedienteConDetalle;
  onCambio: () => Promise<void>;
}> = ({ expediente, onCambio }) => {
  const [abierto, setAbierto] = React.useState(false);
  const [candidatos, setCandidatos] = React.useState<Candidato[]>([]);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [filtro, setFiltro] = React.useState('');
  const [ocupado, setOcupado] = React.useState<string | null>(null);

  const cargar = React.useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setCandidatos(await expedientesApi.candidatos());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    if (abierto && candidatos.length === 0) void cargar();
  }, [abierto, candidatos.length, cargar]);

  const alternar = async (c: Candidato): Promise<void> => {
    /* Ya es de este expediente: el gesto lo suelta. */
    const destino = c.expedienteId === expediente.id ? null : expediente.id;
    setOcupado(`${c.tipo}:${c.id}`);
    setError('');
    try {
      await expedientesApi.atar(c.tipo, c.id, destino);
      setCandidatos((antes) =>
        antes.map((x) => (x.tipo === c.tipo && x.id === c.id ? { ...x, expedienteId: destino } : x))
      );
      /* Las cuentas del encabezado las calcula el servidor: se releen. */
      await onCambio();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOcupado(null);
    }
  };

  const visibles = filtro.trim()
    ? candidatos.filter((c) => c.titulo.toLowerCase().includes(filtro.trim().toLowerCase()))
    : candidatos;

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-h3">Traer al expediente</h2>
          <p className="text-meta text-ink-500">
            Las entrevistas, audiencias, revisiones, borradores, términos y orientaciones que ya tiene.
          </p>
        </div>
        <button type="button" onClick={() => setAbierto((v) => !v)} className="btn-secondary btn-sm gap-1.5">
          <Link2 className="h-3.5 w-3.5" />
          {abierto ? 'Cerrar' : 'Ver lo que hay'}
        </button>
      </div>

      {abierto && (
        <div className="mt-3">
          <label className="sr-only" htmlFor="filtro-candidatos">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" />
            <input
              id="filtro-candidatos"
              className="field pl-8"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar por nombre"
            />
          </div>

          {error && <p className="mt-2 text-meta text-ink-700 [overflow-wrap:anywhere]">{error}</p>}

          {cargando ? (
            <p className="mt-3 flex items-center gap-2 text-meta text-ink-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Buscando lo que hay…
            </p>
          ) : visibles.length === 0 ? (
            <p className="mt-3 text-meta text-ink-500">
              {candidatos.length === 0
                ? 'Todavía no hay nada que traer. Lo que grabe, revise o redacte aparecerá aquí.'
                : 'Nada coincide con esa búsqueda.'}
            </p>
          ) : (
            <ul className="mt-3 max-h-96 space-y-1.5 overflow-y-auto">
              {visibles.map((c) => {
                const mio = c.expedienteId === expediente.id;
                const deOtro = Boolean(c.expedienteId) && !mio;
                const clave = `${c.tipo}:${c.id}`;
                return (
                  <li
                    key={clave}
                    className="flex items-start justify-between gap-2 rounded-card border border-line-200 p-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-body [overflow-wrap:anywhere]">{c.titulo}</p>
                      {deOtro && (
                        /*
                          Se dice que ya es de otro expediente, PERO NO SE
                          BLOQUEA. Mover una pieza de carpeta es una corrección
                          frecuente —el asunto se registró dos veces, la
                          entrevista era del otro caso— y bloquearla obligaría a
                          ir a la otra carpeta a soltarla primero.
                        */
                        <p className="mt-0.5 text-meta text-ink-500">
                          Ya está en otro expediente. Traerla aquí la mueve.
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => void alternar(c)}
                      className={`${mio ? 'btn-ghost' : 'btn-secondary'} btn-sm shrink-0 gap-1.5`}
                      disabled={ocupado === clave}
                    >
                      {ocupado === clave ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : mio ? (
                        <Link2Off className="h-3.5 w-3.5" />
                      ) : (
                        <Link2 className="h-3.5 w-3.5" />
                      )}
                      {mio ? 'Soltar' : 'Traer'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
};
