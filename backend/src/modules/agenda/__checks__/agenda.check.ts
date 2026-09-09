/**
 * Guarda la decisión de avisos de la agenda de términos y la lectura del plazo
 * de una ficha.
 *
 * Se corre con: npm run check:agenda
 *
 * Sin base de datos y sin red: las dos piezas que se vigilan son funciones
 * puras a propósito, porque son las que pueden equivocarse en silencio. Un
 * aviso que no sale no lanza ningún error —el abogado simplemente no se entera
 * de que hoy vence su contestación—, y un plazo mal leído produce una fecha
 * límite exacta y falsa. Ninguno de los dos defectos se ve en un registro.
 *
 * Lo que aquí se afirma:
 *  · A cuántos días se avisa: cinco, dos y el día del vencimiento.
 *  · Que un aviso no se repite.
 *  · Que no se avisa lo cumplido, lo archivado ni lo vencido hace días.
 *  · Que si una pasada falla, el aviso sale tarde en vez de no salir.
 *  · Que el lector de plazos se NIEGA ante una ficha ambigua, que es su
 *    trabajo principal.
 */
import { avisoQueCorresponde, avisosDelDia, diasQueFaltan, textoDelAviso, type EntradaVigilada } from '../avisos';
import { leerPlazoDelTexto } from '../plazoDeLaFicha';
import { hoyEnColombia } from '../avisosDelDia.service';
import type { HitoDeAviso } from '../types';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' - ' + d : ''}`);
  if (!ok) fallos += 1;
};

const HOY = '2026-09-09';

const entrada = (over: Partial<EntradaVigilada> = {}): EntradaVigilada => ({
  id: 'e1',
  firmId: 'firma-1',
  asunto: 'Mosquera · Juzgado 12 Laboral',
  actuacionNombre: 'Contestación de la demanda',
  fechaLimite: '2026-09-14',
  estado: 'PENDIENTE',
  responsable: null,
  avisosEnviados: [],
  ...over
});

// ─── Cuántos días faltan ────────────────────────────────────────────────────
check('faltan 5 días del 9 al 14 de septiembre', diasQueFaltan('2026-09-14', HOY) === 5);
check('el día del vencimiento faltan 0', diasQueFaltan(HOY, HOY) === 0);
check('lo vencido ayer da negativo', diasQueFaltan('2026-09-08', HOY) === -1);
check(
  'la cuenta cruza el cambio de mes sin perder un día',
  diasQueFaltan('2026-10-01', '2026-09-28') === 3
);

// ─── A cuántos días se avisa ────────────────────────────────────────────────
check('a cinco días sale el aviso de cinco', avisoQueCorresponde(entrada(), HOY)?.hito === 5);
check(
  'a dos días sale el aviso de dos',
  avisoQueCorresponde(entrada({ fechaLimite: '2026-09-11' }), HOY)?.hito === 2
);
check(
  'el día del vencimiento sale el aviso de cero',
  avisoQueCorresponde(entrada({ fechaLimite: HOY }), HOY)?.hito === 0
);
check(
  'a seis días todavía no se avisa nada',
  avisoQueCorresponde(entrada({ fechaLimite: '2026-09-15' }), HOY) === null
);

// ─── No se repite ───────────────────────────────────────────────────────────
check(
  'el aviso de cinco no se repite al día siguiente',
  avisoQueCorresponde(entrada({ fechaLimite: '2026-09-14', avisosEnviados: [5] }), HOY) === null
);
check(
  'con los tres ya enviados no queda nada por mandar',
  avisoQueCorresponde(entrada({ fechaLimite: HOY, avisosEnviados: [5, 2, 0] }), HOY) === null
);
check(
  'haber avisado a cinco no impide el de dos',
  avisoQueCorresponde(entrada({ fechaLimite: '2026-09-11', avisosEnviados: [5] }), HOY)?.hito === 2
);

// ─── Una pasada que no corrió: tarde, pero sale ─────────────────────────────
check(
  'a cuatro días —la pasada de ayer falló— sale igual el aviso de cinco',
  avisoQueCorresponde(entrada({ fechaLimite: '2026-09-13' }), HOY)?.hito === 5
);
check(
  'a un día, con el de cinco ya enviado, sale el de dos',
  avisoQueCorresponde(entrada({ fechaLimite: '2026-09-10', avisosEnviados: [5] }), HOY)?.hito === 2
);
check(
  'a tres días, con el de cinco enviado, no se manda nada todavía',
  avisoQueCorresponde(entrada({ fechaLimite: '2026-09-12', avisosEnviados: [5] }), HOY) === null
);

// ─── Lo que NUNCA se avisa ──────────────────────────────────────────────────
check(
  'lo cumplido no se avisa',
  avisoQueCorresponde(entrada({ fechaLimite: HOY, estado: 'CUMPLIDA' }), HOY) === null
);
check(
  'lo archivado no se avisa',
  avisoQueCorresponde(entrada({ fechaLimite: HOY, estado: 'ARCHIVADA' }), HOY) === null
);
check(
  'lo vencido ayer no se avisa',
  avisoQueCorresponde(entrada({ fechaLimite: '2026-09-08' }), HOY) === null
);
check(
  'lo vencido hace un mes tampoco',
  avisoQueCorresponde(entrada({ fechaLimite: '2026-08-09' }), HOY) === null
);

// ─── El barrido completo ────────────────────────────────────────────────────
const lote: EntradaVigilada[] = [
  entrada({ id: 'a', fechaLimite: '2026-09-14' }),
  entrada({ id: 'b', fechaLimite: '2026-09-11' }),
  entrada({ id: 'c', fechaLimite: HOY }),
  entrada({ id: 'd', fechaLimite: '2026-09-20' }),
  entrada({ id: 'e', fechaLimite: '2026-09-01' }),
  entrada({ id: 'f', fechaLimite: HOY, estado: 'CUMPLIDA' }),
  entrada({ id: 'g', fechaLimite: '2026-09-14', avisosEnviados: [5] })
];
const salida = avisosDelDia(lote, HOY);
check(
  'de siete entradas solo tres reciben aviso hoy',
  salida.length === 3 && salida.map((a) => a.entrada.id).join(',') === 'a,b,c',
  salida.map((a) => `${a.entrada.id}:${a.hito}`).join(' ')
);

// ─── El texto que llega al teléfono ─────────────────────────────────────────
const texto0 = textoDelAviso({ entrada: entrada({ fechaLimite: HOY }), hito: 0 as HitoDeAviso, faltan: 0 });
check('el aviso del día dice «Vence hoy» y el asunto', texto0.title.startsWith('Vence hoy: Mosquera'));
check('el cuerpo trae la actuación y la fecha', texto0.body.includes('Contestación de la demanda') && texto0.body.includes('2026-09-09'));

// ─── El día se calcula en Colombia, no en UTC ───────────────────────────────
check(
  'a las 22:00 de Colombia el servidor sigue en el mismo día',
  hoyEnColombia(new Date('2026-09-09T03:00:00Z')) === '2026-09-08',
  hoyEnColombia(new Date('2026-09-09T03:00:00Z'))
);
check(
  'a las 08:00 de Colombia el día ya cambió',
  hoyEnColombia(new Date('2026-09-09T13:00:00Z')) === '2026-09-09'
);

// ─── El lector de plazos: lo que acepta ─────────────────────────────────────
const claro = leerPlazoDelTexto('El recurso deberá interponerse dentro de los cinco (5) días hábiles siguientes a la notificación.');
check('lee «cinco (5) días hábiles»', claro.legible && claro.plazo.dias === 5 && claro.plazo.tipo === 'HABILES');
check('la evidencia trae la frase de la ficha', claro.legible && claro.plazo.evidencia.includes('cinco (5) días hábiles'));

const calendario = leerPlazoDelTexto('Treinta (30) días calendario siguientes a la ejecutoria.');
check('lee «(30) días calendario» como calendario', calendario.legible && calendario.plazo.tipo === 'CALENDARIO');

const cgp = leerPlazoDelTexto(
  'El término para contestar la demanda será de diez (10) días.',
  'Ley 1564 de 2012, Código General del Proceso, art. 391'
);
check(
  'con base en el CGP, «días» a secas son hábiles por su art. 118',
  cgp.legible && cgp.plazo.dias === 10 && cgp.plazo.tipo === 'HABILES'
);
check('y la evidencia cita el artículo que lo resuelve', cgp.legible && cgp.plazo.evidencia.includes('art. 118'));

check(
  'la misma cantidad repetida no es ambigüedad',
  leerPlazoDelTexto('Tres (3) días hábiles. Vencidos los tres (3) días hábiles, precluye.').legible
);

// ─── El lector de plazos: lo que RECHAZA, que es su trabajo ─────────────────
const dosPlazos = leerPlazoDelTexto(
  'El término para contestar será de diez (10) días hábiles. El juez proferirá sentencia dentro de los treinta (30) días hábiles siguientes.'
);
check('dos plazos distintos: se niega', !dosPlazos.legible);
check(
  'y explica que alguno puede ser el del despacho',
  !dosPlazos.legible && dosPlazos.motivo.includes('despacho')
);

const conMeses = leerPlazoDelTexto('Diez (10) días hábiles para el recurso; la caducidad de la acción es de cuatro (4) meses.');
check('un plazo en meses en la misma ficha: se niega', !conMeses.legible);
check('y dice cuál es', !conMeses.legible && conMeses.motivo.includes('4 meses'));

const soloMeses = leerPlazoDelTexto('Cuatro (4) meses contados a partir del día siguiente al de la notificación del acto.');
check('un término solo en meses no se convierte en días', !soloMeses.legible);

const sinCalificar = leerPlazoDelTexto(
  'Quince (15) días siguientes a la notificación del acta de aprehensión.',
  'Ley 2586 de 2026, art. 45'
);
check('«días» sin calificar y fuera del CGP: se niega', !sinCalificar.legible);
check(
  'y explica que contarlos como hábiles daría una fecha más tardía',
  !sinCalificar.legible && sinCalificar.motivo.includes('más tardía')
);

check(
  'un término en prosa sin cifras no se inventa',
  !leerPlazoDelTexto('En cualquier tiempo, mientras no se haya proferido sentencia.').legible
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
