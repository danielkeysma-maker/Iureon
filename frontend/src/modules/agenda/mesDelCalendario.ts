import type { CalendarioAnual } from '../tools/types';
import type { EntradaDeAgenda } from './types';

/**
 * EL MES DEL CALENDARIO JUDICIAL, CELDA POR CELDA.
 *
 * ─── POR QUÉ UN MES Y NO EL AÑO ENTERO ─────────────────────────────────────
 *
 * La agenda pintaba doce meses de celdas de nueve píxeles: se veía la carga del
 * año, pero no se podía leer QUÉ vence un día sin pasar el cursor por encima, y
 * en un teléfono no hay cursor. La maqueta (`app-herramientas.html`, artboard
 * del calendario judicial) dibuja un mes con celdas altas y el vencimiento
 * escrito dentro; eso exige saber qué poner en cada celda, y esa decisión se
 * toma aquí, sin React, para poder probarla.
 *
 * ─── AQUÍ NO SE DECIDE QUÉ DÍA ES FESTIVO ──────────────────────────────────
 *
 * Festivos, Semana Santa y vacancia llegan en la respuesta del calendario, que
 * el servidor calcula de la Ley 51 de 1983 y del CGP. Lo único que se deduce en
 * el navegador es el fin de semana. Sin respuesta del servidor no se marca
 * ningún festivo: un mes sin fondo gris es incompleto; uno con festivos
 * supuestos sería falso.
 */

export const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

export interface MesVisto {
  anio: number;
  /** 0 = enero … 11 = diciembre, como `Date`. */
  mes: number;
}

export interface CeldaDelMes {
  fecha: string;
  dia: number;
  finDeSemana: boolean;
  festivo: string | null;
  semanaSanta: boolean;
  vacancia: boolean;
  noHabil: boolean;
  vencimientos: EntradaDeAgenda[];
  sinVerificar: boolean;
}

const iso = (anio: number, mes: number, dia: number): string =>
  `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

/** Celdas vacías antes del día 1, con la semana empezando en lunes. */
export const huecoInicial = (anio: number, mes: number): number => (new Date(Date.UTC(anio, mes, 1)).getUTCDay() + 6) % 7;

export const moverMes = (visto: MesVisto, delta: number): MesVisto => {
  const total = visto.anio * 12 + visto.mes + delta;
  return { anio: Math.floor(total / 12), mes: ((total % 12) + 12) % 12 };
};

export const celdasDelMes = (
  anio: number,
  mes: number,
  calendario: CalendarioAnual | null,
  entradas: EntradaDeAgenda[]
): CeldaDelMes[] => {
  const festivos = new Map((calendario?.festivos ?? []).map((f) => [f.fecha, f.nombre]));
  const semanaSanta = new Set(calendario?.semanaSanta.lunesAMiercoles ?? []);
  /*
   * La vacancia se lee del rango que declaró el servidor, con la misma regla que
   * usaba el calendario del año: el periodo cruza el cambio de año, así que un
   * día está dentro si cae después del inicio O antes del final.
   */
  const enVacancia = (fecha: string): boolean => {
    if (!calendario) return false;
    const mmdd = fecha.slice(5);
    return mmdd >= calendario.vacancia.desde.slice(5) || mmdd <= calendario.vacancia.hasta.slice(5);
  };

  const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  return Array.from({ length: ultimo }, (_, i) => {
    const dia = i + 1;
    const fecha = iso(anio, mes, dia);
    const dow = new Date(`${fecha}T00:00:00Z`).getUTCDay();
    const finDeSemana = dow === 0 || dow === 6;
    const festivo = festivos.get(fecha) ?? null;
    const santa = semanaSanta.has(fecha);
    const vacancia = enVacancia(fecha);
    const vencimientos = entradas.filter((e) => e.fechaLimite === fecha);
    return {
      fecha,
      dia,
      finDeSemana,
      festivo,
      semanaSanta: santa,
      vacancia,
      noHabil: finDeSemana || festivo !== null || santa || vacancia,
      vencimientos,
      sinVerificar: vencimientos.some((e) => !e.terminoVerificado)
    };
  });
};

/**
 * LO QUE SE ESCRIBE DENTRO DE LA CELDA. El vencimiento de la firma manda sobre
 * el festivo: es lo único del día que es del abogado. Si hay varios se nombra
 * el primero y se cuentan los demás, porque la celda no tiene sitio para una
 * lista y cortar en silencio escondería un término.
 */
export const rotuloDelDia = (celda: CeldaDelMes): string | null => {
  if (celda.vencimientos.length > 0) {
    const [primero, ...resto] = celda.vencimientos;
    return resto.length > 0 ? `${primero.asunto} y ${resto.length} más` : primero.asunto;
  }
  if (celda.festivo) return celda.festivo;
  if (celda.semanaSanta) return 'Semana Santa';
  return null;
};
