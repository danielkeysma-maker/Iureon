/**
 * Guards the voice-conflict detector's two duties, which pull in opposite
 * directions — the same tension the role proposer lives with.
 *
 * Run with: npm run check:conflicts
 *
 * It must notice when one diarization label introduces itself as two different
 * people, and stay silent for everything else. Silence is the one worth testing
 * hardest: a false alarm accuses a clean voice of being two people, and a
 * lawyer who sees one wrong warning learns to ignore all of them.
 *
 * The cases are lifted from the real hearing that exposed the failure, mangled
 * transcription included.
 */
import { detectVoiceConflicts } from '../voiceConflicts';
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

const check = (name: string, ok: boolean, detail = ''): void =>
  ok ? pass(name) : fail(`${name}${detail ? ` — ${detail}` : ''}`);

// ─── The real failure: two men filed under speaker_1 ────────────────────────
{
  const conflicts = detectVoiceConflicts([
    say(
      'speaker_1',
      'Ok. Buenos días, mi nombre es Tomás Enrique Wilches Salsa. Mi número de documento es cédula de ciudadanía 9 0 43, 8 45, de San Gonofre, Sucre.',
      64
    ),
    say(
      'speaker_0',
      'Solicitando reprogramar la presente audiencia. Sí, buenos días. ¿Se identifica, por favor?',
      117
    ),
    say(
      'speaker_1',
      'José Omar Gaitán Guevara, abogado apoderado judicial de la señora Osiris García Wilches.',
      195
    )
  ]);

  check('two introductions under one label are a conflict', conflicts.length === 1);
  check(
    'the conflict names the merged label',
    conflicts[0]?.speakerLabel === 'speaker_1',
    conflicts[0]?.speakerLabel
  );
  check(
    'both identities travel with their evidence',
    conflicts[0]?.identities.length === 2 &&
      conflicts[0].identities.every((identity) => identity.phrase.length > 0),
    JSON.stringify(conflicts[0]?.identities.map((identity) => identity.name))
  );
  check(
    'each identity keeps its second in the recording',
    conflicts[0]?.identities[0]?.atSeconds === 64 && conflicts[0]?.identities[1]?.atSeconds === 195
  );
}

// ─── The narration trap: the judge says other people's names ────────────────
{
  const conflicts = detectVoiceConflicts([
    say(
      'speaker_0',
      'Mi nombre es Carmen Elisa Ortega y presido esta audiencia.',
      10
    ),
    say(
      'speaker_0',
      'Debo informar que el apoderado de la demandada Osiris García Huinches, es decir, el abogado José Omar Gaitán Quevara, allegó memorial manifestando o solicitando reprogramar la presente audiencia.',
      117
    )
  ]);

  check(
    'a judge narrating names is not two people',
    conflicts.length === 0,
    JSON.stringify(conflicts.map((c) => c.identities.map((i) => i.name)))
  );
}

// ─── Re-introduction: one person, twice, with different name lengths ────────
{
  const conflicts = detectVoiceConflicts([
    say('speaker_1', 'Mi nombre es Tomás Wilches.', 64),
    say('speaker_1', 'Sí, mi nombre es Tomás Enrique Wilches Salsa, como ya indiqué.', 300)
  ]);

  check('the same person introducing themselves twice is silence', conflicts.length === 0);
}

// ─── Transcription noise: commas inside the name still identify one person ──
{
  const conflicts = detectVoiceConflicts([
    say(
      'speaker_2',
      'Buenos días, señora juez, buenos días. A mi nombre es Richard Antonio, Tirán Julio, de ciudadanía número 184000050.',
      81
    )
  ]);

  check('a single mangled introduction is not a conflict', conflicts.length === 0);
}

// ─── Accent drift: the transcriber spells the same name two ways ────────────
{
  const conflicts = detectVoiceConflicts([
    say('speaker_1', 'Mi nombre es Tomas Wilches.', 10),
    say('speaker_1', 'Como dije, mi nombre es Tomás Wilches.', 60)
  ]);

  check('accent differences do not invent a second person', conflicts.length === 0);
}

// ─── One-word openers: interventions that start with a lone capital ─────────
{
  const conflicts = detectVoiceConflicts([
    say('speaker_1', 'Carrera', 111),
    say('speaker_1', 'Mi nombre es Tomás Enrique Wilches.', 64)
  ]);

  check('a one-word intervention identifies nobody', conflicts.length === 0);
}

// ─── Formulas without names: role words are not identities ──────────────────
{
  const conflicts = detectVoiceConflicts([
    say('speaker_1', 'Mi nombre es el apoderado de la parte demandante.', 10),
    say('speaker_1', 'Mi nombre es Tomás Wilches.', 60)
  ]);

  check('a role after the formula is not a name', conflicts.length === 0);
}

// ─── Clean hearings stay clean ──────────────────────────────────────────────
{
  const conflicts = detectVoiceConflicts([
    say('speaker_0', 'Se declara abierta la audiencia. Tiene usted la palabra.', 0),
    say('speaker_1', 'Con la venia del despacho, procedo a mis alegatos.', 10),
    say('speaker_2', 'Objeción, señoría.', 20)
  ]);

  check('a hearing with no introductions warns about nothing', conflicts.length === 0);
}

// ─── Three people under one label: all of them surface ──────────────────────
{
  const conflicts = detectVoiceConflicts([
    say('speaker_1', 'Mi nombre es Tomás Enrique Wilches.', 10),
    say('speaker_0', '¿Se identifica, por favor?', 90),
    say('speaker_1', 'José Omar Gaitán Guevara, abogado apoderado judicial de la demandada.', 100),
    say('speaker_1', 'Me llamo Pedro Pablo Contreras Díaz.', 200)
  ]);

  check(
    'three merged people are reported as three identities',
    conflicts.length === 1 && conflicts[0]?.identities.length === 3,
    JSON.stringify(conflicts[0]?.identities.map((identity) => identity.name))
  );
}

// ─── The five confirmed attacks from the adversarial review ─────────────────
{
  // Roll-call: the judge ASKS whether the named counsel is present.
  const conflicts = detectVoiceConflicts([
    say('speaker_0', 'Mi nombre es Carmen Elisa Ortega y presido esta audiencia.', 10),
    say(
      'speaker_0',
      '¿José Omar Gaitán Guevara, apoderado de la parte demandada, se encuentra presente?',
      60
    )
  ]);
  check('calling the roll is not a self-introduction', conflicts.length === 0);
}

{
  // Pause-split narration: the ASR cut right before the narrated name.
  const conflicts = detectVoiceConflicts([
    say('speaker_0', 'Mi nombre es Carmen Elisa Ortega y presido esta audiencia.', 10),
    say(
      'speaker_0',
      'José Omar Gaitán Quevara, abogado de la parte demandada, allegó memorial solicitando reprogramar la presente audiencia.',
      117
    )
  ]);
  check('narration split at the narrated name is not an introduction', conflicts.length === 0);
}

{
  // Reading a sworn statement aloud: first person, and not the reader's.
  const conflicts = detectVoiceConflicts([
    say('speaker_2', 'Buenos días, mi nombre es José Omar Gaitán Guevara, abogado apoderado.', 10),
    say(
      'speaker_2',
      'Procedo a dar lectura a la declaración extraprocesal aportada: mi nombre es Pedro Pablo Contreras Díaz, mayor de edad, domiciliado en Sincelejo.',
      60
    )
  ]);
  check('reading a document aloud is not becoming its author', conflicts.length === 0);
}

{
  // Vocative: the judge addresses a court officer by full name and role.
  const conflicts = detectVoiceConflicts([
    say('speaker_0', 'Mi nombre es Carmen Elisa Ortega y presido esta audiencia.', 10),
    say('speaker_0', 'Claudia Rojas, secretaria, por favor haga el llamado a lista.', 60)
  ]);
  check('addressing an officer by name is not an introduction', conflicts.length === 0);
}

{
  // Interpreter: first person FOR other people is the professional standard.
  const conflicts = detectVoiceConflicts([
    { ...say('speaker_3', 'Mi nombre es John Smith y comparezco como testigo.', 10), role: 'INTERPRETE' as const },
    { ...say('speaker_3', 'Mi nombre es Mary Johnson y comparezco como testigo.', 200), role: 'INTERPRETE' as const }
  ]);
  check('an interpreter voicing two deponents is one interpreter', conflicts.length === 0);
}

{
  // Surnames with particles survive the capture whole.
  const conflicts = detectVoiceConflicts([
    say('speaker_1', 'Mi nombre es María de los Ángeles Pérez Salgado.', 10),
    say('speaker_1', 'Me llamo Ernesto Villamizar Duarte.', 100)
  ]);
  check(
    'a particled surname is captured whole and still conflicts',
    conflicts.length === 1 &&
      conflicts[0]?.identities.some((identity) => identity.name === 'María de los Ángeles Pérez Salgado'),
    JSON.stringify(conflicts[0]?.identities.map((identity) => identity.name))
  );
}

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);
