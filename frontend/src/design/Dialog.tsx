import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * El diálogo del sistema. Once diálogos, una sola anatomía.
 *
 * POR QUÉ UNO Y NO ONCE. Había once modales resolviendo cada uno su cabecera,
 * su cierre y sus botones a su manera: la × en tres sitios distintos, el
 * primario a veces a la izquierda, y `Esc` funcionando en unos sí y en otros no.
 * Un abogado abre varios al día y cada uno le exigía reaprender dónde está todo.
 *
 * LO ÚNICO QUE CAMBIA ENTRE UNO Y OTRO ES EL CUERPO. La cabecera, el pie y la
 * posición de la × son idénticos en los once, de modo que abrir el sexto
 * diálogo del día no obligue a buscar nada.
 *
 * ─── LAS REGLAS QUE ESTE COMPONENTE HACE CUMPLIR ────────────────────────────
 *
 *  · `Esc` cierra SIEMPRE, y el pie lo dice por escrito.
 *  · El clic en el velo cierra visores y calculadoras —no hay nada que perder—
 *    pero NO cierra un formulario con cambios sin guardar: ahí pregunta.
 *  · El foco va al diálogo al abrir y VUELVE al elemento que lo invocó al
 *    cerrar. Sin eso, quien navega con teclado queda al principio de la página.
 *  · La cabecera y el pie son fijos; el scroll vive solo en el cuerpo. En un
 *    diálogo de sesenta entradas, perder el botón principal al bajar es perder
 *    la única salida.
 */

export type TamanoDialogo = 'S' | 'M' | 'L';

/**
 * S · 420px — confirmaciones. Alto libre, nunca scroll.
 * M · 640px — formularios y calculadoras. Alto máximo 72vh.
 * L · 960px — visores y tablas. Alto fijo 80vh, cuerpo con scroll.
 *
 * El ancho lo decide el CONTENIDO, no el módulo: una confirmación de una línea
 * en un diálogo de 960px se lee como un error del programa.
 */
const ANCHO: Record<TamanoDialogo, string> = {
  S: 'max-w-[420px]',
  M: 'max-w-[640px] max-h-[72vh]',
  L: 'max-w-[960px] h-[80vh]'
};

interface DialogProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  /** Contexto, no instrucciones. Una línea. */
  subtitulo?: React.ReactNode;
  tamano?: TamanoDialogo;
  /**
   * Cuando hay cambios sin guardar, el clic en el velo no cierra: pregunta.
   * Es la diferencia entre un visor —del que no se pierde nada— y un formulario.
   */
  hayCambiosSinGuardar?: boolean;
  /** Se llama cuando el velo se toca con cambios pendientes. */
  onIntentoDeCerrarConCambios?: () => void;
  /** El cuerpo lleva fondo canvas cuando contiene tarjetas o filas. */
  cuerpoEnCanvas?: boolean;
  /** Texto de estado, a la izquierda del todo en el pie. */
  pieIzquierda?: React.ReactNode;
  /** Los botones. El primario va último: siempre abajo a la derecha. */
  acciones?: React.ReactNode;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  abierto,
  onCerrar,
  titulo,
  subtitulo,
  tamano = 'M',
  hayCambiosSinGuardar = false,
  onIntentoDeCerrarConCambios,
  cuerpoEnCanvas = false,
  pieIzquierda,
  acciones,
  children
}) => {
  const panel = useRef<HTMLDivElement>(null);
  const invocador = useRef<Element | null>(null);

  useEffect(() => {
    if (!abierto) return;

    /*
     * Se recuerda quién abrió el diálogo para devolverle el foco al cerrar.
     * Sin esto, quien navega con teclado vuelve al principio de la página y
     * tiene que recorrerla entera para llegar de nuevo al botón que pulsó.
     */
    invocador.current = document.activeElement;
    panel.current?.focus();

    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };

    document.addEventListener('keydown', alPulsar);

    // El fondo no se desplaza mientras hay un diálogo encima.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = overflowPrevio;
      (invocador.current as HTMLElement | null)?.focus?.();
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const alTocarElVelo = () => {
    if (hayCambiosSinGuardar) {
      onIntentoDeCerrarConCambios?.();
      return;
    }
    onCerrar();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      {/* Velo sin desenfoque: el fondo se atenúa, no se borra. */}
      <div
        className="absolute inset-0 bg-[rgb(16_24_34/0.42)]"
        onClick={alTocarElVelo}
        aria-hidden="true"
      />

      <div
        ref={panel}
        tabIndex={-1}
        className={`relative flex w-full ${ANCHO[tamano]} flex-col overflow-hidden rounded-card border border-line-200 bg-surface shadow-[0_16px_40px_-12px_rgb(16_24_34/0.3)] focus:outline-none`}
      >
        {/* ─── CABECERA · fija, nunca lleva controles ni pestañas ────────── */}
        <header className="flex shrink-0 items-start gap-3 border-b border-line-200 px-[18px] py-3.5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-subtitle text-ink-900">{titulo}</h2>
            {subtitulo && (
              <p className="mt-0.5 text-meta leading-[1.5] text-ink-500">{subtitulo}</p>
            )}
          </div>

          {/* La × siempre en el mismo píxel, en los once. */}
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-mr-1 -mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-control text-ink-400 hover:bg-canvas hover:text-ink-900"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* ─── CUERPO · la única zona que cambia por tipo ─────────────────── */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto p-[18px] ${
            cuerpoEnCanvas ? 'bg-canvas' : 'bg-surface'
          }`}
        >
          {children}
        </div>

        {/* ─── PIE · fijo. Un solo primario, siempre abajo a la derecha ───── */}
        {(acciones || pieIzquierda) && (
          <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-line-200 px-[18px] py-3">
            <span className="mr-auto text-meta text-ink-400">
              {pieIzquierda ?? (
                /* `Esc` cierra, y el pie lo dice: un atajo que nadie anuncia
                   no existe para quien no lo conoce de antes. */
                <span className="font-mono text-[11px]">Esc cierra</span>
              )}
            </span>
            {acciones}
          </footer>
        )}
      </div>
    </div>
  );
};
