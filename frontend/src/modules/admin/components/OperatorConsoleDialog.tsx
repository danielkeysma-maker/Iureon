import React from 'react';
import { Dialog } from '../../../design/Dialog';
import { OperatorConsole } from './OperatorConsole';

/**
 * La consola de operación, en el diálogo del sistema.
 * Cara nueva: `public/handoff/app-consola-de-operacion.html`, artboard 1.
 *
 * ─── POR QUÉ EXISTE ESTE ENVOLTORIO ─────────────────────────────────────────
 *
 * La consola ya estaba construida con datos reales de `adminApi`; lo que no
 * tenía era puerta: vivía como UNA PESTAÑA dentro de un modal obsoleto. El
 * cambio de firma activa, que era la única función viva de aquellas pestañas,
 * vive en el panel lateral y sigue igual.
 *
 * ─── DOS CLASES, DOS ALCANCES ───────────────────────────────────────────────
 *
 * `cara-nueva cn-ope-dialogos` viste TODOS los diálogos que cuelgan de la
 * consola (plan, recarga, zona de riesgo, soporte…), porque el marco compartido
 * se pinta en línea y no en un portal: quedan dentro de este elemento.
 * `cn-ope-pantalla` solo viste el diálogo de la consola —más ancho, con la
 * cabecera «Iureon · Operación» del artboard—, y su CSS usa el combinador hijo
 * para no alcanzar a los diálogos anidados, que están dentro de él.
 *
 * ─── VISOR, NO FORMULARIO ───────────────────────────────────────────────────
 *
 * Sin `hayCambiosSinGuardar`: la consola lee y actúa de inmediato sobre cada
 * firma, no acumula un borrador que se pueda perder al cerrar. Los formularios
 * que sí acumulan (plan, recarga, nueva firma) protegen su propio velo.
 */

interface OperatorConsoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OperatorConsoleDialog: React.FC<OperatorConsoleDialogProps> = ({ isOpen, onClose }) => (
  <div className="cara-nueva cn-ope-dialogos">
    <div className="cn-ope-pantalla">
      <Dialog abierto={isOpen} onCerrar={onClose} titulo="Iureon · Operación" tamano="L">
        <OperatorConsole />
      </Dialog>
    </div>
  </div>
);
