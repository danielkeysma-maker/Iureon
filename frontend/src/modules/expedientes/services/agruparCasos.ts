import { BRANCH_LABELS } from '../../catalog/branchLabels';
import { compararEnEspanol } from '../../workspace/services/fichaEnLaLista';
import type { ExpedienteEnLista } from '../types';

/**
 * LA LISTA DE EXPEDIENTES POR CLIENTE Y, DENTRO DE CADA CLIENTE, POR RAMA.
 *
 * El 14 de septiembre el dueño vio la lista plana —despacho en mayúsculas,
 * cliente, radicado y «2 documentos» encadenados en un renglón— y pidió «el
 * expediente de cada cliente por rama». Así piensa el abogado su cartera: por
 * a quién atiende, y dentro de cada persona, en qué frente.
 *
 * Funciones puras, sin React ni red, porque aquí están las tres cosas que
 * pueden mentir y por eso se prueban (`check:expedientes-cara`):
 *  · una cuenta de documentos que suma como cero lo que no se contó;
 *  · una rama inventada para un caso que no la tiene registrada;
 *  · un orden que esconde lo vencido debajo de lo alfabético.
 */

export const SIN_CLIENTE = 'Sin cliente registrado';
export const SIN_RAMA = 'Sin rama registrada';

const CLAVE_SIN_CLIENTE = '__sin-cliente__';
const CLAVE_SIN_RAMA = '__sin-rama__';

export interface GrupoDeRama {
  clave: string;
  etiqueta: string;
  sinRama: boolean;
  casos: ExpedienteEnLista[];
}

export interface GrupoDeCliente {
  clave: string;
  etiqueta: string;
  sinCliente: boolean;
  ramas: GrupoDeRama[];
  /** Cuántos casos del cliente quedan en la lista (ya filtrada). */
  casos: number;
  /** `null` si algún caso no se pudo contar: una suma parcial afirmaría un total que no se conoce. */
  documentos: number | null;
}

/* ─── LA RAMA ─────────────────────────────────────────────────────────────── */

const ramaLimpia = (rama: string | null | undefined): string | null => {
  const r = rama?.trim();
  return r ? r : null;
};

/**
 * El nombre de la rama tal como la reconoce el catálogo, o el texto guardado.
 *
 * `Object.hasOwn` y no `BRANCH_LABELS[r]` a secas: una rama escrita a mano que
 * se llame como una propiedad de todo objeto —«constructor»— devolvería una
 * función en vez de caer al texto guardado.
 */
export const etiquetaDeRama = (rama: string | null | undefined): string => {
  const r = ramaLimpia(rama);
  if (r === null) return SIN_RAMA;
  return Object.hasOwn(BRANCH_LABELS, r) ? BRANCH_LABELS[r] : r;
};

/* ─── LA URGENCIA ─────────────────────────────────────────────────────────── */

/**
 * Lo vencido primero, después lo que vence antes, y al final lo que no tiene
 * término. La fecha AAAA-MM-DD se compara como texto porque así ordena igual
 * que como fecha, y no se usa el reloj del equipo: los días los cuenta el
 * servidor.
 */
type Urgencia = readonly [rango: number, vence: string];

const urgenciaDelCaso = (c: ExpedienteEnLista): Urgencia => {
  if (c.terminoVencido) return [0, c.terminoVencido.vence];
  if (c.proximoTermino) return [1, c.proximoTermino.vence];
  return [2, ''];
};

const compararUrgencia = (a: Urgencia, b: Urgencia): number => a[0] - b[0] || (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);

const masUrgente = (casos: readonly ExpedienteEnLista[]): Urgencia =>
  casos.map(urgenciaDelCaso).reduce<Urgencia>((mejor, u) => (compararUrgencia(u, mejor) < 0 ? u : mejor), [2, '']);

/* ─── LA BÚSQUEDA ─────────────────────────────────────────────────────────── */

const normalizar = (texto: string): string =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

/* El radicado se escribe con y sin guiones o espacios; se compara sin ellos. */
const soloAlfanumerico = (texto: string): string => normalizar(texto).replace(/[^a-z0-9]/g, '');

/**
 * Por cliente, carátula, radicado o despacho, sin mayúsculas ni tildes. Se
 * filtra CASO a caso: un cliente con cinco asuntos muestra solo el que
 * coincide, que es el que se estaba buscando.
 */
export const filtrarCasos = (casos: readonly ExpedienteEnLista[], busqueda: string): ExpedienteEnLista[] => {
  const q = normalizar(busqueda);
  if (!q) return [...casos];
  const qRadicado = soloAlfanumerico(busqueda);
  return casos.filter((c) => {
    const textos = [c.clienteNombre, c.caratula, c.despacho, c.radicado].filter((t): t is string => Boolean(t));
    if (textos.some((t) => normalizar(t).includes(q))) return true;
    return qRadicado !== '' && c.radicado !== null && soloAlfanumerico(c.radicado).includes(qRadicado);
  });
};

/* ─── EL AGRUPADO ─────────────────────────────────────────────────────────── */

/**
 * Cliente → rama → casos.
 *
 * ORDEN. Los clientes por su caso más urgente y, a igual urgencia, por nombre
 * con la colación española. Las ramas de cada cliente, igual. Los casos de una
 * rama conservan el orden de la pestaña, que ya lo decidió el servidor.
 *
 * «SIN CLIENTE» Y «SIN RAMA» VAN AL FINAL aunque tengan lo más urgente. Son la
 * falta de un dato, no un cliente ni una rama: ponerlos arriba haría leer
 * «Sin cliente registrado» como si fuera el asunto principal de la firma. Lo
 * urgente sin cliente no se pierde: sale en «Esta semana», que es plana.
 *
 * La llave del cliente es su ficha (`clienteId`), no su nombre: dos fichas
 * homónimas son dos personas.
 */
export const agruparPorClienteYRama = (casos: readonly ExpedienteEnLista[], busqueda: string): GrupoDeCliente[] => {
  const porCliente = new Map<string, { etiqueta: string; sinCliente: boolean; casos: ExpedienteEnLista[] }>();
  for (const c of filtrarCasos(casos, busqueda)) {
    const clave = c.clienteId ?? CLAVE_SIN_CLIENTE;
    const grupo = porCliente.get(clave) ?? {
      etiqueta: c.clienteId ? c.clienteNombre ?? 'Cliente sin nombre en la ficha' : SIN_CLIENTE,
      sinCliente: c.clienteId === null,
      casos: []
    };
    grupo.casos.push(c);
    porCliente.set(clave, grupo);
  }

  const grupos = [...porCliente.entries()].map(([clave, g]): GrupoDeCliente & { urgencia: Urgencia } => {
    const porRama = new Map<string, GrupoDeRama>();
    for (const c of g.casos) {
      const r = ramaLimpia(c.rama);
      const claveRama = r ?? CLAVE_SIN_RAMA;
      const rama = porRama.get(claveRama) ?? { clave: claveRama, etiqueta: etiquetaDeRama(r), sinRama: r === null, casos: [] };
      rama.casos.push(c);
      porRama.set(claveRama, rama);
    }
    const ramas = [...porRama.values()].sort(
      (a, b) =>
        Number(a.sinRama) - Number(b.sinRama) ||
        compararUrgencia(masUrgente(a.casos), masUrgente(b.casos)) ||
        compararEnEspanol(a.etiqueta, b.etiqueta)
    );
    const documentos = g.casos.every((c) => typeof c.documentos === 'number')
      ? g.casos.reduce((suma, c) => suma + (c.documentos as number), 0)
      : null;
    return {
      clave,
      etiqueta: g.etiqueta,
      sinCliente: g.sinCliente,
      ramas,
      casos: g.casos.length,
      documentos,
      urgencia: masUrgente(g.casos)
    };
  });

  return grupos
    .sort(
      (a, b) =>
        Number(a.sinCliente) - Number(b.sinCliente) ||
        compararUrgencia(a.urgencia, b.urgencia) ||
        compararEnEspanol(a.etiqueta, b.etiqueta) ||
        (a.clave < b.clave ? -1 : a.clave > b.clave ? 1 : 0)
    )
    .map(({ urgencia: _urgencia, ...g }) => g);
};

/* ─── LO QUE SE ABRE SOLO ─────────────────────────────────────────────────── */

/**
 * Con tres clientes o menos, o con una búsqueda escrita, todo abierto: cabe, o
 * es lo que se pidió ver. Con más, solo el primero —el del caso más urgente—
 * si tiene algún término; una lista larga toda abierta vuelve a ser la lista
 * plana que se quería dejar atrás.
 */
export const gruposAbiertosPorDefecto = (grupos: readonly GrupoDeCliente[], hayBusqueda: boolean): Set<string> => {
  if (hayBusqueda || grupos.length <= 3) return new Set(grupos.map((g) => g.clave));
  const primero = grupos[0];
  const tieneTermino = primero?.ramas.some((r) => r.casos.some((c) => c.terminoVencido || c.proximoTermino));
  return new Set(primero && tieneTermino ? [primero.clave] : []);
};

/* ─── EN PALABRAS ─────────────────────────────────────────────────────────── */

/** «2 casos · 3 documentos»; sin documentos si alguno no se pudo contar. */
export const resumenDelCliente = (g: Pick<GrupoDeCliente, 'casos' | 'documentos'>): string => {
  const casos = `${g.casos.toLocaleString('es-CO')} ${g.casos === 1 ? 'caso' : 'casos'}`;
  if (g.documentos === null) return casos;
  return `${casos} · ${g.documentos.toLocaleString('es-CO')} ${g.documentos === 1 ? 'documento' : 'documentos'}`;
};

/**
 * La línea de cada tarjeta en «Esta semana», que es plana y por eso tiene que
 * decir de quién es el caso. La rama solo si está registrada: «Sin rama
 * registrada» en cada tarjeta sería ruido en una lista de pendientes.
 */
export const clienteYRama = (c: Pick<ExpedienteEnLista, 'clienteId' | 'clienteNombre' | 'rama'>): string => {
  const cliente = c.clienteId ? c.clienteNombre ?? 'Cliente sin nombre en la ficha' : SIN_CLIENTE;
  const rama = ramaLimpia(c.rama);
  return rama === null ? cliente : `${cliente} · ${etiquetaDeRama(rama)}`;
};
