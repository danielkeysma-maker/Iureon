import React, { useState } from 'react';
import { IureonMark } from './IureonMark';
import { Mail, Key, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { authApi } from '../../auth/auth.api';
import type { Session } from '../../auth/session';

interface LoginPortalViewProps {
  onLoginSuccess: (session: Session) => void;
}

/**
 * The door, and now it is actually locked.
 *
 * WHAT THIS USED TO DO. It checked that both fields were non-empty, waited on a
 * setTimeout that existed only to look busy, and let anyone in — then handed
 * the app whichever firm happened to be first in localStorage. The footer said
 * "Autenticación Cifrada Supabase Auth & Multi-Tenant RLS", which was false in
 * every word.
 *
 * AND IT NO LONGER OFFERS TO REGISTER A FIRM. Self-registration lived here
 * briefly, which meant anyone could open a tenant and start using the product
 * without ever becoming a client — a business defect and a security one in the
 * same shape, since a tenant is exactly what the product bills. Firms are
 * opened from the operator console, by whoever knows what was agreed and
 * charged.
 */
export const LoginPortalView: React.FC<LoginPortalViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Ingresa tu correo y tu contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const { session } = await authApi.login(email.trim(), password);
      onLoginSuccess(session);
    } catch (err) {
      // The API answers in Spanish and distinguishes nothing an attacker could
      // use — "Correo o contraseña incorrectos" covers both a wrong password
      // and an address that has no account.
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setIsLoading(false);
    }
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
          {/*
            En el login la marca va sola y sin caja: es la primera impresión del
            producto, y encerrarla en un cuadrado de color la convierte en el
            icono de una aplicación cualquiera.
          */}
          <IureonMark size={56} className="mx-auto" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">IUREON</h1>
          <p className="text-xs font-medium text-slate-500">
            Plataforma LegalTech &amp; Ecosistema Judicial Colombia
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Correo Electrónico Corporativo:
            </label>
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
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Contraseña de Acceso:
            </label>
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
            className="w-full py-3 bg-blue-950 hover:bg-blue-900 disabled:bg-slate-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
          >
            {isLoading ? (
              <span>Verificando credenciales…</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-blue-300" />
                <span>Ingresar al Workspace Judicial</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/*
          Says what is true, as the previous notice did back when nothing was
          verified at all. Now it is: the password is checked against Supabase
          Auth, and the firm travels inside a signed token rather than in a
          header the browser writes.

          And it tells a firm that lands here how to become a client, because
          removing self-registration in silence would read as the product being
          broken rather than as it being sold.
        */}
        <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1">
          <p>Acceso verificado. Cada firma solo ve sus propios expedientes.</p>
          <p className="text-slate-400">
            El acceso a Iureon es por contratación. Si tu firma quiere usarlo, contáctanos y
            abrimos su cuenta.
          </p>
        </div>
      </div>
    </div>
  );
};
