import type { User } from '@supabase/supabase-js';
import { config } from '../../config/env.config';
import { clienteDeAuthEfimero, supabase, supabaseAuth } from '../../config/supabase.config';
import { auditService } from '../audit/audit.service';
import { correoDeRecuperacion } from '../mail/recuperacion.mail';
import { AuthError, olvidarSesionesDe } from './auth.service';
import {
  MENSAJE_ENLACE_INVALIDO,
  MENSAJE_NO_DISPONIBLE,
  MINUTOS_DE_VIGENCIA_DEL_ENLACE,
  VENTANA_POR_CORREO_MS,
  VENTANA_POR_IP_MS,
  baseDelEnlace,
  clasificarFalloAlGuardar,
  clasificarFalloDelEnlace,
  correoNormalizado,
  decidirLimite,
  describirError,
  enlaceDeRestablecimiento,
  esFalloDeTransporte,
  esSesionDeRecuperacion,
  firmaDeLaCuenta,
  huella,
  huellaCorta,
  motivoParaNoEnviar,
  validarContrasenaNueva
} from './recuperacion.rules';

/**
 * RECUPERAR LA CONTRASEÑA POR CORREO: PEDIR EL ENLACE Y CANJEARLO.
 *
 * Las decisiones —límite, lista de sitios, forma del enlace, qué cuenta no
 * recibe nada, qué error es cuál— viven en `recuperacion.rules.ts`. Aquí solo
 * se habla con Supabase, con la tabla del límite y con el correo.
 *
 * ─── EL REGISTRO DEL SERVIDOR NUNCA LLEVA EL CORREO ────────────────────────
 *
 * Cada línea `[RECUPERACION]` identifica el caso por los doce primeros
 * caracteres de la huella HMAC del correo. Con eso el operador sigue una
 * solicitud de punta a punta sin que el registro de Vercel se convierta en una
 * lista de direcciones con la marca «tiene cuenta» al lado.
 */

const TABLA = 'password_recovery_requests';

/** Un día: las filas más viejas ya no cuentan para ninguna ventana. */
const CONSERVAR_MS = 24 * 60 * 60 * 1000;

const noDisponible = (): AuthError => new AuthError('RECUPERACION_NO_DISPONIBLE', MENSAJE_NO_DISPONIBLE, 503);

const contarDesde = async (columna: 'email_hash' | 'ip_hash', valor: string, ventanaMs: number, ahora: Date) => {
  const { count, error } = await supabase!
    .from(TABLA)
    .select('id', { count: 'exact', head: true })
    .eq(columna, valor)
    .gte('created_at', new Date(ahora.getTime() - ventanaMs).toISOString());

  if (error) {
    console.error(
      '[RECUPERACION] No se pudo contar las solicitudes; no se envía nada. ' +
        `¿Falta correr supabase/migration-recuperacion-limite.sql? Detalle: ${error.message}`
    );
    throw noDisponible();
  }
  return count ?? 0;
};

export interface SolicitudDeRecuperacion {
  correo: unknown;
  ip: string | null;
  /** La cabecera `Origin`: decide a qué sitio de la lista lleva el enlace. */
  origen?: string;
}

/**
 * `POST /api/auth/recuperar`. Resuelve SIN VALOR en todos los desenlaces que
 * dependen de la cuenta: exista o no, esté desactivada o se haya alcanzado el
 * límite de ese correo. Lanza solo lo que NO depende de la cuenta: formato del
 * correo (400), límite por IP (429) y servicio no disponible (503).
 */
export const solicitarRecuperacion = async (s: SolicitudDeRecuperacion): Promise<void> => {
  const correo = correoNormalizado(s.correo);
  if (!correo) throw new AuthError('CORREO_INVALIDO', 'Escriba un correo válido.', 400);

  /*
   * Sin base o sin correo saliente no hay nada que hacer, y decirlo no delata
   * a nadie: se comprueba ANTES de buscar la cuenta, igual para todos.
   */
  if (!supabase) throw noDisponible();
  if (!config.mail.enabled) {
    console.error('[RECUPERACION] Correo saliente apagado: no se puede enviar el enlace. Configure RESEND_API_KEY y MAIL_FROM.');
    throw noDisponible();
  }

  const llave = config.supabase.serviceKey;
  const ahora = new Date();
  const huellaCorreo = huella(correo, llave, 'correo');
  const huellaIp = s.ip ? huella(s.ip, llave, 'ip') : null;
  const caso = huellaCorta(huellaCorreo);

  const [porCorreo, porIp] = await Promise.all([
    contarDesde('email_hash', huellaCorreo, VENTANA_POR_CORREO_MS, ahora),
    huellaIp ? contarDesde('ip_hash', huellaIp, VENTANA_POR_IP_MS, ahora) : Promise.resolve(0)
  ]);

  const decision = decidirLimite({ porCorreo, porIp });

  if (decision === 'LIMITE_IP') {
    console.warn(`[RECUPERACION] ${caso} rechazada: límite por dirección IP (${porIp} en la ventana).`);
    throw new AuthError(
      'DEMASIADAS_SOLICITUDES',
      'Demasiadas solicitudes desde esta conexión. Espere una hora y vuelva a intentarlo, o pídale a un socio administrador de su firma que le ponga una contraseña nueva.',
      429
    );
  }

  /*
   * Se anota ANTES de buscar la cuenta, y también cuando el correo ya llegó a
   * su límite: el conteo es de solicitudes, no de envíos. La limpieza de filas
   * viejas va en la misma pasada, para no depender de un trabajo programado.
   */
  const [{ error: anotarError }, { error: limpiarError }] = await Promise.all([
    supabase.from(TABLA).insert({ email_hash: huellaCorreo, ip_hash: huellaIp }),
    supabase.from(TABLA).delete().lt('created_at', new Date(ahora.getTime() - CONSERVAR_MS).toISOString())
  ]);
  if (anotarError) console.error(`[RECUPERACION] ${caso} no quedó anotada en ${TABLA}: ${anotarError.message}`);
  if (limpiarError) console.error(`[RECUPERACION] No se pudieron borrar las filas viejas de ${TABLA}: ${limpiarError.message}`);

  if (decision === 'LIMITE_CORREO') {
    console.warn(`[RECUPERACION] ${caso} sin envío: límite por correo (${porCorreo} en la ventana).`);
    return;
  }

  const base = baseDelEnlace(s.origen, { desarrollo: !process.env.VERCEL });

  /*
   * `generateLink` busca la cuenta, crea el token de recuperación (invalidando
   * el anterior) y NO ENVÍA NADA. Para un correo sin cuenta responde
   * `user_not_found`: no hace falta listar las cuentas para saberlo.
   */
  let generado: Awaited<ReturnType<typeof supabase.auth.admin.generateLink>>;
  try {
    generado = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: correo,
      /* La lista de redirecciones de Supabase admite `/**`: `/restablecer` ya cabe. */
      options: { redirectTo: `${base}/restablecer` }
    });
  } catch (err) {
    console.error(`[RECUPERACION] ${caso} no se pudo generar el enlace: ${describirError(err)}`);
    throw noDisponible();
  }

  if (generado.error) {
    // Un Supabase caído falla igual con cuenta que sin ella: decirlo no delata.
    if (esFalloDeTransporte(generado.error)) {
      console.error(`[RECUPERACION] ${caso} Supabase no respondió: ${describirError(generado.error)}`);
      throw noDisponible();
    }
    console.info(`[RECUPERACION] ${caso} sin envío: ${describirError(generado.error)}`);
    return;
  }

  /*
   * DE AQUÍ EN ADELANTE LA CUENTA EXISTE, y nada puede salir hacia quien pide:
   * ni un error ni un 503. Cualquier tropiezo se registra y se responde lo
   * neutral, o la diferencia entre respuestas volvería a delatar la cuenta.
   */
  try {
    const cuenta = generado.data.user;
    const tokenHash = generado.data.properties?.hashed_token;
    const firmId = firmaDeLaCuenta(cuenta);
    const motivo = motivoParaNoEnviar(cuenta, ahora);

    if (motivo || !tokenHash) {
      console.warn(`[RECUPERACION] ${caso} sin envío: ${motivo ?? 'Supabase no devolvió el token'}.`);
      if (firmId && motivo === 'CUENTA_DESACTIVADA') {
        await auditService.record({
          firmId,
          userEmail: cuenta.email ?? correo,
          action: 'CONTRASENA_RECUPERACION_SOLICITADA',
          resource: 'Se pidió un enlace para restablecer la contraseña; no se envió porque el usuario está desactivado',
          ipAddress: s.ip
        });
      }
      return;
    }

    const envio = await correoDeRecuperacion({
      para: cuenta.email ?? correo,
      enlace: enlaceDeRestablecimiento(base, tokenHash),
      minutos: MINUTOS_DE_VIGENCIA_DEL_ENLACE
    });

    if (!envio.enviado) console.error(`[RECUPERACION] ${caso} el correo no salió: ${envio.error ?? 'sin detalle'}`);
    else console.info(`[RECUPERACION] ${caso} enlace enviado.`);

    if (firmId) {
      await auditService.record({
        firmId,
        userEmail: cuenta.email ?? correo,
        action: 'CONTRASENA_RECUPERACION_SOLICITADA',
        resource: envio.enviado
          ? `Se pidió un enlace para restablecer la contraseña; enviado, vence en ${MINUTOS_DE_VIGENCIA_DEL_ENLACE} minutos`
          : 'Se pidió un enlace para restablecer la contraseña; el correo no salió',
        ipAddress: s.ip
      });
    }
  } catch (err) {
    console.error(`[RECUPERACION] ${caso} fallo después de generar el enlace: ${describirError(err)}`);
  }
};

export interface CanjeDeEnlace {
  /** El `token_hash` del enlace del correo de Iureon. */
  tokenHash?: string;
  /** La vía de respaldo: el `access_token` de una redirección de Supabase. */
  accessToken?: string;
  contrasena: unknown;
  ip: string | null;
}

const fallar = (f: { status: number; codigo: string; mensaje: string }): AuthError =>
  new AuthError(f.codigo, f.mensaje, f.status);

/** Canjea el enlace del correo. Devuelve la sesión de recuperación y su usuario. */
const canjearTokenHash = async (tokenHash: string): Promise<{ accessToken: string; usuario: User }> => {
  const cliente = clienteDeAuthEfimero();
  if (!cliente) throw noDisponible();

  let respuesta: Awaited<ReturnType<typeof cliente.auth.verifyOtp>>;
  try {
    respuesta = await cliente.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
  } catch (err) {
    console.warn(`[RECUPERACION] Canje no concedido: ${describirError(err)}`);
    throw fallar(clasificarFalloDelEnlace(err));
  }

  const { data, error } = respuesta;
  if (error || !data.session || !data.user) {
    console.warn(`[RECUPERACION] Canje no concedido: ${describirError(error)}`);
    throw fallar(clasificarFalloDelEnlace(error ?? { status: 400 }));
  }
  return { accessToken: data.session.access_token, usuario: data.user };
};

/** La vía de respaldo: una sesión que Supabase entregó al redirigir desde su propio enlace. */
const aceptarSesionDeRecuperacion = async (accessToken: string): Promise<{ accessToken: string; usuario: User }> => {
  if (!supabaseAuth) throw noDisponible();

  let respuesta: Awaited<ReturnType<typeof supabaseAuth.auth.getUser>>;
  try {
    respuesta = await supabaseAuth.auth.getUser(accessToken);
  } catch (err) {
    throw fallar(clasificarFalloDelEnlace(err));
  }
  if (respuesta.error || !respuesta.data.user) {
    console.warn(`[RECUPERACION] Sesión de respaldo rechazada: ${describirError(respuesta.error)}`);
    throw fallar(clasificarFalloDelEnlace(respuesta.error ?? { status: 401 }));
  }

  // Firma comprobada por `getUser`; ahora, que sea de recuperación y reciente.
  if (!esSesionDeRecuperacion(accessToken, Date.now())) {
    console.warn('[RECUPERACION] Sesión de respaldo rechazada: no nació de un enlace de recuperación reciente.');
    throw new AuthError('ENLACE_INVALIDO', MENSAJE_ENLACE_INVALIDO, 410);
  }
  return { accessToken, usuario: respuesta.data.user };
};

/**
 * `POST /api/auth/restablecer`.
 *
 * EL ORDEN IMPORTA:
 *  1. La regla de la contraseña, ANTES de canjear: un enlace se gasta al
 *     canjearse, y gastarlo en una contraseña de seis letras obligaría a pedir
 *     otro por un error que se podía decir gratis.
 *  2. El canje: prueba que quien llama abrió el correo, y que la sesión es de
 *     recuperación por construcción.
 *  3. La cuenta: desactivada o sin firma no cambia nada.
 *  4. La contraseña.
 *  5. Cerrar TODAS las sesiones (`global`) con el token de recuperación, y
 *     olvidar las recordadas en esta instancia (`olvidarSesionesDe`).
 *  6. La auditoría de la firma.
 */
export const restablecerContrasena = async (c: CanjeDeEnlace): Promise<{ sesionesCerradas: boolean }> => {
  const validacion = validarContrasenaNueva(c.contrasena);
  if (!validacion.ok) throw new AuthError('CONTRASENA_INVALIDA', validacion.mensaje, 400);

  if (!supabase) throw noDisponible();

  const { accessToken, usuario } = c.tokenHash
    ? await canjearTokenHash(c.tokenHash)
    : c.accessToken
      ? await aceptarSesionDeRecuperacion(c.accessToken)
      : (() => {
          throw new AuthError('FALTA_ENLACE', 'Abra el enlace que le llegó al correo.', 400);
        })();

  const motivo = motivoParaNoEnviar(usuario, new Date());
  if (motivo) {
    console.warn(`[RECUPERACION] Restablecimiento negado: ${motivo}.`);
    throw new AuthError('ENLACE_INVALIDO', MENSAJE_ENLACE_INVALIDO, 410);
  }

  let guardado: Awaited<ReturnType<typeof supabase.auth.admin.updateUserById>>;
  try {
    guardado = await supabase.auth.admin.updateUserById(usuario.id, { password: validacion.contrasena });
  } catch (err) {
    console.error(`[RECUPERACION] No se guardó la contraseña: ${describirError(err)}`);
    throw fallar(clasificarFalloAlGuardar(err));
  }
  if (guardado.error) {
    console.error(`[RECUPERACION] No se guardó la contraseña: ${describirError(guardado.error)}`);
    throw fallar(clasificarFalloAlGuardar(guardado.error));
  }

  /*
   * CERRAR TODAS LAS SESIONES. `global` revoca los tokens de refresco de todas
   * las sesiones del usuario, incluida la de recuperación que se acaba de usar.
   * Se intenta dos veces: la contraseña YA cambió, y dejar abierta la sesión de
   * quien la robó es justo lo que la persona vino a impedir. Si aun así falla,
   * se dice en la respuesta en vez de afirmar que se cerraron.
   */
  let sesionesCerradas = false;
  for (let intento = 1; intento <= 2 && !sesionesCerradas; intento += 1) {
    try {
      const { error } = await supabase.auth.admin.signOut(accessToken, 'global');
      if (error) console.error(`[RECUPERACION] Cierre de sesiones, intento ${intento}: ${describirError(error)}`);
      else sesionesCerradas = true;
    } catch (err) {
      console.error(`[RECUPERACION] Cierre de sesiones, intento ${intento}: ${describirError(err)}`);
    }
  }

  // Las sesiones recordadas 60 s en esta instancia (ver sesionesVerificadas.ts).
  olvidarSesionesDe(usuario.id);

  const firmId = firmaDeLaCuenta(usuario);
  if (firmId) {
    await auditService.record({
      firmId,
      userEmail: usuario.email ?? '',
      action: 'CONTRASENA_RESTABLECIDA',
      resource: sesionesCerradas
        ? 'Contraseña restablecida con el enlace del correo; se cerraron todas las sesiones'
        : 'Contraseña restablecida con el enlace del correo; NO se pudieron cerrar las demás sesiones',
      ipAddress: c.ip
    });
  }

  return { sesionesCerradas };
};
