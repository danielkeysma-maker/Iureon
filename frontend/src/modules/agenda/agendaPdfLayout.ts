import type { jsPDF } from 'jspdf';
import { lineasDeMembrete, type DatosDeMembrete } from '../documents/services/membrete';
import { lineasDeEntradaParaPdf } from './agendaExportable';
import type { EntradaDeAgenda } from './types';

/**
 * LA AGENDA EN PAPEL, CON EL MEMBRETE DE LA FIRMA.
 *
 * Mismo papel que los demás documentos de la aplicación: carta, 3 cm a la
 * izquierda y 2,5 el resto, la letra de Membrete y, arriba de la primera hoja,
 * solo lo que la firma escribió en su membrete (`lineasDeMembrete`): sin nombre
 * no hay cabecera, y ningún relleno se imprime como si fuera de la firma.
 *
 * ─── UN TÉRMINO NO SE PARTE ENTRE DOS HOJAS ─────────────────────────────────
 *
 * La fecha arriba y el asunto abajo, en hojas distintas, es un término que se
 * lee mal justo cuando se imprime para vigilarlo. Cada bloque pide su alto
 * completo antes de dibujarse.
 *
 * ─── EL GUION ES DE LO QUE NADIE VERIFICÓ, TAMBIÉN EN PAPEL ─────────────────
 *
 * Como en la pantalla: el término sin verificar lleva su filete discontinuo al
 * margen y la advertencia escrita. Sin color, para que sobreviva a la
 * fotocopia.
 *
 * Separado de la descarga para correr en Node con la Helvetica de jsPDF:
 * `npm run check:agenda-exportar` lee lo que queda escrito.
 */

const PAGINA = { ancho: 215.9, alto: 279.4, izq: 30, der: 25, arriba: 25, abajo: 25 };
const TINTA: [number, number, number] = [16, 24, 34];
const GRIS: [number, number, number] = [102, 116, 135];
const FILETE: [number, number, number] = [195, 203, 214];

export interface DatosDelPdfDeAgenda {
  entradas: EntradaDeAgenda[];
  /** Qué se exportó: «Términos pendientes de septiembre de 2026». */
  rotulo: string;
  /** Fecha de generación, ya escrita en palabras. */
  fecha: string;
  membrete: DatosDeMembrete | null;
  logoUrl?: string | null;
  cuerpoPt?: number;
}

export const dibujarAgendaEnPdf = (doc: jsPDF, F: string, datos: DatosDelPdfDeAgenda): void => {
  const cuerpo = datos.cuerpoPt ?? 11;
  const anchoTexto = PAGINA.ancho - PAGINA.izq - PAGINA.der;
  const lineaMm = (pt: number): number => (pt * 1.35 * 25.4) / 72;
  const fondo = PAGINA.alto - PAGINA.abajo;
  let y = PAGINA.arriba;

  const pluma = (pt: number, estilo: 'normal' | 'bold' | 'italic', color = TINTA): void => {
    doc.setFont(F, estilo);
    doc.setFontSize(pt);
    doc.setTextColor(...color);
  };
  const filete = (): void => {
    doc.setDrawColor(...FILETE);
    doc.setLineWidth(0.3);
    doc.line(PAGINA.izq, y, PAGINA.ancho - PAGINA.der, y);
  };

  /* ─── Membrete, solo en la primera hoja ─────────────────────────────────── */
  const membrete = lineasDeMembrete(datos.membrete ?? {});
  if (membrete.tieneMembrete) {
    let x = PAGINA.izq;
    if (datos.logoUrl && /^data:image\/(png|jpe?g)/.test(datos.logoUrl)) {
      try {
        doc.addImage(datos.logoUrl, PAGINA.izq, y - 4, 22, 12.5, undefined, 'FAST');
        x = PAGINA.izq + 26;
      } catch {
        /* Un logo ilegible no tumba la exportación. */
      }
    }
    if (membrete.encabezado) {
      pluma(cuerpo, 'bold');
      doc.text(membrete.encabezado, x, y);
      y += lineaMm(cuerpo);
    }
    if (membrete.identificacion) {
      pluma(cuerpo - 2, 'normal', GRIS);
      doc.text(membrete.identificacion, x, y);
      y += lineaMm(cuerpo - 2);
    }
    y = Math.max(y, PAGINA.arriba + 10);
    filete();
    y += lineaMm(cuerpo) * 1.4;
  }

  /* ─── Qué es este papel ─────────────────────────────────────────────────── */
  pluma(cuerpo + 4, 'bold');
  doc.text('AGENDA DE TÉRMINOS', PAGINA.izq, y);
  y += lineaMm(cuerpo + 4);
  pluma(cuerpo - 1, 'normal', GRIS);
  const total = datos.entradas.length;
  doc.text(`${datos.rotulo} · ${total} ${total === 1 ? 'término' : 'términos'} · generado el ${datos.fecha}`, PAGINA.izq, y);
  y += lineaMm(cuerpo) * 1.6;

  if (total === 0) {
    pluma(cuerpo, 'italic', GRIS);
    doc.text('No hay términos que exportar con este filtro.', PAGINA.izq, y);
  }

  /* ─── Un bloque por término ─────────────────────────────────────────────── */
  const tamanos = { negrita: cuerpo, normal: cuerpo - 1, cursiva: cuerpo - 1.5 };
  const estilos = { negrita: 'bold', normal: 'normal', cursiva: 'italic' } as const;

  for (const entrada of datos.entradas) {
    const partidas = lineasDeEntradaParaPdf(entrada)
      .filter((l) => l.texto)
      .map((l) => {
        pluma(tamanos[l.estilo], estilos[l.estilo]);
        return { ...l, renglones: doc.splitTextToSize(l.texto, anchoTexto) as string[] };
      });
    const alto = partidas.reduce((suma, l) => suma + l.renglones.length * lineaMm(tamanos[l.estilo]), 0);

    if (y + alto > fondo) {
      doc.addPage();
      y = PAGINA.arriba;
    }

    const arriba = y - lineaMm(cuerpo) * 0.8;
    for (const l of partidas) {
      pluma(tamanos[l.estilo], estilos[l.estilo], l.estilo === 'cursiva' ? GRIS : TINTA);
      for (const renglon of l.renglones) {
        doc.text(renglon, PAGINA.izq, y);
        y += lineaMm(tamanos[l.estilo]);
      }
    }

    if (!entrada.terminoVerificado) {
      doc.setDrawColor(...GRIS);
      doc.setLineWidth(0.5);
      doc.setLineDashPattern([1.2, 1.2], 0);
      doc.line(PAGINA.izq - 4, arriba, PAGINA.izq - 4, y - lineaMm(cuerpo) * 0.5);
      doc.setLineDashPattern([], 0);
    }

    y += 1.5;
    filete();
    y += lineaMm(cuerpo) * 1.2;
  }

  /* ─── Pie en todas las hojas: la firma y la página real ─────────────────── */
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    pluma(cuerpo - 3, 'normal', GRIS);
    if (membrete.pieIzquierda) doc.text(membrete.pieIzquierda, PAGINA.izq, PAGINA.alto - 14);
    doc.text(`Página ${i} de ${paginas}`, PAGINA.ancho - PAGINA.der, PAGINA.alto - 14, { align: 'right' });
  }
};
