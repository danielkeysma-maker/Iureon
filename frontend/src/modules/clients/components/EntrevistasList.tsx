import React, { useMemo, useState } from 'react';
import { MoreHorizontal, RefreshCw, Search, Trash2, Undo2, UserRound } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { transcriptionApi, type StoredTranscription } from '../../transcription/services/transcription.api';

/**
 * La lista de entrevistas. Se ordena por la DECISIÓN PENDIENTE, no por fecha.
 *
 * Cada entrevista termina en una decisión: se toma el caso o se declina. Una
 * sin decidir es un cliente sin respuesta, y por eso las que esperan van
 * arriba con los días que llevan esperando — nueve días sin respuesta no
 * aparecen en ninguna lista ordenada por fecha, y son los que cuestan
 * clientes.
 *
 * DECLINAR TAMBIÉN SE REGISTRA, con su motivo de una lista corta. La firma
 * necesita saber qué está rechazando y por qué, y el consultante merece una
 * respuesta. El servidor rechaza un declinado sin motivo; la base también.
 *
 * LAS CUATRO CIFRAS DE ARRIBA son de gestión, no decoración: dicen si el
 * embudo de clientes está atascado. Todas salen de las filas — nada se estima.
 */

interface EntrevistasListProps {
  items: StoredTranscription[];
  isLoading: boolean;
  onOpen: (item: StoredTranscription) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

/** Los motivos de la lista corta. «Otro» pide el texto. */
const MOTIVOS = [
  'Fuera de materia',
  'Sin viabilidad',
  'Conflicto de interés',
  'Término vencido',
  'El cliente no volvió',
  'Otro'
] as const;

const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

const duracion = (segundos: number | null): string => {
  if (!segundos) return '';
  const m = Math.round(segundos / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

const diasDesde = (iso: string): number =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);

const nombreLegible = (title: string): string => title.replace(/^\d{10,}_/, '');
const quien = (email?: string | null): string => (email ? email.split('@')[0] : '');

export const EntrevistasList: React.FC<EntrevistasListProps> = ({
  items,
  isLoading,
  onOpen,
  onDelete,
  onRefresh
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [porEliminar, setPorEliminar] = useState<StoredTranscription | null>(null);
  const [porDeclinar, setPorDeclinar] = useState<StoredTranscription | null>(null);
  const [motivo, setMotivo] = useState<string>('');
  const [motivoOtro, setMotivoOtro] = useState('');
  const [errorDecision, setErrorDecision] = useState('');

  /*
   * La decisión se refleja al instante y el servidor confirma detrás. Si
   * falla, onRefresh la devuelve a la verdad — nunca se queda una decisión
   * pintada que el servidor no tiene.
   */
  const decidir = async (
    item: StoredTranscription,
    decision: 'SIN_DECIDIR' | 'TOMADO' | 'DECLINADO',
    razon?: string
  ) => {
    setErrorDecision('');
    const r = await transcriptionApi.decidir(item.id, decision, razon);
    if (!r.item) {
      setErrorDecision(r.error ?? 'No se pudo registrar la decisión.');
    }
    onRefresh();
  };

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.full_text.toLowerCase().includes(q) ||
        quien(i.user_email).toLowerCase().includes(q)
    );
  }, [items, busqueda]);

  const sinDecidir = visibles
    .filter((i) => (i.decision ?? 'SIN_DECIDIR') === 'SIN_DECIDIR')
    // La más antigua primero: es la persona que más lleva esperando.
    .sort((a, b) => new Date(a.transcribed_at).getTime() - new Date(b.transcribed_at).getTime());
  const decididas = visibles.filter((i) => (i.decision ?? 'SIN_DECIDIR') !== 'SIN_DECIDIR');

  /* Las cifras, todas contadas de las filas. */
  const todasSinDecidir = items.filter((i) => (i.decision ?? 'SIN_DECIDIR') === 'SIN_DECIDIR');
  const masAntigua = todasSinDecidir.length
    ? Math.max(...todasSinDecidir.map((i) => diasDesde(i.transcribed_at)))
    : 0;
  const tomadas = items.filter((i) => i.decision === 'TOMADO').length;
  const declinadas = items.filter((i) => i.decision === 'DECLINADO').length;
  const conDuracion = items.filter((i) => i.duration_seconds);
  const duracionMedia = conDuracion.length
    ? Math.round(
        conDuracion.reduce((s, i) => s + (i.duration_seconds ?? 0), 0) / conDuracion.length / 60
      )
    : 0;

  const cerrarDeclinar = () => {
    setPorDeclinar(null);
    setMotivo('');
    setMotivoOtro('');
  };

  const Fila: React.FC<{ item: StoredTranscription }> = ({ item }) => {
    const estado = item.decision ?? 'SIN_DECIDIR';
    const dias = diasDesde(item.transcribed_at);

    return (
      <div className="t-row flex items-center gap-3">
        <button onClick={() => onOpen(item)} className="min-w-0 flex-1 text-left" title="Abrir la entrevista">
          <span className="block truncate text-ui text-ink-900">{nombreLegible(item.title)}</span>
          <span className="mt-0.5 block truncate font-mono text-[11px] text-ink-500">
            {[fecha(item.transcribed_at), duracion(item.duration_seconds)].filter(Boolean).join(' · ')}
          </span>
        </button>

        <span className="hidden w-[120px] shrink-0 truncate text-meta text-ink-500 md:block">
          {quien(item.user_email)}
        </span>

        <span className="w-[150px] shrink-0">
          {estado === 'TOMADO' && <span className="chip-verified">Caso tomado</span>}
          {estado === 'DECLINADO' && (
            <>
              <span className="chip-neutral">Declinado</span>
              {item.decision_motivo && (
                <span className="mt-0.5 block truncate text-[11px] text-ink-400">
                  {item.decision_motivo}
                </span>
              )}
            </>
          )}
          {estado === 'SIN_DECIDIR' && (
            <>
              <span className="chip-unverified">Sin decidir</span>
              {/* Los días que la persona lleva esperando: el dato que empuja. */}
              {dias > 0 && (
                <span className="mt-0.5 block font-mono text-[11px] text-unverified">
                  {dias} {dias === 1 ? 'día' : 'días'}
                </span>
              )}
            </>
          )}
        </span>

        <span className="relative w-[28px] shrink-0">
          <button
            onClick={() => setMenuAbierto(menuAbierto === item.id ? null : item.id)}
            aria-label="Acciones"
            className="flex h-[26px] w-[26px] items-center justify-center rounded-control text-ink-400 hover:bg-canvas hover:text-ink-900"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuAbierto === item.id && (
            <>
              <span className="fixed inset-0 z-30" onClick={() => setMenuAbierto(null)} />
              <span className="surface-raised absolute right-0 top-full z-40 mt-1 flex w-[200px] flex-col overflow-hidden py-1">
                <button
                  onClick={() => {
                    setMenuAbierto(null);
                    onOpen(item);
                  }}
                  className="px-3 py-1.5 text-left text-ui text-ink-900 hover:bg-canvas"
                >
                  Abrir
                </button>

                {estado === 'SIN_DECIDIR' && (
                  <>
                    <button
                      onClick={() => {
                        setMenuAbierto(null);
                        void decidir(item, 'TOMADO');
                      }}
                      className="px-3 py-1.5 text-left text-ui text-ink-900 hover:bg-canvas"
                    >
                      Tomar el caso
                    </button>
                    <button
                      onClick={() => {
                        setMenuAbierto(null);
                        setPorDeclinar(item);
                      }}
                      className="px-3 py-1.5 text-left text-ui text-ink-900 hover:bg-canvas"
                    >
                      Declinar…
                    </button>
                  </>
                )}

                {estado !== 'SIN_DECIDIR' && (
                  <button
                    onClick={() => {
                      setMenuAbierto(null);
                      void decidir(item, 'SIN_DECIDIR');
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-left text-ui text-ink-900 hover:bg-canvas"
                  >
                    <Undo2 className="h-3.5 w-3.5 text-ink-400" />
                    Reabrir la decisión
                  </button>
                )}

                <button
                  onClick={() => {
                    setMenuAbierto(null);
                    setPorEliminar(item);
                  }}
                  className="flex items-center gap-2 border-t border-line-100 px-3 py-1.5 text-left text-ui text-danger hover:bg-canvas"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar
                </button>
              </span>
            </>
          )}
        </span>
      </div>
    );
  };

  const motivoFinal = motivo === 'Otro' ? motivoOtro.trim() : motivo;

  return (
    <div className="rounded-card border border-line-200 bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line-100 px-4 py-3">
        <div>
          <h4 className="text-ui font-semibold text-ink-900">Entrevistas de la firma</h4>
          <p className="text-meta text-ink-500">
            {items.length} {items.length === 1 ? 'entrevista' : 'entrevistas'}
            {todasSinDecidir.length > 0 && (
              <>
                {' · '}
                <span className="font-medium text-unverified">
                  {todasSinDecidir.length} sin decidir
                </span>
              </>
            )}
          </p>
        </div>

        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Por nombre, quién la atendió o lo que contó"
            className="field w-[260px] max-w-full pl-8"
          />
        </div>

        <button onClick={onRefresh} className="btn-neutral btn-sm" title="Actualizar la lista">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ─── LAS CUATRO CIFRAS DE GESTIÓN ──────────────────────────────────── */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-px border-b border-line-100 bg-line-100 sm:grid-cols-4">
          <div className="bg-surface px-4 py-2.5">
            <p className="font-mono text-[18px] font-semibold text-ink-900">{todasSinDecidir.length}</p>
            <p className="text-meta text-ink-500">
              Sin decidir
              {masAntigua > 0 && ` · la más antigua, ${masAntigua} ${masAntigua === 1 ? 'día' : 'días'}`}
            </p>
          </div>
          <div className="bg-surface px-4 py-2.5">
            <p className="font-mono text-[18px] font-semibold text-ink-900">{tomadas}</p>
            <p className="text-meta text-ink-500">Casos tomados</p>
          </div>
          <div className="bg-surface px-4 py-2.5">
            <p className="font-mono text-[18px] font-semibold text-ink-900">{declinadas}</p>
            <p className="text-meta text-ink-500">Declinados · con motivo registrado</p>
          </div>
          <div className="bg-surface px-4 py-2.5">
            <p className="font-mono text-[18px] font-semibold text-ink-900">
              {duracionMedia > 0 ? `${duracionMedia} min` : '—'}
            </p>
            <p className="text-meta text-ink-500">Duración media</p>
          </div>
        </div>
      )}

      {errorDecision && <p className="notice-unverified mx-4 mt-3">{errorDecision}</p>}

      {items.length === 0 && !isLoading && (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <UserRound className="h-7 w-7 text-ink-400" />
          <p className="text-ui text-ink-900">Aún no hay entrevistas guardadas.</p>
          <p className="max-w-sm text-meta text-ink-500">
            Grabe la conversación con el cliente: se transcribe, se revisa, y termina en una
            decisión — tomar el caso o declinarlo con motivo.
          </p>
        </div>
      )}

      {visibles.length === 0 && items.length > 0 && (
        <p className="px-4 py-6 text-center text-meta text-ink-500">
          Ninguna coincide con esa búsqueda.
        </p>
      )}

      {sinDecidir.length > 0 && (
        <>
          <p className="t-head flex items-center gap-2">
            Esperan decisión · {sinDecidir.length}
            <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-ink-400">
              — al frente hay una persona esperando respuesta
            </span>
          </p>
          {sinDecidir.map((i) => (
            <Fila key={i.id} item={i} />
          ))}
        </>
      )}

      {decididas.length > 0 && (
        <>
          <p className="t-head">Decididas · {decididas.length}</p>
          {decididas.map((i) => (
            <Fila key={i.id} item={i} />
          ))}
        </>
      )}

      {items.length > 0 && (
        <p className="border-t border-line-100 px-4 py-2.5 text-meta text-ink-500">
          Declinar también se registra, con su motivo en una línea: la firma necesita saber qué
          está rechazando, y el consultante merece una respuesta.
        </p>
      )}

      {/* ─── DECLINAR · el motivo es obligatorio ───────────────────────────── */}
      <Dialog
        abierto={Boolean(porDeclinar)}
        onCerrar={cerrarDeclinar}
        tamano="S"
        titulo="Declinar el caso"
        subtitulo={porDeclinar ? nombreLegible(porDeclinar.title) : undefined}
        acciones={
          <>
            <button onClick={cerrarDeclinar} className="btn-neutral btn-sm">
              Cancelar
            </button>
            <button
              onClick={() => {
                if (porDeclinar && motivoFinal) {
                  void decidir(porDeclinar, 'DECLINADO', motivoFinal);
                  cerrarDeclinar();
                }
              }}
              className="btn-primary btn-sm"
              disabled={!motivoFinal}
            >
              Declinar
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-1.5">
          {MOTIVOS.map((m) => (
            <label key={m} className="flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 hover:bg-canvas">
              <input
                type="radio"
                name="motivo"
                checked={motivo === m}
                onChange={() => setMotivo(m)}
              />
              <span className="text-ui text-ink-900">{m}</span>
            </label>
          ))}

          {motivo === 'Otro' && (
            <input
              value={motivoOtro}
              onChange={(e) => setMotivoOtro(e.target.value)}
              placeholder="El motivo, en una línea"
              autoFocus
              className="field mt-1"
            />
          )}

          {/*
            El riesgo profesional real: un término que venció mientras el
            consultante esperaba respuesta. Ahí conviene dejar constancia.
          */}
          {motivo === 'Término vencido' && (
            <p className="notice mt-1">
              Si el motivo es un término vencido, conviene decírselo al consultante por escrito y
              conservar constancia.
            </p>
          )}
        </div>
      </Dialog>

      <Dialog
        abierto={Boolean(porEliminar)}
        onCerrar={() => setPorEliminar(null)}
        tamano="S"
        titulo="¿Eliminar esta entrevista?"
        acciones={
          <>
            <button onClick={() => setPorEliminar(null)} className="btn-neutral btn-sm">
              Conservar
            </button>
            <button
              onClick={() => {
                if (porEliminar) onDelete(porEliminar.id);
                setPorEliminar(null);
              }}
              className="btn-danger btn-sm"
            >
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-ui text-ink-900">
          «{porEliminar ? nombreLegible(porEliminar.title) : ''}» se borra para toda la firma, con
          su decisión y su motivo. No se puede recuperar.
        </p>
      </Dialog>
    </div>
  );
};
