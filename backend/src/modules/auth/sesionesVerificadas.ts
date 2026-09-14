import { createHash } from 'node:crypto';

/**
 * LA SESIÓN VERIFICADA SE RECUERDA SESENTA SEGUNDOS, Y SOLO SI FUE VÁLIDA.
 *
 * ─── EL PROBLEMA ───────────────────────────────────────────────────────────
 *
 * Cada petición verificaba el token con una llamada de red a Supabase
 * (`auth.getUser`). El 14 de septiembre de 2026 esa llamada tardó entre 1,5 y
 * 12,7 s. El catálogo hace tres peticiones por cambio de rama, el saldo se
 * sondea cada 20 s y soporte cada 30 s: cada una pagaba ese tiempo antes de
 * hacer nada, y las pantallas quedaron inutilizables. El dueño aprobó recordar
 * una verificación EXITOSA durante 60 segundos.
 *
 * ─── LAS REGLAS, Y POR QUÉ CADA UNA ────────────────────────────────────────
 *
 * 1. Solo se recuerda VALIDO. Un INVALIDO recordado no ahorra nada que importe
 *    y un NO_DISPONIBLE recordado convertiría un tropiezo de Supabase en un
 *    minuto de 503 para esa persona. Y ninguno de los dos puede volverse
 *    válido por pasar por aquí, porque aquí no se guardan.
 *
 * 2. La llave es el SHA-256 del token, nunca el token. Un volcado de memoria o
 *    un registro descuidado no deben entregar sesiones utilizables.
 *
 * 3. La vida es el menor entre 60 s y lo que le quede al token según su `exp`.
 *    Ese `exp` se lee SIN verificar la firma y NO decide validez —la validez la
 *    dio `getUser`—: solo sirve para no servir desde memoria un token que ya
 *    venció. Si no se puede leer, se usan los 60 s.
 *
 * 4. Tamaño con techo. Primero salen las vencidas y, si no basta, la más
 *    vieja. Una instancia caliente no puede crecer sin límite.
 *
 * 5. Se olvida por usuario cuando ESTE backend cambia la cuenta (desactivar,
 *    cambiar rol o nombre, borrar, restablecer contraseña, borrar la firma).
 *    Una verificación que ya estaba en vuelo cuando se olvidó no se guarda al
 *    volver: si no, la desactivación se desharía sola en esta instancia.
 *
 * ─── EL COSTO ACEPTADO ─────────────────────────────────────────────────────
 *
 * La memoria vive por instancia serverless. Olvidar solo alcanza a la
 * instancia que atendió el cambio: OTRAS instancias calientes pueden seguir
 * aceptando esa sesión hasta 60 s. Lo mismo vale para lo que ocurre fuera de
 * este backend —un cierre de sesión hecho desde el navegador contra Supabase,
 * un cambio en el panel de Supabase—. Es el intercambio que se aprobó: un
 * minuto de gracia a cambio de no pagar la red en cada petición.
 */

export type ResultadoDeVerificacion<U> =
  | { estado: 'VALIDO'; user: U }
  | { estado: 'INVALIDO'; motivo: string }
  | { estado: 'NO_DISPONIBLE'; motivo: string };

export const VIDA_MAXIMA_MS = 60_000;
export const CAPACIDAD_POR_DEFECTO = 1000;

interface Entrada<U> {
  user: U;
  expiraEn: number;
}

export interface MemoriaDeSesiones<U extends { id: string }> {
  /** El usuario recordado para ese token, o null si no hay o ya venció. */
  leer(token: string): U | null;
  /**
   * Recuerda una verificación VÁLIDA. `turnoAlEmpezar` es el `turno()` tomado
   * ANTES de preguntar a Supabase: si ese usuario se olvidó después, no se
   * guarda.
   */
  recordar(token: string, user: U, turnoAlEmpezar: number): void;
  /** Borra todas las sesiones de ese usuario. Devuelve cuántas borró. */
  olvidarUsuario(userId: string): number;
  /** Marca de orden para detectar olvidos ocurridos durante una verificación. */
  turno(): number;
  tamano(): number;
  /** Las llaves guardadas (hashes). Para los checks. */
  claves(): string[];
}

const hashDelToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/**
 * El `exp` del JWT en milisegundos, o null si no se puede leer. NO VALIDA NADA:
 * sin comprobar la firma este número podría ser cualquiera, así que solo se usa
 * para ACORTAR la vida de algo que `getUser` ya declaró válido, nunca para
 * alargarla ni para aceptar un token.
 */
export const expDelToken = (token: string): number | null => {
  const partes = token.split('.');
  if (partes.length !== 3) return null;
  try {
    const cuerpo = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8')) as { exp?: unknown };
    return typeof cuerpo.exp === 'number' && Number.isFinite(cuerpo.exp) ? cuerpo.exp * 1000 : null;
  } catch {
    return null;
  }
};

export const crearMemoriaDeSesiones = <U extends { id: string }>(opciones: {
  ahora?: () => number;
  capacidad?: number;
  vidaMs?: number;
} = {}): MemoriaDeSesiones<U> => {
  const ahora = opciones.ahora ?? Date.now;
  const capacidad = Math.max(1, opciones.capacidad ?? CAPACIDAD_POR_DEFECTO);
  const vidaMs = Math.min(opciones.vidaMs ?? VIDA_MAXIMA_MS, VIDA_MAXIMA_MS);

  /* Map conserva el orden de inserción: la primera llave es la más vieja. */
  const entradas = new Map<string, Entrada<U>>();

  /*
   * Turno del último olvido de cada usuario. Con techo propio: si se llena se
   * descartan los más viejos, que solo protegían verificaciones en vuelo de
   * hace mucho.
   */
  let contador = 0;
  const olvidos = new Map<string, number>();

  const purgarVencidas = (t: number) => {
    for (const [llave, e] of entradas) if (e.expiraEn <= t) entradas.delete(llave);
  };

  return {
    leer(token) {
      const llave = hashDelToken(token);
      const e = entradas.get(llave);
      if (!e) return null;
      if (e.expiraEn <= ahora()) {
        entradas.delete(llave);
        return null;
      }
      return e.user;
    },

    recordar(token, user, turnoAlEmpezar) {
      const olvidadoEn = olvidos.get(user.id);
      if (olvidadoEn !== undefined && olvidadoEn > turnoAlEmpezar) return;

      const t = ahora();
      const exp = expDelToken(token);
      const expiraEn = Math.min(t + vidaMs, exp ?? Number.POSITIVE_INFINITY);
      if (expiraEn <= t) return;

      const llave = hashDelToken(token);
      entradas.delete(llave);
      if (entradas.size >= capacidad) purgarVencidas(t);
      while (entradas.size >= capacidad) {
        const masVieja = entradas.keys().next().value as string;
        entradas.delete(masVieja);
      }
      entradas.set(llave, { user, expiraEn });
    },

    olvidarUsuario(userId) {
      contador += 1;
      olvidos.delete(userId);
      olvidos.set(userId, contador);
      while (olvidos.size > capacidad) olvidos.delete(olvidos.keys().next().value as string);

      let borradas = 0;
      for (const [llave, e] of entradas) {
        if (e.user.id === userId) {
          entradas.delete(llave);
          borradas += 1;
        }
      }
      return borradas;
    },

    turno: () => contador,
    tamano: () => entradas.size,
    claves: () => [...entradas.keys()]
  };
};

/**
 * Verifica pasando por la memoria: si hay una verificación válida reciente se
 * devuelve sin ir a la red; si no, se pregunta y solo se guarda un VALIDO.
 */
export const verificarRecordando = async <U extends { id: string }>(
  token: string,
  verificar: (token: string) => Promise<ResultadoDeVerificacion<U>>,
  memoria: MemoriaDeSesiones<U>
): Promise<ResultadoDeVerificacion<U>> => {
  const recordado = memoria.leer(token);
  if (recordado) return { estado: 'VALIDO', user: recordado };

  const turnoAlEmpezar = memoria.turno();
  const resultado = await verificar(token);
  if (resultado.estado === 'VALIDO') memoria.recordar(token, resultado.user, turnoAlEmpezar);
  return resultado;
};
