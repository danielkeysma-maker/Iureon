import React from 'react';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { adminApi, type FirmUserDetail } from '../admin.api';

/**
 * Nueva contraseña para una cuenta de la firma, puesta por operación.
 * Cara nueva: derivada. `app-consola-de-operacion.html` no la dibuja; toma la
 * anatomía de la confirmación de `app-dialogos-y-estados.html` y los campos del
 * diálogo de recarga del artboard 4.
 *
 * POR QUÉ EXISTE. Cuando la persona no puede recuperar su contraseña sola —el
 * correo no le llega, o la firma pide que se la ponga soporte—, el operador la
 * fija o la genera y la entrega por el canal que la firma elija. Desde aquí no
 * se envía ningún correo (`restablecerContrasenaDeUsuario` no lo hace).
 *
 * PASA POR LA CONFIRMACIÓN DEL SISTEMA, y la contraseña SE VE UNA VEZ: tras
 * confirmar, el diálogo se queda abierto mostrándola hasta que el operador
 * diga que ya la copió. La auditoría de la firma anota la cuenta, nunca la clave.
 */

/** El mismo mínimo que `MIN_CONTRASENA_OPERADOR` en el servidor. */
const MIN = 10;
const LARGO_GENERADA = 14;
/* Sin 0/O, 1/l/I: la va a dictar alguien por teléfono. */
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789-_#';

const generar = (): string => {
  const bytes = new Uint32Array(LARGO_GENERADA);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join('');
};

interface ResetPasswordDialogProps {
  firmId: string;
  /** La cuenta a la que se le fija la contraseña; null cierra el diálogo. */
  usuario: FirmUserDetail | null;
  onCerrar: () => void;
  /** Tras fijarla: la ficha relee su registro de operación. */
  onHecho: () => void;
}

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({ firmId, usuario, onCerrar, onHecho }) => {
  const [contrasena, setContrasena] = React.useState('');
  const [hecho, setHecho] = React.useState(false);
  const [copiada, setCopiada] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const mantenerAbiertoRef = React.useRef(false);

  React.useEffect(() => {
    setContrasena('');
    setHecho(false);
    setCopiada(false);
    setError(null);
  }, [usuario?.id]);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(contrasena);
      setCopiada(true);
      window.setTimeout(() => setCopiada(false), 2000);
    } catch {
      setError('No se pudo copiar; selecciónela y cópiela a mano.');
    }
  };

  const fijar = async () => {
    if (!usuario) return;
    setError(null);
    try {
      await adminApi.restablecerContrasena(firmId, usuario.id, contrasena);
      setHecho(true);
      onHecho();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.');
    }
    // En ambos casos el diálogo se queda: con el error a la vista, o con la contraseña para copiarla.
    mantenerAbiertoRef.current = true;
  };

  const cerrar = () => {
    if (mantenerAbiertoRef.current) {
      mantenerAbiertoRef.current = false;
      return;
    }
    onCerrar();
  };

  const faltan = Math.max(0, MIN - contrasena.length);

  const confirmacion: Confirmacion | null = usuario
    ? {
        titulo: hecho ? 'Contraseña fijada' : 'Nueva contraseña',
        etiqueta: hecho ? 'Listo, ya la copié' : 'Fijar la contraseña',
        deshabilitado: !hecho && faltan > 0,
        onConfirmar: hecho ? () => undefined : fijar,
        texto: (
          <div className="cn-ope-confirmacion">
            <p className="cn-ope-texto">
              {hecho ? (
                <>
                  La cuenta <strong>{usuario.email}</strong> ya entra con esta contraseña. Cópiela ahora: al cerrar este diálogo no
                  vuelve a mostrarse.
                </>
              ) : (
                <>
                  Fija la contraseña de <strong>{usuario.email}</strong>. Desde aquí no sale ningún correo: entréguela usted por un
                  canal seguro y pídale que la cambie al entrar.
                </>
              )}
            </p>
            <div>
              <label htmlFor="ope-contrasena" className="cn-ope-etiqueta">
                Contraseña
              </label>
              <div className="cn-ope-contrasena">
                <input
                  id="ope-contrasena"
                  type="text"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  readOnly={hecho}
                  autoComplete="new-password"
                  spellCheck={false}
                  className="cn-ope-campo cn-ope-campo--cifra"
                  autoFocus={!hecho}
                />
                {!hecho && (
                  <button type="button" onClick={() => setContrasena(generar())} className="cn-ope-boton cn-ope-boton--suave">
                    Generar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void copiar()}
                  disabled={contrasena.length === 0}
                  className="cn-ope-boton cn-ope-boton--suave"
                >
                  {copiada ? 'Copiada' : 'Copiar'}
                </button>
              </div>
              {!hecho && (
                <p className={`cn-ope-ayuda ${faltan > 0 ? 'cn-ope-ayuda--aviso' : ''}`}>
                  {faltan > 0 ? `Mínimo ${MIN} caracteres: faltan ${faltan}.` : `«Generar» crea una de ${LARGO_GENERADA} caracteres, fácil de dictar.`}
                </p>
              )}
            </div>
            <p className="cn-ope-recuadro cn-ope-recuadro--aviso">
              Entréguela solo por un canal seguro y a la persona titular de la cuenta. Queda en la auditoría de la firma que
              operación restableció esta contraseña; la contraseña no.
            </p>
            {error && (
              <p role="alert" className="cn-ope-error">
                {error}
              </p>
            )}
          </div>
        )
      }
    : null;

  return <ConfirmarDialog confirmacion={confirmacion} onCerrar={cerrar} />;
};
