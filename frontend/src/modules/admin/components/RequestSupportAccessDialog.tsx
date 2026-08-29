import React from 'react';
import { Send } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { adminApi } from '../admin.api';

/**
 * Pedirle acceso a una firma. Artboard 8a, lado de operación (botón de 7b′).
 *
 * ─── ESTA PANTALLA NO CONCEDE NADA ──────────────────────────────────────────
 *
 * Al enviarla, operación no ve ni un dato más de la firma. Lo único que ocurre
 * es que a un socio le aparece una pregunta. Por eso el botón dice «Enviar la
 * solicitud» y la confirmación dice que hay que esperar: un verbo que sugiera
 * entrada —«acceder», «abrir»— enseñaría a operación que pedir es un trámite.
 *
 * ─── EL MOTIVO TIENE MÍNIMO PORQUE ALGUIEN LO VA A LEER ─────────────────────
 *
 * Treinta caracteres los impone el servidor, y el contador está aquí para que
 * la restricción se entienda antes de chocar con ella. No es burocracia: el
 * socio decide con esas palabras y nada más, así que «revisar» no es un motivo.
 *
 * ─── LAS TRES DURACIONES SON DEL PRODUCTO, NO DEL SOLICITANTE ───────────────
 *
 * Un campo libre dejaría pedir veinte mil minutos y que alguien autorizara sin
 * mirar el número. Se eligen, no se escriben, y el servidor rechaza cualquier
 * otro valor — la restricción vive en la tabla, no en este formulario.
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

export const RequestSupportAccessDialog: React.FC<RequestSupportAccessDialogProps> = ({
  firmId,
  firmName,
  onCerrar,
  onEnviada
}) => {
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
  const listo = faltan === 0 && alcance.trim().length >= 3;

  const enviar = async () => {
    if (!firmId || !listo) return;
    setEnviando(true);
    setError(null);
    try {
      await adminApi.solicitarSoporte(firmId, {
        motive: motivo.trim(),
        scope: alcance.trim(),
        durationMinutes: duracion
      });
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
      titulo="Solicitar acceso de soporte"
      subtitulo={`${firmName} · la decisión es de un socio de la firma, no suya.`}
      tamano="M"
      hayCambiosSinGuardar={!enviada && (motivo.length > 0 || alcance.length > 0)}
    >
      {enviada ? (
        <div className="space-y-3 py-4">
          <p className="text-justify text-[13px] leading-relaxed text-ink-900 [text-wrap:pretty]">
            La solicitud quedó registrada y un socio de {firmName} la verá en su aplicación. Hasta
            que la autorice, usted no ve nada distinto de lo que veía antes.
          </p>
          <p className="text-justify text-[12px] leading-snug text-ink-500 [text-wrap:pretty]">
            Si la niega, el servicio de la firma sigue igual y no hay nada que reintentar. Cada paso
            —la solicitud, la respuesta y cada pantalla que llegue a abrirse— queda en la auditoría
            de la firma, donde ella puede leerlo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="alcance-soporte"
              className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400"
            >
              Qué necesita ver
            </label>
            <input
              id="alcance-soporte"
              value={alcance}
              onChange={(e) => setAlcance(e.target.value)}
              placeholder="Un escrito y su ficha del catálogo"
              className="field mt-1 w-full"
            />
          </div>

          <div>
            <label
              htmlFor="motivo-soporte"
              className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400"
            >
              Por qué lo necesita
            </label>
            <textarea
              id="motivo-soporte"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={4}
              placeholder="La firma reporta que un término aparece sin verificar en un escrito ya generado y no puedo reproducirlo sin ver la ficha que se usó."
              className="field-area mt-1 w-full resize-none"
            />
            <p className="mt-1 text-[11px] text-ink-500">
              {faltan > 0
                ? `Faltan ${faltan} caracteres. Lo va a leer un socio antes de decidir.`
                : 'Suficiente para que se pueda juzgar.'}
            </p>
          </div>

          <fieldset>
            <legend className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Durante cuánto
            </legend>
            <div className="mt-1.5 grid gap-2 sm:grid-cols-3">
              {DURACIONES.map((d) => (
                <button
                  key={d.minutos}
                  type="button"
                  onClick={() => setDuracion(d.minutos)}
                  aria-pressed={duracion === d.minutos}
                  className={`rounded-card border px-3 py-2 text-left ${
                    duracion === d.minutos
                      ? 'border-ink-900 bg-canvas'
                      : 'border-line-200 bg-surface hover:bg-canvas'
                  }`}
                >
                  <span className="block text-[13px] font-semibold text-ink-900">{d.rotulo}</span>
                  <span className="mt-0.5 block text-[11px] leading-snug text-ink-500">
                    {d.nota}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>

          {error && (
            <p className="text-justify text-[12px] leading-snug text-danger [text-wrap:pretty]">
              {error}
            </p>
          )}

          <p className="text-justify text-[12px] leading-snug text-ink-500 [text-wrap:pretty]">
            El acceso será de solo lectura, se cerrará solo al vencer el plazo y la firma podrá
            cortarlo antes en cualquier momento. Todo lo que abra queda registrado con su nombre y
            visible para ella.
          </p>

          <button
            type="button"
            onClick={enviar}
            disabled={!listo || enviando}
            className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {enviando ? 'Enviando…' : 'Enviar la solicitud'}
          </button>
        </div>
      )}
    </Dialog>
  );
};
