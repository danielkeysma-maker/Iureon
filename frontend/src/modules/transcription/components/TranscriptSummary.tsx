import React, { useEffect, useState } from 'react';
import { ListChecks, RefreshCw } from 'lucide-react';
import { httpClient } from '../../../config/httpClient';

/**
 * El resumen y los hechos relevantes, extraídos por el motor.
 *
 * UNA PIEZA PARA LAS DOS PANTALLAS. Una audiencia y una entrevista son cosas
 * distintas — una llega como archivo, la otra ocurre en la sala — pero las dos
 * terminan en una conversación transcrita de la que el abogado necesita lo
 * esencial sin releer dos horas. El resumen es del transcrito, no del módulo.
 *
 * CADA HECHO LLEVA SU ANCLA: el minuto y quién lo dijo. Es lo que lo hace
 * verificable contra el audio en segundos — el mismo contrato de todo el
 * producto: la máquina ofrece, el humano comprueba. Y por eso el pie no dice
 * "resumen inteligente": dice de dónde salió y qué hacer antes de citarlo.
 *
 * SE PIDE, NO SE DISPARA SOLO. La primera generación llama al modelo; las
 * siguientes vuelven del guardado. Tras corregir intervenciones vale
 * regenerar, porque el resumen viejo resume un texto que ya no existe — el
 * botón lo ofrece sin obligar.
 */

interface HechoRelevante {
  t: number | null;
  quien: string;
  hecho: string;
}

interface Resumen {
  resumen: string;
  hechos: HechoRelevante[];
  modelo: string;
  generadoEl: string;
}

interface TranscriptSummaryProps {
  transcriptionId: string;
  /** Nombra la conversación en la interfaz: «de la audiencia» / «de la entrevista». */
  kind: 'AUDIENCIA' | 'ENTREVISTA';
}

const formatoTiempo = (segundos: number): string => {
  const m = Math.floor(segundos / 60);
  const s = Math.floor(segundos % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

export const TranscriptSummary: React.FC<TranscriptSummaryProps> = ({ transcriptionId, kind }) => {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [pedido, setPedido] = useState(false);

  const pedir = async (regenerar = false) => {
    setCargando(true);
    setError('');

    try {
      const r = await httpClient.post<{ success: boolean; resumen?: Resumen; message?: string }>(
        `/api/transcription/${transcriptionId}/resumen${regenerar ? '?regenerar=1' : ''}`,
        {}
      );
      if (r.success && r.resumen) setResumen(r.resumen);
      else setError(r.message ?? 'El motor no pudo generar el resumen.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'El motor no pudo generar el resumen.');
    } finally {
      setCargando(false);
      setPedido(true);
    }
  };

  /*
   * Al cambiar de transcripción, lo mostrado deja de ser de esta conversación.
   * Sin este reset, abrir otra audiencia mostraría el resumen de la anterior
   * hasta que alguien pulsara el botón — un resumen correcto bajo el título
   * equivocado, que es la peor combinación.
   */
  useEffect(() => {
    setResumen(null);
    setError('');
    setPedido(false);
  }, [transcriptionId]);

  const nombre = kind === 'AUDIENCIA' ? 'la audiencia' : 'la entrevista';

  return (
    <div className="space-y-3 rounded-card border border-line-200 bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListChecks className="h-4 w-4 shrink-0 text-brand-700" />
          <div>
            <h4 className="text-ui font-semibold text-ink-900">Resumen y hechos relevantes</h4>
            <p className="text-meta text-ink-500">
              Extraídos de la transcripción de {nombre} por el motor, cada hecho con su minuto.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void pedir(Boolean(resumen))}
          disabled={cargando}
          className="btn-neutral btn-sm shrink-0"
        >
          <RefreshCw className={`h-3 w-3 ${cargando ? 'animate-spin' : ''}`} />
          {cargando ? 'Generando…' : resumen ? 'Regenerar' : 'Generar'}
        </button>
      </div>

      {error && <p className="notice-unverified">{error}</p>}

      {!resumen && !error && pedido && !cargando && (
        <p className="text-meta text-ink-500">El motor no encontró nada que resumir.</p>
      )}

      {resumen && (
        <>
          <p className="text-ui leading-[1.65] text-ink-900">{resumen.resumen}</p>

          {resumen.hechos.length > 0 && (
            <ul className="divide-y divide-line-100 rounded-card border border-line-100 bg-canvas">
              {resumen.hechos.map((h, i) => (
                <li key={i} className="flex items-start gap-3 px-3 py-2">
                  {/* El ancla en mono: minuto y voz. Es lo que se comprueba contra el audio. */}
                  <span className="mt-0.5 w-[44px] shrink-0 font-mono text-[11px] text-ink-400">
                    {h.t !== null ? formatoTiempo(h.t) : '—'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-ui leading-[1.55] text-ink-900">{h.hecho}</span>
                    <span className="mt-0.5 block font-mono text-[11px] text-ink-500">{h.quien}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/*
            El contrato, escrito donde se lee el resultado: esto salió de la
            transcripción y se comprueba contra ella. No es letra pequeña — es
            la diferencia entre un puntero y una afirmación.
          */}
          <p className="text-meta text-ink-400">
            Generado de la transcripción, no del audio. Antes de citar un hecho en un escrito,
            verifíquelo en su minuto.
          </p>
        </>
      )}
    </div>
  );
};
