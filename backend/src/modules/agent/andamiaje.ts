import { catalogService } from '../catalog/catalog.service';
import type { Actuacion, LegalBranch } from '../catalog/types';
import {
  canonizarNorma,
  claveDe,
  etiquetaDeNorma,
  referenciasDelTexto,
  type ReferenciaNormativa
} from './citacionNormativa';

/**
 * EL ANDAMIAJE PROCESAL DE UNA RAMA: los artículos que cualquier escrito de esa
 * rama necesita y que la ficha de la actuación no trae.
 *
 * ─── EL PROBLEMA QUE RESUELVE ───────────────────────────────────────────────
 *
 * La ficha del catálogo trae la norma PROCESAL DE LA ACTUACIÓN y nada más. La de
 * «Demanda de restitución de inmueble arrendado» autoriza el art. 384 del CGP y
 * seis artículos vecinos; no trae el artículo de la competencia, ni el de los
 * anexos, ni el del juramento estimatorio, ni el de las notificaciones. Por eso
 * la REGLA DE CITACIÓN nació abierta —«cita únicamente los artículos indicados
 * arriba Y AQUELLOS QUE CONOZCAS CON CERTEZA»—: era una válvula de cobertura
 * real, no un descuido.
 *
 * Medida el 9 de septiembre de 2026, esa válvula dejó pasar 23 artículos fuera
 * de la ficha en un solo escrito. Casi la mitad de ellos era andamiaje inevitable
 * (10 de 22 en una corrida, 12 de 24 en la otra). Cerrar la lista a secas no
 * cambia una demanda con artículos inventados por una demanda buena: la cambia
 * por una demanda sin artículo de competencia. Este módulo es el contenido que
 * hace posible cerrarla.
 *
 * ─── DE DÓNDE SALE LA LISTA, Y POR QUÉ NO LA ESCRIBIÓ NADIE A MANO ──────────
 *
 * Se DERIVA del catálogo ya verificado, no se teclea. La propuesta ganadora
 * pedía ~150 artículos tecleados con su texto verbatim, y los tres jueces le
 * pusieron la misma objeción: una lista transversal escrita a mano envejece en
 * silencio y nadie la vuelve a abrir, a diferencia de una ficha, que alguien
 * abre cada vez que redacta esa actuación. Aquí la lista no tiene dueño porque
 * no tiene vida propia: cada entrada existe porque DOS O MÁS fichas de la rama
 * —leídas contra el texto oficial, artículo por artículo— apoyan una sección
 * exigida en ese artículo. El día que esas fichas se corrijan, la lista se mueve
 * con ellas sin que nadie se acuerde de este archivo.
 *
 * EL UMBRAL DE DOS NO ES ARBITRARIO. Con una sola ficha, el artículo es de esa
 * actuación y no de la rama —y esa ficha ya lo autoriza por su cuenta—. Con dos
 * o más hay dos lecturas independientes de la norma que coinciden en para qué
 * sirve. Medido sobre las 883 fichas, el umbral produce entre 15 y 46 entradas
 * por rama, que es el orden de magnitud que la propuesta pedía y el que cabe en
 * un prompt sin ahogar la ficha.
 *
 * ─── NO HAY TEXTO VERBATIM, Y ESO ES DELIBERADO ─────────────────────────────
 *
 * La propuesta ganadora quería el texto de cada artículo entre comillas para que
 * el modelo transcribiera en vez de glosar. Sería lo mejor. Pero nadie de esta
 * casa ha leído esos ~150 artículos completos, y escribir aquí un «texto oficial»
 * que salga de la memoria de un modelo sería exactamente el defecto que este
 * trabajo existe para cerrar, con el agravante de que iría en el sitio que el
 * producto llama verificado. Así que la entrada trae NÚMERO y RÚBRICA —el nombre
 * de la sección que la ficha apoya en él, escrito por quien leyó la norma— y no
 * trae texto. Y como no lo trae, rige la regla 2 sin excepción: el número sí, lo
 * que dice no.
 *
 * Cuando alguien verifique esos textos, el sitio donde deben vivir es el
 * catálogo (`catalog/data`), con su validador y su pantalla de curaduría, igual
 * que las 883 fichas. No aquí.
 *
 * ─── LO QUE ESTE MÓDULO EMPEORA, DICHO AQUÍ Y NO EN LA PRESENTACIÓN ─────────
 *
 * Poner cuarenta artículos delante del modelo en cada borrador es una casilla, y
 * las casillas se llenan: este mismo repositorio lo escribió sobre el bloque
 * vacío de jurisprudencia («a model does not read a blank as there is none; it
 * reads it as a slot»). Se recibirá el art. 590 citado donde no se piden
 * cautelares, y el cedazo no lo verá porque está autorizado. Se acepta el cambio
 * —un artículo real mal traído se discute en audiencia, uno inventado se pierde—
 * y se mitiga con una frase explícita en el bloque: la lista no es un formulario.
 */

/** Una entrada del andamiaje. Sin rúbrica no se emite: un número pelado es una casilla. */
export interface ArticuloDeAndamiaje {
  codigo: string;
  articulo: number;
  /** Para qué lo usa el catálogo, con las palabras de quien leyó la norma. */
  rubrica: string;
  /** Cuántas fichas distintas de la rama lo apoyan. Nunca menor que el umbral. */
  fichasQueLoApoyan: number;
}

/** Dos lecturas independientes. Ver el comentario de cabecera. */
const UMBRAL_DE_FICHAS = 2;

/**
 * Tope de entradas emitidas. No es una restricción de tokens sino de atención:
 * la ficha es la que manda, y una lista más larga que la ficha compite con ella.
 */
const TOPE_POR_RAMA = 40;

const cache = new Map<LegalBranch, ArticuloDeAndamiaje[]>();

/**
 * Un `basis` de sección («Art. 82 num. 7», «Arts. 82 num. 7 y 206») dice a qué
 * artículo pertenece el requisito. El numeral se descarta: `referenciasDelTexto`
 * ya lo hace, y contarlo produciría un «artículo 7» que no existe en la ficha.
 */
const referenciasDelBasis = (basis: string, normaDeLaFicha: string | null): ReferenciaNormativa[] =>
  referenciasDelTexto(basis, normaDeLaFicha);

const normaDeLaFicha = (actuacion: Actuacion): string | null =>
  canonizarNorma(actuacion.legalBasis);

export const andamiajeDeLaRama = (rama: LegalBranch): ArticuloDeAndamiaje[] => {
  const enCache = cache.get(rama);
  if (enCache) return enCache;

  const cuenta = new Map<
    string,
    { ref: ReferenciaNormativa; fichas: Set<string>; rubricas: Map<string, number> }
  >();

  for (const ficha of catalogService.list(rama)) {
    /*
     * Las actuaciones que la firma añadió NO cuentan. Nadie leyó una norma para
     * ellas, y dejarlas votar convertiría el andamiaje —que es lo verificado— en
     * un promedio entre lo verificado y lo recordado.
     */
    if (ficha.firmDefined) continue;
    const norma = normaDeLaFicha(ficha);
    for (const seccion of ficha.requiredSections) {
      if (!seccion.basis) continue;
      for (const ref of referenciasDelBasis(seccion.basis, norma)) {
        const k = claveDe(ref);
        if (!cuenta.has(k)) cuenta.set(k, { ref, fichas: new Set(), rubricas: new Map() });
        const e = cuenta.get(k) as NonNullable<ReturnType<typeof cuenta.get>>;
        e.fichas.add(ficha.id);
        e.rubricas.set(seccion.name, (e.rubricas.get(seccion.name) ?? 0) + 1);
      }
    }
  }

  const lista = [...cuenta.values()]
    .filter((e) => e.fichas.size >= UMBRAL_DE_FICHAS)
    .sort((a, b) => b.fichas.size - a.fichas.size || a.ref.articulo - b.ref.articulo)
    .slice(0, TOPE_POR_RAMA)
    .map((e) => ({
      codigo: e.ref.codigo,
      articulo: e.ref.articulo,
      /* La rúbrica más repetida: la lectura en la que más curadores coincidieron. */
      rubrica: [...e.rubricas.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0],
      fichasQueLoApoyan: e.fichas.size
    }))
    .sort((a, b) => a.codigo.localeCompare(b.codigo) || a.articulo - b.articulo);

  cache.set(rama, lista);
  return lista;
};

/**
 * Los artículos que la ficha misma autoriza.
 *
 * Se leen de los CUATRO sitios donde la ficha los pone, y no solo de
 * `legalBasis`: la ficha de restitución nombra el art. 384 en `legalBasis` y los
 * arts. 368, 369, 90 y el 146 de la Ley 2220 de 2022 sueltos dentro del párrafo
 * narrativo del término. Un cedazo que solo mirara `legalBasis` acusaría al
 * escrito por citar lo que la propia ficha le entregó.
 */
export const articulosDeLaFicha = (actuacion: Actuacion): ReferenciaNormativa[] => {
  const norma = normaDeLaFicha(actuacion);
  const fuentes = [
    actuacion.legalBasis,
    actuacion.competentAuthority ?? '',
    actuacion.term.description ?? '',
    ...actuacion.requiredSections.map((s) => s.basis ?? '')
  ];
  const out: ReferenciaNormativa[] = [];
  const vistas = new Set<string>();
  for (const fuente of fuentes) {
    for (const ref of referenciasDelTexto(fuente, norma)) {
      if (vistas.has(claveDe(ref))) continue;
      vistas.add(claveDe(ref));
      out.push(ref);
    }
  }
  return out;
};

/** Ficha ∪ andamiaje: el universo citable, y el patrón contra el que mide el cedazo. */
export const universoCitable = (actuacion: Actuacion): ReferenciaNormativa[] => {
  const out = articulosDeLaFicha(actuacion);
  const vistas = new Set(out.map(claveDe));
  for (const a of andamiajeDeLaRama(actuacion.branch)) {
    const ref = { codigo: a.codigo, articulo: a.articulo };
    if (vistas.has(claveDe(ref))) continue;
    vistas.add(claveDe(ref));
    out.push(ref);
  }
  return out;
};

/**
 * El bloque que lee el modelo. El caso vacío se DECLARA, nunca se calla: un
 * encabezado seguido de nada es la casilla que ya produjo la SU-049 de 2022.
 */
export const renderAndamiaje = (rama: LegalBranch): string => {
  const lista = andamiajeDeLaRama(rama);
  if (lista.length === 0) {
    return `ANDAMIAJE PROCESAL VERIFICADO — ${rama}: NINGUNO. El catálogo no tiene, para esta rama, ningún artículo transversal corroborado por dos o más fichas. Fuera de la ficha de arriba no hay nada autorizado: rige la regla 1 sin excepción.`;
  }

  const filas = lista
    .map((a) => `- ${etiquetaDeNorma(a.codigo)}, art. ${a.articulo} — ${a.rubrica}`)
    .join('\n');

  return `ANDAMIAJE PROCESAL VERIFICADO — ${rama}. Ninguno de estos artículos sale de la memoria de nadie: cada uno respalda una sección exigida en dos o más fichas del catálogo, leídas contra el texto oficial de la norma. De cada uno tienes el NÚMERO y la RÚBRICA —que es el nombre de la sección que el catálogo apoya en ese artículo, NO un resumen de lo que el artículo dice—. NO tienes su texto, así que sobre ellos rige igual la regla 2: el número sí, lo que dice no.

ESTO NO ES UN FORMULARIO QUE HAYA QUE LLENAR. Cita solo los que este escrito realmente necesite; traer un artículo autorizado a donde no viene al caso es un defecto, aunque el artículo exista.
${filas}`;
};
