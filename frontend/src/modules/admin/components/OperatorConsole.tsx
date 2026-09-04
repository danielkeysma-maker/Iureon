import React from 'react';
import { AlertCircle, Building2, CreditCard, Plus, RefreshCw, ShieldCheck, Users, Library } from 'lucide-react';
import { adminApi, type FirmSummary } from '../admin.api';
import { FirmDetailDialog } from './FirmDetailDialog';
import { CatalogMasterDialog } from './CatalogMasterDialog';
import { RechargeFirmDialog } from './RechargeFirmDialog';
import { BandejaDeSoporte } from './BandejaDeSoporte';

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
  active: 'bg-[rgb(var(--verified-surf))] text-verified border-[rgb(var(--verified-line))]',
  past_due: 'bg-[rgb(var(--unverified-surf))] text-unverified border-[rgb(var(--unverified-line))]',
  canceled: 'bg-[rgb(var(--danger)/0.06)] text-danger border-[rgb(var(--danger)/0.35)]'
};

export const OperatorConsole: React.FC = () => {
  const [firms, setFirms] = React.useState<FirmSummary[]>([]);
  const [fichaAbierta, setFichaAbierta] = React.useState<string | null>(null);
  const [maestroAbierto, setMaestroAbierto] = React.useState(false);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');
  const [creando, setCreando] = React.useState(false);
  const [recargando, setRecargando] = React.useState<string | null>(null);
  /** La firma cuyo dialogo de recarga esta abierto; null cuando ninguno. */
  const [firmARecargar, setFirmARecargar] = React.useState<FirmSummary | null>(null);

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

  /*
   * The operator's recharge is NOT bound by the commercial minimum.
   *
   * $100.000 is the smallest amount a firm can BUY, and it exists because
   * Wompi's fixed $700 per transaction makes anything smaller expensive to
   * collect. None of that applies here: crediting $20.000 as compensation for a
   * failed draft, or correcting an amount typed wrong, is a different act with
   * no gateway involved. Enforcing the sales floor on the repair tool would
   * leave the only person who can fix a balance unable to fix it precisely.
   *
   * So the minimum is the default in the box, where it belongs — a nudge toward
   * the amount that is usually right — and not a rule that rejects the operator.
   */
  /*
   * YA NO ES UN `window.prompt`. Era la caja gris del navegador —«iureon-app
   * .vercel.app dice»— y ademas escondia un defecto: el servidor exige motivo
   * (`requireReason`) y el prompt solo pedia monto, asi que la recarga fallaba
   * siempre. `RechargeFirmDialog` pide las dos cosas y este metodo recibe las
   * dos ya validadas.
   */
  const recargar = async (firm: FirmSummary, monto: number, motivo: string) => {
    setRecargando(firm.id);
    setError('');

    try {
      const { creditsBalance } = await adminApi.addCredits(firm.id, monto, motivo);
      // Applied locally from the SERVER's figure, not by adding on screen: the
      // balance that matters is the one the database ended up with.
      setFirms((actuales) =>
        actuales.map((f) => (f.id === firm.id ? { ...f, creditsBalance } : f))
      );
      setFirmARecargar(null);
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

  /*
   * DIAS DE SALDO AL RITMO ACTUAL: balance / (consumo30/30). Solo se calcula
   * con consumo real — una firma sin actividad no tiene "ritmo" y estimarle
   * dias seria inventar una alarma. null = sin estimacion, y se dice.
   */
  const diasDeSaldo = (f: FirmSummary): number | null => {
    if (f.consumo30dCop <= 0) return null;
    return Math.floor(f.creditsBalance / (f.consumo30dCop / 30));
  };

  /*
   * ORDEN POR RIESGO OPERATIVO, no alfabetico: la firma a punto de quedarse
   * sin saldo va PRIMERO — es a la que hay que llamar hoy. Despues las de
   * menos catalogo curado (usan el producto a medias), y el resto por consumo.
   */
  const ordenadas = [...firms].sort((a, b) => {
    const da = diasDeSaldo(a);
    const db = diasDeSaldo(b);
    const riesgoA = da !== null && da <= 7 ? da : 999;
    const riesgoB = db !== null && db <= 7 ? db : 999;
    if (riesgoA !== riesgoB) return riesgoA - riesgoB;
    return b.consumo30dCop - a.consumo30dCop;
  });

  const saldoAgregado = firms.reduce((t, f) => t + f.creditsBalance, 0);
  const consumo30Agregado = firms.reduce((t, f) => t + f.consumo30dCop, 0);
  const porAgotarse = firms.filter((f) => {
    const d = diasDeSaldo(f);
    return d !== null && d <= 7;
  }).length;

  return (
    <div className="space-y-4">
      {/*
        LA BANDEJA DE SOPORTE VA ARRIBA: es lo único de esta consola que tiene a
        alguien esperando al otro lado. Las cifras de saldo se consultan; una
        pregunta de una firma se responde.
      */}
      <BandejaDeSoporte />

      {/* ─── LAS CIFRAS AGREGADAS (7a): la salud de la casa de un vistazo ── */}
      {firms.length > 0 && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line-200 bg-line-100 sm:grid-cols-4">
          <div className="bg-surface px-4 py-2.5">
            <p className="font-mono text-[18px] font-semibold text-ink-900">
              ${saldoAgregado.toLocaleString('es-CO')}
            </p>
            <p className="text-meta text-ink-500">Saldo agregado — es pasivo: trabajo ya vendido</p>
          </div>
          <div className="bg-surface px-4 py-2.5">
            <p className="font-mono text-[18px] font-semibold text-ink-900">
              ${consumo30Agregado.toLocaleString('es-CO')}
            </p>
            <p className="text-meta text-ink-500">Consumo 30 días</p>
          </div>
          <div className="bg-surface px-4 py-2.5">
            <p className={`font-mono text-[18px] font-semibold ${porAgotarse > 0 ? 'text-unverified' : 'text-ink-900'}`}>
              {porAgotarse}
            </p>
            <p className="text-meta text-ink-500">Con ≤7 días de saldo al ritmo actual</p>
          </div>
          <div className="bg-surface px-4 py-2.5">
            <p className="font-mono text-[18px] font-semibold text-ink-900">{firms.length}</p>
            <p className="text-meta text-ink-500">Firmas en la plataforma</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between bg-surface border border-line-200 rounded-card px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-700" />
          <div>
            <h3 className="font-bold text-ink-900 text-xs">Firmas en la plataforma</h3>
            <p className="text-[11px] text-ink-500">
              {firms.length} {firms.length === 1 ? 'firma registrada' : 'firmas registradas'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/*
            El maestro va en la cabecera de la lista de firmas y no dentro de
            una ficha: no es un dato DE una firma, es la base que reciben todas.
            Colgarlo de una firma sugeriria que se puede publicar desde ella.
          */}
          <button
            onClick={() => setMaestroAbierto(true)}
            className="px-3 py-1.5 bg-canvas hover:bg-line-100 text-ink-700 border border-line-200 rounded-control text-[11px] font-semibold flex items-center gap-1.5"
          >
            <Library className="w-3.5 h-3.5" />
            Catálogo maestro
          </button>
          <button
            onClick={() => void cargar()}
            className="px-3 py-1.5 bg-canvas hover:bg-line-100 text-ink-700 border border-line-200 rounded-control text-[11px] font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
          <button
            onClick={() => setCreando((v) => !v)}
            className="px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-control text-[11px] font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva firma</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[rgb(var(--danger)/0.06)] border border-[rgb(var(--danger)/0.35)] rounded-card p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
          <p className="text-[11px] text-danger">{error}</p>
        </div>
      )}

      {creando && (
        <form onSubmit={crear} className="bg-surface border border-line-200 rounded-card p-4 space-y-3">
          <h4 className="font-bold text-ink-900 text-xs">Registrar una firma cliente</h4>
          <p className="text-[11px] text-ink-500">
            Se crea la firma y la cuenta de su administrador en un solo paso. Entrégale la contraseña
            por un canal seguro y pídele que la cambie.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              value={nueva.firmName}
              onChange={(e) => setNueva({ ...nueva, firmName: e.target.value })}
              placeholder="Nombre de la firma"
              className="bg-canvas border border-line-200 rounded-control px-3 py-2 text-[11px] focus:outline-none focus:border-brand-700"
              required
            />
            <input
              value={nueva.nit}
              onChange={(e) => setNueva({ ...nueva, nit: e.target.value })}
              placeholder="NIT (opcional: un litigante persona natural no tiene)"
              className="bg-canvas border border-line-200 rounded-control px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-brand-700"
            />
            <input
              type="email"
              value={nueva.adminEmail}
              onChange={(e) => setNueva({ ...nueva, adminEmail: e.target.value })}
              placeholder="Correo del administrador"
              className="bg-canvas border border-line-200 rounded-control px-3 py-2 text-[11px] focus:outline-none focus:border-brand-700"
              required
            />
            <input
              type="password"
              value={nueva.adminPassword}
              onChange={(e) => setNueva({ ...nueva, adminPassword: e.target.value })}
              placeholder="Contraseña inicial (mínimo 8)"
              className="bg-canvas border border-line-200 rounded-control px-3 py-2 text-[11px] font-mono focus:outline-none focus:border-brand-700"
              required
            />
            <input
              type="number"
              value={nueva.initialCredits || ''}
              onChange={(e) => setNueva({ ...nueva, initialCredits: Number(e.target.value) })}
              placeholder="Saldo inicial en COP (opcional)"
              className="bg-canvas border border-line-200 rounded-control px-3 py-2 text-[11px] focus:outline-none focus:border-brand-700"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white rounded-control text-[11px] font-semibold"
            >
              Crear firma y cuenta
            </button>
            <button
              type="button"
              onClick={() => setCreando(false)}
              className="text-[11px] text-ink-500 hover:text-ink-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {cargando && firms.length === 0 ? (
        <p className="text-[11px] text-ink-500 px-1">Cargando firmas…</p>
      ) : firms.length === 0 ? (
        <div className="bg-surface border border-line-200 rounded-card p-6 text-center">
          <Building2 className="w-6 h-6 text-slate-300 mx-auto mb-2" />
          <p className="text-[11px] text-ink-500">
            Todavía no hay firmas registradas en la plataforma.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-line-200 rounded-card divide-y divide-line-100">
          {ordenadas.map((firm) => (
            <div key={firm.id} className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => setFichaAbierta(firm.id)}
                    className="block max-w-full truncate text-left text-xs font-bold text-ink-900 hover:underline"
                    title="Abrir la ficha de la firma"
                  >
                    {firm.name}
                  </button>
                  <p className="text-[11px] text-ink-500 font-mono">{firm.nit ? `NIT ${firm.nit}` : 'Sin NIT'}</p>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
                    ESTADO_ESTILO[firm.status] ?? 'bg-canvas text-ink-700 border-line-200'
                  }`}
                >
                  {ESTADO_ETIQUETA[firm.status] ?? firm.status}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-500">
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-ink-400" />
                  Saldo <b className="text-ink-900">{pesos(firm.creditsBalance)}</b>
                  {/*
                    LOS DIAS, no solo los pesos: "4 dias de saldo" es la alarma
                    que hace llamar hoy. Solo con consumo real — sin ritmo no
                    hay estimacion, y se dice "sin consumo" en vez de inventar.
                  */}
                  {(() => {
                    const d = diasDeSaldo(firm);
                    if (d === null)
                      return <span className="text-ink-400">· sin consumo este mes</span>;
                    return (
                      <span className={d <= 7 ? 'font-semibold text-unverified' : 'text-ink-400'}>
                        · ≈{d} {d === 1 ? 'día' : 'días'} al ritmo actual
                      </span>
                    );
                  })()}
                </span>
                <span>Consumo 30 d <b className="text-ink-900">{pesos(firm.consumo30dCop)}</b></span>
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-ink-400" />
                  {firm.users} {firm.users === 1 ? 'cuenta' : 'cuentas'}
                </span>
                <span>
                  {/* La salud del activo que la firma construye: curado bajo = producto a medias. */}
                  Catálogo curado{' '}
                  <b className="text-ink-900">
                    {firm.catalogoTotal > 0
                      ? `${Math.round((firm.catalogoCuradas / firm.catalogoTotal) * 100)}%`
                      : '—'}
                  </b>
                  <span className="text-ink-400"> ({firm.catalogoCuradas})</span>
                </span>
                <span>
                  {firm.transcriptions}{' '}
                  {firm.transcriptions === 1 ? 'transcripción' : 'transcripciones'}
                </span>
                <span className="font-mono text-ink-400">{firm.planTier}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setFirmARecargar(firm)}
                  disabled={recargando === firm.id}
                  className="px-2.5 py-1 bg-[rgb(var(--verified-surf))] hover:bg-[rgb(var(--verified-surf))] text-verified border border-[rgb(var(--verified-line))] rounded-control text-[11px] font-semibold disabled:opacity-50"
                >
                  {recargando === firm.id ? 'Recargando…' : 'Recargar saldo'}
                </button>

                <select
                  value={firm.status}
                  onChange={(e) => void cambiarEstado(firm, e.target.value)}
                  className="bg-canvas border border-line-200 rounded-control px-2 py-1 text-[11px] focus:outline-none focus:border-brand-700"
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
      <p className="text-[11px] text-ink-500 px-1">
        Esta consola gestiona el negocio de cada firma: su plan, su saldo y sus cuentas. No da acceso
        a sus audiencias, borradores ni expedientes — eso es material amparado por el secreto
        profesional. Cada cambio queda registrado en la auditoría de la firma afectada, con tu correo.
      </p>

      <FirmDetailDialog firmId={fichaAbierta} onClose={() => setFichaAbierta(null)} />
      <RechargeFirmDialog
        firm={firmARecargar}
        ocupado={firmARecargar !== null && recargando === firmARecargar.id}
        onCerrar={() => setFirmARecargar(null)}
        onConfirmar={recargar}
      />

      <CatalogMasterDialog isOpen={maestroAbierto} onClose={() => setMaestroAbierto(false)} />
    </div>
  );
};
