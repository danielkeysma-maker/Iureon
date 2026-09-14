/**
 * Del contador de términos a la agenda. Run with: npm run check:agenda-contador
 *
 * Sin red, sin React. Lo que tiene que sostenerse:
 *  · Lo que se lleva son los datos de la cuenta, nunca una ficha del catálogo.
 *  · El formulario nace con esos datos puestos y NO ata la actuación a una
 *    ficha por su nombre (cambiaría el plazo contado por el de la ficha).
 *  · Días hábiles y calendario llegan como plazo en días; meses y años, como
 *    la fecha del contador escrita a mano.
 *  · Lo que viene del contador queda SIN VERIFICAR, con la misma regla que
 *    aplica el servidor al guardar; solo una ficha legible verifica.
 *  · Si con los mismos datos la agenda llega a otra fecha, se avisa.
 *  · Lo que se lee del almacenamiento se valida: un contador no puede colar
 *    una ficha ni un plazo malformado.
 */
import {
  avisoDeDiscrepancia,
  comoQuedaraElTermino,
  pendienteDesdeElContador,
  valoresInicialesDelFormulario
} from '../desdeElContador';
import { dejarPendiente, plazoValido, tomarPendiente, type AgendaPendiente } from '../pendiente';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const HOY = '2030-01-15';

/* ─── 1. Qué se lleva ─────────────────────────────────────────────────────── */
const habiles = pendienteDesdeElContador({
  notifiedDate: '2030-03-01',
  termInDays: 10,
  termUnit: 'DIAS_HABILES',
  jurisdictionType: 'LABORAL',
  dueDate: '2030-03-15',
  descripcion: '  Contestación de la demanda  '
});
check('viene del contador', habiles.origen === 'CONTADOR');
check('nunca lleva una ficha del catálogo', habiles.actuacionId === null);
check('el asunto y el nombre de la actuación son lo que el abogado escribió, sin espacios sobrantes', habiles.asunto === 'Contestación de la demanda' && habiles.actuacionNombre === 'Contestación de la demanda');
check('la jurisdicción viaja como rama (decide la Semana Santa en penal)', habiles.rama === 'LABORAL');
check(
  'lleva la notificación, la cantidad, la clase y la fecha del contador',
  JSON.stringify(habiles.plazo) === JSON.stringify({ fechaNotificacion: '2030-03-01', cantidad: 10, unidad: 'DIAS_HABILES', venceSegunElContador: '2030-03-15' })
);
const sinDescripcion = pendienteDesdeElContador({ notifiedDate: '2030-03-01', termInDays: 3, termUnit: 'DIAS_CALENDARIO', jurisdictionType: 'CIVIL', dueDate: '2030-03-04' });
check('sin descripción el asunto queda vacío para que el abogado lo escriba', sinDescripcion.asunto === '' && sinDescripcion.actuacionNombre === null);

/* ─── 2. Cómo nace el formulario ──────────────────────────────────────────── */
const vH = valoresInicialesDelFormulario(habiles, HOY);
check('días hábiles: nace con la notificación del contador, no con hoy', vH.fechaNotificacion === '2030-03-01');
check('días hábiles: 10 días hábiles y sin fecha a mano', vH.dias === '10' && vH.tipoDias === 'HABILES' && vH.fechaManual === '');
check('lo del contador no se ata a una ficha por el nombre', vH.resolverActuacionPorNombre === false && vH.actuacionId === '');
check('el nombre queda como actuación escrita', vH.nombreSinCatalogar === 'Contestación de la demanda');
check('la rama llega puesta', vH.rama === 'LABORAL');

const vC = valoresInicialesDelFormulario(sinDescripcion, HOY);
check('días calendario: llega como plazo de calendario', vC.dias === '3' && vC.tipoDias === 'CALENDARIO' && vC.fechaManual === '');

const meses = pendienteDesdeElContador({ notifiedDate: '2030-01-30', termInDays: 1, termUnit: 'MESES', jurisdictionType: 'CIVIL', dueDate: '2030-02-28' });
const vM = valoresInicialesDelFormulario(meses, HOY);
check('meses: la agenda no los cuenta; llega la fecha del contador escrita a mano y sin días', vM.dias === '' && vM.fechaManual === '2030-02-28');
const vA = valoresInicialesDelFormulario(pendienteDesdeElContador({ notifiedDate: '2030-01-30', termInDays: 2, termUnit: 'ANIOS', jurisdictionType: 'CIVIL', dueDate: '2032-01-31' }), HOY);
check('años: igual que meses', vA.dias === '' && vA.fechaManual === '2032-01-31');

const borrador: AgendaPendiente = { origen: 'BORRADOR', asunto: 'Proceso 00', actuacionId: null, actuacionNombre: 'Actuación 00', rama: 'CIVIL' };
const vB = valoresInicialesDelFormulario(borrador, HOY);
check('lo de un borrador sí se puede atar a su ficha por el nombre exacto', vB.resolverActuacionPorNombre === true);
check('un borrador no trae plazo: la notificación es hoy y los días se escriben', vB.fechaNotificacion === HOY && vB.dias === '' && vB.fechaManual === '');
const vVacio = valoresInicialesDelFormulario(null, HOY);
check('sin pendiente todo nace vacío y en días hábiles', vVacio.asunto === '' && vVacio.tipoDias === 'HABILES' && vVacio.fechaNotificacion === HOY && vVacio.resolverActuacionPorNombre);

/* ─── 3. Cómo quedará marcado ─────────────────────────────────────────────── */
const marcaH = comoQuedaraElTermino({ actuacionId: vH.actuacionId || null, lecturaLegible: false, dias: Number(vH.dias), fechaManual: vH.fechaManual });
check('lo del contador en días queda calculado y SIN VERIFICAR', !marcaH.verificado && marcaH.origen === 'CALCULADA');
const marcaM = comoQuedaraElTermino({ actuacionId: null, lecturaLegible: false, dias: Number(vM.dias), fechaManual: vM.fechaManual });
check('lo del contador en meses queda MANUAL y sin verificar', !marcaM.verificado && marcaM.origen === 'MANUAL');
check('solo una ficha legible del catálogo verifica', comoQuedaraElTermino({ actuacionId: 'ficha-1', lecturaLegible: true, dias: 0, fechaManual: '' }).verificado);
check('una ficha que no se deja leer, con días escritos, no verifica', !comoQuedaraElTermino({ actuacionId: 'ficha-1', lecturaLegible: false, dias: 5, fechaManual: '' }).verificado);
check('ni una lectura legible sin ficha verifica', !comoQuedaraElTermino({ actuacionId: null, lecturaLegible: true, dias: 5, fechaManual: '' }).verificado);
check('sin días ni fecha no hay cómo guardar', comoQuedaraElTermino({ actuacionId: null, lecturaLegible: false, dias: 0, fechaManual: '' }).origen === null);

/* ─── 4. La misma fecha en los dos motores ────────────────────────────────── */
const mismos = { fechaNotificacion: '2030-03-01', dias: '10', tipoDias: 'HABILES' as const };
check('misma fecha con los mismos datos: no se avisa', avisoDeDiscrepancia(habiles, { ...mismos, fechaPrevista: '2030-03-15' }) === null);
const aviso = avisoDeDiscrepancia(habiles, { ...mismos, fechaPrevista: '2030-03-18' });
check('otra fecha con los mismos datos: se avisa con las dos fechas', aviso !== null && aviso.includes('2030-03-15') && aviso.includes('2030-03-18'), aviso ?? '');
check('si el abogado cambió los días, la diferencia es suya', avisoDeDiscrepancia(habiles, { ...mismos, dias: '12', fechaPrevista: '2030-03-18' }) === null);
check('si cambió la clase de días, tampoco', avisoDeDiscrepancia(habiles, { ...mismos, tipoDias: 'CALENDARIO', fechaPrevista: '2030-03-11' }) === null);
check('meses no se comparan: la agenda no los cuenta', avisoDeDiscrepancia(meses, { fechaNotificacion: '2030-01-30', dias: '', tipoDias: 'HABILES', fechaPrevista: '2030-02-01' }) === null);
check('lo de un borrador no se compara', avisoDeDiscrepancia(borrador, { ...mismos, fechaPrevista: '2030-03-18' }) === null);

/* ─── 5. Lo que se lee del almacenamiento ─────────────────────────────────── */
const memoria = new Map<string, string>();
(globalThis as unknown as { sessionStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> }).sessionStorage = {
  getItem: (k) => memoria.get(k) ?? null,
  setItem: (k, v) => void memoria.set(k, v),
  removeItem: (k) => void memoria.delete(k)
};
dejarPendiente(habiles);
const leido = tomarPendiente();
check('ida y vuelta: llega con su plazo', leido?.origen === 'CONTADOR' && JSON.stringify(leido.plazo) === JSON.stringify(habiles.plazo));
check('se consume una vez', tomarPendiente() === null);
dejarPendiente({ ...habiles, actuacionId: 'ficha-colada' });
check('un pendiente del contador con ficha colada llega sin ficha', tomarPendiente()?.actuacionId === null);
dejarPendiente({ ...borrador, plazo: habiles.plazo });
check('un borrador no puede traer plazo', tomarPendiente()?.plazo === null);
check('un plazo con fecha malformada no viaja', plazoValido({ ...habiles.plazo, fechaNotificacion: '01/03/2030' }) === null);
check('un plazo con cantidad no entera no viaja', plazoValido({ ...habiles.plazo, cantidad: 2.5 }) === null);
check('un plazo con clase desconocida no viaja', plazoValido({ ...habiles.plazo, unidad: 'SEMANAS' }) === null);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
