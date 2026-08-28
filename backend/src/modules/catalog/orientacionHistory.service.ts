import { supabase } from '../../config/supabase.config';

/**
 * El historial de orientaciones. Cada consulta guardada vale para la
 * siguiente: la mitad de los casos que entran a una firma se parecen a uno
 * anterior, y la consulta que NO encontro actuacion vale todavia mas — tres
 * iguales sin respuesta son la lista de trabajo exacta del catalogo.
 *
 * Se guardan PUNTEROS al catalogo ({id, nombre}), no copias de la ficha: el
 * termino vigente se resuelve al abrir, y una copia congelada mostraria el
 * termino de hace tres meses como si siguiera vivo.
 */

export interface OrientacionGuardada {
  id: string;
  hechos: string;
  status: 'OK' | 'SIN_COINCIDENCIA';
  senales: { rama: string | null; elementos: string[] } | null;
  sugerencias: Array<{ id: string; nombre: string }>;
  userEmail: string;
  createdAt: string;
}

/** Nunca lanza: el historial es un extra, y la orientacion no puede fallar por el. */
export const guardarOrientacion = async (input: {
  firmId: string;
  userEmail: string;
  hechos: string;
  status: 'OK' | 'SIN_COINCIDENCIA';
  senales: { rama: string | null; elementos: string[] } | null;
  sugerencias: Array<{ id: string; nombre: string }>;
}): Promise<void> => {
  if (!supabase) return;

  const { error } = await supabase.from('orientaciones').insert({
    firm_id: input.firmId,
    user_email: input.userEmail,
    hechos: input.hechos,
    status: input.status,
    senales: input.senales,
    sugerencias: input.sugerencias
  });

  if (error) console.warn('[ORIENTACION] No se pudo guardar en el historial:', error.message);
};

/** El historial de la firma, mas nuevo primero. */
export const listarOrientaciones = async (firmId: string, limit = 100): Promise<OrientacionGuardada[]> => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orientaciones')
    .select('*')
    .eq('firm_id', firmId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[ORIENTACION] No se pudo leer el historial:', error.message);
    return [];
  }

  return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    hechos: String(r.hechos),
    status: r.status === 'OK' ? 'OK' : 'SIN_COINCIDENCIA',
    senales: (r.senales as OrientacionGuardada['senales']) ?? null,
    sugerencias: Array.isArray(r.sugerencias)
      ? (r.sugerencias as Array<{ id: string; nombre: string }>)
      : [],
    userEmail: String(r.user_email),
    createdAt: String(r.created_at)
  }));
};

/**
 * LOS HUECOS DEL CATALOGO: consultas sin actuacion, agrupadas por hechos
 * normalizados y contadas. "3x cuota de administracion a arrendatario" dice
 * que curar antes que cualquier metrica.
 */
export const huecosDelCatalogo = (
  historial: OrientacionGuardada[]
): Array<{ hechos: string; veces: number }> => {
  const normal = (t: string): string =>
    t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);

  const grupos = new Map<string, { hechos: string; veces: number }>();
  for (const o of historial) {
    if (o.status !== 'SIN_COINCIDENCIA') continue;
    const clave = normal(o.hechos);
    const g = grupos.get(clave);
    if (g) g.veces += 1;
    else grupos.set(clave, { hechos: o.hechos, veces: 1 });
  }

  return [...grupos.values()].sort((a, b) => b.veces - a.veces);
};
