/**
 * Guards the PDF reader as it runs on the SERVER, not on the developer's box.
 *
 * Run with: npm run check:pdf
 *
 * The first production review died with «DOMMatrix is not defined»: pdf.js
 * borrows that class from an optional native package that happened to be
 * installed locally and not on Vercel. This check removes the global before
 * pdf.js loads, so it reads a PDF the way the function does — with nothing
 * but our own polyfill. No network, no native binary.
 */
import { asegurarDOMMatrix, DOMMatrixMinima } from '../domMatrixPolyfill';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── LA CLASE HACE LAS CUENTAS DE UNA MATRIZ AFÍN ─────────────────────────── */
const t = new DOMMatrixMinima().translate(10, 20).scale(2, 3);
check('traslada y escala en el orden del estándar', t.a === 2 && t.d === 3 && t.e === 10 && t.f === 20, JSON.stringify(t.toArray()));
const p = t.transformPoint({ x: 1, y: 1 });
check('transforma un punto', p.x === 12 && p.y === 23, `${p.x},${p.y}`);
const ida = new DOMMatrixMinima([2, 0, 0, 4, 6, 8]);
const vuelta = ida.multiply(ida.inverse());
check('la inversa deshace', Math.abs(vuelta.a - 1) < 1e-12 && Math.abs(vuelta.e) < 1e-12 && vuelta.isIdentity, JSON.stringify(vuelta.toArray()));

/* ─── SIN EL NATIVO, EL LECTOR LEE ──────────────────────────────────────────── */
// A tiny uncompressed PDF with one line of text, built by hand.
const contenido = 'BT /F1 18 Tf 40 700 Td (HECHOS PRIMERO El accionante solicito la autorizacion del procedimiento) Tj ET';
const objetos = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
  `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
];
let pdf = '%PDF-1.4\n';
const offsets: number[] = [];
objetos.forEach((o, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
});
const xref = pdf.length;
pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n${offsets.map((o) => String(o).padStart(10, '0') + ' 00000 n \n').join('')}`;
pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

(async () => {
  const g = globalThis as Record<string, unknown>;
  delete g.DOMMatrix;
  check('sin la global, el polyfill se instala', asegurarDOMMatrix() === true);
  check('y una segunda vez no hace nada', asegurarDOMMatrix() === false);

  // Imported AFTER the global is set, as documentFetch does on its own.
  const { decodeDocument } = await import('../documentFetch');
  const r = await decodeDocument(Buffer.from(pdf, 'latin1'), 'application/pdf', 20);
  check('un PDF se lee con el polyfill solo, sin @napi-rs/canvas', r.ok === true, r.ok ? '' : r.reason);
  check('y el texto es el del documento', r.ok && /HECHOS PRIMERO El accionante/.test(r.text), r.ok ? r.text.slice(0, 80) : '');

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exitCode = fallos === 0 ? 0 : 1;
})();
