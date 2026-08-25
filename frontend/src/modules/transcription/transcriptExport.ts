import { Document, Packer, Paragraph, TextRun, AlignmentType, Footer as DocxFooter, PageNumber } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { buildSpeakerNames } from './speakerNames';
import { ROLE_LABELS, type TranscriptionResult } from './types';

/**
 * Exports a transcript as a record of what was said.
 *
 * WHY NOT THE DRAFT EXPORTER. `DocumentExportService` renders a legal brief:
 * it looks for "SEÑOR JUEZ" and roman-numbered sections, bolds them, and lays
 * out one flowing argument. A transcript is the opposite shape — a sequence of
 * turns, each belonging to somebody, each pinned to a minute — and running it
 * through that formatter would produce a brief-looking document whose headings
 * were somebody's name.
 *
 * WHY IT MATTERS THAT THIS EXISTS AT ALL. The transcript's whole purpose is to
 * be quoted: in a memorial, in an alegato, in a recurso. Until now it could only
 * leave the app as clipboard text, so the identification work — who is the
 * judge, which apoderado is which — arrived at the document as a paragraph
 * somebody had to reformat by hand, and usually as nothing at all.
 *
 * WHAT TRAVELS. Names, roles and minutes, because those are what make a
 * quotation checkable against the recording, plus a note saying a machine
 * produced it and a person reviewed it — which is what it is, and what keeps a
 * reader from mistaking it for the court's own certified record.
 */

const formatTimestamp = (seconds: number | null): string => {
  if (seconds === null) return '';

  const total = Math.floor(seconds);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');

  return `${mm}:${ss}`;
};

const KIND_LABEL: Record<string, string> = {
  AUDIENCIA: 'Transcripción de audiencia',
  ENTREVISTA: 'Transcripción de entrevista'
};

const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });

const duracion = (segundos: number | null): string => {
  if (!segundos) return '';
  const minutos = Math.round(segundos / 60);
  return minutos < 60 ? `${minutos} minutos` : `${Math.floor(minutos / 60)} h ${minutos % 60} min`;
};

/** A filename that says what it is without being opened. */
const nombreArchivo = (sourceName: string, ext: string): string => {
  const base = sourceName.replace(/^\d{10,}_/, '').replace(/\.[^.]+$/, '') || 'transcripcion';
  return `${base.slice(0, 60)}.${ext}`;
};

interface Linea {
  quien: string;
  rol: string;
  minuto: string;
  texto: string;
}

/**
 * The transcript flattened for either format.
 *
 * Shared so the Word file and the PDF cannot drift into disagreeing about who
 * said what — the same reason the screen and the clipboard already share
 * `buildSpeakerNames`.
 */
const lineas = (result: TranscriptionResult): Linea[] => {
  const nombres = buildSpeakerNames(result.segments, ROLE_LABELS);

  return result.segments.map((segment) => {
    const nombre = nombres[segment.speakerLabel] ?? ROLE_LABELS[segment.role];
    // The role only when a name was set: without one the heading already IS the
    // role, and "Juez (Juez)" says the same thing twice.
    const rol = segment.speakerName && segment.role !== 'DESCONOCIDO' ? ROLE_LABELS[segment.role] : '';

    return {
      quien: nombre,
      rol,
      minuto: formatTimestamp(segment.startSeconds),
      texto: segment.text
    };
  });
};

const encabezado = (result: TranscriptionResult, titulo: string): string[] => {
  const lineasEncabezado = [
    KIND_LABEL[result.kind] ?? 'Transcripción',
    titulo.replace(/^\d{10,}_/, ''),
    `Fecha: ${fechaLarga(result.transcribedAt)}`
  ];

  const dur = duracion(result.durationSeconds);
  if (dur) lineasEncabezado.push(`Duración: ${dur}`);

  lineasEncabezado.push(`Intervenciones: ${result.segments.length}`);
  lineasEncabezado.push(`Interlocutores: ${result.speakerLabels.length}`);

  return lineasEncabezado;
};

/**
 * The provenance note.
 *
 * Says plainly that a machine produced this and a person reviewed it. A
 * transcript quoted in a filing without that sentence invites being read as a
 * certified record, which it is not — the official one is the court's own.
 */
const NOTA =
  'Transcripción generada automáticamente y revisada por el profesional que la suscribe. ' +
  'No sustituye el registro oficial de la diligencia.';

export const exportTranscriptToWord = async (
  result: TranscriptionResult,
  titulo: string
): Promise<void> => {
  const cuerpo: Paragraph[] = [];

  for (const linea of encabezado(result, titulo)) {
    cuerpo.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 60 },
        children: [new TextRun({ text: linea, bold: true, font: 'Calibri', size: 22 })]
      })
    );
  }

  cuerpo.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 320 },
      children: [new TextRun({ text: NOTA, font: 'Calibri', size: 16, italics: true, color: '64748B' })]
    })
  );

  for (const linea of lineas(result)) {
    cuerpo.push(
      new Paragraph({
        spacing: { before: 160, after: 40 },
        children: [
          new TextRun({ text: linea.quien, bold: true, font: 'Calibri', size: 22 }),
          ...(linea.rol
            ? [new TextRun({ text: ` (${linea.rol})`, font: 'Calibri', size: 20, color: '475569' })]
            : []),
          ...(linea.minuto
            ? [new TextRun({ text: `  [${linea.minuto}]`, font: 'Calibri', size: 18, color: '94A3B8' })]
            : [])
        ]
      })
    );

    cuerpo.push(
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: linea.texto, font: 'Calibri', size: 22 })]
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: new DocxFooter({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Página ', font: 'Calibri', size: 16, color: '94A3B8' }),
                  new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '94A3B8' })
                ]
              })
            ]
          })
        },
        children: cuerpo
      }
    ]
  });

  saveAs(await Packer.toBlob(doc), nombreArchivo(titulo, 'docx'));
};

export const exportTranscriptToPdf = (result: TranscriptionResult, titulo: string): void => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });

  const margenIzq = 20;
  const margenDer = 20;
  const margenSup = 22;
  const ancho = 215.9 - margenIzq - margenDer;
  const alto = 279.4;
  let y = margenSup;

  /** Starts a new page when the next block would fall off this one. */
  const asegurarEspacio = (necesario: number): void => {
    if (y + necesario > alto - 20) {
      doc.addPage();
      y = margenSup;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  for (const linea of encabezado(result, titulo)) {
    doc.text(linea, 215.9 / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(10);
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  for (const trozo of doc.splitTextToSize(NOTA, ancho) as string[]) {
    y += 4;
    doc.text(trozo, 215.9 / 2, y, { align: 'center' });
  }

  y += 10;
  doc.setTextColor(0, 0, 0);

  for (const linea of lineas(result)) {
    const cuerpo = doc.splitTextToSize(linea.texto, ancho) as string[];
    asegurarEspacio(8 + cuerpo.length * 4.6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(linea.quien, margenIzq, y);

    const anchoNombre = doc.getTextWidth(linea.quien);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const sufijo = [linea.rol ? `(${linea.rol})` : '', linea.minuto ? `[${linea.minuto}]` : '']
      .filter(Boolean)
      .join('  ');
    if (sufijo) doc.text(sufijo, margenIzq + anchoNombre + 2, y);

    y += 5;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    for (const trozo of cuerpo) {
      doc.text(trozo, margenIzq, y);
      y += 4.6;
    }

    y += 3;
  }

  const paginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${pagina} de ${paginas}`, 215.9 / 2, alto - 12, { align: 'center' });
  }

  doc.save(nombreArchivo(titulo, 'pdf'));
};
