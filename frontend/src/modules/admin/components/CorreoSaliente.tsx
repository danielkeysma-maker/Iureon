import React from 'react';
import { adminApi, type EstadoDelCorreo } from '../admin.api';
import { readSession } from '../../auth/session';

/**
 * El correo saliente de la plataforma, visto desde la consola de operación.
 * Cara nueva: derivada. El artboard de la consola no lo dibuja; toma la tarjeta
 * gris de notas y los avisos verde/ámbar de `app-dialogos-y-estados.html`.
 *
 * ─── POR QUÉ EXISTE ESTA TARJETA ────────────────────────────────────────────
 *
 * `GET /api/admin/mail/status` y `POST /api/admin/mail/test` estaban montadas y
 * NADIE las llamaba: la única forma de comprobar si el correo salía era provocar
 * un pago real. Hoy salen por aquí la bienvenida de una firma nueva y las
 * confirmaciones de pago, así que conviene poder probarlo sin gastar nada.
 *
 * ─── EL DESTINATARIO NO SE ELIGE, Y SE DICE ─────────────────────────────────
 *
 * El servidor toma la dirección del token de la sesión y no del cuerpo: un
 * endpoint que manda correos a quien le pidan es una herramienta de spam con el
 * remitente del titular. La pantalla lo dice para que nadie busque el campo.
 *
 * ─── EL ERROR SE ENSEÑA ENTERO ──────────────────────────────────────────────
 *
 * La diferencia entre una llave caducada y un dominio sin verificar está en el
 * texto del proveedor, y quien lee esta pantalla es quien puede arreglarlo.
 */

const mensajeDeError = (err: unknown, porDefecto: string): string =>
  err instanceof Error && err.message ? err.message : porDefecto;

export const CorreoSaliente: React.FC = () => {
  const [estado, setEstado] = React.useState<EstadoDelCorreo | null>(null);
  const [cargando, setCargando] = React.useState(true);
  /** Fallo al CONSULTAR el estado; distinto de un envío rechazado. */
  const [errorDeEstado, setErrorDeEstado] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);
  const [resultado, setResultado] = React.useState<{ enviado: boolean; detalle: string } | null>(null);

  /* La dirección de la sesión, del mismo sitio del que sale el token. */
  const correoDeLaSesion = readSession()?.user.email ?? null;

  React.useEffect(() => {
    let vigente = true;
    void (async () => {
      try {
        const r = await adminApi.estadoDelCorreo();
        if (!vigente) return;
        setEstado({ enabled: r.enabled, user: r.user, fromName: r.fromName });
        setErrorDeEstado('');
      } catch (err) {
        if (!vigente) return;
        setErrorDeEstado(mensajeDeError(err, 'No se pudo consultar el estado del correo saliente.'));
      } finally {
        if (vigente) setCargando(false);
      }
    })();
    return () => {
      vigente = false;
    };
  }, []);

  const enviarPrueba = async () => {
    setEnviando(true);
    setResultado(null);
    try {
      const r = await adminApi.enviarCorreoDePrueba();
      setResultado({ enviado: r.enviado, detalle: r.error ?? (r.enviado ? '' : 'El servidor no explicó por qué.') });
    } catch (err) {
      // Aquí solo caen el 400 sin correo en la sesión y las averías de red: el rechazo del proveedor ya viene como resultado.
      setResultado({ enviado: false, detalle: mensajeDeError(err, 'No se pudo enviar la prueba.') });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="cn-ope-nota cn-ope-correo" aria-labelledby="ope-correo">
      <h2 id="ope-correo" className="cn-ope-nota-titulo">
        Correo saliente
      </h2>
      <p className="cn-ope-texto">Por donde salen la bienvenida de una firma nueva y las confirmaciones de pago.</p>

      {cargando ? (
        <p className="cn-ope-texto">Comprobando la configuración…</p>
      ) : errorDeEstado ? (
        <p role="alert" className="cn-ope-error cn-ope-error--abajo">
          {errorDeEstado}
        </p>
      ) : estado?.enabled ? (
        <div className="cn-ope-aviso cn-ope-aviso--ok">
          <div className="cn-ope-aviso-texto">
            <p className="cn-ope-aviso-titulo">Hay correo saliente configurado.</p>
            {/* La dirección llega recortada por el servidor (`d***@dominio`) y se enseña así. */}
            <p>
              Sale desde <span className="cn-ope-mono">{estado.user ?? '—'}</span>, con el nombre «{estado.fromName}». La dirección
              viene enmascarada por el servidor.
            </p>
          </div>
        </div>
      ) : (
        <div className="cn-ope-aviso">
          <div className="cn-ope-aviso-texto">
            <p className="cn-ope-aviso-titulo">No hay correo saliente configurado.</p>
            <p>
              Sin él no salen la bienvenida ni las confirmaciones de pago: el pago se aplica igual y el saldo queda acreditado, pero
              la firma no recibe aviso.
            </p>
          </div>
        </div>
      )}

      <div className="cn-ope-correo-fila">
        <button
          type="button"
          onClick={() => void enviarPrueba()}
          disabled={enviando || cargando || estado?.enabled !== true}
          className="cn-ope-boton cn-ope-boton--suave"
        >
          {enviando ? 'Enviando…' : 'Enviar una prueba'}
        </button>
        <p className="cn-ope-texto">
          La prueba se envía a la dirección de su propia sesión
          {correoDeLaSesion ? (
            <>
              , <span className="cn-ope-principal">{correoDeLaSesion}</span>
            </>
          ) : null}
          . No se puede escoger destinatario.
        </p>
      </div>

      {resultado &&
        (resultado.enviado ? (
          <div role="status" className="cn-ope-aviso cn-ope-aviso--ok">
            <p className="cn-ope-aviso-texto">
              El proveedor aceptó el mensaje. Revise la bandeja de {correoDeLaSesion ?? 'su sesión'} — y también el correo no
              deseado, que es donde cae la primera prueba de un dominio recién configurado.
            </p>
          </div>
        ) : (
          <div role="alert" className="cn-ope-error">
            <p>No se envió.</p>
            {/* El texto del proveedor, tal cual: un «502» no se arregla, un «domain is not verified» sí. */}
            <p className="cn-ope-mono">{resultado.detalle}</p>
          </div>
        ))}
    </section>
  );
};
