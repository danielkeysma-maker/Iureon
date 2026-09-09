import type { Actuacion, ActuacionRole, FirmActuacion, FirmActuacionInput, LegalBranch } from './types';

/**
 * Reglas de una actuación propia de la firma, sin base de datos ni red.
 *
 * Vive aparte del servicio a propósito: son las decisiones que hay que poder
 * comprobar de una corrida, y las que más caro cuestan si se equivocan — un
 * nombre que pisa el de una actuación publicada haría que el motor resolviera
 * la ficha equivocada, que es el defecto que este módulo ya pagó una vez.
 */

/** Ni una etiqueta de tres letras ni un párrafo. */
export const MIN_NOMBRE = 4;
export const MAX_NOMBRE = 120;
export const MAX_NOTA = 400;

const ROLES: ActuacionRole[] = ['LITIGANTE', 'DESPACHO', 'SECRETARIA'];

/**
 * La forma canónica de un nombre para compararlo.
 *
 * Es la misma normalización del emparejador del catálogo: minúsculas, sin
 * tildes y sin puntuación. Sin ella, «Demanda de Oposición» y «demanda de
 * oposicion» serían dos opciones distintas en el mismo desplegable, y ninguna
 * de las dos sería distinguible al elegir.
 */
export const normalizarNombre = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * El identificador: rama en minúsculas + nombre en guiones.
 *
 * Misma forma que los del catálogo publicado —«civil/demanda-de-oposicion»—
 * para que un identificador se lea igual venga de donde venga. Que puedan
 * chocar es precisamente lo que comprueba `validarActuacionPropia`: dos fichas
 * distintas bajo un mismo identificador harían que la curaduría de una
 * corrigiera a la otra.
 */
export const slugDeActuacion = (area: string, exactName: string): string => {
  const nombre = normalizarNombre(exactName).replace(/\s+/g, '-');
  return `${area.toLowerCase().replace(/_/g, '-')}/${nombre}`;
};

export type ValidacionActuacionPropia =
  | { ok: true; value: Omit<FirmActuacion, 'createdAt'> }
  | { ok: false; error: { code: string; message: string; status: number } };

/**
 * @param ramasConocidas las ramas del catálogo. Una rama inventada dejaría la
 *        actuación fuera de toda lista: existiría en la base y en ningún sitio.
 * @param publicadas las actuaciones de fábrica de esa rama, para no dejar que
 *        una propia tape a una verificada.
 * @param propias las que la firma ya tiene en esa rama.
 */
export const validarActuacionPropia = (
  input: FirmActuacionInput,
  ramasConocidas: readonly string[],
  publicadas: readonly Actuacion[],
  propias: readonly FirmActuacion[]
): ValidacionActuacionPropia => {
  const area = String(input.area ?? '').trim().toUpperCase();
  const exactName = String(input.exactName ?? '').trim().replace(/\s+/g, ' ');
  const nota = input.note == null ? null : String(input.note).trim();

  if (!ramasConocidas.includes(area)) {
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_BRANCH',
        message: `La rama "${input.area}" no existe en el catálogo, así que la actuación no aparecería en ninguna lista.`,
        status: 400
      }
    };
  }

  if (exactName.length < MIN_NOMBRE || exactName.length > MAX_NOMBRE) {
    return {
      ok: false,
      error: {
        code: 'INVALID_NAME',
        message: `El nombre de la actuación debe tener entre ${MIN_NOMBRE} y ${MAX_NOMBRE} caracteres.`,
        status: 400
      }
    };
  }

  if (nota && nota.length > MAX_NOTA) {
    return {
      ok: false,
      error: {
        code: 'NOTE_TOO_LONG',
        message: `La nota no puede pasar de ${MAX_NOTA} caracteres.`,
        status: 400
      }
    };
  }

  const rol = String(input.role ?? 'LITIGANTE').trim().toUpperCase() as ActuacionRole;
  if (!ROLES.includes(rol)) {
    return {
      ok: false,
      error: { code: 'INVALID_ROLE', message: 'El rol debe ser LITIGANTE, DESPACHO o SECRETARIA.', status: 400 }
    };
  }

  const canonico = normalizarNombre(exactName);
  const id = slugDeActuacion(area, exactName);

  /*
   * NO SE DEJA TAPAR UNA ACTUACIÓN PUBLICADA, y se dice cuál es.
   *
   * Una propia con el nombre de una verificada crearía dos entradas idénticas
   * en el desplegable, una con su artículo y su término comprobados y otra sin
   * nada — y quien elija la segunda redactará sin la norma que sí existe. Se
   * rechaza señalando la que ya está, que es lo que el abogado buscaba.
   */
  const publicada = publicadas.find(
    (a) => normalizarNombre(a.exactName) === canonico || a.id === id
  );

  if (publicada) {
    return {
      ok: false,
      error: {
        code: 'SHADOWS_CATALOGUE',
        message:
          `El catálogo ya trae «${publicada.exactName}» en esta rama, con su artículo y su término. ` +
          'Elíjala en la lista en vez de crear una propia: la suya no tendría norma verificada detrás.',
        status: 409
      }
    };
  }

  const repetida = propias.find(
    (a) => a.area === area && (normalizarNombre(a.exactName) === canonico || a.id === id)
  );

  if (repetida) {
    return {
      ok: false,
      error: {
        code: 'DUPLICATE_NAME',
        message: `Su firma ya añadió «${repetida.exactName}» en esta rama.`,
        status: 409
      }
    };
  }

  return {
    ok: true,
    value: {
      id,
      area: area as LegalBranch,
      exactName,
      role: rol,
      /* Nace sin comprobar, que es la verdad: se escribió un nombre. */
      termStatus: 'NO_VERIFICADO',
      legalBasis: null,
      termDescription: null,
      sourceUrl: null,
      note: nota || null,
      createdBy: input.createdBy
    }
  };
};

/**
 * Lo que el catálogo publica cuando la actuación la escribió la firma.
 *
 * SIN NORMA VERIFICADA MIENTRAS NO HAYA TÉRMINO **Y** FUENTE. El término solo
 * asciende a VERIFICADO acompañado del sitio donde se leyó; con el término
 * solo, la ficha diría «verificado» sobre algo que nadie puede contrastar, que
 * es exactamente la falsa verificación que este catálogo ya sufrió en 76
 * fichas.
 *
 * `requiredSections` queda vacío a propósito y no se rellena con una plantilla
 * genérica: una sección exigida sin artículo detrás es un requisito inventado,
 * y el escrito lo cumpliría creyendo que la norma lo pide.
 */
export const AVISO_SIN_NORMA =
  'Actuación añadida por la firma. Ninguna norma verificada la respalda: el artículo, el término y las secciones no están comprobados en el catálogo.';

export const actuacionPropiaComoCatalogo = (propia: FirmActuacion): Actuacion => {
  /*
   * «Curada» es que la firma haya movido el estado del término, no que haya
   * escrito texto. NO_CADUCA es una respuesta comprobada —la norma no fija
   * plazo— y tiene que poder distinguirse de VERIFICADO; colapsar las dos en
   * «tiene texto» publicaría como plazo lo que es una ausencia de plazo.
   */
  const curada = propia.termStatus !== 'NO_VERIFICADO';

  return {
    id: propia.id,
    exactName: propia.exactName,
    branch: propia.area,
    role: propia.role,
    legalBasis: propia.legalBasis?.trim() || AVISO_SIN_NORMA,
    competentAuthority: null,
    term: curada
      ? { status: propia.termStatus, description: propia.termDescription }
      : { status: 'NO_VERIFICADO', description: null },
    requiredSections: [],
    sourceUrl: propia.sourceUrl,
    firmDefined: true,
    ...(curada
      ? {
          verification: {
            verifiedBy: propia.createdBy,
            verifiedAt: propia.createdAt,
            note: propia.note,
            /* Lo que había antes de que la firma la comprobara: nada. */
            replaced: { status: 'NO_VERIFICADO' as const, description: null }
          }
        }
      : {})
  };
};
