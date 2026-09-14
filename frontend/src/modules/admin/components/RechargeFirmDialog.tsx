import React from 'react';
import { Dialog } from '../../../design/Dialog';
import type { FirmSummary } from '../admin.api';
import { faltaParaElMotivo, pesos } from '../consolaEnPantalla';

/**
 * Recargar —o descontar— el saldo de una firma desde la consola.
 * Cara nueva: `public/handoff/app-consola-de-operacion.html`, artboard 4
 * (primer diálogo: «Recargar saldo de la firma», «Queda en la auditoría de la
 * firma», firma y saldo actual, Monto, Motivo con «Escriba el motivo para
 * habilitar el botón.», pie con Cancelar y Recargar).
 *
 * ─── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 *
 * Era un `window.prompt` que solo pedía el monto, mientras el servidor EXIGE
 * motivo (`requireReason`): la recarga fallaba siempre. Este diálogo pide las
 * dos cosas que el servidor pide, y el motivo va a la auditoría de la firma.
 *
 * ─── LO QUE EL ARTBOARD NO TRAE Y SE CONSERVA (derivado) ────────────────────
 *
 * «Descontar». Una compensación dada por error tenía que revertirse a mano en
 * la base; el servidor ya acepta montos negativos con el mismo motivo y la
 * misma auditoría, y no deja el saldo bajo cero. Aquí se dice antes de intentarlo.
 *
 * ─── SIN MÍNIMO ESCRITO A MANO ─────────────────────────────────────────────
 *
 * El campo venía prellenado con el mínimo de compra por pasarela, escrito como
 * cifra en este archivo. Ese mínimo no ata al operador —compensar un borrador
 * fallido no obliga a regalar el resto— y una cifra copiada aquí se quedaría
 * vieja el día que el servidor cambie la suya. El campo arranca vacío.
 */

interface RechargeFirmDialogProps {
  firm: FirmSummary | null;
  ocupado: boolean;
  /** Lo que respondió el servidor al rechazar; se muestra entero. */
  errorDelServidor?: string;
  onCerrar: () => void;
  onConfirmar: (firm: FirmSummary, monto: number, motivo: string) => Promise<void>;
}

export const RechargeFirmDialog: React.FC<RechargeFirmDialogProps> = ({ firm, ocupado, errorDelServidor = '', onCerrar, onConfirmar }) => {
  const [montoTexto, setMontoTexto] = React.useState('');
  const [motivo, setMotivo] = React.useState('');
  const [modo, setModo] = React.useState<'acreditar' | 'descontar'>('acreditar');

  // Cada firma arranca limpia: el motivo de la anterior no es el de esta.
  React.useEffect(() => {
    if (!firm) return;
    setMontoTexto('');
    setMotivo('');
    setModo('acreditar');
  }, [firm?.id]);

  const monto = Number(montoTexto.replace(/[^\d]/g, ''));
  const faltan = faltaParaElMotivo(motivo);
  const excedeSaldo = modo === 'descontar' && firm !== null && monto > firm.creditsBalance;
  const listo = monto > 0 && faltan === 0 && !ocupado && !excedeSaldo;
  const verbo = modo === 'descontar' ? 'Descontar' : 'Recargar';

  /*
   * POR QUÉ EL BOTÓN ESTÁ APAGADO, escrito: un botón gris sin razón se lee como
   * un defecto del producto, no como un requisito.
   */
  const porQueNo = !monto
    ? 'Escriba el monto en pesos.'
    : excedeSaldo && firm
      ? `La firma tiene ${pesos(firm.creditsBalance)}: se puede descontar hasta esa cifra, que deja el saldo en cero.`
      : motivo.trim().length === 0
        ? 'Escriba el motivo para habilitar el botón.'
        : faltan > 0
          ? `Al motivo le faltan ${faltan} ${faltan === 1 ? 'carácter' : 'caracteres'}: lo leerán los socios de la firma.`
          : null;

  return (
    <Dialog
      abierto={firm !== null}
      onCerrar={ocupado ? () => undefined : onCerrar}
      tamano="M"
      titulo={modo === 'descontar' ? 'Descontar saldo de la firma' : 'Recargar saldo de la firma'}
      subtitulo={
        firm ? (
          <>
            {firm.name} · saldo actual <span className="cn-ope-mono">{pesos(firm.creditsBalance)}</span>
          </>
        ) : undefined
      }
      hayCambiosSinGuardar={motivo.trim().length > 0 || ocupado}
      onIntentoDeCerrarConCambios={() => undefined}
      pieIzquierda={<span>Queda en la auditoría de la firma</span>}
      acciones={
        <>
          <button type="button" onClick={onCerrar} className="cn-ope-boton cn-ope-boton--terciario" disabled={ocupado}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => firm && void onConfirmar(firm, modo === 'descontar' ? -monto : monto, motivo.replace(/\s+/g, ' ').trim())}
            disabled={!listo}
            className="cn-ope-boton cn-ope-boton--primario"
          >
            {ocupado ? 'Aplicando…' : monto > 0 ? `${verbo} ${pesos(monto)}` : verbo}
          </button>
        </>
      }
    >
      <div className="cn-ope-cuerpo cn-ope-campos">
        <div className="cn-ope-opciones" role="radiogroup" aria-label="Sentido del ajuste">
          {(['acreditar', 'descontar'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={modo === m}
              onClick={() => setModo(m)}
              className={`cn-ope-opcion ${modo === m ? 'cn-ope-opcion--elegida' : ''}`}
            >
              <span className="cn-ope-opcion-titulo">{m === 'acreditar' ? 'Acreditar' : 'Descontar'}</span>
              <span className="cn-ope-opcion-nota">
                {m === 'acreditar' ? 'Suma al saldo de la firma' : 'Revierte un abono dado por error'}
              </span>
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="ope-monto" className="cn-ope-etiqueta">
            Monto
          </label>
          <input
            id="ope-monto"
            inputMode="numeric"
            value={montoTexto}
            onChange={(e) => setMontoTexto(e.target.value)}
            placeholder="20.000"
            className="cn-ope-campo cn-ope-campo--cifra"
            autoFocus
          />
          <p className="cn-ope-ayuda">
            {modo === 'descontar'
              ? 'Se descuenta del saldo actual; nunca puede quedar negativo.'
              : 'No está atado al mínimo de compra por pasarela: compensar un borrador fallido no obliga a regalar el resto.'}
          </p>
        </div>

        <div>
          <label htmlFor="ope-motivo-recarga" className="cn-ope-etiqueta">
            Motivo
          </label>
          <textarea
            id="ope-motivo-recarga"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows={3}
            placeholder={modo === 'descontar' ? 'Reversión de una recarga de prueba' : 'Pago rechazado dos veces; acordado con el socio por teléfono'}
            className="cn-ope-campo cn-ope-area"
          />
          {porQueNo && <p className="cn-ope-ayuda cn-ope-ayuda--aviso">{porQueNo}</p>}
        </div>

        {errorDelServidor && (
          <p role="alert" className="cn-ope-error">
            {errorDelServidor}
          </p>
        )}
      </div>
    </Dialog>
  );
};
