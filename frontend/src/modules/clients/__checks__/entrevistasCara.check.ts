/**
 * Guarda la cara nueva de Entrevistas —la lista, «Nueva entrevista» con la
 * autorización, la pantalla de grabación, el detalle con su acta al lado, el
 * diálogo de declinar y la pantalla del teléfono— contra lo que la maqueta
 * dibuja y el producto no hace, y contra lo que la piel no puede tumbar.
 *
 * Run with: npm run check:entrevistas-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. GRABAR ANTES DE LA AUTORIZACIÓN. La voz es un dato biométrico (Ley 1581
 *    de 2012). Una piel nueva que mueva el grabador fuera del lugar donde la
 *    casilla lo bloquea deja grabar sin constancia: el defecto más caro que
 *    esta pantalla puede tener, y el más fácil de introducir al rehacerla.
 *
 * 2. LO QUE LA MAQUETA PROMETE Y NO EXISTE: una segunda autorización de
 *    tratamiento de datos «pendiente de firma» con un «Enviar el formato»;
 *    que el audio «se guarda en la cuenta de la firma» (se borra al
 *    transcribir); que transcribir cuesta saldo (es gratis); notas al margen
 *    con su minuto, preguntas que se marcan tocándolas, «[ininteligible]» y
 *    avisos de «le avisamos». Cada una se lee igual que una función real.
 *
 * 3. NOMBRES VEROSÍMILES DE EJEMPLO (README-app §3).
 *
 * Se leen los componentes como TEXTO y sin comentarios: los comentarios que
 * explican por qué no se pinta algo contienen la frase.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MOTIVOS_DE_DECLINAR,
  cercaniaEnPalabras,
  cronometro,
  decisionEnPalabras,
  duracionEnPalabras,
  horaEnPalabras,
  intervinientes,
  motivoDelDeclinado,
  puedeEmpezarAGrabar,
  revisionEnPalabras
} from '../entrevistaEnPantalla';
import type { TranscriptSegment } from '../../transcription/types';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── 1. LA AUTORIZACIÓN VA ANTES DE GRABAR ──────────────────────────────── */
const sinAutorizar = puedeEmpezarAGrabar({ hayFirma: true, autorizado: false });
check('sin autorización no se graba', !sinAutorizar.puede);
check('y se dice por qué', sinAutorizar.razon === 'Primero, la autorización de grabación.', sinAutorizar.razon ?? '');
const sinFirma = puedeEmpezarAGrabar({ hayFirma: false, autorizado: true });
check('sin firma no se graba', !sinFirma.puede && sinFirma.razon === 'Sin una firma activa no se puede guardar la entrevista.');
check(
  'la autorización manda sobre la firma en el mensaje: es lo que el abogado puede resolver en la sala',
  puedeEmpezarAGrabar({ hayFirma: false, autorizado: false }).razon === 'Primero, la autorización de grabación.'
);
check('con las dos se graba', puedeEmpezarAGrabar({ hayFirma: true, autorizado: true }).puede);
const movilSinCliente = puedeEmpezarAGrabar({ hayFirma: true, autorizado: true, exigeCliente: true, hayCliente: false });
check('el teléfono además exige con quién es', !movilSinCliente.puede && movilSinCliente.razon === 'Primero, con quién es la entrevista.');
check(
  'y con cliente sí graba',
  puedeEmpezarAGrabar({ hayFirma: true, autorizado: true, exigeCliente: true, hayCliente: true }).puede
);

/* ─── 2. LAS CIFRAS Y LAS HORAS EN PALABRAS ──────────────────────────────── */
check('el cronómetro lleva horas', cronometro(461) === '00:07:41', cronometro(461));
check('y pasa de la hora sin romperse', cronometro(3 * 3600 + 5) === '03:00:05', cronometro(3 * 3600 + 5));
check('el cronómetro en cero', cronometro(0) === '00:00:00');
const diezCincuentaYSiete = new Date(2026, 0, 1, 10, 57).toISOString();
check('la hora de la autorización es la del clic, en local', horaEnPalabras(diezCincuentaYSiete) === '10:57', horaEnPalabras(diezCincuentaYSiete) ?? '');
check('sin hora registrada no se inventa una', horaEnPalabras(null) === null && horaEnPalabras(undefined) === null);
check('una hora ilegible tampoco', horaEnPalabras('no-es-fecha') === null);
check('duración desconocida no se pinta', duracionEnPalabras(null) === null && duracionEnPalabras(0) === null);
check('duración en minutos', duracionEnPalabras(31 * 60) === '31 min');
check('duración con horas', duracionEnPalabras(72 * 60) === '1 h 12 min');

const seg = (speakerLabel: string, extra: Partial<TranscriptSegment> = {}): TranscriptSegment => ({
  speakerLabel,
  role: 'DESCONOCIDO',
  text: 'texto 00',
  startSeconds: null,
  endSeconds: null,
  ...extra
});
check('la revisión se cuenta, no se supone', revisionEnPalabras([seg('a', { revisada: true }), seg('a')]) === '1 de 2 intervenciones');
check('entera se dice entera', revisionEnPalabras([seg('a', { revisada: true })]) === '1 de 1 intervención');
check('sin intervenciones no hay fracción', revisionEnPalabras([]) === null);

const lista = intervinientes([
  seg('speaker_1', { role: 'CLIENTE' }),
  seg('speaker_0', { role: 'ABOGADO', speakerName: 'Persona 00' }),
  seg('speaker_1'),
  seg('speaker_1')
]);
check('los intervinientes salen de las voces, en el orden en que hablaron', lista.map((i) => i.voz).join(',') === 'speaker_1,speaker_0');
check('cada uno con sus intervenciones contadas', lista[0]?.intervenciones === 3 && lista[1]?.intervenciones === 1);
check('el nombre solo si un humano lo puso', lista[0]?.nombre === null && lista[1]?.nombre === 'Persona 00');
check('el rol es el de su primera intervención con rol', lista[0]?.rol === 'CLIENTE');

/* ─── 3. LA DECISIÓN Y EL MOTIVO ─────────────────────────────────────────── */
check(
  'los motivos son los reales, sin «Otro»: el texto libre lo reemplaza',
  MOTIVOS_DE_DECLINAR.join('|') === 'Fuera de materia|Sin viabilidad|Conflicto de interés|Término vencido|El cliente no volvió'
);
check('sin chip ni texto no hay motivo', motivoDelDeclinado(null, '   ') === null);
check('el chip solo', motivoDelDeclinado('Sin viabilidad', '') === 'Sin viabilidad');
check('el texto solo', motivoDelDeclinado(null, ' Ya tiene abogado ') === 'Ya tiene abogado');
check('los dos, sin perder ninguno', motivoDelDeclinado('Sin viabilidad', 'Ya tiene abogado') === 'Sin viabilidad. Ya tiene abogado');

const tomada = decisionEnPalabras({ decision: 'TOMADO', decision_motivo: null, decidido_por: 'persona00@firma.co' });
check('caso tomado', tomada.titulo === 'Caso tomado' && tomada.tono === 'ok' && tomada.detalle === 'Por persona00');
const declinada = decisionEnPalabras({ decision: 'DECLINADO', decision_motivo: 'Sin viabilidad', decidido_por: null });
check('declinado con su motivo', declinada.titulo === 'Declinado' && declinada.detalle === 'Sin viabilidad' && declinada.tono === 'neutro');
const pendiente = decisionEnPalabras({});
check('una fila sin decisión es «sin decidir», no «tomado»', pendiente.titulo === 'Sin decidir' && pendiente.tono === 'pendiente');

check('la cercanía se dice con palabras', cercaniaEnPalabras(0.8) === 'Muy cercano' && cercaniaEnPalabras(0.62) === 'Cercano');
check('nunca un porcentaje', !/%/.test([0.6, 0.7, 0.95].map(cercaniaEnPalabras).join('')));

/* ─── 4. LAS PANTALLAS, LEÍDAS COMO TEXTO ────────────────────────────────── */
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));

const COMP = 'modules/clients/components/';
const ESCRITORIO = leer(`${COMP}InterviewView.tsx`);
const MOVIL = leer(`${COMP}InterviewMobileView.tsx`);
const GRABADORA = leer(`${COMP}AudioRecorder.tsx`);
const CERRAR = leer(`${COMP}CerrarEntrevistaDialog.tsx`);
const LISTA = leer(`${COMP}EntrevistasList.tsx`);
const SUGERENCIAS = leer(`${COMP}InterviewInsights.tsx`);
const PICKER = leer(`${COMP}ClientPicker.tsx`);
const NUEVA = leer(`${COMP}NuevaEntrevistaDialog.tsx`);

const MODULO: Record<string, string> = {
  'InterviewView.tsx': ESCRITORIO,
  'InterviewMobileView.tsx': MOVIL,
  'AudioRecorder.tsx': GRABADORA,
  'CerrarEntrevistaDialog.tsx': CERRAR,
  'EntrevistasList.tsx': LISTA,
  'InterviewInsights.tsx': SUGERENCIAS,
  'ClientPicker.tsx': PICKER,
  'NuevaEntrevistaDialog.tsx': NUEVA
};

check(
  'el escritorio lleva la visita guiada y la cara nueva en su raíz',
  /data-visita="vista-entrevistas"\s+className="cara-nueva cn-ent[^"]*"/.test(ESCRITORIO)
);
check(
  'el teléfono también',
  /data-visita="vista-entrevistas"\s+className="cara-nueva cn-ent[^"]*"/.test(MOVIL)
);
check('«no sé todavía» no se pinta como «no está configurado» en escritorio', ESCRITORIO.includes('isAvailable === false') && !/!isAvailable\b/.test(ESCRITORIO));
check('ni en el teléfono', MOVIL.includes('isAvailable === false') && !/!isAvailable\b/.test(MOVIL));

/* La autorización, antes de grabar: la regla pura decide y la grabadora obedece. */
check('«Nueva entrevista» pregunta la autorización con el gancho compartido', NUEVA.includes('onChange={(e) => onAutorizar(e.target.checked)}') && ESCRITORIO.includes('useAutorizacionDeGrabacion()'));
check('y no deja empezar sin ella', NUEVA.includes('disabled={!permiso.puede}') && ESCRITORIO.includes('puedeEmpezarAGrabar({'));
check('la subida de un archivo tampoco', NUEVA.includes('disabled={!permiso.puede || !onSubir}'));
check('la grabadora de escritorio sigue apagada sin la regla', /<AudioRecorder[\s\S]{0,200}disabled=\{!permiso\.puede\}/.test(ESCRITORIO));
check('la del teléfono también', /<AudioRecorder[\s\S]{0,200}disabled=\{!permiso\.puede \|\| trabajando\}/.test(MOVIL) && MOVIL.includes('exigeCliente: true'));
check('la hora del clic viaja con la transcripción', ESCRITORIO.includes('transcribe(file, undefined, autorizadoEl ?? undefined)') && MOVIL.includes('transcribe(file, undefined, autorizadoEl ?? undefined)'));
check('la casilla del teléfono sale del gancho, no de una copia', MOVIL.includes('useAutorizacionDeGrabacion()') && MOVIL.includes('{TEXTO_AUTORIZACION}'));
check('la pausa sigue siendo `pause()` y no `stop()`', GRABADORA.includes('r.pause()') && GRABADORA.includes('r.resume()'));
check('el guion se tacha con la función pura', ESCRITORIO.includes('preguntasCubiertas(result?.segments ?? [])') && MOVIL.includes('preguntasCubiertas(result?.segments ?? [])'));
check('declinar pasa por la regla del motivo', CERRAR.includes('motivoDelDeclinado(chip, texto)') && CERRAR.includes('MOTIVOS_DE_DECLINAR.map'));
check('la lista no guarda su propia copia de los motivos', !/const MOTIVOS\b/.test(LISTA + CERRAR));

for (const [nombre, codigo] of Object.entries(MODULO)) {
  check(`${nombre} no pinta una segunda autorización de datos`, !/Firmó la autorización|tratamiento de datos pendiente|Pendiente de firma|puede firmarla después|Enviar el formato/i.test(codigo));
  check(`${nombre} no dice que el audio se conserva`, !/audio se (guarda|conserva)|grabación se conserva|guardado en la cuenta de la firma/i.test(codigo));
  check(`${nombre} no cobra la transcripción`, !/transcribir s[íi]|consume saldo según|se cobra por duración|cuesta cerca de/i.test(codigo));
  check(`${nombre} no pinta campos que no existen`, !/Otras personas presentes|Sobre qué viene|Notas al margen/.test(codigo));
  check(`${nombre} no marca preguntas tocándolas`, !/Respondida en|Toque una cuando/.test(codigo));
  check(`${nombre} no promete lo que no produce`, !/ininteligible|le avisamos|de certeza/i.test(codigo));
  check(`${nombre} no trae un nombre verosímil de ejemplo`, !/Mosquera|ACME|Peralta|Ospina|Restrepo|Renter[íi]a/.test(codigo), 'README-app §3');
  check(`${nombre} no trae una cédula verosímil`, !/\b(?!0+\b)\d{7,}\b/.test(codigo), 'README-app §3');
  const m = codigo.match(/text-\[(?:\d|1[0-3])(?:\.\d+)?px\]|\btext-(?:meta|label|ui|xs)\b|\bbtn-sm\b|\bnotice-unverified\b|\bfont-mono\b/);
  check(`${nombre}: nada por debajo de 14 px ni piezas de la cara vieja`, !m, m?.[0] ?? '');
}

/* ─── 5. EL BLOQUE DE CSS NO SE SALE DE `.cara-nueva` ────────────────────── */
const CSS = readFileSync(join(SRC, 'design', 'cara-nueva.css'), 'utf8');
const MARCA = '/* ─── Entrevistas ─── */';
const FIN = '/* ─── fin Entrevistas ─── */';
const inicio = CSS.indexOf(MARCA);
const final = CSS.indexOf(FIN);
check('cara-nueva.css tiene el bloque de Entrevistas con su cierre', inicio !== -1 && final > inicio);
const bloque = inicio === -1 || final === -1 ? '' : CSS.slice(inicio + MARCA.length, final).replace(/\/\*[\s\S]*?\*\//g, ' ');
const sueltos: string[] = [];
const ajenos: string[] = [];
const guiones: string[] = [];
const rojos: string[] = [];
const monos: string[] = [];
const oros: string[] = [];
for (const m of bloque.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const cabeza = m[1].replace(/@media[^{]*\{/g, '').trim();
  const cuerpo = m[2];
  for (const sel of cabeza.split(',').map((s) => s.trim()).filter(Boolean)) {
    const bien =
      sel.startsWith('.cara-nueva') ||
      sel.startsWith(":root:not([data-theme='light']) .cara-nueva") ||
      sel.startsWith(":root[data-theme='dark'] .cara-nueva");
    if (!bien) sueltos.push(sel);
    if (!/cn-ent/.test(sel)) ajenos.push(sel);
    if (/dashed/.test(cuerpo) && !/--sin-verificar/.test(sel)) guiones.push(sel);
    /* El rojo: lo destructivo, y el punto de «grabando», que es un estado y no un adorno. */
    if (/var\(--danger\)/.test(cuerpo) && !/--peligro|cn-ent-punto/.test(sel)) rojos.push(sel);
    /* El mono: el cronómetro, las horas y la cédula. */
    if (/var\(--mono\)|monospace/.test(cuerpo) && !/cn-ent-mono|cn-ent-cronometro/.test(sel)) monos.push(sel);
    if (/--gold/.test(cuerpo)) oros.push(sel);
  }
}
check('todo selector del bloque vive bajo .cara-nueva', bloque.trim() !== '' && sueltos.length === 0, sueltos.join(' · '));
check('todo selector del bloque es de cn-ent', bloque.trim() !== '' && ajenos.length === 0, ajenos.join(' · '));
check('el borde discontinuo solo aparece en lo que no está verificado', guiones.length === 0, guiones.join(' · '));
check('el rojo solo aparece en lo destructivo y en el punto de grabación', rojos.length === 0, rojos.join(' · '));
check('el mono solo aparece en lo citable', monos.length === 0, monos.join(' · '));
check('el oro no aparece', oros.length === 0, oros.join(' · '));
const chicos = [...bloque.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])).filter((n) => n < 14);
check('ningún tamaño del bloque baja de 14 px', bloque.trim() !== '' && chicos.length === 0, chicos.join(', '));
check(
  'el bloque trae su modo oscuro por los dos caminos',
  bloque.includes(":root:not([data-theme='light']) .cara-nueva") && bloque.includes(":root[data-theme='dark'] .cara-nueva")
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
