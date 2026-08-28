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
  /** Tamaño del escrito en puntos. Lo fija la marca de la firma; 12 por defecto. */
  fontSizePt?: number;
  /** Interlineado del escrito: '1.0' | '1.5' | '2.0'. */
  lineSpacing?: '1.0' | '1.5' | '2.0';
  customFormatInstruction?: string; // Ej: Orden exacto de secciones (Hechos primero, Pretensiones al final)
  customSampleTemplate?: string;   // Modelo o minuta de referencia de la firma
}

export const DEFAULT_FIRM_BRANDING: FirmBrandingConfig = {
  firmName: 'REPÚBLICA DE COLOMBIA - RAMA JUDICIAL',
  firmNit: 'SIN NIT FISCAL REGISTRADO',
  firmAddress: 'Dirección Corporativa',
  firmPhone: 'Teléfono Notificaciones',
  firmEmail: 'notificaciones@tufirma.co',
  fontFamily: 'Inter',
  primaryColorHex: '#1E293B',
  customFormatInstruction: '1. Señores Juez / Tribunal\n2. Referencia y Partes\n3. Hechos Cronológicos\n4. Pretensiones\n5. Fundamentos de Derecho y Precedente\n6. Pruebas\n7. Notificaciones',
  customSampleTemplate: ''
};

// ═══════════════════════════════════════════════════════════════════
// UTILIDADES: Parsear markdown bold (**texto**) a segmentos con metadata
// ═══════════════════════════════════════════════════════════════════

interface TextSegment {
  text: string;
  bold: boolean;
}

/**
 * Parsea una línea de texto que puede contener **texto en negrita** markdown
 * y devuelve un array de segmentos con flag bold.
 * Ejemplo: "Hola **mundo** cruel" → [{text:"Hola ", bold:false}, {text:"mundo", bold:true}, {text:" cruel", bold:false}]
 */
function parseMarkdownBold(line: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(line)) !== null) {
    // Texto antes del **
    if (match.index > lastIndex) {
      segments.push({ text: line.slice(lastIndex, match.index), bold: false });
    }
    // Texto dentro de ** **
    segments.push({ text: match[1], bold: true });
    lastIndex = regex.lastIndex;
  }

  // Texto restante después del último **
  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex), bold: false });
  }

  return segments.length > 0 ? segments : [{ text: line, bold: false }];
}

/**
 * Limpia sintaxis markdown (## headings, --- separadores) de una línea
 * pero preserva **negritas** para procesamiento posterior
 */
function cleanMarkdownLine(line: string): string {
  // Eliminar ## headings markdown → dejar solo el texto
  let cleaned = line.replace(/^#{1,6}\s+/, '');
  // Eliminar --- separadores horizontales
  if (/^-{3,}$/.test(cleaned.trim())) return '';
  return cleaned;
}

/**
 * Convierte texto con markdown bold a HTML con <strong> tags.
 * Para uso en el visor del frontend.
 */
export function markdownBoldToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>')
    .replace(/^-{3,}$/gm, '');
}

/**
 * Decisiones POR ESCRITO, no preferencias permanentes.
 *
 * Cada exportacion las decide de nuevo: el mismo abogado radica un PDF con
 * membrete ante un juzgado y manda un Word sin membrete a un colega. Si
 * vivieran en Ajustes, la eleccion de un escrito quedaria pegada al siguiente.
 */
export interface OpcionesDeExportacion {
  /** El encabezado y pie con los datos de la firma. */
  conMembrete: boolean;
  /**
   * La jurisprudencia citada, como hoja final del documento.
   *
   * Va como LISTA y no como booleano: las fuentes son del borrador, no del
   * servicio, y este archivo no debe conocer de donde salen.
   */
  fuentes?: string[];
}

const OPCIONES_POR_DEFECTO: OpcionesDeExportacion = { conMembrete: true };

export class DocumentExportService {
  /**
   * Exporta el borrador jurídico a Microsoft Word (.docx) con negritas reales
   */
  public static async exportToWordDocx(
    documentTitle: string,
    legalContentText: string,
    branding: FirmBrandingConfig = DEFAULT_FIRM_BRANDING,
    opciones: OpcionesDeExportacion = OPCIONES_POR_DEFECTO
  ): Promise<void> {
    const paragraphs = legalContentText.split('\n').map((rawLine) => {
      const line = cleanMarkdownLine(rawLine);
      if (line.trim() === '') {
        return new Paragraph({ spacing: { after: 120 } });
      }

      const isHeader = line.startsWith('SEÑOR JUEZ') || line.startsWith('REFERENCIA:') || line.startsWith('DEMANDANTE:') || line.startsWith('DEMANDADO:');
      const isSectionTitle = /^[IVX]+\.\s/.test(line) || /^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO)[\.:]/i.test(line);

      // Parsear **negritas** markdown dentro de la línea
      const segments = parseMarkdownBold(line);

      /*
       * El tamano y el interlineado los fija LA MARCA DE LA FIRMA (3d/6b), no
       * este archivo: docx mide en medios puntos (12pt = 24) y el interlineado
       * en 240avos de linea (1,5 = 360). Antes estaban quemados en 11pt/1,5 y
       * el ajuste de la marca era decorativo en el documento exportado.
       */
      const tamanoBase = (branding.fontSizePt ?? 12) * 2;
      const lineaDocx = Math.round(240 * Number(branding.lineSpacing ?? '1.5'));

      const children = segments.map((seg) => new TextRun({
        text: seg.text,
        font: branding.fontFamily === 'Inter' ? 'Calibri' : branding.fontFamily,
        bold: seg.bold || isHeader || isSectionTitle,
        size: isSectionTitle ? tamanoBase + 2 : tamanoBase,
        color: isSectionTitle ? '1E293B' : '000000'
      }));

      return new Paragraph({
        alignment: isHeader ? AlignmentType.LEFT : isSectionTitle ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
        spacing: { after: 160, line: lineaDocx },
        children
      });
    });

    /*
     * LA HOJA DE FUENTES VA AL FINAL Y EN SU PROPIA SECCION VISUAL.
     * Es la lista de jurisprudencia que el escrito uso, para que quien reciba
     * el documento pueda verificar cada cita sin tener la aplicacion.
     */
    if (opciones.fuentes && opciones.fuentes.length > 0) {
      paragraphs.push(
        new Paragraph({ spacing: { after: 240 }, children: [] }),
        new Paragraph({
          spacing: { after: 160 },
          children: [
            new TextRun({ text: 'FUENTES CITADAS', bold: true, size: 24, font: 'Calibri' })
          ]
        }),
        ...opciones.fuentes.map(
          (fuente) =>
            new Paragraph({
              spacing: { after: 100 },
              children: [new TextRun({ text: `- ${fuente}`, size: 20, font: 'Calibri' })]
            })
        )
      );
    }

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
          /*
           * Sin membrete no hay encabezado, y el pie conserva SOLO la
           * numeracion: "Pagina 2 de 6" no es identidad de la firma, es lo que
           * evita que un juzgado reciba hojas sueltas sin orden.
           */
          headers: opciones.conMembrete
            ? {
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
              }
            : undefined,
          footers: {
            default: new DocxFooter({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    ...(opciones.conMembrete
                      ? [
                          new TextRun({
                            text: `${branding.firmAddress} - ${branding.firmPhone} - `,
                            size: 14,
                            color: '64748B'
                          })
                        ]
                      : []),
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
   * Exporta el borrador jurídico a PDF (.pdf) con negritas reales
   */
  public static async exportToPdf(
    documentTitle: string,
    legalContentText: string,
    branding: FirmBrandingConfig = DEFAULT_FIRM_BRANDING,
    opciones: OpcionesDeExportacion = OPCIONES_POR_DEFECTO
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

    /*
     * ─── MEMBRETE (14a): el documento es DE LA FIRMA, no de Iureon ─────────
     *
     * Logo a la izquierda cuando la marca lo tiene (PNG/JPEG en data URI —
     * jsPDF no rasteriza SVG y un logo que no carga no puede tumbar el
     * escrito: por eso el try). Razon social en mayusculas, NIT y direccion en
     * una linea de metadatos, y la fecha larga del dia — que es la del
     * documento que se radica.
     */
    let membreteBase = 15;
    if (opciones.conMembrete) {
      let xTexto = pageMarginLeft;

      if (branding.logoUrl && /^data:image\/(png|jpe?g)/.test(branding.logoUrl)) {
        try {
          doc.addImage(branding.logoUrl, pageMarginLeft, 10, 24, 12, undefined, 'FAST');
          xTexto = pageMarginLeft + 28;
        } catch {
          /* Logo ilegible: el membrete sale sin el, nunca rompe el escrito. */
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text((branding.firmName || '').toUpperCase(), xTexto, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        [branding.firmNit && `NIT ${branding.firmNit}`, branding.firmAddress, branding.firmPhone]
          .filter(Boolean)
          .join(' · '),
        xTexto,
        19.5
      );

      doc.setDrawColor(203, 213, 225);
      doc.line(pageMarginLeft, 23, 215.9 - pageMarginRight, 23);

      // La fecha del documento, en el idioma del documento.
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(
        new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
        pageMarginLeft,
        29
      );
      membreteBase = 34;
    }
    currentY = Math.max(currentY, membreteBase);

    /*
     * EL CUERPO EN LA LETRA DE LA MARCA. jsPDF trae 'times' de fabrica: un
     * escrito judicial colombiano se espera en Times 12 — helvetica lo hacia
     * leerse como borrador de software, no como documento que se radica.
     */
    const fuentePdf = branding.fontFamily === 'Times New Roman' ? 'times' : 'helvetica';
    doc.setFont(fuentePdf, 'normal');

    // Formatear líneas del texto jurídico
    /* El tamano y el salto vienen de la marca de la firma (3d/6b). */
    const tamanoPdf = ((branding.fontSizePt ?? 12) * 10.5) / 12;
    const saltoLinea = 5.5 * (Number(branding.lineSpacing ?? '1.5') / 1.5);
    doc.setFontSize(tamanoPdf);
    doc.setTextColor(15, 23, 42);

    const lines = legalContentText.split('\n');

    for (const rawLine of lines) {
      const line = cleanMarkdownLine(rawLine);

      if (line.trim() === '') {
        currentY += 4;
        continue;
      }

      const isHeader = line.startsWith('SEÑOR JUEZ') || line.startsWith('REFERENCIA:') || line.startsWith('DEMANDANTE:') || line.startsWith('DEMANDADO:');
      const isSectionTitle = /^[IVX]+\.\s/.test(line) || /^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO)[\.:]/i.test(line);

      // Para PDF: parsear segmentos bold/normal dentro de cada línea
      const segments = parseMarkdownBold(line);
      const hasInlineBold = segments.some(s => s.bold);

      if (!hasInlineBold) {
        // Línea simple sin negritas inline — renderizar toda de una
        doc.setFont(fuentePdf, (isSectionTitle || isHeader) ? 'bold' : 'normal');
        const splitLines = doc.splitTextToSize(line, contentWidth);

        for (const sl of splitLines) {
          if (currentY > 250) {
            doc.addPage();
            currentY = 25;
            if (opciones.conMembrete) {
              doc.setFont(fuentePdf, 'bold');
              doc.setFontSize(9);
              doc.setTextColor(100, 116, 139);
              doc.text(branding.firmName, pageMarginLeft, 15);
              doc.setDrawColor(203, 213, 225);
              doc.line(pageMarginLeft, 17, 215.9 - pageMarginRight, 17);
            }
            doc.setFont(fuentePdf, 'normal');
            doc.setFontSize(tamanoPdf);
            doc.setTextColor(15, 23, 42);
          }
          doc.text(sl, pageMarginLeft, currentY);
          currentY += saltoLinea;
        }
      } else {
        // Línea con negritas inline — renderizar segmento por segmento
        // Primero calcular el texto plano para word-wrap
        const plainText = segments.map(s => s.text).join('');
        const wrappedLines = doc.splitTextToSize(plainText, contentWidth);

        for (const wrappedLine of wrappedLines) {
          if (currentY > 250) {
            doc.addPage();
            currentY = 25;
            if (opciones.conMembrete) {
              doc.setFont(fuentePdf, 'bold');
              doc.setFontSize(9);
              doc.setTextColor(100, 116, 139);
              doc.text(branding.firmName, pageMarginLeft, 15);
              doc.setDrawColor(203, 213, 225);
              doc.line(pageMarginLeft, 17, 215.9 - pageMarginRight, 17);
            }
            doc.setFontSize(tamanoPdf);
            doc.setTextColor(15, 23, 42);
          }

          // Para cada línea wrapped, renderizar segmentos bold/normal
          let xPos = pageMarginLeft;
          let remaining = wrappedLine;

          for (const seg of segments) {
            if (remaining.length === 0) break;

            // Encontrar cuánto del segmento cabe en esta línea
            const segText = seg.text;
            if (remaining.startsWith(segText)) {
              doc.setFont(fuentePdf, (seg.bold || isSectionTitle || isHeader) ? 'bold' : 'normal');
              doc.text(segText, xPos, currentY);
              xPos += doc.getTextWidth(segText);
              remaining = remaining.slice(segText.length);
            } else if (remaining.includes(segText.substring(0, Math.min(5, segText.length)))) {
              // Partial match — simplified rendering
              doc.setFont(fuentePdf, (seg.bold || isSectionTitle || isHeader) ? 'bold' : 'normal');
              const partLen = Math.min(segText.length, remaining.length);
              const part = remaining.substring(0, partLen);
              doc.text(part, xPos, currentY);
              xPos += doc.getTextWidth(part);
              remaining = remaining.slice(partLen);
            }
          }

          // Fallback: si quedó texto sin renderizar
          if (remaining.length > 0) {
            doc.setFont(fuentePdf, 'normal');
            doc.text(remaining, xPos, currentY);
          }

          currentY += saltoLinea;
        }
      }
      currentY += 2;
    }

    /*
     * LA HOJA DE FUENTES CITADAS, en pagina propia.
     * Para que quien reciba el PDF pueda verificar cada cita sin la aplicacion.
     */
    if (opciones.fuentes && opciones.fuentes.length > 0) {
      doc.addPage();
      currentY = pageMarginTop;

      doc.setFont(fuentePdf, 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('FUENTES CITADAS', pageMarginLeft, currentY);
      currentY += 8;

      doc.setFont(fuentePdf, 'normal');
      doc.setFontSize(9.5);
      for (const fuente of opciones.fuentes) {
        const envueltas = doc.splitTextToSize(`- ${fuente}`, contentWidth);
        for (const linea of envueltas) {
          if (currentY > 250) {
            doc.addPage();
            currentY = 25;
          }
          doc.text(linea, pageMarginLeft, currentY);
          currentY += 5.5;
        }
        currentY += 1.5;
      }
    }

    /*
     * ─── PIE EN CADA PAGINA (14a): firma · correo | Pagina N de M ──────────
     *
     * La paginacion es REAL — la del documento que se radica — y por eso vive
     * aqui y no en el visor de pantalla, donde inventarla hacia citar paginas
     * inexistentes. Sin marca de Iureon: un juzgado recibe un documento de la
     * firma, no un entregable de un proveedor.
     */
    const totalPaginas = doc.getNumberOfPages();
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
      doc.setPage(pagina);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);

      const pieIzq = [branding.firmName, branding.firmEmail].filter(Boolean).join(' · ');
      if (opciones.conMembrete && pieIzq) doc.text(pieIzq, pageMarginLeft, 272);
      doc.text(`Página ${pagina} de ${totalPaginas}`, 215.9 - pageMarginRight, 272, { align: 'right' });
    }

    doc.save(documentTitle.endsWith('.pdf') ? documentTitle : `${documentTitle}.pdf`);
  }
}
