import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { registrarFuenteDelEscrito } from '../../documents/services/pdfFonts';
import { getMarcaActual } from '../../tenant/services/branding.api';
import type { PreguntaParaAlguien, PreguntasDelExpediente } from '../types';

/**
 * El interrogatorio, fuera de la pantalla: como texto plano para el
 * portapapeles, como Word para seguir trabajándolo y como PDF para llevarlo
 * impreso. Material de trabajo del abogado, con la letra de Membrete y sin
 * bloque de firma: no se radica.
 *
 * EL PDF EXISTE PORQUE LA AUDIENCIA ES EN PAPEL. A una audiencia se llega con
 * la hoja en la mano, no con un archivo que hay que abrir. Se dibuja con la
 * misma geometría de carta y los mismos márgenes judiciales del informe.
 *
 * ─── VINO DEL TALLER DE REVISIÓN, Y CAMBIÓ DE FORMA AL LLEGAR ──────────────
 *
 * Esta exportación nació atada a las preguntas que colgaban de una revisión:
 * TRES SECCIONES FIJAS —la contraparte, mis testigos, los testigos de la
 * contraparte— con un rótulo y una nota escritos a mano para cada una en una
 * tabla del código, porque eran siempre las mismas tres. Aquí las listas son
 * tantas como personas se preparen, el rótulo es el NOMBRE de cada quien, y la
 * nota es la `tecnica` que el servidor dedujo del papel y el lado de esa
 * persona. Por eso no queda tabla que mantener: se imprime lo que el
 * expediente dice, y una persona añadida al caso no obliga a tocar este
 * archivo.
 */

export interface ContextoDelInterrogatorio {
  /** La carátula del expediente: titula la hoja y nombra el archivo. */
  caratula: string;
  radicado?: string | null;
  quiereProbar?: string;
  audiencia?: string;
}

const encabezado = (c: ContextoDelInterrogatorio): string[] =>
  [
    c.radicado ? `Radicado: ${c.radicado}` : '',
    c.audiencia ? `Tipo de audiencia: ${c.audiencia}` : '',
    c.quiereProbar ? `Qué quiere probar: ${c.quiereProbar}` : ''
  ].filter(Boolean);

const CIERRE =
  'Preparado a partir del expediente y de lo que la firma registró de cada persona; el abogado decide cuáles formula.';

/** Texto plano con encabezados y numeración, para copiar. Puro. */
export const preguntasComoTexto = (c: ContextoDelInterrogatorio, g: PreguntasDelExpediente): string => {
  const lineas: string[] = [`INTERROGATORIO · ${c.caratula}`, ...encabezado(c), ''];
  if (g.enfoque) lineas.push(`Enfoque: ${g.enfoque}`, '');
  for (const persona of g.porPersona) {
    lineas.push(persona.nombre.toUpperCase(), persona.tecnica, '');
    persona.preguntas.forEach((q: PreguntaParaAlguien, i: number) => {
      lineas.push(`${i + 1}. ${q.pregunta}`);
      if (q.paraQue) lineas.push(`   Para qué: ${q.paraQue}`);
      if (q.delMaterial) lineas.push(`   Del material: «${q.delMaterial}»`);
      lineas.push('');
    });
  }
  lineas.push(CIERRE);
  return lineas.join('\n');
};

const nombreDeArchivo = (caratula: string): string =>
  `Interrogatorio_${caratula.replace(/[^\p{L}\p{N}]+/gu, '_').slice(0, 60)}.docx`;

export const exportarPreguntasAWord = async (
  c: ContextoDelInterrogatorio,
  g: PreguntasDelExpediente
): Promise<void> => {
  const marca = getMarcaActual();
  const font = marca?.fontFamily === 'Inter' ? 'Calibri' : (marca?.fontFamily ?? 'Times New Roman');
  const base = (marca?.fontSizePt ?? 11) * 2;
  const gris = '555555';
  const titulos = '2D2D2D';

  const p = (
    text: string,
    o: {
      bold?: boolean;
      italics?: boolean;
      size?: number;
      color?: string;
      after?: number;
      indent?: number;
      justificar?: boolean;
    } = {}
  ) =>
    new Paragraph({
      spacing: { after: o.after ?? 100, line: 300 },
      alignment: o.justificar === false ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
      indent: o.indent ? { left: o.indent } : undefined,
      children: [
        new TextRun({ text, font, bold: o.bold, italics: o.italics, size: o.size ?? base, color: o.color ?? '111111' })
      ]
    });
  const seccion = (t: string) =>
    new Paragraph({
      spacing: { before: 280, after: 80 },
      border: { bottom: { color: 'C8C8C8', size: 6, style: 'single', space: 2 } },
      children: [new TextRun({ text: t.toUpperCase(), font, bold: true, size: base - 2, color: titulos })]
    });

  const hijos: Paragraph[] = [];
  if (marca?.firmName) hijos.push(p(marca.firmName, { size: base - 4, color: gris, after: 40, justificar: false }));
  hijos.push(p(`Interrogatorio · ${c.caratula}`, { bold: true, size: base + 8, after: 60, justificar: false }));
  const cabecera = encabezado(c);
  if (cabecera.length) hijos.push(p(cabecera.join(' · '), { size: base - 4, color: gris, after: 200, justificar: false }));
  if (g.enfoque) hijos.push(p(g.enfoque, { italics: true, size: base - 2, color: titulos, after: 160 }));

  for (const persona of g.porPersona) {
    hijos.push(seccion(persona.nombre));
    /* La técnica va bajo el nombre: explica por qué esta lista no se parece a la de al lado. */
    hijos.push(p(persona.tecnica, { italics: true, size: base - 4, color: gris, after: 120 }));
    persona.preguntas.forEach((q, i) => {
      hijos.push(p(`${i + 1}. ${q.pregunta}`, { bold: true, after: 40 }));
      if (q.paraQue) hijos.push(p(`Para qué: ${q.paraQue}`, { size: base - 2, color: gris, indent: 360, after: 40 }));
      if (q.delMaterial) hijos.push(p(`Del material: «${q.delMaterial}»`, { italics: true, size: base - 2, indent: 360, after: 40 }));
      hijos.push(p('', { after: 80 }));
    });
  }
  hijos.push(p(CIERRE, { italics: true, size: base - 4, color: gris, after: 0 }));

  const doc = new Document({
    creator: 'Iureon',
    title: `Interrogatorio · ${c.caratula}`,
    sections: [{ children: hijos }]
  });
  saveAs(await Packer.toBlob(doc), nombreDeArchivo(c.caratula));
};

/** Carta con márgenes judiciales, los mismos del informe. */
const PAGINA = { ancho: 215.9, alto: 279.4, izq: 30, der: 25, arriba: 25, abajo: 25 };
const TINTA: [number, number, number] = [17, 17, 17];
const TITULO_COLOR: [number, number, number] = [45, 45, 45];
const NOTA_COLOR: [number, number, number] = [100, 100, 100];

export const exportarPreguntasAPdf = async (
  c: ContextoDelInterrogatorio,
  g: PreguntasDelExpediente
): Promise<void> => {
  const marca = getMarcaActual();
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  const F = await registrarFuenteDelEscrito(doc, marca?.fontFamily ?? 'Times New Roman');
  const cuerpoPt = marca?.fontSizePt ?? 11;
  const anchoTexto = PAGINA.ancho - PAGINA.izq - PAGINA.der;
  const lineaMm = (pt: number) => (pt * 1.4 * 25.4) / 72;
  let y = PAGINA.arriba;

  const asegurar = (alto: number) => {
    if (y + alto > PAGINA.alto - PAGINA.abajo) {
      doc.addPage();
      y = PAGINA.arriba;
    }
  };

  /*
   * Línea a línea y no por bloque: una pregunta puede caer en el corte de
   * página y partirse, y una pregunta partida a la mitad no se puede leer en
   * voz alta. Cada línea comprueba si cabe antes de escribirse.
   */
  const escribir = (
    texto: string,
    pt: number,
    estilo: 'normal' | 'bold' | 'italic' = 'normal',
    sangria = 0,
    color: [number, number, number] = TINTA
  ) => {
    doc.setFont(F, estilo);
    doc.setFontSize(pt);
    doc.setTextColor(...color);
    for (const l of doc.splitTextToSize(texto, anchoTexto - sangria) as string[]) {
      asegurar(lineaMm(pt));
      doc.text(l, PAGINA.izq + sangria, y);
      y += lineaMm(pt);
    }
  };

  escribir(`Interrogatorio · ${c.caratula}`, cuerpoPt + 3, 'bold');
  y += 1.5;
  for (const linea of encabezado(c)) escribir(linea, cuerpoPt - 2, 'normal', 0, NOTA_COLOR);
  if (g.enfoque) {
    y += 1.5;
    escribir(g.enfoque, cuerpoPt - 1, 'italic', 0, TITULO_COLOR);
  }
  y += 3;

  for (const persona of g.porPersona) {
    y += 3;
    asegurar(lineaMm(cuerpoPt) * 3);
    escribir(persona.nombre.toUpperCase(), cuerpoPt - 1, 'bold', 0, TITULO_COLOR);
    escribir(persona.tecnica, cuerpoPt - 2, 'italic', 0, NOTA_COLOR);
    y += 1.5;
    persona.preguntas.forEach((q: PreguntaParaAlguien, i: number) => {
      // La pregunta y lo suyo no se separan: si no caben juntas, pasan de página.
      asegurar(lineaMm(cuerpoPt) * 2);
      escribir(`${i + 1}. ${q.pregunta}`, cuerpoPt, 'normal');
      if (q.paraQue) escribir(`Para qué: ${q.paraQue}`, cuerpoPt - 2, 'normal', 6, NOTA_COLOR);
      if (q.delMaterial) escribir(`Del material: «${q.delMaterial}»`, cuerpoPt - 2, 'italic', 6, NOTA_COLOR);
      y += 1.5;
    });
  }

  y += 3;
  escribir(CIERRE, cuerpoPt - 2, 'italic', 0, NOTA_COLOR);

  doc.setProperties({ title: `Interrogatorio · ${c.caratula}`, creator: 'Iureon' });
  doc.save(nombreDeArchivo(c.caratula).replace(/\.docx$/, '.pdf'));
};
