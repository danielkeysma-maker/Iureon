import type { Actuacion } from './types';

/**
 * El orden de las sugerencias de Orientación: LO QUE SE VENCE PRIMERO, PRIMERO.
 *
 * Es la regla del artboard 1f, y su nota dice por qué: se ordena «por término
 * más corto, no por confianza del modelo — lo que puede vencerse esta semana
 * importa más que lo que el modelo cree más probable». Un abogado que recibe
 * seis opciones no las compara: atiende la primera, y esa debe ser la que
 * caduca antes.
 *
 * CÓMO SE MIDE UN TÉRMINO QUE ES PROSA. El catálogo no guarda días: guarda la
 * frase de la norma —«Dentro de los diez (10) días siguientes…»—, así que hay
 * que leer el número. Se prefiere la forma «(N)» porque es como la ley escribe
 * la cifra, entre paréntesis después de la palabra, y es la redacción de casi
 * todas las fichas.
 *
 * LO QUE NO SE PUEDE MEDIR NO SE ADIVINA. Si la frase no deja extraer un
 * número, la actuación no se inventa un puesto: cae detrás de las que sí se
 * pudieron medir, conservando su orden de llegada. Lo mismo con las que no
 * caducan (no hay reloj que comparar) y con las no verificadas (afirmar un
 * plazo que nadie comprobó es justo lo que el catálogo existe para impedir).
 *
 * SIN `normalize('NFD')` NI CLASES DE COMBINANTES. La primera versión quitaba
 * las tildes con una clase de acentos sueltos, que son invisibles en el editor
 * y en el diff: si un guardado los normaliza, la clase deja de coincidir sin
 * fallar — la regex sigue compilando y simplemente no encuentra nada. Aquí las
 * tildes van precompuestas dentro del patrón, donde se ven.
 */

const DIAS_POR_UNIDAD: Record<string, number> = {
  día: 1,
  días: 1,
  dia: 1,
  dias: 1,
  mes: 30,
  meses: 30,
  año: 365,
  años: 365,
  ano: 365,
  anos: 365
};

/** Reduce «(10) días hábiles» a la clave con la que se busca el factor. */
const unidadDe = (bruto: string): string => bruto.toLowerCase();

/**
 * Los días que dura un término, leídos de su frase. `null` cuando no se puede
 * afirmar — que es una respuesta, no un fallo.
 */
export const diasDelTermino = (descripcion: string | null | undefined): number | null => {
  if (!descripcion) return null;
  const texto = descripcion.toLowerCase();

  // «diez (10) días hábiles», «tres (3) meses», «dos (2) años».
  const conParentesis = texto.match(/\((\d{1,4})\)\s*(días?|dias?|meses|mes|años?|anos?)/);
  if (conParentesis) {
    const factor = DIAS_POR_UNIDAD[unidadDe(conParentesis[2])];
    if (factor) return Number(conParentesis[1]) * factor;
  }

  // «10 días», «3 meses» — sin la cifra entre paréntesis.
  const simple = texto.match(/(\d{1,4})\s*(días?|dias?|meses|mes|años?|anos?)/);
  if (simple) {
    const factor = DIAS_POR_UNIDAD[unidadDe(simple[2])];
    if (factor) return Number(simple[1]) * factor;
  }

  return null;
};

/**
 * El grupo al que pertenece una sugerencia. Menor va antes.
 *
 * 0 verificada y medible · 1 verificada sin cifra legible · 2 no caduca ·
 * 3 sin verificar.
 */
const grupo = (a: Actuacion): number => {
  if (a.term.status === 'NO_VERIFICADO') return 3;
  if (a.term.status === 'NO_CADUCA') return 2;
  return diasDelTermino(a.term.description) === null ? 1 : 0;
};

/** Ordena una lista de sugerencias sin mutarla. Estable dentro de cada grupo. */
export const porTerminoMasCorto = <T extends { actuacion: Actuacion }>(items: T[]): T[] =>
  items
    .map((item, i) => ({ item, i }))
    .sort((x, y) => {
      const gx = grupo(x.item.actuacion);
      const gy = grupo(y.item.actuacion);
      if (gx !== gy) return gx - gy;

      if (gx === 0) {
        const dx = diasDelTermino(x.item.actuacion.term.description) ?? 0;
        const dy = diasDelTermino(y.item.actuacion.term.description) ?? 0;
        if (dx !== dy) return dx - dy;
      }

      return x.i - y.i;
    })
    .map((x) => x.item);

/**
 * Cuál de las tarjetas lleva el botón primario, o `-1` si ninguna.
 *
 * El artboard es explícito: «Solo una tarjeta tiene botón primario (la de
 * término más corto y verificada); las demás quedan en secundario. Seis
 * primarios equivalen a ninguno». Y si la primera no está verificada, no hay
 * primario en absoluto: el botón que invita a redactar no puede recaer sobre
 * una actuación cuyo plazo nadie comprobó.
 */
export const indiceDelPrimario = <T extends { actuacion: Actuacion }>(ordenadas: T[]): number => {
  const i = ordenadas.findIndex((s) => s.actuacion.term.status !== 'NO_VERIFICADO');
  return i;
};
