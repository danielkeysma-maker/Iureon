import type { InformeDeRevision } from './documentReview';
import {
  extractoOficial,
  verificarGlosaDelEscrito,
  type GlosaJuzgada,
  type JuezDeGlosa,
  type RevisionDeGlosa
} from './verificarGlosa';
import { etiquetaDeNorma } from '../citacionNormativa';
import { marcarVarios } from './verificarVigencia';
import type { VigenciaDeArticulo } from '../../legislation/officialArticle.service';

/**
 * ¿DICE EL ARTÍCULO LO QUE EL REVISOR DICE QUE DICE? La tercera comprobación
 * llega a Revisión, que es donde más falta hacía.
 *
 * ─── POR QUÉ ESTA ES LA QUE FALTABA ────────────────────────────────────────
 *
 * Las tres comprobaciones del borrador atacan tres defectos distintos:
 *
 *   1. El CEDAZO mira si la cita está dentro de lo que esta casa ha leído.
 *   2. La VIGENCIA mira si el artículo sigue vivo. Ya llegó a Revisión
 *      (`vigenciaDelInforme.ts`) y cazó el caso medido: el art. 2035 del
 *      Código Civil, derogado en 2003, invocado como fundamento.
 *   3. Esta mira si lo que se AFIRMA de ese artículo es lo que el artículo
 *      dice. Es la única que ve el defecto que las otras dos aprueban con
 *      razón: el art. 8 de la Ley 820 está VIGENTE y es del catálogo, y la
 *      frase «sobre las obligaciones del arrendatario» es su reverso exacto,
 *      porque son las del ARRENDADOR.
 *
 * Un artículo inventado se cae solo: el juez no lo encuentra. Uno muerto se cae
 * cuando alguien mira el corchete. Una glosa falsa sobre un artículo vivo no se
 * cae nunca sola — hay que abrir la norma y leerla.
 *
 * ─── Y DUELE MÁS AQUÍ QUE EN EL BORRADOR ───────────────────────────────────
 *
 * Por lo mismo que ya está escrito en `vigenciaDelInforme.ts`: al revisor SE LE
 * ORDENA citar («aquí eres categórico y citas el artículo»), su salida es texto
 * LISTO PARA PEGAR con botón «Aplicar» en el taller, y el abogado sabe que un
 * borrador es un borrador pero llega a este informe buscando que le digan qué
 * está mal. Después de que el revisor habló, ya no vuelve a mirar. Un revisor
 * que explica mal un artículo vivo produce exactamente la corrección con la que
 * se empeora un escrito que estaba bien.
 *
 * ─── SE JUZGA LO QUE EL REVISOR AFIRMA, NO LO QUE EL ABOGADO ESCRIBIÓ ──────
 *
 * La comprobación de vigencia sí lee `correccionesTextuales.cita` —el pedazo
 * verbatim del escrito del abogado— porque un artículo derogado que el abogado
 * invocó y el revisor copió sin darse cuenta es justo el hallazgo que se pagó
 * por recibir. Aquí NO, y por dos razones:
 *
 *   · LA ATRIBUCIÓN SERÍA FALSA. El aviso de esta comprobación dice «esta
 *     revisión afirma X y el texto oficial no lo sostiene». Si la frase juzgada
 *     salió del escrito del abogado, el aviso le achaca al revisor una
 *     afirmación que no hizo. Una acusación mal dirigida enseña a ignorar todos
 *     los avisos, que es la doctrina de esta casa desde el detector de voces.
 *
 *   · Y NO HABRÍA DÓNDE MARCARLA. La cita es verbatim: meterle un corchete la
 *     deja de ser textual, y este producto no reescribe lo que no es suyo.
 *
 * Las ocho llamadas se gastan, entonces, en las frases que la aplicación
 * escribió y entrega como buenas.
 *
 * ─── NO DESCARGA NADA NUEVO ────────────────────────────────────────────────
 *
 * Se alimenta de lo que la comprobación de vigencia YA bajó del Senado y de
 * Función Pública: los mismos artículos, con su texto oficial dentro. Esta
 * etapa no añade una sola petición a las fuentes. Lo que añade son hasta ocho
 * llamadas al motor barato, en paralelo, con el texto delante — y por eso corre
 * DESPUÉS de la vigencia y no antes.
 *
 * ─── FALLAR ABIERTO, COMO SIEMPRE ──────────────────────────────────────────
 *
 * Cuando esto corre, el informe ya está escrito y ya se pagó. Agotar el plazo
 * significa DUDOSA declarada; un fallo del comprobador no le quita al abogado
 * el informe que compró.
 */

/**
 * Los pedazos del informe donde el REVISOR habla con voz propia.
 *
 * Es la misma lista que la comprobación de vigencia, MENOS `cita`. Se escribe
 * aquí y no se importa de allá a propósito: son dos decisiones distintas sobre
 * qué entra, y compartir la lista haría que cambiar una cambiara la otra sin
 * que nadie lo notara.
 */
const vocesDelRevisor = (informe: InformeDeRevision): string[] => [
  informe.resumen,
  ...informe.fortalezas,
  ...informe.debilidades,
  ...informe.seccionesFaltantes,
  ...informe.erroresDeAplicacion.flatMap((e) => [e.donde, e.problema, e.correccion]),
  ...informe.correccionesTextuales.flatMap((c) => [c.problema, c.reemplazo]),
  ...informe.recomendaciones
];

/**
 * Juzga contra el texto oficial lo que el informe afirma de cada artículo.
 *
 * `vigencias` son los resultados de la comprobación de vigencia, que ya traen
 * el cuerpo del artículo descargado. Sin ellos esto no juzga nada — y así debe
 * ser: preguntarle al motor qué recuerda del artículo es exactamente lo que
 * falló al escribir la frase.
 */
export const verificarGlosaDelInforme = async (
  informe: InformeDeRevision,
  vigencias: VigenciaDeArticulo[],
  limiteMs: number,
  /* Postizo solo en la guarda: en producción juzga el motor barato. */
  juez?: JuezDeGlosa
): Promise<RevisionDeGlosa> => {
  const voces = vocesDelRevisor(informe).join('\n');
  return juez
    ? verificarGlosaDelEscrito(voces, vigencias, limiteMs, juez)
    : verificarGlosaDelEscrito(voces, vigencias, limiteMs);
};

const nombre = (r: GlosaJuzgada): string =>
  `${etiquetaDeNorma(r.referencia.codigo)}, art. ${r.referencia.articulo}`;

/**
 * Las marcas en línea. SOLO LO NO SOSTENIDO, igual que en el borrador: meter
 * también las dudosas llenaría de corchetes un informe en el que casi todo está
 * bien y volvería invisible la marca que importa. Las dudosas se declaran en la
 * cabecera, que es donde se hojea.
 */
const marcasDe = (revision: RevisionDeGlosa): Array<{ articulo: number; marca: string }> => {
  const puestos = new Set<number>();
  const marcas: Array<{ articulo: number; marca: string }> = [];
  for (const r of revision.resultados.filter((x) => x.veredicto === 'NO_SOSTENIDA')) {
    if (puestos.has(r.referencia.articulo)) continue;
    puestos.add(r.referencia.articulo);
    marcas.push({
      articulo: r.referencia.articulo,
      marca: `[LO QUE ESTA REVISIÓN AFIRMA NO LO DICE ESE ARTÍCULO — el texto oficial dice: «${extractoOficial(
        r.textoOficial,
        r.apoyo,
        200
      )}». ${r.motivo} No se apoye en este punto sin leer la norma.]`
    });
  }
  return marcas;
};

/**
 * El informe con las marcas puestas donde el revisor habla.
 *
 * Devuelve un informe NUEVO: el original no se toca, porque es lo que se pagó y
 * lo que hay que poder volver a leer tal como salió. Y `cita` sale intacta —es
 * del abogado, verbatim—, que es la misma regla que en la vigencia.
 */
export const marcarGlosaEnInforme = (
  informe: InformeDeRevision,
  revision: RevisionDeGlosa
): InformeDeRevision => {
  const marcas = marcasDe(revision);
  if (marcas.length === 0) return informe;
  const m = (t: string): string => marcarVarios(t, marcas);

  return {
    resumen: m(informe.resumen),
    fortalezas: informe.fortalezas.map(m),
    debilidades: informe.debilidades.map(m),
    seccionesFaltantes: informe.seccionesFaltantes.map(m),
    erroresDeAplicacion: informe.erroresDeAplicacion.map((e) => ({
      donde: m(e.donde),
      problema: m(e.problema),
      correccion: m(e.correccion)
    })),
    correccionesTextuales: informe.correccionesTextuales.map((c) => ({
      /* La cita es del abogado, verbatim. No se le escribe encima. */
      cita: c.cita,
      problema: m(c.problema),
      reemplazo: m(c.reemplazo)
    })),
    recomendaciones: informe.recomendaciones.map(m)
  };
};

/**
 * El aviso de cabecera, para quien hojea el informe en vez de leerlo entero.
 *
 * SOLO HABLA DE LO QUE HAY QUE MIRAR — lo no sostenido y lo dudoso. Lo
 * comprobado y correcto no se anuncia: en el borrador esa lista sirve porque el
 * escrito es largo y el abogado quiere saber qué se revisó, pero aquí iría
 * dentro de `recomendaciones`, que es una lista de cosas por hacer. «No haga
 * nada con estas cuatro» no es una recomendación; es ruido delante de las que
 * sí lo son.
 *
 * Nulo cuando no hay nada que avisar: un encabezado seguido de nada es una
 * casilla, y este repositorio ya sabe cómo terminan.
 */
export const avisoDeGlosa = (revision: RevisionDeGlosa): string | null => {
  const noSostenidas = revision.resultados.filter((r) => r.veredicto === 'NO_SOSTENIDA');
  const dudosas = revision.resultados.filter((r) => r.veredicto === 'DUDOSA');
  if (noSostenidas.length + dudosas.length === 0) return null;

  const partes: string[] = [];
  if (noSostenidas.length > 0) {
    partes.push(
      `${noSostenidas.length} que el texto oficial NO SOSTIENE: ${noSostenidas
        .map((r) => `${nombre(r)} — la revisión afirma «${r.frase}»`)
        .join('; ')}`
    );
  }
  if (dudosas.length > 0) {
    partes.push(
      `${dudosas.length} que no se pudo dar por comprobada(s): ${dudosas
        .map((r) => nombre(r))
        .join('; ')}`
    );
  }

  return (
    'COMPROBACIÓN AUTOMÁTICA DE LO QUE ESTA REVISIÓN AFIRMA DE CADA ARTÍCULO — el sistema descargó el ' +
    'texto oficial de los artículos que la revisión cita por fuera de la ficha verificada y comparó, con ' +
    `ese texto delante, lo que la revisión dice que cada uno dice: ${partes.join('. ')}. ` +
    (noSostenidas.length > 0
      ? 'Lo no sostenido queda marcado en el punto donde la revisión lo afirma; no se apoye en esos puntos. '
      : '') +
    'Lo dudoso no se da por bueno ni por malo: ábralo en la fuente oficial antes de usarlo.'
  );
};
