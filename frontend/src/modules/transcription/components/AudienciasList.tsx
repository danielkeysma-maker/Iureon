import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileAudio, Lock, MoreHorizontal, RefreshCw, Search, Trash2, Undo2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { textoDe, type StoredTranscription } from '../services/transcription.api';

/**
 * La lista de audiencias. Se ordena por lo que FALTA REVISAR, no por fecha.
 *
 * LA REGLA QUE ORGANIZA LA PANTALLA: una transcripción no es un acta hasta que
 * un humano la lee. Las pendientes van arriba con su trama; las revisadas
 * debajo, con quién las aprobó. Y «Acta lista» solo lo da una persona — no hay
 * ningún camino automático hacia ese estado, ni aquí ni en el servidor.
 *
 * LO QUE ESTA LISTA NO MUESTRA del diseño 11a, y por qué: la fracción exacta
 * de revisión (32/58) y los «fragmentos poco claros» exigen marcar cada
 * intervención como revisada y cada tramo con su confianza — la tubería no
 * hace ninguna de las dos. Mostrar «32/58» sin contarlo sería inventar
 * progreso sobre un acta judicial. Cuando exista el marcado por intervención,
 * la columna se agrega con datos de verdad.
 */

interface AudienciasListProps {
  items: StoredTranscription[];
  isLoading: boolean;
  onOpen: (item: StoredTranscription) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  /** Da o quita «Acta lista». El servidor registra quién y cuándo. */
  onMarcarRevision: (id: string, estado: 'POR_REVISAR' | 'ACTA_LISTA') => void;
}

const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

const duracion = (segundos: number | null): string => {
  if (!segundos) return '';
  const m = Math.round(segundos / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

const nombreLegible = (title: string): string => title.replace(/^\d{10,}_/, '');

/** El nombre antes de la arroba: en la fila importa la persona, no el dominio. */
const quien = (email?: string): string => (email ? email.split('@')[0] : '');

export const AudienciasList: React.FC<AudienciasListProps> = ({
  items,
  isLoading,
  onOpen,
  onDelete,
  onRefresh,
  onMarcarRevision
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [porEliminar, setPorEliminar] = useState<StoredTranscription | null>(null);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    // Por el nombre y por LO QUE SE DIJO: el abogado recuerda la frase, no el archivo.
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        textoDe(i).toLowerCase().includes(q) ||
        quien(i.user_email).toLowerCase().includes(q)
    );
  }, [items, busqueda]);

  const pendientes = visibles.filter((i) => i.estado_revision !== 'ACTA_LISTA');
  const revisadas = visibles.filter((i) => i.estado_revision === 'ACTA_LISTA');

  const Fila: React.FC<{ item: StoredTranscription; lista: boolean }> = ({ item, lista }) => (
    <div className="t-row flex items-center gap-3">
      <button onClick={() => onOpen(item)} className="min-w-0 flex-1 text-left" title="Abrir y revisar">
        <span className="block truncate text-ui text-ink-900">{nombreLegible(item.title)}</span>
        <span className="mt-0.5 block truncate font-mono text-[11px] text-ink-500">
          {[fecha(item.transcribed_at), duracion(item.duration_seconds)].filter(Boolean).join(' · ')}
        </span>
      </button>

      {/* Las voces, como número. Los cuadrados de color viven en el detalle. */}
      <span className="w-[52px] shrink-0 text-center font-mono text-[12px] text-ink-700">
        {item.speaker_labels.length} {item.speaker_labels.length === 1 ? 'voz' : 'voces'}
      </span>

      {/*
        LA FRACCIÓN EXACTA (32/58), contada de las marcas de revisión reales —
        la única cifra accionable de la pantalla: dice cuánto trabajo humano
        queda antes de que esto sea un acta.
      */}
      <span className="w-[64px] shrink-0 text-center">
        {(() => {
          const total = item.segments.length;
          const revisadas = item.segments.filter((seg) => seg.revisada).length;
          return (
            <span
              className={`font-mono text-[12px] ${
                total > 0 && revisadas === total ? 'text-verified' : 'text-ink-700'
              }`}
              title={`${revisadas} de ${total} intervenciones revisadas`}
            >
              {revisadas}/{total}
            </span>
          );
        })()}
      </span>

      <span className="hidden w-[130px] shrink-0 truncate text-meta text-ink-500 md:block">
        {quien(item.user_email)}
      </span>

      <span className="w-[110px] shrink-0">
        {lista ? (
          <span className="chip-verified" title={item.revisada_por ? `Revisada por ${quien(item.revisada_por)}` : undefined}>
            Acta lista
          </span>
        ) : (
          <span className="chip-unverified">Por revisar</span>
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
            <span className="surface-raised absolute right-0 top-full z-40 mt-1 flex w-[190px] flex-col overflow-hidden py-1">
              <button
                onClick={() => {
                  setMenuAbierto(null);
                  onOpen(item);
                }}
                className="px-3 py-1.5 text-left text-ui text-ink-900 hover:bg-canvas"
              >
                Abrir y revisar
              </button>
              {lista ? (
                <button
                  onClick={() => {
                    setMenuAbierto(null);
                    onMarcarRevision(item.id, 'POR_REVISAR');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-left text-ui text-ink-900 hover:bg-canvas"
                >
                  <Undo2 className="h-3.5 w-3.5 text-ink-400" />
                  Volver a revisar
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMenuAbierto(null);
                    onMarcarRevision(item.id, 'ACTA_LISTA');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-left text-ui text-ink-900 hover:bg-canvas"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-ink-400" />
                  Marcar acta lista
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

  return (
    <div className="rounded-card border border-line-200 bg-surface">
      <div className="flex flex-wrap items-center gap-2 border-b border-line-100 px-4 py-3">
        <div>
          <h4 className="text-ui font-semibold text-ink-900">Audiencias de la firma</h4>
          <p className="text-meta text-ink-500">
            {items.length} {items.length === 1 ? 'audiencia' : 'audiencias'}
            {pendientes.length > 0 && (
              <>
                {' · '}
                <span className="font-medium text-unverified">
                  {pendientes.length} {pendientes.length === 1 ? 'pendiente' : 'pendientes'} de revisar
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
            placeholder="Por nombre, quién la subió o lo que se dijo"
            className="field w-[260px] max-w-full pl-8"
          />
        </div>

        <button onClick={onRefresh} className="btn-neutral btn-sm" title="Actualizar la lista">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {items.length === 0 && !isLoading && (
        <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
          <FileAudio className="h-7 w-7 text-ink-400" />
          <p className="text-ui text-ink-900">Aún no hay audiencias guardadas.</p>
          <p className="max-w-sm text-meta text-ink-500">
            Cuando el juzgado publique la grabación, súbala aquí: se transcribe, se revisa y se usa
            como fuente en la redacción.
          </p>
        </div>
      )}

      {visibles.length === 0 && items.length > 0 && (
        <p className="px-4 py-6 text-center text-meta text-ink-500">
          Ninguna coincide con esa búsqueda.
        </p>
      )}

      {pendientes.length > 0 && (
        <>
          <p className="t-head flex items-center gap-2">
            Pendientes de revisar · {pendientes.length}
            <span className="font-sans text-[11px] font-normal normal-case tracking-normal text-ink-400">
              — la transcripción no es acta hasta que un humano la lee
            </span>
          </p>
          {pendientes.map((i) => (
            <Fila key={i.id} item={i} lista={false} />
          ))}
        </>
      )}

      {revisadas.length > 0 && (
        <>
          <p className="t-head">Revisadas · {revisadas.length}</p>
          {revisadas.map((i) => (
            <Fila key={i.id} item={i} lista />
          ))}
        </>
      )}

      {/*
        LA REGLA, ESCRITA DONDE SE TRABAJA. «Acta lista» solo lo da una
        persona; mientras tanto, lo que se cite de aquí es material por
        verificar.
      */}
      {items.length > 0 && (
        <p className="flex items-start gap-2 border-t border-line-100 px-4 py-2.5 text-meta text-ink-500">
          <Lock className="mt-0.5 h-3 w-3 shrink-0 text-ink-400" />
          Una transcripción no es un acta. El estado «Acta lista» solo lo da una persona después de
          leerla, y queda registrado quién y cuándo.
        </p>
      )}

      <Dialog
        abierto={Boolean(porEliminar)}
        onCerrar={() => setPorEliminar(null)}
        tamano="S"
        titulo="¿Eliminar esta audiencia?"
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
          «{porEliminar ? nombreLegible(porEliminar.title) : ''}» se borra para toda la firma. La
          grabación no está guardada — solo existe este texto, y no se puede recuperar.
        </p>
      </Dialog>
    </div>
  );
};
