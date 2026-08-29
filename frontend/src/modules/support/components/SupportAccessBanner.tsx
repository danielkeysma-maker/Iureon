import React from 'react';
import { Eye, ShieldAlert, X } from 'lucide-react';
import { supportApi, type EstadoConLecturas, type SupportAccess } from '../support.api';

/**
 * La franja de acceso de soporte. Artboard 8a.
 *
 * ─── POR QUÉ ES UNA FRANJA Y NO UNA NOTIFICACIÓN ────────────────────────────
 *
 * El artboard pide una banda permanente en el alto de la aplicación, y la
 * palabra que importa es PERMANENTE. Una notificación se descarta, y una vez
 * descartada la firma trabaja durante cuatro horas sin recordar que alguien de
 * fuera está mirando. Esta franja no se puede cerrar: se va cuando el acceso se
 * va, y no antes. Por eso empuja el contenido en vez de flotar sobre él — algo
 * que tapa se aprende a ignorar.
 *
 * ─── LA VE TODA LA FIRMA, LA CORTA SOLO EL SOCIO ────────────────────────────
 *
 * Cualquiera que trabaje aquí ve quién entró, con qué alcance y cuánto le
 * queda. Revocar es de quien puede: el servidor exige `FIRM_ADMIN` y esta
 * pantalla solo pinta el botón a quien lo tiene, para no ofrecer un poder que
 * al pulsarlo contestaría 403.
 *
 * ─── EL RELOJ SE DESCUENTA AQUÍ Y LA VERDAD SIGUE SIENDO DEL SERVIDOR ───────
 *
 * El minutero baja solo cada minuto para que el plazo se vea correr, pero
 * quien decide si el acceso vive es el servidor en cada consulta: el reloj del
 * navegador puede estar mal, y un acceso vencido que se siga pintando como vivo
 * asusta sin motivo, mientras que uno vivo pintado como muerto es peor todavía.
 * Por eso se relee cada treinta segundos y al volver a la pestaña.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · «El resumen final por correo llega siempre, incluso si la firma nunca abrió
 *   el panel». No hay infraestructura de correo en este backend, así que ese
 *   correo NO se envía. Lo que sí queda es el rastro completo en Auditoría —las
 *   cinco acciones y cada pantalla abierta—, que sobrevive a la sesión y se
 *   puede consultar mañana. Se dice aquí para que nadie suponga que salió.
 */

const CADA = 30_000;

const restanteLegible = (minutos: number): string => {
  if (minutos < 1) return 'menos de un minuto';
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

const hora = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

interface SupportAccessBannerProps {
  /** `true` cuando la sesión es de un socio administrador de la firma. */
  puedeDecidir: boolean;
  /*
   * Se llama con la solicitud ENTERA, no con su identificador: quien la abre
   * necesita el motivo, el alcance y la duración para decidir, y esta franja
   * ya los tiene. Pasar solo el id obligaría a pedirlos otra vez, y no hay
   * endpoint que devuelva una solicitud suelta — el diálogo se quedaría vacío.
   */
  onAbrirSolicitud: (solicitud: SupportAccess) => void;
  /** Sube el estado para que el resto de la aplicación no vuelva a pedirlo. */
  onEstado?: (estado: EstadoConLecturas | null) => void;
}

export const SupportAccessBanner: React.FC<SupportAccessBannerProps> = ({
  puedeDecidir,
  onAbrirSolicitud,
  onEstado
}) => {
  const [datos, setDatos] = React.useState<EstadoConLecturas | null>(null);
  const [minutos, setMinutos] = React.useState<number | null>(null);
  const [panelAbierto, setPanelAbierto] = React.useState(false);
  const [revocando, setRevocando] = React.useState(false);

  const releer = React.useCallback(() => {
    supportApi
      .estado()
      .then((d) => {
        setDatos(d);
        setMinutos(d.estado.minutosRestantes);
        onEstado?.(d);
      })
      .catch(() => {
        /*
         * Un fallo de red NO se pinta como «no hay acceso»: se conserva lo
         * último que dijo el servidor. Borrar la franja porque una consulta
         * falló apagaría el aviso justo mientras alguien está mirando.
         */
      });
  }, [onEstado]);

  React.useEffect(() => {
    releer();
    const t = window.setInterval(releer, CADA);
    const alVolver = () => {
      if (document.visibilityState === 'visible') releer();
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [releer]);

  /*
   * El minutero corre siempre y se protege dentro, no en las dependencias: una
   * expresión en el array de dependencias reinicia el intervalo cada vez que
   * cambia de valor, y el descuento se perdería justo al llegar a cero.
   */
  React.useEffect(() => {
    const t = window.setInterval(() => {
      setMinutos((m) => (m === null ? null : Math.max(0, m - 1)));
    }, 60_000);
    return () => window.clearInterval(t);
  }, []);

  const activo = datos?.estado.activo ?? null;
  const pendiente = datos?.estado.pendiente ?? null;

  const revocar = async () => {
    if (!activo) return;
    setRevocando(true);
    try {
      await supportApi.revocar(activo.id);
      releer();
    } finally {
      setRevocando(false);
    }
  };

  if (pendiente && !activo) {
    return (
      <div className="flex min-h-[34px] shrink-0 items-center gap-3 border-b border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] px-4 py-1.5">
        <ShieldAlert className="h-4 w-4 shrink-0 text-unverified" />
        <p className="min-w-0 flex-1 truncate text-[12.5px] text-unverified">
          <strong className="font-semibold">{pendiente.requestedBy}</strong> pide acceso temporal
          para ver <strong className="font-semibold">{pendiente.scope}</strong>. Nadie ha entrado.
        </p>
        {puedeDecidir ? (
          <button
            type="button"
            onClick={() => onAbrirSolicitud(pendiente)}
            className="shrink-0 rounded-input bg-surface px-3 py-1 text-[12px] font-semibold text-ink-900 shadow-sm hover:bg-canvas"
          >
            Leer la solicitud
          </button>
        ) : (
          <span className="shrink-0 text-[11.5px] text-unverified">
            Lo decide un socio administrador
          </span>
        )}
      </div>
    );
  }

  if (!activo) return null;

  return (
    <div className="shrink-0 border-b border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))]">
      <div className="flex min-h-[34px] items-center gap-3 px-4 py-1.5">
        <Eye className="h-4 w-4 shrink-0 text-unverified" />
        <p className="min-w-0 flex-1 truncate text-[12.5px] text-unverified">
          <strong className="font-semibold">{activo.requestedBy}</strong> está viendo{' '}
          <strong className="font-semibold">{activo.scope}</strong> en modo lectura ·{' '}
          {minutos === null ? 'sin plazo declarado' : `quedan ${restanteLegible(minutos)}`}
        </p>

        <button
          type="button"
          onClick={() => setPanelAbierto((v) => !v)}
          className="shrink-0 text-[12px] font-medium text-unverified underline underline-offset-2"
        >
          {panelAbierto ? 'Ocultar' : `Qué ha abierto (${datos?.lecturas.length ?? 0})`}
        </button>

        {puedeDecidir && (
          <button
            type="button"
            onClick={revocar}
            disabled={revocando}
            className="shrink-0 rounded-input bg-surface px-3 py-1 text-[12px] font-semibold text-ink-900 shadow-sm hover:bg-canvas disabled:opacity-60"
          >
            {revocando ? 'Revocando…' : 'Revocar ahora'}
          </button>
        )}
      </div>

      {panelAbierto && (
        <div className="border-t border-[rgb(var(--unverified-line))] px-4 py-2.5">
          {datos && datos.lecturas.length === 0 ? (
            <p className="text-[12px] text-unverified">
              No ha abierto nada todavía. El acceso está concedido, pero está vacío.
            </p>
          ) : (
            <ul className="max-h-40 space-y-1 overflow-y-auto">
              {datos?.lecturas.map((l) => (
                <li key={l.id} className="flex gap-3 text-[12px] text-unverified">
                  <span className="shrink-0 tabular-nums opacity-70">{hora(l.viewedAt)}</span>
                  <span className="min-w-0 flex-1">{l.resource}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-snug text-unverified opacity-80">
            <X className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="text-justify [text-wrap:pretty]">
              Esta lista se apaga con la sesión. Lo que queda para consultar mañana es Auditoría,
              donde cada una de estas pantallas está registrada con su hora. No se envía resumen
              por correo: este producto todavía no tiene correo saliente.
            </span>
          </p>
        </div>
      )}
    </div>
  );
};
