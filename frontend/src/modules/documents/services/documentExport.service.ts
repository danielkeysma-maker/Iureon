import { Document, Packer, Paragraph, TextRun, AlignmentType, Header as DocxHeader, Footer as DocxFooter, PageNumber } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { drawRuns, type PdfRun } from './pdfTextLayout';

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

    /*
     * MARGENES DEL 14a: 3 cm izquierdo (encuadernacion judicial), 2,5 cm los
     * demas. La placa del artboard los declara — «Carta · márgenes 3/2,5 cm ·
     * Times 12 pt · 1,5» — y son la referencia, no una preferencia.
     */
    const pageMarginLeft = 30;
    const pageMarginTop = 25;
    const pageMarginRight = 25;
    const pageMarginBottom = 25;
    const pageHeight = 279.4;
    const pageBottomLimit = pageHeight - pageMarginBottom;
    const contentWidth = 215.9 - pageMarginLeft - pageMarginRight;
    let currentY = pageMarginTop;

    /*
     * La trazabilidad del 14a viaja en las propiedades del archivo, no en el
     * papel: un juzgado recibe un documento de la firma, y quien inspeccione
     * los metadatos encuentra el origen.
     */
    doc.setProperties({
      title: documentTitle,
      author: branding.firmName || undefined,
      creator: 'Iureon'
    });

    /*
     * ─── MEMBRETE (14a): el documento es DE LA FIRMA, no de Iureon ─────────
     *
     * Logo a la izquierda cuando la marca lo tiene (PNG/JPEG en data URI —
     * jsPDF no rasteriza SVG y un logo que no carga no puede tumbar el
     * escrito: por eso el try). Razon social en mayusculas, NIT y direccion en
     * una linea de metadatos, y la fecha larga del dia — que es la del
     * documento que se radica.
     */
    let membreteBase = pageMarginTop;
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
      doc.setTextColor(16, 24, 34);
      doc.text((branding.firmName || '').toUpperCase(), xTexto, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(102, 116, 135);
      doc.text(
        [branding.firmNit && `NIT ${branding.firmNit}`, branding.firmAddress, branding.firmPhone]
          .filter(Boolean)
          .join(' · '),
        xTexto,
        19.5
      );

      // La fecha del documento, a la derecha del membrete como el 14a.
      doc.setFontSize(9);
      doc.setTextColor(102, 116, 135);
      doc.text(
        new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
        215.9 - pageMarginRight,
        15,
        { align: 'right' }
      );

      /* El filete del membrete del 14a es OSCURO (1,5 px #101822), no gris. */
      doc.setDrawColor(16, 24, 34);
      doc.setLineWidth(0.5);
      doc.line(pageMarginLeft, 23, 215.9 - pageMarginRight, 23);
      doc.setLineWidth(0.2);
      membreteBase = 31;
    }
    currentY = Math.max(currentY, membreteBase);

    /*
     * EL CUERPO EN LA LETRA DE LA MARCA. jsPDF trae 'times' de fabrica: un
     * escrito judicial colombiano se espera en Times 12 — helvetica lo hacia
     * leerse como borrador de software, no como documento que se radica.
     */
    const fuentePdf = branding.fontFamily === 'Times New Roman' ? 'times' : 'helvetica';
    doc.setFont(fuentePdf, 'normal');

    /*
     * EL TAMANO ES EL DE LA MARCA, EN PUNTOS REALES. La version anterior
     * reescalaba 12 pt a 10,5 y el «Times 12» de la placa del 14a nunca
     * llegaba al papel. El interlineado tambien es el declarado: 1,5 lineas de
     * un cuerpo de 12 pt son 18 pt = 6,35 mm entre renglones, no 5,5.
     */
    const tamanoPdf = branding.fontSizePt ?? 12;
    const saltoLinea = tamanoPdf * 0.3528 * Number(branding.lineSpacing ?? '1.5');
    const TINTA: [number, number, number] = [16, 24, 34];

    const nuevaPagina = (): void => {
      doc.addPage();
      currentY = pageMarginTop;
      if (opciones.conMembrete) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(102, 116, 135);
        doc.text(branding.firmName, pageMarginLeft, 15);
        doc.setDrawColor(16, 24, 34);
        doc.setLineWidth(0.5);
        doc.line(pageMarginLeft, 17.5, 215.9 - pageMarginRight, 17.5);
        doc.setLineWidth(0.2);
      }
    };

    const asegurarLinea = (y: number): number => {
      if (y > pageBottomLimit) {
        nuevaPagina();
        return currentY;
      }
      return y;
    };

    const lines = legalContentText.split('\n');

    for (const rawLine of lines) {
      const line = cleanMarkdownLine(rawLine);

      if (line.trim() === '') {
        currentY += 3;
        continue;
      }

      const isHeader = line.startsWith('SEÑOR JUEZ') || line.startsWith('REFERENCIA:') || line.startsWith('DEMANDANTE:') || line.startsWith('DEMANDADO:');
      const isSectionTitle = /^[IVX]+\.\s/.test(line) || /^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO)[\.:]/i.test(line);

      /* Un titulo de seccion respira antes de su bloque, como el 14a. */
      if (isSectionTitle) currentY += 2.5;

      const runs: PdfRun[] = parseMarkdownBold(line).map((seg) => ({
        text: seg.text,
        style: seg.bold || isHeader || isSectionTitle ? 'bold' : 'normal'
      }));

      currentY = asegurarLinea(currentY);

      /*
       * TODO PARRAFO DEL CUERPO VA JUSTIFICADO — es la forma de un escrito
       * judicial y la del artboard (`text-align:justify`). Encabezados y
       * titulos de seccion quedan a la izquierda, tambien como el artboard.
       */
      currentY = drawRuns(doc, runs, {
        x: pageMarginLeft,
        y: currentY,
        width: contentWidth,
        lineMm: saltoLinea,
        font: fuentePdf,
        sizePt: tamanoPdf,
        color: TINTA,
        justify: !isHeader && !isSectionTitle,
        ensure: asegurarLinea
      });

      /* Espacio entre parrafos (8 px del artboard ≈ 2,5 mm). */
      currentY += isSectionTitle ? 0.5 : 2.5;
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
      doc.setTextColor(16, 24, 34);
      doc.text('FUENTES CITADAS', pageMarginLeft, currentY);
      currentY += 8;

      doc.setFont(fuentePdf, 'normal');
      doc.setFontSize(9.5);
      for (const fuente of opciones.fuentes) {
        const envueltas = doc.splitTextToSize(`- ${fuente}`, contentWidth);
        for (const linea of envueltas) {
          if (currentY > pageBottomLimit) {
            doc.addPage();
            currentY = pageMarginTop;
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
      if (opciones.conMembrete && pieIzq) doc.text(pieIzq, pageMarginLeft, 267);
      doc.text(`Página ${pagina} de ${totalPaginas}`, 215.9 - pageMarginRight, 267, { align: 'right' });
    }

    doc.save(documentTitle.endsWith('.pdf') ? documentTitle : `${documentTitle}.pdf`);
  }
}
