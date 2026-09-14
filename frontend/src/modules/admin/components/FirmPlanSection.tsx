import React from 'react';
import { ConfirmarDialog } from '../../../design/ConfirmarDialog';
import { Dialog } from '../../../design/Dialog';
import { SelectorDelFormulario } from '../../workspace/components/SelectorDelFormulario';
import { subscriptionApi } from '../../subscriptions/subscription.api';
import { VISTA_POR_MODULO, navModule } from '../../tenant/navigation';
import { adminApi, type FirmDetail } from '../admin.api';
import { cifra, describirPlan, estadoDeFirma, opcionDePlan, validarCambioDePlan } from '../consolaEnPantalla';

/**
 * «Plan de esta firma»: plan, periodo, vencimiento y módulos, con motivo.
 * Cara nueva: `public/handoff/app-consola-de-operacion.html`, artboard 3
 * (Plan y Periodo en dos columnas, «“Cortesía” no vence.», motivo con «Sin
 * motivo, el botón queda inhabilitado.», módulos con interruptor y chip
 * «Desactivado por el operador», y «No lo abre su plan» para lo que el plan no
 * trae). Se abre desde «Cambiar plan» en la ficha.
 *
 * ─── CAMBIAR EL PLAN PASA POR LA CONFIRMACIÓN DEL SISTEMA ───────────────────
 *
 * Mover el vencimiento de una firma decide si trabaja mañana. El botón del
 * formulario no guarda: abre `ConfirmarDialog` con el antes y el después, y es
 * ahí donde se guarda. Suspender va por la misma puerta, en rojo.
 *
 * ─── EL MOTIVO TIENE EL MÍNIMO DEL SERVIDOR ─────────────────────────────────
 *
 * Aquí se pedían 5 caracteres y `requireReason` exige 10: el botón se encendía
 * y el servidor rechazaba. `validarCambioDePlan` usa la constante que el check
 * compara con el servidor.
 *
 * ─── LOS PUESTOS DE CADA PLAN SALEN DEL CATÁLOGO ───────────────────────────
 *
 * «Premium · hasta 5 usuarios» estaba escrito aquí. Ahora se lee de
 * `/api/subscription/plan`, que sirve `plan.catalog.ts`; si esa lectura falla se
 * muestran solo los nombres, y la lista lo dice.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ ES DISTINTO, con la razón ──────────────
 *
 * · Un solo «Guardar el cambio» para plan y módulos: en el servidor son dos
 *   escrituras distintas (`PATCH /plan` y `PATCH /modulos`). Un interruptor
 *   se confirma y se guarda en el acto; «Guardar el cambio» guarda solo el plan,
 *   y por eso va ANTES de los módulos, para no sugerir que también los guarda.
 * · El número de módulo («01 Redacción»): la navegación no numera sus módulos,
 *   y un número inventado aquí no coincidiría con ningún otro lugar.
 * · El motivo bajo un módulo apagado: la ficha no trae el motivo por módulo;
 *   está en el registro de operación.
 * · El campo «Vence», que el artboard no dibuja: el servidor exige fecha a todo
 *   periodo que no sea cortesía.
 */

type Plan = 'ESENCIAL' | 'PREMIUM' | 'FIRMA';
type Periodo = 'MENSUAL' | 'ANUAL' | 'PRUEBA' | 'CORTESIA';
type Planes = Partial<Record<Plan, { nombre: string; maxUsuarios: number }>>;

const PLANES: readonly Plan[] = ['ESENCIAL', 'PREMIUM', 'FIRMA'];
const PERIODOS: ReadonlyArray<{ valor: Periodo; etiqueta: string }> = [
  { valor: 'PRUEBA', etiqueta: 'Prueba' },
  { valor: 'MENSUAL', etiqueta: 'Mensual' },
  { valor: 'ANUAL', etiqueta: 'Anual' },
  { valor: 'CORTESIA', etiqueta: 'Cortesía' }
];

/** DD/MM/AAAA, como se lee una fecha en Colombia; el formato ISO es solo para el campo. */
const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** AAAA-MM-DD para el <input type="date">, en hora local. */
const aFechaDeInput = (iso: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Fin del día local elegido: «vence el 30» significa que el 30 todavía trabaja. */
const finDelDia = (fecha: string): string => new Date(`${fecha}T23:59:59`).toISOString();

const limpio = (s: string): string => s.replace(/\s+/g, ' ').trim();

/* ─── Módulos ──────────────────────────────────────────────────────────────── */

/** Los módulos que la aplicación puede cerrar, con el nombre que usa la barra lateral: un módulo nuevo aparece solo. */
const MODULOS_CONMUTABLES: ReadonlyArray<{ id: string; nombre: string }> = Object.entries(VISTA_POR_MODULO).map(
  ([id, vista]) => ({ id, nombre: navModule(vista as NonNullable<typeof vista>).label })
);

type EstadoDeModulo = 'ACTIVO' | 'DESACTIVADO' | 'NO_EN_PLAN';

/** Del servidor salen lo permitido (plan menos resta) y la resta. Lo que no está en ninguna no lo trae el plan. */
const estadoDeModulo = (firma: FirmDetail, id: string): EstadoDeModulo =>
  firma.modulosDesactivados.includes(id) ? 'DESACTIVADO' : firma.modulosPermitidos.includes(id) ? 'ACTIVO' : 'NO_EN_PLAN';

const Interruptor: React.FC<{ encendido: boolean; etiqueta: string; deshabilitado?: boolean; titulo?: string; onClick: () => void }> = ({
  encendido,
  etiqueta,
  deshabilitado = false,
  titulo,
  onClick
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={encendido}
    aria-label={etiqueta}
    disabled={deshabilitado}
    title={titulo}
    onClick={onClick}
    className="cn-ope-interruptor"
  >
    <span className="cn-ope-interruptor-pista" aria-hidden="true">
      <span className="cn-ope-interruptor-perilla" />
    </span>
  </button>
);

const ModulosDeLaFirma: React.FC<{ firma: FirmDetail; onGuardado: (yaLeida?: FirmDetail) => void }> = ({ firma, onGuardado }) => {
  const [pendiente, setPendiente] = React.useState<{ id: string; nombre: string; apagar: boolean; tipo: 'modulo' | 'funcion' } | null>(
    null
  );
  const [motivo, setMotivo] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  /* `ConfirmarDialog` cierra al terminar `onConfirmar`; si el servidor rechaza, esta bandera lo deja abierto una vez. */
  const mantenerAbiertoRef = React.useRef(false);

  const nombrePlan = firma.plan ? describirPlan({ plan: firma.plan, planPeriod: null }) : 'Cortesía';

  /*
   * Se manda la lista COMPLETA de lo apagado —módulos y funciones juntos, como
   * la guarda la columna— y no un delta: apagar una función no puede reactivar
   * un módulo por omisión. `PATCH /modulos` devuelve la ficha releída y se
   * entrega tal cual: un viaje, sin espera en blanco.
   */
  const aplicar = async () => {
    if (!pendiente) return;
    const actuales = new Set<string>([...firma.modulosDesactivados, ...firma.funcionesDesactivadas]);
    if (pendiente.apagar) actuales.add(pendiente.id);
    else actuales.delete(pendiente.id);
    setError(null);
    try {
      const r = await adminApi.ajustarModulos(firma.id, { desactivados: [...actuales], motivo: limpio(motivo) || undefined });
      setMotivo('');
      onGuardado(r.firm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron ajustar los módulos.');
      mantenerAbiertoRef.current = true;
    }
  };

  const pedir = (id: string, nombre: string, apagar: boolean, tipo: 'modulo' | 'funcion') => {
    setError(null);
    setMotivo('');
    setPendiente({ id, nombre, apagar, tipo });
  };

  return (
    <section className="cn-ope-seccion" aria-labelledby="ope-modulos">
      <h3 id="ope-modulos" className="cn-ope-subtitulo">
        Módulos de esta firma
      </h3>
      <p className="cn-ope-texto">
        El plan decide qué módulos abre. Operación puede <strong>apagar</strong> uno que el plan incluye —nunca encender uno que
        no—, y la firma lo ve como no disponible para ella. Cada interruptor se confirma y se guarda en el acto.
      </p>

      <ul className="cn-ope-modulos">
        {MODULOS_CONMUTABLES.map(({ id, nombre }) => {
          const estado = estadoDeModulo(firma, id);
          const encendido = estado === 'ACTIVO';
          const funciones = (firma.funciones ?? []).filter((f) => f.modulo === id);
          return (
            <li
              key={id}
              className={`cn-ope-modulo ${estado === 'DESACTIVADO' ? 'cn-ope-modulo--apagado' : ''} ${
                estado === 'NO_EN_PLAN' ? 'cn-ope-modulo--fuera' : ''
              }`}
            >
              <div className="cn-ope-modulo-fila">
                <div className="cn-ope-modulo-nombre">
                  <p>{nombre}</p>
                  {estado === 'DESACTIVADO' && <span className="cn-ope-chip cn-ope-chip--aviso">Desactivado por el operador</span>}
                </div>
                {estado === 'NO_EN_PLAN' ? (
                  <span className="cn-ope-modulo-fuera-texto">No lo abre su plan</span>
                ) : (
                  <Interruptor
                    encendido={encendido}
                    etiqueta={`${nombre}: ${encendido ? 'activo' : 'apagado'} para esta firma`}
                    onClick={() => pedir(id, nombre, encendido, 'modulo')}
                  />
                )}
              </div>
              {funciones.length > 0 && (
                <ul className="cn-ope-funciones">
                  {funciones.map((f) => {
                    const conElModulo = estado !== 'ACTIVO';
                    const encendida = !conElModulo && !firma.funcionesDesactivadas.includes(f.id);
                    return (
                      <li key={f.id} className={`cn-ope-funcion ${conElModulo ? 'cn-ope-funcion--con-el-modulo' : ''}`}>
                        <div className="cn-ope-modulo-nombre">
                          <p>
                            {f.nombre}
                            {conElModulo && <span className="cn-ope-apagado"> · con el módulo</span>}
                          </p>
                          <p className="cn-ope-funcion-descripcion">{f.descripcion}</p>
                          {!conElModulo && !encendida && (
                            <span className="cn-ope-chip cn-ope-chip--aviso">Desactivada por el operador</span>
                          )}
                        </div>
                        <Interruptor
                          encendido={encendida}
                          etiqueta={`${f.nombre}: ${encendida ? 'activa' : 'apagada'} para esta firma`}
                          deshabilitado={conElModulo}
                          titulo={conElModulo ? 'Se apaga y se enciende con el módulo.' : undefined}
                          onClick={() => pedir(f.id, f.nombre, encendida, 'funcion')}
                        />
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
          pendiente && {
            titulo: `${pendiente.apagar ? 'Desactivar' : 'Reactivar'} ${pendiente.nombre} para esta firma`,
            etiqueta: pendiente.apagar ? 'Desactivar' : 'Reactivar',
            peligro: pendiente.apagar,
            onConfirmar: aplicar,
            texto: (
              <div className="cn-ope-confirmacion">
                <p className="cn-ope-texto">
                  {pendiente.tipo === 'funcion' ? (
                    pendiente.apagar ? (
                      <>
                        La firma <strong>{firma.name}</strong> deja de ver esta función en el acto: el módulo sigue abierto y la
                        pantalla la muestra como «no habilitada para su firma»; el servidor la rechaza aunque alguien la pida
                        por fuera de la pantalla. Lo ya creado se conserva.
                      </>
                    ) : (
                      <>
                        La firma <strong>{firma.name}</strong> vuelve a ver esta función en el acto, dentro de su módulo.
                      </>
                    )
                  ) : pendiente.apagar ? (
                    <>
                      La firma <strong>{firma.name}</strong> deja de ver este módulo en el acto: desaparece de su barra y su
                      portada lo muestra como «No disponible para su firma». El plan no cambia y lo ya creado se conserva.
                    </>
                  ) : (
                    <>
                      La firma <strong>{firma.name}</strong> vuelve a ver este módulo en el acto, tal como lo incluye su plan{' '}
                      {nombrePlan}.
                    </>
                  )}
                </p>
                <div>
                  <label htmlFor="ope-motivo-modulo" className="cn-ope-etiqueta">
                    Motivo <span className="cn-ope-etiqueta-opcional">(opcional)</span>
                  </label>
                  <input
                    id="ope-motivo-modulo"
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder={pendiente.apagar ? 'La firma pidió apagarlo por un tiempo' : 'Pago recibido'}
                    className="cn-ope-campo"
                    autoFocus
                  />
                  <p className="cn-ope-ayuda">Queda en la auditoría de la firma con su correo.</p>
                </div>
                {error && (
                  <p role="alert" className="cn-ope-error">
                    {error}
                  </p>
                )}
              </div>
            )
          }
        }
        onCerrar={() => {
          if (mantenerAbiertoRef.current) {
            mantenerAbiertoRef.current = false;
            return;
          }
          setPendiente(null);
          setError(null);
        }}
      />
    </section>
  );
};

/* ─── El diálogo ───────────────────────────────────────────────────────────── */

interface PlanDeLaFirmaDialogProps {
  abierto: boolean;
  firma: FirmDetail;
  onCerrar: () => void;
  /**
   * Tras guardar. Con la ficha ya releída (módulos) se entrega; sin argumento
   * (plan, suspensión) quien abrió el diálogo la relee.
   */
  onGuardado: (yaLeida?: FirmDetail) => void;
}

export const PlanDeLaFirmaDialog: React.FC<PlanDeLaFirmaDialogProps> = ({ abierto, firma, onCerrar, onGuardado }) => {
  const [plan, setPlan] = React.useState<Plan>(firma.plan ?? 'PREMIUM');
  const [periodo, setPeriodo] = React.useState<Periodo>(firma.planPeriod ?? 'CORTESIA');
  const [vence, setVence] = React.useState(aFechaDeInput(firma.planValidUntil));
  const [motivo, setMotivo] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [planes, setPlanes] = React.useState<Planes | null>(null);
  const [lecturaDePlanes, setLecturaDePlanes] = React.useState<'leyendo' | 'leida' | 'fallida'>('leyendo');
  const [confirmarPlan, setConfirmarPlan] = React.useState(false);
  const [confirmarSuspension, setConfirmarSuspension] = React.useState(false);
  const [motivoSuspension, setMotivoSuspension] = React.useState('');
  const [errorSuspension, setErrorSuspension] = React.useState<string | null>(null);
  const mantenerAbiertoRef = React.useRef(false);
  const cerrarTrasGuardarRef = React.useRef(false);

  /* Cada apertura arranca de lo que la firma tiene hoy: el motivo de la vez anterior no es el de esta. */
  React.useEffect(() => {
    if (!abierto) return;
    setPlan(firma.plan ?? 'PREMIUM');
    setPeriodo(firma.planPeriod ?? 'CORTESIA');
    setVence(aFechaDeInput(firma.planValidUntil));
    setMotivo('');
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, firma.id]);

  React.useEffect(() => {
    if (!abierto || lecturaDePlanes === 'leida') return;
    let vigente = true;
    subscriptionApi
      .plan()
      .then((r) => {
        if (!vigente) return;
        setPlanes(r.planes);
        setLecturaDePlanes('leida');
      })
      .catch(() => {
        if (vigente) setLecturaDePlanes('fallida');
      });
    return () => {
      vigente = false;
    };
  }, [abierto, lecturaDePlanes]);

  const estado = estadoDeFirma(firma);
  const razon = validarCambioDePlan({ periodo, vence, motivo });
  const sinCambios = plan === firma.plan && periodo === firma.planPeriod && vence === aFechaDeInput(firma.planValidUntil);

  const guardar = async () => {
    setError(null);
    try {
      await adminApi.updateFirmPlan(firma.id, {
        plan,
        period: periodo,
        validUntil: vence ? finDelDia(vence) : null,
        motivo: limpio(motivo)
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo fijar el plan.');
      mantenerAbiertoRef.current = true;
      return;
    }
    setMotivo('');
    cerrarTrasGuardarRef.current = true;
    onGuardado();
  };

  /*
   * SUSPENDER ES PONER EL VENCIMIENTO EN AHORA: la firma queda en solo lectura
   * por la misma regla que cierra un plan vencido, y la reactiva un pago o este
   * mismo formulario. Exige motivo, como toda acción de operación.
   */
  const suspender = async () => {
    const m = limpio(motivoSuspension);
    if (validarCambioDePlan({ periodo: 'CORTESIA', vence: '', motivo: m }) !== null) {
      setErrorSuspension('Escriba el motivo, al menos 10 caracteres: queda en la auditoría de la firma.');
      mantenerAbiertoRef.current = true;
      return;
    }
    setErrorSuspension(null);
    try {
      await adminApi.suspenderFirma(firma.id, m);
    } catch (err) {
      setErrorSuspension(err instanceof Error ? err.message : 'No se pudo suspender el acceso.');
      mantenerAbiertoRef.current = true;
      return;
    }
    setMotivoSuspension('');
    cerrarTrasGuardarRef.current = true;
    onGuardado();
  };

  const alCerrarConfirmacion = (cerrarla: () => void) => {
    if (mantenerAbiertoRef.current) {
      mantenerAbiertoRef.current = false;
      return;
    }
    cerrarla();
    if (cerrarTrasGuardarRef.current) {
      cerrarTrasGuardarRef.current = false;
      onCerrar();
    }
  };

  const nuevo = describirPlan({ plan, planPeriod: periodo });

  return (
    <Dialog
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Plan de esta firma"
      subtitulo="Cambiarlo aquí exige motivo, y el motivo queda en la auditoría de la firma."
      tamano="M"
      hayCambiosSinGuardar={motivo.trim().length > 0}
      onIntentoDeCerrarConCambios={() => undefined}
    >
      <div className="cn-ope-cuerpo">
        <p className="cn-ope-recuadro cn-ope-recuadro--arriba">
          Hoy: <strong>{describirPlan(firma)}</strong> ·{' '}
          {firma.planValidUntil ? (
            <>
              vence el <span className="cn-ope-mono">{fechaCorta(firma.planValidUntil)}</span>
            </>
          ) : (
            'sin vencimiento'
          )}{' '}
          · {firma.planMaxUsers !== null ? `${cifra(firma.users)} de ${cifra(firma.planMaxUsers)} usuarios` : `${cifra(firma.users)} usuarios, sin tope`}{' '}
          <span className={`cn-ope-estado cn-ope-estado--${estado.tono}`}>{estado.etiqueta}</span>
        </p>

        <div className="cn-ope-campos">
          <div className="cn-ope-dos">
            <div className="cn-ope-selector">
              <SelectorDelFormulario
                id="ope-plan"
                etiqueta="Plan"
                valor={plan}
                opciones={PLANES.map((p) => ({ valor: p, etiqueta: opcionDePlan(p, planes) }))}
                onChange={(v) => setPlan(v as Plan)}
                conBusqueda={false}
                cargando={lecturaDePlanes === 'leyendo'}
              />
              {lecturaDePlanes === 'fallida' && (
                <p className="cn-ope-ayuda cn-ope-ayuda--aviso">Los usuarios de cada plan no se pudieron leer del catálogo.</p>
              )}
            </div>
            <div className="cn-ope-selector">
              <SelectorDelFormulario
                id="ope-periodo"
                etiqueta="Periodo"
                valor={periodo}
                opciones={PERIODOS.map((p) => ({ valor: p.valor, etiqueta: p.etiqueta }))}
                onChange={(v) => setPeriodo(v as Periodo)}
                conBusqueda={false}
              />
              <p className="cn-ope-ayuda">«Cortesía» no vence.</p>
            </div>
          </div>

          <div>
            <label htmlFor="ope-vence" className="cn-ope-etiqueta">
              Vence {periodo === 'CORTESIA' && <span className="cn-ope-etiqueta-opcional">(opcional)</span>}
            </label>
            <input id="ope-vence" type="date" value={vence} onChange={(e) => setVence(e.target.value)} className="cn-ope-campo cn-ope-campo--cifra" />
            {/*
              PARA QUÉ SIRVE ESTA VÍA. Dentro de la aplicación, cambiar de plan se
              paga completo y el ciclo empieza el día del pago. Aquí la firma pidió
              el cambio por fuera y se le respeta su fecha: por eso el campo abre
              con la que ya tiene.
            */}
            <p className="cn-ope-ayuda">
              Abre con la fecha que la firma ya tiene: cambiar solo el plan no mueve su vencimiento. Si la firma paga desde la
              aplicación, el ciclo nuevo empieza el día del pago.
            </p>
          </div>

          <div>
            <label htmlFor="ope-motivo-plan" className="cn-ope-etiqueta">
              Motivo del cambio
            </label>
            <input
              id="ope-motivo-plan"
              type="text"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Prueba extendida dos semanas a petición del socio"
              className="cn-ope-campo"
            />
            <p className={`cn-ope-ayuda ${razon ? 'cn-ope-ayuda--aviso' : ''}`}>
              {razon ?? (sinCambios ? 'No hay cambios que guardar.' : 'Queda en la auditoría de la firma con su correo.')}
            </p>
          </div>
        </div>

        {error && !confirmarPlan && (
          <p role="alert" className="cn-ope-error cn-ope-error--abajo">
            {error}
          </p>
        )}

        <button
          type="button"
          className="cn-ope-boton cn-ope-boton--primario cn-ope-boton--ancho"
          disabled={razon !== null || sinCambios}
          onClick={() => {
            setError(null);
            setConfirmarPlan(true);
          }}
        >
          Guardar el cambio
        </button>

        <ModulosDeLaFirma firma={firma} onGuardado={onGuardado} />

        {/* Una firma ya vencida no tiene nada que suspender: el botón sobraría y confundiría. */}
        {estado.etiqueta !== 'Vencido' && (
          <section className="cn-ope-seccion cn-ope-suspender" aria-labelledby="ope-suspender">
            <h3 id="ope-suspender" className="cn-ope-subtitulo">
              Suspender el acceso
            </h3>
            <p className="cn-ope-texto">
              La firma queda en solo lectura en el acto y conserva todo lo que tiene. La reactiva un pago suyo o un cambio de plan
              desde aquí.
            </p>
            <button
              type="button"
              className="cn-ope-boton cn-ope-boton--terciario cn-ope-boton--texto-peligro"
              onClick={() => {
                setErrorSuspension(null);
                setConfirmarSuspension(true);
              }}
            >
              Suspender el acceso ahora
            </button>
          </section>
        )}
      </div>

      <ConfirmarDialog
        confirmacion={
          confirmarPlan
            ? {
                titulo: '¿Cambiar el plan de esta firma?',
                etiqueta: 'Sí, cambiar el plan',
                onConfirmar: guardar,
                texto: (
                  <div className="cn-ope-confirmacion">
                    <p className="cn-ope-texto">
                      <strong>{firma.name}</strong>{' '}
                      {nuevo === describirPlan(firma) ? (
                        <>
                          mantiene <strong>{nuevo}</strong> y su vencimiento queda{' '}
                        </>
                      ) : (
                        <>
                          pasa de <strong>{describirPlan(firma)}</strong> a <strong>{nuevo}</strong>,{' '}
                        </>
                      )}
                      {vence ? (
                        <>
                          {nuevo === describirPlan(firma) ? 'en el ' : 'con vencimiento el '}
                          <span className="cn-ope-mono">{fechaCorta(finDelDia(vence))}</span>
                        </>
                      ) : (
                        'sin vencimiento'
                      )}
                      . El motivo queda en su auditoría, que sus socios leen.
                    </p>
                    {error && (
                      <p role="alert" className="cn-ope-error">
                        {error}
                      </p>
                    )}
                  </div>
                )
              }
            : null
        }
        onCerrar={() => alCerrarConfirmacion(() => setConfirmarPlan(false))}
      />

      <ConfirmarDialog
        confirmacion={
          confirmarSuspension
            ? {
                titulo: 'Suspender el acceso ahora',
                etiqueta: 'Suspender el acceso',
                peligro: true,
                onConfirmar: suspender,
                texto: (
                  <div className="cn-ope-confirmacion">
                    <p className="cn-ope-texto">
                      La firma <strong>{firma.name}</strong> queda en solo lectura en el acto: sus usuarios ven la franja «Renovar
                      plan» y ninguna pantalla crea ni modifica trabajo. Conserva todo lo que tiene. La reactiva un pago de la firma
                      o usted, desde «Plan de esta firma».
                    </p>
                    <div>
                      <label htmlFor="ope-motivo-suspension" className="cn-ope-etiqueta">
                        Motivo
                      </label>
                      <input
                        id="ope-motivo-suspension"
                        type="text"
                        value={motivoSuspension}
                        onChange={(e) => setMotivoSuspension(e.target.value)}
                        placeholder="Pago rechazado dos veces; acordado con el socio por teléfono"
                        className="cn-ope-campo"
                        autoFocus
                      />
                      <p className="cn-ope-ayuda">Queda en la auditoría de la firma con su correo.</p>
                    </div>
                    {errorSuspension && (
                      <p role="alert" className="cn-ope-error">
                        {errorSuspension}
                      </p>
                    )}
                  </div>
                )
              }
            : null
        }
        onCerrar={() =>
          alCerrarConfirmacion(() => {
            setConfirmarSuspension(false);
            setErrorSuspension(null);
          })
        }
      />
    </Dialog>
  );
};
