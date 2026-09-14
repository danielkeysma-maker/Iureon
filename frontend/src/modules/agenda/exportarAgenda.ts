import { jsPDF } from 'jspdf';
import { registrarFuenteDelEscrito } from '../documents/services/pdfFonts';
import { getMarcaActual } from '../tenant/services/branding.api';
import { dibujarAgendaEnPdf } from './agendaPdfLayout';
import {
  generarIcs,
  nombreDeArchivoDeAgenda,
  rotuloDelFiltro,
  type FiltroDeExportacion
} from './agendaExportable';
import type { EntradaDeAgenda } from './types';

/**
 * Las dos salidas de la agenda, del lado del navegador.
 *
 * El PDF baja como bajan las calculadoras (`doc.save`, con la letra de
 * Membrete); el .ics, como bajan los CSV de Borradores y Auditoría: un `Blob`
 * y un enlace pulsado desde el código. Ninguna llama al servidor: se exporta lo
 * que la pantalla ya tiene, así que exportar no puede fallar por la red.
 */

const hoyLocal = (d: Date): string => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);

export const exportarAgendaPdf = async (entradas: EntradaDeAgenda[], filtro: FiltroDeExportacion): Promise<void> => {
  const marca = getMarcaActual();
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'letter' });
  const F = await registrarFuenteDelEscrito(doc, marca?.fontFamily ?? 'Times New Roman');
  const hoy = new Date();

  dibujarAgendaEnPdf(doc, F, {
    entradas,
    rotulo: rotuloDelFiltro(filtro),
    fecha: hoy.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
    membrete: marca,
    logoUrl: marca?.logoUrl ?? null,
    cuerpoPt: marca?.fontSizePt ?? 11
  });

  doc.setProperties({ title: 'Agenda de términos', author: marca?.firmName || undefined, creator: 'Iureon' });
  doc.save(nombreDeArchivoDeAgenda('pdf', hoyLocal(hoy), filtro));
};

export const exportarAgendaIcs = (entradas: EntradaDeAgenda[], filtro: FiltroDeExportacion): void => {
  const marca = getMarcaActual();
  const hoy = new Date();
  const ics = generarIcs(entradas, {
    ahora: hoy,
    nombreCalendario: marca?.firmName ? `Términos · ${marca.firmName}` : 'Agenda de términos'
  });
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreDeArchivoDeAgenda('ics', hoyLocal(hoy), filtro);
  a.click();
  /* Un instante de gracia: revocar en el mismo tick puede cortar la descarga en Safari. */
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
