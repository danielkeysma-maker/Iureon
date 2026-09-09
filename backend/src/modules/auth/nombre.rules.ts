import { AuthError } from './auth.service';

/**
 * The pure rules of a person's name, kept free of the database so
 * `nombre.check.ts` can prove them against fixed inputs.
 *
 * WHY A NAME AT ALL. Until now the application never stored one: the session
 * carried only the e-mail, so the sidebar derived initials from it and Inicio
 * greeted «Ingdanielma» — a string nobody chose, addressed to a person who
 * never wrote it. The public sign-up form did ask for a name, but it only
 * reached the audit trail and the welcome mail.
 *
 * The name lives in Supabase Auth's `user_metadata`, which is the half of the
 * metadata a user may edit with their own session; `app_metadata` — the firm
 * and the role — stays the server's, exactly as before. Nothing about the
 * tenant boundary changes: a name is a label, not a permission.
 */

/** Shortest and longest a name may be, once trimmed. */
export const NOMBRE_MINIMO = 2;
export const NOMBRE_MAXIMO = 80;

/**
 * Runs of whitespace — including the tabs and newlines a paste brings along —
 * collapse to a single space. Otherwise «Ana    María» would pass the length
 * check on characters nobody typed and print with a hole in it.
 */
const NORMALIZAR = /\s+/g;

/** Control characters have no place in a name and break every line they land in. */
const tieneControl = (texto: string): boolean => {
  for (const caracter of texto) {
    const codigo = caracter.codePointAt(0) ?? 0;
    // Tabs, saltos de linea y demas de C0, mas DEL: nada de eso es un nombre.
    if (codigo < 32 || codigo === 127) return true;
  }
  return false;
};

/**
 * The name as it will be stored: trimmed, with inner whitespace collapsed.
 * Throws the refusal — in Spanish, as the lawyer will read it — when the
 * value cannot be a name.
 */
export const validarNombre = (raw: unknown): string => {
  const texto = typeof raw === 'string' ? raw : '';

  /*
   * El recorte va PRIMERO. Un nombre pegado desde otro sitio llega con un
   * salto de línea al final, y rechazarlo por eso sería castigar al usuario
   * por cómo copió: el salto es espacio en blanco y aquí se convierte en nada.
   * Lo que queda después —un NUL, un carácter de control de verdad— sí se
   * rechaza, porque no es forma de escribir un nombre.
   */
  const nombre = texto.replace(NORMALIZAR, ' ').trim();

  if (tieneControl(nombre)) {
    throw new AuthError('NOMBRE_INVALIDO', 'El nombre no puede tener caracteres de control.', 400);
  }

  if (!nombre) {
    throw new AuthError('NOMBRE_REQUERIDO', 'Escriba su nombre: el campo no puede quedar vacío.', 400);
  }
  if (nombre.length < NOMBRE_MINIMO) {
    throw new AuthError(
      'NOMBRE_MUY_CORTO',
      `El nombre debe tener al menos ${NOMBRE_MINIMO} caracteres.`,
      400
    );
  }
  if (nombre.length > NOMBRE_MAXIMO) {
    throw new AuthError(
      'NOMBRE_MUY_LARGO',
      `El nombre no puede pasar de ${NOMBRE_MAXIMO} caracteres.`,
      400
    );
  }

  return nombre;
};

/**
 * The same rules where the name is OPTIONAL — creating a colleague's account,
 * where the partner may not know how the person writes their own name.
 *
 * Absent and empty both mean «no name», and the account is created without
 * one; the person puts it in later from Ajustes → «Su cuenta». Anything
 * else is validated, so a name that IS sent can never be stored malformed.
 */
export const validarNombreOpcional = (raw: unknown): string | undefined => {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw === 'string' && raw.trim() === '') return undefined;
  return validarNombre(raw);
};
