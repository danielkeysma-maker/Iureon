/**
 * Guards the period statement (extracto) that a firm prints from its ledger.
 *
 * Run with: npm run check:extracto
 *
 * The statement is arithmetic over `credit_movements`, and arithmetic over
 * money has to be exact: a total that is off by one movement is not a rounding
 * problem, it is a document that says the firm spent what it did not spend.
 * Every case here is the ledger of a real week, in the shape the server writes
 * it (newest first).
 */
import { limitesDelPeriodo, resumirPeriodo, type MovimientoDelLibro } from '../extracto';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const mov = (
  kind: string,
  amountCop: number,
  balanceAfterCop: number,
  description: string,
  createdAt: string
): MovimientoDelLibro => ({ kind, amountCop, balanceAfterCop, description, actorEmail: 'x@firma.co', createdAt });

/* ─── UNA SEMANA REAL, del más nuevo al más viejo, como la entrega el servidor ─── */
const semana: MovimientoDelLibro[] = [
  mov('AJUSTE', -95_950, 0, 'Ajuste del operador · Cierre de la prueba', '2026-09-05T20:00:00Z'),
  mov('CONSUMO', -50, 95_950, 'Resumen de audiencia · Audiencia inicial 2026-001', '2026-09-04T15:00:00Z'),
  mov('CONSUMO', -2_000, 96_000, 'Borrador: Recurso de reposición (documento extenso)', '2026-09-03T15:00:00Z'),
  mov('DEVOLUCION', 2_000, 98_000, 'el escrito no se generó', '2026-09-02T16:00:00Z'),
  mov('CONSUMO', -2_000, 96_000, 'Borrador: Demanda ejecutiva', '2026-09-02T15:00:00Z'),
  mov('CONSUMO', -50, 98_000, 'Orientación sobre hechos', '2026-09-02T14:00:00Z'),
  mov('CONSUMO', -1_950, 98_050, 'Borrador: Derecho de petición', '2026-09-01T15:00:00Z'),
  mov('RECARGA', 100_000, 100_000, 'Recarga del operador · Saldo de prueba', '2026-09-01T14:00:00Z')
];

const r = resumirPeriodo(semana);

check('el saldo inicial es el anterior al movimiento más viejo', r.saldoInicial === 0, String(r.saldoInicial));
check('el saldo final es el que dejó el movimiento más nuevo', r.saldoFinal === 0, String(r.saldoFinal));
check('las recargas se suman aparte', r.recargas.cantidad === 1 && r.recargas.total === 100_000);
check('los ajustes del operador se suman aparte, con su signo', r.ajustes.cantidad === 1 && r.ajustes.total === -95_950);
check('las devoluciones se suman aparte', r.devoluciones.cantidad === 1 && r.devoluciones.total === 2_000);

// Consumption is grouped by what the lawyer asked for, read from the concept.
check('tres borradores, contados aunque uno sea extenso', r.consumo.borradores.cantidad === 3, String(r.consumo.borradores.cantidad));
check('y su total suma el extenso al precio que se cobró', r.consumo.borradores.total === -5_950, String(r.consumo.borradores.total));
check('un resumen', r.consumo.resumenes.cantidad === 1 && r.consumo.resumenes.total === -50);
check('una orientación', r.consumo.orientaciones.cantidad === 1 && r.consumo.orientaciones.total === -50);
check('nada queda sin clasificar en esta semana', r.consumo.otros.cantidad === 0);
check('el consumo total es la suma de sus partes', r.consumo.total === -6_050, String(r.consumo.total));

// The identity that makes the document a statement and not a list:
// inicial + entradas + salidas = final. If this ever breaks, a row is being
// counted twice or not at all.
const entradas = r.recargas.total + r.devoluciones.total;
const salidas = r.consumo.total + r.ajustes.total;
check('inicial + entradas + salidas = final', r.saldoInicial + entradas + salidas === r.saldoFinal);
check('y el extracto lo declara así', r.entradas === entradas && r.salidas === salidas);

/* ─── UN CONSUMO QUE NO ENCAJA EN NINGÚN CONCEPTO NO DESAPARECE ─────────────── */
const raro = resumirPeriodo([mov('CONSUMO', -300, 700, 'Servicio nuevo sin nombre aún', '2026-09-01T10:00:00Z')]);
check('un consumo de concepto desconocido cae en «otros», no se pierde', raro.consumo.otros.cantidad === 1 && raro.consumo.otros.total === -300);
check('y el saldo inicial se reconstruye igual', raro.saldoInicial === 1_000);

/* ─── SIN MOVIMIENTOS: ceros, no NaN ni excepción ───────────────────────────── */
const vacio = resumirPeriodo([]);
check('sin movimientos, todo es cero', vacio.saldoInicial === 0 && vacio.saldoFinal === 0 && vacio.consumo.total === 0);

/* ─── EL PERÍODO SE CORTA EN HORA DE BOGOTÁ, no en UTC ──────────────────────── */
// A draft made at 9 pm in Bogotá on the 31st is 02:00 UTC on the 1st. It
// belongs to the month the lawyer was living in when it was made.
const agosto = limitesDelPeriodo('2026-08');
check('el mes empieza a medianoche de Bogotá (05:00 UTC)', agosto?.desde === '2026-08-01T05:00:00.000Z', agosto?.desde);
check('y termina donde empieza el siguiente', agosto?.hasta === '2026-09-01T05:00:00.000Z', agosto?.hasta);
check('diciembre pasa al enero del año siguiente', limitesDelPeriodo('2026-12')?.hasta === '2027-01-01T05:00:00.000Z');
check('un período mal formado se rechaza', limitesDelPeriodo('2026-13') === null && limitesDelPeriodo('ayer') === null);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
