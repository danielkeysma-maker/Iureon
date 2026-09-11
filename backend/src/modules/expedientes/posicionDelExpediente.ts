import type { PapelEnElExpediente } from './types';
import { esPapelRepresentable } from '../agent/review/posicionProcesal';

/**
 * A QUIÉN REPRESENTA LA FIRMA EN ESTE EXPEDIENTE, DEDUCIDO DE LO YA REGISTRADO.
 *
 * ─── POR QUÉ EXISTE ────────────────────────────────────────────────────────
 *
 * Al leer un documento recibido se le pregunta al abogado a quién representa,
 * y esa respuesta gobierna si una carga es suya o de la contraparte. Pero si
 * el documento pertenece a un expediente, LA APLICACIÓN YA LO SABE: el
 * expediente tiene su cliente y sus actores, y uno de esos actores ES el
 * cliente. Volver a preguntarlo es pedirle un dato que él ya escribió.
 *
 * ─── DEDUCE, Y SI DUDA NO DEDUCE ───────────────────────────────────────────
 *
 * Dos reglas, en orden, y ninguna adivina:
 *
 *   1. EL ACTOR QUE ES EL CLIENTE. Si un actor está atado al mismo cliente que
 *      el expediente, su papel es la posición. Es la única señal que no
 *      depende de un valor por defecto: alguien tuvo que escoger ese cliente
 *      a mano, dos veces.
 *
 *   2. EL ÚNICO PROPIO REPRESENTABLE. Sin esa atadura, sirve que haya
 *      EXACTAMENTE UNO: un actor de lado propio cuyo papel se pueda
 *      representar. Con dos o más no se deduce nada.
 *
 * Y la segunda regla necesita ese «exactamente uno» por una razón concreta:
 * EL CAMPO «DE QUÉ LADO» NACE EN «DE MI LADO». Quien registre al demandante y
 * al demandado sin tocarlo deja a los dos como propios, y quedarse con el
 * primero elegiría la posición contraria la mitad de las veces — con toda la
 * seguridad del mundo, que es la peor forma de equivocarse aquí.
 *
 * ─── LO QUE DEVUELVE NO ES UNA ORDEN ───────────────────────────────────────
 *
 * Es una sugerencia para PRELLENAR el desplegable. El abogado lo ve y puede
 * cambiarlo antes de pedir el informe: un caso con dos demandados, uno propio
 * y otro no, lo sabe él y no la tabla.
 */

/** Lo mínimo que hace falta de un actor para deducir. */
export interface ActorParaDeducir {
  papel: PapelEnElExpediente;
  lado: 'PROPIO' | 'CONTRARIO' | 'NEUTRAL';
  clienteId: string | null;
}

export const posicionSegunElExpediente = (
  actores: readonly ActorParaDeducir[],
  clienteDelExpediente: string | null
): PapelEnElExpediente | null => {
  /* 1. El actor que ES el cliente del expediente. */
  if (clienteDelExpediente) {
    const delCliente = actores.filter((a) => a.clienteId === clienteDelExpediente);
    /*
     * Si el mismo cliente está registrado dos veces con papeles distintos, no
     * hay una respuesta: se calla, igual que en todo lo demás.
     */
    const papeles = new Set(delCliente.map((a) => a.papel));
    if (papeles.size === 1) {
      const papel = delCliente[0].papel;
      if (esPapelRepresentable(papel)) return papel;
    }
    if (delCliente.length > 0) return null;
  }

  /* 2. El único actor propio con papel representable. */
  const propios = actores.filter((a) => a.lado === 'PROPIO' && esPapelRepresentable(a.papel));
  /*
   * `DESCONOCIDO` es representable —es la opción «prefiero no decirlo»— pero
   * deducirlo no dice nada, y además compite con un propio de verdad. Se
   * descarta antes de contar.
   */
  const utiles = propios.filter((a) => a.papel !== 'DESCONOCIDO');
  if (utiles.length !== 1) return null;

  return utiles[0].papel;
};
