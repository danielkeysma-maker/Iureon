import React from 'react';
import type { CalendarioAnual } from '../../tools/types';
import type { EntradaDeAgenda } from '../types';

/**
 * EL AÑO CON LOS TÉRMINOS DE LA FIRMA ENCIMA.
 *
 * ─── QUÉ PINTA CADA COLOR, Y DE DÓNDE SALE ──────────────────────────────────
 *
 * El fondo del año son los días que no cuentan: sábados y domingos, los
 * festivos de la Ley 51 de 1983, la vacancia del 20 de diciembre al 10 de enero
 * y el lunes a miércoles de Semana Santa. TODOS menos el fin de semana los
 * calcula el servidor y llegan en la respuesta del calendario: aquí no se
 * decide qué día es festivo en Colombia, se pinta lo que el motor dijo. Encima
 * van los vencimientos de la firma, en oro macizo.
 *
 * ─── UN CALENDARIO NO ES UNA TABLA ──────────────────────────────────────────
 *
 * Se dibuja con `grid` y no con `<table>` por la razón que está escrita en
 * `design/ANCHO-EN-MOVIL.md`: una celda de tabla no es un ítem flex y el
 * algoritmo de tabla no baja del mínimo de cada columna, así que doce meses en
 * una tabla se cortan en un teléfono sin que la página desborde. Con `grid` y
 * `min-w-0` cada mes encoge hasta donde haga falta.
 */

const MESES = [
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

/** Lunes primero, como se lee un calendario judicial. */
const CABECERA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const iso = (anio: number, mes: number, dia: number): string =>
  `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;

interface Props {
  anio: number;
  calendario: CalendarioAnual | null;
  entradas: EntradaDeAgenda[];
  onElegirDia?: (fecha: string) => void;
}

export const CalendarioDelAno: React.FC<Props> = ({ anio, calendario, entradas, onElegirDia }) => {
  const festivos = new Map((calendario?.festivos ?? []).map((f) => [f.fecha, f.nombre]));
  const semanaSanta = new Set(calendario?.semanaSanta.lunesAMiercoles ?? []);

  const vencimientos = new Map<string, EntradaDeAgenda[]>();
  for (const e of entradas) {
    const lista = vencimientos.get(e.fechaLimite) ?? [];
    lista.push(e);
    vencimientos.set(e.fechaLimite, lista);
  }

  /* La vacancia se dibuja del rango que declaró el servidor, no de una regla
     escrita aquí: la norma vive en un solo sitio. */
  const enVacancia = (fecha: string): boolean => {
    if (!calendario) return false;
    const mmdd = fecha.slice(5);
    return mmdd >= calendario.vacancia.desde.slice(5) || mmdd <= calendario.vacancia.hasta.slice(5);
  };

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {MESES.map((nombre, mes) => {
        const ultimo = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
        /* getUTCDay: 0 domingo … 6 sábado. Con la semana empezando en lunes, el
           hueco inicial es 6 para un domingo y dow−1 para el resto. */
        const primerDia = new Date(Date.UTC(anio, mes, 1)).getUTCDay();
        const hueco = (primerDia + 6) % 7;

        return (
          <div key={nombre} className="min-w-0 rounded-card border border-line-200 bg-surface p-2.5">
            <p className="mb-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              {nombre}
            </p>
            <div className="grid grid-cols-7 gap-[2px]">
              {CABECERA.map((l, i) => (
                <span key={`${l}-${i}`} className="text-center font-mono text-[9px] text-ink-400">
                  {l}
                </span>
              ))}
              {Array.from({ length: hueco }).map((_, i) => (
                <span key={`hueco-${i}`} />
              ))}
              {Array.from({ length: ultimo }).map((_, i) => {
                const dia = i + 1;
                const fecha = iso(anio, mes, dia);
                const dow = new Date(`${fecha}T00:00:00Z`).getUTCDay();
                const finDeSemana = dow === 0 || dow === 6;
                const festivo = festivos.get(fecha);
                const noHabil = finDeSemana || Boolean(festivo) || semanaSanta.has(fecha) || enVacancia(fecha);
                const delDia = vencimientos.get(fecha) ?? [];
                const vence = delDia.length > 0;
                const sinVerificar = delDia.some((e) => !e.terminoVerificado);

                const titulo = [
                  festivo ? `Festivo · ${festivo}` : null,
                  semanaSanta.has(fecha) ? 'Vacancia de Semana Santa' : null,
                  enVacancia(fecha) ? 'Vacancia judicial' : null,
                  ...delDia.map((e) => `Vence: ${e.asunto} · ${e.actuacionNombre}`)
                ]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <button
                    key={fecha}
                    type="button"
                    title={titulo || fecha}
                    onClick={onElegirDia && vence ? () => onElegirDia(fecha) : undefined}
                    className={[
                      'aspect-square min-w-0 rounded-[3px] text-center font-mono text-[9px] leading-none',
                      'flex items-center justify-center',
                      vence
                        ? sinVerificar
                          ? 'bg-[rgb(var(--rail-gold))] font-bold text-ink-900 ring-2 ring-[rgb(var(--unverified-line))]'
                          : 'bg-[rgb(var(--rail-gold))] font-bold text-ink-900'
                        : noHabil
                          ? 'bg-ink-900/[0.12] text-ink-400'
                          : 'bg-ink-900/[0.04] text-ink-500'
                    ].join(' ')}
                  >
                    {dia}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
