import React from 'react';
import { AlertCircle, ArrowRight, Check, ExternalLink, Lock, Minus, RefreshCw, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { urlDelCheckout } from '../../billing/wompiCheckout';
import { subscriptionApi } from '../subscription.api';
import { generarCuentaDeCobro } from '../cuentaDeCobro.pdf';
import { useTenant } from '../../tenant/TenantContext';
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
 * «Plan de la firma»: una página de precios, no un formulario.
 *
 * LO QUE SE DECIDE AQUÍ ES ANUAL O MENSUAL, y por eso el interruptor va arriba
 * y manda sobre las dos tarjetas a la vez: el socio compara los dos planes en
 * el mismo periodo, ve el precio grande y un solo botón por tarjeta. Dos
 * botones por tarjeta —como estaba— obligaban a leer cuatro cifras para elegir
 * una.
 *
 * PAGAR ES UN CHECKOUT DE WOMPI POR PERIODO. El servidor firma el precio del
 * catálogo y el navegador salta a la pasarela con esa firma; nada se cobra
 * automáticamente ni se guarda tarjeta. La confirmación extiende el plan desde
 * la fecha vigente, así que pagar antes nunca pierde días. El consumo de
 * inteligencia artificial va aparte, por recargas de saldo, y se dice en la
 * misma pantalla porque quien acaba de pagar un plan espera que los escritos
 * vayan incluidos.
 *
 * SOLO LOS ADMINISTRADORES PAGAN. Un abogado ve planes y precios, no los
 * botones: comprometer a la firma por un año es decisión de un socio, y el
 * servidor rechaza el checkout a cualquier otro.
 */

interface FirmSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** FIRM_ADMIN o SUPER_ADMIN. Decide si se pintan los botones de pago. */
  puedePagar: boolean;
  /** La cáscara guarda una copia del plan para la navegación y el aviso. */
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

/** Una frase por plan: lo que el precio compra, antes de la lista. */
const LEMA: Record<Plan, string> = {
  ESENCIAL: 'Para el abogado que redacta y revisa solo.',
  PREMIUM: 'Para la firma: audiencias, entrevistas, orientación y hasta cinco personas.',
  FIRMA: 'Para la firma que crece: todos los módulos y hasta quince personas.'
};

/** Orden fijo para que la tarjeta Esencial muestre en gris lo que no incluye. */
const TODOS_LOS_MODULOS: readonly Modulo[] = [
  'REDACCION',
  'REVISIONES',
  'BORRADORES',
  'ORIENTACION',
  'AUDIENCIAS',
  'ENTREVISTAS',
  'BUSCADOR',
  'CATALOGO',
  'HERRAMIENTAS',
  'MEMBRETE',
  'SOPORTE',
  'MANUAL'
];

const nombreDelPlan = (plan: Plan | null, planes: Record<Plan, PlanDefinition> | null): string =>
  plan ? planes?.[plan]?.nombre ?? plan : 'Cortesía';

export const FirmSubscriptionModal: React.FC<FirmSubscriptionModalProps> = ({
  isOpen,
  onClose,
  puedePagar,
  onPlanLeido
}) => {
  const { activeFirm } = useTenant();
  const [plan, setPlan] = React.useState<PlanDeFirma | null>(null);
  const [planes, setPlanes] = React.useState<Record<Plan, PlanDefinition> | null>(null);
  const [pagos, setPagos] = React.useState<PagoDePlan[]>([]);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pagando, setPagando] = React.useState<Plan | null>(null);
  /* El anual por defecto: es la opción que la propia pantalla recomienda. */
  const [periodo, setPeriodo] = React.useState<PaidPeriod>('ANUAL');
  const [verHistorial, setVerHistorial] = React.useState(false);
  /*
   * EL SALTO SE HACE NAVEGANDO, Y SI NO OCURRE SE OFRECE EL ENLACE. Un
   * `location.assign` tras un `await` es la clase de navegación que algunos
   * navegadores móviles frenan en silencio; un toque sobre un enlace no lo
   * frena ninguno. La intención es la misma —misma referencia, misma firma—,
   * así que abrirla por el enlace no crea un segundo intento.
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
      /* Un historial vacío o ausente no puede tumbar la pantalla de pago. */
      setPagos(Array.isArray(historial) ? historial : []);
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

  const pagar = async (elegido: Plan) => {
    setPagando(elegido);
    setError(null);
    try {
      const intent = await subscriptionApi.checkout(elegido, periodo);
      const url = urlDelCheckout(intent);
      setEnlaceCheckout(url);
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar el pago.');
    } finally {
      setPagando(null);
    }
  };

  const precioDe = (def: PlanDefinition): number => (periodo === 'ANUAL' ? def.precioAnualCop : def.precioMensualCop);
  const mensualEquivalente = (def: PlanDefinition): number => (periodo === 'ANUAL' ? def.precioAnualCop / 12 : def.precioMensualCop);
  const ahorroAnual = (def: PlanDefinition): number => def.precioMensualCop * 12 - def.precioAnualCop;

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      titulo="Plan de la firma"
      subtitulo="Lo que la firma tiene contratado y lo que puede contratar. El consumo de inteligencia artificial va aparte, por recargas de saldo."
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
        <div className="space-y-5">
          {/* ─── El plan vigente: una franja oscura con el dato que importa ── */}
          <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-brand-700 to-ink-900 px-5 py-5 text-white shadow-e2">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-brand-50/10 blur-3xl" />
            <div className="relative flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-white/60">Plan actual</p>
                <p className="mt-1 text-[26px] font-semibold leading-none tracking-tight">
                  {nombreDelPlan(plan.plan, planes)}
                  {plan.period && plan.period !== 'CORTESIA' && (
                    <span className="ml-2 text-[13px] font-normal text-white/70">{ETIQUETA_DE_PERIODO[plan.period]}</span>
                  )}
                </p>
                <p className="mt-2 text-[12.5px] text-white/80">
                  {plan.validUntil ? (
                    <>
                      {plan.estado === 'VENCIDO' ? 'Venció el ' : 'Vence el '}
                      <span className="font-medium text-white">{fechaLarga(plan.validUntil)}</span>
                      {plan.diasRestantes !== null && plan.diasRestantes > 0 && (
                        <span className="text-white/60">
                          {' '}
                          · {plan.diasRestantes} {plan.diasRestantes === 1 ? 'día' : 'días'}
                        </span>
                      )}
                    </>
                  ) : (
                    'Sin vencimiento'
                  )}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11.5px] text-white">
                  <Users className="h-3.5 w-3.5" />
                  {plan.usuarios}
                  {plan.maxUsers !== null ? ` de ${plan.maxUsers} usuarios` : ' usuarios · sin tope'}
                </span>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${ESTILO_DE_ESTADO[plan.estado]}`}>
                  {ETIQUETA_DE_ESTADO[plan.estado]}
                </span>
              </div>
            </div>
            {plan.estado === 'VENCIDO' && (
              <p className="relative mt-4 rounded-control bg-white/10 px-3 py-2 text-justify text-[12px] leading-snug text-white [text-wrap:pretty]">
                El plan venció. La firma puede entrar, leer y exportar; para volver a generar escritos, revisar o transcribir, hay que pagar un periodo. El saldo de recargas no se pierde.
              </p>
            )}
          </section>

          {/* ─── Mensual / Anual ─────────────────────────────────────────── */}
          {planes && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-[15px] font-semibold text-ink-900">Elija el plan</h3>
                <div className="inline-flex items-center rounded-full border border-line-200 bg-surface p-1 shadow-e1">
                  {(['MENSUAL', 'ANUAL'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriodo(p)}
                      aria-pressed={periodo === p}
                      className={`rounded-full px-4 py-1.5 text-[12.5px] font-medium transition-colors ${
                        periodo === p ? 'bg-brand-700 text-white shadow-e1' : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      {p === 'MENSUAL' ? 'Mensual' : 'Anual'}
                      {p === 'ANUAL' && (
                        <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${periodo === 'ANUAL' ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700'}`}>
                          2 meses gratis
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── Las tres tarjetas ───────────────────────────────────── */}
              <section className="grid gap-4 md:grid-cols-3">
                {(['ESENCIAL', 'PREMIUM', 'FIRMA'] as const).map((clave) => {
                  const def = planes[clave];
                  const esElActual = plan.plan === clave;
                  const destacado = clave === 'PREMIUM';
                  const incluidos = new Set<Modulo>(def.modulos);
                  return (
                    <article
                      key={clave}
                      className={`relative flex flex-col rounded-card border bg-surface px-5 py-5 transition-shadow hover:shadow-e2 ${
                        destacado ? 'border-brand-700 shadow-e2 ring-1 ring-brand-700/20' : 'border-line-200 shadow-e1'
                      }`}
                    >
                      {destacado && (
                        <span className="absolute -top-3 left-5 inline-flex items-center gap-1 rounded-full bg-brand-700 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-white shadow-e1">
                          <Sparkles className="h-3 w-3" />
                          Recomendado
                        </span>
                      )}
                      {esElActual && (
                        <span className="absolute -top-3 right-5 rounded-full border border-line-200 bg-canvas px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wide text-ink-700">
                          Su plan
                        </span>
                      )}

                      <header>
                        <h4 className="text-[17px] font-semibold text-ink-900">{def.nombre}</h4>
                        <p className="mt-1 text-[12px] leading-snug text-ink-500">{LEMA[clave]}</p>
                      </header>

                      <div className="mt-4 flex items-baseline gap-1.5">
                        <span className="text-[34px] font-semibold leading-none tracking-tight text-ink-900">{pesos(precioDe(def))}</span>
                        <span className="text-[12.5px] text-ink-500">{periodo === 'ANUAL' ? '/ año' : '/ mes'}</span>
                      </div>
                      <p className="mt-1 text-[11.5px] text-ink-500">
                        {periodo === 'ANUAL' ? (
                          <>
                            Equivale a {pesos(mensualEquivalente(def))} al mes ·{' '}
                            <span className="font-medium text-verified">ahorra {pesos(ahorroAnual(def))}</span>
                          </>
                        ) : (
                          <>
                            En anual: {pesos(def.precioAnualCop)} · {pesos(def.precioAnualCop / 12)} al mes
                          </>
                        )}
                      </p>
                      <p className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-ink-700">
                        <Users className="h-3.5 w-3.5 text-ink-400" />
                        {def.maxUsuarios === 1 ? '1 usuario' : `Hasta ${def.maxUsuarios} usuarios`}
                      </p>

                      <ul className="mt-4 grid flex-1 grid-cols-1 gap-1.5 text-[12px] sm:grid-cols-2">
                        {TODOS_LOS_MODULOS.map((m) => {
                          const si = incluidos.has(m);
                          return (
                            <li key={m} className={`flex items-center gap-1.5 ${si ? 'text-ink-800' : 'text-ink-400 line-through decoration-ink-300'}`}>
                              {si ? <Check className="h-3.5 w-3.5 shrink-0 text-verified" /> : <Minus className="h-3.5 w-3.5 shrink-0 text-ink-300" />}
                              {NOMBRE_DE_MODULO[m]}
                            </li>
                          );
                        })}
                      </ul>

                      {puedePagar ? (
                        <button
                          type="button"
                          disabled={pagando !== null}
                          onClick={() => void pagar(clave)}
                          className={`mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-control text-[13px] font-semibold transition-colors disabled:opacity-50 ${
                            destacado ? 'bg-brand-700 text-white hover:bg-ink-900' : 'border border-brand-700 bg-surface text-brand-700 hover:bg-brand-50'
                          }`}
                        >
                          {pagando === clave ? (
                            <>
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Abriendo Wompi…
                            </>
                          ) : (
                            <>
                              {esElActual ? 'Renovar' : 'Contratar'} {def.nombre} {periodo === 'ANUAL' ? 'anual' : 'mensual'}
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      ) : (
                        <p className="mt-5 inline-flex items-center gap-1.5 text-[11.5px] text-ink-500">
                          <Lock className="h-3.5 w-3.5" />
                          Solo un administrador de la firma puede pagar el plan.
                        </p>
                      )}
                    </article>
                  );
                })}
              </section>

              {/* ─── Confianza, en una línea ─────────────────────────────── */}
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11.5px] text-ink-500">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-verified" />
                  Pago seguro en la pasarela de Wompi
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-ink-400" />
                  No se guarda tarjeta ni se cobra automáticamente
                </span>
                <span>Precios con IVA incluido</span>
              </div>

              <p className="px-1 text-justify text-[11.5px] leading-snug text-ink-500 [text-wrap:pretty]">
                Pagar antes de vencer suma el periodo a la fecha vigente, nunca se pierden días. Al cambiar de plan, el nuevo rige desde ese pago. Los escritos, las revisiones y los resúmenes se descuentan del saldo de recargas, aparte del plan.
              </p>
            </>
          )}

          {/* ─── Historial, plegado: importa después de pagar, no antes ──── */}
          <section className="rounded-card border border-line-200 bg-surface">
            <button
              type="button"
              onClick={() => setVerHistorial((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              aria-expanded={verHistorial}
            >
              <span>
                <span className="block text-[13px] font-semibold text-ink-900">Pagos del plan</span>
                <span className="mt-0.5 block text-[11px] text-ink-500">
                  {pagos.length === 0 ? 'La firma todavía no ha pagado ningún periodo.' : `${pagos.length} ${pagos.length === 1 ? 'pago' : 'pagos'} · las recargas de saldo están en su propio extracto.`}
                </span>
              </span>
              <span className="text-[12px] font-medium text-brand-700">{verHistorial ? 'Ocultar' : 'Ver'}</span>
            </button>
            {verHistorial && pagos.length > 0 && (
              <div className="overflow-x-auto border-t border-line-200">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-line-200 text-left text-ink-400">
                      <th className="px-4 py-2 font-medium">Fecha</th>
                      <th className="px-4 py-2 font-medium">Plan</th>
                      <th className="px-4 py-2 font-medium">Periodo cubierto</th>
                      <th className="px-4 py-2 text-right font-medium">Valor</th>
                      <th className="px-4 py-2 font-medium">Pagó</th>
                      <th className="px-4 py-2 font-medium">Soporte</th>
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
                        <td className="px-4 py-2.5 text-right tabular-nums text-ink-900">{pesos(p.amountCop)}</td>
                        <td className="px-4 py-2.5 text-ink-500">{p.userEmail}</td>
                        <td className="px-4 py-2.5">
                          <button
                            type="button"
                            onClick={() => generarCuentaDeCobro(p, { nombre: activeFirm.name, nit: activeFirm.nit, correo: p.userEmail })}
                            className="btn-neutral btn-sm whitespace-nowrap"
                            title="Descargar la cuenta de cobro de este pago en PDF"
                          >
                            Cuenta de cobro
                          </button>
                        </td>
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
