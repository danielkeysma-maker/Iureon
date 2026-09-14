/**
 * Guarda la cara nueva de ADMINISTRAR Y SALDO: «Su firma» (usuarios y roles),
 * «Saldo de la firma», la recarga por Wompi con sus estados y el Membrete.
 *
 * Run with: npm run check:administrar-saldo-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. EL ARTBOARD PROMETE MÁS DE LO QUE EL CÓDIGO HACE. `app-administrar-y-saldo`
 *    dice que retirar a alguien «libera un puesto» (el servidor cuenta TODAS las
 *    cuentas, también las desactivadas), que los montos son «sin IVA» (el
 *    servidor firma el monto tal cual), que la factura electrónica «llegará al
 *    correo» (no existe) y ofrece «Invitar» con «invitación enviada» (no sale
 *    ningún correo: la cuenta se crea con contraseña). Cada frase falsa queda
 *    prohibida aquí, con la regla del servidor que la desmiente.
 *
 * 2. LA PLATA ESCRITA A MANO. El mínimo de recarga y el costo por escrito los
 *    decide el servidor (`MIN_RECHARGE_COP`, `PRICE_COP`). Una cifra escrita en
 *    el componente se queda vieja el día que el servidor cambie, y en la
 *    pantalla del dinero eso es cobrar una cosa y anunciar otra.
 *
 * 3. LA PANTALLA MÁS ESTRICTA O MÁS LAXA QUE EL SERVIDOR. Gestionar usuarios es
 *    de socios (403 para el abogado); recargar y guardar el membrete NO tienen
 *    esa puerta en el servidor. La pantalla no puede decir que «solo el socio
 *    recarga» mientras cualquier abogado puede hacerlo.
 *
 * 4. EL MEMBRETE CON DATOS DE PERSONAS REALES Y CON UNA FIRMA QUE NO SE IMPRIME.
 *    La previsualización traía un nombre, una cédula y un NIT verosímiles, y un
 *    campo «Firma escaneada» que ningún exportador lee.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buscarIntento,
  escritosQueAlcanzan,
  estadoDeRecarga,
  guardarRecargaEnCurso,
  leerMonto,
  leerRecargaEnCurso,
  montosSugeridos,
  olvidarRecargaEnCurso,
  pesos,
  textoDelEstado
} from '../recargaEnPantalla';
import {
  accionesPosibles,
  esLimiteDeUsuarios,
  puestosEnPalabras,
  quedanPuestos,
  ultimoIngreso
} from '../../tenant/usuariosEnPantalla';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');
const BACKEND = join(SRC, '..', '..', 'backend', 'src');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── 1. LA RECARGA, EN FUNCIONES PURAS ──────────────────────────────────── */
check('los montos sugeridos salen del mínimo del servidor', JSON.stringify(montosSugeridos(100_000)) === '[100000,200000,500000]');
check('sin mínimo leído no se sugiere nada', montosSugeridos(0).length === 0);
check('escritos que alcanzan, por lo bajo', escritosQueAlcanzan(200_000, 2000) === 100 && escritosQueAlcanzan(1999, 2000) === 0);
check('sin costo medio no se inventa un número de escritos', escritosQueAlcanzan(100_000, 0) === null);
check('el monto tecleado solo toma dígitos', leerMonto('$ 150.000') === 150000 && leerMonto('') === 0);
check('pesos con separador colombiano', pesos(214000) === '$214.000');

check('PENDING espera', estadoDeRecarga('PENDING') === 'esperando');
check('APPROVED entra', estadoDeRecarga('APPROVED') === 'aprobada');
check('DECLINED rechaza', estadoDeRecarga('DECLINED') === 'rechazada');
check('VOIDED anula', estadoDeRecarga('VOIDED') === 'anulada');
check('ERROR y lo desconocido no se pintan como aprobados', estadoDeRecarga('ERROR') === 'fallida' && estadoDeRecarga('LO_QUE_SEA') === 'fallida');

const rechazo = textoDelEstado('rechazada');
check('el rechazo dice que no se cobró', /no se le cobró nada/i.test(rechazo.detalle));
check('la anulación y el fallo dicen que el saldo no entró', /no se acreditó/i.test(textoDelEstado('anulada').detalle) && /no se acreditó/i.test(textoDelEstado('fallida').detalle));
check('la espera no obliga a dejar la ventana abierta (el saldo lo acredita el servidor)', !/no cierre/i.test(textoDelEstado('esperando').detalle) && /entra solo/i.test(textoDelEstado('esperando').detalle));

const memoria = new Map<string, string>();
const almacen = {
  getItem: (k: string) => memoria.get(k) ?? null,
  setItem: (k: string, v: string) => void memoria.set(k, v),
  removeItem: (k: string) => void memoria.delete(k)
};
guardarRecargaEnCurso('REF-1', almacen);
check('la recarga en curso se recuerda en la pestaña', leerRecargaEnCurso(almacen) === 'REF-1');
olvidarRecargaEnCurso(almacen);
check('y se olvida', leerRecargaEnCurso(almacen) === null);
const roto = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); }, removeItem: () => { throw new Error('bloqueado'); } };
check('un almacenamiento bloqueado no rompe la pantalla', leerRecargaEnCurso(roto) === null && (guardarRecargaEnCurso('X', roto), true));
check('el intento se busca por referencia', buscarIntento([{ reference: 'A', amountCop: 1, status: 'PENDING', createdAt: '' }], 'A')?.reference === 'A' && buscarIntento([], 'A') === null);

/* ─── 2. LOS USUARIOS, EN FUNCIONES PURAS ────────────────────────────────── */
check('puestos con tope', puestosEnPalabras({ plan: 'PREMIUM', maxUsers: 5, usuarios: 4 }) === '4 de 5 puestos del plan Premium', String(puestosEnPalabras({ plan: 'PREMIUM', maxUsers: 5, usuarios: 4 })));
check('puestos sin tope', puestosEnPalabras({ plan: null, maxUsers: null, usuarios: 3 }) === '3 usuarios');
check('un solo puesto en singular', puestosEnPalabras({ plan: 'ESENCIAL', maxUsers: 1, usuarios: 1 }) === '1 de 1 puesto del plan Esencial');
check('sin plan leído no se dice nada', puestosEnPalabras(null) === null);
check('lleno no admite otro', !quedanPuestos({ plan: 'PREMIUM', maxUsers: 5, usuarios: 5 }) && quedanPuestos({ plan: 'PREMIUM', maxUsers: 5, usuarios: 4 }));
check('sin plan leído no se bloquea (decide el servidor)', quedanPuestos(null) && quedanPuestos({ plan: null, maxUsers: null, usuarios: 40 }));

const abogado = { email: 'a@sufirma.co', role: 'LAWYER' as const, desactivado: false };
check('a otro abogado activo se le puede cambiar el rol y retirar', JSON.stringify(accionesPosibles(abogado, 'yo@sufirma.co')) === JSON.stringify({ cambiarRol: true, retirar: true, reactivar: false }));
check('a uno mismo nada (el servidor responde SELF_LOCKOUT y SELF_DEMOTION)', JSON.stringify(accionesPosibles({ ...abogado, email: 'YO@sufirma.co' }, 'yo@sufirma.co')) === JSON.stringify({ cambiarRol: false, retirar: false, reactivar: false }));
check('al operador nada', JSON.stringify(accionesPosibles({ ...abogado, role: 'SUPER_ADMIN' }, 'yo@sufirma.co')) === JSON.stringify({ cambiarRol: false, retirar: false, reactivar: false }));
check('al retirado solo reactivar', JSON.stringify(accionesPosibles({ ...abogado, desactivado: true }, 'yo@sufirma.co')) === JSON.stringify({ cambiarRol: false, retirar: false, reactivar: true }));
check('quien nunca entró se dice sin inventar una invitación', ultimoIngreso(null) === 'Todavía no ha entrado');
const AHORA = Date.parse('2026-09-14T12:00:00Z');
check('ayer y hace días', ultimoIngreso('2026-09-13T11:00:00Z', AHORA) === 'ayer' && ultimoIngreso('2026-09-11T12:00:00Z', AHORA) === 'hace 3 días');
check('el 409 de cupo se reconoce por su código', esLimiteDeUsuarios({ code: 'LIMITE_DE_USUARIOS' }) && !esLimiteDeUsuarios(new Error('x')) && !esLimiteDeUsuarios(null));

/* ─── 3. EL SERVIDOR, LEÍDO: LAS REGLAS QUE LA PANTALLA ESPEJA ───────────── */
const back = (rel: string): string => readFileSync(join(BACKEND, rel), 'utf8');
const BILLING = back('modules/billing/billing.service.ts');
const WOMPI_CTRL = back('modules/billing/wompi/wompi.controller.ts');
const BRANDING_ROUTES = back('modules/branding/branding.routes.ts');
const BRANDING_CTRL = back('modules/branding/branding.controller.ts');
const AUTH_CTRL = back('modules/auth/auth.controller.ts');
const PLAN = back('modules/subscriptions/plan.service.ts');
const WOMPI = back('modules/billing/wompi/wompi.service.ts');

check('el mínimo de recarga vive en el servidor', /export const MIN_RECHARGE_COP = \d/.test(BILLING));
check('el resumen del saldo entrega minRecharge', /minRecharge/.test(back('modules/billing/billing.controller.ts')));
const soloAdmin = AUTH_CTRL.slice(AUTH_CTRL.indexOf('const soloAdmin'), AUTH_CTRL.indexOf('const soloAdmin') + 400);
check('gestionar usuarios es de socios en el servidor', soloAdmin.includes("'FIRM_ADMIN'") && ['listUsersController', 'setUserActiveController', 'setUserRoleController'].every((c) => AUTH_CTRL.slice(AUTH_CTRL.indexOf(`export const ${c}`), AUTH_CTRL.indexOf(`export const ${c}`) + 200).includes('soloAdmin(')));
check('recargar NO tiene puerta de rol en el servidor', !/FIRM_ADMIN|role/.test(WOMPI_CTRL.slice(WOMPI_CTRL.indexOf('export const startRechargeController'), WOMPI_CTRL.indexOf('export const rechargesController'))));
check('guardar el membrete NO tiene puerta de rol en el servidor', !/FIRM_ADMIN|role/.test(BRANDING_ROUTES + BRANDING_CTRL));
const contar = PLAN.slice(PLAN.indexOf('export const contarUsuarios'), PLAN.indexOf('export const contarUsuarios') + 500);
check('los puestos cuentan también las cuentas retiradas (no hay filtro de baneo)', contar.includes('firm_id === firmId') && !/banned|desactivad/i.test(contar));
check('no hay vencimiento de intentos de pago en el servidor', !/EXPIRED/.test(WOMPI));

/* ─── 4. LAS PANTALLAS, LEÍDAS COMO TEXTO ────────────────────────────────── */
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));
const USUARIOS = leer('modules/tenant/components/FirmUsersDialog.tsx');
const SALDO = leer('modules/billing/components/BalancePanel.tsx');
const RECARGA = leer('modules/billing/components/RecargarSaldoDialog.tsx');
const EXTRACTO = leer('modules/billing/components/ExtractoDelPeriodo.tsx');
const MEMBRETE = leer('modules/tenant/components/FirmBrandingModal.tsx');
const APP = leer('App.tsx');
const PANTALLAS: Record<string, string> = { USUARIOS, SALDO, RECARGA, EXTRACTO, MEMBRETE };

for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  if (nombre === 'EXTRACTO') continue;
  check(`${nombre} abre su alcance cara-nueva cn-adm`, /className=\{?[`"]cara-nueva cn-adm-/.test(codigo));
}
check('ninguna pantalla usa window.confirm/alert/prompt', Object.values(PANTALLAS).every((c) => !/window\.(confirm|alert|prompt)\(|\bconfirm\(/.test(c)));

const CIFRA_LITERAL = /\$\s?\d{1,3}(\.\d{3})+|\b\d{2,3}_000\b|\b[1-9]\d{4,}\b/g;
for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  const cifras = (codigo.match(CIFRA_LITERAL) ?? []).filter((c) => !/^\$?0/.test(c));
  check(`${nombre} no escribe plata a mano`, cifras.length === 0, cifras.join(' · '));
}
check('la recarga toma el mínimo del resumen del servidor', SALDO.includes('minRecharge') && RECARGA.includes('montosSugeridos(') && RECARGA.includes('minimo'));
check('los escritos que alcanzan salen del costo medio del servidor', RECARGA.includes('escritosQueAlcanzan(') && RECARGA.includes('costoMedio'));

const PROHIBIDAS: Array<[string, RegExp, string]> = [
  ['libera un puesto', /libera(r)? un puesto/i, 'contarUsuarios cuenta también a los retirados'],
  ['sin IVA / el IVA se liquida', /sin IVA|IVA se liquida/i, 'el servidor firma el monto tal cual'],
  ['factura electrónica que llegará', /llegará al correo de facturación|factura electrónica de cada recarga/i, 'no hay factura electrónica'],
  ['invitación enviada / no vence', /Invitación enviada|invitación no vence|Invitar a un abogado/i, 'no sale correo: la cuenta se crea con contraseña'],
  ['no cierre esta ventana', /No cierre esta ventana/i, 'el webhook acredita aunque se cierre'],
  ['Descargar en Excel', /Descargar en Excel/i, 'lo que se descarga es CSV'],
  ['firma escaneada', /Firma escaneada|signatureImageUrl/, 'ningún exportador imprime la imagen de firma'],
  ['vencimiento de pago', /pago (vencido|expirado)|intento vencido/i, 'no hay estado EXPIRED en el servidor']
];
const TODO = Object.values(PANTALLAS).join('\n');
for (const [nombre, patron, porque] of PROHIBIDAS) {
  check(`no se publica «${nombre}»`, !patron.test(TODO), porque);
}
const explicacionSocio = USUARIOS.slice(USUARIOS.indexOf('Socio · administrador</p>'), USUARIOS.indexOf('Abogado litigante</p>'));
check('la explicación del socio no le atribuye en exclusiva recargar ni el membrete', explicacionSocio.length > 0 && !/recarg|membrete/i.test(explicacionSocio), explicacionSocio.slice(0, 160));
check('el retiro dice que el puesto sigue ocupado', /sigue ocupando su puesto/i.test(USUARIOS));

const REALES = /Restrepo|Mosquera|Rentería|Cárdenas|Colpensiones|900\.482|52\.418|214\.882|rcabogados|Orozco|Ávila/;
check('sin nombres, cédulas ni NIT verosímiles', !REALES.test(TODO), (TODO.match(REALES) ?? []).join(' '));
check('el NIT va con el marcador del README', MEMBRETE.includes('000.000.000-0'));
check('la previsualización del membrete usa las líneas del exportador', MEMBRETE.includes('lineasDeMembrete('));

check('«Quién consumió» solo para socios (la lista es 403 para el abogado)', /esAdministrador\s*&&/.test(SALDO) && SALDO.includes('firmUsersApi.list('));
check('el acceso a usuarios lo decide App por rol de sesión', APP.includes('<FirmUsersDialog') && APP.includes('esSuperusuario ?'));
check('App le pasa a Saldo el rol y la salida a Soporte', /<BalancePanel[\s\S]{0,400}esAdministrador=\{esSocio\}/.test(APP) && /<BalancePanel[\s\S]{0,600}onSoporte=/.test(APP));
check('App reabre Saldo al volver de Wompi', APP.includes('useState(hayRecargaPorConfirmar)'));
check('la recarga recuerda su referencia antes de saltar a Wompi', RECARGA.includes('guardarRecargaEnCurso(') && RECARGA.indexOf('guardarRecargaEnCurso(') < RECARGA.indexOf('window.location.assign('));
check('la espera consulta al servidor, no a un temporizador que finge', SALDO.includes('billingApi.recharges(') && SALDO.includes('estadoDeRecarga('));
check('el retiro pasa por el diálogo de confirmación del sistema', USUARIOS.includes('Sí, retirarlo') && USUARIOS.includes('cn-adm-boton--peligro'));
check('el 409 de cupo abre «No quedan puestos»', USUARIOS.includes('esLimiteDeUsuarios(') && USUARIOS.includes('No quedan puestos'));

/* ─── 5. EL BLOQUE DE CSS ────────────────────────────────────────────────── */
const CSS = readFileSync(join(SRC, 'design', 'cara-nueva.css'), 'utf8');
const MARCA = '/* ─── Administrar y saldo ─── */';
const FIN = '/* ─── fin Administrar y saldo ─── */';
const inicio = CSS.indexOf(MARCA);
const final = CSS.indexOf(FIN);
check('cara-nueva.css tiene el bloque de Administrar y saldo, cerrado', inicio !== -1 && final > inicio);
const bloque = inicio === -1 || final === -1 ? '' : CSS.slice(inicio + MARCA.length, final).replace(/\/\*[\s\S]*?\*\//g, ' ');
const sueltos: string[] = [];
const ajenos: string[] = [];
const reglas: Record<string, string> = {};
for (const m of bloque.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const cabeza = m[1].replace(/@media[^{]*\{/g, '').trim();
  for (const sel of cabeza.split(',').map((s) => s.trim()).filter(Boolean)) {
    if (sel.startsWith('@keyframes') || /^(from|to|\d+%)$/.test(sel)) continue;
    const bien =
      sel.startsWith('.cara-nueva') ||
      sel.startsWith(":root:not([data-theme='light']) .cara-nueva") ||
      sel.startsWith(":root[data-theme='dark'] .cara-nueva");
    if (!bien) sueltos.push(sel);
    if (!/cn-adm/.test(sel)) ajenos.push(sel);
    reglas[sel] = (reglas[sel] ?? '') + m[2];
  }
}
check('todo selector del bloque vive bajo .cara-nueva', bloque !== '' && sueltos.length === 0, sueltos.join(' · '));
check('todo selector del bloque es de cn-adm', bloque !== '' && ajenos.length === 0, ajenos.join(' · '));
check(
  'el bloque trae su modo oscuro por los dos caminos',
  bloque.includes(":root:not([data-theme='light']) .cara-nueva") && bloque.includes(":root[data-theme='dark'] .cara-nueva")
);
const chicos = [...bloque.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1])).filter((n) => n < 14);
check('ningún tamaño del bloque baja de 14 px', bloque !== '' && chicos.length === 0, chicos.join(', '));
const radios = [...bloque.matchAll(/\[role='dialog'\] > div:last-child\s*\{[^}]*border-radius:\s*(\d+)px/g)].map((m) => Number(m[1]));
check('el diálogo vestido desde fuera no baja de 20 px', radios.length > 0 && radios.every((r) => r >= 20), radios.join(', '));
check('el borde discontinuo no se usa (se reserva a lo sin verificar)', !/dashed/.test(bloque));
/*
 * EL ENVOLTORIO LLEVA LAS DOS CLASES EN EL MISMO ELEMENTO. Escrito como
 * descendiente (`.cara-nueva .cn-adm-dialogos`) no casaba con nada: la pantalla
 * salió con el título pequeño del marco y nadie lo habría notado sin mirarla.
 */
check(
  'el diálogo se viste con el selector compuesto del envoltorio (.cara-nueva.cn-adm-dialogos)',
  bloque.includes(".cara-nueva.cn-adm-dialogos [role='dialog']") && !bloque.includes('.cara-nueva .cn-adm-dialogos')
);
check(
  'el título grande solo viste la pantalla, no los diálogos que cuelgan de ella',
  bloque.includes(".cara-nueva .cn-adm-pantalla [role='dialog'] header h2") &&
    [SALDO, USUARIOS, MEMBRETE].every((c) => c.includes('className="cn-adm-pantalla"')) &&
    !RECARGA.includes('cn-adm-pantalla')
);
for (const sel of ['.cara-nueva .cn-adm-boton', '.cara-nueva .cn-adm-campo', '.cara-nueva .cn-adm-pastilla']) {
  check(`${sel} mide al menos 44 px`, /min-height:\s*(4[4-9]|[5-9]\d)px/.test(reglas[sel] ?? ''), reglas[sel] ?? 'sin regla');
}
check('el peligro es #8C2F26', /#8c2f26/i.test(reglas['.cara-nueva .cn-adm-boton--peligro'] ?? ''));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
