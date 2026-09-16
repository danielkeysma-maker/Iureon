/**
 * Espejo de `backend/src/modules/expedientes/types.ts`.
 *
 * Copiado y no compartido, como el resto de los módulos de esta casa: el
 * backend y el frontend se despliegan por separado y un tipo importado a
 * través del límite ataría los dos despliegues. Lo que sí se copia ENTERO es
 * el vocabulario de papeles, porque partirlo aquí volvería a crear las dos
 * listas que el backend acaba de unificar.
 */

export type EstadoDeExpediente = 'ACTIVO' | 'SUSPENDIDO' | 'TERMINADO' | 'ARCHIVADO';

export const ESTADOS: readonly EstadoDeExpediente[] = ['ACTIVO', 'SUSPENDIDO', 'TERMINADO', 'ARCHIVADO'];

export const NOMBRE_DE_ESTADO: Record<EstadoDeExpediente, string> = {
  ACTIVO: 'Activo',
  SUSPENDIDO: 'Suspendido',
  TERMINADO: 'Terminado',
  ARCHIVADO: 'Archivado'
};

export type PapelEnElExpediente =
  | 'JUEZ'
  | 'SECRETARIO'
  | 'FISCAL'
  | 'MINISTERIO_PUBLICO'
  | 'DEFENSOR_PUEBLO'
  | 'DEFENSOR'
  | 'INDICIADO'
  | 'IMPUTADO'
  | 'ACUSADO'
  | 'PROCESADO'
  | 'CONDENADO'
  | 'VICTIMA'
  | 'REPRESENTANTE_VICTIMAS'
  | 'APODERADO_DEMANDANTE'
  | 'APODERADO_DEMANDADO'
  | 'DEMANDANTE'
  | 'DEMANDADO'
  | 'TESTIGO'
  | 'PERITO'
  | 'INTERPRETE'
  | 'DESCONOCIDO';

/**
 * Cómo se le dice a cada papel en pantalla.
 *
 * EN ESTE ORDEN, y no alfabético: el desplegable lo lee un abogado que está
 * pensando en su proceso, no buscando una palabra en un diccionario. Primero
 * lo que más se registra —las partes y la prueba—, después lo penal, y al
 * final el estrado y los intervinientes de control, que se anotan una vez.
 */
export const PAPELES_EN_ORDEN: readonly { papel: PapelEnElExpediente; nombre: string; grupo: string }[] = [
  { papel: 'DEMANDANTE', nombre: 'Demandante', grupo: 'Partes' },
  { papel: 'DEMANDADO', nombre: 'Demandado', grupo: 'Partes' },
  { papel: 'APODERADO_DEMANDANTE', nombre: 'Apoderado del demandante', grupo: 'Partes' },
  { papel: 'APODERADO_DEMANDADO', nombre: 'Apoderado del demandado', grupo: 'Partes' },
  { papel: 'TESTIGO', nombre: 'Testigo', grupo: 'Prueba' },
  { papel: 'PERITO', nombre: 'Perito', grupo: 'Prueba' },
  { papel: 'INTERPRETE', nombre: 'Intérprete', grupo: 'Prueba' },
  { papel: 'VICTIMA', nombre: 'Víctima', grupo: 'Penal' },
  { papel: 'REPRESENTANTE_VICTIMAS', nombre: 'Representante de víctimas', grupo: 'Penal' },
  { papel: 'INDICIADO', nombre: 'Indiciado', grupo: 'Penal' },
  { papel: 'IMPUTADO', nombre: 'Imputado', grupo: 'Penal' },
  { papel: 'ACUSADO', nombre: 'Acusado', grupo: 'Penal' },
  { papel: 'PROCESADO', nombre: 'Procesado', grupo: 'Penal' },
  { papel: 'CONDENADO', nombre: 'Condenado', grupo: 'Penal' },
  { papel: 'FISCAL', nombre: 'Fiscal', grupo: 'Penal' },
  { papel: 'DEFENSOR', nombre: 'Defensor', grupo: 'Penal' },
  { papel: 'JUEZ', nombre: 'Juez', grupo: 'Estrado' },
  { papel: 'SECRETARIO', nombre: 'Secretario', grupo: 'Estrado' },
  { papel: 'MINISTERIO_PUBLICO', nombre: 'Ministerio Público', grupo: 'Estrado' },
  { papel: 'DEFENSOR_PUEBLO', nombre: 'Defensoría del Pueblo', grupo: 'Estrado' },
  { papel: 'DESCONOCIDO', nombre: 'Todavía no se sabe', grupo: 'Estrado' }
];

export const NOMBRE_DE_PAPEL = Object.fromEntries(
  PAPELES_EN_ORDEN.map((p) => [p.papel, p.nombre])
) as Record<PapelEnElExpediente, string>;

/**
 * A quién se le prepara interrogatorio.
 *
 * Copia de `PAPELES_INTERROGABLES` del backend, y el servidor manda: aquí solo
 * decide qué casillas se pintan. Si las dos se separaran, la pantalla ofrecería
 * marcar a alguien que el servidor va a descartar — que es peor que no
 * ofrecerlo, porque el abogado creería que preparó a esa persona.
 */
export const SE_LE_PREGUNTA: readonly PapelEnElExpediente[] = [
  'DEMANDANTE',
  'DEMANDADO',
  'INDICIADO',
  'IMPUTADO',
  'ACUSADO',
  'PROCESADO',
  'CONDENADO',
  'VICTIMA',
  'TESTIGO',
  'PERITO'
];

/**
 * A QUIÉN PUEDE REPRESENTAR EL ABOGADO cuando lee un documento que recibió.
 *
 * Copia de `PAPELES_REPRESENTABLES` del backend, y el servidor manda: lo que
 * no esté en su lista cae a `DESCONOCIDO` y no atribuye ninguna carga. Si las
 * dos se separaran, la pantalla ofrecería una posición que el servidor va a
 * descartar — y el abogado creería haberla declarado.
 *
 * Se pregunta por el papel de SU CLIENTE, no por el suyo: por eso no están los
 * apoderados, y no están el estrado ni la prueba porque a nadie de ahí se le
 * representa. `DESCONOCIDO` va de último y es el valor por defecto.
 */
export const PAPELES_REPRESENTABLES: readonly PapelEnElExpediente[] = [
  'DEMANDANTE',
  'DEMANDADO',
  'VICTIMA',
  'INDICIADO',
  'IMPUTADO',
  'ACUSADO',
  'PROCESADO',
  'CONDENADO',
  'DESCONOCIDO'
];

/**
 * Cómo se le pregunta en la pantalla de revisión, que NO es como se nombra al
 * actor en el expediente.
 *
 * Allí se rotula a un tercero —«Demandante»— y aquí se declara una relación:
 * «Represento al demandante». Reusar la etiqueta corta haría leer el
 * desplegable como «yo soy el demandante», que es falso: el abogado es el
 * apoderado y el demandante es su cliente.
 */
export const COMO_SE_REPRESENTA: Record<string, string> = {
  DEMANDANTE: 'Represento al demandante (accionante, ejecutante, convocante)',
  DEMANDADO: 'Represento al demandado (accionado, ejecutado, convocado)',
  VICTIMA: 'Represento a la víctima',
  INDICIADO: 'Represento al indiciado',
  IMPUTADO: 'Represento al imputado',
  ACUSADO: 'Represento al acusado',
  PROCESADO: 'Represento al procesado',
  CONDENADO: 'Represento al condenado',
  DESCONOCIDO: 'Prefiero no decirlo por ahora'
};

export type LadoEnElExpediente = 'PROPIO' | 'CONTRARIO' | 'NEUTRAL';

export const NOMBRE_DE_LADO: Record<LadoEnElExpediente, string> = {
  PROPIO: 'De mi lado',
  CONTRARIO: 'De la contraparte',
  NEUTRAL: 'De ninguno'
};

export interface ActorDelExpediente {
  id: string;
  expedienteId: string;
  nombre: string;
  papel: PapelEnElExpediente;
  lado: LadoEnElExpediente;
  sobreQue: string | null;
  identificacion: string | null;
  notas: string | null;
  clienteId: string | null;
  createdAt: string;
}

export interface Expediente {
  id: string;
  caratula: string;
  radicado: string | null;
  despacho: string | null;
  rama: string | null;
  clienteId: string | null;
  clienteNombre: string | null;
  contraparte: string | null;
  estado: EstadoDeExpediente;
  notas: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  actores?: number;
}

/**
 * Un término de la agenda visto desde su caso. Espejo de `TerminoDelExpediente`.
 *
 * Nada de esto lo calcula el servidor a partir del derecho: la fecha y la
 * actuación son las que la entrada de la agenda guardó. `diasRestantes` se
 * cuenta en días de calendario de Bogotá EN EL SERVIDOR; la pantalla lo pinta y
 * no lo recalcula con el reloj del equipo.
 */
export interface TerminoDelExpediente {
  agendaId: string;
  /** AAAA-MM-DD. */
  vence: string;
  /** 0 hoy, 1 mañana, negativo si ya pasó. */
  diasRestantes: number;
  que: string;
  /** Falso cuando la entrada no está verificada: la pantalla debe marcarlo, no afirmarlo. */
  verificado: boolean;
  vencido: boolean;
}

/**
 * Espejo de `ResumenDelCaso`. «NO SÉ» NUNCA ES «CERO»: con `terminosLeidos`
 * falso, `proximoTermino: null` no significa «nada vence», significa que la
 * agenda no se pudo leer; y `documentos: null` es «no se pudo contar».
 */
export interface ResumenDelCaso {
  terminosLeidos: boolean;
  proximoTermino: TerminoDelExpediente | null;
  terminoVencido: TerminoDelExpediente | null;
  terminosPendientes: number | null;
  /** Documentos buscables del caso (distintos en el índice). */
  documentos: number | null;
}

/** Una persona del caso vista desde la lista: lo justo para encontrarlo. Espejo de `PersonaEnLista`. */
export interface PersonaEnLista {
  nombre: string;
  /** Tal como se escribió en la ficha del actor. */
  identificacion: string | null;
  papel: PapelEnElExpediente;
  lado: LadoEnElExpediente;
}

/**
 * Lo que la lista trae para buscar por cédula, NIT o persona.
 *
 * OPCIONAL porque falta en servidores anteriores al campo; `personas: null` es
 * «no se pudo leer», nunca «el caso no tiene personas».
 */
export interface DatosDeBusquedaDelCaso {
  clienteDocumento?: string | null;
  personas?: PersonaEnLista[] | null;
}

export type ExpedienteEnLista = Expediente & ResumenDelCaso & DatosDeBusquedaDelCaso;

/**
 * LO MÍNIMO CON QUE SE PUEDE BUSCAR UN CASO, y lo que promete
 * `expedientesApi.listar()`.
 *
 * El expediente con sus datos de búsqueda, SIN el resumen: el próximo término y
 * el conteo de documentos son de «Mis casos», que los pide para pintar
 * tarjetas, y el selector de «De qué caso es» no los necesita. Tipar la lista
 * del selector como `ExpedienteEnLista` prometería unos campos que esa
 * respuesta no siempre trae — y prometerlos en el tipo es cómo se llega a
 * leerlos sin comprobar.
 */
export type CasoBuscable = Expediente & DatosDeBusquedaDelCaso;

/** Ids ya ordenados por el servidor. `estaSemana` ⊂ `activos`; null si la agenda no se leyó. */
export interface PestanasDeMisCasos {
  estaSemana: string[] | null;
  activos: string[];
  cerrados: string[];
}

export interface MisCasos {
  expedientes: ExpedienteEnLista[];
  pestanas: PestanasDeMisCasos;
  hoy: string;
  avisoTerminos: string | null;
  avisoDocumentos: string | null;
  /** Si las personas o los documentos de los clientes no se leyeron, lo que la búsqueda no puede prometer. */
  avisoBusqueda?: string | null;
}

/*
 * El resumen del caso es OPCIONAL en el detalle: falta en respuestas de
 * servidores anteriores al campo, así que se lee tolerando `undefined`.
 */
export interface ExpedienteConDetalle extends Expediente, Partial<ResumenDelCaso> {
  listaDeActores: ActorDelExpediente[];
  piezas: {
    entrevistas: number;
    audiencias: number;
    revisiones: number;
    borradores: number;
    terminos: number;
    orientaciones: number;
  };
  /**
   * A quien representa la firma, DEDUCIDO por el servidor de los actores ya
   * registrados. `null` cuando no se puede deducir sin adivinar.
   *
   * Es una sugerencia para prellenar, nunca una orden: el abogado la ve en el
   * desplegable y puede cambiarla. Falta en respuestas de servidores
   * anteriores al campo, asi que se lee tolerando `undefined`.
   */
  posicionSugerida?: PapelEnElExpediente | null;
}

/**
 * Con qué del expediente se le contradice. El servidor ya comprobó que la cita
 * está LITERALMENTE en un pasaje del caso y tomó el nombre del documento de ese
 * pasaje, no del que el motor dijo: lo que llega aquí no hay que volver a
 * dudarlo, y lo que no llega es porque no se pudo comprobar.
 */
export interface ConQueSeAtaca {
  documento: string;
  cita: string;
}

export interface PreguntaParaAlguien {
  pregunta: string;
  paraQue: string;
  delMaterial?: string;
  /** Qué contestará probablemente. Falta en tandas guardadas antes del campo. */
  respuestaProbable?: string;
  /** Qué preguntar después si contesta eso. */
  repregunta?: string;
  /** Ausente = el expediente no tiene con qué. Ver `ConQueSeAtaca`. */
  conQue?: ConQueSeAtaca;
}

export interface PreguntasParaUnaPersona {
  actorId: string;
  nombre: string;
  tecnica: string;
  preguntas: PreguntaParaAlguien[];
}

export interface PreguntasDelExpediente {
  enfoque: string;
  porPersona: PreguntasParaUnaPersona[];
  generadoEl: string;
  por: string;
  /**
   * Si la tanda tuvo pasajes del expediente indexado con los que cotejar.
   *
   * MANDA SOBRE LO QUE LA PANTALLA SE ATREVE A DECIR. Solo con esto en `true`
   * una pregunta sin «con qué» puede afirmar que el expediente no tiene con qué
   * contradecirlo; sin material, eso sería un hallazgo inventado sobre unos
   * documentos que nadie leyó. Falta en tandas guardadas antes del campo.
   */
  conMaterial?: boolean;
  /**
   * Si la respuesta del motor llegó cortada y se rescataron las preguntas
   * completas. Una lista recortada se lee igual que una lista corta: quien la
   * lleva a la audiencia tiene que saber cuál de las dos tiene en la mano.
   */
  recortado?: boolean;
}

/**
 * Una tanda guardada, tal como la enseña la lista del caso. SIN las preguntas:
 * la lista no las necesita y traerlas todas para pintar cuatro renglones sería
 * bajar el expediente entero cada vez que se abre la pestaña.
 */
export interface InterrogatorioEnLaLista {
  id: string;
  creadoEl: string;
  creadoPor: string;
  queSeQueriaProbar: string | null;
  audiencia: string | null;
  /** Los nombres de quienes se prepararon, en el orden en que salieron. */
  personas: string[];
  cobradoCop: number | null;
}

/** La tanda entera, al abrirla. Abrirla NO cuesta saldo. */
export interface InterrogatorioGuardado extends InterrogatorioEnLaLista {
  preguntas: PreguntasDelExpediente;
  modelo: string | null;
}

/**
 * LO QUE SE DICE CUANDO EL EXPEDIENTE NO TIENE CON QUÉ.
 *
 * Se dice, no se calla: un hueco en blanco bajo la respuesta probable se lee
 * como «todavía no se ha cargado», y el abogado entra a la audiencia creyendo
 * que en alguna parte hay un papel que lo contradice. La frase es una
 * AFIRMACIÓN sobre el expediente —no tiene con qué— y por eso solo se publica
 * cuando de verdad hubo pasajes que mirar (`conMaterial`).
 */
export const SIN_CON_QUE = 'El expediente no tiene con qué contradecirlo.';

/**
 * El «con qué» de una pregunta, en una línea, para el texto plano y las
 * exportaciones. `null` cuando no hay nada que decir con fundamento: ni cita
 * comprobada, ni material del caso con el que afirmar que no la hay.
 */
export const lineaDeConQue = (
  pregunta: PreguntaParaAlguien,
  conMaterial: boolean | undefined
): string | null => {
  if (pregunta.conQue) return `Con qué: ${pregunta.conQue.documento} — «${pregunta.conQue.cita}»`;
  return conMaterial ? SIN_CON_QUE : null;
};

/** Cuántas personas caben en una tanda. Espejo de `MAX_PERSONAS_POR_TANDA`. */
export const MAX_PERSONAS_POR_TANDA = 4;

/**
 * La lista del caso, siempre en el mismo orden: la más nueva primero.
 *
 * SE ORDENA TAMBIÉN AQUÍ, y no solo en el `ORDER BY` del servidor. No es
 * desconfianza: la tanda que se acaba de preparar se añade a la lista que ya
 * está en pantalla sin volver a preguntar, y una lista que se reordena sola al
 * recargar —la nueva arriba hoy, abajo hasta que uno recargue— es de las cosas
 * que hacen dudar al abogado de si la aplicación guardó lo que dijo.
 */
export const interrogatoriosMasNuevoPrimero = <T extends { creadoEl: string }>(
  lista: readonly T[]
): T[] => [...lista].sort((a, b) => b.creadoEl.localeCompare(a.creadoEl));
