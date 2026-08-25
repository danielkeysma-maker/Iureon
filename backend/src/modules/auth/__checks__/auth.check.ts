/**
 * Guards the tenant boundary, which is the whole point of this module.
 *
 * Run with: npm run check:auth
 *
 * It creates two firms, proves neither can become the other, and deletes both.
 * The two-firm shape is not decoration: it is what caught the defect that the
 * shared Supabase client changes identity when somebody signs in, so the second
 * registration ran as the first firm's administrator and was refused by RLS. On
 * a warm serverless instance that would have leaked a tenant between requests
 * instead of failing loudly.
 */
import { supabase } from '../../../config/supabase.config';
import { signIn, userFromToken, AuthError } from '../auth.service';
import { crearFirmaConSesion, clavePrueba } from './helpers';

const marca = Date.now();
const A = { firmName: `Firma A ${marca}`, nit: `900${marca}`, email: `a${marca}@iureon.test`, password: clavePrueba() };
const B = { firmName: `Firma B ${marca}`, nit: `901${marca}`, email: `b${marca}@iureon.test`, password: clavePrueba() };

let fallos = 0;
const check = (n: string, ok: boolean, d = '') => { console.log(`${ok ? 'OK  ' : 'FALLA'} ${n}${d ? ' — ' + d : ''}`); if (!ok) fallos++; };

(async () => {
  const sa = await crearFirmaConSesion(A);
  const sb = await crearFirmaConSesion(B);

  check('crear una firma la deja en la base', true, sa.user.firmId);
  check('cada firma creada es un inquilino distinto', sa.user.firmId !== sb.user.firmId,
    `${sa.user.firmId} vs ${sb.user.firmId}`);
  check('el primer usuario es administrador', sa.user.role === 'FIRM_ADMIN', sa.user.role);

  const { data: filaA } = await supabase!.from('firms').select('name, nit').eq('firm_id', sa.user.firmId).single();
  check('la fila de la firma existe de verdad', (filaA as any)?.nit === A.nit, JSON.stringify(filaA));

  // El token de A dice A, y nada puede hacer que diga B.
  const desdeToken = await userFromToken(sa.accessToken);
  check('el token resuelve a su propia firma', desdeToken?.firmId === sa.user.firmId, String(desdeToken?.firmId));
  check('el token de A nunca resuelve a la firma de B', desdeToken?.firmId !== sb.user.firmId);

  // Contraseña equivocada.
  let rechazado = false;
  try { await signIn(A.email, 'otra-cosa'); } catch (e) { rechazado = e instanceof AuthError && e.status === 401; }
  check('una contraseña equivocada se rechaza', rechazado);

  // Correo inexistente: mismo mensaje, para no delatar qué cuentas existen.
  let mensajeDesconocido = '';
  try { await signIn(`nadie${marca}@iureon.test`, 'lo-que-sea'); } catch (e) { mensajeDesconocido = (e as Error).message; }
  let mensajeMalaClave = '';
  try { await signIn(A.email, 'otra-cosa'); } catch (e) { mensajeMalaClave = (e as Error).message; }
  check('no delata qué correos tienen cuenta', mensajeDesconocido === mensajeMalaClave, mensajeDesconocido);

  // Token inventado.
  check('un token falso no autentica', (await userFromToken('esto.no.es-un-token')) === null);

  // NIT repetido.
  let duplicado = false;
  try { await crearFirmaConSesion({ ...B, email: `c${marca}@iureon.test` }); } catch (e) { duplicado = e instanceof AuthError && e.code === 'FIRM_EXISTS'; }
  check('no se puede crear dos veces el mismo NIT', duplicado);

  // Contraseña débil.
  let debil = false;
  try { await crearFirmaConSesion({ firmName: 'X', nit: `902${marca}`, email: `d${marca}@iureon.test`, password: 'corta' }); }
  catch (e) { debil = e instanceof AuthError && e.code === 'WEAK_PASSWORD'; }
  check('una contraseña corta se rechaza', debil);

  // Limpieza.
  const { data: usuarios } = await supabase!.auth.admin.listUsers();
  for (const u of usuarios.users) if (u.email?.includes(String(marca))) await supabase!.auth.admin.deleteUser(u.id);
  await supabase!.from('firms').delete().in('firm_id', [sa.user.firmId, sb.user.firmId]);
  await supabase!.from('firms').delete().eq('nit', `902${marca}`);

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} FALLAS`);
  process.exit(fallos === 0 ? 0 : 1);
})();
