/**
 * Guards the operator console, whose whole risk is that it crosses tenants.
 *
 * Run with: npm run check:admin
 *
 * Two things must hold together: an ordinary lawyer cannot reach any of it, and
 * the operator can run the business WITHOUT gaining a way to read a client's
 * privileged material. The second is the one worth testing hardest — a console
 * that quietly grants case-file access is not an admin panel, it is a breach of
 * professional secrecy with a login screen.
 */
import express from 'express';
import { supabase } from '../../../config/supabase.config';
import { authMiddleware } from '../../auth/auth.middleware';
import { authPublicRoutes, authRoutes } from '../../auth/auth.routes';
import { adminRoutes } from '../admin.routes';
import { transcriptionRoutes } from '../../transcription/transcription.routes';
import { auditRoutes } from '../../audit/audit.routes';
import { crearFirmaConSesion } from '../../auth/__checks__/helpers';

const app = express();
app.use(express.json());
app.use('/api', authPublicRoutes);
app.use('/api', authMiddleware);
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', transcriptionRoutes);
app.use('/api', auditRoutes);

const m = Date.now();
let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const RESERVADA = 'AUDIENCIA RESERVADA DEL CLIENTE';
const PRIVILEGIADO = 'material privilegiado';

(async () => {
  const c = supabase!;
  const server = app.listen(4124);
  const base = 'http://127.0.0.1:4124/api';

  const pedir = (ruta: string, token: string, init: RequestInit = {}) =>
    fetch(`${base}${ruta}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {})
      }
    }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

  const correoOperador = `op${m}@iureon.test`;
  const claveOperador = 'contrasena-operador';

  const op = await crearFirmaConSesion({
    firmName: `Operador ${m}`,
    nit: `970${m}`,
    email: correoOperador,
    password: claveOperador
  });
  const cliente = await crearFirmaConSesion({
    firmName: `Cliente ${m}`,
    nit: `971${m}`,
    email: `cl${m}@iureon.test`,
    password: 'contrasena-cliente'
  });

  await c.from('transcriptions').insert({
    firm_id: cliente.user.firmId,
    user_email: cliente.user.email,
    kind: 'AUDIENCIA',
    title: RESERVADA,
    source_file_name: 'x.mp3',
    full_text: PRIVILEGIADO,
    segments: [],
    speaker_labels: [],
    model: 'x',
    transcribed_at: new Date().toISOString()
  });

  // ─── Sin el rol, la consola no existe para nadie ──────────────────────────
  const antes = await pedir('/admin/firms', op.accessToken);
  check('un administrador de firma no entra a la consola', antes.status === 403, String(antes.status));

  const conCliente = await pedir('/admin/firms', cliente.accessToken);
  check('un cliente tampoco entra', conCliente.status === 403, String(conCliente.status));

  /*
   * Y la consola no puede estorbar al resto de la aplicación.
   *
   * `router.use(guard)` corre para TODA petición que entra al router, no solo
   * las que casan con una de sus rutas: montado en /api, este guardia respondía
   * 403 a cualquier abogado en cualquier endpoint. La pantalla de auditoría se
   * quedó en blanco en esta misma prueba, y eso resultó significar exactamente
   * eso.
   */
  const ajeno = await pedir('/transcription', cliente.accessToken);
  check('la consola no bloquea el resto de la API', ajeno.status === 200, String(ajeno.status));

  // ─── Promoción, como la hace el script ────────────────────────────────────
  const { data: usuarios } = await c.auth.admin.listUsers();
  const cuentaOp = usuarios.users.find((u) => u.email === correoOperador)!;
  await c.auth.admin.updateUserById(cuentaOp.id, {
    app_metadata: { firm_id: op.user.firmId, role: 'SUPER_ADMIN' }
  });

  const relogin = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: correoOperador, password: claveOperador })
  }).then((r) => r.json());

  const opToken: string = relogin.session.accessToken;
  check('el rol viaja en el token nuevo', relogin.session.user.role === 'SUPER_ADMIN', relogin.session.user.role);

  // ─── Lo que SÍ puede: gestionar el negocio ────────────────────────────────
  const listado = await pedir('/admin/firms', opToken);
  const firmas = listado.body?.firms ?? [];
  check('el operador ve todas las firmas', listado.status === 200 && firmas.length >= 2, `${listado.status} · ${firmas.length}`);

  const clienteEnLista = firmas.find((f: { id: string }) => f.id === cliente.user.firmId);
  check(
    've el VOLUMEN del cliente, nunca su contenido',
    clienteEnLista?.transcriptions === 1 &&
      !JSON.stringify(listado.body).includes(PRIVILEGIADO) &&
      !JSON.stringify(listado.body).includes(RESERVADA),
    `transcritos=${clienteEnLista?.transcriptions}`
  );

  const recarga = await pedir(`/admin/firms/${cliente.user.firmId}/credits`, opToken, {
    method: 'POST',
    body: JSON.stringify({ amount: 50000 })
  });
  check(
    'puede recargar el saldo de una firma',
    recarga.status === 200 && recarga.body?.creditsBalance === 50000,
    JSON.stringify(recarga.body)
  );

  // ─── Lo que NO puede: leer el expediente ajeno ────────────────────────────
  const espiando = await pedir('/transcription', opToken);
  const titulos = (espiando.body?.items ?? []).map((t: { title: string }) => t.title);
  check('NO puede leer las audiencias del cliente', !titulos.includes(RESERVADA), `${titulos.length} transcritos propios`);

  // ─── Y lo que hizo queda donde el cliente lo ve ───────────────────────────
  const auditoria = await pedir('/audit/logs', cliente.accessToken);
  const acciones = (auditoria.body?.logs ?? []).map(
    (l: { action: string; userEmail: string }) => `${l.action}:${l.userEmail}`
  );
  check(
    'la recarga queda en la auditoría del cliente, con el operador nombrado',
    acciones.some((a: string) => a.startsWith('FIRM_CREDITS_ADDED') && a.includes(correoOperador)),
    acciones.join(' | ') || 'sin registros'
  );

  // ─── El rol no se puede pedir por la red ──────────────────────────────────
  const pidiendoRol = await pedir(`/admin/firms/${cliente.user.firmId}/users`, opToken, {
    method: 'POST',
    body: JSON.stringify({ email: `colado${m}@iureon.test`, password: 'contrasena-larga', role: 'SUPER_ADMIN' })
  });
  const { data: tras } = await c.auth.admin.listUsers();
  const colado = tras.users.find((u) => u.email === `colado${m}@iureon.test`);
  const rolColado = (colado?.app_metadata as Record<string, unknown>)?.role;
  check('SUPER_ADMIN no se puede otorgar por un endpoint', rolColado === 'LAWYER', `${pidiendoRol.status} · rol=${rolColado}`);

  // ─── Limpieza ─────────────────────────────────────────────────────────────
  const ids = [op.user.firmId, cliente.user.firmId];
  await c.from('transcriptions').delete().in('firm_id', ids);
  await c.from('audit_logs').delete().in('firm_id', ids);
  const { data: finales } = await c.auth.admin.listUsers();
  for (const u of finales.users) {
    if (u.email?.includes(String(m))) await c.auth.admin.deleteUser(u.id);
  }
  await c.from('firms').delete().in('firm_id', ids);

  server.close();
  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exit(fallos === 0 ? 0 : 1);
})();
