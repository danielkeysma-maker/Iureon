/**
 * Guards that the checks which write to the database always clean up after
 * themselves, and can tell when they did not.
 *
 * Run with: npm run check:limpieza-checks
 *
 * No database, no network: it reads the six checks as text.
 *
 * ─── EL DEFECTO QUE VIGILA ──────────────────────────────────────────────────
 *
 * Los seis checks que escriben en la base (`admin`, `auth`, `billing`,
 * `clients`, `stored`, `names`) crean firmas, cuentas y filas, y en local el
 * entorno apunta a la base de PRODUCCION. Su limpieza tenia tres defectos, los
 * tres confirmados:
 *
 * 1. Corria al final del cuerpo, SIN `finally`: cualquier excepcion a mitad del
 *    check la saltaba y dejaba los datos de prueba en la base.
 * 2. Llamaba `listUsers()` sin paginar, que devuelve solo los primeros 50
 *    usuarios: con una base mas grande, las cuentas de prueba de la pagina dos
 *    no se borraban nunca.
 * 3. Ignoraba el resultado de `deleteUser`. Asi quedo en produccion
 *    `fb1789069190749@iureon.test`, de `check:billing`, sin que nada lo dijera.
 *
 * Los tres se corrigieron en un solo helper, `borrarUsuariosDePrueba`, y en un
 * `finally` por check. Este guardia existe para que el siguiente check que se
 * escriba copiando uno viejo, o la siguiente edicion apurada, no los reabra.
 */
import fs from 'fs';
import path from 'path';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const modulos = path.resolve(__dirname, '../..');
const leer = (relativo: string): string => fs.readFileSync(path.join(modulos, relativo), 'utf8');

const CHECKS_CON_BASE: Array<{ nombre: string; archivo: string; creaCuentas: boolean; limpieza: RegExp }> = [
  { nombre: 'admin', archivo: 'admin/__checks__/admin.check.ts', creaCuentas: true, limpieza: /borrarUsuariosDePrueba\(/ },
  { nombre: 'auth', archivo: 'auth/__checks__/auth.check.ts', creaCuentas: true, limpieza: /borrarUsuariosDePrueba\(/ },
  { nombre: 'billing', archivo: 'billing/__checks__/billing.check.ts', creaCuentas: true, limpieza: /borrarUsuariosDePrueba\(/ },
  { nombre: 'clients', archivo: 'clients/__checks__/clients.check.ts', creaCuentas: true, limpieza: /borrarUsuariosDePrueba\(/ },
  { nombre: 'stored', archivo: 'transcription/__checks__/storedList.check.ts', creaCuentas: true, limpieza: /borrarUsuariosDePrueba\(/ },
  {
    nombre: 'names',
    archivo: 'transcription/__checks__/speakerNames.check.ts',
    creaCuentas: false,
    limpieza: /from\('transcriptions'\)\.delete\(\)\.eq\('firm_id', FIRM\)/
  }
];

/*
 * Que la limpieza este DESPUES de un `finally {` no basta: tiene que estar
 * dentro de ese bloque. Se toma el texto que va del ultimo `finally {` a su
 * llave de cierre, contando llaves, y la limpieza tiene que caer ahi.
 */
const bloqueFinally = (texto: string): string | null => {
  const inicio = texto.lastIndexOf('finally {');
  if (inicio < 0) return null;
  let profundidad = 0;
  for (let i = inicio + 'finally '.length; i < texto.length; i++) {
    if (texto[i] === '{') profundidad++;
    else if (texto[i] === '}') {
      profundidad--;
      if (profundidad === 0) return texto.slice(inicio, i + 1);
    }
  }
  return null;
};

for (const { nombre, archivo, creaCuentas, limpieza } of CHECKS_CON_BASE) {
  const texto = leer(archivo);
  const bloque = bloqueFinally(texto);

  check(`${nombre}: tiene un bloque finally`, bloque !== null);
  check(
    `${nombre}: la limpieza vive DENTRO del finally`,
    bloque !== null && limpieza.test(bloque),
    'si esta fuera, una excepcion la salta y deja datos en la base'
  );

  const fueraDelFinally = bloque === null ? texto : texto.replace(bloque, '');
  check(
    `${nombre}: no hay limpieza fuera del finally`,
    !limpieza.test(fueraDelFinally) && !/\.delete\(\)/.test(fueraDelFinally),
    'un borrado de filas fuera del finally es la forma vieja'
  );

  check(
    `${nombre}: no llama listUsers() sin paginar`,
    !/listUsers\(\s*\)/.test(texto),
    'listUsers() devuelve solo 50 usuarios'
  );
  check(
    `${nombre}: no llama deleteUser directamente`,
    !/deleteUser\(/.test(texto),
    'debe usar borrarUsuariosDePrueba, que revisa el error'
  );
  if (creaCuentas) {
    check(
      `${nombre}: una falla de limpieza hace fallar el check`,
      bloque !== null && /fallos \+= informarLimpieza\(/.test(bloque)
    );
  } else {
    check(
      `${nombre}: una falla de limpieza hace fallar el check`,
      bloque !== null && /if \(error\)/.test(bloque) && /fallos \+=/.test(bloque)
    );
  }
  check(
    `${nombre}: el veredicto se imprime despues del finally`,
    bloque !== null && texto.indexOf('process.exit(fallos') > texto.indexOf(bloque)
  );
}

/* ─── El helper ─────────────────────────────────────────────────────────── */

const helper = leer('auth/__checks__/helpers.ts');
/*
 * LA PAGINACION YA NO VIVE AQUI, Y ESO NO AFLOJA LA GUARDA: LA MUDA.
 *
 * Estas tres comprobaciones buscaban el bucle de paginas dentro de este
 * helper. Cuando el mismo defecto aparecio en siete sitios de produccion, la
 * paginacion subio a `modules/auth/listarCuentas.ts`, y alli se prueba POR
 * COMPORTAMIENTO en `check:listar-cuentas` —2.345 cuentas en tres paginas, una
 * pagina que falla, un cliente que lanza—, que es mas fuerte que buscar texto.
 *
 * Lo que queda por vigilar AQUI es que este helper no vuelva a tener su propio
 * bucle: dos copias se separan, y la que se quedaria atras es la que borra
 * cuentas en la base del usuario.
 */
check(
  'helper: lista cuentas con el helper de produccion, no con su propio bucle',
  /listarTodasLasCuentas\(/.test(helper) && !/listUsers\(/.test(helper),
  'la paginacion se prueba en check:listar-cuentas'
);
check(
  'helper: una falla al listar se sigue anotando, no se toma por lista vacia',
  /if \(falla\) fallas\.push\(falla\)/.test(helper)
);
check(
  'helper: lee el error de cada deleteUser',
  /const \{ error \} = await c\.auth\.admin\.deleteUser\(/.test(helper) && /if \(error\) fallas\.push\(/.test(helper)
);
check(
  'helper: solo borra correos @iureon.test que llevan la marca',
  /endsWith\('@iureon\.test'\) && correo\.includes\(texto\)/.test(helper)
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exit(fallos === 0 ? 0 : 1);
