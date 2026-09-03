/**
 * Guards the money.
 *
 * Run with: npm run check:billing
 *
 * Every firm draws from one OpenRouter account, so a per-firm balance only
 * means something if the debit is real, attributed and atomic. The concurrency
 * case is the one worth testing hardest: read-modify-write loses money silently
 * the first time two lawyers of the same firm draft at once, and nothing on
 * screen ever says so.
 */
import { supabase } from '../../../config/supabase.config';
import { clavePrueba, crearFirmaConSesion } from '../../auth/__checks__/helpers';
import {
  BillingError,
  PRICE_COP,
  maxOutputTokensFor,
  priceFor,
  MIN_RECHARGE_COP,
  rechargeFeeCop,
  balanceOf,
  refundReservation,
  reserveForOperation,
  settleOperation,
  movements,
  recordUsage,
  usageSummary
} from '../billing.service';

const m = Date.now();
let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const PRECIO = PRICE_COP.BORRADOR;
/** El markup del servicio, para comprobar que el margen aguanta la pasarela. */
const MARKUP_ESPERADO = 2.3;

(async () => {
  const c = supabase!;

  const A = await crearFirmaConSesion({
    firmName: `Cobro A ${m}`,
    nit: `995${m}`,
    email: `fa${m}@iureon.test`,
    password: clavePrueba()
  });
  const B = await crearFirmaConSesion({
    firmName: `Cobro B ${m}`,
    nit: `996${m}`,
    email: `fb${m}@iureon.test`,
    password: clavePrueba()
  });

  const recargar = (firmId: string, monto: number) =>
    c.from('firms').update({ credit_balance_cop: monto }).eq('firm_id', firmId);

  // ─── Sin saldo no se empieza ──────────────────────────────────────────────
  let sinSaldo = '';
  try {
    await reserveForOperation({ firmId: A.user.firmId, userEmail: A.user.email, operation: 'BORRADOR' });
  } catch (err) {
    sinSaldo = err instanceof BillingError ? err.code : 'otro error';
  }
  check('una firma sin saldo no puede empezar', sinSaldo === 'INSUFFICIENT_CREDITS', sinSaldo);

  await recargar(A.user.firmId, PRECIO * 2);
  const reserva = await reserveForOperation({
    firmId: A.user.firmId,
    userEmail: A.user.email,
    operation: 'BORRADOR'
  });
  check('reservar toma el precio de piso al empezar', reserva.reserved === PRECIO, `$${reserva.reserved}`);
  check('y el saldo baja de inmediato', reserva.balance === PRECIO, `$${reserva.balance}`);

  // ─── El consumo se registra con su costo real ─────────────────────────────
  const op1 = `1111${m}`.slice(0, 8).padEnd(8, '0');
  const operacion1 = `${op1}-0000-4000-8000-${String(m).slice(-12).padStart(12, '0')}`;

  await recordUsage({
    firmId: A.user.firmId,
    userEmail: A.user.email,
    operation: 'BORRADOR',
    operationId: operacion1,
    usage: { model: 'google/gemini-3.8-flash', promptTokens: 1200, completionTokens: 800, costUsd: 0.00037125 }
  });

  const { data: filas } = await c.from('ai_usage').select('*').eq('operation_id', operacion1);
  check('el consumo queda con su costo en dólares', (filas ?? []).length === 1, JSON.stringify((filas ?? [])[0]?.cost_usd));

  // ─── El cobro descuenta de verdad ─────────────────────────────────────────
  const antes = await balanceOf(A.user.firmId);
  const cobro = await settleOperation({
    firmId: A.user.firmId,
    userEmail: A.user.email,
    operation: 'BORRADOR',
    operationId: operacion1,
    description: 'Borrador de prueba',
    reserved: reserva.reserved
  });

  check('un documento normal no cobra nada extra al liquidar', cobro.balance === antes, `${antes} -> ${cobro.balance}`);
  check('y el total cobrado es el piso', cobro.charged === PRECIO, `$${cobro.charged}`);

  const movs = await movements(A.user.firmId);
  check(
    'queda un movimiento que explica el saldo',
    movs[0]?.kind === 'CONSUMO' && movs[0]?.amountCop === -PRECIO && movs[0]?.balanceAfterCop === cobro.balance,
    JSON.stringify(movs[0])
  );

  /*
   * ─── TRES ABOGADOS DE LA MISMA FIRMA, AL MISMO TIEMPO ────────────────────
   *
   * Este era un agujero real y está demostrado contra la base: con saldo para
   * UN borrador, los tres pasaban la comprobación, los tres generaban, y solo
   * uno se podía cobrar. Dos documentos escritos, pagados a OpenRouter y no
   * facturables.
   *
   * Con reserva, exactamente tantos abogados arrancan como el saldo aguanta, y
   * a los demás se les dice ANTES de llamar a ningún modelo.
   */
  await recargar(B.user.firmId, PRECIO);   // alcanza para UNO
  const saldoInicialB = await balanceOf(B.user.firmId);

  const intentos = await Promise.all(
    [1, 2, 3].map((n) =>
      reserveForOperation({
        firmId: B.user.firmId,
        userEmail: `abogado${n}@firma.co`,
        operation: 'BORRADOR'
      })
        .then(() => 'arranca')
        .catch(() => 'bloqueado')
    )
  );

  const arrancaron = intentos.filter((x) => x === 'arranca').length;
  const saldoTrasReservas = await balanceOf(B.user.firmId);

  check(
    'con saldo para uno, solo UNO arranca',
    arrancaron === 1,
    `${arrancaron} de 3 · ${intentos.join(', ')}`
  );
  check(
    'y el saldo refleja exactamente esa reserva',
    saldoTrasReservas === saldoInicialB - PRECIO,
    `${saldoInicialB} -> ${saldoTrasReservas}`
  );

  /*
   * ─── UN BORRADOR QUE FALLA DEVUELVE LA RESERVA ───────────────────────────
   *
   * El cobro por adelantado solo es aceptable si un fallo lo devuelve: una
   * firma no puede pagar por un documento que nunca existió.
   */
  await refundReservation({
    firmId: B.user.firmId,
    userEmail: 'abogado1@firma.co',
    operation: 'BORRADOR',
    reason: 'Devolución de prueba'
  });
  check('un fallo devuelve la reserva', (await balanceOf(B.user.firmId)) === saldoInicialB, String(await balanceOf(B.user.firmId)));

  const movsB = await movements(B.user.firmId);
  check('y la devolución queda registrada', movsB[0]?.kind === 'DEVOLUCION', JSON.stringify(movsB[0]?.kind));

  // ─── No se puede gastar más de lo que hay ─────────────────────────────────
  await c.from('firms').update({ credit_balance_cop: 0 }).eq('firm_id', B.user.firmId);

  let sobregiro = '';
  try {
    await reserveForOperation({ firmId: B.user.firmId, userEmail: B.user.email, operation: 'BORRADOR' });
  } catch (err) {
    sobregiro = err instanceof BillingError ? err.code : 'otro error';
  }
  check('sin saldo no se reserva', sobregiro === 'INSUFFICIENT_CREDITS', sobregiro);
  check('y el saldo no queda negativo', (await balanceOf(B.user.firmId)) === 0, String(await balanceOf(B.user.firmId)));

  /*
   * ─── UN DOCUMENTO LARGO CUESTA MÁS ───────────────────────────────────────
   *
   * Con precio plano, todo escrito de más de ~27 páginas se redactaba a
   * pérdida: cuesta $2.862 y se cobraban $2.000. El precio ahora tiene piso, no
   * techo, y el margen se sostiene en cualquier extensión.
   */
  check('un documento corto paga el precio de piso', priceFor('BORRADOR', 0.05) === PRECIO, String(priceFor('BORRADOR', 0.05)));

  const costoLargo = 0.7157; // ~40 páginas, medido contra los precios reales
  const cobroLargo = priceFor('BORRADOR', costoLargo);
  const margenLargo = (cobroLargo - costoLargo * 4000) / cobroLargo;

  check('un documento extenso cobra más que el piso', cobroLargo > PRECIO, `$${cobroLargo}`);
  check(
    'y el margen se mantiene por encima del 50%',
    margenLargo > 0.5,
    `${(margenLargo * 100).toFixed(1)}%`
  );
  check(
    'el costo nunca supera al cobro',
    costoLargo * 4000 < cobroLargo,
    `costo $${(costoLargo * 4000).toFixed(0)} vs cobro $${cobroLargo}`
  );

  /*
   * ─── EL SALDO LIMITA LA EXTENSIÓN ────────────────────────────────────────
   *
   * Para que una firma no pueda generar lo que no puede pagar, ni recibir un
   * escrito cortado por una regla que nadie le contó.
   */
  const topeSinSaldo = maxOutputTokensFor(0);
  const topeChico = maxOutputTokensFor(5000);
  const topeGrande = maxOutputTokensFor(500000);

  check('sin saldo el tope es mínimo', (topeSinSaldo ?? 0) <= 512, String(topeSinSaldo));
  check('con más saldo el tope crece', (topeChico ?? 0) > (topeSinSaldo ?? 0), `${topeSinSaldo} -> ${topeChico}`);
  check('con saldo holgado no hay tope', topeGrande === undefined, String(topeGrande));


  /*
   * ─── LA RECARGA MÍNIMA ───────────────────────────────────────────────────
   *
   * $100.000 no es un número elegido a gusto: sale de la comisión de Wompi,
   * 2,65% + $700 + IVA por transacción exitosa. El porcentaje cuesta lo mismo
   * en cualquier monto; los $700 son un peaje por recarga, y son ellos los que
   * hacen cara una recarga pequeña.
   *
   * Se comprueba la aritmética y el efecto, no la cifra: si mañana cambia la
   * tarifa, lo que tiene que fallar es el mínimo, no una constante repetida.
   */
  check(
    'la comisión de Wompi se calcula con IVA sobre la comisión, no sobre la recarga',
    rechargeFeeCop(100_000) === 3987,
    `$${rechargeFeeCop(100_000)}`
  );

  const pesoFijo = (monto: number): number => rechargeFeeCop(monto) / monto;

  check(
    'una recarga pequeña sale proporcionalmente más cara',
    pesoFijo(50_000) > pesoFijo(500_000),
    `$50.000 = ${(pesoFijo(50_000) * 100).toFixed(1)}% vs $500.000 = ${(pesoFijo(500_000) * 100).toFixed(1)}%`
  );

  check(
    'en el mínimo la comisión se queda por debajo del 4,1%',
    pesoFijo(MIN_RECHARGE_COP) < 0.041,
    `${(pesoFijo(MIN_RECHARGE_COP) * 100).toFixed(2)}%`
  );

  /*
   * El mínimo solo sirve si el margen lo aguanta. Con markup 2,3 el margen es
   * ~56%; la pasarela se lleva ~4% de lo recargado, así que el negocio tiene
   * que seguir en pie DESPUÉS de pagarla, o el mínimo está mal puesto.
   */
  const margenBruto = 1 - 1 / MARKUP_ESPERADO;
  const margenNeto = margenBruto - pesoFijo(MIN_RECHARGE_COP);
  check(
    'el margen sobrevive a la comisión de la pasarela',
    margenNeto > 0.5,
    `${(margenBruto * 100).toFixed(1)}% -> ${(margenNeto * 100).toFixed(1)}%`
  );

  check(
    'el mínimo alcanza para varias operaciones, no para una',
    MIN_RECHARGE_COP / PRECIO >= 10,
    `${Math.floor(MIN_RECHARGE_COP / PRECIO)} borradores`
  );

  // ─── Aislamiento ──────────────────────────────────────────────────────────
  const resumenA = await usageSummary(A.user.firmId);
  const resumenB = await usageSummary(B.user.firmId);
  check(
    'cada firma ve solo su propio consumo',
    resumenA.spentCop === PRECIO && resumenB.spentCop === 0,
    `A=${resumenA.spentCop} B=${resumenB.spentCop}`
  );
  check('el resumen reporta el costo real en dólares', resumenA.costUsd > 0, String(resumenA.costUsd));

  // ─── Limpieza ─────────────────────────────────────────────────────────────
  const ids = [A.user.firmId, B.user.firmId];
  await c.from('ai_usage').delete().in('firm_id', ids);
  await c.from('credit_movements').delete().in('firm_id', ids);
  const { data: usuarios } = await c.auth.admin.listUsers();
  for (const u of usuarios.users) {
    if (u.email?.includes(String(m))) await c.auth.admin.deleteUser(u.id);
  }
  await c.from('firms').delete().in('firm_id', ids);

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exit(fallos === 0 ? 0 : 1);
})();
