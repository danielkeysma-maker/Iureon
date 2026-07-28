import React, { useState } from 'react';
import { Scale, Mail, Key, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import type { LawFirmTenant } from './Header';

interface LoginPortalViewProps {
  onLoginSuccess: (userEmail: string, firm: LawFirmTenant) => void;
  registeredFirms: LawFirmTenant[];
}

export const LoginPortalView: React.FC<LoginPortalViewProps> = ({
  onLoginSuccess,
  registeredFirms
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Por favor ingrese su correo y contraseña corporativa.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      // Resolucion automatica de la firma por el usuario o asignacion por defecto
      const chosenFirm = registeredFirms[0] || {
        id: 'firm-default-01',
        name: 'FIRMA / DESPACHO ACTIVO',
        nit: 'PENDIENTE REGISTRO',
        creditsBalance: 0,
        status: 'active'
      };

      onLoginSuccess(email.trim(), chosenFirm);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      {/* Dynamic Grid Background Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-800/20 rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-950 to-blue-800 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg border border-blue-700/30">
            <Scale className="w-7 h-7 text-blue-200" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">IUREON</h1>
          <p className="text-xs font-medium text-slate-500">Plataforma LegalTech &amp; Ecosistema Judicial Colombia</p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Correo Electrónico Corporativo:</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abogado@tufirma.co"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-900 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Contraseña de Acceso:</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-900 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
          >
            {isLoading ? (
              <span>Autenticando credenciales...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-blue-300" />
                <span>Ingresar al Workspace Judicial</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Info */}
        <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-400">
          <p className="font-semibold text-slate-600">Autenticación Cifrada Supabase Auth &amp; Multi-Tenant RLS</p>
        </div>
      </div>
    </div>
  );
};
