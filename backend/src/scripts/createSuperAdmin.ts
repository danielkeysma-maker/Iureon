import * as readline from 'node:readline';
import { supabase } from '../config/supabase.config';

/**
 * Creates the platform operator: the one account with SUPER_ADMIN.
 *
 * WHY A SCRIPT AND NOT AN ENDPOINT. There is no endpoint that grants this role,
 * on purpose — `addUserToFirm` coerces anything that is not FIRM_ADMIN down to
 * LAWYER, and the admin console does the same. A power that can be requested
 * over the network is not a power, it is an opening. This runs against the
 * database with the service key, which means holding the server's own
 * credentials, which is the correct bar for creating the account that manages
 * every other one.
 *
 * WHY THE OPERATOR ALSO GETS A FIRM. Because they use the product too — drafting,
 * transcribing, spending their own balance. Giving them their own tenant is
 * what makes the boundary practical instead of merely stated: nothing ever
 * pushes them into a client's firm to get work done.
 *
 *   npm run superadmin -- correo@dominio.co   (promueve una cuenta ya registrada)
 *   npm run superadmin                        (crea cuenta y firma desde cero)
 *
 * The password is typed in, never passed as an argument: a command line ends up
 * in the shell history and in the process list.
 */

const preguntar = (rl: readline.Interface, pregunta: string): Promise<string> =>
  new Promise((resolve) => rl.question(pregunta, (respuesta) => resolve(respuesta.trim())));

const salir: (mensaje: string) => never = (mensaje) => {
  console.error(`\n${mensaje}`);
  process.exit(1);
};

(async () => {
  const client = supabase;
  if (!client) salir('Supabase no está configurado.');

  /*
   * PROMOCIÓN DIRECTA, sin preguntas.
   *
   * El camino cómodo para una persona que no vive en una terminal: registra su
   * firma en la aplicación, eligiendo allí su propia contraseña, y aquí solo se
   * eleva esa cuenta. Nadie tiene que teclear ni transmitir una clave, que es
   * la parte que conviene que no ocurra.
   *
   *   npm run superadmin -- correo@dominio.co
   */
  const correoDirecto = process.argv[2]?.trim().toLowerCase();

  if (correoDirecto) {
    const { data: usuarios } = await client.auth.admin.listUsers();
    const cuenta = usuarios.users.find((u) => u.email?.toLowerCase() === correoDirecto);

    if (!cuenta) {
      salir(
        `No hay ninguna cuenta con el correo ${correoDirecto}.\n` +
          'Regístrate primero en la aplicación y vuelve a correr esto.'
      );
    }

    const firmaActual = (cuenta!.app_metadata as Record<string, unknown>)?.firm_id;

    if (typeof firmaActual !== 'string' || !firmaActual) {
      salir('Esa cuenta no pertenece a ninguna firma. Regístrala desde la aplicación.');
    }

    const { error } = await client.auth.admin.updateUserById(cuenta!.id, {
      app_metadata: { firm_id: firmaActual, role: 'SUPER_ADMIN' }
    });

    if (error) salir(`No se pudo promover la cuenta: ${error.message}`);

    console.log(`\n${correoDirecto} ahora es SUPER_ADMIN, sobre su firma ${firmaActual}.`);
    console.log('Cierra sesión en la aplicación y vuelve a entrar: el rol viaja en el token nuevo.');
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('\nCuenta de operador de la plataforma (SUPER_ADMIN)\n');

  const email = (await preguntar(rl, 'Correo: ')).toLowerCase();
  const password = await preguntar(rl, 'Contraseña (mínimo 8 caracteres): ');
  const firmName = await preguntar(rl, 'Nombre de tu propia firma: ');
  const nit = await preguntar(rl, 'NIT de tu propia firma: ');

  rl.close();

  if (!email || !password || !firmName || !nit) salir('Faltan datos. No se creó nada.');
  if (password.length < 8) salir('La contraseña debe tener al menos 8 caracteres.');

  const { data: usuarios } = await client.auth.admin.listUsers();
  const yaExiste = usuarios.users.find((u) => u.email?.toLowerCase() === email);

  const { data: firmaConEseNit } = await client
    .from('firms')
    .select('firm_id, name')
    .eq('nit', nit)
    .maybeSingle();

  /*
   * Promoting an existing account is supported because the ordinary path is to
   * register a firm through the app first and then discover the operator role
   * is needed. Re-running with the same e-mail must not create a second tenant.
   */
  if (yaExiste) {
    const firmaActual = (yaExiste.app_metadata as Record<string, unknown>)?.firm_id;

    if (typeof firmaActual !== 'string' || !firmaActual) {
      salir('Esa cuenta existe pero no pertenece a ninguna firma. Bórrala en Supabase y vuelve a correr esto.');
    }

    const { error } = await client.auth.admin.updateUserById(yaExiste.id, {
      app_metadata: { firm_id: firmaActual, role: 'SUPER_ADMIN' }
    });

    if (error) salir(`No se pudo promover la cuenta: ${error.message}`);

    console.log(`\nCuenta ${email} promovida a SUPER_ADMIN, sobre su firma ${firmaActual}.`);
    console.log('Cierra sesión y vuelve a entrar para que el token nuevo traiga el rol.');
    return;
  }

  if (firmaConEseNit) {
    salir(
      `Ya hay una firma con el NIT ${nit} (${(firmaConEseNit as { name: string }).name}).\n` +
        'Usa otro NIT, o registra la cuenta en la app y vuelve a correr esto para promoverla.'
    );
  }

  const firmId = `firm-${Date.now()}`;

  const { error: firmError } = await client.from('firms').insert({
    firm_id: firmId,
    name: firmName,
    nit,
    plan_tier: 'ENTERPRISE',
    subscription_status: 'active'
  });

  if (firmError) salir(`No se pudo crear la firma: ${firmError.message}`);

  const { error: userError } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { firm_id: firmId, role: 'SUPER_ADMIN' }
  });

  if (userError) {
    await client.from('firms').delete().eq('firm_id', firmId);
    salir(`No se pudo crear la cuenta: ${userError.message}`);
  }

  console.log(`\nOperador creado: ${email}`);
  console.log(`Su propia firma: ${firmName} (${firmId})`);
  console.log('\nEntra en la aplicación con ese correo y esa contraseña.');
})();
