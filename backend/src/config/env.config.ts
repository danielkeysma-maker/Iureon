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

/**
 * DÓNDE VAN ESTAS VARIABLES, dicho en el aviso y no solo sabido.
 *
 * Este repositorio despliega DOS proyectos de Vercel desde el mismo commit:
 * `iureon` (raíz `backend/`) e `iureon-app` (raíz `frontend/`). Las variables de
 * entorno NO se comparten entre ellos, y todo lo que este archivo lee pertenece
 * al primero.
 *
 * Costó una tarde: `BRAVE_SEARCH_API_KEY` estaba puesta —correctamente escrita,
 * en Production, visible en el panel— pero en `iureon-app`, que jamás la lee. El
 * descubrimiento por tema llevaba días apagado en producción y el aviso decía
 * «no está configurada», que era cierto y sonaba a mentira con la variable a la
 * vista en la pantalla de al lado. Ahora el aviso nombra el proyecto.
 */
const PROYECTO_BACKEND = 'iureon';

const requireGroup = (name: string, keys: string[]): boolean => {
  const present = keys.filter((key) => read(key) !== '');

  if (present.length === 0) {
    warnings.push(
      `${name} is not configured; the app will run with its ${name} features disabled. ` +
        `Set ${keys.join(', ')} in the "${PROYECTO_BACKEND}" Vercel project — NOT in "iureon-app", ` +
        `which never reads them.`
    );
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
 * Buscador web, usado SOLO para apuntar hacia sentencias en el sitio de la Corte.
 *
 * Nunca decide qué dice una providencia ni que exista: produce números de
 * sentencia que el registro oficial confirma o rechaza. Ausente, el
 * descubrimiento por tema queda apagado y el resto del buscador sigue igual —
 * el corpus indexado y la consulta por cita no dependen de esto.
 */
const searchEnabled = requireGroup('Buscador web (descubrimiento por tema)', [
  'BRAVE_SEARCH_API_KEY'
]);

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

/**
 * Web Push (avisos al teléfono y al escritorio).
 *
 * Tres valores o ninguno: la llave pública sola deja al navegador suscribirse
 * a avisos que el servidor nunca podrá firmar, y la privada sola no sirve
 * para nada. El `subject` es un `mailto:` o una URL que los servicios de push
 * exigen para saber a quién escribir si un remitente se porta mal.
 *
 * Sin llaves la aplicación funciona igual: las rutas de avisos responden
 * 503 PUSH_DISABLED y los disparadores (soporte, borradores) no envían nada.
 * Se generan una vez con `npx web-push generate-vapid-keys` y no caducan.
 */
const pushEnabled = requireGroup('Web Push (avisos)', ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']);

if (pushEnabled && !/^(mailto:|https:\/\/)/.test(read('VAPID_SUBJECT'))) {
  errors.push('VAPID_SUBJECT must be a mailto: address or an https:// URL.');
}

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

  /*
   * Los dos SECRETOS también, y este es el que de verdad cuesta plata.
   *
   * Wompi entrega cuatro llaves por ambiente, no dos: pub_/prv_ para
   * autenticar, y events_/integrity_ para firmar. Se validaban las dos primeras
   * y las dos últimas no, así que un despliegue podía tener llaves de
   * producción y un secreto de eventos de prueba, y arrancar sin decir nada.
   *
   * El resultado de esa mezcla no es una falla visible: Wompi COBRA el dinero
   * real, envía la confirmación firmada con el secreto de producción, nuestro
   * verificador la compara contra el de prueba, no coincide, y la rechaza con
   * toda la razón. El cliente pagó y su saldo nunca se movió. Nadie se entera
   * hasta que reclama.
   *
   * La de integridad falla al revés y por eso es menos peligrosa: el checkout
   * ni siquiera abre. Se valida igual, porque una salida ruidosa temprano es
   * más barata que una ruidosa delante del cliente.
   */
  const ambiente = wompiSandbox ? 'test' : 'prod';

  const secretos: Array<[string, string]> = [
    ['WOMPI_EVENTS_SECRET', 'events'],
    ['WOMPI_INTEGRITY_SECRET', 'integrity']
  ];

  for (const [variable, tipo] of secretos) {
    const valor = read(variable);
    const esperado = `${ambiente}_${tipo}_`;

    if (!new RegExp(`^(test|prod)_${tipo}_`).test(valor)) {
      errors.push(`${variable} must start with test_${tipo}_ or prod_${tipo}_.`);
    } else if (!valor.startsWith(esperado)) {
      errors.push(
        `${variable} is from the ${valor.startsWith('test_') ? 'sandbox' : 'production'} environment ` +
          `but the API keys are from ${wompiSandbox ? 'sandbox' : 'production'}. ` +
          `Con esta mezcla Wompi cobra y la recarga nunca se acredita.`
      );
    }
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
  search: {
    enabled: searchEnabled,
    braveApiKey: read('BRAVE_SEARCH_API_KEY')
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
  push: {
    enabled: pushEnabled,
    publicKey: read('VAPID_PUBLIC_KEY'),
    privateKey: read('VAPID_PRIVATE_KEY'),
    subject: read('VAPID_SUBJECT')
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
