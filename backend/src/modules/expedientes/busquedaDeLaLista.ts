import type { LecturaCompleta } from '../../config/leerTodasLasFilas';
import type { DatosDeBusquedaDelCaso, Expediente, LadoEnElExpediente, PapelEnElExpediente, PersonaEnLista } from './types';

/**
 * LOS DATOS CON LOS QUE EL ABOGADO ENCUENTRA UN CASO EN LA LISTA. Decisión pura.
 *
 * El 14 de septiembre el dueño pidió encontrar un caso por la cédula o el NIT,
 * por el nombre de cualquier persona del caso —la contraparte incluida— o por
 * el radicado. El radicado ya viajaba; aquí se añaden, por caso, el documento
 * del cliente atado y las personas registradas en el expediente.
 *
 * ─── LO QUE SE LEE, Y LO QUE NO ────────────────────────────────────────────
 *
 * De cada actor, nombre, identificación, papel y lado. NUNCA `sobre_que` ni
 * `notas`: son contenido del caso, la lista no busca en ellos, y mil casos con
 * sus notas harían de la lista la respuesta más pesada del producto.
 *
 * ─── «NO SE LEYÓ» NO ES «NO HAY» ───────────────────────────────────────────
 *
 * Si los actores no se pudieron leer, `personas` es null y la lista trae un
 * aviso: una lista vacía diría «este caso no tiene a nadie», y el abogado que
 * busca a la contraparte concluiría que el caso no existe. Lo mismo con el
 * documento del cliente.
 */

/** Filas tal como las piden las consultas de la lista. */
export interface FilaDeClienteDeLaLista {
  id: string;
  firm_id: string;
  full_name: string;
  document_id: string | null;
}

export interface FilaDeActorDeLaLista {
  id: string;
  expediente_id: string;
  nombre: string;
  identificacion: string | null;
  papel: string;
  lado: string;
}

/**
 * CUÁNTOS IDS VIAJAN EN UN `.in()`. PostgREST los pone en la URL: mil UUID son
 * unos 37 KB de URL, más de lo que aceptan los proxies de por medio. Doscientos
 * son unos 7,5 KB.
 */
export const TANDA_DE_IDS = 200;

/**
 * Lee por tandas de ids y junta. Una tanda fallida —o que lanza— hace fallida
 * la lectura entera: una lista parcial de personas se leería como completa.
 */
export const leerEnTandas = async <T>(
  ids: readonly string[],
  leerTanda: (tanda: string[]) => Promise<LecturaCompleta<T>>
): Promise<LecturaCompleta<T>> => {
  const filas: T[] = [];
  for (let i = 0; i < ids.length; i += TANDA_DE_IDS) {
    let parte: LecturaCompleta<T>;
    try {
      parte = await leerTanda(ids.slice(i, i + TANDA_DE_IDS));
    } catch (err) {
      return { filas, falla: `tanda ${i / TANDA_DE_IDS + 1}: ${(err as Error).message}` };
    }
    filas.push(...parte.filas);
    if (parte.falla !== null) return { filas, falla: `tanda ${i / TANDA_DE_IDS + 1}: ${parte.falla}` };
  }
  return { filas, falla: null };
};

export interface DatosDeBusquedaPorExpediente extends DatosDeBusquedaDelCaso {
  clienteNombre: string | null;
  /** Cuántos actores tiene; ausente si no se pudieron leer, nunca un cero inventado. */
  actores?: number;
}

export const datosDeBusquedaPorExpediente = (entrada: {
  firmId: string;
  expedientes: readonly Expediente[];
  clientes: LecturaCompleta<FilaDeClienteDeLaLista>;
  actores: LecturaCompleta<FilaDeActorDeLaLista>;
}): { porExpediente: Map<string, DatosDeBusquedaPorExpediente>; aviso: string | null } => {
  const clientesLeidos = entrada.clientes.falla === null;
  const actoresLeidos = entrada.actores.falla === null;

  /*
   * El filtro por firma se repite aquí aunque la consulta ya lo traiga: es el
   * mismo cinturón de `terminosPorExpediente`, y cuesta una comparación.
   */
  const clientes = new Map<string, FilaDeClienteDeLaLista>();
  if (clientesLeidos) {
    for (const c of entrada.clientes.filas) if (c.firm_id === entrada.firmId) clientes.set(c.id, c);
  }

  /*
   * LOS ACTORES NO TIENEN `firm_id`: pertenecen a la firma por su expediente.
   * Solo se asigna una fila a un caso de ESTA lista, que ya salió filtrada por
   * firma; una fila de otro expediente no tiene a dónde ir y se descarta.
   */
  const personas = new Map<string, PersonaEnLista[]>(entrada.expedientes.map((e) => [e.id, []]));
  if (actoresLeidos) {
    for (const a of entrada.actores.filas) {
      personas.get(a.expediente_id)?.push({
        nombre: a.nombre,
        identificacion: a.identificacion,
        papel: a.papel as PapelEnElExpediente,
        lado: a.lado as LadoEnElExpediente
      });
    }
  }

  const porExpediente = new Map<string, DatosDeBusquedaPorExpediente>();
  for (const e of entrada.expedientes) {
    const c = e.clienteId ? clientes.get(e.clienteId) : undefined;
    const suyas = actoresLeidos ? personas.get(e.id) ?? [] : null;
    porExpediente.set(e.id, {
      clienteNombre: c?.full_name ?? null,
      clienteDocumento: c?.document_id ?? null,
      personas: suyas,
      ...(suyas !== null ? { actores: suyas.length } : {})
    });
  }

  const faltas = [
    actoresLeidos ? null : 'las personas de los casos',
    clientesLeidos ? null : 'los nombres y documentos de los clientes'
  ].filter((x): x is string => x !== null);

  return {
    porExpediente,
    aviso:
      faltas.length === 0
        ? null
        : `No se pudieron leer ${faltas.join(' ni ')}: la búsqueda por nombre o por cédula puede no encontrar un caso que sí existe.`
  };
};
