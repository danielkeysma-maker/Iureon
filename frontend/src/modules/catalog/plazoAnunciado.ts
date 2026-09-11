/**
 * ¿ESTE DOCUMENTO ANUNCIA UN PLAZO?
 *
 * ─── EL AGUJERO QUE ESTO TAPA ──────────────────────────────────────────────
 *
 * Orientación acepta adjuntar «el oficio, la demanda o la notificación», y su
 * texto cae dentro del cuadro de hechos. Eso está bien: el abogado tiene el
 * papel, no un resumen.
 *
 * Pero Orientación NO LEE PLAZOS. Devuelve actuaciones del catálogo con el
 * término de la NORMA, y su instrucción le prohíbe expresamente al modelo
 * afirmar términos. Así que quien adjunta aquí un auto que dice «subsane
 * dentro de los cinco (5) días siguientes» recibe una lista de actuaciones
 * correcta y SE VA SIN EL NÚMERO CINCO.
 *
 * Hay otra puerta que sí lo lee —«Revisiones» → «Un documento que recibí»—, y
 * desde fuera las dos se ven igual de razonables. La corta pierde el reloj.
 *
 * ─── POR QUÉ NO SE AVISA SIEMPRE QUE SE ADJUNTA ALGO ───────────────────────
 *
 * Un aviso que sale en cada adjunto es papel tapiz a la tercera vez, y después
 * no lo lee nadie ni siquiera el día que importa. Solo se avisa cuando el
 * documento ADJUNTADO anuncia un término, y el aviso lo CITA: la frase que
 * disparó el aviso va entre comillas, para que el abogado juzgue en un segundo
 * si le interesa en vez de creerle a la aplicación.
 *
 * ─── LO QUE DISTINGUE UN PLAZO DE UNA DURACIÓN, Y ES TODO EL DISEÑO ────────
 *
 * «El arrendatario lleva tres (3) meses sin pagar» es un HECHO. «Contéstese
 * dentro de los veinte (20) días» es un PLAZO. Los dos son un número y una
 * unidad de tiempo, y un detector que solo busque eso salta en cada demanda
 * de restitución del mundo — es decir, se vuelve papel tapiz por la puerta de
 * atrás, que es justo lo que se quiso evitar.
 *
 * Lo que los separa es la PREPOSICIÓN que introduce el término: «dentro de»,
 * «en el término de», «so pena de». Por eso el número nunca se busca solo:
 * se busca DESPUÉS de una de esas fórmulas y cerca de ella.
 *
 * Sin red y sin modelo: es una lectura de texto en el navegador. Avisar de un
 * plazo no puede costar saldo, porque entonces el aviso tendría que ganarse su
 * precio y volveríamos a mostrarlo siempre.
 */

/**
 * Las fórmulas con que una providencia colombiana abre un término.
 *
 * `so pena de` no introduce el plazo sino su castigo, y va aquí de todas
 * formas: donde aparece, el plazo está a un renglón. Es la frase que convierte
 * un requerimiento en una trampa, así que perderla sería perder el peor caso.
 */
const FORMULAS: RegExp[] = [
  /* «dentro de los cinco (5) dias», «dentro de las cuarenta y ocho horas» */
  /\bdentro\s+de\s+l[oa]s\b/g,
  /*
   * TODA LA FAMILIA DEL «TERMINO», Y NO COMO CADENAS LITERALES.
   *
   * La primera version las listaba a mano —«en el termino de», «por el
   * termino de»— y el guarda destapo enseguida los dos huecos: «SE CONCEDE el
   * termino de diez dias», que no empieza por ninguna preposicion, y «dentro
   * del termino IMPRORROGABLE de cinco (5) dias», donde el juez mete un
   * adjetivo en medio. Una lista de frases exactas nunca termina: el castellano
   * forense intercala lo que quiera.
   *
   * Se ancla en la palabra que de verdad marca el termino —«termino» o
   * «plazo»— y se toleran hasta dos palabras antes del «de».
   */
  /\b(?:termino|plazo)\s+(?:[a-z]+\s+){0,2}?de\b/g,
  /* El castigo, que siempre viaja pegado al plazo. */
  /\bso\s+pena\s+de\b/g
];

/**
 * Números escritos con letra, porque una providencia los escribe así antes de
 * repetirlos en cifra: «cinco (5) días». Basta con reconocer una de las dos
 * formas, y los dígitos ya entran por `\d`.
 */
const EN_LETRA =
  'un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieciseis|diecisiete|dieciocho|diecinueve|veinte|veinticuatro|treinta|sesenta|noventa';

const UNIDADES = 'horas?|dias?|meses|mes|anos?|semanas?';

/**
 * El número y su unidad, con lo que puede meterse en medio: la cifra entre
 * paréntesis —«cinco (5) días»— y los adjetivos que una providencia intercala
 * («hábiles» va después, pero «improrrogables» puede ir antes de la unidad).
 */
const NUMERO_Y_UNIDAD = new RegExp(
  `\\b(?:${EN_LETRA}|\\d{1,3})\\b[^.;]{0,20}?\\b(?:${UNIDADES})\\b`,
  'i'
);

/**
 * Cuánto texto puede haber entre la fórmula y el número antes de dejar de
 * creer que van juntos.
 *
 * VEINTE, Y BAJÓ DESDE TREINTA POR UN CASO CONCRETO. «El término de duración
 * del contrato es de cinco (5) años» tiene la fórmula y tiene la cifra, y es
 * un hecho de un arrendamiento, no un plazo procesal. Con treinta caracteres
 * de holgura la cifra entraba; con veinte queda fuera, y no se pierde ningún
 * término de verdad: en una providencia el número va pegado a la fórmula.
 */
const CERCANIA = 20;

/** Lo que se le muestra al abogado: la frase, recortada para que quepa. */
const MAXIMO_DE_CITA = 140;

const sinTildes = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/**
 * SE BUSCA SOBRE EL TEXTO YA COMPUESTO, Y ESO NO ES UN DETALLE.
 *
 * La cita se recorta del texto con sus tildes, usando los indices que devolvio
 * la busqueda sin ellas. Eso solo vale si las dos cadenas miden lo mismo, y
 * `sinTildes` conserva la longitud UNICAMENTE si entra compuesto: «a» acentuada
 * son un caracter, se descompone en dos y vuelve a uno al quitar la marca.
 *
 * Un PDF puede venir ya descompuesto —la «a» y su tilde como dos caracteres—, y
 * entonces quitar la marca ACORTA la cadena: los indices se corren una posicion
 * por cada tilde anterior, y la cita saldria desplazada, cortando palabras por
 * la mitad. Se ve raro y no falla, que es la peor forma de tener un defecto.
 *
 * Por eso se compone primero, una sola vez, y todo lo demas trabaja sobre eso.
 */
const compuesto = (s: string): string => s.normalize('NFC');

/**
 * NO ES UN PLAZO SI MIRA HACIA ATRAS. «El despido ocurrio dentro de los seis
 * (6) meses anteriores» tiene la misma forma que un termino y es un hecho: la
 * fecha de algo que ya paso, acotada. Avisar ahi mandaria al abogado a leer un
 * plazo que no existe, y a la tercera vez el aviso deja de leerse.
 */
const HACIA_ATRAS = /^[^.;]{0,15}?\b(anterior(es)?|precedentes?|previos?)\b/i;

/**
 * Recorta sin partir palabras. Un corte a media palabra —«a la notificación de
 * este au»— es pequeño y caro: la cita es lo único que sostiene el aviso, y una
 * cita rota se lee como que la aplicación no leyó bien el documento.
 */
const hastaLaUltimaPalabra = (s: string): string => {
  if (s.length <= MAXIMO_DE_CITA) return s;
  const cortado = s.slice(0, MAXIMO_DE_CITA);
  const espacio = cortado.lastIndexOf(' ');
  return `${(espacio > 20 ? cortado.slice(0, espacio) : cortado).trimEnd()}…`;
};

const citaDesde = (original: string, desde: number, hasta: number): string => {
  /*
   * Se lee un poco más allá del número para que la cita tenga sentido sola:
   * «dentro de los cinco (5) días» a secas no dice siguientes a qué.
   */
  const trozo = original.slice(desde, Math.min(hasta + 60, original.length));
  /* Se corta en el primer punto: más allá empieza otra orden, y confunde. */
  const punto = trozo.search(/[.;\n]/);
  if (punto > 20) return hastaLaUltimaPalabra(trozo.slice(0, punto).replace(/\s+/g, ' ').trim());
  /*
   * Sin punto a la vista, el trozo termina donde lo cortamos nosotros y casi
   * siempre a media palabra: se retrocede a la última completa y se declara
   * con puntos suspensivos que la frase sigue.
   */
  const limpio = trozo.replace(/\s+/g, ' ').trim();
  const espacio = limpio.lastIndexOf(' ');
  const entero = espacio > 20 ? `${limpio.slice(0, espacio)}…` : limpio;
  return hastaLaUltimaPalabra(entero);
};

/**
 * Devuelve la frase con que el documento anuncia un término, o `null` si no
 * anuncia ninguno.
 *
 * Se queda con la PRIMERA, no con todas: el aviso existe para mandar a leer el
 * documento entero en la otra pantalla, no para hacer aquí ese trabajo a
 * medias. Enumerar tres plazos sin decir de quién es cada uno sería repetir el
 * defecto que la posición procesal acaba de cerrar en el informe.
 */
export const plazoAnunciado = (textoCrudo: string): string | null => {
  if (!textoCrudo) return null;
  const texto = compuesto(textoCrudo);
  const plano = sinTildes(texto);

  /*
   * SE RECORREN TODAS LAS FÓRMULAS Y SE GANA POR POSICIÓN, no por orden de
   * lista. Devolver la primera fórmula que acertara daría la cita de «dentro
   * de los» en la página nueve por delante de «en el término de» en el primer
   * renglón — y el abogado leería un plazo perdido en el cuerpo del auto
   * mientras el importante, el de la parte resolutiva, queda sin citar. Es un
   * defecto invisible: la cita sale, es real, y es la equivocada.
   */
  let mejor: { desde: number; hasta: number } | null = null;

  for (const formula of FORMULAS) {
    formula.lastIndex = 0;
    let f: RegExpExecArray | null;
    while ((f = formula.exec(plano)) !== null) {
      const i = f.index;
      const finFormula = i + f[0].length;
      if (mejor && i > mejor.desde) continue;

      const ventana = plano.slice(finFormula, finFormula + CERCANIA + 25);
      const m = NUMERO_Y_UNIDAD.exec(ventana);
      /*
       * El numero tiene que estar PEGADO a la formula. «dentro de los
       * linderos del predio, que mide cinco (5) metros» no es un plazo, y
       * «el termino de duracion del contrato es de cinco (5) anos» tampoco:
       * en los dos, la cifra queda lejos de la formula.
       */
      if (!m || m.index > CERCANIA) continue;

      const finNumero = finFormula + m.index + m[0].length;
      if (HACIA_ATRAS.test(plano.slice(finNumero))) continue;

      if (!mejor || i < mejor.desde) mejor = { desde: i, hasta: finNumero };
    }
  }

  return mejor ? citaDesde(texto, mejor.desde, mejor.hasta) : null;
};
