import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, FileText, LogOut, Maximize2, Minimize2, PenLine, Shield } from 'lucide-react';
import type { EstadoBorrador } from '../../documents/types';
import { ActionConfirmationModal } from './ActionConfirmationModal';
import type { MainView } from '../types';
import { navModule } from '../navigation';

interface HeaderTopProps {
  mainView: MainView;
  rightView: 'pdf' | 'draft';
  setRightView: (view: 'pdf' | 'draft') => void;
  copied: boolean;
  onCopyText: () => void;
  onExportWord: (opciones: { conMembrete: boolean; conFuentes: boolean }) => void;
  onExportPdf: (opciones: { conMembrete: boolean; conFuentes: boolean }) => void;
  /**
   * Si el borrador tiene fuentes que anexar. Decide si la casilla "hoja de
   * fuentes" se ofrece: ofrecer anexar una hoja vacia es prometer algo que la
   * exportacion no va a cumplir.
   */
  hayFuentes?: boolean;
  /** El estado del borrador guardado que esta abierto, si hay uno. */
  estadoDelBorrador?: EstadoBorrador | null;
  /**
   * Marca el escrito como LISTO. Es el PRIMARIO de la barra cuando hay un
   * borrador guardado: exportar es un medio, y el estado es lo que la firma
   * necesita registrar.
   */
  onMarcarListo?: () => void;
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
  hayFuentes = false,
  estadoDelBorrador = null,
  onMarcarListo,
  isFocusMode,
  onToggleFocusMode,
  onOpenUserManagementModal,
  onLogout,
  tituloDelEscrito,
  radicado
}) => {
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  /*
   * LAS CASILLAS DE EXPORTACION VIVEN JUNTO AL BOTON, no en Ajustes: son
   * decisiones por escrito, no preferencias permanentes. El mismo abogado
   * radica un PDF con membrete y manda un Word sin membrete a un colega, en la
   * misma tarde.
   */
  const [opcionesAbiertas, setOpcionesAbiertas] = useState(false);
  const [conMembrete, setConMembrete] = useState(true);
  const [conFuentes, setConFuentes] = useState(true);
  const opcionesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!opcionesAbiertas) return;
    const fuera = (e: MouseEvent) => {
      if (!opcionesRef.current?.contains(e.target as Node)) setOpcionesAbiertas(false);
    };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [opcionesAbiertas]);

  // La lista de fuentes la arma App, que es quien tiene el borrador. Aqui solo
  // se decide si se anexa.
  const opciones = () => ({ conMembrete, conFuentes: conFuentes && hayFuentes });

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
                <div ref={opcionesRef} className="relative flex">
                  <button
                    onClick={() => onExportWord(opciones())}
                    className="btn-secondary btn-sm rounded-r-none"
                    title="Word conserva estilos y numeración editables"
                  >
                    <FileText className="h-3 w-3" />
                    Word
                  </button>
                  <button
                    onClick={() => onExportPdf(opciones())}
                    className="btn-secondary btn-sm -ml-px rounded-none"
                    title="El PDF sale en papel blanco, aunque la app esté en oscuro"
                  >
                    PDF
                  </button>
                  {/* La tercera mitad del grupo: cómo sale, no a qué formato. */}
                  <button
                    onClick={() => setOpcionesAbiertas((v) => !v)}
                    aria-label="Opciones de exportación"
                    aria-expanded={opcionesAbiertas}
                    className="btn-secondary btn-sm -ml-px rounded-l-none px-1.5"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {opcionesAbiertas && (
                    <div className="surface-raised absolute right-0 top-full z-40 mt-1 w-[240px] p-3">
                      <p className="mb-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                        Al exportar
                      </p>

                      <label className="flex cursor-pointer items-start gap-2 py-1">
                        <input
                          type="checkbox"
                          checked={conMembrete}
                          onChange={(e) => setConMembrete(e.target.checked)}
                          className="mt-0.5"
                        />
                        <span className="text-ui text-ink-900">Membrete de la firma</span>
                      </label>

                      {/*
                        La casilla solo existe cuando hay fuentes que anexar.
                        Ofrecer una hoja vacía es prometer lo que la exportación
                        no va a cumplir.
                      */}
                      {hayFuentes && (
                        <label className="flex cursor-pointer items-start gap-2 py-1">
                          <input
                            type="checkbox"
                            checked={conFuentes}
                            onChange={(e) => setConFuentes(e.target.checked)}
                            className="mt-0.5"
                          />
                          <span className="text-ui text-ink-900">
                            Anexar hoja de fuentes citadas
                          </span>
                        </label>
                      )}

                      <p className="mt-2 border-t border-line-100 pt-2 text-meta leading-[1.5] text-ink-500">
                        Word conserva estilos editables. El PDF sale en papel blanco, aunque la
                        aplicación esté en oscuro.
                      </p>
                    </div>
                  )}
                </div>

                {/*
                  EL PRIMARIO ES MARCAR LISTO, NO EXPORTAR. Exportar es un
                  medio; el estado del borrador es lo que la firma necesita
                  registrar. Solo aparece con un borrador guardado abierto y
                  todavía sin ese estado.
                */}
                {onMarcarListo &&
                  estadoDelBorrador &&
                  estadoDelBorrador !== 'LISTO' &&
                  estadoDelBorrador !== 'RADICADO' && (
                    <button onClick={onMarcarListo} className="btn-primary btn-sm">
                      <PenLine className="h-3 w-3" />
                      Marcar listo para firma
                    </button>
                  )}

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
