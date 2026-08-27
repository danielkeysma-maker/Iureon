/**
 * Guards the on-demand fetching of a ruling.
 *
 * Run with: npm run check:ruling
 *
 * Este módulo trae del sitio de la Corte una sentencia que el corpus no tiene.
 * Lo único que separa eso de citar algo inexistente es que se confirme contra
 * el registro oficial ANTES de descargar — y esta app ya emitió alguna vez una
 * cita a SU-049 de 2022, que nunca existió.
 *
 * La parte de red se prueba de verdad y se salta limpiamente si no hay
 * conexión: un check que falla en toda máquina sin internet es uno que todo el
 * mundo aprende a ignorar.
 */
import { fetchOfficialRuling, parseCitation } from '../officialRuling.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

// ─── Se lee una cita como la escribe un abogado ─────────────────────────────
const formas = [
  ['C-590 de 2005', 'C', '590', 2005],
  ['C-590/05', 'C', '590', 2005],
  ['T-384 de 2018', 'T', '384', 2018],
  ['SU-087/22', 'SU', '87', 2022],
  ['su-087 de 2022', 'SU', '87', 2022],
  ['Sentencia T-025 de 2004', 'T', '25', 2004],
  ['t-406/92', 'T', '406', 1992]
] as const;

const malas = formas.filter(([raw, tipo, numero, anio]) => {
  const c = parseCitation(raw);
  return !c || c.tipo !== tipo || c.numero !== numero || c.anio !== anio;
});
check('una cita se lee en las formas que un abogado usa', malas.length === 0, malas.map((m) => m[0]).join(', '));

// El año de dos dígitos se resuelve contra la vida de la Corte, que abrió en 1992.
check('un año de dos dígitos anterior a 92 no es de los noventa', parseCitation('T-001/26')?.anio === 2026);
check('y 92 sí lo es', parseCitation('T-406/92')?.anio === 1992);

// Lo que no es una cita no se fuerza a serlo.
const noSon = ['desembargo de salario', 'Ley 1564 de 2012', 'art. 590', 'C-590 de 1885', ''];
check(
  'lo que no es una cita de la Corte se rechaza',
  noSon.every((x) => parseCitation(x) === null),
  noSon.filter((x) => parseCitation(x) !== null).join(', ')
);

/*
 * ─── LA PRUEBA QUE JUSTIFICA EL MÓDULO ─────────────────────────────────────
 *
 * La relatoría responde HTTP 200 para sentencias que NO existen: SU-049-22 y
 * C-999-22 devuelven los mismos 8.607 bytes, byte por byte, mientras C-590 de
 * 2005 devuelve 213.276. Descargar no distingue una cita real de una inventada,
 * y un umbral de longitud es una suposición sobre el tamaño de un menú.
 *
 * Por eso la guarda es el registro del Estado, no la descarga.
 */
(async () => {
  const sonda = await fetchOfficialRuling('C-590 de 2005');

  if (sonda.status === 'UNREACHABLE') {
    console.log('skip la parte de red: no hay acceso al registro oficial ni a la relatoría');
    console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
    process.exit(fallos === 0 ? 0 : 1);
  }

  check(
    'una sentencia real se encuentra y se descarga',
    sonda.status === 'FOUND' && sonda.ruling.text.length > 50_000,
    sonda.status === 'FOUND' ? `${sonda.ruling.text.length} caracteres` : sonda.status
  );

  if (sonda.status === 'FOUND') {
    check(
      'y llega con su procedencia del registro oficial, no inventada',
      Boolean(sonda.ruling.magistrado && sonda.ruling.fecha && sonda.ruling.sala),
      `${sonda.ruling.magistrado} · ${sonda.ruling.fecha} · ${sonda.ruling.sala}`
    );
    check(
      'el texto descargado contiene la doctrina que la sentencia fundó',
      /procedibilidad/i.test(sonda.ruling.text)
    );
  }

  // SU-049 de 2022: la cita que esta aplicación llegó a emitir y que no existe.
  const inventada = await fetchOfficialRuling('SU-049 de 2022');
  check(
    'la sentencia que esta app llegó a inventar se declara inexistente',
    inventada.status === 'DOES_NOT_EXIST',
    inventada.status
  );

  const otraFalsa = await fetchOfficialRuling('C-999 de 2022');
  check(
    'y otra falsa también, aunque su URL responda 200',
    otraFalsa.status === 'DOES_NOT_EXIST',
    otraFalsa.status
  );

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exit(fallos === 0 ? 0 : 1);
})();
