import React, { useState } from 'react';
import { Bell, Building2, CreditCard, Keyboard, Palette, User } from 'lucide-react';
import { usePreferences } from '../preferences';
import { AppearanceSection } from './AppearanceSection';
import { AtajosSection, AvisosSection, CuentaSection, PlanSection } from './SeccionesSuyas';
import { FirmBrandingModal } from '../../tenant/components/FirmBrandingModal';
import { FirmUsersDialog } from '../../tenant/components/FirmUsersDialog';
import { useTenant } from '../../tenant/TenantContext';

/**
 * Ajustes, dividido en "Suyos" y "De la firma".
 *
 * LA DIVISIÓN SE DICE POR ESCRITO, no se insinúa con un separador. El error más
 * caro en una aplicación de despacho es cambiarle el membrete a todos creyendo
 * que se cambiaba el propio, y la única defensa que funciona es que la pantalla
 * lo afirme antes de que alguien toque algo.
 *
 * YA NO HAY ENTRADAS «PRONTO». Las ocho abren algo real: la marca vive en la
 * firma, el formato viaja al motor que escribe, los usuarios salen de Supabase
 * Auth, el plan lo sirve el backend de suscripciones, los avisos son el Web
 * Push de este dispositivo y los atajos son los que los componentes escuchan.
 * Lo único que sigue sin existir —cambiar la contraseña desde aquí— lo dice la
 * propia sección de la cuenta.
 */

type Seccion = 'apariencia' | 'atajos' | 'avisos' | 'cuenta' | 'plan';

interface Entrada {
  id: Seccion | 'documento' | 'membrete' | 'usuarios';
  label: string;
  icono: React.ComponentType<{ className?: string }>;
}

const SUYOS: Entrada[] = [
  { id: 'apariencia', label: 'Apariencia', icono: Palette },
  { id: 'atajos', label: 'Atajos de teclado', icono: Keyboard },
  { id: 'avisos', label: 'Avisos', icono: Bell },
  { id: 'cuenta', label: 'Su cuenta', icono: User }
];

const DE_LA_FIRMA: Entrada[] = [
  { id: 'documento', label: 'Documento y formato', icono: Building2 },
  { id: 'membrete', label: 'Marca y membrete', icono: Building2 },
  { id: 'usuarios', label: 'Usuarios y roles', icono: Building2 },
  { id: 'plan', label: 'Plan y facturación', icono: CreditCard }
];

interface SettingsViewProps {
  /** Cerrar la sesión de este dispositivo, desde «Su cuenta». */
  onLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onLogout }) => {
  const [seccion, setSeccion] = useState<Seccion>('apariencia');
  const { prefs, cambiar } = usePreferences();
  const { activeFirm } = useTenant();
  const [marcaAbierta, setMarcaAbierta] = useState(false);
  const [usuariosAbierto, setUsuariosAbierto] = useState(false);

  const abrirEntrada = (id: Entrada['id']) => {
    if (id === 'documento' || id === 'membrete') setMarcaAbierta(true);
    else if (id === 'usuarios') setUsuariosAbierto(true);
    else setSeccion(id);
  };

  const Grupo: React.FC<{ titulo: string; entradas: Entrada[] }> = ({ titulo, entradas }) => (
    <div className="mb-5">
      <p className="mb-1.5 px-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
        {titulo}
      </p>
      {entradas.map((e) => {
        const activa = e.id === seccion;
        return (
          <button
            key={e.id}
            onClick={() => abrirEntrada(e.id)}
            className={`flex w-full items-center gap-2 rounded-control px-2 py-[7px] text-left text-ui transition-colors ${
              activa ? 'bg-brand-50 font-medium text-brand-700' : 'text-ink-700 hover:bg-canvas'
            }`}
          >
            <span className="truncate">{e.label}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-canvas">
      {/*
        EN MOVIL AJUSTES SE APILA (8d). Las dos columnas son 212px de indice mas
        el contenido: en 375 el indice se lleva mas de la mitad y la seccion
        queda en una franja. Apilado, el indice es lo primero que se lee —que es
        el orden natural: se escoge que ajustar y luego se ajusta.
      */}
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:gap-8">
        <nav className="w-full shrink-0 lg:w-[212px]">
          <h1 className="mb-4 hidden px-2 text-title text-ink-900 lg:block">Ajustes</h1>
          <Grupo titulo="Suyos" entradas={SUYOS} />
          <Grupo titulo="De la firma" entradas={DE_LA_FIRMA} />

          <p className="mt-2 px-2 text-meta leading-[1.5] text-ink-500">
            Lo de <b className="font-semibold text-ink-700">De la firma</b> lo cambia un socio y
            aplica a todos. Lo suyo no afecta a nadie más.
          </p>
        </nav>

        <main className="min-w-0 flex-1">
          {seccion === 'apariencia' && <AppearanceSection prefs={prefs} cambiar={cambiar} />}
          {seccion === 'atajos' && <AtajosSection />}
          {seccion === 'avisos' && <AvisosSection />}
          {seccion === 'cuenta' && <CuentaSection onLogout={onLogout} />}
          {seccion === 'plan' && <PlanSection />}
        </main>

        <FirmBrandingModal isOpen={marcaAbierta} onClose={() => setMarcaAbierta(false)} />
        <FirmUsersDialog
          isOpen={usuariosAbierto}
          onClose={() => setUsuariosAbierto(false)}
          firmName={activeFirm?.name ?? ''}
          firmNit={activeFirm?.nit}
        />
      </div>
    </div>
  );
};
