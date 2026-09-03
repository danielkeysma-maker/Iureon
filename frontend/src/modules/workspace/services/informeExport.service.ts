import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { registrarFuenteDelEscrito } from '../../documents/services/pdfFonts';
import { getMarcaActual } from '../../tenant/services/branding.api';
import { dibujarInformeEnPdf, type DatosDelInforme } from './informeLayout';

/**
 * Exportar el informe de una revisión a PDF y a Word, con la estructura del
 * diálogo: juicio global, secciones que faltan, fortalezas, debilidades,
 * errores de aplicación con su corrección y recomendaciones.
 *
 * La letra y el tamaño son los de Membrete, como en los escritos: el informe
 * es material de trabajo de la firma y sale con su formato. Sin membrete
 * completo ni bloque de firma —no se radica; se lee para corregir—.
 */

const nombreDeArchivo = (d: DatosDelInforme, ext: string): string =>
  `Revision_${d.documentType.replace(/[^\p{L}\p{N}]+/gu, '_')}_${d.fileName.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}]+/gu, '_')}.${ext}`;

export const exportarInformeAPdf = async (d: DatosDelInforme): Promise<void> => {
  const marca = getMarcaActual();
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  const F = await registrarFuenteDelEscrito(doc, marca?.fontFamily ?? 'Times New Roman');
  dibujarInformeEnPdf(doc, F, { ...d, firmName: d.firmName ?? marca?.firmName }, marca?.fontSizePt ?? 11);
  doc.setProperties({ title: `Revisión · ${d.documentType}`, subject: d.fileName, creator: 'Iureon' });
  doc.save(nombreDeArchivo(d, 'pdf'));
};

export const exportarInformeAWord = async (d: DatosDelInforme): Promise<void> => {
  const marca = getMarcaActual();
  const font = marca?.fontFamily === 'Inter' ? 'Calibri' : (marca?.fontFamily ?? 'Times New Roman');
  const base = (marca?.fontSizePt ?? 11) * 2; // docx mide en medios puntos
  const gris = '555555';

  const p = (text: string, o: { bold?: boolean; italics?: boolean; size?: number; color?: string; after?: number; indent?: number } = {}) =>
    new Paragraph({
      spacing: { after: o.after ?? 120, line: 300 },
      indent: o.indent ? { left: o.indent } : undefined,
      children: [new TextRun({ text, font, bold: o.bold, italics: o.italics, size: o.size ?? base, color: o.color ?? '111111' })]
    });
  const titulo = (t: string) =>
    new Paragraph({
      spacing: { before: 240, after: 80 },
      border: { bottom: { color: 'C8C8C8', size: 6, style: 'single', space: 2 } },
      children: [new TextRun({ text: t.toUpperCase(), font, bold: true, size: base - 3, color: gris })]
    });
  const vineta = (t: string) =>
    new Paragraph({ bullet: { level: 0 }, spacing: { after: 80, line: 300 }, children: [new TextRun({ text: t, font, size: base })] });

  const i = d.informe;
  const hijos: Paragraph[] = [];
  const firma = d.firmName ?? marca?.firmName;
  if (firma) hijos.push(p(firma, { size: base - 4, color: gris, after: 40 }));
  hijos.push(p(`Revisión del escrito · ${d.documentType}`, { bold: true, size: base + 8, after: 60 }));
  hijos.push(
    p(`${d.fileName} · ${d.fecha} · ${d.caracteres.toLocaleString('es-CO')} caracteres${d.truncado ? ' (recortado a 300.000)' : ''}`, {
      size: base - 4,
      color: gris,
      after: 40
    })
  );
  hijos.push(
    p(d.conFicha ? `Revisado contra la ficha verificada de «${d.documentType}».` : 'Sin ficha verificada de la actuación: lo objetivo va con menos respaldo.', {
      italics: true,
      size: base - 4,
      color: gris,
      after: 200
    })
  );
  if (i.resumen) hijos.push(p(i.resumen, { size: base + 1, after: 160 }));

  const seccion = (t: string, items: string[]) => {
    if (!items.length) return;
    hijos.push(titulo(t));
    items.forEach((x) => hijos.push(vineta(x)));
  };
  seccion('Secciones que la norma exige y faltan', i.seccionesFaltantes);
  seccion('Fortalezas', i.fortalezas);
  seccion('Debilidades', i.debilidades);
  if (i.erroresDeAplicacion.length) {
    hijos.push(titulo('Errores de aplicación'));
    for (const e of i.erroresDeAplicacion) {
      if (e.donde) hijos.push(p(e.donde, { bold: true, size: base - 2, color: gris, after: 40 }));
      if (e.problema) hijos.push(p(e.problema, { after: 40 }));
      if (e.correccion) hijos.push(p(`Corrección: ${e.correccion}`, { italics: true, indent: 360, after: 160 }));
    }
  }
  seccion('Recomendaciones', i.recomendaciones);
  hijos.push(
    new Paragraph({
      spacing: { before: 320 },
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: 'Lo marcado como exigencia de la norma sale de la ficha verificada del catálogo; lo demás es criterio profesional del revisor y el abogado decide. El informe no cita providencias: donde se necesite precedente, debe verificarse antes de presentar.',
          font,
          size: base - 5,
          color: '6E6E6E'
        })
      ]
    })
  );

  const documento = new Document({
    creator: 'Iureon',
    title: `Revisión · ${d.documentType}`,
    sections: [{ properties: { page: { margin: { top: 1418, right: 1418, bottom: 1418, left: 1701 } } }, children: hijos }]
  });
  saveAs(await Packer.toBlob(documento), nombreDeArchivo(d, 'docx'));
};
