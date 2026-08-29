/**
 * La resolución de nombres contra el catálogo. SIN RED.
 *
 * Run with: npm run check:resolucion
 *
 * ─── POR QUÉ ESTE ARCHIVO EXISTE APARTE DE `triage.check.ts` ────────────────
 *
 * Vivía dentro de él, y `triage` está declarado como check DE RED porque su
 * segunda mitad llama al modelo. La suite local omite los de red por defecto,
 * así que omitía TAMBIÉN estas cuatro garantías, que no llaman a nadie.
 *
 * El precio se pagó: el emparejador empezó a resolver una actuación inventada
 * —«Demanda de saneamiento por vicios ocultos anticipada del arrendador», de
 * arrendamiento— contra una ficha de COMPRAVENTA con su término verificado, y
 * CI estuvo rojo por eso en doce commits seguidos mientras en local se veía
 * 22/22. Un archivo que mezcla una garantía determinista con una observación
 * de red hereda la clasificación de la parte más frágil, y la garantía deja de
 * correr donde más falta hace: antes de empujar.
 *
 * Aquí no se importa `triage.service` a propósito: lo que se comprueba es
 * `findByDocumentType`, que es la puerta por la que pasa CADA nombre que el
 * modelo propone.
 */
import { catalogService } from '../catalog.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/*
 * ─── LA GARANTÍA, PROBADA CONTRA EL CATÁLOGO REAL ──────────────────────────
 *
 * `findByDocumentType` es la puerta por la que pasa cada nombre que el modelo
 * propone. Si dejara pasar algo que no existe, el abogado recibiría una ficha
 * con término y artículo que nadie verificó — que es el defecto que este
 * proyecto lleva el día entero quitando.
 */
const inventadas = [
  'Recurso de alzada extraordinaria',
  'Solicitud de amparo preventivo de bienes',
  'Demanda de saneamiento por vicios ocultos anticipada del arrendador',
  'Memorial de oposición preclusiva al desistimiento tácito'
];

const coladas = inventadas.filter((n) => catalogService.findByDocumentType(n) !== null);
check(
  'una actuación inventada no se resuelve contra el catálogo',
  coladas.length === 0,
  coladas.join(', ')
);

/*
 * ─── TOLERAR UN ADJETIVO NO ES DEJAR PASAR UN INVENTO ──────────────────────
 *
 * Este check nació con fixtures equivocados: usaba "Demanda de reconvención
 * ANTICIPADA" y "Acción de tutela URGENTE PRIORITARIA" como si fueran
 * invenciones, y falló porque ambas resuelven. Al mirar A QUÉ resuelven, el
 * código tenía razón: a "Demanda de reconvención" y a "Acción de tutela", que
 * son exactamente las actuaciones que el modelo quiso nombrar.
 *
 * El emparejador quita el adorno y aterriza en lo real, y eso es lo correcto:
 * el abogado recibe la ficha verificada de la actuación que sí existe. Lo que
 * NO puede pasar es que un nombre sin actuación detrás — los cuatro de arriba —
 * llegue a resolver algo.
 *
 * Se deja escrito porque la tentación al ver el fallo era endurecer el
 * emparejador, y eso habría roto el caso bueno para arreglar uno que no
 * existía.
 */
const conAdjetivo: Array<[string, string]> = [
  ['Demanda de reconvención anticipada', 'Demanda de reconvención'],
  ['Acción de tutela urgente prioritaria', 'Acción de tutela']
];

const malAterrizadas = conAdjetivo.filter(
  ([entrada, esperada]) => catalogService.findByDocumentType(entrada)?.exactName !== esperada
);
check(
  'un nombre real con un adjetivo de más aterriza en la actuación real',
  malAterrizadas.length === 0,
  malAterrizadas.map(([e]) => e).join(', ')
);

// Y lo real sí, o el filtro estaría tirando todo por igual y parecería seguro.
const reales = ['Acción de tutela', 'Demanda de alimentos a favor de niño, niña o adolescente'];
const perdidas = reales.filter((n) => catalogService.findByDocumentType(n) === null);
check('una actuación real sí se resuelve', perdidas.length === 0, perdidas.join(', '));

/*
 * El menú que ve el modelo tiene que ser el catálogo entero. Si una rama
 * quedara fuera, sus actuaciones no se propondrían nunca y nadie lo notaría:
 * el abogado de esa materia simplemente no recibiría orientación.
 */
const totalCatalogo = catalogService.list().length;
check(
  'el catálogo tiene actuaciones que ofrecer',
  totalCatalogo > 600,
  `${totalCatalogo} actuaciones en ${catalogService.listBranches().length} ramas`
);

console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
process.exitCode = fallos === 0 ? 0 : 1;
