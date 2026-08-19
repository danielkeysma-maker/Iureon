import type { SpeakerRole, TranscriptSegment } from './types';

/**
 * Proposes a procedural role for each anonymous voice in a hearing.
 *
 * WHY THIS CAN WORK AT ALL. Diarization returns clusters — speaker_0,
 * speaker_1 — and never names them. But a Colombian audiencia announces its own
 * turns out loud: the judge grants the floor, opens and closes the session and
 * rules on objections; counsel address the bench before speaking; a witness is
 * sworn. Those formulas are IN THE TRANSCRIPT, so the role can be read from
 * what a voice says rather than from how it sounds.
 *
 * WHY IT PROPOSES AND NEVER ASSERTS. This is inference. A rehearsed phrase, a
 * quotation, or counsel reading the judge's order aloud will all trip a marker,
 * and a confident wrong attribution is the failure mode this codebase has spent
 * its life removing — a fabricated ruling, a fabricated vector, a fabricated
 * draft. So every proposal carries the exact phrase and second that produced it,
 * a voice with no marker stays DESCONOCIDO, and the lawyer confirms.
 *
 * WHY NOT AN LLM, FOR NOW. A model would absorb more variation, but its
 * evidence would be a summary of its own reasoning rather than a quote, it
 * costs tokens per hearing, and its failure mode is a plausible wrong answer
 * instead of silence. Deterministic markers are free, testable, and when they
 * fail they fail by proposing nothing.
 */

export interface RoleEvidence {
  /** The exact phrase that triggered the proposal, as transcribed. */
  phrase: string;
  /** Second in the recording where it was said, when the provider reported it. */
  atSeconds: number | null;
}

export interface RoleProposal {
  speakerLabel: string;
  proposedRole: SpeakerRole;
  /** Markers found for the winning role. More is stronger, never proof. */
  matches: number;
  evidence: RoleEvidence[];
}

interface Marker {
  role: SpeakerRole;
  pattern: RegExp;
  /**
   * Structural markers outweigh vocabulary ones. Whoever hands out the floor is
   * presiding regardless of the words chosen; saying "despacho" is much weaker,
   * since everyone in the room says it.
   */
  weight: number;
}

/**
 * First-person markers only: what a voice reveals about ITSELF.
 *
 * Deliberately excluded are terms of address — "señor apoderado", "doctora" —
 * because they identify whoever is being spoken TO, not the speaker, and using
 * them would label the judge as counsel every time they give someone the floor.
 * Resolving the addressee needs turn-order reasoning this version does not do.
 */
const MARKERS: Marker[] = [
  // Presiding. Granting the floor is the strongest signal in a hearing: only
  // whoever runs it can hand out turns.
  { role: 'JUEZ', pattern: /\b(se le concede|concedo)\s+el\s+uso\s+de\s+la\s+palabra\b/i, weight: 5 },
  { role: 'JUEZ', pattern: /\btiene\s+(usted\s+)?la\s+palabra\b/i, weight: 5 },
  { role: 'JUEZ', pattern: /\bse\s+declara\s+(abierta|cerrada)\s+la\s+audiencia\b/i, weight: 5 },
  { role: 'JUEZ', pattern: /\bse\s+levanta\s+la\s+(sesión|audiencia)\b/i, weight: 4 },
  { role: 'JUEZ', pattern: /\bobjeci[óo]n\s+(no\s+)?(próspera|prospera|declarada)\b/i, weight: 4 },
  { role: 'JUEZ', pattern: /\beste\s+despacho\s+(ordena|dispone|resuelve|decide)\b/i, weight: 4 },
  { role: 'JUEZ', pattern: /\bs[íi]rvase\s+(usted\s+)?(identificarse|responder)\b/i, weight: 3 },

  // Addressing the bench. Whoever asks the despacho for something is not it.
  { role: 'ABOGADO', pattern: /\bcon\s+(la\s+)?venia\s+del\s+despacho\b/i, weight: 4 },
  { role: 'ABOGADO', pattern: /\bsolicito\s+al\s+despacho\b/i, weight: 3 },
  { role: 'ABOGADO', pattern: /\bse[ñn]or[a]?\s+juez\b/i, weight: 3 },

  // Self-identification, which Colombian hearings do on the record at the start.
  /*
   * PRIMERA PERSONA OBLIGATORIA, y esto costó una propuesta abiertamente falsa.
   *
   * El patrón anterior era `apoderado de la parte demandada` a secas, y en una
   * audiencia real la JUEZA lo dijo tres veces narrando — "como lo denomina el
   * apoderado de la parte demandada", "la solicitud allegada por el apoderado
   * de la parte demandada" — así que el proponedor la etiquetó como el
   * apoderado de la contraparte, con tres citas de respaldo y aire de certeza.
   *
   * Es la misma trampa que ya estaba prevista para los tratamientos: nombrar a
   * alguien habla de esa persona, no de quien habla. Quien preside narra lo que
   * hacen los demás durante toda la diligencia, así que su transcrito está lleno
   * de los roles ajenos.
   *
   * Ahora exige que la voz se atribuya el rol a sí misma: "soy", "actúo como",
   * "en calidad de", "me presento como". Una identificación sin esas fórmulas no
   * se propone — que es preferible a proponer al juez como apoderado.
   */
  {
    role: 'APODERADO_DEMANDANTE',
    pattern:
      /\b(soy|actúo|actuo|me\s+presento|en\s+calidad\s+de|en\s+mi\s+calidad\s+de)\s+(\w+\s+){0,3}apoderad[oa]\s+(judicial\s+)?(de\s+la\s+parte\s+)?(demandante|actora|accionante)\b/i,
    weight: 6
  },
  {
    role: 'APODERADO_DEMANDADO',
    pattern:
      /\b(soy|actúo|actuo|me\s+presento|en\s+calidad\s+de|en\s+mi\s+calidad\s+de)\s+(\w+\s+){0,3}apoderad[oa]\s+(judicial\s+)?(de\s+la\s+parte\s+)?(demandada|accionada)\b/i,
    weight: 6
  },
  {
    role: 'FISCAL',
    pattern: /\b(soy|actúo|actuo|me\s+presento|en\s+calidad\s+de|en\s+mi\s+calidad\s+de|represento\s+a)\s+(\w+\s+){0,3}fiscal[ía]?\s*(\w+\s+)?delegad[oa]?\b/i,
    weight: 5
  },

  // Every one of these demands first person for the same reason the apoderado
  // markers do: whoever presides narrates what the others do, so a judge's
  // transcript is full of "el fiscal delegado manifestó" and "la secretaría del
  // juzgado certificará". Matching those would hand the bench somebody else's
  // role, which is precisely the failure a real hearing exposed.
  // Roles added after a lawyer pointed out the list held only half a hearing.
  // Each still needs a formula somebody says about THEMSELVES; a role with no
  // marker simply never gets proposed, which is the correct outcome.
  { role: 'DEFENSOR', pattern: /\b(soy|como)\s+(el\s+|la\s+)?defensor[a]?\b/i, weight: 6 },
  { role: 'DEFENSOR', pattern: /\bla\s+defensa\s+(solicita|se\s+opone|manifiesta)\b/i, weight: 4 },
  {
    role: 'DEFENSOR_PUEBLO',
    pattern: /\b(soy|actúo|actuo|en\s+representación\s+de|por)\s+(\w+\s+){0,3}(la\s+)?defensor[íi]a\s+del\s+pueblo\b/i,
    weight: 5
  },
  {
    role: 'REPRESENTANTE_VICTIMAS',
    pattern: /\brepresento\s+(a\s+)?(las?\s+)?v[íi]ctimas?\b/i,
    weight: 6
  },
  {
    role: 'SECRETARIO',
    pattern: /\b(soy|actúo|actuo|me\s+presento|en\s+calidad\s+de|en\s+mi\s+calidad\s+de|represento\s+a)\s+(\w+\s+){0,3}secretari[oa]\s+(del\s+)?(juzgado|despacho)\b/i,
    weight: 5
  },
  { role: 'INTERPRETE', pattern: /\b(soy|como)\s+(el\s+|la\s+)?int[ée]rprete\b/i, weight: 6 },
  {
    role: 'MINISTERIO_PUBLICO',
    pattern: /\b(soy|actúo|actuo|en\s+representación\s+de|por)\s+(\w+\s+){0,3}(el\s+)?(agente\s+del\s+)?ministerio\s+p[úu]blico\b/i,
    weight: 5
  },
  { role: 'PERITO', pattern: /\b(rindo|como)\s+(mi\s+)?(dictamen|peritaje)\b/i, weight: 5 },

  // The oath answer marks the person being sworn, not the one administering it.
  { role: 'TESTIGO', pattern: /\bs[íi],?\s+(lo\s+)?juro\b/i, weight: 5 },
  { role: 'TESTIGO', pattern: /\bprometo\s+decir\s+(toda\s+)?la\s+verdad\b/i, weight: 4 }
];

/** Trimmed so the UI can show the quote without printing a whole intervention. */
const excerpt = (text: string, match: string): string => {
  const at = text.toLowerCase().indexOf(match.toLowerCase());
  if (at === -1) return text.slice(0, 120);

  const from = Math.max(0, at - 30);
  return `${from > 0 ? '…' : ''}${text.slice(from, at + match.length + 40).trim()}…`;
};

/**
 * Reads each voice's own words and proposes a role for it.
 *
 * A voice is only proposed when a marker actually fired: silence is the correct
 * answer for small talk, and a hearing where nobody says a procedural formula
 * should return no proposals rather than guesses.
 */
export const proposeRoles = (segments: TranscriptSegment[]): RoleProposal[] => {
  const byLabel = new Map<string, TranscriptSegment[]>();

  for (const segment of segments) {
    const list = byLabel.get(segment.speakerLabel) ?? [];
    list.push(segment);
    byLabel.set(segment.speakerLabel, list);
  }

  const proposals: RoleProposal[] = [];

  for (const [label, own] of byLabel) {
    const scores = new Map<SpeakerRole, { weight: number; evidence: RoleEvidence[] }>();

    for (const segment of own) {
      for (const marker of MARKERS) {
        const found = marker.pattern.exec(segment.text);
        if (!found) continue;

        const current = scores.get(marker.role) ?? { weight: 0, evidence: [] };
        current.weight += marker.weight;
        current.evidence.push({
          phrase: excerpt(segment.text, found[0]),
          atSeconds: segment.startSeconds
        });
        scores.set(marker.role, current);
      }
    }

    if (scores.size === 0) {
      proposals.push({ speakerLabel: label, proposedRole: 'DESCONOCIDO', matches: 0, evidence: [] });
      continue;
    }

    const ranked = [...scores.entries()].sort((a, b) => b[1].weight - a[1].weight);
    const [topRole, top] = ranked[0];

    // A tie is not a winner. Two roles with identical support means the voice
    // said something that fits both, and picking either would be a coin toss
    // wearing the clothes of an analysis.
    const tied = ranked.length > 1 && ranked[1][1].weight === top.weight;

    proposals.push({
      speakerLabel: label,
      proposedRole: tied ? 'DESCONOCIDO' : topRole,
      matches: tied ? 0 : top.evidence.length,
      // Evidence travels even when tied: the lawyer can read what was found and
      // decide, which beats being told nothing was.
      evidence: tied ? ranked.flatMap(([, entry]) => entry.evidence).slice(0, 4) : top.evidence.slice(0, 3)
    });
  }

  return proposals;
};
