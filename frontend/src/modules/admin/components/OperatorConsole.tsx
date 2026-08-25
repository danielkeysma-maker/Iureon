import React from 'react';
import { AlertCircle, Building2, CreditCard, Plus, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { adminApi, type FirmSummary } from '../admin.api';

/**
 * Running the platform: the firms on it, their plans, their balances.
 *
 * WHAT IT SHOWS AND WHAT IT DOES NOT. Counts of accounts and hearings, because
 * that is what a subscription is billed on. Never a transcript, a draft or a
 * document: managing a tenant and reading its privileged material are different
 * powers, and the server only grants the first — this screen has nothing to ask
 * for even if it wanted to.
 *
 * Every change made here is written to the AFFECTED firm's own audit trail,
 * naming the operator. A power that crosses tenants is only acceptable when the
 * tenant it crossed into can read what was done.
 */

const pesos = (valor: number): string => `$${valor.toLocaleString('es-CO')}`;

const ESTADO_ETIQUETA: Record<string, string> = {
  active: 'Activa',
  past_due: 'En mora',
  canceled: 'Cancelada'
};

const ESTADO_ESTILO: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  past_due: 'bg-amber-50 text-amber-800 border-amber-200',
  canceled: 'bg-rose-50 text-rose-800 border-rose-200'
};

export const OperatorConsole: React.FC = () => {
  const [firms, setFirms] = React.useState<FirmSummary[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');
  const [creando, setCreando] = React.useState(false);
  const [recargando, setRecargando] = React.useState<string | null>(null);

  const [nueva, setNueva] = React.useState({
    firmName: '',
    nit: '',
    adminEmail: '',
    adminPassword: '',
    initialCredits: 0
  });

  const cargar = React.useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setFirms(await adminApi.listFirms());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las firmas.');
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await adminApi.createFirm(nueva);
      setNueva({ firmName: '', nit: '', adminEmail: '', adminPassword: '', initialCredits: 0 });
      setCreando(false);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la firma.');
    }
  };

  const recargar = async (firm: FirmSummary) => {
    const texto = window.prompt(`Recargar saldo de ${firm.name}. Monto en COP:`, '50000');
    if (!texto) return;

    const monto = Number(texto.replace(/[^\d]/g, ''));
    if (!monto) {
      setError('El monto debe ser un número mayor que cero.');
      return;
    }

    setRecargando(firm.id);
    setError('');

    try {
      const { creditsBalance } = await adminApi.addCredits(firm.id, monto);
      // Applied locally from the SERVER's figure, not by adding on screen: the
      // balance that matters is the one the database ended up with.
      setFirms((actuales) =>
        actuales.map((f) => (f.id === firm.id ? { ...f, creditsBalance } : f))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo aplicar la recarga.');
    } finally {
      setRecargando(null);
    }
  };

  const cambiarEstado = async (firm: FirmSummary, status: string) => {
    setError('');
    try {
      await adminApi.updateFirm(firm.id, { status });
      setFirms((actuales) => actuales.map((f) => (f.id === firm.id ? { ...f, status } : f)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-900" />
          <div>
            <h3 className="font-bold text-slate-900 text-xs">Firmas en la plataforma</h3>
            <p className="text-[11px] text-slate-500">
              {firms.length} {firms.length === 1 ? 'firma registrada' : 'firmas registradas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => void cargar()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={() => setCreando((v) => !v)}
            className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva firma</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-800">{error}</p>
        </div>
      )}

      {creando && (
        <form onSubmit={crear} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <h4 className="font-bold text-slate-900 text-xs">Registrar una firma cliente</h4>
          <p className="text-[11px] text-slate-500">
            Se crea la firma y la cuenta de su administrador en un solo paso. Entrégale la contraseña
            por un canal seguro y pídele que la cambie.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              value={nueva.firmName}
              onChange={(e) => setNueva({ ...nueva, firmName: e.target.value })}
              placeholder="Nombre de la firma"
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:border-blue-900"
              required
            />
            <input
              value={nueva.nit}
              onChange={(e) => setNueva({ ...nueva, nit: e.target.value })}
              placeholder="NIT"
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-blue-900"
              required
            />
            <input
              type="email"
              value={nueva.adminEmail}
              onChange={(e) => setNueva({ ...nueva, adminEmail: e.target.value })}
              placeholder="Correo del administrador"
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:border-blue-900"
              required
            />
            <input
              type="password"
              value={nueva.adminPassword}
              onChange={(e) => setNueva({ ...nueva, adminPassword: e.target.value })}
              placeholder="Contraseña inicial (mínimo 8)"
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-blue-900"
              required
            />
            <input
              type="number"
              value={nueva.initialCredits || ''}
              onChange={(e) => setNueva({ ...nueva, initialCredits: Number(e.target.value) })}
              placeholder="Saldo inicial en COP (opcional)"
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:border-blue-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-3 py-1.5 bg-blue-950 hover:bg-blue-900 text-white rounded-lg text-[11px] font-semibold"
            >
              Crear firma y cuenta
            </button>
            <button
              type="button"
              onClick={() => setCreando(false)}
              className="text-[11px] text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando && firms.length === 0 ? (
        <p className="text-[11px] text-slate-500 px-1">Cargando firmas…</p>
      ) : firms.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
          <Building2 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-[11px] text-slate-500">
            Todavía no hay firmas registradas en la plataforma.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
          {firms.map((firm) => (
            <div key={firm.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-xs truncate">{firm.name}</p>
                  <p className="text-[11px] text-slate-500 font-mono">NIT {firm.nit}</p>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                    ESTADO_ESTILO[firm.status] ?? 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {ESTADO_ETIQUETA[firm.status] ?? firm.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-600">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  Saldo <b className="text-slate-900">{pesos(firm.creditsBalance)}</b>
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  {firm.users} {firm.users === 1 ? 'cuenta' : 'cuentas'}
                </span>
                <span>
                  {firm.transcriptions}{' '}
                  {firm.transcriptions === 1 ? 'audiencia transcrita' : 'audiencias transcritas'}
                </span>
                <span className="font-mono text-slate-400">{firm.planTier}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => void recargar(firm)}
                  disabled={recargando === firm.id}
                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[11px] font-semibold disabled:opacity-50"
                >
                  {recargando === firm.id ? 'Recargando…' : 'Recargar saldo'}
                </button>

                <select
                  value={firm.status}
                  onChange={(e) => void cambiarEstado(firm, e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:border-blue-900"
                >
                  <option value="active">Activa</option>
                  <option value="past_due">En mora</option>
                  <option value="canceled">Cancelada</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {/*
        Said plainly, because an operator should know the limits of their own
        console — and because a firm that asks deserves an answer that matches
        what the code does.
      */}
      <p className="text-[11px] text-slate-500 px-1">
        Esta consola gestiona el negocio de cada firma: su plan, su saldo y sus cuentas. No da acceso
        a sus audiencias, borradores ni expedientes — eso es material amparado por el secreto
        profesional. Cada cambio queda registrado en la auditoría de la firma afectada, con tu correo.
      </p>
    </div>
  );
};
