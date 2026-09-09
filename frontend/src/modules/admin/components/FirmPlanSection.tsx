import React from 'react';
import { Ban, CalendarClock } from 'lucide-react';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { adminApi, type FirmDetail } from '../admin.api';
import { VISTA_POR_MODULO, navModule } from '../../tenant/navigation';

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
 * SUSPENDER ES PONER EL VENCIMIENTO EN AHORA. No hay un interruptor aparte:
 * la firma queda VENCIDA en el acto —solo lectura, franja «Renovar plan»— por
 * la misma regla que cierra una prueba cumplida, y la reactiva un pago de la
 * firma o este mismo formulario. Un segundo estado «suspendida» habría que
 * enseñárselo a cada guardia; la fecha ya se la saben todos. Exige motivo:
 * queda en la auditoría de la firma como PLAN_SUSPENDIDO y los socios lo leen.
 *
 * LO QUE NO HACE: cobrar. Un pago lo hace la firma desde su propia pantalla,
 * por Wompi; operación no puede marcar un periodo como pagado.
 *
 * MÓDULOS DE ESTA FIRMA. El plan es la base y aquí se RESTA: un interruptor
 * por módulo, apagado = «desactivado por el operador», y la firma lo ve como
 * no disponible (no como «no incluido en el plan», que sería falso y la
 * mandaría a comprar un plan que no cambia nada). Lo que el plan no incluye se
 * muestra deshabilitado con su chip: para abrirlo se cambia el plan, no este
 * interruptor. La lista de módulos y sus nombres salen de `VISTA_POR_MODULO`
 * y `NAV_MODULES` —lo mismo que pinta la barra lateral—, nunca de una lista
 * escrita aquí: un módulo nuevo aparece solo. Cada cambio manda la lista
 * COMPLETA de lo apagado y queda en la auditoría de la firma como
 * MODULOS_AJUSTADOS; el motivo es opcional (reactivar tras un pago no tiene
 * nada que explicar).
 */

type Plan = 'ESENCIAL' | 'PREMIUM' | 'FIRMA';
type Periodo = 'MENSUAL' | 'ANUAL' | 'PRUEBA' | 'CORTESIA';

const NOMBRE_PLAN: Record<Plan, string> = { ESENCIAL: 'Esencial', PREMIUM: 'Premium', FIRMA: 'Firma' };
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
  /**
   * Tras guardar, la ficha se relee entera: el estado sale del servidor.
   *
   * SALVO CUANDO EL SERVIDOR YA LA DEVOLVIÓ. `PATCH /modulos` responde con la
   * ficha releída, así que pasarla aquí ahorra la segunda vuelta y su espera
   * en blanco. Sin argumento, el comportamiento de siempre.
   */
  onGuardado: (yaLeida?: FirmDetail) => void;
}

/** Los módulos que la aplicación puede cerrar, con el nombre que usa la barra lateral. */
const MODULOS_CONMUTABLES: ReadonlyArray<{ id: string; nombre: string }> = Object.entries(VISTA_POR_MODULO).map(
  ([id, vista]) => ({ id, nombre: navModule(vista as NonNullable<typeof vista>).label })
);

type EstadoDeModulo = 'ACTIVO' | 'DESACTIVADO' | 'NO_EN_PLAN';

/** Una función: apagada por sí misma, o apagada porque su módulo lo está (o no viene en el plan). */
type EstadoDeFuncion = 'ACTIVA' | 'DESACTIVADA' | 'CON_EL_MODULO';

const estadoDeFuncion = (firma: FirmDetail, estadoDelModulo: EstadoDeModulo, id: string): EstadoDeFuncion =>
  estadoDelModulo !== 'ACTIVO' ? 'CON_EL_MODULO' : firma.funcionesDesactivadas.includes(id) ? 'DESACTIVADA' : 'ACTIVA';

/**
 * Del servidor salen dos listas: lo permitido (plan menos resta) y la resta.
 * Un módulo que no está en ninguna de las dos no lo trae el plan.
 */
const estadoDeModulo = (firma: FirmDetail, id: string): EstadoDeModulo =>
  firma.modulosDesactivados.includes(id)
    ? 'DESACTIVADO'
    : firma.modulosPermitidos.includes(id)
      ? 'ACTIVO'
      : 'NO_EN_PLAN';

interface ModulosDeLaFirmaProps {
  firma: FirmDetail;
  onGuardado: (yaLeida?: FirmDetail) => void;
}

const ModulosDeLaFirma: React.FC<ModulosDeLaFirmaProps> = ({ firma, onGuardado }) => {
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
  const [motivo, setMotivo] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  /** Módulo o función: cambia el texto de la confirmación, no la llamada. */
  const [alcance, setAlcance] = React.useState<'modulo' | 'funcion'>('modulo');
  const motivoRef = React.useRef('');
  const mantenerAbiertoRef = React.useRef(false);

  const nombrePlan = firma.plan ? NOMBRE_PLAN[firma.plan] : 'Cortesía';

  /*
   * Se manda la lista COMPLETA de lo apagado — módulos y funciones en una sola
   * lista, como la guarda la columna — y no un delta: apagar una función no
   * puede reactivar un módulo por omisión.
   */
  const aplicar = async (id: string, apagar: boolean) => {
    const actuales = new Set<string>([...firma.modulosDesactivados, ...firma.funcionesDesactivadas]);
    if (apagar) actuales.add(id);
    else actuales.delete(id);
    setError(null);
    /*
     * ─── UNA SOLA VUELTA AL SERVIDOR, Y LA FICHA NO DESAPARECE ──────────────
     *
     * DEFECTO QUE ESTO CORRIGE: cada interruptor tardaba y «no respondía
     * bien». No era el interruptor: eran DOS peticiones seguidas. Esta, que
     * guarda, y otra que releía la ficha completa; y mientras la segunda
     * viajaba, toda la ficha se sustituía por «Leyendo la firma…» y la sección
     * se remontaba, así que apagar una función parpadeaba la pantalla entera.
     *
     * `PATCH /modulos` YA devuelve la ficha releída —el servidor la manda
     * desde el principio— y se estaba tirando. Ahora se entrega tal cual: un
     * viaje, sin espera en blanco y sin remontar nada. El estado lo sigue
     * decidiendo el servidor; aquí no se adivina el resultado.
     */
    let respuesta: Awaited<ReturnType<typeof adminApi.ajustarModulos>>;
    try {
      respuesta = await adminApi.ajustarModulos(firma.id, {
        desactivados: [...actuales],
        motivo: motivoRef.current.replace(/\s+/g, ' ').trim() || undefined
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron ajustar los módulos.');
      mantenerAbiertoRef.current = true;
      return;
    }
    setMotivo('');
    motivoRef.current = '';
    onGuardado(respuesta.firm);
  };

  const pedirConfirmacion = (id: string, nombre: string, apagar: boolean, tipo: 'modulo' | 'funcion' = 'modulo') => {
    setError(null);
    setMotivo('');
    motivoRef.current = '';
    setAlcance(tipo);
    setConfirmacion({
      titulo: apagar ? `Desactivar ${nombre} para esta firma` : `Reactivar ${nombre} para esta firma`,
      texto: '',
      etiqueta: apagar ? 'Desactivar' : 'Reactivar',
      peligro: apagar,
      onConfirmar: () => aplicar(id, apagar)
    });
  };

  return (
    <div className="min-w-0 border-t border-line-200 px-4 py-3">
      <h4 className="text-[12.5px] font-semibold text-ink-900">Módulos de esta firma</h4>
      <p className="mt-0.5 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
        El plan es la base; aquí se resta para esta firma. La firma verá el módulo como no disponible. Debajo de cada módulo,
        sus funciones: se apagan una a una y la firma las ve como «no habilitada para su firma».
      </p>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {MODULOS_CONMUTABLES.map(({ id, nombre }) => {
          const estado = estadoDeModulo(firma, id);
          const encendido = estado === 'ACTIVO';
          const enPlan = estado !== 'NO_EN_PLAN';
          const funciones = (firma.funciones ?? []).filter((f) => f.modulo === id);
          return (
            <li
              key={id}
              className={`rounded-control border border-line-200 px-3 py-2 ${
                enPlan ? 'bg-canvas' : 'bg-surface opacity-70'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-ink-900">{nombre}</p>
                {estado === 'DESACTIVADO' && (
                  <span className="chip-unverified mt-1 inline-block">Desactivado por el operador</span>
                )}
                {estado === 'NO_EN_PLAN' && (
                  <span className="chip-neutral mt-1 inline-block">No incluido en el plan {nombrePlan}</span>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={encendido}
                aria-label={`${nombre}: ${encendido ? 'activo' : 'inactivo'} para esta firma`}
                disabled={!enPlan}
                title={enPlan ? undefined : `Para abrirlo, cambie el plan de la firma: ${nombrePlan} no lo incluye.`}
                onClick={() => pedirConfirmacion(id, nombre, encendido)}
                className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed ${
                  encendido
                    ? 'border-brand-700 bg-brand-700'
                    : 'border-line-200 bg-line-100'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-surface shadow transition-transform ${
                    encendido ? 'left-0.5 translate-x-4' : 'left-0.5'
                  }`}
                />
              </button>
              </div>
              {funciones.length > 0 && (
                <ul className="mt-2 space-y-1.5 border-l border-line-200 pl-3">
                  {funciones.map((f) => {
                    const estadoF = estadoDeFuncion(firma, estado, f.id);
                    const encendida = estadoF === 'ACTIVA';
                    const conElModulo = estadoF === 'CON_EL_MODULO';
                    return (
                      <li key={f.id} className={`flex items-start justify-between gap-3 ${conElModulo ? 'opacity-60' : ''}`}>
                        <div className="min-w-0">
                          <p className="text-[11.5px] font-medium text-ink-900">
                            {f.nombre}
                            {conElModulo && <span className="ml-1 font-normal text-ink-400">(con el módulo)</span>}
                          </p>
                          <p className="text-justify text-[10.5px] leading-snug text-ink-500 [text-wrap:pretty]">{f.descripcion}</p>
                          {estadoF === 'DESACTIVADA' && (
                            <span className="chip-unverified mt-1 inline-block">Desactivada por el operador</span>
                          )}
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={encendida}
                          aria-label={`${f.nombre}: ${encendida ? 'activa' : 'inactiva'} para esta firma`}
                          disabled={conElModulo}
                          title={conElModulo ? 'Se apaga y se enciende con el módulo.' : undefined}
                          onClick={() => pedirConfirmacion(f.id, f.nombre, encendida, 'funcion')}
                          className={`relative mt-0.5 h-4 w-7 shrink-0 rounded-full border transition-colors disabled:cursor-not-allowed ${
                            encendida ? 'border-brand-700 bg-brand-700' : 'border-line-200 bg-line-100'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-surface shadow transition-transform ${
                              encendida ? 'left-0.5 translate-x-3' : 'left-0.5'
                            }`}
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <ConfirmarDialog
        confirmacion={
          confirmacion && {
            ...confirmacion,
            texto: (
              <div className="space-y-3">
                <p>
                  {alcance === 'funcion' ? (
                    confirmacion.peligro ? (
                      <>
                        La firma <b>{firma.name}</b> deja de ver esta función en el acto: el módulo sigue abierto y la
                        pantalla la muestra como «no habilitada para su firma»; el servidor la rechaza aunque alguien la
                        pida por fuera de la pantalla. El plan no cambia y lo ya creado se conserva; usted la reactiva
                        desde aquí cuando corresponda.
                      </>
                    ) : (
                      <>
                        La firma <b>{firma.name}</b> vuelve a ver esta función en el acto, dentro de su módulo.
                      </>
                    )
                  ) : confirmacion.peligro ? (
                    <>
                      La firma <b>{firma.name}</b> deja de ver este módulo en el acto: desaparece de su
                      barra y su portada lo muestra como «No disponible para su firma». El plan no cambia y
                      lo ya creado se conserva; usted lo reactiva desde aquí cuando corresponda.
                    </>
                  ) : (
                    <>
                      La firma <b>{firma.name}</b> vuelve a ver este módulo en el acto, tal como lo incluye su
                      plan {nombrePlan}.
                    </>
                  )}
                </p>
                <label className="block text-[11px] text-ink-500">
                  Motivo (opcional) · queda en la auditoría de la firma con su correo
                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) => {
                      setMotivo(e.target.value);
                      motivoRef.current = e.target.value;
                    }}
                    placeholder={
                      confirmacion.peligro
                        ? 'Pago de Audiencias pendiente; acordado con el socio'
                        : 'Pago recibido'
                    }
                    className="mt-1 w-full rounded-control border border-line-200 bg-canvas px-2 py-1.5 text-[12px] text-ink-900 focus:border-brand-700 focus:outline-none"
                    autoFocus
                  />
                </label>
                {error && <p className="text-justify text-[12px] leading-snug text-danger [text-wrap:pretty]">{error}</p>}
              </div>
            )
          }
        }
        onCerrar={() => {
          if (mantenerAbiertoRef.current) {
            mantenerAbiertoRef.current = false;
            return;
          }
          setConfirmacion(null);
          setError(null);
        }}
      />
    </div>
  );
};

export const FirmPlanSection: React.FC<FirmPlanSectionProps> = ({ firma, onGuardado }) => {
  const [editando, setEditando] = React.useState(false);
  const [plan, setPlan] = React.useState<Plan>(firma.plan ?? 'PREMIUM');
  const [periodo, setPeriodo] = React.useState<Periodo>(firma.planPeriod ?? 'CORTESIA');
  const [vence, setVence] = React.useState(aFechaDeInput(firma.planValidUntil));
  const [motivo, setMotivo] = React.useState('');
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
  const [motivoSuspension, setMotivoSuspension] = React.useState('');
  const [errorSuspension, setErrorSuspension] = React.useState<string | null>(null);

  const estado = estadoDe(firma);
  const necesitaFecha = periodo !== 'CORTESIA';
  const yaVencida = estado.etiqueta === 'Vencido';

  /*
   * El motivo se escribe dentro del diálogo y se valida al confirmar: el
   * servidor exige diez caracteres y aquí se pide lo mismo antes de viajar.
   * Un motivo corto no cierra el diálogo; explica qué falta.
   */
  const motivoRef = React.useRef('');
  /*
   * `ConfirmarDialog` cierra al terminar `onConfirmar`, sin distinguir éxito de
   * fallo. Cuando el motivo falta o el servidor rechaza, el diálogo debe
   * quedarse abierto mostrando por qué: esta bandera le pide al cierre que
   * no cierre, una sola vez.
   */
  const mantenerAbiertoRef = React.useRef(false);
  const suspender = async () => {
    const motivo = motivoRef.current.replace(/\s+/g, ' ').trim();
    if (motivo.length < 10) {
      setErrorSuspension('Escriba el motivo (al menos 10 caracteres): queda en la auditoría de la firma.');
      mantenerAbiertoRef.current = true;
      return;
    }
    setErrorSuspension(null);
    try {
      await adminApi.suspenderFirma(firma.id, motivo);
    } catch (err) {
      setErrorSuspension(err instanceof Error ? err.message : 'No se pudo suspender el acceso.');
      mantenerAbiertoRef.current = true;
      return;
    }
    setMotivoSuspension('');
    motivoRef.current = '';
    onGuardado();
  };

  const abrirSuspension = () => {
    setErrorSuspension(null);
    setConfirmacion({
      titulo: 'Suspender el acceso ahora',
      texto: '',
      etiqueta: 'Suspender acceso',
      peligro: true,
      onConfirmar: suspender
    });
  };

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
    <section className="min-w-0 rounded-card border border-line-200 bg-surface">
      <header className="flex flex-wrap items-start justify-between gap-2 border-b border-line-200 px-4 py-3">
        <div className="min-w-0">
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
        <div className="flex flex-wrap items-center gap-3 border-t border-line-200 px-4 py-3">
          <button type="button" onClick={() => setEditando(true)} className="btn-secondary flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            {yaVencida ? 'Reactivar: fijar plan o vencimiento' : 'Fijar plan o vencimiento'}
          </button>
          {/* Una firma ya vencida no tiene nada que suspender: el botón sobraría y confundiría. */}
          {!yaVencida && (
            <button
              type="button"
              onClick={abrirSuspension}
              className="flex items-center gap-2 text-[12px] font-medium text-danger hover:underline"
            >
              <Ban className="h-4 w-4" />
              Suspender acceso ahora
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={(e) => void guardar(e)} className="space-y-3 border-t border-line-200 px-4 py-3">
          {/*
            PARA QUÉ SIRVE ESTA VÍA, ESCRITO AL LADO DEL FORMULARIO. Dentro de
            la aplicación, cambiar de plan se paga completo y el ciclo empieza
            el día del pago: la firma pierde los días que le quedaban. La otra
            vía es esta — la firma escribe, envía la diferencia por fuera, sin
            comisión de pasarela, y aquí se le sube el plan RESPETANDO su fecha.
            El campo «Vence» abre con la fecha que la firma ya tiene justamente
            para eso: cambiar solo el plan no debe mover el vencimiento.
          */}
          <p className="text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
            Esta es la vía de la petición interna: la firma pidió cambiar de plan, envió la diferencia por fuera de la
            pasarela y se le respeta su fecha de vencimiento. El campo «Vence» abre con la que ya tiene: cambie el plan
            y déjela como está. Si en cambio la firma paga desde la aplicación, el ciclo del plan nuevo empieza el día
            del pago y los días que le quedaban no se acreditan.
          </p>
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
                <option value="FIRMA">Firma · hasta 15 usuarios</option>
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

          {error && <p className="text-justify text-[12px] leading-snug text-danger [text-wrap:pretty]">{error}</p>}

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

      <ModulosDeLaFirma firma={firma} onGuardado={onGuardado} />

      <ConfirmarDialog
        confirmacion={
          confirmacion && {
            ...confirmacion,
            texto: (
              <div className="space-y-3">
                <p>
                  La firma <b>{firma.name}</b> queda en solo lectura en el acto: sus usuarios ven la
                  franja «Renovar plan» y ninguna pantalla crea ni modifica trabajo. Conserva todo lo que
                  tiene. La reactiva un pago de la firma por Wompi o usted, con «Fijar plan o vencimiento».
                </p>
                <label className="block text-[11px] text-ink-500">
                  Motivo · queda en la auditoría de la firma con su correo
                  <input
                    type="text"
                    value={motivoSuspension}
                    onChange={(e) => {
                      setMotivoSuspension(e.target.value);
                      motivoRef.current = e.target.value;
                    }}
                    placeholder="Pago rechazado dos veces; acordado con el socio por teléfono"
                    className="mt-1 w-full rounded-control border border-line-200 bg-canvas px-2 py-1.5 text-[12px] text-ink-900 focus:border-brand-700 focus:outline-none"
                    autoFocus
                  />
                </label>
                {errorSuspension && <p className="text-justify text-[12px] leading-snug text-danger [text-wrap:pretty]">{errorSuspension}</p>}
              </div>
            )
          }
        }
        onCerrar={() => {
          if (mantenerAbiertoRef.current) {
            mantenerAbiertoRef.current = false;
            return;
          }
          setConfirmacion(null);
          setErrorSuspension(null);
        }}
      />
    </section>
  );
};
