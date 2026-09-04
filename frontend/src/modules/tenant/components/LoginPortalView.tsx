import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { IureonMark } from './IureonMark';
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
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LA PANTALLA, REDISEÑADA. Antes era una tarjeta flotando sobre un fondo con
 * degradados difusos y una retícula decorativa — el aspecto de una aplicación de
 * consumo. Ahora son dos mitades: a la izquierda qué es el producto y qué
 * garantiza, a la derecha entrar. Es la primera impresión, y un abogado que no
 * conoce Iureon merece saber a qué está entrando antes de escribir su contraseña.
 *
 * Las cifras de la izquierda son las reales, no adorno: las actuaciones
 * verificadas del catálogo y los registros que se consultan en vivo. Si alguna
 * deja de ser cierta hay que cambiarla aquí, y por eso viven en una constante y
 * no sueltas en el marcado. Ya pasó una vez: decía 651 y 2 cuando el catálogo
 * iba en 858 y los registros eran 4.
 */

/**
 * Lo que la portada afirma sobre el producto.
 *
 * Cada cifra es comprobable contra el catálogo y el módulo de jurisprudencia. No
 * se ponen aquí números redondeados hacia arriba: esta pantalla la lee alguien
 * que todavía no confía en el producto, y una cifra inflada que después no
 * cuadra es la forma más rápida de perderlo.
 */
const PRUEBAS = [
  {
    /* 858 de 860 catalogadas: las dos restantes están marcadas NO_VERIFICADO y no se cuentan. Contado el 4 de septiembre de 2026 sobre catalog/data. */
    cifra: '858',
    texto: 'actuaciones procesales en 28 ramas, verificadas contra el texto oficial de la norma'
  },
  {
    cifra: '4',
    texto: 'registros consultados en vivo: Corte Constitucional, Corte Suprema, Consejo de Estado y Comisión Nacional de Disciplina Judicial'
  }
] as const;

export const LoginPortalView: React.FC<LoginPortalViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);

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
    <div className="flex min-h-screen w-full font-sans">
      {/*
        LA MITAD IZQUIERDA SE OCULTA EN MÓVIL, no se encoge. Un argumento
        comercial comprimido a 390px deja de ser argumento y se vuelve un muro
        de texto entre el abogado y el campo de contraseña.

        Conserva el azul de la barra (`nav`) en los dos temas: es la superficie
        de marca, y en oscuro apenas se oscurece un paso.
      */}
      <aside className="hidden w-[46%] max-w-[596px] flex-col bg-nav p-8 lg:flex">
        <div className="flex items-center gap-2.5">
          <IureonMark size={28} mono className="text-white/80" />
          <span className="text-subtitle tracking-[0.02em] text-white">Iureon</span>
        </div>

        <div className="mt-auto">
          <h1 className="max-w-[420px] text-[30px] font-semibold leading-[1.25] text-white [text-wrap:pretty]">
            Escritos jurídicos con el término y el artículo verificados contra la norma oficial.
          </h1>
          <p className="mt-3.5 max-w-[430px] text-body leading-[1.65] text-white/70 [text-wrap:pretty]">
            Tres modelos trabajando sobre un catálogo curado por abogados, no sobre una respuesta
            genérica. Lo que no está verificado, se lo decimos.
          </p>

          <dl className="mt-8 grid max-w-[440px] grid-cols-2 gap-x-6 gap-y-3.5">
            {PRUEBAS.map(({ cifra, texto }) => (
              <div key={cifra} className="border-t border-white/15 pt-3">
                {/* En mono porque es un dato, no interfaz. */}
                <dt className="font-mono text-[22px] font-semibold text-white">{cifra}</dt>
                <dd className="mt-1 text-meta leading-[1.5] text-white/55">{texto}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-auto pt-8 font-mono text-[11px] leading-[1.6] text-white/45">
          Tratamiento de datos conforme a la Ley 1581 de 2012 · subencargados publicados en la
          sección Privacidad
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-surface p-6">
        <div className="w-full max-w-[352px]">
          {/* La marca solo aquí en móvil, donde la mitad izquierda no existe. */}
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <IureonMark size={26} />
            <span className="text-subtitle text-ink-900">Iureon</span>
          </div>

          <h2 className="text-title text-ink-900">Entrar</h2>
          <p className="mt-1 text-ui text-ink-500">Con el correo de su firma.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
            <div>
              <label htmlFor="correo" className="mb-1.5 block text-meta font-medium text-ink-700">
                Correo
              </label>
              <input
                id="correo"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@sufirma.co"
                autoComplete="email"
                className="field h-[38px]"
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-baseline gap-2">
                <label htmlFor="clave" className="text-meta font-medium text-ink-700">
                  Contraseña
                </label>
                {/*
                  Sin recuperación automática todavía: el acceso lo abre el
                  operador. Decirlo es más honesto que un enlace que lleva a una
                  pantalla que no existe.
                */}
                <span className="ml-auto text-meta text-ink-400">La restablece su firma</span>
              </div>
              <div className="relative">
                <input
                  id="clave"
                  type={verContrasena ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  className="field h-[38px] pr-10 font-mono tracking-[0.12em]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena((v) => !v)}
                  aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-0 top-0 flex h-[38px] w-10 items-center justify-center text-ink-400 hover:text-ink-700"
                >
                  {verContrasena ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-card border border-[rgb(var(--danger-line))] bg-[rgb(var(--danger)/0.07)] px-3 py-2.5 text-ui text-ink-900"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="btn-primary mt-1 h-10 w-full">
              {isLoading ? 'Verificando…' : 'Entrar'}
            </button>
          </form>

          {/*
            Dice lo que es cierto, como ya lo decía cuando nada estaba verificado.
            Ahora sí lo está: la contraseña se comprueba contra Supabase Auth y la
            firma viaja dentro de un token firmado, no en una cabecera que el
            navegador escribe.
          */}
          <div className="mt-5 flex gap-2 rounded-card border border-line-200 bg-canvas px-3 py-2.5">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
            <p className="text-meta leading-[1.55] text-ink-500">
              Sus documentos y grabaciones no se usan para entrenar modelos. Cada acceso queda en
              Auditoría, y cada firma solo ve sus propios expedientes.
            </p>
          </div>

          {/*
            Y le dice a una firma que aterrice aquí cómo volverse cliente: quitar
            el auto-registro en silencio se leería como que el producto está
            roto, en vez de como que se vende.
          */}
          <p className="mt-4 text-meta leading-[1.6] text-ink-400">
            ¿Su firma aún no tiene cuenta? El acceso a Iureon es por contratación: escríbanos y
            abrimos la suya.
          </p>
        </div>
      </main>
    </div>
  );
};
