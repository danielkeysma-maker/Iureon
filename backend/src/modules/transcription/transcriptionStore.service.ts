import { supabase } from '../../config/supabase.config';
import type { TranscriptSegment, TranscriptionResult, SpeakerRole } from './types';

export interface StoredTranscription {
  id: string;
  firm_id: string;
  user_email: string;
  kind: string;
  title: string;
  source_file_name: string;
  full_text: string;
  segments: TranscriptSegment[];
  speaker_labels: string[];
  language: string | null;
  duration_seconds: number | null;
  model: string;
  transcribed_at: string;
  saved_at: string;
  updated_at: string;
}

/**
 * Persists transcripts. Never the audio.
 *
 * WHY THIS EXISTS. The transcript used to live only in the browser: closing the
 * tab lost a two-hour hearing, and recovering it meant uploading the recording
 * again and paying for the transcription a second time. The write happens as
 * soon as the provider answers, on the server, so the browser can disappear
 * mid-request without costing anything.
 *
 * WHY NO AUDIO. A two-hour hearing is ~50 MB; its transcript ~300 KB. Storing
 * the recording is cheap in money and expensive in kind: privileged material
 * accumulating with no expiry, for a problem the text already solves. The
 * upload stays in memory and is discarded — see `multer.memoryStorage()` in the
 * routes, which is there for the same reason.
 */
export class TranscriptionStore {
  async save(
    firmId: string,
    userEmail: string,
    title: string,
    sourceFileName: string,
    result: TranscriptionResult
  ): Promise<StoredTranscription | null> {
    if (!supabase) {
      console.warn('[TRANSCRIPTION] Supabase no configurado: el transcrito no se guarda.');
      return null;
    }

    const { data, error } = await supabase
      .from('transcriptions')
      .insert({
        firm_id: firmId,
        user_email: userEmail,
        kind: result.kind,
        title,
        source_file_name: sourceFileName,
        full_text: result.fullText,
        segments: result.segments,
        speaker_labels: result.speakerLabels,
        language: result.language,
        duration_seconds: result.durationSeconds,
        model: result.model,
        transcribed_at: result.transcribedAt
      })
      .select()
      .single();

    if (error) {
      // Surfaced, not swallowed: a transcript the lawyer believes is saved and
      // is not is worse than one they know they must copy out now.
      console.error('[TRANSCRIPTION] No se pudo guardar el transcrito:', error.message);
      return null;
    }

    return data as StoredTranscription;
  }

  async list(firmId: string, userEmail: string): Promise<StoredTranscription[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('firm_id', firmId)
      .eq('user_email', userEmail)
      .order('transcribed_at', { ascending: false });

    if (error) {
      console.error('[TRANSCRIPTION] Error al listar transcritos:', error.message);
      return [];
    }

    return (data ?? []) as StoredTranscription[];
  }

  /**
   * Stores the roles a human assigned to each anonymous voice.
   *
   * This is the half diarization cannot do: the provider knows two speakers
   * differ, never that one is the judge. Losing that mapping would throw away
   * the lawyer's own work and leave a transcript that cannot be cited.
   */
  async assignRoles(
    firmId: string,
    id: string,
    rolesByLabel: Record<string, SpeakerRole>
  ): Promise<StoredTranscription | null> {
    if (!supabase) return null;

    const { data: existing, error: readError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('firm_id', firmId)
      .eq('id', id)
      .single();

    if (readError || !existing) {
      console.error('[TRANSCRIPTION] Transcrito no encontrado para asignar roles.');
      return null;
    }

    const segments = ((existing as StoredTranscription).segments ?? []).map((segment) => ({
      ...segment,
      role: rolesByLabel[segment.speakerLabel] ?? segment.role
    }));

    const { data, error } = await supabase
      .from('transcriptions')
      .update({ segments, updated_at: new Date().toISOString() })
      .eq('firm_id', firmId)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TRANSCRIPTION] No se pudieron guardar los roles:', error.message);
      return null;
    }

    return data as StoredTranscription;
  }

  /**
   * Replaces the text of one intervention, keeping everything else intact.
   *
   * A transcript is a draft until a human reads it. The model wrote "desembarco"
   * for DESEMBARGO and "con recámaras" for CONFECÁMARAS — fluent, plausible, and
   * wrong in a way only a lawyer catches. Key terms make that rarer, never
   * impossible, so the person reading has to be able to fix it where they read
   * it.
   *
   * The correction persists, because the alternative is fixing the same word on
   * every visit. Speaker, role and timestamps are untouched: this edits what was
   * said, never who said it or when.
   */
  async editSegment(
    firmId: string,
    id: string,
    segmentIndex: number,
    text: string
  ): Promise<StoredTranscription | null> {
    if (!supabase) return null;

    const { data: existing, error: readError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('firm_id', firmId)
      .eq('id', id)
      .single();

    if (readError || !existing) {
      console.error('[TRANSCRIPTION] Transcrito no encontrado para editar.');
      return null;
    }

    const segments = [...(((existing as StoredTranscription).segments ?? []) as TranscriptSegment[])];

    if (segmentIndex < 0 || segmentIndex >= segments.length) {
      console.error(`[TRANSCRIPTION] Intervención ${segmentIndex} fuera de rango.`);
      return null;
    }

    segments[segmentIndex] = { ...segments[segmentIndex], text };

    const { data, error } = await supabase
      .from('transcriptions')
      .update({
        segments,
        // Kept in step so the copied text and the stored one never diverge.
        full_text: segments.map((segment) => segment.text).join('\n\n'),
        updated_at: new Date().toISOString()
      })
      .eq('firm_id', firmId)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TRANSCRIPTION] No se pudo guardar la corrección:', error.message);
      return null;
    }

    return data as StoredTranscription;
  }

  /**
   * Deletion is the firm's, by design. Privileged material must not outlive the
   * decision of whoever owns it.
   */
  async remove(firmId: string, id: string): Promise<boolean> {
    if (!supabase) return false;

    // `.select()` so the deleted rows come back and the count can be checked.
    // Without it, deleting another firm's transcript reported success: the
    // firm_id filter matched nothing, Postgres raised no error, and the API
    // answered "borrado" for a record that is still there. The isolation held —
    // the row survived — but the response lied about what had happened, and a
    // caller cannot tell "deleted" from "was never yours" .
    const { data, error } = await supabase
      .from('transcriptions')
      .delete()
      .eq('firm_id', firmId)
      .eq('id', id)
      .select('id');

    if (error) {
      console.error('[TRANSCRIPTION] No se pudo borrar el transcrito:', error.message);
      return false;
    }

    return (data?.length ?? 0) > 0;
  }
}

export const transcriptionStore = new TranscriptionStore();
