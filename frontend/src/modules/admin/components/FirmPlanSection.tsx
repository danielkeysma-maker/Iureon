import React from 'react';
import { CalendarClock } from 'lucide-react';
import { adminApi, type FirmDetail } from '../admin.api';

/**
 * La sección «Plan» de la ficha de la firma (7b), con su formulario.
 *
 * LO QUE OPERACIÓN PUEDE HACER AQUÍ: fijar plan, periodo y vencimiento a mano
 * —extender una prueba, conceder una cortesía, mover una firma a Esencial tras
 * una llamada—. Cada cambio exige motivo escrito y queda en la auditoría de la
 * firma como PLAN_ACTUALIZADO, que sus socios también leen. Es la acción
 * «cambiar plan / extender prueba» que la cabecera de la ficha declaraba
 * ausente por falta de endpoint; ahora el endpoint existe.
 *
 * LO QUE NO HACE: cobrar. Un pago lo hace la firma desde su propia pantalla,
 * por Wompi; operación no puede marcar un periodo como pagado.
 */

type Plan = 'ESENCIAL' | 'PREMIUM';
type Periodo = 'MENSUAL' | 'ANUAL' | 'PRUEBA' | 'CORTESIA';

const NOMBRE_PLAN: Record<Plan, string> = { ESENCIAL: 'Esencial', PREMIUM: 'Premium' };
const NOMBRE_PERIODO: Record<Periodo, string> = {
  MENSUAL: 'Mensual',
  ANUAL: 'Anual',
  PRUEBA: 'Prueba',
  CORTESIA: 'Cortesía'
};

const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

/** AAAA-MM-DD para el <input type="date">, en hora local. */
const aFechaDeInput = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

const estadoDe = (f: FirmDetail): { etiqueta: string; clase: string } => {
  if (!f.planValidUntil) return { etiqueta: 'Cortesía', clase: 'bg-canvas text-ink-700 border-line-200' };
  const dias = Math.ceil((new Date(f.planValidUntil).getTime() - Date.now()) / 86_400_000);
  if (dias <= 0)
    return { etiqueta: 'Vencido', clase: 'bg-[rgb(var(--danger)/0.06)] text-danger border-[rgb(var(--danger)/0.35)]' };
  if (dias <= 7)
    return {
      etiqueta: `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`,
      clase: 'bg-[rgb(var(--unverified-surf))] text-unverified border-[rgb(var(--unverified-line))]'
    };
  if (f.planPeriod === 'PRUEBA')
    return { etiqueta: 'Prueba', clase: 'bg-brand-50 text-brand-700 border-[rgb(var(--brand-line))]' };
  return { etiqueta: 'Activo', clase: 'bg-[rgb(var(--verified-surf))] text-verified border-[rgb(var(--verified-line))]' };
};

interface FirmPlanSectionProps {
  firma: FirmDetail;
  /** Tras guardar, la ficha se relee entera: el estado sale del servidor. */
  onGuardado: () => void;
}

export const FirmPlanSection: React.FC<FirmPlanSectionProps> = ({ firma, onGuardado }) => {
  const [editando, setEditando] = React.useState(false);
  const [plan, setPlan] = React.useState<Plan>(firma.plan ?? 'PREMIUM');
  const [periodo, setPeriodo] = React.useState<Periodo>(firma.planPeriod ?? 'CORTESIA');
  const [vence, setVence] = React.useState(aFechaDeInput(firma.planValidUntil));
  const [motivo, setMotivo] = React.useState('');
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const estado = estadoDe(firma);
  const necesitaFecha = periodo !== 'CORTESIA';

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (necesitaFecha && !vence) {
      setError('Ese periodo necesita una fecha de vencimiento.');
      return;
    }
    if (motivo.trim().length < 5) {
      setError('Escriba el motivo: queda en la auditoría de la firma.');
      return;
    }

    setGuardando(true);
    try {
      await adminApi.updateFirmPlan(firma.id, {
        plan,
        period: periodo,
        // Fin del día local elegido: «vence el 30» significa que el 30 todavía trabaja.
        validUntil: vence ? new Date(`${vence}T23:59:59`).toISOString() : null,
        motivo: motivo.trim()
      });
      setEditando(false);
      setMotivo('');
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo fijar el plan.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="rounded-card border border-line-200 bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line-200 px-4 py-3">
        <div>
          <h3 className="text-[13px] font-semibold text-ink-900">Plan</h3>
          <p className="mt-0.5 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
            Lo que la firma tiene contratado. Operación puede fijarlo a mano —extender una prueba,
            conceder cortesía— con motivo escrito; cobrar solo lo hace la firma, por Wompi.
          </p>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${estado.clase}`}>
          {estado.etiqueta}
        </span>
      </header>

      <dl className="grid gap-3 px-4 py-3 text-[12px] sm:grid-cols-4">
        <div>
          <dt className="text-ink-400">Plan</dt>
          <dd className="mt-0.5 font-medium text-ink-900">
            {firma.plan ? NOMBRE_PLAN[firma.plan] : 'Cortesía (sin plan)'}
          </dd>
        </div>
        <div>
          <dt className="text-ink-400">Periodo</dt>
          <dd className="mt-0.5 font-medium text-ink-900">
            {firma.planPeriod ? NOMBRE_PERIODO[firma.planPeriod] : '—'}
          </dd>
        </div>
        <div>
          <dt className="text-ink-400">Vence</dt>
          <dd className="mt-0.5 font-medium text-ink-900">
            {firma.planValidUntil ? fechaLarga(firma.planValidUntil) : 'Sin vencimiento'}
          </dd>
        </div>
        <div>
          <dt className="text-ink-400">Usuarios</dt>
          <dd className="mt-0.5 font-medium text-ink-900">
            {firma.users}
            {firma.planMaxUsers !== null ? ` de ${firma.planMaxUsers}` : ' · sin tope'}
          </dd>
        </div>
      </dl>

      {!editando ? (
        <div className="border-t border-line-200 px-4 py-3">
          <button type="button" onClick={() => setEditando(true)} className="btn-secondary flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Fijar plan o vencimiento
          </button>
        </div>
      ) : (
        <form onSubmit={(e) => void guardar(e)} className="space-y-3 border-t border-line-200 px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-[11px] text-ink-500">
              Plan
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as Plan)}
                className="mt-1 w-full rounded-control border border-line-200 bg-canvas px-2 py-1.5 text-[12px] text-ink-900 focus:border-brand-700 focus:outline-none"
              >
                <option value="ESENCIAL">Esencial · 1 usuario</option>
                <option value="PREMIUM">Premium · hasta 5 usuarios</option>
              </select>
            </label>
            <label className="block text-[11px] text-ink-500">
              Periodo
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value as Periodo)}
                className="mt-1 w-full rounded-control border border-line-200 bg-canvas px-2 py-1.5 text-[12px] text-ink-900 focus:border-brand-700 focus:outline-none"
              >
                <option value="PRUEBA">Prueba</option>
                <option value="MENSUAL">Mensual</option>
                <option value="ANUAL">Anual</option>
                <option value="CORTESIA">Cortesía (sin vencimiento)</option>
              </select>
            </label>
            <label className="block text-[11px] text-ink-500">
              Vence {necesitaFecha ? '' : '(opcional)'}
              <input
                type="date"
                value={vence}
                onChange={(e) => setVence(e.target.value)}
                className="mt-1 w-full rounded-control border border-line-200 bg-canvas px-2 py-1.5 text-[12px] text-ink-900 focus:border-brand-700 focus:outline-none"
              />
            </label>
          </div>

          <label className="block text-[11px] text-ink-500">
            Motivo · queda en la auditoría de la firma con su correo
            <input
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Prueba extendida dos semanas a petición del socio"
              className="mt-1 w-full rounded-control border border-line-200 bg-canvas px-2 py-1.5 text-[12px] text-ink-900 focus:border-brand-700 focus:outline-none"
            />
          </label>

          {error && <p className="text-[12px] text-danger">{error}</p>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={guardando} className="btn-primary text-[12px] disabled:opacity-50">
              {guardando ? 'Guardando…' : 'Guardar plan'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditando(false);
                setError(null);
              }}
              className="text-[12px] text-ink-500 hover:text-ink-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
