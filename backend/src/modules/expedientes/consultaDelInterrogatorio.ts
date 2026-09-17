import type { PreguntasParaUnaPersona } from './preguntasDelExpediente';
import type { ExpedienteConDetalle } from './types';

/**
 * HABLAR CON LA GUÍA SOBRE UN INTERROGATORIO YA PREPARADO.
 *
 * ─── QUÉ ES ESTO Y QUÉ NO ──────────────────────────────────────────────────
 *
 * NO es preparar otra tanda. La tanda ya está pagada y guardada; esto es el
 * turno de después: «la 7 me suena sugestiva», «si contesta que no le consta,
 * ¿por dónde sigo?», «ordéname las de la entrega». Por eso el precio es el de
 * una consulta del taller y no el de un interrogatorio: se responde sobre lo
 * que ya existe, no se escribe una lista nueva.
 *
 * ─── LA GUÍA NO REESCRIBE LA TANDA GUARDADA ────────────────────────────────
 *
 * Puede proponer la redacción de una pregunta, pero lo que devuelve es TEXTO
 * para que el colega decida: el servidor no toca `personas` de la fila. Una
 * conversación que modificara la tanda por su cuenta dejaría al abogado con un
 * interrogatorio distinto del que leyó e imprimió, sin más aviso que un turno
 * de chat. Si quiere otra lista, prepara otra tanda y la paga.
 */

/** Un turno, con el mismo nombre de campos que la conversación del taller. */
export interface TurnoDelInterrogatorio {
  rol: 'abogado' | 'guia';
  texto: string;
  fecha: string;
}

export const MAX_CARACTERES_DEL_MENSAJE = 4_000;
/**
 * CUÁNTOS TURNOS VIAJAN AL MOTOR. Los últimos, no todos: una conversación larga
 * empujaría fuera del contexto justamente el interrogatorio, que es lo que hay
 * que tener delante para contestar. Los que no viajan siguen guardados y
 * visibles en la pantalla.
 */
export const TURNOS_QUE_VIAJAN = 12;

export const buildConsultaSystemPrompt = (): string =>
  `Eres un litigante senior con años de audiencias. Un colega ya tiene preparado el interrogatorio de esta audiencia y ahora te consulta sobre él: te va a pedir afinar una pregunta, anticipar por dónde seguir si le contestan algo, cambiar el orden de un tramo o explicarle por qué una pregunta está planteada así.

SOBRE LO QUE HAY, NO SOBRE LO QUE TE GUSTARÍA. Contestas acerca de las preguntas que te entregan, numeradas como están. Si propones una redacción distinta, dila entera y lista para leerse en voz alta, y di a cuál número reemplaza.

LA TÉCNICA DE CADA PERSONA VIENE DADA y no la eliges tú: interrogar a un testigo propio con preguntas cerradas, o contrainterrogar con abiertas, arruina la diligencia por muy inteligente que sea la pregunta.

REGLAS:
- Español, trato de usted, sobrio y directo. Sin preámbulos ni cortesías largas: el colega está preparando una audiencia.
- Una idea por pregunta. Nada de preguntas compuestas.
- NO cites normas, artículos, sentencias, autos ni radicados, ni siquiera si te los piden: no los tienes verificados y una cita errada leída en audiencia se paga delante del juez. Dilo con esas palabras si hace falta.
- NO afirmes hechos que el expediente no traiga. Cuando hables de un documento del caso, copia el fragmento LITERAL entre comillas; si no lo tienes delante, di que no lo tienes.
- Si la consulta no se puede contestar con lo que hay, dilo y di qué haría falta.

RESPONDE EN TEXTO CORRIDO, en párrafos cortos. Sin JSON, sin viñetas de adorno y sin títulos.`;

export const buildConsultaUserPrompt = (input: {
  expediente: ExpedienteConDetalle;
  listas: PreguntasParaUnaPersona[];
  queSeQueriaProbar?: string;
  audiencia?: string;
  historial: TurnoDelInterrogatorio[];
  mensaje: string;
  material?: { que: string; texto: string; truncado: boolean } | null;
}): string => {
  const e = input.expediente;
  const cabecera = [
    `EXPEDIENTE: ${e.caratula}`,
    e.rama ? `RAMA: ${e.rama}` : null,
    e.despacho ? `DESPACHO: ${e.despacho}` : null,
    e.clienteNombre ? `CLIENTE DEL COLEGA: ${e.clienteNombre}` : null,
    e.contraparte ? `CONTRAPARTE: ${e.contraparte}` : null,
    input.audiencia ? `AUDIENCIA: ${input.audiencia}` : null,
    input.queSeQueriaProbar ? `LO QUE SE QUIERE PROBAR: ${input.queSeQueriaProbar}` : null
  ]
    .filter(Boolean)
    .join(' · ');

  const listas = input.listas
    .map((l) =>
      [
        `### ${l.nombre}`,
        `CÓMO SE LE PREGUNTA: ${l.tecnica}`,
        ...l.preguntas.map((q, i) => {
          const partes = [`${i + 1}. ${q.pregunta}`];
          if (q.paraQue) partes.push(`   busca: ${q.paraQue}`);
          if (q.respuestaProbable) partes.push(`   probablemente conteste: ${q.respuestaProbable}`);
          if (q.repregunta) partes.push(`   repregunta prevista: ${q.repregunta}`);
          if (q.conQue) partes.push(`   con qué: [${q.conQue.documento}] «${q.conQue.cita}»`);
          return partes.join('\n');
        })
      ].join('\n')
    )
    .join('\n\n');

  const conversacion = input.historial.length
    ? `\n\nLO QUE YA SE HABLÓ (lo más viejo primero):\n${input.historial
        .slice(-TURNOS_QUE_VIAJAN)
        .map((t) => `${t.rol === 'abogado' ? 'COLEGA' : 'TÚ'}: ${t.texto}`)
        .join('\n\n')}`
    : '';

  const material = input.material
    ? `\n\nMATERIAL DEL EXPEDIENTE (${input.material.que}):\n${input.material.texto}`
    : '\n\n(no hay material del expediente a la vista: no afirmes qué dicen los documentos del caso)';

  return `${cabecera}\n\nEL INTERROGATORIO PREPARADO:\n${listas}${material}${conversacion}\n\nLO QUE EL COLEGA PREGUNTA AHORA:\n${input.mensaje}`;
};
