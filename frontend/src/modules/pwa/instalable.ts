/**
 * Captura de `beforeinstallprompt`.
 *
 * Chrome (Android y escritorio) dispara el evento UNA vez, temprano, a veces
 * antes de que React monte nada. Si nadie lo guarda, el botón «Instalar» no
 * puede existir. Por eso el oyente se registra al importar este módulo desde
 * `main.tsx`, y el componente solo pregunta si hay un evento guardado.
 *
 * Safari (iOS y macOS) no dispara nada: ahí la instalación es manual, desde
 * Compartir → Añadir a pantalla de inicio, y el componente lo explica.
 */

export interface EventoDeInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let eventoDiferido: EventoDeInstalacion | null = null;
const oyentes = new Set<() => void>();

const avisar = () => oyentes.forEach((f) => f());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Sin esto, Chrome muestra su propia barrita en el momento que él elija.
    e.preventDefault();
    eventoDiferido = e as EventoDeInstalacion;
    avisar();
  });
  window.addEventListener('appinstalled', () => {
    eventoDiferido = null;
    avisar();
  });
}

export const eventoDeInstalacion = (): EventoDeInstalacion | null => eventoDiferido;

/** Devuelve la función para dejar de escuchar. */
export const alCambiarInstalable = (f: () => void): (() => void) => {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
};

/** Lanza el diálogo nativo. El evento solo sirve una vez: se consume aquí. */
export const pedirInstalacion = async (): Promise<'accepted' | 'dismissed' | 'no-disponible'> => {
  const evento = eventoDiferido;
  if (!evento) return 'no-disponible';
  eventoDiferido = null;
  avisar();
  await evento.prompt();
  const { outcome } = await evento.userChoice;
  return outcome;
};
