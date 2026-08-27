import type { BranchActuaciones } from '../catalog/hooks/useBranchActuaciones';

/**
 * Decides whether the selected document type has to be replaced.
 *
 * WHY THIS IS A FUNCTION AND NOT THREE LINES INSIDE THE EFFECT. It was three
 * lines inside the effect, and it silently discarded the filing a lawyer had
 * just chosen in Orientación. The effect ran while the catalogue was still in
 * flight, read the empty list as "this branch is not catalogued", fell back to
 * the hand-written options — which are never empty, because `legacyFor` retreats
 * to CONSTITUCIONAL — found the chosen filing missing from them, and replaced
 * it. By the time the real list arrived the choice was gone, and nothing on
 * screen said so.
 *
 * Pulled out here so the rule can be checked without rendering anything: the
 * defect was never in the JSX, it was in what counts as knowing.
 */
export const reemplazoDeTipoDeDocumento = (
  catalogo: BranchActuaciones,
  opciones: string[],
  actual: string
): string | null => {
  /*
   * CARGANDO NO ES VACÍA. Esta línea es el arreglo entero.
   *
   * Mientras el catálogo viene en camino no se sabe si la actuación elegida
   * pertenece a esta rama, y actuar sobre lo que no se sabe es lo que la perdía.
   * Esperar cuesta una fracción de segundo; equivocarse cuesta el escrito.
   */
  if (catalogo.estado === 'CARGANDO') return null;

  // Sin opciones no hay a qué mover: dejar lo que hay es mejor que vaciar el
  // selector y quedarse sin nada que enviarle al motor.
  if (opciones.length === 0) return null;

  // Y si lo elegido está en la lista, no se toca. Reasignarlo al primero
  // "por si acaso" es exactamente el defecto, con otra excusa.
  if (opciones.includes(actual)) return null;

  return opciones[0];
};
