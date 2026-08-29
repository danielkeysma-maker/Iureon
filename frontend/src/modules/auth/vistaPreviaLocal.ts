import type { Session } from './session';

/**
 * Una sesión FALSA para mirar el diseño en local, sin credenciales.
 *
 * ─── POR QUÉ ESTO NO PUEDE LLEGAR A PRODUCCIÓN ──────────────────────────────
 *
 * `import.meta.env.DEV` no es una variable que se lea en tiempo de ejecución:
 * Vite la SUSTITUYE por el literal `false` al compilar para producción. El
 * `if` queda como `if (false && …)` y el minificador borra el bloque entero —
 * la función publicada devuelve `null` y no queda ni el nombre del parámetro en
 * el paquete. Se puede comprobar: `grep vista-previa dist/assets/*.js` no
 * encuentra nada.
 *
 * Eso importa más que la comodidad que da. Una puerta trasera de autenticación
 * gobernada por una condición que se evalúa en el navegador es una puerta
 * trasera; una que el compilador elimina no existe fuera del portátil de quien
 * la escribió.
 *
 * ─── ADEMÁS HAY QUE PEDIRLA ────────────────────────────────────────────────
 *
 * Ni siquiera en desarrollo se activa sola: exige `?vista=1` en la URL. Sin
 * eso, `npm run dev` sigue mostrando el login de verdad, que es lo que hay que
 * probar cuando se toca la autenticación.
 *
 * ─── LO QUE SE VE Y LO QUE NO ───────────────────────────────────────────────
 *
 * El token es basura, así que TODA llamada al backend contesta 401 y las
 * pantallas muestran su estado de error o su lista vacía. Sirve para ver la
 * ESTRUCTURA —la barra inferior, la hoja de «Más», el taller partido, las
 * tarjetas del catálogo— y no sirve para probar datos. Decirlo evita el
 * malentendido de creer que algo está roto cuando lo que falta es la sesión.
 */
export const sesionDeVistaPreviaLocal = (): Session | null => {
  if (!import.meta.env.DEV) return null;
  if (!new URLSearchParams(window.location.search).has('vista')) return null;

  return {
    accessToken: 'vista-previa-local-sin-valor',
    refreshToken: 'vista-previa-local-sin-valor',
    expiresIn: 3600,
    user: {
      id: 'vista-previa',
      email: 'vista.previa@local',
      firmId: 'vista-previa',
      /*
       * FIRM_ADMIN y no SUPER_ADMIN: es el rol del usuario corriente, y por
       * tanto el que hay que mirar. Con superusuario la barra lateral y la
       * cabecera muestran cosas que la mayoría no ve nunca.
       */
      role: 'FIRM_ADMIN'
    }
  };
};
