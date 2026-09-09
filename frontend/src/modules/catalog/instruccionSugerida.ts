import type { Actuacion } from './types';

/**
 * Sugerencias de instrucción: qué pedirle al motor de redacción.
 *
 * ─── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 *
 * De Orientación a Redacción viajaban los HECHOS y nada más. El abogado llegaba
 * al cuadro «Qué debe hacer este escrito» con su propia historia ya escrita y
 * sin saber qué añadirle: el cuadro pide hechos, pretensión y «lo que quiere que
 * sostenga», y lo tercero es justo lo que un abogado que acaba de descubrir la
 * actuación todavía no sabe formular. La ficha del catálogo sí lo sabe —trae el
 * nombre exacto, la base legal, la autoridad, el término y las secciones que
 * exige— y hasta hoy esa información moría en la tarjeta de Orientación.
 *
 * ─── LA REGLA QUE GOBIERNA ESTE ARCHIVO ─────────────────────────────────────
 *
 * AQUÍ NO SE ESCRIBE DERECHO. Ni un artículo, ni un plazo, ni una autoridad, ni
 * una figura salen de la memoria de nadie: cada dato jurídico que aparece en una
 * sugerencia es una CITA LITERAL de un campo de la ficha que el catálogo acaba
 * de devolver. Lo único que este módulo aporta es lenguaje de procedimiento
 * —«redacte», «con los hechos que se indican», «incluya las secciones»— que no
 * afirma nada sobre el ordenamiento.
 *
 * DE AHÍ SALE LA SEGUNDA REGLA: si la ficha no trae el dato, la línea que lo
 * usaría NO SE PINTA. Nada de rellenos, nada de valores por defecto, nada de
 * «según la ley aplicable». Una ficha incompleta produce una sugerencia más
 * corta, nunca una sugerencia inventada.
 *
 * Y LA TERCERA: los datos de la ficha se ATRIBUYEN, no se afirman. La frase es
 * «la ficha del catálogo registra …», no «el término es …». La diferencia
 * importa porque el motor de redacción lee esto como instrucción del abogado, y
 * una instrucción que afirma derecho le enseña a darlo por sentado.
 *
 * ─── POR QUÉ SON VARIAS Y POR QUÉ SE PUEDEN EDITAR ──────────────────────────
 *
 * No hay una instrucción correcta: hay decisiones sobre cuánto contexto quiere
 * el abogado que el motor tenga delante. Se ofrecen como punto de partida
 * editable y NUNCA se imponen — la instrucción vacía sigue siendo válida, que es
 * como funciona el camino de hoy.
 */

/** Una sugerencia de instrucción, lista para mostrarse y para editarse. */
export interface InstruccionSugerida {
  /** Estable, para la lista de la interfaz. */
  id: 'completa' | 'con-sustento' | 'escueta';
  /** El rótulo corto que la distingue en la lista. */
  titulo: string;
  /** Lo que se copia al cuadro. Puede editarse antes de viajar. */
  texto: string;
}

/**
 * Cierra con punto lo que se cita de la ficha, sin duplicarlo.
 *
 * Los campos del catálogo no siguen una convención: unos terminan en punto y
 * otros no, así que añadirlo siempre producía «… (art. 318)..». Un punto doble
 * es cosmético, pero en un texto que el abogado va a leer como si viniera del
 * catálogo cualquier descuido de forma le resta crédito a lo que sí es exacto.
 */
const cerrar = (valor: string): string => (/[.;:!?]$/.test(valor) ? valor : `${valor}.`);

/** Une renglones dejando fuera los que la ficha no permitió escribir. */
const parrafo = (lineas: Array<string | null>): string =>
  lineas.filter((l): l is string => Boolean(l)).join(' ');

/**
 * La primera línea, común a las tres. Nombra la actuación TAL CUAL la trae el
 * catálogo —ese nombre es el contrato con el motor de redacción— y remite a los
 * hechos solo si el abogado escribió alguno.
 */
const apertura = (a: Actuacion, hayHechos: boolean): string =>
  hayHechos
    ? `Redacte «${a.exactName}» con los hechos que se indican en este mismo cuadro.`
    : `Redacte «${a.exactName}».`;

/**
 * Las secciones que la ficha marca obligatorias, en su propio orden.
 *
 * Son las mismas que el motor le exige al escrito, así que nombrarlas aquí no
 * añade una exigencia: hace visible la que ya se aplica. Sin secciones
 * obligatorias no hay línea.
 */
const lineaDeSecciones = (a: Actuacion): string | null => {
  const nombres = (a.requiredSections ?? [])
    .filter((s) => s.mandatory && s.name?.trim())
    .map((s) => s.name.trim());

  if (nombres.length === 0) return null;

  return `Incluya las secciones que la ficha del catálogo exige: ${cerrar(nombres.join('; '))}`;
};

/** La autoridad, cuando la ficha la trae. Se nombra como destinatario. */
const lineaDeAutoridad = (a: Actuacion): string | null =>
  a.competentAuthority?.trim()
    ? `Diríjalo a la autoridad que registra la ficha: ${cerrar(a.competentAuthority.trim())}`
    : null;

/** La base legal, cuando la ficha la trae. */
const lineaDeNorma = (a: Actuacion): string | null =>
  a.legalBasis?.trim()
    ? `Fundaméntelo en la norma que registra la ficha: ${cerrar(a.legalBasis.trim())}`
    : null;

/**
 * El término, y SOLO si está verificado.
 *
 * `NO_VERIFICADO` significa que nadie lo comprobó, así que llevarlo a la
 * instrucción sería pedirle al motor que construya el escrito sobre un plazo que
 * el propio catálogo no sostiene. `NO_CADUCA` tampoco se escribe: «no aplica
 * término» no es una instrucción, es la ausencia de una.
 */
const lineaDeTermino = (a: Actuacion): string | null =>
  a.term?.status === 'VERIFICADO' && a.term.description?.trim()
    ? `Tenga presente el término que registra la ficha: ${cerrar(a.term.description.trim())}`
    : null;

/**
 * Construye las sugerencias para una actuación y unos hechos.
 *
 * Devuelve entre una y tres. Nunca cero: la escueta se puede escribir con el
 * solo nombre exacto, que toda ficha tiene. Y nunca dos iguales — con una ficha
 * sin autoridad, sin secciones, sin norma y sin término verificado, las tres
 * variantes colapsan en el mismo texto y se entrega una sola: ofrecer tres
 * opciones idénticas haría creer que la ficha aportó algo que no aportó.
 */
export const sugerenciasDeInstruccion = (
  actuacion: Actuacion | null | undefined,
  hechos: string
): InstruccionSugerida[] => {
  if (!actuacion?.exactName?.trim()) return [];

  const hayHechos = hechos.trim().length > 0;
  const inicio = apertura(actuacion, hayHechos);

  const candidatas: InstruccionSugerida[] = [
    {
      id: 'completa',
      titulo: 'Con las secciones y la autoridad',
      texto: parrafo([inicio, lineaDeSecciones(actuacion), lineaDeAutoridad(actuacion)])
    },
    {
      id: 'con-sustento',
      titulo: 'Con la norma y el término',
      texto: parrafo([inicio, lineaDeNorma(actuacion), lineaDeTermino(actuacion)])
    },
    {
      id: 'escueta',
      titulo: 'Solo el encargo',
      texto: inicio
    }
  ];

  const vistos = new Set<string>();
  return candidatas.filter((c) => {
    if (vistos.has(c.texto)) return false;
    vistos.add(c.texto);
    return true;
  });
};

/**
 * Compone lo que se escribe en el cuadro «Qué debe hacer este escrito».
 *
 * REDACCIÓN TIENE UN SOLO CUADRO, y esa es la razón de esta función. La
 * instrucción y los hechos son dos cosas distintas —una dice qué hacer, la otra
 * qué ocurrió— y el destino es un único textarea, así que la única forma de no
 * perder ninguna de las dos es escribirlas SEPARADAS y ROTULADAS. Concatenarlas
 * sin más las volvería un párrafo en el que el motor no puede distinguir el
 * encargo del relato.
 *
 * SIN INSTRUCCIÓN SE CONSERVA EL CAMINO DE HOY, al pie de la letra: viajan los
 * hechos solos, sin rótulo y sin añadidos. Un rótulo nuevo sobre el texto de
 * siempre cambiaría lo que el motor recibe en el flujo que ya funciona.
 */
export const componerCuadroDeRedaccion = (instruccion: string, hechos: string): string => {
  const enc = instruccion.trim();
  const rel = hechos.trim();

  if (!enc) return rel;
  if (!rel) return enc;

  return `${enc}\n\nHECHOS\n${rel}`;
};
