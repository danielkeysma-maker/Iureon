import { httpClient } from '../../../config/httpClient';
import type {
  Actuacion,
  ActuacionRole,
  CatalogMeta,
  CurationStatus,
  FirmActuacion,
  LegalBranch,
  VerificationInput
} from '../types';

interface ResolveResponse {
  success: boolean;
  curation: CurationStatus;
  actuacion: Actuacion | null;
}

interface ListResponse {
  success: boolean;
  curation: CurationStatus;
  branches: LegalBranch[];
  meta: CatalogMeta[];
  actuaciones: Actuacion[];
}

interface SaveResponse {
  success: boolean;
  actuacion: Actuacion | null;
}

/**
 * Catalogue access.
 *
 * Reads and writes are treated differently on purpose. A failed lookup is a
 * normal state — the panel simply does not appear, and guessing an actuación
 * would be worse than showing none. A failed write is not: the lawyer must
 * learn that the verification was not recorded, so it throws.
 */
export const catalogApi = {
  async resolve(documentType: string, branch?: string): Promise<Actuacion | null> {
    if (!documentType.trim()) return null;

    const params = new URLSearchParams({ documentType });
    if (branch) params.set('branch', branch);

    try {
      const data = await httpClient.get<ResolveResponse>(
        `/api/catalog/actuaciones/resolve?${params.toString()}`,
        {}
      );

      return data.actuacion;
    } catch {
      return null;
    }
  },

  async list(
    
    filters: { branch?: LegalBranch; role?: ActuacionRole } = {}
  ): Promise<{
    actuaciones: Actuacion[];
    branches: LegalBranch[];
    meta: CatalogMeta[];
    curation: CurationStatus;
  }> {
    const params = new URLSearchParams();
    if (filters.branch) params.set('branch', filters.branch);
    if (filters.role) params.set('role', filters.role);

    const query = params.toString();
    const data = await httpClient.get<ListResponse>(
      `/api/catalog/actuaciones${query ? `?${query}` : ''}`,
      {}
    );

    return {
      actuaciones: data.actuaciones,
      branches: data.branches,
      meta: data.meta ?? [],
      curation: data.curation
    };
  },

  /** Records the firm's verification. Throws with the API's message on rejection. */
  async saveVerification(input: VerificationInput): Promise<Actuacion | null> {
    const data = await httpClient.put<SaveResponse>('/api/catalog/verifications', {
      body: input
    });

    return data.actuacion;
  },

  /**
   * Drops the firm's override so the shipped catalogue applies again.
   *
   * @param rama la rama en la que se había verificado. Sin ella se retira la
   * curaduría de la rama propia de la ficha: quitar la de familia no puede
   * tumbar la civil.
   */
  async deleteVerification(actuacionId: string, rama?: LegalBranch | null): Promise<void> {
    const params = new URLSearchParams({ actuacionId });
    if (rama) params.set('rama', rama);

    await httpClient.delete(`/api/catalog/verifications?${params.toString()}`, {});
  }
};

/**
 * Las actuaciones que la firma añadió a una rama porque el catálogo no la trae.
 *
 * LAS TRES LLAMADAS LANZAN AL FALLAR, incluida la lectura, y ahí se aparta de
 * `resolve`. Un fallo de resolución no se dice porque el panel simplemente no
 * aparece; aquí la pantalla existe para mostrar esta lista, y presentarla vacía
 * cuando no se pudo leer haría creer que la actuación añadida ayer se perdió.
 */
export const firmActuacionesApi = {
  listar: () =>
    httpClient.get<{
      success: boolean;
      estado: CurationStatus;
      actuaciones: FirmActuacion[];
      comoCatalogo: Actuacion[];
    }>('/api/catalog/firm-actuaciones', {}),

  crear: (input: { area: LegalBranch; exactName: string; role?: ActuacionRole; note?: string | null }) =>
    httpClient.post<{ success: boolean; actuacion: FirmActuacion; comoCatalogo: Actuacion }>(
      '/api/catalog/firm-actuaciones',
      { body: input }
    ),

  eliminar: (id: string) =>
    httpClient.delete<{ success: boolean; id: string }>(
      `/api/catalog/firm-actuaciones?id=${encodeURIComponent(id)}`,
      {}
    )
};

/**
 * Orientacion desde unos hechos hacia las actuaciones que podrian aplicar.
 *
 * `descartadas` son los nombres que el modelo propuso y el catalogo no
 * reconocio. Se devuelven a proposito: si el motor empieza a inventar, esa
 * lista lo dice antes de que nadie lo note por otra via.
 */
export interface TriageSuggestion {
  actuacion: Actuacion;
  razon: string;
}

export interface TriageResponse {
  status: 'OK' | 'SIN_COINCIDENCIA' | 'NO_PROVIDER' | 'FAILED';
  reason?: string;
  suggestions: TriageSuggestion[];
  descartadas: string[];
  /** Lo que el catálogo leyó: rama dominante y elementos fácticos. Lectura del modelo. */
  senales?: { rama: string | null; elementos: string[] };
  /** Solo sin coincidencia: los datos que faltan y definirían la vía. */
  preguntas?: string[];
  /** Orientaciones gratuitas que le quedan hoy a la firma. */
  cupoRestante?: number;
  /** Lo que costó ESTA consulta. 0 mientras haya cupo gratuito. */
  cobradoCop?: number;
  /**
   * Lo que costará la siguiente pasada el cupo. Viene del servidor y NO se
   * escribe a mano en la pantalla: cuando el precio subió de $50 a $150, el
   * texto fijo habría seguido prometiendo $50 sin que nada se pusiera rojo.
   */
  precioOrientacionCop?: number;
}

export interface OrientacionGuardada {
  id: string;
  hechos: string;
  status: 'OK' | 'SIN_COINCIDENCIA';
  senales: { rama: string | null; elementos: string[] } | null;
  sugerencias: Array<{ id: string; nombre: string }>;
  userEmail: string;
  createdAt: string;
}

export const triageApi = {
  /**
   * @param branch cuando el abogado ya eligió la rama en Redacción: acota el
   *        menú del catálogo a esa rama y descarta lo que caiga fuera. Desde
   *        Orientación no se manda, porque cuál es la rama es justamente lo
   *        que se está preguntando.
   */
  orientar: (hechos: string, branch?: LegalBranch) =>
    httpClient.post<TriageResponse>('/api/catalog/triage', {
      body: branch ? { hechos, branch } : { hechos }
    }),

  /** El historial de la firma con sus huecos agrupados. */
  historial: () =>
    httpClient.get<{
      success: boolean;
      historial: OrientacionGuardada[];
      huecos: Array<{ hechos: string; veces: number }>;
    }>('/api/catalog/orientaciones')
};
