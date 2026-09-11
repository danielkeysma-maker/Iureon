import { useState } from 'react';
import { streamRequest } from '../../../config/httpClient';
import type { AgentLog } from '../../agent/types';
import type { GeneratedDraft } from '../../documents/types';
import { adjuntosPendientes } from '../services/adjuntos';

/** The firm is no longer a parameter: the session carries it. */
/**
 * @param formatoDeFirma La instruccion de formato de la marca de la firma
 * (numeracion de hechos, titulos, bloque de firma). Viaja al prompt del motor
 * que escribe — el pipeline la aceptaba desde el principio y nadie la enviaba.
 */
export function useLegalAgentWorkflow(formatoDeFirma?: string) {

  const [rightView, setRightView] = useState<'pdf' | 'draft'>('pdf');
  const [legalPrompt, setLegalPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  /*
   * NACE SIN ACTUACIÓN ELEGIDA, y eso es lo correcto.
   *
   * Arrancaba en 'Contestación de Demanda', que NO es un `exactName` de ninguna
   * de las 651 fichas: cada taller recién abierto empezaba ya en SIN_CATALOGAR,
   * con el aviso de «la norma que el modelo recuerde» encendido sobre una
   * actuación que el abogado nunca eligió. Un valor por defecto que no existe
   * en el catálogo es peor que ninguno, porque parece una elección.
   */
  const [documentType, setDocumentType] = useState('');
  // The branch belongs to the workflow, not to the panel that renders its
  // selector: the catalogue cannot resolve a filing name without it. "Recurso
  // de reposición" exists in civil and administrativo with different deadlines,
  // and without the branch the backend correctly refuses to guess.
  const [legalBranch, setLegalBranch] = useState('CONSTITUCIONAL');
  const [copied, setCopied] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<GeneratedDraft | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [activeDraftText, setActiveDraftText] = useState<string | null>(null);


  const [logs, setLogs] = useState<AgentLog[]>([]);

  /**
   * Resuelve con el borrador generado, o null si no hubo. App lo usa para
   * guardarlo como borrador en el acto: un escrito que costó saldo no puede
   * depender de un clic en «Guardar» para sobrevivir a una recarga.
   */
  const handleSendPrompt = async (e: React.FormEvent): Promise<GeneratedDraft | null> => {
    e.preventDefault();
    if (!legalPrompt.trim() || isProcessing) return null;
    let generado: GeneratedDraft | null = null;

    // Generar título limpio temporal: TipoActuacion_Fecha
    const cleanType = documentType
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/^(redacción de|proyección de|elaboración de|formulación de)\s*/i, '')
      .replace(/^(la|el|los|las|un|una|del)\s+/i, '')
      .trim()
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('_');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const now = new Date();
    const dateStr = `${now.getDate()}-${months[now.getMonth()]}-${now.getFullYear()}`;
    const tempTitle = `${cleanType}_${dateStr}`;

    setGeneratedDraft({
      title: tempTitle,
      documentType: documentType,
      jurisprudenciaCitada: ['Corte Constitucional / CSJ / Consejo de Estado'],
      excepcionesFormuladas: ['Revisión Procesal en Curso'],
      /*
       * LO QUE ESTE TEXTO ANUNCIA TIENE QUE SER LO QUE DE VERDAD CORRE.
       *
       * Aquí decía que la etapa de GPT se había retirado y que nombrarla sería
       * contarle al abogado un trabajo que nadie hace. HOY ESO SERÍA FALSO AL
       * REVÉS: la etapa 2 se repuso el 10 de septiembre de 2026, con el plan ya
       * en Pro y su propia partida de 75 s, porque se midió que sin ella el
       * escrito se niega a nombrar la causal sustancial que la ficha ya
       * autorizaba. Los tres motores vuelven a nombrarse porque los tres
       * corren.
       */
      legalText: `⏳ REDACTANDO PIEZA PROCESAL EN TIEMPO REAL...

Gemini 3.8 Flash extrae los hechos, se buscan precedentes verificados en el corpus, GPT-5.6 Sol formula el problema jurídico y el esquema, y Claude Opus 5 redacta el escrito con la ficha del catálogo.

Por favor espere unos segundos mientras se finaliza la redacción solemne.`,
      // Zero, not 4820. This placeholder is shown BEFORE the request leaves the
      // browser, so any figure here is a number the product made up about its
      // own cost. The real count arrives with the finished draft.
      tokensConsumed: 0
    });

    const requestTimestamp = new Date().toLocaleTimeString();

    setLogs((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        timestamp: requestTimestamp,
        engine: 'GEMINI',
        message: `[Etapa 1] Gemini 3.8 Flash procesando indicación procesal e insumos fácticos del caso...`,
        type: 'info'
      }
    ]);

    try {
      /*
       * Through streamRequest so the session travels and renews itself.
       *
       * This sent `x-firm-id: firmId || 'unknown-firm'` on a raw fetch — the
       * literal shape of the defect being removed: a tenant the browser named,
       * with a made-up fallback when it had none. Drafting is the product's
       * central act, so it was also the most valuable thing that string could
       * have reached.
       */
      /*
       * Los adjuntos ya preparados por el panel (base64 o clave de B2). Se
       * recogen aquí y no llegan por parámetro porque App envuelve esta
       * función con un solo argumento; ver `adjuntosPendientes` en services.
       */
      const adjuntos = adjuntosPendientes.take();

      const response = await streamRequest('/api/agent/stream-draft', {
        documentType,
        legalBranch,
        legalPrompt,
        existingDraft: activeDraftText || undefined,
        customFormatInstruction: formatoDeFirma || undefined,
        adjuntos: adjuntos.length > 0 ? adjuntos : undefined
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        /*
         * EL SERVIDOR PUEDE FALLAR CON EL FLUJO YA ABIERTO, y hasta hoy eso no
         * se veía en ninguna parte.
         *
         * El backend manda `event: ERROR` con `{ message }`. Este bucle solo
         * miraba dos formas de suceso —un evento con `stage`, que es una línea
         * de la consola, y uno con `legalText`, que es el escrito—, así que el
         * evento de error no casaba con ninguna y se descartaba en silencio: la
         * pantalla se quedaba con el «⏳ REDACTANDO…» para siempre. Desde fuera
         * es indistinguible de una aplicación colgada, y el abogado no tenía
         * forma de saber que su reserva de saldo YA HABÍA VUELTO a su cuenta.
         *
         * Y lo mismo cuando el flujo se corta sin llegar a `COMPLETED` — que es
         * exactamente lo que hacía la plataforma al matar la función a los 60
         * segundos, sin darle al servidor ocasión de decir nada —: terminar de
         * leer sin escrito es un fallo, no un final.
         */
        let fallo: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';

          for (const block of blocks) {
            const match = block.match(/data:\s*(\{.*\})/s);
            if (match && match[1]) {
              try {
                const payload = JSON.parse(match[1]);
                if (payload.stage) {
                  setLogs((prev) => [
                    ...prev,
                    {
                      id: Math.random().toString(),
                      timestamp: new Date().toLocaleTimeString(),
                      engine: payload.engine,
                      message: payload.message,
                      type: payload.stage === 'STAGE_3_REDACCION' ? 'success' : 'info'
                    }
                  ]);
                } else if (payload.legalText) {
                  generado = payload as GeneratedDraft;
                  setGeneratedDraft(payload);
                  setRightView('draft');
                } else if (typeof payload.message === 'string' && payload.message) {
                  // El evento ERROR del servidor: trae el mensaje que hay que
                  // mostrar y la constancia de que la reserva ya se devolvió.
                  fallo = payload.message;
                }
              } catch (err) {
                console.warn('SSE Parse warning:', err);
              }
            }
          }
        }

        if (!generado) {
          throw new Error(
            fallo ??
              'La conexión con el servidor se cortó antes de que llegara el escrito. No se descontó saldo.'
          );
        }
      } else {
        /*
         * The server refused before the stream opened (plan expired, module or
         * function switched off for the firm, no balance): its JSON says why,
         * in the words the screen should show, and that is what is thrown.
         */
        const cuerpo = await response.json().catch(() => null);
        const mensaje = cuerpo && typeof cuerpo.message === 'string' && cuerpo.message ? cuerpo.message : `respuesta ${response.status}`;
        throw new Error(mensaje);
      }
    } catch (err) {
      /*
       * FAILS. It does not invent.
       *
       * This block used to hold 116 lines that fabricated a complete legal
       * document whenever the real call failed — network down, backend off, API
       * key missing. It waited 800ms so the work would feel real, wrote logs
       * claiming Gemini, GPT and Claude had each finished successfully, reported
       * "[pgvector] Tasa concedidos: 84.2%" from no query at all, invented a
       * token count, and handed the lawyer a finished tutela citing rulings
       * nobody had read — among them SL-4102-2023, which also lived in the
       * fabricating precedents module deleted the same day.
       *
       * A lawyer cannot tell that draft from a real one. It arrives complete, in
       * the right register, with citations formatted to paste into a brief. This
       * is the exact failure the court scrapers were deleted for, one layer up:
       * a fallback that answers instead of admitting it cannot.
       *
       * An error the lawyer can see costs a retry. A fabricated providencia
       * costs a case.
       */
      const detail = err instanceof Error ? err.message : 'causa desconocida';

      setLogs((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          engine: 'CLAUDE',
          message: `La redacción no pudo completarse (${detail}). No se genera ningún borrador: un documento inventado es indistinguible de uno real.`,
          type: 'error'
        }
      ]);

      setGeneratedDraft(null);
    } finally {
      setIsProcessing(false);
      setLegalPrompt('');
      setActiveDraftText(null);
    }
    return generado;
  };

  const handleCopyText = () => {
    if (!generatedDraft) return;
    navigator.clipboard.writeText(generatedDraft.legalText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return {
    rightView,
    setRightView,
    legalPrompt,
    setLegalPrompt,
    isProcessing,
    documentType,
    setDocumentType,
    legalBranch,
    setLegalBranch,
    copied,
    generatedDraft,
    setGeneratedDraft,
    logs,
    isFocusMode,
    setIsFocusMode,
    activeDraftText,
    setActiveDraftText,
    handleSendPrompt,
    handleCopyText
  };
}
