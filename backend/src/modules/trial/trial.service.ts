import { supabase } from '../../config/supabase.config';
import { crearFirmaConAdministrador } from '../admin/admin.service';
import { AuthError, signIn, type Session } from '../auth/auth.service';
import { auditService } from '../audit/audit.service';
import { PLANES } from '../subscriptions/plan.catalog';
import { enviarBienvenida, enviarBienvenidaDeCompra } from './trial.mail';
import {
  DIAS_DE_PRUEBA_GRATUITA,
  MAX_PRUEBAS_POR_IP,
  PLAN_DE_PRUEBA,
  USUARIOS_DE_PRUEBA,
  cabeOtraPruebaDesdeIp,
  inicioDeVentana,
  type SolicitudValida
} from './trial.rules';

/**
 * The self-service trial of Esencial: seven days, one seat, no card.
 *
 * WHY THIS EXISTS NEXT TO "FIRMS ARE OPENED BY THE OPERATOR". That rule was
 * written against a public sign-up that gave a full tenant, forever, to
 * anyone. This door gives a dated Esencial plan with zero AI credit: after
 * seven days the existing expired-plan enforcement closes it, and every
 * model call needs a recharge the visitor pays for. The product's cost of a
 * trial that never converts is a row in `firms` and an account in Auth.
 *
 * WHAT LIMITS ABUSE, in the order it is checked:
 *   1. the honeypot and the field rules (`trial.rules.ts`, no I/O);
 *   2. three sign-ups per IP per rolling 24 h, counted in `trial_signups`
 *      because a serverless instance forgets — see the migration;
 *   3. one account per e-mail, which Supabase Auth already enforces and which
 *      surfaces here as 409 EMAIL_EXISTS with a "sign in instead" message.
 * No disposable-domain list: none exists in this repository and inventing
 * one would block real addresses while missing most throwaway ones.
 *
 * FAILS CLOSED WITHOUT ITS TABLE. If `trial_signups` cannot be read the trial
 * is refused with 503, not opened without a limit: the count IS the limit,
 * and a limit that silently disappears when a migration is pending is the
 * kind of gap a script finds before the owner does.
 */

const requireClient = () => {
  if (!supabase) {
    throw new AuthError('TRIAL_UNAVAILABLE', 'La prueba gratuita no está disponible por ahora.', 503);
  }
  return supabase;
};

const altasRecientesDesde = async (ip: string | null, ahora: Date): Promise<number> => {
  // Without a usable address there is nothing to count against; the honeypot
  // and the e-mail uniqueness still apply.
  if (!ip) return 0;

  const { count, error } = await requireClient()
    .from('trial_signups')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', inicioDeVentana(ahora).toISOString());

  if (error) {
    console.error(
      '[TRIAL] No se pudo contar las altas por dirección; la prueba se rechaza. ' +
        `Falta correr supabase/migration-prueba-gratuita.sql. Detalle: ${error.message}`
    );
    throw new AuthError('TRIAL_UNAVAILABLE', 'La prueba gratuita no está disponible por ahora.', 503);
  }
  return count ?? 0;
};

/**
 * UNA PRUEBA GRATUITA POR PERSONA, y la persona se reconoce por dos señales:
 * el correo con que la pidió y la dirección desde la que la pidió. Cualquiera
 * de las dos que ya tenga una prueba anotada cierra la puerta, sin ventana de
 * tiempo. El titular lo pidió así: quien ya probó, contrata. El precio conocido
 * es que dos colegas detrás de la misma salida de red comparten una sola
 * prueba; el segundo puede contratar, y la compra no se limita por esta regla.
 */
const pruebaYaUsada = async (correo: string, ip: string | null): Promise<boolean> => {
  const client = requireClient();
  const consulta = client.from('trial_signups').select('id', { count: 'exact', head: true }).eq('modo', 'PRUEBA');
  const { count, error } = await (ip ? consulta.or(`email.eq.${correo},ip.eq.${ip}`) : consulta.eq('email', correo));
  if (error) {
    console.error(
      '[TRIAL] No se pudo comprobar si la prueba ya se usó; la prueba se rechaza. ' +
        `Falta correr supabase/migration-prueba-gratuita.sql. Detalle: ${error.message}`
    );
    throw new AuthError('TRIAL_UNAVAILABLE', 'La prueba gratuita no está disponible por ahora.', 503);
  }
  return (count ?? 0) > 0;
};

/** Lo que oye quien intenta una segunda prueba: la misma frase para el correo repetido y para la dirección repetida. */
export const MENSAJE_PRUEBA_USADA = 'Ya usó su prueba gratuita. Puede contratar un plan o iniciar sesión.';

export interface PruebaAbierta {
  session: Session;
  firmId: string;
  venceEl: string;
  correoEnviado: boolean;
}

/**
 * One entry for both doors of the public form.
 *
 * COMPRA CREATES THE FIRM BORN EXPIRED (`diasDeVigencia: 0`, period MENSUAL as
 * a placeholder the first payment overwrites): the application opens in read
 * only with the plan screen in front, and the Wompi confirmation starts the
 * real period from now. No half-created account waits on a payment that may
 * never come, and no unpaid tenant ever gets a writable day — the same
 * expired-plan enforcement that closes a trial governs it from second one.
 *
 * The abuse limits are shared: a script that cannot open a fourth trial from
 * one address cannot open a fourth "purchase" either.
 */
export const registrarFirma = async (
  datos: SolicitudValida,
  ip: string | null
): Promise<PruebaAbierta> => {
  const ahora = new Date();
  const esCompra = datos.modo === 'COMPRA';
  const plan = esCompra ? datos.plan : PLAN_DE_PRUEBA;

  if (!esCompra && (await pruebaYaUsada(datos.correo, ip))) {
    throw new AuthError('TRIAL_ALREADY_USED', MENSAJE_PRUEBA_USADA, 409);
  }

  if (!cabeOtraPruebaDesdeIp(await altasRecientesDesde(ip, ahora))) {
    throw new AuthError(
      'TOO_MANY_TRIALS',
      `Desde esta conexión ya se abrieron ${MAX_PRUEBAS_POR_IP} pruebas en las últimas 24 horas. Si su firma ya tiene cuenta, inicie sesión; si no, escríbanos.`,
      429
    );
  }

  /*
   * The firm row is deleted if the account cannot be created — an anonymous
   * visitor typing an address that already has a cuenta must not leave an
   * empty tenant behind on every attempt. `addUserToFirm` maps the duplicate
   * to EMAIL_EXISTS (409); the controller rewords it to "inicie sesión".
   */
  const creada = await crearFirmaConAdministrador({
    firmName: datos.firma,
    nit: datos.nit,
    adminEmail: datos.correo,
    adminPassword: datos.contrasena,
    initialCredits: 0,
    plan,
    period: esCompra ? 'MENSUAL' : 'PRUEBA',
    diasDeVigencia: esCompra ? 0 : DIAS_DE_PRUEBA_GRATUITA,
    maxUsers: esCompra ? PLANES[plan].maxUsuarios : Math.min(USUARIOS_DE_PRUEBA, PLANES[plan].maxUsuarios),
    siFallaLaCuenta: 'BORRAR_FIRMA'
  });

  /*
   * Recorded right after the firm exists, before signing in or mailing: a
   * failure in either of those must not make this address look unused.
   */
  const { error: rastroError } = await requireClient()
    .from('trial_signups')
    .insert({ email: datos.correo, ip, firm_id: creada.firmId, modo: esCompra ? 'COMPRA' : 'PRUEBA' });
  if (rastroError) {
    console.error('[TRIAL] La prueba abrió pero no quedó anotada en trial_signups:', rastroError.message);
  }

  await auditService.record({
    firmId: creada.firmId,
    userEmail: datos.correo,
    action: esCompra ? 'REGISTRO_PARA_COMPRA' : 'TRIAL_STARTED',
    resource: esCompra
      ? `Cuenta creada desde la página pública para contratar ${PLANES[plan].nombre} · pendiente del primer pago · ${datos.nombre}`
      : `Prueba gratuita de ${PLANES[plan].nombre} · ${DIAS_DE_PRUEBA_GRATUITA} días · vence ${creada.validUntil} · ${datos.nombre}`,
    ipAddress: ip
  });

  // Same session shape as POST /api/auth/login, so the app opens directly.
  const session = await signIn(datos.correo, datos.contrasena);

  // Before responding, not after: a serverless function freezes on `res.json`.
  const correo = esCompra
    ? await enviarBienvenidaDeCompra({
        para: datos.correo,
        nombre: datos.nombre,
        firma: creada.firmName,
        plan
      })
    : await enviarBienvenida({
        para: datos.correo,
        nombre: datos.nombre,
        firma: creada.firmName,
        venceEl: creada.validUntil
      });

  return { session, firmId: creada.firmId, venceEl: creada.validUntil, correoEnviado: correo.enviado };
};
