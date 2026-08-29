import { GUION_BASE, preguntasCubiertas } from '../guionDeEntrevista';
import type { TranscriptSegment } from '../../transcription/types';

/**
 * El guion de entrevista no puede tachar de más. Artboard 2a.
 *
 * Corre con: npm run check:guion (desde `frontend`)
 *
 * ─── POR QUÉ ESTE CHECK EXISTE ──────────────────────────────────────────────
 *
 * La heurística nació con un defecto que el código NO delataba al leerlo:
 * «día» y «dia» están escritas una debajo de la otra en la lista de señales y
 * parecen dos, pero al comparar sin acentos son la misma — así que una sola
 * palabra dicha de pasada tachaba la pregunta de la fecha del hecho.
 *
 * Y tachar de más es el error caro de este módulo: deja al abogado tranquilo
 * sobre algo que no preguntó, en la reunión donde se consigue el dato que
 * define el término. Lo destapó una prueba, no una relectura.
 *
 * SIN RED Y SIN MODELO. La cobertura la decide una regla de dos palabras
 * precisamente para que se pueda comprobar así.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const seg = (text: string): TranscriptSegment => ({
  speakerLabel: 'speaker_0',
  role: 'DESCONOCIDO',
  text,
  startSeconds: null,
  endSeconds: null
});

const cubiertas = (texto: string): string[] =>
  [...preguntasCubiertas([seg(texto)], GUION_BASE)].sort();

const igual = (a: string[], b: string[]): boolean =>
  JSON.stringify(a) === JSON.stringify([...b].sort());

/*
 * EL CASO QUE DESTAPÓ EL DEFECTO. Aquí solo se habló de la notificación; la
 * fecha del hecho NO se preguntó, y tacharla sería el error caro.
 */
check(
  'una sola palabra con y sin tilde no cuenta como dos señales',
  igual(cubiertas('Me notificaron el 18 de marzo y me enteré ese mismo día'), [
    'fecha-notificacion'
  ]),
  cubiertas('Me notificaron el 18 de marzo y me enteré ese mismo día').join(', ')
);

check(
  'una palabra suelta no basta para dar por cubierta una pregunta',
  igual(cubiertas('Hablamos de un documento cualquiera'), [])
);

check(
  'dos señales distintas sí la cubren',
  igual(cubiertas('Tengo la carta y una copia del certificado'), ['documentos'])
);

check(
  'la fecha del hecho se cubre cuando se habla de ella',
  igual(cubiertas('El hecho fue el 3 de febrero, ese dia paso todo'), ['fecha-hecho'])
);

check(
  'sin transcrito no hay nada cubierto: la lista arranca entera',
  preguntasCubiertas([], GUION_BASE).size === 0
);

/*
 * TODA PREGUNTA DEBE PODER CUBRIRSE. Una con menos de dos señales quedaría
 * tachada nunca — un recordatorio permanente que el abogado aprende a ignorar.
 */
const pocas = GUION_BASE.filter(
  (p) => new Set(p.senales.map((s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase())).size < 2
);
check(
  'toda pregunta tiene al menos dos señales distintas',
  pocas.length === 0,
  pocas.map((p) => p.id).join(', ')
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
