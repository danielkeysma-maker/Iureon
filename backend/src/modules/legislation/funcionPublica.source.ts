import { decodeBody } from '../ingestion/documentFetch';
import {
  NAVEGADOR,
  NOMBRE_DE_FUENTE,
  enUnaLinea,
  guardar,
  recortarCuerpo,
  textoPlano,
  vivo,
  type EnCache,
  type LecturaDeFuente,
  type ReferenciaDeArticulo
} from './fuenteOficial';

/**
 * EL GESTOR NORMATIVO DE FUNCIÓN PÚBLICA como segunda fuente de vigencia.
 *
 * ─── LAS TRES RAZONES, Y NINGUNA ES TEÓRICA ────────────────────────────────
 *
 * 1. EL SENADO YA NOS DEJÓ SIN RESPUESTA. El 10 de septiembre de 2026,
 *    verificando los fundamentos del Código Civil, la Ley 54 de 1990 no se pudo
 *    leer: cuatro intentos contra `secretariasenado.gov.co` y la ficha quedó
 *    sin cerrar. Función Pública sí la sirve —`norma.php?i=30896`, medido— y con
 *    ella el artículo 2, que es el de la presunción de sociedad patrimonial.
 *
 * 2. `basedoc` NO PUBLICA DECRETOS NI RESOLUCIONES. La tabla del Senado que este
 *    módulo acompaña sabe formar `ley_0820_2003`, pero el Decreto 2591 de 1991
 *    —la tutela— o los Decretos Únicos no viven en `basedoc`. Función Pública
 *    los tiene: `Decreto 2591 de 1991 → i=5304`, `Decreto 1069 de 2015 →
 *    i=74174`, comprobados el mismo día. Sin esta fuente, cada cita de decreto
 *    salía NO_VERIFICABLE, que es un hueco honesto pero un hueco.
 *
 * 3. UNA FUENTE OFICIAL TAMBIÉN PUEDE ESTAR DESACTUALIZADA, y la doctrina lo
 *    documenta con casos medidos en esta casa (regla 3): Función Pública sirve
 *    el artículo 159 ORIGINAL de la Ley 769 de 2002, no el que reformó el
 *    Decreto Ley 019 de 2012. Si le pasa a una, le puede pasar a la otra — y con
 *    UNA sola fuente no hay forma de enterarse. Por eso esta fuente no es un
 *    respaldo del Senado: es un segundo par de ojos cuyo desacuerdo SE DECLARA.
 *
 * ─── CÓMO SE ENCUENTRA UNA NORMA AQUÍ, Y POR QUÉ NO SE PUEDE ADIVINAR ──────
 *
 * El Senado nombra sus documentos («ley_0820_2003») y por eso la URL se puede
 * construir. Función Pública los numera por un identificador interno
 * (`norma.php?i=8738`) que no guarda relación con el número ni con el año, así
 * que hay que PREGUNTARLE. Su consulta avanzada lo hace por AJAX contra
 * `gestion/funphp/funajax.php?t=ejecuta_busqueda_avanzada2`, con el tipo de
 * documento, el número y el año; devuelve un fragmento de HTML con los
 * resultados. Medido el 10 de septiembre de 2026: 219–783 ms, y la respuesta
 * trae «Número de documentos encontrados: N» y un enlace `norma.php?i=…` por
 * resultado.
 *
 * El identificador se cachea siete días como todo lo demás: es un dato que no
 * cambia, y volver a preguntarlo por cada artículo del mismo escrito sería
 * pagar la búsqueda doce veces para oír lo mismo.
 *
 * ─── EL TÍTULO DEL RESULTADO SE COMPRUEBA, NO SE SUPONE ────────────────────
 *
 * La búsqueda por número y año puede devolver más de un resultado —«Ley 1564 de
 * 2012» trajo tres, uno de ellos una sentencia que la menciona— así que se
 * exige que el `<h5>` del resultado sea EXACTAMENTE la norma pedida. Tomar el
 * primero sería leer el texto de otra norma y llamarlo verificación, que es el
 * defecto que la doctrina llama «ruido con apariencia de texto».
 */

/*
 * ─── DE LA CLAVE CANÓNICA A LA CONSULTA DE FUNCIÓN PÚBLICA ─────────────────
 *
 * Los códigos de `tipodoc` son los del propio desplegable de la consulta
 * avanzada, copiados de su HTML el 10 de septiembre de 2026.
 */
const LEY = '18';
const DECRETO = '11';
const DECRETO_LEY = '986';
const CONSTITUCION = '8';

export interface ConsultaFP {
  tipodoc: string;
  numero: string;
  anio: string;
  /** El título exacto que el resultado debe traer. Sin esto se leería otra norma. */
  titulo: string;
}

/**
 * Los códigos que no se llaman «Ley N de A» y hay que traducir.
 *
 * EL CÓDIGO CIVIL NO ESTÁ AQUÍ, Y ES UN HALLAZGO MEDIDO, no un olvido: el
 * Gestor Normativo es el de la administración pública y NO publica la Ley 84 de
 * 1873. Se buscó por número (0 resultados) y por palabras («código civil», 21
 * resultados, ninguno el código). Ponerlo con un identificador inventado sería
 * exactamente lo que la regla 2 de la doctrina prohíbe; sin él, el Código Civil
 * lo comprueba el Senado solo, y el resultado DICE que solo respondió una.
 */
const CODIGOS: Record<string, ConsultaFP> = {
  CGP: { tipodoc: LEY, numero: '1564', anio: '2012', titulo: 'Ley 1564 de 2012' },
  CPACA: { tipodoc: LEY, numero: '1437', anio: '2011', titulo: 'Ley 1437 de 2011' },
  'CODIGO PENAL': { tipodoc: LEY, numero: '599', anio: '2000', titulo: 'Ley 599 de 2000' },
  'CODIGO DE COMERCIO': { tipodoc: DECRETO, numero: '410', anio: '1971', titulo: 'Decreto 410 de 1971' },
  'CODIGO SUSTANTIVO DEL TRABAJO': {
    tipodoc: DECRETO_LEY,
    numero: '2663',
    anio: '1950',
    titulo: 'Decreto Ley 2663 de 1950'
  },
  'CONSTITUCION POLITICA': {
    tipodoc: CONSTITUCION,
    numero: '1',
    anio: '1991',
    titulo: 'Constitución Política de 1991'
  }
};

const LEY_O_DECRETO = /^(LEY|DECRETO)\s+(\d{1,5})\s+DE\s+(\d{4})$/;

/**
 * Cómo se le pregunta a Función Pública por una clave canónica, o null cuando
 * esta casa no sabe traducirla. Null NO significa que la norma no exista:
 * significa que aquí no se puede comprobar, y así se declara.
 */
export const consultaDeFuncionPublica = (codigo: string): ConsultaFP | null => {
  const fijo = CODIGOS[codigo];
  if (fijo) return fijo;
  const m = LEY_O_DECRETO.exec(codigo);
  if (!m) return null;
  const esLey = m[1] === 'LEY';
  return {
    tipodoc: esLey ? LEY : DECRETO,
    numero: m[2],
    anio: m[3],
    titulo: `${esLey ? 'Ley' : 'Decreto'} ${Number(m[2])} de ${m[3]}`
  };
};

const BASE = 'https://www.funcionpublica.gov.co/eva/gestornormativo';

export const urlDeBusqueda = (c: ConsultaFP, tipodoc = c.tipodoc): string =>
  `${BASE}/gestion/funphp/funajax.php?t=ejecuta_busqueda_avanzada2` +
  `&tipdoc=${tipodoc}&nrodoc=${encodeURIComponent(c.numero)}&ano=${c.anio}&pagina=1`;

export const urlDeLaNorma = (id: string, articulo?: number): string =>
  `${BASE}/norma.php?i=${id}${articulo === undefined ? '' : `#${articulo}`}`;

/*
 * ─── LECTURA DEL HTML ──────────────────────────────────────────────────────
 */

/** Comparar títulos sin que una tilde o una mayúscula decidan si se lee otra norma. */
const normalizarTitulo = (t: string): string =>
  enUnaLinea(t)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * El identificador de la norma dentro del fragmento de resultados, exigiendo
 * que el título coincida. Devuelve null cuando no hay ninguno que coincida —que
 * es la respuesta correcta para «esta fuente no la tiene».
 */
export const idEnLosResultados = (html: string, titulo: string): string | null => {
  const buscado = normalizarTitulo(titulo);
  for (const m of html.matchAll(
    /href="norma\.php\?i=(\d+)"[\s\S]{0,400}?<h5[^>]*>([\s\S]*?)<\/h5>/gi
  )) {
    if (normalizarTitulo(textoPlano(m[2])) === buscado) return m[1];
  }
  return null;
};

/**
 * EL CUERPO DE LA NORMA, que en Función Pública vive en un solo div.
 *
 * Se busca `class="descripcion-contenido"` con las comillas incluidas a
 * propósito: la misma cadena aparece antes, suelta, dentro de un comentario del
 * JavaScript que cambia el tamaño de la fuente, y cortar ahí metería el script
 * entero en el texto de la norma.
 */
export const contenidoDeLaNorma = (html: string): string | null => {
  const i = html.indexOf('class="descripcion-contenido"');
  return i < 0 ? null : html.slice(i);
};

/*
 * ─── DÓNDE EMPIEZA UN ARTÍCULO EN FUNCIÓN PÚBLICA ──────────────────────────
 *
 * Aquí no hay anclas fiables. La Ley 54 de 1990 las trae (`<a id="2">`), la Ley
 * 820 de 2003 no trae ninguna, y ambas se sirven desde el mismo sistema. Lo que
 * SÍ es constante es la forma del encabezado: abre bloque, viene «Artículo», el
 * número, y un punto.
 *
 * DOS PRECAUCIONES, Y LAS DOS SALIERON DE UNA LECTURA EQUIVOCADA MEDIDA:
 *
 *   · EXIGIR QUE ABRA BLOQUE. Sin `<p …>` delante, la expresión encontraba
 *     «artículo 14 de la Ley 1033 de 2006» EN MEDIO de un párrafo de la Ley 909
 *     de 2004 y lo tomaba por el encabezado del artículo 14. El bloque del
 *     artículo verdadero quedaba partido y el texto leído era el de otro.
 *   · EXCLUIR LA NUMERACIÓN COMPUESTA. Los Decretos Únicos numeran «ARTÍCULO
 *     2.2.21.1.4», y sin el `(?!\s*\.\s*\d)` el lector daba ese bloque por el
 *     «artículo 2» del Decreto 1083 de 2015. Habría servido un texto ajeno con
 *     cara de dato duro. Con la exclusión, un decreto de numeración compuesta
 *     no ofrece artículos enteros y la lectura sale SIN_ARTICULO, que es la
 *     verdad: esta casa todavía no sabe citar «2.2.4.4.2.4».
 */
const ABRE_BLOQUE = '<(?:p|div|li|td|h[1-6])\\b[^>]*>';
const ADORNO =
  '(?:<(?:strong|b|em|i|span|u|font|a)\\b[^>]*>|</(?:strong|b|em|i|span|u|font|a)>|&nbsp;|\\s)*';
const FIN_DE_NUMERO = '(?!\\s*\\.\\s*\\d)';
const CIERRE = '[º°o]?\\s*[.,:\\-]';

const cabezaDeArticulo = (articulo: number): RegExp =>
  new RegExp(
    `${ABRE_BLOQUE}${ADORNO}ART[IÍ]CULO${ADORNO}${articulo}${FIN_DE_NUMERO}${ADORNO}${CIERRE}`,
    'i'
  );

const CUALQUIER_CABEZA = new RegExp(
  `${ABRE_BLOQUE}${ADORNO}ART[IÍ]CULO${ADORNO}(\\d{1,4})${FIN_DE_NUMERO}${ADORNO}${CIERRE}`,
  'gi'
);

/** Ningún artículo real ocupa esto; el tope evita arrastrar media norma si falta el siguiente. */
const MAX_BLOQUE = 40_000;

/**
 * El trozo de HTML que va desde el encabezado del artículo hasta el siguiente
 * encabezado. Igual que en el Senado, quedarse con más arrastraría el artículo
 * de al lado y con él su marcador de derogación — una acusación falsa con
 * apariencia de dato duro.
 */
export const bloqueDelArticuloFP = (contenido: string, articulo: number): string | null => {
  const m = cabezaDeArticulo(articulo).exec(contenido);
  if (!m) return null;
  const desde = m.index;
  CUALQUIER_CABEZA.lastIndex = desde + m[0].length;
  const siguiente = CUALQUIER_CABEZA.exec(contenido);
  const hasta = siguiente ? siguiente.index : Math.min(contenido.length, desde + MAX_BLOQUE);
  return contenido.slice(desde, hasta);
};

/**
 * El epígrafe: «Artículo 8º. Obligaciones del arrendador». Función Pública lo
 * pone entre el número y el texto, en negrita o cursiva, y no siempre lo pone:
 * cuando lo que sigue al número es ya el cuerpo, se devuelve vacío en vez de
 * cortar la primera frase del artículo y llamarla título.
 */
const MAX_RUBRICA = 120;

export const rubricaFP = (bloque: string): string | undefined => {
  const plano = textoPlano(bloque);
  const m = /^art[íi]culo\s*[\d.]+\s*[º°o]?\s*[.,:\-]\s*/i.exec(plano);
  if (!m) return undefined;
  const resto = plano.slice(m[0].length);
  const punto = resto.search(/[.:]/);
  if (punto < 0 || punto > MAX_RUBRICA) return undefined;
  const titulo = resto.slice(0, punto).trim();
  /* Un «título» de doce palabras ya es el cuerpo del artículo, no su epígrafe. */
  return titulo.length > 0 && titulo.split(/\s+/).length <= 12 ? titulo : undefined;
};

export const cuerpoFP = (bloque: string): string => recortarCuerpo(textoPlano(bloque));

/*
 * ─── CUÁNDO FUNCIÓN PÚBLICA DICE QUE UN ARTÍCULO ESTÁ MUERTO ───────────────
 *
 * El Senado lo escribe en un corchete angular al principio del artículo. Función
 * Pública lo escribe en prosa, entre paréntesis y casi siempre enlazado a la
 * norma derogatoria. Ejemplo real, medido en `norma.php?i=41249` (Ley 1437 de
 * 2011, CPACA):
 *
 *     «ARTÍCULO 226. Impugnación de las decisiones sobre intervención de
 *      terceros. (Derogado por el Art. 87 de la Ley 2080 de 2021)»
 *
 * TRES CAUTELAS, LAS TRES CONTRA UNA FALSA ALARMA:
 *
 *   · SOLO AL PRINCIPIO DEL BLOQUE. En la Ley 909 de 2004 hay un «(Derogado por
 *     el art. 14, Ley 1033 de 2006)» a mitad de artículo que habla de un inciso
 *     y de un parágrafo. Leer el bloque entero mataría el artículo completo.
 *   · NO SI HABLA DE UN PEDAZO. «Inciso derogado», «Parágrafo derogado»,
 *     «Literal derogado», «Expresión … derogada»: el artículo sigue en el
 *     ordenamiento y marcarlo muerto sería la falsa alarma que enseña a ignorar
 *     todos los avisos. Sale VIGENTE con la nota en el detalle.
 *   · NO SI ES EL ARTÍCULO QUE DEROGA. «Deróguense las siguientes
 *     disposiciones» (CGP art. 626) o «Derogatoria integral» (Decreto 1083, art.
 *     3.1.1) son artículos VIVOS cuyo oficio es matar a otros.
 *
 * Y SUBROGAR NO ES MATAR: «Modificado por el art. 1, Ley 979 de 2005» encabeza
 * el artículo 2 de la Ley 54 de 1990, que está perfectamente vigente. Solo
 * cuenta «derogado», nunca «modificado», «subrogado» ni «adicionado».
 */
const VENTANA_MORTAL = 260;

const MUERTO_FP =
  /(?:^|[([{.;:·—–-]\s*)(?:este\s+)?(?:art[íi]culo\s+)?derogad[oa]s?\b/i;

const HABLA_DE_UN_PEDAZO =
  /\b(inciso|incisos|par[áa]grafo|par[áa]grafos|literal|literales|numeral|numerales|aparte|apartes|expresi[óo]n|expresiones|frase|palabra|palabras|t[ée]rmino|t[ée]rminos)\b/i;

const ES_EL_QUE_DEROGA = /\b(der[óo]guen?se|derogatoria|quedan\s+derogad|se\s+derogan)\b/i;

export const estadoFP = (
  bloque: string
): { estado: 'VIGENTE' | 'DEROGADO'; marcador?: string } => {
  const plano = textoPlano(bloque);
  const ventana = plano.slice(0, VENTANA_MORTAL);
  const m = MUERTO_FP.exec(ventana);
  if (!m) return { estado: 'VIGENTE' };

  const antes = ventana.slice(Math.max(0, m.index - 70), m.index + m[0].length);
  if (HABLA_DE_UN_PEDAZO.test(antes) || ES_EL_QUE_DEROGA.test(ventana)) {
    return { estado: 'VIGENTE', marcador: enUnaLinea(ventana.slice(m.index, m.index + 200)) };
  }
  return { estado: 'DEROGADO', marcador: enUnaLinea(ventana.slice(m.index, m.index + 200)) };
};

/*
 * ─── LA RED Y LA CACHÉ ─────────────────────────────────────────────────────
 */

const descargar = async (url: string, limiteMs: number): Promise<string | null> => {
  try {
    const respuesta = await fetch(url, {
      headers: { 'User-Agent': NAVEGADOR, Accept: 'text/html,application/xhtml+xml,*/*' },
      signal: AbortSignal.timeout(Math.max(1_500, limiteMs))
    });
    if (!respuesta.ok) return null;
    const buffer = Buffer.from(await respuesta.arrayBuffer());
    return decodeBody(buffer, respuesta.headers.get('content-type') ?? '');
  } catch {
    /* «No se pudo leer» sube como SIN_RESPUESTA, nunca como excepción. */
    return null;
  }
};

/** El identificador interno de cada norma; y `''` cuando la fuente no la tiene. */
const cacheDeIds = new Map<string, EnCache<string>>();
/** El contenido ya recortado de cada norma. Lo que ahorra son doce descargas de 1–2 MB. */
const cacheDeContenidos = new Map<string, EnCache<string>>();

export const limpiarCacheDeFuncionPublica = (): void => {
  cacheDeIds.clear();
  cacheDeContenidos.clear();
};

const sinRespuesta = (detalle: string, url?: string): LecturaDeFuente => ({
  fuente: 'FUNCION_PUBLICA',
  estado: 'SIN_RESPUESTA',
  detalle,
  url
});

/**
 * Lo que Función Pública dice de UN artículo. Nunca lanza y nunca adivina.
 *
 * `descargarPagina` está inyectado para que la guarda determinista pueda correr
 * el lector ENTERO —búsqueda, contenido, bloque, estado— sobre HTML verbatim
 * del sitio sin salir a la red. Un lector que solo se prueba por partes deja sin
 * probar justo el pegamento, que es donde estuvo el defecto del «artículo 14 de
 * la Ley 1033».
 */
export const leerEnFuncionPublica = async (
  referencia: ReferenciaDeArticulo,
  limiteMs = 8_000,
  descargarPagina: (url: string, ms: number) => Promise<string | null> = descargar
): Promise<LecturaDeFuente> => {
  const inicio = Date.now();
  const restante = (): number => Math.max(0, limiteMs - (Date.now() - inicio));
  const con = (l: LecturaDeFuente): LecturaDeFuente => ({ ...l, duracionMs: Date.now() - inicio });

  const consulta = consultaDeFuncionPublica(referencia.codigo);
  if (!consulta) {
    return con({
      fuente: 'FUNCION_PUBLICA',
      estado: 'SIN_ARTICULO',
      detalle: `${NOMBRE_DE_FUENTE.FUNCION_PUBLICA} no sabe buscar «${referencia.codigo}»: esta casa no tiene cómo traducir esa clave a su consulta.`
    });
  }

  let id = vivo(cacheDeIds.get(consulta.titulo));
  if (id === null) {
    /*
     * Un decreto puede estar catalogado como «Decreto» o como «Decreto Ley», y
     * el buscador no los mezcla. Se prueban los dos antes de decir que no está.
     */
    const tipos = consulta.tipodoc === DECRETO ? [DECRETO, DECRETO_LEY] : [consulta.tipodoc];
    for (const tipo of tipos) {
      const html = await descargarPagina(urlDeBusqueda(consulta, tipo), Math.min(restante(), 6_000));
      if (html === null) {
        return con(
          sinRespuesta(
            `${NOMBRE_DE_FUENTE.FUNCION_PUBLICA} no respondió a la búsqueda de «${consulta.titulo}».`,
            urlDeBusqueda(consulta, tipo)
          )
        );
      }
      const hallado =
        idEnLosResultados(html, consulta.titulo) ??
        (tipo === DECRETO_LEY
          ? idEnLosResultados(html, consulta.titulo.replace('Decreto ', 'Decreto Ley '))
          : null);
      if (hallado) {
        id = hallado;
        break;
      }
    }
    /* La cadena vacía es «preguntamos y no la tiene», y también se cachea. */
    id = guardar(cacheDeIds, consulta.titulo, id ?? '');
  }

  if (id === '') {
    return con({
      fuente: 'FUNCION_PUBLICA',
      estado: 'SIN_ARTICULO',
      detalle: `${NOMBRE_DE_FUENTE.FUNCION_PUBLICA} no publica «${consulta.titulo}».`,
      url: urlDeBusqueda(consulta)
    });
  }

  const url = urlDeLaNorma(id, referencia.articulo);

  let contenido = vivo(cacheDeContenidos.get(id));
  if (contenido === null) {
    const html = await descargarPagina(urlDeLaNorma(id), restante());
    if (html === null) {
      return con(sinRespuesta(`${NOMBRE_DE_FUENTE.FUNCION_PUBLICA} no respondió.`, url));
    }
    const cuerpo = contenidoDeLaNorma(html);
    if (!cuerpo) {
      return con(
        sinRespuesta(
          `${NOMBRE_DE_FUENTE.FUNCION_PUBLICA} devolvió la página de «${consulta.titulo}» sin el texto de la norma.`,
          url
        )
      );
    }
    contenido = guardar(cacheDeContenidos, id, cuerpo);
  }

  const bloque = bloqueDelArticuloFP(contenido, referencia.articulo);
  if (!bloque) {
    /*
     * NO ES UNA OPINIÓN, y confundirlo con una fabricaría discrepancias: el
     * Decreto 1069 de 2015 no tiene «artículo 1» porque numera 2.2.4.4.2.4, y
     * eso no contradice a nadie sobre la vigencia de nada.
     */
    return con({
      fuente: 'FUNCION_PUBLICA',
      estado: 'SIN_ARTICULO',
      detalle: `La copia de «${consulta.titulo}» de ${NOMBRE_DE_FUENTE.FUNCION_PUBLICA} no trae el artículo ${referencia.articulo}.`,
      url
    });
  }

  const { estado, marcador } = estadoFP(bloque);
  return con({
    fuente: 'FUNCION_PUBLICA',
    estado,
    detalle:
      estado === 'DEROGADO'
        ? `${NOMBRE_DE_FUENTE.FUNCION_PUBLICA} lo marca derogado: «${marcador}».`
        : marcador
          ? `${NOMBRE_DE_FUENTE.FUNCION_PUBLICA} lo publica sin derogar el artículo entero. Nota: «${marcador}».`
          : `${NOMBRE_DE_FUENTE.FUNCION_PUBLICA} lo publica sin marca de derogación.`,
    url,
    rubrica: rubricaFP(bloque),
    cuerpo: cuerpoFP(bloque)
  });
};
