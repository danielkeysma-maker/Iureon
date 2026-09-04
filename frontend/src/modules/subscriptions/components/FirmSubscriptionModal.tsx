import React from 'react';
import { AlertCircle, Check, ExternalLink, RefreshCw, Users } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { urlDelCheckout } from '../../billing/wompiCheckout';
import { subscriptionApi } from '../subscription.api';
import {
  ETIQUETA_DE_ESTADO,
  ETIQUETA_DE_PERIODO,
  NOMBRE_DE_MODULO,
  type EstadoDelPlan,
  type Modulo,
  type PagoDePlan,
  type PaidPeriod,
  type Plan,
  type PlanDeFirma,
  type PlanDefinition
} from '../types';

/**
 * «Plan de la firma»: what the firm has, what it can buy, what it has paid.
 *
 * WHAT THIS REPLACES. A modal titled "Suscripción & Equipo" that showed a
 * token quota nobody measured, a renewal date typed into App.tsx and an invite
 * form that pushed a fabricated lawyer into local state and announced
 * "Invitación enviada exitosamente". Every number here is the server's.
 *
 * PAYING IS ONE CHECKOUT PER PERIOD. Wompi as integrated is a one-off web
 * checkout, so nothing is charged automatically: the button takes the partner
 * to Wompi with the price the server signed, and the confirmation extends the
 * plan from its current expiry — paying early never loses days. AI usage is
 * separate and stays prepaid from Saldo; the screen says so, because a partner
 * who just paid a plan will otherwise expect drafts to be included.
 *
 * ONLY ADMINISTRATORS PAY. A lawyer sees the plan and the prices but not the
 * buttons: binding the firm for a year is a partner's decision, and the server
 * refuses the checkout to anyone else anyway.
 */

interface FirmSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** FIRM_ADMIN or SUPER_ADMIN. Decides whether the pay buttons render. */
  puedePagar: boolean;
  /** The shell keeps a copy of the plan for the nav and the banner. */
  onPlanLeido?: (plan: PlanDeFirma) => void;
}

const pesos = (valor: number): string => `$${Math.round(valor).toLocaleString('es-CO')}`;

const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

const ESTILO_DE_ESTADO: Record<EstadoDelPlan, string> = {
  ACTIVO: 'bg-[rgb(var(--verified-surf))] text-verified border-[rgb(var(--verified-line))]',
  PRUEBA: 'bg-brand-50 text-brand-700 border-[rgb(var(--brand-line))]',
  CORTESIA: 'bg-canvas text-ink-700 border-line-200',
  POR_VENCER: 'bg-[rgb(var(--unverified-surf))] text-unverified border-[rgb(var(--unverified-line))]',
  VENCIDO: 'bg-[rgb(var(--danger)/0.06)] text-danger border-[rgb(var(--danger)/0.35)]'
};

const nombreDelPlan = (plan: Plan | null, planes: Record<Plan, PlanDefinition> | null): string =>
  plan ? planes?.[plan]?.nombre ?? plan : 'Cortesía';

export const FirmSubscriptionModal: React.FC<FirmSubscriptionModalProps> = ({
  isOpen,
  onClose,
  puedePagar,
  onPlanLeido
}) => {
  const [plan, setPlan] = React.useState<PlanDeFirma | null>(null);
  const [planes, setPlanes] = React.useState<Record<Plan, PlanDefinition> | null>(null);
  const [pagos, setPagos] = React.useState<PagoDePlan[]>([]);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pagando, setPagando] = React.useState<string | null>(null);
  /*
   * EL SALTO SE HACE NAVEGANDO, Y SI NO OCURRE SE OFRECE EL ENLACE. Mismo
   * razonamiento que en Saldo: un `location.assign` tras un `await` es la
   * clase de navegación que algunos navegadores móviles frenan en silencio,
   * y un toque del usuario sobre un enlace no lo frena ninguno. La intención
   * es la misma —misma referencia, misma firma— así que abrirla por el enlace
   * no crea un segundo intento.
   */
  const [enlaceCheckout, setEnlaceCheckout] = React.useState<string | null>(null);

  const cargar = React.useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [{ plan: p, planes: catalogo }, historial] = await Promise.all([
        subscriptionApi.plan(),
        subscriptionApi.payments()
      ]);
      setPlan(p);
      setPlanes(catalogo);
      setPagos(historial);
      onPlanLeido?.(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el plan de la firma.');
    } finally {
      setCargando(false);
    }
  }, [onPlanLeido]);

  React.useEffect(() => {
    if (!isOpen) return;
    setEnlaceCheckout(null);
    void cargar();
  }, [isOpen, cargar]);

  const pagar = async (elegido: Plan, period: PaidPeriod) => {
    const clave = `${elegido}-${period}`;
    setPagando(clave);
    setError(null);
    try {
      const intent = await subscriptionApi.checkout(elegido, period);
      const url = urlDelCheckout(intent);
      setEnlaceCheckout(url);
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar el pago.');
    } finally {
      setPagando(null);
    }
  };

  const modulosDe = (lista: readonly Modulo[]): string =>
    lista.map((m) => NOMBRE_DE_MODULO[m]).join(' · ');

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      titulo="Plan de la firma"
      subtitulo="Lo que la firma tiene contratado, lo que puede contratar y lo que ha pagado. El consumo de inteligencia artificial va aparte, por recargas de saldo."
      tamano="L"
      cuerpoEnCanvas
    >
      {cargando && !plan && (
        <div className="flex items-center justify-center gap-2 py-16 text-ink-400">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-[13px]">Leyendo el plan…</span>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-card border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <p className="text-justify text-[12px] leading-snug text-danger [text-wrap:pretty]">{error}</p>
        </div>
      )}

      {enlaceCheckout && (
        <div className="mb-4 rounded-card border border-[rgb(var(--brand-line))] bg-surface px-4 py-3 text-[12px] text-ink-700">
          Si la pasarela no se abrió,{' '}
          <a href={enlaceCheckout} className="inline-flex items-center gap-1 font-medium text-brand-700 underline">
            abra el pago aquí <ExternalLink className="h-3 w-3" />
          </a>
          . Al confirmarse, el plan se extiende solo; vuelva a abrir esta pantalla para verlo.
        </div>
      )}

      {plan && (
        <div className="space-y-4">
          {/* ─── El plan vigente ──────────────────────────────────────────── */}
          <section className="rounded-card border border-line-200 bg-surface px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  Plan actual
                </p>
                <p className="mt-1 text-[19px] font-semibold leading-none text-ink-900">
                  {nombreDelPlan(plan.plan, planes)}
                  {plan.period && plan.period !== 'CORTESIA' && (
                    <span className="ml-2 text-[13px] font-normal text-ink-500">
                      {ETIQUETA_DE_PERIODO[plan.period]}
                    </span>
                  )}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${ESTILO_DE_ESTADO[plan.estado]}`}
              >
                {ETIQUETA_DE_ESTADO[plan.estado]}
              </span>
            </div>

            <dl className="mt-4 grid gap-3 text-[12px] sm:grid-cols-3">
              <div>
                <dt className="text-ink-400">Vence</dt>
                <dd className="mt-0.5 font-medium text-ink-900">
                  {plan.validUntil ? fechaLarga(plan.validUntil) : 'Sin vencimiento'}
                  {plan.diasRestantes !== null && plan.diasRestantes > 0 && (
                    <span className="ml-1 text-ink-500">
                      · {plan.diasRestantes} {plan.diasRestantes === 1 ? 'día' : 'días'}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-ink-400">Usuarios</dt>
                <dd className="mt-0.5 flex items-center gap-1 font-medium text-ink-900">
                  <Users className="h-3.5 w-3.5 text-ink-400" />
                  {plan.usuarios}
                  {plan.maxUsers !== null ? ` de ${plan.maxUsers}` : ' · sin tope'}
                </dd>
              </div>
              <div>
                <dt className="text-ink-400">Módulos incluidos</dt>
                <dd className="mt-0.5 text-justify leading-snug text-ink-700 [text-wrap:pretty]">
                  {modulosDe(plan.modulosPermitidos)}
                </dd>
              </div>
            </dl>

            {plan.estado === 'VENCIDO' && (
              <p className="mt-3 text-justify text-[12px] leading-snug text-danger [text-wrap:pretty]">
                El plan venció. La firma puede entrar, leer y exportar; para volver a generar
                escritos, revisar o transcribir, hay que pagar un periodo. El saldo de recargas no
                se pierde.
              </p>
            )}
          </section>

          {/* ─── Qué se puede contratar ───────────────────────────────────── */}
          {planes && (
            <section className="grid gap-3 md:grid-cols-2">
              {(['ESENCIAL', 'PREMIUM'] as const).map((clave) => {
                const def = planes[clave];
                const esElActual = plan.plan === clave;
                return (
                  <article
                    key={clave}
                    className={`rounded-card border bg-surface px-4 py-4 ${
                      esElActual ? 'border-brand-700' : 'border-line-200'
                    }`}
                  >
                    <header className="flex items-baseline justify-between gap-2">
                      <h3 className="text-[15px] font-semibold text-ink-900">{def.nombre}</h3>
                      {esElActual && (
                        <span className="text-[10.5px] font-medium uppercase tracking-wide text-brand-700">
                          Su plan
                        </span>
                      )}
                    </header>
                    <p className="mt-1 text-[12px] text-ink-500">
                      {pesos(def.precioMensualCop)} al mes · {pesos(def.precioAnualCop)} al año ·{' '}
                      {def.maxUsuarios === 1 ? '1 usuario' : `hasta ${def.maxUsuarios} usuarios`}
                    </p>
                    <ul className="mt-3 space-y-1 text-[12px] text-ink-700">
                      {def.modulos.map((m) => (
                        <li key={m} className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 shrink-0 text-verified" />
                          {NOMBRE_DE_MODULO[m]}
                        </li>
                      ))}
                    </ul>

                    {puedePagar ? (
                      <div className="mt-4 flex flex-col gap-2">
                        <button
                          type="button"
                          disabled={pagando !== null}
                          onClick={() => void pagar(clave, 'MENSUAL')}
                          className="btn-secondary w-full justify-center text-[12px] disabled:opacity-50"
                        >
                          {pagando === `${clave}-MENSUAL`
                            ? 'Abriendo la pasarela…'
                            : `Pagar ${pesos(def.precioMensualCop)} · 1 mes`}
                        </button>
                        <button
                          type="button"
                          disabled={pagando !== null}
                          onClick={() => void pagar(clave, 'ANUAL')}
                          className="btn-primary w-full justify-center text-[12px] disabled:opacity-50"
                        >
                          {pagando === `${clave}-ANUAL`
                            ? 'Abriendo la pasarela…'
                            : `Pagar ${pesos(def.precioAnualCop)} · 12 meses (2 gratis)`}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-4 text-[11.5px] text-ink-500">
                        Solo un administrador de la firma puede pagar el plan.
                      </p>
                    )}
                  </article>
                );
              })}
            </section>
          )}

          <p className="px-1 text-justify text-[11.5px] leading-snug text-ink-500 [text-wrap:pretty]">
            Los precios incluyen IVA. Cada pago es un checkout de Wompi; no se guarda tarjeta ni se
            cobra automáticamente. Pagar antes de vencer suma el periodo a la fecha vigente, nunca
            se pierden días. Al cambiar de plan, el nuevo rige desde ese pago. Los escritos, las
            revisiones y los resúmenes se descuentan del saldo de recargas, aparte del plan.
          </p>

          {/* ─── Historial ───────────────────────────────────────────────── */}
          <section className="rounded-card border border-line-200 bg-surface">
            <header className="border-b border-line-200 px-4 py-3">
              <h3 className="text-[13px] font-semibold text-ink-900">Pagos del plan</h3>
              <p className="mt-0.5 text-[11px] text-ink-500">
                Solo los pagos del plan. Las recargas de saldo están en su propio extracto.
              </p>
            </header>
            {pagos.length === 0 ? (
              <p className="px-4 py-8 text-center text-[12px] text-ink-500">
                La firma todavía no ha pagado ningún periodo.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-line-200 text-left text-ink-400">
                      <th className="px-4 py-2 font-medium">Fecha</th>
                      <th className="px-4 py-2 font-medium">Plan</th>
                      <th className="px-4 py-2 font-medium">Periodo cubierto</th>
                      <th className="px-4 py-2 text-right font-medium">Valor</th>
                      <th className="px-4 py-2 font-medium">Pagó</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((p) => (
                      <tr key={p.id} className="border-b border-line-200 last:border-0">
                        <td className="px-4 py-2.5 tabular-nums text-ink-700">{fechaCorta(p.createdAt)}</td>
                        <td className="px-4 py-2.5 text-ink-900">
                          {planes?.[p.plan]?.nombre ?? p.plan} · {ETIQUETA_DE_PERIODO[p.period]}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-ink-700">
                          {fechaCorta(p.validFrom)} → {fechaCorta(p.validUntil)}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-ink-900">
                          {pesos(p.amountCop)}
                        </td>
                        <td className="px-4 py-2.5 text-ink-500">{p.userEmail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </Dialog>
  );
};
