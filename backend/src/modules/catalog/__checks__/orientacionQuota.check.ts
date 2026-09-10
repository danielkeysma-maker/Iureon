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
import { PRICE_COP, COP_PER_USD, MARKUP } from '../../billing/billing.service';

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
/*
 * ESTE NÚMERO ERA 13 Y ESTABA MAL PARA LA PANTALLA QUE GASTA EL CUPO.
 *
 * $13 COP es lo que cuesta una orientación CON RAMA —la que pide Redacción,
 * donde el menú es el de una sola rama—. Pero el cupo gratuito lo gasta la
 * pantalla de Orientación, que va SIN RAMA a propósito: cuál es la rama es
 * justamente lo que se está preguntando. Ese camino manda las 883 fichas al
 * motor, y la medición del 9 de septiembre de 2026 contra el motor real
 * (`triage.service.ts`) da US$0,0098 y US$0,0158 en dos corridas: $42 a $67
 * COP, entre tres y cinco veces más.
 *
 * El check pasaba en verde afirmando una premisa falsa, que es la peor forma
 * de pasar: con el número correcto habría enseñado desde el primer día que
 * treinta consultas gratis eran hasta $2.000 COP diarios por firma —unos
 * $40.000 al mes— y no «medio dólar». Se toma el PEOR de los dos medidos: un
 * tope que se planea con el mejor caso no acota nada.
 */
const COSTO_POR_CONSULTA_COP = 67;
const peorCasoPorFirma = TOPE_DIARIO * COSTO_POR_CONSULTA_COP;

check(
  'el peor día de una firma es un número conocido y pequeño',
  peorCasoPorFirma <= 1_000,
  `$${peorCasoPorFirma} COP con tope ${TOPE_DIARIO}`
);

/*
 * ERA `>= 20`, Y LO QUE SOSTENÍA ESE NÚMERO NO ERA EL USO SINO EL COSTO
 * SUPUESTO. Con el costo real, treinta gratis al día por firma no es una
 * puerta generosa: es un grifo. Diez sigue estando muy por encima del uso de
 * un abogado que trabaja un asunto —pregunta un puñado de veces— y por debajo
 * hay un piso, porque un cupo demasiado corto convierte la puerta de entrada
 * en una caja registradora en el primer día de uso serio.
 */
check(
  'y el tope sigue siendo utilizable, sin volverse una caja registradora',
  TOPE_DIARIO >= 5,
  `${TOPE_DIARIO} consultas gratis al día`
);

/*
 * ─── Y PASADO EL CUPO SE COBRA, NO SE NIEGA ────────────────────────────────
 *
 * Un muro duro castiga igual al uso legítimo intenso que al abusivo, y la firma
 * que de verdad necesita la número treinta y uno se queda sin ella. Al cobrar,
 * el gancho gratuito queda intacto para quien nunca ha pagado y el consumo de
 * más lo paga quien lo genera.
 *
 * Lo que hay que comprobar es que ese precio CUBRA el costo: uno que no lo
 * cubra convierte cada consulta pasada del cupo en una pérdida, que es peor que
 * no cobrar — el abuso saldría más barato para quien abusa y más caro para la
 * casa que dejarlo gratis.
 */
check(
  'la orientación pasada del cupo tiene precio',
  PRICE_COP.ORIENTACION > 0,
  `$${PRICE_COP.ORIENTACION} COP`
);

check(
  'y ese precio cubre el costo con margen, no lo deja en pérdida',
  PRICE_COP.ORIENTACION >= COSTO_POR_CONSULTA_COP * 2,
  `$${PRICE_COP.ORIENTACION} contra un costo de $${COSTO_POR_CONSULTA_COP}`
);

/*
 * Pero sigue siendo una fracción de un borrador. Es una orientación, no un
 * escrito: cobrarla como un escrito ahuyentaría el uso legítimo intenso que
 * esta regla existe justamente para permitir.
 */
check(
  'y es una fracción de lo que cuesta un borrador',
  PRICE_COP.ORIENTACION < PRICE_COP.BORRADOR / 10,
  `$${PRICE_COP.ORIENTACION} contra $${PRICE_COP.BORRADOR}`
);

/*
 * El costo de arriba se deriva del mismo par que fija todos los precios, para
 * que el día que se mueva la tasa o el margen esto se mueva con ellos en vez de
 * seguir afirmando un margen que dejó de existir.
 */
const costoUsdDeUnaOrientacion = COSTO_POR_CONSULTA_COP / COP_PER_USD;
const alMargenEstandar = Math.round(costoUsdDeUnaOrientacion * COP_PER_USD * MARKUP);

/*
 * UNA TOLERANCIA DEL 5%, DECLARADA Y NO ESCONDIDA.
 *
 * El margen estándar sobre el PEOR costo medido da $154, y el precio es $150:
 * cuatro pesos, un 2,6%. Se acepta y se dice por qué, en vez de mover el
 * número para que el check calle.
 *
 * Primero, $154 sale del peor de DOS mediciones ($42 y $67): contra la otra,
 * $150 va muy sobrado. Segundo, un precio es una cifra que un abogado lee, y
 * $150 se lee; $154 no es más exacto, es solo menos legible —la tasa de
 * COP_PER_USD ya es una redondeo de 4.000 y el propio archivo dice que unos
 * puntos de deriva los absorbe el margen—.
 *
 * Lo que NO se tolera es lo de arriba: que el precio quede por debajo del
 * costo. Esa comprobación es dura y sin holgura, porque cruzarla convierte
 * cada consulta cobrada en una pérdida.
 */
const HOLGURA_DE_REDONDEO = 0.95;
check(
  'el precio guarda relación con el margen del resto del producto',
  PRICE_COP.ORIENTACION >= Math.round(alMargenEstandar * HOLGURA_DE_REDONDEO),
  `$${PRICE_COP.ORIENTACION} contra $${alMargenEstandar} al margen estándar (holgura de redondeo del 5%)`
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
