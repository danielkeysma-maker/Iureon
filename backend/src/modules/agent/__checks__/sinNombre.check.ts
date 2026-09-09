/**
 * Fija lo que NO puede pasar cuando un escrito se redacta sin ficha y sin
 * nombre de actuación.
 *
 * Run with: npm run check:sin-nombre
 *
 * ─── LOS DOS DAÑOS QUE VIGILA ───────────────────────────────────────────────
 *
 * 1. QUE UN ESCRITO SIN FICHA SALGA AFIRMANDO ARTÍCULO, TÉRMINO O AUTORIDAD.
 *    Es el defecto característico de esta casa y ya se pagó una vez a escala:
 *    un modelo al que se le entrega una ficha vacía bajo un encabezamiento de
 *    ficha verificada no deja el artículo en blanco, lo inventa. Aquí se
 *    comprueba que las instrucciones sigan invirtiendo esa orden.
 *
 * 2. QUE EL TÍTULO DE TRABAJO SE PRESENTE COMO DENOMINACIÓN JURÍDICA. «Recurso
 *    de reposición» no es una etiqueta: es una figura con su artículo, su
 *    término y su autoridad, y bautizar así un escrito que nadie verificó
 *    afirma las tres cosas de un golpe sin escribir una sola cita. El prompt
 *    repite el nombre del encargo CUATRO veces por su cuenta, y una de esas
 *    repeticiones ordenaba que «su nombre debe leerse en el encabezado»: con un
 *    título de trabajo eso habría encabezado el escrito con la costura a la
 *    vista.
 *
 * Nada aquí llama a un modelo ni sale a la red.
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildClaudeDraftPrompt, buildClaudeUserMessage } from '../claudeDraft.prompt';
import { renderCatalogGuidance } from '../catalogGuidance';
import { actuacionPropiaComoCatalogo } from '../../catalog/firmActuaciones.validate';
import {
  PREFIJO_TITULO_DE_TRABAJO,
  esTituloDeTrabajo,
  objetivoDelTitulo,
  tituloDeTrabajo
} from '../../catalog/tituloDeTrabajo';
import type { Actuacion, LegalBranch } from '../../catalog/types';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const OBJETIVO = 'que el juez levante el embargo sobre este bien porque es inembargable';
const NOMBRE_DE_TRABAJO = tituloDeTrabajo(OBJETIVO);
const NOMBRE_PROPIO = 'Memorial de insistencia en la práctica de la prueba pericial';
const HECHOS = 'Al cliente le embargaron un bien que no puede embargarse y hay que sacarlo del embargo.';

const propia = (exactName: string): Actuacion =>
  actuacionPropiaComoCatalogo({
    id: 'firm-check',
    area: 'CIVIL' as LegalBranch,
    exactName,
    role: 'LITIGANTE',
    termStatus: 'NO_VERIFICADO',
    legalBasis: null,
    termDescription: null,
    sourceUrl: null,
    note: null,
    createdBy: 'socio@firma.co',
    createdAt: '2026-09-09T00:00:00.000Z'
  } as never);

const guiaSinNombre = renderCatalogGuidance(propia(NOMBRE_DE_TRABAJO)) as string;
const guiaConNombre = renderCatalogGuidance(propia(NOMBRE_PROPIO)) as string;

const promptSinNombre = buildClaudeDraftPrompt({
  documentType: NOMBRE_DE_TRABAJO,
  prompt: HECHOS,
  citations: [],
  catalogGuidance: guiaSinNombre
});

const promptConNombre = buildClaudeDraftPrompt({
  documentType: NOMBRE_PROPIO,
  prompt: HECHOS,
  citations: [],
  catalogGuidance: guiaConNombre
});

const mensajeSinNombre = buildClaudeUserMessage({
  documentType: NOMBRE_DE_TRABAJO,
  prompt: HECHOS,
  facts: HECHOS,
  citations: []
});

/* ─── 1. EL RÓTULO VIAJA, Y VIAJA IGUAL EN LOS DOS LADOS ───────────────────── */

check('el título de trabajo se reconoce por su marca', esTituloDeTrabajo(NOMBRE_DE_TRABAJO));
check('y el objetivo se recupera entero', objetivoDelTitulo(NOMBRE_DE_TRABAJO) === OBJETIVO);
check(
  'un nombre corriente NO se confunde con un título de trabajo',
  !esTituloDeTrabajo(NOMBRE_PROPIO)
);

/*
 * LA COPIA DEL NAVEGADOR TIENE QUE DECIR LO MISMO. El frontend no puede
 * importar del backend, así que el prefijo está escrito dos veces; el día que
 * se separen, el escrito saldría marcado y la pantalla no —o al revés—, y
 * nadie se enteraría hasta leer un borrador.
 */
const espejo = fs.readFileSync(
  path.resolve(__dirname, '../../../../../frontend/src/modules/catalog/tituloDeTrabajo.ts'),
  'utf8'
);
check(
  'la copia del frontend usa exactamente el mismo prefijo',
  espejo.includes(`export const PREFIJO_TITULO_DE_TRABAJO = '${PREFIJO_TITULO_DE_TRABAJO}';`)
);

/* ─── 2. SIN FICHA NO SE AFIRMA NI ARTÍCULO, NI TÉRMINO, NI AUTORIDAD ──────── */

for (const [nombre, guia] of [
  ['sin nombre', guiaSinNombre],
  ['con nombre propio', guiaConNombre]
] as const) {
  check(
    `${nombre}: se declara que no hay ficha verificada`,
    guia.includes('NO TIENE FICHA VERIFICADA EN EL CATÁLOGO')
  );
  check(
    `${nombre}: se prohíbe escribir números de artículo y afirmar plazos`,
    guia.includes('no escribas números de artículo') &&
      guia.includes('no afirmes plazos, términos ni caducidades')
  );
  check(
    `${nombre}: se prohíbe decir que una norma exige una sección`,
    guia.includes('no digas de ninguna sección que una norma la exige')
  );
  check(
    `${nombre}: y el propio escrito tiene que declarar el vacío donde se lea`,
    guia.includes('NO HAY TÉRMINO NI ARTÍCULO') && guia.includes('dilo donde se lea')
  );
  check(
    `${nombre}: no se le entrega ninguna autoridad competente`,
    !guia.includes('AUTORIDAD COMPETENTE')
  );
}

/*
 * UNA SOLA DOCTRINA, NO DOS. El camino sin nombre entra por el MISMO bloque que
 * la actuación escrita a mano: dos bloques que dicen lo mismo divergen, y el
 * día que alguien endurezca uno el otro se queda con la redacción vieja.
 */
const guidanceSrc = fs.readFileSync(path.resolve(__dirname, '../catalogGuidance.ts'), 'utf8');
check(
  'la declaración de «no hay ficha» se escribe UNA sola vez en el módulo',
  guidanceSrc.split('ESTA ACTUACIÓN NO TIENE FICHA VERIFICADA EN EL CATÁLOGO').length - 1 === 1
);
check(
  'y el camino sin nombre reutiliza el bloque de la actuación de la firma',
  guidanceSrc.includes('renderFirmDefinedGuidance') && guidanceSrc.includes('esTituloDeTrabajo')
);

/* ─── 3. EL TÍTULO DE TRABAJO NUNCA SE PRESENTA COMO FIGURA JURÍDICA ───────── */

check(
  'la guía dice expresamente que es un título de trabajo y no una denominación',
  guiaSinNombre.includes('TÍTULO DE TRABAJO') &&
    guiaSinNombre.includes('no la denominación jurídica de ninguna figura')
);
check(
  'y le prohíbe al motor bautizar el escrito con una figura del ordenamiento',
  guiaSinNombre.includes('Y TÚ TAMPOCO SE LO PONES')
);
check(
  'la guía con nombre propio NO arrastra esa prohibición (no le hace falta)',
  !guiaConNombre.includes('TÍTULO DE TRABAJO')
);

/*
 * LA MARCA NO SE IMPRIME EN EL ENCARGO. El prompt nombra el escrito cuatro
 * veces; si el prefijo se colara en alguna, el modelo lo copiaría al
 * encabezado y el escrito saldría titulado con la costura de la aplicación.
 */
for (const [nombre, texto] of [
  ['el encargo', promptSinNombre],
  ['el mensaje de usuario', mensajeSinNombre]
] as const) {
  check(
    `${nombre} no le enseña al motor la marca «${PREFIJO_TITULO_DE_TRABAJO.trim()}»`,
    !texto.includes(PREFIJO_TITULO_DE_TRABAJO)
  );
  check(`${nombre} sí le entrega el objetivo del abogado`, texto.includes(OBJETIVO));
}

check(
  'sin nombre, el encargo NO ordena que el nombre se lea en el encabezado',
  !promptSinNombre.includes('Su nombre debe leerse en el encabezado')
);
check(
  'sin nombre, el encargo manda escribir en el encabezado LO QUE SE PIDE',
  promptSinNombre.includes('En el encabezado y en el asunto va LO QUE SE PIDE')
);
check(
  'sin nombre, el encargo prohíbe llamarlo recurso, acción, incidente o nulidad',
  promptSinNombre.includes('NO TIENE NOMBRE DE ACTUACIÓN Y NO SE LO PONES')
);
check(
  'sin nombre, la estructura se pide del escrito que busca el objetivo',
  promptSinNombre.includes(`ESTRUCTURA DEL ESCRITO QUE BUSCA "${OBJETIVO}"`)
);

/* ─── 4. EL CAMINO DE SIEMPRE NO CAMBIÓ ────────────────────────────────────── */

check(
  'con nombre, la regla de la actuación sigue intacta',
  promptConNombre.includes('REGLA DE LA ACTUACIÓN') &&
    promptConNombre.includes('Su nombre debe leerse en el encabezado') &&
    promptConNombre.includes(`un "${NOMBRE_PROPIO}"`)
);
check(
  'con nombre, no aparece la regla del encargo sin nombre',
  !promptConNombre.includes('REGLA DEL ENCARGO')
);
check(
  'los dos siguen exigiendo títulos de sección entre dobles asteriscos',
  promptSinNombre.includes('dobles asteriscos') && promptConNombre.includes('dobles asteriscos')
);

/* ─── 5. SIGUE SIENDO CURABLE: LA FIRMA PUEDE CONVERTIRLO EN FICHA ─────────── */

const curada = actuacionPropiaComoCatalogo({
  id: 'firm-check-curada',
  area: 'CIVIL' as LegalBranch,
  exactName: NOMBRE_DE_TRABAJO,
  role: 'LITIGANTE',
  termStatus: 'VERIFICADO',
  legalBasis: 'La norma que la firma leyó y transcribió en Catálogo',
  termDescription: 'El plazo que la firma leyó en la norma',
  sourceUrl: 'https://www.suin-juriscol.gov.co/',
  note: null,
  createdBy: 'socio@firma.co',
  createdAt: '2026-09-09T00:00:00.000Z'
} as never);

const guiaCurada = renderCatalogGuidance(curada) as string;

check(
  'curado en Catálogo, lo que la firma comprobó SÍ llega al motor',
  guiaCurada.includes('LO QUE LA FIRMA SÍ COMPROBÓ') &&
    guiaCurada.includes('El plazo que la firma leyó en la norma')
);
check(
  'y aun curado sigue sin poder bautizarse como figura jurídica',
  guiaCurada.includes('Y TÚ TAMPOCO SE LO PONES')
);
check(
  'un escrito sin curar nunca recibe un término',
  !guiaSinNombre.includes('LO QUE LA FIRMA SÍ COMPROBÓ')
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
