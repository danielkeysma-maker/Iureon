import React, { useState } from 'react';
import { Lock, CreditCard, ArrowRight } from 'lucide-react';
import { AuditLogsModal } from './AuditLogsModal';
import { FirmSubscriptionModal } from '../../subscriptions/components/FirmSubscriptionModal';

export const AuditView: React.FC = () => {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);

  const sampleSubscriptionInfo = {
    firmName: 'FIRMA / DESPACHO ACTIVO',
    planTier: 'SALDO_RECARGA' as any,
    subscriptionStatus: 'active' as const,
    monthlyTokensUsed: 0,
    monthlyTokensLimit: 5000000,
    activeUsersCount: 1,
    maxUsersAllowed: 10,
    renewalDate: '2026-12-31',
    usersList: [
      { id: 'usr-001', name: 'Ing. Daniel Ma. (SuperUsuario Global)', email: 'ingdanielma@gmail.com', role: 'SOCIO_ADMIN', status: 'active' as const }
    ]
  };

  const items = [
    {
      id: 'audit',
      icon: Lock,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-700',
      title: 'Historial de Auditoría',
      description: 'Registro inalterable de consultas, exportaciones y modificaciones realizadas por los abogados de la firma.',
      action: () => setIsAuditModalOpen(true),
      buttonLabel: 'Ver registros',
      buttonClass: 'bg-slate-900 hover:bg-slate-800'
    },
    {
      id: 'subscription',
      icon: CreditCard,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-800',
      title: 'Plan de Firma & Licencias',
      description: 'Supervisión de créditos mensuales (1.4M / 5M), licencias activas (4 de 10) y renovación del servicio.',
      action: () => setIsSubscriptionModalOpen(true),
      buttonLabel: 'Administrar plan',
      buttonClass: 'bg-blue-950 hover:bg-blue-900'
    }
  ];

  return (
    <div className="flex-1 bg-slate-50/50 p-6 lg:p-8 overflow-y-auto font-sans">
      <AuditLogsModal isOpen={isAuditModalOpen} onClose={() => setIsAuditModalOpen(false)} />
      <FirmSubscriptionModal isOpen={isSubscriptionModalOpen} onClose={() => setIsSubscriptionModalOpen(false)} info={sampleSubscriptionInfo} />

      <div className="max-w-4xl mx-auto space-y-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.id} className="bg-white border border-slate-200/80 rounded-xl p-5 flex items-center gap-5 hover:border-slate-300 transition-colors group">
              <div className={`w-12 h-12 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-slate-900">{item.title}</h3>
                <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{item.description}</p>
              </div>
              <button
                onClick={item.action}
                className={`px-4 py-2.5 ${item.buttonClass} text-white font-semibold rounded-xl text-[12px] flex items-center gap-2 transition-colors flex-shrink-0`}
              >
                <span>{item.buttonLabel}</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
