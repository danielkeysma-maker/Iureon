import { DIAS_DE_PRUEBA_GRATUITA } from './pruebaTerminada';
import { NOMBRE_DE_PLAN, type Modulo, type Plan, type PlanDeFirma, type PlanDefinition } from './types';

/**
 * Lo que las pantallas del plan DICEN sobre el plan, sin React y sin red, para
 * que `check:ajustes-plan-cara` lo pruebe frase por frase.
 *
 * NADA DE ESTO DECIDE EL ESTADO. El estado, los días y el acceso los calcula el
 * servidor (`plan.catalog.ts`, `accesoDeLaFirma`); aquí solo se escoge la frase
 * que corresponde a lo que él dijo. Por eso la fecha llega ya formateada desde
 * fuera: el check la sustituye por un marcador y compara frases exactas.
 *
 * TRES FINALES DISTINTOS QUE NO PUEDEN DECIRSE IGUAL (decisión del titular, 14
 * de septiembre de 2026): la prueba gratuita que termina sin pagar PIERDE TODO
 * el acceso; la firma que pagó alguna vez queda en solo lectura SIN LÍMITE DE
 * DÍAS; la cortesía que asigna el equipo de Iureon no vence hasta que la
 * cambien. Confundir la primera con la segunda —como hacían la franja y la
 * confirmación de la prueba— le promete a quien prueba una salida que no tiene.
 */

type Fecha = (iso: string) => string;

/** « · en N días», « · mañana», « · hoy». Nada cuando ya venció o no hay cifra. */
const cuando = (dias: number | null): string => {
  if (dias === null || dias < 0) return '';
  if (dias === 0) return ' · hoy';
  if (dias === 1) return ' · mañana';
  return ` · en ${dias} días`;
};

const esCortesia = (plan: PlanDeFirma): boolean =>
  plan.estado === 'CORTESIA' || plan.period === 'CORTESIA' || plan.validUntil === null;

/**
 * El nombre que se lee arriba. Sin plan asignado es «Cortesía»: la fila legada
 * y la firma que crea el operador no tienen plan, y llamarlas «Sin plan» haría
 * creer que no pueden usar nada cuando lo usan todo.
 */
export const nombreDelPlanActual = (plan: PlanDeFirma, planes: Record<Plan, PlanDefinition> | null): string =>
  plan.plan ? planes?.[plan.plan]?.nombre ?? NOMBRE_DE_PLAN[plan.plan] : 'Cortesía';

/**
 * La línea bajo el nombre del plan.
 *
 * NUNCA «SE RENUEVA». La maqueta escribe «se renueva en 18 días», y en Iureon
 * nada se renueva solo: no hay tarjeta guardada ni cobro automático. Decirlo
 * así haría esperar un cobro que no llega y un plan que vence en silencio.
 */
export const lineaDelVencimiento = (plan: PlanDeFirma, fecha: Fecha): string => {
  if (esCortesia(plan) || plan.validUntil === null) return 'Sin vencimiento, hasta que el equipo de Iureon la cambie';
  const dia = fecha(plan.validUntil);
  if (plan.acceso === 'PRUEBA_TERMINADA') return `La prueba gratuita terminó el ${dia}`;
  if (plan.period === 'PRUEBA') return `Prueba gratuita · termina el ${dia}${cuando(plan.diasRestantes)}`;
  if (plan.estado === 'VENCIDO') return `Venció el ${dia} · solo lectura, sin límite de días`;
  return `Vence el ${dia}${cuando(plan.diasRestantes)}`;
};

export interface AvisoDelPlan {
  titulo: string;
  texto: string;
  tono: 'aviso' | 'peligro';
}

/**
 * El recuadro que la maqueta pone bajo el plan activo, solo cuando hay algo que
 * decidir. Un aviso que está siempre deja de leerse el día que importa, así que
 * un plan al día y la cortesía no lo llevan; la prueba terminada tampoco,
 * porque tiene su propia pantalla de bloqueo.
 */
export const avisoDelPlan = (plan: PlanDeFirma, fecha: Fecha): AvisoDelPlan | null => {
  if (esCortesia(plan) || plan.validUntil === null || plan.acceso === 'PRUEBA_TERMINADA') return null;
  const dia = fecha(plan.validUntil);

  if (plan.period === 'PRUEBA' && plan.estado !== 'VENCIDO') {
    return {
      titulo: `La prueba gratuita termina el ${dia}`,
      texto:
        'Al terminar no se cobra nada y la firma pierde el acceso a la aplicación: solo podrá contratar un plan o borrar sus datos. El trabajo no se borra.',
      tono: 'aviso'
    };
  }
  if (plan.estado === 'POR_VENCER') {
    return {
      titulo: `Vence el ${dia}`,
      texto:
        'No hay cobro automático ni tarjeta guardada. Si paga el mismo plan antes del vencimiento, el periodo se suma a la fecha vigente y no pierde días.',
      tono: 'aviso'
    };
  }
  if (plan.estado === 'VENCIDO') {
    return {
      titulo: `El plan venció el ${dia}`,
      texto:
        'La firma queda en solo lectura, sin límite de días: puede leer y descargar lo que ya tiene. Al pagar un periodo vuelve a trabajar.',
      tono: 'peligro'
    };
  }
  return null;
};

/** Cuántos puestos sobran o faltan si la firma, con sus usuarios de hoy, pasa a un plan. */
export const encajeDePuestos = (usuarios: number, maxUsuarios: number): { cabe: boolean; libres: number; sobran: number } => ({
  cabe: usuarios <= maxUsuarios,
  libres: Math.max(0, maxUsuarios - usuarios),
  sobran: Math.max(0, usuarios - maxUsuarios)
});

const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

/**
 * La nota de cada tarjeta de «Cambiar de plan»: los usuarios de hoy de ESTA
 * firma contra el tope del catálogo.
 *
 * SE DICE EL HECHO, NO UNA CONDICIÓN. La maqueta escribe «tendría que retirar a
 * 3 abogados», pero el checkout del servidor no compara usuarios con el tope al
 * cobrar; presentarlo como requisito para pagar sería inventar una regla.
 */
export const notaDeLaTarjeta = (esElActual: boolean, usuarios: number, def: PlanDefinition): string => {
  const { cabe, libres } = encajeDePuestos(usuarios, def.maxUsuarios);
  if (!cabe) return `No alcanza hoy: la firma tiene ${plural(usuarios, 'usuario', 'usuarios')} y este plan llega a ${def.maxUsuarios}.`;
  if (esElActual) return libres === 0 ? 'No le quedan puestos libres.' : `Le ${libres === 1 ? 'queda' : 'quedan'} ${plural(libres, 'puesto libre', 'puestos libres')}.`;
  return libres === 0 ? 'Quedaría sin puestos libres.' : `Le ${libres === 1 ? 'quedaría' : 'quedarían'} ${plural(libres, 'puesto libre', 'puestos libres')}.`;
};

/**
 * EL ORDEN EN QUE SE LEEN LOS MÓDULOS: el del panel lateral. Solo ordena; la
 * lista la pone el catálogo. Un módulo que el servidor añada y que aquí no
 * figure va al final en vez de perderse — la lista a mano que había antes dejó
 * fuera Expedientes justo así.
 */
const ORDEN: readonly Modulo[] = [
  'REDACCION',
  'REVISIONES',
  'BORRADORES',
  'ORIENTACION',
  'EXPEDIENTES',
  'AUDIENCIAS',
  'ENTREVISTAS',
  'BUSCADOR',
  'CATALOGO',
  'HERRAMIENTAS',
  'MANUAL',
  'SOPORTE',
  'MEMBRETE'
];

/** Todos los módulos que vende algún plan, en el orden del panel. Sin catálogo, ninguno. */
export const modulosDelCatalogo = (planes: Record<Plan, PlanDefinition> | null): Modulo[] => {
  if (!planes) return [];
  const union = new Set<Modulo>();
  for (const def of Object.values(planes)) for (const m of def.modulos) union.add(m);
  return [...ORDEN.filter((m) => union.has(m)), ...[...union].filter((m) => !ORDEN.includes(m))];
};

/**
 * «El año son diez meses» solo se dice si es cierto en TODOS los planes del
 * catálogo que llegó. Si mañana un precio anual se mueve, la frase se apaga
 * sola en vez de quedar mintiendo junto a la cifra.
 */
export const anualSonDiezMeses = (planes: Record<Plan, PlanDefinition> | null): boolean =>
  planes !== null && Object.values(planes).every((p) => p.precioAnualCop === p.precioMensualCop * 10);

/**
 * La prueba gratuita, en palabras. Solo existe para Esencial y dura lo que dice
 * `DIAS_DE_PRUEBA_GRATUITA` (atada a `trial.rules.ts` por su propio check).
 */
export const TEXTO_DE_LA_PRUEBA = {
  oferta: `Probar Esencial gratis ${DIAS_DE_PRUEBA_GRATUITA} días`,
  detalle: 'Un usuario, sin tarjeta y sin cobro al terminar.',
  confirmacion:
    `La firma queda en el plan Esencial durante ${DIAS_DE_PRUEBA_GRATUITA} días, con un usuario y todos sus módulos. ` +
    'No se pide tarjeta y al terminar no se cobra nada. Si no contrata un plan antes, la firma pierde el acceso a la aplicación: ' +
    'solo podrá contratar o borrar sus datos. La prueba es una sola por firma y por persona.'
} as const;
