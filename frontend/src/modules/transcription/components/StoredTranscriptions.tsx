import React from 'react';
import { Clock, FileText, RefreshCw, Trash2 } from 'lucide-react';
import type { StoredTranscription } from '../services/transcription.api';

interface StoredTranscriptionsProps {
  items: StoredTranscription[];
  isLoading: boolean;
  onOpen: (item: StoredTranscription) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

/**
 * What the firm actually has stored, and the way to remove it.
 *
 * WHY THIS WAS MISSING AND WHY THAT MATTERED. Transcripts were saved server-side
 * the moment the provider answered — on purpose, so closing a tab could not lose
 * a two-hour hearing or force paying to transcribe it again — and NOTHING EVER
 * SHOWED THEM. The list endpoint existed from the first day and no client called
 * it. So a lawyer could not know their hearings were kept, could not reopen one,
 * and could not delete one.
 *
 * A user discovered it by being told, which is the wrong way to find out that
 * privileged material is being retained. For a firm that is not a nicety: they
 * are the data controller of their clients' matters and Iureon is the encargado,
 * so what is stored has to be visible to them and removable by them.
 */

const fecha = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const duracion = (segundos: number | null): string => {
  if (!segundos) return '';
  const minutos = Math.round(segundos / 60);
  return minutos < 60 ? `${minutos} min` : `${Math.floor(minutos / 60)} h ${minutos % 60} min`;
};

/** The uploader prefixes a timestamp; the lawyer named the file, not that. */
const nombreLegible = (title: string): string => title.replace(/^\d{10,}_/, '');

export const StoredTranscriptions: React.FC<StoredTranscriptionsProps> = ({
  items,
  isLoading,
  onOpen,
  onDelete,
  onRefresh
}) => {
  const [confirmando, setConfirmando] = React.useState<string | null>(null);

  return (
    <div className="bg-surface border border-line-200 rounded-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line-100">
        <div>
          <h4 className="font-bold text-ink-900 text-xs">Transcripciones guardadas</h4>
          <p className="text-[11px] text-ink-500">
            {items.length === 0
              ? 'Cada transcripción se guarda para que no pierdas el trabajo al cerrar la pestaña.'
              : `${items.length} ${items.length === 1 ? 'guardada' : 'guardadas'} · se conservan hasta que las borres`}
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-2.5 py-1 bg-canvas hover:bg-line-100 text-ink-700 border border-line-200 rounded-control text-[11px] font-semibold flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {isLoading && items.length === 0 ? (
        <p className="px-4 py-4 text-[11px] text-ink-500">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="px-4 py-4 text-[11px] text-ink-500">
          Todavía no hay ninguna guardada. La grabación en sí nunca se guarda: solo el texto.
        </p>
      ) : (
        <div className="divide-y divide-line-100 max-h-72 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="px-4 py-2.5 flex items-center gap-3">
              <FileText className="w-3.5 h-3.5 text-ink-400 shrink-0" />

              <button
                onClick={() => onOpen(item)}
                className="flex-1 min-w-0 text-left group"
                title="Abrir esta transcripción"
              >
                <p className="text-[11px] font-semibold text-ink-900 truncate group-hover:text-brand-700">
                  {nombreLegible(item.title)}
                </p>
                <p className="text-[10px] text-ink-500 flex items-center gap-2">
                  <Clock className="w-2.5 h-2.5" />
                  {fecha(item.transcribed_at)}
                  {item.duration_seconds ? ` · ${duracion(item.duration_seconds)}` : ''}
                  {` · ${item.segments?.length ?? 0} intervenciones`}
                </p>
              </button>

              {/*
                Confirmed in place rather than through window.confirm: a browser
                asked to stop showing dialogs silences those, and a delete button
                that appears to do nothing is how the cut feature was reported
                broken for hours.
              */}
              {confirmando === item.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-danger">¿Borrar?</span>
                  <button
                    onClick={() => {
                      onDelete(item.id);
                      setConfirmando(null);
                    }}
                    className="text-[10px] font-semibold text-danger hover:text-danger"
                  >
                    Sí, borrar
                  </button>
                  <button
                    onClick={() => setConfirmando(null)}
                    className="text-[10px] text-ink-500 hover:text-ink-700"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmando(item.id)}
                  className="text-ink-400 hover:text-danger shrink-0"
                  title="Borrar esta transcripción definitivamente"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
