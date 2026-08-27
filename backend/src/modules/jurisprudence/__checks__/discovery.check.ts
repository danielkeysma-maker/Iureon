/**
 * Guards topic discovery.
 *
 * Run with: npm run check:discovery
 *
 * Un buscador web señala hacia sentencias; nunca decide qué dicen ni que
 * existan. Todo lo que proponga pasa por la misma puerta que una cita escrita a
 * mano: el registro oficial del Estado la confirma, y la relatoría entrega el
 * texto.
 *
 * Lo que se comprueba aquí es esa frontera. Si un día alguien "optimiza" el
 * módulo confiando en el título de un resultado, esto tiene que fallar.
 */
import { config } from '../../../config/env.config';
import { discoverRulings } from '../discovery.service';
import { fetchOfficialRuling } from '../officialRuling.service';

let fallos = 0;
const check = (n: string, ok: boolean, d = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${n}${d ? ' — ' + d : ''}`);
  if (!ok) fallos++;
};

(async () => {
  /*
   * ─── APAGADO ES APAGADO, NO ROTO ─────────────────────────────────────────
   *
   * Sin llave, el descubrimiento por tema se declara no configurado y el resto
   * del buscador sigue igual. Un módulo opcional que devuelve FAILED cuando
   * simplemente no está puesto entrena a todo el mundo a ignorar los errores.
   */
  const resultado = await discoverRulings('desembargo de salario mínimo');

  if (!config.search.enabled) {
    check(
      'sin llave, el descubrimiento se declara NO_PROVIDER y no falla',
      resultado.status === 'NO_PROVIDER',
      resultado.status
    );
    check(
      'y lo explica sin dar a entender que la búsqueda entera está rota',
      /corpus indexado/.test(resultado.reason ?? ''),
      resultado.reason ?? ''
    );
  } else {
    check('con llave, el descubrimiento responde', resultado.status === 'OK', resultado.status);

    // Todo lo devuelto trae texto real: si algo llegó aquí, fue descargado.
    const sinTexto = resultado.found.filter((f) => (f.ruling.text ?? '').length < 4000);
    check(
      'toda sentencia propuesta viene con su texto descargado',
      sinTexto.length === 0,
      sinTexto.map((f) => f.ruling.citation).join(', ')
    );

    // Y con procedencia del registro, no del buscador.
    const sinProcedencia = resultado.found.filter((f) => !f.ruling.magistrado || !f.ruling.fecha);
    check(
      'y con su ponente y fecha del registro oficial',
      sinProcedencia.length === 0,
      sinProcedencia.map((f) => f.ruling.citation).join(', ')
    );
  }

  /*
   * ─── LA FRONTERA, COMPROBADA CONTRA LA REALIDAD ──────────────────────────
   *
   * El descubrimiento no tiene una vía propia hacia el corpus: usa
   * `fetchOfficialRuling`, igual que un abogado escribiendo la cita. Así que la
   * garantía se prueba donde vive — si un buscador propusiera esta cita, que es
   * la que esta aplicación llegó a inventar, el registro la mata.
   */
  const inventada = await fetchOfficialRuling('SU-049 de 2022');

  if (inventada.status === 'UNREACHABLE') {
    console.log('skip la parte de red: no hay acceso al registro oficial');
  } else {
    check(
      'una cita inventada que un buscador propusiera no llegaría al corpus',
      inventada.status === 'DOES_NOT_EXIST',
      inventada.status
    );
  }

  console.log(fallos === 0 ? '\nALL CHECKS PASSED' : `\n${fallos} CHECKS FAILED`);
  /*
   * `exitCode` en vez de `process.exit()`, y no es estilo.
   *
   * Este check hace fetch con `AbortSignal.timeout`, y matar el proceso con un
   * handle de libuv a medio cerrar aborta Node en Windows: imprimia
   * ALL CHECKS PASSED y salia con 127. Un check cuyo texto y cuyo codigo de
   * salida se contradicen es peor que uno que falla — CI cree lo segundo y la
   * persona lee lo primero.
   *
   * Con `exitCode` el proceso termina cuando el bucle de eventos se vacia, que
   * es cuando de verdad no queda nada pendiente.
   */
  process.exitCode = fallos === 0 ? 0 : 1;
})();
