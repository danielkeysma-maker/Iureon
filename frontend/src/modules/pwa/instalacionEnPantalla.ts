/**
 * Qué caso de «Instalar la aplicación» se pinta, sin tocar el navegador.
 *
 * DEFECTO QUE ESTO CORRIGE: el «Instalada. Ábrala desde su pantalla de
 * inicio» vivía dentro de la rama «hay evento», y `pedirInstalacion` consume
 * el evento ANTES de que llegue la respuesta del usuario. La rama desaparecía
 * y el mensaje no se veía nunca. Por eso el resultado va antes que el evento.
 *
 * Orden: ya instalada → aceptada hace un momento → el navegador ofrece
 * instalar → iPhone/iPad, donde solo hay instrucciones → la rechazó → nada
 * que ofrecer (Firefox de escritorio, o Chrome que aún no decide: un botón que
 * no hace nada sería peor que ningún botón).
 */
export type SituacionDeInstalacion = 'instalada' | 'aceptada' | 'instalable' | 'ios-instrucciones' | 'rechazada' | 'no-disponible';

export interface EntradaDeInstalacion {
  instalada: boolean;
  hayEvento: boolean;
  esIOS: boolean;
  resultado: '' | 'aceptada' | 'rechazada';
}

export const situacionDeInstalacion = ({ instalada, hayEvento, esIOS, resultado }: EntradaDeInstalacion): SituacionDeInstalacion => {
  if (instalada) return 'instalada';
  if (resultado === 'aceptada') return 'aceptada';
  if (hayEvento) return 'instalable';
  if (esIOS) return 'ios-instrucciones';
  if (resultado === 'rechazada') return 'rechazada';
  return 'no-disponible';
};
