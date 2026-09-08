import React from 'react';
import {
  BookMarked,
  ClipboardCheck,
  FileClock,
  Mic,
  Route,
  Sparkles,
  Wallet
} from 'lucide-react';
import type { MainView } from '../../tenant/types';
import type { SavedDraftEntry } from '../../documents/types';
import { reviewApi, type RevisionGuardada } from '../../workspace/services/review.api';
import { usePlan } from '../../subscriptions/PlanContext';
import { ETIQUETA_DE_PERIODO, NOMBRE_DE_PLAN } from '../../subscriptions/types';
import { NOVEDADES } from '../../help/content/novedades';
import { TarjetaDeAccion } from './TarjetaDeAccion';
import { fechaCorta, fechaLarga, nombreParaSaludar, saludoSegunHora } from '../saludo';

/**
 * Inicio: the screen the lawyer lands on, and the one the brand mark returns to.
 *
 * ─── WHAT IT SHOWS, TOP TO BOTTOM ───────────────────────────────────────────
 *
 * The greeting with the firm and the date; three doors to the daily work
 * (redactar, revisar, transcribir); what was left open — the latest saved
 * drafts and the latest reviews, opened through the SAME paths their lists
 * use; the plan and the balance, read from the plan context and the firm;
 * the three newest entries of Novedades; and the guided tour.
 *
 * ─── NOTHING HERE IS COMPUTED TWICE ─────────────────────────────────────────
 *
 * Drafts arrive as a prop because `App` already loads them; reviews are read
 * with the call `RevisionesView` makes, and the row that opens in the taller
 * is the row that view would open. The plan state and its days come from the
 * server via the context; the balance is the firm's figure the sidebar shows.
 * An Inicio that recomputed any of these would disagree with the module it
 * points to on the first edge case.
 *
 * ─── ONE COMPONENT FOR BOTH LAYOUTS ─────────────────────────────────────────
 *
 * Mobile-first stacking: one column that becomes two at `lg`. The other
 * modules have separate phone screens because their desktop tables do not
 * fold; a screen made of cards does.
 */

interface InicioViewProps {
  correo: string;
  firma: string;
  saldoCop: number;
  savedDrafts: SavedDraftEntry[];
  /** Modules the plan hides: their doors are drawn closed. */
  ocultas: readonly MainView[];
  onIr: (vista: MainView) => void;
  onAbrirBorrador: (entrada: SavedDraftEntry) => void;
  /** Opens a saved review in its taller, through the Revisiones module. */
  onAbrirRevision: (id: string) => void;
  onRecargar: () => void;
  onVerNovedades: () => void;
  visita: {
    invitacionPendiente: boolean;
    iniciar: () => void;
    declinarInvitacion: () => void;
  };
}

const MAXIMO_RECIENTES = 5;
const MAXIMO_NOVEDADES = 3;

const Seccion: React.FC<{ titulo: string; accion?: React.ReactNode; children: React.ReactNode }> = ({
  titulo,
  accion,
  children
}) => (
  <section className="card">
    <header className="card-head">
      <h2 className="text-ui font-semibold text-ink-900">{titulo}</h2>
      {accion && <div className="ml-auto">{accion}</div>}
    </header>
    <div className="p-4">{children}</div>
  </section>
);

const Vacio: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-ui leading-[1.5] text-ink-500">{children}</p>
);

export const InicioView: React.FC<InicioViewProps> = ({
  correo,
  firma,
  saldoCop,
  savedDrafts,
  ocultas,
  onIr,
  onAbrirBorrador,
  onAbrirRevision,
  onRecargar,
  onVerNovedades,
  visita
}) => {
  const { plan, abrirPlan } = usePlan();
  const ahora = React.useMemo(() => new Date(), []);

  /* The latest reviews, with the same call the Revisiones module makes. */
  const [revisiones, setRevisiones] = React.useState<RevisionGuardada[] | null>(null);
  const [revisionesFallaron, setRevisionesFallaron] = React.useState(false);
  React.useEffect(() => {
    let cancelado = false;
    reviewApi
      .listar()
      .then((lista) => {
        if (!cancelado) setRevisiones(lista);
      })
      .catch(() => {
        if (!cancelado) setRevisionesFallaron(true);
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const borradoresRecientes = React.useMemo(
    () =>
      [...savedDrafts]
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
        .slice(0, MAXIMO_RECIENTES),
    [savedDrafts]
  );
  const revisionesRecientes = React.useMemo(
    () =>
      [...(revisiones ?? [])]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, MAXIMO_RECIENTES),
    [revisiones]
  );

  const estadoDelPlan = describirPlan(plan);

  return (
    <div
      data-visita="vista-inicio"
      className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto bg-canvas font-sans"
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:py-7">
        {/* ─── SALUDO ─────────────────────────────────────────────────────── */}
        <header>
          <h1 className="text-title text-ink-900">
            {saludoSegunHora(ahora)}, {nombreParaSaludar(correo)}
          </h1>
          <p className="mt-1 text-meta text-ink-500">
            {firma ? `${firma} · ` : ''}
            {fechaLarga(ahora)}
          </p>
        </header>

        {/* ─── INVITACIÓN A LA VISITA, solo la primera vez en este navegador ── */}
        {visita.invitacionPendiente && (
          <div className="notice flex-wrap items-center gap-3">
            <Route className="h-4 w-4 shrink-0 text-brand-700" />
            <p className="min-w-0 flex-1">
              ¿Quiere una visita guiada de dos minutos? Recorre cada módulo y dice para qué sirve.
            </p>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={visita.declinarInvitacion} className="btn-ghost btn-sm">
                Ahora no
              </button>
              <button type="button" onClick={visita.iniciar} className="btn-primary btn-sm">
                Empezar
              </button>
            </div>
          </div>
        )}

        {/* ─── TRES PUERTAS ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TarjetaDeAccion
            icono={Sparkles}
            titulo="Redactar un escrito"
            queHace="El primer borrador de una actuación del catálogo, con su término y su fuente."
            onClick={() => onIr('workspace')}
            noIncluida={ocultas.includes('workspace')}
          />
          <TarjetaDeAccion
            icono={ClipboardCheck}
            titulo="Revisar un escrito"
            queHace="Un informe sobre un escrito ya redactado, y el taller para corregirlo."
            onClick={() => onIr('taller')}
            noIncluida={ocultas.includes('taller')}
          />
          <TarjetaDeAccion
            icono={Mic}
            titulo="Transcribir una audiencia"
            queHace="El transcrito de una grabación, con cada interlocutor separado, y su acta."
            onClick={() => onIr('audiencias')}
            noIncluida={ocultas.includes('audiencias')}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {/* ─── CONTINUAR DONDE IBA ────────────────────────────────────── */}
          <Seccion titulo="Continuar donde iba">
            <div className="flex flex-col gap-5">
              <div>
                <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  Borradores recientes
                </p>
                {borradoresRecientes.length === 0 ? (
                  <Vacio>
                    Aún no tiene borradores.{' '}
                    <button
                      type="button"
                      onClick={() => onIr('workspace')}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      Redacte el primero desde aquí.
                    </button>
                  </Vacio>
                ) : (
                  <ul className="divide-y divide-line-100">
                    {borradoresRecientes.map((b) => (
                      <li key={b.id || b.savedAt}>
                        <button
                          type="button"
                          onClick={() => onAbrirBorrador(b)}
                          className="flex w-full items-center gap-3 py-2 text-left hover:bg-canvas"
                        >
                          <FileClock className="h-4 w-4 shrink-0 text-ink-400" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-ui font-medium text-ink-900">
                              {b.draft.title || b.draft.documentType}
                            </span>
                            <span className="block truncate text-meta text-ink-500">
                              {[b.cliente, b.draft.documentType].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-ink-400">
                            {fechaCorta(b.savedAt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  Revisiones recientes
                </p>
                {revisionesFallaron ? (
                  <Vacio>No se pudieron leer sus revisiones. Ábralas desde «Revisiones».</Vacio>
                ) : revisiones === null ? (
                  <Vacio>Leyendo sus revisiones…</Vacio>
                ) : revisionesRecientes.length === 0 ? (
                  <Vacio>
                    Aún no ha revisado ningún escrito. Se pide desde Redacción, con «Revisar un escrito ya
                    redactado».
                  </Vacio>
                ) : (
                  <ul className="divide-y divide-line-100">
                    {revisionesRecientes.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => onAbrirRevision(r.id)}
                          className="flex w-full items-center gap-3 py-2 text-left hover:bg-canvas"
                        >
                          <ClipboardCheck className="h-4 w-4 shrink-0 text-ink-400" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-ui font-medium text-ink-900">
                              {r.cliente || r.fileName}
                            </span>
                            <span className="block truncate text-meta text-ink-500">
                              {[r.cliente ? r.fileName : null, r.documentType].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-ink-400">
                            {fechaCorta(r.createdAt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Seccion>

          <div className="flex flex-col gap-5">
            {/* ─── PLAN Y SALDO ─────────────────────────────────────────── */}
            <Seccion titulo="Plan y saldo">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <div>
                  <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                    Plan
                  </dt>
                  <dd className="mt-0.5 text-ui font-medium text-ink-900">{estadoDelPlan.nombre}</dd>
                  <dd className={`text-meta ${estadoDelPlan.tono}`}>{estadoDelPlan.estado}</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                    Saldo
                  </dt>
                  <dd className="mt-0.5 font-mono text-[15px] font-semibold text-ink-900">
                    ${saldoCop.toLocaleString('es-CO')}
                  </dd>
                  <dd className="text-meta text-ink-500">COP disponibles</dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={abrirPlan} className="btn-neutral btn-sm">
                  Ver plan
                </button>
                <button type="button" onClick={onRecargar} className="btn-secondary btn-sm">
                  <Wallet className="h-3.5 w-3.5" />
                  Recargar saldo
                </button>
              </div>
            </Seccion>

            {/* ─── NOVEDADES ────────────────────────────────────────────── */}
            <Seccion
              titulo="Novedades"
              accion={
                <button type="button" onClick={onVerNovedades} className="text-meta font-medium text-brand-700 hover:underline">
                  Ver todas
                </button>
              }
            >
              <ul className="flex flex-col gap-3">
                {NOVEDADES.slice(0, MAXIMO_NOVEDADES).map((n) => (
                  <li key={`${n.fecha}-${n.titulo}`} className="flex gap-3">
                    <span className="shrink-0 pt-0.5 font-mono text-[11px] text-ink-400">
                      {fechaCorta(n.fecha)}
                    </span>
                    <span className="text-ui leading-[1.45] text-ink-900">{n.titulo}</span>
                  </li>
                ))}
              </ul>
            </Seccion>

            {/* ─── PRIMERA VEZ ──────────────────────────────────────────── */}
            <Seccion titulo="¿Primera vez aquí?">
              <p className="text-ui leading-[1.5] text-ink-500">
                La visita guiada recorre cada módulo en dos minutos y dice para qué sirve. El manual
                explica cada tarea paso a paso.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" onClick={visita.iniciar} className="btn-primary btn-sm">
                  <Route className="h-3.5 w-3.5" />
                  Iniciar la visita guiada
                </button>
                <button
                  type="button"
                  onClick={() => onIr('manual')}
                  className="inline-flex items-center gap-1.5 text-ui font-medium text-brand-700 hover:underline"
                >
                  <BookMarked className="h-3.5 w-3.5" />
                  Abrir el manual
                </button>
              </div>
            </Seccion>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * The plan in words. Every figure is the server's: the state, the days, the
 * period. `null` plan means the server did not answer, and that is said
 * rather than guessed.
 */
const describirPlan = (
  plan: ReturnType<typeof usePlan>['plan']
): { nombre: string; estado: string; tono: string } => {
  if (!plan) return { nombre: 'Sin información', estado: 'El servidor no informó el plan.', tono: 'text-ink-500' };

  const nombre = plan.plan ? NOMBRE_DE_PLAN[plan.plan] : 'Cortesía';
  const periodo = plan.period ? ETIQUETA_DE_PERIODO[plan.period] : null;
  const dias = plan.diasRestantes;
  const diasTexto = dias === null ? '' : `${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;

  switch (plan.estado) {
    case 'ACTIVO':
      return {
        nombre: periodo ? `${nombre} · ${periodo}` : nombre,
        estado: dias !== null ? `Activo · vence en ${diasTexto}` : 'Activo',
        tono: 'text-verified'
      };
    case 'POR_VENCER':
      return {
        nombre: periodo ? `${nombre} · ${periodo}` : nombre,
        estado: dias !== null ? `Por vencer · ${diasTexto}` : 'Por vencer',
        tono: 'text-unverified'
      };
    case 'VENCIDO':
      return {
        nombre,
        estado: dias !== null ? `Vencido hace ${diasTexto}` : 'Vencido',
        tono: 'text-danger'
      };
    case 'PRUEBA':
      return {
        nombre: `${nombre} · Prueba`,
        estado: dias !== null ? `Quedan ${diasTexto} de prueba` : 'Prueba',
        tono: 'text-brand-700'
      };
    case 'CORTESIA':
      return { nombre: 'Cortesía', estado: 'Sin vencimiento', tono: 'text-ink-500' };
  }
};
