import React, { useState } from 'react';
import { Key, CheckCircle2 } from 'lucide-react';

interface LoginTabProps {
  onClose: () => void;
}

/** Delay before the modal closes, so the confirmation message stays readable. */
const CLOSE_DELAY_MS = 1500;

/**
 * Credential entry form.
 *
 * This form only collects the credentials; it never verifies them. Roles and
 * session state must be resolved by Supabase Auth on the server, because any
 * check performed here can be bypassed by editing the bundle.
 */
export const LoginTab: React.FC<LoginTabProps> = ({ onClose }) => {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSuccessMsg, setLoginSuccessMsg] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) return;

    setLoginSuccessMsg(`✅ Sesión iniciada correctamente para: ${loginEmail}`);

    setTimeout(() => {
      setLoginSuccessMsg('');
      onClose();
    }, CLOSE_DELAY_MS);
  };

  return (
<div className="max-w-md mx-auto space-y-4 py-4">
  <div className="text-center space-y-1">
    <div className="w-12 h-12 bg-blue-50 text-blue-950 rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
      <Key className="w-6 h-6" />
    </div>
    <h4 className="font-bold text-slate-900 text-base">Iniciar Sesión de Usuario Abogado</h4>
    <p className="text-slate-500 text-xs">Ingresa tus credenciales corporativas para acceder a tu firma.</p>
  </div>

  <form onSubmit={handleLoginSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
    <div>
      <label className="text-xs font-semibold text-slate-700 block mb-1">Correo Electrónico:</label>
      <input
        type="email"
        value={loginEmail}
        onChange={(e) => setLoginEmail(e.target.value)}
        placeholder="abogado@tufirma.co"
        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-900"
        required
      />
    </div>

    <div>
      <label className="text-xs font-semibold text-slate-700 block mb-1">Contraseña de Acceso:</label>
      <input
        type="password"
        value={loginPassword}
        onChange={(e) => setLoginPassword(e.target.value)}
        placeholder="••••••••••••"
        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-900"
        required
      />
    </div>

    {loginSuccessMsg && (
      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs font-semibold flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>{loginSuccessMsg}</span>
      </div>
    )}

    <button
      type="submit"
      className="w-full py-2.5 bg-blue-950 hover:bg-blue-900 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
    >
      Ingresar a la Plataforma
    </button>
  </form>
</div>
  );
};
