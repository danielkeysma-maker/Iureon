/**
 * GUARDA DE LA COMPROBACIÓN DE GLOSA.
 *
 * Run with: npm run check:glosa        (determinista, es el que gatea el CI)
 *           npm run check:glosa-red    (además consulta el Senado y el motor)
 *
 * ─── LOS DOS CASOS REALES QUE OBLIGAN A QUE ESTE ARCHIVO EXISTA ────────────
 *
 * Medidos el 9 de septiembre de 2026 sobre el borrador real de «Demanda de
 * restitución de inmueble arrendado», y comprobados contra el texto oficial:
 *
 *   · «los artículos 8, 9, 22 y 35 de la Ley 820 de 2003, SOBRE LAS
 *     OBLIGACIONES DEL ARRENDATARIO». El art. 8 está VIGENTE —el verificador de
 *     vigencia lo aprueba con razón— y son las obligaciones del ARRENDADOR: el
 *     reverso exacto. Veredicto exigido: NO_SOSTENIDA.
 *   · El art. 9 SÍ son las obligaciones del arrendatario. Veredicto exigido:
 *     SOSTENIDA. Sin este segundo caso el check pasaría con un verificador que
 *     dijera NO_SOSTENIDA a todo, que es el peor producto posible: la falsa
 *     alarma enseña a ignorar todos los avisos.
 *
 * ─── POR QUÉ EL JUEZ ES POSTIZO AQUÍ, Y POR QUÉ ESO NO LO VACÍA ───────────
 *
 * El determinista corre con TEXTO OFICIAL REAL —descargado del Senado el 10 de
 * septiembre de 2026 y copiado verbatim— y con las RESPUESTAS REALES que el
 * motor dio ese día sobre ese texto. Lo que no hace es llamar al motor: un
 * check que necesita OpenRouter no puede gatear el CI, y un check que no gatea
 * no protege nada. Lo que prueba es toda la tubería alrededor del juicio —qué
 * se manda a juzgar, qué se descarta, qué veredicto se publica, y qué le pasa
 * al escrito— más las reglas duras que el código impone POR ENCIMA de lo que el
 * motor diga. Esas reglas son la mitad del valor de este módulo y son 100%
 * comprobables sin red.
 *
 * El de red comprueba lo único que un fixture no puede: que el motor, hoy,
 * siga acertando el caso del art. 8 con ese texto delante.
 */
import {
  MAX_GLOSAS_POR_ESCRITO,
  afirmacionesPorComprobar,
  anotarGlosa,
  apoyoEstaEnElTexto,
  bloquesDeGlosa,
  extractoOficial,
  juezDelMotor,
  leerRespuestaDelJuez,
  marcarGlosaEnLinea,
  resumenDeGlosa,
  veredictoDe,
  verificarGlosaDelEscrito,
  type JuezDeGlosa,
  type RespuestaDelJuez
} from '../verificarGlosa';
import { marcarVarios } from '../verificarVigencia';
import {
  cuerpoDelBloque,
  MARCA_TACHADO,
  MAX_CUERPO,
  type VigenciaDeArticulo,
} from '../../../legislation/officialArticle.service';
import { PLAZO_GLOSA_MS, sumaDePresupuestos, TOPE_DE_FUNCION_MS } from '../../presupuestoDeTiempo';

const conRed = process.argv.includes('--red');

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

/*
 * ─── FIXTURES: TEXTO OFICIAL DEL SENADO, VERBATIM ──────────────────────────
 *
 * Descargados el 10 de septiembre de 2026 de `basedoc/ley_0820_2003.html` con
 * `consultarVigencia`, y pegados tal cual salieron. Van completos a propósito:
 * un texto «resumido» probaría al juez contra una norma que nadie publica, y
 * además el recorte es justo el defecto contra el que `MAX_CUERPO` existe.
 */
const TEXTO_ART_8 =
  'Son obligaciones del arrendador, las siguientes: 1. Entregar al arrendatario en la fecha convenida, o en el momento de la celebración del contrato, el inmueble dado en arrendamiento en buen estado de servicio, seguridad y sanidad y poner a su disposición los servicios, cosas o usos conexos y los adicionales convenidos. 2. Mantener en el inmueble los servicios, las cosas y los usos conexos y adicionales en buen estado de servir para el fin convenido en el contrato. 3. Cuando el contrato de arrendamiento de vivienda urbana conste por escrito, el arrendador deberá suministrar tanto al arrendatario como al codeudor, cuando sea el caso, copia del mismo con firmas originales. Esta obligación deberá ser satisfecha en el plazo máximo de diez (10) días contados a partir de la fecha de celebración del contrato. 4. Cuando se trate de viviendas sometidas a régimen de propiedad horizontal, el arrendador deberá entregar al arrendatario una copia de la parte normativa del mismo. En el caso de vivienda compartida, el arrendador tiene además, la obligación de mantener en adecuadas condiciones de funcionamiento, de seguridad y de sanidad las zonas o servicios de uso común y de efectuar por su cuenta las reparaciones y sustituciones necesarias, cuando no sean atribuibles a los arrendatarios, y de garantizar el mantenimiento del orden interno de la vivienda; 5. Las demás obligaciones consagradas para los arrendadores en el Capítulo II , Título XXVI, Libro 4 del Código Civil. PARÁGRAFO. El incumplimiento del numeral tercero del presente artículo será sancionado, a petición de parte, por la autoridad competente, con multas equivalentes a tres (3) mensualidades de arrendamiento.';

const TEXTO_ART_9 =
  'Son obligaciones del arrendatario: 1. Pagar el precio del arrendamiento dentro del plazo estipulado en el contrato, en el inmueble arrendado o en el lugar convenido. 2. Cuidar el inmueble y las cosas recibidas en arrendamiento. En caso de daños o deterioros distintos a los derivados del uso normal o de la acción del tiempo y que fueren imputables al mal uso del inmueble o a su propia culpa, efectuar oportunamente y por su cuenta las reparaciones o sustituciones necesarias. 3. Pagar a tiempo los servicios, cosas o usos conexos y adicionales, así como las expensas comunes en los casos en que haya lugar, de conformidad con lo establecido en el contrato. 4. Cumplir las normas consagradas en los reglamentos de propiedad horizontal y las que expida el gobierno en protección de los derechos de todos los vecinos. En caso de vivienda compartida y de pensión, el arrendatario está obligado además a cuidar las zonas y servicios de uso común y a efectuar por su cue nta las reparaciones o sustituciones necesarias, cuando sean atribuibles a su propia culpa o, a la de sus dependientes, y 5. Las demás obligaciones consagradas para los arrendatarios en el Capítulo III , Título XXVI, libro 4 del Código Civil.';

const vigenciaDe = (articulo: number, cuerpo: string, rubrica: string): VigenciaDeArticulo => ({
  referencia: { codigo: 'LEY 820 DE 2003', articulo },
  estado: 'VIGENTE',
  detalle: 'El texto oficial lo publica sin marca de derogación.',
  url: `https://www.secretariasenado.gov.co/senado/basedoc/ley_0820_2003.html#${articulo}`,
  rubrica,
  cuerpo,
  lecturas: [],
  fuentesQueOpinaron: ['SENADO'],
  consultadoEn: '2026-09-10'
});

const VIGENCIAS: VigenciaDeArticulo[] = [
  vigenciaDe(8, TEXTO_ART_8, 'ARTÍCULO 8o. OBLIGACIONES DEL ARRENDADOR'),
  vigenciaDe(9, TEXTO_ART_9, 'ARTÍCULO 9o. OBLIGACIONES DEL ARRENDATARIO'),
  {
    /* El 35 lo derogó el CGP. No se juzga su glosa: ya lleva su propia marca. */
    referencia: { codigo: 'LEY 820 DE 2003', articulo: 35 },
    estado: 'DEROGADO',
    detalle: 'Artículo derogado por el literal c) del artículo 626 de la Ley 1564 de 2012.',
    cuerpo: '<Artículo derogado por el literal c) del artículo 626 de la Ley 1564 de 2012.>',
    lecturas: [],
    fuentesQueOpinaron: ['SENADO'],
    consultadoEn: '2026-09-10'
  },
  {
    /* Sin cuerpo no hay contra qué comparar: juzgarlo sería volver al recuerdo. */
    referencia: { codigo: 'CGP', articulo: 384 },
    estado: 'NO_VERIFICABLE',
    detalle: 'El texto oficial del Senado no respondió.',
    lecturas: [],
    fuentesQueOpinaron: [],
    consultadoEn: '2026-09-10'
  }
];

/** La frase REAL del borrador del 9 de septiembre de 2026. */
const BORRADOR =
  'Se invocan como fundamento de esta solicitud los artículos 8, 9, 22 y 35 de la Ley 820 de 2003, sobre las obligaciones del arrendatario, y se pide la restitución del inmueble.';

/*
 * RESPUESTAS REALES DEL MOTOR, medidas el 10 de septiembre de 2026 con estos
 * mismos textos oficiales delante. No están inventadas para que el check pase:
 * están copiadas de la corrida, y el `apoyo` de cada una está de verdad dentro
 * del texto oficial de arriba — que es lo que el código comprueba.
 */
const RESPUESTA_ART_8: RespuestaDelJuez = {
  veredicto: 'NO_SOSTENIDA',
  apoyo: 'Son obligaciones del arrendador, las siguientes:',
  motivo: 'El artículo regula las obligaciones del arrendador y no las del arrendatario como sostiene la frase.'
};

const RESPUESTA_ART_9: RespuestaDelJuez = {
  veredicto: 'SOSTENIDA',
  apoyo: 'Son obligaciones del arrendatario: 1. Pagar el precio del arrendamiento',
  motivo: 'El artículo 9 regula expresamente las obligaciones del arrendatario, tal como afirma la frase.'
};

/** Un juez postizo que contesta según el artículo que le pongan delante. */
const juezDeFixture =
  (porArticulo: Record<number, RespuestaDelJuez | null>): JuezDeGlosa =>
  async (afirmacion) =>
    porArticulo[afirmacion.referencia.articulo] ?? null;

const asincronos = async (): Promise<void> => {
  /* ─── 1. EL TEXTO DEL ARTÍCULO SE PUBLICA, Y ES LO QUE FALTABA ─────────── */

  const BLOQUE = `<p><a class="bookmarkaj" name="9">ART&Iacute;CULO 9o. OBLIGACIONES DEL ARRENDATARIO.</A> Son obligaciones del arrendatario: 1. Pagar el precio del arrendamiento dentro del plazo estipulado.</p>
<div><a class="caja_vja_encabezado" href="javascript:insRow3()">Notas de Vigencia</a></div>`;
  const cuerpo = cuerpoDelBloque(BLOQUE);
  check(
    'el cuerpo del artículo se extrae del HTML oficial, no solo su epígrafe',
    cuerpo.startsWith('Son obligaciones del arrendatario'),
    cuerpo.slice(0, 60)
  );
  check(
    'y no arrastra el rótulo de las cajas plegables, que no es texto del artículo',
    !cuerpo.includes('Notas de Vigencia'),
    cuerpo
  );
  /*
   * EL TACHADO NO PUEDE LLEGAR AL JUEZ DE LA GLOSA COMO SI FUERA DERECHO.
   *
   * Caso real: Ley 610 de 2000, art. 6 —el daño patrimonial al Estado—, cuyas
   * expresiones «uso indebido» e «inequitativa» están tachadas por
   * INEXEQUIBLES (C-340-07). Antes de la marca salían del conversor
   * indistinguibles del texto vivo, y una glosa apoyada en ellas se habría
   * declarado SOSTENIDA con su pasaje de respaldo.
   */
  const CON_TACHADO = `<p><a class="bookmarkaj" name="6">ART&Iacute;CULO 6o. DA&Ntilde;O PATRIMONIAL AL ESTADO.</A> Para efectos de esta ley se entiende por da&ntilde;o patrimonial al Estado la lesi&oacute;n del patrimonio p&uacute;blico, producida por una gesti&oacute;n fiscal antiecon&oacute;mica, <S>inequitativa</S> e inoportuna, o por el <S>uso indebido</S> de los bienes p&uacute;blicos.</p>`;
  const tachado = cuerpoDelBloque(CON_TACHADO);
  check(
    'el aparte que la Corte declaró inexequible NO se devuelve como texto del artículo',
    !tachado.includes('inequitativa') && !tachado.includes('uso indebido'),
    tachado
  );
  check(
    'y en su lugar queda dicho que ahí faltan palabras, para que la frase no se lea entera',
    tachado.includes(MARCA_TACHADO),
    tachado
  );
  check(
    'lo que NO está tachado sigue intacto: la marca no se come el artículo',
    tachado.includes('lesión del patrimonio público') && tachado.includes('antieconómica'),
    tachado
  );
  const sinTachado = cuerpoDelBloque(
    `<p><a class="bookmarkaj" name="1">ART. 1.</A> El <span>arrendador</span> debe la cosa.</p>`
  );
  check(
    'y un artículo sin tachados no gana la marca ni pierde una etiqueta parecida (<span>)',
    sinTachado === 'El arrendador debe la cosa.',
    sinTachado
  );

  check(
    'el tope del cuerpo cubre entero el artículo más largo que estos borradores citan (CGP 384, 6.089 caracteres)',
    MAX_CUERPO >= 6_089,
    String(MAX_CUERPO)
  );
  const largo = cuerpoDelBloque(`<p><a class="bookmarkaj" name="1">ART. 1.</A> ${'x'.repeat(MAX_CUERPO + 500)}</p>`);
  check(
    'un artículo monstruoso se recorta Y EL RECORTE SE DICE, para que el juez no crea que lo vio entero',
    largo.length > MAX_CUERPO && /recortado/.test(largo),
    `${largo.length} caracteres`
  );

  /* ─── 2. QUÉ SE MANDA A JUZGAR ─────────────────────────────────────────── */

  const afirmaciones = afirmacionesPorComprobar(BORRADOR, VIGENCIAS);
  check(
    'la frase que afirma algo se empareja con el texto oficial de cada artículo que nombra',
    afirmaciones.length === 2,
    afirmaciones.map((a) => a.referencia.articulo).join(', ')
  );
  check(
    'el artículo DEROGADO no se manda a juzgar: ya lleva su propia marca',
    !afirmaciones.some((a) => a.referencia.articulo === 35)
  );
  check(
    'el artículo cuyo texto no se pudo bajar TAMPOCO se juzga: sin texto sería volver a preguntarle al modelo qué recuerda',
    !afirmaciones.some((a) => a.referencia.articulo === 384)
  );
  check(
    'cada afirmación viaja con el texto oficial de SU artículo, no con el de otro',
    afirmaciones.find((a) => a.referencia.articulo === 8)?.textoOficial === TEXTO_ART_8 &&
      afirmaciones.find((a) => a.referencia.articulo === 9)?.textoOficial === TEXTO_ART_9
  );
  check(
    'y la frase que se le muestra al abogado no empieza a media palabra',
    afirmaciones.every((a) => /^[A-Za-zÁÉÍÓÚÑáéíóúñ«"(]/.test(a.frase) && a.frase.startsWith('invocan')),
    afirmaciones[0]?.frase.slice(0, 40)
  );

  const sinGlosa = afirmacionesPorComprobar(
    'Se solicita la restitución del inmueble conforme al artículo 8 de la Ley 820 de 2003.',
    VIGENCIAS
  );
  check(
    'una cita que NO afirma nada del artículo no gasta una llamada: pedir no es glosar',
    sinGlosa.length === 0,
    String(sinGlosa.length)
  );

  /* ─── 3. LOS DOS CASOS REALES, DE PUNTA A PUNTA ────────────────────────── */

  const revision = await verificarGlosaDelEscrito(
    BORRADOR,
    VIGENCIAS,
    5_000,
    juezDeFixture({ 8: RESPUESTA_ART_8, 9: RESPUESTA_ART_9 })
  );

  const art8 = revision.resultados.find((r) => r.referencia.articulo === 8);
  const art9 = revision.resultados.find((r) => r.referencia.articulo === 9);

  check(
    'CASO REAL 1 — «sobre las obligaciones del arrendatario» sobre el art. 8 (que es el ARRENDADOR): NO_SOSTENIDA',
    art8?.veredicto === 'NO_SOSTENIDA',
    art8?.veredicto
  );
  check(
    'y el veredicto trae el pasaje del texto oficial que lo desmiente',
    art8?.apoyo === 'Son obligaciones del arrendador, las siguientes:',
    art8?.apoyo
  );
  check(
    'CASO REAL 2 — la misma frase sobre el art. 9, que SÍ son las del arrendatario: SOSTENIDA',
    art9?.veredicto === 'SOSTENIDA',
    art9?.veredicto
  );
  check(
    'sin este segundo caso el check pasaría con un verificador que acusara a todo, que es el peor producto posible',
    art9?.veredicto !== art8?.veredicto
  );
  check('el recuento coincide con los veredictos', revision.noSostenidas === 1 && revision.dudosas === 0);

  /* ─── 4. LAS REGLAS DURAS, QUE ESTÁN EN CÓDIGO Y NO EN EL PROMPT ───────── */

  const afirmacion8 = afirmaciones.find((a) => a.referencia.articulo === 8)!;

  check(
    'SIN FRAGMENTO no hay veredicto favorable: una SOSTENIDA sin apoyo baja a DUDOSA',
    veredictoDe(afirmacion8, { veredicto: 'SOSTENIDA', motivo: 'sí, lo dice' }).veredicto === 'DUDOSA'
  );
  check(
    'un apoyo INVENTADO tampoco sostiene: si no está en el texto oficial, baja a DUDOSA',
    veredictoDe(afirmacion8, {
      veredicto: 'SOSTENIDA',
      apoyo: 'Son obligaciones del arrendatario según este artículo octavo de la ley',
      motivo: 'lo dice el numeral primero'
    }).veredicto === 'DUDOSA'
  );
  check(
    'y el escrito dice POR QUÉ no se dio por comprobada, en vez de callarlo',
    /no pudo señalar/i.test(veredictoDe(afirmacion8, { veredicto: 'SOSTENIDA', motivo: 'x' }).motivo)
  );
  check(
    'un apoyo demasiado corto no prueba que el juez leyera nada',
    !apoyoEstaEnElTexto('obligaciones', TEXTO_ART_8)
  );
  check(
    'pero una copia buena se reconoce aunque cambien tildes, mayúsculas y espacios',
    apoyoEstaEnElTexto('SON  OBLIGACIONES DEL ARRENDADOR, LAS SIGUIENTES', TEXTO_ART_8)
  );
  check(
    'el motor mudo NO produce un veredicto: produce un DUDOSA que se declara',
    veredictoDe(afirmacion8, null).veredicto === 'DUDOSA' &&
      /SIN COMPROBAR/.test(veredictoDe(afirmacion8, null).motivo)
  );
  check(
    'un veredicto que no es ninguno de los tres tampoco se publica como bueno',
    veredictoDe(afirmacion8, { veredicto: 'PROBABLEMENTE SÍ' }).veredicto === 'DUDOSA'
  );
  check(
    'una NO_SOSTENIDA escrita con guion o en minúsculas se entiende igual',
    veredictoDe(afirmacion8, { veredicto: 'no-sostenida', motivo: 'dice lo contrario' }).veredicto ===
      'NO_SOSTENIDA'
  );

  /* ─── 5. AGOTAR EL PLAZO ES DUDOSA, NUNCA UN BORRADOR PERDIDO ──────────── */

  const nuncaContesta: JuezDeGlosa = () => new Promise(() => {});
  const t0 = Date.now();
  const porPlazo = await verificarGlosaDelEscrito(BORRADOR, VIGENCIAS, 3_000, nuncaContesta);
  check(
    'un juez que no contesta NO tumba la entrega: devuelve DUDOSA dentro del plazo',
    porPlazo.dudosas === 2 && Date.now() - t0 < 6_000,
    `${Date.now() - t0} ms`
  );

  const queExplota: JuezDeGlosa = async () => {
    throw new Error('OpenRouter no respondió');
  };
  const porFallo = await verificarGlosaDelEscrito(BORRADOR, VIGENCIAS, 3_000, queExplota);
  check(
    'y un fallo del motor tampoco: también sale DUDOSA declarada',
    porFallo.dudosas === 2 && porFallo.resultados.every((r) => /SIN COMPROBAR/.test(r.motivo))
  );

  /* ─── 6. QUÉ LE PASA AL ESCRITO ────────────────────────────────────────── */

  const anotado = anotarGlosa(BORRADOR, revision);
  check(
    'la no sostenida queda marcada PEGADA A LA FRASE, dentro del párrafo',
    anotado.includes('NO LO DICE ESE ARTÍCULO')
  );
  check(
    'con el texto oficial al lado, para que se vea en dos líneas por qué no se sostiene',
    anotado.includes('Son obligaciones del arrendador')
  );
  check(
    'y también arriba, en el bloque que lee quien hojea',
    anotado.includes('AFIRMACIONES QUE EL TEXTO OFICIAL NO SOSTIENE')
  );
  check(
    'el escrito NO se reescribe ni se recorta: lo que el motor escribió sigue entero',
    anotado.includes(BORRADOR.slice(0, 60)) && anotado.trimEnd().endsWith('del inmueble.')
  );
  check(
    'la sostenida no ensucia el párrafo: se declara arriba y nada más',
    (anotado.match(/NO LO DICE ESE ARTÍCULO/g) ?? []).length === 1
  );
  check(
    'sin nada que juzgar, el escrito sale idéntico y sin cabecera vacía',
    anotarGlosa(BORRADOR, { resultados: [], noSostenidas: 0, dudosas: 0 }) === BORRADOR
  );
  check(
    'una dudosa se declara DUDOSA: ni por buena ni por mala',
    bloquesDeGlosa(porPlazo).some((b) => /NO SE PUDIERON DAR POR COMPROBADAS/.test(b))
  );
  check(
    'y el registro de la corrida dice la cifra real, no una impresión',
    /1 NO SOSTENIDAS/.test(resumenDeGlosa(revision)),
    resumenDeGlosa(revision)
  );

  /* ─── 7. DOS MARCAS EN UNA ENUMERACIÓN: LAS DOS APARECEN ───────────────── */

  /*
   * Regresión medida: encadenar las marcas perdía la segunda. La del art. 8 se
   * inserta en medio de «los artículos 8, 9, 22 y 35» y contiene puntos, así
   * que la ventana sin puntos de `marcarVarios` ya no alcanzaba al 22. El
   * escrito avisaba de la mitad de sus afirmaciones falsas, en silencio.
   */
  const dos = marcarVarios(BORRADOR, [
    { articulo: 8, marca: '[UNO. Con punto.]' },
    { articulo: 22, marca: '[DOS. Con punto.]' }
  ]);
  check(
    'dos marcas dentro de la misma enumeración salen las DOS, no solo la primera',
    dos.includes('[UNO. Con punto.]') && dos.includes('[DOS. Con punto.]'),
    dos.slice(0, 120)
  );
  check(
    'y una cuantía suelta que no es una cita sigue sin marcarse',
    marcarVarios('La deuda asciende a 8 millones.', [{ articulo: 8, marca: '[X]' }]) ===
      'La deuda asciende a 8 millones.'
  );

  /* ─── 8. EL RELOJ ──────────────────────────────────────────────────────── */

  check(
    'la comprobación de glosa tiene su propia partida en el presupuesto',
    PLAZO_GLOSA_MS >= 15_000,
    `${PLAZO_GLOSA_MS} ms`
  );
  check(
    'y la suma de las etapas sigue cabiendo bajo el tope de la función',
    sumaDePresupuestos() < TOPE_DE_FUNCION_MS,
    `${sumaDePresupuestos()} ms de ${TOPE_DE_FUNCION_MS} ms`
  );
  check('no se juzgan más glosas por escrito de las presupuestadas', MAX_GLOSAS_POR_ESCRITO <= 8);

  /* ─── 9. LECTURA DE LA RESPUESTA ───────────────────────────────────────── */

  check(
    'el JSON envuelto en una valla de markdown se lee igual',
    leerRespuestaDelJuez('```json\n{"veredicto":"DUDOSA","motivo":"no está claro"}\n```')?.veredicto ===
      'DUDOSA'
  );
  check('una respuesta que no es JSON no inventa un veredicto', leerRespuestaDelJuez('no sé') === null);
  check(
    'un JSON sin veredicto tampoco',
    leerRespuestaDelJuez('{"motivo":"lo dice el artículo"}') === null
  );
  check(
    'el extracto oficial se centra en el pasaje señalado, que es el que explica el veredicto',
    extractoOficial(TEXTO_ART_8, 'Las demás obligaciones consagradas para los arrendadores').includes(
      'Las demás obligaciones consagradas para los arrendadores'
    )
  );

  /* ─── 10. Y AHORA, SI SE PIDIÓ, CONTRA EL MOTOR DE VERDAD ──────────────── */

  if (conRed) {
    console.log('');
    console.log('Juzgando con el motor real, con el texto oficial delante…');
    const t = Date.now();
    const real = await juezDelMotor(afirmacion8, 25_000);
    const juzgado = veredictoDe(afirmacion8, real);
    check(
      'EN VIVO: el motor, con el art. 8 delante, NO sostiene «sobre las obligaciones del arrendatario»',
      juzgado.veredicto === 'NO_SOSTENIDA',
      `${Date.now() - t} ms · ${juzgado.veredicto} · apoyo: ${juzgado.apoyo ?? '(ninguno)'}`
    );
  } else {
    console.log('');
    console.log('(El motor no se llamó: `npm run check:glosa-red` lo hace.)');
  }

  console.log('');
  if (fallos > 0) {
    console.log(`${fallos} comprobación(es) no pasaron.`);
    process.exitCode = 1;
  } else {
    // Uno de los tres banners que reconoce `run-all-checks.mjs`; inventar un
    // cuarto marca el check como ROTO, y con razón.
    console.log('TODO BIEN — la comprobación de glosa sostiene sus invariantes.');
  }
};

void asincronos();
