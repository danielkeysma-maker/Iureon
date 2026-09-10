/**
 * EL CEDAZO DE CITAS: lee el TEXTO QUE SALIÓ del modelo y lo compara contra el
 * universo de artículos que alguien de esta casa leyó contra la norma.
 *
 * ─── POR QUÉ EXISTE, Y POR QUÉ NO BASTABA EL PROMPT ─────────────────────────
 *
 * El 9 de septiembre de 2026, sobre «Demanda de restitución de inmueble
 * arrendado», el motor citó 29 artículos con `reasoning_effort: 'low'` y 28 con
 * `'medium'`. La ficha autoriza siete. Veintitrés y veintidós quedaron fuera, y
 * el esfuerzo de razonamiento no movió la cifra. La regla de citación llevaba un
 * mes intacta en `catalogGuidance.ts` mientras todo lo de al lado se endurecía.
 *
 * La casa ya sabe que una regla dura no vive en el prompt. El término no
 * verificado no se sostiene porque la instrucción esté bien escrita: se sostiene
 * porque `verification.validate.ts` RECHAZA al escribir una ficha NO_VERIFICADO
 * con descripción, y porque `documentReview.ts:puntosDeAtaque` FILTRA en código
 * todo punto que llegue sin cita. Este módulo es la pieza equivalente para las
 * normas del borrador, y hasta hoy no existía.
 *
 * ─── LO QUE ESTE CEDAZO PUEDE PROBAR, Y LO QUE NO ───────────────────────────
 *
 * PUEDE, y por eso está en código: que un número de artículo esté fuera del
 * conjunto autorizado; que una cita venga con glosa entre paréntesis; que una
 * glosa agregada cubra varios artículos de un golpe; que se prediquen contenidos
 * («el artículo N establece que…»); que se atribuya un efecto jurídico colgado
 * de una cita («su autenticidad se presume conforme al artículo 244»).
 *
 * NO PUEDE, y hay que decirlo aquí para que nadie lo venda como verificado:
 *
 *   · LA IMPERTINENCIA. El art. 590 citado donde no se piden cautelares está
 *     autorizado y pasa limpio. Es un defecto distinto y menor —un artículo real
 *     mal traído se discute en audiencia; uno inventado se pierde— pero existe, y
 *     lo agrava poner una lista de andamiaje delante del modelo.
 *   · LA AFIRMACIÓN SIN NÚMERO. «La ley exige restituir el inmueble al terminar
 *     el contrato» es la misma afirmación sin comprobar y sin rastro citable.
 *     Ninguna expresión regular la ve. Está prohibida en la regla del prompt y
 *     aquí se declara invisible, en vez de fingir que se vigila.
 *   · LA DISYUNTIVA CERRADA y LA CONCLUSIÓN QUE CUELGA DE UN CORCHETE. Se
 *     midieron, están prohibidas arriba, y no se cazan aquí: la banda de cuantía
 *     y el `$[•]` que la sostiene cayeron en frases distintas, y una regla que
 *     los persiga por cercanía acusa en falso al escrito que hace lo correcto.
 *
 * ─── LA FALSA ALARMA ES PEOR QUE EL SILENCIO ────────────────────────────────
 *
 * Cada detector de aquí está escrito para callar cuando duda. Una acusación
 * errónea en la pantalla donde se decide firmar enseña a ignorar todos los
 * avisos, que es exactamente lo que `catalogGuidance.ts` se niega a hacer cuando
 * rehúsa contar «2 afirmaciones sin verificar» sobre un texto que nadie analizó.
 * Por eso: cuando el código de la norma no se puede determinar y el número existe
 * en el conjunto autorizado bajo cualquier código, se da por autorizado; y toda
 * glosa aparente que venga seguida de una transcripción entre comillas se deja
 * pasar, porque transcribir es justo lo que la regla pide.
 */

/** Un artículo, ya reducido a su forma comparable. */
export interface ReferenciaNormativa {
  /** Clave canónica del código o la ley. Ver `canonizarNorma`. */
  codigo: string;
  articulo: number;
}

export type ClaseDeHallazgo =
  | 'CITA_FUERA_DE_LO_AUTORIZADO'
  | 'NORMA_FUERA_DE_LO_AUTORIZADO'
  | 'GLOSA_EN_PARENTESIS'
  | 'GLOSA_AGREGADA'
  | 'CONTENIDO_PREDICADO'
  | 'EFECTO_ATRIBUIDO';

export interface HallazgoDeCitacion {
  clase: ClaseDeHallazgo;
  /** La frase literal del escrito. Sin ella el hallazgo no se reporta. */
  fragmento: string;
  /** Qué se citó, cuando el hallazgo es sobre una cita concreta. */
  referencia?: ReferenciaNormativa;
}

/*
 * ─── CÓDIGOS ───────────────────────────────────────────────────────────────
 *
 * El catálogo nombra la misma norma de dos maneras («Ley 1564 de 2012» en 132
 * fichas y «Código General del Proceso» en 39), y el escrito la nombra de cinco.
 * Sin esta tabla, «art. 82 del CGP» y «art. 82 de la Ley 1564 de 2012» son dos
 * artículos distintos y el cedazo acusa en falso a la mitad del escrito.
 *
 * Las abreviaturas ambiguas quedan FUERA a propósito: «C.C.» es cédula de
 * ciudadanía en nueve de cada diez escritos colombianos y «C.P.» es a la vez
 * Constitución Política y Código Penal. Adivinarlas produce falsas alarmas, que
 * es el único resultado peor que no mirar.
 */
const CODIGOS: Array<{ re: RegExp; clave: string; etiqueta: string }> = [
  {
    re: /ley\s*1564\s*de\s*2012|c[óo]digo\s+general\s+del\s+proceso|\bc\.?\s?g\.?\s?p\.?(?![a-z])/gi,
    clave: 'CGP',
    etiqueta: 'Ley 1564 de 2012 (CGP)'
  },
  {
    re: /ley\s*1437\s*de\s*2011|\bcpaca\b|c[óo]digo\s+de\s+procedimiento\s+administrativo/gi,
    clave: 'CPACA',
    etiqueta: 'Ley 1437 de 2011 (CPACA)'
  },
  { re: /c[óo]digo\s+civil/gi, clave: 'CODIGO CIVIL', etiqueta: 'Código Civil' },
  {
    re: /c[óo]digo\s+sustantivo\s+del\s+trabajo|\bcst\b/gi,
    clave: 'CODIGO SUSTANTIVO DEL TRABAJO',
    etiqueta: 'Código Sustantivo del Trabajo'
  },
  { re: /c[óo]digo\s+de\s+comercio/gi, clave: 'CODIGO DE COMERCIO', etiqueta: 'Código de Comercio' },
  { re: /c[óo]digo\s+penal/gi, clave: 'CODIGO PENAL', etiqueta: 'Código Penal' },
  {
    re: /constituci[óo]n\s+pol[íi]tica/gi,
    clave: 'CONSTITUCION POLITICA',
    etiqueta: 'Constitución Política'
  }
];

/** «Ley 820 de 2003», «Decreto Ley 2591 de 1991». Cualquier norma con año. */
const NORMA_CON_ANIO = /\b(ley|decreto(?:\s+ley)?)\s*(\d{1,5})\s*de\s*(\d{4})/gi;

const sinTildes = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Reduce cualquier forma de nombrar una norma a una clave comparable.
 * Devuelve null cuando el texto no nombra ninguna.
 */
export const canonizarNorma = (texto: string): string | null => {
  for (const c of CODIGOS) {
    c.re.lastIndex = 0;
    if (c.re.test(texto)) return c.clave;
  }
  NORMA_CON_ANIO.lastIndex = 0;
  const m = NORMA_CON_ANIO.exec(texto);
  if (m) return `${sinTildes(m[1]).toUpperCase().replace(/\s+/g, ' ').replace('DECRETO LEY', 'DECRETO')} ${m[2]} DE ${m[3]}`;
  return null;
};

/** Cómo se escribe una clave canónica cuando se le muestra al modelo. */
export const etiquetaDeNorma = (clave: string): string =>
  CODIGOS.find((c) => c.clave === clave)?.etiqueta ??
  clave
    .toLowerCase()
    .replace(/^(ley|decreto)/, (s) => s[0].toUpperCase() + s.slice(1))
    .replace(/\bde\b/, 'de');

export const claveDe = (r: ReferenciaNormativa): string => `${r.codigo}|${r.articulo}`;

/*
 * ─── EXTRACCIÓN ────────────────────────────────────────────────────────────
 */

interface Marca {
  indice: number;
  clave: string;
}

const marcasDeNorma = (texto: string): Marca[] => {
  const out: Marca[] = [];
  for (const c of CODIGOS) {
    const re = new RegExp(c.re.source, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(texto))) out.push({ indice: m.index, clave: c.clave });
  }
  const re = new RegExp(NORMA_CON_ANIO.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    const clave = canonizarNorma(m[0]);
    if (clave) out.push({ indice: m.index, clave });
  }
  return out.sort((a, b) => a.indice - b.indice);
};

const CABEZA_DE_ARTICULO = /\b(?:art[íi]culos?|arts?\.)\s*/gi;

/**
 * Lee la cola de una cita («82, 84 y 90», «384 num. 2», «1613 y siguientes») y
 * devuelve SOLO los números de artículo.
 *
 * Los numerales se descartan explícitamente: «art. 384 num. 2» es un artículo,
 * no dos, y contar el 2 como artículo 2 del CGP produciría una acusación falsa
 * en el escrito que hace exactamente lo que la ficha pide.
 */
const numerosDeLaCola = (cola: string): Array<{ n: number; desplazamiento: number }> => {
  const out: Array<{ n: number; desplazamiento: number }> = [];
  let i = 0;
  let vivo = true;
  while (vivo && i < cola.length) {
    const resto = cola.slice(i);
    const numeral = /^(?:n[uú]ms?\.|numerales?|inciso|incisos|literal(?:es)?|par[áa]grafos?)\s*[\d\s,ye]*/i.exec(resto);
    if (numeral) {
      i += numeral[0].length;
      continue;
    }
    const numero = /^(\d{1,4})/.exec(resto);
    if (numero) {
      out.push({ n: Number(numero[1]), desplazamiento: i });
      i += numero[1].length;
      continue;
    }
    const separador = /^(?:\s*(?:,|;|\by\b|\be\b)\s*)/i.exec(resto);
    if (separador) {
      i += separador[0].length;
      continue;
    }
    vivo = false;
  }
  return out;
};

interface MencionDeArticulo {
  articulo: number;
  indice: number;
}

const mencionesDeArticulo = (texto: string): MencionDeArticulo[] => {
  const out: MencionDeArticulo[] = [];
  const re = new RegExp(CABEZA_DE_ARTICULO.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    const inicio = m.index + m[0].length;
    for (const { n, desplazamiento } of numerosDeLaCola(texto.slice(inicio, inicio + 160))) {
      out.push({ articulo: n, indice: inicio + desplazamiento });
    }
  }
  return out;
};

/**
 * A qué norma pertenece cada artículo citado.
 *
 * En el español jurídico el código va DESPUÉS («los artículos 368 y 369 del
 * Código General del Proceso»), así que se prefiere la marca posterior — pero
 * SOLO dentro de la misma oración.
 *
 * Esa última condición la puso el check, y la puso fallando. Sin ella, el
 * «artículo 2035 del Código Civil» del párrafo 1 se atribuía a la «Ley 820 de
 * 2003» que abre el párrafo 2, y el «artículo 244» a la «Ley 2213 de 2022» del
 * párrafo siguiente: el cedazo veía citas fuera de la lista, sí, pero le ponía a
 * cada una la norma equivocada. Un aviso con el código cambiado es una falsa
 * alarma con apariencia de dato duro.
 *
 * Hacia atrás no se exige oración: «conforme al artículo 244 del mismo estatuto»
 * y «el artículo 84 ibidem» remiten de verdad a un código nombrado párrafos
 * antes, y cortar ahí dejaría sin identificar la mitad de las citas de cualquier
 * escrito bien redactado.
 */
const MISMA_ORACION = /^[^.;\n]*$/;

const normaDeLaMencion = (
  mencion: MencionDeArticulo,
  marcas: Marca[],
  texto: string
): string | null => {
  const posterior = marcas.find(
    (x) =>
      x.indice >= mencion.indice &&
      x.indice - mencion.indice <= 90 &&
      MISMA_ORACION.test(texto.slice(mencion.indice, x.indice))
  );
  if (posterior) return posterior.clave;
  const anteriores = marcas.filter((x) => x.indice < mencion.indice);
  const anterior = anteriores[anteriores.length - 1];
  if (anterior && mencion.indice - anterior.indice <= 400) return anterior.clave;
  return null;
};

const recorte = (texto: string, indice: number, largo = 110): string =>
  texto
    .slice(Math.max(0, indice - 45), Math.min(texto.length, indice + largo))
    .replace(/\s+/g, ' ')
    .trim();

/*
 * ─── LAS GLOSAS ────────────────────────────────────────────────────────────
 */

/** Una transcripción entre comillas cerca de la cita la deja pasar: transcribir es lo que se pide. */
const hayTranscripcionCerca = (texto: string, desde: number, hasta: number): boolean =>
  /[«"“][^«»"”]{12,}[»"”]/.test(texto.slice(desde, hasta + 140));

const PALABRA = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{3,}/g;

/** El paréntesis que resume el artículo: «artículo 2005 (obligación de restituir…)». */
const glosasEnParentesis = (texto: string): HallazgoDeCitacion[] => {
  const out: HallazgoDeCitacion[] = [];
  const re = /\b(?:art[íi]culos?|arts?\.)\s*\d{1,4}[^()\n]{0,45}?\(([^)\n]{8,220})\)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    const dentro = m[1];
    // Un paréntesis que empieza en número es «veinte (20) días», no una glosa.
    if (/^\s*\d/.test(dentro)) continue;
    // Puntero estructural, no descripción de contenido.
    if (/^\s*(?:n[uú]ms?\.|numeral|inciso|literal|par[áa]grafo|arts?\.|art[íi]culos?|ib[íi]dem|supra|infra|f\.?\s*\d)/i.test(dentro)) continue;
    // El nombre de la propia norma no describe lo que el artículo dice.
    if (canonizarNorma(dentro) && dentro.trim().length <= 40) continue;
    if ((dentro.match(PALABRA) ?? []).length < 3) continue;
    if (hayTranscripcionCerca(texto, m.index, m.index + m[0].length)) continue;
    out.push({ clase: 'GLOSA_EN_PARENTESIS', fragmento: recorte(texto, m.index, m[0].length + 20) });
  }
  return out;
};

/** La glosa que cubre varios de un golpe: «sus artículos 8, 9, 22 y 35, sobre las obligaciones…». */
const glosasAgregadas = (texto: string): HallazgoDeCitacion[] => {
  const out: HallazgoDeCitacion[] = [];
  const re =
    /\b(?:art[íi]culos|arts\.)\s*\d{1,4}(?:\s*(?:,|;|\by\b|\be\b)\s*\d{1,4})+[^.;\n]{0,30}?,\s*(?:sobre|en\s+materia\s+de|relativos?\s+a|referentes?\s+a|que\s+regulan?|que\s+consagran?|que\s+establecen?)\s+\S/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    if (hayTranscripcionCerca(texto, m.index, m.index + m[0].length)) continue;
    out.push({ clase: 'GLOSA_AGREGADA', fragmento: recorte(texto, m.index, m[0].length + 60) });
  }
  return out;
};

/** «el artículo N establece que…» sin tener el texto delante. */
const contenidosPredicados = (texto: string): HallazgoDeCitacion[] => {
  const out: HallazgoDeCitacion[] = [];
  const re =
    /\b(?:art[íi]culos?|arts?\.)\s*\d{1,4}[^.;:\n]{0,70}?\b(?:dispone|disponen|establece|establecen|se[ñn]ala|se[ñn]alan|prev[ée]|prev[ée]n|precept[úu]a|consagra|consagran|exige|exigen|ordena|ordenan|regula|regulan|define|definen|contempla|contemplan|autoriza|autorizan|obliga|obligan)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    if (hayTranscripcionCerca(texto, m.index, m.index + m[0].length)) continue;
    out.push({ clase: 'CONTENIDO_PREDICADO', fragmento: recorte(texto, m.index, m[0].length + 60) });
  }
  return out;
};

/** «su autenticidad se presume conforme al artículo 244». El efecto va sin paréntesis. */
const efectosAtribuidos = (texto: string): HallazgoDeCitacion[] => {
  const out: HallazgoDeCitacion[] = [];
  const re =
    /\b(?:se\s+presumen?|se\s+entiende[nr]?[áa]?|se\s+declarar[áa]|se\s+tendr[áa]\s+por|queda(?:n)?\s+sin\s+efecto|es\s+ineficaz|so\s+pena\s+de)\b[^.;\n]{0,90}?\b(?:conforme\s+a\s*l?|seg[úu]n\s+e?l?|en\s+virtud\s+de\s*l?|de\s+conformidad\s+con\s+e?l?|con\s+fundamento\s+en\s+e?l?)\s*(?:art[íi]culos?|arts?\.)\s*\d{1,4}/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) {
    if (hayTranscripcionCerca(texto, m.index, m.index + m[0].length)) continue;
    out.push({ clase: 'EFECTO_ATRIBUIDO', fragmento: recorte(texto, m.index, m[0].length + 20) });
  }
  return out;
};

/*
 * ─── EL CEDAZO ─────────────────────────────────────────────────────────────
 */

export interface ResultadoDelCedazo {
  hallazgos: HallazgoDeCitacion[];
  /** Cuántas citas distintas quedaron fuera del universo autorizado. */
  citasFueraDeLaLista: number;
  /** Cuántos artículos distintos citó el escrito en total. */
  articulosCitados: number;
}

/**
 * Compara el texto entregado contra el universo autorizado (ficha ∪ andamiaje).
 *
 * `autorizados` es el conjunto que YA viaja resuelto con el borrador; este
 * módulo no lo deduce ni lo adivina, porque un cedazo que se construye su propio
 * patrón de medida acaba certificando el defecto que vigila.
 */
export const revisarCitacionNormativa = (
  texto: string,
  autorizados: ReferenciaNormativa[]
): ResultadoDelCedazo => {
  const permitidas = new Set(autorizados.map(claveDe));
  const numerosPermitidos = new Set(autorizados.map((a) => a.articulo));
  const codigosPermitidos = new Set(autorizados.map((a) => a.codigo));

  const marcas = marcasDeNorma(texto);
  const hallazgos: HallazgoDeCitacion[] = [];
  const yaReportadas = new Set<string>();
  const vistas = new Set<string>();

  for (const mencion of mencionesDeArticulo(texto)) {
    const codigo = normaDeLaMencion(mencion, marcas, texto);
    vistas.add(`${codigo ?? '?'}|${mencion.articulo}`);

    if (codigo === null) {
      /*
       * Sin código no se acusa si el número existe autorizado bajo cualquiera:
       * el «artículo 384» suelto de un escrito de restitución es el 384 del CGP
       * en el 100% de los casos, y acusarlo sería la falsa alarma que enseña a
       * ignorar la pantalla entera.
       */
      if (numerosPermitidos.has(mencion.articulo)) continue;
    } else if (permitidas.has(`${codigo}|${mencion.articulo}`)) {
      continue;
    }

    const clave = `${codigo ?? 'SIN CÓDIGO'}|${mencion.articulo}`;
    if (yaReportadas.has(clave)) continue;
    yaReportadas.add(clave);
    hallazgos.push({
      clase: 'CITA_FUERA_DE_LO_AUTORIZADO',
      fragmento: recorte(texto, mencion.indice),
      referencia: { codigo: codigo ?? 'SIN CÓDIGO', articulo: mencion.articulo }
    });
  }

  /*
   * La norma invocada SIN artículo también es una cita: «todo en formato digital
   * conforme a la Ley 2213 de 2022» afirma que esa ley gobierna el escrito, y
   * nadie la leyó para esta ficha. Solo se miran las que traen año, porque son
   * las únicas inequívocas.
   */
  const reNorma = new RegExp(NORMA_CON_ANIO.source, 'gi');
  let mn: RegExpExecArray | null;
  while ((mn = reNorma.exec(texto))) {
    const clave = canonizarNorma(mn[0]);
    if (!clave || codigosPermitidos.has(clave) || yaReportadas.has(clave)) continue;
    yaReportadas.add(clave);
    hallazgos.push({
      clase: 'NORMA_FUERA_DE_LO_AUTORIZADO',
      fragmento: recorte(texto, mn.index)
    });
  }

  hallazgos.push(
    ...glosasEnParentesis(texto),
    ...glosasAgregadas(texto),
    ...contenidosPredicados(texto),
    ...efectosAtribuidos(texto)
  );

  return {
    hallazgos,
    citasFueraDeLaLista: hallazgos.filter(
      (h) => h.clase === 'CITA_FUERA_DE_LO_AUTORIZADO' || h.clase === 'NORMA_FUERA_DE_LO_AUTORIZADO'
    ).length,
    articulosCitados: vistas.size
  };
};

/**
 * Los artículos que una ficha autoriza, sacados de su prosa.
 *
 * ─── POR QUÉ HAY QUE PARSEAR PROSA ──────────────────────────────────────────
 *
 * `legalBasis` es un `string` libre («Ley 1564 de 2012, arts. 82, 390 y 391») y
 * los artículos que la ficha realmente autoriza viajan además sueltos dentro del
 * párrafo narrativo del término y dentro del `basis` de cada sección. Mientras
 * el catálogo no tenga un campo tipado, el conjunto autorizado se saca de aquí.
 * Ese campo tipado es el arreglo correcto y no cabe en este módulo: vive en
 * `catalog/types.ts`, que esta tarea no toca.
 */
export const referenciasDelTexto = (
  texto: string,
  normaPorDefecto: string | null
): ReferenciaNormativa[] => {
  const marcas = marcasDeNorma(texto);
  const out: ReferenciaNormativa[] = [];
  const vistas = new Set<string>();
  for (const mencion of mencionesDeArticulo(texto)) {
    const codigo = normaDeLaMencion(mencion, marcas, texto) ?? normaPorDefecto;
    if (!codigo) continue;
    const r = { codigo, articulo: mencion.articulo };
    if (vistas.has(claveDe(r))) continue;
    vistas.add(claveDe(r));
    out.push(r);
  }
  return out;
};
