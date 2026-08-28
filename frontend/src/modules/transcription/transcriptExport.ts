import { Document, Packer, Paragraph, TextRun, AlignmentType, Footer as DocxFooter, PageNumber } from 'docx';
import { saveAs } from 'file-saver';
import { registrarJakarta } from './actaFonts';
import { getMarcaActual } from '../tenant/services/branding.api';
import { jsPDF } from 'jspdf';
import { drawRuns, measureRuns, type PdfRun, type RGB } from '../documents/services/pdfTextLayout';
import { buildSpeakerNames, initials } from './speakerNames';
import { colorForSpeaker, type SpeakerColor } from './speakerColors';
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
  // El documento se declara ACTA desde el titulo (14b): es lo que la firma
  // archiva, y "transcripcion" ya lo dice la nota de naturaleza.
  AUDIENCIA: 'Acta de audiencia',
  ENTREVISTA: 'Acta de entrevista'
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
  /** The same colour the avatar carries on screen. */
  color: SpeakerColor;
  /** What goes inside the circle. */
  iniciales: string;
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
      texto: segment.text,
      color: colorForSpeaker(segment.speakerLabel, result.speakerLabels),
      iniciales: initials(nombre)
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
 * Lo que convierte una transcripcion exportada en un ACTA (14b): metadatos
 * reales de la fila guardada. Todo opcional — un transcrito recien creado no
 * tiene revision todavia, y el acta dice lo que hay, no lo que quisiera haber.
 */
export interface ActaInfo {
  /** Hora REAL en que se autorizo la grabacion (transcriptions.autorizo_grabacion_el). */
  autorizadoEl?: string | null;
  /** Quien marco el acta lista, si alguien lo hizo. */
  revisadaPor?: string | null;
  actaLista?: boolean;
  /** Los hechos relevantes del resumen del motor, cada uno con su minuto. */
  hechosClave?: Array<{ t: number | null; quien: string; hecho: string }>;
  /** La decision de la entrevista, para el III. RESULTADO. */
  decision?: 'SIN_DECIDIR' | 'TOMADO' | 'DECLINADO';
  decisionMotivo?: string | null;
}

const fraccionRevisada = (segments: TranscriptionResult['segments']): { n: number; total: number } => ({
  n: segments.filter((seg) => seg.revisada).length,
  total: segments.length
});

const minutoDe = (t: number | null): string => {
  if (t === null) return '--:--';
  const m = Math.floor(t / 60);
  const sec = Math.floor(t % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

/**
 * The provenance note.
 *
 * Says plainly that a machine produced this and a person reviewed it. A
 * transcript quoted in a filing without that sentence invites being read as a
 * certified record, which it is not — the official one is the court's own.
 */
const nota = (result: TranscriptionResult, acta?: ActaInfo): string => {
  const f = fraccionRevisada(result.segments);
  /*
   * LA NATURALEZA DEL DOCUMENTO, con la fraccion contada y no supuesta:
   * "revisada por el profesional" solo se afirma cuando la revision existe.
   */
  const revision =
    f.total > 0 && f.n === f.total
      ? `Las ${f.total} intervenciones fueron revisadas por un profesional de la firma.`
      : f.n > 0
      ? `${f.n} de ${f.total} intervenciones han sido revisadas; el resto es transcripción automática sin leer.`
      : 'Ninguna intervención ha sido revisada todavía: es transcripción automática sin leer.';

  const autorizacion = acta?.autorizadoEl
    ? ` Grabación autorizada el ${new Date(acta.autorizadoEl).toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`
    : '';

  return (
    `Naturaleza de este documento: transcripción automática de una grabación. ${revision}` +
    `${autorizacion} No sustituye el registro oficial de la diligencia.`
  );
};

export const exportTranscriptToWord = async (
  result: TranscriptionResult,
  titulo: string,
  acta?: ActaInfo
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
      children: [new TextRun({ text: nota(result, acta), font: 'Calibri', size: 16, italics: true, color: '64748B' })]
    })
  );

  /*
   * I. HECHOS RELEVANTES, del resumen del motor y CON SU MINUTO: es lo que un
   * socio lee primero, y el ancla es lo que permite comprobar cada hecho
   * contra la grabacion antes de usarlo.
   */
  if (acta?.hechosClave && acta.hechosClave.length > 0) {
    cuerpo.push(
      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: 'I. HECHOS RELEVANTES MANIFESTADOS', bold: true, font: 'Calibri', size: 22 })]
      }),
      ...acta.hechosClave.map(
        (h) =>
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({ text: `${minutoDe(h.t)}  `, font: 'Consolas', size: 18, color: '64748B' }),
              new TextRun({ text: h.hecho, font: 'Calibri', size: 20 }),
              new TextRun({ text: `  — ${h.quien}`, font: 'Calibri', size: 18, italics: true, color: '64748B' })
            ]
          })
      ),
      new Paragraph({
        spacing: { before: 120, after: 160 },
        children: [new TextRun({ text: 'II. TRANSCRIPCIÓN', bold: true, font: 'Calibri', size: 22 })]
      })
    );
  }

  for (const linea of lineas(result)) {
    cuerpo.push(
      new Paragraph({
        spacing: { before: 160, after: 40 },
        children: [
          /*
           * Formato 14b: «10:58 C. Restrepo (juez):» — el minuto primero y en
           * gris, sin placa de iniciales. La placa era interfaz de pantalla;
           * en el acta que la firma archiva leia como chat, y era lo que hacia
           * decir "sigue igual" aunque la cabecera ya fuera acta.
           */
          ...(linea.minuto
            ? [new TextRun({ text: `${linea.minuto}  `, font: 'Consolas', size: 16, color: '94A3B8' })]
            : []),
          new TextRun({ text: linea.quien, bold: true, font: 'Calibri', size: 22 }),
          ...(linea.rol
            ? [new TextRun({ text: ` (${linea.rol})`, font: 'Calibri', size: 20, color: '475569' })]
            : []),
          new TextRun({ text: ':', bold: true, font: 'Calibri', size: 22 })
        ]
      })
    );

    /*
     * El texto del turno JUSTIFICADO y a 1,5 lineas, como el cuerpo del 14b:
     * el acta es un documento que se archiva y se anexa, no una lista de chat.
     */
    cuerpo.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 80, line: 360 },
        children: [new TextRun({ text: linea.texto, font: 'Calibri', size: 22 })]
      })
    );
  }

  /*
   * QUIEN REVISO, al pie y solo si es verdad: el acta lista la dio una persona
   * con nombre, y ese nombre es lo que la vuelve citable dentro de la firma.
   */
  if (acta?.actaLista && acta.revisadaPor) {
    cuerpo.push(
      new Paragraph({
        spacing: { before: 320, after: 40 },
        children: [new TextRun({ text: acta.revisadaPor, bold: true, font: 'Calibri', size: 20 })]
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Revisó la transcripción y marcó el acta como lista.', font: 'Calibri', size: 16, color: '64748B' })]
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

/**
 * El acta en PDF, tal como el artboard 14b la dibuja.
 *
 * Membrete de la firma arriba (es un documento DE LA FIRMA) con filete OSCURO,
 * titulo que se declara transcripcion, metadatos como tabla etiqueta:valor, la
 * caja de naturaleza/advertencia con barra ambar, INTERVINIENTES con su cuadro
 * de color, el DESARROLLO con nombre abreviado ("D. Madera (juez):") — minuto
 * en mono al margen, cuerpo JUSTIFICADO con interlineado 1,75 del artboard y
 * la marca [ininteligible mm:ss] resaltada en linea — y la caja final de
 * tramos ininteligibles. Tipografia Plus Jakarta Sans embebida (OFL).
 *
 * TODO SALE DE DATOS REALES O NO SALE: el proceso/radicado/despacho del
 * artboard no existen aun como columnas de la transcripcion y sus filas no se
 * pintan; los "tramos ininteligibles" solo si el texto los trae; el resultado
 * (entrevista) solo con decision registrada; el firmante solo con acta lista.
 * El porcentaje de audio ininteligible del artboard NO se imprime: exigiria la
 * duracion de cada tramo, que el transcrito no tiene — un numero inventado con
 * cara de medida es exactamente lo que este producto no hace.
 */
export const exportTranscriptToPdf = (result: TranscriptionResult, titulo: string, acta?: ActaInfo): void => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  const F = registrarJakarta(doc);

  const margen = 20;
  const anchoPagina = 215.9;
  const ancho = anchoPagina - margen * 2;
  const alto = 279.4;
  const LIMITE = alto - 24;
  let y = 16;

  const marca = getMarcaActual();

  /* ─── La paleta del 14b, en RGB del artboard ─────────────────────────── */
  const TINTA: RGB = [16, 24, 34]; // #101822
  const GRIS_ETIQUETA: RGB = [102, 116, 135]; // #667487
  const GRIS_MINUTO: RGB = [139, 150, 166]; // #8B96A6
  const TEXTO_CAJA: RGB = [43, 53, 66]; // #2B3542
  const AMBAR: RGB = [138, 90, 18]; // #8A5A12
  const AMBAR_FONDO: RGB = [251, 243, 228]; // #FBF3E4
  const CAJA_FONDO: RGB = [247, 248, 250]; // #F7F8FA
  const TRAMOS_BORDE: RGB = [228, 214, 180]; // #E4D6B4
  const TRAMOS_FONDO: RGB = [253, 250, 243]; // #FDFAF3
  const PIE_SEPARADOR: RGB = [195, 203, 214]; // #C3CBD6
  const FIRMA_DETALLE: RGB = [68, 80, 100]; // #445064

  /*
   * El interlineado del artboard: cuerpo 11 pt a 1,75 lineas = 6,8 mm entre
   * renglones. Era 4,4 mm — la mitad del aire que el diseno pide — y esa
   * estrechez es exactamente lo que hacia ver el acta como recibo.
   */
  const CUERPO_PT = 11;
  const AVANCE_CUERPO = 6.8;

  doc.setProperties({
    title: nombreArchivo(titulo, 'pdf'),
    author: marca?.firmName || undefined,
    creator: 'Iureon'
  });

  const saltoDePagina = (): number => {
    doc.addPage();
    return 18;
  };
  const enLinea = (yy: number): number => (yy > LIMITE ? saltoDePagina() : yy);
  const asegurar = (necesario: number): void => {
    if (y + necesario > LIMITE) y = saltoDePagina();
  };

  /* Las marcas [ininteligible mm:ss] del texto, como runs resaltados (14b). */
  const runsDeTexto = (texto: string): PdfRun[] => {
    const runs: PdfRun[] = [];
    const regex = /\[ininteligible[^\]]*\]/gi;
    let previo = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(texto)) !== null) {
      if (m.index > previo) runs.push({ text: texto.slice(previo, m.index) });
      runs.push({ text: m[0], font: 'courier', sizePt: 9.5, bg: AMBAR_FONDO, noBreak: true });
      previo = regex.lastIndex;
    }
    if (previo < texto.length) runs.push({ text: texto.slice(previo) });
    return runs;
  };

  // --- MEMBRETE: filete oscuro de 1,5 px como el artboard -------------------
  let xTexto = margen;
  if (marca?.logoUrl && /^data:image\/(png|jpe?g)/.test(marca.logoUrl)) {
    try {
      doc.addImage(marca.logoUrl, margen, y - 5, 22, 11, undefined, 'FAST');
      xTexto = margen + 26;
    } catch {
      /* Un logo ilegible jamas tumba el acta. */
    }
  }
  doc.setFont(F, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(TINTA[0], TINTA[1], TINTA[2]);
  doc.text((marca?.firmName || 'Documento de la firma').toUpperCase(), xTexto, y);
  doc.setFont(F, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(GRIS_ETIQUETA[0], GRIS_ETIQUETA[1], GRIS_ETIQUETA[2]);
  if (marca?.firmNit) doc.text(`NIT ${marca.firmNit}`, xTexto, y + 4);
  if (result.kind === 'ENTREVISTA') {
    // «Documento interno», a la derecha del membrete: es el acta de la firma.
    doc.text('Documento interno', anchoPagina - margen, y, { align: 'right' });
  }
  doc.setDrawColor(TINTA[0], TINTA[1], TINTA[2]);
  doc.setLineWidth(0.5);
  doc.line(margen, y + 8, anchoPagina - margen, y + 8);
  doc.setLineWidth(0.2);
  y += 17;

  // --- TITULO: se declara transcripcion (el archivo va en los metadatos) ----
  const tituloActa =
    result.kind === 'ENTREVISTA' ? 'ACTA DE ENTREVISTA INICIAL' : 'TRANSCRIPCIÓN DE AUDIENCIA';
  doc.setFont(F, 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(TINTA[0], TINTA[1], TINTA[2]);
  doc.text(tituloActa, anchoPagina / 2, y, { align: 'center' });
  y += 8;

  // --- METADATOS: etiqueta : valor, columna de 40 mm como el artboard -------
  const dur = duracion(result.durationSeconds);
  const filas: Array<[string, string, boolean?]> = [
    ['Fecha:', `${fechaLarga(result.transcribedAt)}${dur ? ` · duración ${dur}` : ''}`],
    ['Grabación:', titulo.replace(/^\d{10,}_/, ''), true]
  ];
  if (acta?.autorizadoEl) {
    filas.push([
      'Autorización:',
      `grabación autorizada el ${new Date(acta.autorizadoEl).toLocaleString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
    ]);
  }

  const X_VALOR = margen + 40;
  for (const [etiqueta, valor, mono] of filas) {
    doc.setFont(F, 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(GRIS_ETIQUETA[0], GRIS_ETIQUETA[1], GRIS_ETIQUETA[2]);
    doc.text(etiqueta, margen, y);
    doc.setFont(mono ? 'courier' : F, 'normal');
    doc.setFontSize(mono ? 9.5 : 10.5);
    doc.setTextColor(TINTA[0], TINTA[1], TINTA[2]);
    const cuerpoValor = doc.splitTextToSize(valor, ancho - 40) as string[];
    cuerpoValor.forEach((linea, i) => {
      doc.text(linea, X_VALOR, y + i * 5.2);
    });
    y += cuerpoValor.length * 5.2 + 1.2;
  }
  y += 4;

  // --- NATURALEZA / ADVERTENCIA: la caja del 14b, con barra ambar -----------
  const f = fraccionRevisada(result.segments);
  const esEntrevista = result.kind === 'ENTREVISTA';

  /* La fraccion contada, nunca supuesta — la regla de siempre. */
  const revision =
    f.total > 0 && f.n === f.total
      ? ', revisada íntegramente por la firma'
      : f.n > 0
      ? `, con ${f.n} de ${f.total} intervenciones revisadas por la firma`
      : ', aún sin revisión humana';

  const marcaMono: PdfRun = {
    text: esEntrevista ? '[ininteligible]' : '[ininteligible mm:ss]',
    font: 'courier',
    sizePt: 9,
    noBreak: true
  };
  const runsCaja: PdfRun[] = esEntrevista
    ? [
        { text: 'Naturaleza de este documento.', style: 'bold' },
        { text: ` Es la transcripción automática de una grabación${revision}. Los fragmentos que el audio no permitió establecer con certeza se señalan como ` },
        marcaMono,
        { text: '. No constituye declaración rendida ante autoridad ni prueba anticipada.' }
      ]
    : [
        { text: 'Advertencia.', style: 'bold' },
        { text: ` Transcripción automática${revision}. No sustituye el acta oficial del despacho ni la grabación original, que prevalecen. Los tramos que el audio no permitió establecer se indican como ` },
        marcaMono,
        { text: '.' }
      ];

  const cajaOpts = {
    x: margen + 4.5,
    y: 0,
    width: ancho - 9,
    lineMm: 5.8,
    font: F,
    sizePt: 10,
    color: TEXTO_CAJA
  };
  const lineasCaja = measureRuns(doc, runsCaja, { ...cajaOpts, y });
  const altoCaja = lineasCaja * 5.8 + 4.5;
  asegurar(altoCaja + 4);
  doc.setFillColor(CAJA_FONDO[0], CAJA_FONDO[1], CAJA_FONDO[2]);
  doc.rect(margen, y - 4.5, ancho, altoCaja, 'F');
  doc.setFillColor(AMBAR[0], AMBAR[1], AMBAR[2]);
  doc.rect(margen, y - 4.5, 1.0, altoCaja, 'F');
  y = drawRuns(doc, runsCaja, { ...cajaOpts, y });
  y += 4;

  // --- INTERVINIENTES -------------------------------------------------------
  const nombres = buildSpeakerNames(result.segments, ROLE_LABELS);
  asegurar(12);
  doc.setFont(F, 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(TINTA[0], TINTA[1], TINTA[2]);
  doc.text('INTERVINIENTES', margen, y);
  y += 6;

  for (const label of result.speakerLabels) {
    const seg = result.segments.find((sg) => sg.speakerLabel === label);
    const nombre = nombres[label] ?? (seg ? ROLE_LABELS[seg.role] : label);
    const rol = seg && seg.speakerName && seg.role !== 'DESCONOCIDO' ? ROLE_LABELS[seg.role].toLowerCase() : '';

    const color = colorForSpeaker(label, result.speakerLabels);
    const runsFila: PdfRun[] = rol
      ? [{ text: nombre, style: 'bold' }, { text: ` — ${rol}`, color: TEXTO_CAJA }]
      : [{ text: nombre, style: 'bold' }];

    y = enLinea(y);
    y = drawRuns(doc, runsFila, {
      x: margen + 5.5,
      y,
      width: ancho - 5.5,
      lineMm: 6.3,
      font: F,
      sizePt: 11,
      color: TINTA,
      ensure: enLinea,
      onFirstLine: (yFila) => {
        doc.setFillColor(color.rgb[0], color.rgb[1], color.rgb[2]);
        doc.rect(margen + 0.8, yFila - 2.3, 2.7, 2.7, 'F');
      }
    });
  }

  y += 1;
  y = enLinea(y);
  y = drawRuns(
    doc,
    [{ text: 'Los nombres los asignó el revisor a las voces separadas por el sistema. En el desarrollo, cada intervención se identifica con el nombre y el rol abreviado.' }],
    { x: margen, y, width: ancho, lineMm: 5.2, font: F, sizePt: 9.5, color: GRIS_ETIQUETA, ensure: enLinea }
  );
  y += 4;

  // --- I. HECHOS RELEVANTES (si el resumen existe) --------------------------
  if (acta?.hechosClave && acta.hechosClave.length > 0) {
    asegurar(12);
    doc.setFont(F, 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(TINTA[0], TINTA[1], TINTA[2]);
    doc.text('I. HECHOS RELEVANTES MANIFESTADOS', margen, y);
    y += 6.5;
    for (const h of acta.hechosClave) {
      y = enLinea(y);
      y = drawRuns(doc, runsDeTexto(h.hecho), {
        x: margen + 14,
        y,
        width: ancho - 14,
        lineMm: AVANCE_CUERPO,
        font: F,
        sizePt: CUERPO_PT,
        color: TINTA,
        justify: true,
        ensure: enLinea,
        onFirstLine: (yHecho) => {
          doc.setFont('courier', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(GRIS_MINUTO[0], GRIS_MINUTO[1], GRIS_MINUTO[2]);
          doc.text(minutoDe(h.t), margen, yHecho);
        }
      });
      y += 0.5;
    }
    y += 4;
  }

  // --- DESARROLLO / II. TRANSCRIPCION ---------------------------------------
  asegurar(12);
  doc.setFont(F, 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(TINTA[0], TINTA[1], TINTA[2]);
  doc.text(
    acta?.hechosClave && acta.hechosClave.length > 0 ? 'II. TRANSCRIPCIÓN' : 'DESARROLLO',
    margen,
    y
  );
  y += 7;

  /*
   * "D. Madera (juez):" — inicial del nombre + primer apellido, como el
   * artboard: la lista de intervinientes ya dio el nombre completo, y el
   * desarrollo se lee mejor sin repetirlo entero cincuenta veces.
   */
  const abreviar = (nombre: string): string => {
    const partes = nombre.trim().split(/\s+/);
    if (partes.length < 2) return nombre;
    return `${partes[0][0]}. ${partes[1]}`;
  };

  const SANGRIA = 16;

  for (const linea of lineas(result)) {
    const quienAbrev = abreviar(linea.quien);
    const rolCorto = linea.rol ? ` (${linea.rol.toLowerCase()})` : '';
    const minuto = linea.minuto;

    /*
     * El turno entero como UN parrafo de runs: encabezado en negrita y el
     * texto corriendo detras, JUSTIFICADO y con el interlineado del artboard.
     * El minuto se pinta cuando la primera linea ya tiene pagina — antes se
     * pintaba antes del corte y podia quedar huerfano al pie.
     */
    const runsTurno: PdfRun[] = [
      { text: `${quienAbrev}${rolCorto}:`, style: 'bold' },
      { text: ' ' },
      ...runsDeTexto(linea.texto)
    ];

    y = enLinea(y);
    y = drawRuns(doc, runsTurno, {
      x: margen + SANGRIA,
      y,
      width: ancho - SANGRIA,
      lineMm: AVANCE_CUERPO,
      font: F,
      sizePt: CUERPO_PT,
      color: TINTA,
      justify: true,
      ensure: enLinea,
      onFirstLine: (yTurno) => {
        if (!minuto) return;
        doc.setFont('courier', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(GRIS_MINUTO[0], GRIS_MINUTO[1], GRIS_MINUTO[2]);
        doc.text(minuto, margen, yTurno);
      }
    });
    /* Separacion entre turnos: los 9 px del artboard ≈ 3 mm. */
    y += 3 - (AVANCE_CUERPO - CUERPO_PT * 0.3528);
  }

  // --- TRAMOS ININTELIGIBLES: caja con borde ambar, minutos contados --------
  const minutosMarcados: string[] = [];
  let marcasSinMinuto = 0;
  for (const seg of result.segments) {
    const halladas = seg.text.matchAll(/\[ininteligible(?:\s+(\d{1,3}:\d{2}))?\]/gi);
    for (const m of halladas) {
      if (m[1]) minutosMarcados.push(m[1]);
      else marcasSinMinuto += 1;
    }
  }
  const totalTramos = minutosMarcados.length + marcasSinMinuto;
  if (totalTramos > 0) {
    /*
     * El artboard suma «1 min 12 s (2,5% del audio)»; ese numero exige la
     * duracion de cada tramo y el transcrito no la tiene. Se listan minutos y
     * conteo — lo medible — y nada mas.
     */
    const partes: string[] = [];
    if (minutosMarcados.length > 0) partes.push(minutosMarcados.join(' · '));
    if (marcasSinMinuto > 0)
      partes.push(`${marcasSinMinuto} sin minuto marcado`);
    const cuerpoTramosRuns: PdfRun[] = [{ text: partes.join(' — ') }];

    const tramosOpts = {
      x: margen + 4.5,
      y: 0,
      width: ancho - 9,
      lineMm: 5.9,
      font: F,
      sizePt: 10,
      color: TEXTO_CAJA
    };
    const lineasTramos = measureRuns(doc, cuerpoTramosRuns, { ...tramosOpts, y });
    const altoTramos = lineasTramos * 5.9 + 10;
    y += 4;
    asegurar(altoTramos + 4);

    doc.setFillColor(TRAMOS_FONDO[0], TRAMOS_FONDO[1], TRAMOS_FONDO[2]);
    doc.setDrawColor(TRAMOS_BORDE[0], TRAMOS_BORDE[1], TRAMOS_BORDE[2]);
    doc.setLineWidth(0.3);
    doc.rect(margen, y - 4.5, ancho, altoTramos, 'FD');
    doc.setLineWidth(0.2);

    const plural = totalTramos === 1 ? '' : 'S';
    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(AMBAR[0], AMBAR[1], AMBAR[2]);
    doc.text(`${totalTramos} TRAMO${plural} ININTELIGIBLE${plural}`, margen + 4.5, y);
    y += 5.5;
    y = drawRuns(doc, cuerpoTramosRuns, { ...tramosOpts, y });
    y += 4;
  }

  // --- III. RESULTADO (entrevista con decision registrada) ------------------
  if (result.kind === 'ENTREVISTA' && acta?.decision && acta.decision !== 'SIN_DECIDIR') {
    asegurar(16);
    y += 2;
    doc.setFont(F, 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(TINTA[0], TINTA[1], TINTA[2]);
    doc.text('III. RESULTADO', margen, y);
    y += 6.5;
    const resultado =
      acta.decision === 'TOMADO'
        ? 'Se toma el caso.'
        : `Se declina el caso${acta.decisionMotivo ? `: ${acta.decisionMotivo}.` : '.'}`;
    y = drawRuns(doc, [{ text: resultado }], {
      x: margen,
      y,
      width: ancho,
      lineMm: AVANCE_CUERPO,
      font: F,
      sizePt: CUERPO_PT,
      color: TINTA,
      justify: true,
      ensure: enLinea
    });
    y += 2;
  }

  // --- FIRMANTE: solo cuando el acta esta lista -----------------------------
  if (acta?.actaLista && acta.revisadaPor) {
    asegurar(24);
    y += 9;
    /* La linea de firma del 14b: oscura y de 77 mm, no un hilo gris corto. */
    doc.setDrawColor(TINTA[0], TINTA[1], TINTA[2]);
    doc.setLineWidth(0.35);
    doc.line(margen, y, margen + 77, y);
    doc.setLineWidth(0.2);
    y += 4.5;
    doc.setFont(F, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(TINTA[0], TINTA[1], TINTA[2]);
    doc.text(acta.revisadaPor, margen, y);
    y += 4.5;
    doc.setFont(F, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(FIRMA_DETALLE[0], FIRMA_DETALLE[1], FIRMA_DETALLE[2]);
    doc.text('Revisó la transcripción y marcó el acta como lista.', margen, y);
  }

  // --- PIE EN CADA PAGINA: separador + fraccion real + paginacion real ------
  const totalPaginas = doc.getNumberOfPages();
  const audioMmSs = formatTimestamp(result.durationSeconds);
  const partesPie: string[] = [
    f.total > 0 && f.n === f.total
      ? `Transcripción revisada íntegramente (${f.n}/${f.total} intervenciones)`
      : `${f.n} de ${f.total} intervenciones revisadas`
  ];
  const hayNombres = result.segments.some((seg) => seg.speakerName);
  if (hayNombres) partesPie.push('voces nombradas por el revisor');
  if (audioMmSs) partesPie.push(`audio ${audioMmSs}`);

  /*
   * El pie no puede montarse sobre «página N de M»: se mide con la fuente
   * real y se sueltan partes opcionales (de atras hacia adelante) hasta que
   * quepa. La fraccion de revision — la que importa — nunca se suelta.
   */
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  const anchoPaginacion = doc.getTextWidth(`página ${totalPaginas} de ${totalPaginas}`);
  while (partesPie.length > 1 && doc.getTextWidth(partesPie.join(' · ')) > ancho - anchoPaginacion - 6) {
    partesPie.pop();
  }
  const pieIzquierda = partesPie.join(' · ');

  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setDrawColor(PIE_SEPARADOR[0], PIE_SEPARADOR[1], PIE_SEPARADOR[2]);
    doc.setLineWidth(0.2);
    doc.line(margen, alto - 16, anchoPagina - margen, alto - 16);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(GRIS_MINUTO[0], GRIS_MINUTO[1], GRIS_MINUTO[2]);
    doc.text(pieIzquierda, margen, alto - 11.5);
    doc.text(`página ${pagina} de ${totalPaginas}`, anchoPagina - margen, alto - 11.5, { align: 'right' });
  }

  doc.save(nombreArchivo(titulo, 'pdf'));
};

