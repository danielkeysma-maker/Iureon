/**
 * El taller de revisión: la conversación con el revisor sobre un escrito que
 * el abogado está corrigiendo. La mitad pura.
 *
 * ─── QUÉ ES ─────────────────────────────────────────────────────────────────
 *
 * Después del informe, el abogado edita el escrito y sigue hablando con el
 * revisor: «reescribe la pretensión tercera como subsidiaria», «¿así queda
 * bien el juramento?», «qué le falta ahora». Cada turno lleva el texto ACTUAL
 * del escrito —el que el abogado tiene en pantalla, con sus cambios—, el
 * informe original y los últimos turnos, para que el revisor conteste sobre
 * lo que hay y no sobre lo que había.
 *
 * ─── EDICIONES APLICABLES, NO SOLO PROSA ────────────────────────────────────
 *
 * Cuando la respuesta propone cambiar un pasaje, lo devuelve también como
 * edición estructurada: cita LITERAL del texto actual y reemplazo. La
 * pantalla las ofrece con un botón «Aplicar», y el abogado decide una a una.
 * El revisor nunca modifica el texto por su cuenta.
 *
 * Mismas reglas que el informe: nada de providencias inventadas; lo que exige
 * la norma sale de la ficha; el resto es criterio y se dice.
 */
import type { InformeDeRevision } from './documentReview';
import { renderVerificaciones, type ProvidenciaVerificada } from './verificarProvidencias';

export interface TurnoDelTaller {
  rol: 'abogado' | 'revisor';
  texto: string;
  /** Solo en turnos del revisor: ediciones que la pantalla puede aplicar. */
  ediciones?: EdicionPropuesta[];
  /** Solo en turnos del revisor: pasajes del texto de los que habla. */
  referencias?: string[];
  fecha: string;
}

export interface EdicionPropuesta {
  /** Palabras exactas del texto actual, para localizarlas. */
  cita: string;
  reemplazo: string;
}

/** Un resaltado o tachado del abogado, anclado al texto citado. */
export interface AnotacionDelAbogado {
  cita: string;
  /** amarillo | verde | azul | rosa | tachado | comentario */
  color: string;
  /** Solo en comentarios: lo que el abogado escribió sobre ese pasaje. */
  nota?: string;
}

export interface RespuestaDelTaller {
  respuesta: string;
  ediciones: EdicionPropuesta[];
  /** Pasajes del texto a los que la respuesta se refiere, para resaltarlos. */
  referencias: string[];
}

/** Turnos que viajan al modelo. Los más viejos se resumen en una línea; el texto actual siempre va completo. */
export const MAX_TURNOS_EN_CONTEXTO = 12;
/** Un turno del abogado más largo que esto es un escrito pegado por error, no una pregunta. */
export const MAX_CARACTERES_MENSAJE = 4_000;

export const buildTallerSystemPrompt = (): string => `Eres el mismo revisor senior que emitió el informe sobre este escrito, y ahora acompañas al abogado mientras lo corrige. Contestas sobre el TEXTO ACTUAL del escrito, que te llega completo en cada turno con los cambios que el abogado ya hizo; no sobre la versión anterior.

QUÉ HACES: responder lo que te pregunten con criterio profesional franco; cuando te pidan redactar o reformular un pasaje, lo redactas concreto y listo para pegar; cuando te pregunten «cómo va», dices qué mejoró, qué sigue fallando y qué falta, sin repetir hallazgos ya corregidos.

LAS MARCAS DEL ABOGADO: si el mensaje trae «MARCAS DEL ABOGADO», son pasajes que él resaltó a mano en un color o tachó. Cuando te hable de «lo amarillo», «lo que resalté en verde», «lo tachado», se refiere a esos pasajes exactos: úsalos como el objeto de la pregunta. Si tachó algo, entiende que propone quitarlo salvo que diga otra cosa.

LA VERIFICACIÓN DE PROVIDENCIAS: cuando el abogado nombra una sentencia de la Corte Constitucional en su mensaje o en un comentario, el sistema la consulta en el índice oficial de la Corte antes de que respondas y te trae el resultado en «VERIFICACIÓN DE PROVIDENCIAS». Ese resultado manda sobre tu memoria. Si dice EXISTE y tú habías dicho que no existía o dudaste de ella, reconoce el error sin rodeos, cita la fuente y corrige lo que dijiste leyendo el extracto oficial, no lo que recuerdes. Si dice NO ESTÁ en el índice, dilo con esas palabras y con la fuente, sin acusar al abogado de otra cosa: puede ser un error de número o de año, y conviene sugerirle que lo revise. Si dice NO SE PUDO VERIFICAR, dilo y no la des por existente ni por inexistente. Las providencias de otras corporaciones (Corte Suprema, Consejo de Estado, tribunales) no se verifican aquí: dilo y pide la fuente o el radicado en vez de afirmar o negar su existencia.

LOS COMENTARIOS DEL ABOGADO: si el mensaje trae «COMENTARIOS DEL ABOGADO», son notas que él dejó sobre pasajes concretos —observaciones, dudas, correcciones a lo que tú dijiste—. Léelos antes de responder y, cuando te pregunte por «mi comentario» o «lo que anoté», responde a esa nota sobre ese pasaje. Si un comentario te corrige (por ejemplo, que una norma o un criterio no es como dijiste), acéptalo si tiene razón y ajusta tu respuesta; si crees que no la tiene, explica por qué con la norma en la mano, sin inventar providencias.

QUÉ NO HACES: no reescribes el escrito entero salvo que te lo pidan expresamente; no inventas hechos que el escrito no traiga; NO citas sentencias, autos ni providencias ni radicados —si un punto necesita precedente, dilo y describe qué debería sostener—; no contradigas la ficha verificada de la actuación ni le añadas requisitos que no estén en ella.

RESPONDE ÚNICAMENTE CON UN OBJETO JSON, sin texto antes ni después:
{
  "respuesta": "tu respuesta al abogado, en prosa clara; puedes usar saltos de línea",
  "ediciones": [{"cita": "pasaje LITERAL del texto actual que propones cambiar (5 a 60 palabras, tal cual está)", "reemplazo": "el texto nuevo, listo para pegar"}],
  "referencias": ["pasaje LITERAL del texto actual al que tu respuesta se refiere, para que la pantalla lo resalte; 3 a 40 palabras cada uno"]
}
"referencias" son los lugares del texto de los que hablas en la respuesta —el párrafo que comentas, la frase que elogias, la sección que falta si existe un encabezado—, copiados exactos; máximo seis; vacío si tu respuesta no se refiere a ningún pasaje concreto. "ediciones" va vacío si no propones cambiar ningún pasaje concreto. La cita debe copiarse exacta del texto actual para que se pueda localizar; si el pasaje no existe todavía (por ejemplo una sección que falta), no lo pongas como edición: descríbelo en la respuesta y ofrece la redacción ahí. Máximo cuatro ediciones por turno. Español jurídico colombiano, neutro y preciso.`;

const resumirInforme = (i: InformeDeRevision): string =>
  [
    `Juicio global: ${i.resumen}`,
    i.seccionesFaltantes.length ? `Secciones que la norma exige y faltaban: ${i.seccionesFaltantes.join(' | ')}` : '',
    i.debilidades.length ? `Debilidades señaladas: ${i.debilidades.join(' | ')}` : '',
    i.erroresDeAplicacion.length
      ? `Errores de aplicación: ${i.erroresDeAplicacion.map((e) => `${e.donde}: ${e.problema}`).join(' | ')}`
      : '',
    (i.correccionesTextuales ?? []).length
      ? `Pasajes que se propuso reemplazar: ${(i.correccionesTextuales ?? []).map((c) => `«${c.cita}»`).join(' | ')}`
      : ''
  ]
    .filter(Boolean)
    .join('\n');

/** Los últimos turnos, tal cual; los anteriores, una línea que dice que hubo más. */
export const recortarHistorial = (turnos: TurnoDelTaller[], max = MAX_TURNOS_EN_CONTEXTO): TurnoDelTaller[] =>
  turnos.length <= max ? turnos : turnos.slice(turnos.length - max);

export const buildTallerUserPrompt = (input: {
  documentType: string;
  guidance: string | null;
  informe: InformeDeRevision | null;
  textoActual: string;
  historial: TurnoDelTaller[];
  mensaje: string;
  /** Resaltados y tachados del abogado, para que «lo amarillo» signifique algo. */
  anotaciones?: AnotacionDelAbogado[];
  /** Sentencias que el abogado nombró, ya consultadas en el índice oficial. */
  verificaciones?: ProvidenciaVerificada[];
}): string => {
  const ficha = input.guidance
    ? `FICHA VERIFICADA DE LA ACTUACIÓN:\n${input.guidance}`
    : 'La actuación no está catalogada: no hay ficha verificada; lo objetivo, solo con artículo exacto.';
  const informe = input.informe ? `INFORME ORIGINAL (resumen):\n${resumirInforme(input.informe)}` : 'No hay informe previo estructurado.';
  const historial = recortarHistorial(input.historial);
  const omitidos = input.historial.length - historial.length;
  const conversacion = historial.length
    ? `CONVERSACIÓN PREVIA${omitidos > 0 ? ` (se omiten ${omitidos} turnos más antiguos)` : ''}:\n${historial
        .map((t) => `${t.rol === 'abogado' ? 'ABOGADO' : 'REVISOR'}: ${t.texto}`)
        .join('\n')}`
    : 'Es el primer mensaje después del informe.';

  const NOMBRES: Record<string, string> = { amarillo: 'AMARILLO', verde: 'VERDE', azul: 'AZUL', rosa: 'ROSA', tachado: 'TACHADO por el abogado' };
  const anotaciones = (input.anotaciones ?? []).filter((a) => a.cita && NOMBRES[a.color]);
  const marcas = anotaciones.length
    ? `MARCAS DEL ABOGADO (resaltados y tachados hechos a mano sobre el texto actual):\n${anotaciones
        .map((a) => `- ${NOMBRES[a.color]}: «${a.cita}»`)
        .join('\n')}`
    : 'El abogado no ha resaltado ni tachado nada a mano.';
  const comentarios = (input.anotaciones ?? []).filter((a) => a.color === 'comentario' && a.cita && (a.nota ?? '').trim());
  const verificacion = renderVerificaciones(input.verificaciones ?? []);
  const notas = comentarios.length
    ? `COMENTARIOS DEL ABOGADO (notas sobre pasajes concretos):\n${comentarios.map((c) => `- Sobre «${c.cita}»: ${(c.nota ?? '').trim()}`).join('\n')}`
    : 'El abogado no ha dejado comentarios sobre pasajes.';

  return `ACTUACIÓN: "${input.documentType}".

${ficha}

${informe}

${conversacion}

${marcas}

${notas}${verificacion ? `\n\n${verificacion}` : ''}

TEXTO ACTUAL DEL ESCRITO (con los cambios que el abogado ya hizo):
"""
${input.textoActual}
"""

MENSAJE DEL ABOGADO: ${input.mensaje.trim()}`;
};

const cadena = (v: unknown): string => (v === null || v === undefined ? '' : String(v)).trim();

/**
 * La respuesta del modelo. Si no vino como JSON legible, la prosa se entrega
 * tal cual y sin ediciones: una respuesta sin botón «Aplicar» sigue siendo una
 * respuesta; una respuesta perdida no.
 */
export const parsearRespuestaDelTaller = (crudo: string): RespuestaDelTaller => {
  const sinCerca = crudo.replace(/```(?:json)?/gi, '').trim();
  const inicio = sinCerca.indexOf('{');
  const fin = sinCerca.lastIndexOf('}');
  if (inicio !== -1 && fin > inicio) {
    try {
      const o = JSON.parse(sinCerca.slice(inicio, fin + 1)) as Record<string, unknown>;
      const ediciones = Array.isArray(o.ediciones)
        ? (o.ediciones as unknown[])
            .map((e) => {
              const x = (e ?? {}) as Record<string, unknown>;
              return { cita: cadena(x.cita), reemplazo: cadena(x.reemplazo) };
            })
            .filter((e) => e.cita && e.reemplazo)
        : [];
      const referencias = Array.isArray(o.referencias) ? (o.referencias as unknown[]).map(cadena).filter((r) => r.length >= 4).slice(0, 6) : [];
      const respuesta = cadena(o.respuesta);
      if (respuesta) return { respuesta, ediciones, referencias };
    } catch {
      /* cae a la prosa */
    }
  }
  return { respuesta: sinCerca, ediciones: [], referencias: [] };
};
