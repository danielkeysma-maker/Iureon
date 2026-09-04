import React, { useMemo, useState } from 'react';
import { Copy, FileText, Lock, Search, Trash2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';

export type { SavedDraftEntry } from '../types';
import type { SavedDraftEntry } from '../types';

/**
 * Abrir un borrador. Diálogo tipo 4 —visor— en tamaño L.
 *
 * ─── EL MIEDO QUE RESUELVE EL SUBTÍTULO ─────────────────────────────────────
 *
 * Nadie abre una lista de borradores a mitad de un escrito si no sabe qué pasa
 * con lo que tiene delante. Por eso el subtítulo dice, antes que nada, que lo
 * que está en el panel YA QUEDÓ GUARDADO. Sin esa frase el botón se mira y no
 * se pulsa.
 *
 * ─── POR QUÉ LISTA A LA IZQUIERDA Y TEXTO A LA DERECHA ──────────────────────
 *
 * El nombre de un escrito jurídico no alcanza para reconocerlo: cinco casos
 * distintos pueden llamarse todos «Acción de tutela». Lo que distingue uno de
 * otro es el proceso, el término y el primer párrafo real. La versión anterior
 * de esta pantalla era una pila de tarjetas con 140 caracteres cortados a la
 * mitad de una palabra, y obligaba a abrir para saber si era el que se buscaba
 * — que es exactamente la acción que no se puede deshacer.
 *
 * ─── LO QUE ESTA PANTALLA NO INVENTA ────────────────────────────────────────
 *
 * El diseño mostraba «2 sin verificar» por escrito y un historial de versiones
 * con autor y hora de cada una. Ninguna de las dos cosas existe todavía en el
 * backend: no hay marcado por afirmación, y `saved_drafts` guarda el NÚMERO de
 * versión pero no las versiones anteriores. Poner esos datos aquí sería
 * inventar sobre un escrito que va a un juzgado. Se muestra la versión actual
 * con su autor y su hora, que sí son reales, y se dice en una línea que el
 * historial todavía no se conserva.
 */

interface SavedDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedDrafts: SavedDraftEntry[];
  onLoadDraft: (entry: SavedDraftEntry) => void;
  onDeleteDraft: (id: string) => void;
  /** Para el filtro «Míos». Sin él, ese filtro no se ofrece. */
  userEmail?: string;
  /** El cliente del escrito en curso, para el filtro «Este proceso». */
  procesoActual?: string | null;
}

type Filtro = 'PROCESO' | 'MIOS' | 'FIRMA';

/*
 * `vence_el` llega como 'YYYY-MM-DD'. `new Date('2025-05-03')` lo interpreta en
 * UTC y en Colombia (UTC-5) retrocede al día anterior: un término que vence hoy
 * se mostraría vencido ayer. Se parte la cadena a mano para construir la fecha
 * en la zona local.
 */
const aFechaLocal = (iso: string): Date => {
  const [a, m, d] = iso.split('-').map(Number);
  return new Date(a, (m ?? 1) - 1, d ?? 1);
};

const diasHasta = (iso: string | null | undefined): number | null => {
  if (!iso) return null;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dia = 24 * 60 * 60 * 1000;
  return Math.round((aFechaLocal(iso).getTime() - hoy.getTime()) / dia);
};

const enTexto = (iso: string): string =>
  aFechaLocal(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

/** «en 2 días», «vence hoy», «vencido hace 3 días». La frase que detiene la mano. */
const cuantoFalta = (dias: number): string => {
  if (dias < 0) return `vencido hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'vence hoy';
  if (dias === 1) return 'en 1 día';
  return `en ${dias} días`;
};

const ETIQUETA_ESTADO: Record<string, string> = {
  BORRADOR: 'Borrador',
  REVISAR: 'Revisar',
  LISTO: 'Listo',
  RADICADO: 'Radicado'
};

export const SavedDraftsModal: React.FC<SavedDraftsModalProps> = ({
  isOpen,
  onClose,
  savedDrafts,
  onLoadDraft,
  onDeleteDraft,
  userEmail,
  procesoActual
}) => {
  /*
   * El filtro por defecto es «Este proceso» y no «todos». Este diálogo se abre
   * desde un escrito en curso, y casi siempre se busca un hermano del mismo
   * caso. Cuando no se sabe de qué proceso es el escrito abierto, ese filtro no
   * puede funcionar y se cae a la firma entera en vez de mostrar una lista
   * vacía sin explicación.
   */
  const hayProceso = Boolean(procesoActual);
  const [filtro, setFiltro] = useState<Filtro>(hayProceso ? 'PROCESO' : 'FIRMA');
  const [busqueda, setBusqueda] = useState('');
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [porEliminar, setPorEliminar] = useState<SavedDraftEntry | null>(null);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return savedDrafts.filter((e) => {
      if (filtro === 'PROCESO' && procesoActual && e.cliente !== procesoActual) return false;
      if (filtro === 'MIOS' && userEmail && e.autor !== userEmail) return false;

      if (!q) return true;
      // Se busca por lo que un abogado recuerda: el caso, el juzgado, el número.
      return [e.draft.title, e.cliente, e.despacho, e.radicado]
        .filter(Boolean)
        .some((campo) => (campo as string).toLowerCase().includes(q));
    });
  }, [savedDrafts, filtro, procesoActual, userEmail, busqueda]);

  /*
   * TRES GRUPOS, Y EL ORDEN ES EL DEL RIESGO.
   *
   * Lo que vence esta semana primero, lo demás después, y lo radicado al final
   * —ya no corre ningún plazo—. La lista plana ordenada por fecha de edición
   * ponía arriba lo que se tocó esta mañana, que es justo lo que no urge.
   */
  const grupos = useMemo(() => {
    const semana: SavedDraftEntry[] = [];
    const adelante: SavedDraftEntry[] = [];
    const radicados: SavedDraftEntry[] = [];

    for (const e of visibles) {
      if (e.estado === 'RADICADO' || e.radicadoEl) {
        radicados.push(e);
        continue;
      }
      const d = diasHasta(e.venceEl);
      if (d !== null && d <= 7) semana.push(e);
      else adelante.push(e);
    }

    const porTermino = (a: SavedDraftEntry, b: SavedDraftEntry) => {
      const da = diasHasta(a.venceEl);
      const db = diasHasta(b.venceEl);
      if (da === null && db === null) return 0;
      if (da === null) return 1; // Sin fecha va al final: no caduca.
      if (db === null) return -1;
      return da - db;
    };

    semana.sort(porTermino);
    adelante.sort(porTermino);

    return [
      { titulo: 'Vence esta semana', entradas: semana },
      { titulo: 'Más adelante', entradas: adelante },
      { titulo: 'Radicados', entradas: radicados }
    ].filter((g) => g.entradas.length > 0);
  }, [visibles]);

  const activo = visibles.find((e) => e.id === seleccionado) ?? visibles[0] ?? null;
  const estaRadicado = Boolean(activo && (activo.estado === 'RADICADO' || activo.radicadoEl));
  const sinRadicar = savedDrafts.filter((e) => e.estado !== 'RADICADO' && !e.radicadoEl).length;

  const abrir = (entrada: SavedDraftEntry) => {
    onLoadDraft(entrada);
    onClose();
  };

  const duplicar = (entrada: SavedDraftEntry) => {
    /*
     * Duplicar es la única forma de continuar a partir de un escrito radicado:
     * el original queda intacto en el expediente y la copia nace como borrador
     * nuevo. Va sin `id`, así que el panel la guardará como otro escrito.
     */
    onLoadDraft({
      ...entrada,
      id: '',
      estado: 'BORRADOR',
      radicadoEl: null,
      radicado: null,
      version: 1,
      draft: { ...entrada.draft, title: `${entrada.draft.title} (copia)` }
    });
    onClose();
  };

  const filtros: Array<{ clave: Filtro; texto: string; visible: boolean }> = [
    { clave: 'PROCESO', texto: 'Este proceso', visible: hayProceso },
    { clave: 'MIOS', texto: 'Míos', visible: Boolean(userEmail) },
    { clave: 'FIRMA', texto: 'De la firma', visible: true }
  ];

  return (
    <>
      <Dialog
        abierto={isOpen}
        onCerrar={onClose}
        tamano="L"
        titulo="Abrir un borrador"
        subtitulo={
          <>
            {sinRadicar} sin radicar ·{' '}
            {/* La frase que resuelve el miedo: nada de lo que hay en el panel se pierde. */}
            <span className="text-ink-500">
              lo que abra reemplaza lo que tiene en el panel, que ya quedó guardado
            </span>
          </>
        }
        pieIzquierda={
          <span className="font-mono text-[11px]">
            Esc cierra{activo ? ' · doble clic abre' : ''}
          </span>
        }
        acciones={
          activo ? (
            <>
              <button
                onClick={() => setPorEliminar(activo)}
                className="btn-danger btn-sm"
                disabled={estaRadicado}
                title={
                  estaRadicado
                    ? 'Un escrito radicado no se elimina: es la copia de lo que está en el expediente.'
                    : undefined
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </button>
              <button onClick={() => duplicar(activo)} className="btn-neutral btn-sm">
                <Copy className="h-3.5 w-3.5" />
                Duplicar
              </button>
              <button
                onClick={() => abrir(activo)}
                className="btn-primary btn-sm"
                disabled={estaRadicado}
                title={
                  estaRadicado
                    ? 'Radicado: se consulta y se duplica, nunca se continúa.'
                    : undefined
                }
              >
                Abrir en el panel
              </button>
            </>
          ) : null
        }
      >
        {savedDrafts.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <FileText className="h-8 w-8 text-ink-400" />
            <p className="text-ui text-ink-900">Todavía no hay borradores guardados.</p>
            <p className="max-w-sm text-meta text-ink-500">
              Cuando redacte un escrito en el panel, «Guardar» lo deja aquí con su término y su
              proceso, para retomarlo días después.
            </p>
          </div>
        ) : (
          <div className="flex h-full min-h-0 gap-4">
            {/* ─── LISTA ─────────────────────────────────────────────────── */}
            <div className="flex w-[340px] min-w-0 shrink-0 flex-col gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Caso, juzgado o radicado…"
                  className="field w-full pl-8"
                />
              </div>

              <div className="flex items-center gap-1">
                {filtros
                  .filter((f) => f.visible)
                  .map((f) => (
                    <button
                      key={f.clave}
                      onClick={() => setFiltro(f.clave)}
                      className={`rounded-control px-2 py-1 text-[12px] font-medium ${
                        filtro === f.clave
                          ? 'bg-brand-700 text-white'
                          : 'bg-canvas text-ink-500 hover:text-ink-900'
                      }`}
                    >
                      {f.texto}
                    </button>
                  ))}
                <span className="ml-auto font-mono text-[11px] text-ink-400">
                  {visibles.length} de {savedDrafts.length}
                </span>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto rounded-card border border-line-200 bg-surface">
                {visibles.length === 0 && (
                  <p className="px-3 py-4 text-meta text-ink-500">
                    Ninguno coincide con ese filtro.
                  </p>
                )}

                {grupos.map((grupo) => (
                  <div key={grupo.titulo}>
                    <p className="sticky top-0 z-10 border-b border-line-100 bg-canvas px-3 py-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                      {grupo.titulo}
                    </p>

                    {grupo.entradas.map((e) => {
                      const dias = diasHasta(e.venceEl);
                      const radicado = e.estado === 'RADICADO' || Boolean(e.radicadoEl);
                      const urge = dias !== null && dias <= 2;

                      return (
                        <button
                          key={e.id}
                          onClick={() => setSeleccionado(e.id)}
                          onDoubleClick={() => !radicado && abrir(e)}
                          className={`flex w-full items-start gap-2 border-b border-line-100 px-3 py-2 text-left last:border-0 ${
                            activo?.id === e.id ? 'bg-brand-50' : 'hover:bg-canvas'
                          } ${radicado ? 'opacity-60' : ''}`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              {radicado && (
                                <Lock className="h-3 w-3 shrink-0 text-ink-400" strokeWidth={2.4} />
                              )}
                              <span className="min-w-0 truncate text-ui text-ink-900">
                                {e.draft.title}
                              </span>
                            </span>
                            <span className="mt-0.5 block truncate font-mono text-[11px] text-ink-500">
                              {[e.cliente, e.version ? `v${e.version}` : null, e.savedAt]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </span>

                          <span className="shrink-0 text-right">
                            {radicado ? (
                              <span className="chip-neutral">Radicado</span>
                            ) : dias !== null ? (
                              <>
                                <span className="block font-mono text-[11px] text-ink-900">
                                  {enTexto(e.venceEl as string)}
                                </span>
                                <span
                                  className={`block font-mono text-[10.5px] ${
                                    urge ? 'font-semibold text-danger' : 'text-ink-400'
                                  }`}
                                >
                                  {cuantoFalta(dias)}
                                </span>
                              </>
                            ) : (
                              <span className="font-mono text-[10.5px] text-ink-400">
                                Sin término
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* ─── VISTA PREVIA ──────────────────────────────────────────── */}
            <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-y-auto">
              {activo && (
                <>
                  <div>
                    <h3 className="text-subtitle text-ink-900">{activo.draft.title}</h3>
                    <p className="mt-0.5 text-meta text-ink-500">
                      {[activo.cliente, activo.despacho].filter(Boolean).join(' · ') ||
                        'Sin proceso asociado'}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {activo.estado && (
                        <span className="chip-neutral">
                          {ETIQUETA_ESTADO[activo.estado] ?? activo.estado}
                        </span>
                      )}
                      {activo.venceEl && (
                        <span className="font-mono text-[11px] text-ink-500">
                          Vence {enTexto(activo.venceEl)} ·{' '}
                          {cuantoFalta(diasHasta(activo.venceEl) as number)}
                        </span>
                      )}
                      {activo.radicado && (
                        <span className="font-mono text-[11px] text-ink-500">
                          Rad. {activo.radicado}
                        </span>
                      )}
                    </div>
                  </div>

                  {estaRadicado && (
                    <div className="notice">
                      Este escrito se radicó
                      {activo.radicadoEl
                        ? ` el ${new Date(activo.radicadoEl).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}`
                        : ''}
                      . Su texto ya no se puede modificar: es la copia de lo que está en el
                      expediente. Para seguir a partir de él, duplíquelo.
                    </div>
                  )}

                  {/*
                    EL PRIMER PÁRRAFO REAL, no un recorte de 140 caracteres.
                    Es lo que permite reconocer un escrito sin abrirlo.
                  */}
                  <div className="paper-canvas min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap text-body leading-[1.7]">
                    {activo.draft.legalText.slice(0, 2400)}
                    {activo.draft.legalText.length > 2400 && '…'}
                  </div>

                  <div className="rounded-card border border-line-200 bg-canvas px-3 py-2">
                    <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                      Versión
                    </p>
                    <p className="mt-1 text-meta text-ink-900">
                      v{activo.version ?? 1}
                      {activo.autor ? ` · ${activo.autor}` : ''}
                      {activo.editadoPor && activo.editadoPor !== activo.autor
                        ? ` · editado por ${activo.editadoPor}`
                        : ''}{' '}
                      · {activo.savedAt}
                    </p>
                    {/*
                      NO SE LISTAN LAS ANTERIORES PORQUE NO SE GUARDAN.
                      `saved_drafts` conserva el número de versión, no el texto de
                      cada una. Mostrar «v3 · ayer 16:48» aquí sería inventar un
                      historial sobre un escrito que va a un juzgado.
                    */}
                    <p className="mt-1 text-meta text-ink-400">
                      Las versiones anteriores todavía no se conservan: se guarda el número, no el
                      texto de cada una.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/*
        LA ÚNICA EXCEPCIÓN A «NUNCA UN DIÁLOGO SOBRE OTRO».
        Eliminar es irreversible y para toda la firma; sacar al abogado de la
        lista para preguntárselo le haría perder dónde estaba.
      */}
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
                if (porEliminar) onDeleteDraft(porEliminar.id);
                setPorEliminar(null);
                setSeleccionado(null);
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

        {/* El dato que puede detener la mano, y por eso va aquí y no en la lista. */}
        {porEliminar?.venceEl && (
          <p className="notice mt-3">
            Este escrito tiene un término que vence{' '}
            {cuantoFalta(diasHasta(porEliminar.venceEl) as number)} y no se ha radicado.
          </p>
        )}
      </Dialog>
    </>
  );
};
