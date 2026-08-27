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
 * Queries per firm per day.
 *
 * Chosen against use, not against cost: a lawyer working through a real matter
 * asks a handful of times, and thirty is far past that while keeping the worst
 * case per firm under half a dollar. It is deliberately not a number to be
 * tuned by feel — moving it moves the ceiling of what a bad day can cost.
 */
export const TOPE_DIARIO = 30;

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
