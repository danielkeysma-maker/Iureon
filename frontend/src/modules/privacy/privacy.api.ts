import { httpClient } from '../../config/httpClient';

/**
 * The firm's register of subencargados.
 *
 * Never composed here. The whole point is that the list comes from the
 * configuration the server is actually running: a copy maintained in the
 * frontend would drift the first time a provider is swapped, and a list naming
 * a provider no longer in use reads as diligence while describing a system that
 * does not exist.
 */

export type DataClass =
  | 'IDENTIFICACION'
  | 'CONTENIDO_DEL_CASO'
  | 'AUDIO_DE_AUDIENCIA'
  | 'TRANSCRITO'
  | 'DATOS_DE_PAGO'
  | 'METADATOS_DE_USO';

export interface Subprocessor {
  nombre: string;
  proposito: string;
  datos: DataClass[];
  ubicacion: string;
  retiene: boolean;
  retencion: string;
  /** Whose contract they sit under, when they are not ours directly. */
  atravesDe: string | null;
  sitio: string;
}

export interface Disclosure {
  marcoLegal: string;
  posicionDeLaFirma: string;
  posicionDeIureon: string;
  posicionDeEstosTerceros: string;
  loQueNoHacemos: string[];
  advertencia: string;
}

export const privacyApi = {
  subprocessors: () =>
    httpClient.get<{ disclosure: Disclosure; subprocessors: Subprocessor[] }>(
      '/api/privacy/subprocessors'
    )
};
