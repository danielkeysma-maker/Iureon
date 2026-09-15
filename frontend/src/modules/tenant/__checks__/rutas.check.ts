import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { NAV_MODULES } from '../navigation';
import {
  CLAVES_LEGADAS,
  SLUG_DE_VISTA,
  VISTAS_CON_DETALLE,
  destinoSeguro,
  leerRuta,
  resolverEntrada,
  rutaDeVista,
  urlLegada
} from '../rutas';
import { resolverRutaDeVercel } from '../../../../scripts/rutas-de-vercel.mjs';
import type { MainView } from '../types';

/**
 * LAS DIRECCIONES DE LA APLICACIÓN: UNA TABLA, SUS REDIRECCIONES Y SU PUERTA.
 *
 * Run with: npm run check:rutas
 *
 * ─── QUÉ SE GUARDA AQUÍ Y POR QUÉ JUNTO ─────────────────────────────────────
 *
 * Desde el 14 de septiembre de 2026 cada pantalla tiene su dirección
 * (`/expedientes/<id>`, `/manual/<articulo>`…). Eso crea tres promesas que no
 * lanzan error cuando se rompen: (1) que cada módulo tenga una dirección y que
 * esa dirección devuelva el mismo módulo; (2) que los enlaces viejos —correos
 * ya enviados, marcadores, la portada de ayer— sigan llevando a donde llevaban;
 * (3) que un destino recordado para después de entrar no pueda sacar al abogado
 * del sitio. Una redirección abierta en la puerta de entrada es la forma más
 * barata de suplantar la pantalla de inicio de sesión.
 *
 * Y una cuarta que solo se ve desplegado: que `vercel.json` sirva la portada en
 * `/` y la aplicación en lo demás. Se prueba con el mismo emulador que usa el
 * servidor de desarrollo (`scripts/rutas-de-vercel.mjs`), así que lo que se ve
 * en local es lo que este archivo aprueba.
 */

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  if (ok) console.log(`  ok    ${nombre}`);
  else {
    fallos += 1;
    console.log(`  FALLA ${nombre}${detalle ? ` — ${detalle}` : ''}`);
  }
};

const FRONTEND = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const RAIZ = join(FRONTEND, '..');
const leer = (...partes: string[]): string => readFileSync(join(...partes), 'utf8');

/* ─── 1. UN MÓDULO, UNA DIRECCIÓN, IDA Y VUELTA ────────────────────────── */

const vistas = NAV_MODULES.map((m) => m.id);
check('todo módulo de la barra tiene su dirección', vistas.every((v) => Boolean(SLUG_DE_VISTA[v])));
check(
  'ida y vuelta: la dirección de cada módulo lo devuelve a él',
  vistas.every((v) => {
    const r = leerRuta(rutaDeVista(v));
    return r.tipo === 'app' && r.vista === v && r.detalle === null;
  })
);
const slugs = Object.values(SLUG_DE_VISTA);
check('no hay dos módulos con la misma dirección', new Set(slugs).size === slugs.length);
check('las direcciones van sin tildes, sin mayúsculas y sin espacios', slugs.every((s) => /^[a-z]+$/.test(s)));
check(
  'los nombres en español que pidió el propietario',
  SLUG_DE_VISTA.workspace === 'redaccion' &&
    SLUG_DE_VISTA.taller === 'revisiones' &&
    SLUG_DE_VISTA.search === 'buscador' &&
    SLUG_DE_VISTA.tools === 'herramientas' &&
    SLUG_DE_VISTA.audit === 'auditoria' &&
    SLUG_DE_VISTA.catalogo === 'catalogo'
);
const muerdeSlug = { ...SLUG_DE_VISTA, catalogo: 'catálogo' };
check('muerde: una tilde en una dirección se detecta', !Object.values(muerdeSlug).every((s) => /^[a-z]+$/.test(s)));

check(
  'el detalle viaja y vuelve en las pantallas que lo tienen',
  (['expedientes', 'tools', 'manual', 'ajustes'] as MainView[]).every((v) => {
    const r = leerRuta(rutaDeVista(v, 'abc-123'));
    return VISTAS_CON_DETALLE.includes(v) && r.tipo === 'app' && r.vista === v && r.detalle === 'abc-123';
  })
);
check('/expedientes/<id> es el caso', rutaDeVista('expedientes', 'e1') === '/expedientes/e1');
check('/herramientas/agenda es la agenda', rutaDeVista('tools', 'agenda') === '/herramientas/agenda');
check('/ajustes/estilo es la sección', rutaDeVista('ajustes', 'estilo') === '/ajustes/estilo');
check('un módulo sin detalle ignora el que se le pase', rutaDeVista('soporte', 'x') === '/soporte');
check('un detalle con barras o puntos no se escribe en la dirección', rutaDeVista('manual', '../x') === '/manual');
check('/borradores/x no existe (Borradores no tiene detalle)', leerRuta('/borradores/x').tipo === 'desconocida');
check('una barra final no cambia la pantalla', (() => { const r = leerRuta('/manual/'); return r.tipo === 'app' && r.vista === 'manual' && r.detalle === null; })());
check('una dirección inventada es desconocida', leerRuta('/nada').tipo === 'desconocida' && leerRuta('/manual/a/b').tipo === 'desconocida');
check('la raíz es la portada', leerRuta('/').tipo === 'portada');

const pub = (p: string) => leerRuta(p);
check('/entrar, /prueba, /recuperar y /restablecer son páginas públicas', ['/entrar', '/prueba', '/recuperar', '/restablecer'].every((p) => pub(p).tipo === 'publica'));
check(
  '/registro/<plan> lleva el plan; sin plan o con uno raro, Esencial',
  (() => {
    const a = pub('/registro/premium');
    const b = pub('/registro/firma');
    const c = pub('/registro');
    return a.tipo === 'publica' && a.plan === 'PREMIUM' && b.tipo === 'publica' && b.plan === 'FIRMA' && c.tipo === 'publica' && c.plan === 'ESENCIAL';
  })()
);

/* ─── 2. EL DESTINO DESPUÉS DE ENTRAR NO SACA A NADIE DEL SITIO ────────── */

check('un módulo por su clave vieja', destinoSeguro('manual') === '/manual' && destinoSeguro('privacidad') === '/privacidad');
check('agenda y estilo, las dos claves con detalle', destinoSeguro('agenda') === '/herramientas/agenda' && destinoSeguro('estilo') === '/ajustes/estilo');
check('una dirección de la aplicación', destinoSeguro('/expedientes/abc') === '/expedientes/abc');
const MALOS = ['//evil.example', 'https://evil.example/manual', '/\\evil.example', 'javascript:alert(1)', '/%2F%2Fevil.example', '/manual/../../x', '/entrar', '/', '', 'evil', ' /manual', '/manual?x=//evil'];
const pasan = MALOS.filter((m) => destinoSeguro(m) !== null);
check('ningún destino externo, relativo al protocolo ni público pasa', pasan.length === 0, pasan.join(' · '));
check('sin destino, nada', destinoSeguro(null) === null);
check('muerde: un validador que solo mira la barra inicial dejaría pasar //evil', '//evil.example'.startsWith('/'));

/* ─── 3. LOS ENLACES VIEJOS SIGUEN LLEVANDO A DONDE LLEVABAN ───────────── */

const u = (href: string) => {
  const url = new URL(href, 'https://www.iureoncolombia.com');
  return { pathname: url.pathname, search: url.search, hash: url.hash };
};
const CASOS_LEGADOS: Array<[string, string | null]> = [
  ['/landing/index.html', '/'],
  ['/landing/', '/'],
  ['/landing/index.html#planes', '/#planes'],
  ['/?entrar=1', '/entrar'],
  ['/?entrar=1&ir=manual', '/entrar?ir=/manual'],
  ['/?entrar=1&ir=privacidad', '/entrar?ir=/privacidad'],
  ['/?prueba=1', '/prueba'],
  ['/?registro=PREMIUM', '/registro/premium'],
  ['/?registro=FIRMA', '/registro/firma'],
  ['/?registro=ESENCIAL', '/registro/esencial'],
  ['/?registro=raro', '/registro/esencial'],
  ['/?plan=PREMIUM', '/entrar?plan=PREMIUM'],
  ['/?entrar=1&plan=FIRMA', '/entrar?plan=FIRMA'],
  ['/?recuperar=1', '/recuperar'],
  ['/?restablecer=1#token_hash=abc', '/restablecer#token_hash=abc'],
  ['/?restablecer=1#access_token=T&type=recovery', '/restablecer#access_token=T&type=recovery'],
  ['/?restablecer=1', '/restablecer'],
  ['/?ir=borradores', '/borradores'],
  ['/?ir=agenda', '/herramientas/agenda'],
  ['/?ir=administrar', '/inicio?ir=administrar'],
  ['/?vista=1', '/inicio?vista=1'],
  ['/legado?entrar=1', '/entrar'],
  ['/legado', '/'],
  ['/', null],
  ['/?id=1234-abc&env=prod', null],
  ['/manual', null],
  ['/entrar?ir=/manual', null]
];
for (const [viejo, nuevo] of CASOS_LEGADOS) {
  const obtenido = urlLegada(u(viejo));
  check(`legado ${viejo} → ${nuevo ?? '(se queda)'}`, obtenido === nuevo, `obtuvo ${obtenido}`);
}
const sinFragmento = (url: string | null): string | null => (url === null ? null : url.split('#')[0]);
check(
  'muerde: una tabla que perdiera el fragmento del restablecimiento se detecta',
  sinFragmento(urlLegada(u('/?restablecer=1#token_hash=abc'))) !== '/restablecer#token_hash=abc'
);

/* ─── 4. LA PUERTA: QUÉ HACE LA APLICACIÓN AL ARRANCAR ─────────────────── */

const entrada = (href: string, sesion: boolean) => resolverEntrada(u(href), sesion);
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
check('con sesión, un módulo se queda', eq(entrada('/expedientes/e1', true), { tipo: 'quedarse' }));
check('sin sesión, un módulo pide entrar recordando el destino', eq(entrada('/expedientes/e1', false), { tipo: 'reemplazar', url: '/entrar?ir=/expedientes/e1' }));
check('sin sesión, /entrar se queda', eq(entrada('/entrar?ir=/manual', false), { tipo: 'quedarse' }));
check('con sesión, /entrar va al destino', eq(entrada('/entrar?ir=/manual', true), { tipo: 'reemplazar', url: '/manual' }));
check('con sesión, /entrar con un destino ajeno va a Inicio', eq(entrada('/entrar?ir=//evil.example', true), { tipo: 'reemplazar', url: '/inicio' }));
check('con sesión, /registro y /prueba van a Inicio', eq(entrada('/registro/premium', true), { tipo: 'reemplazar', url: '/inicio' }) && eq(entrada('/prueba', true), { tipo: 'reemplazar', url: '/inicio' }));
check('el enlace del correo manda sobre la sesión', eq(entrada('/restablecer#token_hash=x', true), { tipo: 'quedarse' }));
check('dirección desconocida con sesión: Inicio', eq(entrada('/nada', true), { tipo: 'reemplazar', url: '/inicio' }));
check('dirección desconocida sin sesión: la portada, cargada de verdad', eq(entrada('/nada', false), { tipo: 'cargar', url: '/' }));
check('la aplicación en la raíz sin sesión pinta Entrar (nunca recarga la raíz: no hay bucle)', eq(entrada('/', false), { tipo: 'reemplazar', url: '/entrar' }));
check('el enlace viejo del correo llega con el fragmento intacto', eq(entrada('/?restablecer=1#token_hash=abc', false), { tipo: 'reemplazar', url: '/restablecer#token_hash=abc' }));
check('/?registro=PREMIUM sin sesión: el registro de Premium', eq(entrada('/?registro=PREMIUM', false), { tipo: 'reemplazar', url: '/registro/premium' }));
check('/?entrar=1&ir=manual con sesión: directo al manual', eq(entrada('/?entrar=1&ir=manual', true), { tipo: 'reemplazar', url: '/manual' }));
check('la vista previa local conserva su marca', eq(entrada('/?vista=1', true), { tipo: 'reemplazar', url: '/inicio?vista=1' }));

/*
 * EL RETORNO DE WOMPI DE HOY. `WOMPI_REDIRECT_URL` no se cambió (decisión del
 * propietario, 14 sep 2026): el cliente vuelve a la raíz del sitio y Wompi le
 * añade `?id=<transacción>&env=<ambiente>`. Con sesión debe aterrizar en la
 * aplicación —no en la portada—, y Saldo se abre solo porque la referencia vive
 * en `sessionStorage` y `App` la lee al montar, sin importar la dirección.
 */
check('retorno de Wompi con sesión: a la aplicación', eq(entrada('/?id=1234-abc&env=prod', true), { tipo: 'reemplazar', url: '/inicio' }));
check('retorno de Wompi con barra final o /landing/: igual', eq(entrada('/legado?id=1&env=test', true), { tipo: 'reemplazar', url: '/inicio' }));
const APP = leer(FRONTEND, 'src', 'App.tsx');
check('Saldo se reabre por la referencia de la pestaña, no por la dirección', APP.includes('useState(hayRecargaPorConfirmar)'));

/* ─── 5. VERCEL: LA PORTADA EN /, LA APLICACIÓN EN LO DEMÁS ────────────── */

const VERCEL = JSON.parse(leer(FRONTEND, 'vercel.json'));
check('cleanUrls encendido', VERCEL.cleanUrls === true);
const v = (href: string) => {
  const url = new URL(href, 'https://www.iureoncolombia.com');
  return resolverRutaDeVercel(VERCEL, url.pathname, url.searchParams, () => false);
};
check('/ sin claves: la portada', eq(v('/'), { tipo: 'rewrite', destino: '/portada' }));
check('/?id&env de Wompi: la aplicación (que decide por la sesión)', eq(v('/?id=1&env=prod'), { tipo: 'rewrite', destino: '/app' }));
check('/?utm_source=x: la portada (una clave ajena no es legado)', eq(v('/?utm_source=x'), { tipo: 'rewrite', destino: '/portada' }));
check('cada clave vieja en / va a la aplicación', CLAVES_LEGADAS.every((c) => eq(v(`/?${c}=1`), { tipo: 'rewrite', destino: '/app' })));
check('las rutas de la aplicación van a la aplicación', ['/inicio', '/expedientes/e1', '/entrar', '/registro/premium', '/restablecer'].every((p) => eq(v(p), { tipo: 'rewrite', destino: '/app' })));
check('/landing/index.html y /landing/ redirigen a /', eq(v('/landing/index.html'), { tipo: 'redirect', destino: '/' }) && eq(v('/landing/'), { tipo: 'redirect', destino: '/' }) && eq(v('/landing'), { tipo: 'redirect', destino: '/' }));
check('un archivo que existe gana a las reescrituras', eq(resolverRutaDeVercel(VERCEL, '/brand/favicon.svg', new URLSearchParams(), () => true), null));
const orden = (VERCEL.rewrites as Array<{ source: string }>).map((r) => r.source);
check('el comodín va al final', orden[orden.length - 1] === '/(.*)' && orden.slice(0, -1).every((s) => s !== '/(.*)'));
const clavesDeVercel = (VERCEL.rewrites as Array<{ source: string; has?: Array<{ type: string; key: string }> }>)
  .filter((r) => r.source === '/' && r.has?.length === 1)
  .map((r) => r.has![0].key)
  .sort();
check('las claves de vercel.json son las de la tabla', eq(clavesDeVercel, [...CLAVES_LEGADAS].sort()), clavesDeVercel.join(','));
const muerdeOrden = { ...VERCEL, rewrites: [{ source: '/(.*)', destination: '/app' }, ...VERCEL.rewrites] };
check('muerde: con el comodín primero, / dejaría de ser la portada', !eq(resolverRutaDeVercel(muerdeOrden, '/', new URLSearchParams(), () => false), { tipo: 'rewrite', destino: '/portada' }));

/* ─── 6. LA PORTADA: SESIÓN ABIERTA Y CLAVES VIEJAS ────────────────────── */

const PORTADA = leer(FRONTEND, 'public', 'landing', 'index.html');
const SESSION = leer(FRONTEND, 'src', 'modules', 'auth', 'session.ts');
const cabeza = PORTADA.slice(0, PORTADA.indexOf('</head>'));
const claveDeSesion = /const KEY = '([^']+)'/.exec(SESSION)?.[1] ?? '';
check('la portada mira la misma clave de sesión que la aplicación', claveDeSesion.length > 0 && cabeza.includes(`'${claveDeSesion}'`));
check('y lo hace en <head>, antes de pintar (sin destello de portada)', /<script>[\s\S]*location\.replace\('\/inicio'/.test(cabeza));
const clavesDeLaPortada = (/var CLAVES = \[([^\]]*)\]/.exec(cabeza)?.[1] ?? '').split(',').map((s) => s.trim().replace(/'/g, '')).filter(Boolean).sort();
check('las claves que la portada pasa a la aplicación son las de la tabla', eq(clavesDeLaPortada, [...CLAVES_LEGADAS].sort()), clavesDeLaPortada.join(','));
check('la portada se declara canónica en la raíz', cabeza.includes('<link rel="canonical" href="https://www.iureoncolombia.com/">'));

/* ─── 7. LOS ENLACES SE ESCRIBEN CON LAS DIRECCIONES NUEVAS ────────────── */

/*
 * `/landing/` se busca como DIRECCIÓN (entre comillas o tras `href=`), no como
 * ruta de archivo: `public/landing/index.html` es donde vive la portada en el
 * código y se nombra con razón en checks y comentarios.
 */
const PROHIBIDAS = ['"/landing/', "'/landing/", '`/landing/', '?entrar=1', '?registro=', '?prueba=1', '?restablecer=1', '?recuperar=1', "'/?ir=", '`/?ir='];
const EXCEPTUADOS = new Set([
  // La tabla de legado y sus pruebas: son los únicos que deben nombrarlas.
  join('frontend', 'src', 'modules', 'tenant', 'rutas.ts'),
  join('frontend', 'src', 'modules', 'tenant', '__checks__', 'rutas.check.ts'),
  join('frontend', 'src', 'modules', 'auth', '__checks__', 'recuperacion.check.ts'),
  join('backend', 'src', 'modules', 'auth', '__checks__', 'recuperacion.check.ts')
]);
const archivos = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    /* `public/handoff` son las maquetas de diseño tal como llegaron: referencia, no enlaces de la aplicación. */
    if (n === 'node_modules' || n === 'dist' || n === 'handoff') return [];
    return statSync(p).isDirectory() ? archivos(p) : /\.(ts|tsx|html|js|mjs|json)$/.test(n) ? [p] : [];
  });
const barrido = [join(FRONTEND, 'src'), join(FRONTEND, 'public'), join(RAIZ, 'backend', 'src')].flatMap(archivos);
const sucios = barrido
  .map((p) => ({ rel: relative(RAIZ, p), texto: readFileSync(p, 'utf8') }))
  .filter(({ rel }) => !EXCEPTUADOS.has(rel))
  .flatMap(({ rel, texto }) => PROHIBIDAS.filter((x) => texto.includes(x)).map((x) => `${rel}: ${x}`));
check('ninguna dirección vieja fuera de la tabla de legado', sucios.length === 0, sucios.slice(0, 8).join(' · '));

const REGLAS = leer(RAIZ, 'backend', 'src', 'modules', 'auth', 'recuperacion.rules.ts');
check('el correo de recuperación apunta a /restablecer#', REGLAS.includes('`${base}/restablecer#token_hash=${encodeURIComponent(tokenHash)}`'));
const PLANTILLA = leer(RAIZ, 'backend', 'src', 'modules', 'mail', 'plantilla.ts');
check('los correos enlazan las direcciones nuevas', PLANTILLA.includes('`${SITIO}/entrar`') && PLANTILLA.includes('`${SITIO}/manual`') && PLANTILLA.includes('`${SITIO}/soporte`'));
const WOMPI = leer(RAIZ, 'backend', 'src', 'modules', 'billing', 'wompi', 'wompi.service.ts');
check('pendiente: redirect_url de Wompi sigue saliendo de WOMPI_REDIRECT_URL (sin tocar)', WOMPI.includes('elegirRetorno(gateway.redirectUrls, input.origen)'));
const MANIFIESTO = JSON.parse(leer(FRONTEND, 'public', 'manifest.webmanifest'));
check('la aplicación instalada abre en /inicio', MANIFIESTO.start_url === '/inicio' && MANIFIESTO.id === '/');

console.log('');
if (fallos > 0) {
  console.log(`${fallos} fallo(s).`);
  process.exit(1);
}
console.log('Rutas: todo en su sitio.');
