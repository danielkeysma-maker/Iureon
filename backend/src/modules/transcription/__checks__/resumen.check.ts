/**
 * El contrato del resumen: hechos anclados, sin tesis, y sin doble cobro.
 *
 * Comprueba TEXTO con String.includes y no con expresiones regulares en
 * cadenas: los backslashes de este repositorio ya se colapsaron una vez al
 * escribir un check, y una regex rota no falla — deja de encontrar y el check
 * pasa en verde sin comprobar nada.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { parsearParaCheck } from '../resumen.service';

const SERVICIO = readFileSync(join(__dirname, '..', 'resumen.service.ts'), 'utf8');
const CONTROLADOR = readFileSync(join(__dirname, '..', 'transcription.controller.ts'), 'utf8');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos += 1;
};

/*
 * ─── EL PROMPT PROHÍBE LO QUE DEBE PROHIBIR ──────────────────────────────────
 *
 * Si alguien "mejora" el prompt y quita la prohibición de conclusiones
 * jurídicas, el resumen empieza a decir "hubo despido ineficaz" — una tesis
 * del modelo presentada como hecho de la audiencia. Esto tiene que fallar.
 */
check(
  'el prompt prohibe las conclusiones juridicas',
  SERVICIO.includes('HECHOS, NO TESIS') && SERVICIO.includes('PROHIBIDA'),
  ''
);

check(
  'el prompt exige el ancla: tiempo e interlocutor por hecho',
  SERVICIO.includes('CADA HECHO CON SU ANCLA'),
  ''
);

check(
  'la lista vacia es una respuesta valida, no un error',
  SERVICIO.includes('la lista vacía'),
  ''
);

check(
  'usa Gemini y no Opus: leer mucho, devolver poco',
  SERVICIO.includes('ENGINE.GEMINI') && !SERVICIO.includes('ENGINE.OPUS'),
  ''
);

/*
 * ─── EL PARSER NO INVENTA ────────────────────────────────────────────────────
 * Con basura, null. Con hechos sin texto, se filtran. Con t no numerico, null
 * en el ancla — nunca un numero inventado.
 */
const basura = parsearParaCheck('el modelo respondio prosa sin JSON');
check('respuesta sin JSON produce null, no un resumen vacio', basura === null, '');

const conRuido = parsearParaCheck(
  '```json\n{"resumen":"Audiencia de conciliacion sobre reintegro laboral y calificacion de invalidez.","hechos":[{"t":671,"quien":"Sr. Mosquera","hecho":"La incapacidad iba hasta el 20 de febrero"},{"t":"12:04","quien":"Voz 3","hecho":"corto"},{"hecho":""}]}\n```'
);
check('el JSON envuelto en markdown se parsea igual', conRuido !== null, '');
check(
  'un t no numerico queda null, nunca un numero inventado',
  conRuido !== null && conRuido.hechos.length === 1 && conRuido.hechos[0].t === 671,
  conRuido ? `hechos: ${conRuido.hechos.length}` : 'null'
);

/*
 * ─── SE GENERA UNA VEZ Y SE GUARDA ───────────────────────────────────────────
 * Sin el guardado, cada apertura paga una llamada al modelo. Y sin la salida
 * 502 honesta, un fallo del motor se disfrazaria de resumen vacio.
 */
check(
  'el controlador devuelve lo guardado antes de llamar al modelo',
  CONTROLADOR.includes('desdeCache: true') && CONTROLADOR.includes("req.query.regenerar === '1'"),
  ''
);

check(
  'un motor caido responde 502, no un resumen inventado',
  CONTROLADOR.includes("error: 'SIN_RESUMEN'") && CONTROLADOR.includes('502'),
  ''
);

/*
 * NO SE COBRA, PERO SI SE MIDE — y son dos aserciones porque son dos defectos
 * distintos.
 *
 * La de arriba vigilaba `debitForUsage`, un simbolo que no existe en el
 * proyecto: pasaba siempre. Ahora nombra lo que de verdad cobra
 * (`reserveForOperation` / `settleOperation`), que es lo unico capaz de mover
 * el saldo de una firma.
 *
 * La de abajo es la contraria y hace falta igual: transcribir es gratis por
 * decision, y el resumen es la UNICA llamada a modelo del modulo — transcribir
 * es Deepgram, que no pasa por OpenRouter. Su costo se calculaba y se botaba,
 * asi que la plataforma pagaba a Gemini por cada audiencia resumida sin verlo
 * en `ai_usage`. Regalar algo es legitimo; no saber cuanto cuesta lo regalado
 * no lo es.
 */
const DEL_RESUMEN =
  CONTROLADOR.split('transcriptionResumenController')[1]?.split('export const')[0] ?? '';

check(
  'el resumen no mueve el saldo de la firma',
  !DEL_RESUMEN.includes('reserveForOperation') && !DEL_RESUMEN.includes('settleOperation'),
  DEL_RESUMEN.includes('reserveForOperation') ? 'reserva saldo' : 'liquida saldo'
);

check(
  'pero si registra lo que le costo al modelo',
  DEL_RESUMEN.includes('recordUsage'),
  'sin recordUsage el consumo de Gemini no llega a ai_usage'
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
