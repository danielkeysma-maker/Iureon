/**
 * Guarda la cara nueva de Audiencias —la lista, subir una grabación, la espera,
 * el transcrito con «Quién habla», los tres diálogos y el resumen— contra lo que
 * la maqueta dibuja y el producto no hace.
 *
 * Run with: npm run check:audiencias-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. LA CERTEZA POR PALABRA. La maqueta subraya tres palabras con «61 %». El
 *    proveedor mide la confianza POR INTERVENCIÓN (la más baja cuando se unen
 *    turnos), así que un porcentaje pegado a tres palabras sería una precisión
 *    que nadie midió. Se marca la intervención entera, con su porcentaje.
 *
 * 2. EL AUDIO QUE «SE CONSERVA». La grabación se borra del almacenamiento antes
 *    de responder. Toda frase que diga que se guarda, que se puede volver a oír
 *    desde el servidor o que se cobra por duración es falsa en este código.
 *
 * 3. LA ESPERA CON AVANCE INVENTADO. Transcribir es UNA llamada: no hay «34 de
 *    58 intervenciones», ni «le avisamos», ni una fila «Transcribiendo…» en la
 *    lista. La espera dice los dos estados reales del gancho.
 *
 * 4. EL LÍMITE ESCRITO A MANO. «Hasta 500 MB» no es el límite de nadie; el que
 *    vale llega del servidor y los formatos salen de `SUPPORTED_AUDIO_EXTENSIONS`.
 *
 * Los componentes se leen como TEXTO y sin comentarios: los comentarios que
 * explican por qué no se pinta algo contienen la frase.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  UMBRAL_DE_CERTEZA,
  certezaDeIntervencion,
  conPocaCerteza,
  duracionEnPalabras,
  esperaDeTranscripcion,
  limiteDeSubida,
  marcaDeTiempo,
  megabytesEnPalabras,
  revisionDe,
  vocesEnPalabras
} from '../audienciaEnPantalla';
import { SUPPORTED_AUDIO_EXTENSIONS } from '../types';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── 1. LA CERTEZA ES DE LA INTERVENCIÓN ─────────────────────────────────── */
check('el umbral es 0,75, el mismo del servidor', UMBRAL_DE_CERTEZA === 0.75);
const baja = certezaDeIntervencion({ confianza: 0.612 });
check('bajo el umbral la intervención se marca', baja.baja === true);
check('con su porcentaje redondeado', baja.porcentaje === 61, String(baja.porcentaje));
check('en el umbral no se marca', certezaDeIntervencion({ confianza: 0.75 }).baja === false);
check('sobre el umbral no se marca', certezaDeIntervencion({ confianza: 0.93 }).baja === false);
const sinMedida = certezaDeIntervencion({});
check('sin medida no hay marca: «no se midió» no es «poco clara»', sinMedida.baja === false && sinMedida.porcentaje === null);
const soloTramos = certezaDeIntervencion({
  fragmentosDudosos: [
    { desde: 0, hasta: 4, confianza: 0.7 },
    { desde: 10, hasta: 20, confianza: 0.52 }
  ]
});
check(
  'un transcrito con tramos y sin confianza toma el más bajo, y marca la intervención',
  soloTramos.baja && soloTramos.porcentaje === 52,
  JSON.stringify(soloTramos)
);
check(
  'la confianza de la intervención manda sobre los tramos',
  certezaDeIntervencion({ confianza: 0.9, fragmentosDudosos: [{ desde: 0, hasta: 1, confianza: 0.5 }] }).porcentaje === 90
);
check(
  'se cuentan solo las marcadas',
  conPocaCerteza([{ confianza: 0.5 }, { confianza: 0.8 }, {}, { confianza: 0.74 }]) === 2
);

/* ─── 2. TIEMPOS, VOCES Y REVISIÓN EN PALABRAS ───────────────────────────── */
check('marca de tiempo con horas', marcaDeTiempo(188) === '00:03:08', marcaDeTiempo(188));
check('una hora y doce', marcaDeTiempo(4320) === '01:12:00', marcaDeTiempo(4320));
check('sin tiempo no se inventa uno', marcaDeTiempo(null) === '');
check('duración corta', duracionEnPalabras(2040) === '34 min', duracionEnPalabras(2040));
check('duración con horas', duracionEnPalabras(4320) === '1 h 12 min', duracionEnPalabras(4320));
check('menos de un minuto no es «0 min»', duracionEnPalabras(20) === 'menos de 1 min', duracionEnPalabras(20));
check('sin duración, nada', duracionEnPalabras(null) === '');
check('una voz en singular', vocesEnPalabras(1) === '1 voz');
check('varias voces', vocesEnPalabras(4) === '4 voces');
const r1 = revisionDe([{ revisada: true }, {}, { revisada: true }, {}]);
check('la revisión cuenta las marcas reales', r1.revisadas === 2 && r1.total === 4 && r1.texto === '2 de 4 revisadas', r1.texto);
check('entera cuando todas', revisionDe([{ revisada: true }]).texto === 'Revisada entera');
check('sin intervenciones no dice «revisada entera»', revisionDe([]).entera === false && revisionDe([]).texto === 'Sin intervenciones');
check('el porcentaje de la barra sale de la cuenta', r1.porcentaje === 50);

/* ─── 3. EL LÍMITE REAL ──────────────────────────────────────────────────── */
check('200 MB exactos se dicen sin decimales', megabytesEnPalabras(200 * 1024 * 1024) === '200 MB');
check('4,5 MB con coma decimal', megabytesEnPalabras(4.5 * 1024 * 1024) === '4,5 MB', megabytesEnPalabras(4.5 * 1024 * 1024));
check(
  'un archivo diminuto no se anuncia como «0 MB», que parece vacío',
  megabytesEnPalabras(4096) === 'menos de 0,1 MB',
  megabytesEnPalabras(4096)
);
const limite = limiteDeSubida(200 * 1024 * 1024, SUPPORTED_AUDIO_EXTENSIONS);
check('el límite trae el tamaño del servidor y TODOS los formatos del código', limite === `Hasta 200 MB · ${SUPPORTED_AUDIO_EXTENSIONS.join(', ')}`, limite);
check('webm y mpga están entre los formatos que se anuncian', /webm/.test(limite) && /mpga/.test(limite));

/* ─── 4. LA ESPERA DICE LOS ESTADOS QUE EXISTEN ──────────────────────────── */
check('sin trabajo no hay espera', esperaDeTranscripcion({ subiendo: false, progreso: 0, transcribiendo: false }) === null);
const enviando = esperaDeTranscripcion({ subiendo: true, progreso: 42, transcribiendo: true });
check('subiendo manda sobre transcribiendo', enviando?.paso === 'enviando');
check('con cifra cuando la hay', enviando?.detalle === '42 % enviado', enviando?.detalle ?? '');
check(
  'sin cifra no se pinta «0 %»',
  !/0 %/.test(esperaDeTranscripcion({ subiendo: true, progreso: 0, transcribiendo: true })?.detalle ?? '')
);
const transcribiendo = esperaDeTranscripcion({ subiendo: false, progreso: 0, transcribiendo: true });
check('transcribiendo es un paso propio', transcribiendo?.paso === 'transcribiendo');
check(
  'y no promete avance parcial ni aviso posterior',
  !/de \d+|le avisamos|intervenciones/i.test(`${transcribiendo?.titulo} ${transcribiendo?.detalle}`)
);

/* ─── 5. LAS PANTALLAS, LEÍDAS COMO TEXTO ────────────────────────────────── */
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));

const COMP = 'modules/transcription/components/';
const VISTA = leer(`${COMP}TranscriptionView.tsx`);
const LISTA = leer(`${COMP}AudienciasList.tsx`);
const SUBIR = leer(`${COMP}SubirAudienciaDialog.tsx`);
const SEGMENTOS = leer(`${COMP}TranscriptSegments.tsx`);
const ROLES = leer(`${COMP}RoleProposals.tsx`);
const RESUMEN = leer(`${COMP}TranscriptSummary.tsx`);
const AUDIO = leer(`${COMP}AudioPreview.tsx`);

const REHECHAS: Record<string, string> = {
  'TranscriptionView.tsx': VISTA,
  'AudienciasList.tsx': LISTA,
  'SubirAudienciaDialog.tsx': SUBIR,
  'TranscriptSegments.tsx': SEGMENTOS,
  'RoleProposals.tsx': ROLES,
  'TranscriptSummary.tsx': RESUMEN
};
const MODULO: Record<string, string> = { ...REHECHAS, 'AudioPreview.tsx': AUDIO };

check(
  'la raíz de Audiencias lleva la visita guiada LITERAL y la cara nueva',
  /data-visita="vista-audiencias"\s+className="cara-nueva cn-aud/.test(VISTA)
);
check('y la de Entrevistas también es literal', /data-visita="vista-entrevistas"/.test(VISTA));
check('ya no hay plantilla en el atributo de la visita', !/data-visita=\{/.test(VISTA));

const FALSAS: Array<[string, RegExp]> = [
  ['un precio de transcripción', /\$\s?6\.000|cuesta cerca de|se cobra por duraci|consume saldo seg|transcribir sí consume/i],
  ['un cobro por duración procesada', /se le cobró/i],
  ['el audio que se conserva', /se conserva en la cuenta|se guarda en la cuenta|archivo de audio se conserva|audio recibido y guardado/i],
  ['escuchar un tramo con rango', /Escuchar de \d|Volver a escuchar este tramo/],
  ['la certeza por palabra', /f\.desde|\.slice\(f\./],
  ['tramos ininteligibles', /ininteligible/i],
  ['un avance parcial inventado', /Separadas \d+ voces|\d+ de \d+ intervenciones|le avisamos|Puede cerrar esta pantalla/i],
  ['un límite escrito a mano', /500 MB|mp3, m4a, wav, mp4/],
  ['campos que no existen al subir', /Cómo la llama|Quiénes intervienen/],
  ['el texto original conservado', /texto original se conserva/i],
  ['la reasignación en bloque', /todo lo que sigue de esta voz/i],
  ['un reintento de guardado', /Intentar guardar de nuevo/],
  ['un nombre verosímil', /Mosquera|ACME|Peralta|Ospina|Restrepo|Renter[ií]a|Colpensiones/],
  ['una frase de audiencia verosímil', /Se declara abierta|Comparezco como/],
  ['un despacho verosímil', /Juzgado\s+(?!00\b)\d+/],
  ['un radicado verosímil', /rad\.\s*(?!0)\d|\b(?!0+\b)\d{4}-\d{5}\b/]
];
for (const [nombre, codigo] of Object.entries(MODULO)) {
  for (const [que, re] of FALSAS) {
    const m = codigo.match(re);
    check(`${nombre} no publica ${que}`, !m, m?.[0] ?? '');
  }
}
check('la lista no pinta una fila «Transcribiendo»', !/Transcribiendo/.test(LISTA));

check('el diálogo de subir sigue usando el selector compartido del caso', SUBIR.includes('<SelectorDeExpediente'));
check('y conserva el campo de contexto que viaja al motor', SUBIR.includes('value={contexto}'));
check('el límite se arma con el del servidor y los formatos del código', SUBIR.includes('limiteDeSubida(maxAudioBytes, SUPPORTED_AUDIO_EXTENSIONS)'));
check('la línea de privacidad dice que la grabación no se guarda', SUBIR.includes('La grabación no se guarda'));
check('la espera sale del ayudante', SUBIR.includes('esperaDeTranscripcion('));
check('el marcador del contexto es un marcador evidente', SUBIR.includes('Juzgado 00'));
check('el diálogo no se cierra solo si la transcripción falló', !/transcribe\([^)]*\)\.then\(\(\)\s*=>\s*setSubirAbierto\(false\)/.test(VISTA));

check('la certeza se marca con el ayudante de la intervención', SEGMENTOS.includes('certezaDeIntervencion(segment)'));
check('corregir, mover y dividir son diálogos', SEGMENTOS.includes('Corregir lo que se entendió') && SEGMENTOS.includes('¿Quién dice esto?') && SEGMENTOS.includes('Dividir la intervención'));
check('mover dice que solo mueve esta intervención', SEGMENTOS.includes('Solo esta intervención'));
check('escuchar desde el minuto solo se ofrece con la copia local', SEGMENTOS.includes('onEscucharDesde &&') && /onEscucharDesde=\{\s*selectedFile\s*\?/.test(VISTA));
check('sin copia local se dice que la grabación no se conserva', VISTA.includes('La grabación no se conserva'));
check('el aviso de no guardado sigue diciendo que se copie el texto', ROLES.includes('Copie el texto'));
check('el resumen dice que no es una decisión', RESUMEN.includes('Esto es un resumen, no una decisión'));
check('el transcrito lleva la advertencia de que no sustituye el acta', VISTA.includes('No sustituye el acta oficial del despacho'));

/* ─── 6. LA ESCALA EMPIEZA EN 14 ────────────────────────────────────────── */
for (const [nombre, codigo] of Object.entries(REHECHAS)) {
  const m = codigo.match(/text-\[(?:\d|1[0-3])(?:\.\d+)?px\]|\btext-(?:meta|label|ui|xs)\b|\bbtn-sm\b|\bnotice(?:-unverified)?\b/);
  check(`${nombre}: nada por debajo de 14 px ni piezas de la cara vieja`, !m, m?.[0] ?? '');
}

/* ─── 7. EL BLOQUE DE CSS NO SE SALE DE `.cara-nueva` ───────────────────── */
const CSS = readFileSync(join(SRC, 'design', 'cara-nueva.css'), 'utf8');
const MARCA = '/* ─── Audiencias ─── */';
const FIN = '/* ─── fin Audiencias ─── */';
const inicio = CSS.indexOf(MARCA);
const fin = CSS.indexOf(FIN);
check('cara-nueva.css tiene el bloque de Audiencias, con su cierre', inicio !== -1 && fin > inicio);
const bloque = inicio === -1 || fin === -1 ? '' : CSS.slice(inicio + MARCA.length, fin).replace(/\/\*[\s\S]*?\*\//g, ' ');
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
    if (!/cn-aud/.test(sel)) ajenos.push(sel);
    if (/dashed/.test(cuerpo) && !/--poca-certeza/.test(sel)) guiones.push(sel);
    if (/var\(--danger\)/.test(cuerpo) && !/--peligro|--no-guardado/.test(sel)) rojos.push(sel);
    if (/var\(--mono\)|monospace/.test(cuerpo) && !/cn-aud-mono/.test(sel)) monos.push(sel);
    if (/--gold/.test(cuerpo)) oros.push(sel);
  }
}
check('todo selector del bloque vive bajo .cara-nueva', bloque !== '' && sueltos.length === 0, sueltos.join(' · '));
check('todo selector del bloque es de cn-aud', bloque !== '' && ajenos.length === 0, ajenos.join(' · '));
check('el borde discontinuo solo aparece en la poca certeza', guiones.length === 0, guiones.join(' · '));
check('el rojo solo aparece en lo destructivo y en lo que no se guardó', rojos.length === 0, rojos.join(' · '));
check('el mono solo aparece en lo citable (tiempos y cuentas)', monos.length === 0, monos.join(' · '));
check('el oro no aparece', oros.length === 0, oros.join(' · '));
const chicos = [...bloque.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])).filter((n) => n < 14);
check('ningún tamaño del bloque baja de 14 px', bloque !== '' && chicos.length === 0, chicos.join(', '));
check(
  'el bloque trae su modo oscuro por los dos caminos',
  bloque.includes(":root:not([data-theme='light']) .cara-nueva") && bloque.includes(":root[data-theme='dark'] .cara-nueva")
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
