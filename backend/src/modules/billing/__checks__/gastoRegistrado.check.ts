import { readFileSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

/**
 * TODA LLAMADA AL MOTOR DEJA RASTRO EN `ai_usage`.
 *
 * ─── EL DEFECTO QUE ESTE CHECK EXISTE PARA IMPEDIR ──────────────────────────
 *
 * El 10 de septiembre de 2026 una auditoría encontró DOS caminos que llamaban
 * al motor y no registraban una sola fila:
 *
 *   · `verificarGlosa.ts` — hasta OCHO llamadas al motor barato por borrador,
 *     con el artículo entero de entrada.
 *   · `triage.service.ts` — el MENÚ ENTERO del catálogo al motor (13.183 tokens
 *     de entrada medidos sin rama), treinta veces gratis por firma y por día.
 *
 * Y no era un informe que faltara. `settleOperation` calcula el excedente
 * SUMANDO `ai_usage.cost_usd` por `operation_id`, así que el costo de cada
 * borrador quedaba subestimado en ocho llamadas: el margen que `MARKUP`
 * promete se estaba midiendo contra un costo que no era el real. El dueño lo
 * vio antes que la tabla — «no costó 40 centavos, costó casi 3 dólares porque
 * el saldo se bajó abruptamente».
 *
 * ─── POR QUÉ SE VIGILA EL CÓDIGO FUENTE Y NO EL COMPORTAMIENTO ──────────────
 *
 * Porque NO REGISTRAR COMPILA. No rompe ningún tipo, no tumba ninguna prueba y
 * no se nota en pantalla: el producto funciona igual de bien con el gasto
 * anotado que sin anotar. Lo único que cambia es que nadie sabe cuánto cuesta,
 * y eso se descubre mirando el saldo, que es tarde.
 *
 * Un tipo no puede exigir que alguien llame a `recordUsage`. Este barrido sí.
 *
 * ─── CÓMO FUNCIONA: UN CENSO, NO UNA HEURÍSTICA ─────────────────────────────
 *
 * No intenta adivinar si un archivo registra bien —eso no se puede leer con
 * expresiones regulares—. Hace algo más simple y más duro: mantiene la lista
 * de los archivos que llaman al motor y DE QUÉ MANERA llega su gasto a la
 * tabla. Si aparece uno nuevo, este check se pone rojo y obliga a decidir. La
 * decisión puede ser «éste no debe registrarse, y aquí está el porqué», pero
 * tiene que escribirse.
 *
 * Run with: npm run check:gasto
 */

const RAIZ = join(process.cwd(), 'src');

/** Cómo llega a `ai_usage` lo que gasta cada archivo que llama al motor. */
const COMO_SE_REGISTRA: Record<string, string> = {
  'modules/agent/openrouter.service.ts':
    'llama a recordUsage en las tres etapas y en el bucle de la glosa',
  'modules/agent/review/documentReview.controller.ts': 'llama a recordUsage',
  'modules/agent/review/escritoChat.controller.ts': 'llama a recordUsage',
  'modules/agent/review/preguntasAudiencia.controller.ts': 'llama a recordUsage',
  'modules/agent/adjuntos/leerAdjuntos.ts': 'llama a recordUsage',
  'modules/agent/review/verificarGlosa.ts':
    'devuelve RevisionDeGlosa.usos y lo registra openrouter.service.ts',
  'modules/catalog/triage.service.ts':
    'devuelve TriageResult.usage y lo registra triage.controller.ts',
  'modules/transcription/resumen.service.ts':
    'devuelve usage y lo registra transcription.controller.ts'
};

/** Los que SUBEN el gasto en vez de registrarlo, y quién lo registra por ellos. */
const LO_SUBE_OTRO: Record<string, string> = {
  'modules/agent/review/verificarGlosa.ts': 'modules/agent/openrouter.service.ts',
  'modules/catalog/triage.service.ts': 'modules/catalog/triage.controller.ts',
  'modules/transcription/resumen.service.ts': 'modules/transcription/transcription.controller.ts'
};

const LLAMA_AL_MOTOR = /callOpenRouter(WithUsage|Multimodal)?\s*\(/;

const archivos = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? e.name === '__checks__'
        ? []
        : archivos(join(dir, e.name))
      : e.name.endsWith('.ts')
        ? [join(dir, e.name)]
        : []
  );

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const relativo = (p: string): string => p.slice(RAIZ.length + 1).split(sep).join('/');

const llamadores = archivos(RAIZ)
  .map(relativo)
  .filter((f) => !f.startsWith('modules/agent/openrouter.client'))
  .filter((f) => LLAMA_AL_MOTOR.test(readFileSync(join(RAIZ, f), 'utf8')))
  .sort();

/* ─── 1. NINGÚN LLAMADOR NUEVO SIN DECIR CÓMO PAGA ────────────────────────── */

const sinCenso = llamadores.filter((f) => !(f in COMO_SE_REGISTRA));
check(
  'todo archivo que llama al motor está censado y dice cómo llega su gasto a ai_usage',
  sinCenso.length === 0,
  sinCenso.length > 0
    ? `SIN CENSAR: ${sinCenso.join(', ')} — añádelo a COMO_SE_REGISTRA diciendo cómo se registra, o por qué no debe registrarse`
    : `${llamadores.length} llamadores, todos censados`
);

/* ─── 2. Y EL CENSO NO ENVEJECE ───────────────────────────────────────────── */

const fantasmas = Object.keys(COMO_SE_REGISTRA).filter((f) => !llamadores.includes(f));
check(
  'y el censo no nombra archivos que ya no llaman al motor',
  fantasmas.length === 0,
  fantasmas.length > 0 ? `YA NO LLAMAN: ${fantasmas.join(', ')}` : 'sin sobrantes'
);

/* ─── 3. EL QUE REGISTRA, REGISTRA DE VERDAD ──────────────────────────────── */

/*
 * Se comprueba lo único comprobable leyendo: que el archivo NOMBRE a
 * `recordUsage`. No prueba que lo llame en el camino correcto —eso lo prueban
 * los checks de cada módulo— pero sí caza el borrado entero, que es la forma
 * en que estos dos huecos existieron: nadie quitó una línea, es que nunca se
 * escribió.
 */
for (const archivo of llamadores) {
  const quien = LO_SUBE_OTRO[archivo] ?? archivo;
  const fuente = readFileSync(join(RAIZ, quien), 'utf8');
  check(
    `${archivo} → lo registra ${quien === archivo ? 'él mismo' : quien}`,
    /recordUsage\s*\(/.test(fuente),
    COMO_SE_REGISTRA[archivo]
  );
}

/* ─── 4. LOS DOS HUECOS DE HOY, POR SU NOMBRE ─────────────────────────────── */

/*
 * Nombrados uno por uno además del barrido. El barrido caza un archivo NUEVO
 * sin registro; estos dos cazan que alguien deshaga justo el arreglo del 10 de
 * septiembre de 2026, que es un cambio de una línea y no movería el censo.
 */
const pipeline = readFileSync(join(RAIZ, 'modules/agent/openrouter.service.ts'), 'utf8');
check(
  'las hasta ocho llamadas de la GLOSA siguen registrándose (glosa.usos)',
  /glosa\.usos/.test(pipeline) && /recordUsage/.test(pipeline),
  'openrouter.service.ts recorre glosa.usos'
);

const orientacion = readFileSync(join(RAIZ, 'modules/catalog/triage.controller.ts'), 'utf8');
const enUnaLinea = orientacion.replace(/\s+/g, ' ');
check(
  'la ORIENTACIÓN sigue registrando, también la gratuita del cupo diario',
  /recordUsage\(\{[^}]*operation: 'ORIENTACION'/.test(enUnaLinea),
  'triage.controller.ts registra fuera del if (cupo.cobrar)'
);
check(
  'y lo registra ANTES de la rama del fallo: una orientación fallida se devuelve, pero ya costó',
  orientacion.indexOf('recordUsage(') < orientacion.indexOf("result.status === 'FAILED'"),
  'el registro va antes del reembolso'
);

console.log('');
/*
 * «Todo en orden.» y no una frase propia: `run-all-checks.mjs` reconoce tres
 * banners y marca ROTO al check que invente un cuarto —lo hizo con éste en su
 * primera corrida, que es justo para lo que existe esa regla—.
 */
console.log(
  fallos === 0
    ? 'Todo el gasto del motor queda registrado. Todo en orden.'
    : `${fallos} fallo(s): hay gasto del motor sin registrar.`
);
process.exit(fallos === 0 ? 0 : 1);
