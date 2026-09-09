import type { EstadoDeEntrada, HitoDeAviso } from './types';

/**
 * A QUIÉN Y CUÁNDO SE AVISA. Decisión pura, sin base de datos y sin red.
 *
 * ─── UNA SOLA EJECUCIÓN AL DÍA, Y ESO MANDA EN EL DISEÑO ────────────────────
 *
 * El plan Hobby de Vercel permite UN trabajo programado al día. No hay forma de
 * despertar el servidor «cinco días antes a las siete»: hay una pasada diaria y
 * lo que no salga en ella se pierde hasta la siguiente. Por eso esta función no
 * pregunta «¿es hoy el día del aviso de cinco?» sino «¿cuál es el aviso más
 * urgente que a esta entrada todavía le falta?».
 *
 * La diferencia importa el día que la pasada no corre. Con la pregunta
 * ingenua, una entrada a la que le faltaban cinco días el martes —y la pasada
 * del martes falló— nunca recibiría el aviso de cinco: el miércoles ya le
 * faltan cuatro y ningún hito coincide. Aquí se elige el hito MÁS PEQUEÑO que
 * todavía cubre los días que faltan, así que el miércoles sale el de cinco,
 * tarde pero salido. Un aviso tardío es una molestia; un aviso que nunca sale
 * es un término perdido.
 *
 * ─── NO REPETIR NO SE DECIDE AQUÍ ───────────────────────────────────────────
 *
 * Esta función dice qué aviso CORRESPONDE. Que no salga dos veces lo impone la
 * base con la llave primaria de `agenda_avisos`: el envío se anota antes de
 * enviarse y quien pierde la carrera no envía. Un `if` sobre una lista leída
 * antes dejaría pasar dos ejecuciones simultáneas, que es exactamente lo que
 * una plataforma que reintenta produce.
 */

/** Cinco días antes, dos días antes y el día del vencimiento. De mayor a menor. */
export const HITOS: readonly HitoDeAviso[] = [5, 2, 0] as const;

export interface EntradaVigilada {
  id: string;
  firmId: string;
  asunto: string;
  actuacionNombre: string;
  /** AAAA-MM-DD. */
  fechaLimite: string;
  estado: EstadoDeEntrada;
  /** Correo de la persona a cargo; null significa «de la firma». */
  responsable: string | null;
  /** Los hitos ya anotados en la base para esta entrada. */
  avisosEnviados: readonly HitoDeAviso[];
}

export interface AvisoQueCorresponde {
  entrada: EntradaVigilada;
  hito: HitoDeAviso;
  /** Días de calendario que faltan; puede no coincidir con el hito si una pasada falló. */
  faltan: number;
}

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * Días de calendario entre hoy y la fecha límite. Negativo cuando ya pasó.
 *
 * TODO EN UTC, y no es preferencia de estilo. `new Date('2026-09-24')` es
 * medianoche UTC; mezclarlo con una fecha construida en hora local hace que las
 * dos mitades de la resta hablen de días distintos en Colombia (UTC−5), y el
 * error se ve como un aviso que sale un día tarde — el peor día para salir
 * tarde. El mismo defecto ya apareció en el contador de términos.
 */
export const diasQueFaltan = (fechaLimite: string, hoy: string): number => {
  const fin = Date.parse(`${fechaLimite}T00:00:00Z`);
  const inicio = Date.parse(`${hoy}T00:00:00Z`);
  if (Number.isNaN(fin) || Number.isNaN(inicio)) {
    throw new Error('Las fechas deben tener el formato AAAA-MM-DD.');
  }
  return Math.round((fin - inicio) / DIA_MS);
};

/**
 * El aviso que corresponde hoy a una entrada, o `null` si ninguno.
 *
 * · Solo lo PENDIENTE. Lo cumplido y lo archivado no se avisa: recordarle a un
 *   abogado un término que ya contestó le enseña a ignorar el siguiente.
 * · Nada de lo ya VENCIDO. El día del vencimiento se avisa; al día siguiente ya
 *   no hay nada que anunciar y sí un rastro que atender en la pantalla.
 * · Nada de lo que falta más de cinco días.
 * · Nada que ya se haya avisado con ese hito.
 */
export const avisoQueCorresponde = (
  entrada: EntradaVigilada,
  hoy: string
): AvisoQueCorresponde | null => {
  if (entrada.estado !== 'PENDIENTE') return null;

  const faltan = diasQueFaltan(entrada.fechaLimite, hoy);
  if (faltan < 0) return null;

  /*
   * El hito más pequeño que todavía cubre los días que faltan: con 4 días sale
   * el de 5 (la pasada de ayer no corrió), con 1 sale el de 2, con 0 el de 0.
   */
  const candidatos = HITOS.filter((h) => h >= faltan);
  if (candidatos.length === 0) return null;
  const hito = candidatos[candidatos.length - 1];

  if (entrada.avisosEnviados.includes(hito)) return null;

  return { entrada, hito, faltan };
};

export const avisosDelDia = (
  entradas: readonly EntradaVigilada[],
  hoy: string
): AvisoQueCorresponde[] =>
  entradas
    .map((e) => avisoQueCorresponde(e, hoy))
    .filter((a): a is AvisoQueCorresponde => a !== null);

/** Cómo se lee el aviso en la pantalla de bloqueo del teléfono. */
export const textoDelAviso = (aviso: AvisoQueCorresponde): { title: string; body: string } => {
  const { entrada, hito } = aviso;
  const cuando =
    hito === 0
      ? 'Vence hoy'
      : hito === 2
        ? 'Vence en dos días'
        : 'Vence en cinco días';
  return {
    title: `${cuando}: ${entrada.asunto}`,
    body: `${entrada.actuacionNombre} · fecha límite ${entrada.fechaLimite}. Ábralo en la agenda de términos.`
  };
};
