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

export interface ExpedienteConDetalle extends Expediente {
  listaDeActores: ActorDelExpediente[];
  piezas: {
    entrevistas: number;
    audiencias: number;
    revisiones: number;
    borradores: number;
    terminos: number;
    orientaciones: number;
  };
}

export interface PreguntaParaAlguien {
  pregunta: string;
  paraQue: string;
  delMaterial?: string;
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
}

/** Cuántas personas caben en una tanda. Espejo de `MAX_PERSONAS_POR_TANDA`. */
export const MAX_PERSONAS_POR_TANDA = 4;
