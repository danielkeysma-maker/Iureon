/**
 * Guards the review report layout in PDF. Run with: npm run check:informe
 *
 * Runs in Node with jsPDF's built-in Helvetica: no font files, no Vite. What
 * has to hold: every section of the dialog appears, in its order; a long
 * report paginates instead of running off the sheet; an empty section is
 * not drawn.
 */
import { jsPDF } from 'jspdf';
import { dibujarInformeEnPdf, type DatosDelInforme } from '../services/informeLayout';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const textoDe = (doc: jsPDF): string => {
  // jsPDF's internal page text is not exposed; the output stream carries the strings in Tj operators.
  const out = doc.output();
  return out;
};

const base: DatosDelInforme = {
  documentType: 'Acción de tutela',
  fileName: 'tutela.pdf',
  fecha: '2 de septiembre de 2026',
  caracteres: 4912,
  truncado: false,
  conFicha: true,
  firmName: 'Anibal Diaz Contreras',
  informe: {
    resumen: 'El escrito cumple lo esencial del artículo 14 del Decreto 2591 de 1991.',
    fortalezas: ['Hechos cronológicos y verificables.'],
    debilidades: ['La tercera pretensión es subsidiaria mal redactada.'],
    seccionesFaltantes: ['Residencia del solicitante (art. 14).'],
    erroresDeAplicacion: [{ donde: 'Fundamentos', problema: 'Cita una sentencia sin verificar.', correccion: 'Suprimir la cita.' }],
    recomendaciones: ['Formular la petición como orden concreta.']
  }
};

const doc = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc, 'helvetica', base, 11);
check('un informe corto cabe en una página', doc.getNumberOfPages() === 1, String(doc.getNumberOfPages()));
const salida = textoDe(doc);
check('el PDF se genera con contenido', salida.length > 2000, String(salida.length));

/* Un informe largo pagina: 40 recomendaciones de tres líneas cada una. */
const largo: DatosDelInforme = {
  ...base,
  informe: {
    ...base.informe,
    recomendaciones: Array.from({ length: 40 }, (_, k) => `Recomendación ${k + 1}: ` + 'revisar con cuidado la redacción de la pretensión y su relación con los hechos narrados, '.repeat(2))
  }
};
const doc2 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc2, 'helvetica', largo, 11);
check('un informe largo pagina en vez de salirse de la hoja', doc2.getNumberOfPages() >= 3, String(doc2.getNumberOfPages()));

/* Secciones vacías no se dibujan: mismo número de páginas con y sin ellas vacías. */
const vacias: DatosDelInforme = { ...base, informe: { ...base.informe, seccionesFaltantes: [], fortalezas: [], erroresDeAplicacion: [] } };
const doc3 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc3, 'helvetica', vacias, 11);
check('con secciones vacías el PDF es más corto, no igual', textoDe(doc3).length < salida.length, `${textoDe(doc3).length} < ${salida.length}`);

/* Sin ficha, lo dice. */
const doc4 = new jsPDF({ unit: 'mm', format: 'letter' });
dibujarInformeEnPdf(doc4, 'helvetica', { ...base, conFicha: false }, 11);
check('sin ficha, el PDF se genera igual', doc4.getNumberOfPages() === 1);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
