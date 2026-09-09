import { jsPDF } from 'jspdf';
import { registrarFuenteDelEscrito } from '../documents/services/pdfFonts';
import { getMarcaActual } from '../tenant/services/branding.api';
import { dibujarCalculadoraEnPdf, nombreDePdf, tituloDeLibro } from './calculadoraPdfLayout';
import type { LibroExcel } from './exportarExcel';

/**
 * El resultado de una calculadora, en PDF para imprimirlo.
 *
 * EL EXCEL SE QUEDA; EL PDF SE SUMA. La hoja de cálculo sirve para seguir
 * trabajando el número; el PDF sirve para llevarlo a una audiencia, anexarlo o
 * archivarlo en papel. Los dos salen del MISMO `LibroExcel`, así que no pueden
 * decir cosas distintas.
 *
 * Carta con márgenes judiciales y la letra y el tamaño de Membrete, como el
 * informe de revisión y las preguntas de audiencia: lo que sale de esta
 * aplicación tiene el formato de la firma.
 */

export const exportarPdf = async (libro: LibroExcel): Promise<void> => {
  const marca = getMarcaActual();
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  const F = await registrarFuenteDelEscrito(doc, marca?.fontFamily ?? 'Times New Roman');
  const hoy = new Date();
  const fecha = hoy.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  dibujarCalculadoraEnPdf(doc, F, libro, fecha, marca?.fontSizePt ?? 11);

  doc.setProperties({ title: tituloDeLibro(libro), creator: 'Iureon' });
  doc.save(nombreDePdf(libro, hoy.toISOString().slice(0, 10)));
};
