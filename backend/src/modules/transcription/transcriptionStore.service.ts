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
  /** El resumen y los hechos relevantes generados por el motor, si ya se pidieron. */
  resumen?: unknown;
  /*
   * Una audiencia se REVISA: la transcripcion automatica no es un acta hasta
   * que un humano la lee, y "ACTA_LISTA" solo lo da una persona. Una entrevista
   * se DECIDE: se toma el caso o se declina con motivo. Los dos estados nacen
   * pendientes y ningun proceso automatico los cambia.
   */
  estado_revision?: 'POR_REVISAR' | 'ACTA_LISTA';
  revisada_por?: string | null;
  revisada_el?: string | null;
  decision?: 'SIN_DECIDIR' | 'TOMADO' | 'DECLINADO';
  decision_motivo?: string | null;
  decidido_por?: string | null;
  decidido_el?: string | null;
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
    result: TranscriptionResult,
    /** Hora en que el entrevistado autorizo la grabacion, si el cliente la mando. */
    autorizoGrabacionEl?: string | null
  ): Promise<StoredTranscription | null> {
    if (!supabase) {
      console.warn('[TRANSCRIPTION] Supabase no configurado: el transcrito no se guarda.');
      return null;
    }

    const fila: Record<string, unknown> = {
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
    };
    /*
     * Solo cuando hay valor. Mandar la llave con null rompe TODO guardado en la
     * ventana entre el deploy y la migracion ("column not found in schema
     * cache") — y una audiencia sin autorizacion que registrar no necesita la
     * columna para guardarse.
     */
    if (autorizoGrabacionEl) fila.autorizo_grabacion_el = autorizoGrabacionEl;

    let { data, error } = await supabase.from('transcriptions').insert(fila).select().single();

    if (error && autorizoGrabacionEl && /autorizo_grabacion_el/.test(error.message)) {
      /*
       * La columna aun no existe. Se reintenta SIN la constancia y se grita en
       * el log: perder la hora de autorizacion es malo; perder la transcripcion
       * entera de una entrevista de 40 minutos es peor. Corran la migracion.
       */
      console.error(
        '[TRANSCRIPTION] La columna autorizo_grabacion_el no existe todavia: la constancia de esta entrevista NO quedo guardada. Corra migration-revision-y-autorizacion.sql.'
      );
      delete fila.autorizo_grabacion_el;
      ({ data, error } = await supabase.from('transcriptions').insert(fila).select().single());
    }

    if (error) {
      // Surfaced, not swallowed: a transcript the lawyer believes is saved and
      // is not is worse than one they know they must copy out now.
      console.error('[TRANSCRIPTION] No se pudo guardar el transcrito:', error.message);
      return null;
    }

    return data as StoredTranscription;
  }

  /**
   * The firm's transcripts of ONE kind.
   *
   * Filtering by kind is not tidiness: without it the interview module listed
   * the firm's hearings and the hearings module listed its interviews. Two
   * screens sharing an engine must not share a filing cabinet — an audiencia of
   * a juzgado has no business appearing under a client's interviews, and the
   * reverse is worse, since an interview is a private conversation and a hearing
   * is a public act.
   */
  /*
   * DE LA FIRMA, NO DE LA PERSONA. Filtraba por user_email, y eso escondia el
   * trabajo de la firma de si misma: la audiencia que subio un socio era
   * invisible para quien tenia que citarla — el mismo defecto que ya se corrigio
   * en borradores. Quien la subio sigue en cada fila (`user_email`), como dato
   * y no como muro.
   */
  async list(
    firmId: string,
    kind?: TranscriptionResult['kind']
  ): Promise<StoredTranscription[]> {
    if (!supabase) return [];

    let query = supabase
      .from('transcriptions')
      .select('*')
      .eq('firm_id', firmId);

    if (kind) query = query.eq('kind', kind);

    const { data, error } = await query.order('transcribed_at', { ascending: false });

    if (error) {
      console.error('[TRANSCRIPTION] Error al listar transcritos:', error.message);
      return [];
    }

    return (data ?? []) as StoredTranscription[];
  }

  /** Una transcripcion de la firma, completa. Para el resumen y para releer. */
  async get(firmId: string, id: string): Promise<StoredTranscription | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('firm_id', firmId)
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return data as StoredTranscription;
  }

  /**
   * Guarda el resumen generado, para que abrir la transcripcion manana no
   * vuelva a pagar la llamada al modelo. Falla en silencio: un resumen que no
   * se pudo guardar sigue siendo un resumen valido en pantalla.
   */
  async saveResumen(firmId: string, id: string, resumen: unknown): Promise<void> {
    if (!supabase) return;

    const { error } = await supabase
      .from('transcriptions')
      .update({ resumen, updated_at: new Date().toISOString() })
      .eq('firm_id', firmId)
      .eq('id', id);

    if (error) console.error('[TRANSCRIPTION] No se pudo guardar el resumen:', error.message);
  }

  /**
   * El acto humano que convierte una transcripcion en acta. Registra quien y
   * cuando, porque ese acto es el que la vuelve citable.
   */
  async marcarRevision(
    firmId: string,
    id: string,
    estado: 'POR_REVISAR' | 'ACTA_LISTA',
    por: string
  ): Promise<StoredTranscription | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('transcriptions')
      .update(
        estado === 'ACTA_LISTA'
          ? { estado_revision: estado, revisada_por: por, revisada_el: new Date().toISOString() }
          : // Volver a revisar borra la firma anterior: un acta que dejo de
            // estar lista no puede seguir diciendo quien la aprobo.
            { estado_revision: estado, revisada_por: null, revisada_el: null }
      )
      .eq('firm_id', firmId)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('[TRANSCRIPTION] No se pudo marcar la revision:', error?.message);
      return null;
    }
    return data as StoredTranscription;
  }

  /**
   * La decision que cierra una entrevista. DECLINADO exige motivo — lo exige
   * tambien la base con un CHECK, pero fallar aqui da un mensaje en espanol en
   * vez de un error de constraint.
   */
  async decidir(
    firmId: string,
    id: string,
    decision: 'SIN_DECIDIR' | 'TOMADO' | 'DECLINADO',
    motivo: string | null,
    por: string
  ): Promise<StoredTranscription | null> {
    if (!supabase) return null;

    if (decision === 'DECLINADO' && !motivo) {
      throw new Error('Declinar exige un motivo: la firma necesita saber qué está rechazando.');
    }

    const { data, error } = await supabase
      .from('transcriptions')
      .update({
        decision,
        decision_motivo: decision === 'DECLINADO' ? motivo : null,
        decidido_por: decision === 'SIN_DECIDIR' ? null : por,
        decidido_el: decision === 'SIN_DECIDIR' ? null : new Date().toISOString()
      })
      .eq('firm_id', firmId)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('[TRANSCRIPTION] No se pudo registrar la decision:', error?.message);
      return null;
    }
    return data as StoredTranscription;
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
  /**
   * Marca una intervencion como revisada (o le quita la marca). Es el grano
   * fino de la regla "una transcripcion no es un acta hasta que un humano la
   * lee": la fraccion 32/58 sale de contar estas marcas, no de estimarla.
   */
  async marcarSegmentoRevisado(
    firmId: string,
    id: string,
    segmentIndex: number,
    revisada: boolean
  ): Promise<StoredTranscription | null> {
    if (!supabase) return null;

    const { data: existing, error: readError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('firm_id', firmId)
      .eq('id', id)
      .single();

    if (readError || !existing) return null;

    const segments = [...(((existing as StoredTranscription).segments ?? []) as TranscriptSegment[])];
    if (segmentIndex < 0 || segmentIndex >= segments.length) return null;

    segments[segmentIndex] = { ...segments[segmentIndex], revisada };

    const { data, error } = await supabase
      .from('transcriptions')
      .update({ segments, updated_at: new Date().toISOString() })
      .eq('firm_id', firmId)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) return null;
    return data as StoredTranscription;
  }

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
   * Names a voice, or clears the name.
   *
   * WHY A NAME AND NOT JUST A ROLE. A role makes a transcript readable; a name
   * makes it citable. "El apoderado de la demandada manifestó" is a summary,
   * "el doctor José Omar Gaitán Guevara manifestó" is a quotation a judge can
   * check against the recording. Teams shows names because everyone joins with
   * an account; from audio alone the app has to be told — either by accepting
   * what the voice said about itself, or by a lawyer who was in the room.
   *
   * An empty name removes it rather than storing a blank, so the transcript
   * falls back to the role instead of showing a nameless heading.
   */
  async assignSpeakerName(
    firmId: string,
    id: string,
    speakerLabel: string,
    name: string
  ): Promise<StoredTranscription | null> {
    if (!supabase) return null;

    const { data: existing, error: readError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('firm_id', firmId)
      .eq('id', id)
      .single();

    if (readError || !existing) {
      console.error('[TRANSCRIPTION] Transcrito no encontrado para nombrar la voz.');
      return null;
    }

    const limpio = name.trim();

    const segments = ((existing as StoredTranscription).segments ?? []).map((segment) => {
      if (segment.speakerLabel !== speakerLabel) return segment;

      if (!limpio) {
        const { speakerName: _descartado, ...resto } = segment;
        return resto as TranscriptSegment;
      }

      return { ...segment, speakerName: limpio };
    });

    const { data, error } = await supabase
      .from('transcriptions')
      .update({ segments, updated_at: new Date().toISOString() })
      .eq('firm_id', firmId)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[TRANSCRIPTION] No se pudo guardar el nombre:', error.message);
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
