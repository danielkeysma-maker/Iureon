/**
 * Guards the Inicio screen against the promises the design mock makes and the
 * product does not.
 *
 * Run with: npm run check:inicio
 *
 * ─── EL DEFECTO QUE VIGILA ─────────────────────────────────────────────────
 *
 * El artboard de Inicio (`public/handoff/app-inicio.html`) se dibujó con datos
 * de muestra: «Se renueva en 18 días», «14 días de prueba del plan Premium»,
 * «$14.000 de saldo de cortesía», «2 afirmaciones sin comprobar». Ninguno es
 * verdad: no hay cobro automático, la prueba propia son 7 días de Esencial con
 * saldo cero, y ninguna revisión guarda ese conteo. Copiar la maqueta al pie
 * de la letra mete esas frases en la pantalla sin que nada falle.
 *
 * Y EL «NO SÉ → CERO». Si la agenda no se puede leer, la pantalla tiene que
 * decirlo y no pintar «no hay términos pendientes». Se comprueba que el error
 * tiene su propia rama y su propia frase.
 *
 * Se lee el componente como TEXTO y sin comentarios: los comentarios que
 * explican por qué no se dice «se renueva» contienen la frase.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { diasHastaVencer, haceCuanto, textoDelPlazo } from '../plazos';

const AQUI = dirname(fileURLToPath(import.meta.url));

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const VISTA = sinComentarios(readFileSync(join(AQUI, '..', 'components', 'InicioView.tsx'), 'utf8'));

/* ─── 1. LAS FRASES DE LA MAQUETA QUE NO SON VERDAD ─────────────────────── */
const PROHIBIDAS: ReadonlyArray<[RegExp, string]> = [
  [/se renueva/i, 'no hay cobro automático: el plan vence'],
  [/14\s+días/i, 'la prueba propia no son 14 días'],
  [/\$\s?14\.000/, 'no hay saldo de cortesía de $14.000'],
  [/saldo de cortes[ií]a/i, 'la prueba empieza con saldo cero'],
  [/afirmaciones sin comprobar/i, 'ninguna revisión guarda ese conteo']
];
for (const [patron, porque] of PROHIBIDAS) {
  check(`Inicio no dice ${patron}`, !patron.test(VISTA), porque);
}

check(
  'si nombra los días de la prueba gratuita, salen de la constante',
  !/DIAS_DE_PRUEBA_GRATUITA/.test(VISTA)
    ? !/\b\d+\s+días de prueba/i.test(VISTA)
    : /\{DIAS_DE_PRUEBA_GRATUITA\}/.test(VISTA),
  'ningún plazo de prueba escrito a mano'
);

/* ─── 2. EL ERROR DE LA AGENDA NO SE LEE COMO «NADA VENCE» ──────────────── */
check(
  'la lectura fallida de la agenda tiene su propio estado',
  /\.catch\(\(\) => \{[\s\S]{0,120}estado: 'error'/.test(VISTA),
  'el catch no puede dejar una lista vacía'
);
check(
  'y su propia frase, distinta de la del vacío',
  VISTA.includes('No se pudieron leer los vencimientos') && VISTA.includes('No hay términos pendientes')
);
check(
  '«no hay términos pendientes» solo se pinta con la agenda leída',
  /agenda\.estado === 'listo' && !hayVencimientos && agendaVacia/.test(VISTA) &&
    /agenda\.estado === 'error' && agendaFallida/.test(VISTA)
);

/* ─── 3. «ALCANZA PARA» SOLO CON LA CIFRA DEL SERVIDOR ──────────────────── */
const usosDeAlcanza = [...VISTA.matchAll(/Alcanza para/g)].map((m) => m.index ?? 0);
check(
  '«Alcanza para» solo aparece detrás de una comprobación de null',
  usosDeAlcanza.length > 0 &&
    usosDeAlcanza.every((i) => VISTA.slice(Math.max(0, i - 400), i).includes('escritosRestantes !== null')),
  `${usosDeAlcanza.length} uso(s)`
);

/* ─── 4. UN SOLO TÍTULO DE PÁGINA, Y LA RAÍZ SIGUE SIENDO LA QUE SE DESPLAZA ─ */
check('Inicio tiene un solo h1', (VISTA.match(/<h1\b/g) ?? []).length === 1);
check(
  'la raíz conserva la visita guiada, la cara nueva y el desplazamiento',
  /data-visita="vista-inicio"\s+className="cara-nueva [^"]*overflow-y-auto/.test(VISTA)
);

/* ─── 5. CUÁNTO FALTA, EN EL DÍA LOCAL ──────────────────────────────────── */
/*
 * Las 23:30 del 13 de septiembre, hora local. Con `new Date('2026-09-14')` —
 * medianoche UTC— un término de mañana se leía como de hoy en Colombia.
 */
const noche = new Date(2026, 8, 13, 23, 30);
check('vence hoy', diasHastaVencer('2026-09-13', noche) === 0);
check('vence mañana', diasHastaVencer('2026-09-14', noche) === 1);
check('vencido hace tres días', diasHastaVencer('2026-09-10', noche) === -3);
check(
  'pasada la medianoche local, el mismo término ya es de hoy',
  diasHastaVencer('2026-09-14', new Date(2026, 8, 14, 0, 5)) === 0
);
check(
  'una marca de tiempo se cuenta por su día local',
  diasHastaVencer(new Date(2026, 8, 14, 0, 30).toISOString(), noche) === 1
);
check('una fecha ilegible no se vuelve «hoy»', diasHastaVencer('no-es-fecha', noche) === null);

check('0 → «Vence hoy»', textoDelPlazo(0) === 'Vence hoy');
check('1 → «Vence mañana»', textoDelPlazo(1) === 'Vence mañana');
check('5 → «Quedan 5 días»', textoDelPlazo(5) === 'Quedan 5 días');
check('-1 → «Venció ayer»', textoDelPlazo(-1) === 'Venció ayer');
check('-4 → «Venció hace 4 días»: el vencido se dice', textoDelPlazo(-4) === 'Venció hace 4 días');
check('null → no se inventa un plazo', textoDelPlazo(null) === 'Fecha límite ilegible');

const mediodia = new Date(2026, 8, 13, 12, 0);
check('hace unos minutos', haceCuanto(new Date(2026, 8, 13, 11, 40).toISOString(), mediodia) === 'hace unos minutos');
check('hace 2 horas', haceCuanto(new Date(2026, 8, 13, 10, 0).toISOString(), mediodia) === 'hace 2 horas');
check('anoche es «ayer», no «hace 13 horas»', haceCuanto(new Date(2026, 8, 12, 23, 0).toISOString(), mediodia) === 'ayer');
check('hace 3 días', haceCuanto(new Date(2026, 8, 10, 9, 0).toISOString(), mediodia) === 'hace 3 días');

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
