import type { InformeDeRevision } from './documentReview';
import {
  extractoOficial,
  verificarGlosaDelEscrito,
  type GlosaJuzgada,
  type JuezDeGlosa,
  type RevisionDeGlosa
} from './verificarGlosa';
import { etiquetaDeNorma } from '../citacionNormativa';
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
 * El extracto del texto oficial que acompaña a una glosa. 200 caracteres, como
 * llevaba el corchete: dos líneas que explican el veredicto, no un muro.
 */
export const extractoDeGlosa = (r: GlosaJuzgada): string => extractoOficial(r.textoOficial, r.apoyo, 200);

/**
 * EL MENSAJE DE UNA GLOSA NO SOSTENIDA, con la redacción del corchete que este
 * archivo pegaba en el informe hasta el 14 de septiembre de 2026, sin los
 * corchetes. Ya no se pega: viaja como dato en `comprobacionesDelInforme.ts`.
 * La redacción no cambia porque los informes guardados antes la traen dentro
 * del texto y el frontend la reconoce por su apertura y su cierre exactos.
 *
 * SOLO LO NO SOSTENIDO SE MARCA SOBRE EL HALLAZGO, igual que antes en línea:
 * marcar también las dudosas volvería invisible la marca que importa. Las
 * dudosas se cuentan en la banda y se declaran en el aviso.
 */
export const mensajeDeGlosa = (r: GlosaJuzgada): string =>
  `LO QUE ESTA REVISIÓN AFIRMA NO LO DICE ESE ARTÍCULO — el texto oficial dice: «${extractoDeGlosa(r)}». ${r.motivo} No se apoye en este punto sin leer la norma.`;

/**
 * El aviso de cabecera, para quien hojea el informe en vez de leerlo entero.
 *
 * SOLO HABLA DE LO QUE HAY QUE MIRAR — lo no sostenido y lo dudoso. Lo
 * comprobado y correcto no se anuncia en el aviso: iba dentro de
 * `recomendaciones`, una lista de cosas por hacer, y hoy va en la banda de la
 * comprobación (`comprobaciones.avisos`) con la misma redacción, porque los
 * informes guardados antes la traen en el texto. Lo sostenido sí viaja, como
 * dato, en `comprobaciones.articulos`, para quien quiera saber qué se revisó.
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
