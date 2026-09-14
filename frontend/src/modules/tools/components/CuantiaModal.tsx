import React, { useEffect, useState } from 'react';
import { toolsApi } from '../services/tools.api';
import type { CuantiaResult, Jurisdiccion, SmlmvAnual } from '../types';
import { exportarExcel, type LibroExcel } from '../exportarExcel';
import { exportarPdf } from '../exportarPdf';
import { FuentesBox } from './FuentesBox';
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
} from './PantallaDeHerramienta';

/**
 * Competencia por cuantía. Pantalla de `app-herramientas.html` :365.
 *
 * The year list comes from the server: only years whose SMLMV was verified
 * against its decree are offered, so the lawyer cannot pick a year the tool
 * would have to guess. CGP art. 26: the SMLMV that counts is the one in force
 * when the demand is filed — hence «año de presentación», not «año de los hechos».
 *
 * ─── LOS TRAMOS SALEN DEL SERVIDOR ──────────────────────────────────────────
 *
 * La maqueta imprime los límites de cada cuantía. Aquí la tabla se pinta con
 * `limites`, la respuesta del cálculo, en salarios mínimos y en pesos del año
 * elegido: si la norma cambia, cambia en un solo sitio. Y el aviso de que la
 * cuantía no es el único factor de competencia viaja en `advertencias`, escrito
 * por el servidor, no por esta pantalla.
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

  /* El mismo objeto para las dos salidas: el Excel y el PDF no pueden diferir. */
  const libro = (): LibroExcel | null => {
    if (!resultado) return null;
    return {
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
      notas: [resultado.regla, ...resultado.advertencias],
      titulo: 'Competencia por cuantía'
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
      titulo="Competencia por cuantía"
      onVolver={onClose}
      primario={primario}
      formulario={
        <>
          <Campo etiqueta="Pretensión" htmlFor="cuantia-pretension">
            <input
              id="cuantia-pretension"
              type="text"
              inputMode="numeric"
              value={pretension}
              onChange={(e) => setPretension(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="$0.000.000"
              className="cn-her-campo cn-her-mono"
            />
          </Campo>

          <Campo
            etiqueta="Año de presentación"
            htmlFor="cuantia-anio"
            ayuda={
              anios.length === 0 && !error
                ? 'Leyendo los salarios mínimos verificados…'
                : 'Solo se ofrecen los años cuyo salario mínimo está verificado contra su decreto. Cuenta el vigente al presentar la demanda.'
            }
          >
            <select
              id="cuantia-anio"
              value={anio}
              onChange={(e) => setAnio(Number(e.target.value))}
              disabled={anios.length === 0}
              className="cn-her-campo cn-her-mono"
            >
              {anios.map((s) => (
                <option key={s.anio} value={s.anio}>
                  {s.anio} · {pesos(s.smlmv)}
                </option>
              ))}
            </select>
          </Campo>

          <fieldset className="cn-her-grupo">
            <legend className="cn-her-etiqueta">Jurisdicción</legend>
            <div className="cn-her-opciones">
              <Opcion nombre="cuantia-jurisdiccion" marcada={jurisdiccion === 'CIVIL'} onCambio={() => setJurisdiccion('CIVIL')} titulo="Civil y de familia · CGP" />
              <Opcion nombre="cuantia-jurisdiccion" marcada={jurisdiccion === 'LABORAL'} onCambio={() => setJurisdiccion('LABORAL')} titulo="Laboral" />
            </div>
          </fieldset>
        </>
      }
      resultado={
        <>
          {error && <ErrorDeHerramienta mensaje={error} />}
          {calculando && !resultado && <Cargando texto="Determinando la cuantía…" />}
          {!resultado && !calculando && !error && (
            <ResultadoVacio
              titulo="La cuantía aparece aquí"
              texto="En salarios mínimos del año de presentación, con el juez competente, los tramos y sus fuentes."
            />
          )}

          {resultado && (
            <>
              <TarjetaDeCifra
                rotulo="La pretensión equivale a"
                cifra={`${resultado.enSmlmv.toLocaleString('es-CO', { maximumFractionDigits: 2 })} SMLMV`}
                acciones={<BotonesDeExportacion onExcel={exportar} onPdf={() => void exportarPapel()} />}
              >
                <p className="cn-her-veredicto">{resultado.categoria}</p>
                <p className="cn-her-veredicto-detalle">
                  {resultado.juez} · {resultado.instancia}
                </p>
                <p className="cn-her-operacion cn-her-mono">
                  {pesos(resultado.pretension)} ÷ {pesos(resultado.smlmv)}
                </p>
                <p className="cn-her-nota">{resultado.regla}</p>
              </TarjetaDeCifra>

              <Caja titulo="Los tramos">
                <div className="cn-her-tabla" role="table" aria-label="Tramos de cuantía">
                  <div className="cn-her-tabla-cabeza cn-her-tabla-fila--tramos" role="row">
                    <span role="columnheader">Cuantía</span>
                    <span role="columnheader" className="cn-her-num">
                      Hasta (SMLMV)
                    </span>
                    <span role="columnheader" className="cn-her-num">
                      Hasta (pesos {resultado.anio})
                    </span>
                  </div>
                  {resultado.limites.map((l) => (
                    <div
                      key={l.categoria}
                      role="row"
                      className={`cn-her-tabla-fila cn-her-tabla-fila--tramos${l.categoria === resultado.categoria ? ' cn-her-tabla-fila--actual' : ''}`}
                    >
                      <span role="cell">{l.categoria}</span>
                      <span role="cell" className="cn-her-num cn-her-mono">
                        {l.hasta ?? 'sin tope'}
                      </span>
                      <span role="cell" className="cn-her-num cn-her-mono">
                        {l.hastaPesos != null ? pesos(l.hastaPesos) : 'sin tope'}
                      </span>
                    </div>
                  ))}
                </div>
              </Caja>

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
