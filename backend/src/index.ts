import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env.config';
import { tenantMiddleware } from './modules/tenant/tenant.middleware';
import { healthRoutes } from './modules/health/health.routes';
import { agentRoutes } from './modules/agent/agent.routes';
import { documentRoutes } from './modules/documents/document.routes';
import { precedentsRoutes } from './modules/precedents/precedents.routes';
import { subscriptionRoutes } from './modules/subscriptions/subscription.routes';
import { ingestionRoutes } from './modules/ingestion/ingestion.routes';
import { proceduralTermsRoutes } from './modules/procedural-terms/terms.routes';
import { settlementRoutes } from './modules/settlements/settlement.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { searchRoutes } from './modules/search/search.routes';
import { draftsRoutes } from './modules/drafts/drafts.routes';
import { transcriptionRoutes } from './modules/transcription/transcription.routes';
import { catalogRoutes } from './modules/catalog/catalog.routes';

const app: Express = express();

// Middlewares Globales
app.use(cors());
app.use(express.json());

// Public Ping
app.get('/ping', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Iureon API Gateway Online',
    system: 'SaaS B2B LegalTech Modular Architecture'
  });
});

// Middleware Global Multi-Tenant (Requisito x-firm-id)
app.use('/api', tenantMiddleware);

// Carga Modular de Rutas de la API
app.use('/api', healthRoutes);
app.use('/api', agentRoutes);
app.use('/api', documentRoutes);
app.use('/api', precedentsRoutes);
app.use('/api', subscriptionRoutes);
app.use('/api', ingestionRoutes);
app.use('/api', proceduralTermsRoutes);
app.use('/api', settlementRoutes);
app.use('/api', auditRoutes);
app.use('/api', searchRoutes);
app.use('/api', draftsRoutes);
app.use('/api', transcriptionRoutes);
app.use('/api', catalogRoutes);

// Servidor Express
app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Iureon API Modular iniciada en el puerto ${config.port}`);
  console.log(`🛡️ Módulo Tenant: x-firm-id middleware activo`);
  console.log(`🤖 Módulo Agent: Gemini 3.6 Flash -> GPT -> Claude Opus 5`);
  console.log(`🔍 Módulo Search: Glosario & Buscador de Leyes/Sentencias`);
  console.log(`📦 Módulo Documents: Backblaze B2 Vault Storage`);
  console.log(`⚡ Módulo Ingestion: Vectorización pgvector (1536d)`);
  console.log(`📅 Módulo Terms: Calculadora de Términos Procesales CGP/CPTSS`);
  console.log(`💰 Módulo Settlement: Liquidaciones Laborales Art 64 CST`);
  console.log(`🛡️ Módulo Audit: Trazabilidad de Seguridad B2B`);
  console.log(`💳 Módulo Subscriptions: Perfiles de Firma y Planes SaaS`);
  console.log(`🎙️ Módulo Transcription: Audiencias y entrevistas con diarización`);
  console.log(`📚 Módulo Catalog: Actuaciones verificadas con norma y caducidad`);
  console.log(`=======================================================`);
});

export default app;
