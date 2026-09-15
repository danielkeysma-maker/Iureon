import React from 'react';
import { Loader2 } from 'lucide-react';
import { supportApi, type EstadoConLecturas, type SupportAccess } from '../support.api';

/**
 * «Seguridad», dentro de Privacidad y seguridad. DERIVADA: el artboard
 * (`app-ajustes-y-plan.html`:80) titula la pantalla «Privacidad y seguridad»
 * pero no dibuja la mitad de seguridad. Se arma solo con lo que la aplicación
 * HACE hoy, cada frase con su respaldo en el código:
 *
 *  · El acceso de soporte (8a): se pide, lo decide un socio, caduca por cálculo
 *    y cada lectura queda en la auditoría (`supportAccess.*`, backend).
 *  · «Cerrar sesión» no llama a ningún `signOut`: cierra solo este navegador
 *    (`tenant/components/ConfirmarCierreDeSesion.tsx`).
 *  · Cambiar la contraseña con el enlace cierra TODAS las sesiones
 *    (`auth/recuperacion.service.ts`, `signOut(accessToken, 'global')`), y la
 *    solicitud y el cambio se anotan en la auditoría de la firma.
 *
 * Lo que NO se pinta, porque no existe: lista de sesiones o dispositivos,
 * segundo factor, ubicación de un inicio de sesión. Un interruptor que el
 * servidor no impone es peor que su ausencia (`app-administrar-y-saldo.html`:136
 * lo dice de sus propias omisiones).
 *
 * UN FALLO DE RED NO SE PINTA COMO «NO HAY ACCESO». Si no se pudo leer el
 * estado, se dice; «no hay acceso autorizado» es una afirmación que solo el
 * servidor puede hacer.
 *
 * Vive en `support` y no en `privacy` porque es el que llama a `support.api`;
 * la pantalla de privacidad lo compone.
 */

interface SeguridadDeLaFirmaProps {
  /** Decidir y retirar son de socios; el servidor lo impone igual. */
  puedeDecidir: boolean;
  onAbrirSolicitud?: (solicitud: SupportAccess) => void;
  /** Cambia cuando se decide la solicitud en el diálogo compartido, para volver a leer. */
  refresco?: number;
  onIrAuditoria?: () => void;
}

const horaDe = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—';

export const SeguridadDeLaFirma: React.FC<SeguridadDeLaFirmaProps> = ({ puedeDecidir, onAbrirSolicitud, refresco, onIrAuditoria }) => {
  const [datos, setDatos] = React.useState<EstadoConLecturas | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [retirando, setRetirando] = React.useState(false);

  const leer = React.useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await supportApi.estado());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el estado del acceso de soporte.');
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    void leer();
  }, [leer, refresco]);

  const retirar = async (id: string) => {
    setRetirando(true);
    setError(null);
    try {
      await supportApi.revocar(id);
      await leer();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo retirar el acceso.');
    } finally {
      setRetirando(false);
    }
  };

  const activo = datos?.estado.activo ?? null;
  const pendiente = datos?.estado.pendiente ?? null;

  return (
    <section className="cn-seg" aria-labelledby="cn-seg-titulo">
      <h2 id="cn-seg-titulo" className="cn-pri-h2">
        Seguridad
      </h2>
      <p className="cn-pri-parrafo">Quién más puede entrar a su material, y qué pasa con sus sesiones.</p>

      <div className="cn-seg-tarjeta">
        <p className="cn-seg-tarjeta-titulo">Acceso del equipo de Iureon a su material</p>

        {cargando && !datos && (
          <p className="cn-seg-texto" role="status">
            <Loader2 className="cn-seg-icono cn-seg-icono--girando" aria-hidden="true" />
            Leyendo el estado del acceso de soporte…
          </p>
        )}

        {error && (
          <div className="cn-seg-aviso" role="alert">
            <p className="cn-seg-texto">
              No se pudo leer el estado del acceso de soporte. {error}
            </p>
            <button type="button" onClick={() => void leer()} className="cn-seg-boton">
              Intentar de nuevo
            </button>
          </div>
        )}

        {datos && !error && activo && (
          <>
            <p className="cn-seg-texto cn-seg-texto--fuerte">Hay un acceso de soporte autorizado.</p>
            <p className="cn-seg-texto">
              Lo autorizó {activo.decidedBy ?? 'un socio de la firma'} · vence a las{' '}
              <span className="cn-seg-hora">{horaDe(activo.expiresAt)}</span>
              {datos.estado.minutosRestantes !== null && ` (quedan ${datos.estado.minutosRestantes} min)`}. Motivo: {activo.motive}
            </p>
            {datos.lecturas.length > 0 ? (
              <ul className="cn-seg-lista">
                {datos.lecturas.map((l) => (
                  <li key={l.id} className="cn-seg-lista-item">
                    <span className="cn-seg-hora">{horaDe(l.viewedAt)}</span>
                    <span className="cn-seg-texto">{l.resource}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cn-seg-texto">Todavía no ha abierto nada.</p>
            )}
            {puedeDecidir ? (
              <button type="button" onClick={() => void retirar(activo.id)} disabled={retirando} className="cn-seg-boton cn-seg-boton--peligro">
                {retirando ? 'Retirando…' : 'Retirar el acceso ahora'}
              </button>
            ) : (
              <p className="cn-seg-texto">Solo un socio administrador de la firma puede retirarlo.</p>
            )}
          </>
        )}

        {datos && !error && !activo && pendiente && (
          <>
            <p className="cn-seg-texto cn-seg-texto--fuerte">Operación pidió acceso a su material.</p>
            <p className="cn-seg-texto">Motivo: {pendiente.motive}</p>
            <p className="cn-seg-texto">No autorizar no afecta su servicio.</p>
            {puedeDecidir && onAbrirSolicitud ? (
              <button type="button" onClick={() => onAbrirSolicitud(pendiente)} className="cn-seg-boton">
                Revisar la solicitud
              </button>
            ) : (
              <p className="cn-seg-texto">La decide un socio administrador de la firma.</p>
            )}
          </>
        )}

        {datos && !error && !activo && !pendiente && (
          <p className="cn-seg-texto">
            No hay acceso de soporte autorizado ni pendiente. El equipo de Iureon no puede abrir su material sin que un
            socio de la firma lo autorice, por un tiempo fijo; cada pantalla que abra queda en la auditoría de la firma.
          </p>
        )}
      </div>

      <div className="cn-seg-tarjeta">
        <p className="cn-seg-tarjeta-titulo">Sesiones y contraseña</p>
        <ul className="cn-seg-puntos">
          <li className="cn-seg-texto">
            «Cerrar sesión» la cierra solo en este navegador; si entró desde otros dispositivos, allí sigue abierta.
          </li>
          <li className="cn-seg-texto">
            Cambiar la contraseña con el enlace del correo cierra la sesión en todos los dispositivos donde se entró con su
            correo.
          </li>
          <li className="cn-seg-texto">
            El enlace se pide en la pantalla de entrada, con «¿Olvidó su contraseña?». La solicitud y el cambio quedan en
            la auditoría de la firma.
          </li>
        </ul>
      </div>

      {onIrAuditoria && (
        <button type="button" onClick={onIrAuditoria} className="cn-seg-boton">
          Ver la auditoría de la firma
        </button>
      )}
    </section>
  );
};
