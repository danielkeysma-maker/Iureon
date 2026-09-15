/**
 * LO QUE VERCEL HACE CON UNA DIRECCIÓN, EMULADO A PARTIR DE `vercel.json`.
 *
 * ─── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 *
 * Desde el 14 de septiembre de 2026 la raíz `/` sirve la portada y todo lo
 * demás la aplicación, y eso lo decide `vercel.json`, que ni `vite` ni
 * `vite preview` leen. Sin esto, lo que se probara en local sería otra cosa
 * que lo desplegado: la regla más cara de esta casa es verificar el artefacto
 * y no un sustituto. Lo usan dos sitios —el servidor de desarrollo
 * (`vite.config.ts`) y `check:rutas`—, así que la configuración que se ve en el
 * navegador local es la misma que el check aprueba.
 *
 * ─── SOLO LO QUE `vercel.json` USA, Y FALLA CON LO DEMÁS ───────────────────
 *
 * Orden documentado por Vercel: las redirecciones, luego el sistema de
 * archivos (un archivo que existe gana a cualquier reescritura), luego las
 * reescrituras en orden. Fuentes admitidas: una ruta exacta o el comodín
 * `/(.*)`; condiciones `has`/`missing` de tipo `query` por clave. Un patrón
 * distinto LANZA: emularlo a medias daría una respuesta que se lee igual que
 * la de Vercel y no lo es.
 */

const coincide = (source, pathname) => {
  if (source === '/(.*)') return true;
  if (/[:()*?+]/.test(source)) throw new Error(`rutas-de-vercel: patrón no emulado «${source}»`);
  return source === pathname;
};

const cumple = (regla, query) => {
  for (const [lista, debeEstar] of [
    [regla.has ?? [], true],
    [regla.missing ?? [], false]
  ]) {
    for (const condicion of lista) {
      if (condicion.type !== 'query' || condicion.value !== undefined) {
        throw new Error(`rutas-de-vercel: condición no emulada ${JSON.stringify(condicion)}`);
      }
      if (query.has(condicion.key) !== debeEstar) return false;
    }
  }
  return true;
};

/**
 * @param {{ redirects?: object[]; rewrites?: object[] }} config  vercel.json
 * @param {string} pathname
 * @param {URLSearchParams} query
 * @param {(pathname: string) => boolean} existeArchivo
 * @returns {{ tipo: 'redirect' | 'rewrite'; destino: string } | null}  null = sirve el archivo o 404
 */
export const resolverRutaDeVercel = (config, pathname, query, existeArchivo) => {
  for (const regla of config.redirects ?? []) {
    if (coincide(regla.source, pathname) && cumple(regla, query)) return { tipo: 'redirect', destino: regla.destination };
  }
  if (existeArchivo(pathname)) return null;
  for (const regla of config.rewrites ?? []) {
    if (coincide(regla.source, pathname) && cumple(regla, query)) return { tipo: 'rewrite', destino: regla.destination };
  }
  return null;
};
