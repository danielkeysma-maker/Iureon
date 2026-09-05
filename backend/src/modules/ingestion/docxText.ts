/**
 * Minimal .docx reader, shared by everything that receives files from a lawyer.
 *
 * .docx is a zip of XML. The corpus reader never needed it because courts
 * publish .doc and PDF, but lawyers DO send .docx — to the review workshop
 * first, and now as attachments to a draft. It lived inside the review
 * controller; a second copy for the drafting pipeline would have been two
 * readers ageing apart, so it moved here next to the PDF/Word 97 decoder.
 *
 * Paragraph ends and line breaks become NEWLINES, not spaces: facts,
 * pretensions and grounds must reach the model as separate lines, or a
 * numbered list of hechos arrives as one run-on sentence.
 *
 * Returns null when the buffer is not a readable .docx, so the caller can fall
 * through to the generic decoder instead of reporting an empty document.
 */
export const textoDeDocx = async (buffer: Buffer): Promise<string | null> => {
  try {
    const { default: AdmZip } = await import('adm-zip');
    const zip = new AdmZip(buffer);
    const entry = zip.getEntry('word/document.xml');
    if (!entry) return null;
    const xml = entry.getData().toString('utf8');
    return xml
      .replace(/<\/w:p>|<w:br\/>/g, '\n')
      .replace(/<w:tab\/>/g, ' ')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
  } catch {
    return null;
  }
};
