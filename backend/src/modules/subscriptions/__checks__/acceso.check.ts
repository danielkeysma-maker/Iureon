/**
 * Guarda la regla de acceso decidida por el titular el 14 de septiembre de
 * 2026: la prueba gratuita que terminó sin pagar lo pierde todo; la firma que
 * pagó y se venció, y la compra que aún no paga, quedan en solo lectura.
 *
 * Run with: npm run check:acceso
 *
 * Sin base de datos: la regla es pura y lo demás se comprueba leyendo el
 * código fuente COMO TEXTO, sin comentarios — un comentario que explica por qué
 * no se usa `historialDePagos` contiene la palabra, y denunciarlo sería la
 * falsa alarma.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as catalogo from '../plan.catalog';
import { accesoDeLaFirma, necesitaConsultarPagos, type PlanRow } from '../plan.catalog';
import {
  MENSAJE_PRUEBA_TERMINADA,
  RUTAS_ABIERTAS_CON_PRUEBA_TERMINADA,
  rutaAbiertaConPruebaTerminada
} from '../pruebaTerminada.rules';
import { DIAS_DE_PRUEBA_GRATUITA } from '../../trial/trial.rules';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const AHORA = new Date('2026-09-14T15:00:00.000Z');
const VENCIDA = new Date('2026-09-01T15:00:00.000Z');
const VIGENTE = new Date('2026-10-30T15:00:00.000Z');

const fila = (period: PlanRow['period'], validUntil: Date | null): PlanRow => ({
  plan: 'ESENCIAL',
  period,
  validUntil,
  maxUsers: 1,
  modulosDesactivados: []
});

/* ══════════════════════ 1. La regla pura ══════════════════════ */

check('PRUEBA vencida sin pagos → PRUEBA_TERMINADA', accesoDeLaFirma(fila('PRUEBA', VENCIDA), false, AHORA) === 'PRUEBA_TERMINADA');
check('PRUEBA vencida con un pago → SOLO_LECTURA', accesoDeLaFirma(fila('PRUEBA', VENCIDA), true, AHORA) === 'SOLO_LECTURA');
check('PRUEBA vigente → COMPLETO', accesoDeLaFirma(fila('PRUEBA', VIGENTE), false, AHORA) === 'COMPLETO');
check(
  'MENSUAL vencida sin pagos (compra sin pagar) → SOLO_LECTURA',
  accesoDeLaFirma(fila('MENSUAL', VENCIDA), false, AHORA) === 'SOLO_LECTURA',
  'la compra no es una prueba: necesita leer para poder pagar'
);
check('ANUAL vencida sin pagos → SOLO_LECTURA', accesoDeLaFirma(fila('ANUAL', VENCIDA), false, AHORA) === 'SOLO_LECTURA');
check('CORTESIA sin fecha → COMPLETO', accesoDeLaFirma(fila('CORTESIA', null), false, AHORA) === 'COMPLETO');
check(
  'pago desconocido (null) en una PRUEBA vencida → NUNCA PRUEBA_TERMINADA',
  accesoDeLaFirma(fila('PRUEBA', VENCIDA), null, AHORA) !== 'PRUEBA_TERMINADA',
  'una caída de la base no deja por fuera a quien pagó'
);
check('solo la PRUEBA vencida consulta pagos', necesitaConsultarPagos(fila('PRUEBA', VENCIDA), AHORA));
check(
  'ninguna otra fila paga esa consulta',
  !necesitaConsultarPagos(fila('PRUEBA', VIGENTE), AHORA) &&
    !necesitaConsultarPagos(fila('MENSUAL', VENCIDA), AHORA) &&
    !necesitaConsultarPagos(fila('CORTESIA', null), AHORA)
);

/* ══════════════════════ 2. La lista de rutas abiertas ══════════════════════ */

const ESPERADAS = [
  'GET /api/auth/me',
  'GET /api/subscription/plan',
  'POST /api/subscription/checkout',
  'DELETE /api/auth/me',
  'DELETE /api/firms/me'
];
check(
  'la lista abierta es EXACTAMENTE las cinco rutas',
  RUTAS_ABIERTAS_CON_PRUEBA_TERMINADA.length === ESPERADAS.length &&
    ESPERADAS.every((r) => RUTAS_ABIERTAS_CON_PRUEBA_TERMINADA.includes(r)),
  RUTAS_ABIERTAS_CON_PRUEBA_TERMINADA.join(' · ')
);
check('abre GET /api/auth/me', rutaAbiertaConPruebaTerminada('GET', '/api/auth/me'));
check('abre con barra final', rutaAbiertaConPruebaTerminada('get', '/api/subscription/plan/'));
check('abre POST /api/subscription/checkout', rutaAbiertaConPruebaTerminada('POST', '/api/subscription/checkout'));
check(
  'abre el borrado de la firma y de la propia cuenta (Ley 1581: derecho a la supresión)',
  rutaAbiertaConPruebaTerminada('DELETE', '/api/firms/me') && rutaAbiertaConPruebaTerminada('DELETE', '/api/auth/me'),
  'quien ya no puede entrar tiene que poder borrar lo suyo'
);
check(
  'cierra el resto del mismo recurso',
  !rutaAbiertaConPruebaTerminada('PATCH', '/api/auth/me') &&
    !rutaAbiertaConPruebaTerminada('GET', '/api/firms/me') &&
    !rutaAbiertaConPruebaTerminada('GET', '/api/subscription/payments') &&
    !rutaAbiertaConPruebaTerminada('POST', '/api/subscription/prueba-gratuita') &&
    !rutaAbiertaConPruebaTerminada('GET', '/api/subscription/checkout') &&
    !rutaAbiertaConPruebaTerminada('GET', '/api/drafts')
);
check('el mensaje dice los días de la constante de la prueba', MENSAJE_PRUEBA_TERMINADA.includes(`${DIAS_DE_PRUEBA_GRATUITA} días`), MENSAJE_PRUEBA_TERMINADA);
check('el mensaje dice que no se borró nada', /no se ha borrado nada/.test(MENSAJE_PRUEBA_TERMINADA));

/* ══════════════════════ 3. El código, leído como texto ══════════════════════ */

const SRC = join(__dirname, '..', '..', '..');
const sinComentarios = (texto: string): string =>
  texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const leer = (...partes: string[]): string => sinComentarios(readFileSync(join(SRC, ...partes), 'utf8'));

const INDEX = leer('index.ts');
const SESION = "app.use('/api', authMiddleware);";
const GUARDA = "app.use('/api', bloquearPruebaTerminada);";
const tras = INDEX.indexOf(SESION);
check(
  'la guarda se monta INMEDIATAMENTE después de authMiddleware',
  tras !== -1 && INDEX.slice(tras + SESION.length).trimStart().startsWith(GUARDA)
);
check('y se monta una sola vez', INDEX.split('bloquearPruebaTerminada)').length === 2);

const REGLAS = leer('modules', 'subscriptions', 'pruebaTerminada.rules.ts');
const literales = REGLAS.match(/'(GET|POST|PUT|PATCH|DELETE) \/api[^']*'/g) ?? [];
check('el archivo de reglas no esconde otra ruta abierta', literales.length === 5, literales.join(' · '));

const GUARDIA = leer('modules', 'subscriptions', 'pruebaTerminada.middleware.ts');
check(
  'la guarda decide con la lista y no con caminos propios',
  GUARDIA.includes('rutaAbiertaConPruebaTerminada(') && !/'\/api/.test(GUARDIA)
);
check("la guarda no bloquea sin firma ni al superusuario", GUARDIA.includes('!firmId') && GUARDIA.includes("'SUPER_ADMIN'"));

const ADMIN = leer('modules', 'admin', 'admin.service.ts');
const inicioAlta = ADMIN.indexOf('export const createFirm');
const finAlta = ADMIN.indexOf('export const', inicioAlta + 1);
const ALTA = ADMIN.slice(inicioAlta, finAlta === -1 ? undefined : finAlta);
check('createFirm existe', inicioAlta !== -1);
check("createFirm escribe period 'CORTESIA'", ALTA.includes("period: 'CORTESIA'"));
check('createFirm no escribe fecha', ALTA.includes('diasDeVigencia: null') && !/diasDeVigencia:\s*[A-Z0-9]/.test(ALTA));
check("createFirm ya no nombra 'PRUEBA' ni DIAS_DE_PRUEBA", !ALTA.includes("'PRUEBA'") && !ADMIN.includes('DIAS_DE_PRUEBA'));
check('DIAS_DE_PRUEBA (14) se retiró del catálogo', !('DIAS_DE_PRUEBA' in catalogo));

const SERVICIO = leer('modules', 'subscriptions', 'plan.service.ts');
const inicioPagos = SERVICIO.indexOf('export const firmaPagoAlgunaVez');
const PAGOS = SERVICIO.slice(inicioPagos, SERVICIO.indexOf('export ', inicioPagos + 1));
check('la consulta de pagos existe', inicioPagos !== -1);
check(
  'la consulta de pagos NO es historialDePagos',
  !PAGOS.includes('historialDePagos') && !SERVICIO.includes('historialDePagos') && PAGOS.includes("'subscription_payments'"),
  'historialDePagos devuelve [] al fallar y bloquearía a quien pagó'
);
check('la consulta de pagos devuelve null al fallar', /return null;/.test(PAGOS));

console.log('');
if (fallos > 0) {
  console.log(`${fallos} fallo(s).`);
  process.exit(1);
}
console.log('Todo en orden.');
