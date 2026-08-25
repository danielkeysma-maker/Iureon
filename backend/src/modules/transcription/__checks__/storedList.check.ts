/**
 * Guards the screen that tells a firm what is being kept about them.
 *
 * Run with: npm run check:stored
 *
 * Transcripts were stored from the first day and no client ever listed them, so
 * a lawyer could not know their hearings were retained, could not reopen one,
 * and could not delete one. For privileged material that is backwards. These
 * checks hold the three properties the screen depends on: a firm sees its own,
 * never another's, and deleting somebody else's reports failure instead of
 * lying about success.
 */
import express from 'express';
import { supabase } from '../../../config/supabase.config';
import { authMiddleware } from '../../auth/auth.middleware';
import { authPublicRoutes } from '../../auth/auth.routes';
import { transcriptionRoutes } from '../transcription.routes';
import { crearFirmaConSesion } from '../../auth/__checks__/helpers';

const app = express();
app.use(express.json());
app.use('/api', authPublicRoutes);
app.use('/api', authMiddleware);
app.use('/api', transcriptionRoutes);

const m = Date.now();
let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

(async () => {
  const c = supabase!;
  const server = app.listen(4125);
  const base = 'http://127.0.0.1:4125/api';

  const pedir = (ruta: string, token: string, init: RequestInit = {}) =>
    fetch(`${base}${ruta}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) }
    }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

  const A = await crearFirmaConSesion({ firmName: `Lista A ${m}`, nit: `980${m}`, email: `la${m}@iureon.test`, password: 'contrasena-larga-A' });
  const B = await crearFirmaConSesion({ firmName: `Lista B ${m}`, nit: `981${m}`, email: `lb${m}@iureon.test`, password: 'contrasena-larga-B' });

  const sembrar = (firmId: string, email: string, title: string) =>
    c.from('transcriptions').insert({
      firm_id: firmId, user_email: email, kind: 'AUDIENCIA', title,
      source_file_name: 'x.mp3', full_text: 't', segments: [], speaker_labels: [],
      model: 'x', transcribed_at: new Date().toISOString()
    }).select('id').single();

  const { data: deA } = await sembrar(A.user.firmId, A.user.email, 'AUDIENCIA DE A');
  const { data: deB } = await sembrar(B.user.firmId, B.user.email, 'AUDIENCIA DE B');

  // 1. Cada firma ve la suya y solo la suya.
  const listaA = await pedir('/transcription', A.accessToken);
  const titulosA = (listaA.body?.items ?? []).map((t: { title: string }) => t.title);
  check('la firma ve su propio transcrito', titulosA.includes('AUDIENCIA DE A'), titulosA.join(', '));
  check('y NO ve el de la otra firma', !titulosA.includes('AUDIENCIA DE B'), titulosA.join(', '));

  // 2. Borrar lo ajeno no puede reportar éxito.
  const ajeno = await pedir(`/transcription/${(deB as { id: string }).id}`, A.accessToken, { method: 'DELETE' });
  const { data: sigueVivo } = await c
    .from('transcriptions')
    .select('id')
    .eq('id', (deB as { id: string }).id)
    .maybeSingle();
  check('borrar el de otra firma se rechaza', ajeno.status === 404, String(ajeno.status));
  check('y el transcrito ajeno sigue existiendo', Boolean(sigueVivo));

  // 3. Borrar lo propio funciona y desaparece de la lista.
  const propio = await pedir(`/transcription/${(deA as { id: string }).id}`, A.accessToken, { method: 'DELETE' });
  const trasBorrar = await pedir('/transcription', A.accessToken);
  const restantes = (trasBorrar.body?.items ?? []).map((t: { title: string }) => t.title);
  check('la firma sí borra lo suyo', propio.status === 200, String(propio.status));
  check('y desaparece de su lista', !restantes.includes('AUDIENCIA DE A'), restantes.join(', ') || 'lista vacía');

  const ids = [A.user.firmId, B.user.firmId];
  await c.from('transcriptions').delete().in('firm_id', ids);
  const { data: usuarios } = await c.auth.admin.listUsers();
  for (const u of usuarios.users) if (u.email?.includes(String(m))) await c.auth.admin.deleteUser(u.id);
  await c.from('firms').delete().in('firm_id', ids);

  server.close();
  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exit(fallos === 0 ? 0 : 1);
})();
