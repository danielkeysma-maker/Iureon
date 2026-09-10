import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * La rama que viaja es la de la CANDIDATA, no la del selector.
 *
 * ─── EL DEFECTO QUE ESTE CHECK EXISTE PARA IMPEDIR ──────────────────────────
 *
 * `GuiaEligeActuacionDialog` entrega dos cosas al elegir: el nombre exacto de la
 * actuación y LA RAMA de donde salió. Desde que la guía puede buscar en todo el
 * catálogo, esa rama puede no ser la que el abogado escogió al principio.
 *
 * Tres sitios se quedaban solo con el nombre. Lo que pasaba en la revisión: la
 * petición viajaba con la rama vieja, el servidor buscaba la ficha SOLO dentro
 * de ella, no la encontraba, y el informe salía «sin ficha verificada» — YA
 * COBRADO. En Redacción es peor de otra forma: un mismo rótulo tiene plazos
 * distintos en dos ramas, así que se habría redactado contra la ficha de otra.
 *
 * ─── POR QUÉ SE VIGILA EL CÓDIGO FUENTE Y NO EL COMPORTAMIENTO ──────────────
 *
 * Porque el segundo parámetro es OPCIONAL de hecho: ignorarlo compila, no rompe
 * ninguna prueba y no se nota hasta que alguien paga por una revisión sin ficha.
 * Un tipo no puede exigir que un argumento se use. Este barrido sí.
 */

/*
 * Desde `process.cwd()`, que es `frontend/` cuando lo corre npm, y no desde
 * `__dirname`: el guard se empaqueta con esbuild a node_modules/.cache y allí
 * `__dirname` apunta a otra parte.
 */
const RAIZ = join(process.cwd(), 'src');

const archivos = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? archivos(join(dir, e.name)) : e.name.endsWith('.tsx') ? [join(dir, e.name)] : []
  );

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/*
 * Se toma el cuerpo del manejador desde `onElegir=` hasta su cierre, contando
 * llaves: buscar en un rango fijo de líneas dejaría pasar un manejador largo.
 */
const cuerposDeOnElegir = (fuente: string): string[] => {
  const trozos: string[] = [];
  let i = fuente.indexOf('onElegir={');
  while (i !== -1) {
    let nivel = 0;
    let j = i + 'onElegir='.length;
    const inicio = j;
    do {
      if (fuente[j] === '{') nivel++;
      else if (fuente[j] === '}') nivel--;
      j++;
    } while (nivel > 0 && j < fuente.length);
    trozos.push(fuente.slice(inicio, j));
    i = fuente.indexOf('onElegir={', j);
  }
  return trozos;
};

const conGuia = archivos(join(RAIZ, 'modules')).filter((f) =>
  readFileSync(f, 'utf8').includes('<GuiaEligeActuacionDialog')
);

check('alguien monta la guía de actuaciones, o este barrido no vigila nada', conGuia.length > 0, `${conGuia.length} archivos`);

for (const f of conGuia) {
  const nombre = f.split(/[\/]/).pop() as string;
  const cuerpos = cuerposDeOnElegir(readFileSync(f, 'utf8'));
  check(`${nombre} declara un manejador de onElegir`, cuerpos.length > 0);
  for (const cuerpo of cuerpos) {
    check(
      `${nombre} recibe la rama de la candidata`,
      /\(\s*exactName\s*,\s*\w+\s*\)/.test(cuerpo),
      cuerpo.slice(0, 48).replace(/\s+/g, ' ')
    );
    /*
     * No basta con recibirla: hay que USARLA. La firma con dos parámetros y el
     * cuerpo ignorando el segundo es exactamente el defecto, con mejor cara.
     */
    const segundo = cuerpo.match(/\(\s*exactName\s*,\s*(\w+)\s*\)/)?.[1];
    check(
      `${nombre} usa esa rama y no solo la recibe`,
      /*
       * Se CUENTAN las apariciones en vez de buscar con un limite de palabra
       * dentro de una plantilla: alli la secuencia de escape no es un limite
       * de palabra sino el caracter de retroceso, y el guard daba cuatro
       * falsas alarmas sobre codigo correcto. Una aparicion es la
       * declaracion; para que este usada hace falta al menos una segunda.
       */
      Boolean(segundo) && cuerpo.split(segundo as string).length - 1 >= 2,
      segundo ?? 'sin segundo parámetro'
    );
  }
}

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
