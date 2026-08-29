import { Document, Packer, Paragraph, TextRun, AlignmentType, Footer as DocxFooter, PageNumber } from 'docx';
import { saveAs } from 'file-saver';
import { registrarJakarta } from '../documents/services/pdfFonts';
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
/**
 * Qué se lleva el acta. Artboard 1g: «desplegable para las variantes del acta
 * (con o sin marcas de tiempo, solo intervenciones marcadas como clave, o
 * transcripción completa)».
 *
 * ─── «SOLO LAS CLAVE» NO ES UN FILTRO DE COMODIDAD ──────────────────────────
 *
 * Es el acta que el abogado lleva a una reunión o anexa a un memorial: cuatro
 * intervenciones que deciden, no cincuenta y ocho. Existe porque ahora hay algo
 * que filtrar — la marca humana de `hechoClave`—, y por eso el desplegable la
 * ofrece DESHABILITADA mientras nadie haya marcado nada: un acta «solo clave»
 * de un transcrito sin marcas saldría vacía, y quien la abriera pensaría que se
 * perdió la audiencia.
 *
 * ─── SIN MARCAS DE TIEMPO ES PARA LEER, NO PARA CITAR ───────────────────────
 *
 * El minuto es lo que hace citable una intervención —«a partir del 14:02»— y
 * quitarlo produce un texto corrido más cómodo de leer y más difícil de
 * verificar. Se ofrece porque el artboard lo pide y porque hay usos donde
 * estorba, pero el valor por defecto los CONSERVA.
 */
export interface VarianteDeActa {
  /** `false` produce texto corrido, sin el minuto de cada intervención. */
  conMarcasDeTiempo?: boolean;
  /** `true` lleva solo lo que un humano marcó como decisivo. */
  soloClave?: boolean;
}

const lineas = (result: TranscriptionResult, variante?: VarianteDeActa): Linea[] => {
  const nombres = buildSpeakerNames(result.segments, ROLE_LABELS);

  /*
   * El filtro se aplica ANTES de numerar y colorear: si se hiciera después, los
   * colores de interlocutor saltarían y el acta parecería tener huecos.
   */
  const visibles = variante?.soloClave
    ? result.segments.filter((s) => s.hechoClave)
    : result.segments;

  return visibles.map((segment) => {
    const nombre = nombres[segment.speakerLabel] ?? ROLE_LABELS[segment.role];
    // The role only when a name was set: without one the heading already IS the
    // role, and "Juez (Juez)" says the same thing twice.
    const rol = segment.speakerName && segment.role !== 'DESCONOCIDO' ? ROLE_LABELS[segment.role] : '';

    return {
      quien: nombre,
      rol,
      minuto: variante?.conMarcasDeTiempo === false ? '' : formatTimestamp(segment.startSeconds),
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
  /**
   * El consultante de la entrevista, para la fila «Consultante:» y la segunda
   * linea de firma del 14b. Solo cuando hay cliente atado a la entrevista.
   */
  consultante?: { nombre: string; documento: string } | null;
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
  acta?: ActaInfo,
  variante?: VarianteDeActa
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

  for (const linea of lineas(result, variante)) {
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

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * EL ACTA EN PDF — dos papeles distintos, como el artboard 14b los dibuja
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * SON DOS DOCUMENTOS, NO UNO CON UN INTERRUPTOR. El artboard los dibuja lado a
 * lado y no comparten estructura:
 *
 *   Acta de ENTREVISTA — «Documento interno» en el membrete; un solo renglón
 *   de título; los intervinientes viven DENTRO de los metadatos, con su nombre
 *   en negrita y su papel al lado; caja de «Naturaleza de este documento»;
 *   secciones numeradas I. HECHOS / II. TRANSCRIPCIÓN / III. RESULTADO; y DOS
 *   líneas de firma — la del abogado que revisó y la del consultante, porque
 *   es el documento que se le entrega o se le lee.
 *
 *   Acta de AUDIENCIA — sin «Documento interno»; caja de «Advertencia»; una
 *   sección INTERVINIENTES propia, cada voz con el cuadro de color que la
 *   identifica en pantalla, y la nota de que los nombres los puso el revisor;
 *   el cuerpo se llama DESARROLLO; caja de tramos ininteligibles al cierre; y
 *   UNA línea de firma, la de quien revisó.
 *
 * TODO SALE DE DATOS REALES O NO SALE. El artboard muestra proceso, radicado,
 * despacho, lugar y el porcentaje de audio ininteligible: ninguno existe como
 * dato de la transcripción, así que sus filas no se pintan en vez de salir
 * inventadas. El subtítulo con el tipo de audiencia tampoco.
 */

/** La geometría y la paleta del papel del 14b, compartidas por las dos actas. */
const ANCHO_PAGINA = 215.9;
const ALTO_PAGINA = 279.4;
const MARGEN = 20;
const ANCHO = ANCHO_PAGINA - MARGEN * 2;
const Y_PIE = ALTO_PAGINA - 14;
const LIMITE = Y_PIE - 10;

const TINTA: RGB = [16, 24, 34]; // #101822
const GRIS: RGB = [102, 116, 135]; // #667487
const GRIS_TENUE: RGB = [139, 150, 166]; // #8B96A6
const TEXTO_CAJA: RGB = [43, 53, 66]; // #2B3542
const AMBAR: RGB = [138, 90, 18]; // #8A5A12
const AMBAR_FONDO: RGB = [251, 243, 228]; // #FBF3E4
const CAJA_FONDO: RGB = [247, 248, 250]; // #F7F8FA
const TRAMOS_BORDE: RGB = [228, 214, 180]; // #E4D6B4
const TRAMOS_FONDO: RGB = [253, 250, 243]; // #FDFAF3
const FILETE_PIE: RGB = [195, 203, 214]; // #C3CBD6
const FIRMA_DETALLE: RGB = [68, 80, 100]; // #445064

/* El cuerpo del artboard: 11,5 px a 1,75 de interlínea sobre papel de 640 px. */
const CUERPO_PT = 10.5;
const LINEA_CUERPO = CUERPO_PT * 1.75 * 0.3528;

/** El andamio común: la página, sus cortes y el avance vertical. */
interface Lienzo {
  doc: jsPDF;
  F: string;
  y: number;
  enLinea: (y: number) => number;
  asegurar: (necesario: number) => void;
}

const nuevoLienzo = (titulo: string, nombreFirma?: string): Lienzo => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  const F = registrarJakarta(doc);

  doc.setProperties({ title: titulo, author: nombreFirma || undefined, creator: 'Iureon' });

  const lienzo: Lienzo = {
    doc,
    F,
    y: 16,
    enLinea: (y: number) => {
      if (y > LIMITE) {
        doc.addPage();
        lienzo.y = 18;
        return 18;
      }
      return y;
    },
    asegurar: (necesario: number) => {
      if (lienzo.y + necesario > LIMITE) {
        doc.addPage();
        lienzo.y = 18;
      }
    }
  };

  return lienzo;
};

/** El membrete del acta: logo, razón social, NIT y filete oscuro de 1,5 px. */
const membrete = (L: Lienzo, marca: ReturnType<typeof getMarcaActual>, aviso?: string): void => {
  const { doc, F } = L;
  let xTexto = MARGEN;

  if (marca?.logoUrl && /^data:image\/(png|jpe?g)/.test(marca.logoUrl)) {
    try {
      doc.addImage(marca.logoUrl, MARGEN, L.y - 5, 20, 11, undefined, 'FAST');
      xTexto = MARGEN + 24;
    } catch {
      /* Un logo ilegible jamás tumba el acta. */
    }
  }

  doc.setFont(F, 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...TINTA);
  doc.text((marca?.firmName || 'Documento de la firma').toUpperCase(), xTexto, L.y);

  doc.setFont(F, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRIS);
  if (marca?.firmNit) doc.text(`NIT ${marca.firmNit}`, xTexto, L.y + 3.6);

  /* «Documento interno» al vuelo derecho: solo el acta de entrevista lo lleva. */
  if (aviso) doc.text(aviso, ANCHO_PAGINA - MARGEN, L.y, { align: 'right' });

  doc.setDrawColor(...TINTA);
  doc.setLineWidth(0.45);
  doc.line(MARGEN, L.y + 7.5, ANCHO_PAGINA - MARGEN, L.y + 7.5);
  doc.setLineWidth(0.2);
  L.y += 16;
};

/** El título centrado del acta. */
const tituloCentrado = (L: Lienzo, texto: string): void => {
  L.doc.setFont(L.F, 'bold');
  L.doc.setFontSize(11);
  L.doc.setTextColor(...TINTA);
  L.doc.text(texto, ANCHO_PAGINA / 2, L.y, { align: 'center' });
  L.y += 8;
};

/** Una fila de la rejilla de metadatos: etiqueta gris a la izquierda, valor. */
interface FilaMeta {
  etiqueta: string;
  valor?: string;
  /** Valor compuesto — los intervinientes de la entrevista van así. */
  runs?: PdfRun[];
  mono?: boolean;
}

const X_VALOR = MARGEN + 33;

const rejillaMetadatos = (L: Lienzo, filas: FilaMeta[]): void => {
  for (const fila of filas) {
    L.y = L.enLinea(L.y);
    const yEtiqueta = L.y;

    const runs: PdfRun[] = fila.runs ?? [
      { text: fila.valor ?? '', ...(fila.mono ? { font: 'courier', sizePt: 9 } : {}) }
    ];

    L.y = drawRuns(L.doc, runs, {
      x: X_VALOR,
      y: L.y,
      width: ANCHO_PAGINA - MARGEN - X_VALOR,
      lineMm: CUERPO_PT * 1.75 * 0.3528,
      font: L.F,
      sizePt: CUERPO_PT,
      color: TINTA,
      ensure: L.enLinea
    });

    L.doc.setFont(L.F, 'normal');
    L.doc.setFontSize(CUERPO_PT);
    L.doc.setTextColor(...GRIS);
    L.doc.text(fila.etiqueta, MARGEN, yEtiqueta);
    L.y += 0.8;
  }
  L.y += 3.5;
};

/**
 * La caja gris con barra ámbar: «Naturaleza de este documento» en la
 * entrevista, «Advertencia» en la audiencia.
 */
const cajaDeNaturaleza = (L: Lienzo, runs: PdfRun[]): void => {
  const opts = {
    x: MARGEN + 4.5,
    y: L.y,
    width: ANCHO - 9,
    lineMm: 5.4,
    font: L.F,
    sizePt: 9.5,
    color: TEXTO_CAJA
  };
  const alto = measureRuns(L.doc, runs, opts) * 5.4 + 4.5;
  L.asegurar(alto + 4);

  L.doc.setFillColor(...CAJA_FONDO);
  L.doc.rect(MARGEN, L.y - 4.2, ANCHO, alto, 'F');
  L.doc.setFillColor(...AMBAR);
  L.doc.rect(MARGEN, L.y - 4.2, 1.0, alto, 'F');

  L.y = drawRuns(L.doc, runs, { ...opts, y: L.y });
  L.y += 5;
};

/** Un encabezado de sección: negrita pequeña, como el 14b. */
const seccion = (L: Lienzo, texto: string): void => {
  L.asegurar(12);
  L.doc.setFont(L.F, 'bold');
  L.doc.setFontSize(9.5);
  L.doc.setTextColor(...TINTA);
  L.doc.text(texto, MARGEN, L.y);
  L.y += 6;
};

/** Las marcas [ininteligible mm:ss] del texto, resaltadas en línea. */
const runsDeTexto = (texto: string): PdfRun[] => {
  const runs: PdfRun[] = [];
  const regex = /\[ininteligible[^\]]*\]/gi;
  let previo = 0;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(texto)) !== null) {
    if (m.index > previo) runs.push({ text: texto.slice(previo, m.index) });
    runs.push({ text: m[0], font: 'courier', sizePt: 9, bg: AMBAR_FONDO, noBreak: true });
    previo = regex.lastIndex;
  }
  if (previo < texto.length) runs.push({ text: texto.slice(previo) });
  return runs;
};

/** «D. Madera» — inicial y primer apellido, como el desarrollo del artboard. */
const abreviar = (nombre: string): string => {
  const partes = nombre.trim().split(/\s+/);
  return partes.length < 2 ? nombre : `${partes[0][0]}. ${partes[1]}`;
};

/** Un turno: el minuto en mono al margen y el texto sangrado y justificado. */
const SANGRIA = 15;

const turno = (L: Lienzo, linea: Linea): void => {
  const rolCorto = linea.rol ? ` (${linea.rol.toLowerCase()})` : '';
  const runs: PdfRun[] = [
    { text: `${abreviar(linea.quien)}${rolCorto}:`, style: 'bold' },
    { text: ' ' },
    ...runsDeTexto(linea.texto)
  ];

  L.y = L.enLinea(L.y);
  L.y = drawRuns(L.doc, runs, {
    x: MARGEN + SANGRIA,
    y: L.y,
    width: ANCHO - SANGRIA,
    lineMm: LINEA_CUERPO,
    font: L.F,
    sizePt: CUERPO_PT,
    color: TINTA,
    align: 'justify',
    ensure: L.enLinea,
    onFirstLine: (yTurno) => {
      if (!linea.minuto) return;
      L.doc.setFont('courier', 'normal');
      L.doc.setFontSize(8);
      L.doc.setTextColor(...GRIS_TENUE);
      L.doc.text(linea.minuto, MARGEN, yTurno);
    }
  });
  L.y += 2.4;
};

/** Un hecho relevante: el mismo patrón de minuto al margen y texto sangrado. */
const hechoRelevante = (L: Lienzo, h: { t: number | null; hecho: string }): void => {
  L.y = L.enLinea(L.y);
  L.y = drawRuns(L.doc, runsDeTexto(h.hecho), {
    x: MARGEN + SANGRIA,
    y: L.y,
    width: ANCHO - SANGRIA,
    lineMm: LINEA_CUERPO,
    font: L.F,
    sizePt: CUERPO_PT,
    color: TINTA,
    align: 'justify',
    ensure: L.enLinea,
    onFirstLine: (yHecho) => {
      L.doc.setFont('courier', 'normal');
      L.doc.setFontSize(8);
      L.doc.setTextColor(...GRIS_TENUE);
      L.doc.text(minutoDe(h.t), MARGEN, yHecho);
    }
  });
  L.y += 1.6;
};

/** Una línea de firma: filete oscuro, nombre y su detalle debajo. */
const lineaDeFirma = (L: Lienzo, x: number, ancho: number, nombre: string, detalle: string): void => {
  L.doc.setDrawColor(...TINTA);
  L.doc.setLineWidth(0.3);
  L.doc.line(x, L.y, x + ancho, L.y);
  L.doc.setLineWidth(0.2);

  L.doc.setFont(L.F, 'bold');
  L.doc.setFontSize(9);
  L.doc.setTextColor(...TINTA);
  L.doc.text(nombre, x, L.y + 4);

  L.doc.setFont(L.F, 'normal');
  L.doc.setFontSize(8);
  L.doc.setTextColor(...FIRMA_DETALLE);
  L.doc.text(detalle, x, L.y + 8);
};

/**
 * El pie del artboard: filete claro y una línea en mono con lo que el acta
 * puede afirmar de sí misma. Se mide contra la paginación y suelta partes
 * opcionales antes que montarse encima de ella.
 */
const pieDeActa = (L: Lienzo, partes: string[]): void => {
  const { doc } = L;
  const total = doc.getNumberOfPages();

  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  const anchoPaginacion = doc.getTextWidth(`página ${total} de ${total}`);
  const restantes = [...partes];
  while (
    restantes.length > 1 &&
    doc.getTextWidth(restantes.join(' · ')) > ANCHO - anchoPaginacion - 6
  ) {
    restantes.pop();
  }
  const izquierda = restantes.join(' · ');

  for (let pagina = 1; pagina <= total; pagina += 1) {
    doc.setPage(pagina);
    doc.setDrawColor(...FILETE_PIE);
    doc.setLineWidth(0.15);
    doc.line(MARGEN, Y_PIE - 4.5, ANCHO_PAGINA - MARGEN, Y_PIE - 4.5);
    doc.setLineWidth(0.2);

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRIS_TENUE);
    doc.text(izquierda, MARGEN, Y_PIE);
    doc.text(`página ${pagina} de ${total}`, ANCHO_PAGINA - MARGEN, Y_PIE, { align: 'right' });
  }
};

/** La caja de cierre con los tramos que el audio no dejó establecer. */
const cajaDeTramos = (L: Lienzo, result: TranscriptionResult): void => {
  const minutos: string[] = [];
  let sinMinuto = 0;

  for (const seg of result.segments) {
    for (const m of seg.text.matchAll(/\[ininteligible(?:\s+(\d{1,3}:\d{2}))?\]/gi)) {
      if (m[1]) minutos.push(m[1]);
      else sinMinuto += 1;
    }
  }

  const total = minutos.length + sinMinuto;
  if (total === 0) return;

  /*
   * El artboard suma «1 min 12 s (2,5% del audio)». Ese número exige la
   * duración de cada tramo, que la transcripción no guarda: se listan los
   * minutos y el conteo — lo medible — y nada más.
   */
  const partes: string[] = [];
  if (minutos.length > 0) partes.push(minutos.join(' · '));
  if (sinMinuto > 0) partes.push(`${sinMinuto} sin minuto marcado`);
  const runs: PdfRun[] = [{ text: partes.join(' — ') }];

  const opts = {
    x: MARGEN + 4.5,
    y: L.y,
    width: ANCHO - 9,
    lineMm: 5.4,
    font: L.F,
    sizePt: 9.5,
    color: TEXTO_CAJA
  };
  const alto = measureRuns(L.doc, runs, opts) * 5.4 + 9.5;

  L.y += 4;
  L.asegurar(alto + 4);

  L.doc.setFillColor(...TRAMOS_FONDO);
  L.doc.setDrawColor(...TRAMOS_BORDE);
  L.doc.setLineWidth(0.3);
  L.doc.rect(MARGEN, L.y - 4.2, ANCHO, alto, 'FD');
  L.doc.setLineWidth(0.2);

  const plural = total === 1 ? '' : 'S';
  L.doc.setFont('courier', 'bold');
  L.doc.setFontSize(8);
  L.doc.setTextColor(...AMBAR);
  L.doc.text(`${total} TRAMO${plural} ININTELIGIBLE${plural}`, MARGEN + 4.5, L.y);
  L.y += 5;
  L.y = drawRuns(L.doc, runs, { ...opts, y: L.y });
  L.y += 4;
};

/** La revisión contada, nunca supuesta — para la caja de naturaleza. */
const fraseDeRevision = (f: { n: number; total: number }): string =>
  f.total > 0 && f.n === f.total
    ? ', revisada íntegramente por la firma'
    : f.n > 0
    ? `, con ${f.n} de ${f.total} intervenciones revisadas por la firma`
    : ', aún sin revisión humana';

/** Las partes del pie que el acta puede afirmar de sí misma. */
const partesDelPie = (result: TranscriptionResult, f: { n: number; total: number }): string[] => {
  const partes = [
    f.total > 0 && f.n === f.total
      ? `Transcripción revisada íntegramente (${f.n}/${f.total} intervenciones)`
      : `${f.n} de ${f.total} intervenciones revisadas`
  ];
  if (result.segments.some((seg) => seg.speakerName)) partes.push('voces nombradas por el revisor');
  const audio = formatTimestamp(result.durationSeconds);
  if (audio) partes.push(`audio ${audio}`);
  return partes;
};

/** El acta de ENTREVISTA: intervinientes en los metadatos y dos firmas. */
const actaDeEntrevista = (result: TranscriptionResult, titulo: string, acta?: ActaInfo, variante?: VarianteDeActa): jsPDF => {
  const marca = getMarcaActual();
  const L = nuevoLienzo(nombreArchivo(titulo, 'pdf'), marca?.firmName);
  const f = fraccionRevisada(result.segments);
  const nombres = buildSpeakerNames(result.segments, ROLE_LABELS);

  membrete(L, marca, 'Documento interno');
  tituloCentrado(L, 'ACTA DE ENTREVISTA INICIAL');

  /* Los intervinientes van DENTRO de los metadatos, con su papel al lado. */
  const runsIntervinientes: PdfRun[] = [];
  result.speakerLabels.forEach((label, i) => {
    const seg = result.segments.find((sg) => sg.speakerLabel === label);
    const nombre = nombres[label] ?? (seg ? ROLE_LABELS[seg.role] : label);
    const rol =
      seg && seg.speakerName && seg.role !== 'DESCONOCIDO' ? ROLE_LABELS[seg.role].toLowerCase() : '';
    if (i > 0) runsIntervinientes.push({ text: '  ·  ' });
    runsIntervinientes.push({ text: nombre, style: 'bold' });
    if (rol) runsIntervinientes.push({ text: ` — ${rol}`, color: TEXTO_CAJA });
  });

  const filas: FilaMeta[] = [];
  if (acta?.consultante) {
    filas.push({
      etiqueta: 'Consultante:',
      valor: `${acta.consultante.nombre} — C.C. ${acta.consultante.documento}`
    });
  }
  const dur = duracion(result.durationSeconds);
  filas.push({
    etiqueta: 'Fecha y hora:',
    valor: `${fechaLarga(result.transcribedAt)}${dur ? ` · duración ${dur}` : ''}`
  });
  filas.push({ etiqueta: 'Grabación:', valor: titulo.replace(/^\d{10,}_/, ''), mono: true });
  if (runsIntervinientes.length > 0) {
    filas.push({ etiqueta: 'Intervinientes:', runs: runsIntervinientes });
  }
  if (acta?.autorizadoEl) {
    filas.push({
      etiqueta: 'Autorizaciones:',
      valor: `Grabación autorizada el ${new Date(acta.autorizadoEl).toLocaleString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}.`
    });
  }
  rejillaMetadatos(L, filas);

  cajaDeNaturaleza(L, [
    { text: 'Naturaleza de este documento.', style: 'bold' },
    {
      text: ` Es la transcripción automática de una grabación${fraseDeRevision(
        f
      )}. Los fragmentos que el audio no permitió establecer con certeza se señalan como `
    },
    { text: '[ininteligible]', font: 'courier', sizePt: 9, noBreak: true },
    { text: '. No constituye declaración rendida ante autoridad ni prueba anticipada.' }
  ]);

  const numeradas = Boolean(acta?.hechosClave && acta.hechosClave.length > 0);
  if (numeradas && acta?.hechosClave) {
    seccion(L, 'I. HECHOS RELEVANTES MANIFESTADOS');
    for (const h of acta.hechosClave) hechoRelevante(L, h);
    L.y += 3;
    seccion(L, 'II. TRANSCRIPCIÓN');
  } else {
    seccion(L, 'TRANSCRIPCIÓN');
  }

  for (const linea of lineas(result, variante)) turno(L, linea);

  cajaDeTramos(L, result);

  if (acta?.decision && acta.decision !== 'SIN_DECIDIR') {
    L.y += 3;
    seccion(L, numeradas ? 'III. RESULTADO' : 'RESULTADO');
    L.y = drawRuns(
      L.doc,
      [
        {
          text:
            acta.decision === 'TOMADO'
              ? 'Se toma el caso.'
              : `Se declina el caso${acta.decisionMotivo ? `: ${acta.decisionMotivo}.` : '.'}`
        }
      ],
      {
        x: MARGEN,
        y: L.y,
        width: ANCHO,
        lineMm: LINEA_CUERPO,
        font: L.F,
        sizePt: CUERPO_PT,
        color: TINTA,
        align: 'justify',
        ensure: L.enLinea
      }
    );
  }

  /*
   * LAS DOS FIRMAS del 14b, lado a lado: la de quien revisó y la del
   * consultante — es el documento que se le entrega o se le lee. Cada una sale
   * solo si su dato existe.
   */
  const firmaRevisor = Boolean(acta?.actaLista && acta.revisadaPor);
  if (firmaRevisor || acta?.consultante) {
    L.asegurar(28);
    L.y += 14;
    const anchoFirma = (ANCHO - 12) / 2;
    if (firmaRevisor && acta?.revisadaPor) {
      lineaDeFirma(L, MARGEN, anchoFirma, acta.revisadaPor, 'revisó la transcripción');
    }
    if (acta?.consultante) {
      lineaDeFirma(
        L,
        MARGEN + anchoFirma + 12,
        anchoFirma,
        acta.consultante.nombre,
        `C.C. ${acta.consultante.documento} · consultante`
      );
    }
    L.y += 12;
  }

  pieDeActa(L, partesDelPie(result, f));
  return L.doc;
};

/** El acta de AUDIENCIA: INTERVINIENTES con colores, DESARROLLO y una firma. */
const actaDeAudiencia = (result: TranscriptionResult, titulo: string, acta?: ActaInfo, variante?: VarianteDeActa): jsPDF => {
  const marca = getMarcaActual();
  const L = nuevoLienzo(nombreArchivo(titulo, 'pdf'), marca?.firmName);
  const f = fraccionRevisada(result.segments);
  const nombres = buildSpeakerNames(result.segments, ROLE_LABELS);

  membrete(L, marca);
  tituloCentrado(L, 'TRANSCRIPCIÓN DE AUDIENCIA');

  const dur = duracion(result.durationSeconds);
  rejillaMetadatos(L, [
    {
      etiqueta: 'Fecha:',
      valor: `${fechaLarga(result.transcribedAt)}${dur ? ` · duración ${dur}` : ''}`
    },
    { etiqueta: 'Grabación:', valor: titulo.replace(/^\d{10,}_/, ''), mono: true }
  ]);

  cajaDeNaturaleza(L, [
    { text: 'Advertencia.', style: 'bold' },
    {
      text: ` Transcripción automática${fraseDeRevision(
        f
      )}. No sustituye el acta oficial del despacho ni la grabación original, que prevalecen. Los tramos que el audio no permitió establecer se indican como `
    },
    { text: '[ininteligible mm:ss]', font: 'courier', sizePt: 9, noBreak: true },
    { text: '.' }
  ]);

  /* INTERVINIENTES como sección propia, cada voz con su cuadro de color. */
  seccion(L, 'INTERVINIENTES');
  for (const label of result.speakerLabels) {
    const seg = result.segments.find((sg) => sg.speakerLabel === label);
    const nombre = nombres[label] ?? (seg ? ROLE_LABELS[seg.role] : label);
    const rol =
      seg && seg.speakerName && seg.role !== 'DESCONOCIDO' ? ROLE_LABELS[seg.role].toLowerCase() : '';
    const color = colorForSpeaker(label, result.speakerLabels);

    L.y = L.enLinea(L.y);
    L.y = drawRuns(
      L.doc,
      rol
        ? [{ text: nombre, style: 'bold' }, { text: ` — ${rol}`, color: TEXTO_CAJA }]
        : [{ text: nombre, style: 'bold' }],
      {
        x: MARGEN + 5.5,
        y: L.y,
        width: ANCHO - 5.5,
        lineMm: CUERPO_PT * 1.7 * 0.3528,
        font: L.F,
        sizePt: CUERPO_PT,
        color: TINTA,
        ensure: L.enLinea,
        onFirstLine: (yFila) => {
          L.doc.setFillColor(color.rgb[0], color.rgb[1], color.rgb[2]);
          L.doc.rect(MARGEN + 0.8, yFila - 2.2, 2.6, 2.6, 'F');
        }
      }
    );
  }

  L.y += 1.5;
  L.y = L.enLinea(L.y);
  L.y = drawRuns(
    L.doc,
    [
      {
        text: 'Los nombres los asignó el revisor a las voces separadas por el sistema. En el desarrollo, cada intervención se identifica con el nombre y el rol abreviado.'
      }
    ],
    {
      x: MARGEN,
      y: L.y,
      width: ANCHO,
      lineMm: 4.8,
      font: L.F,
      sizePt: 8.5,
      color: GRIS,
      ensure: L.enLinea
    }
  );
  L.y += 4;

  if (acta?.hechosClave && acta.hechosClave.length > 0) {
    seccion(L, 'HECHOS RELEVANTES');
    for (const h of acta.hechosClave) hechoRelevante(L, h);
    L.y += 3;
  }

  seccion(L, 'DESARROLLO');
  for (const linea of lineas(result, variante)) turno(L, linea);

  cajaDeTramos(L, result);

  /* UNA sola firma: la de quien revisó. Un acta de audiencia no la firma nadie más. */
  if (acta?.actaLista && acta.revisadaPor) {
    L.asegurar(28);
    L.y += 14;
    lineaDeFirma(L, MARGEN, 62, acta.revisadaPor, 'revisó la transcripción');
    L.y += 12;
  }

  pieDeActa(L, partesDelPie(result, f));
  return L.doc;
};

/**
 * Exporta el acta al papel que le corresponde: entrevista o audiencia.
 *
 * El tipo del transcrito decide, y no un parámetro: una entrevista exportada
 * con la estructura de audiencia saldría afirmando cosas que no le tocan —
 * «no sustituye el acta oficial del despacho» en una conversación de oficina —
 * y quien la abriera no tendría cómo notarlo.
 */
export const exportTranscriptToPdf = (
  result: TranscriptionResult,
  titulo: string,
  acta?: ActaInfo,
  variante?: VarianteDeActa
): void => {
  const doc =
    result.kind === 'ENTREVISTA'
      ? actaDeEntrevista(result, titulo, acta, variante)
      : actaDeAudiencia(result, titulo, acta, variante);

  doc.save(nombreArchivo(titulo, 'pdf'));
};
