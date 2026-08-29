import React, { useState } from 'react';
import { Building2, Palette, User } from 'lucide-react';
import { usePreferences } from '../preferences';
import { AppearanceSection } from './AppearanceSection';
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
 * LO QUE NO ESTÁ CONSTRUIDO SE MARCA, NO SE DIBUJA. Design entregó también
 * Documento y formato, Marca y membrete, Usuarios y roles, y Plan y facturación.
 * Esas cuatro necesitan backend que todavía no existe, y una pantalla dibujada
 * sin nada detrás es una maqueta que parece producto: el abogado la toca, no
 * pasa nada, y a partir de ahí desconfía también de lo que sí funciona.
 */

type Seccion = 'apariencia';

interface Entrada {
  id: Seccion | string;
  label: string;
  icono: React.ComponentType<{ className?: string }>;
  /** Sin backend todavía. Se lista para que se sepa que viene, y no se abre. */
  pendiente?: boolean;
}

const SUYOS: Entrada[] = [
  { id: 'apariencia', label: 'Apariencia', icono: Palette },
  { id: 'atajos', label: 'Atajos de teclado', icono: User, pendiente: true },
  { id: 'avisos', label: 'Avisos', icono: User, pendiente: true },
  { id: 'cuenta', label: 'Su cuenta', icono: User, pendiente: true }
];

/*
 * Tres de las cuatro dejaron de ser "pronto": la marca vive en la firma
 * (firms.branding), el formato viaja al motor que escribe, y los usuarios
 * salen de Supabase Auth con su consumo del mes. Documento y formato ES la
 * seccion de formato del mismo dialogo de marca — separarlos duplicaria el
 * formulario que decide una sola cosa. Plan y facturacion sigue pendiente:
 * la facturacion electronica esta en cola con nombre propio.
 */
const DE_LA_FIRMA: Entrada[] = [
  { id: 'documento', label: 'Documento y formato', icono: Building2 },
  { id: 'membrete', label: 'Marca y membrete', icono: Building2 },
  { id: 'usuarios', label: 'Usuarios y roles', icono: Building2 },
  { id: 'plan', label: 'Plan y facturación', icono: Building2, pendiente: true }
];

export const SettingsView: React.FC = () => {
  const [seccion, setSeccion] = useState<Seccion>('apariencia');
  const { prefs, cambiar } = usePreferences();
  const { activeFirm } = useTenant();
  const [marcaAbierta, setMarcaAbierta] = useState(false);
  const [usuariosAbierto, setUsuariosAbierto] = useState(false);

  const abrirEntrada = (id: string) => {
    if (id === 'documento' || id === 'membrete') setMarcaAbierta(true);
    else if (id === 'usuarios') setUsuariosAbierto(true);
    else setSeccion(id as Seccion);
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
            disabled={e.pendiente}
            onClick={() => !e.pendiente && abrirEntrada(e.id)}
            title={e.pendiente ? 'Todavía no está construido' : undefined}
            className={`flex w-full items-center gap-2 rounded-control px-2 py-[7px] text-left text-ui transition-colors ${
              activa
                ? 'bg-brand-50 font-medium text-brand-700'
                : e.pendiente
                ? 'cursor-not-allowed text-ink-400'
                : 'text-ink-700 hover:bg-canvas'
            }`}
          >
            <span className="truncate">{e.label}</span>
            {e.pendiente && (
              <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400">
                pronto
              </span>
            )}
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
          <h1 className="mb-4 px-2 text-title text-ink-900">Ajustes</h1>
          <Grupo titulo="Suyos" entradas={SUYOS} />
          <Grupo titulo="De la firma" entradas={DE_LA_FIRMA} />

          <p className="mt-2 px-2 text-meta leading-[1.5] text-ink-500">
            Lo de <b className="font-semibold text-ink-700">De la firma</b> lo cambia un socio y
            aplica a todos. Lo suyo no afecta a nadie más.
          </p>
        </nav>

        <main className="min-w-0 flex-1">
          {seccion === 'apariencia' && <AppearanceSection prefs={prefs} cambiar={cambiar} />}
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
