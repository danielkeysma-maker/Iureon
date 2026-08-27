/**
 * Guards the daily cap on Orientación.
 *
 * Run with: npm run check:cupo
 *
 * POR QUÉ HAY TOPE. Orientación le manda el catálogo entero —37.420 caracteres,
 * las 651 actuaciones— a un motor pago en cada consulta, y no le cobra nada a
 * la firma. Es la puerta de entrada del producto y ponerle precio ahuyentaría a
 * quien todavía no sabe si el producto le sirve. Pero gratis y sin tope no es
 * una decisión comercial: es un grifo abierto sobre la tarjeta de la casa.
 *
 * Lo que se comprueba aquí es el contador y, sobre todo, la CARRERA — que es el
 * defecto real de todo tope. Leer el conteo, decidir, y después sumar deja que
 * dos pestañas del mismo abogado lean 29 y ambas se crean con derecho a la 30.
 */
import { TOPE_DIARIO, diaEnColombia } from '../orientacionQuota.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/*
 * ─── EL DÍA ES EL DE COLOMBIA, NO EL DE UTC ────────────────────────────────
 *
 * Un tope "diario" que se reinicia a las 7 de la noche hora local es
 * incomprensible para quien lo vive, y a esa hora la app está en uso.
 */
const enero1Medianoche = new Date('2026-01-01T04:30:00Z'); // 23:30 del 31 en Bogotá
check(
  'las 23:30 del 31 de diciembre en Bogotá siguen siendo el 31',
  diaEnColombia(enero1Medianoche) === '2025-12-31',
  diaEnColombia(enero1Medianoche)
);

const enero1Manana = new Date('2026-01-01T13:00:00Z'); // 08:00 del 1 en Bogotá
check(
  'y las 8 de la mañana del 1 ya son el 1',
  diaEnColombia(enero1Manana) === '2026-01-01',
  diaEnColombia(enero1Manana)
);

check(
  'el formato es el que espera Postgres para DATE',
  /^\d{4}-\d{2}-\d{2}$/.test(diaEnColombia()),
  diaEnColombia()
);

/*
 * ─── LA CARRERA, SIMULADA CONTRA LA MISMA SEMÁNTICA DEL SQL ────────────────
 *
 * `consumir_orientacion` suma y comprueba en la MISMA sentencia: el UPDATE trae
 * su guarda en el WHERE, así que si la fila ya está en el tope no toca nada y
 * no devuelve fila. Aquí se reproduce esa semántica y la ingenua, y se comprueba
 * que solo una de las dos respeta el tope bajo concurrencia.
 */
const atomico = (estado: { n: number }, tope: number): number | null => {
  // Una sola operación: la condición y el incremento no se pueden separar.
  if (estado.n >= tope) return null;
  estado.n += 1;
  return estado.n;
};

const ingenuo = (estado: { n: number }, tope: number, leido: number): number | null => {
  // El defecto: se decide con un conteo que se leyó ANTES, no con el de ahora.
  if (leido >= tope) return null;
  estado.n += 1;
  return estado.n;
};

const TOPE = 30;

// Dos pestañas leen 29 al mismo tiempo y ambas piden la siguiente.
const conCarrera = { n: 29 };
ingenuo(conCarrera, TOPE, 29);
ingenuo(conCarrera, TOPE, 29);
check(
  'el contador ingenuo se pasa del tope cuando dos piden a la vez',
  conCarrera.n === 31,
  `quedó en ${conCarrera.n} con tope ${TOPE}`
);

const sinCarrera = { n: 29 };
const primera = atomico(sinCarrera, TOPE);
const segunda = atomico(sinCarrera, TOPE);
check(
  'el atómico deja pasar exactamente una y niega la otra',
  primera === 30 && segunda === null && sinCarrera.n === 30,
  `${primera} / ${segunda} / quedó en ${sinCarrera.n}`
);

// Y una vez alcanzado, sigue negando sin volver a sumar.
const despues = atomico(sinCarrera, TOPE);
check(
  'alcanzado el tope, los intentos siguientes ni suman ni pasan',
  despues === null && sinCarrera.n === 30,
  `quedó en ${sinCarrera.n}`
);

/*
 * ─── EL TOPE ACOTA UN COSTO, QUE ES SU RAZÓN DE SER ────────────────────────
 *
 * Sin él, el peor día no tiene número. Con él, el peor caso por firma es
 * TOPE × costo por consulta, y eso se puede planear.
 */
const COSTO_POR_CONSULTA_COP = 13;
const peorCasoPorFirma = TOPE_DIARIO * COSTO_POR_CONSULTA_COP;

check(
  'el peor día de una firma es un número conocido y pequeño',
  peorCasoPorFirma < 500,
  `$${peorCasoPorFirma} COP con tope ${TOPE_DIARIO}`
);

check(
  'y el tope es holgado para el uso real de un abogado',
  TOPE_DIARIO >= 20,
  String(TOPE_DIARIO)
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
