import { config } from '../../../config/env.config';
import { COLOMBIAN_LEGAL_TERMS } from '../legalVocabulary';
import type {
  RemoteTranscriptionRequest,
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
 * Joins consecutive utterances by the same voice into one intervention.
 *
 * Deepgram ends an utterance at every pause, so a single continuous answer came
 * back as seven rows — "de", "posterior a", "a la terminación por captura" —
 * each stamped and labelled as though the speaker had taken the floor again.
 * That is a segmentation by breath, and a transcript that gets quoted in a
 * filing needs one by turn: an intervention is what someone said before
 * somebody else spoke.
 *
 * Only ADJACENT utterances merge, so a genuine exchange is never collapsed —
 * anything the other party says sits between them and breaks the run. The merged
 * segment keeps the first start and the last end, which is exactly the span of
 * the turn, and the role proposer still sees the same words.
 */
export const mergeConsecutive = (segments: TranscriptSegment[]): TranscriptSegment[] =>
  segments.reduce<TranscriptSegment[]>((merged, segment) => {
    const previous = merged[merged.length - 1];

    if (previous && previous.speakerLabel === segment.speakerLabel) {
      previous.text = `${previous.text} ${segment.text}`.trim();
      previous.endSeconds = segment.endSeconds ?? previous.endSeconds;
      return merged;
    }

    return [...merged, { ...segment }];
  }, []);

/**
 * What the model is told to expect, in two layers.
 *
 * The firm's own context comes FIRST because it is unique to one hearing —
 * party names, the court, a radicado read aloud — and the model has no chance
 * at those otherwise. The standing Colombian legal vocabulary follows, because
 * a lawyer cannot be expected to declare "desaprehensión" in advance: they only
 * learn it was needed by reading the word "desaparición" in their own
 * transcript, which is exactly how this was found.
 *
 * Deepgram's guidance is 20-50 terms against a 500-token ceiling. The standing
 * list is 48 terms and roughly 150 tokens, so a firm's context always fits
 * alongside it rather than competing for room.
 */
const KEYTERM_CAP = 60;

const toKeyTerms = (contextPrompt?: string): string[] => {
  const fromFirm = (contextPrompt ?? '')
    .split(/[,;\n]/)
    .map((term) => term.trim())
    .filter((term) => term.length > 2 && term.length < 80);

  return [...new Set([...fromFirm, ...COLOMBIAN_LEGAL_TERMS])].slice(0, KEYTERM_CAP);
};

export class DeepgramTranscriptionProvider implements TranscriptionProvider {
  readonly name = 'deepgram';

  /**
   * Deepgram accepts up to 2 GB. This caps well below that on purpose.
   *
   * The upload is held in RAM — `multer.memoryStorage()`, chosen so privileged
   * recordings never touch the server's disk — and a 2 GB buffer would trade
   * that guarantee for an out-of-memory crash. 200 MB clears a two-hour hearing
   * at ordinary speech bitrates with room to spare, which is the case this
   * feature exists for.
   */
  readonly maxAudioBytes = 200 * 1024 * 1024;

  isConfigured(): boolean {
    return Boolean(config.deepgram?.apiKey);
  }

  /** Shared by both paths so the two cannot drift into different settings. */
  private buildParams(request: RemoteTranscriptionRequest): URLSearchParams {
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

    return params;
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    const response = await fetch(`${ENDPOINT}?${this.buildParams(request).toString()}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${config.deepgram.apiKey}`,
        'Content-Type': request.mimeType
      },
      body: new Uint8Array(request.audio)
    });

    return this.toResult(await this.readResponse(response), request.kind);
  }

  /**
   * Hands Deepgram a URL and lets it fetch the audio itself.
   *
   * This is the path a real hearing takes. Vercel functions reject bodies over
   * 4.5 MB and a two-hour recording is around 50, so the audio never travels
   * through the API: the browser uploads it to B2, and only a signed, temporary
   * link crosses the wire. The caller deletes the object afterwards — the
   * detour through storage is acceptable only because it ends.
   */
  async transcribeFromUrl(url: string, request: RemoteTranscriptionRequest): Promise<TranscriptionResult> {
    const response = await fetch(`${ENDPOINT}?${this.buildParams(request).toString()}`, {
      method: 'POST',
      headers: {
        Authorization: `Token ${config.deepgram.apiKey}`,
        // Required for the URL form. Without it Deepgram reads the JSON as audio
        // and answers "corrupt or unsupported data", which points at the file.
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });

    return this.toResult(await this.readResponse(response), request.kind);
  }

  private async readResponse(response: Response): Promise<DeepgramResponse> {

    if (!response.ok) {
      // Surfaced with the provider's own wording: "audio too short" and "quota
      // exhausted" need different actions from the lawyer, and a generic
      // failure message hides which one happened.
      const detail = await response.text().catch(() => '');
      throw new Error(`Deepgram respondió ${response.status}: ${detail.slice(0, 300)}`);
    }

    return (await response.json()) as DeepgramResponse;
  }

  private toResult(payload: DeepgramResponse, kind: TranscriptionRequest['kind']): TranscriptionResult {
    const utterances = payload.results?.utterances ?? [];
    const segments = mergeConsecutive(toSegments(utterances));

    const channelTranscript = payload.results?.channels?.[0]?.alternatives?.[0]?.transcript;

    return {
      kind,
      fullText: channelTranscript ?? segments.map((segment) => segment.text).join('\n'),
      segments,
      speakerLabels: [...new Set(segments.map((segment) => segment.speakerLabel))],
      language: payload.results?.channels?.[0]?.detected_language ?? DEFAULT_LANGUAGE,
      durationSeconds: payload.metadata?.duration ?? null,
      model: `${MODEL}+diarize:${DIARIZATION_MODEL}`,
      transcribedAt: new Date().toISOString()
    };
  }
}
