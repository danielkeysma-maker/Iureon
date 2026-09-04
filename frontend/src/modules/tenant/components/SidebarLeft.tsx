import React, { useState } from 'react';
import {
  Bell,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings,
  Shield,
  User
} from 'lucide-react';
import type { LawFirmTenant } from '../types';
import type { MainView } from '../types';
import { NAV_GROUPS, NAV_MODULES, navModule } from '../navigation';
import { IureonMark } from './IureonMark';
import { solicitarAbrirNovedades, useNovedadesNuevas } from '../../help/useNovedades';

interface SidebarLeftProps {
  mainView: MainView;
  setMainView: (view: MainView) => void;
  activeFirm: LawFirmTenant;
  setActiveFirm: (firm: LawFirmTenant) => void;
  sampleFirms: LawFirmTenant[];
  isFirmDropdownOpen: boolean;
  setIsFirmDropdownOpen: (open: boolean) => void;
  onOpenBrandingModal: () => void;
  onOpenSubscriptionModal: () => void;
  /** Avisos en este dispositivo (Web Push). Vive en el pie, junto a Membrete: es ajuste, no módulo. */
  onOpenAvisos?: () => void;
  onOpenUserManagementModal?: () => void;
  onOpenRechargeModal?: () => void;
  isSuperUser?: boolean;
  isParticularUser?: boolean;
  /**
   * Trabajo pendiente de un humano, por módulo.
   *
   * SOLO ESO. El diseño es explícito: los dos únicos contadores de la barra
   * significan transcripciones por revisar y actuaciones por curar, y ningún
   * badge es decorativo. Mientras nadie los calcule de verdad, no se pintan —
   * un "2" inventado en la barra es la misma clase de adorno que la pastilla
   * verde de "Cifrado" que ya se quitó de aquí por afirmar lo que nadie medía.
   */
  pendientes?: Partial<Record<MainView, number>>;
  /**
   * Módulos que el plan de la firma no incluye. No se pintan: una puerta que
   * abre sobre un 403 es peor que ninguna. Vacío = se ven todos.
   */
  ocultas?: readonly MainView[];
}

/** Ancho expandido y ancho del riel. El riel es el mismo componente. */
const ANCHO = 'w-[224px]';
const RIEL = 'w-[56px]';

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  mainView,
  setMainView,
  activeFirm,
  setActiveFirm,
  sampleFirms,
  isFirmDropdownOpen,
  setIsFirmDropdownOpen,
  onOpenBrandingModal,
  onOpenSubscriptionModal,
  onOpenAvisos,
  onOpenUserManagementModal,
  onOpenRechargeModal,
  isSuperUser = false,
  isParticularUser = false,
  pendientes = {},
  ocultas = []
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [administrarAbierto, setAdministrarAbierto] = useState(false);
  const novedadesNuevas = useNovedadesNuevas();

  const contexto = isSuperUser
    ? { nombre: 'SuperUsuario', detalle: 'Acceso total · sin firma', Icono: Shield }
    : isParticularUser
    ? { nombre: 'Abogado particular', detalle: 'Uso personal · sin firma', Icono: User }
    : { nombre: activeFirm.name, detalle: activeFirm.nit || 'Sin NIT', Icono: Building2 };

  /** Un módulo de la barra. El mismo en riel y expandida. */
  const Item = ({ id }: { id: MainView }) => {
    const { label, icon: Icon } = navModule(id);
    const activo = mainView === id;
    const pendiente = pendientes[id];

    return (
      <button
        type="button"
        onClick={() => setMainView(id)}
        title={isCollapsed ? label : undefined}
        aria-current={activo ? 'page' : undefined}
        className={`flex w-full items-center gap-2.5 rounded-control px-2 py-[7px] text-left transition-colors ${
          isCollapsed ? 'justify-center' : ''
        } ${
          activo
            ? // La barra izquierda de 2px es la señal de "aquí estoy": sobrevive
              // al riel comprimido, donde la etiqueta ya no está.
              'bg-nav-active shadow-[inset_2px_0_0_rgb(var(--nav-accent))]'
            : 'hover:bg-white/5'
        }`}
      >
        <Icon
          className={`h-[15px] w-[15px] shrink-0 ${activo ? 'text-white' : 'text-nav-ink'}`}
          strokeWidth={2}
        />
        {!isCollapsed && (
          <>
            <span className={`truncate text-ui ${activo ? 'font-medium text-white' : 'text-nav-ink'}`}>
              {label}
            </span>
            {pendiente !== undefined && pendiente > 0 && (
              <span className="ml-auto shrink-0 rounded-full bg-white/10 px-1.5 font-mono text-[10px] font-semibold text-nav-ink">
                {pendiente}
              </span>
            )}
          </>
        )}
      </button>
    );
  };

  return (
    <aside
      className={`flex h-full flex-col border-r border-nav-line bg-nav font-sans transition-[width] duration-200 ${
        isCollapsed ? RIEL : ANCHO
      }`}
    >
      {/* ─── MARCA ─────────────────────────────────────────────────────────
          El logo va a casa. Ahora que una recarga deja al abogado en el módulo
          que estaba leyendo, salir de uno tiene que ser algo que pueda pedir. */}
      <div className={`flex items-center gap-2.5 px-3 pb-3 pt-3.5 ${isCollapsed ? 'justify-center' : ''}`}>
        <button
          type="button"
          onClick={() => setMainView('workspace')}
          title="Ir a Redacción"
          className="flex items-center gap-2.5 rounded-control transition-opacity hover:opacity-80"
        >
          <IureonMark size={22} mono className="shrink-0 text-nav-accent" />
          {!isCollapsed && (
            <span className="text-subtitle tracking-[0.02em] text-white">Iureon</span>
          )}
        </button>
      </div>

      {/* ─── CONTEXTO: LA FIRMA ────────────────────────────────────────────
          Debajo de la marca y en un renglón, no en una tarjeta con degradado.
          Es contexto permanente: quién soy y con qué firma trabajo. */}
      {!isCollapsed ? (
        <div className="relative px-3 pb-3">
          <button
            type="button"
            onClick={() => setIsFirmDropdownOpen(!isFirmDropdownOpen)}
            className="flex w-full items-center gap-2 rounded-control px-1 py-1 text-left hover:bg-white/5"
          >
            <contexto.Icono className="h-3.5 w-3.5 shrink-0 text-nav-muted" />
            <span className="min-w-0 flex-1 truncate text-meta text-nav-ink">{contexto.nombre}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-nav-muted" />
          </button>

          {isFirmDropdownOpen && (
            <div className="surface-raised absolute left-3 right-3 top-full z-30 mt-1 overflow-hidden py-1">
              {(isSuperUser || isParticularUser) && (
                <p className="border-b border-line-100 px-3 py-2 text-label uppercase text-ink-500">
                  {contexto.detalle}
                </p>
              )}
              {sampleFirms.map((firm) => (
                <button
                  key={firm.id}
                  onClick={() => {
                    setActiveFirm(firm);
                    setIsFirmDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-ui hover:bg-canvas ${
                    firm.id === activeFirm.id ? 'font-medium text-brand-700' : 'text-ink-700'
                  }`}
                >
                  <span className="truncate">{firm.name}</span>
                  {firm.id === activeFirm.id && (
                    <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-brand-700" />
                  )}
                </button>
              ))}
              {onOpenUserManagementModal && (
                <div className="mt-1 border-t border-line-100 p-1">
                  <button
                    onClick={() => {
                      setIsFirmDropdownOpen(false);
                      onOpenUserManagementModal();
                    }}
                    className="btn-secondary btn-sm w-full"
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Firmas y usuarios
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-center pb-3" title={contexto.nombre}>
          <contexto.Icono className="h-4 w-4 text-nav-muted" />
        </div>
      )}

      {/* ─── LOS CUATRO GRUPOS ─────────────────────────────────────────────*/}
      <nav className="flex-1 overflow-y-auto px-3">
        {NAV_GROUPS.map((grupo, i) => {
          const abierto = !grupo.plegable || administrarAbierto;

          return (
            <div key={grupo.titulo} className={i > 0 ? 'mt-4' : ''}>
              {!isCollapsed &&
                (grupo.plegable ? (
                  <button
                    type="button"
                    onClick={() => setAdministrarAbierto((v) => !v)}
                    className="flex w-full items-center gap-1 px-1.5 pb-[7px] text-left"
                    aria-expanded={abierto}
                  >
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-nav-muted">
                      {grupo.titulo}
                    </span>
                    <ChevronRight
                      className={`h-3 w-3 text-nav-muted transition-transform ${abierto ? 'rotate-90' : ''}`}
                    />
                  </button>
                ) : (
                  <p className="px-1.5 pb-[7px] font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-nav-muted">
                    {grupo.titulo}
                  </p>
                ))}

              {/*
                En el riel comprimido el grupo plegable se abre siempre: sin
                etiquetas no hay forma de saber que hay algo escondido, y un
                módulo invisible es un módulo que no existe.
              */}
              {(abierto || isCollapsed) && (
                <div className="space-y-0.5">
                  {grupo.modulos
                    .filter((id) => !ocultas.includes(id))
                    .map((id) => (
                      <Item key={id} id={id} />
                    ))}
                </div>
              )}
            </div>
          );
        })}

        {/*
          Un módulo que exista y no esté en ningún grupo desaparecería de la
          barra en silencio. Aquí se ve, en desarrollo, antes que en producción.
        */}
        {import.meta.env.DEV &&
          NAV_MODULES.filter((m) => !NAV_GROUPS.some((g) => g.modulos.includes(m.id))).map((m) => (
            <p key={m.id} className="mt-2 px-1.5 text-meta text-unverified">
              ⚠ {m.label} no está en ningún grupo
            </p>
          ))}
      </nav>

      {/* ─── SALDO ─────────────────────────────────────────────────────────
          Vive en la barra y no en un menú: es lo único que puede detener el
          trabajo a mitad de un término. */}
      <div className="mt-auto px-3 pt-3">
        <div className="border-t border-white/10 pt-3">
          {!isCollapsed ? (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-nav-muted">
                  Saldo
                </span>
                {/*
                  Dos puertas, dos cosas distintas: «Recargar» compra saldo de
                  consumo; «Plan» paga el derecho a usar la aplicación. Juntas
                  aquí porque las dos son dinero y las dos las decide un socio.
                */}
                <button
                  onClick={onOpenSubscriptionModal}
                  className="ml-auto text-[11px] font-medium text-nav-accent hover:underline"
                >
                  Plan
                </button>
                <button
                  onClick={onOpenRechargeModal || onOpenSubscriptionModal}
                  className="text-[11px] font-medium text-nav-accent hover:underline"
                >
                  Recargar
                </button>
              </div>
              {/* En mono porque es un dato, no interfaz. */}
              <p className="mt-1 font-mono text-[15px] font-semibold text-white">
                ${(activeFirm.creditsBalance ?? 0).toLocaleString('es-CO')}
              </p>
            </>
          ) : (
            <button
              onClick={onOpenRechargeModal || onOpenSubscriptionModal}
              title={`Saldo $${(activeFirm.creditsBalance ?? 0).toLocaleString('es-CO')}`}
              className="mx-auto block font-mono text-[10px] font-semibold text-nav-accent"
            >
              $
            </button>
          )}
        </div>
      </div>

      {/*
        EL SELLO DE VERSION. Un deploy "Ready" en Vercel no prueba lo que ESTE
        navegador corre: una pestana abierta de ayer sirve la version de ayer
        para siempre. Con el commit a la vista, "no veo los cambios" se
        responde en un segundo comparando dos hashes — sin adivinar cachés.
      */}
      {!isCollapsed && (
        <button
          type="button"
          onClick={() => {
            solicitarAbrirNovedades();
            setMainView('manual');
          }}
          title="Ver qué cambió en esta versión"
          className="mx-auto flex items-center gap-1.5 px-4 pb-1 font-mono text-[9px] tracking-wider text-nav-muted/60 hover:text-nav-muted"
        >
          {/* El punto dice que hay cambios que este navegador no ha visto en Novedades. */}
          {novedadesNuevas > 0 && (
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-nav-accent" aria-hidden />
          )}
          v. {__COMMIT__}
        </button>
      )}

      {/* ─── PIE: MEMBRETE Y RIEL ──────────────────────────────────────────*/}
      <div className={`flex items-center gap-1 px-3 py-3 ${isCollapsed ? 'flex-col' : ''}`}>
        <button
          onClick={onOpenBrandingModal}
          title="Membrete de la firma"
          className={`flex items-center gap-2 rounded-control px-2 py-1.5 text-meta text-nav-ink hover:bg-white/5 ${
            isCollapsed ? '' : 'flex-1'
          }`}
        >
          <Settings className="h-3.5 w-3.5 shrink-0 text-nav-muted" />
          {!isCollapsed && <span>Membrete</span>}
        </button>

        {onOpenAvisos && (
          <button
            onClick={onOpenAvisos}
            title="Avisos en este dispositivo"
            aria-label="Avisos en este dispositivo"
            className="flex items-center gap-2 rounded-control px-2 py-1.5 text-meta text-nav-ink hover:bg-white/5"
          >
            <Bell className="h-3.5 w-3.5 shrink-0 text-nav-muted" />
            {!isCollapsed && <span>Avisos</span>}
          </button>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expandir' : 'Comprimir'}
          aria-label={isCollapsed ? 'Expandir la barra' : 'Comprimir la barra'}
          className="rounded-control p-1.5 text-nav-muted hover:bg-white/5 hover:text-nav-ink"
        >
          {isCollapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
};
