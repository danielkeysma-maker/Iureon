import { referenciasDelTexto, claveDe, etiquetaDeNorma, type ReferenciaNormativa } from '../citacionNormativa';
import {
  NOMBRE_DE_FUENTE,
  consultarVigencia,
  type EstadoDeVigencia,
  type VigenciaDeArticulo
} from '../../legislation/officialArticle.service';

/**
 * LA VIGENCIA DE LO QUE EL BORRADOR YA CITÓ, comprobada contra el texto oficial
 * DESPUÉS de redactar y ANTES de entregar.
 *
 * ─── QUÉ HACE ESTO POSIBLE, Y QUÉ REPARA ───────────────────────────────────
 *
 * La respuesta inmediata al hallazgo del 9 de septiembre de 2026 fue cerrar la
 * lista de artículos citables a la ficha más el andamiaje. Funcionó —de 25
 * artículos fuera de ficha a 0— pero AMPUTA: el escrito sale más pobre porque
 * todo lo que el modelo sabe y esta casa no ha leído queda prohibido, esté vivo
 * o muerto. Este archivo es lo que permite volver a abrir la mano: si hay quien
 * compruebe la vigencia de lo que se cita, citar fuera de la ficha vuelve a ser
 * un riesgo medido en vez de una apuesta.
 *
 * ─── LO QUE COMPRUEBA Y LO QUE NO, DICHO AQUÍ PARA QUE NADIE LO CONFUNDA ───
 *
 * Comprueba VIGENCIA: que el artículo siga en el ordenamiento. NO comprueba la
 * GLOSA: que lo que el escrito dice que el artículo dice sea cierto. El otro
 * defecto medido ese día fue exactamente ése —«los artículos 8, 9, 22 y 35 de la
 * Ley 820, sobre las obligaciones del arrendatario», cuando el 8 es el reverso,
 * las obligaciones del ARRENDADOR—, y de él este módulo no protege ni un poco:
 * el art. 8 sale VIGENTE, porque lo está. Por eso la regla 2 de
 * `catalogGuidance.ts` (el número no autoriza el contenido) NO se relaja aunque
 * la regla 1 sí: son dos defectos distintos y solo uno tiene aquí un guardián.
 *
 * ─── POR QUÉ EL RESULTADO SE MARCA EN EL ESCRITO Y NO SE REESCRIBE ─────────
 *
 * Con un artículo derogado dentro del borrador había tres salidas, y las tres
 * son malas. Se escogió la menos mala y aquí queda por qué:
 *
 *   · REESCRIBIR el pasaje pidiéndoselo al motor. Cuesta una segunda pasada de
 *     Opus —medida en 85–125 s— que no cabe en lo que queda del reloj de la
 *     función, y sobre todo el motor reescribiría SIN el texto oficial delante:
 *     cambiaría un fundamento no comprobado por otro no comprobado. Se descarta.
 *   · BORRAR la cita a espaldas del abogado. Deja un párrafo argumentando sobre
 *     un artículo que ya no está y un escrito limpio en apariencia, que es la
 *     forma más eficaz de que nadie mire. Es la doctrina que este repositorio ya
 *     escribió en `openrouter.service.ts`: SE DECLARA, NO SE EDITA.
 *   · MARCARLO en el propio escrito, donde no se pueda pasar por alto. Feo, sí.
 *     Pero la pregunta correcta no es cuál de los dos escritos se ve mejor, sino
 *     cuál de los dos radica el abogado: uno con una advertencia fea se corrige
 *     en dos minutos; uno limpio con el art. 2035 del Código Civil como
 *     fundamento se radica y se pierde.
 *
 * Se marca DOS VECES a propósito: en línea, pegado a la cita, para quien lee el
 * párrafo; y en un bloque al principio, para quien hojea. Y solo se INSERTA
 * texto — nunca se borra ni se reordena una sola palabra de lo que el motor
 * escribió, para que el abogado siempre pueda ver qué había.
 *
 * ─── FALLAR ABIERTO ES OBLIGATORIO AQUÍ ────────────────────────────────────
 *
 * Si la fuente no responde, el escrito sale igual con sus citas declaradas NO
 * VERIFICADAS. Un borrador perdido es peor que uno con una advertencia, y esta
 * comprobación llega cuando el trabajo caro ya está hecho y pagado.
 */

/** Cuántos artículos se consultan por escrito. Ver el comentario del presupuesto. */
export const MAX_ARTICULOS_POR_ESCRITO = 12;

export interface RevisionDeVigencia {
  resultados: VigenciaDeArticulo[];
  derogados: number;
  noVerificables: number;
  /** Los que las fuentes oficiales cuentan distinto. Ver `officialArticle.service.ts`. */
  discrepantes: number;
}

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
 * Los artículos del escrito que hay que ir a comprobar: los que cita y que NO
 * están en el universo autorizado.
 *
 * Los autorizados se saltan porque alguien de esta casa ya leyó su norma contra
 * la fuente al construir la ficha; gastar el presupuesto en ellos dejaría sin
 * comprobar justo los que nadie ha mirado, que son los peligrosos.
 */
export const articulosPorComprobar = (
  texto: string,
  autorizados: ReferenciaNormativa[]
): ReferenciaNormativa[] => {
  const permitidos = new Set(autorizados.map(claveDe));
  return referenciasDelTexto(texto, null)
    .filter((ref) => !permitidos.has(claveDe(ref)))
    .slice(0, MAX_ARTICULOS_POR_ESCRITO);
};

/**
 * Consulta la vigencia de todo lo que el escrito citó por fuera de lo
 * autorizado. Nunca lanza: agotar el plazo significa NO_VERIFICABLE, que se
 * declara en el escrito, y nunca un fallo que tumbe la entrega.
 */
export const verificarVigenciaDelEscrito = async (
  texto: string,
  autorizados: ReferenciaNormativa[],
  limiteMs = 20_000
): Promise<RevisionDeVigencia> => {
  const porComprobar = articulosPorComprobar(texto, autorizados);
  if (porComprobar.length === 0)
    return { resultados: [], derogados: 0, noVerificables: 0, discrepantes: 0 };

  const seAgotoElPlazo = (referencia: ReferenciaNormativa): VigenciaDeArticulo => ({
    referencia,
    estado: 'NO_VERIFICABLE',
    detalle:
      'Ninguna fuente oficial respondió dentro del plazo del escrito; no se sabe si el artículo sigue vigente.',
    lecturas: [],
    fuentesQueOpinaron: [],
    consultadoEn: new Date().toISOString().slice(0, 10)
  });

  /*
   * En paralelo, y con el MISMO plazo para todos: las fuentes son públicas y
   * comunes a todos los artículos, así que el que llega tarde es el sitio y no
   * un artículo en particular. El plazo individual es un poco menor que el de
   * la etapa para que el tope de aquí gane siempre al de arriba y el resultado
   * sea NO_VERIFICABLE declarado en vez de una etapa cortada sin decir de qué.
   *
   * Y DENTRO de cada consulta las fuentes también corren en paralelo
   * (`consultarVigencia`), así que pasar de una fuente a dos no dobló el reloj:
   * cuesta lo que cueste la más lenta.
   */
  const plazoIndividual = Math.max(2_000, limiteMs - 1_000);
  const resultados = await Promise.all(
    porComprobar.map((referencia) =>
      conTope(consultarVigencia(referencia, plazoIndividual), plazoIndividual, seAgotoElPlazo(referencia))
    )
  );

  return {
    resultados,
    derogados: resultados.filter((r) => r.estado === 'DEROGADO').length,
    noVerificables: resultados.filter((r) => r.estado === 'NO_VERIFICABLE').length,
    discrepantes: resultados.filter((r) => r.estado === 'DISCREPANCIA_ENTRE_FUENTES').length
  };
};

/** Cómo se nombra un artículo cuando se le habla al abogado. */
const nombre = (r: VigenciaDeArticulo): string =>
  `${etiquetaDeNorma(r.referencia.codigo)}, art. ${r.referencia.articulo}`;

/**
 * Pega la marca justo después de la cita, dentro del párrafo.
 *
 * Solo INSERTA. La cabeza de cita («artículo», «arts.») tiene que estar a menos
 * de 60 caracteres del número y sin punto de por medio, que es la misma ventana
 * con la que `citacionNormativa.ts` lee una cola de cita: fuera de ahí, el
 * número suelto puede ser una cuantía o un año, y marcar uno de esos sería la
 * falsa alarma que enseña a ignorar todas las marcas.
 */
export const marcarEnLinea = (texto: string, articulo: number, marca: string): string =>
  marcarVarios(texto, [{ articulo, marca }]);

/**
 * VARIAS MARCAS EN UNA SOLA PASADA, Y NO ES UN REFINAMIENTO: encadenarlas
 * perdía marcas.
 *
 * Medido el 10 de septiembre de 2026 sobre la frase real «los artículos 8, 9,
 * 22 y 35 de la Ley 820 de 2003, sobre las obligaciones del arrendatario»: el
 * art. 8 y el 22 salieron los dos NO SOSTENIDOS, y en el escrito solo apareció
 * marcado el 8. La causa es que la marca del 8 se inserta EN MEDIO de la
 * enumeración y contiene puntos, y la ventana de esta expresión regular
 * (`[^.;\n]{0,60}`) se niega a cruzar un punto — así que al buscar el 22 la
 * cabeza «los artículos» ya no lo alcanzaba. El escrito habría avisado de la
 * mitad de sus afirmaciones falsas, en silencio y sin que nada fallara.
 *
 * Por eso todas las posiciones se calculan sobre el texto ORIGINAL y las
 * inserciones se aplican de atrás hacia adelante, para que ninguna corra a las
 * demás.
 */
export const marcarVarios = (
  texto: string,
  marcas: Array<{ articulo: number; marca: string }>
): string => {
  const inserciones: Array<{ en: number; marca: string }> = [];
  for (const { articulo, marca } of marcas) {
    const re = new RegExp(`\\b(?:art[íi]culos?|arts?\\.)[^.;\\n]{0,60}?\\b${articulo}\\b`, 'gi');
    let m: RegExpExecArray | null;
    while ((m = re.exec(texto))) inserciones.push({ en: m.index + m[0].length, marca });
  }
  return inserciones
    .sort((a, b) => b.en - a.en)
    .reduce((acc, { en, marca }) => `${acc.slice(0, en)} ${marca}${acc.slice(en)}`, texto);
};

/**
 * LA MARCA EN LÍNEA, SEPARADA DE LA CABECERA. Y separarlas hizo falta.
 *
 * Cuando llegó la comprobación de GLOSA, las dos anotaciones pasaron a correr
 * sobre el mismo escrito. Si cada una hace su marcado y su cabecera de una vez,
 * la segunda marca DENTRO de la cabecera de la primera: el bloque de vigencia
 * escribe «Ley 820 de 2003, art. 8», el marcador de la glosa ve ahí una cita y
 * le pega su corchete. El aviso quedaría anotando a otro aviso, que es la forma
 * más rápida de que un abogado deje de leer los dos.
 *
 * Con las dos mitades sueltas, el pipeline marca el CUERPO una vez con cada
 * comprobación y apila las cabeceras encima, donde ya no hay nada que marcar.
 */
export const marcarVigenciaEnLinea = (texto: string, revision: RevisionDeVigencia): string =>
  marcarVarios(texto, [
    ...revision.resultados
      .filter((x) => x.estado === 'DEROGADO')
      .map((r) => ({
        articulo: r.referencia.articulo,
        marca: `[NORMA DEROGADA — este artículo NO está vigente: ${r.detalle}. No puede fundar lo que aquí se pide; corríjalo antes de radicar.]`
      })),
    /*
     * LA DISCREPANCIA TAMBIÉN SE MARCA EN EL PÁRRAFO, y no solo arriba.
     *
     * Dejarla únicamente en la cabecera la convertiría en un dato de auditoría:
     * quien lee el párrafo se apoyaría en el artículo sin enterarse de que dos
     * fuentes oficiales no se ponen de acuerdo sobre si existe. La marca no dice
     * qué hacer —esta casa no lo sabe— sino que hay que abrir las dos y decidir.
     */
    ...revision.resultados
      .filter((x) => x.estado === 'DISCREPANCIA_ENTRE_FUENTES')
      .map((r) => ({
        articulo: r.referencia.articulo,
        marca: `[LAS FUENTES OFICIALES NO COINCIDEN sobre este artículo — ${r.detalle} Esta casa no elige: compruébelo usted antes de radicar.]`
      }))
  ]);

/** La línea que separa los avisos del escrito. Compartida con la comprobación de glosa. */
export const SEPARADOR_DE_AVISOS = '─────────────────────────────────────────────';

/**
 * Los avisos de cabecera de esta comprobación, encabezado incluido. Lista vacía
 * cuando no hubo nada que comprobar: un encabezado seguido de nada es una
 * casilla, y este repositorio ya sabe cómo terminan.
 */
export const bloquesDeVigencia = (revision: RevisionDeVigencia): string[] => {
  const { resultados } = revision;
  if (resultados.length === 0) return [];

  const derogados = resultados.filter((r) => r.estado === 'DEROGADO');
  const noVerificables = resultados.filter((r) => r.estado === 'NO_VERIFICABLE');
  const discrepantes = resultados.filter((r) => r.estado === 'DISCREPANCIA_ENTRE_FUENTES');
  const vigentes = resultados.filter((r) => r.estado === 'VIGENTE');

  const bloques: string[] = [
    'COMPROBACIÓN AUTOMÁTICA DE VIGENCIA — la hizo el sistema consultando las fuentes normativas oficiales (la Secretaría del Senado y el Gestor Normativo de Función Pública), artículo por artículo, sobre las citas que este escrito trae por fuera de la ficha verificada del catálogo. Esta advertencia se retira cuando se corrija lo que señala, no antes.'
  ];

  if (derogados.length > 0) {
    bloques.push(
      `ARTÍCULOS DEROGADOS EN ESTE ESCRITO — ${derogados.length}. NO RADIQUE SIN CORREGIRLOS.\n` +
        derogados
          .map((r) => `- ${nombre(r)} (${r.rubrica ?? 'sin epígrafe'}): ${r.detalle}. Fuente: ${r.url ?? 'texto oficial del Senado'}.`)
          .join('\n') +
        '\nCada uno queda marcado también en el párrafo donde aparece. El texto se dejó intacto a propósito, para que usted vea qué argumentó el borrador y decida con qué lo reemplaza.'
    );
  }

  /*
   * VA ANTES QUE LOS NO VERIFICABLES A PROPÓSITO: un artículo sobre el que dos
   * fuentes oficiales se contradicen es más urgente que uno que nadie contestó.
   * En el segundo caso no se sabe nada; en el primero se sabe que ALGO está mal
   * en el ordenamiento publicado, y el escrito se apoya en él.
   */
  if (discrepantes.length > 0) {
    bloques.push(
      `CITAS SOBRE LAS QUE LAS FUENTES OFICIALES NO COINCIDEN — ${discrepantes.length}. NO RADIQUE SIN COMPROBARLAS.\n` +
        discrepantes
          .map(
            (r) =>
              `- ${nombre(r)}: ${r.lecturas
                .filter((l) => l.estado === 'VIGENTE' || l.estado === 'DEROGADO')
                .map((l) => `${NOMBRE_DE_FUENTE[l.fuente]} lo da por ${l.estado} → ${l.url ?? 'sin URL'}`)
                .join('   ·   ')}`
          )
          .join('\n') +
        '\nEl sistema NO escoge cuál tiene razón: escoger sería inventar con cara de rigor. Abra las dos páginas y decida usted.'
    );
  }

  if (noVerificables.length > 0) {
    bloques.push(
      `CITAS CUYA VIGENCIA NO SE PUDO COMPROBAR — ${noVerificables.length}.\n` +
        noVerificables.map((r) => `- ${nombre(r)}: ${r.detalle}`).join('\n') +
        '\nNo se dan por buenas ni por malas: hay que abrirlas en la fuente oficial antes de radicar.'
    );
  }

  if (vigentes.length > 0) {
    bloques.push(
      `CITAS CON VIGENCIA COMPROBADA EL ${vigentes[0].consultadoEn} contra el texto oficial del Senado — ${vigentes.length}.\n` +
        vigentes.map((r) => `- ${nombre(r)} (${r.rubrica ?? 'sin epígrafe'}). ${r.url ?? ''}`).join('\n') +
        '\nSe comprobó que siguen VIGENTES. NO se comprobó aquí que el escrito diga bien lo que dicen: eso lo comprueba, con el texto oficial delante, `verificarGlosa.ts`.'
    );
  }

  return bloques;
};

/**
 * El escrito con la comprobación de vigencia puesta encima.
 *
 * El pipeline NO la usa —compone las dos comprobaciones a la vez para que
 * ninguna marque dentro de la cabecera de la otra— pero es la forma completa de
 * esta comprobación y es la que se prueba en su guarda.
 */
export const anotarVigencia = (texto: string, revision: RevisionDeVigencia): string => {
  const bloques = bloquesDeVigencia(revision);
  if (bloques.length === 0) return texto;
  const cuerpo = marcarVigenciaEnLinea(texto, revision);
  return `${bloques.join('\n\n')}\n\n${SEPARADOR_DE_AVISOS}\n\n${cuerpo}`;
};

/** Una línea para el registro de la corrida, que es donde esto se mide. */
export const resumenDeVigencia = (revision: RevisionDeVigencia): string => {
  const porEstado = (estado: EstadoDeVigencia): number =>
    revision.resultados.filter((r) => r.estado === estado).length;
  return (
    `${revision.resultados.length} citas fuera de ficha comprobadas contra el texto oficial: ` +
    `${porEstado('VIGENTE')} vigentes, ${porEstado('DEROGADO')} DEROGADAS, ` +
    `${porEstado('DISCREPANCIA_ENTRE_FUENTES')} con DISCREPANCIA entre fuentes, ` +
    `${porEstado('NO_VERIFICABLE')} no verificables.` +
    (revision.derogados > 0
      ? ` Derogadas: ${revision.resultados
          .filter((r) => r.estado === 'DEROGADO')
          .map((r) => nombre(r))
          .join(', ')}.`
      : '')
  );
};
