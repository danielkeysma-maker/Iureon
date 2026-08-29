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
/*
 * El corte por texto corto SÍ es una garantía y sí tumba: no llama a nadie
 * —`triageFacts` responde antes de salir— y lo que protege es el bolsillo del
 * cliente, que no debe pagar una llamada por escribir «ayuda».
 */
let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

let observaciones = 0;
const observa = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'OJO '} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) observaciones++;
};

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
