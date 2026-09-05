/**
 * The rules of the public 7-day trial, with no I/O.
 *
 * Kept free of imports that reach the database or the environment so
 * `trial.check.ts` can prove them without credentials — the same split
 * `plan.catalog.ts` / `plan.service.ts` uses. Anything that talks to Supabase,
 * Auth or mail lives in `trial.service.ts`.
 */

/** ONLY Esencial has a self-service trial; the other plans are sold by contact. */
export const PLAN_DE_PRUEBA = 'ESENCIAL' as const;

/** Seven days, not fourteen: the operator's onboarding trial is a different thing. */
export const DIAS_DE_PRUEBA_GRATUITA = 7;

/** One seat: Esencial's own cap. A trial that admits colleagues is Premium for free. */
export const USUARIOS_DE_PRUEBA = 1;

/**
 * Three sign-ups per address per day. One would punish a shared office
 * connection (two partners of two firms behind one NAT); ten is a script. The
 * window is rolling, not calendar-day, so the count cannot be reset at
 * midnight.
 */
export const MAX_PRUEBAS_POR_IP = 3;
export const VENTANA_POR_IP_MS = 24 * 60 * 60 * 1000;

/**
 * Ten characters, longer than the eight `addUserToFirm` enforces: this
 * password is chosen by an anonymous visitor on a public form, where the
 * cheap dictionary attempts land.
 */
export const MIN_CONTRASENA = 10;

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * The two doors of the public form.
 *
 * PRUEBA opens seven dated days of Esencial. COMPRA opens the chosen plan
 * BORN EXPIRED: `plan_valid_until = now`, so the application starts in read
 * only with the red bar and the plan screen, and the first Wompi payment
 * activates the real period (the payment function starts the period at
 * GREATEST(now, plan_valid_until), which for a fresh firm is now). No new
 * state, no "pending payment" flag: an unpaid purchase IS an expired plan,
 * and everything that already enforces expiry enforces this.
 */
export type ModoDeRegistro = 'PRUEBA' | 'COMPRA';

export type PlanDeRegistro = 'ESENCIAL' | 'PREMIUM' | 'FIRMA';

export const esModoDeRegistro = (valor: unknown): valor is ModoDeRegistro =>
  valor === 'PRUEBA' || valor === 'COMPRA';

export const esPlanDeRegistro = (valor: unknown): valor is PlanDeRegistro =>
  valor === 'ESENCIAL' || valor === 'PREMIUM' || valor === 'FIRMA';

/**
 * A trial is only ever Esencial (the other plans are sold by payment, not
 * granted); a purchase may name any plan. Kept as one predicate so the
 * check and the validator agree on the single rule.
 */
export const combinacionPermitida = (modo: ModoDeRegistro, plan: PlanDeRegistro): boolean =>
  modo === 'COMPRA' || plan === PLAN_DE_PRUEBA;

export interface SolicitudDePrueba {
  /** Missing on the wire means PRUEBA: the original trial form never sent it. */
  modo: ModoDeRegistro;
  /** Missing on the wire means ESENCIAL, for the same reason. */
  plan: PlanDeRegistro;
  firma: string;
  nit: string;
  nombre: string;
  correo: string;
  contrasena: string;
  acepta: boolean;
  /**
   * Honeypot. The form renders this field hidden and empty; a person never
   * fills it, a form-filling bot fills everything. The field is called
   * `empresa` so the bot has a reason to write into it.
   */
  empresa: string;
}

export type SolicitudValida = Omit<SolicitudDePrueba, 'empresa' | 'acepta'>;

export type ResultadoDeValidacion =
  | { ok: true; datos: SolicitudValida }
  | { ok: false; codigo: 'HONEYPOT' | 'INVALID_INPUT' | 'INVALID_PLAN'; mensaje: string };

/**
 * Loose on purpose: one @, something on each side, a dot in the domain. Auth
 * is the authority on what an address is; this only refuses what could never
 * receive the welcome e-mail.
 */
const pareceCorreo = (valor: string): boolean => {
  const arroba = valor.indexOf('@');
  if (arroba <= 0 || arroba !== valor.lastIndexOf('@')) return false;
  const dominio = valor.slice(arroba + 1);
  return dominio.includes('.') && !dominio.startsWith('.') && !dominio.endsWith('.') && !/\s/.test(valor);
};

/** Reads the raw body into typed fields; nothing here throws. */
export const leerSolicitud = (body: unknown): SolicitudDePrueba => {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const texto = (v: unknown): string => (typeof v === 'string' ? v : '');
  const modoCrudo = texto(b.modo).trim().toUpperCase();
  const planCrudo = texto(b.plan).trim().toUpperCase();
  return {
    // An unknown value is kept as-is (cast) so the validator can refuse it by
    // name instead of silently turning "PREMIUN" into a trial.
    modo: (modoCrudo || 'PRUEBA') as ModoDeRegistro,
    plan: (planCrudo || PLAN_DE_PRUEBA) as PlanDeRegistro,
    firma: texto(b.firma).replace(/\s+/g, ' ').trim(),
    nit: texto(b.nit).trim(),
    nombre: texto(b.nombre).replace(/\s+/g, ' ').trim(),
    correo: texto(b.correo).trim().toLowerCase(),
    contrasena: texto(b.contrasena),
    acepta: b.acepta === true,
    empresa: texto(b.empresa)
  };
};

export const validarSolicitud = (s: SolicitudDePrueba): ResultadoDeValidacion => {
  /*
   * THE HONEYPOT ANSWERS LIKE A VALIDATION ERROR, NOT LIKE A DETECTION. Telling
   * a bot it was caught teaches it which field to leave blank; a generic 400
   * looks like any other rejected form.
   */
  if (s.empresa.trim() !== '') {
    return { ok: false, codigo: 'HONEYPOT', mensaje: 'No se pudo procesar la solicitud.' };
  }
  if (!esModoDeRegistro(s.modo) || !esPlanDeRegistro(s.plan)) {
    return { ok: false, codigo: 'INVALID_PLAN', mensaje: 'Elija un plan: Esencial, Premium o Firma.' };
  }
  if (!combinacionPermitida(s.modo, s.plan)) {
    return {
      ok: false,
      codigo: 'INVALID_PLAN',
      mensaje: 'La prueba gratuita es solo de Esencial. Premium y Firma se contratan con pago.'
    };
  }
  if (s.firma.length < 3 || s.firma.length > 120) {
    return {
      ok: false,
      codigo: 'INVALID_INPUT',
      mensaje: 'Escriba el nombre de la firma o del abogado (entre 3 y 120 caracteres).'
    };
  }
  if (s.nit && !/^[0-9.\-]{5,20}$/.test(s.nit)) {
    return { ok: false, codigo: 'INVALID_INPUT', mensaje: 'El NIT solo admite dígitos, puntos y guion. Puede dejarlo vacío.' };
  }
  if (s.nombre.length < 3 || s.nombre.length > 120 || !s.nombre.includes(' ')) {
    return { ok: false, codigo: 'INVALID_INPUT', mensaje: 'Escriba su nombre y su apellido.' };
  }
  if (!pareceCorreo(s.correo) || s.correo.length > 254) {
    return { ok: false, codigo: 'INVALID_INPUT', mensaje: 'Escriba un correo válido: es donde recibirá el acceso.' };
  }
  if (s.contrasena.length < MIN_CONTRASENA) {
    return {
      ok: false,
      codigo: 'INVALID_INPUT',
      mensaje: `La contraseña debe tener al menos ${MIN_CONTRASENA} caracteres.`
    };
  }
  if (!s.acepta) {
    return {
      ok: false,
      codigo: 'INVALID_INPUT',
      mensaje: 'Debe aceptar la política de tratamiento de datos para abrir la prueba.'
    };
  }
  return {
    ok: true,
    datos: {
      modo: s.modo,
      plan: s.plan,
      firma: s.firma,
      nit: s.nit,
      nombre: s.nombre,
      correo: s.correo,
      contrasena: s.contrasena
    }
  };
};

/** When a trial opened `ahora` ends: exactly seven days later, to the millisecond. */
export const vencimientoDePrueba = (ahora: Date): Date =>
  new Date(ahora.getTime() + DIAS_DE_PRUEBA_GRATUITA * MS_POR_DIA);

/** Whether one more sign-up from this address fits inside the rolling window. */
export const cabeOtraPruebaDesdeIp = (altasEnVentana: number): boolean =>
  altasEnVentana < MAX_PRUEBAS_POR_IP;

/** The oldest `created_at` that still counts against the address. */
export const inicioDeVentana = (ahora: Date): Date => new Date(ahora.getTime() - VENTANA_POR_IP_MS);
