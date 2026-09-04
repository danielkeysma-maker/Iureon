import React, { useEffect, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { toolsApi } from '../services/tools.api';
import type { CalendarioAnual } from '../types';
import { exportarExcel } from '../exportarExcel';
import { FuentesBox } from './FuentesBox';

/**
 * Calendario judicial. Diálogo tipo 3 en L: a year is a table.
 *
 * The holidays are computed on the server from Ley 51 de 1983 (fixed dates,
 * dates moved to Monday, dates relative to Easter), so any year is available
 * and each row says which rule produced it. The vacancia judicial is shown as
 * a separate period; the Monday–Wednesday of Semana Santa is vacancia by
 * Decreto 1660 de 1978 art. 107 (default on) except for despachos penales,
 * hence the toggle, which also tells the reader to check the year's circular.
 */
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const REGLA: Record<CalendarioAnual['festivos'][number]['regla'], string> = {
  FIJO: 'Fecha fija',
  TRASLADO_LUNES: 'Trasladado al lunes',
  PASCUA: 'Relativo a Pascua'
};

const fechaLarga = (iso: string): string =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });

export const CalendarioModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  // Default on: Decreto 1660 de 1978 art. 107 lit. a) makes the week vacancia; off for penal.
  const [semanaSantaCompleta, setSemanaSantaCompleta] = useState(true);
  const [calendario, setCalendario] = useState<CalendarioAnual | null>(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let vigente = true;
    setCargando(true);
    setError('');
    toolsApi
      .calendario(anio, semanaSantaCompleta)
      .then((c) => {
        if (vigente) setCalendario(c);
      })
      .catch((e: unknown) => {
        if (!vigente) return;
        setCalendario(null);
        setError(e instanceof Error ? e.message : 'No se pudo construir el calendario.');
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [isOpen, anio, semanaSantaCompleta]);

  const exportar = () => {
    if (!calendario) return;
    exportarExcel({
      archivo: `calendario-judicial-${calendario.anio}`,
      resultado: [
        ['Año', calendario.anio],
        ['Festivos (Ley 51 de 1983)', calendario.festivos.length],
        ['Vacancia judicial', `${calendario.vacancia.desde} a ${calendario.vacancia.hasta}`],
        ['Jueves Santo', calendario.semanaSanta.jueves],
        ['Viernes Santo', calendario.semanaSanta.viernes],
        ['Lunes a miércoles de Semana Santa descontados', semanaSantaCompleta ? 'Sí (Decreto 1660 de 1978, art. 107)' : 'No (despachos penales)'],
        ...calendario.diasHabilesPorMes.map((m) => [`Días hábiles · ${MESES[m.mes - 1]}`, m.habiles] as [string, number])
      ],
      detalle: {
        columnas: ['Fecha', 'Festivo', 'Regla', 'Fecha original'],
        filas: calendario.festivos.map((f) => [f.fecha, f.nombre, REGLA[f.regla], f.fechaOriginal ?? ''])
      },
      fuentes: calendario.fuentes,
      notas: [calendario.vacancia.descripcion, calendario.semanaSanta.nota]
    });
  };

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      tamano="L"
      titulo="Calendario judicial"
      subtitulo="Festivos de la Ley 51 de 1983, vacancia judicial y Semana Santa, con la regla de cada fecha."
      cuerpoEnCanvas
      acciones={
        calendario ? (
          <button onClick={exportar} className="btn-neutral btn-sm">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Exportar a Excel
          </button>
        ) : undefined
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="field-label">Año</span>
            <input
              type="number"
              min={1984}
              max={2200}
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              className="field mt-1 w-[120px] font-mono"
            />
          </label>
          <label className="flex items-center gap-2 pb-2 text-ui text-ink-700">
            <input type="checkbox" checked={semanaSantaCompleta} onChange={(e) => setSemanaSantaCompleta(e.target.checked)} />
            Descontar lunes a miércoles de Semana Santa (Decreto 1660 de 1978, art. 107; no aplica a despachos penales — verifique la circular del año)
          </label>
        </div>

        {cargando && <p className="text-meta text-ink-500">Calculando…</p>}
        {error && <p className="notice-unverified">{error}</p>}

        {calendario && !cargando && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_260px]">
              <div className="overflow-hidden rounded-card border border-line-200 bg-surface">
                <p className="t-head">{calendario.festivos.length} festivos · Ley 51 de 1983</p>
                {calendario.festivos.map((f) => (
                  <div key={f.fecha} className="t-row flex items-center gap-3">
                    <span className="w-[92px] shrink-0 font-mono text-[12px] text-ink-900">{f.fecha}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-ui text-ink-900">{f.nombre}</span>
                      <span className="block text-meta capitalize text-ink-500">{fechaLarga(f.fecha)}</span>
                    </span>
                    <span className="shrink-0 text-right text-meta text-ink-500">
                      {REGLA[f.regla]}
                      {f.fechaOriginal && f.fechaOriginal !== f.fecha ? ` · era ${f.fechaOriginal.slice(5)}` : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <div className="overflow-hidden rounded-card border border-line-200 bg-surface">
                  <p className="t-head">Días hábiles por mes</p>
                  {calendario.diasHabilesPorMes.map((m) => (
                    <div key={m.mes} className="t-row flex items-center justify-between">
                      <span className="text-ui text-ink-900">{MESES[m.mes - 1]}</span>
                      <span className="font-mono text-[12px] text-ink-900">{m.habiles}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="notice">
              Vacancia judicial: del {calendario.vacancia.desde} al {calendario.vacancia.hasta}. {calendario.vacancia.descripcion}
            </p>
            <p className="notice">
              Semana Santa: jueves {calendario.semanaSanta.jueves} y viernes {calendario.semanaSanta.viernes}. {calendario.semanaSanta.nota}
            </p>

            <FuentesBox fuentes={calendario.fuentes} />
          </div>
        )}
      </div>
    </Dialog>
  );
};
