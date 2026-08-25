import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env.config';
import { authMiddleware, optionalAuthMiddleware } from './modules/auth/auth.middleware';
import { authPublicRoutes, authRoutes } from './modules/auth/auth.routes';
import { healthRoutes } from './modules/health/health.routes';
import { agentRoutes } from './modules/agent/agent.routes';
import { documentRoutes } from './modules/documents/document.routes';
import { subscriptionRoutes } from './modules/subscriptions/subscription.routes';
import { ingestionRoutes } from './modules/ingestion/ingestion.routes';
import { proceduralTermsRoutes } from './modules/procedural-terms/terms.routes';
import { settlementRoutes } from './modules/settlements/settlement.routes';
import { auditRoutes } from './modules/audit/audit.routes';
import { searchPublicRoutes, searchRoutes } from './modules/search/search.routes';
import { draftsRoutes } from './modules/drafts/drafts.routes';
import { transcriptionPublicRoutes, transcriptionRoutes } from './modules/transcription/transcription.routes';
import { catalogPublicRoutes, catalogRoutes } from './modules/catalog/catalog.routes';
import { embeddingsService } from './modules/embeddings/embeddings.service';
import { EMBEDDING_DIMENSIONS } from './modules/embeddings/types';

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

// Reading the actuación catalogue is product knowledge, not tenant data, so it
// is mounted BEFORE the tenant middleware. Curation writes stay behind it.
// Before the public readers: a lawyer with a session gets their firm's
// curation overlaid, a visitor without one still gets the shipped catalogue.
// The overlay is tenant data, so it may only come from a verified token.
app.use('/api', optionalAuthMiddleware);

app.use('/api', catalogPublicRoutes);

// The jurisprudence corpus is the same case: SYSTEM_CORPUS holds the identical
// providencias for every firm. Behind the middleware the Buscador answered
// nothing at all to a user with no firm yet. Its handler pins SYSTEM_CORPUS
// server-side and never reads a firm id from the request.
app.use('/api', searchPublicRoutes);

// Whether a transcription engine exists is a fact about the server, identical
// for every firm. Gating it made the screen report a missing API key to a user
// whose only problem was having no firm registered yet.
app.use('/api', transcriptionPublicRoutes);

// Signing in, registering a firm and refreshing a token cannot require a
// session: a caller who has none is exactly who calls them.
app.use('/api', authPublicRoutes);

/*
 * THE TENANT NOW COMES FROM THE TOKEN, NOT FROM A HEADER.
 *
 * This used to be `tenantMiddleware`, which read `x-firm-id` and believed it.
 * Isolation held in the database — every query filters by firm — but the filter
 * ran on a value the browser supplied, so reading another firm's hearings
 * needed their id and nothing else: no password, no account, no session. The
 * firms themselves were never persisted either; the registry table was empty
 * and the tenant lived in localStorage.
 *
 * `authMiddleware` verifies a Supabase JWT and takes the firm from
 * `app_metadata`, the half of the metadata only the service role can write. The
 * database was built for this from the start: `current_firm_id()` in schema.sql
 * reads that same claim.
 */
app.use('/api', authMiddleware);

// Carga Modular de Rutas de la API
app.use('/api', authRoutes);
app.use('/api', healthRoutes);
app.use('/api', agentRoutes);
app.use('/api', documentRoutes);
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
  console.log(
    `⚡ Módulo Ingestion: Vectorización pgvector (${EMBEDDING_DIMENSIONS}d) vía ${embeddingsService.providerName}`
  );
  console.log(`📅 Módulo Terms: Calculadora de Términos Procesales CGP/CPTSS`);
  console.log(`💰 Módulo Settlement: Liquidaciones Laborales Art 64 CST`);
  console.log(`🛡️ Módulo Audit: Trazabilidad de Seguridad B2B`);
  console.log(`💳 Módulo Subscriptions: Perfiles de Firma y Planes SaaS`);
  console.log(`🎙️ Módulo Transcription: Audiencias y entrevistas con diarización`);
  console.log(`📚 Módulo Catalog: Actuaciones verificadas con norma y caducidad`);
  console.log(`=======================================================`);
});

export default app;
