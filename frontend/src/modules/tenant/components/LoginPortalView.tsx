import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { IureonMark } from './IureonMark';
import { authApi } from '../../auth/auth.api';
import type { Session } from '../../auth/session';
import { DIAS_DE_PRUEBA_GRATUITA } from '../../subscriptions/pruebaTerminada';
import '../../../design/cara-nueva.css';

interface LoginPortalViewProps {
  onLoginSuccess: (session: Session) => void;
}

/**
 * The door, and now it is actually locked.
 *
 * WHAT THIS USED TO DO. It checked that both fields were non-empty, waited on a
 * setTimeout that existed only to look busy, and let anyone in — then handed
 * the app whichever firm happened to be first in localStorage. The footer said
 * "Autenticación Cifrada Supabase Auth & Multi-Tenant RLS", which was false in
 * every word.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA CARA NUEVA (marco «Entrar» de `public/handoff/app-entrada-y-sesion.html`,
 * escritorio y móvil 375). A la izquierda, entrar; a la derecha, en escritorio,
 * qué garantiza el producto. En móvil el panel desaparece y el botón queda
 * pegado al borde inferior. Los estilos viven en `design/cara-nueva.css`, bajo
 * `.cara-nueva`, para que el resto de la aplicación no cambie todavía.
 *
 * LO QUE LA MAQUETA DECÍA Y NO SE COPIÓ:
 * - «¿Olvidó su contraseña?» llevaba a una recuperación por correo que no
 *   existe (SPEC §2). La contraseña la restablece operación de Iureon cuando la
 *   firma lo pide (`admin.routes.ts`, «acciones de soporte que la firma
 *   autoriza»); eso es lo que se dice, sin enlace.
 * - «Regístrela y pruebe 14 días» y «14 días del plan Premium y saldo de
 *   cortesía»: la prueba pública es de Esencial, dura
 *   `DIAS_DE_PRUEBA_GRATUITA` y empieza con saldo cero (`trial.service.ts`).
 * - «POR QUÉ ESTO NO ES UN CHATBOT»: sin inglés en pantalla.
 *
 * LAS CIFRAS DEL PANEL SON LAS REALES Y TIENEN GUARDA. Ya pasó dos veces que
 * envejecieran —decía 651 y 2 cuando el catálogo iba en 858 y los registros
 * eran 4; luego 879 cuando ya eran 881—, así que ahora `check:cifras-entrada`
 * (backend) cuenta el catálogo y compara con `CATALOGO`, y comprueba que existe
 * un servicio por cada registro de `REGISTROS_EN_VIVO`.
 */

/**
 * Lo que el catálogo sostiene hoy. «Verificadas» son las fichas cuyo término no
 * está en NO_VERIFICADO (VERIFICADO o NO_CADUCA). No se redondea hacia arriba:
 * esta pantalla la lee alguien que todavía no confía en el producto.
 */
const CATALOGO = {
  actuacionesVerificadas: 881,
  ramas: 28
} as const;

/** Un servicio de `backend/src/modules/jurisprudence` por cada uno; la guarda lo comprueba. */
const REGISTROS_EN_VIVO = [
  'Corte Constitucional',
  'Corte Suprema',
  'Consejo de Estado',
  'Comisión Nacional de Disciplina Judicial'
] as const;

/** «a», «a y b», «a, b y c». */
const enumerar = (partes: readonly string[]): string =>
  partes.length <= 1 ? partes.join('') : `${partes.slice(0, -1).join(', ')} y ${partes[partes.length - 1]}`;

export const LoginPortalView: React.FC<LoginPortalViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Escriba su correo y su contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const { session } = await authApi.login(email.trim(), password);
      onLoginSuccess(session);
    } catch (err) {
      // The API answers in Spanish and distinguishes nothing an attacker could
      // use — "Correo o contraseña incorrectos" covers both a wrong password
      // and an address that has no account.
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo entrar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="cara-nueva cara-nueva--pagina">
      <main className="cn-columna">
        <div className="cn-columna-cuerpo">
          <div className="cn-marca">
            <IureonMark size={24} />
            <span>IUREON</span>
          </div>

          <h1 className="cn-titulo">Entrar</h1>
          <p className="cn-bajada">Con el correo de su firma.</p>

          <form id="form-entrar" onSubmit={handleSubmit} className="cn-campos">
            <div>
              <label htmlFor="correo" className="cn-etiqueta">
                Correo
              </label>
              <input
                id="correo"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@sufirma.co"
                autoComplete="email"
                className="cn-campo"
                required
              />
            </div>

            <div>
              <label htmlFor="clave" className="cn-etiqueta">
                Contraseña
              </label>
              <div className="cn-con-boton">
                <input
                  id="clave"
                  type={verContrasena ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  aria-describedby="clave-ayuda"
                  className="cn-campo cn-campo--clave"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena((v) => !v)}
                  aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="cn-ver-clave"
                >
                  {verContrasena ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
              {/*
                SIN RECUPERACIÓN POR CORREO TODAVÍA (SPEC §2). Decir quién la
                restablece es más honesto que un enlace a una pantalla que no
                existe: la firma la pide y operación de Iureon la pone.
              */}
              <p id="clave-ayuda" className="cn-ayuda">
                Si la olvidó, un socio administrador de su firma nos pide que se la restablezcamos.
              </p>
            </div>

            {errorMsg && (
              <div role="alert" className="cn-error">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{errorMsg}</span>
              </div>
            )}
          </form>

          {/*
            Fuera del formulario solo para poder pegarse al borde en móvil; `form`
            lo mantiene como su botón de envío, así que Enter en un campo sigue
            entrando.
          */}
          <div className="cn-pie-accion">
            <button type="submit" form="form-entrar" disabled={isLoading} className="cn-boton h-solid">
              {isLoading ? 'Verificando…' : 'Entrar'}
            </button>
          </div>

          {/*
            La única puerta de autoservicio sin pago, y solo para Esencial: los
            días de `DIAS_DE_PRUEBA_GRATUITA`, con saldo en cero.
          */}
          <div className="cn-sin-cuenta">
            <p className="cn-sin-cuenta-titulo">¿Su firma todavía no está en Iureon?</p>
            <p>
              {DIAS_DE_PRUEBA_GRATUITA} días del plan Esencial gratis, para un usuario. Sin tarjeta.
            </p>
            <a href="/?prueba=1" className="cn-boton-sec h-soft">
              Registrar la firma y probar Esencial
            </a>
          </div>

          <div className="cn-recuadro" style={{ marginTop: 20 }}>
            <Lock size={16} aria-hidden="true" />
            <p>Cada acceso queda en Auditoría, y cada firma solo ve sus propios expedientes.</p>
          </div>

          <div className="cn-pie-flujo">
            <a href="/landing/index.html" className="cn-volver">
              ← Volver a la página principal
            </a>
          </div>
        </div>
      </main>

      {/*
        EL PANEL SE OCULTA EN MÓVIL, no se encoge: un argumento comprimido a
        375 px se vuelve un muro de texto entre el abogado y su contraseña.
      */}
      <aside className="cn-panel" aria-label="Lo que Iureon comprueba">
        <div className="cn-panel-cuerpo">
          <p className="cn-kicker">Lo que Iureon comprueba</p>
          <h2 className="cn-panel-titulo">Cada término va con el artículo que lo respalda.</h2>
          <p className="cn-panel-bajada">
            Y lo que no se pudo comprobar contra el texto oficial se marca, en vez de disimularse.
          </p>

          <div className="cn-estados">
            <div className="cn-estado">
              <span className="cn-punto" aria-hidden="true" />
              <span>Comprobado contra la norma</span>
            </div>
            <div className="cn-estado cn-estado--sin">
              <span className="cn-punto" aria-hidden="true" />
              <span>Sin comprobar · lo dice la pantalla</span>
            </div>
          </div>

          <dl className="cn-cifras">
            <div>
              {/* En mono porque es un dato, no interfaz. */}
              <dt>{CATALOGO.actuacionesVerificadas.toLocaleString('es-CO')}</dt>
              <dd>
                actuaciones procesales en {CATALOGO.ramas} ramas, verificadas contra el texto oficial de la norma
              </dd>
            </div>
            <div>
              <dt>{REGISTROS_EN_VIVO.length}</dt>
              <dd>registros consultados en vivo: {enumerar(REGISTROS_EN_VIVO)}</dd>
            </div>
          </dl>
        </div>

        <p className="cn-panel-ley">
          Tratamiento de datos conforme a la Ley 1581 de 2012 · subencargados publicados en la sección Privacidad
        </p>
      </aside>
    </div>
  );
};
