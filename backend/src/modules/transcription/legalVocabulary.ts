/**
 * Colombian legal vocabulary sent to the transcription model on every recording.
 *
 * WHY THIS EXISTS. A lawyer read a real transcript and found "desembarco" for
 * DESEMBARGO, "desaparición" for DESAPREHENSIÓN, and "con recámaras" for
 * CONFECÁMARAS. None of those are obscure words in a Colombian proceeding; they
 * are simply absent from a general Spanish model, which then reaches for the
 * nearest everyday word and produces something that reads fluently and means
 * something else.
 *
 * The provider takes a `keyterm` list for exactly this, and the module already
 * passed one — but only from the "Contexto del caso" field the firm fills in.
 * That is the wrong place for it: nobody types "desaprehensión" as context
 * before knowing it will be mis-transcribed. The product holds the procedural
 * knowledge; the firm should not have to supply it.
 *
 * WHAT BELONGS HERE. Terms that are (a) specific to Colombian practice and
 * (b) plausibly mis-heard as an ordinary word. Deepgram's guidance is 20-50
 * terms against a 500-token ceiling, and its own advice is to avoid generic
 * words — "proceso" or "documento" would dilute the list without helping.
 *
 * The firm's own context still goes first: party names and a radicado are
 * unique to one hearing and the model has no chance at them otherwise.
 */
export const COLOMBIAN_LEGAL_TERMS: string[] = [
  // The three that were actually observed failing, and their neighbours.
  'desembargo',
  'desaprehensión',
  'Confecámaras',
  'embargo',
  'secuestro de bienes',

  // Institutions a hearing names constantly, several of which are portmanteaus
  // a general model has never seen.
  'RUNT',
  'DIAN',
  'INPEC',
  'Cámara de Comercio',
  'Registraduría',
  'Rama Judicial',
  'Fiscalía General de la Nación',
  'Procuraduría',
  'Defensoría del Pueblo',
  'Superintendencia de Sociedades',
  'Consejo Superior de la Judicatura',

  // The courts, whose names are read aloud when a precedent is cited.
  'Corte Constitucional',
  'Corte Suprema de Justicia',
  'Consejo de Estado',
  'Tribunal Superior',

  // Procedural acts and figures.
  'providencia',
  'auto interlocutorio',
  'mandamiento de pago',
  'título ejecutivo',
  'medida cautelar',
  'excepciones de mérito',
  'contestación de la demanda',
  'recurso de reposición',
  'recurso de apelación',
  'recurso de súplica',
  'recurso de queja',
  'incidente de desacato',
  'notificación por aviso',
  'emplazamiento',
  'traslado',
  'caducidad',
  'prescripción',
  'casación',
  'acción de tutela',
  'sustanciador',
  'apoderado judicial',
  'radicado',
  'garantía mobiliaria',
  'ejecución de la garantía',

  // The codes, cited by name and by acronym.
  'Código General del Proceso',
  'CPACA',
  'CPTSS',
  'Código Sustantivo del Trabajo'
];
