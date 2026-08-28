import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, ShieldCheck, UserPlus } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { firmUsersApi, type UsuarioDeFirma } from '../services/firmUsers.api';

/**
 * Gestión de la firma. Diálogo tipo 4 —visor— en tamaño L, del artboard 6c.
 *
 * ─── TODO LO QUE SE VE ES REAL ──────────────────────────────────────────────
 *
 * La versión anterior guardaba los usuarios en localStorage y el «invitar»
 * fabricaba una cuenta que no existía. Esta lista sale de Supabase Auth — la
 * misma fuente que decide quién puede entrar — así que la pantalla y el acceso
 * no pueden contar historias distintas. El consumo del mes sale de lo cobrado
 * de verdad (`ai_usage`), por usuario.
 *
 * ─── AL DESACTIVAR, NADA SE BORRA ───────────────────────────────────────────
 *
 * Sus escritos, sus verificaciones y su rastro en Auditoría permanecen; solo
 * pierde el acceso. Por eso es desactivar y no eliminar: borrar la cuenta
 * rompería la autoría de todo lo que esa persona hizo.
 *
 * ─── LO QUE EL ARTBOARD 6c PIDE Y AQUÍ NO ESTÁ, con la razón ────────────────
 *
 * · Los roles «Dependiente judicial» y «Contabilidad»: un rol es imposición en
 *   cada endpoint, no una etiqueta. Existen los dos que el servidor impone
 *   (administrador y abogado); los otros dos se agregan cuando su imposición
 *   esté escrita.
 * · Tope de gasto por usuario, segundo factor, restricción de dominio, cierre
 *   por inactividad: cada uno es obra de backend propia. No se pintan
 *   interruptores muertos.
 * · «Invitaciones» con expiración: la creación es directa con contraseña
 *   (no hay flujo de correo de invitación todavía), y eso es lo que la
 *   pantalla ofrece.
 */

interface FirmUsersDialogProps {
  isOpen: boolean;
  onClose: () => void;
  firmName: string;
  firmNit?: string;
}

const ROL: Record<string, string> = {
  FIRM_ADMIN: 'Socio · administrador',
  LAWYER: 'Abogado litigante',
  SUPER_ADMIN: 'Operación Iureon'
};

const pesos = (v: number): string => `$${Math.round(v).toLocaleString('es-CO')}`;

const hace = (iso: string | null): string => {
  if (!iso) return 'nunca ha entrado';
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
};

export const FirmUsersDialog: React.FC<FirmUsersDialogProps> = ({
  isOpen,
  onClose,
  firmName,
  firmNit
}) => {
  const [usuarios, setUsuarios] = useState<UsuarioDeFirma[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [crearAbierto, setCrearAbierto] = useState(false);

  const cargar = async () => {
    setCargando(true);
    setError('');
    try {
      setUsuarios(await firmUsersApi.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron listar los usuarios.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (isOpen) void cargar();
  }, [isOpen]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) => u.email.toLowerCase().includes(q));
  }, [usuarios, busqueda]);

  const accion = async (fn: () => Promise<void>) => {
    setError('');
    try {
      await fn();
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la acción.');
    }
  };

  return (
    <>
      <Dialog
        abierto={isOpen}
        onCerrar={onClose}
        tamano="L"
        titulo="Gestión de la firma"
        subtitulo={
          <>
            {firmName}
            {firmNit && <span className="font-mono"> · NIT {firmNit}</span>} · {usuarios.length}{' '}
            {usuarios.length === 1 ? 'usuario' : 'usuarios'}
          </>
        }
        cuerpoEnCanvas
        acciones={
          <>
            <button onClick={() => void cargar()} className="btn-neutral btn-sm" disabled={cargando}>
              <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => setCrearAbierto(true)} className="btn-primary btn-sm">
              <UserPlus className="h-3.5 w-3.5" />
              Crear usuario
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <p className="notice-unverified">{error}</p>}

          <div className="relative max-w-[300px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por correo"
              className="field w-full pl-8"
            />
          </div>

          {/* ─── LA TABLA · Usuario · Rol · Consumo mes · Últ. actividad ──── */}
          <div className="overflow-hidden rounded-card border border-line-200 bg-surface">
            <div className="t-head hidden items-center gap-3 md:flex">
              <span className="min-w-0 flex-1">Usuario</span>
              <span className="w-[160px] shrink-0">Rol</span>
              <span className="w-[100px] shrink-0 text-right">Consumo mes</span>
              <span className="w-[110px] shrink-0">Últ. actividad</span>
              <span className="w-[170px] shrink-0" />
            </div>

            {visibles.map((u) => (
              <div
                key={u.id}
                className={`t-row flex flex-wrap items-center gap-3 ${u.desactivado ? 'opacity-60' : ''}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-ui text-ink-900">{u.email}</span>
                  {u.desactivado && (
                    <span className="text-[11px] text-ink-400">
                      desactivado · conserva su rastro en Auditoría
                    </span>
                  )}
                </span>

                <span className="w-[160px] shrink-0">
                  <span className="block text-[12.5px] text-ink-900">{ROL[u.role] ?? u.role}</span>
                  {/* La frontera real: verificar el catálogo es de socios, y el servidor lo impone. */}
                  <span className={`text-[11px] ${u.role === 'FIRM_ADMIN' ? 'text-verified' : 'text-ink-400'}`}>
                    {u.role === 'FIRM_ADMIN' ? 'Puede curar el catálogo' : 'Propone, no verifica'}
                  </span>
                </span>

                <span className="w-[100px] shrink-0 text-right font-mono text-[12px] text-ink-900">
                  {u.consumoMesCop > 0 ? pesos(u.consumoMesCop) : '—'}
                </span>

                <span className="w-[110px] shrink-0 text-meta text-ink-500">{hace(u.ultimoAcceso)}</span>

                <span className="flex w-[170px] shrink-0 justify-end gap-1.5">
                  {u.role !== 'SUPER_ADMIN' && (
                    <>
                      <button
                        onClick={() =>
                          void accion(() =>
                            firmUsersApi.setRol(u.id, u.role === 'FIRM_ADMIN' ? 'LAWYER' : 'FIRM_ADMIN')
                          )
                        }
                        className="btn-neutral btn-sm"
                        title={u.role === 'FIRM_ADMIN' ? 'Pasar a abogado litigante' : 'Hacer socio administrador'}
                      >
                        {u.role === 'FIRM_ADMIN' ? 'Quitar admin' : 'Hacer socio'}
                      </button>
                      <button
                        onClick={() => void accion(() => firmUsersApi.setActivo(u.id, u.desactivado))}
                        className={u.desactivado ? 'btn-secondary btn-sm' : 'btn-danger btn-sm'}
                      >
                        {u.desactivado ? 'Reactivar' : 'Desactivar'}
                      </button>
                    </>
                  )}
                </span>
              </div>
            ))}

            {visibles.length === 0 && !cargando && (
              <p className="px-4 py-6 text-center text-meta text-ink-500">
                {usuarios.length === 0 ? 'Todavía no hay usuarios en la firma.' : 'Ninguno coincide.'}
              </p>
            )}
          </div>

          {/* ─── LOS DOS ROLES, CON SU DIFERENCIA REAL ─────────────────────── */}
          <div className="rounded-card border border-line-200 bg-surface p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-700" />
              <h3 className="text-ui font-semibold text-ink-900">Dos roles, una diferencia real</h3>
            </div>
            <dl className="mt-2 space-y-1.5">
              <div>
                <dt className="text-ui font-medium text-ink-900">Socio · administrador</dt>
                <dd className="text-meta leading-[1.5] text-ink-500">
                  Todo lo del abogado, más: verificar el catálogo, cambiar marca y formato, crear y
                  desactivar usuarios.
                </dd>
              </div>
              <div>
                <dt className="text-ui font-medium text-ink-900">Abogado litigante</dt>
                <dd className="text-meta leading-[1.5] text-ink-500">
                  Redacta, orienta, graba, exporta y propone actuaciones al catálogo; no las
                  verifica.
                </dd>
              </div>
            </dl>
            <p className="mt-2 border-t border-line-100 pt-2 text-meta leading-[1.5] text-ink-500">
              La única frontera que importa: <span className="font-medium text-ink-900">verificar es de socios</span>,
              y el servidor la impone — de eso depende que las actuaciones verificadas signifiquen
              algo.
            </p>
          </div>

          <p className="text-meta leading-[1.6] text-ink-400">
            Al desactivar a alguien, sus escritos y sus verificaciones permanecen; solo pierde el
            acceso. Nunca se borra su rastro.
          </p>
        </div>
      </Dialog>

      <CrearUsuarioDialog
        abierto={crearAbierto}
        onCerrar={() => setCrearAbierto(false)}
        onCreado={() => void cargar()}
      />
    </>
  );
};

/**
 * Crear usuario. Tipo 2 (formulario, M). Directo con contraseña — no hay flujo
 * de correo de invitación todavía, y la pantalla ofrece lo que existe.
 */
const CrearUsuarioDialog: React.FC<{
  abierto: boolean;
  onCerrar: () => void;
  onCreado: () => void;
}> = ({ abierto, onCerrar, onCreado }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'FIRM_ADMIN' | 'LAWYER'>('LAWYER');
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  const listo = email.includes('@') && password.length >= 8;

  const crear = async () => {
    if (!listo) return;
    setCreando(true);
    setError('');
    try {
      await firmUsersApi.crear(email.trim(), password, role);
      setEmail('');
      setPassword('');
      setRole('LAWYER');
      onCreado();
      onCerrar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta.');
    } finally {
      setCreando(false);
    }
  };

  /* Lo que el rol elegido PUEDE, dicho antes de crear — no después. */
  const permisos: Array<[string, boolean]> = [
    ['Redactar y exportar escritos', true],
    ['Grabar entrevistas y audiencias', true],
    ['Proponer actuaciones al catálogo', true],
    ['Verificar actuaciones', role === 'FIRM_ADMIN'],
    ['Cambiar marca y formato', role === 'FIRM_ADMIN'],
    ['Crear y desactivar usuarios', role === 'FIRM_ADMIN']
  ];

  return (
    <Dialog
      abierto={abierto}
      onCerrar={onCerrar}
      tamano="M"
      titulo="Crear usuario"
      subtitulo="La cuenta queda activa de inmediato, con la contraseña que usted entregue."
      hayCambiosSinGuardar={Boolean(email || password)}
      onIntentoDeCerrarConCambios={() => undefined}
      acciones={
        <>
          <button onClick={onCerrar} className="btn-neutral btn-sm" disabled={creando}>
            Cancelar
          </button>
          <button onClick={() => void crear()} className="btn-primary btn-sm" disabled={!listo || creando}>
            {creando ? 'Creando…' : 'Crear cuenta'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <label className="block">
          <span className="field-label">Correo</span>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="valentina.orozco@sufirma.co"
            className="field mt-1 w-full"
          />
        </label>

        <label className="block">
          <span className="field-label">Contraseña inicial</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            className="field mt-1 w-full"
          />
          <span className="mt-1 block text-meta text-ink-400">
            Entréguela por un canal seguro; la persona puede cambiarla al entrar.
          </span>
        </label>

        <div>
          <span className="field-label">Rol</span>
          <div className="mt-1 flex gap-1.5">
            {(['LAWYER', 'FIRM_ADMIN'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-control border px-3 py-1.5 text-[12.5px] font-medium ${
                  role === r
                    ? 'border-brand-700 bg-brand-50 text-brand-700'
                    : 'border-line-200 bg-canvas text-ink-700 hover:border-brand-700'
                }`}
              >
                {ROL[r]}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-line-200 bg-canvas px-3.5 py-3">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Con este rol podrá
          </p>
          <ul className="mt-1.5 space-y-1">
            {permisos.map(([texto, puede]) => (
              <li
                key={texto}
                className={`flex items-center gap-2 text-ui ${puede ? 'text-ink-900' : 'text-ink-400 line-through'}`}
              >
                <span className={puede ? 'text-verified' : 'text-ink-400'}>{puede ? '✓' : '✗'}</span>
                {texto}
              </li>
            ))}
          </ul>
        </div>

        {error && <p className="notice-unverified">{error}</p>}
      </div>
    </Dialog>
  );
};
