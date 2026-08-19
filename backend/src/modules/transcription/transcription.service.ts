import { config } from '../../config/env.config';
import { DeepgramTranscriptionProvider } from './providers/deepgram.provider';
import { OpenAITranscriptionProvider } from './providers/openai.provider';
import {
  SUPPORTED_AUDIO_FORMATS,
  type RemoteTranscriptionRequest,
  type TranscriptionProvider,
  type TranscriptionRequest,
  type TranscriptionResult
} from './types';

/**
 * Picks the transcription backend, Deepgram first.
 *
 * Both diarize, and that is the whole selection criterion: a hearing transcript
 * without speaker separation cannot be cited. Deepgram leads because its free
 * credit covers roughly a year at the volumes we expect and it needs no account
 * a firm already pays for; OpenAI stays available for one that has a key.
 *
 * There is deliberately no third option here. Whisper — local, on Groq, or on
 * Cloudflare Workers AI — is cheaper still and does not diarize, so wiring it in
 * would mean returning a transcript that looks complete and silently is not.
 */
/**
 * Hard ceiling imposed by the host, not by us or the vendor.
 *
 * Vercel sets `VERCEL=1` in its runtime and rejects request bodies over 4.5 MB
 * on every plan, with no configuration to raise it. Anywhere else the platform
 * imposes nothing, so the provider's own limit stands.
 */
const PLATFORM_MAX_BODY_BYTES = process.env.VERCEL ? 4.5 * 1024 * 1024 : Number.MAX_SAFE_INTEGER;

const resolveProvider = (): TranscriptionProvider =>
  config.deepgram.enabled ? new DeepgramTranscriptionProvider() : new OpenAITranscriptionProvider();

export class TranscriptionUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptionUnavailableError';
  }
}

export class InvalidAudioError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAudioError';
  }
}

const extensionOf = (fileName: string): string =>
  (fileName.split('.').pop() ?? '').toLowerCase();

const megabytes = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(1);

/**
 * Transcribes hearing recordings and client interviews.
 *
 * Holds no vendor knowledge: it validates the audio, delegates to the
 * configured provider, and normalises failures into errors the controller can
 * turn into useful messages. Swapping provider means constructing this with a
 * different adapter.
 */
export class TranscriptionService {
  constructor(private readonly provider: TranscriptionProvider = resolveProvider()) {}

  /**
   * Whether the backend can fetch audio itself, which is what makes a real
   * hearing possible at all: the deployment rejects request bodies over 4.5 MB
   * and a two-hour recording is around 50.
   */
  get supportsRemoteAudio(): boolean {
    return typeof this.provider.transcribeFromUrl === 'function';
  }

  /** Transcribes audio the provider downloads from a signed, temporary link. */
  async transcribeFromUrl(url: string, request: RemoteTranscriptionRequest): Promise<TranscriptionResult> {
    if (!this.provider.isConfigured()) {
      throw new TranscriptionUnavailableError(
        'El motor de transcripción no está configurado. Falta DEEPGRAM_API_KEY en el servidor ' +
          '(o OPENAI_API_KEY si prefieres ese proveedor).'
      );
    }

    if (!this.provider.transcribeFromUrl) {
      throw new TranscriptionUnavailableError(
        `El proveedor "${this.provider.name}" no puede leer audio desde una URL, así que una ` +
          'grabación larga no tiene cómo llegarle. Configura Deepgram.'
      );
    }

    return this.provider.transcribeFromUrl(url, request);
  }

  /**
   * Largest file that can reach us THROUGH THE API, which is not the same as
   * what the provider accepts.
   *
   * Vercel functions reject any request body over 4.5 MB, so on that platform
   * the effective ceiling is theirs, not Deepgram's 200 MB. Reporting the
   * provider's number in production was a fresh lie of exactly the kind this
   * codebase keeps removing: the screen would promise 200 MB, the lawyer would
   * send a 50 MB hearing, and Vercel would answer 413 before our code ran —
   * an opaque failure pointing at nothing.
   *
   * The larger limit is still real, but only through storage: audio uploaded
   * straight to B2 never crosses this function. See `supportsRemoteAudio`.
   */
  get maxAudioBytes(): number {
    return Math.min(this.provider.maxAudioBytes, PLATFORM_MAX_BODY_BYTES);
  }

  /** What the provider itself accepts, reachable via the storage path. */
  get providerMaxAudioBytes(): number {
    return this.provider.maxAudioBytes;
  }

  isAvailable(): boolean {
    return this.provider.isConfigured();
  }

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResult> {
    // Input is validated before availability: a malformed upload is the
    // caller's to fix and the answer must not change depending on whether the
    // server happens to have credentials configured.
    this.validate(request);

    if (!this.provider.isConfigured()) {
      throw new TranscriptionUnavailableError(
        // Names the provider that is actually preferred. This said OPENAI_API_KEY
        // after Deepgram became the default, so a firm following the message
        // would have configured the wrong service and still had nothing work.
        'El motor de transcripción no está configurado. Falta DEEPGRAM_API_KEY en el servidor ' +
          '(o OPENAI_API_KEY si prefieres ese proveedor).'
      );
    }

    return this.provider.transcribe(request);
  }

  private validate(request: TranscriptionRequest): void {
    if (request.audio.length === 0) {
      throw new InvalidAudioError('El archivo de audio está vacío.');
    }

    const extension = extensionOf(request.fileName);

    if (!SUPPORTED_AUDIO_FORMATS.includes(extension as (typeof SUPPORTED_AUDIO_FORMATS)[number])) {
      throw new InvalidAudioError(
        `Formato "${extension || 'desconocido'}" no soportado. Formatos válidos: ${SUPPORTED_AUDIO_FORMATS.join(', ')}.`
      );
    }

    // The provider rejects anything above this, and a full hearing recording
    // routinely exceeds it. Splitting is not automatic yet, so the message has
    // to tell the user exactly what to do rather than fail opaquely.
    // Asked of the provider, not of a constant: the ceiling is a vendor fact,
    // and hardcoding OpenAI's 25 MB kept rejecting two-hour hearings long after
    // we moved to a backend that accepts them.
    const limit = this.provider.maxAudioBytes;

    if (request.audio.length > limit) {
      throw new InvalidAudioError(
        `El audio pesa ${megabytes(request.audio.length)} MB y el límite por archivo es ${megabytes(limit)} MB. ` +
          'Divide la grabación en partes (por ejemplo, por bloques de la audiencia) y súbelas por separado.'
      );
    }
  }
}
