/**
 * LA REGLA DE CONTRASEÑA DE LAS PANTALLAS PÚBLICAS: registro y restablecimiento.
 *
 * Una sola constante para las dos, porque son la misma situación: alguien sin
 * sesión eligiendo una contraseña en un formulario público. El servidor impone
 * la misma cifra (`MIN_CONTRASENA` de `backend/src/modules/trial/trial.rules.ts`,
 * que también usa `auth/recuperacion.rules.ts`); esta solo evita el viaje de ida
 * y vuelta para decir lo que ya se sabe.
 *
 * `check:recuperacion` (frontend) comprueba que las dos pantallas la importan
 * de aquí y no la vuelven a escribir.
 */
export const MIN_CONTRASENA = 10;

/** El problema de la contraseña nueva, en español, o null si sirve. */
export const problemaDeContrasenaNueva = (contrasena: string, confirmacion: string): string | null => {
  if (contrasena.length < MIN_CONTRASENA) return `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`;
  if (contrasena !== confirmacion) return 'Las dos contraseñas no coinciden.';
  return null;
};
