import React, { useState } from 'react';
import { X, CreditCard, Users, UserPlus, Zap, CheckCircle2 } from 'lucide-react';

export type { FirmSubscriptionInfo } from '../types';
import type { FirmSubscriptionInfo } from '../types';


interface FirmSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  info: FirmSubscriptionInfo;
}

export const FirmSubscriptionModal: React.FC<FirmSubscriptionModalProps> = ({
  isOpen,
  onClose,
  info
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'team'>('plan');
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ASOCIADO' | 'PARALEGAL' | 'SOCIO_ADMIN'>('ASOCIADO');
  const [users, setUsers] = useState(info.usersList);
  const [invitedSuccess, setInvitedSuccess] = useState(false);

  if (!isOpen) return null;

  const usagePct = Math.round((info.monthlyTokensUsed / info.monthlyTokensLimit) * 100);

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: inviteName,
      email: inviteEmail,
      role: inviteRole,
      status: 'invited'
    };

    setUsers([...users, newUser]);
    setInviteName('');
    setInviteEmail('');
    setInvitedSuccess(true);
    setTimeout(() => setInvitedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-900 border border-blue-950 flex items-center justify-center text-white">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  Suscripción &amp; Equipo: {info.firmName}
                </h3>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-bold uppercase">
                  Suscripción {info.subscriptionStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-body">
                Gestión del plan SaaS, cuota de tokens RAG procesados y abogados de la firma.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 border-b border-slate-200 bg-white flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('plan')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'plan'
                ? 'border-blue-900 text-blue-950 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-blue-900" />
            <span>Plan &amp; Consumo RAG</span>
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'team'
                ? 'border-blue-900 text-blue-950 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-blue-900" />
            <span>Abogados de la Firma ({users.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs font-body">
          {activeTab === 'plan' ? (
            <div className="space-y-6">
              {/* Plan Card */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold block">Plan Activo</span>
                  <h4 className="text-lg font-bold text-slate-900 font-sans mt-0.5">
                    PLAN {info.planTier} (Firma Profesional)
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Incluye orquestación RAG multi-motor (Gemini 3.6 + GPT + Claude Opus 5), Bóveda B2 y RLS en Supabase.
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono text-blue-900 font-semibold block">Renovación:</span>
                  <span className="text-sm font-bold text-slate-900 font-mono">{info.renewalDate}</span>
                </div>
              </div>

              {/* Token Usage Bar */}
              <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-blue-900" />
                    Consumo Mensual de Tokens RAG
                  </span>
                  <span className="text-blue-950 font-bold">
                    {(info.monthlyTokensUsed / 1000000).toFixed(2)}M / {(info.monthlyTokensLimit / 1000000).toFixed(0)}M Tokens ({usagePct}%)
                  </span>
                </div>

                <div className="h-3.5 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-300">
                  <div
                    className="h-full bg-blue-900 transition-all duration-500"
                    style={{ width: `${usagePct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Reinicio el 1 de cada mes</span>
                  <span className="text-emerald-700 font-semibold">Tokens sobrantes acumulables</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Invite User Form */}
              <form onSubmit={handleInviteUser} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-900 font-sans text-xs flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <UserPlus className="w-4 h-4 text-blue-900" />
                  Registrar / Invitar Abogado a la Firma
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Nombre Completo"
                    className="bg-white border border-slate-200 rounded p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900 font-sans"
                    required
                  />
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Correo Corporativo"
                    className="bg-white border border-slate-200 rounded p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900 font-sans"
                    required
                  />
                  <div className="flex gap-2">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded p-2 text-slate-900 text-xs focus:outline-none focus:border-blue-900 font-sans flex-1"
                    >
                      <option value="ASOCIADO">Asociado</option>
                      <option value="SOCIO_ADMIN">Socio Admin</option>
                      <option value="PARALEGAL">Paralegal</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded font-semibold text-xs flex items-center gap-1 transition-colors shrink-0 shadow-xs"
                    >
                      <span>Invitar</span>
                    </button>
                  </div>
                </div>

                {invitedSuccess && (
                  <div className="text-emerald-700 text-[11px] font-mono flex items-center gap-1.5 pt-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Invitación enviada exitosamente al abogado.</span>
                  </div>
                )}
              </form>

              {/* Users Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Abogado / Usuario</th>
                      <th className="px-4 py-2.5">Correo</th>
                      <th className="px-4 py-2.5">Rol</th>
                      <th className="px-4 py-2.5 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900">{u.name}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-[10px] bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded font-bold">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
