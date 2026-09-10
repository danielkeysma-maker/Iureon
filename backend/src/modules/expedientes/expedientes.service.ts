import { supabase } from '../../config/supabase.config';
import {
  ESTADOS_DE_EXPEDIENTE,
  LADOS,
  PAPELES,
  TABLA_DE_PIEZA,
  type ActorDelExpediente,
  type DatosDeActor,
  type DatosDeExpediente,
  type Expediente,
  type ExpedienteConDetalle,
  type TipoDePieza
} from './types';

/**
 * El expediente y lo que cuelga de él. Ver `types.ts` para el porqué del módulo.
 *
 * ─── LA REGLA QUE GOBIERNA CADA FUNCIÓN DE ESTE ARCHIVO ────────────────────
 *
 * TODA consulta filtra por `firm_id`, y las de los hijos comprueban LOS DOS
 * LADOS. El backend entra con service_role, que omite RLS por diseño
 * (`schema.sql`), así que el aislamiento efectivo lo da este filtro y no la
 * política: una consulta que se olvide del `firm_id` no falla, devuelve datos
 * de otra firma. Es el patrón que ya usa `clients.linkTranscription`, y aquí
 * importa más porque el expediente ata cinco tablas distintas.
 */

export class ExpedienteError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.name = 'ExpedienteError';
    this.code = code;
    this.status = status;
  }
}

const db = () => {
  if (!supabase) {
    throw new ExpedienteError('NO_DB', 'La base de datos no está configurada.', 503);
  }
  return supabase;
};

interface FilaDeExpediente {
  id: string;
  caratula: string;
  radicado: string | null;
  despacho: string | null;
  rama: string | null;
  cliente_id: string | null;
  contraparte: string | null;
  estado: string;
  notas: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface FilaDeActor {
  id: string;
  expediente_id: string;
  nombre: string;
  papel: string;
  lado: string;
  sobre_que: string | null;
  identificacion: string | null;
  notas: string | null;
  cliente_id: string | null;
  created_at: string;
}

const aExpediente = (row: FilaDeExpediente, clienteNombre: string | null = null): Expediente => ({
  id: row.id,
  caratula: row.caratula,
  radicado: row.radicado,
  despacho: row.despacho,
  rama: row.rama,
  clienteId: row.cliente_id,
  clienteNombre,
  contraparte: row.contraparte,
  estado: row.estado as Expediente['estado'],
  notas: row.notas,
  createdBy: row.created_by,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

const aActor = (row: FilaDeActor): ActorDelExpediente => ({
  id: row.id,
  expedienteId: row.expediente_id,
  nombre: row.nombre,
  papel: row.papel as ActorDelExpediente['papel'],
  lado: row.lado as ActorDelExpediente['lado'],
  sobreQue: row.sobre_que,
  identificacion: row.identificacion,
  notas: row.notas,
  clienteId: row.cliente_id,
  createdAt: row.created_at
});

/** Recorta y convierte «» en null, que es lo que la columna espera. */
const texto = (v: string | null | undefined): string | null => {
  const t = (v ?? '').trim();
  return t.length > 0 ? t : null;
};

/*
 * NO HAY TRIGGER DE `updated_at` EN ESTE PROYECTO — se comprobó: los únicos
 * triggers son el de auditoría inmutable y el del radicado de borradores. Se
 * escribe a mano, como en `clients` y en `document_reviews`.
 */
const ahora = (): string => new Date().toISOString();

// ─── EXPEDIENTES ─────────────────────────────────────────────────────────────

export const listarExpedientes = async (firmId: string): Promise<Expediente[]> => {
  const { data, error } = await db()
    .from('expedientes')
    .select('*')
    .eq('firm_id', firmId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[EXPEDIENTES] No se pudieron listar:', error.message);
    throw new ExpedienteError('LIST_FAILED', 'No se pudieron cargar los expedientes.', 502);
  }

  const filas = (data ?? []) as FilaDeExpediente[];
  if (filas.length === 0) return [];

  /*
   * DOS CONSULTAS PARA LA LISTA ENTERA, no dos por expediente. Un despacho con
   * cuarenta asuntos haría ochenta viajes a la base para pintar una pantalla —
   * es el mismo criterio con el que `listClients` cuenta entrevistas.
   */
  const idsDeCliente = [...new Set(filas.map((f) => f.cliente_id).filter((x): x is string => Boolean(x)))];
  const nombres = new Map<string, string>();
  if (idsDeCliente.length > 0) {
    const { data: clientes } = await db()
      .from('clients')
      .select('id, full_name')
      .eq('firm_id', firmId)
      .in('id', idsDeCliente);
    for (const c of (clientes ?? []) as { id: string; full_name: string }[]) {
      nombres.set(c.id, c.full_name);
    }
  }

  const { data: actores } = await db()
    .from('expediente_actores')
    .select('expediente_id')
    .in('expediente_id', filas.map((f) => f.id));

  const cuantos = new Map<string, number>();
  for (const a of (actores ?? []) as { expediente_id: string }[]) {
    cuantos.set(a.expediente_id, (cuantos.get(a.expediente_id) ?? 0) + 1);
  }

  return filas.map((f) => ({
    ...aExpediente(f, f.cliente_id ? nombres.get(f.cliente_id) ?? null : null),
    actores: cuantos.get(f.id) ?? 0
  }));
};

/** El expediente, sus actores y CUÁNTAS piezas tiene atadas. */
export const obtenerExpediente = async (
  firmId: string,
  id: string
): Promise<ExpedienteConDetalle> => {
  const { data, error } = await db()
    .from('expedientes')
    .select('*')
    .eq('firm_id', firmId)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[EXPEDIENTES] No se pudo leer:', error.message);
    throw new ExpedienteError('READ_FAILED', 'No se pudo cargar el expediente.', 502);
  }
  if (!data) throw new ExpedienteError('NOT_FOUND', 'Ese expediente no existe.', 404);

  const fila = data as FilaDeExpediente;

  let clienteNombre: string | null = null;
  if (fila.cliente_id) {
    const { data: cliente } = await db()
      .from('clients')
      .select('full_name')
      .eq('firm_id', firmId)
      .eq('id', fila.cliente_id)
      .maybeSingle();
    clienteNombre = (cliente as { full_name: string } | null)?.full_name ?? null;
  }

  const { data: actores } = await db()
    .from('expediente_actores')
    .select('*')
    .eq('expediente_id', id)
    .order('created_at', { ascending: true });

  /*
   * CUENTAS, NO CONTENIDO. La pantalla necesita saber que hay tres entrevistas
   * para poder ofrecerlas; traerlas enteras haría de este endpoint el más
   * pesado del producto para pintar unos números.
   *
   * `head: true` pide solo el conteo: no viaja una sola fila.
   */
  const contar = async (tabla: string, extra?: [string, string]): Promise<number> => {
    let q = db().from(tabla).select('id', { count: 'exact', head: true }).eq('expediente_id', id);
    if (extra) q = q.eq(extra[0], extra[1]);
    const { count } = await q;
    return count ?? 0;
  };

  const [entrevistas, audiencias, revisiones, borradores, terminos, orientaciones] = await Promise.all([
    contar('transcriptions', ['kind', 'ENTREVISTA']),
    contar('transcriptions', ['kind', 'AUDIENCIA']),
    contar('document_reviews'),
    contar('saved_drafts'),
    contar('agenda_terminos'),
    contar('orientaciones')
  ]);

  return {
    ...aExpediente(fila, clienteNombre),
    listaDeActores: ((actores ?? []) as FilaDeActor[]).map(aActor),
    piezas: { entrevistas, audiencias, revisiones, borradores, terminos, orientaciones }
  };
};

export const crearExpediente = async (
  firmId: string,
  userEmail: string,
  datos: DatosDeExpediente
): Promise<Expediente> => {
  const caratula = texto(datos.caratula);
  if (!caratula) {
    throw new ExpedienteError('MISSING_CARATULA', 'El expediente necesita un nombre para poder encontrarlo después.');
  }
  if (datos.estado && !ESTADOS_DE_EXPEDIENTE.includes(datos.estado)) {
    throw new ExpedienteError('INVALID_ESTADO', 'Ese estado no existe.');
  }

  /*
   * EL CLIENTE SE COMPRUEBA CONTRA LA FIRMA ANTES DE ATARLO. Sin esto, un id
   * de cliente de otra firma entraría por el body y quedaría escrito: la FK de
   * la base solo exige que el cliente exista, no que sea de quien lo ata.
   */
  const clienteId = await clienteDeLaFirma(firmId, datos.clienteId);

  const { data, error } = await db()
    .from('expedientes')
    .insert({
      firm_id: firmId,
      caratula,
      radicado: texto(datos.radicado),
      despacho: texto(datos.despacho),
      rama: texto(datos.rama),
      cliente_id: clienteId,
      contraparte: texto(datos.contraparte),
      estado: datos.estado ?? 'ACTIVO',
      notas: texto(datos.notas),
      created_by: userEmail
    })
    .select()
    .single();

  if (error) {
    console.error('[EXPEDIENTES] No se pudo crear:', error.message);
    throw new ExpedienteError('CREATE_FAILED', 'No se pudo crear el expediente.', 502);
  }

  return aExpediente(data as FilaDeExpediente);
};

export const actualizarExpediente = async (
  firmId: string,
  id: string,
  datos: Partial<DatosDeExpediente>
): Promise<Expediente> => {
  if (datos.estado && !ESTADOS_DE_EXPEDIENTE.includes(datos.estado)) {
    throw new ExpedienteError('INVALID_ESTADO', 'Ese estado no existe.');
  }

  const cambios: Record<string, unknown> = { updated_at: ahora() };
  if (datos.caratula !== undefined) {
    const caratula = texto(datos.caratula);
    if (!caratula) throw new ExpedienteError('MISSING_CARATULA', 'El expediente no se puede quedar sin nombre.');
    cambios.caratula = caratula;
  }
  if (datos.radicado !== undefined) cambios.radicado = texto(datos.radicado);
  if (datos.despacho !== undefined) cambios.despacho = texto(datos.despacho);
  if (datos.rama !== undefined) cambios.rama = texto(datos.rama);
  if (datos.contraparte !== undefined) cambios.contraparte = texto(datos.contraparte);
  if (datos.notas !== undefined) cambios.notas = texto(datos.notas);
  if (datos.estado !== undefined) cambios.estado = datos.estado;
  if (datos.clienteId !== undefined) cambios.cliente_id = await clienteDeLaFirma(firmId, datos.clienteId);

  const { data, error } = await db()
    .from('expedientes')
    .update(cambios)
    .eq('firm_id', firmId)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[EXPEDIENTES] No se pudo actualizar:', error.message);
    throw new ExpedienteError('UPDATE_FAILED', 'No se pudo guardar el expediente.', 502);
  }
  if (!data) throw new ExpedienteError('NOT_FOUND', 'Ese expediente no existe.', 404);

  return aExpediente(data as FilaDeExpediente);
};

/**
 * Borra el expediente. NO borra lo que colgaba de él.
 *
 * Las cinco columnas `expediente_id` son `ON DELETE SET NULL`: el borrador que
 * costó saldo, la revisión que se pagó y el vencimiento que todavía corre se
 * DESATAN y siguen ahí. Borrar una carpeta no puede borrar el trabajo que
 * había dentro — es el mismo criterio con el que borrar un cliente no borra su
 * entrevista.
 *
 * Los actores sí se van, porque solo existen dentro del expediente (CASCADE).
 */
export const borrarExpediente = async (firmId: string, id: string): Promise<void> => {
  const { data, error } = await db()
    .from('expedientes')
    .delete()
    .eq('firm_id', firmId)
    .eq('id', id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[EXPEDIENTES] No se pudo borrar:', error.message);
    throw new ExpedienteError('DELETE_FAILED', 'No se pudo borrar el expediente.', 502);
  }
  if (!data) throw new ExpedienteError('NOT_FOUND', 'Ese expediente no existe.', 404);
};

// ─── ACTORES ────────────────────────────────────────────────────────────────

/** Comprueba que el expediente sea de la firma antes de tocar a sus hijos. */
const expedienteDeLaFirma = async (firmId: string, expedienteId: string): Promise<void> => {
  const { data } = await db()
    .from('expedientes')
    .select('id')
    .eq('firm_id', firmId)
    .eq('id', expedienteId)
    .maybeSingle();
  if (!data) throw new ExpedienteError('NOT_FOUND', 'Ese expediente no existe.', 404);
};

/** Y que el cliente también lo sea, cuando se ata uno. */
const clienteDeLaFirma = async (
  firmId: string,
  clienteId: string | null | undefined
): Promise<string | null> => {
  if (!clienteId) return null;
  const { data } = await db()
    .from('clients')
    .select('id')
    .eq('firm_id', firmId)
    .eq('id', clienteId)
    .maybeSingle();
  if (!data) throw new ExpedienteError('CLIENT_NOT_FOUND', 'Ese cliente no existe en su firma.', 404);
  return clienteId;
};

export const agregarActor = async (
  firmId: string,
  expedienteId: string,
  datos: DatosDeActor
): Promise<ActorDelExpediente> => {
  await expedienteDeLaFirma(firmId, expedienteId);

  const nombre = texto(datos.nombre);
  if (!nombre) throw new ExpedienteError('MISSING_NOMBRE', 'El actor necesita un nombre.');
  /*
   * UN PAPEL QUE NO ESTÁ EN LA LISTA SE RECHAZA, pero NO haberlo dicho no es un
   * error: el actor entra como DESCONOCIDO, igual que una voz sin identificar
   * en un transcrito. Obligar a clasificar a alguien antes de poder anotarlo
   * llevaría a clasificarlo a dedo, que es peor que no saberlo.
   */
  const papel = datos.papel ?? 'DESCONOCIDO';
  if (!PAPELES.includes(papel)) {
    throw new ExpedienteError('INVALID_PAPEL', 'Ese papel procesal no está en la lista.');
  }
  if (datos.lado && !LADOS.includes(datos.lado)) {
    throw new ExpedienteError('INVALID_LADO', 'El lado solo puede ser propio, contrario o neutral.');
  }

  const { data, error } = await db()
    .from('expediente_actores')
    .insert({
      expediente_id: expedienteId,
      nombre,
      papel,
      lado: datos.lado ?? 'NEUTRAL',
      sobre_que: texto(datos.sobreQue),
      identificacion: texto(datos.identificacion),
      notas: texto(datos.notas),
      cliente_id: await clienteDeLaFirma(firmId, datos.clienteId)
    })
    .select()
    .single();

  if (error) {
    console.error('[EXPEDIENTES] No se pudo agregar el actor:', error.message);
    throw new ExpedienteError('ACTOR_FAILED', 'No se pudo agregar a esa persona.', 502);
  }

  await tocar(firmId, expedienteId);
  return aActor(data as FilaDeActor);
};

export const borrarActor = async (
  firmId: string,
  expedienteId: string,
  actorId: string
): Promise<void> => {
  await expedienteDeLaFirma(firmId, expedienteId);

  const { data, error } = await db()
    .from('expediente_actores')
    .delete()
    .eq('expediente_id', expedienteId)
    .eq('id', actorId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[EXPEDIENTES] No se pudo borrar el actor:', error.message);
    throw new ExpedienteError('ACTOR_DELETE_FAILED', 'No se pudo quitar a esa persona.', 502);
  }
  if (!data) throw new ExpedienteError('ACTOR_NOT_FOUND', 'Esa persona no está en el expediente.', 404);

  await tocar(firmId, expedienteId);
};

// ─── ATAR Y DESATAR PIEZAS ──────────────────────────────────────────────────

/**
 * Ata (o desata, con `expedienteId: null`) una pieza que ya existe.
 *
 * ─── SE COMPRUEBAN LOS DOS LADOS, SIEMPRE ──────────────────────────────────
 *
 * La pieza tiene que ser de la firma Y el expediente también. Comprobar solo
 * uno deja pasar el caso que importa: un id de otra firma llegado por el body.
 * Es exactamente lo que hace `clients.linkTranscription`, y aquí hay cinco
 * tablas en vez de una.
 *
 * ATAR ES UNA OPERACIÓN, NO CINCO. Un endpoint por tabla habría multiplicado
 * por cinco la comprobación de pertenencia, que es justo la que no se puede
 * olvidar en ninguna.
 */
export const atarPieza = async (
  firmId: string,
  tipo: TipoDePieza,
  piezaId: string,
  expedienteId: string | null
): Promise<void> => {
  const tabla = TABLA_DE_PIEZA[tipo];
  if (!tabla) throw new ExpedienteError('INVALID_TIPO', 'Eso no se puede atar a un expediente.');

  if (expedienteId) await expedienteDeLaFirma(firmId, expedienteId);

  const { data, error } = await db()
    .from(tabla)
    .update({ expediente_id: expedienteId })
    .eq('firm_id', firmId)
    .eq('id', piezaId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error(`[EXPEDIENTES] No se pudo atar ${tipo}:`, error.message);
    throw new ExpedienteError('LINK_FAILED', 'No se pudo atar al expediente.', 502);
  }
  if (!data) throw new ExpedienteError('PIEZA_NOT_FOUND', 'Eso no existe en su firma.', 404);

  if (expedienteId) await tocar(firmId, expedienteId);
};

/*
 * El expediente se ordena por `updated_at`, así que atarle algo o sumarle una
 * persona tiene que subirlo en la lista: para el abogado, el asunto en el que
 * acaba de trabajar es el más reciente, aunque su ficha no haya cambiado.
 *
 * Nunca lanza. Es cosmética de ordenación, y fallar aquí no puede deshacer un
 * vínculo que ya quedó escrito.
 */
const tocar = async (firmId: string, expedienteId: string): Promise<void> => {
  const { error } = await db()
    .from('expedientes')
    .update({ updated_at: ahora() })
    .eq('firm_id', firmId)
    .eq('id', expedienteId);
  if (error) console.warn('[EXPEDIENTES] No se pudo actualizar la fecha:', error.message);
};
