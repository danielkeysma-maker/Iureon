/**
 * Guarda la cara nueva de Orientación contra lo que la maqueta promete y el
 * producto no hace.
 *
 * Run with: npm run check:orientacion-cara
 *
 * ─── EL DEFECTO QUE VIGILA ─────────────────────────────────────────────────
 *
 * El artboard (`public/handoff/app-orientacion.html`) se dibujó con cifras y
 * controles de muestra: «Cuesta $300 de su saldo», «En las 883 actuaciones de
 * las 28 ramas», «Ordenadas por cercanía», «No se le cobró esta consulta».
 * Ninguno es verdad en el código: hay un cupo gratuito diario y después un
 * precio que fija el servidor, no existe el selector de ramas, las candidatas
 * se ordenan por el término más corto, y pasado el cupo la consulta sin
 * actuación SÍ se cobra. Copiar la maqueta al pie de la letra mete esas frases
 * en la pantalla sin que nada falle.
 *
 * Y LO QUE LA PIEL NO PUEDE TUMBAR: la raíz con su visita guiada y la clase de
 * la cara nueva, el aviso de plazo del adjunto en las dos pantallas, la
 * consulta real y el orden real.
 *
 * Se lee el componente como TEXTO y sin comentarios: los comentarios que
 * explican por qué no se dice «cercanía» contienen la palabra.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = dirname(fileURLToPath(import.meta.url));

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const sinComentarios = (codigo: string): string =>
  codigo
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const leer = (archivo: string): string => readFileSync(join(AQUI, '..', 'components', archivo), 'utf8');

const PANTALLAS = {
  'TriageView.tsx': sinComentarios(leer('TriageView.tsx')),
  'TriageMobileView.tsx': sinComentarios(leer('TriageMobileView.tsx'))
};

/* ─── 1. LA RAÍZ: VISITA GUIADA Y CARA NUEVA, EN LAS DOS ─────────────────── */
for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  check(
    `${nombre}: la raíz conserva la visita guiada y lleva la cara nueva`,
    /data-visita="vista-orientacion"\s+className="cara-nueva [^"]*"/.test(codigo)
  );
}

/* ─── 2. LAS FRASES DE LA MAQUETA QUE NO SON VERDAD ─────────────────────── */
const PROHIBIDAS: ReadonlyArray<[RegExp, string]> = [
  [/\$\s?300\b/, 'no hay precio fijo de $300: cupo diario gratis y luego el precio del servidor'],
  [/\b883\b/, 'el tamaño del catálogo se cuenta, no se escribe'],
  [/28\s+ramas/i, 'no existe el selector de ramas'],
  [/cercan[ií]a/i, 'el orden es por término más corto, no por cercanía a los hechos'],
  [/No se le cobr[oó]/i, 'pasado el cupo, la consulta sin actuación sí se cobra'],
  [/Consultas parecidas/i, 'no hay búsqueda por parecido'],
  [/Ninguna encaja/i, 'no hay acción para reportar un hueco a mano'],
  [/Poner el t[eé]rmino en la agenda/i, 'la candidata no agenda nada'],
  [/Ver la ficha completa/i, 'no hay diálogo de ficha completa'],
  [/diez y quince segundos|cuatro veces m[aá]s/i, 'tiempos y costos de muestra']
];
for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  for (const [patron, porque] of PROHIBIDAS) {
    check(`${nombre} no dice ${patron}`, !patron.test(codigo), porque);
  }
}

/* ─── 3. LO QUE LA PIEL NO PUEDE TUMBAR ─────────────────────────────────── */
for (const [nombre, codigo] of Object.entries(PANTALLAS)) {
  check(
    `${nombre} monta el aviso de plazo del adjunto`,
    /AvisoDePlazoEnElAdjunto/.test(codigo) && /adjunto\.plazo/.test(codigo)
  );
  check(`${nombre} sigue consultando al servidor`, /triageApi\.orientar\(/.test(codigo));
  check(
    `${nombre}: nada por debajo de 13 px escrito a mano`,
    !/text-\[(?:\d|1[0-2])(?:\.\d+)?px\]|\btext-meta\b/.test(codigo),
    'la escala de la cara nueva empieza en 14'
  );
}

const ESCRITORIO = PANTALLAS['TriageView.tsx'];
check('el escritorio no calcula el plazo por su cuenta', !/plazoAnunciado\(/.test(ESCRITORIO));
check('el escritorio conserva el orden por término más corto', /porTerminoMasCorto\(/.test(ESCRITORIO));
check(
  'el escritorio conserva las salidas del «sin coincidencia»',
  ['SIN_COINCIDENCIA', 'Completar los hechos', 'Redactar sin catálogo', 'Buscar en jurisprudencia'].every((t) =>
    ESCRITORIO.includes(t)
  )
);
check(
  'el escritorio conserva el historial y los huecos',
  ESCRITORIO.includes('Orientaciones de la firma ·') && ESCRITORIO.includes('Huecos del catálogo ·')
);
check(
  'la tarjeta sin verificar sigue con borde discontinuo',
  /sinVerificar \? 'cn-ori-tarjeta--sin'/.test(ESCRITORIO) &&
    /NO_VERIFICADO: '[^']*cn-ori-tarjeta--sin/.test(PANTALLAS['TriageMobileView.tsx'])
);

/* ─── 4. EL BLOQUE DE CSS NO SE SALE DE `.cara-nueva` ───────────────────── */
const CSS = readFileSync(join(AQUI, '..', '..', '..', 'design', 'cara-nueva.css'), 'utf8');
const MARCA = '/* ─── Orientación ─── */';
const inicio = CSS.indexOf(MARCA);
check('cara-nueva.css tiene el bloque de Orientación', inicio !== -1);
const bloque = CSS.slice(inicio).replace(/\/\*[\s\S]*?\*\//g, ' ');
const sueltos: string[] = [];
for (const m of bloque.matchAll(/([^{}]+)\{/g)) {
  const cabeza = m[1].trim();
  if (cabeza.startsWith('@media')) continue;
  for (const sel of cabeza.split(',').map((s) => s.trim())) {
    const bien =
      sel.startsWith('.cara-nueva') ||
      sel.startsWith(":root:not([data-theme='light']) .cara-nueva") ||
      sel.startsWith(":root[data-theme='dark'] .cara-nueva");
    if (!bien) sueltos.push(sel);
  }
}
check('todo selector del bloque vive bajo .cara-nueva', sueltos.length === 0, sueltos.join(' · '));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
