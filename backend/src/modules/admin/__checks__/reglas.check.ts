/**
 * Guards the pure rules of the operator's support actions.
 *
 * Run with: npm run check:admin-reglas
 *
 * No database, no network (unlike `admin.check.ts`, which needs Supabase and
 * is therefore not in CI). Deleting a firm is irreversible, so the rules that
 * stand between the button and the delete — the typed name, the reason, the
 * operator's own firm — are proven here against fixed inputs.
 */
import {
  CORPUS_COMPARTIDO,
  MIN_CONTRASENA_OPERADOR,
  MIN_MOTIVO_BORRADO,
  validarBorradoDeFirma,
  validarContrasenaDeOperador
} from '../admin.rules';
import { AuthError } from '../../auth/auth.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/** The code of the AuthError a call throws, or 'OK' when it does not throw. */
const codigoDe = (fn: () => unknown): string => {
  try {
    fn();
    return 'OK';
  } catch (err) {
    return err instanceof AuthError ? `${err.code}:${err.status}` : `OTRO:${String(err)}`;
  }
};

const base = {
  firmId: 'firm-1725000000000',
  firmIdDelOperador: 'firm-operador',
  nombreDeLaFirma: 'Restrepo & Asociados',
  confirmacion: 'Restrepo & Asociados',
  motivo: 'Autorizado por C. Restrepo, socia, por correo del 4 de septiembre'
};

// ─── Constantes ─────────────────────────────────────────────────────────────
check('el corpus compartido se llama SYSTEM_CORPUS', CORPUS_COMPARTIDO === 'SYSTEM_CORPUS');
check('la contraseña puesta a mano exige 10, como la de la prueba', MIN_CONTRASENA_OPERADOR === 10);
check('el motivo del borrado exige 10, como toda acción de operación', MIN_MOTIVO_BORRADO === 10);

// ─── Borrado: lo que pasa ───────────────────────────────────────────────────
check('con nombre exacto y motivo, pasa y devuelve el motivo normalizado', validarBorradoDeFirma(base) === base.motivo);
check(
  'espacios al borde del nombre escrito no lo invalidan',
  codigoDe(() => validarBorradoDeFirma({ ...base, confirmacion: '  Restrepo & Asociados  ' })) === 'OK'
);
check(
  'el motivo se devuelve con los espacios colapsados',
  validarBorradoDeFirma({ ...base, motivo: '  Autorizado   por  la socia   el 4 de septiembre ' }) ===
    'Autorizado por la socia el 4 de septiembre'
);

// ─── Borrado: lo que se rechaza ─────────────────────────────────────────────
check(
  'la firma del propio operador se rechaza (SELF_DELETE, 400)',
  codigoDe(() => validarBorradoDeFirma({ ...base, firmId: 'firm-operador' })) === 'SELF_DELETE:400'
);
check(
  'y se rechaza aunque nombre y motivo fueran perfectos',
  codigoDe(() =>
    validarBorradoDeFirma({ ...base, firmId: 'firm-operador', nombreDeLaFirma: 'Iureon', confirmacion: 'Iureon' })
  ) === 'SELF_DELETE:400'
);
check(
  'SYSTEM_CORPUS no es una firma (PROTECTED_FIRM, 400)',
  codigoDe(() => validarBorradoDeFirma({ ...base, firmId: 'SYSTEM_CORPUS' })) === 'PROTECTED_FIRM:400'
);
check(
  'un nombre distinto se rechaza (CONFIRMATION_MISMATCH, 400)',
  codigoDe(() => validarBorradoDeFirma({ ...base, confirmacion: 'Restrepo y Asociados' })) ===
    'CONFIRMATION_MISMATCH:400'
);
check(
  'la comparación distingue mayúsculas: leer el nombre es parte de confirmar',
  codigoDe(() => validarBorradoDeFirma({ ...base, confirmacion: 'restrepo & asociados' })) ===
    'CONFIRMATION_MISMATCH:400'
);
check(
  'sin confirmación se rechaza',
  codigoDe(() => validarBorradoDeFirma({ ...base, confirmacion: '' })) === 'CONFIRMATION_MISMATCH:400' &&
    codigoDe(() => validarBorradoDeFirma({ ...base, confirmacion: undefined })) === 'CONFIRMATION_MISMATCH:400'
);
check(
  'un motivo corto o de relleno se rechaza (REASON_REQUIRED, 400)',
  codigoDe(() => validarBorradoDeFirma({ ...base, motivo: 'ok' })) === 'REASON_REQUIRED:400' &&
    codigoDe(() => validarBorradoDeFirma({ ...base, motivo: '   lo pidió    ' })) === 'REASON_REQUIRED:400' &&
    codigoDe(() => validarBorradoDeFirma({ ...base, motivo: 42 })) === 'REASON_REQUIRED:400'
);
check(
  'el motivo se exige ANTES que el nombre: un nombre mal escrito sin motivo reporta el motivo',
  codigoDe(() => validarBorradoDeFirma({ ...base, motivo: '', confirmacion: 'otra' })) === 'REASON_REQUIRED:400'
);

// ─── Contraseña puesta por operación ────────────────────────────────────────
check('una contraseña de 10 pasa tal cual', validarContrasenaDeOperador('abcdefghij') === 'abcdefghij');
check(
  'una de 9 se rechaza (WEAK_PASSWORD, 400)',
  codigoDe(() => validarContrasenaDeOperador('abcdefghi')) === 'WEAK_PASSWORD:400'
);
check(
  'ausente o de otro tipo se rechaza',
  codigoDe(() => validarContrasenaDeOperador(undefined)) === 'WEAK_PASSWORD:400' &&
    codigoDe(() => validarContrasenaDeOperador(1234567890)) === 'WEAK_PASSWORD:400'
);
check(
  'no se recorta: los espacios al borde son parte de lo que se tecleó',
  validarContrasenaDeOperador(' abcdefghij ') === ' abcdefghij '
);
check(
  'catorce caracteres —lo que genera la consola— pasan',
  validarContrasenaDeOperador('Kx7mQ2vR9tLp4W') === 'Kx7mQ2vR9tLp4W'
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exit(fallos === 0 ? 0 : 1);
