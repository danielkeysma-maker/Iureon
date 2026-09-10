import { decodeBody } from '../ingestion/documentFetch';

/**
 * ¿SIGUE VIVO ESTE ARTÍCULO? Se lo pregunta al texto oficial del Senado,
 * artículo por artículo, y responde VIGENTE · DEROGADO · NO_VERIFICABLE.
 *
 * ─── POR QUÉ EXISTE ────────────────────────────────────────────────────────
 *
 * El 9 de septiembre de 2026 se contrastaron once afirmaciones normativas de los
 * borradores contra el texto oficial. El motor NO inventó nada: los diez
 * artículos citados existen y hasta el numeral fino coincidía. Pero quedaron a
 * la vista dos defectos peores que inventar, y los dos son de VIGENCIA:
 *
 *   · el art. 2035 del Código Civil se invocaba como fundamento de la pretensión
 *     de terminación del arrendamiento, y el texto oficial abre literalmente con
 *     «Artículo derogado por el artículo 43 de la Ley 820 de 2003»;
 *   · el art. 35 de la Ley 820 de 2003 lo derogó el CGP y no rige desde 2014.
 *
 * Un artículo INVENTADO se cae solo: el juez no lo encuentra. Un artículo MUERTO
 * se encuentra, se lee, y dice justo lo que el escrito prometía — hasta que
 * alguien mira el corchete del principio. Por eso esto no se podía dejar en
 * manos de la memoria del modelo, que recuerda el texto derogado igual de bien
 * que el vigente.
 *
 * Este módulo es el gemelo de `jurisprudence/officialRuling.service.ts` para las
 * normas: consulta la fuente oficial antes de que el resultado llegue al
 * abogado, y lo que la fuente diga manda sobre lo que el modelo recuerde. Igual
 * que allá hay un estado que se DECLARA y no se adivina —NO_VERIFICABLE— y
 * confundirlo con «vigente» convertiría una caída del sitio en una certificación
 * falsa, que es el único resultado peor que no mirar.
 *
 * ─── DÓNDE MIRA, Y POR QUÉ AHÍ ─────────────────────────────────────────────
 *
 * `research/VERIFICATION-DOCTRINE.md` fija las fuentes admisibles y su orden:
 * `secretariasenado.gov.co/senado/basedoc/…` primero. Se usa esa y solo esa
 * porque es la única que publica la DEROGACIÓN dentro del propio artículo, en el
 * corchete angular que lo encabeza («<Artículo derogado por…>», «<Artículo
 * INEXEQUIBLE>»). Función Pública y el SUIN sirven el texto, pero leer allí la
 * vigencia exige interpretar tablas distintas en cada norma, y una lectura
 * equivocada aquí es una falsa alarma en la pantalla donde se decide firmar.
 * Cuando el Senado no tiene la norma, la respuesta es NO_VERIFICABLE con el
 * motivo: un hueco declarado vale, uno rellenado destruye el producto.
 *
 * Se descarga además el JS HERMANO de vigencia (`basedoc/js/<documento>.js`),
 * porque la doctrina lo exige con nombre propio: las notas de vigencia no están
 * en el HTML sino en ese archivo, y sin él el texto «se lee como si estuviera
 * intacto». Aquí no decide el estado —lo decide el corchete, que es donde el
 * Senado registra la derogación— pero viaja en el detalle, que es lo que se lee.
 *
 * ─── EL PUERTO 443 NO RESPONDE DESDE AQUÍ, Y ESTÁ MEDIDO ───────────────────
 *
 * Medido el 9 de septiembre de 2026 desde el entorno de desarrollo:
 *
 *     https://www.secretariasenado.gov.co/…  → connect timeout a los 21 s (000)
 *     http://www.secretariasenado.gov.co/…   → 200, 169.319 bytes
 *
 * `curl -v` lo deja claro: no es TLS ni es el User-Agent —se probó con cabecera
 * de navegador y sin ninguna, con el mismo resultado— sino la conexión TCP al
 * 443, que nunca se establece; el 80 sí. Así que se intenta HTTPS primero, con
 * un plazo corto, y se cae a HTTP: en producción, donde el 443 puede estar
 * abierto, se lee cifrado; desde aquí se lee igual en vez de no leer nada. Se
 * manda además un User-Agent de navegador porque no cuesta nada y varios sitios
 * públicos colombianos rechazan al cliente que no se identifica.
 *
 * DEGRADAR A HTTP ES ACEPTABLE AQUÍ Y NO LO SERÍA EN OTRO SITIO: no se envía
 * ningún dato del caso ni credencial alguna, solo se pide una página pública, y
 * lo que vuelve se usa para ADVERTIR, nunca para autorizar. El peor efecto de
 * una respuesta manipulada en tránsito sería un aviso de derogación falso sobre
 * un artículo vivo —molesto, visible y corregible— o la ausencia de un aviso,
 * que es exactamente donde estábamos antes de este archivo.
 */

/** Un artículo, en la misma forma que usa el cedazo (`agent/citacionNormativa.ts`). */
export interface ReferenciaDeArticulo {
  codigo: string;
  articulo: number;
}

export type EstadoDeVigencia = 'VIGENTE' | 'DEROGADO' | 'NO_VERIFICABLE';

export interface VigenciaDeArticulo {
  referencia: ReferenciaDeArticulo;
  estado: EstadoDeVigencia;
  /** Qué dice la fuente, o por qué no se pudo saber. Una frase que el abogado pueda leer. */
  detalle: string;
  /** La página oficial exacta, para que se pueda abrir y comprobar a mano. */
  url?: string;
  /** El epígrafe del artículo tal como lo publica el Senado. */
  rubrica?: string;
  /**
   * EL TEXTO DEL ARTÍCULO, que es la pieza sin la cual no se puede juzgar una
   * glosa.
   *
   * La rúbrica sola no basta y está medido: «OBLIGACIONES DEL ARRENDADOR» sí
   * habría bastado para el caso del art. 8 de la Ley 820, pero «MORA EN EL PAGO
   * DE LA RENTA» no dice nada sobre si un canon insoluto cabe en el juramento
   * estimatorio del art. 206 del CGP — cuya enumeración es cerrada y vive en el
   * cuerpo, no en el epígrafe. Sin cuerpo, comprobar una glosa volvería a ser
   * preguntarle al modelo qué recuerda, que es exactamente lo que falló.
   *
   * Va acotado por `MAX_CUERPO`. Ausente cuando la fuente no respondió.
   */
  cuerpo?: string;
  /** Las notas de vigencia del JS hermano, si las hay. */
  notaDeVigencia?: string;
  /** Cuándo se consultó. Una comprobación sin fecha no es una comprobación. */
  consultadoEn: string;
}

/*
 * ─── DE LA CLAVE CANÓNICA AL DOCUMENTO DEL SENADO ──────────────────────────
 *
 * Las claves son las que produce `canonizarNorma` en `agent/citacionNormativa.ts`
 * —no se redefinen aquí— y los nombres de archivo se comprobaron uno por uno
 * contra el sitio el 9 de septiembre de 2026: los siete de la tabla devolvieron
 * 200, y un nombre inventado (`ley_9999_1999`) devuelve un 404 honesto de 1.515
 * bytes, así que un error de tabla se manifiesta como NO_VERIFICABLE y no como
 * un texto ajeno leído por bueno.
 */
const DOCUMENTOS: Record<string, string> = {
  CGP: 'ley_1564_2012',
  CPACA: 'ley_1437_2011',
  'CODIGO CIVIL': 'codigo_civil',
  'CODIGO DE COMERCIO': 'codigo_comercio',
  'CODIGO SUSTANTIVO DEL TRABAJO': 'codigo_sustantivo_trabajo',
  'CODIGO PENAL': 'ley_0599_2000',
  'CONSTITUCION POLITICA': 'constitucion_politica_1991'
};

/** «LEY 820 DE 2003» → `ley_0820_2003`. El Senado rellena el número a cuatro dígitos. */
const LEY_O_DECRETO = /^(LEY|DECRETO)\s+(\d{1,5})\s+DE\s+(\d{4})$/;

/**
 * El documento del Senado que corresponde a una clave canónica, o null cuando
 * esta casa no sabe dónde vive esa norma. Null NO significa que la norma no
 * exista: significa que no se puede comprobar aquí, y así se declara.
 */
export const documentoDelSenado = (codigo: string): string | null => {
  const fijo = DOCUMENTOS[codigo];
  if (fijo) return fijo;
  const m = LEY_O_DECRETO.exec(codigo);
  if (!m) return null;
  return `${m[1].toLowerCase()}_${m[2].padStart(4, '0')}_${m[3]}`;
};

const BASE = 'www.secretariasenado.gov.co/senado/basedoc';

export const urlDelDocumento = (documento: string, fragmento = ''): string =>
  `https://${BASE}/${documento}${fragmento}.html`;

/*
 * ─── LECTURA DEL HTML ──────────────────────────────────────────────────────
 */

/**
 * Las entidades que aparecen de verdad en estas páginas. No es un decodificador
 * general de HTML a propósito: `&lt;` y `&gt;` SON el marcador de derogación, y
 * cambiar una tabla que se lee de un vistazo por un paquete que nadie audita no
 * mejora nada aquí.
 */
const ENTIDADES: Record<string, string> = {
  aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', uuml: 'ü',
  Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
  ntilde: 'ñ', Ntilde: 'Ñ', ordm: 'o', ordf: 'a', deg: '°',
  nbsp: ' ', amp: '&', quot: '"', apos: "'", lt: '<', gt: '>',
  laquo: '«', raquo: '»', ldquo: '“', rdquo: '”', mdash: '—', ndash: '–'
};

export const decodificarEntidades = (texto: string): string =>
  texto
    .replace(/&#(\d{1,5});/g, (_todo, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&([A-Za-z]+);/g, (todo, nombre: string) => ENTIDADES[nombre] ?? todo);

const sinEtiquetas = (html: string): string => html.replace(/<[^>]*>/g, ' ');

const enUnaLinea = (texto: string): string => texto.replace(/\s+/g, ' ').trim();

/**
 * El índice del documento es, sin quererlo, un mapa artículo → fragmento.
 *
 * El Senado parte los códigos largos en páginas `_pr000`, `_pr001`… y publica en
 * la portada un desplegable con TODOS los artículos:
 * `<option value="_pr063ç#2035">2035</option>`. Ese desplegable es lo que hace
 * barata la consulta —una sola descarga da la ubicación de los 2.684 artículos
 * del Código Civil— y evita el rastreo página por página, que serían ochenta
 * descargas de 170 KB contra un sitio público servido por un Apache 2.2.
 *
 * En las normas cortas el valor no trae fragmento (`value="#43"`): el documento
 * es una sola página y el mapa devuelve cadena vacía, que es justo el sufijo que
 * hay que concatenar.
 */
export const mapaDeFragmentos = (htmlIndice: string): Map<number, string> => {
  const mapa = new Map<number, string>();
  for (const m of htmlIndice.matchAll(/<option\s+value="([^"]*)"\s*>\s*(\d{1,4})\s*<\/option>/gi)) {
    const fragmento = /^(_pr\d+)/.exec(m[1])?.[1] ?? '';
    const articulo = Number(m[2]);
    if (!mapa.has(articulo)) mapa.set(articulo, fragmento);
  }
  return mapa;
};

/**
 * El trozo de HTML que va desde el ancla del artículo hasta la siguiente ancla.
 *
 * Se corta en la siguiente `bookmarkaj` sea del tipo que sea —artículo o título
 * de capítulo (`name="Nivel196"`)— porque cualquiera de las dos marca el final
 * del artículo, y quedarse con más texto arrastraría el artículo siguiente y con
 * él su marcador de derogación. Ese error sería una acusación falsa con
 * apariencia de dato duro, que es lo que este repositorio ya aprendió a temer.
 */
export const bloqueDelArticulo = (html: string, articulo: number): string | null => {
  const ancla = new RegExp(`<a\\s+class="bookmarkaj"\\s+name="${articulo}"\\s*>`, 'i');
  const m = ancla.exec(html);
  if (!m) return null;
  const desde = m.index;
  const siguiente = /<a\s+class="bookmarkaj"\s+name="/i.exec(html.slice(desde + m[0].length));
  const hasta = siguiente ? desde + m[0].length + siguiente.index : html.length;
  return html.slice(desde, hasta);
};

/** El epígrafe: «ARTÍCULO 2035. <MORA EN EL PAGO DE LA RENTA>.», sin los corchetes. */
export const rubricaDelBloque = (bloque: string): string => {
  const titulo = /<a[^>]*>([\s\S]*?)<\/a>/i.exec(bloque)?.[1] ?? '';
  return enUnaLinea(decodificarEntidades(sinEtiquetas(titulo)).replace(/[<>]/g, '')).replace(/\.$/, '');
};

/**
 * CUÁNTO TEXTO DE ARTÍCULO SE PUBLICA, y por qué ese número.
 *
 * MEDIDO el 10 de septiembre de 2026 bajando del Senado los artículos que estos
 * borradores citan de verdad, y contando el cuerpo ya limpio:
 *
 *     Ley 820 de 2003, art. 8  (obligaciones del arrendador)   1.684 caracteres
 *     Ley 820 de 2003, art. 9  (obligaciones del arrendatario) 1.209
 *     Ley 820 de 2003, art. 22 (terminación por el arrendador) 3.550
 *     CGP, art. 206 (juramento estimatorio)                    2.838
 *     CGP, art. 626 (derogaciones)                             4.798
 *     CGP, art. 384 (restitución de inmueble arrendado)        6.089
 *
 * Ocho mil caracteres los cubren TODOS ENTEROS, y que quepan enteros es el
 * punto: el art. 206 es taxativo —su enumeración cerrada es justo lo que hace
 * falta para saber si un canon insoluto cabe en el juramento estimatorio— y
 * cortarlo antes del último inciso convertiría al juez de la glosa en un juez
 * que no vio el texto. Su NO_SOSTENIDA sería entonces una falsa alarma
 * fabricada por el recorte, que es peor que no comprobar nada.
 *
 * Por arriba, ocho mil caracteres son ~2.300 tokens: a los US$0,75 por millón
 * de entrada del motor barato, menos de US$0,002 por artículo. Así que el tope
 * no está puesto por dinero sino para que un artículo monstruoso no se lleve el
 * presupuesto de la etapa entera. Cuando se corta, SE DICE dentro del propio
 * texto: un juez que ignore que le faltaba el final juzgaría creyendo que lo vio.
 */
export const MAX_CUERPO = 8_000;

/**
 * Las cajas plegables del Senado, quitadas POR SU ETIQUETA HTML y no por su texto.
 *
 * Perseguirlas por las palabras («Notas de Vigencia», «Legislación Anterior»)
 * parecía equivalente y no lo era: el art. 35 de la Ley 820 dice dentro de su
 * propio corchete «ver en Legislación Anterior el texto vigente hasta esta
 * fecha», y el barrido por palabras le arrancaba esa frase al artículo. Editar
 * el texto oficial para limpiarlo es justo lo que este módulo no puede hacer.
 * La clase  SÍ identifica exactamente el enlace de la caja.
 */
const CAJA_PLEGABLE = /<a[^>]*class="caja_vja_encabezado"[^>]*>[\s\S]*?<\/a>/gi;

/**
 * El TEXTO del artículo: lo que viene después del epígrafe, sin etiquetas y sin
 * las cajas plegables.
 *
 * Las cajas se quitan porque en el HTML solo dejan su rótulo suelto —su
 * contenido lo inyecta el JS— y dárselo al juez de la glosa sería darle
 * palabras que no son del artículo. Y NO se quitan los marcadores angulares
 * —«<Artículo modificado por…>»— porque eso SÍ es del artículo y cambia lo que
 * dice.
 */
export const cuerpoDelBloque = (bloque: string): string => {
  const finDelTitulo = /<\/a>/i.exec(bloque);
  const resto = finDelTitulo ? bloque.slice(finDelTitulo.index + finDelTitulo[0].length) : bloque;
  const plano = enUnaLinea(
    decodificarEntidades(sinEtiquetas(resto.replace(CAJA_PLEGABLE, ' ')))
  );
  if (plano.length <= MAX_CUERPO) return plano;
  return `${plano.slice(0, MAX_CUERPO)} […texto oficial recortado en ${MAX_CUERPO} caracteres; el artículo sigue más allá de este punto…]`;
};

/**
 * Los marcadores angulares que el Senado pone DESPUÉS del epígrafe.
 *
 * El epígrafe también va entre `<>` en muchos artículos, así que se descarta
 * cuanto haya dentro del ancla del título: mirar el bloque entero convertiría
 * «<MORA EN EL PAGO DE LA RENTA>» en un marcador de estado.
 */
export const marcadoresDelBloque = (bloque: string): string[] => {
  const finDelTitulo = /<\/a>/i.exec(bloque);
  const resto = finDelTitulo ? bloque.slice(finDelTitulo.index + finDelTitulo[0].length) : bloque;
  const plano = decodificarEntidades(sinEtiquetas(resto));
  return [...plano.matchAll(/<([^<>]{4,600})>/g)].map((m) => enUnaLinea(m[1]));
};

/**
 * DEROGADO solo cuando la fuente lo dice del ARTÍCULO ENTERO.
 *
 * «Aparte tachado derogado» o «Expresión … INEXEQUIBLE» hablan de un pedazo: el
 * artículo sigue en el ordenamiento, y marcarlo muerto sería la falsa alarma que
 * enseña a ignorar todos los avisos. Esos casos salen VIGENTES con la nota en el
 * detalle, que es lo que hay que leer antes de apoyarse en ellos.
 */
const MUERTO = /^art[íi]culo\s+(?:\d+[a-z]?\s+)?(?:derogad|anulad|subrogad|inexequible|declarado\s+inexequible)/i;

export const estadoDeLosMarcadores = (
  marcadores: string[]
): { estado: 'VIGENTE' | 'DEROGADO'; marcador?: string } => {
  const mortal = marcadores.find((m) => MUERTO.test(m));
  if (mortal) return { estado: 'DEROGADO', marcador: mortal };
  return { estado: 'VIGENTE', marcador: marcadores[0] };
};

/**
 * La nota de vigencia del JS hermano, si el bloque enlaza una.
 *
 * El bloque trae `href="javascript:insRow1()"` junto a la etiqueta «Notas de
 * Vigencia», y el archivo `js/<documento>.js` define esa función con el texto
 * dentro. Solo se lee la de vigencia: la caja «Legislación Anterior» contiene el
 * texto DEROGADO del artículo, y confundirlo con el vigente sería devolver como
 * derecho justo lo que este módulo existe para señalar.
 */
export const notaDeVigencia = (bloque: string, js: string): string | undefined => {
  const enlace = /href="javascript:insRow(\d+)\(\)"[^>]*>\s*Notas de Vigencia/i.exec(bloque);
  if (!enlace) return undefined;
  const fn = new RegExp(
    `function\\s+insRow${enlace[1]}\\s*\\(\\)[\\s\\S]*?description\\[0\\]\\s*=\\s*"([\\s\\S]*?)";`
  );
  const cuerpo = fn.exec(js)?.[1];
  if (!cuerpo) return undefined;
  const texto = enUnaLinea(decodificarEntidades(sinEtiquetas(cuerpo)));
  return texto.length > 0 ? texto.slice(0, 400) : undefined;
};

/*
 * ─── LA RED ────────────────────────────────────────────────────────────────
 */

/** Se identifica como navegador: varios sitios públicos del país rechazan al que no lo hace. */
const NAVEGADOR =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/**
 * Descarga una página del Senado. HTTPS primero; si no contesta, HTTP.
 *
 * Devuelve null en vez de lanzar: «no se pudo leer» tiene que llegar arriba como
 * NO_VERIFICABLE, nunca como una excepción que tumbe la entrega de un escrito
 * que ya está escrito.
 */
/*
 * EL ESQUEMA QUE FUNCIONÓ SE RECUERDA, y sin esto el presupuesto no alcanzaba.
 *
 * Medido: una consulta baja tres archivos (portada, página del artículo y JS de
 * vigencia), y desde este entorno cada uno pagaba primero un intento de HTTPS
 * que no conecta nunca. Diez segundos y medio por artículo, de los cuales la
 * mayoría era esperar al 443. Recordando el esquema, solo el PRIMER archivo de
 * la instancia paga esa espera. Se guarda por proceso, no por artículo, porque
 * lo que se aprende es del enlace de red, no de la norma.
 */
let esquemaQueFunciona: 'https' | 'http' | null = null;

const descargar = async (ruta: string, limiteMs: number): Promise<string | null> => {
  const mitad = Math.max(1_500, Math.floor(limiteMs / 2));
  const esquemas: Array<'https' | 'http'> =
    esquemaQueFunciona === 'http' ? ['http', 'https'] : ['https', 'http'];
  for (const esquema of esquemas) {
    try {
      const respuesta = await fetch(`${esquema}://${ruta}`, {
        headers: { 'User-Agent': NAVEGADOR, Accept: 'text/html,application/xhtml+xml,*/*' },
        signal: AbortSignal.timeout(mitad)
      });
      // Un 404 es una RESPUESTA: el sitio contestó y no la tiene. Reintentar por
      // el otro esquema solo gastaría el presupuesto para oír lo mismo.
      esquemaQueFunciona = esquema;
      if (!respuesta.ok) return null;
      const buffer = Buffer.from(await respuesta.arrayBuffer());
      return decodeBody(buffer, respuesta.headers.get('content-type') ?? '');
    } catch {
      /* Se intenta el siguiente esquema. Ver la nota del puerto 443 en la cabecera. */
    }
  }
  return null;
};

/*
 * ─── LA CACHÉ ──────────────────────────────────────────────────────────────
 *
 * La vigencia de un artículo no cambia de un día para otro: entre la derogación
 * y su publicación hay un trámite legislativo entero. Consultar el Senado en
 * cada borrador sería lento para el abogado y descortés con un sitio público.
 * Siete días es más corto que cualquier tránsito normativo y más largo que
 * cualquier ráfaga de borradores.
 *
 * Vive en memoria del proceso, como la de `officialRuling.service.ts`: en
 * serverless cada instancia empieza vacía, así que esto amortigua la ráfaga —que
 * es el caso que importa— y no promete una persistencia que no hay.
 */
const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

interface EnCache<T> {
  valor: T;
  expira: number;
}

const cacheDeIndices = new Map<string, EnCache<Map<number, string>>>();
const cacheDeArticulos = new Map<string, EnCache<VigenciaDeArticulo>>();

/** Solo para los checks: una caché que sobrevive entre pruebas mide la prueba anterior. */
export const limpiarCacheDeVigencia = (): void => {
  cacheDeIndices.clear();
  cacheDeArticulos.clear();
};

const vivo = <T>(entrada: EnCache<T> | undefined): T | null =>
  entrada && entrada.expira > Date.now() ? entrada.valor : null;

const noVerificable = (
  referencia: ReferenciaDeArticulo,
  detalle: string,
  url?: string
): VigenciaDeArticulo => ({
  referencia,
  estado: 'NO_VERIFICABLE',
  detalle,
  url,
  consultadoEn: new Date().toISOString().slice(0, 10)
});

/**
 * Consulta la vigencia de UN artículo en el texto oficial.
 *
 * Nunca lanza y nunca adivina. Los tres estados son los del molde de
 * providencias: lo comprobado se afirma, lo desmentido se afirma, y lo que no se
 * pudo mirar se DECLARA sin mirar.
 */
export const consultarVigencia = async (
  referencia: ReferenciaDeArticulo,
  limiteMs = 8_000
): Promise<VigenciaDeArticulo> => {
  const clave = `${referencia.codigo}|${referencia.articulo}`;
  const enCache = vivo(cacheDeArticulos.get(clave));
  if (enCache) return enCache;

  const documento = documentoDelSenado(referencia.codigo);
  if (!documento) {
    /*
     * No se cachea: mañana la tabla puede conocer la norma, y un hueco cacheado
     * sobreviviría al arreglo.
     */
    return noVerificable(
      referencia,
      `Esta casa no sabe en qué documento del Senado vive «${referencia.codigo}», así que su vigencia no se comprobó.`
    );
  }

  const inicio = Date.now();
  const restante = (): number => Math.max(0, limiteMs - (Date.now() - inicio));

  let indice = vivo(cacheDeIndices.get(documento));
  if (!indice) {
    const portada = await descargar(`${BASE}/${documento}.html`, restante());
    if (!portada) {
      return noVerificable(
        referencia,
        'El texto oficial del Senado no respondió, así que no se sabe si el artículo sigue vigente.',
        urlDelDocumento(documento)
      );
    }
    indice = mapaDeFragmentos(portada);
    /*
     * Una norma corta puede no traer desplegable. En ese caso el índice queda
     * vacío y el propio documento es la página del artículo: se registra así
     * para no volver a bajarlo, y la búsqueda del ancla dirá si está o no.
     */
    cacheDeIndices.set(documento, { valor: indice, expira: Date.now() + SIETE_DIAS_MS });
  }

  const fragmento = indice.get(referencia.articulo) ?? (indice.size === 0 ? '' : null);
  if (fragmento === null) {
    /*
     * El índice del Senado sí es la lista cerrada de los artículos del
     * documento, pero un artículo ausente puede significar dos cosas —que la
     * norma no lo tiene, o que el escrito le puso el código equivocado— y esta
     * casa no puede distinguirlas. Se declara, no se acusa.
     */
    return noVerificable(
      referencia,
      `El índice oficial de la norma no lista un artículo ${referencia.articulo}: puede que la cita lleve el código de otra norma. No se pudo comprobar su vigencia.`,
      urlDelDocumento(documento)
    );
  }

  const url = `${urlDelDocumento(documento, fragmento)}#${referencia.articulo}`;
  const pagina = await descargar(`${BASE}/${documento}${fragmento}.html`, restante());
  if (!pagina) {
    return noVerificable(
      referencia,
      'El texto oficial del Senado no respondió, así que no se sabe si el artículo sigue vigente.',
      url
    );
  }

  const bloque = bloqueDelArticulo(pagina, referencia.articulo);
  if (!bloque) {
    return noVerificable(
      referencia,
      'La página oficial de la norma no trae el ancla de ese artículo; no se pudo comprobar su vigencia.',
      url
    );
  }

  const { estado, marcador } = estadoDeLosMarcadores(marcadoresDelBloque(bloque));
  const js = await descargar(`${BASE}/js/${documento}${fragmento}.js`, Math.min(restante(), 4_000));
  const nota = js ? notaDeVigencia(bloque, js) : undefined;

  const resultado: VigenciaDeArticulo = {
    referencia,
    estado,
    detalle:
      estado === 'DEROGADO'
        ? (marcador ?? 'El texto oficial lo marca derogado.')
        : marcador
          ? `El texto oficial no lo marca derogado. Nota del artículo: «${marcador}».`
          : 'El texto oficial lo publica sin marca de derogación.',
    url,
    rubrica: rubricaDelBloque(bloque),
    cuerpo: cuerpoDelBloque(bloque),
    notaDeVigencia: nota,
    consultadoEn: new Date().toISOString().slice(0, 10)
  };

  cacheDeArticulos.set(clave, { valor: resultado, expira: Date.now() + SIETE_DIAS_MS });
  return resultado;
};
