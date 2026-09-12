import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { auditService } from '../../audit/audit.service';
import {
  BillingError,
  PRICE_COP,
  recordUsage,
  refundReservation,
  reserveForOperation,
  settleOperation
} from '../../billing/billing.service';
import { decodeDocument } from '../../ingestion/documentFetch';
import { textoDeDocx } from '../../ingestion/docxText';
import { BackblazeB2TenantStorageService } from '../../documents/b2.service';
import type { LegalBranch } from '../../catalog/types';
import { exigirFuncion, responderPlanError } from '../../subscriptions/plan.service';
/*
 * ─── LA CURADURÍA DE LA FIRMA TAMBIÉN LLEGA A LA REVISIÓN ──────────────────
 *
 * Aquí se usaba `buildCatalogGuidance`, la versión SIN firma, en los tres
 * caminos: revisar, el taller y volver a revisar. Y no había razón escrita en
 * ninguna parte — era deriva.
 *
 * El efecto era absurdo visto de fuera: un término que el abogado verificó a
 * mano en el Catálogo moldeaba SU BORRADOR y sus preguntas de audiencia, pero
 * NO la revisión de ese mismo borrador. El producto le pedía verificar una vez
 * y después revisaba contra la ficha de fábrica, que es justo la que él ya
 * había corregido.
 *
 * La versión con firma resuelve lo mismo con la corrección de la firma
 * superpuesta. Cuesta una consulta más a la base, que es lo que ya paga
 * Redacción por lo mismo.
 */
import { buildCatalogGuidanceForFirm } from '../catalogGuidance';
import { universoCitable } from '../andamiaje';
import { catalogService } from '../../catalog/catalog.service';
import {
  avisoDeVigencia,
  marcarVigenciaEnInforme,
  verificarVigenciaDelInforme
} from './vigenciaDelInforme';
import { ENGINE, callOpenRouterWithUsage } from '../openrouter.client';
import { aQuienLeToca, esPapelRepresentable } from './posicionProcesal';
import { esExpedienteDeLaFirma } from '../../expedientes/expedientes.service';
import type { VigenciaDeArticulo } from '../../legislation/officialArticle.service';
import { avisoDeGlosa, marcarGlosaEnInforme, verificarGlosaDelInforme } from './glosaDelInforme';
import { resumenDeGlosa } from './verificarGlosa';
import { traerMaterialDelExpediente } from '../../expedientes/materialDelExpediente';
import type { PapelEnElExpediente } from '../../expedientes/types';
import {
  ETIQUETA_DOCUMENTO_RECIBIDO,
  buildRecibidoSystemPrompt,
  buildRecibidoUserPrompt,
  buildReviewSystemPrompt,
  buildReviewUserPrompt,
  esModoDeRevision,
  parsearInforme,
  parsearInformeRecibido,
  prepararTexto,
  type InformeDeDocumentoRecibido,
  type InformeDeRevision,
  type ModoDeRevision
} from './documentReview';
import { documentReviewStore } from './documentReview.store';
import { MAX_CARACTERES_MENSAJE, buildTallerSystemPrompt, buildTallerSystemPromptRecibido, buildTallerUserPrompt, parsearRespuestaDelTaller, type TurnoDelTaller } from './taller';
import { verificarProvidencias } from './verificarProvidencias';

/**
 * POST /api/agent/review-document
 *
 * Body: { modo?, documentType, legalBranch?, pregunta?, fileName?, contentBase64? | texto? }
 *
 * ─── DOS MODOS, Y EL SEGUNDO NO PREGUNTA QUÉ ACTUACIÓN ES ───────────────────
 *
 * `ESCRITO_PROPIO` (el de siempre, y el que rige si nadie manda `modo`) revisa
 * el escrito que el abogado va a presentar, contra la ficha verificada de la
 * actuación: por eso `documentType` sigue siendo obligatorio y sigue
 * respondiendo 400 sin él.
 *
 * `DOCUMENTO_RECIBIDO` lee un papel que LLEGÓ —un auto, una sentencia, un
 * oficio, una notificación—. Ahí no hay actuación que elegir: preguntarla era
 * pedirle al abogado lo único que no puede saber del documento que acaba de
 * recibir. No hay ficha, `con_ficha` va en falso, y el informe solo afirma lo
 * que el propio texto dice, citándolo.
 *
 * ─── THE FILE COMES IN THE BODY, ON PURPOSE ─────────────────────────────────
 *
 * Audio goes to B2 because a hearing weighs 50 MB. A brief weighs kilobytes:
 * a 30-page tutela in PDF is under 2 MB, and Vercel accepts bodies up to
 * 4.5 MB. Sending it base64 inside the JSON keeps one round trip and no
 * storage — the text is extracted, reviewed and discarded in the same request.
 * Nothing of the document is persisted: not the file, not the text, not the
 * report. It is the lawyer's work product, read once.
 *
 * ─── PAID LIKE A DRAFT ──────────────────────────────────────────────────────
 *
 * Reserve before the model, settle after, refund on failure — the same three
 * moves as the draft and the summary. A review the model could not produce
 * costs nothing.
 */

const b2 = new BackblazeB2TenantStorageService();

/** Text below this is not a brief; it is a title or a botched extraction. */
const TEXTO_MINIMO = 200;
/*
 * Above the body limit the file comes through storage, like hearing audio:
 * the browser uploaded it to B2 under the firm's prefix and sends the key.
 * 15 MB covers a tutela with scanned annexes. The object is deleted BEFORE
 * responding, succeed or fail — a serverless function freezes on reply, and
 * a brief nobody can account for must not sit in a bucket.
 */
const MAX_BYTES_ALMACEN = 15 * 1024 * 1024;

/*
 * EL RELOJ DE LA FUNCIÓN, medido y no supuesto. Una revisión de 40.000
 * caracteres con 2.000 tokens de salida tardó 33 s contra OpenRouter, y la
 * función tenía 30 s: Vercel la mataba, y como la reserva del saldo se hace
 * antes de llamar al modelo, la firma pagaba $2.000 por un informe que nunca
 * llegó y nadie devolvía. De ahí tres decisiones: la función sube a 60 s
 * (vercel.json), la respuesta pide brevedad (cuatro hallazgos por lista) con
 * un presupuesto de 3.000 tokens que no debería agotar — y si lo agota, el
 * JSON cortado se repara en vez de tirarse —, y la llamada tiene su propio límite de 50 s POR DEBAJO del de la
 * función, para que sea este código —y no la plataforma— quien corte, devuelva
 * la reserva y lo diga.
 */
const MAX_TOKENS_INFORME = 3_000;
/*
 * EL MODO RECIBIDO PIDE MÁS, Y SE LE DA. Su informe dejó de ser solo la lectura
 * del papel: ahora remata con «por dónde se ataca», y cada punto de ataque
 * carga DOS citas textuales —la del documento y la de la norma que el propio
 * documento transcribe— porque sin ellas el punto no se pinta. Tres puntos así
 * son unas 300 palabras que antes no estaban, y con 3.000 el JSON llegaba
 * rozando el techo: lo que se corta primero es justamente la sección nueva, que
 * va al final. 4.000 es el mismo presupuesto con el que el taller responde hoy
 * por debajo de LIMITE_LLAMADA_MS, así que no acerca la llamada al reloj de la
 * función; y si aun así se corta, `repararJsonCortado` salva lo completo.
 */
const MAX_TOKENS_INFORME_RECIBIDO = 4_000;
export const LIMITE_LLAMADA_MS = 50_000;

/*
 * LO QUE PUEDE TARDAR LA COMPROBACIÓN DE VIGENCIA DEL INFORME.
 *
 * Corre DESPUÉS de que el informe ya está escrito y ya se pagó, así que su
 * peor desenlace no puede ser perderlo: agotar el plazo significa
 * NO_VERIFICABLE declarado, nunca una revisión caída. Por eso tiene tope
 * propio en vez de compartir el de la llamada.
 *
 * TREINTA, Y NO ES EL NÚMERO QUE PUSE PRIMERO. Empecé en 15 —por debajo de
 * los 20 de Redacción, porque esta petición carga cosas que aquella no: la
 * descarga del archivo desde B2, la extracción de un PDF o DOCX de hasta 15 MB
 * y la llamada al modelo con sus 50 s—. La prueba de punta a punta del 10 de
 * septiembre de 2026 lo desmintió: dos artículos del Código Civil tardaron
 * 44,2 s, y con 15 los dos salían NO_VERIFICABLE teniendo la respuesta a mano.
 *
 * UN PLAZO NO ES UNA ESPERA: es un techo. Si el Senado contesta en 3 s, cuesta
 * 3 s — el día que se midió normal fueron 0,1 a 0,5 s por página. Subirlo no
 * hace más lenta ninguna revisión de un día bueno; solo compra aviso en los
 * malos. Lo que sí cuesta, y por eso no se sube más, es que en un día malo el
 * abogado espere el techo entero con el informe ya escrito.
 *
 * Con 30 s, un Senado tan lento como hoy sigue dando NO_VERIFICABLE, y eso es
 * aceptable: se DECLARA, no se marca nada, y el informe sale igual. Lo
 * inaceptable sería lo contrario — dar por vivo lo que no se pudo leer.
 *
 * NO CUESTA UN PESO DE MOTOR. Descarga texto oficial y lee marcadores; lo
 * único que gasta es reloj. Ésa es la razón de que entrara antes que la
 * comprobación de glosa, que sí son hasta ocho llamadas por informe.
 */
export const PLAZO_VIGENCIA_INFORME_MS = 30_000;

/**
 * Lo que la comprobación de GLOSA puede tardar. Ver `glosaDelInforme.ts`.
 *
 * ─── POR QUÉ 30 Y NO LOS 25 DEL BORRADOR ───────────────────────────────────
 *
 * En Redacción los 25 s salen de un presupuesto apretado: cuatro etapas y la
 * redacción se reparten los 300 s de la función, y cada segundo que toma esta
 * comprobación se lo quita al motor que escribe. Aquí no hay tal reparto — la
 * revisión gasta 50 s en la llamada al modelo y 30 en la vigencia, y le sobran
 * más de tres minutos—, así que ser tacaño no compra nada.
 *
 * Y UN PLAZO NO ES UNA ESPERA: es un techo. Las hasta ocho llamadas van en
 * paralelo y el motor barato responde en segundos; el techo solo se paga el día
 * que el proveedor va lento, y ese día se paga con DUDOSA declarada, no con un
 * informe perdido. Lo que impide subirlo más es lo mismo que en la vigencia:
 * en un día malo el abogado espera el techo entero con el informe ya escrito.
 */
export const PLAZO_GLOSA_INFORME_MS = 30_000;

export class TiempoAgotado extends Error {}

export const conLimite = <T>(promesa: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new TiempoAgotado('la revisión tardó más de lo que la plataforma permite')), ms);
    promesa.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });

/**
 * Lee el archivo que el navegador subió a B2 y, salvo que se pida conservarlo,
 * lo borra antes de devolver nada.
 *
 * `conservar` es la única puerta por la que un escrito sobrevive en el
 * almacenamiento, y solo se abre cuando la firma autorizó guardar escritos:
 * el visor del original necesita el archivo tal como está constituido, porque
 * el texto extraído pierde la diagramación, las negritas, las tablas y las
 * notas al pie —justo lo que un litigante lee primero—. Sin esa autorización
 * se sigue borrando aquí mismo, como el audio de las audiencias, y el original
 * vive solo en la pestaña abierta.
 *
 * El borrado va DENTRO de la petición y no en un `finally` posterior a la
 * respuesta: una función serverless se congela al contestar.
 */
const leerDelAlmacen = async (
  firmId: string,
  storageKey: string,
  conservar: boolean
): Promise<{ ok: true; buffer: Buffer } | { ok: false; status: number; message: string }> => {
  let leido = false;
  try {
    const url = await b2.generateDownloadPresignedUrl(firmId, storageKey);
    const r = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!r.ok) return { ok: false, status: 502, message: `El almacenamiento no entregó el archivo (${r.status}).` };
    const declarado = Number(r.headers.get('content-length') ?? 0);
    if (declarado > MAX_BYTES_ALMACEN) return { ok: false, status: 413, message: 'El archivo supera 15 MB.' };
    const buffer = Buffer.from(await r.arrayBuffer());
    if (buffer.length > MAX_BYTES_ALMACEN) return { ok: false, status: 413, message: 'El archivo supera 15 MB.' };
    leido = true;
    return { ok: true, buffer };
  } catch (err) {
    return { ok: false, status: 502, message: `No se pudo leer el archivo del almacenamiento: ${(err as Error).message}` };
  } finally {
    // Un archivo que no se pudo leer no se conserva: nadie podría abrirlo.
    if (!conservar || !leido) await b2.deleteObject(firmId, storageKey).catch(() => false);
  }
};
/** Base64 of ~4 MB. Above it Vercel would refuse the body anyway; here it fails with a reason. */
const MAX_BASE64 = 5_600_000;

const tipoPorNombre = (fileName: string): string => {
  const ext = fileName.toLowerCase().split('.').pop() ?? '';
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (ext === 'doc') return 'application/msword';
  return 'text/plain';
};

const extraerTexto = async (
  fileName: string,
  buffer: Buffer
): Promise<{ ok: true; texto: string } | { ok: false; reason: string }> => {
  const contentType = tipoPorNombre(fileName);

  if (contentType.includes('wordprocessingml') || buffer.subarray(0, 2).toString() === 'PK') {
    const texto = await textoDeDocx(buffer);
    if (texto !== null) return { ok: true, texto };
  }

  const doc = await decodeDocument(buffer, contentType, TEXTO_MINIMO);
  if (!doc.ok) return { ok: false, reason: doc.reason };
  return { ok: true, texto: doc.text };
};

export const reviewDocumentController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const userEmail = req.user?.email ?? 'desconocido';
  /* Sin `modo` en el cuerpo manda el de siempre: ningún cliente viejo cambia de comportamiento. */
  const modo: ModoDeRevision = esModoDeRevision(req.body.modo) ? req.body.modo : 'ESCRITO_PROPIO';
  const esRecibido = modo === 'DOCUMENTO_RECIBIDO';
  const documentType = String(req.body.documentType ?? '').trim();
  const legalBranch = typeof req.body.legalBranch === 'string' ? (req.body.legalBranch as LegalBranch) : undefined;
  const pregunta = String(req.body.pregunta ?? '');
  const fileName = String(req.body.fileName ?? 'escrito.txt');
  /* De qué cliente o proceso es el escrito: lo dice quien pide la revisión, y queda en la lista. */
  const cliente = String(req.body.cliente ?? '').trim().slice(0, 160);
  /*
   * A QUIÉN REPRESENTA EL ABOGADO EN ESTE PROCESO.
   *
   * Solo tiene sentido sobre un documento RECIBIDO: en el escrito propio, el
   * autor es él y no hay a quién atribuirle nada.
   *
   * Lo que no se reconozca cae a `DESCONOCIDO`, que es lo mismo que no haber
   * contestado: con él no se atribuye ninguna carga. Un valor raro no puede
   * tratarse como una posición cualquiera — atribuir por un dato corrupto es
   * justo el error que este campo existe para evitar.
   */
  const posicion: PapelEnElExpediente = esPapelRepresentable(req.body.posicion)
    ? req.body.posicion
    : 'DESCONOCIDO';
  /*
   * DE QUÉ CASO ES LA REVISIÓN, si el abogado lo dijo.
   *
   * La columna `document_reviews.expediente_id` existía desde la migración de
   * expedientes y solo la escribía «Traer al expediente» — es decir, DESPUÉS y
   * a mano. Una revisión puede nacer atada, y entonces el caso la cuenta sin
   * que nadie tenga que volver a buscarla.
   */
  const expedienteId = typeof req.body.expedienteId === 'string' && req.body.expedienteId.trim()
    ? req.body.expedienteId.trim()
    : null;

  /*
   * LA EXIGENCIA DE ACTUACIÓN NO SE RELAJA: SE CIRCUNSCRIBE AL MODO QUE LA
   * NECESITA. En el modo propio la revisión objetiva se hace contra la ficha,
   * así que sin actuación no hay contra qué revisar y el 400 se queda como
   * estaba. En el modo recibido no hay ficha que traer y la pregunta no tiene
   * respuesta posible para quien acaba de recibir el papel.
   */
  if (!esRecibido && !documentType) {
    res.status(400).json({ success: false, error: 'MISSING_DOCUMENT_TYPE', message: 'Indique la actuación del escrito.' });
    return;
  }

  /*
   * La etiqueta con la que la revisión se archiva y se titula. En el modo
   * recibido es una etiqueta DEL PRODUCTO —nunca un nombre jurídico que el
   * modelo haya supuesto—, porque `document_reviews.document_type` es lo que
   * la lista y la cabecera del informe muestran, y una suposición archivada
   * ahí se lee igual que una actuación resuelta contra su ficha.
   */
  const etiqueta = esRecibido ? ETIQUETA_DOCUMENTO_RECIBIDO : documentType;

  /*
   * ─── EL ORIGINAL SE CONSERVA CUANDO LA FIRMA LO AUTORIZÓ ──────────────────
   *
   * La misma autorización que gobierna el texto (`guarda_escritos_revisados`),
   * porque conservar el archivo cambia lo que Iureon guarda de la firma
   * exactamente igual. El navegador lo pide con `conservarOriginal` y solo lo
   * hace cuando ya subió el archivo al almacenamiento: lo que llega en el
   * cuerpo no se conserva, porque devolverlo a B2 desde aquí gastaría el reloj
   * de la función en una subida que el navegador ya sabe hacer.
   */
  const consentimiento = await documentReviewStore.consentimiento(firmId);
  const conservarOriginal = consentimiento.guarda && req.body.conservarOriginal === true;
  /** Tipo declarado por el navegador; si calla, el que dice la extensión. */
  const tipoDelArchivo = String(req.body.contentType ?? '').trim() || tipoPorNombre(fileName);
  /** El objeto que quedó vivo en B2 y todavía no tiene fila que lo reclame. */
  let original: { clave: string; tipo: string; bytes: number } | null = null;
  const soltarOriginalHuerfano = async (): Promise<void> => {
    if (!original) return;
    await b2.deleteObject(firmId, original.clave).catch(() => false);
    original = null;
  };

  // ─── The text: pasted, or extracted from the file ─────────────────────────
  let bruto: string;
  if (typeof req.body.texto === 'string' && req.body.texto.trim()) {
    bruto = req.body.texto;
  } else if (typeof req.body.contentBase64 === 'string' && req.body.contentBase64) {
    if (req.body.contentBase64.length > MAX_BASE64) {
      res.status(413).json({ success: false, error: 'FILE_TOO_LARGE', message: 'El archivo supera el tamaño que cabe en la petición; el navegador debió subirlo al almacenamiento.' });
      return;
    }
    const extraido = await extraerTexto(fileName, Buffer.from(req.body.contentBase64, 'base64'));
    if (!extraido.ok) {
      res.status(422).json({ success: false, error: 'UNREADABLE_FILE', message: `No se pudo leer el archivo: ${extraido.reason}. Pegue el texto en su lugar.` });
      return;
    }
    bruto = extraido.texto;
  } else if (typeof req.body.storageKey === 'string' && req.body.storageKey) {
    const leido = await leerDelAlmacen(firmId, req.body.storageKey, conservarOriginal);
    if (!leido.ok) {
      res.status(leido.status).json({ success: false, error: 'STORAGE_READ_FAILED', message: leido.message });
      return;
    }
    if (conservarOriginal) original = { clave: req.body.storageKey, tipo: tipoDelArchivo, bytes: leido.buffer.length };
    const extraido = await extraerTexto(fileName, leido.buffer);
    if (!extraido.ok) {
      await soltarOriginalHuerfano();
      res.status(422).json({ success: false, error: 'UNREADABLE_FILE', message: `No se pudo leer el archivo: ${extraido.reason}. Pegue el texto en su lugar.` });
      return;
    }
    bruto = extraido.texto;
  } else {
    res.status(400).json({ success: false, error: 'MISSING_TEXT', message: 'Adjunte el escrito o pegue su texto.' });
    return;
  }

  const preparado = prepararTexto(bruto);
  if (preparado.caracteres < TEXTO_MINIMO) {
    await soltarOriginalHuerfano();
    res.status(422).json({
      success: false,
      error: 'TEXT_TOO_SHORT',
      message: `El texto tiene ${preparado.caracteres} caracteres; un escrito revisable tiene al menos ${TEXTO_MINIMO}. Si es un PDF escaneado, no trae texto: péguelo.`
    });
    return;
  }

  /*
   * SE COMPRUEBA ANTES DE RESERVAR, no al guardar. El id llega del cuerpo de
   * una petición y el aislamiento de esta casa lo da el filtro por firma en
   * cada consulta, no la política: sin esto, una revisión podría quedar atada
   * al expediente de otra firma.
   *
   * Y va temprano a propósito. Comprobarlo al final significaría descubrir el
   * error con el informe ya escrito y ya pagado, y entonces solo quedarían dos
   * salidas malas: perder la revisión, o guardarla desatada en silencio.
   */
  if (expedienteId && !(await esExpedienteDeLaFirma(firmId, expedienteId))) {
    res.status(404).json({
      success: false,
      error: 'EXPEDIENTE_NO_ENCONTRADO',
      message: 'Ese expediente no existe.'
    });
    return;
  }

  // ─── Reserve, review, settle ──────────────────────────────────────────────
  let reservado = 0;
  try {
    ({ reserved: reservado } = await reserveForOperation({ firmId, userEmail, operation: 'REVISION' }));
  } catch (err) {
    await soltarOriginalHuerfano();
    if (err instanceof BillingError) {
      res.status(err.status).json({ success: false, error: err.code, message: err.message });
      return;
    }
    throw err;
  }

  const operationId = randomUUID();
  try {
    /*
     * SIN FICHA EN EL MODO RECIBIDO, y no por falta de ganas: no se eligió
     * actuación, así que no hay ficha que resolver. Buscar una a partir de lo
     * que el modelo crea que es el documento sería fabricar el respaldo que
     * este informe declara no tener.
     */
    const guidance = esRecibido ? null : await buildCatalogGuidanceForFirm(firmId, documentType, legalBranch);

    /*
     * ─── LO QUE EL EXPEDIENTE DICE DEL CASO, SOLO EN EL MODO PROPIO ────────
     *
     * En el modo propio el revisor lee un escrito que el abogado va a
     * presentar EN un proceso, y los papeles de ese proceso están indexados.
     * Con ellos puede hacer lo único que nadie más hace: cotejar. Si el
     * escrito dice un radicado y el expediente dice otro, si nombra a una
     * parte que no figura, si da por notificada una fecha que no coincide —
     * eso no se ve leyendo el escrito solo, por bueno que sea el revisor.
     *
     * ─── Y NO EN EL MODO RECIBIDO ──────────────────────────────────────────
     *
     * Ese informe se rige por una regla que manda sobre todas: SOLO PUEDE
     * AFIRMAR LO QUE ESTÁ ESCRITO EN EL DOCUMENTO, porque no hay ficha ni
     * fuente distinta del texto que llegó. Meterle pasajes del expediente la
     * contradice de frente: el informe empezaría a afirmar cosas que el auto
     * no dice, con la misma voz con la que dice lo que sí dice, y el abogado
     * no tendría cómo distinguirlas. La regla vale más que la comodidad.
     *
     * NO TUMBA NADA. Sin proveedor, sin índice o con la red caída, el bloque
     * llega vacío y la revisión sigue igual.
     */
    const bloqueExpediente = esRecibido
      ? undefined
      : await traerMaterialDelExpediente(firmId, expedienteId, `${documentType} ${pregunta}`);
    if (bloqueExpediente) {
      console.log('[REVIEW] Pasajes del expediente indexado incorporados al cotejo.');
    }
    /*
     * El mismo motor y el mismo límite de llamada que el modo propio: ninguno
     * de los dos puede tardar más de lo que cabe por debajo del reloj de la
     * función. Lo que cambia es el presupuesto de salida, porque el informe del
     * documento recibido escribe más (ver MAX_TOKENS_INFORME_RECIBIDO).
     */
    const llamada = await conLimite(
      callOpenRouterWithUsage(
        ENGINE.OPUS,
        esRecibido ? buildRecibidoSystemPrompt() : buildReviewSystemPrompt(),
        esRecibido
          ? buildRecibidoUserPrompt({ pregunta, texto: preparado.texto, truncado: preparado.truncado })
          : buildReviewUserPrompt({
              documentType,
              guidance,
              pregunta,
              texto: preparado.texto,
              truncado: preparado.truncado,
              expediente: bloqueExpediente
            }),
        esRecibido ? MAX_TOKENS_INFORME_RECIBIDO : MAX_TOKENS_INFORME
      ),
      LIMITE_LLAMADA_MS
    );

    await recordUsage({ firmId, userEmail, operation: 'REVISION', operationId, usage: llamada.usage ?? null });

    if (!llamada.text || !llamada.text.trim()) {
      await soltarOriginalHuerfano();
      await refundReservation({ firmId, userEmail, operation: 'REVISION', reason: 'la revisión no produjo resultado' });
      res.status(502).json({ success: false, error: 'REVIEW_FAILED', message: 'El revisor no respondió. No se descontó saldo.' });
      return;
    }

    const informe: InformeDeRevision | null = esRecibido ? null : parsearInforme(llamada.text);
    const leido = esRecibido ? parsearInformeRecibido(llamada.text) : null;
    /*
     * LA POSICIÓN SE SELLA EN EL INFORME, no se recalcula al pintarlo. Un
     * informe que se abre tres semanas después tiene que atribuir las cargas
     * igual que el día que se pidió; si para entonces el abogado cambió de
     * posición, lo que se leyó bajo la anterior sigue siendo lo que se leyó.
     */
    const informeRecibido: InformeDeDocumentoRecibido | null = leido
      ? {
          ...leido,
          posicion,
          /*
           * EL VEREDICTO LO PONE AQUÍ EL CÓDIGO, comparando lo que el motor
           * transcribió contra lo que el abogado declaró. El modelo no opina
           * sobre de quién es la carga y, si lo hiciera, el parser ya descartó
           * ese campo: `deQuienEs` no se lee de la respuesta.
           */
          cargas: leido.cargas.map((c) => ({ ...c, deQuienEs: aQuienLeToca(c.aQuien, posicion) }))
        }
      : null;
    const seOrdeno = esRecibido ? informeRecibido !== null : informe !== null;
    if (!seOrdeno) {
      // Shape only, never content: the brief and the report are the lawyer's.
      console.warn(
        `[REVIEW] Informe no estructurable: ${llamada.text.length} caracteres, empieza con «${llamada.text.trimStart().slice(0, 1)}», termina con «${llamada.text.trimEnd().slice(-1)}», tokens de salida ${llamada.usage?.completionTokens ?? '?'}.`
      );
    }

    /*
     * ─── ¿SIGUEN VIVOS LOS ARTÍCULOS QUE EL REVISOR CITÓ? ──────────────────
     *
     * Hasta el 10 de septiembre de 2026, ninguna de las tres comprobaciones
     * del borrador llegaba aquí. Y este es el sitio donde más duelen: al
     * modelo SE LE ORDENA citar («aquí eres categórico y citas el artículo»),
     * la salida es texto LISTO PARA PEGAR, y el defecto medido —citar
     * artículos reales pero MUERTOS— es exactamente el que nadie miraba.
     *
     * Un revisor que corrige una cita buena con una muerta es más peligroso
     * que un redactor que la inventa: después de que el revisor habló, el
     * abogado ya no vuelve a mirar.
     *
     * VA DESPUÉS DEL COBRO Y ANTES DE GUARDAR, y ese orden es deliberado. Se
     * anota lo que se guarda, porque el abogado vuelve al informe días
     * después —cuando corrige— y el aviso tiene que seguir ahí. Y no puede
     * tumbar nada: llegados aquí el informe ya existe y ya se pagó, así que
     * una mala tarde del Senado marca NO_VERIFICABLE y sigue.
     *
     * SOLO EN EL MODO PROPIO. El modo recibido no elige actuación, así que no
     * hay ficha ni universo citable contra el que medir; y su prompt ya le
     * prohíbe citar artículos de memoria, que es la otra mitad del problema.
     */
    let informeAnotado = informe;
    /*
     * LOS AVISOS DE CABECERA SE JUNTAN Y SE PONEN UNA VEZ, AL FINAL.
     *
     * Cada comprobación los ponía por su cuenta con un `unshift`, y encadenados
     * el orden lo decidía el orden en que corren: la última en hablar quedaba
     * primera. Aquí se acumulan y se anteponen juntos, en un orden escrito a
     * mano — la vigencia antes que la glosa, porque un artículo derogado
     * invalida el punto entero y una glosa mal explicada invalida una frase.
     */
    const avisos: string[] = [];
    let citasComprobadas: VigenciaDeArticulo[] = [];

    if (informe) {
      /*
       * Una sola variable estrechada para las dos comprobaciones: cada una toma
       * el informe que dejó la anterior y le añade sus marcas, así que las dos
       * marcas conviven en el mismo informe en vez de pisarse.
       */
      let anotado = informe;

      try {
        const actuacion = catalogService.findByDocumentType(documentType, legalBranch);
        const autorizados = actuacion ? universoCitable(actuacion) : [];
        const vigencia = await verificarVigenciaDelInforme(
          informe,
          autorizados,
          PLAZO_VIGENCIA_INFORME_MS
        );
        citasComprobadas = vigencia.resultados;
        const aviso = avisoDeVigencia(vigencia);
        if (aviso) {
          anotado = marcarVigenciaEnInforme(anotado, vigencia);
          avisos.push(aviso);
          console.log(
            `[REVIEW] Vigencia del informe: ${vigencia.resultados.length} citas fuera de ficha, ` +
              `${vigencia.derogados} derogadas, ${vigencia.discrepantes} con discrepancia, ` +
              `${vigencia.noVerificables} no verificables.`
          );
        }
      } catch (err) {
        /*
         * NUNCA TUMBA LA REVISIÓN. El informe ya está escrito y ya se pagó;
         * perderlo por un fallo del comprobador sería cambiar un aviso que
         * falta por un producto que no llega.
         */
        console.warn(`[REVIEW] No se pudo comprobar la vigencia del informe: ${(err as Error).message}`);
      }

      /*
       * ─── ¿DICE EL ARTÍCULO LO QUE EL REVISOR DICE QUE DICE? ──────────────
       *
       * La tercera comprobación del borrador, y la última que le faltaba a
       * Revisión. Ve el defecto que las otras dos aprueban con razón: un artículo
       * VIGENTE y de la ficha, explicado al revés. Ver `glosaDelInforme.ts`.
       *
       * SE ALIMENTA DE LO QUE LA VIGENCIA YA BAJÓ. `citasComprobadas` trae el
       * texto oficial de esos mismos artículos, así que esta etapa no añade una
       * sola petición al Senado; sin ellas —porque la vigencia falló o porque el
       * informe no citó nada fuera de ficha— no hay contra qué comparar y no se
       * juzga nada. Preguntarle al motor qué recuerda del artículo es justo lo
       * que falló al escribir la frase.
       *
       * LO QUE SÍ CUESTA SON HASTA OCHO LLAMADAS al motor barato, en paralelo,
       * con el texto delante: unos US$0,014 por informe, que cabe de sobra bajo
       * el piso de la REVISIÓN. Se registran en `ai_usage` una por una, porque
       * `settleOperation` liquida sumando esa tabla y lo que no se registra
       * quedaría fuera del margen — el defecto del gasto invisible, ya medido.
       */
      if (citasComprobadas.length > 0) {
        try {
          const glosa = await verificarGlosaDelInforme(informe, citasComprobadas, PLAZO_GLOSA_INFORME_MS);

          for (const usage of glosa.usos) {
            await recordUsage({ firmId, userEmail, operation: 'REVISION', operationId, usage });
          }

          const avisoGlosa = avisoDeGlosa(glosa);
          if (avisoGlosa) {
            anotado = marcarGlosaEnInforme(anotado, glosa);
            avisos.push(avisoGlosa);
          }
          if (glosa.resultados.length > 0) {
            console.log(`[REVIEW] Glosa del informe: ${resumenDeGlosa(glosa)}`);
          }
        } catch (err) {
          console.warn(`[REVIEW] No se pudo comprobar la glosa del informe: ${(err as Error).message}`);
        }
      }

      /*
       * Y AL FRENTE DE LAS RECOMENDACIONES, que es donde se hojea. No son
       * recomendaciones más: son las líneas que dicen que una parte del propio
       * informe no se puede usar tal como está, y detrás de siete consejos no
       * las lee nadie.
       */
      informeAnotado =
        avisos.length > 0 ? { ...anotado, recomendaciones: [...avisos, ...anotado.recomendaciones] } : anotado;
    }

    const cobro = await settleOperation({
      firmId,
      userEmail,
      operation: 'REVISION',
      operationId,
      reserved: reservado,
      description: `Revisión: ${etiqueta} · ${fileName}`
    });

    // To the audit BEFORE responding: serverless freezes on response. The
    // resource names the actuación and the file, never the content.
    await auditService.record({
      firmId,
      userEmail,
      action: 'DOCUMENT_REVIEWED',
      resource: `${etiqueta} · ${fileName} · ${preparado.caracteres.toLocaleString('es-CO')} caracteres${preparado.truncado ? ' (recortado)' : ''}`,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
    });

    /*
     * EL INFORME SE GUARDA SOLO, sin boton. Un escrito que costo saldo no
     * deberia depender de un clic para conservarse — los borradores ensenaron
     * eso —, y aqui menos: el abogado vuelve al informe dias despues, cuando
     * corrige. Se guarda el informe y el nombre del archivo; el texto del
     * escrito no. Si la tabla no existe todavia, la respuesta lo dice.
     */
    const guardadaId = await documentReviewStore.guardar({
      firmId,
      userEmail,
      documentType: etiqueta,
      /* Sin actuación no hay rama: en el modo recibido nadie eligió ninguna. */
      legalBranch: esRecibido ? null : legalBranch ?? null,
      fileName,
      cliente,
      pregunta: pregunta.trim(),
      caracteres: preparado.caracteres,
      truncado: preparado.truncado,
      conFicha: guidance !== null,
      /* El ANOTADO, no el crudo: el aviso tiene que seguir ahí cuando vuelva. */
      informe: informeAnotado,
      informeRecibido,
      informeLibre: seOrdeno ? null : llamada.text,
      cobradoCop: cobro.charged,
      textoOriginal: consentimiento.guarda ? preparado.texto : null,
      expedienteId
    });

    /*
     * El archivo se ata a la fila DESPUÉS de crearla, en su propia sentencia:
     * si la migración del original no ha corrido, PostgREST rechazaría el
     * insert entero por una columna que no conoce y se perdería el informe que
     * la firma acaba de pagar. Si no se pudo atar —o no hubo fila— el objeto
     * se borra: un archivo en el bucket que ninguna revisión reclama es
     * material privilegiado sin dueño.
     */
    let archivoOriginal: { clave: string; tipo: string; bytes: number } | null = null;
    if (original) {
      const atado = guardadaId !== null && (await documentReviewStore.adjuntarOriginal(firmId, guardadaId, original));
      if (atado) archivoOriginal = original;
      else await soltarOriginalHuerfano();
    }

    res.json({
      success: true,
      id: guardadaId,
      guardada: guardadaId !== null,
      /** El archivo tal como se subió, cuando se conservó: el visor del original lo pide por su cuenta. */
      archivoOriginal,
      /*
       * EL TEXTO VUELVE AL NAVEGADOR SIEMPRE: el taller lo necesita para tachar
       * los pasajes y dejar editar. Que ademas se CONSERVE en el servidor
       * depende de la autorizacion de la firma, y la respuesta lo dice.
       */
      texto: preparado.texto,
      guardaTexto: consentimiento.guarda,
      /** Cuál de los dos se leyó: la pantalla lo rotula y no lo adivina por la forma del informe. */
      modo,
      /* El ANOTADO, igual que en el guardado: la pantalla y la base ven lo mismo. */
      informe: informeAnotado,
      informeRecibido,
      informeLibre: seOrdeno ? null : llamada.text,
      conFicha: guidance !== null,
      truncado: preparado.truncado,
      caracteres: preparado.caracteres,
      cobradoCop: cobro.charged,
      saldoCop: cobro.balance
    });
  } catch (err) {
    await soltarOriginalHuerfano();
    if (err instanceof TiempoAgotado) {
      await refundReservation({ firmId, userEmail, operation: 'REVISION', reason: 'la revisión superó el tiempo de la plataforma' });
      res.status(504).json({
        success: false,
        error: 'REVIEW_TIMEOUT',
        message: 'La revisión tardó más de lo que la plataforma permite. No se descontó saldo. Pruebe con un escrito más corto o sin anexos.'
      });
      return;
    }
    console.error('[REVIEW] Error revisando el escrito:', err);
    await refundReservation({ firmId, userEmail, operation: 'REVISION', reason: 'la revisión falló' });
    res.status(500).json({ success: false, error: 'REVIEW_FAILED', message: 'No se pudo revisar el escrito. No se descontó saldo.' });
  }
};

export const REVIEW_PRICE_COP = PRICE_COP.REVISION;

/** GET /api/agent/reviews — the firm's saved reports, newest first, without bodies. */
export const listReviewsController = async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, revisiones: await documentReviewStore.listar(req.firmId as string) });
};

/** GET /api/agent/reviews/:id — one report, complete. */
export const getReviewController = async (req: Request, res: Response): Promise<void> => {
  const revision = await documentReviewStore.obtener(req.firmId as string, String(req.params.id));
  if (!revision) {
    res.status(404).json({ success: false, error: 'REVIEW_NOT_FOUND', message: 'Esa revisión no existe o no es de su firma.' });
    return;
  }
  res.json({ success: true, revision });
};

/* ─── EL TALLER ──────────────────────────────────────────────────────────────── */

/** GET /api/agent/reviews/settings/guardado — si la firma autorizó conservar escritos. */
export const getStorageConsentController = async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, ...(await documentReviewStore.consentimiento(req.firmId as string)) });
};

/**
 * POST /api/agent/reviews/settings/guardado { autorizar: boolean }
 *
 * Solo un socio administrador: conservar los escritos de la firma es una
 * decision de la firma, no de quien revisa. Queda en la auditoria con correo.
 */
export const setStorageConsentController = async (req: Request, res: Response): Promise<void> => {
  /*
   * Un socio administrador de la firma, o el superusuario para la firma en la
   * que esta trabajando: el operador probo el taller con su propia cuenta y no
   * encontro donde autorizar, porque solo se aceptaba FIRM_ADMIN. La
   * autorizacion sigue siendo por firma (req.firmId) y queda en la auditoria
   * con el correo de quien la dio.
   */
  if (req.user?.role !== 'FIRM_ADMIN' && req.user?.role !== 'SUPER_ADMIN') {
    res.status(403).json({ success: false, error: 'ONLY_FIRM_ADMIN', message: 'Solo un socio administrador de la firma puede autorizar que se conserven los escritos.' });
    return;
  }
  const autorizar = req.body.autorizar !== false;
  const ok = await documentReviewStore.autorizarGuardado(req.firmId as string, req.user.email, autorizar);
  if (!ok) {
    res.status(502).json({ success: false, error: 'CONSENT_NOT_SAVED', message: 'No se pudo guardar la autorización. Si la migración del taller no se ha ejecutado, ejecútela primero.' });
    return;
  }
  await auditService.record({
    firmId: req.firmId as string,
    userEmail: req.user.email,
    action: 'REVIEW_TEXT_STORAGE_AUTHORIZED',
    resource: autorizar ? 'La firma autoriza conservar los escritos revisados y su conversación' : 'La firma retira la autorización de conservar escritos revisados',
    ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
  });
  res.json({ success: true, ...(await documentReviewStore.consentimiento(req.firmId as string)) });
};

/**
 * PUT /api/agent/reviews/:id/texto { texto, anotaciones?, versiones?, conversacion? }
 *
 * Autoguardado del taller, si la firma lo autorizó. El navegador lo llama con
 * retardo tras cada cambio y al ocultarse o cerrarse la pestaña (keepalive),
 * para que el último cambio no dependa de que la pestaña siga viva. La
 * conversación viene entera y reemplaza la guardada: es lo que permite que la
 * firma autorice a mitad del taller sin perder los turnos anteriores.
 */
export const saveWorkingTextController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const texto = typeof req.body.texto === 'string' ? req.body.texto : '';
  if (texto.length > 400_000) {
    res.status(413).json({ success: false, error: 'TEXT_TOO_LONG', message: 'El texto de trabajo supera lo que se guarda.' });
    return;
  }
  const consentimiento = await documentReviewStore.consentimiento(firmId);
  if (!consentimiento.guarda) {
    res.json({ success: true, guardado: false, motivo: 'La firma no ha autorizado conservar escritos: el texto vive solo en esta sesión.' });
    return;
  }
  const anotaciones = Array.isArray(req.body.anotaciones)
    ? (req.body.anotaciones as unknown[])
        .map((a) => {
          const o = (a ?? {}) as Record<string, unknown>;
          return { cita: String(o.cita ?? '').slice(0, 2000), color: String(o.color ?? ''), nota: o.nota ? String(o.nota).slice(0, 1000) : undefined, fecha: o.fecha ? String(o.fecha).slice(0, 40) : undefined };
        })
        .filter((a) => a.cita && /^(amarillo|verde|azul|rosa|tachado|comentario)$/.test(a.color))
        .slice(0, 500)
    : undefined;
  const versiones = Array.isArray(req.body.versiones)
    ? (req.body.versiones as unknown[])
        .map((v) => {
          const o = (v ?? {}) as Record<string, unknown>;
          return { fecha: String(o.fecha ?? ''), motivo: String(o.motivo ?? '').slice(0, 80), texto: String(o.texto ?? '').slice(0, 200_000), resumen: o.resumen ? String(o.resumen).slice(0, 400) : undefined };
        })
        .filter((v) => v.fecha && v.texto)
        .slice(-15)
    : undefined;
  const conversacion = Array.isArray(req.body.conversacion)
    ? (req.body.conversacion as unknown[])
        .map((t) => {
          const o = (t ?? {}) as Record<string, unknown>;
          return {
            rol: o.rol === 'revisor' ? ('revisor' as const) : ('abogado' as const),
            texto: String(o.texto ?? '').slice(0, 60_000),
            ediciones: Array.isArray(o.ediciones) ? (o.ediciones as TurnoDelTaller['ediciones']) : undefined,
            referencias: Array.isArray(o.referencias) ? (o.referencias as string[]).map(String).slice(0, 50) : undefined,
            fecha: String(o.fecha ?? '').slice(0, 40)
          };
        })
        .filter((t) => t.texto)
        .slice(-400)
    : undefined;
  const ok = await documentReviewStore.actualizarTextoTrabajo(firmId, String(req.params.id), texto, anotaciones, versiones, conversacion);
  res.json({ success: true, guardado: ok });
};

const ipDe = (req: Request): string => (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? '';

/**
 * POST /api/agent/reviews/:id/chat { mensaje, textoActual, historial? }
 *
 * Un turno con el revisor sobre el texto ACTUAL. El historial lo manda el
 * navegador (es quien lo tiene completo aunque la firma no guarde); si la
 * firma guarda, se persiste junto con el texto de trabajo.
 */
export const reviewChatController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const userEmail = req.user?.email ?? 'desconocido';
  const id = String(req.params.id);

  try {
    await exigirFuncion(firmId, 'REVISIONES.CHAT_GUIA');
  } catch (err) {
    if (responderPlanError(res, err)) return;
    throw err;
  }

  const mensaje = String(req.body.mensaje ?? '').trim();
  const textoActual = typeof req.body.textoActual === 'string' ? req.body.textoActual : '';
  const historialCliente: TurnoDelTaller[] = Array.isArray(req.body.historial) ? (req.body.historial as TurnoDelTaller[]) : [];
  const anotacionesDelAbogado = Array.isArray(req.body.anotaciones)
    ? (req.body.anotaciones as unknown[]).map((a) => {
        const o = (a ?? {}) as Record<string, unknown>;
        return { cita: String(o.cita ?? '').slice(0, 2000), color: String(o.color ?? ''), nota: o.nota ? String(o.nota).slice(0, 1000) : undefined };
      })
    : [];

  if (!mensaje) {
    res.status(400).json({ success: false, error: 'MISSING_MESSAGE', message: 'Escriba qué quiere preguntar o pedir.' });
    return;
  }
  if (mensaje.length > MAX_CARACTERES_MENSAJE) {
    res.status(413).json({ success: false, error: 'MESSAGE_TOO_LONG', message: `El mensaje supera ${MAX_CARACTERES_MENSAJE.toLocaleString('es-CO')} caracteres. Si quiere revisar un texto largo, péguelo en el escrito y pida una nueva revisión.` });
    return;
  }
  const revision = await documentReviewStore.obtener(firmId, id);
  if (!revision) {
    res.status(404).json({ success: false, error: 'REVIEW_NOT_FOUND', message: 'Esa revisión no existe o no es de su firma.' });
    return;
  }
  const texto = prepararTexto(textoActual || revision.textoTrabajo || '');
  if (texto.caracteres < 50) {
    res.status(422).json({ success: false, error: 'TEXT_MISSING', message: 'No hay texto del escrito para conversar sobre él. Ábralo de nuevo desde el archivo.' });
    return;
  }

  let reservado = 0;
  try {
    ({ reserved: reservado } = await reserveForOperation({ firmId, userEmail, operation: 'CONSULTA_REVISION' }));
  } catch (err) {
    if (err instanceof BillingError) {
      res.status(err.status).json({ success: false, error: err.code, message: err.message });
      return;
    }
    throw err;
  }

  const operationId = randomUUID();
  try {
    /*
     * EL CHAT SOBRE UN DOCUMENTO RECIBIDO ES OTRA CONVERSACIÓN.
     *
     * Hasta hoy había una sola: la del escrito propio, que dice «acompañas al
     * abogado mientras lo CORRIGE» y devuelve ediciones con botón «Aplicar».
     * Sobre el auto de un juez eso proponía corregir la providencia ajena —que
     * ya está proferida— y cobraba por hacerlo. Y viajaba CIEGO: se le pasaba
     * `revision.informe`, que en este modo es null, así que el revisor no veía
     * ni las cargas, ni los plazos citados, ni los flancos que él mismo halló.
     */
    const esRecibido = revision.modo === 'DOCUMENTO_RECIBIDO';
    const guidance = esRecibido
      ? null
      : await buildCatalogGuidanceForFirm(firmId, revision.documentType, (revision.legalBranch ?? undefined) as LegalBranch | undefined);
    const historial = historialCliente.length ? historialCliente : revision.conversacion;
    // Las sentencias que el abogado nombra se consultan en el índice oficial ANTES de preguntar: la guía responde con la fuente, no de memoria.
    const verificaciones = await verificarProvidencias([mensaje, ...anotacionesDelAbogado.map((a) => a.nota ?? '')]);
    const llamada = await conLimite(
      callOpenRouterWithUsage(
        ENGINE.OPUS,
        esRecibido ? buildTallerSystemPromptRecibido() : buildTallerSystemPrompt(),
        buildTallerUserPrompt({
          documentType: revision.documentType,
          guidance,
          informe: revision.informe,
          informeRecibido: revision.informeRecibido,
          recibido: esRecibido,
          textoActual: texto.texto,
          historial,
          mensaje,
          anotaciones: anotacionesDelAbogado,
          verificaciones
        }),
        /*
         * 4.000 y no 2.500: una respuesta de la guía con tres puntos titulados
         * y una edición propuesta pasaba de 2.500 tokens y llegaba cortada a
         * mitad de frase, sin que nada lo dijera. Si aun así se corta, abajo
         * se declara.
         */
        4000
      ),
      LIMITE_LLAMADA_MS
    );
    await recordUsage({ firmId, userEmail, operation: 'CONSULTA_REVISION', operationId, usage: llamada.usage ?? null });
    if (!llamada.text || !llamada.text.trim()) {
      await refundReservation({ firmId, userEmail, operation: 'CONSULTA_REVISION', reason: 'el revisor no respondió' });
      res.status(502).json({ success: false, error: 'CHAT_FAILED', message: 'El revisor no respondió. No se descontó saldo.' });
      return;
    }
    const respuesta = parsearRespuestaDelTaller(llamada.text);
    /*
     * LA GARANTÍA VIVE AQUÍ, NO EN EL PROMPT. Un documento recibido no se
     * edita: ya está proferido. El prompt lo prohíbe, pero un prompt es una
     * petición y esto es una promesa — si el modelo devolviera una edición, la
     * pantalla pintaría un botón «Aplicar» sobre el auto de un juez.
     */
    if (esRecibido) respuesta.ediciones = [];
    if (llamada.truncated) {
      // El proveedor paró por longitud: lo escrito es lo que cupo. Se dice, y se
      // ofrece la salida, en vez de dejar una frase a medias como si fuera el final.
      respuesta.respuesta = `${respuesta.respuesta.trimEnd()}\n\n[La respuesta se cortó por longitud. Escriba «continúa» para que la guía siga desde aquí.]`;
    }
    const cobro = await settleOperation({
      firmId,
      userEmail,
      operation: 'CONSULTA_REVISION',
      operationId,
      reserved: reservado,
      description: `Consulta de revisión: ${revision.documentType} · ${revision.fileName}`
    });

    const ahora = new Date().toISOString();
    const turnos: TurnoDelTaller[] = [
      { rol: 'abogado', texto: mensaje, fecha: ahora },
      { rol: 'revisor', texto: respuesta.respuesta, ediciones: respuesta.ediciones, referencias: respuesta.referencias, fecha: ahora }
    ];
    const consentimiento = await documentReviewStore.consentimiento(firmId);
    const guardado = consentimiento.guarda ? await documentReviewStore.agregarTurnos(firmId, id, turnos, texto.texto) : false;

    await auditService.record({ firmId, userEmail, action: 'REVIEW_CHAT', resource: `${revision.documentType} · ${revision.fileName}`, ipAddress: ipDe(req) });

    res.json({ success: true, ...respuesta, turnos, guardado, cobradoCop: cobro.charged, saldoCop: cobro.balance });
  } catch (err) {
    if (err instanceof TiempoAgotado) {
      await refundReservation({ firmId, userEmail, operation: 'CONSULTA_REVISION', reason: 'la consulta superó el tiempo de la plataforma' });
      res.status(504).json({ success: false, error: 'CHAT_TIMEOUT', message: 'El revisor tardó más de lo que la plataforma permite. No se descontó saldo.' });
      return;
    }
    console.error('[REVIEW] Error en el taller:', err);
    await refundReservation({ firmId, userEmail, operation: 'CONSULTA_REVISION', reason: 'la consulta falló' });
    res.status(500).json({ success: false, error: 'CHAT_FAILED', message: 'No se pudo consultar al revisor. No se descontó saldo.' });
  }
};

/**
 * POST /api/agent/reviews/:id/rerevisar { textoActual }
 *
 * Una revisión completa nueva sobre el texto corregido. Cobra como REVISION.
 * Reemplaza el informe guardado; el anterior queda en la conversación como
 * un turno, para que se vea qué cambió.
 */
export const reReviewController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const userEmail = req.user?.email ?? 'desconocido';
  const id = String(req.params.id);

  try {
    await exigirFuncion(firmId, 'REVISIONES.REREVISAR');
  } catch (err) {
    if (responderPlanError(res, err)) return;
    throw err;
  }

  const revision = await documentReviewStore.obtener(firmId, id);
  if (!revision) {
    res.status(404).json({ success: false, error: 'REVIEW_NOT_FOUND', message: 'Esa revisión no existe o no es de su firma.' });
    return;
  }
  /*
   * NO SE REREVISA UN DOCUMENTO RECIBIDO, Y SE NIEGA ANTES DE COBRAR.
   *
   * Esta ruta rerevisa SIEMPRE con el prompt del escrito propio —«qué le falta
   * frente a la ficha, qué corregiría antes de presentarlo»—, que sobre un auto
   * ajeno no significa nada: no se va a presentar y no hay ficha suya contra la
   * que medirlo. Peor todavía, el informe resultante tiene la OTRA forma, así
   * que sobreescribiría el que sí sirve y la pantalla dejaría de reconocerlo.
   *
   * El frontend ya no ofrece el botón, pero eso no es una guarda: una guarda
   * vive donde está el dinero. Se niega aquí, antes de reservar saldo.
   */
  if (revision.modo === 'DOCUMENTO_RECIBIDO') {
    res.status(409).json({
      success: false,
      error: 'REREVIEW_NOT_APPLICABLE',
      message:
        'Esta revisión leyó un documento que usted recibió, no un escrito suyo. Volver a revisarlo no aplica: no se rerevisa lo que ya está proferido. No se descontó saldo.'
    });
    return;
  }

  const preparado = prepararTexto(typeof req.body.textoActual === 'string' ? req.body.textoActual : revision.textoTrabajo || '');
  if (preparado.caracteres < TEXTO_MINIMO) {
    res.status(422).json({ success: false, error: 'TEXT_TOO_SHORT', message: `El texto tiene ${preparado.caracteres} caracteres; un escrito revisable tiene al menos ${TEXTO_MINIMO}.` });
    return;
  }

  let reservado = 0;
  try {
    ({ reserved: reservado } = await reserveForOperation({ firmId, userEmail, operation: 'REVISION' }));
  } catch (err) {
    if (err instanceof BillingError) {
      res.status(err.status).json({ success: false, error: err.code, message: err.message });
      return;
    }
    throw err;
  }

  const operationId = randomUUID();
  try {
    const guidance = await buildCatalogGuidanceForFirm(firmId, revision.documentType, (revision.legalBranch ?? undefined) as LegalBranch | undefined);
    const llamada = await conLimite(
      callOpenRouterWithUsage(
        ENGINE.OPUS,
        buildReviewSystemPrompt(),
        buildReviewUserPrompt({ documentType: revision.documentType, guidance, pregunta: revision.pregunta, texto: preparado.texto, truncado: preparado.truncado }),
        MAX_TOKENS_INFORME
      ),
      LIMITE_LLAMADA_MS
    );
    await recordUsage({ firmId, userEmail, operation: 'REVISION', operationId, usage: llamada.usage ?? null });
    if (!llamada.text || !llamada.text.trim()) {
      await refundReservation({ firmId, userEmail, operation: 'REVISION', reason: 'la nueva revisión no produjo resultado' });
      res.status(502).json({ success: false, error: 'REVIEW_FAILED', message: 'El revisor no respondió. No se descontó saldo.' });
      return;
    }
    const informe = parsearInforme(llamada.text);
    const cobro = await settleOperation({
      firmId,
      userEmail,
      operation: 'REVISION',
      operationId,
      reserved: reservado,
      description: `Revisión: ${revision.documentType} · ${revision.fileName} (nueva revisión)`
    });

    const consentimiento = await documentReviewStore.consentimiento(firmId);
    let guardado = false;
    if (consentimiento.guarda) {
      const anterior = revision.informe?.resumen ? `Informe anterior: ${revision.informe.resumen}` : 'Informe anterior sin resumen legible.';
      await documentReviewStore.agregarTurnos(firmId, id, [
        { rol: 'revisor', texto: `Nueva revisión emitida sobre el texto corregido. ${anterior}`, fecha: new Date().toISOString() }
      ]);
      guardado = await documentReviewStore.actualizarInforme(firmId, id, informe, informe ? null : llamada.text, preparado.texto);
    }
    await auditService.record({ firmId, userEmail, action: 'DOCUMENT_REREVIEWED', resource: `${revision.documentType} · ${revision.fileName}`, ipAddress: ipDe(req) });

    res.json({
      success: true,
      informe,
      informeLibre: informe ? null : llamada.text,
      conFicha: guidance !== null,
      truncado: preparado.truncado,
      caracteres: preparado.caracteres,
      guardado,
      cobradoCop: cobro.charged,
      saldoCop: cobro.balance
    });
  } catch (err) {
    if (err instanceof TiempoAgotado) {
      await refundReservation({ firmId, userEmail, operation: 'REVISION', reason: 'la nueva revisión superó el tiempo de la plataforma' });
      res.status(504).json({ success: false, error: 'REVIEW_TIMEOUT', message: 'La revisión tardó más de lo que la plataforma permite. No se descontó saldo.' });
      return;
    }
    console.error('[REVIEW] Error en la nueva revisión:', err);
    await refundReservation({ firmId, userEmail, operation: 'REVISION', reason: 'la nueva revisión falló' });
    res.status(500).json({ success: false, error: 'REVIEW_FAILED', message: 'No se pudo revisar de nuevo. No se descontó saldo.' });
  }
};

/**
 * DELETE /api/agent/reviews/:id
 *
 * El archivo original se borra ANTES que la fila: la fila es lo único que sabe
 * dónde está el objeto, así que borrarla primero dejaría el escrito en el
 * bucket sin nada que lo nombre. Un fallo del almacenamiento no impide borrar
 * la revisión —se anota en consola—, porque un archivo suelto se puede barrer
 * a mano y una revisión a medias no.
 */
export const deleteReviewController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const id = String(req.params.id);
  const revision = await documentReviewStore.obtener(firmId, id);
  if (revision?.archivoOriginal) {
    const borrado = await b2.deleteObject(firmId, revision.archivoOriginal.clave).catch(() => false);
    if (!borrado) console.warn(`[REVIEW] El archivo original ${revision.archivoOriginal.clave} no se pudo borrar de B2 al eliminar la revisión ${id}.`);
  }
  const ok = await documentReviewStore.eliminar(firmId, id);
  res.status(ok ? 200 : 404).json({ success: ok });
};
