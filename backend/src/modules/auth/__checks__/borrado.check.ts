/**
 * Guards the pure rules of a lawyer deleting their own user or their own firm.
 *
 * Run with: npm run check:borrado
 *
 * No database, no network. Both actions are irreversible, so what stands
 * between the button and the delete — the last user, the last administrator,
 * the operator's account, the typed name of the firm — is proven here against
 * fixed inputs.
 */
import { leerContrasena, validarBorradoDeFirmaPropia, validarBorradoDePropioUsuario } from '../borrado.rules';
import { AuthError } from '../auth.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/** The code and status of the AuthError a call throws, or 'OK' when it does not throw. */
const codigoDe = (fn: () => unknown): string => {
  try {
    fn();
    return 'OK';
  } catch (err) {
    return err instanceof AuthError ? `${err.code}:${err.status}` : `OTRO:${String(err)}`;
  }
};

const mensajeDe = (fn: () => unknown): string => {
  try {
    fn();
    return '';
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
};

// ─── Eliminar mi usuario ────────────────────────────────────────────────────
check(
  'un abogado entre varios puede irse',
  codigoDe(() => validarBorradoDePropioUsuario({ role: 'LAWYER', totalUsuarios: 3, totalAdministradores: 1 })) === 'OK'
);
check(
  'un administrador puede irse si queda otro administrador',
  codigoDe(() => validarBorradoDePropioUsuario({ role: 'FIRM_ADMIN', totalUsuarios: 3, totalAdministradores: 2 })) ===
    'OK'
);
check(
  'el único usuario de la firma recibe LAST_USER 409',
  codigoDe(() => validarBorradoDePropioUsuario({ role: 'FIRM_ADMIN', totalUsuarios: 1, totalAdministradores: 1 })) ===
    'LAST_USER:409'
);
check(
  'el único usuario, aunque sea abogado, recibe LAST_USER',
  codigoDe(() => validarBorradoDePropioUsuario({ role: 'LAWYER', totalUsuarios: 1, totalAdministradores: 0 })) ===
    'LAST_USER:409'
);
check(
  'LAST_USER remite a «Eliminar la firma y todos sus datos», con firma bien escrita',
  mensajeDe(() => validarBorradoDePropioUsuario({ role: 'LAWYER', totalUsuarios: 1, totalAdministradores: 0 })).includes(
    'Eliminar la firma y todos sus datos'
  )
);
check(
  'el último administrador con otros usuarios recibe LAST_ADMIN 409',
  codigoDe(() => validarBorradoDePropioUsuario({ role: 'FIRM_ADMIN', totalUsuarios: 4, totalAdministradores: 1 })) ===
    'LAST_ADMIN:409'
);
check(
  'LAST_ADMIN pide nombrar otro administrador',
  mensajeDe(() => validarBorradoDePropioUsuario({ role: 'FIRM_ADMIN', totalUsuarios: 4, totalAdministradores: 1 })) ===
    'Nombre otro administrador antes de eliminar su usuario.'
);
check(
  'un abogado no es frenado por ser la firma de un solo administrador',
  codigoDe(() => validarBorradoDePropioUsuario({ role: 'LAWYER', totalUsuarios: 2, totalAdministradores: 1 })) === 'OK'
);
check(
  'el superadministrador recibe 403 aunque haya más usuarios',
  codigoDe(() => validarBorradoDePropioUsuario({ role: 'SUPER_ADMIN', totalUsuarios: 5, totalAdministradores: 3 })) ===
    'FORBIDDEN:403'
);
check(
  'el superadministrador recibe 403 antes que LAST_USER',
  codigoDe(() => validarBorradoDePropioUsuario({ role: 'SUPER_ADMIN', totalUsuarios: 1, totalAdministradores: 0 })) ===
    'FORBIDDEN:403'
);

// ─── Eliminar la firma ──────────────────────────────────────────────────────
const firma = { role: 'FIRM_ADMIN' as const, nombreDeLaFirma: 'Restrepo & Asociados', confirmacion: 'Restrepo & Asociados' };
check('el administrador con el nombre exacto pasa', codigoDe(() => validarBorradoDeFirmaPropia(firma)) === 'OK');
check(
  'espacios al borde del nombre escrito no lo invalidan',
  codigoDe(() => validarBorradoDeFirmaPropia({ ...firma, confirmacion: '  Restrepo & Asociados  ' })) === 'OK'
);
check(
  'un abogado recibe 403',
  codigoDe(() => validarBorradoDeFirmaPropia({ ...firma, role: 'LAWYER' })) === 'FORBIDDEN:403'
);
check(
  'el superadministrador recibe 403: su firma no se borra desde la aplicación',
  codigoDe(() => validarBorradoDeFirmaPropia({ ...firma, role: 'SUPER_ADMIN' })) === 'FORBIDDEN:403'
);
check(
  'el nombre en otra caja recibe CONFIRMATION_MISMATCH 400',
  codigoDe(() => validarBorradoDeFirmaPropia({ ...firma, confirmacion: 'restrepo & asociados' })) ===
    'CONFIRMATION_MISMATCH:400'
);
check(
  'un nombre vacío recibe CONFIRMATION_MISMATCH',
  codigoDe(() => validarBorradoDeFirmaPropia({ ...firma, confirmacion: '' })) === 'CONFIRMATION_MISMATCH:400'
);
check(
  'un nombre ausente recibe CONFIRMATION_MISMATCH',
  codigoDe(() => validarBorradoDeFirmaPropia({ ...firma, confirmacion: undefined })) === 'CONFIRMATION_MISMATCH:400'
);
check(
  'el rol se comprueba antes que el nombre',
  codigoDe(() => validarBorradoDeFirmaPropia({ ...firma, role: 'LAWYER', confirmacion: '' })) === 'FORBIDDEN:403'
);

// ─── La contraseña ──────────────────────────────────────────────────────────
check('la contraseña se devuelve tal cual, sin recortar', leerContrasena(' abc ') === ' abc ');
check('una contraseña vacía recibe PASSWORD_REQUIRED 400', codigoDe(() => leerContrasena('')) === 'PASSWORD_REQUIRED:400');
check('una contraseña que no es texto recibe PASSWORD_REQUIRED', codigoDe(() => leerContrasena(123)) === 'PASSWORD_REQUIRED:400');

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
