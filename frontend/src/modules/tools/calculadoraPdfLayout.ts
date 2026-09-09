import type { jsPDF } from 'jspdf';
import type { LibroExcel } from './exportarExcel';

/**
 * El resultado de una calculadora, dibujado en PDF para imprimirlo.
 *
 * ─── EL MISMO OBJETO QUE EL EXCEL ───────────────────────────────────────────
 *
 * Este módulo dibuja un `LibroExcel` —el mismo que ya arma cada calculadora—
 * y no recibe ningún dato aparte. Así es imposible que el PDF y la hoja de
 * cálculo digan cosas distintas: si el número cambia, cambia en los dos, y si
 * una fuente falta, falta en los dos. Nada se inventa aquí; se imprime lo que
 * el objeto trae.
 *
 * ─── LAS FUENTES NO SON OPCIONALES ──────────────────────────────────────────
 *
 * Igual que en el libro de Excel: un número que sale de esta aplicación sin su
 * fuente se convierte, en un escrito, en un número que nadie puede defender.
 * La sección de fuentes se dibuja siempre, aunque ocupe otra página; si el
 * objeto viniera sin fuentes, el PDF lo dice en vez de callarlo.
 *
 * ─── SEPARADO DEL SERVICIO A PROPÓSITO ──────────────────────────────────────
 *
 * Este archivo no importa fuentes tipográficas ni nada de Vite, así que corre
 * en Node con la Helvetica incorporada de jsPDF: `npm run check:calculadoras`
 * comprueba que las secciones estén todas, que el detalle pagine y que el
 * nombre del archivo salga bien. `exportarPdf.ts` pone la letra de Membrete y
 * descarga; aquí solo se dibuja.
 */

/** Carta con márgenes judiciales: 3 cm izquierda, 2,5 el resto. Los del informe. */
const PAGINA = { ancho: 215.9, alto: 279.4, izq: 30, der: 25, arriba: 25, abajo: 25 };

const TINTA: [number, number, number] = [17, 17, 17];
const TITULO: [number, number, number] = [45, 45, 45];
const NOTA: [number, number, number] = [100, 100, 100];

/**
 * Tope de filas del detalle. No es un recorte de diseño: es la defensa contra
 * un cálculo que devuelva miles de renglones y produzca un PDF que nadie
 * imprime. Si se alcanza, el PDF lo dice en la propia hoja —nunca en silencio—
 * y remite al Excel, que no tiene tope.
 */
export const MAX_FILAS_DETALLE = 400;

/** Rótulo legible a partir del nombre de archivo, cuando la calculadora no dio título. */
export const tituloDeLibro = (libro: LibroExcel): string => {
  if (libro.titulo) return libro.titulo;
  const palabras = libro.archivo.replace(/-/g, ' ').trim();
  return palabras.charAt(0).toUpperCase() + palabras.slice(1);
};

/** `competencia-cuantia` + `2026-09-09` → `competencia-cuantia-2026-09-09.pdf`. */
export const nombreDePdf = (libro: LibroExcel, hoy: string): string => `${libro.archivo}-${hoy}.pdf`;

export const dibujarCalculadoraEnPdf = (doc: jsPDF, F: string, libro: LibroExcel, fecha: string, cuerpoPt = 11): void => {
  const anchoTexto = PAGINA.ancho - PAGINA.izq - PAGINA.der;
  const lineaMm = (pt: number) => (pt * 1.4 * 25.4) / 72;
  const fondo = PAGINA.alto - PAGINA.abajo;
  let y = PAGINA.arriba;

  const asegurar = (alto: number) => {
    if (y + alto > fondo) {
      doc.addPage();
      y = PAGINA.arriba;
    }
  };

  const pluma = (pt: number, estilo: 'normal' | 'bold' | 'italic', color: [number, number, number]) => {
    doc.setFont(F, estilo);
    doc.setFontSize(pt);
    doc.setTextColor(...color);
  };

  /**
   * Un bloque de prosa. Justificado cuando cabe entero —jsPDF justifica por
   * bloque—; si no cabe, se reparte línea a línea comprobando el corte de
   * página en cada una, porque un renglón partido a la mitad no se lee.
   */
  const bloque = (
    texto: string,
    pt: number,
    estilo: 'normal' | 'bold' | 'italic' = 'normal',
    sangria = 0,
    color: [number, number, number] = TINTA,
    justificar = true
  ) => {
    pluma(pt, estilo, color);
    const ancho = anchoTexto - sangria;
    const lineas = doc.splitTextToSize(texto, ancho) as string[];
    const alto = lineas.length * lineaMm(pt);
    const esCorto = alto < (PAGINA.alto - PAGINA.arriba - PAGINA.abajo) * 0.4;
    if (y + alto > fondo && esCorto) asegurar(alto);

    if (justificar && lineas.length > 1 && y + alto <= fondo) {
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
    // El título no se queda solo al pie: pide sitio para él y para lo que sigue.
    asegurar(lineaMm(cuerpoPt) * 3);
    pluma(cuerpoPt - 1, 'bold', TITULO);
    doc.text(texto.toUpperCase(), PAGINA.izq, y);
    y += lineaMm(cuerpoPt - 1) * 0.6;
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.3);
    doc.line(PAGINA.izq, y, PAGINA.ancho - PAGINA.der, y);
    y += lineaMm(cuerpoPt) * 0.9;
  };

  /* ─── Cabecera: qué se calculó y cuándo ────────────────────────────────── */
  bloque(tituloDeLibro(libro), cuerpoPt + 5, 'bold', 0, TINTA, false);
  bloque(`Generado el ${fecha} · Iureon`, cuerpoPt - 2, 'normal', 0, NOTA, false);
  y += 1.5;

  /* ─── Resultado: las cifras que se pegan en el escrito ─────────────────── */
  titulo('Resultado');
  const anchoConcepto = Math.min(78, anchoTexto * 0.52);
  for (const [concepto, valor] of libro.resultado) {
    pluma(cuerpoPt, 'normal', TINTA);
    const izquierda = doc.splitTextToSize(String(concepto), anchoConcepto - 3) as string[];
    pluma(cuerpoPt, 'bold', TINTA);
    const derecha = doc.splitTextToSize(String(valor ?? ''), anchoTexto - anchoConcepto) as string[];
    const alto = Math.max(izquierda.length, derecha.length) * lineaMm(cuerpoPt);
    // Concepto y valor no se separan nunca: un valor sin su concepto no dice nada.
    asegurar(alto);
    const base = y;
    pluma(cuerpoPt, 'normal', TITULO);
    izquierda.forEach((l, i) => doc.text(l, PAGINA.izq, base + i * lineaMm(cuerpoPt)));
    pluma(cuerpoPt, 'bold', TINTA);
    derecha.forEach((l, i) => doc.text(l, PAGINA.izq + anchoConcepto, base + i * lineaMm(cuerpoPt)));
    y = base + alto;
  }

  /* ─── Notas: supuestos, fórmula, advertencias. Prosa, justificada ──────── */
  if (libro.notas?.length) {
    titulo('Notas');
    for (const nota of libro.notas) {
      if (!nota) continue;
      bloque(nota, cuerpoPt - 1, 'normal', 0, TINTA);
      y += 1.2;
    }
  }

  /* ─── Detalle: la tabla que sostiene las cifras ────────────────────────── */
  const columnas = libro.detalle.columnas;
  if (columnas.length) {
    titulo('Detalle');
    const filas = libro.detalle.filas.slice(0, MAX_FILAS_DETALLE);
    const recortadas = libro.detalle.filas.length - filas.length;

    // El ancho de cada columna sale de su contenido, acotado al ancho útil.
    pluma(cuerpoPt - 2, 'normal', TINTA);
    const deseado = columnas.map((c, i) =>
      Math.max(doc.getTextWidth(String(c)), ...filas.map((f) => doc.getTextWidth(String(f[i] ?? ''))), 12)
    );
    const suma = deseado.reduce((a, b) => a + b, 0) || 1;
    const anchos = deseado.map((d) => Math.max(14, (d / suma) * (anchoTexto - 2 * columnas.length)));
    const total = anchos.reduce((a, b) => a + b, 0) + 2 * columnas.length;
    const escala = total > anchoTexto ? (anchoTexto - 2 * columnas.length) / (total - 2 * columnas.length) : 1;
    const ancho = anchos.map((a) => a * escala);
    const x = ancho.map((_, i) => PAGINA.izq + ancho.slice(0, i).reduce((a, b) => a + b + 2, 0));

    const cabecera = () => {
      pluma(cuerpoPt - 2, 'bold', TITULO);
      const lineas = columnas.map((c, i) => doc.splitTextToSize(String(c), ancho[i]) as string[]);
      const alto = Math.max(...lineas.map((l) => l.length)) * lineaMm(cuerpoPt - 2);
      const base = y;
      lineas.forEach((ls, i) => ls.forEach((l, k) => doc.text(l, x[i], base + k * lineaMm(cuerpoPt - 2))));
      y = base + alto + 1;
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.line(PAGINA.izq, y, PAGINA.ancho - PAGINA.der, y);
      y += lineaMm(cuerpoPt - 2) * 0.7;
    };
    cabecera();

    for (const fila of filas) {
      pluma(cuerpoPt - 2, 'normal', TINTA);
      const celdas = columnas.map((_, i) => doc.splitTextToSize(String(fila[i] ?? ''), ancho[i]) as string[]);
      const alto = Math.max(1, ...celdas.map((c) => c.length)) * lineaMm(cuerpoPt - 2);
      // Una fila entera o ninguna: media fila al pie de la página no se lee.
      if (y + alto > fondo) {
        doc.addPage();
        y = PAGINA.arriba;
        cabecera();
      }
      const base = y;
      celdas.forEach((ls, i) => ls.forEach((l, k) => doc.text(l, x[i], base + k * lineaMm(cuerpoPt - 2))));
      y = base + alto + 0.6;
    }

    if (recortadas > 0) {
      y += 1.5;
      bloque(
        `Se imprimieron las primeras ${MAX_FILAS_DETALLE} filas del detalle; quedaron ${recortadas} sin imprimir. El archivo de Excel las trae todas.`,
        cuerpoPt - 2,
        'italic',
        0,
        NOTA
      );
    }
  }

  /* ─── Fuentes: nunca se omiten, aunque queden largas ───────────────────── */
  titulo('Fuentes');
  if (!libro.fuentes.length) {
    bloque('Este cálculo salió sin fuentes declaradas. Verifíquelo antes de usarlo en un escrito.', cuerpoPt - 1, 'italic', 0, NOTA);
  }
  for (const f of libro.fuentes) {
    bloque(f.nombre, cuerpoPt - 1, 'bold', 0, TINTA, false);
    bloque(f.norma, cuerpoPt - 2, 'normal', 4, TITULO);
    bloque(f.url, cuerpoPt - 2, 'normal', 4, NOTA, false);
    bloque(`Consultada el ${f.consultadoEl}`, cuerpoPt - 2, 'italic', 4, NOTA, false);
    y += 1.5;
  }
};
