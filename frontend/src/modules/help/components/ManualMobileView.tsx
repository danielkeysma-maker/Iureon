import React from 'react';
import { useEsEscritorio } from '../useEsEscritorio';
import { PaginaDelManual } from './PaginaDelManual';

/**
 * El manual en el teléfono (`public/handoff/app-manual-y-soporte.html`, :598).
 *
 * Es la MISMA página que el escritorio con `movil`: antes eran dos componentes
 * y este importaba los bloques del otro para no pintar los pasos como
 * párrafos. Con una sola página el manual no puede decir dos cosas según el
 * aparato.
 *
 * Se pinta únicamente por debajo de 1024 px, por la misma razón que
 * `ManualView` se pinta solo por encima.
 */

interface ManualMobileViewProps {
  onSoporte: () => void;
  /** Abre el módulo Novedades desde el índice. */
  onNovedades: () => void;
  /** Con id abre ese artículo: así Soporte entrega al lector en el teléfono. */
  articuloInicial?: string;
  onVisitaGuiada?: () => void;
}

export const ManualMobileView: React.FC<ManualMobileViewProps> = (props) => {
  const escritorio = useEsEscritorio();
  if (escritorio) return null;
  return <PaginaDelManual movil {...props} />;
};
