import React, { useEffect, useState } from 'react';
import { httpClient } from '../../../config/httpClient';
import { useFuncionHabilitada } from '../../subscriptions/PlanContext';
import { AVISO_FUNCION_DESHABILITADA } from '../../subscriptions/types';
import { marcaDeTiempo } from '../audienciaEnPantalla';

/**
 * El resumen y los hechos relevantes, extraídos por el motor. Artboard :287,
 * pestaña «Resumen y hechos».
 *
 * UNA PIEZA PARA LAS DOS PANTALLAS. Una audiencia y una entrevista terminan en
 * una conversación transcrita de la que el abogado necesita lo esencial sin
 * releer dos horas. El resumen es del transcrito, no del módulo; por eso abre
 * su propio alcance `.cara-nueva` y se ve igual donde lo monten.
 *
 * CADA HECHO LLEVA SU ANCLA: el minuto y quién lo dijo. Es lo que lo hace
 * verificable contra el transcrito en segundos — la máquina ofrece, el humano
 * comprueba.
 *
 * SE PIDE, NO SE DISPARA SOLO. La primera generación llama al modelo; las
 * siguientes vuelven del guardado. Tras corregir intervenciones vale regenerar,
 * porque el resumen viejo resume un texto que ya no existe.
 *
 * LO QUE LA MAQUETA PINTA Y AQUÍ NO: «La fecha exacta quedó con poca certeza en
 * el audio» bajo un hecho. El resumen no cruza sus hechos con la confianza de
 * las intervenciones, así que esa línea sería una advertencia inventada.
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

export const TranscriptSummary: React.FC<TranscriptSummaryProps> = ({ transcriptionId, kind }) => {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [pedido, setPedido] = useState(false);
  /* El resumen es una función por módulo: el de una audiencia pertenece a Audiencias, el de una entrevista a Entrevistas. */
  const habilitado = useFuncionHabilitada(kind === 'AUDIENCIA' ? 'AUDIENCIAS.RESUMEN' : 'ENTREVISTAS.RESUMEN');

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
   * Sin este reset, abrir otra audiencia mostraría el resumen de la anterior —
   * un resumen correcto bajo el título equivocado.
   */
  useEffect(() => {
    setResumen(null);
    setError('');
    setPedido(false);
  }, [transcriptionId]);

  const nombre = kind === 'AUDIENCIA' ? 'la audiencia' : 'la entrevista';

  return (
    <div className="cara-nueva cn-aud-resumen">
      <div className="cn-aud-resumen-cabeza">
        <div>
          <h2 className="cn-aud-h2 cn-aud-h2--grande">Resumen y hechos relevantes</h2>
          <p className="cn-aud-bajada-2">
            Extraídos de la transcripción de {nombre}. Cada línea dice en qué minuto se dijo y quién, para que
            usted pueda volver y comprobarlo.
          </p>
        </div>

        {habilitado && (
          <button
            type="button"
            onClick={() => void pedir(Boolean(resumen))}
            disabled={cargando}
            className="cn-ini-boton cn-ini-boton--suave cn-aud-boton"
          >
            {cargando ? 'Generando…' : resumen ? 'Regenerar' : 'Generar el resumen'}
          </button>
        )}
      </div>

      {!habilitado && <p className="cn-aud-nota cn-aud-nota--caja">{AVISO_FUNCION_DESHABILITADA}</p>}
      {error && (
        <div className="cn-aud-aviso cn-aud-aviso--advertencia" role="alert">
          <p className="cn-aud-aviso-texto">{error}</p>
        </div>
      )}

      {cargando && !resumen && (
        <p className="cn-aud-cargando" role="status">
          <span className="cn-aud-giro" aria-hidden="true" />
          Leyendo la transcripción…
        </p>
      )}

      {habilitado && !resumen && !error && !pedido && !cargando && (
        <p className="cn-aud-nota cn-aud-nota--caja">
          Todavía no hay resumen de {nombre}. Se genera a pedido; después queda guardado.
        </p>
      )}

      {!resumen && !error && pedido && !cargando && (
        <p className="cn-aud-nota cn-aud-nota--caja">El motor no encontró nada que resumir.</p>
      )}

      {resumen && (
        <>
          <p className="cn-aud-resumen-texto">{resumen.resumen}</p>

          {resumen.hechos.length > 0 && (
            <ul className="cn-aud-hechos">
              {resumen.hechos.map((h, i) => (
                <li key={i} className="cn-aud-hecho">
                  {/* El ancla en mono: es lo citable, lo que se coteja con el transcrito. */}
                  <span className="cn-aud-mono cn-aud-hecho-tiempo">{h.t !== null ? marcaDeTiempo(h.t) : '—'}</span>
                  <span className="cn-aud-hecho-cuerpo">
                    <span className="cn-aud-hecho-texto">{h.hecho}</span>
                    <span className="cn-aud-hecho-quien">{h.quien}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/*
        EL CONTRATO, escrito donde se lee el resultado. No es letra pequeña: es
        la diferencia entre un puntero y una afirmación.
      */}
      <div className="cn-aud-aviso cn-aud-aviso--advertencia">
        <p className="cn-aud-aviso-titulo">Esto es un resumen, no una decisión</p>
        <p className="cn-aud-aviso-texto">
          Iureon reúne lo que se dijo y dice dónde, generado de la transcripción y no del audio. Lo que
          significa para el caso lo decide usted; el acta oficial del despacho prevalece sobre este documento.
          Antes de citar un hecho en un escrito, verifíquelo en su minuto.
        </p>
      </div>
    </div>
  );
};
