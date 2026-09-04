import { fetchOfficialRuling } from '../../jurisprudence/officialRuling.service';

/**
 * Verificación de providencias ANTES de que la guía responda.
 *
 * El caso que la motiva: la guía dijo que una sentencia no existía, el abogado
 * la buscó por su cuenta, la encontró en la relatoría y volvió al chat a
 * corregirla. Sin esto, la guía solo podía discutir de memoria contra memoria,
 * que es exactamente la disputa que el producto existe para evitar. Ahora, cada
 * sentencia de la Corte Constitucional que el abogado nombra en su mensaje o
 * en sus comentarios se consulta en el índice oficial de la Corte y el
 * resultado viaja en el prompt, donde manda sobre lo que el modelo recuerde.
 *
 * Solo la Corte Constitucional: es la única corporación con índice consultable
 * por cita. Las demás se declaran «no verificable aquí» y la guía debe decirlo.
 */

export type EstadoDeProvidencia = 'EXISTE' | 'NO_ESTA_EN_EL_INDICE' | 'NO_VERIFICABLE';

export interface ProvidenciaVerificada {
  cita: string;
  estado: EstadoDeProvidencia;
  /** Qué se encontró o por qué no se pudo saber, en una frase para la guía. */
  detalle: string;
  url?: string;
  /** Primeras líneas del texto oficial, para que la guía lea lo que dice y no lo que recuerda. */
  extracto?: string;
}

/** Cuántas citas se consultan por turno: el índice oficial responde en segundos y el turno tiene un límite. */
export const MAX_CITAS_POR_TURNO = 4;
const EXTRACTO_CARACTERES = 900;

/** Patrón de una cita constitucional escrita como la escribe un abogado: tipo, número y año, con «de», «/» o guion. */
const PATRON_CITA = /\b(SU|C|T|A)\s*[-.]?\s*(\d{1,4})\s*(?:de|del|\/|-)\s*(\d{4}|\d{2})\b/gi;

const normalizarAnio = (anio: string): string => {
  if (anio.length === 4) return anio;
  const n = Number(anio);
  return n > 91 ? `19${anio}` : `20${anio}`;
};

/** Las citas constitucionales de un texto, sin repetir y en el orden en que aparecen. */
export const citasEnTexto = (texto: string): string[] => {
  const vistas = new Set<string>();
  const salida: string[] = [];
  for (const m of texto.matchAll(PATRON_CITA)) {
    const tipo = m[1].toUpperCase();
    if (tipo === 'A') continue; // los autos no están en el índice de sentencias; se omiten en vez de negarse
    const cita = `${tipo}-${Number(m[2])}/${normalizarAnio(m[3])}`;
    if (vistas.has(cita)) continue;
    vistas.add(cita);
    salida.push(cita);
  }
  return salida;
};

const conTope = <T>(promesa: Promise<T>, ms: number, siTarda: T): Promise<T> =>
  new Promise((resolve) => {
    const t = setTimeout(() => resolve(siTarda), ms);
    promesa.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      () => {
        clearTimeout(t);
        resolve(siTarda);
      }
    );
  });

/**
 * Consulta en el índice oficial cada cita que aparezca en los textos dados
 * (el mensaje del abogado y sus comentarios; no el escrito entero, que puede
 * traer decenas). Nunca lanza: lo que no se pudo consultar vuelve como
 * NO_VERIFICABLE, que la guía debe decir tal cual.
 */
export const verificarProvidencias = async (textos: string[], limiteMs = 12_000): Promise<ProvidenciaVerificada[]> => {
  const citas = citasEnTexto(textos.join('\n')).slice(0, MAX_CITAS_POR_TURNO);
  if (!citas.length) return [];
  const noVerificable = (cita: string): ProvidenciaVerificada => ({
    cita,
    estado: 'NO_VERIFICABLE',
    detalle: 'El índice oficial de la Corte Constitucional no respondió a tiempo; no se sabe si existe o no.'
  });
  return Promise.all(
    citas.map((cita) =>
      conTope(
        fetchOfficialRuling(cita).then((r): ProvidenciaVerificada => {
          if (r.status === 'FOUND') {
            const { ruling } = r;
            return {
              cita,
              estado: 'EXISTE',
              detalle: [ruling.tipo, ruling.fecha, ruling.magistrado ? `M.P. ${ruling.magistrado}` : '', ruling.sala].filter(Boolean).join(' · '),
              url: ruling.sourceUrl,
              extracto: (ruling.text ?? '').replace(/\s+/g, ' ').trim().slice(0, EXTRACTO_CARACTERES)
            };
          }
          if (r.status === 'DOES_NOT_EXIST') {
            return { cita, estado: 'NO_ESTA_EN_EL_INDICE', detalle: r.reason };
          }
          return { cita, estado: 'NO_VERIFICABLE', detalle: r.reason };
        }),
        limiteMs,
        noVerificable(cita)
      )
    )
  );
};

/** El bloque del prompt. Vacío si no hubo citas, para no gastar tokens en decir que no hubo nada. */
export const renderVerificaciones = (verificaciones: ProvidenciaVerificada[]): string => {
  if (!verificaciones.length) return '';
  const lineas = verificaciones.map((v) => {
    if (v.estado === 'EXISTE') {
      return `- ${v.cita}: EXISTE en el índice oficial de la Corte Constitucional — ${v.detalle}. Fuente: ${v.url ?? 'relatoría'}.${v.extracto ? ` Extracto oficial: «${v.extracto}»` : ''}`;
    }
    if (v.estado === 'NO_ESTA_EN_EL_INDICE') {
      return `- ${v.cita}: NO ESTÁ en el índice oficial de la Corte Constitucional (${v.detalle}).`;
    }
    return `- ${v.cita}: NO SE PUDO VERIFICAR (${v.detalle}).`;
  });
  return `VERIFICACIÓN DE PROVIDENCIAS (consultadas ahora mismo en el índice oficial de la Corte Constitucional; este resultado manda sobre tu memoria):\n${lineas.join('\n')}`;
};
