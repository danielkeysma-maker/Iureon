import { fechaCorta } from './saludo';

/**
 * CUÁNTO FALTA Y HACE CUÁNTO, EN EL DÍA DEL ABOGADO.
 *
 * ─── EL DEFECTO QUE SE EVITA ───────────────────────────────────────────────
 *
 * `fechaLimite` llega como fecha sola («2026-09-15»). `new Date` la lee como
 * medianoche UTC, que en Colombia es todavía las siete de la noche del día
 * anterior: un término que vence mañana se habría leído como «vence hoy» y
 * uno de hoy como «venció ayer». Aquí se comparan DÍAS de calendario local,
 * con aritmética en UTC sobre los componentes locales para que un cambio de
 * horario tampoco quite ni sume un día.
 *
 * ─── UN VENCIDO NO SE ESCONDE ──────────────────────────────────────────────
 *
 * Los negativos existen y se dicen: «Venció hace 3 días». Una agenda que solo
 * mostrara lo futuro dejaría fuera justo el término que ya se pasó, que es el
 * que más importa que el abogado vea.
 */

const MS_POR_DIA = 86_400_000;

/** El día de calendario local de una fecha sola o de una marca de tiempo. */
const diaDeCalendario = (iso: string): number | null => {
  const soloFecha = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (soloFecha) {
    return Date.UTC(Number(soloFecha[1]), Number(soloFecha[2]) - 1, Number(soloFecha[3]));
  }
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return null;
  return Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
};

const hoyDeCalendario = (ahora: Date): number =>
  Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

/**
 * Días de calendario hasta la fecha límite: 0 es hoy, negativo es vencido.
 * `null` cuando la fecha no se deja leer, que no es lo mismo que «hoy».
 */
export const diasHastaVencer = (fechaLimite: string, ahora: Date): number | null => {
  const dia = diaDeCalendario(fechaLimite);
  if (dia === null) return null;
  return Math.round((dia - hoyDeCalendario(ahora)) / MS_POR_DIA);
};

/** El plazo en palabras, sin esconder el vencido. */
export const textoDelPlazo = (dias: number | null): string => {
  if (dias === null) return 'Fecha límite ilegible';
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  if (dias > 1) return `Quedan ${dias} días`;
  if (dias === -1) return 'Venció ayer';
  return `Venció hace ${Math.abs(dias)} días`;
};

/**
 * «hace 2 horas», «ayer», «hace 3 días»; pasada una semana, la fecha. Se
 * cuenta por días de calendario para que algo de anoche diga «ayer» y no
 * «hace 9 horas».
 */
export const haceCuanto = (iso: string, ahora: Date): string => {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const dia = diaDeCalendario(iso);
  const dias = dia === null ? 0 : Math.round((hoyDeCalendario(ahora) - dia) / MS_POR_DIA);

  if (dias <= 0) {
    const horas = Math.floor((ahora.getTime() - fecha.getTime()) / 3_600_000);
    if (horas < 1) return 'hace unos minutos';
    return horas === 1 ? 'hace 1 hora' : `hace ${horas} horas`;
  }
  if (dias === 1) return 'ayer';
  if (dias < 7) return `hace ${dias} días`;
  return fechaCorta(iso);
};
