import { config } from '../../../config/env.config';
import type {
  TranscriptSegment,
  TranscriptionProvider,
  TranscriptionRequest,
  TranscriptionResult
} from '../types';

/**
 * Deepgram adapter for the transcription port.
 *
 * Chosen over the alternatives for one reason that matters to a hearing: it
 * separates speakers. Whisper — local, on Groq, or on Cloudflare Workers AI —
 * transcribes but does not diarize, and a hearing transcript without speaker
 * separation is a wall of text nobody can cite in a brief. Getting diarization
 * out of Whisper needs a second model (pyannote), which needs a paid container
 * and a GPU to be usable.
 *
 * Nova-3 supports Spanish including Latin American dialects, and Deepgram does
 * not train on customer audio unless the account opts into their model
 * improvement programme. Colombia declared the United States a country with an
 * adequate level of data protection (SIC, Circular Externa 5 de 2017), so the
 * transfer is lawful; the firm still has to be told who processes its data,
 * which is why the sub-processor list is part of the product and not a footnote.
 */
const MODEL = 'nova-3';
const DEFAULT_LANGUAGE = 'es';

/**
 * `diarize=true` is deprecated in favour of `diarize_model`, per Deepgram's own
 * reference. Using the deprecated flag still works today and stops working on
 * their schedule, not ours.
 */
const DIARIZATION_MODEL = 'latest';

const ENDPOINT = 'https://api.deepgram.com/v1/listen';

interface DeepgramUtterance {
  start?: number;
  end?: number;
  transcript?: string;
  /** Diarization returns an integer per voice, not a name. */
  speaker?: number;
}

interface DeepgramResponse {
  metadata?: { duration?: number };
  results?: {
    channels?: { alternatives?: { transcript?: string }[]; detected_language?: string }[];
    utterances?: DeepgramUtterance[];
  };
}

/**
 * Utterances carry the turn boundaries; `speaker` is an anonymous cluster id.
 * The procedural role stays DESCONOCIDO here on purpose — diarization knows
 * that two voices differ, never that one of them is the judge. A human maps
 * them, and until then the transcript says so.
 */
const toSegments = (utterances: DeepgramUtterance[]): TranscriptSegment[] =>
  utterances.map((utterance) => ({
    speakerLabel: utterance.speaker === undefined ? 'speaker_unknown' : `speaker_${utterance.speaker}`,
    role: 'DESCONOCIDO' as const,
    text: (utterance.transcript ?? '').trim(),
    startSeconds: utterance.start ?? null,
    endSeconds: utterance.end ?? null
  }));

/**
 * Domain vocabulary goes in as key terms, which is what the parameter exists
 * for. Colombian legal wording — "caducidad", "sustanciador", a radicado read
 * aloud — is mis-transcribed often enough that this is not a nicety, and party
 * names are the words a lawyer will notice getting wrong first.
 */
const toKeyTerms = (contextPrompt?: string): string[] => {
  if (!contextPrompt) return [];

  return [
    ...new Set(
      contextPrompt
        .split(/[,;\n]/)
        .map((term) => term.trim())
        .filter((term) => term.length > 2 && term.length < 80)
    )
  ].slice(0, 100);
};

export class DeepgramTranscriptionProvider implements TranscriptionProvider {
  readonly name = 'deepgram';

  isConfigured(): boolean {
    return Boolean(config.deepgram?.apiKey);
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    const params = new URLSearchParams({
      model: MODEL,
      language: request.language ?? DEFAULT_LANGUAGE,
      diarize_model: DIARIZATION_MODEL,
      utterances: 'true',
      punctuate: 'true',
      smart_format: 'true'
    });

    for (const term of toKeyTerms(request.contextPrompt)) {
      params.append('keyterm', term);
    }

    const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${config.deepgram.apiKey}`,
        'Content-Type': request.mimeType
      },
      body: new Uint8Array(request.audio)
    });

    if (!response.ok) {
      // Surfaced with the provider's own wording: "audio too short" and "quota
      // exhausted" need different actions from the lawyer, and a generic
      // failure message hides which one happened.
      const detail = await response.text().catch(() => '');
      throw new Error(`Deepgram respondió ${response.status}: ${detail.slice(0, 300)}`);
    }

    const payload = (await response.json()) as DeepgramResponse;
    const utterances = payload.results?.utterances ?? [];
    const segments = toSegments(utterances);

    const channelTranscript = payload.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    return {
      kind: request.kind,
      fullText: channelTranscript ?? segments.map((segment) => segment.text).join('\n'),
      segments,
      speakerLabels: [...new Set(segments.map((segment) => segment.speakerLabel))],
      language: payload.results?.channels?.[0]?.detected_language ?? request.language ?? DEFAULT_LANGUAGE,
      durationSeconds: payload.metadata?.duration ?? null,
      model: `${MODEL}+diarize:${DIARIZATION_MODEL}`,
      transcribedAt: new Date().toISOString()
    };
  }
}
