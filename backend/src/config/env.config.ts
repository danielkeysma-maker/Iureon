import dotenv from 'dotenv';

dotenv.config();

/**
 * Environment configuration with fail-fast validation.
 *
 * OpenRouter is required: without it the 3-engine AI pipeline — the core of the
 * product — cannot run, and the failure would only surface on the first user
 * request instead of at boot.
 *
 * Supabase and Backblaze are optional by design: DraftsService and
 * IngestionService degrade to a localStorage/no-op fallback when Supabase is
 * absent. They are validated as groups, because a partially configured
 * integration fails at runtime in ways that are much harder to diagnose than a
 * missing one.
 */

const read = (key: string): string => (process.env[key] ?? '').trim();

const errors: string[] = [];
const warnings: string[] = [];

const openRouterApiKey = read('OPENROUTER_API_KEY');
if (!openRouterApiKey) {
  errors.push('OPENROUTER_API_KEY is required: the AI drafting pipeline cannot run without it.');
}

const port = Number(read('PORT') || 4000);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  errors.push(`PORT must be an integer between 1 and 65535, received "${read('PORT')}".`);
}

const requireGroup = (name: string, keys: string[]): boolean => {
  const present = keys.filter((key) => read(key) !== '');

  if (present.length === 0) {
    warnings.push(`${name} is not configured; the app will run with its ${name} features disabled.`);
    return false;
  }

  if (present.length !== keys.length) {
    const missing = keys.filter((key) => read(key) === '');
    errors.push(`${name} is partially configured. Missing: ${missing.join(', ')}. Set all of ${keys.join(', ')} or none.`);
    return false;
  }

  return true;
};

const openAIEnabled = requireGroup('OpenAI (transcripción)', ['OPENAI_API_KEY']);

/**
 * Embeddings provider. Local by default so indexing costs nothing and needs no
 * account; `openai` opts into the hosted model and then requires its key.
 */
const embeddingsProvider = (read('EMBEDDINGS_PROVIDER') || 'local').toLowerCase();
if (!['local', 'openai'].includes(embeddingsProvider)) {
  errors.push(`EMBEDDINGS_PROVIDER must be "local" or "openai", received "${embeddingsProvider}".`);
}
if (embeddingsProvider === 'openai' && !openAIEnabled) {
  errors.push('EMBEDDINGS_PROVIDER=openai requires OPENAI_API_KEY.');
}
/**
 * Transcription provider. Deepgram is the default because it is the only option
 * evaluated that separates speakers, which is what makes a hearing transcript
 * citable; OpenAI's diarizing model remains available for an account that
 * already pays for it.
 */
const deepgramEnabled = requireGroup('Deepgram (transcripción)', ['DEEPGRAM_API_KEY']);

const supabaseEnabled = requireGroup('Supabase', ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
const backblazeEnabled = requireGroup('Backblaze B2', [
  'B2_APPLICATION_KEY_ID',
  'B2_APPLICATION_KEY',
  'B2_BUCKET_ID'
]);

if (supabaseEnabled && !/^https?:\/\//.test(read('SUPABASE_URL'))) {
  errors.push('SUPABASE_URL must be an absolute http(s) URL.');
}

if (errors.length > 0) {
  console.error('\n[ENV] Invalid environment configuration:');
  errors.forEach((message) => console.error(`  - ${message}`));
  console.error('\nSee .env.example for the full list of variables.\n');
  process.exit(1);
}

warnings.forEach((message) => console.warn(`[ENV] ${message}`));

export const config = {
  port,
  nodeEnv: read('NODE_ENV') || 'development',
  supabase: {
    enabled: supabaseEnabled,
    url: read('SUPABASE_URL'),
    serviceKey: read('SUPABASE_SERVICE_ROLE_KEY')
  },
  openRouter: {
    apiKey: openRouterApiKey
  },
  openAI: {
    enabled: openAIEnabled,
    apiKey: read('OPENAI_API_KEY')
  },
  embeddings: {
    provider: embeddingsProvider,
    // Overridable so a machine with more RAM can point at heavier weights
    // without a code change. Any replacement MUST output EMBEDDING_DIMENSIONS
    // values or the adapter rejects every vector.
    model: read('EMBEDDINGS_MODEL') || 'Xenova/bge-m3'
  },
  deepgram: {
    enabled: deepgramEnabled,
    apiKey: read('DEEPGRAM_API_KEY')
  },
  backblaze: {
    enabled: backblazeEnabled,
    applicationKeyId: read('B2_APPLICATION_KEY_ID'),
    applicationKey: read('B2_APPLICATION_KEY'),
    bucketId: read('B2_BUCKET_ID')
  }
};
