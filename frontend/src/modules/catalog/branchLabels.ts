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
  // Not catalogued: kept so its legacy document types remain reachable.
  'PEQUEÑAS_CAUSAS': 'Pequeñas Causas (Mínima Cuantía)'
};

/** Falls back to the raw key so a new branch is never invisible. */
export const branchLabel = (branch: LegalBranch | string): string =>
  BRANCH_LABELS[branch] ?? branch;
