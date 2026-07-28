import React, { useState } from 'react';
import { Scale, Building2, ShieldCheck, ChevronDown, Check, Calendar, DollarSign, Shield, Settings, Wrench, Search } from 'lucide-react';
import { ProceduralTermsModal } from '../../procedural-terms/components/ProceduralTermsModal';
import { LaborSettlementModal } from '../../settlements/components/LaborSettlementModal';
import { AuditLogsModal } from '../../audit/components/AuditLogsModal';
import { LegalSearchGlossaryModal } from '../../search/components/LegalSearchGlossaryModal';
import { FirmBrandingModal } from './FirmBrandingModal';
import { FirmSubscriptionModal } from '../../subscriptions/components/FirmSubscriptionModal';
import type { FirmSubscriptionInfo } from '../../subscriptions/components/FirmSubscriptionModal';
import { DEFAULT_FIRM_BRANDING } from '../../documents/services/documentExport.service';
import type { FirmBrandingConfig } from '../../documents/services/documentExport.service';

export interface LawFirmTenant {
  id: string;
  name: string;
  nit: string;
  creditsBalance: number; // Saldo disponible de recargas en COP ($)
  status: 'active' | 'trial';
}

export const Header: React.FC = () => {
  const [activeFirm, setActiveFirm] = useState<LawFirmTenant>({
    id: 'firm-default-01',
    name: 'FIRMA APODERADA / DESPACHO JUDICIAL',
    nit: 'NIT 900.000.000-0',
    creditsBalance: 500000,
    status: 'active'
  });
  const [isFirmDropdownOpen, setIsFirmDropdownOpen] = useState(false);
  const [isToolsDropdownOpen, setIsToolsDropdownOpen] = useState(false);

  // Modales
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isSearchGlossaryModalOpen, setIsSearchGlossaryModalOpen] = useState(false);
  const [isBrandingModalOpen, setIsBrandingModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const [firmBranding, setFirmBranding] = useState<FirmBrandingConfig>(DEFAULT_FIRM_BRANDING);
  const [subscriptionInfo] = useState<FirmSubscriptionInfo>({
    firmName: 'Torres & Asociados S.A.S.',
    planTier: 'PRO_FIRM',
    subscriptionStatus: 'active',
    monthlyTokensUsed: 1420500,
    monthlyTokensLimit: 5000000,
    activeUsersCount: 4,
    maxUsersAllowed: 10,
    renewalDate: '2026-08-20',
    usersList: [
      { id: 'usr-001', name: 'Dr. Julián Delgado', email: 'jdelgado@torresasociados.co', role: 'SOCIO_ADMIN', status: 'active' },
      { id: 'usr-002', name: 'Dra. María Camila Osorio', email: 'mcosorio@torresasociados.co', role: 'ASOCIADO', status: 'active' },
      { id: 'usr-003', name: 'Dr. Andrés Restrepo', email: 'arestrepo@torresasociados.co', role: 'ASOCIADO', status: 'active' },
      { id: 'usr-004', name: 'Laura Gómez', email: 'lgomez@torresasociados.co', role: 'PARALEGAL', status: 'active' }
    ]
  });

  return (
    <>
      <ProceduralTermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <LaborSettlementModal isOpen={isSettlementModalOpen} onClose={() => setIsSettlementModalOpen(false)} />
      <AuditLogsModal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} />
      <LegalSearchGlossaryModal isOpen={isSearchGlossaryModalOpen} onClose={() => setIsSearchGlossaryModalOpen(false)} />
      <FirmBrandingModal
        isOpen={isBrandingModalOpen}
        onClose={() => setIsBrandingModalOpen(false)}
        branding={firmBranding}
        onSaveBranding={(updated) => setFirmBranding(updated)}
      />
      <FirmSubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
        info={subscriptionInfo}
      />

      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between select-none font-sans shadow-xs z-30">
        {/* BRAND & TENANT SELECTOR */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-slate-900 flex items-center gap-2 font-sans">
                IUREON <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">v2.0 LegalTech</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-body leading-none font-medium">
                Plataforma de Inteligencia &amp; Automatización Jurídica
              </p>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* FIRM SELECTOR DROPDOWN */}
          <div className="relative">
            <button
              onClick={() => {
                setIsFirmDropdownOpen(!isFirmDropdownOpen);
                setIsToolsDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors text-xs shadow-xs"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-900" />
              <span className="font-bold text-slate-900">{activeFirm.name}</span>
              <span className="text-[10px] font-mono bg-emerald-800 text-white px-2 py-0.5 rounded font-semibold">
                ${(activeFirm.creditsBalance || 500000).toLocaleString('es-CO')} COP
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isFirmDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1">
                <div className="px-3 py-1.5 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-100 font-bold">
                  Firma Cliente Activa
                </div>
                {[activeFirm].map((firm) => (
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

        {/* RIGHT ACTION BAR */}
        <div className="flex items-center gap-3">
          {/* BUSCADOR & GLOSARIO DIRECT BUTTON */}
          <button
            onClick={() => setIsSearchGlossaryModalOpen(true)}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Search className="w-3.5 h-3.5 text-blue-900" />
            <span>Sentencias &amp; Glosario</span>
          </button>

          {/* HERRAMIENTAS LEGALTECH DROPDOWN MENU */}
          <div className="relative">
            <button
              onClick={() => {
                setIsToolsDropdownOpen(!isToolsDropdownOpen);
                setIsFirmDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 text-xs font-semibold shadow-xs"
            >
              <Wrench className="w-3.5 h-3.5 text-blue-900" />
              <span>Herramientas LegalTech</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isToolsDropdownOpen && (
              <div className="absolute top-full right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1 font-sans">
                <button
                  onClick={() => {
                    setIsSearchGlossaryModalOpen(true);
                    setIsToolsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-xs text-slate-800 font-medium border-b border-slate-100"
                >
                  <Search className="w-4 h-4 text-blue-900" />
                  <div>
                    <div className="font-bold">Buscador Leyes &amp; Glosario</div>
                    <div className="text-[10px] text-slate-500">Sentencias, artículos &amp; conceptos</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsTermsModalOpen(true);
                    setIsToolsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-xs text-slate-800 font-medium border-b border-slate-100"
                >
                  <Calendar className="w-4 h-4 text-blue-900" />
                  <div>
                    <div className="font-bold">Calculadora de Términos</div>
                    <div className="text-[10px] text-slate-500">Días hábiles CGP &amp; CPTSS</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsSettlementModalOpen(true);
                    setIsToolsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-xs text-slate-800 font-medium border-b border-slate-100"
                >
                  <DollarSign className="w-4 h-4 text-emerald-700" />
                  <div>
                    <div className="font-bold">Liquidación &amp; Agencias</div>
                    <div className="text-[10px] text-slate-500">Art. 64 CST &amp; Tarifas CSJ</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsAuditModalOpen(true);
                    setIsToolsDropdownOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 text-xs text-slate-800 font-medium"
                >
                  <Shield className="w-4 h-4 text-amber-700" />
                  <div>
                    <div className="font-bold">Auditoría &amp; Compliance</div>
                    <div className="text-[10px] text-slate-500">Historial inmutable B2B</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* PLAN SAAS BADGE */}
          <button
            onClick={() => setIsSubscriptionModalOpen(true)}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-colors hover:bg-slate-800 shadow-xs"
            title="Gestión de Plan y Abogados"
          >
            <span>PRO_FIRM (1.4M / 5M)</span>
          </button>

          {/* MEMBRETE BUTTON */}
          <button
            onClick={() => setIsBrandingModalOpen(true)}
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition-colors shadow-xs"
            title="Configurar Membrete de la Firma"
          >
            <Settings className="w-4 h-4 text-slate-700" />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* RLS SECURITY BADGE */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-mono text-emerald-900 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>RLS Active</span>
          </div>
        </div>
      </header>
    </>
  );
};
