import React from 'react';
import { Copy, FileDown, FileText, LogOut, ShieldCheck, X } from 'lucide-react';
import { IconoMenu, IconoPalomita } from '../../../design/ArtboardIcons';
import { navModule } from '../navigation';
import type { MainView } from '../types';
import type { EstadoBorrador } from '../../documents/types';

/**
 * La cabecera de móvil. Artboard 4d — leída de la maqueta, no deducida.
 *
 * Medidas COPIADAS del HTML del artboard, no estimadas:
 *
 *     height:52px; background:#fff; border-bottom:1px solid #E3E7EC;
 *     display:flex; align-items:center; gap:10px; padding:0 16px
 *
 * Título `600 15px` en `#101822`; subtítulo `400 11px` en MONO y `#8B96A6`; el
 * botón `34x34` con `border-radius:8px` y borde `#E3E7EC`.
 *
 * ─── QUÉ MUESTRA 4d, Y QUÉ MOSTRABA LA DE ESCRITORIO ────────────────────────
 *
 * La maqueta pone **el nombre del módulo** en negrita —«Redactar»— y debajo, en
 * gris pequeño, **de qué caso se trata**: «Mosquera vs. Colpensiones». A la
 * derecha, un solo botón de menú.
 *
 * La de escritorio ponía el título del escrito truncado a «Escrito sin t…» y a
 * su lado las pestañas Documento/Expediente más ocho acciones. En 375px eso
 * medía 533 y cortaba la aplicación entera. Pero el problema no era solo el
 * ancho: era que **la cabecera no decía dónde estaba uno**. En escritorio lo
 * dice la barra lateral, que en el teléfono no existe.
 *
 * ─── EL MENÚ RECOGE LAS ACCIONES QUE ANTES ESTABAN SUELTAS ──────────────────
 *
 * Copiar, Word, PDF y «listo para firma» viven ahora en una hoja que se abre al
 * tocar el menú. Esto además cierra una regresión declarada: al contener el
 * desborde de la cabecera con `overflow-x-auto`, el desplegable de exportación
 * quedaba recortado por su propio contenedor. En una hoja no hay nada que
 * recortar.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · Las variantes de exportación (con membrete, con hoja de fuentes) que el
 *   escritorio ofrece en un desplegable. Aquí se exporta con los valores por
 *   defecto: dos casillas dentro de una hoja, sobre una acción que ya está a
 *   dos toques, son más decisiones que las que caben de pie. Quien necesita
 *   afinar el documento lo hace sentado.
 */

interface MobileHeaderProps {
  mainView: MainView;
  /** El caso o el escrito abierto: lo que 4d pone bajo el nombre del módulo. */
  subtitulo?: string | null;
  enTaller: boolean;
  copied: boolean;
  onCopyText: () => void;
  onExportWord: (opciones: { conMembrete: boolean; conFuentes: boolean }) => void;
  onExportPdf: (opciones: { conMembrete: boolean; conFuentes: boolean }) => void;
  estadoDelBorrador?: EstadoBorrador | null;
  onMarcarListo?: () => void;
  onAbrirGestion?: () => void;
  onLogout: () => void;
}

const Accion: React.FC<{
  icono: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
  destacada?: boolean;
}> = ({ icono, onClick, children, destacada }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex min-h-[48px] w-full items-center gap-3 rounded-control px-3 text-left text-[13.5px] ${
      destacada ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-900'
    }`}
  >
    <span className={destacada ? 'text-brand-700' : 'text-ink-400'}>{icono}</span>
    {children}
  </button>
);

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  mainView,
  subtitulo,
  enTaller,
  copied,
  onCopyText,
  onExportWord,
  onExportPdf,
  estadoDelBorrador,
  onMarcarListo,
  onAbrirGestion,
  onLogout
}) => {
  const [menu, setMenu] = React.useState(false);
  const modulo = navModule(mainView);
  const sinOpciones = { conMembrete: true, conFuentes: false };

  const cerrarY = (accion: () => void) => () => {
    accion();
    setMenu(false);
  };

  return (
    <>
      <header className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-line-200 bg-surface px-4 lg:hidden">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[15px] font-semibold leading-tight text-ink-900">
            {modulo.label}
          </h1>
          {subtitulo && (
            <p className="truncate font-mono text-[11px] leading-tight text-ink-400">{subtitulo}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMenu(true)}
          aria-label="Acciones"
          className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px] border border-line-200 text-ink-700"
        >
          <IconoMenu className="h-4 w-4" />
        </button>
      </header>

      {menu && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setMenu(false)}
            className="flex-1 bg-black/40"
          />

          <div className="rounded-t-card border-t border-line-200 bg-surface pb-[env(safe-area-inset-bottom)]">
            <header className="flex items-center justify-between border-b border-line-200 px-4 py-3">
              <h2 className="text-[14px] font-semibold text-ink-900">Acciones</h2>
              <button
                type="button"
                onClick={() => setMenu(false)}
                aria-label="Cerrar"
                className="flex h-11 w-11 items-center justify-center text-ink-500"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="space-y-0.5 p-2">
              {enTaller && (
                <>
                  {/*
                    «Listo para firma» va PRIMERO y destacado cuando aplica: el
                    artboard es explicito en que el primario no es exportar sino
                    el estado del borrador — exportar es un medio, y el estado es
                    lo que la firma necesita registrar.
                  */}
                  {onMarcarListo && estadoDelBorrador && estadoDelBorrador !== 'LISTO' && (
                    <Accion
                      icono={<IconoPalomita className="h-4 w-4" />}
                      onClick={cerrarY(onMarcarListo)}
                      destacada
                    >
                      Marcar listo para firma
                    </Accion>
                  )}

                  <Accion icono={<Copy className="h-4 w-4" />} onClick={cerrarY(onCopyText)}>
                    {copied ? 'Copiado' : 'Copiar el texto'}
                  </Accion>
                  <Accion
                    icono={<FileText className="h-4 w-4" />}
                    onClick={cerrarY(() => onExportWord(sinOpciones))}
                  >
                    Exportar a Word
                  </Accion>
                  <Accion
                    icono={<FileDown className="h-4 w-4" />}
                    onClick={cerrarY(() => onExportPdf(sinOpciones))}
                  >
                    Exportar a PDF
                  </Accion>
                </>
              )}

              {onAbrirGestion && (
                <Accion
                  icono={<ShieldCheck className="h-4 w-4" />}
                  onClick={cerrarY(onAbrirGestion)}
                >
                  Firmas y usuarios
                </Accion>
              )}

              <Accion icono={<LogOut className="h-4 w-4" />} onClick={cerrarY(onLogout)}>
                Cerrar sesión
              </Accion>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
