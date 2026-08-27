import { supabase } from '../../config/supabase.config';

/**
 * Las preferencias de apariencia de una persona.
 *
 * SON DE LA PERSONA, NO DE LA FIRMA, y esa frontera es el punto. El diseño la
 * escribe en la propia pantalla —"Suyos" contra "De la firma"— porque el error
 * más caro en una aplicación de despacho es cambiarle el membrete a todos
 * creyendo que se cambiaba el propio. Lo de la firma vive en otro sitio y lo
 * cambia un socio.
 *
 * SE GUARDAN EN LA BASE Y NO EN EL NAVEGADOR porque el diseño promete "en este y
 * en sus demás dispositivos". Un abogado que trabaja en el portátil del despacho
 * y en el de la casa espera encontrar la misma aplicación en los dos;
 * `localStorage` le daría dos configuraciones distintas sin avisarle, y la
 * segunda parecería que se le borró.
 *
 * NADA DE ESTO TOCA EL ESCRITO. Ni el tema, ni la familia de la interfaz, ni la
 * densidad cambian lo que la IA genera ni cómo se exporta: el .docx y el PDF
 * salen siempre en papel blanco con la tipografía que la FIRMA definió. La
 * pantalla lo dice y este módulo no tiene forma de contradecirlo, porque no
 * escribe nada que la redacción lea.
 */

export type Theme = 'system' | 'light' | 'dark';
export type UiFont = 'plex' | 'jakarta' | 'manrope' | 'instrument' | 'public' | 'system';
export type Density = 'compact' | 'normal' | 'comfortable';

export interface Preferences {
  theme: Theme;
  uiFont: UiFont;
  density: Density;
}

/**
 * Lo que ve alguien que nunca tocó Ajustes.
 *
 * `system` en el tema no es una opción tibia: es la correcta. Quien trabaja de
 * noche ya lo configuró en su equipo, y un tercer ajuste solo produce pantallas
 * inconsistentes entre su portátil y su teléfono.
 */
export const POR_DEFECTO: Preferences = {
  theme: 'system',
  uiFont: 'plex',
  density: 'normal'
};

const TEMAS: Theme[] = ['system', 'light', 'dark'];
const FUENTES: UiFont[] = ['plex', 'jakarta', 'manrope', 'instrument', 'public', 'system'];
const DENSIDADES: Density[] = ['compact', 'normal', 'comfortable'];

/**
 * Acepta solo lo que existe, y para lo demás usa el valor por defecto.
 *
 * No lanza: una preferencia inválida —de un cliente viejo, de un dedo en la
 * consola— no puede impedirle a nadie entrar a la aplicación. Se ignora y se
 * sigue, que es exactamente lo que NO haría un campo con dinero de por medio.
 */
export const sanear = (crudo: unknown): Preferences => {
  const p = (crudo ?? {}) as Record<string, unknown>;
  const uno = <T,>(valor: unknown, permitidos: readonly T[], defecto: T): T =>
    permitidos.includes(valor as T) ? (valor as T) : defecto;

  return {
    theme: uno(p.theme, TEMAS, POR_DEFECTO.theme),
    uiFont: uno(p.uiFont, FUENTES, POR_DEFECTO.uiFont),
    density: uno(p.density, DENSIDADES, POR_DEFECTO.density)
  };
};

export const leer = async (firmId: string, userEmail: string): Promise<Preferences> => {
  if (!supabase) return POR_DEFECTO;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('theme, ui_font, density')
    .eq('user_email', userEmail)
    .eq('firm_id', firmId)
    .maybeSingle();

  /*
   * Un fallo devuelve los valores por defecto, no un error.
   *
   * Sin preferencias la aplicación se ve bien —sigue al sistema, tipografía
   * neutra, densidad normal—, así que tumbar la sesión por no poder leer un
   * gusto sería cambiar algo intrascendente por una caída.
   */
  if (error || !data) return POR_DEFECTO;

  return sanear({
    theme: (data as { theme?: unknown }).theme,
    uiFont: (data as { ui_font?: unknown }).ui_font,
    density: (data as { density?: unknown }).density
  });
};

export const guardar = async (
  firmId: string,
  userEmail: string,
  crudo: unknown
): Promise<Preferences> => {
  const prefs = sanear(crudo);
  if (!supabase) return prefs;

  /*
   * `upsert` sobre la llave primaria: la primera vez inserta y las demás
   * actualiza, en una sola sentencia. Leer-y-decidir aquí abriría una carrera
   * entre dos pestañas del mismo abogado por algo que no la merece.
   */
  const { error } = await supabase.from('user_preferences').upsert(
    {
      user_email: userEmail,
      firm_id: firmId,
      theme: prefs.theme,
      ui_font: prefs.uiFont,
      density: prefs.density,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'user_email' }
  );

  if (error) {
    console.warn(`[PREFERENCIAS] No se pudieron guardar las de ${userEmail}: ${error.message}`);
  }

  /*
   * Se devuelven igual aunque no se hayan guardado.
   *
   * La pantalla ya las aplicó al elegirlas —el diseño no pone botón de
   * guardar—, así que devolver un error dejaría la interfaz cambiada y un aviso
   * rojo diciendo que no cambió. Lo que se pierde es la persistencia, y eso se
   * nota la próxima vez, sin dañar la sesión en curso.
   */
  return prefs;
};
