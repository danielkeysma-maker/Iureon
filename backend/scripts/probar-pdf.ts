/**
 * Prueba el lector de PDF tal como corre en el servidor, con y sin polyfill
 * de DOMMatrix. Uso: npx ts-node -P tsconfig.check.json --transpile-only scripts/probar-pdf.ts <archivo.pdf> [polyfill]
 */
import { readFileSync } from 'node:fs';

const archivo = process.argv[2];
const conPolyfill = process.argv[3] === 'polyfill';

if (conPolyfill) {
  /*
   * Lo minimo que pdf.js pide en Node para EXTRAER TEXTO (no para dibujar):
   * que exista una clase DOMMatrix con las operaciones basicas. La real vive en
   * @napi-rs/canvas, un binario nativo de decenas de MB que una funcion
   * serverless no deberia cargar para leer texto.
   */
  const g = globalThis as Record<string, unknown>;
  if (typeof g.DOMMatrix === 'undefined') {
    class DOMMatrixMinima {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      constructor(init?: number[] | string) {
        if (Array.isArray(init) && init.length >= 6) [this.a, this.b, this.c, this.d, this.e, this.f] = init as number[];
      }
      get is2D() { return true; }
      get isIdentity() { return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0; }
      multiply(o: DOMMatrixMinima) {
        return new DOMMatrixMinima([
          this.a * o.a + this.c * o.b, this.b * o.a + this.d * o.b,
          this.a * o.c + this.c * o.d, this.b * o.c + this.d * o.d,
          this.a * o.e + this.c * o.f + this.e, this.b * o.e + this.d * o.f + this.f
        ]);
      }
      translate(x = 0, y = 0) { return this.multiply(new DOMMatrixMinima([1, 0, 0, 1, x, y])); }
      scale(x = 1, y = x) { return this.multiply(new DOMMatrixMinima([x, 0, 0, y, 0, 0])); }
      inverse() {
        const det = this.a * this.d - this.b * this.c;
        return new DOMMatrixMinima([this.d / det, -this.b / det, -this.c / det, this.a / det, (this.c * this.f - this.d * this.e) / det, (this.b * this.e - this.a * this.f) / det]);
      }
      transformPoint(p: { x: number; y: number }) { return { x: this.a * p.x + this.c * p.y + this.e, y: this.b * p.x + this.d * p.y + this.f }; }
      toFloat32Array() { return new Float32Array([this.a, this.b, this.c, this.d, this.e, this.f]); }
      toFloat64Array() { return new Float64Array([this.a, this.b, this.c, this.d, this.e, this.f]); }
    }
    g.DOMMatrix = DOMMatrixMinima;
  }
}

(async () => {
  const { decodeDocument } = await import('../src/modules/ingestion/documentFetch');
  const buffer = readFileSync(archivo);
  const inicio = Date.now();
  const r = await decodeDocument(buffer, 'application/pdf', 50);
  console.log(JSON.stringify({ polyfill: conPolyfill, ok: r.ok, ms: Date.now() - inicio, reason: r.ok ? undefined : r.reason, caracteres: r.ok ? r.text.length : 0, muestra: r.ok ? r.text.slice(0, 120) : undefined }));
})();
