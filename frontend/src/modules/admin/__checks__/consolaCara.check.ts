/**
 * Guarda la cara nueva de la CONSOLA DE OPERACIÓN: la lista de firmas, la ficha
 * de una firma, su plan y sus módulos, la recarga con motivo, la zona de
 * riesgo, la nueva contraseña, el pedido de acceso al contenido, el catálogo
 * maestro, la bandeja de soporte y el correo saliente.
 *
 * Run with: npm run check:consola-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. UN CONTEO QUE NO SE PUDO LEER PINTADO COMO CERO. Este módulo ya lo tuvo:
 *    `firmVolumes` descartaba los errores de lectura y la consola mostraba
 *    firmas con cero usuarios, cero transcritos y cero consumo — datos
 *    plausibles y falsos. El servidor ya lanza 502; la pantalla, por su lado,
 *    dice «no se pudo leer» y nunca «0» cuando la cifra no llegó.
 *
 * 2. EL ARTBOARD PROMETE MÁS DE LO QUE EL CÓDIGO HACE. `app-consola-de-operacion`
 *    dice que la respuesta de soporte «le llega a la firma por correo» (el chat
 *    no importa ningún correo: avisa por notificación del navegador), que el
 *    acceso «vence a las 24 horas» y «se limita a lo que pidió» (la duración la
 *    elige operación entre tres, la autoriza un socio, y el alcance es texto que
 *    el socio lee, no una frontera técnica), y cuenta «con artículo comprobado»
 *    (el maestro cuenta TÉRMINOS verificados). Cada frase queda prohibida aquí.
 *
 * 3. LA REGLA DE LA CORTESÍA ESCRITA DISTINTA DE LA DEL SERVIDOR. Una firma que
 *    crea el superusuario nace en Premium, en cortesía y sin vencimiento
 *    (`createFirm`). La pantalla lo dice con una sola constante, y el check lee
 *    el servidor para que la frase no sobreviva a un cambio de la regla.
 *
 * 4. EL MOTIVO MÁS LAXO QUE EL SERVIDOR. El formulario de plan pedía 5
 *    caracteres y `requireReason` exige 10: el botón se encendía y el servidor
 *    rechazaba. El mínimo vive en una constante que se compara con el servidor.
 *
 * 5. LA FORMA. Cara nueva con alcance propio, nada bajo 14 px, oscuro por los
 *    dos caminos, diálogos a 20 px, controles de 44 px, sin discontinuo, el
 *    rojo solo en lo que destruye, sin `<select>` del sistema operativo en
 *    escritorio y sin nombres ni NIT verosímiles (README §3).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MIN_MOTIVO,
  NO_SE_PUDO_LEER,
  REGLA_DE_CORTESIA,
  cifra,
  describirPlan,
  diasDeSaldo,
  esperanRespuesta,
  estadoDeFirma,
  faltaParaElMotivo,
  filtrarFirmas,
  hace,
  opcionDePlan,
  ordenarPorRiesgo,
  pesos,
  rotuloDeSoporte,
  validarCambioDePlan
} from '../consolaEnPantalla';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');
const BACKEND = join(SRC, '..', '..', 'backend', 'src');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const AHORA = Date.parse('2026-09-14T12:00:00Z');
const DIA = 86_400_000;
interface FirmaDePrueba {
  id: string;
  name: string;
  nit: string | null;
  plan: 'ESENCIAL' | 'PREMIUM' | 'FIRMA' | null;
  planPeriod: 'MENSUAL' | 'ANUAL' | 'PRUEBA' | 'CORTESIA' | null;
  planValidUntil: string | null;
  creditsBalance: number | null;
  consumo30dCop: number | null;
}
const firma = (cambios: Partial<FirmaDePrueba> = {}): FirmaDePrueba => ({
  id: 'f1',
  name: 'Firma 01',
  nit: '000.000.000-0' as string | null,
  plan: 'PREMIUM' as 'ESENCIAL' | 'PREMIUM' | 'FIRMA' | null,
  planPeriod: 'MENSUAL' as 'MENSUAL' | 'ANUAL' | 'PRUEBA' | 'CORTESIA' | null,
  planValidUntil: new Date(AHORA + 40 * DIA).toISOString() as string | null,
  creditsBalance: 300_000 as number | null,
  consumo30dCop: 30_000 as number | null,
  ...cambios
});

/* ─── 1. LO QUE NO SE LEYÓ NO ES CERO ────────────────────────────────────── */
check('una cifra sin leer dice «no se pudo leer»', cifra(null) === NO_SE_PUDO_LEER && cifra(undefined) === NO_SE_PUDO_LEER);
check('un NaN tampoco se pinta como número', cifra(Number.NaN) === NO_SE_PUDO_LEER && pesos(Number.NaN) === NO_SE_PUDO_LEER);
check('el cero leído SÍ es cero', cifra(0) === '0' && pesos(0) === '$0');
check('miles con separador colombiano', cifra(1234) === '1.234' && pesos(4_120_000) === '$4.120.000');
check('pesos sin leer no es $0', pesos(null) === NO_SE_PUDO_LEER);
check('la frase es la de la regla', NO_SE_PUDO_LEER === 'no se pudo leer');

/* ─── 2. DÍAS DE SALDO Y ESTADO, DERIVADOS COMO EL SERVIDOR ──────────────── */
check('días al ritmo de 30 días', diasDeSaldo(300_000, 30_000) === 300);
check('sin consumo no hay ritmo: null, no infinito ni cero', diasDeSaldo(300_000, 0) === null);
check('sin saldo leído no hay días', diasDeSaldo(null, 30_000) === null && diasDeSaldo(300_000, null) === null);
check('vencido', estadoDeFirma(firma({ planValidUntil: new Date(AHORA - DIA).toISOString() }), AHORA).etiqueta === 'Vencido');
check('vence pronto, en singular', estadoDeFirma(firma({ planValidUntil: new Date(AHORA + DIA / 2).toISOString() }), AHORA).etiqueta === 'Vence en 1 día');
check('saldo bajo = siete días de su propio uso', estadoDeFirma(firma({ creditsBalance: 5_000, consumo30dCop: 30_000 }), AHORA).etiqueta === 'Saldo bajo');
check('una firma sin consumo no está en saldo bajo', estadoDeFirma(firma({ creditsBalance: 0, consumo30dCop: 0 }), AHORA).etiqueta === 'Activa');
check('cortesía sin fecha no vence', estadoDeFirma(firma({ planPeriod: 'CORTESIA', planValidUntil: null }), AHORA).etiqueta === 'Cortesía');
check('prueba', estadoDeFirma(firma({ planPeriod: 'PRUEBA' }), AHORA).etiqueta === 'Prueba');
check('el tono de lo que pide llamar hoy es aviso, no peligro', estadoDeFirma(firma({ creditsBalance: 5_000 }), AHORA).tono === 'aviso');
check('plan y periodo', describirPlan(firma()) === 'Premium · mensual' && describirPlan(firma({ planPeriod: 'CORTESIA', planValidUntil: null })) === 'Premium · cortesía');
check('sin plan asignado se dice cortesía y no se inventa uno', describirPlan(firma({ plan: null, planPeriod: null, planValidUntil: null })) === 'Cortesía');

const lista = [
  firma({ id: 'a', name: 'Firma 01', nit: '000.000.000-1', creditsBalance: 900_000 }),
  firma({ id: 'b', name: 'Firma 02', nit: null, creditsBalance: 2_000, consumo30dCop: 30_000 }),
  firma({ id: 'c', name: 'Despacho 03', nit: '000.000.000-3', creditsBalance: 100, consumo30dCop: 30_000 })
];
check('la búsqueda encuentra por nombre, sin tildes ni mayúsculas', filtrarFirmas(lista, 'DESPACHO').map((f) => f.id).join() === 'c');
check('la búsqueda encuentra por NIT con o sin puntos', filtrarFirmas(lista, '0000000001').map((f) => f.id).join() === 'a');
check('sin texto no se filtra', filtrarFirmas(lista, '  ').length === 3);
check('primero la que se queda sin saldo antes', ordenarPorRiesgo(lista).map((f) => f.id).join() === 'c,b,a');

/* ─── 3. SOPORTE, MOTIVO, PLAN ───────────────────────────────────────────── */
const conversaciones = [
  { status: 'ABIERTA' as const, lastAuthor: 'FIRMA' as const },
  { status: 'ABIERTA' as const, lastAuthor: 'OPERADOR' as const },
  { status: 'CERRADA' as const, lastAuthor: 'FIRMA' as const }
];
check('esperan respuesta: abiertas cuyo último mensaje es de la firma', esperanRespuesta(conversaciones) === 1);
check('sin bandeja leída el botón no inventa un 0', rotuloDeSoporte(null) === 'Soporte' && rotuloDeSoporte(3) === 'Soporte · 3' && rotuloDeSoporte(0) === 'Soporte');
check('el motivo mínimo es el del servidor', MIN_MOTIVO === 10 && faltaParaElMotivo('  corto  ') === 5 && faltaParaElMotivo('suficiente motivo') === 0);
check('un periodo con fecha la exige', validarCambioDePlan({ periodo: 'MENSUAL', vence: '', motivo: 'Pedido del socio por teléfono' }) !== null);
check('la cortesía puede ir sin fecha', validarCambioDePlan({ periodo: 'CORTESIA', vence: '', motivo: 'Pedido del socio por teléfono' }) === null);
check('sin motivo suficiente no se guarda', validarCambioDePlan({ periodo: 'CORTESIA', vence: '', motivo: 'corto' }) !== null);
check('el plan lleva sus puestos solo si el servidor los dio', opcionDePlan('PREMIUM', { PREMIUM: { nombre: 'Premium', maxUsuarios: 5 } }) === 'Premium · hasta 5 usuarios' && opcionDePlan('PREMIUM', null) === 'Premium');
check('un solo puesto en singular', opcionDePlan('ESENCIAL', { ESENCIAL: { nombre: 'Esencial', maxUsuarios: 1 } }) === 'Esencial · 1 usuario');
check('quien nunca entró no tiene fecha inventada', hace(null, AHORA) === 'Todavía no ha entrado' && hace(new Date(AHORA - 3 * DIA).toISOString(), AHORA) === 'hace 3 días');

/* ─── 4. EL SERVIDOR, LEÍDO ──────────────────────────────────────────────── */
const back = (rel: string): string => readFileSync(join(BACKEND, rel), 'utf8');
const ADMIN = back('modules/admin/admin.service.ts');
const RUTAS = back('modules/admin/admin.routes.ts');
const CHAT = back('modules/support/supportChat.service.ts');
const ACCESO = back('modules/support/supportAccess.service.ts');

const crear = ADMIN.slice(ADMIN.indexOf('export const createFirm'), ADMIN.indexOf('export const createFirm') + 2200);
check(
  'createFirm escribe PREMIUM + CORTESIA sin vencimiento (la regla que la pantalla repite)',
  crear.includes("plan: 'PREMIUM'") && crear.includes("period: 'CORTESIA'") && crear.includes('diasDeVigencia: null')
);
check('la regla de la pantalla dice Premium, cortesía y sin vencimiento', /Premium/.test(REGLA_DE_CORTESIA) && /cortesía/.test(REGLA_DE_CORTESIA) && /sin vencimiento/.test(REGLA_DE_CORTESIA));
const volumenes = ADMIN.slice(ADMIN.indexOf('const firmVolumes'), ADMIN.indexOf('const EMPTY_VOLUMES'));
check('firmVolumes lee paginado y lanza 502 al no poder leer', volumenes.includes('leerTodasLasFilas') && volumenes.includes('listarTodasLasCuentas') && volumenes.includes('502'));
check('el motivo mínimo del servidor es 10', /MIN_REASON_LENGTH = 10\b/.test(ADMIN));
check('toda la consola cuelga de requireSuperAdmin', RUTAS.includes('router.use(requireSuperAdmin)'));
check('el chat de soporte no manda correo (no importa el módulo de correo)', !/from '\.\.\/mail\//.test(CHAT));
check('el acceso dura una de tres duraciones del servidor', ACCESO.includes('DURACIONES_PERMITIDAS = [60, 240, 1440]'));

/* ─── 5. LAS PANTALLAS, LEÍDAS COMO TEXTO ────────────────────────────────── */
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));
const C = 'modules/admin/components/';
const PANTALLAS: Record<string, string> = {
  CONSOLA_DIALOGO: leer(C + 'OperatorConsoleDialog.tsx'),
  CONSOLA: leer(C + 'OperatorConsole.tsx'),
  FICHA: leer(C + 'FirmDetailDialog.tsx'),
  PLAN: leer(C + 'FirmPlanSection.tsx'),
  RIESGO: leer(C + 'FirmDangerZone.tsx'),
  RECARGA: leer(C + 'RechargeFirmDialog.tsx'),
  ACCESO: leer(C + 'RequestSupportAccessDialog.tsx'),
  CONTRASENA: leer(C + 'ResetPasswordDialog.tsx'),
  MAESTRO: leer(C + 'CatalogMasterDialog.tsx'),
  BANDEJA: leer(C + 'BandejaDeSoporte.tsx'),
  CORREO: leer(C + 'CorreoSaliente.tsx'),
  NUEVA: leer(C + 'NuevaFirmaDialog.tsx')
};
const TODO = Object.values(PANTALLAS).join('\n');

check('la consola abre su alcance cara-nueva cn-ope', /className="cara-nueva cn-ope-dialogos"/.test(PANTALLAS.CONSOLA_DIALOGO));
for (const nombre of ['CONSOLA', 'FICHA', 'PLAN', 'RIESGO', 'RECARGA', 'ACCESO', 'CONTRASENA', 'MAESTRO', 'BANDEJA', 'CORREO', 'NUEVA']) {
  check(`${nombre} se pinta con clases cn-ope`, /className=\{?[`"]cn-ope-/.test(PANTALLAS[nombre]));
}
check('ninguna pantalla usa window.confirm/alert/prompt', !/window\.(confirm|alert|prompt)\(|\bconfirm\(/.test(TODO));
const chicos = TODO.match(/text-\[(?:[0-9]|1[0-3])(?:\.\d+)?px\]|text-(?:xs|meta)\b/g) ?? [];
check('ningún texto de Tailwind bajo 14 px quedó en la consola', chicos.length === 0, chicos.join(' '));
check('sin <select> del sistema: los selectores son SelectorDelFormulario', !/<select\b/.test(TODO) && PANTALLAS.PLAN.includes('<SelectorDelFormulario'));

const PROHIBIDAS: Array<[string, RegExp, string]> = [
  ['le llega a la firma por correo', /llega a la firma por correo|por correo y queda en su historial/i, 'el chat no manda correo'],
  ['vence a las 24 horas', /vence a las 24 horas/i, 'la duración se elige entre 1, 4 y 24 horas'],
  ['se limita a lo que pidió', /se limita a lo que pidió/i, 'el alcance es texto, no frontera técnica'],
  ['con artículo comprobado', /con artículo comprobado/i, 'el maestro cuenta términos verificados'],
  ['MRR / ingreso recurrente', /\bMRR\b|ingreso recurrente/i, 'no se calcula'],
  ['solo lectura del acceso de soporte', /acceso será de solo lectura/i, 'ninguna regla del servidor lo impone'],
  ['Norma derogada con cifra', /derogada\s*·\s*\d/i, 'Actuacion no tiene campo de derogatoria'],
  ['Publicar cambios como botón', />\s*Publicar cambios\s*</, 'el maestro es un artefacto de compilación'],
  ['Avisar del hueco', /Avisar del hueco/i, 'no hay tabla ni flujo']
];
for (const [nombre, patron, porque] of PROHIBIDAS) {
  check(`no se publica «${nombre}»`, !patron.test(TODO), porque);
}
check('las cifras de plan no se escriben a mano (vienen de plan.catalog)', !/hasta \d+ usuarios|\b85[.]?000\b|\b120[.]?000\b|\b250[.]?000\b/.test(TODO));
check('la nueva firma dice la regla de la cortesía con la constante', PANTALLAS.NUEVA.includes('REGLA_DE_CORTESIA'));
check('las cifras de la lista pasan por cifra()/pesos()', PANTALLAS.CONSOLA.includes('pesos(') && PANTALLAS.CONSOLA.includes('cifra(') && PANTALLAS.FICHA.includes('pesos('));
check('el plan pasa por la confirmación del sistema antes de guardarse', PANTALLAS.PLAN.includes('<ConfirmarDialog') && PANTALLAS.PLAN.includes('validarCambioDePlan('));
check('la nueva contraseña pasa por la confirmación del sistema', PANTALLAS.CONTRASENA.includes('<ConfirmarDialog'));
check('suspender y eliminar llevan el botón de peligro', PANTALLAS.PLAN.includes('peligro: true') && PANTALLAS.RIESGO.includes('peligro: true'));
check('el soporte muestra el conteo con rotuloDeSoporte (sin 0 inventado)', PANTALLAS.CONSOLA.includes('rotuloDeSoporte('));
check('la ficha vuelve a la lista con «Firmas»', /Firmas\s*<\/button>/.test(PANTALLAS.FICHA));

const REALES = /Restrepo|Mosquera|Rentería|Cárdenas|Orozco|Ávila|camila\.|javier\.|valentina\.|@sufirma\.co|operador@iureon\.co/;
check('sin nombres ni correos verosímiles del artboard', !REALES.test(TODO), (TODO.match(REALES) ?? []).join(' '));
check('el operador se identifica con su sesión, no con un correo escrito', !/ingdanielma/.test(TODO));

/* ─── 6. EL BLOQUE DE CSS ────────────────────────────────────────────────── */
const CSS = readFileSync(join(SRC, 'design', 'cara-nueva.css'), 'utf8');
const MARCA = '/* ─── Consola de operación ─── */';
const FIN = '/* ─── fin Consola de operación ─── */';
const inicio = CSS.indexOf(MARCA);
const final = CSS.indexOf(FIN);
check('cara-nueva.css tiene el bloque de la Consola de operación, cerrado', inicio !== -1 && final > inicio);
const bloque = inicio === -1 || final === -1 ? '' : CSS.slice(inicio + MARCA.length, final).replace(/\/\*[\s\S]*?\*\//g, ' ');

export const revisarBloque = (css: string) => {
  const sueltos: string[] = [];
  const ajenos: string[] = [];
  const reglas: Record<string, string> = {};
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const cabeza = m[1].replace(/@media[^{]*\{/g, '').trim();
    for (const sel of cabeza.split(',').map((s) => s.trim()).filter(Boolean)) {
      if (sel.startsWith('@keyframes') || /^(from|to|\d+%)$/.test(sel)) continue;
      const bien =
        sel.startsWith('.cara-nueva') ||
        sel.startsWith(":root:not([data-theme='light']) .cara-nueva") ||
        sel.startsWith(":root[data-theme='dark'] .cara-nueva");
      if (!bien) sueltos.push(sel);
      if (!/cn-ope/.test(sel)) ajenos.push(sel);
      reglas[sel] = (reglas[sel] ?? '') + m[2];
    }
  }
  const chicos = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((x) => Number(x[1])).filter((n) => n < 14);
  const radios = [...css.matchAll(/\[role='dialog'\] > div:last-child\s*\{[^}]*border-radius:\s*(\d+)px/g)].map((x) => Number(x[1]));
  const rojos = [...css.matchAll(/([^{}]+)\{([^{}]*#8c2f26[^{}]*)\}/gi)].map((x) => x[1].trim()).filter((s) => !/peligro/.test(s));
  return { sueltos, ajenos, reglas, chicos, radios, rojos };
};
const r = revisarBloque(bloque);
check('todo selector del bloque vive bajo .cara-nueva', bloque !== '' && r.sueltos.length === 0, r.sueltos.join(' · '));
check('todo selector del bloque es de cn-ope', bloque !== '' && r.ajenos.length === 0, r.ajenos.join(' · '));
check(
  'el bloque trae su modo oscuro por los dos caminos',
  bloque.includes(":root:not([data-theme='light']) .cara-nueva") && bloque.includes(":root[data-theme='dark'] .cara-nueva")
);
check('ningún tamaño del bloque baja de 14 px', bloque !== '' && r.chicos.length === 0, r.chicos.join(', '));
check('los diálogos vestidos desde fuera no bajan de 20 px', r.radios.length > 0 && r.radios.every((x) => x >= 20), r.radios.join(', '));
check('el borde discontinuo no se usa (se reserva a lo sin verificar)', !/dashed/.test(bloque));
check('#8C2F26 solo en reglas de peligro', r.rojos.length === 0, r.rojos.join(' · '));
check('el diálogo se viste con el selector compuesto (.cara-nueva.cn-ope-dialogos)', bloque.includes(".cara-nueva.cn-ope-dialogos [role='dialog'] > div:last-child"));
check(
  'el título grande solo viste la consola, no los diálogos que cuelgan de ella (combinador hijo)',
  bloque.includes(".cara-nueva .cn-ope-pantalla > [role='dialog'] > div:last-child > header h2")
);
for (const sel of ['.cara-nueva .cn-ope-boton', '.cara-nueva .cn-ope-campo', '.cara-nueva .cn-ope-fila']) {
  check(`${sel} mide al menos 44 px`, /min-height:\s*(4[4-9]|[5-9]\d)px/.test(r.reglas[sel] ?? ''), r.reglas[sel] ?? 'sin regla');
}
check('el peligro es #8C2F26', /#8c2f26/i.test(r.reglas['.cara-nueva .cn-ope-boton--peligro'] ?? ''));
check(
  'la confirmación que destruye se rellena con el token de peligro (no queda de contorno)',
  /background:\s*var\(--danger\)/.test(r.reglas[".cara-nueva.cn-ope-dialogos [role='dialog'] > div:last-child > footer button.btn-danger"] ?? '')
);
check(
  'el marco se viste por hijos directos del panel (no alcanza el <header> de la ficha)',
  !/\[role='dialog'\] (header|footer)\b/.test(bloque) && bloque.includes("[role='dialog'] > div:last-child > header > button")
);
check('la lista cabe en 375: la tabla se vuelve tarjetas bajo 640', /@media \(max-width: 639px\)/.test(bloque));

const ESQUINAS = readFileSync(join(SRC, 'design', '__checks__', 'esquinasDeDialogos.check.ts'), 'utf8');
check('check:esquinas-dialogos vigila el override de la consola', ESQUINAS.includes("'cn-ope-dialogos'"));
const PKG = readFileSync(join(SRC, '..', 'package.json'), 'utf8');
check('este check está registrado en package.json', PKG.includes('"check:consola-cara"'));

/* ─── 7. QUE MUERDA ──────────────────────────────────────────────────────── */
const muerde = (nombre: string, dejaPasar: boolean): void => check(`muerde: ${nombre}`, !dejaPasar);
const malo = revisarBloque(".cara-nueva .cn-ope-x { font-size: 13px; color: #8C2F26; }\n.cn-ope-suelto { color: red; }\n.cara-nueva.cn-ope-dialogos [role='dialog'] > div:last-child { border-radius: 16px; }");
muerde('un texto de 13 px', malo.chicos.length === 0);
muerde('un selector fuera de .cara-nueva', malo.sueltos.length === 0);
muerde('un diálogo a 16 px', malo.radios.every((x) => x >= 20));
muerde('el rojo de peligro en una regla que no es de peligro', malo.rojos.length === 0);
muerde('una cifra sin leer pintada como 0', cifra(null) === '0');
muerde('la frase del correo que no sale', !PROHIBIDAS[0][1].test('La respuesta le llega a la firma por correo y queda en su historial de soporte.'));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
