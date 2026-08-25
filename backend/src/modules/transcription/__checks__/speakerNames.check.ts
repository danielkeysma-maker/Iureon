/**
 * Guards naming a voice: what the transcript proposes, and what a human sets.
 *
 * Run with: npm run check:names
 *
 * A name is the most useful thing a transcript can carry, because a filing
 * quotes people rather than `speaker_2` — and for the same reason it is the
 * most damaging thing to get wrong. So the proposal must come from what a voice
 * said about ITSELF, must stay silent when it cannot tell two candidates apart,
 * and must never be applied without a human.
 */
import { supabase } from '../../../config/supabase.config';
import { transcriptionStore } from '../transcriptionStore.service';
import { proposeSpeakerNames, detectVoiceConflicts } from '../voiceConflicts';
import type { TranscriptSegment } from '../types';

const FIRM = 'firm-prueba-nombres';
let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const say = (speakerLabel: string, text: string, startSeconds = 0): TranscriptSegment => ({
  speakerLabel,
  role: 'DESCONOCIDO',
  text,
  startSeconds,
  endSeconds: startSeconds + 5
});

(async () => {
  // ─── Lo que propone, y lo que calla ───────────────────────────────────────
  {
    const propuestas = proposeSpeakerNames([
      say('speaker_0', 'Se declara abierta la audiencia. ¿Se identifica, por favor?', 0),
      say('speaker_1', 'Ok. Buenos días, mi nombre es Tomás Enrique Wilches Salsa.', 64),
      say('speaker_2', 'Buenos días, señora juez. Mi nombre es Richard Antonio Tirán Julio.', 81)
    ]);

    const porVoz = Object.fromEntries(propuestas.map((p) => [p.speakerLabel, p.name]));
    check(
      'propone el nombre que cada voz dio de sí misma',
      porVoz.speaker_1 === 'Tomás Enrique Wilches Salsa' &&
        porVoz.speaker_2 === 'Richard Antonio Tirán Julio',
      JSON.stringify(porVoz)
    );
    check('no propone nada para quien no se presentó', !porVoz.speaker_0, String(porVoz.speaker_0));
    check(
      'cada propuesta trae su frase y su minuto',
      propuestas.every((p) => p.phrase.length > 0 && p.atSeconds !== null)
    );
  }

  {
    // Dos nombres bajo una voz: eso es un conflicto, no una propuesta.
    const segmentos = [
      say('speaker_1', 'Mi nombre es Tomás Enrique Wilches.', 10),
      say('speaker_1', 'Me llamo José Omar Gaitán Guevara.', 200)
    ];
    check('una voz con DOS nombres no propone ninguno', proposeSpeakerNames(segmentos).length === 0);
    check('y sí se reporta como conflicto', detectVoiceConflicts(segmentos).length === 1);
  }

  {
    // La jueza narrando: ni propuesta ni conflicto.
    const propuestas = proposeSpeakerNames([
      say('speaker_0', 'El abogado José Omar Gaitán Quevara allegó memorial solicitando reprogramar.', 117)
    ]);
    check('narrar el nombre de otro no propone nada', propuestas.length === 0, JSON.stringify(propuestas));
  }

  // ─── Lo que un humano fija, contra la base ────────────────────────────────
  const guardado = await transcriptionStore.save(FIRM, 'p@iureon.co', 'p', 'p.mp3', {
    kind: 'AUDIENCIA',
    fullText: 'x',
    segments: [
      say('speaker_0', 'Se declara abierta la audiencia.', 0),
      say('speaker_1', 'Mi nombre es Tomás Enrique Wilches.', 64),
      say('speaker_1', 'Sí, señoría, así es.', 300)
    ],
    speakerLabels: ['speaker_0', 'speaker_1'],
    language: 'es',
    durationSeconds: 400,
    model: 'nova-3',
    transcribedAt: new Date(0).toISOString()
  } as never);

  if (!guardado) {
    console.error('no se pudo crear la fila de prueba');
    process.exit(1);
  }

  const id = guardado.id;

  const conNombre = await transcriptionStore.assignSpeakerName(FIRM, id, 'speaker_1', 'Tomás Enrique Wilches Salsa');
  const deVoz1 = (conNombre?.segments ?? []).filter((s) => s.speakerLabel === 'speaker_1');
  check(
    'el nombre se aplica a TODAS las intervenciones de esa voz',
    deVoz1.length === 2 && deVoz1.every((s) => s.speakerName === 'Tomás Enrique Wilches Salsa'),
    JSON.stringify(deVoz1.map((s) => s.speakerName))
  );

  const otraVoz = (conNombre?.segments ?? []).find((s) => s.speakerLabel === 'speaker_0');
  check('y no toca las demás voces', otraVoz?.speakerName === undefined, String(otraVoz?.speakerName));

  const { data: releido } = await supabase!.from('transcriptions').select('segments').eq('id', id).single();
  const persistido = ((releido as { segments: TranscriptSegment[] }).segments ?? []).find(
    (s) => s.speakerLabel === 'speaker_1'
  );
  check('está en la base, no solo en la respuesta', persistido?.speakerName === 'Tomás Enrique Wilches Salsa');

  const sinNombre = await transcriptionStore.assignSpeakerName(FIRM, id, 'speaker_1', '   ');
  const trasBorrar = (sinNombre?.segments ?? []).find((s) => s.speakerLabel === 'speaker_1');
  check(
    'un nombre vacío lo quita en vez de guardar un blanco',
    trasBorrar !== undefined && !('speakerName' in trasBorrar),
    JSON.stringify(trasBorrar)
  );

  const ajena = await transcriptionStore.assignSpeakerName('otra-firma', id, 'speaker_1', 'Intruso');
  check('otra firma no puede nombrar nada', ajena === null);

  await supabase!.from('transcriptions').delete().eq('firm_id', FIRM);
  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exit(fallos === 0 ? 0 : 1);
})();
