import type { LegalBranch } from './types';

/**
 * Display names for the branches, keyed by the value the API uses.
 *
 * The selector is built from the branches the catalogue actually reports, not
 * from a hand-written list: that list had drifted to ten entries while the
 * catalogue had thirteen, so four whole branches — tránsito, notarial,
 * contratación and superintendencias — were unreachable from the workspace.
 * Only the label lives here; membership comes from the API.
 */
export const BRANCH_LABELS: Record<string, string> = {
  CONSTITUCIONAL: 'Constitucional & Tutelas',
  ADMINISTRATIVO: 'Contencioso Administrativo (CPACA)',
  CIVIL: 'Civil & Comercial (CGP)',
  LABORAL: 'Laboral & Seguridad Social',
  FAMILIA: 'Familia & Sucesiones',
  PENAL: 'Penal & Acusatorio (Ley 906)',
  SOCIETARIO: 'Societario & Insolvencia',
  TRIBUTARIO: 'Tributario & DIAN',
  TRANSITO: 'Tránsito & Movilidad',
  NOTARIAL: 'Notariado & Registro',
  CONTRATACION: 'Contratación Estatal',
  SUPERINTENDENCIAS: 'Superintendencias (SIC, Salud, Financiera, SSPD)',
  INTERNACIONAL: 'Derecho Internacional & Andino',
  // Named for the procedure that exists, not the jurisdiction that does not:
  // the Procedimiento Unico of Decreto Ley 902 de 2017, before the ANT.
  AGRARIO: 'Agrario & Ordenamiento Rural (ANT)',
  ADUANERO: 'Aduanero & Comercio Exterior (DIAN)',
  PROPIEDAD_INTELECTUAL: 'Propiedad Intelectual (SIC & DNDA)',
  POLICIVO: 'Policivo & Convivencia (Ley 1801)',
  DISCIPLINARIO: 'Disciplinario (Servidores & Abogados)',
  ARBITRAJE: 'Arbitraje Nacional (Ley 1563)',
  INSOLVENCIA: 'Insolvencia de Persona Natural',
  AMBIENTAL: 'Ambiental & Sancionatorio (ANLA & CAR)',
  // Comisarias y defensorias de familia: administrativo, no policivo ni
  // judicial. El comisario no figura entre las autoridades de policia del
  // art. 198 de la Ley 1801, y el juez de familia entra despues.
  FAMILIA_ADMINISTRATIVA: 'Comisarías & Defensorías de Familia'
  /*
   * Aqui vivia 'PEQUEÑAS_CAUSAS', conservada —decia su comentario— «para que
   * sus tipos de documento heredados sigan alcanzables». Esos tipos heredados
   * ya no existen: el archivo que los contenia se borro y nada los importa. La
   * etiqueta no la puede pintar nadie, porque el selector se construye desde
   * las ramas que devuelve la API y esta no es una de ellas. Una entrada que
   * ningun camino alcanza no es compatibilidad: es una rama inventada
   * esperando a que alguien la crea real.
   */
};

/** Falls back to the raw key so a new branch is never invisible. */
export const branchLabel = (branch: LegalBranch | string): string =>
  BRANCH_LABELS[branch] ?? branch;
