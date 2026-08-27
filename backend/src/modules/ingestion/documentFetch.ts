/**
 * Downloads a legal document and returns its readable text, or says why not.
 *
 * EXTRACTED FROM `ingestCorpus.ts`, WHICH LEARNED ALL OF THIS THE HARD WAY. The
 * doctrine corpus needs exactly the same reader — Colombian official sites serve
 * conceptos as HTML in windows-1252, as PDF, and as Word 97 binaries, the same
 * three shapes the relatorías serve rulings in. Copying it would have produced a
 * second reader missing whichever of these lessons nobody remembered, and the
 * copy is the one nobody notices is broken.
 *
 * PDF AND WORD ARE LOADED LAZILY, AND THAT IS NOT AN OPTIMISATION. Importing
 * them at the top of this file put them in the API's startup path the moment a
 * route imported this module — and the whole backend stopped booting in
 * production: every endpoint, `/ping` included, answered
 * FUNCTION_INVOCATION_FAILED. Before this module existed they lived only in
 * `scripts/ingestCorpus.ts`, which is never bundled into the serverless
 * function.
 *
 * The API path never parses a PDF: fetching a ruling from the relatoría gets
 * HTML. So the readers load only when a document actually turns out to be one,
 * which in practice means only the ingestion scripts ever pay for them. It is
 * the same shape as the rule already recorded here about keeping the
 * `@huggingface/transformers` import inside its method.
 *
 * Every guard below exists because its absence put garbage in a corpus:
 *
 *   - A 200 proves nothing. The Corte Constitucional's relatoría answers 200
 *     with 32 characters for ruling numbers that do not exist, byte for byte the
 *     same response a deliberately fake number gets. The body decides.
 *   - A length floor alone is not enough. Running an HTML tag-stripper over a
 *     Word binary yields thousands of characters of compression noise that sail
 *     past any floor and land in the corpus looking like prose.
 *   - The charset must be read, not assumed. The relatorías serve windows-1252,
 *     and `toString('utf8')` turns every accented letter into U+FFFD — a
 *     permanent loss, not a display glitch. It destroyed 193,742 characters
 *     across 23 providencias before anyone read the stored text, and what let it
 *     survive review is that SEARCH STILL WORKED: bge-m3 ranked the mangled
 *     rulings first anyway. Only a lawyer pasting `c�rceles` into a brief would
 *     have found it.
 */

/**
 * OLE compound-file signature — the container Word 97 `.doc` files live in.
 *
 * The Corte Suprema publishes a good part of its casación this way, and those
 * rulings are not reachable as HTML or PDF at all, so without this branch the
 * corpus has a hole where they should be.
 *
 * Note what this is NOT: converting the file to PDF first. Anything able to
 * render a .doc into a PDF can already read its text, so the PDF step only adds
 * a layout pass whose page furniture comes back interleaved into the prose.
 */
const OLE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]);

/** Share of characters lost to decoding past which the document is refused. */
const MAX_REPLACEMENT_RATIO = 0.001;

export const looksBinary = (raw: string): boolean => {
  if (raw.startsWith('%PDF') || raw.startsWith('PK\x03\x04')) return true;
  if (raw.charCodeAt(0) === 0xd0 && raw.charCodeAt(1) === 0xcf) return true;

  const sample = raw.slice(0, 4000);
  let control = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code === 0 || code < 9 || (code > 13 && code < 32) || code === 0xfffd) control++;
  }
  return control / Math.max(sample.length, 1) > 0.05;
};

/**
 * Decodes a page with the charset it declares instead of assuming UTF-8.
 *
 * The header usually omits it, so the document's own meta tag decides. That tag
 * is read as latin1 because ASCII survives every candidate encoding — only the
 * tag needs to be legible, not the document.
 */
export const decodeBody = (buffer: Buffer, contentType: string): string => {
  const fromHeader = /charset=["']?([\w-]+)/i.exec(contentType)?.[1];
  const fromMeta = /charset=["']?([\w-]+)/i.exec(buffer.subarray(0, 4096).toString('latin1'))?.[1];
  const charset = (fromHeader ?? fromMeta ?? 'utf-8').toLowerCase();

  try {
    return new TextDecoder(charset).decode(buffer);
  } catch {
    // An unknown label is not a reason to lose the document; UTF-8 is still the
    // best guess, and the mojibake guard catches it if that guess is bad.
    return buffer.toString('utf8');
  }
};

export const replacementRatio = (text: string): number =>
  (text.match(/�/g)?.length ?? 0) / Math.max(text.length, 1);

/**
 * Pulls readable text out of an official page. Deliberately conservative: a
 * short result means the caller refuses the document rather than indexing a
 * navigation menu as if it were a holding.
 */
export const extractText = (html: string): string =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&ntilde;/g, 'ñ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export type FetchedDocument =
  | { ok: true; text: string }
  | { ok: false; reason: string };

/**
 * Fetches a document and returns its text, refusing anything it cannot read.
 *
 * `minText` is the caller's floor: a ruling body and a concepto are not the
 * same length, and a floor tuned for one silently rejects the other.
 */
export const fetchDocumentText = async (
  url: string,
  options: { minText: number; timeoutMs?: number } = { minText: 2000 }
): Promise<FetchedDocument> => {
  if (!/^https?:\/\//i.test(url)) return { ok: false, reason: 'sin URL http(s)' };

  let buffer: Buffer;
  let contentType: string;

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(options.timeoutMs ?? 120_000)
    });

    if (!response.ok) return { ok: false, reason: `HTTP ${response.status}` };

    contentType = response.headers.get('content-type') ?? '';
    buffer = Buffer.from(await response.arrayBuffer());
  } catch (error) {
    return { ok: false, reason: (error as Error).message };
  }

  let text: string;
  const isPdf = /application\/pdf/i.test(contentType) || buffer.subarray(0, 4).toString() === '%PDF';

  if (isPdf) {
    try {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      try {
        text = (await parser.getText()).text.replace(/\s+/g, ' ').trim();
      } finally {
        await parser.destroy();
      }
    } catch (error) {
      return { ok: false, reason: `PDF ilegible (${(error as Error).message})` };
    }
  } else if (buffer.subarray(0, 4).equals(OLE_SIGNATURE)) {
    try {
      const { default: WordExtractor } = await import('word-extractor');
      text = (await new WordExtractor().extract(buffer)).getBody().replace(/\s+/g, ' ').trim();
    } catch (error) {
      return { ok: false, reason: `.doc ilegible (${(error as Error).message})` };
    }
  } else {
    const raw = buffer.toString('utf8');

    if (looksBinary(raw)) {
      // PDF and Word 97 are handled above, so whatever this is, there is no
      // reader for it. Stripping it as HTML would yield noise with the
      // appearance of text — the failure that has to stay loud.
      return {
        ok: false,
        reason: 'binario sin lector (ni PDF ni Word 97); extraerlo daría ruido con apariencia de texto'
      };
    }

    text = extractText(decodeBody(buffer, contentType));
  }

  // A page that yields almost nothing is a redirect, a login wall or a menu.
  if (text.length < options.minText) {
    return { ok: false, reason: `la página rindió ${text.length} caracteres (mínimo ${options.minText})` };
  }

  const ratio = replacementRatio(text);
  if (ratio > MAX_REPLACEMENT_RATIO) {
    return {
      ok: false,
      reason: `${(ratio * 100).toFixed(2)}% de caracteres de reemplazo: el texto se decodificó mal y no se puede citar`
    };
  }

  return { ok: true, text };
};
