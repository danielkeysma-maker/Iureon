import React from 'react';
import { AlertTriangle, BadgeCheck, ExternalLink, FileQuestion } from 'lucide-react';
import type { ProcedenciaDelBorrador } from '../types';

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

const AMBAR =
  'border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] text-unverified';
const VERDE = 'border-[rgb(var(--verified-line))] bg-[rgb(var(--verified-surf))] text-verified';

export const DraftProvenanceBar: React.FC<DraftProvenanceBarProps> = ({ procedencia }) => {
  /*
   * `undefined` es un borrador guardado antes de que esto existiera. No se
   * advierte nada: no sabemos que le falte respaldo, sabemos que no lo
   * registramos, y son cosas distintas.
   */
  if (procedencia === undefined) return null;

  if (procedencia === null) {
    return (
      <div className={`flex items-start gap-2.5 rounded-card border px-4 py-2.5 ${AMBAR}`}>
        <FileQuestion className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="text-justify text-[12px] leading-snug [text-wrap:pretty]">
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

  if (!sinTermino && !faltanArticulos && !procedencia.curadaPorLaFirma) return null;

  const enAmbar = sinTermino || faltanArticulos;

  return (
    <div
      className={`flex items-start gap-2.5 rounded-card border px-4 py-2.5 ${enAmbar ? AMBAR : VERDE}`}
    >
      {enAmbar ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
      )}

      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-justify text-[12px] leading-snug [text-wrap:pretty]">
          Redactado contra <strong className="font-semibold">{procedencia.exactName}</strong> ·{' '}
          {procedencia.legalBasis}
          {procedencia.curadaPorLaFirma && procedencia.curadaPor && (
            <> · curada por {procedencia.curadaPor}</>
          )}
        </p>

        {sinTermino && (
          <p className="text-justify text-[12px] leading-snug [text-wrap:pretty]">
            <strong className="font-semibold">Nadie ha comprobado el término de esta ficha.</strong>{' '}
            Si el escrito afirma un plazo, no viene del catálogo verificado: confírmelo contra la
            norma antes de exportar.
          </p>
        )}

        {faltanArticulos && (
          <p className="text-justify text-[12px] leading-snug [text-wrap:pretty]">
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
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold underline underline-offset-2"
          >
            <ExternalLink className="h-3 w-3" />
            Ver la norma en su fuente oficial
          </a>
        )}
      </div>
    </div>
  );
};
