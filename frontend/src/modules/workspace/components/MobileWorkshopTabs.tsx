import React from 'react';
import { FileText, PenLine } from 'lucide-react';

/**
 * El taller partido en dos pantallas. Artboard 4d, solo móvil.
 *
 * ─── POR QUÉ UN CONTROL Y NO SOLO EL SALTO AUTOMÁTICO ───────────────────────
 *
 * El artboard dice que «el documento generado se abre después como pantalla
 * propia», y así ocurre: al terminar de generar, la aplicación salta sola al
 * documento. Pero un salto sin camino de vuelta deja atrapado a quien quiere
 * corregir la instrucción y volver a generar — que es exactamente lo que se
 * hace después de leer un borrador. El salto es la conveniencia; este control
 * es la salida, y tiene que estar visible antes de necesitarla.
 *
 * ─── EL DOCUMENTO SE DESHABILITA HASTA QUE EXISTE ───────────────────────────
 *
 * Sin borrador no hay documento que ver, y una pestaña que lleva a una pantalla
 * vacía enseña que la aplicación a veces no responde. Se deshabilita y se dice
 * por qué en el propio rótulo — no se esconde: si desapareciera, el control
 * cambiaría de forma justo al generar, y un control que se mueve bajo el pulgar
 * es peor que uno apagado.
 */

export type VistaTaller = 'instruccion' | 'documento';

interface MobileWorkshopTabsProps {
  vista: VistaTaller;
  onCambiar: (v: VistaTaller) => void;
  hayBorrador: boolean;
}

export const MobileWorkshopTabs: React.FC<MobileWorkshopTabsProps> = ({
  vista,
  onCambiar,
  hayBorrador
}) => {
  const Pestana: React.FC<{
    id: VistaTaller;
    icono: React.ReactNode;
    children: React.ReactNode;
    deshabilitada?: boolean;
  }> = ({ id, icono, children, deshabilitada }) => {
    const activa = vista === id;
    return (
      <button
        type="button"
        onClick={() => onCambiar(id)}
        disabled={deshabilitada}
        aria-current={activa ? 'page' : undefined}
        className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 border-b-2 text-[12.5px] font-semibold ${
          activa
            ? 'border-brand-700 text-brand-700'
            : 'border-transparent text-ink-500 disabled:text-ink-400 disabled:opacity-60'
        }`}
      >
        {icono}
        {children}
      </button>
    );
  };

  return (
    <div className="flex shrink-0 border-b border-line-200 bg-surface lg:hidden">
      <Pestana id="instruccion" icono={<PenLine className="h-4 w-4" />}>
        Instrucción
      </Pestana>
      <Pestana
        id="documento"
        icono={<FileText className="h-4 w-4" />}
        deshabilitada={!hayBorrador}
      >
        {hayBorrador ? 'Documento' : 'Sin generar'}
      </Pestana>
    </div>
  );
};
