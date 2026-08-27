import React, { useState } from 'react';
import { Check, Copy, FileText, LogOut, Maximize2, Minimize2, Shield } from 'lucide-react';
import { ActionConfirmationModal } from './ActionConfirmationModal';
import type { MainView } from '../types';
import { navModule } from '../navigation';

interface HeaderTopProps {
  mainView: MainView;
  rightView: 'pdf' | 'draft';
  setRightView: (view: 'pdf' | 'draft') => void;
  copied: boolean;
  onCopyText: () => void;
  onExportWord: () => void;
  onExportPdf: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onOpenUserManagementModal?: () => void;
  onLogout?: () => void;
  /** Lo que se está redactando. Sin borrador todavía, es el nombre del módulo. */
  tituloDelEscrito?: string;
  /** Radicado del proceso, cuando lo hay. Va en mono: es dato citable. */
  radicado?: string;
}

/**
 * La barra superior: qué documento es y qué se puede hacer con él.
 *
 * DEJA DE SER UNA MIGA DE PAN. Decía "Módulos › Redacción", que es información
 * sobre la aplicación y no sobre el trabajo: el abogado ya sabe en qué módulo
 * está porque la barra lateral se lo muestra iluminado. Ahora dice el NOMBRE DEL
 * ESCRITO y su radicado, que es lo que alguien necesita al volver a una pestaña
 * abierta desde ayer.
 *
 * LAS ACCIONES DE EXPORTACIÓN DEJAN DE COMPETIR ENTRE SÍ. Word iba en azul
 * sólido y PDF en ROJO sólido, así que la acción más llamativa de la pantalla
 * era exportar a PDF — y el rojo, que en este sistema significa destruir algo,
 * estaba puesto sobre guardar una copia. Ahora los dos son secundarios y van
 * unidos como un solo control de dos mitades.
 */
export const HeaderTop: React.FC<HeaderTopProps> = ({
  mainView,
  rightView,
  setRightView,
  copied,
  onCopyText,
  onExportWord,
  onExportPdf,
  isFocusMode,
  onToggleFocusMode,
  onOpenUserManagementModal,
  onLogout,
  tituloDelEscrito,
  radicado
}) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Una sola lista de módulos. Esto era una segunda copia, y las dos habían
  // derivado a seis nombres distintos para los mismos seis módulos; además
  // perdió su entrada de 'audiencias' al desplegarse esa vista, y leer `.icon`
  // de undefined se llevó la barra entera por delante.
  const modulo = navModule(mainView);
  const enTaller = mainView === 'workspace';

  return (
    <header className="z-20 flex h-[46px] shrink-0 select-none items-center gap-3 border-b border-line-200 bg-surface px-5 font-sans">
      <h1 className="min-w-0 truncate text-[14px] font-semibold text-ink-900">
        {enTaller ? tituloDelEscrito || 'Escrito sin título' : modulo.label}
      </h1>

      {radicado && enTaller && (
        <span className="shrink-0 font-mono text-[11.5px] text-ink-400">{radicado}</span>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {enTaller && (
          <>
            {/*
              Documento contra expediente. Pestañas subrayadas y no un
              interruptor de dos colores: se navega dentro de la misma pantalla,
              no se alterna un contexto.
            */}
            <div className="mr-1 flex items-center gap-1">
              {(
                [
                  ['draft', 'Documento'],
                  ['pdf', 'Expediente']
                ] as const
              ).map(([valor, etiqueta]) => (
                <button
                  key={valor}
                  onClick={() => setRightView(valor)}
                  className={`rounded-control px-2.5 py-1.5 text-meta font-medium transition-colors ${
                    rightView === valor
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>

            {rightView === 'draft' && (
              <>
                <button onClick={onCopyText} className="btn-neutral btn-sm">
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-verified" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-ink-400" />
                  )}
                  {copied ? 'Copiado' : 'Copiar'}
                </button>

                {/*
                  Word y PDF unidos: son la misma acción con dos formatos, y
                  separarlos en dos botones de colores distintos convertía una
                  decisión de formato en dos decisiones.
                */}
                <div className="flex">
                  <button
                    onClick={onExportWord}
                    className="btn-secondary btn-sm rounded-r-none"
                  >
                    <FileText className="h-3 w-3" />
                    Word
                  </button>
                  <button
                    onClick={onExportPdf}
                    className="btn-secondary btn-sm -ml-px rounded-l-none"
                  >
                    PDF
                  </button>
                </div>

                {onToggleFocusMode && (
                  <button
                    onClick={onToggleFocusMode}
                    className="btn-neutral btn-sm"
                    title={
                      isFocusMode
                        ? 'Volver a la vista dividida'
                        : 'Ver el documento a pantalla completa'
                    }
                  >
                    {isFocusMode ? (
                      <Minimize2 className="h-3.5 w-3.5 text-ink-400" />
                    ) : (
                      <Maximize2 className="h-3.5 w-3.5 text-ink-400" />
                    )}
                    {isFocusMode ? 'Vista dividida' : 'Pantalla completa'}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/*
          SUPERUSUARIO Y CERRAR SESIÓN.

          Llevaban el tratamiento más pesado del producto: slate-900 sólido,
          negrita, radio distinto del de las pestañas. El resultado era que el
          elemento más llamativo de la pantalla era un panel de administración y
          el segundo un "Cerrar Sesión" rojo, mientras el trabajo de verdad
          —redactar— quedaba en gris debajo.

          Siguen siendo secundarios. El rojo se reserva para lo que destruye
          algo, y salir de una sesión no destruye nada.
        */}
        {onOpenUserManagementModal && (
          <button
            onClick={onOpenUserManagementModal}
            className="btn-neutral btn-sm"
            title="Firmas, usuarios y autenticación"
          >
            <Shield className="h-3.5 w-3.5 text-ink-400" />
            <span className="hidden lg:inline">Firmas</span>
          </button>
        )}

        {onLogout && (
          <button
            onClick={() => setIsLogoutConfirmOpen(true)}
            className="btn-ghost btn-sm"
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <LogOut className="h-3.5 w-3.5 text-ink-400" />
          </button>
        )}
      </div>

      <ActionConfirmationModal
        isOpen={isLogoutConfirmOpen}
        title="¿Cerrar sesión?"
        message="Sus borradores y configuraciones quedan guardados. Puede volver a entrar cuando quiera."
        confirmText="Cerrar sesión"
        confirmVariant="danger"
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          if (onLogout) onLogout();
        }}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </header>
  );
};
