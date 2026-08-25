import React, { useState } from 'react';
import { Scale, Mail, Key, ShieldCheck, ArrowRight, AlertCircle, Building2 } from 'lucide-react';
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
 * Both halves live here because they are the same moment for a new user:
 * signing in needs an account, and the first account of a firm is created by
 * registering the firm. Registration mints the tenant server-side and issues
 * its first administrator; it cannot join an existing firm, so the form has no
 * way to name one.
 */
export const LoginPortalView: React.FC<LoginPortalViewProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firmName, setFirmName] = useState('');
  const [nit, setNit] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const registering = mode === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password) {
      setErrorMsg('Ingresa tu correo y tu contraseña.');
      return;
    }

    if (registering && (!firmName.trim() || !nit.trim())) {
      setErrorMsg('Ingresa el nombre y el NIT de la firma.');
      return;
    }

    setIsLoading(true);

    try {
      const { session } = registering
        ? await authApi.registerFirm({
            firmName: firmName.trim(),
            nit: nit.trim(),
            email: email.trim(),
            password
          })
        : await authApi.login(email.trim(), password);

      onLoginSuccess(session);
    } catch (err) {
      // The API answers in Spanish and distinguishes nothing an attacker could
      // use — "Correo o contraseña incorrectos" covers both a wrong password
      // and an address with no account.
      setErrorMsg(err instanceof Error ? err.message : 'No se pudo completar la operación.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setMode(registering ? 'login' : 'register');
    setErrorMsg('');
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
          <p className="text-xs font-medium text-slate-500">
            Plataforma LegalTech &amp; Ecosistema Judicial Colombia
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {registering && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nombre de la firma o despacho:
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder="Wilches & Asociados S.A.S."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-blue-900 focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">NIT:</label>
                <input
                  type="text"
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  placeholder="900.123.456-7"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-900 focus:bg-white transition-all"
                />
              </div>
            </>
          )}

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
            {registering && (
              <p className="text-[11px] text-slate-500 mt-1">Mínimo 8 caracteres.</p>
            )}
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
              <span>{registering ? 'Registrando la firma…' : 'Verificando credenciales…'}</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-blue-300" />
                <span>{registering ? 'Registrar firma y crear cuenta' : 'Ingresar al Workspace Judicial'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-2">
          <button
            type="button"
            onClick={switchMode}
            className="text-blue-900 font-semibold hover:underline"
          >
            {registering
              ? '¿Ya tienes cuenta? Inicia sesión'
              : '¿Tu firma no está registrada? Regístrala'}
          </button>
          {/*
            Says what is true, as the previous warning did when nothing was
            verified. Now it is: the password is checked against Supabase Auth,
            and the firm travels inside the signed token rather than in a header
            the browser writes.
          */}
          <p>Acceso verificado. Cada firma solo ve sus propios expedientes.</p>
        </div>
      </div>
    </div>
  );
};
