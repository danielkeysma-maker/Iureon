/**
 * Guards the Herramientas calculators.
 *
 * Run with: npm run check:tools
 *
 * No database, no network. The holidays are asserted against the 2025 and
 * 2026 calendars read on official pages (Ministerio de Hacienda's calendario
 * de días inhábiles 2026; Ley 51 de 1983 and Ley 2578 de 2026 texts), the
 * interest arithmetic against C.Co. art. 884, the cuantía tiers at exactly 40
 * and 150 SMLMV against CGP art. 25, and the indexation formula against its
 * own definition. These are the numbers a lawyer carries into a filing.
 */
import {
  calendarioDe,
  contarDiasHabiles,
  domingoDePascua,
  festivosDe,
  motivoNoHabil,
  semanaSantaLunesAMiercoles
} from '../calendario.service';
import {
  INTERES_LEGAL_CIVIL_EA,
  determinarCuantia,
  diasCalendarioEntre,
  indexarPorIpc,
  liquidarIntereses,
  moraComercialDesdeIbc
} from '../calculos.service';
import { IBC_ULTIMO_VERIFICADO, SMLMV_POR_ANIO, smlmvDe } from '../fuentes';
import { ProceduralTermsService } from '../../procedural-terms/terms.service';

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

// ─── Computus ───────────────────────────────────────────────────────────────
check('Pascua 2025 es el 20 de abril', domingoDePascua(2025).toISOString().slice(0, 10) === '2025-04-20');
check('Pascua 2026 es el 5 de abril', domingoDePascua(2026).toISOString().slice(0, 10) === '2026-04-05');
check('Pascua 2027 es el 28 de marzo', domingoDePascua(2027).toISOString().slice(0, 10) === '2027-03-28');

// ─── Festivos 2026 (19, con el nuevo del 9 de julio trasladado al 13) ────────
const FESTIVOS_2026 = [
  '2026-01-01', '2026-01-12', '2026-03-23', '2026-04-02', '2026-04-03', '2026-05-01', '2026-05-18',
  '2026-06-08', '2026-06-15', '2026-06-29', '2026-07-13', '2026-07-20', '2026-08-07', '2026-08-17',
  '2026-10-12', '2026-11-02', '2026-11-16', '2026-12-08', '2026-12-25'
];
const f2026 = festivosDe(2026).map((f) => f.fecha);
check('2026 tiene 19 festivos', f2026.length === 19, `${f2026.length}`);
check('2026 coincide fecha por fecha con el calendario oficial', JSON.stringify(f2026) === JSON.stringify(FESTIVOS_2026), f2026.join(','));
check('2026 incluye San Pedro y San Pablo (29 de junio), el que faltaba en la tabla vieja', f2026.includes('2026-06-29'));
check(
  'el 9 de julio (jueves) se traslada al lunes 13 en 2026 y se atribuye a la Ley 2578',
  festivosDe(2026).some((f) => f.fecha === '2026-07-13' && f.fechaOriginal === '2026-07-09' && f.nombre.includes('Ley 2578'))
);

// ─── Festivos 2025 (18: la Ley 2578 aún no existía) ─────────────────────────
const FESTIVOS_2025 = [
  '2025-01-01', '2025-01-06', '2025-03-24', '2025-04-17', '2025-04-18', '2025-05-01', '2025-06-02',
  '2025-06-23', '2025-06-30', '2025-06-30', '2025-07-20', '2025-08-07', '2025-08-18', '2025-10-13',
  '2025-11-03', '2025-11-17', '2025-12-08', '2025-12-25'
];
const f2025 = festivosDe(2025).map((f) => f.fecha);
check('2025 tiene 18 festivos', f2025.length === 18, `${f2025.length}`);
check('2025 coincide fecha por fecha (Sagrado Corazón y San Pedro caen ambos el 30 de junio)', JSON.stringify(f2025) === JSON.stringify(FESTIVOS_2025), f2025.join(','));
check('2025 no trae el festivo de Chiquinquirá', !festivosDe(2025).some((f) => f.nombre.includes('Ley 2578')));
check('Reyes 2025 cae lunes 6 y no se mueve', festivosDe(2025).some((f) => f.fecha === '2025-01-06' && f.fechaOriginal === '2025-01-06'));

// ─── Reglas de día no hábil ─────────────────────────────────────────────────
check('un sábado no es hábil', motivoNoHabil('2026-09-05') !== null);
check('un domingo no es hábil', motivoNoHabil('2026-09-06') !== null);
check('un martes ordinario es hábil', motivoNoHabil('2026-09-08') === null);
check('el 24 de diciembre es vacancia judicial', (motivoNoHabil('2026-12-24') ?? '').includes('Vacancia'));
check('el 8 de enero es vacancia; el 11 de 2027 es Reyes trasladado; el 12 es hábil', motivoNoHabil('2027-01-08') !== null && (motivoNoHabil('2027-01-11') ?? '').includes('Reyes') && motivoNoHabil('2027-01-12') === null);
check('la vacancia se puede apagar', motivoNoHabil('2026-12-24', { descontarVacancia: false }) === null);
check('Semana Santa 2026: lunes 30 de marzo es vacancia por defecto', (motivoNoHabil('2026-03-30') ?? '').includes('Semana Santa'));
check('Semana Santa 2026: lunes 30 de marzo cuenta para penal', motivoNoHabil('2026-03-30', { semanaSantaCompleta: false }) === null);
check('lunes a miércoles santos 2026 son 30, 31 de marzo y 1 de abril', semanaSantaLunesAMiercoles(2026).join(',') === '2026-03-30,2026-03-31,2026-04-01');
check('el calendario rechaza 1983', lanza(() => festivosDe(1983), '1984'));

// ─── Conteo de términos (el defecto que motivó todo) ────────────────────────
const c = contarDiasHabiles('2026-08-14', 5); // viernes; el lunes 17 es la Asunción trasladada
check('notificado el viernes 14 de agosto de 2026, 5 días hábiles vencen el 24', c.fechaFin === '2026-08-24', c.fechaFin);
check('el cómputo arranca el día siguiente', c.fechaInicio === '2026-08-15');
const junio = contarDiasHabiles('2026-06-26', 1); // viernes; lunes 29 es San Pedro
check('el 29 de junio de 2026 no cuenta: 1 día hábil desde el viernes 26 vence el martes 30', junio.fechaFin === '2026-06-30', junio.fechaFin);
const diciembre = contarDiasHabiles('2026-12-18', 1); // viernes; 19 sáb, 20 dic–10 ene vacancia
check('1 día hábil desde el 18 de diciembre de 2026 vence el martes 12 de enero de 2027 (el lunes 11 es Reyes)', diciembre.fechaFin === '2027-01-12', diciembre.fechaFin);
check('los días excluidos traen su motivo (24: sábado 19, vacancia 20 dic–10 ene, Reyes 11)', diciembre.excluidos.every((d) => d.motivo.length > 0) && diciembre.excluidos.length === 24, `${diciembre.excluidos.length}`);

const svc = new ProceduralTermsService();
const t = svc.calculateJudicialTerm({ notifiedDate: '2026-08-14', termInDays: 5, jurisdictionType: 'CIVIL', firmId: 'x' });
check('el servicio de términos usa el calendario compartido', t.dueDate === '2026-08-24' && t.fuentes.length >= 3);
const penal = svc.calculateJudicialTerm({ notifiedDate: '2026-03-27', termInDays: 1, jurisdictionType: 'PENAL', firmId: 'x' });
const civil = svc.calculateJudicialTerm({ notifiedDate: '2026-03-27', termInDays: 1, jurisdictionType: 'CIVIL', firmId: 'x' });
check('viernes antes de Semana Santa 2026: penal vence el lunes 30, civil el lunes 6 de abril', penal.dueDate === '2026-03-30' && civil.dueDate === '2026-04-06', `${penal.dueDate} / ${civil.dueDate}`);
check('el servicio rechaza una fecha malformada', lanza(() => svc.calculateJudicialTerm({ notifiedDate: '14/08/2026', termInDays: 5, jurisdictionType: 'CIVIL', firmId: 'x' }), 'AAAA-MM-DD'));

const cal = calendarioDe(2026);
check('el calendario anual trae 12 meses y las fuentes', cal.diasHabilesPorMes.length === 12 && cal.fuentes.length === 4);
check('agosto 2026 tiene 19 días hábiles', cal.diasHabilesPorMes[7].habiles === 19, `${cal.diasHabilesPorMes[7].habiles}`);

// ─── Intereses: 1,5 × IBC ───────────────────────────────────────────────────
check('1,5 × 19,49 = 29,24 (Resolución 1260 de 2026)', moraComercialDesdeIbc(19.49) === 29.24);
check('1,5 × 17,01 = 25.52 (Resolución 0405 de 2026, marzo)', moraComercialDesdeIbc(17.01) === 25.52);
check('la constante IBC verificada es la de septiembre de 2026', IBC_ULTIMO_VERIFICADO?.tasaEA === 19.49 && IBC_ULTIMO_VERIFICADO.mes === '2026-09');
check('interés legal civil es 6 %', INTERES_LEGAL_CIVIL_EA === 6);
check('días calendario entre 1 y 31 de enero son 30', diasCalendarioEntre('2026-01-01', '2026-01-31') === 30);

const com = liquidarIntereses({ capital: 10_000_000, desde: '2026-09-01', hasta: '2026-10-01', modo: 'COMERCIAL', ibcEA: 19.49 });
check('comercial: tasa aplicada 29,24 % sobre 30 días', com.tasaAnualEA === 29.24 && com.dias === 30);
check('comercial: 10.000.000 × 0,2924/365 × 30 = 240.329', com.interes === Math.round((10_000_000 * 0.2924 * 30) / 365), `${com.interes}`);
check('comercial: no excede usura por definición', !com.excedeUsura && com.topeUsuraEA === 29.24);
check('comercial: cita art. 884, Ley 510 y art. 305', ['884', '510', '305'].every((s) => com.fuentes.some((f) => f.norma.includes(s))));
check('comercial: advierte si el periodo cruza otro mes distinto del certificado', liquidarIntereses({ capital: 1, desde: '2026-07-01', hasta: '2026-10-01', modo: 'COMERCIAL', ibcEA: 19.49 }).advertencias.some((a) => a.includes('2026-09')));
check('comercial sin IBC se niega hablando', lanza(() => liquidarIntereses({ capital: 1, desde: '2026-01-01', hasta: '2026-02-01', modo: 'COMERCIAL' }), 'Superintendencia'));

const civ = liquidarIntereses({ capital: 1_000_000, desde: '2025-01-01', hasta: '2026-01-01', modo: 'CIVIL' });
check('civil: 6 % sobre 365 días = 60.000', civ.interes === 60_000 && civ.dias === 365, `${civ.interes}`);
check('civil: cita el art. 1617', civ.fuentes.some((f) => f.norma.includes('1617')));

const pac = liquidarIntereses({ capital: 1_000_000, desde: '2026-09-01', hasta: '2026-09-11', modo: 'PACTADA', ibcEA: 19.49, tasaPactadaEA: 35 });
check('pactada 35 % con IBC 19,49 excede el tope de 29,24 y lo dice', pac.excedeUsura && pac.topeUsuraEA === 29.24 && pac.advertencias.some((a) => a.includes('usura')));
const pacOk = liquidarIntereses({ capital: 1_000_000, desde: '2026-09-01', hasta: '2026-09-11', modo: 'PACTADA', ibcEA: 19.49, tasaPactadaEA: 20 });
check('pactada 20 % no excede', !pacOk.excedeUsura);
check('fechas invertidas se rechazan', lanza(() => liquidarIntereses({ capital: 1, desde: '2026-02-01', hasta: '2026-01-01', modo: 'CIVIL' }), 'posterior'));

// ─── Cuantía: exactamente 40 y 150 SMLMV ────────────────────────────────────
const s2026 = smlmvDe(2026);
check('SMLMV 2026 verificado: 1.750.905', s2026?.smlmv === 1_750_905 && s2026.advertencias.length === 1);
check('SMLMV 2025 verificado: 1.423.500 · auxilio 200.000', smlmvDe(2025)?.smlmv === 1_423_500 && smlmvDe(2025)?.auxilioTransporte === 200_000);
check('la serie cubre 2020 a 2026 sin huecos', SMLMV_POR_ANIO.map((s) => s.anio).join(',') === '2020,2021,2022,2023,2024,2025,2026');
check('toda fila trae decreto, URL oficial y fecha de consulta', SMLMV_POR_ANIO.every((s) => s.fuentes.length >= 2 && s.fuentes.every((f) => f.url.includes('.gov.co') && /^\d{4}-\d{2}-\d{2}$/.test(f.consultadoEl))));

const smlmv = 1_750_905;
const en40 = determinarCuantia({ pretension: 40 * smlmv, anio: 2026, jurisdiccion: 'CIVIL' });
check('exactamente 40 SMLMV es mínima cuantía (art. 25: «que no excedan»)', en40.categoria === 'Mínima cuantía' && en40.juez === 'Juez civil municipal' && en40.instancia.includes('Única'));
const sobre40 = determinarCuantia({ pretension: 40 * smlmv + 1, anio: 2026, jurisdiccion: 'CIVIL' });
check('40 SMLMV + 1 peso es menor cuantía', sobre40.categoria === 'Menor cuantía' && sobre40.instancia.includes('Primera'));
const en150 = determinarCuantia({ pretension: 150 * smlmv, anio: 2026, jurisdiccion: 'CIVIL' });
check('exactamente 150 SMLMV es menor cuantía («sin exceder»)', en150.categoria === 'Menor cuantía' && en150.juez === 'Juez civil municipal');
const sobre150 = determinarCuantia({ pretension: 150 * smlmv + 1, anio: 2026, jurisdiccion: 'CIVIL' });
check('150 SMLMV + 1 peso es mayor cuantía ante el juez civil del circuito', sobre150.categoria === 'Mayor cuantía' && sobre150.juez === 'Juez civil del circuito');
check('la respuesta civil cita el CGP 25/26 y la competencia 17/18/20 además del decreto', ['25 y 26', '17 num. 1'].every((s) => en40.fuentes.some((f) => f.norma.includes(s))) && en40.decreto.includes('0159'));
check('el año se toma del SMLMV de presentación: 2025 usa 1.423.500', determinarCuantia({ pretension: 1_000_000, anio: 2025, jurisdiccion: 'CIVIL' }).smlmv === 1_423_500);
check('un año sin SMLMV verificado se niega hablando', lanza(() => determinarCuantia({ pretension: 1, anio: 2019, jurisdiccion: 'CIVIL' }), '2019'));

const lab40 = determinarCuantia({ pretension: 40 * smlmv, anio: 2026, jurisdiccion: 'LABORAL' });
check('laboral 2026: 40 SMLMV es mínima ante juez laboral municipal, primera instancia', lab40.categoria === 'Mínima cuantía' && lab40.juez === 'Juez laboral municipal' && lab40.instancia.includes('Primera'));
const lab41 = determinarCuantia({ pretension: 40 * smlmv + 1, anio: 2026, jurisdiccion: 'LABORAL' });
check('laboral 2026: sobre 40 SMLMV es mayor ante juez laboral del circuito', lab41.categoria === 'Mayor cuantía' && lab41.juez === 'Juez laboral del circuito');
check('laboral antes de 2026 se niega: el CPTSS anterior no está verificado', lanza(() => determinarCuantia({ pretension: 1, anio: 2025, jurisdiccion: 'LABORAL' }), '2158'));

// ─── Indexación ─────────────────────────────────────────────────────────────
const idx = indexarPorIpc({ valor: 10_000_000, ipcInicial: 100, ipcFinal: 159.79 });
check('10.000.000 × (159,79 ÷ 100) = 15.979.000', idx.valorIndexado === 15_979_000 && idx.fuentes[0].url.includes('dane.gov.co'));
check('la fórmula se imprime con los índices', idx.formula.includes('159.79') && idx.formula.includes('÷'));
check('índices invertidos advierten', indexarPorIpc({ valor: 100, ipcInicial: 150, ipcFinal: 100 }).advertencias.some((a) => a.includes('invirtió')));
check('sin índices se niega hablando', lanza(() => indexarPorIpc({ valor: 100, ipcInicial: 0, ipcFinal: 0 }), 'DANE'));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
