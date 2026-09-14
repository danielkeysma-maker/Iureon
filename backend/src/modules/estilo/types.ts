/**
 * Tipos del estilo de la firma.
 *
 * ─── QUÉ ES UNA LECCIÓN, Y QUÉ NO ──────────────────────────────────────────
 *
 * Una lección es la FORMA de un escrito que el socio administrador aprobó:
 * cómo titula, en qué orden pone las secciones, con qué fórmulas abre y
 * cierra, cómo trata al despacho y qué palabras prefiere. Nunca el texto del
 * escrito, nunca un dato del caso y nunca una afirmación jurídica. Por eso
 * `contenido` es estructurado y cada cadena tiene tope: un campo libre y largo
 * es el sitio por donde se cuela un párrafo con hechos.
 */

export type RolDelEstilo = 'LITIGANTE' | 'DESPACHO' | 'SECRETARIA';
export const ROLES_DEL_ESTILO: readonly RolDelEstilo[] = ['LITIGANTE', 'DESPACHO', 'SECRETARIA'];

export type FuenteDeLeccion = 'BORRADOR' | 'ESCRITO_SUBIDO' | 'EDICION';
export const FUENTES_DE_LECCION: readonly FuenteDeLeccion[] = ['BORRADOR', 'ESCRITO_SUBIDO', 'EDICION'];

export type Numeracion = 'ROMANOS' | 'ARABIGOS' | 'ORDINALES' | 'NINGUNA';
export const NUMERACIONES: readonly Numeracion[] = ['ROMANOS', 'ARABIGOS', 'ORDINALES', 'NINGUNA'];

export type PersonaGramatical = 'PRIMERA_SINGULAR' | 'PRIMERA_PLURAL' | 'TERCERA';
export const PERSONAS: readonly PersonaGramatical[] = ['PRIMERA_SINGULAR', 'PRIMERA_PLURAL', 'TERCERA'];

/** Tope de cada cadena guardada. Un párrafo con hechos no cabe en 300 caracteres de fórmula. */
export const MAX_CARACTERES = 300;

export interface TituloDeSeccion {
  /** El título literal, sin datos del caso: «HECHOS», «FUNDAMENTOS DE DERECHO». */
  titulo: string;
  numeracion: Numeracion;
}

export interface EntradaDeGlosario {
  preferido: string;
  variantes: string[];
  /** Una frase de ejemplo, ya anonimizada. Vacía si no quedó ninguna limpia. */
  ejemplo: string;
}

export interface Tratamiento {
  /** «usted», «su señoría», «el Despacho». */
  formula: string;
  persona: PersonaGramatical | null;
}

export interface ContenidoDeLeccion {
  titulosDeSeccion: TituloDeSeccion[];
  numeracionHechos: Numeracion | null;
  ordenDeSecciones: string[];
  /** Fórmula con que se dirige al despacho, con marcadores: «Señor [DESPACHO]». */
  encabezado: string;
  formulasDeApertura: string[];
  formulasDeCierre: string[];
  /** Renglones del bloque de firma, solo con marcadores: «[NOMBRE DEL APODERADO]». */
  bloqueDeFirma: string[];
  tratamiento: Tratamiento | null;
  glosario: EntradaDeGlosario[];
}

/** Lo que la guarda jurídica o el saneamiento se negaron a guardar, y por qué. */
export interface ItemDescartado {
  campo: string;
  texto: string;
  motivo: string;
}

/** Una fila de `estilo_lecciones`, tal como la lee el servidor. */
export interface LeccionGuardada {
  id: string;
  rol: RolDelEstilo;
  rama: string | null;
  fuente: FuenteDeLeccion;
  contenido: ContenidoDeLeccion;
  taughtBy: string;
  createdAt: string;
}

/** Una fórmula o un término con cuántos escritos lo usan. */
export interface Clasificado {
  texto: string;
  vistoEn: number;
}

export interface EntradaDeGlosarioConsolidada extends EntradaDeGlosario {
  vistoEn: number;
}

/** El perfil que resulta de sumar las lecciones de un alcance. */
export interface EstiloConsolidado {
  lecciones: number;
  actualizado: string | null;
  titulosDeSeccion: TituloDeSeccion[];
  numeracionHechos: Numeracion | null;
  ordenDeSecciones: string[];
  encabezado: Clasificado | null;
  formulasDeApertura: Clasificado[];
  formulasDeCierre: Clasificado[];
  bloqueDeFirma: string[];
  tratamiento: Tratamiento | null;
  glosario: EntradaDeGlosarioConsolidada[];
}

/** Lo que el borrador dice sobre el estilo con que se redactó. */
export interface EstiloAplicado {
  rol: RolDelEstilo;
  /** null = se usó el estilo general del rol. */
  rama: string | null;
  lecciones: number;
  actualizado: string | null;
}

export class ErrorDeEstilo extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    /** Lo que se descartó, cuando el rechazo es porque no quedó nada que guardar. */
    public readonly descartados?: ItemDescartado[]
  ) {
    super(message);
  }
}
