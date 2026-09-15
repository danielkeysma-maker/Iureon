import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { IureonMark } from './IureonMark';
import { authApi } from '../../auth/auth.api';
import { ApiError } from '../../../config/httpClient';
import { clearSession } from '../../auth/session';
import { MIN_CONTRASENA, problemaDeContrasenaNueva } from '../../auth/contrasena';
import {
  MINUTOS_DE_VIGENCIA_DEL_ENLACE,
  descartarEnlaceDeRecuperacion,
  type EnlaceDeRecuperacion
} from '../../auth/enlaceDeRecuperacion';
import '../../../design/cara-nueva.css';

interface RestablecerContrasenaViewProps {
  /** Ya leído y ya borrado de la barra de direcciones (`capturarEnlaceDeRecuperacion`). */
  enlace: EnlaceDeRecuperacion;
}

type Estado = 'FORMULARIO' | 'VENCIDO' | 'LISTO';

/** Códigos del servidor que significan «este enlace ya no sirve, pida otro». */
const CODIGOS_DE_ENLACE_GASTADO = new Set(['ENLACE_INVALIDO', 'CONTRASENA_RECHAZADA', 'CONTRASENA_NO_GUARDADA', 'FALTA_ENLACE']);

/**
 * PONER LA CONTRASEÑA NUEVA DESDE EL ENLACE DEL CORREO.
 *
 * Marco «Ponga una contraseña nueva» y «Enlace vencido» de
 * `public/handoff/app-entrada-y-sesion.html`; «Contraseña actualizada» y el
 * móvil 375 se derivan de «Entrar» con las mismas piezas.
 *
 * LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, CON LA RAZÓN:
 * - «Para camila.restrepo@sufirma.co». El correo solo se conoce al CANJEAR el
 *   enlace, y canjearlo al abrir la página lo gastaría: el filtro de correo
 *   que abre los enlaces antes que la persona se lo llevaría. Se canjea al
 *   guardar, así que antes no hay correo que mostrar.
 * - «Guardar y entrar». No se entra: al guardar se cierran TODAS las sesiones
 *   de esa cuenta, y abrir una nueva en el mismo gesto dejaría a quien tenga
 *   este enlace dentro de la cuenta sin haber escrito nunca la contraseña para
 *   entrar. Se guarda, se confirma y se entra desde «Entrar».
 */
export const RestablecerContrasenaView: React.FC<RestablecerContrasenaViewProps> = ({ enlace }) => {
  const [estado, setEstado] = useState<Estado>(enlace.tipo === 'VENCIDO' ? 'VENCIDO' : 'FORMULARIO');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [verContrasena, setVerContrasena] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [motivoDelVencido, setMotivoDelVencido] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [sesionesCerradas, setSesionesCerradas] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const problema = problemaDeContrasenaNueva(contrasena, confirmacion);
    if (problema) {
      setErrorMsg(problema);
      return;
    }
    if (enlace.tipo === 'VENCIDO') return;

    setGuardando(true);
    try {
      const respuesta = await authApi.restablecer(enlace, contrasena);
      descartarEnlaceDeRecuperacion();
      // La sesión que este navegador tuviera ya no vale: se cerraron todas.
      clearSession();
      setSesionesCerradas(respuesta.sesionesCerradas !== false);
      setEstado('LISTO');
    } catch (err) {
      if (err instanceof ApiError && (err.status === 410 || (err.code && CODIGOS_DE_ENLACE_GASTADO.has(err.code)))) {
        descartarEnlaceDeRecuperacion();
        setMotivoDelVencido(err.code === 'ENLACE_INVALIDO' ? '' : err.message);
        setEstado('VENCIDO');
      } else {
        setErrorMsg(
          err instanceof ApiError
            ? err.message
            : 'No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.'
        );
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="cara-nueva cara-nueva--pagina">
      <main className="cn-columna cn-columna--sola">
        <div className="cn-columna-cuerpo">
          <div className="cn-marca">
            <IureonMark size={24} />
            <span>IUREON</span>
          </div>

          {estado === 'FORMULARIO' && (
            <>
              <h1 className="cn-titulo">Ponga una contraseña nueva</h1>
              <p className="cn-bajada">Elija una que solo usted sepa.</p>

              <form id="form-restablecer" onSubmit={handleSubmit} className="cn-campos">
                <div>
                  <label htmlFor="clave-nueva" className="cn-etiqueta">
                    Nueva contraseña
                  </label>
                  <div className="cn-con-boton">
                    <input
                      id="clave-nueva"
                      type={verContrasena ? 'text' : 'password'}
                      value={contrasena}
                      onChange={(e) => setContrasena(e.target.value)}
                      placeholder={`Mínimo ${MIN_CONTRASENA} caracteres`}
                      autoComplete="new-password"
                      minLength={MIN_CONTRASENA}
                      className="cn-campo cn-campo--clave"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setVerContrasena((v) => !v)}
                      aria-label={verContrasena ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                      className="cn-ver-clave"
                    >
                      {verContrasena ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="clave-confirmar" className="cn-etiqueta">
                    Otra vez, para confirmar
                  </label>
                  <input
                    id="clave-confirmar"
                    type={verContrasena ? 'text' : 'password'}
                    value={confirmacion}
                    onChange={(e) => setConfirmacion(e.target.value)}
                    placeholder="••••••••••"
                    autoComplete="new-password"
                    className="cn-campo"
                    required
                  />
                </div>

                {errorMsg && (
                  <div role="alert" className="cn-error">
                    <AlertCircle size={18} aria-hidden="true" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </form>

              <div className="cn-pie-accion">
                <button type="submit" form="form-restablecer" disabled={guardando} className="cn-boton h-solid">
                  {guardando ? 'Guardando…' : 'Guardar la contraseña'}
                </button>
              </div>

              <p className="cn-ayuda" style={{ marginTop: 16 }}>
                Al guardarla se cierran todas las sesiones abiertas con su correo, también la de este dispositivo.
              </p>
            </>
          )}

          {estado === 'VENCIDO' && (
            <div role="status">
              <span className="cn-rotulo-estado">ENLACE VENCIDO</span>
              <h1 className="cn-titulo">Este enlace ya no sirve</h1>
              <p className="cn-bajada">
                {motivoDelVencido ||
                  `Los enlaces vencen a los ${MINUTOS_DE_VIGENCIA_DEL_ENLACE} minutos y solo se usan una vez. Pida otro, o pídale a un socio administrador de su firma que le ponga una contraseña nueva.`}
              </p>
              <a href="/recuperar" className="cn-boton-sec h-soft">
                Pedir otro enlace
              </a>
            </div>
          )}

          {estado === 'LISTO' && (
            <div role="status">
              <span className="cn-rotulo-estado cn-rotulo-estado--ok">CONTRASEÑA ACTUALIZADA</span>
              <h1 className="cn-titulo">Su contraseña cambió</h1>
              <p className="cn-bajada">
                {sesionesCerradas
                  ? 'Se cerraron todas las sesiones abiertas con su correo, en cualquier dispositivo. Entre con la contraseña nueva.'
                  : 'Entre con la contraseña nueva.'}
              </p>
              {!sesionesCerradas && (
                <div className="cn-aviso" style={{ marginBottom: 20 }}>
                  <p>
                    <strong>No se pudieron cerrar las demás sesiones.</strong> La contraseña sí cambió. Si cree que
                    alguien más tiene acceso a su cuenta, pídale a un socio administrador de su firma que desactive y
                    vuelva a activar su usuario.
                  </p>
                </div>
              )}
              <a href="/entrar" className="cn-boton h-solid">
                Entrar
              </a>
            </div>
          )}

          <div className="cn-pie-flujo">
            <a href="/entrar" className="cn-volver">
              ← Volver a entrar
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};
