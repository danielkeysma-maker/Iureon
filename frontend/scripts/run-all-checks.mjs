#!/usr/bin/env node
/**
 * Corre todos los checks del frontend y da UN veredicto.
 *
 * ─── POR QUÉ EXISTE, Y ES LA SEGUNDA VEZ ───────────────────────────────────
 *
 * El 10 de septiembre de 2026 se contó cuántos checks del BACKEND corría el
 * CI: 28 de 50. El flujo listaba los pasos con nombre, uno por check, y esa
 * lista había envejecido sin que nadie lo notara — un check que el CI no corre
 * no protege nada, exactamente igual que uno que no existe, con el agravante
 * de que parece que sí.
 *
 * Se arregló con un ejecutor que los DESCUBRE, y el frontend se quedó con su
 * lista a mano: doce `npm run check:...` encadenados con `&&` en un renglón.
 * Al añadir el decimotercero —el aviso de plazo de Orientación— habría entrado
 * en el repositorio verde y fuera del CI. El mismo defecto, esperando.
 *
 * ─── AQUÍ NO HAY CATEGORÍAS, Y ESO TAMBIÉN ES UNA DECISIÓN ─────────────────
 *
 * El ejecutor del backend separa los que salen a la red y los que necesitan
 * base de datos, porque los tiene. Estos son todos deterministas: leen código
 * fuente y funciones puras, sin red y sin base. El día que alguien escriba uno
 * que salga a internet, este archivo necesita una categoría — y el comentario
 * está aquí para que no la resuelva encadenando otro `&&` en el flujo.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const checks = Object.keys(pkg.scripts)
  .filter((s) => s.startsWith('check:'))
  .map((s) => s.slice('check:'.length))
  .sort();

console.log(`Corriendo ${checks.length} checks del frontend.`);
console.log('');

const fallidos = [];
for (const nombre of checks) {
  try {
    execSync(`npm run --silent check:${nombre}`, { stdio: 'pipe', encoding: 'utf8' });
    console.log(`  ok    ${nombre}`);
  } catch (err) {
    fallidos.push(nombre);
    console.log(`  FALLA ${nombre}`);
    /*
     * La salida del que falla se imprime ENTERA. Un ejecutor que solo diga
     * «falló marcas» obliga a volver a correrlo a mano para saber qué pasó, y
     * en el CI eso significa leer un registro que no dice nada.
     */
    const salida = `${err.stdout ?? ''}${err.stderr ?? ''}`.trimEnd();
    if (salida) console.log(salida.split('\n').map((l) => `        ${l}`).join('\n'));
  }
}

console.log('');
if (fallidos.length > 0) {
  console.log(`${fallidos.length} de ${checks.length} no pasaron: ${fallidos.join(', ')}`);
  process.exit(1);
}
console.log(`${checks.length}/${checks.length} en verde.`);
