/**
 * Guards the facts the two public doors print: «Entrar» and «Registre su firma».
 *
 * Run with: npm run check:cifras-entrada
 *
 * EL DEFECTO QUE VIGILA. Esas dos pantallas las lee alguien que todavía no es
 * cliente, y todo lo que afirman es una COPIA escrita a mano en el frontend:
 * cuántas actuaciones verificadas tiene el catálogo, en cuántas ramas, qué
 * registros se consultan en vivo, cuánto vale cada plan y para cuántos usuarios,
 * cuánto dura la prueba. Ninguna de esas copias lanza error al envejecer, y ya
 * envejecieron: la entrada dijo 651 y 2 cuando eran 858 y 4, y luego 879 cuando
 * eran 881. La maqueta nueva, además, traía «14 días del plan Premium y $14.000
 * de saldo de cortesía» —la prueba es de Esencial, dura
 * DIAS_DE_PRUEBA_GRATUITA y abre con saldo cero— y la pantalla vieja prometía
 * «solo lectura» al terminar la prueba, cuando desde e9d23a2 se pierde todo el
 * acceso.
 *
 * Aquí se cuenta la fuente de verdad (el catálogo compilado, `PLANES`,
 * `trial.rules.ts`) y se compara con las pantallas leídas como TEXTO, sin
 * comentarios: el comentario que explica por qué no se dice «14 días» contiene
 * esas palabras.
 *
 * Solo lee archivos y funciones puras: no toca base ni red.
 */
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { catalogService } from '../catalog.service';
import { PLANES, type Plan } from '../../subscriptions/plan.catalog';
import { DIAS_DE_PRUEBA_GRATUITA } from '../../trial/trial.rules';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

const RAIZ = join(__dirname, '..', '..', '..', '..', '..');
const TENANT = join(RAIZ, 'frontend', 'src', 'modules', 'tenant', 'components');
const JURISPRUDENCIA = join(RAIZ, 'backend', 'src', 'modules', 'jurisprudence');

const sinComentarios = (texto: string): string =>
  texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\s*\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const leer = (ruta: string): string => (existsSync(ruta) ? sinComentarios(readFileSync(ruta, 'utf8')) : '');

const ENTRAR = leer(join(TENANT, 'LoginPortalView.tsx'));
const REGISTRO = leer(join(TENANT, 'RegistroView.tsx'));
check('las dos pantallas se pueden leer', ENTRAR.length > 0 && REGISTRO.length > 0);

/* ─── EL CATÁLOGO ─────────────────────────────────────────────────────────── */

const fichas = catalogService.list();
const verificadas = fichas.filter((a) => a.term.status !== 'NO_VERIFICADO').length;
const ramas = catalogService.listBranches().length;

const numeroDe = (texto: string, clave: string): number =>
  Number(texto.match(new RegExp(`${clave}\\s*:\\s*([\\d_]+)`))?.[1]?.replace(/_/g, '') ?? NaN);

const verificadasEnPantalla = numeroDe(ENTRAR, 'actuacionesVerificadas');
const ramasEnPantalla = numeroDe(ENTRAR, 'ramas');

check(
  'Entrar: las actuaciones verificadas son las del catálogo',
  verificadasEnPantalla === verificadas,
  `pantalla ${verificadasEnPantalla} · catálogo ${verificadas} de ${fichas.length} (término distinto de NO_VERIFICADO)`
);
check('Entrar: las ramas son las del catálogo', ramasEnPantalla === ramas, `pantalla ${ramasEnPantalla} · catálogo ${ramas}`);
check(
  'Entrar: las cifras del catálogo se pintan desde la constante',
  ENTRAR.includes('{CATALOGO.actuacionesVerificadas') && ENTRAR.includes('{CATALOGO.ramas}')
);

/* Ninguna otra cifra del catálogo escrita a mano, en ninguna de las dos. */
for (const [nombre, texto] of [
  ['Entrar', ENTRAR],
  ['Registro', REGISTRO]
] as const) {
  const sueltas = texto.match(/\b\d[\d.]*\s+(actuaciones|ramas|registros|fichas)\b/gi) ?? [];
  check(`${nombre}: no escribe cifras del catálogo a mano`, sueltas.length === 0, sueltas.join(' · '));
}

/* ─── LOS REGISTROS EN VIVO ───────────────────────────────────────────────── */

const bloqueRegistros = ENTRAR.match(/REGISTROS_EN_VIVO\s*=\s*\[([\s\S]*?)\]/)?.[1] ?? '';
const registros = [...bloqueRegistros.matchAll(/'([^']+)'/g)].map((m) => m[1]);

/* Cada registro que la pantalla nombra, con el servicio que lo consulta y el dominio oficial que ese servicio llama. */
const SERVICIOS: Record<string, { archivos: string[]; dominio: string }> = {
  'Corte Constitucional': {
    archivos: ['officialRuling.service.ts', 'discovery.service.ts'],
    dominio: 'corteconstitucional.gov.co'
  },
  'Corte Suprema': { archivos: ['csjRuling.service.ts'], dominio: 'cortesuprema.gov.co' },
  'Consejo de Estado': { archivos: ['consejoEstadoRuling.service.ts'], dominio: 'consejodeestado.gov.co' },
  'Comisión Nacional de Disciplina Judicial': { archivos: ['cndjRuling.service.ts'], dominio: 'cndj.gov.co' }
};

if (registros.length > 0) {
  check(
    'Entrar: la cantidad de registros se deriva de la lista',
    ENTRAR.includes('{REGISTROS_EN_VIVO.length}') && !/\b\d+\s*<\/dt>/.test(ENTRAR)
  );
  for (const registro of registros) {
    const servicio = SERVICIOS[registro];
    const codigo = servicio
      ? servicio.archivos
          .map((a) => join(JURISPRUDENCIA, a))
          .filter(existsSync)
          .map((r) => readFileSync(r, 'utf8'))
          .join('\n')
      : '';
    check(
      `Entrar: «${registro}» se consulta en vivo`,
      Boolean(servicio) && codigo.includes(servicio.dominio),
      servicio ? `${servicio.archivos.join(' o ')} → ${servicio.dominio}` : 'ningún servicio conocido lo respalda'
    );
  }
} else {
  check('Entrar: sin lista de registros, no afirma registros en vivo', !/en vivo/i.test(ENTRAR));
}

/* ─── LOS PLANES ──────────────────────────────────────────────────────────── */

const NUMEROS: Record<string, number> = {
  un: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, veinte: 20, veinticinco: 25, treinta: 30
};
const aNumero = (palabra: string): number => NUMEROS[palabra.toLowerCase()] ?? Number(palabra);

for (const plan of Object.keys(PLANES) as Plan[]) {
  const bloque = REGISTRO.match(new RegExp(`\\b${plan}:\\s*\\{([\\s\\S]*?)\\n  \\}`))?.[1] ?? '';
  const def = PLANES[plan];
  check(`Registro: FICHAS trae ${plan}`, bloque.length > 0);
  if (!bloque) continue;

  const mensual = numeroDe(bloque, 'precioMensual');
  const anual = numeroDe(bloque, 'precioAnual');
  check(`Registro: precio mensual de ${plan}`, mensual === def.precioMensualCop, `pantalla ${mensual} · catálogo ${def.precioMensualCop}`);
  check(`Registro: precio anual de ${plan}`, anual === def.precioAnualCop, `pantalla ${anual} · catálogo ${def.precioAnualCop}`);

  const usuarios = bloque.match(/usuarios:\s*'(?:Hasta\s+)?(\S+)\s+usuarios?'/i)?.[1] ?? '';
  check(
    `Registro: usuarios de ${plan}`,
    aNumero(usuarios) === def.maxUsuarios,
    `pantalla «${usuarios}» · catálogo ${def.maxUsuarios}`
  );
}

/* La ficha de Firma compara con Premium en cuentas: las dos cifras tienen que seguir siendo ciertas. */
const comparacion = REGISTRO.match(/([A-Za-z0-9ñ]+)\s+cuentas para la oficina que superó las\s+([A-Za-z0-9ñ]+)\s+de Premium/i);
if (comparacion) {
  check(
    'Registro: «N cuentas … las M de Premium» cuadra con el catálogo',
    aNumero(comparacion[1]) === PLANES.FIRMA.maxUsuarios && aNumero(comparacion[2]) === PLANES.PREMIUM.maxUsuarios,
    comparacion[0]
  );
}
if (/doce meses por el precio de diez/.test(REGISTRO)) {
  check(
    'Registro: «el anual son doce meses por el precio de diez» es cierto en todos los planes',
    (Object.values(PLANES) as { precioMensualCop: number; precioAnualCop: number }[]).every(
      (p) => p.precioAnualCop === p.precioMensualCop * 10
    )
  );
}

/* ─── LA PRUEBA GRATUITA ──────────────────────────────────────────────────── */

const pruebaDelFrontend = Number(
  readFileSync(join(RAIZ, 'frontend', 'src', 'modules', 'subscriptions', 'pruebaTerminada.ts'), 'utf8').match(
    /DIAS_DE_PRUEBA_GRATUITA\s*=\s*(\d+)/
  )?.[1]
);
check(
  'la constante de días que importan las pantallas es la de trial.rules.ts',
  pruebaDelFrontend === DIAS_DE_PRUEBA_GRATUITA,
  `frontend ${pruebaDelFrontend} · backend ${DIAS_DE_PRUEBA_GRATUITA}`
);

const PROHIBIDAS: Array<[RegExp, string]> = [
  [/\b(?:\d+|siete|catorce)\s+d[ií]as\b/i, 'un plazo de prueba escrito a mano en vez de DIAS_DE_PRUEBA_GRATUITA'],
  [/14\s*d[ií]as/i, '«14 días»: la prueba no dura eso'],
  [/15\s*minutos/i, '«15 minutos»: la ventana del límite de intentos es de Supabase y no se conoce'],
  [/saldo de cortes[ií]a/i, '«saldo de cortesía»: la prueba abre con saldo cero'],
  [/solo lectura/i, '«solo lectura»: la prueba terminada pierde todo el acceso'],
  [/inici(?:ar|e) sesi[óo]n/i, '«Iniciar sesión»: la copia dice «Entrar»'],
  [/Premium[^.]{0,40}prueba|prueba[^.]{0,40}Premium/i, 'una prueba de Premium, que no existe']
];

for (const [nombre, texto] of [
  ['Entrar', ENTRAR],
  ['Registro', REGISTRO]
] as const) {
  check(
    `${nombre}: los días de la prueba se pintan desde DIAS_DE_PRUEBA_GRATUITA`,
    /import \{[^}]*DIAS_DE_PRUEBA_GRATUITA[^}]*\} from '\.\.\/\.\.\/subscriptions\/pruebaTerminada'/.test(texto) &&
      /\{DIAS_DE_PRUEBA_GRATUITA\}|\$\{DIAS_DE_PRUEBA_GRATUITA\}/.test(texto)
  );
  for (const [patron, motivo] of PROHIBIDAS) {
    const hallado = texto.match(patron)?.[0];
    check(`${nombre}: no dice ${motivo}`, !hallado, hallado ? `encontrado «${hallado}»` : '');
  }
}

/*
 * «¿OLVIDÓ SU CONTRASEÑA?» SOLO SI LA RECUPERACIÓN EXISTE EN EL SERVIDOR.
 *
 * Esta guarda nació prohibiendo el enlace, porque la maqueta lo traía y el
 * flujo no existía. El 14 de septiembre de 2026 existe (`auth/recuperacion.*`),
 * así que la regla se da vuelta sin perder su propósito: la pantalla puede
 * ofrecer el enlace mientras el servidor tenga la ruta pública que lo atiende.
 * Si alguien retira la ruta, el enlace vuelve a ser una promesa falsa y esto
 * falla.
 */
const RUTAS_AUTH = readFileSync(join(RAIZ, 'backend', 'src', 'modules', 'auth', 'auth.routes.ts'), 'utf8');
const ofreceRecuperar = /olvid[óo] su contrase[ñn]a|\?[^'"]*recuperar/i.test(ENTRAR);
check(
  'Entrar: «¿Olvidó su contraseña?» solo lleva a una recuperación que el servidor atiende',
  !ofreceRecuperar ||
    (ENTRAR.includes('href="/recuperar"') &&
      RUTAS_AUTH.includes("publicRouter.post('/auth/recuperar'") &&
      RUTAS_AUTH.includes("publicRouter.post('/auth/restablecer'")),
  ofreceRecuperar ? 'Entrar ofrece el enlace' : 'Entrar no lo ofrece'
);
check(
  'Registro: no ofrece recuperar una contraseña que todavía no existe',
  !/olvid[óo] su contrase[ñn]a|\?[^'"]*recuperar/i.test(REGISTRO)
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exit(fallos === 0 ? 0 : 1);
