import React from 'react';
import { Dialog } from './Dialog';

/**
 * Confirmar una acción que cuesta o que no se deshace.
 *
 * Reemplaza a `window.confirm`: la caja gris del navegador con «iureon-app
 * .vercel.app dice» arriba, fuera del sistema de diseño y sin sitio para
 * explicar qué va a pasar ni cuánto cuesta. Este diálogo dice las dos cosas,
 * en el mismo tamaño S que la recarga del operador, y deja el botón de
 * confirmar con el peso visual que la acción merece: primario cuando cuesta
 * saldo, de peligro cuando borra.
 */

export interface Confirmacion {
  titulo: string;
  /** Qué va a pasar, en una o dos frases. Puede llevar el precio. */
  texto: React.ReactNode;
  /** Etiqueta del botón que confirma, en infinitivo: «Revisar de nuevo», «Eliminar». */
  etiqueta: string;
  /** Borrar o retirar algo: el botón se pinta de peligro. */
  peligro?: boolean;
  onConfirmar: () => void | Promise<void>;
}

interface ConfirmarDialogProps {
  confirmacion: Confirmacion | null;
  onCerrar: () => void;
}

export const ConfirmarDialog: React.FC<ConfirmarDialogProps> = ({ confirmacion, onCerrar }) => {
  const [ocupado, setOcupado] = React.useState(false);

  const confirmar = async () => {
    if (!confirmacion || ocupado) return;
    setOcupado(true);
    try {
      await confirmacion.onConfirmar();
      onCerrar();
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Dialog
      abierto={confirmacion !== null}
      onCerrar={ocupado ? () => undefined : onCerrar}
      tamano="S"
      titulo={confirmacion?.titulo ?? ''}
      acciones={
        <>
          <button type="button" onClick={onCerrar} className="btn-neutral btn-sm" disabled={ocupado}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void confirmar()}
            disabled={ocupado}
            className={`btn-sm ${confirmacion?.peligro ? 'btn-danger' : 'btn-primary'} disabled:opacity-50`}
          >
            {ocupado ? 'Un momento…' : confirmacion?.etiqueta}
          </button>
        </>
      }
    >
      <div className="text-ui leading-relaxed text-ink-900">{confirmacion?.texto}</div>
    </Dialog>
  );
};
