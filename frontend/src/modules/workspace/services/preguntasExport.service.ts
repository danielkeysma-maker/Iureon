import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { jsPDF } from 'jspdf';
import { registrarFuenteDelEscrito } from '../../documents/services/pdfFonts';
import { getMarcaActual } from '../../tenant/services/branding.api';
import type { PreguntaDeAudiencia, PreguntasAudienciaGuardadas, SeccionDePreguntas } from './review.api';

/**
 * Las preguntas para la audiencia, fuera de la pantalla: como texto plano
 * para el portapapeles, como Word para seguir trabajándolas y como PDF para
 * llevarlas impresas. Material de trabajo del abogado, con la letra de
 * Membrete y sin bloque de firma, igual que el informe: no se radica.
 *
 * EL PDF EXISTE PORQUE LA AUDIENCIA ES EN PAPEL. Un Word se edita y un PDF se
 * imprime igual en cualquier equipo; a una audiencia se llega con la hoja en
 * la mano, no con un archivo que hay que abrir. Se dibuja con la misma
 * geometría de carta y los mismos márgenes judiciales del informe.
 */

export const TITULOS: ReadonlyArray<{ clave: SeccionDePreguntas; titulo: string; nota: string }> = [
  { clave: 'contraparte', titulo: 'A la contraparte', nota: 'Interrogatorio de parte: respuestas que favorecen a su cliente.' },
  { clave: 'misTestigos', titulo: 'A mis testigos', nota: 'Abiertas y no sugestivas, en el orden del relato.' },
  { clave: 'testigosContraparte', titulo: 'A los testigos de la contraparte', nota: 'Contrainterrogatorio: cerradas, una afirmación por pregunta.' }
];

const encabezado = (g: PreguntasAudienciaGuardadas): string[] =>
  [
    `Posición: ${g.parametros.posicion}`,
    g.parametros.quiereProbar ? `Qué quiere probar: ${g.parametros.quiereProbar}` : '',
    g.parametros.audiencia ? `Tipo de audiencia: ${g.parametros.audiencia}` : ''
  ].filter(Boolean);

/** Texto plano con encabezados y numeración, para copiar. Puro. */
/** Las secciones que el abogado pidió; sin restricción, las tres. */
export const seccionesPedidas = (g: PreguntasAudienciaGuardadas): typeof TITULOS =>
  g.parametros.publicos && g.parametros.publicos.length ? TITULOS.filter((t) => g.parametros.publicos!.includes(t.clave)) : TITULOS;

export const preguntasComoTexto = (titulo: string, g: PreguntasAudienciaGuardadas): string => {
  const lineas: string[] = [`PREGUNTAS PARA LA AUDIENCIA · ${titulo}`, ...encabezado(g), ''];
  if (g.preguntas.enfoque) lineas.push(`Enfoque: ${g.preguntas.enfoque}`, '');
  for (const s of seccionesPedidas(g)) {
    const lista = g.preguntas[s.clave];
    if (!lista.length) continue;
    lineas.push(s.titulo.toUpperCase(), '');
    lista.forEach((q: PreguntaDeAudiencia, i: number) => {
      lineas.push(`${i + 1}. ${q.pregunta}`);
      if (q.paraQue) lineas.push(`   Para qué: ${q.paraQue}`);
      if (q.delEscrito) lineas.push(`   Del escrito: «${q.delEscrito}»`);
      lineas.push('');
    });
  }
  lineas.push('Sugerencias de la guía a partir del escrito; el abogado decide cuáles formula.');
  return lineas.join('\n');
};

const nombreDeArchivo = (titulo: string): string => `Preguntas_audiencia_${titulo.replace(/[^\p{L}\p{N}]+/gu, '_')}.docx`;

export const exportarPreguntasAWord = async (titulo: string, g: PreguntasAudienciaGuardadas): Promise<void> => {
  const marca = getMarcaActual();
  const font = marca?.fontFamily === 'Inter' ? 'Calibri' : (marca?.fontFamily ?? 'Times New Roman');
  const base = (marca?.fontSizePt ?? 11) * 2;
  const gris = '555555';
  const titulos = '2D2D2D';

  const p = (text: string, o: { bold?: boolean; italics?: boolean; size?: number; color?: string; after?: number; indent?: number; justificar?: boolean } = {}) =>
    new Paragraph({
      spacing: { after: o.after ?? 100, line: 300 },
      alignment: o.justificar === false ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
      indent: o.indent ? { left: o.indent } : undefined,
      children: [new TextRun({ text, font, bold: o.bold, italics: o.italics, size: o.size ?? base, color: o.color ?? '111111' })]
    });
  const seccion = (t: string) =>
    new Paragraph({
      spacing: { before: 280, after: 80 },
      border: { bottom: { color: 'C8C8C8', size: 6, style: 'single', space: 2 } },
      children: [new TextRun({ text: t.toUpperCase(), font, bold: true, size: base - 2, color: titulos })]
    });

  const hijos: Paragraph[] = [];
  if (marca?.firmName) hijos.push(p(marca.firmName, { size: base - 4, color: gris, after: 40, justificar: false }));
  hijos.push(p(`Preguntas para la audiencia · ${titulo}`, { bold: true, size: base + 8, after: 60, justificar: false }));
  hijos.push(p(encabezado(g).join(' · '), { size: base - 4, color: gris, after: 200, justificar: false }));

  for (const s of seccionesPedidas(g)) {
    const lista = g.preguntas[s.clave];
    if (!lista.length) continue;
    hijos.push(seccion(s.titulo));
    hijos.push(p(s.nota, { italics: true, size: base - 4, color: gris, after: 120, justificar: false }));
    lista.forEach((q, i) => {
      hijos.push(p(`${i + 1}. ${q.pregunta}`, { bold: true, after: 40 }));
      if (q.paraQue) hijos.push(p(`Para qué: ${q.paraQue}`, { size: base - 2, color: gris, indent: 360, after: 40 }));
      if (q.delEscrito) hijos.push(p(`Del escrito: «${q.delEscrito}»`, { italics: true, size: base - 2, indent: 360, after: 40 }));
      hijos.push(p('', { after: 80 }));
    });
  }
  hijos.push(p('Sugerencias de la guía a partir del escrito; el abogado decide cuáles formula.', { italics: true, size: base - 4, color: gris, after: 0 }));

  const doc = new Document({ creator: 'Iureon', title: `Preguntas para la audiencia · ${titulo}`, sections: [{ children: hijos }] });
  saveAs(await Packer.toBlob(doc), nombreDeArchivo(titulo));
};

/** Carta con márgenes judiciales, los mismos del informe. */
const PAGINA = { ancho: 215.9, alto: 279.4, izq: 30, der: 25, arriba: 25, abajo: 25 };
const TINTA: [number, number, number] = [17, 17, 17];
const TITULO_COLOR: [number, number, number] = [45, 45, 45];
const NOTA_COLOR: [number, number, number] = [100, 100, 100];

export const exportarPreguntasAPdf = async (titulo: string, g: PreguntasAudienciaGuardadas): Promise<void> => {
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

  escribir(`Preguntas para la audiencia · ${titulo}`, cuerpoPt + 3, 'bold');
  y += 1.5;
  for (const linea of encabezado(g)) escribir(linea, cuerpoPt - 2, 'normal', 0, NOTA_COLOR);
  if (g.preguntas.enfoque) {
    y += 1.5;
    escribir(`Enfoque: ${g.preguntas.enfoque}`, cuerpoPt - 1, 'italic', 0, TITULO_COLOR);
  }
  y += 3;

  for (const s of seccionesPedidas(g)) {
    const lista = g.preguntas[s.clave];
    if (!lista.length) continue;
    y += 3;
    asegurar(lineaMm(cuerpoPt) * 3);
    escribir(s.titulo.toUpperCase(), cuerpoPt - 1, 'bold', 0, TITULO_COLOR);
    escribir(s.nota, cuerpoPt - 2, 'italic', 0, NOTA_COLOR);
    y += 1.5;
    lista.forEach((q: PreguntaDeAudiencia, i: number) => {
      // La pregunta y lo suyo no se separan: si no caben juntas, pasan de página.
      asegurar(lineaMm(cuerpoPt) * 2);
      escribir(`${i + 1}. ${q.pregunta}`, cuerpoPt, 'normal');
      if (q.paraQue) escribir(`Para qué: ${q.paraQue}`, cuerpoPt - 2, 'normal', 6, NOTA_COLOR);
      if (q.delEscrito) escribir(`Del escrito: «${q.delEscrito}»`, cuerpoPt - 2, 'italic', 6, NOTA_COLOR);
      y += 1.5;
    });
  }

  y += 3;
  escribir(
    'Sugerencias de la guía a partir del escrito; el abogado decide cuáles formula.',
    cuerpoPt - 2,
    'italic',
    0,
    NOTA_COLOR
  );

  doc.setProperties({ title: `Preguntas para la audiencia · ${titulo}`, creator: 'Iureon' });
  doc.save(nombreDeArchivo(titulo).replace(/\.docx$/, '.pdf'));
};
