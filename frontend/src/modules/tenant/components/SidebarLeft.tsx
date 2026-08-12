import React, { useState } from 'react';
import {
  Scale,
  Building2,
  ChevronDown,
  Check,
  Sparkles,
  BookOpen,
  Wrench,
  Shield,
  Settings,
  ShieldCheck,
  CreditCard,
  ChevronsLeft,
  ChevronsRight,
  User, Mic, Library } from 'lucide-react';
import type { LawFirmTenant } from './Header';
import type { MainView } from '../types';

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
  onOpenUserManagementModal?: () => void;
  onOpenRechargeModal?: () => void;
  isSuperUser?: boolean;
  isParticularUser?: boolean;
}

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
  onOpenUserManagementModal,
  onOpenRechargeModal,
  isSuperUser = false,
  isParticularUser = false
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'workspace' as const, label: 'Redacción', icon: Sparkles, description: 'Providencias judiciales' },
    { id: 'audiencias' as const, label: 'Audiencias', icon: Mic, description: 'Transcripción de grabaciones' },
    { id: 'search' as const, label: 'Buscador', icon: BookOpen, description: 'Sentencias & precedentes' },
    { id: 'catalogo' as const, label: 'Catálogo', icon: Library, description: 'Actuaciones y términos verificados' },
    { id: 'tools' as const, label: 'Herramientas', icon: Wrench, description: 'Cálculos & utilidades' },
    { id: 'audit' as const, label: 'Seguridad', icon: Shield, description: 'Auditoría & gestión' }
  ];

  return (
    <aside
      className={`bg-white border-r border-slate-200/80 flex flex-col h-full transition-all duration-300 relative select-none font-sans ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* BRAND HEADER */}
      <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-950 text-white flex items-center justify-center font-black text-sm shadow-xs border border-blue-900">
              <Scale className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <div className="font-black text-slate-900 tracking-tight text-base leading-none">IUREON</div>
              <div className="text-[10px] font-semibold text-slate-400 mt-0.5">LegalTech Colombia</div>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-blue-950 text-white flex items-center justify-center font-black text-sm mx-auto shadow-xs border border-blue-900">
            <Scale className="w-5 h-5 text-blue-200" />
          </div>
        )}
      </div>

      {/* FIRM SWITCHER DROPDOWN / USER CONTEXT */}
      <div className="p-3 border-b border-slate-200/80 bg-slate-50/50">
        {!isCollapsed ? (
          <div className="relative">
            {isSuperUser ? (
              <button
                onClick={() => setIsFirmDropdownOpen(!isFirmDropdownOpen)}
                className="w-full p-2.5 bg-gradient-to-r from-slate-950 to-blue-950 text-white border border-blue-900/80 rounded-xl text-left hover:border-blue-700 transition-all shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Shield className="w-4 h-4 text-blue-300 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-white text-xs truncate flex items-center gap-1">
                      <span>SuperUsuario Global</span>
                    </div>
                    <div className="text-[10px] text-blue-300/90 truncate font-semibold">Acceso Total (Sin Firma)</div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-blue-300 flex-shrink-0" />
              </button>
            ) : isParticularUser ? (
              <button
                onClick={() => setIsFirmDropdownOpen(!isFirmDropdownOpen)}
                className="w-full p-2.5 bg-gradient-to-r from-teal-950 to-slate-900 text-white border border-teal-800/80 rounded-xl text-left hover:border-teal-600 transition-all shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <User className="w-4 h-4 text-teal-300 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-white text-xs truncate flex items-center gap-1">
                      <span>Abogado Particular</span>
                    </div>
                    <div className="text-[10px] text-teal-300/90 truncate font-semibold">Sin Firma (Uso Personal)</div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-teal-300 flex-shrink-0" />
              </button>
            ) : (
              <button
                onClick={() => setIsFirmDropdownOpen(!isFirmDropdownOpen)}
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-left hover:border-slate-300 transition-all shadow-2xs flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Building2 className="w-4 h-4 text-blue-900 flex-shrink-0" />
                  <div className="truncate">
                    <div className="font-bold text-slate-900 text-xs truncate">{activeFirm.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 truncate">{activeFirm.nit}</div>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>
            )}

            {isFirmDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 overflow-hidden py-1">
                {isSuperUser ? (
                  <div className="px-3 py-2 bg-slate-900 text-white text-[11px] font-bold border-b border-slate-800 flex items-center justify-between">
                    <span>Contexto: SuperUsuario Global</span>
                    <span className="text-[9px] bg-blue-500/30 text-blue-200 px-1.5 py-0.5 rounded uppercase">ROOT</span>
                  </div>
                ) : isParticularUser ? (
                  <div className="px-3 py-2 bg-teal-950 text-white text-[11px] font-bold border-b border-teal-900 flex items-center justify-between">
                    <span>Contexto: Abogado Particular</span>
                    <span className="text-[9px] bg-teal-500/30 text-teal-200 px-1.5 py-0.5 rounded uppercase">SIN FIRMA</span>
                  </div>
                ) : null}
                {sampleFirms.map((firm) => (
                  <button
                    key={firm.id}
                    onClick={() => {
                      setActiveFirm(firm);
                      setIsFirmDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors flex items-center justify-between text-xs ${
                      firm.id === activeFirm.id ? 'bg-blue-50/50 text-blue-900 font-semibold' : 'text-slate-700'
                    }`}
                  >
                    <span className="truncate">{firm.name}</span>
                    {firm.id === activeFirm.id && <Check className="w-3.5 h-3.5 text-blue-900 flex-shrink-0 ml-2" />}
                  </button>
                ))}
                {onOpenUserManagementModal && (
                  <div className="p-1 border-t border-slate-100 mt-1">
                    <button
                      onClick={() => {
                        setIsFirmDropdownOpen(false);
                        onOpenUserManagementModal();
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Shield className="w-3.5 h-3.5 text-blue-300" />
                      <span>Gestionar Firmas &amp; Usuarios</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center mx-auto ${
              isSuperUser
                ? 'bg-slate-950 text-blue-300 border-blue-900'
                : isParticularUser
                ? 'bg-teal-950 text-teal-300 border-teal-800'
                : 'bg-white text-blue-900 border-slate-200'
            }`}
            title={
              isSuperUser
                ? 'SuperUsuario Global (Sin Firma)'
                : isParticularUser
                ? 'Abogado Particular (Sin Firma)'
                : activeFirm.name
            }
          >
            {isSuperUser ? (
              <Shield className="w-4 h-4 text-blue-300" />
            ) : isParticularUser ? (
              <User className="w-4 h-4 text-teal-300" />
            ) : (
              <Building2 className="w-4 h-4 text-blue-900" />
            )}
          </div>
        )}
      </div>

      {/* NAVIGATION ITEMS */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = mainView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setMainView(item.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-150 text-left ${
                isActive
                  ? 'bg-blue-950 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-300' : 'text-slate-500'}`} />
              {!isCollapsed && (
                <div className="min-w-0">
                  <div className="text-xs font-semibold leading-tight">{item.label}</div>
                  <div className={`text-[10px] leading-tight truncate ${isActive ? 'text-blue-200/80' : 'text-slate-400'}`}>
                    {item.description}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* FOOTER ACCENTS */}
      <div className="p-3 border-t border-slate-200/80 space-y-2">
        {!isCollapsed ? (
          <>
            <button
              onClick={onOpenRechargeModal || onOpenSubscriptionModal}
              className="w-full p-3 bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-xl text-left transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-[12px]">Saldo de Recargas</div>
                <div className="text-[10px] text-emerald-800 font-mono font-bold">
                  ${(activeFirm.creditsBalance ?? 0).toLocaleString('es-CO')} COP
                </div>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenBrandingModal}
                className="flex-1 py-2 px-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl text-slate-700 text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>Membrete</span>
              </button>

              <div className="py-2 px-2.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cifrado</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={onOpenRechargeModal || onOpenSubscriptionModal}
              className="w-10 h-10 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-center transition-colors text-emerald-800"
              title="Recargar Saldo"
            >
              <CreditCard className="w-4 h-4 text-emerald-700" />
            </button>
            <button
              onClick={onOpenBrandingModal}
              className="w-10 h-10 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-center transition-colors"
              title="Membrete"
            >
              <Settings className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        )}

        {/* COLLAPSE TOGGLE — bottom rail */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-between'
          } py-2 px-3 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all duration-200 group`}
          title={isCollapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {!isCollapsed && (
            <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-500">Colapsar</span>
          )}
          {isCollapsed ? (
            <ChevronsRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          ) : (
            <ChevronsLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          )}
        </button>
      </div>
    </aside>
  );
};
