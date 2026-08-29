import React from 'react';
import { Dialog } from '../../../design/Dialog';
import { OperatorConsole } from './OperatorConsole';

/**
 * La consola de operación, en el diálogo del sistema. Artboard 7a.
 *
 * ─── POR QUÉ EXISTE ESTE ENVOLTORIO ─────────────────────────────────────────
 *
 * La consola ya estaba construida, con los tokens del sistema y con datos
 * reales de `adminApi`. Lo que no tenía era puerta: vivía como UNA PESTAÑA
 * dentro de un modal obsoleto, junto a un formulario de credenciales y a unos
 * botones de crear y borrar firmas que no hacían nada, porque `App.tsx` nunca
 * pasó esos callbacks. El dueño del producto era el único que veía esa
 * pantalla, y por eso era también el único que no veía la 6c.
 *
 * ─── LO QUE NO SE PERDIÓ AL RETIRAR EL CASCARÓN ─────────────────────────────
 *
 * El cambio de firma activa, que era la única función viva de aquellas
 * pestañas, vive en el sidebar y sigue igual.
 *
 * ─── VISOR, NO FORMULARIO ───────────────────────────────────────────────────
 *
 * Sin `hayCambiosSinGuardar`: la consola lee y actúa de inmediato sobre cada
 * firma, no acumula un borrador que se pueda perder al cerrar. Por eso el clic
 * en el velo cierra sin preguntar.
 */

interface OperatorConsoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OperatorConsoleDialog: React.FC<OperatorConsoleDialogProps> = ({ isOpen, onClose }) => (
  <Dialog
    abierto={isOpen}
    onCerrar={onClose}
    titulo="Operación de la plataforma"
    subtitulo="Las firmas, sus planes y sus saldos. Nunca sus transcritos, borradores ni documentos."
    tamano="L"
    cuerpoEnCanvas
  >
    <OperatorConsole />
  </Dialog>
);
