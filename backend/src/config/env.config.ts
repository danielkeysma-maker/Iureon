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
/**
 * Cloudflare Workers AI, which serves the SAME bge-m3 that indexed the corpus.
 *
 * It exists because the local model cannot run where this deploys: a 600 MB
 * ONNX model does not load in a Vercel serverless function, and no free tier
 * evaluated — Render or Koyeb, both 512 MB of RAM — has the memory either. The
 * search answered FAILED in production while working perfectly on a laptop.
 */
const cloudflareEnabled = requireGroup('Cloudflare Workers AI', [
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN'
]);

const embeddingsProvider = (read('EMBEDDINGS_PROVIDER') || 'local').toLowerCase();
if (!['local', 'openai', 'cloudflare'].includes(embeddingsProvider)) {
  errors.push(
    `EMBEDDINGS_PROVIDER must be "local", "cloudflare" or "openai", received "${embeddingsProvider}".`
  );
}
if (embeddingsProvider === 'cloudflare' && !cloudflareEnabled) {
  errors.push('EMBEDDINGS_PROVIDER=cloudflare requires CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN.');
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

/**
 * Wompi, the payment gateway a firm recharges through.
 *
 * ALL FOUR OR NONE, and this is the group where that rule earns its keep. The
 * public key alone opens a checkout that takes a client's card and then has no
 * events secret to verify the confirmation with — money leaves the client and
 * the balance never moves, or worse, an unverified POST moves it. A half
 * configured gateway is not a degraded feature, it is a way to lose money in
 * both directions at once.
 *
 * Absent entirely is fine: recharging falls back to what it does today, which
 * is the operator crediting a confirmed payment by hand.
 */
const wompiEnabled = requireGroup('Wompi (recargas)', [
  'WOMPI_PUBLIC_KEY',
  'WOMPI_PRIVATE_KEY',
  'WOMPI_EVENTS_SECRET',
  'WOMPI_INTEGRITY_SECRET'
]);

/*
 * Test keys are prefixed pub_test_ / prv_test_ and production ones pub_prod_ /
 * prv_prod_. Deriving the environment from the key itself rather than from a
 * separate flag removes the failure that flag exists to create: production keys
 * with the sandbox API, which fails, or sandbox keys believed to be production,
 * which succeeds and takes no money.
 */
const wompiSandbox = read('WOMPI_PUBLIC_KEY').startsWith('pub_test_');

if (wompiEnabled) {
  if (!/^pub_(test|prod)_/.test(read('WOMPI_PUBLIC_KEY'))) {
    errors.push('WOMPI_PUBLIC_KEY must start with pub_test_ or pub_prod_.');
  }
  if (!/^prv_(test|prod)_/.test(read('WOMPI_PRIVATE_KEY'))) {
    errors.push('WOMPI_PRIVATE_KEY must start with prv_test_ or prv_prod_.');
  }
  // Mixing them points the checkout at one environment and the confirmation at
  // the other, and every recharge silently fails to credit.
  if (wompiSandbox !== read('WOMPI_PRIVATE_KEY').startsWith('prv_test_')) {
    errors.push('WOMPI_PUBLIC_KEY and WOMPI_PRIVATE_KEY belong to different environments.');
  }
}
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
  cloudflare: {
    enabled: cloudflareEnabled,
    accountId: read('CLOUDFLARE_ACCOUNT_ID'),
    apiToken: read('CLOUDFLARE_API_TOKEN')
  },
  deepgram: {
    enabled: deepgramEnabled,
    apiKey: read('DEEPGRAM_API_KEY')
  },
  wompi: {
    enabled: wompiEnabled,
    sandbox: wompiSandbox,
    publicKey: read('WOMPI_PUBLIC_KEY'),
    privateKey: read('WOMPI_PRIVATE_KEY'),
    /** Verifies that an incoming event really came from Wompi. */
    eventsSecret: read('WOMPI_EVENTS_SECRET'),
    /** Signs the amount so the browser cannot change what it is paying. */
    integritySecret: read('WOMPI_INTEGRITY_SECRET'),
    /** Where the checkout sends the client back once the card is charged. */
    redirectUrl: read('WOMPI_REDIRECT_URL')
  },
  backblaze: {
    enabled: backblazeEnabled,
    applicationKeyId: read('B2_APPLICATION_KEY_ID'),
    applicationKey: read('B2_APPLICATION_KEY'),
    bucketId: read('B2_BUCKET_ID'),
    // Needed for download URLs, which B2 builds by NAME and not by id. Its
    // absence is why Deepgram fetched a 404 from a file that was there.
    bucketName: read('B2_BUCKET_NAME')
  }
};
