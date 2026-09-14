import { aplicarReemplazoEnPosicion, capasTipograficas, localizarCitas, reemplazoParaPegar } from '../workspace/services/marcas';

/**
 * «Jerga de su firma»: dónde usa el borrador una palabra que la firma prefiere
 * decir de otra forma, sin llamar a ningún modelo y sin costo.
 *
 * Puro: sin React, sin DOM, sin red. `check:jerga` lo prueba entero.
 *
 * ─── DE DÓNDE SALE EL GLOSARIO ─────────────────────────────────────────────
 *
 * Del perfil consolidado que el servidor ya calcula para el rol y la rama del
 * escrito (`GET /api/estilo`), con el mismo respaldo al general del rol que usa
 * la redacción. Aquí no se inventa una sola variante: si el socio no enseñó
 * ningún formato, no hay glosario y la pantalla lo dice.
 *
 * ─── LO QUE NUNCA SE TOCA ──────────────────────────────────────────────────
 *
 * Un escrito mezcla la voz del abogado con texto AJENO que se copia tal cual:
 * citas de jurisprudencia y de normas, la mención de un artículo, lo que va
 * entre comillas (una transcripción, una pretensión ajena) y los marcadores
 * entre corchetes. Cambiar «demanda» dentro de cualquiera de ellos es falsear
 * lo citado, así que esos tramos son zonas protegidas y ningún hallazgo cae en
 * ellas. Ante la duda —una comilla que no cierra— se protege de más: una
 * sugerencia que falta se echa de menos; una cita alterada se radica.
 *
 * Tampoco las negritas `**…**` del borrador: son los rótulos que el propio
 * escrito resalta.
 */

export interface EntradaDeJerga {
  preferido: string;
  variantes: string[];
  vistoEn: number;
}

export type MotivoDeZona = 'CITA' | 'ARTICULO' | 'COMILLAS' | 'CORCHETES' | 'NEGRITA';

export interface ZonaProtegida {
  inicio: number;
  fin: number;
  motivo: MotivoDeZona;
}

export interface HallazgoDeJerga {
  inicio: number;
  fin: number;
  /** El tramo tal como está en el texto, para comprobar que sigue ahí al reemplazar. */
  encontrado: string;
  /** La variante del glosario que coincidió. */
  variante: string;
  preferido: string;
  vistoEn: number;
  /** El preferido con la mayúscula del original. */
  reemplazo: string;
  /** «…antes encontrado después…», sin asteriscos y en una línea. */
  contexto: string;
  partes: { antes: string; encontrado: string; despues: string };
}

export interface GrupoDeJerga {
  clave: string;
  preferido: string;
  variante: string;
  vistoEn: number;
  hallazgos: HallazgoDeJerga[];
}

export type SeleccionDelAbogado = { inicio: number; fin: number } | { texto: string };

/* ─── Frases ────────────────────────────────────────────────────────────── */

export const TITULO_JERGA = 'Jerga de su firma';
export const TEXTO_BOTON_JERGA = 'Sugerir jerga';
export const TEXTO_SIN_GLOSARIO = 'Su firma aún no tiene glosario. Se forma al enseñar un formato desde un escrito terminado.';
export const TEXTO_SIN_HALLAZGOS = 'Este borrador ya usa la jerga de su firma.';
export const TEXTO_SELECCION_SIN_HALLAZGOS = 'Ninguna expresión de la selección está en el glosario de su firma.';
export const TEXTO_ERROR_GLOSARIO = 'No se pudo leer el glosario de su firma. Nada se reemplazó.';
export const TEXTO_PROTEGIDO =
  'No se proponen cambios dentro de citas, menciones de artículos, texto entre comillas, corchetes ni negritas.';

export const vistoEnEscritos = (n: number): string => `visto en ${n} ${n === 1 ? 'escrito' : 'escritos'} de la firma`;

/* ─── Plegado ───────────────────────────────────────────────────────────── */

/**
 * Minúsculas y sin tildes, CARÁCTER POR CARÁCTER, para que cada índice del
 * texto plegado sea el mismo índice del original. Plegar con
 * `normalize('NFD')` sobre la cadena entera cambia el largo y la posición de
 * cada hallazgo caería corrida.
 *
 * La ñ no se pliega: en español es otra letra, y «año» no es «ano».
 */
export const plegar = (texto: string): string => {
  let salida = '';
  for (const c of texto) {
    if (c === 'ñ' || c === 'Ñ') {
      salida += 'ñ';
      continue;
    }
    const base = c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    /* Un carácter que no cabe en uno al plegar se deja como estaba: el largo manda. */
    salida += base.length === c.length ? base : c;
  }
  return salida;
};

const escapar = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const LETRA_O_NUMERO_ANTES = '(?<![\\p{L}\\p{N}])';
const LETRA_O_NUMERO_DESPUES = '(?![\\p{L}\\p{N}])';

/* ─── Zonas protegidas ──────────────────────────────────────────────────── */

/** «Ley 1564 de 2012», «Decreto Ley 019 de 2012», «Resolución No. 45». */
const NORMA =
  /(?<![\p{L}\p{N}])(?:Ley|Decreto(?:\s+(?:Ley|Legislativo|Reglamentario|[ÚU]nico))?|Acto\s+Legislativo|Resoluci[oó]n|Acuerdo|Circular)\s+(?:No\.?\s*|N[°º]\.?\s*|n[úu]mero\s+)?\d[\d.]*(?:\s+de\s+\d{4})?/giu;

/** «Sentencia T-406 de 1992», «SU-049 de 2022», «SL4102-2022», «C-590/05». */
const PROVIDENCIA =
  /(?<![\p{L}\p{N}])(?:(?:[Ss]entencia|[Aa]uto)\s+)?(?:SU|ST[CLP]|S[CLP]|A[CLP]|[CTA])[-–]?\s?\d{1,5}(?:[-/]\d{2,4})?(?:\s+de\s+\d{4})?(?![\p{L}\p{N}])/gu;

/** «art. 90», «arts. 90 y 91», «artículo 82», «artículos 368 a 373». */
const ARTICULO = /(?<!\p{L})(?:arts?\.|art[ií]culos?)\s*\d/giu;

/** Dónde termina la mención de un artículo: coma, punto y coma, dos puntos, paréntesis, salto o un punto que cierra la oración. */
const finDeLaMencion = (texto: string, desde: number): number => {
  const tope = Math.min(texto.length, desde + 160);
  for (let i = desde; i < tope; i++) {
    const c = texto[i];
    if (c === ',' || c === ';' || c === ':' || c === ')' || c === '\n' || c === '«' || c === '"' || c === '“') return i;
    /* «C.G.P.» y «arts.» llevan puntos que no cierran nada: solo corta el punto seguido de espacio y mayúscula, o de fin. */
    if (c === '.' && (i + 1 >= texto.length || /^\s+[\p{Lu}¿¡«"“(]/u.test(texto.slice(i + 1, i + 4)) || texto[i + 1] === '\n')) return i + 1;
  }
  return tope;
};

/** El fin del párrafo que contiene `desde`: una línea en blanco o el final. */
const finDelParrafo = (texto: string, desde: number): number => {
  const m = /\n[ \t]*\n/.exec(texto.slice(desde));
  return m ? desde + m.index : texto.length;
};

const finDeLinea = (texto: string, desde: number): number => {
  const i = texto.indexOf('\n', desde);
  return i === -1 ? texto.length : i;
};

/** Pares de apertura y cierre; lo que no cierra protege hasta `hasta`. */
const pares = (texto: string, abre: string, cierra: string, motivo: MotivoDeZona, hasta: (desde: number) => number): ZonaProtegida[] => {
  const zonas: ZonaProtegida[] = [];
  let i = texto.indexOf(abre);
  while (i !== -1) {
    const limite = hasta(i + 1);
    const j = texto.indexOf(cierra, i + 1);
    const fin = j !== -1 && j < limite ? j + 1 : limite;
    zonas.push({ inicio: i, fin, motivo });
    i = texto.indexOf(abre, fin);
  }
  return zonas;
};

/**
 * Los tramos donde no se propone nada.
 *
 * `citasDelBorrador` son las providencias que el borrador declara haber citado
 * (`jurisprudenciaCitada`): se ubican con `localizarCitas`, la misma búsqueda
 * tolerante con que el taller marca las citas del revisor.
 */
export const zonasProtegidas = (texto: string, citasDelBorrador: readonly string[] = []): ZonaProtegida[] => {
  const zonas: ZonaProtegida[] = [];

  for (const m of localizarCitas(texto, [...citasDelBorrador]).marcas) zonas.push({ inicio: m.inicio, fin: m.fin, motivo: 'CITA' });
  for (const re of [NORMA, PROVIDENCIA]) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(texto)) !== null) zonas.push({ inicio: m.index, fin: m.index + m[0].length, motivo: 'CITA' });
  }

  ARTICULO.lastIndex = 0;
  let a: RegExpExecArray | null;
  while ((a = ARTICULO.exec(texto)) !== null) {
    const fin = finDeLaMencion(texto, a.index + a[0].length);
    zonas.push({ inicio: a.index, fin, motivo: 'ARTICULO' });
    ARTICULO.lastIndex = Math.max(fin, a.index + 1);
  }

  const alParrafo = (d: number) => finDelParrafo(texto, d);
  zonas.push(...pares(texto, '«', '»', 'COMILLAS', alParrafo));
  zonas.push(...pares(texto, '“', '”', 'COMILLAS', alParrafo));
  zonas.push(...pares(texto, '"', '"', 'COMILLAS', alParrafo));
  zonas.push(...pares(texto, '[', ']', 'CORCHETES', (d) => finDeLinea(texto, d)));

  /*
   * LAS NEGRITAS DEL BORRADOR, CON EL MISMO DETECTOR DEL TALLER. De sus capas
   * solo cuentan las que envuelven `**…**` —las que traen un marcador en su
   * primer carácter—: las demás son la lectura tipográfica del taller (nombres
   * en mayúscula, fechas), que pinta en negrita lo que en el texto no lo está.
   */
  const capas = capasTipograficas(texto);
  const marcadores = new Set(capas.filter((c) => c.capa === 'marcador').map((c) => c.inicio));
  for (const c of capas) {
    if (c.capa === 'negrita' && marcadores.has(c.inicio) && texto.startsWith('**', c.inicio)) zonas.push({ inicio: c.inicio, fin: c.fin, motivo: 'NEGRITA' });
  }

  return zonas.sort((x, y) => x.inicio - y.inicio);
};

/* ─── Hallazgos ─────────────────────────────────────────────────────────── */

/** El preferido con la forma del original: «Demanda» → «Libelo», «DEMANDA» → «LIBELO». */
export const conLaFormaDe = (original: string, preferido: string): string => {
  const letras = original.replace(/[^\p{L}]/gu, '');
  if (letras.length > 1 && letras === letras.toUpperCase() && letras !== letras.toLowerCase()) return preferido.toUpperCase();
  const primera = letras[0];
  if (primera && primera !== primera.toLowerCase()) return preferido.charAt(0).toUpperCase() + preferido.slice(1);
  return preferido;
};

const RADIO_DEL_CONTEXTO = 48;
const limpiarContexto = (s: string): string => s.replace(/\*\*/g, '').replace(/\s+/g, ' ');

const contextoDe = (texto: string, inicio: number, fin: number): HallazgoDeJerga['partes'] & { completo: string } => {
  const desde = Math.max(0, inicio - RADIO_DEL_CONTEXTO);
  const hasta = Math.min(texto.length, fin + RADIO_DEL_CONTEXTO);
  let antes = limpiarContexto(texto.slice(desde, inicio));
  let despues = limpiarContexto(texto.slice(fin, hasta));
  /* Una palabra partida al borde se quita: «…ada fue» se lee como un error. */
  if (desde > 0) antes = `…${antes.replace(/^\S*\s/, '')}`;
  if (hasta < texto.length) despues = `${despues.replace(/\s\S*$/, '')}…`;
  const encontrado = limpiarContexto(texto.slice(inicio, fin));
  return { antes, encontrado, despues, completo: `${antes}${encontrado}${despues}` };
};

const solapa = (a: { inicio: number; fin: number }, b: { inicio: number; fin: number }): boolean => a.inicio < b.fin && a.fin > b.inicio;

/**
 * Cada aparición de una variante del glosario, como palabra entera, sin
 * distinguir tildes ni mayúsculas, fuera de las zonas protegidas.
 *
 * LAS VARIANTES LARGAS VAN PRIMERO: «auto que admite» se cuenta como tal, y el
 * «auto» que lleva dentro no se cuenta otra vez como la variante corta.
 */
export const buscarJerga = (texto: string, glosario: readonly EntradaDeJerga[], citasDelBorrador: readonly string[] = []): HallazgoDeJerga[] => {
  const plegado = plegar(texto);
  const zonas = zonasProtegidas(texto, citasDelBorrador);
  const candidatas = glosario
    .flatMap((entrada) =>
      entrada.variantes
        .map((variante) => ({ entrada, variante, clave: plegar(variante).trim().replace(/\s+/g, ' ') }))
        .filter((v) => v.clave.length > 0 && v.clave !== plegar(entrada.preferido).trim().replace(/\s+/g, ' '))
    )
    .sort((a, b) => b.clave.length - a.clave.length);

  const hallazgos: HallazgoDeJerga[] = [];
  for (const { entrada, variante, clave } of candidatas) {
    const re = new RegExp(`${LETRA_O_NUMERO_ANTES}${clave.split(' ').map(escapar).join('\\s+')}${LETRA_O_NUMERO_DESPUES}`, 'gu');
    let m: RegExpExecArray | null;
    while ((m = re.exec(plegado)) !== null) {
      const tramo = { inicio: m.index, fin: m.index + m[0].length };
      if (zonas.some((z) => solapa(z, tramo)) || hallazgos.some((h) => solapa(h, tramo))) continue;
      const encontrado = texto.slice(tramo.inicio, tramo.fin);
      const { completo, ...partes } = contextoDe(texto, tramo.inicio, tramo.fin);
      hallazgos.push({
        ...tramo,
        encontrado,
        variante,
        preferido: entrada.preferido,
        vistoEn: entrada.vistoEn,
        /* El preferido pasa por la misma limpieza que todo lo que se pega en el escrito. */
        reemplazo: conLaFormaDe(encontrado, reemplazoParaPegar(entrada.preferido).texto),
        contexto: completo,
        partes
      });
    }
  }
  return hallazgos.sort((a, b) => a.inicio - b.inicio);
};

/** Un grupo por variante y preferido, en el orden en que aparecen en el escrito. */
export const agruparHallazgos = (hallazgos: readonly HallazgoDeJerga[]): GrupoDeJerga[] => {
  const grupos = new Map<string, GrupoDeJerga>();
  for (const h of hallazgos) {
    const clave = `${plegar(h.preferido)}|${plegar(h.variante)}`;
    const grupo = grupos.get(clave);
    if (grupo) grupo.hallazgos.push(h);
    else grupos.set(clave, { clave, preferido: h.preferido, variante: h.variante, vistoEn: h.vistoEn, hallazgos: [h] });
  }
  return [...grupos.values()];
};

/* ─── Reemplazar ────────────────────────────────────────────────────────── */

/** Reemplaza ESE hallazgo, por posición. null si el texto ya no dice lo mismo ahí. */
export const reemplazarUno = (texto: string, h: HallazgoDeJerga): string | null =>
  aplicarReemplazoEnPosicion(texto, h.inicio, h.fin, h.encontrado, h.reemplazo);

/**
 * Reemplaza todos los hallazgos dados, de atrás hacia adelante para que las
 * posiciones que faltan no se corran. Es todo o nada: si uno ya no está donde
 * se calculó, no se cambia ninguno y la pantalla vuelve a buscar.
 */
export const reemplazarTodas = (texto: string, hallazgos: readonly HallazgoDeJerga[]): { texto: string; reemplazados: number } | null => {
  let actual = texto;
  const ordenados = [...hallazgos].sort((a, b) => b.inicio - a.inicio);
  for (const h of ordenados) {
    const siguiente = reemplazarUno(actual, h);
    if (siguiente === null) return null;
    actual = siguiente;
  }
  return { texto: actual, reemplazados: ordenados.length };
};

/* ─── Selección ─────────────────────────────────────────────────────────── */

/**
 * El texto canónico para ubicar una selección: plegado, espacios colapsados y
 * SIN asteriscos, con el mapa a la posición original. En el papel las negritas
 * se pintan sin `**`, así que lo que el abogado selecciona allí no los trae.
 */
const canonDeSeleccion = (texto: string): { canon: string; mapa: number[] } => {
  const plegado = plegar(texto);
  let canon = '';
  const mapa: number[] = [];
  let enEspacio = false;
  for (let i = 0; i < plegado.length; i++) {
    const c = plegado[i];
    if (c === '*') continue;
    if (/\s/.test(c)) {
      if (enEspacio) continue;
      enEspacio = true;
      canon += ' ';
      mapa.push(i);
      continue;
    }
    enEspacio = false;
    canon += c;
    mapa.push(i);
  }
  return { canon, mapa };
};

/**
 * Los hallazgos que caen dentro de lo que el abogado seleccionó.
 *
 * Con posiciones (el cuadro de edición las da) es un filtro por rango. Con
 * solo el texto (el papel no las da) se ubican TODAS las apariciones de la
 * selección en el escrito y cuenta lo que cae dentro de alguna: si seleccionó
 * «Otro abogado», el abogado del primer párrafo no es parte de la selección.
 */
export const filtrarPorSeleccion = (texto: string, hallazgos: readonly HallazgoDeJerga[], seleccion: SeleccionDelAbogado): HallazgoDeJerga[] => {
  if ('inicio' in seleccion) return hallazgos.filter((h) => h.inicio >= seleccion.inicio && h.fin <= seleccion.fin);

  const aguja = canonDeSeleccion(seleccion.texto).canon.trim();
  if (!aguja) return [];
  const { canon, mapa } = canonDeSeleccion(texto);
  const rangos: Array<{ inicio: number; fin: number }> = [];
  let pos = canon.indexOf(aguja);
  while (pos !== -1) {
    rangos.push({ inicio: mapa[pos], fin: mapa[pos + aguja.length - 1] + 1 });
    pos = canon.indexOf(aguja, pos + 1);
  }
  return hallazgos.filter((h) => rangos.some((r) => h.inicio >= r.inicio && h.fin <= r.fin));
};
