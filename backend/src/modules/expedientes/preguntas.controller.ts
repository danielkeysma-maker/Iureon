import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { auditService } from '../audit/audit.service';
import {
  BillingError,
  PRICE_COP,
  recordUsage,
  refundReservation,
  reserveForOperation,
  settleOperation,
  SUPLEMENTO_POR_PERSONA
} from '../billing/billing.service';
import { ENGINE, callOpenRouterWithUsage } from '../agent/openrouter.client';
import { conLimite, TiempoAgotado } from '../agent/review/documentReview.controller';
import { exigirFuncion, responderPlanError } from '../subscriptions/plan.service';
import { ExpedienteError, obtenerExpediente } from './expedientes.service';
import { guardarInterrogatorio } from './interrogatorios.service';
import { buscarPasajesDelExpediente } from './materialDelExpediente';
import {
  MAX_AUDIENCIA,
  MAX_PERSONAS_POR_TANDA,
  MAX_QUIERE_PROBAR,
  buildPreguntasSystemPrompt,
  buildPreguntasUserPrompt,
  interrogables,
  leerPreguntas
} from './preguntasDelExpediente';

/**
 * POST /api/expedientes/:id/preguntas
 *
 * Prepara el interrogatorio de personas CONCRETAS del expediente. Ver
 * `preguntasDelExpediente.ts` para el porqué de la forma.
 *
 * ─── POR QUÉ DEJÓ DE COBRARSE COMO `CONSULTA_REVISION` (16/09/2026) ────────
 *
 * Se cobraba con esa operación por continuidad del histórico: era la que
 * cobraban las preguntas colgadas de una revisión, el camino que este módulo
 * reemplazó. El argumento se cayó con una medición. Una consulta del taller
 * tiene piso de $300; una tanda de interrogatorio con material del expediente
 * cuesta $1.160 con una persona y $1.573 con dos. Y el piso NO es solo el
 * precio: es lo que se RESERVA antes de llamar al motor, así que una firma con
 * $300 de saldo lanzaba una operación de $1.500 y la diferencia la ponía la
 * casa. Un histórico ordenado no vale un cobro que no se puede recaudar.
 *
 * Ahora tiene operación propia —`INTERROGATORIO`, piso $2.000— y cada persona
 * después de la primera suma `SUPLEMENTO_POR_PERSONA`. La reserva, la
 * devolución y el cobro usan el MISMO suplemento: reservar el piso a secas y
 * cobrar el total dejaría un descubierto silencioso, y devolver el piso a
 * secas dejaría cobrado el resto de una tanda que nunca llegó.
 *
 * ─── EL PRESUPUESTO DE SALIDA CRECE CON LA GENTE ───────────────────────────
 *
 * Las preguntas por revisión pedían 3.500 tokens para tres listas. Aquí las
 * listas son tantas como personas se preparen, así que el tope se calcula por
 * cabeza en vez de fijarse: cuatro personas con doce preguntas cada una no
 * caben en el presupuesto de tres listas, y lo que se corta es la última
 * persona — la que el abogado puso de última porque le importaba menos, sí,
 * pero sin avisar.
 */

const OPERACION = 'INTERROGATORIO' as const;

/**
 * EL RELOJ DE ESTA LLAMADA, Y POR QUÉ NO ES EL DEL TALLER (16/09/2026).
 *
 * Usaba `LIMITE_LLAMADA_MS` —50 s—, que está medido para una revisión: un
 * informe de unos 3.000 tokens sobre un escrito. Un interrogatorio escribe otra
 * cosa: hasta veinte preguntas POR PERSONA, cada una con su respuesta probable,
 * su repregunta y su cita. Medido contra el motor el mismo día que subió el
 * tope: 39 s con una persona y 57 s con dos — o sea que la tanda de dos moría
 * en el reloj del taller antes de llegar, y la de una pasaba rozando. Desde
 * fuera eso se lee «No se pudo preparar el interrogatorio», con el saldo
 * devuelto y sin lista.
 *
 * La función tiene 300 s (`vercel.json`), así que el techo de 50 no lo imponía
 * la plataforma: lo imponía un número heredado de otra pantalla. Se le da el
 * suyo, por debajo del de la función para que corte ESTE código —y devuelva la
 * reserva diciendo por qué— y no la plataforma en seco.
 */
const LIMITE_DEL_INTERROGATORIO_MS = 240_000;

/** El piso de ESTA tanda: el de la operación más lo que suman las personas de más. */
const suplementoDe = (personas: number): number => SUPLEMENTO_POR_PERSONA * Math.max(0, personas - 1);
const pisoDeLaTanda = (personas: number): number => PRICE_COP[OPERACION] + suplementoDe(personas);

/**
 * Por persona, medido sobre el tamaño de las listas del endpoint que ya existe.
 *
 * ─── POR QUÉ SUBIÓ DE 1.100 A 2.700 (16 de septiembre de 2026) ─────────────
 *
 * Cada pregunta pasó de tres campos a seis: además de la pregunta y su «para
 * qué», ahora lleva la RESPUESTA PROBABLE, la REPREGUNTA con la que se sigue si
 * la da, y el CON QUÉ —nombre del documento y cita literal— con que se la
 * contradice. Medido sobre el propio formato: la pregunta y el «para qué» son
 * unos 55 tokens; la respuesta probable ~40, la repregunta ~35 y el `conQue`
 * ~70 con sus dos claves. Son unos 250 tokens por pregunta contra los ~90 de
 * antes, y el tope de ${MAX_PREGUNTAS_POR_PERSONA} preguntas por persona lo
 * multiplica.
 *
 * EL PRESUPUESTO SE CALCULA POR CABEZA, COMO ANTES, y por la misma razón: lo
 * que se corta al quedarse corto es la ÚLTIMA persona, la que el colega puso de
 * última porque le importaba menos — pero sin avisar.
 *
 * ─── Y POR QUÉ 2.700 TAMPOCO ALCANZÓ (16 de septiembre de 2026) ────────────
 *
 * La cuenta de arriba salió del formato, no de una medición, y se quedó corta
 * en el caso que importa. Medido contra el motor con este mismo prompt: una
 * persona SIN material del expediente consume 2.093 tokens de salida; CON los
 * seis pasajes que trae `buscarPasajesDelExpediente`, 3.102 — de los 3.300 que
 * había. Ciento noventa y ocho tokens de margen, y las citas del `conQue` son
 * justo lo que lo consume, así que el expediente mejor indexado era el más
 * expuesto a quedarse sin lista.
 *
 * Lo que se veía desde afuera: «La guía no devolvió preguntas legibles», una y
 * otra vez, sin pasar de ahí — porque un JSON cortado a mitad de pregunta no
 * se puede leer y `leerPreguntas` devolvía `null`. Hoy son 3.800 por cabeza
 * (23% sobre lo medido) y 1.200 de base, que es donde cabe el razonamiento del
 * motor; y si aun así se corta, `objetoDeLaRespuesta` rescata las preguntas
 * completas y la pantalla dice que la lista quedó recortada.
 */
const TOKENS_POR_PERSONA = 6_500;
/** El enfoque, la estructura del JSON y lo que el motor razona antes de escribir. */
const TOKENS_DE_BASE = 1_200;

const fallar = (res: Response, err: unknown, mensaje: string): void => {
  if (responderPlanError(res, err)) return;
  if (err instanceof ExpedienteError) {
    res.status(err.status).json({ success: false, error: err.code, message: err.message });
    return;
  }
  console.error('[EXPEDIENTES/PREGUNTAS] Error inesperado:', err);
  res.status(500).json({ success: false, error: 'QUESTIONS_FAILED', message: mensaje });
};

export const preguntasDelExpedienteController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId as string;
  const userEmail = req.user?.email ?? 'desconocido';

  let expediente;
  let aQuienes;
  try {
    /*
     * SE EXIGE LA FUNCIÓN, NO SOLO EL MÓDULO. Este endpoint gastaba saldo sin
     * comprobar ninguna función: bastaba con tener Expedientes encendido. El
     * operador que quiera dejar el módulo abierto y cerrar solo el
     * interrogatorio —lo caro— no tenía dónde hacerlo. `exigirFuncion` cubre
     * además todo lo que cubría `exigirModulo`: plan vencido, módulo fuera del
     * plan y módulo apagado dan el mismo 403 de antes.
     */
    await exigirFuncion(firmId, 'EXPEDIENTES.PREGUNTAS_AUDIENCIA');
    expediente = await obtenerExpediente(firmId, String(req.params.id));

    /*
     * SE PREGUNTA A QUIEN EL COLEGA ESCOGE, DE ENTRE LOS INTERROGABLES. Si no
     * escoge a nadie, se toman los primeros de la lista: obligar a marcar
     * casillas antes de ver una sola pregunta convierte una ayuda en un
     * formulario.
     */
    const pedidos: string[] = Array.isArray(req.body?.actorIds)
      ? (req.body.actorIds as unknown[]).map((x) => String(x))
      : [];
    const disponibles = interrogables(expediente);

    if (disponibles.length === 0) {
      res.status(422).json({
        success: false,
        error: 'SIN_INTERROGABLES',
        message:
          'Este expediente no tiene a nadie a quien preparar interrogatorio. Agregue las partes, los testigos o el perito, con su lado y sobre qué declaran.'
      });
      return;
    }

    aQuienes = (pedidos.length > 0 ? disponibles.filter((a) => pedidos.includes(a.id)) : disponibles).slice(
      0,
      MAX_PERSONAS_POR_TANDA
    );

    if (aQuienes.length === 0) {
      res.status(422).json({
        success: false,
        error: 'NADIE_ESCOGIDO',
        message: 'A ninguna de las personas escogidas se le prepara interrogatorio en este expediente.'
      });
      return;
    }
  } catch (err) {
    fallar(res, err, 'No se pudo preparar el interrogatorio.');
    return;
  }

  const quiereProbar = String(req.body?.quiereProbar ?? '').slice(0, MAX_QUIERE_PROBAR);
  const audiencia = String(req.body?.audiencia ?? '').slice(0, MAX_AUDIENCIA);

  let reservado = 0;
  try {
    ({ reserved: reservado } = await reserveForOperation({
      firmId,
      userEmail,
      operation: OPERACION,
      suplementoCop: suplementoDe(aQuienes.length)
    }));
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
     * ─── LO QUE EL EXPEDIENTE INDEXADO APORTA AL INTERROGATORIO ────────────
     *
     * Si el abogado indexó el expediente, aquí es donde eso empieza a rendir:
     * en vez de preparar preguntas solo con los nombres de los actores, se
     * recuperan los fragmentos del caso que hablan de lo que quiere probar y
     * de quién va a interrogar.
     *
     * SE BUSCA DENTRO DEL EXPEDIENTE, no en toda la firma. Sin ese cerco,
     * preparar el interrogatorio de «Mosquera» traería párrafos del caso de
     * otro cliente — y el motor los usaría creyendo que son de éste.
     *
     * LA CONSULTA SE ARMA CON LO QUE EL COLEGA DIJO Y CON LOS NOMBRES, no con
     * una frase genérica: buscar «interrogatorio» en un expediente devuelve
     * las actas de audiencia, no los hechos que hay que probar.
     *
     * NUNCA TUMBA NADA. Sin proveedor de embeddings, sin índice o con un fallo
     * de red, la búsqueda devuelve vacío y el interrogatorio se prepara como
     * antes. Es un extra, no un requisito.
     *
     * LA RECUPERACIÓN ES COMPARTIDA (`materialDelExpediente.ts`). Redacción y
     * Revisión traen los mismos pasajes por el mismo camino; lo que cambia es
     * cómo se rinden dentro del encargo, y eso sí es de cada pantalla. Esta
     * escribe su propio `material` porque `buildPreguntasUserPrompt` lo pide
     * con esa forma.
     */
    let material: { que: string; texto: string; truncado: boolean } | null = null;
    const consulta = [quiereProbar, audiencia, ...aQuienes.map((a) => `${a.nombre} ${a.sobreQue ?? ''}`)]
      .map((t) => t.trim())
      .filter(Boolean)
      .join('. ');
    const pasajes = await buscarPasajesDelExpediente(firmId, expediente.id, consulta);
    if (pasajes.length > 0) {
      material = {
        que: `${pasajes.length} pasaje(s) del expediente indexado`,
        texto: pasajes.map((p) => `[${p.archivo ?? 'documento del caso'}] ${p.texto}`).join('\n\n'),
        truncado: true
      };
      console.log(`[EXPEDIENTES/PREGUNTAS] ${pasajes.length} fragmentos del caso recuperados.`);
    }

    const llamada = await conLimite(
      callOpenRouterWithUsage(
        ENGINE.OPUS,
        buildPreguntasSystemPrompt(),
        buildPreguntasUserPrompt({ expediente, aQuienes, quiereProbar, audiencia, material }),
        TOKENS_DE_BASE + TOKENS_POR_PERSONA * aQuienes.length,
        undefined,
        /* El cliente aborta Opus a los 120 s por su cuenta: sin esto, el reloj de arriba no llegaría a usarse nunca. */
        { timeoutMs: LIMITE_DEL_INTERROGATORIO_MS - 10_000 }
      ),
      LIMITE_DEL_INTERROGATORIO_MS
    );

    await recordUsage({ firmId, userEmail, operation: OPERACION, operationId, usage: llamada.usage ?? null });

    /*
     * LOS MISMOS PASAJES QUE VIERON AL MOTOR SON CON LOS QUE SE LE COTEJA.
     * `leerPreguntas` tira todo «con qué» cuya cita no esté literalmente en
     * ellos, y toma el nombre del documento del pasaje en el que apareció, no
     * del que el modelo dijo. Sin pasajes no hay ninguno, que es lo correcto:
     * un expediente sin indexar no tiene con qué contradecir a nadie.
     */
    const preguntas = llamada.text ? leerPreguntas(llamada.text, aQuienes, userEmail, pasajes) : null;
    if (!preguntas) {
      /*
       * QUÉ SE REGISTRA Y POR QUÉ. Sin esto, el fallo llega como una frase en
       * pantalla y no hay forma de saber si el motor se cortó, devolvió otra
       * cosa o no devolvió nada: son tres causas distintas con tres arreglos
       * distintos. Va el TAMAÑO y si el proveedor cortó por longitud, nunca el
       * texto: son las preguntas del interrogatorio de un caso real.
       */
      console.error(
        `[EXPEDIENTES/PREGUNTAS] Ilegible: ${llamada.text?.length ?? 0} caracteres, cortado por longitud: ${
          llamada.truncated ? 'sí' : 'no'
        }, personas: ${aQuienes.length}, pasajes: ${pasajes.length}.`
      );
      /*
       * NADIE PAGA POR LO QUE NO RECIBIÓ. Se devuelve la reserva ANTES de
       * responder, porque una función serverless se congela al responder y un
       * reembolso «para después» no ocurre.
       */
      await refundReservation({
        firmId,
        userEmail,
        operation: OPERACION,
        suplementoCop: suplementoDe(aQuienes.length),
        reason: 'la guía no produjo preguntas legibles'
      });
      res.status(502).json({
        success: false,
        error: 'QUESTIONS_FAILED',
        message: 'La guía no devolvió preguntas legibles. No se descontó saldo. Inténtelo de nuevo.'
      });
      return;
    }

    const cobro = await settleOperation({
      firmId,
      userEmail,
      operation: OPERACION,
      operationId,
      reserved: reservado,
      suplementoCop: suplementoDe(aQuienes.length),
      description:
        aQuienes.length > 1
          ? `Interrogatorio de ${aQuienes.length} personas: ${expediente.caratula}`
          : `Interrogatorio: ${expediente.caratula}`
    });

    /*
     * ─── SE GUARDA DESPUÉS DE COBRAR, Y ANTES DE RESPONDER ─────────────────
     *
     * DESPUÉS DE COBRAR, porque lo que se archiva es lo que la firma compró: un
     * intento que no llegó a cobrarse no tiene por qué dejar rastro en el
     * expediente. ANTES DE RESPONDER, porque una función serverless se congela
     * al responder y un guardado «para después» sencillamente no ocurre — la
     * misma cicatriz que dejó el borrado del audio de las audiencias.
     *
     * Y NO SE COMPRUEBA EL RESULTADO: `guardarInterrogatorio` devuelve `null`
     * cuando no pudo, sin lanzar. El abogado ya pagó y las preguntas ya están
     * listas; negárselas porque la base no aceptó la fila sería quitarle el
     * trabajo que acaba de comprar por no haber podido archivarlo. El fallo se
     * grita en la consola del servidor, que es donde alguien puede arreglarlo.
     */
    const guardado = await guardarInterrogatorio({
      firmId,
      expedienteId: expediente.id,
      creadoPor: userEmail,
      queSeQueriaProbar: quiereProbar,
      audiencia,
      preguntas,
      modelo: ENGINE.OPUS,
      cobradoCop: cobro.charged
    });

    /*
     * A LA AUDITORÍA VA EL ASUNTO Y CUÁNTA GENTE, no las preguntas. Qué se le
     * va a preguntar a un testigo es estrategia del abogado y del cliente, y
     * ahora con más razón: la respuesta probable y la cita con que se lo
     * contradice son la estrategia entera.
     */
    await auditService.record({
      firmId,
      userEmail,
      action: 'EXPEDIENTE_INTERROGATORIO',
      resource: `${expediente.caratula} · ${aQuienes.length} persona(s)`,
      ipAddress: (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ?? req.ip ?? ''
    });

    res.json({
      success: true,
      preguntas,
      /*
       * La ficha de lo guardado viaja en la misma respuesta, para que la lista
       * de «Interrogatorios preparados» muestre la tanda recién hecha sin
       * volver a preguntarle al servidor. `null` cuando no se pudo guardar: la
       * pantalla lo dice en vez de enseñar una lista que no la tiene.
       */
      guardado,
      cobradoCop: cobro.charged,
      saldoCop: cobro.balance,
      precioCop: pisoDeLaTanda(aQuienes.length)
    });
  } catch (err) {
    /*
     * EL RELOJ SE DICE APARTE DEL RESTO DE FALLOS. «No se pudo preparar» sirve
     * para todo y por eso no sirve para nada: el colega no sabe si reintentar,
     * si quitar gente de la tanda o si el problema es suyo. Un plazo agotado
     * tiene una salida concreta —menos personas— y se le dice.
     */
    const porElReloj = err instanceof TiempoAgotado;
    await refundReservation({
      firmId,
      userEmail,
      operation: OPERACION,
      suplementoCop: suplementoDe(aQuienes.length),
      reason: porElReloj ? 'el interrogatorio tardó más de lo que la plataforma permite' : 'la guía no pudo completarse'
    });
    if (porElReloj) {
      console.error(`[EXPEDIENTES/PREGUNTAS] Plazo agotado con ${aQuienes.length} persona(s).`);
      res.status(504).json({
        success: false,
        error: 'QUESTIONS_TIMEOUT',
        message:
          aQuienes.length > 1
            ? 'El interrogatorio tardó más de lo que la plataforma permite. No se descontó saldo. Prepárelo con menos personas por tanda.'
            : 'El interrogatorio tardó más de lo que la plataforma permite. No se descontó saldo. Inténtelo de nuevo.'
      });
      return;
    }
    fallar(res, err, 'No se pudo preparar el interrogatorio. No se descontó saldo.');
  }
};
