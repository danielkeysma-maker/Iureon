import React from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { adminApi, type FirmUserDetail } from '../admin.api';

/**
 * Nueva contraseña para una cuenta de la firma, puesta por operación.
 *
 * POR QUÉ EXISTE. No hay correo de recuperación: un abogado que olvida su
 * contraseña llama, y la única salida era tocar la base a mano. Aquí el
 * operador la fija —o la genera— y la entrega por el canal que la firma
 * elija. No se envía ningún correo, a propósito: el correo es el canal que
 * este producto no tiene asegurado.
 *
 * LA CONTRASEÑA SE VE UNA VEZ, AQUÍ. Tras confirmar, el diálogo se queda
 * abierto mostrándola en un campo copiable hasta que el operador diga que ya
 * la copió: si se cerrara solo, la contraseña que acaba de fijarse se habría
 * perdido con él. La auditoría de la firma anota la cuenta, nunca la clave.
 */

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

export const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({
  firmId,
  usuario,
  onCerrar,
  onHecho
}) => {
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
    setError(null);
    try {
      await adminApi.restablecerContrasena(firmId, usuario!.id, contrasena);
      setHecho(true);
      onHecho();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo restablecer la contraseña.');
    }
    // En ambos casos el diálogo se queda: con el error a la vista, o con la
    // contraseña recién fijada para copiarla.
    mantenerAbiertoRef.current = true;
  };

  const cerrar = () => {
    if (mantenerAbiertoRef.current) {
      mantenerAbiertoRef.current = false;
      return;
    }
    onCerrar();
  };

  const confirmacion: Confirmacion | null = usuario
    ? {
        titulo: hecho ? 'Contraseña fijada' : 'Nueva contraseña',
        etiqueta: hecho ? 'Listo, ya la copié' : 'Fijar contraseña',
        deshabilitado: !hecho && contrasena.length < MIN,
        onConfirmar: hecho ? () => undefined : fijar,
        texto: (
          <div className="space-y-3">
            <p className="text-justify [text-wrap:pretty]">
              {hecho ? (
                <>
                  La cuenta <b>{usuario.email}</b> ya entra con esta contraseña. Cópiela ahora: al cerrar
                  este diálogo no vuelve a mostrarse.
                </>
              ) : (
                <>
                  Fija la contraseña de <b>{usuario.email}</b>. No se envía ningún correo: entréguela
                  usted por un canal seguro (llamada, mensaje cifrado) y pídale que la cambie al entrar.
                </>
              )}
            </p>
            <label className="block text-[11px] text-ink-500">
              Contraseña · mínimo {MIN} caracteres
              <div className="mt-1 flex gap-1.5">
                <input
                  type="text"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  readOnly={hecho}
                  autoComplete="new-password"
                  spellCheck={false}
                  className="w-full rounded-control border border-line-200 bg-canvas px-2 py-1.5 font-mono text-[12px] text-ink-900 focus:border-brand-700 focus:outline-none"
                  autoFocus={!hecho}
                />
                {!hecho && (
                  <button
                    type="button"
                    onClick={() => setContrasena(generar())}
                    className="btn-neutral btn-sm flex shrink-0 items-center gap-1"
                    title={`Generar una de ${LARGO_GENERADA} caracteres`}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Generar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void copiar()}
                  disabled={contrasena.length === 0}
                  className="btn-neutral btn-sm flex shrink-0 items-center gap-1 disabled:opacity-50"
                >
                  {copiada ? <Check className="h-3.5 w-3.5 text-verified" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiada ? 'Copiada' : 'Copiar'}
                </button>
              </div>
            </label>
            <p className="rounded-control border border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] px-2.5 py-2 text-justify text-[11px] leading-snug text-unverified [text-wrap:pretty]">
              Entréguela solo por un canal seguro y a la persona titular de la cuenta. Queda en la
              auditoría de la firma que operación restableció esta contraseña; la contraseña no.
            </p>
            {error && <p className="text-[12px] text-danger">{error}</p>}
          </div>
        )
      }
    : null;

  return <ConfirmarDialog confirmacion={confirmacion} onCerrar={cerrar} />;
};
