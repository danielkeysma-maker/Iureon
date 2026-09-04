import React from 'react';
import { BellRing, CreditCard, KeyRound, LogOut, RefreshCw, User } from 'lucide-react';
import { readSession } from '../../auth/session';
import { useTenant } from '../../tenant/TenantContext';
import { AvisosEnEsteDispositivo } from '../../push/components/AvisosEnEsteDispositivo';
import { InstalarApp } from '../../pwa/InstalarApp';
import { subscriptionApi } from '../../subscriptions/subscription.api';
import { FirmSubscriptionModal } from '../../subscriptions/components/FirmSubscriptionModal';
import { ETIQUETA_DE_ESTADO, ETIQUETA_DE_PERIODO, NOMBRE_DE_MODULO, type PlanDeFirma } from '../../subscriptions/types';

/**
 * Las secciones de Ajustes que faltaban. Cada una reúne algo que YA existe en
 * la aplicación y que hasta ahora vivía escondido en un pie de barra o en un
 * diálogo: los atajos que los componentes escuchan, los avisos de este
 * dispositivo, los datos de la sesión y el plan de la firma. Ninguna promete
 * nada que no esté construido; por eso «Cambiar contraseña» no está aquí
 * todavía: no hay endpoint que verifique la contraseña actual.
 */

const Cabecera: React.FC<{ titulo: string; texto: string }> = ({ titulo, texto }) => (
  <header className="mb-5">
    <h2 className="text-title text-ink-900">{titulo}</h2>
    <p className="mt-1 text-ui text-ink-500">{texto}</p>
  </header>
);

const Tecla: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="inline-block rounded-control border border-line-200 bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-700 shadow-e1">{children}</kbd>
);

/* ─── Atajos ─────────────────────────────────────────────────────────────── */

const esMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
const MOD = esMac ? '⌘' : 'Ctrl';

/** Solo lo que los componentes escuchan hoy, verificado en su código. */
const ATAJOS: { pantalla: string; filas: { teclas: string[]; hace: string }[] }[] = [
  {
    pantalla: 'Redacción',
    filas: [{ teclas: [MOD, '↵'], hace: 'Genera el escrito con la instrucción escrita, sin soltar el teclado.' }]
  },
  {
    pantalla: 'Taller y chat de soporte',
    filas: [
      { teclas: ['↵'], hace: 'Envía el mensaje a la guía o a soporte.' },
      { teclas: ['Shift', '↵'], hace: 'Salta de línea sin enviar.' }
    ]
  },
  {
    pantalla: 'Audiencias y entrevistas',
    filas: [
      { teclas: ['↵'], hace: 'Guarda la corrección de la intervención que está editando.' },
      { teclas: ['Esc'], hace: 'Descarta la corrección y deja el texto como estaba.' }
    ]
  },
  {
    pantalla: 'En cualquier diálogo',
    filas: [{ teclas: ['Esc'], hace: 'Cierra el diálogo abierto.' }]
  }
];

export const AtajosSection: React.FC = () => (
  <section>
    <Cabecera titulo="Atajos de teclado" texto="Los que la aplicación escucha hoy. No hay que activar nada." />
    <div className="space-y-4">
      {ATAJOS.map((g) => (
        <div key={g.pantalla} className="rounded-card border border-line-200 bg-surface">
          <p className="border-b border-line-100 px-4 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">{g.pantalla}</p>
          {g.filas.map((f, k) => (
            <div key={k} className="flex items-center gap-4 border-b border-line-100 px-4 py-2.5 text-ui last:border-0">
              <span className="flex w-[120px] shrink-0 items-center gap-1">
                {f.teclas.map((t, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span className="text-ink-400">+</span>}
                    <Tecla>{t}</Tecla>
                  </React.Fragment>
                ))}
              </span>
              <span className="text-ink-700">{f.hace}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  </section>
);

/* ─── Avisos ─────────────────────────────────────────────────────────────── */

export const AvisosSection: React.FC = () => (
  <section>
    <Cabecera
      titulo="Avisos"
      texto="Notificaciones de este dispositivo. Avisan hoy cuando soporte le responde y cuando otro abogado de su firma crea o edita un borrador."
    />
    <div className="space-y-4">
      <div className="rounded-card border border-line-200 bg-surface p-4">
        <p className="mb-3 flex items-center gap-2 text-ui font-semibold text-ink-900">
          <BellRing className="h-4 w-4 text-brand-700" />
          En este dispositivo
        </p>
        <AvisosEnEsteDispositivo />
      </div>
      <div className="rounded-card border border-line-200 bg-surface p-4">
        <p className="mb-2 text-ui font-semibold text-ink-900">Instalar la aplicación</p>
        <p className="mb-3 text-meta text-ink-500">En iPhone los avisos solo llegan si Iureon está instalada en la pantalla de inicio.</p>
        <InstalarApp />
      </div>
    </div>
  </section>
);

/* ─── Su cuenta ──────────────────────────────────────────────────────────── */

const ROL: Record<string, string> = { SUPER_ADMIN: 'Superusuario de la plataforma', FIRM_ADMIN: 'Socio administrador', LAWYER: 'Abogado' };

export const CuentaSection: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const sesion = readSession();
  const { activeFirm } = useTenant();
  const Dato: React.FC<{ etiqueta: string; valor: React.ReactNode }> = ({ etiqueta, valor }) => (
    <div className="flex flex-col gap-0.5 border-b border-line-100 px-4 py-3 last:border-0 sm:flex-row sm:items-center">
      <span className="w-[160px] shrink-0 text-meta text-ink-500">{etiqueta}</span>
      <span className="text-ui text-ink-900">{valor}</span>
    </div>
  );
  return (
    <section>
      <Cabecera titulo="Su cuenta" texto="Con qué correo entra, qué puede hacer y a qué firma pertenece." />
      <div className="rounded-card border border-line-200 bg-surface">
        <Dato etiqueta="Correo" valor={sesion?.user.email ?? '—'} />
        <Dato etiqueta="Rol" valor={sesion ? ROL[sesion.user.role] ?? sesion.user.role : '—'} />
        <Dato etiqueta="Firma" valor={activeFirm.name} />
        <Dato etiqueta="NIT de la firma" valor={activeFirm.nit ? activeFirm.nit : 'Sin NIT registrado'} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {onLogout && (
          <button type="button" onClick={onLogout} className="btn-neutral">
            <LogOut className="h-3.5 w-3.5" />
            Cerrar sesión en este dispositivo
          </button>
        )}
        <span className="inline-flex items-center gap-1.5 text-meta text-ink-500">
          <KeyRound className="h-3.5 w-3.5" />
          Para cambiar la contraseña, pídalo por Soporte: todavía no se cambia desde aquí.
        </span>
      </div>
    </section>
  );
};

/* ─── Plan y facturación ─────────────────────────────────────────────────── */

export const PlanSection: React.FC = () => {
  const sesion = readSession();
  const puedePagar = sesion?.user.role === 'FIRM_ADMIN' || sesion?.user.role === 'SUPER_ADMIN';
  const [plan, setPlan] = React.useState<PlanDeFirma | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [abierto, setAbierto] = React.useState(false);

  const cargar = React.useCallback(async () => {
    try {
      const r = await subscriptionApi.plan();
      setPlan(r.plan);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el plan.');
    }
  }, []);
  React.useEffect(() => {
    void cargar();
  }, [cargar]);

  const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <section>
      <Cabecera titulo="Plan y facturación" texto="El plan que la firma tiene activo y sus pagos. El consumo de inteligencia artificial va aparte, por recargas de saldo." />
      {error && <p className="mb-3 text-ui text-danger">{error}</p>}
      {!plan && !error && (
        <p className="flex items-center gap-2 text-ui text-ink-500">
          <RefreshCw className="h-4 w-4 animate-spin" /> Leyendo el plan…
        </p>
      )}
      {plan && (
        <div className="rounded-card border border-line-200 bg-surface p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">Plan activo</p>
              <p className="mt-1 text-[20px] font-semibold leading-none text-ink-900">
                {plan.plan ? (plan.plan === 'PREMIUM' ? 'Premium' : 'Esencial') : 'Cortesía'}
                {plan.period && plan.period !== 'CORTESIA' && <span className="ml-2 text-[13px] font-normal text-ink-500">{ETIQUETA_DE_PERIODO[plan.period]}</span>}
              </p>
            </div>
            <span className="chip-neutral">{ETIQUETA_DE_ESTADO[plan.estado]}</span>
          </div>
          <dl className="mt-4 grid gap-3 text-ui sm:grid-cols-3">
            <div>
              <dt className="text-meta text-ink-500">Vence</dt>
              <dd className="mt-0.5 text-ink-900">{plan.validUntil ? fecha(plan.validUntil) : 'Sin vencimiento'}</dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">Usuarios</dt>
              <dd className="mt-0.5 flex items-center gap-1 text-ink-900">
                <User className="h-3.5 w-3.5 text-ink-400" />
                {plan.usuarios}
                {plan.maxUsers !== null ? ` de ${plan.maxUsers}` : ' · sin tope'}
              </dd>
            </div>
            <div>
              <dt className="text-meta text-ink-500">Módulos incluidos</dt>
              <dd className="mt-0.5 leading-snug text-ink-700">{plan.modulosPermitidos.map((m) => NOMBRE_DE_MODULO[m]).join(' · ')}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setAbierto(true)} className="btn-primary">
              <CreditCard className="h-3.5 w-3.5" />
              {puedePagar ? 'Ver planes, pagar y descargar cuentas de cobro' : 'Ver planes y pagos'}
            </button>
            <span className="text-meta text-ink-500">Las recargas de saldo para la inteligencia artificial están en «Saldo», en la barra lateral.</span>
          </div>
        </div>
      )}
      <FirmSubscriptionModal
        isOpen={abierto}
        onClose={() => {
          setAbierto(false);
          void cargar();
        }}
        puedePagar={Boolean(puedePagar)}
        onPlanLeido={setPlan}
      />
    </section>
  );
};
