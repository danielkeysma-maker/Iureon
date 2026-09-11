#!/usr/bin/env node
/**
 * Corre todos los checks del proyecto y da UN veredicto.
 *
 * POR QUÉ HACÍA FALTA. Había veintitrés checks y ninguna forma de correrlos
 * todos. Cada uno se invocaba a mano, así que en la práctica se corrían los que
 * uno recordaba tocar — y un check que nadie corre no protege nada, exactamente
 * igual que uno que no existe. La diferencia es que este da la sensación de que
 * sí protege.
 *
 * LOS DE RED VAN APARTE, Y ESA SEPARACIÓN ES EL DISEÑO. Varios consultan
 * relatorías y registros del Estado en vivo. Son valiosos y hay que correrlos,
 * pero no pueden decidir si la compilación pasa: una relatoría con una mala
 * tarde pondría el semáforo en rojo sin que nada esté roto, y a partir de la
 * tercera vez la gente aprende a reintentar hasta que salga verde. Ese es el
 * mismo razonamiento por el que `check:triage` separó su garantía determinista
 * de su observación sobre el modelo.
 *
 *   node scripts/run-all-checks.mjs          → los deterministas (los que gatean)
 *   node scripts/run-all-checks.mjs --todos  → también los que salen a la red
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * Checks que salen a internet. Se declaran por nombre en vez de detectarse,
 * porque adivinarlo por el contenido del archivo fallaría en silencio hacia el
 * lado peligroso: un check de red tratado como determinista pone el gate rojo
 * por causas ajenas.
 */
const CON_RED = new Set(['csj', 'consejo', 'discovery', 'ruling', 'triage', 'retrieval', 'conceptos', 'precedent', 'vigencia-red', 'glosa-red']);

/**
 * Checks que necesitan la BASE DE DATOS, y que por eso NO pueden gatear el CI.
 *
 * ─── POR QUE ESTA CATEGORIA EXISTE, Y POR QUE APARECIO TARDE ───────────────
 *
 * El 10 de septiembre de 2026 se conto cuantos checks corria el CI: 28 de 50.
 * El flujo listaba 34 pasos con nombre, uno por check, y esa lista habia
 * envejecido. Al reemplazarla por este ejecutor —que los descubre solos— el
 * CI se puso ROJO, y los seis que fallaron fueron estos.
 *
 * Y la falla resulto ser la respuesta, no el problema: NECESITAN UNA BASE
 * VIVA. Sin `SUPABASE_URL` no arrancan, y CON ella escribirian en la base de
 * PRODUCCION — que es exactamente el defecto que esta casa ya tiene
 * documentado y pendiente: la suite deja filas de prueba con usuarios
 * `@iureon.test` en la base real. Correrlos en cada empuje multiplicaria ese
 * problema por cada rama y cada reintento.
 *
 * Asi que estaban fuera del CI por una razon buena que nadie habia escrito.
 * Ahora esta escrita, y el ejecutor la conoce en vez de depender de que
 * alguien recuerde no ponerlos en una lista.
 *
 * SE SIGUEN CORRIENDO EN LOCAL con `npm test` o `test:todos`, que es donde
 * hay una base a la que se le puede escribir sin que le importe a nadie.
 */
const CON_BASE = new Set(['admin', 'billing', 'clients', 'auth', 'stored', 'names']);

/** Descarga ~600 MB de ONNX. Nunca en un run ordinario. */
const NUNCA = new Set(['embeddings']);

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const todos = Object.keys(pkg.scripts)
  .filter((s) => s.startsWith('check:'))
  .map((s) => s.slice('check:'.length))
  .filter((n) => !NUNCA.has(n));

const conRed = process.argv.includes('--todos');
/*
 * `--sin-base` es lo que corre el CI. No se invierte la regla —los de base NO
 * se omiten por defecto— porque en local la respuesta correcta es correrlos:
 * quien trabaja aqui tiene base y quiere saber si los rompio. El que se tiene
 * que acordar de pedir menos es el CI, que es un solo sitio y esta escrito.
 */
const sinBase = process.argv.includes('--sin-base');
const aCorrer = todos.filter((n) => (conRed || !CON_RED.has(n)) && !(sinBase && CON_BASE.has(n)));

console.log(
  `Corriendo ${aCorrer.length} checks${conRed ? ' (incluidos los de red)' : ' deterministas'}.` +
    (conRed ? '' : `  ${todos.filter((n) => CON_RED.has(n)).length} de red omitidos: usa --todos para incluirlos.`) +
    (sinBase ? `  ${CON_BASE.size} que escriben en la base, omitidos (--sin-base).` : '')
);
console.log('');

/*
 * LA COMPILACIÓN VA PRIMERO, y hace falta porque los checks corren con
 * `--transpile-only`.
 *
 * Eso significa que NO comprueban tipos: un check con `import.meta.url` en un
 * proyecto CommonJS pasa en verde aquí y tumba el despliegue en Vercel. Pasó
 * exactamente así. Verde en local, rojo en producción, y la causa era un
 * archivo de check — no código de producto.
 */
console.log('Compilando…');
try {
  execSync('npx tsc --noEmit', { encoding: 'utf8', stdio: 'pipe' });
  console.log('  ok    compila');
} catch (error) {
  console.log('  FALLA la compilación — los checks no se corren:');
  console.log(`${error.stdout ?? ''}${error.stderr ?? ''}`.trim());
  console.log(
    '\nUn check que no compila tumba el despliegue aunque pase en verde aquí.'
  );
  process.exitCode = 1;
  process.exit(1);
}
console.log('');

/*
 * LAS CONVENCIONES DEL REPOSITORIO TAMBIEN, porque el CI las corre y esta
 * suite no lo hacia. El guardian de secretos marco durante catorce corridas
 * un marcador de la vista previa local que aqui nadie vio, porque aqui nadie
 * lo ejecutaba. Si el CI y la suite local no miran lo mismo, la suite local
 * miente por omision.
 *
 * Son scripts de bash. En Windows corren con el bash de Git; si no hay bash,
 * se dice y se sigue — pero se dice, para que el «en verde» no lo esconda.
 */
const CONVENCIONES = ['scripts/check-secrets.sh', 'scripts/check-module-boundaries.sh'];
const raiz = new URL('../../', import.meta.url);
const convencionesFallidas = [];
for (const script of CONVENCIONES) {
  try {
    execSync(`bash ${script}`, { cwd: raiz, encoding: 'utf8', stdio: 'pipe' });
    console.log(`  ok    ${script}`);
  } catch (error) {
    const texto = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
    if (/not found|no se reconoce|ENOENT/i.test(texto) && !/Possible|Environment file|boundary/i.test(texto)) {
      console.log(`  AVISO ${script} no se pudo correr (sin bash): el CI si lo corre.`);
    } else {
      console.log(`  FALLA ${script}`);
      console.log(texto.split(String.fromCharCode(10)).map((l) => '        ' + l).join(String.fromCharCode(10)));
      convencionesFallidas.push(script);
    }
  }
}
console.log('');

const fallidos = [];
const rotos = [];

for (const nombre of aCorrer) {
  let salida = '';
  let ok = true;

  try {
    salida = execSync(`npm run --silent check:${nombre}`, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    ok = false;
    salida = `${error.stdout ?? ''}${error.stderr ?? ''}`;
  }

  /*
   * Se mira el TEXTO además del código de salida, y no es redundancia.
   *
   * Un check que imprime ALL CHECKS PASSED y sale con 127 ya pasó en este
   * proyecto: `process.exit()` con un handle de libuv a medio cerrar aborta Node
   * en Windows. CI creía el código y la persona leía el texto. Cuando los dos se
   * contradicen, lo honesto es reportarlo como roto y no elegir a cuál creerle.
   */
  /*
   * TRES BANNERS, NO UNO, Y ESO NO ES LAXITUD.
   *
   * `preguntas` y `nombre` terminan con «Todo en orden.» y `plazos` con «TODO
   * BIEN»; ninguno imprime ALL CHECKS PASSED. Con un solo patrón, los tres
   * salían marcados ROTO en cada corrida y el ejecutor terminaba en 1 estando
   * todo verde. Eso es peor que no tener ejecutor: un rojo permanente enseña a
   * leer por encima, y así fue como se empujaron tres veces con CI en rojo el
   * 9 de septiembre de 2026 sin que nadie lo notara.
   *
   * La contradicción que este código existe para cazar —texto que dice que pasó
   * con código de salida que dice que no— se sigue cazando igual: lo que cambia
   * es que ahora se reconocen las tres formas en que un check de esta casa dice
   * que pasó. Un check nuevo que invente una cuarta se marcará ROTO, que es lo
   * correcto: o usa una de estas o la añade aquí a conciencia.
   */
  const dicePaso = /ALL CHECKS PASSED|TODO BIEN|Todo en orden\./.test(salida);

  if (ok && dicePaso) {
    console.log(`  ok    ${nombre}`);
  } else if (!ok && !dicePaso) {
    console.log(`  FALLA ${nombre}`);
    fallidos.push(nombre);
  } else {
    console.log(`  ROTO  ${nombre} — el texto dice "${dicePaso ? 'pasó' : 'falló'}" y salió con ${ok ? 0 : 1}`);
    rotos.push(nombre);
  }
}

console.log('');

if (fallidos.length === 0 && rotos.length === 0 && convencionesFallidas.length === 0) {
  console.log(`${aCorrer.length}/${aCorrer.length} en verde, y las convenciones del repositorio tambien.`);
  process.exitCode = 0;
} else {
  if (convencionesFallidas.length) console.log(`FALLAN LAS CONVENCIONES: ${convencionesFallidas.join(', ')}`);
  if (fallidos.length) console.log(`FALLAN: ${fallidos.join(', ')}`);
  if (rotos.length) console.log(`SE CONTRADICEN (texto contra código de salida): ${rotos.join(', ')}`);
  if (fallidos[0] ?? rotos[0]) console.log(`\nCorre el que falle solo para ver el detalle: npm run check:${(fallidos[0] ?? rotos[0])}`);
  process.exitCode = 1;
}
