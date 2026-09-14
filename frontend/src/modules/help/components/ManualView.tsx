import React from 'react';
import { useEsEscritorio } from '../useEsEscritorio';
import { PaginaDelManual } from './PaginaDelManual';

/**
 * El manual en el escritorio. La página entera vive en `PaginaDelManual`, la
 * misma que monta el teléfono; aquí solo se decide que es el ancho grande.
 *
 * Se pinta únicamente desde 1024 px: `App` monta también la versión del
 * teléfono y la esconde con CSS, y dos páginas vivas pedirían dos veces el
 * registro de lectura y escucharían dos veces el sello de versión.
 */

interface ManualViewProps {
  /** Article to open on mount — how Soporte hands a reader to the manual. */
  articuloInicial?: string;
  onSoporte: () => void;
  /** Launches the guided tour. Absent = no invitation. */
  onVisitaGuiada?: () => void;
}

export const ManualView: React.FC<ManualViewProps> = (props) => {
  const escritorio = useEsEscritorio();
  if (!escritorio) return null;
  return <PaginaDelManual movil={false} {...props} />;
};
