import React, { useMemo, useState } from 'react';
import { Bell, Building2, Check, ChevronDown, ChevronRight, Settings, Shield, User } from 'lucide-react';
import type { LawFirmTenant } from '../types';
import type { MainView } from '../types';
import { NAV_GROUPS, NAV_MODULES, navModule } from '../navigation';
import { IureonMark } from './IureonMark';
import { useTenant } from '../TenantContext';
import { solicitarAbrirNovedades, useNovedadesNuevas } from '../../help/useNovedades';
import { usePlan } from '../../subscriptions/PlanContext';
import { NOMBRE_DE_PLAN } from '../../subscriptions/types';
import type { PlanDeFirma } from '../../subscriptions/types';

interface SidebarLeftProps {
  mainView: MainView;
  setMainView: (view: MainView) => void;
  /** Home: Inicio with every remembered inner screen forgotten. */
  onInicio?: () => void;
  activeFirm: LawFirmTenant;
  setActiveFirm: (firm: LawFirmTenant) => void;
  sampleFirms: LawFirmTenant[];
  isFirmDropdownOpen: boolean;
  setIsFirmDropdownOpen: (open: boolean) => void;
  onOpenBrandingModal: () => void;
  onOpenSubscriptionModal: () => void;
  /** Avisos en este dispositivo (Web Push). Vive en el pie, junto a Membrete: es ajuste, no módulo. */
  onOpenAvisos?: () => void;
  onOpenUserManagementModal?: () => void;
  onOpenRechargeModal?: () => void;
  isSuperUser?: boolean;
  isParticularUser?: boolean;
  /**
   * Trabajo pendiente de un humano, por módulo.
   *
   * SOLO ESO. El diseño es explícito: los dos únicos contadores de la barra
   * significan transcripciones por revisar y actuaciones por curar, y ningún
   * badge es decorativo. Mientras nadie los calcule de verdad, no se pintan —
   * un "2" inventado en la barra es la misma clase de adorno que la pastilla
   * verde de "Cifrado" que ya se quitó de aquí por afirmar lo que nadie medía.
   */
  pendientes?: Partial<Record<MainView, number>>;
  /**
   * Módulos que el plan de la firma no incluye. No se pintan: una puerta que
   * abre sobre un 403 es peor que ninguna. Vacío = se ven todos.
   */
  ocultas?: readonly MainView[];
}

/**
 * EL PANEL «ÍNDICE CLARO» (diseño 3b del titular, `public/sidebar-3b-indice-claro.html`).
 *
 * Papel claro con una línea fina a la derecha. Desplegado, los módulos son un
 * índice: número monoespaciado a dos cifras y etiqueta, sin iconos; el activo
 * va en tinta sólida con el número en oro. Colapsado, cada módulo es una ficha
 * blanca con solo el icono, y los rótulos de grupo se vuelven una raya corta.
 * Los anchos son los del diseño: 258 abierto, 82 cerrado.
 */
const ANCHO = 'w-[258px]';
const RIEL = 'w-[82px]';

/** La curva del diseño. `motion-reduce` la anula: quien pidió menos movimiento no ve deslizar nada. */
const TRANSICION = 'transition-[width] duration-300 ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none';

/** El rótulo de grupo del diseño: 9.5px, versales, tracking .18em, tinta al 34 %. */
const ROTULO = 'text-[9.5px] font-semibold uppercase tracking-[0.18em] text-rail-ink/[.34]';

/** Las fichas del riel colapsado: 48×42, blancas, con borde de tinta al 9 %. */
const FICHA = 'h-[42px] w-12 rounded-[14px] border border-rail-ink/10 bg-rail-surface';

/**
 * El panel se queda como se dejó. La clave es la del diseño; se lee una vez al
 * montar y se escribe al pulsar «Colapsar». Sin almacenamiento (modo privado,
 * datos bloqueados) el panel abre desplegado y nada falla.
 */
const CLAVE_COLAPSADO = 'iureon.rail.collapsed';
const leerColapsado = (): boolean => {
  try {
    return localStorage.getItem(CLAVE_COLAPSADO) === '1';
  } catch {
    return false;
  }
};
const guardarColapsado = (colapsado: boolean): void => {
  try {
    localStorage.setItem(CLAVE_COLAPSADO, colapsado ? '1' : '0');
  } catch {
    /* sin almacenamiento no hay memoria; el panel sigue funcionando */
  }
};

/**
 * Las iniciales del chip de usuario, sacadas del correo: «daniel.ma@…» → «DM»,
 * «ana@…» → «AN». La sesión no trae nombre, solo correo; «US» si tampoco hay correo.
 */
const inicialesDe = (correo: string): string => {
  const local = correo.split('@')[0] ?? '';
  const partes = local.split(/[._\-+]+/).filter(Boolean);
  const letras =
    partes.length >= 2 ? partes[0][0] + partes[1][0] : (partes[0] ?? '').slice(0, 2);
  return letras ? letras.toUpperCase() : 'US';
};

/** «$14k» para la ficha del riel: caben cuatro caracteres, no «$14.000». */
const saldoCompacto = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
};

/**
 * El plan en una línea corta, para la nota de la tarjeta de saldo. Cada cifra
 * es del servidor; sin plan (el servidor no respondió) no se dice nada, no se
 * inventa. El diseño escribía «7 escritos restantes»: la aplicación no calcula
 * eso, así que aquí va el plan y su vencimiento, que sí se saben.
 */
const notaDelPlan = (plan: PlanDeFirma | null): string | null => {
  if (!plan) return null;
  const nombre = plan.plan ? NOMBRE_DE_PLAN[plan.plan] : 'Cortesía';
  const dias = plan.diasRestantes;
  const diasTexto = dias === null ? '' : `${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
  switch (plan.estado) {
    case 'ACTIVO':
      return dias !== null ? `${nombre} · vence en ${diasTexto}` : `${nombre} · activo`;
    case 'POR_VENCER':
      return dias !== null ? `${nombre} · vence en ${diasTexto}` : `${nombre} · por vencer`;
    case 'VENCIDO':
      return dias !== null ? `${nombre} · vencido hace ${diasTexto}` : `${nombre} · vencido`;
    case 'PRUEBA':
      return dias !== null ? `${nombre} · prueba, ${diasTexto}` : `${nombre} · prueba`;
    case 'CORTESIA':
      return 'Cortesía · sin vencimiento';
  }
};

/**
 * Cuánto del periodo queda, de 0 a 1, para la barra fina de la tarjeta. Solo
 * cuando hay un periodo de duración conocida y días por delante: una barra al
 * 38 % fija, como la del boceto, afirmaría algo que nadie midió.
 */
const DIAS_DEL_PERIODO: Partial<Record<NonNullable<PlanDeFirma['period']>, number>> = {
  MENSUAL: 30,
  ANUAL: 365,
  PRUEBA: 7
};
const fraccionDelPeriodo = (plan: PlanDeFirma | null): number | null => {
  if (!plan || !plan.period || plan.diasRestantes === null || plan.diasRestantes < 0) return null;
  const total = DIAS_DEL_PERIODO[plan.period];
  if (!total) return null;
  return Math.min(1, plan.diasRestantes / total);
};

/**
 * El índice del panel. Inicio es la casa y no lleva número; la numeración
 * arranca en el primer módulo de «Producir» y sigue continua por todos los
 * grupos, contando solo lo que se ve: un módulo oculto por el plan no deja un
 * hueco en la cuenta. Administrar, aunque esté plegado, conserva sus números
 * para que al abrirlo el índice no salte.
 */
const indicesDeNavegacion = (ocultas: readonly MainView[]): Map<MainView, string> => {
  const indices = new Map<MainView, string>();
  let n = 0;
  for (const grupo of NAV_GROUPS) {
    for (const id of grupo.modulos) {
      if (id === 'inicio' || ocultas.includes(id)) continue;
      n += 1;
      indices.set(id, String(n).padStart(2, '0'));
    }
  }
  return indices;
};

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  mainView,
  setMainView,
  onInicio,
  activeFirm,
  setActiveFirm,
  sampleFirms,
  isFirmDropdownOpen,
  setIsFirmDropdownOpen,
  onOpenBrandingModal,
  onOpenSubscriptionModal,
  onOpenAvisos,
  onOpenUserManagementModal,
  onOpenRechargeModal,
  isSuperUser = false,
  isParticularUser = false,
  pendientes = {},
  ocultas = []
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(leerColapsado);
  const [administrarAbierto, setAdministrarAbierto] = useState(false);
  const novedadesNuevas = useNovedadesNuevas();
  const { currentUserEmail } = useTenant();
  const { plan } = usePlan();

  const indices = useMemo(() => indicesDeNavegacion(ocultas), [ocultas]);
  const iniciales = inicialesDe(currentUserEmail);
  const saldo = activeFirm.creditsBalance ?? 0;
  const saldoTexto = `$${saldo.toLocaleString('es-CO')}`;
  const nota = notaDelPlan(plan);
  const fraccion = fraccionDelPeriodo(plan);

  const contexto = isSuperUser
    ? { nombre: 'SuperUsuario', detalle: 'Acceso total · sin firma', Icono: Shield }
    : isParticularUser
    ? { nombre: 'Abogado particular', detalle: 'Uso personal · sin firma', Icono: User }
    : { nombre: activeFirm.name, detalle: activeFirm.nit || 'Sin NIT', Icono: Building2 };

  /** Un módulo del índice. Desplegado: número y etiqueta. Colapsado: ficha con el icono. */
  const Item = ({ id }: { id: MainView }) => {
    const { label, icon: Icon } = navModule(id);
    const activo = mainView === id;
    const pendiente = pendientes[id];
    const hayPendiente = pendiente !== undefined && pendiente > 0;

    if (isCollapsed) {
      return (
        <button
          type="button"
          data-visita={`nav-${id}`}
          onClick={() => setMainView(id)}
          title={hayPendiente ? `${label} · ${pendiente} sin leer` : label}
          aria-label={label}
          aria-current={activo ? 'page' : undefined}
          className={`relative grid place-items-center ${FICHA} transition-colors ${
            activo
              ? 'border-brand-700 bg-brand-700 text-white'
              : 'text-rail-muted hover:border-rail-ink/20 hover:text-rail-ink'
          }`}
        >
          <Icon className="h-[21px] w-[21px]" strokeWidth={1.6} aria-hidden />
          {/* El punto dice que hay trabajo sin ver; la cifra exacta espera a desplegar. */}
          {hayPendiente && (
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rail-gold"
              aria-hidden
            />
          )}
        </button>
      );
    }

    return (
      <button
        type="button"
        data-visita={`nav-${id}`}
        onClick={() => setMainView(id)}
        aria-current={activo ? 'page' : undefined}
        className={`grid h-[42px] w-full grid-cols-[22px_1fr] items-center gap-3 rounded-[12px] px-[14px] text-left text-[15.5px] tracking-[-0.015em] transition-colors ${
          activo
            ? 'bg-brand-700 font-semibold text-white'
            : 'text-rail-ink-soft hover:bg-rail-ink/5 hover:text-rail-ink'
        }`}
      >
        {/* Inicio no lleva número: es la casa, no una entrada del índice. La columna queda para alinear. */}
        <span
          className={`font-mono text-[11px] font-medium leading-none tracking-[0.02em] ${
            activo ? 'text-rail-gold' : 'text-rail-ink/30'
          }`}
          aria-hidden
        >
          {indices.get(id) ?? ''}
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{label}</span>
          {hayPendiente && (
            <span
              className={`ml-auto shrink-0 rounded-full px-1.5 font-mono text-[10px] font-semibold ${
                activo ? 'bg-white/15 text-white' : 'bg-rail-ink/10 text-rail-ink-soft'
              }`}
            >
              {pendiente}
            </span>
          )}
        </span>
      </button>
    );
  };

  /**
   * El menú de la firma: cambiar de firma y abrir «Firmas y usuarios». El mismo
   * bajo la fila del contexto (desplegado) y flotando a la derecha del icono
   * (colapsado), para que plegar el panel no le quite al superusuario su única
   * entrada a la consola desde aquí.
   */
  const MenuDeFirma = ({ className }: { className: string }) => (
    <div className={`surface-raised absolute z-30 overflow-hidden py-1 ${className}`}>
      {(isSuperUser || isParticularUser) && (
        <p className="border-b border-line-100 px-3 py-2 text-label uppercase text-ink-500">
          {contexto.detalle}
        </p>
      )}
      {sampleFirms.map((firm) => (
        <button
          key={firm.id}
          type="button"
          onClick={() => {
            setActiveFirm(firm);
            setIsFirmDropdownOpen(false);
          }}
          className={`flex w-full items-center justify-between px-3 py-1.5 text-left text-ui hover:bg-canvas ${
            firm.id === activeFirm.id ? 'font-medium text-brand-700' : 'text-ink-700'
          }`}
        >
          <span className="truncate">{firm.name}</span>
          {firm.id === activeFirm.id && <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-brand-700" />}
        </button>
      ))}
      {onOpenUserManagementModal && (
        <div className="mt-1 border-t border-line-100 p-1">
          <button
            type="button"
            onClick={() => {
              setIsFirmDropdownOpen(false);
              onOpenUserManagementModal();
            }}
            className="btn-secondary btn-sm w-full"
          >
            <Shield className="h-3.5 w-3.5" />
            Firmas y usuarios
          </button>
        </div>
      )}
    </div>
  );

  return (
    <aside
      className={`flex h-full flex-col border-r border-rail-ink/10 bg-rail font-sans ${TRANSICION} ${
        isCollapsed ? RIEL : ANCHO
      }`}
    >
      {/* ─── CABECERA: MARCA Y USUARIO ─────────────────────────────────────
          70px, como el diseño. El logo va a casa: ahora que una recarga deja al
          abogado en el módulo que estaba leyendo, salir de uno tiene que ser
          algo que pueda pedir. */}
      <div
        className={`flex h-[70px] shrink-0 items-center gap-[11px] overflow-hidden ${
          isCollapsed ? 'justify-center px-0' : 'px-[18px]'
        }`}
      >
        <button
          type="button"
          onClick={onInicio ?? (() => setMainView('inicio'))}
          data-visita="marca"
          title="Ir al inicio"
          aria-label="Ir al inicio"
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-[11px] rounded-control transition-opacity hover:opacity-80"
        >
          <IureonMark size={30} className="shrink-0" />
          {!isCollapsed && (
            <span className="whitespace-nowrap text-[19px] font-semibold tracking-[-0.02em] text-rail-ink">
              Iureon
            </span>
          )}
        </button>
        {!isCollapsed && (
          <span
            title={currentUserEmail || 'Sesión'}
            aria-label={currentUserEmail ? `Sesión de ${currentUserEmail}` : 'Sesión'}
            className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-[11px] border border-rail-ink/10 bg-rail-surface text-[11px] font-semibold text-rail-ink-soft"
          >
            {iniciales}
          </span>
        )}
      </div>

      {/* ─── CONTEXTO: LA FIRMA ────────────────────────────────────────────
          Una fila bajo la cabecera, no una tarjeta. Es contexto permanente:
          con qué firma trabajo. Colapsado, el icono abre el mismo menú. */}
      {!isCollapsed ? (
        <div className="relative shrink-0 px-[14px] pb-1">
          <button
            type="button"
            onClick={() => setIsFirmDropdownOpen(!isFirmDropdownOpen)}
            aria-expanded={isFirmDropdownOpen}
            aria-haspopup="menu"
            className="flex h-8 w-full items-center gap-2 rounded-[10px] px-[14px] text-left text-[12.5px] text-rail-muted hover:bg-rail-ink/5 hover:text-rail-ink"
          >
            <contexto.Icono className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            <span className="min-w-0 flex-1 truncate">{contexto.nombre}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
          </button>
          {isFirmDropdownOpen && <MenuDeFirma className="left-[14px] right-[14px] top-full mt-1" />}
        </div>
      ) : (
        <div className="relative flex shrink-0 justify-center pb-1">
          <button
            type="button"
            onClick={() => setIsFirmDropdownOpen(!isFirmDropdownOpen)}
            title={onOpenUserManagementModal ? `${contexto.nombre} · Firmas y usuarios` : contexto.nombre}
            aria-label={`Firma: ${contexto.nombre}`}
            aria-expanded={isFirmDropdownOpen}
            aria-haspopup="menu"
            className="flex h-8 w-12 items-center justify-center rounded-[10px] text-rail-muted hover:bg-rail-ink/5 hover:text-rail-ink"
          >
            <contexto.Icono className="h-4 w-4" strokeWidth={1.8} />
          </button>
          {isFirmDropdownOpen && <MenuDeFirma className="left-full top-0 ml-2 w-56" />}
        </div>
      )}

      {/* ─── EL ÍNDICE ─────────────────────────────────────────────────────
          `min-h-0` es obligatorio: sin él el hijo flex no encoge y el pie se
          sale del panel en pantallas bajas. */}
      <nav
        aria-label="Módulos"
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden [scrollbar-width:thin] ${
          isCollapsed ? 'gap-2 px-[17px]' : 'px-[14px]'
        }`}
      >
        {NAV_GROUPS.map((grupo) => {
          const abierto = !grupo.plegable || administrarAbierto;
          const modulos = grupo.modulos.filter((id) => !ocultas.includes(id));
          if (modulos.length === 0) return null;

          return (
            <div
              key={grupo.titulo}
              className={isCollapsed ? 'grid justify-items-center gap-2 py-1.5' : 'pb-1 pt-3'}
            >
              {/* Colapsado, el rótulo es una raya de 26px; Inicio no lleva ni rótulo ni raya. */}
              {isCollapsed
                ? !grupo.sinTitulo && <span className="h-px w-[26px] bg-rail-ink/[.14]" aria-hidden />
                : !grupo.sinTitulo &&
                  (grupo.plegable ? (
                    <button
                      type="button"
                      onClick={() => setAdministrarAbierto((v) => !v)}
                      className={`flex w-full items-center gap-1 px-[14px] pb-2 text-left ${ROTULO}`}
                      aria-expanded={abierto}
                    >
                      {grupo.titulo}
                      <ChevronRight
                        className={`h-3 w-3 transition-transform motion-reduce:transition-none ${
                          abierto ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  ) : (
                    <p className={`px-[14px] pb-2 ${ROTULO}`}>{grupo.titulo}</p>
                  ))}

              {/*
                En el riel colapsado el grupo plegable se abre siempre: sin
                etiquetas no hay forma de saber que hay algo escondido, y un
                módulo invisible es un módulo que no existe.
              */}
              {(abierto || isCollapsed) &&
                (isCollapsed ? (
                  modulos.map((id) => <Item key={id} id={id} />)
                ) : (
                  <div className="space-y-px">
                    {modulos.map((id) => (
                      <Item key={id} id={id} />
                    ))}
                  </div>
                ))}
            </div>
          );
        })}

        {/*
          Un módulo que exista y no esté en ningún grupo desaparecería de la
          barra en silencio. Aquí se ve, en desarrollo, antes que en producción.
        */}
        {import.meta.env.DEV &&
          NAV_MODULES.filter((m) => !NAV_GROUPS.some((g) => g.modulos.includes(m.id))).map((m) => (
            <p key={m.id} className="mt-2 px-1.5 text-meta text-unverified">
              ⚠ {m.label} no está en ningún grupo
            </p>
          ))}
      </nav>

      {/* ─── PIE: SALDO, AJUSTES Y EL BOTÓN DE COLAPSAR ────────────────────*/}
      <div className={`grid shrink-0 gap-2 ${isCollapsed ? 'justify-items-center p-4' : 'p-[14px]'}`}>
        {/* SALDO. Vive en la barra y no en un menú: es lo único que puede
            detener el trabajo a mitad de un término. */}
        {!isCollapsed ? (
          <div
            data-visita="saldo"
            className="rounded-2xl border border-rail-ink/10 bg-rail-surface p-4"
          >
            <div className="flex items-baseline gap-3">
              <span className={`${ROTULO} !text-rail-ink/[.38]`}>Saldo</span>
              {/*
                Dos puertas, dos cosas distintas: «Recargar» compra saldo de
                consumo; «Plan» paga el derecho a usar la aplicación. Juntas
                aquí porque las dos son dinero y las dos las decide un socio.
              */}
              <button
                type="button"
                onClick={onOpenSubscriptionModal}
                className="ml-auto text-[12px] font-semibold text-rail-gold-ink hover:underline"
              >
                Plan
              </button>
              <button
                type="button"
                onClick={onOpenRechargeModal || onOpenSubscriptionModal}
                className="text-[12px] font-semibold text-rail-gold-ink hover:underline"
              >
                Recargar
              </button>
            </div>
            {/* En mono porque es un dato, no interfaz. */}
            <p className="mt-1.5 font-mono text-[27px] font-semibold leading-none tracking-[-0.03em] text-rail-ink">
              {saldoTexto}
            </p>
            {fraccion !== null && (
              <div
                className="mt-3 h-[3px] overflow-hidden rounded-full bg-rail-ink/10"
                role="progressbar"
                aria-label="Parte del periodo del plan que queda"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(fraccion * 100)}
              >
                <i className="block h-full rounded-full bg-rail-gold" style={{ width: `${fraccion * 100}%` }} />
              </div>
            )}
            {nota && <p className="mt-2 text-[11px] text-rail-faint">{nota}</p>}
          </div>
        ) : (
          <>
            <button
              type="button"
              data-visita="saldo"
              onClick={onOpenRechargeModal || onOpenSubscriptionModal}
              title={`Saldo ${saldoTexto}${nota ? ` · ${nota}` : ''} · Recargar`}
              aria-label={`Saldo ${saldoTexto}. Recargar`}
              className="grid w-12 place-items-center gap-px rounded-[14px] border border-rail-ink/10 bg-rail-surface py-2 hover:border-rail-ink/20"
            >
              <span className="text-[8.5px] font-semibold uppercase tracking-[0.1em] text-rail-faint">Saldo</span>
              <span className="font-mono text-[12.5px] font-semibold text-rail-ink">{saldoCompacto(saldo)}</span>
            </button>
            <span
              className="py-2 text-[9.5px] font-semibold tracking-[0.32em] text-rail-ink/[.28] [writing-mode:vertical-rl] rotate-180"
              aria-hidden
            >
              IUREON
            </span>
          </>
        )}

        {/* MEMBRETE, AVISOS Y EL SELLO DE VERSIÓN. Ajustes, no módulos: van
            en fila compacta sobre el botón de colapsar. El sello importa: un
            deploy «Ready» en Vercel no prueba lo que ESTE navegador corre;
            con el commit a la vista, «no veo los cambios» se responde
            comparando dos hashes. */}
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-0.5' : 'gap-0.5'}`}>
          <button
            type="button"
            onClick={onOpenBrandingModal}
            title="Membrete de la firma"
            aria-label="Membrete de la firma"
            className={`flex items-center gap-1.5 rounded-[10px] text-[11.5px] text-rail-muted hover:bg-rail-ink/5 hover:text-rail-ink ${
              isCollapsed ? 'h-8 w-8 justify-center' : 'h-7 px-2'
            }`}
          >
            <Settings className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
            {!isCollapsed && <span>Membrete</span>}
          </button>

          {onOpenAvisos && (
            <button
              type="button"
              onClick={onOpenAvisos}
              title="Avisos en este dispositivo"
              aria-label="Avisos en este dispositivo"
              className={`flex items-center gap-1.5 rounded-[10px] text-[11.5px] text-rail-muted hover:bg-rail-ink/5 hover:text-rail-ink ${
                isCollapsed ? 'h-8 w-8 justify-center' : 'h-7 px-2'
              }`}
            >
              <Bell className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
              {!isCollapsed && <span>Avisos</span>}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              solicitarAbrirNovedades();
              setMainView('manual');
            }}
            title={`Versión ${__COMMIT__} · ver qué cambió`}
            aria-label={`Versión ${__COMMIT__}. Ver qué cambió`}
            className={`relative flex items-center gap-1.5 rounded-[10px] font-mono text-[9px] tracking-wider text-rail-faint hover:text-rail-muted ${
              isCollapsed ? 'h-8 w-8 justify-center' : 'ml-auto h-7 px-2'
            }`}
          >
            {/* El punto dice que hay cambios que este navegador no ha visto en Novedades. */}
            {novedadesNuevas > 0 && (
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full bg-rail-gold ${
                  isCollapsed ? 'absolute right-1 top-1' : ''
                }`}
                aria-hidden
              />
            )}
            {isCollapsed ? 'v' : `v. ${__COMMIT__}`}
          </button>
        </div>

        {/* COLAPSAR. Un botón entero al pie, no una flecha escondida. */}
        <button
          type="button"
          onClick={() => {
            guardarColapsado(!isCollapsed);
            setIsCollapsed(!isCollapsed);
            setIsFirmDropdownOpen(false);
          }}
          aria-expanded={!isCollapsed}
          aria-label={isCollapsed ? 'Desplegar panel' : 'Colapsar panel'}
          title={isCollapsed ? 'Desplegar panel' : 'Colapsar panel'}
          className={`flex h-10 items-center justify-center gap-[9px] border border-rail-ink/10 bg-rail-surface text-[12.5px] font-medium text-rail-muted transition-colors hover:border-rail-ink/20 hover:text-rail-ink ${
            isCollapsed ? 'w-12 rounded-[14px]' : 'w-full rounded-[12px]'
          }`}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={`shrink-0 transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)] motion-reduce:transition-none ${
              isCollapsed ? 'rotate-180' : ''
            }`}
          >
            <polyline points="15 18 9 12 15 6" />
            <line x1="20" y1="6" x2="20" y2="18" />
          </svg>
          {!isCollapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
};
