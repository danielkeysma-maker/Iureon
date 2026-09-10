import { decodeBody } from '../ingestion/documentFetch';
import {
  NAVEGADOR,
  NOMBRE_DE_FUENTE,
  decodificarEntidades,
  enUnaLinea,
  esOpinion,
  guardar,
  recortarCuerpo,
  sinEtiquetas,
  vivo,
  type EnCache,
  type FuenteOficial,
  type LecturaDeFuente,
  type ReferenciaDeArticulo
} from './fuenteOficial';
import { leerEnFuncionPublica, limpiarCacheDeFuncionPublica } from './funcionPublica.source';

/**
 * ¿SIGUE VIVO ESTE ARTÍCULO? Se lo pregunta a las fuentes oficiales, artículo
 * por artículo, y responde VIGENTE · DEROGADO · DISCREPANCIA_ENTRE_FUENTES ·
 * NO_VERIFICABLE.
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
 * ─── POR QUÉ YA NO BASTA UNA FUENTE, CON LAS TRES RAZONES MEDIDAS ──────────
 *
 * Hasta el 10 de septiembre de 2026 esto consultaba SOLO la Secretaría del
 * Senado. Tres hechos del mismo día lo rompieron:
 *
 *   1. EL SENADO NOS DEJÓ SIN RESPUESTA. Verificando los fundamentos del Código
 *      Civil, la Ley 54 de 1990 no se pudo leer en cuatro intentos y la ficha
 *      quedó sin cerrar.
 *   2. `basedoc` NO PUBLICA DECRETOS NI RESOLUCIONES. Y es donde más muerde: los
 *      Decretos Únicos —1069 de justicia, 1076 de ambiente— derogaron sectores
 *      enteros y esas normas siguen circulando como si vivieran. Con una sola
 *      fuente, toda cita de decreto salía «no verificable».
 *   3. UNA FUENTE OFICIAL TAMBIÉN PUEDE ESTAR DESACTUALIZADA. La doctrina
 *      (regla 3) lo documenta con un caso medido en esta casa: Función Pública
 *      sirve el art. 159 ORIGINAL de la Ley 769 de 2002, no el que reformó el
 *      Decreto Ley 019 de 2012. Si le pasa a una, le puede pasar a la otra — y
 *      con una sola no hay forma de enterarse.
 *
 * ─── LA REGLA QUE GOBIERNA ESTE ARCHIVO ────────────────────────────────────
 *
 * ESTO NO ES «SI FALLA UNA, USO LA OTRA». Es:
 *
 *   · CONCORDANCIA → VIGENTE o DEROGADO con la confianza de dos lecturas que
 *     coinciden, y SE DICE cuáles concordaron.
 *   · DISCREPANCIA → SE DECLARA, NO SE RESUELVE. Si una fuente dice vigente y
 *     otra derogado, el estado es `DISCREPANCIA_ENTRE_FUENTES` y viajan LAS DOS
 *     versiones con SUS DOS URLs, para que el abogado lo vea y decida. Elegir la
 *     que convenga —o la de la fuente «mejor»— sería inventar con cara de rigor:
 *     el producto quedaría idéntico al de una sola fuente, pero con dos sellos.
 *   · SOLO UNA RESPONDE → vale, y se dice que solo una respondió y cuál.
 *   · NINGUNA RESPONDE → NO_VERIFICABLE, como siempre.
 *
 * Y un SILENCIO NO ES UNA OPINIÓN. Que Función Pública no publique el Código
 * Civil, o que el Decreto 1069 de 2015 no tenga un «artículo 1» porque numera
 * 2.2.4.4.2.4, no contradice al Senado: contarlo como desacuerdo habría
 * fabricado discrepancias donde solo hay una copia que no llega. Por eso una
 * lectura tiene cuatro estados y solo dos votan. Ver `fuenteOficial.ts`.
 *
 * ─── EL SUIN-JURISCOL, QUE ES LA TERCERA FUENTE Y NO SE PUDO LEER ──────────
 *
 * `research/VERIFICATION-DOCTRINE.md` admite tres sitios para el texto de una
 * norma, y el tercero es `suin-juriscol.gov.co`. NO está implementado, y el
 * motivo se deja escrito porque es un hallazgo, no un olvido.
 *
 * MEDIDO el 10 de septiembre de 2026, desde dos rutas de red distintas:
 *
 *     DNS  → 186.86.242.143, resuelve
 *     TCP  → el puerto 443 ACEPTA la conexión
 *     TLS  → el handshake TERMINA, con certificado EV válido del Ministerio de
 *            Justicia y del Derecho, expedido por Sectigo
 *     HTTP → la petición se envía entera y el servidor cierra sin contestar
 *            una sola cabecera («server closed abruptly»), con curl, con
 *            `openssl s_client` a mano y con `fetch` de Node (UND_ERR_SOCKET)
 *     :80  → no conecta.   ping → 100% de pérdida.
 *
 * Es decir: no hay HTML del SUIN que nadie de esta casa haya visto. Escribir su
 * lector sería escribir un analizador contra una página imaginada y una guarda
 * contra un HTML inventado — exactamente lo que la regla 2 de la doctrina
 * prohíbe («nunca completes con lo que sabes»). El día que el sitio conteste, la
 * fuente entra como un archivo más en `FUENTES`: la composición de abajo ya
 * trabaja con N lecturas, no con dos.
 *
 * ─── EL PUERTO 443 DEL SENADO NO RESPONDE DESDE AQUÍ, Y ESTÁ MEDIDO ────────
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
 * abierto, se lee cifrado; desde aquí se lee igual en vez de no leer nada.
 *
 * DEGRADAR A HTTP ES ACEPTABLE AQUÍ Y NO LO SERÍA EN OTRO SITIO: no se envía
 * ningún dato del caso ni credencial alguna, solo se pide una página pública, y
 * lo que vuelve se usa para ADVERTIR, nunca para autorizar. El peor efecto de
 * una respuesta manipulada en tránsito sería un aviso de derogación falso sobre
 * un artículo vivo —molesto, visible y corregible— o la ausencia de un aviso,
 * que es exactamente donde estábamos antes de este archivo.
 */

export {
  MAX_CUERPO,
  NOMBRE_DE_FUENTE,
  decodificarEntidades,
  type FuenteOficial,
  type LecturaDeFuente,
  type ReferenciaDeArticulo
} from './fuenteOficial';

export type EstadoDeVigencia =
  | 'VIGENTE'
  | 'DEROGADO'
  | 'DISCREPANCIA_ENTRE_FUENTES'
  | 'NO_VERIFICABLE';

export interface VigenciaDeArticulo {
  referencia: ReferenciaDeArticulo;
  estado: EstadoDeVigencia;
  /** Qué dicen las fuentes, o por qué no se pudo saber. Una frase que el abogado pueda leer. */
  detalle: string;
  /** La página oficial exacta, para que se pueda abrir y comprobar a mano. */
  url?: string;
  /** El epígrafe del artículo tal como lo publica la fuente que se muestra. */
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
   * Va acotado por `MAX_CUERPO`. Ausente cuando ninguna fuente respondió, y
   * AUSENTE TAMBIÉN EN LA DISCREPANCIA: cuando las fuentes no coinciden no hay
   * «el» texto del artículo, y elegir uno para que el juez de la glosa lo use
   * sería resolver a escondidas lo que este estado existe para declarar.
   */
  cuerpo?: string;
  /** Las notas de vigencia del JS hermano del Senado, si las hay. */
  notaDeVigencia?: string;
  /** LO QUE DIJO CADA FUENTE, incluidas las que callaron. Es el sustento del estado. */
  lecturas: LecturaDeFuente[];
  /** Las fuentes que sí opinaron sobre el artículo. Vacío en NO_VERIFICABLE. */
  fuentesQueOpinaron: FuenteOficial[];
  /** Cuándo se consultó. Una comprobación sin fecha no es una comprobación. */
  consultadoEn: string;
}

/*
 * ═══ LA SECRETARÍA DEL SENADO ══════════════════════════════════════════════
 *
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
  return recortarCuerpo(
    enUnaLinea(decodificarEntidades(sinEtiquetas(resto.replace(CAJA_PLEGABLE, ' '))))
  );
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
/*
 * SUBROGAR NO ES MATAR, y tratarlo como muerte fue un falso positivo medido.
 *
 * El 10 de septiembre de 2026, verificando los fundamentos del Código Civil, el
 * art. 1040 —el orden hereditario— salió DEROGADO. No lo está: el Senado lo
 * marca «subrogado por el art. 2 de la Ley 29 de 1982» Y PUBLICA EL TEXTO
 * NUEVO. Subrogar es sustituir el contenido dejando el artículo en pie; derogar
 * es quitarlo del ordenamiento. Con el falso positivo, la ficha de sucesión se
 * quedó sin uno de sus fundamentos y el escrito lo habría marcado como norma
 * muerta delante del juez.
 *
 * Es la misma falta que este repositorio ya se conoce: la falsa alarma es peor
 * que el silencio, porque una acusación errónea enseña a ignorar todos los
 * avisos —incluidos los verdaderos, como el art. 483 o el 2035, que sí están
 * derogados—.
 *
 * El artículo subrogado sale VIGENTE con su marcador en el detalle, que es lo
 * que hay que leer antes de apoyarse en él: el texto que rige es el nuevo.
 */
const MUERTO = /^art[íi]culo\s+(?:\d+[a-z]?\s+)?(?:derogad|anulad|inexequible|declarado\s+inexequible)/i;

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
 *
 * La doctrina lo exige con nombre propio (regla 3): «las notas de vigencia viven
 * en un JS aparte», y sin él el texto «se lee como si estuviera intacto».
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

/*
 * PARTIR EL PLAZO EN DOS SOLO MIENTRAS NO SE SEPA CUÁL ESQUEMA SIRVE.
 *
 * Medido el 10 de septiembre de 2026: la portada del Código Civil por el puerto
 * 80 tarda 13,8 s —168.336 bytes servidos por un Apache lento— y el 443 sigue
 * sin conectar. Con el plazo partido a la mitad, el intento por HTTP se abortaba
 * a los 10 s de un plazo de 20 y la lectura salía SIN_RESPUESTA teniendo el
 * sitio en pie. Repartir a ciegas costaba justo la lectura que se podía hacer.
 *
 * Ahora el esquema que NO se ha comprobado solo recibe un SONDEO corto: una
 * conexión que va a establecerse se establece en menos de cuatro segundos, y lo
 * que se está esperando en el 443 no es una página lenta sino un SYN que nunca
 * vuelve. El esquema aprendido —o el segundo, cuando el sondeo falla— se lleva
 * todo lo que quede. Es el mismo aprendizaje de siempre, por proceso y no por
 * norma, usado además para repartir el reloj y no solo para ordenar.
 */
const SONDEO_MS = 4_000;

const descargarDelSenado = async (ruta: string, limiteMs: number): Promise<string | null> => {
  const inicio = Date.now();
  const queda = (): number => Math.max(1_500, limiteMs - (Date.now() - inicio));
  const esquemas: Array<'https' | 'http'> =
    esquemaQueFunciona === 'http' ? ['http', 'https'] : ['https', 'http'];
  for (const esquema of esquemas) {
    const ultimo = esquema === esquemas[esquemas.length - 1];
    const plazo =
      esquemaQueFunciona === esquema || ultimo ? queda() : Math.min(SONDEO_MS, queda());
    try {
      const respuesta = await fetch(`${esquema}://${ruta}`, {
        headers: { 'User-Agent': NAVEGADOR, Accept: 'text/html,application/xhtml+xml,*/*' },
        signal: AbortSignal.timeout(plazo)
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

/**
 * Descarga por URL absoluta, que es la forma que comparten todas las fuentes.
 * El Senado necesita elegir esquema, así que aquí se le quita el prefijo y se
 * deja que decida `descargarDelSenado`.
 */
const descargarSenadoPorUrl = (url: string, ms: number): Promise<string | null> =>
  descargarDelSenado(url.replace(/^https?:\/\//, ''), ms);

const cacheDeIndices = new Map<string, EnCache<Map<number, string>>>();

const silencioDelSenado = (detalle: string, url?: string): LecturaDeFuente => ({
  fuente: 'SENADO',
  estado: 'SIN_RESPUESTA',
  detalle,
  url
});

/**
 * Lo que la Secretaría del Senado dice de UN artículo. Nunca lanza.
 *
 * `descargarPagina` está inyectado por la misma razón que en Función Pública:
 * la guarda determinista corre el lector ENTERO sobre HTML verbatim del sitio
 * sin salir a la red, y así se prueba también el pegamento entre las piezas.
 */
export const leerEnSenado = async (
  referencia: ReferenciaDeArticulo,
  limiteMs = 8_000,
  descargarPagina: (url: string, ms: number) => Promise<string | null> = descargarSenadoPorUrl
): Promise<LecturaDeFuente> => {
  const inicio = Date.now();
  const restante = (): number => Math.max(0, limiteMs - (Date.now() - inicio));
  const con = (l: LecturaDeFuente): LecturaDeFuente => ({ ...l, duracionMs: Date.now() - inicio });

  const documento = documentoDelSenado(referencia.codigo);
  if (!documento) {
    return con({
      fuente: 'SENADO',
      estado: 'SIN_ARTICULO',
      detalle: `Esta casa no sabe en qué documento de ${NOMBRE_DE_FUENTE.SENADO} vive «${referencia.codigo}».`
    });
  }

  let indice = vivo(cacheDeIndices.get(documento));
  if (!indice) {
    const portada = await descargarPagina(urlDelDocumento(documento), restante());
    if (!portada) {
      /*
       * «No entregó» y no «no respondió»: medido el 10 de septiembre de 2026,
       * `basedoc/ley_0054_1990.html` devuelve un 404 honesto de 1.515 bytes en
       * 15,8 s — el sitio SÍ contestó, sencillamente no tiene esa norma. Decir
       * «no respondió» habría acusado de caída a un servidor en pie.
       */
      return con(
        silencioDelSenado(
          `${NOMBRE_DE_FUENTE.SENADO} no entregó esa norma (no la publica, o no contestó a tiempo).`,
          urlDelDocumento(documento)
        )
      );
    }
    /*
     * Una norma corta puede no traer desplegable. En ese caso el índice queda
     * vacío y el propio documento es la página del artículo: se registra así
     * para no volver a bajarlo, y la búsqueda del ancla dirá si está o no.
     */
    indice = guardar(cacheDeIndices, documento, mapaDeFragmentos(portada));
  }

  const fragmento = indice.get(referencia.articulo) ?? (indice.size === 0 ? '' : null);
  if (fragmento === null) {
    /*
     * El índice del Senado sí es la lista cerrada de los artículos del
     * documento, pero un artículo ausente puede significar dos cosas —que la
     * norma no lo tiene, o que el escrito le puso el código equivocado— y esta
     * casa no puede distinguirlas. Se declara, no se acusa.
     */
    return con({
      fuente: 'SENADO',
      estado: 'SIN_ARTICULO',
      detalle: `El índice de ${NOMBRE_DE_FUENTE.SENADO} no lista un artículo ${referencia.articulo} en esa norma.`,
      url: urlDelDocumento(documento)
    });
  }

  const url = `${urlDelDocumento(documento, fragmento)}#${referencia.articulo}`;
  const pagina = await descargarPagina(urlDelDocumento(documento, fragmento), restante());
  if (!pagina)
    return con(
      silencioDelSenado(`${NOMBRE_DE_FUENTE.SENADO} no entregó la página del artículo.`, url)
    );

  const bloque = bloqueDelArticulo(pagina, referencia.articulo);
  if (!bloque) {
    return con({
      fuente: 'SENADO',
      estado: 'SIN_ARTICULO',
      detalle: `La página de ${NOMBRE_DE_FUENTE.SENADO} no trae el ancla del artículo ${referencia.articulo}.`,
      url
    });
  }

  const { estado, marcador } = estadoDeLosMarcadores(marcadoresDelBloque(bloque));
  const js = await descargarPagina(
    `https://${BASE}/js/${documento}${fragmento}.js`,
    Math.min(restante(), 4_000)
  );

  return con({
    fuente: 'SENADO',
    estado,
    detalle:
      estado === 'DEROGADO'
        ? (marcador ?? `${NOMBRE_DE_FUENTE.SENADO} lo marca derogado.`)
        : marcador
          ? `${NOMBRE_DE_FUENTE.SENADO} no lo marca derogado. Nota del artículo: «${marcador}».`
          : `${NOMBRE_DE_FUENTE.SENADO} lo publica sin marca de derogación.`,
    url,
    rubrica: rubricaDelBloque(bloque),
    cuerpo: cuerpoDelBloque(bloque),
    notaDeVigencia: js ? notaDeVigencia(bloque, js) : undefined
  });
};

/*
 * ═══ LA COMPOSICIÓN ════════════════════════════════════════════════════════
 */

/** El orden de la doctrina (regla 1). Decide QUÉ texto se muestra cuando hay acuerdo. */
const ORDEN_DOCTRINAL: FuenteOficial[] = ['SENADO', 'FUNCION_PUBLICA', 'SUIN'];

const porOrdenDoctrinal = (a: LecturaDeFuente, b: LecturaDeFuente): number =>
  ORDEN_DOCTRINAL.indexOf(a.fuente) - ORDEN_DOCTRINAL.indexOf(b.fuente);

const listar = (fuentes: FuenteOficial[]): string =>
  fuentes.map((f) => NOMBRE_DE_FUENTE[f]).join(' y ');

/**
 * EL VEREDICTO A PARTIR DE LO QUE DIJO CADA FUENTE.
 *
 * Pura y sin red a propósito: es la regla que gobierna todo este archivo y tiene
 * que poder probarse con lecturas fabricadas, sin depender de que tres sitios
 * públicos estén de buen humor.
 */
export const componerVigencia = (
  referencia: ReferenciaDeArticulo,
  lecturas: LecturaDeFuente[]
): VigenciaDeArticulo => {
  const consultadoEn = new Date().toISOString().slice(0, 10);
  const opiniones = lecturas.filter(esOpinion).sort(porOrdenDoctrinal);
  const base = { referencia, lecturas, consultadoEn };

  if (opiniones.length === 0) {
    /*
     * NINGUNA FUENTE OPINÓ. Se enumera qué se intentó y qué contestó cada una:
     * un hueco declarado vale, uno rellenado destruye el producto.
     */
    return {
      ...base,
      estado: 'NO_VERIFICABLE',
      fuentesQueOpinaron: [],
      detalle:
        lecturas.length === 0
          ? 'No se consultó ninguna fuente oficial, así que no se sabe si el artículo sigue vigente.'
          : `Ninguna fuente oficial pudo confirmarlo. ${lecturas
              .map((l) => l.detalle)
              .join(' ')}`,
      url: lecturas.find((l) => l.url)?.url
    };
  }

  const estados = new Set(opiniones.map((l) => l.estado));
  const fuentesQueOpinaron = opiniones.map((l) => l.fuente);

  if (estados.size > 1) {
    /*
     * LA DISCREPANCIA SE DECLARA Y NO SE RESUELVE.
     *
     * Aquí estaba la tentación: quedarse con el Senado «porque es el primero de
     * la doctrina» y seguir. Sería el peor resultado posible — el abogado vería
     * un veredicto de dos fuentes que en realidad es el de una, y jamás sabría
     * que la otra decía lo contrario. Se devuelven LAS DOS versiones con SUS DOS
     * URLs y sin cuerpo: cuando no hay acuerdo no hay «el» texto del artículo, y
     * el juez de la glosa no debe juzgar sobre un texto elegido a dedo.
     */
    return {
      ...base,
      estado: 'DISCREPANCIA_ENTRE_FUENTES',
      fuentesQueOpinaron,
      detalle:
        'LAS FUENTES OFICIALES NO COINCIDEN sobre este artículo, así que esta casa NO decide cuál tiene razón. ' +
        opiniones
          .map(
            (l) =>
              `${NOMBRE_DE_FUENTE[l.fuente]} lo da por ${l.estado} — ${l.detalle} (${l.url ?? 'sin URL'})`
          )
          .join(' | ') +
        '. Ábralas las dos y decida antes de radicar.',
      url: opiniones[0].url
    };
  }

  /*
   * CONCORDANCIA, o una sola fuente. En los dos casos se DICE cuál es el caso:
   * un veredicto que no dice cuántos ojos lo miraron se lee como si lo hubieran
   * mirado todos.
   */
  /* `esOpinion` ya garantizó que solo puede ser uno de estos dos. */
  const estado = opiniones[0].estado as 'VIGENTE' | 'DEROGADO';
  const conTexto = opiniones.find((l) => l.cuerpo && l.cuerpo.length > 0) ?? opiniones[0];
  const sustento =
    opiniones.length > 1
      ? `Concordaron ${listar(fuentesQueOpinaron)}.`
      : `Solo respondió ${listar(fuentesQueOpinaron)}; las demás fuentes no lo confirmaron.`;

  return {
    ...base,
    estado,
    fuentesQueOpinaron,
    detalle: `${opiniones.map((l) => l.detalle).join(' ')} ${sustento}`,
    url: conTexto.url,
    rubrica: conTexto.rubrica,
    cuerpo: conTexto.cuerpo,
    notaDeVigencia: opiniones.find((l) => l.notaDeVigencia)?.notaDeVigencia
  };
};

/*
 * LAS FUENTES, EN PARALELO Y NO EN CADENA.
 *
 * La etapa de vigencia tiene 20 s (`agent/presupuestoDeTiempo.ts`) y ahora
 * consulta más de un sitio. En cadena, dos sitios lentos sumarían sus esperas y
 * el presupuesto se agotaría; en paralelo el costo es el del MÁS LENTO, que es
 * lo mismo que costaba antes con una sola fuente. Cada lector recibe el plazo
 * entero porque compiten contra el reloj, no entre ellos.
 */
const FUENTES: Array<
  (r: ReferenciaDeArticulo, ms: number) => Promise<LecturaDeFuente>
> = [
  (r, ms) => leerEnSenado(r, ms),
  (r, ms) => leerEnFuncionPublica(r, ms)
];

/** En el mismo orden que `FUENTES`: sirve para nombrar a la que no llegó a tiempo. */
const NOMBRES_DE_LAS_FUENTES: FuenteOficial[] = ['SENADO', 'FUNCION_PUBLICA'];

/**
 * Cuánto del plazo puede gastar UNA fuente. Ver la nota de `consultarVigencia`:
 * el resto es el margen que garantiza que la composición ocurra antes de que el
 * tope de la etapa corte, y con él se salvan las lecturas que sí llegaron.
 */
const PARTE_DEL_PLAZO_POR_FUENTE = 0.8;

const conPlazoDeFuente = (
  lectura: Promise<LecturaDeFuente>,
  ms: number,
  fuente: FuenteOficial
): Promise<LecturaDeFuente> =>
  new Promise((resolve) => {
    const reloj = setTimeout(
      () =>
        resolve({
          fuente,
          estado: 'SIN_RESPUESTA',
          detalle: `${NOMBRE_DE_FUENTE[fuente]} no contestó dentro del plazo de la comprobación.`,
          duracionMs: ms
        }),
      ms
    );
    lectura.then(
      (l) => {
        clearTimeout(reloj);
        resolve(l);
      },
      () => {
        clearTimeout(reloj);
        resolve({
          fuente,
          estado: 'SIN_RESPUESTA',
          detalle: `${NOMBRE_DE_FUENTE[fuente]} falló al consultarse.`
        });
      }
    );
  });

const cacheDeArticulos = new Map<string, EnCache<VigenciaDeArticulo>>();

/** Solo para los checks: una caché que sobrevive entre pruebas mide la prueba anterior. */
export const limpiarCacheDeVigencia = (): void => {
  cacheDeIndices.clear();
  cacheDeArticulos.clear();
  limpiarCacheDeFuncionPublica();
};

/**
 * Consulta la vigencia de UN artículo en las fuentes oficiales.
 *
 * Nunca lanza y nunca adivina. Los cuatro estados son los del molde de
 * providencias, más el que trajo la segunda fuente: lo comprobado se afirma, lo
 * desmentido se afirma, lo que no se pudo mirar se DECLARA sin mirar, y lo que
 * las fuentes cuentan distinto se DECLARA distinto.
 */
export const consultarVigencia = async (
  referencia: ReferenciaDeArticulo,
  limiteMs = 8_000
): Promise<VigenciaDeArticulo> => {
  const clave = `${referencia.codigo}|${referencia.articulo}`;
  const enCache = vivo(cacheDeArticulos.get(clave));
  if (enCache) return enCache;

  /*
   * NINGUNA FUENTE PUEDE QUEDARSE CON EL RELOJ ENTERO, y esto es un defecto
   * medido, no una precaución.
   *
   * El 10 de septiembre de 2026, con la Secretaría del Senado lenta, Función
   * Pública contestó la Ley 54 de 1990 en 999 ms y la composición se quedó
   * esperando al Senado hasta los 20 s. Arriba, el tope de
   * `verificarVigencia.ts` corta a los 19 s y devuelve NO_VERIFICABLE: el
   * escrito habría tirado a la basura una lectura oficial buena que llegó en un
   * segundo. Por eso cada fuente recibe una parte del plazo y la composición
   * ocurre SIEMPRE dentro del presupuesto, con lo que haya llegado. Una fuente
   * que no alcanzó es un silencio, y un silencio ya sabe declararse.
   */
  const plazoPorFuente = Math.max(3_000, Math.floor(limiteMs * PARTE_DEL_PLAZO_POR_FUENTE));
  const lecturas = await Promise.all(
    FUENTES.map((leer, i) =>
      conPlazoDeFuente(
        leer(referencia, plazoPorFuente),
        plazoPorFuente + 500,
        NOMBRES_DE_LAS_FUENTES[i]
      )
    )
  );
  const resultado = componerVigencia(referencia, lecturas);

  /*
   * NO_VERIFICABLE no se cachea: puede venir de una mala tarde de los sitios, y
   * guardarlo siete días convertiría un tropiezo de un minuto en una semana sin
   * comprobar. Lo mismo vale para la discrepancia, que puede ser una fuente a
   * medio actualizar y conviene volver a mirar.
   */
  if (resultado.estado === 'VIGENTE' || resultado.estado === 'DEROGADO') {
    guardar(cacheDeArticulos, clave, resultado);
  }
  return resultado;
};
