import React from 'react';
import { PenLine } from 'lucide-react';
import { sugerenciasDeInstruccion } from '../instruccionSugerida';
import type { Actuacion } from '../types';

/**
 * Qué pedirle al motor, antes de saltar a Redacción.
 *
 * ─── POR QUÉ ESTÁ AQUÍ Y NO EN REDACCIÓN ────────────────────────────────────
 *
 * Porque aquí es donde está la ficha. En cuanto el abogado pulsa «Redactar
 * esta», la actuación deja de viajar como objeto y se convierte en un nombre:
 * Redacción recibe la cadena y vuelve a resolverla, pero la pantalla de allá no
 * tiene delante ni las secciones exigidas ni la autoridad ni el término. El
 * único momento en que se puede armar una instrucción con datos verificados es
 * este, con la tarjeta abierta.
 *
 * ─── UNO SOLO PARA LAS DOS ORIENTACIONES ────────────────────────────────────
 *
 * Escritorio y teléfono comparten este componente a propósito. Dos copias se
 * desincronizan, y el síntoma sería el peor posible: que la sugerencia diga una
 * cosa en el computador y otra en el teléfono sobre la misma ficha.
 *
 * ─── ESCOGER ES OPCIONAL, Y ESO NO ES UN DETALLE ────────────────────────────
 *
 * Se puede llevar a Redacción sin instrucción ninguna: es como funciona el
 * camino de hoy y sigue siendo válido. Por eso el botón de llevar nunca se
 * deshabilita por tener el cuadro vacío — obligar a escoger convertiría una
 * ayuda en un peaje.
 */

interface PanelDeInstruccionProps {
  actuacion: Actuacion;
  /** Lo que el abogado escribió arriba. Viaja aparte de la instrucción. */
  hechos: string;
  /** Lleva actuación, rama, hechos e instrucción al taller de redacción. */
  onLlevar: (instruccion: string) => void;
  onCancelar: () => void;
  /** Objetivos de toque más grandes y una sola columna. */
  movil?: boolean;
}

export const PanelDeInstruccion: React.FC<PanelDeInstruccionProps> = ({
  actuacion,
  hechos,
  onLlevar,
  onCancelar,
  movil = false
}) => {
  const sugerencias = React.useMemo(
    () => sugerenciasDeInstruccion(actuacion, hechos),
    [actuacion, hechos]
  );

  const [texto, setTexto] = React.useState('');

  /*
   * `[overflow-wrap:anywhere]` EN LA RAÍZ. El nombre exacto de una actuación
   * puede traer un radicado o una palabra larguísima sin espacios, y en 320px
   * `break-words` no basta: se hereda desde aquí y cubre de una vez el párrafo,
   * los botones de sugerencia y el cuadro.
   */
  return (
    <div className="min-w-0 border-t border-line-100 bg-canvas px-4 py-3 [overflow-wrap:anywhere]">
      <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
        Qué pedirle al motor
      </p>
      {/*
        LA PROCEDENCIA, DICHA. Que el texto salga de la ficha y no de una
        plantilla es exactamente lo que lo hace confiable, y callarlo lo dejaría
        indistinguible de una redacción de la casa.
      */}
      <p className="mt-1 text-justify text-meta leading-[1.5] text-ink-500 [text-wrap:pretty]">
        Estas propuestas se arman con lo que la ficha del catálogo ya trae y con los hechos que
        usted escribió. Escoja una, edítela, escriba la suya, o siga sin ninguna.
      </p>

      <div className={`mt-2.5 flex flex-col gap-1.5 ${movil ? '' : 'sm:gap-1'}`}>
        {sugerencias.map((s) => {
          const elegida = s.texto === texto;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setTexto(elegida ? '' : s.texto)}
              aria-pressed={elegida}
              className={`min-w-0 rounded-control border px-3 text-left ${
                movil ? 'py-2.5' : 'py-2'
              } ${
                elegida
                  ? // `border-brand-line` NO existe: no hay token `brand.line` en la
                    // configuración de Tailwind y la clase no emite ninguna regla, así
                    // que el borde se quedaría en el gris por defecto. La forma que sí
                    // compila es la que usa `.btn-secondary`.
                    'border-[rgb(var(--brand-line))] bg-brand-50'
                  : 'border-line-200 bg-surface hover:bg-brand-50'
              }`}
            >
              <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                {s.titulo}
              </span>
              <span className="mt-0.5 block text-justify text-meta leading-[1.5] text-ink-900 [text-wrap:pretty]">
                {s.texto}
              </span>
            </button>
          );
        })}
      </div>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Opcional. Puede dejarlo vacío y decidirlo en Redacción."
        className={`field-area mt-2.5 w-full min-w-0 resize-none ${
          movil ? 'min-h-[96px]' : 'min-h-[80px]'
        }`}
      />

      <div className={`mt-2.5 flex flex-wrap items-center gap-1.5 ${movil ? 'gap-2' : ''}`}>
        <button
          type="button"
          onClick={() => onLlevar(texto.trim())}
          className={movil ? 'btn-primary h-11 flex-1' : 'btn-primary btn-sm'}
        >
          <PenLine className="h-3 w-3" />
          Llevar a Redacción
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className={movil ? 'btn-neutral h-11 px-4' : 'btn-neutral btn-sm'}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
