import { discoverConsejoEstadoRulings } from '../consejoEstadoRuling.service';

/**
 * El Consejo de Estado responde, y la cita corresponde a SU providencia.
 *
 * Corre con: npm run check:consejo (de red)
 *
 * ─── LA ASERCIÓN QUE IMPORTA ────────────────────────────────────────────────
 *
 * No es «devuelve resultados»: es que **el radicado que se publica sea el de la
 * providencia y no el de otra que ella cita**. La primera versión de este
 * módulo tomaba el primer radicado que apareciera en el bloque, y el extracto
 * de la relatoría CITA otras providencias —es su oficio—, así que la ficha
 * salía con la cita de una y el enlace de otra.
 *
 * Una cita que apunta a otra sentencia es indistinguible de una correcta hasta
 * que alguien la abre, y para entonces está en un escrito radicado. Se
 * comprueba cruzando los dígitos del radicado contra el `guid` de su propia URL,
 * que es el único cruce que no se puede satisfacer por casualidad.
 */

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

(async () => {
  const encontradas = await discoverConsejoEstadoRulings(
    'nulidad y restablecimiento pension de invalidez'
  );

  check(
    'SAMAI responde y devuelve providencias',
    encontradas.length > 0,
    `${encontradas.length} providencias`
  );

  if (encontradas.length === 0) {
    console.log('\n1 CHECKS FAILED');
    process.exitCode = 1;
    return;
  }

  const soloDigitos = (t: string) => t.replace(/[^0-9]/g, '');

  check(
    'la cita corresponde a SU propia providencia, no a una citada dentro',
    encontradas.every((d) => d.ruling.sourceUrl.includes(soloDigitos(d.ruling.citation))),
    encontradas.map((d) => d.ruling.citation).join(', ')
  );

  check(
    'el radicado sale con la forma citable de 23 dígitos',
    encontradas.every((d) => /^\d{5}-\d{2}-\d{2}-\d{3}-\d{4}-\d{5}-\d{2}$/.test(d.ruling.citation)),
    encontradas.map((d) => d.ruling.citation).join(', ')
  );

  check(
    'toda providencia trae ponente y fecha: sin eso no se puede citar',
    encontradas.every((d) => d.ruling.magistrado.length > 3 && d.ruling.fecha.length > 6),
    encontradas.map((d) => `${d.ruling.magistrado} · ${d.ruling.fecha}`).join(' | ')
  );

  check(
    'se archiva bajo CONSEJO_ESTADO, la misma etiqueta del corpus',
    encontradas.every((d) => d.ruling.corporacion === 'CONSEJO_ESTADO')
  );

  check(
    'trae el extracto de la relatoría, no una ficha vacía',
    encontradas.every((d) => d.ruling.text.length > 500),
    encontradas.map((d) => `${d.ruling.text.length}`).join(', ')
  );

  /* Un tema de una palabra no es un tema: no se gasta una consulta. */
  check(
    'una consulta demasiado corta no sale a la red',
    (await discoverConsejoEstadoRulings('pension')).length === 0
  );

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exitCode = fallos === 0 ? 0 : 1;
})();
