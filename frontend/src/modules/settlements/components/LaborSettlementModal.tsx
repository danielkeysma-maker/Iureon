import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { settlementsApi, type SettlementResult } from '../services/settlements.api';

interface LaborSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Liquidación de prestaciones sociales. Diálogo tipo 3 —calculadora— en M.
 *
 * ─── CADA CONCEPTO CON SU FUNDAMENTO ────────────────────────────────────────
 *
 * La tabla no muestra solo el valor: muestra la norma de la que sale cada
 * fórmula (cesantías del art. 249 CST, sus intereses de la Ley 52 de 1975…).
 * El resultado de esta calculadora termina en la pretensión económica de una
 * demanda, y un número sin fundamento no es defendible ante un juez.
 *
 * ─── LO QUE ESTA CALCULADORA YA NO HACE ─────────────────────────────────────
 *
 * Tenía un «fallback»: si la API fallaba mostraba una liquidación de
 * $44.441.250 escrita en el código — la misma para cualquier salario y
 * cualquier fecha, con la cara de un cálculo hecho. Dinero inventado en el
 * sitio exacto donde el abogado copia cifras hacia una demanda. Ahora un fallo
 * del servidor es un error visible con su razón.
 */

/** La norma detrás de cada fórmula que el servidor aplica. */
const CONCEPTOS: Array<{
  clave: keyof SettlementResult;
  nombre: string;
  fundamento: string;
}> = [
  { clave: 'cesantias', nombre: 'Cesantías', fundamento: 'Art. 249 CST' },
  { clave: 'interesesCesantias', nombre: 'Intereses sobre cesantías', fundamento: 'Ley 52 de 1975 · 12% anual' },
  { clave: 'primaServicios', nombre: 'Prima de servicios', fundamento: 'Art. 306 CST' },
  { clave: 'vacaciones', nombre: 'Vacaciones compensadas', fundamento: 'Art. 186 y 189 CST' },
  { clave: 'severanceIndemnification', nombre: 'Indemnización por despido', fundamento: 'Art. 64 CST · sin justa causa' }
];

const pesos = (v: number): string => `$${Math.round(v).toLocaleString('es-CO')}`;

export const LaborSettlementModal: React.FC<LaborSettlementModalProps> = ({ isOpen, onClose }) => {
  const [monthlySalary, setMonthlySalary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [terminationType, setTerminationType] = useState<'INJUSTA_CAUSA' | 'MUTUO_ACUERDO' | 'JUSTA_CAUSA'>('INJUSTA_CAUSA');
  const [resultado, setResultado] = useState<SettlementResult | null>(null);
  const [error, setError] = useState('');
  const [calculando, setCalculando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const salario = Number(monthlySalary);
  const listo = salario > 0 && startDate && endDate;

  const calcular = async () => {
    if (!listo) return;
    setCalculando(true);
    setError('');

    try {
      setResultado(
        await settlementsApi.calculate({ monthlySalary: salario, startDate, endDate, terminationType })
      );
    } catch (e) {
      setResultado(null);
      setError(e instanceof Error ? e.message : 'No se pudo calcular la liquidación.');
    } finally {
      setCalculando(false);
    }
  };

  const copiar = async () => {
    if (!resultado) return;
    const lineas = CONCEPTOS.filter((c) => Number(resultado[c.clave]) > 0).map(
      (c) => `${c.nombre} (${c.fundamento}): ${pesos(Number(resultado[c.clave]))}`
    );
    await navigator.clipboard.writeText(
      `${lineas.join('\n')}\nTotal: ${pesos(resultado.totalSettlement)} · ${resultado.daysWorked} días laborados`
    );
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      tamano="M"
      titulo="Liquidación de prestaciones sociales"
      subtitulo="Cada concepto con la norma de la que sale su fórmula."
      acciones={
        <>
          {resultado && (
            <button onClick={() => void copiar()} className="btn-neutral btn-sm">
              {copiado ? <Check className="h-3.5 w-3.5 text-verified" /> : <Copy className="h-3.5 w-3.5" />}
              {copiado ? 'Copiada' : 'Copiar'}
            </button>
          )}
          <button
            onClick={() => void calcular()}
            disabled={calculando || !listo}
            className="btn-primary btn-sm"
          >
            {calculando ? 'Calculando…' : 'Calcular'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="field-label">Salario mensual</span>
            <div className="relative mt-1">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-ink-400">
                $
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="2480000"
                className="field w-full pl-6 font-mono"
              />
            </div>
          </label>

          <label className="block">
            <span className="field-label">Causal de terminación</span>
            <select
              value={terminationType}
              onChange={(e) => setTerminationType(e.target.value as typeof terminationType)}
              className="field mt-1 w-full"
            >
              <option value="INJUSTA_CAUSA">Sin justa causa (Art. 64 CST)</option>
              <option value="JUSTA_CAUSA">Con justa causa</option>
              <option value="MUTUO_ACUERDO">Mutuo acuerdo</option>
            </select>
          </label>

          <label className="block">
            <span className="field-label">Fecha de ingreso</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="field mt-1 w-full"
            />
          </label>

          <label className="block">
            <span className="field-label">Fecha de retiro</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="field mt-1 w-full"
            />
          </label>
        </div>

        {error && <p className="notice-unverified">{error}</p>}

        {resultado && (
          <div className="space-y-3">
            {/* ─── CONCEPTO · VALOR · FUNDAMENTO ───────────────────────────── */}
            <div className="overflow-hidden rounded-card border border-line-200 bg-surface">
              <div className="t-head flex items-center gap-3">
                <span className="min-w-0 flex-1">Concepto</span>
                <span className="w-[110px] shrink-0 text-right">Valor</span>
                <span className="w-[170px] shrink-0">Fundamento</span>
              </div>

              {CONCEPTOS.map((c) => {
                const valor = Number(resultado[c.clave]);
                if (valor <= 0) return null;
                return (
                  <div key={c.clave} className="t-row flex items-center gap-3">
                    <span className="min-w-0 flex-1 text-ui text-ink-900">{c.nombre}</span>
                    <span className="w-[110px] shrink-0 text-right font-mono text-[12.5px] text-ink-900">
                      {pesos(valor)}
                    </span>
                    <span className="w-[170px] shrink-0 text-meta text-ink-500">{c.fundamento}</span>
                  </div>
                );
              })}

              <div className="flex items-center gap-3 border-t border-line-200 bg-canvas px-3 py-2.5">
                <span className="min-w-0 flex-1 text-ui font-semibold text-ink-900">
                  Total · {resultado.daysWorked.toLocaleString('es-CO')} días laborados
                </span>
                <span className="shrink-0 font-mono text-[15px] font-semibold text-ink-900">
                  {pesos(resultado.totalSettlement)}
                </span>
              </div>
            </div>

            <p className="text-meta text-ink-500">
              Agencias en derecho estimadas (10% de las pretensiones):{' '}
              <span className="font-mono text-ink-700">{pesos(resultado.agenciasEnDerechoEstimadas)}</span>
              . Es una estimación sobre tarifas del CSJ, no un valor tasado.
            </p>

            {/*
              LA ADVERTENCIA DE TODA CALCULADORA JURÍDICA: es la fórmula
              general. Salario variable, auxilio de transporte, o cortes de
              cesantías por año cambian el resultado, y esos casos se liquidan
              a mano o con el contador de la firma.
            */}
            <p className="notice">
              Cálculo con la fórmula general del CST sobre salario fijo. Salario variable, auxilio
              de transporte o cortes anuales de cesantías cambian el resultado: verifíquelo antes
              de llevarlo a una pretensión.
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
};
