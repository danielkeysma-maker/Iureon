/**
 * Reconocedor de la estructura de un escrito judicial colombiano (tutela,
 * demanda, recurso, derecho de petición). Puro: sin React, sin DOM.
 *
 * ─── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 *
 * Los documentos preparados antes del 5 de septiembre de 2026 llegan al taller
 * como un solo bloque: la preparación colapsaba todo el espacio en blanco y el
 * encabezado, los hechos, las pretensiones y la firma quedaban pegados en una
 * misma línea. Los nuevos conservan sus párrafos, pero un salto de página del
 * PDF sigue partiendo un título en dos renglones y un encabezado sigue
 * apareciendo pegado al final del párrafo anterior.
 *
 * Este módulo devuelve la anatomía canónica del escrito (destinatario,
 * referencia, presentación, secciones, enumeraciones, notificaciones,
 * despedida y firma) cambiando SOLO espacios por saltos de línea y saltos por
 * espacios. Nunca añade, quita ni reordena una palabra: las citas del revisor,
 * los resaltados y los comentarios se localizan con una búsqueda que colapsa el
 * espacio en blanco, así que un salto nuevo no rompe ninguna marca, pero un
 * carácter cambiado sí lo haría.
 *
 * ─── CÓMO TRABAJA ───────────────────────────────────────────────────────────
 *
 * Pasadas ordenadas sobre el texto, cada una con una regla pequeña, nombrada y
 * comentada con el caso que arregla. Todas las reglas son idempotentes: si el
 * escrito ya trae la estructura, la devuelven intacta (una regla solo abre
 * línea cuando el ancla NO está ya al inicio de una). Por eso el mismo
 * recorrido sirve para un texto aplanado y para uno con párrafos, y aplicarlo
 * dos veces da lo mismo que aplicarlo una.
 *
 *   1. normalizar saltos (CRLF → LF, bordes de línea sin espacios)
 *   2. unir títulos partidos por un salto de página
 *   3. destinatario: «Señor» / autoridad / «E. S. D.» / «Ciudad»
 *   4. bloque de referencia: una etiqueta por línea
 *   5. encabezados de sección en línea propia
 *   6. título en mayúscula pegado al final de un párrafo
 *   7. presentación del apoderado («FULANO DE TAL, mayor de edad…»)
 *   8. enumeraciones: ordinales, cifras y literales
 *   9. notificaciones: una parte y un dato de contacto por línea
 *  10. despedida y firma: nombre e identificaciones en líneas propias
 *  11. pie de página («Página 3 de 12») en línea propia
 *  12. colapsar más de dos saltos seguidos
 *
 * Al final se indexan las secciones sobre el texto ya reordenado.
 */

export type TipoDeSeccion = 'destinatario' | 'referencia' | 'presentacion' | 'seccion' | 'notificaciones' | 'firma' | 'cuerpo';

export interface SeccionDelEscrito {
  /** El texto de la línea que abre la sección («HECHOS», «REFERENCIA: …», «Atentamente,»); vacío para el cuerpo sin título. */
  titulo: string;
  /** Desplazamientos sobre `texto` (el reordenado), [inicio, fin). */
  inicio: number;
  fin: number;
  tipo: TipoDeSeccion;
}

export interface EstructuraDelEscrito {
  /** El escrito con su estructura recuperada: igual al de entrada salvo por el espacio en blanco. */
  texto: string;
  secciones: SeccionDelEscrito[];
}

/* ─── Catálogo ─────────────────────────────────────────────────────────────── */

const MAY = 'A-ZÁÉÍÓÚÜÑ';
/** Una palabra en mayúscula sostenida de dos letras o más. */
const PALABRA = `[${MAY}]{2,}`;
/** Conectores que aparecen dentro de un título largo: «CRITERIOS DE LA PROCEDENCIA», «PRUEBAS Y ANEXOS». */
const CONECTOR = '(?:DE|DEL|LA|LAS|LOS|EL|LO|Y|E|O|U|EN|POR|PARA|CONTRA|ANTE|SOBRE|AL|A|CON|SIN)';

/**
 * Acepta cada palabra con o sin tildes: un PDF aplanado trae «PETICION» y un
 * borrador trae «PETICIÓN», y son el mismo encabezado. El espacio entre
 * palabras se toma como uno o más espacios de la misma línea.
 */
const conOSinTilde = (frase: string): string =>
  frase
    .split(' ')
    .map((palabra) => palabra.replace(/[AEIOU]/g, (v) => ({ A: '[AÁ]', E: '[EÉ]', I: '[IÍ]', O: '[OÓ]', U: '[UÚÜ]' })[v as 'A' | 'E' | 'I' | 'O' | 'U']))
    .join('[ \\t]+');

/** Las frases más largas primero, para que «PETICIÓN ESPECIAL» gane a «PETICIÓN» y «FUNDAMENTOS DE DERECHO» a «FUNDAMENTOS». */
const alternativas = (lista: string[]): string =>
  [...lista]
    .sort((a, b) => b.length - a.length)
    .map(conOSinTilde)
    .join('|');

/** Encabezados de sección del escrito colombiano. Van solos en su línea; pueden llevar numeral delante y dos puntos detrás. */
const ENCABEZADOS = [
  'HECHOS',
  'ANTECEDENTES',
  'PRETENSIONES',
  'PRETENSION',
  'PETICIONES',
  'PETICION',
  'PETICION ESPECIAL',
  'SOLICITUDES',
  'SOLICITUD',
  'SOLICITUD ESPECIAL',
  'OTRAS SOLICITUDES',
  'DECLARACIONES Y CONDENAS',
  'FUNDAMENTOS DE DERECHO',
  'FUNDAMENTOS JURIDICOS',
  'FUNDAMENTOS DE LA ACCION',
  'FUNDAMENTOS',
  'RAZONES DE LA VIOLACION',
  'CONCEPTO DE LA VIOLACION',
  'PROCEDENCIA',
  'PROCEDIBILIDAD',
  'REQUISITOS GENERALES DE PROCEDIBILIDAD',
  'REQUISITOS ESPECIFICOS DE PROCEDIBILIDAD',
  'REQUISITOS DE PROCEDIBILIDAD',
  'CRITERIOS GENERALES DE PROCEDENCIA',
  'CRITERIOS GENERALES DE LA PROCEDENCIA',
  'CRITERIOS ESPECIFICOS DE PROCEDENCIA',
  'CRITERIOS ESPECIFICOS DE LA PROCEDENCIA',
  'CRITERIOS DE PROCEDENCIA',
  'LEGITIMACION EN LA CAUSA POR ACTIVA',
  'LEGITIMACION EN LA CAUSA POR PASIVA',
  'LEGITIMACION EN LA CAUSA',
  'LEGITIMACION POR ACTIVA',
  'LEGITIMACION POR PASIVA',
  'LEGITIMACION',
  'INMEDIATEZ',
  'SUBSIDIARIEDAD',
  'RELEVANCIA CONSTITUCIONAL',
  'DEFECTO FACTICO',
  'DEFECTO SUSTANTIVO',
  'DEFECTO PROCEDIMENTAL',
  'DEFECTO ORGANICO',
  'DESCONOCIMIENTO DEL PRECEDENTE',
  'VIOLACION DIRECTA DE LA CONSTITUCION',
  'MEDIDA PROVISIONAL',
  'MEDIDAS CAUTELARES',
  'COMPETENCIA',
  'CUANTIA',
  'OPORTUNIDAD',
  'CADUCIDAD',
  'JURAMENTO',
  'PRUEBAS',
  'ANEXOS',
  'DOCUMENTOS',
  'NOTIFICACIONES',
  'DIRECCIONES',
  'PROCEDIMIENTO',
  'TRAMITE',
  'CONSIDERACIONES',
  'CONCLUSIONES',
  'CONCLUSION'
];

/** Etiquetas del bloque de referencia: van seguidas de dos puntos y su valor en la misma línea. */
const ETIQUETAS = [
  'REFERENCIA',
  'REF',
  'ASUNTO',
  'ACCION',
  'ACCIONANTES',
  'ACCIONANTE',
  'ACCIONADOS',
  'ACCIONADO',
  'ACCIONADAS',
  'ACCIONADA',
  'ENTIDAD ACCIONADA',
  'ENTIDADES ACCIONADAS',
  'AUTORIDAD ACCIONADA',
  'DEMANDANTES',
  'DEMANDANTE',
  'DEMANDADOS',
  'DEMANDADO',
  'DEMANDADAS',
  'DEMANDADA',
  'CONVOCANTE',
  'CONVOCADO',
  'CONVOCADA',
  'VINCULADOS',
  'VINCULADO',
  'VINCULADAS',
  'VINCULADA',
  'TERCERO INTERESADO',
  'TERCEROS INTERESADOS',
  'RADICADO',
  'RADICACION',
  'EXPEDIENTE',
  'PROCESO',
  'MEDIO DE CONTROL',
  'DERECHOS INVOCADOS',
  'DERECHOS VULNERADOS',
  'DERECHOS AMENAZADOS',
  'DERECHOS FUNDAMENTALES INVOCADOS',
  'DERECHOS FUNDAMENTALES VULNERADOS',
  'DERECHOS FUNDAMENTALES AMENAZADOS',
  'DERECHO INVOCADO',
  'DERECHO VULNERADO'
];

/** Fuente de la expresión con los encabezados de sección, para que negrita y estructura usen el mismo catálogo. */
export const FUENTE_DE_ENCABEZADOS = alternativas(ENCABEZADOS);
/** Fuente de la expresión con las etiquetas del bloque de referencia. */
export const FUENTE_DE_ETIQUETAS = alternativas(ETIQUETAS);

const ORDINAL_BASE = '(?:PRIMER|SEGUND|TERCER|CUART|QUINT|SEXT|S[ÉE]PTIM|OCTAV|NOVEN|D[ÉE]CIM|UND[ÉE]CIM|DUOD[ÉE]CIM|VIG[ÉE]SIM|TRIG[ÉE]SIM)';
const ORDINAL_CORTO = '(?:PRIMER|SEGUND|TERCER|CUART|QUINT|SEXT|S[ÉE]PTIM|OCTAV|NOVEN)';
/** «PRIMERO», «SEGUNDA», «DÉCIMO PRIMERO»: el ordinal que numera hechos y pretensiones. */
const ORDINAL = `(?:${ORDINAL_BASE}[OA]S?(?:[ \\t]+${ORDINAL_CORTO}[OA]S?)?)`;
/** El ordinal con su signo: «PRIMERO.», «SEGUNDA:», «DÉCIMO PRIMERO -». */
const ORDINAL_PUNTUADO = `${ORDINAL}[ \\t]*[.:)\\-–—]`;
/** La misma numeración en versalita: «Primero.», «Segunda:». Solo con punto o dos puntos, para no tomar «Primero que todo». */
const ORDINAL_TITULO =
  '(?:(?:Primer|Segund|Tercer|Cuart|Quint|Sext|S[ée]ptim|Octav|Noven|D[ée]cim|Und[ée]cim|Duod[ée]cim|Vig[ée]sim)[oa]s?(?:[ \\t]+(?:primer|segund|tercer|cuart|quint|sext|s[ée]ptim|octav|noven)[oa]s?)?[ \\t]*[.:])';
/** «1.», «1)», «1.1», «2.3.1.»: numeración en cifras de un ítem. */
const CIFRA = '(?:\\d{1,2}(?:\\.\\d{1,2})*[.)]|\\d{1,2}(?:\\.\\d{1,2})+)';
/** Numeral que puede preceder a un encabezado: «I.», «II)», «1.», «2.3». */
const NUMERAL = '(?:(?:[IVXLC]{1,6}|\\d{1,2}(?:\\.\\d{1,2})*)[.)\\-–]?[ \\t]+)?';

/** «Atentamente», «Del señor Juez», «De los Honorables Magistrados»: la fórmula que cierra el escrito. */
const DESPEDIDA =
  '(?:Atentamente|Cordialmente|Respetuosamente|Del[ \\t]+señor[ \\t]+Juez|De[ \\t]+los[ \\t]+(?:Honorables|señores)[ \\t]+Magistrados|De[ \\t]+usted(?:es)?|Con[ \\t]+toda[ \\t]+atenci[óo]n)';
/** Una dirección de correo electrónico. */
const CORREO = '[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+';

const ETIQUETA_DE_LINEA = new RegExp(`^(?:${FUENTE_DE_ETIQUETAS})\\.?[ \\t]*:`, 'u');
const ENCABEZADO_DE_LINEA = new RegExp(`^${NUMERAL}(?:${FUENTE_DE_ENCABEZADOS})(?!\\p{L})(?:[ \\t]+(?:${PALABRA}|${CONECTOR})(?!\\p{L}))*[.:]?$`, 'u');
const DESPEDIDA_DE_LINEA = new RegExp(`^${DESPEDIDA},?$`, 'u');
const ORDINAL_DE_LINEA = new RegExp(`^(?:${ORDINAL_PUNTUADO}|${ORDINAL_TITULO}|${CIFRA}[ \\t]|[a-z]\\)[ \\t])`, 'u');
const PRESENTACION_DE_LINEA = new RegExp(
  `^(?:${PALABRA}|[${MAY}]\\.)(?:[ \\t]+(?:${PALABRA}|[${MAY}]\\.|${CONECTOR}))*,[ \\t]+(?:mayor[ \\t]+de[ \\t]+edad|identificad[oa]|domiciliad[oa]|abogad[oa]|actuando|obrando|en[ \\t]+mi[ \\t]+(?:calidad|condici[óo]n)|ciudadan[oa]|quien[ \\t]+act[úu]a|vecin[oa]|residente|persona[ \\t]+natural)`,
  'u'
);

/* ─── Utilidades ───────────────────────────────────────────────────────────── */

/**
 * Una línea es título si tiene letras y casi todas van en mayúscula:
 * «HECHOS», «I. PRETENSIONES», «ACCIONADO: JUZGADO TERCERO ADMINISTRATIVO ORAL
 * DEL CIRCUITO DE SINCELEJO - SALA QUINTA…». El tope de largo es generoso
 * (260) porque en un escrito real la línea del accionado o la referencia
 * ocupa dos renglones y sigue siendo encabezado. Una numeración sola («1.») o
 * una línea que termina en coma o punto y coma no lo es.
 */
export const esLineaDeTitulo = (linea: string): boolean => {
  const t = linea.trim();
  if (t.length < 2 || t.length > 260 || /[,;]$/.test(t)) return false;
  const letras = t.match(/\p{L}/gu) ?? [];
  if (letras.length < 3 || !/\p{L}{3}/u.test(t)) return false;
  const mayusculas = letras.filter((l) => l === l.toUpperCase() && l !== l.toLowerCase()).length;
  return mayusculas / letras.length >= 0.85;
};

/** Verdadero si antes de `pos` solo hay espacios hasta el salto anterior o el inicio del texto. */
const enInicioDeLinea = (texto: string, pos: number): boolean => {
  let i = pos - 1;
  while (i >= 0 && (texto[i] === ' ' || texto[i] === '\t')) i--;
  return i < 0 || texto[i] === '\n';
};

/** Verdadero si desde `pos` solo hay espacios hasta el salto siguiente o el fin del texto. */
const enFinDeLinea = (texto: string, pos: number): boolean => {
  let i = pos;
  while (i < texto.length && (texto[i] === ' ' || texto[i] === '\t')) i++;
  return i >= texto.length || texto[i] === '\n';
};

/** Lo que va desde el salto anterior hasta `pos`: el trozo de línea que precede a un hallazgo. */
const prefijoDeLinea = (texto: string, pos: number): string => texto.slice(texto.lastIndexOf('\n', pos - 1) + 1, pos);

/**
 * Pone cada hallazgo de `re` en su propia línea: abre `antes` si no está ya al
 * inicio de una línea y baja lo que le sigue si no está ya al final. El
 * espacio interno del hallazgo se reduce a uno (un título unido conserva sus
 * saltos hasta aquí). `omitir` deja pasar hallazgos que en su contexto no son
 * ancla.
 */
const aislar = (texto: string, re: RegExp, antes: string, omitir?: (hallazgo: string, pos: number) => boolean): string =>
  texto.replace(re, (hallazgo: string, ...resto: unknown[]) => {
    const pos = resto[resto.length - 2] as number;
    if (omitir?.(hallazgo, pos)) return hallazgo;
    const abre = enInicioDeLinea(texto, pos) ? '' : antes;
    const cierra = enFinDeLinea(texto, pos + hallazgo.length) ? '' : '\n';
    return `${abre}${hallazgo.trim().replace(/\s+/g, ' ')}${cierra}`;
  });

/** Índice del último hallazgo de `re`, o -1. */
const ultimo = (texto: string, re: RegExp): number => {
  let indice = -1;
  for (const m of texto.matchAll(re)) indice = m.index;
  return indice;
};

/** Aplica `fn` solo a la cola del texto desde `indice`; el resto queda intacto. */
const desde = (texto: string, indice: number, fn: (cola: string) => string): string =>
  indice < 0 ? texto : texto.slice(0, indice) + fn(texto.slice(indice));

/* ─── 1. Normalizar ────────────────────────────────────────────────────────── */

/** CRLF y CR sueltos pasan a LF; los espacios al borde de cada línea sobran (un PDF los deja al partir renglones). */
const normalizarSaltos = (texto: string): string =>
  texto
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .join('\n');

/* ─── 2. Títulos partidos ──────────────────────────────────────────────────── */

/** Cola de una línea que es una tirada en mayúscula: desde el inicio o desde el último fin de oración. */
const COLA_EN_MAYUSCULA = new RegExp(`(?:^|[.;:!?»")\\]][ \\t]+)((?:${PALABRA}|${CONECTOR}|[${MAY}]\\.)(?:[ \\t]+(?:${PALABRA}|${CONECTOR}|[${MAY}]\\.))*)$`, 'u');
/** Cabeza de una línea que empieza en mayúscula sostenida. */
const CABEZA_EN_MAYUSCULA = new RegExp(`^((?:${PALABRA}|${CONECTOR})(?:[ \\t]+(?:${PALABRA}|${CONECTOR}))*)`, 'u');
/** Un título no termina en conector: si la línea acaba en «DE LA», la siguiente la continúa. */
const TERMINA_EN_CONECTOR = new RegExp(`(?:^|[ \\t])${CONECTOR}$`, 'u');
/** Una línea que arranca con «DE», «Y», «CONTRA»… continúa la anterior («EL» y «LA» no: «EL ACCIONANTE» abre línea propia en notificaciones). */
const EMPIEZA_CON_CONECTOR = /^(?:DE|DEL|Y|E|O|U|EN|POR|PARA|CONTRA|ANTE|SOBRE|AL|A|CON|SIN)(?![\p{L}])/u;
const ESD = /E\.[ \t]?S\.[ \t]?D\./u;

/**
 * Títulos partidos por un salto de página del PDF: «CRITERIOS GENERALES DE LA»
 * en una línea y «PROCEDENCIA DE LA ACCIÓN DE TUTELA…» en la siguiente. Se
 * vuelven a unir cuando la primera termina en conector o la segunda empieza
 * con uno, o cuando ambas son títulos enteros dentro del cuerpo. No se unen
 * en el destinatario (la autoridad va en varios renglones a propósito), ni
 * dos etiquetas de referencia, ni un encabezado del catálogo con lo que le
 * sigue, ni nada después de la despedida (el nombre y «ABOGADO» son líneas
 * distintas).
 */
export const unirTitulosPartidos = (texto: string): string => {
  if (!texto.includes('\n')) return texto;
  const lineas = texto.split('\n');
  const finDestinatario = lineas.slice(0, 15).findIndex((l) => ESD.test(l) || /^Ciudad\.?$/.test(l.trim()));
  const inicioFirma = lineas.findIndex((l) => DESPEDIDA_DE_LINEA.test(l.trim()));
  const unidas: string[] = [];
  lineas.forEach((linea, i) => {
    const previa = unidas.length ? unidas[unidas.length - 1] : '';
    const actual = linea.trim();
    const zonaDeCuerpo = i > finDestinatario && (inicioFirma < 0 || i <= inicioFirma);
    const cola = COLA_EN_MAYUSCULA.exec(previa)?.[1];
    const cabeza = CABEZA_EN_MAYUSCULA.exec(actual)?.[1];
    const separables =
      !cola ||
      !cabeza ||
      !zonaDeCuerpo ||
      ETIQUETA_DE_LINEA.test(actual) ||
      ORDINAL_DE_LINEA.test(actual) ||
      ENCABEZADO_DE_LINEA.test(previa) ||
      (ETIQUETA_DE_LINEA.test(previa) && !TERMINA_EN_CONECTOR.test(cola));
    if (separables) {
      unidas.push(linea);
      return;
    }
    const porConector = TERMINA_EN_CONECTOR.test(cola) || EMPIEZA_CON_CONECTOR.test(cabeza);
    const porTituloEntero = esLineaDeTitulo(previa) && esLineaDeTitulo(actual) && !ENCABEZADO_DE_LINEA.test(actual) && !/[:.]$/.test(previa);
    if (porConector || porTituloEntero) unidas[unidas.length - 1] = `${previa} ${actual}`;
    else unidas.push(linea);
  });
  return unidas.join('\n');
};

/* ─── 3. Destinatario ──────────────────────────────────────────────────────── */

/** «Señor JUEZ…» / «Honorables Magistrados CONSEJO…»: el tratamiento va en su línea y la autoridad debajo. */
const TRATAMIENTO = new RegExp(`(?<![^\\n])(Señor(?:es|a|ita)?|Honorables?[ \\t]+(?:Magistrad[oa]s?|Consejer[oa]s?|Jue(?:z|ces)))[ \\t]+(?=${PALABRA})`, 'gu');
/** El tratamiento abre párrafo cuando viene pegado a lo anterior; no cuando es una mención («…apoderado de la Señora MARÍA…»). */
const ANTES_DEL_TRATAMIENTO = new RegExp(
  `(?<!(?:^|\\n)[ \\t]*)(?<!(?<!\\p{L})(?:el|al|del|la|los|las|a|de|un|una|El|Al|Del|La))[ \\t]+(?=(?:Señor(?:es|a)?[ \\t]+${PALABRA}|Honorables?[ \\t]+(?:Magistrad|Consejer|Jue)\\p{L}*(?!\\p{L})(?![ \\t]*[,;.])))`,
  'gu'
);
/** «E. S. D.» cierra el destinatario: va en su línea y después empieza otro párrafo. */
const ANTES_DE_ESD = /(?<!(?:^|\n)[ \t]*)[ \t]+(?=E\.[ \t]?S\.[ \t]?D\.)/gu;
const DESPUES_DE_ESD = /(E\.[ \t]?S\.[ \t]?D\.)[ \t]+(?=\S)/gu;
/** «Ciudad» tras la autoridad en mayúscula cumple el papel de «E. S. D.». */
const ANTES_DE_CIUDAD = new RegExp(`(?<=[${MAY}]{3}[.)]?)[ \\t]+(?=Ciudad\\.?(?:[ \\t]|\\n|$))`, 'gu');
const DESPUES_DE_CIUDAD = /(?<![^\n])(Ciudad\.?)[ \t]+(?=\S)/gu;

const separarDestinatario = (texto: string): string =>
  texto
    .replace(ANTES_DEL_TRATAMIENTO, '\n\n')
    .replace(TRATAMIENTO, '$1\n')
    .replace(ANTES_DE_ESD, '\n')
    .replace(DESPUES_DE_ESD, '$1\n\n')
    .replace(ANTES_DE_CIUDAD, '\n')
    .replace(DESPUES_DE_CIUDAD, '$1\n\n');

/* ─── 4. Bloque de referencia ──────────────────────────────────────────────── */

const ETIQUETA = new RegExp(`(?<!\\p{L})(?:${FUENTE_DE_ETIQUETAS})\\.?[ \\t]*:`, 'gu');
/** Un prefijo de línea que es solo una etiqueta («ASUNTO:», «REF.:»): lo que sigue es su valor, no un encabezado. */
const PREFIJO_DE_ETIQUETA = new RegExp(`^[${MAY} .()/]{1,60}:[ \\t]*$`, 'u');

/**
 * «REFERENCIA: … ACCIONANTE: … ACCIONADO: …» aplanado en una línea: cada
 * etiqueta abre la suya. La primera del bloque abre párrafo; las siguientes,
 * línea, para que el bloque se lea como uno.
 */
const separarEtiquetas = (texto: string): string =>
  texto.replace(ETIQUETA, (hallazgo: string, pos: number) => {
    if (enInicioDeLinea(texto, pos)) return hallazgo;
    const prefijo = prefijoDeLinea(texto, pos);
    return `${ETIQUETA_DE_LINEA.test(prefijo.trim()) ? '\n' : '\n\n'}${hallazgo}`;
  });

/* ─── 5. Encabezados de sección ────────────────────────────────────────────── */

/** Un título largo sigue con más palabras en mayúscula («…DE LA PROCEDENCIA DE LA ACCIÓN DE TUTELA»); un ordinal ya no es título. */
const CONTINUACION = `(?:[ \\t]+(?!${ORDINAL_PUNTUADO})(?:${PALABRA}|${CONECTOR})(?!\\p{L}))*`;
/** Lo que puede seguir a un encabezado en la misma línea: fin de línea, dos puntos, o el cuerpo empezando en mayúscula, cifra o comilla. */
const TRAS_ENCABEZADO = `(?:[.:](?=[ \\t]|\\n|$)|(?![ \\t]*[.:])(?=[ \\t]*(?:\\n|$)|[ \\t]+(?:\\p{Lu}|\\d|[«"(¿¡])))`;
/**
 * Encabezado del catálogo tras un fin de oración o al inicio de línea. No en
 * medio de una tirada en mayúscula: «CRITERIOS ESPECÍFICOS DE LA PROCEDENCIA
 * DE LA ACCIÓN…» es UN título y partirlo en «PROCEDENCIA» lo destrozaba; por
 * eso, si tras el hallazgo sigue otra palabra en mayúscula que no es ordinal,
 * la tirada continúa y el encabezado absorbe hasta donde termine.
 */
const ENCABEZADO_TRAS_ORACION = new RegExp(
  `(?<=^|[.;:!?»")\\]\\n])[ \\t]*${NUMERAL}(?:${FUENTE_DE_ENCABEZADOS})(?!\\p{L})${CONTINUACION}(?![ \\t]+(?!${ORDINAL_PUNTUADO})${PALABRA}(?!\\p{Ll}))${TRAS_ENCABEZADO}`,
  'gu'
);
/**
 * Encabezado seguido de la numeración de sus ítems («…DE SUCRE HECHOS PRIMERO.»,
 * «PRETENSIONES PRIMERA:», «HECHOS 1.»): es encabezado aunque venga pegado a
 * una tirada en mayúscula, porque lo que le sigue solo puede ser un ítem.
 */
const ENCABEZADO_ANTE_ITEM = new RegExp(
  `(?<!\\p{L})${NUMERAL}(?:${FUENTE_DE_ENCABEZADOS})(?!\\p{L})[.:]?(?=[ \\t]+(?:${ORDINAL_PUNTUADO}|${ORDINAL_TITULO}|${CIFRA}[ \\t]|[a-z]\\)[ \\t]))`,
  'gu'
);
/** «Hechos:», «Fundamentos de Derecho», «Pruebas.» en versalita: solo cuando cierran línea o llevan signo, para no tomar «Solicitud» a mitad de frase. */
const ENCABEZADO_EN_VERSALITA = new RegExp(
  `(?<=^|[.;!?»")\\]\\n])[ \\t]*${NUMERAL}(?:${FUENTE_DE_ENCABEZADOS})(?!\\p{L})(?:[.:](?=[ \\t]|\\n|$)|(?=[ \\t]*(?:\\n|$)))`,
  'giu'
);

const trasEtiqueta = (texto: string) => (_: string, pos: number): boolean => PREFIJO_DE_ETIQUETA.test(prefijoDeLinea(texto, pos).trim());

const separarEncabezados = (texto: string): string => {
  let salida = aislar(texto, ENCABEZADO_TRAS_ORACION, '\n\n', trasEtiqueta(texto));
  salida = aislar(salida, ENCABEZADO_ANTE_ITEM, '\n\n', trasEtiqueta(salida));
  /* La versalita exige inicial mayúscula: «hechos:» en minúscula es la palabra, no el encabezado. */
  const omitirMinuscula = (hallazgo: string, pos: number): boolean => !/^\s*(?:[IVXLC\d.)\-–]+\s+)?\p{Lu}/u.test(hallazgo) || trasEtiqueta(salida)(hallazgo, pos);
  return aislar(salida, ENCABEZADO_EN_VERSALITA, '\n\n', omitirMinuscula);
};

/* ─── 6. Título en mayúscula tras un fin de oración ────────────────────────── */

/**
 * «…proceso ordinario. CRITERIOS GENERALES DE LA PROCEDENCIA El defecto…»:
 * tres o más palabras en mayúscula sostenida después de un punto, que no
 * siguen en minúscula («PRIMERO. ALFONSO MONTERROZA AVILA es afiliado» es un
 * nombre en una oración, no un título), abren párrafo. Cubre los títulos que
 * no están en el catálogo y el nombre del firmante pegado al párrafo previo.
 * No tras un numeral: «III. FUNDAMENTOS DE DERECHO» es un solo encabezado.
 */
const TITULO_TRAS_ORACION = new RegExp(
  `(?<=[.;!?»")\\]])(?<!${ORDINAL_PUNTUADO})(?<!(?<![\\p{L}\\d])(?:[IVXLC]{1,6}|\\d{1,2}(?:\\.\\d{1,2})*)[.)])[ \\t]+(?=(?:(?:${PALABRA}|${CONECTOR})[ \\t]+){2,}${PALABRA}(?!\\p{L})(?![ \\t]+${PALABRA})[.:]?(?=[ \\t]*(?:\\n|$)|[ \\t]+(?:\\p{Lu}|\\d|[«"(¿¡])))`,
  'gu'
);

const separarTitulosTrasOracion = (texto: string): string => texto.replace(TITULO_TRAS_ORACION, '\n\n');

/* ─── 7. Presentación ──────────────────────────────────────────────────────── */

/** La coma que sigue al nombre del que se presenta: «…, mayor de edad», «…, identificado con», «…, obrando en». */
const ANCLA_DE_PRESENTACION =
  /,[ \t]+(?:mayor[ \t]+de[ \t]+edad|identificad[oa]|domiciliad[oa]|abogad[oa]|actuando|obrando|en[ \t]+mi[ \t]+(?:calidad|condici[óo]n)|ciudadan[oa]|quien[ \t]+act[úu]a|vecin[oa]|residente|persona[ \t]+natural)(?!\p{L})/gu;
/** Las palabras en mayúscula (y las iniciales) que preceden a la coma, hasta ocho. */
const NOMBRE_ANTE_LA_COMA = new RegExp(`((?:(?:${PALABRA}|[${MAY}]\\.|DE|DEL|LA|LAS|LOS|Y|E)[ \\t]+){0,7}${PALABRA})$`, 'u');
const ES_CONECTOR_DE_NOMBRE = /^(?:DE|DEL|LA|LAS|LOS|Y|E)$/u;
const ES_NUMERACION = new RegExp(`^(?:${ORDINAL_PUNTUADO}|\\d{1,2}[.)])$`, 'u');

/**
 * «…DE SINCELEJO ANIBAL G. DIAZ CONTRERAS, mayor de edad…»: el nombre del que
 * se presenta abre párrafo. Se toman hasta cuatro palabras (los conectores de
 * apellido no cuentan) contadas desde la coma, porque hacia la izquierda no
 * hay señal de dónde termina lo anterior: un nombre de cinco palabras deja la
 * primera en el renglón previo, precio de reconstruir sin el original. No se
 * abre cuando el nombre es una mención dentro de la oración («del señor
 * ALFONSO…»), cuando es el valor de una etiqueta («ACCIONANTE: JUAN…») ni
 * cuando sigue a un ordinal («PRIMERO. JUAN PÉREZ, identificado…»).
 */
const separarPresentacion = (texto: string): string => {
  const cortes: number[] = [];
  for (const ancla of texto.matchAll(ANCLA_DE_PRESENTACION)) {
    const previo = texto.slice(0, ancla.index);
    const nombre = NOMBRE_ANTE_LA_COMA.exec(previo)?.[1];
    if (!nombre) continue;
    const fichas = [...nombre.matchAll(/\S+/g)];
    let inicio = fichas.length;
    let contadas = 0;
    for (let i = fichas.length - 1; i >= 0; i--) {
      if (!ES_CONECTOR_DE_NOMBRE.test(fichas[i][0])) contadas++;
      if (contadas > 4) break;
      inicio = i;
    }
    while (inicio < fichas.length && ES_CONECTOR_DE_NOMBRE.test(fichas[inicio][0])) inicio++;
    if (inicio >= fichas.length) continue;
    const corte = previo.length - nombre.length + fichas[inicio].index;
    if (enInicioDeLinea(texto, corte)) continue;
    const antes = previo.slice(0, corte).trimEnd();
    const palabraPrevia = antes.slice(antes.search(/\S+$/u));
    if (/:$/.test(antes) || /^\p{Ll}/u.test(palabraPrevia) || ES_NUMERACION.test(palabraPrevia)) continue;
    cortes.push(corte);
  }
  let salida = texto;
  for (const corte of cortes.reverse()) salida = `${salida.slice(0, corte).trimEnd()}\n\n${salida.slice(corte)}`;
  return salida;
};

/* ─── 8. Enumeraciones ─────────────────────────────────────────────────────── */

/** «…del caso. SEGUNDO. La entidad…»: el ordinal tras un fin de oración abre párrafo. */
const ANTE_ORDINAL = new RegExp(`(?<=[.;:!?»")\\]])[ \\t]+(?=(?:${ORDINAL_PUNTUADO}|${ORDINAL_TITULO}[ \\t]+\\p{Lu}))`, 'gu');
/**
 * «…del caso. 2. La entidad…»: la cifra tras un fin de oración abre párrafo.
 * No tras «art. 5. Además» ni «No. 3. El»: ahí la cifra es parte de la cita
 * anterior, no un ítem.
 */
const ANTE_CIFRA = new RegExp(`(?<=[.;:!?»")\\]])(?<!(?<!\\p{L})(?:art|arts|inc|num|n[úu]m|No|N|p[áa]g|cap|lit|ord)\\.)[ \\t]+(?=${CIFRA}[ \\t]+(?:\\p{Lu}|[«"¿¡]))`, 'gu');
/** «…del caso. b) Copia…»: el literal tras un fin de oración abre párrafo. */
const ANTE_LITERAL = /(?<=[.;:!?»")\]])[ \t]+(?=[a-z]\)[ \t]+\p{Lu})/gu;

const separarEnumeraciones = (texto: string): string => texto.replace(ANTE_ORDINAL, '\n\n').replace(ANTE_CIFRA, '\n\n').replace(ANTE_LITERAL, '\n\n');

/* ─── 9. Notificaciones ────────────────────────────────────────────────────── */

const LINEA_DE_NOTIFICACIONES = new RegExp(`(?<![^\\n])${NUMERAL}NOTIFICACIONES(?!\\p{L})`, 'gu');
/** El hallazgo empieza en el espacio que sigue a la palabra previa: si esa palabra es artículo o preposición, es una mención, no un ancla. */
const NO_TRAS_ARTICULO = '(?<!(?<!\\p{L})(?:la|el|en|de|del|su|a|al|los|las|un|una|para|por|ante))';
/** «El accionante», «La accionada», «Al demandado», «Mi poderdante», «Las recibiré»: cada parte abre párrafo en notificaciones. */
const PARTE_DE_NOTIFICACION = new RegExp(
  `${NO_TRAS_ARTICULO}(?<=\\S)[ \\t]+(?=(?:(?:El|La|Los|Las|Al|A[ \\t]+la|A[ \\t]+los|A[ \\t]+las)[ \\t]+(?:accionante|accionad[oa]|demandante|demandad[oa]|convocante|convocad[oa]|vinculad[oa]|suscrit[oa]|apoderad[oa]|peticionari[oa]|entidad)s?(?!\\p{L})|Mi[ \\t]+poderdante|Las[ \\t]+recibir[ée]|Recibir[ée]|Se[ \\t]+pueden[ \\t]+notificar))`,
  'gu'
);
/** «Dirección:», «Correo electrónico:», «Teléfono:»: cada dato de contacto va en su línea. */
const DATO_DE_NOTIFICACION = new RegExp(
  `${NO_TRAS_ARTICULO}(?<=\\S)[ \\t]+(?=(?:Direcci[óo]n|Correo(?:[ \\t]+electr[óo]nico)?|Tel[ée]fono|Celular|E-?mail)(?!\\p{L}))`,
  'gu'
);
/** Un correo o una dirección física tras un fin de oración van en su línea. */
const CORREO_TRAS_ORACION = new RegExp(`(?<=[.;])[ \\t]+(?=${CORREO})`, 'gu');
const DIRECCION_TRAS_ORACION = /(?<=[.;])[ \t]+(?=(?:Carrera|Calle|Avenida|Cra|Cll|Kr|Kra|Cl|Cr|Av|Transversal|Diagonal|Tv|Dg|Manzana|Mz)\.?[ \t]+\d)/gu;

/**
 * Después del encabezado NOTIFICACIONES, cada parte y cada dato de contacto
 * abre su línea. Solo desde ahí: «El accionante» aparece en cada hecho y no
 * es ancla en el cuerpo.
 */
const separarNotificaciones = (texto: string): string =>
  desde(texto, ultimo(texto, LINEA_DE_NOTIFICACIONES), (cola) =>
    cola.replace(PARTE_DE_NOTIFICACION, '\n\n').replace(DATO_DE_NOTIFICACION, '\n').replace(CORREO_TRAS_ORACION, '\n').replace(DIRECCION_TRAS_ORACION, '\n')
  );

/* ─── 10. Despedida y firma ────────────────────────────────────────────────── */

/** La despedida abre párrafo cuando cierra línea, lleva coma o la sigue el nombre en mayúscula («Respetuosamente solicito» es una oración). */
const ANTES_DE_DESPEDIDA = new RegExp(`(?<=\\S)[ \\t]+(?=${DESPEDIDA},?(?:[ \\t]*(?:\\n|$)|,|[ \\t]+(?:${PALABRA}|atentamente|cordialmente)))`, 'gu');
/** Tras la despedida, el nombre del firmante baja de línea. */
const DESPUES_DE_DESPEDIDA = new RegExp(`(?<![^\\n])(${DESPEDIDA},?)[ \\t]+(?=${PALABRA})`, 'gu');
const LINEA_DE_DESPEDIDA = new RegExp(`(?<![^\\n])${DESPEDIDA},?(?=[ \\t]*(?:\\n|$)|[ \\t]+${PALABRA})`, 'gu');
/**
 * Cada identificación de la firma va en su línea: «C.C. No. …», «T.P. No. …»,
 * «Correo …», «Celular …», «Abogado». No cuando la precede «con», «la» o
 * «No.»: «identificado con C.C. 123» es una frase, no una línea de firma.
 */
const IDENTIFICACION_DE_FIRMA = new RegExp(
  `(?<!(?<!\\p{L})(?:con|la|el|mi|su|de|del|y|e|o|u|No\\.?|N[°º]\\.?|n[úu]mero|portador|titular|identificad[oa]|como|en|calidad))(?<=\\S)[ \\t]+(?=(?:C\\.[ \\t]?C\\.?|CC(?![\\p{L}])|C[ée]dula(?!\\p{L})|T\\.[ \\t]?P\\.?|TP(?![\\p{L}])|Tarjeta[ \\t]+Profesional|Correo(?:[ \\t]+electr[óo]nico)?(?!\\p{L})|Celular|Tel[ée]fono|Abogad[oa](?!\\p{L})|Apoderad[oa](?!\\p{L})|Direcci[óo]n(?!\\p{L})|NIT(?!\\p{L})|E-?mail(?!\\p{L})))`,
  'gu'
);
/** Un correo suelto en la firma va en su línea, salvo que sea el valor de «Correo:» o «e-mail». */
const CORREO_DE_FIRMA = new RegExp(`(?<!(?::|electr[óo]nico|correo|e-?mail))[ \\t]+(?=${CORREO})`, 'giu');

/**
 * «…de Sincelejo. Atentamente, ANIBAL G. DIAZ CONTRERAS C.C. No. 6.815.567 T.P.
 * No. 98.765 Correo: …» se despliega en la despedida, el nombre y una línea
 * por identificación. La firma nunca se queda pegada al párrafo anterior.
 * Si no hay despedida, la firma suele seguir a las notificaciones: las
 * identificaciones se abren desde ahí.
 */
const separarFirma = (texto: string): string => {
  const conDespedida = texto.replace(ANTES_DE_DESPEDIDA, '\n\n').replace(DESPUES_DE_DESPEDIDA, '$1\n');
  const inicio = ultimo(conDespedida, LINEA_DE_DESPEDIDA);
  const arranque = inicio >= 0 ? inicio : ultimo(conDespedida, LINEA_DE_NOTIFICACIONES);
  return desde(conDespedida, arranque, (cola) => cola.replace(IDENTIFICACION_DE_FIRMA, '\n').replace(CORREO_DE_FIRMA, '\n'));
};

/* ─── 11. Pie de página ────────────────────────────────────────────────────── */

/** «Página 3 de 12» que el PDF dejó en medio del texto: se conserva (nada se borra), pero en su propia línea. */
const PIE_DE_PAGINA = /P[áa]gina[ \t]+\d{1,3}[ \t]+de[ \t]+\d{1,3}(?!\d)/gu;

const separarPiesDePagina = (texto: string): string => aislar(texto, PIE_DE_PAGINA, '\n');

/* ─── 12. Colapsar ─────────────────────────────────────────────────────────── */

const colapsarSaltos = (texto: string): string =>
  texto
    .split('\n')
    .map((l) => l.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

/* ─── Índice de secciones ──────────────────────────────────────────────────── */

const tipoDeLinea = (linea: string, zona: TipoDeSeccion): TipoDeSeccion | null => {
  if (!linea) return null;
  if (ETIQUETA_DE_LINEA.test(linea)) return 'referencia';
  if (DESPEDIDA_DE_LINEA.test(linea)) return 'firma';
  if (PRESENTACION_DE_LINEA.test(linea)) return 'presentacion';
  if (zona === 'firma') return null;
  if (ENCABEZADO_DE_LINEA.test(linea)) return /^(?:[IVXLC\d.)\-– ]+)?NOTIFICACIONES/u.test(linea) ? 'notificaciones' : 'seccion';
  if (zona !== 'destinatario' && esLineaDeTitulo(linea) && linea.length <= 120 && !ORDINAL_DE_LINEA.test(linea) && !/^E\.[ \t]?S\.[ \t]?D\./.test(linea)) return 'seccion';
  return null;
};

/**
 * Recorre las líneas del texto ya ordenado y abre una sección en cada ancla:
 * el destinatario al inicio (si el escrito arranca con «Señor» o una
 * autoridad en mayúscula), el bloque de referencia (una sola sección para
 * todas sus etiquetas), la presentación, cada encabezado, NOTIFICACIONES y la
 * despedida. Lo que no cabe en ninguna es cuerpo.
 */
const indexarSecciones = (texto: string): SeccionDelEscrito[] => {
  const secciones: SeccionDelEscrito[] = [];
  let zona: TipoDeSeccion = 'cuerpo';
  let desplazamiento = 0;
  for (const linea of texto.split('\n')) {
    const inicio = desplazamiento;
    desplazamiento += linea.length + 1;
    if (secciones.length === 0) {
      const abreConTratamiento = /^(?:Señor(?:es|a|ita)?|Honorables?)(?!\p{L})/u.test(linea) || esLineaDeTitulo(linea);
      zona = abreConTratamiento && !ETIQUETA_DE_LINEA.test(linea) && !ENCABEZADO_DE_LINEA.test(linea) ? 'destinatario' : 'cuerpo';
      secciones.push({ titulo: zona === 'destinatario' ? linea : '', inicio: 0, fin: texto.length, tipo: zona });
      if (zona === 'destinatario') continue;
    }
    const tipo = tipoDeLinea(linea, zona);
    if (!tipo || (tipo === 'referencia' && zona === 'referencia')) continue;
    const previa = secciones[secciones.length - 1];
    if (previa.inicio === inicio) {
      previa.titulo = linea;
      previa.tipo = tipo;
    } else {
      previa.fin = inicio;
      secciones.push({ titulo: linea, inicio, fin: texto.length, tipo });
    }
    zona = tipo;
  }
  return secciones;
};

/* ─── API ──────────────────────────────────────────────────────────────────── */

/** Devuelve al escrito su estructura y la indexa. `texto` solo difiere del de entrada en el espacio en blanco. */
export const reconocerEstructura = (texto: string): EstructuraDelEscrito => {
  const pasadas: ((t: string) => string)[] = [
    normalizarSaltos,
    unirTitulosPartidos,
    separarDestinatario,
    separarEtiquetas,
    separarEncabezados,
    separarTitulosTrasOracion,
    separarPresentacion,
    separarEnumeraciones,
    separarNotificaciones,
    separarFirma,
    separarPiesDePagina,
    colapsarSaltos
  ];
  const salida = pasadas.reduce((t, pasada) => pasada(t), texto);
  return { texto: salida, secciones: indexarSecciones(salida) };
};

/**
 * Devuelve la estructura a un escrito: el mismo texto con sus párrafos,
 * encabezados, enumeraciones, notificaciones y firma en sus líneas. Sirve
 * para el texto aplanado de los documentos antiguos y para el que ya trae
 * sus saltos (a este solo le une los títulos partidos y le despega lo que
 * quedó pegado). No inventa texto: solo cambia espacios por saltos.
 */
export const reflujoDeSecciones = (texto: string): string => reconocerEstructura(texto).texto;
