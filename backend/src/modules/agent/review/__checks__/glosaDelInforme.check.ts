/**
 * GUARDA DE LA GLOSA DEL INFORME DE REVISIÓN.
 *
 * Run with: npm run check:glosa-informe
 *
 * ─── LO QUE SE JUEGA ───────────────────────────────────────────────────────
 *
 * `verificarGlosa.ts` ya tiene su guarda: allí se prueba el juez, el veredicto
 * y la marca sobre un ESCRITO. Aquí se prueba lo que cambia al traerlo a
 * Revisión, que es poco código y toda la doctrina:
 *
 *  1. QUÉ SE JUZGA. El informe tiene una casilla —`correccionesTextuales.cita`—
 *     que NO es del revisor: es un pedazo verbatim del escrito del abogado. Si
 *     entra, el aviso dice «esta revisión afirma X» sobre una frase que la
 *     revisión no escribió. Una acusación mal dirigida enseña a ignorar todos
 *     los avisos, que es doctrina de esta casa desde el detector de voces
 *     fusionadas.
 *
 *  2. DÓNDE SE MARCA. En la cita tampoco se escribe: meterle un corchete la
 *     deja de ser textual. Es la misma regla que la comprobación de vigencia ya
 *     respeta, y romperla no falla — solo corrompe una cita.
 *
 *  3. QUE NO GRITE DE MÁS. Solo lo NO SOSTENIDO se marca dentro del informe. Si
 *     las dudosas también se marcaran, un informe donde casi todo está bien
 *     saldría lleno de corchetes y la marca que importa se volvería invisible.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  avisoDeGlosa,
  marcarGlosaEnInforme,
  verificarGlosaDelInforme
} from '../glosaDelInforme';
import type { InformeDeRevision } from '../documentReview';
import type { JuezDeGlosa, RespuestaDelJuez, RevisionDeGlosa } from '../verificarGlosa';
import type { VigenciaDeArticulo } from '../../../legislation/officialArticle.service';

let fallos = 0;
const check = (nombre: string, ok: boolean, detalle = ''): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`);
  if (!ok) fallos++;
};

/*
 * EL TEXTO OFICIAL ES EL DE VERDAD, recortado. Es el mismo art. 8 de la Ley 820
 * de 2003 sobre el que se midió el defecto original: está VIGENTE —así que la
 * comprobación de vigencia lo aprueba, y con razón— y dice lo contrario de lo
 * que la frase medida afirmaba.
 */
const ART_8: VigenciaDeArticulo = {
  referencia: { codigo: 'LEY 820 DE 2003', articulo: 8 },
  estado: 'VIGENTE',
  detalle: 'Vigente según la Secretaría del Senado.',
  cuerpo:
    'Son obligaciones del arrendador, las siguientes: 1. Entregar al arrendatario en la fecha convenida, o en el momento de la celebración del contrato, el inmueble dado en arrendamiento en buen estado de servicio, seguridad y sanidad y poner a su disposición los servicios, cosas o usos conexos y los adicionales convenidos.',
  lecturas: [],
  fuentesQueOpinaron: ['SENADO'],
  consultadoEn: '2026-09-12',
  url: 'https://www.secretariasenado.gov.co/senado/basedoc/ley_0820_2003.html'
} as VigenciaDeArticulo;

const RESPUESTA_NO_SOSTENIDA: RespuestaDelJuez = {
  veredicto: 'NO_SOSTENIDA',
  apoyo: 'Son obligaciones del arrendador, las siguientes:',
  motivo: 'El artículo regula las obligaciones del arrendador y no las del arrendatario.'
};

const juezDeFixture =
  (respuesta: RespuestaDelJuez | null): JuezDeGlosa =>
  async () => ({
    respuesta,
    usage: { model: 'fixture', promptTokens: 100, completionTokens: 10, costUsd: 0.001 }
  });

/** Un informe vacío al que se le pone solo lo que cada caso necesita. */
const informeCon = (parcial: Partial<InformeDeRevision>): InformeDeRevision => ({
  resumen: '',
  fortalezas: [],
  debilidades: [],
  seccionesFaltantes: [],
  erroresDeAplicacion: [],
  correccionesTextuales: [],
  recomendaciones: [],
  ...parcial
});

const LA_FRASE = 'El art. 8 de la Ley 820 de 2003 fija las obligaciones del arrendatario.';

const asincronos = async (): Promise<void> => {
  /* ─── 1. LA CITA DEL ABOGADO NO SE JUZGA ──────────────────────────────── */
  /*
   * El artículo aparece ÚNICAMENTE dentro de `cita`, que es texto del abogado.
   * Si esto juzgara algo, el aviso le achacaría al revisor una afirmación que
   * no hizo.
   */
  const soloEnLaCita = informeCon({
    correccionesTextuales: [{ cita: LA_FRASE, problema: 'Redacción confusa.', reemplazo: 'Reformúlelo.' }]
  });
  const nada = await verificarGlosaDelInforme(
    soloEnLaCita,
    [ART_8],
    5_000,
    juezDeFixture(RESPUESTA_NO_SOSTENIDA)
  );
  check(
    'lo que solo está en la cita del abogado NO se juzga',
    nada.resultados.length === 0,
    'el aviso diría «esta revisión afirma» sobre una frase que la revisión no escribió'
  );

  /* ─── 2. LO QUE EL REVISOR SÍ AFIRMA SE JUZGA ─────────────────────────── */

  const informe = informeCon({
    resumen: 'El escrito está bien encaminado.',
    debilidades: [LA_FRASE],
    correccionesTextuales: [
      /*
       * LA CITA NOMBRA EL MISMO ARTÍCULO A PROPÓSITO. Con una cita que no lo
       * nombrara, «la cita sale intacta» pasaría sola —no habría nada que
       * marcar ahí— y la guarda certificaría una regla que no está probando.
       */
      {
        cita: 'con fundamento en el art. 8 de la Ley 820 de 2003 solicito la restitución',
        problema: `Apóyelo mejor. ${LA_FRASE}`,
        reemplazo: 'Cítelo así.'
      }
    ],
    recomendaciones: ['Revise las pruebas.']
  });

  const juzgado = await verificarGlosaDelInforme(
    informe,
    [ART_8],
    5_000,
    juezDeFixture(RESPUESTA_NO_SOSTENIDA)
  );

  check(
    'lo que el revisor afirma por su cuenta sí se juzga',
    juzgado.resultados.length > 0,
    `${juzgado.resultados.length} afirmación(es)`
  );
  check(
    'y el veredicto llega tal cual del juez',
    juzgado.noSostenidas > 0,
    'sin esto la tubería estaría rota y el check pasaría igual'
  );
  check(
    'el gasto de cada llamada sube para que se pueda registrar',
    juzgado.usos.length === juzgado.resultados.length && juzgado.usos.every((u) => u.costUsd > 0),
    'lo que no llega a `ai_usage` queda fuera de la liquidación: el gasto invisible, ya medido'
  );

  /* ─── 3. LA MARCA VA DONDE EL REVISOR HABLA, Y NO EN LA CITA ──────────── */

  const marcado = marcarGlosaEnInforme(informe, juzgado);

  check(
    'la debilidad del revisor queda marcada',
    marcado.debilidades[0].includes('NO LO DICE ESE ARTÍCULO'),
    marcado.debilidades[0].slice(0, 80)
  );
  check(
    'la marca trae el texto oficial para que el abogado vea por qué',
    marcado.debilidades[0].includes('Son obligaciones del arrendador'),
    'sin el texto al lado, la marca es una afirmación más que hay que creer'
  );
  check(
    'la cita del abogado sale INTACTA aunque nombre el mismo artículo',
    marcado.correccionesTextuales[0].cita === informe.correccionesTextuales[0].cita,
    'un corchete dentro de una cita textual la deja de ser textual'
  );
  check(
    'pero el problema, que sí es del revisor, se marca',
    marcado.correccionesTextuales[0].problema.includes('NO LO DICE ESE ARTÍCULO')
  );
  check(
    'el informe original no se toca',
    informe.debilidades[0] === LA_FRASE,
    'es lo que se pagó y hay que poder volver a leerlo tal como salió'
  );

  /* ─── 4. LO DUDOSO SE DECLARA, PERO NO SE MARCA DENTRO ────────────────── */

  const dudoso = await verificarGlosaDelInforme(informe, [ART_8], 5_000, juezDeFixture(null));
  check(
    'sin respuesta del juez el veredicto es DUDOSA, no un informe perdido',
    dudoso.dudosas > 0 && dudoso.noSostenidas === 0,
    'agotar el plazo no puede costar el informe que ya se pagó'
  );

  const marcadoDudoso = marcarGlosaEnInforme(informe, dudoso);
  check(
    'lo dudoso NO llena el informe de corchetes',
    marcadoDudoso.debilidades[0] === LA_FRASE,
    'marcar también las dudosas volvería invisible la marca que importa'
  );
  check(
    'pero sí se declara en la cabecera',
    (avisoDeGlosa(dudoso) ?? '').includes('no se pudo dar por comprobada'),
    'no se da por buena ni por mala: se dice'
  );

  /* ─── 5. EL AVISO DE CABECERA ─────────────────────────────────────────── */

  const aviso = avisoDeGlosa(juzgado) ?? '';
  check('el aviso nombra el artículo', aviso.includes('art. 8'));
  check(
    'y copia la frase que no se sostiene',
    aviso.includes('las obligaciones del arrendatario'),
    'sin la frase, el abogado no sabe cuál de sus puntos es'
  );
  check(
    'dice que no se apoye en lo marcado',
    aviso.includes('no se apoye'),
    'un aviso que describe pero no manda se lee como una nota al pie'
  );

  const todoBien: RevisionDeGlosa = { resultados: [], noSostenidas: 0, dudosas: 0, usos: [] };
  check(
    'sin nada que avisar no hay aviso',
    avisoDeGlosa(todoBien) === null,
    'una cabecera seguida de nada es una casilla, y esta casa ya sabe cómo terminan'
  );

  /* ─── 6. Y LO COMPROBADO Y CORRECTO NO SE ANUNCIA ─────────────────────── */
  /*
   * En el borrador la lista de sostenidas sirve —el escrito es largo y el
   * abogado quiere saber qué se revisó—. Aquí el aviso vive dentro de
   * `recomendaciones`, que es una lista de cosas POR HACER: «no haga nada con
   * estas cuatro» es ruido delante de las que sí lo son.
   */
  const sostenida = await verificarGlosaDelInforme(
    informe,
    [ART_8],
    5_000,
    juezDeFixture({
      veredicto: 'SOSTENIDA',
      apoyo: 'Son obligaciones del arrendador, las siguientes:',
      motivo: 'El texto sostiene la frase.'
    })
  );
  check(
    'un informe cuyas afirmaciones se sostienen no gana ninguna línea',
    avisoDeGlosa(sostenida) === null,
    `se juzgaron ${sostenida.resultados.length} y ninguna hay que mirarla`
  );
};

/* ─── 7. Y ESTÁ ENCHUFADO DONDE DEBE, EN EL ORDEN QUE DEBE ──────────────── */
/*
 * Escribir el comprobador y no llamarlo es exactamente lo que pasó con las
 * tres comprobaciones del borrador: vivían en esta misma carpeta y nadie de
 * esta carpeta las usaba. Geografía engañosa, y no la ve ningún tipo.
 */

const controlador = readFileSync(join(__dirname, '..', 'documentReview.controller.ts'), 'utf8');

check(
  'la revisión llama a la comprobación de glosa',
  /verificarGlosaDelInforme\(/.test(controlador),
  'el archivo existe no prueba que alguien lo llame'
);
check(
  'y se alimenta de lo que la vigencia ya descargó',
  /verificarGlosaDelInforme\(informe, citasComprobadas/.test(controlador),
  'volver a bajar los mismos artículos duplicaría las peticiones al Senado'
);
check(
  'las hasta ocho llamadas se registran en el gasto',
  /for \(const usage of glosa\.usos\)[\s\S]{0,160}recordUsage\(\{[\s\S]{0,120}operation: 'REVISION'/.test(controlador),
  '`settleOperation` liquida sumando `ai_usage`: lo que no se registra no existe para el margen'
);
check(
  'y un fallo suyo no tumba el informe',
  /No se pudo comprobar la glosa del informe/.test(controlador),
  'llegados ahí el informe ya está escrito y ya se pagó'
);
check(
  'los dos avisos se anteponen juntos, en orden escrito a mano',
  /recomendaciones: \[\.\.\.avisos, \.\.\.anotado\.recomendaciones\]/.test(controlador),
  'con un `unshift` por comprobación, el orden lo decide cuál corre última'
);
check(
  'la glosa corre DESPUÉS de la vigencia',
  controlador.indexOf('verificarVigenciaDelInforme(') < controlador.indexOf('verificarGlosaDelInforme('),
  'sin el texto oficial que la vigencia baja, esto no tendría contra qué comparar'
);

void (async () => {
  await asincronos();

  console.log('');
  if (fallos > 0) {
    console.log(`${fallos} comprobación(es) no pasaron.`);
    process.exitCode = 1;
  } else {
    console.log('TODO BIEN — lo que el revisor afirma se juzga; lo que el abogado escribió, no.');
  }
})();
