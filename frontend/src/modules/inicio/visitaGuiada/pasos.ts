import type { MainView } from '../../tenant/types';
import type { CapituloId } from './capitulos';

/**
 * The guided tour, one stop per module, grouped in named chapters.
 *
 * ─── EVERY SENTENCE HERE IS CHECKED AGAINST THE MANUAL ──────────────────────
 *
 * The texts describe what each module does today, taken from the manual
 * articles (`help/content/manual.ts`), which are themselves checked against
 * the components. A tour that promises a button the screen does not have
 * teaches the reader to distrust the whole tour.
 *
 * ─── HOW A STOP IS FOUND ON SCREEN ──────────────────────────────────────────
 *
 * Each stop names the module to open (`vista`) and the elements it may
 * highlight, in order of preference, by their `data-visita` attribute. The
 * first one that is VISIBLE wins: desktop and phone layouts are both mounted
 * and hidden by CSS, so «visible» is decided by measuring, not by presence.
 * A stop with no visible target — a module the plan does not include, the
 * sidebar saldo on a phone — is skipped, never shown pointing at nothing.
 *
 * ─── EL ORDEN DEL ARCHIVO ES EL ORDEN DE LOS CAPÍTULOS ──────────────────────
 *
 * Cada parada declara su capítulo (`capitulos.ts`), y las de un mismo capítulo
 * van juntas: la visita se recorre en el orden de este arreglo y un capítulo
 * que reapareciera después de otro partiría la barra de avance en dos. Por eso
 * «Ajustes» y «Saldo y plan» vinieron antes de «Manual» y «Soporte»: la visita
 * termina donde se pide ayuda, con «Ir al inicio» de último porque su texto
 * dice que ahí termina.
 */

export interface PasoDeVisita {
  readonly id: string;
  /** The module to open before measuring. `null` = stay where the tour is. */
  readonly vista: MainView | null;
  /** `data-visita` values, preferred first. */
  readonly objetivos: readonly string[];
  readonly titulo: string;
  readonly texto: string;
  /** El capítulo con nombre al que pertenece la parada. */
  readonly capitulo: CapituloId;
}

const modulo = (capitulo: CapituloId, id: MainView, titulo: string, texto: string): PasoDeVisita => ({
  id,
  vista: id,
  objetivos: [`vista-${id}`, `nav-${id}`],
  titulo,
  texto,
  capitulo
});

export const PASOS_DE_VISITA: readonly PasoDeVisita[] = [
  modulo(
    'empezar',
    'inicio',
    'Inicio',
    'Su punto de partida. Arriba, «Lo que vence»: los términos más próximos de la agenda, con el botón que los resuelve. Debajo, lo último que dejó abierto, el plan y el saldo de la firma, y al final «Por dónde empiezo», las puertas por lo que usted tiene delante —un documento que le llegó, unos hechos sin nombre, un escrito que ya sabe cuál es—, con las novedades.'
  ),
  modulo(
    'empezar',
    'workspace',
    'Redacción',
    'Aquí se genera el primer borrador de un escrito, en pasos: qué va a presentar —el caso, quién firma, la rama y la actuación del catálogo— y los hechos con sus pruebas. Al generarlo aparece el papel con su barra, y a la derecha lo que lo respalda: la ficha, su término y las secciones que pide.'
  ),
  modulo(
    'empezar',
    'borradores',
    'Borradores',
    'Los escritos guardados, con el término de su actuación, su versión y su estado. Desde aquí los vuelve a abrir en Redacción para continuarlos, los duplica o los marca como radicados.'
  ),
  modulo(
    'empezar',
    'taller',
    'Revisiones',
    'Los escritos ya redactados que subió para que el revisor los examinara. Cada uno se abre en el taller con su informe, los pasajes citados y la conversación con la guía, para corregirlo sin salir de la pantalla.'
  ),
  modulo(
    'empezar',
    'orientacion',
    'Orientación',
    'Para cuando todavía no sabe qué actuación necesita. Describa los hechos y el catálogo le propone actuaciones posibles; cada una trae «Redactar esta», que lo lleva a Redacción con la actuación ya elegida.'
  ),
  modulo(
    'registrar',
    'expedientes',
    'Expedientes',
    'El asunto completo y quién está en él. Reúna aquí los documentos del caso —hasta trescientas páginas—, búsquelos por significado y no por palabra exacta, organícelos en carpetas, y prepare el interrogatorio de cada actor con la técnica que le corresponde.'
  ),
  modulo(
    'registrar',
    'audiencias',
    'Audiencias',
    'Suba la grabación de una audiencia y reciba el transcrito con cada interlocutor separado. Puede corregir el texto, dividir una intervención, poner nombre y rol a cada voz, y exportar el acta en Word o PDF.'
  ),
  modulo(
    'registrar',
    'entrevistas',
    'Entrevistas',
    'Grabe la entrevista con el cliente —con su autorización registrada— y obtenga la transcripción atada a su ficha. Al cerrarla, lo que el cliente narró puede pasar como hechos a Redacción.'
  ),
  modulo(
    'consultar',
    'search',
    'Buscador',
    'Busca jurisprudencia en el corpus curado y, cuando ese corpus calla, en las relatorías oficiales. Lo curado y lo automático se muestran en bloques separados, para que se sepa qué leyó una persona y qué no.'
  ),
  modulo(
    'consultar',
    'catalogo',
    'Catálogo',
    'Las actuaciones con su término, su norma y su autoridad, y el estado de cada una. Aquí su firma verifica un término contra el artículo una sola vez, y todos los escritos posteriores lo usan.'
  ),
  modulo(
    'consultar',
    'tools',
    'Herramientas',
    'Calculadoras que muestran su fórmula y su norma: contador de términos, calendario judicial, liquidación de prestaciones, competencia por cuantía, intereses de mora e indexación por IPC, más el glosario jurídico. Las calculadoras exportan a Excel con su hoja de fuentes.'
  ),
  modulo(
    'cuenta',
    'ajustes',
    'Ajustes',
    'La apariencia, los atajos de teclado, los avisos de este dispositivo, los datos de su cuenta con el cierre de sesión, y el plan y la facturación de la firma.'
  ),
  {
    id: 'saldo',
    vista: null,
    objetivos: ['saldo'],
    titulo: 'Saldo y plan',
    texto:
      'El saldo de la firma en pesos: es lo que se consume al generar escritos y revisiones. «Recargar» compra saldo; «Plan» abre la suscripción, que es el derecho a usar la aplicación.',
    capitulo: 'cuenta'
  },
  modulo(
    'ayuda',
    'manual',
    'Manual de uso',
    'El manual, organizado por tarea: qué hace la aplicación, su primer escrito, los tres estados de una afirmación, y cada módulo paso a paso. Desde aquí puede repetir esta visita.'
  ),
  modulo(
    'ayuda',
    'soporte',
    'Soporte',
    'Un chat dentro de la aplicación, guardado en su cuenta y atendido por el operador de la plataforma en horario laboral. Si la firma tiene un número de WhatsApp de soporte configurado, aparece aquí como enlace.'
  ),
  modulo(
    'ayuda',
    'novedades',
    'Novedades',
    'Qué cambió en la aplicación y cuándo, de lo más reciente a lo más antiguo. «Nuevo» marca lo que no ha visto en este navegador, «Le afecta» deja solo lo que toca módulos de su plan, y cada cambio lleva al módulo y al artículo del manual que lo explica.'
  ),
  {
    id: 'marca',
    vista: null,
    objetivos: ['marca'],
    titulo: 'Ir al inicio',
    texto:
      'El logo lleva siempre a Inicio y cierra lo que estuviera abierto en los demás módulos, sin descartar el escrito que tenga en pantalla. Con esto termina la visita: puede repetirla desde Inicio o desde el manual.',
    capitulo: 'ayuda'
  }
];
