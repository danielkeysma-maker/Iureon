import type { SpeakerRole, TranscriptSegment } from '../transcription/types';

/**
 * Lo que la pantalla de Entrevistas dice con palabras, en funciones puras.
 *
 * ─── POR QUÉ VIVE APARTE DE LOS COMPONENTES ────────────────────────────────
 *
 * La cara nueva reescribió cinco componentes a la vez, y en una reescritura así
 * lo que se pierde no es el color sino una regla: que la autorización va antes
 * de grabar, que una hora que nadie registró no se inventa, que declinar
 * necesita motivo. Escritas aquí se prueban sin navegador
 * (`npm run check:entrevistas-cara`) y el escritorio y el teléfono leen la
 * misma versión — dos copias de una regla se desincronizan sin hacer ruido.
 */

/* ─── Grabar ──────────────────────────────────────────────────────────────── */

export interface PermisoDeGrabar {
  puede: boolean;
  /** Lo que falta, dicho para quien está en la sala. `null` si puede. */
  razon: string | null;
}

/**
 * Si se puede empezar a grabar, y si no, por qué.
 *
 * LA AUTORIZACIÓN SE NOMBRA PRIMERO aunque también falte la firma: es lo que
 * el abogado resuelve en la sala, con la persona enfrente. La firma no se
 * arregla desde esta pantalla, y decirla primero escondería lo que sí puede
 * hacer ahora.
 *
 * EL TELÉFONO EXIGE ADEMÁS EL CLIENTE (`exigeCliente`), porque allí la ficha es
 * la cabecera de la pantalla y el acta imprime su nombre; el escritorio lo deja
 * opcional y se puede atar después desde el detalle.
 */
export const puedeEmpezarAGrabar = (estado: {
  hayFirma: boolean;
  autorizado: boolean;
  exigeCliente?: boolean;
  hayCliente?: boolean;
}): PermisoDeGrabar => {
  if (!estado.autorizado) return { puede: false, razon: 'Primero, la autorización de grabación.' };
  if (!estado.hayFirma) return { puede: false, razon: 'Sin una firma activa no se puede guardar la entrevista.' };
  if (estado.exigeCliente && !estado.hayCliente) return { puede: false, razon: 'Primero, con quién es la entrevista.' };
  return { puede: true, razon: null };
};

const dosCifras = (n: number): string => String(n).padStart(2, '0');

/**
 * El cronómetro, con horas: una entrevista pasa de la hora y «75:12» obliga a
 * hacer la cuenta para saber cuánto lleva.
 */
export const cronometro = (segundos: number): string => {
  const s = Math.max(0, Math.floor(segundos));
  return `${dosCifras(Math.floor(s / 3600))}:${dosCifras(Math.floor((s % 3600) / 60))}:${dosCifras(s % 60)}`;
};

/**
 * La hora local de un instante ISO, o `null`.
 *
 * Se arma con `getHours()` y no con `toLocaleTimeString`, que según el
 * navegador escribe «10:57 a. m.» o «10:57» — y la constancia debe leerse igual
 * en el acta, en la pantalla y en el teléfono. Una hora ilegible o ausente NO
 * se reemplaza por ninguna: sería una constancia inventada.
 */
export const horaEnPalabras = (iso: string | null | undefined): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${dosCifras(d.getHours())}:${dosCifras(d.getMinutes())}`;
};

/** La duración, o `null` cuando el proveedor no la midió. Cero no es «0 min»: es no sabido. */
export const duracionEnPalabras = (segundos: number | null | undefined): string | null => {
  if (!segundos) return null;
  const m = Math.round(segundos / 60);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
};

/* ─── El acta al lado ─────────────────────────────────────────────────────── */

/** «N de T intervenciones», contado de lo que un humano marcó. `null` sin intervenciones. */
export const revisionEnPalabras = (segmentos: readonly TranscriptSegment[]): string | null => {
  if (segmentos.length === 0) return null;
  const n = segmentos.filter((s) => s.revisada).length;
  return `${n} de ${segmentos.length} ${segmentos.length === 1 ? 'intervención' : 'intervenciones'}`;
};

export interface Interviniente {
  voz: string;
  /** El nombre que puso un humano; `null` si nadie lo nombró. */
  nombre: string | null;
  rol: SpeakerRole;
  intervenciones: number;
}

/**
 * Quiénes hablaron, en el orden en que hablaron por primera vez.
 *
 * SALE DE LAS VOCES DEL TRANSCRITO, no de un campo «presentes»: ese campo no
 * existe, y una lista escrita a mano al empezar diría quién iba a hablar, no
 * quién habló. El rol es el primero que no sea DESCONOCIDO, porque la
 * asignación se pega a la voz y basta con que una intervención lo tenga.
 */
export const intervinientes = (segmentos: readonly TranscriptSegment[]): Interviniente[] => {
  const porVoz = new Map<string, Interviniente>();
  for (const s of segmentos) {
    const actual = porVoz.get(s.speakerLabel);
    if (!actual) {
      porVoz.set(s.speakerLabel, {
        voz: s.speakerLabel,
        nombre: s.speakerName?.trim() || null,
        rol: s.role,
        intervenciones: 1
      });
      continue;
    }
    actual.intervenciones += 1;
    if (!actual.nombre && s.speakerName?.trim()) actual.nombre = s.speakerName.trim();
    if (actual.rol === 'DESCONOCIDO' && s.role !== 'DESCONOCIDO') actual.rol = s.role;
  }
  return [...porVoz.values()];
};

/* ─── La decisión ─────────────────────────────────────────────────────────── */

/**
 * Los motivos de declinar, en UNA lista para la lista y para el diálogo.
 *
 * «Otro» ya no es una opción: el cuadro de texto está siempre a la vista
 * (maqueta «¿Por qué declina el caso?») y cumple ese papel sin obligar a elegir
 * primero una casilla que solo abre otro campo.
 */
export const MOTIVOS_DE_DECLINAR = [
  'Fuera de materia',
  'Sin viabilidad',
  'Conflicto de interés',
  'Término vencido',
  'El cliente no volvió'
] as const;

/**
 * El motivo que se guarda. Si hay chip y texto se guardan LOS DOS: el chip
 * agrupa en la lista y el texto dice lo que el chip no alcanza. Sin ninguno no
 * hay motivo, y el servidor rechaza el declinado.
 */
export const motivoDelDeclinado = (chip: string | null, texto: string): string | null => {
  const libre = texto.trim();
  if (chip && libre) return `${chip}. ${libre}`;
  return chip || libre || null;
};

export interface DecisionEnPalabras {
  titulo: string;
  detalle: string | null;
  tono: 'ok' | 'neutro' | 'pendiente';
}

/**
 * La decisión de una fila. Una fila sin el campo es «sin decidir»: las filas
 * anteriores a la columna no traen nada, y leer ausencia como «tomado» cerraría
 * en silencio la espera de alguien.
 */
export const decisionEnPalabras = (fila: {
  decision?: 'SIN_DECIDIR' | 'TOMADO' | 'DECLINADO';
  decision_motivo?: string | null;
  decidido_por?: string | null;
}): DecisionEnPalabras => {
  const quien = fila.decidido_por ? `Por ${fila.decidido_por.split('@')[0]}` : null;
  if (fila.decision === 'TOMADO') return { titulo: 'Caso tomado', detalle: quien, tono: 'ok' };
  if (fila.decision === 'DECLINADO') {
    return { titulo: 'Declinado', detalle: fila.decision_motivo?.trim() || quien, tono: 'neutro' };
  }
  return { titulo: 'Sin decidir', detalle: null, tono: 'pendiente' };
};

/* ─── Jurisprudencia relacionada ──────────────────────────────────────────── */

/**
 * La cercanía de lenguaje en palabras y no en porcentaje: «64 %» se lee como
 * probabilidad de que la providencia aplique, y es solo parecido de texto. El
 * servidor ya descarta lo que queda por debajo de 0,60.
 */
export const cercaniaEnPalabras = (similitud: number): string =>
  similitud >= 0.7 ? 'Muy cercano' : 'Cercano';
