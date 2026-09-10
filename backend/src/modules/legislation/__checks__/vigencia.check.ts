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
  consultarVigencia,
  documentoDelSenado,
  estadoDeLosMarcadores,
  limpiarCacheDeVigencia,
  mapaDeFragmentos,
  marcadoresDelBloque,
  notaDeVigencia,
  rubricaDelBloque
} from '../officialArticle.service';
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
    ['declarado inexequible', 'Artículo INEXEQUIBLE']
  ];
  for (const [nombre, marcador] of muertos) {
    check(`sigue detectándose el ${nombre}`, estadoDeLosMarcadores([marcador]).estado === 'DEROGADO', marcador.slice(0, 44));
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
        consultadoEn: '2026-09-09'
      }
    ],
    derogados: 1,
    noVerificables: 0
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
    anotarVigencia(escrito, { resultados: [], derogados: 0, noVerificables: 0 }) === escrito
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
