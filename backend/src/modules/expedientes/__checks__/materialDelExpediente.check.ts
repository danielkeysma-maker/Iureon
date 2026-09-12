/**
 * GUARDA DEL MATERIAL DEL EXPEDIENTE.
 *
 * Run with: npm run check:material-expediente
 *
 * ─── LO QUE SE JUEGA ───────────────────────────────────────────────────────
 *
 * Este bloque le lleva al motor párrafos de documentos reales del caso. Tres
 * formas de que salga mal, y ninguna falla a la vista:
 *
 *  1. QUE SE CUELE LO QUE NO ES DEL CASO. La RPC devuelve también el corpus
 *     compartido (`SYSTEM_CORPUS`) por la misma puerta. Si eso entra al bloque,
 *     el escrito del cliente se redacta con párrafos de una sentencia ajena
 *     presentados como hechos suyos.
 *
 *  2. QUE EL PASAJE SE LEA COMO FUENTE DE DERECHO. Un memorial del expediente
 *     cita artículos, y algunos ya no rigen. El catálogo existe precisamente
 *     para que la norma no salga de la memoria de nadie; un pasaje sin
 *     advertencia la devuelve por la puerta de atrás.
 *
 *  3. QUE LA BÚSQUEDA TUMBE EL BORRADOR. El abogado pagó por un escrito, no por
 *     un buscador. Sin proveedor, sin índice o con la red caída, esto devuelve
 *     vacío y el escrito se redacta como antes.
 *
 * ─── Y UNA CUARTA, QUE YA PASÓ UNA VEZ ─────────────────────────────────────
 *
 * Que el bloque llegue a UNA sola etapa. Ya está documentado con los adjuntos:
 * un dato que Gemini lee y Opus no ve vuelve a salir como marcador. Por eso el
 * último apartado lee el código del pipeline y exige que las tres etapas lo
 * reciban.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ENCABEZADO_DEL_EXPEDIENTE,
  FRAGMENTOS_DEL_EXPEDIENTE,
  buscarPasajesDelExpediente,
  renderBloqueExpediente,
  traerMaterialDelExpediente
} from '../materialDelExpediente';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

/* ─── 1. EL BLOQUE VACÍO NO EXISTE ───────────────────────────────────────── */
/*
 * Un encabezado sin pasajes debajo le anuncia al motor un material que no
 * llegó, y un modelo servicial rellena lo que se le anuncia.
 */

check('sin pasajes no hay bloque', renderBloqueExpediente([]) === '');
check(
  'un pasaje en blanco no fabrica un bloque',
  renderBloqueExpediente([{ archivo: 'demanda.pdf', texto: '   \n  ' }]) === '',
  'un fragmento vacío en la base bastaría para anunciar material inexistente'
);

/* ─── 2. LO QUE EL ENCABEZADO TIENE QUE DECIR ────────────────────────────── */

const bloque = renderBloqueExpediente([
  { archivo: 'demanda.pdf', texto: 'El radicado es 11001-31-03-005-2024-00123-00.' },
  { archivo: null, texto: 'Notificado por estado el 3 de marzo.' }
]);

check(
  'el bloque dice que los pasajes NO son fuente de derecho',
  /NO LOS USES como fuente de derecho/.test(bloque),
  'sin esto el motor cita como norma un artículo leído de pasada en un memorial'
);
check(
  'y prohíbe expresamente citarlos como norma o como jurisprudencia',
  /no cites un pasaje como norma ni como jurisprudencia/.test(bloque)
);
check(
  'el abogado le gana al pasaje cuando se contradicen',
  /prevalece el abogado/.test(bloque),
  'un pasaje viejo puede estar superado por una actuación posterior que solo el abogado conoce'
);
check(
  'el dato que falta sigue saliendo como marcador',
  /\[•\]/.test(bloque),
  'sin esta línea el motor inventaría lo que el expediente no dice'
);
check(
  'dice que los escogió un buscador, no el abogado',
  /no los escogió el abogado/.test(bloque),
  'es la diferencia con un adjunto, y de ella depende cuánto crédito les da el motor'
);
check('el encabezado del bloque es el exportado', bloque.startsWith(ENCABEZADO_DEL_EXPEDIENTE));

/* ─── 3. CADA PASAJE DICE DE DÓNDE SALIÓ ─────────────────────────────────── */

check('el pasaje viene rotulado con su archivo', bloque.includes('(demanda.pdf)'));
check(
  'un pasaje sin nombre de archivo no queda anónimo del todo',
  bloque.includes('(documento del caso)'),
  'un `(null)` en el prompt es ruido que el motor puede leer como dato'
);
check('los pasajes van numerados', bloque.includes('[1] ') && bloque.includes('[2] '));
check('y el texto del pasaje llega entero', bloque.includes('11001-31-03-005-2024-00123-00'));

/* ─── 4. SIN EXPEDIENTE NO SE BUSCA ──────────────────────────────────────── */
/*
 * No es una optimización: sin `expedienteId` la RPC busca en TODA la firma, así
 * que un escrito suelto traería párrafos de los casos de los demás clientes.
 * Se corta aquí, antes de llamar.
 */

const sinExpediente = async (): Promise<void> => {
  check('sin expediente no se busca nada', (await buscarPasajesDelExpediente('firm-1', null, 'lo que sea')).length === 0);
  check('con expediente vacío tampoco', (await buscarPasajesDelExpediente('firm-1', '', 'lo que sea')).length === 0);
  check(
    'con consulta en blanco tampoco',
    (await buscarPasajesDelExpediente('firm-1', 'exp-1', '   ')).length === 0,
    'buscar la cadena vacía devuelve lo primero que haya, que no se parece a nada'
  );
  check(
    'y sin nada de eso no hay bloque',
    (await traerMaterialDelExpediente('firm-1', null, 'lo que sea')) === undefined
  );
};

/* ─── 5. LA BÚSQUEDA NO PUEDE TUMBAR EL ESCRITO ──────────────────────────── */
/*
 * Se sustituye el buscador por uno que lanza. Es la única forma de probar la
 * promesa que el comentario hace: «nunca tumba nada».
 */

const noTumba = async (): Promise<void> => {
  const servicio = require('../../search/vectorSearch.service').vectorSearchService;
  const original = servicio.search;

  servicio.search = async (): Promise<never> => {
    throw new Error('el proveedor de embeddings no respondió');
  };
  try {
    check(
      'si el buscador lanza, el escrito sigue sin bloque',
      (await traerMaterialDelExpediente('firm-1', 'exp-1', 'contrato de arrendamiento')) === undefined
    );
  } finally {
    servicio.search = original;
  }

  /* ─── 6. EL CORPUS COMPARTIDO NO ENTRA COMO SI FUERA DEL CASO ─────────── */
  servicio.search = async () => ({
    status: 'OK',
    matches: [
      { documentId: 'd1', firmId: 'firm-1', contentChunk: 'hecho del caso', similarity: 0.9, branch: null, fileName: 'demanda.pdf', metadata: null },
      { documentId: 'd2', firmId: 'SYSTEM_CORPUS', contentChunk: 'considerando de la Corte', similarity: 0.88, branch: null, fileName: 'C-590-05.doc', metadata: null }
    ]
  });
  try {
    const pasajes = await buscarPasajesDelExpediente('firm-1', 'exp-1', 'tutela contra providencia');
    check(
      'el corpus compartido se queda fuera del bloque del caso',
      pasajes.length === 1 && pasajes[0].archivo === 'demanda.pdf',
      'la jurisprudencia entra por su propia puerta, verificada; aquí sería un hecho del caso'
    );
  } finally {
    servicio.search = original;
  }

  /* ─── 7. Y LA CERCA VIAJA HASTA LA RPC ────────────────────────────────── */
  let recibido: unknown[] = [];
  servicio.search = async (...args: unknown[]) => {
    recibido = args;
    return { status: 'OK', matches: [] };
  };
  try {
    await buscarPasajesDelExpediente('firm-9', 'exp-7', 'lo que pidió el abogado');
    check(
      'la firma y el expediente llegan al buscador',
      recibido[0] === 'firm-9' && recibido[3] === 'exp-7',
      'sin el cuarto argumento la búsqueda abarca toda la firma'
    );
    check(
      'y se piden los fragmentos acordados',
      recibido[2] === FRAGMENTOS_DEL_EXPEDIENTE,
      'traer treinta convertiría el escrito en un resumen del expediente'
    );
  } finally {
    servicio.search = original;
  }
};

/* ─── 8. EL BLOQUE LLEGA A LAS TRES ETAPAS ───────────────────────────────── */
/*
 * El defecto que esto vigila ya ocurrió con los adjuntos y está escrito en su
 * propio comentario: pasar el bloque a una sola etapa es «el atajo tentador», y
 * es cómo un dato que Gemini leyó vuelve a salir de Opus como marcador.
 */

const raiz = join(__dirname, '..', '..', 'agent');
const servicio = readFileSync(join(raiz, 'openrouter.service.ts'), 'utf8');
const prompt = readFileSync(join(raiz, 'claudeDraft.prompt.ts'), 'utf8');

const veces = (texto: string, aguja: RegExp): number => (texto.match(aguja) ?? []).length;

check(
  'las tres etapas del pipeline reciben el bloque',
  veces(servicio, /req\.bloqueExpediente/g) >= 4,
  `aparece ${veces(servicio, /req\.bloqueExpediente/g)} vez/veces: hechos, esquema, y las dos mitades del encargo de Opus`
);
check(
  'el redactor recibe una regla propia para el expediente',
  /REGLA DEL EXPEDIENTE/.test(prompt) && /\$\{reglaExpediente\}/.test(prompt),
  'sin ella el modelo trata un pasaje recuperado igual que un archivo que el abogado escogió'
);
check(
  'la regla del expediente no reemplazó a la de los adjuntos',
  /REGLA DE LOS ADJUNTOS/.test(prompt) && /\$\{reglaAdjuntos\}/.test(prompt),
  'son dos procedencias distintas y cada una necesita la suya'
);
check(
  'el bloque va en el encargo, en sus dos ramas',
  veces(prompt, /\$\{expedienteBlock\}/g) === 2,
  'la rama de continuación es la que se olvida, y es la que más veces se usa'
);

/* ─── 9. REVISIÓN: EL COTEJO SÍ, EL DOCUMENTO RECIBIDO NO ────────────────── */
/*
 * ESTA ES LA COMPROBACIÓN DOCTRINAL DE ESTE ARCHIVO, y la única que protege una
 * regla escrita en otro sitio.
 *
 * El informe del documento recibido se rige por una regla que manda sobre todas
 * las demás: SOLO PUEDE AFIRMAR LO QUE ESTÁ ESCRITO EN EL DOCUMENTO, porque no
 * hay ficha ni fuente distinta del texto que llegó. Meterle pasajes del
 * expediente la contradice de frente: el informe afirmaría cosas que el auto no
 * dice con la misma voz con la que dice lo que sí dice, y el abogado no tendría
 * cómo distinguirlas.
 *
 * Es un cambio de una línea —quitar el `esRecibido ?`— que nada haría fallar y
 * que se sentiría como una mejora. Por eso hay una guarda.
 */

const revision = readFileSync(join(__dirname, '..', '..', 'agent', 'review', 'documentReview.controller.ts'), 'utf8');
const promptRevision = readFileSync(join(__dirname, '..', '..', 'agent', 'review', 'documentReview.ts'), 'utf8');

check(
  'la revisión de escrito propio trae los pasajes del caso',
  /traerMaterialDelExpediente\(firmId, expedienteId/.test(revision),
  'sin ellos nadie coteja el radicado ni el nombre de las partes contra el proceso'
);
check(
  'y el documento recibido NO los recibe',
  /esRecibido[\s\S]{0,20}\?\s*undefined/.test(revision),
  'su prompt solo puede afirmar lo que el documento dice; un pasaje del expediente lo contradice'
);
check(
  'al revisor se le pide señalar la discrepancia, no resolverla',
  /NO afirmes cuál de los dos es el correcto/.test(promptRevision),
  'un pasaje puede estar superado por una actuación que solo el abogado conoce'
);
check(
  'y tampoco ahí el pasaje es fuente de derecho',
  /Los pasajes NO son fuente de derecho/.test(promptRevision),
  'el respaldo normativo de la revisión es la ficha verificada'
);
check(
  'el bloque del cotejo llega al encargo',
  /\$\{delExpediente\}/.test(promptRevision),
  'definirlo y no emitirlo es cómo un bloque existe en el código y no en el prompt'
);

void (async () => {
  await sinExpediente();
  await noTumba();

  console.log('');
  if (fallos > 0) {
    console.log(`${fallos} comprobación(es) no pasaron.`);
    process.exitCode = 1;
  } else {
    console.log('TODO BIEN — el caso llega al escrito, cercado y sin pasar por norma.');
  }
})();
