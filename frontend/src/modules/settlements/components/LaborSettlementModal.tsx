import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { settlementsApi, type SettlementResult } from '../services/settlements.api';
import { exportarExcel, type LibroExcel } from '../../tools/exportarExcel';
import { exportarPdf } from '../../tools/exportarPdf';
import {
  BotonesDeExportacion,
  Caja,
  Campo,
  Cargando,
  ErrorDeHerramienta,
  Opcion,
  PantallaDeHerramienta,
  ResultadoVacio,
  TarjetaDeCifra
} from '../../tools/components/PantallaDeHerramienta';

interface LaborSettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Liquidación de prestaciones sociales. Pantalla de `app-herramientas.html` :400.
 *
 * ─── CADA CONCEPTO CON SU FUNDAMENTO ────────────────────────────────────────
 *
 * La tabla no muestra solo el valor: muestra la norma de la que sale cada
 * fórmula (cesantías del art. 249 CST, sus intereses de la Ley 52 de 1975…).
 * El resultado de esta calculadora termina en la pretensión económica de una
 * demanda, y un número sin fundamento no es defendible ante un juez.
 *
 * ─── LO QUE LA MAQUETA DIBUJA Y AQUÍ NO ESTÁ ────────────────────────────────
 *
 * «Total a favor del trabajador» y la lista de supuestos de la maqueta: el
 * rótulo afirma a favor de quién sin saberlo, y los supuestos que aquí se leen
 * son los que la fórmula del servidor sí asume, no los de la maqueta. La
 * sanción moratoria no se calcula, y la pantalla no la nombra como si existiera.
 *
 * ─── LO QUE ESTA CALCULADORA YA NO HACE ─────────────────────────────────────
 *
 * Tenía un «fallback»: si la API fallaba mostraba una liquidación escrita en el
 * código — la misma para cualquier salario y cualquier fecha, con la cara de un
 * cálculo hecho. Dinero inventado en el sitio exacto donde el abogado copia
 * cifras hacia una demanda. Ahora un fallo del servidor es un error visible con
 * su razón.
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

const CAUSALES: Array<{ valor: 'INJUSTA_CAUSA' | 'MUTUO_ACUERDO' | 'JUSTA_CAUSA'; titulo: string; detalle?: string }> = [
  { valor: 'INJUSTA_CAUSA', titulo: 'Sin justa causa', detalle: 'CST art. 64' },
  { valor: 'JUSTA_CAUSA', titulo: 'Con justa causa' },
  { valor: 'MUTUO_ACUERDO', titulo: 'Mutuo acuerdo' }
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

  /*
   * The «Fuentes» sheet lists the norm behind each formula, the same ones the
   * table shows. There is no external constant here (no SMLMV, no rate), so
   * the sources are the articles themselves.
   */
  /* El mismo objeto para las dos salidas: el Excel y el PDF no pueden diferir. */
  const libro = (): LibroExcel | null => {
    if (!resultado) return null;
    return {
      archivo: 'liquidacion-prestaciones',
      resultado: [
        ['Salario mensual', salario],
        ['Fecha de ingreso', startDate],
        ['Fecha de retiro', endDate],
        ['Días laborados', resultado.daysWorked],
        ...CONCEPTOS.map((c) => [c.nombre, Number(resultado[c.clave])] as [string, number]),
        ['Total', resultado.totalSettlement],
        ['Agencias en derecho estimadas (10 %)', resultado.agenciasEnDerechoEstimadas]
      ],
      detalle: {
        columnas: ['Concepto', 'Valor', 'Fundamento'],
        filas: CONCEPTOS.map((c) => [c.nombre, Number(resultado[c.clave]), c.fundamento])
      },
      /*
       * Dates are the day the URL was actually opened, not `today()`: a
       * consultation date that advances by itself certifies nothing.
       */
      fuentes: [
        {
          nombre: 'Código Sustantivo del Trabajo (arts. 64, 186, 189, 249, 306)',
          norma: 'Decreto Ley 2663 de 1950 y reformas',
          url: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=199983',
          consultadoEl: '2026-09-04'
        },
        {
          nombre: 'Intereses sobre cesantías · 12 % anual',
          norma: 'Ley 52 de 1975, art. 1 (texto reproducido en el Decreto 116 de 1976, que la reglamenta)',
          url: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=3285',
          consultadoEl: '2026-09-04'
        }
      ],
      notas: [
        'Fórmula general del CST sobre salario fijo. Salario variable, auxilio de transporte o cortes anuales de cesantías cambian el resultado.',
        'Las agencias en derecho son una estimación, no un valor tasado.'
      ],
      titulo: 'Liquidación de prestaciones sociales'
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

  if (!isOpen) return null;

  const primario = (
    <button
      type="button"
      onClick={() => void calcular()}
      disabled={calculando || !listo}
      className="cn-her-boton cn-her-boton--primario cn-her-boton--ancho"
    >
      {calculando ? 'Liquidando…' : 'Liquidar'}
    </button>
  );

  return (
    <PantallaDeHerramienta
      titulo="Liquidación de prestaciones"
      onVolver={onClose}
      primario={primario}
      formulario={
        <>
          <Campo etiqueta="Salario mensual" htmlFor="liquidacion-salario">
            <input
              id="liquidacion-salario"
              type="text"
              inputMode="numeric"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="$0.000.000"
              className="cn-her-campo cn-her-mono"
            />
          </Campo>

          <fieldset className="cn-her-grupo">
            <legend className="cn-her-etiqueta">Causal de terminación</legend>
            <div className="cn-her-opciones">
              {CAUSALES.map((c) => (
                <Opcion
                  key={c.valor}
                  nombre="liquidacion-causal"
                  marcada={terminationType === c.valor}
                  onCambio={() => setTerminationType(c.valor)}
                  titulo={c.titulo}
                  detalle={c.detalle}
                />
              ))}
            </div>
          </fieldset>

          <div className="cn-her-rejilla cn-her-rejilla--2">
            <Campo etiqueta="Ingreso" htmlFor="liquidacion-ingreso">
              <input id="liquidacion-ingreso" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="cn-her-campo cn-her-mono" />
            </Campo>
            <Campo etiqueta="Retiro" htmlFor="liquidacion-retiro">
              <input id="liquidacion-retiro" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="cn-her-campo cn-her-mono" />
            </Campo>
          </div>
        </>
      }
      resultado={
        <>
          {error && <ErrorDeHerramienta mensaje={error} />}
          {calculando && !resultado && <Cargando texto="Liquidando las prestaciones…" />}
          {!resultado && !calculando && !error && (
            <ResultadoVacio
              titulo="La liquidación aparece aquí"
              texto="Concepto por concepto, con la norma de la que sale cada fórmula y lo que el cálculo asume."
            />
          )}

          {resultado && (
            <>
              <TarjetaDeCifra
                rotulo="Total de la liquidación"
                cifra={pesos(resultado.totalSettlement)}
                detalle={`${resultado.daysWorked.toLocaleString('es-CO')} días laborados`}
                acciones={
                  <BotonesDeExportacion onExcel={exportar} onPdf={() => void exportarPapel()}>
                    <button type="button" onClick={() => void copiar()} className="cn-her-boton cn-her-boton--texto">
                      {copiado ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
                      {copiado ? 'Copiada' : 'Copiar'}
                    </button>
                  </BotonesDeExportacion>
                }
              />

              {/* ─── CONCEPTO · VALOR · FUNDAMENTO ───────────────────────────── */}
              <Caja>
                <div className="cn-her-tabla" role="table" aria-label="Conceptos de la liquidación">
                  <div className="cn-her-tabla-cabeza cn-her-tabla-fila--conceptos" role="row">
                    <span role="columnheader">Concepto</span>
                    <span role="columnheader" className="cn-her-num">
                      Valor
                    </span>
                    <span role="columnheader">Fundamento</span>
                  </div>
                  {CONCEPTOS.map((c) => {
                    const valor = Number(resultado[c.clave]);
                    if (valor <= 0) return null;
                    return (
                      <div key={c.clave} role="row" className="cn-her-tabla-fila cn-her-tabla-fila--conceptos">
                        <span role="cell">{c.nombre}</span>
                        <span role="cell" className="cn-her-num cn-her-mono">
                          {pesos(valor)}
                        </span>
                        <span role="cell" className="cn-her-tenue">
                          {c.fundamento}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Caja>

              <Caja titulo="Agencias en derecho">
                <p className="cn-her-nota">
                  Estimadas en el 10 % de las pretensiones:{' '}
                  <span className="cn-her-mono cn-her-fuerte">{pesos(resultado.agenciasEnDerechoEstimadas)}</span>. Es una
                  estimación sobre tarifas del CSJ, no un valor tasado.
                </p>
              </Caja>

              {/*
                LA ADVERTENCIA DE TODA CALCULADORA JURÍDICA: es la fórmula
                general. Salario variable, auxilio de transporte, o cortes de
                cesantías por año cambian el resultado, y esos casos se liquidan
                a mano o con el contador de la firma.
              */}
              <div className="cn-her-aviso">
                <p>
                  Cálculo con la fórmula general del CST sobre salario fijo. Salario variable, auxilio de transporte o
                  cortes anuales de cesantías cambian el resultado: verifíquelo antes de llevarlo a una pretensión.
                </p>
              </div>
            </>
          )}
        </>
      }
    />
  );
};
