import React, { useEffect, useState } from 'react';
import { ExternalLink, FileSpreadsheet } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { toolsApi } from '../services/tools.api';
import type { IbcVerificado, InteresesResult, ModoInteres } from '../types';
import { exportarExcel } from '../exportarExcel';
import { FuentesBox } from './FuentesBox';

/**
 * Intereses de mora. Diálogo tipo 3 —calculadora— en M.
 *
 * ─── THE CERTIFIED RATE IS ENTERED, NOT ASSUMED ─────────────────────────────
 *
 * The interés bancario corriente changes every month by resolución of the
 * Superintendencia Financiera. The server pre-fills only the most recent
 * value it could verify on the official page, labelled with its month; for
 * any other period the lawyer reads the certification and types it. Liquidating
 * a year of mora with one month's rate is an approximation, and the result
 * says so instead of hiding it.
 *
 * Three modes, each with its norm printed next to the result: COMERCIAL
 * (1.5 × IBC, C.Co. art. 884), CIVIL (6% anual, C.C. art. 1617) and PACTADA
 * (the agreed rate, checked against the usury ceiling of C.P. art. 305).
 * Simple interest over calendar days, no capitalisation: the assumption is
 * part of the answer.
 */
const pesos = (v: number): string => `$${Math.round(v).toLocaleString('es-CO')}`;

export const InteresesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [capital, setCapital] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [modo, setModo] = useState<ModoInteres>('COMERCIAL');
  const [ibcEA, setIbcEA] = useState('');
  const [tasaPactadaEA, setTasaPactadaEA] = useState('');
  const [ibcVerificado, setIbcVerificado] = useState<IbcVerificado | null>(null);
  const [enlaceIbc, setEnlaceIbc] = useState('');
  const [resultado, setResultado] = useState<InteresesResult | null>(null);
  const [error, setError] = useState('');
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    toolsApi
      .parametros()
      .then((p) => {
        setIbcVerificado(p.ibc);
        setEnlaceIbc(p.enlaces.ibc.url);
        // Pre-fill ONLY the verified value, and only if the field is still empty.
        if (p.ibc) setIbcEA((actual) => actual || String(p.ibc?.tasaEA ?? ''));
      })
      .catch(() => setIbcVerificado(null));
  }, [isOpen]);

  const necesitaIbc = modo === 'COMERCIAL' || modo === 'PACTADA';
  const listo =
    Number(capital) > 0 &&
    desde !== '' &&
    hasta !== '' &&
    (!necesitaIbc || Number(ibcEA) > 0) &&
    (modo !== 'PACTADA' || Number(tasaPactadaEA) > 0);

  const calcular = async () => {
    if (!listo) return;
    setCalculando(true);
    setError('');
    try {
      setResultado(
        await toolsApi.intereses({
          capital: Number(capital),
          desde,
          hasta,
          modo,
          ibcEA: necesitaIbc ? Number(ibcEA) : undefined,
          tasaPactadaEA: modo === 'PACTADA' ? Number(tasaPactadaEA) : undefined
        })
      );
    } catch (e) {
      setResultado(null);
      setError(e instanceof Error ? e.message : 'No se pudieron liquidar los intereses.');
    } finally {
      setCalculando(false);
    }
  };

  const exportar = () => {
    if (!resultado) return;
    exportarExcel({
      archivo: 'intereses-mora',
      resultado: [
        ['Capital', resultado.capital],
        ['Desde', resultado.desde],
        ['Hasta', resultado.hasta],
        ['Días', resultado.dias],
        ['Modo', resultado.modo],
        ['Tasa anual aplicada (% E.A.)', resultado.tasaAnualEA],
        ['Tasa diaria aplicada (%)', resultado.tasaDiaria * 100],
        ['Intereses', resultado.interes],
        ['Total (capital + intereses)', resultado.total],
        ['Tope de usura (% E.A.)', resultado.topeUsuraEA ?? 'No aplica']
      ],
      detalle: {
        columnas: ['Fórmula y supuestos'],
        filas: [[resultado.formula], ...resultado.supuestos.map((s) => [s])]
      },
      fuentes: resultado.fuentes,
      notas: resultado.advertencias
    });
  };

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      tamano="M"
      titulo="Intereses de mora"
      subtitulo="Comercial (1,5 × bancario corriente), legal civil (6 %) o pactado, con su norma."
      acciones={
        <>
          {resultado && (
            <button onClick={exportar} className="btn-neutral btn-sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar a Excel
            </button>
          )}
          <button onClick={() => void calcular()} disabled={calculando || !listo} className="btn-primary btn-sm">
            {calculando ? 'Calculando…' : 'Liquidar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Capital (pesos)</span>
            <input
              type="text"
              inputMode="numeric"
              value={capital}
              onChange={(e) => setCapital(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="5000000"
              className="field mt-1 w-full font-mono"
            />
          </label>
          <label className="block">
            <span className="field-label">Modo</span>
            <select value={modo} onChange={(e) => setModo(e.target.value as ModoInteres)} className="field mt-1 w-full">
              <option value="COMERCIAL">Mora comercial · 1,5 × IBC (C.Co. art. 884)</option>
              <option value="CIVIL">Interés legal civil · 6 % anual (C.C. art. 1617)</option>
              <option value="PACTADA">Tasa pactada · con control de usura (C.P. art. 305)</option>
            </select>
          </label>
          <label className="block">
            <span className="field-label">Desde (exigibilidad)</span>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="field mt-1 w-full" />
          </label>
          <label className="block">
            <span className="field-label">Hasta (fecha de corte)</span>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="field mt-1 w-full" />
          </label>

          {necesitaIbc && (
            <label className="block">
              <span className="field-label">Interés bancario corriente certificado (% E.A.)</span>
              <input
                type="text"
                inputMode="decimal"
                value={ibcEA}
                onChange={(e) => setIbcEA(e.target.value.replace(',', '.'))}
                placeholder="18.70"
                className="field mt-1 w-full font-mono"
              />
            </label>
          )}
          {modo === 'PACTADA' && (
            <label className="block">
              <span className="field-label">Tasa pactada (% E.A.)</span>
              <input
                type="text"
                inputMode="decimal"
                value={tasaPactadaEA}
                onChange={(e) => setTasaPactadaEA(e.target.value.replace(',', '.'))}
                placeholder="24"
                className="field mt-1 w-full font-mono"
              />
            </label>
          )}
        </div>

        {necesitaIbc && (
          <p className="text-meta leading-[1.6] text-ink-500">
            {ibcVerificado ? (
              <>
                Prellenado con la última certificación verificada: {ibcVerificado.tasaEA.toLocaleString('es-CO')} % E.A. para{' '}
                {ibcVerificado.mes} ({ibcVerificado.resolucion}, {ibcVerificado.modalidad}).{' '}
              </>
            ) : (
              <>No hay una certificación verificada cargada: escriba la tasa del periodo. </>
            )}
            La tasa cambia cada mes; para otro periodo tome la certificación de la Superintendencia Financiera.{' '}
            {enlaceIbc && (
              <a href={enlaceIbc} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                Ver certificaciones <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </p>
        )}

        {error && <p className="notice-unverified">{error}</p>}

        {resultado && (
          <div className="space-y-3">
            <div className="rounded-card border border-line-200 bg-canvas p-4 text-center">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">Intereses</p>
              <p className="mt-1 font-mono text-[24px] font-semibold text-ink-900">{pesos(resultado.interes)}</p>
              <p className="mt-0.5 text-ui text-ink-700">
                {resultado.dias} días · {resultado.tasaAnualEA.toLocaleString('es-CO', { maximumFractionDigits: 2 })} % E.A. · total{' '}
                {pesos(resultado.total)}
              </p>
              <p className="mt-1 font-mono text-[12px] text-ink-700">{resultado.formula}</p>
            </div>

            {resultado.excedeUsura && (
              <p className="notice-unverified">
                La tasa aplicada supera el tope de usura ({resultado.topeUsuraEA?.toLocaleString('es-CO', { maximumFractionDigits: 2 })} % E.A. =
                1,5 × IBC). Cobrarla es usura (C.P. art. 305) y el exceso se pierde (C.Co. art. 884).
              </p>
            )}

            <div className="overflow-hidden rounded-card border border-line-200 bg-surface">
              <p className="t-head">Supuestos del cálculo</p>
              {resultado.supuestos.map((s) => (
                <p key={s} className="t-row text-meta text-ink-700">
                  {s}
                </p>
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
