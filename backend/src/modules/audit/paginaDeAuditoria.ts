import { FILAS_POR_PARTE } from '../../config/leerTodasLasFilas';

/**
 * CÓMO SE PIDE UNA PÁGINA DE LA AUDITORÍA. Puro: sin base, sin Express.
 *
 * ─── POR QUÉ PÁGINAS Y NO «TODO» ───────────────────────────────────────────
 *
 * La auditoría crece con cada escrito, transcripción y verificación, y no se
 * borra nunca. Leerla entera en cada apertura sería lento y, pasadas las mil
 * filas, además incompleto sin aviso: PostgREST corta ahí. Se lee por páginas
 * con `range` y se pide el total exacto, para que la pantalla diga cuántos
 * eventos quedan en vez de fingir que la lista terminó.
 *
 * ─── POR QUÉ DESPLAZAMIENTO Y NO CURSOR ────────────────────────────────────
 *
 * El registro es INALTERABLE: solo se le añaden filas, nunca se le quitan. Con
 * un desplazamiento, un evento nuevo escrito entre dos páginas corre la lista
 * un puesto y la página siguiente REPITE una fila; nunca se salta una. Repetir
 * se corrige en la pantalla uniendo por `id`; saltarse no se puede corregir en
 * ninguna parte. Un cursor por fecha sí podría perder filas con la misma marca
 * de tiempo, que en ráfagas del servidor ocurre.
 */

/** Lo que se pide si nadie dice cuánto. Cabe holgado en una parte de PostgREST. */
export const LIMITE_PREDETERMINADO = 200;

export interface PedidoDePagina {
  desde: number;
  limite: number;
  /** Inicio del periodo en ISO, o null para todo el registro. */
  inicio: string | null;
}

/** Express entrega un parámetro repetido como lista; se toma el primero. */
const primero = (v: unknown): unknown => (Array.isArray(v) ? v[0] : v);

const entero = (v: unknown): number | null => {
  const n = Number.parseFloat(String(primero(v) ?? ''));
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

export const leerPedidoDePagina = (query: Record<string, unknown>): PedidoDePagina => {
  const desde = entero(query.desde);
  const limite = entero(query.limite);
  const inicioCrudo = primero(query.inicio);
  const fecha = typeof inicioCrudo === 'string' && inicioCrudo.trim() ? new Date(inicioCrudo) : null;

  return {
    desde: desde !== null && desde > 0 ? desde : 0,
    /*
     * El techo es el máximo que sirve PostgREST, medido: pedir más no trae más,
     * y una página que se corta en silencio es justo lo que esto evita.
     */
    limite: limite !== null && limite >= 1 ? Math.min(limite, FILAS_POR_PARTE) : LIMITE_PREDETERMINADO,
    inicio: fecha && !Number.isNaN(fecha.getTime()) ? fecha.toISOString() : null
  };
};

/** El rango inclusivo que entiende `range` de Supabase. */
export const rangoDeLaPagina = ({ desde, limite }: Pick<PedidoDePagina, 'desde' | 'limite'>): [number, number] => [
  desde,
  desde + limite - 1
];

/**
 * ¿Queda algo detrás de esta página? Con total exacto, se compara contra él.
 * Sin total —si la base no lo dio—, una página llena PUEDE tener más detrás y
 * se ofrece seguir: ofrecer una página vacía cuesta un clic; callar una llena
 * esconde eventos.
 */
export const hayMasEventos = (p: { desde: number; recibidos: number; limite: number; total: number | null }): boolean =>
  p.total !== null ? p.desde + p.recibidos < p.total : p.recibidos >= p.limite;
