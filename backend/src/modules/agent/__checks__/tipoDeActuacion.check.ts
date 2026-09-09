/**
 * Guarda dos cosas que el motor de redacción perdió a la vez, y por la misma
 * causa: que el escrito sea DEL TIPO PEDIDO y que salga CON SUS NEGRITAS.
 *
 * Run with: npm run check:tipo
 *
 * ─── DE DÓNDE SALE ESTE ARCHIVO ─────────────────────────────────────────────
 *
 * El 9 de septiembre de 2026 se midió el motor real con la misma indicación y
 * los mismos hechos, cambiando solo la ficha:
 *
 *   - catálogo con ficha .................. 80 pares de `**`, 16 títulos
 *   - actuación propia de la firma ........ 56 pares de `**`, 15 títulos
 *   - mismo nombre, sin ficha ............. 99 pares de `**`, 15 títulos
 *   - plantilla estática de respaldo ...... 0 pares de `**`, y un escrito
 *     encabezado «SEÑOR JUEZ PROCESAL DE COLOMBIA» que no es la actuación
 *     pedida
 *
 * Es decir: el modelo no omite negritas ni cambia de actuación. Lo hacían dos
 * piezas de la propia aplicación — la plantilla estática de respaldo y el
 * `documentType || 'Contestación de Demanda'` del controlador —, ambas
 * retiradas. Lo que queda por vigilar es la FORMA DEL PROMPT, que es lo que
 * sostiene el comportamiento medido, y que ninguna de las dos vuelva.
 *
 * Nada aquí llama a un modelo ni sale a la red.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildClaudeDraftPrompt } from '../claudeDraft.prompt';
import { renderCatalogGuidance } from '../catalogGuidance';
import { actuacionPropiaComoCatalogo } from '../../catalog/firmActuaciones.validate';
import { catalogService } from '../../catalog/catalog.service';
import type { Actuacion, LegalBranch } from '../../catalog/types';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const NOMBRE_PROPIO = 'Memorial de insistencia en la práctica de la prueba pericial';
const HECHOS = 'El juzgado me negó el dictamen pericial y quiero atacar esa decisión.';

const propiaSinFicha: Actuacion = actuacionPropiaComoCatalogo({
  id: 'firm-check',
  area: 'CIVIL' as LegalBranch,
  exactName: NOMBRE_PROPIO,
  role: 'LITIGANTE',
  termStatus: 'NO_VERIFICADO',
  legalBasis: null,
  termDescription: null,
  sourceUrl: null,
  note: null,
  createdBy: 'socio@firma.co',
  createdAt: '2026-09-09T00:00:00.000Z'
} as never);

const guiaPropia = renderCatalogGuidance(propiaSinFicha) as string;
const conFicha = catalogService.findByDocumentType('Recurso de reposición', 'CIVIL' as LegalBranch);
const guiaConFicha = renderCatalogGuidance(conFicha) as string;

const promptSinFicha = buildClaudeDraftPrompt({
  documentType: NOMBRE_PROPIO,
  prompt: HECHOS,
  citations: [],
  catalogGuidance: guiaPropia
});

const promptConFicha = buildClaudeDraftPrompt({
  documentType: 'Recurso de reposición',
  prompt: HECHOS,
  citations: [],
  catalogGuidance: guiaConFicha
});

const promptSinCatalogo = buildClaudeDraftPrompt({
  documentType: 'Escrito de la casa sin ficha ni catálogo',
  prompt: HECHOS,
  citations: [],
  catalogGuidance: null
});

/* ─── 1. EL TIPO PEDIDO MANDA, CON FICHA O SIN ELLA ─────────────────────────── */

check('la ficha del catálogo existe para el caso de control', Boolean(conFicha), conFicha?.exactName ?? 'no resolvió');

const CASOS = [
  { nombre: 'con ficha', prompt: promptConFicha, tipo: 'Recurso de reposición' },
  { nombre: 'sin ficha (actuación de la firma)', prompt: promptSinFicha, tipo: NOMBRE_PROPIO },
  { nombre: 'sin catálogo', prompt: promptSinCatalogo, tipo: 'Escrito de la casa sin ficha ni catálogo' }
];

for (const { nombre, prompt, tipo } of CASOS) {
  check(
    `${nombre}: el prompt exige que el documento sea EXACTAMENTE la actuación pedida`,
    prompt.includes(`tiene que ser EXACTAMENTE un "${tipo}"`)
  );
  check(
    `${nombre}: y prohíbe sustituirla por la que al modelo le parezca mejor`,
    prompt.includes('no la sustituyas por la que te parezca más apropiada')
  );
  check(
    `${nombre}: el nombre debe leerse en el encabezado o en el asunto`,
    prompt.includes('encabezado o en el asunto del escrito')
  );
}

/*
 * La estructura dejó de anunciarse como sugerencia. Decía «GUÍA DE REFERENCIA …
 * usa tu criterio jurídico para estructurar el documento como mejor
 * corresponda», dos líneas encima de un bloque titulado «ESTRUCTURA EXIGIDA POR
 * LA NORMA»: el envoltorio autorizaba a desobedecer lo que el bloque imponía.
 */
check(
  'la estructura ya no se ofrece como criterio del modelo',
  !promptConFicha.includes('usa tu criterio jurídico para estructurar') &&
    !promptSinFicha.includes('usa tu criterio jurídico para estructurar')
);
check(
  'sino como obligatoria y nombrando la actuación',
  promptConFicha.includes('ESTRUCTURA DE "Recurso de reposición" — obligatoria') &&
    promptSinFicha.includes(`ESTRUCTURA DE "${NOMBRE_PROPIO}" — obligatoria`)
);

/* ─── 2. SIN FICHA TAMBIÉN HAY ESTRUCTURA Y TÍTULOS ─────────────────────────── */

check(
  'sin ficha, el prompt manda escribir la actuación completa con sus títulos de sección',
  guiaPropia.includes('TÍTULOS DE SECCIÓN') && guiaPropia.includes(`un "${NOMBRE_PROPIO}" completo`)
);
check(
  'sin ficha, los títulos van en mayúscula sostenida y entre dobles asteriscos',
  guiaPropia.includes('mayúscula sostenida y entre **dobles asteriscos**')
);
check(
  'sin ficha, sigue prohibido inventar artículo, plazo o exigencia normativa',
  guiaPropia.includes('PROHIBIDO INVENTAR') &&
    guiaPropia.includes('no escribas números de artículo') &&
    guiaPropia.includes('no digas de ninguna sección que una norma la exige')
);
check(
  'sin ficha, el escrito declara que su término no está verificado',
  guiaPropia.includes('no está verificado y debe comprobarse en la norma antes de radicar')
);
/*
 * La instrucción vieja era «no enuncies secciones como si una norma las
 * exigiera» más «usa la estructura habitual … y no la presentes como impuesta
 * por ninguna norma», y nada más. Leídas juntas, un modelo puede concluir que lo
 * prudente es no enunciar secciones en absoluto: prosa corrida, sin títulos, y
 * por tanto sin una sola negrita en el visor de Redacción, que pinta en negrita
 * únicamente lo que viene entre `**`. La prohibición se conserva; la
 * ambigüedad, no.
 */
check(
  'la prohibición ya no puede leerse como «no pongas títulos»',
  !guiaPropia.includes('no enuncies secciones como si una norma las exigiera') &&
    guiaPropia.includes('no te autoriza a entregar un texto corrido sin títulos')
);

/* ─── 3. LA REGLA DE NEGRITAS RIGE PARA TODA ACTUACIÓN ──────────────────────── */

for (const { nombre, prompt } of CASOS) {
  check(
    `${nombre}: se exige el título de sección en su propia línea, en mayúscula y entre **`,
    prompt.includes('CADA título de sección va SOLO en su propia línea, en MAYÚSCULA SOSTENIDA y entre dobles asteriscos')
  );
  check(
    `${nombre}: y se dice expresamente que rige haya ficha o no`,
    prompt.includes('tenga o no tenga ficha verificada la actuación')
  );
}

/* ─── 4. NINGUNA PLANTILLA FABRICADA SOBREVIVE EN EL MÓDULO ─────────────────── */

const agentDir = path.resolve(__dirname, '..');
const servicio = fs.readFileSync(path.join(agentDir, 'openrouter.service.ts'), 'utf8');

check(
  'el respaldo estático que entregaba un escrito de otro tipo ya no existe',
  !fs.existsSync(path.join(agentDir, 'solemnDraft.fallback.ts')) &&
    !servicio.includes('buildSolemnColombianDraft')
);
check(
  'y cuando el motor no entrega, la redacción falla en vez de fabricar',
  servicio.includes('El motor de redacción no devolvió el escrito')
);

const controlador = fs.readFileSync(path.join(agentDir, 'agent.controller.ts'), 'utf8');
check(
  'el controlador ya no convierte una petición sin tipo en una contestación de demanda',
  !controlador.includes("documentType || 'Contestación de Demanda'") &&
    controlador.includes('MISSING_DOCUMENT_TYPE')
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
