/**
 * Exportar la agenda: .ics y PDF. Run with: npm run check:agenda-exportar
 *
 * En Node, con la Helvetica de jsPDF. Lo que tiene que sostenerse:
 *  · Solo lo pendiente sale por defecto; lo cumplido, si se pide; lo archivado,
 *    nunca. Desde el calendario, solo el mes visto.
 *  · El .ics cumple RFC 5545 donde los calendarios no perdonan: CRLF en cada
 *    línea, líneas de hasta 75 octetos plegadas sin partir una tilde, texto
 *    escapado, día completo con VALUE=DATE y un UID estable por entrada.
 *  · El aviso «sin verificar» viaja; el cliente no.
 *  · El PDF lleva el membrete de la firma solo si existe, cada término con sus
 *    líneas, la advertencia de lo no verificado y la página real.
 */
import { jsPDF } from 'jspdf';
import {
  descripcionIcs,
  entradasParaExportar,
  escaparTextoIcs,
  generarIcs,
  lineasDeEntradaParaPdf,
  nombreDeArchivoDeAgenda,
  plegarLineaIcs,
  rotuloDelFiltro,
  uidDeEntrada
} from '../agendaExportable';
import { dibujarAgendaEnPdf } from '../agendaPdfLayout';
import type { EntradaDeAgenda } from '../types';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const entrada = (over: Partial<EntradaDeAgenda>): EntradaDeAgenda => ({
  id: '00000000-0000-0000-0000-000000000001',
  firmId: 'firma-00',
  asunto: 'Proceso 00',
  radicado: null,
  cliente: null,
  actuacionId: null,
  actuacionNombre: 'Actuacion 00',
  rama: 'CIVIL',
  fechaNotificacion: '2030-09-01',
  fechaLimite: '2030-09-18',
  diasTermino: 10,
  tipoDias: 'HABILES',
  terminoVerificado: true,
  origenFecha: 'CALCULADA',
  terminoEvidencia: null,
  responsable: null,
  estado: 'PENDIENTE',
  cumplidaEl: null,
  notas: null,
  expedienteId: null,
  createdBy: 'usuario@firma.test',
  createdAt: '2030-09-01T00:00:00Z',
  updatedAt: '2030-09-01T00:00:00Z',
  avisosEnviados: [],
  ...over
});

const E = [
  entrada({ id: 'a-3', fechaLimite: '2030-10-02', asunto: 'Proceso 03' }),
  entrada({ id: 'a-1', fechaLimite: '2030-09-18', asunto: 'Proceso 01', terminoVerificado: false, radicado: '00000-00-00-000-0000-00000-00', cliente: 'Cliente 00' }),
  entrada({ id: 'a-2', fechaLimite: '2030-09-20', asunto: 'Proceso 02', estado: 'CUMPLIDA' }),
  entrada({ id: 'a-4', fechaLimite: '2030-09-25', asunto: 'Proceso 04', estado: 'ARCHIVADA' }),
  entrada({ id: 'a-5', fechaLimite: '2030-12-31', asunto: 'Proceso 05', terminoVerificado: false, origenFecha: 'MANUAL', diasTermino: null, tipoDias: null })
];

/* ─── 1. Qué sale ─────────────────────────────────────────────────────────── */
const soloPendientes = entradasParaExportar(E, { incluirCumplidas: false, mes: null });
check('por defecto solo lo pendiente, ordenado por fecha', soloPendientes.map((e) => e.id).join(',') === 'a-1,a-3,a-5', soloPendientes.map((e) => e.id).join(','));
const conCumplidas = entradasParaExportar(E, { incluirCumplidas: true, mes: null });
check('con «incluir cumplidos» entra lo cumplido y lo archivado sigue fuera', conCumplidas.map((e) => e.id).join(',') === 'a-1,a-2,a-3,a-5', conCumplidas.map((e) => e.id).join(','));
const septiembre = entradasParaExportar(E, { incluirCumplidas: false, mes: { anio: 2030, mes: 8 } });
check('desde el calendario, solo el mes visto', septiembre.map((e) => e.id).join(',') === 'a-1');
check('el rótulo dice qué se exportó', rotuloDelFiltro({ incluirCumplidas: true, mes: { anio: 2030, mes: 8 } }) === 'Términos pendientes y cumplidos de septiembre de 2030');
check('el nombre del archivo lleva el mes y la fecha', nombreDeArchivoDeAgenda('ics', '2030-09-14', { incluirCumplidas: false, mes: { anio: 2030, mes: 8 } }) === 'agenda-de-terminos-2030-09-2030-09-14.ics');

/* ─── 2. Escapar y plegar ─────────────────────────────────────────────────── */
check('escapa barra invertida, punto y coma, coma y salto de línea', escaparTextoIcs('a\\b;c,d\ne') === 'a\\\\b\\;c\\,d\\ne', escaparTextoIcs('a\\b;c,d\ne'));
check('la barra se escapa primero: no se duplica el escape de la coma', escaparTextoIcs(',') === '\\,');
const larga = `SUMMARY:${'términos '.repeat(20)}`;
const plegada = plegarLineaIcs(larga);
const fisicas = plegada.split('\r\n');
check('una línea larga se pliega en varias', fisicas.length > 1, String(fisicas.length));
check('ninguna línea física pasa de 75 octetos', fisicas.every((l) => new TextEncoder().encode(l).length <= 75), fisicas.map((l) => new TextEncoder().encode(l).length).join(','));
check('cada continuación empieza con un espacio', fisicas.slice(1).every((l) => l.startsWith(' ')));
check('desplegar devuelve la línea original', plegada.replace(/\r\n /g, '') === larga);
const decodificador = new TextDecoder('utf-8', { fatal: true });
check(
  'ninguna tilde queda partida entre dos líneas',
  fisicas.every((l) => {
    try {
      decodificador.decode(new TextEncoder().encode(l));
      return !l.includes('�');
    } catch {
      return false;
    }
  })
);
check('una línea corta no se toca', plegarLineaIcs('VERSION:2.0') === 'VERSION:2.0');

/* ─── 3. El calendario completo ───────────────────────────────────────────── */
const AHORA = new Date('2030-09-14T15:30:00Z');
const conSignos = entrada({ id: 'a-9', asunto: 'Proceso 09; demandado, parte \\ 00', terminoVerificado: false, radicado: '00000-00-00-000-0000-00000-00', cliente: 'Cliente 00' });
const ics = generarIcs([...soloPendientes, conSignos], { ahora: AHORA, nombreCalendario: 'Términos · Firma 00' });
check('todo salto de línea es CRLF', !/[^\r]\n/.test(ics) && !/\r(?!\n)/.test(ics));
check('termina en CRLF', ics.endsWith('\r\n'));
check('todas las líneas físicas caben en 75 octetos', ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75));
const desplegado = ics.replace(/\r\n /g, '');
check('abre y cierra el calendario', desplegado.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:') && desplegado.includes('END:VCALENDAR'));
check('un evento por entrada exportada', (desplegado.match(/BEGIN:VEVENT/g) ?? []).length === 4 && (desplegado.match(/END:VEVENT/g) ?? []).length === 4);
check('día completo en la fecha límite, con fin exclusivo al día siguiente', desplegado.includes('DTSTART;VALUE=DATE:20300918\r\nDTEND;VALUE=DATE:20300919'));
check('el 31 de diciembre termina el 1 de enero del año siguiente', desplegado.includes('DTSTART;VALUE=DATE:20301231\r\nDTEND;VALUE=DATE:20310101'));
check('DTSTAMP en UTC', desplegado.includes('DTSTAMP:20300914T153000Z'));
check('el resumen es «Vence: asunto», escapado', desplegado.includes('SUMMARY:Vence: Proceso 09\\; demandado\\, parte \\\\ 00\r\n'));
check('la descripción lleva la actuación y el radicado, con saltos escapados', desplegado.includes('DESCRIPTION:Actuación: Actuacion 00\\nRadicado: 00000-00-00-000-0000-00000-00\\n'));
check('lo no verificado lleva su aviso en la descripción', descripcionIcs(conSignos).includes('Sin verificar: el plazo lo escribió'));
check('la fecha a mano lleva el suyo', descripcionIcs(E[4]).includes('Sin verificar: esta fecha no la calculó'));
check('lo verificado no lleva aviso', !descripcionIcs(E[0]).includes('Sin verificar'));
check('el cliente no sale en el .ics', !desplegado.includes('Cliente 00'));
check('el nombre del calendario se escapa', desplegado.includes('X-WR-CALNAME:Términos · Firma 00'));
const otraVez = generarIcs([...soloPendientes, conSignos], { ahora: new Date('2031-01-01T00:00:00Z') });
const uids = (texto: string) => (texto.replace(/\r\n /g, '').match(/UID:[^\r]+/g) ?? []).join('|');
check('los UID son estables entre exportaciones', uids(ics) === uids(otraVez) && uids(ics).includes('UID:a-1@agenda.iureon'), uids(ics));
check('un UID no hereda caracteres raros del id', uidDeEntrada('a b;c,1') === 'abc1@agenda.iureon');
check('cada entrada tiene su propio UID', new Set(uids(ics).split('|')).size === 4);
check('sin entradas sale un calendario válido y vacío', generarIcs([], { ahora: AHORA }).replace(/\r\n /g, '').split('\r\n').filter(Boolean).length === 7);

/* ─── 4. Las líneas del PDF ───────────────────────────────────────────────── */
const lineas = lineasDeEntradaParaPdf(E[1]);
check('primera línea: la fecha y el estado, en negrita', lineas[0].texto === 'Vence el 2030-09-18 · Pendiente' && lineas[0].estilo === 'negrita');
check('segunda: el asunto', lineas[1].texto === 'Proceso 01');
check('tercera: actuación, cliente y radicado', lineas[2].texto === 'Actuacion 00 · Cliente 00 · Radicado 00000-00-00-000-0000-00000-00', lineas[2].texto);
check('cuarta: notificación, plazo y a quién avisa', lineas[3].texto === 'Notificado el 2030-09-01 · 10 días hábiles · avisa a toda la firma', lineas[3].texto);
check('lo no verificado cierra con su aviso en cursiva', lineas[4]?.estilo === 'cursiva' && lineas[4].texto.startsWith('Sin verificar'));
check('lo verificado no lleva aviso', lineasDeEntradaParaPdf(E[0]).length === 4);
check('lo cumplido dice que se cumplió', lineasDeEntradaParaPdf(E[2])[0].texto.endsWith('Cumplido'));

/* ─── 5. El PDF dibujado ──────────────────────────────────────────────────── */
const pdf = (membrete: Parameters<typeof dibujarAgendaEnPdf>[2]['membrete'], entradas: EntradaDeAgenda[]) => {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  dibujarAgendaEnPdf(doc, 'helvetica', { entradas, rotulo: 'Terminos pendientes', fecha: '14 de septiembre de 2030', membrete, cuerpoPt: 11 });
  return { doc, texto: doc.output() };
};
const conMembrete = pdf({ firmName: 'Firma 00', firmNit: '000.000.000-0', firmEmail: 'contacto@firma.test' }, soloPendientes);
check('lleva el membrete de la firma', conMembrete.texto.includes('FIRMA 00') && conMembrete.texto.includes('NIT 000.000.000-0'));
check('lleva el título, el filtro y la fecha', conMembrete.texto.includes('AGENDA DE T') && conMembrete.texto.includes('Terminos pendientes') && conMembrete.texto.includes('14 de septiembre de 2030'));
check('lleva cada término', ['Proceso 01', 'Proceso 03', 'Proceso 05'].every((a) => conMembrete.texto.includes(a)));
check('lleva el aviso de lo no verificado', conMembrete.texto.includes('Sin verificar'));
check('lleva el pie con la firma y la página real', conMembrete.texto.includes('Firma 00') && conMembrete.texto.includes('gina 1 de 1'));
const sinMembrete = pdf(null, soloPendientes);
check('sin membrete no inventa cabecera ni NIT', !sinMembrete.texto.includes('NIT') && sinMembrete.texto.includes('AGENDA DE T'));
const vacio = pdf(null, []);
check('sin términos lo dice en la hoja', vacio.texto.includes('No hay t'));
const muchas = pdf(null, Array.from({ length: 40 }, (_, k) => entrada({ id: `m-${k}`, asunto: `Proceso ${String(k).padStart(2, '0')}` })));
check('una agenda larga pagina y numera cada hoja', muchas.doc.getNumberOfPages() > 1 && muchas.texto.includes(`gina ${muchas.doc.getNumberOfPages()} de ${muchas.doc.getNumberOfPages()}`), String(muchas.doc.getNumberOfPages()));
check('ningún término se pierde al paginar', muchas.texto.includes('Proceso 00') && muchas.texto.includes('Proceso 39'));

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
