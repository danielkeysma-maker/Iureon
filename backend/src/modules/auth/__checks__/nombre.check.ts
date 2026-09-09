/**
 * Guards the pure rules of a person's name.
 *
 * Run with: npm run check:nombre
 *
 * No database, no network. The name is what the sidebar, the greeting on
 * Inicio and the firm's user list will print from now on, so what may be
 * stored — and what must be refused with a message the lawyer can read — is
 * proven here against fixed inputs.
 */
import { AuthError } from '../auth.service';
import { NOMBRE_MAXIMO, NOMBRE_MINIMO, validarNombre, validarNombreOpcional } from '../nombre.rules';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/** The code and status of the AuthError a call throws, or 'OK' when it does not throw. */
const codigoDe = (fn: () => unknown): string => {
  try {
    fn();
    return 'OK';
  } catch (err) {
    return err instanceof AuthError ? `${err.code}:${err.status}` : `OTRO:${String(err)}`;
  }
};

const mensajeDe = (fn: () => unknown): string => {
  try {
    fn();
    return '';
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
};

// ─── Lo que sí es un nombre ─────────────────────────────────────────────────
check('un nombre corriente pasa tal cual', validarNombre('Daniel Martínez') === 'Daniel Martínez');
check('dos letras es el mínimo y pasa', validarNombre('Al') === 'Al');
check('acentos y eñes se conservan', validarNombre('Iñaki Muñoz Peña') === 'Iñaki Muñoz Peña');
check('apóstrofos y guiones de apellido se conservan', validarNombre("Ana D'Ávila-Ríos") === "Ana D'Ávila-Ríos");
check(
  'exactamente el máximo pasa',
  validarNombre('a'.repeat(NOMBRE_MAXIMO)).length === NOMBRE_MAXIMO
);

// ─── Recorte de espacios ────────────────────────────────────────────────────
check('los espacios de los extremos se recortan', validarNombre('   Ana María   ') === 'Ana María');
check('los espacios repetidos de en medio se colapsan', validarNombre('Ana    María') === 'Ana María');
check(
  'un nombre pegado con salto de línea al final se recorta, no se rechaza',
  validarNombre('Ana María\n') === 'Ana María'
);
check(
  'un tabulador entre nombres cuenta como un espacio',
  validarNombre('Ana\tMaría') === 'Ana María'
);
check(
  'la longitud se mide DESPUÉS del recorte, no antes',
  validarNombre(' '.repeat(200) + 'Ana' + ' '.repeat(200)) === 'Ana'
);

// ─── Lo que se rechaza ──────────────────────────────────────────────────────
check('el vacío se rechaza', codigoDe(() => validarNombre('')) === 'NOMBRE_REQUERIDO:400');
check(
  'solo espacios es vacío, no un nombre de seis caracteres',
  codigoDe(() => validarNombre('      ')) === 'NOMBRE_REQUERIDO:400'
);
check(
  'el mensaje de vacío dice qué hacer',
  mensajeDe(() => validarNombre('')).includes('Escriba su nombre')
);
check(
  'una sola letra se rechaza por corto',
  codigoDe(() => validarNombre('A')) === 'NOMBRE_MUY_CORTO:400'
);
check(
  'el mensaje de corto dice el mínimo',
  mensajeDe(() => validarNombre('A')).includes(String(NOMBRE_MINIMO))
);
check(
  'un carácter más del máximo se rechaza',
  codigoDe(() => validarNombre('a'.repeat(NOMBRE_MAXIMO + 1))) === 'NOMBRE_MUY_LARGO:400'
);
check(
  'el mensaje de largo dice el máximo',
  mensajeDe(() => validarNombre('a'.repeat(NOMBRE_MAXIMO + 1))).includes(String(NOMBRE_MAXIMO))
);
check(
  'lo que no es texto se trata como vacío, nunca se convierte a «undefined»',
  codigoDe(() => validarNombre(undefined)) === 'NOMBRE_REQUERIDO:400' &&
    codigoDe(() => validarNombre(42)) === 'NOMBRE_REQUERIDO:400' &&
    codigoDe(() => validarNombre({ nombre: 'Ana' })) === 'NOMBRE_REQUERIDO:400'
);
check(
  'un carácter de control de verdad se rechaza',
  codigoDe(() => validarNombre('Ana' + String.fromCharCode(0) + 'María')) === 'NOMBRE_INVALIDO:400'
);

// ─── El nombre opcional del alta de un colega ───────────────────────────────
check('ausente es «sin nombre», no un error', validarNombreOpcional(undefined) === undefined);
check('null es «sin nombre»', validarNombreOpcional(null) === undefined);
check('la cadena vacía es «sin nombre»', validarNombreOpcional('') === undefined);
check('solo espacios es «sin nombre»', validarNombreOpcional('   ') === undefined);
check('un nombre presente sí se valida y se recorta', validarNombreOpcional('  Ana  ') === 'Ana');
check(
  'un nombre presente pero inválido se rechaza: opcional no es «sin reglas»',
  codigoDe(() => validarNombreOpcional('A')) === 'NOMBRE_MUY_CORTO:400'
);

console.log(fallos === 0 ? '\nTodo en orden.' : `\n${fallos} fallo(s).`);
process.exitCode = fallos === 0 ? 0 : 1;
