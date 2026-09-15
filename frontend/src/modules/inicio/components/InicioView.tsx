import React from 'react';
import { AlertCircle, BookMarked, Route, Wallet } from 'lucide-react';
import type { MainView } from '../../tenant/types';
import { moduloDeVista } from '../../tenant/navigation';
import type { SavedDraftEntry } from '../../documents/types';
import { reviewApi, type RevisionGuardada } from '../../workspace/services/review.api';
import { agendaApi } from '../../agenda/services/agenda.api';
import type { EntradaDeAgenda } from '../../agenda/types';
import { usePlan } from '../../subscriptions/PlanContext';
import { useTenant } from '../../tenant/TenantContext';
import { ETIQUETA_DE_PERIODO, NOMBRE_DE_PLAN, type Modulo } from '../../subscriptions/types';
import { NOVEDADES } from '../../help/content/novedades';
import { esNueva, fechaMasReciente, paraInicio, visiblesParaRol } from '../../help/novedades.logica';
import { vistasHasta } from '../../help/useNovedades';
import { PUERTAS_DE_INICIO } from '../puertas';
import { textoDeLaVisitaCompleta } from '../visitaGuiada/capitulos';
import { dejarDocumentoParaLeer } from '../../workspace/documentoParaLeer';
import { fechaCorta, fechaLarga, nombreParaSaludar, saludoSegunHora } from '../saludo';
import { diasHastaVencer, haceCuanto, textoDelPlazo } from '../plazos';

/**
 * Inicio: la pantalla a la que se llega, y a la que devuelve la marca.
 *
 * ─── NO ES UN TABLERO: TRES NIVELES (README-app §2) ─────────────────────────
 *
 * 1. «Lo que vence»: los términos pendientes más próximos de la agenda, con
 *    el botón que los resuelve. Va primero porque quien tiene un término
 *    corriendo no debe encontrarse antes con un menú de sugerencias.
 * 2. «Continuar donde iba»: borradores y revisiones recientes, juntos por
 *    fecha, más el plan y el saldo.
 * 3. «Por dónde empiezo»: las puertas de `inicio/puertas.ts`, al final y
 *    apagadas, con Novedades y la visita guiada debajo.
 *
 * ─── «NO SÉ» NO ES «CERO» ──────────────────────────────────────────────────
 *
 * La agenda tiene tres estados y no dos. Si la lectura falla, la pantalla lo
 * dice; nunca pinta «no hay términos pendientes», porque esa frase sobre un
 * error es exactamente la que deja a un abogado tranquilo con un término
 * vencido. Lo mismo con «Alcanza para…»: sin la cifra del servidor, se calla.
 *
 * ─── NADA SE CALCULA DOS VECES ─────────────────────────────────────────────
 *
 * Los borradores llegan como prop porque `App` ya los carga; las revisiones se
 * leen con la llamada de `RevisionesView` y se abren por su mismo camino; la
 * agenda se lee con su servicio, ya ordenada por fecha límite en el servidor;
 * el plan y sus días vienen del contexto; el saldo es la cifra de la firma.
 *
 * ─── UN SOLO COMPONENTE PARA LOS DOS TAMAÑOS ───────────────────────────────
 *
 * Una columna en el teléfono, con las acciones principales EN LÍNEA arriba y
 * no pegadas al borde: la barra inferior de 62 px ya ocupa ese sitio. El
 * estilo vive en `design/cara-nueva.css`, bajo `.cara-nueva`.
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
  /** Abre Novedades; con id, en el detalle de esa entrada. */
  onVerNovedades: (id?: string) => void;
  /** Superusuario: sus novedades de operación también cuentan. */
  esOperador: boolean;
  visita: {
    invitacionPendiente: boolean;
    iniciar: () => void;
    declinarInvitacion: () => void;
    /** Los capítulos de la visita: de sus segundos sale la duración que se anuncia. */
    capitulos: readonly { segundos: number }[];
  };
  /** `summary.mes.escritosRestantes` del servidor; `null` si no lo informó. */
  escritosRestantes: number | null;
  /** `irARedactar` de App: Redacción con la actuación y la rama ya puestas. */
  onRedactarActuacion: (nombre: string, rama: string, hechos: string) => void;
  /** Abre la agenda de términos dentro de Herramientas. */
  onAbrirAgenda: () => void;
}

const MAXIMO_VENCIMIENTOS = 3;
const MAXIMO_RECIENTES = 5;
const MAXIMO_NOVEDADES = 3;

type LecturaDeAgenda =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'listo'; entradas: EntradaDeAgenda[] };

type Reciente =
  | { tipo: 'borrador'; fecha: string; entrada: SavedDraftEntry }
  | { tipo: 'revision'; fecha: string; revision: RevisionGuardada };

const marcaDeTiempo = (iso: string): number => {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
};

/*
 * LOS «HECHOS» QUE VIAJAN A REDACCIÓN SON LOS DATOS DE LA PROPIA ENTRADA.
 * Nada que la agenda no tenga escrito: el asunto, el cliente y el radicado,
 * rotulados, para que el abogado cuente los hechos debajo en vez de encontrar
 * el cuadro vacío o, peor, relleno con algo que nadie dijo.
 */
const datosDeLaEntrada = (e: EntradaDeAgenda): string =>
  [
    e.asunto ? `Asunto: ${e.asunto}` : null,
    e.cliente ? `Cliente: ${e.cliente}` : null,
    e.radicado ? `Radicado: ${e.radicado}` : null
  ]
    .filter(Boolean)
    .join('\n');

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
  esOperador,
  visita,
  escritosRestantes,
  onRedactarActuacion,
  onAbrirAgenda
}) => {
  const { plan, abrirPlan } = usePlan();
  // El nombre guardado, para el saludo. Vacío deja el derivado del correo de
  // siempre: mejor un saludo aproximado que un saludo sin nadie.
  const { currentUserName } = useTenant();
  const ahora = React.useMemo(() => new Date(), []);
  /* «unos 5 minutos», medido sobre lo que la visita dice; nunca una cifra escrita a mano. */
  const duracionDeLaVisita = textoDeLaVisitaCompleta(
    visita.capitulos.reduce((suma, c) => suma + c.segundos, 0)
  ).toLowerCase();

  /* Un botón hacia una vista que el plan oculta no llevaría a ninguna parte: App la devuelve a Inicio. */
  const puede = (vista: MainView): boolean => !ocultas.includes(vista);

  /*
   * A closed door says why. The sidebar hides the view either way; here the
   * chip must distinguish «the plan does not include it» from «the operator
   * switched it off for this firm», because the remedies differ.
   */
  const motivoDePuertaCerrada = (vista: MainView): string => {
    const modulo = moduloDeVista(vista);
    return modulo && plan?.modulosDesactivados.includes(modulo as Modulo)
      ? 'No disponible para su firma'
      : 'No incluido en su plan';
  };

  /* ─── La agenda: tres estados, y el error no se confunde con el vacío ─── */
  const [agenda, setAgenda] = React.useState<LecturaDeAgenda>({ estado: 'cargando' });
  React.useEffect(() => {
    let cancelado = false;
    agendaApi
      .listar('PENDIENTE')
      .then((entradas) => {
        if (!cancelado) setAgenda({ estado: 'listo', entradas });
      })
      .catch(() => {
        if (!cancelado) setAgenda({ estado: 'error' });
      });
    return () => {
      cancelado = true;
    };
  }, []);

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

  const recientes = React.useMemo<Reciente[]>(
    () =>
      [
        ...savedDrafts.map((entrada): Reciente => ({ tipo: 'borrador', fecha: entrada.savedAt, entrada })),
        ...(revisiones ?? []).map((revision): Reciente => ({ tipo: 'revision', fecha: revision.createdAt, revision }))
      ]
        .sort((a, b) => marcaDeTiempo(b.fecha) - marcaDeTiempo(a.fecha))
        .slice(0, MAXIMO_RECIENTES),
    [savedDrafts, revisiones]
  );

  const pendientes = agenda.estado === 'listo' ? agenda.entradas : [];
  const proximos = pendientes.slice(0, MAXIMO_VENCIMIENTOS);
  const hayVencimientos = pendientes.length > 0;
  const estadoDelPlan = describirPlan(plan);

  const botonAgenda = (texto: string) =>
    puede('tools') ? (
      <button type="button" onClick={onAbrirAgenda} className="cn-ini-enlace">
        {texto}
      </button>
    ) : null;

  /* ─── NIVEL 1 · LO QUE VENCE ──────────────────────────────────────────── */
  const loQueVence = (
    <section className="cn-ini-vence" aria-labelledby="inicio-lo-que-vence">
      <div className="cn-ini-vence-cabeza">
        <span className="cn-ini-punto" aria-hidden="true" />
        <h2 id="inicio-lo-que-vence" className="cn-ini-h2-vence">
          Lo que vence
        </h2>
        <span className="cn-ini-cuenta">
          {pendientes.length} {pendientes.length === 1 ? 'término pendiente' : 'términos pendientes'}
        </span>
      </div>
      <ul className="cn-ini-vence-lista">
        {proximos.map((e) => {
          const dias = diasHastaVencer(e.fechaLimite, ahora);
          const puedeRedactar = Boolean(e.actuacionId) && puede('workspace');
          const puedeVerCaso = Boolean(e.expedienteId) && puede('expedientes');
          return (
            <li key={e.id} className={`cn-ini-termino${e.terminoVerificado ? '' : ' cn-ini-termino--sin'}`}>
              <div className="cn-ini-termino-textos">
                <p className="cn-ini-termino-titulo">
                  {e.actuacionNombre}
                  {e.asunto ? ` · ${e.asunto}` : ''}
                </p>
                <p className="cn-ini-termino-plazo">
                  <strong>{textoDelPlazo(dias)}</strong> · <span className="cn-ini-mono">{fechaCorta(e.fechaLimite)}</span>
                  {e.radicado && (
                    <>
                      {' · '}
                      <span className="cn-ini-mono">{e.radicado}</span>
                    </>
                  )}
                  {e.cliente ? ` · ${e.cliente}` : ''}
                </p>
                {!e.terminoVerificado && <p className="cn-ini-sin-verificar">Término sin verificar</p>}
              </div>
              {(puedeRedactar || puedeVerCaso || puede('tools')) && (
                <div className="cn-ini-termino-acciones">
                  {puedeRedactar && (
                    <button
                      type="button"
                      onClick={() => onRedactarActuacion(e.actuacionNombre, e.rama ?? '', datosDeLaEntrada(e))}
                      className="cn-ini-boton cn-ini-boton--primario"
                    >
                      Empezar el borrador
                    </button>
                  )}
                  {/*
                    NO HAY FORMA DE ABRIR UN EXPEDIENTE CONCRETO DESDE FUERA:
                    `ExpedientesView` no recibe props ni lee una pantalla
                    recordada, y su detalle vive en estado local. Por eso el
                    botón no promete «el caso»: abre Expedientes, donde está.
                  */}
                  {puedeVerCaso && (
                    <button
                      type="button"
                      onClick={() => onIr('expedientes')}
                      className="cn-ini-boton cn-ini-boton--blanco"
                    >
                      Ver en Expedientes
                    </button>
                  )}
                  {!puedeRedactar && !puedeVerCaso && (
                    <button type="button" onClick={onAbrirAgenda} className="cn-ini-boton cn-ini-boton--blanco">
                      Ver en la agenda
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div className="cn-ini-vence-pie">{botonAgenda('Ver la agenda completa')}</div>
    </section>
  );

  const agendaCargando = (
    <p className="cn-ini-calma" role="status">
      Leyendo la agenda de términos…
    </p>
  );

  const agendaFallida = (
    <div className="cn-ini-fallo" role="alert">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <p>
        No se pudieron leer los vencimientos de la agenda. Esto no significa que no haya términos
        pendientes. {botonAgenda('Abrir la agenda para comprobarlo')}
      </p>
    </div>
  );

  const agendaVacia = (
    <p className="cn-ini-calma">
      No hay términos pendientes en la agenda de la firma. {botonAgenda('Abrir la agenda')}
    </p>
  );

  /* ─── NIVEL 2 · CONTINUAR DONDE IBA ───────────────────────────────────── */
  const continuar = (
    <section className="cn-ini-seccion" aria-labelledby="inicio-continuar">
      <h2 id="inicio-continuar" className="cn-ini-h2">
        Continuar donde iba
      </h2>
      <p className="cn-ini-bajada">Sus borradores y revisiones recientes.</p>

      {recientes.length > 0 && (
        <ul className="cn-ini-recientes">
          {recientes.map((r) =>
            r.tipo === 'borrador' ? (
              <li key={`b-${r.entrada.id || r.entrada.savedAt}`}>
                <button type="button" onClick={() => onAbrirBorrador(r.entrada)} className="cn-ini-reciente">
                  <span className="cn-ini-reciente-textos">
                    <span className="cn-ini-reciente-titulo">
                      {r.entrada.draft.title || r.entrada.draft.documentType}
                    </span>
                    <span className="cn-ini-reciente-detalle">
                      {['Borrador', r.entrada.cliente, haceCuanto(r.entrada.savedAt, ahora)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="cn-ini-reciente-accion">Seguir</span>
                </button>
              </li>
            ) : (
              <li key={`r-${r.revision.id}`}>
                <button type="button" onClick={() => onAbrirRevision(r.revision.id)} className="cn-ini-reciente">
                  <span className="cn-ini-reciente-textos">
                    <span className="cn-ini-reciente-titulo">{r.revision.fileName || r.revision.documentType}</span>
                    <span className="cn-ini-reciente-detalle">
                      {['Revisión', r.revision.cliente, haceCuanto(r.revision.createdAt, ahora)].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="cn-ini-reciente-accion">Ver</span>
                </button>
              </li>
            )
          )}
        </ul>
      )}

      {recientes.length === 0 && (revisiones !== null || revisionesFallaron) && (
        <p className="cn-ini-calma">
          {revisionesFallaron ? 'Aún no tiene borradores.' : 'Aún no tiene borradores ni revisiones.'}{' '}
          {puede('workspace') && (
            <button type="button" onClick={() => onIr('workspace')} className="cn-ini-enlace">
              Redacte el primero desde aquí.
            </button>
          )}
          {!revisionesFallaron &&
            ' Las revisiones se piden desde «Revisiones», con «Revisar un documento»: un escrito suyo o uno que le llegó.'}
        </p>
      )}
      {revisionesFallaron && (
        <p className="cn-ini-nota">No se pudieron leer sus revisiones. Ábralas desde «Revisiones».</p>
      )}
      {!revisionesFallaron && revisiones === null && (
        <p className="cn-ini-nota" role="status">
          Leyendo sus revisiones…
        </p>
      )}
    </section>
  );

  /* ─── PLAN Y SALDO ────────────────────────────────────────────────────── */
  const planYSaldo = (
    <div className="cn-ini-fichas">
      <div className="cn-ini-ficha">
        <p className="cn-ini-ficha-rotulo">Su plan</p>
        <p className="cn-ini-ficha-valor">{estadoDelPlan.nombre}</p>
        <p className="cn-ini-ficha-nota">
          {estadoDelPlan.estado}
          {plan?.maxUsers ? ` · hasta ${plan.maxUsers} ${plan.maxUsers === 1 ? 'usuario' : 'usuarios'}` : ''}
        </p>
        <button type="button" onClick={abrirPlan} className="cn-ini-enlace">
          Ver plan
        </button>
      </div>
      <div className="cn-ini-ficha">
        <p className="cn-ini-ficha-rotulo">Saldo · COP disponibles</p>
        <p className="cn-ini-ficha-valor cn-ini-mono">${saldoCop.toLocaleString('es-CO')}</p>
        {escritosRestantes !== null && (
          <p className="cn-ini-ficha-nota">
            {escritosRestantes <= 0
              ? 'No alcanza para otro escrito'
              : escritosRestantes === 1
                ? 'Alcanza para un escrito'
                : `Alcanza para unos ${escritosRestantes.toLocaleString('es-CO')} escritos`}
          </p>
        )}
        <button type="button" onClick={onRecargar} className="cn-ini-enlace">
          <Wallet className="h-4 w-4" aria-hidden="true" />
          Recargar saldo
        </button>
      </div>
    </div>
  );

  return (
    <div
      data-visita="vista-inicio"
      className="cara-nueva cn-ini flex h-full min-h-0 flex-1 flex-col overflow-y-auto"
    >
      <div className="cn-ini-cuerpo">
        {/* ─── SALUDO Y ACCIONES PRINCIPALES ─────────────────────────────── */}
        <header className="cn-ini-cabeza">
          <div>
            <h1 className="cn-ini-h1">
              {saludoSegunHora(ahora)}, {nombreParaSaludar(correo, currentUserName)}
            </h1>
            <p className="cn-ini-firma">
              {firma ? `${firma} · ` : ''}
              {fechaLarga(ahora)}
            </p>
          </div>
          {(puede('workspace') || puede('taller')) && (
            <div className="cn-ini-acciones">
              {puede('workspace') && (
                <button
                  type="button"
                  onClick={() => onIr('workspace')}
                  className="cn-ini-boton cn-ini-boton--primario cn-ini-boton--principal"
                >
                  Redactar<span className="cn-ini-solo-movil"> un escrito</span>
                </button>
              )}
              {/* La misma entrada de hoy: Revisiones, donde está «Revisar un documento». */}
              {puede('taller') && (
                <button type="button" onClick={() => onIr('taller')} className="cn-ini-boton cn-ini-boton--suave">
                  Revisar un escrito
                </button>
              )}
            </div>
          )}
        </header>

        {/* ─── INVITACIÓN A LA VISITA, solo la primera vez en este navegador ── */}
        {visita.invitacionPendiente && (
          <div className="cn-ini-visita">
            <Route className="h-5 w-5" aria-hidden="true" />
            {/*
              LA DURACIÓN SE CALCULA. Decía «de dos minutos», escrito a mano; la
              visita mide lo que se lee en ella (`visitaGuiada/capitulos.ts`).
            */}
            <p>
              ¿Quiere una visita guiada? Recorre cada módulo y dice para qué sirve, en{' '}
              {duracionDeLaVisita}.
            </p>
            <div className="cn-ini-visita-botones">
              <button type="button" onClick={visita.declinarInvitacion} className="cn-ini-boton cn-ini-boton--texto">
                Ahora no
              </button>
              <button type="button" onClick={visita.iniciar} className="cn-ini-boton cn-ini-boton--primario">
                Empezar
              </button>
            </div>
          </div>
        )}

        <div className="cn-ini-niveles">
          {agenda.estado === 'cargando' && agendaCargando}
          {agenda.estado === 'error' && agendaFallida}
          {hayVencimientos && loQueVence}

          {continuar}

          {/* Sin nada pendiente, el nivel 1 se reduce a una línea y cede el primer lugar. */}
          {agenda.estado === 'listo' && !hayVencimientos && agendaVacia}

          {planYSaldo}

          {/* ─── NIVEL 3 · POR DÓNDE EMPIEZO ─────────────────────────────────
            Las puertas van en `inicio/puertas.ts`: son datos, no JSX, para que
            un guarda pueda comprobar que todas apuntan a un módulo real y que
            ninguna se repite. */}
          <section className="cn-ini-seccion cn-ini-seccion--puertas" aria-labelledby="inicio-por-donde">
            <h2 id="inicio-por-donde" className="cn-ini-h2">
              Por dónde empiezo
            </h2>
            <p className="cn-ini-bajada">Si no tiene nada urgente, entre por lo que tiene delante.</p>
            <div className="cn-ini-puertas">
              {PUERTAS_DE_INICIO.map((p) => {
                const cerrada = ocultas.includes(p.destino);
                const Icono = p.icono;
                return (
                  <button
                    key={p.destino}
                    type="button"
                    aria-disabled={cerrada || undefined}
                    onClick={
                      cerrada
                        ? undefined
                        : () => {
                            /*
                             * La puerta del documento recibido deja anotado el modo
                             * antes de navegar, para que Revisiones abra el dialogo
                             * correcto en vez de su lista. Sin texto: el abogado
                             * todavia no ha subido nada.
                             */
                            if (p.abreDocumentoRecibido) dejarDocumentoParaLeer({ texto: '', nombre: '' });
                            onIr(p.destino);
                          }
                    }
                    className={`cn-ini-puerta${cerrada ? ' cn-ini-puerta--cerrada' : ''}`}
                  >
                    <span className="cn-ini-puerta-cabeza">
                      <Icono className="cn-ini-puerta-icono" aria-hidden="true" />
                      <span className="cn-ini-puerta-titulo">{p.titulo}</span>
                    </span>
                    <span className="cn-ini-puerta-texto">{p.queHace}</span>
                    {cerrada && <span className="cn-ini-chip">{motivoDePuertaCerrada(p.destino)}</span>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ─── NOVEDADES Y PRIMERA VEZ: una fila callada al pie ──────────── */}
          <div className="cn-ini-pie">
            <section className="cn-ini-pie-bloque" aria-labelledby="inicio-novedades">
              <div className="cn-ini-pie-cabeza">
                <h2 id="inicio-novedades" className="cn-ini-h3">
                  Novedades
                </h2>
                <button type="button" onClick={() => onVerNovedades()} className="cn-ini-enlace">
                  Ver todas
                </button>
              </div>
              {/*
                LAS MISMAS QUE NOVEDADES LLAMA «LE AFECTA». Con el plan leído, las
                más recientes que tocan un módulo de su plan; sin plan, las más
                recientes, sin afirmar nada sobre él. Lo de operación solo para el
                superusuario. Cada una abre su detalle, y el punto azul es el
                mismo «Nuevo» de la lista (`novedades.logica.ts`).
              */}
              <ul className="cn-ini-novedades">
                {paraInicio(visiblesParaRol(NOVEDADES, esOperador), plan?.modulosPermitidos ?? null, MAXIMO_NOVEDADES).map(
                  (n) => (
                    <li key={n.id}>
                      <button type="button" className="cn-nov-inicio-fila" onClick={() => onVerNovedades(n.id)}>
                        <span className="cn-ini-mono cn-ini-novedad-fecha">{fechaCorta(n.fecha)}</span>
                        <span className="cn-nov-inicio-titulo">{n.titulo}</span>
                        {esNueva(n.fecha, vistasHasta(), fechaMasReciente(NOVEDADES)) && (
                          <span className="cn-nov-inicio-nuevo">
                            <span className="cn-nov-inicio-punto" aria-hidden="true" />
                            Nuevo
                          </span>
                        )}
                      </button>
                    </li>
                  )
                )}
              </ul>
            </section>

            <section className="cn-ini-pie-bloque" aria-labelledby="inicio-primera-vez">
              <h2 id="inicio-primera-vez" className="cn-ini-h3">
                ¿Primera vez aquí?
              </h2>
              <p className="cn-ini-pie-texto">
                La visita guiada recorre cada módulo, en {duracionDeLaVisita}, y dice para qué sirve.
                El manual explica cada tarea paso a paso.
              </p>
              <div className="cn-ini-pie-botones">
                <button type="button" onClick={visita.iniciar} className="cn-ini-boton cn-ini-boton--suave">
                  <Route className="h-4 w-4" aria-hidden="true" />
                  Iniciar la visita guiada
                </button>
                <button type="button" onClick={() => onIr('manual')} className="cn-ini-enlace">
                  <BookMarked className="h-4 w-4" aria-hidden="true" />
                  Abrir el manual
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

/** «vence hoy», «vence en 1 día», «vence en 12 días». */
const venceEn = (dias: number): string =>
  dias <= 0 ? 'vence hoy' : `vence en ${dias} ${dias === 1 ? 'día' : 'días'}`;

/**
 * The plan in words. Every figure is the server's: the state, the days, the
 * period. `null` plan means the server did not answer, and that is said
 * rather than guessed.
 *
 * DICE «VENCE» Y NUNCA «SE RENUEVA»: no hay cobro automático. Un plan que se
 * anuncia como renovable deja a la firma esperando una renovación que nadie
 * va a hacer, y el día siguiente la aplicación se le cierra.
 */
const describirPlan = (plan: ReturnType<typeof usePlan>['plan']): { nombre: string; estado: string } => {
  if (!plan) return { nombre: 'Sin información', estado: 'El servidor no informó el plan.' };

  const nombre = plan.plan ? NOMBRE_DE_PLAN[plan.plan] : 'Cortesía';
  const periodo = plan.period ? ETIQUETA_DE_PERIODO[plan.period] : null;
  const dias = plan.diasRestantes;
  const diasTexto = dias === null ? '' : `${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;

  switch (plan.estado) {
    case 'ACTIVO':
      return {
        nombre: periodo ? `${nombre} · ${periodo}` : nombre,
        estado: dias !== null ? `Activo · ${venceEn(dias)}` : 'Activo'
      };
    case 'POR_VENCER':
      return {
        nombre: periodo ? `${nombre} · ${periodo}` : nombre,
        estado: dias !== null ? `Por vencer · ${venceEn(dias)}` : 'Por vencer'
      };
    case 'VENCIDO':
      return { nombre, estado: dias !== null ? `Vencido hace ${diasTexto}` : 'Vencido' };
    case 'PRUEBA':
      return {
        nombre: `${nombre} · Prueba`,
        estado: dias !== null ? `Quedan ${diasTexto} de prueba` : 'Prueba'
      };
    case 'CORTESIA':
      return { nombre: 'Cortesía', estado: 'Sin vencimiento' };
  }
};
