import type { ReferenciaNormativa } from '../citacionNormativa';
import type { InformeDeRevision } from './documentReview';
import {
  marcarVarios,
  verificarVigenciaDelEscrito,
  type RevisionDeVigencia
} from './verificarVigencia';

/**
 * ¿SIGUEN VIVOS LOS ARTÍCULOS QUE EL REVISOR CITA? Se comprueba contra la
 * fuente oficial, igual que en Redacción, y por una razón MÁS fuerte.
 *
 * ─── EL HUECO QUE ESTE ARCHIVO CIERRA ──────────────────────────────────────
 *
 * Una auditoría del 10 de septiembre de 2026 encontró que las tres
 * comprobaciones construidas para el borrador —cedazo de citas, vigencia y
 * glosa— NO llegaban a Revisión. Los archivos `verificarVigencia.ts` y
 * `verificarGlosa.ts` viven en esta misma carpeta y nadie de esta carpeta los
 * usaba: geografía engañosa.
 *
 * En el modo ESCRITO_PROPIO convergen cuatro cosas que hacen daño de verdad:
 *
 *   1. Al modelo SE LE ORDENA citar. `documentReview.ts`: «Aquí eres
 *      categórico y citas el artículo», y `catalogGuidance.ts` lo autoriza
 *      expresamente a nombrar artículos fuera de la ficha, porque cerrarle la
 *      lista volvería la revisión inútil.
 *   2. Nada en CÓDIGO lo comprobaba. Solo una regla de prompt — la misma clase
 *      de protección que los tres jueces declararon insuficiente para
 *      Redacción y que allí se sustituyó por código.
 *   3. La salida es TEXTO PARA PEGAR: `correccionesTextuales.reemplazo` es «la
 *      frase con la que la sustituiría, lista para pegar», y en el taller lleva
 *      botón «Aplicar».
 *   4. El defecto medido es exactamente el que aquí no se detectaba. El motor
 *      no inventa derecho: cita artículos reales y VIVOS, y también reales y
 *      MUERTOS —el art. 2035 del Código Civil, derogado en 2003, invocado como
 *      fundamento—.
 *
 * Y DUELE MÁS QUE EN REDACCIÓN, por una razón de producto y no de código: el
 * abogado sabe que un borrador es un borrador, pero aquí la aplicación se
 * presenta como EL REVISOR que le dice qué está mal y le entrega el reemplazo
 * hecho. Un revisor que corrige una cita buena con una muerta es más peligroso
 * que un redactor que la inventa, porque después de que el revisor habló el
 * abogado ya no vuelve a mirar.
 *
 * ─── NO CUESTA UN PESO DE MOTOR, Y ESO DECIDIÓ EL ORDEN ────────────────────
 *
 * Esta comprobación NO llama a ningún modelo: descarga el texto oficial del
 * Senado y de Función Pública y lee el marcador. Lo único que gasta es reloj.
 * Por eso entra antes que la comprobación de glosa, que sí son hasta ocho
 * llamadas al motor por informe.
 *
 * ─── QUÉ SE MARCA Y QUÉ NO ────────────────────────────────────────────────
 *
 * Se marca donde el revisor HABLA, y no dentro de `cita`, que es un pedazo
 * VERBATIM del escrito del abogado. Meterle un corchete a una cita textual la
 * deja de ser textual, y este producto tiene escrito que no reescribe lo que
 * no es suyo. El artículo muerto que el abogado citó igual sale señalado: en
 * `problema`, que es la casilla de al lado y es donde el revisor explica.
 *
 * Como en Redacción, SE INSERTA y no se borra ni se reordena una palabra.
 */

/** Los pedazos del informe donde el REVISOR habla con voz propia. */
const vocesDelRevisor = (informe: InformeDeRevision): string[] => [
  informe.resumen,
  ...informe.fortalezas,
  ...informe.debilidades,
  ...informe.seccionesFaltantes,
  ...informe.erroresDeAplicacion.flatMap((e) => [e.donde, e.problema, e.correccion]),
  ...informe.correccionesTextuales.flatMap((c) => [c.problema, c.reemplazo]),
  ...informe.recomendaciones
];

/*
 * LA CITA DEL ABOGADO TAMBIÉN SE LEE, AUNQUE NO SE MARQUE.
 *
 * Si el escrito revisado invoca un artículo derogado y el revisor lo copia en
 * `cita` sin darse cuenta, ése es justo el hallazgo que el abogado pagó por
 * recibir. Se incluye para COMPROBARLO; lo que no se hace es escribir dentro
 * de la cita.
 */
const textoParaComprobar = (informe: InformeDeRevision): string =>
  [...vocesDelRevisor(informe), ...informe.correccionesTextuales.map((c) => c.cita)].join('\n');

/**
 * Comprueba la vigencia de lo que el informe cita por fuera de la ficha.
 *
 * `autorizados` son los artículos del universo citable de la actuación —ficha
 * ∪ andamiaje—, que ya se leyeron contra la fuente al construir el catálogo.
 * Gastar el plazo en ellos dejaría sin comprobar justamente las citas que
 * nadie de esta casa ha leído, que son las peligrosas.
 */
export const verificarVigenciaDelInforme = async (
  informe: InformeDeRevision,
  autorizados: ReferenciaNormativa[],
  limiteMs: number
): Promise<RevisionDeVigencia> =>
  verificarVigenciaDelEscrito(textoParaComprobar(informe), autorizados, limiteMs);

/** Las marcas que se pegan al lado de cada artículo problemático. */
const marcasDe = (revision: RevisionDeVigencia): Array<{ articulo: number; marca: string }> => [
  ...revision.resultados
    .filter((r) => r.estado === 'DEROGADO')
    .map((r) => ({
      articulo: r.referencia.articulo,
      marca: `[NORMA DEROGADA — este artículo NO está vigente: ${r.detalle}. La revisión lo nombró de todos modos; no se apoye en él.]`
    })),
  ...revision.resultados
    .filter((r) => r.estado === 'MODULADO')
    .map((r) => ({
      articulo: r.referencia.articulo,
      marca: `[NORMA VIGENTE PERO MODULADA POR LA CORTE — rige, pero su texto publicado no es el que rige: ${r.detalle} Léalo en la sentencia antes de usarlo.]`
    })),
  ...revision.resultados
    .filter((r) => r.estado === 'DISCREPANCIA_ENTRE_FUENTES')
    .map((r) => ({
      articulo: r.referencia.articulo,
      marca: `[LAS FUENTES OFICIALES NO COINCIDEN sobre este artículo — ${r.detalle} Esta casa no elige: compruébelo usted.]`
    }))
];

/**
 * El informe con las marcas puestas donde el revisor habla.
 *
 * Devuelve un informe NUEVO: el original no se toca, porque es lo que se
 * guardó y lo que hay que poder volver a leer tal como salió.
 */
export const marcarVigenciaEnInforme = (
  informe: InformeDeRevision,
  revision: RevisionDeVigencia
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
 * Se añade a `recomendaciones` y va PRIMERO. No es una recomendación más: es
 * la única línea del informe que dice que una parte del propio informe no se
 * puede usar tal como está, y detrás de una lista de siete consejos no la lee
 * nadie. Vacío cuando no hay nada que avisar — un encabezado seguido de nada
 * es una casilla, y este repositorio ya sabe cómo terminan.
 */
export const avisoDeVigencia = (revision: RevisionDeVigencia): string | null => {
  const nombre = (articulo: number, codigo: string): string => `${codigo}, art. ${articulo}`;
  const derogados = revision.resultados.filter((r) => r.estado === 'DEROGADO');
  const modulados = revision.resultados.filter((r) => r.estado === 'MODULADO');
  const discrepantes = revision.resultados.filter((r) => r.estado === 'DISCREPANCIA_ENTRE_FUENTES');
  if (derogados.length + modulados.length + discrepantes.length === 0) return null;

  const partes: string[] = [];
  if (derogados.length > 0) {
    partes.push(
      `${derogados.length} DEROGADO(S): ${derogados
        .map((r) => nombre(r.referencia.articulo, r.referencia.codigo))
        .join('; ')}`
    );
  }
  if (modulados.length > 0) {
    partes.push(
      `${modulados.length} vigente(s) pero MODULADO(S) por la Corte: ${modulados
        .map((r) => nombre(r.referencia.articulo, r.referencia.codigo))
        .join('; ')}`
    );
  }
  if (discrepantes.length > 0) {
    partes.push(
      `${discrepantes.length} sobre el/los que las fuentes oficiales NO COINCIDEN: ${discrepantes
        .map((r) => nombre(r.referencia.articulo, r.referencia.codigo))
        .join('; ')}`
    );
  }

  return (
    'COMPROBACIÓN AUTOMÁTICA DE VIGENCIA — esta revisión citó artículos por fuera de la ficha verificada, ' +
    'y el sistema los consultó uno por uno en las fuentes normativas oficiales (la Secretaría del Senado y ' +
    `el Gestor Normativo de Función Pública): ${partes.join('. ')}. ` +
    'Cada uno queda señalado en el punto donde la revisión lo nombra. ' +
    'El resto del informe no cambia; lo señalado no se puede usar tal como está.'
  );
};
