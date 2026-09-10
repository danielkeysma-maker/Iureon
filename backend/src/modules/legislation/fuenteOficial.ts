/**
 * LO QUE COMPARTEN LAS FUENTES OFICIALES: los tipos, el recorte del cuerpo y
 * las cuatro funciones de lectura de HTML que ninguna de ellas puede no tener.
 *
 * ─── POR QUÉ ESTE ARCHIVO EXISTE ────────────────────────────────────────────
 *
 * Hasta el 10 de septiembre de 2026 la vigencia se consultaba en UNA fuente, la
 * Secretaría del Senado, y por eso el tipo del resultado y el lector del HTML
 * vivían juntos en `officialArticle.service.ts`. Con tres fuentes admisibles
 * —`research/VERIFICATION-DOCTRINE.md`, regla 1— el tipo tiene que hablar de
 * LECTURAS en plural, porque el resultado ya no es lo que dijo un sitio sino lo
 * que dijeron varios y si coincidieron.
 *
 * ─── LA DIFERENCIA ENTRE «NO CONTESTÓ» Y «NO LO TIENE», QUE ESTÁ MEDIDA ─────
 *
 * Hay ausencias reales. El Gestor Normativo de Función Pública NO publica el
 * Código Civil: se buscó por número (Ley 84 de 1873, 0 resultados) y por
 * palabras («código civil», 21 resultados, ninguno el código). Y los Decretos
 * Únicos numeran «ARTÍCULO 2.2.21.1.4», así que un artículo entero como el 1 no
 * existe allí — el Decreto 1069 de 2015 se descargó entero, 2.054.598 bytes, y
 * se contaron sus encabezados.
 *
 * Si esas ausencias se leyeran como «esta fuente dice que no existe»
 * producirían DISCREPANCIAS falsas contra el Senado, y el abogado vería un
 * conflicto donde solo hay una copia que no llega. Por eso una lectura tiene
 * CUATRO estados y no dos: solo VIGENTE y DEROGADO son OPINIONES sobre el
 * artículo; SIN_ARTICULO y SIN_RESPUESTA son silencios, y un silencio no
 * contradice a nadie.
 *
 * ─── Y ANTES DE AFIRMAR UNA AUSENCIA, CUÉNTALA (doctrina, regla 3) ─────────
 *
 * En la primera pasada de este trabajo se dio por hecho que la copia de la Ley
 * 820 de 2003 de Función Pública «salta del artículo 34 al 40». ERA FALSO: lo
 * que saltaba era un lector con la expresión regular floja. Con el encabezado
 * bien leído aparece el artículo 35 entero —«Medidas cautelares en procesos de
 * restitución de tenencia. Derogado por el literal c), art. 626, Ley 1564 de
 * 2012»—, que es exactamente lo que dice el Senado. La doctrina lo tenía
 * escrito: «la fuente está truncada suele ser tu lector, no la fuente».
 */

/** Un artículo, en la misma forma que usa el cedazo (`agent/citacionNormativa.ts`). */
export interface ReferenciaDeArticulo {
  codigo: string;
  articulo: number;
}

/**
 * Las fuentes que la doctrina admite para el texto de una norma, en su orden.
 * `research/VERIFICATION-DOCTRINE.md`, regla 1. No se agrega ninguna sin
 * abrirla también allí: el día que las dos listas dejaron de coincidir, cuatro
 * fichas se declararon sin verificar teniendo el texto leído.
 */
export type FuenteOficial = 'SENADO' | 'FUNCION_PUBLICA' | 'SUIN';

/** Cómo se nombra una fuente cuando se le habla al abogado. */
export const NOMBRE_DE_FUENTE: Record<FuenteOficial, string> = {
  SENADO: 'la Secretaría del Senado',
  FUNCION_PUBLICA: 'el Gestor Normativo de Función Pública',
  SUIN: 'el SUIN-Juriscol del Ministerio de Justicia'
};

/**
 * Lo que UNA fuente dice de UN artículo.
 *
 * VIGENTE y DEROGADO son opiniones y se comparan entre sí. SIN_ARTICULO («esta
 * fuente no publica ese artículo») y SIN_RESPUESTA («no contestó») son
 * silencios: viajan en el resultado para que se lea qué se intentó, pero no
 * votan.
 */
export type EstadoDeLectura = 'VIGENTE' | 'DEROGADO' | 'SIN_ARTICULO' | 'SIN_RESPUESTA';

export interface LecturaDeFuente {
  fuente: FuenteOficial;
  estado: EstadoDeLectura;
  /** Qué dijo la fuente, o por qué no dijo nada. Una frase que el abogado pueda leer. */
  detalle: string;
  /** La página oficial exacta, para abrirla y comprobar a mano. */
  url?: string;
  /** El epígrafe del artículo tal como lo publica esta fuente. */
  rubrica?: string;
  /** El texto del artículo según esta fuente, acotado por `MAX_CUERPO`. */
  cuerpo?: string;
  /** Notas de vigencia halladas fuera del cuerpo (el JS hermano del Senado). */
  notaDeVigencia?: string;
  /** Cuánto tardó la consulta. Se mide porque el presupuesto de la etapa es real. */
  duracionMs?: number;
}

/** Las dos lecturas que SÍ son una opinión sobre el artículo. */
export const esOpinion = (l: LecturaDeFuente): boolean =>
  l.estado === 'VIGENTE' || l.estado === 'DEROGADO';

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

export const recortarCuerpo = (plano: string): string =>
  plano.length <= MAX_CUERPO
    ? plano
    : `${plano.slice(0, MAX_CUERPO)} […texto oficial recortado en ${MAX_CUERPO} caracteres; el artículo sigue más allá de este punto…]`;

/**
 * Las entidades que aparecen de verdad en estas páginas. No es un decodificador
 * general de HTML a propósito: `&lt;` y `&gt;` SON el marcador de derogación del
 * Senado, y cambiar una tabla que se lee de un vistazo por un paquete que nadie
 * audita no mejora nada aquí.
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

export const sinEtiquetas = (html: string): string => html.replace(/<[^>]*>/g, ' ');

export const enUnaLinea = (texto: string): string => texto.replace(/\s+/g, ' ').trim();

/** El texto plano de un trozo de HTML, que es lo que se le enseña al abogado. */
export const textoPlano = (html: string): string =>
  enUnaLinea(decodificarEntidades(sinEtiquetas(html)));

/*
 * ─── LA RED ────────────────────────────────────────────────────────────────
 */

/** Se identifica como navegador: varios sitios públicos del país rechazan al que no lo hace. */
export const NAVEGADOR =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/**
 * La vigencia de un artículo no cambia de un día para otro: entre la derogación
 * y su publicación hay un trámite legislativo entero. Consultar tres sitios
 * públicos en cada borrador sería lento para el abogado y descortés con ellos.
 * Siete días es más corto que cualquier tránsito normativo y más largo que
 * cualquier ráfaga de borradores.
 */
export const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

export interface EnCache<T> {
  valor: T;
  expira: number;
}

export const vivo = <T>(entrada: EnCache<T> | undefined): T | null =>
  entrada && entrada.expira > Date.now() ? entrada.valor : null;

export const guardar = <T>(mapa: Map<string, EnCache<T>>, clave: string, valor: T): T => {
  mapa.set(clave, { valor, expira: Date.now() + SIETE_DIAS_MS });
  return valor;
};
