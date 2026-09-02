import { useCallback, useEffect, useState } from 'react';
import { httpClient } from '../../config/httpClient';

/**
 * Las preferencias de apariencia, y cómo se aplican al documento.
 *
 * SE APLICAN CON ATRIBUTOS EN `<html>`, no con clases en cada componente. Un
 * `data-theme="dark"` en la raíz cambia treinta y dos variables CSS de una vez;
 * la alternativa —pasar el tema por props hasta cada pantalla— obliga a que cada
 * componente sepa del tema, y basta que uno lo olvide para que quede una franja
 * clara en medio de una app oscura.
 *
 * EL TEMA SE APLICA ANTES DE QUE REACT MONTE. Si se esperara al primer render,
 * un abogado en modo oscuro vería un destello blanco en cada carga. Por eso hay
 * una función que corre desde `main.tsx` con lo último que se supo, y el resto
 * llega después sin que se note.
 */

export type Theme = 'system' | 'light' | 'dark';
export type UiFont = 'plex' | 'jakarta' | 'manrope' | 'instrument' | 'public' | 'satoshi' | 'system';
export type Density = 'compact' | 'normal' | 'comfortable';

export interface Preferences {
  theme: Theme;
  uiFont: UiFont;
  density: Density;
}

export const POR_DEFECTO: Preferences = {
  theme: 'system',
  uiFont: 'plex',
  density: 'normal'
};

/**
 * Un eco local de lo último aplicado.
 *
 * NO ES LA FUENTE DE VERDAD —esa es el servidor, para que valga en todos los
 * dispositivos— sino un recuerdo para pintar bien la PRIMERA pantalla, antes de
 * que la petición vuelva. Sin él, quien tiene tema oscuro ve un destello blanco
 * en cada carga.
 */
const ECO = 'iureon.apariencia';

const leerEco = (): Preferences => {
  try {
    const crudo = localStorage.getItem(ECO);
    return crudo ? { ...POR_DEFECTO, ...(JSON.parse(crudo) as Partial<Preferences>) } : POR_DEFECTO;
  } catch {
    // Un navegador con almacenamiento bloqueado no puede impedir entrar.
    return POR_DEFECTO;
  }
};

/**
 * Escribe los atributos en `<html>`.
 *
 * `system` NO escribe `data-theme`, y esa ausencia es deliberada: sin el
 * atributo manda el `@media (prefers-color-scheme)`, que es exactamente lo que
 * "según el sistema" significa. Escribir `data-theme="system"` congelaría el
 * tema en claro, porque ningún selector coincide con ese valor.
 */
export const aplicar = (p: Preferences): void => {
  const raiz = document.documentElement;

  if (p.theme === 'system') raiz.removeAttribute('data-theme');
  else raiz.setAttribute('data-theme', p.theme);

  if (p.uiFont === 'plex') raiz.removeAttribute('data-font');
  else raiz.setAttribute('data-font', p.uiFont);

  if (p.density === 'normal') raiz.removeAttribute('data-density');
  else raiz.setAttribute('data-density', p.density);

  try {
    localStorage.setItem(ECO, JSON.stringify(p));
  } catch {
    /* Sin eco se pierde el arranque instantáneo, no la preferencia. */
  }
};

/** Corre desde `main.tsx`, antes del primer render. Evita el destello blanco. */
export const aplicarLoUltimoConocido = (): void => aplicar(leerEco());

interface Respuesta {
  success: boolean;
  preferences: Preferences;
}

export const preferencesApi = {
  leer: () => httpClient.get<Respuesta>('/api/preferences'),
  guardar: (p: Preferences) => httpClient.put<Respuesta>('/api/preferences', { body: p })
};

/**
 * El estado de apariencia de la sesión.
 *
 * CAMBIA PRIMERO Y GUARDA DESPUÉS. El diseño no pone botón de guardar: la
 * apariencia se aplica al elegirla. Así que el cambio se pinta de inmediato y la
 * petición viaja detrás; si falla, se pierde la persistencia y no el cambio —
 * revertir la pantalla porque el servidor no contestó sería castigar al usuario
 * por un problema que no es suyo.
 */
export const usePreferences = () => {
  const [prefs, setPrefs] = useState<Preferences>(leerEco);

  useEffect(() => {
    let cancelado = false;

    preferencesApi
      .leer()
      .then((r) => {
        if (cancelado) return;
        setPrefs(r.preferences);
        aplicar(r.preferences);
      })
      .catch(() => {
        /* Sin servidor manda el eco local, que ya está aplicado. */
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const cambiar = useCallback((parcial: Partial<Preferences>) => {
    setPrefs((actual) => {
      const nuevo = { ...actual, ...parcial };
      aplicar(nuevo);
      void preferencesApi.guardar(nuevo).catch(() => {
        /* Ver arriba: se pierde la persistencia, no el cambio. */
      });
      return nuevo;
    });
  }, []);

  return { prefs, cambiar };
};

/**
 * A qué hora cambia el sistema, para poder decirlo.
 *
 * El diseño muestra "Ahora claro · oscuro a las 18:30" bajo la opción del
 * sistema. Esa hora NO la sabe el navegador: `prefers-color-scheme` solo dice
 * claro u oscuro ahora mismo, y ningún API expone el horario del sistema
 * operativo. Inventarla sería escribir un dato falso en una pantalla de ajustes.
 *
 * Así que se dice solo lo comprobable: en qué está el sistema en este momento.
 */
/*
 * El prefijo `use` NO es una concesión al inglés: es un contrato de React. Las
 * reglas de orden de hooks se aplican por el nombre, así que un hook llamado
 * `usaSistemaOscuro` escapa a esa vigilancia en silencio — se puede llamar
 * dentro de un `if` y nadie avisa hasta que el estado se desalinea.
 */
export const useSistemaOscuro = (): boolean => {
  const [oscuro, setOscuro] = useState(
    () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;

    const alCambiar = (e: MediaQueryListEvent) => setOscuro(e.matches);
    mq.addEventListener('change', alCambiar);
    return () => mq.removeEventListener('change', alCambiar);
  }, []);

  return oscuro;
};
