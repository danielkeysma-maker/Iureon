/**
 * La rama de un escrito es la del CASO, no la del cliente.
 *
 * Funciones puras y sin React, para que `check:redaccion-cara` las pruebe sin
 * montar el asistente.
 *
 * ─── POR QUÉ EL CASO Y NO EL CLIENTE ───────────────────────────────────────
 *
 * Un mismo cliente puede tener un proceso laboral y otro de familia: su rama no
 * dice nada del escrito. El expediente sí, porque es UN asunto con UNA
 * autoridad. Por eso, al escoger el caso, su rama se propone — y solo se
 * propone: el abogado sigue siendo quien decide.
 *
 * ─── CUÁNDO SE PROPONE Y CUÁNDO SE CALLA ───────────────────────────────────
 *
 *  · Solo si todavía no hay actuación elegida. Cambiar la rama con una
 *    actuación puesta la soltaría (la regla de `WorkshopConfigBar`), y el
 *    abogado perdería una elección que hizo a propósito por otra que nadie hizo.
 *  · Solo si la rama del caso es un código que el catálogo conoce. El campo del
 *    expediente es texto libre; proponer algo que no está en la lista dejaría el
 *    selector de rama apuntando a una rama inexistente.
 *  · Un caso sin rama no cambia nada.
 *
 * Y el desacuerdo se dice sin bloquear: puede haber razones para redactar en
 * otra rama (una tutela dentro de un proceso laboral), pero redactar en otra
 * sin saberlo es resolver la actuación contra la ficha equivocada.
 */

const conocida = (rama: string | null | undefined, etiquetas: Readonly<Record<string, string>>): rama is string =>
  Boolean(rama) && Object.prototype.hasOwnProperty.call(etiquetas, rama as string);

/** La rama que conviene poner al escoger un caso, o `null` si no hay que tocar nada. */
export const ramaAlElegirCaso = (
  ramaDelCaso: string | null | undefined,
  ramaElegida: string,
  hayActuacion: boolean,
  etiquetas: Readonly<Record<string, string>>
): string | null => {
  if (!conocida(ramaDelCaso, etiquetas)) return null;
  if (hayActuacion || ramaDelCaso === ramaElegida) return null;
  return ramaDelCaso;
};

export interface DesacuerdoDeRama {
  delCaso: string;
  texto: string;
  boton: string;
}

/** El aviso cuando el escrito se redacta en una rama distinta de la del caso. */
export const desacuerdoDeRama = (
  ramaDelCaso: string | null | undefined,
  ramaElegida: string,
  etiquetas: Readonly<Record<string, string>>
): DesacuerdoDeRama | null => {
  if (!conocida(ramaDelCaso, etiquetas) || ramaDelCaso === ramaElegida) return null;
  const delCaso = etiquetas[ramaDelCaso];
  const elegida = etiquetas[ramaElegida] ?? ramaElegida;
  return {
    delCaso: ramaDelCaso,
    texto: `Este caso está registrado en ${delCaso}; el escrito se está redactando en ${elegida}.`,
    boton: `Usar ${delCaso}`
  };
};
