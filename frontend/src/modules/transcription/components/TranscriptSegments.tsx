import React from 'react';
import { Scissors, User } from 'lucide-react';
import { buildSpeakerNames } from '../speakerNames';
import {
  ROLE_LABELS,
  ROLE_OPTIONS,
  type SpeakerRole,
  type TranscriptionKind,
  type TranscriptionResult
} from '../types';

interface TranscriptSegmentsProps {
  result: TranscriptionResult;
  kind: TranscriptionKind;
  onAssignRole: (speakerLabel: string, role: SpeakerRole) => void;
  /** Absent when the transcript could not be stored: there is nothing to save into. */
  onEditSegment?: (segmentIndex: number, text: string) => void;
  /** Cuts an intervention that holds two voices. Same storage requirement. */
  onSplitSegment?: (segmentIndex: number, charOffset: number, speakerLabel: string) => void;
}

/** Colour per speaker so a long hearing stays readable at a glance. */
const SPEAKER_STYLES = [
  'border-l-blue-700 bg-blue-50/40',
  'border-l-emerald-700 bg-emerald-50/40',
  'border-l-amber-700 bg-amber-50/40',
  'border-l-purple-700 bg-purple-50/40',
  'border-l-rose-700 bg-rose-50/40',
  'border-l-cyan-700 bg-cyan-50/40'
];

const formatTimestamp = (seconds: number | null): string => {
  if (seconds === null) return '';

  const total = Math.floor(seconds);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');

  return `${mm}:${ss}`;
};

/**
 * The transcript itself, plus the control that maps each diarized speaker to a
 * procedural role.
 *
 * The mapping is the step that makes a transcript citable: "speaker_1 dijo" is
 * useless in a filing, "el Juez dijo" is not.
 */
export const TranscriptSegments: React.FC<TranscriptSegmentsProps> = ({
  result,
  kind,
  onAssignRole,
  onEditSegment,
  onSplitSegment
}) => {
  const styleFor = (speakerLabel: string): string =>
    SPEAKER_STYLES[result.speakerLabels.indexOf(speakerLabel) % SPEAKER_STYLES.length];

  const roleOf = (speakerLabel: string): SpeakerRole =>
    result.segments.find((s) => s.speakerLabel === speakerLabel)?.role ?? 'DESCONOCIDO';

  // Shared with the copied text so the screen and the clipboard never disagree
  // about who said what.
  const speakerNames = buildSpeakerNames(result.segments, ROLE_LABELS);

  /**
   * The cut in progress: which intervention, and where the caret was.
   *
   * The offset is captured when Dividir is pressed, before the selector below
   * takes focus and destroys the selection — reading it later would always give
   * zero.
   */
  const [cutting, setCutting] = React.useState<{ index: number; offset: number } | null>(null);

  return (
    <div className="space-y-4">
      {/* Speaker role assignment */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h4 className="font-bold text-slate-900 text-xs mb-1">Identifica a los interlocutores</h4>
        <p className="text-[11px] text-slate-500 mb-3">
          El motor detectó {result.speakerLabels.length} voces distintas pero no sabe quién es
          quién. Asigna el rol procesal de cada una.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {result.speakerLabels.map((label) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg border-l-4 ${styleFor(label)} flex items-center justify-center shrink-0`}
              >
                <User className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <span className="text-[11px] font-mono text-slate-500 w-20 shrink-0" title={speakerNames[label]}>
                {label}
              </span>
              <select
                value={roleOf(label)}
                onChange={(e) => onAssignRole(label, e.target.value as SpeakerRole)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-blue-900"
              >
                {ROLE_OPTIONS[kind].map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Transcript */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {result.segments.map((segment, index) => (
          <div
            key={`${segment.speakerLabel}-${index}`}
            className={`border-l-4 ${styleFor(segment.speakerLabel)} p-3`}
          >
            <div className="flex items-center gap-2 mb-1">
              {/* The disambiguated name, not the bare role: with three
                  witnesses "Testigo" three times tells the reader nothing. */}
              <span className="text-[11px] font-bold text-slate-800">
                {speakerNames[segment.speakerLabel] ?? ROLE_LABELS[segment.role]}
              </span>
              {segment.role === 'DESCONOCIDO' && (
                <span className="text-[10px] font-mono text-slate-400">{segment.speakerLabel}</span>
              )}
              {/*
                Cuts where the caret sits. Diarization cannot separate people
                who talk over each other — the judge greets counsel and counsel
                answers mid-sentence — so one block ends up holding two voices
                under one label, and no role assignment can fix that. Only a cut
                can.
              */}
              {onSplitSegment && (
                <button
                  type="button"
                  onClick={() => {
                    const seleccion = window.getSelection();
                    const offset = seleccion?.anchorOffset ?? 0;

                    if (offset <= 0 || offset >= segment.text.length) {
                      window.alert(
                        'Haz clic dentro del texto, justo donde empieza a hablar la otra persona, y vuelve a pulsar Dividir.'
                      );
                      return;
                    }

                    setCutting({ index, offset });
                  }}
                  className="text-[10px] font-semibold text-slate-500 hover:text-blue-900 flex items-center gap-1"
                  title="Separa esta intervención en dos, desde donde tengas el cursor"
                >
                  <Scissors className="w-3 h-3" />
                  Dividir
                </button>
              )}

              {segment.startSeconds !== null && (
                <span className="text-[10px] font-mono text-slate-400 ml-auto">
                  {formatTimestamp(segment.startSeconds)}
                </span>
              )}
            </div>
            {/*
              Editable in place. A transcript is a draft until a lawyer reads
              it: the model wrote "desembarco" for DESEMBARGO and "con
              recámaras" for CONFECÁMARAS — fluent, plausible, and wrong in a
              way only someone who knows the field catches. Corrections have to
              happen where the mistake is read.

              Saved when the field loses focus, so nothing is lost by clicking
              away, and only when the text actually changed.
            */}
            <p
              contentEditable={Boolean(onEditSegment)}
              suppressContentEditableWarning
              onBlur={(e) => {
                const nuevo = e.currentTarget.textContent ?? '';
                if (onEditSegment && nuevo.trim() && nuevo !== segment.text) {
                  onEditSegment(index, nuevo.trim());
                }
              }}
              className={`text-xs text-slate-700 leading-relaxed ${
                onEditSegment
                  ? 'outline-none focus:bg-amber-50/60 focus:ring-1 focus:ring-amber-300 rounded px-1 -mx-1 cursor-text'
                  : ''
              }`}
              title={onEditSegment ? 'Haz clic para corregir el texto' : undefined}
            >
              {segment.text}
            </p>

            {/*
              Whose the cut half is, asked rather than assumed. Always creating a
              new voice produced a visible bug: cutting an interruption out of
              the judge's turn left her second half as a separate voice, and once
              it was marked JUEZ the transcript read "Juez 1" and "Juez 2" for one
              person. Handing the tail back to somebody already in the room is the
              common case — most often whoever was interrupted.
            */}
            {cutting?.index === index && (
              <div className="mt-2 flex flex-wrap items-center gap-2 bg-amber-50/70 border border-amber-200 rounded-lg p-2">
                <span className="text-[11px] text-slate-700">Lo que sigue lo dice:</span>

                <select
                  defaultValue=""
                  onChange={(e) => {
                    const destino = e.target.value || `speaker_${result.speakerLabels.length}`;
                    onSplitSegment?.(cutting.index, cutting.offset, destino);
                    setCutting(null);
                  }}
                  className="bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-blue-900"
                >
                  <option value="" disabled>
                    Elige quién…
                  </option>
                  {result.speakerLabels.map((label) => (
                    <option key={label} value={label}>
                      {speakerNames[label] ?? label}
                    </option>
                  ))}
                  <option value="__nueva__">Otra persona (voz nueva)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setCutting(null)}
                  className="text-[11px] text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
