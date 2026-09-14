import React, { useMemo, useState } from 'react';
import { CalendarClock, Copy, Download, FileClock, Lock, MoreHorizontal, Pencil, Stamp, Trash2 } from 'lucide-react';
import { usePlanSoloLectura } from '../../subscriptions/PlanContext';
import { Dialog } from '../../../design/Dialog';
import type { EstadoBorrador, SavedDraftEntry } from '../types';
import { dejarPendiente } from '../../agenda/pendiente';
import {
  ETIQUETA_ESTADO,
  agruparPorTermino,
  cuantoFalta,
  diasHasta,
  esRadicado,
  faltaDeRespaldo,
  fechaLarga
} from '../draftTerms';

/**
 * Borradores guardados. La pantalla, no el diálogo.
 *
 * ─── SE ORDENA POR TÉRMINO, NO POR ÚLTIMA EDICIÓN ───────────────────────────
 *
 * Es la decisión que define esta pantalla. Un borrador jurídico no es un
 * archivo que espera: es un PLAZO QUE CORRE. Uno editado hace un mes cuyo
 * término vence pasado mañana importa más que uno tocado esta mañana sin fecha
 * a la vista, y ordenar por edición los pone exactamente al revés — arriba lo
 * que se acaba de mirar, que es justo lo que no urge.
 *
 * ─── EL TÉRMINO SE MUESTRA DOS VECES, Y EN ESE ORDEN ────────────────────────
 *
 * Primero la fecha absoluta —«3 may 2025»— porque es la que se cita en un
 * escrito y la que se contrasta con el expediente. Debajo, los días que faltan,
 * porque son los que asustan. Solo los días serían cómodos y no verificables;
 * solo la fecha obliga a hacer la resta mentalmente cada vez.
 *
 * ─── NADA SE BORRA SOLO ─────────────────────────────────────────────────────
 *
 * Se declara por escrito al pie de la lista. Una aplicación que purga
 * borradores viejos es inaceptable cuando el borrador es la prueba de que se
 * trabajó el caso: eliminar es siempre la decisión de una persona.
 *
 * ─── LA CARA NUEVA (artboard 3 de `app-redaccion-revision.html`) ────────────
 *
 * Solo la piel: el orden, los grupos, los filtros y las acciones siguen siendo
 * los de esta pantalla. Del artboard NO se toma el conmutador «Míos / De la
 * firma» —la lista es siempre la de la firma y no hay filtro por autor—, ni sus
 * dos estados: el artboard dibuja «Sin terminar» y «Listo», y el producto tiene
 * cuatro (borrador, revisar, listo, radicado), que son los que se pintan. La
 * urgencia del término va en ámbar y con peso, no en rojo: el rojo de esta cara
 * queda para eliminar.
 *
 * ─── LO QUE NO SE PINTA ─────────────────────────────────────────────────────
 *
 * El diseño trae una columna «Sin verificar» con el número de afirmaciones por
 * comprobar antes de firmar. No existe: la tubería no marca por afirmación, y
 * un cero verde que nadie calculó diría «este escrito se puede radicar mañana»
 * sin que nada lo respalde. La columna se omite hasta que ese dato sea real.
 * «Guardar como plantilla» tampoco: no hay plantillas. «Ver versiones» no vive
 * en esta lista: `saved_drafts.versiones` las conserva todas —desde el
 * 2026-09-14 ninguna se descarta— y se consultan en el taller del borrador.
 */

interface SavedDraftsViewProps {
  savedDrafts: SavedDraftEntry[];
  /** Abre el escrito en el panel de redacción y lleva allá. */
  onAbrir: (entry: SavedDraftEntry) => void;
  onEliminar: (id: string) => void;
  onDuplicar: (entry: SavedDraftEntry) => void;
  /** Devuelve `false` cuando el cambio se quedó en local. */
  onGuardarDatos: (
    id: string,
    campos: Partial<
      Pick<SavedDraftEntry, 'venceEl' | 'cliente' | 'despacho' | 'radicado' | 'estado'>
    >
  ) => Promise<boolean>;
  /** Para «Redactar escrito», el único botón primario de la pantalla. */
  onRedactar: () => void;
  /**
   * «Poner en la agenda» deja el caso preparado y lleva a Herramientas, donde
   * vive la agenda de términos. El borrador no sabe donde vive: solo pide que
   * se vaya alli.
   */
  onIrAHerramientas: () => void;
}

/**
 * La píldora de estado. Los cuatro estados del producto, cada uno con su tono;
 * «listo» lleva además el punto, para que se distinga sin depender del verde.
 */
const CLASE_ESTADO: Record<EstadoBorrador, string> = {
  BORRADOR: 'cn-bor-estado',
  REVISAR: 'cn-bor-estado cn-bor-estado--revisar',
  LISTO: 'cn-bor-estado cn-bor-estado--listo',
  RADICADO: 'cn-bor-estado cn-bor-estado--radicado'
};

/** Escapa un campo para CSV. Sin esto, un despacho con coma parte la fila. */
const csv = (valor: string | null | undefined): string =>
  `"${(valor ?? '').replace(/"/g, '""')}"`;

export const SavedDraftsView: React.FC<SavedDraftsViewProps> = ({
  savedDrafts,
  onAbrir,
  onEliminar,
  onDuplicar,
  onIrAHerramientas,
  onGuardarDatos,
  onRedactar
}) => {
  /* Con el plan vencido la lista sigue: abrir, leer y exportar. Redactar uno nuevo, no. */
  const soloLectura = usePlanSoloLectura();
  const [busqueda, setBusqueda] = useState('');
  const [soloSinRadicar, setSoloSinRadicar] = useState(true);
  const [rama, setRama] = useState<string>('TODAS');
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [editando, setEditando] = useState<SavedDraftEntry | null>(null);
  const [porEliminar, setPorEliminar] = useState<SavedDraftEntry | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const ramas = useMemo(
    () => Array.from(new Set(savedDrafts.map((e) => e.legalBranch).filter(Boolean))) as string[],
    [savedDrafts]
  );

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return savedDrafts.filter((e) => {
      if (soloSinRadicar && esRadicado(e)) return false;
      if (rama !== 'TODAS' && e.legalBranch !== rama) return false;
      if (!q) return true;
      return [e.draft.title, e.cliente, e.despacho, e.radicado, e.draft.documentType]
        .filter(Boolean)
        .some((campo) => (campo as string).toLowerCase().includes(q));
    });
  }, [savedDrafts, busqueda, soloSinRadicar, rama]);

  const grupos = useMemo(() => agruparPorTermino(visibles), [visibles]);

  const sinRadicar = savedDrafts.filter((e) => !esRadicado(e));
  const estaSemana = sinRadicar.filter((e) => {
    const d = diasHasta(e.venceEl);
    return d !== null && d <= 7;
  }).length;

  /**
   * La lista tal como se ve, en CSV.
   *
   * Se exporta lo VISIBLE y no todo: quien filtró por un cliente y exporta
   * espera ese cliente. Y se hace en el navegador porque el dato ya está aquí;
   * pedirlo al servidor solo agregaría una forma de fallar.
   */
  const exportar = () => {
    const cabecera = ['Escrito', 'Cliente', 'Despacho', 'Radicado', 'Vence', 'Estado', 'Versión', 'Última edición'];
    const filas = visibles.map((e) =>
      [
        csv(e.draft.title),
        csv(e.cliente),
        csv(e.despacho),
        csv(e.radicado),
        csv(e.venceEl ? fechaLarga(e.venceEl) : ''),
        csv(e.estado ? ETIQUETA_ESTADO[e.estado] : ''),
        csv(`v${e.version ?? 1}`),
        csv(e.savedAt)
      ].join(',')
    );

    // BOM para que Excel en Windows lea los acentos. Sin él, «Acción» sale rota.
    const blob = new Blob(['﻿' + [cabecera.map(csv).join(','), ...filas].join('\r\n')], {
      type: 'text/csv;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `borradores-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const guardar = async (
    id: string,
    campos: Parameters<SavedDraftsViewProps['onGuardarDatos']>[1]
  ) => {
    const enLaNube = await onGuardarDatos(id, campos);
    setEditando(null);
    if (!enLaNube) {
      setAviso('El cambio quedó guardado en este equipo. El resto de la firma todavía no lo ve.');
    }
  };

  return (
    <div data-visita="vista-borradores" className="cara-nueva cn-bor flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {/* ─── ENCABEZADO ──────────────────────────────────────────────────── */}
      <header className="cn-bor-cabeza">
        <div className="cn-bor-textos">
          <h1 className="cn-bor-h1">Borradores</h1>
          {/*
            LA BAJADA DEL ARTBOARD SE QUEDA PORQUE ES VERDAD: cada guardado
            conserva su versión y la fila dice quién lo creó y quién lo editó.
          */}
          <p className="cn-bor-bajada">Todo lo empezado, con sus versiones y quién lo tocó.</p>
          <p className="cn-bor-censo">
            {sinRadicar.length} {sinRadicar.length === 1 ? 'escrito' : 'escritos'} sin radicar
            {estaSemana > 0 && (
              <>
                {' · '}
                <span className="cn-bor-censo-urge">
                  {estaSemana} con término esta semana
                </span>
              </>
            )}
          </p>
        </div>

        <div className="cn-bor-botones">
          <button
            type="button"
            onClick={exportar}
            className="cn-ini-boton cn-ini-boton--suave cn-bor-boton"
            disabled={visibles.length === 0}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exportar lista
          </button>
          {!soloLectura && (
            <button type="button" onClick={onRedactar} className="cn-ini-boton cn-ini-boton--primario cn-bor-boton">
              Redactar escrito
            </button>
          )}
        </div>
      </header>

      {/* ─── FILTROS ─────────────────────────────────────────────────────── */}
      <div className="cn-bor-filtros">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por cliente, radicado o actuación"
          aria-label="Buscar por cliente, radicado o actuación"
          className="cn-campo cn-bor-buscar"
        />

        <button
          type="button"
          onClick={() => setSoloSinRadicar((v) => !v)}
          aria-pressed={soloSinRadicar}
          className={`cn-bor-pildora ${soloSinRadicar ? 'cn-bor-pildora--activa' : ''}`}
        >
          Estado: {soloSinRadicar ? 'sin radicar' : 'todos'}
        </button>

        {ramas.length > 0 && (
          <select
            value={rama}
            onChange={(e) => setRama(e.target.value)}
            aria-label="Rama"
            className="cn-campo cn-bor-select"
          >
            <option value="TODAS">Rama: todas</option>
            {ramas.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        )}

        {(busqueda || !soloSinRadicar || rama !== 'TODAS') && (
          <button
            type="button"
            onClick={() => {
              setBusqueda('');
              setSoloSinRadicar(true);
              setRama('TODAS');
            }}
            className="cn-bor-enlace"
          >
            Limpiar
          </button>
        )}

        {/*
          El orden es un HECHO de esta pantalla, no una opción que se elige.
          Se dice para que nadie crea que la lista está desordenada al ver
          arriba un escrito que no se toca hace un mes.
        */}
        <span className="cn-bor-orden">Orden: término más próximo</span>
      </div>

      {/* ─── LISTA ───────────────────────────────────────────────────────── */}
      <div className="cn-bor-lista">
        {savedDrafts.length === 0 ? (
          <div className="cn-bor-vacio">
            <FileClock className="h-8 w-8" aria-hidden="true" />
            <p className="cn-bor-vacio-titulo">Todavía no hay borradores guardados.</p>
            <p className="cn-bor-vacio-texto">
              Cuando redacte un escrito y lo guarde, aparece aquí con su proceso y su término, y
              esta lista lo ordena por lo que vence primero.
            </p>
            {!soloLectura && (
              <button type="button" onClick={onRedactar} className="cn-ini-boton cn-ini-boton--primario cn-bor-boton">
                Redactar escrito
              </button>
            )}
          </div>
        ) : visibles.length === 0 ? (
          <p className="cn-bor-vacio cn-bor-vacio-texto">Ninguno coincide con estos filtros.</p>
        ) : (
          grupos.map((grupo) => (
            <section key={grupo.titulo} className="cn-bor-grupo">
              <h2 className={`cn-bor-grupo-titulo ${grupo.urgente ? 'cn-bor-grupo-titulo--urge' : ''}`}>
                {grupo.titulo} · {grupo.entradas.length}
              </h2>

              <div className="cn-bor-tabla">
                {/* La cabecera de columnas solo cuando hay ancho para leerla en una línea. */}
                <div className="cn-bor-columnas" aria-hidden="true">
                  <span>Escrito</span>
                  <span>Término</span>
                  <span>Versión</span>
                  <span>Estado</span>
                  <span>Últ. edición</span>
                  <span />
                </div>

                {grupo.entradas.map((e) => {
                  const dias = diasHasta(e.venceEl);
                  const radicado = esRadicado(e);
                  const urge = dias !== null && dias <= 2;

                  return (
                    <div key={e.id} className={`cn-bor-fila ${radicado ? 'cn-bor-fila--radicado' : ''}`}>
                      <button
                        type="button"
                        onClick={() => !radicado && onAbrir(e)}
                        disabled={radicado}
                        className="cn-bor-abrir cn-bor-c-escrito"
                        title={radicado ? 'Radicado: se consulta y se duplica, nunca se continúa.' : 'Abrir en el panel'}
                      >
                        <span className="cn-bor-titulo">
                          {radicado && <Lock className="h-3.5 w-3.5" strokeWidth={2.4} aria-hidden="true" />}
                          <span className="cn-bor-titulo-texto">{e.draft.title}</span>
                        </span>
                        <span className="cn-bor-meta">
                          {radicado
                            ? `Radicado${e.radicadoEl ? ` el ${new Date(e.radicadoEl).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}` : ''} · copia inmutable`
                            : [e.cliente, e.despacho].filter(Boolean).join(' · ') ||
                              'Sin proceso asociado'}
                        </span>

                        {/*
                          LO QUE LE FALTA DE RESPALDO, desde la procedencia
                          congelada al redactar. 10a la pide como columna «Sin
                          verificar»; aqui va bajo el titulo, que es donde ya se
                          lee el contexto del escrito. Solo aparece cuando hay
                          algo que decir: un borrador respaldado no necesita una
                          linea que lo diga, y uno anterior a la columna tampoco
                          — no sabemos que le falte, sabemos que no lo anotamos.
                          Lleva el BORDE DISCONTINUO porque es exactamente lo que
                          ese guion significa en esta cara: sin verificar.
                        */}
                        {faltaDeRespaldo(e) && <span className="cn-bor-sin">{faltaDeRespaldo(e)}</span>}
                      </button>

                      {/*
                        LA FECHA ARRIBA Y LOS DÍAS DEBAJO, en ese orden.
                        La fecha es la que se cita en el escrito; los días son
                        los que hacen actuar. Ninguna de las dos sola alcanza.
                      */}
                      <span className="cn-bor-c-termino">
                        {radicado ? (
                          <span className="cn-bor-dias">Radicado a tiempo</span>
                        ) : dias !== null ? (
                          <>
                            <span className="cn-bor-fecha">{fechaLarga(e.venceEl as string)}</span>
                            <span className={`cn-bor-dias ${urge ? 'cn-bor-dias--urge' : ''}`}>
                              {cuantoFalta(dias)}
                            </span>
                          </>
                        ) : (
                          <button type="button" onClick={() => setEditando(e)} className="cn-bor-enlace">
                            Poner término
                          </button>
                        )}
                      </span>

                      <span className="cn-bor-c-version cn-bor-version">v{e.version ?? 1}</span>

                      <span className="cn-bor-c-estado">
                        <span className={CLASE_ESTADO[e.estado ?? 'BORRADOR']}>
                          {e.estado ? ETIQUETA_ESTADO[e.estado] : 'Borrador'}
                        </span>
                      </span>

                      <span
                        className="cn-bor-c-autor cn-bor-autor"
                        title={e.editadoPor && e.editadoPor !== e.autor ? `Creado por ${e.autor ?? '—'} · editado por ${e.editadoPor}` : undefined}
                      >
                        {/* «editado por X» solo cuando X no es quien lo creó: es la información nueva. */}
                        {[
                          e.autor,
                          e.editadoPor && e.editadoPor !== e.autor ? `editado por ${e.editadoPor}` : null,
                          e.savedAt
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>

                      {/* ─── MENÚ DE FILA ─────────────────────────────── */}
                      <span className="cn-bor-menu-caja">
                        <button
                          type="button"
                          onClick={() => setMenuAbierto(menuAbierto === e.id ? null : e.id)}
                          aria-label="Acciones"
                          aria-expanded={menuAbierto === e.id}
                          className="cn-bor-menu-boton"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </button>

                        {menuAbierto === e.id && (
                          <>
                            {/* Capa que cierra al tocar fuera, sin listeners globales. */}
                            <span className="cn-bor-menu-velo" onClick={() => setMenuAbierto(null)} />
                            <span className="cn-bor-menu">
                              {!radicado && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuAbierto(null);
                                    onAbrir(e);
                                  }}
                                  className="cn-bor-menu-item"
                                >
                                  Abrir
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuAbierto(null);
                                  setEditando(e);
                                }}
                                className="cn-bor-menu-item"
                              >
                                <Pencil className="h-4 w-4" aria-hidden="true" />
                                Datos del proceso
                              </button>
                              {/*
                                A LA AGENDA CON LA ACTUACION YA ELEGIDA. El
                                borrador ya sabe contra que ficha se redacto
                                —la procedencia que pinta la barra del visor—,
                                asi que llevar ese id evita que el abogado
                                vuelva a buscarla en un catalogo de 881 fichas
                                y, sobre todo, evita que elija otra parecida:
                                el termino que se vigilaria seria el de otra
                                actuacion. No viaja ningun plazo ni ninguna
                                fecha: eso lo lee el servidor de la ficha.
                              */}
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuAbierto(null);
                                  dejarPendiente({
                                    origen: 'BORRADOR',
                                    asunto:
                                      [e.cliente, e.despacho].filter(Boolean).join(' · ') ||
                                      e.draft.title,
                                    cliente: e.cliente ?? null,
                                    radicado: e.radicado ?? null,
                                    actuacionId: e.draft.procedencia?.actuacionId ?? null,
                                    actuacionNombre:
                                      e.draft.procedencia?.exactName ?? e.draft.documentType,
                                    rama: e.legalBranch ?? null
                                  });
                                  onIrAHerramientas();
                                }}
                                className="cn-bor-menu-item"
                              >
                                <CalendarClock className="h-4 w-4" aria-hidden="true" />
                                Poner en la agenda
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuAbierto(null);
                                  onDuplicar(e);
                                }}
                                className="cn-bor-menu-item"
                              >
                                <Copy className="h-4 w-4" aria-hidden="true" />
                                Duplicar
                              </button>
                              {!radicado && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMenuAbierto(null);
                                    void guardar(e.id, { estado: 'RADICADO' });
                                  }}
                                  className="cn-bor-menu-item"
                                >
                                  <Stamp className="h-4 w-4" aria-hidden="true" />
                                  Marcar radicado
                                </button>
                              )}
                              {!radicado && (
                                <>
                                  <span className="cn-bor-menu-raya" aria-hidden="true" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMenuAbierto(null);
                                      setPorEliminar(e);
                                    }}
                                    className="cn-bor-menu-item cn-bor-menu-item--peligro"
                                  >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                    Eliminar
                                  </button>
                                </>
                              )}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {/*
          SE DECLARA QUE NADA SE BORRA SOLO.
          Una aplicación que purga borradores viejos es inaceptable cuando el
          borrador es la prueba de que se trabajó el caso. La segunda frase es
          la del artboard y es verdad del estado «Listo»: cambiarlo no radica,
          no firma ni envía nada.
        */}
        {savedDrafts.length > 0 && (
          <div className="cn-bor-nota">
            <p className="cn-bor-nota-titulo">Ningún borrador se borra solo</p>
            <p className="cn-bor-nota-texto">
              Se conservan mientras la cuenta exista, incluso si el término ya venció. Eliminar es
              siempre la decisión de una persona. Marcar un borrador como listo no lo radica ni lo
              firma: solo le dice a su firma que ya se revisó.
            </p>
          </div>
        )}
      </div>

      {/* ─── DATOS DEL PROCESO · diálogo tipo 2 (formulario, M) ──────────── */}
      <DatosDelProceso
        entrada={editando}
        onCerrar={() => setEditando(null)}
        onGuardar={(campos) => editando && guardar(editando.id, campos)}
      />

      {/* ─── ELIMINAR · tipo 1 (S) ───────────────────────────────────────── */}
      <Dialog
        abierto={Boolean(porEliminar)}
        onCerrar={() => setPorEliminar(null)}
        tamano="S"
        titulo="¿Eliminar este borrador?"
        acciones={
          <>
            <button
              type="button"
              onClick={() => setPorEliminar(null)}
              className="cn-ini-boton cn-ini-boton--suave cn-bor-boton"
            >
              Conservar
            </button>
            <button
              type="button"
              onClick={() => {
                if (porEliminar) onEliminar(porEliminar.id);
                setPorEliminar(null);
              }}
              className="cn-ini-boton cn-bor-boton cn-bor-boton--peligro"
            >
              Eliminar
            </button>
          </>
        }
      >
        <p className="cn-bor-dialogo-texto">
          «{porEliminar?.draft.title}» se borra para toda la firma y no se puede recuperar.
        </p>
        {porEliminar?.venceEl && (
          <p className="notice mt-3">
            Este escrito tiene un término que vence{' '}
            {cuantoFalta(diasHasta(porEliminar.venceEl) as number)} y no se ha radicado.
          </p>
        )}
      </Dialog>

      {/* El aviso de que algo quedó solo en este equipo. */}
      <Dialog
        abierto={Boolean(aviso)}
        onCerrar={() => setAviso(null)}
        tamano="S"
        titulo="Guardado en este equipo"
        acciones={
          <button
            type="button"
            onClick={() => setAviso(null)}
            className="cn-ini-boton cn-ini-boton--primario cn-bor-boton"
          >
            Entendido
          </button>
        }
      >
        <p className="cn-bor-dialogo-texto">{aviso}</p>
      </Dialog>
    </div>
  );
};

/**
 * Los datos del expediente. Diálogo tipo 2 —formulario— en tamaño M.
 *
 * ESTE FORMULARIO ES LO QUE HACE REAL EL RESTO DE LA PANTALLA. La lista ordena
 * por término y muestra el proceso, pero nada en la aplicación recogía esos
 * datos: se guardaban al redactar y nadie los escribía nunca. Sin esta puerta,
 * la columna «Término» decía «Sin término» para siempre y el orden por plazo
 * era decorativo.
 *
 * EL TÉRMINO SE ESCRIBE A MANO, y así debe ser. El catálogo tiene el plazo como
 * texto —«Dentro de los diez (10) días siguientes a la presentación»— y de ahí
 * no sale una fecha sin saber cuándo empezó a correr. Solo lo sabe quien lleva
 * el caso. Calcularlo aquí sería inventar un plazo, que es la única cosa que
 * este producto no puede hacer.
 *
 * LOS EJEMPLOS DE LOS CAMPOS SON DE MENTIRA A LA VISTA. Un despacho y un
 * radicado verosímiles se leen como datos de un caso real y terminan copiados
 * en un escrito; los ceros no se confunden con nada (README-app §3).
 */
const DatosDelProceso: React.FC<{
  entrada: SavedDraftEntry | null;
  onCerrar: () => void;
  onGuardar: (campos: {
    venceEl?: string | null;
    cliente?: string | null;
    despacho?: string | null;
    radicado?: string | null;
    estado?: EstadoBorrador;
  }) => void;
}> = ({ entrada, onCerrar, onGuardar }) => {
  const [cliente, setCliente] = useState('');
  const [despacho, setDespacho] = useState('');
  const [radicado, setRadicado] = useState('');
  const [venceEl, setVenceEl] = useState('');
  const [estado, setEstado] = useState<EstadoBorrador>('BORRADOR');

  /*
   * Se rellena cuando cambia la entrada, no en cada render: escribir en un
   * campo mientras el estado se resetea al valor guardado hace imposible
   * teclear. `key` en el Dialog lograría lo mismo remontando; esto evita
   * perder el foco.
   */
  const [ultimaId, setUltimaId] = useState<string | null>(null);
  if (entrada && entrada.id !== ultimaId) {
    setUltimaId(entrada.id);
    setCliente(entrada.cliente ?? '');
    setDespacho(entrada.despacho ?? '');
    setRadicado(entrada.radicado ?? '');
    setVenceEl(entrada.venceEl ?? '');
    setEstado(entrada.estado ?? 'BORRADOR');
  }

  const cambio =
    Boolean(entrada) &&
    (cliente !== (entrada?.cliente ?? '') ||
      despacho !== (entrada?.despacho ?? '') ||
      radicado !== (entrada?.radicado ?? '') ||
      venceEl !== (entrada?.venceEl ?? '') ||
      estado !== (entrada?.estado ?? 'BORRADOR'));

  return (
    <Dialog
      abierto={Boolean(entrada)}
      onCerrar={onCerrar}
      tamano="M"
      titulo="Datos del proceso"
      subtitulo="Son los que permiten reconocer el escrito en la lista y ordenarlo por término."
      /* Con cambios pendientes el velo no cierra: preguntaría, y aquí basta con no cerrar. */
      hayCambiosSinGuardar={cambio}
      onIntentoDeCerrarConCambios={() => undefined}
      acciones={
        <>
          <button type="button" onClick={onCerrar} className="cn-ini-boton cn-ini-boton--suave cn-bor-boton">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() =>
              onGuardar({
                // Cadena vacía es «lo borré a propósito», y por eso viaja como null.
                cliente: cliente.trim() || null,
                despacho: despacho.trim() || null,
                radicado: radicado.trim() || null,
                venceEl: venceEl || null,
                estado
              })
            }
            className="cn-ini-boton cn-ini-boton--primario cn-bor-boton"
            disabled={!cambio}
          >
            Guardar
          </button>
        </>
      }
    >
      <div className="cn-bor-form">
        <label className="block">
          <span className="cn-bor-etiqueta">Cliente o parte</span>
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Cliente vs. contraparte"
            className="cn-campo cn-bor-campo"
          />
        </label>

        <label className="block">
          <span className="cn-bor-etiqueta">Despacho</span>
          <input
            value={despacho}
            onChange={(e) => setDespacho(e.target.value)}
            placeholder="Juzgado 00 Civil Municipal"
            className="cn-campo cn-bor-campo"
          />
        </label>

        <label className="block">
          <span className="cn-bor-etiqueta">Radicado</span>
          <input
            value={radicado}
            onChange={(e) => setRadicado(e.target.value)}
            placeholder="00000000000000000000000"
            className="cn-campo cn-campo--mono cn-bor-campo"
          />
        </label>

        <label className="block">
          <span className="cn-bor-etiqueta">Vence el</span>
          <input
            type="date"
            value={venceEl}
            onChange={(e) => setVenceEl(e.target.value)}
            className="cn-campo cn-bor-campo"
          />
          <span className="cn-bor-ayuda">
            La fecha, no el término del catálogo. El catálogo dice «dentro de los diez (10) días
            siguientes»; solo usted sabe cuándo empezaron a correr. Si el escrito no caduca, déjelo
            vacío.
          </span>
        </label>

        <label className="block">
          <span className="cn-bor-etiqueta">Estado</span>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoBorrador)}
            className="cn-campo cn-bor-campo"
          >
            <option value="BORRADOR">Borrador — se está escribiendo</option>
            <option value="REVISAR">Revisar — hay algo por comprobar</option>
            <option value="LISTO">Listo — revisado, sin radicar</option>
            <option value="RADICADO">Radicado — se llevó al juzgado</option>
          </select>
          {estado === 'RADICADO' && entrada?.estado !== 'RADICADO' && (
            <span className="notice mt-2 block">
              Al marcarlo radicado, su texto ya no se podrá modificar: pasa a ser la copia de lo
              que está en el expediente. Para seguir trabajando a partir de él, duplíquelo.
            </span>
          )}
        </label>
      </div>
    </Dialog>
  );
};
