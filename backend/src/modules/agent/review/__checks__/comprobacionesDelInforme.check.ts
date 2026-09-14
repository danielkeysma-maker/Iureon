/**
 * GUARDA DE LA COMPROBACIÓN AUTOMÁTICA COMO DATO.
 *
 * Run with: npm run check:comprobaciones-informe
 *
 * ─── LA DECISIÓN QUE ESTO SOSTIENE (14 de septiembre de 2026, «opción 2») ──
 *
 * Hasta hoy la vigencia y la glosa del informe de ESCRITO_PROPIO se entregaban
 * COMO TEXTO: corchetes pegados donde el revisor nombraba el artículo, y dos
 * avisos antepuestos a `recomendaciones`. El diseño nuevo pide una banda propia
 * con conteos por clase, una marca visual SOBRE el hallazgo y un «Ir al punto».
 * Nada de eso se puede construir releyendo corchetes: el servidor manda los
 * resultados como DATOS y el texto del informe queda con las palabras del
 * revisor y ninguna otra.
 *
 * Lo que tiene que aguantar:
 *
 *  1. EL TEXTO NO SE TOCA. Ni una marca, ni un aviso en `recomendaciones`.
 *  2. CADA CLASE LLEGA COMO DATO, con su mensaje redactado igual que el
 *     corchete de siempre (la redacción no puede derivar).
 *  3. LOS LUGARES SON LOS MISMOS que marcaba el texto: la misma expresión que
 *     decidía dónde iba el corchete decide `dondeAparece`.
 *  4. LA BANDA CUENTA SOLO LO QUE HAY QUE MIRAR, aunque lo comprobado y bueno
 *     también viaje.
 *  5. LA NUEVA REVISIÓN DICE QUE NO COMPROBÓ, en vez de callarlo.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { InformeDeRevision } from '../documentReview';
import type { RevisionDeVigencia } from '../verificarVigencia';
import type { GlosaJuzgada, RevisionDeGlosa } from '../verificarGlosa';
import type { VigenciaDeArticulo } from '../../../legislation/officialArticle.service';
import { avisoDeVigencia } from '../vigenciaDelInforme';
import { avisoDeGlosa } from '../glosaDelInforme';
import {
  construirComprobaciones,
  informeConComprobaciones,
  informeSinComprobar,
  type ComprobacionDeArticulo
} from '../comprobacionesDelInforme';
import { traerPasajesDelExpediente } from '../../../expedientes/materialDelExpediente';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

/* ─── FIXTURES ─────────────────────────────────────────────────────────────
 *
 * Un informe que nombra siete artículos, uno por cada cosa que puede pasar:
 *   2035 CC  DEROGADO            — dos veces en el resumen y la debilidad, y en la cita
 *   8 L820   VIGENTE, NO SOSTENIDA — en la debilidad
 *   1602 CC  MODULADO            — en la segunda debilidad
 *   384 CGP  DISCREPANCIA        — en la corrección de un error de aplicación
 *   22 L820  NO_VERIFICABLE      — en el problema del mismo error
 *   90 CGP   VIGENTE, DUDOSA     — SOLO en el reemplazo
 *   206 CGP  VIGENTE, SOSTENIDA  — en la recomendación
 */
const INFORME: InformeDeRevision = {
  resumen: 'El escrito se apoya en el artículo 2035 del Código Civil, que no corresponde.',
  fortalezas: ['Los hechos están ordenados.'],
  debilidades: [
    'Debe revisarse el artículo 2035 del Código Civil; y el art. 8 de la Ley 820 de 2003 fija las obligaciones del arrendatario. Otra vez: el artículo 2035 del Código Civil.',
    'La interpretación del contrato ignora el artículo 1602 del Código Civil.'
  ],
  seccionesFaltantes: ['Juramento estimatorio'],
  erroresDeAplicacion: [
    {
      donde: 'Fundamentos de derecho',
      problema: 'Se invoca el artículo 22 de la Ley 820 de 2003 sin explicar la causal.',
      correccion: 'Debe invocarse el artículo 384 del CGP.'
    }
  ],
  correccionesTextuales: [
    {
      cita: 'con fundamento en el artículo 2035 del Código Civil',
      problema: 'La norma citada no sostiene la pretensión.',
      reemplazo: 'con fundamento en el artículo 90 del CGP'
    }
  ],
  recomendaciones: ['Aportar el juramento conforme al artículo 206 del CGP.']
};
const COPIA_DEL_TEXTO = JSON.stringify(INFORME);

const vig = (codigo: string, articulo: number, estado: VigenciaDeArticulo['estado'], detalle: string): VigenciaDeArticulo => ({
  referencia: { codigo, articulo },
  estado,
  detalle,
  url: `https://www.secretariasenado.gov.co/${codigo}/${articulo}`,
  lecturas: [],
  fuentesQueOpinaron: estado === 'NO_VERIFICABLE' ? [] : ['SENADO'],
  consultadoEn: '2026-09-14'
});

const VIGENCIA: RevisionDeVigencia = {
  resultados: [
    vig('CODIGO CIVIL', 2035, 'DEROGADO', 'Artículo derogado por el artículo 43 de la Ley 820 de 2003'),
    vig('LEY 820 DE 2003', 8, 'VIGENTE', 'Vigente según la Secretaría del Senado.'),
    vig('CODIGO CIVIL', 1602, 'MODULADO', 'Nota del artículo: «Aparte subrayado CONDICIONALMENTE exequible» [C-123/05].'),
    vig('CGP', 384, 'DISCREPANCIA_ENTRE_FUENTES', 'El Senado lo da por VIGENTE y Función Pública por DEROGADO.'),
    vig('LEY 820 DE 2003', 22, 'NO_VERIFICABLE', 'Ninguna fuente oficial respondió dentro del plazo del escrito; no se sabe si el artículo sigue vigente.'),
    vig('CGP', 90, 'VIGENTE', 'Vigente según la Secretaría del Senado.'),
    vig('CGP', 206, 'VIGENTE', 'Vigente según la Secretaría del Senado.')
  ],
  derogados: 1,
  noVerificables: 1,
  discrepantes: 1
};

const glosa = (codigo: string, articulo: number, veredicto: GlosaJuzgada['veredicto'], frase: string, motivo: string): GlosaJuzgada => ({
  referencia: { codigo, articulo },
  clase: 'GLOSA_EN_PARENTESIS',
  frase,
  textoOficial: 'Son obligaciones del arrendador, las siguientes: 1. Entregar al arrendatario el inmueble.',
  apoyo: veredicto === 'DUDOSA' ? undefined : 'Son obligaciones del arrendador, las siguientes:',
  motivo,
  veredicto
});

const GLOSA: RevisionDeGlosa = {
  resultados: [
    glosa('LEY 820 DE 2003', 8, 'NO_SOSTENIDA', 'fija las obligaciones del arrendatario', 'El artículo regula las obligaciones del arrendador.'),
    glosa('CGP', 90, 'DUDOSA', 'con fundamento en el artículo 90', 'El juez no respondió dentro del plazo.'),
    glosa('CGP', 206, 'SOSTENIDA', 'el juramento conforme al artículo 206', 'El texto sostiene la frase.')
  ],
  noSostenidas: 1,
  dudosas: 1,
  usos: []
};

const C = construirComprobaciones(INFORME, VIGENCIA, GLOSA);
const de = (articulo: number): ComprobacionDeArticulo | undefined => C.articulos.find((a) => a.articulo === articulo);
const lugares = (articulo: number): string => JSON.stringify(de(articulo)?.dondeAparece ?? null);

/* ─── 1. EL TEXTO QUEDA CON LAS PALABRAS DEL REVISOR ─────────────────────── */

const guardado = informeConComprobaciones(INFORME, C, 3);
const sinExtras = { ...guardado } as Record<string, unknown>;
delete sinExtras.comprobaciones;
delete sinExtras.pasajesDelCaso;
check(
  'el informe que se guarda tiene EXACTAMENTE el texto del revisor: ni corchetes ni avisos',
  JSON.stringify(sinExtras) === COPIA_DEL_TEXTO,
  JSON.stringify(sinExtras).slice(0, 160)
);
check(
  'las recomendaciones no llevan antepuesto ningún aviso',
  guardado.recomendaciones.length === 1 && !guardado.recomendaciones[0].startsWith('COMPROBACIÓN AUTOMÁTICA'),
  guardado.recomendaciones[0]
);
check('el informe de entrada no se muta', JSON.stringify(INFORME) === COPIA_DEL_TEXTO);
check(
  'la comprobación y los pasajes viajan DENTRO del informe guardado (JSONB, sin migración)',
  guardado.comprobaciones === C && guardado.pasajesDelCaso === 3
);

/* ─── 2. CADA CLASE LLEGA COMO DATO ──────────────────────────────────────── */

check('se incluyen los siete artículos comprobados, también los buenos', C.articulos.length === 7, String(C.articulos.length));
check('el derogado trae su clase', JSON.stringify(de(2035)?.clases) === '["DEROGADA"]', JSON.stringify(de(2035)?.clases));
check('el modulado trae su clase', JSON.stringify(de(1602)?.clases) === '["MODULADA"]');
check('la discrepancia trae su clase', JSON.stringify(de(384)?.clases) === '["FUENTES_EN_DESACUERDO"]');
check('el no verificable queda como no comprobado', JSON.stringify(de(22)?.clases) === '["NO_COMPROBADA"]');
check('la glosa no sostenida trae su clase', JSON.stringify(de(8)?.clases) === '["NO_LO_DICE_EL_ARTICULO"]', JSON.stringify(de(8)?.clases));
check('la glosa dudosa queda como no comprobada', JSON.stringify(de(90)?.clases) === '["NO_COMPROBADA"]');
check('lo vigente y sostenido no trae ninguna clase', JSON.stringify(de(206)?.clases) === '[]');

check(
  'la vigencia viaja con estado, detalle, fuentes y url',
  de(2035)?.vigencia.estado === 'DEROGADO' &&
    de(2035)?.vigencia.detalle === 'Artículo derogado por el artículo 43 de la Ley 820 de 2003' &&
    JSON.stringify(de(2035)?.vigencia.fuentes) === '["SENADO"]' &&
    Boolean(de(2035)?.vigencia.url)
);
check('la norma se nombra como se le habla al abogado', de(2035)?.norma === 'Código Civil' && de(2035)?.codigo === 'CODIGO CIVIL', String(de(2035)?.norma));
check('un artículo que la glosa no juzgó trae glosa null', de(2035)?.glosa === null);
check(
  'la glosa juzgada trae la frase del revisor, el extracto oficial y el motivo',
  de(8)?.glosa?.veredicto === 'NO_SOSTENIDA' &&
    de(8)?.glosa?.frase === 'fija las obligaciones del arrendatario' &&
    (de(8)?.glosa?.extractoOficial ?? '').includes('Son obligaciones del arrendador') &&
    de(8)?.glosa?.motivo === 'El artículo regula las obligaciones del arrendador.',
  JSON.stringify(de(8)?.glosa)
);

/* ─── 3. LA REDACCIÓN NO DERIVA DE LA DE LOS CORCHETES ───────────────────── */

const mensaje = (articulo: number, clase: string): string =>
  de(articulo)?.mensajes.find((m) => m.clase === clase)?.texto ?? '';
check(
  'el mensaje del derogado es el corchete de siempre, sin los corchetes',
  mensaje(2035, 'DEROGADA') ===
    'NORMA DEROGADA — este artículo NO está vigente: Artículo derogado por el artículo 43 de la Ley 820 de 2003. La revisión lo nombró de todos modos; no se apoye en él.',
  mensaje(2035, 'DEROGADA')
);
check(
  'el del modulado también',
  mensaje(1602, 'MODULADA') ===
    'NORMA VIGENTE PERO MODULADA POR LA CORTE — rige, pero su texto publicado no es el que rige: Nota del artículo: «Aparte subrayado CONDICIONALMENTE exequible» [C-123/05]. Léalo en la sentencia antes de usarlo.'
);
check(
  'el de la discrepancia también',
  mensaje(384, 'FUENTES_EN_DESACUERDO') ===
    'LAS FUENTES OFICIALES NO COINCIDEN sobre este artículo — El Senado lo da por VIGENTE y Función Pública por DEROGADO. Esta casa no elige: compruébelo usted.'
);
check(
  'el de la glosa no sostenida también, con el extracto entre «»',
  mensaje(8, 'NO_LO_DICE_EL_ARTICULO').startsWith('LO QUE ESTA REVISIÓN AFIRMA NO LO DICE ESE ARTÍCULO — el texto oficial dice: «') &&
    mensaje(8, 'NO_LO_DICE_EL_ARTICULO').endsWith('». El artículo regula las obligaciones del arrendador. No se apoye en este punto sin leer la norma.'),
  mensaje(8, 'NO_LO_DICE_EL_ARTICULO')
);
check('lo no comprobado también trae su porqué, para la banda', mensaje(22, 'NO_COMPROBADA').length > 0 && mensaje(90, 'NO_COMPROBADA').length > 0);

check(
  'los avisos de cabecera son EXACTAMENTE los de siempre, en el orden de siempre',
  C.avisos.length === 2 && C.avisos[0] === avisoDeVigencia(VIGENCIA) && C.avisos[1] === avisoDeGlosa(GLOSA),
  C.avisos.map((a) => a.slice(0, 50)).join(' | ')
);

/*
 * LA OTRA MITAD DE LA REDACCIÓN VIVE EN EL FRONTEND: el lector de informes
 * antiguos reconoce cada corchete por su apertura y su cierre exactos. Si aquí
 * cambia una palabra de un mensaje, los informes guardados y los nuevos dejan
 * de decir lo mismo. Se lee el archivo del frontend cuando está en el árbol.
 */
const MARCAS_FRONT = join(process.cwd(), '..', 'frontend', 'src', 'modules', 'workspace', 'services', 'marcas.ts');
if (existsSync(MARCAS_FRONT)) {
  const front = readFileSync(MARCAS_FRONT, 'utf8');
  const aperturas = [...front.matchAll(/apertura: '([^']+)'/g)].map((m) => m[1]);
  const cierres = [...front.matchAll(/cierre: '([^']+)'/g)].map((m) => m[1]);
  const parejas: Array<[number, string]> = [
    [2035, 'DEROGADA'],
    [1602, 'MODULADA'],
    [384, 'FUENTES_EN_DESACUERDO'],
    [8, 'NO_LO_DICE_EL_ARTICULO']
  ];
  check(
    'cada mensaje, puesto entre corchetes, lo reconoce el lector de informes antiguos del frontend',
    aperturas.length >= 4 &&
      parejas.every(([a, c]) => {
        const marca = `[${mensaje(a, c)}]`;
        return aperturas.some((ap, k) => marca.startsWith(ap) && marca.endsWith(cierres[k]));
      }),
    `${aperturas.length} aperturas leídas`
  );
}

/* ─── 4. LOS LUGARES, CON LA MISMA LÓGICA QUE PONÍA EL CORCHETE ──────────── */

check(
  'un artículo nombrado en el resumen y en la debilidad aparece en los dos, y en la cita sin marcarla',
  lugares(2035) ===
    JSON.stringify([
      { seccion: 'resumen', indice: 0 },
      { seccion: 'debilidades', indice: 0 },
      { seccion: 'correccionesTextuales', indice: 0, campo: 'cita' }
    ]),
  lugares(2035)
);
check(
  'nombrado dos veces en la MISMA debilidad, el lugar no se repite',
  (de(2035)?.dondeAparece.filter((l) => l.seccion === 'debilidades').length ?? 0) === 1
);
check(
  'un artículo nombrado SOLO en el reemplazo apunta al reemplazo',
  lugares(90) === JSON.stringify([{ seccion: 'correccionesTextuales', indice: 0, campo: 'reemplazo' }]),
  lugares(90)
);
check(
  'en un error de aplicación se distingue el campo',
  lugares(22) === JSON.stringify([{ seccion: 'erroresDeAplicacion', indice: 0, campo: 'problema' }]) &&
    lugares(384) === JSON.stringify([{ seccion: 'erroresDeAplicacion', indice: 0, campo: 'correccion' }]),
  `${lugares(22)} ${lugares(384)}`
);
check('la segunda debilidad lleva su índice', lugares(1602) === JSON.stringify([{ seccion: 'debilidades', indice: 1 }]), lugares(1602));
check('y la recomendación el suyo', lugares(206) === JSON.stringify([{ seccion: 'recomendaciones', indice: 0 }]), lugares(206));

/*
 * UN NÚMERO SUELTO NO ES UNA CITA. «2035» sin cabeza de cita puede ser un año o
 * una cuantía; la expresión que ponía el corchete exigía «artículo» o «art.»
 * cerca, y la que pone el lugar exige lo mismo.
 */
const SIN_CABEZA = construirComprobaciones(
  { ...INFORME, resumen: 'En 2035 vence el contrato.', debilidades: [], correccionesTextuales: [] },
  { ...VIGENCIA, resultados: [VIGENCIA.resultados[0]] },
  null
);
check('un número sin «artículo» delante no es un lugar', SIN_CABEZA.articulos[0].dondeAparece.length === 0, JSON.stringify(SIN_CABEZA.articulos[0].dondeAparece));

/* ─── 5. LA BANDA CUENTA LO QUE HAY QUE MIRAR ────────────────────────────── */

check(
  'la cuenta tiene una clase por cosa accionable y deja fuera lo vigente y sostenido',
  JSON.stringify(C.cuenta) ===
    JSON.stringify({ derogada: 1, modulada: 1, fuentesEnDesacuerdo: 1, noLoDiceElArticulo: 1, noComprobada: 2 }),
  JSON.stringify(C.cuenta)
);
check('las dos comprobaciones corrieron', C.vigenciaComprobada && C.glosaComprobada);

const NADA = construirComprobaciones(INFORME, { resultados: [], derogados: 0, noVerificables: 0, discrepantes: 0 }, null);
check(
  'sin citas fuera de ficha la comprobación existe, vacía y sin avisos',
  NADA.articulos.length === 0 && NADA.avisos.length === 0 && Object.values(NADA.cuenta).every((n) => n === 0)
);
const CAIDA = construirComprobaciones(INFORME, null, null);
check('si la vigencia falló, se dice: no se confunde con «nada que avisar»', CAIDA.vigenciaComprobada === false && CAIDA.glosaComprobada === false);

/* ─── 6. LA NUEVA REVISIÓN NO COMPROBÓ, Y LO DICE ────────────────────────── */

const rerevisado = informeSinComprobar(INFORME);
check(
  'la nueva revisión lleva comprobaciones null (no se repitió) y cero pasajes',
  rerevisado.comprobaciones === null && rerevisado.pasajesDelCaso === 0 && rerevisado.resumen === INFORME.resumen
);

/* ─── 7. LA TUBERÍA ─────────────────────────────────────────────────────── */

const controlador = readFileSync(join(__dirname, '..', 'documentReview.controller.ts'), 'utf8');
check('el controlador ya no escribe corchetes de vigencia en el texto', !/marcarVigenciaEnInforme\(/.test(controlador));
check('ni de glosa', !/marcarGlosaEnInforme\(/.test(controlador));
check('ni antepone avisos a las recomendaciones', !/recomendaciones: \[\.\.\.avisos/.test(controlador));
check('construye la comprobación como dato', /construirComprobaciones\(/.test(controlador));
check('y la guarda con el informe y los pasajes del caso', /informeConComprobaciones\(/.test(controlador) && /pasajesDelCaso/.test(controlador));
const rerevision = controlador.slice(controlador.indexOf('export const reReviewController'));
check('«Volver a revisar» marca que no comprobó', /informeSinComprobar\(/.test(rerevision));
check('y no corre las comprobaciones (decisión de costo no tomada)', !/verificarVigenciaDelInforme\(|verificarGlosaDelInforme\(/.test(rerevision));

/* ─── 8. LOS PASAJES DEL CASO SE CUENTAN ─────────────────────────────────── */

void (async () => {
  const sinExpediente = await traerPasajesDelExpediente('firma', null, 'consulta');
  check('sin expediente: cero pasajes y ningún bloque', sinExpediente.pasajes === 0 && sinExpediente.bloque === undefined, JSON.stringify(sinExpediente));

  console.log('');
  console.log(fallos === 0 ? 'ALL CHECKS PASSED' : `${fallos} CHECKS FAILED`);
  process.exitCode = fallos === 0 ? 0 : 1;
})();
