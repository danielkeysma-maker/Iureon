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
 * pasa de 33 s a 138 s —los otros 135 s se los llevan las tres etapas que
 * vinieron después de la redacción o volvieron tras ella: 90 s el esquema
 * dogmático repuesto, 20 s la comprobación de vigencia y 25 s la de la glosa— y
 * el borrador cabe entero con holgura.
 *
 * ─── DOS CLASES DE PARTIDA, Y LA DIFERENCIA IMPORTA ─────────────────────────
 *
 * Agotar el presupuesto de una etapa SIN LA CUAL NO HAY ESCRITO —hechos,
 * jurisprudencia, redacción— rechaza con `conPresupuesto` y devuelve la
 * reserva. Agotar el de una etapa que solo MEJORA el escrito —el esquema
 * dogmático— o que lo COMPRUEBA después de escrito —vigencia, glosa— no puede
 * costar el borrador: esas fallan abiertas y lo declaran.
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
 * Etapa 3 — comprobación de vigencia contra las fuentes normativas oficiales.
 *
 * VA DESPUÉS DE REDACTAR, y por eso necesita partida propia: lo que comprueba
 * son las citas que el borrador YA trae, así que no puede salir del presupuesto
 * de la redacción sin quitárselo al escrito mismo.
 *
 * Medido el 9 de septiembre de 2026 contra `secretariasenado.gov.co`, con las
 * consultas de los artículos en paralelo: la PRIMERA descarga de la instancia
 * cuesta 6,6 s —se le va casi todo esperando al puerto 443, que desde aquí no
 * conecta— y las siguientes 150–300 ms, porque el esquema que funcionó y el
 * índice de la norma quedan en memoria. Veinte segundos cubrían el arranque en
 * frío más doce artículos con holgura.
 *
 * ─── LA SEGUNDA FUENTE NO DOBLÓ EL RELOJ, Y ESTÁ MEDIDO ───────────────────
 *
 * Desde el 10 de septiembre de 2026 la etapa consulta también el Gestor
 * Normativo de Función Pública. Las fuentes van EN PARALELO dentro de cada
 * consulta, así que la etapa cuesta lo que cueste la más lenta y no la suma:
 * doce artículos en frío, con las dos fuentes, 14,5 s.
 *
 * Función Pública contesta en 966–1.861 ms, búsqueda del identificador
 * incluida. La Secretaría del Senado ese mismo día tardó 18,4 s en servir la
 * portada del Código Civil (168.336 bytes) y 34,6 s la de la Ley 820, y un
 * artículo suyo completo —portada, página y JS de vigencia— costó 27,1 s el
 * art. 1040 y 45,5 s el art. 2035. ESO NO CABE EN VEINTE SEGUNDOS, y el número
 * no se estira a ciegas: estirarlo se lo quitaría a la redacción para pagar una
 * mala tarde de un servidor ajeno. Lo que se hizo fue repartir —ninguna fuente
 * se lleva más del 80% del plazo, ver `officialArticle.service.ts`— para que la
 * fuente rápida no muera esperando a la lenta. En un día normal el Senado
 * costaba 6,6 s y entra sin problema.
 *
 * Y agotarlos NO es un fallo: `verificarVigencia.ts` devuelve NO_VERIFICABLE y
 * el escrito sale igual, diciéndolo. Un borrador perdido por una mala tarde de
 * un sitio público sería peor que el defecto que esta etapa vigila.
 */
export const PLAZO_VIGENCIA_MS = 20_000;

/**
 * Etapa 4 — comprobación de la GLOSA contra el texto oficial.
 *
 * VA DESPUÉS DE LA VIGENCIA, y no es la misma comprobación. La vigencia mira
 * si el artículo sigue vivo; esto mira si el escrito dice bien lo que ese
 * artículo dice — el art. 8 de la Ley 820 está VIGENTE y aun así «sobre las
 * obligaciones del arrendatario» es falso, porque son las del ARRENDADOR.
 *
 * DE DÓNDE SALE SU PARTIDA: de la redacción, que es la única etapa con holgura.
 * Se midió que Opus tarda 85–125 s dentro de un presupuesto que era de 253 s;
 * cederle 25 s a esta etapa lo deja en 228 s, todavía casi el doble de lo
 * medido. Sacarla de cualquier otra habría estrechado una etapa ya justa.
 *
 * POR QUÉ 25 s: son hasta ocho llamadas al motor barato EN PARALELO, con el
 * artículo entero de entrada, en modo JSON y con razonamiento mínimo — el
 * mismo reparto con el que la extracción de hechos tarda 5,4 s. No hay
 * descargas nuevas: el texto oficial lo trajo la etapa de vigencia y esta lo
 * reusa.
 *
 * Y AGOTARLOS NO ES UN FALLO: `verificarGlosa.ts` devuelve DUDOSA y el escrito
 * sale igual, diciéndolo. Cuando esta etapa corre, el borrador ya está escrito
 * y ya se pagó; perderlo por una mala tarde del proveedor sería peor que el
 * defecto que la etapa vigila.
 */
export const PLAZO_GLOSA_MS = 25_000;

/**
 * Etapa 2 — esquema dogmático (GPT-5.6 Sol).
 *
 * ─── POR QUÉ VUELVE A TENER PARTIDA ─────────────────────────────────────────
 *
 * El 9 de septiembre de 2026 esta etapa se retiró porque costaba 35–40 s dentro
 * de una función de 60. Ese motivo caducó el mismo día: el plan pasó a Pro y el
 * tope de la función a 300 s. Se volvió a medir el 10 de septiembre, un caso
 * por brazo con los motores reales, y lo que decidió reponerla no fue el reloj
 * sino lo que el escrito dice:
 *
 *   · SIN esquema, el borrador SE NIEGA A NOMBRAR la causal sustancial —«el
 *     fundamento sustancial relativo a la obligación del arrendatario de pagar
 *     el precio… no está verificado en este escrito y debe comprobarse antes de
 *     radicar», tres veces— pese a que el artículo 22, numeral 1, de la Ley 820
 *     de 2003 estaba autorizado en la ficha TODO EL TIEMPO;
 *   · CON esquema lo invoca, añade un hecho que anticipa la excepción de
 *     contrato no cumplido y ordena las pretensiones declarando primero la
 *     existencia del contrato.
 *
 * Costo medido: US$0,2285 sin ella contra US$0,2997 con ella (+31%), y +56 s.
 *
 * ─── DE DÓNDE SALEN LOS 90 s, Y POR QUÉ NO SON 75 ──────────────────────────
 *
 * Lo medido el 10 de septiembre eran 36,5 s con el tope de tokens viejo
 * (1.536), que además cortaba el esquema por longitud. Con el tope nuevo el
 * esquema TERMINA, y terminar cuesta más tokens y por tanto más segundos.
 * Primero se presupuestaron 75 s estimando ~60 s; la corrida de comprobación
 * con los tres motores reales dio 69,5 s para un esquema completo de 3.818
 * caracteres. Es decir: la estimación acertó de cerca y el margen que dejaba
 * —5,5 s— era demasiado fino para una etapa que cuesta US$0,027 y que al
 * vencer los tira.
 *
 * Noventa dan un 30% de holgura sobre lo medido, y salen de la redacción, que
 * es la única etapa que la tiene: se queda en 138 s contra los 66,7 s que Opus
 * tardó en esa misma corrida y los 84,8–95 s de las anteriores.
 *
 * ─── Y AGOTARLOS NO PUEDE TUMBAR EL BORRADOR ────────────────────────────────
 *
 * Esta partida NO se cobra con `conPresupuesto`, que RECHAZA. El esquema es una
 * ayuda a la redacción, no la redacción: sin él el redactor sigue con los
 * hechos, la ficha y la jurisprudencia, exactamente como el pipeline de dos
 * motores que corrió hasta hoy. Perder el escrito caro por una mala tarde de
 * GPT sería peor que quedarse sin la mejora que esta etapa aporta.
 */
export const PLAZO_ESQUEMA_MS = 90_000;

/**
 * Etapa 3 — redacción (Opus).
 *
 * Es el remanente. Con el tope de Hobby eran 33 s y NO alcanzaba: Opus escribe
 * a unos 75 tokens de salida por segundo, así que en 33 s caben ~2.500 tokens
 * (≈5.000 caracteres, dos páginas) contra los 14.600–21.400 caracteres de un
 * escrito completo, y la redacción de cualquier caso agotaba su presupuesto.
 * Con el tope de Pro son 138 s —eran 273 hasta que la comprobación de vigencia
 * reclamó 20 s, la de la glosa otros 25 y el esquema dogmático 90 al
 * reponerse— y lo medido cabe con holgura: 84,8 s con `reasoning_effort:
 * 'low'` y 124,7 s con `'medium'`. El presupuesto sigue existiendo porque un
 * plazo generoso no es un plazo ausente — si un motor se cuelga, quien corta es
 * este código y la reserva vuelve.
 */
export const PLAZO_REDACCION_MS =
  TOPE_DE_FUNCION_MS -
  RESERVA_DE_CIERRE_MS -
  PLAZO_HECHOS_MS -
  PLAZO_JURISPRUDENCIA_MS -
  PLAZO_ESQUEMA_MS -
  PLAZO_VIGENCIA_MS -
  PLAZO_GLOSA_MS -
  2_000;

/** Lo que las etapas más el cierre reclaman del reloj de la función. */
export const sumaDePresupuestos = (): number =>
  PLAZO_HECHOS_MS +
  PLAZO_JURISPRUDENCIA_MS +
  PLAZO_ESQUEMA_MS +
  PLAZO_REDACCION_MS +
  PLAZO_VIGENCIA_MS +
  PLAZO_GLOSA_MS +
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
