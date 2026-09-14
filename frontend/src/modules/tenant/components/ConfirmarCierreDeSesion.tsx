import React from 'react';
import { ActionConfirmationModal } from './ActionConfirmationModal';

/**
 * La confirmación de «Cerrar sesión». UNA sola, para la cabecera de escritorio,
 * la hoja de acciones del teléfono y Ajustes › Su cuenta.
 *
 * Antes solo la cabecera preguntaba: el teléfono y Ajustes cerraban la sesión
 * al primer toque, así que el mismo gesto se comportaba distinto según dónde se
 * hiciera. Con las palabras aquí, las tres entradas no pueden volver a divergir.
 *
 * ─── LO QUE DICE, Y POR QUÉ ES CIERTO ──────────────────────────────────────
 *
 * · «Solo este navegador; los demás dispositivos siguen conectados»:
 *   `handleLogout` (App.tsx) borra la sesión guardada en este navegador y nada
 *   más. No llama a ningún `signOut`, y el servidor no revoca las otras
 *   sesiones. (El único cierre global está en restablecer la contraseña, y ese
 *   flujo lo anuncia por su cuenta.) `check:cerrar-sesion` lo vigila.
 * · «Borradores, revisiones y transcritos» viven en la nube de la firma.
 *
 * LO QUE SE RETIRÓ DE LA VERSIÓN ANTERIOR:
 * · «ajustes» en la lista de lo guardado en la nube: la apariencia sí viaja con
 *   la cuenta, pero el tamaño de letra por pantalla y la barra lateral plegada
 *   se recuerdan en cada navegador.
 * · «retomará donde quedó»: al entrar, la sesión aterriza en Inicio
 *   (SPEC-entrada-y-sesion), no en la pantalla que se dejó.
 * · Un borrador que se guardó solo en este navegador porque la nube no
 *   respondió no se pierde al salir —cerrar sesión no borra ese almacenamiento—,
 *   así que «no se pierde nada» sigue siendo cierto sin nombrarlo aquí.
 */

export const TEXTO_CIERRE_DE_SESION = {
  titulo: '¿Cerrar la sesión en este dispositivo?',
  mensaje:
    'Su trabajo no se pierde: los borradores, las revisiones y los transcritos quedan en la nube de su firma, y los encontrará al volver a entrar.',
  detalle: 'Solo se cierra la sesión de este navegador. Los demás dispositivos siguen conectados.',
  confirmar: 'Cerrar sesión',
  cancelar: 'Seguir trabajando'
} as const;

interface ConfirmarCierreDeSesionProps {
  abierto: boolean;
  onCancelar: () => void;
  onCerrarSesion: () => void;
  /** Dónde dejar el foco al cancelar si el botón que lo abrió ya desapareció. */
  focoAlCerrar?: React.RefObject<HTMLElement | null>;
}

export const ConfirmarCierreDeSesion: React.FC<ConfirmarCierreDeSesionProps> = ({
  abierto,
  onCancelar,
  onCerrarSesion,
  focoAlCerrar
}) => (
  <ActionConfirmationModal
    isOpen={abierto}
    title={TEXTO_CIERRE_DE_SESION.titulo}
    message={TEXTO_CIERRE_DE_SESION.mensaje}
    detail={TEXTO_CIERRE_DE_SESION.detalle}
    confirmText={TEXTO_CIERRE_DE_SESION.confirmar}
    cancelText={TEXTO_CIERRE_DE_SESION.cancelar}
    /* Salir no destruye nada: el rojo queda para lo que borra. */
    confirmVariant="primary"
    focoAlCerrar={focoAlCerrar}
    onConfirm={() => {
      onCancelar();
      onCerrarSesion();
    }}
    onCancel={onCancelar}
  />
);
