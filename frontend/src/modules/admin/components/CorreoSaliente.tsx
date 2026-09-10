import React from 'react';
import { AlertCircle, CheckCircle2, Mail, Send } from 'lucide-react';
import { adminApi, type EstadoDelCorreo } from '../admin.api';
import { readSession } from '../../auth/session';

/**
 * El correo saliente de la plataforma, visto desde la consola de operación.
 *
 * ─── POR QUÉ EXISTE ESTA TARJETA ────────────────────────────────────────────
 *
 * `GET /api/admin/mail/status` y `POST /api/admin/mail/test` llevaban tiempo
 * montadas en el servidor y NADIE las llamaba. Es el mismo defecto que ya
 * mordió antes aquí —la ficha de firma, la recarga con motivo—: un endpoint que
 * existe no prueba que exista quien lo invoque. Mientras tanto, la única forma
 * de comprobar si el correo salía de verdad era provocar un pago real y esperar
 * a ver si llegaba la confirmación.
 *
 * ─── EL DESTINATARIO NO SE ELIGE, Y SE DICE ─────────────────────────────────
 *
 * El servidor toma la dirección del token de la sesión y no del cuerpo, a
 * propósito: un endpoint que manda correos a quien le pidan es una herramienta
 * de spam con el remitente del titular. Aquí no hay campo de destinatario
 * porque no hay decisión que tomar, y la pantalla lo dice con esas palabras
 * para que nadie salga a buscar el campo que falta.
 *
 * ─── EL ERROR SE ENSEÑA ENTERO ──────────────────────────────────────────────
 *
 * Cuando el envío falla se muestra lo que respondió el proveedor, no un «no se
 * pudo enviar». La diferencia entre una llave caducada, un dominio sin
 * verificar y un puerto cerrado está en ese texto, y quien lee esta pantalla es
 * quien puede arreglarlo. Nunca se muestra la llave: el servidor no la manda y
 * la dirección llega ya enmascarada.
 */

const mensajeDeError = (err: unknown, porDefecto: string): string =>
  err instanceof Error && err.message ? err.message : porDefecto;

export const CorreoSaliente: React.FC = () => {
  const [estado, setEstado] = React.useState<EstadoDelCorreo | null>(null);
  const [cargando, setCargando] = React.useState(true);
  /** Fallo al CONSULTAR el estado; distinto de un envío rechazado. */
  const [errorDeEstado, setErrorDeEstado] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);
  const [resultado, setResultado] = React.useState<{ enviado: boolean; detalle: string } | null>(
    null
  );

  /*
   * La dirección de la sesión, leída del mismo sitio del que sale el token. No
   * se la pedimos al servidor: es la que este navegador ya tiene, y enseñarla
   * junto al botón es lo que convierte «enviar una prueba» en «enviármela a
   * mí». Si la sesión no la trajera, se dice en vez de dejar el hueco.
   */
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
      setResultado({
        enviado: r.enviado,
        detalle: r.error ?? (r.enviado ? '' : 'El servidor no explicó por qué.')
      });
    } catch (err) {
      // Aquí solo caen el 400 sin correo en la sesión y las averías de red: el
      // rechazo del proveedor ya viene como resultado desde `admin.api`.
      setResultado({ enviado: false, detalle: mensajeDeError(err, 'No se pudo enviar la prueba.') });
    } finally {
      setEnviando(false);
    }
  };

  /*
    `min-w-0` y `[overflow-wrap:anywhere]` en la raíz de la tarjeta: aquí vive
    una dirección de correo, que es UNA PALABRA SIN ESPACIOS y se pinta fuera de
    su caja sin agrandarla —`break-words` no la parte—, y también el texto crudo
    de un proveedor, que puede traer una URL larga.
  */
  return (
    <div className="min-w-0 bg-surface border border-line-200 rounded-card p-3 space-y-2.5 [overflow-wrap:anywhere] sm:p-4">
      <div className="flex min-w-0 items-center gap-2">
        <Mail className="w-4 h-4 shrink-0 text-brand-700" />
        <div className="min-w-0">
          <h3 className="font-bold text-ink-900 text-xs">Correo saliente</h3>
          <p className="text-[11px] text-ink-500">
            Por donde salen las confirmaciones de pago a las firmas.
          </p>
        </div>
      </div>

      {cargando ? (
        <p className="text-[11px] text-ink-500">Comprobando la configuración…</p>
      ) : errorDeEstado ? (
        <div className="flex items-start gap-2 rounded-card border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] p-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
          <p className="min-w-0 text-justify text-[11px] leading-snug text-danger [text-wrap:pretty]">
            {errorDeEstado}
          </p>
        </div>
      ) : estado?.enabled ? (
        <div className="flex items-start gap-2 rounded-card border border-[rgb(var(--verified-line))] bg-[rgb(var(--verified-surf))] p-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-verified" />
          <div className="min-w-0 text-[11px] leading-snug text-ink-900">
            <p className="font-semibold text-verified">Hay correo saliente configurado.</p>
            {/*
              La dirección llega recortada por el servidor (`d***@dominio`) y se
              enseña así: reconocer la cuenta es todo lo que hace falta para
              saber si sale de donde debe.
            */}
            <p className="mt-0.5 text-ink-700">
              Sale desde <b className="font-mono text-ink-900">{estado.user ?? '—'}</b>, con el
              nombre «{estado.fromName}». La dirección viene enmascarada por el servidor.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-card border border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] p-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-unverified" />
          <div className="min-w-0 text-[11px] leading-snug text-ink-900">
            <p className="font-semibold text-unverified">No hay correo saliente configurado.</p>
            <p className="mt-0.5 text-justify text-ink-700 [text-wrap:pretty]">
              Sin él no salen las confirmaciones de pago: el pago se aplica igual y el saldo queda
              acreditado, pero la firma no recibe aviso ni su cuenta de cobro.
            </p>
          </div>
        </div>
      )}

      {/*
        LA FILA ENVUELVE. El botón y la frase de destinatario suman más que 320px
        en una sola línea, y la frase lleva una dirección de correo: en una fila
        que no envolviera, el `overflow-hidden` del diálogo se comería el final.
      */}
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void enviarPrueba()}
          disabled={enviando || cargando || estado?.enabled !== true}
          className="shrink-0 px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-control text-[11px] font-semibold flex items-center gap-1.5 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          {enviando ? 'Enviando…' : 'Enviar una prueba'}
        </button>
        <p className="min-w-0 flex-1 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
          {/*
            Se nombra la dirección exacta para que no parezca que hay un
            destinatario que escoger: no lo hay, y el servidor lo impide.
          */}
          La prueba se envía a la dirección de tu propia sesión
          {correoDeLaSesion ? (
            <>
              , <b className="font-mono text-ink-700">{correoDeLaSesion}</b>
            </>
          ) : null}
          . No se puede escoger destinatario.
        </p>
      </div>

      {resultado &&
        (resultado.enviado ? (
          <div className="flex items-start gap-2 rounded-card border border-[rgb(var(--verified-line))] bg-[rgb(var(--verified-surf))] p-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-verified" />
            <p className="min-w-0 text-justify text-[11px] leading-snug text-ink-900 [text-wrap:pretty]">
              El proveedor aceptó el mensaje. Revisa la bandeja de{' '}
              <b className="font-mono">{correoDeLaSesion ?? 'tu sesión'}</b> — y también el correo
              no deseado, que es donde cae la primera prueba de un dominio recién configurado.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-2 rounded-card border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] p-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
            <div className="min-w-0 text-[11px] leading-snug text-ink-900">
              <p className="font-semibold text-danger">No se envió.</p>
              {/*
                El texto del proveedor, tal cual y en monoespaciada: un «502» no
                se arregla, un «domain is not verified» sí.
              */}
              <p className="mt-0.5 font-mono text-ink-700">{resultado.detalle}</p>
            </div>
          </div>
        ))}
    </div>
  );
};
