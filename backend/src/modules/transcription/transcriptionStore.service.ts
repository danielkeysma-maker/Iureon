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
   * Cuts one intervention in two at a character offset, so the second half can
   * belong to somebody else.
   *
   * WHY THIS IS NECESSARY. Diarization cannot separate people who talk over each
   * other, and a hearing is full of that: the judge greets counsel and counsel
   * answers mid-sentence, so both land in one block labelled with one voice.
   * Deepgram's own documentation treats overlapping speech as a phenomenon to
   * detect rather than a defect to configure away, and `diarize_model=latest` is
   * already v2, the best available.
   *
   * Role assignment alone cannot fix it: roles attach to a diarization label, so
   * when two real people share `speaker_0` there is nothing to reassign. The cut
   * has to come first.
   *
   * Merging turns made this worse, not the misattribution itself: three short
   * mislabelled rows became one long paragraph, and half a paragraph cannot be
   * reassigned. This is the other half of that decision.
   */
  async splitSegment(
    firmId: string,
    id: string,
    segmentIndex: number,
    charOffset: number,
    newSpeakerLabel: string
  ): Promise<StoredTranscription | null> {
    if (!supabase) return null;

    const { data: existing, error: readError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('firm_id', firmId)
      .eq('id', id)
      .single();

    if (readError || !existing) {
      console.error('[TRANSCRIPTION] Transcrito no encontrado para dividir.');
      return null;
    }

    const segments = [...(((existing as StoredTranscription).segments ?? []) as TranscriptSegment[])];
    const target = segments[segmentIndex];

    if (!target) {
      console.error(`[TRANSCRIPTION] Intervención ${segmentIndex} fuera de rango.`);
      return null;
    }

    const antes = target.text.slice(0, charOffset).trim();
    const despues = target.text.slice(charOffset).trim();

    if (!antes || !despues) {
      // A cut at either end produces an empty intervention, which reads as a
      // voice that said nothing.
      console.error('[TRANSCRIPTION] La división dejaría una intervención vacía.');
      return null;
    }

    /*
     * Timestamps are split proportionally to the text, and that is an estimate
     * rather than a measurement — the words carry their own times but the stored
     * segment does not keep them. It is honest enough for navigation, which is
     * what a timestamp is for here, and better than giving the second half the
     * first one's start and implying they were said at once.
     */
    const inicio = target.startSeconds;
    const fin = target.endSeconds;
    const corte =
      inicio !== null && fin !== null
        ? inicio + (fin - inicio) * (antes.length / target.text.length)
        : null;

    segments.splice(
      segmentIndex,
      1,
      { ...target, text: antes, endSeconds: corte },
      {
        speakerLabel: newSpeakerLabel,
        /*
         * Inherits the role when the cut half is given to a voice already in the
         * transcript, and that case is the common one: cutting crosstalk usually
         * hands the tail back to somebody already in the room — most often the
         * judge, who was interrupted and then carried on.
         *
         * Forcing DESCONOCIDO here produced a visible bug: the judge came back
         * as a second, unidentified voice, and once the lawyer marked it JUEZ the
         * transcript read "Juez 1" and "Juez 2" for one person. Only a genuinely
         * new voice starts unassigned, because that is the case where nobody
         * knows yet whose it is.
         */
        role: segments.find((s) => s.speakerLabel === newSpeakerLabel)?.role ?? 'DESCONOCIDO',
        text: despues,
        startSeconds: corte,
        endSeconds: fin
      }
    );

    const { data, error } = await supabase
      .from('transcriptions')
      .update({
        segments,
        speaker_labels: [...new Set(segments.map((segment) => segment.speakerLabel))],
        updated_at: new Date().toISOString()
      })
      .eq('firm_id', firmId)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TRANSCRIPTION] No se pudo dividir la intervención:', error.message);
      return null;
    }

    return data as StoredTranscription;
  }

  /**
   * Moves one whole intervention to a different voice.
   *
   * WHY CUTTING IS NOT ENOUGH. `splitSegment` solves two people inside ONE
   * intervention. This is the other half of the same failure: diarization also
   * puts two people under one LABEL across separate interventions. A real
   * hearing showed it plainly — `speaker_1` said "mi nombre es Tomas Enrique
   * Wilches" at 01:04 and "Jose Omar Gaitan Guevara, abogado apoderado" at
   * 03:15. Two names, two people, one voice.
   *
   * Nothing could fix that before. Roles attach to the label, so naming
   * `speaker_1` named both; and the cut refuses a split that would leave an
   * empty half, which is exactly what moving a whole intervention asks for.
   *
   * The role travels with the destination, not with the text: an intervention
   * handed to a voice already in the hearing takes that voice's role, and one
   * handed to a new voice starts DESCONOCIDO because nobody has said yet who it
   * is.
   */
  async reassignSpeaker(
    firmId: string,
    id: string,
    segmentIndex: number,
    speakerLabel: string
  ): Promise<StoredTranscription | null> {
    if (!supabase) return null;

    const { data: existing, error: readError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('firm_id', firmId)
      .eq('id', id)
      .single();

    if (readError || !existing) {
      console.error('[TRANSCRIPTION] Transcrito no encontrado para reasignar la voz.');
      return null;
    }

    const segments = [...(((existing as StoredTranscription).segments ?? []) as TranscriptSegment[])];
    const target = segments[segmentIndex];

    if (!target) {
      console.error(`[TRANSCRIPTION] Intervención ${segmentIndex} fuera de rango.`);
      return null;
    }

    if (target.speakerLabel === speakerLabel) {
      // Already there. Reported as done rather than as an error: the caller
      // asked for a state, and the state holds.
      return existing as StoredTranscription;
    }

    const role = segments.find((s) => s.speakerLabel === speakerLabel)?.role ?? 'DESCONOCIDO';
    segments[segmentIndex] = { ...target, speakerLabel, role };

    /*
     * Recomputed from the segments rather than appended to, because moving the
     * last intervention of a voice retires that voice. Leaving a label with no
     * text behind would keep offering a speaker who never speaks — in the role
     * panel, in the cut selector, and in the numbering that turns three
     * witnesses into "Testigo 1, 2, 3".
     */
    const speakerLabels = [...new Set(segments.map((segment) => segment.speakerLabel))];

    const { data, error } = await supabase
      .from('transcriptions')
      .update({ segments, speaker_labels: speakerLabels, updated_at: new Date().toISOString() })
      .eq('firm_id', firmId)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TRANSCRIPTION] No se pudo reasignar la voz:', error.message);
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
