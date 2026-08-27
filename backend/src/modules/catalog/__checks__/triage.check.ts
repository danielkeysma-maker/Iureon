/**
 * Guards the facts-to-actuación orientation.
 *
 * Run with: npm run check:triage
 *
 * Un modelo escoge de una lista cerrada, y lo único que impide que su
 * imaginación llegue al abogado es que cada nombre se resuelva contra el
 * catálogo. Eso es lo que se comprueba aquí, y se comprueba SIN llamar al
 * modelo: la garantía no puede depender de que un proveedor esté de buen humor.
 */
import { catalogService } from '../catalog.service';
import { triageFacts } from '../triage.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/**
 * Una observación sobre el modelo, que se reporta pero NO tumba la compilación.
 *
 * La garantía de este módulo es determinista: un nombre que el catálogo no
 * resuelve no llega al abogado, y eso se comprueba sin llamar a nadie. La
 * CALIDAD del criterio del modelo es otra cosa — vale medirla, y va a variar
 * entre corridas porque un LLM no es una función pura.
 *
 * Se separó tras ver este check fallar y pasar tres veces seguidas con el mismo
 * código. Un gate que se pone rojo por el humor de un proveedor entrena a la
 * gente a reintentar hasta que salga verde, y a partir de ahí ya no protege
 * nada: es exactamente el "gate ignorado" que este proyecto tiene documentado.
 */
let observaciones = 0;
const observa = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'OJO '} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) observaciones++;
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

(async () => {
  // Un texto demasiado corto no gasta una llamada al modelo: pide detalle.
  const corto = await triageFacts('ayuda');
  check(
    'unos hechos demasiado cortos piden detalle sin gastar una llamada',
    corto.status === 'SIN_COINCIDENCIA' && /detalle/i.test(corto.reason ?? ''),
    corto.status
  );

  /*
   * ─── LA PARTE QUE SÍ LLAMA AL MODELO ─────────────────────────────────────
   *
   * Se salta limpiamente sin proveedor: un check que falla en toda máquina sin
   * llave es uno que todo el mundo aprende a ignorar.
   */
  const disparate = await triageFacts(
    'quiero saber cual es la mejor receta de arroz con pollo para el almuerzo del domingo'
  );

  if (disparate.status === 'NO_PROVIDER') {
    console.log('skip la parte que llama al modelo: no hay OPENROUTER_API_KEY');
  } else {
    /*
     * Que el disparate devuelva vacío es el caso que define el módulo. Un
     * catálogo que responde tres actuaciones al azar ante una receta de cocina
     * presenta su propio silencio como tres hallazgos — el mismo defecto que
     * tuvo el umbral 0,45 de la jurisprudencia.
     */
    observa(
      'un disparate no recibe actuaciones inventadas para rellenar',
      disparate.status === 'SIN_COINCIDENCIA' && disparate.suggestions.length === 0,
      `${disparate.status} con ${disparate.suggestions.length}`
    );

    const real = await triageFacts(
      'el papá de los niños no ha dado un peso en ocho meses y ellos viven con la mamá'
    );

    observa(
      'unos hechos reales sí reciben orientación',
      real.status === 'OK' && real.suggestions.length > 0,
      `${real.status} con ${real.suggestions.length}`
    );

    // Y lo devuelto es del catálogo, con su término: la ficha no la escribe el modelo.
    const sinTermino = real.suggestions.filter((s) => !s.actuacion.term || !s.actuacion.legalBasis);
    observa(
      'cada sugerencia llega con el término y el artículo del catálogo',
      sinTermino.length === 0,
      sinTermino.map((s) => s.actuacion.exactName).join(', ')
    );
  }

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  process.exitCode = fallos === 0 ? 0 : 1;
})();
