import type { MainView } from './types';

/**
 * LAS DIRECCIONES DE LA APLICACIÓN, EN FUNCIONES PURAS.
 *
 * ─── POR QUÉ UNA TABLA Y NO UN ENRUTADOR ────────────────────────────────────
 *
 * Hasta el 14 de septiembre de 2026 la aplicación vivía entera en `/`: el
 * módulo abierto era estado de React (`mainView`) y la pantalla interior se
 * recordaba en `sessionStorage` (`pantallaRecordada.ts`). El propietario pidió
 * direcciones limpias por pantalla —para compartir un enlace, para que Atrás
 * funcione, para que un correo lleve a donde dice—.
 *
 * `react-router-dom` está en `package.json` y no se usa, y se decidió no usarlo
 * aquí. Adoptarlo exige convertir cada pantalla en un componente de ruta, y el
 * estado que de verdad importa —el borrador en redacción, el taller abierto, lo
 * que se mantiene vivo al ir y volver— vive hoy en `App.tsx` y en cada módulo,
 * no en la URL. Reescribir eso para cambiar cómo se escribe la dirección
 * arriesgaba justo lo que no se debe romper. Lo que hace falta es más pequeño:
 * una TABLA que traduzca pantalla ⇄ dirección y una CAPA que las mantenga
 * iguales (`useRutaDePantalla.ts`). Las pantallas no se enteran.
 *
 * Todo lo de este archivo es puro —recibe cadenas, devuelve cadenas— para que
 * `check:rutas` lo pruebe sin navegador.
 */

/**
 * Cada módulo y su dirección. Español, sin tildes, en minúsculas: una tilde en
 * una URL viaja como `%C3%A1` y se lee rota al copiarla en un correo.
 * «Revisiones» es `taller` por dentro y «Seguridad» es `audit`: la dirección
 * lleva lo que el abogado lee o lo que la pantalla es, no el nombre interno.
 */
export const SLUG_DE_VISTA: Readonly<Record<MainView, string>> = {
  inicio: 'inicio',
  workspace: 'redaccion',
  borradores: 'borradores',
  taller: 'revisiones',
  orientacion: 'orientacion',
  expedientes: 'expedientes',
  audiencias: 'audiencias',
  entrevistas: 'entrevistas',
  search: 'buscador',
  catalogo: 'catalogo',
  tools: 'herramientas',
  manual: 'manual',
  soporte: 'soporte',
  novedades: 'novedades',
  privacidad: 'privacidad',
  audit: 'auditoria',
  ajustes: 'ajustes'
};

const VISTA_DE_SLUG: Readonly<Record<string, MainView>> = Object.fromEntries(
  Object.entries(SLUG_DE_VISTA).map(([vista, slug]) => [slug, vista as MainView])
);

/**
 * Las pantallas cuyo contenido interior también va en la dirección: el caso,
 * la herramienta, el artículo y la sección. Las demás siguen recordando su
 * pantalla interior en la pestaña, como antes; se añaden aquí cuando alguien
 * necesite enlazarlas, no antes.
 */
export const VISTAS_CON_DETALLE: readonly MainView[] = ['expedientes', 'tools', 'manual', 'ajustes'];

/**
 * Un identificador, no una ruta. Sin barras, puntos ni `%`: lo que se escribe
 * en la dirección es un id que el módulo busca en su lista, y cualquier otra
 * cosa es o un error o alguien probando la puerta.
 */
const DETALLE_VALIDO = /^[A-Za-z0-9_-]{1,120}$/;

export type PlanDeRegistro = 'ESENCIAL' | 'PREMIUM' | 'FIRMA';
export type PaginaPublica = 'entrar' | 'registro' | 'prueba' | 'recuperar' | 'restablecer';

export type Ruta =
  | { tipo: 'app'; vista: MainView; detalle: string | null }
  | { tipo: 'publica'; pagina: PaginaPublica; plan?: PlanDeRegistro }
  | { tipo: 'portada' }
  | { tipo: 'desconocida' };

const PAGINAS_SIN_DETALLE: readonly PaginaPublica[] = ['entrar', 'prueba', 'recuperar', 'restablecer'];

/** Un plan desconocido cae a Esencial, igual que antes: nunca a una pantalla en blanco. */
const planDe = (valor: string | null | undefined): PlanDeRegistro => {
  const pedido = (valor ?? '').toUpperCase();
  return pedido === 'PREMIUM' || pedido === 'FIRMA' ? pedido : 'ESENCIAL';
};

export const rutaDeRegistro = (plan: PlanDeRegistro): string => `/registro/${plan.toLowerCase()}`;

export const leerRuta = (pathname: string): Ruta => {
  const partes = pathname.split('/').filter(Boolean);
  if (partes.length === 0) return { tipo: 'portada' };
  if (partes.length > 2) return { tipo: 'desconocida' };
  const [primero, segundo] = partes;

  if (primero === 'registro') return { tipo: 'publica', pagina: 'registro', plan: planDe(segundo) };
  if ((PAGINAS_SIN_DETALLE as readonly string[]).includes(primero)) {
    return segundo ? { tipo: 'desconocida' } : { tipo: 'publica', pagina: primero as PaginaPublica };
  }

  const vista = Object.prototype.hasOwnProperty.call(VISTA_DE_SLUG, primero) ? VISTA_DE_SLUG[primero] : undefined;
  if (!vista) return { tipo: 'desconocida' };
  if (!segundo) return { tipo: 'app', vista, detalle: null };
  if (!VISTAS_CON_DETALLE.includes(vista)) return { tipo: 'desconocida' };

  let detalle: string;
  try {
    detalle = decodeURIComponent(segundo);
  } catch {
    return { tipo: 'desconocida' };
  }
  return DETALLE_VALIDO.test(detalle) ? { tipo: 'app', vista, detalle } : { tipo: 'desconocida' };
};

/** La dirección de una pantalla. Un detalle que no cabe en la dirección se omite: se ve la lista. */
export const rutaDeVista = (vista: MainView, detalle?: string | null): string => {
  const base = `/${SLUG_DE_VISTA[vista]}`;
  return detalle && VISTAS_CON_DETALLE.includes(vista) && DETALLE_VALIDO.test(detalle) ? `${base}/${detalle}` : base;
};

/**
 * Las claves de `?ir=` que ya circulan —en avisos push de dispositivos, en
 * correos enviados y en la portada de ayer— y a dónde llevan hoy.
 * `administrar` no está: abre la consola de operación, que es un diálogo y no
 * una pantalla; se atiende en `App.tsx` sobre `/inicio?ir=administrar`.
 */
const IR_A_DESTINO: Readonly<Record<string, string>> = {
  soporte: '/soporte',
  borradores: '/borradores',
  manual: '/manual',
  privacidad: '/privacidad',
  agenda: '/herramientas/agenda',
  estilo: '/ajustes/estilo'
};

/**
 * EL DESTINO DESPUÉS DE ENTRAR, O NADA.
 *
 * `/entrar?ir=…` lleva a donde el abogado iba cuando se le pidió la sesión.
 * Ese valor lo escribe cualquiera que arme un enlace, así que es la puerta de
 * una redirección abierta: `/entrar?ir=//sitio-ajeno` convertiría la pantalla
 * de inicio de sesión de Iureon en el trampolín de una suplantación. Por eso
 * solo sale de aquí una dirección DE LA APLICACIÓN, reconstruida desde la
 * tabla —nunca el texto recibido—, o una clave conocida. Todo lo demás es null.
 */
export const destinoSeguro = (valor: string | null | undefined): string | null => {
  if (!valor) return null;
  if (Object.prototype.hasOwnProperty.call(IR_A_DESTINO, valor)) return IR_A_DESTINO[valor];
  if (valor.startsWith('//') || !/^\/[A-Za-z0-9/_-]*$/.test(valor)) return null;
  const ruta = leerRuta(valor);
  return ruta.tipo === 'app' ? rutaDeVista(ruta.vista, ruta.detalle) : null;
};

/**
 * Las claves de consulta con las que la aplicación se abría antes de tener
 * direcciones. MISMA LISTA en tres sitios que no comparten código, y
 * `check:rutas` los compara: los `has` de `vercel.json` (que mandan esas
 * visitas de `/` a la aplicación en vez de a la portada), el guion del `<head>`
 * de la portada (por si una llega igual) y esta tabla.
 */
export const CLAVES_LEGADAS = ['entrar', 'ir', 'prueba', 'registro', 'recuperar', 'restablecer', 'plan', 'vista'] as const;

/** Un valor de consulta legible: la barra de un destino no se escapa, lo demás sí. */
const valorDeConsulta = (valor: string): string => encodeURIComponent(valor).replace(/%2F/g, '/');

const armar = (ruta: string, params: ReadonlyArray<readonly [string, string]>, hash = ''): string => {
  const consulta = params.map(([clave, valor]) => `${clave}=${valorDeConsulta(valor)}`).join('&');
  return `${ruta}${consulta ? `?${consulta}` : ''}${hash}`;
};

export interface UrlPartida {
  pathname: string;
  search: string;
  hash: string;
}

/**
 * LOS ENLACES VIEJOS, TRADUCIDOS. Devuelve la dirección nueva o null si no es
 * un enlace viejo. PARA SIEMPRE: hay correos enviados con `/?restablecer=1`,
 * avisos push con `/?ir=borradores` y marcadores con `/landing/index.html`.
 *
 * EL FRAGMENTO VIAJA SIEMPRE. En el enlace de recuperación el token vive en
 * `#token_hash=…`, que el navegador nunca manda al servidor; por eso este caso
 * no se puede resolver en `vercel.json` y se resuelve aquí, en el navegador,
 * antes de que `enlaceDeRecuperacion.ts` lo lea y lo borre de la barra.
 *
 * `/legado` es la entrada por la que la portada devuelve a la aplicación una
 * visita con claves viejas que igual llegó a ella; se trata como la raíz.
 */
export const urlLegada = ({ pathname, search, hash }: UrlPartida): string | null => {
  if (pathname === '/landing' || pathname === '/landing/' || pathname === '/landing/index.html') return `/${hash}`;
  if (pathname !== '/' && pathname !== '/legado') return null;

  const q = new URLSearchParams(search);
  const vista: Array<[string, string]> = q.has('vista') ? [['vista', q.get('vista') || '1']] : [];

  if (q.has('restablecer')) {
    const resto = new URLSearchParams(search);
    resto.delete('restablecer');
    const texto = resto.toString();
    return `/restablecer${texto ? `?${texto}` : ''}${hash}`;
  }
  if (q.has('recuperar')) return armar('/recuperar', vista, hash);
  if (q.has('prueba')) return armar('/prueba', vista, hash);
  if (q.has('registro')) return armar(rutaDeRegistro(planDe(q.get('registro'))), vista, hash);

  const plan = q.get('plan');
  const conPlan: Array<[string, string]> = plan ? [['plan', plan.toUpperCase()]] : [];
  if (q.has('entrar')) {
    const destino = destinoSeguro(q.get('ir'));
    return armar('/entrar', [...(destino ? [['ir', destino] as [string, string]] : []), ...conPlan, ...vista], hash);
  }
  if (q.has('ir')) {
    const ir = q.get('ir');
    const destino = destinoSeguro(ir);
    if (destino) return armar(destino, vista, hash);
    return armar('/inicio', [...(ir === 'administrar' ? [['ir', 'administrar'] as [string, string]] : []), ...vista], hash);
  }
  if (plan) return armar('/entrar', [...conPlan, ...vista], hash);
  if (q.has('vista')) return armar('/inicio', vista, hash);
  if (pathname === '/legado') return `/${hash}`;
  return null;
};

export type AccionDeEntrada = { tipo: 'quedarse' } | { tipo: 'reemplazar'; url: string } | { tipo: 'cargar'; url: string };

/**
 * QUÉ HACE LA APLICACIÓN CON LA DIRECCIÓN CON LA QUE ARRANCA.
 *
 * `reemplazar` cambia la barra sin recargar (la aplicación ya está cargada y
 * sabe pintar la dirección nueva); `cargar` es una navegación de verdad, y solo
 * se usa hacia la portada, que es otro archivo.
 *
 * NUNCA HAY BUCLE CON LA PORTADA: la aplicación solo carga `/` desde una
 * dirección desconocida o desde `/legado`, y la portada solo devuelve a la
 * aplicación con sesión (`/inicio`) o con claves viejas (`/legado?…`), que aquí
 * nunca vuelven a `/`. Si la aplicación se encontrara servida en la raíz sin
 * sesión —una mala configuración—, pinta Entrar en vez de recargar la raíz.
 */
export const resolverEntrada = (url: UrlPartida, haySesion: boolean): AccionDeEntrada => {
  const original = `${url.pathname}${url.search}${url.hash}`;
  const legada = urlLegada(url);
  const actual = legada ?? original;
  const partida = new URL(actual, 'https://iureon.invalid');
  const q = partida.searchParams;
  const vista: Array<[string, string]> = q.has('vista') ? [['vista', q.get('vista') || '1']] : [];
  const cambiar = (nueva: string): AccionDeEntrada => (nueva === original ? { tipo: 'quedarse' } : { tipo: 'reemplazar', url: nueva });
  const ruta = leerRuta(partida.pathname);

  switch (ruta.tipo) {
    case 'portada':
      if (haySesion) return cambiar(armar('/inicio', vista));
      if (url.pathname !== '/') return { tipo: 'cargar', url: `/${partida.hash}` };
      return cambiar('/entrar');
    case 'publica':
      /* El enlace del correo manda sobre la sesión: quien lo abre vino a cambiar la contraseña. */
      if (ruta.pagina === 'restablecer') return cambiar(actual);
      if (haySesion) {
        if (ruta.pagina !== 'entrar') return cambiar(armar('/inicio', vista));
        const ir = q.get('ir');
        const destino = destinoSeguro(ir);
        if (destino) return cambiar(armar(destino, vista));
        return cambiar(armar('/inicio', [...(ir === 'administrar' ? [['ir', 'administrar'] as [string, string]] : []), ...vista]));
      }
      if (ruta.pagina === 'registro') return cambiar(`${rutaDeRegistro(ruta.plan ?? 'ESENCIAL')}${partida.search}${partida.hash}`);
      return cambiar(actual);
    case 'app':
      if (haySesion) return cambiar(actual);
      return cambiar(armar('/entrar', [['ir', rutaDeVista(ruta.vista, ruta.detalle)]]));
    default:
      return haySesion ? cambiar(armar('/inicio', vista)) : { tipo: 'cargar', url: '/' };
  }
};

/**
 * Lo que se conserva de la consulta al pasar de una pantalla a otra: solo la
 * marca de la vista previa local. Lo demás —el `?id=` con el que vuelve Wompi,
 * un `?ir=` ya atendido— se queda en la dirección donde llegó.
 */
export const consultaQueSeConserva = (search: string): string => {
  const q = new URLSearchParams(search);
  return q.has('vista') ? `?vista=${valorDeConsulta(q.get('vista') || '1')}` : '';
};

/** El título de la pestaña en las páginas públicas: lo que el buscador y el historial muestran. */
export const TITULO_DE_PAGINA: Readonly<Record<PaginaPublica, string>> = {
  entrar: 'Entrar · Iureon',
  registro: 'Crear la cuenta · Iureon',
  prueba: 'Prueba gratuita · Iureon',
  recuperar: 'Recuperar la contraseña · Iureon',
  restablecer: 'Nueva contraseña · Iureon'
};
