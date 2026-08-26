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
  balanceOf,
  chargeOperation,
  ensureBalance,
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
    await ensureBalance(A.user.firmId, 'BORRADOR');
  } catch (err) {
    sinSaldo = err instanceof BillingError ? err.code : 'otro error';
  }
  check('una firma sin saldo no puede empezar', sinSaldo === 'INSUFFICIENT_CREDITS', sinSaldo);

  await recargar(A.user.firmId, PRECIO * 2);
  let conSaldo = 'pasó';
  try {
    await ensureBalance(A.user.firmId, 'BORRADOR');
  } catch {
    conSaldo = 'rechazó con saldo suficiente';
  }
  check('con saldo suficiente sí empieza', conSaldo === 'pasó', conSaldo);

  // ─── El consumo se registra con su costo real ─────────────────────────────
  const op1 = `1111${m}`.slice(0, 8).padEnd(8, '0');
  const operacion1 = `${op1}-0000-4000-8000-${String(m).slice(-12).padStart(12, '0')}`;

  await recordUsage({
    firmId: A.user.firmId,
    userEmail: A.user.email,
    operation: 'BORRADOR',
    operationId: operacion1,
    usage: { model: 'google/gemini-3.7-flash', promptTokens: 1200, completionTokens: 800, costUsd: 0.00037125 }
  });

  const { data: filas } = await c.from('ai_usage').select('*').eq('operation_id', operacion1);
  check('el consumo queda con su costo en dólares', (filas ?? []).length === 1, JSON.stringify((filas ?? [])[0]?.cost_usd));

  // ─── El cobro descuenta de verdad ─────────────────────────────────────────
  const antes = await balanceOf(A.user.firmId);
  const cobro = await chargeOperation({
    firmId: A.user.firmId,
    userEmail: A.user.email,
    operation: 'BORRADOR',
    operationId: operacion1,
    description: 'Borrador de prueba'
  });

  check('el cobro descuenta el precio', cobro.balance === antes - PRECIO, `${antes} -> ${cobro.balance}`);
  check('y el saldo persiste en la base', (await balanceOf(A.user.firmId)) === cobro.balance);

  const movs = await movements(A.user.firmId);
  check(
    'queda un movimiento que explica el saldo',
    movs[0]?.kind === 'CONSUMO' && movs[0]?.amountCop === -PRECIO && movs[0]?.balanceAfterCop === cobro.balance,
    JSON.stringify(movs[0])
  );

  /*
   * ─── DOS BORRADORES A LA VEZ ─────────────────────────────────────────────
   *
   * El caso que justifica que el débito sea una sola sentencia. Con lectura,
   * resta en la aplicación y escritura, ambas peticiones leen el mismo saldo y
   * ambas escriben el mismo resultado: la firma paga UN borrador de dos. Con
   * dos abogados de la misma firma redactando al tiempo eso no es improbable.
   */
  await recargar(B.user.firmId, PRECIO * 3);
  const saldoInicialB = await balanceOf(B.user.firmId);

  const cobros = await Promise.all(
    [1, 2, 3].map((n) =>
      chargeOperation({
        firmId: B.user.firmId,
        userEmail: B.user.email,
        operation: 'BORRADOR',
        operationId: `2222${String(n)}${m}`.slice(0, 8) + '-0000-4000-8000-' + String(m + n).slice(-12).padStart(12, '0'),
        description: `Borrador simultáneo ${n}`
      }).catch(() => null)
    )
  );

  const exitosos = cobros.filter(Boolean).length;
  const saldoFinalB = await balanceOf(B.user.firmId);

  check(
    'tres cobros simultáneos descuentan tres veces',
    saldoFinalB === saldoInicialB - PRECIO * exitosos && exitosos === 3,
    `${exitosos} cobros · ${saldoInicialB} -> ${saldoFinalB}`
  );

  // ─── No se puede gastar más de lo que hay ─────────────────────────────────
  let sobregiro = '';
  try {
    await chargeOperation({
      firmId: B.user.firmId,
      userEmail: B.user.email,
      operation: 'BORRADOR',
      operationId: `3333${m}`.slice(0, 8) + '-0000-4000-8000-' + String(m).slice(-12).padStart(12, '0'),
      description: 'Uno de más'
    });
  } catch (err) {
    sobregiro = err instanceof BillingError ? err.code : 'otro error';
  }
  check('no se puede cobrar sin saldo', sobregiro === 'INSUFFICIENT_CREDITS', sobregiro);
  check('y el saldo no queda negativo', (await balanceOf(B.user.firmId)) === 0, String(await balanceOf(B.user.firmId)));

  // ─── Aislamiento ──────────────────────────────────────────────────────────
  const resumenA = await usageSummary(A.user.firmId);
  const resumenB = await usageSummary(B.user.firmId);
  check(
    'cada firma ve solo su propio consumo',
    resumenA.spentCop === PRECIO && resumenB.spentCop === PRECIO * 3,
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
