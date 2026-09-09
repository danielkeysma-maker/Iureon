/**
 * Guards the plan rules.
 *
 * Run with: npm run check:plan
 *
 * No database, no network: everything here is the arithmetic of a subscription
 * — prices, the period a payment buys, the state a firm is in, the modules a
 * plan opens — proven against fixed dates. These are the numbers a partner is
 * charged and the rules that lock a firm out, so a drift in any of them is a
 * defect the lawyer notices before the build does.
 */
import {
  DIAS_DE_AVISO,
  FUNCIONES,
  PLANES,
  TODAS_LAS_FUNCIONES,
  TODOS_LOS_MODULOS,
  cabeOtroUsuario,
  cierreDeFuncion,
  diasRestantes,
  estadoDelPlan,
  esVigente,
  funcionDisponible,
  mensajeDeFuncionDeshabilitada,
  moduloDeFuncion,
  moduloDisponible,
  modulosDisponibles,
  modulosPermitidos,
  periodoQueCompra,
  soloFunciones,
  soloModulos,
  validarModulosDesactivados,
  permiteModulo,
  planBloquea,
  precioDe,
  sumarMeses,
  type PlanRow
} from '../plan.catalog';
import { MAX_USUARIOS_PARA_PRUEBA, decidirPrueba, type SenalesDePrueba } from '../pruebaGratuita.rules';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const iso = (d: Date): string => d.toISOString();
const dia = (s: string): Date => new Date(s);

// ─── Precios ────────────────────────────────────────────────────────────────
check('ESENCIAL mensual cuesta $85.000', precioDe('ESENCIAL', 'MENSUAL') === 85_000);
check('ESENCIAL anual cuesta $850.000', precioDe('ESENCIAL', 'ANUAL') === 850_000);
check('PREMIUM mensual cuesta $120.000', precioDe('PREMIUM', 'MENSUAL') === 120_000);
check('PREMIUM anual cuesta $1.200.000', precioDe('PREMIUM', 'ANUAL') === 1_200_000);
check('FIRMA mensual cuesta $250.000', precioDe('FIRMA', 'MENSUAL') === 250_000);
check('FIRMA anual cuesta $2.500.000', precioDe('FIRMA', 'ANUAL') === 2_500_000);
check(
  'el año son 12 meses por el precio de 10, en los tres planes',
  (Object.keys(PLANES) as Array<keyof typeof PLANES>).every(
    (p) => PLANES[p].precioAnualCop === PLANES[p].precioMensualCop * 10
  ) && Object.keys(PLANES).length === 3
);
check(
  'ESENCIAL admite 1 usuario, PREMIUM 5 y FIRMA 15',
  PLANES.ESENCIAL.maxUsuarios === 1 && PLANES.PREMIUM.maxUsuarios === 5 && PLANES.FIRMA.maxUsuarios === 15
);

// ─── Módulos ────────────────────────────────────────────────────────────────
check(
  'ESENCIAL no incluye Audiencias, Entrevistas ni Orientación',
  !permiteModulo('ESENCIAL', 'AUDIENCIAS') &&
    !permiteModulo('ESENCIAL', 'ENTREVISTAS') &&
    !permiteModulo('ESENCIAL', 'ORIENTACION')
);
check(
  'ESENCIAL sí incluye los nueve módulos básicos',
  (['REDACCION', 'BORRADORES', 'REVISIONES', 'BUSCADOR', 'CATALOGO', 'HERRAMIENTAS', 'MANUAL', 'SOPORTE', 'MEMBRETE'] as const).every((m) =>
    permiteModulo('ESENCIAL', m)
  ) && PLANES.ESENCIAL.modulos.length === 9
);
check('PREMIUM incluye todos los módulos', TODOS_LOS_MODULOS.every((m) => permiteModulo('PREMIUM', m)) && TODOS_LOS_MODULOS.length === 12);
check('FIRMA incluye exactamente los mismos módulos que PREMIUM', PLANES.FIRMA.modulos === PLANES.PREMIUM.modulos);
check(
  'una firma sin plan (cortesía legacy) ve todos los módulos',
  modulosPermitidos(null).length === TODOS_LOS_MODULOS.length && permiteModulo(null, 'ORIENTACION')
);

// ─── Módulos por firma: el plan es la base, el operador resta ───────────────
check(
  'PREMIUM menos AUDIENCIAS no incluye Audiencias y conserva los otros once',
  !modulosDisponibles('PREMIUM', ['AUDIENCIAS']).includes('AUDIENCIAS') &&
    modulosDisponibles('PREMIUM', ['AUDIENCIAS']).length === TODOS_LOS_MODULOS.length - 1
);
check(
  'la resta no añade: ESENCIAL menos ORIENTACION sigue siendo los nueve básicos',
  modulosDisponibles('ESENCIAL', ['ORIENTACION']).length === 9 &&
    modulosDisponibles('ESENCIAL', ['ORIENTACION']).every((m) => PLANES.ESENCIAL.modulos.includes(m))
);
check(
  'reactivar (lista vacía) devuelve exactamente lo del plan',
  modulosDisponibles('PREMIUM', []).length === TODOS_LOS_MODULOS.length &&
    modulosDisponibles('PREMIUM', []).every((m) => modulosPermitidos('PREMIUM').includes(m))
);
check(
  'una cortesía legacy (plan NULL) también se puede restar',
  !modulosDisponibles(null, ['ENTREVISTAS']).includes('ENTREVISTAS') &&
    modulosDisponibles(null, ['ENTREVISTAS']).length === TODOS_LOS_MODULOS.length - 1
);
check(
  'un módulo desconocido se rechaza nombrándolo',
  (() => {
    const r = validarModulosDesactivados(['AUDIENCIAS', 'FACTURACION']);
    return !r.ok && r.invalido === 'FACTURACION';
  })()
);
check(
  'algo que no es lista se rechaza',
  !validarModulosDesactivados('AUDIENCIAS').ok && !validarModulosDesactivados(undefined).ok
);
check(
  'la lista válida colapsa duplicados y sale en el orden del catálogo',
  (() => {
    const r = validarModulosDesactivados(['ORIENTACION', 'AUDIENCIAS', 'AUDIENCIAS']);
    return r.ok && r.modulos.length === 2 && r.modulos[0] === 'AUDIENCIAS' && r.modulos[1] === 'ORIENTACION';
  })()
);
check(
  'moduloDisponible sobre la fila: PREMIUM con AUDIENCIAS restado no la tiene; sin restar, sí',
  !moduloDisponible(
    { plan: 'PREMIUM', period: 'MENSUAL', validUntil: null, maxUsers: 5, modulosDesactivados: ['AUDIENCIAS'] },
    'AUDIENCIAS'
  ) &&
    moduloDisponible(
      { plan: 'PREMIUM', period: 'MENSUAL', validUntil: null, maxUsers: 5, modulosDesactivados: [] },
      'AUDIENCIAS'
    )
);

// ─── Meses como Postgres ────────────────────────────────────────────────────
check('31 de enero + 1 mes = 28 de febrero (no 3 de marzo)', iso(sumarMeses(dia('2027-01-31T10:00:00Z'), 1)) === '2027-02-28T10:00:00.000Z');
check('29 de febrero bisiesto + 12 meses = 28 de febrero', iso(sumarMeses(dia('2028-02-29T00:00:00Z'), 12)) === '2029-02-28T00:00:00.000Z');
check('15 de marzo + 1 mes = 15 de abril, misma hora', iso(sumarMeses(dia('2026-03-15T14:30:00Z'), 1)) === '2026-04-15T14:30:00.000Z');

// ─── El periodo que compra un pago ──────────────────────────────────────────
const ahora = dia('2026-09-04T12:00:00Z');

{
  const p = periodoQueCompra({ ahora, vigenteHasta: null, period: 'MENSUAL' });
  check('sin plan previo, el mes arranca hoy', iso(p.validFrom) === iso(ahora) && iso(p.validUntil) === '2026-10-04T12:00:00.000Z');
}
{
  const vigente = dia('2026-09-20T12:00:00Z');
  const p = periodoQueCompra({ ahora, vigenteHasta: vigente, period: 'MENSUAL' });
  check(
    'pagar antes de vencer EXTIENDE desde la fecha vigente: no se pierden días',
    iso(p.validFrom) === iso(vigente) && iso(p.validUntil) === '2026-10-20T12:00:00.000Z'
  );
}
{
  const vencido = dia('2026-08-01T12:00:00Z');
  const p = periodoQueCompra({ ahora, vigenteHasta: vencido, period: 'ANUAL' });
  check(
    'pagar después de vencer arranca hoy, no desde la fecha vencida',
    iso(p.validFrom) === iso(ahora) && iso(p.validUntil) === '2027-09-04T12:00:00.000Z'
  );
}
{
  const vigente = dia('2027-01-10T12:00:00Z');
  const p = periodoQueCompra({ ahora, vigenteHasta: vigente, period: 'ANUAL' });
  check('el año se suma a la fecha vigente futura', iso(p.validUntil) === '2028-01-10T12:00:00.000Z');
}

// ─── Estado ─────────────────────────────────────────────────────────────────
const fila = (parcial: Partial<PlanRow>): PlanRow => ({
  plan: null,
  period: null,
  validUntil: null,
  maxUsers: null,
  modulosDesactivados: [],
  ...parcial
});

check('todo NULL = CORTESÍA legacy, y no bloquea', estadoDelPlan(fila({}), ahora) === 'CORTESIA' && !planBloquea(fila({}), ahora));
check(
  'CORTESIA explícita sin fecha = CORTESÍA, sin bloqueo',
  estadoDelPlan(fila({ plan: 'PREMIUM', period: 'CORTESIA' }), ahora) === 'CORTESIA'
);
check(
  'plan vigente con más de 7 días = ACTIVO',
  estadoDelPlan(fila({ plan: 'ESENCIAL', period: 'MENSUAL', validUntil: dia('2026-10-01T12:00:00Z') }), ahora) === 'ACTIVO'
);
check(
  'a 7 días o menos = POR_VENCER',
  estadoDelPlan(fila({ plan: 'ESENCIAL', period: 'MENSUAL', validUntil: dia('2026-09-11T12:00:00Z') }), ahora) === 'POR_VENCER' &&
    estadoDelPlan(fila({ plan: 'ESENCIAL', period: 'MENSUAL', validUntil: dia('2026-09-11T13:00:00Z') }), ahora) === 'ACTIVO'
);
check(
  'una prueba con más de 7 días = PRUEBA; en su última semana = POR_VENCER',
  estadoDelPlan(fila({ plan: 'PREMIUM', period: 'PRUEBA', validUntil: dia('2026-09-18T12:00:00Z') }), ahora) === 'PRUEBA' &&
    estadoDelPlan(fila({ plan: 'PREMIUM', period: 'PRUEBA', validUntil: dia('2026-09-08T12:00:00Z') }), ahora) === 'POR_VENCER'
);
{
  const vencida = fila({ plan: 'PREMIUM', period: 'ANUAL', validUntil: dia('2026-09-04T11:59:00Z') });
  check('un minuto después de vencer = VENCIDO y bloquea', estadoDelPlan(vencida, ahora) === 'VENCIDO' && planBloquea(vencida, ahora));
}
check(
  'una cortesía con fecha también vence',
  estadoDelPlan(fila({ plan: 'PREMIUM', period: 'CORTESIA', validUntil: dia('2026-01-01T00:00:00Z') }), ahora) === 'VENCIDO'
);
check('DIAS_DE_AVISO es 7', DIAS_DE_AVISO === 7);

// ─── Funciones por firma: un sub-servicio apagado dentro de un módulo encendido ──
const filaPremium = (desactivados: PlanRow['modulosDesactivados']): PlanRow => ({
  plan: 'PREMIUM',
  period: 'MENSUAL',
  validUntil: null,
  maxUsers: 5,
  modulosDesactivados: desactivados
});
const enUnMes = dia('2099-01-01T00:00:00Z');

check(
  'cada función tiene la forma <MODULO>.<FUNCION> y su módulo existe en el catálogo',
  FUNCIONES.every((f) => f.id.split('.').length === 2 && f.id.startsWith(`${f.modulo}.`) && TODOS_LOS_MODULOS.includes(f.modulo)) &&
    FUNCIONES.every((f) => f.nombre.trim().length > 0 && f.descripcion.trim().length > 0)
);
check('no hay dos funciones con el mismo id', new Set(TODAS_LAS_FUNCIONES).size === TODAS_LAS_FUNCIONES.length);
check(
  'un id de función se acepta en la misma lista que los módulos',
  (() => {
    const r = validarModulosDesactivados(['REVISIONES.PREGUNTAS_AUDIENCIA', 'AUDIENCIAS']);
    return r.ok && r.modulos.length === 2 && r.modulos[0] === 'AUDIENCIAS' && r.modulos[1] === 'REVISIONES.PREGUNTAS_AUDIENCIA';
  })()
);
check(
  'una función desconocida se rechaza nombrándola, aunque el módulo exista',
  (() => {
    const r = validarModulosDesactivados(['REVISIONES.FACTURAR']);
    return !r.ok && r.invalido === 'REVISIONES.FACTURAR';
  })()
);
check(
  'la lista mixta se reparte: soloModulos y soloFunciones, cada una en orden de catálogo',
  (() => {
    const mixta = ['REVISIONES.REREVISAR', 'ORIENTACION', 'REDACCION.ADJUNTOS', 'AUDIENCIAS'] as const;
    const m = soloModulos(mixta);
    const f = soloFunciones(mixta);
    return m.join(',') === 'AUDIENCIAS,ORIENTACION' && f.join(',') === 'REDACCION.ADJUNTOS,REVISIONES.REREVISAR';
  })()
);
check(
  'función apagada: el módulo sigue encendido y las otras funciones del módulo también',
  (() => {
    const fila = filaPremium(['REVISIONES.PREGUNTAS_AUDIENCIA']);
    return (
      moduloDisponible(fila, 'REVISIONES') &&
      !funcionDisponible(fila, 'REVISIONES.PREGUNTAS_AUDIENCIA') &&
      funcionDisponible(fila, 'REVISIONES.CHAT_GUIA') &&
      funcionDisponible(fila, 'REVISIONES.REREVISAR') &&
      modulosDisponibles(fila.plan, fila.modulosDesactivados).length === TODOS_LOS_MODULOS.length
    );
  })()
);
check(
  'módulo apagado: todas sus funciones quedan no disponibles sin guardarlas',
  (() => {
    const fila = filaPremium(['REVISIONES']);
    return FUNCIONES.filter((f) => f.modulo === 'REVISIONES').every((f) => !funcionDisponible(fila, f.id)) && funcionDisponible(fila, 'REDACCION.ADJUNTOS');
  })()
);
check(
  'módulo fuera del plan: sus funciones tampoco están, aunque nadie las haya restado',
  (() => {
    const esencial: PlanRow = { ...filaPremium([]), plan: 'ESENCIAL', maxUsers: 1 };
    return !funcionDisponible(esencial, 'AUDIENCIAS.RESUMEN') && funcionDisponible(esencial, 'REVISIONES.REREVISAR');
  })()
);
check('sin plan (cortesía legacy) toda función está disponible hasta que se resta', TODAS_LAS_FUNCIONES.every((f) => funcionDisponible(fila({}), f)));
check(
  'cierreDeFuncion: abierta = null; función restada = FUNCION_DESACTIVADA',
  cierreDeFuncion(filaPremium([]), 'REVISIONES.REREVISAR', ahora) === null &&
    cierreDeFuncion(filaPremium(['REVISIONES.REREVISAR']), 'REVISIONES.REREVISAR', ahora) === 'FUNCION_DESACTIVADA'
);
check(
  'cierreDeFuncion: el módulo restado manda sobre la función, aunque las dos estén en la lista',
  cierreDeFuncion(filaPremium(['REVISIONES', 'REVISIONES.REREVISAR']), 'REVISIONES.REREVISAR', ahora) === 'MODULO_DESACTIVADO'
);
check(
  'cierreDeFuncion: módulo fuera del plan = MODULO_NO_EN_PLAN; plan vencido = PLAN_VENCIDO antes que nada',
  cierreDeFuncion({ ...filaPremium([]), plan: 'ESENCIAL' }, 'ENTREVISTAS.GUION', ahora) === 'MODULO_NO_EN_PLAN' &&
    cierreDeFuncion({ ...filaPremium(['REVISIONES.REREVISAR']), validUntil: dia('2026-01-01T00:00:00Z') }, 'REVISIONES.REREVISAR', ahora) === 'PLAN_VENCIDO' &&
    cierreDeFuncion({ ...filaPremium([]), validUntil: enUnMes }, 'REVISIONES.REREVISAR', ahora) === null
);
check(
  'el mensaje de la función nombra la función como la pantalla y manda a Soporte',
  mensajeDeFuncionDeshabilitada('REVISIONES.REREVISAR') === 'Volver a revisar no está habilitada para su firma. Escríbanos por Soporte para activarla.' &&
    moduloDeFuncion('REVISIONES.REREVISAR') === 'REVISIONES'
);

// ─── Solo lectura: quién puede escribir ─────────────────────────────────────
check(
  'ACTIVO, POR_VENCER, PRUEBA y CORTESIA siguen escribiendo; solo VENCIDO queda en solo lectura',
  esVigente('ACTIVO') && esVigente('POR_VENCER') && esVigente('PRUEBA') && esVigente('CORTESIA') && !esVigente('VENCIDO')
);
check(
  'planBloquea es exactamente la negacion de esVigente sobre el estado calculado',
  planBloquea(fila({ plan: 'PREMIUM', period: 'ANUAL', validUntil: dia('2026-09-04T11:59:00Z') }), ahora) ===
    !esVigente(estadoDelPlan(fila({ plan: 'PREMIUM', period: 'ANUAL', validUntil: dia('2026-09-04T11:59:00Z') }), ahora)) &&
    planBloquea(fila({}), ahora) === !esVigente(estadoDelPlan(fila({}), ahora))
);

// ─── Días restantes ─────────────────────────────────────────────────────────
check('sin vencimiento no hay días restantes', diasRestantes(null, ahora) === null);
check('30 horas restantes se leen como 2 días, no 1', diasRestantes(dia('2026-09-05T18:00:00Z'), ahora) === 2);
check('vencido hace dos días da -2', diasRestantes(dia('2026-09-02T12:00:00Z'), ahora) === -2);

// ─── Cupo de usuarios ───────────────────────────────────────────────────────
check('sin tope (cortesía) siempre cabe otro', cabeOtroUsuario(null, 40));
check('ESENCIAL con 1 usuario no admite otro', !cabeOtroUsuario(1, 1));
check('PREMIUM con 4 admite el quinto, con 5 no', cabeOtroUsuario(5, 4) && !cabeOtroUsuario(5, 5));
check('FIRMA con 14 admite el decimoquinto, con 15 no', cabeOtroUsuario(15, 14) && !cabeOtroUsuario(15, 15));

// ─── Prueba gratuita desde «Plan de la firma» ───────────────────────────────
const MENSAJE_PERSONA = 'Ya usó su prueba gratuita. Puede contratar un plan o iniciar sesión.';
const senales = (parcial: Partial<SenalesDePrueba>): SenalesDePrueba => ({
  firmaYaProbo: false,
  firmaYaPago: false,
  personaYaProbo: false,
  usuarios: 1,
  ...parcial
});
const decide = (parcial: Partial<SenalesDePrueba>) => decidirPrueba(senales(parcial), MENSAJE_PERSONA);

check('la prueba desde el plan es de un usuario', MAX_USUARIOS_PARA_PRUEBA === 1);
check('firma nueva, sin pagos, sin prueba, un usuario, persona sin prueba: disponible', decide({}).disponible === true);
check('una firma sin ninguna cuenta todavía también puede', decide({ usuarios: 0 }).disponible === true);
{
  const d = decide({ firmaYaPago: true });
  check('la firma que ya pagó no tiene prueba', !d.disponible && d.codigo === 'TRIAL_NOT_AVAILABLE' && d.motivo.includes('ya pagó'));
}
{
  const d = decide({ firmaYaProbo: true });
  check('la firma que ya probó no repite', !d.disponible && d.codigo === 'TRIAL_NOT_AVAILABLE' && d.motivo.includes('ya tuvo su prueba'));
}
{
  const d = decide({ usuarios: 2 });
  check('con dos usuarios no hay prueba: es de un solo puesto', !d.disponible && d.codigo === 'TRIAL_NOT_AVAILABLE' && d.motivo.includes('ya tiene 2'));
}
{
  const d = decide({ personaYaProbo: true });
  check(
    'la persona que ya probó recibe TRIAL_ALREADY_USED con la frase exacta del formulario público',
    !d.disponible && d.codigo === 'TRIAL_ALREADY_USED' && d.motivo === MENSAJE_PERSONA
  );
}
{
  const d = decide({ firmaYaPago: true, personaYaProbo: true });
  check('cuando la firma pagó y la persona ya probó, manda la razón de la firma', !d.disponible && d.codigo === 'TRIAL_NOT_AVAILABLE');
}
check('cualquier señal en contra basta', !decide({ firmaYaProbo: true, usuarios: 3, personaYaProbo: true }).disponible);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
