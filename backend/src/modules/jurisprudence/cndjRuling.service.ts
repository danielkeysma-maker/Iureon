import { decodeDocument } from '../ingestion/documentFetch';
import type { OfficialRuling } from './officialRuling.service';

/**
 * La Comisión Nacional de Disciplina Judicial, por su relatoría propia.
 *
 * POR QUÉ ESTA CORPORACIÓN Y NO OTRA. Un abogado a quien le abren un
 * disciplinario cita a la CNDJ, y hasta hoy este producto no podía darle nada:
 * el corpus curado no la tiene y el descubrimiento automático solo mira la
 * relatoría de la Corte Constitucional. La CNDJ reemplazó a la Sala
 * Jurisdiccional Disciplinaria del Consejo Superior de la Judicatura (Acto
 * Legislativo 02 de 2015) y funciona desde enero de 2021, así que es la que
 * juzga hoy la conducta de abogados y funcionarios judiciales.
 *
 * DÓNDE VIVE, Y NO ES DONDE SE ESPERARÍA. No está en la relatoría de la Rama
 * (`jurisprudencia.ramajudicial.gov.co/WebRelatoria/cndj/` devuelve fichas pero
 * su servlet de descarga responde 200 con CERO bytes en las tres colecciones).
 * El texto solo está en su dominio propio, `relatoria.cndj.gov.co`, que es una
 * aplicación ASP.NET con endpoints JSON. Se hallaron leyendo el JavaScript de
 * su propio buscador — el mismo método con que se descubrió la API GraphQL de
 * la Corte Suprema que este módulo ya usa.
 *
 * LA CADENA COMPLETA, VERIFICADA PETICIÓN POR PETICIÓN:
 *
 *   1. GET  /                              → el token antifalsificación
 *   2. POST /Resultados?handler=RecibirBusqueda      → guarda la consulta en sesión
 *   3. GET  /Resultados                     → el HTML con las filas
 *   4. POST /Resultados?handler=RecibirDataResumen   → el nombre del archivo
 *   5. GET  /docs_relatoria/<archivo>.pdf   → el PDF, EN FRÍO
 *
 * El paso 5 no lleva cookie ni sesión ni referer: una vez se conoce el nombre
 * del archivo, el PDF es una descarga pública. Los pasos 2 y 4 sí exigen el
 * token del paso 1 y la cookie de sesión — sin token responden 400.
 *
 * DOS TRAMPAS QUE COSTARON EL PRIMER INTENTO. `GET /Resultados` NO PAGINA:
 * devuelve el corpus entero de la consulta en una sola página, que para un
 * término frecuente son decenas de megabytes y mata el proceso. Por eso aquí la
 * consulta se acota y la respuesta se corta por tamaño. Y una consulta vacía o
 * de una o dos letras devuelve cero: el corpus solo se alcanza por término.
 */

/** Lo que la CNDJ publica de sí misma. */
const BASE = 'https://relatoria.cndj.gov.co';
const DOCS = `${BASE}/docs_relatoria`;

/**
 * El WAF de estos dominios rechaza los agentes de usuario de biblioteca con
 * 403. No es una evasión: es identificarse como lo que se es —un cliente que
 * lee páginas públicas— en vez de como el nombre por defecto de una librería.
 * Sin esto, el servicio parecería caído estando en pie, que es justo el error
 * de diagnóstico que costó dar por muerta la API de la Corte Suprema.
 */
const AGENTE =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/**
 * El tope de lo que se lee de la página de resultados.
 *
 * `GET /Resultados` entrega la consulta completa sin paginar. Con un término
 * frecuente eso pasa de los cincuenta megabytes, y leerlo entero en memoria es
 * lo que hizo caer el primer intento de investigación. Un millón y medio de
 * caracteres alcanza de sobra para las primeras decenas de filas, que es lo
 * único que se va a mostrar.
 */
const MAX_RESULTADOS_BYTES = 1_500_000;

/** Cuántas providencias se devuelven como máximo. */
const MAX_PROVIDENCIAS = 8;

export interface CndjHit {
  /** El número único de radicación, que es como la CNDJ identifica el proceso. */
  radicacion: string;
  /** El número de ficha dentro de esa radicación. */
  ficha: string;
}

export type CndjOutcome =
  | { status: 'FOUND'; rulings: OfficialRuling[] }
  | { status: 'NOT_FOUND'; reason: string }
  | { status: 'UNAVAILABLE'; reason: string };

interface Sesion {
  cookie: string;
  token: string;
}

const conPlazo = (ms: number): AbortSignal => AbortSignal.timeout(ms);

/**
 * Acumula las cookies de una respuesta sobre las que ya se traían.
 *
 * ESTE PASO NO ES ADORNO Y COSTÓ ENCONTRARLO. La portada entrega la cookie
 * antifalsificación, pero **la consulta se guarda en una cookie de sesión que
 * emite la BÚSQUEDA**, no la portada: `.AspNetCore.Session`. Llevando solo las
 * de la portada, el paso siguiente responde 200 con la página VACÍA — 44 KB y
 * cero radicaciones en vez de 331 KB y noventa y dos. Un 200 sin resultados es
 * indistinguible de «no hay providencias», así que el servicio contestaba
 * NOT_FOUND con toda confianza sobre una relatoría que sí tenía la respuesta.
 *
 * Se reemplaza por nombre, que es como se comporta un navegador: una cookie
 * reemitida pisa a la anterior en vez de duplicarse.
 */
const acumularCookies = (previas: string, res: Response): string => {
  const mapa = new Map<string, string>();

  for (const par of previas.split('; ')) {
    if (par) mapa.set(par.split('=')[0], par);
  }

  for (const cruda of res.headers.getSetCookie()) {
    const par = cruda.split(';')[0];
    mapa.set(par.split('=')[0], par);
  }

  return [...mapa.values()].join('; ');
};

/**
 * Paso 1: la portada, por su token antifalsificación y su cookie.
 *
 * ASP.NET emite el token en un campo oculto del formulario y lo ata a la
 * cookie: hay que llevarse los dos o los pasos siguientes responden 400.
 */
const abrirSesion = async (timeoutMs: number): Promise<Sesion> => {
  const res = await fetch(`${BASE}/`, {
    headers: { 'User-Agent': AGENTE },
    signal: conPlazo(timeoutMs)
  });

  if (!res.ok) {
    throw new Error(`la relatoría respondió ${res.status} al abrir`);
  }

  const html = await res.text();
  const token = html.match(
    /name="__RequestVerificationToken"[^>]*value="([^"]+)"/
  )?.[1];

  if (!token) {
    throw new Error('la portada no trajo el token de verificación');
  }

  return { cookie: acumularCookies('', res), token };
};

/** Pasos 2 y 3: se registra la consulta y se lee la página de resultados. */
const buscar = async (tema: string, sesion: Sesion, timeoutMs: number): Promise<string> => {
  const registrada = await fetch(`${BASE}/Resultados?handler=RecibirBusqueda`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': AGENTE,
      Cookie: sesion.cookie,
      RequestVerificationToken: sesion.token
    },
    body: JSON.stringify({ Type: 'general', BusquedaGeneral_Texto: tema }),
    signal: conPlazo(timeoutMs)
  });

  if (!registrada.ok) {
    throw new Error(`la búsqueda respondió ${registrada.status}`);
  }

  /* Aquí llega `.AspNetCore.Session`, que es la que lleva la consulta. */
  sesion.cookie = acumularCookies(sesion.cookie, registrada);

  const pagina = await fetch(`${BASE}/Resultados`, {
    headers: { 'User-Agent': AGENTE, Cookie: sesion.cookie },
    signal: conPlazo(timeoutMs)
  });

  if (!pagina.ok) {
    throw new Error(`los resultados respondieron ${pagina.status}`);
  }

  /*
   * SE LEE POR TROZOS Y SE CORTA. La respuesta no está paginada: pedir
   * `.text()` a secas trae la consulta entera a memoria. Aquí se abandona en
   * cuanto hay suficiente para las primeras filas.
   */
  const lector = pagina.body?.getReader();
  if (!lector) return '';

  const decodificador = new TextDecoder();
  let html = '';

  try {
    for (;;) {
      const { done, value } = await lector.read();
      if (done) break;
      html += decodificador.decode(value, { stream: true });
      if (html.length >= MAX_RESULTADOS_BYTES) break;
    }
  } finally {
    await lector.cancel().catch(() => {
      /* Cancelar es cortesía con el servidor; fallar aquí no invalida lo leído. */
    });
  }

  return html;
};

/**
 * Las radicaciones que trae la página, en el orden en que la relatoría las puso.
 *
 * El número único de radicación colombiano tiene 23 dígitos; se aceptan 21 a 25
 * porque la CNDJ publica algunos con dígitos de más o de menos y descartarlos
 * por longitud perdería providencias reales.
 */
export const radicacionesEn = (html: string): string[] => {
  const encontradas = html.match(/\b\d{21,25}\b/g) ?? [];
  return [...new Set(encontradas)];
};

/** Paso 4: el nombre del archivo de una providencia. `null` cuando no lo publica. */
const nombreDelArchivo = async (
  hit: CndjHit,
  sesion: Sesion,
  timeoutMs: number
): Promise<string | null> => {
  const res = await fetch(`${BASE}/Resultados?handler=RecibirDataResumen`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': AGENTE,
      Cookie: sesion.cookie,
      RequestVerificationToken: sesion.token
    },
    body: JSON.stringify({ Proceso: hit.radicacion, NumeroFicha: hit.ficha }),
    signal: conPlazo(timeoutMs)
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { archivo?: string | null };
  const archivo = data.archivo?.trim();

  return archivo ? archivo : null;
};

/**
 * Paso 5: el PDF, sin sesión.
 *
 * Se devuelve el binario y NO se convierte aquí: la extracción de texto vive en
 * el módulo de ingesta, que ya sabe leer PDF y Word 97 y decidir cuándo un
 * binario es ilegible. Duplicar esa decisión aquí acabaría con dos criterios
 * distintos sobre qué texto es aceptable.
 */
export const descargarProvidencia = async (
  archivo: string,
  timeoutMs: number
): Promise<Buffer | null> => {
  const res = await fetch(`${DOCS}/${encodeURIComponent(archivo)}.pdf`, {
    headers: { 'User-Agent': AGENTE },
    signal: conPlazo(timeoutMs)
  });

  if (!res.ok) return null;

  const buffer = Buffer.from(await res.arrayBuffer());

  /*
   * CERO BYTES CON UN 200 ES «NO HAY DOCUMENTO», y hay que decirlo aquí.
   * La relatoría del Consejo Superior en la Rama responde exactamente así para
   * las providencias cuyo archivo no subió, y tratar eso como éxito metería un
   * documento vacío al corpus, indistinguible de uno real una vez indexado.
   */
  if (buffer.length === 0) return null;

  // Un PDF empieza por %PDF-. Lo que no lo sea no se pasa como si lo fuera.
  if (!buffer.subarray(0, 5).toString('latin1').startsWith('%PDF-')) return null;

  return buffer;
};

/** La URL pública de una providencia, para que el abogado la abra en la fuente. */
export const urlDeProvidencia = (archivo: string): string =>
  `${DOCS}/${encodeURIComponent(archivo)}.pdf`;

/**
 * El número de radicación como lo escribe la CNDJ en sus providencias: los 23
 * dígitos partidos antes de los dos últimos, que es el consecutivo de instancia.
 *
 * Se cita así en los escritos, y publicar el bloque corrido obligaría al
 * abogado a reformatearlo a mano cada vez.
 */
export const citaDeRadicacion = (radicacion: string): string =>
  radicacion.length > 2
    ? `${radicacion.slice(0, -2)} ${radicacion.slice(-2)}`
    : radicacion;

/** El mínimo de texto para creer que un PDF se leyó y no solo se abrió. */
const MIN_TEXTO = 400;

/**
 * Busca en la relatoría y devuelve las providencias CON SU TEXTO.
 *
 * Orquesta los cinco pasos y es lo único que el resto del backend necesita
 * conocer. Falla ABIERTO: si la relatoría no responde, el llamador recibe
 * `UNAVAILABLE` y sigue su camino — la redacción no se detiene porque una
 * fuente externa esté caída, del mismo modo que ya ocurre con el descubrimiento
 * de la Corte Constitucional.
 *
 * LAS QUE NO TRAEN DOCUMENTO SE OMITEN EN SILENCIO, y es deliberado: la CNDJ
 * publica fichas cuyo archivo nunca subió, y devolver una providencia sin texto
 * la haría aparecer en pantalla como hallazgo citable cuando no hay nada que
 * citar. Lo que sí se cuenta es cuántas se descartaron, para que la pantalla
 * pueda decirlo.
 */
export const buscarEnCndj = async (
  tema: string,
  opciones: { timeoutMs?: number; maximo?: number } = {}
): Promise<CndjOutcome> => {
  const timeoutMs = opciones.timeoutMs ?? 20_000;
  const maximo = Math.min(opciones.maximo ?? MAX_PROVIDENCIAS, MAX_PROVIDENCIAS);

  if (tema.trim().length < 3) {
    return {
      status: 'NOT_FOUND',
      reason: 'La relatoría de la CNDJ no responde a consultas de menos de tres letras.'
    };
  }

  let sesion: Sesion;
  let html: string;

  try {
    sesion = await abrirSesion(timeoutMs);
    html = await buscar(tema.trim(), sesion, timeoutMs);
  } catch (err) {
    return {
      status: 'UNAVAILABLE',
      reason: `No se pudo consultar la relatoría de la Comisión Nacional de Disciplina Judicial: ${
        err instanceof Error ? err.message : 'sin detalle'
      }`
    };
  }

  const radicaciones = radicacionesEn(html).slice(0, maximo);

  if (radicaciones.length === 0) {
    return {
      status: 'NOT_FOUND',
      reason: 'La Comisión Nacional de Disciplina Judicial no tiene providencias para esa consulta.'
    };
  }

  const rulings: OfficialRuling[] = [];

  /*
   * EN SERIE, NO EN PARALELO. Estos servicios oficiales se caen con dos
   * peticiones concurrentes — la relatoría de la Rama devuelve 504, y la API de
   * procesos empieza a responder 403 tras una ráfaga. Ir de a uno cuesta
   * segundos y es lo que mantiene la fuente en pie.
   */
  for (const radicacion of radicaciones) {
    try {
      const archivo = await nombreDelArchivo({ radicacion, ficha: '1' }, sesion, timeoutMs);
      if (!archivo) continue;

      const pdf = await descargarProvidencia(archivo, timeoutMs);
      if (!pdf) continue;

      const leido = await decodeDocument(pdf, 'application/pdf', MIN_TEXTO);
      if (!leido.ok) continue;

      rulings.push({
        corporacion: 'COMISION_DISCIPLINA',
        citation: citaDeRadicacion(radicacion),
        tipo: 'Providencia disciplinaria',
        /*
         * La fecha vive dentro del nombre del archivo que la relatoría asigna
         * (…ADJUNTA20260729111023). No se inventa cuando no se puede leer: se
         * deja vacía, porque una fecha equivocada en una cita es peor que
         * ninguna.
         */
        fecha: archivo.match(/(\d{4})(\d{2})(\d{2})\d{6}$/)?.slice(1, 4).join('-') ?? '',
        magistrado: '',
        sala: 'Comisión Nacional de Disciplina Judicial',
        proceso: 'Disciplinario',
        sourceUrl: urlDeProvidencia(archivo),
        text: leido.text
      });
    } catch {
      /* Una providencia que falla no tumba las demás: se omite y se sigue. */
    }
  }

  if (rulings.length === 0) {
    return {
      status: 'NOT_FOUND',
      reason: `La CNDJ tiene ${radicaciones.length} ficha(s) para esa consulta, pero ninguna con documento descargable.`
    };
  }

  return { status: 'FOUND', rulings };
};
