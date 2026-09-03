import type { jsPDF } from 'jspdf';
import type { InformeDeRevision } from './review.api';

/**
 * El informe de revisión, dibujado en PDF con la misma estructura del diálogo.
 *
 * Separado del servicio de exportación a propósito: este módulo no importa
 * archivos de fuentes ni nada de Vite, así que se puede correr en Node con la
 * Helvetica incorporada de jsPDF y comprobar que pagina, que no corta líneas
 * y que cada sección aparece donde debe. El servicio pone la letra de la firma
 * y descarga; aquí solo se dibuja.
 */

export interface DatosDelInforme {
  documentType: string;
  fileName: string;
  fecha: string;
  caracteres: number;
  truncado: boolean;
  conFicha: boolean;
  firmName?: string;
  informe: InformeDeRevision;
}

/** Carta con márgenes judiciales: 3 cm izquierda, 2,5 cm derecha, 2,5 arriba y abajo. */
const PAGINA = { ancho: 215.9, alto: 279.4, izq: 30, der: 25, arriba: 25, abajo: 25 };

export const dibujarInformeEnPdf = (doc: jsPDF, F: string, d: DatosDelInforme, cuerpoPt = 11): void => {
  const anchoTexto = PAGINA.ancho - PAGINA.izq - PAGINA.der;
  const lineaMm = (pt: number) => (pt * 1.4 * 25.4) / 72;
  let y = PAGINA.arriba;

  const asegurar = (alto: number) => {
    if (y + alto > PAGINA.alto - PAGINA.abajo) {
      doc.addPage();
      y = PAGINA.arriba;
    }
  };

  const parrafo = (texto: string, pt: number, estilo: 'normal' | 'bold' | 'italic' = 'normal', sangria = 0, color: [number, number, number] = [17, 17, 17]) => {
    doc.setFont(F, estilo);
    doc.setFontSize(pt);
    doc.setTextColor(...color);
    const lineas = doc.splitTextToSize(texto, anchoTexto - sangria) as string[];
    for (const l of lineas) {
      asegurar(lineaMm(pt));
      doc.text(l, PAGINA.izq + sangria, y);
      y += lineaMm(pt);
    }
  };

  const titulo = (texto: string) => {
    y += 3;
    asegurar(lineaMm(cuerpoPt) * 2);
    doc.setFont(F, 'bold');
    doc.setFontSize(cuerpoPt - 1.5);
    doc.setTextColor(85, 85, 85);
    doc.text(texto.toUpperCase(), PAGINA.izq, y);
    y += lineaMm(cuerpoPt - 1.5) * 0.6;
    doc.setDrawColor(200, 200, 200);
    doc.line(PAGINA.izq, y, PAGINA.ancho - PAGINA.der, y);
    y += lineaMm(cuerpoPt) * 0.9;
  };

  const lista = (items: string[]) => {
    for (const it of items) {
      doc.setFont(F, 'normal');
      doc.setFontSize(cuerpoPt);
      doc.setTextColor(17, 17, 17);
      const lineas = doc.splitTextToSize(it, anchoTexto - 6) as string[];
      asegurar(lineaMm(cuerpoPt));
      doc.text('•', PAGINA.izq + 1.5, y);
      for (const l of lineas) {
        asegurar(lineaMm(cuerpoPt));
        doc.text(l, PAGINA.izq + 6, y);
        y += lineaMm(cuerpoPt);
      }
      y += 1;
    }
  };

  /* ─── Cabecera ─────────────────────────────────────────────────────────── */
  if (d.firmName) parrafo(d.firmName, cuerpoPt - 2, 'normal', 0, [85, 85, 85]);
  parrafo(`Revisión del escrito · ${d.documentType}`, cuerpoPt + 5, 'bold');
  parrafo(
    `${d.fileName} · ${d.fecha} · ${d.caracteres.toLocaleString('es-CO')} caracteres${d.truncado ? ' (recortado a 300.000)' : ''}`,
    cuerpoPt - 2,
    'normal',
    0,
    [85, 85, 85]
  );
  parrafo(
    d.conFicha
      ? `Revisado contra la ficha verificada de «${d.documentType}».`
      : 'Sin ficha verificada de la actuación: lo objetivo va con menos respaldo.',
    cuerpoPt - 2,
    'italic',
    0,
    [85, 85, 85]
  );
  y += 2;

  /* ─── Cuerpo, en el orden del diálogo ──────────────────────────────────── */
  const i = d.informe;
  if (i.resumen) parrafo(i.resumen, cuerpoPt + 0.5);

  const seccion = (t: string, items: string[]) => {
    if (items.length === 0) return;
    titulo(t);
    lista(items);
  };
  seccion('Secciones que la norma exige y faltan', i.seccionesFaltantes);
  seccion('Fortalezas', i.fortalezas);
  seccion('Debilidades', i.debilidades);

  if (i.erroresDeAplicacion.length > 0) {
    titulo('Errores de aplicación');
    for (const e of i.erroresDeAplicacion) {
      if (e.donde) parrafo(e.donde, cuerpoPt - 1, 'bold', 0, [85, 85, 85]);
      if (e.problema) parrafo(e.problema, cuerpoPt);
      if (e.correccion) parrafo(`Corrección: ${e.correccion}`, cuerpoPt, 'italic', 4);
      y += 1.5;
    }
  }
  seccion('Recomendaciones', i.recomendaciones);

  /* ─── Pie ──────────────────────────────────────────────────────────────── */
  y += 4;
  parrafo(
    'Lo marcado como exigencia de la norma sale de la ficha verificada del catálogo; lo demás es criterio profesional del revisor y el abogado decide. El informe no cita providencias: donde se necesite precedente, debe verificarse antes de presentar.',
    cuerpoPt - 2.5,
    'normal',
    0,
    [110, 110, 110]
  );
};
