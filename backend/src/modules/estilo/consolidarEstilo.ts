import type {
  Clasificado,
  EntradaDeGlosarioConsolidada,
  EstiloConsolidado,
  LeccionGuardada
} from './types';

/**
 * El perfil de estilo de un alcance es una FUNCIÓN PURA de sus lecciones.
 *
 * ─── POR QUÉ NO SE GUARDA UN PERFIL ACUMULADO ──────────────────────────────
 *
 * Un acumulado envejece: el socio retira una lección y el perfil sigue
 * diciendo lo que ella enseñó. Calculado cada vez desde las filas vivas,
 * retirar es borrar una fila y nada más; no hay dos verdades que reconciliar.
 * Con un tope de 30 lecciones por alcance, calcularlo cuesta nada.
 *
 * ─── DOS REGLAS DISTINTAS, A PROPÓSITO ─────────────────────────────────────
 *
 * Lo que es UNA decisión de conjunto —el orden de las secciones, los títulos,
 * el bloque de firma, el tratamiento— sale de la lección más reciente: mezclar
 * el orden de tres escritos produce un orden que ninguno usa. Lo que es un
 * repertorio —fórmulas y glosario— se ordena por cuántos escritos lo usan, y
 * el bloque del prompt lo dice («visto en N escritos») para que el motor
 * prefiera la costumbre y no la rareza.
 */

export const MAX_LECCIONES_POR_ALCANCE = 30;

/** La 31.ª lección de un alcance se niega con un mensaje; nunca se descarta la más vieja en silencio. */
export const puedeAgregarLeccion = (leccionesEnElAlcance: number): boolean => leccionesEnElAlcance < MAX_LECCIONES_POR_ALCANCE;

export const MENSAJE_TOPE = `Este formato ya tiene ${MAX_LECCIONES_POR_ALCANCE} escritos enseñados para ese rol y esa rama. Retire uno desde Ajustes → Estilo de la firma antes de enseñar otro.`;

/**
 * La rama del escrito, o el estilo general del rol si la rama no tiene
 * lecciones. Sin rama pedida solo cabe el general.
 */
export const elegirAlcance = (input: {
  rama: string | null;
  deLaRama: LeccionGuardada[];
  generales: LeccionGuardada[];
}): { rama: string | null; lecciones: LeccionGuardada[] } =>
  input.rama && input.deLaRama.length > 0
    ? { rama: input.rama, lecciones: input.deLaRama }
    : { rama: null, lecciones: input.generales };

const clave = (s: string): string => s.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Ordena por número de lecciones que usan cada cadena (cada lección cuenta una
 * vez) y, en empate, por la más reciente. El texto que se muestra es el de la
 * lección más reciente que la usa.
 */
const clasificar = (porLeccion: string[][], tope: number): Clasificado[] => {
  const mapa = new Map<string, { texto: string; vistoEn: number; reciente: number }>();
  porLeccion.forEach((cadenas, indice) => {
    const vistas = new Set<string>();
    for (const c of cadenas) {
      const k = clave(c);
      if (!k || vistas.has(k)) continue;
      vistas.add(k);
      const previo = mapa.get(k);
      if (previo) previo.vistoEn += 1;
      else mapa.set(k, { texto: c.trim(), vistoEn: 1, reciente: indice });
    }
  });
  return [...mapa.values()]
    .sort((a, b) => b.vistoEn - a.vistoEn || a.reciente - b.reciente)
    .slice(0, tope)
    .map(({ texto, vistoEn }) => ({ texto, vistoEn }));
};

export const consolidarEstilo = (lecciones: LeccionGuardada[]): EstiloConsolidado => {
  /* De la más reciente a la más vieja: el índice 0 manda en los empates. */
  const ordenadas = [...lecciones].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  const primeraCon = <T>(leer: (l: LeccionGuardada) => T | null, vacio: (v: T) => boolean): T | null => {
    for (const l of ordenadas) {
      const v = leer(l);
      if (v !== null && !vacio(v)) return v;
    }
    return null;
  };

  const encabezados = clasificar(
    ordenadas.map((l) => (l.contenido.encabezado ? [l.contenido.encabezado] : [])),
    1
  );

  const glosario = new Map<string, EntradaDeGlosarioConsolidada & { reciente: number; claves: Set<string> }>();
  ordenadas.forEach((l, indice) => {
    const vistas = new Set<string>();
    for (const g of l.contenido.glosario) {
      const k = clave(g.preferido);
      if (!k || vistas.has(k)) continue;
      vistas.add(k);
      let entrada = glosario.get(k);
      if (!entrada) {
        entrada = { preferido: g.preferido.trim(), variantes: [], ejemplo: '', vistoEn: 0, reciente: indice, claves: new Set([k]) };
        glosario.set(k, entrada);
      }
      entrada.vistoEn += 1;
      if (!entrada.ejemplo && g.ejemplo) entrada.ejemplo = g.ejemplo;
      for (const v of g.variantes) {
        const kv = clave(v);
        if (kv && !entrada.claves.has(kv)) {
          entrada.claves.add(kv);
          entrada.variantes.push(v.trim());
        }
      }
    }
  });

  return {
    lecciones: ordenadas.length,
    actualizado: ordenadas[0]?.createdAt ?? null,
    titulosDeSeccion: primeraCon((l) => l.contenido.titulosDeSeccion, (v) => v.length === 0) ?? [],
    numeracionHechos: primeraCon((l) => l.contenido.numeracionHechos, () => false),
    ordenDeSecciones: primeraCon((l) => l.contenido.ordenDeSecciones, (v) => v.length === 0) ?? [],
    encabezado: encabezados[0] ?? null,
    formulasDeApertura: clasificar(ordenadas.map((l) => l.contenido.formulasDeApertura), 8),
    formulasDeCierre: clasificar(ordenadas.map((l) => l.contenido.formulasDeCierre), 8),
    bloqueDeFirma: primeraCon((l) => l.contenido.bloqueDeFirma, (v) => v.length === 0) ?? [],
    tratamiento: primeraCon((l) => l.contenido.tratamiento, () => false),
    glosario: [...glosario.values()]
      .sort((a, b) => b.vistoEn - a.vistoEn || a.reciente - b.reciente)
      .slice(0, 20)
      .map(({ preferido, variantes, ejemplo, vistoEn }) => ({ preferido, variantes, ejemplo, vistoEn }))
  };
};
