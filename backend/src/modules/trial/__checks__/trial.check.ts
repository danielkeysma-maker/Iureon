/**
 * Guards the rules of the free trial.
 *
 * Run with: npm run check:trial
 *
 * No database, no network: the field rules, the honeypot, the 7-day
 * arithmetic and the per-address window, proven against fixed inputs. These
 * decide who gets a tenant without paying, so a drift here is a business
 * defect before it is a code one.
 */
import {
  DIAS_DE_PRUEBA_GRATUITA,
  MAX_PRUEBAS_POR_IP,
  MIN_CONTRASENA,
  PLAN_DE_PRUEBA,
  USUARIOS_DE_PRUEBA,
  cabeOtraPruebaDesdeIp,
  combinacionPermitida,
  inicioDeVentana,
  leerSolicitud,
  validarSolicitud,
  vencimientoDePrueba
} from '../trial.rules';
import { DIAS_DE_PRUEBA, PLANES, estadoDelPlan } from '../../subscriptions/plan.catalog';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const valida = {
  modo: 'PRUEBA' as const,
  plan: 'ESENCIAL' as const,
  firma: 'Restrepo & Asociados',
  nit: '',
  nombre: 'Carolina Restrepo',
  correo: 'carolina@restrepo.co',
  contrasena: 'clave-muy-larga-1',
  acepta: true,
  empresa: ''
};

// ─── Constantes ─────────────────────────────────────────────────────────────
check('la prueba es de Esencial y solo de Esencial', PLAN_DE_PRUEBA === 'ESENCIAL');
check('dura 7 días, no los 14 del alta por operador', DIAS_DE_PRUEBA_GRATUITA === 7 && DIAS_DE_PRUEBA === 14);
check('un solo usuario, que es el tope de Esencial', USUARIOS_DE_PRUEBA === 1 && PLANES.ESENCIAL.maxUsuarios === 1);
check('contraseña mínima de 10', MIN_CONTRASENA === 10);
check('tres altas por dirección y día', MAX_PRUEBAS_POR_IP === 3);

// ─── Aritmética de los 7 días ───────────────────────────────────────────────
const ahora = new Date('2026-09-05T15:00:00Z');
const vence = vencimientoDePrueba(ahora);
check('vence exactamente 7 días después, a la misma hora', vence.toISOString() === '2026-09-12T15:00:00.000Z');
check(
  'la firma de prueba entra POR_VENCER desde el primer día (la franja cuenta regresiva)',
  estadoDelPlan({ plan: 'ESENCIAL', period: 'PRUEBA', validUntil: vence, maxUsers: 1 }, ahora) === 'POR_VENCER'
);
check(
  'y queda VENCIDO al cumplirse el plazo',
  estadoDelPlan({ plan: 'ESENCIAL', period: 'PRUEBA', validUntil: vence, maxUsers: 1 }, vence) === 'VENCIDO'
);
check('la ventana por dirección empieza 24 h atrás', inicioDeVentana(ahora).toISOString() === '2026-09-04T15:00:00.000Z');
check('con 2 altas cabe la tercera; con 3 no', cabeOtraPruebaDesdeIp(2) && !cabeOtraPruebaDesdeIp(3));

// ─── Lectura del cuerpo ─────────────────────────────────────────────────────
const leida = leerSolicitud({
  firma: '  Restrepo   &  Asociados ',
  nombre: 'Carolina  Restrepo',
  correo: '  Carolina@Restrepo.CO ',
  contrasena: 'clave-muy-larga-1',
  acepta: true
});
check('normaliza espacios y baja el correo a minúsculas', leida.firma === 'Restrepo & Asociados' && leida.correo === 'carolina@restrepo.co');
check('campos ausentes se leen vacíos, no undefined', leida.nit === '' && leida.empresa === '');
check('sin modo ni plan, la solicitud es la prueba de Esencial (el formulario original no los mandaba)', leida.modo === 'PRUEBA' && leida.plan === 'ESENCIAL');
check('modo y plan se leen en mayúsculas', (() => {
  const l = leerSolicitud({ modo: 'compra', plan: 'premium' });
  return l.modo === 'COMPRA' && l.plan === 'PREMIUM';
})());
check('un cuerpo que no es objeto no lanza', leerSolicitud(null).firma === '' && leerSolicitud('x').acepta === false);
check('acepta solo cuenta si es true de verdad', leerSolicitud({ acepta: 'true' }).acepta === false);

// ─── Validación ─────────────────────────────────────────────────────────────
const r = validarSolicitud(valida);
check('la solicitud completa pasa', r.ok);
check('honeypot lleno se rechaza, con mensaje genérico', (() => {
  const h = validarSolicitud({ ...valida, empresa: 'Acme' });
  return !h.ok && h.codigo === 'HONEYPOT' && !/robot|bot|honeypot/i.test(h.mensaje);
})());
check('firma de 2 letras se rechaza', !validarSolicitud({ ...valida, firma: 'AB' }).ok);
check('NIT vacío pasa; NIT con letras no', validarSolicitud({ ...valida, nit: '' }).ok && !validarSolicitud({ ...valida, nit: 'ABC123' }).ok);
check('NIT con puntos y guion pasa', validarSolicitud({ ...valida, nit: '900.123.456-7' }).ok);
check('nombre sin apellido se rechaza', !validarSolicitud({ ...valida, nombre: 'Carolina' }).ok);
check('correo sin dominio se rechaza', !validarSolicitud({ ...valida, correo: 'carolina@' }).ok);
check('correo con dos arrobas se rechaza', !validarSolicitud({ ...valida, correo: 'a@b@c.co' }).ok);
check('contraseña de 9 se rechaza, de 10 pasa', !validarSolicitud({ ...valida, contrasena: '123456789' }).ok && validarSolicitud({ ...valida, contrasena: '1234567890' }).ok);
check('sin aceptar el tratamiento de datos no hay prueba', !validarSolicitud({ ...valida, acepta: false }).ok);
check('los datos válidos no arrastran el honeypot ni la casilla', (() => {
  if (!r.ok) return false;
  const llaves = Object.keys(r.datos).sort().join(',');
  return llaves === 'contrasena,correo,firma,modo,nit,nombre,plan';
})());

// ─── Modo y plan: prueba solo de Esencial; compra de cualquiera ────────────
check('la prueba admite solo Esencial', combinacionPermitida('PRUEBA', 'ESENCIAL') && !combinacionPermitida('PRUEBA', 'PREMIUM') && !combinacionPermitida('PRUEBA', 'FIRMA'));
check('la compra admite los tres planes', combinacionPermitida('COMPRA', 'ESENCIAL') && combinacionPermitida('COMPRA', 'PREMIUM') && combinacionPermitida('COMPRA', 'FIRMA'));
check('prueba de Premium se rechaza como INVALID_PLAN y lo explica', (() => {
  const v = validarSolicitud({ ...valida, modo: 'PRUEBA', plan: 'PREMIUM' });
  return !v.ok && v.codigo === 'INVALID_PLAN' && /Esencial/.test(v.mensaje);
})());
check('compra de Firma pasa y conserva modo y plan', (() => {
  const v = validarSolicitud({ ...valida, modo: 'COMPRA', plan: 'FIRMA' });
  return v.ok && v.datos.modo === 'COMPRA' && v.datos.plan === 'FIRMA';
})());
check('un plan inventado se rechaza aunque el modo sea compra', (() => {
  const v = validarSolicitud({ ...leerSolicitud({ ...valida, modo: 'COMPRA', plan: 'ORO' }) });
  return !v.ok && v.codigo === 'INVALID_PLAN';
})());
check('un modo inventado se rechaza, no se degrada a prueba', (() => {
  const v = validarSolicitud(leerSolicitud({ ...valida, modo: 'REGALO' }));
  return !v.ok && v.codigo === 'INVALID_PLAN';
})());
check('el honeypot gana al plan: se rechaza antes de mirar modo o plan', (() => {
  const v = validarSolicitud({ ...valida, modo: 'PRUEBA', plan: 'PREMIUM', empresa: 'Acme' });
  return !v.ok && v.codigo === 'HONEYPOT';
})());
// La compra nace vencida: valid_until = ahora ⇒ VENCIDO en el mismo instante,
// y el pago la activa desde ahora (periodoQueCompra parte de GREATEST).
check(
  'una firma comprada nace VENCIDA (solo lectura hasta el primer pago)',
  estadoDelPlan({ plan: 'PREMIUM', period: 'MENSUAL', validUntil: ahora, maxUsers: 5 }, ahora) === 'VENCIDO'
);
check('cada plan comprado trae su tope de usuarios del catálogo', PLANES.ESENCIAL.maxUsuarios === 1 && PLANES.PREMIUM.maxUsuarios === 5 && PLANES.FIRMA.maxUsuarios === 15);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
