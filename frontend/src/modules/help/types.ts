/**
 * The manual's content model.
 *
 * WHY THE MANUAL IS DATA AND NOT MARKUP. Thirteen articles written straight
 * into JSX would mean thirteen copies of the same spacing decisions, and the
 * first one someone edits under pressure is the one that drifts. Here the
 * article declares WHAT it says; the view owns HOW every block looks. Adding an
 * article is adding an object, and it cannot come out looking different.
 *
 * There is no fetch behind any of this on purpose: the manual is content, not
 * software. It ships with the bundle, so it works with no session, no network
 * and no backend — which is exactly the state a reader is in when the thing
 * they need help with is that nothing is loading.
 */

/** One rendered unit inside an article. */
export type ManualBlock =
  /** Ordinary prose. Justified, like the rest of the product's long copy. */
  | { readonly kind: 'parrafo'; readonly texto: string }
  /** A titled subsection inside an article. */
  | { readonly kind: 'subtitulo'; readonly texto: string }
  /** Numbered steps: the reader is meant to follow them in order. */
  | { readonly kind: 'pasos'; readonly pasos: readonly string[] }
  /** Unordered points where order carries no meaning. */
  | { readonly kind: 'lista'; readonly items: readonly string[] }
  /** A blue aside: a rule of thumb, not a warning. */
  | { readonly kind: 'nota'; readonly titulo: string; readonly texto: string }
  /** An amber aside: something that can cost the reader a deadline. */
  | { readonly kind: 'aviso'; readonly texto: string }
  /** A green aside: a habit that makes the task shorter, never a warning. */
  | { readonly kind: 'consejo'; readonly texto: string }
  /**
   * Where in the app the article happens, as a breadcrumb of UI locations:
   * ['Redacción', 'Taller', '«Comentar»']. Every article opens with one so the
   * reader knows what to click before reading a single step. Each chip names
   * a REAL screen, tab or button, checked against the component that draws it.
   */
  | { readonly kind: 'ruta'; readonly camino: readonly string[] }
  /**
   * The three states of a claim, drawn with the SAME components the reader
   * meets in the app — chip borders, hatch and icons included. A manual that
   * describes in words what the interface shows in shape is not remembered.
   */
  | { readonly kind: 'estados' }
  /** A fragment of a filing, in the document serif, with the three markings. */
  | { readonly kind: 'ejemplo' }
  /**
   * Something the artboard promised that the product does not do yet, said out
   * loud instead of drawn as a dead row. A capability that is not presented
   * does not exist — and one that is drawn but does not work is worse.
   */
  | { readonly kind: 'todavia-no'; readonly texto: string };

export interface ManualArticle {
  readonly id: string;
  readonly titulo: string;
  /** One sentence under the title: what the reader gets out of this article. */
  readonly entradilla: string;
  readonly bloques: readonly ManualBlock[];
}

/** A task-shaped section of the index ("Redactar", "Grabar", "Para socios"). */
export interface ManualGroup {
  readonly titulo: string;
  readonly articulos: readonly ManualArticle[];
}

/** An article with the position the reader sees: "Artículo 03 de 13". */
export interface ManualEntry {
  readonly articulo: ManualArticle;
  readonly grupo: string;
  /** 1-based, across the whole manual. */
  readonly numero: number;
}

/**
 * A way to reach support.
 *
 * `disponible` is not decoration: WhatsApp only exists once a number is
 * configured, and the in-app chat does not exist at all. A channel that cannot
 * be used renders as a declaration, never as a button that does nothing.
 */
export interface SupportChannel {
  readonly id: 'whatsapp' | 'chat';
  readonly nombre: string;
  readonly paraQue: string;
  readonly disponible: boolean;
  /** Why it is unavailable. Empty when it is available. */
  readonly razon: string;
  readonly puntos: readonly SupportPoint[];
}

export interface SupportPoint {
  /** `advertencia` points are the ones that can cost the reader something. */
  readonly tono: 'hecho' | 'advertencia';
  readonly texto: string;
}
