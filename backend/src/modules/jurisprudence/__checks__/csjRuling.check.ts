/**
 * Guards the Supreme Court reader.
 *
 * Run with: npm run check:csj
 *
 * La garantía aquí no es la misma que la de la Corte Constitucional, y por eso
 * tiene su propio check. Allá el registro abierto del Estado dice si una
 * sentencia existe. Acá lo dice el nombre del archivo que la propia Corte
 * guardó: el buscador es difuso a propósito — pedir `SL4102-2023` devuelve 111
 * resultados y ninguno es esa providencia—, así que aceptar "el buscador
 * devolvió algo" confirmaría cualquier cita inventada.
 */
import { parseCsjCitation, fetchCsjRuling } from '../csjRuling.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/*
 * ─── LEER LA CITA COMO LA ESCRIBE UN ABOGADO ───────────────────────────────
 */
const formas: Array<[string, string, string]> = [
  ['SL4102-2022', 'SL4102-2022', 'Laboral'],
  ['SL 4102 de 2022', 'SL4102-2022', 'Laboral'],
  ['sl4102/2022', 'SL4102-2022', 'Laboral'],
  ['STC1234-2021', 'STC1234-2021', 'Tutelas'],
  ['SP2758-2019', 'SP2758-2019', 'Penal'],
  ['AC1122-2020', 'AC1122-2020', 'Civil']
];

const malLeidas = formas.filter(([entrada, canonica, corpus]) => {
  const c = parseCsjCitation(entrada);
  return c?.canonica !== canonica || c?.corpus !== corpus;
});

check(
  'la cita se lee en las formas en que se escribe, y va al corpus correcto',
  malLeidas.length === 0,
  malLeidas.map(([e]) => e).join(', ')
);

/*
 * Una tutela laboral vive en Tutelas, no en Laboral. Buscarla en el corpus
 * equivocado devolvería vacío, y ese vacío se reportaría como "no existe" — una
 * afirmación falsa sobre el derecho, que es el error que este módulo evita.
 */
check(
  'una tutela laboral se busca en Tutelas y no en Laboral',
  parseCsjCitation('STL9876-2021')?.corpus === 'Tutelas',
  String(parseCsjCitation('STL9876-2021')?.corpus)
);

/*
 * Lo que no es una cita de esta Corte no se convierte en una. `T-760 de 2008`
 * es de la Corte Constitucional y tiene su propio lector; tratarla aquí la
 * mandaría a buscar donde nunca va a estar.
 */
const noSonCitas = ['T-760 de 2008', 'C-590/05', 'SU-049 de 2017', 'SL4102', 'SL4102-2010', 'oficio 123 de 2020'];
const coladas = noSonCitas.filter((n) => parseCsjCitation(n) !== null);
check(
  'lo que no es providencia de la Corte Suprema no se lee como si lo fuera',
  coladas.length === 0,
  coladas.join(', ')
);

(async () => {
  /*
   * ─── LA PARTE QUE TOCA LA RED ────────────────────────────────────────────
   *
   * Se salta limpiamente si la Corte no responde: un check que falla en toda
   * máquina sin salida a internet es uno que todo el mundo aprende a ignorar.
   */
  const real = await fetchCsjRuling('SL4102-2022');

  if (real.status === 'UNREACHABLE') {
    console.log(`skip la parte de red: ${real.reason}`);
  } else {
    check('una providencia real se encuentra', real.status === 'FOUND', real.status);

    if (real.status === 'FOUND') {
      const r = real.ruling;

      // El texto viene del archivo que la Corte guardó, no de un resumen.
      check(
        'y llega con su texto completo descargado',
        r.text.length > 10_000,
        `${r.text.length} caracteres`
      );

      // Y con procedencia: quién la firmó y en qué sala. Una ficha sin esto
      // obliga al abogado a ir a buscarla otra vez, que es no haberla traído.
      check(
        'con su ponente y su sala, tomados de lo que publicó la Corte',
        r.magistrado !== 'no registrado' && /Sala/.test(r.sala),
        `${r.magistrado} | ${r.sala}`
      );
    }

    /*
     * LA GARANTÍA. Este número no existe, pero buscarlo SÍ devuelve resultados
     * — el buscador es difuso. Si algún día alguien acepta "hubo resultados"
     * como prueba de existencia, esto tiene que fallar.
     */
    const inventada = await fetchCsjRuling('SL999999-2022');

    if (inventada.status !== 'UNREACHABLE') {
      check(
        'una providencia inventada NO se confirma, aunque el buscador devuelva resultados',
        inventada.status === 'DOES_NOT_EXIST',
        inventada.status
      );
    }
  }

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  /*
   * `exitCode` en vez de `process.exit()`: este check hace fetch con
   * `AbortSignal.timeout`, y matar el proceso con un handle de libuv a medio
   * cerrar aborta Node en Windows — imprimía ALL CHECKS PASSED y salía con 127.
   */
  process.exitCode = fallos === 0 ? 0 : 1;
})();
