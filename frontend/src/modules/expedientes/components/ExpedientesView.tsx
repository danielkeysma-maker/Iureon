import React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  FolderOpen,
  Loader2,
  Plus,
  Trash2,
  Users
} from 'lucide-react';
import { expedientesApi } from '../services/expedientes.api';
import {
  ESTADOS,
  NOMBRE_DE_ESTADO,
  type Expediente,
  type ExpedienteConDetalle
} from '../types';
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
 * ─── POR QUÉ ESTA PANTALLA EXISTE ──────────────────────────────────────────
 *
 * Hasta hoy la plataforma tenía tres formas de decir «este caso» y ninguna
 * sabía de las otras: una llave real en las entrevistas, un `cliente` de texto
 * libre en revisiones, borradores y agenda, y un `radicado` de texto libre. El
 * mismo asunto podía ser «Mosquera» en un borrador y «Mosquera vs. ACME» en la
 * agenda. El motor recibía cada petición huérfana.
 *
 * ─── DOS NIVELES Y NO TRES ─────────────────────────────────────────────────
 *
 * Lista y detalle, y el detalle vive en la misma pantalla en vez de en una
 * ruta propia. El abogado entra a un asunto, hace lo suyo y vuelve: una ruta
 * intermedia añadiría un botón «atrás» del navegador que no coincide con el
 * «atrás» de la aplicación, que es de las cosas que más se sienten y menos se
 * reportan.
 */
export const ExpedientesView: React.FC = () => {
  const [expedientes, setExpedientes] = React.useState<Expediente[]>([]);
  const [abierto, setAbierto] = React.useState<ExpedienteConDetalle | null>(null);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');
  const [creando, setCreando] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [nuevo, setNuevo] = React.useState({ caratula: '', radicado: '', despacho: '', contraparte: '' });
  /*
   * Una señal, no un objeto: las carpetas y los documentos los carga el panel
   * de carpetas por su cuenta, y lo único que necesita de aquí es enterarse de
   * que algo cambió. Pasarle los datos desde este componente lo obligaría a
   * mantener dos copias del mismo listado y a decidir cuál manda.
   */
  const [senalDeRecarga, setSenalDeRecarga] = React.useState(0);

  const cargar = React.useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      setExpedientes(await expedientesApi.listar());
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
    try {
      setAbierto(await expedientesApi.obtener(id));
    } catch (err) {
      setError((err as Error).message);
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

  const crear = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
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
      setNuevo({ caratula: '', radicado: '', despacho: '', contraparte: '' });
      setCreando(false);
      await cargar();
      await abrir(creado.id);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (): Promise<void> => {
    if (!abierto) return;
    setError('');
    try {
      const mensaje = await expedientesApi.borrar(abierto.id);
      setAbierto(null);
      await cargar();
      /*
       * El mensaje del servidor se muestra tal cual: dice que lo que estaba
       * atado sigue en su sitio. Un borrado silencioso se lee como si se
       * hubiera llevado las revisiones pagadas que había dentro.
       */
      setError(mensaje);
    } catch (err) {
      setError((err as Error).message);
    }
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

  // ─── DETALLE ──────────────────────────────────────────────────────────────

  if (abierto) {
    const p = abierto.piezas;
    const atadas = p.entrevistas + p.audiencias + p.revisiones + p.borradores + p.terminos + p.orientaciones;

    return (
      <div className="mx-auto w-full max-w-4xl space-y-4 px-3 py-4 sm:px-4">
        <button type="button" onClick={() => setAbierto(null)} className="btn-ghost btn-sm gap-1.5">
          <ArrowLeft className="h-3.5 w-3.5" />
          Todos los expedientes
        </button>

        <header className="card p-4">
          <h1 className="text-h2 [overflow-wrap:anywhere]">{abierto.caratula}</h1>
          <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-meta text-ink-500 sm:grid-cols-2">
            {abierto.radicado && (
              <div className="[overflow-wrap:anywhere]">
                <dt className="inline font-medium">Radicado: </dt>
                <dd className="inline">{abierto.radicado}</dd>
              </div>
            )}
            {abierto.despacho && (
              <div className="[overflow-wrap:anywhere]">
                <dt className="inline font-medium">Despacho: </dt>
                <dd className="inline">{abierto.despacho}</dd>
              </div>
            )}
            {abierto.clienteNombre && (
              <div className="[overflow-wrap:anywhere]">
                <dt className="inline font-medium">Cliente: </dt>
                <dd className="inline">{abierto.clienteNombre}</dd>
              </div>
            )}
            {abierto.contraparte && (
              <div className="[overflow-wrap:anywhere]">
                <dt className="inline font-medium">Contraparte: </dt>
                <dd className="inline">{abierto.contraparte}</dd>
              </div>
            )}
          </dl>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="field-label" htmlFor="estado-exp">
              Estado
            </label>
            <select
              id="estado-exp"
              className="field w-auto"
              value={abierto.estado}
              onChange={(e) => void cambiarEstado(e.target.value)}
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {NOMBRE_DE_ESTADO[e]}
                </option>
              ))}
            </select>
          </div>

          {/*
            LO QUE HAY ATADO, EN CUENTAS. El servidor manda números y no
            contenido: la pantalla necesita saber que existen tres entrevistas
            para poder ofrecerlas, y traerlas enteras haría de esta pantalla la
            más pesada del producto para pintar unos totales.
          */}
          <p className="mt-3 text-meta text-ink-500">
            {atadas === 0
              ? 'Todavía no hay nada atado a este expediente. Use «Traer al expediente» aquí abajo para jalar lo que ya tiene.'
              : `Atado: ${[
                  p.entrevistas && `${p.entrevistas} entrevista(s)`,
                  p.audiencias && `${p.audiencias} audiencia(s)`,
                  p.revisiones && `${p.revisiones} revisión(es)`,
                  p.borradores && `${p.borradores} borrador(es)`,
                  p.terminos && `${p.terminos} término(s)`,
                  p.orientaciones && `${p.orientaciones} orientación(es)`
                ]
                  .filter(Boolean)
                  .join(' · ')}`}
          </p>
        </header>

        {error && (
          <p className="flex items-start gap-2 rounded-card border border-line-200 bg-canvas p-3 text-meta text-ink-600">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="[overflow-wrap:anywhere]">{error}</span>
          </p>
        )}

        <ClienteDelExpediente expediente={abierto} onCambio={refrescarAbierto} />

        <IndexarEnExpediente expediente={abierto} onIndexado={refrescarAbierto} />

        <CarpetasDelExpediente expediente={abierto} recargarSenal={senalDeRecarga} />

        <BuscarEnExpediente expediente={abierto} />

        <TraerAlExpediente expediente={abierto} onCambio={refrescarAbierto} />

        <ActoresDelExpediente expediente={abierto} onCambio={refrescarAbierto} />

        <PreguntasDelExpedientePanel expediente={abierto} />

        <div className="pt-2">
          <button type="button" onClick={() => void borrar()} className="btn-ghost btn-sm gap-1.5 text-ink-500">
            <Trash2 className="h-3.5 w-3.5" />
            Borrar este expediente
          </button>
          <p className="mt-1 text-meta text-ink-500">
            Se borra la carpeta y las personas que registró en ella. Lo demás —entrevistas, revisiones,
            borradores y términos— sigue en su sitio, sin expediente.
          </p>
        </div>
      </div>
    );
  }

  // ─── LISTA ────────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 px-3 py-4 sm:px-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-h2">Expedientes</h1>
          <p className="text-meta text-ink-500">
            Un asunto por carpeta. Lo que ya tiene —entrevistas, revisiones, borradores, términos— se ata
            aquí, y desde aquí prepara el interrogatorio sabiendo a quién se le pregunta.
          </p>
        </div>
        <button type="button" onClick={() => setCreando((v) => !v)} className="btn-primary btn-sm gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Nuevo expediente
        </button>
      </header>

      {creando && (
        <form onSubmit={crear} className="card space-y-3 p-4">
          <div>
            <label className="field-label" htmlFor="caratula">
              Nombre del asunto
            </label>
            <input
              id="caratula"
              className="field"
              value={nuevo.caratula}
              onChange={(e) => setNuevo({ ...nuevo, caratula: e.target.value })}
              placeholder="Mosquera vs. ACME — restitución de inmueble"
              autoFocus
            />
            {/*
              Lo único obligatorio, y el radicado NO sirve de nombre: la mayoría
              de los asuntos nacen antes de tenerlo, que es justo cuando más
              falta hace el expediente.
            */}
            <p className="mt-1 text-meta text-ink-500">
              Con lo que usted lo busca después. El radicado puede venir más tarde.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="radicado">
                Radicado <span className="font-normal text-ink-500">(opcional)</span>
              </label>
              <input
                id="radicado"
                className="field"
                value={nuevo.radicado}
                onChange={(e) => setNuevo({ ...nuevo, radicado: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="despacho">
                Despacho <span className="font-normal text-ink-500">(opcional)</span>
              </label>
              <input
                id="despacho"
                className="field"
                value={nuevo.despacho}
                onChange={(e) => setNuevo({ ...nuevo, despacho: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="contraparte">
              Contraparte <span className="font-normal text-ink-500">(opcional)</span>
            </label>
            <input
              id="contraparte"
              className="field"
              value={nuevo.contraparte}
              onChange={(e) => setNuevo({ ...nuevo, contraparte: e.target.value })}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary btn-sm" disabled={guardando || !nuevo.caratula.trim()}>
              {guardando ? 'Creando…' : 'Crear expediente'}
            </button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setCreando(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && !abierto && (
        <p className="flex items-start gap-2 rounded-card border border-line-200 bg-canvas p-3 text-meta text-ink-600">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="[overflow-wrap:anywhere]">{error}</span>
        </p>
      )}

      {cargando ? (
        <p className="flex items-center gap-2 text-meta text-ink-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Cargando expedientes…
        </p>
      ) : expedientes.length === 0 ? (
        <div className="card p-6 text-center">
          <FolderOpen className="mx-auto h-6 w-6 text-ink-500" />
          <p className="mt-2 text-body">Todavía no hay expedientes.</p>
          <p className="mt-1 text-meta text-ink-500">
            Cree uno con el nombre con el que usted llama al asunto. No hace falta el radicado.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {expedientes.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => void abrir(e.id)}
                className="card w-full p-3 text-left transition-colors hover:bg-canvas"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-body font-medium [overflow-wrap:anywhere]">{e.caratula}</span>
                  {e.estado !== 'ACTIVO' && <span className="chip-neutral">{NOMBRE_DE_ESTADO[e.estado]}</span>}
                </div>
                <p className="mt-1 flex flex-wrap gap-x-3 text-meta text-ink-500">
                  {e.radicado && <span className="[overflow-wrap:anywhere]">{e.radicado}</span>}
                  {e.clienteNombre && <span className="[overflow-wrap:anywhere]">{e.clienteNombre}</span>}
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {e.actores ?? 0}
                  </span>
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
