import React, { useState } from 'react';
import { LogOut, Shield } from 'lucide-react';
import { ConfirmarCierreDeSesion } from './ConfirmarCierreDeSesion';
import type { MainView } from '../types';
import { navModule } from '../navigation';
import '../../../design/cara-nueva.css';

interface HeaderTopProps {
  mainView: MainView;
  onOpenUserManagementModal?: () => void;
  onLogout?: () => void;
}

/**
 * La barra superior: en qué módulo se está y la sesión.
 *
 * ─── LAS ACCIONES DEL ESCRITO SE FUERON A SU BARRA ─────────────────────────
 *
 * En Redacción esta cabecera llevaba el título del escrito, las pestañas
 * Documento/Expediente, Copiar, Word, PDF con sus opciones, «Marcar listo para
 * firma», «Pantalla completa» y «Firmas». Casi todo estaba DOS VECES en la
 * pantalla: las pestañas en el lienzo, Firmas en la barra lateral, el título en
 * la barra del borrador. Y el desplegable de exportación se pintaba debajo de la
 * barra de la cascada, porque esta cabecera vive en una capa inferior.
 *
 * Hoy esas acciones viven en `BarraDelBorrador`, sobre el escrito al que se
 * refieren, y aquí queda lo que es de la aplicación y no del documento: el
 * nombre del módulo y cerrar la sesión. «Firmas» sigue fuera de Redacción
 * mientras las demás pantallas no tengan otro sitio donde ofrecerlo.
 *
 * LA CARA NUEVA (README-app §1): botones sin contorno de 44 px, título de 16 px.
 */
export const HeaderTop: React.FC<HeaderTopProps> = ({ mainView, onOpenUserManagementModal, onLogout }) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Una sola lista de módulos: una segunda copia ya derivó a nombres distintos una vez.
  const modulo = navModule(mainView);
  const enRedaccion = mainView === 'workspace';

  return (
    <>
      <header className="cara-nueva cn-cab">
        <h1 className="cn-cab-titulo">{modulo.label}</h1>

        <div className="cn-cab-acciones flex min-w-0 shrink items-center lg:shrink-0">
          {/*
            SUPERUSUARIO Y CERRAR SESIÓN, secundarios. El rojo se reserva para lo
            que destruye algo, y salir de una sesión no destruye nada.
          */}
          {onOpenUserManagementModal && !enRedaccion && (
            <button
              type="button"
              onClick={onOpenUserManagementModal}
              className="cn-cab-boton"
              title="Firmas, usuarios y autenticación"
            >
              <Shield className="h-4 w-4" aria-hidden />
              <span className="hidden lg:inline">Firmas</span>
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={() => setIsLogoutConfirmOpen(true)}
              className="cn-cab-boton cn-cab-boton--fantasma"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          )}
        </div>
      </header>

      {/*
        LA MISMA CONFIRMACIÓN QUE EL TELÉFONO Y AJUSTES. Ya lleva la cara nueva:
        se monta en el cuerpo del documento con su propio alcance `.cara-nueva`,
        así que no depende de estar dentro de este <header>.
      */}
      {onLogout && (
        <ConfirmarCierreDeSesion
          abierto={isLogoutConfirmOpen}
          onCancelar={() => setIsLogoutConfirmOpen(false)}
          onCerrarSesion={onLogout}
        />
      )}
    </>
  );
};
