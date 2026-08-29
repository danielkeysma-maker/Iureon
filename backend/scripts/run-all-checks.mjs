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
const CON_RED = new Set(['csj', 'consejo', 'discovery', 'ruling', 'triage', 'retrieval', 'conceptos', 'precedent']);

/** Descarga ~600 MB de ONNX. Nunca en un run ordinario. */
const NUNCA = new Set(['embeddings']);

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const todos = Object.keys(pkg.scripts)
  .filter((s) => s.startsWith('check:'))
  .map((s) => s.slice('check:'.length))
  .filter((n) => !NUNCA.has(n));

const conRed = process.argv.includes('--todos');
const aCorrer = todos.filter((n) => conRed || !CON_RED.has(n));

console.log(
  `Corriendo ${aCorrer.length} checks${conRed ? ' (incluidos los de red)' : ' deterministas'}.` +
    (conRed ? '' : `  ${todos.length - aCorrer.length} de red omitidos: usa --todos para incluirlos.`)
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
  const dicePaso = /ALL CHECKS PASSED/.test(salida);

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

if (fallidos.length === 0 && rotos.length === 0) {
  console.log(`${aCorrer.length}/${aCorrer.length} en verde.`);
  process.exitCode = 0;
} else {
  if (fallidos.length) console.log(`FALLAN: ${fallidos.join(', ')}`);
  if (rotos.length) console.log(`SE CONTRADICEN (texto contra código de salida): ${rotos.join(', ')}`);
  console.log(`\nCorre el que falle solo para ver el detalle: npm run check:${(fallidos[0] ?? rotos[0])}`);
  process.exitCode = 1;
}
