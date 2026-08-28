import type { Actuacion } from './types';

/**
 * DE QUIÉN ES EL RELOJ QUE ABRE LA FICHA.
 *
 * EL DEFECTO QUE VIGILA. Es el característico de este catálogo y ya costó
 * cincuenta y nueve fichas: la entrada publica un plazo exacto, con su cita
 * real, y ese plazo es el de OTRO — el del juzgado para fallar, el de la
 * entidad para resolver, el de la contraparte para objetar — mientras calla el
 * que extingue el derecho del cliente. Es el peor error posible porque la ficha
 * es correcta y la cita es verdadera; solo está contestando otra pregunta.
 *
 * POR QUÉ HACE FALTA LEERLO EN CÓDIGO Y NO SOLO A OJO. Desde que Orientación
 * ordena las sugerencias por término más corto, el PRIMER plazo de la frase
 * decide qué actuación ve primero un abogado con prisa. Si ese primer plazo es
 * el de la autoridad, el orden es el de la autoridad. Se vio con la acción de
 * tutela: su término abre con «Dentro de los diez (10) días siguientes… el juez
 * proferirá el fallo», que es el plazo del juez, cuando para quien la interpone
 * la tutela no caduca.
 *
 * LA FALSA ALARMA ES PEOR QUE EL SILENCIO — la doctrina que dejó el detector de
 * voces fusionadas. Una acusación errónea enseña a ignorar todos los avisos, y
 * estas fichas ya pasaron verificación. Por eso solo se avisa cuando concurren
 * las DOS condiciones: el primer plazo pertenece a una oración cuyo sujeto es
 * la autoridad, Y la ficha no declara en ninguna parte de su primera mitad a
 * quién pertenece el reloj. Basta con que la ficha lo diga para que calle.
 */

export interface RelojSospechoso {
  branch: string;
  exactName: string;
  /** El fragmento donde aparece el primer plazo, para poder juzgarlo sin abrir el archivo. */
  fragmento: string;
  /** El verbo o sujeto de autoridad que disparó el aviso. */
  marcador: string;
}

/**
 * Las frases con que este catálogo declara de quién es el reloj. Cuando alguna
 * aparece, la ficha ya fue mirada por este defecto y el check calla.
 */
const DECLARA_EL_RELOJ = [
  'reloj del cliente',
  'reloj que hace perder',
  'reloj del titular',
  'reloj del contribuyente',
  'el plazo del cliente',
  'término del cliente',
  /*
   * Declarar que el reloj es de la AUTORIDAD también es declararlo. La primera
   * versión solo aceptaba «reloj de la autoridad, no», y por eso acusó a doce
   * fichas que abren exactamente así — «EL RELOJ DE LA AUTORIDAD: SETENTA (70)
   * DÍAS HÁBILES», «RELOJ DEL DESPACHO, DE CINCO DÍAS»— es decir, a las que
   * mejor hacen su trabajo. Una acusación contra la ficha honesta enseña a
   * ignorar el aviso entero.
   */
  'reloj de la autoridad',
  'reloj del despacho',
  'son del despacho',
  'plazo de la autoridad',
  'plazo del despacho'
];

/**
 * Sujetos y verbos que delatan que el plazo es de quien decide, no de quien
 * reclama. Se buscan en la ventana alrededor del primer plazo.
 */
const MARCADORES_DE_AUTORIDAD = [
  'el juez proferirá',
  'el juez deberá',
  'el juez resolverá',
  'el juez decidirá',
  'el juez dictará',
  'la autoridad deberá',
  'la autoridad resolverá',
  'la autoridad tendrá',
  'la administración deberá',
  'la administración tendrá',
  'la entidad deberá',
  'la entidad tendrá',
  'la entidad resolverá',
  'el despacho',
  'la dian tendrá',
  'la dian deberá',
  'el funcionario deberá',
  'para expedir y notificar',
  'para resolver el recurso',
  'para proferir',
  'proferirá el fallo',
  'deberá resolverse',
  'deberá decidirse'
];

/** El primer plazo de la descripción: su posición y el texto que lo rodea. */
const primerPlazo = (texto: string): { indice: number } | null => {
  const m = texto.match(/\(\d{1,4}\)\s*(días?|dias?|meses|mes|años?|anos?)/) ??
    texto.match(/\d{1,4}\s*(días?|dias?|meses|mes|años?|anos?)/);
  return m && m.index !== undefined ? { indice: m.index } : null;
};

/**
 * Revisa una ficha. Devuelve el aviso, o `null` cuando no hay nada que decir —
 * que es la respuesta esperada en la enorme mayoría de los casos.
 */
export const relojSospechoso = (a: Actuacion): RelojSospechoso | null => {
  if (a.term.status !== 'VERIFICADO') return null;

  /*
   * SOLO LAS DEL LITIGANTE. En una ficha que firma el DESPACHO o la
   * SECRETARÍA, el plazo de la autoridad ES el plazo de quien redacta: el
   * fallo disciplinario de primera instancia lo escribe el funcionario que
   * tiene los treinta días, y avisarle de que su ficha «publica el reloj de
   * otro» es avisarle de que su propio reloj no es suyo. El defecto que se
   * persigue solo existe cuando el que lee es quien reclama.
   */
  if (a.role !== 'LITIGANTE') return null;

  const descripcion = a.term.description;
  if (!descripcion) return null;

  const texto = descripcion.toLowerCase();

  // La ficha ya dice de quién es el reloj: fue mirada por esto. Se calla.
  if (DECLARA_EL_RELOJ.some((f) => texto.includes(f))) return null;

  const plazo = primerPlazo(texto);
  if (!plazo) return null;

  /*
   * La ventana: desde el comienzo de la oración que contiene el plazo hasta
   * poco después. El sujeto de un plazo va casi siempre antes del número
   * («la autoridad tendrá diez (10) días») o justo después («dentro de los
   * diez (10) días siguientes el juez proferirá»).
   */
  const desde = Math.max(0, plazo.indice - 160);
  const hasta = Math.min(texto.length, plazo.indice + 160);
  const ventana = texto.slice(desde, hasta);

  const marcador = MARCADORES_DE_AUTORIDAD.find((m) => ventana.includes(m));
  if (!marcador) return null;

  return {
    branch: a.branch,
    exactName: a.exactName,
    fragmento: descripcion.slice(desde, hasta).replace(/\s+/g, ' ').trim(),
    marcador
  };
};

/** Recorre el catálogo entero. */
export const relojesSospechosos = (actuaciones: Actuacion[]): RelojSospechoso[] =>
  actuaciones.map(relojSospechoso).filter((r): r is RelojSospechoso => r !== null);
