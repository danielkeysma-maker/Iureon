import type { SpeakerRole, TranscriptSegment } from './types';

/**
 * A display name per voice, disambiguated when a role is shared.
 *
 * WHY. A hearing is rarely two people. There are two apoderados, three
 * witnesses, an expert and the bench, and every one of them was rendered as
 * their role alone — so a transcript pasted into a filing read "Testigo: …"
 * three times over, with nothing to say which witness said what. In a document
 * that gets quoted, that is not untidy, it is unusable: "el testigo declaró"
 * means nothing when three did.
 *
 * Numbered only when it is needed. A hearing with one witness says "Testigo",
 * because "Testigo 1" would imply a second one that never existed. The order is
 * the order they first spoke, which is also the order the reader met them.
 *
 * Voices nobody has identified keep their raw diarization label alongside, since
 * "Sin identificar" twice is the same ambiguity in a different disguise.
 */
export const buildSpeakerNames = (
  segments: TranscriptSegment[],
  labels: Record<SpeakerRole, string>
): Record<string, string> => {
  const roleByLabel = new Map<string, SpeakerRole>();

  for (const segment of segments) {
    if (!roleByLabel.has(segment.speakerLabel)) {
      roleByLabel.set(segment.speakerLabel, segment.role);
    }
  }

  const countByRole = new Map<SpeakerRole, number>();
  for (const role of roleByLabel.values()) {
    countByRole.set(role, (countByRole.get(role) ?? 0) + 1);
  }

  const seen = new Map<SpeakerRole, number>();
  const names: Record<string, string> = {};

  for (const [speakerLabel, role] of roleByLabel) {
    const label = labels[role] ?? role;
    const total = countByRole.get(role) ?? 1;

    if (role === 'DESCONOCIDO') {
      // The diarization id is kept because it is the only thing distinguishing
      // one unidentified voice from another.
      names[speakerLabel] = `${label} (${speakerLabel})`;
      continue;
    }

    if (total === 1) {
      names[speakerLabel] = label;
      continue;
    }

    const ordinal = (seen.get(role) ?? 0) + 1;
    seen.set(role, ordinal);
    names[speakerLabel] = `${label} ${ordinal}`;
  }

  return names;
};
