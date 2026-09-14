import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, FileText, LogOut, Maximize2, Minimize2, PenLine, Shield } from 'lucide-react';
import type { EstadoBorrador } from '../../documents/types';
import { ActionConfirmationModal } from './ActionConfirmationModal';
import type { MainView } from '../types';
import { navModule } from '../navigation';
import '../../../design/cara-nueva.css';

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
 *
 * LA CARA NUEVA (README-app §1). Los botones pierden el contorno: secundario
 * sobre gris #F1F3F6, primario sólido, terciario sin fondo; todos de 44 px, el
 * alto de los botones del artboard de Inicio, y por eso la barra pasa de 46 a
 * 60. El título sube a 16 px porque la escala nueva no baja de 14. Mismas
 * acciones, en el mismo orden y con las mismas condiciones.
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
    <>
      <header className="cara-nueva cn-cab">
        <h1 className="cn-cab-titulo">
          {enTaller ? tituloDelEscrito || 'Escrito sin título' : modulo.label}
        </h1>

        {/*
          EL RADICADO SE VA EN MOVIL. Son veintitres digitos que no se encogen y
          el bloque de la derecha tampoco, asi que a 375px empujaban la cabecera
          fuera de la pantalla. El titulo del escrito es lo que orienta al volver
          a una pestaña; el radicado se lee en la configuracion del taller, que en
          movil es donde 4d lo pone.
        */}
        {radicado && enTaller && (
          <span className="cn-cab-radicado hidden sm:inline">{radicado}</span>
        )}

        {/*
          ESTE BLOQUE ERA EL QUE RECORTABA TODA LA APLICACION EN MOVIL.

          Son ocho controles `shrink-0` en una fila que no envuelve: a 375px miden
          mas que la pantalla, empujaban la cabecera fuera del ancho y, como la
          raiz es `overflow-hidden`, TODO quedaba cortado. Se reporto como «las
          pantallas se ven recortadas» y no era de cada vista: era la unica pieza
          que todas comparten. El login se veia bien porque es la unica pantalla
          que no monta esta cabecera.

          `min-w-0` le permite ceder ancho —sin el, `shrink-0` en los hijos hace
          que el contenedor imponga su tamaño al padre— y `overflow-x-auto`
          contiene el sobrante DENTRO del bloque en vez de repartirlo por la
          pagina. Ninguna accion se esconde: se desplazan entre ellas.

          PENDIENTE DECLARADO: 4d no quiere estas acciones en la cabecera movil.
          Quiere el primario de 48px fijo sobre la barra de pestañas con el costo
          debajo, y la exportacion en la pantalla del documento. Eso es rehacer la
          cabecera por tamaño; esto evita que rompa el resto mientras tanto.
        */}
        <div className="cn-cab-acciones flex min-w-0 shrink items-center overflow-x-auto lg:shrink-0 lg:overflow-x-visible">
          {enTaller && (
            <>
              {/*
                Documento contra expediente. Pestañas y no un interruptor de dos
                colores: se navega dentro de la misma pantalla, no se alterna un
                contexto.
              */}
              <div className="cn-cab-pestanas">
                {(
                  [
                    ['draft', 'Documento'],
                    ['pdf', 'Expediente']
                  ] as const
                ).map(([valor, etiqueta]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => setRightView(valor)}
                    aria-pressed={rightView === valor}
                    className={`cn-cab-pestana ${rightView === valor ? 'cn-cab-pestana--activa' : ''}`}
                  >
                    {etiqueta}
                  </button>
                ))}
              </div>

              {rightView === 'draft' && (
                <>
                  <button type="button" onClick={onCopyText} className="cn-cab-boton">
                    {copied ? (
                      <Check className="cn-cab-ok h-4 w-4" aria-hidden />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden />
                    )}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>

                  {/*
                    Word y PDF unidos: son la misma acción con dos formatos, y
                    separarlos en dos botones de colores distintos convertía una
                    decisión de formato en dos decisiones.
                  */}
                  <div ref={opcionesRef} className="cn-cab-grupo">
                    <button
                      type="button"
                      onClick={() => onExportWord(opciones())}
                      className="cn-cab-boton cn-cab-boton--izq"
                      title="Word conserva estilos y numeración editables"
                    >
                      <FileText className="h-4 w-4" aria-hidden />
                      Word
                    </button>
                    <button
                      type="button"
                      onClick={() => onExportPdf(opciones())}
                      className="cn-cab-boton"
                      title="El PDF sale en papel blanco, aunque la app esté en oscuro"
                    >
                      PDF
                    </button>
                    {/* La tercera mitad del grupo: cómo sale, no a qué formato. */}
                    <button
                      type="button"
                      onClick={() => setOpcionesAbiertas((v) => !v)}
                      aria-label="Opciones de exportación"
                      aria-expanded={opcionesAbiertas}
                      className="cn-cab-boton cn-cab-boton--der"
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden />
                    </button>

                    {opcionesAbiertas && (
                      <div className="cn-cab-pop">
                        <p className="cn-cab-pop-rotulo">Al exportar</p>

                        <label className="cn-cab-pop-casilla">
                          <input
                            type="checkbox"
                            checked={conMembrete}
                            onChange={(e) => setConMembrete(e.target.checked)}
                          />
                          <span>Membrete de la firma</span>
                        </label>

                        {/*
                          La casilla solo existe cuando hay fuentes que anexar.
                          Ofrecer una hoja vacía es prometer lo que la exportación
                          no va a cumplir.
                        */}
                        {hayFuentes && (
                          <label className="cn-cab-pop-casilla">
                            <input
                              type="checkbox"
                              checked={conFuentes}
                              onChange={(e) => setConFuentes(e.target.checked)}
                            />
                            <span>Anexar hoja de fuentes citadas</span>
                          </label>
                        )}

                        <p className="cn-cab-pop-nota">
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
                      <button
                        type="button"
                        onClick={onMarcarListo}
                        className="cn-cab-boton cn-cab-boton--primario"
                      >
                        <PenLine className="h-4 w-4" aria-hidden />
                        Marcar listo para firma
                      </button>
                    )}

                  {onToggleFocusMode && (
                    <button
                      type="button"
                      onClick={onToggleFocusMode}
                      className="cn-cab-boton"
                      title={
                        isFocusMode
                          ? 'Volver a la vista dividida'
                          : 'Ver el documento a pantalla completa'
                      }
                    >
                      {isFocusMode ? (
                        <Minimize2 className="h-4 w-4" aria-hidden />
                      ) : (
                        <Maximize2 className="h-4 w-4" aria-hidden />
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
        EL DIÁLOGO VA FUERA DE `.cara-nueva`. Es una pieza compartida que todavía
        no se ha rediseñado; dentro de la cabecera habría heredado la letra y los
        reinicios de la cara nueva y se vería distinto aquí que en el resto de la
        aplicación. Es `fixed`, así que salir del <header> no lo mueve de sitio.
      */}
      <ActionConfirmationModal
        isOpen={isLogoutConfirmOpen}
        title="¿Cerrar la sesión en este dispositivo?"
        message="Su trabajo queda guardado en la nube de su firma: borradores, revisiones, transcritos y ajustes. Al volver a entrar, retomará donde quedó."
        detail="Solo se cierra la sesión de este navegador. Los demás dispositivos siguen conectados."
        confirmText="Cerrar sesión"
        cancelText="Seguir trabajando"
        confirmVariant="primary"
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          if (onLogout) onLogout();
        }}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />
    </>
  );
};
