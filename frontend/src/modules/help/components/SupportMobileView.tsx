import React from 'react';
import { useEsEscritorio } from '../useEsEscritorio';
import { PaginaDeSoporte } from './SupportView';

/**
 * Soporte en el teléfono. No hay artboard de 375 px para esta pantalla: es la
 * misma página que el escritorio con `movil`, derivada del índice del manual
 * en el teléfono (`app-manual-y-soporte.html`, :598) —título de 26, tarjetas a
 * lo ancho, primario de 48 px—.
 *
 * Antes el chat vivía detrás de un botón «Abrir el chat» dentro de una tarjeta
 * de canal. Con la lista arriba ya no hace falta: lo primero que se ve es si le
 * respondieron.
 *
 * Se pinta únicamente por debajo de 1024 px: con las dos páginas montadas el
 * chat sondearía dos veces.
 */

interface SupportMobileViewProps {
  firma: string;
  correo: string;
  /** Con id abre ese artículo del manual; sin id, el índice. Igual que en escritorio. */
  onManual: (id?: string) => void;
}

export const SupportMobileView: React.FC<SupportMobileViewProps> = (props) => {
  const escritorio = useEsEscritorio();
  if (escritorio) return null;
  return <PaginaDeSoporte movil {...props} />;
};
