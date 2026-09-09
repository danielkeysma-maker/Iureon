/**
 * The greeting and the date at the top of Inicio.
 *
 * Pure functions over a `Date` so the screen never computes them twice
 * differently and so they can be read without rendering anything. Colombian
 * Spanish throughout: `es-CO` is the locale of every date in the product.
 */

/** «Buenos días» until noon, «Buenas tardes» until seven, «Buenas noches» after. */
export const saludoSegunHora = (ahora: Date): string => {
  const hora = ahora.getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

/** «Viernes, 5 de septiembre de 2026» — the weekday capitalised, as a sentence would. */
export const fechaLarga = (ahora: Date): string => {
  const texto = ahora.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

/**
 * A quién saludar.
 *
 * EL NOMBRE GUARDADO MANDA. La cuenta ya puede tener uno —lo pone la persona
 * en Ajustes → «Su cuenta», o llega del formulario público de registro—, y ese
 * es el único que alguien eligió de verdad.
 *
 * Sin nombre se conserva lo de siempre: la parte anterior a la «@» cuando se
 * lee como un nombre, y la dirección entera cuando no. No es exacto —de
 * «ingdanielma@…» sale «Ingdanielma»— pero un saludo vacío es peor, y ahora
 * hay dónde corregirlo.
 */
export const nombreParaSaludar = (correo: string, nombre?: string | null): string => {
  const guardado = (nombre ?? '').trim();
  if (guardado) return guardado;

  const local = correo.split('@')[0] ?? '';
  if (!local || /\d{3,}/.test(local)) return correo;
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
};

/** «5 sept 2026» for the recent lists. */
/**
 * A date-only ISO string («2026-09-05») is parsed by `Date` as UTC midnight,
 * which in Colombia is still the evening before: every Novedad showed a day
 * early. Date-only strings are built as LOCAL dates; full timestamps keep
 * their own zone.
 */
const fechaLocal = (iso: string): Date => {
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return soloFecha
    ? new Date(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]))
    : new Date(iso);
};

export const fechaCorta = (iso: string): string => {
  const fecha = fechaLocal(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
};
