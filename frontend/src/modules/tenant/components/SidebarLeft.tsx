import React, { useState } from 'react';
import { Bell, Building2, Check, ChevronDown, ChevronRight, Settings, Shield, User } from 'lucide-react';
import type { LawFirmTenant } from '../types';
import type { MainView } from '../types';
import { NAV_GROUPS, NAV_MODULES, NUMERAL_DE_MODULO, navModule } from '../navigation';
import { IureonMark } from './IureonMark';
import { useTenant } from '../TenantContext';
import { solicitarAbrirNovedades, useNovedadesNuevas } from '../../help/useNovedades';
import { usePlan } from '../../subscriptions/PlanContext';
import { NOMBRE_DE_PLAN } from '../../subscriptions/types';
import type { PlanDeFirma } from '../../subscriptions/types';
import '../../../design/cara-nueva.css';

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
 * EL PANEL LATERAL DE LA CARA NUEVA (`public/handoff/app-inicio.html`, artboard 1;
 * README-app §1).
 *
 * Papel cálido, sin raya a la derecha: la diferencia de papel ya separa el
 * índice del trabajo. Arriba la marca y la ficha de la firma; en medio el
 * índice por grupos con numerales fijos, que se desplaza; abajo la ficha de
 * saldo, ANCLADA, con «Recargar», y los ajustes del panel. El módulo abierto es
 * una tarjeta blanca con una barra de oro de 3 px: el oro marca el módulo
 * activo y nada más, así que los puntos de «pendiente» y de novedades, que
 * antes eran de oro, pasan al azul.
 *
 * Todo el estilo vive en `design/cara-nueva.css`, bajo `.cara-nueva`, y lo que
 * el artboard no dibuja pero el panel ya tenía —Administrar, el menú de firmas,
 * colapsar, Membrete, Avisos, la nota del plan y el sello de versión— sigue
 * aquí con el mismo lenguaje.
 *
 * SIN CUADRO DE BÚSQUEDA. El artboard dibuja «Buscar ⌘K» bajo la marca, pero la
 * aplicación no tiene una búsqueda global: un campo que no busca nada es una
 * promesa rota en el lugar más visible del panel. Su sitio lo ocupa la ficha de
 * la firma, que sí existe. El día que haya búsqueda, va ahí.
 *
 * Los anchos: 216 abierto, el del artboard; 82 cerrado, el de siempre.
 */

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
  const { currentUserEmail, currentUserName } = useTenant();
  const { plan } = usePlan();

  /*
   * QUIÉN ESTÁ TRABAJANDO. Antes aquí iba un chip con dos iniciales SACADAS DEL
   * CORREO, porque la aplicación no guardaba un nombre; ahora sí lo guarda y se
   * escribe entero. Mientras una cuenta no tenga nombre se muestra su correo,
   * que es verdad y no lo inventa nadie —jamás un nombre deducido de la parte
   * local, que es como salía «Ingdanielma».
   */
  const quienTrabaja = currentUserName || currentUserEmail;
  const saldo = activeFirm.creditsBalance ?? 0;
  const saldoTexto = `$${saldo.toLocaleString('es-CO')}`;
  const nota = notaDelPlan(plan);
  const fraccion = fraccionDelPeriodo(plan);

  const contexto = isSuperUser
    ? { nombre: 'SuperUsuario', detalle: 'Acceso total · sin firma', Icono: Shield }
    : isParticularUser
    ? { nombre: 'Abogado particular', detalle: 'Uso personal · sin firma', Icono: User }
    : { nombre: activeFirm.name, detalle: activeFirm.nit || 'Sin NIT', Icono: Building2 };

  /**
   * Un módulo del índice. Desplegado: numeral fijo y etiqueta. Colapsado: ficha
   * con el icono. El activo es la tarjeta blanca con la barra de oro en los dos.
   */
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
          className="cn-rail-ficha"
        >
          {activo && <span className="cn-rail-oro" aria-hidden />}
          <Icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
          {/* El punto dice que hay trabajo sin ver; la cifra exacta espera a desplegar. */}
          {hayPendiente && <span className="cn-rail-punto cn-rail-punto--esquina" aria-hidden />}
        </button>
      );
    }

    return (
      <button
        type="button"
        data-visita={`nav-${id}`}
        onClick={() => setMainView(id)}
        aria-current={activo ? 'page' : undefined}
        className="cn-rail-item"
      >
        {activo && <span className="cn-rail-oro" aria-hidden />}
        {/* Inicio no lleva número: es la casa, no una entrada del índice. La columna queda para alinear. */}
        <span className="cn-rail-numeral" aria-hidden>
          {NUMERAL_DE_MODULO[id] ?? ''}
        </span>
        <span className="cn-rail-etiqueta">{label}</span>
        {hayPendiente && <span className="cn-rail-cuenta">{pendiente}</span>}
      </button>
    );
  };

  /**
   * El menú de la firma: cambiar de firma y abrir «Firmas y usuarios». El mismo
   * bajo la ficha de la firma (desplegado) y flotando a la derecha del icono
   * (colapsado), para que plegar el panel no le quite al superusuario su única
   * entrada a la consola desde aquí.
   */
  const MenuDeFirma = ({ className }: { className: string }) => (
    <div className={`cn-rail-menu ${className}`}>
      {(isSuperUser || isParticularUser) && <p className="cn-rail-menu-detalle">{contexto.detalle}</p>}
      {sampleFirms.map((firm) => (
        <button
          key={firm.id}
          type="button"
          onClick={() => {
            setActiveFirm(firm);
            setIsFirmDropdownOpen(false);
          }}
          aria-current={firm.id === activeFirm.id ? 'true' : undefined}
          className="cn-rail-menu-fila"
        >
          <span className="min-w-0 flex-1 truncate">{firm.name}</span>
          {firm.id === activeFirm.id && <Check className="h-4 w-4 shrink-0" aria-hidden />}
        </button>
      ))}
      {onOpenUserManagementModal && (
        <div className="cn-rail-menu-pie">
          <button
            type="button"
            onClick={() => {
              setIsFirmDropdownOpen(false);
              onOpenUserManagementModal();
            }}
            className="cn-rail-menu-boton"
          >
            <Shield className="h-4 w-4" aria-hidden />
            Firmas y usuarios
          </button>
        </div>
      )}
    </div>
  );

  return (
    <aside className={`cara-nueva cn-rail ${isCollapsed ? 'cn-rail--cerrado' : ''}`}>
      {/* ─── MARCA ─────────────────────────────────────────────────────────
          El logo va a casa: ahora que una recarga deja al abogado en el módulo
          que estaba leyendo, salir de uno tiene que ser algo que pueda pedir. */}
      <button
        type="button"
        onClick={onInicio ?? (() => setMainView('inicio'))}
        data-visita="marca"
        title={currentUserEmail ? `Ir al inicio · ${currentUserEmail}` : 'Ir al inicio'}
        aria-label="Ir al inicio"
        className="cn-rail-marca"
      >
        <IureonMark size={isCollapsed ? 26 : 20} className="shrink-0" />
        {!isCollapsed && <span className="cn-rail-palabra">IUREON</span>}
      </button>

      {/* ─── LA FIRMA Y QUIÉN TRABAJA ──────────────────────────────────────
          Ocupa el sitio que el artboard da a la búsqueda (ver arriba por qué
          no se dibuja). Es contexto permanente: con qué firma y con qué
          cuenta se trabaja. APILADOS, NO EN FILA: en 188 px de ancho útil un
          nombre de firma y un nombre de persona uno al lado del otro no caben
          sin cortar el segundo. Colapsado, el icono abre el mismo menú. */}
      {!isCollapsed ? (
        <div className="cn-rail-firma-caja">
          <button
            type="button"
            onClick={() => setIsFirmDropdownOpen(!isFirmDropdownOpen)}
            aria-expanded={isFirmDropdownOpen}
            aria-haspopup="menu"
            className="cn-rail-firma"
          >
            <contexto.Icono className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
            <span className="cn-rail-firma-textos">
              <span className="cn-rail-firma-nombre">{contexto.nombre}</span>
              {quienTrabaja && <span className="cn-rail-firma-quien">{quienTrabaja}</span>}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
          </button>
          {isFirmDropdownOpen && <MenuDeFirma className="cn-rail-menu--abajo" />}
        </div>
      ) : (
        <div className="cn-rail-firma-caja">
          <button
            type="button"
            onClick={() => setIsFirmDropdownOpen(!isFirmDropdownOpen)}
            title={onOpenUserManagementModal ? `${contexto.nombre} · Firmas y usuarios` : contexto.nombre}
            aria-label={`Firma: ${contexto.nombre}`}
            aria-expanded={isFirmDropdownOpen}
            aria-haspopup="menu"
            className="cn-rail-icono"
          >
            <contexto.Icono className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
          </button>
          {isFirmDropdownOpen && <MenuDeFirma className="cn-rail-menu--lado" />}
        </div>
      )}

      {/* ─── EL ÍNDICE ─────────────────────────────────────────────────────
          Es lo único que se desplaza. `min-h-0` (en la hoja) es obligatorio:
          sin él el hijo flex no encoge y la ficha de saldo se sale del panel
          en pantallas bajas. */}
      <nav aria-label="Módulos" className="cn-rail-indice">
        {NAV_GROUPS.map((grupo) => {
          const abierto = !grupo.plegable || administrarAbierto;
          const modulos = grupo.modulos.filter((id) => !ocultas.includes(id));
          if (modulos.length === 0) return null;

          return (
            <div key={grupo.titulo} className="cn-rail-grupo">
              {/* Colapsado, el rótulo es una raya de 26 px; Inicio no lleva ni rótulo ni raya. */}
              {isCollapsed
                ? !grupo.sinTitulo && <span className="cn-rail-raya" aria-hidden />
                : !grupo.sinTitulo &&
                  (grupo.plegable ? (
                    <button
                      type="button"
                      onClick={() => setAdministrarAbierto((v) => !v)}
                      className="cn-rail-rotulo cn-rail-rotulo--boton"
                      aria-expanded={abierto}
                    >
                      {grupo.titulo}
                      <ChevronRight
                        className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${
                          abierto ? 'rotate-90' : ''
                        }`}
                        aria-hidden
                      />
                    </button>
                  ) : (
                    <p className="cn-rail-rotulo">{grupo.titulo}</p>
                  ))}

              {/*
                En el riel colapsado el grupo plegable se abre siempre: sin
                etiquetas no hay forma de saber que hay algo escondido, y un
                módulo invisible es un módulo que no existe.
              */}
              {(abierto || isCollapsed) && modulos.map((id) => <Item key={id} id={id} />)}
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

      {/* ─── PIE ANCLADO: SALDO, AJUSTES Y EL BOTÓN DE COLAPSAR ────────────*/}
      <div className="cn-rail-pie">
        {/* SALDO. Vive en la barra y no en un menú: es lo único que puede
            detener el trabajo a mitad de un término. */}
        {!isCollapsed ? (
          <div data-visita="saldo" className="cn-rail-saldo">
            {/*
              DOS DINEROS DISTINTOS, UNO ENCIMA DEL OTRO Y NO UNO AL LADO DEL
              OTRO. Arriba el saldo, que es consumo: se gasta escribiendo y se
              repone con «Recargar». Abajo el plan, que es el derecho a entrar:
              se paga por periodos y se abre con su propia fila. Puestos como
              dos enlaces gemelos en el mismo renglón parecían la misma puerta
              con dos nombres, y el titular lo leyó así.
            */}
            <p className="cn-rail-saldo-rotulo">Saldo</p>
            {/* En mono porque es un dato citable, no interfaz (README-app §1). */}
            <p className="cn-rail-saldo-cifra" title={`Saldo ${saldoTexto}`}>
              {saldoTexto}
            </p>
            <button
              type="button"
              onClick={onOpenRechargeModal || onOpenSubscriptionModal}
              className="cn-rail-recargar"
            >
              Recargar
            </button>
            <button
              type="button"
              onClick={onOpenSubscriptionModal}
              /* La nota se trunca con puntos suspensivos en la barra; entera, en el `title`. */
              title={nota ? `${nota} · Ver el plan de la firma` : 'Ver el plan de la firma'}
              className="cn-rail-plan"
            >
              <span className="min-w-0 flex-1 truncate">{nota ?? 'Ver el plan'}</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
            </button>
            {/* La barra mide el periodo del plan, así que va con el plan. Azul y no oro: el oro es solo del módulo activo. */}
            {fraccion !== null && (
              <div
                className="cn-rail-periodo"
                role="progressbar"
                aria-label="Parte del periodo del plan que queda"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(fraccion * 100)}
              >
                <i style={{ width: `${fraccion * 100}%` }} />
              </div>
            )}
          </div>
        ) : (
          <>
            <button
              type="button"
              data-visita="saldo"
              onClick={onOpenRechargeModal || onOpenSubscriptionModal}
              title={`Saldo ${saldoTexto}${nota ? ` · ${nota}` : ''} · Recargar`}
              aria-label={`Saldo ${saldoTexto}. Recargar`}
              className="cn-rail-saldo-ficha"
            >
              <span className="cn-rail-saldo-ficha-rotulo">Saldo</span>
              <span className="cn-rail-saldo-ficha-cifra">{saldoCompacto(saldo)}</span>
            </button>
            <span className="cn-rail-vertical" aria-hidden>
              IUREON
            </span>
          </>
        )}

        {/* MEMBRETE Y AVISOS. Ajustes del aparato y de la firma, no módulos:
            van en una fila pareja, cada uno con la mitad del ancho, para que
            se lean como dos cosas del mismo rango. El sello de versión vive
            solo, bajo el botón de colapsar, que es donde termina la barra. */}
        <div className="cn-rail-ajustes">
          <button
            type="button"
            onClick={onOpenBrandingModal}
            title="Membrete de la firma"
            aria-label="Membrete de la firma"
            className="cn-rail-ajuste"
          >
            <Settings className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
            {!isCollapsed && <span>Membrete</span>}
          </button>

          {onOpenAvisos && (
            <button
              type="button"
              onClick={onOpenAvisos}
              title="Avisos en este dispositivo"
              aria-label="Avisos en este dispositivo"
              className="cn-rail-ajuste"
            >
              <Bell className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
              {!isCollapsed && <span>Avisos</span>}
            </button>
          )}
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
          className="cn-rail-colapsar"
        >
          <svg
            width="16"
            height="16"
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

        {/* EL SELLO DE VERSIÓN, SOLO Y AL FINAL. Importa: un despliegue «Ready»
            en Vercel no prueba lo que ESTE navegador corre; con el commit a la
            vista, «no veo los cambios» se responde comparando dos hashes. El
            punto dice que hay cambios que este navegador no ha visto. */}
        <button
          type="button"
          onClick={() => {
            solicitarAbrirNovedades();
            setMainView('manual');
          }}
          title={`Versión ${__COMMIT__} · ver qué cambió`}
          aria-label={`Versión ${__COMMIT__}. Ver qué cambió`}
          className="cn-rail-version"
        >
          {novedadesNuevas > 0 && (
            <span
              className={`cn-rail-punto ${isCollapsed ? 'cn-rail-punto--esquina' : ''}`}
              aria-hidden
            />
          )}
          {isCollapsed ? 'v' : `v. ${__COMMIT__}`}
        </button>
      </div>
    </aside>
  );
};
