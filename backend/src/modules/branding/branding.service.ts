import { supabase } from '../../config/supabase.config';

/**
 * La marca y el formato de la firma. DE LA FIRMA, no del usuario: un escrito
 * exportado por cualquiera de sus abogados sale con el mismo membrete.
 *
 * Vive en `firms.branding` (JSONB). El servicio SANEA en las dos direcciones:
 * lo que llega del cliente se recorta a lo que el tipo conoce, y lo que sale
 * de la base pasa por el mismo filtro — una fila escrita por una versión vieja
 * no puede romper la pantalla nueva.
 */

export interface FirmBranding {
  firmName: string;
  firmNit: string;
  /** El pie de página del escrito: dirección · ciudad · teléfono. */
  firmAddress: string;
  firmPhone: string;
  /** Correo de notificaciones judiciales. Va en el bloque de firma. */
  firmEmail: string;
  fontFamily: 'Times New Roman' | 'Arial' | 'Calibri' | 'Inter';
  fontSizePt: number;
  lineSpacing: '1.0' | '1.5' | '2.0';
  /** «1. 2. 3.» o «PRIMERO. SEGUNDO.» — lo que un despacho discute de verdad. */
  factNumbering: 'ARABIGA' | 'ORDINAL';
  sectionTitles: 'ROMANOS' | 'ARABIGOS' | 'SIN_NUMERAR';
  /** Tarjeta profesional del abogado que firma, si la firma quiere incluirla. */
  tpNumber: string;
  /** Data URI. Tope de tamaño abajo: un logo de 5 MB no es un logo. */
  logoUrl: string | null;
  signatureImageUrl: string | null;
}

export const MARCA_POR_DEFECTO: FirmBranding = {
  firmName: '',
  firmNit: '',
  firmAddress: '',
  firmPhone: '',
  firmEmail: '',
  fontFamily: 'Times New Roman',
  fontSizePt: 12,
  lineSpacing: '1.5',
  factNumbering: 'ARABIGA',
  sectionTitles: 'ROMANOS',
  tpNumber: '',
  logoUrl: null,
  signatureImageUrl: null
};

/*
 * 300 KB por imagen. La columna es JSONB y viaja en cada lectura de la firma:
 * un logo de 5 MB convertiría cada carga de marca en una descarga de 5 MB.
 * 300 KB alcanza para cualquier logo razonable en PNG.
 */
const MAX_IMAGEN_BYTES = 300 * 1024;

const texto = (v: unknown, tope = 200): string =>
  typeof v === 'string' ? v.slice(0, tope).trim() : '';

const imagen = (v: unknown): string | null => {
  if (typeof v !== 'string' || !v.startsWith('data:image/')) return null;
  // El data URI en base64 pesa ~4/3 del binario; se compara contra el string.
  if (v.length > MAX_IMAGEN_BYTES * 1.4) return null;
  return v;
};

const uno = <T extends string>(v: unknown, opciones: readonly T[], defecto: T): T =>
  opciones.includes(v as T) ? (v as T) : defecto;

/** Nunca lanza: una marca ilegible se convierte en la marca por defecto, campo a campo. */
export const sanear = (crudo: unknown): FirmBranding => {
  const b = (typeof crudo === 'object' && crudo !== null ? crudo : {}) as Record<string, unknown>;

  return {
    firmName: texto(b.firmName),
    firmNit: texto(b.firmNit, 40),
    firmAddress: texto(b.firmAddress, 300),
    firmPhone: texto(b.firmPhone, 60),
    firmEmail: texto(b.firmEmail, 120),
    fontFamily: uno(b.fontFamily, ['Times New Roman', 'Arial', 'Calibri', 'Inter'] as const, 'Times New Roman'),
    fontSizePt:
      typeof b.fontSizePt === 'number' && b.fontSizePt >= 10 && b.fontSizePt <= 14
        ? Math.round(b.fontSizePt)
        : 12,
    lineSpacing: uno(b.lineSpacing, ['1.0', '1.5', '2.0'] as const, '1.5'),
    factNumbering: uno(b.factNumbering, ['ARABIGA', 'ORDINAL'] as const, 'ARABIGA'),
    sectionTitles: uno(b.sectionTitles, ['ROMANOS', 'ARABIGOS', 'SIN_NUMERAR'] as const, 'ROMANOS'),
    tpNumber: texto(b.tpNumber, 60),
    logoUrl: imagen(b.logoUrl),
    signatureImageUrl: imagen(b.signatureImageUrl)
  };
};

/** La marca de la firma, o null si nunca la ha configurado. */
export const leerMarca = async (firmId: string): Promise<FirmBranding | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('firms')
    .select('branding')
    .eq('firm_id', firmId)
    .maybeSingle();

  if (error || !data?.branding) return null;
  return sanear(data.branding);
};

/** Guarda la marca saneada. Devuelve lo guardado, o null si no se pudo. */
export const guardarMarca = async (firmId: string, crudo: unknown): Promise<FirmBranding | null> => {
  if (!supabase) return null;

  const marca = sanear(crudo);
  const { error } = await supabase
    .from('firms')
    .update({ branding: marca, updated_at: new Date().toISOString() })
    .eq('firm_id', firmId);

  if (error) {
    console.error('[MARCA] No se pudo guardar:', error.message);
    return null;
  }
  return marca;
};

/**
 * Las elecciones de formato, como instrucción para el motor de redacción.
 *
 * La numeración de hechos y los títulos de sección no se pueden imponer al
 * EXPORTAR — el texto ya está escrito. Se imponen al GENERAR, y este es el
 * texto que viaja en `customFormat` hasta el prompt del modelo que escribe.
 */
export const comoInstruccion = (m: FirmBranding): string => {
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
