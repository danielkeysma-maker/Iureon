/**
 * Guarda la cara nueva del Buscador (08) y del Catálogo (09) contra lo que la
 * maqueta dibuja y el producto no hace, y contra las cifras de muestra que la
 * maqueta imprime.
 *
 * Run with: npm run check:buscador-catalogo-cara
 *
 * ─── LOS DEFECTOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. DOS CORPUS MEZCLADOS EN UNA LISTA. `app-buscador-catalogo.html` separa lo
 *    que una persona leyó de lo encontrado automáticamente, y README-app lo dice
 *    sin rodeos: mezclarlos «sería promover en silencio lo que nadie ha leído».
 *    La separación vive en una función pura (`separarCorpus`) y las dos
 *    pantallas del Buscador tienen que pasar por ella: un `filter` escrito a
 *    mano en el componente es justo el sitio donde un `!== false` se vuelve
 *    `=== true` y lo automático sube de bloque sin que nada falle.
 *
 * 2. LA SIMILITUD PRESENTADA COMO AUTORIDAD. La búsqueda vectorial ordena por
 *    parecido del texto; la C-590 de 2005, que fijó los requisitos de la tutela
 *    contra providencias, queda detrás de sentencias que solo los repiten. Un
 *    «67 %» o un «más relevante» se leen como peso jurídico. La pantalla dice el
 *    parecido en palabras, y nunca como autoridad.
 *
 * 3. LO QUE LA MAQUETA DIBUJA Y NO EXISTE: «Curada por C. Restrepo», «Citada en
 *    3 escritos», la nota del curador, «Leerla y curarla», el formulario «Curar
 *    esta providencia» y «Lo que alguien de su firma leyó». No hay curaduría de
 *    jurisprudencia por firma: el corpus curado lo leyó una persona antes de
 *    indexarlo, no alguien de la firma, y no guarda autor ni nota ni usos.
 *
 * 4. CIFRAS ESCRITAS A MANO. «883 actuaciones de 28 ramas», «550 con artículo
 *    comprobado», «333» por comprobar: el catálogo las tiene y se cuentan.
 *
 * 5. LA DOCTRINA DE VERIFICACIÓN BORRADA POR LA PIEL: «término verificado» no es
 *    «artículo verificado»; lo de la firma va «sin norma verificada»; lo que
 *    nadie comprobó lleva el borde discontinuo y nada más lo lleva.
 *
 * Los componentes se leen como TEXTO y sin comentarios: los comentarios que
 * explican por qué no se dice algo contienen la palabra.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CORPORACIONES,
  UMBRAL_COBERTURA,
  alcanzanLaConsulta,
  aniosDisponibles,
  citaCopiable,
  cercaniaMaxima,
  leerFicha,
  parecidoEnPalabras,
  resultadosVisibles,
  separarCorpus
} from '../dosCorpus';
import { censoDelCatalogo, filaDelCatalogo } from '../../catalog/estadoEnElCatalogo';
import type { CorpusPrecedent } from '../services/legalSearch.api';
import type { Actuacion } from '../../catalog/types';

const AQUI = dirname(fileURLToPath(import.meta.url));
const SRC = join(AQUI, '..', '..', '..');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── 1. LOS DOS CORPUS, PUROS ───────────────────────────────────────────── */
const item = (id: string, over: Partial<CorpusPrecedent> = {}): CorpusPrecedent => ({
  id,
  contentChunk: 'Texto de muestra.',
  similarity: 0.62,
  branch: null,
  providencia: `Providencia ${id} de 2000`,
  corporacion: 'CORTE_CONSTITUCIONAL',
  magistradoPonente: null,
  outcome: null,
  sourceUrl: null,
  isSharedCorpus: true,
  ...over
});

const mezcla = [
  item('a'),
  item('b', { curado: false }),
  item('c', { curado: true }),
  item('d', { curado: false, corporacion: 'CORTE_SUPREMA', providencia: 'Providencia sin año' })
];
const { leidas, sinLeer } = separarCorpus(mezcla);
check('lo ausente se lee como leído (el corpus viejo no trae el campo)', leidas.some((i) => i.id === 'a'));
check('lo marcado como no curado nunca cae en «leídas»', leidas.every((i) => i.curado !== false), leidas.map((i) => i.id).join(','));
check('lo no curado cae en «sin leer» y solo eso', sinLeer.every((i) => i.curado === false) && sinLeer.length === 2);
check(
  'ninguna providencia está en las dos listas y ninguna se pierde',
  leidas.length + sinLeer.length === mezcla.length && !leidas.some((l) => sinLeer.includes(l))
);

const soloLeidas = resultadosVisibles(mezcla, { corporacion: 'TODAS', anio: 'TODOS', soloLeidas: true });
check('«solo lo que alguien leyó» esconde el bloque automático, no lo pasa al otro', soloLeidas.sinLeer.length === 0 && soloLeidas.leidas.length === 2);
const suprema = resultadosVisibles(mezcla, { corporacion: 'CORTE_SUPREMA', anio: 'TODOS', soloLeidas: false });
check('el filtro de corporación respeta la procedencia registrada', suprema.leidas.length === 0 && suprema.sinLeer.length === 1);
const anio = resultadosVisibles(mezcla, { corporacion: 'TODAS', anio: '1999', soloLeidas: false });
check('un filtro de año no esconde lo que no trae año', anio.sinLeer.some((i) => i.id === 'd') && anio.leidas.length === 0);
check('los años salen de las providencias traídas', JSON.stringify(aniosDisponibles(mezcla)) === '["2000"]', JSON.stringify(aniosDisponibles(mezcla)));

check('el umbral de cobertura sigue siendo el medido', UMBRAL_COBERTURA === 0.6);
check(
  'lo que no alcanza el umbral no se presenta como hallazgo',
  alcanzanLaConsulta([item('x', { similarity: 0.59 }), item('y', { similarity: 0.6 })]).map((i) => i.id).join() === 'y'
);
check('sin nada no hay «lo más cercano»', cercaniaMaxima([]) === null);
check('lo más cercano es el máximo', cercaniaMaxima([item('x', { similarity: 0.46 }), item('y', { similarity: 0.5 })]) === 0.5);

const palabras = [0.95, 0.67, 0.62, 0.4].map(parecidoEnPalabras);
check('el parecido se dice en palabras', palabras[1] !== palabras[2] && palabras.every((p) => p.length > 0), palabras.join(' | '));
check(
  'y nunca como autoridad ni como porcentaje',
  palabras.every((p) => !/relevan|autoridad|mejor|importante|%|\d/i.test(p)),
  palabras.join(' | ')
);

const ficha = leerFicha('[CORPORACIÓN: X] [TIPO: Y]\nHECHOS: Hechos de muestra.\nRATIO: Ratio de muestra.\n\nCuerpo de muestra.');
check('la ficha lee hechos y ratio de lo que guardó la ingesta', ficha.hechos === 'Hechos de muestra.' && ficha.ratio === 'Ratio de muestra.' && ficha.texto === 'Cuerpo de muestra.');
const vacia = leerFicha('[CORPORACIÓN: X]\nHECHOS: undefined\nRATIO: \n\nCuerpo.');
check('un «undefined» de la ingesta no se pinta como hechos', vacia.hechos === null && vacia.ratio === null);
check('un fragmento sin cabecera se muestra entero', leerFicha('Solo texto.').texto === 'Solo texto.' && leerFicha('Solo texto.').hechos === null);
check('sin providencia no hay cita que copiar', citaCopiable(item('z', { providencia: null, corporacion: null })) === null);
check(
  'las corporaciones del filtro son las que el corpus archiva',
  CORPORACIONES.some((c) => c.id === 'CONSEJO_ESTADO') && !CORPORACIONES.some((c) => (c.id as string) === 'CONSEJO_DE_ESTADO')
);

/* ─── 2. EL CATÁLOGO, PURO ───────────────────────────────────────────────── */
const ficha0 = (over: Partial<Actuacion> = {}): Actuacion => ({
  id: 'x',
  exactName: 'Actuación 00',
  branch: 'CIVIL',
  role: 'LITIGANTE',
  legalBasis: 'Ley 0000 de 0000, art. 00',
  competentAuthority: 'Autoridad 00',
  term: { status: 'VERIFICADO', description: 'Término de muestra. Segunda frase.' },
  requiredSections: [],
  sourceUrl: 'https://example.invalid/norma',
  ...over
});

const verificada = filaDelCatalogo(ficha0());
check('término verificado se dice así, no «verificada» a secas', verificada.estado.texto === 'Término verificado' && verificada.estado.tono === 'ok', verificada.estado.texto);
check('el fundamento es el artículo tal como está escrito, en mono', verificada.fundamento.texto === 'art. 00' && verificada.fundamento.mono);
check('la fila lleva la primera frase del término', verificada.termino.texto === 'Término de muestra.', verificada.termino.texto);

const sin = filaDelCatalogo(ficha0({ term: { status: 'NO_VERIFICADO', description: null }, legalBasis: 'Norma sin artículo' }));
check('lo que nadie comprobó dice «Sin verificar» con tono de guion', sin.estado.texto === 'Sin verificar' && sin.estado.tono === 'sin' && sin.termino.tono === 'sin');
check('sin artículo en el fundamento se dice, no se completa', sin.fundamento.texto === 'Sin artículo confirmado' && !sin.fundamento.mono);
check('no caduca es neutro', filaDelCatalogo(ficha0({ term: { status: 'NO_CADUCA', description: null } })).estado.tono === 'neutro');

const propia = filaDelCatalogo(ficha0({ firmDefined: true, term: { status: 'NO_VERIFICADO', description: null }, legalBasis: '' }));
check('lo de la firma va «sin norma verificada»', /sin norma verificada/i.test(propia.estado.texto) && propia.estado.tono === 'sin', propia.estado.texto);
const titulo = filaDelCatalogo(ficha0({ firmDefined: true, exactName: 'Sin nombre — Lograr algo de muestra', term: { status: 'NO_VERIFICADO', description: null } }));
check('el título de trabajo no se presenta como figura', /título de trabajo/i.test(titulo.estado.texto), titulo.estado.texto);
const prestada = filaDelCatalogo(
  ficha0({
    term: { status: 'NO_VERIFICADO', description: null },
    porRemision: {
      ramaFuente: 'CIVIL',
      paraRama: 'FAMILIA',
      estatuto: 'Estatuto 00',
      base: 'Ley 0000, art. 00',
      marca: 'Marca del servidor',
      aviso: 'Aviso',
      alcance: null,
      terminoEnLaRamaFuente: { status: 'VERIFICADO', description: 'x' },
      legalBasisEnLaRamaFuente: 'x'
    }
  })
);
check('la ficha prestada lleva la marca que manda el servidor', prestada.marca === 'Marca del servidor');

const censo = censoDelCatalogo(
  [ficha0(), ficha0({ id: 'y', term: { status: 'NO_VERIFICADO', description: null } }), ficha0({ id: 'z', firmDefined: true }), ficha0({ id: 'w', term: { status: 'NO_CADUCA', description: null } })],
  ['CIVIL', 'LABORAL']
);
check(
  'el censo se cuenta: total, verificados de fábrica, sin verificar, de la firma y ramas',
  censo.total === 4 && censo.conTerminoVerificado === 1 && censo.sinVerificar === 1 && censo.deLaFirma === 1 && censo.ramas === 2,
  JSON.stringify(censo)
);

/* ─── 3. LAS PANTALLAS, LEÍDAS COMO TEXTO ────────────────────────────────── */
const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
const leer = (ruta: string): string => sinComentarios(readFileSync(join(SRC, ruta), 'utf8'));

const P: Record<string, string> = {
  SearchView: leer('modules/search/components/SearchView.tsx'),
  SearchMobileView: leer('modules/search/components/SearchMobileView.tsx'),
  CatalogCurationView: leer('modules/catalog/components/CatalogCurationView.tsx'),
  CatalogMobileView: leer('modules/catalog/components/CatalogMobileView.tsx'),
  ActuacionDetail: leer('modules/catalog/components/ActuacionDetail.tsx'),
  VerificationForm: leer('modules/catalog/components/VerificationForm.tsx')
};
const junto = (t: string): string => t.replace(/\s+/g, '');

/* La raíz: visita guiada y cara nueva en el mismo elemento. */
check('SearchView: visita guiada y cara nueva', /data-visita="vista-search"\s+className="cara-nueva cn-bus[ "]/.test(P.SearchView));
check('SearchMobileView: visita guiada y cara nueva', /data-visita="vista-search"\s+className="cara-nueva cn-bus[ "]/.test(P.SearchMobileView));
check('CatalogCurationView: visita guiada y cara nueva', /data-visita="vista-catalogo"\s+className="cara-nueva cn-cat[ "]/.test(P.CatalogCurationView));
check('CatalogMobileView: visita guiada y cara nueva', /data-visita="vista-catalogo"\s+className="cara-nueva cn-cat[ "]/.test(P.CatalogMobileView));

/* Los dos corpus pasan por la función, en las dos pantallas. */
for (const nombre of ['SearchView', 'SearchMobileView']) {
  const c = P[nombre];
  check(`${nombre} separa los corpus con la función pura`, c.includes('resultadosVisibles(') && !/curado\s*[!=]==/.test(c));
  check(`${nombre} aplica el umbral de cobertura`, c.includes('alcanzanLaConsulta('));
  check(`${nombre} no pinta la similitud como porcentaje`, !/similarity\s*\*\s*100/.test(c) && !/toFixed\(0\)\}\s*%/.test(c));
  check(`${nombre} dice el parecido en palabras`, c.includes('parecidoEnPalabras('));
  check(`${nombre} sigue consultando el corpus`, c.includes('searchPrecedents('));
}

/* La tarjeta de lo que nadie leyó no ofrece citar. */
const cuerpoDe = (codigo: string, nombre: string): string => {
  const i = codigo.indexOf(`const ${nombre}`);
  if (i === -1) return '';
  const fin = codigo.indexOf('\n};', i);
  return codigo.slice(i, fin === -1 ? undefined : fin);
};
const sinCitar = (tarjeta: string): boolean => tarjeta !== '' && !/clipboard|onCitar|Citar/.test(tarjeta);
check('SearchView: la tarjeta sin leer existe y no ofrece citar', sinCitar(cuerpoDe(P.SearchView, 'TarjetaSinLeer')));
check('SearchMobileView: la tarjeta sin leer existe y no ofrece citar', sinCitar(cuerpoDe(P.SearchMobileView, 'TarjetaSinLeer')));

/* Lo que el escritorio ya hacía y la piel no puede tumbar. */
for (const llamada of [
  'discoverRulings(query)',
  'indexDiscovered(',
  'buscarDisciplinaria(query)',
  'fetchOfficialRuling(query)',
  'citationShape(query)',
  'navigator.clipboard.writeText('
]) {
  check(`SearchView conserva ${llamada}`, junto(P.SearchView).includes(junto(llamada)));
}

/* Lo que la maqueta dibuja y el producto no tiene. */
const INVENTADAS: Array<[string, RegExp]> = [
  ['un curador de muestra', /Restrepo|Ávila|C\. Restrepo|J\. Ávila|Cárdenas/],
  ['usos en escritos que nadie cuenta', /Citada en \d|citada en \d/],
  ['la curaduría de jurisprudencia que no existe', /Curar esta providencia|Leerla y curarla|Guardar la curaduría|Corregir la curaduría|Curada por/],
  ['la nota del curador que no se guarda', /Nota del curador|podría ir en contra de su tesis/i],
  ['la lectura atribuida a la firma', /alguien de su firma leyó|alguien de la firma leyó/i],
  ['la similitud como autoridad', /más relevante|mas relevante|mejor resultado|más importante/i],
  ['una cita de muestra', /\b(T|SU|C)-000/],
  ['cifras del catálogo escritas a mano', /\b(883|881|879|858|794|651|550|333)\b|\b\d+\s+ramas\b/],
  ['un texto de muestra con cara de dato', /estabilidad laboral reforzada de trabajador|Juez civil municipal/i]
];
for (const [nombre, codigo] of Object.entries(P)) {
  for (const [que, re] of INVENTADAS) {
    const m = codigo.match(re);
    check(`${nombre} no trae ${que}`, !m, m?.[0] ?? '');
  }
  const chico = codigo.match(/text-\[(?:\d|1[0-3])(?:\.\d+)?px\]|\btext-(?:meta|label|ui|xs|sm)\b|\bbtn-sm\b|\bnotice-unverified\b|\bnotice\b|\bchip-(?:unverified|verified|neutral)\b/);
  check(`${nombre}: nada por debajo de 14 px ni piezas de la cara vieja`, !chico, chico?.[0] ?? '');
  check(`${nombre} no pregunta con el diálogo del navegador`, !/\b(confirm|alert|prompt)\(/.test(codigo));
}

/* El catálogo cuenta y aplica la doctrina desde las funciones. */
check('el escritorio del catálogo cuenta con censoDelCatalogo', P.CatalogCurationView.includes('censoDelCatalogo('));
check('el escritorio pinta cada fila con filaDelCatalogo', P.CatalogCurationView.includes('filaDelCatalogo('));
check('el móvil pinta cada tarjeta con filaDelCatalogo', P.CatalogMobileView.includes('filaDelCatalogo('));
check('el escritorio conserva el retiro de la actuación propia, preguntado', junto(P.CatalogCurationView).includes(junto('firmActuacionesApi.eliminar(')) && P.CatalogCurationView.includes('<ConfirmarDialog'));
check('las dos pantallas guardan y revierten con el gancho', ['CatalogCurationView', 'CatalogMobileView'].every((n) => P[n].includes('curation.save') && P[n].includes('curation.revert(')));
check('el móvil revierte en la rama en que se verificó', junto(P.CatalogMobileView).includes(junto('curation.revert(id, rama)')));
check(
  'el formulario sigue guardando la rama prestada y exigiendo fuente',
  junto(P.VerificationForm).includes(junto('rama: actuacion.porRemision?.paraRama ?? null')) &&
    P.VerificationForm.includes('Sin fuente no es una verificación') &&
    junto(P.VerificationForm).includes(junto('termDescription.trim().length > 0 && sourceUrl.trim().length > 0'))
);
check('la ficha distingue el estado del término, de la norma y de la autoridad', ['estadoDelTermino(', 'estadoDeLaNorma(', 'estadoDeLaAutoridad('].every((f) => P.ActuacionDetail.includes(f)));
check('la ficha no llama «verificada» a una norma por traer URL', !/Verificada contra su texto oficial/.test(P.ActuacionDetail));

/* ─── 4. EL BLOQUE DE CSS ────────────────────────────────────────────────── */
const CSS = readFileSync(join(SRC, 'design', 'cara-nueva.css'), 'utf8');
const MARCA = '/* ─── Buscador y Catálogo ─── */';
const FIN = '/* ─── fin Buscador y Catálogo ─── */';

interface Hallazgos {
  sueltos: string[];
  ajenos: string[];
  guiones: string[];
  monos: string[];
  oros: string[];
  chicos: number[];
  dosOscuros: boolean;
}
const revisarBloque = (bloqueCrudo: string): Hallazgos => {
  const bloque = bloqueCrudo.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const h: Hallazgos = { sueltos: [], ajenos: [], guiones: [], monos: [], oros: [], chicos: [], dosOscuros: false };
  for (const m of bloque.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const cabeza = m[1].replace(/@media[^{]*\{/g, '').trim();
    const cuerpo = m[2];
    for (const sel of cabeza.split(',').map((s) => s.trim()).filter(Boolean)) {
      const bien =
        sel.startsWith('.cara-nueva') ||
        sel.startsWith(":root:not([data-theme='light']) .cara-nueva") ||
        sel.startsWith(":root[data-theme='dark'] .cara-nueva");
      if (!bien) h.sueltos.push(sel);
      if (!/cn-(bus|cat)/.test(sel)) h.ajenos.push(sel);
      if (/dashed/.test(cuerpo) && !/--sin/.test(sel)) h.guiones.push(sel);
      if (/var\(--mono\)|monospace/.test(cuerpo) && !/-(mono|cita)\b/.test(sel)) h.monos.push(sel);
      if (/--gold/.test(cuerpo)) h.oros.push(sel);
    }
  }
  h.chicos = [...bloque.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map((x) => Number(x[1])).filter((n) => n < 14);
  h.dosOscuros = bloque.includes(":root:not([data-theme='light']) .cara-nueva") && bloque.includes(":root[data-theme='dark'] .cara-nueva");
  return h;
};

const inicio = CSS.indexOf(MARCA);
const fin = CSS.indexOf(FIN);
check('cara-nueva.css tiene el bloque con su cierre', inicio !== -1 && fin > inicio);
const hallado = revisarBloque(inicio === -1 || fin === -1 ? '' : CSS.slice(inicio + MARCA.length, fin));
check('todo selector vive bajo .cara-nueva', hallado.sueltos.length === 0, hallado.sueltos.join(' · '));
check('todo selector es cn-bus o cn-cat', hallado.ajenos.length === 0, hallado.ajenos.join(' · '));
check('el discontinuo solo es de lo que no está verificado', hallado.guiones.length === 0, hallado.guiones.join(' · '));
check('el mono solo es de lo citable', hallado.monos.length === 0, hallado.monos.join(' · '));
check('el oro no aparece', hallado.oros.length === 0, hallado.oros.join(' · '));
check('ningún tamaño baja de 14 px', hallado.chicos.length === 0, hallado.chicos.join(', '));
check('el bloque trae su oscuro por los dos caminos', hallado.dosOscuros);

const bloqueLimpio = inicio === -1 || fin === -1 ? '' : CSS.slice(inicio, fin).replace(/\/\*[\s\S]*?\*\//g, ' ');
for (const clase of ['cn-bus-boton', 'cn-bus-chip', 'cn-cat-boton', 'cn-cat-chip', 'cn-cat-fila', 'cn-bus-opcion']) {
  const re = new RegExp(`\\.${clase}\\s*\\{[^}]*min-height:\\s*(4[4-9]|[5-9]\\d)px`);
  check(`.${clase} mide al menos 44 px`, re.test(bloqueLimpio));
}

/* Los paneles modales propios están bajo la vigilancia de las esquinas. */
const ESQUINAS = readFileSync(join(SRC, 'design', '__checks__', 'esquinasDeDialogos.check.ts'), 'utf8');
for (const clase of ['cn-bus-hoja', 'cn-cat-ficha-panel', 'cn-cat-hoja']) {
  check(`${clase} está en la lista de esquinas de 20 px`, ESQUINAS.includes(`clase: '${clase}'`));
}
check('el marco compartido se viste desde fuera y está vigilado', ESQUINAS.includes("'cn-cat-dialogos'"));

/* ─── 6. LA HOJA DE VERIFICACIÓN SOBRE EL TECLADO DEL TELÉFONO ──────────────
 *
 * Reportado en producción el 14 de septiembre de 2026: en el teléfono la hoja
 * «Verificar el término» quedaba tapada. Medía `92dvh`, que es la ventana de
 * diseño; el teclado solo encoge la ventana visual y cubría el pie con
 * «Guardar verificación» y el cuerpo, que ya era de 274 px en un teléfono de
 * 664 porque cabecera, resumen y pie no se desplazaban. El emulador del
 * escritorio no abre teclado: esto se vigila en el código.
 */
const sinComentariosTs = (s: string): string => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const reglaCss = (css: string, selector: string): string => {
  const escapado = selector.replace(/[.*+?^${}()|[\]\\>]/g, '\\$&').replace(/\s+/g, '\\s+');
  return new RegExp(`(?:^|[}\\s])${escapado}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';
};
const faltasDeLaHoja = (hojaTsx: string, vistaTsx: string, css: string): string[] => {
  const hoja = sinComentariosTs(hojaTsx);
  const vista = sinComentariosTs(vistaTsx);
  const faltas: string[] = [];
  if (!/<HojaSobreElTeclado\b/.test(vista) || /className="cn-cat-hoja-capa"/.test(vista))
    faltas.push('la vista del teléfono no abre la verificación en HojaSobreElTeclado');
  if (!/createPortal\(/.test(hoja) || !/document\.body/.test(hoja)) faltas.push('la hoja no se monta en document.body');
  if (!/className="cara-nueva\b/.test(hoja)) faltas.push('el portal no trae su raíz .cara-nueva (tokens y oscuro)');
  if (!/visualViewport/.test(hoja) || !/--hoja-alto/.test(hoja)) faltas.push('la hoja no sigue a visualViewport');
  if (!/scrollIntoView\(\{\s*block:\s*'center'/.test(hoja)) faltas.push('el campo enfocado no se centra sobre el teclado');
  const capa = reglaCss(css, '.cara-nueva .cn-cat-hoja-capa');
  if (!/height:\s*var\(--hoja-alto/.test(capa) || !/top:\s*var\(--hoja-arriba/.test(capa))
    faltas.push('la capa no mide la ventana visual');
  if (/\d+(d|s|l)?vh/.test(reglaCss(css, '.cara-nueva .cn-cat-hoja').replace(/var\([^)]*\)/g, '')))
    faltas.push('la hoja vuelve a medirse en vh');
  if (!/overflow-y:\s*auto/.test(reglaCss(css, '.cara-nueva .cn-cat-hoja > .cn-cat-form')))
    faltas.push('el formulario de la hoja no se desplaza entero');
  if (!/position:\s*sticky/.test(reglaCss(css, '.cara-nueva .cn-cat-hoja .cn-cat-form-pie')))
    faltas.push('el pie con «Guardar» no se pega abajo');
  return faltas;
};
const HOJA_TSX = readFileSync(join(SRC, 'modules', 'catalog', 'components', 'HojaSobreElTeclado.tsx'), 'utf8');
const VISTA_CAT_MOVIL = readFileSync(join(SRC, 'modules', 'catalog', 'components', 'CatalogMobileView.tsx'), 'utf8');
const faltasHoja = faltasDeLaHoja(HOJA_TSX, VISTA_CAT_MOVIL, bloqueLimpio);
check('la hoja de verificación queda sobre el teclado del teléfono', faltasHoja.length === 0, faltasHoja.join(' · '));

/* ─── 5. QUE MUERDA ──────────────────────────────────────────────────────── */
const muerde = (nombre: string, dejaPasar: boolean): void => check(`muerde: ${nombre}`, !dejaPasar);
muerde('un selector suelto', revisarBloque('.cn-bus-x { color: red; }').sueltos.length === 0);
muerde('un guion en una tarjeta verificada', revisarBloque('.cara-nueva .cn-cat-fila { border: 1px dashed red; }').guiones.length === 0);
muerde('un mono en un rótulo', revisarBloque('.cara-nueva .cn-bus-rotulo { font-family: var(--mono); }').monos.length === 0);
muerde('una letra de 12 px', revisarBloque('.cara-nueva .cn-bus-x { font-size: 12px; }').chicos.length === 0);
muerde('un bloque con un solo oscuro', revisarBloque(":root[data-theme='dark'] .cara-nueva .cn-bus-x { color: red; }").dosOscuros);
muerde('una tarjeta sin leer con botón de citar', sinCitar('const TarjetaSinLeer = () => (<button onClick={() => onCitar(item)}>Citar</button>)'));
muerde(
  'un filtro de corpus escrito a mano',
  (() => {
    const falso = 'const x = items.filter((i) => i.curado === true); resultadosVisibles(items)';
    return falso.includes('resultadosVisibles(') && !/curado\s*[!=]==/.test(falso);
  })()
);
muerde('un porcentaje de similitud', !/similarity\s*\*\s*100/.test('{(item.similarity * 100).toFixed(0)}%'));
muerde('una cifra del catálogo a mano', !INVENTADAS[7][1].test('883 actuaciones de 28 ramas'));
muerde('un curador de muestra', !INVENTADAS[0][1].test('Curada por C. Restrepo'));
muerde(
  'la hoja de verificación medida en 92dvh',
  faltasDeLaHoja(
    HOJA_TSX,
    VISTA_CAT_MOVIL,
    bloqueLimpio
      .replace(/height:\s*var\(--hoja-alto, 100dvh\);/, 'bottom: 0;')
      .replace(/(\.cn-cat-hoja\s*\{[^}]*?)height:\s*92%;/, '$1height: 92dvh;')
  ).length === 0
);
muerde('la hoja sin portal', faltasDeLaHoja(HOJA_TSX.replace(/createPortal\(/g, 'sinPortal('), VISTA_CAT_MOVIL, bloqueLimpio).length === 0);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
