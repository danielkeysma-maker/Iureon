/**
 * Guards the document type that Orientación hands to the workspace.
 *
 * Run with: npm run check:tipo
 *
 * EL DEFECTO QUE REPORTÓ EL USUARIO, TAL CUAL: escribía unos hechos en
 * Orientación, le daba a "Redactar", llegaba al taller con la sugerencia... y el
 * tipo de actuación no quedaba escogido.
 *
 * La causa no estaba en la pantalla sino en qué cuenta como saber. La lista del
 * catálogo llega por red; mientras venía en camino estaba vacía, y el panel leía
 * ese vacío como "esta rama no está catalogada". Caía entonces a su lista escrita
 * a mano —que nunca está vacía, porque retrocede a CONSTITUCIONAL—, no encontraba
 * allí la actuación elegida, y la reemplazaba por la primera de otra cosa. Para
 * cuando llegaba la lista real, la elección ya no existía.
 */
import { reemplazoDeTipoDeDocumento } from '../documentTypeSelection';
import type { BranchActuaciones } from '../../catalog/hooks/useBranchActuaciones';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

const CARGANDO: BranchActuaciones = { estado: 'CARGANDO', nombres: [], actuaciones: [] };
const VACIA: BranchActuaciones = { estado: 'VACIA', nombres: [], actuaciones: [] };
/*
 * La lista lleva ahora las actuaciones completas y no solo sus nombres: es lo
 * que le permite al selector decir si cada tipo de documento está verificado.
 * Aquí solo importan los nombres, así que las actuaciones van vacías y se dice
 * por qué — una lista incoherente en un check es una trampa para el siguiente
 * que lo lea.
 */
const lista = (...n: string[]): BranchActuaciones => ({
  estado: 'LISTA',
  nombres: n,
  actuaciones: []
});

/** Lo que ofrece el panel mientras el catálogo no ha llegado. Nunca vacío. */
const RESPALDO = ['Acción de tutela', 'Derecho de petición', 'Demanda ejecutiva'];

/*
 * ─── EL CASO QUE SE ROMPIÓ ─────────────────────────────────────────────────
 */
const ELEGIDA = 'Acto administrativo sancionatorio';

check(
  'mientras el catálogo viene en camino, la actuación elegida NO se reemplaza',
  reemplazoDeTipoDeDocumento(CARGANDO, RESPALDO, ELEGIDA) === null,
  String(reemplazoDeTipoDeDocumento(CARGANDO, RESPALDO, ELEGIDA))
);

check(
  'y cuando llega y sí la tiene, tampoco',
  reemplazoDeTipoDeDocumento(lista('Otra cosa', ELEGIDA), [ELEGIDA, 'Otra cosa'], ELEGIDA) === null,
  ''
);

/*
 * ─── PERO SEGUIR SIENDO ÚTIL ───────────────────────────────────────────────
 *
 * El efecto existe por una razón real: al cambiar de rama, el tipo anterior no
 * pertenece a la nueva, y un selector que muestra un valor que no contiene le
 * manda el viejo al motor sin decírselo a nadie. Aflojarlo hasta que no haga
 * nada sería cambiar un defecto por otro.
 */
check(
  'al cambiar de rama, un tipo que ya no pertenece sí se reemplaza',
  reemplazoDeTipoDeDocumento(lista('Demanda laboral', 'Contestación'), ['Demanda laboral', 'Contestación'], 'Acción de tutela') ===
    'Demanda laboral',
  ''
);

check(
  'y con la rama sin catalogar, la lista de respaldo también corrige',
  reemplazoDeTipoDeDocumento(VACIA, RESPALDO, 'Algo que no está') === 'Acción de tutela',
  ''
);

/*
 * Sin opciones no se toca nada: vaciar el selector dejaría al motor sin tipo de
 * documento, que es peor que dejar el que había.
 */
check(
  'sin opciones no se vacía la selección',
  reemplazoDeTipoDeDocumento(VACIA, [], ELEGIDA) === null,
  ''
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
