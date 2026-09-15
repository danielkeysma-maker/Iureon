import React from 'react';
import type { MainView } from './types';
import { EVENTO_PANTALLA_RECORDADA, PANTALLAS, recordado, recordar } from './pantallaRecordada';
import { consultaQueSeConserva, leerRuta, rutaDeVista, type Ruta } from './rutas';

/**
 * LA DIRECCIÓN Y LA PANTALLA, SIEMPRE IGUALES.
 *
 * `rutas.ts` sabe traducir; esto las mantiene sincronizadas en las dos
 * direcciones sin que ninguna pantalla se entere:
 *
 *  · PANTALLA → DIRECCIÓN. Cuando cambia el módulo (`mainView`) o un módulo
 *    anota lo que tiene abierto (`recordar`, que avisa con un evento), se
 *    escribe la dirección. Cambiar de módulo o abrir un caso, un artículo, una
 *    herramienta o una sección AÑADE una entrada al historial, así que Atrás y
 *    Adelante recorren pantallas. Los diálogos (Saldo, Plan, Membrete) no pasan
 *    por aquí y no dejan huella: Atrás no debe cerrar un pago a medias.
 *  · DIRECCIÓN → PANTALLA. Al arrancar (`vistaInicialDeLaDireccion`) y con
 *    Atrás/Adelante (`popstate`), manda la dirección: deja el detalle donde el
 *    módulo lo busca al montarse y cambia de módulo.
 *
 * LA DIRECCIÓN GANA A LA MEMORIA DE LA PESTAÑA, y es decisión: antes una
 * recarga reabría el módulo guardado en `sessionStorage`; hoy la recarga
 * conserva la dirección, que ya dice qué pantalla era. `/inicio` es Inicio.
 * Lo que no va en la dirección —el transcrito abierto, el taller, el borrador
 * en redacción— se sigue recordando en la pestaña como siempre.
 */

/** Dónde anota cada módulo con detalle lo que tiene abierto. Los de `VISTAS_CON_DETALLE`. */
const CLAVE_DE_DETALLE: Partial<Record<MainView, string>> = {
  expedientes: PANTALLAS.expediente,
  tools: PANTALLAS.herramienta,
  manual: PANTALLAS.manual,
  ajustes: PANTALLAS.ajustes
};

export type RutaDeApp = Extract<Ruta, { tipo: 'app' }>;

/**
 * Deja el detalle de la dirección donde el módulo lo busca al montarse. Sin
 * detalle, lo borra: `/manual` es el índice aunque la pestaña recordara un
 * artículo.
 */
export const dejarDetalleDe = (ruta: RutaDeApp): void => {
  const clave = CLAVE_DE_DETALLE[ruta.vista];
  if (clave) recordar(clave, ruta.detalle);
};

/** El módulo con el que arranca la aplicación: el de la dirección, con su detalle ya anotado. */
export const vistaInicialDeLaDireccion = (): MainView | null => {
  if (typeof window === 'undefined') return null;
  const ruta = leerRuta(window.location.pathname);
  if (ruta.tipo !== 'app') return null;
  dejarDetalleDe(ruta);
  return ruta.vista;
};

interface Opciones {
  /** Solo con la aplicación a la vista: en Entrar o en el restablecimiento la dirección es de esas páginas. */
  activa: boolean;
  mainView: MainView;
  /** Aplica una pantalla que llegó por Atrás/Adelante. */
  alMoverseEnElHistorial: (ruta: RutaDeApp) => void;
}

export const useRutaDePantalla = ({ activa, mainView, alMoverseEnElHistorial }: Opciones): void => {
  const [anotaciones, setAnotaciones] = React.useState(0);
  const aplicar = React.useRef(alMoverseEnElHistorial);
  React.useEffect(() => {
    aplicar.current = alMoverseEnElHistorial;
  });

  /*
   * LA DIRECCIÓN QUE SE ACABA DE OBEDECER. Si la pantalla la corrige enseguida
   * —el caso de `/expedientes/<id>` ya no existe y el módulo vuelve a su
   * lista—, la corrección REEMPLAZA en vez de añadir: si no, Atrás volvería a
   * la dirección rota y el módulo la corregiría otra vez, sin salida.
   */
  const obedecida = React.useRef<string | null>(typeof window === 'undefined' ? null : window.location.pathname);

  React.useEffect(() => {
    const alAnotar = () => setAnotaciones((n) => n + 1);
    window.addEventListener(EVENTO_PANTALLA_RECORDADA, alAnotar);
    return () => window.removeEventListener(EVENTO_PANTALLA_RECORDADA, alAnotar);
  }, []);

  React.useEffect(() => {
    if (!activa) return;
    const clave = CLAVE_DE_DETALLE[mainView];
    const destino = rutaDeVista(mainView, clave ? recordado(clave) : null);
    const actual = window.location.pathname;
    if (destino === actual) return;

    const previa = leerRuta(actual);
    const correccion = obedecida.current === actual && previa.tipo === 'app' && previa.vista === mainView;
    obedecida.current = null;
    const url = `${destino}${consultaQueSeConserva(window.location.search)}`;
    /* Desde una página pública (recién entró) o una corrección, se reemplaza; lo demás es navegar. */
    if (previa.tipo !== 'app' || correccion) window.history.replaceState(null, '', url);
    else window.history.pushState(null, '', url);
  }, [activa, mainView, anotaciones]);

  React.useEffect(() => {
    if (!activa) return;
    const alMoverse = () => {
      const ruta = leerRuta(window.location.pathname);
      if (ruta.tipo !== 'app') {
        /* Atrás hasta Entrar con la sesión abierta: no hay nada que entrar, es Inicio. */
        window.history.replaceState(null, '', `/inicio${consultaQueSeConserva(window.location.search)}`);
        aplicar.current({ tipo: 'app', vista: 'inicio', detalle: null });
        return;
      }
      obedecida.current = window.location.pathname;
      aplicar.current(ruta);
    };
    window.addEventListener('popstate', alMoverse);
    return () => window.removeEventListener('popstate', alMoverse);
  }, [activa]);
};
