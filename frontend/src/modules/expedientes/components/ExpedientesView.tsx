import React from 'react';
import { AlertCircle, ChevronLeft, EllipsisVertical, Loader2, Plus, Search } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { expedientesApi, type Carpeta, type DocumentoIndexado } from '../services/expedientes.api';
import {
  ESTADOS,
  NOMBRE_DE_ESTADO,
  type ExpedienteConDetalle,
  type ExpedienteEnLista,
  type MisCasos
} from '../types';
import {
  avisoDelTermino,
  cuentaDePestana,
  esUrgente,
  lineaDeEstaSemana,
  resumenDeCarpeta
} from '../services/casoEnPantalla';
import { ListaDeLaSemana, ListaPorCliente } from './CasosEnLaLista';
import { ActoresDelExpediente } from './ActoresDelExpediente';
import { PreguntasDelExpedientePanel } from './PreguntasDelExpedientePanel';
import { TraerAlExpediente } from './TraerAlExpediente';
import { IndexarEnExpediente } from './IndexarEnExpediente';
import { ClienteDelExpediente } from './ClienteDelExpediente';
import { BuscarEnExpediente } from './BuscarEnExpediente';
import { CarpetasDelExpediente } from './CarpetasDelExpediente';

/**
 * LOS EXPEDIENTES DE LA FIRMA.
 *
 * Maqueta: `public/handoff/app-expedientes.html` — «Mis casos» (:65), el caso
 * en tres zonas (:171) y las dos pantallas de 375 px (:484, :546); el diálogo
 * «Nuevo caso» y los vacíos salen de `app-dialogos-y-estados.html` (:65, :281).
 *
 * ─── POR QUÉ ESTA PANTALLA EXISTE ──────────────────────────────────────────
 *
 * Hasta hoy la plataforma tenía tres formas de decir «este caso» y ninguna
 * sabía de las otras: una llave real en las entrevistas, un `cliente` de texto
 * libre en revisiones, borradores y agenda, y un `radicado` de texto libre. El
 * mismo asunto podía llamarse de dos maneras en dos módulos, y el motor recibía
 * cada petición huérfana.
 *
 * ─── DOS NIVELES Y NO TRES ─────────────────────────────────────────────────
 *
 * Lista y detalle, y el detalle vive en la misma pantalla en vez de en una
 * ruta propia. El abogado entra a un asunto, hace lo suyo y vuelve: una ruta
 * intermedia añadiría un botón «atrás» del navegador que no coincide con el
 * «atrás» de la aplicación, que es de las cosas que más se sienten y menos se
 * reportan.
 *
 * ─── EL NOMBRE DEL MÓDULO SIGUE SIENDO «EXPEDIENTES» ───────────────────────
 *
 * La maqueta titula «Mis casos». La barra, la visita guiada y el manual llaman
 * al módulo «Expedientes», y un título distinto al del botón que se pulsó hace
 * dudar de haber llegado. Se adopta la ESTRUCTURA —pestañas, tarjetas, el caso
 * en tres zonas— con el nombre que ya conoce el abogado.
 *
 * ─── LO QUE LA MAQUETA DIBUJA Y AQUÍ NO ESTÁ, CON LA RAZÓN ─────────────────
 *
 *  · «Qué ha pasado» (la línea de tiempo con la que abre el caso): no existe
 *    un registro de actividad por caso. Inventarla con fechas de creación
 *    diría «se revisó un escrito» sin saberlo. El caso abre por «Documentos».
 *  · «Iureon puede armarle el primer borrador»: el término de la agenda trae
 *    su actuación como texto libre, no como nombre del catálogo, y pasar ese
 *    texto a Redacción produciría una plantilla genérica con cara de ficha.
 *    La acción real que existe es abrir la agenda.
 *  · «Su cliente» como texto en «Nuevo caso»: el caso se ata a una ficha de
 *    cliente (llave), no a un nombre suelto; se hace dentro del caso.
 */

type Pestana = 'estaSemana' | 'activos' | 'cerrados';
type VistaDelCaso = 'documentos' | 'personas';

const NUEVO_VACIO = { caratula: '', radicado: '', despacho: '', contraparte: '' };

export const ExpedientesView: React.FC<{
  /** Abre la agenda de términos. La conecta `App.tsx`; sin ella el aviso no ofrece botón. */
  onIrAAgenda?: () => void;
}> = ({ onIrAAgenda }) => {
  const [misCasos, setMisCasos] = React.useState<MisCasos | null>(null);
  const [pestana, setPestana] = React.useState<Pestana | null>(null);
  /* La búsqueda sobrevive al cambio de pestaña: se busca un cliente, no una pestaña. */
  const [busqueda, setBusqueda] = React.useState('');
  const [abierto, setAbierto] = React.useState<ExpedienteConDetalle | null>(null);
  const [abriendo, setAbriendo] = React.useState<string | null>(null);
  const [vista, setVista] = React.useState<VistaDelCaso>('documentos');
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');
  const [aviso, setAviso] = React.useState('');
  const [creando, setCreando] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [nuevo, setNuevo] = React.useState(NUEVO_VACIO);
  const [menu, setMenu] = React.useState(false);
  const [trayendo, setTrayendo] = React.useState(false);
  const [agregando, setAgregando] = React.useState(false);
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
  /*
   * Una señal, no un objeto: las carpetas y los documentos los carga el panel
   * de carpetas por su cuenta, y lo único que necesita de aquí es enterarse de
   * que algo cambió.
   */
  const [senalDeRecarga, setSenalDeRecarga] = React.useState(0);
  /*
   * LA CARPETA ABIERTA VIVE AQUÍ Y NO EN EL PANEL, porque la columna derecha
   * también la abre: sus carpetas llevan a esa carpeta. Lo que se cargó sube
   * por `onCargado` para pintar esa lista sin volver a pedirla al servidor.
   */
  const [aqui, setAqui] = React.useState<string | null>(null);
  const [cargado, setCargado] = React.useState<{ carpetas: Carpeta[]; documentos: DocumentoIndexado[] } | null>(
    null
  );

  const cargar = React.useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const r = await expedientesApi.listarMisCasos();
      setMisCasos(r);
      /*
       * SE ABRE POR LO QUE URGE, SI SE SABE. Con la agenda leída y algo esta
       * semana, esa es la pestaña; si no, «Activos». Solo la primera vez: quien
       * ya escogió pestaña no la pierde por una recarga.
       */
      setPestana((p) => p ?? (r.pestanas.estaSemana && r.pestanas.estaSemana.length > 0 ? 'estaSemana' : 'activos'));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrir = async (id: string): Promise<void> => {
    setError('');
    setAviso('');
    setAbriendo(id);
    try {
      const detalle = await expedientesApi.obtener(id);
      setAbierto(detalle);
      setVista('documentos');
      setAqui(null);
      setCargado(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAbriendo(null);
    }
  };

  /*
   * Se relee del servidor en vez de remendar el objeto en memoria. Las cuentas
   * de piezas y la lista de actores las calcula el servidor, y un remiendo
   * local que se olvide de una las dejaría mintiendo hasta la próxima recarga.
   */
  const refrescarAbierto = async (): Promise<void> => {
    if (!abierto) return;
    setSenalDeRecarga((n) => n + 1);
    try {
      setAbierto(await expedientesApi.obtener(abierto.id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const crear = async (e?: React.FormEvent): Promise<void> => {
    e?.preventDefault();
    if (!nuevo.caratula.trim()) return;
    setGuardando(true);
    setError('');
    try {
      const creado = await expedientesApi.crear({
        caratula: nuevo.caratula,
        radicado: nuevo.radicado || undefined,
        despacho: nuevo.despacho || undefined,
        contraparte: nuevo.contraparte || undefined
      });
      setNuevo(NUEVO_VACIO);
      setCreando(false);
      await cargar();
      await abrir(creado.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const pedirBorrarCaso = (): void => {
    if (!abierto) return;
    setMenu(false);
    setConfirmacion({
      titulo: `Borrar «${abierto.caratula}»`,
      texto: (
        <p className="cn-exp-dlg-texto">
          Se borran el caso, sus carpetas, las personas que registró y los documentos indexados en él. Lo
          demás —entrevistas, revisiones, borradores y términos— sigue en su sitio, sin caso. Esto no se
          deshace.
        </p>
      ),
      etiqueta: 'Borrar el caso',
      peligro: true,
      onConfirmar: async () => {
        try {
          const mensaje = await expedientesApi.borrar(abierto.id);
          setAbierto(null);
          await cargar();
          /*
           * El mensaje del servidor se muestra tal cual: dice que lo que estaba
           * atado sigue en su sitio. Un borrado silencioso se lee como si se
           * hubiera llevado las revisiones pagadas que había dentro.
           */
          setAviso(mensaje);
        } catch (err) {
          setError((err as Error).message);
        }
      }
    });
  };

  const cambiarEstado = async (estado: string): Promise<void> => {
    if (!abierto) return;
    try {
      await expedientesApi.actualizar(abierto.id, { estado });
      await refrescarAbierto();
      await cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const errorEnPantalla = error && (
    <p className="cn-error" role="alert">
      <AlertCircle className="h-4 w-4" />
      <span className="min-w-0 [overflow-wrap:anywhere]">{error}</span>
    </p>
  );

  const confirmar = <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />;

  // ─── DETALLE: DÓNDE ESTOY · EN QUÉ TRABAJO · QUÉ ES ESTO ─────────────────

  if (abierto) {
    const p = abierto.piezas;
    const avisoTermino = avisoDelTermino(abierto);
    const personas = abierto.listaDeActores.length;
    /*
     * LAS CUENTAS QUE EXISTEN, Y SOLO ESAS. `documentos` falta en servidores
     * anteriores al campo y es `null` si no se pudo contar: en los dos casos
     * la pestaña va sin número, no con un cero que afirme que no hay nada.
     */
    const cuentaDocumentos =
      typeof abierto.documentos === 'number' ? abierto.documentos : cargado ? cargado.documentos.length : null;
    const carpetasRaiz = cargado ? cargado.carpetas.filter((c) => c.padreId === null) : [];
    const bajadaDelCaso = [abierto.despacho, abierto.contraparte && `contra ${abierto.contraparte}`]
      .filter(Boolean)
      .join(' · ');

    return (
      /*
       * `data-visita` en LAS DOS ramas: si la visita guiada llega con un caso
       * abierto, su parada tiene que seguir encontrando el módulo.
       */
      <div data-visita="vista-expedientes" className="cara-nueva cn-exp cn-exp-caso">
        <div className="cn-exp-caso-trabajo">
          {/* ─── DÓNDE ESTOY ─────────────────────────────────────────────── */}
          <header className="cn-exp-caso-cabeza">
            <button type="button" onClick={() => setAbierto(null)} className="cn-exp-volver">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              Todos los expedientes
            </button>
            {/*
              LA CARÁTULA EN UNA SOLA LÍNEA, DENTRO DE UNA FICHA. Con 34 px y
              dos renglones de título y dos de despacho, la cabecera se comía
              casi media pantalla de escritorio y las carpetas quedaban en una
              franja. Ahora el título y la bajada se cortan con puntos
              suspensivos y el texto completo va en `title`; el nombre accesible
              del encabezado sigue siendo la carátula entera, porque el corte es
              solo visual. El despacho y la contraparte se pintan como el
              servidor los guardó: si vienen en mayúsculas, así se leen.
            */}
            <div className="cn-exp-caso-titulo">
              <div className="min-w-0 flex-1">
                <h1 className="cn-exp-caso-nombre" title={abierto.caratula}>{abierto.caratula}</h1>
                {bajadaDelCaso && (
                  <p className="cn-exp-caso-bajada" title={bajadaDelCaso}>
                    {bajadaDelCaso}
                  </p>
                )}
              </div>
              <div className="cn-exp-caso-controles">
                <label className="sr-only" htmlFor="estado-exp">
                  Estado del caso
                </label>
                <select
                  id="estado-exp"
                  className="cn-exp-select"
                  value={abierto.estado}
                  onChange={(e) => void cambiarEstado(e.target.value)}
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {NOMBRE_DE_ESTADO[e]}
                    </option>
                  ))}
                </select>
                <div className="relative">
                  <button
                    type="button"
                    className="cn-exp-icono"
                    aria-label="Más opciones"
                    aria-expanded={menu}
                    onClick={() => setMenu((v) => !v)}
                  >
                    <EllipsisVertical className="h-5 w-5" aria-hidden="true" />
                  </button>
                  {menu && (
                    <>
                      <button
                        type="button"
                        className="cn-exp-menu-velo"
                        aria-label="Cerrar el menú"
                        onClick={() => setMenu(false)}
                      />
                      <div className="cn-exp-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          className="cn-exp-menu-item"
                          onClick={() => {
                            setMenu(false);
                            setTrayendo(true);
                          }}
                        >
                          Traer algo de otro módulo
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="cn-exp-menu-item"
                          onClick={() => {
                            setMenu(false);
                            setAgregando(true);
                            setVista('documentos');
                          }}
                        >
                          Agregar un documento
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="cn-exp-menu-item cn-exp-menu-item--peligro"
                          onClick={pedirBorrarCaso}
                        >
                          Borrar este caso
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/*
            EL TÉRMINO VA ANTES DE LAS PESTAÑAS, lo primero que se lee al abrir el
            caso. Ya no queda quieto al desplazarse (README-app §2 lo quería
            fijo): una cabecera fija con término se comía media pantalla y el
            dueño pidió el espacio para leer. Solo las pestañas quedan pegadas,
            y la columna derecha sigue contando los términos pendientes.
            Ámbar con peso si vence en tres días o ya
            venció; el borde discontinuo es solo para el término que la agenda
            no tiene verificado, que es la única señal que se lee en gris.
          */}
          {avisoTermino && (
            <section
              className={`cn-exp-termino ${
                avisoTermino.vencido || (abierto.proximoTermino && esUrgente(abierto.proximoTermino))
                  ? 'cn-exp-termino--urgente'
                  : ''
              } ${avisoTermino.verificado ? '' : 'cn-exp-termino--sin-verificar'}`}
              aria-label="Término del caso"
            >
              <div className="min-w-0 flex-1">
                <p className="cn-exp-termino-titulo [overflow-wrap:anywhere]">{avisoTermino.titulo}</p>
                {avisoTermino.detalle && (
                  <p className="cn-exp-termino-detalle [overflow-wrap:anywhere]">{avisoTermino.detalle}</p>
                )}
                <p className="cn-exp-termino-detalle">
                  {avisoTermino.verificado
                    ? 'Según la agenda de términos.'
                    : 'Sin verificar en la agenda: compruebe la fecha antes de confiar en ella.'}
                </p>
              </div>
              {onIrAAgenda && (
                <button type="button" onClick={onIrAAgenda} className="cn-ini-boton cn-ini-boton--primario cn-exp-boton">
                  Abrir la agenda
                </button>
              )}
            </section>
          )}

          {abierto.terminosLeidos === false && (
            <p className="cn-exp-nota">No se pudo leer la agenda de este caso: sus términos no se muestran aquí.</p>
          )}

          {errorEnPantalla}

          {/* ─── EN QUÉ TRABAJO ─────────────────────────────────────────── */}
          <div className="cn-exp-pestanas" role="tablist" aria-label="Partes del caso">
            <button
              type="button"
              role="tab"
              aria-selected={vista === 'documentos'}
              className="cn-exp-pestana"
              onClick={() => setVista('documentos')}
            >
              Documentos
              {cuentaDocumentos !== null && <span className="cn-exp-pestana-cuenta">{cuentaDocumentos}</span>}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={vista === 'personas'}
              className="cn-exp-pestana"
              onClick={() => setVista('personas')}
            >
              Personas
              <span className="cn-exp-pestana-cuenta">{personas}</span>
            </button>
          </div>

          {/*
            LAS DOS PESTAÑAS QUEDAN MONTADAS y la oculta se esconde con
            `hidden`. Desmontar «Documentos» borraría las carpetas que la
            columna derecha está pintando y obligaría a volver a pedirlas.
          */}
          <div className="cn-exp-zona" role="tabpanel" hidden={vista !== 'documentos'}>
            <BuscarEnExpediente expediente={abierto} />
            <CarpetasDelExpediente
              expediente={abierto}
              recargarSenal={senalDeRecarga}
              aqui={aqui}
              onAqui={setAqui}
              onCargado={(carpetas, documentos) => setCargado({ carpetas, documentos })}
              onCambio={refrescarAbierto}
              onAgregar={() => setAgregando(true)}
            />
          </div>

          <div className="cn-exp-zona" role="tabpanel" hidden={vista !== 'personas'}>
            <ClienteDelExpediente expediente={abierto} onCambio={refrescarAbierto} />
            <ActoresDelExpediente expediente={abierto} onCambio={refrescarAbierto} />
            <PreguntasDelExpedientePanel expediente={abierto} />
          </div>
        </div>

        {/* ─── QUÉ ES ESTO ───────────────────────────────────────────────── */}
        <aside className="cn-exp-caso-datos" aria-label="Datos del caso">
          <span className={`cn-exp-chip cn-exp-chip--${abierto.estado.toLowerCase()}`}>
            <span className="cn-exp-chip-punto" aria-hidden="true" />
            Caso {NOMBRE_DE_ESTADO[abierto.estado].toLowerCase()}
          </span>

          <dl className="cn-exp-datos">
            <div>
              <dt>Radicado</dt>
              {/* Mono porque es citable: lo que se pega en un escrito. */}
              <dd className={abierto.radicado ? 'cn-exp-mono' : 'cn-exp-falta'}>
                {abierto.radicado ?? 'Todavía sin radicado'}
              </dd>
            </div>
            {abierto.despacho && (
              <div>
                <dt>Despacho</dt>
                <dd>{abierto.despacho}</dd>
              </div>
            )}
            <div>
              <dt>Su cliente</dt>
              <dd className={abierto.clienteNombre ? '' : 'cn-exp-falta'}>{abierto.clienteNombre ?? 'Sin ficha de cliente'}</dd>
            </div>
            {abierto.contraparte && (
              <div>
                <dt>Contraparte</dt>
                <dd>{abierto.contraparte}</dd>
              </div>
            )}
          </dl>

          <hr className="cn-exp-raya" />

          <h2 className="cn-exp-h3">Lo que hay en el caso</h2>
          {/*
            LO QUE HAY ATADO, EN CUENTAS. El servidor manda números y no
            contenido: la pantalla necesita saber que existen tres entrevistas
            para poder ofrecerlas, y traerlas enteras haría de esta pantalla la
            más pesada del producto para pintar unos totales.
          */}
          <ul className="cn-exp-cuentas">
            {(
              [
                ['Borradores', p.borradores],
                ['Revisiones', p.revisiones],
                ['Entrevistas', p.entrevistas],
                ['Audiencias', p.audiencias],
                ['Términos', p.terminos],
                ['Orientaciones', p.orientaciones]
              ] as const
            ).map(([nombre, n]) => (
              <li key={nombre}>
                <span>{nombre}</span>
                <span
                  className={
                    nombre === 'Términos' && typeof abierto.terminosPendientes === 'number' && abierto.terminosPendientes > 0
                      ? 'cn-exp-cuenta cn-exp-cuenta--pendiente'
                      : 'cn-exp-cuenta'
                  }
                >
                  {n}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="cn-ini-boton cn-ini-boton--blanco cn-exp-boton cn-exp-boton--ancho" onClick={() => setTrayendo(true)}>
            Traer algo de otro módulo
          </button>

          <hr className="cn-exp-raya" />

          <h2 className="cn-exp-h3">Carpetas</h2>
          {cargado === null ? (
            <p className="cn-exp-nota">Cargando…</p>
          ) : carpetasRaiz.length === 0 ? (
            <p className="cn-exp-nota">Todavía no hay carpetas: los documentos están en la raíz.</p>
          ) : (
            <ul className="cn-exp-carpetas-lado">
              {carpetasRaiz.map((c) => {
                const r = resumenDeCarpeta(c.id, cargado.carpetas, cargado.documentos);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="cn-exp-carpeta-lado"
                      onClick={() => {
                        setVista('documentos');
                        setAqui(c.id);
                      }}
                    >
                      <span className="min-w-0 [overflow-wrap:anywhere]">{c.nombre}</span>
                      <span className="cn-exp-cuenta-suave">{r.documentos + r.subcarpetas}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <IndexarEnExpediente
          expediente={abierto}
          abierto={agregando}
          onCerrar={() => setAgregando(false)}
          onIndexado={refrescarAbierto}
        />

        <Dialog
          abierto={trayendo}
          onCerrar={() => setTrayendo(false)}
          tamano="M"
          titulo="Traer al caso"
          subtitulo="Lo que ya tiene en otros módulos. Traerlo aquí lo deja contado en el caso."
        >
          <TraerAlExpediente expediente={abierto} onCambio={refrescarAbierto} enDialogo />
        </Dialog>

        {confirmar}
      </div>
    );
  }

  // ─── LISTA ────────────────────────────────────────────────────────────────

  const porId = new Map((misCasos?.expedientes ?? []).map((e) => [e.id, e]));
  const idsDe = (p: Pestana): string[] | null => (misCasos ? misCasos.pestanas[p] : []);
  const casosDe = (p: Pestana): ExpedienteEnLista[] =>
    (idsDe(p) ?? []).map((id) => porId.get(id)).filter((e): e is ExpedienteEnLista => Boolean(e));
  const pestanaActual: Pestana = pestana ?? 'activos';
  const casos = casosDe(pestanaActual);
  const total = misCasos?.expedientes.length ?? 0;

  const PESTANAS: { id: Pestana; nombre: string }[] = [
    { id: 'estaSemana', nombre: 'Esta semana' },
    { id: 'activos', nombre: 'Activos' },
    { id: 'cerrados', nombre: 'Cerrados' }
  ];

  return (
    /*
     * `data-visita` marca el objetivo de la visita guiada, igual que en los
     * demás módulos. Sin él, la parada de Expedientes caía al objetivo de
     * reserva —el botón de la barra— y señalaba el menú en vez del módulo.
     */
    <div data-visita="vista-expedientes" className="cara-nueva cn-exp cn-exp-lista">
      <header className="cn-exp-cabeza">
        <div className="min-w-0">
          <h1 className="cn-exp-h1">Expedientes</h1>
          <p className="cn-exp-bajada">
            {misCasos ? lineaDeEstaSemana(misCasos.pestanas.estaSemana, misCasos.avisoTerminos) : 'Sus casos, con lo que vence primero.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="cn-ini-boton cn-ini-boton--primario cn-exp-boton cn-exp-nuevo"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo caso
        </button>
      </header>

      <div className="cn-exp-lista-barra">
        <div className="cn-exp-pestanas" role="tablist" aria-label="Casos">
          {PESTANAS.map(({ id, nombre }) => {
            const cuenta = misCasos ? cuentaDePestana(misCasos.pestanas[id]) : null;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={pestanaActual === id}
                className="cn-exp-pestana"
                onClick={() => setPestana(id)}
              >
                {nombre}
                {cuenta !== null && <span className="cn-exp-pestana-cuenta">{cuenta}</span>}
              </button>
            );
          })}
        </div>
        {total > 0 && (
          <div className="cn-exp-filtro cn-exp-lista-filtro">
            <Search className="cn-exp-filtro-icono h-4 w-4" aria-hidden="true" />
            <input
              type="search"
              className="cn-exp-entrada cn-exp-entrada--con-icono"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar cliente o radicado"
              aria-label="Buscar por cliente, nombre del caso, radicado o despacho"
            />
          </div>
        )}
      </div>

      <div className="cn-exp-cuerpo">
        {aviso && <p className="cn-exp-nota cn-exp-nota--caja [overflow-wrap:anywhere]">{aviso}</p>}
        {errorEnPantalla}
        {misCasos?.avisoDocumentos && <p className="cn-exp-nota">{misCasos.avisoDocumentos}</p>}

        {cargando && !misCasos ? (
          <p className="cn-exp-cargando">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando sus casos…
          </p>
        ) : !misCasos ? (
          <button type="button" className="cn-ini-boton cn-ini-boton--suave cn-exp-boton" onClick={() => void cargar()}>
            Volver a intentarlo
          </button>
        ) : total === 0 ? (
          <div className="cn-exp-vacio">
            <p className="cn-exp-vacio-titulo">Todavía no tiene casos</p>
            <p className="cn-exp-vacio-texto">
              Cree uno con el nombre con el que usted llama al asunto. No hace falta el radicado.
            </p>
            <button type="button" className="cn-ini-boton cn-ini-boton--primario cn-exp-boton" onClick={() => setCreando(true)}>
              Crear el primer caso
            </button>
          </div>
        ) : pestanaActual === 'estaSemana' && misCasos.pestanas.estaSemana === null ? (
          /*
           * SIN AGENDA LEÍDA, «ESTA SEMANA» NO SE PINTA VACÍA: se dice que no se
           * pudo leer. Una pestaña vacía afirmaría «nada vence», que es la
           * noticia más cara de dar por error.
           */
          <div className="cn-exp-vacio cn-exp-vacio--aviso" role="status">
            <p className="cn-exp-vacio-titulo">No se pudo leer la agenda</p>
            <p className="cn-exp-vacio-texto">
              {misCasos.avisoTerminos ?? 'Los términos de sus casos no se pudieron leer.'} Mientras tanto, revise
              «Activos».
            </p>
          </div>
        ) : casos.length === 0 ? (
          <div className="cn-exp-vacio">
            <p className="cn-exp-vacio-titulo">
              {pestanaActual === 'estaSemana'
                ? 'Nada vence esta semana'
                : pestanaActual === 'activos'
                  ? 'No hay casos activos'
                  : 'Todavía no hay casos cerrados'}
            </p>
            <p className="cn-exp-vacio-texto">
              {pestanaActual === 'estaSemana'
                ? 'Ningún caso activo tiene un término de la agenda en los próximos días ni uno vencido.'
                : pestanaActual === 'activos'
                  ? 'Todos sus casos están terminados o archivados.'
                  : 'Un caso pasa aquí cuando lo marca como terminado o archivado.'}
            </p>
          </div>
        ) : pestanaActual === 'estaSemana' ? (
          <ListaDeLaSemana
            casos={casos}
            busqueda={busqueda}
            abriendo={abriendo}
            onAbrir={(id) => void abrir(id)}
            onBorrarBusqueda={() => setBusqueda('')}
          />
        ) : (
          /*
           * «ACTIVOS» Y «CERRADOS», POR CLIENTE Y DENTRO POR RAMA: así lo pidió
           * el dueño el 14 de septiembre. La maqueta los dibuja como filas
           * planas; el agrupado es derivado y está explicado en la lista.
           */
          <ListaPorCliente
            casos={casos}
            busqueda={busqueda}
            cerrados={pestanaActual === 'cerrados'}
            abriendo={abriendo}
            onAbrir={(id) => void abrir(id)}
            onBorrarBusqueda={() => setBusqueda('')}
          />
        )}
      </div>

      {/* En el teléfono el primario va abajo, donde está el pulgar (maqueta :541). */}
      <div className="cn-exp-pie-movil">
        <button
          type="button"
          onClick={() => setCreando(true)}
          className="cn-ini-boton cn-ini-boton--primario cn-exp-boton cn-exp-boton--ancho"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo caso
        </button>
      </div>

      <Dialog
        abierto={creando}
        onCerrar={() => setCreando(false)}
        tamano="M"
        titulo="Nuevo caso"
        subtitulo="Con el nombre con el que usted llama al asunto. El radicado puede venir después."
        hayCambiosSinGuardar={Boolean(nuevo.caratula || nuevo.radicado || nuevo.despacho || nuevo.contraparte)}
        onIntentoDeCerrarConCambios={() => undefined}
        pieIzquierda={<span className="cn-exp-dlg-pie">Crear un caso no consume saldo.</span>}
        acciones={
          <>
            <button type="button" className="cn-ini-boton cn-ini-boton--texto cn-exp-boton" onClick={() => setCreando(false)}>
              Cancelar
            </button>
            <button
              type="submit"
              form="form-nuevo-caso"
              className="cn-ini-boton cn-ini-boton--primario cn-exp-boton"
              disabled={guardando || !nuevo.caratula.trim()}
            >
              {guardando ? 'Creando…' : 'Crear el caso'}
            </button>
          </>
        }
      >
        <form id="form-nuevo-caso" onSubmit={(e) => void crear(e)} className="cn-exp-dlg">
          {error && errorEnPantalla}
          <div className="cn-exp-campo">
            <label className="cn-exp-rotulo" htmlFor="caratula">
              Nombre del asunto
            </label>
            <input
              id="caratula"
              className="cn-exp-entrada"
              value={nuevo.caratula}
              onChange={(e) => setNuevo({ ...nuevo, caratula: e.target.value })}
              placeholder="Cliente vs. contraparte — asunto"
              autoFocus
            />
            {/*
              Lo único obligatorio, y el radicado NO sirve de nombre: la mayoría
              de los asuntos nacen antes de tenerlo, que es justo cuando más
              falta hace el expediente.
            */}
            <p className="cn-exp-ayuda">Lo único obligatorio. Con lo que usted lo busca después.</p>
          </div>
          <div className="cn-exp-campos-2">
            <div className="cn-exp-campo">
              <label className="cn-exp-rotulo" htmlFor="radicado">
                Radicado <span className="cn-exp-opcional">(opcional)</span>
              </label>
              <input
                id="radicado"
                className="cn-exp-entrada cn-exp-mono"
                value={nuevo.radicado}
                onChange={(e) => setNuevo({ ...nuevo, radicado: e.target.value })}
                placeholder="00000-00-00-000-0000-00000-00"
              />
            </div>
            <div className="cn-exp-campo">
              <label className="cn-exp-rotulo" htmlFor="despacho">
                Despacho <span className="cn-exp-opcional">(opcional)</span>
              </label>
              <input
                id="despacho"
                className="cn-exp-entrada"
                value={nuevo.despacho}
                onChange={(e) => setNuevo({ ...nuevo, despacho: e.target.value })}
                placeholder="Juzgado 00 Civil Municipal"
              />
            </div>
          </div>
          <div className="cn-exp-campo">
            <label className="cn-exp-rotulo" htmlFor="contraparte">
              Contraparte <span className="cn-exp-opcional">(opcional)</span>
            </label>
            <input
              id="contraparte"
              className="cn-exp-entrada"
              value={nuevo.contraparte}
              onChange={(e) => setNuevo({ ...nuevo, contraparte: e.target.value })}
            />
          </div>
        </form>
      </Dialog>

      {confirmar}
    </div>
  );
};
