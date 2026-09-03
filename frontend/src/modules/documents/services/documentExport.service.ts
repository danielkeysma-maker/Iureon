import { Document, Packer, Paragraph, TextRun, AlignmentType, Header as DocxHeader, Footer as DocxFooter, PageNumber } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { drawRuns } from './pdfTextLayout';
import { registrarFuenteDelEscrito } from './pdfFonts';
import { lineasDeMembrete } from './membrete';

export interface FirmBrandingConfig {
  firmName: string;
  firmNit: string;
  firmAddress: string;
  firmPhone: string;
  firmEmail: string;
  fontFamily: 'Times New Roman' | 'Arial' | 'Calibri' | 'Tahoma' | 'Inter' | 'Plus Jakarta Sans' | 'Manrope' | 'Public Sans' | 'Satoshi';
  primaryColorHex: string;
  logoUrl?: string;
  /** Tamaño del escrito en puntos. Lo fija la marca de la firma; 12 por defecto. */
  fontSizePt?: number;
  /** Interlineado del escrito: '1.0' | '1.5' | '2.0'. */
  lineSpacing?: '1.0' | '1.5' | '2.0';
  customFormatInstruction?: string; // Ej: Orden exacto de secciones (Hechos primero, Pretensiones al final)
  customSampleTemplate?: string;   // Modelo o minuta de referencia de la firma
}

/*
 * SIN RELLENO. Traía «REPÚBLICA DE COLOMBIA - RAMA JUDICIAL», «SIN NIT FISCAL
 * REGISTRADO», «Dirección Corporativa» y «notificaciones@tufirma.co», y todo
 * eso se IMPRIMÍA en el escrito de cualquier firma que no hubiera llenado
 * Membrete: la tutela de un litigante salía con la cabecera de un juzgado en
 * el pie. Lo que no está configurado no se imprime (ver membrete.ts).
 */
export const DEFAULT_FIRM_BRANDING: FirmBrandingConfig = {
  firmName: '',
  firmNit: '',
  firmAddress: '',
  firmPhone: '',
  firmEmail: '',
  fontFamily: 'Times New Roman',
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
      const membrete = lineasDeMembrete(branding);
      const tamanoBase = (branding.fontSizePt ?? 12) * 2;
      const lineaDocx = Math.round(240 * Number(branding.lineSpacing ?? '1.5'));

      const children = segments.map((seg) => new TextRun({
        text: seg.text,
        // Word recibe el NOMBRE: si el lector no tiene la letra instalada, Word la
        // sustituye. Las cuatro clasicas siempre estan; las libres, solo si se instalan.
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
          headers: opciones.conMembrete && membrete.encabezado
            ? {
                default: new DocxHeader({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({
                      text: membrete.encabezado,
                      bold: true,
                      size: 18,
                      font: 'Calibri',
                      color: '475569'
                    }),
                    ...(branding.firmNit
                      ? [
                          new TextRun({
                            text: ` | NIT ${branding.firmNit}`,
                            size: 16,
                            font: 'Calibri',
                            color: '64748B'
                          })
                        ]
                      : [])
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
                    ...(opciones.conMembrete && membrete.pieContacto
                      ? [
                          new TextRun({
                            text: `${membrete.pieContacto} · `,
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
   * El escrito en PDF, calcado del papel que dibujó el artboard 14a.
   *
   * LO QUE EL ARTBOARD FIJA, medido sobre su propio HTML y no supuesto: papel
   * de 640 px con 62 px de aire a cada lado, que sobre carta con márgenes de
   * 3/2,5 cm da la escala de 0,884 pt por píxel usada abajo. Cuerpo de 12,5 px
   * a 1,9 de interlínea, JUSTIFICADO; destinatario CENTRADO en negrita con
   * «E. S. D.» en renglón propio y peso normal; referencia como rejilla de
   * etiqueta y valor —«Referencia:», no «REFERENCIA:»— con la columna de 104
   * px; títulos de sección en negrita MÁS PEQUEÑA que el cuerpo (12 contra
   * 12,5) y con letter-spacing; filete oscuro bajo el membrete y filete claro
   * sobre el pie.
   *
   * Y la letra es Plus Jakarta Sans, la misma del acta y la del sistema de
   * diseño. La placa del artboard dice «Times 12 pt» pero su papel está
   * dibujado en Jakarta, y el papel es el que manda: era la diferencia que
   * hacía irreconocible el escrito exportado.
   *
   * SIN MARCA DE IUREON, por decisión del 14a: un juzgado recibe un documento
   * de la firma. La trazabilidad viaja en las propiedades del archivo.
   */
  public static async exportToPdf(
    documentTitle: string,
    legalContentText: string,
    branding: FirmBrandingConfig = DEFAULT_FIRM_BRANDING,
    opciones: OpcionesDeExportacion = OPCIONES_POR_DEFECTO
  ): Promise<void> {
    const membrete = lineasDeMembrete(branding);
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
    /*
     * LA LETRA DE LA FIRMA, no siempre Jakarta. El Word obedecia a Membrete y el
     * PDF no, y el mismo escrito se veia distinto segun el boton. Las libres se
     * incrustan; las propietarias van con su equivalente estandar (pdfFonts.ts).
     */
    const F = await registrarFuenteDelEscrito(doc, branding.fontFamily);

    /* ─── Geometría: carta con los márgenes que declara el artboard ──────── */
    const ANCHO_PAGINA = 215.9;
    const ALTO_PAGINA = 279.4;
    const IZQ = 30; // 3 cm — el margen de encuadernación judicial
    const DER = 25; // 2,5 cm
    const SUP = 25;
    const ANCHO = ANCHO_PAGINA - IZQ - DER;
    const Y_PIE = ALTO_PAGINA - 18;
    const LIMITE = Y_PIE - 9;

    /*
     * La escala del artboard a puntos, y el tamaño de la marca de la firma
     * como factor: una firma que pide 14 pt agranda todo el papel en la misma
     * proporción, sin romper las relaciones que el diseño fijó.
     */
    const PX = 0.884;
    const factor = (branding.fontSizePt ?? 12) / 12;
    const pt = (px: number): number => px * PX * factor;
    const mm = (px: number): number => px * 0.3118 * factor;

    /*
     * El interlineado del artboard es 1,9 de CSS, que es exactamente lo que
     * Word llama «1,5 líneas» — su línea sencilla ya vale ~1,2. Traducir la
     * elección de la firma en vez de aplicarla cruda es lo que hace que el
     * papel exportado y el dibujado coincidan.
     */
    const INTERLINEA_CSS: Record<string, number> = { '1.0': 1.25, '1.5': 1.9, '2.0': 2.5 };
    const interlinea = INTERLINEA_CSS[branding.lineSpacing ?? '1.5'] ?? 1.9;

    const PT_CUERPO = pt(12.5);
    const LINEA_CUERPO = PT_CUERPO * interlinea * 0.3528;

    /* La paleta del artboard, en RGB. */
    const TINTA: [number, number, number] = [16, 24, 34]; // #101822
    const GRIS: [number, number, number] = [102, 116, 135]; // #667487
    const GRIS_PIE: [number, number, number] = [139, 150, 166]; // #8B96A6
    const LINEA_PIE: [number, number, number] = [195, 203, 214]; // #C3CBD6

    doc.setProperties({
      title: documentTitle.replace(/\.pdf$/i, ''),
      author: branding.firmName || undefined,
      creator: 'Iureon'
    });

    let y = SUP;
    const enLinea = (yy: number): number => {
      if (yy > LIMITE) {
        doc.addPage();
        return SUP;
      }
      return yy;
    };
    const asegurar = (necesario: number): void => {
      if (y + necesario > LIMITE) {
        doc.addPage();
        y = SUP;
      }
    };

    /* ─── MEMBRETE (solo la primera hoja, como una hoja membreteada) ─────── */
    if (opciones.conMembrete) {
      let xTexto = IZQ;
      if (branding.logoUrl && /^data:image\/(png|jpe?g)/.test(branding.logoUrl)) {
        try {
          doc.addImage(branding.logoUrl, IZQ, y - 4, mm(70), mm(40), undefined, 'FAST');
          xTexto = IZQ + mm(84);
        } catch {
          /* Un logo ilegible jamás tumba el escrito. */
        }
      }

      if (membrete.encabezado) {
        doc.setFont(F, 'bold');
        doc.setFontSize(pt(11.5));
        doc.setTextColor(...TINTA);
        doc.setCharSpace(pt(11.5) * 0.02);
        doc.text(membrete.encabezado, xTexto, y);
        doc.setCharSpace(0);
      }

      if (membrete.identificacion) {
        doc.setFont(F, 'normal');
        doc.setFontSize(pt(9.5));
        doc.setTextColor(...GRIS);
        doc.text(membrete.identificacion, xTexto, y + mm(15));
      }

      /*
       * La fecha del documento a la derecha, como el artboard. La ciudad que
       * él muestra encima NO se imprime: saldría de adivinar dentro de la
       * dirección, y una ciudad equivocada en un escrito que se radica es
       * peor que una ausencia.
       */
      doc.text(
        new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
        ANCHO_PAGINA - DER,
        y,
        { align: 'right' }
      );

      /* El filete del membrete es OSCURO y de 1,5 px, no un hilo gris. */
      doc.setDrawColor(...TINTA);
      doc.setLineWidth(0.4);
      doc.line(IZQ, y + mm(28), ANCHO_PAGINA - DER, y + mm(28));
      doc.setLineWidth(0.2);
      y += mm(28) + mm(22);
    }

    /* ─── El texto, clasificado renglón por renglón ──────────────────────── */
    const ETIQUETA_REF =
      /^\s*(Referencia|Ref|Radicado|Radicación|Asunto|Proceso|Expediente|Demandante|Demandada|Demandado|Accionante|Accionada|Accionado|Convocante|Convocada|Convocado|Ejecutante|Ejecutado|Querellante|Querellado|Peticionario|Entidad|Tercero)\s*:\s*/i;

    /** «REFERENCIA:» del motor se pinta «Referencia:», como el artboard. */
    const capitalizar = (etiqueta: string): string =>
      etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1).toLowerCase();

    const X_VALOR_REF = IZQ + mm(104);

    for (const rawLine of legalContentText.split('\n')) {
      const line = cleanMarkdownLine(rawLine);
      if (line.trim() === '') {
        y += mm(8);
        continue;
      }

      /* ── Destinatario: centrado, negrita, con «E. S. D.» en renglón propio */
      if (/^(SEÑOR|SEÑORES|SENOR|HONORABLE|SEÑORA)/i.test(line)) {
        const conCierre = line.match(/^(.*?)[\s,·]*\b(E\.?\s*S\.?\s*[DM]\.?\s*)$/i);
        const cuerpo = (conCierre ? conCierre[1] : line).trim().replace(/[.\s]+$/, '');
        const cierre = conCierre ? conCierre[2].trim() : '';

        asegurar(mm(40));
        y = drawRuns(doc, [{ text: cuerpo, style: 'bold' }], {
          x: IZQ,
          y,
          width: ANCHO,
          lineMm: pt(11.5) * 1.5 * 0.3528,
          font: F,
          sizePt: pt(11.5),
          color: TINTA,
          align: 'center',
          ensure: enLinea
        });
        if (cierre) {
          /* El cierre va en peso NORMAL bajo el destinatario, como el 14a. */
          y = drawRuns(doc, [{ text: cierre.toUpperCase().replace(/\s+/g, ' ') }], {
            x: IZQ,
            y,
            width: ANCHO,
            lineMm: pt(11.5) * 1.5 * 0.3528,
            font: F,
            sizePt: pt(11.5),
            color: TINTA,
            align: 'center',
            ensure: enLinea
          });
        }
        y += mm(14);
        continue;
      }

      /* ── Referencia y partes: rejilla etiqueta / valor ─────────────────── */
      const ref = line.match(ETIQUETA_REF);
      if (ref) {
        const etiqueta = `${capitalizar(ref[1])}:`;
        const valor = line.slice(ref[0].length).trim();

        y = enLinea(y);
        doc.setFont(F, 'normal');
        doc.setFontSize(pt(12));
        doc.setTextColor(...TINTA);
        const yEtiqueta = y;
        y = drawRuns(doc, [{ text: valor }], {
          x: X_VALOR_REF,
          y,
          width: ANCHO_PAGINA - DER - X_VALOR_REF,
          lineMm: pt(12) * 1.7 * 0.3528,
          font: F,
          sizePt: pt(12),
          color: TINTA,
          ensure: enLinea
        });
        doc.setFont(F, 'normal');
        doc.setFontSize(pt(12));
        doc.setTextColor(...TINTA);
        doc.text(etiqueta, IZQ, yEtiqueta);
        y += mm(3);
        continue;
      }

      /* ── Títulos de sección: negrita más pequeña, con letter-spacing ───── */
      const esTitulo =
        /^[IVXLC]+\.\s/.test(line) ||
        /^(PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO)[.:]/i.test(line);
      if (esTitulo) {
        y += mm(18);
        asegurar(mm(30));
        y = drawRuns(doc, [{ text: line, style: 'bold' }], {
          x: IZQ,
          y,
          width: ANCHO,
          lineMm: pt(12) * 1.4 * 0.3528,
          font: F,
          sizePt: pt(12),
          color: TINTA,
          ensure: enLinea
        });
        y += mm(4);
        continue;
      }

      /* ── Cuerpo: justificado, con las negritas del motor intactas ──────── */
      y = enLinea(y);
      y = drawRuns(
        doc,
        parseMarkdownBold(line).map((seg) => ({ text: seg.text, style: seg.bold ? 'bold' : 'normal' })),
        {
          x: IZQ,
          y,
          width: ANCHO,
          lineMm: LINEA_CUERPO,
          font: F,
          sizePt: PT_CUERPO,
          color: TINTA,
          align: 'justify',
          ensure: enLinea
        }
      );
      y += mm(6);
    }

    /*
     * ─── HOJA DE FUENTES CITADAS ──────────────────────────────────────────
     * Para que quien reciba el PDF pueda verificar cada cita sin la aplicación.
     */
    if (opciones.fuentes && opciones.fuentes.length > 0) {
      doc.addPage();
      y = SUP;

      y = drawRuns(doc, [{ text: 'FUENTES CITADAS', style: 'bold' }], {
        x: IZQ,
        y,
        width: ANCHO,
        lineMm: pt(12) * 1.4 * 0.3528,
        font: F,
        sizePt: pt(12),
        color: TINTA
      });
      y += mm(10);

      for (const fuente of opciones.fuentes) {
        y = enLinea(y);
        y = drawRuns(doc, [{ text: fuente }], {
          x: IZQ + mm(14),
          y,
          width: ANCHO - mm(14),
          lineMm: pt(11) * 1.7 * 0.3528,
          font: F,
          sizePt: pt(11),
          color: TINTA,
          ensure: enLinea,
          onFirstLine: (yFuente) => {
            doc.setFont(F, 'normal');
            doc.setFontSize(pt(11));
            doc.setTextColor(...GRIS);
            doc.text('·', IZQ + mm(4), yFuente);
          }
        });
        y += mm(6);
      }
    }

    /*
     * ─── PIE EN CADA HOJA: filete claro, firma·correo a la izquierda y la
     * paginación REAL a la derecha, como el artboard. Sin marca de Iureon.
     */
    const totalPaginas = doc.getNumberOfPages();
    const pieIzquierda = membrete.pieIzquierda;

    for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
      doc.setPage(pagina);
      doc.setDrawColor(...LINEA_PIE);
      doc.setLineWidth(0.15);
      doc.line(IZQ, Y_PIE - mm(9), ANCHO_PAGINA - DER, Y_PIE - mm(9));
      doc.setLineWidth(0.2);

      doc.setFont(F, 'normal');
      doc.setFontSize(pt(8.5));
      doc.setTextColor(...GRIS_PIE);
      if (opciones.conMembrete && pieIzquierda) doc.text(pieIzquierda, IZQ, Y_PIE);
      doc.text(`Página ${pagina} de ${totalPaginas}`, ANCHO_PAGINA - DER, Y_PIE, { align: 'right' });
    }

    doc.save(documentTitle.endsWith('.pdf') ? documentTitle : `${documentTitle}.pdf`);
  }
}
