/**
 * Guards the public landing page (`public/landing/index.html`).
 *
 * Run with: npm run check:landing
 *
 * EL DEFECTO QUE VIGILA. La portada es un archivo estático: no importa nada
 * del backend, así que cada cifra que muestra es una COPIA. Una copia envejece
 * en silencio. Ya pasó dos veces: el diseño anunciaba «14 días de prueba» en
 * Premium cuando la prueba pública es de Esencial y dura 7, y «858
 * actuaciones» cuando el catálogo tiene otra cifra. Ninguna de las dos lanza
 * error; las dos son una promesa comercial falsa a quien llega a contratar.
 *
 * Por eso aquí se leen las fuentes de verdad del backend como TEXTO y se
 * comparan con lo que la portada dice, en el marcado y en el script del
 * interruptor Mensual/Anual.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerRuta } from '../../modules/tenant/rutas';

const AQUI = dirname(fileURLToPath(import.meta.url));
const FRONTEND = join(AQUI, '..', '..', '..');
const BACKEND = join(AQUI, '..', '..', '..', '..', 'backend', 'src');

const HTML = readFileSync(join(FRONTEND, 'public', 'landing', 'index.html'), 'utf8');
const PLANES_TS = readFileSync(join(BACKEND, 'modules', 'subscriptions', 'plan.catalog.ts'), 'utf8');
const PRUEBA_TS = readFileSync(join(BACKEND, 'modules', 'trial', 'trial.rules.ts'), 'utf8');
const DATOS_CATALOGO = join(BACKEND, 'modules', 'catalog', 'data');

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/*
 * SE MIRA EL CÓDIGO SIN COMENTARIOS. Un comentario que explica por qué no se
 * dice «entrena» contiene la palabra; denunciarlo convertiría la explicación
 * en la falsa alarma.
 */
const CODIGO = HTML.replace(/<!--[\s\S]*?-->/g, ' ').replace(/\/\*[\s\S]*?\*\//g, ' ');

/** Lo que lee una persona: sin estilos, sin scripts, sin etiquetas. */
const VISIBLE = CODIGO.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ');

const SCRIPT = [...CODIGO.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n');

const pesos = (n: number): string => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* ─── 1. LOS PRECIOS SON LOS DE plan.catalog.ts ─────────────────────────── */
type PlanId = 'ESENCIAL' | 'PREMIUM' | 'FIRMA';
const PLANES: PlanId[] = ['ESENCIAL', 'PREMIUM', 'FIRMA'];
/** Las claves cortas que usan `data-price` y el script. */
const CLAVE: Record<string, PlanId> = { es: 'ESENCIAL', pr: 'PREMIUM', fi: 'FIRMA' };

const precios = {} as Record<PlanId, { mensual: string; anual: string }>;
for (const plan of PLANES) {
  const m = PLANES_TS.match(
    new RegExp(`\\b${plan}:\\s*\\{[\\s\\S]*?precioMensualCop:\\s*([\\d_]+)[\\s\\S]*?precioAnualCop:\\s*([\\d_]+)`)
  );
  if (m) {
    precios[plan] = {
      mensual: pesos(Number(m[1].replace(/_/g, ''))),
      anual: pesos(Number(m[2].replace(/_/g, '')))
    };
  }
}
check(
  'los precios se leen del catálogo de planes del backend',
  PLANES.every((p) => precios[p]),
  PLANES.map((p) => `${p} ${precios[p]?.mensual ?? '?'} / ${precios[p]?.anual ?? '?'}`).join(' · ')
);

/** Los bloques de cada plan, con su posición, para saber qué queda DENTRO. */
const bloques = [...CODIGO.matchAll(/<article\b[^>]*data-plan="(\w+)"[^>]*>([\s\S]*?)<\/article>/g)].map((m) => ({
  plan: m[1],
  contenido: m[2],
  desde: m.index ?? 0,
  hasta: (m.index ?? 0) + m[0].length
}));
const bloqueDe = (plan: string) => bloques.find((b) => b.plan === plan);
const dentroDe = (plan: string, i: number): boolean => {
  const b = bloqueDe(plan);
  return Boolean(b && i >= b.desde && i < b.hasta);
};

check(
  'cada plan tiene su bloque identificado con data-plan',
  PLANES.every((p) => bloqueDe(p)) && bloques.length === PLANES.length,
  bloques.map((b) => b.plan).join(', ')
);

const preciosEstaticos = [...CODIGO.matchAll(/data-price="(\w+)"[^>]*>([^<]*)</g)];
const malEstaticos = preciosEstaticos.filter((m) => {
  const plan = CLAVE[m[1]];
  return !plan || !precios[plan] || m[2].trim() !== precios[plan].mensual;
});
check(
  'todo precio del marcado es el mensual del backend',
  preciosEstaticos.length >= PLANES.length && malEstaticos.length === 0,
  malEstaticos.length
    ? malEstaticos.map((m) => `${m[1]}=${m[2]}`).join(' · ')
    : `${preciosEstaticos.length} precios`
);
check(
  'cada bloque de plan muestra SU precio',
  PLANES.every((p) => {
    const b = bloqueDe(p);
    return b && [...b.contenido.matchAll(/data-price="(\w+)"/g)].every((m) => CLAVE[m[1]] === p) && /data-price=/.test(b.contenido);
  })
);

const tablaDelScript = (periodo: string): Record<string, string> => {
  const m = SCRIPT.match(new RegExp(`${periodo}\\s*:\\s*\\{([^}]*)\\}`));
  return Object.fromEntries([...(m?.[1] ?? '').matchAll(/(\w+)\s*:\s*'([^']*)'/g)].map((x) => [x[1], x[2]]));
};
const mensualScript = tablaDelScript('monthly');
const anualScript = tablaDelScript('annual');
const malScript = Object.entries(CLAVE).flatMap(([clave, plan]) => {
  const errores: string[] = [];
  if (mensualScript[clave] !== precios[plan]?.mensual) errores.push(`monthly.${clave}=${mensualScript[clave]}`);
  if (anualScript[clave] !== precios[plan]?.anual) errores.push(`annual.${clave}=${anualScript[clave]}`);
  return errores;
});
check('el interruptor Mensual/Anual cambia a los precios del backend', malScript.length === 0, malScript.join(' · '));
check(
  'el interruptor nombra el periodo',
  mensualScript.per === '/mes' && anualScript.per === '/año',
  `${mensualScript.per} · ${anualScript.per}`
);

/*
 * Ninguna otra cifra en pesos se cuela: si la página muestra un monto, es un
 * precio de plan o una de las dos tarifas de saldo.
 */
const TARIFAS_DE_SALDO = ['$2.000', '$300'];
const permitidos = new Set([...PLANES.flatMap((p) => [precios[p]?.mensual, precios[p]?.anual]), ...TARIFAS_DE_SALDO]);
const montos = [...VISIBLE.matchAll(/\$\s?\d{1,3}(?:\.\d{3})*/g)].map((m) => m[0].replace(/\s/g, ''));
const intrusos = montos.filter((m) => !permitidos.has(m));
check('no aparece ningún monto que no sea un precio o una tarifa de saldo', intrusos.length === 0, intrusos.join(', '));

/* ─── 2. LA PRUEBA: SOLO ESENCIAL, Y LOS DÍAS DE trial.rules.ts ─────────── */
const diasDePrueba = Number(PRUEBA_TS.match(/DIAS_DE_PRUEBA_GRATUITA\s*=\s*(\d+)/)?.[1]);
const planDePrueba = PRUEBA_TS.match(/PLAN_DE_PRUEBA\s*=\s*'(\w+)'/)?.[1];
check('la duración de la prueba se lee del backend', Number.isFinite(diasDePrueba), `${diasDePrueba} días`);
check('el backend sigue dando la prueba solo a Esencial', planDePrueba === 'ESENCIAL', String(planDePrueba));

const menciones = [
  ...VISIBLE.matchAll(/(?:prueba|gratis)[^.<]{0,24}?(\d+)\s*d[ií]as|(\d+)\s*d[ií]as[^.<]{0,24}?(?:prueba|gratis)/gi)
].map((m) => Number(m[1] ?? m[2]));
check(
  'los días de prueba que se anuncian son los del backend',
  menciones.length > 0 && menciones.every((d) => d === diasDePrueba),
  menciones.join(', ')
);
check('«14 días» no aparece en ninguna parte', !/\b14\s*d[ií]as\b/i.test(HTML));
check(
  'la prueba no se menciona dentro de Premium ni de Firma',
  ['PREMIUM', 'FIRMA'].every((p) => {
    const b = bloqueDe(p);
    return b && !/prueba|gratis/i.test(b.contenido);
  })
);
check(
  'el bloque de Esencial ofrece la prueba con sus días',
  Boolean(bloqueDe('ESENCIAL')?.contenido.includes('href="/prueba"')) &&
    new RegExp(`\\b${diasDePrueba}\\s*d[ií]as`).test(bloqueDe('ESENCIAL')?.contenido ?? '')
);
const enlacesDePrueba = [...CODIGO.matchAll(/<a\b[^>]*href="\/prueba"[^>]*>([\s\S]*?)<\/a>/g)];
const pruebaSuelta = enlacesDePrueba.filter((m) => !dentroDe('ESENCIAL', m.index ?? 0) && !/Esencial/.test(m[1]));
check(
  'todo enlace a la prueba está junto a Esencial o lo nombra',
  pruebaSuelta.length === 0,
  pruebaSuelta.map((m) => m[1].trim()).join(' · ')
);

/* ─── 2b. CADA PLAN DICE SOLO LO QUE AÑADE, Y NADA QUE NO TENGA ─────────── */
/*
 * El diseño de las tarjetas (handoff app-registro-y-planes) vendía en Premium
 * «Enseñar estilo y membrete», que Esencial ya trae, y en Firma «auditoría por
 * usuario», «membrete por dependencia» y «saldo compartido», que son de todos
 * los planes o no existen. Premium añade tres módulos y puestos; Firma añade
 * solo puestos. Todo lo demás en esos dos bloques sería una venta falsa.
 *
 * «gratis» se prohíbe sin excepción dentro de los bloques: la nota del periodo
 * anual («2 meses gratis») vive en la cabecera de la sección, fuera de todo
 * <article data-plan>, así que no necesita salvedad. Si algún día se mueve a
 * una tarjeta, este chequeo obliga a decidirlo aquí de forma explícita.
 */
const textoDe = (plan: string): string =>
  (bloqueDe(plan)?.contenido ?? '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const PROHIBIDO_EN_PLANES_SUPERIORES = [/Enseñar estilo/i, /membrete/i, /auditor[ií]a/i, /saldo compartido/i, /prueba/i, /gratis/i];
for (const plan of ['PREMIUM', 'FIRMA']) {
  const b = bloqueDe(plan);
  const hallados = PROHIBIDO_EN_PLANES_SUPERIORES.filter((r) => r.test(b?.contenido ?? ''));
  check(
    `el bloque de ${plan} no se atribuye lo que ya trae Esencial ni lo que no existe`,
    Boolean(b) && hallados.length === 0,
    hallados.map((r) => r.source).join(', ')
  );
}

const MODULOS = [
  'Redacción',
  'Borradores',
  'Revisiones',
  'Orientación',
  'Expediente',
  'Audiencias',
  'Entrevistas',
  'Buscador',
  'Catálogo',
  'Herramientas',
  'Manual',
  'Soporte'
];
const textoFirma = textoDe('FIRMA');
check('el bloque de Firma dice que tiene los mismos módulos de Premium', /mismos módulos de Premium/i.test(textoFirma));
const modulosEnFirma = MODULOS.filter((m) => new RegExp(`\\b${m}\\b`, 'iu').test(textoFirma));
check('el bloque de Firma no enumera ningún módulo como añadido', modulosEnFirma.length === 0, modulosEnFirma.join(', '));

check('«saldo de cortesía» no aparece en ninguna parte', !/saldo\s+de\s+cortes[ií]a/i.test(HTML));
check('«siete días antes» no aparece en ninguna parte', !/siete\s+d[ií]as\s+antes/i.test(HTML));

/* ─── 3. LOS ENLACES QUE LA APLICACIÓN SABE ATENDER ─────────────────────── */
/*
 * Desde el 14 de septiembre de 2026 la portada enlaza DIRECCIONES LIMPIAS
 * (`/entrar`, `/registro/premium`, `/manual`). Cada enlace interno tiene que ser
 * una dirección que `leerRuta` reconoce —página pública o pantalla de la
 * aplicación—, sin consulta: una desconocida lleva a Inicio o de vuelta aquí,
 * no a donde dice el botón. `/manual` y `/privacidad` son pantallas de la
 * aplicación: sin sesión pasan por Entrar y aterrizan en ellas. Y cada
 * `/registro/<plan>` va dentro del bloque de ese plan.
 */
const REQUERIDOS = [
  '/entrar',
  '/prueba',
  '/registro/esencial',
  '/registro/premium',
  '/registro/firma',
  '/manual',
  '/privacidad',
  'https://wa.me/573011750316'
];
const hrefs = [...CODIGO.matchAll(/\bhref="([^"]*)"/g)].map((m) => ({ href: m[1].replace(/&amp;/g, '&'), i: m.index ?? 0 }));
const faltan = REQUERIDOS.filter((r) => !hrefs.some((h) => h.href === r));
check('están todos los enlaces que la portada debe ofrecer', faltan.length === 0, faltan.join(', '));

const malos: string[] = [];
/* Los archivos (`/brand/favicon.svg`, `/manifest.webmanifest`) llevan extensión y no son pantallas. */
for (const { href, i } of hrefs.filter((h) => h.href.startsWith('/') && !h.href.split(/[?#]/)[0].includes('.'))) {
  const url = new URL(href, 'https://www.iureoncolombia.com');
  if (url.search) malos.push(`${href} (lleva consulta)`);
  if (url.pathname === '/') continue;
  const ruta = leerRuta(url.pathname);
  if (ruta.tipo !== 'publica' && ruta.tipo !== 'app') malos.push(`${href} (dirección desconocida)`);
  if (ruta.tipo === 'publica' && ruta.pagina === 'registro') {
    const plan = ruta.plan ?? 'ESENCIAL';
    if (!PLANES.includes(plan as PlanId) || url.pathname !== `/registro/${plan.toLowerCase()}`) malos.push(`${href} (plan)`);
    else if (!dentroDe(plan, i)) malos.push(`${href} fuera del bloque de ${plan}`);
  }
}
check('todo enlace interno es una dirección que la aplicación atiende', malos.length === 0, malos.join(' · '));

const internos = new Set([...CODIGO.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const anclasRotas = hrefs.filter((h) => h.href.startsWith('#') && !internos.has(h.href.slice(1))).map((h) => h.href);
check('toda ancla #… apunta a un id que existe', anclasRotas.length === 0, anclasRotas.join(', '));

/* La portada vive en la raíz desde el 14 sep 2026; su dirección vieja redirige a ella (vercel.json). */
const DOMINIO = 'https://www.iureoncolombia.com/';
check(
  'canonical y og:url apuntan al dominio real',
  CODIGO.includes(`<link rel="canonical" href="${DOMINIO}">`) && CODIGO.includes(`<meta property="og:url" content="${DOMINIO}">`)
);
check('no queda ninguna referencia a vercel.app', !/vercel\.app/i.test(CODIGO));

/* Sin rastreadores: lo único externo son las fuentes y el enlace de WhatsApp. */
const HOSTS = new Set(['api.fontshare.com', 'fonts.googleapis.com', 'fonts.gstatic.com', 'wa.me', 'www.iureoncolombia.com']);
const externos = [...CODIGO.matchAll(/(?:href|src|content)="(https?:\/\/[^"]+)"/g)].map((m) => new URL(m[1]).host);
const hostsAjenos = [...new Set(externos.filter((h) => !HOSTS.has(h)))];
check('ningún recurso externo fuera de las fuentes y WhatsApp', hostsAjenos.length === 0, hostsAjenos.join(', '));
check('ningún script externo', !/<script\b[^>]*\bsrc=/i.test(CODIGO));
check('ningún diálogo nativo del navegador', !/\b(?:alert|confirm|prompt)\s*\(/.test(SCRIPT));

/* ─── 4. LO QUE LA PORTADA NO PUEDE DECIR ──────────────────────────────── */
check('no dice que la plataforma «entrena»', !/\bentren(?:a|an|amos|ar|ado|ada|amiento)\b/i.test(VISIBLE));
/* «Aprender» es el nombre del grupo de módulos; lo prohibido es «aprende». */
check('no dice que la plataforma «aprende»', !/\baprend(?:e|en|emos|iendo|ido|izaje)\b/i.test(VISIBLE));
check('sin logotipos de proveedores de IA', !/<img\b[^>]*(?:openai|anthropic|google|gemini|claude)/i.test(CODIGO));
check('sin testimonios', !/testimoni/i.test(CODIGO));
check('sin porcentajes de precisión o velocidad', !/\d\s?%/.test(VISIBLE));

/* El catálogo: la cifra que se publica es la que el backend tiene. */
const archivosDelCatalogo = readdirSync(DATOS_CATALOGO).filter((f) => f.endsWith('.ts') && f !== 'index.ts');
const actuaciones = archivosDelCatalogo.reduce(
  (n, f) => n + (readFileSync(join(DATOS_CATALOGO, f), 'utf8').match(/\bexactName:/g)?.length ?? 0),
  0
);
const cifrasActuaciones = [...VISIBLE.matchAll(/(\d+)\s+actuaciones/gi)].map((m) => Number(m[1]));
const cifrasRamas = [...VISIBLE.matchAll(/(\d+)\s+ramas/gi)].map((m) => Number(m[1]));
check(
  'las actuaciones anunciadas son las del catálogo',
  cifrasActuaciones.every((n) => n === actuaciones),
  `catálogo ${actuaciones} · portada ${cifrasActuaciones.join(', ') || 'sin cifra'}`
);
check(
  'las ramas anunciadas son las del catálogo',
  cifrasRamas.every((n) => n === archivosDelCatalogo.length),
  `catálogo ${archivosDelCatalogo.length} · portada ${cifrasRamas.join(', ') || 'sin cifra'}`
);

/* ─── 5. LAS FUENTES: SATOSHI, SOURCE SERIF 4 E IBM PLEX MONO ──────────── */
const hojas = [...CODIGO.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>/g)].map((m) => m[0].match(/href="([^"]+)"/)?.[1] ?? '');
const familiasCargadas = hojas.flatMap((h) => {
  const url = new URL(h.replace(/&amp;/g, '&'));
  if (url.host === 'api.fontshare.com') return url.searchParams.getAll('f[]').map((f) => f.split('@')[0].toLowerCase());
  if (url.host === 'fonts.googleapis.com') return url.searchParams.getAll('family').map((f) => f.split(':')[0].toLowerCase());
  return [`hoja ajena: ${url.host}`];
});
const ESPERADAS = ['satoshi', 'source serif 4', 'ibm plex mono'];
check(
  'solo se cargan Satoshi, Source Serif 4 e IBM Plex Mono',
  familiasCargadas.length === ESPERADAS.length && ESPERADAS.every((f) => familiasCargadas.includes(f)),
  familiasCargadas.join(', ')
);
check('ningún @import ni @font-face propio', !/@import|@font-face/i.test(CODIGO));
check('Plus Jakarta Sans no aparece', !/plus[\s+_-]*jakarta/i.test(HTML));
const PILAS = new Set(['Satoshi', 'Source Serif 4', 'IBM Plex Mono', 'Segoe UI']);
const nombradas = [...CODIGO.matchAll(/(?:font-family|--sans|--mono|--serif)\s*:\s*([^;}"]+)/g)].flatMap((m) =>
  [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1])
);
const ajenas = [...new Set(nombradas.filter((n) => !PILAS.has(n)))];
check('las pilas tipográficas no nombran otra familia', ajenas.length === 0, ajenas.join(', '));

/* ─── 6. ESTRUCTURA: ids únicos y un solo título principal por diseño ──── */
const ids = [...CODIGO.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const repetidos = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
check('ningún id repetido', repetidos.length === 0, repetidos.join(', '));
const h1 = CODIGO.match(/<h1\b/gi)?.length ?? 0;
check('entre uno y dos <h1> (uno por diseño)', h1 >= 1 && h1 <= 2, `${h1}`);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
