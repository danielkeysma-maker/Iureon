/**
 * Sets the bucket's CORS rules to exactly what a browser upload needs.
 *
 * The web console's presets do not include the custom headers B2 requires for
 * b2_upload_file — `authorization`, `X-Bz-File-Name`, `X-Bz-Content-Sha1` — so
 * the preflight from iureon-app.vercel.app was refused. Detailed rules can only
 * be set through the API or the CLI, which is what this does.
 *
 * Uses B2_ADMIN_KEY_* deliberately, read straight from the environment and
 * never added to `config`: the running application has no business holding a
 * credential that can rewrite bucket settings. Delete the key afterwards.
 */
import 'dotenv/config';

const KEY_ID = process.env.B2_ADMIN_KEY_ID;
const KEY = process.env.B2_ADMIN_KEY;
const BUCKET_ID = process.env.B2_BUCKET_ID;

const REGLA = {
  corsRuleName: 'allowBrowserUploads',
  allowedOrigins: ['https://iureon-app.vercel.app', 'http://localhost:5173'],
  allowedOperations: [
    'b2_upload_file',
    'b2_upload_part',
    'b2_download_file_by_name',
    'b2_download_file_by_id',
    's3_put',
    's3_get',
    's3_head'
  ],
  // The three custom headers the docs require, plus content-type. `*` is
  // accepted by B2 and avoids a preflight failing over a header nobody listed.
  allowedHeaders: ['*'],
  exposeHeaders: ['x-bz-content-sha1', 'x-bz-file-id'],
  maxAgeSeconds: 3600
};

(async () => {
  if (!KEY_ID || !KEY || !BUCKET_ID) {
    console.error('Faltan B2_ADMIN_KEY_ID, B2_ADMIN_KEY o B2_BUCKET_ID en el entorno.');
    process.exit(1);
  }

  const auth = await (await fetch('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
    headers: { Authorization: `Basic ${Buffer.from(`${KEY_ID}:${KEY}`).toString('base64')}` }
  })).json() as any;

  if (!auth.apiInfo?.storageApi?.apiUrl) {
    console.error('No se pudo autenticar:', JSON.stringify(auth).slice(0, 200));
    process.exit(1);
  }

  const apiUrl = auth.apiInfo.storageApi.apiUrl;
  const accountId = auth.accountId;
  console.log('autenticado. cuenta:', accountId);

  const res = await fetch(`${apiUrl}/b2api/v3/b2_update_bucket`, {
    method: 'POST',
    headers: { Authorization: auth.authorizationToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, bucketId: BUCKET_ID, corsRules: [REGLA] })
  });

  const out = await res.json() as any;

  if (!res.ok) {
    console.error('Backblaze rechazó la actualización:', JSON.stringify(out).slice(0, 400));
    process.exit(1);
  }

  console.log('reglas aplicadas al bucket:', out.bucketName);
  console.log(JSON.stringify(out.corsRules, null, 1));
})();
