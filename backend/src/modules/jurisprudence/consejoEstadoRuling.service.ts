import { fetchDocumentText } from '../ingestion/documentFetch';
import type { Corporacion, OfficialRuling } from './officialRuling.service';

/**
 * Providencias del Consejo de Estado, desde SAMAI.
 *
 * ─── POR QUÉ FALTABA, Y QUÉ SE PERDÍA ───────────────────────────────────────
 *
 * El descubrimiento por tema preguntaba a la Corte Constitucional y —desde
 * ayer— a la Corte Suprema. **Todo lo contencioso administrativo quedaba
 * fuera**: nulidad y restablecimiento, contractual, reparación directa,
 * electoral. Es una parte grande del trabajo de una firma, y el aviso de la
 * pantalla tenía que declararlo como hueco.
 *
 * ─── LA PUERTA BUENA NO ERA EL FORMULARIO ───────────────────────────────────
 *
 * SAMAI es ASP.NET WebForms: su buscador exige `__VIEWSTATE` y
 * `__EVENTVALIDATION`, y encima los valida contra la cookie de sesión — un POST
 * con tokens de otra sesión responde `Validation of viewstate MAC failed`, que
 * es lo primero que devolvió al intentarlo. Construir sobre eso significaría
 * mantener una secuencia GET-para-tokens + POST que se rompe en cada despliegue
 * del Consejo.
 *
 * Pero la propia página de resultados publica un **enlace permanente** con la
 * consulta entera en la URL, pensado para compartir búsquedas:
 *
 *     ResultadoBuscadorProvidenciasTituladas.aspx?BusquedaDictionary={…json…}
 *
 * Ese es un GET, sin cookies y sin tokens — comprobado: devuelve los mismos 40
 * radicados que el formulario. Se usa ese, y además es el que el Consejo mismo
 * ofrece copiar, así que es la interfaz que menos razones tiene para cambiar.
 *
 * ─── LO QUE ESTE MÓDULO NO HACE ─────────────────────────────────────────────
 *
 * No confirma contra un registro externo, y no puede: el Consejo no publica su
 * índice como datos abiertos, a diferencia de la Corte Constitucional. Lo que
 * vuelve aquí viene DE la corporación, así que la providencia es real por
 * construcción — pero eso también significa que si SAMAI devolviera basura,
 * este módulo la creería. Por eso se exige radicado con forma válida y texto
 * suficiente antes de dar nada por bueno.
 */

/** El identificador de la corporación dentro de SAMAI. */
const CORPORACION_CE = '1100103';

const BASE = 'https://samai.consejodeestado.gov.co/TitulacionRelatoria';

/**
 * `.gov.co` rechaza a quien no parezca un navegador, y varios de estos
 * servidores tienen la revocación de certificado mal publicada. Es la misma
 * cabecera que el resto del proyecto ya usa con esos dominios.
 */
const NAVEGADOR =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

/** SAMAI responde en segundos, no en milisegundos: una audiencia de espera. */
const TIMEOUT_MS = 25_000;

export interface ConsejoEstadoDiscovered {
  ruling: OfficialRuling;
  /** La sección que la profirió, para que se pueda juzgar la puntería. */
  seccion: string;
}

/**
 * Da forma citable al radicado: 23 dígitos -> 05001-23-31-000-2009-01519-03.
 *
 * SAMAI lo publica SIN guiones en «Núm. del proceso», y así no se puede citar
 * en un escrito ni buscar en ningún otro sistema.
 */
const conGuiones = (crudo: string): string => {
  const d = crudo.replace(/[^0-9]/g, '');
  if (d.length !== 23) return crudo.trim();
  return [d.slice(0, 5), d.slice(5, 7), d.slice(7, 9), d.slice(9, 12), d.slice(12, 16), d.slice(16, 21), d.slice(21)].join('-');
};

/**
 * Un campo de la ficha, por su rótulo.
 *
 * SAMAI los emite como `Rótulo:&nbsp;` seguido del valor en el siguiente nodo.
 * Se busca dentro del bloque de UNA providencia, nunca en la página entera: sin
 * acotar, el ponente de la primera se le atribuiría a las cuarenta.
 */
const campo = (bloque: string, rotulo: string): string => {
  const re = new RegExp(`${rotulo}\\s*:?\\s*(?:&nbsp;)?\\s*</[^>]+>\\s*<[^>]*>\\s*([^<]{2,120})`, 'i');
  const m = bloque.match(re);
  return m ? m[1].replace(/&nbsp;/g, ' ').trim() : '';
};

/** «jueves, 30 de julio de 2026» → «30 de julio de 2026». */
const sinDiaDeLaSemana = (fecha: string): string =>
  fecha.replace(/^\s*[a-záéíóúñ]+,\s*/i, '').trim();

/**
 * El extracto de la relatoría dentro del bloque, sin marcado.
 *
 * Se corta a 6000 caracteres: SAMAI a veces devuelve titulaciones larguísimas y
 * el corpus fragmenta en trozos de 2500, así que más de eso no aporta y sí
 * infla la respuesta que viaja al navegador.
 */
const extracto = (bloque: string): string =>
  bloque
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 6000);

const construirUrl = (tema: string, pagina = 0): string => {
  /*
   * El diccionario va tal como lo arma la propia página al copiar el enlace.
   * `searchMode: all` exige TODOS los términos: con `any`, «servidumbre de
   * tránsito» devolvería todo lo que mencione «tránsito», que en lo contencioso
   * es casi todo.
   */
  const consulta = {
    corporacion: CORPORACION_CE,
    modo: '2',
    filtro: '',
    busqueda: `(${tema.trim()})`,
    searchMode: 'all',
    /*
     * SIN ORDEN EXPLICITO: SAMAI devuelve entonces por RELEVANCIA. Con
     * `FechaProvidencia desc` —lo que copia la pagina— la primera respuesta a
     * «servidumbre de transito» era una nulidad electoral: la mas reciente que
     * mencionaba las palabras, no la que trata del asunto. Para descubrir por
     * tema, lo nuevo importa menos que lo pertinente.
     */
    orderby: '',
    PaginaActual: String(pagina)
  };

  return `${BASE}/ResultadoBuscadorProvidenciasTituladas.aspx?BusquedaDictionary=${encodeURIComponent(
    JSON.stringify(consulta)
  )}`;
};

/**
 * Busca por tema y devuelve las providencias que SAMAI reconoce.
 *
 * `max` es bajo a propósito: el abogado no necesita cuarenta providencias, y
 * cada una que se propone es una que alguien va a abrir. Dos por corporación es
 * lo que el descubrimiento ya usa para la Corte Suprema.
 */
export const discoverConsejoEstadoRulings = async (
  tema: string,
  opciones: { max?: number } = {}
): Promise<ConsejoEstadoDiscovered[]> => {
  const limpio = tema.trim();
  /*
   * Menos de ocho caracteres no es un tema, es una palabra: SAMAI devolvería
   * cientos y ninguna vendría al caso. Mismo corte que la Corte Suprema.
   */
  if (limpio.length < 8) return [];

  const max = opciones.max ?? 2;

  const respuesta = await fetch(construirUrl(limpio), {
    headers: { 'User-Agent': NAVEGADOR, Accept: 'text/html' },
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });

  if (!respuesta.ok) {
    throw new Error(`SAMAI respondió ${respuesta.status}`);
  }

  const html = await respuesta.text();

  /*
   * Se parte por «Información general», que es donde empieza la ficha de cada
   * providencia. Partir por el radicado no serviría: aparece también dentro del
   * texto de otras providencias que lo citan, y se armarían fichas con el
   * ponente de una y el radicado de otra.
   */
  const bloques = html.split(/Informaci[oó]n\s+general/i).slice(1);
  const encontradas: ConsejoEstadoDiscovered[] = [];
  const vistos = new Set<string>();

  for (const bloque of bloques) {
    if (encontradas.length >= max) break;

    /*
     * EL RADICADO SE LEE DE SU CAMPO, NUNCA CON UNA EXPRESION SOBRE EL BLOQUE.
     *
     * La primera version buscaba el primer radicado con guiones que apareciera
     * en el bloque, y al verificar los enlaces se vio el resultado: la cita
     * decia `20001-23-39-003-2014-00294-01` y el proceso era
     * `05001233100020090151903`. El extracto de la relatoria CITA otras
     * providencias —es su oficio—, asi que el primer radicado del texto casi
     * nunca es el de la providencia que lo contiene.
     *
     * Una cita que apunta a otra sentencia es indistinguible de una correcta
     * hasta que alguien la abre, y para entonces esta en un escrito radicado.
     */
    const crudo = campo(bloque, 'N[uú]m\. del proceso');
    if (!crudo) continue;

    const radicado = conGuiones(crudo);
    if (vistos.has(radicado)) continue;

    const ponente = campo(bloque, 'Titular');
    const seccion = campo(bloque, 'Sala de decisi[oó]n');
    const clase = campo(bloque, 'Clase del proceso');
    const fecha = sinDiaDeLaSemana(campo(bloque, 'Providencia del'));

    /*
     * SIN PONENTE NI FECHA NO SE PROPONE. Una providencia sin firmante ni
     * fecha no se puede citar en un escrito, y ofrecerla obligaría al abogado a
     * ir a buscar los datos que este módulo existe para traer.
     */
    if (!ponente || !fecha) continue;

    /*
     * CADA FICHA ENLAZA A SU PROCESO, NO A UN PDF.
     *
     * Se busco primero un `tokenDocumento` y por eso todas las providencias
     * salian con cero caracteres: en la pagina de resultados solo hay TRES
     * enlaces de ese tipo para DIEZ fichas. Lo que cada una si trae es su
     * proceso en `list_procesos.aspx?guid=…`, relativo, y de ahi el abogado
     * llega al documento.
     */
    const relativo = bloque.match(/href="(\.\.\/vistas\/casos\/list_procesos\.aspx\?guid=[^"]+)"/i)?.[1];
    const sourceUrl = relativo
      ? `https://samai.consejodeestado.gov.co/${relativo.replace(/^\.\.\//, '').replace(/&amp;/g, '&')}`
      : construirUrl(limpio);

    /*
     * EL TEXTO ES LA TITULACION DE LA RELATORIA, NO LA PROVIDENCIA ENTERA.
     *
     * Y esa distincion hay que sostenerla: lo que SAMAI devuelve en la busqueda
     * es el extracto que la relatoria del Consejo escribio sobre la providencia
     * —su ratio, en las palabras de la corporacion—, no el fallo completo.
     * Entregarlo como si fuera el texto integro invitaria a citar «la sentencia
     * dice» sobre un resumen, que es exactamente el error que este producto
     * persigue en otras partes.
     *
     * Sirve igual, y mucho: es texto oficial, curado, y es lo que permite
     * decidir si vale la pena abrir la providencia. El fallo completo esta a un
     * salto, en la pagina del proceso.
     */
    const texto = extracto(bloque);

    vistos.add(radicado);
    encontradas.push({
      seccion: seccion || 'Sección no declarada',
      ruling: {
        corporacion: 'CONSEJO_ESTADO' as Corporacion,
        citation: radicado,
        tipo: clase || 'Providencia',
        fecha,
        magistrado: ponente,
        sala: seccion || 'Consejo de Estado',
        proceso: clase || '',
        sourceUrl,
        text: texto
      }
    });
  }

  return encontradas;
};
