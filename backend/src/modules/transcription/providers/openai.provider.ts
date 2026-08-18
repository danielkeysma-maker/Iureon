import OpenAI, { toFile } from 'openai';
import { config } from '../../../config/env.config';
import type {
  TranscriptSegment,
  TranscriptionProvider,
  TranscriptionRequest,
  TranscriptionResult
} from '../types';

/**
 * Diarizing model: returns who spoke as well as what was said. A hearing
 * transcript without speaker separation is a wall of text that cannot be cited,
 * so this is the default rather than an option.
 */
const DIARIZING_MODEL = 'gpt-4o-transcribe-diarize';

/** Diarization over audio longer than 30s requires an explicit chunking strategy. */
const CHUNKING_STRATEGY = 'auto';

const DEFAULT_LANGUAGE = 'es';

interface DiarizedSegment {
  speaker?: string;
  text?: string;
  start?: number;
  end?: number;
}

interface DiarizedResponse {
  text?: string;
  segments?: DiarizedSegment[];
  duration?: number;
  language?: string;
}

const toSegments = (raw: DiarizedSegment[]): TranscriptSegment[] =>
  raw.map((segment) => ({
    speakerLabel: segment.speaker ?? 'speaker_unknown',
    // Mapping a provider label to a procedural role needs human knowledge of
    // who was in the room; the UI asks for it after transcription.
    role: 'DESCONOCIDO' as const,
    text: (segment.text ?? '').trim(),
    startSeconds: segment.start ?? null,
    endSeconds: segment.end ?? null
  }));

/**
 * OpenAI adapter for the transcription port.
 *
 * Everything vendor-specific — model ids, response shape, the SDK itself —
 * is contained here. The service never imports this file's internals.
 */
export class OpenAITranscriptionProvider implements TranscriptionProvider {
  readonly name = 'openai';

  /** OpenAI rejects anything larger; a two-hour hearing does not fit. */
  readonly maxAudioBytes = 25 * 1024 * 1024;

  private client: OpenAI | null = null;

  isConfigured(): boolean {
    return Boolean(config.openAI.apiKey);
  }

  private getClient(): OpenAI {
    if (!this.client) {
      this.client = new OpenAI({ apiKey: config.openAI.apiKey });
    }

    return this.client;
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    const file = await toFile(request.audio, request.fileName, { type: request.mimeType });

    const response = (await this.getClient().audio.transcriptions.create({
      file,
      model: DIARIZING_MODEL,
      response_format: 'diarized_json',
      chunking_strategy: CHUNKING_STRATEGY,
      language: request.language ?? DEFAULT_LANGUAGE,
      prompt: request.contextPrompt
    } as any)) as unknown as DiarizedResponse;

    const segments = toSegments(response.segments ?? []);
    const speakerLabels = [...new Set(segments.map((s) => s.speakerLabel))];

    return {
      kind: request.kind,
      fullText: response.text ?? segments.map((s) => s.text).join('\n'),
      segments,
      speakerLabels,
      language: response.language ?? request.language ?? DEFAULT_LANGUAGE,
      durationSeconds: response.duration ?? null,
      model: DIARIZING_MODEL,
      transcribedAt: new Date().toISOString()
    };
  }
}
