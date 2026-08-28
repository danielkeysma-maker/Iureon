import { Sparkles, Mic, BookOpen, BookMarked, LifeBuoy, Library, Wrench, Shield, UserRound, ShieldCheck, Compass, SlidersHorizontal, FileClock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MainView } from './types';

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
  icon: LucideIcon;
}

export const NAV_MODULES: NavModule[] = [
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
    icon: Compass
  },
  { id: 'workspace', label: 'Redacción', description: 'Providencias judiciales', icon: Sparkles },
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
  { id: 'audiencias', label: 'Audiencias', description: 'Transcripción de grabaciones', icon: Mic },
  {
    id: 'entrevistas',
    label: 'Entrevistas',
    description: 'Clientes y sus declaraciones',
    icon: UserRound
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
}

export const NAV_GROUPS: NavGroup[] = [
  { titulo: 'Producir', modulos: ['workspace', 'borradores', 'orientacion'] },
  { titulo: 'Registrar', modulos: ['audiencias', 'entrevistas'] },
  { titulo: 'Consultar', modulos: ['search', 'catalogo', 'tools'] },
  { titulo: 'Aprender', modulos: ['manual', 'soporte'] },
  { titulo: 'Administrar', modulos: ['audit', 'privacidad', 'ajustes'], plegable: true }
];

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
