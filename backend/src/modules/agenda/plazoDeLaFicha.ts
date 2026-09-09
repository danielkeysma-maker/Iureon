import type { Actuacion } from '../catalog/types';
import type { TipoDeDias } from './types';

/**
 * LEER EL PLAZO DE UNA FICHA, O NEGARSE A LEERLO.
 *
 * ─── POR QUÉ ESTE ARCHIVO ES CASI TODO NEGATIVAS ────────────────────────────
 *
 * El término de una ficha es PROSA, no un número: «Admitida la demanda se corre
 * traslado al demandado por veinte (20) días para contestarla (art. 369)». De
 * 817 fichas verificadas, 141 nombran dos cantidades de días distintas, 63
 * nombran tres, y 270 mencionan además meses o años. En muchas, uno de esos
 * plazos es el del JUZGADO para fallar o el de la CONTRAPARTE para objetar —
 * el defecto característico de este catálogo, que ya costó cincuenta y nueve
 * fichas y tiene su propio guardián en `catalog/clockOwner.ts`.
 *
 * Un lector optimista tomaría el primer número que encuentre y devolvería una
 * fecha límite exacta, con cara de cálculo, construida sobre el reloj de otro.
 * Eso es exactamente lo que esta casa tiene prohibido: **jamás se inventa un
 * plazo**. Así que este lector solo responde cuando NO HAY NADA QUE
 * INTERPRETAR, y en cualquier otro caso devuelve por qué se niega — un texto
 * que la pantalla muestra tal cual, para que el abogado sepa qué mirar.
 *
 * ─── LAS CINCO NEGATIVAS ─────────────────────────────────────────────────────
 *
 * 1. El término no está VERIFICADO (o la ficha declara que no caduca).
 * 2. La ficha no expresa ningún plazo en días.
 * 3. La ficha nombra más de un plazo en días distinto.
 * 4. La ficha nombra además un plazo en meses o en años — el que extingue el
 *    derecho puede ser ese, y elegir el de días sería escoger por el abogado.
 * 5. La ficha dice «días» sin decir si son hábiles o de calendario y su norma
 *    no es el CGP —cuyo art. 118 ya lo resuelve—. Contarlos
 *    como hábiles da una fecha MÁS TARDÍA que la real si eran de calendario, y
 *    equivocarse hacia el lado cómodo es la peor forma de equivocarse aquí.
 *
 * Negarse no deja al abogado sin agenda: la pantalla le muestra el término
 * literal de la ficha y él escribe los días que lee ahí. La fecha se sigue
 * calculando con el motor; lo que cambia es que la entrada queda marcada como
 * NO verificada, porque el único que hizo esa lectura fue él.
 */

export interface PlazoLeido {
  dias: number;
  tipo: TipoDeDias;
  /** La frase de la ficha de la que salió, recortada, para poder comprobarlo. */
  evidencia: string;
}

export type LecturaDelPlazo =
  | { legible: true; plazo: PlazoLeido }
  | { legible: false; motivo: string };

/** Sin tildes y en minúscula, para que «DÍAS HÁBILES» y «días hábiles» sean lo mismo. */
const plano = (texto: string): string =>
  texto
    .toLowerCase()
    .normalize('NFD')
    /*
     * Los diacríticos van ESCAPADOS y no escritos como caracteres: una clase de
     * caracteres combinantes literal es invisible en un editor, se pierde en un
     * copiado y ya dejó una cicatriz en este repositorio — ocho marcadores de
     * roles quedaron con bytes 0x08 donde iba `\b` y no podían coincidir con
     * nada, compilando en verde.
     */
    .replace(/[\u0300-\u036f]/g, '');

/**
 * El catálogo escribe las cantidades en letra Y en cifra entre paréntesis
 * —«quince (15) dias habiles»—, que es la forma del lenguaje jurídico. Se lee
 * la cifra, que es la que no admite dos lecturas.
 */
const CANTIDAD_DE_DIAS = /\((\d{1,4})\)\s*dias(?:\s+(habiles|calendario|corrientes|comunes|continuos))?/g;

/** Un plazo en meses o años en la misma ficha: puede ser el reloj de verdad. */
const OTRA_UNIDAD = /\((\d{1,4})\)\s*(meses|anos|ano)\b/;

const CALENDARIO = new Set(['calendario', 'corrientes', 'comunes', 'continuos']);

/** Un trozo legible alrededor de la coincidencia, para que la afirmación se pueda comprobar. */
const fragmentoAlrededor = (texto: string, indice: number): string => {
  const desde = Math.max(0, indice - 90);
  const hasta = Math.min(texto.length, indice + 130);
  const trozo = texto.slice(desde, hasta).replace(/\s+/g, ' ').trim();
  return `${desde > 0 ? '…' : ''}${trozo}${hasta < texto.length ? '…' : ''}`;
};

/**
 * CUANDO LA FICHA DICE «DÍAS» A SECAS Y LA LEY YA LO RESOLVIÓ.
 *
 * El art. 118 del CGP dispone que en los términos de días no se cuentan los de
 * vacancia judicial ni aquellos en que el despacho permanezca cerrado: los días
 * de un término del CGP son hábiles POR LEY, no por costumbre. Así que cuando
 * la ficha se apoya en el propio Código General del Proceso, «días» sin
 * calificar no es una ambigüedad que haya que resolver adivinando — está
 * resuelta en el artículo, y esa es la única excepción a la quinta negativa.
 *
 * NO SE GENERALIZA A LAS DEMÁS RAMAS, y ahí está el límite: este catálogo cubre
 * veintiocho ramas, y en varias —aduanero, tributario, sancionatorio— «días»
 * puede ser calendario. Ciento doce fichas caen fuera de esta excepción y
 * siguen exigiendo que el abogado lea el término.
 */
const DIAS_HABILES_POR_LEY = /(codigo general del proceso|ley 1564)/;

export const leerPlazoDelTexto = (
  descripcion: string,
  /** El fundamento de la ficha, para saber si el art. 118 del CGP la gobierna. */
  legalBasis = ''
): LecturaDelPlazo => {
  const texto = plano(descripcion);

  const hallazgos: Array<{ dias: number; tipo: TipoDeDias | null; indice: number }> = [];
  CANTIDAD_DE_DIAS.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = CANTIDAD_DE_DIAS.exec(texto)) !== null) {
    const dias = Number(m[1]);
    if (!Number.isInteger(dias) || dias <= 0 || dias > 3650) continue;
    const calificador = m[2] ?? null;
    hallazgos.push({
      dias,
      tipo: calificador ? (CALENDARIO.has(calificador) ? 'CALENDARIO' : 'HABILES') : null,
      indice: m.index
    });
  }

  if (hallazgos.length === 0) {
    return { legible: false, motivo: 'La ficha no expresa su término como un número de días.' };
  }

  const distintos = new Set(hallazgos.map((h) => `${h.dias}·${h.tipo ?? '?'}`));
  if (distintos.size > 1) {
    return {
      legible: false,
      motivo:
        'La ficha nombra más de un plazo, y alguno puede ser el del despacho o el de la contraparte. Lea el término y escriba el que corre contra su cliente.'
    };
  }

  const unico = hallazgos[0];

  const otra = OTRA_UNIDAD.exec(texto);
  if (otra) {
    return {
      legible: false,
      motivo: `La ficha nombra también un plazo de ${otra[1]} ${otra[2] === 'meses' ? 'meses' : 'años'}, y el que extingue el derecho puede ser ese. Lea el término y escriba el que corre.`
    };
  }

  const porLey = DIAS_HABILES_POR_LEY.test(plano(legalBasis));

  if (unico.tipo === null && !porLey) {
    return {
      legible: false,
      motivo:
        'La ficha dice «días» sin precisar si son hábiles o de calendario, y su norma no es el CGP. Contarlos como hábiles daría una fecha más tardía que la real si fueran de calendario.'
    };
  }

  const evidencia = fragmentoAlrededor(descripcion, unico.indice);

  return {
    legible: true,
    plazo: {
      dias: unico.dias,
      tipo: unico.tipo ?? 'HABILES',
      evidencia:
        unico.tipo === null
          ? `${evidencia} — días hábiles por el art. 118 del CGP, que ordena no contar la vacancia ni los días de despacho cerrado.`
          : evidencia
    }
  };
};

/**
 * El plazo de una actuación del catálogo, o la razón por la que no se puede
 * leer. `null` es la actuación que no está catalogada.
 */
export const leerPlazoDeLaFicha = (actuacion: Actuacion | null): LecturaDelPlazo => {
  if (!actuacion) {
    return {
      legible: false,
      motivo: 'Esta actuación no está en el catálogo: ninguna norma verificada respalda su término.'
    };
  }

  if (actuacion.firmDefined) {
    return {
      legible: false,
      motivo:
        'Esta actuación la añadió su firma y nace sin norma verificada: nadie de esta casa leyó un artículo para ella.'
    };
  }

  if (actuacion.term.status === 'NO_CADUCA') {
    return {
      legible: false,
      motivo:
        'La ficha declara que esta actuación no caduca. Si aun así quiere vigilar una fecha, escríbala: no saldrá de la norma.'
    };
  }

  if (actuacion.term.status !== 'VERIFICADO' || !actuacion.term.description) {
    return {
      legible: false,
      motivo: 'Nadie ha comprobado el término de esta ficha. Escriba usted el plazo o la fecha, y quedará marcada como sin verificar.'
    };
  }

  return leerPlazoDelTexto(actuacion.term.description, actuacion.legalBasis);
};
