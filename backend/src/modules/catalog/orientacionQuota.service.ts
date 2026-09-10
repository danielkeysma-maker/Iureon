import { supabase } from '../../config/supabase.config';

/**
 * Caps how many orientations one firm can ask for in a day.
 *
 * WHY A FREE ALLOWANCE AND THEN A PRICE, RATHER THAN EITHER ALONE. Orientación
 * is the door for the lawyer who does not yet know what to ask, and charging at
 * that door turns away exactly the person the screen was built for. But free
 * AND unbounded is not a commercial decision, it is an open tap on the company
 * card: the screen sends the whole catalogue to a paid model on every press,
 * and nothing stopped a legitimate session from pressing it five thousand times.
 *
 * A hard wall was the first answer and it was the wrong one. It punishes the
 * firm working a heavy day exactly as hard as the one abusing the endpoint, and
 * the firm that genuinely needs the thirty-first is simply told no.
 *
 * So: the allowance is free and generous, and past it the consultation is
 * charged to the firm's own balance. The hook stays free for everyone who has
 * not paid, the intense user is served, and beyond the allowance the cost is
 * borne by whoever is generating it — which is what makes abuse stop being the
 * company's problem.
 *
 * IT COUNTS BEFORE CALLING THE MODEL, WHICH IS THE WHOLE POINT. Counting after
 * would mean the abusive call is paid for and then recorded — the cap would
 * describe the damage instead of preventing it. So the consumption is claimed
 * first, and if the model then fails, that attempt is still spent. That is the
 * right way round: a cap that can be bypassed by making calls fail is not a cap.
 */

/**
 * Consultas gratuitas por firma y por día.
 *
 * ERAN TREINTA, Y EL NÚMERO SE ESCOGIÓ CONTRA EL USO SIN MIRAR EL COSTO REAL.
 * El razonamiento original decía «el peor caso por firma se queda bajo medio
 * dólar»; la medición del 9 de septiembre de 2026, en este mismo repositorio
 * (`triage.service.ts`), dice otra cosa: una orientación SIN RAMA —que es la
 * de esta pantalla, porque cuál es la rama es justo lo que se pregunta— manda
 * las 883 fichas al motor y cuesta entre US$0,0098 y US$0,0158, o sea $42 a
 * $67 COP. Treinta al día son $1.260 a $2.000 COP POR FIRMA Y POR DÍA: unos
 * $40.000 COP al mes por firma, no medio dólar.
 *
 * DIEZ Y NO TREINTA. Un abogado trabajando un asunto real pregunta un puñado
 * de veces; diez sigue estando por encima de eso y baja el peor caso a $420 a
 * $670 COP diarios. Y no cierra la puerta a nadie: pasada la décima la
 * consulta no se niega, se cobra.
 *
 * Este número NO se ajusta a ojo: moverlo mueve el techo de lo que puede
 * costar un mal día. Si vuelve a subir, que sea contra una medición nueva.
 */
export const TOPE_DIARIO = 10;

export type CupoResultado =
  /** Dentro del cupo gratuito del día. No se cobra nada. */
  | { permitido: true; cobrar: false; consultasHoy: number; restantes: number }
  /*
   * Pasado el cupo. NO se niega: se cobra.
   *
   * Un muro duro castiga igual al uso legítimo intenso que al abusivo, y la
   * firma que de verdad necesita la número treinta y uno se queda sin ella. Al
   * cobrar, el gancho gratuito se conserva íntegro y el consumo de más lo paga
   * quien lo hace, con lo cual deja de salir de la tarjeta de la casa.
   */
  | { permitido: true; cobrar: true; consultasHoy: number; restantes: 0 }
  /*
   * Sin base de datos no se puede contar, y hay que decidir qué hacer.
   *
   * Se PERMITE, y es deliberado: el tope protege un gasto de centavos, y
   * negarle la orientación a todo el mundo porque la base tuvo un mal minuto
   * cambia un costo pequeño por una caída de producto. El caso contrario —
   * fallar cerrado— tendría sentido si esto guardara dinero o datos ajenos, y
   * no es el caso.
   */
  | { permitido: true; cobrar: false; consultasHoy: 0; restantes: number; sinContar: true };

/**
 * El día en Colombia, no en UTC.
 *
 * Un tope "diario" que se reinicia a las 7 de la noche hora local es
 * incomprensible para quien lo vive. Se calcula en el servidor: dejar que el
 * navegador diga qué día es sería dejarle decir cuándo se reinicia su cuota.
 */
export const diaEnColombia = (ahora: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(ahora);

export const consumirCupo = async (firmId: string): Promise<CupoResultado> => {
  if (!supabase) {
    return { permitido: true, cobrar: false, consultasHoy: 0, restantes: TOPE_DIARIO, sinContar: true };
  }

  const { data, error } = await supabase.rpc('consumir_orientacion', {
    p_firm_id: firmId,
    p_dia: diaEnColombia(),
    p_tope: TOPE_DIARIO
  });

  if (error) {
    console.warn(`[ORIENTACION] No se pudo contar el cupo de ${firmId}: ${error.message}`);
    return { permitido: true, cobrar: false, consultasHoy: 0, restantes: TOPE_DIARIO, sinContar: true };
  }

  /*
   * NULL es la respuesta, no un fallo.
   *
   * La función suma y comprueba en la MISMA sentencia; cuando la fila ya está
   * en el tope el UPDATE no toca nada y no devuelve fila. Distinguir por eso, y
   * no por un conteo leído antes, es lo que impide que dos pestañas del mismo
   * abogado lean 29 y ambas se crean con derecho a la número 30.
   */
  if (data === null || data === undefined) {
    // El cupo gratuito se agotó. No se niega la consulta: el que llama cobra.
    return { permitido: true, cobrar: true, consultasHoy: TOPE_DIARIO, restantes: 0 };
  }

  const consultasHoy = Number(data);
  return {
    permitido: true,
    cobrar: false,
    consultasHoy,
    restantes: Math.max(0, TOPE_DIARIO - consultasHoy)
  };
};

/**
 * DEVUELVE UNA CONSULTA DEL CUPO CUANDO EL FALLO FUE NUESTRO.
 *
 * ─── POR QUÉ ESTO NO EXISTÍA, Y POR QUÉ AHORA SÍ ───────────────────────────
 *
 * La regla original era dura a propósito: «si el modelo falla después, ese
 * intento igual se gastó — un tope que se esquiva haciendo fallar las llamadas
 * no es un tope». El razonamiento era correcto y la conclusión ya no lo es,
 * porque descansaba en una premisa que no se comprobó: que el cliente pudiera
 * provocar el fallo.
 *
 * MIRADO EL 10 DE SEPTIEMBRE DE 2026, `triage.service.ts` devuelve FAILED en
 * exactamente tres casos, y los tres son de la casa: el motor no contestó a
 * tiempo, contestó vacío, o contestó algo que no se pudo leer. Que los hechos
 * del abogado no correspondan a ninguna actuación NO es un fallo — es
 * SIN_COINCIDENCIA, una respuesta legítima que sí consume cupo y debe hacerlo.
 *
 * Lo único con lo que el cliente podía empujar hacia el fallo era el tamaño de
 * los hechos, que no tenía tope; ahora lo tiene (`MAX_HECHOS` en el
 * controlador) y se rechaza ANTES de consumir cupo. Cerrada esa puerta, cobrar
 * una consulta del cupo por una mala tarde de OpenRouter es cobrarle al
 * abogado un error nuestro.
 *
 * ─── LA CARRERA QUE SE ACEPTA, Y POR QUÉ SE ACEPTA ─────────────────────────
 *
 * Esto lee y luego escribe, así que dos devoluciones simultáneas de la misma
 * firma podrían devolver una sola. El peor desenlace es que una firma se quede
 * con una consulta gratis de más. La operación contraria —consumir— NO se hace
 * así justamente porque allí la carrera regala cupo por encima del tope; aquí
 * lo que está en juego es un centavo a favor del cliente, no un grifo abierto.
 * Se prefiere eso a pedir una función nueva en la base por una devolución.
 *
 * Nunca lanza: llega después de que la orientación ya falló, y un fallo al
 * devolver el cupo no puede convertirse en un segundo error para el abogado.
 */
export const devolverCupo = async (firmId: string): Promise<void> => {
  if (!supabase) return;

  const dia = diaEnColombia();
  const { data, error } = await supabase
    .from('orientacion_diaria')
    .select('consultas')
    .eq('firm_id', firmId)
    .eq('dia', dia)
    .maybeSingle();

  if (error || !data || Number(data.consultas) <= 0) return;

  const { error: errorAlEscribir } = await supabase
    .from('orientacion_diaria')
    .update({ consultas: Number(data.consultas) - 1, updated_at: new Date().toISOString() })
    .eq('firm_id', firmId)
    .eq('dia', dia)
    .gt('consultas', 0);

  if (errorAlEscribir) {
    console.warn(`[ORIENTACION] No se pudo devolver el cupo de ${firmId}: ${errorAlEscribir.message}`);
  }
};
