import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  MINIMO_DE_CITA,
  documentoDeLaCita,
  leerPreguntas,
  objetoDeLaRespuesta,
  type PasajeParaCotejar
} from '../preguntasDelExpediente';
import { puedeBorrarInterrogatorio } from '../interrogatorios.service';
import type { ActorDelExpediente } from '../types';

/**
 * EL INTERROGATORIO QUE SE GUARDA, Y LA RESPUESTA QUE SE ANTICIPA.
 *
 * Run with: npm run check:interrogatorios
 *
 * Pura: sin base de datos y sin red. Vigila las cinco cosas que, de torcerse,
 * no fallan a la vista:
 *
 *   1. LA CITA QUE NADIE COMPROBÓ NO SE PUBLICA. Un «con qué» cuya cita no esté
 *      literalmente en los pasajes recuperados se cae entero. Es el mismo
 *      defecto que la casa ya conoce —una cita inventada se lee igual de bien
 *      que una real—, y aquí acaba leída en voz alta delante de un juez.
 *   2. EL DOCUMENTO LO PONE EL CÓDIGO. Comprobar la cita y creerle el archivo
 *      al modelo dejaría entrar la atribución falsa por la puerta de atrás.
 *   3. UNA RESPUESTA A MEDIAS DEGRADA, NO TUMBA. Al colega ya se le cobró: una
 *      lista sin la respuesta probable le sigue sirviendo para la audiencia.
 *   4. LA TANDA SE LEE FILTRADA POR FIRMA Y POR EXPEDIENTE, las dos siempre.
 *      El backend entra con service_role y omite RLS: el filtro ES el
 *      aislamiento.
 *   5. LAS PREGUNTAS NO VAN A LA AUDITORÍA. Nunca.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const RAIZ = join(process.cwd(), 'src');
const leer = (rel: string): string => readFileSync(join(RAIZ, rel), 'utf8');

/* El código sin comentarios: la documentación de un defecto no debe cazar a su guarda. */
const sinComentarios = (fuente: string): string =>
  fuente.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/.*$/gm, ' ');

const cuerpoDe = (fuente: string, declaracion: string): string => {
  const inicio = fuente.indexOf(declaracion);
  if (inicio === -1) return '';
  const fin = fuente.indexOf('export ', inicio + declaracion.length);
  return fuente.slice(inicio, fin === -1 ? undefined : fin);
};

/* ─── LOS DATOS DE JUGUETE ──────────────────────────────────────────────── */

const TESTIGO: ActorDelExpediente = {
  id: 'a1',
  expedienteId: 'e1',
  nombre: 'Tomás Wilches',
  papel: 'TESTIGO',
  lado: 'CONTRARIO',
  sobreQue: 'la entrega del inmueble',
  identificacion: null,
  notas: null,
  clienteId: null,
  createdAt: '2026-09-16T00:00:00.000Z'
};

/**
 * El pasaje trae la frase literal que el modelo debe copiar. Se escribe con
 * tildes y mayúsculas distintas de las que usará la cita a propósito: lo que la
 * comparación perdona es la ortografía del copiado, no la ausencia del pasaje.
 */
const PASAJES: PasajeParaCotejar[] = [
  {
    archivo: 'Acta de entrega.pdf',
    texto:
      'El inmueble fue entregado el quince de marzo en perfecto estado de conservación, según constató el perito.'
  },
  {
    archivo: 'Contestación de la demanda.pdf',
    texto: 'La parte demandada niega haber recibido las llaves antes del mes de abril.'
  }
];

const CITA_REAL = 'entregado el quince de marzo en perfecto estado';

const respuesta = (preguntas: unknown[]): string =>
  JSON.stringify({ enfoque: 'Probar el estado del inmueble al entregarse.', porPersona: [{ actorId: 'a1', preguntas }] });

const primera = (crudo: string, pasajes: PasajeParaCotejar[] = PASAJES) => {
  const r = leerPreguntas(crudo, [TESTIGO], 'abogada@firma.co', pasajes);
  return { r, p: r?.porPersona[0]?.preguntas[0] };
};

/* ─── 1. LOS TRES CAMPOS NUEVOS, COMPLETOS ──────────────────────────────── */

const completa = primera(
  respuesta([
    {
      pregunta: '¿Usted recibió el inmueble el quince de marzo?',
      paraQue: 'Fijar la fecha de entrega.',
      respuestaProbable: 'Dirá que lo recibió después y en mal estado.',
      repregunta: '¿Firmó usted el acta de entrega de esa fecha?',
      conQue: { documento: 'Acta de entrega.pdf', cita: CITA_REAL }
    }
  ])
);
check('la respuesta probable entra', completa.p?.respuestaProbable === 'Dirá que lo recibió después y en mal estado.');
check('la repregunta entra', completa.p?.repregunta === '¿Firmó usted el acta de entrega de esa fecha?');
check(
  'el «con qué» entra con su documento y su cita',
  completa.p?.conQue?.documento === 'Acta de entrega.pdf' && completa.p?.conQue?.cita === CITA_REAL,
  JSON.stringify(completa.p?.conQue)
);
check('y la tanda declara que hubo material con qué cotejar', completa.r?.conMaterial === true);

/* ─── 2. A MEDIAS, Y SIN NADA: LA FORMA DE SIEMPRE ──────────────────────── */

const aMedias = primera(
  respuesta([
    {
      pregunta: '¿Cuándo recibió el inmueble?',
      paraQue: 'Fijar la fecha.',
      respuestaProbable: 'Dirá que en abril.'
    }
  ])
);
check(
  'con solo la respuesta probable, la pregunta entra igual',
  aMedias.p?.pregunta === '¿Cuándo recibió el inmueble?' &&
    aMedias.p?.respuestaProbable === 'Dirá que en abril.' &&
    aMedias.p?.repregunta === undefined &&
    aMedias.p?.conQue === undefined
);

const vieja = primera(
  respuesta([{ pregunta: '¿Cuándo recibió el inmueble?', paraQue: 'Fijar la fecha.', delMaterial: 'un pasaje' }])
);
check(
  'una respuesta con la forma de antes sigue leyéndose entera',
  vieja.p?.pregunta === '¿Cuándo recibió el inmueble?' && vieja.p?.delMaterial === 'un pasaje'
);

const basura = primera(
  respuesta([
    {
      pregunta: '¿Cuándo recibió el inmueble?',
      paraQue: 'Fijar la fecha.',
      respuestaProbable: null,
      repregunta: 42,
      conQue: 'no soy un objeto'
    }
  ])
);
check(
  'campos nuevos con tipos absurdos no tumban la pregunta',
  basura.p?.pregunta === '¿Cuándo recibió el inmueble?' && basura.p?.conQue === undefined,
  JSON.stringify(basura.p)
);
check(
  'y un número en «repregunta» se lee como el texto que es, no se descarta la pregunta',
  basura.p?.repregunta === '42'
);

/* ─── 3. LA REGLA DURA: LA CITA QUE NO ESTÁ, SE CAE ─────────────────────── */

const inventada = primera(
  respuesta([
    {
      pregunta: '¿Recibió el inmueble en mal estado?',
      paraQue: 'Desvirtuar su versión.',
      conQue: {
        documento: 'Acta de entrega.pdf',
        cita: 'el inmueble presentaba humedades graves en todas las habitaciones'
      }
    }
  ])
);
check(
  'un «con qué» cuya cita no está en los pasajes se cae entero',
  inventada.p !== undefined && inventada.p.conQue === undefined
);
check('pero la pregunta sobrevive: el colega ya pagó', inventada.p?.pregunta === '¿Recibió el inmueble en mal estado?');

const sinPasajes = primera(
  respuesta([
    {
      pregunta: '¿Recibió el inmueble el quince de marzo?',
      paraQue: 'Fijar la fecha.',
      conQue: { documento: 'Acta de entrega.pdf', cita: CITA_REAL }
    }
  ]),
  []
);
check('sin pasajes recuperados no hay un solo «con qué»', sinPasajes.p?.conQue === undefined);
check(
  'y la tanda dice que no hubo material, para que nadie lea «no hay con qué» como un hallazgo',
  sinPasajes.r?.conMaterial === false
);

/* ─── 4. EL DOCUMENTO SALE DEL PASAJE, NO DEL MODELO ────────────────────── */

const malAtribuida = primera(
  respuesta([
    {
      pregunta: '¿Recibió el inmueble el quince de marzo?',
      paraQue: 'Fijar la fecha.',
      /* La cita es REAL y está en el acta; el modelo la atribuye a otro archivo. */
      conQue: { documento: 'Dictamen pericial.pdf', cita: CITA_REAL }
    }
  ])
);
check(
  'una cita real atribuida al archivo equivocado se corrige, no se publica',
  malAtribuida.p?.conQue?.documento === 'Acta de entrega.pdf',
  String(malAtribuida.p?.conQue?.documento)
);

check(
  'la comparación perdona tildes, mayúsculas y puntuación del copiado',
  documentoDeLaCita('ENTREGADO EL QUINCE DE MARZO, EN PERFECTO ESTADO', PASAJES) === 'Acta de entrega.pdf'
);
check(
  'un pasaje sin nombre de archivo no deja el «con qué» sin documento',
  documentoDeLaCita(CITA_REAL, [{ archivo: null, texto: PASAJES[0].texto }]) === 'documento del caso'
);
check(
  'una cita demasiado corta no prueba que nadie leyera nada',
  documentoDeLaCita('el inmueble', PASAJES) === null && MINIMO_DE_CITA === 15
);
check(
  'y la cita se busca en TODOS los pasajes, no solo en el primero',
  documentoDeLaCita('niega haber recibido las llaves', PASAJES) === 'Contestación de la demanda.pdf'
);

/* ─── 5. EL ACTOR SIGUE MANDANDO SOBRE LO QUE DIGA EL MODELO ────────────── */

const ajeno = leerPreguntas(
  JSON.stringify({ enfoque: 'x', porPersona: [{ actorId: 'inventado', preguntas: [{ pregunta: '¿Y usted?' }] }] }),
  [TESTIGO],
  'abogada@firma.co',
  PASAJES
);
check('una lista atribuida a un actor que no está en la tanda se descarta', ajeno === null);

/* ─── 5 bis. LA RESPUESTA QUE LLEGA CORTADA ─────────────────────────────── */

/*
 * EL DEFECTO QUE ESTO VIGILA, MEDIDO: una persona con los seis pasajes del
 * expediente consumía 3.102 tokens de salida de los 3.300 que había. Cuando se
 * pasaba, el JSON quedaba abierto a mitad de pregunta, `JSON.parse` fallaba, y
 * el colega recibía «la guía no devolvió preguntas legibles» —sin lista y sin
 * saber por qué— aunque once preguntas hubieran llegado enteras.
 */
const COMPLETO = JSON.stringify({
  enfoque: 'Quién pagó el inmueble.',
  porPersona: [
    {
      actorId: TESTIGO.id,
      preguntas: [1, 2, 3, 4, 5].map((n) => ({
        pregunta: `Diga cómo le consta el hecho número ${n}.`,
        paraQue: 'Fijar el hecho.',
        respuestaProbable: 'Dirá que no le consta.',
        repregunta: 'Explique entonces por qué lo afirmó.'
      }))
    }
  ]
});
const CORTADO = COMPLETO.slice(0, Math.floor(COMPLETO.length * 0.72));

const entero = objetoDeLaRespuesta(COMPLETO);
check('una respuesta entera se lee y NO se marca recortada', entero !== null && entero.recortado === false);

const rescatado = leerPreguntas(CORTADO, [TESTIGO], 'abogada@firma.co', PASAJES);
check(
  'una respuesta cortada a mitad de pregunta entrega las preguntas completas en vez de nada',
  rescatado !== null && (rescatado.porPersona[0]?.preguntas.length ?? 0) > 0,
  rescatado === null ? 'devolvió null' : `${rescatado.porPersona[0]?.preguntas.length} preguntas`
);
check('y las que entrega están enteras: ninguna a medias', (rescatado?.porPersona[0]?.preguntas ?? []).every((q) => q.pregunta.endsWith('.')));
check('y no se calla que quedó recortada', rescatado?.recortado === true);
check('lo que no alcanza a traer una pregunta completa sigue siendo ilegible', objetoDeLaRespuesta('{"enfoque": "a med') === null);

/*
 * EL PRESUPUESTO NO PUEDE VOLVER A BAJAR DE LO MEDIDO. El rescate de arriba es
 * la red, no la corrección: una lista recortada sigue siendo una lista a la que
 * le faltan preguntas pagadas.
 */
const PRESUPUESTO = sinComentarios(leer('modules/expedientes/preguntas.controller.ts'));
const porPersona = /const TOKENS_POR_PERSONA = ([\d_]+);/.exec(PRESUPUESTO);
const deBase = /const TOKENS_DE_BASE = ([\d_]+);/.exec(PRESUPUESTO);
const tokens = (m: RegExpExecArray | null): number => Number((m?.[1] ?? '0').replace(/_/g, ''));
check(
  'el presupuesto por persona cubre con margen los 3.102 tokens medidos con material',
  tokens(porPersona) >= 3_700,
  `${tokens(porPersona)} por persona`
);
check('y la base deja sitio para lo que el motor razona antes de escribir', tokens(deBase) >= 1_000, `${tokens(deBase)} de base`);

/* ─── 5 ter. EL COBRO DE LA TANDA ───────────────────────────────────────── */

/*
 * EL DEFECTO QUE ESTO VIGILA: se cobraba como `CONSULTA_REVISION`, piso $300, y
 * el piso es lo que se RESERVA antes de llamar al motor. Medido el mismo día,
 * una tanda con material cuesta $1.160 con una persona y $1.573 con dos: una
 * firma con $300 de saldo lanzaba una operación de $1.500 y la diferencia la
 * ponía la casa. Reservar menos de lo que la operación va a costar es prestar
 * sin decirlo.
 */
const PREGUNTAS_CTRL = sinComentarios(leer('modules/expedientes/preguntas.controller.ts'));
const BILLING = sinComentarios(leer('modules/billing/billing.service.ts'));

check('el interrogatorio tiene operación propia', PREGUNTAS_CTRL.includes("const OPERACION = 'INTERROGATORIO' as const;"));
check('con piso propio en la tabla de precios', /INTERROGATORIO: [1-9][\d_]*,/.test(BILLING));
check('y un suplemento por cada persona de más', /SUPLEMENTO_POR_PERSONA = [1-9][\d_]*;/.test(BILLING));
check(
  'el suplemento solo cuenta a partir de la segunda persona',
  PREGUNTAS_CTRL.includes('SUPLEMENTO_POR_PERSONA * Math.max(0, personas - 1)')
);
/*
 * LAS TRES LLAMADAS LLEVAN EL MISMO SUPLEMENTO O EL DINERO NO CUADRA: reservar
 * el piso y cobrar el total deja un descubierto; devolver el piso deja cobrado
 * el resto de una tanda que nunca llegó.
 */
const conSuplemento = (fragmento: string): boolean => {
  const i = PREGUNTAS_CTRL.indexOf(fragmento);
  return i >= 0 && PREGUNTAS_CTRL.slice(i, i + 400).includes('suplementoCop: suplementoDe(aQuienes.length)');
};
check('la reserva lleva el suplemento', conSuplemento('reserveForOperation({'));
check('el cobro final lleva el mismo suplemento', conSuplemento('settleOperation({'));
const devoluciones = [...PREGUNTAS_CTRL.matchAll(/refundReservation\(\{[\s\S]{0,400}?\}\)/g)].map((m) => m[0]);
check(
  'y TODAS las devoluciones también',
  devoluciones.length >= 2 && devoluciones.every((d) => d.includes('suplementoCop: suplementoDe(aQuienes.length)')),
  `${devoluciones.length} devoluciones`
);
check(
  'el piso que se le informa a la pantalla es el de ESTA tanda, no el de la operación',
  PREGUNTAS_CTRL.includes('precioCop: pisoDeLaTanda(aQuienes.length)')
);
check(
  'el suplemento sube el piso dentro de priceFor, sin dejar de comparar con lo medido',
  BILLING.includes('const piso = base + Math.max(0, Math.round(suplementoCop));') &&
    BILLING.includes('return Math.max(piso, medido);')
);

/* ─── 5 quater. EL RELOJ DE LA TANDA ────────────────────────────────────── */

/*
 * EL DEFECTO QUE ESTO VIGILA: la llamada usaba `LIMITE_LLAMADA_MS`, los 50 s
 * medidos para una revisión. Un interrogatorio escribe hasta veinte preguntas
 * por persona con su respuesta probable, su repregunta y su cita: medido, 39 s
 * con una persona y 57 s con dos. La tanda de dos moría en el reloj de otra
 * pantalla y salía como «No se pudo preparar el interrogatorio».
 */
const LIMITE = Number((/LIMITE_DEL_INTERROGATORIO_MS = ([\d_]+);/.exec(PREGUNTAS_CTRL)?.[1] ?? '0').replace(/_/g, ''));
const MAX_DURACION_MS =
  Number(/"maxDuration": (\d+)/.exec(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8'))?.[1] ?? '0') * 1000;

check('el interrogatorio no usa el reloj del taller', !PREGUNTAS_CTRL.includes('LIMITE_LLAMADA_MS'));
check('tiene el suyo, con sitio para la tanda de dos personas medida en 57 s', LIMITE >= 120_000, `${LIMITE} ms`);
check(
  'y queda POR DEBAJO del reloj de la función, para que corte este código y devuelva la reserva',
  MAX_DURACION_MS > 0 && LIMITE < MAX_DURACION_MS,
  `${LIMITE} ms contra ${MAX_DURACION_MS} ms`
);
check(
  'el cliente recibe su propio plazo: si no, aborta Opus a los 120 s y el de arriba no se usa nunca',
  PREGUNTAS_CTRL.includes('{ timeoutMs: LIMITE_DEL_INTERROGATORIO_MS - 10_000 }')
);
check(
  'un plazo agotado se dice aparte de los demás fallos, con la salida concreta',
  PREGUNTAS_CTRL.includes("error: 'QUESTIONS_TIMEOUT'") && PREGUNTAS_CTRL.includes('con menos personas por tanda')
);

/* ─── 6. QUIÉN PUEDE BORRAR UNA TANDA ───────────────────────────────────── */

const DE = 'autora@firma.co';
check(
  'quien la preparó puede borrarla',
  puedeBorrarInterrogatorio({ creadoPor: DE, email: DE, role: 'LAWYER' })
);
check(
  'y da igual cómo escriba su correo: se compara sin mayúsculas ni espacios',
  puedeBorrarInterrogatorio({ creadoPor: DE, email: '  Autora@Firma.CO ', role: 'LAWYER' })
);
check(
  'el socio administrador puede borrar la de cualquiera',
  puedeBorrarInterrogatorio({ creadoPor: DE, email: 'socio@firma.co', role: 'FIRM_ADMIN' })
);
check(
  'otro abogado de la misma firma NO puede',
  !puedeBorrarInterrogatorio({ creadoPor: DE, email: 'colega@firma.co', role: 'LAWYER' })
);
check(
  'el operador de la plataforma tampoco entra por el rol',
  !puedeBorrarInterrogatorio({ creadoPor: DE, email: 'operacion@iureon.co', role: 'SUPER_ADMIN' })
);
check(
  'y una sesión sin correo no borra nada',
  !puedeBorrarInterrogatorio({ creadoPor: DE, email: null, role: null }) &&
    !puedeBorrarInterrogatorio({ creadoPor: DE, email: '   ', role: 'LAWYER' })
);

/* ─── 7. LAS CONSULTAS, FIRMA Y EXPEDIENTE SIEMPRE ──────────────────────── */

const SERVICIO = sinComentarios(leer('modules/expedientes/interrogatorios.service.ts'));

for (const fn of [
  'export const listarInterrogatorios',
  'export const obtenerInterrogatorio',
  'export const borrarInterrogatorio'
]) {
  const cuerpo = cuerpoDe(SERVICIO, fn);
  check(
    `${fn.replace('export const ', '')} filtra por firma`,
    cuerpo.includes(".eq('firm_id', firmId)") || cuerpo.includes(".eq('firm_id', d.firmId)"),
    cuerpo ? '' : 'no se encontró el cuerpo'
  );
  check(
    `${fn.replace('export const ', '')} filtra también por expediente`,
    cuerpo.includes(".eq('expediente_id', expedienteId)") || cuerpo.includes(".eq('expediente_id', d.expedienteId)")
  );
}

check(
  'abrir una tanda por id NO se conforma con el id: lleva las dos condiciones',
  cuerpoDe(SERVICIO, 'export const obtenerInterrogatorio').includes(".eq('id', id)")
);
check(
  'guardar no lanza: un fallo de escritura no le quita al colega lo que ya pagó',
  cuerpoDe(SERVICIO, 'export const guardarInterrogatorio').includes('return null')
);
check(
  'la lista arma los nombres desde el resultado guardado, sin una columna que se quede vieja',
  SERVICIO.includes('nombresDe(fila.personas)')
);
check(
  'y la más nueva va primero',
  SERVICIO.includes("order('creado_el', { ascending: false })")
);

/* ─── 8. LA AUDITORÍA NO LLEVA UNA SOLA PREGUNTA ────────────────────────── */

const CONTROLADOR = leer('modules/expedientes/preguntas.controller.ts');
const registro = CONTROLADOR.slice(
  CONTROLADOR.indexOf('await auditService.record('),
  CONTROLADOR.indexOf('res.json(', CONTROLADOR.indexOf('await auditService.record('))
);
check('se registra la acción declarada para esto', registro.includes("action: 'EXPEDIENTE_INTERROGATORIO'"));
check(
  'al rastro van la carátula y cuánta gente, y nada más',
  registro.includes('${expediente.caratula} · ${aQuienes.length} persona(s)'),
  registro.trim()
);
check(
  'ni las preguntas, ni la respuesta probable, ni las citas llegan al rastro',
  !/preguntas|respuestaProbable|conQue|repregunta/.test(registro)
);
const UNION = leer('modules/audit/audit.service.ts');
const CTRL_BORRADO = leer('modules/expedientes/interrogatorios.controller.ts');
check('la acción está declarada en la unión del backend', UNION.includes("| 'EXPEDIENTE_INTERROGATORIO'"));

/* ─── 8 bis. BORRAR TAMBIÉN DEJA RASTRO ─────────────────────────────────── */

/*
 * Material privilegiado, PAGADO y sin papelera: que desaparezca sin rastro es
 * el hueco que esta casa cierra. Y el rastro dice lo que se perdió —el caso,
 * cuánta gente, quién lo había preparado—, nunca lo que decía.
 */
check(
  'la acción de borrado está declarada en la unión del backend',
  UNION.includes("| 'EXPEDIENTE_INTERROGATORIO_DELETED'")
);
const registroDelBorrado = (() => {
  const i = CTRL_BORRADO.indexOf('await auditService.record(');
  return i === -1 ? '' : CTRL_BORRADO.slice(i, CTRL_BORRADO.indexOf('res.json(', i));
})();
check('eliminar una tanda se registra', registroDelBorrado.includes("action: 'EXPEDIENTE_INTERROGATORIO_DELETED'"));
check(
  'con la carátula, cuánta gente cubría y quién la había preparado',
  registroDelBorrado.includes('${expediente.caratula} · ${borrado.personas.length} persona(s) · lo preparó ${borrado.creadoPor}'),
  registroDelBorrado.trim()
);
check(
  'y sin una sola pregunta: borrarlo de la tabla y copiarlo al registro no sería borrarlo',
  !/\.preguntas|respuestaProbable|conQue|repregunta/.test(registroDelBorrado)
);
check(
  'el rastro se escribe DESPUÉS de que el borrado tuvo éxito, no antes',
  (() => {
    const sin = sinComentarios(CTRL_BORRADO);
    const iBorra = sin.indexOf('await borrarInterrogatorio(');
    const iRastro = sin.indexOf('await auditService.record(');
    const iRes = sin.indexOf('res.json({ success: true })');
    return iBorra > 0 && iRastro > iBorra && iRes > iRastro;
  })()
);

/* ─── 9. SE GUARDA DESPUÉS DE COBRAR Y ANTES DE RESPONDER ───────────────── */

const orden = sinComentarios(CONTROLADOR);
const iCobro = orden.indexOf('await settleOperation(');
const iGuardado = orden.indexOf('await guardarInterrogatorio(');
const iRespuesta = orden.indexOf('res.json({', iCobro);
check(
  'la tanda se archiva después de cobrarla',
  iCobro > 0 && iGuardado > iCobro,
  `cobro ${iCobro}, guardado ${iGuardado}`
);
check(
  'y antes de responder: una función serverless se congela al responder',
  iGuardado > 0 && iRespuesta > iGuardado,
  `guardado ${iGuardado}, respuesta ${iRespuesta}`
);
check(
  'el cotejo usa los mismos pasajes que vio el motor',
  orden.includes('leerPreguntas(llamada.text, aQuienes, userEmail, pasajes)')
);

/* ─── 10. EL PROMPT DICE LA REGLA QUE EL SERVIDOR APLICA ────────────────── */

const PROMPT = leer('modules/expedientes/preguntasDelExpediente.ts');
for (const campo of ['respuestaProbable', 'repregunta', 'conQue']) {
  check(`el prompt pide "${campo}"`, PROMPT.includes(`"${campo}"`));
}
check(
  'y le avisa de que el servidor tira la cita que no encuentre',
  PROMPT.includes('TIRA el "conQue" entero si no la encuentra')
);
/*
 * ESTE CHECK PEDÍA LA CIFRA EXACTA (`= 2_700`) y por eso no sirvió de nada
 * cuando la cifra resultó corta: certificaba que alguien la había subido una
 * vez, no que alcanzara. El piso medido contra el motor se vigila arriba, en
 * «5 bis», comparando números y no texto.
 */

/* ─── 11. LAS TRES RUTAS, Y CUÁL BLOQUEA EL PLAN VENCIDO ────────────────── */

const RUTAS = sinComentarios(leer('modules/expedientes/expedientes.routes.ts'));
check('se listan las tandas del caso', RUTAS.includes("router.get('/expedientes/:id/interrogatorios'"));
check('se abre una', RUTAS.includes("router.get('/expedientes/:id/interrogatorios/:interrogatorioId'"));
check('y se elimina detrás del bloqueo por plan vencido', /interrogatorioId'[\s\S]{0,80}bloquearSiPlanVencido/.test(RUTAS));
check(
  'leer lo ya pagado no lo bloquea el plan vencido',
  !/router\.get\('\/expedientes\/:id\/interrogatorios[^)]*bloquearSiPlanVencido/.test(RUTAS)
);

const CTRL = CTRL_BORRADO;
check(
  'las tres exigen la misma función que preparar uno nuevo',
  (CTRL.match(/exigirFuncion\(firmId, 'EXPEDIENTES\.PREGUNTAS_AUDIENCIA'\)/g) ?? []).length === 3
);
check(
  'ninguna toca el saldo ni llama a un motor: reabrir no cuesta',
  !/reserveForOperation|settleOperation|callOpenRouter/.test(CTRL)
);

/* ─── 12. LA TABLA NUEVA SE BORRA CON LA FIRMA ──────────────────────────── */

const SUPABASE = join(process.cwd(), '..', 'supabase');
const v4 = readFileSync(join(SUPABASE, 'migration-borrar-firma-completa-v4.sql'), 'utf8');
check(
  'la versión vigente del borrado se lleva los interrogatorios',
  v4.includes('DELETE FROM public.expediente_interrogatorios WHERE firm_id = p_firm_id;')
);
check(
  'y lo hace antes de borrar el expediente al que apuntan',
  v4.indexOf('public.expediente_interrogatorios') < v4.indexOf('DELETE FROM public.expedientes WHERE')
);
const migracion = readFileSync(join(SUPABASE, 'migration-interrogatorios.sql'), 'utf8');
check('la tabla nace con RLS por firma', migracion.includes('ENABLE ROW LEVEL SECURITY'));
check(
  'y con el REVOKE/GRANT explícito, porque los GRANT del esquema son una foto',
  migracion.includes('REVOKE ALL ON public.expediente_interrogatorios FROM anon;') &&
    migracion.includes('GRANT ALL ON public.expediente_interrogatorios TO service_role;')
);

console.log('');
if (fallos === 0) {
  console.log('ALL CHECKS PASSED');
} else {
  console.log(`${fallos} FALLA(S)`);
  process.exitCode = 1;
}
