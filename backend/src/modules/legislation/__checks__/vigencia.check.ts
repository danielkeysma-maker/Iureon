/**
 * GUARDA DE LA COMPROBACIÓN DE VIGENCIA.
 *
 * Run with: npm run check:vigencia        (determinista, es el que gatea el CI)
 *           npm run check:vigencia-red    (además consulta el Senado de verdad)
 *
 * ─── EL CASO QUE OBLIGA A QUE ESTE ARCHIVO EXISTA ──────────────────────────
 *
 * El art. 2035 del Código Civil está derogado por el art. 43 de la Ley 820 de
 * 2003 desde hace veintitrés años, y el motor lo invocaba como fundamento de la
 * pretensión de terminación del arrendamiento. Ése es el caso real y es el que
 * se prueba aquí, con el HTML que el Senado sirve hoy: si algún día el parser
 * deja de ver ese corchete, este check se pone rojo antes de que un borrador
 * salga con un artículo muerto.
 *
 * ─── POR QUÉ HAY DOS CHECKS Y NO UNO ───────────────────────────────────────
 *
 * El determinista corre sobre HTML REAL COPIADO DEL SITIO, verbatim, y no sale
 * a la red: es el que puede gatear el CI, porque una mala tarde del Senado no
 * puede poner en rojo un repositorio que no está roto — la misma doctrina que
 * `run-all-checks.mjs` ya aplica a las relatorías. El de red comprueba lo único
 * que un fixture no puede: que el sitio siga sirviendo lo que el fixture dice.
 * Un fixture solo, envejeciendo en silencio, certificaría un lector que ya no
 * lee nada.
 */
import {
  bloqueDelArticulo,
  componerVigencia,
  consultarVigencia,
  documentoDelSenado,
  estadoDeLosMarcadores,
  leerEnSenado,
  limpiarCacheDeVigencia,
  mapaDeFragmentos,
  marcadoresDelBloque,
  notaDeVigencia,
  rubricaDelBloque,
  type LecturaDeFuente
} from '../officialArticle.service';
import { leerEnFuncionPublica } from '../funcionPublica.source';
import {
  anotarVigencia,
  articulosPorComprobar,
  marcarEnLinea,
  verificarVigenciaDelEscrito,
  type RevisionDeVigencia
} from '../../agent/review/verificarVigencia';

const conRed = process.argv.includes('--red');

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

/*
 * ─── FIXTURES: HTML COPIADO DEL SENADO, SIN TOCAR UNA COMA ─────────────────
 *
 * Descargados el 9 de septiembre de 2026 de
 * `basedoc/codigo_civil_pr063.html`, `basedoc/js/codigo_civil_pr063.js` y
 * `basedoc/ley_0820_2003.html`. Van verbatim a propósito: un fixture
 * «limpiado» prueba el lector contra un HTML que nadie sirve.
 */
const HTML_2035 = `<p><a class="bookmarkaj" name="2035">ART&Iacute;CULO 2035. &lt;MORA EN EL PAGO DE LA RENTA&gt;.</A> &lt;Art&iacute;culo derogado por el art&iacute;culo <A href="ley_0820_2003_pr001.html#43" >43</A> de la Ley 820 de 2003&gt; </p>
<div><a class="caja_vja_encabezado" href="javascript:insRow1()">Notas de Vigencia</a></div>
<table id="Table1" class="caja_vja_v" cellPadding=10 width="100%"></table>
<div><a class="caja_vja_encabezado" href="javascript:insRow2()">Legislaci&oacute;n Anterior</a></div>
<table id="Table2" class="caja_vja_la" cellPadding=10 width="100%"></table>
<p class="centrado"><a class="bookmarkaj" name="Nivel196">CAP&Iacute;TULO VI. </A></p>
<p class="centrado"><span class="b_aj">REGLAS PARTICULARES, RELATIVAS AL ARRENDAMIENTO DE PREDIOS RUSTICOS</span> </p>
<p><a class="bookmarkaj" name="2036">ART&Iacute;CULO 2036. &lt;ENTREGA DE PREDIO RUSTICO&gt;.</A> El arrendador es obligado a entregar el predio r&uacute;stico en los t&eacute;rminos estipulados. </p>`;

const JS_2035 = `function insRow1()
{
var description = new Array();
description[0] = "<tbody><tr><td><p>- Art&iacute;culo derogado por el art&iacute;culo <A href='ley_0820_2003_pr001.html#43' >43</A> de la Ley 820 de 2003, publicada en el Diario Oficial No. 45.244, de 10 de julio de 2003.</p> </td></tr></tbody>";
}`;

/** El art. 8 de la Ley 820: vivo, y además el que la glosa del motor describía al revés. */
const HTML_820_8 = `<p><a class="bookmarkaj" name="8">ART&Iacute;CULO 8o. OBLIGACIONES DEL ARRENDADOR.</A> Son obligaciones del arrendador, las siguientes:</p>
<p>1. Entregar al arrendatario en la fecha convenida, o en el momento de la celebraci&oacute;n del contrato, el inmueble dado en arrendamiento en buen estado de servicio, seguridad y sanidad.</p>
<p><a class="bookmarkaj" name="9">ART&Iacute;CULO 9o. TERMINACI&Oacute;N POR PARTE DEL ARRENDADOR.</A> Son causales para que el arrendador pueda pedir unilateralmente la terminaci&oacute;n del contrato.</p>`;

/** El desplegable de la portada, que es el mapa artículo → fragmento. */
const OPCIONES_CODIGO = `<select><option value="_pr062ç#2028">2028</option>
    <option value="_pr063ç#2035">2035</option>
    <option value="_pr063ç#2036">2036</option></select>`;

const OPCIONES_LEY_CORTA = `<select><option value="#8">8</option>
    <option value="#35">35</option></select>`;

/* ─── 1. EL CASO REAL: EL ART. 2035 DEL CÓDIGO CIVIL SALE DEROGADO ────────── */

{
  const bloque = bloqueDelArticulo(HTML_2035, 2035);
  check('el bloque del artículo 2035 se encuentra en la página oficial', bloque !== null);

  const marcadores = marcadoresDelBloque(bloque ?? '');
  const { estado, marcador } = estadoDeLosMarcadores(marcadores);

  check(
    'EL ART. 2035 DEL CÓDIGO CIVIL SALE DEROGADO —el caso que motivó todo esto—',
    estado === 'DEROGADO',
    marcador ?? 'sin marcador'
  );
  check(
    'y el motivo que se le muestra al abogado nombra la norma que lo derogó',
    /Ley 820 de 2003/.test(marcador ?? ''),
    marcador ?? ''
  );
  check(
    'el epígrafe se lee y NO se confunde con el marcador de derogación',
    rubricaDelBloque(bloque ?? '') === 'ARTÍCULO 2035. MORA EN EL PAGO DE LA RENTA',
    rubricaDelBloque(bloque ?? '')
  );
  check(
    'la nota de vigencia sale del JS hermano, que es donde el Senado la guarda',
    /Diario Oficial No\. 45\.244/.test(notaDeVigencia(bloque ?? '', JS_2035) ?? ''),
    notaDeVigencia(bloque ?? '', JS_2035) ?? 'ninguna'
  );
  /*
   * EL CORTE DEL BLOQUE ES LO QUE EVITA LA FALSA ALARMA. Sin él, el marcador de
   * un artículo derogado se derramaría sobre el siguiente y el 2036 —que está
   * vivo— saldría muerto.
   */
  const bloque2036 = bloqueDelArticulo(HTML_2035, 2036);
  check(
    'el artículo siguiente NO hereda el marcador del derogado',
    estadoDeLosMarcadores(marcadoresDelBloque(bloque2036 ?? '')).estado === 'VIGENTE'
  );
  check(
    'y el epígrafe entre corchetes del vivo no se lee como marcador de estado',
    rubricaDelBloque(bloque2036 ?? '') === 'ARTÍCULO 2036. ENTREGA DE PREDIO RUSTICO',
    rubricaDelBloque(bloque2036 ?? '')
  );
}

/* ─── 2. EL ART. 8 DE LA LEY 820 ESTÁ VIVO, Y ESO NO SALVA LA GLOSA ───────── */

{
  const bloque = bloqueDelArticulo(HTML_820_8, 8);
  check(
    'el art. 8 de la Ley 820 sale VIGENTE',
    estadoDeLosMarcadores(marcadoresDelBloque(bloque ?? '')).estado === 'VIGENTE'
  );
  /*
   * Y aquí queda escrito el límite del verificador: el epígrafe oficial dice
   * ARRENDADOR, el borrador medido decía «obligaciones del arrendatario», y
   * este módulo no ve esa diferencia. La ve la regla 2 del prompt, que por eso
   * no se relajó.
   */
  check(
    'el epígrafe oficial dice ARRENDADOR, que es lo que la glosa del borrador invertía',
    /OBLIGACIONES DEL ARRENDADOR/.test(rubricaDelBloque(bloque ?? '')),
    rubricaDelBloque(bloque ?? '')
  );
}

/* ─── 3. EL MAPA ARTÍCULO → FRAGMENTO ─────────────────────────────────────── */

{
  const mapa = mapaDeFragmentos(OPCIONES_CODIGO);
  check('el desplegable de la portada ubica el artículo 2035 en su fragmento', mapa.get(2035) === '_pr063', String(mapa.get(2035)));
  check('y no lo confunde con el fragmento del vecino', mapa.get(2028) === '_pr062');
  const corta = mapaDeFragmentos(OPCIONES_LEY_CORTA);
  check('una norma de una sola página devuelve fragmento vacío, no null', corta.get(35) === '');
  check('un artículo que la norma no lista no aparece en el mapa', mapa.get(9999) === undefined);
}

/* ─── 4. DE LA CLAVE CANÓNICA AL DOCUMENTO DEL SENADO ─────────────────────── */

{
  check('el Código Civil tiene documento conocido', documentoDelSenado('CODIGO CIVIL') === 'codigo_civil');
  check('el CGP también', documentoDelSenado('CGP') === 'ley_1564_2012');
  check(
    'una ley cualquiera se arma con el número relleno a cuatro dígitos, como la sirve el Senado',
    documentoDelSenado('LEY 820 DE 2003') === 'ley_0820_2003',
    String(documentoDelSenado('LEY 820 DE 2003'))
  );
  check('un decreto igual', documentoDelSenado('DECRETO 19 DE 2012') === 'decreto_0019_2012');
  check(
    'y una norma que esta casa no sabe ubicar devuelve null en vez de inventar un archivo',
    documentoDelSenado('SIN CÓDIGO') === null
  );
}

/* ─── SUBROGAR NO ES MATAR ────────────────────────────────────────────────── */

/*
 * Medido el 10 de septiembre de 2026 verificando los fundamentos del Código
 * Civil: el art. 1040 salió DEROGADO y no lo está. El Senado lo marca
 * «subrogado por el art. 2 de la Ley 29 de 1982» Y PUBLICA EL TEXTO NUEVO.
 * Subrogar sustituye el contenido dejando el artículo en pie; derogar lo quita
 * del ordenamiento.
 *
 * La ficha de sucesión se quedó sin uno de sus fundamentos por esto, y el
 * escrito habría marcado como norma muerta una que rige. Es la peor clase de
 * error en un avisador: la falsa alarma enseña a ignorar los avisos ciertos.
 */
{
  const subrogado = 'Artículo subrogado por el artículo 2o. de la Ley 29 de 1982. El nuevo texto es el siguiente:';
  const r = estadoDeLosMarcadores([subrogado]);
  check('un artículo SUBROGADO está vigente: cambió su texto, no murió el artículo', r.estado === 'VIGENTE', r.estado);
  check('y su marcador viaja en el detalle, porque el texto que rige es el nuevo', r.marcador === subrogado);

  /* Y LO CONTRARIO PESA IGUAL: las derogaciones reales siguen cazándose. Las tres son casos medidos. */
  const muertos: Array<[string, string]> = [
    ['derogado por otra ley (art. 2035 del Código Civil)', 'Artículo derogado por el artículo 43 de la Ley 820 de 2003'],
    ['derogado por el CGP (art. 126 del Código Civil)', 'Artículo derogado por el literal c) del artículo 626 de la Ley 1564 de 2012'],
    ['declarado inexequible', 'Artículo INEXEQUIBLE'],
    /*
     * LA LEY MUERTA ENTERA, que hasta el 10 de septiembre de 2026 salía VIGENTE.
     *
     * Ningún artículo de una ley derogada en bloque dice «Artículo derogado»:
     * el Senado repite en cada uno el marcador de la LEY. La Ley 43 de 1993
     * —el régimen de nacionalidad— lleva esta frase en sus 30 artículos y el
     * verificador los aprobaba todos.
     */
    [
      'derogado porque murió la LEY entera (Ley 43 de 1993, nacionalidad)',
      'Ley derogada por el artículo 54 de la Ley 2332 de 2023'
    ],
    [
      'derogado con el rótulo de nota que el Senado pone en la portada',
      'NOTA DE VIGENCIA: Ley derogada por el artículo 54 de la Ley 2332 de 2023'
    ]
  ];
  for (const [nombre, marcador] of muertos) {
    check(`sigue detectándose el ${nombre}`, estadoDeLosMarcadores([marcador]).estado === 'DEROGADO', marcador.slice(0, 44));
  }

  /*
   * LOS CONTRACASOS DE LA LEY MUERTA. Sin ellos, la regla nueva podría matar
   * cualquier artículo cuyo marcador solo NOMBRE una ley, que es la mitad de
   * los marcadores del Senado. Los tres se leen como derogatorias y no lo son.
   */
  const vivos: Array<[string, string]> = [
    ['un artículo modificado por una ley posterior (CST art. 488)', 'Artículo modificado por el artículo 62 de la Ley 2466 de 2025. El nuevo texto es el siguiente:'],
    ['un marcador que solo MENCIONA una ley derogada', 'Ley 100 de 1993, derogada en lo pertinente por la Ley 1122 de 2007'],
    ['un artículo que remite a un decreto derogado sin morir con él', 'Ver el Decreto 2148 de 1983, derogado por el Decreto 1069 de 2015']
  ];
  for (const [nombre, marcador] of vivos) {
    check(`y NO se mata ${nombre}`, estadoDeLosMarcadores([marcador]).estado === 'VIGENTE', marcador.slice(0, 44));
  }

  /*
   * ─── EL TERCER ESTADO: VIVO, PERO NO COMO ESTA ESCRITO ───────────────────
   *
   * Hasta el 10 de septiembre de 2026 estos articulos salian VIGENTE a secas,
   * porque la fuente no los marca muertos. El art. 97 del Codigo Penal publica
   * un tope de 1000 SMLMV que la Corte no dejo como se lee, y un escrito podia
   * afirmarlo ante el juez con el respaldo de esta casa.
   *
   * Las marcas son las que el Senado publica de verdad, copiadas de los diez
   * articulos que quedaron fuera del catalogo por esto.
   */
  const modulados: Array<[string, string]> = [
    ['el aparte subrayado condicionalmente exequible (C.C. 414, alimentos congruos)', 'Aparte subrayado CONDICIONALMENTE exequible'],
    ['los apartes tachados inexequibles (C.C. 411, titulares de alimentos)', 'Apartes tachados INEXEQUIBLES'],
    ['el artículo atado a un sentido (Ley 1480 art. 59)', 'Articulo EXEQUIBLE, en el entendido de que la medida no excede el término legal'],
    ['la expresión declarada inexequible (Ley 610 art. 6)', "Expresion 'uso indebido' INEXEQUIBLE"],
    ['el numeral condicionalmente exequible (Ley 769 art. 131)', 'Numeral CONDICIONALMENTE exequible por la Corte Constitucional']
  ];
  for (const [nombre, marcador] of modulados) {
    check(`se detecta ${nombre}`, estadoDeLosMarcadores([marcador]).estado === 'MODULADO', marcador.slice(0, 46));
  }

  /*
   * LA MUERTE MANDA SOBRE LA MODULACION. Modular un cadaver no lo resucita, y
   * un articulo derogado cuyo marcador ademas mencione una condicionalidad
   * tiene que seguir saliendo DEROGADO: es el unico orden en que el aviso mas
   * grave no queda tapado por el mas leve.
   */
  check(
    'un artículo derogado que además trae nota de condicionalidad sigue DEROGADO',
    estadoDeLosMarcadores([
      'Articulo derogado por el articulo 626 de la Ley 1564 de 2012',
      'Aparte subrayado CONDICIONALMENTE exequible'
    ]).estado === 'DEROGADO'
  );

  /*
   * Y LOS CONTRACASOS DE LA MODULACION, que son la mitad del valor: si esta
   * regla se dispara con cualquier mencion de la Corte, marcaria como
   * «no se puede citar tal como se lee» a articulos intactos, y el abogado
   * dejaria de leer el aviso. Los tres nombran a la Corte y estan limpios.
   */
  const limpios: Array<[string, string]> = [
    ['un artículo declarado EXEQUIBLE a secas', 'Articulo declarado EXEQUIBLE por la Corte Constitucional, Sentencia C-1064 de 2001'],
    ['un artículo modificado por una ley, sin sentencia de por medio', 'Articulo modificado por el articulo 62 de la Ley 2466 de 2025'],
    ['un artículo subrogado', 'Articulo subrogado por el articulo 2o. de la Ley 29 de 1982']
  ];
  for (const [nombre, marcador] of limpios) {
    check(`y NO se modula ${nombre}`, estadoDeLosMarcadores([marcador]).estado === 'VIGENTE', marcador.slice(0, 46));
  }
}

/* ─── 5. LO QUE NO SE PUEDE COMPROBAR SE DECLARA, Y NUNCA LANZA ───────────── */

const asincronos = async (): Promise<void> => {
  limpiarCacheDeVigencia();

  /*
   * Sin documento conocido no hay red: este camino es determinista y prueba la
   * invariante más importante del módulo — que no saber se DICE.
   */
  const sinFuente = await consultarVigencia({ codigo: 'SIN CÓDIGO', articulo: 244 }, 500);
  check('un artículo cuya norma no se sabe ubicar sale NO_VERIFICABLE', sinFuente.estado === 'NO_VERIFICABLE');
  check('y dice por qué, en una frase que el abogado puede leer', sinFuente.detalle.length > 30, sinFuente.detalle);
  check('y trae la fecha de la consulta, porque una comprobación sin fecha no lo es', /^\d{4}-\d{2}-\d{2}$/.test(sinFuente.consultadoEn));

  /* ─── 6. QUÉ SE MANDA A COMPROBAR ───────────────────────────────────────── */

  const escrito =
    'Con fundamento en el artículo 384 del Código General del Proceso y en el artículo 2035 del Código Civil, se solicita la restitución.';
  const porComprobar = articulosPorComprobar(escrito, [{ codigo: 'CGP', articulo: 384 }]);
  check(
    'lo que la ficha ya autoriza NO se vuelve a comprobar: el presupuesto es para lo que nadie miró',
    porComprobar.length === 1 && porComprobar[0].articulo === 2035,
    porComprobar.map((r) => `${r.codigo}|${r.articulo}`).join(', ')
  );

  /* ─── 7. QUÉ SE HACE CON UN DEROGADO DENTRO DEL ESCRITO ─────────────────── */

  const revision: RevisionDeVigencia = {
    resultados: [
      {
        referencia: { codigo: 'CODIGO CIVIL', articulo: 2035 },
        estado: 'DEROGADO',
        detalle: 'Artículo derogado por el artículo 43 de la Ley 820 de 2003',
        url: 'https://www.secretariasenado.gov.co/senado/basedoc/codigo_civil_pr063.html#2035',
        rubrica: 'ARTÍCULO 2035. MORA EN EL PAGO DE LA RENTA',
        lecturas: [],
        fuentesQueOpinaron: ['SENADO'],
        consultadoEn: '2026-09-09'
      }
    ],
    derogados: 1,
    noVerificables: 0,
    discrepantes: 0
  };

  const anotado = anotarVigencia(escrito, revision);
  check('la advertencia va DENTRO del escrito, no en un metadato', anotado.includes('NO RADIQUE SIN CORREGIRLOS'));
  check('y también pegada a la cita, en el párrafo donde el abogado la lee', /2035\s*\[NORMA DEROGADA/.test(anotado), anotado.slice(anotado.indexOf('Con fundamento')));
  check('nombra la norma que lo derogó, no solo que está derogado', anotado.includes('Ley 820 de 2003'));
  check('y deja la fuente para que se pueda abrir y comprobar a mano', anotado.includes('secretariasenado.gov.co'));
  /*
   * LO QUE EL MOTOR ESCRIBIÓ SIGUE AHÍ, ENTERO. Borrar la cita dejaría un
   * párrafo argumentando sobre un artículo que ya no está: la advertencia
   * INSERTA, nunca suprime.
   */
  check(
    'no se borró ni una palabra de lo que el motor escribió',
    escrito.split(/\s+/).every((palabra) => anotado.includes(palabra))
  );
  check(
    'sin nada que comprobar, el escrito sale idéntico y sin encabezado vacío',
    anotarVigencia(escrito, { resultados: [], derogados: 0, noVerificables: 0, discrepantes: 0 }) ===
      escrito
  );

  /* La marca en línea no persigue números sueltos: eso sería la falsa alarma. */
  const suelto = 'La cuantía asciende a 2035 UVT y el contrato es de 2035.';
  check('un número suelto que no es una cita NO se marca', marcarEnLinea(suelto, 2035, '[X]') === suelto);
  check(
    'una cita sí se marca aunque venga en plural y con vecinos',
    marcarEnLinea('los artículos 2034 y 2035 del Código Civil', 2035, '[X]').includes('2035 [X]')
  );

  /* ─── 8. UN ESCRITO SIN CITAS FUERA DE FICHA NO GASTA NI UNA CONSULTA ───── */

  const nada = await verificarVigenciaDelEscrito(
    'Con fundamento en el artículo 384 del Código General del Proceso.',
    [{ codigo: 'CGP', articulo: 384 }],
    1_000
  );
  check('sin citas por fuera de la ficha no se consulta nada', nada.resultados.length === 0);

  /* ─── 8 bis. VARIAS FUENTES: CONCORDANCIA, DISCREPANCIA Y SILENCIO ─────
   *
   * TODO ESTO CORRE SIN RED, sobre HTML VERBATIM de cada fuente, descargado el
   * 10 de septiembre de 2026 y pegado sin tocar una coma. La descarga va
   * INYECTADA, así que lo que se prueba es el lector ENTERO —búsqueda del
   * identificador, corte del bloque, marcador de derogación y composición— y no
   * sus piezas por separado, que es justo donde estaba el defecto del «artículo
   * 14 de la Ley 1033» leído como si fuera un encabezado.
   *
   * Corre sin red porque una mala tarde de un sitio público no puede poner en
   * rojo un repositorio que no está roto — la misma doctrina de `run-all-checks`.
   *
   * Los fragmentos van como cadenas escapadas y no como plantillas para que
   * ningún normalizador de fin de línea les cambie un byte: son el HTML que el
   * sitio sirve, con sus CRLF incluidos.
   */

  /* Consulta avanzada de Función Pública, resultados para la Ley 820 de 2003. */
  const FP_BUSCA_820 = "\t\n<div class=\"container\"> <h2><strong>Resultados</strong></h2>\n\t\t\t\t\t  <div class=\"row mt-3\"> \n\t\t\t\t\t  <div class=\"col-lg-12 col-md-12\"> \n\t\t\t\t\t  <p class=\"list-group-item-text\">Número de documentos encontrados: 1</p> \n\t\t\t\t\t\t<a href=\"norma.php?i=8738\" target=\"_blank\" class=\"list-group-item list-group-item-action\">\n\t\t\t\t\t\t\t<h5 class=\"list-group-item-heading\">Ley 820 de 2003</h5>\n\t\t\t\t\t\t\t<p class=\"list-group-item-text\">  Se  expide el régimen de arrendamiento de vivienda urbana; objeto del contrato, definición, forma, clasificación, terminación, prórroga, obligaciones de las partes, prohibición de garantías y depósitos, subarriendo y cesión del contrato, renta de arrendamiento, terminación del contrato, quienes ejercen la actividad de arrendamiento, inspección, control y vigilancia, sanciones aspectos procesales, vigencia.</p>\n\t\t\t\t\t\t</a></div></div></div>";
  /* `norma.php?i=8738`, desde el div del contenido hasta pasado el artículo 8. */
  const FP_820_ART_8 = "class=\"descripcion-contenido\">\n\n<P><STRONG>Artículo 8º. <EM>Obligaciones del arrendador.</EM></STRONG> Son obligaciones del arrendador, las siguientes:</P>\r\n<P>1. Entregar al arrendatario en la fecha convenida, o en el momento de la celebración del contrato, el inmueble dado en arrendamiento en buen estado de servicio, seguridad <EM>y </EM>sanidad y poner a su disposición los servicios, cosas o usos conexos y los adicionales convenidos.</P>\r\n<P>2. Mantener en el inmueble los servicios, las cosas <EM>y </EM>los usos conexos <EM>y </EM>adicionales en buen estado de servir para el fin convenido en el contrato.</P>\r\n<P>3. Cuando el contrato de arrendamiento de vivienda urbana conste por escrito, el arrendador deberá suministrar tanto al arrendatario como al codeudor, cuando sea el caso, copia del mismo con firmas originales.</P>\r\n<P>Esta obligación deberá ser satisfecha en el plazo máximo de diez (10) días contados a partir de la fecha de celebración del contrato.</P>\r\n<P>4. Cuando se trate de viviendas sometidas a régimen de propiedad horizontal, el arrendador deberá entregar al arrendatario una copia de la parte normativa del mismo.</P>\r\n<P>En el caso de vivienda compartida, el arrendador tiene además, la obligación de mantener en adecuadas condiciones de funcionamiento, de seguridad y de sanidad las zonas o servicios de uso común y de efectuar por su cuenta las reparaciones y sustituciones necesarias, cuando no sean atribuibles a los arrendatarios, y de garantizar el mantenimiento del orden interno de la vivienda;</P>\r\n<P>5. Las demás obligaciones consagradas para los arrendadores en el Capítulo II, Título XXVI, Libro 4 del Código Civil.</P>\r\n<P><STRONG>Parágrafo.</STRONG> El incumplimiento del numeral tercero del presente artículo será sancionado, a petición de parte, por la autoridad competente, con multas equivalentes a tres (3) mensualidades de arrendamiento.</P>\r\n<P><STRONG>Artículo 9º. Obligaciones del arrendatario.</STRONG> Son obligaciones del arrendatario:</P>\r\n<P>1. Pagar el precio del arrendamiento dentro del plazo estipulado en el contrato, en el inmueble arrendado o en el lugar convenido.</P>\r\n<P>2. Cuidar el inmueble y las cosas recibidas en arrendamiento. En caso de daños o deter";
  /* Resultados para la Ley 1437 de 2011 (CPACA). */
  const FP_BUSCA_1437 = "\t\n<div class=\"container\"> <h2><strong>Resultados</strong></h2>\n\t\t\t\t\t  <div class=\"row mt-3\"> \n\t\t\t\t\t  <div class=\"col-lg-12 col-md-12\"> \n\t\t\t\t\t  <p class=\"list-group-item-text\">Número de documentos encontrados: 1</p> \n\t\t\t\t\t\t<a href=\"norma.php?i=41249\" target=\"_blank\" class=\"list-group-item list-group-item-action\">\n\t\t\t\t\t\t\t<h5 class=\"list-group-item-heading\">Ley 1437 de 2011</h5>\n\t\t\t\t\t\t\t<p class=\"list-group-item-text\">Por la cual se expide el Código de Procedimiento Administrativo y de lo Contencioso Administrativo. Establece los principios sobre los cuales las  autoridades deberán interpretar y aplicar las disposiciones que regulan las actuaciones y procedimientos administrativos, haciendo énfasis en el cumplimiento de los principios estatuidos en la Constitución Política, los que se establecen en la parte primera del  Código de Procedimiento Administrativo y de lo Contencioso Administrativo  (Ley 1437 de 2011) y en las leyes especiales. Señala que las actuaciones administrativas se desarrollarán con especial atención a los siguientes principios: debido proceso, igualdad, buena fe imparcialidad, moralidad, participación, responsabilidad, transparencia, publicidad, coordinación, eficacia, economía y celeridad. ( art. 3)</p>\n\t\t\t\t\t\t</a></div></div></div>";
  /* `norma.php?i=41249`: el art. 226, DEROGADO por el art. 87 de la Ley 2080 de 2021. */
  const FP_1437_ART_226 = "class=\"descripcion-contenido\">\n\n<p class=\"MsoNormal\"><strong>ARTÍCULO<a id=\"sp226\" name=\"226\"></a> 226. <em>Impugnación de las decisiones sobre intervención de terceros.</em></strong> <em>(Derogado por el Art. <a href=\"norma.php?i=156590#87\">87</a> de la Ley 2080 de 2021)</em></p>\r\n<p class=\"MsoNormal\"> </p>\r\n<p class=\"MsoNormal\"><strong>ARTÍCULO<a id=\"sp227\" name=\"227\"></a> 227. Trámite y alcances de la intervención de terceros</strong>. En lo no regulado en este Código sobre la intervención de terceros se aplicarán las normas del Código General del Proceso.</p>\r\n<p class=\"MsoNormal\"> </p>\r\n<p class=\"MsoNormal\">(Modificado por el Art. <a href=\"norma.php?i=156590#85\">85</a> de la Ley 2080 de 2021)</p>\r\n<p align=\"left\">(Ver <a href=\"norma.php?i=48425#0\">Código General del Proceso</a>)</p>\r\n<p class=\"MsoNormal\"> </p>\r\n<p class=\"MsoNormal\"> </p>\r\n<p class=\"MsoNormal\"><strong>ARTÍCULO<a id=\"sp228\" name=\"228\"></a> 228. <em>";
  /* Resultados para la Ley 54 de 1990, la que `basedoc` no publica (404 de 1.515 bytes). */
  const FP_BUSCA_54 = "\t\n<div class=\"container\"> <h2><strong>Resultados</strong></h2>\n\t\t\t\t\t  <div class=\"row mt-3\"> \n\t\t\t\t\t  <div class=\"col-lg-12 col-md-12\"> \n\t\t\t\t\t  <p class=\"list-group-item-text\">Número de documentos encontrados: 1</p> \n\t\t\t\t\t\t<a href=\"norma.php?i=30896\" target=\"_blank\" class=\"list-group-item list-group-item-action\">\n\t\t\t\t\t\t\t<h5 class=\"list-group-item-heading\">Ley 54 de 1990</h5>\n\t\t\t\t\t\t\t<p class=\"list-group-item-text\">  Define las uniones maritales de hecho y régimen patrimonial entre compañeros permanentes. Señala los eventos en que procese su declaración, los bienes que forman parte de la sociedad patrimonial y la procedencia de la liquidación de la misma, así como el régimen aplicable.</p>\n\t\t\t\t\t\t</a></div></div></div>";
  /* `norma.php?i=30896`: el art. 2, MODIFICADO —que no es derogado— por la Ley 979 de 2005. */
  const FP_54_ART_2 = "class=\"descripcion-contenido\">\n\n<p>Artículo <a id=\"sp2\" name=\"2\"></a> 2o.</p>\r\n<p><a href=\"norma.php?i=30898#1\">Modificado por el art. 1, Ley 979 de 2005</a>. Se presume sociedad patrimonial entre compañeros permanentes y hay lugar a declararla judicialmente en cualquiera de los siguientes casos:</p>\r\n<p>a) Cuando exista unión marital de hecho durante un lapso no inferior a dos años, entre un hombre y una mujer sin impedimento legal para contraer matrimonio;</p>\r\n<p align=\"left\"><strong>NOTA: Literal declarado EXEQUIBLE por la Corte Constitucional mediante Sentencia</strong> C-257 <strong>de 2015.</strong></p>\r\n<p><a id=\"sp2.b\" name=\"2.b\"></a> b) Cuando exista una unión marital de hecho por un lapso no inferior a dos años e impedimento legal para contraer matrimonio por parte de uno o de ambos compañeros permanentes, siempre y cuando la sociedad o sociedades conyugales anteriores hayan sido disueltas <u>y liquidadas</u> por lo menos un año antes de la fecha en que se inicio la unión marital de hecho.</p>\r\n<p align=\"left\"><strong>NOTA: El texto subrayado fue declarado INEXEQUIBLE por la Corte Constitucional mediante Sentencia</strong> <a href=\"norma.php?i=56635#Primero\">C-700</a> <strong>de 2013</strong>.</p>\r\n<p><strong>NOTA: Literal declarado EXEQUIBLE por la Corte Constitucional mediante Sentencia </strong>C-257 <strong>de 2015.</strong></p>\r\n<p> </p>\r\n<p><strong><em>PARÁGRAFO<a id=\"2p\"></a>. </em></strong><em>En lo relativo a la sociedad patrimonial no se considerará como impedimento legal la unión en las que uno o ambos de los compañeros sea menor de18 años.</em></p>\r\n<p><em><a title=\"vinculo\" href=\"norma.php?i=258256#11\">(Parágrafo adicionado por el Art. 11 de la Ley 2247 de 2025)</a></em></p>\r\n<p> </p>\r\n<p>Artículo <a id=\"3\"></a>3o. El patrimonio o capital producto del trabajo, ayuda y socorro m";

  /**
   * Una descarga de mentira que sirve HTML verbatim según lo que pida la URL.
   * Las parejas se prueban EN ORDEN, para poder distinguir el JS hermano del
   * Senado de la página que lo enlaza.
   */
  const sirviendo =
    (paginas: Array<[string, string]>) =>
    async (url: string): Promise<string | null> => {
      for (const [clave, html] of paginas) if (url.includes(clave)) return html;
      return null;
    };

  const FP_820 = sirviendo([
    ['nrodoc=820', FP_BUSCA_820],
    ['norma.php?i=8738', FP_820_ART_8]
  ]);
  const FP_1437 = sirviendo([
    ['nrodoc=1437', FP_BUSCA_1437],
    ['norma.php?i=41249', FP_1437_ART_226]
  ]);
  const FP_54 = sirviendo([
    ['nrodoc=54', FP_BUSCA_54],
    ['norma.php?i=30896', FP_54_ART_2]
  ]);
  const SENADO_820 = sirviendo([['ley_0820_2003', HTML_820_8]]);
  const NADIE = sirviendo([]);

  const ref820 = { codigo: 'LEY 820 DE 2003', articulo: 8 };

  /* Cada lector, entero, contra el HTML real de SU sitio. */
  const fp820 = await leerEnFuncionPublica(ref820, 5_000, FP_820);
  check(
    'Función Pública encuentra la norma por su número y lee el artículo 8 vivo',
    fp820.estado === 'VIGENTE' && (fp820.url ?? '').includes('norma.php?i=8738'),
    `${fp820.estado} · ${fp820.url}`
  );
  check(
    'y trae el texto, que es lo que necesita el juez de la glosa',
    (fp820.cuerpo ?? '').includes('Obligaciones del arrendador'),
    `${(fp820.cuerpo ?? '').length} caracteres`
  );

  const fp226 = await leerEnFuncionPublica(
    { codigo: 'LEY 1437 DE 2011', articulo: 226 },
    5_000,
    FP_1437
  );
  check(
    'y caza la derogación como la escribe ESTA fuente, en prosa y no en corchete angular',
    fp226.estado === 'DEROGADO' && fp226.detalle.includes('Ley 2080 de 2021'),
    fp226.detalle.slice(0, 90)
  );

  /*
   * MODIFICAR NO ES DEROGAR, y aquí también. El art. 2 de la Ley 54 abre con
   * «Modificado por el art. 1, Ley 979 de 2005» y está perfectamente vivo:
   * marcarlo muerto sería la falsa alarma que enseña a ignorar los avisos.
   */
  const fp54 = await leerEnFuncionPublica({ codigo: 'LEY 54 DE 1990', articulo: 2 }, 5_000, FP_54);
  check(
    'un artículo MODIFICADO no se confunde con uno derogado',
    fp54.estado === 'VIGENTE',
    fp54.detalle.slice(0, 90)
  );

  /* Y si el resultado no es la norma pedida, no se lee ese texto: se calla. */
  const fpOtra = await leerEnFuncionPublica({ codigo: 'LEY 820 DE 1999', articulo: 1 }, 5_000, FP_820);
  check(
    'si el título del resultado no es el de la norma pedida, NO se lee ese texto',
    fpOtra.estado === 'SIN_ARTICULO',
    fpOtra.detalle.slice(0, 90)
  );

  const senado820 = await leerEnSenado(ref820, 5_000, SENADO_820);
  check(
    'la Secretaría del Senado lee el mismo artículo 8 y también lo da por vivo',
    senado820.estado === 'VIGENTE',
    senado820.detalle.slice(0, 80)
  );

  /* (1) CONCORDANCIA → VIGENTE, y se dice quiénes concordaron. */
  const concordancia = componerVigencia(ref820, [senado820, fp820]);
  check(
    'CONCORDANCIA: dos fuentes que coinciden dan VIGENTE',
    concordancia.estado === 'VIGENTE',
    concordancia.estado
  );
  check(
    'y el resultado DICE cuáles concordaron: un veredicto que no lo dice se lee como si lo hubieran mirado todos',
    concordancia.fuentesQueOpinaron.length === 2 && concordancia.detalle.includes('Concordaron'),
    concordancia.detalle.slice(-120)
  );

  /*
   * (2) DISCREPANCIA FABRICADA, con HTML verbatim de las dos fuentes: se le da a
   * la composición la lectura VIVA del Senado y la lectura DEROGADA de Función
   * Pública sobre una misma referencia. Es la parte más importante del archivo.
   */
  const discrepancia = componerVigencia(ref820, [senado820, fp226]);
  check(
    'DISCREPANCIA: si una fuente lo da por vivo y otra por muerto, el estado es propio',
    discrepancia.estado === 'DISCREPANCIA_ENTRE_FUENTES',
    discrepancia.estado
  );
  check(
    'y viajan LAS DOS URLs, para que el abogado abra las dos y decida',
    discrepancia.detalle.includes(senado820.url ?? 'x') &&
      discrepancia.detalle.includes(fp226.url ?? 'y'),
    discrepancia.detalle.slice(0, 200)
  );
  check(
    'esta casa NO elige: no se devuelve cuerpo, porque no hay «el» texto del artículo',
    discrepancia.cuerpo === undefined
  );
  check(
    'y la discrepancia también se marca en el párrafo, no solo en la cabecera',
    anotarVigencia('Con fundamento en el artículo 8 de la Ley 820 de 2003.', {
      resultados: [discrepancia],
      derogados: 0,
      noVerificables: 0,
      discrepantes: 1
    }).includes('LAS FUENTES OFICIALES NO COINCIDEN')
  );

  /* (3) SOLO UNA RESPONDE → vale, y se dice que solo una respondió. */
  const senadoMudo = await leerEnSenado(ref820, 500, NADIE);
  const unaSola = componerVigencia(ref820, [senadoMudo, fp820]);
  check('SOLO UNA FUENTE: sigue valiendo el veredicto', unaSola.estado === 'VIGENTE', unaSola.estado);
  check(
    'y se dice que solo una respondió y cuál',
    unaSola.fuentesQueOpinaron.length === 1 && unaSola.detalle.includes('Solo respondió'),
    unaSola.detalle.slice(-120)
  );

  /*
   * (4) NINGUNA RESPONDE → NO_VERIFICABLE, como siempre.
   *
   * Se vacía la caché antes: sin esto, Función Pública contestaría con lo que
   * aprendió tres comprobaciones más arriba y la prueba mediría la caché en vez
   * del silencio. Es la misma razón por la que `limpiarCacheDeVigencia` existe.
   */
  limpiarCacheDeVigencia();
  const fpMudo = await leerEnFuncionPublica(ref820, 500, NADIE);
  const silencio = componerVigencia(ref820, [senadoMudo, fpMudo]);
  check('SILENCIO DE TODAS: NO_VERIFICABLE', silencio.estado === 'NO_VERIFICABLE', silencio.estado);
  check(
    'y se enumera qué se intentó: un hueco declarado vale, uno rellenado destruye el producto',
    silencio.detalle.includes('Senado') && silencio.detalle.includes('Función Pública'),
    silencio.detalle.slice(0, 160)
  );

  /*
   * (5) UN SILENCIO NO CONTRADICE A NADIE. Que una fuente no publique el
   * artículo no puede fabricar una discrepancia contra la que sí lo publica:
   * ésa fue la trampa que casi entra, y habría llenado los escritos de
   * conflictos inexistentes.
   */
  const senadoMuerto: LecturaDeFuente = {
    fuente: 'SENADO',
    estado: 'DEROGADO',
    detalle: 'Artículo derogado por el artículo 43 de la Ley 820 de 2003',
    url: 'https://www.secretariasenado.gov.co/senado/basedoc/codigo_civil_pr063.html#2035'
  };
  const sinDiscrepancia = componerVigencia({ codigo: 'CODIGO CIVIL', articulo: 2035 }, [
    senadoMuerto,
    {
      fuente: 'FUNCION_PUBLICA',
      estado: 'SIN_ARTICULO',
      detalle: 'el Gestor Normativo de Función Pública no publica el Código Civil.'
    }
  ]);
  check(
    'que una fuente no tenga el artículo NO es un desacuerdo: sigue saliendo DEROGADO',
    sinDiscrepancia.estado === 'DEROGADO',
    sinDiscrepancia.estado
  );

  /* ─── 9. Y AHORA, SI SE PIDIÓ, CONTRA LA FUENTE DE VERDAD ───────────────── */

  if (conRed) {
    console.log('');
    console.log('Consultando el texto oficial del Senado…');
    limpiarCacheDeVigencia();

    const t0 = Date.now();
    const cc2035 = await consultarVigencia({ codigo: 'CODIGO CIVIL', articulo: 2035 }, 15_000);
    const t1 = Date.now();
    const ley35 = await consultarVigencia({ codigo: 'LEY 820 DE 2003', articulo: 35 }, 15_000);
    const t2 = Date.now();

    check(
      'EN VIVO: el art. 2035 del Código Civil sale DEROGADO del texto oficial',
      cc2035.estado === 'DEROGADO',
      `${t1 - t0} ms · ${cc2035.detalle}`
    );
    check(
      'EN VIVO: el art. 35 de la Ley 820 de 2003 sale DEROGADO del texto oficial',
      ley35.estado === 'DEROGADO',
      `${t2 - t1} ms · ${ley35.detalle}`
    );
    check(
      'EN VIVO: un artículo vivo NO sale marcado',
      (await consultarVigencia({ codigo: 'LEY 820 DE 2003', articulo: 8 }, 15_000)).estado === 'VIGENTE'
    );
  } else {
    console.log('');
    console.log('(El Senado no se consultó: `npm run check:vigencia-red` lo hace.)');
  }

  console.log('');
  if (fallos > 0) {
    console.log(`${fallos} comprobación(es) no pasaron.`);
    process.exitCode = 1;
  } else {
    // El banner tiene que ser uno de los tres que reconoce `run-all-checks.mjs`:
    // inventar un cuarto marca el check como ROTO, y con razón.
    console.log('TODO BIEN — la comprobación de vigencia sostiene sus invariantes.');
  }
};

void asincronos();
