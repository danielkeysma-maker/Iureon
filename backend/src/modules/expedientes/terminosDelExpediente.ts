import type { LecturaCompleta } from '../../config/leerTodasLasFilas';
import { diasQueFaltan } from '../agenda/avisos';
import type {
  EstadoDeExpediente,
  Expediente,
  ExpedienteEnLista,
  MisCasos,
  PestanasDeMisCasos,
  ResumenDelCaso,
  TerminoDelExpediente
} from './types';

/**
 * EL PRÓXIMO TÉRMINO DE CADA CASO Y LAS PESTAÑAS DE «MIS CASOS». Decisión pura.
 *
 * ─── DE DÓNDE SALE UN TÉRMINO, Y DE DÓNDE NO ───────────────────────────────
 *
 * Solo de `agenda_terminos`: las entradas que la firma registró —desde la
 * agenda, desde un borrador o desde una revisión con «Poner en la agenda»— y
 * que están atadas al expediente. Aquí no se calcula ningún plazo legal. La
 * fecha límite es la guardada, y la guardó el motor de términos o el abogado
 * al crear la entrada, con su marca de verificación.
 *
 * ─── SIN BASE Y SIN RED, A PROPÓSITO ───────────────────────────────────────
 *
 * Todo lo que puede equivocarse en silencio vive aquí —qué cuenta como
 * pendiente, qué día es hoy en Bogotá, qué pasa si la lectura falló— para que
 * `check:proximo-termino` lo pruebe con filas falsas. El servicio solo lee las
 * filas y se las entrega.
 */

/** Cuántos días de calendario, contando desde hoy, abarca «Esta semana». Hoy + 7 entra. */
export const DIAS_DE_ESTA_SEMANA = 7;

const ACTIVOS: readonly EstadoDeExpediente[] = ['ACTIVO', 'SUSPENDIDO'];
const CERRADOS: readonly EstadoDeExpediente[] = ['TERMINADO', 'ARCHIVADO'];

/** Las columnas de `agenda_terminos` que hacen falta. Ni notas ni evidencia viajan. */
export interface FilaDeTerminoPendiente {
  id: string;
  firm_id: string;
  expediente_id: string | null;
  actuacion_nombre: string;
  fecha_limite: string;
  estado: string;
  termino_verificado: boolean | null;
}

/** Las columnas de `document_embeddings` que hacen falta: identificadores, sin texto ni vector. */
export interface FilaDeFragmento {
  firm_id: string;
  expediente_id: string | null;
  document_id: string | null;
}

export interface TerminosDeUnCaso {
  proximo: TerminoDelExpediente | null;
  vencido: TerminoDelExpediente | null;
  pendientes: number;
}

/** Orden total: por fecha límite y, a igual fecha, por id — dos lecturas dicen lo mismo. */
const vaAntes = (a: TerminoDelExpediente, b: TerminoDelExpediente): boolean =>
  a.vence !== b.vence ? a.vence < b.vence : a.agendaId < b.agendaId;

/**
 * Agrupa las entradas por caso y elige, en cada uno, el próximo término y el
 * vencido más antiguo.
 *
 * · LA FIRMA SE VUELVE A COMPROBAR aunque la consulta ya filtre por ella. Es
 *   barato y cierra la puerta a que un cambio en la consulta mezcle el caso de
 *   otra firma que, por azar o por error, compartiera un `expediente_id`.
 * · SOLO LO PENDIENTE. Recordar como «lo que vence» un término ya contestado
 *   enseña a ignorar la tarjeta.
 * · LO VENCIDO NO SE DESCARTA. Va en `vencido`, no en `proximo`: la pasada de
 *   avisos deja de anunciarlo al día siguiente, así que la lista de casos es el
 *   único sitio donde un término perdido sigue a la vista.
 */
export const terminosPorExpediente = (
  filas: readonly FilaDeTerminoPendiente[],
  firmId: string,
  hoy: string
): Map<string, TerminosDeUnCaso> => {
  const porCaso = new Map<string, TerminosDeUnCaso>();

  for (const f of filas) {
    if (f.firm_id !== firmId || !f.expediente_id || f.estado !== 'PENDIENTE') continue;

    const caso = porCaso.get(f.expediente_id) ?? { proximo: null, vencido: null, pendientes: 0 };
    porCaso.set(f.expediente_id, caso);
    /*
     * Se cuenta ANTES de leer la fecha: una fecha ilegible no puede restar un
     * pendiente. No elige próximo término, porque no se sabe cuándo vence.
     */
    caso.pendientes += 1;

    let dias: number;
    try {
      dias = diasQueFaltan(f.fecha_limite, hoy);
    } catch {
      continue;
    }

    const termino: TerminoDelExpediente = {
      agendaId: f.id,
      vence: f.fecha_limite,
      diasRestantes: dias,
      que: f.actuacion_nombre,
      verificado: f.termino_verificado === true,
      vencido: dias < 0
    };

    if (termino.vencido) {
      if (!caso.vencido || vaAntes(termino, caso.vencido)) caso.vencido = termino;
    } else if (!caso.proximo || vaAntes(termino, caso.proximo)) {
      caso.proximo = termino;
    }
  }

  return porCaso;
};

/** Documentos distintos por caso, contados desde los fragmentos buscables. */
export const documentosPorExpediente = (
  filas: readonly FilaDeFragmento[],
  firmId: string
): Map<string, number> => {
  const porCaso = new Map<string, Set<string>>();
  for (const f of filas) {
    if (f.firm_id !== firmId || !f.expediente_id || !f.document_id) continue;
    const docs = porCaso.get(f.expediente_id) ?? new Set<string>();
    docs.add(f.document_id);
    porCaso.set(f.expediente_id, docs);
  }
  return new Map([...porCaso].map(([id, docs]) => [id, docs.size]));
};

/**
 * El resumen de un caso a partir de lo leído. `null` en un mapa significa «esa
 * lectura falló», y se traduce a banderas y nulls, nunca a ceros.
 */
export const resumenDelCaso = (
  expedienteId: string,
  terminos: Map<string, TerminosDeUnCaso> | null,
  documentos: Map<string, number> | null
): ResumenDelCaso => {
  const t = terminos?.get(expedienteId);
  return {
    terminosLeidos: terminos !== null,
    proximoTermino: t?.proximo ?? null,
    terminoVencido: t?.vencido ?? null,
    terminosPendientes: terminos === null ? null : t?.pendientes ?? 0,
    documentos: documentos === null ? null : documentos.get(expedienteId) ?? 0
  };
};

/** Lo más urgente de un caso: el vencido, si lo hay; si no, el próximo. */
const urgente = (c: ResumenDelCaso): TerminoDelExpediente | null => c.terminoVencido ?? c.proximoTermino;

const porTocadoReciente = (a: Expediente, b: Expediente): number =>
  a.updatedAt !== b.updatedAt ? (a.updatedAt < b.updatedAt ? 1 : -1) : a.id < b.id ? -1 : 1;

/** Por urgencia (sin término, al final) y, a igual urgencia, lo tocado más reciente. */
const porUrgencia = (a: ExpedienteEnLista, b: ExpedienteEnLista): number => {
  const ua = urgente(a);
  const ub = urgente(b);
  if (ua && !ub) return -1;
  if (!ua && ub) return 1;
  if (ua && ub && ua.vence !== ub.vence) return ua.vence < ub.vence ? -1 : 1;
  return porTocadoReciente(a, b);
};

/**
 * LAS TRES PESTAÑAS.
 *
 * · «Esta semana»: casos ACTIVOS o SUSPENDIDOS con un término vencido pendiente
 *   o con su próximo término dentro de hoy … hoy + 7 días de calendario, ambos
 *   inclusive. Ordenados por fecha límite ascendente, lo que pone primero a los
 *   vencidos: su fecha es anterior a hoy y la de cualquier próximo término no.
 *   Un SUSPENDIDO entra porque la entrada sigue registrada como pendiente; si
 *   la suspensión mueve el plazo, lo mueve quien edita la agenda, no esta lista.
 * · «Activos»: ACTIVO + SUSPENDIDO, por urgencia y después por lo tocado más
 *   reciente. Incluye a los de «Esta semana», como en el diseño.
 * · «Cerrados»: TERMINADO + ARCHIVADO, por lo tocado más reciente. Su vencido,
 *   si lo tuviera, sigue en su tarjeta; no se promueve a «Esta semana» porque
 *   el caso se declaró cerrado.
 *
 * SE DECIDE EN EL SERVIDOR Y NO EN EL NAVEGADOR. Los días se cuentan contra el
 * «hoy» de Bogotá del servidor; si la pantalla reclasificara con el reloj del
 * equipo, un abogado de viaje vería otra semana, y habría dos definiciones de
 * «esta semana» que se separan a la primera corrección.
 */
export const clasificarEnPestanas = (
  casos: readonly ExpedienteEnLista[],
  terminosLeidos: boolean
): PestanasDeMisCasos => {
  const activos = casos
    .filter((c) => ACTIVOS.includes(c.estado))
    .sort(terminosLeidos ? porUrgencia : porTocadoReciente);

  const cerrados = casos.filter((c) => CERRADOS.includes(c.estado)).sort(porTocadoReciente);

  const estaSemana = terminosLeidos
    ? activos.filter(
        (c) =>
          c.terminoVencido !== null ||
          (c.proximoTermino !== null && c.proximoTermino.diasRestantes <= DIAS_DE_ESTA_SEMANA)
      )
    : null;

  return {
    estaSemana: estaSemana ? estaSemana.map((c) => c.id) : null,
    activos: activos.map((c) => c.id),
    cerrados: cerrados.map((c) => c.id)
  };
};

/**
 * La respuesta completa de la lista, a partir de las dos lecturas en lote.
 *
 * UNA LECTURA PARCIAL SE TRATA COMO FALLIDA. Si la primera parte llegó y la
 * segunda no, el término más cercano pudo quedar en la parte perdida; usar lo
 * que llegó mostraría un vencimiento posterior como si fuera el próximo.
 */
export const armarMisCasos = (entrada: {
  firmId: string;
  hoy: string;
  expedientes: readonly Expediente[];
  terminos: LecturaCompleta<FilaDeTerminoPendiente>;
  fragmentos: LecturaCompleta<FilaDeFragmento>;
}): MisCasos => {
  const terminos =
    entrada.terminos.falla === null ? terminosPorExpediente(entrada.terminos.filas, entrada.firmId, entrada.hoy) : null;
  const documentos =
    entrada.fragmentos.falla === null ? documentosPorExpediente(entrada.fragmentos.filas, entrada.firmId) : null;

  const expedientes = entrada.expedientes.map((e) => ({ ...e, ...resumenDelCaso(e.id, terminos, documentos) }));

  return {
    expedientes,
    pestanas: clasificarEnPestanas(expedientes, terminos !== null),
    hoy: entrada.hoy,
    avisoTerminos:
      terminos === null
        ? 'No se pudieron leer los términos de la agenda: esta lista no puede decir qué vence en cada caso.'
        : null,
    avisoDocumentos:
      documentos === null ? 'No se pudieron contar los documentos indexados de los casos.' : null
  };
};
