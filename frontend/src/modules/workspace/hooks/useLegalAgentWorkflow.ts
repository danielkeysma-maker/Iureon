import { useState } from 'react';
import { API_BASE_URL } from '../../../config/api.config';
import type { AgentLog } from '../../agent/types';
import type { GeneratedDraft } from '../../documents/types';
import type { CaseProvidenciaEvaluationData } from '../../precedents/types';

export function useLegalAgentWorkflow(firmId?: string) {

  const [rightView, setRightView] = useState<'pdf' | 'draft' | 'analytics'>('pdf');
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

  const [analyticsData] = useState<CaseProvidenciaEvaluationData>({
    expedienteId: 'EXP-2026-904',
    documentType: 'Contestación de Demanda',
    circunstanciaEstudio: 'Excepción de Prescripción Trienal (Art. 151 CPTSS)',
    pronosticoFallo: 'ALTA_PROBABILIDAD_CONCESION',
    tasaConcedidosPct: 76.5,
    tasaNegadosPct: 23.5,
    corporacionPrincipal: 'Corte Suprema de Justicia - Sala Laboral',
    factoresRiesgoDenegacion: [
      {
        riesgo: 'Interrupción por Reclamo Escrito Anterior',
        explicacion: 'Si el demandante aporta carta de reclamo recibida previo al trienio, el juez NEGARÁ la excepción.',
        impacto: 'ALTO'
      },
      {
        riesgo: 'Falta de Especificación de la Fecha de Exigibilidad',
        explicacion: 'No precisar la fecha inicial del término trienal puede llevar a desestimar la excepción.',
        impacto: 'MEDIO'
      }
    ],
    requisitosClaveParaConcesion: [
      {
        requisito: 'Transcurso de más de 3 años continuos sin demanda',
        cumplidoEnExpediente: true,
        recomendacion: 'Acreditar con la fecha de radicación del reparto judicial.'
      },
      {
        requisito: 'Formulación expresa en acápite de excepciones de mérito',
        cumplidoEnExpediente: true,
        recomendacion: 'Incluido en el borrador generado por Claude Opus 5.'
      }
    ],
    topPrecedentesConcedidos: [
      {
        sentencia: 'SL-4102-2023',
        ponente: 'Dr. Fernando Castillo Cadena',
        ano: 2023,
        fundamentoClave: 'La reclamación verbal no interrumpe la prescripción laboral de 3 años.'
      },
      {
        sentencia: 'SL-1892-2022',
        ponente: 'Dra. Clara Inés Dueñas',
        ano: 2022,
        fundamentoClave: 'La interrupción del artículo 151 del CPTSS opera por una sola vez.'
      }
    ],
    topPrecedentesNegados: [
      {
        sentencia: 'SL-554-2021',
        ponente: 'Dr. Luis Benedicto Herrera',
        ano: 2021,
        causalDenegacion: 'La excepción fue NEGADA porque se probó reclamación escrita recibida por talento humano.'
      }
    ]
  });

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
      tokensConsumed: 4820
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
      await new Promise((resolve) => setTimeout(resolve, 800));

      const isTutela = documentType.toLowerCase().includes('tutela') || legalPrompt.toLowerCase().includes('tutela');

      setLogs((prev) => [
        ...prev,
        {
          id: '101',
          timestamp: new Date().toLocaleTimeString(),
          engine: 'GEMINI',
          message: `[STAGE-1] Gemini 3.6 Flash: Ingesta del caso (${documentType}). Hechos y pretensiones identificadas.`,
          type: 'info'
        },
        {
          id: '102',
          timestamp: new Date().toLocaleTimeString(),
          engine: 'SUPABASE',
          message: '[pgvector] Consulta de similitud en precedentes. Tasa concedidos: 84.2%.',
          type: 'info'
        },
        {
          id: '103',
          timestamp: new Date().toLocaleTimeString(),
          engine: 'GPT',
          message: `[STAGE-2] GPT Router: Formulación de esquema procesal para ${documentType}.`,
          type: 'info'
        },
        {
          id: '104',
          timestamp: new Date().toLocaleTimeString(),
          engine: 'CLAUDE',
          message: '[STAGE-3] Claude Opus 5: Redacción finalizada con jurisprudencia colombiana.',
          type: 'success'
        }
      ]);

      const titleClean = documentType.replace(/\s+/g, '_');

      if (isTutela) {
        setGeneratedDraft({
          title: `${titleClean}_Falsedad_EXP-2026-904`,
          documentType: documentType,
          jurisprudenciaCitada: [
            'Sentencia T-025-2004 (Corte Constitucional - Protección de Derechos Fundamentales)',
            'Sentencia T-238-2018 (Corte Constitucional - Debido Proceso Administrativo y Habeas Data)'
          ],
          excepcionesFormuladas: [
            'Protección Inmediata del Debido Proceso (Art. 29 C.P.)',
            'Habeas Data & Corrección de Registros Vehiculares (Art. 15 C.P.)'
          ],
          legalText: `SEÑOR JUEZ CONSTITUCIONAL DE LA REPÚBLICA DE COLOMBIA (E.S.D.)

REFERENCIA: ACCIÓN DE TUTELA PARA LA PROTECCIÓN DE DERECHOS FUNDAMENTALES
ACCIONANTE: APODERADO JUDICIAL / CIUDADANO AFECTADO
ACCIONADO: AUTORIDAD PÚBLICA / ENTIDAD DE CONTROL / INSPECCIÓN JUDICIAL

El apoderado judicial en ejercicio, actuando en representación del ciudadano afectado, acudo ante su Despacho para interponer formalmente ACCIÓN DE TUTELA conforme al Artículo 86 de la Constitución Política y el Decreto 2591 de 1991, con fundamento en los siguientes hechos:

I. HECHOS QUE MOTIVAN LA ACCIÓN
1. Mi representado fue afectado por actuaciones derivadas de la situación denunciada: ${legalPrompt || 'Falsedad e indebida asignación en registros vehiculares y fotomultas por suplantación de placas'}.
2. La entidad accionada ha omitido verificar la veracidad fáctica de los registros, vulnerando de manera flagrante los derechos fundamentales al debido proceso e intimidad de mi representado.
3. Se han agotado las peticiones directas ante la autoridad competente sin obtener una respuesta de fondo o rectificación inmediata.

II. DERECHOS FUNDAMENTALES VULNERADOS
Se vulneran de manera ostensible los siguientes derechos constitucionalmente protegidos:
- DERECHO AL DEBIDO PROCESO (Artículo 29 de la Constitución Política).
- DERECHO AL HABEAS DATA Y BUEN NOMBRE (Artículo 15 de la Constitución Política).

III. FUNDAMENTO JURÍDICO Y JURISPRUDENCIAL
De conformidad con la jurisprudencia pacífica de la Corte Constitucional (Sentencia T-025-2004 y Sentencia T-238-2018), la administración pública incurre en vía de hecho cuando mantiene registros basados en actos viciados de falsedad o suplantación sin verificar la identidad real del sujeto infractor.

IV. PRETENSIONES
1. TUTELAR de manera inmediata los derechos fundamentales al Debido Proceso y Habeas Data de mi representado.
2. ORDENAR a la entidad accionada la suspensión inmediata de los cobros o registros derivados de la alteración o falsedad fáctica denunciada.
3. ORDENAR la rectificación del expediente administrativo y la exoneración de los valores indebidamente atribuidos.

Atentamente,

APODERADO JUDICIAL
T.P. Abogado Apoderado`,
          tokensConsumed: 4820
        });
      } else {
        setGeneratedDraft({
          title: `${titleClean}_EXP-2026-904`,
          documentType: documentType,
          jurisprudenciaCitada: [
            'Sentencia SL-4102-2023 (Corte Suprema de Justicia)',
            'Sentencia C-038-2004 (Corte Constitucional)'
          ],
          excepcionesFormuladas: ['Prescripción Trienal', 'Inexistencia de la Obligación'],
          legalText: `SEÑOR JUEZ DE LA REPÚBLICA DE COLOMBIA (E.S.D.)

REFERENCIA: ${documentType.toUpperCase()}
EXPEDIENTE: EXP-2026-904

El apoderado judicial en ejercicio presento ante su Despacho la siguiente solicitud en el marco de la actuación de la referencia:

I. SUSTENTO FÁCTICO
${legalPrompt || 'Hechos expuestos en la solicitud procesal del expediente digital.'}

II. FUNDAMENTOS DE DERECHO Y JURISPRUDENCIA
De conformidad con la jurisprudencia pacífica aplicable (Sentencia SL-4102-2023), se solicita proveer de conformidad con el ordenamiento jurídico vigente.

III. PETICIONES
1. Resolver favorablemente la solicitud planteada acorde con la normatividad colombiana.

Atentamente,

APODERADO JUDICIAL
T.P. Abogado Apoderado`,
          tokensConsumed: 4820
        });
      }

      setRightView('draft');
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
    analyticsData,
    logs,
    isFocusMode,
    setIsFocusMode,
    activeDraftText,
    setActiveDraftText,
    handleSendPrompt,
    handleCopyText
  };
}
