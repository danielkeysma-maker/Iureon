/**
 * Guarda la cara nueva de Auditoría, Privacidad y Seguridad.
 *
 * Run with: npm run check:privacidad-seguridad-auditoria-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. EL CÓDIGO CRUDO EN EL REGISTRO. La pantalla nombraba 33 de las 46 acciones
 *    que el servidor escribe; las otras trece —las carpetas del expediente, el
 *    acceso de soporte, las revisiones— salían como `EXPEDIENTE_CARPETA_MOVED`.
 *    Una auditoría que se escribe en códigos no la lee el socio que la necesita.
 *    Se compara contra la unión `AuditAction` del backend, leída como texto.
 *
 * 2. «NO SE PUDO LEER» PINTADO COMO «NO HAY EVENTOS». El servidor devolvía `[]`
 *    al fallar, y la pantalla lo pintaba como una firma sin actividad.
 *
 * 3. CIEN FILAS PRESENTADAS COMO EL REGISTRO. `limit(100)` sin total ni página
 *    siguiente; el CSV salía con esas cien. La lectura por páginas vive en el
 *    servidor (`check:auditoria-paginas`); aquí se comprueba que la pantalla la
 *    use, una las partes sin repetir y diga cuántas quedan.
 *
 * 4. LO QUE LA MAQUETA O LA COSTUMBRE PROMETEN Y EL CÓDIGO NO HACE: cifrado de
 *    extremo a extremo, certificaciones, segundo factor, listas de sesiones,
 *    geolocalización, plazos de conservación, «cumplimiento» de la Ley 1581.
 *
 * 5. LA LISTA DE SUBENCARGADOS ESCRITA EN LA PANTALLA. Sale del servidor; un
 *    nombre de proveedor escrito en el componente es una copia que envejece.
 *
 * 6. LA PIEL: raíz `.cara-nueva` con su `data-visita` literal, nada por debajo
 *    de 14 px, los dos oscuros, sin discontinuo ni oro, controles de 44 px.
 *
 * Los componentes se leen como TEXTO y sin comentarios: los comentarios que
 * explican por qué no se dice algo contienen la palabra.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ACCIONES,
  PERIODOS,
  VISTAS,
  csvDeEventos,
  estadoDeLaLista,
  filtrarEventos,
  inicioDelPeriodo,
  nombreDeAccion,
  partirEnTituloYDetalle,
  quedanPorLeer,
  unirPartes
} from '../registro';
import type { AuditLogEntry } from '../services/audit.api';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');
const BACKEND = join(SRC, '..', '..', 'backend', 'src');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const leer = (ruta: string): string => readFileSync(join(SRC, ruta), 'utf8');
const sinComentarios = (s: string): string =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/^\s*\/\/.*$/gm, '');

/* ─── Fixtures: marcadores, nunca datos de una firma real ───────────────── */
const evento = (id: string, over: Partial<AuditLogEntry> = {}): AuditLogEntry => ({
  id,
  firmId: 'FIRMA-0',
  userEmail: 'usuario0@ejemplo.test',
  action: 'DRAFT_GENERATED',
  resource: 'Recurso 00',
  ipAddress: '0.0.0.0',
  timestamp: '2030-01-01T00:00:00.000Z',
  ...over
});

/* ─── 1. TODA ACCIÓN DEL SERVIDOR TIENE NOMBRE ──────────────────────────── */
const servicioAuditoria = readFileSync(join(BACKEND, 'modules', 'audit', 'audit.service.ts'), 'utf8');
const union = servicioAuditoria.slice(servicioAuditoria.indexOf('export type AuditAction'), servicioAuditoria.indexOf('export interface AuditLogEntry'));
const codigos = [...union.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]);
check('la unión AuditAction del backend se leyó', codigos.length >= 40, `${codigos.length} códigos`);
const sinNombre = codigos.filter((c) => !ACCIONES[c]);
check('toda acción que el servidor puede escribir tiene nombre en español', sinNombre.length === 0, sinNombre.join(', '));
const inventadas = Object.keys(ACCIONES).filter((c) => !codigos.includes(c));
check('no se nombra una acción que el servidor no escribe', inventadas.length === 0, inventadas.join(', '));
const nuevas = ['ESTILO_ENSENADO', 'ESTILO_RETIRADO', 'CONTRASENA_RECUPERACION_SOLICITADA', 'CONTRASENA_RESTABLECIDA', 'EXPEDIENTE_DOCUMENT_RENAMED', 'EXPEDIENTE_CARPETA_CREATED', 'EXPEDIENTE_CARPETA_RENAMED', 'EXPEDIENTE_CARPETA_MOVED', 'EXPEDIENTE_CARPETA_DELETED'];
check('las acciones nuevas tienen nombre', nuevas.every((c) => Boolean(ACCIONES[c])), nuevas.filter((c) => !ACCIONES[c]).join(', '));
check('ningún nombre es el código crudo', Object.entries(ACCIONES).every(([c, n]) => n !== c && !/^[A-Z_]+$/.test(n)));
check('un código desconocido se nombra como tal, sin inventarle sentido', nombreDeAccion('ACCION_FUTURA').includes('ACCION_FUTURA'));
const vistasHuerfanas = VISTAS.flatMap((v) => v.acciones).filter((c) => !codigos.includes(c));
check('las vistas frecuentes solo preguntan por acciones que existen', vistasHuerfanas.length === 0, vistasHuerfanas.join(', '));

/* ─── 2. FALLAR NO ES ESTAR VACÍO ───────────────────────────────────────── */
check('cargando sin nada leído', estadoDeLaLista({ cargando: true, error: null, leidos: 0 }) === 'CARGANDO');
check('error sin nada leído: NO SE PUDO LEER, nunca vacío', estadoDeLaLista({ cargando: false, error: 'x', leidos: 0 }) === 'NO_SE_PUDO_LEER');
check('error con filas leídas: la lista está INCOMPLETA', estadoDeLaLista({ cargando: false, error: 'x', leidos: 5 }) === 'INCOMPLETA');
check('sin error y sin filas: vacío de verdad', estadoDeLaLista({ cargando: false, error: null, leidos: 0 }) === 'VACIO');
check('con filas: lista', estadoDeLaLista({ cargando: false, error: null, leidos: 3 }) === 'LISTA');
check('leyendo la página siguiente no borra las filas que ya se ven', estadoDeLaLista({ cargando: true, error: null, leidos: 3 }) === 'LISTA');

/* ─── 3. LAS PÁGINAS ────────────────────────────────────────────────────── */
const unidas = unirPartes([evento('a'), evento('b')], [evento('b'), evento('c')]);
check('unir partes no repite el evento que corrió de página', unidas.map((e) => e.id).join() === 'a,b,c', unidas.map((e) => e.id).join());
check('quedan por leer con total', quedanPorLeer(1200, 1500) === 300);
check('sin total no se inventa cuántos quedan', quedanPorLeer(200, null) === null);
check('nunca quedan negativos', quedanPorLeer(10, 5) === 0);
const ahora = new Date('2030-02-01T12:00:00.000Z');
check('los 30 días empiezan 30 días antes', inicioDelPeriodo('30', ahora) === '2030-01-02T12:00:00.000Z', String(inicioDelPeriodo('30', ahora)));
check('«todo el registro» no filtra', inicioDelPeriodo('todo', ahora) === null);
check('cada periodo tiene etiqueta', PERIODOS.every((p) => p.etiqueta.length > 0));

/* ─── 4. FILTROS Y CSV ──────────────────────────────────────────────────── */
const muestra = [
  evento('1', { action: 'EXPEDIENTE_CARPETA_MOVED', resource: 'Carpeta 00' }),
  evento('2', { userEmail: 'otro0@ejemplo.test', action: 'CONTRASENA_RESTABLECIDA' })
];
check('la búsqueda encuentra por el nombre en español', filtrarEventos(muestra, { busqueda: 'carpeta', usuario: 'TODOS', vista: null }).length === 1);
check('el filtro de usuario', filtrarEventos(muestra, { busqueda: '', usuario: 'otro0@ejemplo.test', vista: null }).length === 1);
const csv = csvDeEventos([evento('9', { resource: 'Dijo "hola", y siguió' })]);
check('el CSV escapa comillas y nombra la acción en español', csv.includes('"Dijo ""hola"", y siguió"') && csv.includes(`"${ACCIONES.DRAFT_GENERATED}"`));
check('el CSV lleva la IP y el identificador del evento', csv.includes('"0.0.0.0"') && csv.includes('"9"'));

const partida = partirEnTituloYDetalle('No se guarda el audio de una audiencia: solo su transcrito. Un audio pesa.');
check('una línea del servidor se parte en título y detalle sin perder texto', partida.titulo === 'No se guarda el audio de una audiencia' && partida.detalle === 'Solo su transcrito. Un audio pesa.', JSON.stringify(partida));
const entera = partirEnTituloYDetalle('Iureon no usa el contenido de una firma para entrenar ningún modelo.');
check('una línea de una sola frase queda como título', entera.titulo.startsWith('Iureon no usa') && entera.detalle === '', JSON.stringify(entera));

/* ─── 5. LA PANTALLA USA LO QUE EL SERVIDOR DA ──────────────────────────── */
const API = sinComentarios(leer('modules/audit/services/audit.api.ts'));
const HOOK = sinComentarios(leer('modules/audit/hooks/useRegistroDeAuditoria.ts'));
const ESCRITORIO = sinComentarios(leer('modules/audit/components/AuditView.tsx'));
const MOVIL = sinComentarios(leer('modules/audit/components/AuditMobileView.tsx'));
const PRIVACIDAD = sinComentarios(leer('modules/privacy/components/SubprocessorsView.tsx'));
const SEGURIDAD = sinComentarios(leer('modules/support/components/SeguridadDeLaFirma.tsx'));

check('la API pide la página con desde, límite e inicio', API.includes('desde') && API.includes('limite') && API.includes('inicio'));
check('la API lee el total y si hay más', API.includes('total') && API.includes('hayMas'));
check('el registro une partes por id', HOOK.includes('unirPartes('));
check('el registro deriva su estado de la función pura', HOOK.includes('estadoDeLaLista('));
for (const [nombre, texto] of [['escritorio', ESCRITORIO], ['teléfono', MOVIL]] as const) {
  check(`${nombre}: usa el registro compartido`, texto.includes('useRegistroDeAuditoria('));
  check(`${nombre}: pinta «no se pudo leer» aparte del vacío`, texto.includes("'NO_SE_PUDO_LEER'") && texto.includes("'VACIO'") && texto.includes('No se pudo leer'));
  check(`${nombre}: ofrece leer lo que queda`, texto.includes('cargarMas'));
  check(`${nombre}: no escribe su propio mapa de acciones`, !texto.includes("DRAFT_GENERATED:"));
}
check('privacidad: una lectura fallida se dice, no se cuenta como cero', PRIVACIDAD.includes('No se pudo leer'));
check('seguridad: una lectura fallida del acceso de soporte se dice', SEGURIDAD.includes('No se pudo leer'));

/* ─── 6. RAÍCES, VISITA Y MARCADORES ────────────────────────────────────── */
const raiz = (texto: string, visita: string, clase: string): boolean =>
  new RegExp(`data-visita="${visita}"[^>]*className=\\{?[\`"'][^\`"']*cara-nueva[^\`"']*${clase}`).test(texto);
check('Auditoría (escritorio): raíz cara-nueva con data-visita literal', raiz(ESCRITORIO, 'vista-audit', 'cn-aud2'));
check('Auditoría (teléfono): raíz cara-nueva con data-visita literal', raiz(MOVIL, 'vista-audit', 'cn-aud2'));
check('Privacidad: raíz cara-nueva con data-visita literal', raiz(PRIVACIDAD, 'vista-privacidad', 'cn-pri'));
check('el buscador de la auditoría tiene marcador', /placeholder="[^"]+"/.test(ESCRITORIO) && /placeholder="[^"]+"/.test(MOVIL));

/* ─── 7. NADA QUE EL CÓDIGO NO HACE ─────────────────────────────────────── */
const PROHIBIDAS: Array<[RegExp, string]> = [
  [/ISO\s?27001|certificaci[oó]n|certificad[oa]/i, 'certificaciones'],
  [/extremo a extremo|end-to-end/i, 'cifrado de extremo a extremo'],
  [/cifrad[oa]|encriptad[oa]/i, 'cifrado'],
  [/segundo factor|2FA|doble factor|autenticaci[oó]n de dos/i, 'segundo factor'],
  [/sesiones activas|dispositivos conectados|lista de sesiones/i, 'lista de sesiones'],
  [/geolocaliz|ubicaci[oó]n de la IP|desde qu[eé] ciudad/i, 'geolocalización'],
  [/se conserva(?:n)? (?:por|durante) \d|\d+\s*(?:años|meses) de retenci[oó]n|se purga/i, 'plazo de conservación'],
  [/cumple(?:mos)? (?:con )?(?:la )?Ley 1581|cumplimiento de la Ley 1581|garantizamos/i, 'cumplimiento legal'],
  [/residencia de (?:los )?datos|datos en Colombia/i, 'residencia de datos'],
  [/Descargar en Excel/i, 'Excel (sale CSV)']
];
const pantallas = { AuditView: ESCRITORIO, AuditMobileView: MOVIL, SubprocessorsView: PRIVACIDAD, SeguridadDeLaFirma: SEGURIDAD };
for (const [nombre, texto] of Object.entries(pantallas)) {
  const halladas = PROHIBIDAS.filter(([re]) => re.test(texto)).map(([, que]) => que);
  check(`${nombre}: no afirma lo que el código no hace`, halladas.length === 0, halladas.join(', '));
}
const servicioPrivacidad = readFileSync(join(BACKEND, 'modules', 'privacy', 'subprocessors.service.ts'), 'utf8');
const textosDelServidor = [...servicioPrivacidad.matchAll(/'([^'\n]{20,})'/g)].map((m) => m[1]).join('\n');
const enServidor = PROHIBIDAS.filter(([re]) => re.test(textosDelServidor)).map(([, que]) => que);
check('el registro del servidor tampoco lo afirma', enServidor.length === 0, enServidor.join(', '));

/* ─── 8. LOS SUBENCARGADOS SALEN DEL SERVIDOR ───────────────────────────── */
const PROVEEDORES = ['Supabase', 'Backblaze', 'Deepgram', 'Cloudflare', 'OpenRouter', 'Anthropic', 'Wompi', 'Vercel', 'Resend', 'Gmail'];
const escritos = PROVEEDORES.filter((p) => PRIVACIDAD.includes(p) || SEGURIDAD.includes(p));
check('la pantalla no escribe nombres de proveedores: los lee', escritos.length === 0, escritos.join(', '));
check('la pantalla pide la lista al servidor', PRIVACIDAD.includes('privacyApi.subprocessors('));
const mail = readFileSync(join(BACKEND, 'modules', 'mail', 'mail.service.ts'), 'utf8');
const proveedoresDeCorreo = [...new Set([...mail.matchAll(/config\.mail\.provider === '([a-z]+)'/g)].map((m) => m[1]))];
check('se leyeron los proveedores de correo del envío real', proveedoresDeCorreo.length >= 1, proveedoresDeCorreo.join(', '));
const correoSinDeclarar = proveedoresDeCorreo.filter((p) => !servicioPrivacidad.includes(`config.mail.provider === '${p}'`));
check('todo proveedor por el que sale correo está en el registro de subencargados', correoSinDeclarar.length === 0, correoSinDeclarar.join(', '));
check('el registro declara también el proveedor alterno (Gmail)', servicioPrivacidad.includes("config.mail.provider === 'gmail'"));

/* ─── 9. LA PIEL ────────────────────────────────────────────────────────── */
const CSS = leer('design/cara-nueva.css');
const APERTURA = '/* ─── Privacidad, Seguridad y Auditoría ─── */';
const CIERRE = '/* ─── fin Privacidad, Seguridad y Auditoría ─── */';
const iA = CSS.indexOf(APERTURA);
const iC = CSS.indexOf(CIERRE);
check('el bloque CSS existe con sus dos marcadores', iA > -1 && iC > iA);
const bloque = iA > -1 && iC > iA ? CSS.slice(iA, iC).replace(/\/\*[\s\S]*?\*\//g, '') : '';

const tamanos = [...bloque.matchAll(/font-size:\s*([\d.]+)px/g)].map((m) => Number(m[1]));
check('el bloque declara tamaños', tamanos.length > 10, `${tamanos.length}`);
check('nada por debajo de 14 px', tamanos.every((t) => t >= 14), tamanos.filter((t) => t < 14).join(', '));

const reglas = [...bloque.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ sel: m[1].trim(), cuerpo: m[2] }));
const fuera = reglas.filter((r) => !r.sel.startsWith('@') && r.sel.split(',').some((s) => !s.includes('.cara-nueva')));
check('toda regla vive bajo .cara-nueva', fuera.length === 0, fuera.map((r) => r.sel).slice(0, 3).join(' | '));
const prefijosAjenos = reglas.filter((r) => /\.cn-(?!pri-|pri\b|seg-|seg\b|aud2-|aud2\b)[a-z]/.test(r.sel.replace(/\.cara-nueva/g, '')));
check('solo prefijos cn-pri- / cn-seg- / cn-aud2-', prefijosAjenos.length === 0, prefijosAjenos.map((r) => r.sel).slice(0, 3).join(' | '));

for (const raizCss of ['.cara-nueva.cn-aud2', '.cara-nueva.cn-pri']) {
  check(`${raizCss}: forma oscura por preferencia del sistema`, bloque.includes(`:root:not([data-theme='light']) ${raizCss}`));
  check(`${raizCss}: forma oscura elegida`, bloque.includes(`:root[data-theme='dark'] ${raizCss}`));
}
check('sin borde discontinuo: aquí nada está sin verificar', !/dashed/.test(bloque));
check('sin oro: es del módulo activo del panel', !/--gold/.test(bloque));
const monoIndebido = reglas.filter((r) => r.cuerpo.includes('var(--mono)') && !/-(cita|hora|ip|id|hash|valor)\b/.test(r.sel));
check('el mono solo para lo citable (hora, IP, identificador, hash)', monoIndebido.length === 0, monoIndebido.map((r) => r.sel).join(' | '));
const controles = reglas.filter((r) => /-(boton|campo|selector|chip|fila-boton)(\b|--)/.test(r.sel) && !r.sel.includes(':') && /display/.test(r.cuerpo));
const bajos = controles.filter((r) => !/min-height:\s*(4[4-9]|[5-9]\d)px|height:\s*(4[4-9]|[5-9]\d)px/.test(r.cuerpo));
check('todo control mide 44 px o más', controles.length > 0 && bajos.length === 0, bajos.map((r) => r.sel).join(' | '));
const modales = reglas.filter((r) => /-(hoja|dialogo|panel-modal)\b/.test(r.sel) && /border-radius/.test(r.cuerpo));
const radioBajo = modales.filter((r) => Number((r.cuerpo.match(/border-radius:\s*(\d+)px/) ?? [])[1] ?? 0) < 20);
check('toda hoja o diálogo propio va a 20 px o más', radioBajo.length === 0, radioBajo.map((r) => r.sel).join(' | '));

/* Las tablas se vuelven tarjetas en el teléfono: ningún ancho fijo sin su consulta de escritorio. */
const dentroDeConsultaDeAncho = (pos: number): boolean => {
  /* Recorre hacia atrás contando llaves: la columna fija debe estar un nivel dentro de un `@media (min-width`. */
  let profundidad = 0;
  for (let i = pos; i >= 0; i--) {
    if (bloque[i] === '}') profundidad++;
    else if (bloque[i] === '{') {
      if (profundidad === 0) {
        const cabecera = bloque.slice(bloque.lastIndexOf('}', i - 1) + 1, i);
        if (cabecera.includes('@media') && cabecera.includes('min-width')) return true;
      } else profundidad--;
    }
  }
  return false;
};
const columnasFijas = [...bloque.matchAll(/grid-template-columns:[^;]*\d{3}px/g)];
const sueltas = columnasFijas.filter((m) => !dentroDeConsultaDeAncho(m.index ?? 0));
check('las columnas fijas solo existen dentro de una consulta de ancho (en el teléfono son tarjetas)', columnasFijas.length > 0 && sueltas.length === 0, `${columnasFijas.length} fijas, ${sueltas.length} sueltas`);

/* ─── 10. LO QUE NO SE TOCA ─────────────────────────────────────────────── */
const APP = leer('App.tsx');
check('Auditoría sigue montada en la vista `audit`', APP.includes("mainView === 'audit'") && APP.includes('<AuditView') && APP.includes('<AuditMobileView'));
check('Privacidad sigue montada en la vista `privacidad`', APP.includes("mainView === 'privacidad'") && APP.includes('<SubprocessorsView'));
check('la decisión del acceso de soporte la sigue tomando el socio', APP.includes('puedeDecidirAcceso={Boolean(esSocio)}'));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exit(fallos === 0 ? 0 : 1);
