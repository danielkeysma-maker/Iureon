import type { InformeDeRevision } from './documentReview';
import type { RevisionDeVigencia } from './verificarVigencia';
import { mencionaElArticulo } from './verificarVigencia';
import type { GlosaJuzgada, RevisionDeGlosa, VeredictoDeGlosa } from './verificarGlosa';
import type { EstadoDeVigencia } from '../../legislation/officialArticle.service';
import { etiquetaDeNorma } from '../citacionNormativa';
import { avisoDeVigencia, mensajeDeVigencia } from './vigenciaDelInforme';
import { avisoDeGlosa, extractoDeGlosa, mensajeDeGlosa } from './glosaDelInforme';

/**
 * LA COMPROBACIÓN AUTOMÁTICA DEL INFORME, COMO DATO Y NO COMO TEXTO.
 *
 * ─── LA DECISIÓN (14 de septiembre de 2026, «opción 2») ────────────────────
 *
 * La vigencia y la glosa se entregaban pegadas al informe: un corchete donde el
 * revisor nombraba el artículo —repetido en cada mención y en cada casilla— y
 * dos avisos antepuestos a `recomendaciones`. El diseño nuevo pide una banda
 * con conteos por clase, una marca SOBRE el hallazgo y un «Ir al punto», y
 * nada de eso se construye releyendo corchetes. El servidor manda aquí los
 * resultados ordenados y el texto del informe queda con las palabras del
 * revisor y ninguna otra.
 *
 * ─── SIN MIGRACIÓN ─────────────────────────────────────────────────────────
 *
 * Viaja DENTRO del informe (`informe.comprobaciones`), que se guarda en la
 * columna JSONB `document_reviews.informe`. Una columna hermana exigiría SQL y
 * dejaría la posibilidad de un informe sin su comprobación o al revés; dentro
 * del mismo JSON, lo que se leyó y lo que se comprobó se guardan y se leen
 * juntos.
 *
 * ─── TRES ESTADOS, Y NINGUNO SE CONFUNDE CON OTRO ──────────────────────────
 *
 *   · `comprobaciones` AUSENTE: informe guardado antes de este cambio. Trae los
 *     corchetes en el texto y el frontend los lee por apertura y cierre.
 *   · `comprobaciones: null`: «Volver a revisar», que no repite la comprobación
 *     (decisión de costo y reloj no tomada). La pantalla lo dice.
 *   · Un objeto: se comprobó. Con `articulos` vacío si no hubo citas fuera de la
 *     ficha, y con `vigenciaComprobada: false` si la fuente falló — que no es lo
 *     mismo que «nada que avisar».
 */

/** Las casillas del informe donde puede aparecer un artículo. */
export type SeccionDelInforme =
  | 'resumen'
  | 'fortalezas'
  | 'debilidades'
  | 'seccionesFaltantes'
  | 'erroresDeAplicacion'
  | 'correccionesTextuales'
  | 'recomendaciones';

/**
 * El campo, en las secciones que tienen más de uno.
 *
 * `cita` NO ESTABA en la lista de lo que se marcaba, y se añade a propósito: la
 * vigencia comprueba también lo que el abogado citó (`vigenciaDelInforme.ts`),
 * y un artículo muerto que SOLO aparece en la cita quedaba sin ningún lugar al
 * que llevar — el aviso decía «queda señalado en el punto donde la revisión lo
 * nombra» y no había punto. Con el lugar, la pantalla marca la tarjeta de esa
 * corrección; lo que no hace nunca es escribir dentro de la cita.
 */
export type CampoDelInforme = 'donde' | 'problema' | 'correccion' | 'cita' | 'reemplazo';

export interface LugarDelInforme {
  seccion: SeccionDelInforme;
  indice: number;
  campo?: CampoDelInforme;
}

/** Las clases que la banda cuenta. Lo VIGENTE y SOSTENIDO no tiene clase. */
export type ClaseDeComprobacion =
  | 'DEROGADA'
  | 'MODULADA'
  | 'FUENTES_EN_DESACUERDO'
  | 'NO_LO_DICE_EL_ARTICULO'
  | 'NO_COMPROBADA';

export interface VigenciaComprobada {
  estado: EstadoDeVigencia;
  detalle: string;
  /** Las fuentes oficiales que opinaron. Vacío en NO_VERIFICABLE. */
  fuentes: string[];
  url?: string;
  consultadoEn: string;
}

export interface GlosaComprobada {
  veredicto: VeredictoDeGlosa;
  /** La frase del REVISOR que se juzgó. */
  frase: string;
  extractoOficial: string;
  motivo: string;
  url?: string;
}

export interface ComprobacionDeArticulo {
  /** La clave interna de la norma («CODIGO CIVIL», «CGP»). */
  codigo: string;
  /** Cómo se le nombra al abogado («Código Civil»). */
  norma: string;
  articulo: number;
  vigencia: VigenciaComprobada;
  /**
   * La glosa que representa al artículo: la peor (no sostenida > dudosa >
   * sostenida). null si la glosa no lo juzgó — porque la fuente no trajo el
   * texto, o porque el revisor no afirmó nada sobre él.
   */
  glosa: GlosaComprobada | null;
  /** Todas las afirmaciones juzgadas sobre este artículo, en orden. */
  glosas: GlosaComprobada[];
  clases: ClaseDeComprobacion[];
  /** Por clase, el mensaje que se lee junto al hallazgo o en la banda. */
  mensajes: Array<{ clase: ClaseDeComprobacion; texto: string }>;
  dondeAparece: LugarDelInforme[];
}

export interface CuentaDeComprobaciones {
  derogada: number;
  modulada: number;
  fuentesEnDesacuerdo: number;
  noLoDiceElArticulo: number;
  noComprobada: number;
}

export interface ComprobacionesDelInforme {
  /**
   * TODOS los artículos comprobados, también los vigentes y sostenidos.
   *
   * Se incluyen porque «qué se comprobó» es una pregunta legítima —el abogado
   * que ve cero avisos quiere saber si fue porque todo estaba bien o porque no
   * se miró nada— y porque un dato que no se manda no se puede pintar mañana.
   * Lo que NO hacen es contar en la banda: `cuenta` solo suma lo accionable, y
   * un «7 comprobados» en la banda se leería como siete problemas.
   */
  articulos: ComprobacionDeArticulo[];
  cuenta: CuentaDeComprobaciones;
  /** Los avisos de cabecera de siempre —vigencia, luego glosa—, solo los que dicen algo. */
  avisos: string[];
  /** false si la consulta de vigencia falló: entonces nada se comprobó, y no es «nada que avisar». */
  vigenciaComprobada: boolean;
  /** false si la glosa falló o no pudo correr porque la vigencia no trajo textos. */
  glosaComprobada: boolean;
}

/** Los pedazos del informe, con su lugar. `cita` se lee para ubicar, nunca para escribir. */
const casillasDe = (informe: InformeDeRevision): Array<{ lugar: LugarDelInforme; texto: string }> => [
  { lugar: { seccion: 'resumen', indice: 0 }, texto: informe.resumen },
  ...informe.fortalezas.map((texto, indice) => ({ lugar: { seccion: 'fortalezas' as const, indice }, texto })),
  ...informe.debilidades.map((texto, indice) => ({ lugar: { seccion: 'debilidades' as const, indice }, texto })),
  ...informe.seccionesFaltantes.map((texto, indice) => ({ lugar: { seccion: 'seccionesFaltantes' as const, indice }, texto })),
  ...informe.erroresDeAplicacion.flatMap((e, indice) =>
    (['donde', 'problema', 'correccion'] as const).map((campo) => ({
      lugar: { seccion: 'erroresDeAplicacion' as const, indice, campo },
      texto: e[campo]
    }))
  ),
  ...informe.correccionesTextuales.flatMap((c, indice) =>
    (['problema', 'cita', 'reemplazo'] as const).map((campo) => ({
      lugar: { seccion: 'correccionesTextuales' as const, indice, campo },
      texto: c[campo]
    }))
  ),
  ...informe.recomendaciones.map((texto, indice) => ({ lugar: { seccion: 'recomendaciones' as const, indice }, texto }))
];

/**
 * Dónde aparece un artículo, con `mencionaElArticulo`: la MISMA expresión que
 * decidía dónde pegar el corchete. Un lugar por casilla aunque la casilla lo
 * nombre dos veces — la marca va sobre el hallazgo, no sobre cada mención.
 *
 * Como antes, se compara por NÚMERO de artículo y no por norma: el corchete
 * del art. 8 caía en cualquier «artículo 8» del informe. Afinarlo por norma es
 * otra decisión, y tomarla aquí haría que los informes nuevos y los guardados
 * señalaran sitios distintos.
 */
const dondeAparece = (informe: InformeDeRevision, articulo: number): LugarDelInforme[] =>
  casillasDe(informe)
    .filter((c) => c.texto && mencionaElArticulo(c.texto, articulo))
    .map((c) => c.lugar);

const PESO: Record<VeredictoDeGlosa, number> = { NO_SOSTENIDA: 0, DUDOSA: 1, SOSTENIDA: 2 };

const glosaComprobada = (r: GlosaJuzgada): GlosaComprobada => ({
  veredicto: r.veredicto,
  frase: r.frase,
  extractoOficial: extractoDeGlosa(r),
  motivo: r.motivo,
  ...(r.url ? { url: r.url } : {})
});

/**
 * El mensaje de lo que no se pudo comprobar. No hay corchete del que copiarlo:
 * lo NO_VERIFICABLE y lo DUDOSO nunca se marcaron en línea, y siguen sin
 * marcarse sobre el hallazgo — solo se cuentan en la banda y se nombran ahí.
 */
const mensajeNoComprobada = (detalle: string): string => `No se pudo comprobar: ${detalle}`;

/**
 * Arma la comprobación a partir de lo que ya devolvieron la vigencia y la glosa.
 * No consulta nada: es pura, y por eso se prueba sin red.
 *
 * `vigencia` null = la consulta falló; `glosa` null = falló o no corrió.
 */
export const construirComprobaciones = (
  informe: InformeDeRevision,
  vigencia: RevisionDeVigencia | null,
  glosa: RevisionDeGlosa | null
): ComprobacionesDelInforme => {
  const resultadosDeGlosa = glosa?.resultados ?? [];

  const articulos = (vigencia?.resultados ?? []).map((v): ComprobacionDeArticulo => {
    const { codigo, articulo } = v.referencia;
    const juzgadas = resultadosDeGlosa.filter((g) => g.referencia.codigo === codigo && g.referencia.articulo === articulo);
    const peor = [...juzgadas].sort((a, b) => PESO[a.veredicto] - PESO[b.veredicto])[0];

    const mensajes: Array<{ clase: ClaseDeComprobacion; texto: string }> = [];
    const deVigencia = mensajeDeVigencia(v);
    if (v.estado === 'DEROGADO' && deVigencia) mensajes.push({ clase: 'DEROGADA', texto: deVigencia });
    if (v.estado === 'MODULADO' && deVigencia) mensajes.push({ clase: 'MODULADA', texto: deVigencia });
    if (v.estado === 'DISCREPANCIA_ENTRE_FUENTES' && deVigencia) mensajes.push({ clase: 'FUENTES_EN_DESACUERDO', texto: deVigencia });
    if (v.estado === 'NO_VERIFICABLE') mensajes.push({ clase: 'NO_COMPROBADA', texto: mensajeNoComprobada(v.detalle) });
    /* Igual que el corchete: la marca de glosa la pone la PRIMERA no sostenida del artículo. */
    const noSostenida = juzgadas.find((g) => g.veredicto === 'NO_SOSTENIDA');
    if (noSostenida) mensajes.push({ clase: 'NO_LO_DICE_EL_ARTICULO', texto: mensajeDeGlosa(noSostenida) });
    const dudosa = juzgadas.find((g) => g.veredicto === 'DUDOSA');
    if (!noSostenida && dudosa && !mensajes.some((m) => m.clase === 'NO_COMPROBADA')) {
      mensajes.push({ clase: 'NO_COMPROBADA', texto: mensajeNoComprobada(dudosa.motivo) });
    }

    return {
      codigo,
      norma: etiquetaDeNorma(codigo),
      articulo,
      vigencia: {
        estado: v.estado,
        detalle: v.detalle,
        fuentes: [...v.fuentesQueOpinaron],
        ...(v.url ? { url: v.url } : {}),
        consultadoEn: v.consultadoEn
      },
      glosa: peor ? glosaComprobada(peor) : null,
      glosas: juzgadas.map(glosaComprobada),
      clases: mensajes.map((m) => m.clase),
      mensajes,
      dondeAparece: dondeAparece(informe, articulo)
    };
  });

  const cuantos = (clase: ClaseDeComprobacion): number => articulos.filter((a) => a.clases.includes(clase)).length;

  return {
    articulos,
    cuenta: {
      derogada: cuantos('DEROGADA'),
      modulada: cuantos('MODULADA'),
      fuentesEnDesacuerdo: cuantos('FUENTES_EN_DESACUERDO'),
      noLoDiceElArticulo: cuantos('NO_LO_DICE_EL_ARTICULO'),
      noComprobada: cuantos('NO_COMPROBADA')
    },
    /* En el orden escrito a mano de siempre: un artículo derogado invalida el punto; una glosa, una frase. */
    avisos: [vigencia ? avisoDeVigencia(vigencia) : null, glosa ? avisoDeGlosa(glosa) : null].filter(
      (a): a is string => a !== null
    ),
    vigenciaComprobada: vigencia !== null,
    glosaComprobada: glosa !== null
  };
};

/**
 * El informe que se guarda y se responde: el texto del revisor tal cual, con la
 * comprobación y los pasajes del caso al lado. Devuelve uno NUEVO.
 */
export const informeConComprobaciones = (
  informe: InformeDeRevision,
  comprobaciones: ComprobacionesDelInforme,
  pasajesDelCaso: number
): InformeDeRevision => ({ ...informe, comprobaciones, pasajesDelCaso });

/**
 * El informe de «Volver a revisar»: no repitió la comprobación ni cruzó el
 * expediente, y lo declara con `null` y cero en vez de callarlo. Un informe sin
 * comprobación que no lo dijera se leería igual que uno comprobado y limpio.
 */
export const informeSinComprobar = (informe: InformeDeRevision): InformeDeRevision => ({
  ...informe,
  comprobaciones: null,
  pasajesDelCaso: 0
});
