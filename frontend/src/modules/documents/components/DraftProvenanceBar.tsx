import React from 'react';
import { AlertTriangle, BadgeCheck, ExternalLink, FileQuestion } from 'lucide-react';
import type { ProcedenciaDelBorrador } from '../types';
import { esTituloDeTrabajo } from '../../catalog/tituloDeTrabajo';

/**
 * La barra de revisión del visor. Artboard 5a.
 *
 * ─── QUÉ DICE, Y POR QUÉ NO DICE LO QUE EL ARTBOARD PEDÍA LITERALMENTE ──────
 *
 * El diseño pide «Este borrador contiene 2 afirmaciones sin verificar», con
 * salto a cada una. **Ese conteo no existe**: nadie analiza el texto generado
 * frase por frase para clasificar afirmaciones, y una cifra inventada en la
 * pantalla donde se decide firmar sería la peor de las falsas alarmas — la que
 * enseña a ignorar todas las demás.
 *
 * Lo que el producto SÍ sabe, y con certeza, es contra qué ficha del catálogo
 * se redactó: su artículo, su fuente, si alguien comprobó el término y si la
 * propia firma la curó. Eso es exactamente lo que hay que revisar antes de
 * exportar, y es verdad. La barra dice eso.
 *
 * ─── TRES ESTADOS, Y EL SILENCIO ES UNO DE ELLOS ────────────────────────────
 *
 * Ámbar cuando el término de la ficha no está comprobado, o cuando la actuación
 * ni siquiera está catalogada. Verde discreto cuando la firma la curó — ese
 * rastro humano es el activo que la firma construye y merece verse. Y NADA
 * cuando la ficha viene verificada de fábrica y no hay nada que advertir: una
 * barra permanente que casi siempre dice «todo bien» se vuelve parte del marco
 * y deja de leerse el día que dice otra cosa.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · El salto «Ir a la 1.ª · 1/2» y las miniaturas con barra ámbar en el margen.
 *   Ambos necesitan afirmaciones localizadas dentro del texto, que es el dato
 *   que no existe. Sin él, el salto no tendría a dónde ir.
 * · Las casillas de exportación (membrete, anotar el margen, hoja de fuentes).
 *   La exportación hoy no acepta variantes; ofrecerlas aquí sería pintar
 *   interruptores que no mueven nada.
 */

interface DraftProvenanceBarProps {
  procedencia: ProcedenciaDelBorrador | null | undefined;
}

/*
 * EL ÁMBAR LLEVA GUION Y EL VERDE NO. En la cara nueva el borde discontinuo es
 * la señal de «sin verificar» (README-app §1): es lo que distingue los dos
 * estados en escala de grises, donde el ámbar y el verde se confunden.
 */
const AMBAR = 'cn-red-procedencia cn-red-procedencia--ambar';
const VERDE = 'cn-red-procedencia cn-red-procedencia--verde';

export const DraftProvenanceBar: React.FC<DraftProvenanceBarProps> = ({ procedencia }) => {
  /*
   * `undefined` es un borrador guardado antes de que esto existiera. No se
   * advierte nada: no sabemos que le falte respaldo, sabemos que no lo
   * registramos, y son cosas distintas.
   */
  if (procedencia === undefined) return null;

  if (procedencia === null) {
    return (
      <div className={AMBAR}>
        <FileQuestion className="cn-red-procedencia-icono" strokeWidth={1.8} aria-hidden />
        <p className="cn-red-procedencia-texto">
          <strong className="font-semibold">Esta actuación no está en el catálogo.</strong> El
          escrito se redactó sin ficha procesal que lo respalde: ningún término, artículo ni
          autoridad de los que aparecen abajo fue tomado de una fuente verificada. Revíselos contra
          la norma antes de exportar.
        </p>
      </div>
    );
  }

  const sinTermino = procedencia.termStatus === 'NO_VERIFICADO';
  const faltanArticulos = procedencia.seccionesSinArticulo > 0;
  /*
   * LA ACTUACIÓN ENTERA LA ESCRIBIÓ LA FIRMA. Es un hecho distinto de «el
   * término no está comprobado», y hay que decirlo aunque el término sí lo
   * esté: quien lo comprobó fue un colega, y ninguna norma verificada sostiene
   * el artículo ni la estructura del escrito. Con la ficha propia curada la
   * barra queda en verde, pero no en silencio.
   */
  const deLaFirma = procedencia.definidaPorLaFirma === true;
  /*
   * SIN NOMBRE DE ACTUACIÓN. Lo que se lee arriba no es una denominación
   * jurídica sino la descripción que escribió el abogado, y decirlo aquí es
   * obligatorio: esta barra es la última pantalla antes de exportar, y quien
   * lea «Sin nombre — que se levante el embargo» junto a un artículo podría
   * entender que el catálogo bautizó algo. No bautizó nada.
   */
  const esTitulo = deLaFirma && esTituloDeTrabajo(procedencia.exactName);

  if (!sinTermino && !faltanArticulos && !deLaFirma && !procedencia.curadaPorLaFirma) return null;

  const enAmbar = sinTermino || faltanArticulos;

  return (
    <div className={enAmbar ? AMBAR : VERDE}>
      {enAmbar ? (
        <AlertTriangle className="cn-red-procedencia-icono" strokeWidth={1.8} aria-hidden />
      ) : (
        <BadgeCheck className="cn-red-procedencia-icono" strokeWidth={1.8} aria-hidden />
      )}

      <div className="cn-red-procedencia-cuerpo">
        <p className="cn-red-procedencia-texto">
          Redactado contra <strong className="font-semibold">{procedencia.exactName}</strong> ·{' '}
          {procedencia.legalBasis}
          {procedencia.curadaPorLaFirma && procedencia.curadaPor && (
            <> · curada por {procedencia.curadaPor}</>
          )}
        </p>

        {deLaFirma && (
          <p className="cn-red-procedencia-texto">
            <strong className="font-semibold">
              {esTitulo
                ? 'Este escrito se redactó sin nombre de actuación.'
                : 'Esta actuación la añadió su firma: el catálogo no la trae.'}
            </strong>{' '}
            {esTitulo
              ? 'Lo de arriba es un título de trabajo escrito por usted, no la denominación jurídica de ninguna figura: ninguna ficha verificada respaldó este escrito, y la guía tuvo prohibido ponerle nombre, artículo o término.'
              : 'Ninguna norma verificada respalda su artículo ni su estructura, y la guía tuvo prohibido inventarlos.'}
          </p>
        )}

        {sinTermino && (
          <p className="cn-red-procedencia-texto">
            <strong className="font-semibold">Nadie ha comprobado el término de esta ficha.</strong>{' '}
            Si el escrito afirma un plazo, no viene del catálogo verificado: confírmelo contra la
            norma antes de exportar.
          </p>
        )}

        {faltanArticulos && (
          <p className="cn-red-procedencia-texto">
            {procedencia.seccionesSinArticulo} de {procedencia.seccionesTotales} secciones
            obligatorias no tienen artículo confirmado. Se le siguen exigiendo al escrito; lo que
            falta es la cita que las sostiene.
          </p>
        )}

        {procedencia.sourceUrl && (
          <a
            href={procedencia.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cn-red-procedencia-enlace"
          >
            <ExternalLink className="cn-red-procedencia-enlace-icono" strokeWidth={1.8} aria-hidden />
            Ver la norma en su fuente oficial
          </a>
        )}
      </div>
    </div>
  );
};
