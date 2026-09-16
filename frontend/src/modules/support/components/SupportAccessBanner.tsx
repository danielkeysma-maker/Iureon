import React from 'react';
import { Eye, ShieldAlert } from 'lucide-react';
import { supportApi, type EstadoConLecturas, type SupportAccess } from '../support.api';

/**
 * La franja de acceso de soporte. Artboard 8a.
 *
 * ─── LA CARA NUEVA, DERIVADA ────────────────────────────────────────────────
 *
 * Ningún `public/handoff/app-*.html` dibuja esta franja con la cara nueva. Se
 * deriva de los avisos ya construidos (`cn-ini-fallo`, las franjas de
 * Audiencias): fondo ámbar suave con tinta ámbar, letra de 14 px como mínimo
 * —antes iba en 12— y botones de 44 px. Sin trazo discontinuo: aquí nada está
 * «sin verificar», está pasando. En el teléfono el texto envuelve en vez de
 * cortarse con puntos suspensivos: quién mira y qué mira no se puede truncar.
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
 *   el panel». Ese resumen NO se envía. Lo que sí queda es el rastro completo
 *   en Auditoría —las cinco acciones y cada pantalla abierta—, que sobrevive a
 *   la sesión y se puede consultar mañana. Se dice aquí para que nadie suponga
 *   que salió.
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
  const [errorAlRevocar, setErrorAlRevocar] = React.useState('');
  const idPanel = React.useId();

  const releer = React.useCallback(() => {
    supportApi
      .estado()
      .then((d) => {
        /*
         * UNA RESPUESTA MALFORMADA NO PUEDE TUMBAR LA APLICACION. Esto se leia
         * sin comprobar la forma, y `d.estado` ausente lanzaba durante el
         * render: no una franja rota, sino la pantalla entera en blanco. Si lo
         * que llega no trae `estado`, se conserva lo ultimo que dijo el
         * servidor, igual que con un fallo de red.
         */
        if (!d || typeof d !== 'object' || !d.estado || typeof d.estado !== 'object') return;
        setDatos({ ...d, lecturas: Array.isArray(d.lecturas) ? d.lecturas : [] });
        setMinutos(typeof d.estado.minutosRestantes === 'number' ? d.estado.minutosRestantes : null);
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

  const activo = datos?.estado?.activo ?? null;
  const pendiente = datos?.estado?.pendiente ?? null;

  const revocar = async () => {
    if (!activo) return;
    setRevocando(true);
    setErrorAlRevocar('');
    try {
      await supportApi.revocar(activo.id);
      releer();
    } catch (e: unknown) {
      /* Si la revocación no llegó, se dice: el acceso SIGUE abierto, y creer lo contrario es lo peligroso. */
      setErrorAlRevocar(
        `${e instanceof Error ? e.message : 'No se pudo revocar.'} El acceso sigue abierto.`
      );
    } finally {
      setRevocando(false);
    }
  };

  if (pendiente && !activo) {
    return (
      <div className="cara-nueva cn-sop-franja" role="status">
        <div className="cn-sop-franja-fila">
          <ShieldAlert className="cn-sop-franja-icono" aria-hidden="true" />
          <p className="cn-sop-franja-texto">
            <strong>{pendiente.requestedBy}</strong> pide acceso temporal para ver{' '}
            <strong>{pendiente.scope}</strong>. Nadie ha entrado.
          </p>
          {puedeDecidir ? (
            <button
              type="button"
              onClick={() => onAbrirSolicitud(pendiente)}
              className="cn-sop-franja-boton"
            >
              Leer la solicitud
            </button>
          ) : (
            <span className="cn-sop-franja-quien">Lo decide un socio administrador</span>
          )}
        </div>
      </div>
    );
  }

  if (!activo) return null;

  return (
    <div className="cara-nueva cn-sop-franja" role="status">
      <div className="cn-sop-franja-fila">
        <Eye className="cn-sop-franja-icono" aria-hidden="true" />
        <p className="cn-sop-franja-texto">
          <strong>{activo.requestedBy}</strong> está viendo <strong>{activo.scope}</strong> en modo
          lectura · {minutos === null ? 'sin plazo declarado' : `quedan ${restanteLegible(minutos)}`}
        </p>

        <div className="cn-sop-franja-acciones">
          <button
            type="button"
            onClick={() => setPanelAbierto((v) => !v)}
            aria-expanded={panelAbierto}
            aria-controls={idPanel}
            className="cn-sop-franja-boton cn-sop-franja-boton--texto"
          >
            {panelAbierto ? 'Ocultar lo que ha abierto' : `Qué ha abierto (${datos?.lecturas.length ?? 0})`}
          </button>

          {puedeDecidir && (
            <button
              type="button"
              onClick={revocar}
              disabled={revocando}
              className="cn-sop-franja-boton"
            >
              {revocando ? 'Revocando…' : 'Revocar ahora'}
            </button>
          )}
        </div>
      </div>

      {errorAlRevocar && (
        <p className="cn-sop-franja-error" role="alert">
          {errorAlRevocar}
        </p>
      )}

      {panelAbierto && (
        <div id={idPanel} className="cn-sop-franja-panel">
          {datos && (datos.lecturas?.length ?? 0) === 0 ? (
            <p className="cn-sop-franja-nota">
              No ha abierto nada todavía. El acceso está concedido, pero está vacío.
            </p>
          ) : (
            <ul className="cn-sop-franja-lecturas">
              {datos?.lecturas.map((l) => (
                <li key={l.id}>
                  <time className="cn-sop-mono" dateTime={l.viewedAt}>
                    {hora(l.viewedAt)}
                  </time>
                  <span>{l.resource}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="cn-sop-franja-nota">
            Esta lista se apaga con la sesión. Lo que queda para consultar mañana es Auditoría, donde
            cada una de estas pantallas está registrada con su hora. No se envía un resumen de este
            acceso: queda solo en Auditoría.
          </p>
        </div>
      )}
    </div>
  );
};
