/**
 * La prueba gratuita, del lado de la pantalla.
 *
 * ES UNA COPIA, Y POR ESO TIENE GUARDA. La fuente de verdad es
 * `DIAS_DE_PRUEBA_GRATUITA` en `backend/src/modules/trial/trial.rules.ts`; el
 * frontend no importa del backend, así que aquí se repite el número y
 * `check:prueba-terminada` lo compara con aquel archivo leído como texto. La
 * maqueta de la pantalla de bloqueo decía «Los 14 días se acabaron» — el plazo
 * del alta por operador, que ni siquiera es una prueba — y una copia sin guarda
 * habría repetido ese error en cuanto la prueba cambie.
 */
export const DIAS_DE_PRUEBA_GRATUITA = 7;

/** El código del 403 que cierra la API a una prueba terminada sin pagar. */
export const CODIGO_PRUEBA_TERMINADA = 'PRUEBA_TERMINADA';
