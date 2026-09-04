import React, { useState } from 'react';
import { Check, Copy, FileSpreadsheet } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { termsApi, type TermsCalculationResult } from '../services/terms.api';
import { exportarExcel } from '../../tools/exportarExcel';

interface ProceduralTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Contador de términos. Diálogo tipo 3 —calculadora— en tamaño M.
 *
 * ─── EL RESULTADO MUESTRA QUÉ DESCONTÓ Y POR QUÉ ────────────────────────────
 *
 * Un número solo no es defendible ante un juez: el abogado va a verificar el
 * cómputo de todos modos, y la lista de días excluidos —cada sábado, domingo y
 * festivo, con su razón— es lo que le permite hacerlo en un minuto en vez de
 * rehacerlo a mano.
 *
 * ─── LO QUE ESTA CALCULADORA YA NO HACE ─────────────────────────────────────
 *
 * Tenía un «fallback»: si la API fallaba, mostraba una fecha de vencimiento
 * escrita en el código —la misma para cualquier entrada— con la cara de un
 * cálculo hecho. Un plazo inventado es la única cosa que este producto no
 * puede emitir. Ahora, si el servidor no puede calcular, el error se muestra
 * con su razón — incluida la más importante: que el término pise un periodo
 * cuyo calendario de festivos no está cargado, porque contarlo sin festivos
 * daría una fecha equivocada.
 */
export const ProceduralTermsModal: React.FC<ProceduralTermsModalProps> = ({ isOpen, onClose }) => {
  const [notifiedDate, setNotifiedDate] = useState('');
  const [termInDays, setTermInDays] = useState(10);
  const [jurisdictionType, setJurisdictionType] = useState<'LABORAL' | 'CIVIL' | 'CONSTITUCIONAL' | 'PENAL'>('LABORAL');
  const [resultado, setResultado] = useState<TermsCalculationResult | null>(null);
  const [error, setError] = useState('');
  const [calculando, setCalculando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const calcular = async () => {
    if (!notifiedDate || termInDays <= 0) return;
    setCalculando(true);
    setError('');

    try {
      setResultado(await termsApi.calculate({ notifiedDate, termInDays, jurisdictionType }));
    } catch (e) {
      setResultado(null);
      setError(e instanceof Error ? e.message : 'No se pudo calcular el término.');
    } finally {
      setCalculando(false);
    }
  };

  const fechaLarga = (iso: string): string =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  /*
   * The workbook carries the excluded days AND the sources the server used
   * (Ley 51 de 1983, CGP art. 118), so the computation leaves with its evidence.
   */
  const exportar = () => {
    if (!resultado) return;
    exportarExcel({
      archivo: 'contador-de-terminos',
      resultado: [
        ['Fecha de notificación', resultado.notifiedDate],
        ['Empieza a contar', resultado.startDate],
        ['Días hábiles', resultado.totalBusinessDays],
        ['Vence', resultado.dueDate],
        ['Hora límite', resultado.dueTime],
        ['Fundamento', resultado.normativeReference]
      ],
      detalle: {
        columnas: ['Fecha excluida', 'Motivo'],
        filas: resultado.excludedDays.map((d) => [d.date, d.reason])
      },
      fuentes: resultado.fuentes ?? []
    });
  };

  const copiar = async () => {
    if (!resultado) return;
    await navigator.clipboard.writeText(
      `Notificado el ${resultado.notifiedDate}; término de ${resultado.totalBusinessDays} días hábiles ` +
        `contados desde el ${resultado.startDate} (${resultado.normativeReference}); vence el ${resultado.dueDate}.`
    );
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      tamano="M"
      titulo="Contador de términos"
      subtitulo="Días hábiles con los festivos de Colombia. El cómputo muestra qué descontó."
      acciones={
        <>
          {resultado && (
            <>
              <button onClick={exportar} className="btn-neutral btn-sm">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Exportar a Excel
              </button>
              <button onClick={() => void copiar()} className="btn-neutral btn-sm">
                {copiado ? <Check className="h-3.5 w-3.5 text-verified" /> : <Copy className="h-3.5 w-3.5" />}
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
            </>
          )}
          <button
            onClick={() => void calcular()}
            disabled={calculando || !notifiedDate || termInDays <= 0}
            className="btn-primary btn-sm"
          >
            {calculando ? 'Calculando…' : 'Calcular'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="field-label">Fecha de notificación</span>
            <input
              type="date"
              value={notifiedDate}
              onChange={(e) => setNotifiedDate(e.target.value)}
              className="field mt-1 w-full"
            />
          </label>

          <label className="block">
            <span className="field-label">Días hábiles</span>
            <input
              type="number"
              min={1}
              value={termInDays}
              onChange={(e) => setTermInDays(Number(e.target.value))}
              className="field mt-1 w-full font-mono"
            />
          </label>

          <label className="block">
            <span className="field-label">Jurisdicción</span>
            <select
              value={jurisdictionType}
              onChange={(e) => setJurisdictionType(e.target.value as typeof jurisdictionType)}
              className="field mt-1 w-full"
            >
              <option value="LABORAL">Laboral</option>
              <option value="CIVIL">Civil</option>
              <option value="CONSTITUCIONAL">Constitucional</option>
              <option value="PENAL">Penal (atiende lunes a miércoles santos)</option>
            </select>
          </label>
        </div>

        {/* El término empieza al día siguiente de la notificación: se dice antes. */}
        <p className="text-meta text-ink-500">
          Cuenta desde el día siguiente a la notificación (Art. 118 CGP). Descuenta sábados, domingos, los festivos de la
          Ley 51 de 1983 y la vacancia judicial (20 de diciembre a 10 de enero y Semana Santa, salvo penal).
        </p>

        {error && <p className="notice-unverified">{error}</p>}

        {resultado && (
          <div className="space-y-3">
            {/* ─── EL VENCIMIENTO, GRANDE Y CON SU DÍA ─────────────────────── */}
            <div className="rounded-card border border-line-200 bg-canvas p-4 text-center">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Vence
              </p>
              <p className="mt-1 font-mono text-[24px] font-semibold text-ink-900">
                {resultado.dueDate}
              </p>
              <p className="mt-0.5 text-ui capitalize text-ink-700">{fechaLarga(resultado.dueDate)}</p>
              <p className="mt-1 text-meta text-ink-500">{resultado.dueTime}</p>
            </div>

            {/* ─── QUÉ DESCONTÓ Y POR QUÉ ──────────────────────────────────── */}
            <div className="overflow-hidden rounded-card border border-line-200 bg-surface">
              <p className="t-head">
                Se descontaron {resultado.excludedDays.length} días no hábiles
              </p>
              <div className="max-h-[180px] overflow-y-auto">
                {resultado.excludedDays.map((d) => (
                  <div key={d.date} className="t-row flex items-center gap-3">
                    <span className="w-[92px] shrink-0 font-mono text-[12px] text-ink-900">
                      {d.date}
                    </span>
                    <span className="min-w-0 flex-1 text-meta text-ink-500">{d.reason}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-meta text-ink-500">
              Empieza a contar el <span className="font-mono text-ink-700">{resultado.startDate}</span> ·{' '}
              {resultado.normativeReference}
            </p>
          </div>
        )}
      </div>
    </Dialog>
  );
};
