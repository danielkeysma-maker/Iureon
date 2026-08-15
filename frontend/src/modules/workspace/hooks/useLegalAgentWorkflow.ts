import { useState } from 'react';
import { API_BASE_URL } from '../../../config/api.config';
import type { AgentLog } from '../../agent/types';
import type { GeneratedDraft } from '../../documents/types';

export function useLegalAgentWorkflow(firmId?: string) {

  const [rightView, setRightView] = useState<'pdf' | 'draft'>('pdf');
  const [legalPrompt, setLegalPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [documentType, setDocumentType] = useState('Contestación de Demanda');
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

  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalPrompt.trim() || isProcessing) return;

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
      legalText: `⏳ REDACTANDO PIEZA PROCESAL EN TIEMPO REAL...

El Pipeline de 3 Motores (Gemini 3.6 Flash ➔ GPT-5.6 Sol ➔ Claude Opus 5) se encuentra procesando su indicación procesal, vectorizando precedentes en Supabase y estructurando la providencia.

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
        message: `[STAGE-1: INGESTION] Gemini 3.6 Flash procesando indicación procesal e insumos fácticos del caso...`,
        type: 'info'
      }
    ]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/agent/stream-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firm-id': firmId || 'unknown-firm'
        },
        body: JSON.stringify({
          documentType,
          legalBranch,
          legalPrompt,
          expedienteId: 'EXP-2026-904',
          existingDraft: activeDraftText || undefined
        })
      });

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

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
                  setGeneratedDraft(payload);
                  setRightView('draft');
                }
              } catch (err) {
                console.warn('SSE Parse warning:', err);
              }
            }
          }
        }
      } else {
        throw new Error('API Fallback simulation');
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
