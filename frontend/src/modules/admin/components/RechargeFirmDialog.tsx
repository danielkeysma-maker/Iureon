import React from 'react';
import { Dialog } from '../../../design/Dialog';
import type { FirmSummary } from '../admin.api';

/**
 * Recargar el saldo de una firma desde la consola del operador.
 *
 * ─── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 *
 * Era un `window.prompt` del navegador: una caja gris con «iureon-app.vercel.app
 * dice» arriba, fuera del sistema de diseño, sin decir de qué firma ni qué saldo
 * tiene. El usuario lo vio y no le gustó, con razón.
 *
 * ─── Y LO QUE EL PROMPT ESCONDÍA ────────────────────────────────────────────
 *
 * El servidor EXIGE un motivo —`requireReason` rechaza la recarga sin él, antes
 * de tocar dinero— y el prompt solo pedía el monto. La recarga desde la consola
 * fallaba siempre, y el mensaje de error era el del servidor. Este diálogo pide
 * las dos cosas que el servidor pide: cuánto y por qué. El motivo va a la
 * auditoría de la firma con el correo del operador; es la única traza de por
 * qué se movió un saldo que es pasivo de la plataforma.
 *
 * ─── EL MÍNIMO ES UNA SUGERENCIA, NO UNA REGLA ──────────────────────────────
 *
 * $100.000 es el mínimo de recarga para la firma que paga por pasarela. Aquí
 * viene prellenado como empujón, pero se puede bajar: compensar un borrador
 * fallido de $2.000 no debe obligar al operador a regalar $98.000.
 */

interface RechargeFirmDialogProps {
  firm: FirmSummary | null;
  ocupado: boolean;
  onCerrar: () => void;
  onConfirmar: (firm: FirmSummary, monto: number, motivo: string) => Promise<void>;
}

const MONTO_SUGERIDO = 100000;
/** El mismo minimo que `requireReason` en el servidor: al menos diez caracteres. */
const MIN_MOTIVO = 10;

const pesos = (n: number): string => `$${n.toLocaleString('es-CO')}`;

export const RechargeFirmDialog: React.FC<RechargeFirmDialogProps> = ({
  firm,
  ocupado,
  onCerrar,
  onConfirmar
}) => {
  const [montoTexto, setMontoTexto] = React.useState(String(MONTO_SUGERIDO));
  const [motivo, setMotivo] = React.useState('');
  const [error, setError] = React.useState('');

  // Cada firma arranca limpia: el motivo de la anterior no es el de esta.
  React.useEffect(() => {
    if (!firm) return;
    setMontoTexto(String(MONTO_SUGERIDO));
    setMotivo('');
    setError('');
  }, [firm?.id]);

  const monto = Number(montoTexto.replace(/[^\d]/g, ''));
  const motivoLimpio = motivo.trim();
  const listo = monto > 0 && motivoLimpio.length >= MIN_MOTIVO && !ocupado;

  const confirmar = async () => {
    if (!firm) return;
    if (!monto) {
      setError('El monto debe ser un número mayor que cero.');
      return;
    }
    if (motivoLimpio.length < MIN_MOTIVO) {
      setError('Escriba el motivo, al menos diez caracteres: queda en la auditoría de la firma y lo leerán sus socios.');
      return;
    }
    setError('');
    await onConfirmar(firm, monto, motivoLimpio);
  };

  return (
    <Dialog
      abierto={firm !== null}
      onCerrar={ocupado ? () => undefined : onCerrar}
      tamano="S"
      titulo="Recargar saldo"
      subtitulo={firm ? `${firm.name} · saldo actual ${pesos(firm.creditsBalance)}` : undefined}
      hayCambiosSinGuardar={motivoLimpio.length > 0 || ocupado}
      onIntentoDeCerrarConCambios={() => undefined}
      pieIzquierda={
        <span className="font-mono text-[11px] text-ink-400">Queda en la auditoría de la firma</span>
      }
      acciones={
        <>
          <button type="button" onClick={onCerrar} className="btn-neutral btn-sm" disabled={ocupado}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void confirmar()}
            disabled={!listo}
            className="btn-primary btn-sm disabled:opacity-50"
          >
            {ocupado ? 'Recargando…' : monto > 0 ? `Recargar ${pesos(monto)}` : 'Recargar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="monto-recarga"
            className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400"
          >
            Monto en pesos
          </label>
          <input
            id="monto-recarga"
            inputMode="numeric"
            value={montoTexto}
            onChange={(e) => setMontoTexto(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            className="field mt-1 w-full font-mono"
            autoFocus
          />
          <p className="mt-1 text-[11px] leading-snug text-ink-500">
            {pesos(MONTO_SUGERIDO)} es el mínimo que paga una firma por pasarela. Aquí puede ser menor:
            compensar un borrador fallido no obliga a regalar el resto.
          </p>
        </div>

        <div>
          <label
            htmlFor="motivo-recarga"
            className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400"
          >
            Motivo
          </label>
          <textarea
            id="motivo-recarga"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={2}
            placeholder="Compensación por borrador fallido del 28 de agosto"
            className="field mt-1 w-full resize-none"
          />
        </div>

        {error && <p className="text-[12px] leading-snug text-danger">{error}</p>}
      </div>
    </Dialog>
  );
};
