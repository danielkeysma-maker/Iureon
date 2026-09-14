/**
 * Guarda la cara nueva de Ajustes y del plan de la firma: que cada estado del
 * plan se diga como el servidor lo decide, y que las pantallas no publiquen lo
 * que el código no hace.
 *
 * Run with: npm run check:ajustes-plan-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. LA PRUEBA QUE «PASA A SOLO LECTURA». La franja de vencimiento y la
 *    confirmación de la prueba decían que al terminar la prueba la aplicación
 *    quedaba en solo lectura. Es falso desde el 14 de septiembre de 2026: una
 *    prueba que termina sin pagar pierde TODO el acceso, y solo le queda
 *    contratar o borrar sus datos. La gracia de solo lectura, sin límite de
 *    días, es de la firma que pagó alguna vez.
 *
 * 2. LA CIFRA ESCRITA A MANO. La maqueta imprime «$120.000», «4 de 5» y «12 de
 *    12». Los precios, los puestos y los módulos salen del catálogo que manda
 *    el servidor (`plan.catalog.ts`); ningún componente los escribe.
 *
 * 3. LO QUE LA MAQUETA PROMETE Y NO EXISTE: «se renueva en 18 días» (no hay
 *    cobro automático), «el periodo que ya pagó se descuenta» (cambiar de plan
 *    no acredita los días), «14 días» y «saldo de cortesía».
 *
 * 4. LA LISTA DE MÓDULOS QUE ENVEJECE. La pantalla de planes tenía su propia
 *    lista de doce y se le había quedado fuera Expedientes. La lista sale ahora
 *    del catálogo que llega con el plan.
 *
 * Se leen los componentes como TEXTO y sin comentarios: el comentario que
 * explica por qué no se dice «se renueva» contiene la palabra.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  avisoDelPlan,
  encajeDePuestos,
  lineaDelVencimiento,
  modulosDelCatalogo,
  nombreDelPlanActual,
  notaDeLaTarjeta,
  anualSonDiezMeses,
  TEXTO_DE_LA_PRUEBA
} from '../../subscriptions/planEnPantalla';
import { DIAS_DE_PRUEBA_GRATUITA } from '../../subscriptions/pruebaTerminada';
import type { Plan, PlanDeFirma, PlanDefinition } from '../../subscriptions/types';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');
const BACKEND = join(SRC, '..', '..', 'backend', 'src');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── Fixtures: marcadores, nunca datos de una firma real ───────────────── */

const fecha = (iso: string): string => `F(${iso.slice(0, 10)})`;

const plan = (parcial: Partial<PlanDeFirma>): PlanDeFirma => ({
  plan: 'PREMIUM',
  period: 'MENSUAL',
  validUntil: '2030-01-20T00:00:00.000Z',
  maxUsers: 5,
  estado: 'ACTIVO',
  diasRestantes: 20,
  usuarios: 2,
  modulosPermitidos: [],
  modulosDesactivados: [],
  funcionesDesactivadas: [],
  pruebaDisponible: false,
  acceso: 'COMPLETO',
  trabajoConservado: null,
  ...parcial
});

/* El catálogo de muestra se lee del backend, no se copia: así una subida de precio no deja este check atrás. */
const CATALOGO_TS = readFileSync(join(BACKEND, 'modules', 'subscriptions', 'plan.catalog.ts'), 'utf8');
const numero = (clave: Plan, campo: string): number =>
  Number((CATALOGO_TS.match(new RegExp(`${clave}:\\s*\\{[\\s\\S]*?${campo}:\\s*([\\d_]+)`))?.[1] ?? 'NaN').replace(/_/g, ''));
const ESENCIAL_MODULOS = ['REDACCION', 'BORRADORES', 'REVISIONES', 'BUSCADOR', 'CATALOGO', 'HERRAMIENTAS', 'MANUAL', 'SOPORTE', 'MEMBRETE', 'EXPEDIENTES'] as const;
const TODOS = [...ESENCIAL_MODULOS, 'AUDIENCIAS', 'ENTREVISTAS', 'ORIENTACION'] as const;
const definicion = (clave: Plan, nombre: string, modulos: readonly string[]): PlanDefinition => ({
  plan: clave,
  nombre,
  precioMensualCop: numero(clave, 'precioMensualCop'),
  precioAnualCop: numero(clave, 'precioAnualCop'),
  maxUsuarios: numero(clave, 'maxUsuarios'),
  modulos: modulos as PlanDefinition['modulos']
});
const PLANES: Record<Plan, PlanDefinition> = {
  ESENCIAL: definicion('ESENCIAL', 'Esencial', ESENCIAL_MODULOS),
  PREMIUM: definicion('PREMIUM', 'Premium', TODOS),
  FIRMA: definicion('FIRMA', 'Firma', TODOS)
};

/* ─── 1. LA LÍNEA DEL VENCIMIENTO, ESTADO POR ESTADO ────────────────────── */

check('el catálogo del backend se leyó', PLANES.PREMIUM.precioMensualCop > 0 && PLANES.FIRMA.maxUsuarios > 0, JSON.stringify(PLANES.PREMIUM));

const activo = lineaDelVencimiento(plan({}), fecha);
check('activo: dice cuándo vence y en cuántos días', activo === 'Vence el F(2030-01-20) · en 20 días', activo);
check('activo: nunca «se renueva»', !/renueva/i.test(activo));
check('un día: «mañana»', lineaDelVencimiento(plan({ diasRestantes: 1, estado: 'POR_VENCER' }), fecha).endsWith('· mañana'));
check('cero días: «hoy»', lineaDelVencimiento(plan({ diasRestantes: 0, estado: 'POR_VENCER' }), fecha).endsWith('· hoy'));

const prueba = lineaDelVencimiento(plan({ plan: 'ESENCIAL', period: 'PRUEBA', estado: 'POR_VENCER', diasRestantes: 3 }), fecha);
check('prueba: nombra la prueba gratuita y cuándo termina', prueba === 'Prueba gratuita · termina el F(2030-01-20) · en 3 días', prueba);

const terminada = lineaDelVencimiento(plan({ plan: 'ESENCIAL', period: 'PRUEBA', estado: 'VENCIDO', diasRestantes: -2, acceso: 'PRUEBA_TERMINADA' }), fecha);
check('prueba terminada: terminó, sin solo lectura', terminada === 'La prueba gratuita terminó el F(2030-01-20)', terminada);

const vencido = lineaDelVencimiento(plan({ estado: 'VENCIDO', diasRestantes: -40, acceso: 'SOLO_LECTURA' }), fecha);
check('vencido con pagos: solo lectura sin límite de días', vencido === 'Venció el F(2030-01-20) · solo lectura, sin límite de días', vencido);

const cortesia = lineaDelVencimiento(plan({ plan: null, period: 'CORTESIA', estado: 'CORTESIA', validUntil: null, diasRestantes: null }), fecha);
check('cortesía: sin vencimiento hasta que el equipo de Iureon la cambie', cortesia === 'Sin vencimiento, hasta que el equipo de Iureon la cambie', cortesia);

const cortesiaConPlan = lineaDelVencimiento(plan({ plan: 'FIRMA', period: 'CORTESIA', estado: 'CORTESIA', validUntil: null, diasRestantes: null }), fecha);
check('cortesía con plan asignado: igual, sin vencimiento', cortesiaConPlan === cortesia, cortesiaConPlan);

/* ─── 2. EL NOMBRE ──────────────────────────────────────────────────────── */

check('el nombre sale del catálogo', nombreDelPlanActual(plan({}), PLANES) === 'Premium');
check('sin plan: Cortesía', nombreDelPlanActual(plan({ plan: null, period: 'CORTESIA', estado: 'CORTESIA' }), PLANES) === 'Cortesía');
check('sin catálogo cargado: el nombre de siempre', nombreDelPlanActual(plan({ plan: 'FIRMA' }), null) === 'Firma');

/* ─── 3. EL AVISO: LO QUE PASA AL VENCER, SEGÚN QUIÉN ───────────────────── */

const avisoPrueba = avisoDelPlan(plan({ plan: 'ESENCIAL', period: 'PRUEBA', estado: 'POR_VENCER', diasRestantes: 3 }), fecha);
check('la prueba por terminar avisa', avisoPrueba !== null);
check('la prueba NO pasa a solo lectura', !/solo lectura/i.test(`${avisoPrueba?.titulo} ${avisoPrueba?.texto}`), avisoPrueba?.texto);
check('la prueba dice que pierde el acceso y qué le queda', /pierde el acceso/.test(avisoPrueba?.texto ?? '') && /contratar/.test(avisoPrueba?.texto ?? '') && /borrar/.test(avisoPrueba?.texto ?? ''), avisoPrueba?.texto);
check('la prueba no se cobra al terminar', /no se cobra nada/i.test(avisoPrueba?.texto ?? ''));

const avisoPago = avisoDelPlan(plan({ estado: 'POR_VENCER', diasRestantes: 5 }), fecha);
check('el plan pagado por vencer avisa sin cobro automático', /no hay cobro automático/i.test(avisoPago?.texto ?? ''), avisoPago?.texto);
check('y lo de sumar el periodo solo al renovar el mismo plan', /mismo plan/.test(avisoPago?.texto ?? ''), avisoPago?.texto);

const avisoVencido = avisoDelPlan(plan({ estado: 'VENCIDO', diasRestantes: -9, acceso: 'SOLO_LECTURA' }), fecha);
check('el vencido con pagos queda en solo lectura sin límite de días', /solo lectura/.test(avisoVencido?.texto ?? '') && /sin límite de días/.test(avisoVencido?.texto ?? ''), avisoVencido?.texto);

check('activo no avisa', avisoDelPlan(plan({}), fecha) === null);
check('cortesía no avisa', avisoDelPlan(plan({ plan: null, period: 'CORTESIA', estado: 'CORTESIA', validUntil: null, diasRestantes: null }), fecha) === null);
check('la prueba terminada no avisa aquí: tiene su pantalla', avisoDelPlan(plan({ period: 'PRUEBA', estado: 'VENCIDO', acceso: 'PRUEBA_TERMINADA' }), fecha) === null);

/* ─── 4. PUESTOS ────────────────────────────────────────────────────────── */

check('caben: quedan libres', JSON.stringify(encajeDePuestos(4, 5)) === JSON.stringify({ cabe: true, libres: 1, sobran: 0 }));
check('no caben: sobran', JSON.stringify(encajeDePuestos(4, 1)) === JSON.stringify({ cabe: false, libres: 0, sobran: 3 }));
check('justo: cabe sin libres', JSON.stringify(encajeDePuestos(5, 5)) === JSON.stringify({ cabe: true, libres: 0, sobran: 0 }));

/*
 * «TENDRÍA QUE RETIRAR» NO SE DICE: el checkout del servidor no compara usuarios
 * con el tope al cobrar (`planCheckout.service.ts`), así que afirmar una
 * condición para pagar sería inventar una regla. Se dice el hecho: cuántos
 * tiene la firma y hasta cuántos llega el plan.
 */
check('nota: el plan chico no alcanza, dicho como hecho', notaDeLaTarjeta(false, 4, PLANES.ESENCIAL) === `No alcanza hoy: la firma tiene 4 usuarios y este plan llega a ${PLANES.ESENCIAL.maxUsuarios}.`, notaDeLaTarjeta(false, 4, PLANES.ESENCIAL));
check('nota: nunca «retirar» ni «antes de pagar»', !/retirar|antes de pagar/.test(notaDeLaTarjeta(false, 9, PLANES.PREMIUM)));
check('nota: el suyo con un puesto libre', notaDeLaTarjeta(true, 4, PLANES.PREMIUM) === 'Le queda 1 puesto libre.', notaDeLaTarjeta(true, 4, PLANES.PREMIUM));
check('nota: el suyo lleno', notaDeLaTarjeta(true, 5, PLANES.PREMIUM) === 'No le quedan puestos libres.');
check('nota: otro plan que cabe', notaDeLaTarjeta(false, 4, PLANES.FIRMA) === `Le quedarían ${PLANES.FIRMA.maxUsuarios - 4} puestos libres.`, notaDeLaTarjeta(false, 4, PLANES.FIRMA));

/* ─── 5. MÓDULOS Y PRECIOS DESDE EL CATÁLOGO ────────────────────────────── */

const modulos = modulosDelCatalogo(PLANES);
check('la lista de módulos es la unión del catálogo', modulos.length === TODOS.length, String(modulos.length));
check('Expedientes está en la lista', modulos.includes('EXPEDIENTES'));
check('sin catálogo no hay lista inventada', modulosDelCatalogo(null).length === 0);
check('un módulo nuevo del servidor no se pierde', modulosDelCatalogo({ ...PLANES, FIRMA: { ...PLANES.FIRMA, modulos: [...TODOS, 'NOVEDADES' as never] } }).includes('NOVEDADES' as never));
check('el anual son diez meses en el catálogo real', anualSonDiezMeses(PLANES));
check('y deja de serlo si un precio se mueve', !anualSonDiezMeses({ ...PLANES, FIRMA: { ...PLANES.FIRMA, precioAnualCop: PLANES.FIRMA.precioAnualCop + 1 } }));

/* ─── 6. LA PRUEBA: SOLO ESENCIAL, CON LOS DÍAS DE LA CONSTANTE ─────────── */

check('la oferta nombra Esencial y los días de la constante', TEXTO_DE_LA_PRUEBA.oferta === `Probar Esencial gratis ${DIAS_DE_PRUEBA_GRATUITA} días`, TEXTO_DE_LA_PRUEBA.oferta);
check('la confirmación dice que al terminar pierde el acceso', /pierde el acceso/.test(TEXTO_DE_LA_PRUEBA.confirmacion) && !/solo lectura/i.test(TEXTO_DE_LA_PRUEBA.confirmacion), TEXTO_DE_LA_PRUEBA.confirmacion);
check('ninguna prueba de Premium ni de Firma', !/Premium|Firma\b/.test(Object.values(TEXTO_DE_LA_PRUEBA).join(' ')));

/* ─── 7. LAS PANTALLAS, LEÍDAS COMO TEXTO ───────────────────────────────── */

const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));

/** Frases que la maqueta trae y el producto no cumple. Devuelve lo hallado. */
const problemasDeCopia = (texto: string): string[] => {
  const REGLAS: Array<[RegExp, string]> = [
    [/14\s*d[ií]as/i, '«14 días»'],
    [/saldo de cortes[ií]a/i, '«saldo de cortesía»'],
    [/se renueva|renueva autom[aá]tica|renovaci[óo]n autom[aá]tica|d[eé]bito autom[aá]tico/i, 'renovación automática'],
    [/factura/i, '«factura»: lo que existe es la cuenta de cobro'],
    [/(?:^|[^{$\w])(?:\d+|siete|catorce)\s+d[ií]as\b/i, 'un plazo de días escrito a mano'],
    /* El PERIODO, no el consumo: «los escritos se descuentan del saldo» es cierto y no es esto. */
    [/pag[oó][^.]{0,20}se descuenta|periodo[^.]{0,30}se descuenta/i, '«el periodo se descuenta»: cambiar de plan no acredita días'],
    [/tendr[ií]a que retirar/i, '«tendría que retirar»: el checkout no lo exige'],
    [/Premium[^.]{0,40}prueba|prueba[^.]{0,40}Premium/i, 'una prueba de Premium'],
    [/exportar mi trabajo/i, '«Exportar mi trabajo»: la prueba terminada no exporta'],
    [/Restrepo|Camila|sufirma|Asociados/, 'un nombre de muestra de la maqueta']
  ];
  return REGLAS.filter(([patron]) => patron.test(texto)).map(([, motivo]) => motivo);
};

/** Cifras de catálogo escritas a mano: precios con puntos, precios crudos, topes de usuarios y de módulos. */
const cifrasLiterales = (texto: string): string[] => {
  const hallado: string[] = [];
  for (const m of texto.matchAll(/\$\s?\d{1,3}(?:\.\d{3})+/g)) hallado.push(m[0]);
  for (const m of texto.matchAll(/\b(?:85|120|250|850)[._]?000\b|\b(?:1|2)[._]?[25]00[._]?000\b/g)) hallado.push(m[0]);
  for (const m of texto.matchAll(/Hasta \d+ usuarios|\b\d+ de 1[23]\b/g)) hallado.push(m[0]);
  return hallado;
};

/** Letra de la cara vieja: tamaños de Tailwind de 12 px o menos y los tokens de 11–13 px. */
const letraVieja = (texto: string): string[] => {
  const hallado: string[] = [];
  for (const m of texto.matchAll(/text-\[(\d+(?:\.\d+)?)px\]/g)) if (Number(m[1]) <= 13) hallado.push(m[0]);
  for (const m of texto.matchAll(/\btext-(?:meta|label|ui)\b/g)) hallado.push(m[0]);
  return hallado;
};

const PANTALLAS: Record<string, string> = {
  SettingsView: leer('modules/settings/components/SettingsView.tsx'),
  SeccionesSuyas: leer('modules/settings/components/SeccionesSuyas.tsx'),
  AppearanceSection: leer('modules/settings/components/AppearanceSection.tsx'),
  PlanYSaldoSection: leer('modules/settings/components/PlanYSaldoSection.tsx'),
  ZonaDeRiesgoDeCuenta: leer('modules/settings/components/ZonaDeRiesgoDeCuenta.tsx'),
  FirmSubscriptionModal: leer('modules/subscriptions/components/FirmSubscriptionModal.tsx'),
  PruebaTerminadaView: leer('modules/subscriptions/components/PruebaTerminadaView.tsx'),
  ModuloBloqueado: leer('modules/subscriptions/components/ModuloBloqueado.tsx'),
  PlanExpiryBanner: leer('modules/subscriptions/components/PlanExpiryBanner.tsx'),
  PlanVencidoBar: leer('modules/subscriptions/components/PlanVencidoBar.tsx'),
  planEnPantalla: leer('modules/subscriptions/planEnPantalla.ts')
};
const P = PANTALLAS;

for (const [nombre, texto] of Object.entries(PANTALLAS)) {
  const copia = problemasDeCopia(texto);
  check(`${nombre}: no publica lo que el código no hace`, copia.length === 0, copia.join('; '));
  const cifras = cifrasLiterales(texto);
  check(`${nombre}: ninguna cifra del catálogo escrita a mano`, cifras.length === 0, cifras.join(', '));
  const letra = letraVieja(texto);
  check(`${nombre}: nada de la letra vieja de 13 px o menos`, letra.length === 0, letra.join(', '));
}

/* Cada raíz abre su alcance: montadas fuera de otra pantalla nueva, sin él no tendrían tokens. */
const RAICES: Array<[string, string]> = [
  ['SettingsView', 'cara-nueva cn-aju'],
  ['ZonaDeRiesgoDeCuenta', 'cara-nueva cn-aju-riesgo'],
  ['FirmSubscriptionModal', 'cara-nueva cn-plan-dialogos'],
  ['PruebaTerminadaView', 'cara-nueva cn-plan-bloqueo'],
  ['ModuloBloqueado', 'cara-nueva cn-plan-cierre-velo'],
  ['PlanExpiryBanner', 'cara-nueva cn-plan-franja'],
  ['PlanVencidoBar', 'cara-nueva cn-plan-franja']
];
for (const [nombre, raiz] of RAICES) check(`${nombre}: la raíz lleva «${raiz}»`, P[nombre].includes(raiz));
check('la visita guiada sigue encontrando Ajustes', P.SettingsView.includes('data-visita="vista-ajustes"'));
check('el diálogo de borrar va dentro de su envoltorio', /cn-aju-dialogos[\s\S]{0,80}<ConfirmarDialog/.test(P.ZonaDeRiesgoDeCuenta));

/* Las llamadas y las salidas siguen ahí: la piel no puede tumbarlas. */
check('Plan y saldo lee el plan y el resumen del servidor', P.PlanYSaldoSection.includes('subscriptionApi') && P.PlanYSaldoSection.includes('billingApi') && P.PlanYSaldoSection.includes('.summary()'));
check('Plan y saldo abre la misma pantalla de planes', P.PlanYSaldoSection.includes('onClick={abrirPlan}'));
check('los precios de las tarjetas salen del catálogo', P.FirmSubscriptionModal.includes('def.precioAnualCop') && P.FirmSubscriptionModal.includes('def.precioMensualCop'));
check('los módulos de las tarjetas salen del catálogo', P.FirmSubscriptionModal.includes('modulosDelCatalogo(planes)') && !/TODOS_LOS_MODULOS/.test(P.FirmSubscriptionModal));
check('pagar sigue siendo el checkout firmado de Wompi', P.FirmSubscriptionModal.includes('subscriptionApi.checkout(elegido, periodo)') && P.FirmSubscriptionModal.includes('urlDelCheckout(intent)'));
check('el enlace de respaldo de la pasarela sigue', P.FirmSubscriptionModal.includes('href={enlaceCheckout}'));
check('la prueba se ofrece solo cuando el servidor la da, y solo con puedePagar', /plan\.pruebaDisponible && puedePagar/.test(P.FirmSubscriptionModal));
check('la oferta de prueba es la de Esencial con sus días', P.FirmSubscriptionModal.includes('TEXTO_DE_LA_PRUEBA.oferta') && P.FirmSubscriptionModal.includes('TEXTO_DE_LA_PRUEBA.confirmacion'));
check('el historial no tumba la compra', P.FirmSubscriptionModal.includes('subscriptionApi.payments().catch('));
check('las cuentas de cobro se siguen descargando', P.FirmSubscriptionModal.includes('generarCuentaDeCobro('));
check('el aviso de cambio de plan se da antes de pagar', P.FirmSubscriptionModal.includes('advertirCambio(elegido)'));
check('solo quien puede pagar ve el botón de pago', /puedePagar && defElegida && \(/.test(P.FirmSubscriptionModal));
check('la franja de vencimiento dice lo mismo que Plan y saldo', P.PlanExpiryBanner.includes('avisoDelPlan(plan, fechaLarga)') && !/solo lectura/i.test(P.PlanExpiryBanner));
check('la franja de vencido dice «sin límite de días»', P.PlanVencidoBar.includes('sin límite de días'));
check('borrar el acceso y la firma siguen llamando al servidor', P.ZonaDeRiesgoDeCuenta.includes('authApi.eliminarMiUsuario(contrasena)') && P.ZonaDeRiesgoDeCuenta.includes('authApi.eliminarMiFirma(contrasena, nombreEscrito.trim())'));
check('borrar la firma exige el nombre exacto y la contraseña', P.ZonaDeRiesgoDeCuenta.includes("deshabilitado: !(contrasena !== '' && nombreValido)"));
check('borrar la firma es solo del socio administrador', /\{esAdministrador && \(\s*<div className="cn-aju-riesgo-tarjeta cn-aju-riesgo-tarjeta--firma"/.test(P.ZonaDeRiesgoDeCuenta));
check('Ajustes lo esconde en el teléfono; la prueba terminada no', P.SeccionesSuyas.includes('soloEnComputador') && !P.PruebaTerminadaView.includes('soloEnComputador'));
check('cerrar sesión desde Ajustes pregunta', P.SeccionesSuyas.includes('<ConfirmarCierreDeSesion'));
check('Avisos se monta en Ajustes', P.SeccionesSuyas.includes('<AvisosEnEsteDispositivo') && P.SeccionesSuyas.includes('<InstalarApp'));
check('ModuloBloqueado conserva el ancla y el radio de 20 px', P.ModuloBloqueado.includes('max-w-sm flex-col items-center rounded-[20px]'));

/* ─── 8. EL BLOQUE CSS ──────────────────────────────────────────────────── */

const bloqueCss = (css: string): string => {
  const inicio = css.indexOf('/* ─── Ajustes y plan ─── */');
  const fin = css.indexOf('/* ─── fin Ajustes y plan ─── */');
  return inicio === -1 || fin === -1 ? '' : css.slice(inicio, fin);
};

const problemasDelCss = (bloque: string): string[] => {
  const problemas: string[] = [];
  if (!bloque) return ['no se encuentra el bloque entre sus marcas'];
  const limpio = bloque.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, ' ');
  if (!limpio.includes('@media (prefers-color-scheme: dark)') || !limpio.includes(":root:not([data-theme='light'])")) problemas.push('falta el oscuro del sistema');
  if (!limpio.includes(":root[data-theme='dark']")) problemas.push('falta el oscuro forzado');
  for (const m of limpio.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectores = m[1].replace(/@media[^{]*$/, '').split(',').map((s) => s.trim()).filter(Boolean);
    for (const s of selectores) {
      if (!s.includes('.cara-nueva')) problemas.push(`fuera de .cara-nueva: ${s}`);
      for (const c of s.matchAll(/\.cn-([a-z]+)/g)) if (c[1] !== 'aju' && c[1] !== 'plan') problemas.push(`prefijo ajeno: ${c[0]}`);
    }
    for (const t of m[2].matchAll(/font-size:\s*([\d.]+)px/g)) if (Number(t[1]) <= 12) problemas.push(`letra de ${t[1]} px en ${selectores[0]}`);
    if (/\[role='dialog'\] > div:last-child/.test(m[1])) {
      const radio = /border-radius:\s*([\d.]+)px/.exec(m[2]);
      if (radio && Number(radio[1]) < 20) problemas.push(`diálogo a ${radio[1]} px`);
    }
  }
  if (/dashed/.test(limpio)) problemas.push('borde discontinuo: es la señal de «sin verificar»');
  if (/--gold/.test(limpio)) problemas.push('oro: es solo del módulo activo');
  if (!limpio.includes('min-height: 44px')) problemas.push('los botones no miden 44 px');
  if (!/\[role='dialog'\] > div:last-child \{\s*border-radius: 20px;/.test(limpio)) problemas.push('los diálogos no declaran 20 px');
  return problemas;
};

const CSS = readFileSync(join(SRC, 'design', 'cara-nueva.css'), 'utf8');
const problemasCss = problemasDelCss(bloqueCss(CSS));
check('CSS: bajo .cara-nueva, prefijos propios, dos oscuros, nada ≤ 12 px, 44 px, diálogos a 20 px', problemasCss.length === 0, problemasCss.slice(0, 6).join('; '));

/* ─── 9. QUE MUERDA ─────────────────────────────────────────────────────── */

const muerde = (nombre: string, dejaPasar: boolean): void => check(`muerde: ${nombre}`, !dejaPasar);

muerde('la línea de la maqueta «se renueva en 18 días»', problemasDeCopia('$120.000 al mes · IVA incluido · se renueva en 18 días').length === 0);
muerde('la franja vieja de la prueba', !/solo lectura/i.test('Su prueba gratuita termina el 1 de enero. No se cobra nada al terminar: la aplicación pasa a solo lectura y conserva su trabajo.'));
muerde('«el periodo que ya pagó se descuenta»', problemasDeCopia('Si sube de plan, el periodo que ya pagó se descuenta').length === 0);
muerde('«Los 14 días se acabaron»', problemasDeCopia('Los 14 días se acabaron').length === 0);
muerde('«Probar Esencial gratis 7 días» escrito a mano', problemasDeCopia("'Probar Esencial gratis 7 días'").length === 0);
muerde('un nombre de la maqueta', problemasDeCopia('camila.restrepo@sufirma.co').length === 0);
muerde('un precio con puntos', cifrasLiterales('<span>$120.000</span>').length === 0);
muerde('un tope de usuarios a mano', cifrasLiterales('Hasta 5 usuarios · 12 de 12').length === 0);
muerde('la letra de 11,5 px', letraVieja('className="text-[11.5px] text-ink-500"').length === 0);
muerde('una regla fuera del alcance', problemasDelCss('/* ─── Ajustes y plan ─── */ .cn-aju-x { color: red; } @media (prefers-color-scheme: dark) { :root:not([data-theme=\'light\']) .cara-nueva.cn-aju { } } :root[data-theme=\'dark\'] .cara-nueva.cn-aju { } .cara-nueva .cn-aju-b { min-height: 44px; } .cara-nueva .cn-aju-dialogos [role=\'dialog\'] > div:last-child { border-radius: 20px; }').every((p) => !p.startsWith('fuera de')));
muerde('una letra de 12 px en el CSS', problemasDelCss(bloqueCss(CSS).replace('font-size: 14px;', 'font-size: 12px;')).length === 0);
muerde('un diálogo a 16 px', problemasDelCss(bloqueCss(CSS).replace(/border-radius: 20px;/g, 'border-radius: 16px;')).length === 0);
muerde('un oscuro olvidado', problemasDelCss(bloqueCss(CSS).split(":root[data-theme='dark']").join(':root[data-x]')).length === 0);
muerde('un prefijo ajeno', problemasDelCss(bloqueCss(CSS) + '.cara-nueva .cn-sal-panel { color: red; }').length === 0);

console.log('');
if (fallos > 0) {
  console.log(`${fallos} fallo(s).`);
  process.exit(1);
}
console.log('Todo en orden.');
