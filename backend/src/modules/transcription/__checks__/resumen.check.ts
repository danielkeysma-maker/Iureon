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

check(
  'el resumen no se cobra aparte: la transcripcion ya se pago',
  !CONTROLADOR.includes("debitForUsage") ||
    !CONTROLADOR.split('transcriptionResumenController')[1]?.split('export const')[0]?.includes('debitForUsage'),
  ''
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
