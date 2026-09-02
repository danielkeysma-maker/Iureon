/**
 * DOMMatrix for Node, the minimum pdf.js needs to EXTRACT TEXT.
 *
 * ─── THE DEFECT THIS CLOSES ─────────────────────────────────────────────────
 *
 * The first real review in production died with «PDF ilegible (DOMMatrix is
 * not defined)». pdf.js (behind pdf-parse) builds a module-level DOMMatrix
 * and, in Node, borrows the class from `@napi-rs/canvas` — an OPTIONAL native
 * dependency. On the developer's Windows machine the binary was installed, so
 * every local check passed; on Vercel's Linux function it was not, so every
 * PDF failed. A dependency that is present by luck is not a dependency.
 *
 * ─── WHY NOT SHIP THE NATIVE PACKAGE ────────────────────────────────────────
 *
 * `@napi-rs/canvas` is tens of megabytes of rasteriser. Reading text needs
 * none of it: pdf.js only touches DOMMatrix for canvas rendering paths, and
 * at module load. A pure class with the 2D affine operations satisfies both
 * the load and the text path — verified against a 600 KB Consejo de Estado
 * ruling (183.728 characters) with this class alone.
 *
 * Installed only when the global is missing, so a runtime that has the real
 * one keeps it. Import this module before anything that loads pdf.js.
 */

type Seis = [number, number, number, number, number, number];

class DOMMatrixMinima {
  a = 1;
  b = 0;
  c = 0;
  d = 1;
  e = 0;
  f = 0;

  constructor(init?: ArrayLike<number> | DOMMatrixMinima) {
    if (init instanceof DOMMatrixMinima) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = init.toArray();
    } else if (init && typeof init.length === 'number' && init.length >= 6) {
      [this.a, this.b, this.c, this.d, this.e, this.f] = Array.from(init).slice(0, 6) as Seis;
    }
  }

  static fromMatrix(m?: Partial<DOMMatrixMinima>): DOMMatrixMinima {
    return new DOMMatrixMinima([m?.a ?? 1, m?.b ?? 0, m?.c ?? 0, m?.d ?? 1, m?.e ?? 0, m?.f ?? 0]);
  }

  get is2D(): boolean {
    return true;
  }

  get isIdentity(): boolean {
    return this.a === 1 && this.b === 0 && this.c === 0 && this.d === 1 && this.e === 0 && this.f === 0;
  }

  toArray(): Seis {
    return [this.a, this.b, this.c, this.d, this.e, this.f];
  }

  multiply(o: DOMMatrixMinima): DOMMatrixMinima {
    return new DOMMatrixMinima([
      this.a * o.a + this.c * o.b,
      this.b * o.a + this.d * o.b,
      this.a * o.c + this.c * o.d,
      this.b * o.c + this.d * o.d,
      this.a * o.e + this.c * o.f + this.e,
      this.b * o.e + this.d * o.f + this.f
    ]);
  }

  multiplySelf(o: DOMMatrixMinima): this {
    [this.a, this.b, this.c, this.d, this.e, this.f] = this.multiply(o).toArray();
    return this;
  }

  preMultiplySelf(o: DOMMatrixMinima): this {
    [this.a, this.b, this.c, this.d, this.e, this.f] = o.multiply(this).toArray();
    return this;
  }

  translate(x = 0, y = 0): DOMMatrixMinima {
    return this.multiply(new DOMMatrixMinima([1, 0, 0, 1, x, y]));
  }

  translateSelf(x = 0, y = 0): this {
    return this.multiplySelf(new DOMMatrixMinima([1, 0, 0, 1, x, y]));
  }

  scale(x = 1, y = x): DOMMatrixMinima {
    return this.multiply(new DOMMatrixMinima([x, 0, 0, y, 0, 0]));
  }

  scaleSelf(x = 1, y = x): this {
    return this.multiplySelf(new DOMMatrixMinima([x, 0, 0, y, 0, 0]));
  }

  inverse(): DOMMatrixMinima {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) return new DOMMatrixMinima([NaN, NaN, NaN, NaN, NaN, NaN]);
    return new DOMMatrixMinima([
      this.d / det,
      -this.b / det,
      -this.c / det,
      this.a / det,
      (this.c * this.f - this.d * this.e) / det,
      (this.b * this.e - this.a * this.f) / det
    ]);
  }

  invertSelf(): this {
    [this.a, this.b, this.c, this.d, this.e, this.f] = this.inverse().toArray();
    return this;
  }

  transformPoint(p: { x?: number; y?: number } = {}): { x: number; y: number; z: number; w: number } {
    const x = p.x ?? 0;
    const y = p.y ?? 0;
    return { x: this.a * x + this.c * y + this.e, y: this.b * x + this.d * y + this.f, z: 0, w: 1 };
  }

  toFloat32Array(): Float32Array {
    return new Float32Array(this.toArray());
  }

  toFloat64Array(): Float64Array {
    return new Float64Array(this.toArray());
  }
}

/** Installs the class if the runtime lacks it. Idempotent. Returns whether it was needed. */
export const asegurarDOMMatrix = (): boolean => {
  const g = globalThis as Record<string, unknown>;
  if (typeof g.DOMMatrix !== 'undefined') return false;
  g.DOMMatrix = DOMMatrixMinima;
  return true;
};

export { DOMMatrixMinima };
