/**
 * GUARDA DE LA SESIÓN RECORDADA DURANTE SESENTA SEGUNDOS.
 *
 * Run with: npm run check:sesion-en-memoria
 *
 * ─── POR QUÉ EXISTE LA MEMORIA ─────────────────────────────────────────────
 *
 * Cada petición verificaba el token con una llamada de red a Supabase
 * (`getUser`). El 14 de septiembre de 2026 esa llamada tardó entre 1,5 y
 * 12,7 s, y con tres peticiones por cambio de rama en el catálogo, el saldo
 * cada 20 s y soporte cada 30 s, la aplicación quedó inutilizable. El dueño
 * aprobó recordar una verificación EXITOSA durante 60 segundos.
 *
 * ─── LO QUE ESTE ARCHIVO PROTEGE ───────────────────────────────────────────
 *
 * Una memoria de sesiones solo puede equivocarse en una dirección grave:
 * dejar pasar a quien ya no debe. Por eso se comprueba que solo se recuerda
 * lo VÁLIDO, que nunca se sirve pasado el `exp` del propio token, que la
 * llave es un hash y no el token, que el tamaño tiene techo, y que cada
 * función que cambia una cuenta desde este backend olvida sus sesiones.
 *
 * Nada aquí sale a la red ni toca la base: el verificador es falso.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  crearMemoriaDeSesiones,
  verificarRecordando,
  type ResultadoDeVerificacion
} from '../sesionesVerificadas';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

interface Usuario {
  id: string;
  email: string;
}

/** Un JWT con el `exp` dado. La firma es basura a propósito: aquí no se valida. */
const jwt = (expSegundos: number | null, sal = 'a'): string => {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const cuerpo = expSegundos === null ? { sub: sal } : { sub: sal, exp: expSegundos };
  return `${b64({ alg: 'HS256' })}.${b64(cuerpo)}.firma-${sal}`;
};

const reloj = (inicioMs: number) => {
  let ahora = inicioMs;
  return { ahora: () => ahora, avanzar: (ms: number) => (ahora += ms) };
};

/** Verificador falso que cuenta llamadas y responde lo que se le programe. */
const verificadorFalso = (responder: (token: string) => ResultadoDeVerificacion<Usuario>) => {
  const llamadas: string[] = [];
  const verificar = async (token: string) => {
    llamadas.push(token);
    return responder(token);
  };
  return { llamadas, verificar };
};

const valido = (id: string): ResultadoDeVerificacion<Usuario> => ({
  estado: 'VALIDO',
  user: { id, email: `${id}@x.test` }
});

const main = async () => {
  console.log('SESIÓN EN MEMORIA — se recuerda lo válido 60 s, y nada más');
  console.log('');

  const T0 = 1_800_000_000_000; // ms; exp lejano = T0/1000 + 3600
  const expLejano = T0 / 1000 + 3600;

  /* ─── 1. LA SEGUNDA LLAMADA DENTRO DE 60 s NO VA A LA RED ─────────────── */
  {
    const r = reloj(T0);
    const memoria = crearMemoriaDeSesiones<Usuario>({ ahora: r.ahora });
    const v = verificadorFalso(() => valido('u1'));
    const token = jwt(expLejano);

    const a = await verificarRecordando(token, v.verificar, memoria);
    r.avanzar(59_000);
    const b = await verificarRecordando(token, v.verificar, memoria);
    check('la primera verificación va a Supabase', a.estado === 'VALIDO');
    check(
      'la segunda, a los 59 s, no llama a getUser',
      v.llamadas.length === 1 && b.estado === 'VALIDO' && b.estado === 'VALIDO' && b.user.id === 'u1',
      `llamadas: ${v.llamadas.length}`
    );

    r.avanzar(1_000);
    await verificarRecordando(token, v.verificar, memoria);
    check('a los 60 s se vuelve a verificar', v.llamadas.length === 2, `llamadas: ${v.llamadas.length}`);
  }

  /* ─── 2. EL `exp` DEL TOKEN ACORTA LA VIDA, Y NUNCA SE SIRVE PASADO ───── */
  {
    const r = reloj(T0);
    const memoria = crearMemoriaDeSesiones<Usuario>({ ahora: r.ahora });
    const v = verificadorFalso(() => valido('u2'));
    const token = jwt(T0 / 1000 + 10); // vence en 10 s

    await verificarRecordando(token, v.verificar, memoria);
    r.avanzar(9_000);
    await verificarRecordando(token, v.verificar, memoria);
    check('dentro del exp se sirve de memoria', v.llamadas.length === 1);
    r.avanzar(1_000);
    await verificarRecordando(token, v.verificar, memoria);
    check(
      'al llegar el exp (10 s < 60 s) ya no se sirve',
      v.llamadas.length === 2,
      'la memoria no puede alargar la vida de un token vencido'
    );
  }
  {
    const r = reloj(T0);
    const memoria = crearMemoriaDeSesiones<Usuario>({ ahora: r.ahora });
    const token = jwt(T0 / 1000 - 5); // ya vencido según su exp
    memoria.recordar(token, { id: 'u3', email: '' }, memoria.turno());
    check('un token vencido por exp ni siquiera se guarda', memoria.tamano() === 0);
    check('ni se lee', memoria.leer(token) === null);
  }
  {
    const r = reloj(T0);
    const memoria = crearMemoriaDeSesiones<Usuario>({ ahora: r.ahora });
    const v = verificadorFalso(() => valido('u4'));
    const token = 'no-es-un-jwt';
    await verificarRecordando(token, v.verificar, memoria);
    r.avanzar(59_000);
    await verificarRecordando(token, v.verificar, memoria);
    r.avanzar(1_000);
    await verificarRecordando(token, v.verificar, memoria);
    check('sin exp legible se usan 60 s', v.llamadas.length === 2, `llamadas: ${v.llamadas.length}`);
  }

  /* ─── 3. INVALIDO Y NO_DISPONIBLE NUNCA SE RECUERDAN ──────────────────── */
  {
    const memoria = crearMemoriaDeSesiones<Usuario>({ ahora: reloj(T0).ahora });
    const v = verificadorFalso(() => ({ estado: 'INVALIDO', motivo: 'expiró' }));
    const token = jwt(expLejano);
    await verificarRecordando(token, v.verificar, memoria);
    const b = await verificarRecordando(token, v.verificar, memoria);
    check('INVALIDO no se recuerda', v.llamadas.length === 2 && memoria.tamano() === 0);
    check('y sigue siendo INVALIDO', b.estado === 'INVALIDO');
  }
  {
    const memoria = crearMemoriaDeSesiones<Usuario>({ ahora: reloj(T0).ahora });
    let caido = true;
    const v = verificadorFalso(() => (caido ? { estado: 'NO_DISPONIBLE', motivo: '504' } : valido('u5')));
    const token = jwt(expLejano);
    const a = await verificarRecordando(token, v.verificar, memoria);
    caido = false;
    const b = await verificarRecordando(token, v.verificar, memoria);
    check(
      'NO_DISPONIBLE no se recuerda: la siguiente llamada reintenta',
      a.estado === 'NO_DISPONIBLE' && b.estado === 'VALIDO' && v.llamadas.length === 2,
      'un tropiezo de Supabase no puede quedarse pegado'
    );
  }

  /* ─── 4. TOKENS DISTINTOS NO CHOCAN, Y LA LLAVE ES UN HASH ────────────── */
  {
    const memoria = crearMemoriaDeSesiones<Usuario>({ ahora: reloj(T0).ahora });
    const v = verificadorFalso((t) => valido(t === jwt(expLejano, 'a') ? 'ana' : 'beto'));
    const ta = jwt(expLejano, 'a');
    const tb = jwt(expLejano, 'b');
    const ra = await verificarRecordando(ta, v.verificar, memoria);
    const rb = await verificarRecordando(tb, v.verificar, memoria);
    const ra2 = await verificarRecordando(ta, v.verificar, memoria);
    const rb2 = await verificarRecordando(tb, v.verificar, memoria);
    check(
      'dos tokens, dos identidades, sin cruzarse',
      ra.estado === 'VALIDO' && rb.estado === 'VALIDO' && ra2.estado === 'VALIDO' && rb2.estado === 'VALIDO' &&
        ra2.user.id === 'ana' && rb2.user.id === 'beto' && v.llamadas.length === 2
    );
    const claves = memoria.claves();
    check(
      'las llaves son SHA-256 en hex, nunca el token',
      claves.length === 2 && claves.every((k) => /^[0-9a-f]{64}$/.test(k)) && !claves.includes(ta) && !claves.includes(tb),
      'un volcado de memoria no debe entregar sesiones utilizables'
    );
  }

  /* ─── 5. EL TAMAÑO TIENE TECHO ────────────────────────────────────────── */
  {
    const r = reloj(T0);
    const memoria = crearMemoriaDeSesiones<Usuario>({ ahora: r.ahora, capacidad: 3 });
    const t = (n: number) => jwt(expLejano, `t${n}`);
    memoria.recordar(t(1), { id: '1', email: '' }, memoria.turno());
    r.avanzar(1);
    memoria.recordar(t(2), { id: '2', email: '' }, memoria.turno());
    memoria.recordar(t(3), { id: '3', email: '' }, memoria.turno());
    memoria.recordar(t(4), { id: '4', email: '' }, memoria.turno());
    check('nunca pasa de la capacidad', memoria.tamano() === 3, `tamaño: ${memoria.tamano()}`);
    check('sale la más vieja', memoria.leer(t(1)) === null && memoria.leer(t(4))?.id === '4');

    // Con una vencida dentro, sale la vencida primero y no la más vieja viva.
    const r2 = reloj(T0);
    const m2 = crearMemoriaDeSesiones<Usuario>({ ahora: r2.ahora, capacidad: 3 });
    m2.recordar(t(1), { id: '1', email: '' }, m2.turno());
    m2.recordar(jwt(T0 / 1000 + 5, 'corto'), { id: 'corto', email: '' }, m2.turno());
    m2.recordar(t(3), { id: '3', email: '' }, m2.turno());
    r2.avanzar(6_000);
    m2.recordar(t(4), { id: '4', email: '' }, m2.turno());
    check(
      'primero se desalojan las vencidas',
      m2.tamano() === 3 && m2.leer(t(1))?.id === '1' && m2.leer(t(4))?.id === '4'
    );
  }

  /* ─── 6. OLVIDAR POR USUARIO ──────────────────────────────────────────── */
  {
    const memoria = crearMemoriaDeSesiones<Usuario>({ ahora: reloj(T0).ahora });
    memoria.recordar(jwt(expLejano, 'x1'), { id: 'x', email: '' }, memoria.turno());
    memoria.recordar(jwt(expLejano, 'x2'), { id: 'x', email: '' }, memoria.turno());
    memoria.recordar(jwt(expLejano, 'y1'), { id: 'y', email: '' }, memoria.turno());
    const borradas = memoria.olvidarUsuario('x');
    check(
      'olvidar a un usuario borra TODAS sus sesiones y solo las suyas',
      borradas === 2 && memoria.leer(jwt(expLejano, 'x1')) === null && memoria.leer(jwt(expLejano, 'y1'))?.id === 'y'
    );
  }
  {
    // Una verificación en vuelo que empezó ANTES de olvidar no puede reinstalar la sesión.
    const memoria = crearMemoriaDeSesiones<Usuario>({ ahora: reloj(T0).ahora });
    const token = jwt(expLejano, 'vuelo');
    let soltar: () => void = () => undefined;
    const lenta = async (): Promise<ResultadoDeVerificacion<Usuario>> => {
      await new Promise<void>((ok) => (soltar = ok));
      return valido('z');
    };
    const enVuelo = verificarRecordando(token, lenta, memoria);
    memoria.olvidarUsuario('z'); // p. ej. setUserActive(false) mientras Supabase tardaba
    soltar();
    await enVuelo;
    check(
      'una verificación que empezó antes de olvidar no se guarda',
      memoria.leer(token) === null,
      'si no, la desactivación duraría otros 60 s en esta misma instancia'
    );
  }

  /* ─── 7. CADA FUNCIÓN QUE CAMBIA UNA CUENTA OLVIDA SUS SESIONES ───────── */
  const src = join(process.cwd(), 'src/modules');
  const servicio = readFileSync(join(src, 'auth/auth.service.ts'), 'utf8');
  const admin = readFileSync(join(src, 'admin/admin.service.ts'), 'utf8');
  const borradoFirma = readFileSync(join(src, 'firms/borradoDeFirma.service.ts'), 'utf8');

  /** El cuerpo de `export const nombre = async (...) => { ... };` hasta el siguiente export. */
  const cuerpo = (fuente: string, nombre: string): string => {
    const i = fuente.indexOf(`export const ${nombre} = `);
    if (i < 0) return '';
    const j = fuente.indexOf('\nexport ', i + 1);
    return fuente.slice(i, j < 0 ? undefined : j);
  };

  const olvidaTrasElCambio = (fuente: string, nombre: string, cambio: RegExp): boolean => {
    const c = cuerpo(fuente, nombre);
    const m = cambio.exec(c);
    return !!m && /olvidarSesionesDe\(/.test(c.slice(m.index));
  };

  check('verificarToken pasa por la memoria', /verificarRecordando\(/.test(cuerpo(servicio, 'verificarToken')));
  check(
    'setUserActive olvida tras desactivar o reactivar',
    olvidaTrasElCambio(servicio, 'setUserActive', /updateUserById/)
  );
  check('setUserRole olvida tras cambiar el rol', olvidaTrasElCambio(servicio, 'setUserRole', /updateUserById/));
  check(
    'actualizarMiNombre olvida: el nombre viaja en la sesión recordada',
    olvidaTrasElCambio(servicio, 'actualizarMiNombre', /updateUserById/)
  );
  check('eliminarMiUsuario olvida tras borrar la cuenta', olvidaTrasElCambio(servicio, 'eliminarMiUsuario', /deleteUser\(/));
  check(
    'restablecerContrasenaDeUsuario olvida tras cambiar la contraseña',
    olvidaTrasElCambio(admin, 'restablecerContrasenaDeUsuario', /updateUserById/)
  );
  check(
    'borrarFirmaConTodo olvida las sesiones de cada cuenta de la firma',
    olvidaTrasElCambio(borradoFirma, 'borrarFirmaConTodo', /deleteUser\(/)
  );
  check(
    'ninguna escritura de cuenta quedó sin olvidar',
    (servicio.match(/auth\.admin\.(updateUserById|deleteUser)\(/g) ?? []).length === 4 &&
      (admin.match(/auth\.admin\.(updateUserById|deleteUser)\(/g) ?? []).length === 1 &&
      (borradoFirma.match(/auth\.admin\.(updateUserById|deleteUser)\(/g) ?? []).length === 1,
    'si aparece una escritura nueva, este conteo cae y obliga a decidir si olvida'
  );

  console.log('');
  if (fallos > 0) {
    console.log(`${fallos} comprobación(es) no pasaron.`);
    process.exitCode = 1;
  } else {
    console.log('TODO BIEN — la sesión se recuerda 60 s y se olvida cuando la cuenta cambia.');
  }
};

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
