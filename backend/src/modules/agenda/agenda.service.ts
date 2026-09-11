import { supabase } from '../../config/supabase.config';
import { esExpedienteDeLaFirma } from '../expedientes/expedientes.service';
import { auditService } from '../audit/audit.service';
import { catalogService } from '../catalog/catalog.service';
import { contarDiasHabiles, fuentesDelCalendario } from '../tools/calendario.service';
import type { Fuente } from '../tools/fuentes';
import { leerPlazoDeLaFicha, type LecturaDelPlazo } from './plazoDeLaFicha';
import {
  AgendaError,
  type EntradaDeAgenda,
  type EntradaEditada,
  type EntradaNueva,
  type EstadoDeEntrada,
  type HitoDeAviso,
  type OrigenDeLaFecha,
  type TipoDeDias
} from './types';

/**
 * La agenda de términos: leer, crear, editar, cumplir y borrar.
 *
 * ─── EL SERVIDOR RECALCULA LA FECHA LÍMITE. SIEMPRE ─────────────────────────
 *
 * El navegador manda la fecha de notificación y, cuando hace falta, el plazo.
 * La fecha límite NO viaja: la calcula aquí el mismo motor del contador de
 * términos, con los festivos de la Ley 51 de 1983 y la vacancia del Decreto
 * 1660 de 1978 que el art. 118 del CGP ordena no contar.
 *
 * Aceptar la fecha del cliente sería dejar que el navegador escoja su propio
 * vencimiento, y una fecha equivocada aquí no produce un error visible: produce
 * un aviso que llega tarde y un término perdido. La única fecha que se acepta
 * escrita es la MANUAL, y esa se acepta precisamente porque se declara como lo
 * que es —una fecha que nadie calculó— y la entrada queda marcada sin verificar.
 */

const ISO = /^\d{4}-\d{2}-\d{2}$/;

const requireClient = () => {
  if (!supabase) {
    throw new AgendaError('DATABASE_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

const texto = (valor: unknown, max: number): string | null => {
  if (typeof valor !== 'string') return null;
  const limpio = valor.trim();
  return limpio ? limpio.slice(0, max) : null;
};

const fecha = (valor: unknown, campo: string): string => {
  const v = typeof valor === 'string' ? valor.trim() : '';
  if (!ISO.test(v) || Number.isNaN(Date.parse(v))) {
    throw new AgendaError('INVALID_DATE', `${campo} debe tener el formato AAAA-MM-DD.`, 400);
  }
  return v;
};

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Suma días de calendario a partir del día SIGUIENTE al de la notificación.
 *
 * El art. 118 del CGP hace correr el término desde el día siguiente al de la
 * notificación, y eso vale igual para los días de calendario: lo que cambia con
 * ellos es que no se descuenta nada, no dónde empieza la cuenta.
 */
const sumarDiasDeCalendario = (desde: string, dias: number): string => {
  const inicio = Date.parse(`${desde}T00:00:00Z`) + DIA_MS;
  return new Date(inicio + (dias - 1) * DIA_MS).toISOString().slice(0, 10);
};

export interface FechaCalculada {
  fechaLimite: string;
  fuentes: Fuente[];
  /** Qué días se descontaron y por qué; vacío en días de calendario. */
  excluidos: Array<{ fecha: string; motivo: string }>;
}

/** El cálculo, expuesto para que la pantalla pueda mostrarlo antes de guardar. */
export const calcularFechaLimite = (
  fechaNotificacion: string,
  dias: number,
  tipo: TipoDeDias,
  rama: string | null
): FechaCalculada => {
  if (!Number.isInteger(dias) || dias <= 0 || dias > 3650) {
    throw new AgendaError('INVALID_TERM', 'El término debe ser un número entero de días entre 1 y 3650.', 400);
  }

  if (tipo === 'CALENDARIO') {
    const fechaLimite = sumarDiasDeCalendario(fechaNotificacion, dias);
    return { fechaLimite, fuentes: fuentesDelCalendario(Number(fechaLimite.slice(0, 4))), excluidos: [] };
  }

  /*
   * PENAL ATIENDE DE LUNES A MIÉRCOLES SANTOS. Decreto 1660 de 1978 art. 107
   * lit. a) exceptúa a los despachos penales de la vacancia de Semana Santa, y
   * el contador de términos ya lo distingue por jurisdicción. Aquí la
   * jurisdicción es la rama de la actuación, que la pantalla ya conoce.
   */
  const conteo = contarDiasHabiles(fechaNotificacion, dias, {
    descontarVacancia: true,
    semanaSantaCompleta: rama !== 'PENAL'
  });

  return {
    fechaLimite: conteo.fechaFin,
    fuentes: fuentesDelCalendario(Number(conteo.fechaFin.slice(0, 4))),
    excluidos: conteo.excluidos.map((d) => ({ fecha: d.fecha, motivo: d.motivo }))
  };
};

interface Fila {
  id: string;
  firm_id: string;
  asunto: string;
  radicado: string | null;
  cliente: string | null;
  actuacion_id: string | null;
  actuacion_nombre: string;
  rama: string | null;
  fecha_notificacion: string;
  fecha_limite: string;
  dias_termino: number | null;
  tipo_dias: TipoDeDias | null;
  termino_verificado: boolean;
  origen_fecha: OrigenDeLaFecha;
  termino_evidencia: string | null;
  responsable: string | null;
  estado: EstadoDeEntrada;
  cumplida_el: string | null;
  notas: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  agenda_avisos?: Array<{ hito: number }> | null;
}

const aEntrada = (f: Fila): EntradaDeAgenda => ({
  id: f.id,
  firmId: f.firm_id,
  asunto: f.asunto,
  radicado: f.radicado,
  cliente: f.cliente,
  actuacionId: f.actuacion_id,
  actuacionNombre: f.actuacion_nombre,
  rama: f.rama,
  fechaNotificacion: f.fecha_notificacion,
  fechaLimite: f.fecha_limite,
  diasTermino: f.dias_termino,
  tipoDias: f.tipo_dias,
  terminoVerificado: f.termino_verificado,
  origenFecha: f.origen_fecha,
  terminoEvidencia: f.termino_evidencia,
  responsable: f.responsable,
  estado: f.estado,
  cumplidaEl: f.cumplida_el,
  notas: f.notas,
  createdBy: f.created_by,
  createdAt: f.created_at,
  updatedAt: f.updated_at,
  avisosEnviados: (f.agenda_avisos ?? []).map((a) => a.hito as HitoDeAviso)
});

const COLUMNAS = '*, agenda_avisos(hito)';

/**
 * Qué plazo tiene esta actuación según el catálogo de ESTA firma, con su
 * curaduría aplicada. La pantalla lo pide antes de guardar para saber si
 * ofrecer el cálculo automático o pedirle el plazo al abogado.
 */
export const consultarPlazo = async (
  firmId: string,
  actuacionId: string
): Promise<{
  lectura: LecturaDelPlazo;
  actuacionNombre: string | null;
  rama: string | null;
  terminoLiteral: string | null;
  legalBasis: string | null;
  curadaPorLaFirma: boolean;
}> => {
  const { actuacion } = await catalogService.getByIdForFirm(firmId, actuacionId);
  return {
    lectura: leerPlazoDeLaFicha(actuacion),
    actuacionNombre: actuacion?.exactName ?? null,
    rama: actuacion?.branch ?? null,
    terminoLiteral: actuacion?.term.description ?? null,
    legalBasis: actuacion?.legalBasis ?? null,
    curadaPorLaFirma: Boolean(actuacion?.verification)
  };
};

/**
 * Decide la fecha límite de una entrada, y de qué manera se llegó a ella.
 *
 * TRES CAMINOS, Y LOS TRES SE DECLARAN:
 *  (a) La ficha deja leer un plazo inequívoco → se cuenta con el motor y la
 *      entrada queda VERIFICADA, porque el plazo lo comprobó el catálogo.
 *  (b) La ficha no se deja leer, pero el abogado escribe el plazo que lee en
 *      ella → se cuenta igual con el motor, y la entrada queda SIN VERIFICAR:
 *      la lectura la hizo él, no el catálogo.
 *  (c) No hay plazo en días —meses, años, «en cualquier tiempo», actuación sin
 *      catalogar— → el abogado escribe la fecha, que queda MANUAL y SIN
 *      VERIFICAR. Nunca se deduce un vencimiento de un término en meses: el
 *      motor cuenta días y fingir lo contrario sería inventar un plazo.
 */
const resolverVencimiento = async (
  firmId: string,
  datos: EntradaNueva
): Promise<{
  fechaLimite: string;
  diasTermino: number | null;
  tipoDias: TipoDeDias | null;
  terminoVerificado: boolean;
  origenFecha: OrigenDeLaFecha;
  terminoEvidencia: string | null;
  actuacionNombre: string;
  rama: string | null;
  actuacionId: string | null;
}> => {
  const fechaNotificacion = fecha(datos.fechaNotificacion, 'La fecha de notificación');
  const actuacionId = texto(datos.actuacionId, 200);

  let actuacionNombre = texto(datos.actuacionNombre, 300);
  let rama = texto(datos.rama, 60);
  let lectura: LecturaDelPlazo = {
    legible: false,
    motivo: 'Esta actuación no está en el catálogo: ninguna norma verificada respalda su término.'
  };

  if (actuacionId) {
    const consulta = await consultarPlazo(firmId, actuacionId);
    lectura = consulta.lectura;
    actuacionNombre = consulta.actuacionNombre ?? actuacionNombre;
    rama = consulta.rama ?? rama;
  }

  if (!actuacionNombre) {
    throw new AgendaError('MISSING_ACTUACION', 'Diga qué actuación se vence: elíjala del catálogo o escriba su nombre.', 400);
  }

  // (a) La ficha manda, y lo que venga del navegador como plazo se ignora.
  if (lectura.legible) {
    const { fechaLimite } = calcularFechaLimite(fechaNotificacion, lectura.plazo.dias, lectura.plazo.tipo, rama);
    return {
      fechaLimite,
      diasTermino: lectura.plazo.dias,
      tipoDias: lectura.plazo.tipo,
      terminoVerificado: true,
      origenFecha: 'CALCULADA',
      terminoEvidencia: lectura.plazo.evidencia,
      actuacionNombre,
      rama,
      actuacionId
    };
  }

  // (b) El abogado leyó el término y escribió el plazo. Se calcula igual.
  const dias = Number(datos.diasTermino);
  if (Number.isFinite(dias) && dias > 0) {
    const tipo: TipoDeDias = datos.tipoDias === 'CALENDARIO' ? 'CALENDARIO' : 'HABILES';
    const { fechaLimite } = calcularFechaLimite(fechaNotificacion, Math.trunc(dias), tipo, rama);
    return {
      fechaLimite,
      diasTermino: Math.trunc(dias),
      tipoDias: tipo,
      terminoVerificado: false,
      origenFecha: 'CALCULADA',
      terminoEvidencia: null,
      actuacionNombre,
      rama,
      actuacionId
    };
  }

  // (c) La fecha escrita a mano, que es la única que este servicio no calcula.
  const manual = texto(datos.fechaLimiteManual, 10);
  if (!manual) {
    throw new AgendaError(
      'TERM_NOT_READABLE',
      `${lectura.motivo} Escriba el plazo en días o, si no lo hay, la fecha límite.`,
      400
    );
  }

  const fechaLimite = fecha(manual, 'La fecha límite');
  if (Date.parse(fechaLimite) < Date.parse(fechaNotificacion)) {
    throw new AgendaError('INVALID_DATE', 'La fecha límite no puede ser anterior a la de notificación.', 400);
  }

  return {
    fechaLimite,
    diasTermino: null,
    tipoDias: null,
    terminoVerificado: false,
    origenFecha: 'MANUAL',
    terminoEvidencia: null,
    actuacionNombre,
    rama,
    actuacionId
  };
};

export const listar = async (
  firmId: string,
  opciones: { estado?: EstadoDeEntrada | 'TODAS' } = {}
): Promise<EntradaDeAgenda[]> => {
  const client = requireClient();
  let consulta = client.from('agenda_terminos').select(COLUMNAS).eq('firm_id', firmId);
  if (opciones.estado && opciones.estado !== 'TODAS') consulta = consulta.eq('estado', opciones.estado);

  const { data, error } = await consulta.order('fecha_limite', { ascending: true }).limit(500);
  if (error) throw new AgendaError('AGENDA_LIST_FAILED', error.message, 500);
  return ((data ?? []) as unknown as Fila[]).map(aEntrada);
};

export const crear = async (input: {
  firmId: string;
  userEmail: string;
  datos: EntradaNueva;
  ipAddress?: string | null;
}): Promise<EntradaDeAgenda> => {
  const client = requireClient();
  const asunto = texto(input.datos.asunto, 300);
  if (!asunto) throw new AgendaError('MISSING_SUBJECT', 'Escriba el asunto o el radicado del proceso.', 400);

  const v = await resolverVencimiento(input.firmId, input.datos);

  /*
   * EL EXPEDIENTE SE COMPRUEBA, NO SE CREE. Llega del cuerpo de una peticion y
   * el aislamiento de esta casa lo da el filtro por firma de cada consulta:
   * sin esto, un termino podria quedar colgando del caso de otra firma.
   *
   * Un id que no es de la firma se RECHAZA en vez de ignorarse. Aqui no hay
   * nada pagado que perder —a diferencia de la revision, donde el informe ya
   * costo— y guardar el vencimiento desatado en silencio dejaria al abogado
   * creyendo que su caso lo vigila.
   */
  const expedienteId = texto(input.datos.expedienteId, 60);
  if (expedienteId && !(await esExpedienteDeLaFirma(input.firmId, expedienteId))) {
    throw new AgendaError('EXPEDIENTE_NO_ENCONTRADO', 'Ese expediente no existe.', 404);
  }

  const { data, error } = await client
    .from('agenda_terminos')
    .insert({
      firm_id: input.firmId,
      asunto,
      radicado: texto(input.datos.radicado, 60),
      cliente: texto(input.datos.cliente, 200),
      actuacion_id: v.actuacionId,
      actuacion_nombre: v.actuacionNombre,
      rama: v.rama,
      fecha_notificacion: fecha(input.datos.fechaNotificacion, 'La fecha de notificación'),
      fecha_limite: v.fechaLimite,
      dias_termino: v.diasTermino,
      tipo_dias: v.tipoDias,
      termino_verificado: v.terminoVerificado,
      origen_fecha: v.origenFecha,
      termino_evidencia: v.terminoEvidencia,
      responsable: texto(input.datos.responsable, 200),
      notas: texto(input.datos.notas, 2000),
      expediente_id: expedienteId,
      created_by: input.userEmail
    })
    .select(COLUMNAS)
    .single();

  if (error || !data) throw new AgendaError('AGENDA_CREATE_FAILED', error?.message ?? 'No se pudo guardar.', 500);

  await auditService.record({
    firmId: input.firmId,
    userEmail: input.userEmail,
    action: 'AGENDA_TERM_CREATED',
    resource: `${asunto} · ${v.actuacionNombre} · vence ${v.fechaLimite}${v.terminoVerificado ? '' : ' (término sin verificar)'}`,
    ipAddress: input.ipAddress ?? null
  });

  return aEntrada(data as unknown as Fila);
};

export const editar = async (input: {
  firmId: string;
  userEmail: string;
  id: string;
  datos: EntradaEditada;
}): Promise<EntradaDeAgenda> => {
  const client = requireClient();

  const { data: actual, error: errorLectura } = await client
    .from('agenda_terminos')
    .select('*')
    .eq('id', input.id)
    .eq('firm_id', input.firmId)
    .maybeSingle();

  if (errorLectura) throw new AgendaError('AGENDA_READ_FAILED', errorLectura.message, 500);
  if (!actual) throw new AgendaError('NOT_FOUND', 'Esa entrada de la agenda no existe.', 404);

  const previa = actual as unknown as Fila;
  const cambios: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (input.datos.asunto !== undefined) {
    const asunto = texto(input.datos.asunto, 300);
    if (!asunto) throw new AgendaError('MISSING_SUBJECT', 'El asunto no puede quedar vacío.', 400);
    cambios.asunto = asunto;
  }
  if (input.datos.radicado !== undefined) cambios.radicado = texto(input.datos.radicado, 60);
  if (input.datos.cliente !== undefined) cambios.cliente = texto(input.datos.cliente, 200);
  if (input.datos.responsable !== undefined) cambios.responsable = texto(input.datos.responsable, 200);
  if (input.datos.notas !== undefined) cambios.notas = texto(input.datos.notas, 2000);

  if (input.datos.estado !== undefined) {
    const estado = input.datos.estado;
    if (!['PENDIENTE', 'CUMPLIDA', 'ARCHIVADA'].includes(estado)) {
      throw new AgendaError('INVALID_STATE', 'El estado debe ser PENDIENTE, CUMPLIDA o ARCHIVADA.', 400);
    }
    cambios.estado = estado;
    cambios.cumplida_el = estado === 'CUMPLIDA' ? new Date().toISOString() : null;
  }

  /*
   * MOVER LA FECHA DE NOTIFICACIÓN O EL PLAZO REHACE LA CUENTA EN EL SERVIDOR.
   * Dejar la fecha límite vieja junto a una notificación nueva daría una
   * entrada que se contradice a sí misma, y el aviso saldría por la fecha
   * vieja: el error no se vería hasta que fuera tarde.
   */
  const tocaElReloj =
    input.datos.fechaNotificacion !== undefined ||
    input.datos.diasTermino !== undefined ||
    input.datos.tipoDias !== undefined ||
    input.datos.fechaLimiteManual !== undefined ||
    input.datos.actuacionId !== undefined;

  if (tocaElReloj) {
    const v = await resolverVencimiento(input.firmId, {
      asunto: previa.asunto,
      actuacionId: input.datos.actuacionId ?? previa.actuacion_id,
      actuacionNombre: input.datos.actuacionNombre ?? previa.actuacion_nombre,
      rama: input.datos.rama ?? previa.rama,
      fechaNotificacion: input.datos.fechaNotificacion ?? previa.fecha_notificacion,
      diasTermino: input.datos.diasTermino,
      tipoDias: input.datos.tipoDias,
      fechaLimiteManual: input.datos.fechaLimiteManual
    });
    cambios.actuacion_id = v.actuacionId;
    cambios.actuacion_nombre = v.actuacionNombre;
    cambios.rama = v.rama;
    cambios.fecha_notificacion = input.datos.fechaNotificacion ?? previa.fecha_notificacion;
    cambios.fecha_limite = v.fechaLimite;
    cambios.dias_termino = v.diasTermino;
    cambios.tipo_dias = v.tipoDias;
    cambios.termino_verificado = v.terminoVerificado;
    cambios.origen_fecha = v.origenFecha;
    cambios.termino_evidencia = v.terminoEvidencia;
  }

  const { data, error } = await client
    .from('agenda_terminos')
    .update(cambios)
    .eq('id', input.id)
    .eq('firm_id', input.firmId)
    .select(COLUMNAS)
    .single();

  if (error || !data) throw new AgendaError('AGENDA_UPDATE_FAILED', error?.message ?? 'No se pudo guardar.', 500);
  return aEntrada(data as unknown as Fila);
};

export const borrar = async (input: {
  firmId: string;
  userEmail: string;
  id: string;
  ipAddress?: string | null;
}): Promise<void> => {
  const client = requireClient();

  const { data, error } = await client
    .from('agenda_terminos')
    .delete()
    .eq('id', input.id)
    .eq('firm_id', input.firmId)
    .select('asunto, actuacion_nombre, fecha_limite')
    .maybeSingle();

  if (error) throw new AgendaError('AGENDA_DELETE_FAILED', error.message, 500);
  if (!data) throw new AgendaError('NOT_FOUND', 'Esa entrada de la agenda no existe.', 404);

  const borrada = data as { asunto: string; actuacion_nombre: string; fecha_limite: string };

  await auditService.record({
    firmId: input.firmId,
    userEmail: input.userEmail,
    action: 'AGENDA_TERM_DELETED',
    resource: `${borrada.asunto} · ${borrada.actuacion_nombre} · vencía ${borrada.fecha_limite}`,
    ipAddress: input.ipAddress ?? null
  });
};
