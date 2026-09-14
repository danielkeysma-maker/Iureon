import React, { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { toolsApi } from '../services/tools.api';
import type { CertificacionesCargadas, InteresesResult, ModoInteres, TramoDeInteres } from '../types';
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
  Opcion,
  PantallaDeHerramienta,
  ResultadoVacio,
  TarjetaDeCifra
} from './PantallaDeHerramienta';

/**
 * Intereses de mora. Pantalla de `app-herramientas.html` :188.
 *
 * ─── CADA PERIODO CON SU TASA CERTIFICADA ───────────────────────────────────
 *
 * El abogado ya no escribe el interés bancario corriente. El servidor guarda
 * las certificaciones de la Superintendencia Financiera periodo por periodo, con
 * su resolución, y parte la mora en tramos: una deuda en mora desde hace dos
 * años se liquida con la tasa de cada mes, no con la de este. Por eso la tabla
 * «Por tramos de tasa» de la maqueta sí se pinta ahora: cada fila trae la tasa
 * que la resolución certificó y el enlace a la fuente, no una tasa repetida ni
 * inventada. Las cifras de muestra de la maqueta no se copian.
 *
 * ─── LO QUE LA PANTALLA DICE SIN QUE SE LO PREGUNTEN ────────────────────────
 *
 * - Qué rango de certificaciones está cargado y cuándo se consultó, antes de
 *   calcular: una fecha fuera del rango se niega en el servidor y la ayuda del
 *   campo ya lo advierte.
 * - Si el corte pasa de la última certificación, la liquidación se detiene ahí
 *   y la tarjeta muestra hasta qué día se liquidó.
 *
 * ─── EN EL TELÉFONO ─────────────────────────────────────────────────────────
 *
 * La tabla tiene cinco columnas y no cabe en 375 px. Se desliza dentro de su
 * caja, que es donde el ojo espera que se mueva; apilar cada tramo en tarjetas
 * rompía la lectura vertical de las tasas, que es para lo que existe la tabla.
 */
const pesos = (v: number): string => `$${Math.round(v).toLocaleString('es-CO')}`;
const tasa = (v: number): string => `${v.toLocaleString('es-CO', { maximumFractionDigits: 3 })} %`;
/** AAAA-MM-DD → DD/MM/AAAA, sin pasar por Date: una fecha civil no tiene zona horaria. */
const fecha = (iso: string): string => iso.split('-').reverse().join('/');

const MODOS: Array<{ modo: ModoInteres; titulo: string; detalle: string }> = [
  { modo: 'COMERCIAL', titulo: 'Mora comercial', detalle: '1,5 × el bancario corriente de cada periodo · C.Co. art. 884' },
  { modo: 'CIVIL', titulo: 'Interés legal civil', detalle: '6 % anual · C.C. art. 1617' },
  { modo: 'PACTADA', titulo: 'Tasa pactada', detalle: 'Sin pasar la usura de cada periodo · C.P. art. 305' }
];

const fuenteDelTramo = (t: TramoDeInteres): React.ReactNode =>
  t.url && t.resolucion ? (
    <a href={t.url} target="_blank" rel="noreferrer" className="cn-her-enlace-en-texto">
      {t.resolucion} <ExternalLink aria-hidden="true" size={14} />
    </a>
  ) : (
    <span className="cn-her-tenue">C.C. art. 1617</span>
  );

export const InteresesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [capital, setCapital] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [modo, setModo] = useState<ModoInteres>('COMERCIAL');
  const [tasaPactadaEA, setTasaPactadaEA] = useState('');
  const [cargadas, setCargadas] = useState<CertificacionesCargadas | null>(null);
  const [enlaceIbc, setEnlaceIbc] = useState('');
  const [resultado, setResultado] = useState<InteresesResult | null>(null);
  const [error, setError] = useState('');
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    toolsApi
      .parametros()
      .then((p) => {
        setCargadas(p.certificaciones ?? null);
        setEnlaceIbc(p.enlaces.ibc.url);
      })
      .catch(() => setCargadas(null));
  }, [isOpen]);

  const usaCertificadas = modo === 'COMERCIAL' || modo === 'PACTADA';
  const listo = Number(capital) > 0 && desde !== '' && hasta !== '' && (modo !== 'PACTADA' || Number(tasaPactadaEA) > 0);

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

  const conCertificadas = resultado !== null && resultado.modo !== 'CIVIL';

  /* El mismo objeto para las dos salidas: el Excel y el PDF no pueden diferir. */
  const libro = (): LibroExcel | null => {
    if (!resultado) return null;
    return {
      archivo: 'intereses-mora',
      titulo: 'Intereses de mora por tramos de tasa',
      resultado: [
        ['Capital', resultado.capital],
        ['Exigibilidad', fecha(resultado.desde)],
        ['Fecha de corte pedida', fecha(resultado.hasta)],
        ['Liquidado hasta', fecha(resultado.corte)],
        ['Días en mora', resultado.dias],
        ['Modo', MODOS.find((m) => m.modo === resultado.modo)?.titulo ?? resultado.modo],
        ['Tasa pactada (% E.A.)', resultado.tasaPactadaEA ?? 'No aplica'],
        ['Tramos de tasa', resultado.tramos.length],
        ['Intereses', resultado.interes],
        ['Total (capital + intereses)', resultado.total],
        [
          'Tasas',
          conCertificadas
            ? `Tasas certificadas por la Superintendencia Financiera (${resultado.certificadas.modalidad}); consultadas el ${resultado.certificadas.consultadoEl}`
            : 'Interés legal civil, C.C. art. 1617'
        ]
      ],
      detalle: {
        columnas: ['Desde', 'Hasta', 'Días', 'Bancario corriente (% E.A.)', 'Usura (% E.A.)', 'Tasa aplicada (% E.A.)', 'Interés del tramo', 'Fuente'],
        filas: resultado.tramos.map((t) => [
          fecha(t.desde),
          fecha(t.hasta),
          t.dias,
          t.interesBancarioCorrienteEA ?? 'No aplica',
          t.usuraEA ?? 'No aplica',
          t.tasaEA,
          t.interes,
          t.resolucion ?? 'C.C. art. 1617'
        ])
      },
      fuentes: resultado.fuentes,
      notas: [resultado.formula, ...resultado.supuestos, ...resultado.advertencias],
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
      {calculando ? 'Calculando…' : 'Calcular'}
    </button>
  );

  return (
    <PantallaDeHerramienta
      titulo="Intereses de mora"
      onVolver={onClose}
      primario={primario}
      formulario={
        <>
          <Campo etiqueta="Capital" htmlFor="intereses-capital">
            <input
              id="intereses-capital"
              type="text"
              inputMode="numeric"
              value={capital}
              onChange={(e) => setCapital(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="$0.000.000"
              className="cn-her-campo cn-her-mono"
            />
          </Campo>

          <fieldset className="cn-her-grupo">
            <legend className="cn-her-etiqueta">Qué tasa aplica</legend>
            <div className="cn-her-opciones">
              {MODOS.map((m) => (
                <Opcion
                  key={m.modo}
                  nombre="intereses-modo"
                  marcada={modo === m.modo}
                  onCambio={() => setModo(m.modo)}
                  titulo={m.titulo}
                  detalle={m.detalle}
                />
              ))}
            </div>
          </fieldset>

          <div className="cn-her-rejilla cn-her-rejilla--2">
            <Campo etiqueta="Desde" htmlFor="intereses-desde" ayuda="Exigibilidad. No cuenta como día de mora.">
              <input id="intereses-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="cn-her-campo cn-her-mono" />
            </Campo>
            <Campo etiqueta="Hasta" htmlFor="intereses-hasta" ayuda="Fecha de corte. Cuenta.">
              <input id="intereses-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="cn-her-campo cn-her-mono" />
            </Campo>
          </div>

          {usaCertificadas && (
            <p className="cn-her-ayuda">
              {cargadas ? (
                <>
                  La tasa de cada periodo sale de la certificación de la Superintendencia Financiera ({cargadas.modalidad}). Hay
                  certificaciones cargadas del <span className="cn-her-mono">{fecha(cargadas.desde)}</span> al{' '}
                  <span className="cn-her-mono">{fecha(cargadas.hasta)}</span>, consultadas el{' '}
                  <span className="cn-her-mono">{fecha(cargadas.consultadoEl)}</span>; fuera de ese rango no se liquida.{' '}
                </>
              ) : (
                <>La tasa de cada periodo sale de la certificación de la Superintendencia Financiera. </>
              )}
              {enlaceIbc && (
                <a href={enlaceIbc} target="_blank" rel="noreferrer" className="cn-her-enlace-en-texto">
                  Ver certificaciones <ExternalLink aria-hidden="true" size={14} />
                </a>
              )}
            </p>
          )}
          {modo === 'PACTADA' && (
            <Campo etiqueta="Tasa pactada (% E.A.)" htmlFor="intereses-pactada">
              <input
                id="intereses-pactada"
                type="text"
                inputMode="decimal"
                value={tasaPactadaEA}
                onChange={(e) => setTasaPactadaEA(e.target.value.replace(',', '.'))}
                placeholder="00,00"
                className="cn-her-campo cn-her-mono"
              />
            </Campo>
          )}
        </>
      }
      resultado={
        <>
          {error && <ErrorDeHerramienta mensaje={error} />}
          {calculando && !resultado && <Cargando texto="Liquidando los intereses…" />}
          {!resultado && !calculando && !error && (
            <ResultadoVacio
              titulo="Los intereses aparecen aquí"
              texto="Con los días en mora, la tasa de cada periodo, los supuestos del cálculo y sus fuentes."
            />
          )}

          {resultado && (
            <>
              <TarjetaDeCifra
                rotulo="Intereses"
                cifra={pesos(resultado.interes)}
                acciones={<BotonesDeExportacion onExcel={exportar} onPdf={() => void exportarPapel()} />}
              >
                <Dato nombre="Capital" valor={pesos(resultado.capital)} />
                <Dato nombre="Días en mora" valor={resultado.dias} />
                <Dato nombre="Tramos de tasa" valor={resultado.tramos.length} />
                {resultado.corte !== resultado.hasta && <Dato nombre="Liquidado hasta" valor={fecha(resultado.corte)} />}
                <Dato nombre="Total con capital" valor={pesos(resultado.total)} fuerte />
              </TarjetaDeCifra>

              {resultado.advertencias.map((a) => (
                <div key={a} className="cn-her-aviso">
                  <p>{a}</p>
                </div>
              ))}

              <Caja titulo="Por tramos de tasa">
                <div className="cn-her-desliza" role="region" aria-label="Tramos de tasa" tabIndex={0}>
                  <div className="cn-her-tabla cn-her-tabla--tramos-tasa" role="table">
                    <div className="cn-her-tabla-cabeza cn-her-tabla-fila--tramos-tasa" role="row">
                      <span role="columnheader">Periodo</span>
                      <span role="columnheader" className="cn-her-num">Días</span>
                      <span role="columnheader" className="cn-her-num">Tasa E.A.</span>
                      <span role="columnheader" className="cn-her-num">Interés</span>
                      <span role="columnheader">Fuente</span>
                    </div>
                    {resultado.tramos.map((t) => (
                      <div key={t.desde} className="cn-her-tabla-fila cn-her-tabla-fila--tramos-tasa" role="row">
                        <span role="cell" className="cn-her-mono">
                          {fecha(t.desde)} — {fecha(t.hasta)}
                        </span>
                        <span role="cell" className="cn-her-mono cn-her-num">{t.dias}</span>
                        <span role="cell" className="cn-her-mono cn-her-num">
                          {tasa(t.tasaEA)}
                          {t.excedeUsura && <span className="cn-her-tramo-tope"> tope</span>}
                        </span>
                        <span role="cell" className="cn-her-mono cn-her-num">{pesos(t.interes)}</span>
                        <span role="cell">{fuenteDelTramo(t)}</span>
                      </div>
                    ))}
                    <div className="cn-her-tabla-fila cn-her-tabla-fila--tramos-tasa cn-her-tabla-fila--total" role="row">
                      <span role="cell">Total</span>
                      <span role="cell" className="cn-her-mono cn-her-num">{resultado.dias}</span>
                      <span role="cell" />
                      <span role="cell" className="cn-her-mono cn-her-num">{pesos(resultado.interes)}</span>
                      <span role="cell" />
                    </div>
                  </div>
                </div>
                {conCertificadas && (
                  <p className="cn-her-nota cn-her-nota--despues">
                    Tasas certificadas por la Superintendencia Financiera; consultadas el{' '}
                    <span className="cn-her-mono">{fecha(resultado.certificadas.consultadoEl)}</span>.
                    {resultado.tramos.some((t) => t.nota) && ` ${resultado.tramos.find((t) => t.nota)?.nota}`}
                  </p>
                )}
              </Caja>

              <Caja titulo="La operación">
                <p className="cn-her-operacion cn-her-mono">{resultado.formula}</p>
              </Caja>

              <Caja titulo="Supuestos del cálculo">
                <ul className="cn-her-lineas">
                  {resultado.supuestos.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </Caja>

              <FuentesBox fuentes={resultado.fuentes} />
            </>
          )}
        </>
      }
    />
  );
};
