import type { Actuacion } from './types';

/**
 * LA AUDITORÍA ESCRITA DENTRO DEL DATO.
 *
 * EL DEFECTO QUE VIGILA. Una pasada de verificación encontró que una ficha
 * omitía algo, y la corrección se escribió como PROSA DENTRO DEL CAMPO `term`,
 * en la forma «Efecto que la ficha omite: …» o «Reforma vigente que la ficha no
 * advierte: …». El contenido de esas frases es correcto y está verificado. El
 * problema es dónde vive: `term` es lo que el motor de redacción le entrega al
 * modelo como derecho aplicable, así que le estábamos pasando un reporte de
 * auditoría en vez de una regla. El modelo no distingue entre «el plazo es de
 * tres días» y «la ficha omite que el plazo es de tres días».
 *
 * ES «PROSA NO ES PARCHE» SOBREVIVIENDO EN OTRO SITIO. El proyecto ya aprendió
 * esa lección cuando los agentes de verificación escribían la corrección en
 * prosa dentro de fichas marcadas correctas, y de ahí salieron el veredicto
 * INCOMPLETO y el campo de corrección estructurado. Lo que no se vio entonces
 * es que la misma prosa también se había filtrado al dato publicado.
 *
 * POR QUÉ NO FALLA, SOLO AVISA. Igual que el detector de relojes: son fichas ya
 * verificadas, cuyo contenido es cierto, y arreglarlas es reescribir el término
 * afirmando la norma. Una lista que falla el día que se descubre convierte el
 * hallazgo en un bloqueo; una lista que avisa lo convierte en trabajo medible.
 *
 * CÓMO SE ARREGLA UNA. No borrando la frase: doblándola. «Efecto que la ficha
 * omite: pedida la aclaración, la providencia solo quedará ejecutoriada una vez
 * resuelta la solicitud» se reescribe como «EFECTO QUE DESPLAZA LA EJECUTORIA:
 * pedida la aclaración, la providencia solo quedará ejecutoriada una vez
 * resuelta la solicitud». Misma norma, sin el andamio del auditor.
 */

export interface FichaConProsaDeAuditoria {
  branch: string;
  exactName: string;
  /** El marcador que disparó el aviso, para juzgarlo sin abrir el archivo. */
  marcador: string;
  /** El fragmento donde aparece, con su contexto. */
  fragmento: string;
}

/**
 * Las formas en que este catálogo narró un defecto en vez de afirmar la norma.
 *
 * Son deliberadamente literales y no genéricas: buscar «omite» a secas marcaría
 * fichas que hablan legítimamente de una omisión del deudor o de la autoridad —
 * «la omisión injustificada de enviar esas pruebas acarreará responsabilidad»
 * es derecho, no auditoría. Lo que delata al auditor es que el sujeto de la
 * frase sea LA FICHA.
 */
const MARCADORES: readonly RegExp[] = [
  /\bla ficha omite\b/i,
  /*
   * Cualquier «que la ficha no …». Se generaliza a propósito: probada la
   * variedad de formas que usó el auditor —«no advierte», «no dice», «no
   * trae»—, enumerarlas era perseguir sinónimos. Lo que delata al auditor no
   * es el verbo sino el SUJETO: en el derecho colombiano nada se predica de
   * «la ficha», que es una categoría de este catálogo y no del ordenamiento.
   */
  /\bque la ficha no\b/i,
  /\bla ficha no lo advierte\b/i,
  /\bfalta el inciso\b/i,
  /\bfalta tambi[eé]n\b/i,
  /\bla ficha remite\b/i,
  /\bcorrecci[oó]n a la ficha\b/i,
  /\bnota de verificaci[oó]n\b/i,
];

const CONTEXTO = 110;

const fragmentoDe = (texto: string, indice: number): string => {
  const inicio = Math.max(0, indice - 20);
  return texto.slice(inicio, inicio + CONTEXTO).replace(/\s+/g, ' ').trim();
};

/**
 * Devuelve las fichas cuyo término publicado narra un defecto de la propia
 * ficha en lugar de afirmar la norma.
 */
export const detectarProsaDeAuditoria = (
  actuaciones: readonly Actuacion[]
): FichaConProsaDeAuditoria[] => {
  const hallazgos: FichaConProsaDeAuditoria[] = [];

  for (const actuacion of actuaciones) {
    const termino = actuacion.term?.description;
    if (!termino) continue;

    for (const marcador of MARCADORES) {
      const encontrado = marcador.exec(termino);
      if (!encontrado) continue;
      hallazgos.push({
        branch: actuacion.branch,
        exactName: actuacion.exactName,
        marcador: encontrado[0],
        fragmento: fragmentoDe(termino, encontrado.index),
      });
      break;
    }
  }

  return hallazgos;
};
