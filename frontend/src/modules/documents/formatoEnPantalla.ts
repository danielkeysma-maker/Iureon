/**
 * El formato del escrito, en pantalla igual que en el papel.
 *
 * ─── EL DEFECTO ─────────────────────────────────────────────────────────────
 *
 * La firma elige tipografía, tamaño e interlineado en Membrete · Formato del
 * escrito (artboard 3d), y el Word y el PDF salen con eso. Pero el lienzo de
 * la pantalla pintaba siempre Source Serif a 14,5 px con interlineado 1,8:
 * el abogado cambiaba a Times New Roman 12 pt, no veía nada distinto y
 * concluía —con razón— que la app no dejaba cambiar la letra. Un ajuste que
 * solo se nota al exportar es un ajuste escondido.
 *
 * ─── QUÉ HACE ───────────────────────────────────────────────────────────────
 *
 * Traduce la configuración de la firma a estilos CSS para el lienzo: la misma
 * familia que llevará el documento (con sustitutos honestos donde el
 * navegador no la tenga), el tamaño en píxeles equivalentes a los puntos, y
 * el interlineado elegido. Puro: sin React, sin DOM.
 */

export type FuenteDelEscrito =
  | 'Times New Roman'
  | 'Arial'
  | 'Calibri'
  | 'Tahoma'
  | 'Inter'
  | 'Plus Jakarta Sans'
  | 'Manrope'
  | 'Public Sans'
  | 'Satoshi';
export type Interlineado = '1.0' | '1.5' | '2.0';

export interface FormatoDelEscrito {
  fontFamily?: FuenteDelEscrito | string;
  fontSizePt?: number;
  lineSpacing?: Interlineado | string;
}

/**
 * Familias con sus sustitutos. Calibri no existe fuera de Windows/Office:
 * Carlito es su equivalente métrico libre. Inter no se carga en la app; cae a
 * la del sistema, que es lo que el Word hará también (allí se exporta como
 * Calibri, ver documentExport.service).
 */
const FAMILIAS: Record<FuenteDelEscrito, string> = {
  'Times New Roman': "'Times New Roman', Times, 'Liberation Serif', serif",
  Arial: "Arial, Helvetica, 'Liberation Sans', sans-serif",
  Calibri: "Calibri, Carlito, 'Segoe UI', sans-serif",
  Inter: "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
  Tahoma: 'Tahoma, Verdana, Geneva, sans-serif',
  // Las cuatro libres ya se cargan para la interfaz (index.html), asi que en
  // pantalla se ven de verdad; en el PDF van incrustadas (pdfFonts.ts).
  'Plus Jakarta Sans': "'Plus Jakarta Sans', system-ui, sans-serif",
  Manrope: 'Manrope, system-ui, sans-serif',
  'Public Sans': "'Public Sans', system-ui, sans-serif",
  Satoshi: 'Satoshi, system-ui, sans-serif'
};

/** 1 pt = 4/3 px a 96 ppp: 12 pt son 16 px, como en el papel. */
export const puntosAPixeles = (pt: number): number => Math.round((pt * 4) / 3 * 10) / 10;

/**
 * Interlineado de pantalla. El «1,0» del procesador de texto no es 1.0 de
 * CSS: Word aplica ~1,15-1,2 veces el cuerpo como «sencillo». Se traduce a lo
 * que se ve igual en pantalla; el papel lo pone el exportador con su propia
 * tabla.
 */
const INTERLINEADOS: Record<Interlineado, number> = { '1.0': 1.35, '1.5': 1.75, '2.0': 2.2 };

export interface EstiloDelLienzo {
  fontFamily: string;
  fontSize: string;
  lineHeight: number;
}

export const estiloDelLienzo = (formato: FormatoDelEscrito | null | undefined): EstiloDelLienzo | null => {
  if (!formato) return null;
  const familia = FAMILIAS[formato.fontFamily as FuenteDelEscrito];
  if (!familia) return null; // una familia que no conocemos no se inventa: el lienzo se queda con su serif
  const pt = Number(formato.fontSizePt);
  const tam = Number.isFinite(pt) && pt >= 8 && pt <= 18 ? pt : 12;
  const inter = INTERLINEADOS[(formato.lineSpacing ?? '1.5') as Interlineado] ?? INTERLINEADOS['1.5'];
  return { fontFamily: familia, fontSize: `${puntosAPixeles(tam)}px`, lineHeight: inter };
};
