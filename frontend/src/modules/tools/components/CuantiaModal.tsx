import React, { useEffect, useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { toolsApi } from '../services/tools.api';
import type { CuantiaResult, Jurisdiccion, SmlmvAnual } from '../types';
import { exportarExcel } from '../exportarExcel';
import { FuentesBox } from './FuentesBox';

/**
 * Competencia por cuantía. Diálogo tipo 3 —calculadora— en M.
 *
 * The year list comes from the server: only years whose SMLMV was verified
 * against its decree are offered, so the lawyer cannot pick a year the tool
 * would have to guess. CGP art. 26: the SMLMV that counts is the one in force
 * when the demand is filed — hence «año de presentación», not «año de los hechos».
 */
const pesos = (v: number): string => `$${Math.round(v).toLocaleString('es-CO')}`;

export const CuantiaModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [pretension, setPretension] = useState('');
  const [anio, setAnio] = useState<number>(new Date().getFullYear());
  const [jurisdiccion, setJurisdiccion] = useState<Jurisdiccion>('CIVIL');
  const [anios, setAnios] = useState<SmlmvAnual[]>([]);
  const [resultado, setResultado] = useState<CuantiaResult | null>(null);
  const [error, setError] = useState('');
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    toolsApi
      .parametros()
      .then((p) => {
        setAnios(p.smlmv);
        if (!p.smlmv.some((s) => s.anio === anio) && p.smlmv.length) setAnio(p.smlmv[p.smlmv.length - 1].anio);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'No se pudieron leer los salarios mínimos.'));
    // `anio` is intentionally not a dependency: this only re-anchors the default on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const listo = Number(pretension) > 0 && anios.some((s) => s.anio === anio);

  const calcular = async () => {
    if (!listo) return;
    setCalculando(true);
    setError('');
    try {
      setResultado(await toolsApi.cuantia({ pretension: Number(pretension), anio, jurisdiccion }));
    } catch (e) {
      setResultado(null);
      setError(e instanceof Error ? e.message : 'No se pudo determinar la cuantía.');
    } finally {
      setCalculando(false);
    }
  };

  const exportar = () => {
    if (!resultado) return;
    exportarExcel({
      archivo: 'competencia-cuantia',
      resultado: [
        ['Pretensión (pesos)', resultado.pretension],
        ['Año de presentación', resultado.anio],
        ['Jurisdicción', resultado.jurisdiccion],
        ['SMLMV del año', resultado.smlmv],
        ['Decreto', resultado.decreto],
        ['Pretensión en SMLMV', resultado.enSmlmv],
        ['Cuantía', resultado.categoria],
        ['Juez competente', resultado.juez],
        ['Instancia', resultado.instancia]
      ],
      detalle: {
        columnas: ['Categoría', 'Hasta (SMLMV)', 'Hasta (pesos)'],
        filas: resultado.limites.map((l) => [l.categoria, l.hasta ?? 'sin tope', l.hastaPesos ?? 'sin tope'])
      },
      fuentes: resultado.fuentes,
      notas: [resultado.regla, ...resultado.advertencias]
    });
  };

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      tamano="M"
      titulo="Competencia por cuantía"
      subtitulo="Mínima, menor o mayor cuantía según el salario mínimo del año de presentación."
      acciones={
        <>
          {resultado && (
            <button onClick={exportar} className="btn-neutral btn-sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar a Excel
            </button>
          )}
          <button onClick={() => void calcular()} disabled={calculando || !listo} className="btn-primary btn-sm">
            {calculando ? 'Calculando…' : 'Determinar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="field-label">Pretensión (pesos)</span>
            <input
              type="text"
              inputMode="numeric"
              value={pretension}
              onChange={(e) => setPretension(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="80000000"
              className="field mt-1 w-full font-mono"
            />
          </label>
          <label className="block">
            <span className="field-label">Año de presentación</span>
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))} className="field mt-1 w-full font-mono">
              {anios.map((s) => (
                <option key={s.anio} value={s.anio}>
                  {s.anio} · {pesos(s.smlmv)}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="field-label">Jurisdicción</span>
            <select value={jurisdiccion} onChange={(e) => setJurisdiccion(e.target.value as Jurisdiccion)} className="field mt-1 w-full">
              <option value="CIVIL">Civil y de familia (CGP)</option>
              <option value="LABORAL">Laboral</option>
            </select>
          </label>
        </div>

        <p className="text-meta text-ink-500">
          Solo se ofrecen los años cuyo salario mínimo está verificado contra su decreto. Cuenta el vigente al presentar la demanda.
        </p>

        {error && <p className="notice-unverified">{error}</p>}

        {resultado && (
          <div className="space-y-3">
            <div className="rounded-card border border-line-200 bg-canvas p-4 text-center">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">{resultado.categoria}</p>
              <p className="mt-1 text-[18px] font-semibold text-ink-900">{resultado.juez}</p>
              <p className="mt-0.5 text-ui text-ink-700">{resultado.instancia}</p>
              <p className="mt-1 font-mono text-[12px] text-ink-700">
                {pesos(resultado.pretension)} ÷ {pesos(resultado.smlmv)} = {resultado.enSmlmv.toLocaleString('es-CO', { maximumFractionDigits: 2 })} SMLMV
              </p>
              <p className="mt-0.5 text-meta text-ink-500">{resultado.regla}</p>
            </div>

            <div className="overflow-hidden rounded-card border border-line-200 bg-surface">
              <div className="t-head flex items-center gap-3">
                <span className="min-w-0 flex-1">Cuantía</span>
                <span className="w-[110px] shrink-0 text-right">Hasta (SMLMV)</span>
                <span className="w-[140px] shrink-0 text-right">Hasta (pesos {resultado.anio})</span>
              </div>
              {resultado.limites.map((l) => (
                <div key={l.categoria} className={`t-row flex items-center gap-3 ${l.categoria === resultado.categoria ? 'bg-canvas' : ''}`}>
                  <span className="min-w-0 flex-1 text-ui text-ink-900">{l.categoria}</span>
                  <span className="w-[110px] shrink-0 text-right font-mono text-[12.5px] text-ink-900">{l.hasta ?? '—'}</span>
                  <span className="w-[140px] shrink-0 text-right font-mono text-[12.5px] text-ink-900">
                    {l.hastaPesos != null ? pesos(l.hastaPesos) : 'sin tope'}
                  </span>
                </div>
              ))}
            </div>

            {resultado.advertencias.map((a) => (
              <p key={a} className="notice">
                {a}
              </p>
            ))}

            <FuentesBox fuentes={resultado.fuentes} />
          </div>
        )}
      </div>
    </Dialog>
  );
};
