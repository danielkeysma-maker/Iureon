import React, { useMemo, useState } from 'react';
import { Copy, Download, FileClock, Lock, MoreHorizontal, Pencil, Stamp, Trash2 } from 'lucide-react';
import { usePlanSoloLectura } from '../../subscriptions/PlanContext';
import { Dialog } from '../../../design/Dialog';
import type { EstadoBorrador, SavedDraftEntry } from '../types';
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
 * ─── LO QUE NO SE PINTA ─────────────────────────────────────────────────────
 *
 * El diseño trae una columna «Sin verificar» con el número de afirmaciones por
 * comprobar antes de firmar. No existe: la tubería no marca por afirmación, y
 * un cero verde que nadie calculó diría «este escrito se puede radicar mañana»
 * sin que nada lo respalde. La columna se omite hasta que ese dato sea real.
 * Lo mismo con «Ver versiones» y «Guardar como plantilla»: `saved_drafts`
 * conserva el número de versión, no las versiones, y no hay plantillas.
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
}


/** Escapa un campo para CSV. Sin esto, un despacho con coma parte la fila. */
const csv = (valor: string | null | undefined): string =>
  `"${(valor ?? '').replace(/"/g, '""')}"`;

export const SavedDraftsView: React.FC<SavedDraftsViewProps> = ({
  savedDrafts,
  onAbrir,
  onEliminar,
  onDuplicar,
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
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas font-sans">
      {/* ─── ENCABEZADO ──────────────────────────────────────────────────── */}
      <header className="flex shrink-0 flex-wrap items-end gap-3 border-b border-line-200 bg-surface px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <h1 className="text-title text-ink-900">Borradores guardados</h1>
          <p className="mt-0.5 text-meta text-ink-500">
            {sinRadicar.length} {sinRadicar.length === 1 ? 'escrito' : 'escritos'} sin radicar
            {estaSemana > 0 && (
              <>
                {' · '}
                <span className="font-medium text-danger">
                  {estaSemana} con término esta semana
                </span>
              </>
            )}
          </p>
        </div>

        <button onClick={exportar} className="btn-neutral btn-sm" disabled={visibles.length === 0}>
          <Download className="h-3.5 w-3.5" />
          Exportar lista
        </button>
        {!soloLectura && (
        <button onClick={onRedactar} className="btn-primary btn-sm">
          Redactar escrito
        </button>
        )}
      </header>

      {/* ─── FILTROS ─────────────────────────────────────────────────────── */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-line-200 bg-surface px-5 py-2">
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por cliente, radicado o actuación"
          className="field w-[300px] max-w-full"
        />

        <button
          onClick={() => setSoloSinRadicar((v) => !v)}
          className={`rounded-control px-2.5 py-1 text-[12.5px] font-medium ${
            soloSinRadicar ? 'bg-brand-700 text-white' : 'bg-canvas text-ink-500 hover:text-ink-900'
          }`}
        >
          Estado: {soloSinRadicar ? 'sin radicar' : 'todos'}
        </button>

        {ramas.length > 0 && (
          <select
            value={rama}
            onChange={(e) => setRama(e.target.value)}
            className="field max-w-[220px] py-1"
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
            onClick={() => {
              setBusqueda('');
              setSoloSinRadicar(true);
              setRama('TODAS');
            }}
            className="text-meta text-brand-700 underline underline-offset-2"
          >
            Limpiar
          </button>
        )}

        {/*
          El orden es un HECHO de esta pantalla, no una opción que se elige.
          Se dice para que nadie crea que la lista está desordenada al ver
          arriba un escrito que no se toca hace un mes.
        */}
        <span className="ml-auto font-mono text-[11px] text-ink-400">
          Orden: término más próximo
        </span>
      </div>

      {/* ─── LISTA ───────────────────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {savedDrafts.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 py-12 text-center">
            <FileClock className="h-8 w-8 text-ink-400" />
            <p className="text-ui text-ink-900">Todavía no hay borradores guardados.</p>
            <p className="max-w-md text-meta text-ink-500">
              Cuando redacte un escrito y lo guarde, aparece aquí con su proceso y su término, y
              esta lista lo ordena por lo que vence primero.
            </p>
            {!soloLectura && (
            <button onClick={onRedactar} className="btn-primary btn-sm mt-2">
              Redactar escrito
            </button>
            )}
          </div>
        ) : visibles.length === 0 ? (
          <p className="card py-8 text-center text-meta text-ink-500">
            Ninguno coincide con estos filtros.
          </p>
        ) : (
          grupos.map((grupo) => (
            <section key={grupo.titulo} className="mb-5">
              <h2
                className={`mb-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] ${
                  grupo.urgente ? 'text-danger' : 'text-ink-400'
                }`}
              >
                {grupo.titulo} · {grupo.entradas.length}
              </h2>

              <div className="overflow-hidden rounded-card border border-line-200 bg-surface">
                {/* La cabecera de columnas solo cuando hay ancho para leerla. */}
                <div className="t-head hidden items-center gap-3 px-4 py-2 md:flex">
                  <span className="min-w-0 flex-1">Escrito</span>
                  <span className="w-[150px] shrink-0">Término</span>
                  <span className="w-[64px] shrink-0">Versión</span>
                  <span className="w-[90px] shrink-0">Estado</span>
                  <span className="w-[170px] shrink-0">Últ. edición</span>
                  <span className="w-[28px] shrink-0" />
                </div>

                {grupo.entradas.map((e) => {
                  const dias = diasHasta(e.venceEl);
                  const radicado = esRadicado(e);
                  const urge = dias !== null && dias <= 2;

                  return (
                    <div
                      key={e.id}
                      className={`t-row flex flex-wrap items-center gap-3 px-4 py-2.5 ${
                        radicado ? 'opacity-60' : ''
                      }`}
                    >
                      <button
                        onClick={() => !radicado && onAbrir(e)}
                        disabled={radicado}
                        className="min-w-0 flex-1 text-left"
                        title={radicado ? 'Radicado: se consulta y se duplica, nunca se continúa.' : 'Abrir en el panel'}
                      >
                        <span className="flex items-center gap-1.5">
                          {radicado && (
                            <Lock className="h-3 w-3 shrink-0 text-ink-400" strokeWidth={2.4} />
                          )}
                          <span className="min-w-0 truncate text-ui text-ink-900">
                            {e.draft.title}
                          </span>
                        </span>
                        <span className="mt-0.5 block truncate text-meta text-ink-500">
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
                        */}
                        {faltaDeRespaldo(e) && (
                          <span className="mt-0.5 block truncate text-meta text-unverified">
                            {faltaDeRespaldo(e)}
                          </span>
                        )}
                      </button>

                      {/*
                        LA FECHA ARRIBA Y LOS DÍAS DEBAJO, en ese orden.
                        La fecha es la que se cita en el escrito; los días son
                        los que hacen actuar. Ninguna de las dos sola alcanza.
                      */}
                      <span className="w-[150px] shrink-0">
                        {radicado ? (
                          <span className="text-meta text-ink-500">Radicado a tiempo</span>
                        ) : dias !== null ? (
                          <>
                            <span className="block font-mono text-[12px] text-ink-900">
                              {fechaLarga(e.venceEl as string)}
                            </span>
                            <span
                              className={`block font-mono text-[11px] ${
                                urge ? 'font-semibold text-danger' : 'text-ink-400'
                              }`}
                            >
                              {cuantoFalta(dias)}
                            </span>
                          </>
                        ) : (
                          <button
                            onClick={() => setEditando(e)}
                            className="text-meta text-brand-700 underline underline-offset-2"
                          >
                            Poner término
                          </button>
                        )}
                      </span>

                      <span className="w-[64px] shrink-0 font-mono text-[12px] text-ink-700">
                        v{e.version ?? 1}
                      </span>

                      <span className="w-[90px] shrink-0">
                        <span className="chip-neutral">
                          {e.estado ? ETIQUETA_ESTADO[e.estado] : 'Borrador'}
                        </span>
                      </span>

                      <span
                        className="w-[170px] shrink-0 truncate text-meta text-ink-500"
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
                      <span className="relative w-[28px] shrink-0">
                        <button
                          onClick={() => setMenuAbierto(menuAbierto === e.id ? null : e.id)}
                          aria-label="Acciones"
                          className="flex h-[26px] w-[26px] items-center justify-center rounded-control text-ink-400 hover:bg-canvas hover:text-ink-900"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {menuAbierto === e.id && (
                          <>
                            {/* Capa que cierra al tocar fuera, sin listeners globales. */}
                            <span
                              className="fixed inset-0 z-30"
                              onClick={() => setMenuAbierto(null)}
                            />
                            <span className="surface-raised absolute right-0 top-full z-40 mt-1 flex w-[196px] flex-col overflow-hidden py-1">
                              {!radicado && (
                                <button
                                  onClick={() => {
                                    setMenuAbierto(null);
                                    onAbrir(e);
                                  }}
                                  className="px-3 py-1.5 text-left text-ui text-ink-900 hover:bg-canvas"
                                >
                                  Abrir
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setMenuAbierto(null);
                                  setEditando(e);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-left text-ui text-ink-900 hover:bg-canvas"
                              >
                                <Pencil className="h-3.5 w-3.5 text-ink-400" />
                                Datos del proceso
                              </button>
                              <button
                                onClick={() => {
                                  setMenuAbierto(null);
                                  onDuplicar(e);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 text-left text-ui text-ink-900 hover:bg-canvas"
                              >
                                <Copy className="h-3.5 w-3.5 text-ink-400" />
                                Duplicar
                              </button>
                              {!radicado && (
                                <button
                                  onClick={() => {
                                    setMenuAbierto(null);
                                    void guardar(e.id, { estado: 'RADICADO' });
                                  }}
                                  className="flex items-center gap-2 px-3 py-1.5 text-left text-ui text-ink-900 hover:bg-canvas"
                                >
                                  <Stamp className="h-3.5 w-3.5 text-ink-400" />
                                  Marcar radicado
                                </button>
                              )}
                              {!radicado && (
                                <button
                                  onClick={() => {
                                    setMenuAbierto(null);
                                    setPorEliminar(e);
                                  }}
                                  className="flex items-center gap-2 border-t border-line-100 px-3 py-1.5 text-left text-ui text-danger hover:bg-canvas"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Eliminar
                                </button>
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
          borrador es la prueba de que se trabajó el caso.
        */}
        {savedDrafts.length > 0 && (
          <div className="card mt-2">
            <p className="text-ui font-medium text-ink-900">Ningún borrador se borra solo</p>
            <p className="mt-1 text-meta leading-[1.6] text-ink-500">
              Se conservan mientras la cuenta exista, incluso si el término ya venció. Eliminar es
              siempre la decisión de una persona.
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
            <button onClick={() => setPorEliminar(null)} className="btn-neutral btn-sm">
              Conservar
            </button>
            <button
              onClick={() => {
                if (porEliminar) onEliminar(porEliminar.id);
                setPorEliminar(null);
              }}
              className="btn-danger btn-sm"
            >
              Eliminar
            </button>
          </>
        }
      >
        <p className="text-ui text-ink-900">
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
          <button onClick={() => setAviso(null)} className="btn-primary btn-sm">
            Entendido
          </button>
        }
      >
        <p className="text-ui text-ink-900">{aviso}</p>
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
          <button onClick={onCerrar} className="btn-neutral btn-sm">
            Cancelar
          </button>
          <button
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
            className="btn-primary btn-sm"
            disabled={!cambio}
          >
            Guardar
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="field-label">Cliente o parte</span>
          <input
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Mosquera vs. Distrilácteos"
            className="field"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">Despacho</span>
          <input
            value={despacho}
            onChange={(e) => setDespacho(e.target.value)}
            placeholder="Juzgado 12 Laboral del Circuito"
            className="field"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">Radicado</span>
          <input
            value={radicado}
            onChange={(e) => setRadicado(e.target.value)}
            placeholder="11001310501220250014200"
            className="field font-mono"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">Vence el</span>
          <input
            type="date"
            value={venceEl}
            onChange={(e) => setVenceEl(e.target.value)}
            className="field"
          />
          <span className="text-meta text-ink-500">
            La fecha, no el término del catálogo. El catálogo dice «dentro de los diez (10) días
            siguientes»; solo usted sabe cuándo empezaron a correr. Si el escrito no caduca, déjelo
            vacío.
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="field-label">Estado</span>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoBorrador)}
            className="field"
          >
            <option value="BORRADOR">Borrador — se está escribiendo</option>
            <option value="REVISAR">Revisar — hay algo por comprobar</option>
            <option value="LISTO">Listo — revisado, sin radicar</option>
            <option value="RADICADO">Radicado — se llevó al juzgado</option>
          </select>
          {estado === 'RADICADO' && entrada?.estado !== 'RADICADO' && (
            <span className="notice">
              Al marcarlo radicado, su texto ya no se podrá modificar: pasa a ser la copia de lo
              que está en el expediente. Para seguir trabajando a partir de él, duplíquelo.
            </span>
          )}
        </label>
      </div>
    </Dialog>
  );
};
