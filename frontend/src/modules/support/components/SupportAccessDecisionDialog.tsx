import React from 'react';
import { Clock, ShieldCheck, ShieldX } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { supportApi, type SupportAccess } from '../support.api';

/**
 * La solicitud de acceso, como la lee el socio que decide. Artboard 8a.
 *
 * ─── LA FRASE QUE NO SE PUEDE OMITIR ────────────────────────────────────────
 *
 * «No autorizar no afecta su servicio.» Va escrita, y va antes de los botones.
 * Sin ella la pregunta no es libre: un cliente que sospecha que negarse le
 * costará soporte, atención o velocidad, autoriza por miedo, y lo que se
 * recoge entonces no es consentimiento sino resignación. Es la única frase de
 * esta pantalla que no puede resumirse.
 *
 * ─── SE MUESTRA LO QUE SE PIDIÓ, NO UNA CATEGORÍA ───────────────────────────
 *
 * El motivo se pinta entero y con sus palabras. Reducirlo a «soporte técnico»
 * ahorraría espacio y le quitaría al socio lo único con lo que puede juzgar:
 * el servidor exige treinta caracteres precisamente para que haya algo que leer.
 *
 * ─── NEGAR ES UNA RESPUESTA, NO UN SILENCIO ─────────────────────────────────
 *
 * «No autorizar» es un botón del mismo tamaño y del mismo peso visual que
 * autorizar, no un enlace pequeño al margen. Una decisión que se puede tomar
 * en los dos sentidos con el mismo esfuerzo es la única que informa.
 */

const DURACION_LEGIBLE: Record<number, string> = {
  60: '1 hora',
  240: '4 horas',
  1440: '24 horas'
};

interface SupportAccessDecisionDialogProps {
  solicitud: SupportAccess | null;
  onCerrar: () => void;
  onDecidido: () => void;
}

export const SupportAccessDecisionDialog: React.FC<SupportAccessDecisionDialogProps> = ({
  solicitud,
  onCerrar,
  onDecidido
}) => {
  const [enviando, setEnviando] = React.useState<'si' | 'no' | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const decidir = async (autoriza: boolean) => {
    if (!solicitud) return;
    setEnviando(autoriza ? 'si' : 'no');
    setError(null);
    try {
      await supportApi.decidir(solicitud.id, autoriza);
      onDecidido();
      onCerrar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar la decisión.');
    } finally {
      setEnviando(null);
    }
  };

  return (
    <Dialog
      abierto={solicitud !== null}
      onCerrar={onCerrar}
      titulo="Soporte pide ver material de su firma"
      subtitulo="Usted decide. Nadie ha entrado todavía."
      tamano="M"
    >
      {solicitud && (
        <div className="space-y-4">
          <dl className="space-y-3">
            <div>
              <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                Quién pide
              </dt>
              <dd className="mt-0.5 text-[13px] text-ink-900">{solicitud.requestedBy}</dd>
            </div>
            <div>
              <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                Qué pide ver
              </dt>
              <dd className="mt-0.5 text-[13px] text-ink-900">{solicitud.scope}</dd>
            </div>
            <div>
              <dt className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                Por qué
              </dt>
              <dd className="mt-0.5 text-justify text-[13px] leading-relaxed text-ink-900 [text-wrap:pretty]">
                {solicitud.motive}
              </dd>
            </div>
          </dl>

          <div className="flex items-start gap-2 rounded-card border border-line-200 bg-canvas px-4 py-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
            <p className="text-justify text-[12px] leading-snug text-ink-700 [text-wrap:pretty]">
              Si autoriza, el acceso dura{' '}
              <strong className="font-semibold">
                {DURACION_LEGIBLE[solicitud.durationMinutes] ?? `${solicitud.durationMinutes} min`}
              </strong>{' '}
              y se cierra solo. Es de <strong className="font-semibold">solo lectura</strong>: nadie
              puede modificar nada. Verá una franja permanente mientras dure, con lo que se vaya
              abriendo, y puede cortarlo en cualquier momento. No hay prórroga automática: si hace
              falta más tiempo, se vuelve a pedir.
            </p>
          </div>

          <p className="text-justify text-[13px] font-semibold leading-snug text-ink-900 [text-wrap:pretty]">
            No autorizar no afecta su servicio.
          </p>

          {error && (
            <p className="text-justify text-[12px] leading-snug text-danger [text-wrap:pretty]">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => decidir(false)}
              disabled={enviando !== null}
              className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ShieldX className="h-4 w-4" />
              {enviando === 'no' ? 'Registrando…' : 'No autorizar'}
            </button>
            <button
              type="button"
              onClick={() => decidir(true)}
              disabled={enviando !== null}
              className="btn-primary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <ShieldCheck className="h-4 w-4" />
              {enviando === 'si' ? 'Autorizando…' : 'Autorizar'}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
};
