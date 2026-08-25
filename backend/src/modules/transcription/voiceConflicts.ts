import type { TranscriptSegment } from './types';

/**
 * Detects one diarization label holding more than one real person, by reading
 * what the voices say about themselves.
 *
 * WHY THE TEXT CAN SEE WHAT THE AUDIO CANNOT. Diarization clusters by acoustics
 * and merges people it cannot tell apart — a known limit, not a configuration
 * error. But a Colombian hearing makes everyone identify themselves on the
 * record, so when one label carries "mi nombre es Tomás Enrique Wilches" at
 * 01:04 and "José Omar Gaitán Guevara, abogado apoderado judicial" at 03:15,
 * the transcript itself is announcing two people. A real hearing exposed
 * exactly that, and the lawyer had to notice it by reading.
 *
 * WHY IT WARNS AND NEVER FIXES. Same doctrine as the role proposer: this is
 * inference over noisy text, and a silent automatic re-split that guessed wrong
 * would corrupt the record while looking like a repair. Every warning carries
 * the two phrases and their timestamps, and the human moves the intervention —
 * or decides the transcription simply misheard a name.
 *
 * WHY THE GUARDS BELOW EXIST. An adversarial review of the first version
 * produced five confirmed ways to accuse a CLEAN voice of being two people:
 * the judge calling the roll ("¿José Omar Gaitán, apoderado, se encuentra
 * presente?"), narration split at a pause so the named person opens the
 * segment, a lawyer reading a sworn statement aloud ("doy lectura: mi nombre
 * es Pedro Pablo..."), a vocative to a court officer ("Claudia Rojas,
 * secretaria, por favor..."), and the interpreter — who speaks in first person
 * FOR other people as a professional duty. A false alarm is worse than a miss
 * here, because one wrong accusation teaches the lawyer to ignore every
 * warning. Each guard traces to one of those attacks.
 */

export interface VoiceIdentity {
  /** The name as transcribed, commas and all. */
  name: string;
  /** The sentence that introduced it, trimmed for display. */
  phrase: string;
  atSeconds: number | null;
  segmentIndex: number;
}

export interface VoiceConflict {
  speakerLabel: string;
  /** Two or more people the same label claims to be. */
  identities: VoiceIdentity[];
}

/*
 * A proper-name run: capitalized words separated by spaces, tolerating the
 * commas the transcriber drops inside names ("Richard Antonio, Tirán Julio")
 * and the lowercase particles Spanish surnames carry ("María de los Ángeles
 * Pérez"). Written with explicit accented ranges instead of \w or \b, because
 * in JavaScript both are ASCII-only and treat "é" as a boundary — a name like
 * "Gaitán" would split in the middle.
 */
const PARTICLE = String.raw`(?:de(?:\s+l[ao]s?)?|del|y)`;
const NAME = String.raw`[A-ZÁÉÍÓÚÑÜ][a-zA-Záéíóúñü]+(?:,?\s+(?:${PARTICLE}\s+)?[A-ZÁÉÍÓÚÑÜ][a-zA-Záéíóúñü]+){1,5}`;

/**
 * Words that end a name capture: the run "José Omar Gaitán Guevara" is a name,
 * but a greedy capture of "Mi Número De Documento" is not. Filtering happens
 * after the match so the pattern itself stays readable.
 */
const NOT_A_NAME = new Set([
  'mi', 'su', 'el', 'la', 'los', 'las', 'don', 'doña',
  'numero', 'número', 'cedula', 'cédula', 'documento', 'ciudadania', 'ciudadanía',
  'identificado', 'identificada', 'tarjeta', 'profesional', 'abogado', 'abogada',
  'apoderado', 'apoderada', 'juez', 'jueza', 'doctor', 'doctora', 'señor', 'señora',
  'buenos', 'buenas', 'dias', 'días', 'tardes', 'ok', 'listo'
]);

/** Particles allowed INSIDE a name; identifying tokens they are not. */
const NAME_PARTICLES = new Set(['de', 'del', 'la', 'lo', 'las', 'los', 'y']);

/*
 * First-person introduction formulas.
 *
 * Case-insensitive by character class, never by flag: an /i on the whole
 * pattern would also blind the NAME capture, whose entire job is telling
 * capitalized names from ordinary vocabulary. "Me llamo" opening an
 * intervention taught this — sentence-initial capitals are the common case.
 *
 * The looser "mi nombre," (without "es") was reviewed out: it matched "en mi
 * nombre José pidió..." and similar, and a formula that loose buys almost no
 * recall for its false alarms.
 */
const FORMULAS: RegExp[] = [
  new RegExp(String.raw`[Mm]i\s+nombre\s+es\s+(${NAME})`),
  new RegExp(String.raw`[Mm]e\s+llamo\s+(${NAME})`)
];

/**
 * Cues that the voice is READING or QUOTING rather than speaking as itself.
 * A lawyer giving lectura to a declaración extraprocesal utters "mi nombre es
 * Pedro Pablo..." verbatim — first person by construction, and not their own.
 * Any of these appearing before the formula in the same intervention silences
 * the match; the miss is the acceptable failure.
 */
const READING_CUES =
  /(dar\s+lectura|doy\s+lectura|lectura\s+de|se\s+lee|leo\s|leyendo|cito\s|se\s+cita|textualmente|transcribo|dice\s+as[íi]|que\s+dice|reza\s|declaraci[óo]n|memorial|escrito\s+que|acta\s|poder\s+que)/i;

/**
 * The answer-shape: an intervention that OPENS with a name and follows it with
 * a procedural role — "José Omar Gaitán Guevara, abogado apoderado judicial".
 *
 * Adversarial review showed the shape alone is shared by a roll-call question,
 * a vocative to a court officer, and narration that an ASR pause-split left
 * segment-initial. What none of those share is the CONTEXT of the real thing:
 * an identification is an ANSWER, so this pattern only counts when the
 * PREVIOUS intervention asked for it ("¿se identifica, por favor?") and the
 * match itself is not inside a question.
 */
const LEADING_NAME_WITH_ROLE = new RegExp(
  String.raw`^["'\s]*(?:Ok[,.]?\s+)?(?:Buen[oa]s\s+(?:d[ií]as|tardes)[,.]?\s+)?(${NAME})[,.]?\s+(?:abogad[oa]|apoderad[oa]|juez|jueza|fiscal|secretari[oa]|defensor[a]?|perito|int[eé]rprete|representante)`
);

/** How a hearing asks somebody to state who they are. */
const IDENTIFICATION_REQUEST =
  /(se\s+identifica|identif[íi]quese|s[íi]rvase\s+identificarse|su\s+nombre\s+completo|indique\s+su\s+nombre|nombre\s+y\s+(documento|c[ée]dula|tarjeta))/i;

/** Accents and case removed so "Tomás" and "Tomas" read as the same word. */
const normalize = (word: string): string =>
  word
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** The words of a name that actually identify someone. */
const nameTokens = (name: string): Set<string> =>
  new Set(
    name
      .split(/[\s,]+/)
      .map(normalize)
      .filter((token) => token.length > 1 && !NAME_PARTICLES.has(token) && !NOT_A_NAME.has(token))
  );

/**
 * Trims a captured run at the first word that is vocabulary rather than name,
 * and rejects what remains if it is too short to identify anyone.
 */
const cleanName = (raw: string): string | null => {
  const kept: string[] = [];

  for (const word of raw.split(/[\s]+/)) {
    const bare = normalize(word.replace(/[.,]+$/, ''));

    // Particles are checked FIRST: "los" belongs to vocabulary in general and
    // to the middle of "María de los Ángeles" in particular, and breaking on
    // it truncated exactly the names this list exists to keep whole.
    if (NAME_PARTICLES.has(bare)) {
      kept.push(word.replace(/[.,]+$/, ''));
      continue;
    }

    if (NOT_A_NAME.has(bare)) break;
    kept.push(word.replace(/[.,]+$/, ''));
  }

  const identifying = kept.filter((word) => !NAME_PARTICLES.has(normalize(word)));

  // One word is not an identification: "Carrera" opens interventions too.
  return identifying.length >= 2 ? kept.join(' ') : null;
};

/**
 * Whether two captured names belong to the same person.
 *
 * Sharing any identifying word counts as the same person on purpose: "Tomás
 * Wilches" and "Tomás Enrique Wilches Salsa" are one man introducing himself
 * twice, and the cost of a false alarm — accusing a clean voice of being two
 * people — is higher than the cost of missing a re-introduction. The known
 * price is that two genuinely different people sharing one surname read as
 * one; that miss is accepted, and it fails silent.
 */
const samePerson = (a: string, b: string): boolean => {
  const tokensA = nameTokens(a);
  for (const token of nameTokens(b)) {
    if (tokensA.has(token)) return true;
  }
  return false;
};

/** Whether a formula match sits inside quotation marks or after a reading cue. */
const isQuotedOrRead = (text: string, matchIndex: number): boolean => {
  const before = text.slice(0, matchIndex);

  if (READING_CUES.test(before)) return true;

  // An odd count of quote characters before the match means it is inside one.
  const quotes = (before.match(/["«»“”]/g) ?? []).length;
  return quotes % 2 === 1;
};

const excerpt = (text: string, match: string): string => {
  const at = text.indexOf(match);
  if (at === -1) return text.slice(0, 120);

  const from = Math.max(0, at - 30);
  return `${from > 0 ? '…' : ''}${text.slice(from, at + match.length + 30).trim()}…`;
};

/**
 * Reads every voice's own introductions and reports the labels that introduce
 * themselves as two different people.
 *
 * Pure function of the segments, recomputed after every edit, cut, move or
 * role change: fixing the transcript makes the warning withdraw itself, and a
 * stale warning about a solved problem would teach the lawyer to ignore all of
 * them.
 */
const identitiesByLabel = (segments: TranscriptSegment[]): Map<string, VoiceIdentity[]> => {
  const byLabel = new Map<string, VoiceIdentity[]>();

  segments.forEach((segment, segmentIndex) => {
    // The interpreter is EXPECTED to speak in first person for other people —
    // interpreting the deponent's "mi nombre es..." is the professional
    // standard, not a merged voice. Only an assigned role can say so; an
    // unidentified interpreter is a documented residual risk the warning text
    // acknowledges on screen.
    if (segment.role === 'INTERPRETE') return;

    const found: { name: string; matched: string }[] = [];

    for (const formula of FORMULAS) {
      const match = formula.exec(segment.text);
      if (!match) continue;
      if (isQuotedOrRead(segment.text, match.index)) continue;
      found.push({ name: match[1], matched: match[0] });
    }

    const leading = LEADING_NAME_WITH_ROLE.exec(segment.text);
    if (leading) {
      const previous = segments[segmentIndex - 1];
      const wasAsked = Boolean(previous && IDENTIFICATION_REQUEST.test(previous.text));

      // Not inside a question: an answer states, a roll-call asks.
      const firstSentence = segment.text.split(/[.?!]/, 1)[0] ?? segment.text;
      const asksSomething = segment.text.slice(0, firstSentence.length + 1).includes('?');

      if (wasAsked && !asksSomething) {
        found.push({ name: leading[1], matched: leading[0] });
      }
    }

    for (const { name, matched } of found) {
      const cleaned = cleanName(name);
      if (!cleaned) continue;

      const identities = byLabel.get(segment.speakerLabel) ?? [];

      // Only genuinely new identities accumulate; a re-introduction of the
      // same person is evidence of nothing.
      if (identities.some((known) => samePerson(known.name, cleaned))) continue;

      identities.push({
        name: cleaned,
        phrase: excerpt(segment.text, matched),
        atSeconds: segment.startSeconds,
        segmentIndex
      });
      byLabel.set(segment.speakerLabel, identities);
    }
  });

  return byLabel;
};

/**
 * Labels that introduce themselves as MORE than one person.
 *
 * Two or more identities under one label is the merge; exactly one is simply a
 * person who said their name, which is the next function's business.
 */
export const detectVoiceConflicts = (segments: TranscriptSegment[]): VoiceConflict[] =>
  [...identitiesByLabel(segments).entries()]
    .filter(([, identities]) => identities.length >= 2)
    .map(([speakerLabel, identities]) => ({ speakerLabel, identities }));

export interface SpeakerNameProposal {
  speakerLabel: string;
  name: string;
  /** The phrase that produced it, so the lawyer can judge rather than trust. */
  phrase: string;
  atSeconds: number | null;
}

/**
 * The name each voice gave for ITSELF, proposed and never applied.
 *
 * The machinery was already here and its result was being thrown away: the
 * conflict detector reads self-introductions and only kept the labels that
 * produced two or more. A label that produced exactly one is the ordinary case
 * — somebody stated their name on the record — and that name is the single most
 * useful thing the transcript can carry, because a filing quotes people, not
 * `speaker_2`.
 *
 * Proposed with its phrase and its minute, like every other inference in this
 * codebase. A voice with two candidate names proposes NOTHING: that is a
 * conflict, and guessing which of two men a label is would be exactly the
 * confident wrong answer the conflict warning exists to prevent.
 */
export const proposeSpeakerNames = (segments: TranscriptSegment[]): SpeakerNameProposal[] =>
  [...identitiesByLabel(segments).entries()]
    .filter(([, identities]) => identities.length === 1)
    .map(([speakerLabel, [identity]]) => ({
      speakerLabel,
      name: identity.name,
      phrase: identity.phrase,
      atSeconds: identity.atSeconds
    }));
