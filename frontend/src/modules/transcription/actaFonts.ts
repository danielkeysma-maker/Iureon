/**
 * Plus Jakarta Sans para el acta (14b). La tipografía del sistema de diseño,
 * embebida en el PDF: jsPDF solo trae helvetica/times/courier, y el acta que
 * la firma archiva debe verse como el resto del producto — no como un recibo.
 *
 * OFL (SIL Open Font License): incrustar y redistribuir está permitido; los
 * TTF viven en el repo con su copyright intacto.
 *
 * `?inline` hace que Vite entregue el archivo como data URI en el bundle: el
 * export sigue siendo CERO RED — regla dura — a cambio de ~500 KB de bundle
 * que solo pagan quienes exportan (import dinámico en el llamador).
 */
import regularUrl from '../../assets/fonts/PlusJakartaSans-Regular.ttf?inline';
import boldUrl from '../../assets/fonts/PlusJakartaSans-Bold.ttf?inline';
import italicUrl from '../../assets/fonts/PlusJakartaSans-Italic.ttf?inline';
import type { jsPDF } from 'jspdf';

const base64De = (dataUri: string): string => dataUri.slice(dataUri.indexOf(',') + 1);

let registrada = false;

/** Registra la familia una vez por documento. Devuelve el nombre a usar en setFont. */
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
