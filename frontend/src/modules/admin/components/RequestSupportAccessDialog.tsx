import React from 'react';
import { Dialog } from '../../../design/Dialog';
import { adminApi } from '../admin.api';

/**
 * Pedirle a una firma ver algo suyo. Lado de operación del acceso de soporte.
 * Cara nueva: `public/handoff/app-consola-de-operacion.html`, artboard 5
 * (segundo diálogo: rótulo «Acceso al contenido», «Pedir ver algo de esta
 * firma», «Operación no ve escritos ni casos», Qué necesita ver, Por qué, el
 * recuadro de condiciones y el pie Cancelar · Pedir el acceso).
 *
 * ─── ESTA PANTALLA NO CONCEDE NADA ──────────────────────────────────────────
 *
 * Al enviarla, operación no ve ni un dato más. Lo único que ocurre es que a un
 * socio de la firma le aparece una pregunta, y hasta que la autorice no hay
 * nada abierto. Por eso la confirmación dice que hay que esperar.
 *
 * ─── LO QUE EL ARTBOARD DICE Y AQUÍ NO SE DICE, con la razón ───────────────
 *
 * · «El acceso vence a las 24 horas»: la duración la elige operación entre las
 *   tres del servidor (`DURACIONES_PERMITIDAS`: 1, 4 o 24 horas), y el reloj
 *   empieza cuando un socio autoriza.
 * · «Se limita a lo que pidió»: el alcance es texto que el socio lee para
 *   decidir; ninguna regla del servidor recorta lo que se abre por ese texto.
 *   Afirmarlo sería prometer una frontera técnica que no existe.
 * · El rótulo en rojo: el rojo de la casa es solo de lo que destruye, y pedir
 *   no destruye nada.
 *
 * ─── EL MOTIVO TIENE MÍNIMO PORQUE ALGUIEN LO VA A LEER ─────────────────────
 *
 * Treinta caracteres los impone el servidor; el contador está para que la
 * restricción se entienda antes de chocar con ella.
 */

const MOTIVO_MINIMO = 30;

const DURACIONES: ReadonlyArray<{ minutos: 60 | 240 | 1440; rotulo: string; nota: string }> = [
  { minutos: 60, rotulo: '1 hora', nota: 'Reproducir algo puntual' },
  { minutos: 240, rotulo: '4 horas', nota: 'Una incidencia que exige varias pruebas' },
  { minutos: 1440, rotulo: '24 horas', nota: 'Solo si depende de algo que ocurre a otra hora' }
];

interface RequestSupportAccessDialogProps {
  firmId: string | null;
  firmName: string;
  onCerrar: () => void;
  onEnviada?: () => void;
}

export const RequestSupportAccessDialog: React.FC<RequestSupportAccessDialogProps> = ({ firmId, firmName, onCerrar, onEnviada }) => {
  const [motivo, setMotivo] = React.useState('');
  const [alcance, setAlcance] = React.useState('');
  const [duracion, setDuracion] = React.useState<60 | 240 | 1440>(60);
  const [enviando, setEnviando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [enviada, setEnviada] = React.useState(false);

  React.useEffect(() => {
    if (firmId) {
      setMotivo('');
      setAlcance('');
      setDuracion(60);
      setError(null);
      setEnviada(false);
    }
  }, [firmId]);

  const faltan = Math.max(0, MOTIVO_MINIMO - motivo.trim().length);
  const listo = faltan === 0 && alcance.trim().length >= 3 && !enviando;

  const enviar = async () => {
    if (!firmId || !listo) return;
    setEnviando(true);
    setError(null);
    try {
      await adminApi.solicitarSoporte(firmId, { motive: motivo.trim(), scope: alcance.trim(), durationMinutes: duracion });
      setEnviada(true);
      onEnviada?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog
      abierto={firmId !== null}
      onCerrar={onCerrar}
      titulo={enviada ? 'Solicitud enviada' : 'Pedir ver algo de esta firma'}
      subtitulo={`${firmName} · la decisión es de un socio de la firma, no suya.`}
      tamano="M"
      hayCambiosSinGuardar={!enviada && (motivo.length > 0 || alcance.length > 0)}
      onIntentoDeCerrarConCambios={() => undefined}
      acciones={
        enviada ? (
          <button type="button" className="cn-ope-boton cn-ope-boton--primario" onClick={onCerrar}>
            Entendido
          </button>
        ) : (
          <>
            <button type="button" className="cn-ope-boton cn-ope-boton--terciario" onClick={onCerrar} disabled={enviando}>
              Cancelar
            </button>
            <button type="button" className="cn-ope-boton cn-ope-boton--primario" onClick={() => void enviar()} disabled={!listo}>
              {enviando ? 'Enviando…' : 'Pedir el acceso'}
            </button>
          </>
        )
      }
    >
      {enviada ? (
        <div className="cn-ope-cuerpo cn-ope-confirmacion">
          <p className="cn-ope-texto">
            La solicitud quedó registrada y un socio de <strong>{firmName}</strong> la verá en su aplicación. Hasta que la autorice,
            usted no ve nada distinto de lo que veía antes.
          </p>
          <p className="cn-ope-texto">
            Si la niega, el servicio de la firma sigue igual y no hay nada que reintentar. La solicitud, la respuesta y cada pantalla
            que llegue a abrirse quedan en la auditoría de la firma, donde ella puede leerlo.
          </p>
        </div>
      ) : (
        <div className="cn-ope-cuerpo">
          <span className="cn-ope-chip cn-ope-chip--kicker">Acceso al contenido</span>
          <p className="cn-ope-texto cn-ope-texto--intro">
            Operación <strong>no ve escritos ni casos</strong>. Para resolver un reporte hay que pedir acceso con justificación: lo
            decide un socio de la firma, y <strong>la firma lo ve en su auditoría</strong>.
          </p>

          <div className="cn-ope-campos">
            <div>
              <label htmlFor="ope-alcance" className="cn-ope-etiqueta">
                Qué necesita ver
              </label>
              <input
                id="ope-alcance"
                value={alcance}
                onChange={(e) => setAlcance(e.target.value)}
                placeholder="Un escrito y su ficha del catálogo"
                className="cn-ope-campo"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="ope-motivo-acceso" className="cn-ope-etiqueta">
                Por qué
              </label>
              <textarea
                id="ope-motivo-acceso"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={4}
                placeholder="La firma reporta que un término aparece sin verificar en un escrito ya generado y no puedo reproducirlo sin ver la ficha que se usó."
                className="cn-ope-campo cn-ope-area"
              />
              <p className={`cn-ope-ayuda ${faltan > 0 ? 'cn-ope-ayuda--aviso' : ''}`}>
                {faltan > 0 ? `Faltan ${faltan} caracteres. Lo va a leer un socio antes de decidir.` : 'Suficiente para que se pueda juzgar.'}
              </p>
            </div>

            <fieldset className="cn-ope-grupo">
              <legend className="cn-ope-etiqueta">Durante cuánto, si lo autoriza</legend>
              <div className="cn-ope-opciones">
                {DURACIONES.map((d) => (
                  <button
                    key={d.minutos}
                    type="button"
                    onClick={() => setDuracion(d.minutos)}
                    aria-pressed={duracion === d.minutos}
                    className={`cn-ope-opcion ${duracion === d.minutos ? 'cn-ope-opcion--elegida' : ''}`}
                  >
                    <span className="cn-ope-opcion-titulo">{d.rotulo}</span>
                    <span className="cn-ope-opcion-nota">{d.nota}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <p className="cn-ope-recuadro">
              Enviarla <strong>no le abre nada</strong>: un socio de la firma decide. Si la autoriza, el acceso se cierra solo al
              cumplirse el plazo que usted eligió y la firma puede cortarlo antes. Cada pantalla que se abra queda registrada con
              su correo.
            </p>

            {error && (
              <p role="alert" className="cn-ope-error">
                {error}
              </p>
            )}
          </div>
        </div>
      )}
    </Dialog>
  );
};
