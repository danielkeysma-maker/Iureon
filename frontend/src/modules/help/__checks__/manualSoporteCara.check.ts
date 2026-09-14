/**
 * Guarda la cara nueva del Manual (11), el Soporte (12) y la visita guiada
 * contra lo que las maquetas dibujan y el producto no hace.
 *
 * Run with: npm run check:manual-soporte-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. LA VISITA SIN FORMA. «Paso 2 de 12» no decía de qué trataba ni cuánto
 *    faltaba (README-app, «La visita guiada se rehizo»). Ahora son capítulos
 *    con nombre, y cada parada existente pertenece a UNO. Una parada sin
 *    capítulo desaparecería de la visita en silencio; una en dos, se vería dos
 *    veces.
 *
 * 2. LA DURACIÓN ESCRITA A MANO. La maqueta dice «Dos minutos» y «20 s». Nadie
 *    midió eso: la duración sale de las palabras que la visita realmente dice,
 *    y una cifra tecleada se desfasa la primera vez que alguien edita un texto.
 *
 * 3. LAS PROMESAS DE SOPORTE. Tiempos de respuesta, líneas telefónicas,
 *    agentes en vivo, «le responden al correo», adjuntos y capturas: nada de
 *    eso existe en este código. Es la pantalla a la que se llega cuando algo ya
 *    salió mal, y una promesa tranquilizadora inventada ahí es peor que callar.
 *
 * 4. LOS NOMBRES DE LA MAQUETA. «C. Restrepo», «J. Ávila», «Mosquera vs.
 *    ACME» son datos de muestra con cara de verdad (README §3).
 *
 * 5. LA PIEL FUERA DE SU ALCANCE. El bloque de CSS vive bajo `.cara-nueva`,
 *    trae los dos oscuros, nada de 12 px o menos, sin trazo discontinuo fuera
 *    del «sin verificar», sin oro y con controles de 44 px.
 *
 * Los componentes se leen como TEXTO y sin comentarios: los comentarios que
 * explican por qué no se promete algo contienen la frase.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PASOS_DE_VISITA } from '../../inicio/visitaGuiada/pasos';
import {
  CAPITULOS_DE_VISITA,
  agruparEnCapitulos,
  segundosDeLectura,
  textoDeDuracion,
  textoDeLaVisitaCompleta
} from '../../inicio/visitaGuiada/capitulos';
import { MANUAL } from '../content/manual';
import { FRECUENTES } from '../content/frecuentes';
import { entradaPorId } from '../content/manual';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const leer = (ruta: string): string => readFileSync(join(SRC, ruta), 'utf8');
const codigo = (ruta: string): string => sinComentarios(leer(ruta));

const MANUAL_VIEW = codigo('modules/help/components/ManualView.tsx');
const MANUAL_MOVIL = codigo('modules/help/components/ManualMobileView.tsx');
const PAGINA_MANUAL = codigo('modules/help/components/PaginaDelManual.tsx');
const SUPPORT_VIEW = codigo('modules/help/components/SupportView.tsx');
const SUPPORT_MOVIL = codigo('modules/help/components/SupportMobileView.tsx');
const CHAT = codigo('modules/help/components/ChatDeSoporte.tsx');
const DIALOGO = codigo('modules/help/components/DialogoDeAyuda.tsx');
const VISITA = codigo('modules/inicio/visitaGuiada/VisitaGuiada.tsx');
const HOOK = codigo('modules/inicio/visitaGuiada/useVisitaGuiada.ts');
const INICIO = codigo('modules/inicio/components/InicioView.tsx');
const FRANJA = codigo('modules/support/components/SupportAccessBanner.tsx');
const DECISION = codigo('modules/support/components/SupportAccessDecisionDialog.tsx');
const CSS = leer('design/cara-nueva.css');

/* ─── 1. CINCO CAPÍTULOS CON NOMBRE, CADA PARADA EN UNO ─────────────────── */
check('la visita tiene cinco capítulos', CAPITULOS_DE_VISITA.length === 5, String(CAPITULOS_DE_VISITA.length));
check(
  'cada capítulo tiene nombre propio y distinto',
  CAPITULOS_DE_VISITA.every((c) => c.titulo.trim().length > 0) &&
    new Set(CAPITULOS_DE_VISITA.map((c) => c.titulo)).size === CAPITULOS_DE_VISITA.length
);
const idsDeCapitulo = new Set(CAPITULOS_DE_VISITA.map((c) => c.id));
const huerfanas = PASOS_DE_VISITA.filter((p) => !idsDeCapitulo.has(p.capitulo));
check('toda parada nombra un capítulo que existe', huerfanas.length === 0, huerfanas.map((p) => p.id).join(', '));

const agrupados = agruparEnCapitulos(PASOS_DE_VISITA);
const vistas = agrupados.flatMap((c) => c.pasos.map((p) => p.id));
check(
  'cada parada existente aparece exactamente una vez',
  vistas.length === PASOS_DE_VISITA.length && new Set(vistas).size === PASOS_DE_VISITA.length,
  `${vistas.length} de ${PASOS_DE_VISITA.length}`
);
check('los cinco capítulos tienen al menos una parada', agrupados.length === 5 && agrupados.every((c) => c.pasos.length > 0));
check(
  'el orden de la visita es el del archivo de paradas: un capítulo no reaparece después de otro',
  vistas.join('|') === PASOS_DE_VISITA.map((p) => p.id).join('|')
);
check(
  'la última parada es la que dice que la visita termina',
  PASOS_DE_VISITA[PASOS_DE_VISITA.length - 1]?.texto.includes('termina la visita') === true
);
check(
  'los capítulos se numeran seguidos, desde 1',
  agrupados.every((c, i) => c.numero === i + 1)
);

const sinRegistrar = agruparEnCapitulos(
  PASOS_DE_VISITA.filter((p) => !['expedientes', 'audiencias', 'entrevistas'].includes(p.id))
);
check(
  'un capítulo cuyo plan oculta todas sus paradas no se ofrece, y la numeración se recorre',
  sinRegistrar.length === 4 && sinRegistrar.every((c, i) => c.numero === i + 1),
  String(sinRegistrar.length)
);

/* ─── 2. LA DURACIÓN SALE DE LAS PALABRAS ───────────────────────────────── */
const palabras = (n: number): string => Array.from({ length: n }, () => 'palabra').join(' ');
check('200 palabras son 60 segundos', segundosDeLectura(palabras(200)) === 60, String(segundosDeLectura(palabras(200))));
check('se redondea hacia arriba de 5 en 5', segundosDeLectura(palabras(51)) === 20, String(segundosDeLectura(palabras(51))));
check('un texto corto no baja de 5 segundos', segundosDeLectura('Hola') === 5);
check('un texto vacío no dura nada', segundosDeLectura('   ') === 0);
check('40 s se dicen en segundos', textoDeDuracion(40) === '≈ 40 s', textoDeDuracion(40));
check('90 s se dicen en minutos, hacia arriba', textoDeDuracion(90) === '≈ 2 min', textoDeDuracion(90));
check('un minuto o menos es «un minuto»', textoDeLaVisitaCompleta(45) === 'Un minuto', textoDeLaVisitaCompleta(45));
check('más de un minuto son «unos N minutos»', textoDeLaVisitaCompleta(250) === 'Unos 5 minutos', textoDeLaVisitaCompleta(250));
check(
  'la duración de un capítulo es la suma de sus paradas',
  agrupados.every((c) => c.segundos === c.pasos.reduce((s, p) => s + segundosDeLectura(`${p.titulo} ${p.texto}`), 0))
);

const DURACION_A_MANO = /dos minutos|\b\d+\s+minutos\b|\b\d+\s?s\b(?!\w)/i;
for (const [nombre, fuente] of [
  ['VisitaGuiada', VISITA],
  ['InicioView', INICIO]
] as const) {
  check(`${nombre} no escribe duraciones a mano`, !DURACION_A_MANO.test(fuente), fuente.match(DURACION_A_MANO)?.[0] ?? '');
}
/*
 * En el manual la regla va acotada a la visita: «Verificarlo toma unos dos
 * minutos» es contenido del artículo de los tres estados, no la duración de la
 * visita.
 */
const VISITA_A_MANO = /visita[^.]{0,120}(dos minutos|\b\d+\s+minutos\b)/i;
check('el manual no anuncia la visita con una duración escrita a mano', !VISITA_A_MANO.test(PAGINA_MANUAL), PAGINA_MANUAL.match(VISITA_A_MANO)?.[0] ?? '');

/* ─── 3. LA VISITA: PUERTA, FOCO, HOJA EN EL TELÉFONO, CIERRE ───────────── */
check('la visita abre su propio alcance de la cara nueva', /className="cara-nueva cn-vis/.test(VISITA));
check('tiene puerta de entrada', VISITA.includes('cn-vis-puerta'));
check('tiene cierre', VISITA.includes('cn-vis-cierre'));
check('en el teléfono es hoja inferior, no globo anclado', VISITA.includes('cn-vis-hoja') && VISITA.includes('cn-vis-globo'));
check('la hoja desplaza la pantalla sola, respetando «reducir movimiento»', VISITA.includes('prefers-reduced-motion') && VISITA.includes('scrollBy'));
check('la geometría del foco sale de la caja real del elemento', VISITA.includes('getBoundingClientRect'));
check('la visita recuerda si ya se ofreció, con la misma clave', HOOK.includes("'iureon.visita.completada'"));
check('los botones que nombra el manual siguen existiendo', ['Anterior', 'Siguiente', 'Salir'].every((b) => VISITA.includes(b)));
check('la invitación de Inicio sigue abriendo la visita', /onClick=\{visita\.iniciar\}/.test(INICIO) && /visita\.declinarInvitacion/.test(INICIO));

/* ─── 4. MANUAL Y SOPORTE: data-visita Y CARA NUEVA ─────────────────────── */
check('el manual lleva su ancla de la visita y la cara nueva', /data-visita="vista-manual"\s+className=\{?`?"?cara-nueva cn-man/.test(PAGINA_MANUAL));
check('las dos pantallas del manual montan la misma página', MANUAL_VIEW.includes('<PaginaDelManual') && MANUAL_MOVIL.includes('<PaginaDelManual'));
check('el soporte lleva su ancla de la visita y la cara nueva', /data-visita="vista-soporte"\s+className=\{?`?"?cara-nueva cn-sop/.test(SUPPORT_VIEW));
check('el soporte del teléfono monta la misma página', SUPPORT_MOVIL.includes('<PaginaDeSoporte'));
check('el chat sigue sondeando cada 30 s', CHAT.includes('30_000') && CHAT.includes('supportChatApi.listar'));
check('los diálogos de ayuda atrapan el foco y cierran con Esc', DIALOGO.includes("'Tab'") && DIALOGO.includes("'Escape'") && DIALOGO.includes('aria-modal'));

/*
 * LO QUE EL MANUAL NOMBRA, EXISTE. El artículo de soporte dice «Nueva
 * conversación», «Abrir conversación» y «Sus conversaciones con soporte»; la
 * cara nueva no puede rebautizarlos sin que el manual quede mintiendo.
 */
const A_SOPORTE = MANUAL.flatMap((g) => g.articulos).find((a) => a.id === 'soporte');
const etiquetas = new Set<string>();
for (const b of A_SOPORTE?.bloques ?? []) {
  const textos = b.kind === 'ruta' ? b.camino : b.kind === 'pasos' ? b.pasos : [];
  for (const t of textos) for (const m of t.matchAll(/«([^»]+)»/g)) etiquetas.add(m[1]);
}
const PANTALLAS_DE_AYUDA = `${CHAT}${SUPPORT_VIEW}${PAGINA_MANUAL}`;
const ajenas = new Set(['Soporte', 'Aprender', 'Más', 'Asunto', 'Mensaje', 'Abierta', 'Cerrada']);
const faltan = [...etiquetas].filter((e) => !ajenas.has(e) && !PANTALLAS_DE_AYUDA.includes(e));
check('cada botón que el artículo de soporte nombra está en pantalla', etiquetas.size > 0 && faltan.length === 0, faltan.join(', '));
check('«Asunto», «Mensaje», «Abierta» y «Cerrada» también', ['Asunto', 'Mensaje', 'Abierta', 'Cerrada'].every((e) => CHAT.includes(e)));

/* ─── 5. NINGUNA PROMESA DE SOPORTE QUE EL CÓDIGO NO CUMPLA ─────────────── */
const PROMESAS: ReadonlyArray<[RegExp, string]> = [
  [/≈\s*\d+\s*min/, 'tiempo de primera respuesta: nadie lo mide'],
  [/en l[ií]nea/i, 'nadie registra presencia'],
  [/respuesta garantizada|atenci[oó]n inmediata|responden en \d|en menos de/i, 'no hay acuerdo de servicio'],
  [/24\s*\/\s*7|SLA/, 'no hay acuerdo de servicio'],
  [/agente|en vivo|llamar|l[ií]nea telef|tel[eé]fono de soporte/i, 'no hay agentes en vivo ni teléfono'],
  [/al correo|por correo/i, 'la respuesta no sale por correo'],
  [/captura de pantalla|adjuntar lo que|su[eé]ltela/i, 'el chat no recibe adjuntos'],
  [/Restrepo|Ávila|Mosquera|ACME/, 'nombres de muestra de la maqueta']
];
const SOPORTE_TODO = `${CHAT}${SUPPORT_VIEW}${SUPPORT_MOVIL}${DIALOGO}${FRANJA}${DECISION}`;
for (const [patron, porque] of PROMESAS) {
  check(`soporte no dice ${patron}`, !patron.test(SOPORTE_TODO), `${porque}${SOPORTE_TODO.match(patron) ? ' · «' + SOPORTE_TODO.match(patron)?.[0] + '»' : ''}`);
}
check(
  'la visita y el manual tampoco usan los nombres de la maqueta',
  !/Restrepo|Ávila|Mosquera|ACME|saldo de cortes[ií]a/.test(`${VISITA}${PAGINA_MANUAL}`)
);
check(
  'el manual no declara ausente el registro de lectura, que ya existe',
  !/se agregar[aá] cuando exista en el servidor|no marca art[ií]culos le[ií]dos/.test(`${MANUAL_VIEW}${MANUAL_MOVIL}${PAGINA_MANUAL}`)
);
check(
  '«No autorizar no afecta su servicio» va antes de los dos botones',
  DECISION.indexOf('No autorizar no afecta su servicio') > -1 &&
    DECISION.indexOf('No autorizar no afecta su servicio') < DECISION.indexOf("decidir(false)") &&
    DECISION.indexOf('No autorizar no afecta su servicio') < DECISION.indexOf('decidir(true)')
);
check(
  'negar y autorizar tienen el mismo peso visual',
  /onClick=\{\(\) => decidir\(false\)\}[\s\S]{0,160}className="cn-sop-decision-boton"/.test(DECISION) &&
    /onClick=\{\(\) => decidir\(true\)\}[\s\S]{0,160}className="cn-sop-decision-boton"/.test(DECISION)
);
check('la franja de acceso no se puede cerrar', !/aria-label="Cerrar/.test(FRANJA) && FRANJA.includes('cn-sop-franja'));

/* ─── 6. LO QUE MÁS SE PREGUNTA APUNTA A ARTÍCULOS REALES ───────────────── */
check('hay preguntas frecuentes', FRECUENTES.length >= 3);
check(
  'cada pregunta frecuente abre un artículo que existe',
  FRECUENTES.every((f) => entradaPorId(f.articuloId)),
  FRECUENTES.filter((f) => !entradaPorId(f.articuloId)).map((f) => f.articuloId).join(', ')
);
check(
  'el costo de una pregunta frecuente no lleva cifra: la cifra la da el botón que cobra',
  FRECUENTES.every((f) => !/\$|\d/.test(f.detalle) && ['saldo', 'sin-costo', 'cupo'].includes(f.costo))
);

/* ─── 7. EL BLOQUE DE CSS ───────────────────────────────────────────────── */
const INICIO_CSS = CSS.indexOf('/* ─── Manual y Soporte ─── */');
const FIN_CSS = CSS.indexOf('/* ─── fin Manual y Soporte ─── */');
check('el bloque de CSS existe, una sola vez', INICIO_CSS > -1 && FIN_CSS > INICIO_CSS && CSS.lastIndexOf('/* ─── Manual y Soporte ─── */') === INICIO_CSS);
const BLOQUE = INICIO_CSS > -1 && FIN_CSS > INICIO_CSS ? CSS.slice(INICIO_CSS, FIN_CSS) : '';
const BLOQUE_SIN_COMENTARIOS = BLOQUE.replace(/\/\*[\s\S]*?\*\//g, ' ');

const selectores = [...BLOQUE_SIN_COMENTARIOS.matchAll(/(^|\})\s*([^{}@]+)\{/g)]
  .map((m) => m[2].trim())
  .filter((s) => s.length > 0 && !/^(from|to|\d+%)$/.test(s));
const fueraDeAlcance = selectores
  .flatMap((s) => s.split(','))
  .map((s) => s.trim())
  .filter((s) => !/^(:root(\[data-theme='dark'\]|:not\(\[data-theme='light'\]\)) )?\.cara-nueva[.\s]/.test(s));
check('toda regla vive bajo .cara-nueva', selectores.length > 0 && fueraDeAlcance.length === 0, fueraDeAlcance.slice(0, 3).join(' | '));
const clasesAjenas = [...BLOQUE_SIN_COMENTARIOS.matchAll(/\.(cn-[a-z]+)-/g)].map((m) => m[1]).filter((c) => !['cn-man', 'cn-sop', 'cn-vis'].includes(c));
check('solo prefijos cn-man, cn-sop y cn-vis', clasesAjenas.length === 0, [...new Set(clasesAjenas)].join(', '));
check(
  'trae los dos oscuros',
  BLOQUE_SIN_COMENTARIOS.includes("@media (prefers-color-scheme: dark)") &&
    BLOQUE_SIN_COMENTARIOS.includes(":root:not([data-theme='light']) .cara-nueva") &&
    BLOQUE_SIN_COMENTARIOS.includes(":root[data-theme='dark'] .cara-nueva")
);
const tamanos = [...BLOQUE_SIN_COMENTARIOS.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
check('nada de 12 px o menos', tamanos.length > 0 && tamanos.every((t) => t > 12), tamanos.filter((t) => t <= 12).join(', '));
/* El único trazo discontinuo permitido es el del estado «sin verificar» en el manual. */
const discontinuos = [...BLOQUE_SIN_COMENTARIOS.matchAll(/([^{}]+)\{[^}]*dashed[^}]*\}/g)].map((m) => m[1].trim());
check('trazo discontinuo solo para «sin verificar»', discontinuos.every((s) => /sin-verificar/.test(s)), discontinuos.join(' | '));
check('sin oro: el oro es del módulo activo', !/--gold|#c8a046|#d9b45c/i.test(BLOQUE_SIN_COMENTARIOS));
const botones = [...BLOQUE_SIN_COMENTARIOS.matchAll(/([^{}]*boton[^{}]*)\{([^}]*)\}/g)]
  .filter((m) => /min-height|[^-]height/.test(m[2]))
  .map((m) => ({ s: m[1].trim(), alto: Number(/min-height:\s*(\d+)px/.exec(m[2])?.[1] ?? /height:\s*(\d+)px/.exec(m[2])?.[1] ?? 0) }));
check('todo botón mide 44 px o más', botones.length > 0 && botones.every((b) => b.alto >= 44), botones.filter((b) => b.alto < 44).map((b) => b.s).join(' | '));
check('respeta «reducir movimiento»', BLOQUE_SIN_COMENTARIOS.includes('prefers-reduced-motion: reduce'));

/* ─── 8. LOS COMPONENTES NUEVOS NO ESCRIBEN LETRA DE 12 PX ──────────────── */
const DIMINUTA = /text-\[(?:[0-9]|1[0-2])(?:\.\d+)?px\]|text-meta\b|text-\[1[0-2]px\]/;
for (const [nombre, fuente] of [
  ['PaginaDelManual', PAGINA_MANUAL],
  ['SupportView', SUPPORT_VIEW],
  ['ChatDeSoporte', CHAT],
  ['VisitaGuiada', VISITA],
  ['SupportAccessBanner', FRANJA],
  ['SupportAccessDecisionDialog', DECISION]
] as const) {
  check(`${nombre} no usa letra de 12 px o menos`, !DIMINUTA.test(fuente), fuente.match(DIMINUTA)?.[0] ?? '');
}

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
