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
  ChevronsRight
} from 'lucide-react';
import type { LawFirmTenant } from './Header';

interface SidebarLeftProps {
  mainView: 'workspace' | 'search' | 'tools' | 'audit';
  setMainView: (view: 'workspace' | 'search' | 'tools' | 'audit') => void;
  activeFirm: LawFirmTenant;
  setActiveFirm: (firm: LawFirmTenant) => void;
  sampleFirms: LawFirmTenant[];
  isFirmDropdownOpen: boolean;
  setIsFirmDropdownOpen: (open: boolean) => void;
  onOpenBrandingModal: () => void;
  onOpenSubscriptionModal: () => void;
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
  onOpenSubscriptionModal
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { id: 'workspace' as const, label: 'Redacción', icon: Sparkles, description: 'Providencias judiciales' },
    { id: 'search' as const, label: 'Buscador', icon: BookOpen, description: 'Sentencias & precedentes' },
    { id: 'tools' as const, label: 'Herramientas', icon: Wrench, description: 'Cálculos & utilidades' },
    { id: 'audit' as const, label: 'Seguridad', icon: Shield, description: 'Auditoría & gestión' }
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      } bg-white border-r border-slate-200/80 flex flex-col h-full select-none font-sans transition-all duration-300 ease-in-out z-30 relative`}
    >
      {/* BRAND */}
      <div className={`${isCollapsed ? 'px-3 py-5' : 'px-5 py-5'} flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-950 to-blue-800 flex items-center justify-center text-white shadow-sm flex-shrink-0">
          <Scale className="w-4.5 h-4.5 text-blue-200" />
        </div>
        {!isCollapsed && (
          <div>
            <h1 className="text-[15px] font-extrabold tracking-tight text-slate-900 leading-none">IUREON</h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Plataforma Judicial</p>
          </div>
        )}
      </div>

      {/* FIRM TENANT SELECTOR */}
      {!isCollapsed && (
        <div className="px-4 pb-4">
          <div className="relative">
            <button
              onClick={() => setIsFirmDropdownOpen(!isFirmDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all text-xs text-left group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-blue-950/5 border border-blue-900/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-3.5 h-3.5 text-blue-900" />
                </div>
                <div className="truncate">
                  <div className="font-bold text-slate-900 truncate text-[12px] leading-tight">{activeFirm.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{activeFirm.nit}</div>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${isFirmDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFirmDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1">
                <div className="px-3 py-2 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                  Firmas disponibles
                </div>
                {sampleFirms.map((firm) => (
                  <button
                    key={firm.id}
                    onClick={() => { setActiveFirm(firm); setIsFirmDropdownOpen(false); }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                      firm.id === activeFirm.id ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-bold text-slate-900 truncate text-[12px]">{firm.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{firm.nit}</div>
                    </div>
                    {firm.id === activeFirm.id && <Check className="w-4 h-4 text-blue-700 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsed firm icon */}
      {isCollapsed && (
        <div className="px-3 pb-3 flex justify-center">
          <button
            onClick={() => setIsFirmDropdownOpen(!isFirmDropdownOpen)}
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center transition-colors"
            title={activeFirm.name}
          >
            <Building2 className="w-4 h-4 text-blue-900" />
          </button>
        </div>
      )}

      {/* SEPARATOR */}
      <div className="mx-4 border-t border-slate-100" />

      {/* NAVIGATION */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = mainView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setMainView(item.id)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
              } rounded-xl text-[13px] transition-all duration-150 ${
                isActive
                  ? 'bg-blue-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-blue-200' : 'text-slate-400'}`} />
              {!isCollapsed && (
                <div className="text-left">
                  <span className={`font-semibold block leading-tight ${isActive ? 'text-white' : 'text-slate-800'}`}>{item.label}</span>
                  <span className={`text-[10px] font-normal block mt-0.5 leading-tight ${isActive ? 'text-blue-300' : 'text-slate-400'}`}>{item.description}</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* BOTTOM SECTION */}
      <div className="px-3 pb-3 space-y-2">
        {/* Subscription card */}
        {!isCollapsed ? (
          <>
            <button
              onClick={onOpenSubscriptionModal}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-left transition-colors flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-950/5 border border-blue-900/10 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-blue-900" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 text-[12px]">Plan Firma</div>
                <div className="text-[10px] text-slate-400 font-mono">1.4M / 5M créditos</div>
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
              onClick={onOpenSubscriptionModal}
              className="w-10 h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl flex items-center justify-center transition-colors"
              title="Plan Firma"
            >
              <CreditCard className="w-4 h-4 text-blue-900" />
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
