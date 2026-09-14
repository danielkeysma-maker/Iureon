/**
 * Palabras que PUEDEN ir en mayúscula dentro de una fórmula de estilo sin que
 * eso signifique que nombran a alguien.
 *
 * ─── POR QUÉ UNA LISTA Y NO UN MODELO ──────────────────────────────────────
 *
 * La guarda descarta toda cadena con dos o más palabras en mayúscula que no
 * estén aquí, porque así se ve un nombre propio: «Carlos Mendoza Ruiz»,
 * «Constructora Andina». Pero un escrito colombiano está lleno de mayúsculas
 * que no nombran a nadie —«Señor Juez Civil del Circuito», «FUNDAMENTOS DE
 * DERECHO»—, y descartarlas vaciaría la lección de lo único que tiene.
 *
 * La lista falla hacia el lado seguro: una fórmula legítima que use una
 * palabra que no está aquí se descarta Y SE DICE («parece nombrar a una
 * persona o entidad»), y el socio la ve en la vista previa. Un nombre que se
 * colara, en cambio, viajaría en silencio a todos los escritos de la firma.
 *
 * Todo en minúscula y sin tildes: se compara contra la palabra plegada.
 */
export const PALABRAS_EN_MAYUSCULA_PERMITIDAS: ReadonlySet<string> = new Set([
  // Tratamiento y cargos
  'senor', 'senora', 'senores', 'senoria', 'su', 'sus', 'honorable', 'honorables', 'respetado', 'respetada',
  'distinguido', 'distinguida', 'doctor', 'doctora', 'dr', 'dra', 'juez', 'jueza', 'jueces', 'magistrado',
  'magistrada', 'magistrados', 'ponente', 'fiscal', 'fiscalia', 'procurador', 'procuradora', 'procuraduria',
  'defensor', 'defensora', 'defensoria', 'personero', 'personera', 'secretario', 'secretaria', 'notario',
  'notaria', 'registrador', 'registradora', 'alcalde', 'alcaldesa', 'gobernador', 'gobernadora', 'inspector',
  'inspectora', 'comisario', 'comisaria', 'superintendente', 'superintendencia', 'director', 'directora',
  'presidente', 'presidenta', 'conciliador', 'conciliadora', 'arbitro', 'arbitros', 'curador', 'curadora',
  'apoderado', 'apoderada', 'apoderados', 'suscrito', 'suscrita', 'abogado', 'abogada', 'usted', 'ustedes',
  // Autoridades genéricas (sin nombre propio)
  'despacho', 'juzgado', 'tribunal', 'corte', 'sala', 'seccion', 'consejo', 'estado', 'suprema', 'constitucional',
  'superior', 'distrito', 'distrital', 'judicial', 'circuito', 'municipal', 'promiscuo', 'pequenas', 'causas',
  'competencia', 'multiple', 'civil', 'laboral', 'penal', 'familia', 'administrativo', 'administrativa',
  'contencioso', 'contenciosa', 'oral', 'ejecucion', 'penas', 'medidas', 'seguridad', 'garantias', 'conocimiento',
  'primero', 'primera', 'segundo', 'segunda', 'tercero', 'tercera', 'cuarto', 'cuarta', 'quinto', 'quinta',
  'sexto', 'sexta', 'septimo', 'septima', 'octavo', 'octava', 'noveno', 'novena', 'decimo', 'decima', 'unico',
  'unica', 'instancia', 'jurisdiccion', 'ordinaria', 'republica', 'colombia', 'rama', 'publico', 'publica',
  'ministerio', 'nacion',
  // Títulos de sección y piezas del escrito
  'referencia', 'ref', 'asunto', 'proceso', 'radicado', 'radicacion', 'demandante', 'demandantes', 'demandado',
  'demandados', 'demandada', 'accionante', 'accionado', 'accionada', 'convocante', 'convocado', 'ejecutante',
  'ejecutado', 'recurrente', 'parte', 'partes', 'actora', 'actor', 'tercero', 'terceros', 'interviniente',
  'hechos', 'pretensiones', 'peticion', 'peticiones', 'solicitud', 'solicitudes', 'pruebas', 'prueba',
  'documentales', 'testimoniales', 'fundamentos', 'fundamento', 'derecho', 'derechos', 'razones', 'argumentos',
  'consideraciones', 'considerando', 'antecedentes', 'resuelve', 'decision', 'notificaciones', 'notificacion',
  'anexos', 'anexo', 'cuantia', 'procedimiento', 'tramite', 'juramento', 'estimatorio', 'competencia',
  'procedencia', 'oportunidad', 'legitimacion', 'recurso', 'recursos', 'reposicion', 'apelacion', 'subsidio',
  'subsidiaria', 'subsidiarias', 'principal', 'principales', 'demanda', 'contestacion', 'excepciones',
  'excepcion', 'merito', 'previas', 'previa', 'medida', 'cautelar', 'cautelares', 'embargo', 'secuestro',
  'alegatos', 'conclusion', 'sustentacion', 'reparos', 'concretos', 'objeto', 'sintesis', 'resumen', 'escrito',
  'memorial', 'poder', 'especial', 'amplio', 'suficiente', 'tutela', 'accion', 'incidente', 'nulidad',
  'nulidades', 'ejecutiva', 'ejecutivo', 'declarativa', 'declarativo', 'verbal', 'sumario', 'monitorio',
  'normas', 'violadas', 'concepto', 'violacion', 'juramentada', 'declaracion', 'otrosi', 'finalmente',
  'identificacion', 'domicilio', 'direccion', 'correo', 'electronico', 'telefono', 'firma', 'cedula',
  'ciudadania', 'tarjeta', 'profesional', 'expedida', 'no', 'nro', 'numero', 'cordialmente', 'atentamente',
  'respetuosamente', 'reciba', 'saludo', 'fraterno',
  // Palabras funcionales que abren una frase
  'de', 'del', 'la', 'las', 'el', 'los', 'lo', 'y', 'e', 'o', 'u', 'a', 'al', 'en', 'con', 'por', 'para', 'sin',
  'sobre', 'ante', 'contra', 'segun', 'que', 'se', 'me', 'nos', 'mi', 'yo', 'este', 'esta', 'estos', 'estas',
  'dicho', 'dicha', 'mediante', 'teniendo', 'cuenta', 'lo', 'anterior', 'expuesto', 'asi', 'mismo', 'tambien',
  'igualmente', 'ademas', 'por', 'tanto', 'consiguiente', 'sirvase', 'solicito', 'pido', 'permito', 'presento',
  'acudo', 'comedidamente', 'todo', 'respeto'
]);

/** Pliega una palabra para compararla contra la lista: minúscula y sin tildes. */
export const plegar = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
