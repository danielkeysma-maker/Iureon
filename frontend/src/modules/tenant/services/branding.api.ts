import { httpClient } from '../../../config/httpClient';

/**
 * La marca de la firma, con la forma del servidor. El servidor sanea en las
 * dos direcciones; este cliente no valida — muestra lo que quedó guardado.
 */
export interface FirmBranding {
  firmName: string;
  firmNit: string;
  firmAddress: string;
  firmPhone: string;
  firmEmail: string;
  fontFamily: 'Times New Roman' | 'Arial' | 'Calibri' | 'Inter';
  fontSizePt: number;
  lineSpacing: '1.0' | '1.5' | '2.0';
  factNumbering: 'ARABIGA' | 'ORDINAL';
  sectionTitles: 'ROMANOS' | 'ARABIGOS' | 'SIN_NUMERAR';
  tpNumber: string;
  logoUrl: string | null;
  signatureImageUrl: string | null;
}

export const brandingApi = {
  /** La marca guardada, y si la firma la configuró alguna vez. */
  async get(): Promise<{ branding: FirmBranding; configurada: boolean }> {
    const r = await httpClient.get<{ success: boolean; branding: FirmBranding; configurada: boolean }>(
      '/api/firm/branding'
    );
    if (!r.success) throw new Error('No se pudo leer la marca de la firma.');
    return { branding: r.branding, configurada: r.configurada };
  },

  /** Guarda y devuelve lo que el servidor dejó — que es lo saneado, no lo enviado. */
  async put(branding: FirmBranding): Promise<FirmBranding> {
    const r = await httpClient.put<{ success: boolean; branding?: FirmBranding; message?: string }>(
      '/api/firm/branding',
      { body: branding }
    );
    if (!r.success || !r.branding) throw new Error(r.message ?? 'No se pudo guardar la marca.');
    return r.branding;
  }
};

/**
 * Las elecciones de formato, como instrucción para el motor que escribe.
 *
 * Es el espejo del `comoInstruccion` del servidor: la numeración y los títulos
 * no se imponen al exportar (el texto ya está escrito) — se imponen al
 * GENERAR, y este texto viaja en `customFormatInstruction` hasta el prompt.
 */
export const formatoComoInstruccion = (m: FirmBranding): string => {
  const partes: string[] = [];

  partes.push(
    m.factNumbering === 'ORDINAL'
      ? 'Numera los hechos con ordinales en mayúscula: PRIMERO., SEGUNDO., TERCERO.'
      : 'Numera los hechos con arábigos: 1., 2., 3.'
  );

  partes.push(
    m.sectionTitles === 'ROMANOS'
      ? 'Titula las secciones con números romanos: I. PRETENSIONES, II. HECHOS.'
      : m.sectionTitles === 'ARABIGOS'
      ? 'Titula las secciones con números arábigos: 1. PRETENSIONES, 2. HECHOS.'
      : 'Las secciones llevan título sin numerar.'
  );

  if (m.tpNumber) {
    partes.push(`En el bloque de firma incluye la tarjeta profesional: T.P. ${m.tpNumber}.`);
  }
  if (m.firmEmail) {
    partes.push(`Cierra con el correo de notificaciones judiciales: ${m.firmEmail}.`);
  }

  return partes.join(' ');
};
