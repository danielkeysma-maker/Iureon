import React from 'react';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { expedientesApi, type PasajeDelExpediente } from '../services/expedientes.api';
import type { ExpedienteConDetalle } from '../types';

/**
 * BUSCAR DENTRO DEL EXPEDIENTE.
 *
 * ─── POR QUÉ ESTO ANTES QUE LAS CARPETAS ───────────────────────────────────
 *
 * Un expediente de trescientas páginas no se navega: se pregunta. Escribir
 * «entrega del inmueble» y ver los pasajes que hablan de eso, con el documento
 * del que salieron al lado, es lo que un árbol de carpetas no da por muchos
 * niveles que tenga — porque el abogado no recuerda en qué carpeta guardó el
 * párrafo, recuerda lo que decía.
 *
 * ─── NO BUSCA POR PALABRA EXACTA, Y ESO HAY QUE DECIRLO ────────────────────
 *
 * Es búsqueda por SIGNIFICADO: «no entregó el inmueble» encuentra un pasaje que
 * dice «se abstuvo de restituir el bien» aunque no comparta una sola palabra.
 * Quien espera un buscador de texto exacto y no encuentra su palabra literal
 * concluye que la búsqueda está rota, así que la pantalla lo dice antes.
 *
 * ─── NO CUESTA SALDO ───────────────────────────────────────────────────────
 *
 * Es la consulta contra un índice que ya está pagado; no llama a ningún modelo
 * de lenguaje. Se dice, porque en esta pantalla el botón de al lado sí cobra y
 * el abogado no tiene por qué adivinar cuál es cuál.
 */
export const BuscarEnExpediente: React.FC<{ expediente: ExpedienteConDetalle }> = ({ expediente }) => {
  const [consulta, setConsulta] = React.useState('');
  const [buscando, setBuscando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [pasajes, setPasajes] = React.useState<PasajeDelExpediente[] | null>(null);

  const buscar = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (consulta.trim().length < 3) return;
    setBuscando(true);
    setError('');
    try {
      const r = await expedientesApi.buscar(expediente.id, consulta.trim());
      /*
       * «No se pudo buscar» NO es «no hay resultados». Sin proveedor o sin
       * índice, decir «nada coincide» dejaría al abogado creyendo que su
       * expediente no habla de lo que preguntó.
       */
      if (r.estado !== 'OK') {
        setPasajes(null);
        setError(r.razon ?? 'La búsqueda no está disponible en este momento.');
        return;
      }
      setPasajes(r.pasajes);
    } catch (err) {
      setPasajes(null);
      setError((err as Error).message);
    } finally {
      setBuscando(false);
    }
  };

  return (
    <section className="card p-4">
      <h2 className="text-h3">Buscar en el expediente</h2>
      <p className="mt-1 text-meta text-ink-500">
        Busca por significado, no por palabra exacta: «no entregó el inmueble» encuentra un pasaje que dice
        «se abstuvo de restituir el bien». No consume saldo.
      </p>

      <form onSubmit={buscar} className="mt-3 flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" />
          <label className="sr-only" htmlFor="buscar-expediente">
            Qué busca
          </label>
          <input
            id="buscar-expediente"
            className="field pl-8"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="la entrega del inmueble, el pago de los cánones…"
          />
        </div>
        <button type="submit" className="btn-primary btn-sm shrink-0" disabled={buscando || consulta.trim().length < 3}>
          {buscando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Buscar'}
        </button>
      </form>

      {error && (
        <p className="mt-2 flex items-start gap-2 text-meta text-ink-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="[overflow-wrap:anywhere]">{error}</span>
        </p>
      )}

      {pasajes !== null && pasajes.length === 0 && (
        <p className="mt-3 text-meta text-ink-500">
          Nada en este expediente habla de eso. Si el documento no está indexado, la búsqueda no lo ve:
          revise arriba qué hay dentro.
        </p>
      )}

      {pasajes !== null && pasajes.length > 0 && (
        <ul className="mt-3 space-y-2">
          {pasajes.map((p, i) => (
            <li key={i} className="rounded-card border border-line-200 p-3">
              {/*
                EL DOCUMENTO VA PRIMERO Y NO AL PIE. Un pasaje sin saber de dónde
                sale no se puede usar: el abogado necesita poder abrir ESE
                documento y leer alrededor.
              */}
              <p className="text-meta font-medium text-ink-700 [overflow-wrap:anywhere]">{p.documento}</p>
              <p className="mt-1 text-body [overflow-wrap:anywhere]">{p.texto}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
