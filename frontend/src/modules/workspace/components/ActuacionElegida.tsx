import React from 'react';
import type { ActuacionLookup } from '../../catalog/hooks/useActuacion';
import { esTituloDeTrabajo } from '../../catalog/tituloDeTrabajo';
import { estadoDeLaFicha } from '../services/fichaEnLaLista';
import { EstadoDeLaFicha } from './SelectorEnCascada';

/**
 * La actuación ya elegida, plegada en una tarjeta. Artboard «Redactar un
 * escrito», paso 1 (líneas 676–755 de `public/handoff/app-redaccion-revision.html`).
 *
 * ─── POR QUÉ SE PLIEGA ─────────────────────────────────────────────────────
 *
 * Con la actuación puesta, los tres selectores ya no dicen nada nuevo y ocupan
 * el sitio de lo que sí importa antes de escribir: con qué término se va a
 * redactar. La tarjeta lo dice entero y «Cambiar» vuelve a abrir la cascada.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · «Término y artículo comprobados». Lo que el catálogo marca como verificado
 *   es el TÉRMINO; el artículo que se pinta al lado sale del fundamento en
 *   prosa. La píldora dice «art. N · término verificado», que es lo cierto.
 * · «Del catálogo de Iureon». Cuando la ficha es de la firma, la píldora ya lo
 *   dice («de su firma, sin norma verificada»); en el caso normal sería una
 *   etiqueta que repite lo obvio en todas las tarjetas.
 *
 * El término va en letra de lectura y entero, no en mono ni recortado: es un
 * párrafo con salvedades, y se guarda con mayúsculas a propósito en la frase
 * que importa. Pasarlo a minúscula rompería siglas y nombres propios.
 */

interface ActuacionElegidaProps {
  quienFirma: string;
  rama: string;
  documentType: string;
  ficha: ActuacionLookup;
  onCambiar: () => void;
}

export const ActuacionElegida: React.FC<ActuacionElegidaProps> = ({ quienFirma, rama, documentType, ficha, onCambiar }) => {
  const actuacion = ficha.actuacion;
  return (
    <div className="cn-red-elegida">
      <div className="cn-red-elegida-cabeza">
        <div className="cn-red-elegida-textos">
          <p className="cn-red-elegida-contexto">
            {quienFirma} · {rama}
          </p>
          <p className="cn-red-elegida-nombre">{documentType}</p>
        </div>
        <button type="button" onClick={onCambiar} className="cn-red-elegida-cambiar">
          Cambiar
        </button>
      </div>

      {ficha.estado !== 'CARGANDO' && (
        <div className="cn-red-elegida-detalle">
          {ficha.estado === 'ENCONTRADA' && actuacion ? (
            <>
              <EstadoDeLaFicha estado={estadoDeLaFicha(actuacion, esTituloDeTrabajo(actuacion.exactName))} />
              {actuacion.term.status === 'NO_VERIFICADO' ? (
                <p className="cn-red-elegida-termino">
                  Nadie ha comprobado el término de esta ficha: si el escrito afirma un plazo, no vendrá del catálogo verificado.
                </p>
              ) : (
                <p className="cn-red-elegida-termino">
                  <span className="cn-red-elegida-rotulo">{actuacion.term.status === 'NO_CADUCA' ? 'No caduca. ' : 'Término. '}</span>
                  {actuacion.term.description}
                </p>
              )}
            </>
          ) : (
            <span className="cn-red-estado cn-red-estado--sin">sin catalogar</span>
          )}
        </div>
      )}
    </div>
  );
};
