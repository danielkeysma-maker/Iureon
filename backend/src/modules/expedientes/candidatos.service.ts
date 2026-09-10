import { supabase } from '../../config/supabase.config';
import { ExpedienteError } from './expedientes.service';
import type { TipoDePieza } from './types';

/**
 * LO QUE LA FIRMA YA TIENE Y SE PUEDE TRAER A UN EXPEDIENTE.
 *
 * ─── POR QUÉ SE TIRA DESDE EL EXPEDIENTE Y NO SE EMPUJA DESDE CADA PANTALLA ─
 *
 * El gesto natural parecía ser el contrario: un botón «atar a un expediente»
 * en Entrevistas, en Revisiones, en Borradores y en la Agenda. Se descartó por
 * dos razones, y la segunda pesa más que la primera.
 *
 * La barata: esas cuatro listas seleccionan columnas EXPLÍCITAS —ninguna trae
 * `expediente_id`— así que el botón obligaría a tocar cuatro módulos, sus
 * tipos de fila, sus mapeadores y sus espejos del frontend, para un vínculo
 * que casi nunca se pone desde ahí.
 *
 * La de fondo: un abogado no ata piezas sueltas mientras navega listas. Abre
 * el asunto en el que va a trabajar y trae lo suyo. Poner el gesto donde está
 * la carpeta es poner el gesto donde está la intención.
 *
 * ─── SE MUESTRA LO QUE ESTÁ LIBRE Y LO QUE YA ES DE OTRO ───────────────────
 *
 * Esconder lo ya atado dejaría al abogado buscando una entrevista que existe y
 * no aparece, sin saber por qué. Se muestra, se dice de qué expediente es, y
 * se puede mover: cambiar de carpeta es una corrección legítima y frecuente.
 */

const db = () => {
  if (!supabase) throw new ExpedienteError('NO_DB', 'La base de datos no está configurada.', 503);
  return supabase;
};

export interface Candidato {
  tipo: TipoDePieza;
  id: string;
  /** Lo que el abogado lee para reconocerla. */
  titulo: string;
  /** Fecha, ya formateada por quien la guardó (ISO). */
  cuando: string;
  /** A qué expediente pertenece hoy. `null` si está libre. */
  expedienteId: string | null;
}

/**
 * Cuántas se ofrecen por tipo.
 *
 * Es una lista para reconocer algo que se hizo hace poco, no un archivo
 * histórico: quien busca una entrevista de hace ocho meses la encuentra por su
 * pantalla, no aquí. Un tope alto convertiría este panel en un segundo
 * listado de todo, cinco veces.
 */
const POR_TIPO = 25;

const recortar = (texto: string | null | undefined, largo = 90): string => {
  const t = (texto ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return '(sin título)';
  return t.length > largo ? `${t.slice(0, largo)}…` : t;
};

/**
 * Las piezas de la firma que se pueden traer a un expediente.
 *
 * Cinco consultas y no una por pieza: cada tabla se lee entera una vez, con
 * columnas explícitas y tope. Traer los cuerpos —el informe de una revisión,
 * el texto de un borrador, los hechos de una orientación— haría de este
 * endpoint el más pesado del producto para pintar una lista de rótulos.
 */
export const candidatosDeLaFirma = async (firmId: string): Promise<Candidato[]> => {
  const [transcritos, revisiones, borradores, terminos, orientaciones] = await Promise.all([
    db()
      .from('transcriptions')
      .select('id, title, kind, transcribed_at, expediente_id')
      .eq('firm_id', firmId)
      .order('transcribed_at', { ascending: false })
      .limit(POR_TIPO),
    db()
      .from('document_reviews')
      .select('id, document_type, file_name, created_at, expediente_id')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .limit(POR_TIPO),
    db()
      .from('saved_drafts')
      .select('id, title, document_type, saved_at, expediente_id')
      .eq('firm_id', firmId)
      .order('saved_at', { ascending: false })
      .limit(POR_TIPO),
    db()
      .from('agenda_terminos')
      .select('id, asunto, fecha_limite, expediente_id')
      .eq('firm_id', firmId)
      .order('fecha_limite', { ascending: false })
      .limit(POR_TIPO),
    db()
      .from('orientaciones')
      .select('id, hechos, created_at, expediente_id')
      .eq('firm_id', firmId)
      .order('created_at', { ascending: false })
      .limit(POR_TIPO)
  ]);

  const out: Candidato[] = [];

  for (const r of (transcritos.data ?? []) as Array<Record<string, unknown>>) {
    out.push({
      /*
       * ENTREVISTA Y AUDIENCIA SON LA MISMA TABLA —es una decisión vieja y
       * buena: una entrevista es una transcripción con un cliente detrás— así
       * que el tipo que viaja es `transcripcion` y lo que distingue es el
       * rótulo. El servidor no necesita saber cuál es para atarla.
       */
      tipo: 'transcripcion',
      id: String(r.id),
      titulo: `${r.kind === 'ENTREVISTA' ? 'Entrevista' : 'Audiencia'} · ${recortar(r.title as string)}`,
      cuando: String(r.transcribed_at ?? ''),
      expedienteId: (r.expediente_id as string | null) ?? null
    });
  }

  for (const r of (revisiones.data ?? []) as Array<Record<string, unknown>>) {
    out.push({
      tipo: 'revision',
      id: String(r.id),
      titulo: `Revisión · ${recortar(r.document_type as string, 40)} — ${recortar(r.file_name as string, 40)}`,
      cuando: String(r.created_at ?? ''),
      expedienteId: (r.expediente_id as string | null) ?? null
    });
  }

  for (const r of (borradores.data ?? []) as Array<Record<string, unknown>>) {
    out.push({
      tipo: 'borrador',
      id: String(r.id),
      titulo: `Borrador · ${recortar((r.title as string) || (r.document_type as string))}`,
      cuando: String(r.saved_at ?? ''),
      expedienteId: (r.expediente_id as string | null) ?? null
    });
  }

  for (const r of (terminos.data ?? []) as Array<Record<string, unknown>>) {
    out.push({
      tipo: 'termino',
      id: String(r.id),
      titulo: `Término · ${recortar(r.asunto as string)} (vence ${String(r.fecha_limite ?? '')})`,
      cuando: String(r.fecha_limite ?? ''),
      expedienteId: (r.expediente_id as string | null) ?? null
    });
  }

  for (const r of (orientaciones.data ?? []) as Array<Record<string, unknown>>) {
    out.push({
      tipo: 'orientacion',
      id: String(r.id),
      /*
       * De la orientación solo se muestra el arranque de los hechos, que es lo
       * único con lo que se reconoce: no tiene título. Recortado, porque un
       * relato entero en una lista de rótulos no se lee.
       */
      titulo: `Orientación · ${recortar(r.hechos as string)}`,
      cuando: String(r.created_at ?? ''),
      expedienteId: (r.expediente_id as string | null) ?? null
    });
  }

  /* Lo más reciente primero, mezclando los cinco tipos: así se busca. */
  return out.sort((a, b) => (a.cuando < b.cuando ? 1 : a.cuando > b.cuando ? -1 : 0));
};
