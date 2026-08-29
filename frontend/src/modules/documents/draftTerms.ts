import type { EstadoBorrador, SavedDraftEntry } from './types';

/**
 * El reloj de un borrador, en un solo sitio.
 *
 * Vivía dentro de `SavedDraftsView`, y al construir la pantalla móvil (10c) las
 * dos habrían tenido su propia copia de «cuántos días faltan» y de «qué cuenta
 * como radicado». Eso es exactamente lo que este producto no puede permitirse:
 * dos pantallas que contradigan la fecha de vencimiento del mismo escrito
 * porque una redondea distinto que la otra.
 *
 * Se extrae sin cambiar una línea del cálculo — mover y modificar a la vez deja
 * sin saber cuál de las dos cosas rompió algo.
 */

/**
 * Una fecha ISO como fecha LOCAL, no UTC.
 *
 * `new Date('2025-05-03')` se interpreta en UTC y en Colombia retrocede al día
 * anterior: un término que vence el 3 se mostraría venciendo el 2, y ese error
 * es de los que cuestan un proceso.
 */
const aFechaLocal = (iso: string): Date => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, (m ?? 1) - 1, d ?? 1);
};

export const diasHasta = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((aFechaLocal(iso).getTime() - hoy.getTime()) / 86400000);
};

export const fechaLarga = (iso: string): string =>
  aFechaLocal(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

/** El mismo dato en corto, para la tarjeta móvil: «3 may». */
export const fechaCorta = (iso: string): string =>
  aFechaLocal(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

/** «en 2 días», «vence hoy», «vencido hace 3 días». */
export const cuantoFalta = (dias: number): string => {
  if (dias < 0) return `vencido hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'vence hoy';
  if (dias === 1) return 'en 1 día';
  if (dias > 400) return `en ${Math.round(dias / 365)} años`;
  return `en ${dias} días`;
};

export const ETIQUETA_ESTADO: Record<EstadoBorrador, string> = {
  BORRADOR: 'Borrador',
  REVISAR: 'Revisar',
  LISTO: 'Listo',
  RADICADO: 'Radicado'
};

/**
 * Radicado por estado O por fecha.
 *
 * Las dos cosas cuentan: un escrito con fecha de radicación es radicado aunque
 * nadie haya cambiado su estado a mano, y esa laxitud es intencional — lo que
 * no puede pasar es que un escrito ya presentado siga apareciendo con un
 * término que corre.
 */
export const esRadicado = (e: SavedDraftEntry): boolean =>
  e.estado === 'RADICADO' || Boolean(e.radicadoEl);

export interface GrupoDeBorradores {
  titulo: string;
  entradas: SavedDraftEntry[];
  urgente: boolean;
}

/**
 * Los tres grupos de 10a y 10c: lo que vence esta semana, lo demás, lo radicado.
 *
 * ORDENADOS POR TÉRMINO, NO POR FECHA DE EDICIÓN. Un borrador jurídico no es un
 * archivo que espera: es un plazo que corre. Lo sin fecha va al final —no
 * caduca, luego no compite con lo que sí—.
 */
export const agruparPorTermino = (entradas: SavedDraftEntry[]): GrupoDeBorradores[] => {
  const semana: SavedDraftEntry[] = [];
  const adelante: SavedDraftEntry[] = [];
  const radicados: SavedDraftEntry[] = [];

  for (const e of entradas) {
    if (esRadicado(e)) radicados.push(e);
    else {
      const d = diasHasta(e.venceEl);
      if (d !== null && d <= 7) semana.push(e);
      else adelante.push(e);
    }
  }

  const porTermino = (a: SavedDraftEntry, b: SavedDraftEntry) => {
    const da = diasHasta(a.venceEl);
    const db = diasHasta(b.venceEl);
    if (da === null && db === null) return 0;
    if (da === null) return 1; // Sin fecha al final: no caduca.
    if (db === null) return -1;
    return da - db;
  };

  semana.sort(porTermino);
  adelante.sort(porTermino);

  return [
    { titulo: 'Vence esta semana', entradas: semana, urgente: true },
    { titulo: 'Más adelante', entradas: adelante, urgente: false },
    { titulo: 'Radicados', entradas: radicados, urgente: false }
  ].filter((g) => g.entradas.length > 0);
};
