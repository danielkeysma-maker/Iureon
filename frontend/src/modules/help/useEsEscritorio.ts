import React from 'react';

/**
 * ¿La ventana es de escritorio (1024 px o más)?
 *
 * ─── POR QUÉ LO NECESITAN EL MANUAL Y EL SOPORTE ────────────────────────────
 *
 * `App` monta a la vez la pantalla de escritorio y la del teléfono y esconde
 * una con CSS. Para una pantalla estática da igual; para el soporte no: dos
 * chats montados sondean dos veces cada 30 s, y dos manuales piden dos veces el
 * registro de lectura. Con esto, cada envoltorio pinta su página solo en el
 * ancho que le corresponde y el otro no existe. El corte es el mismo `lg` de
 * Tailwind con el que `App` las esconde, así que nunca quedan las dos vacías.
 */
const CONSULTA = '(min-width: 1024px)';

export const useEsEscritorio = (): boolean => {
  const consulta = React.useMemo(() => window.matchMedia(CONSULTA), []);
  const [ancho, setAncho] = React.useState(consulta.matches);
  React.useEffect(() => {
    const alCambiar = (e: MediaQueryListEvent) => setAncho(e.matches);
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, [consulta]);
  return ancho;
};
