/**
 * GUARDA DEL REEMPLAZO LIMPIO. Run with: npm run check:reemplazo-limpio
 *
 * ─── EL DEFECTO ────────────────────────────────────────────────────────────
 *
 * Las comprobaciones automáticas de vigencia y de glosa del backend escribían
 * sus corchetes de advertencia también dentro de `correccionesTextuales.reemplazo`,
 * y «Aplicar reemplazo» pega ese texto tal cual en el escrito del abogado. El
 * backend ya no lo hace, pero los informes GUARDADOS antes siguen trayendo el
 * reemplazo marcado. Esta guarda prueba que, antes de pegar, se quitan esas
 * marcas —y solo esas— y que el aviso no se pierde: vuelve aparte para mostrarse.
 *
 * Las marcas de abajo se construyen con las MISMAS plantillas de
 * backend/src/modules/agent/review/vigenciaDelInforme.ts y glosaDelInforme.ts.
 * Si allá cambia una apertura o un cierre, esta guarda tiene que cambiar con él.
 */
import { aplicarReemplazo, reemplazoParaPegar } from '../services/marcas';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* Plantillas copiadas del backend, con el detalle como texto libre. */
const derogada = (detalle: string): string =>
  `[NORMA DEROGADA — este artículo NO está vigente: ${detalle}. La revisión lo nombró de todos modos; no se apoye en él.]`;
const modulada = (detalle: string): string =>
  `[NORMA VIGENTE PERO MODULADA POR LA CORTE — rige, pero su texto publicado no es el que rige: ${detalle} Léalo en la sentencia antes de usarlo.]`;
const discrepante = (detalle: string): string =>
  `[LAS FUENTES OFICIALES NO COINCIDEN sobre este artículo — ${detalle} Esta casa no elige: compruébelo usted.]`;
const glosa = (extracto: string, motivo: string): string =>
  `[LO QUE ESTA REVISIÓN AFIRMA NO LO DICE ESE ARTÍCULO — el texto oficial dice: «${extracto}». ${motivo} No se apoye en este punto sin leer la norma.]`;

/* El backend inserta « » + marca justo después del número del artículo. */
const LIMPIO = 'con fundamento en el artículo 2035 del Código Civil y en el artículo 384 del CGP';

/* ─── 1. CADA UNA DE LAS CUATRO MARCAS SE QUITA, CON SU ESPACIO ─────────── */

const m1 = derogada('Artículo derogado por el artículo 43 de la Ley 820 de 2003');
const r1 = reemplazoParaPegar(`con fundamento en el artículo 2035 ${m1} del Código Civil y en el artículo 384 del CGP`);
check('la marca de norma derogada se quita y el texto queda exacto', r1.texto === LIMPIO, r1.texto);
check('y el aviso quitado vuelve aparte, entero', r1.avisos.length === 1 && r1.avisos[0] === m1, JSON.stringify(r1.avisos));

const m2 = modulada('Nota del artículo: «Aparte subrayado CONDICIONALMENTE exequible» [C-123/05].');
const r2 = reemplazoParaPegar(`con fundamento en el artículo 2035 ${m2} del Código Civil y en el artículo 384 del CGP`);
check('la marca de norma modulada se quita aunque el detalle traiga «» y un ]', r2.texto === LIMPIO && r2.avisos[0] === m2, r2.texto);

const m3 = discrepante('El Senado lo da por VIGENTE] y Función Pública por DEROGADO.');
const r3 = reemplazoParaPegar(`con fundamento en el artículo 2035 ${m3} del Código Civil y en el artículo 384 del CGP`);
check('la marca de discrepancia se quita aunque el detalle cierre un corchete antes de tiempo', r3.texto === LIMPIO && r3.avisos[0] === m3, r3.texto);

const m4 = glosa('Son obligaciones del arrendador, las siguientes: [...] 1. Entregar', 'El artículo regula al arrendador]. No al arrendatario.');
const r4 = reemplazoParaPegar(`con fundamento en el artículo 2035 del Código Civil y en el artículo 384 ${m4} del CGP`);
check('la marca de glosa se quita aunque el extracto y el motivo traigan [ ] y «»', r4.texto === LIMPIO && r4.avisos[0] === m4, r4.texto);

/* ─── 2. VARIAS MARCAS, Y UNA DENTRO DE OTRA ────────────────────────────── */

const r5 = reemplazoParaPegar(`con fundamento en el artículo 2035 ${m1} ${m4} del Código Civil y en el artículo 384 ${m3} del CGP`);
check('varias marcas en el mismo reemplazo se quitan todas', r5.texto === LIMPIO && r5.avisos.length === 3, `${r5.texto} | ${r5.avisos.length}`);

/*
 * La glosa corre sobre el informe ya marcado por la vigencia, y la marca de
 * vigencia contiene «el artículo 43»: si la glosa hubiera juzgado el 43, su
 * marca cae DENTRO de la otra. Se quitan las dos sin dejar restos.
 */
const anidada = derogada(`Artículo derogado por el artículo 43 ${m4} de la Ley 820 de 2003`);
const r6 = reemplazoParaPegar(`con fundamento en el artículo 2035 ${anidada} del Código Civil y en el artículo 384 del CGP`);
check('una marca dentro de otra se quita entera', r6.texto === LIMPIO, r6.texto);

/* ─── 3. LO QUE NO ES MARCA NO SE TOCA ──────────────────────────────────── */

check('un reemplazo sin marcas sale idéntico y sin avisos', reemplazoParaPegar(LIMPIO).texto === LIMPIO && reemplazoParaPegar(LIMPIO).avisos.length === 0);

const conCorchetes = 'solicito [de manera subsidiaria] se ordene «lo pertinente» [NORMA INTERNA] conforme al [art. 384]';
check('un texto que solo tiene corchetes propios sale idéntico', reemplazoParaPegar(conCorchetes).texto === conCorchetes, reemplazoParaPegar(conCorchetes).texto);

const aperturaSinCierre = 'solicito [NORMA DEROGADA — este artículo NO está vigente: sin cierre';
check('una apertura sin su cierre exacto no borra nada', reemplazoParaPegar(aperturaSinCierre).texto === aperturaSinCierre, reemplazoParaPegar(aperturaSinCierre).texto);

/* ─── 4. Y LO QUE SE PEGA EN EL ESCRITO QUEDA LIMPIO ────────────────────── */

const escrito = 'HECHOS. PRIMERO: con fundamento en la norma solicito la restitución.';
const pegado = aplicarReemplazo(escrito, 'con fundamento en la norma', reemplazoParaPegar(`con fundamento en el artículo 2035 ${m1} del Código Civil y en el artículo 384 del CGP`).texto);
check('el escrito tras «Aplicar reemplazo» no lleva ningún corchete de advertencia', pegado !== null && !pegado.includes('[') && pegado.includes(LIMPIO), String(pegado));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
