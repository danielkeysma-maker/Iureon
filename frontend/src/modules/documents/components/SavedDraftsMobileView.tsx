import React from 'react';
import { PenLine } from 'lucide-react';
import { usePlanSoloLectura } from '../../subscriptions/PlanContext';
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
 * ─── LA CARA NUEVA ──────────────────────────────────────────────────────────
 *
 * Tarjetas de radio 14 sobre el gris del lienzo, letra desde 14 px y el
 * primario de 52 px abajo. La tarjeta urgente se marca con un borde CONTINUO
 * ámbar: el discontinuo significa «sin verificar» y lo lleva solo la píldora de
 * lo que falta de respaldo.
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
  /* Con el plan vencido se abre y se lee; redactar uno nuevo no se ofrece. */
  const soloLectura = usePlanSoloLectura();
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
    <div data-visita="vista-borradores" className="cara-nueva cn-bor flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {/*
        SIN TITULO PROPIO. `MobileHeader` ya pone «Borradores» con su contexto
        debajo, que es como 4d arma la cabecera —una sola—. Repetirlo aqui
        gastaba dos renglones de los 844 en decir dos veces lo mismo.
      */}
      <header className="cn-bor-movil-cabeza">
        <div className="cn-bor-movil-buscar-caja">
          <IconoBuscar className="h-4 w-4" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar borrador"
            aria-label="Buscar borrador"
            className="cn-campo cn-bor-movil-buscar"
          />
        </div>
      </header>

      <div className="cn-bor-movil-lista">
        {grupos.length === 0 ? (
          <p className="cn-bor-movil-vacio">
            {busqueda.trim()
              ? 'Ningún borrador coincide.'
              : 'Todavía no hay escritos guardados.'}
          </p>
        ) : (
          grupos.map((grupo) => (
            <section key={grupo.titulo}>
              <p className={`cn-bor-movil-rotulo ${grupo.urgente ? 'cn-bor-movil-rotulo--urge' : ''}`}>
                {grupo.titulo} · {grupo.entradas.length}
              </p>

              <ul className="cn-bor-movil-tarjetas">
                {grupo.entradas.map((e) => {
                  const dias = diasHasta(e.venceEl);
                  const radicado = esRadicado(e);
                  /*
                   * URGENTE ES DOS DÍAS O MENOS, y también lo vencido. Se
                   * marca solo cuando el plazo de verdad aprieta — un listado
                   * entero resaltado no señala nada.
                   */
                  const urge = !radicado && dias !== null && dias <= 2;

                  return (
                    <li key={e.id}>
                      <button
                        type="button"
                        onClick={() => onAbrir(e)}
                        className={`cn-bor-tarjeta ${urge ? 'cn-bor-tarjeta--urge' : ''}`}
                      >
                        <span className="cn-bor-tarjeta-textos">
                          <span className="cn-bor-tarjeta-titulo">
                            {e.draft.title || 'Escrito sin título'}
                          </span>
                          <span className="cn-bor-tarjeta-meta">
                            {[
                              e.cliente,
                              e.version ? `v${e.version}` : null,
                              radicado ? 'radicado' : ETIQUETA_ESTADO[e.estado ?? 'BORRADOR']
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        </span>

                        <span className="cn-bor-tarjeta-lado">
                          {radicado ? (
                            <span className="cn-bor-dias">Radicado</span>
                          ) : e.venceEl && dias !== null ? (
                            <>
                              <span className="cn-bor-tarjeta-fecha">{fechaCorta(e.venceEl)}</span>
                              <span className={`cn-bor-dias ${urge ? 'cn-bor-dias--urge' : ''}`}>
                                {cuantoFalta(dias)}
                              </span>
                            </>
                          ) : (
                            <span className="cn-bor-dias">Sin término</span>
                          )}

                          {/*
                            «2 sin verificar» de 10c, ahora con dato real: sale
                            de la procedencia congelada al redactar. Solo aparece
                            cuando hay algo que decir — un borrador con respaldo
                            completo no necesita una linea que lo diga.
                          */}
                          {faltaDeRespaldo(e) && <span className="cn-bor-sin">{faltaDeRespaldo(e)}</span>}
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
        EL PRIMARIO VIVE ABAJO, FIJO Y DE 52px. Es el destino táctil más fácil
        de acertar con el pulgar, y arriba competiría con el buscador —que es lo
        que de verdad se usa al entrar con treinta y cuatro escritos.
      */}
      {!soloLectura && (
        <div className="cn-bor-movil-pie">
          <button
            type="button"
            onClick={onRedactar}
            className="cn-ini-boton cn-ini-boton--primario cn-bor-movil-redactar"
          >
            <PenLine className="h-4 w-4" aria-hidden="true" />
            Redactar escrito
          </button>
        </div>
      )}
    </div>
  );
};
