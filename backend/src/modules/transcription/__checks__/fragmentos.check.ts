import { mergeConsecutive, UMBRAL_CONFIANZA } from '../providers/deepgram.provider';
import type { TranscriptSegment } from '../types';

/**
 * Los fragmentos dudosos siguen señalando su texto tras la unión. Artboard 1g.
 *
 * Corre con: npm run check:fragmentos
 *
 * ─── POR QUÉ ESTO NECESITA PRUEBA ───────────────────────────────────────────
 *
 * 1g pide marcar SOLO el trozo que el motor oyó mal, no la intervención entera
 * —«el 95% del texto sí es fiable»—. Deepgram da confianza por enunciado y aquí
 * varios enunciados se unen en una intervención, así que las posiciones del
 * trozo flojo hay que DESPLAZARLAS al concatenar.
 *
 * Un desplazamiento mal calculado no rompe nada: subraya media frase corrida, y
 * el abogado va a releer la parte equivocada creyendo que es la dudosa. Es un
 * error silencioso sobre el texto que se va a citar en un escrito, y por eso se
 * comprueba con posiciones exactas en vez de confiar en la lectura del código.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const enunciado = (
  text: string,
  confianza: number,
  speakerLabel = 'speaker_0'
): TranscriptSegment => ({
  speakerLabel,
  role: 'DESCONOCIDO',
  text,
  startSeconds: null,
  endSeconds: null,
  confianza,
  fragmentosDudosos:
    confianza < UMBRAL_CONFIANZA
      ? [{ desde: 0, hasta: text.length, confianza }]
      : undefined
});

/* Bueno · DUDOSO · bueno, todo de la misma voz: se unen en una intervención. */
const unida = mergeConsecutive([
  enunciado('Se declara abierta la audiencia.', 0.98),
  enunciado('El dictamen obra a folio cuarenta y dos', 0.42),
  enunciado('y se procede a interrogar.', 0.95)
])[0];

check('la unión produce UNA intervención', unida !== undefined && unida.text.includes('folio'));

const marcados = (unida.fragmentosDudosos ?? []).map((f) => unida.text.slice(f.desde, f.hasta));

check(
  'solo se marca el trozo dudoso, no la intervención entera',
  marcados.length === 1 && marcados[0] === 'El dictamen obra a folio cuarenta y dos',
  marcados.join(' | ')
);

check(
  'lo fiable queda fuera de la marca',
  !marcados.join(' ').includes('Se declara abierta'),
  marcados.join(' | ')
);

/* Dos trozos flojos separados por uno bueno: las dos posiciones se desplazan. */
const dos = mergeConsecutive([
  enunciado('Primero claro.', 0.99),
  enunciado('segundo confuso', 0.3),
  enunciado('Tercero claro.', 0.97),
  enunciado('cuarto confuso', 0.2)
])[0];

const dosMarcados = (dos.fragmentosDudosos ?? []).map((f) => dos.text.slice(f.desde, f.hasta));

check(
  'dos trozos flojos separados conservan cada uno su posición',
  dosMarcados.length === 2 &&
    dosMarcados[0] === 'segundo confuso' &&
    dosMarcados[1] === 'cuarto confuso',
  dosMarcados.join(' | ')
);

/* Voces distintas NO se unen: cada intervención conserva lo suyo. */
const separadas = mergeConsecutive([
  enunciado('Habla el juez.', 0.99, 'speaker_0'),
  enunciado('responde confuso', 0.3, 'speaker_1')
]);

check(
  'voces distintas no se unen y el fragmento no viaja a la otra',
  separadas.length === 2 && separadas[0].fragmentosDudosos === undefined,
  `${separadas.length} intervenciones`
);

/* La confianza de la intervención unida es la PEOR, no el promedio. */
check(
  'la intervención unida hereda la confianza más baja',
  unida.confianza === 0.42,
  String(unida.confianza)
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
