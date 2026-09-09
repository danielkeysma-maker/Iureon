import { supabase } from '../../config/supabase.config';
import { enviarAFirma, enviarAUsuario } from '../push/push.service';
import { avisoQueCorresponde, textoDelAviso, type EntradaVigilada } from './avisos';
import { AgendaError, type EstadoDeEntrada, type HitoDeAviso } from './types';

/**
 * EL TRABAJO DIARIO: quién tiene un término encima y hay que avisarle.
 *
 * ─── UNA SOLA PASADA AL DÍA, Y ES LA PLATAFORMA LA QUE MANDA ────────────────
 *
 * El plan Hobby de Vercel permite UN cron al día. Corre a las 12:00 UTC, que
 * son las 7:00 de la mañana en Colombia (UTC−5, sin horario de verano desde
 * 1993, así que la conversión no se mueve en todo el año). Se escogió esa hora
 * y no otra por tres razones concretas:
 *
 *   · Es antes de la jornada. El aviso está en el teléfono cuando el abogado
 *     abre la oficina, no a media tarde cuando ya repartió el día.
 *   · El día del vencimiento, quedan diez horas hasta las 5:00 p.m., que es
 *     cuando cierra la barandilla virtual. Avisar a las 4 de la tarde de algo
 *     que vence a las 5 es avisar de un término ya perdido.
 *   · No cae de madrugada. Un aviso a las 2 a. m. despierta y se descarta
 *     dormido; el que se descarta no se leyó.
 *
 * ─── IDEMPOTENTE EN LA BASE, NO EN UN `if` ──────────────────────────────────
 *
 * Vercel reintenta lo que falla y una invocación manual puede repetir el día.
 * El envío se ANOTA PRIMERO en `agenda_avisos`, cuya llave primaria es
 * (entrada, hito): la inserción con `ignoreDuplicates` devuelve fila solo a
 * quien ganó, y solo quien recibe fila envía. Leer «¿ya avisé?» y luego
 * escribir dejaría pasar dos ejecuciones simultáneas — el mismo razonamiento
 * por el que acreditar un pago de Wompi es una sola sentencia y no un `if`.
 *
 * ─── TODO CON `await` ANTES DE RESPONDER ────────────────────────────────────
 *
 * Una función serverless se congela al enviar la respuesta. Nada de esto puede
 * quedar «en segundo plano»: en producción equivaldría a no hacerlo. Ya pasó
 * con el borrado del audio de las audiencias, que vivía en un `finally`.
 */

/** Ventana que se lee: nada que venza a más de cinco días necesita aviso hoy. */
const DIAS_DE_VENTANA = 5;

/** Cuántas entradas mira una pasada. Una función serverless tiene su propio reloj. */
const MAX_ENTRADAS = 500;

/**
 * El día de hoy en Colombia, calculado EN EL SERVIDOR.
 *
 * Vercel corre en UTC, así que entre las 19:00 y las 24:00 de Colombia el
 * servidor ya está en el día siguiente. Un aviso «vence hoy» calculado en UTC
 * saldría un día antes de tiempo la mitad del año y el hito de cero nunca
 * coincidiría con el vencimiento real.
 */
export const hoyEnColombia = (ahora: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(ahora);

const sumarDias = (fecha: string, dias: number): string =>
  new Date(Date.parse(`${fecha}T00:00:00Z`) + dias * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export interface ResumenDeLaPasada {
  fecha: string;
  entradasRevisadas: number;
  avisosEnviados: number;
  avisosOmitidosPorRepetidos: number;
  destinatarios: number;
}

interface FilaVigilada {
  id: string;
  firm_id: string;
  asunto: string;
  actuacion_nombre: string;
  fecha_limite: string;
  estado: EstadoDeEntrada;
  responsable: string | null;
  agenda_avisos?: Array<{ hito: number }> | null;
}

/**
 * Recorre TODAS las firmas. Corre con la llave de servicio, así que RLS no se
 * interpone; el aislamiento aquí lo da que cada aviso se manda a los
 * navegadores de la firma dueña de su entrada y de ninguna otra.
 */
export const correrAvisosDelDia = async (ahora: Date = new Date()): Promise<ResumenDeLaPasada> => {
  if (!supabase) {
    throw new AgendaError('DATABASE_UNAVAILABLE', 'La base de datos no está configurada.', 503);
  }
  const client = supabase;
  const hoy = hoyEnColombia(ahora);

  const { data, error } = await client
    .from('agenda_terminos')
    .select('id, firm_id, asunto, actuacion_nombre, fecha_limite, estado, responsable, agenda_avisos(hito)')
    .eq('estado', 'PENDIENTE')
    .gte('fecha_limite', hoy)
    .lte('fecha_limite', sumarDias(hoy, DIAS_DE_VENTANA))
    .order('fecha_limite', { ascending: true })
    .limit(MAX_ENTRADAS);

  if (error) throw new AgendaError('AGENDA_SWEEP_FAILED', error.message, 500);

  const filas = (data ?? []) as unknown as FilaVigilada[];
  const vigiladas: EntradaVigilada[] = filas.map((f) => ({
    id: f.id,
    firmId: f.firm_id,
    asunto: f.asunto,
    actuacionNombre: f.actuacion_nombre,
    fechaLimite: f.fecha_limite,
    estado: f.estado,
    responsable: f.responsable,
    avisosEnviados: (f.agenda_avisos ?? []).map((a) => a.hito as HitoDeAviso)
  }));

  const resumen: ResumenDeLaPasada = {
    fecha: hoy,
    entradasRevisadas: vigiladas.length,
    avisosEnviados: 0,
    avisosOmitidosPorRepetidos: 0,
    destinatarios: 0
  };

  for (const entrada of vigiladas) {
    const aviso = avisoQueCorresponde(entrada, hoy);
    if (!aviso) continue;

    /*
     * LA ANOTACIÓN VA PRIMERO, y esa inversión es deliberada. Si se enviara
     * antes de anotar, un fallo al escribir dejaría el aviso enviado y sin
     * rastro, y mañana saldría otra vez. Anotar primero puede, en el peor caso,
     * perder un aviso si el envío falla justo después — y perder un aviso es
     * menos grave que enseñarle al abogado que estos avisos se repiten.
     */
    const { data: anotado, error: errorAnotacion } = await client
      .from('agenda_avisos')
      .upsert(
        { entrada_id: entrada.id, hito: aviso.hito, enviado_el: new Date().toISOString() },
        { onConflict: 'entrada_id,hito', ignoreDuplicates: true }
      )
      .select('entrada_id');

    if (errorAnotacion) {
      console.error('[AGENDA] No se pudo anotar el aviso:', entrada.id, errorAnotacion.message);
      continue;
    }

    if (!anotado || anotado.length === 0) {
      resumen.avisosOmitidosPorRepetidos += 1;
      continue;
    }

    const { title, body } = textoDelAviso(aviso);
    const cuerpo = {
      title,
      body,
      url: '/?ir=agenda',
      /* Dos avisos de la misma entrada se reemplazan en la bandeja en vez de apilarse. */
      tag: `agenda-${entrada.id}`
    };

    /*
     * EL AVISO VA A TODA LA FIRMA, SALVO QUE LA ENTRADA TENGA RESPONSABLE.
     * Sin responsable el término es de la casa y cualquiera puede atenderlo;
     * con responsable, mandarlo a los demás es ruido, y el ruido se ignora.
     * No se excluye a nadie por «haber actuado»: aquí no hay actor, hay reloj.
     */
    const enviado = entrada.responsable
      ? await enviarAUsuario({ firmId: entrada.firmId, userEmail: entrada.responsable, aviso: cuerpo })
      : await enviarAFirma({ firmId: entrada.firmId, aviso: cuerpo });

    resumen.avisosEnviados += 1;
    resumen.destinatarios += enviado.enviados;

    await client
      .from('agenda_avisos')
      .update({ destinatarios: enviado.enviados })
      .eq('entrada_id', entrada.id)
      .eq('hito', aviso.hito);
  }

  return resumen;
};
