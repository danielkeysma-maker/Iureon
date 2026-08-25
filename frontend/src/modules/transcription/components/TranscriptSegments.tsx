import React from 'react';
import { AlertTriangle, Scissors, UserCog } from 'lucide-react';
import { buildSpeakerNames } from '../speakerNames';
import {
  ROLE_LABELS,
  ROLE_OPTIONS,
  type SpeakerRole,
  type TranscriptionKind,
  type TranscriptionResult,
  type SpeakerNameProposal,
  type VoiceConflict
} from '../types';

interface TranscriptSegmentsProps {
  result: TranscriptionResult;
  kind: TranscriptionKind;
  onAssignRole: (speakerLabel: string, role: SpeakerRole) => void;
  /** Absent when the transcript could not be stored: there is nothing to save into. */
  onEditSegment?: (segmentIndex: number, text: string) => void;
  /** Cuts an intervention that holds two voices. Same storage requirement. */
  onSplitSegment?: (segmentIndex: number, charOffset: number, speakerLabel: string) => void;
  /**
   * Hands a whole intervention to another voice.
   *
   * Distinct from the cut on purpose: the cut solves two people inside one
   * intervention, this solves two people the engine filed under one label.
   */
  onReassignSpeaker?: (segmentIndex: number, speakerLabel: string) => void;
  /** Labels whose own words claim two different people. Server-computed. */
  voiceConflicts?: VoiceConflict[];
  /** The name each voice gave for itself, read out of the transcript. */
  nameProposals?: SpeakerNameProposal[];
  /** Sets who a voice is. An empty name clears it. */
  onAssignSpeakerName?: (speakerLabel: string, name: string) => void;
}

/**
 * Colour per speaker so a long hearing stays readable at a glance.
 *
 * Carried by an avatar rather than a tinted row. Six washed-out backgrounds
 * stacked down a two-hour transcript fought the text for attention and made the
 * page look like a spreadsheet; the same colour on a small initialled circle
 * identifies the voice just as fast and leaves the reading surface white, which
 * is what a document meant to be read for an hour has to be.
 */
const SPEAKER_COLORS = [
  'bg-blue-700',
  'bg-emerald-700',
  'bg-amber-600',
  'bg-purple-700',
  'bg-rose-700',
  'bg-cyan-700'
];

/**
 * The initials on the avatar, from the display name the reader already sees —
 * "Apoderado demandado" gives AD, "Juez" gives J. Never the diarization label:
 * an S over every circle identifies nobody.
 */
const initials = (name: string): string =>
  name
    .replace(/\s*\d+$/, '')
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || name.slice(0, 1).toUpperCase();

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
  onSplitSegment,
  onReassignSpeaker,
  voiceConflicts = [],
  nameProposals = [],
  onAssignSpeakerName
}) => {
  const colorFor = (speakerLabel: string): string =>
    SPEAKER_COLORS[
      Math.max(0, result.speakerLabels.indexOf(speakerLabel)) % SPEAKER_COLORS.length
    ];

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

  /**
   * What is typed in each name box before it is saved.
   *
   * Saved on blur or Enter rather than on every keystroke: a name is written in
   * one go, and a request per letter would fight the typing.
   */
  const [nameDrafts, setNameDrafts] = React.useState<Record<string, string>>({});

  const proposalFor = (label: string): SpeakerNameProposal | undefined =>
    nameProposals.find((p) => p.speakerLabel === label);

  const nameOf = (label: string): string =>
    result.segments.find((s) => s.speakerLabel === label)?.speakerName ?? '';

  const saveName = (label: string, value: string): void => {
    if (value.trim() === nameOf(label)) return;
    onAssignSpeakerName?.(label, value.trim());
  };

  /** The intervention showing the "put the caret in the text first" notice. */
  const [aviso, setAviso] = React.useState<number | null>(null);

  /** The cut in progress: which intervention, and where it is being cut. */
  const [cutting, setCutting] = React.useState<{ index: number; offset: number } | null>(null);

  /** The intervention whose voice is being changed. */
  const [moving, setMoving] = React.useState<number | null>(null);

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

        {/*
          One voice per row at this width.
          
          Two columns put a 32px avatar, a name and a select into 265px, and the
          name ran under the select — the panel that exists to say who is who was
          the one place a name could not be read. It splits into two columns only
          when there is genuinely room.
        */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
          {result.speakerLabels.map((label) => (
            <div key={label} className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full ${colorFor(label)} flex items-center justify-center shrink-0`}
                title={speakerNames[label]}
              >
                <span className="text-[10px] font-bold text-white tracking-tight">
                  {initials(speakerNames[label] ?? label)}
                </span>
              </div>
              {/*
                THE NAME, WHICH IS WHAT MAKES A TRANSCRIPT CITABLE.

                A role makes it readable — "el apoderado de la demandada
                manifestó" — but a filing quotes people. Teams shows names
                because everyone joins with an account; from audio alone the app
                has to be told. So it proposes what the voice said about ITSELF
                (see proposeSpeakerNames) and otherwise leaves the box empty for
                a lawyer who was in the room and simply knows.

                Never filled in automatically. A name this app invented would be
                a fabricated attribution in a document a judge may check against
                the recording.
              */}
              {onAssignSpeakerName ? (
                <input
                  value={nameDrafts[label] ?? nameOf(label)}
                  onChange={(e) => setNameDrafts({ ...nameDrafts, [label]: e.target.value })}
                  onBlur={(e) => saveName(label, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  placeholder={proposalFor(label)?.name ?? 'Nombre (opcional)'}
                  className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-900"
                  title={
                    proposalFor(label)
                      ? `Se presentó así: «${proposalFor(label)!.phrase}»`
                      : 'Escribe el nombre si lo sabes'
                  }
                />
              ) : (
                <span className="text-[11px] font-semibold text-slate-700 flex-1 min-w-0 truncate">
                  {speakerNames[label] ?? label}
                </span>
              )}

              <select
                value={roleOf(label)}
                onChange={(e) => onAssignRole(label, e.target.value as SpeakerRole)}
                className="w-44 shrink-0 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-blue-900"
              >
                {ROLE_OPTIONS[kind].map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>

            {/*
              The proposal offered rather than applied, with the phrase that
              produced it so the lawyer judges instead of trusting — the same
              contract every inference in this codebase works under.
            */}
            {onAssignSpeakerName && !nameOf(label) && proposalFor(label) && (
              <div className="flex items-start gap-2 pl-10">
                <p className="text-[10px] text-slate-500 flex-1">
                  Se presentó como{' '}
                  <span className="font-semibold text-slate-700">{proposalFor(label)!.name}</span>
                  {proposalFor(label)!.atSeconds !== null && (
                    <span className="font-mono text-slate-400">
                      {' '}
                      · {formatTimestamp(proposalFor(label)!.atSeconds)}
                    </span>
                  )}
                  <span className="text-slate-400"> — «{proposalFor(label)!.phrase}»</span>
                </p>
                <button
                  type="button"
                  onClick={() => onAssignSpeakerName(label, proposalFor(label)!.name)}
                  className="text-[10px] font-semibold text-blue-900 hover:underline shrink-0"
                >
                  Usar este nombre
                </button>
              </div>
            )}
            </div>
          ))}
        </div>
      </div>

      {/*
        One label, two people — said out loud, with the evidence.

        The engine merges voices it cannot tell apart, and this hearing's own
        text betrayed it: speaker_1 introduced himself as Tomás Wilches at 01:04
        and as José Omar Gaitán, opposing counsel, at 03:15. The lawyer had to
        catch that by reading. Now the app reads first, and shows the exact
        phrases and minutes so the human can move the intervention — or decide
        a name was simply misheard. It never separates anything by itself.
      */}
      {voiceConflicts.map((conflict) => (
        <div
          key={conflict.speakerLabel}
          className="bg-amber-50 border border-amber-300 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <h4 className="font-bold text-amber-900 text-xs">
              La voz {speakerNames[conflict.speakerLabel] ?? conflict.speakerLabel} parece contener a{' '}
              {conflict.identities.length} personas distintas
            </h4>
          </div>
          <ul className="space-y-1 mb-2">
            {conflict.identities.map((identity) => (
              <li key={`${identity.segmentIndex}-${identity.name}`} className="text-[11px] text-amber-900">
                <span className="font-semibold">{identity.name}</span>
                {identity.atSeconds !== null && (
                  <span className="font-mono text-amber-700"> · {formatTimestamp(identity.atSeconds)}</span>
                )}
                <span className="text-amber-800"> — «{identity.phrase}»</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-amber-800">
            Cada quien se presentó con su propio nombre. Busca la intervención que no corresponde y
            usa <span className="font-semibold">«Otra voz»</span> para dársela a la persona correcta,
            o corrige el nombre si la transcripción lo oyó mal. Si esta voz es un intérprete que
            habla por otras personas, asígnale el rol de Intérprete y este aviso se retira.
          </p>
        </div>
      ))}

      {/* Transcript */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100/80 overflow-hidden">
        {result.segments.map((segment, index) => (
          <div
            key={`${segment.speakerLabel}-${index}`}
            /*
              `group` so the editing controls can stay hidden until the reader
              actually goes near this intervention. They used to sit visible on
              every row, which put two buttons between the reader and every
              paragraph of a two-hour transcript — the page read like a form
              instead of like a record of what was said.
            */
            className="group flex gap-3 px-4 py-3 hover:bg-slate-50/70 transition-colors"
          >
            <div
              className={`w-8 h-8 rounded-full ${colorFor(segment.speakerLabel)} flex items-center justify-center shrink-0 mt-0.5`}
              title={speakerNames[segment.speakerLabel]}
            >
              <span className="text-[10px] font-bold text-white tracking-tight">
                {initials(speakerNames[segment.speakerLabel] ?? ROLE_LABELS[segment.role])}
              </span>
            </div>

            <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 min-h-[18px]">
              {/* The disambiguated name, not the bare role: with three
                  witnesses "Testigo" three times tells the reader nothing. */}
              <span className="text-xs font-bold text-slate-900">
                {speakerNames[segment.speakerLabel] ?? ROLE_LABELS[segment.role]}
              </span>

              {/*
                The procedural role beside the name, quieter than it.
                
                Both matter and they answer different questions. The name is who
                spoke, which is what a quotation needs; the role is what they
                were in the proceeding, which is what makes the quotation mean
                something — "Tomás Enrique Wilches Salsa dijo" is a person,
                "(Demandante)" is why a judge should care.
                
                Only when a name has been set. Without one the heading already IS
                the role, and "Juez (Juez)" says the same thing twice.
              */}
              {segment.speakerName && segment.role !== 'DESCONOCIDO' && (
                <span className="text-[11px] font-normal text-slate-500">
                  ({ROLE_LABELS[segment.role]})
                </span>
              )}

              {segment.startSeconds !== null && (
                <span className="text-[10px] font-mono text-slate-400">
                  {formatTimestamp(segment.startSeconds)}
                </span>
              )}
              {/*
                Cuts where the caret sits. Diarization cannot separate people
                who talk over each other — the judge greets counsel and counsel
                answers mid-sentence — so one block ends up holding two voices
                under one label, and no role assignment can fix that. Only a cut
                can.
              */}
              <span className="ml-auto flex items-center gap-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
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

              {/*
                Cambia la voz de TODA la intervención.

                Hace falta porque la diarización también junta a dos personas
                bajo una misma etiqueta en intervenciones distintas: en una
                audiencia real `speaker_1` se presentó como Tomás Wilches a los
                64 segundos y como José Omar Gaitán, apoderado de la otra parte,
                a los 195. Ni el rol ni el corte podían arreglarlo — el rol
                nombra la etiqueta, así que nombraba a los dos, y el corte se
                niega a dejar una mitad vacía, que es justo lo que pide mover
                una intervención entera.
              */}
              {onReassignSpeaker && (
                <button
                  type="button"
                  onClick={() => {
                    setMoving(moving === index ? null : index);
                    setCutting(null);
                    setAviso(null);
                  }}
                  className="text-[10px] font-semibold text-slate-400 hover:text-blue-900 flex items-center gap-1"
                  title="Esta intervención es de otra persona"
                >
                  <UserCog className="w-3 h-3" />
                  Otra voz
                </button>
              )}
              </span>
            </div>

            {/*
              Ancladas a la cabecera, junto al botón que las abre, y no debajo
              del texto.

              Debajo funcionaba con intervenciones cortas y rompía el corte por
              completo en las largas — que son justo las que hay que partir. Una
              intervención de tres mil caracteres ocupa la pantalla entera, así
              que el panel se abría cientos de píxeles más abajo, fuera de la
              vista: se pulsaba Dividir y no ocurría nada visible. El defecto no
              estaba en el corte sino en dónde aparecía la respuesta, y por eso
              se comportaba distinto según la grabación.
            */}
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
            {moving === index && (
              <div className="mt-2 flex flex-wrap items-center gap-2 bg-blue-50/70 border border-blue-200 rounded-lg p-2">
                <span className="text-[11px] text-slate-700">Esta intervención la dice:</span>

                <select
                  defaultValue=""
                  onChange={(e) => {
                    onReassignSpeaker?.(index, e.target.value);
                    setMoving(null);
                  }}
                  className="bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-blue-900"
                >
                  <option value="" disabled>
                    Elige quién…
                  </option>
                  {result.speakerLabels
                    // La suya no se ofrece: elegirla no cambia nada y sugiere
                    // que sí.
                    .filter((label) => label !== segment.speakerLabel)
                    .map((label) => (
                      <option key={label} value={label}>
                        {speakerNames[label] ?? label}
                      </option>
                    ))}
                  <option value="__nueva__">Otra persona (voz nueva)</option>
                </select>

                <button
                  type="button"
                  onClick={() => setMoving(null)}
                  className="text-[11px] text-slate-500 hover:text-slate-700"
                >
                  Cancelar
                </button>
              </div>
            )}

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
              /*
                Reading size, not form size. This was text-xs — 12px — for a
                document a lawyer reads for an hour and quotes in a filing. The
                controls around it can stay small; the words cannot.
              */
              className={`text-[13px] text-slate-700 leading-[1.65] ${
                onEditSegment
                  ? 'outline-none focus:bg-amber-50/60 focus:ring-1 focus:ring-amber-300 rounded px-1 -mx-1 cursor-text'
                  : ''
              }`}
              title={onEditSegment ? 'Haz clic para corregir el texto' : undefined}
            >
              {segment.text}
            </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
