/**
 * Guards the role proposer's two duties, which pull in opposite directions.
 *
 * Run with: npm run check:roles
 *
 * It must name the judge when the hearing names them, and stay silent
 * otherwise. The second is the one worth testing hardest: a proposer that
 * guesses is worse than none, because a wrong role travels into a transcript
 * that gets quoted in a filing, and "JUEZ" printed beside the wrong voice reads
 * exactly like a verified fact.
 */
import { mergeConsecutive } from '../providers/deepgram.provider';
import { proposeRoles } from '../roleProposer';
import type { TranscriptSegment } from '../types';

let failures = 0;
const fail = (message: string): void => {
  console.error(`FAIL ${message}`);
  failures++;
};
const pass = (message: string): void => console.log(`ok   ${message}`);

const say = (speakerLabel: string, text: string, startSeconds = 0): TranscriptSegment => ({
  speakerLabel,
  role: 'DESCONOCIDO',
  text,
  startSeconds,
  endSeconds: startSeconds + 5
});

const roleOf = (proposals: ReturnType<typeof proposeRoles>, label: string): string =>
  proposals.find((p) => p.speakerLabel === label)?.proposedRole ?? 'AUSENTE';

// ---------------------------------------------------------------------------
// 1. A hearing that announces its own turns.
// ---------------------------------------------------------------------------
const audiencia = proposeRoles([
  say('speaker_0', 'Se declara abierta la audiencia. Se le concede el uso de la palabra al apoderado.', 12),
  say('speaker_1', 'Con venia del despacho, soy la apoderada de la parte demandante.', 40),
  say('speaker_2', 'Sí, lo juro.', 300)
]);

if (roleOf(audiencia, 'speaker_0') === 'JUEZ') {
  pass('quien abre la audiencia y reparte la palabra queda propuesto como JUEZ');
} else {
  fail(`speaker_0 se propuso como ${roleOf(audiencia, 'speaker_0')}, se esperaba JUEZ`);
}

if (roleOf(audiencia, 'speaker_1') === 'APODERADO_DEMANDANTE') {
  pass('quien se identifica como apoderado de la parte demandante queda propuesto como tal');
} else {
  fail(`speaker_1 se propuso como ${roleOf(audiencia, 'speaker_1')}`);
}

if (roleOf(audiencia, 'speaker_2') === 'TESTIGO') {
  pass('quien responde al juramento queda propuesto como TESTIGO');
} else {
  fail(`speaker_2 se propuso como ${roleOf(audiencia, 'speaker_2')}, se esperaba TESTIGO`);
}

// ---------------------------------------------------------------------------
// 2. Every proposal carries the phrase that produced it.
// ---------------------------------------------------------------------------
const juez = audiencia.find((p) => p.speakerLabel === 'speaker_0');

if (juez && juez.evidence.length > 0 && juez.evidence[0].phrase.length > 0) {
  pass(`la propuesta trae su prueba: "${juez.evidence[0].phrase.slice(0, 45)}" (seg ${juez.evidence[0].atSeconds})`);
} else {
  fail('una propuesta llegó sin la frase que la justifica');
}

// ---------------------------------------------------------------------------
// 3. Silence when the hearing says nothing procedural.
//
// The case that matters most: ordinary conversation must produce no role at
// all — not a best guess, not the most likely speaker.
// ---------------------------------------------------------------------------
const charla = proposeRoles([
  say('speaker_0', 'Buenos días a todos, ¿me escuchan bien?'),
  say('speaker_1', 'Sí, se escucha perfecto, gracias.')
]);

if (charla.every((p) => p.proposedRole === 'DESCONOCIDO' && p.matches === 0)) {
  pass('sin fórmulas procesales no se propone ningún rol');
} else {
  fail(`se propusieron roles sin evidencia: ${charla.map((p) => `${p.speakerLabel}=${p.proposedRole}`).join(', ')}`);
}

// ---------------------------------------------------------------------------
// 4. A tie is not a winner.
// ---------------------------------------------------------------------------
// One marker each, of identical weight: "con venia del despacho" (ABOGADO, 4)
// against "se levanta la sesión" (JUEZ, 4). The first version of this case was
// not a tie at all — the oath markers added up to 9 against 4 — and the code
// was right to pick TESTIGO. The test was wrong, which is its own lesson about
// asserting an expectation without doing the arithmetic.
const ambiguo = proposeRoles([
  say('speaker_0', 'Con venia del despacho. Se levanta la sesión.')
]);

if (roleOf(ambiguo, 'speaker_0') === 'DESCONOCIDO') {
  pass('un empate entre dos roles se resuelve como DESCONOCIDO, no eligiendo uno');
} else {
  fail(`un empate se resolvió como ${roleOf(ambiguo, 'speaker_0')} en vez de DESCONOCIDO`);
}

// ---------------------------------------------------------------------------
// 5. Terms of address must not label the speaker.
//
// The judge saying "señor apoderado" is among the commonest phrases in a
// hearing. If that marked the SPEAKER, the proposer would call the judge
// counsel every time they gave someone the floor.
// ---------------------------------------------------------------------------
const tratamiento = proposeRoles([
  say('speaker_0', 'Señor apoderado, doctora Martínez, tiene la palabra.', 5)
]);

if (roleOf(tratamiento, 'speaker_0') === 'JUEZ') {
  pass('nombrar a otro por su tratamiento no reetiqueta a quien habla');
} else {
  fail(`dirigirse a un apoderado etiquetó al hablante como ${roleOf(tratamiento, 'speaker_0')}`);
}

// ---------------------------------------------------------------------------
// 6. One turn is one intervention, not one per pause.
//
// Deepgram ends an utterance at every silence, so a continuous answer arrived as
// seven rows — "de", "posterior a", "a la terminación por captura" — each
// labelled as a fresh turn. A transcript quoted in a filing has to read as
// somebody speaking, and the merge must never swallow a real exchange.
// ---------------------------------------------------------------------------
const fusionadas = mergeConsecutive([
  say('speaker_0', 'Incluso yo acá estoy validando', 326),
  say('speaker_0', 'de', 329),
  say('speaker_0', 'posterior a la terminación por captura', 331),
  say('speaker_1', 'Ok,', 337),
  say('speaker_0', 'y el cliente asume los gastos', 340)
]);

if (fusionadas.length === 3) {
  pass('tres intervenciones seguidas de una voz se unen en una sola');
} else {
  fail(`se esperaban 3 intervenciones y quedaron ${fusionadas.length}`);
}

if (fusionadas[0]?.text === 'Incluso yo acá estoy validando de posterior a la terminación por captura') {
  pass('el texto se une en orden y con un espacio entre partes');
} else {
  fail(`el texto unido quedó: "${fusionadas[0]?.text}"`);
}

if (fusionadas[0]?.startSeconds === 326 && fusionadas[0]?.endSeconds === 336) {
  pass('la intervención conserva el inicio de la primera y el final de la última');
} else {
  fail(`el lapso quedó ${fusionadas[0]?.startSeconds}-${fusionadas[0]?.endSeconds}, se esperaba 326-336`);
}

// The point of "adjacent only": the other party speaking must break the run, or
// a dialogue would collapse into one person's monologue.
if (fusionadas[1]?.speakerLabel === 'speaker_1' && fusionadas[2]?.speakerLabel === 'speaker_0') {
  pass('la intervención de la otra parte corta la unión, el diálogo se conserva');
} else {
  fail('la unión atravesó la intervención de otra voz');
}


console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
