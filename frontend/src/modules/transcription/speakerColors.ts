/**
 * One colour per voice, shared by the screen and both exports.
 *
 * The transcript on screen identifies each speaker by a coloured avatar, and a
 * document that comes out of it in black and white throws that away — the
 * reader has to re-learn who is who from the names alone, in the artefact that
 * gets read most carefully. So the palette lives here rather than inside the
 * component, and Word, PDF and the page cannot drift into three different
 * answers about which colour the judge is.
 *
 * The Tailwind class and the RGB triple are two spellings of one value, kept
 * side by side so a change to either is visibly a change to both.
 */
export interface SpeakerColor {
  /** For the avatar on screen. */
  className: string;
  /** For jsPDF, which wants channels. */
  rgb: [number, number, number];
  /** For docx, which wants hex without the hash. */
  hex: string;
}

export const SPEAKER_COLORS: SpeakerColor[] = [
  { className: 'bg-blue-700', rgb: [29, 78, 216], hex: '1D4ED8' },
  { className: 'bg-emerald-700', rgb: [4, 120, 87], hex: '047857' },
  { className: 'bg-amber-600', rgb: [217, 119, 6], hex: 'D97706' },
  { className: 'bg-purple-700', rgb: [126, 34, 206], hex: '7E22CE' },
  { className: 'bg-rose-700', rgb: [190, 18, 60], hex: 'BE123C' },
  { className: 'bg-cyan-700', rgb: [14, 116, 144], hex: '0E7490' }
];

/**
 * The colour of a voice, by the order it appears in the hearing.
 *
 * `indexOf` returning -1 for a label that is not in the list would index from
 * the end of the array, so an unknown voice takes the first colour rather than
 * a random one.
 */
export const colorForSpeaker = (speakerLabel: string, labels: string[]): SpeakerColor =>
  SPEAKER_COLORS[Math.max(0, labels.indexOf(speakerLabel)) % SPEAKER_COLORS.length];
