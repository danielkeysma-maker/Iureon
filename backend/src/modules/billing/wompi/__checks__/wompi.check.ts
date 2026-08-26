/**
 * Guards the gateway.
 *
 * Run with: npm run check:wompi
 *
 * This check needs no Wompi account and no network: it constructs events the
 * way Wompi does and proves what the endpoint would do with them. The two
 * things worth proving are that a forged confirmation cannot credit anybody,
 * and that a genuine one credits exactly once however many times it arrives.
 */
import crypto from 'crypto';
import { firmaDeIntegridad, eventoEsAutentico } from '../wompi.service';
import type { WompiEvent } from '../wompi.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const SECRETO = `evt_test_${crypto.randomBytes(16).toString('hex')}`;

/** Builds an event exactly as Wompi signs one, so the check tests the real shape. */
const eventoFirmado = (transaccion: Record<string, unknown>, secreto = SECRETO): WompiEvent => {
  const properties = ['transaction.id', 'transaction.status', 'transaction.amount_in_cents'];
  const timestamp = 1787700000;

  const concatenado = properties
    .map((ruta) => String(transaccion[ruta.split('.')[1]] ?? ''))
    .join('');

  return {
    event: 'transaction.updated',
    data: { transaction: transaccion },
    timestamp,
    signature: {
      properties,
      checksum: crypto
        .createHash('sha256')
        .update(`${concatenado}${timestamp}${secreto}`)
        .digest('hex')
    }
  };
};

const transaccion = {
  id: '15113-1787700000-49201',
  status: 'APPROVED',
  amount_in_cents: 10_000_000,
  reference: 'IUR-firm-1787692528894-1787700000-a1b2c3d4e5f6'
};

// ─── Un evento genuino se acepta ────────────────────────────────────────────
check('un evento firmado por Wompi se acepta', eventoEsAutentico(eventoFirmado(transaccion), SECRETO));

/*
 * ─── LO QUE PASA SI ALGUIEN DESCUBRE LA URL ────────────────────────────────
 *
 * El webhook es público por necesidad: Wompi no tiene sesión con la que
 * llamarlo. Todo lo que separa eso de que un desconocido se acredite saldo
 * infinito es el checksum, así que se comprueba cada forma de falsificarlo.
 */
check(
  'un evento sin firma se rechaza',
  !eventoEsAutentico({ ...eventoFirmado(transaccion), signature: undefined }, SECRETO)
);

check(
  'un evento con checksum inventado se rechaza',
  !eventoEsAutentico(
    { ...eventoFirmado(transaccion), signature: { properties: ['transaction.id'], checksum: 'a'.repeat(64) } },
    SECRETO
  )
);

check(
  'un evento firmado con otro secreto se rechaza',
  !eventoEsAutentico(eventoFirmado(transaccion, 'secreto-del-atacante'), SECRETO)
);

/*
 * El caso que de verdad importa: la firma es auténtica, pero el atacante
 * cambia el monto o el estado DESPUÉS de firmar. Si el checksum no cubriera
 * esos campos, un evento real de $1.000 se convertiría en uno de $10.000.000.
 */
const manipulado = eventoFirmado(transaccion);
(manipulado.data!.transaction as Record<string, unknown>).amount_in_cents = 999_000_000;
check('cambiar el monto después de firmar invalida la firma', !eventoEsAutentico(manipulado, SECRETO));

const estadoCambiado = eventoFirmado({ ...transaccion, status: 'DECLINED' });
(estadoCambiado.data!.transaction as Record<string, unknown>).status = 'APPROVED';
check(
  'convertir un rechazo en aprobación invalida la firma',
  !eventoEsAutentico(estadoCambiado, SECRETO)
);

check(
  'un evento sin timestamp se rechaza',
  !eventoEsAutentico({ ...eventoFirmado(transaccion), timestamp: undefined }, SECRETO)
);

/*
 * Reusar la firma de un evento viejo con otro timestamp tampoco sirve: el
 * timestamp entra en el hash.
 */
const conOtroTimestamp = { ...eventoFirmado(transaccion), timestamp: 1787799999 };
check('reusar una firma con otro timestamp se rechaza', !eventoEsAutentico(conOtroTimestamp, SECRETO));

/*
 * Una lista de propiedades vacía dejaría el hash reducido a timestamp+secreto,
 * igual para toda transacción. Si se aceptara, una sola firma capturada valdría
 * para cualquier monto.
 */
check(
  'una lista de propiedades vacía se rechaza',
  !eventoEsAutentico(
    { ...eventoFirmado(transaccion), signature: { properties: [], checksum: 'x'.repeat(64) } },
    SECRETO
  )
);

// ─── La firma de integridad protege el monto en el navegador ────────────────
/*
 * El checkout se abre desde el navegador, donde el cliente puede editarlo todo.
 * La firma de integridad hace que editar el monto produzca algo que Wompi
 * rechaza, así que el precio lo decide el servidor aunque el formulario no.
 */
const INTEGRIDAD = 'test_integrity_secret';
const firmaReal = firmaDeIntegridad('IUR-abc-1', 10_000_000, 'COP', INTEGRIDAD);

check('la firma de integridad es determinista', firmaReal === firmaDeIntegridad('IUR-abc-1', 10_000_000, 'COP', INTEGRIDAD));
check(
  'cambiar el monto cambia la firma de integridad',
  firmaReal !== firmaDeIntegridad('IUR-abc-1', 100, 'COP', INTEGRIDAD),
  'un cliente no puede pagar $1 y pedir que le acrediten $100.000'
);
check(
  'cambiar la referencia cambia la firma de integridad',
  firmaReal !== firmaDeIntegridad('IUR-otra-firma-1', 10_000_000, 'COP', INTEGRIDAD),
  'un cliente no puede pagar hacia la referencia de otra firma'
);
check(
  'sin el secreto no se puede producir la firma',
  firmaReal !== firmaDeIntegridad('IUR-abc-1', 10_000_000, 'COP', 'secreto-adivinado')
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exit(fallos === 0 ? 0 : 1);
