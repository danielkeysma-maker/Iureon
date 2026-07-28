import { Document, Packer, Paragraph, TextRun, AlignmentType, Header as DocxHeader, Footer as DocxFooter, PageNumber } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';

export interface FirmBrandingConfig {
  firmName: string;
  firmNit: string;
  firmAddress: string;
  firmPhone: string;
  firmEmail: string;
  fontFamily: 'Inter' | 'Times New Roman' | 'Arial' | 'Calibri';
  primaryColorHex: string;
  logoUrl?: string;
  customFormatInstruction?: string; // Ej: Orden exacto de secciones (Hechos primero, Pretensiones al final)
  customSampleTemplate?: string;   // Modelo o minuta de referencia de la firma
}

export const DEFAULT_FIRM_BRANDING: FirmBrandingConfig = {
  firmName: 'FIRMA / DESPACHO ACTIVO',
  firmNit: 'PENDIENTE REGISTRO',
  firmAddress: 'Dirección Corporativa',
  firmPhone: 'Teléfono Notificaciones',
  firmEmail: 'notificaciones@tufirma.co',
  fontFamily: 'Inter',
  primaryColorHex: '#1E293B',
  customFormatInstruction: '1. Señores Juez / Tribunal\n2. Referencia y Partes\n3. Hechos Cronológicos\n4. Pretensiones\n5. Fundamentos de Derecho y Precedente\n6. Pruebas\n7. Notificaciones',
  customSampleTemplate: ''
};

export class DocumentExportService {
  /**
   * Exporta el borrador jurídico a Microsoft Word (.docx) con membrete dinámico de la firma cliente
   */
  public static async exportToWordDocx(
    documentTitle: string,
    legalContentText: string,
    branding: FirmBrandingConfig = DEFAULT_FIRM_BRANDING
  ): Promise<void> {
    const paragraphs = legalContentText.split('\n').map((line) => {
      const isHeader = line.startsWith('SEÑOR JUEZ') || line.startsWith('REFERENCIA:') || line.startsWith('DEMANDANTE:') || line.startsWith('DEMANDADO:');
      const isSectionTitle = line.startsWith('I. ') || line.startsWith('II. ') || line.startsWith('III. ');

      return new Paragraph({
        alignment: isHeader ? AlignmentType.LEFT : isSectionTitle ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
        spacing: {
          after: line.trim() === '' ? 120 : 160,
          line: 360 // Interlineado 1.5 líneas (formato judicial colombiano)
        },
        children: [
          new TextRun({
            text: line,
            font: branding.fontFamily === 'Inter' ? 'Calibri' : branding.fontFamily,
            bold: isHeader || isSectionTitle,
            size: isSectionTitle ? 24 : 22, // 11pt - 12pt
            color: isSectionTitle ? '1E293B' : '000000'
          })
        ]
      });
    });

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440,    // 1 pulgada (2.54 cm)
                bottom: 1440,
                left: 1700,   // 3 cm margen izquierdo judicial
                right: 1440
              }
            }
          },
          headers: {
            default: new DocxHeader({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: branding.firmName,
                      bold: true,
                      size: 18,
                      font: 'Calibri',
                      color: '475569'
                    }),
                    new TextRun({
                      text: ` | ${branding.firmNit}`,
                      size: 16,
                      font: 'Calibri',
                      color: '64748B'
                    })
                  ]
                })
              ]
            })
          },
          footers: {
            default: new DocxFooter({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: `${branding.firmAddress} - ${branding.firmPhone} - `,
                      size: 14,
                      color: '64748B'
                    }),
                    new TextRun({
                      children: ['Página ', PageNumber.CURRENT, ' de ', PageNumber.TOTAL_PAGES],
                      size: 14,
                      color: '64748B'
                    })
                  ]
                })
              ]
            })
          },
          children: paragraphs
        }
      ]
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, documentTitle.endsWith('.docx') ? documentTitle : `${documentTitle}.docx`);
  }

  /**
   * Exporta el borrador jurídico a PDF (.pdf) con membrete dinámico de la firma cliente
   */
  public static async exportToPdf(
    documentTitle: string,
    legalContentText: string,
    branding: FirmBrandingConfig = DEFAULT_FIRM_BRANDING
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'letter'
    });

    const pageMarginLeft = 25;
    const pageMarginTop = 30;
    const pageMarginRight = 20;
    const contentWidth = 215.9 - pageMarginLeft - pageMarginRight;
    let currentY = pageMarginTop;

    // Membrete de la Firma en la parte superior
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(branding.firmName, pageMarginLeft, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${branding.firmNit} | ${branding.firmPhone}`, pageMarginLeft, 19);

    doc.setDrawColor(203, 213, 225);
    doc.line(pageMarginLeft, 22, 215.9 - pageMarginRight, 22);

    // Formatear líneas del texto jurídico
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);

    const lines = legalContentText.split('\n');

    for (const rawLine of lines) {
      if (rawLine.trim() === '') {
        currentY += 4;
        continue;
      }

      const isHeader = rawLine.startsWith('SEÑOR JUEZ') || rawLine.startsWith('REFERENCIA:') || rawLine.startsWith('DEMANDANTE:') || rawLine.startsWith('DEMANDADO:');
      const isSectionTitle = rawLine.startsWith('I. ') || rawLine.startsWith('II. ') || rawLine.startsWith('III. ');

      if (isSectionTitle || isHeader) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }

      const splitLines = doc.splitTextToSize(rawLine, contentWidth);

      for (const line of splitLines) {
        if (currentY > 250) {
          doc.addPage();
          currentY = 25;

          // Repetir membrete en nueva página
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(100, 116, 139);
          doc.text(branding.firmName, pageMarginLeft, 15);
          doc.setDrawColor(203, 213, 225);
          doc.line(pageMarginLeft, 17, 215.9 - pageMarginRight, 17);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10.5);
          doc.setTextColor(15, 23, 42);
        }

        doc.text(line, pageMarginLeft, currentY);
        currentY += 5.5; // Distancia entre líneas
      }
      currentY += 2;
    }

    doc.save(documentTitle.endsWith('.pdf') ? documentTitle : `${documentTitle}.pdf`);
  }
}
