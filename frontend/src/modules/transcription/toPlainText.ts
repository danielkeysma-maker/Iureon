import type { TranscriptSegment } from './types';

/**
 * Plain text of the transcript, ready to paste into a filing.
 *
 * Prefixed by the disambiguated speaker name rather than the bare role. With
 * two apoderados or three witnesses the old form wrote "Testigo:" over and
 * over and the reader could not tell which one spoke — in a document that gets
 * quoted, that is not untidy, it is unusable.
 *
 * Its own file now that two screens copy transcripts — the hearing view and the
 * interview view. Left inside one of them, the other would have grown a second
 * copy, and two functions deciding how a speaker is written is how the
 * clipboard starts disagreeing with the screen.
 */
export const toPlainText = (
  segments: TranscriptSegment[],
  names: Record<string, string>
): string =>
  segments.map((s) => `${names[s.speakerLabel] ?? s.speakerLabel}: ${s.text}`).join('\n\n');
