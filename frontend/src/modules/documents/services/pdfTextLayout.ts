import type { jsPDF } from 'jspdf';

/**
 * Justified paragraph layout for jsPDF, with styled runs.
 *
 * WHY THIS EXISTS. jsPDF's own `align: 'justify'` only works on a single
 * uniform string: the moment a paragraph mixes bold ("PRIMERA."), a mono
 * highlight ("[ininteligible 13:09]") or a colour change, the built-in path is
 * useless and every caller ends up hand-placing words. Both exporters (escrito
 * 14a and acta 14b) need mixed runs AND justification, so the word-walk lives
 * here once instead of twice, half-broken.
 *
 * HOW. Runs are tokenised into words, each word measured with ITS OWN font;
 * lines fill greedily; on justified lines the leftover width is distributed
 * evenly across the inter-word gaps — except the paragraph's last line, which
 * stays left-aligned, as every text engine does.
 */

export type RGB = [number, number, number];

export interface PdfRun {
  text: string;
  style?: 'normal' | 'bold' | 'italic';
  /** Font family already registered on the doc. Defaults to the paragraph's. */
  font?: string;
  sizePt?: number;
  color?: RGB;
  /** Highlight painted behind the run (the [ininteligible] mark of 14b). */
  bg?: RGB;
  /** Keep the run as ONE token even if it contains spaces. */
  noBreak?: boolean;
}

export interface DrawRunsOptions {
  x: number;
  y: number;
  width: number;
  /** Baseline-to-baseline advance in mm — this IS the interlineado. */
  lineMm: number;
  font: string;
  sizePt: number;
  color: RGB;
  /** 'justify' stretches every line but the last; 'center' centres each line. */
  align?: 'left' | 'center' | 'justify';
  /**
   * Page-break hook: receives the baseline about to be used and returns the
   * baseline to actually draw at (same value, or the top of a fresh page).
   */
  ensure?: (y: number) => number;
  /** Fires with the baseline of the first line actually drawn. */
  onFirstLine?: (y: number) => void;
}

interface Token {
  text: string;
  style: 'normal' | 'bold' | 'italic';
  font: string;
  sizePt: number;
  color: RGB;
  bg?: RGB;
  width: number;
  /** Width of one space in this token's font — the gap that follows it. */
  spaceW: number;
  /** Whether a space separates this token from the next one. */
  glue: boolean;
}

const setTokenFont = (doc: jsPDF, t: Pick<Token, 'font' | 'style' | 'sizePt'>): void => {
  doc.setFont(t.font, t.style);
  doc.setFontSize(t.sizePt);
};

const tokenize = (doc: jsPDF, runs: PdfRun[], opts: DrawRunsOptions): Token[] => {
  const tokens: Token[] = [];

  for (const run of runs) {
    const base = {
      style: run.style ?? 'normal',
      font: run.font ?? opts.font,
      sizePt: run.sizePt ?? opts.sizePt,
      color: run.color ?? opts.color,
      bg: run.bg
    };

    setTokenFont(doc, base);
    const spaceW = doc.getTextWidth(' ');

    if (run.noBreak) {
      const text = run.text.trim();
      if (!text) continue;
      // glue arranca en false: solo el whitespace REAL que siga (de este run o
      // del siguiente) lo enciende — un glue fijo metia un espacio fantasma
      // entre la marca y el punto que la sigue.
      tokens.push({ ...base, text, width: doc.getTextWidth(text), spaceW, glue: false });
      continue;
    }

    // A run starting with whitespace glues to the PREVIOUS token; splitting
    // keeps that information by looking at the raw boundaries.
    const parts = run.text.split(/(\s+)/);
    for (const part of parts) {
      if (part === '') continue;
      if (/^\s+$/.test(part)) {
        if (tokens.length > 0) tokens[tokens.length - 1].glue = true;
        continue;
      }
      tokens.push({ ...base, text: part, width: doc.getTextWidth(part), spaceW, glue: false });
    }
  }

  if (tokens.length > 0) tokens[tokens.length - 1].glue = false;
  return tokens;
};

const buildLines = (tokens: Token[], width: number): Token[][] => {
  const lines: Token[][] = [];
  let line: Token[] = [];
  let used = 0;

  for (const token of tokens) {
    const gap = line.length > 0 && line[line.length - 1].glue ? line[line.length - 1].spaceW : 0;
    if (line.length > 0 && used + gap + token.width > width) {
      lines.push(line);
      line = [];
      used = 0;
    }
    used += (line.length > 0 && line[line.length - 1].glue ? line[line.length - 1].spaceW : 0) + token.width;
    line.push(token);
  }
  if (line.length > 0) lines.push(line);
  return lines;
};

/** How many lines the runs occupy at the given width — for sizing boxes. */
export const measureRuns = (doc: jsPDF, runs: PdfRun[], opts: DrawRunsOptions): number =>
  buildLines(tokenize(doc, runs, opts), opts.width).length;

/**
 * Draws the runs as a paragraph and returns the baseline for whatever comes
 * next (last drawn baseline + lineMm).
 */
export const drawRuns = (doc: jsPDF, runs: PdfRun[], opts: DrawRunsOptions): number => {
  const lines = buildLines(tokenize(doc, runs, opts), opts.width);
  let y = opts.y;
  let first = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (opts.ensure) y = opts.ensure(y);
    if (first) {
      opts.onFirstLine?.(y);
      first = false;
    }

    const natural = line.reduce(
      (total, t, idx) => total + t.width + (idx < line.length - 1 && t.glue ? t.spaceW : 0),
      0
    );

    // Justify every line but the paragraph's last. A line whose leftover is
    // huge (short last-ish line before a break) would open rivers wider than
    // words — beyond a third of the width the line stays left-aligned.
    let perGap = 0;
    if (opts.align === 'justify' && i < lines.length - 1 && line.length > 1) {
      const gaps = line.filter((t, idx) => idx < line.length - 1 && t.glue).length;
      const extra = opts.width - natural;
      if (gaps > 0 && extra > 0 && extra < opts.width * 0.35) perGap = extra / gaps;
    }

    let x = opts.x + (opts.align === 'center' ? Math.max(0, (opts.width - natural) / 2) : 0);
    for (let idx = 0; idx < line.length; idx++) {
      const t = line[idx];
      setTokenFont(doc, t);

      if (t.bg) {
        const alturaPt = t.sizePt * 0.3528;
        doc.setFillColor(t.bg[0], t.bg[1], t.bg[2]);
        doc.rect(x - 0.4, y - alturaPt * 0.78, t.width + 0.8, alturaPt * 1.05, 'F');
      }

      doc.setTextColor(t.color[0], t.color[1], t.color[2]);
      doc.text(t.text, x, y);
      x += t.width;
      if (idx < line.length - 1 && t.glue) x += t.spaceW + perGap;
    }

    y += opts.lineMm;
  }

  return y;
};
