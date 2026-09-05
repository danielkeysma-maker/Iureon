/**
 * The screen INSIDE a module, remembered across a reload.
 *
 * `App.tsx` already keeps the active module in `sessionStorage` so that F5
 * does not throw the lawyer back to the drafting workspace. That covered the
 * module and nothing else: the open transcript, the draft under the taller,
 * the manual article being read, all vanished — and a reload is exactly what
 * somebody does when a page misbehaves. Every module now records the
 * IDENTIFIER of what it has open here, and re-opens it through the same path
 * it uses when the lawyer clicks the row, once its list has loaded.
 *
 * Identifiers only, never content. The content lives on the server (or in the
 * module's own store) and is fetched again; what is remembered is only which
 * row to fetch. If the row no longer exists the module falls back to its list
 * — a remembered id must never produce an empty shell.
 *
 * `sessionStorage` on purpose, for the reason `App.tsx` gives at length: it
 * belongs to the tab, so it survives a refresh and is empty in a new tab or
 * after the browser is closed. Opening the application afresh opens it at the
 * beginning.
 */

const PREFIJO = 'iureon.pantalla.';

/** Records the open item of a module; `null` forgets it. */
export const recordar = (clave: string, valor: string | null): void => {
  try {
    if (valor === null || valor === '') sessionStorage.removeItem(PREFIJO + clave);
    else sessionStorage.setItem(PREFIJO + clave, valor);
  } catch {
    /* Private mode or storage disabled: the screen still works, only the memory is lost. */
  }
};

/** The remembered item of a module, or `null` when nothing is remembered. */
export const recordado = <T extends string = string>(clave: string): T | null => {
  try {
    const valor = sessionStorage.getItem(PREFIJO + clave);
    return valor ? (valor as T) : null;
  } catch {
    return null;
  }
};

/**
 * Forgets every remembered screen at once — what the brand mark does when it
 * takes the lawyer home. Only this prefix is touched: the active module and
 * anything else other code keeps in `sessionStorage` stay as they are.
 */
export const olvidarTodo = (): void => {
  try {
    const claves: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const clave = sessionStorage.key(i);
      if (clave && clave.startsWith(PREFIJO)) claves.push(clave);
    }
    claves.forEach((clave) => sessionStorage.removeItem(clave));
  } catch {
    /* Nothing to forget where nothing could be stored. */
  }
};

/** The keys each module uses, in one place so two modules never share one by accident. */
export const PANTALLAS = {
  /** Id of the saved draft open in Redacción (what Borradores opened). */
  borrador: 'borrador',
  /** Id of the saved draft whose taller (TallerDeBorrador) is open. */
  tallerBorrador: 'taller-borrador',
  /** Id of the saved review whose taller (TallerDeRevision) is open. */
  tallerRevision: 'taller-revision',
  /** Id of the open transcript, per kind: `transcripcion.AUDIENCIA` / `transcripcion.ENTREVISTA`. */
  transcripcion: (kind: string) => `transcripcion.${kind}`,
  /** Id of the tool (calculator) whose dialog is open in Herramientas. */
  herramienta: 'herramienta',
  /** Id of the manual article being read. */
  manual: 'manual'
} as const;
