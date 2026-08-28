import { ALL_CATALOGS } from '../data';
import { relojesSospechosos, relojSospechoso } from '../clockOwner';
import type { Actuacion } from '../types';

/**
 * `npm run check:relojes` — ¿alguna ficha abre con el reloj de otro?
 *
 * NO FALLA LA COMPILACIÓN POR HALLAR ALGO. Este check no afirma que la ficha
 * esté mal: afirma que su primer plazo pertenece a una oración cuyo sujeto es
 * la autoridad y que la ficha no dice de quién es el reloj. Eso es una lista de
 * lectura para un abogado, no un defecto demostrado, y un semáforo en rojo
 * sobre una sospecha se aprende a ignorar. Lo que SÍ falla son las regresiones
 * de las guardas de abajo, que fijan qué debe detectar y qué debe callar.
 */

const casos: Array<[string, Actuacion, boolean]> = [];

const ficha = (exactName: string, description: string | null, status: Actuacion['term']['status'] = 'VERIFICADO'): Actuacion =>
  ({
    id: 'x',
    exactName,
    branch: 'CIVIL',
    role: 'LITIGANTE',
    legalBasis: 'x',
    competentAuthority: 'x',
    term: { status, description },
    requiredSections: [],
    sourceUrl: 'https://example.org'
  }) as unknown as Actuacion;

/* ─── LO QUE DEBE DETECTAR ─────────────────────────────────────────────── */

casos.push([
  'detecta el plazo del juez para fallar',
  ficha(
    'Acción de tutela',
    'Dentro de los diez (10) días siguientes a la presentación de la solicitud el juez proferirá el fallo.'
  ),
  true
]);

casos.push([
  'detecta el plazo de la entidad para resolver',
  ficha(
    'Recurso de reconsideración',
    'La entidad deberá resolver el recurso dentro de los dos (2) meses siguientes a su interposición.'
  ),
  true
]);

/* ─── LO QUE DEBE CALLAR ───────────────────────────────────────────────── */

casos.push([
  'calla cuando la ficha declara de quién es el reloj',
  ficha(
    'Devolución de saldo a favor',
    'EL RELOJ DEL CLIENTE ES DE DOS (2) AÑOS (E.T. art. 854). La DIAN tendrá cincuenta (50) días para devolver, pero ese plazo no es el que extingue el derecho.'
  ),
  false
]);

casos.push([
  'calla cuando el plazo es del cliente, sin sujeto de autoridad cerca',
  ficha(
    'Recurso de apelación',
    'Deberá interponerse por escrito dentro de los diez (10) días siguientes a la notificación personal.'
  ),
  false
]);

casos.push([
  'calla sobre una ficha sin término verificado',
  ficha(
    'Actuación cualquiera',
    'La autoridad deberá resolver en diez (10) días.',
    'NO_VERIFICADO'
  ),
  false
]);

casos.push(['calla cuando no hay descripción', ficha('Sin término', null, 'NO_CADUCA'), false]);

casos.push([
  'calla cuando la descripción no trae ningún plazo',
  ficha('Otra', 'El juez resolverá lo que en derecho corresponda, sin plazo fijado en la norma.'),
  false
]);

let fallos = 0;

for (const [nombre, entrada, esperado] of casos) {
  const hallado = relojSospechoso(entrada) !== null;
  if (hallado === esperado) {
    console.log(`ok   ${nombre}`);
  } else {
    console.log(`FALLA ${nombre} — esperaba ${esperado ? 'aviso' : 'silencio'}`);
    fallos += 1;
  }
}

/* ─── EL BARRIDO SOBRE EL CATÁLOGO REAL: informativo ───────────────────── */

const todas = ALL_CATALOGS.flatMap((c) => c.actuaciones);
const sospechosas = relojesSospechosos(todas);

console.log('');
console.log(`Catálogo: ${todas.length} fichas · ${sospechosas.length} con el reloj por revisar`);

for (const s of sospechosas) {
  console.log('');
  console.log(`  [${s.branch}] ${s.exactName}`);
  console.log(`     marcador: «${s.marcador}»`);
  console.log(`     ${s.fragmento.slice(0, 190)}`);
}

console.log('');
if (fallos > 0) {
  console.log(`${fallos} guarda(s) rota(s).`);
  process.exitCode = 1;
} else {
  console.log(
    sospechosas.length === 0
      ? 'Ninguna ficha abre con el reloj de otro sin declararlo.'
      : 'La lista de arriba es para leer con la norma al lado, no un defecto probado.'
  );
  /*
   * La frase que el corredor de checks exige de todo el que sale con cero. Va
   * al final y solo cuando las GUARDAS pasan: lo que este check afirma es que
   * el detector sigue detectando y sigue callando donde debe, no que el
   * catálogo esté limpio — de eso habla la lista de arriba, que es trabajo
   * para un abogado y no un semáforo.
   */
  console.log('ALL CHECKS PASSED');
}
