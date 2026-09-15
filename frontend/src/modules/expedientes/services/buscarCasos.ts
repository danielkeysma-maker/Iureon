import { BRANCH_LABELS } from '../../catalog/branchLabels';
import { compararEnEspanol } from '../../workspace/services/fichaEnLaLista';
import { NOMBRE_DE_PAPEL, type ExpedienteEnLista, type PersonaEnLista } from '../types';

/**
 * LA BÚSQUEDA Y LOS FILTROS DE LA LISTA DE EXPEDIENTES. Funciones puras.
 *
 * El 14 de septiembre el dueño pidió encontrar un caso por CÉDULA o NIT, por
 * NOMBRE o por RADICADO, y filtrar por AÑO y MES. Se prueban en
 * `check:buscar-casos`. Las reglas, y por qué:
 *
 * ─── NOMBRE ────────────────────────────────────────────────────────────────
 *
 * Cliente, carátula, despacho, la contraparte escrita en el caso y el nombre de
 * cada persona registrada. Sin tildes ni mayúsculas, y con varias palabras
 * TODAS tienen que aparecer, cada una en cualquiera de esos campos: «Pérez
 * testigo» encuentra el caso donde la contraparte es Pérez y hay un testigo.
 *
 * ─── CÉDULA Y NIT: SOLO DÍGITOS, Y DESDE EL PRINCIPIO ──────────────────────
 *
 * Una consulta que es solo número —con puntos, espacios o guiones, y con
 * «C.C.» o «NIT» delante— y trae al menos cinco dígitos se compara por dígitos
 * contra el documento del cliente y la identificación de cada persona. El
 * dígito de verificación de un NIT («-7») se prueba con y sin él, porque el
 * cliente se guarda con los guiones quitados (el dígito queda pegado) y un
 * actor se guarda como se escribió.
 *
 * SE COMPARA DESDE EL PRIMER DÍGITO, NO «CONTIENE». Una cédula se dicta y se
 * copia desde el principio; un fragmento del medio no es algo que alguien
 * busque, y con mil casos cinco dígitos contenidos en alguna de tres mil
 * identificaciones coinciden por azar con alguna ajena. Desde el principio,
 * el azar es cien veces menor.
 *
 * ─── RADICADO: APARTE, Y SIN FRAGMENTOS SUELTOS ────────────────────────────
 *
 * El radicado judicial son 23 dígitos: despacho (5+2+2+3), AÑO (dígitos 13 a
 * 16), consecutivo (5) y recurso (2) — el mismo formato que
 * `estilo/saneamiento.ts` reconoce. Cinco dígitos están dentro de casi
 * cualquier radicado, así que:
 *  · con nueve dígitos o más, basta con que estén contenidos;
 *  · con cinco a ocho, tienen que ocupar segmentos enteros —«00123», el
 *    consecutivo—, según los guiones con que se guardó o, si se guardó corrido,
 *    según el formato de 23;
 *  · cuatro dígitos entre 1900 y 2099 son un AÑO y encuentran el radicado de
 *    ese año.
 *
 * ─── POR QUÉ COINCIDIÓ ─────────────────────────────────────────────────────
 *
 * Si coincidió por algo que la tarjeta ya muestra —carátula, cliente, despacho,
 * radicado—, nada. Si no, el campo exacto y su valor TAL COMO SE GUARDÓ: la
 * aplicación no enmascara documentos en ninguna otra pantalla (la ficha del
 * cliente los muestra enteros), y enmascararlos solo aquí haría dudar de que
 * sea la persona buscada.
 *
 * ─── RAMA: POR SU CÓDIGO Y POR EL NOMBRE QUE SE LEE ────────────────────────
 *
 * El mismo día el dueño pidió buscar y filtrar por rama. La caja compara el
 * código guardado («LABORAL», «PROPIEDAD_INTELECTUAL» leído como palabras) y el
 * nombre del catálogo («Laboral & Seguridad Social»), porque el abogado escribe
 * lo que ve. Una rama escrita a mano es su propio nombre. Entra como un campo
 * más en la regla de «todas las palabras».
 *
 * NO TRAE «POR QUÉ»: la rama siempre está a la vista cuando está registrada —es
 * la cabecera del grupo en «Activos» y «Cerrados», y va en la línea de cliente
 * de las tarjetas de «Esta semana»—, y un caso sin rama no coincide por rama.
 * Tampoco se busca «Sin rama registrada»: es la falta de un dato, y para eso
 * está la opción del filtro.
 */

export const SIN_RAMA = 'Sin rama registrada';
/** El valor del filtro para los casos sin rama. Ninguna rama guardada empieza con guion bajo doble. */
export const CLAVE_SIN_RAMA = '__sin-rama__';

export const ramaLimpia = (rama: string | null | undefined): string | null => {
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

export const normalizar = (texto: string): string =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();

export interface MotivoDeCoincidencia {
  /** «cédula o NIT del cliente», «persona», «contraparte», «año del radicado». */
  etiqueta: string;
  /** El valor como se guardó. */
  valor: string;
  /** Documentos y radicados van en mono: se copian. */
  mono: boolean;
  /** «persona: Nombre» lleva dos puntos; «cédula o NIT del cliente 000» no. */
  conDosPuntos: boolean;
}

interface CampoDeTexto {
  norm: string;
  /** Null si la tarjeta ya lo muestra. */
  motivo: MotivoDeCoincidencia | null;
}

interface CampoDeDocumento {
  candidatos: string[];
  motivo: MotivoDeCoincidencia;
}

interface RadicadoIndexado {
  original: string;
  digitos: string;
  alfanumerico: string;
  /** Posiciones, dentro de `digitos`, donde empieza o acaba un segmento. */
  limites: ReadonlySet<number>;
  anios: ReadonlySet<string>;
}

export interface RegistroDelCaso {
  anio: number;
  mes: number;
}

/** El caso con todo lo que la búsqueda compara ya normalizado: se calcula una vez por respuesta. */
export interface CasoIndexado {
  caso: ExpedienteEnLista;
  textos: CampoDeTexto[];
  documentos: CampoDeDocumento[];
  radicado: RadicadoIndexado | null;
  registro: RegistroDelCaso | null;
  /** La rama guardada, sin espacios alrededor, o `CLAVE_SIN_RAMA`: la misma llave con que se agrupa. */
  claveDeRama: string;
}

export interface ResultadoDeBusqueda {
  caso: ExpedienteEnLista;
  porQue: MotivoDeCoincidencia | null;
}

/* ─── EL ÍNDICE ───────────────────────────────────────────────────────────── */

const quienEs = (p: PersonaEnLista): string => {
  if (p.lado === 'CONTRARIO') return 'contraparte';
  if (p.papel === 'DESCONOCIDO') return '';
  return (NOMBRE_DE_PAPEL[p.papel] ?? '').toLowerCase();
};

const candidatosDeDocumento = (texto: string): string[] => {
  const digitos = texto.replace(/\D/g, '');
  if (!digitos) return [];
  return /-\s*\d\s*$/.test(texto) && digitos.length > 1 ? [digitos, digitos.slice(0, -1)] : [digitos];
};

const ES_ANIO = /^(19|20)\d\d$/;
const FORMATO_DE_23 = [5, 7, 9, 12, 16, 21];

const indexarRadicado = (radicado: string | null): RadicadoIndexado | null => {
  const original = radicado?.trim() ?? '';
  if (!original) return null;
  const digitos = original.replace(/\D/g, '');
  const limites = new Set<number>([0, digitos.length]);
  const anios = new Set<string>();
  let posicion = 0;
  for (const segmento of original.split(/\D+/).filter(Boolean)) {
    limites.add(posicion);
    posicion += segmento.length;
    limites.add(posicion);
    if (ES_ANIO.test(segmento)) anios.add(segmento);
  }
  if (digitos.length === 23) {
    for (const l of FORMATO_DE_23) limites.add(l);
    const anio = digitos.slice(12, 16);
    if (ES_ANIO.test(anio)) anios.add(anio);
  }
  return { original, digitos, alfanumerico: normalizar(original).replace(/[^a-z0-9]/g, ''), limites, anios };
};

/**
 * Año y mes de un instante EN BOGOTÁ. Colombia está en UTC−5 todo el año, sin
 * horario de verano, así que restar cinco horas es exacto y no depende del
 * reloj ni de la zona del equipo que mira.
 */
export const registroEnBogota = (iso: string): RegistroDelCaso | null => {
  const t = iso ? Date.parse(iso) : Number.NaN;
  if (Number.isNaN(t)) return null;
  const d = new Date(t - 5 * 60 * 60 * 1000);
  return { anio: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 };
};

export const indexarCaso = (caso: ExpedienteEnLista): CasoIndexado => {
  const textos: CampoDeTexto[] = [];
  const visible = (t: string | null | undefined) => {
    if (t?.trim()) textos.push({ norm: normalizar(t), motivo: null });
  };
  visible(caso.caratula);
  visible(caso.clienteNombre);
  visible(caso.despacho);
  const rama = ramaLimpia(caso.rama);
  if (rama !== null) {
    /* Código con los guiones bajos como espacios, y el nombre del catálogo: los dos se ven como uno solo. */
    const etiqueta = etiquetaDeRama(rama);
    visible(etiqueta === rama ? rama : `${rama.replace(/_/g, ' ')} ${etiqueta}`);
  }
  if (caso.contraparte?.trim()) {
    textos.push({
      norm: normalizar(caso.contraparte),
      motivo: { etiqueta: 'contraparte', valor: caso.contraparte, mono: false, conDosPuntos: true }
    });
  }

  const documentos: CampoDeDocumento[] = [];
  if (caso.clienteDocumento?.trim()) {
    documentos.push({
      candidatos: candidatosDeDocumento(caso.clienteDocumento),
      motivo: { etiqueta: 'cédula o NIT del cliente', valor: caso.clienteDocumento, mono: true, conDosPuntos: false }
    });
  }

  for (const p of caso.personas ?? []) {
    const quien = quienEs(p);
    if (p.nombre.trim()) {
      textos.push({
        norm: normalizar(p.nombre),
        motivo: { etiqueta: 'persona', valor: quien ? `${p.nombre} (${quien})` : p.nombre, mono: false, conDosPuntos: true }
      });
    }
    if (p.identificacion?.trim()) {
      const de = p.lado === 'CONTRARIO' ? `la contraparte ${p.nombre}` : quien ? `${p.nombre} (${quien})` : p.nombre;
      documentos.push({
        candidatos: candidatosDeDocumento(p.identificacion),
        motivo: { etiqueta: `cédula o NIT de ${de}`, valor: p.identificacion, mono: true, conDosPuntos: false }
      });
    }
  }

  return {
    caso,
    textos,
    documentos,
    radicado: indexarRadicado(caso.radicado),
    registro: registroEnBogota(caso.createdAt),
    claveDeRama: rama ?? CLAVE_SIN_RAMA
  };
};

/* ─── LA CONSULTA ─────────────────────────────────────────────────────────── */

interface Consulta {
  palabras: string[];
  /** Los dígitos si la consulta es solo un número (con separadores o prefijo); null si trae texto. */
  numero: string | null;
  /** Candidatos de documento, con y sin dígito de verificación; null si no es un documento. */
  documento: string[] | null;
  anio: string | null;
  alfanumerico: string;
}

const PREFIJO_DE_DOCUMENTO = /^\s*(?:c\.?\s*c\.?|nit|c\.?\s*e\.?)\s*[:.]?\s*/i;
const MINIMO_DE_DIGITOS = 5;

const prepararConsulta = (texto: string): Consulta => {
  const palabras = normalizar(texto).split(/\s+/).filter(Boolean);
  const sinPrefijo = texto.trim().replace(PREFIJO_DE_DOCUMENTO, '');
  const digitos = sinPrefijo.replace(/\D/g, '');
  const esNumero = digitos.length > 0 && /^[\d.\s-]+$/.test(sinPrefijo);
  return {
    palabras,
    numero: esNumero ? digitos : null,
    documento:
      esNumero && digitos.length >= MINIMO_DE_DIGITOS
        ? candidatosDeDocumento(sinPrefijo).filter((c) => c.length >= MINIMO_DE_DIGITOS)
        : null,
    anio: esNumero && ES_ANIO.test(digitos) ? digitos : null,
    alfanumerico: normalizar(texto).replace(/[^a-z0-9]/g, '')
  };
};

/* ─── LA COINCIDENCIA ─────────────────────────────────────────────────────── */

type PorRadicado = 'visible' | 'anio' | null;

const porRadicado = (r: RadicadoIndexado, q: Consulta): PorRadicado => {
  if (q.numero !== null) {
    const n = q.numero;
    if (n.length >= 9 && r.digitos.includes(n)) return 'visible';
    if (n.length >= MINIMO_DE_DIGITOS) {
      for (const inicio of r.limites) {
        if (r.limites.has(inicio + n.length) && r.digitos.startsWith(n, inicio)) return 'visible';
      }
    }
    return q.anio !== null && r.anios.has(q.anio) ? 'anio' : null;
  }
  /* Un radicado con letras («T-1234») se busca por contiene, sin separadores. */
  return /[a-z]/.test(q.alfanumerico) && q.alfanumerico.length >= 3 && r.alfanumerico.includes(q.alfanumerico)
    ? 'visible'
    : null;
};

/** `undefined` si no coincide; `null` si coincide por algo que la tarjeta ya muestra. */
const coincidencia = (x: CasoIndexado, q: Consulta): MotivoDeCoincidencia | null | undefined => {
  const radicado = x.radicado ? porRadicado(x.radicado, q) : null;
  if (radicado === 'visible') return null;

  /* Cada palabra en algún campo; se prefiere el campo visible. */
  let porTexto: MotivoDeCoincidencia | null | undefined = null;
  for (const palabra of q.palabras) {
    let otro: MotivoDeCoincidencia | null = null;
    let vista = false;
    for (const campo of x.textos) {
      if (!campo.norm.includes(palabra)) continue;
      if (campo.motivo === null) {
        vista = true;
        break;
      }
      otro ??= campo.motivo;
    }
    if (!vista && otro === null) {
      porTexto = undefined;
      break;
    }
    if (!vista) porTexto ??= otro;
  }
  if (porTexto === null) return null;

  if (q.documento !== null) {
    const candidatos = q.documento;
    const doc = x.documentos.find((d) => d.candidatos.some((c) => candidatos.some((qc) => c.startsWith(qc))));
    if (doc) return doc.motivo;
  }
  if (porTexto !== undefined) return porTexto;
  if (radicado === 'anio' && x.radicado) {
    return { etiqueta: 'año del radicado', valor: x.radicado.original, mono: true, conDosPuntos: false };
  }
  return undefined;
};

/** Los casos que coinciden, en el mismo orden en que llegaron, con el porqué. */
export const buscarCasos = (indices: readonly CasoIndexado[], texto: string): ResultadoDeBusqueda[] => {
  const q = prepararConsulta(texto);
  if (q.palabras.length === 0) return indices.map((x) => ({ caso: x.caso, porQue: null }));
  const resultados: ResultadoDeBusqueda[] = [];
  for (const x of indices) {
    const m = coincidencia(x, q);
    if (m !== undefined) resultados.push({ caso: x.caso, porQue: m });
  }
  return resultados;
};

/* ─── AÑO Y MES DE REGISTRO ───────────────────────────────────────────────── */

export const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre'
] as const;

export interface FiltroDeRegistro {
  anio: number | null;
  /** Solo cuenta con un año elegido: «marzo» de todos los años mezcla periodos que nadie busca juntos. */
  mes: number | null;
}

export const filtrarPorRegistro = <T extends CasoIndexado>(indices: readonly T[], f: FiltroDeRegistro): T[] => {
  if (f.anio === null) return [...indices];
  return indices.filter((x) => x.registro?.anio === f.anio && (f.mes === null || x.registro.mes === f.mes));
};

/** Los años en que hay casos registrados, del más reciente al más antiguo. */
export const aniosDeRegistro = (indices: readonly CasoIndexado[]): number[] =>
  [...new Set(indices.map((x) => x.registro?.anio).filter((a): a is number => typeof a === 'number'))].sort((a, b) => b - a);

/** Los meses de ese año en que hay casos, de enero a diciembre. */
export const mesesDeRegistro = (indices: readonly CasoIndexado[], anio: number): number[] =>
  [...new Set(indices.filter((x) => x.registro?.anio === anio).map((x) => x.registro!.mes))].sort((a, b) => a - b);

/* ─── RAMA ────────────────────────────────────────────────────────────────── */

export interface OpcionDeRama {
  valor: string;
  etiqueta: string;
}

const etiquetaDeClave = (clave: string): string => (clave === CLAVE_SIN_RAMA ? SIN_RAMA : etiquetaDeRama(clave));

/** `null` es «Todas». */
export const filtrarPorRama = <T extends CasoIndexado>(indices: readonly T[], clave: string | null): T[] =>
  clave === null ? [...indices] : indices.filter((x) => x.claveDeRama === clave);

/**
 * Las ramas de ESTOS casos —la pestaña—, por nombre con la colación española y
 * «Sin rama registrada» al final, igual que en el agrupado.
 *
 * A diferencia de los años, que salen de todos los casos, las ramas salen de la
 * pestaña: así lo pidió el dueño, y una rama que la pestaña no tiene es un
 * callejón sin salida. La elegida se conserva aunque la nueva pestaña no la
 * tenga: el filtro sobrevive al cambio de pestaña, y un control que no muestra
 * lo que está filtrando haría leer la lista vacía como «no hay casos».
 */
export const opcionesDeRama = (indices: readonly CasoIndexado[], elegida: string | null): OpcionDeRama[] => {
  const claves = new Set(indices.map((x) => x.claveDeRama));
  if (elegida !== null) claves.add(elegida);
  const sinRama = claves.delete(CLAVE_SIN_RAMA);
  const opciones = [...claves]
    .map((valor) => ({ valor, etiqueta: etiquetaDeClave(valor) }))
    .sort((a, b) => compararEnEspanol(a.etiqueta, b.etiqueta) || (a.valor < b.valor ? -1 : a.valor > b.valor ? 1 : 0));
  return sinRama ? [...opciones, { valor: CLAVE_SIN_RAMA, etiqueta: SIN_RAMA }] : opciones;
};

/** «búsqueda «x» · año 2025 · diciembre · rama Laboral», para decir qué está puesto cuando nada coincide. */
export const filtrosEnPalabras = (f: FiltroDeRegistro & { busqueda: string; rama?: string | null }): string[] => {
  const partes: string[] = [];
  if (f.busqueda.trim()) partes.push(`búsqueda «${f.busqueda.trim()}»`);
  if (f.anio !== null) {
    partes.push(`año ${f.anio}`);
    if (f.mes !== null) partes.push(MESES[f.mes - 1]);
  }
  if (f.rama != null) partes.push(f.rama === CLAVE_SIN_RAMA ? SIN_RAMA.toLowerCase() : `rama ${etiquetaDeRama(f.rama)}`);
  return partes;
};
