import * as XLSX from 'xlsx';

/**
 * Excel export shared by every calculator in Herramientas.
 *
 * ─── THREE SHEETS, ALWAYS ───────────────────────────────────────────────────
 *
 * «Resultado» carries the figures the lawyer will paste into a filing;
 * «Detalle» the rows behind them (each excluded day, each interest period,
 * each holiday); «Fuentes» every official source the computation relied on,
 * with its URL and the date it was consulted. The third sheet is not optional:
 * a number that leaves this application without its source becomes, in a
 * brief, a number nobody can defend. The workbook travels with the same
 * evidence the screen shows.
 *
 * ─── WHY NOT A CSV ──────────────────────────────────────────────────────────
 *
 * A CSV cannot hold three sheets, and Excel opens a UTF-8 CSV with broken
 * accents unless it carries a BOM. `xlsx` writes a real workbook the firm's
 * accountant opens without a prompt.
 */

export interface FuenteExportable {
  nombre: string;
  norma: string;
  url: string;
  consultadoEl: string;
}

export interface LibroExcel {
  /** File name without extension; the date is appended. */
  archivo: string;
  resultado: Array<[string, string | number]>;
  detalle: { columnas: string[]; filas: Array<Array<string | number>> };
  fuentes: FuenteExportable[];
  /** A note printed under the result: assumptions, formula, warnings. */
  notas?: string[];
}

const anchoDe = (filas: Array<Array<string | number>>): XLSX.ColInfo[] => {
  const anchos: number[] = [];
  for (const fila of filas) {
    fila.forEach((celda, i) => {
      const largo = String(celda ?? '').length;
      anchos[i] = Math.min(80, Math.max(anchos[i] ?? 10, largo + 2));
    });
  }
  return anchos.map((wch) => ({ wch }));
};

export const exportarExcel = (libro: LibroExcel): void => {
  const wb = XLSX.utils.book_new();

  const resultado: Array<Array<string | number>> = [['Concepto', 'Valor'], ...libro.resultado];
  if (libro.notas?.length) {
    resultado.push([]);
    for (const nota of libro.notas) resultado.push(['Nota', nota]);
  }
  const hojaResultado = XLSX.utils.aoa_to_sheet(resultado);
  hojaResultado['!cols'] = anchoDe(resultado);
  XLSX.utils.book_append_sheet(wb, hojaResultado, 'Resultado');

  const detalle = [libro.detalle.columnas, ...libro.detalle.filas];
  const hojaDetalle = XLSX.utils.aoa_to_sheet(detalle);
  hojaDetalle['!cols'] = anchoDe(detalle);
  XLSX.utils.book_append_sheet(wb, hojaDetalle, 'Detalle');

  const fuentes: Array<Array<string | number>> = [
    ['Dato', 'Norma o acto', 'URL oficial', 'Fecha de consulta'],
    ...libro.fuentes.map((f) => [f.nombre, f.norma, f.url, f.consultadoEl])
  ];
  const hojaFuentes = XLSX.utils.aoa_to_sheet(fuentes);
  hojaFuentes['!cols'] = anchoDe(fuentes);
  XLSX.utils.book_append_sheet(wb, hojaFuentes, 'Fuentes');

  const hoy = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${libro.archivo}-${hoy}.xlsx`);
};
