import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { toolsApi } from '../services/tools.api';
import type { Fuente, IndexacionResult } from '../types';
import { exportarExcel, type LibroExcel } from '../exportarExcel';
import { exportarPdf } from '../exportarPdf';
import { FuentesBox } from './FuentesBox';
import {
  BotonesDeExportacion,
  Caja,
  Campo,
  Cargando,
  Dato,
  ErrorDeHerramienta,
  PantallaDeHerramienta,
  ResultadoVacio,
  TarjetaDeCifra
} from './PantallaDeHerramienta';

/**
 * Indexación por IPC. Pantalla de `app-herramientas.html` :335.
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
 *
 * ─── LO QUE LA MAQUETA DIBUJA Y AQUÍ NO ESTÁ ────────────────────────────────
 *
 * «Variación del IPC» y «Diferencia»: el servidor devuelve el factor y el valor
 * indexado, y esas dos son las que se muestran. Derivar otras en el navegador
 * pondría en pantalla cifras que el Excel y el PDF no llevan. Los índices de
 * ejemplo de la maqueta tampoco se copian: parecen los del DANE.
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

  /* El mismo objeto para las dos salidas: el Excel y el PDF no pueden diferir. */
  const libro = (): LibroExcel | null => {
    if (!resultado) return null;
    return {
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
      notas: resultado.advertencias,
      titulo: 'Indexación por IPC'
    };
  };

  const exportar = () => {
    const l = libro();
    if (l) exportarExcel(l);
  };

  const exportarPapel = async () => {
    const l = libro();
    if (!l) return;
    try {
      await exportarPdf(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el PDF.');
    }
  };

  if (!isOpen) return null;

  const primario = (
    <button
      type="button"
      onClick={() => void calcular()}
      disabled={calculando || !listo}
      className="cn-her-boton cn-her-boton--primario cn-her-boton--ancho"
    >
      {calculando ? 'Indexando…' : 'Indexar'}
    </button>
  );

  return (
    <PantallaDeHerramienta
      titulo="Indexación por IPC"
      onVolver={onClose}
      primario={primario}
      formulario={
        <>
          <Campo etiqueta="Valor histórico" htmlFor="indexacion-valor">
            <input
              id="indexacion-valor"
              type="text"
              inputMode="numeric"
              value={valor}
              onChange={(e) => setValor(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="$0.000.000"
              className="cn-her-campo cn-her-mono"
            />
          </Campo>

          <Campo etiqueta="IPC inicial" htmlFor="indexacion-inicial">
            <input
              id="indexacion-inicial"
              type="text"
              inputMode="decimal"
              value={ipcInicial}
              onChange={(e) => setIpcInicial(e.target.value.replace(',', '.'))}
              placeholder="000,00"
              className="cn-her-campo cn-her-mono"
            />
            <input
              value={etiquetaInicial}
              onChange={(e) => setEtiquetaInicial(e.target.value)}
              placeholder="Mes y año del índice"
              aria-label="Mes y año del IPC inicial"
              className="cn-her-campo cn-her-campo--segundo"
            />
          </Campo>

          <Campo etiqueta="IPC final" htmlFor="indexacion-final">
            <input
              id="indexacion-final"
              type="text"
              inputMode="decimal"
              value={ipcFinal}
              onChange={(e) => setIpcFinal(e.target.value.replace(',', '.'))}
              placeholder="000,00"
              className="cn-her-campo cn-her-mono"
            />
            <input
              value={etiquetaFinal}
              onChange={(e) => setEtiquetaFinal(e.target.value)}
              placeholder="Mes y año del índice"
              aria-label="Mes y año del IPC final"
              className="cn-her-campo cn-her-campo--segundo"
            />
          </Campo>

          {/* Where the two numbers come from, said before the result exists. */}
          <p className="cn-her-ayuda cn-her-ayuda--aviso">
            Los índices los escribe usted: el DANE no publica la serie en una dirección estable que un servidor pueda leer
            cada mes. Tome los dos valores del índice (base 2018 = 100, total nacional) de la página oficial.{' '}
            {enlaceIpc && (
              <a href={enlaceIpc.url} target="_blank" rel="noreferrer" className="cn-her-enlace-en-texto">
                Abrir la página del IPC del DANE <ExternalLink aria-hidden="true" size={14} />
              </a>
            )}
          </p>
        </>
      }
      resultado={
        <>
          {error && <ErrorDeHerramienta mensaje={error} />}
          {calculando && !resultado && <Cargando texto="Indexando el valor…" />}
          {!resultado && !calculando && !error && (
            <ResultadoVacio
              titulo="El valor indexado aparece aquí"
              texto="Con el factor, la operación que se aplicó sobre los índices que usted dio y sus fuentes."
            />
          )}

          {resultado && (
            <>
              <TarjetaDeCifra
                rotulo="Valor indexado"
                cifra={pesos(resultado.valorIndexado)}
                acciones={<BotonesDeExportacion onExcel={exportar} onPdf={() => void exportarPapel()} />}
              >
                <Dato nombre="Valor histórico" valor={pesos(resultado.valor)} />
                <Dato nombre="Factor" valor={resultado.factor.toFixed(6)} />
              </TarjetaDeCifra>

              <Caja titulo="La operación">
                <p className="cn-her-operacion cn-her-mono">{resultado.formula}</p>
                <p className="cn-her-nota cn-her-nota--despues">
                  Aritmética sobre los dos índices que usted dio. No se aplica ninguna otra corrección.
                </p>
              </Caja>

              <div className="cn-her-aviso">
                <p>
                  Qué índice corresponde a su caso —el total, por grupos o el de un mes concreto— lo decide usted. Esta
                  herramienta no elige el índice.
                </p>
              </div>

              {resultado.advertencias.map((a) => (
                <div key={a} className="cn-her-aviso">
                  <p>{a}</p>
                </div>
              ))}

              <FuentesBox fuentes={resultado.fuentes} />
            </>
          )}
        </>
      }
    />
  );
};
