import { Request, Response } from 'express';
import { OpenRouterMultiEngineService, AgentExecutionStep } from './openrouter.service';

const aiService = new OpenRouterMultiEngineService();

export const streamAgentDraftController = async (req: Request, res: Response): Promise<void> => {
  const firmId = req.firmId;
  const { documentType, legalPrompt, expedienteId, existingDraft } = req.body;

  if (!legalPrompt) {
    res.status(400).json({ error: 'MISSING_PROMPT', message: 'Se requiere la instrucción jurídica en legalPrompt' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent('CONNECTED', { firmId, status: 'STARTING_MULTI_ENGINE_PIPELINE' });

    const result = await aiService.executeMultiEnginePipeline(
      {
        firmId: firmId || 'unknown-firm',
        documentType: documentType || 'Contestación de Demanda',
        legalPrompt,
        expedienteId,
        existingDraft
      },
      (step: AgentExecutionStep) => {
        sendEvent('AGENT_LOG', step);
      }
    );

    sendEvent('COMPLETED', result);
    res.end();
  } catch (error: any) {
    console.error('[AGENT-CONTROLLER-ERROR]', error);
    sendEvent('ERROR', { message: error.message || 'Error durante la orquestación del agente RAG' });
    res.end();
  }
};
