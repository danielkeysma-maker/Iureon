/**
 * Impide que vuelva el «aprendizaje» simulado de «Enseñar estilo» y «Sugerir jerga».
 *
 * Run with: npm run check:sin-aprendizaje-falso
 *
 * ─── LO QUE HUBO, Y POR QUÉ UN CHECK Y NO SOLO EL BORRADO ──────────────────
 *
 * Hasta el 14 de septiembre de 2026 la plataforma afirmaba aprender de la firma
 * sin guardar nada: un perfil de estilo con cifras inventadas, un «aprendizaje»
 * de ediciones que era una línea en la consola, y sugerencias de jerga
 * fabricadas con aspecto de fórmula jurídica, presentadas como «aprendidas de
 * su firma». Para un abogado eso no es una maqueta: es una frase que puede
 * terminar en un escrito firmado creyendo que es la costumbre de su despacho.
 *
 * Borrarlo no basta, porque el simulacro vivía en archivos con nombres
 * razonables y una restauración desde otra rama, o un «rescate» del diálogo
 * para la versión de verdad, lo trae de vuelta entero y compila. Este barrido
 * lo nota: nombres de archivo, rutas y frases exactas del simulacro.
 *
 * Se leen los fuentes SIN COMENTARIOS: los comentarios que cuentan por qué se
 * retiró tienen que poder citar lo retirado.
 *
 * También fija dos piezas de la unidad que lo reemplaza y que no tienen otra
 * prueba: el precio de «Leer el formato» y la entrada de `estilo_lecciones`
 * en el borrado de firma.
 *
 * Nada aquí sale a la red ni toca la base.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { PRICE_COP } from '../../billing/billing.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' - ' + d : ''}`);
  if (!ok) fallos += 1;
};

const BACKEND_SRC = join(__dirname, '..', '..', '..');
const RAIZ = join(BACKEND_SRC, '..', '..');
const FRONTEND_SRC = join(RAIZ, 'frontend', 'src');
const ESTE_ARCHIVO = __filename;

const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const fuentes = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name);
    /*
     * Los `__checks__` se saltan: son los guardianes, y nombran lo prohibido
     * para exigir que falte (redaccionCara.check.ts lo hace con el diálogo).
     */
    if (e.isDirectory()) return ['node_modules', 'dist', '__checks__'].includes(e.name) ? [] : fuentes(ruta);
    return /\.(ts|tsx)$/.test(e.name) && ruta !== ESTE_ARCHIVO ? [ruta] : [];
  });

const TODOS = [...fuentes(BACKEND_SRC), ...fuentes(FRONTEND_SRC)].map((ruta) => ({
  ruta: relative(RAIZ, ruta).replace(/\\/g, '/'),
  codigo: sinComentarios(readFileSync(ruta, 'utf8'))
}));

/* ─── 1. Los archivos del simulacro no existen ─────────────────────────── */

const ARCHIVOS_RETIRADOS = [
  'backend/src/modules/agent/learning.service.ts',
  'backend/src/modules/agent/learning.controller.ts',
  'frontend/src/modules/agent/services/learning.api.ts',
  'frontend/src/modules/documents/components/JargonSuggestionModal.tsx'
];
for (const archivo of ARCHIVOS_RETIRADOS) {
  check(`no existe ${archivo}`, !existsSync(join(RAIZ, archivo)));
}

/* ─── 2. Ni sus rutas, ni sus nombres, ni sus frases, en ningún fuente ─── */

const PROHIBIDO: Array<{ que: string; patron: RegExp }> = [
  { que: 'la ruta /agent/style-profile', patron: /\/agent\/style-profile/ },
  { que: 'la ruta /agent/learn-edits', patron: /\/agent\/learn-edits/ },
  { que: 'la ruta /agent/suggest-terminology', patron: /\/agent\/suggest-terminology/ },
  { que: 'el componente JargonSuggestionModal', patron: /JargonSuggestionModal/ },
  { que: 'el cliente learningApi / learning.api', patron: /learningApi|learning\.api|learning\.(service|controller)/ },
  { que: '«18 ediciones analizadas» (perfil inventado)', patron: /ediciones analizadas/i },
  { que: '«improcedencia manifiesta» (jerga fabricada)', patron: /improcedencia manifiesta/i },
  { que: '«Aprendido de tu Firma»', patron: /Aprendido de tu Firma/i },
  { que: '«Enseñar a la IA»', patron: /Ense[nñ]ar a la IA/i }
];
for (const { que, patron } of PROHIBIDO) {
  const donde = TODOS.filter((f) => patron.test(f.codigo)).map((f) => f.ruta);
  check(`ningún fuente trae ${que}`, donde.length === 0, donde.join(', '));
}

/* ─── 3. Los dos botones siguen a la vista, apagados ───────────────────── */

const visor = TODOS.find((f) => f.ruta.endsWith('documents/components/LegalDraftViewer.tsx'))?.codigo ?? '';
check(
  '«Enseñar estilo» y «Sugerir jerga» siguen en el visor, apagados',
  visor.includes('Enseñar estilo') &&
    visor.includes('Sugerir jerga') &&
    (visor.match(/<button type="button" disabled className="cn-red-trabajar-boton">/g) ?? []).length === 2
);

/* ─── 4. Lo que lo reemplaza: precio y borrado de firma ────────────────── */

check('«Leer el formato» tiene piso de $100 (decisión del 14/09/2026)', PRICE_COP.ESTILO === 100, `$${PRICE_COP.ESTILO}`);

const migracionBorrado = readFileSync(join(RAIZ, 'supabase', 'migration-borrar-firma-estilo.sql'), 'utf8');
check(
  'el borrado de firma se lleva estilo_lecciones',
  /DELETE FROM public\.estilo_lecciones WHERE firm_id = p_firm_id/.test(migracionBorrado)
);
check(
  'y no se rompe si firm_style_profiles ya se retiró',
  /to_regclass\('public\.firm_style_profiles'\) IS NOT NULL/.test(migracionBorrado) &&
    !/^\s*DELETE FROM public\.firm_style_profiles/m.test(migracionBorrado)
);

const schema = readFileSync(join(RAIZ, 'supabase', 'schema.sql'), 'utf8');
check(
  'estilo_lecciones nace en schema.sql con RLS por firma',
  /CREATE TABLE IF NOT EXISTS public\.estilo_lecciones/.test(schema) &&
    /ALTER TABLE public\.estilo_lecciones\s+ENABLE ROW LEVEL SECURITY/.test(schema) &&
    /"tenant_isolation_estilo_lecciones"/.test(schema)
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
