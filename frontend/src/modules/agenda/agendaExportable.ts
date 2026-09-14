import { MESES, type MesVisto } from './mesDelCalendario';
import type { EntradaDeAgenda } from './types';

/**
 * LA AGENDA FUERA DE LA APLICACIÓN: QUÉ SALE, Y CÓMO SE ESCRIBE EL .ICS.
 *
 * Puro, sin React ni jsPDF, para que `npm run check:agenda-exportar` pruebe lo
 * que un calendario ajeno no perdona: una coma sin escapar parte el resumen, una
 * línea de más de 75 octetos sin plegar hace que Outlook rechace el archivo, y
 * un UID que cambia en cada exportación duplica cada término al reimportarlo.
 *
 * ─── QUÉ SALE ───────────────────────────────────────────────────────────────
 *
 * Lo que la pantalla muestra y nada más. En el .ics, además, ni el cliente ni
 * las notas: ese archivo va a parar a Google, Outlook o un iPhone, fuera del
 * alcance de la firma, y el nombre de un cliente no hace falta para saber qué
 * se vence. El PDF es papel de la firma y sí lleva el cliente, como la lista.
 *
 * ─── LO CUMPLIDO NO SALE, SALVO QUE SE PIDA ─────────────────────────────────
 *
 * Exportar es para vigilar, y lo cumplido ya no se vigila. Lo archivado no sale
 * nunca: la pantalla tampoco lo muestra.
 */

export interface FiltroDeExportacion {
  incluirCumplidas: boolean;
  /** El mes visto en «El calendario»; null exporta toda la lista. */
  mes: MesVisto | null;
}

const dosDigitos = (n: number): string => String(n).padStart(2, '0');

export const entradasParaExportar = (entradas: EntradaDeAgenda[], filtro: FiltroDeExportacion): EntradaDeAgenda[] => {
  const prefijoMes = filtro.mes ? `${filtro.mes.anio}-${dosDigitos(filtro.mes.mes + 1)}-` : null;
  return entradas
    .filter((e) => e.estado === 'PENDIENTE' || (filtro.incluirCumplidas && e.estado === 'CUMPLIDA'))
    .filter((e) => prefijoMes === null || e.fechaLimite.startsWith(prefijoMes))
    .sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite) || a.asunto.localeCompare(b.asunto));
};

export const rotuloDelFiltro = (filtro: FiltroDeExportacion): string =>
  `${filtro.incluirCumplidas ? 'Términos pendientes y cumplidos' : 'Términos pendientes'}${
    filtro.mes ? ` de ${MESES[filtro.mes.mes].toLowerCase()} de ${filtro.mes.anio}` : ''
  }`;

export const nombreDeArchivoDeAgenda = (extension: 'pdf' | 'ics', hoy: string, filtro: FiltroDeExportacion): string =>
  `agenda-de-terminos${filtro.mes ? `-${filtro.mes.anio}-${dosDigitos(filtro.mes.mes + 1)}` : ''}-${hoy}.${extension}`;

/** Lo que dice la pantalla de una entrada sin verificar, con las mismas palabras. */
export const advertenciaSinVerificar = (e: EntradaDeAgenda): string | null => {
  if (e.terminoVerificado) return null;
  return e.origenFecha === 'MANUAL'
    ? 'Sin verificar: esta fecha no la calculó la aplicación; la escribió quien creó la entrada.'
    : 'Sin verificar: el plazo lo escribió quien creó la entrada, no el catálogo verificado.';
};

const plazoEnPalabras = (e: EntradaDeAgenda): string =>
  e.diasTermino ? ` · ${e.diasTermino} días ${e.tipoDias === 'HABILES' ? 'hábiles' : 'de calendario'}` : '';

/* ─── PDF: las líneas de cada término ─────────────────────────────────────── */

export interface LineaDePdf {
  texto: string;
  estilo: 'negrita' | 'normal' | 'cursiva';
}

export const lineasDeEntradaParaPdf = (e: EntradaDeAgenda): LineaDePdf[] => {
  const lineas: LineaDePdf[] = [
    { texto: `Vence el ${e.fechaLimite} · ${e.estado === 'CUMPLIDA' ? 'Cumplido' : 'Pendiente'}`, estilo: 'negrita' },
    { texto: e.asunto, estilo: 'negrita' },
    {
      texto: [e.actuacionNombre, e.cliente, e.radicado ? `Radicado ${e.radicado}` : null].filter(Boolean).join(' · '),
      estilo: 'normal'
    },
    {
      texto: `Notificado el ${e.fechaNotificacion}${plazoEnPalabras(e)}${
        e.responsable ? ` · avisa solo a ${e.responsable}` : ' · avisa a toda la firma'
      }`,
      estilo: 'normal'
    }
  ];
  const aviso = advertenciaSinVerificar(e);
  if (aviso) lineas.push({ texto: aviso, estilo: 'cursiva' });
  return lineas;
};

/* ─── ICS (RFC 5545) ──────────────────────────────────────────────────────── */

/** RFC 5545 §3.3.11: barra invertida, punto y coma, coma y salto de línea. */
export const escaparTextoIcs = (texto: string): string =>
  texto
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');

const octetos = (texto: string): number => new TextEncoder().encode(texto).length;

/**
 * RFC 5545 §3.1: ninguna línea pasa de 75 octetos; se pliega con CRLF y un
 * espacio. Se cuenta en OCTETOS de UTF-8 —«términos» ocupa 9, no 8— y se corta
 * entre caracteres, nunca en medio de uno: una tilde partida en dos llega al
 * calendario como un signo de interrogación.
 */
export const plegarLineaIcs = (linea: string): string => {
  const partes: string[] = [];
  let actual = '';
  let bytes = 0;
  let limite = 75;
  for (const caracter of Array.from(linea)) {
    const b = octetos(caracter);
    if (bytes + b > limite) {
      partes.push(actual);
      actual = '';
      bytes = 0;
      limite = 74; // el espacio de la continuación cuenta
    }
    actual += caracter;
    bytes += b;
  }
  partes.push(actual);
  return partes.join('\r\n ');
};

export const fechaIcs = (iso: string): string => iso.replace(/-/g, '');

const diaSiguiente = (iso: string): string => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
};

/** Estable por entrada: reimportar el archivo actualiza el evento en vez de duplicarlo. */
export const uidDeEntrada = (id: string): string => `${id.replace(/[^A-Za-z0-9-]/g, '')}@agenda.iureon`;

const selloIcs = (d: Date): string => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export const descripcionIcs = (e: EntradaDeAgenda): string =>
  [
    `Actuación: ${e.actuacionNombre}`,
    e.radicado ? `Radicado: ${e.radicado}` : null,
    `Notificado el ${e.fechaNotificacion}${plazoEnPalabras(e)}`,
    e.estado === 'CUMPLIDA' ? 'Estado: cumplido' : null,
    advertenciaSinVerificar(e)
  ]
    .filter(Boolean)
    .join('\n');

export const generarIcs = (
  entradas: EntradaDeAgenda[],
  opciones: { ahora: Date; nombreCalendario?: string }
): string => {
  const sello = selloIcs(opciones.ahora);
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Iureon//Agenda de terminos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escaparTextoIcs(opciones.nombreCalendario ?? 'Agenda de términos')}`
  ];
  for (const e of entradas) {
    lineas.push(
      'BEGIN:VEVENT',
      `UID:${uidDeEntrada(e.id)}`,
      `DTSTAMP:${sello}`,
      /* Día completo: DTEND es el día siguiente, exclusivo (RFC 5545 §3.6.1). */
      `DTSTART;VALUE=DATE:${fechaIcs(e.fechaLimite)}`,
      `DTEND;VALUE=DATE:${fechaIcs(diaSiguiente(e.fechaLimite))}`,
      `SUMMARY:${escaparTextoIcs(`Vence: ${e.asunto}`)}`,
      `DESCRIPTION:${escaparTextoIcs(descripcionIcs(e))}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT'
    );
  }
  lineas.push('END:VCALENDAR');
  return `${lineas.map(plegarLineaIcs).join('\r\n')}\r\n`;
};
