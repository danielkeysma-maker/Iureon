import React from 'react';

/**
 * La autorización de grabación de la entrevista, en un solo sitio.
 *
 * ─── POR QUÉ ESTO NO PUEDE ESTAR DUPLICADO ──────────────────────────────────
 *
 * La voz es un dato biométrico (Ley 1581 de 2012): sin la casilla marcada, ni
 * el grabador ni la subida se habilitan, y el audio NO se envía a transcribir.
 * Y no es solo un interruptor de interfaz — la hora del clic viaja con la
 * transcripción a `transcriptions.autorizo_grabacion_el`, que es la constancia
 * demostrable que la ley exige.
 *
 * Al construir la pantalla móvil (4d) esta regla iba a quedar escrita dos
 * veces. Dos copias de un consentimiento se desincronizan sin hacer ruido: la
 * de escritorio guarda la hora y la del teléfono se olvida, y el día que
 * alguien pida la constancia solo existe para la mitad de las entrevistas. Vive
 * aquí, y las dos pantallas la consumen.
 *
 * ─── LA HORA SE SELLA AL MARCAR, NO AL TRANSCRIBIR ──────────────────────────
 *
 * `autorizadoEl` se fija en el instante del clic y no cuando arranca la subida.
 * Son cosas distintas: entre una y otra puede pasar una hora de entrevista, y
 * lo que la ley pide es cuándo consintió la persona, no cuándo se procesó.
 *
 * Desmarcar BORRA la hora. Una constancia que sobrevive a la retirada del
 * consentimiento es peor que ninguna.
 */
export interface AutorizacionDeGrabacion {
  autorizado: boolean;
  /** ISO del instante del clic. `null` mientras no se haya autorizado. */
  autorizadoEl: string | null;
  marcar: (valor: boolean) => void;
  /** Al abrir una transcripción guardada: la hora que trae la fila. */
  restaurar: (iso: string | null) => void;
}

export const useAutorizacionDeGrabacion = (): AutorizacionDeGrabacion => {
  const [autorizado, setAutorizado] = React.useState(false);
  const [autorizadoEl, setAutorizadoEl] = React.useState<string | null>(null);

  const marcar = React.useCallback((valor: boolean) => {
    setAutorizado(valor);
    setAutorizadoEl(valor ? new Date().toISOString() : null);
  }, []);

  const restaurar = React.useCallback((iso: string | null) => {
    setAutorizado(Boolean(iso));
    setAutorizadoEl(iso);
  }, []);

  return { autorizado, autorizadoEl, marcar, restaurar };
};

/** El texto de la casilla. Uno solo: si cambia, cambia en las dos pantallas. */
export const TEXTO_AUTORIZACION =
  'Le informé que la entrevista se graba y lo autorizó';

export const RAZON_AUTORIZACION =
  'La voz es un dato biométrico (Ley 1581 de 2012): sin esta autorización, la grabación no se envía a transcribir. Queda registrada con la hora.';
