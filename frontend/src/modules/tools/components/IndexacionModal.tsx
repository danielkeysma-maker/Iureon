import React, { useEffect, useState } from 'react';
import { ExternalLink, FileSpreadsheet } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { toolsApi } from '../services/tools.api';
import type { Fuente, IndexacionResult } from '../types';
import { exportarExcel } from '../exportarExcel';
import { FuentesBox } from './FuentesBox';

/**
 * Indexación por IPC. Diálogo tipo 3 —calculadora— en M.
 *
 * ─── THE USER ENTERS THE TWO INDEX VALUES ───────────────────────────────────
 *
 * Neither DANE nor Banco de la República publishes the IPC series at a stable,
 * versionless, machine-readable URL a serverless backend can rely on month
 * after month (the research is in the backend `fuentes.ts`). A table typed
 * into the code would go stale in thirty days and look exactly like a live
 * one. So the lawyer reads the two index values on the DANE page — linked
 * here — and the tool applies the formula it prints: valor × (IPC final /
 * IPC inicial). What is verified is the formula and the source; the numbers
 * are the lawyer's, and the result says so.
 */
const pesos = (v: number): string => `$${Math.round(v).toLocaleString('es-CO')}`;

export const IndexacionModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [valor, setValor] = useState('');
  const [ipcInicial, setIpcInicial] = useState('');
  const [ipcFinal, setIpcFinal] = useState('');
  const [etiquetaInicial, setEtiquetaInicial] = useState('');
  const [etiquetaFinal, setEtiquetaFinal] = useState('');
  const [enlaceIpc, setEnlaceIpc] = useState<Fuente | null>(null);
  const [resultado, setResultado] = useState<IndexacionResult | null>(null);
  const [error, setError] = useState('');
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    toolsApi
      .parametros()
      .then((p) => setEnlaceIpc(p.enlaces.ipc))
      .catch(() => setEnlaceIpc(null));
  }, [isOpen]);

  const listo = Number(valor) > 0 && Number(ipcInicial) > 0 && Number(ipcFinal) > 0;

  const calcular = async () => {
    if (!listo) return;
    setCalculando(true);
    setError('');
    try {
      setResultado(
        await toolsApi.indexacion({
          valor: Number(valor),
          ipcInicial: Number(ipcInicial),
          ipcFinal: Number(ipcFinal),
          etiquetaInicial: etiquetaInicial || undefined,
          etiquetaFinal: etiquetaFinal || undefined
        })
      );
    } catch (e) {
      setResultado(null);
      setError(e instanceof Error ? e.message : 'No se pudo indexar el valor.');
    } finally {
      setCalculando(false);
    }
  };

  const exportar = () => {
    if (!resultado) return;
    exportarExcel({
      archivo: 'indexacion-ipc',
      resultado: [
        ['Valor histórico', resultado.valor],
        [`IPC inicial${etiquetaInicial ? ` (${etiquetaInicial})` : ''}`, resultado.ipcInicial],
        [`IPC final${etiquetaFinal ? ` (${etiquetaFinal})` : ''}`, resultado.ipcFinal],
        ['Factor', resultado.factor],
        ['Valor indexado', resultado.valorIndexado]
      ],
      detalle: { columnas: ['Fórmula'], filas: [[resultado.formula]] },
      fuentes: resultado.fuentes,
      notas: resultado.advertencias
    });
  };

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      tamano="M"
      titulo="Indexación por IPC"
      subtitulo="Actualiza un valor con los índices del DANE que usted lea; la fórmula se muestra."
      acciones={
        <>
          {resultado && (
            <button onClick={exportar} className="btn-neutral btn-sm">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exportar a Excel
            </button>
          )}
          <button onClick={() => void calcular()} disabled={calculando || !listo} className="btn-primary btn-sm">
            {calculando ? 'Calculando…' : 'Indexar'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block">
          <span className="field-label">Valor histórico (pesos)</span>
          <input
            type="text"
            inputMode="numeric"
            value={valor}
            onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="10000000"
            className="field mt-1 w-full font-mono"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block">
              <span className="field-label">IPC inicial (índice)</span>
              <input
                type="text"
                inputMode="decimal"
                value={ipcInicial}
                onChange={(e) => setIpcInicial(e.target.value.replace(',', '.'))}
                placeholder="105.48"
                className="field mt-1 w-full font-mono"
              />
            </label>
            <input
              value={etiquetaInicial}
              onChange={(e) => setEtiquetaInicial(e.target.value)}
              placeholder="Mes y año, p. ej. enero de 2021"
              className="field w-full"
            />
          </div>
          <div className="space-y-2">
            <label className="block">
              <span className="field-label">IPC final (índice)</span>
              <input
                type="text"
                inputMode="decimal"
                value={ipcFinal}
                onChange={(e) => setIpcFinal(e.target.value.replace(',', '.'))}
                placeholder="145.12"
                className="field mt-1 w-full font-mono"
              />
            </label>
            <input
              value={etiquetaFinal}
              onChange={(e) => setEtiquetaFinal(e.target.value)}
              placeholder="Mes y año, p. ej. julio de 2026"
              className="field w-full"
            />
          </div>
        </div>

        {/* Where the two numbers come from, said before the result exists. */}
        <p className="text-meta leading-[1.6] text-ink-500">
          Los índices no se cargan solos: el DANE no publica la serie en una dirección estable que un servidor
          pueda leer cada mes. Tome los dos valores del índice (base 2018 = 100, total nacional) de la página
          oficial y escríbalos aquí.{' '}
          {enlaceIpc && (
            <a href={enlaceIpc.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-700 hover:underline">
              Abrir la página del IPC del DANE <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </p>

        {error && <p className="notice-unverified">{error}</p>}

        {resultado && (
          <div className="space-y-3">
            <div className="rounded-card border border-line-200 bg-canvas p-4 text-center">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">Valor indexado</p>
              <p className="mt-1 font-mono text-[24px] font-semibold text-ink-900">{pesos(resultado.valorIndexado)}</p>
              <p className="mt-1 font-mono text-[12px] text-ink-700">{resultado.formula}</p>
              <p className="mt-0.5 text-meta text-ink-500">Factor {resultado.factor.toFixed(6)}</p>
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
