import React, { useMemo, useState } from 'react';
import { MoreHorizontal, Plus, RefreshCw, Search } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { textoDe, transcriptionApi, type StoredTranscription } from '../../transcription/services/transcription.api';
import { CerrarEntrevistaDialog } from './CerrarEntrevistaDialog';
import { decisionEnPalabras, duracionEnPalabras } from '../entrevistaEnPantalla';

/**
 * La lista de entrevistas. Se ordena por la DECISIÓN PENDIENTE, no por fecha.
 *
 * Cada entrevista termina en una decisión: se toma el caso o se declina. Una
 * sin decidir es un cliente sin respuesta, y por eso las que esperan van
 * arriba con los días que llevan esperando — nueve días sin respuesta no
 * aparecen en ninguna lista ordenada por fecha, y son los que cuestan
 * clientes.
 *
 * DECLINAR TAMBIÉN SE REGISTRA, con su motivo. La firma necesita saber qué
 * está rechazando y por qué, y el consultante merece una respuesta. El
 * servidor rechaza un declinado sin motivo; la base también. El diálogo es el
 * mismo del detalle (`CerrarEntrevistaDialog` en modo «declinar»), con la
 * misma lista de motivos.
 *
 * LAS CUATRO CIFRAS DE ARRIBA son de gestión, no decoración: dicen si el
 * embudo de clientes está atascado. Todas salen de las filas — nada se estima.
 *
 * LA CARA NUEVA toma las filas de la lista de audiencias de la misma maqueta
 * (`app-audiencias-entrevistas.html:449`): título de 17 px, una línea de datos
 * debajo y el estado a la derecha, sin tarjeta ni contorno.
 */

interface EntrevistasListProps {
  items: StoredTranscription[];
  isLoading: boolean;
  onOpen: (item: StoredTranscription) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  /** El vacío invita a la primera entrevista con un botón que la empieza de verdad. */
  onNueva?: () => void;
}

const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

const diasDesde = (iso: string): number =>
  Math.floor((Date.now() - new Date(iso).getTime()) / (24 * 60 * 60 * 1000));

export const nombreLegible = (title: string): string => title.replace(/^\d{10,}_/, '');
const quien = (email?: string | null): string => (email ? email.split('@')[0] : '');

export const EntrevistasList: React.FC<EntrevistasListProps> = ({
  items,
  isLoading,
  onOpen,
  onDelete,
  onRefresh,
  onNueva
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [porEliminar, setPorEliminar] = useState<StoredTranscription | null>(null);
  const [porDeclinar, setPorDeclinar] = useState<StoredTranscription | null>(null);
  const [errorDecision, setErrorDecision] = useState('');

  /*
   * La decisión se escribe y la lista se relee. Si falla, onRefresh la
   * devuelve a la verdad — nunca se queda una decisión pintada que el
   * servidor no tiene.
   */
  const decidir = async (item: StoredTranscription, decision: 'SIN_DECIDIR' | 'TOMADO') => {
    setErrorDecision('');
    const r = await transcriptionApi.decidir(item.id, decision);
    if (!r.item) setErrorDecision(r.error ?? 'No se pudo registrar la decisión.');
    onRefresh();
  };

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        textoDe(i).toLowerCase().includes(q) ||
        quien(i.user_email).toLowerCase().includes(q)
    );
  }, [items, busqueda]);

  const sinDecidir = visibles
    .filter((i) => (i.decision ?? 'SIN_DECIDIR') === 'SIN_DECIDIR')
    // La más antigua primero: es la persona que más lleva esperando.
    .sort((a, b) => new Date(a.transcribed_at).getTime() - new Date(b.transcribed_at).getTime());
  const decididas = visibles.filter((i) => (i.decision ?? 'SIN_DECIDIR') !== 'SIN_DECIDIR');

  /* Las cifras, todas contadas de las filas. */
  const todasSinDecidir = items.filter((i) => (i.decision ?? 'SIN_DECIDIR') === 'SIN_DECIDIR');
  const masAntigua = todasSinDecidir.length ? Math.max(...todasSinDecidir.map((i) => diasDesde(i.transcribed_at))) : 0;
  const tomadas = items.filter((i) => i.decision === 'TOMADO').length;
  const declinadas = items.filter((i) => i.decision === 'DECLINADO').length;
  const conDuracion = items.filter((i) => i.duration_seconds);
  const duracionMedia = conDuracion.length
    ? conDuracion.reduce((s, i) => s + (i.duration_seconds ?? 0), 0) / conDuracion.length
    : null;

  const Fila: React.FC<{ item: StoredTranscription }> = ({ item }) => {
    const estado = item.decision ?? 'SIN_DECIDIR';
    const dias = diasDesde(item.transcribed_at);
    const enPalabras = decisionEnPalabras(item);

    return (
      <li className="cn-ent-fila">
        <button type="button" onClick={() => onOpen(item)} className="cn-ent-fila-abrir" title="Abrir la entrevista">
          <span className="cn-ent-fila-titulo">{nombreLegible(item.title)}</span>
          <span className="cn-ent-fila-meta">
            {[fecha(item.transcribed_at), duracionEnPalabras(item.duration_seconds), quien(item.user_email)]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </button>

        <span className="cn-ent-fila-estado">
          <span
            className={`cn-ent-chip ${
              enPalabras.tono === 'ok' ? 'cn-ent-chip--ok' : enPalabras.tono === 'pendiente' ? 'cn-ent-chip--aviso' : 'cn-ent-chip--neutro'
            }`}
          >
            {estado === 'SIN_DECIDIR' && dias > 0 ? `Sin decidir · ${dias} ${dias === 1 ? 'día' : 'días'}` : enPalabras.titulo}
          </span>
          {estado === 'DECLINADO' && item.decision_motivo && (
            <span className="cn-ent-fila-motivo">{item.decision_motivo}</span>
          )}
        </span>

        <span className="cn-ent-fila-menu">
          <button
            type="button"
            onClick={() => setMenuAbierto(menuAbierto === item.id ? null : item.id)}
            aria-label="Acciones"
            aria-expanded={menuAbierto === item.id}
            className="cn-ent-icono"
          >
            <MoreHorizontal size={20} aria-hidden="true" />
          </button>

          {menuAbierto === item.id && (
            <>
              <button type="button" className="cn-ent-menu-velo" aria-label="Cerrar el menú" onClick={() => setMenuAbierto(null)} />
              <span className="cn-ent-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuAbierto(null);
                    onOpen(item);
                  }}
                  className="cn-ent-menu-item"
                >
                  Abrir
                </button>

                {estado === 'SIN_DECIDIR' && (
                  <>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuAbierto(null);
                        void decidir(item, 'TOMADO');
                      }}
                      className="cn-ent-menu-item"
                    >
                      Tomar el caso
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuAbierto(null);
                        setPorDeclinar(item);
                      }}
                      className="cn-ent-menu-item"
                    >
                      Declinar con motivo…
                    </button>
                  </>
                )}

                {estado !== 'SIN_DECIDIR' && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuAbierto(null);
                      void decidir(item, 'SIN_DECIDIR');
                    }}
                    className="cn-ent-menu-item"
                  >
                    Reabrir la decisión
                  </button>
                )}

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuAbierto(null);
                    setPorEliminar(item);
                  }}
                  className="cn-ent-menu-item cn-ent-menu-item--peligro"
                >
                  Eliminar
                </button>
              </span>
            </>
          )}
        </span>
      </li>
    );
  };

  return (
    <section className="cn-ent-lista" aria-label="Entrevistas de la firma">
      <div className="cn-ent-filtros">
        <label className="cn-ent-filtro">
          <span className="cn-ent-oculto">Buscar</span>
          <Search size={18} className="cn-ent-filtro-icono" aria-hidden="true" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Por nombre, quién la atendió o lo que contó"
            className="cn-ent-entrada cn-ent-entrada--con-icono"
          />
        </label>
        <button type="button" onClick={onRefresh} className="cn-ini-boton cn-ini-boton--suave cn-ent-boton" title="Actualizar la lista">
          <RefreshCw size={16} className={isLoading ? 'cn-ent-girando' : undefined} aria-hidden="true" />
          Actualizar
        </button>
      </div>

      {/* ─── LAS CUATRO CIFRAS DE GESTIÓN ──────────────────────────────────── */}
      {items.length > 0 && (
        <dl className="cn-ent-cifras">
          <div className="cn-ent-cifra">
            <dt className="cn-ent-cifra-rotulo">Sin decidir</dt>
            <dd className="cn-ent-cifra-valor">{todasSinDecidir.length}</dd>
            {masAntigua > 0 && (
              <dd className="cn-ent-cifra-detalle">
                La más antigua, {masAntigua} {masAntigua === 1 ? 'día' : 'días'}
              </dd>
            )}
          </div>
          <div className="cn-ent-cifra">
            <dt className="cn-ent-cifra-rotulo">Casos tomados</dt>
            <dd className="cn-ent-cifra-valor">{tomadas}</dd>
          </div>
          <div className="cn-ent-cifra">
            <dt className="cn-ent-cifra-rotulo">Declinados</dt>
            <dd className="cn-ent-cifra-valor">{declinadas}</dd>
            <dd className="cn-ent-cifra-detalle">Con motivo registrado</dd>
          </div>
          <div className="cn-ent-cifra">
            <dt className="cn-ent-cifra-rotulo">Duración media</dt>
            {/* Sin duraciones medidas no hay media: una raya, no «0 min». */}
            <dd className="cn-ent-cifra-valor">{duracionEnPalabras(duracionMedia) ?? '—'}</dd>
          </div>
        </dl>
      )}

      {errorDecision && <p className="cn-ent-aviso cn-ent-aviso--peligro">{errorDecision}</p>}

      {isLoading && items.length === 0 && (
        <p className="cn-ent-cargando">
          <span className="cn-ent-giro" aria-hidden="true" />
          Cargando las entrevistas de la firma…
        </p>
      )}

      {items.length === 0 && !isLoading && (
        <div className="cn-ent-vacio">
          <p className="cn-ent-vacio-titulo">Todavía no hay entrevistas</p>
          <p className="cn-ent-vacio-texto">
            Grabe la conversación con quien consulta: se transcribe, se revisa, y termina en una decisión — tomar
            el caso o declinarlo con motivo.
          </p>
          {onNueva && (
            <button type="button" onClick={onNueva} className="cn-ini-boton cn-ini-boton--primario cn-ent-boton">
              <Plus size={16} aria-hidden="true" />
              Nueva entrevista
            </button>
          )}
        </div>
      )}

      {visibles.length === 0 && items.length > 0 && (
        <p className="cn-ent-nota cn-ent-nota--caja">Ninguna coincide con esa búsqueda.</p>
      )}

      {sinDecidir.length > 0 && (
        <div className="cn-ent-grupo">
          <h2 className="cn-ent-grupo-titulo">
            Esperan decisión · {sinDecidir.length}
            <span className="cn-ent-grupo-nota">Al frente hay una persona esperando respuesta.</span>
          </h2>
          <ul className="cn-ent-filas">
            {sinDecidir.map((i) => (
              <Fila key={i.id} item={i} />
            ))}
          </ul>
        </div>
      )}

      {decididas.length > 0 && (
        <div className="cn-ent-grupo">
          <h2 className="cn-ent-grupo-titulo">Decididas · {decididas.length}</h2>
          <ul className="cn-ent-filas">
            {decididas.map((i) => (
              <Fila key={i.id} item={i} />
            ))}
          </ul>
        </div>
      )}

      {items.length > 0 && (
        <p className="cn-ent-nota">
          Declinar también se registra, con su motivo en una línea: la firma necesita saber qué está rechazando, y
          el consultante merece una respuesta.
        </p>
      )}

      {/* ─── DECLINAR · el mismo diálogo del detalle ───────────────────────── */}
      {porDeclinar && (
        <CerrarEntrevistaDialog
          abierto
          modo="declinar"
          onCerrar={() => setPorDeclinar(null)}
          transcriptionId={porDeclinar.id}
          titulo={nombreLegible(porDeclinar.title)}
          onDecidido={onRefresh}
        />
      )}

      {/* ─── ELIMINAR · confirmación destructiva (app-dialogos-y-estados.html:232) ─── */}
      <Dialog
        abierto={Boolean(porEliminar)}
        onCerrar={() => setPorEliminar(null)}
        tamano="S"
        titulo="¿Eliminar esta entrevista?"
        acciones={
          <>
            <button type="button" onClick={() => setPorEliminar(null)} className="cn-ini-boton cn-ini-boton--texto cn-ent-boton">
              No, conservarla
            </button>
            <button
              type="button"
              onClick={() => {
                if (porEliminar) onDelete(porEliminar.id);
                setPorEliminar(null);
              }}
              className="cn-ini-boton cn-ent-boton cn-ent-boton--peligro"
            >
              Sí, eliminarla
            </button>
          </>
        }
      >
        <p className="cn-ent-dlg-texto">
          «{porEliminar ? nombreLegible(porEliminar.title) : ''}» se borra para toda la firma, con su decisión y su
          motivo. No se puede recuperar.
        </p>
      </Dialog>
    </section>
  );
};
