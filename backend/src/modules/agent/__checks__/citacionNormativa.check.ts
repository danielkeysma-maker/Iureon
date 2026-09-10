/**
 * Guarda la REGLA DE CITACIÓN NORMATIVA, y la guarda SOBRE EL TEXTO DE SALIDA.
 *
 * Correr con: npm run check:citacion
 *
 * ─── POR QUÉ SOBRE LA SALIDA Y NO SOBRE EL PROMPT ───────────────────────────
 *
 * `precedent.check.ts` vigila la FORMA del prompt jurisprudencial, y hacía falta;
 * pero un check de forma solo puede jurar que la instrucción está escrita, y la
 * instrucción llevaba un mes escrita mientras el motor citaba veintitrés
 * artículos fuera de la ficha. Lo que decide es el papel que firma el abogado.
 * Así que el grueso de este archivo mide el cedazo (`citacionNormativa.ts`)
 * contra dos escritos: uno con los defectos EXACTOS que se midieron el 9 de
 * septiembre de 2026, y otro legítimo. Al final, y solo al final, se fijan las
 * cuatro condiciones de forma del prompt que el cedazo no puede ver.
 *
 * ─── LA LECCIÓN QUE ESTE ARCHIVO OBEDECE ────────────────────────────────────
 *
 * PRIMERA: un check escrito DESDE LA FICHA acaba certificando el defecto que
 * vigila. Si el universo autorizado de la prueba saliera de `universoCitable()`,
 * el check estaría comparando el derivador consigo mismo y pasaría en verde el
 * día que el derivador se rompa. Por eso el conjunto de abajo está ESCRITO A
 * MANO desde lo que la ficha de restitución dice —CGP arts. 82, 90, 368, 369,
 * 384 y Ley 2220 de 2022 art. 146— y el derivador se compara CONTRA él, no al
 * revés.
 *
 * SEGUNDA: la falsa alarma es peor que el silencio. Una acusación errónea en la
 * pantalla donde se decide firmar enseña a ignorar todos los avisos. Por eso el
 * escrito legítimo de abajo no es un párrafo de laboratorio: cita autorizados
 * con «ibidem» y «del mismo estatuto», mete un «(20)» entre paréntesis, trae una
 * transcripción entre comillas precedida de un verbo de contenido, y deja
 * abierta la disyuntiva de competencia. Tiene que dar CERO.
 */
import { revisarCitacionNormativa, type ReferenciaNormativa } from '../citacionNormativa';
import { andamiajeDeLaRama, universoCitable } from '../andamiaje';
import { buildCatalogGuidance, REGLA_DE_CITACION_REDACCION } from '../catalogGuidance';
import { buildClaudeDraftPrompt, buildClaudeUserMessage } from '../claudeDraft.prompt';
import { catalogService } from '../../catalog/catalog.service';
import * as fs from 'fs';
import * as path from 'path';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/*
 * ─── EL UNIVERSO AUTORIZADO, ESCRITO A MANO ────────────────────────────────
 *
 * Lo que la ficha «civil/demanda-de-restitucion-de-inmueble-arrendado» autoriza,
 * más cuatro entradas de andamiaje que el catálogo civil corrobora. Se teclea
 * aquí para que la prueba tenga un patrón de medida independiente del código que
 * mide.
 */
const AUTORIZADOS: ReferenciaNormativa[] = [
  { codigo: 'CGP', articulo: 82 },
  { codigo: 'CGP', articulo: 90 },
  { codigo: 'CGP', articulo: 368 },
  { codigo: 'CGP', articulo: 369 },
  { codigo: 'CGP', articulo: 384 },
  { codigo: 'LEY 2220 DE 2022', articulo: 146 },
  // Andamiaje civil corroborado por dos o más fichas.
  { codigo: 'CGP', articulo: 84 },
  { codigo: 'CGP', articulo: 291 },
  { codigo: 'CGP', articulo: 365 },
  { codigo: 'CGP', articulo: 590 }
];

/*
 * ─── EL ESCRITO DEFECTUOSO ─────────────────────────────────────────────────
 *
 * Frases textuales del borrador medido el 9 de septiembre de 2026 sobre
 * «Demanda de restitución de inmueble arrendado». No son inventadas para el
 * check: son las que el motor real escribió.
 */
const DEFECTUOSO = `**VIII. FUNDAMENTOS DE DERECHO**

1. En el Código Civil: artículo 1546 (condición resolutoria tácita en los contratos bilaterales); artículo 1602 (fuerza obligatoria del contrato); artículo 2000 (obligación del arrendatario de pagar el precio); artículo 2005 (obligación de restituir la cosa arrendada al terminar el contrato); artículo 2035 (terminación por mora en el pago del precio).

2. En la Ley 820 de 2003, en especial sus artículos 8, 9, 22 y 35, sobre las obligaciones del arrendatario de pagar el precio en el lugar y tiempo estipulados y de restituir el inmueble a la terminación del contrato.

3. El artículo 28 numeral 7 del Código General del Proceso establece que la competencia territorial corresponde al juez del lugar donde esté ubicado el inmueble.

4. El documento aportado presta mérito y su autenticidad se presume conforme al artículo 244 del mismo estatuto.

5. Se radicará todo en formato digital conforme a la Ley 2213 de 2022.`;

/*
 * ─── EL ESCRITO LEGÍTIMO ───────────────────────────────────────────────────
 *
 * Todo lo que cita está autorizado, y hace a propósito las cinco cosas que un
 * detector mal escrito confundiría con el defecto.
 */
const LEGITIMO = `**III. FUNDAMENTOS DE DERECHO**

La demanda reúne los requisitos generales del artículo 82 del Código General del Proceso y se acompañan los anexos del artículo 84 ibidem. El asunto se tramita por el proceso verbal, conforme a los artículos 368 y 369 del mismo estatuto, y se rige por el artículo 384 numeral 4, cuyo texto verificado en el catálogo señala que el demandado «no será oído hasta que consigne a órdenes del juzgado el valor total de los cánones y demás conceptos adeudados». La conciliación extrajudicial se agotó, por ser requisito de procedibilidad a partir del artículo 146 de la Ley 2220 de 2022, y su omisión lleva a la inadmisión del artículo 90 del Código General del Proceso.

La autoridad competente es el juez civil municipal o el del circuito del lugar del inmueble. La ficha del catálogo deja abierta esa alternativa y la elección depende de la cuantía, que debe verificarse antes de radicar; el respaldo normativo de esa competencia no está verificado en el catálogo y debe comprobarse. Se solicita la notificación personal del artículo 291 del mismo estatuto, la condena en costas del artículo 365 y las medidas cautelares del artículo 590 ibidem, dentro del término de veinte (20) días.`;

/*
 * ─── LO QUE EL CEDAZO TIENE QUE VER ────────────────────────────────────────
 */
const malo = revisarCitacionNormativa(DEFECTUOSO, AUTORIZADOS);
const clases = new Set(malo.hallazgos.map((h) => h.clase));
const fuera = malo.hallazgos
  .filter((h) => h.clase === 'CITA_FUERA_DE_LO_AUTORIZADO')
  .map((h) => `${h.referencia?.codigo}|${h.referencia?.articulo}`);

check(
  'la cita sustantiva de memoria se detecta (C. Civil art. 2005)',
  fuera.includes('CODIGO CIVIL|2005'),
  fuera.join(', ')
);

check(
  'y también el andamiaje que nadie verificó para esta ficha (CGP art. 28 y art. 244)',
  fuera.includes('CGP|28') && fuera.includes('CGP|244'),
  fuera.join(', ')
);

check(
  'la ley invocada sin artículo también es una cita (Ley 820 de 2003, Ley 2213 de 2022)',
  malo.hallazgos.filter((h) => h.clase === 'NORMA_FUERA_DE_LO_AUTORIZADO').length >= 2,
  String(malo.hallazgos.filter((h) => h.clase === 'NORMA_FUERA_DE_LO_AUTORIZADO').length)
);

check(
  'la glosa entre paréntesis se detecta («artículo 2005 (obligación de restituir…)»)',
  clases.has('GLOSA_EN_PARENTESIS'),
  ''
);

check(
  'la glosa AGREGADA se detecta («sus artículos 8, 9, 22 y 35, sobre las obligaciones…»)',
  clases.has('GLOSA_AGREGADA'),
  'la regla escrita solo contra el paréntesis se escapa por la coma'
);

check(
  'predicar el contenido se detecta («el artículo 28 … establece que…»)',
  clases.has('CONTENIDO_PREDICADO'),
  ''
);

check(
  'el efecto atribuido sin paréntesis se detecta («se presume conforme al artículo 244»)',
  clases.has('EFECTO_ATRIBUIDO'),
  ''
);

check(
  'el escrito medido queda con al menos diez citas fuera de lo verificado',
  malo.citasFueraDeLaLista >= 10,
  `citasFueraDeLaLista=${malo.citasFueraDeLaLista}`
);

/*
 * ─── Y LO QUE NO TIENE QUE VER ─────────────────────────────────────────────
 */
const bueno = revisarCitacionNormativa(LEGITIMO, AUTORIZADOS);

check(
  'el escrito legítimo no produce UN SOLO hallazgo',
  bueno.hallazgos.length === 0,
  bueno.hallazgos.map((h) => `${h.clase}: ${h.fragmento}`).join(' || ')
);

check(
  'y sí se le reconocen sus citas: no pasa limpio por no haberlas visto',
  bueno.articulosCitados >= 8,
  `articulosCitados=${bueno.articulosCitados}`
);

/*
 * ─── EL DERIVADOR SE COMPARA CONTRA LO ESCRITO A MANO ──────────────────────
 *
 * Aquí se cruza el universo que el código deriva con el que se tecleó arriba
 * desde la ficha. Si el derivador dejara de ver lo que la ficha dice, el cedazo
 * acusaría al escrito que hace lo correcto — la falsa alarma que enseña a
 * ignorar la pantalla.
 */
const restitucion = catalogService.findByDocumentType(
  'Demanda de restitución de inmueble arrendado',
  'CIVIL'
);

if (!restitucion) {
  check('la ficha de restitución existe en el catálogo', false, 'no se encontró');
} else {
  const derivado = new Set(universoCitable(restitucion).map((r) => `${r.codigo}|${r.articulo}`));
  const deLaFicha = ['CGP|82', 'CGP|90', 'CGP|368', 'CGP|369', 'CGP|384', 'LEY 2220 DE 2022|146'];
  const faltan = deLaFicha.filter((k) => !derivado.has(k));

  check(
    'el derivador ve todo lo que la ficha autoriza, incluido lo que viaja dentro del párrafo del término',
    faltan.length === 0,
    faltan.join(', ')
  );

  check(
    'y NO le regala al escrito la norma sustantiva que el modelo sacaba de memoria',
    !derivado.has('CODIGO CIVIL|2005') && !derivado.has('CODIGO CIVIL|2035'),
    ''
  );

  const andamiaje = andamiajeDeLaRama('CIVIL');
  check(
    'el andamiaje civil no está vacío y cabe en un prompt',
    andamiaje.length >= 10 && andamiaje.length <= 40,
    `${andamiaje.length} entradas`
  );

  check(
    'ninguna entrada del andamiaje llega sin rúbrica: un número pelado es una casilla que se llena',
    andamiaje.every((a) => a.rubrica.trim().length > 0 && a.fichasQueLoApoyan >= 2),
    ''
  );
}

/*
 * ─── LAS CUATRO CONDICIONES DE FORMA QUE EL CEDAZO NO PUEDE VER ────────────
 */
const guiaRedaccion =
  buildCatalogGuidance('Demanda de restitución de inmueble arrendado', 'CIVIL', 'REDACCION') ?? '';

const promptConFicha = buildClaudeDraftPrompt({
  documentType: 'Demanda de restitución de inmueble arrendado',
  prompt: 'restitución por mora en el pago del canon',
  citations: [],
  catalogGuidance: guiaRedaccion
});

const promptSinFicha = buildClaudeDraftPrompt({
  documentType: 'Acción de tutela',
  prompt: 'a mi cliente le negaron una cirugía autorizada',
  citations: [],
  catalogGuidance: null
});

/* Recorrido a mano: `readdirSync({recursive:true})` y `parentPath` piden un Node
 * más nuevo que el que corre el CI, y un check que no arranca no vigila nada. */
const fuentesDelMotor = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const completo = path.join(dir, e.name);
    if (e.isDirectory()) return fuentesDelMotor(completo);
    return e.name.endsWith('.ts') ? [completo] : [];
  });

const conLaPuertaAbierta = fuentesDelMotor(path.resolve(__dirname, '..')).filter(
  (f) =>
    !f.endsWith('citacionNormativa.check.ts') &&
    /conozcas con certeza/.test(fs.readFileSync(f, 'utf8'))
);

check(
  'la cláusula «y aquellos que conozcas con certeza» ya no existe en el motor',
  conLaPuertaAbierta.length === 0,
  conLaPuertaAbierta.join(', ')
);

check(
  'con ficha verificada, la línea NORMATIVIDAD no se emite: era la orden anterior que nombraba el C. Civil',
  !/NORMATIVIDAD: Cita artículos pertinentes/.test(promptConFicha),
  ''
);

check(
  'sin ficha ni bloque que reclame precedencia, la línea sigue saliendo',
  /NORMATIVIDAD: Cita artículos pertinentes/.test(promptSinFicha),
  'quitarla allí dejaría el escrito sin ninguna orden de fundamentar'
);

check(
  'la regla de citación sale del rótulo ESTRUCTURA y se emite dos veces en el prompt de sistema',
  promptConFicha.split('REGLA DE CITACIÓN NORMATIVA').length - 1 >= 2,
  ''
);

const mensajeConFicha = buildClaudeUserMessage({
  documentType: 'Demanda de restitución de inmueble arrendado',
  prompt: 'restitución por mora en el pago del canon',
  facts: 'Arrendatario en mora de cuatro cánones.',
  citations: [],
  catalogGuidance: guiaRedaccion
});

check(
  'y el mensaje de usuario la arrastra, igual que la jurisprudencial desde agosto',
  mensajeConFicha.includes(REGLA_DE_CITACION_REDACCION),
  ''
);

check(
  'la regla cerrada NO viaja a revisión, chat ni preguntas de audiencia',
  !(buildCatalogGuidance('Demanda de restitución de inmueble arrendado', 'CIVIL') ?? '').includes(
    'LA LISTA ES CERRADA'
  ),
  'cerrar la lista allí volvería inútil señalar lo que a un escrito ajeno le falta'
);

check(
  'pero la revisión sí pierde el permiso de afirmar qué dice un artículo',
  /AFIRMAR QUÉ DICE/.test(
    buildCatalogGuidance('Demanda de restitución de inmueble arrendado', 'CIVIL') ?? ''
  ),
  ''
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
