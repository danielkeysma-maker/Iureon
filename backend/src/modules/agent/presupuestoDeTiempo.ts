/**
 * El reparto del reloj de la función entre las etapas de la redacción.
 *
 * ─── POR QUÉ EXISTE ESTE ARCHIVO, MEDIDO EL 9 DE SEPTIEMBRE DE 2026 ─────────
 *
 * Cuando `vercel.json` fijaba `maxDuration: 60` —el techo del plan Hobby— tres
 * corridas del pipeline real contra los motores, con una actuación del catálogo
 * y hechos de tamaño corriente, dieron 153,6 s · 141,0 s · 129,8 s. La
 * plataforma mataba la función a los 60 s, así que el borrador NUNCA llegaba a
 * producción; y como la reserva del saldo se toma antes de llamar a ningún
 * modelo y el proceso muere sin ejecutar su `catch`, la firma se quedaba con el
 * saldo descontado, sin escrito y sin mensaje. El navegador tampoco lo notaba:
 * el flujo SSE simplemente se cortaba y la pantalla se quedaba en «REDACTANDO».
 *
 * El 9 de septiembre de 2026 se subió el plan a Pro y con él el tope a 300 s.
 * El reparto de abajo NO desaparece por eso: sigue siendo lo que hace que el
 * corte lo dé este código y no la plataforma, que es la diferencia entre
 * devolver la reserva con un motivo y morir en silencio.
 *
 * De ahí la doctrina que este módulo impone, la misma que ya rige en la
 * revisión de escritos (`review/documentReview.controller.ts`, `conLimite`):
 * CORTA EL CÓDIGO, NO LA PLATAFORMA. Cada etapa tiene su propio presupuesto, la
 * suma de todos cabe por debajo del tope de la función con margen para cerrar
 * (cobrar, auditar y responder), y agotar un presupuesto lanza un error que el
 * controlador convierte en devolución de la reserva y en un mensaje que el
 * abogado puede leer.
 *
 * ─── SUBIR DE PLAN ES CAMBIAR DOS NÚMEROS, Y LOS DOS A LA VEZ ───────────────
 *
 * `TOPE_DE_FUNCION_MS` es el espejo de `maxDuration` en `vercel.json`, y
 * `plazos.check.ts` los compara: si uno se mueve sin el otro, el check falla.
 * Hobby permite 60 s; Pro permite 300 s. Con 300 s el presupuesto de redacción
 * pasa de 33 s a 253 s —los otros 20 s son de la comprobación de vigencia, que
 * llegó después— y el borrador cabe entero con holgura.
 */

/** Espejo de `maxDuration` en `vercel.json`. Hobby: 60 s. Pro: 300 s. */
export const TOPE_DE_FUNCION_MS = 300_000;

/**
 * Lo que queda reservado DESPUÉS de la última etapa: cobrar la operación,
 * escribir la auditoría y enviar el evento final. Va antes de responder porque
 * una función serverless se congela al contestar, así que es tiempo de la
 * función y tiene que estar presupuestado como cualquier otro.
 */
export const RESERVA_DE_CIERRE_MS = 5_000;

/**
 * Etapa 1 — extracción de hechos (Gemini).
 *
 * Medido con `reasoning_effort: 'minimal'`: 5,4 s. Con el razonamiento por
 * defecto tardaba 7,6–8,6 s y además se cortaba por longitud, entregando 89–168
 * caracteres de «hechos» porque el razonamiento se comía los 1.024 tokens del
 * presupuesto. Doce segundos dejan sitio para un caso con adjuntos, que lleva
 * el doble de tokens de salida.
 */
export const PLAZO_HECHOS_MS = 12_000;

/**
 * Etapa 1.5 — jurisprudencia (corpus, y descubrimiento cuando el corpus calla).
 *
 * La búsqueda vectorial contra el corpus con el proveedor de producción
 * (Cloudflare) tarda 1,8 s. El resto del presupuesto es para el descubrimiento
 * en las cortes cuando el corpus no devuelve nada — que ya fallaba abierto, así
 * que agotar el plazo aquí deja la lista vacía y el escrito sale sin
 * jurisprudencia, diciéndolo.
 */
export const PLAZO_JURISPRUDENCIA_MS = 8_000;

/**
 * Etapa 3 — comprobación de vigencia contra el texto oficial del Senado.
 *
 * VA DESPUÉS DE REDACTAR, y por eso necesita partida propia: lo que comprueba
 * son las citas que el borrador YA trae, así que no puede salir del presupuesto
 * de la redacción sin quitárselo al escrito mismo.
 *
 * Medido el 9 de septiembre de 2026 contra `secretariasenado.gov.co`, con las
 * consultas de los artículos en paralelo: la PRIMERA descarga de la instancia
 * cuesta 6,6 s —se le va casi todo esperando al puerto 443, que desde aquí no
 * conecta— y las siguientes 150–300 ms, porque el esquema que funcionó y el
 * índice de la norma quedan en memoria. Veinte segundos cubren el arranque en
 * frío más doce artículos con holgura.
 *
 * Y agotarlos NO es un fallo: `verificarVigencia.ts` devuelve NO_VERIFICABLE y
 * el escrito sale igual, diciéndolo. Un borrador perdido por una mala tarde del
 * Senado sería peor que el defecto que esta etapa vigila.
 */
export const PLAZO_VIGENCIA_MS = 20_000;

/**
 * Etapa 2 — redacción (Opus).
 *
 * Es el remanente. Con el tope de Hobby eran 33 s y NO alcanzaba: Opus escribe
 * a unos 75 tokens de salida por segundo, así que en 33 s caben ~2.500 tokens
 * (≈5.000 caracteres, dos páginas) contra los 14.600–21.400 caracteres de un
 * escrito completo, y la redacción de cualquier caso agotaba su presupuesto.
 * Con el tope de Pro son 253 s —eran 273 hasta que la comprobación de vigencia
 * reclamó su partida— y lo medido cabe con holgura: 84,8 s con
 * `reasoning_effort: 'low'` y 124,7 s con `'medium'`. El presupuesto sigue
 * existiendo porque un plazo generoso no es un plazo ausente — si un motor se
 * cuelga, quien corta es este código y la reserva vuelve.
 */
export const PLAZO_REDACCION_MS =
  TOPE_DE_FUNCION_MS -
  RESERVA_DE_CIERRE_MS -
  PLAZO_HECHOS_MS -
  PLAZO_JURISPRUDENCIA_MS -
  PLAZO_VIGENCIA_MS -
  2_000;

/** Lo que las etapas más el cierre reclaman del reloj de la función. */
export const sumaDePresupuestos = (): number =>
  PLAZO_HECHOS_MS +
  PLAZO_JURISPRUDENCIA_MS +
  PLAZO_REDACCION_MS +
  PLAZO_VIGENCIA_MS +
  RESERVA_DE_CIERRE_MS;

/**
 * Se agotó el presupuesto de una etapa.
 *
 * Lleva el nombre de la etapa porque el mensaje al abogado cambia según cuál
 * fue: quedarse sin jurisprudencia no es lo mismo que quedarse sin escrito.
 */
export class TiempoDeRedaccionAgotado extends Error {
  constructor(public readonly etapa: string, public readonly plazoMs: number) {
    super(`La etapa «${etapa}» superó su plazo de ${Math.round(plazoMs / 1000)} s.`);
    this.name = 'TiempoDeRedaccionAgotado';
  }
}

/**
 * Corre un trabajo con su presupuesto. Si se agota, RECHAZA — no devuelve un
 * valor de respaldo.
 *
 * Es la diferencia con `conPlazo`, que sigue usándose donde fallar abierto es
 * correcto (el descubrimiento de jurisprudencia: sin providencias el escrito
 * sale igual y se le prohíbe al modelo citar de memoria). Aquí no hay valor
 * honesto que devolver: media redacción no es un escrito.
 */
export const conPresupuesto = <T>(trabajo: Promise<T>, ms: number, etapa: string): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const reloj = setTimeout(() => reject(new TiempoDeRedaccionAgotado(etapa, ms)), ms);
    trabajo.then(
      (valor) => {
        clearTimeout(reloj);
        resolve(valor);
      },
      (error) => {
        clearTimeout(reloj);
        reject(error);
      }
    );
  });

/**
 * Un reloj de etapa: cuánto queda de su presupuesto.
 *
 * Lo necesita la jurisprudencia, que hace hasta tres cosas seguidas —buscar en
 * el corpus, descubrir en las cortes, indexar lo hallado— y no puede darle a
 * cada una un plazo fijo: los 20 s de descubrimiento y los 15 s de indexado que
 * había escritos sumaban 35 s dentro de una etapa que hoy tiene 8.
 */
export const relojDeEtapa = (presupuestoMs: number): { restante: () => number } => {
  const inicio = Date.now();
  return { restante: () => Math.max(0, presupuestoMs - (Date.now() - inicio)) };
};
