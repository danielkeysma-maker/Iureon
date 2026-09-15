import type { MainView } from '../tenant/types';
import { moduloDeVista } from '../tenant/navigation';
import type { Novedad } from './types';

/**
 * Lo que decide qué dice Novedades, en puro: sin React, sin red, sin almacenamiento.
 *
 * ─── «LE AFECTA» SALE DEL PLAN, Y DE NADA MÁS ───────────────────────────────
 *
 * El artboard (`app-novedades.html`:104) dibuja «3 escritos suyos se apoyaron
 * en la versión anterior». Ese cruce exige guardar en cada escrito la VERSIÓN
 * de la ficha con que se generó, y ese dato no existe (README-app lo dice).
 * Pintarlo sería inventar una consecuencia en la pantalla que la anuncia. Lo
 * que sí se sabe es qué módulos abre el plan de la firma: un cambio le afecta
 * cuando toca un módulo que su plan incluye. Y sin datos del plan no se afirma
 * nada: ni «le afecta» ni «no lo abre su plan».
 *
 * Los módulos que ningún plan recorta (Inicio, Manual, Soporte, Novedades,
 * Ajustes, Seguridad, Privacidad) son de toda firma: «general», que también
 * le afecta, pero sin la etiqueta «Su plan lo incluye», que sería decir lo
 * obvio en cada fila.
 */

export type AlcanceDelPlan = 'incluido' | 'no-incluido' | 'general';

export const alcanceDelPlan = (
  modulos: readonly MainView[],
  modulosPermitidos: readonly string[] | null
): AlcanceDelPlan | null => {
  if (modulosPermitidos === null) return null;
  const conPlan = modulos.map(moduloDeVista);
  if (conPlan.some((m) => m === null)) {
    /* Tocar un módulo de toda firma basta: el cambio le llega aunque el otro esté cerrado. */
    return conPlan.some((m) => m !== null && modulosPermitidos.includes(m)) ? 'incluido' : 'general';
  }
  return conPlan.some((m) => m !== null && modulosPermitidos.includes(m)) ? 'incluido' : 'no-incluido';
};

export const leAfecta = (alcance: AlcanceDelPlan | null): boolean =>
  alcance === 'incluido' || alcance === 'general';

/* ─── «NUEVO» ────────────────────────────────────────────────────────────────
 *
 * Con visita registrada en este navegador, nuevo es lo POSTERIOR a ella. Sin
 * ninguna, no hay «última visita» contra la cual comparar: marcar la historia
 * entera —decenas de cambios— como nueva no le dice nada a nadie y convierte
 * el contador del panel en ruido. Sin visita, «nuevo» cubre los últimos
 * `DIAS_SIN_VISITA` días contados desde la entrada más reciente.
 */
export const DIAS_SIN_VISITA = 30;

const restarDias = (iso: string, dias: number): string => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d - dias)).toISOString().slice(0, 10);
};

export const esNueva = (fecha: string, vistasHasta: string | null, masReciente: string): boolean =>
  vistasHasta ? fecha > vistasHasta : fecha > restarDias(masReciente, DIAS_SIN_VISITA);

export const fechaMasReciente = (lista: readonly Novedad[]): string =>
  lista.reduce((max, n) => (n.fecha > max ? n.fecha : max), '');

/* ─── QUIÉN VE QUÉ ───────────────────────────────────────────────────────── */

/** Lo de operación (la consola del operador) solo lo ve el superusuario. */
export const visiblesParaRol = (lista: readonly Novedad[], esOperador: boolean): Novedad[] =>
  lista.filter((n) => !n.soloOperacion || esOperador);

export interface FiltroDeNovedades {
  modulo: MainView | null;
  soloLeAfecta: boolean;
}

export const filtrarNovedades = (
  lista: readonly Novedad[],
  filtro: FiltroDeNovedades,
  modulosPermitidos: readonly string[] | null
): Novedad[] =>
  lista.filter(
    (n) =>
      (filtro.modulo === null || n.modulos.includes(filtro.modulo)) &&
      /* Sin plan el filtro no se ofrece; si llegara encendido, no tiene con qué decidir. */
      (!filtro.soloLeAfecta || modulosPermitidos === null || leAfecta(alcanceDelPlan(n.modulos, modulosPermitidos)))
  );

/** Inicio muestra pocas: con plan, las más recientes que le afectan; sin plan, las más recientes. */
export const paraInicio = (
  lista: readonly Novedad[],
  modulosPermitidos: readonly string[] | null,
  cuantas: number
): Novedad[] =>
  (modulosPermitidos === null
    ? lista
    : lista.filter((n) => leAfecta(alcanceDelPlan(n.modulos, modulosPermitidos)))
  ).slice(0, cuantas);

/** Lo que el panel lateral cuenta: lo nuevo para usted y, con plan, solo lo que le afecta. */
export const contarNuevas = (
  lista: readonly Novedad[],
  vistasHasta: string | null,
  modulosPermitidos: readonly string[] | null
): number => {
  const reciente = fechaMasReciente(lista);
  return lista.filter(
    (n) =>
      esNueva(n.fecha, vistasHasta, reciente) &&
      (modulosPermitidos === null || leAfecta(alcanceDelPlan(n.modulos, modulosPermitidos)))
  ).length;
};

/** Los módulos que aparecen en la lista, en orden de primera aparición: la fila de filtros. */
export const modulosConNovedades = (lista: readonly Novedad[]): MainView[] => {
  const vistos: MainView[] = [];
  for (const n of lista) for (const m of n.modulos) if (!vistos.includes(m)) vistos.push(m);
  return vistos;
};

/* ─── FECHAS, SIN `Date` QUE LAS CORRA DE ZONA ─────────────────────────────── */

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** '2026-09-04' → '4 de septiembre de 2026'. */
export const fechaLarga = (iso: string): string => {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1] ?? ''} de ${a}`;
};

/** '2026-09-04' → '04/09/2026'. */
export const fechaNumerica = (iso: string): string => iso.split('-').reverse().join('/');

/** Agrupa por mes conservando el orden de la fuente: «Septiembre de 2026». */
export const agruparPorMes = (lista: readonly Novedad[]): { mes: string; entradas: Novedad[] }[] => {
  const grupos: { clave: string; mes: string; entradas: Novedad[] }[] = [];
  for (const n of lista) {
    const clave = n.fecha.slice(0, 7);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.clave === clave) ultimo.entradas.push(n);
    else {
      const [a, m] = clave.split('-').map(Number);
      const nombre = MESES[m - 1] ?? '';
      grupos.push({ clave, mes: `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} de ${a}`, entradas: [n] });
    }
  }
  return grupos.map(({ mes, entradas }) => ({ mes, entradas }));
};
