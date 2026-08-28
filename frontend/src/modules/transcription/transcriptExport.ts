import { Document, Packer, Paragraph, TextRun, AlignmentType, Footer as DocxFooter, PageNumber } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
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
           * The nearest a Word document gets to the avatar.
           *
           * docx draws no circles without dropping into raw drawing XML, which
           * is a lot of machinery for a decoration. A shaded run with the
           * initials in white reads as the same badge — same colour, same
           * letters, same job of telling two voices apart at a glance — and it
           * survives being pasted into somebody else's document, which a
           * floating shape does not.
           */
          new TextRun({
            text: ` ${linea.iniciales} `,
            bold: true,
            font: 'Calibri',
            size: 16,
            color: 'FFFFFF',
            shading: { fill: linea.color.hex }
          }),
          new TextRun({ text: '  ', font: 'Calibri', size: 22 }),
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

export const exportTranscriptToPdf = (result: TranscriptionResult, titulo: string, acta?: ActaInfo): void => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });

  const margenIzq = 20;
  const margenDer = 20;
  const margenSup = 22;
  const ancho = 215.9 - margenIzq - margenDer;
  const alto = 279.4;
  let y = margenSup;

  /**
   * Wraps text at the CURRENT font size, and that ordering is the whole point.
   *
   * `splitTextToSize` measures with whatever size is set when it is called, and
   * the first version called it before setting the body size — so the opening
   * intervention of every export was split at 8pt and drawn at 10pt, and ran
   * off the right edge of the page. Every transcript came out with its first
   * paragraph clipped, which is exactly the paragraph a reader starts with.
   *
   * Setting the font is now part of measuring, so the two cannot disagree.
   */
  const trozos = (texto: string, estilo: 'normal' | 'bold' | 'italic', tamano: number): string[] => {
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tamano);
    return doc.splitTextToSize(texto, ancho) as string[];
  };

  /** Starts a new page when the next block would fall off this one. */
  const asegurarEspacio = (necesario: number): void => {
    if (y + necesario > alto - 20) {
      doc.addPage();
      y = margenSup;
    }
  };

  // ─── ACTA (14b): título, metadatos, naturaleza, hechos ────────────────────
  /*
   * El documento se DECLARA como lo que es desde el título: ACTA DE ENTREVISTA
   * o ACTA DE AUDIENCIA, uso interno de la firma. Los metadatos son los que un
   * socio necesita al reabrirla: fecha y duración, quiénes hablan con su rol, y
   * la autorización con su hora real — o su ausencia, dicha igual.
   */
  doc.setTextColor(0, 0, 0);
  const tituloActa =
    result.kind === 'ENTREVISTA' ? 'ACTA DE ENTREVISTA' : 'ACTA DE AUDIENCIA';
  for (const trozo of trozos(tituloActa, 'bold', 14)) {
    doc.text(trozo, 215.9 / 2, y, { align: 'center' });
    y += 7;
  }
  doc.setTextColor(100, 116, 139);
  for (const trozo of trozos('Documento interno de la firma · no sustituye el registro oficial', 'normal', 8)) {
    doc.text(trozo, 215.9 / 2, y, { align: 'center' });
    y += 4;
  }
  y += 4;
  doc.setTextColor(0, 0, 0);

  // Metadatos como pares etiqueta—valor, alineados a la izquierda.
  const nombres = buildSpeakerNames(result.segments, ROLE_LABELS);
  const intervinientes = result.speakerLabels
    .map((label) => {
      const seg = result.segments.find((sg) => sg.speakerLabel === label);
      const nombre = nombres[label] ?? (seg ? ROLE_LABELS[seg.role] : label);
      const rol = seg && seg.speakerName && seg.role !== 'DESCONOCIDO' ? ` — ${ROLE_LABELS[seg.role].toLowerCase()}` : '';
      return `${nombre}${rol}`;
    })
    .join(' · ');

  const dur = duracion(result.durationSeconds);
  const metadatos: Array<[string, string]> = [
    ['Grabación', titulo.replace(/^\d{10,}_/, '')],
    ['Fecha', `${fechaLarga(result.transcribedAt)}${dur ? ` · ${dur}` : ''}`],
    ['Intervinientes', intervinientes],
    [
      'Autorización de grabación',
      acta?.autorizadoEl
        ? `registrada el ${new Date(acta.autorizadoEl).toLocaleString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
        : 'sin registro en el sistema'
    ]
  ];

  for (const [etiqueta, valor] of metadatos) {
    const cuerpoMeta = trozos(`${etiqueta}: ${valor}`, 'normal', 9.5);
    asegurarEspacio(cuerpoMeta.length * 4.6 + 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`${etiqueta}:`, margenIzq, y);
    const anchoEtiqueta = doc.getTextWidth(`${etiqueta}: `);
    doc.setFont('helvetica', 'normal');
    const cuerpoValor = doc.splitTextToSize(valor, ancho - anchoEtiqueta) as string[];
    cuerpoValor.forEach((linea, i) => {
      doc.text(linea, margenIzq + (i === 0 ? anchoEtiqueta : 0), y);
      y += 4.6;
    });
  }

  // Naturaleza del documento — con la fracción de revisión CONTADA.
  y += 2;
  doc.setTextColor(100, 116, 139);
  for (const trozo of trozos(nota(result, acta), 'italic', 8)) {
    doc.text(trozo, margenIzq, y);
    y += 4;
  }
  y += 4;
  doc.setTextColor(0, 0, 0);

  /*
   * I. HECHOS RELEVANTES MANIFESTADOS — del resumen del motor, cada uno con su
   * minuto y su voz: el ancla es lo que permite comprobarlo contra la
   * grabación antes de usarlo. Si nunca se generó el resumen, la sección no
   * existe — el acta dice lo que hay.
   */
  if (acta?.hechosClave && acta.hechosClave.length > 0) {
    asegurarEspacio(10 + acta.hechosClave.length * 5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('I. HECHOS RELEVANTES MANIFESTADOS', margenIzq, y);
    y += 6;

    for (const h of acta.hechosClave) {
      const cuerpoHecho = trozos(`${minutoDe(h.t)}  ${h.hecho} — ${h.quien}`, 'normal', 9.5);
      asegurarEspacio(cuerpoHecho.length * 4.6 + 1);
      for (const linea of cuerpoHecho) {
        doc.text(linea, margenIzq, y);
        y += 4.6;
      }
      y += 1;
    }

    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(acta.hechosClave.length > 0 ? 'II. TRANSCRIPCIÓN' : 'TRANSCRIPCIÓN', margenIzq, y);
    y += 7;
  }

  // ─── Intervenciones ───────────────────────────────────────────────────────
  /*
   * The avatar the screen draws, drawn here too.
   *
   * A coloured bar in the margin was the first attempt and it did not read as
   * the same thing: on screen a voice is a circle with its initials, and the
   * document is where that identification matters most. jsPDF can draw the
   * circle, so there is no reason for the export to settle for a hint of it.
   *
   * The text indents past the avatar, exactly as the row does on screen, so the
   * paragraph never runs under the circle.
   */
  const RADIO = 3.2;
  const SANGRIA = 10;
  const anchoTexto = ancho - SANGRIA;

  /** Wraps within the indented column, at the size it will be drawn. */
  const trozosCuerpo = (texto: string): string[] => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    return doc.splitTextToSize(texto, anchoTexto) as string[];
  };

  for (const linea of lineas(result)) {
    const cuerpo = trozosCuerpo(linea.texto);
    asegurarEspacio(9 + cuerpo.length * 4.8);

    const [r, g, b] = linea.color.rgb;

    doc.setFillColor(r, g, b);
    doc.circle(margenIzq + RADIO, y - 1.1, RADIO, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(255, 255, 255);
    doc.text(linea.iniciales, margenIzq + RADIO, y + 0.2, { align: 'center' });

    const x = margenIzq + SANGRIA;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(linea.quien, x, y);
    const anchoNombre = doc.getTextWidth(linea.quien);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const sufijo = [linea.rol ? `(${linea.rol})` : '', linea.minuto ? `[${linea.minuto}]` : '']
      .filter(Boolean)
      .join('  ');
    if (sufijo) doc.text(sufijo, x + anchoNombre + 2, y);

    y += 5;
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    for (const trozo of cuerpo) {
      doc.text(trozo, x, y);
      y += 4.8;
    }

    y += 4;
  }

  const paginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= paginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${pagina} de ${paginas}`, 215.9 / 2, alto - 12, { align: 'center' });
  }

  if (acta?.actaLista && acta.revisadaPor) {
    asegurarEspacio(16);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(acta.revisadaPor, margenIzq, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Revisó la transcripción y marcó el acta como lista.', margenIzq, y);
  }

  doc.save(nombreArchivo(titulo, 'pdf'));
};
