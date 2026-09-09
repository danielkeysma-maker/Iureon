import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, Check, Trash2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { toolsApi } from '../../tools/services/tools.api';
import type { CalendarioAnual } from '../../tools/types';
import { agendaApi } from '../services/agenda.api';
import { tomarPendiente, type AgendaPendiente } from '../pendiente';
import type { EntradaDeAgenda } from '../types';
import { AgendaForm } from './AgendaForm';
import { CalendarioDelAno } from './CalendarioDelAno';

/**
 * LA AGENDA DE TÉRMINOS DE LA FIRMA.
 *
 * ─── POR QUÉ ESTA PANTALLA ABRE DESDE EL CALENDARIO JUDICIAL ────────────────
 *
 * La tarjeta del calendario prometía «el calendario judicial con los términos
 * de la firma encima» y solo entregaba la primera mitad: festivos, vacancia y
 * días hábiles, iguales para todo el mundo. La segunda mitad —«este día se me
 * viene este proceso y tengo tantos días para responder»— no existía en ninguna
 * parte del producto. Es lo que hay aquí, y por eso ocupa el sitio de la
 * tarjeta que la prometía en vez de nacer como un módulo aparte.
 *
 * ─── TRES CEJILLAS, EN EL ORDEN EN QUE SE USA ───────────────────────────────
 *
 * «Lo que viene» es lo primero porque es la pregunta diaria. «El año» sirve
 * para ver la carga repartida y encontrar la semana imposible antes de aceptar
 * un caso. «Añadir» va al final porque se usa una vez por término, no cada día.
 *
 * ─── EL DETALLE DE LOS FESTIVOS SIGUE DONDE ESTABA ──────────────────────────
 *
 * Con su tabla, su regla por fila y sus dos exportaciones: no se rehace aquí,
 * se abre desde el pie con `onVerFestivos`. Duplicar esa tabla habría creado
 * dos sitios donde arreglar el mismo dato.
 */

type Cejilla = 'proximos' | 'ano' | 'nuevo';

const CEJILLAS: Array<{ id: Cejilla; etiqueta: string }> = [
  { id: 'proximos', etiqueta: 'Lo que viene' },
  { id: 'ano', etiqueta: 'El año' },
  { id: 'nuevo', etiqueta: 'Añadir' }
];

const DIA_MS = 24 * 60 * 60 * 1000;

/** Días que faltan, contados sobre el día local del navegador. */
const faltan = (fechaLimite: string): number => {
  const ahora = new Date();
  const hoy = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  return Math.round((Date.parse(`${fechaLimite}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / DIA_MS);
};

const comoQuedan = (dias: number): string => {
  if (dias < 0) return `Venció hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Queda 1 día';
  return `Quedan ${dias} días`;
};

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Abre el detalle de festivos y vacancia del año, con sus exportaciones. */
  onVerFestivos: () => void;
}

export const AgendaModal: React.FC<AgendaModalProps> = ({ isOpen, onClose, onVerFestivos }) => {
  const [cejilla, setCejilla] = useState<Cejilla>('proximos');
  const [entradas, setEntradas] = useState<EntradaDeAgenda[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [calendario, setCalendario] = useState<CalendarioAnual | null>(null);
  const [pendiente, setPendiente] = useState<AgendaPendiente | null>(null);

  /*
   * LO QUE TRAE UN BORRADOR SE CONSUME AL ABRIR, y solo una vez. Dejarlo en el
   * almacenamiento haría que el formulario naciera con el caso de la semana
   * pasada cada vez que alguien abre la agenda.
   */
  useEffect(() => {
    if (!isOpen) return;
    const traido = tomarPendiente();
    if (traido) {
      setPendiente(traido);
      setCejilla('nuevo');
    }
  }, [isOpen]);

  const recargar = (): void => {
    setCargando(true);
    setError('');
    agendaApi
      .listar('TODAS')
      .then(setEntradas)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'No se pudo leer la agenda.'))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (isOpen) recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || cejilla !== 'ano') return;
    let vigente = true;
    toolsApi
      .calendario(anio, true)
      .then((c) => {
        if (vigente) setCalendario(c);
      })
      .catch(() => {
        /* Sin el calendario del año se pintan los vencimientos igual; lo que se
           pierde es el fondo de días no hábiles, no el dato de la firma. */
        if (vigente) setCalendario(null);
      });
    return () => {
      vigente = false;
    };
  }, [isOpen, cejilla, anio]);

  const pendientes = entradas
    .filter((e) => e.estado === 'PENDIENTE')
    .sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite));

  const marcarCumplida = async (entrada: EntradaDeAgenda): Promise<void> => {
    try {
      const actualizada = await agendaApi.editar(entrada.id, { estado: 'CUMPLIDA' });
      setEntradas((previas) => previas.map((e) => (e.id === actualizada.id ? actualizada : e)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo marcar como cumplida.');
    }
  };

  const borrar = async (entrada: EntradaDeAgenda): Promise<void> => {
    try {
      await agendaApi.borrar(entrada.id);
      setEntradas((previas) => previas.filter((e) => e.id !== entrada.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar la entrada.');
    }
  };

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      tamano="L"
      titulo="Agenda de términos"
      subtitulo="Lo que se le vence a la firma, con la cuenta hecha por el motor de términos y el aviso al teléfono."
      cuerpoEnCanvas
      acciones={
        <button onClick={onVerFestivos} className="btn-neutral btn-sm">
          <CalendarDays className="h-3.5 w-3.5" />
          Festivos y vacancia del año
        </button>
      }
    >
      <div className="min-w-0 space-y-4">
        {/* El segmentado se desplaza en vez de encoger: una cejilla medio
            borrada a 320px es peor que una a la que hay que deslizarse. */}
        <div className="w-full min-w-0 overflow-x-auto">
          <div className="inline-flex gap-1 rounded-card bg-canvas p-1">
            {CEJILLAS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCejilla(c.id)}
                aria-current={cejilla === c.id ? 'true' : undefined}
                className={`shrink-0 whitespace-nowrap rounded-control px-3 py-1.5 text-ui transition-colors ${
                  cejilla === c.id
                    ? 'bg-surface font-semibold text-ink-900 shadow-e1'
                    : 'text-ink-500 hover:text-ink-900'
                }`}
              >
                {c.etiqueta}
                {c.id === 'proximos' && (
                  <span className="ml-1.5 font-mono text-[10.5px] text-ink-400">{pendientes.length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="notice-unverified">{error}</p>}

        {cejilla === 'proximos' && (
          <div className="min-w-0 space-y-2">
            {cargando && <p className="text-meta text-ink-500">Leyendo la agenda…</p>}

            {!cargando && pendientes.length === 0 && (
              /* Un vacío que ANUNCIA: una capacidad que no se presenta no existe. */
              <div className="rounded-card border border-line-200 bg-surface px-4 py-6 text-center">
                <p className="text-ui text-ink-900">Todavía no hay términos en la agenda.</p>
                <p className="mx-auto mt-1 max-w-[54ch] text-justify text-meta text-ink-500 [text-wrap:pretty]">
                  Ponga uno en «Añadir»: elija la actuación del catálogo y escriba la fecha de
                  notificación. La aplicación calcula el vencimiento con el mismo motor del contador
                  de términos y le avisa cinco días antes, dos días antes y el día del vencimiento.
                </p>
                <button type="button" onClick={() => setCejilla('nuevo')} className="btn-primary btn-sm mt-3">
                  Añadir el primero
                </button>
              </div>
            )}

            {pendientes.map((e) => {
              const dias = faltan(e.fechaLimite);
              const urgente = dias <= 2;
              return (
                <div
                  key={e.id}
                  className={`min-w-0 rounded-card border bg-surface p-3 [overflow-wrap:anywhere] ${
                    dias < 0
                      ? 'border-[rgb(var(--unverified-line))]'
                      : urgente
                        ? 'border-[rgb(var(--rail-gold)/0.55)]'
                        : 'border-line-200'
                  }`}
                >
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span
                      className={`shrink-0 font-mono text-[11px] font-semibold ${
                        urgente ? 'text-[rgb(var(--rail-gold-ink))]' : 'text-ink-500'
                      }`}
                    >
                      {comoQuedan(dias)}
                    </span>
                    <span className="font-mono text-[11px] text-ink-400">{e.fechaLimite}</span>
                    {!e.terminoVerificado && (
                      <span className="chip-unverified">
                        {e.origenFecha === 'MANUAL' ? 'Fecha escrita a mano' : 'Plazo sin verificar'}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 min-w-0 text-ui font-semibold text-ink-900">{e.asunto}</p>
                  <p className="text-justify text-meta text-ink-500 [text-wrap:pretty]">
                    {e.actuacionNombre}
                    {e.cliente ? ` · ${e.cliente}` : ''}
                    {e.radicado ? ` · ${e.radicado}` : ''}
                  </p>
                  <p className="text-meta text-ink-400">
                    Notificado el {e.fechaNotificacion}
                    {e.diasTermino ? ` · ${e.diasTermino} días ${e.tipoDias === 'HABILES' ? 'hábiles' : 'de calendario'}` : ''}
                    {e.responsable ? ` · avisa solo a ${e.responsable}` : ' · avisa a toda la firma'}
                  </p>

                  {e.notas && (
                    <p className="mt-1 text-justify text-meta text-ink-500 [text-wrap:pretty]">{e.notas}</p>
                  )}

                  {!e.terminoVerificado && (
                    <p className="mt-1.5 flex items-start gap-1.5 text-justify text-meta text-unverified [text-wrap:pretty]">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {e.origenFecha === 'MANUAL'
                        ? 'Esta fecha no la calculó la aplicación: la escribió quien creó la entrada.'
                        : 'El plazo lo escribió quien creó la entrada, no el catálogo verificado.'}
                    </p>
                  )}

                  <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                    <button onClick={() => void marcarCumplida(e)} className="btn-neutral btn-sm">
                      <Check className="h-3.5 w-3.5" />
                      Cumplida
                    </button>
                    <button onClick={() => void borrar(e)} className="btn-neutral btn-sm">
                      <Trash2 className="h-3.5 w-3.5" />
                      Borrar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {cejilla === 'ano' && (
          <div className="min-w-0 space-y-3">
            <div className="flex min-w-0 flex-wrap items-end gap-3">
              <label className="block">
                <span className="field-label">Año</span>
                <input
                  type="number"
                  min={1984}
                  max={2200}
                  value={anio}
                  onChange={(ev) => setAnio(Number(ev.target.value))}
                  className="field mt-1 w-[120px] font-mono"
                />
              </label>
              {/* En el telefono baja a su propio renglon: junto al campo del ano
                  se quedaba en una columna de tres palabras, que se lee peor
                  que un parrafo entero debajo. */}
              <p className="w-full min-w-0 text-justify text-meta text-ink-500 [text-wrap:pretty] sm:flex-1">
                En gris, los días que no cuentan: fines de semana, festivos de la Ley 51 de 1983,
                vacancia judicial y Semana Santa, tal como los calcula el servidor. En oro, los
                vencimientos de su firma; con filete ámbar, los que nadie ha verificado.
              </p>
            </div>

            <CalendarioDelAno
              anio={anio}
              calendario={calendario}
              entradas={pendientes.filter((e) => e.fechaLimite.startsWith(String(anio)))}
            />
          </div>
        )}

        {cejilla === 'nuevo' && (
          <AgendaForm
            pendiente={pendiente}
            onGuardada={(entrada) => {
              setEntradas((previas) => [...previas, entrada]);
              setPendiente(null);
              setCejilla('proximos');
            }}
          />
        )}
      </div>
    </Dialog>
  );
};
