import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { getMarcaActual } from '../../tenant/services/branding.api';
import type { PreguntaDeAudiencia, PreguntasAudienciaGuardadas, SeccionDePreguntas } from './review.api';

/**
 * Las preguntas para la audiencia, fuera de la pantalla: como texto plano
 * para el portapapeles y como Word con la letra de Membrete. Material de
 * trabajo del abogado —se lleva impreso a la audiencia—, sin membrete ni
 * bloque de firma, como el informe.
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
export const preguntasComoTexto = (titulo: string, g: PreguntasAudienciaGuardadas): string => {
  const lineas: string[] = [`PREGUNTAS PARA LA AUDIENCIA · ${titulo}`, ...encabezado(g), ''];
  if (g.preguntas.enfoque) lineas.push(`Enfoque: ${g.preguntas.enfoque}`, '');
  for (const s of TITULOS) {
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

  for (const s of TITULOS) {
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
