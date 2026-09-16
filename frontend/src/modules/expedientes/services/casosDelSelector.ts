import { CLAVE_DE_CASOS_RECIENTES } from '../../auth/session';
import { compararEnEspanol } from '../../workspace/services/fichaEnLaLista';
import { CLAVE_SIN_RAMA, SIN_RAMA, etiquetaDeRama, type CasoIndexado } from './buscarCasos';
import type { CasoBuscable } from '../types';

/**
 * EL ORDEN Y LOS GRUPOS DEL SELECTOR DE «DE QUÉ CASO ES». Funciones puras.
 *
 * ─── QUÉ PROBLEMA RESUELVE ─────────────────────────────────────────────────
 *
 * El selector compartido —Orientación, «Añadir» de la agenda, subir audiencia,
 * revisar un documento y las dos barras de Redacción— listaba los casos tal
 * como llegaban del servidor, con la carátula y el radicado, y se filtraba por
 * un «contiene» sobre esas dos cadenas. Con doce casos eso basta. Con
 * doscientos, el abogado no encuentra el suyo: escribe la cédula del cliente y
 * no sale nada, escribe el radicado con guiones y tampoco, y acaba
 * desplazándose por una lista alfabética por carátula que no dice de quién es
 * cada asunto.
 *
 * ─── LAS REGLAS DE BÚSQUEDA NO SE ESCRIBEN AQUÍ ────────────────────────────
 *
 * Están en `buscarCasos.ts`, que es lo que ya usa «Mis casos»: cédula por
 * dígitos y desde el principio, radicado por segmentos, nombre de cliente, de
 * contraparte y de cada persona, carátula, despacho, y la rama por su código y
 * por su nombre del catálogo. Este archivo NO las repite: ordena y agrupa lo
 * que aquéllas devuelven. Dos copias de la regla de la cédula es cómo se llega
 * a que la lista la corrija y el selector no.
 *
 * ─── EL ORDEN: LO ABIERTO HACE POCO, PERO SIN ROMPER EL GRUPO ──────────────
 *
 * El dueño pidió dos cosas que tiran en direcciones distintas: agrupar por
 * cliente, y que lo abierto hace poco salga primero. Un grupo tiene que ser
 * CONTIGUO —un cliente que aparece dos veces en la misma lista se lee como dos
 * clientes—, así que la recencia ordena los GRUPOS por su caso más reciente, y
 * dentro del grupo ordena los casos. Un cliente sin nada reciente cae detrás,
 * por nombre con la colación española.
 *
 * Es la lectura honesta de las dos peticiones juntas: el asunto que se tocó
 * esta mañana está arriba, y sigue estando bajo el nombre de su cliente.
 */

/**
 * Cuántos casos hacen falta para que el filtro de rama valga la pena.
 *
 * Con treinta o menos, la lista entera cabe en dos pantallazos y el filtro es
 * un control que ocupa sitio para ahorrar un desplazamiento — un paso de más,
 * como la lupa sobre cinco opciones. A partir de ahí, escoger la rama recorta
 * la lista a una fracción y empieza a pagar su espacio. El número no sale de
 * ningún estudio: sale de la forma de la lista, y está escrito en un solo sitio
 * para poder cambiarlo con una cifra.
 */
export const CASOS_PARA_FILTRAR_POR_RAMA = 30;

/** Cuántos casos recientes se recuerdan. Más allá, «reciente» deja de significar nada. */
export const CUANTOS_RECIENTES = 12;

/* ─── LA MEMORIA DE LO ABIERTO HACE POCO ─────────────────────────────────── */

/**
 * La lista de ids con `id` al frente y sin repetirlo, recortada al tope.
 *
 * Pura: quien la guarde decide dónde. Volver a escoger un caso que ya estaba
 * lo SUBE en vez de duplicarlo, que es lo que uno espera de «lo último que
 * abrí»; y el tope se aplica al final, así que el más viejo se cae solo.
 */
export const recordarCaso = (recientes: readonly string[], id: string, tope = CUANTOS_RECIENTES): string[] => {
  const limpio = id.trim();
  if (!limpio) return [...recientes];
  return [limpio, ...recientes.filter((x) => x !== limpio)].slice(0, tope);
};

/** Puesto de cada id, 0 el más reciente. `Infinity` para el que no está. */
const puestos = (recientes: readonly string[]): Map<string, number> =>
  new Map(recientes.map((id, i) => [id, i]));

/* ─── DÓNDE SE GUARDA, Y POR QUÉ AHÍ ─────────────────────────────────────── */

/**
 * `localStorage`, bajo `iureon:casos-recientes`, un objeto
 * `{ "<correo>": ["<id>", …] }` con hasta ${CUANTOS_RECIENTES} ids por persona.
 *
 * ─── POR CORREO, Y NO UNA LISTA SUELTA ─────────────────────────────────────
 *
 * Dos abogados de la misma firma comparten a menudo un equipo, y «lo que abrí
 * hace poco» es de cada uno: una lista común pondría arriba, a quien entra
 * después, los asuntos del anterior. Y al cambiar de usuario nada se mezcla,
 * porque cada quien lee su propia rama del objeto.
 *
 * ─── MUERE CON LA SESIÓN ───────────────────────────────────────────────────
 *
 * La clave está declarada en `auth/session.ts` y `clearSession` la borra. Son
 * los nombres de los asuntos de una firma; dejarlos en el equipo después de
 * cerrar sesión los pondría delante de quien entre después, que puede ser de
 * otra firma. Se importa la constante en vez de copiar el texto: dos literales
 * iguales es cómo se llega a que alguien renombre uno y el borrado deje de
 * alcanzar al otro.
 *
 * ─── TODO DENTRO DE try/catch, Y SIN ALMACENAMIENTO SIGUE SIRVIENDO ────────
 *
 * En una ventana privada, con las cookies bloqueadas o con la cuota llena, leer
 * o escribir LANZA. Un selector que no abre porque no pudo recordar el orden
 * sería cambiar una comodidad por la función entera: sin almacenamiento la
 * lista sale agrupada y alfabética, que es exactamente lo de antes.
 */
const leerMapa = (): Record<string, string[]> => {
  try {
    const crudo = window.localStorage.getItem(CLAVE_DE_CASOS_RECIENTES);
    if (!crudo) return {};
    const leido: unknown = JSON.parse(crudo);
    return leido !== null && typeof leido === 'object' && !Array.isArray(leido)
      ? (leido as Record<string, string[]>)
      : {};
  } catch {
    return {};
  }
};

/** Los ids que este usuario abrió hace poco, el más reciente primero. Nunca lanza. */
export const casosRecientesDe = (correo: string | null | undefined): string[] => {
  const suyo = (correo ?? '').trim().toLowerCase();
  if (!suyo) return [];
  const lista = leerMapa()[suyo];
  /* Una rama que no sea un arreglo de cadenas es basura de otra versión: se ignora, no se repara. */
  return Array.isArray(lista) ? lista.filter((x): x is string => typeof x === 'string') : [];
};

/** Anota que este usuario acaba de escoger ese caso. Devuelve la lista que queda. */
export const anotarCasoAbierto = (correo: string | null | undefined, id: string): string[] => {
  const suyo = (correo ?? '').trim().toLowerCase();
  if (!suyo || !id.trim()) return casosRecientesDe(correo);
  const lista = recordarCaso(casosRecientesDe(correo), id);
  try {
    window.localStorage.setItem(CLAVE_DE_CASOS_RECIENTES, JSON.stringify({ ...leerMapa(), [suyo]: lista }));
  } catch {
    /* El orden vive lo que dure la pestaña. Ver la cabecera. */
  }
  return lista;
};

/* ─── LOS GRUPOS ─────────────────────────────────────────────────────────── */

/** Bajo qué nombre se agrupa un caso. Sin cliente registrado, el suyo propio. */
export const SIN_CLIENTE = 'Sin cliente registrado';

export const clienteDelCaso = (caso: CasoBuscable): string => caso.clienteNombre?.trim() || SIN_CLIENTE;

export interface CasoParaEscoger<T extends CasoBuscable = CasoBuscable> {
  caso: T;
  /** El nombre del cliente, o «Sin cliente registrado». Es la cabecera del grupo. */
  cliente: string;
  /** Lo que va bajo la carátula: la rama, y el radicado cuando lo hay. */
  rama: string;
  /** Si este caso está entre los abiertos hace poco. */
  reciente: boolean;
}

/**
 * Los casos listos para pintar: agrupados por cliente, con la rama al lado, y
 * ordenados como dice la cabecera.
 *
 * ─── EL DESEMPATE ESTÁ ESCRITO, NO ES EL AZAR DEL SERVIDOR ─────────────────
 *
 * Dos casos del mismo cliente, ninguno reciente, se ordenan por carátula con la
 * colación española; dos grupos sin nada reciente, por el nombre del cliente.
 * «Sin cliente registrado» va al final salvo que tenga un caso reciente: el
 * montón de los huérfanos no encabeza una lista, pero si el abogado acaba de
 * trabajar en uno, ahí está.
 *
 * Sin eso el orden lo decidiría el orden en que el servidor devolvió las filas,
 * que cambia entre respuestas: la misma lista se reordenaría sola entre una
 * pantalla y otra, y eso hace dudar de si falta alguno.
 */
export const casosParaEscoger = <T extends CasoBuscable>(
  indices: readonly CasoIndexado<T>[],
  recientes: readonly string[]
): CasoParaEscoger<T>[] => {
  const puesto = puestos(recientes);
  const dePuesto = (id: string): number => puesto.get(id) ?? Number.POSITIVE_INFINITY;

  const porCliente = new Map<string, CasoIndexado<T>[]>();
  for (const x of indices) {
    const cliente = clienteDelCaso(x.caso);
    const grupo = porCliente.get(cliente);
    if (grupo) grupo.push(x);
    else porCliente.set(cliente, [x]);
  }

  const grupos = [...porCliente.entries()].map(([cliente, casos]) => ({
    cliente,
    casos: [...casos].sort(
      (a, b) =>
        dePuesto(a.caso.id) - dePuesto(b.caso.id) || compararEnEspanol(a.caso.caratula, b.caso.caratula)
    ),
    /* El grupo vale lo que su caso más reciente: es lo que lo sube en la lista. */
    mejor: Math.min(...casos.map((x) => dePuesto(x.caso.id)))
  }));

  grupos.sort((a, b) => {
    if (a.mejor !== b.mejor) return a.mejor - b.mejor;
    const huerfanoA = a.cliente === SIN_CLIENTE;
    const huerfanoB = b.cliente === SIN_CLIENTE;
    if (huerfanoA !== huerfanoB) return huerfanoA ? 1 : -1;
    return compararEnEspanol(a.cliente, b.cliente);
  });

  return grupos.flatMap((g) =>
    g.casos.map((x) => ({
      caso: x.caso,
      cliente: g.cliente,
      rama: x.claveDeRama === CLAVE_SIN_RAMA ? SIN_RAMA : etiquetaDeRama(x.claveDeRama),
      reciente: dePuesto(x.caso.id) !== Number.POSITIVE_INFINITY
    }))
  );
};
