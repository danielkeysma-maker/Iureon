import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toolsApi } from '../services/tools.api';
import type { CalendarioAnual } from '../types';
import { exportarExcel, type LibroExcel } from '../exportarExcel';
import { exportarPdf } from '../exportarPdf';
import { FuentesBox } from './FuentesBox';
import { BotonesDeExportacion, Caja, Cargando, ErrorDeHerramienta, Opcion, PantallaDeHerramienta } from './PantallaDeHerramienta';

/**
 * Festivos y vacancia del año. Pantalla DERIVADA: la maqueta no la dibuja sola,
 * pero sí el botón que la abre («Ver los festivos del año», `app-herramientas.html`
 * :260) y la casilla en tarjeta (:143). Se abre desde la agenda y a ella vuelve.
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

  /* El mismo objeto para las dos salidas: el Excel y el PDF no pueden diferir. */
  const libro = (): LibroExcel | null => {
    if (!calendario) return null;
    return {
      archivo: `calendario-judicial-${calendario.anio}`,
      titulo: `Calendario judicial ${calendario.anio}`,
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

  return (
    <PantallaDeHerramienta
      forma="lista"
      titulo="Festivos y vacancia del año"
      bajada="Festivos de la Ley 51 de 1983, vacancia judicial y Semana Santa, con la regla de cada fecha."
      onVolver={onClose}
      volverA="Agenda de términos"
      acciones={calendario ? <BotonesDeExportacion onExcel={exportar} onPdf={() => void exportarPapel()} /> : undefined}
    >
      <div className="cn-her-bloques">
        <div className="cn-her-anio">
          <button type="button" className="cn-her-icono cn-her-icono--suave" onClick={() => setAnio((a) => a - 1)} aria-label="Año anterior">
            <ChevronLeft aria-hidden="true" size={16} />
          </button>
          <label className="cn-her-sr" htmlFor="festivos-anio">
            Año
          </label>
          <input
            id="festivos-anio"
            type="number"
            min={1984}
            max={2200}
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="cn-her-campo cn-her-mono cn-her-campo--anio"
          />
          <button type="button" className="cn-her-icono cn-her-icono--suave" onClick={() => setAnio((a) => a + 1)} aria-label="Año siguiente">
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        </div>

        <Opcion
          tipo="checkbox"
          marcada={semanaSantaCompleta}
          onCambio={() => setSemanaSantaCompleta((v) => !v)}
          titulo="Descontar lunes a miércoles de Semana Santa"
          detalle="Decreto 1660 de 1978, art. 107. No aplica a despachos penales: verifique la circular del año."
        />

        {cargando && <Cargando texto="Calculando el calendario…" />}
        {error && <ErrorDeHerramienta mensaje={error} />}

        {calendario && !cargando && (
          <>
            <div className="cn-her-dos-bloques">
              <Caja titulo={`${calendario.festivos.length} festivos · Ley 51 de 1983`}>
                <ul className="cn-her-tabla">
                  {calendario.festivos.map((f) => (
                    <li key={f.fecha} className="cn-her-tabla-fila cn-her-tabla-fila--festivo">
                      <span className="cn-her-mono cn-her-tenue">{f.fecha}</span>
                      <span className="cn-her-celda-doble">
                        <span>{f.nombre}</span>
                        <span className="cn-her-nota cn-her-mayuscula">{fechaLarga(f.fecha)}</span>
                      </span>
                      <span className="cn-her-tenue">
                        {REGLA[f.regla]}
                        {f.fechaOriginal && f.fechaOriginal !== f.fecha ? ` · era ${f.fechaOriginal.slice(5)}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </Caja>

              <Caja titulo="Días hábiles por mes">
                <ul className="cn-her-tabla">
                  {calendario.diasHabilesPorMes.map((m) => (
                    <li key={m.mes} className="cn-her-tabla-fila cn-her-tabla-fila--par">
                      <span>{MESES[m.mes - 1]}</span>
                      <span className="cn-her-num cn-her-mono">{m.habiles}</span>
                    </li>
                  ))}
                </ul>
              </Caja>
            </div>

            <p className="cn-her-nota cn-her-nota--caja">
              <b className="cn-her-fuerte">Vacancia judicial:</b> del <span className="cn-her-mono">{calendario.vacancia.desde}</span> al{' '}
              <span className="cn-her-mono">{calendario.vacancia.hasta}</span>. {calendario.vacancia.descripcion}
            </p>
            <p className="cn-her-nota cn-her-nota--caja">
              <b className="cn-her-fuerte">Semana Santa:</b> jueves <span className="cn-her-mono">{calendario.semanaSanta.jueves}</span> y
              viernes <span className="cn-her-mono">{calendario.semanaSanta.viernes}</span>. {calendario.semanaSanta.nota}
            </p>

            <FuentesBox fuentes={calendario.fuentes} />
          </>
        )}
      </div>
    </PantallaDeHerramienta>
  );
};
