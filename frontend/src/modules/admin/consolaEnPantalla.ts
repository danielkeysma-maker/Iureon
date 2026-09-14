/**
 * Las reglas de pantalla de la consola de operación, en funciones puras.
 *
 * Viven fuera de los componentes por la misma razón que `planEnPantalla.ts` y
 * `recargaEnPantalla.ts`: son las decisiones que un check puede probar sin
 * montar React, y cada una nació de un defecto concreto de esta consola.
 *
 * Run their guard with: npm run check:consola-cara
 */

/**
 * LO QUE NO SE LEYÓ NO ES CERO.
 *
 * `firmVolumes` descartaba sus errores y la consola pintaba firmas con cero
 * usuarios, cero transcritos y cero consumo: cifras plausibles y falsas. El
 * servidor ya responde 502 cuando no puede contar, pero una cifra puede faltar
 * por otras vías (una respuesta vieja, un campo que no llegó). Toda cifra de
 * esta consola pasa por aquí, y la ausencia se dice con estas palabras.
 */
export const NO_SE_PUDO_LEER = 'no se pudo leer';

const leida = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n);

export const cifra = (n: number | null | undefined): string =>
  leida(n) ? Math.round(n).toLocaleString('es-CO') : NO_SE_PUDO_LEER;

export const pesos = (n: number | null | undefined): string =>
  leida(n) ? `$${Math.round(n).toLocaleString('es-CO')}` : NO_SE_PUDO_LEER;

/**
 * LA REGLA DE LA CORTESÍA, en una sola frase y en un solo sitio.
 *
 * `createFirm` en el servidor escribe PREMIUM, periodo CORTESIA y ningún
 * vencimiento (decisión del dueño, 14 de septiembre de 2026). La pantalla que
 * crea la firma y la que cambia su plan la repiten con esta constante; el check
 * lee el servidor para que la frase no sobreviva a un cambio de la regla.
 */
export const REGLA_DE_CORTESIA =
  'La firma nace en Premium, en cortesía y sin vencimiento: no vence hasta que usted le cambie el plan desde su ficha.';

/** El mismo mínimo que `requireReason` en el servidor. El formulario de plan pedía 5 y el servidor rechazaba. */
export const MIN_MOTIVO = 10;

export const faltaParaElMotivo = (motivo: string): number =>
  Math.max(0, MIN_MOTIVO - motivo.replace(/\s+/g, ' ').trim().length);

type Plan = 'ESENCIAL' | 'PREMIUM' | 'FIRMA';
type Periodo = 'MENSUAL' | 'ANUAL' | 'PRUEBA' | 'CORTESIA';

const NOMBRE_PLAN: Record<Plan, string> = { ESENCIAL: 'Esencial', PREMIUM: 'Premium', FIRMA: 'Firma' };
const PERIODO_EN_FRASE: Record<Periodo, string> = {
  MENSUAL: 'mensual',
  ANUAL: 'anual',
  PRUEBA: 'prueba',
  CORTESIA: 'cortesía'
};

interface PlanDeLista {
  plan: Plan | null;
  planPeriod: Periodo | null;
  planValidUntil: string | null;
  creditsBalance: number | null;
  consumo30dCop: number | null;
}

/** «Premium · mensual», «Premium · cortesía», o «Cortesía» para la firma sin plan asignado. */
export const describirPlan = (f: Pick<PlanDeLista, 'plan' | 'planPeriod'>): string => {
  if (!f.plan) return 'Cortesía';
  return f.planPeriod ? `${NOMBRE_PLAN[f.plan]} · ${PERIODO_EN_FRASE[f.planPeriod]}` : NOMBRE_PLAN[f.plan];
};

/**
 * DÍAS DE SALDO AL RITMO DE LOS ÚLTIMOS 30 DÍAS. Sin consumo no hay ritmo y no
 * hay días: `null`, que la pantalla dice con palabras. Sin saldo o consumo
 * leídos, tampoco — estimar sobre una cifra ausente es inventar la alarma.
 */
export const diasDeSaldo = (saldo: number | null | undefined, consumo30: number | null | undefined): number | null => {
  if (!leida(saldo) || !leida(consumo30) || consumo30 <= 0) return null;
  return Math.floor(saldo / (consumo30 / 30));
};

export type TonoDeEstado = 'ok' | 'aviso' | 'neutro' | 'marca';

/**
 * EL ESTADO DE LA FIRMA, DERIVADO DE LO QUE GOBIERNA. La columna
 * `subscription_status` (activa/en mora/cancelada) no la lee ninguna regla de
 * acceso desde que existen los planes: lo que decide si la firma trabaja es la
 * fecha del plan, y lo que obliga a llamarla hoy son sus días de saldo. Por eso
 * el orden: vencido, vence pronto, saldo bajo, y luego qué tipo de plan tiene.
 *
 * El tono del riesgo es AVISO, no peligro: el rojo se reserva a lo que destruye.
 */
export const estadoDeFirma = (f: PlanDeLista, ahora: number = Date.now()): { etiqueta: string; tono: TonoDeEstado } => {
  if (f.planValidUntil) {
    const dias = Math.ceil((new Date(f.planValidUntil).getTime() - ahora) / 86_400_000);
    if (dias <= 0) return { etiqueta: 'Vencido', tono: 'aviso' };
    if (dias <= 7) return { etiqueta: `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`, tono: 'aviso' };
  }
  const dias = diasDeSaldo(f.creditsBalance, f.consumo30dCop);
  if (dias !== null && dias <= 7) return { etiqueta: 'Saldo bajo', tono: 'aviso' };
  if (f.planPeriod === 'PRUEBA') return { etiqueta: 'Prueba', tono: 'marca' };
  if (!f.planValidUntil) return { etiqueta: 'Cortesía', tono: 'neutro' };
  return { etiqueta: 'Activa', tono: 'ok' };
};

const normalizar = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();

/** Por nombre o NIT, como pide el buscador del artboard. El NIT se compara solo por sus dígitos. */
export const filtrarFirmas = <F extends { name: string; nit: string | null }>(firmas: readonly F[], texto: string): F[] => {
  const q = normalizar(texto.trim());
  if (!q) return [...firmas];
  const digitos = q.replace(/\D/g, '');
  return firmas.filter(
    (f) => normalizar(f.name).includes(q) || (digitos.length > 0 && (f.nit ?? '').replace(/\D/g, '').includes(digitos))
  );
};

/**
 * ORDEN POR RIESGO OPERATIVO, no alfabético: la firma a punto de quedarse sin
 * saldo va primero, porque es a la que hay que llamar hoy. El resto, por
 * consumo, que es lo que más pesa en el negocio.
 */
export const ordenarPorRiesgo = <F extends PlanDeLista>(firmas: readonly F[]): F[] =>
  [...firmas].sort((a, b) => {
    const da = diasDeSaldo(a.creditsBalance, a.consumo30dCop);
    const db = diasDeSaldo(b.creditsBalance, b.consumo30dCop);
    const ra = da !== null && da <= 7 ? da : Number.POSITIVE_INFINITY;
    const rb = db !== null && db <= 7 ? db : Number.POSITIVE_INFINITY;
    if (ra !== rb) return ra - rb;
    return (b.consumo30dCop ?? 0) - (a.consumo30dCop ?? 0);
  });

/**
 * «ESPERAN RESPUESTA» ES UNA CUENTA, NO UN ADORNO: abiertas cuyo último mensaje
 * es de la firma. Las abiertas donde soporte ya contestó no esperan a nadie.
 */
export const esperanRespuesta = (
  conversaciones: ReadonlyArray<{ status: 'ABIERTA' | 'CERRADA'; lastAuthor: 'FIRMA' | 'OPERADOR' | null }>
): number => conversaciones.filter((c) => c.status === 'ABIERTA' && c.lastAuthor === 'FIRMA').length;

/** Sin bandeja leída, el botón no lleva número: un «0» afirmaría que nadie espera. */
export const rotuloDeSoporte = (esperan: number | null): string =>
  esperan !== null && esperan > 0 ? `Soporte · ${esperan}` : 'Soporte';

/**
 * Por qué no se puede guardar un cambio de plan, o `null` si se puede. Las
 * mismas dos reglas del servidor (`updateFirmPlan`): un periodo que no es
 * cortesía exige fecha, y todo cambio exige motivo de diez caracteres.
 */
export const validarCambioDePlan = (input: { periodo: Periodo; vence: string; motivo: string }): string | null => {
  if (input.periodo !== 'CORTESIA' && !input.vence) return 'Ese periodo necesita una fecha de vencimiento.';
  const faltan = faltaParaElMotivo(input.motivo);
  if (faltan > 0) return `Sin motivo, el botón queda inhabilitado: faltan ${faltan} ${faltan === 1 ? 'carácter' : 'caracteres'}.`;
  return null;
};

/**
 * El nombre del plan con sus puestos, SOLO si el servidor los dio: los puestos
 * salen de `plan.catalog.ts` por `/api/subscription/plan`. Sin esa lectura se
 * dice el nombre y nada más, en vez de copiar el catálogo a mano.
 */
export const opcionDePlan = (
  plan: Plan,
  planes: Partial<Record<Plan, { nombre: string; maxUsuarios: number }>> | null
): string => {
  const def = planes?.[plan];
  if (!def) return NOMBRE_PLAN[plan];
  return `${def.nombre} · ${def.maxUsuarios === 1 ? '1 usuario' : `hasta ${def.maxUsuarios} usuarios`}`;
};

/** Última sesión en palabras. `null` es una cuenta que nunca entró, no una fecha perdida. */
export const hace = (iso: string | null, ahora: number = Date.now()): string => {
  if (!iso) return 'Todavía no ha entrado';
  const min = Math.floor((ahora - new Date(iso).getTime()) / 60000);
  if (min < 2) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
};
