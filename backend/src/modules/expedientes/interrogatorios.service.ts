import { supabase } from '../../config/supabase.config';
import { ExpedienteError } from './expedientes.service';
import type { PreguntasDelExpediente } from './preguntasDelExpediente';

/**
 * LOS INTERROGATORIOS PREPARADOS, GUARDADOS EN EL EXPEDIENTE.
 *
 * ─── QUÉ DEFECTO CIERRA ────────────────────────────────────────────────────
 *
 * Preparar el interrogatorio cuesta saldo de la firma. Hasta hoy el resultado
 * vivía SOLO en el estado de React de la pestaña: recargar la página, cambiar
 * de caso o cerrar el navegador lo perdía, y el abogado tenía que volver a
 * pagarlo para leer lo que ya había comprado. Cobrar por un trabajo y tirarlo
 * al recargar es lo más parecido que hay a cobrarlo dos veces.
 *
 * ─── LA REGLA QUE GOBIERNA CADA CONSULTA DE ESTE ARCHIVO ───────────────────
 *
 * TODA consulta filtra por `firm_id` Y por `expediente_id`, y las dos
 * condiciones viajan juntas SIEMPRE, también cuando se busca por `id` —que ya
 * es único—. El backend entra con service_role y omite RLS por diseño, así que
 * el aislamiento efectivo lo da este filtro: una consulta que se olvide del
 * `firm_id` no falla, devuelve el interrogatorio de otra firma. Y el
 * `expediente_id` de más no sobra: sin él, la ruta de un caso podría abrir o
 * borrar la tanda de OTRO caso de la misma firma con solo cambiar el
 * identificador en la barra de direcciones. Es el patrón de
 * `expedientes.service.ts`, que este módulo ya sigue.
 *
 * ─── GUARDAR NUNCA TUMBA UNA TANDA YA COBRADA ──────────────────────────────
 *
 * `guardarInterrogatorio` NO lanza: devuelve `null` y lo grita en la consola
 * del servidor. Cuando se la llama, el abogado ya pagó y las preguntas ya están
 * en camino; convertir un fallo de escritura en un 500 le quitaría el trabajo
 * que acaba de comprar por no haber podido archivarlo — el remedio peor que la
 * enfermedad. Sin la tabla (migración sin correr), el interrogatorio se prepara
 * y se muestra como hasta hoy, y la lista de guardados aparece vacía.
 */

const TABLA = 'expediente_interrogatorios';

/** Lo que la lista del caso enseña de cada tanda. SIN las preguntas. */
export interface InterrogatorioEnLaLista {
  id: string;
  creadoEl: string;
  creadoPor: string;
  queSeQueriaProbar: string | null;
  audiencia: string | null;
  /** Los nombres de las personas que se prepararon, en el orden en que salieron. */
  personas: string[];
  cobradoCop: number | null;
}

/** Una tanda entera, tal como se le entregó al abogado el día que la pidió. */
export interface InterrogatorioGuardado extends InterrogatorioEnLaLista {
  preguntas: PreguntasDelExpediente;
  modelo: string | null;
}

interface FilaDeInterrogatorio {
  id: string;
  creado_el: string;
  creado_por: string;
  que_se_queria_probar: string | null;
  audiencia: string | null;
  personas: PreguntasDelExpediente;
  modelo: string | null;
  cobrado_cop: number | null;
}

/** Las columnas de la lista. Sin `personas`, que es el objeto entero. */
const COLUMNAS_DE_LA_LISTA = 'id, creado_el, creado_por, que_se_queria_probar, audiencia, cobrado_cop';

/**
 * LOS NOMBRES DE LA LISTA SALEN DEL RESULTADO, NO DE UNA COLUMNA APARTE.
 *
 * Copiarlos a una columna al guardar los dejaría viejos el día que alguien
 * corrija el nombre de un actor, y peor: dos sitios que dicen a quién se
 * preparó, uno de ellos mintiendo. Cuesta traer la columna JSONB para pintar la
 * lista; se paga, porque el número de tandas de un caso se cuenta con los dedos.
 */
const nombresDe = (p: PreguntasDelExpediente | null | undefined): string[] =>
  (p?.porPersona ?? []).map((x) => x.nombre).filter((n) => n.trim().length > 0);

const aLaLista = (
  fila: FilaDeInterrogatorio & { personas?: PreguntasDelExpediente }
): InterrogatorioEnLaLista => ({
  id: fila.id,
  creadoEl: fila.creado_el,
  creadoPor: fila.creado_por,
  queSeQueriaProbar: fila.que_se_queria_probar,
  audiencia: fila.audiencia,
  personas: nombresDe(fila.personas),
  cobradoCop: fila.cobrado_cop
});

const db = () => {
  if (!supabase) {
    throw new ExpedienteError('NO_DB', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

/**
 * ¿QUIÉN PUEDE BORRAR UNA TANDA? Quien la pidió, y el socio administrador.
 *
 * ─── POR QUÉ ESOS DOS Y NO MÁS ─────────────────────────────────────────────
 *
 * QUIEN LA PIDIÓ, porque la pagó con el saldo de la firma y es su material de
 * trabajo: un dependiente que prepara tres tandas probando enfoques tiene que
 * poder tirar las dos que no sirven sin pedirle permiso a nadie.
 *
 * EL SOCIO ADMINISTRADOR, porque responde por lo que la firma guarda. Es quien
 * atiende una petición de supresión, quien cierra la cuenta de un abogado que
 * se fue y quien tiene que poder limpiar el caso de un cliente que lo pide.
 * Dejarle esas tandas sin dueño al irse su autor sería material privilegiado
 * que nadie puede retirar.
 *
 * Y NADIE MÁS. Que todo abogado de la firma pudiera borrar el trabajo de
 * cualquier otro convertiría un descuido en una pérdida ajena e irreversible
 * —no hay papelera— y además silenciosa, porque nadie mira una lista para ver
 * lo que ya no está. El SUPER_ADMIN tampoco entra por el rol: gestionar un
 * inquilino y tocar su material privilegiado son poderes distintos, y la puerta
 * para lo segundo es el acceso de soporte, pedido y autorizado.
 */
export const puedeBorrarInterrogatorio = (d: {
  creadoPor: string;
  email: string | null | undefined;
  role: string | null | undefined;
}): boolean => {
  if (d.role === 'FIRM_ADMIN') return true;
  const suyo = (d.email ?? '').trim().toLowerCase();
  return suyo.length > 0 && suyo === d.creadoPor.trim().toLowerCase();
};

/**
 * Guarda la tanda. Devuelve `null` si no se pudo, sin lanzar (ver la cabecera).
 */
export const guardarInterrogatorio = async (d: {
  firmId: string;
  expedienteId: string;
  creadoPor: string;
  queSeQueriaProbar: string;
  audiencia: string;
  preguntas: PreguntasDelExpediente;
  modelo: string;
  cobradoCop: number;
}): Promise<InterrogatorioEnLaLista | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLA)
      .insert({
        firm_id: d.firmId,
        expediente_id: d.expedienteId,
        creado_por: d.creadoPor,
        que_se_queria_probar: d.queSeQueriaProbar.trim() || null,
        audiencia: d.audiencia.trim() || null,
        personas: d.preguntas,
        modelo: d.modelo,
        cobrado_cop: d.cobradoCop
      })
      .select(COLUMNAS_DE_LA_LISTA)
      .single();

    if (error || !data) {
      console.error(
        '[EXPEDIENTES/INTERROGATORIOS] No se pudo guardar la tanda; el abogado la recibe pero no quedará en la lista. Puede faltar correr supabase/migration-interrogatorios.sql:',
        error?.message ?? 'sin fila devuelta'
      );
      return null;
    }
    return aLaLista({ ...(data as FilaDeInterrogatorio), personas: d.preguntas });
  } catch (err) {
    console.error(
      '[EXPEDIENTES/INTERROGATORIOS] Fallo inesperado al guardar la tanda:',
      err instanceof Error ? err.message : err
    );
    return null;
  }
};

/** Las tandas de un caso, la más nueva primero. */
export const listarInterrogatorios = async (
  firmId: string,
  expedienteId: string
): Promise<InterrogatorioEnLaLista[]> => {
  const { data, error } = await db()
    .from(TABLA)
    .select(`${COLUMNAS_DE_LA_LISTA}, personas`)
    .eq('firm_id', firmId)
    .eq('expediente_id', expedienteId)
    .order('creado_el', { ascending: false });

  if (error) {
    throw new ExpedienteError(
      'INTERROGATORIOS_FAILED',
      'No se pudieron leer los interrogatorios preparados de este expediente.',
      500
    );
  }
  return ((data ?? []) as FilaDeInterrogatorio[]).map(aLaLista);
};

/** Una tanda entera. Reabrir NO cuesta: esto no llama a ningún motor. */
export const obtenerInterrogatorio = async (
  firmId: string,
  expedienteId: string,
  id: string
): Promise<InterrogatorioGuardado> => {
  const { data, error } = await db()
    .from(TABLA)
    .select(`${COLUMNAS_DE_LA_LISTA}, personas, modelo`)
    .eq('firm_id', firmId)
    .eq('expediente_id', expedienteId)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new ExpedienteError('INTERROGATORIOS_FAILED', 'No se pudo leer el interrogatorio.', 500);
  }
  if (!data) {
    throw new ExpedienteError(
      'INTERROGATORIO_NO_EXISTE',
      'Ese interrogatorio no está en este expediente.',
      404
    );
  }
  const fila = data as FilaDeInterrogatorio;
  return { ...aLaLista(fila), preguntas: fila.personas, modelo: fila.modelo };
};

/**
 * Borra una tanda, si quien lo pide puede (ver `puedeBorrarInterrogatorio`).
 *
 * SE LEE ANTES DE BORRAR porque hay que saber quién la creó, y esa lectura ya
 * comprueba firma y expediente. Un borrado que empezara por el DELETE tendría
 * que confiar el permiso al `WHERE`, y un `WHERE` que no casa devuelve cero
 * filas — indistinguible de «no existe», que es justo lo que no se le puede
 * responder a alguien a quien se le está negando el permiso.
 */
export const borrarInterrogatorio = async (d: {
  firmId: string;
  expedienteId: string;
  id: string;
  email: string | null | undefined;
  role: string | null | undefined;
}): Promise<InterrogatorioGuardado> => {
  const tanda = await obtenerInterrogatorio(d.firmId, d.expedienteId, d.id);

  if (!puedeBorrarInterrogatorio({ creadoPor: tanda.creadoPor, email: d.email, role: d.role })) {
    throw new ExpedienteError(
      'NO_ES_SUYO',
      `Este interrogatorio lo preparó ${tanda.creadoPor}. Puede eliminarlo esa persona o un socio administrador de la firma.`,
      403
    );
  }

  const { error } = await db()
    .from(TABLA)
    .delete()
    .eq('firm_id', d.firmId)
    .eq('expediente_id', d.expedienteId)
    .eq('id', d.id);

  if (error) {
    throw new ExpedienteError('INTERROGATORIOS_FAILED', 'No se pudo eliminar el interrogatorio.', 500);
  }
  return tanda;
};
