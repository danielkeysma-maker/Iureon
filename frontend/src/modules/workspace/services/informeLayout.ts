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
 *
 * ─── LO QUE EL ABOGADO PIDIÓ AL VER EL PRIMERO ──────────────────────────────
 *
 * Párrafos justificados, como un escrito. Títulos de sección en un gris
 * bastante más oscuro que el cuerpo gris de las notas, para que se distingan
 * de un vistazo. Y sin el conteo de caracteres: ese dato le sirve a la
 * pantalla para explicar el recorte, no a un documento que se archiva.
 */

export interface DatosDelInforme {
  documentType: string;
  fileName: string;
  fecha: string;
  caracteres: number;
  truncado: boolean;
  conFicha: boolean;
  firmName?: string;
  /** Cliente o proceso al que pertenece el escrito, si la firma lo indicó. */
  cliente?: string;
  /** Quién pidió la revisión (correo), para saber qué abogado lleva el asunto. */
  revisadoPor?: string;
  informe: InformeDeRevision;
}

/** Carta con márgenes judiciales: 3 cm izquierda, 2,5 cm derecha, 2,5 arriba y abajo. */
const PAGINA = { ancho: 215.9, alto: 279.4, izq: 30, der: 25, arriba: 25, abajo: 25 };

const TINTA: [number, number, number] = [17, 17, 17];
const TITULO: [number, number, number] = [45, 45, 45];
const NOTA: [number, number, number] = [100, 100, 100];

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

  /**
   * Un bloque de texto. Justificado cuando cabe entero en la página (jsPDF
   * justifica por bloque); si no cabe, se baja de página si es corto, y si
   * es largo se reparte línea a línea alineado a la izquierda, porque un
   * bloque partido no se puede justificar sin estirar su última línea.
   */
  const bloque = (
    texto: string,
    pt: number,
    estilo: 'normal' | 'bold' | 'italic' = 'normal',
    sangria = 0,
    color: [number, number, number] = TINTA,
    justificar = true
  ) => {
    doc.setFont(F, estilo);
    doc.setFontSize(pt);
    doc.setTextColor(...color);
    const ancho = anchoTexto - sangria;
    const lineas = doc.splitTextToSize(texto, ancho) as string[];
    const alto = lineas.length * lineaMm(pt);
    const cabe = y + alto <= PAGINA.alto - PAGINA.abajo;
    const esCorto = alto < (PAGINA.alto - PAGINA.arriba - PAGINA.abajo) * 0.4;

    if (!cabe && esCorto) asegurar(alto);

    if (justificar && lineas.length > 1 && y + alto <= PAGINA.alto - PAGINA.abajo) {
      doc.text(texto, PAGINA.izq + sangria, y, { maxWidth: ancho, align: 'justify' });
      y += alto;
      return;
    }
    for (const l of lineas) {
      asegurar(lineaMm(pt));
      doc.text(l, PAGINA.izq + sangria, y);
      y += lineaMm(pt);
    }
  };

  const titulo = (texto: string) => {
    y += 3;
    asegurar(lineaMm(cuerpoPt) * 2.2);
    doc.setFont(F, 'bold');
    doc.setFontSize(cuerpoPt - 1);
    doc.setTextColor(...TITULO);
    doc.text(texto.toUpperCase(), PAGINA.izq, y);
    y += lineaMm(cuerpoPt - 1) * 0.6;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(PAGINA.izq, y, PAGINA.ancho - PAGINA.der, y);
    y += lineaMm(cuerpoPt) * 0.9;
  };

  const lista = (items: string[]) => {
    for (const it of items) {
      doc.setFont(F, 'normal');
      doc.setFontSize(cuerpoPt);
      doc.setTextColor(...TINTA);
      const lineas = doc.splitTextToSize(it, anchoTexto - 6) as string[];
      asegurar(lineaMm(cuerpoPt) * Math.min(lineas.length, 2));
      doc.text('•', PAGINA.izq + 1.5, y);
      bloque(it, cuerpoPt, 'normal', 6);
      y += 1;
    }
  };

  /* ─── Cabecera ─────────────────────────────────────────────────────────── */
  if (d.firmName) bloque(d.firmName, cuerpoPt - 2, 'normal', 0, NOTA, false);
  bloque(`Revisión del escrito · ${d.documentType}`, cuerpoPt + 5, 'bold', 0, TINTA, false);
  if (d.cliente) bloque(`Cliente o proceso: ${d.cliente}`, cuerpoPt - 1, 'bold', 0, TITULO, false);
  bloque(
    [d.fileName, d.fecha, d.revisadoPor && `revisión pedida por ${d.revisadoPor}`].filter(Boolean).join(' · ') +
      (d.truncado ? ' · el escrito fue recortado a 300.000 caracteres' : ''),
    cuerpoPt - 2,
    'normal',
    0,
    NOTA,
    false
  );
  bloque(
    d.conFicha
      ? `Revisado contra la ficha verificada de «${d.documentType}».`
      : 'Sin ficha verificada de la actuación: lo objetivo va con menos respaldo.',
    cuerpoPt - 2,
    'italic',
    0,
    NOTA,
    false
  );
  y += 2;

  /* ─── Cuerpo, en el orden del diálogo ──────────────────────────────────── */
  const i = d.informe;
  if (i.resumen) bloque(i.resumen, cuerpoPt + 0.5);

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
      if (e.donde) bloque(e.donde, cuerpoPt - 1, 'bold', 0, TITULO, false);
      if (e.problema) bloque(e.problema, cuerpoPt);
      if (e.correccion) bloque(`Corrección: ${e.correccion}`, cuerpoPt, 'italic', 4);
      y += 1.5;
    }
  }
  const citas = i.correccionesTextuales ?? [];
  if (citas.length > 0) {
    titulo('Citas del escrito y reemplazo propuesto');
    for (const c of citas) {
      bloque('Dice:', cuerpoPt - 1.5, 'bold', 0, NOTA, false);
      bloque(`«${c.cita}»`, cuerpoPt, 'italic', 4, TINTA);
      if (c.problema) bloque(c.problema, cuerpoPt - 1, 'normal', 4, NOTA);
      if (c.reemplazo) {
        bloque('Reemplazo propuesto:', cuerpoPt - 1.5, 'bold', 0, TITULO, false);
        bloque(`«${c.reemplazo}»`, cuerpoPt, 'normal', 4, TINTA);
      }
      y += 2;
    }
  }
  seccion('Recomendaciones', i.recomendaciones);

  /* ─── Pie ──────────────────────────────────────────────────────────────── */
  y += 4;
  bloque(
    'Lo marcado como exigencia de la norma sale de la ficha verificada del catálogo; lo demás es criterio profesional del revisor y el abogado decide. El informe no cita providencias: donde se necesite precedente, debe verificarse antes de presentar.',
    cuerpoPt - 2.5,
    'normal',
    0,
    NOTA
  );
};
