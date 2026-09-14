import React from 'react';
import { Clock, ShieldCheck, ShieldX } from 'lucide-react';
import { DialogoDeAyuda } from '../../help/components/DialogoDeAyuda';
import { supportApi, type SupportAccess } from '../support.api';

/**
 * La solicitud de acceso, como la lee el socio que decide. Artboard 8a.
 *
 * ─── LA CARA NUEVA, DERIVADA ────────────────────────────────────────────────
 *
 * Ningún archivo de `public/handoff/app-*.html` dibuja esta solicitud con la
 * cara nueva. Se viste con la cáscara de los diálogos de Aprender
 * (`help/components/DialogoDeAyuda`), que sale de «Escribir a soporte»
 * (`app-manual-y-soporte.html`, :491): título dentro del cuerpo, radio 16,
 * campos sobre gris y hoja inferior en el teléfono.
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
 * «No autorizar» y «Autorizar» llevan LA MISMA clase: mismo tamaño, mismo peso
 * y mismo color. Pintar uno como primario sería empujar la decisión, y una
 * decisión que se puede tomar en los dos sentidos con el mismo esfuerzo es la
 * única que informa. El foco entra al diálogo, no a ninguno de los dos.
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
  const idTitulo = React.useId();

  const decidir = async (autoriza: boolean) => {
    if (!solicitud) return;
    setEnviando(autoriza ? 'si' : 'no');
    setError(null);
    try {
      await supportApi.decidir(solicitud.id, autoriza);
      onDecidido();
      onCerrar();
    } catch (e: unknown) {
      setError(
        `${e instanceof Error ? e.message : 'No se pudo registrar la decisión.'} La solicitud sigue pendiente: nadie ha entrado.`
      );
    } finally {
      setEnviando(null);
    }
  };

  return (
    <DialogoDeAyuda
      abierto={solicitud !== null}
      onCerrar={() => {
        if (enviando === null) onCerrar();
      }}
      tituloId={idTitulo}
      clase="cn-sop-decision"
    >
      {solicitud && (
        <div className="cn-sop-decision-cuerpo">
          <div>
            <h2 id={idTitulo} className="cn-sop-h2 cn-sop-h2--grande">
              Soporte pide ver material de su firma
            </h2>
            <p className="cn-sop-bajada-2">Usted decide. Nadie ha entrado todavía.</p>
          </div>

          <dl className="cn-sop-decision-datos">
            <div>
              <dt className="cn-sop-etiqueta">Quién pide</dt>
              <dd className="cn-sop-decision-dato">{solicitud.requestedBy}</dd>
            </div>
            <div>
              <dt className="cn-sop-etiqueta">Qué pide ver</dt>
              <dd className="cn-sop-decision-dato">{solicitud.scope}</dd>
            </div>
            <div>
              <dt className="cn-sop-etiqueta">Por qué</dt>
              <dd className="cn-sop-decision-dato cn-sop-decision-dato--motivo">{solicitud.motive}</dd>
            </div>
          </dl>

          <div className="cn-sop-decision-plazo">
            <Clock className="cn-sop-icono-linea" aria-hidden="true" />
            <p>
              Si autoriza, el acceso dura{' '}
              <strong>{DURACION_LEGIBLE[solicitud.durationMinutes] ?? `${solicitud.durationMinutes} min`}</strong>{' '}
              y se cierra solo. Es de <strong>solo lectura</strong>: nadie puede modificar nada. Verá
              una franja permanente mientras dure, con lo que se vaya abriendo, y puede cortarlo en
              cualquier momento. No hay prórroga automática: si hace falta más tiempo, se vuelve a
              pedir.
            </p>
          </div>

          <p className="cn-sop-decision-libre">No autorizar no afecta su servicio.</p>

          {error && (
            <p className="cn-sop-error" role="alert">
              {error}
            </p>
          )}

          <div className="cn-sop-decision-botones">
            <button
              type="button"
              onClick={() => decidir(false)}
              disabled={enviando !== null}
              className="cn-sop-decision-boton"
            >
              <ShieldX className="cn-sop-icono-linea" aria-hidden="true" />
              {enviando === 'no' ? 'Registrando…' : 'No autorizar'}
            </button>
            <button
              type="button"
              onClick={() => decidir(true)}
              disabled={enviando !== null}
              className="cn-sop-decision-boton"
            >
              <ShieldCheck className="cn-sop-icono-linea" aria-hidden="true" />
              {enviando === 'si' ? 'Autorizando…' : 'Autorizar'}
            </button>
          </div>
        </div>
      )}
    </DialogoDeAyuda>
  );
};
