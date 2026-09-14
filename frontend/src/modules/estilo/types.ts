/**
 * Tipos del estilo de la firma, con la forma del servidor
 * (`backend/src/modules/estilo/types.ts`). Este cliente no valida el contenido:
 * el servidor lo sanea y lo filtra al leerlo, al guardarlo y al redactar.
 */

export type RolDelEstilo = 'LITIGANTE' | 'DESPACHO' | 'SECRETARIA';
export type Numeracion = 'ROMANOS' | 'ARABIGOS' | 'ORDINALES' | 'NINGUNA';
export type PersonaGramatical = 'PRIMERA_SINGULAR' | 'PRIMERA_PLURAL' | 'TERCERA';
export type FuenteDeLeccion = 'BORRADOR' | 'ESCRITO_SUBIDO' | 'EDICION';

export interface ContenidoDeLeccion {
  titulosDeSeccion: Array<{ titulo: string; numeracion: Numeracion }>;
  numeracionHechos: Numeracion | null;
  ordenDeSecciones: string[];
  encabezado: string;
  formulasDeApertura: string[];
  formulasDeCierre: string[];
  bloqueDeFirma: string[];
  tratamiento: { formula: string; persona: PersonaGramatical | null } | null;
  glosario: Array<{ preferido: string; variantes: string[]; ejemplo: string }>;
}

export interface ItemDescartado {
  campo: string;
  texto: string;
  motivo: string;
}

export interface LecturaDelFormato {
  rol: RolDelEstilo;
  rama: string | null;
  contenido: ContenidoDeLeccion;
  descartados: ItemDescartado[];
  cobrado: number;
  saldo: number;
}

export interface MetaDeLeccion {
  id: string;
  rol: RolDelEstilo;
  rama: string | null;
  fuente: FuenteDeLeccion;
  taughtBy: string;
  createdAt: string;
}

/** Una fórmula o un término con cuántos escritos de la firma lo usan. */
export interface Clasificado {
  texto: string;
  vistoEn: number;
}

/** El perfil que resulta de sumar las lecciones de un alcance (`consolidarEstilo` del servidor). */
export interface EstiloConsolidado {
  lecciones: number;
  actualizado: string | null;
  titulosDeSeccion: Array<{ titulo: string; numeracion: Numeracion }>;
  numeracionHechos: Numeracion | null;
  ordenDeSecciones: string[];
  encabezado: Clasificado | null;
  formulasDeApertura: Clasificado[];
  formulasDeCierre: Clasificado[];
  bloqueDeFirma: string[];
  tratamiento: { formula: string; persona: PersonaGramatical | null } | null;
  glosario: Array<{ preferido: string; variantes: string[]; ejemplo: string; vistoEn: number }>;
}

export interface PerfilDeEstilo {
  rol: RolDelEstilo;
  ramaPedida: string | null;
  /** La rama cuyo estilo se aplicaría; null = el general del rol. */
  rama: string | null;
  perfil: EstiloConsolidado;
  lecciones: MetaDeLeccion[];
  puedeEnsenar: boolean;
}

/** Lo que el borrador dice sobre el estilo con que se redactó. */
export interface EstiloAplicado {
  rol: RolDelEstilo;
  rama: string | null;
  lecciones: number;
  actualizado: string | null;
}
