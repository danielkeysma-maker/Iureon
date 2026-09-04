/**
 * Guards the plan rules.
 *
 * Run with: npm run check:plan
 *
 * No database, no network: everything here is the arithmetic of a subscription
 * — prices, the period a payment buys, the state a firm is in, the modules a
 * plan opens — proven against fixed dates. These are the numbers a partner is
 * charged and the rules that lock a firm out, so a drift in any of them is a
 * defect the lawyer notices before the build does.
 */
import {
  DIAS_DE_AVISO,
  PLANES,
  TODOS_LOS_MODULOS,
  cabeOtroUsuario,
  diasRestantes,
  estadoDelPlan,
  modulosPermitidos,
  periodoQueCompra,
  permiteModulo,
  planBloquea,
  precioDe,
  sumarMeses,
  type PlanRow
} from '../plan.catalog';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const iso = (d: Date): string => d.toISOString();
const dia = (s: string): Date => new Date(s);

// ─── Precios ────────────────────────────────────────────────────────────────
check('ESENCIAL mensual cuesta $70.000', precioDe('ESENCIAL', 'MENSUAL') === 70_000);
check('ESENCIAL anual cuesta $700.000', precioDe('ESENCIAL', 'ANUAL') === 700_000);
check('PREMIUM mensual cuesta $100.000', precioDe('PREMIUM', 'MENSUAL') === 100_000);
check('PREMIUM anual cuesta $1.000.000', precioDe('PREMIUM', 'ANUAL') === 1_000_000);
check(
  'el año son 12 meses por el precio de 10, en ambos planes',
  PLANES.ESENCIAL.precioAnualCop === PLANES.ESENCIAL.precioMensualCop * 10 &&
    PLANES.PREMIUM.precioAnualCop === PLANES.PREMIUM.precioMensualCop * 10
);
check('ESENCIAL admite 1 usuario y PREMIUM 5', PLANES.ESENCIAL.maxUsuarios === 1 && PLANES.PREMIUM.maxUsuarios === 5);

// ─── Módulos ────────────────────────────────────────────────────────────────
check(
  'ESENCIAL no incluye Audiencias, Entrevistas ni Orientación',
  !permiteModulo('ESENCIAL', 'AUDIENCIAS') &&
    !permiteModulo('ESENCIAL', 'ENTREVISTAS') &&
    !permiteModulo('ESENCIAL', 'ORIENTACION')
);
check(
  'ESENCIAL sí incluye los nueve módulos básicos',
  (['REDACCION', 'BORRADORES', 'REVISIONES', 'BUSCADOR', 'CATALOGO', 'HERRAMIENTAS', 'MANUAL', 'SOPORTE', 'MEMBRETE'] as const).every((m) =>
    permiteModulo('ESENCIAL', m)
  ) && PLANES.ESENCIAL.modulos.length === 9
);
check('PREMIUM incluye todos los módulos', TODOS_LOS_MODULOS.every((m) => permiteModulo('PREMIUM', m)) && TODOS_LOS_MODULOS.length === 12);
check(
  'una firma sin plan (cortesía legacy) ve todos los módulos',
  modulosPermitidos(null).length === TODOS_LOS_MODULOS.length && permiteModulo(null, 'ORIENTACION')
);

// ─── Meses como Postgres ────────────────────────────────────────────────────
check('31 de enero + 1 mes = 28 de febrero (no 3 de marzo)', iso(sumarMeses(dia('2027-01-31T10:00:00Z'), 1)) === '2027-02-28T10:00:00.000Z');
check('29 de febrero bisiesto + 12 meses = 28 de febrero', iso(sumarMeses(dia('2028-02-29T00:00:00Z'), 12)) === '2029-02-28T00:00:00.000Z');
check('15 de marzo + 1 mes = 15 de abril, misma hora', iso(sumarMeses(dia('2026-03-15T14:30:00Z'), 1)) === '2026-04-15T14:30:00.000Z');

// ─── El periodo que compra un pago ──────────────────────────────────────────
const ahora = dia('2026-09-04T12:00:00Z');

{
  const p = periodoQueCompra({ ahora, vigenteHasta: null, period: 'MENSUAL' });
  check('sin plan previo, el mes arranca hoy', iso(p.validFrom) === iso(ahora) && iso(p.validUntil) === '2026-10-04T12:00:00.000Z');
}
{
  const vigente = dia('2026-09-20T12:00:00Z');
  const p = periodoQueCompra({ ahora, vigenteHasta: vigente, period: 'MENSUAL' });
  check(
    'pagar antes de vencer EXTIENDE desde la fecha vigente: no se pierden días',
    iso(p.validFrom) === iso(vigente) && iso(p.validUntil) === '2026-10-20T12:00:00.000Z'
  );
}
{
  const vencido = dia('2026-08-01T12:00:00Z');
  const p = periodoQueCompra({ ahora, vigenteHasta: vencido, period: 'ANUAL' });
  check(
    'pagar después de vencer arranca hoy, no desde la fecha vencida',
    iso(p.validFrom) === iso(ahora) && iso(p.validUntil) === '2027-09-04T12:00:00.000Z'
  );
}
{
  const vigente = dia('2027-01-10T12:00:00Z');
  const p = periodoQueCompra({ ahora, vigenteHasta: vigente, period: 'ANUAL' });
  check('el año se suma a la fecha vigente futura', iso(p.validUntil) === '2028-01-10T12:00:00.000Z');
}

// ─── Estado ─────────────────────────────────────────────────────────────────
const fila = (parcial: Partial<PlanRow>): PlanRow => ({
  plan: null,
  period: null,
  validUntil: null,
  maxUsers: null,
  ...parcial
});

check('todo NULL = CORTESÍA legacy, y no bloquea', estadoDelPlan(fila({}), ahora) === 'CORTESIA' && !planBloquea(fila({}), ahora));
check(
  'CORTESIA explícita sin fecha = CORTESÍA, sin bloqueo',
  estadoDelPlan(fila({ plan: 'PREMIUM', period: 'CORTESIA' }), ahora) === 'CORTESIA'
);
check(
  'plan vigente con más de 7 días = ACTIVO',
  estadoDelPlan(fila({ plan: 'ESENCIAL', period: 'MENSUAL', validUntil: dia('2026-10-01T12:00:00Z') }), ahora) === 'ACTIVO'
);
check(
  'a 7 días o menos = POR_VENCER',
  estadoDelPlan(fila({ plan: 'ESENCIAL', period: 'MENSUAL', validUntil: dia('2026-09-11T12:00:00Z') }), ahora) === 'POR_VENCER' &&
    estadoDelPlan(fila({ plan: 'ESENCIAL', period: 'MENSUAL', validUntil: dia('2026-09-11T13:00:00Z') }), ahora) === 'ACTIVO'
);
check(
  'una prueba con más de 7 días = PRUEBA; en su última semana = POR_VENCER',
  estadoDelPlan(fila({ plan: 'PREMIUM', period: 'PRUEBA', validUntil: dia('2026-09-18T12:00:00Z') }), ahora) === 'PRUEBA' &&
    estadoDelPlan(fila({ plan: 'PREMIUM', period: 'PRUEBA', validUntil: dia('2026-09-08T12:00:00Z') }), ahora) === 'POR_VENCER'
);
{
  const vencida = fila({ plan: 'PREMIUM', period: 'ANUAL', validUntil: dia('2026-09-04T11:59:00Z') });
  check('un minuto después de vencer = VENCIDO y bloquea', estadoDelPlan(vencida, ahora) === 'VENCIDO' && planBloquea(vencida, ahora));
}
check(
  'una cortesía con fecha también vence',
  estadoDelPlan(fila({ plan: 'PREMIUM', period: 'CORTESIA', validUntil: dia('2026-01-01T00:00:00Z') }), ahora) === 'VENCIDO'
);
check('DIAS_DE_AVISO es 7', DIAS_DE_AVISO === 7);

// ─── Días restantes ─────────────────────────────────────────────────────────
check('sin vencimiento no hay días restantes', diasRestantes(null, ahora) === null);
check('30 horas restantes se leen como 2 días, no 1', diasRestantes(dia('2026-09-05T18:00:00Z'), ahora) === 2);
check('vencido hace dos días da -2', diasRestantes(dia('2026-09-02T12:00:00Z'), ahora) === -2);

// ─── Cupo de usuarios ───────────────────────────────────────────────────────
check('sin tope (cortesía) siempre cabe otro', cabeOtroUsuario(null, 40));
check('ESENCIAL con 1 usuario no admite otro', !cabeOtroUsuario(1, 1));
check('PREMIUM con 4 admite el quinto, con 5 no', cabeOtroUsuario(5, 4) && !cabeOtroUsuario(5, 5));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
