import React from 'react';
import { AlertCircle, ExternalLink, Gift, RefreshCw } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { urlDelCheckout } from '../../billing/wompiCheckout';
import { subscriptionApi } from '../subscription.api';
import { generarCuentaDeCobro } from '../cuentaDeCobro.pdf';
import { useTenant } from '../../tenant/TenantContext';
import {
  anualSonDiezMeses,
  avisoDelPlan,
  lineaDelVencimiento,
  modulosDelCatalogo,
  nombreDelPlanActual,
  notaDeLaTarjeta,
  encajeDePuestos,
  TEXTO_DE_LA_PRUEBA
} from '../planEnPantalla';
import {
  ETIQUETA_DE_PERIODO,
  NOMBRE_DE_MODULO,
  type PagoDePlan,
  type PaidPeriod,
  type Plan,
  type PlanDeFirma,
  type PlanDefinition
} from '../types';

/**
 * «Renovar o cambiar de plan».
 *
 * SIGUE EL ARTBOARD «CAMBIAR DE PLAN» DE `public/handoff/app-ajustes-y-plan.html`
 * (:390): cuántos usuarios tiene la firma arriba, el interruptor mensual/anual,
 * tres tarjetas que se ELIGEN —precio en monoespaciada, usuarios y módulos, y
 * una nota sobre si le alcanza a esta firma—, la nota de lo que cambia al
 * cambiar, y el pie con «Pago por Wompi» y un solo primario que nombra el plan
 * elegido. Elegir primero y pagar abajo, con un solo botón, es lo que evita
 * leer tres botones para decidir uno.
 *
 * PAGAR ES UN CHECKOUT DE WOMPI POR PERIODO. El servidor firma el precio del
 * catálogo y el navegador salta a la pasarela con esa firma; nada se cobra
 * automáticamente ni se guarda tarjeta. Renovar el MISMO plan extiende desde la
 * fecha vigente, así que pagar antes nunca pierde días; CAMBIAR de plan empieza
 * el ciclo el día del pago y no acredita lo que quedaba, y por eso se advierte
 * ANTES de pagar, con la otra vía —Soporte, conservando la fecha—.
 *
 * LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón:
 *  · «Si sube de plan, el periodo que ya pagó se descuenta» — es falso: el
 *    servidor no acredita los días (`cambioDePlan.rules`). Se dice lo contrario.
 *  · «Tendría que retirar a 3 abogados» — el checkout no compara usuarios con el
 *    tope; se dice cuántos tiene la firma y hasta cuántos llega el plan.
 *  · Los estados «esperando la confirmación», «pago aprobado» y «pago rechazado»
 *    de `app-registro-y-planes.html` — la aplicación no recibe hoy el regreso
 *    de Wompi para un plan: la confirmación llega al servidor por el evento y el
 *    plan se extiende solo. Pintar una espera que nadie resuelve sería peor que
 *    decir, como se dice, que se vuelva a abrir esta pantalla para verlo.
 *
 * SOLO LOS ADMINISTRADORES PAGAN. Un abogado ve planes y precios, no el botón:
 * comprometer a la firma por un año es decisión de un socio, y el servidor
 * rechaza el checkout a cualquier otro.
 *
 * LA PRUEBA GRATUITA SE PIDE DESDE AQUÍ, y solo la de Esencial. Cuando el
 * servidor dice `pruebaDisponible` —firma sin pagos ni prueba, un usuario,
 * persona que no ha probado— se ofrece; el servidor vuelve a decidir al pedirla.
 */

interface FirmSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** FIRM_ADMIN o SUPER_ADMIN. Decide si se pinta el botón de pago. */
  puedePagar: boolean;
  /** La cáscara guarda una copia del plan para la navegación y el aviso. */
  onPlanLeido?: (plan: PlanDeFirma) => void;
  /**
   * El plan que el socio ya eligió afuera (portada o registro para
   * contratar). Esa tarjeta llega elegida: quien acaba de pedir Firma no debe
   * encontrar otro plan marcado.
   */
  planSugerido?: Plan | null;
}

const pesos = (valor: number): string => `$${Math.round(valor).toLocaleString('es-CO')}`;

const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

const ORDEN_DE_PLANES: readonly Plan[] = ['ESENCIAL', 'PREMIUM', 'FIRMA'];

const esPeriodoPagado = (plan: PlanDeFirma | null): boolean => plan?.period === 'MENSUAL' || plan?.period === 'ANUAL';

export const FirmSubscriptionModal: React.FC<FirmSubscriptionModalProps> = ({
  isOpen,
  onClose,
  puedePagar,
  onPlanLeido,
  planSugerido = null
}) => {
  const { activeFirm } = useTenant();
  const [plan, setPlan] = React.useState<PlanDeFirma | null>(null);
  const [planes, setPlanes] = React.useState<Record<Plan, PlanDefinition> | null>(null);
  const [pagos, setPagos] = React.useState<PagoDePlan[]>([]);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pagando, setPagando] = React.useState(false);
  /* El anual por defecto: es el que rinde doce meses por el precio de diez. */
  const [periodo, setPeriodo] = React.useState<PaidPeriod>('ANUAL');
  const [elegido, setElegido] = React.useState<Plan | null>(null);
  const [verHistorial, setVerHistorial] = React.useState(false);
  /*
   * EL SALTO SE HACE NAVEGANDO, Y SI NO OCURRE SE OFRECE EL ENLACE. Un
   * `location.assign` tras un `await` es la clase de navegación que algunos
   * navegadores móviles frenan en silencio; un toque sobre un enlace no lo
   * frena ninguno. La intención es la misma —misma referencia, misma firma—,
   * así que abrirla por el enlace no crea un segundo intento.
   */
  const [enlaceCheckout, setEnlaceCheckout] = React.useState<string | null>(null);
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
  const [activandoPrueba, setActivandoPrueba] = React.useState(false);

  const cargar = React.useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      /*
       * EL HISTORIAL NO PUEDE TUMBAR LA COMPRA. Con la prueba gratuita
       * terminada el servidor solo abre leer el plan y pagar: el historial
       * responde 403, y ese rechazo dentro de `Promise.all` dejaba la pantalla
       * sin planes — la única salida de esa firma, cerrada. Esa firma no tiene
       * pagos por definición, así que la lista vacía es la verdad.
       */
      const [{ plan: p, planes: catalogo }, historial] = await Promise.all([
        subscriptionApi.plan(),
        subscriptionApi.payments().catch((): PagoDePlan[] => [])
      ]);
      setPlan(p);
      setPlanes(catalogo);
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
    setElegido(null);
    void cargar();
  }, [isOpen, cargar]);

  /* Llega elegido lo que el socio pidió afuera; si no pidió nada, el plan que ya tiene; si no tiene, Premium. */
  React.useEffect(() => {
    if (!plan || elegido) return;
    setElegido(planSugerido ?? plan.plan ?? 'PREMIUM');
  }, [plan, elegido, planSugerido]);

  const pagar = async () => {
    if (!elegido) return;
    setPagando(true);
    setError(null);
    try {
      const intent = await subscriptionApi.checkout(elegido, periodo);
      const url = urlDelCheckout(intent);
      setEnlaceCheckout(url);
      window.location.assign(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar el pago. No se cobró nada.');
    } finally {
      setPagando(false);
    }
  };

  /*
   * Al terminar, el plan nuevo sube a la cáscara por `onPlanLeido`: es lo que
   * alimenta el PlanContext. Un 409 trae la frase del servidor y se muestra en
   * el mismo sitio que cualquier otro error de esta pantalla.
   */
  const solicitarPrueba = async () => {
    setActivandoPrueba(true);
    setError(null);
    try {
      const { plan: nuevo, planes: catalogo } = await subscriptionApi.solicitarPruebaGratuita();
      setPlan(nuevo);
      setPlanes(catalogo);
      onPlanLeido?.(nuevo);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo activar la prueba gratuita.');
    } finally {
      setActivandoPrueba(false);
    }
  };

  const ofrecerPrueba = () =>
    setConfirmacion({
      titulo: TEXTO_DE_LA_PRUEBA.oferta,
      texto: <p className="cn-plan-dlg-texto">{TEXTO_DE_LA_PRUEBA.confirmacion}</p>,
      etiqueta: 'Empezar la prueba',
      onConfirmar: solicitarPrueba
    });

  const precioDe = (def: PlanDefinition): number => (periodo === 'ANUAL' ? def.precioAnualCop : def.precioMensualCop);

  /*
   * Espejo de `debeAdvertirCambio` del backend (subscriptions/cambioDePlan.rules):
   * hay algo que advertir solo cuando la firma se mueve a OTRO plan y todavía
   * le queda tiempo pagado, que es exactamente lo que va a entregar. Sin plan,
   * sin fecha o ya vencida no pierde nada, así que no se le dice nada.
   */
  const advertirCambio = (destino: Plan): boolean =>
    plan !== null &&
    plan.plan !== null &&
    plan.plan !== destino &&
    plan.validUntil !== null &&
    plan.diasRestantes !== null &&
    plan.diasRestantes > 0;

  const todos = modulosDelCatalogo(planes);
  const defElegida = elegido && planes ? planes[elegido] : null;
  const verbo = plan?.plan === elegido && esPeriodoPagado(plan) ? 'Renovar' : esPeriodoPagado(plan) ? 'Pasar a' : 'Contratar';

  const subtitulo =
    plan && defElegida
      ? `Su firma tiene ${plan.usuarios} ${plan.usuarios === 1 ? 'usuario' : 'usuarios'} con acceso. ${defElegida.nombre} llega a ${defElegida.maxUsuarios}.`
      : 'El consumo de inteligencia artificial va aparte, por recargas de saldo.';

  /* La prueba terminada no tiene aviso en `avisoDelPlan`: tiene su pantalla, y aquí se le recuerda su única salida. */
  const aviso = plan
    ? plan.acceso === 'PRUEBA_TERMINADA'
      ? {
          titulo: 'La prueba gratuita terminó',
          texto:
            'Para volver a entrar a la aplicación hay que contratar un plan. El trabajo de la firma se conserva y el saldo de recargas no se pierde.',
          tono: 'peligro' as const
        }
      : avisoDelPlan(plan, fechaLarga)
    : null;

  return (
    <div className="cara-nueva cn-plan-dialogos">
      <Dialog
        abierto={isOpen}
        onCerrar={onClose}
        titulo={esPeriodoPagado(plan) ? 'Renovar o cambiar de plan' : 'Elegir un plan'}
        subtitulo={subtitulo}
        tamano="L"
        pieIzquierda={
          <span className="cn-plan-pie">
            {puedePagar ? 'Pago por Wompi, sin tarjeta guardada · IVA incluido' : 'Solo un socio administrador puede pagar el plan.'}
          </span>
        }
        acciones={
          <>
            <button type="button" onClick={onClose} className="cn-plan-boton cn-plan-boton--terciario">
              {puedePagar ? 'Cancelar' : 'Cerrar'}
            </button>
            {puedePagar && defElegida && (
              <button
                type="button"
                onClick={() => void pagar()}
                disabled={pagando || activandoPrueba}
                className="cn-plan-boton cn-plan-boton--primario"
              >
                {pagando ? (
                  <>
                    <RefreshCw className="cn-plan-girando" aria-hidden="true" />
                    Abriendo Wompi…
                  </>
                ) : (
                  `${verbo} ${defElegida.nombre} ${periodo === 'ANUAL' ? 'anual' : 'mensual'}`
                )}
              </button>
            )}
          </>
        }
      >
        <div className="cn-plan-cuerpo">
          {cargando && !plan && (
            <p className="cn-plan-cargando" role="status">
              <RefreshCw className="cn-plan-girando" aria-hidden="true" />
              Leyendo el plan…
            </p>
          )}

          {error && (
            <div className="cn-plan-error" role="alert">
              <AlertCircle className="cn-plan-boton-icono" aria-hidden="true" />
              <p>{error}</p>
            </div>
          )}

          {enlaceCheckout && (
            <p className="cn-plan-enlace-caja">
              Si la pasarela no se abrió,{' '}
              <a href={enlaceCheckout}>
                abra el pago aquí <ExternalLink className="cn-plan-enlace-icono" aria-hidden="true" />
              </a>
              . Al confirmarse, el plan se extiende solo; vuelva a abrir esta pantalla para verlo.
            </p>
          )}

          {plan && (
            <p className="cn-plan-hoy">
              Hoy: <b>{nombreDelPlanActual(plan, planes)}</b>
              {plan.period && plan.period !== 'CORTESIA' ? ` ${ETIQUETA_DE_PERIODO[plan.period].toLowerCase()}` : ''} ·{' '}
              {lineaDelVencimiento(plan, fechaLarga)}
            </p>
          )}

          {aviso && (
            <div className={`cn-plan-aviso${aviso.tono === 'peligro' ? ' cn-plan-aviso--peligro' : ''}`}>
              <div className="cn-plan-aviso-textos">
                <p className="cn-plan-aviso-titulo">{aviso.titulo}</p>
                <p className="cn-plan-aviso-texto">{aviso.texto}</p>
              </div>
            </div>
          )}

          {plan && planes && (
            <>
              <div className="cn-plan-periodo">
                <div className="cn-plan-segmentos" role="radiogroup" aria-label="Periodo">
                  {(['MENSUAL', 'ANUAL'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={periodo === p}
                      onClick={() => setPeriodo(p)}
                      className={`cn-plan-segmento${periodo === p ? ' cn-plan-segmento--activo' : ''}`}
                    >
                      {ETIQUETA_DE_PERIODO[p]}
                    </button>
                  ))}
                </div>
                {anualSonDiezMeses(planes) && <span className="cn-plan-diez">El año son diez meses</span>}
              </div>

              <div className="cn-plan-tarjetas" role="radiogroup" aria-label="Plan">
                {ORDEN_DE_PLANES.map((clave) => {
                  const def = planes[clave];
                  const esElActual = plan.plan === clave;
                  const activa = elegido === clave;
                  const faltan = todos.filter((m) => !def.modulos.includes(m));
                  const { cabe } = encajeDePuestos(plan.usuarios, def.maxUsuarios);
                  return (
                    <button
                      key={clave}
                      type="button"
                      role="radio"
                      aria-checked={activa}
                      onClick={() => setElegido(clave)}
                      className={`cn-plan-opcion${activa ? ' cn-plan-opcion--elegida' : ''}`}
                    >
                      <span className="cn-plan-opcion-cabeza">
                        <span className="cn-plan-opcion-nombre">{def.nombre}</span>
                        {esElActual && <span className="cn-plan-chip">El suyo</span>}
                        {!esElActual && planSugerido === clave && <span className="cn-plan-chip">Su elección</span>}
                      </span>
                      <span className="cn-plan-precio">
                        {pesos(precioDe(def))}
                        <span className="cn-plan-precio-periodo">{periodo === 'ANUAL' ? 'al año' : 'al mes'}</span>
                      </span>
                      <span className="cn-plan-opcion-resumen">
                        {def.maxUsuarios === 1 ? '1 usuario' : `Hasta ${def.maxUsuarios} usuarios`} ·{' '}
                        {faltan.length === 0 ? `los ${todos.length} módulos` : `${def.modulos.length} de ${todos.length} módulos`}
                      </span>
                      {faltan.length > 0 && (
                        <span className="cn-plan-opcion-sin">Sin {faltan.map((m) => NOMBRE_DE_MODULO[m]).join(', ')}</span>
                      )}
                      <span className={`cn-plan-opcion-nota${cabe ? '' : ' cn-plan-opcion-nota--no-alcanza'}`}>
                        {notaDeLaTarjeta(esElActual, plan.usuarios, def)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {plan.pruebaDisponible && puedePagar && (
                <div className="cn-plan-prueba">
                  <button
                    type="button"
                    disabled={pagando || activandoPrueba}
                    onClick={ofrecerPrueba}
                    className="cn-plan-prueba-boton"
                  >
                    {activandoPrueba ? <RefreshCw className="cn-plan-girando" aria-hidden="true" /> : <Gift className="cn-plan-boton-icono" aria-hidden="true" />}
                    {activandoPrueba ? 'Activando la prueba…' : TEXTO_DE_LA_PRUEBA.oferta}
                  </button>
                  <p className="cn-plan-prueba-detalle">{TEXTO_DE_LA_PRUEBA.detalle}</p>
                </div>
              )}

              {/*
                LO QUE CUESTA CAMBIAR DE PLAN SE DICE ANTES DE PAGAR, y solo del
                plan elegido. Aparece cuando hay algo que perder —plan distinto,
                con fecha y todavía al día—: advertirle a una firma vencida lo que
                ya no tiene sería una falsa alarma, y una advertencia que casi
                siempre está deja de leerse el día que importa.
              */}
              {puedePagar && elegido && defElegida && advertirCambio(elegido) && (
                <div className="cn-plan-advertencia" role="status">
                  <p className="cn-plan-advertencia-texto">
                    Va a cambiar de plan: {defElegida.nombre} se paga completo y su ciclo empieza el día del pago. Los{' '}
                    {plan.diasRestantes} {plan.diasRestantes === 1 ? 'día' : 'días'} que le quedan de{' '}
                    {nombreDelPlanActual(plan, planes)} no se acreditan ni se devuelven.
                  </p>
                  <p className="cn-plan-advertencia-otra">
                    Si prefiere conservar su fecha de vencimiento, escríbanos por Soporte antes de pagar.
                  </p>
                </div>
              )}

              <div className="cn-plan-nota">
                <p>
                  Renovar el plan que ya tiene —también al pasar de mensual a anual— suma el periodo a la fecha vigente:
                  pagar antes nunca pierde días. Cambiar a otro plan se paga completo y su ciclo empieza el día del pago,
                  sin acreditar lo que quedaba del anterior. Cambiar de plan no toca el saldo ni borra nada: los escritos,
                  las revisiones y los resúmenes se descuentan del saldo de recargas, aparte del plan.
                </p>
              </div>
            </>
          )}

          {plan && (
            /* Historial, plegado: importa después de pagar, no antes. */
            <section className="cn-plan-historial">
              <button
                type="button"
                onClick={() => setVerHistorial((v) => !v)}
                className="cn-plan-historial-boton"
                aria-expanded={verHistorial}
              >
                <span>
                  <span className="cn-plan-historial-titulo">Pagos del plan</span>
                  <span className="cn-plan-historial-detalle">
                    {pagos.length === 0
                      ? 'La firma todavía no ha pagado ningún periodo.'
                      : `${pagos.length} ${pagos.length === 1 ? 'pago' : 'pagos'} · las recargas de saldo tienen su propio extracto.`}
                  </span>
                </span>
                {pagos.length > 0 && <span className="cn-plan-historial-accion">{verHistorial ? 'Ocultar' : 'Ver'}</span>}
              </button>
              {verHistorial && pagos.length > 0 && (
                <div className="cn-plan-tabla-caja">
                  <table className="cn-plan-tabla">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Plan</th>
                        <th>Periodo cubierto</th>
                        <th className="cn-plan-derecha">Valor</th>
                        <th>Pagó</th>
                        <th>Soporte</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagos.map((p) => (
                        <tr key={p.id}>
                          <td className="cn-plan-mono">{fechaCorta(p.createdAt)}</td>
                          <td>
                            {planes?.[p.plan]?.nombre ?? p.plan} · {ETIQUETA_DE_PERIODO[p.period]}
                          </td>
                          <td className="cn-plan-mono">
                            {fechaCorta(p.validFrom)} → {fechaCorta(p.validUntil)}
                          </td>
                          <td className="cn-plan-mono cn-plan-derecha">{pesos(p.amountCop)}</td>
                          <td>{p.userEmail}</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => generarCuentaDeCobro(p, { nombre: activeFirm.name, nit: activeFirm.nit, correo: p.userEmail })}
                              className="cn-plan-tabla-boton"
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
          )}
        </div>
      </Dialog>

      <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
    </div>
  );
};
