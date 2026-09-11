import type { PapelEnElExpediente } from '../../expedientes/types';

/**
 * DE QUIÉN ES LA CARGA QUE EL DOCUMENTO IMPONE.
 *
 * ─── EL DEFECTO QUE ESTO EXISTE PARA CERRAR ────────────────────────────────
 *
 * El informe de un documento recibido escribe en segunda persona: «Qué le
 * exige y para cuándo», y en su ausencia, «ninguna carga a su cargo». Hasta
 * hoy lo hacía SIN SABER QUÉ PARTE ES EL LECTOR: al motor se le entregaban el
 * texto y la pregunta, nada más.
 *
 * Así que un auto que ordena al DEMANDANTE subsanar en cinco días le decía al
 * apoderado del DEMANDADO que él debía subsanar en cinco días. Y al revés,
 * que es peor: un plazo suyo presentado como si fuera de otro.
 *
 * Es el defecto característico de esta casa, otra vez y en sitio nuevo:
 * PUBLICAR EL RELOJ DE LA CONTRAPARTE. Cincuenta y nueve fichas del catálogo
 * lo hicieron —traían el término del juzgado o de la DIAN y callaban el que
 * extingue el derecho del cliente— y es el peor defecto posible porque el
 * dato es exacto y la cita es real. Solo está dirigido a otra persona.
 *
 * ─── POR QUÉ EL MOTOR NO DECIDE ESTO ───────────────────────────────────────
 *
 * El modelo NO responde «esta carga es suya». Responde a quién se la impone el
 * documento, COPIANDO las palabras con que el documento lo nombra, y la
 * comparación con la posición que declaró el abogado la hace este archivo, sin
 * modelo de por medio.
 *
 * Es la misma división que gobierna el resto del informe —el motor cita, la
 * conclusión es de quien lee— y además hace la respuesta REPRODUCIBLE: la
 * misma frase produce siempre la misma atribución, y cuando se equivoca se
 * puede corregir una línea en vez de reescribir una instrucción y rezar.
 *
 * ─── Y CALLA MÁS DE LO QUE HABLA, A PROPÓSITO ──────────────────────────────
 *
 * Solo afirma cuando la familia nombrada es inequívoca y distinta de la del
 * lector. Si el documento no dice a quién, si nombra a varias, o si el abogado
 * no declaró su posición, la respuesta es NO_SE_SABE y la pantalla muestra la
 * carga como siempre, sin atribuirla.
 *
 * La regla viene del detector de voces fusionadas y se aplica igual aquí: UNA
 * FALSA ALARMA ES PEOR QUE EL SILENCIO, porque una atribución errónea enseña a
 * desconfiar de todas. Decirle «esto no es suyo» a quien sí tenía el plazo es
 * exactamente la forma de perderlo.
 */

/**
 * Las cuatro familias que un documento judicial nombra cuando reparte cargas.
 *
 * No son los veintiún papeles del expediente: son los bandos que una
 * providencia distingue al ordenar. Al testigo y al perito no se les impone
 * una carga procesal por este camino, y el juez no se da órdenes a sí mismo.
 */
export type FamiliaProcesal = 'ACTORA' | 'PASIVA' | 'PROCESADA' | 'VICTIMA';

/** Qué se le puede decir al abogado sobre una carga concreta. */
export type AQuienLeToca =
  /** El documento se la impone a la familia que él representa. */
  | 'SUYA'
  /** El documento se la impone, inequívocamente, a otra familia. */
  | 'DE_OTRO'
  /** No se puede afirmar ninguna de las dos cosas. Se calla. */
  | 'NO_SE_SABE';

/**
 * A QUIÉN PUEDE REPRESENTAR EL ABOGADO, que es un subconjunto de los papeles.
 *
 * Se pregunta por el papel de SU CLIENTE, no por el suyo: quien contesta
 * «Demandado» está diciendo que representa al demandado, y por eso
 * `APODERADO_DEMANDADO` no está en la lista — escogerlo significaría que su
 * cliente es el abogado de la otra parte, que no es lo que nadie quiere decir.
 *
 * No están el juez ni el secretario porque no se les representa, ni el testigo
 * ni el perito porque no son parte y el documento no les reparte cargas
 * procesales. `DESCONOCIDO` es el valor por defecto y significa «todavía no lo
 * digo», no «tercero»: con él no se atribuye nada.
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

export const esPapelRepresentable = (v: unknown): v is PapelEnElExpediente =>
  typeof v === 'string' && (PAPELES_REPRESENTABLES as readonly string[]).includes(v);

/** De qué familia es el papel del representado. `DESCONOCIDO` no tiene y por eso calla. */
const FAMILIA_DE_PAPEL: Partial<Record<PapelEnElExpediente, FamiliaProcesal>> = {
  DEMANDANTE: 'ACTORA',
  DEMANDADO: 'PASIVA',
  VICTIMA: 'VICTIMA',
  INDICIADO: 'PROCESADA',
  IMPUTADO: 'PROCESADA',
  ACUSADO: 'PROCESADA',
  PROCESADO: 'PROCESADA',
  CONDENADO: 'PROCESADA'
};

export const familiaDelPapel = (papel: PapelEnElExpediente | null | undefined): FamiliaProcesal | null =>
  (papel && FAMILIA_DE_PAPEL[papel]) || null;

/**
 * Se comparan textos sin tildes y en minúscula: un auto escribe «VÍCTIMA» en
 * el encabezado y «victima» en el cuerpo, y las dos son la misma palabra.
 */
const sinTildes = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * CÓMO NOMBRA UNA PROVIDENCIA A CADA BANDO.
 *
 * Los sinónimos no son adorno: la misma parte es «demandante» en un verbal,
 * «ejecutante» en un ejecutivo, «accionante» en una tutela y «convocante» en
 * un arbitraje. Quedarse con una sola palabra dejaría el aviso mudo en tres de
 * cada cuatro procesos.
 *
 * Van con frontera de palabra porque «demandante» y «demandado» comparten
 * principio: sin `\b` final, buscar la actora encontraría a la pasiva.
 */
const SENALES: Record<FamiliaProcesal, RegExp> = {
  ACTORA: /\b(demandantes?|accionantes?|convocantes?|ejecutantes?|parte\s+actora|extremo\s+activo|parte\s+activa)\b/,
  PASIVA: /\b(demandad[oa]s?|accionad[oa]s?|convocad[oa]s?|ejecutad[oa]s?|parte\s+pasiva|extremo\s+pasivo)\b/,
  PROCESADA: /\b(indiciad[oa]s?|imputad[oa]s?|acusad[oa]s?|procesad[oa]s?|condenad[oa]s?|sentenciad[oa]s?)\b/,
  VICTIMA: /\b(victimas?)\b/
};

const FAMILIAS: FamiliaProcesal[] = ['ACTORA', 'PASIVA', 'PROCESADA', 'VICTIMA'];

/**
 * LA RECONVENCIÓN INVIERTE LOS PAPELES, Y POR ESO AQUÍ SE CALLA.
 *
 * Quien contesta demandando a su vez es demandado en la demanda principal y
 * demandante en la suya. Una providencia que dice «el demandante de la
 * reconvención» está nombrando a quien en este expediente se registró como
 * demandado, y leer esa palabra por su cara devolvería la familia contraria
 * con toda la seguridad del mundo.
 *
 * Es exactamente la forma de error que este archivo existe para no cometer:
 * una atribución segura y al revés. Con la palabra a la vista no se atribuye.
 */
const RECONVENCION = /\breconven/;

/** Qué bandos nombra este texto. Vacío si ninguno; más de uno si los mezcla. */
export const familiasNombradas = (texto: string): FamiliaProcesal[] => {
  const limpio = sinTildes(texto || '');
  if (RECONVENCION.test(limpio)) return [];
  return FAMILIAS.filter((f) => SENALES[f].test(limpio));
};

/**
 * LA ATRIBUCIÓN, Y SUS CUATRO SILENCIOS.
 *
 * Calla cuando el abogado no declaró posición, cuando el documento no dice a
 * quién, cuando nombra a más de un bando —«córrase traslado a las partes» no
 * es de nadie en particular— y cuando la familia del lector no se puede
 * derivar de su papel.
 *
 * Solo habla en los dos casos limpios: el documento nombra UNA familia y es la
 * suya, o nombra UNA y no lo es.
 */
export const aQuienLeToca = (aQuien: string, papel: PapelEnElExpediente | null | undefined): AQuienLeToca => {
  const mia = familiaDelPapel(papel);
  if (!mia) return 'NO_SE_SABE';

  const nombradas = familiasNombradas(aQuien);
  if (nombradas.length !== 1) return 'NO_SE_SABE';

  return nombradas[0] === mia ? 'SUYA' : 'DE_OTRO';
};

/*
 * ─── Y LA POSICIÓN NO VIAJA AL MOTOR, A PROPÓSITO ──────────────────────────
 *
 * Parece la primera cosa que habría que hacer —decirle al modelo «el abogado
 * representa al demandado»— y es la que estropea el informe.
 *
 * Con esa frase delante, un modelo servicial FILTRA: reporta las cargas del
 * demandado y se calla las del demandante, porque cree que las otras no le
 * interesan al lector. Y muchas veces la carga ajena es lo más valioso del
 * auto — que el DEMANDANTE tenga cinco días para subsanar so pena de rechazo
 * es, para el demandado, la noticia del día.
 *
 * Como el aviso se calcula aquí, el motor no necesita saberlo: transcribe a
 * quién se dirige cada carga y el informe sale completo. Menos sesgo, menos
 * tokens, y una comparación reproducible en vez de una obediencia esperada.
 *
 * Si alguien vuelve a añadirlo, que sea con una instrucción que exija
 * reportar TODAS las cargas, sea de quien sea, y con un caso que lo pruebe.
 */
