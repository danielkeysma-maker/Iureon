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
   * Where the caret sits, and which intervention it sits in.
   *
   * Tracked as the lawyer moves it rather than read when Dividir is pressed,
   * because `window.getSelection()` is global: it answers "where is the caret in
   * the document", not "where is the caret in this paragraph". Reading it from
   * the button meant pressing Dividir on the judge while the caret rested in the
   * defence's intervention cut the judge at the defence's offset — silently, at
   * a position nobody chose.
   */
  const [caret, setCaret] = React.useState<{ index: number; offset: number } | null>(null);

  /** The intervention showing the "put the caret in the text first" notice. */
  const [aviso, setAviso] = React.useState<number | null>(null);

  /** The cut in progress: which intervention, and where it is being cut. */
  const [cutting, setCutting] = React.useState<{ index: number; offset: number } | null>(null);

  /**
   * The caret's offset within a paragraph, or null when the caret is elsewhere.
   *
   * Measured by selecting from the start of the paragraph up to the caret and
   * counting that text, rather than trusting `anchorOffset`. The two agree only
   * while the paragraph holds a single text node, and it does not: editing a
   * transcript in place splits it into several, and from then on `anchorOffset`
   * counts from the start of whichever fragment was clicked.
   */
  const offsetEnParrafo = (parrafo: HTMLElement): number | null => {
    const seleccion = window.getSelection();
    if (!seleccion || seleccion.rangeCount === 0) return null;

    const rango = seleccion.getRangeAt(0);
    if (!parrafo.contains(rango.startContainer)) return null;

    const hastaElCursor = rango.cloneRange();
    hastaElCursor.selectNodeContents(parrafo);
    hastaElCursor.setEnd(rango.startContainer, rango.startOffset);

    return hastaElCursor.toString().length;
  };

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
              {onSplitSegment &&
                (() => {
                  // Armed only when the caret is inside THIS intervention and
                  // leaves text on both sides. Shown in the button itself so the
                  // lawyer can see the cut is ready before pressing, instead of
                  // pressing and being told afterwards.
                  const armado =
                    caret !== null &&
                    caret.index === index &&
                    caret.offset > 0 &&
                    caret.offset < segment.text.length;

                  return (
                    <button
                      type="button"
                      onClick={() => {
                        if (!armado) {
                          // Told in the page, not through window.alert: a browser
                          // that has been asked to stop showing dialogs silences
                          // alert() outright, and the guard then failed with no
                          // sign at all — Dividir simply did nothing.
                          setAviso(index);
                          setCutting(null);
                          return;
                        }

                        setAviso(null);
                        setCutting({ index, offset: caret.offset });
                      }}
                      className={`text-[10px] font-semibold flex items-center gap-1 ${
                        armado ? 'text-blue-900' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title={
                        armado
                          ? 'Corta aquí, donde tienes el cursor'
                          : 'Haz clic dentro del texto, donde empieza a hablar la otra persona'
                      }
                    >
                      <Scissors className="w-3 h-3" />
                      Dividir
                    </button>
                  );
                })()}

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
              /*
                The caret is reported as it moves, not read when Dividir is
                pressed. Mouse and keyboard both, because a lawyer proof-reading
                a transcript arrives at the cut point either way.

                Not cleared on blur on purpose: pressing Dividir blurs this
                paragraph, and clearing here would throw away the very position
                the button is about to use.
              */
              onMouseUp={(e) => {
                const offset = offsetEnParrafo(e.currentTarget);
                if (offset === null) return;
                setCaret({ index, offset });
                setAviso(null);
              }}
              onKeyUp={(e) => {
                const offset = offsetEnParrafo(e.currentTarget);
                if (offset === null) return;
                setCaret({ index, offset });
                setAviso(null);
              }}
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
              The guidance that used to be a window.alert. A browser asked to
              stop showing dialogs silences alert() for the rest of the session,
              and the check then failed invisibly: Dividir did nothing at all,
              with no way to tell a refused cut from a broken button.
            */}
            {aviso === index && (
              <p className="mt-2 text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-2">
                Haz clic dentro del texto, justo donde empieza a hablar la otra persona, y vuelve a
                pulsar Dividir.
              </p>
            )}

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
                    // A cut shifts every index after it, so the remembered
                    // position no longer means what it did.
                    setCaret(null);
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
