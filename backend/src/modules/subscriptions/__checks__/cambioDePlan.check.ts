/**
 * Guards WHEN a paid period starts to run.
 *
 * Run with: npm run check:cambio-plan
 *
 * No database and no network: this is the one decision that separates a
 * renewal from a plan change, and it is the decision that moves a firm's
 * expiry date. Getting it backwards is money in both directions — a firm
 * enjoying a higher plan for free, or a firm losing days it paid for — and
 * neither is visible from the outside until a partner reads their expiry.
 *
 * The rule mirrored here is written in Postgres by
 * `supabase/migration-cambio-de-plan.sql`; the two must say the same thing.
 */
import { debeAdvertirCambio, decidirInicio, esCambioDePlan, periodoDelPago } from '../cambioDePlan.rules';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const dia = (s: string): Date => new Date(s);
const iso = (d: Date): string => d.toISOString();

const AHORA = dia('2026-09-09T15:00:00.000Z');
const VIGENTE = dia('2026-09-30T23:59:59.000Z'); // veintiún días por delante
const VENCIDO = dia('2026-08-01T23:59:59.000Z'); // más de un mes atrás

// ─── 1. Mismo plan, todavía vigente: RENUEVA y no pierde un día ─────────────
{
  const d = periodoDelPago({
    planActual: 'PREMIUM',
    planPagado: 'PREMIUM',
    vigenteHasta: VIGENTE,
    ahora: AHORA,
    period: 'MENSUAL'
  });
  check(
    'mismo plan vigente: el periodo arranca en el vencimiento, no hoy',
    d.inicio === 'DESDE_EL_VENCIMIENTO' && d.validFrom.getTime() === VIGENTE.getTime(),
    iso(d.validFrom)
  );
  check('mismo plan vigente: no es un cambio de plan', !d.esCambioDePlan);
  check(
    'mismo plan vigente mensual: vence un mes después del vencimiento anterior',
    iso(d.validUntil) === iso(dia('2026-10-30T23:59:59.000Z')),
    iso(d.validUntil)
  );
}

// ─── 2. Mismo plan, ya vencido: arranca hoy, sin cobrar lo no usado ─────────
{
  const d = periodoDelPago({
    planActual: 'ESENCIAL',
    planPagado: 'ESENCIAL',
    vigenteHasta: VENCIDO,
    ahora: AHORA,
    period: 'MENSUAL'
  });
  check(
    'mismo plan vencido: arranca hoy, la firma no paga el mes que no usó',
    d.inicio === 'AHORA' && d.validFrom.getTime() === AHORA.getTime(),
    iso(d.validFrom)
  );
  check('mismo plan vencido: sigue sin ser un cambio de plan', !d.esCambioDePlan);
}

// ─── 3. Plan distinto con días por delante: EL DEFECTO QUE SE CORRIGE ───────
{
  const d = periodoDelPago({
    planActual: 'ESENCIAL',
    planPagado: 'PREMIUM',
    vigenteHasta: VIGENTE,
    ahora: AHORA,
    period: 'MENSUAL'
  });
  check(
    'plan distinto vigente: el ciclo empieza el día del pago, no al vencer el anterior',
    d.inicio === 'AHORA' && d.validFrom.getTime() === AHORA.getTime(),
    iso(d.validFrom)
  );
  check('plan distinto vigente: se declara como cambio de plan', d.esCambioDePlan);
  check(
    'plan distinto vigente: el vencimiento NO se corre a partir del anterior',
    d.validUntil.getTime() < dia('2026-10-30T23:59:59.000Z').getTime() &&
      iso(d.validUntil) === iso(dia('2026-10-09T15:00:00.000Z')),
    iso(d.validUntil)
  );
  check(
    'plan distinto vigente: los días que quedaban no se acreditan',
    d.validFrom.getTime() < VIGENTE.getTime()
  );
}

// ─── 4. Plan distinto y ya vencido: arranca hoy, igual que renovar ──────────
{
  const d = periodoDelPago({
    planActual: 'PREMIUM',
    planPagado: 'FIRMA',
    vigenteHasta: VENCIDO,
    ahora: AHORA,
    period: 'ANUAL'
  });
  check(
    'plan distinto vencido: arranca hoy',
    d.inicio === 'AHORA' && d.validFrom.getTime() === AHORA.getTime(),
    iso(d.validFrom)
  );
  check('plan distinto vencido: sigue siendo un cambio de plan', d.esCambioDePlan);
  check(
    'plan distinto vencido anual: doce meses desde hoy',
    iso(d.validUntil) === iso(dia('2027-09-09T15:00:00.000Z')),
    iso(d.validUntil)
  );
}

// ─── 5. Sin plan previo: no hay nada que cambiar ────────────────────────────
{
  const d = periodoDelPago({
    planActual: null,
    planPagado: 'PREMIUM',
    vigenteHasta: null,
    ahora: AHORA,
    period: 'ANUAL'
  });
  check(
    'sin plan previo: arranca hoy y no se declara cambio de plan',
    d.inicio === 'AHORA' && !d.esCambioDePlan && d.validFrom.getTime() === AHORA.getTime()
  );
}
{
  // Cortesía: plan NULL con una fecha por delante. No es un cambio, así que
  // extiende — la firma no pierde lo que la casa ya le había concedido.
  const d = decidirInicio({
    planActual: null,
    planPagado: 'ESENCIAL',
    vigenteHasta: VIGENTE,
    ahora: AHORA
  });
  check(
    'cortesía con fecha por delante: extiende desde ella, porque no hay plan que cambiar',
    d.inicio === 'DESDE_EL_VENCIMIENTO' && !d.esCambioDePlan
  );
}

// ─── 6. Mismo plan, periodo distinto: ES RENOVACIÓN ─────────────────────────
{
  const d = periodoDelPago({
    planActual: 'PREMIUM',
    planPagado: 'PREMIUM',
    vigenteHasta: VIGENTE,
    ahora: AHORA,
    period: 'ANUAL'
  });
  check(
    'mensual a anual del mismo plan: es renovación y extiende desde el vencimiento',
    d.inicio === 'DESDE_EL_VENCIMIENTO' && !d.esCambioDePlan && d.validFrom.getTime() === VIGENTE.getTime()
  );
  check(
    'mensual a anual del mismo plan: doce meses desde el vencimiento',
    iso(d.validUntil) === iso(dia('2027-09-30T23:59:59.000Z')),
    iso(d.validUntil)
  );
}

// ─── La comparación es sobre el plan, en los dos sentidos ───────────────────
check('bajar de plan también es un cambio', esCambioDePlan('FIRMA', 'ESENCIAL'));
check('subir de plan es un cambio', esCambioDePlan('ESENCIAL', 'FIRMA'));
check('el mismo plan nunca es un cambio', !esCambioDePlan('PREMIUM', 'PREMIUM'));
check('sin plan previo nunca es un cambio', !esCambioDePlan(null, 'PREMIUM'));

// ─── Lo que la pantalla advierte antes de pagar ─────────────────────────────
check(
  'se advierte al cambiar de plan estando al día: son los días que va a perder',
  debeAdvertirCambio({ planActual: 'ESENCIAL', planPagado: 'FIRMA', vigenteHasta: VIGENTE, ahora: AHORA })
);
check(
  'no se advierte al cambiar de plan ya vencido: no hay días que perder',
  !debeAdvertirCambio({ planActual: 'ESENCIAL', planPagado: 'FIRMA', vigenteHasta: VENCIDO, ahora: AHORA })
);
check(
  'no se advierte al renovar el mismo plan: renovar nunca pierde días',
  !debeAdvertirCambio({ planActual: 'FIRMA', planPagado: 'FIRMA', vigenteHasta: VIGENTE, ahora: AHORA })
);
check(
  'no se advierte sin plan previo: no hay plan anterior del que perder días',
  !debeAdvertirCambio({ planActual: null, planPagado: 'PREMIUM', vigenteHasta: VIGENTE, ahora: AHORA })
);

// ─── La decisión no muta lo que recibe ──────────────────────────────────────
{
  const vence = dia('2026-09-30T23:59:59.000Z');
  const antes = iso(vence);
  const d = decidirInicio({ planActual: 'PREMIUM', planPagado: 'PREMIUM', vigenteHasta: vence, ahora: AHORA });
  d.validFrom.setUTCFullYear(2099);
  check('la fecha devuelta es una copia: tocarla no mueve el vencimiento de la firma', iso(vence) === antes);
}

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
