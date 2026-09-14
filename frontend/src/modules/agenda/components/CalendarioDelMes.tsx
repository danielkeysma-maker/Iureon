import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarioAnual } from '../../tools/types';
import type { EntradaDeAgenda } from '../types';
import { MESES, celdasDelMes, huecoInicial, rotuloDelDia, type MesVisto } from '../mesDelCalendario';

/**
 * EL MES CON LOS TÉRMINOS DE LA FIRMA ENCIMA. `app-herramientas.html` :253.
 *
 * ─── QUÉ PINTA CADA COLOR, Y DE DÓNDE SALE ──────────────────────────────────
 *
 * Gris: los días que no cuentan —fin de semana, festivo, Semana Santa y
 * vacancia— tal como los calcula el servidor (ver `mesDelCalendario.ts`).
 * Ámbar suave con el rótulo escrito: el vencimiento de la firma. Con filete
 * discontinuo: un vencimiento cuyo plazo nadie verificó, que es lo único que en
 * este sistema lleva guion.
 *
 * ─── POR QUÉ NO ORO ─────────────────────────────────────────────────────────
 *
 * El calendario del año pintaba los vencimientos en oro macizo. El oro es el
 * marcador del módulo activo y nada más (README-app §1); la maqueta pone el
 * vencimiento en el ámbar suave de lo que pide atención.
 *
 * ─── UN CALENDARIO NO ES UNA TABLA ──────────────────────────────────────────
 *
 * Se dibuja con `grid` y no con `<table>`: el algoritmo de tabla no baja del
 * mínimo de cada columna, y siete columnas con rótulos se cortarían en un
 * teléfono sin que la página desborde. En 375 px el rótulo se esconde y queda
 * un punto; el texto completo sigue en `title` y en la lista «Lo que viene».
 */

const CABECERA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface Props {
  visto: MesVisto;
  onMover: (delta: number) => void;
  calendario: CalendarioAnual | null;
  entradas: EntradaDeAgenda[];
}

export const CalendarioDelMes: React.FC<Props> = ({ visto, onMover, calendario, entradas }) => {
  const celdas = celdasDelMes(visto.anio, visto.mes, calendario, entradas);
  const hueco = huecoInicial(visto.anio, visto.mes);

  return (
    <div className="cn-her-mes">
      <div className="cn-her-mes-cabeza">
        <button type="button" className="cn-her-icono cn-her-icono--suave" onClick={() => onMover(-1)} aria-label="Mes anterior">
          <ChevronLeft aria-hidden="true" size={16} strokeWidth={1.6} />
        </button>
        <span className="cn-her-mes-nombre" aria-live="polite">
          {MESES[visto.mes]} de {visto.anio}
        </span>
        <button type="button" className="cn-her-icono cn-her-icono--suave" onClick={() => onMover(1)} aria-label="Mes siguiente">
          <ChevronRight aria-hidden="true" size={16} strokeWidth={1.6} />
        </button>
        <div className="cn-her-leyenda">
          <span className="cn-her-leyenda-item">
            <span className="cn-her-leyenda-marca cn-her-leyenda-marca--suyo" aria-hidden="true" />
            Término suyo
          </span>
          <span className="cn-her-leyenda-item">
            <span className="cn-her-leyenda-marca cn-her-leyenda-marca--sin-verificar" aria-hidden="true" />
            Sin verificar
          </span>
          <span className="cn-her-leyenda-item">
            <span className="cn-her-leyenda-marca cn-her-leyenda-marca--no-habil" aria-hidden="true" />
            No hábil
          </span>
        </div>
      </div>

      <div className="cn-her-semana" aria-hidden="true">
        {CABECERA.map((l, i) => (
          <span key={`${l}-${i}`}>{l}</span>
        ))}
      </div>

      <div className="cn-her-dias">
        {Array.from({ length: hueco }).map((_, i) => (
          <span key={`hueco-${i}`} className="cn-her-hueco" aria-hidden="true" />
        ))}
        {celdas.map((c) => {
          const rotulo = rotuloDelDia(c);
          const vence = c.vencimientos.length > 0;
          const titulo = [
            c.festivo ? `Festivo · ${c.festivo}` : null,
            c.semanaSanta ? 'Vacancia de Semana Santa' : null,
            c.vacancia ? 'Vacancia judicial' : null,
            ...c.vencimientos.map((e) => `Vence: ${e.asunto} · ${e.actuacionNombre}${e.terminoVerificado ? '' : ' (sin verificar)'}`)
          ]
            .filter(Boolean)
            .join(' · ');
          return (
            <div
              key={c.fecha}
              title={titulo || c.fecha}
              className={[
                'cn-her-dia',
                c.noHabil ? 'cn-her-dia--no-habil' : '',
                vence ? 'cn-her-dia--vence' : '',
                c.sinVerificar ? 'cn-her-dia--sin-verificar' : ''
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="cn-her-mono cn-her-dia-numero">{c.dia}</span>
              {rotulo && <span className="cn-her-dia-rotulo">{rotulo}</span>}
              {vence && <span className="cn-her-dia-punto" aria-hidden="true" />}
              {titulo && <span className="cn-her-sr">{titulo}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
