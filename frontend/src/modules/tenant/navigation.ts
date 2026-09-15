import { House, File, Lightbulb, Mic, AudioLines, Ellipsis, Sparkles, ClipboardCheck, BookOpen, BookMarked, LifeBuoy, Library, Wrench, Shield, ShieldCheck, SlidersHorizontal, FileClock, FolderOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MainView } from './types';

/**
 * EL ÍCONO DE UN MÓDULO ES UNO SOLO, EN TODAS LAS PANTALLAS.
 *
 * Decisión del propietario (14 de septiembre de 2026). El panel lateral
 * colapsado muestra ÍCONOS, no numerales: el diseño proponía el numeral solo,
 * y un «05» sin etiqueta no le dice a nadie adónde lleva. Pero el defecto real
 * era otro: la barra inferior del teléfono tenía su propia tabla de íconos
 * —los trazos del artboard— y el panel lateral otra —la de `lucide-react`—, de
 * modo que Redacción era un documento en el teléfono y unas chispas en el
 * escritorio, y Orientación una bombilla allá y una brújula acá. El mismo
 * módulo parecía dos sitios.
 *
 * UNA SOLA LIBRERÍA. Los íconos del teléfono no eran de ninguna librería:
 * eran trazos copiados de las maquetas, dibujados al estilo de lucide. Toda la
 * navegación usa ahora `lucide-react` desde esta lista, y cada ícono del
 * teléfono se cambió por el de lucide que corresponde a su dibujo, conservando
 * lo que quiere decir. La barra inferior, la hoja «Más», el panel (colapsado y
 * desplegado) y las puertas de Inicio lo leen de aquí; ninguna pantalla declara
 * íconos de módulo por su cuenta, así que no pueden volver a separarse.
 */
export type NavIcon = LucideIcon;

/**
 * «Más» no es un módulo, pero es navegación y va con la misma librería.
 * TRES PUNTOS EN FILA y no una cuadrícula: la cuadrícula promete una parrilla
 * de aplicaciones, y detrás de «Más» hay una lista.
 */
export const ICONO_MAS: NavIcon = Ellipsis;

/**
 * The product's top-level modules, named once.
 *
 * They used to be declared twice — `navItems` in SidebarLeft and `viewMeta` in
 * HeaderTop — and the two lists had drifted apart completely: every one of the
 * six modules carried a different name in the rail than in the header bar.
 * Redacción became "Redacción & Providencias", Buscador became "Buscador &
 * Sentencias", Catálogo became "Catálogo Procesal". Six modules, twelve names,
 * not one match. A reader clicking "Buscador" landed on a screen titled
 * something else, which is the kind of small dissonance that makes a product
 * feel untidy without anyone being able to point at the reason.
 *
 * Duplication was also a known hazard rather than an accident: the project's own
 * notes said adding a view meant editing four files "or the header breaks", and
 * the header had already shipped without its `audiencias` entry once, taking the
 * whole bar down when it tried to read `.icon` off undefined.
 *
 * One list now. The rail shows label and description; the header shows the label
 * and the icon. Neither can rename a module on its own.
 */
export interface NavModule {
  id: MainView;
  label: string;
  description: string;
  icon: NavIcon;
}

export const NAV_MODULES: NavModule[] = [
  /*
   * INICIO, antes que todo. Es la pantalla a la que se llega al entrar y a la
   * que lleva el logo: los accesos a lo que se hace a diario, lo ultimo que se
   * dejo abierto, el plan y el saldo, y las novedades. Visible para todo plan
   * y todo rol; no depende de ningun modulo del servidor.
   */
  { id: 'inicio', label: 'Inicio', description: 'Su punto de partida', icon: House },
  /*
   * Primero en la lista a propósito.
   *
   * Todos los demás módulos suponen que la pregunta jurídica ya está formada:
   * el buscador quiere una doctrina, la redacción quiere el nombre de un
   * escrito. Quien no sabe ninguna de las dos cosas necesita encontrar esta
   * puerta sin que nadie se la señale.
   */
  {
    id: 'orientacion',
    label: 'Orientación',
    description: 'Desde los hechos del caso',
    /*
     * BOMBILLA, no brújula, y es a propósito: es el dibujo de la maqueta. Una
     * brújula dice «ubíquese»; una bombilla dice «aquí se le ocurre qué hacer»,
     * que es lo que hace Orientación.
     */
    icon: Lightbulb
  },
  /*
   * La hoja con la esquina doblada, sin renglones, como la dibuja la maqueta.
   * `File` y no `FileText`: a 20 px el contorno se lee bien, y los renglones
   * lo acercarían a los otros íconos de hoja de la barra (`FileClock`).
   */
  { id: 'workspace', label: 'Redacción', description: 'Providencias judiciales', icon: File },
  /*
   * EL EXPEDIENTE VA EN «REGISTRAR» Y NO EN «PRODUCIR», aunque de él salga el
   * interrogatorio. Lo que se hace aquí es anotar el asunto y quién está en
   * él; producir es lo que se hace DESPUÉS, con eso ya anotado. Ponerlo entre
   * Redacción y Borradores lo haría parecer un tercer sitio donde se escribe.
   */
  {
    id: 'expedientes',
    label: 'Expedientes',
    description: 'El asunto y quién está en él',
    icon: FolderOpen
  },
  /*
   * Un reloj y no una carpeta, y la descripción habla de términos.
   *
   * Los borradores estaban solo detrás de un botón dentro del panel de
   * redacción, así que para saber qué vence esta semana había que entrar a
   * redactar. Un borrador jurídico no es un archivo que espera: es un plazo que
   * corre, y merece su propia puerta en la barra.
   */
  {
    id: 'borradores',
    label: 'Borradores',
    description: 'Escritos por terminar y sus términos',
    icon: FileClock
  },
  {
    id: 'taller',
    label: 'Revisiones',
    description: 'Corregir un escrito con el revisor',
    icon: ClipboardCheck
  },
  /*
   * ONDAS DE SONIDO Y NO MICRÓFONO. El micrófono es de Entrevistas, que en el
   * teléfono es «Grabar»: ahí se graba con el cliente enfrente. Una audiencia
   * no se graba aquí, se SUBE como archivo y se transcribe; lo que se trabaja
   * es el sonido ya grabado, y eso es lo que dibuja `AudioLines`. Se descartó
   * `FileAudio`: otra hoja con esquina doblada junto a Redacción (`File`) y
   * Borradores (`FileClock`) sería la tercera forma casi igual en el panel
   * colapsado, que es donde no hay etiqueta que las distinga.
   */
  { id: 'audiencias', label: 'Audiencias', description: 'Transcripción de grabaciones', icon: AudioLines },
  {
    id: 'entrevistas',
    label: 'Entrevistas',
    description: 'Clientes y sus declaraciones',
    icon: Mic
  },
  { id: 'search', label: 'Buscador', description: 'Sentencias & precedentes', icon: BookOpen },
  { id: 'catalogo', label: 'Catálogo', description: 'Actuaciones y términos verificados', icon: Library },
  { id: 'tools', label: 'Herramientas', description: 'Cálculos & utilidades', icon: Wrench },
  { id: 'audit', label: 'Seguridad', description: 'Auditoría & gestión', icon: Shield },
  {
    id: 'privacidad',
    label: 'Privacidad',
    description: 'Quién procesa tus datos',
    icon: ShieldCheck
  },
  /*
   * "Aprender" es su propio grupo y no un pie de página.
   *
   * El manual y el soporte se buscan cuando algo ya salió mal, que es el peor
   * momento para tener que encontrarlos. Van en la barra, con el mismo peso que
   * lo demás, en vez de detrás de un signo de interrogación en una esquina.
   */
  { id: 'manual', label: 'Manual de uso', description: 'Cómo se usa, por tarea', icon: BookMarked },
  { id: 'soporte', label: 'Soporte', description: 'Cómo pedir ayuda', icon: LifeBuoy },
  /*
   * NOVEDADES, 13 · APRENDER, después de Soporte (`app-novedades.html`:269).
   * Informativo y de TODA firma: no está en `VISTA_POR_MODULO`, así que ningún
   * plan ni rol la oculta, igual que Manual y Soporte. Vivía como una página
   * dentro del Manual; ahora es módulo propio porque el panel cuenta lo nuevo
   * a su lado y porque una lista que crece no es un artículo que se lee una vez.
   * Las chispas son el mismo dibujo que ya tenía su entrada en el Manual.
   */
  { id: 'novedades', label: 'Novedades', description: 'Qué cambió y cuándo', icon: Sparkles },
  { id: 'ajustes', label: 'Ajustes', description: 'Apariencia y firma', icon: SlidersHorizontal }
];

/**
 * Los cuatro grupos de la barra lateral, nombrados con VERBOS.
 *
 * POR QUÉ VERBOS Y NO CATEGORÍAS. El abogado llega con una intención, no con un
 * módulo en mente: quiere producir un escrito, registrar lo que pasó en una
 * audiencia, consultar una fuente. Nueve elementos planos lo obligaban a leer
 * los nueve para encontrar el suyo; cuatro verbos lo llevan al grupo correcto
 * antes de leer una sola etiqueta.
 *
 * EL ORDEN DENTRO DE "PRODUCIR" CAMBIÓ, y vale decir por qué. Orientación
 * estaba primera en toda la barra para que quien no sabe qué preguntar
 * encontrara esa puerta sin que nadie se la señalara. Con los grupos esa razón
 * ya no aplica: "Producir" es el primer bloque, siempre visible, y Orientación
 * es el segundo de dos elementos. Se encuentra igual, y Redacción —que es el
 * uso diario— recupera el primer lugar.
 */
export interface NavGroup {
  /** El verbo. Va en mono, versales y tracking amplio: es etiqueta, no título. */
  titulo: string;
  modulos: MainView[];
  /**
   * Los grupos plegables arrancan cerrados. Solo "Administrar", que se consulta
   * una vez al mes y no debe competir con el trabajo diario.
   */
  plegable?: boolean;
  /**
   * Sin rotulo en la barra: el grupo de «Inicio» tiene un solo modulo y un
   * rotulo «INICIO» sobre un item «Inicio» diria lo mismo dos veces.
   */
  sinTitulo?: boolean;
}

export const NAV_GROUPS: NavGroup[] = [
  { titulo: 'Inicio', modulos: ['inicio'], sinTitulo: true },
  { titulo: 'Producir', modulos: ['workspace', 'borradores', 'taller', 'orientacion'] },
  { titulo: 'Registrar', modulos: ['expedientes', 'audiencias', 'entrevistas'] },
  { titulo: 'Consultar', modulos: ['search', 'catalogo', 'tools'] },
  { titulo: 'Aprender', modulos: ['manual', 'soporte', 'novedades'] },
  { titulo: 'Administrar', modulos: ['audit', 'privacidad', 'ajustes'], plegable: true }
];

/**
 * EL NUMERAL DE CADA MÓDULO, FIJO POR IDENTIDAD Y NO POR LO QUE SE VE.
 *
 * Antes el panel contaba solo los módulos visibles: a una firma Esencial, sin
 * Orientación, Expedientes pasaba de «05» a «04» y todo lo de abajo corría un
 * puesto. El numeral dejaba de ser un nombre y se volvía una posición, y el
 * manual, el diseño (README-app §1: Producir 01–04 · Registrar 05–07 ·
 * Consultar 08–10 · Aprender 11–12, igual que `plan.catalog.ts`) y el soporte
 * no pueden decir «vaya al 05» si el 05 cambia de firma a firma. Ahora un
 * módulo oculto deja su número sin usar, como una página arrancada de un
 * índice, y el resto conserva el suyo.
 *
 * Se calcula una sola vez del orden de `NAV_GROUPS`, saltando Inicio, que es la
 * casa y no una entrada del índice. «Administrar» sigue la cuenta (13–15), que
 * es lo que ya mostraba el panel cuando nada estaba oculto: sus módulos no los
 * recorta ningún plan, así que su número tampoco se movía, y la columna del
 * índice queda alineada al desplegar el grupo.
 */
export const NUMERAL_DE_MODULO: Readonly<Partial<Record<MainView, string>>> = (() => {
  const numerales: Partial<Record<MainView, string>> = {};
  let n = 0;
  for (const grupo of NAV_GROUPS) {
    for (const id of grupo.modulos) {
      if (id === 'inicio') continue;
      n += 1;
      numerales[id] = String(n).padStart(2, '0');
    }
  }
  return numerales;
})();

/**
 * Comprueba que los grupos cubren todos los módulos, sin sobras ni faltantes.
 *
 * Un módulo que se agregue a `NAV_MODULES` y no a un grupo desaparece de la
 * barra: existe, funciona, y nadie lo encuentra. Es exactamente la clase de
 * defecto que no lanza error — por eso se comprueba aquí y no se confía.
 */
export const modulosSinGrupo = (): MainView[] => {
  const enGrupos = new Set(NAV_GROUPS.flatMap((g) => g.modulos));
  return NAV_MODULES.filter((m) => !enGrupos.has(m.id)).map((m) => m.id);
};

/**
 * The views a module closes, by the module name the server uses.
 *
 * The plan gates three of them — Audiencias, Entrevistas, Orientación — and the
 * server enforces that gate (403 PLAN_INSUFICIENTE); hiding them spares an
 * ESENCIAL firm a door that opens onto a refusal. The operator can ALSO switch
 * any module off for one firm above its plan (`modulosDesactivados`), so every
 * module with a view of its own is mapped here: the server already sends the
 * list with the subtraction applied, and this map only turns module ids into
 * doors. Manual, Soporte and Membrete are not here on purpose: the first two
 * are how a firm asks for help, and Membrete is a section of Ajustes, not a
 * view. A NULL list (server not answered) hides nothing.
 */
export const VISTA_POR_MODULO: Partial<Record<string, MainView>> = {
  REDACCION: 'workspace',
  EXPEDIENTES: 'expedientes',
  BORRADORES: 'borradores',
  REVISIONES: 'taller',
  ORIENTACION: 'orientacion',
  AUDIENCIAS: 'audiencias',
  ENTREVISTAS: 'entrevistas',
  BUSCADOR: 'search',
  CATALOGO: 'catalogo',
  HERRAMIENTAS: 'tools'
};

export const vistasOcultasPorPlan = (modulosPermitidos: readonly string[] | null): MainView[] => {
  if (!modulosPermitidos) return [];
  return Object.entries(VISTA_POR_MODULO)
    .filter(([modulo]) => !modulosPermitidos.includes(modulo))
    .map(([, vista]) => vista as MainView);
};

/** The server-side module id behind a view, or null for views no module gates. */
export const moduloDeVista = (vista: MainView): string | null =>
  Object.entries(VISTA_POR_MODULO).find(([, v]) => v === vista)?.[0] ?? null;

/**
 * Falls back instead of throwing: reading `.icon` off an unknown view is what
 * took the header down before. An unnamed module is a bug, but a blank header
 * bar hides every other module too.
 */
export const navModule = (view: MainView | string): NavModule =>
  NAV_MODULES.find((m) => m.id === view) ?? {
    id: view as MainView,
    label: 'Módulo',
    description: '',
    icon: Sparkles
  };
