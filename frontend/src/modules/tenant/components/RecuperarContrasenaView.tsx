import React, { useState } from 'react';
import { AlertCircle, Mail } from 'lucide-react';
import { IureonMark } from './IureonMark';
import { authApi } from '../../auth/auth.api';
import { ApiError } from '../../../config/httpClient';
import { MINUTOS_DE_VIGENCIA_DEL_ENLACE } from '../../auth/enlaceDeRecuperacion';
import '../../../design/cara-nueva.css';

/**
 * PEDIR EL ENLACE PARA PONER UNA CONTRASEÑA NUEVA (`/?recuperar=1`).
 *
 * Marco «Recuperar el acceso» de `public/handoff/app-entrada-y-sesion.html`.
 * Móvil 375 derivado de «Entrar»: el botón pegado al borde inferior.
 *
 * ─── LA CONFIRMACIÓN ES LA MISMA PASE LO QUE PASE ─────────────────────────
 *
 * «Si ese correo tiene cuenta, ya salió el enlace». El servidor responde igual
 * exista o no la cuenta, y la pantalla no puede ser más precisa que él: decir
 * «le enviamos el enlace» a secas confirmaría a cualquiera que ese correo
 * existe en Iureon. Por eso la frase se explica a sí misma.
 *
 * LO QUE SÍ SE DICE CUANDO FALLA: formato del correo (400), demasiadas
 * solicitudes desde esa conexión (429) y servicio no disponible (503). Ninguno
 * depende de si el correo tiene cuenta; el mensaje es el del servidor.
 *
 * LA VÍA DEL SOCIO SE CONSERVA (SPEC §2.6): si el correo no llega, un socio
 * administrador pide a operación que le ponga una contraseña nueva. Es la que
 * funciona cuando el correo no.
 */
export const RecuperarContrasenaView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim()) {
      setErrorMsg('Escriba el correo con el que entra.');
      return;
    }

    setEnviando(true);
    try {
      await authApi.recuperar(email.trim());
      setEnviado(true);
    } catch (err) {
      setEnviado(false);
      setErrorMsg(
        err instanceof ApiError
          ? err.message
          : 'No se pudo conectar con el servidor. Revise su conexión e intente de nuevo.'
      );
    } finally {
      setEnviando(false);
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

          <h1 className="cn-titulo">Recuperar el acceso</h1>
          <p className="cn-bajada">
            Escriba el correo con el que entra. Le enviamos un enlace para poner una contraseña nueva.
          </p>

          <form id="form-recuperar" onSubmit={handleSubmit} className="cn-campos">
            <div>
              <label htmlFor="correo-recuperar" className="cn-etiqueta">
                Correo
              </label>
              <input
                id="correo-recuperar"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@sufirma.co"
                autoComplete="email"
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
            <button type="submit" form="form-recuperar" disabled={enviando} className="cn-boton h-solid">
              {enviando ? 'Enviando…' : enviado ? 'Enviarme otro enlace' : 'Enviarme el enlace'}
            </button>
          </div>

          {/* `role="status"`: el lector de pantalla anuncia la confirmación sin mover el foco. */}
          <div role="status" aria-live="polite">
            {enviado && (
              <div className="cn-exito" style={{ marginTop: 22 }}>
                <Mail size={20} aria-hidden="true" />
                <div>
                  <p className="cn-exito-titulo">Si ese correo tiene cuenta, ya salió el enlace</p>
                  <p>
                    Lo decimos así a propósito: confirmar que un correo existe en Iureon le daría información a
                    quien no debe tenerla.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="cn-recuadro" style={{ marginTop: 22 }}>
            <p>
              El enlace <strong>vence en {MINUTOS_DE_VIGENCIA_DEL_ENLACE} minutos</strong> y solo sirve una vez. Si no
              le llega, revise el correo no deseado — o pídale a un socio administrador de su firma que le ponga una
              nueva.
            </p>
          </div>

          <div className="cn-pie-flujo">
            <a href="/?entrar=1" className="cn-volver">
              ← Volver a entrar
            </a>
          </div>
        </div>
      </main>
    </div>
  );
};
