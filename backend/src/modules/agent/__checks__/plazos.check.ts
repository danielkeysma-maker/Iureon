/**
 * Guarda el reparto del reloj de la función entre las etapas de la redacción.
 *
 * Run with: npm run check:plazos
 *
 * ─── DE DÓNDE SALE ESTE ARCHIVO ─────────────────────────────────────────────
 *
 * El 9 de septiembre de 2026 se midió el pipeline real, tres corridas, con una
 * actuación del catálogo y hechos de tamaño corriente:
 *
 *   etapa                       corrida 1   corrida 2   corrida 3
 *   1  hechos (Gemini)             8,4 s       7,6 s       7,6 s
 *   1.5 jurisprudencia             8,0 s       2,1 s       2,1 s
 *   2  esquema (GPT)              20,0 s ✗    20,0 s ✗    20,0 s ✗   (abortó, 0 caracteres)
 *
 * (La etapa 2 se retiró ese día por esos números y se REPUSO el 10 de
 * septiembre, con el plan ya en Pro y su propia partida de 75 s. Con plazo
 * suficiente responde en 36,5 s y lo que aporta se midió: sin ella el escrito
 * se niega a nombrar la causal sustancial que la ficha ya autorizaba.)
 *   3  redacción (Opus)          115,6 s     109,7 s      98,2 s
 *   TOTAL                        153,6 s     141,0 s     129,8 s
 *
 * `vercel.json` fija `maxDuration: 60`. La plataforma mataba la función mucho
 * antes del final, y como la reserva del saldo se toma ANTES de llamar a ningún
 * modelo y el proceso muere sin ejecutar su `catch`, la firma se quedaba sin
 * escrito, sin mensaje y sin su saldo. Dos invariantes nacen de ahí y este
 * archivo las sostiene:
 *
 *   1. la suma de los presupuestos por etapa cabe DEBAJO del tope de la
 *      función, y el tope del código es el mismo número que el de `vercel.json`
 *      — si alguien sube el plan y toca solo uno de los dos, esto falla;
 *   2. agotar un presupuesto DEVUELVE la reserva. Sin eso, cortar antes que la
 *      plataforma solo cambiaría quién se queda callado.
 *
 * Nada aquí llama a un modelo ni sale a la red.
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  PLAZO_ESQUEMA_MS,
  PLAZO_HECHOS_MS,
  PLAZO_GLOSA_MS,
  PLAZO_JURISPRUDENCIA_MS,
  PLAZO_REDACCION_MS,
  PLAZO_VIGENCIA_MS,
  RESERVA_DE_CIERRE_MS,
  TOPE_DE_FUNCION_MS,
  TiempoDeRedaccionAgotado,
  conPresupuesto,
  relojDeEtapa,
  sumaDePresupuestos
} from '../presupuestoDeTiempo';
import { desenlaceDeFallo } from '../agent.controller';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

/* ─── 1. EL TOPE DEL CÓDIGO ES EL DE LA PLATAFORMA ─────────────────────────── */

const vercelPath = path.resolve(__dirname, '../../../../vercel.json');
const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
const maxDuration = vercel?.builds?.[0]?.config?.maxDuration;

check(
  'vercel.json declara un maxDuration numérico',
  typeof maxDuration === 'number' && maxDuration > 0,
  String(maxDuration)
);
check(
  'el tope que usa el código es el mismo que el de la plataforma',
  TOPE_DE_FUNCION_MS === maxDuration * 1000,
  `código ${TOPE_DE_FUNCION_MS} ms · vercel.json ${maxDuration * 1000} ms`
);

/* ─── 2. LA SUMA DE LOS PRESUPUESTOS CABE, CON MARGEN ──────────────────────── */

const suma = sumaDePresupuestos();
check(
  'la suma de los presupuestos por etapa más el cierre es MENOR que el tope',
  suma < TOPE_DE_FUNCION_MS,
  `${suma} ms de ${TOPE_DE_FUNCION_MS} ms`
);
check(
  'y deja al menos un segundo de margen para que corte el código y no la plataforma',
  TOPE_DE_FUNCION_MS - suma >= 1_000,
  `margen ${TOPE_DE_FUNCION_MS - suma} ms`
);
check(
  'ninguna etapa tiene presupuesto cero o negativo',
  PLAZO_HECHOS_MS > 0 && PLAZO_JURISPRUDENCIA_MS > 0 && PLAZO_REDACCION_MS > 0 && PLAZO_VIGENCIA_MS > 0,
  `${PLAZO_HECHOS_MS} / ${PLAZO_JURISPRUDENCIA_MS} / ${PLAZO_REDACCION_MS} / ${PLAZO_VIGENCIA_MS}`
);
/*
 * LA COMPROBACIÓN DE VIGENCIA TIENE PARTIDA PROPIA, y tenía que tenerla: corre
 * DESPUÉS de redactar, así que sacarla del presupuesto de la redacción se lo
 * habría quitado al escrito. Medido: la primera descarga de la instancia cuesta
 * 6,6 s y las siguientes 150–300 ms.
 */
check(
  'la comprobación de vigencia tiene su propia partida, y le alcanza para el arranque en frío',
  PLAZO_VIGENCIA_MS >= 10_000,
  `${PLAZO_VIGENCIA_MS} ms`
);
/*
 * LA COMPROBACIÓN DE GLOSA TAMBIÉN TIENE LA SUYA, y salió de la redacción — la
 * única etapa con holgura: Opus tarda 85–125 s medidos dentro de un presupuesto
 * que era de 253 s, así que cederle 25 s lo deja en 228 s y sigue sobrando.
 */
check(
  'la comprobación de glosa tiene su propia partida, sacada de la redacción y no de una etapa justa',
  PLAZO_GLOSA_MS >= 15_000 && PLAZO_REDACCION_MS >= 130_000,
  `glosa ${PLAZO_GLOSA_MS} ms · redacción ${PLAZO_REDACCION_MS} ms`
);
check(
  'el cierre —cobrar, auditar y responder— tiene su parte reservada',
  RESERVA_DE_CIERRE_MS >= 3_000,
  `${RESERVA_DE_CIERRE_MS} ms`
);
check(
  'la redacción se lleva la mayor parte, que es donde está el trabajo',
  PLAZO_REDACCION_MS > PLAZO_HECHOS_MS && PLAZO_REDACCION_MS > PLAZO_JURISPRUDENCIA_MS,
  `${PLAZO_REDACCION_MS} ms`
);

/* ─── 3. AGOTAR EL PLAZO RECHAZA; NO DEVUELVE UN RESPALDO ──────────────────── */

const nuncaTermina = new Promise<string>(() => {});

const pruebas = async (): Promise<void> => {
  const t0 = Date.now();
  let capturado: unknown = null;
  try {
    await conPresupuesto(nuncaTermina, 120, 'etapa de prueba');
  } catch (err) {
    capturado = err;
  }
  const transcurrido = Date.now() - t0;

  check(
    'un trabajo que no termina RECHAZA al agotar su presupuesto',
    capturado instanceof TiempoDeRedaccionAgotado,
    capturado instanceof Error ? capturado.name : String(capturado)
  );
  check(
    'y rechaza dentro de su plazo, no mucho después',
    transcurrido >= 100 && transcurrido < 2_000,
    `${transcurrido} ms`
  );
  check(
    'el error dice de qué etapa se trata',
    capturado instanceof TiempoDeRedaccionAgotado && capturado.etapa === 'etapa de prueba'
  );

  const aTiempo = await conPresupuesto(Promise.resolve('escrito'), 5_000, 'etapa rápida');
  check('un trabajo que sí termina devuelve su valor', aTiempo === 'escrito');

  let propagado: unknown = null;
  try {
    await conPresupuesto(Promise.reject(new Error('el motor calló')), 5_000, 'etapa fallida');
  } catch (err) {
    propagado = err;
  }
  check(
    'un fallo propio de la etapa se propaga tal cual, no se disfraza de plazo agotado',
    propagado instanceof Error &&
      !(propagado instanceof TiempoDeRedaccionAgotado) &&
      propagado.message === 'el motor calló'
  );

  /* ─── 4. AGOTAR EL PLAZO DEVUELVE LA RESERVA ─────────────────────────────── */

  const porPlazo = desenlaceDeFallo(new TiempoDeRedaccionAgotado('redaccion del escrito', PLAZO_REDACCION_MS));
  check('agotado el plazo, la reserva del saldo SE DEVUELVE', porPlazo.devuelveReserva === true);
  check(
    'y el motivo que queda escrito nombra el plazo, no un fallo genérico',
    /plazo/i.test(porPlazo.razon),
    porPlazo.razon
  );
  check(
    'el mensaje al abogado dice que no se descontó saldo',
    /no se descontó saldo/i.test(porPlazo.mensaje),
    porPlazo.mensaje
  );
  /*
   * Medido el 9 de septiembre de 2026: un recurso de reposición con UN hecho y
   * 227 caracteres de indicación también agota los 33 s. Así que el mensaje no
   * puede sugerirle al abogado que recorte el caso — sería mandarlo a chocar
   * contra un muro que no depende de él.
   */
  check(
    'y NO le sugiere acortar el escrito, porque se midió que ni el más corto cabe',
    !/más corto|menos hechos|acorte|recorte/i.test(porPlazo.mensaje),
    porPlazo.mensaje
  );
  check(
    'sino que le dice que el límite es del alojamiento, no suyo',
    /no depende de/i.test(porPlazo.mensaje) && /plan/i.test(porPlazo.mensaje),
    porPlazo.mensaje
  );
  check(
    'y le dice cuántos segundos permite la plataforma, con el número real',
    porPlazo.mensaje.includes(`${Math.round(TOPE_DE_FUNCION_MS / 1000)} segundos`),
    porPlazo.mensaje
  );

  const porOtroFallo = desenlaceDeFallo(new Error('El motor de redacción no devolvió el escrito.'));
  check('cualquier otro fallo también devuelve la reserva', porOtroFallo.devuelveReserva === true);
  check(
    'y le llega al abogado el mensaje del motor, no uno inventado',
    porOtroFallo.mensaje === 'El motor de redacción no devolvió el escrito.',
    porOtroFallo.mensaje
  );
  check(
    'un fallo sin mensaje no deja al abogado sin explicación',
    desenlaceDeFallo(null).mensaje.length > 10,
    desenlaceDeFallo(null).mensaje
  );

  /* ─── 5. EL RELOJ DE ETAPA REPARTE LO QUE QUEDA ──────────────────────────── */

  const reloj = relojDeEtapa(PLAZO_JURISPRUDENCIA_MS);
  check(
    'un reloj de etapa recién abierto ofrece casi todo su presupuesto',
    reloj.restante() > PLAZO_JURISPRUDENCIA_MS - 200 && reloj.restante() <= PLAZO_JURISPRUDENCIA_MS,
    `${reloj.restante()} ms`
  );
  await new Promise((r) => setTimeout(r, 150));
  check(
    'y descuenta lo que ya se gastó, que es lo que impedía que descubrir e indexar sumaran 35 s dentro de una etapa de 8',
    reloj.restante() < PLAZO_JURISPRUDENCIA_MS - 100,
    `${reloj.restante()} ms`
  );
  check(
    'nunca ofrece un plazo negativo',
    relojDeEtapa(0).restante() === 0
  );

  /* ─── 6. LA ETAPA 2 CORRE, Y NO PUEDE TUMBAR EL BORRADOR ────────────────── */

  /*
   * AQUÍ SE EXIGÍA LO CONTRARIO, y conviene decirlo: hasta el 10 de septiembre
   * de 2026 esta sección se llamaba «la etapa 2 no volvió por la puerta de
   * atrás» y aseveraba que el servicio NO nombra a `ENGINE.GPT`. La etapa se
   * repuso —el porqué medido está en `runDogmaticOutline`— así que lo que este
   * check tiene que sostener ahora son las tres condiciones con las que volvió.
   */
  const rutaServicio = path.resolve(__dirname, '../openrouter.service.ts');
  const servicio = fs.readFileSync(rutaServicio, 'utf8');
  const conPresupuestos = (servicio.match(/conPresupuesto\(/g) ?? []).length;

  check('el pipeline vuelve a llamar al motor del esquema dogmático', /ENGINE\.GPT/.test(servicio));
  check(
    'y el registro de ejecución vuelve a anunciar la etapa que sí corre',
    /STAGE_2_LOGIC/.test(servicio)
  );
  /*
   * LA CONDICIÓN QUE EL DUEÑO IMPUSO CON NOMBRE PROPIO: agotar el plazo del
   * esquema deja al redactor sin esa ayuda, nunca sin borrador. Por eso la
   * etapa 2 va con `conPlazo` —que devuelve un valor de respaldo, aquí la
   * cadena vacía— y NO con `conPresupuesto`, que rechaza.
   */
  /*
   * EL PISO SALE DE LO MEDIDO: un esquema completo tardó 69,5 s en la corrida
   * de comprobación. Menos de 80 s dejaría a la etapa sin margen para una tarde
   * lenta del proveedor, y vencer significa tirar los US$0,027 que ya se pagaron.
   */
  check(
    'la etapa 2 tiene partida propia, con holgura sobre los 69,5 s medidos',
    PLAZO_ESQUEMA_MS >= 80_000,
    `${PLAZO_ESQUEMA_MS} ms`
  );
  check(
    'y agotarla NO puede tumbar el borrador: va con conPlazo, no con conPresupuesto',
    /conPlazo\(\s*this\.runDogmaticOutline/.test(servicio) &&
      !/conPresupuesto\(\s*this\.runDogmaticOutline/.test(servicio)
  );
  check(
    'la partida del esquema salió de la redacción, que sigue con holgura sobre lo medido (66,7-95 s)',
    PLAZO_REDACCION_MS >= 130_000,
    `${PLAZO_REDACCION_MS} ms`
  );
  /*
   * EL TOPE DE TOKENS TIENE QUE DEJARLO TERMINAR. Con 1.536 se cortaba por
   * longitud a los 2.917 caracteres, con la estrategia de sustentación a media
   * frase, y el trozo viajaba al redactor como si estuviera entero.
   */
  check(
    'el tope de tokens del esquema deja que termine (con 1.536 se cortaba)',
    /GPT_NEW: (?:[4-9]|[1-9]\d)\d{3}/.test(servicio),
    (servicio.match(/GPT_NEW: \d+/) ?? ['sin GPT_NEW'])[0]
  );
  /*
   * Y SI AUN ASÍ SE CORTA, SE DECLARA. Un esquema truncado presentado como
   * completo es lo que ya pasó: el registro decía «consolidado» y nadie sabía
   * que faltaba el final.
   */
  check(
    'un esquema cortado por longitud se declara en el registro y viaja rotulado',
    /truncated/.test(servicio) && /MARCA_DE_ESQUEMA_CORTADO/.test(servicio) && /INCOMPLETO/.test(servicio)
  );
  check(
    'las etapas que no pueden faltar van cada una con su presupuesto',
    conPresupuestos >= 3,
    String(conPresupuestos)
  );
  /*
   * EL ROTULADO DEL ESQUEMA NO ES OPCIONAL. El esquema recita derecho de
   * memoria —midió «Ley 2220 de 2022, art. 68» donde la ficha dice art. 146— y
   * la regla de citación lo filtró todo esa vez. Una salvaguarda que aguantó
   * una vez y no está escrita se pierde en el siguiente cambio de prompt.
   */
  const rutaPrompt = path.resolve(__dirname, '../claudeDraft.prompt.ts');
  const prompt = fs.readFileSync(rutaPrompt, 'utf8');
  check(
    'el esquema entra al prompt de Opus rotulado como propuesta NO VERIFICADA',
    /PROPUESTA NO VERIFICADA/.test(prompt)
  );
  check(
    'y el prompt dice que sus citas no autorizan nada y quedan sujetas a la regla de citación',
    /SUS CITAS NO AUTORIZAN NADA/.test(prompt) && /regla de citación/.test(prompt)
  );
  check(
    'el rótulo se arma en un solo sitio y el redactor lo recibe',
    /bloqueDelEsquema\(gptSchemaOutput\)/.test(prompt) && /gptSchemaOutput: gptStructure/.test(servicio)
  );

  /*
   * LA VIGENCIA NO USA `conPresupuesto`, Y ESO ES EL DISEÑO. Cuando corre, el
   * escrito ya está escrito y ya se pagó: rechazar ahí perdería el borrador por
   * una mala tarde del Senado. Su tope vive dentro del verificador y devuelve
   * NO_VERIFICABLE, que se declara en el propio escrito.
   */
  check(
    'la comprobación de vigencia corre con su plazo pero NO puede tumbar el escrito',
    /verificarVigenciaDelEscrito\(/.test(servicio) &&
      !/conPresupuesto\(\s*verificarVigenciaDelEscrito/.test(servicio) &&
      /PLAZO_VIGENCIA_MS/.test(servicio)
  );
  /*
   * Y LA DE GLOSA, IGUAL. Es la regla que el usuario impuso con nombre propio:
   * agotar el plazo significa DUDOSA, nunca un borrador perdido. Cuando esta
   * etapa corre, el escrito ya está escrito y ya se pagó, así que envolverla en
   * `conPresupuesto` —que RECHAZA— cambiaría un aviso por la pérdida del
   * trabajo caro. El tope vive dentro del propio verificador.
   */
  check(
    'la comprobación de glosa corre con su plazo pero TAMPOCO puede tumbar el escrito',
    /verificarGlosaDelEscrito\(/.test(servicio) &&
      !/conPresupuesto\(\s*verificarGlosaDelEscrito/.test(servicio) &&
      /PLAZO_GLOSA_MS/.test(servicio)
  );
  /*
   * Y SE JUZGA SOBRE EL ESCRITO DEL MOTOR, no sobre el ya anotado: pasarle el
   * texto con la advertencia de vigencia encima le daría a juzgar las frases
   * que el propio sistema acaba de escribir.
   */
  check(
    'la glosa se juzga sobre el texto que salió del motor, no sobre el ya anotado',
    /verificarGlosaDelEscrito\(legalText,/.test(servicio)
  );

  console.log(fallos === 0 ? `\nTODO BIEN (${suma} ms de ${TOPE_DE_FUNCION_MS} ms)` : `\n${fallos} FALLO(S)`);
  process.exitCode = fallos === 0 ? 0 : 1;
};

void pruebas();
