import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { InformeDeRevision } from '../documentReview';
import { avisoDeVigencia, mensajeDeVigencia, verificarVigenciaDelInforme } from '../vigenciaDelInforme';
import { construirComprobaciones } from '../comprobacionesDelInforme';
import type { RevisionDeVigencia } from '../verificarVigencia';
import type { VigenciaDeArticulo } from '../../../legislation/officialArticle.service';
import { LIMITE_LLAMADA_MS, PLAZO_VIGENCIA_INFORME_MS } from '../documentReview.controller';
import { TOPE_DE_FUNCION_MS } from '../../presupuestoDeTiempo';

/** El tope de la descarga desde B2, escrito a mano en el controlador. */
const PLAZO_DESCARGA_MS = 30_000;

/**
 * GUARDA DE LA VIGENCIA EN LA REVISIÓN DE ESCRITO PROPIO.
 *
 * Run with: npm run check:vigencia-informe
 *
 * ─── EL HUECO QUE ESTO CIERRA, Y POR QUÉ ERA EL PEOR ───────────────────────
 *
 * Una auditoría del 10 de septiembre de 2026 encontró que el cedazo, la
 * vigencia y la glosa —las tres comprobaciones que protegen al borrador— no
 * llegaban a Revisión. En el modo ESCRITO_PROPIO convergían cuatro cosas: al
 * modelo se le ORDENA citar el artículo, nada en código lo comprobaba, la
 * salida es texto LISTO PARA PEGAR con botón «Aplicar», y el defecto medido
 * —citar artículos reales pero MUERTOS— era exactamente el que nadie miraba.
 *
 * ─── LO QUE CAMBIÓ EL 14 DE SEPTIEMBRE DE 2026 («opción 2») ────────────────
 *
 * El resultado ya NO se escribe dentro del informe: ni corchetes donde el
 * revisor nombra el artículo ni aviso antepuesto a las recomendaciones. Viaja
 * como dato (`comprobacionesDelInforme.ts`, con su propia guarda). Aquí se
 * sostiene lo que es de la vigencia: qué estado produce qué mensaje, cuándo
 * hay aviso de cabecera, que se comprueba lo que hay que comprobar y que la
 * tubería está enchufada y cabe en el reloj. Las aserciones que exigían el
 * corchete en el texto se cambiaron por las que exigen el dato.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

/* ─── FIXTURES ─────────────────────────────────────────────────────────────
 *
 * El informe es el que un revisor produce de verdad, con el caso medido: el
 * art. 2035 del Código Civil, DEROGADO por el art. 43 de la Ley 820 de 2003
 * desde hace veintitrés años, propuesto por el revisor como reemplazo.
 */
const INFORME: InformeDeRevision = {
  resumen: 'El escrito plantea la restitución pero apoya la causal en una norma que no corresponde.',
  fortalezas: ['Los hechos están ordenados cronológicamente.'],
  debilidades: ['La causal de terminación no está bien fundada: debe invocarse el artículo 2035 del Código Civil.'],
  seccionesFaltantes: ['Juramento estimatorio'],
  erroresDeAplicacion: [
    {
      donde: 'Fundamentos de derecho',
      problema: 'Se cita el artículo 22 de la Ley 820 de 2003 para la mora.',
      correccion: 'Debe invocarse el artículo 2035 del Código Civil, que regula la mora en el pago de la renta.'
    }
  ],
  correccionesTextuales: [
    {
      cita: 'con fundamento en el artículo 2035 del Código Civil',
      problema: 'La norma citada no sostiene la pretensión tal como está redactada.',
      reemplazo: 'con fundamento en el artículo 2035 del Código Civil y en el artículo 384 del CGP'
    }
  ],
  recomendaciones: ['Aportar el contrato de arrendamiento.']
};
const TEXTO_ORIGINAL = JSON.stringify(INFORME);

const vigenciaDe = (
  articulo: number,
  estado: VigenciaDeArticulo['estado'],
  detalle: string
): VigenciaDeArticulo => ({
  referencia: { codigo: 'CODIGO CIVIL', articulo },
  estado,
  detalle,
  lecturas: [],
  fuentesQueOpinaron: ['SENADO'],
  consultadoEn: '2026-09-10'
});

const REVISION: RevisionDeVigencia = {
  resultados: [
    vigenciaDe(2035, 'DEROGADO', 'Artículo derogado por el artículo 43 de la Ley 820 de 2003')
  ],
  derogados: 1,
  noVerificables: 0,
  discrepantes: 0
};

/* ─── 1. EL CASO REAL: EL ARTÍCULO MUERTO QUEDA SEÑALADO DONDE SE PROPONE ── */

const comprobado = construirComprobaciones(INFORME, REVISION, null);
const art2035 = comprobado.articulos[0];
const lugares = JSON.stringify(art2035.dondeAparece);

check(
  'el artículo derogado queda señalado en la corrección que lo propone',
  art2035.dondeAparece.some((l) => l.seccion === 'erroresDeAplicacion' && l.campo === 'correccion'),
  lugares
);
check(
  'y también en la debilidad, que es donde el abogado lee el diagnóstico',
  art2035.dondeAparece.some((l) => l.seccion === 'debilidades' && l.indice === 0),
  lugares
);
/*
 * EL REEMPLAZO NUNCA LLEVA LA MARCA DENTRO. Era texto listo para pegar y el
 * corchete terminaba en el memorial. Hoy ni se escribe: el lugar dice
 * «reemplazo» y la pantalla pinta el aviso junto a él.
 */
check(
  'lo que nombra el reemplazo se señala por su lugar, sin escribir en él',
  art2035.dondeAparece.some((l) => l.seccion === 'correccionesTextuales' && l.campo === 'reemplazo') &&
    JSON.stringify(INFORME) === TEXTO_ORIGINAL,
  lugares
);
check(
  'el mensaje nombra la norma que lo derogó, no solo que está derogado',
  art2035.mensajes.some((m) => m.clase === 'DEROGADA' && /Ley 820 de 2003/.test(m.texto)),
  JSON.stringify(art2035.mensajes)
);

/* ─── 2. LA CITA DEL ABOGADO NO SE TOCA ───────────────────────────────────── */

/*
 * Es verbatim del escrito revisado. Se usa para UBICAR el artículo —si solo
 * aparece ahí, la tarjeta de esa corrección se marca— pero nunca se escribe.
 */
check(
  'la cita textual del escrito del abogado se ubica, y sigue siendo verbatim',
  art2035.dondeAparece.some((l) => l.campo === 'cita') &&
    INFORME.correccionesTextuales[0].cita === 'con fundamento en el artículo 2035 del Código Civil'
);

/* ─── 3. NADA DEL TEXTO CAMBIA ───────────────────────────────────────────── */

check('el informe no se muta ni gana una palabra', JSON.stringify(INFORME) === TEXTO_ORIGINAL);
check(
  'lo que no cita normas no tiene lugar',
  !art2035.dondeAparece.some((l) => l.seccion === 'fortalezas' || l.seccion === 'recomendaciones'),
  lugares
);

/* ─── 4. SIN NADA QUE AVISAR, NO HAY CABECERA ────────────────────────────── */

/*
 * Un encabezado seguido de nada es una casilla, y este repositorio ya sabe
 * cómo terminan: el abogado aprende a saltárselo y el día que dice algo, no lo
 * lee.
 */
const TODO_VIVO: RevisionDeVigencia = {
  resultados: [vigenciaDe(2035, 'VIGENTE', 'La fuente oficial no lo marca derogado.')],
  derogados: 0,
  noVerificables: 0,
  discrepantes: 0
};
check('sin nada que avisar no hay cabecera', avisoDeVigencia(TODO_VIVO) === null, String(avisoDeVigencia(TODO_VIVO)));
check(
  'y lo vigente no trae mensaje ni clase: viaja como comprobado, no como aviso',
  mensajeDeVigencia(TODO_VIVO.resultados[0]) === null &&
    construirComprobaciones(INFORME, TODO_VIVO, null).articulos[0].clases.length === 0
);
const VACIA: RevisionDeVigencia = { resultados: [], derogados: 0, noVerificables: 0, discrepantes: 0 };
check('y sin citas fuera de ficha tampoco', avisoDeVigencia(VACIA) === null);

/* ─── 5. LOS OTROS ESTADOS ───────────────────────────────────────────────── */

/*
 * El MODULADO es el que más lo necesita: se abre, se lee entero y dice
 * exactamente lo que el informe promete — lo que falta es lo que la Corte le
 * quitó, y eso no está en el texto.
 */
const MODULADA: RevisionDeVigencia = {
  resultados: [vigenciaDe(2035, 'MODULADO', 'Nota del artículo: «Aparte subrayado CONDICIONALMENTE exequible».')],
  derogados: 0,
  noVerificables: 0,
  discrepantes: 0
};
const msgModulada = mensajeDeVigencia(MODULADA.resultados[0]) ?? '';
check(
  'un artículo modulado por la Corte se señala, y NO como derogado',
  /MODULADA POR LA CORTE/.test(msgModulada) && !/NORMA DEROGADA/.test(msgModulada),
  msgModulada.slice(0, 120)
);
check(
  'y el aviso de cabecera lo nombra sin llamarlo muerto',
  /MODULADO/.test(avisoDeVigencia(MODULADA) ?? '') && !/DEROGADO/.test(avisoDeVigencia(MODULADA) ?? ''),
  (avisoDeVigencia(MODULADA) ?? '').slice(0, 140)
);

const DISCREPANTE: RevisionDeVigencia = {
  resultados: [vigenciaDe(2035, 'DISCREPANCIA_ENTRE_FUENTES', 'El Senado lo da por VIGENTE y Función Pública por DEROGADO.')],
  derogados: 0,
  noVerificables: 0,
  discrepantes: 1
};
check(
  'la discrepancia entre fuentes se declara y no se resuelve',
  /NO COINCIDEN/.test(mensajeDeVigencia(DISCREPANTE.resultados[0]) ?? ''),
  mensajeDeVigencia(DISCREPANTE.resultados[0]) ?? ''
);

/*
 * EL NO_VERIFICABLE NO SE MARCA SOBRE EL HALLAZGO, y es deliberado. «No pude
 * comprobarlo» pegado a cada cita convertiría un mal minuto del Senado en un
 * informe lleno de avisos, y la falsa alarma es peor que el silencio. Hoy se
 * CUENTA en la banda como «no comprobada» —que es verdad y no acusa a nadie—,
 * pero no trae mensaje de marca ni cabecera.
 */
const SIN_RESPUESTA: RevisionDeVigencia = {
  resultados: [vigenciaDe(2035, 'NO_VERIFICABLE', 'Ninguna fuente oficial respondió.')],
  derogados: 0,
  noVerificables: 1,
  discrepantes: 0
};
check(
  'un NO_VERIFICABLE no trae cabecera ni mensaje de marca; solo se cuenta',
  avisoDeVigencia(SIN_RESPUESTA) === null &&
    mensajeDeVigencia(SIN_RESPUESTA.resultados[0]) === null &&
    construirComprobaciones(INFORME, SIN_RESPUESTA, null).cuenta.noComprobada === 1
);

/* ─── 6. EL AVISO DE CABECERA ────────────────────────────────────────────── */

const aviso = avisoDeVigencia(REVISION);
check(
  'el aviso de cabecera existe cuando hay algo que decir',
  aviso !== null && /COMPROBACIÓN AUTOMÁTICA DE VIGENCIA/.test(aviso),
  (aviso ?? '').slice(0, 90)
);
check('y nombra el artículo concreto, no un conteo suelto', /art\. 2035/.test(aviso ?? ''), (aviso ?? '').slice(0, 160));
check('y viaja en la comprobación, no en las recomendaciones', comprobado.avisos[0] === aviso && INFORME.recomendaciones.length === 1);

/* ─── 7. LA TUBERÍA ESTÁ CONECTADA, Y NO SOLO ESCRITA ────────────────────── */

/*
 * `verificarGlosa.ts` y `verificarVigencia.ts` llevaban meses viviendo en esta
 * misma carpeta sin que nadie de esta carpeta los llamara. Un módulo escrito
 * no es un módulo conectado, y desde fuera se ven igual.
 */
const controlador = readFileSync(
  join(process.cwd(), 'src/modules/agent/review/documentReview.controller.ts'),
  'utf8'
);
check(
  'el controlador de revisión LLAMA a la comprobación, no solo la importa',
  /verificarVigenciaDelInforme\(/.test(controlador),
  'documentReview.controller.ts'
);
check(
  'y guarda el informe CON su comprobación: el aviso sigue ahí cuando el abogado vuelve',
  /informe: informeComprobado/.test(controlador),
  'se guarda y se responde el comprobado'
);
/*
 * NUNCA PUEDE TUMBAR LA REVISIÓN. Llega cuando el informe ya está escrito y ya
 * se pagó: perderlo por un fallo del comprobador sería cambiar un aviso que
 * falta por un producto que no llega.
 */
const bloque = controlador.slice(
  controlador.indexOf('verificarVigenciaDelInforme('),
  controlador.indexOf('const cobro = await settleOperation')
);
check(
  'y va dentro de un try: un fallo del comprobador no puede costar el informe ya pagado',
  bloque.includes('catch'),
  'la comprobación está protegida'
);

/* ─── 8. Y LO QUE AÑADE AL RELOJ CABE ─────────────────────────────────────── */

/*
 * ESTA COMPROBACIÓN LE SUMA TIEMPO A UNA PETICIÓN QUE YA ERA LARGA, y el
 * reparto del camino de revisión NO está sumado en ninguna parte —
 * `presupuestoDeTiempo.ts` reparte solo Redacción—. Aquí se suman al menos
 * los tres tramos que sí tienen tope declarado, para que añadir un cuarto no
 * pueda acercar la petición al reloj de la función sin que algo se ponga rojo.
 *
 * Lo que queda FUERA de esta cuenta, y se deja dicho porque es un hueco
 * conocido y no un olvido: la extracción de un PDF o DOCX de hasta 15 MB no
 * tiene tope propio. Si un día la petición muere en Vercel, ése es el primer
 * sitio donde mirar.
 */
const conTope = LIMITE_LLAMADA_MS + PLAZO_VIGENCIA_INFORME_MS + PLAZO_DESCARGA_MS;
check(
  'los tramos con tope del camino de revisión caben holgados en el reloj de la función',
  conTope <= TOPE_DE_FUNCION_MS / 2,
  `${conTope} ms de ${TOPE_DE_FUNCION_MS} ms — queda margen para la extracción del archivo, que no tiene tope propio`
);

/* ─── 9. LO QUE SE MANDA A COMPROBAR SALE DEL INFORME ENTERO ─────────────── */

/*
 * Con una lista de autorizados que ya contiene el 2035, no queda nada por
 * comprobar y NO se sale a la red. Es la misma regla de Redacción: lo de la
 * ficha ya se leyó contra la fuente al construir el catálogo, y gastar el
 * plazo ahí dejaría sin mirar las citas que nadie ha leído.
 */
const main = async (): Promise<void> => {
  const nada = await verificarVigenciaDelInforme(
    INFORME,
    [{ codigo: 'CODIGO CIVIL', articulo: 2035 }, { codigo: 'LEY 820 DE 2003', articulo: 22 }, { codigo: 'CGP', articulo: 384 }],
    5_000
  );
  check(
    'lo que ya está en el universo citable de la ficha no se vuelve a comprobar',
    nada.resultados.length === 0,
    `${nada.resultados.length} artículos consultados`
  );

  console.log('');
  console.log(fallos === 0 ? 'ALL CHECKS PASSED' : `${fallos} CHECKS FAILED`);
  process.exitCode = fallos === 0 ? 0 : 1;
};

void main();
