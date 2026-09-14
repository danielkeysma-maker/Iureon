import type { PasoDeVisita } from './pasos';

/**
 * Los capítulos de la visita guiada.
 *
 * ─── POR QUÉ CAPÍTULOS Y NO «PASO 2 DE 16» ──────────────────────────────────
 *
 * La visita vieja numeraba paradas: «paso 2 de 12» no decía de qué trataba ni
 * cuánto faltaba, y quien entraba no podía decidir si tenía el rato ni ir a lo
 * que le interesaba (README-app, «La visita guiada se rehizo»). Un capítulo
 * tiene NOMBRE y DURACIÓN, y agrupa paradas que ya existían: no se escribió
 * ningún texto nuevo para la visita.
 *
 * ─── CADA PARADA DICE SU CAPÍTULO, Y NO AL REVÉS ────────────────────────────
 *
 * Si los capítulos listaran las paradas, una parada nueva que nadie añadiera a
 * la lista desaparecería de la visita en silencio. Con el capítulo escrito en
 * la parada, el tipo obliga a declararlo al crearla, y el check confirma que
 * cada una cae exactamente en uno.
 *
 * ─── LA DURACIÓN SE CALCULA, NO SE TECLEA ───────────────────────────────────
 *
 * El diseño dice «Dos minutos» y «20 s». Nadie midió eso. Aquí sale de las
 * palabras que la visita realmente muestra, a 200 por minuto —la cifra
 * convencional de lectura atenta, la misma del manual—, y se presenta como
 * estimación («≈», «unos»). Una cifra escrita a mano se desfasa la primera vez
 * que alguien edita un texto; esta no puede.
 */

export type CapituloId = 'empezar' | 'registrar' | 'consultar' | 'cuenta' | 'ayuda';

export interface DefinicionDeCapitulo {
  readonly id: CapituloId;
  readonly titulo: string;
}

/*
 * El orden y los nombres siguen los grupos de la barra lateral (Producir ·
 * Registrar · Consultar · Aprender), porque la visita enseña precisamente
 * dónde está cada cosa en esa barra. Inicio abre el primero: es de donde se
 * parte. La cuenta y el saldo van antes de la ayuda para que la visita termine
 * donde se pide ayuda, que es lo que queda cuando algo no se encuentra.
 */
export const CAPITULOS_DE_VISITA: readonly DefinicionDeCapitulo[] = [
  { id: 'empezar', titulo: 'Empezar y producir escritos' },
  { id: 'registrar', titulo: 'Registrar lo que pasó' },
  { id: 'consultar', titulo: 'Consultar la norma' },
  { id: 'cuenta', titulo: 'Su cuenta y el saldo' },
  { id: 'ayuda', titulo: 'Dónde pedir ayuda' }
];

export interface CapituloDeVisita {
  readonly id: CapituloId;
  readonly titulo: string;
  /** 1-based entre los capítulos que el plan deja ver. */
  readonly numero: number;
  readonly pasos: readonly PasoDeVisita[];
  /** Estimación de lectura de sus paradas, en segundos. */
  readonly segundos: number;
}

const PALABRAS_POR_MINUTO = 200;

/**
 * Segundos para leer un texto a 200 palabras por minuto, redondeados hacia
 * arriba de cinco en cinco. Hacia arriba porque prometer menos tiempo del que
 * toma es la forma de que la visita se abandone a mitad; y de cinco en cinco
 * porque «≈ 37 s» aparenta una precisión que una estimación no tiene.
 */
export const segundosDeLectura = (texto: string): number => {
  const palabras = texto.trim().split(/\s+/).filter(Boolean).length;
  if (palabras === 0) return 0;
  const exactos = (palabras * 60) / PALABRAS_POR_MINUTO;
  return Math.max(5, Math.ceil(exactos / 5) * 5);
};

/** «≈ 40 s» o «≈ 2 min»: los minutos también hacia arriba. */
export const textoDeDuracion = (segundos: number): string =>
  segundos < 60 ? `≈ ${segundos} s` : `≈ ${Math.ceil(segundos / 60)} min`;

/** La duración de la visita entera, dicha como estimación y no como cifra. */
export const textoDeLaVisitaCompleta = (segundos: number): string => {
  const minutos = Math.ceil(segundos / 60);
  return minutos <= 1 ? 'Un minuto' : `Unos ${minutos} minutos`;
};

/**
 * Agrupa las paradas que el plan deja ver en sus capítulos.
 *
 * Un capítulo cuyas paradas oculta el plan entero no se ofrece —anunciar
 * «Registrar lo que pasó» a una firma sin esos módulos sería una puerta a
 * nada— y la numeración se recorre para que «capítulo 3 de 4» siga siendo
 * verdad.
 */
export const agruparEnCapitulos = (pasos: readonly PasoDeVisita[]): CapituloDeVisita[] =>
  CAPITULOS_DE_VISITA.map((definicion) => ({
    definicion,
    pasos: pasos.filter((p) => p.capitulo === definicion.id)
  }))
    .filter((c) => c.pasos.length > 0)
    .map((c, i) => ({
      id: c.definicion.id,
      titulo: c.definicion.titulo,
      numero: i + 1,
      pasos: c.pasos,
      segundos: c.pasos.reduce((suma, p) => suma + segundosDeLectura(`${p.titulo} ${p.texto}`), 0)
    }));
