import React from 'react';
import { PenLine } from 'lucide-react';
import { IconoBuscar } from '../../../design/ArtboardIcons';
import {
  ETIQUETA_ESTADO,
  agruparPorTermino,
  cuantoFalta,
  diasHasta,
  esRadicado,
  faltaDeRespaldo,
  fechaCorta
} from '../draftTerms';
import type { SavedDraftEntry } from '../types';

/**
 * Borradores en móvil. Artboard 10c — pensada para el teléfono, no derivada.
 *
 * ─── POR QUÉ NO ES LA TABLA DE 10a CON COLUMNAS ESTRECHAS ───────────────────
 *
 * La de escritorio es una tabla: escrito, término, versión, estado y última
 * edición, cada uno en su columna, para comparar treinta y cuatro escritos de
 * un vistazo. Esas cinco columnas suman más de 500px; en 375 se envuelven y
 * quedan cinco datos sueltos sin rótulo, que es peor que no mostrarlos.
 *
 * 10c hace otra cosa: **una fila por escrito, con lo que decide si hay que
 * abrirlo ahora** — el término y cuánto falta, arriba a la derecha y en grande.
 * Versión y última edición bajan a una línea gris debajo del nombre, porque son
 * contexto y no decisión. Estado y «sin verificar» solo aparecen cuando dicen
 * algo.
 *
 * ─── LO QUE SÍ SE HEREDA, Y A PROPÓSITO ─────────────────────────────────────
 *
 * El agrupamiento y el cálculo de días vienen de `draftTerms`, el mismo módulo
 * que usa la de escritorio. Dos pantallas que contradigan la fecha de
 * vencimiento del mismo escrito —porque una redondea distinto— es el defecto
 * más caro que este producto podría tener. La forma cambia; el reloj no.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · Los filtros «De la firma / Estado / Orden» de 10a. En móvil el orden ya es
 *   el único que importa —término más próximo— y viene impuesto por los grupos;
 *   ofrecer un selector de orden que solo tiene una respuesta útil es un
 *   control muerto. El buscador por texto sí está, que es el que se usa de pie.
 * · Exportar a CSV y las acciones de duplicar y eliminar. Son de escritorio en
 *   el artboard y aquí también: 10c muestra «Abrir» y nada más, porque en el
 *   teléfono se consulta y se abre, no se administra.
 */

interface SavedDraftsMobileViewProps {
  savedDrafts: SavedDraftEntry[];
  onAbrir: (entry: SavedDraftEntry) => void;
  onRedactar: () => void;
}

export const SavedDraftsMobileView: React.FC<SavedDraftsMobileViewProps> = ({
  savedDrafts,
  onAbrir,
  onRedactar
}) => {
  const [busqueda, setBusqueda] = React.useState('');

  const visibles = React.useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return savedDrafts;
    return savedDrafts.filter((e) =>
      [e.draft.title, e.cliente, e.despacho, e.radicado, e.draft.documentType]
        .filter(Boolean)
        .some((c) => String(c).toLowerCase().includes(q))
    );
  }, [savedDrafts, busqueda]);

  const grupos = React.useMemo(() => agruparPorTermino(visibles), [visibles]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas">
      {/*
        SIN TITULO PROPIO. `MobileHeader` ya pone «Borradores» con su contexto
        debajo, que es como 4d arma la cabecera —una sola—. Repetirlo aqui
        gastaba dos renglones de los 844 en decir dos veces lo mismo.
      */}
      <header className="shrink-0 border-b border-line-200 bg-surface px-4 py-3">
        <div className="relative">
          <IconoBuscar className="pointer-events-none absolute left-3 top-[11px] h-3.5 w-3.5 text-ink-400" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar borrador"
            className="field h-[38px] w-full pl-9"
          />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {grupos.length === 0 ? (
          <p className="px-4 py-16 text-center text-[12.5px] text-ink-500">
            {busqueda.trim()
              ? 'Ningún borrador coincide.'
              : 'Todavía no hay escritos guardados.'}
          </p>
        ) : (
          grupos.map((grupo) => (
            <section key={grupo.titulo}>
              <p
                className={`px-4 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] ${
                  grupo.urgente ? 'text-danger' : 'text-ink-400'
                }`}
              >
                {grupo.titulo} · {grupo.entradas.length}
              </p>

              <ul className="space-y-2 px-3">
                {grupo.entradas.map((e) => {
                  const dias = diasHasta(e.venceEl);
                  const radicado = esRadicado(e);
                  /*
                   * URGENTE ES DOS DÍAS O MENOS, y también lo vencido. El rojo
                   * de este producto significa destructivo o grabando, así que
                   * aquí se usa solo cuando el plazo de verdad aprieta — un
                   * listado entero en rojo no señala nada.
                   */
                  const urge = !radicado && dias !== null && dias <= 2;

                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => onAbrir(e)}
                        className={`flex w-full items-start gap-3 rounded-card border bg-surface px-3.5 py-3 text-left ${
                          urge
                            ? 'border-[rgb(var(--danger)/0.35)]'
                            : 'border-line-200'
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-[13px] font-medium leading-tight text-ink-900">
                            {e.draft.title || 'Escrito sin título'}
                          </span>
                          <span className="mt-1 block text-[11.5px] leading-snug text-ink-500">
                            {[
                              e.cliente,
                              e.version ? `v${e.version}` : null,
                              radicado ? 'radicado' : ETIQUETA_ESTADO[e.estado ?? 'BORRADOR']
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </span>

                        <span className="shrink-0 text-right">
                          {radicado ? (
                            <span className="block text-[11.5px] text-ink-500">Radicado</span>
                          ) : e.venceEl && dias !== null ? (
                            <>
                              <span className="block text-[13px] font-semibold leading-none text-ink-900">
                                {fechaCorta(e.venceEl)}
                              </span>
                              <span
                                className={`mt-1 block text-[11px] leading-none ${
                                  urge ? 'font-semibold text-danger' : 'text-ink-500'
                                }`}
                              >
                                {cuantoFalta(dias)}
                              </span>
                            </>
                          ) : (
                            <span className="block text-[11.5px] text-ink-500">Sin término</span>
                          )}

                          {/*
                            «2 sin verificar» de 10c, ahora con dato real: sale
                            de la procedencia congelada al redactar. Solo aparece
                            cuando hay algo que decir — un borrador con respaldo
                            completo no necesita una linea que lo diga.
                          */}
                          {faltaDeRespaldo(e) && (
                            <span className="mt-1 block text-[11px] leading-tight text-unverified">
                              {faltaDeRespaldo(e)}
                            </span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      {/*
        EL PRIMARIO VIVE ABAJO, FIJO Y DE 48px (4d). Es el destino táctil más
        fácil de acertar con el pulgar, y arriba competiría con el buscador —
        que es lo que de verdad se usa al entrar con treinta y cuatro escritos.
      */}
      <div className="shrink-0 border-t border-line-200 bg-surface px-3 py-2.5">
        <button
          type="button"
          onClick={onRedactar}
          className="btn-primary flex h-12 w-full items-center justify-center gap-2"
        >
          <PenLine className="h-4 w-4" />
          Redactar escrito
        </button>
      </div>
    </div>
  );
};
