import React from 'react';
import type { Actuacion } from '../types';

/**
 * «Verificar una actuación del catálogo». Artboard 4, tercera tarjeta, de
 * `public/handoff/app-buscador-catalogo.html`.
 *
 * Solo aparece cuando el término está SIN VERIFICAR, y dice lo que de verdad
 * pasa al anotarlo: queda para toda la firma, con el nombre y la fecha de quien
 * lo anotó (`catalog_verifications` guarda `verifiedBy` y `verifiedAt`). La
 * ficha prestada lo dice con su límite —solo para esta rama— y la actuación de
 * la firma, con el suyo: ninguna norma la respalda hasta que alguien la lea.
 *
 * El fondo es ámbar y no discontinuo: el discontinuo marca un DATO sin
 * verificar; esto es una invitación a verificarlo.
 */
interface Props {
  actuacion: Actuacion;
  onAnotar: () => void;
}

export const InvitacionAVerificar: React.FC<Props> = ({ actuacion, onAnotar }) => {
  if (actuacion.term.status !== 'NO_VERIFICADO') return null;

  const texto = actuacion.porRemision
    ? 'Esta ficha no tiene término verificado para esta rama. Si usted lo lee en el texto oficial y lo anota aquí, queda verificado solo para esta rama, para toda su firma, con su nombre y la fecha. El de la rama de origen no cambia.'
    : actuacion.firmDefined
      ? 'Su firma añadió esta actuación y ninguna norma verificada la respalda. Si usted lee su término en el texto oficial y lo anota aquí con la fuente, deja de advertirse en esta lista y en Redacción.'
      : 'Esta ficha no tiene término verificado. Si usted lo lee en el texto oficial y lo anota aquí, queda verificado para toda su firma, con su nombre y la fecha.';

  return (
    <div className="cn-cat-invitacion">
      <h3 className="cn-cat-invitacion-titulo">Verificar esta actuación</h3>
      <p>{texto}</p>
      <div className="cn-cat-acciones">
        {actuacion.sourceUrl && (
          <a href={actuacion.sourceUrl} target="_blank" rel="noopener noreferrer" className="cn-cat-boton cn-cat-boton--blanco">
            Abrir el texto oficial
          </a>
        )}
        <button type="button" onClick={onAnotar} className="cn-cat-boton cn-cat-boton--ambar">
          Anotar el término y la fuente
        </button>
      </div>
    </div>
  );
};
