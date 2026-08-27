import { Sparkles, Mic, BookOpen, Library, Wrench, Shield, UserRound, ShieldCheck } from 'lucide-react';
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
  { id: 'workspace', label: 'Redacción', description: 'Providencias judiciales', icon: Sparkles },
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
  }
];

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
