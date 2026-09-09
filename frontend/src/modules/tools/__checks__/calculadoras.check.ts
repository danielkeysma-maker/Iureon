/**
 * Guards the calculator PDF. Run with: npm run check:calculadoras
 *
 * Runs in Node with jsPDF's built-in Helvetica: no font files, no Vite. What
 * has to hold: the five sections appear in their order; the sources section is
 * drawn ALWAYS —even with a huge detail table that pushes it to another page,
 * and even when the book carries none, in which case the sheet says so
 * instead of staying quiet—; a long detail paginates and repeats the table
 * header; a detail above the ceiling is not cut in silence; and the file name
 * carries the date.
 */
import { jsPDF } from 'jspdf';
import { dibujarCalculadoraEnPdf, nombreDePdf, tituloDeLibro, MAX_FILAS_DETALLE } from '../calculadoraPdfLayout';
import type { LibroExcel } from '../exportarExcel';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const base: LibroExcel = {
  archivo: 'competencia-cuantia',
  titulo: 'Competencia por cuantia',
  resultado: [
    ['Pretension (pesos)', 80000000],
    ['Juez competente', 'Juez civil del circuito'],
    ['Instancia', 'Primera instancia']
  ],
  detalle: {
    columnas: ['Categoria', 'Hasta (SMLMV)', 'Hasta (pesos)'],
    filas: [
      ['Minima', 40, 56000000],
      ['Menor', 150, 210000000],
      ['Mayor', 'sin tope', 'sin tope']
    ]
  },
  fuentes: [
    {
      nombre: 'Salario minimo 2026',
      norma: 'Decreto 2613 de 2025',
      url: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=999999',
      consultadoEl: '2026-09-04'
    }
  ],
  notas: ['CGP art. 26: cuenta el salario minimo vigente al presentar la demanda.']
};

const pdfDe = (libro: LibroExcel): { doc: jsPDF; texto: string } => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  dibujarCalculadoraEnPdf(doc, 'helvetica', libro, '9 de septiembre de 2026', 11);
  // jsPDF no expone el texto de la pagina; el flujo de salida lleva las cadenas.
  return { doc, texto: doc.output() };
};

/* ─── Un calculo corriente ─────────────────────────────────────────────── */
const { doc, texto } = pdfDe(base);
check('un resultado corriente cabe en una pagina', doc.getNumberOfPages() === 1, String(doc.getNumberOfPages()));
check('el PDF se genera con contenido', texto.length > 2000, String(texto.length));
for (const seccion of ['RESULTADO', 'NOTAS', 'DETALLE', 'FUENTES']) {
  check(`el PDF lleva la seccion ${seccion}`, texto.includes(seccion));
}
check('las secciones salen en su orden', texto.indexOf('RESULTADO') < texto.indexOf('NOTAS') && texto.indexOf('NOTAS') < texto.indexOf('DETALLE') && texto.indexOf('DETALLE') < texto.indexOf('FUENTES'));
check('el PDF lleva el titulo del calculo y la fecha en que se genero', texto.includes('Competencia por cuantia') && texto.includes('9 de septiembre de 2026'));
check('el PDF lleva la norma, la direccion y la fecha de consulta de la fuente', texto.includes('Decreto 2613 de 2025') && texto.includes('gestornormativo') && texto.includes('2026-09-04'));

/* ─── Sin notas la seccion no se dibuja; las fuentes si ────────────────── */
const sinNotas = pdfDe({ ...base, notas: [] });
check('sin notas no se dibuja la seccion Notas', !sinNotas.texto.includes('NOTAS'));
check('sin notas las fuentes siguen ahi', sinNotas.texto.includes('FUENTES'));

/* ─── Las fuentes no se omiten nunca ───────────────────────────────────── */
const largo = pdfDe({
  ...base,
  detalle: {
    columnas: ['Fecha', 'Festivo', 'Regla', 'Fecha original'],
    filas: Array.from({ length: 180 }, (_, k) => [`2026-01-${(k % 28) + 1}`, `Festivo numero ${k + 1} con un nombre largo`, 'Trasladado al lunes', '2026-01-01'])
  }
});
check('un detalle largo pagina en vez de salirse de la hoja', largo.doc.getNumberOfPages() >= 3, String(largo.doc.getNumberOfPages()));
check('la cabecera de la tabla se repite en cada pagina', (largo.texto.match(/Fecha original/g) ?? []).length >= largo.doc.getNumberOfPages() - 1);
check('con un detalle largo las fuentes siguen imprimiendose', largo.texto.includes('FUENTES') && largo.texto.includes('Decreto 2613 de 2025'));

const sinFuentes = pdfDe({ ...base, fuentes: [] });
check('sin fuentes la seccion se dibuja igual', sinFuentes.texto.includes('FUENTES'));
check('sin fuentes el PDF lo dice en vez de callarlo', sinFuentes.texto.includes('sin fuentes declaradas'));

/* ─── Un recorte se anuncia en la propia hoja ──────────────────────────── */
const enorme = pdfDe({
  ...base,
  detalle: { columnas: ['Dia', 'Motivo'], filas: Array.from({ length: MAX_FILAS_DETALLE + 25 }, (_, k) => [`fila ${k}`, 'vacancia judicial']) }
});
check('un detalle por encima del tope se anuncia, no se recorta en silencio', enorme.texto.includes('sin imprimir'));
check('el detalle recortado no se lleva por delante las fuentes', enorme.texto.includes('FUENTES'));

/* ─── El nombre del archivo ────────────────────────────────────────────── */
check('el nombre del archivo lleva la fecha y termina en .pdf', nombreDePdf(base, '2026-09-09') === 'competencia-cuantia-2026-09-09.pdf', nombreDePdf(base, '2026-09-09'));
check('el PDF y el Excel comparten el nombre base', nombreDePdf(base, '2026-09-09').replace(/\.pdf$/, '') === `${base.archivo}-2026-09-09`);
check('sin titulo, el rotulo sale del nombre del archivo', tituloDeLibro({ ...base, titulo: undefined }) === 'Competencia cuantia', tituloDeLibro({ ...base, titulo: undefined }));
check('con titulo, manda el titulo', tituloDeLibro(base) === 'Competencia por cuantia');

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
