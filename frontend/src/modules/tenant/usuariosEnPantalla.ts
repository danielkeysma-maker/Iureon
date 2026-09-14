import { NOMBRE_DE_PLAN, type PlanDeFirma } from '../subscriptions/types';

/**
 * «Su firma» —usuarios y roles— en funciones puras, para que un check pruebe
 * que la pantalla ofrece exactamente lo que el servidor admite.
 */

export const ROL_EN_PALABRAS: Record<string, string> = {
  FIRM_ADMIN: 'Socio · administrador',
  LAWYER: 'Abogado litigante',
  SUPER_ADMIN: 'Operación Iureon'
};

type Puestos = Pick<PlanDeFirma, 'plan' | 'maxUsers' | 'usuarios'>;

/**
 * «4 de 5 puestos del plan Premium». Los números son los del servidor
 * (`contarUsuarios`), que cuenta TODAS las cuentas de la firma, incluidas las
 * retiradas: por eso la pantalla nunca dice que retirar libera un puesto.
 */
export const puestosEnPalabras = (plan: Puestos | null): string | null => {
  if (!plan) return null;
  if (plan.maxUsers === null) return `${plan.usuarios} ${plan.usuarios === 1 ? 'usuario' : 'usuarios'}`;
  const nombre = plan.plan ? NOMBRE_DE_PLAN[plan.plan] : 'actual';
  return `${plan.usuarios} de ${plan.maxUsers} ${plan.maxUsers === 1 ? 'puesto' : 'puestos'} del plan ${nombre}`;
};

/**
 * Si cabe otra cuenta. Sin plan leído se deja pasar: el servidor responde 409
 * con su propio mensaje, y bloquear aquí por no saber sería inventar un tope.
 */
export const quedanPuestos = (plan: Puestos | null): boolean =>
  !plan || plan.maxUsers === null || plan.usuarios < plan.maxUsers;

/**
 * Lo que se le puede hacer a una cuenta, espejo del servidor:
 *  · a uno mismo, nada — `setUserActive` responde SELF_LOCKOUT y `setUserRole`
 *    SELF_DEMOTION; ofrecer el botón sería ofrecer un error;
 *  · al operador de la plataforma, nada — su rol no se da ni se quita por aquí;
 *  · a una cuenta retirada, solo reactivarla: cambiarle el rol a quien no puede
 *    entrar no decide nada todavía.
 */
export const accionesPosibles = (
  usuario: { email: string; role: string; desactivado: boolean },
  correoPropio: string
): { cambiarRol: boolean; retirar: boolean; reactivar: boolean } => {
  const nada = { cambiarRol: false, retirar: false, reactivar: false };
  if (usuario.role === 'SUPER_ADMIN') return nada;
  if (usuario.email.trim().toLowerCase() === correoPropio.trim().toLowerCase()) return nada;
  if (usuario.desactivado) return { ...nada, reactivar: true };
  return { cambiarRol: true, retirar: true, reactivar: false };
};

/**
 * El último ingreso, en palabras. Quien nunca entró se dice así, sin «invitación
 * enviada»: no sale ningún correo, la cuenta se crea con contraseña.
 */
export const ultimoIngreso = (iso: string | null, ahora: number = Date.now()): string => {
  if (!iso) return 'Todavía no ha entrado';
  const min = Math.floor((ahora - new Date(iso).getTime()) / 60000);
  if (min < 2) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
};

/** El 409 del cupo de usuarios, reconocido por el código que manda el servidor. */
export const esLimiteDeUsuarios = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'LIMITE_DE_USUARIOS';
