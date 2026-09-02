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
import { clavePrueba, crearFirmaConSesion } from '../../auth/__checks__/helpers';

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

/** El motivo que acompaña a toda acción de operación en este check. */
const MOTIVO_DE_PRUEBA = 'Compensacion por borrador fallido del 28 de agosto';

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
  const claveOperador = clavePrueba();

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
    password: clavePrueba()
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

  /*
   * SIN MOTIVO NO HAY ACCION DE OPERACION.
   *
   * El artboard 7b lo exige — «cada accion exige un motivo escrito y queda en
   * el registro que los socios de la firma tambien ven» — y esa es toda la
   * garantia: un poder que cruza el limite del inquilino solo es aceptable si
   * el inquilino puede leer que se hizo Y POR QUE.
   */
  /*
   * SIN NIT TAMBIEN SE PUEDE. Hay litigantes —personas naturales— y despachos
   * pequenos que no tienen NIT, y el alta los rechazaba con «se requieren el
   * nombre y el NIT». El NIT es opcional; si viene, sigue siendo unico. Dos
   * firmas sin NIT deben convivir: la columna es UNIQUE y Postgres admite
   * varios NULL, pero no varios '' — asi que el servidor guarda NULL.
   */
  const sinNit1 = await pedir('/admin/firms', opToken, {
    method: 'POST',
    body: JSON.stringify({
      firmName: `Litigante sin NIT ${m}`,
      adminEmail: `sinnit1-${m}@iureon.test`,
      adminPassword: clavePrueba()
    })
  });
  check('una firma sin NIT se crea', sinNit1.status === 201, `${sinNit1.status} ${JSON.stringify(sinNit1.body)}`);
  check('y su NIT queda vacio, no inventado', sinNit1.body?.firm?.nit === null, String(sinNit1.body?.firm?.nit));

  const sinNit2 = await pedir('/admin/firms', opToken, {
    method: 'POST',
    body: JSON.stringify({
      firmName: `Otro litigante sin NIT ${m}`,
      nit: '   ',
      adminEmail: `sinnit2-${m}@iureon.test`,
      adminPassword: clavePrueba()
    })
  });
  check('una segunda firma sin NIT tambien (NULL, no cadena vacia)', sinNit2.status === 201, `${sinNit2.status} ${JSON.stringify(sinNit2.body)}`);

  const sinNombre = await pedir('/admin/firms', opToken, {
    method: 'POST',
    body: JSON.stringify({ firmName: '  ', adminEmail: `sinnombre-${m}@iureon.test`, adminPassword: clavePrueba() })
  });
  check('el nombre si sigue siendo obligatorio', sinNombre.status === 400, String(sinNombre.status));

  const sinMotivo = await pedir(`/admin/firms/${cliente.user.firmId}/credits`, opToken, {
    method: 'POST',
    body: JSON.stringify({ amount: 50000 })
  });
  check(
    'una recarga sin motivo se rechaza',
    sinMotivo.status === 400 && sinMotivo.body?.error === 'REASON_REQUIRED',
    `${sinMotivo.status} · ${sinMotivo.body?.error}`
  );

  // Un motivo de relleno tampoco pasa: el minimo es que diga algo.
  const motivoVacio = await pedir(`/admin/firms/${cliente.user.firmId}/credits`, opToken, {
    method: 'POST',
    body: JSON.stringify({ amount: 50000, reason: '   ok   ' })
  });
  check(
    'un motivo de relleno tampoco pasa',
    motivoVacio.status === 400,
    `${motivoVacio.status} · ${motivoVacio.body?.error}`
  );

  const recarga = await pedir(`/admin/firms/${cliente.user.firmId}/credits`, opToken, {
    method: 'POST',
    body: JSON.stringify({ amount: 50000, reason: MOTIVO_DE_PRUEBA })
  });
  check(
    'puede recargar el saldo de una firma, con motivo',
    recarga.status === 200 && recarga.body?.creditsBalance === 50000,
    JSON.stringify(recarga.body)
  );

  /*
   * ─── EL AJUSTE EN CONTRA, Y EL LIBRO ──────────────────────────────────────
   *
   * Una compensacion dada por error tiene que poder deshacerse por la misma
   * puerta y con el mismo rastro. Y lo que se acredita tiene que aparecer en
   * el libro de movimientos que el socio ve en su panel de Saldo: antes solo
   * cambiaba la cifra de la firma y el libro callaba.
   */
  const descuento = await pedir(`/admin/firms/${cliente.user.firmId}/credits`, opToken, {
    method: 'POST',
    body: JSON.stringify({ amount: -20000, reason: 'Reversion parcial de la compensacion de prueba' })
  });
  check(
    'puede descontar saldo con motivo, y el saldo baja',
    descuento.status === 200 && descuento.body?.creditsBalance === 30000,
    JSON.stringify(descuento.body)
  );

  const enRojo = await pedir(`/admin/firms/${cliente.user.firmId}/credits`, opToken, {
    method: 'POST',
    body: JSON.stringify({ amount: -100000, reason: 'Intento de dejar el saldo negativo' })
  });
  check(
    'pero nunca deja el saldo bajo cero',
    enRojo.status === 400 && enRojo.body?.error === 'INSUFFICIENT_BALANCE',
    `${enRojo.status} · ${enRojo.body?.error}`
  );

  const { data: libro } = await supabase!
    .from('credit_movements')
    .select('kind, amount_cop, balance_after_cop, description, actor_email')
    .eq('firm_id', cliente.user.firmId)
    .order('created_at', { ascending: true });
  const filas = (libro ?? []) as Array<{ kind: string; amount_cop: number; description: string; actor_email: string }>;
  check(
    'la recarga y el ajuste quedan en el libro de movimientos que el socio ve',
    filas.some((f) => f.kind === 'RECARGA' && Number(f.amount_cop) === 50000) &&
      filas.some((f) => f.kind === 'AJUSTE' && Number(f.amount_cop) === -20000),
    filas.map((f) => `${f.kind}:${f.amount_cop}`).join(' | ') || 'libro vacio'
  );
  check(
    'cada fila del libro lleva el motivo y el correo del operador',
    filas.every((f) => f.description.includes(' · ') && f.actor_email === correoOperador),
    filas.map((f) => f.actor_email).join(',')
  );

  /*
   * ─── LA FICHA DE LA FIRMA (7b) ────────────────────────────────────────────
   *
   * Trae lo que se necesita para gestionar el negocio del inquilino y NADA de
   * su contenido. Se comprueban las dos mitades: que los datos esten, y que el
   * material amparado por el secreto profesional NO.
   */
  const ficha = await pedir(`/admin/firms/${cliente.user.firmId}`, opToken);
  const f = ficha.body?.firm;
  check(
    'la ficha de la firma responde con sus datos reales',
    ficha.status === 200 && f?.nit === cliente.user.firmId.replace('firm-', '') ? true : ficha.status === 200 && Boolean(f?.name),
    `${ficha.status} · ${f?.name ?? 'sin nombre'}`
  );
  check(
    'la ficha trae las cuentas de la firma con su consumo',
    Array.isArray(f?.usuarios) && f.usuarios.length > 0 && 'consumoMesCop' in f.usuarios[0],
    `usuarios=${f?.usuarios?.length ?? 0}`
  );
  check(
    'la ficha NO trae transcritos, borradores ni expedientes',
    !('transcritos' in (f ?? {})) && !('borradores' in (f ?? {})) && !('documentos' in (f ?? {})),
    Object.keys(f ?? {}).join(',')
  );
  const fichaAjena = await pedir(`/admin/firms/${cliente.user.firmId}`, cliente.accessToken);
  check(
    'un abogado no puede abrir la ficha de su propia firma por la consola',
    fichaAjena.status === 403,
    String(fichaAjena.status)
  );

  // ─── Lo que NO puede: leer el expediente ajeno ────────────────────────────
  const espiando = await pedir('/transcription', opToken);
  const titulos = (espiando.body?.items ?? []).map((t: { title: string }) => t.title);
  check('NO puede leer las audiencias del cliente', !titulos.includes(RESERVADA), `${titulos.length} transcritos propios`);

  // ─── Y lo que hizo queda donde el cliente lo ve ───────────────────────────
  const auditoria = await pedir('/audit/logs', cliente.accessToken);
  const registros = (auditoria.body?.logs ?? []) as Array<{
    action: string;
    userEmail: string;
    resource: string;
  }>;
  const acciones = registros.map((l) => `${l.action}:${l.userEmail}`);
  check(
    'la recarga queda en la auditoría del cliente, con el operador nombrado',
    acciones.some((a: string) => a.startsWith('FIRM_CREDITS_ADDED') && a.includes(correoOperador)),
    acciones.join(' | ') || 'sin registros'
  );

  /*
   * Y EL MOTIVO VIAJA HASTA ALLA. Registrar «recargado» sin el porque deja al
   * socio de la firma leyendo un movimiento de dinero que nadie le explico:
   * la mitad util del registro es la razon.
   */
  const laRecarga = registros.find((l) => l.action === 'FIRM_CREDITS_ADDED');
  check(
    'el motivo escrito llega a la auditoría de la firma',
    Boolean(laRecarga?.resource?.includes(MOTIVO_DE_PRUEBA)),
    laRecarga?.resource ?? 'sin la recarga en el registro'
  );

  // ─── El rol no se puede pedir por la red ──────────────────────────────────
  const pidiendoRol = await pedir(`/admin/firms/${cliente.user.firmId}/users`, opToken, {
    method: 'POST',
    body: JSON.stringify({
      email: `colado${m}@iureon.test`,
      password: clavePrueba(),
      role: 'SUPER_ADMIN',
      reason: MOTIVO_DE_PRUEBA
    })
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
