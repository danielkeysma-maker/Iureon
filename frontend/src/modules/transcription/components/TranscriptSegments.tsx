import React from 'react';
import { CheckCircle2, AlertTriangle, Check, Scissors, Star, UserCog } from 'lucide-react';
import { buildSpeakerNames } from '../speakerNames';
import { ControlDeLetra, useTamanoDeLetra } from '../../../design/TamanoDeLetra';
import { colorForSpeaker } from '../speakerColors';

import {
  ROLE_LABELS,
  ROLE_OPTIONS,
  type SpeakerRole,
  type TranscriptionKind,
  type TranscriptionResult,
  type TranscriptSegment,
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
  /** Marca una intervención como leída por un humano. La fracción hace el acta. */
  onMarcarRevisada?: (segmentIndex: number, revisada: boolean) => void;
  /**
   * Marca una intervención como DECISIVA. Artboard 2a, «Marcar como hecho
   * clave».
   *
   * Distinta de la de revisión, y la diferencia importa: revisada dice «la leí
   * y está bien transcrita», hecho clave dice «esto decide el caso». Se puede
   * revisar una frase intrascendente y se puede marcar como clave una que
   * todavía haya que corregir.
   */
  onMarcarHechoClave?: (segmentIndex: number, hechoClave: boolean) => void;
  /** Labels whose own words claim two different people. Server-computed. */
  voiceConflicts?: VoiceConflict[];
  /** The name each voice gave for itself, read out of the transcript. */
  nameProposals?: SpeakerNameProposal[];
  /** Sets who a voice is. An empty name clears it. */
  onAssignSpeakerName?: (speakerLabel: string, name: string) => void;
}

/*
 * The palette moved to ../speakerColors so the exports use the same one.
 * A document that comes out in black and white throws away the identification
 * the screen just made, in the artefact that gets read most carefully.
 */

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
/**
 * Parte el texto de una intervención en trozos, subrayando los dudosos.
 *
 * Devuelve el texto tal cual cuando no hay ninguno, que es el caso normal: sin
 * esa salida temprana, cada intervención fiable pagaría un recorrido y un
 * arreglo de nodos por nada.
 */
const partirPorDudosos = (segment: TranscriptSegment): React.ReactNode => {
  const dudosos = [...(segment.fragmentosDudosos ?? [])].sort((a, b) => a.desde - b.desde);
  if (dudosos.length === 0) return segment.text;

  const piezas: React.ReactNode[] = [];
  let cursor = 0;

  dudosos.forEach((f, i) => {
    /* Un fragmento que empieza antes del cursor solaparía: se salta entero. */
    if (f.desde < cursor) return;

    if (f.desde > cursor) piezas.push(segment.text.slice(cursor, f.desde));

    piezas.push(
      <span
        key={`dudoso-${i}`}
        className="underline decoration-[rgb(var(--unverified-line))] decoration-dotted decoration-2 underline-offset-4"
        title={`El motor entendió esto con ${Math.round(f.confianza * 100)}% de certeza: vuelva a escuchar antes de citarlo.`}
      >
        {segment.text.slice(f.desde, f.hasta)}
      </span>
    );
    cursor = f.hasta;
  });

  if (cursor < segment.text.length) piezas.push(segment.text.slice(cursor));
  return piezas;
};

export const TranscriptSegments: React.FC<TranscriptSegmentsProps> = ({
  result,
  kind,
  onAssignRole,
  onEditSegment,
  onSplitSegment,
  onReassignSpeaker,
  onMarcarRevisada,
  onMarcarHechoClave,
  voiceConflicts = [],
  nameProposals = [],
  onAssignSpeakerName
}) => {
  const colorFor = (speakerLabel: string): string =>
    colorForSpeaker(speakerLabel, result.speakerLabels).className;

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
  /** Tamaño de lectura del transcrito, por pantalla: una audiencia se lee una hora seguida. */
  const letra = useTamanoDeLetra(kind === 'AUDIENCIA' ? 'audiencia' : 'entrevista');

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

  /**
   * Which intervention is being corrected, and which one just saved.
   *
   * The correction always persisted on blur and NOTHING SAID SO. A lawyer
   * fixing "desembarco" had no way to know whether clicking away had kept it,
   * and asked outright how to save — which is the answer: an invisible save is
   * indistinguishable from no save at all, and in a transcript that gets quoted
   * the doubt is worse than the typo.
   */
  const [editing, setEditing] = React.useState<number | null>(null);
  const [justSaved, setJustSaved] = React.useState<number | null>(null);

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

  /*
   * LA REVISION, QUE ES LO QUE SEPARA UNA TRANSCRIPCION DE UN ACTA (1g).
   *
   * El dato existia —`revisada` por segmento, con su endpoint y su reversion si
   * el servidor no pudo— y no habia panel que lo mostrara: se podia marcar una
   * fila y no saber cuantas llevaba. La fraccion es lo que le dice al abogado
   * si el acta esta lista para firmarse.
   */
  const revisadas = result.segments.filter((s) => s.revisada).length;

  /*
   * FRAGMENTOS CON AUDIO POCO CLARO. El umbral es 0.75 y es una eleccion, no un
   * hallazgo: por debajo de ahi Deepgram se equivoca lo bastante como para que
   * citar sin volver a escuchar sea imprudente. Se cuentan solo los que TIENEN
   * medida — un transcrito anterior a esta columna no trae confianza, y
   * advertirlo seria inventarle un problema.
   */
  const UMBRAL_CONFIANZA = 0.75;
  const pocoClaras = result.segments.filter(
    (s) => s.confianza !== undefined && s.confianza < UMBRAL_CONFIANZA
  ).length;

  return (
    <div className="space-y-4">
      {/* Speaker role assignment */}
      <div className="bg-surface border border-line-200 rounded-card p-4">
        {/*
          LA REVISION VA ARRIBA DEL TODO, como en 1g: es el estado del acta, y
          quien abre esta pantalla lo primero que quiere saber es cuanto le
          falta. Los «fragmentos con audio poco claro» van al lado porque son lo
          que hara que la revision tarde.
        */}
        <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-line-100 pb-3">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Revisión
          </span>
          <span className="text-[12.5px] text-ink-900">
            <b className="font-mono font-semibold">{revisadas}</b> de{' '}
            <b className="font-mono font-semibold">{result.segments.length}</b> intervenciones
            revisadas
          </span>
          {pocoClaras > 0 && (
            <span className="text-[12px] text-unverified">
              · {pocoClaras}{' '}
              {pocoClaras === 1
                ? 'fragmento con audio poco claro'
                : 'fragmentos con audio poco claro'}
            </span>
          )}
          <ControlDeLetra letra={letra} className="ml-auto" />
        </div>

        <h4 className="mb-1 text-xs font-bold text-ink-900">Interlocutores</h4>
        <p className="mb-3 text-[11px] text-ink-500">
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
                /*
                  Un cuadrado de 8px, no un avatar con iniciales. El circulo
                  con iniciales sugeria personas con foto — gente ficticia en
                  una audiencia real. El color identifica la voz; el nombre ya
                  esta escrito al lado.
                */
                className={`h-2 w-2 shrink-0 rounded-[2px] ${colorFor(label)}`}
                title={speakerNames[label]}
              >

              </div>
              {/*
                CUANTAS VECES HABLO CADA UNO. 1g lo pone junto al nombre —«Juez
                ponente 18»— y no es estadistica: en una audiencia de cuatro
                actores, la voz con dos intervenciones casi siempre es el
                secretario o un testigo puntual, y la de veintitres es quien
                preside. El numero ORIENTA la asignacion de roles, que es
                justamente lo que se esta haciendo en este panel.
              */}
              <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-ink-400">
                {result.segments.filter((s) => s.speakerLabel === label).length}
              </span>
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
                  className="flex-1 min-w-0 bg-canvas border border-line-200 rounded-control px-2 py-1.5 text-[11px] text-ink-900 placeholder:text-ink-400 focus:outline-none focus:border-brand-700"
                  title={
                    proposalFor(label)
                      ? `Se presentó así: «${proposalFor(label)!.phrase}»`
                      : 'Escribe el nombre si lo sabes'
                  }
                />
              ) : (
                <span className="text-[11px] font-semibold text-ink-700 flex-1 min-w-0 truncate">
                  {speakerNames[label] ?? label}
                </span>
              )}

              <select
                value={roleOf(label)}
                onChange={(e) => onAssignRole(label, e.target.value as SpeakerRole)}
                className="w-44 shrink-0 bg-canvas border border-line-200 rounded-control p-1.5 text-[11px] text-ink-900 focus:outline-none focus:border-brand-700"
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
                <p className="text-[10px] text-ink-500 flex-1">
                  Se presentó como{' '}
                  <span className="font-semibold text-ink-700">{proposalFor(label)!.name}</span>
                  {proposalFor(label)!.atSeconds !== null && (
                    <span className="font-mono text-ink-400">
                      {' '}
                      · {formatTimestamp(proposalFor(label)!.atSeconds)}
                    </span>
                  )}
                  <span className="text-ink-400"> — «{proposalFor(label)!.phrase}»</span>
                </p>
                <button
                  type="button"
                  onClick={() => onAssignSpeakerName(label, proposalFor(label)!.name)}
                  className="text-[10px] font-semibold text-brand-700 hover:underline shrink-0"
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
          className="bg-[rgb(var(--unverified-surf))] border border-[rgb(var(--unverified-line))] rounded-card p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-unverified shrink-0" />
            <h4 className="font-bold text-ink-900 text-xs">
              La voz {speakerNames[conflict.speakerLabel] ?? conflict.speakerLabel} parece contener a{' '}
              {conflict.identities.length} personas distintas
            </h4>
          </div>
          <ul className="space-y-1 mb-2">
            {conflict.identities.map((identity) => (
              <li key={`${identity.segmentIndex}-${identity.name}`} className="text-[11px] text-ink-900">
                <span className="font-semibold">{identity.name}</span>
                {identity.atSeconds !== null && (
                  <span className="font-mono text-unverified"> · {formatTimestamp(identity.atSeconds)}</span>
                )}
                <span className="text-ink-700"> — «{identity.phrase}»</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-ink-700">
            Cada quien se presentó con su propio nombre. Busca la intervención que no corresponde y
            usa <span className="font-semibold">«Otra voz»</span> para dársela a la persona correcta,
            o corrige el nombre si la transcripción lo oyó mal. Si esta voz es un intérprete que
            habla por otras personas, asígnale el rol de Intérprete y este aviso se retira.
          </p>
        </div>
      ))}

      {/* Transcript */}
      <div className="bg-surface border border-line-200 rounded-card divide-y divide-line-100 overflow-hidden">
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
            className="group flex flex-col gap-1 px-4 py-2.5 transition-colors hover:bg-canvas lg:flex-row lg:gap-3"
          >
            {/*
              TRES COLUMNAS FIJAS EN ESCRITORIO: tiempo · voz · texto. El abogado
              corrige leyendo en vertical y necesita que el texto empiece siempre
              en la misma x — burbujas de ancho variable obligan al ojo a
              re-anclarse en cada intervencion.

              EN MOVIL LAS TRES COLUMNAS SE ABANDONAN (4d): interlocutor y hora
              ARRIBA, texto debajo, ancho completo. Los 46px del tiempo mas los
              128 de la voz dejaban al texto 180px de los 375 — cuatro palabras
              por renglon, que no es una transcripcion sino una columna de
              periodico rota.

              `lg:contents` devuelve a estos dos hijos su condicion de columnas
              directas de la fila en escritorio, sin duplicar el marcado: sin
              eso, el envoltorio de movil se volveria una cuarta columna y
              rompería la reticula que el escritorio necesita.
            */}
            <div className="flex items-center gap-1.5 lg:contents">
              <span className="order-2 ml-auto shrink-0 font-mono text-[11px] text-ink-400 lg:order-none lg:ml-0 lg:w-[46px] lg:pt-[2px] lg:text-right">
                {segment.startSeconds !== null ? formatTimestamp(segment.startSeconds) : ''}
              </span>

              <span className="order-1 flex min-w-0 items-start gap-1.5 lg:order-none lg:w-[128px] lg:shrink-0 lg:pt-[2px]">
                <span
                  className={`mt-[4px] h-2 w-2 shrink-0 rounded-[2px] ${colorFor(segment.speakerLabel)}`}
                />
                <span className="min-w-0 truncate text-[12px] font-semibold leading-snug text-ink-900">
                  {speakerNames[segment.speakerLabel] ?? ROLE_LABELS[segment.role]}
                </span>
              </span>
            </div>

            <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 min-h-[18px]">

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
                <span className="text-[11px] font-normal text-ink-500">
                  ({ROLE_LABELS[segment.role]})
                </span>
              )}

              {/*
                Cuts where the caret sits. Diarization cannot separate people
                who talk over each other — the judge greets counsel and counsel
                answers mid-sentence — so one block ends up holding two voices
                under one label, and no role assignment can fix that. Only a cut
                can.
              */}
              <span className={`ml-auto flex items-center gap-3 transition-opacity ${segment.revisada ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}>
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
                        armado ? 'text-brand-700' : 'text-ink-400 hover:text-ink-500'
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
                  className="text-[10px] font-semibold text-ink-400 hover:text-brand-700 flex items-center gap-1"
                  title="Esta intervención es de otra persona"
                >
                  <UserCog className="w-3 h-3" />
                  Otra voz
                </button>
              )}

              {/*
                LA MARCA DE LECTURA. Es el grano fino de "una transcripcion no
                es un acta hasta que un humano la lee": revisada por revisada,
                la fraccion sube, y el acta deja de ser una promesa.
              */}
              {onMarcarRevisada && (
                <button
                  type="button"
                  onClick={() => onMarcarRevisada(index, !segment.revisada)}
                  className={`flex items-center gap-1 text-[10px] font-semibold ${
                    segment.revisada ? 'text-verified' : 'text-ink-400 hover:text-verified'
                  }`}
                  title={segment.revisada ? 'Quitar la marca de revisada' : 'Leída y correcta'}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {segment.revisada ? 'Revisada' : 'Marcar revisada'}
                </button>
              )}

              {/*
                HECHO CLAVE (2a). Junto a la marca de lectura porque se deciden
                en el mismo momento —leyendo la intervención— pero dicen cosas
                distintas: revisada es «está bien transcrita», clave es «esto
                decide el caso». Usa la estrella y el ámbar del sistema: no es
                un estado de verificación, es una señal de importancia, y
                pintarla en verde la confundiría con lo comprobado.
              */}
              {onMarcarHechoClave && (
                <button
                  type="button"
                  onClick={() => onMarcarHechoClave(index, !segment.hechoClave)}
                  className={`flex items-center gap-1 text-[10px] font-semibold ${
                    segment.hechoClave ? 'text-unverified' : 'text-ink-400 hover:text-unverified'
                  }`}
                  title={
                    segment.hechoClave
                      ? 'Quitar la marca de hecho clave'
                      : 'Esto decide el caso: márquelo para el acta'
                  }
                >
                  <Star
                    className="h-3 w-3"
                    fill={segment.hechoClave ? 'currentColor' : 'none'}
                  />
                  {segment.hechoClave ? 'Hecho clave' : 'Marcar hecho clave'}
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
              <p className="mt-2 text-[11px] text-ink-900 bg-[rgb(var(--unverified-surf))] border border-[rgb(var(--unverified-line))] rounded-control p-2">
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
              <div className="mt-2 flex flex-wrap items-center gap-2 bg-brand-50/70 border border-blue-200 rounded-control p-2">
                <span className="text-[11px] text-ink-700">Esta intervención la dice:</span>

                <select
                  defaultValue=""
                  onChange={(e) => {
                    onReassignSpeaker?.(index, e.target.value);
                    setMoving(null);
                  }}
                  className="bg-surface border border-line-200 rounded-control p-1.5 text-[11px] text-ink-900 focus:outline-none focus:border-brand-700"
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
                  className="text-[11px] text-ink-500 hover:text-ink-700"
                >
                  Cancelar
                </button>
              </div>
            )}

            {cutting?.index === index && (
              <div className="mt-2 flex flex-wrap items-center gap-2 bg-[rgb(var(--unverified-surf))]/70 border border-[rgb(var(--unverified-line))] rounded-control p-2">
                <span className="text-[11px] text-ink-700">Lo que sigue lo dice:</span>

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
                  className="bg-surface border border-line-200 rounded-control p-1.5 text-[11px] text-ink-900 focus:outline-none focus:border-brand-700"
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
                  className="text-[11px] text-ink-500 hover:text-ink-700"
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
              onFocus={() => {
                setEditing(index);
                setJustSaved(null);
              }}
              /*
                Enter saves and Escape discards.
                
                Enter also had to be intercepted for correctness: inside a
                contentEditable it was inserting a line break into a
                transcript that is one paragraph per turn by definition, so the
                key that a person presses to mean "done" was quietly damaging
                the record.
              */
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  e.currentTarget.blur();
                  return;
                }

                if (e.key === 'Escape') {
                  e.preventDefault();
                  e.currentTarget.textContent = segment.text;
                  setEditing(null);
                  e.currentTarget.blur();
                }
              }}
              onBlur={(e) => {
                const nuevo = e.currentTarget.textContent ?? '';
                setEditing(null);

                if (onEditSegment && nuevo.trim() && nuevo !== segment.text) {
                  onEditSegment(index, nuevo.trim());
                  setJustSaved(index);
                  // Long enough to be read, short enough not to become part of
                  // the page: the transcript is what the reader came for.
                  window.setTimeout(() => setJustSaved((actual) => (actual === index ? null : actual)), 2500);
                }
              }}
              /*
                Reading size, not form size. This was text-xs — 12px — for a
                document a lawyer reads for an hour and quotes in a filing. The
                controls around it can stay small; the words cannot.
              */
              /*
                JUSTIFICADO: los parrafos de una intervencion se leen como
                declaracion, no como chat — el borde derecho dentado hacia ver
                desordenada la columna de texto que las tres columnas fijas
                acababan de alinear.
              */
              style={{ fontSize: letra.px(13) }}
              className={`leading-[1.65] text-justify text-ink-700 [text-wrap:pretty] ${
                /*
                  LA FILA EN EDICION VA EN AZUL DE MARCA CON HALO, no en ambar.
                  Lo dicen los dos artboards con el mismo valor —`border:1px
                  solid #17456B` con `box-shadow:0 0 0 3px rgba(23,69,107,.10)`,
                  1g y 4d— y ademas es lo correcto en este sistema: el ambar
                  significa «sin verificar», y una intervencion que se esta
                  corrigiendo no esta sin verificar, esta bajo la mano de
                  alguien. Usar el mismo color para las dos cosas le enseña al
                  ojo que el ambar no quiere decir nada en particular.
                */
                onEditSegment
                  ? 'outline-none focus:bg-surface focus:ring-1 focus:ring-brand-700 focus:shadow-[0_0_0_3px_rgb(var(--brand-700)/0.10)] rounded px-1 -mx-1 cursor-text'
                  : ''
              }`}
              title={
                onEditSegment
                  ? 'Haz clic para corregir el texto. Enter guarda, Esc descarta.'
                  : undefined
              }
            >
              {/*
                SOLO EL TROZO DUDOSO VA SUBRAYADO, no la intervención entera.
                La nota de 1g lo dice y tiene razón: «no se colorea toda la
                intervención, porque el 95% del texto sí es fiable». Marcarla
                completa manda a releer trescientas palabras para encontrar las
                cuatro dudosas, y quien lo haga dos veces deja de hacerlo.

                Se subraya, no se tiñe: teñir vuelve difícil de leer justo lo
                que hay que leer con más cuidado. Y el subrayado es punteado —
                la misma trama de «sin verificar»— porque es lo mismo: algo que
                nadie ha comprobado todavía.
              */}
              {partirPorDudosos(segment)}
            </p>

            {/*
              Says how to save while saving is possible, and says it saved.
              
              Both halves matter: the first because a lawyer asked how, the
              second because a correction believed saved and not saved is the
              worst outcome this screen can produce.
            */}
            {editing === index && (
              <p className="mt-1 text-[10px] text-ink-500">
                <span className="font-semibold">Enter</span> guarda ·{' '}
                <span className="font-semibold">Esc</span> descarta · también se guarda al hacer
                clic fuera
              </p>
            )}

            {justSaved === index && (
              <p className="mt-1 text-[10px] font-semibold text-verified flex items-center gap-1">
                <Check className="w-3 h-3" />
                Corrección guardada
              </p>
            )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
