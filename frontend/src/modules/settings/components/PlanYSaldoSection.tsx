import React from 'react';
import { RefreshCw } from 'lucide-react';
import { useTenant } from '../../tenant/TenantContext';
import { usePlan } from '../../subscriptions/PlanContext';
import { subscriptionApi } from '../../subscriptions/subscription.api';
import { billingApi, type BillingSummary } from '../../billing/billing.api';
import {
  avisoDelPlan,
  lineaDelVencimiento,
  modulosDelCatalogo,
  nombreDelPlanActual
} from '../../subscriptions/planEnPantalla';
import type { Plan, PlanDeFirma, PlanDefinition } from '../../subscriptions/types';
import { Cabecera } from './SeccionesSuyas';

/**
 * Ajustes › Plan y saldo.
 *
 * SIGUE EL ARTBOARD «PLAN Y SALDO» DE `public/handoff/app-ajustes-y-plan.html`
 * (:347): el plan activo en una tarjeta en tinta con sus tres cifras, el aviso
 * de vencimiento debajo, «Qué está usando» y la nota de que plan y saldo son dos
 * cobros distintos.
 *
 * TODO NÚMERO SALE DEL SERVIDOR: el precio del catálogo que llega con el plan,
 * los usuarios que él contó, los módulos que él permite, y el saldo y el consumo
 * del mes del resumen de cobro. Uno que no llegó no se pinta, y nunca como 0.
 *
 * LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón:
 *  · «se renueva en 18 días» — nada se renueva solo; se dice «vence».
 *  · «Pagar la renovación» y «Cambiar de plan» como dos botones — abren la
 *    misma pantalla de planes, donde se elige el plan y el periodo; dos botones
 *    para la misma puerta harían creer que pagar la renovación es un cobro
 *    directo.
 *  · «Escritos este mes · sin tope» — el plan no pone tope de escritos, pero lo
 *    que los limita es el saldo; se dice «del saldo», no «sin tope».
 * La recarga del saldo no vive aquí: tiene su propia pantalla en el panel.
 */

const pesos = (valor: number): string => `$${Math.round(valor).toLocaleString('es-CO')}`;

const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

/** «$0 al mes · IVA incluido» para los periodos que se pagan; nada para prueba y cortesía. */
const precioDelPeriodo = (plan: PlanDeFirma, planes: Record<Plan, PlanDefinition> | null): string | null => {
  if (!plan.plan || !planes) return null;
  const def = planes[plan.plan];
  if (plan.period === 'MENSUAL') return `${pesos(def.precioMensualCop)} al mes · IVA incluido`;
  if (plan.period === 'ANUAL') return `${pesos(def.precioAnualCop)} al año · IVA incluido`;
  return null;
};

export const PlanYSaldoSection: React.FC = () => {
  const { plan: planDelContexto, abrirPlan, puedePagar } = usePlan();
  const { activeFirm } = useTenant();
  const [plan, setPlan] = React.useState<PlanDeFirma | null>(planDelContexto);
  const [planes, setPlanes] = React.useState<Record<Plan, PlanDefinition> | null>(null);
  const [resumen, setResumen] = React.useState<BillingSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  /*
   * SE RELEE CUANDO EL PLAN DEL CONTEXTO CAMBIA: la pantalla de planes, al
   * cerrarse tras un pago o una prueba, sube el plan nuevo a la cáscara, y esta
   * sección no puede seguir mostrando el viejo.
   */
  React.useEffect(() => {
    let cancelado = false;
    subscriptionApi
      .plan()
      .then((r) => {
        if (cancelado) return;
        setPlan(r.plan);
        setPlanes(r.planes);
        setError(null);
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'No se pudo leer el plan de la firma.');
      });
    /* El resumen de cobro es aparte: si falla, el plan se sigue viendo sin las cifras del mes. */
    billingApi
      .summary()
      .then(({ summary }) => {
        if (!cancelado) setResumen(summary);
      })
      .catch(() => {
        /* Sin resumen no se pintan saldo ni consumo: nunca un 0 inventado. */
      });
    return () => {
      cancelado = true;
    };
  }, [planDelContexto]);

  const aviso = plan ? avisoDelPlan(plan, fechaLarga) : null;
  const precio = plan ? precioDelPeriodo(plan, planes) : null;
  const totalDeModulos = modulosDelCatalogo(planes).length;
  const saldo = resumen?.balance ?? activeFirm.creditsBalance;

  return (
    <section>
      <Cabecera titulo="Plan y saldo" texto="Lo cambia un socio administrador. Aplica a toda la firma." />

      {error && (
        <p className="cn-aju-error" role="alert">
          {error}
        </p>
      )}
      {!plan && !error && (
        <p className="cn-aju-cargando" role="status">
          <RefreshCw className="cn-aju-girando" aria-hidden="true" />
          Leyendo el plan…
        </p>
      )}

      {plan && (
        <>
          <div className="cn-plan-tarjeta">
            <div className="cn-plan-tarjeta-cabeza">
              <div className="cn-plan-tarjeta-textos">
                <p className="cn-plan-kicker">{plan.estado === 'VENCIDO' ? 'Plan vencido' : 'Plan activo'}</p>
                <p className="cn-plan-nombre">{nombreDelPlanActual(plan, planes)}</p>
                <p className="cn-plan-linea">
                  {precio ? `${precio} · ` : ''}
                  {lineaDelVencimiento(plan, fechaLarga)}
                </p>
              </div>
              <button type="button" onClick={abrirPlan} className="cn-plan-boton cn-plan-boton--blanco">
                {puedePagar ? 'Renovar o cambiar de plan' : 'Ver los planes'}
              </button>
            </div>
            <dl className="cn-plan-cifras">
              <div>
                <dt className="cn-plan-cifra-rotulo">Puestos</dt>
                <dd className="cn-plan-cifra">
                  {plan.maxUsers !== null ? `${plan.usuarios} de ${plan.maxUsers}` : `${plan.usuarios} · sin tope`}
                </dd>
              </div>
              {totalDeModulos > 0 && (
                <div>
                  <dt className="cn-plan-cifra-rotulo">Módulos</dt>
                  <dd className="cn-plan-cifra">
                    {plan.modulosPermitidos.length} de {totalDeModulos}
                  </dd>
                </div>
              )}
              <div>
                <dt className="cn-plan-cifra-rotulo">Saldo de IA</dt>
                <dd className="cn-plan-cifra">{pesos(saldo)}</dd>
              </div>
            </dl>
          </div>

          {aviso && (
            <div className={`cn-plan-aviso${aviso.tono === 'peligro' ? ' cn-plan-aviso--peligro' : ''}`} role="status">
              <div className="cn-plan-aviso-textos">
                <p className="cn-plan-aviso-titulo">{aviso.titulo}</p>
                <p className="cn-plan-aviso-texto">{aviso.texto}</p>
              </div>
              {puedePagar && (
                <button type="button" onClick={abrirPlan} className="cn-plan-boton cn-plan-boton--sobre-aviso">
                  {plan.period === 'PRUEBA' ? 'Contratar un plan' : 'Pagar ahora'}
                </button>
              )}
            </div>
          )}
          {aviso && !puedePagar && (
            <p className="cn-aju-ayuda">Pagar el plan lo hace un socio administrador de la firma.</p>
          )}

          <p className="cn-aju-subtitulo cn-plan-uso-titulo">Qué está usando</p>
          <p className="cn-aju-ayuda">Con esto se decide si el plan le queda chico o grande.</p>
          <div className="cn-plan-uso">
            <div className="cn-plan-uso-fila">
              <span className="cn-plan-uso-nombre">Usuarios con acceso</span>
              <span className="cn-plan-uso-cifra">{plan.usuarios}</span>
              <span className="cn-plan-uso-nota">{plan.maxUsers !== null ? `tope ${plan.maxUsers}` : 'sin tope'}</span>
            </div>
            {resumen?.mes && (
              <>
                <div className="cn-plan-uso-fila">
                  <span className="cn-plan-uso-nombre">Escritos este mes</span>
                  <span className="cn-plan-uso-cifra">{resumen.mes.escritos}</span>
                  <span className="cn-plan-uso-nota">del saldo</span>
                </div>
                <div className="cn-plan-uso-fila">
                  <span className="cn-plan-uso-nombre">Gastado en IA este mes</span>
                  <span className="cn-plan-uso-cifra">{pesos(resumen.mes.cobradoCop)}</span>
                  <span className="cn-plan-uso-nota">aparte del plan</span>
                </div>
              </>
            )}
          </div>

          <div className="cn-plan-nota">
            <p>
              El plan paga el <b>acceso</b> —módulos y puestos—. El saldo paga el <b>consumo</b> de inteligencia
              artificial, y el plan no incluye saldo: son dos cobros distintos. Las recargas están en «Saldo», en el
              panel lateral.
            </p>
          </div>
        </>
      )}
    </section>
  );
};
