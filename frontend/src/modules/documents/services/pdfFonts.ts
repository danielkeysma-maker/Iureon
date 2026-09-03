/**
 * Las letras del PDF exportado.
 *
 * ─── EL PDF SALE CON LA LETRA QUE LA FIRMA ELIGIÓ ───────────────────────────
 *
 * Antes salía SIEMPRE en Plus Jakarta Sans, dijera lo que dijera Membrete: el
 * Word obedecía la tipografía de la firma y el PDF no, y el mismo escrito se
 * veía distinto según el botón. Ahora las dos salidas obedecen la misma
 * configuración.
 *
 * ─── INCRUSTADA O EQUIVALENTE, Y SE DICE CUÁL ───────────────────────────────
 *
 * Un PDF solo se ve igual en todas partes si la letra va DENTRO del archivo.
 * Las libres se incrustan: Plus Jakarta Sans, Manrope y Public Sans (OFL) y
 * Satoshi (licencia libre de Fontshare) viajan en el bundle como TTF y se
 * cargan solo cuando la firma las usa. Las propietarias no se pueden
 * incrustar sin licencia —Times New Roman, Arial, Calibri, Tahoma— y el PDF
 * usa la equivalente estándar que todo lector trae: Times para Times New
 * Roman, Helvetica para las sans. `equivalenteDe` lo declara para que la
 * pantalla lo pueda decir en vez de fingir.
 *
 * jsPDF necesita TTF estáticos (no variables) por estilo; Manrope y Public
 * Sans se convirtieron de los WOFF de Google Fonts con fontTools sin tocar
 * los contornos; Satoshi son los TTF que sirve Fontshare. Satoshi no trae
 * itálica en su versión estática libre: la itálica usa la redonda.
 */
import regularUrl from '../../../assets/fonts/PlusJakartaSans-Regular.ttf?inline';
import boldUrl from '../../../assets/fonts/PlusJakartaSans-Bold.ttf?inline';
import italicUrl from '../../../assets/fonts/PlusJakartaSans-Italic.ttf?inline';
import type { jsPDF } from 'jspdf';

const base64De = (dataUri: string): string => dataUri.slice(dataUri.indexOf(',') + 1);

let registrada = false;

export const registrarJakarta = (doc: jsPDF): string => {
  // El VFS es por instancia de documento: registrar siempre sobre el doc nuevo.
  doc.addFileToVFS('PlusJakartaSans-Regular.ttf', base64De(regularUrl));
  doc.addFileToVFS('PlusJakartaSans-Bold.ttf', base64De(boldUrl));
  doc.addFileToVFS('PlusJakartaSans-Italic.ttf', base64De(italicUrl));
  doc.addFont('PlusJakartaSans-Regular.ttf', 'Jakarta', 'normal');
  doc.addFont('PlusJakartaSans-Bold.ttf', 'Jakarta', 'bold');
  doc.addFont('PlusJakartaSans-Italic.ttf', 'Jakarta', 'italic');
  registrada = true;
  return 'Jakarta';
};

export const jakartaLista = (): boolean => registrada;

/** Las que se incrustan, con sus archivos. Cargadas solo al exportar con esa letra. */
const INCRUSTABLES: Record<string, () => Promise<{ regular: string; bold: string; italic: string }>> = {
  Manrope: async () => {
    const [r, b] = await Promise.all([
      import('../../../assets/fonts/Manrope-Regular.ttf?inline'),
      import('../../../assets/fonts/Manrope-Bold.ttf?inline')
    ]);
    return { regular: r.default, bold: b.default, italic: r.default };
  },
  'Public Sans': async () => {
    const [r, b, i] = await Promise.all([
      import('../../../assets/fonts/PublicSans-Regular.ttf?inline'),
      import('../../../assets/fonts/PublicSans-Bold.ttf?inline'),
      import('../../../assets/fonts/PublicSans-Italic.ttf?inline')
    ]);
    return { regular: r.default, bold: b.default, italic: i.default };
  },
  Satoshi: async () => {
    const [r, b] = await Promise.all([
      import('../../../assets/fonts/Satoshi-Regular.ttf?inline'),
      import('../../../assets/fonts/Satoshi-Bold.ttf?inline')
    ]);
    return { regular: r.default, bold: b.default, italic: r.default };
  }
};

/** Las propietarias: la equivalente estándar del PDF, que todo lector trae. */
const EQUIVALENTES: Record<string, 'times' | 'helvetica'> = {
  'Times New Roman': 'times',
  Arial: 'helvetica',
  Calibri: 'helvetica',
  Tahoma: 'helvetica',
  Inter: 'helvetica'
};

/** Qué letra llevará el PDF de verdad para una familia de Membrete, para decirlo en pantalla. */
export const equivalenteDe = (familia: string): { incrustada: boolean; nombre: string } => {
  if (familia === 'Plus Jakarta Sans' || INCRUSTABLES[familia]) return { incrustada: true, nombre: familia };
  const eq = EQUIVALENTES[familia];
  if (eq === 'times') return { incrustada: false, nombre: 'Times (equivalente estándar del PDF)' };
  return { incrustada: false, nombre: 'Helvetica (equivalente estándar del PDF)' };
};

/**
 * Registra en el documento la letra de la firma y devuelve el nombre con el
 * que jsPDF la conoce. Nunca falla hacia una letra distinta sin decirlo: si
 * un archivo no carga, cae a la equivalente estándar y lo registra en consola.
 */
export const registrarFuenteDelEscrito = async (doc: jsPDF, familia: string): Promise<string> => {
  if (familia === 'Plus Jakarta Sans') return registrarJakarta(doc);

  const cargar = INCRUSTABLES[familia];
  if (cargar) {
    try {
      const { regular, bold, italic } = await cargar();
      const id = familia.replace(/\s+/g, '');
      doc.addFileToVFS(`${id}-Regular.ttf`, base64De(regular));
      doc.addFileToVFS(`${id}-Bold.ttf`, base64De(bold));
      doc.addFileToVFS(`${id}-Italic.ttf`, base64De(italic));
      doc.addFont(`${id}-Regular.ttf`, id, 'normal');
      doc.addFont(`${id}-Bold.ttf`, id, 'bold');
      doc.addFont(`${id}-Italic.ttf`, id, 'italic');
      return id;
    } catch (error) {
      console.warn(`[PDF] No se pudo incrustar ${familia}; se usa Helvetica.`, error);
      return 'helvetica';
    }
  }

  return EQUIVALENTES[familia] ?? 'helvetica';
};
