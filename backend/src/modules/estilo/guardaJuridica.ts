import { CABEZA_DE_ARTICULO, NORMA_CON_ANIO, referenciasDelTexto } from '../agent/citacionNormativa';
import {
  MAX_CARACTERES,
  NUMERACIONES,
  PERSONAS,
  type ContenidoDeLeccion,
  type EntradaDeGlosario,
  type ItemDescartado,
  type Numeracion,
  type PersonaGramatical,
  type TituloDeSeccion
} from './types';
import { PALABRAS_EN_MAYUSCULA_PERMITIDAS, plegar } from './vocabulario';

/**
 * La guarda jurídica del estilo: una lección guarda FORMA, nunca derecho.
 *
 * ─── EL DEFECTO QUE IMPIDE ─────────────────────────────────────────────────
 *
 * El bloque del estilo entra al prompt de todos los escritos de un rol y una
 * rama. Una «fórmula» que traiga «dentro de los diez (10) días» o «conforme al
 * art. 318 del CGP» enseñaría al motor un plazo y una norma con la autoridad
 * de «así escribe esta firma», en escritos donde el plazo y la norma son
 * otros. Es el defecto característico de este producto —el reloj de otro— con
 * un disfraz nuevo, así que se corta aquí, con reglas legibles y no con una
 * instrucción al modelo.
 *
 * ─── SE DICE QUÉ SE DESCARTÓ ───────────────────────────────────────────────
 *
 * Nada se pierde en silencio: cada descarte vuelve con su motivo en una frase
 * («menciona un plazo») y el socio lo lee antes de guardar. Una guarda muda
 * enseña a desconfiar de la vista previa.
 *
 * Corre tres veces: sobre lo que devuelve el modelo, sobre lo que el navegador
 * manda a guardar y sobre el perfil al redactar (por si una fila vieja o
 * alterada a mano trae veneno).
 */

const reArticulo = new RegExp(`${CABEZA_DE_ARTICULO.source}\\d`, 'i');
const reNormaConAnio = new RegExp(NORMA_CON_ANIO.source, 'i');
const reNormaSinAnio = /\b(?:ley|decreto|resoluci[oó]n|acuerdo|circular)\s+(?:n[°oº.]*\s*)?\d+/i;
const reCodigo = /c[oó]digo\s+(?:general|civil|penal|sustantivo|de\s+comercio|de\s+procedimiento|nacional|de\s+la\s+infancia)|\bc\.?g\.?p\b|\bcpaca\b|\bcst\b|constituci[oó]n\s+pol[ií]tica|\bestatuto\b/i;
const reProvidencia = /\b(?:T|C|SU|A)-\d{2,4}\b|\b[SA]T?[LCP]\d{2,6}(?:-\d{4})?\b|\bsentencia\s+(?:de\s+)?(?:tutela|unificaci[oó]n|constitucionalidad|casaci[oó]n)\b|\bjurisprudencia\b|\bprecedente\b/;
const NUMEROS_EN_LETRA = 'un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|veinte|treinta|cuarenta|sesenta|noventa|cien|ciento';
const reNumeroDeTiempo = new RegExp(`\\b(?:\\d+|${NUMEROS_EN_LETRA})\\s*(?:\\(\\d+\\)\\s*)?(?:d[ií]as?|mes(?:es)?|a[nñ]os?|horas?|semanas?)\\b`, 'i');
const rePalabraDeTiempo = /\b(?:t[ée]rminos?|plazos?|caduc\w*|prescrip\w*|prescrib\w*|ejecutoria|vencimiento|h[aá]biles|calendario)\b/i;
const rePretension = /\bcondenar\b|\bcond[eé]nese\b|\bse\s+condene\b|\bdeclarar\s+que\b|\bse\s+declare\s+que\b|\bordenar\s+(?:el|al)\s+pago\b|\bse\s+ordene\s+(?:el\s+)?pago\b|\bpretendo\b/i;

const MOTIVO = {
  ARTICULO: 'menciona un artículo',
  NORMA: 'cita una norma',
  PROVIDENCIA: 'cita una providencia',
  PLAZO: 'menciona un plazo',
  PRETENSION: 'contiene una pretensión',
  CIFRA: 'trae una cifra que podría identificar el caso',
  PERSONA: 'parece nombrar a una persona o entidad',
  LARGO: 'es demasiado largo'
} as const;

/** ¿Hay 2+ palabras en mayúscula seguidas que no son de tratamiento ni de estructura? */
const nombraAlguien = (texto: string): boolean => {
  const sinMarcadores = texto.replace(/\[[^\]]*\]/g, ' . ');
  const fichas = sinMarcadores.split(/[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]+/).filter(Boolean);
  const CONECTORES = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e']);
  let ajenas = 0;
  let enRacha = false;
  for (const f of fichas) {
    if (/^[A-ZÁÉÍÓÚÑÜ]/.test(f)) {
      enRacha = true;
      /* Las iniciales («C.C.», «T.P.») no nombran a nadie por sí solas. */
      if (f.length >= 3 && !PALABRAS_EN_MAYUSCULA_PERMITIDAS.has(plegar(f))) ajenas += 1;
      if (ajenas >= 2) return true;
    } else if (enRacha && CONECTORES.has(f)) {
      continue;
    } else {
      enRacha = false;
      ajenas = 0;
    }
  }
  return false;
};

/**
 * Por qué una cadena no se puede guardar como estilo, o null si es solo forma.
 * El orden decide el motivo cuando una cadena cae en varias reglas: se nombra
 * la más grave para el escrito.
 */
export const motivoJuridico = (texto: string): string | null => {
  if (reArticulo.test(texto) || referenciasDelTexto(texto, 'CGP').length > 0) return MOTIVO.ARTICULO;
  if (reNormaConAnio.test(texto) || reNormaSinAnio.test(texto) || reCodigo.test(texto)) return MOTIVO.NORMA;
  if (reProvidencia.test(texto)) return MOTIVO.PROVIDENCIA;
  if (reNumeroDeTiempo.test(texto) || rePalabraDeTiempo.test(texto)) return MOTIVO.PLAZO;
  if (rePretension.test(texto)) return MOTIVO.PRETENSION;
  if (/\d(?:[\d.\-\s]?\d){5,}/.test(texto)) return MOTIVO.CIFRA;
  if (nombraAlguien(texto)) return MOTIVO.PERSONA;
  return null;
};

/** Filtra una lección ya normalizada: quita el ítem, conserva la lección, y dice por qué. */
export const filtrarContenido = (c: ContenidoDeLeccion): { contenido: ContenidoDeLeccion; descartados: ItemDescartado[] } => {
  const descartados: ItemDescartado[] = [];
  const pasa = (campo: string, texto: string): boolean => {
    const motivo = motivoJuridico(texto);
    if (motivo) descartados.push({ campo, texto, motivo });
    return motivo === null;
  };
  const lista = (campo: string, xs: string[]): string[] => xs.filter((x) => pasa(campo, x));

  const glosario: EntradaDeGlosario[] = [];
  for (const g of c.glosario) {
    if (!pasa('glosario', g.preferido)) continue;
    glosario.push({
      preferido: g.preferido,
      variantes: lista('glosario', g.variantes),
      ejemplo: g.ejemplo && pasa('glosario', g.ejemplo) ? g.ejemplo : ''
    });
  }

  return {
    contenido: {
      titulosDeSeccion: c.titulosDeSeccion.filter((t) => pasa('titulosDeSeccion', t.titulo)),
      numeracionHechos: c.numeracionHechos,
      ordenDeSecciones: lista('ordenDeSecciones', c.ordenDeSecciones),
      encabezado: c.encabezado && pasa('encabezado', c.encabezado) ? c.encabezado : '',
      formulasDeApertura: lista('formulasDeApertura', c.formulasDeApertura),
      formulasDeCierre: lista('formulasDeCierre', c.formulasDeCierre),
      bloqueDeFirma: lista('bloqueDeFirma', c.bloqueDeFirma),
      tratamiento: c.tratamiento && pasa('tratamiento', c.tratamiento.formula) ? c.tratamiento : null,
      glosario
    },
    descartados
  };
};

export const contenidoVacio = (): ContenidoDeLeccion => ({
  titulosDeSeccion: [],
  numeracionHechos: null,
  ordenDeSecciones: [],
  encabezado: '',
  formulasDeApertura: [],
  formulasDeCierre: [],
  bloqueDeFirma: [],
  tratamiento: null,
  glosario: []
});

/** ¿Queda algo que valga la pena guardar? */
export const contenidoEstaVacio = (c: ContenidoDeLeccion): boolean =>
  c.titulosDeSeccion.length === 0 &&
  c.numeracionHechos === null &&
  c.ordenDeSecciones.length === 0 &&
  !c.encabezado &&
  c.formulasDeApertura.length === 0 &&
  c.formulasDeCierre.length === 0 &&
  c.bloqueDeFirma.length === 0 &&
  c.tratamiento === null &&
  c.glosario.length === 0;

const TOPES = { titulos: 20, orden: 20, formulas: 8, bloque: 10, glosario: 30, variantes: 6 };

/**
 * Da forma a lo que llega de fuera —el modelo o el navegador— sin confiar en su
 * tipo. Solo sobreviven las claves del esquema: lo que el modelo añada por su
 * cuenta («texto del escrito», «hechos») se ignora, no se guarda.
 */
export const normalizarContenido = (raw: unknown): { contenido: ContenidoDeLeccion; descartados: ItemDescartado[] } => {
  const descartados: ItemDescartado[] = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { contenido: contenidoVacio(), descartados };
  const o = raw as Record<string, unknown>;

  const cadena = (campo: string, v: unknown): string | null => {
    if (typeof v !== 'string') return null;
    const limpia = v.replace(/\s+/g, ' ').trim();
    if (!limpia) return null;
    if (limpia.length > MAX_CARACTERES) {
      descartados.push({ campo, texto: `${limpia.slice(0, 80)}…`, motivo: MOTIVO.LARGO });
      return null;
    }
    return limpia;
  };
  const cadenas = (campo: string, v: unknown, tope: number): string[] =>
    Array.isArray(v)
      ? v
          .map((x) => cadena(campo, x))
          .filter((x): x is string => x !== null)
          .slice(0, tope)
      : [];
  const numeracion = (v: unknown): Numeracion => (NUMERACIONES.includes(v as Numeracion) ? (v as Numeracion) : 'NINGUNA');

  const titulosDeSeccion: TituloDeSeccion[] = Array.isArray(o.titulosDeSeccion)
    ? o.titulosDeSeccion
        .filter((t): t is Record<string, unknown> => Boolean(t) && typeof t === 'object' && !Array.isArray(t))
        .map((t) => ({ titulo: cadena('titulosDeSeccion', t.titulo), numeracion: numeracion(t.numeracion) }))
        .filter((t): t is TituloDeSeccion => t.titulo !== null)
        .slice(0, TOPES.titulos)
    : [];

  let tratamiento: ContenidoDeLeccion['tratamiento'] = null;
  if (o.tratamiento && typeof o.tratamiento === 'object' && !Array.isArray(o.tratamiento)) {
    const tr = o.tratamiento as Record<string, unknown>;
    const formula = cadena('tratamiento', tr.formula);
    if (formula) {
      tratamiento = { formula, persona: PERSONAS.includes(tr.persona as PersonaGramatical) ? (tr.persona as PersonaGramatical) : null };
    }
  }

  const glosario: EntradaDeGlosario[] = Array.isArray(o.glosario)
    ? o.glosario
        .filter((g): g is Record<string, unknown> => Boolean(g) && typeof g === 'object' && !Array.isArray(g))
        .map((g) => ({
          preferido: cadena('glosario', g.preferido),
          variantes: cadenas('glosario', g.variantes, TOPES.variantes),
          ejemplo: cadena('glosario', g.ejemplo) ?? ''
        }))
        .filter((g): g is EntradaDeGlosario => g.preferido !== null)
        .slice(0, TOPES.glosario)
    : [];

  return {
    contenido: {
      titulosDeSeccion,
      numeracionHechos: NUMERACIONES.includes(o.numeracionHechos as Numeracion) ? (o.numeracionHechos as Numeracion) : null,
      ordenDeSecciones: cadenas('ordenDeSecciones', o.ordenDeSecciones, TOPES.orden),
      encabezado: cadena('encabezado', o.encabezado) ?? '',
      formulasDeApertura: cadenas('formulasDeApertura', o.formulasDeApertura, TOPES.formulas),
      formulasDeCierre: cadenas('formulasDeCierre', o.formulasDeCierre, TOPES.formulas),
      bloqueDeFirma: cadenas('bloqueDeFirma', o.bloqueDeFirma, TOPES.bloque),
      tratamiento,
      glosario
    },
    descartados
  };
};
