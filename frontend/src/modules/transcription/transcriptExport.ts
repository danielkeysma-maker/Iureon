import { Document, Packer, Paragraph, TextRun, AlignmentType, Footer as DocxFooter, PageNumber } from 'docx';
import { saveAs } from 'file-saver';
import { registrarJakarta } from './actaFonts';
import { getMarcaActual } from '../tenant/services/branding.api';
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

/**
 * El acta en PDF, tal como el artboard 14b la dibuja.
 *
 * Membrete de la firma arriba (es un documento DE LA FIRMA), titulo que se
 * declara transcripcion, metadatos como tabla etiqueta:valor, la Advertencia
 * en caja con filete, INTERVINIENTES con su cuadro de color y el pie de
 * asignacion, y el DESARROLLO con nombre abreviado ("D. Madera (juez):") --
 * el minuto en mono al margen. Tipografia Plus Jakarta Sans embebida (OFL):
 * la del sistema de diseno, no la de un recibo.
 *
 * TODO SALE DE DATOS REALES O NO SALE: el proceso/radicado/despacho del
 * artboard no existen aun como columnas de la transcripcion y sus filas no se
 * pintan; los "tramos ininteligibles" solo si el texto los trae; el resultado
 * (entrevista) solo con decision registrada; el firmante solo con acta lista.
 */
export const exportTranscriptToPdf = (result: TranscriptionResult, titulo: string, acta?: ActaInfo): void => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  const F = registrarJakarta(doc);

  const margen = 20;
  const anchoPagina = 215.9;
  const ancho = anchoPagina - margen * 2;
  const alto = 279.4;
  let y = 16;

  const marca = getMarcaActual();

  const trozos = (texto: string, estilo: 'normal' | 'bold' | 'italic', tamano: number, w = ancho): string[] => {
    doc.setFont(F, estilo);
    doc.setFontSize(tamano);
    return doc.splitTextToSize(texto, w) as string[];
  };

  const asegurarEspacio = (necesario: number): void => {
    if (y + necesario > alto - 22) {
      doc.addPage();
      y = 18;
    }
  };

  // --- MEMBRETE -------------------------------------------------------------
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
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text((marca?.firmName || 'Documento de la firma').toUpperCase(), xTexto, y);
  doc.setFont(F, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  if (marca?.firmNit) doc.text(`NIT ${marca.firmNit}`, xTexto, y + 4);
  doc.setDrawColor(203, 213, 225);
  doc.line(margen, y + 8, anchoPagina - margen, y + 8);
  y += 17;

  // --- TITULO: se declara transcripcion -------------------------------------
  const tituloActa =
    result.kind === 'ENTREVISTA' ? 'ACTA DE ENTREVISTA INICIAL' : 'TRANSCRIPCIÓN DE AUDIENCIA';
  doc.setFont(F, 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text(tituloActa, anchoPagina / 2, y, { align: 'center' });
  y += 5.5;
  doc.setFont(F, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(titulo.replace(/^\d{10,}_/, '').replace(/\.[^.]+$/, ''), anchoPagina / 2, y, { align: 'center' });
  y += 9;

  // --- METADATOS: etiqueta : valor ------------------------------------------
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

  const X_VALOR = margen + 30;
  for (const [etiqueta, valor, mono] of filas) {
    doc.setFont(F, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(etiqueta, margen, y);
    doc.setFont(mono ? 'courier' : F, 'normal');
    doc.setFontSize(mono ? 8.5 : 9);
    doc.setTextColor(15, 23, 42);
    const cuerpoValor = doc.splitTextToSize(valor, ancho - 30) as string[];
    cuerpoValor.forEach((linea, i) => {
      doc.text(linea, X_VALOR, y + i * 4.4);
    });
    y += cuerpoValor.length * 4.4 + 1.2;
  }
  y += 3;

  // --- ADVERTENCIA: caja con filete, texto honesto con la fraccion ----------
  const f = fraccionRevisada(result.segments);
  const revision =
    f.total > 0 && f.n === f.total
      ? 'Transcripción automática revisada íntegramente por la firma.'
      : f.n > 0
      ? `Transcripción automática con ${f.n} de ${f.total} intervenciones revisadas por la firma.`
      : 'Transcripción automática aún sin revisión humana.';
  const advertencia =
    `Advertencia. ${revision} No sustituye el acta oficial del despacho ni la grabación original, que prevalecen. ` +
    'Los tramos que el audio no permitió establecer se indican como [ininteligible mm:ss].';

  const cuerpoAdv = trozos(advertencia, 'italic', 8, ancho - 10);
  const altoAdv = cuerpoAdv.length * 3.9 + 6;
  asegurarEspacio(altoAdv + 4);
  doc.setFillColor(248, 250, 252);
  doc.rect(margen, y - 3, ancho, altoAdv, 'F');
  doc.setFillColor(180, 142, 60);
  doc.rect(margen, y - 3, 1.2, altoAdv, 'F');
  doc.setTextColor(71, 85, 105);
  cuerpoAdv.forEach((linea, i) => doc.text(linea, margen + 5, y + 2 + i * 3.9));
  y += altoAdv + 5;

  // --- INTERVINIENTES -------------------------------------------------------
  const nombres = buildSpeakerNames(result.segments, ROLE_LABELS);
  doc.setFont(F, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('INTERVINIENTES', margen, y);
  y += 5.5;

  for (const label of result.speakerLabels) {
    const seg = result.segments.find((sg) => sg.speakerLabel === label);
    const nombre = nombres[label] ?? (seg ? ROLE_LABELS[seg.role] : label);
    const rol = seg && seg.speakerName && seg.role !== 'DESCONOCIDO' ? ROLE_LABELS[seg.role].toLowerCase() : '';
    asegurarEspacio(6);

    const color = colorForSpeaker(label, result.speakerLabels);
    doc.setFillColor(color.rgb[0], color.rgb[1], color.rgb[2]);
    doc.rect(margen + 1, y - 2.4, 2.6, 2.6, 'F');

    doc.setFont(F, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(nombre, margen + 6.5, y);
    if (rol) {
      const w = doc.getTextWidth(nombre);
      doc.setFont(F, 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(` — ${rol}`, margen + 6.5 + w, y);
    }
    y += 5;
  }

  doc.setFont(F, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  for (const linea of trozos(
    'Los nombres los asignó el revisor a las voces separadas por el sistema. En el desarrollo, cada intervención se identifica con el nombre y el rol abreviados.',
    'normal',
    7.5
  )) {
    doc.text(linea, margen, y);
    y += 3.6;
  }
  y += 4;

  // --- I. HECHOS RELEVANTES (si el resumen existe) --------------------------
  if (acta?.hechosClave && acta.hechosClave.length > 0) {
    asegurarEspacio(10);
    doc.setFont(F, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('I. HECHOS RELEVANTES MANIFESTADOS', margen, y);
    y += 6;
    for (const h of acta.hechosClave) {
      const cuerpoHecho = trozos(h.hecho, 'normal', 9, ancho - 16);
      asegurarEspacio(cuerpoHecho.length * 4.2 + 2);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(minutoDe(h.t), margen, y);
      doc.setFont(F, 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      cuerpoHecho.forEach((linea, i) => doc.text(linea, margen + 16, y + i * 4.2));
      y += cuerpoHecho.length * 4.2 + 2;
    }
    y += 3;
  }

  // --- DESARROLLO / II. TRANSCRIPCION ---------------------------------------
  asegurarEspacio(10);
  doc.setFont(F, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(
    acta?.hechosClave && acta.hechosClave.length > 0 ? 'II. TRANSCRIPCIÓN' : 'DESARROLLO',
    margen,
    y
  );
  y += 6.5;

  /*
   * "D. Madera (juez):" -- inicial del nombre + primer apellido, como el
   * artboard: la lista de intervinientes ya dio el nombre completo, y el
   * desarrollo se lee mejor sin repetirlo entero cincuenta veces.
   */
  const abreviar = (nombre: string): string => {
    const partes = nombre.trim().split(/\s+/);
    if (partes.length < 2) return nombre;
    return `${partes[0][0]}. ${partes[1]}`;
  };

  const SANGRIA = 16;
  const anchoTexto = ancho - SANGRIA;

  for (const linea of lineas(result)) {
    const quienAbrev = abreviar(linea.quien);
    const rolCorto = linea.rol ? ` (${linea.rol.toLowerCase()})` : '';
    const encabezadoLinea = `${quienAbrev}${rolCorto}: `;

    doc.setFont(F, 'bold');
    doc.setFontSize(9.5);
    const anchoEncabezado = doc.getTextWidth(encabezadoLinea);

    // El texto corre DESPUES del encabezado en la primera linea, como el 14b.
    doc.setFont(F, 'normal');
    const primeraDisponible = anchoTexto - anchoEncabezado;
    const palabras = linea.texto.split(' ');
    let primera = '';
    let resto = '';
    for (let i = 0; i < palabras.length; i++) {
      const intento = primera ? `${primera} ${palabras[i]}` : palabras[i];
      if (doc.getTextWidth(intento) <= primeraDisponible) primera = intento;
      else {
        resto = palabras.slice(i).join(' ');
        break;
      }
    }
    const cuerpoResto = resto ? (doc.splitTextToSize(resto, anchoTexto) as string[]) : [];
    asegurarEspacio(5 + cuerpoResto.length * 4.4);

    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    if (linea.minuto) doc.text(linea.minuto, margen, y);

    doc.setFont(F, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(encabezadoLinea, margen + SANGRIA, y);

    doc.setFont(F, 'normal');
    doc.setTextColor(30, 41, 59);
    if (primera) doc.text(primera, margen + SANGRIA + anchoEncabezado, y);
    y += 4.4;
    for (const trozo of cuerpoResto) {
      asegurarEspacio(5);
      doc.text(trozo, margen + SANGRIA, y);
      y += 4.4;
    }
    y += 2.6;
  }

  // --- TRAMOS ININTELIGIBLES: solo si el texto los trae ---------------------
  const marcas: string[] = [];
  for (const seg of result.segments) {
    const halladas = seg.text.match(/\[ininteligible[^\]]*\]/gi);
    if (halladas) marcas.push(...halladas);
  }
  if (marcas.length > 0) {
    const plural = marcas.length === 1 ? '' : 's';
    const resumenTramos = `${marcas.length} tramo${plural} ininteligible${plural}: ${marcas.slice(0, 8).join(' · ')}${marcas.length > 8 ? ' …' : ''}`;
    const cuerpoTramos = trozos(resumenTramos, 'normal', 8, ancho - 10);
    const altoTramos = cuerpoTramos.length * 3.9 + 6;
    asegurarEspacio(altoTramos + 4);
    doc.setFillColor(251, 243, 228);
    doc.rect(margen, y - 3, ancho, altoTramos, 'F');
    doc.setFillColor(207, 174, 110);
    doc.rect(margen, y - 3, 1.2, altoTramos, 'F');
    doc.setFont(F, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 90, 30);
    cuerpoTramos.forEach((linea, i) => doc.text(linea, margen + 5, y + 2 + i * 3.9));
    y += altoTramos + 5;
  }

  // --- III. RESULTADO (entrevista con decision registrada) ------------------
  if (result.kind === 'ENTREVISTA' && acta?.decision && acta.decision !== 'SIN_DECIDIR') {
    asegurarEspacio(14);
    doc.setFont(F, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('III. RESULTADO', margen, y);
    y += 5.5;
    const resultado =
      acta.decision === 'TOMADO'
        ? 'Se toma el caso.'
        : `Se declina el caso${acta.decisionMotivo ? `: ${acta.decisionMotivo}.` : '.'}`;
    doc.setFont(F, 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    for (const linea of trozos(resultado, 'normal', 9.5)) {
      doc.text(linea, margen, y);
      y += 4.4;
    }
    y += 3;
  }

  // --- FIRMANTE: solo cuando el acta esta lista -----------------------------
  if (acta?.actaLista && acta.revisadaPor) {
    asegurarEspacio(20);
    y += 8;
    doc.setDrawColor(148, 163, 184);
    doc.line(margen, y, margen + 62, y);
    y += 4;
    doc.setFont(F, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(acta.revisadaPor, margen, y);
    y += 4;
    doc.setFont(F, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Revisó la transcripción y marcó el acta como lista.', margen, y);
  }

  // --- PIE EN CADA PAGINA: fraccion real + paginacion real ------------------
  const totalPaginas = doc.getNumberOfPages();
  const pieIzquierda = `${f.n} de ${f.total} intervenciones revisadas${
    marca?.firmName ? ` · ${marca.firmName}` : ''
  }`;
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    doc.setPage(pagina);
    doc.setFont(F, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(pieIzquierda, margen, alto - 12);
    doc.text(`página ${pagina} de ${totalPaginas}`, anchoPagina - margen, alto - 12, { align: 'right' });
  }

  doc.save(nombreArchivo(titulo, 'pdf'));
};

