import React, { useMemo, useState } from 'react';
import { Dialog } from '../../../design/Dialog';
import { textoDe, type StoredTranscription } from '../services/transcription.api';
import { duracionEnPalabras, nombreLegible, revisionDe, vocesEnPalabras } from '../audienciaEnPantalla';

/**
 * La lista de audiencias. Artboard `app-audiencias-entrevistas.html`:438.
 *
 * LA REGLA QUE ORGANIZA LA PANTALLA: una transcripción no es un acta hasta que
 * un humano la lee. Las pendientes van arriba; las que alguien dio por «Acta
 * lista», debajo. Ese estado solo lo da una persona — no hay camino automático
 * hacia él, ni aquí ni en el servidor.
 *
 * LA FRACCIÓN «12 DE 58 REVISADAS» ES REAL: se cuenta de la marca `revisada` de
 * cada intervención, que viaja en la fila.
 *
 * LO QUE LA MAQUETA PINTA Y AQUÍ NO ESTÁ, con la razón:
 *   · la fila «Transcribiendo…»: transcribir es una sola llamada que ocurre en
 *     el diálogo de subir; no hay trabajos en curso que listar;
 *   · el caso junto al título: la lista del servidor no trae `expediente_id`,
 *     y pintarlo exigiría otra consulta por fila;
 *   · «El archivo de audio se conserva… consume saldo según la duración»: la
 *     grabación se borra al transcribirse y transcribir no se cobra.
 */

interface AudienciasListProps {
  items: StoredTranscription[];
  isLoading: boolean;
  onOpen: (item: StoredTranscription) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  /** Da o quita «Acta lista». El servidor registra quién y cuándo. */
  onMarcarRevision: (id: string, estado: 'POR_REVISAR' | 'ACTA_LISTA') => void;
  /** Ausente con el plan en solo lectura: el estado vacío no ofrece subir. */
  onSubir?: () => void;
}

const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });

/** El nombre antes de la arroba: en la fila importa la persona, no el dominio. */
const quien = (email?: string | null): string => (email ? email.split('@')[0] : '');

export const AudienciasList: React.FC<AudienciasListProps> = ({
  items,
  isLoading,
  onOpen,
  onDelete,
  onRefresh,
  onMarcarRevision,
  onSubir
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [porEliminar, setPorEliminar] = useState<StoredTranscription | null>(null);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    // Por el nombre y por LO QUE SE DIJO: el abogado recuerda la frase, no el archivo.
    return items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        textoDe(i).toLowerCase().includes(q) ||
        quien(i.user_email).toLowerCase().includes(q)
    );
  }, [items, busqueda]);

  const pendientes = visibles.filter((i) => i.estado_revision !== 'ACTA_LISTA');
  const listas = visibles.filter((i) => i.estado_revision === 'ACTA_LISTA');

  const fila = (item: StoredTranscription, lista: boolean) => {
    const revision = revisionDe(item.segments);
    const meta = [fecha(item.transcribed_at), duracionEnPalabras(item.duration_seconds), quien(item.user_email) && `subida por ${quien(item.user_email)}`]
      .filter(Boolean)
      .join(' · ');

    return (
      <li key={item.id} className="cn-aud-fila">
        <button type="button" onClick={() => onOpen(item)} className="cn-aud-fila-abrir">
          <span className="cn-aud-fila-titulo">{nombreLegible(item.title)}</span>
          <span className="cn-aud-fila-meta">{meta}</span>
        </button>

        <span className="cn-aud-fila-datos">
          <span className="cn-aud-fila-voces">{vocesEnPalabras(item.speaker_labels.length)}</span>
          <span
            className={`cn-aud-pildora ${
              revision.entera ? 'cn-aud-pildora--ok' : revision.total === 0 ? 'cn-aud-pildora--neutra' : 'cn-aud-pildora--aviso'
            }`}
          >
            {revision.texto}
          </span>
          {lista && (
            <span className="cn-aud-pildora cn-aud-pildora--ok" title={item.revisada_por ? `Por ${quien(item.revisada_por)}` : undefined}>
              Acta lista
            </span>
          )}
        </span>

        <span className="cn-aud-fila-menu">
          <button
            type="button"
            onClick={() => setMenuAbierto(menuAbierto === item.id ? null : item.id)}
            aria-label={`Acciones de ${nombreLegible(item.title)}`}
            aria-expanded={menuAbierto === item.id}
            className="cn-aud-icono"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="5" cy="12" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="19" cy="12" r="1.7" />
            </svg>
          </button>

          {menuAbierto === item.id && (
            <>
              <button type="button" className="cn-aud-menu-velo" aria-label="Cerrar el menú" onClick={() => setMenuAbierto(null)} />
              <span className="cn-aud-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="cn-aud-menu-item"
                  onClick={() => {
                    setMenuAbierto(null);
                    onOpen(item);
                  }}
                >
                  Abrir y revisar
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="cn-aud-menu-item"
                  onClick={() => {
                    setMenuAbierto(null);
                    onMarcarRevision(item.id, lista ? 'POR_REVISAR' : 'ACTA_LISTA');
                  }}
                >
                  {lista ? 'Volver a revisar' : 'Marcar acta lista'}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="cn-aud-menu-item cn-aud-menu-item--peligro"
                  onClick={() => {
                    setMenuAbierto(null);
                    setPorEliminar(item);
                  }}
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

  /* Cargando y sin nada todavía: no se afirma «no hay audiencias» antes de saberlo. */
  if (items.length === 0 && isLoading) {
    return (
      <p className="cn-aud-cargando" role="status">
        <span className="cn-aud-giro" aria-hidden="true" />
        Cargando las audiencias de la firma…
      </p>
    );
  }

  /* Artboard :248, «Todavía no hay audiencias». */
  if (items.length === 0) {
    return (
      <div className="cn-aud-vacio">
        <p className="cn-aud-vacio-titulo">Todavía no hay audiencias</p>
        <p className="cn-aud-vacio-texto">
          Suba la grabación del despacho o la suya. Iureon separa a cada interlocutor y propone su rol; usted le
          pone nombre.
        </p>
        {onSubir && (
          <button type="button" onClick={onSubir} className="cn-ini-boton cn-ini-boton--primario cn-aud-boton">
            Subir una grabación
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="cn-aud-lista">
      <div className="cn-aud-lista-barra">
        <label className="cn-aud-sr" htmlFor="buscar-audiencias">
          Buscar audiencias
        </label>
        <input
          id="buscar-audiencias"
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Por nombre, quién la subió o lo que se dijo"
          className="cn-aud-entrada cn-aud-buscar"
        />
        <button type="button" onClick={onRefresh} className="cn-ini-boton cn-ini-boton--suave cn-aud-boton" disabled={isLoading}>
          {isLoading ? 'Actualizando…' : 'Actualizar'}
        </button>
      </div>

      {visibles.length === 0 && <p className="cn-aud-nota cn-aud-nota--caja">Ninguna coincide con esa búsqueda.</p>}

      {pendientes.length > 0 && (
        <section className="cn-aud-grupo" aria-label="Pendientes de revisar">
          <h2 className="cn-aud-grupo-titulo">
            Pendientes de revisar <span className="cn-aud-mono cn-aud-grupo-cuenta">{pendientes.length}</span>
          </h2>
          <ul className="cn-aud-filas">{pendientes.map((i) => fila(i, false))}</ul>
        </section>
      )}

      {listas.length > 0 && (
        <section className="cn-aud-grupo" aria-label="Acta lista">
          <h2 className="cn-aud-grupo-titulo">
            Acta lista <span className="cn-aud-mono cn-aud-grupo-cuenta">{listas.length}</span>
          </h2>
          <ul className="cn-aud-filas">{listas.map((i) => fila(i, true))}</ul>
        </section>
      )}

      {/*
        LA REGLA, ESCRITA DONDE SE TRABAJA. Y lo que pasa con la grabación, que
        la maqueta dice al revés.
      */}
      <p className="cn-aud-nota cn-aud-lista-pie">
        Una transcripción no es un acta: «Acta lista» solo lo da una persona después de leerla, y queda registrado
        quién y cuándo. La grabación no se conserva; se borra apenas termina de transcribirse.
      </p>

      <div className="cn-aud-dialogos">
        <Dialog
          abierto={Boolean(porEliminar)}
          onCerrar={() => setPorEliminar(null)}
          tamano="S"
          titulo="¿Eliminar esta audiencia?"
          acciones={
            <>
              <button type="button" onClick={() => setPorEliminar(null)} className="cn-ini-boton cn-ini-boton--texto cn-aud-boton">
                Conservar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (porEliminar) onDelete(porEliminar.id);
                  setPorEliminar(null);
                }}
                className="cn-ini-boton cn-aud-boton cn-aud-boton--peligro"
              >
                Eliminar
              </button>
            </>
          }
        >
          <p className="cn-aud-dlg-texto">
            «{porEliminar ? nombreLegible(porEliminar.title) : ''}» se borra para toda la firma. La grabación no está
            guardada — solo existe este texto, y no se puede recuperar.
          </p>
        </Dialog>
      </div>
    </div>
  );
};
