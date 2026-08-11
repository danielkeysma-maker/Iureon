import { OpenAITranscriptionProvider } from './providers/openai.provider';
import {
  MAX_AUDIO_BYTES,
  SUPPORTED_AUDIO_FORMATS,
  type TranscriptionProvider,
  type TranscriptionRequest,
  type TranscriptionResult
} from './types';

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
  constructor(private readonly provider: TranscriptionProvider = new OpenAITranscriptionProvider()) {}

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
        'El motor de transcripción no está configurado. Falta OPENAI_API_KEY en el servidor.'
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
    if (request.audio.length > MAX_AUDIO_BYTES) {
      throw new InvalidAudioError(
        `El audio pesa ${megabytes(request.audio.length)} MB y el límite por archivo es ${megabytes(MAX_AUDIO_BYTES)} MB. ` +
          'Divide la grabación en partes (por ejemplo, por bloques de la audiencia) y súbelas por separado.'
      );
    }
  }
}
