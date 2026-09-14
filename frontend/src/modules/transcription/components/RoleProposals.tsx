import React from 'react';
import { ROLE_LABELS, type RoleProposal } from '../types';
import { marcaDeTiempo } from '../audienciaEnPantalla';

/**
 * Lo que la aplicación CREE que es una voz, y la frase que leyó para creerlo.
 *
 * La evidencia no es adorno. La diarización devuelve speaker_0 y speaker_1 y
 * nunca los nombra; estos roles se deducen de fórmulas procesales del
 * transcrito, y una cita o un apoderado leyendo el auto en voz alta disparan el
 * mismo marcador. Pintar «JUEZ» solo se vería exactamente como un hecho
 * verificado — por eso la frase viaja con la sugerencia y el abogado confirma
 * desde lo que se dijo, no desde nuestra confianza.
 *
 * VA DENTRO DE LA TARJETA DE CADA VOZ (artboard :287, «Rol sugerido: juez») y
 * no en un panel aparte: la decisión se toma donde está el selector del rol.
 * La maqueta la pinta en verde; aquí va en el azul suave de lo propuesto,
 * porque en este sistema el verde dice «comprobado» y una sugerencia es
 * justamente lo contrario.
 */
export const SugerenciaDeRol: React.FC<{ propuesta: RoleProposal; onConfirmar: () => void }> = ({
  propuesta,
  onConfirmar
}) => {
  const evidencia = propuesta.evidence[0];
  return (
    <div className="cn-aud-sugerencia">
      <span className="cn-aud-pildora cn-aud-pildora--sugerida">
        Rol sugerido: {ROLE_LABELS[propuesta.proposedRole].toLowerCase()}
      </span>
      {evidencia && (
        <p className="cn-aud-sugerencia-frase">
          «{evidencia.phrase}»
          {evidencia.atSeconds !== null && <span className="cn-aud-mono"> · {marcaDeTiempo(evidencia.atSeconds)}</span>}
        </p>
      )}
      <button type="button" className="cn-aud-accion cn-aud-accion--marca" onClick={onConfirmar}>
        Confirmar el rol
      </button>
    </div>
  );
};

/**
 * Avisa que un transcrito existe solo en esta pestaña. Artboard :248, «No se
 * pudo guardar el transcrito».
 *
 * SIN «INTENTAR GUARDAR DE NUEVO»: no hay reintento. La maqueta lo ofrece y el
 * servidor no tiene ruta para volver a guardar lo que ya respondió; un botón
 * que no hace nada en el único momento en que el abogado puede perder dos
 * horas de audiencia es la peor promesa de esta pantalla. Lo que sí sirve está
 * aquí: copiar el texto y exportar el acta, que no necesitan el guardado.
 *
 * Abre su propio alcance `.cara-nueva` porque la entrevista también lo monta.
 */
export const NotPersistedWarning: React.FC<{ onCopiar?: () => void; onExportar?: () => void }> = ({
  onCopiar,
  onExportar
}) => (
  <div className="cara-nueva cn-aud-aviso cn-aud-aviso--no-guardado" role="alert">
    <p className="cn-aud-aviso-titulo">No se pudo guardar el transcrito</p>
    <p className="cn-aud-aviso-texto">
      La transcripción se completó y está en pantalla, pero no pudo almacenarse: si cierra esta pestaña la pierde.{' '}
      <span className="cn-aud-fuerte">Copie el texto ahora{onExportar ? ' o exporte el acta' : ''}.</span> Mientras no
      esté guardado no se puede corregir ni dividir.
    </p>
    {(onCopiar || onExportar) && (
      <div className="cn-aud-aviso-botones">
        {onCopiar && (
          <button type="button" className="cn-ini-boton cn-aud-boton cn-aud-boton--peligro" onClick={onCopiar}>
            Copiar el texto
          </button>
        )}
        {onExportar && (
          <button type="button" className="cn-ini-boton cn-ini-boton--texto cn-aud-boton" onClick={onExportar}>
            Exportar el acta
          </button>
        )}
      </div>
    )}
  </div>
);
