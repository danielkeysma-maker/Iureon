import React from 'react';
import { Scale, Building2, ShieldCheck, Check, ChevronDown, Sparkles, BookOpen, Wrench, Shield } from 'lucide-react';
import type { LawFirmTenant } from './Header';

interface TopNavBarProps {
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

export const TopNavBar: React.FC<TopNavBarProps> = ({
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
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between select-none font-sans shadow-xs z-30">
      {/* BRAND & TENANT SELECTOR */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Scale className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 flex items-center gap-2 font-sans">
              IUREON <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">v2.0 Legal</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-body leading-none font-medium">
              Plataforma de Inteligencia &amp; Automatización Jurídica
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        {/* FIRM SELECTOR DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setIsFirmDropdownOpen(!isFirmDropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors text-xs shadow-xs"
          >
            <Building2 className="w-4 h-4 text-blue-900" />
            <span className="font-bold text-slate-900">{activeFirm.name}</span>
            <span className="text-[10px] font-mono bg-slate-900 text-white px-2 py-0.5 rounded font-semibold">
              PLAN FIRMA
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isFirmDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
              <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-100 font-bold">
                Firma Activa
              </div>
              {sampleFirms.map((firm) => (
                <button
                  key={firm.id}
                  onClick={() => {
                    setActiveFirm(firm);
                    setIsFirmDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-900">{firm.name}</div>
                    <div className="text-[10px] font-mono text-slate-500">NIT: {firm.nit}</div>
                  </div>
                  {firm.id === activeFirm.id && <Check className="w-4 h-4 text-emerald-600 font-bold" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CENTER WORKSPACE MODULE NAVIGATION TABS */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setMainView('workspace')}
          className={`px-4 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-2 ${
            mainView === 'workspace'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Proyecciones IA</span>
        </button>

        <button
          onClick={() => setMainView('search')}
          className={`px-4 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-2 ${
            mainView === 'search'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Buscador &amp; Leyes</span>
        </button>

        <button
          onClick={() => setMainView('tools')}
          className={`px-4 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-2 ${
            mainView === 'tools'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Herramientas LegalTech</span>
        </button>

        <button
          onClick={() => setMainView('audit')}
          className={`px-4 py-1.5 rounded-lg transition-all text-xs font-bold flex items-center gap-2 ${
            mainView === 'audit'
              ? 'bg-blue-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Auditoría &amp; Firma</span>
        </button>
      </div>

      {/* RIGHT ACTION BAR */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSubscriptionModal}
          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors hover:bg-slate-800 shadow-xs"
        >
          <span>PLAN FIRMA (1.4M / 5M)</span>
        </button>

        <button
          onClick={onOpenBrandingModal}
          className="px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 transition-colors shadow-xs"
        >
          Membrete
        </button>

        <div className="h-5 w-px bg-slate-200" />

        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-sans text-emerald-900 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Conexión Cifrada</span>
        </div>
      </div>
    </header>
  );
};
