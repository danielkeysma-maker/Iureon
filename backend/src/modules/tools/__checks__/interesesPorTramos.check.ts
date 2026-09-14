/**
 * Guarda la liquidación de intereses de mora por tramos de tasa certificada.
 *
 * Run with: npm run check:intereses-tramos
 *
 * Sin red y sin base: lee la tabla estática de `tasasCertificadas.ts` y la
 * función pura de `interesesPorTramos.ts`.
 *
 * ─── LO QUE SOSTIENE ────────────────────────────────────────────────────────
 *
 * 1. LA TABLA. Cada fila con resolución, URL oficial y fecha de consulta;
 *    periodos contiguos, sin huecos ni solapes; usura = 1,5 × IBC, que es la
 *    relación del Código Penal art. 305 y del Código de Comercio art. 884.
 * 2. EL CORTE EN TRAMOS. Un periodo que cruza tres certificaciones da tres
 *    tramos, cada uno con la tasa de su resolución. Convención de días: la
 *    fecha de exigibilidad NO cuenta y la de corte SÍ (días = corte − desde).
 * 3. LA CONVERSIÓN. Una tasa efectiva anual no se divide linealmente
 *    (Superfinanciera, Concepto 2006022407-002 de 2006): el factor del tramo es
 *    (1 + EA)^(días / días del año) − 1. El ejemplo se calculó a mano sobre la
 *    fila de septiembre de 2026 (Resolución 1260 de 2026).
 * 4. EL RANGO. Antes de la primera certificación cargada se niega; después de
 *    la última se liquida hasta ella y lo dice.
 * 5. EL TOPE. La tasa pactada nunca se aplica por encima de la usura del tramo.
 */
import { CERTIFICACIONES_IBC, PRIMER_DIA_CERTIFICADO, ULTIMO_DIA_CERTIFICADO } from '../tasasCertificadas';
import { diasDelAnio, factorEfectivo, liquidarIntereses, partirEnTramos } from '../interesesPorTramos';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' - ' + d : ''}`);
  if (!ok) fallos += 1;
};
const lanza = (fn: () => unknown, fragmento: string): boolean => {
  try {
    fn();
    return false;
  } catch (e) {
    return e instanceof Error && e.message.includes(fragmento);
  }
};
const siguienteDia = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

// ─── 1. La tabla ────────────────────────────────────────────────────────────
const T = CERTIFICACIONES_IBC;
check('la tabla trae filas', T.length > 100, String(T.length));
check('empieza el 1 de julio de 2016 (cubre los últimos diez años)', T[0].desde === '2016-07-01' && PRIMER_DIA_CERTIFICADO === '2016-07-01', T[0].desde);
check('termina el 30 de septiembre de 2026 (Resolución 1260 de 2026)', T[T.length - 1].hasta === '2026-09-30' && ULTIMO_DIA_CERTIFICADO === '2026-09-30', T[T.length - 1].hasta);

const sinFuente = T.filter(
  (f) =>
    !/^Resolución \d{4} de \d{4}$/.test(f.resolucion) ||
    !f.url.startsWith('https://www.superfinanciera.gov.co/') ||
    !/^\d{4}-\d{2}-\d{2}$/.test(f.consultadoEl) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(f.fechaResolucion)
);
check('toda fila trae resolución, URL de la Superfinanciera y fecha de consulta', sinFuente.length === 0, sinFuente.map((f) => f.desde).join(','));

const cortes: string[] = [];
for (let i = 1; i < T.length; i++) {
  if (T[i].desde !== siguienteDia(T[i - 1].hasta)) cortes.push(`${T[i - 1].hasta}→${T[i].desde}`);
}
check('los periodos son contiguos: sin huecos ni solapes', cortes.length === 0, cortes.join(' · '));
check('cada periodo termina después de empezar', T.every((f) => f.hasta >= f.desde));
check('cada resolución se expidió antes de que su periodo empezara', T.every((f) => f.fechaResolucion < f.desde));

const usuraRota = T.filter((f) => Math.abs(f.usuraEA - 1.5 * f.interesBancarioCorrienteEA) > 0.005 + 1e-9);
check('la usura de cada fila es 1,5 × el bancario corriente (C.P. art. 305)', usuraRota.length === 0, usuraRota.map((f) => f.desde).join(','));
check('las tasas están en porcentaje, no en fracción', T.every((f) => f.interesBancarioCorrienteEA > 5 && f.interesBancarioCorrienteEA < 60));

const julio2017 = T.find((f) => f.resolucion === 'Resolución 0907 de 2017');
const sept2017 = T.find((f) => f.resolucion === 'Resolución 1155 de 2017');
check(
  'la 0907 de 2017 rige julio y agosto; la 1155 certificó septiembre por separado',
  julio2017?.hasta === '2017-08-31' && sept2017?.desde === '2017-09-01' && sept2017.hasta === '2017-09-30' && (julio2017.nota ?? '').includes('1155')
);
const sept2026 = T[T.length - 1];
check('septiembre de 2026: IBC 19,49 y usura 29,24 (Resolución 1260 de 2026)', sept2026.interesBancarioCorrienteEA === 19.49 && sept2026.usuraEA === 29.24 && sept2026.resolucion === 'Resolución 1260 de 2026');

// ─── 2. El corte en tramos ──────────────────────────────────────────────────
const tres = partirEnTramos('2026-07-15', '2026-09-10');
check('del 15 de julio al 10 de septiembre de 2026 hay tres tramos', tres.tramos.length === 3, String(tres.tramos.length));
check(
  'los tramos son 16/07–31/07, 01/08–31/08 y 01/09–10/09',
  JSON.stringify(tres.tramos.map((t) => [t.desde, t.hasta])) ===
    JSON.stringify([['2026-07-16', '2026-07-31'], ['2026-08-01', '2026-08-31'], ['2026-09-01', '2026-09-10']])
);
check('días por tramo 16, 31 y 10', tres.tramos.map((t) => t.dias).join(',') === '16,31,10', tres.tramos.map((t) => t.dias).join(','));
check(
  'cada tramo trae su resolución: 0965, 1139 y 1260 de 2026',
  tres.tramos.map((t) => t.fila.resolucion).join('|') === 'Resolución 0965 de 2026|Resolución 1139 de 2026|Resolución 1260 de 2026'
);
check('la suma de días de los tramos es la diferencia de fechas (57)', tres.tramos.reduce((s, t) => s + t.dias, 0) === 57);

const borde1 = partirEnTramos('2026-07-31', '2026-08-01');
check('exigible el 31 de julio y corte el 1 de agosto: un día, en agosto', borde1.tramos.length === 1 && borde1.tramos[0].dias === 1 && borde1.tramos[0].desde === '2026-08-01' && borde1.tramos[0].fila.resolucion === 'Resolución 1139 de 2026');
const borde2 = partirEnTramos('2026-08-30', '2026-09-01');
check('del 30 de agosto al 1 de septiembre: un día en cada certificación', borde2.tramos.map((t) => `${t.desde}:${t.dias}`).join(',') === '2026-08-31:1,2026-09-01:1');

// ─── 3. La conversión, contra un ejemplo hecho a mano ───────────────────────
/*
 * Fila de septiembre de 2026: usura 29,24 % E.A. (1,5 × 19,49). Capital
 * $10.000.000, mora del 1 al 30 de septiembre (exigible el 31 de agosto): 30
 * días de un año de 365.
 *   ln(1,2924)            = 0,256500954968206…
 *   × 30 / 365            = 0,021082270271363…
 *   e^x − 1               = 0,021306071308948…
 *   × 10.000.000          = 213.060,71 → $213.061
 * Dividir linealmente (0,2924 × 30 / 365) daría $240.329: $27.268 de más, que
 * medido en efectivo anual supera la usura del periodo.
 */
check('el factor de 30 días al 29,24 % E.A. es 0,0213060713089…', Math.abs(factorEfectivo(29.24, 30, 365) - 0.021306071308948) < 1e-12, String(factorEfectivo(29.24, 30, 365)));
check('un año entero al 29,24 % E.A. da exactamente el 29,24 %', Math.abs(factorEfectivo(29.24, 365, 365) - 0.2924) < 1e-12);
check('2024 tiene 366 días y 2026 tiene 365', diasDelAnio(2024) === 366 && diasDelAnio(2026) === 365 && diasDelAnio(2100) === 365 && diasDelAnio(2000) === 366);

const sept = liquidarIntereses({ capital: 10_000_000, desde: '2026-08-31', hasta: '2026-09-30', modo: 'COMERCIAL' });
check('comercial, septiembre de 2026: $213.061', sept.interes === 213_061, String(sept.interes));
check('y no los $240.329 de la división lineal', sept.interes !== 240_329);
check('el tramo aplica la usura de su fila (29,24) y cita la Resolución 1260', sept.tramos.length === 1 && sept.tramos[0].tasaEA === 29.24 && sept.tramos[0].resolucion === 'Resolución 1260 de 2026');

const liq3 = liquidarIntereses({ capital: 10_000_000, desde: '2026-07-15', hasta: '2026-09-10', modo: 'COMERCIAL' });
check('tres tramos: 28,79 · 29,66 · 29,24 % E.A.', liq3.tramos.map((t) => t.tasaEA).join(',') === '28.79,29.66,29.24', liq3.tramos.map((t) => t.tasaEA).join(','));
check('intereses por tramo $111.527 · $223.057 · $70.522', liq3.tramos.map((t) => t.interes).join(',') === '111527,223057,70522', liq3.tramos.map((t) => t.interes).join(','));
check('el total es la suma de los tramos ($405.106) y el total con capital cuadra', liq3.interes === 405_106 && liq3.total === 10_405_106 && liq3.dias === 57, `${liq3.interes}`);
check('sin capitalizar: cada tramo se calcula sobre el capital, no sobre capital más intereses', liq3.tramos.every((t) => t.interes === Math.round(10_000_000 * factorEfectivo(t.tasaEA, t.dias, t.diasDelAnio))));

const feb2024 = liquidarIntereses({ capital: 1_000_000, desde: '2024-01-31', hasta: '2024-02-29', modo: 'COMERCIAL' });
check('un tramo de 2024 cuenta el año de 366 días', feb2024.tramos.length === 1 && feb2024.tramos[0].diasDelAnio === 366 && feb2024.tramos[0].dias === 29);

check(
  'la respuesta cita la Superfinanciera, el art. 884, la Ley 510, el art. 305 y el Decreto 2555',
  ['884', '510', '305', '11.2.5.1.3'].every((s) => sept.fuentes.some((f) => f.norma.includes(s))) && sept.fuentes.some((f) => f.url.includes('superfinanciera.gov.co'))
);
check('declara la fecha en que se consultaron las tasas', sept.certificadas.consultadoEl === T[0].consultadoEl && sept.certificadas.desde === '2016-07-01' && sept.certificadas.hasta === '2026-09-30');

// ─── 4. El rango ────────────────────────────────────────────────────────────
check('una mora que empieza antes del 1 de julio de 2016 se niega hablando', lanza(() => liquidarIntereses({ capital: 1, desde: '2016-06-29', hasta: '2016-08-01', modo: 'COMERCIAL' }), '2016-07-01'));
const primerDia = liquidarIntereses({ capital: 1_000_000, desde: '2016-06-30', hasta: '2016-07-01', modo: 'COMERCIAL' });
check('exigible el 30 de junio de 2016: el primer día de mora ya está certificado', primerDia.tramos.length === 1 && primerDia.tramos[0].resolucion === 'Resolución 0811 de 2016');

const despues = liquidarIntereses({ capital: 1_000_000, desde: '2026-09-20', hasta: '2026-10-15', modo: 'COMERCIAL' });
check('un corte posterior a la última certificación se liquida hasta ella', despues.corte === '2026-09-30' && despues.dias === 10 && despues.hasta === '2026-10-15', `${despues.corte} ${despues.dias}`);
check('y lo dice', despues.advertencias.some((a) => a.includes('2026-09-30') && a.includes('certificación')));
check('sin corte posterior no aparece esa advertencia', !sept.advertencias.some((a) => a.includes('no hay certificación')));
check('una mora que empieza después de la última certificación se niega', lanza(() => liquidarIntereses({ capital: 1, desde: '2026-09-30', hasta: '2026-10-05', modo: 'COMERCIAL' }), 'certificación'));
check('fechas invertidas se rechazan', lanza(() => liquidarIntereses({ capital: 1, desde: '2026-02-01', hasta: '2026-01-01', modo: 'COMERCIAL' }), 'posterior'));
check('una fecha malformada se rechaza', lanza(() => liquidarIntereses({ capital: 1, desde: '01/02/2026', hasta: '2026-03-01', modo: 'COMERCIAL' }), 'AAAA-MM-DD'));

// ─── 5. El tope ─────────────────────────────────────────────────────────────
const pac35 = liquidarIntereses({ capital: 10_000_000, desde: '2026-08-31', hasta: '2026-09-30', modo: 'PACTADA', tasaPactadaEA: 35 });
check('pactada 35 % en septiembre de 2026 se aplica al tope de 29,24 %', pac35.tramos[0].tasaEA === 29.24 && pac35.interes === 213_061, `${pac35.tramos[0].tasaEA}`);
check('y marca el tramo y la liquidación como excedidos, citando el art. 884', pac35.tramos[0].excedeUsura && pac35.excedeUsura && pac35.advertencias.some((a) => a.includes('884')));
const pac20 = liquidarIntereses({ capital: 10_000_000, desde: '2026-08-31', hasta: '2026-09-30', modo: 'PACTADA', tasaPactadaEA: 20 });
check('pactada 20 % no excede y se aplica tal cual', pac20.tramos[0].tasaEA === 20 && !pac20.excedeUsura);
const pacMixta = liquidarIntereses({ capital: 1_000_000, desde: '2022-12-31', hasta: '2023-03-31', modo: 'PACTADA', tasaPactadaEA: 44 });
check('la misma pactada puede exceder en un tramo y no en otro', pacMixta.tramos.some((t) => t.excedeUsura) && pacMixta.tramos.some((t) => !t.excedeUsura), pacMixta.tramos.map((t) => `${t.usuraEA}:${t.excedeUsura}`).join(','));
check('pactada sin tasa se niega', lanza(() => liquidarIntereses({ capital: 1, desde: '2026-08-31', hasta: '2026-09-30', modo: 'PACTADA' }), 'pactada'));

// ─── 6. Civil y compatibilidad ──────────────────────────────────────────────
const civ = liquidarIntereses({ capital: 1_000_000, desde: '2025-01-01', hasta: '2026-01-01', modo: 'CIVIL' });
check('civil: 6 % sobre el año 2025 = $60.000', civ.interes === 60_000 && civ.dias === 365, `${civ.interes}`);
const civBis = liquidarIntereses({ capital: 1_000_000, desde: '2024-01-01', hasta: '2025-01-01', modo: 'CIVIL' });
check('civil: 6 % sobre el año bisiesto 2024 = $60.000 en 366 días', civBis.interes === 60_000 && civBis.dias === 366, `${civBis.interes}`);
check('civil no depende de la tabla de certificaciones: 2010 se liquida', liquidarIntereses({ capital: 1_000_000, desde: '2010-01-01', hasta: '2010-02-01', modo: 'CIVIL' }).interes > 0);
check('civil cita el art. 1617', civ.fuentes.some((f) => f.norma.includes('1617')));
const conIbcViejo = liquidarIntereses({ capital: 10_000_000, desde: '2026-08-31', hasta: '2026-09-30', modo: 'COMERCIAL', ibcEA: 1 } as Parameters<typeof liquidarIntereses>[0]);
check('un cliente viejo que manda ibcEA no cambia el resultado: la tasa sale de la tabla', conIbcViejo.interes === sept.interes);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
