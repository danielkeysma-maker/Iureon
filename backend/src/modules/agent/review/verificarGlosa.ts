import {
  articulosDelFragmento,
  claveDe,
  etiquetaDeNorma,
  glosasDelTexto,
  type ClaseDeHallazgo,
  type ReferenciaNormativa
} from '../citacionNormativa';
import type { VigenciaDeArticulo } from '../../legislation/officialArticle.service';
import { ENGINE, callOpenRouterWithUsage } from '../openrouter.client';
import { SEPARADOR_DE_AVISOS, marcarVarios } from './verificarVigencia';

/**
 * ¿DICE EL ARTÍCULO LO QUE EL ESCRITO DICE QUE DICE? Se comprueba con el TEXTO
 * OFICIAL DELANTE, frase por frase, después de redactar y antes de entregar.
 *
 * ─── EL DEFECTO QUE ESTE ARCHIVO ATACA, Y POR QUÉ ERA EL QUE QUEDABA ───────
 *
 * El 9 de septiembre de 2026 se comprobó contra el texto oficial del Senado que
 * el motor NO inventa derecho: los artículos que cita existen y dicen lo que el
 * Senado publica. Y con `verificarVigencia.ts` se cazó al muerto citado como
 * vivo — el art. 2035 del Código Civil, derogado desde 2003.
 *
 * Queda un tercer defecto que ninguno de los dos ve, y está medido sobre el
 * borrador real:
 *
 *     «los artículos 8, 9, 22 y 35 de la Ley 820 de 2003, SOBRE LAS
 *      OBLIGACIONES DEL ARRENDATARIO»
 *
 * El art. 8 está VIGENTE —el verificador de vigencia lo aprueba, y con razón— y
 * la frase es FALSA: el art. 8 son las obligaciones del ARRENDADOR, el reverso
 * exacto; el 22 son causales de terminación. Solo el 9 sostiene la glosa. El
 * otro caso medido: el juramento estimatorio del art. 206 del CGP aplicado a
 * cánones insolutos, cuando su enumeración es cerrada —indemnización,
 * compensación, frutos o mejoras— y un canon adeudado no es ninguna de las
 * cuatro.
 *
 * Un artículo INVENTADO se cae solo: el juez no lo encuentra. Uno MUERTO se cae
 * cuando alguien mira el corchete. Una GLOSA FALSA sobre un artículo vivo no se
 * cae nunca sola: hay que abrir la norma y leerla, que es exactamente el
 * trabajo que este producto promete quitarle al abogado.
 *
 * ─── CÓMO SE JUZGA, Y POR QUÉ ASÍ FUNCIONA ────────────────────────────────
 *
 * CON EL TEXTO DELANTE. No se le pregunta al modelo qué recuerda del art. 8 —
 * recordar es justo lo que falló al escribir la frase—: se le da el texto
 * oficial descargado del Senado y la frase del escrito, y se le pide que diga
 * si ese texto sostiene esa frase. Es una COMPARACIÓN, no un recuerdo, y esa
 * diferencia es toda la razón por la que esto puede funcionar.
 *
 * Por lo mismo va en el motor barato con `reasoning_effort: 'minimal'` y modo
 * JSON: clasificar dos textos que ya están delante es la tarea que esta casa ya
 * midió como suya —el triage contra el menú del catálogo hace lo mismo— y no
 * necesita el motor caro, que se reserva para escribir.
 *
 * ─── LA REGLA DURA: SIN FRAGMENTO NO HAY VEREDICTO FAVORABLE ──────────────
 *
 * SOSTENIDA exige que el juez SEÑALE en el texto oficial el pasaje que sostiene
 * la frase, y el código comprueba que ese pasaje esté de verdad ahí. Un modelo
 * puede decir «sí, lo sostiene» sin haber mirado; no puede citar un pasaje que
 * no existe sin que esto lo vea. Sin fragmento, o con uno que no está en el
 * texto oficial, el veredicto BAJA a DUDOSA — nunca sube.
 *
 * ─── LA FALSA ALARMA ES PEOR QUE EL SILENCIO, Y AQUÍ MÁS QUE EN NINGÚN SITIO ─
 *
 * Esta casa tiene escrito que una acusación errónea enseña a ignorar todos los
 * avisos. Marcar NO_SOSTENIDA una frase correcta es peor que no marcar nada,
 * porque el siguiente aviso —el del artículo derogado— se leerá por encima. Por
 * eso hay TRES veredictos y no dos, DUDOSA se declara como dudosa en el escrito
 * en vez de darse por buena o por mala, y el prompt del juez le ordena
 * explícitamente preferir DUDOSA cuando no esté claro.
 *
 * ─── QUÉ LE PASA AL ESCRITO, Y POR QUÉ NO SE REESCRIBE ────────────────────
 *
 * Lo mismo que con lo derogado, y por las mismas razones ya escritas en
 * `verificarVigencia.ts`: SE MARCA, no se reescribe ni se borra. Pegado a la
 * frase para quien lee el párrafo, y en un bloque de cabecera para quien hojea,
 * con el texto oficial del artículo al lado para que el abogado vea en dos
 * líneas por qué la frase no se sostiene. Solo se INSERTA texto; no se quita ni
 * se reordena una palabra de lo que el motor escribió.
 *
 * ─── FALLAR ABIERTO ES OBLIGATORIO ────────────────────────────────────────
 *
 * Si la fuente no respondió o el motor no contesta, la glosa sale DECLARADA
 * como no comprobada y el escrito sale igual. Esto corre cuando el trabajo caro
 * ya está hecho y pagado: un borrador perdido por una mala tarde del Senado o
 * de OpenRouter sería peor que el defecto que aquí se vigila.
 */

export type VeredictoDeGlosa = 'SOSTENIDA' | 'NO_SOSTENIDA' | 'DUDOSA';

/** Una frase del escrito que AFIRMA algo sobre un artículo concreto. */
export interface AfirmacionSobreArticulo {
  referencia: ReferenciaNormativa;
  clase: ClaseDeHallazgo;
  /** La frase literal del escrito, tal como la recortó el cedazo. */
  frase: string;
  /** El texto oficial del artículo contra el que se juzga. */
  textoOficial: string;
  rubrica?: string;
  url?: string;
}

export interface GlosaJuzgada extends AfirmacionSobreArticulo {
  veredicto: VeredictoDeGlosa;
  /** El pasaje del TEXTO OFICIAL en que el juez se apoya. Sin él no hay SOSTENIDA. */
  apoyo?: string;
  /** Por qué. Una frase que el abogado pueda leer. */
  motivo: string;
}

export interface RevisionDeGlosa {
  resultados: GlosaJuzgada[];
  noSostenidas: number;
  dudosas: number;
}

/**
 * Cuántas glosas se juzgan por escrito.
 *
 * Cada una es una llamada al motor barato con el artículo entero de entrada
 * (hasta 8.000 caracteres, ~2.300 tokens). Ocho llamadas son ~18.000 tokens de
 * entrada: unos US$0,014 por borrador. El tope no es de dinero sino de reloj —
 * van en paralelo, pero ocho respuestas del proveedor caben en la partida de la
 * etapa y treinta no.
 */
export const MAX_GLOSAS_POR_ESCRITO = 8;

/*
 * ─── QUÉ SE MANDA A JUZGAR ─────────────────────────────────────────────────
 */

/**
 * Empareja cada frase que afirma algo con el TEXTO OFICIAL del artículo del que
 * habla.
 *
 * Parte de lo que la comprobación de vigencia YA DESCARGÓ, y eso no es un
 * atajo: son exactamente los artículos que el escrito cita por fuera de la
 * ficha, que son los que nadie de esta casa ha leído. Los de la ficha se saltan
 * porque su norma ya se leyó contra la fuente al construirla, y gastar aquí las
 * ocho llamadas en ellos dejaría sin juzgar justo las glosas peligrosas. De
 * paso, reusar esas descargas hace que esta etapa NO añada una sola petición al
 * sitio del Senado.
 *
 * Se juzgan SOLO los VIGENTES con cuerpo. Un artículo DEROGADO ya lleva su
 * propia marca —y otra al lado sería ruido sobre un pasaje que hay que
 * reescribir entero de todos modos— y un NO_VERIFICABLE no trae texto contra el
 * que comparar: juzgarlo sin él sería volver a preguntarle al modelo qué
 * recuerda.
 */
export const afirmacionesPorComprobar = (
  texto: string,
  vigencias: VigenciaDeArticulo[]
): AfirmacionSobreArticulo[] => {
  const conTexto = new Map<number, VigenciaDeArticulo>();
  for (const v of vigencias) {
    if (v.estado !== 'VIGENTE') continue;
    if (!v.cuerpo || v.cuerpo.trim().length < 40) continue;
    if (!conTexto.has(v.referencia.articulo)) conTexto.set(v.referencia.articulo, v);
  }
  if (conTexto.size === 0) return [];

  const out: AfirmacionSobreArticulo[] = [];
  const vistas = new Set<string>();
  for (const hallazgo of glosasDelTexto(texto)) {
    for (const articulo of articulosDelFragmento(hallazgo.fragmento)) {
      const vigencia = conTexto.get(articulo);
      if (!vigencia) continue;
      /*
       * La misma frase sobre el mismo artículo se juzga UNA vez: dos mallas
       * distintas pueden marcar el mismo pasaje —una glosa agregada suele traer
       * también un contenido predicado— y pagar dos llamadas por ella
       * produciría además dos avisos idénticos dentro del escrito.
       */
      const clave = `${claveDe(vigencia.referencia)}|${hallazgo.fragmento}`;
      if (vistas.has(clave)) continue;
      vistas.add(clave);
      out.push({
        referencia: vigencia.referencia,
        clase: hallazgo.clase,
        frase: hallazgo.fragmento,
        textoOficial: vigencia.cuerpo as string,
        rubrica: vigencia.rubrica,
        url: vigencia.url
      });
    }
  }
  return out.slice(0, MAX_GLOSAS_POR_ESCRITO);
};

/*
 * ─── EL JUEZ ───────────────────────────────────────────────────────────────
 */

export interface RespuestaDelJuez {
  veredicto: string;
  apoyo?: string;
  motivo?: string;
}

/**
 * Quién juzga. Es un parámetro para que el guarda de regresión pueda correr sin
 * red y sin motor: un check que necesita OpenRouter no se puede exigir en CI, y
 * un check que no se exige no protege nada.
 */
export type JuezDeGlosa = (
  afirmacion: AfirmacionSobreArticulo,
  limiteMs: number
) => Promise<RespuestaDelJuez | null>;

const NL = String.fromCharCode(10);

export const INSTRUCCION_DEL_JUEZ = [
  'Eres un verificador. NO redactas, NO opinas de derecho y NO usas nada que recuerdes:',
  'juzgas ÚNICAMENTE comparando dos textos que tienes delante.',
  '',
  'Recibes (A) el TEXTO OFICIAL de un artículo, descargado del Senado de la República',
  'de Colombia, y (B) una FRASE de un escrito judicial que afirma algo sobre ese artículo.',
  '',
  'Tu única pregunta es: ¿el TEXTO OFICIAL sostiene lo que la FRASE afirma sobre él?',
  '',
  'Responde SOLO un objeto JSON con estas tres claves:',
  '  "veredicto": "SOSTENIDA" | "NO_SOSTENIDA" | "DUDOSA"',
  '  "apoyo": el pasaje LITERAL del TEXTO OFICIAL en que te apoyas, copiado carácter por',
  '           carácter, entre 15 y 300 caracteres. Nunca lo inventes ni lo parafrasees:',
  '           se comprueba que exista dentro del texto oficial.',
  '  "motivo": una sola frase, en español, que un abogado pueda leer.',
  '',
  'REGLAS DURAS:',
  '1. SOSTENIDA solo si puedes copiar del TEXTO OFICIAL el pasaje que sostiene la frase.',
  '   Si no lo encuentras, NO es SOSTENIDA.',
  '2. NO_SOSTENIDA solo cuando el texto oficial DICE OTRA COSA o dice lo contrario: por',
  '   ejemplo, la frase habla de las obligaciones de una parte y el artículo regula las',
  '   de la parte contraria; o la frase mete un supuesto dentro de una enumeración',
  '   cerrada que no lo contiene. En "apoyo" copia el pasaje que la desmiente.',
  '3. DUDOSA cuando no esté claro: la frase es vaga, cubre varios artículos a la vez,',
  '   describe el artículo de manera aproximada pero no falsa, o el texto oficial no',
  '   alcanza para decidir. ANTE LA DUDA, DUDOSA.',
  '',
  'Marcar como NO_SOSTENIDA una frase que sí es correcta es el peor error posible: una',
  'acusación equivocada hace que el abogado deje de leer todos los avisos, incluido el',
  'del artículo derogado. Prefiere siempre DUDOSA antes que acusar sin estar seguro.'
].join(NL);

const COMILLAS = String.fromCharCode(34, 34, 34);

export const peticionAlJuez = (a: AfirmacionSobreArticulo): string =>
  [
    `TEXTO OFICIAL — ${etiquetaDeNorma(a.referencia.codigo)}, artículo ${a.referencia.articulo}` +
      (a.rubrica ? ` (${a.rubrica})` : '') +
      ':',
    COMILLAS,
    a.textoOficial,
    COMILLAS,
    '',
    'FRASE DEL ESCRITO:',
    COMILLAS,
    a.frase,
    COMILLAS,
    '',
    '¿El texto oficial sostiene lo que la frase afirma sobre ese artículo? Responde solo el JSON.'
  ].join(NL);

/**
 * Lee el JSON del motor sin lanzar.
 *
 * Tolera el JSON envuelto en prosa o en una valla de código: el modo JSON lo
 * hace raro, no imposible, y perder un veredicto por una valla de markdown
 * convertiría una comprobación hecha en un DUDOSA inventado.
 */
export const leerRespuestaDelJuez = (crudo: string): RespuestaDelJuez | null => {
  const desde = crudo.indexOf('{');
  const hasta = crudo.lastIndexOf('}');
  if (desde < 0 || hasta <= desde) return null;
  try {
    const objeto = JSON.parse(crudo.slice(desde, hasta + 1)) as Record<string, unknown>;
    const veredicto = typeof objeto.veredicto === 'string' ? objeto.veredicto : '';
    if (!veredicto) return null;
    return {
      veredicto,
      apoyo: typeof objeto.apoyo === 'string' ? objeto.apoyo : undefined,
      motivo: typeof objeto.motivo === 'string' ? objeto.motivo : undefined
    };
  } catch {
    return null;
  }
};

/** El juez de verdad: el motor barato, en modo JSON y con razonamiento mínimo. */
export const juezDelMotor: JuezDeGlosa = async (afirmacion, limiteMs) => {
  const respuesta = await callOpenRouterWithUsage(
    ENGINE.GEMINI,
    INSTRUCCION_DEL_JUEZ,
    peticionAlJuez(afirmacion),
    900,
    /*
     * El piso de longitud de la casa son 50 caracteres y está puesto para la
     * redacción, donde un texto corto es un motor que se rindió. Aquí la
     * respuesta correcta es un JSON de tres claves y puede ser corta: aplicarle
     * el piso de la redacción descartaría el veredicto y lo reportaría como
     * motor caído, que es un fallo declarado donde sí hubo respuesta.
     */
    10,
    { json: true, reasoningEffort: 'minimal', timeoutMs: limiteMs }
  );
  if (!respuesta.text) return null;
  return leerRespuestaDelJuez(respuesta.text);
};

/*
 * ─── LA COMPROBACIÓN DEL APOYO ─────────────────────────────────────────────
 */

/**
 * Normaliza para comparar: sin tildes, sin mayúsculas y sin la puntuación que
 * el modelo cambia al copiar.
 *
 * NO es laxitud. El juez tiene que copiar del texto oficial, y copiar bien; lo
 * que esto perdona es que escriba «articulo» por «ARTÍCULO», que junte dos
 * espacios o que se coma una coma, cosas que no cambian qué pasaje señaló. Lo
 * que NO perdona —y es lo único que importa— es que el pasaje no esté.
 */
const paraComparar = (t: string): string =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** ¿Está de verdad ese pasaje dentro del texto oficial? */
export const apoyoEstaEnElTexto = (apoyo: string | undefined, textoOficial: string): boolean => {
  if (!apoyo) return false;
  const aguja = paraComparar(apoyo);
  /*
   * Un apoyo de tres palabras no prueba que el juez leyera nada: «las
   * siguientes» aparece en media legislación colombiana. Quince caracteres
   * normalizados es el piso, el mismo que el prompt le pide.
   */
  if (aguja.length < 15) return false;
  return paraComparar(textoOficial).includes(aguja);
};

const VEREDICTOS = new Set<string>(['SOSTENIDA', 'NO_SOSTENIDA', 'DUDOSA']);

/**
 * Convierte lo que dijo el juez en un veredicto que esta casa puede publicar.
 *
 * Aquí vive la regla dura, y vive en CÓDIGO y no en el prompt porque esta casa
 * ya aprendió —con la regla de citación, intacta un mes en el prompt mientras
 * el motor citaba veintitrés artículos de más— que una regla que solo está
 * escrita en la instrucción no es una regla.
 */
export const veredictoDe = (
  afirmacion: AfirmacionSobreArticulo,
  respuesta: RespuestaDelJuez | null
): GlosaJuzgada => {
  const sinComprobar = (motivo: string): GlosaJuzgada => ({
    ...afirmacion,
    veredicto: 'DUDOSA',
    motivo
  });

  if (!respuesta) {
    return sinComprobar(
      'La comprobación no se pudo hacer: el verificador no respondió. La afirmación queda SIN COMPROBAR.'
    );
  }

  const declarado = respuesta.veredicto.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (!VEREDICTOS.has(declarado)) {
    return sinComprobar(
      'El verificador respondió algo que no es un veredicto. La afirmación queda SIN COMPROBAR.'
    );
  }

  const apoyoReal = apoyoEstaEnElTexto(respuesta.apoyo, afirmacion.textoOficial);
  const motivo = (respuesta.motivo ?? '').trim();

  /*
   * SIN FRAGMENTO NO HAY VEREDICTO FAVORABLE. Un «sí, lo sostiene» sin pasaje
   * que señalar es indistinguible de un modelo que no miró el texto, y darlo
   * por bueno reintroduciría por la puerta de atrás justo el recuerdo que este
   * archivo existe para no usar.
   */
  if (declarado === 'SOSTENIDA' && !apoyoReal) {
    return {
      ...afirmacion,
      veredicto: 'DUDOSA',
      motivo:
        'El verificador la dio por buena pero no pudo señalar en el texto oficial el pasaje que la sostiene, así que no se da por comprobada.'
    };
  }

  return {
    ...afirmacion,
    veredicto: declarado as VeredictoDeGlosa,
    apoyo: apoyoReal ? respuesta.apoyo : undefined,
    motivo: motivo.length > 0 ? motivo : 'El verificador no explicó su veredicto.'
  };
};

/*
 * ─── LA ETAPA ──────────────────────────────────────────────────────────────
 */

const conTope = <T>(promesa: Promise<T>, ms: number, siTarda: T): Promise<T> =>
  new Promise((resolve) => {
    const reloj = setTimeout(() => resolve(siTarda), ms);
    promesa.then(
      (v) => {
        clearTimeout(reloj);
        resolve(v);
      },
      () => {
        clearTimeout(reloj);
        resolve(siTarda);
      }
    );
  });

/**
 * Juzga todas las glosas del escrito contra el texto oficial ya descargado.
 *
 * Nunca lanza. AGOTAR EL PLAZO SIGNIFICA DUDOSA, nunca un borrador perdido: es
 * la misma regla que la comprobación de vigencia y por la misma razón — cuando
 * esto corre, el escrito ya está escrito y ya se pagó.
 */
export const verificarGlosaDelEscrito = async (
  texto: string,
  vigencias: VigenciaDeArticulo[],
  limiteMs = 25_000,
  juez: JuezDeGlosa = juezDelMotor
): Promise<RevisionDeGlosa> => {
  const porComprobar = afirmacionesPorComprobar(texto, vigencias);
  if (porComprobar.length === 0) return { resultados: [], noSostenidas: 0, dudosas: 0 };

  /*
   * El plazo individual queda por debajo del de la etapa para que el corte lo
   * dé este código y el resultado sea un DUDOSA declarado, y no una etapa
   * cortada desde arriba sin decir de qué. Misma doctrina que en la vigencia.
   */
  const plazoIndividual = Math.max(3_000, limiteMs - 2_000);
  const resultados = await Promise.all(
    porComprobar.map((afirmacion) =>
      conTope(
        juez(afirmacion, plazoIndividual).then((respuesta) => veredictoDe(afirmacion, respuesta)),
        plazoIndividual,
        veredictoDe(afirmacion, null)
      )
    )
  );

  return {
    resultados,
    noSostenidas: resultados.filter((r) => r.veredicto === 'NO_SOSTENIDA').length,
    dudosas: resultados.filter((r) => r.veredicto === 'DUDOSA').length
  };
};

/*
 * ─── LA MARCA EN EL ESCRITO ────────────────────────────────────────────────
 */

const nombre = (r: GlosaJuzgada): string =>
  `${etiquetaDeNorma(r.referencia.codigo)}, art. ${r.referencia.articulo}`;

/**
 * El texto oficial recortado para ponerlo al lado de la frase.
 *
 * Va un EXTRACTO y no el artículo entero: el abogado tiene que poder ver en dos
 * líneas por qué la frase no se sostiene, y ocho mil caracteres de norma dentro
 * de un aviso son un muro que nadie lee. El artículo completo está a un clic en
 * la URL oficial, que va al lado. Cuando el juez señaló un pasaje, el extracto
 * se centra en él — es el que explica el veredicto.
 */
export const extractoOficial = (texto: string, apoyo?: string, largo = 320): string => {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  if (apoyo) {
    const i = paraComparar(limpio).indexOf(paraComparar(apoyo));
    if (i >= 0) {
      const desde = Math.max(0, i - 60);
      const trozo = limpio.slice(desde, desde + largo);
      return `${desde > 0 ? '…' : ''}${trozo}${desde + largo < limpio.length ? '…' : ''}`;
    }
  }
  return limpio.length <= largo ? limpio : `${limpio.slice(0, largo)}…`;
};

/**
 * LA MARCA EN LÍNEA, separada de la cabecera por la misma razón que en la
 * comprobación de vigencia: dos anotaciones sobre el mismo escrito, y la
 * segunda marcaría dentro de la cabecera de la primera. El pipeline marca el
 * CUERPO con las dos y apila después las cabeceras.
 *
 * SOLO SE MARCA EN LÍNEA LO NO SOSTENIDO. Meter también las dudosas dentro del
 * párrafo llenaría de corchetes un escrito en el que casi todo está bien y
 * volvería invisible la marca que importa. Las dudosas se declaran arriba, que
 * es donde se hojea.
 */
export const marcarGlosaEnLinea = (texto: string, revision: RevisionDeGlosa): string => {
  const yaMarcados = new Set<number>();
  const marcas: Array<{ articulo: number; marca: string }> = [];
  for (const r of revision.resultados.filter((x) => x.veredicto === 'NO_SOSTENIDA')) {
    if (yaMarcados.has(r.referencia.articulo)) continue;
    yaMarcados.add(r.referencia.articulo);
    marcas.push({
      articulo: r.referencia.articulo,
      marca: `[LO QUE AQUÍ SE AFIRMA NO LO DICE ESE ARTÍCULO — el texto oficial dice: «${extractoOficial(
        r.textoOficial,
        r.apoyo,
        200
      )}». ${r.motivo} Corríjalo antes de radicar.]`
    });
  }
  /*
   * TODAS DE UNA VEZ, y ese detalle es el que hace que el segundo aviso exista:
   * encadenadas, la marca del art. 8 mete puntos en medio de «los artículos 8,
   * 9, 22 y 35» y la del 22 deja de encontrar su cabeza de cita. Ver
   * `marcarVarios`, donde está medido.
   */
  return marcarVarios(texto, marcas);
};

/**
 * Los avisos de cabecera de esta comprobación, encabezado incluido. Lista vacía
 * cuando no hubo nada que juzgar: una cabecera seguida de nada es una casilla,
 * y esta casa ya sabe cómo terminan.
 */
export const bloquesDeGlosa = (revision: RevisionDeGlosa): string[] => {
  const { resultados } = revision;
  if (resultados.length === 0) return [];

  const noSostenidas = resultados.filter((r) => r.veredicto === 'NO_SOSTENIDA');
  const dudosas = resultados.filter((r) => r.veredicto === 'DUDOSA');
  const sostenidas = resultados.filter((r) => r.veredicto === 'SOSTENIDA');

  const bloques: string[] = [
    'COMPROBACIÓN AUTOMÁTICA DE LO QUE EL ESCRITO AFIRMA DE CADA ARTÍCULO — el sistema descargó el texto oficial de los artículos que este escrito cita por fuera de la ficha verificada del catálogo, y comparó con ese texto delante lo que el escrito dice que cada uno dice. Esta advertencia se retira cuando se corrija lo que señala, no antes.'
  ];

  if (noSostenidas.length > 0) {
    bloques.push(
      `AFIRMACIONES QUE EL TEXTO OFICIAL NO SOSTIENE — ${noSostenidas.length}. NO RADIQUE SIN CORREGIRLAS.\n` +
        noSostenidas
          .map(
            (r) =>
              `- ${nombre(r)}${r.rubrica ? ` (${r.rubrica})` : ''}\n` +
              `  El escrito afirma: «${r.frase}»\n` +
              `  El texto oficial dice: «${extractoOficial(r.textoOficial, r.apoyo)}»\n` +
              `  ${r.motivo}${r.url ? ` Fuente: ${r.url}.` : ''}`
          )
          .join('\n') +
        '\nCada una queda marcada también en el párrafo donde aparece. El texto se dejó intacto a propósito, para que usted vea qué afirmó el borrador y decida con qué lo reemplaza.'
    );
  }

  if (dudosas.length > 0) {
    bloques.push(
      `AFIRMACIONES QUE NO SE PUDIERON DAR POR COMPROBADAS — ${dudosas.length}.\n` +
        dudosas
          .map(
            (r) =>
              `- ${nombre(r)}${r.rubrica ? ` (${r.rubrica})` : ''}: «${r.frase}»\n` +
              `  ${r.motivo}${r.url ? ` Texto oficial: ${r.url}.` : ''}`
          )
          .join('\n') +
        '\nNo se dan por buenas ni por malas: hay que abrir el artículo en la fuente oficial y leerlo antes de radicar.'
    );
  }

  if (sostenidas.length > 0) {
    bloques.push(
      `AFIRMACIONES COMPROBADAS CONTRA EL TEXTO OFICIAL — ${sostenidas.length}.\n` +
        sostenidas
          .map(
            (r) =>
              `- ${nombre(r)}: «${r.frase}»\n  Se apoya en el texto oficial: «${r.apoyo ?? ''}»${
                r.url ? ` (${r.url})` : ''
              }`
          )
          .join('\n') +
        '\nSe comprobó que el texto oficial del artículo sostiene lo que el escrito afirma de él.'
    );
  }

  return bloques;
};

/**
 * El escrito con la comprobación de glosa puesta encima y pegada a la frase.
 *
 * El pipeline NO la usa —compone las dos comprobaciones a la vez— pero es la
 * forma completa de esta comprobación y es la que se prueba en su guarda.
 */
export const anotarGlosa = (texto: string, revision: RevisionDeGlosa): string => {
  const bloques = bloquesDeGlosa(revision);
  if (bloques.length === 0) return texto;
  const cuerpo = marcarGlosaEnLinea(texto, revision);
  return `${bloques.join('\n\n')}\n\n${SEPARADOR_DE_AVISOS}\n\n${cuerpo}`;
};

/** Una línea para el registro de la corrida, que es donde esto se mide. */
export const resumenDeGlosa = (revision: RevisionDeGlosa): string => {
  const sostenidas = revision.resultados.filter((r) => r.veredicto === 'SOSTENIDA').length;
  return (
    `${revision.resultados.length} afirmaciones juzgadas con el texto oficial delante: ` +
    `${sostenidas} sostenidas, ${revision.noSostenidas} NO SOSTENIDAS, ${revision.dudosas} dudosas.` +
    (revision.noSostenidas > 0
      ? ` No sostenidas: ${revision.resultados
          .filter((r) => r.veredicto === 'NO_SOSTENIDA')
          .map((r) => nombre(r))
          .join(', ')}.`
      : '')
  );
};
