import React from 'react';
import { Loader2 } from 'lucide-react';
import { IconoBuscar, IconoVolver } from '../../../design/ArtboardIcons';
import { useCatalogCuration } from '../hooks/useCatalogCuration';
import { VerificationForm } from './VerificationForm';
import { ActuacionDetail } from './ActuacionDetail';
import { InvitacionAVerificar } from './InvitacionAVerificar';
import { branchLabel } from '../branchLabels';
import { filaDelCatalogo } from '../estadoEnElCatalogo';
import type { Actuacion } from '../types';

/**
 * El Catálogo en el teléfono. Derivada: `app-buscador-catalogo.html` no trae
 * catálogo a 375 px, así que toma la anatomía del Buscador móvil del mismo
 * archivo (artboard 5: campo de 48, chips de 40+ que se desplazan, tarjetas de
 * radio 14) y la tabla del escritorio (artboard 3) convertida en tarjeta.
 *
 * ─── LA TABLA NO CABE Y NO SE INTENTA ───────────────────────────────────────
 *
 * Cuatro columnas en 375 px dejan el término en tres letras por renglón. La
 * tarjeta lleva lo mismo que la fila, en el orden en que se lee de pie en un
 * juzgado: nombre, la marca de la ficha prestada ANTES del término (o «sin
 * verificar» se leería como hueco de la rama), el término en grande, el
 * fundamento y el estado con la palabra de la doctrina. Lo que nadie verificó
 * lleva el borde discontinuo; nada más lo lleva.
 *
 * ─── DOS DEFECTOS CORREGIDOS AL VESTIRLA ────────────────────────────────────
 *
 * · REVERTIR NO LLEVABA LA RAMA. El escritorio revierte la curaduría de la
 *   rama en que se verificó; el teléfono llamaba `revert(id)` a secas, así que
 *   revertir una ficha prestada a familia retiraba la curaduría CIVIL de la
 *   misma ficha, que es otra y estaba bien.
 * · La ficha abierta se buscaba solo por id, y la misma ficha vive dos veces
 *   (propia y prestada): podía abrirse la curaduría de la otra rama.
 *
 * ─── LO QUE NO ESTÁ, con la razón ───────────────────────────────────────────
 *
 * · Retirar una actuación propia: vive en el escritorio, donde se ve la lista
 *   entera de la firma; un borrado a la firma entera no se ofrece en una
 *   tarjeta de teléfono sin esa vista.
 */

const mismaFicha = (a: Actuacion, b: Actuacion): boolean =>
  a.id === b.id && (a.porRemision?.paraRama ?? null) === (b.porRemision?.paraRama ?? null);

export const CatalogMobileView: React.FC = () => {
  const curation = useCatalogCuration();
  const [abierta, setAbierta] = React.useState<Actuacion | null>(null);
  const [verificando, setVerificando] = React.useState(false);

  // Se relee de la lista fresca tras cada guardado, no de una copia vieja.
  const actual = abierta
    ? [...curation.actuaciones, ...curation.todas].find((a) => mismaFicha(a, abierta)) ?? abierta
    : null;

  if (actual) {
    return (
      <div className="cara-nueva cn-cat cn-cat--movil flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <button
          type="button"
          onClick={() => {
            setVerificando(false);
            setAbierta(null);
          }}
          className="cn-cat-volver"
        >
          <IconoVolver className="h-4 w-4" />
          Catálogo
        </button>

        <div className="cn-cat-movil-detalle">
          <div>
            <p className="cn-cat-ficha-meta">{branchLabel(actual.porRemision?.paraRama ?? actual.branch)}</p>
            <h1 className="cn-cat-movil-titulo">{actual.exactName}</h1>
          </div>
          <InvitacionAVerificar actuacion={actual} onAnotar={() => setVerificando(true)} />
          <ActuacionDetail actuacion={actual} />
        </div>

        {/*
          EL BOTÓN NO SE VA CON EL SCROLL. Una ficha larga lo dejaba a novecientos
          píxeles del pliegue, y una acción que hay que ir a buscar no existe.
        */}
        <div className="cn-cat-pie-fijo">
          <button type="button" onClick={() => setVerificando(true)} className="cn-cat-boton cn-cat-boton--primario">
            {actual.verification ? 'Revisar la verificación' : 'Verificar el término'}
          </button>
        </div>

        {/*
          EL FORMULARIO SE ABRE COMO HOJA, NO SE APILA DEBAJO. Apilado, su alto
          completo competía con la ficha y lo único que encogía era el centro:
          un botón «Guardar» visible sobre un formulario invisible. En la hoja,
          cabecera y pie fijos y los campos con su propio desplazamiento. Alto en
          `dvh`: en un teléfono `vh` no descuenta la barra de direcciones.
        */}
        {verificando && (
          <div className="cn-cat-hoja-capa" role="dialog" aria-modal="true" aria-label="Verificar el término">
            <div className="cn-cat-velo" onClick={() => setVerificando(false)} aria-hidden="true" />
            <section className="cn-cat-hoja">
              <span className="cn-cat-asidero" aria-hidden="true" />
              <div className="min-h-0 min-w-0 flex-1">
                <VerificationForm
                  actuacion={actual}
                  isSaving={curation.isSaving}
                  error={curation.saveError}
                  onSave={curation.save}
                  onRevert={async (id, rama) => {
                    const listo = await curation.revert(id, rama);
                    if (listo) setVerificando(false);
                    return listo;
                  }}
                  onClose={() => setVerificando(false)}
                />
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  const hayBusqueda = curation.query.trim().length > 0;

  return (
    /*
      `min-w-0` Y LA FILA DE CHIPS: esta columna es un ítem flex y nace con
      `min-width: auto`. Medido con todas las ramas cargadas, ocupaba 826 px en un
      teléfono de 375 y la raíz recortaba las tarjetas. El desplazamiento de los
      chips solo funciona si su contenedor tiene permiso para encoger.
    */
    <div data-visita="vista-catalogo" className="cara-nueva cn-cat cn-cat--movil flex h-full min-h-0 min-w-0 flex-1 flex-col">
      {/* El título lo pone la cabecera móvil de la aplicación: una sola cabecera. */}
      <div className="cn-cat-cabeza">
        <label className="cn-cat-busqueda">
          <span className="sr-only">Buscar una actuación</span>
          <IconoBuscar className="cn-cat-campo-icono" />
          <input
            type="search"
            enterKeyHint="search"
            value={curation.query}
            onChange={(e) => curation.setQuery(e.target.value)}
            placeholder="Buscar una actuación o su norma"
            className="cn-cat-campo"
          />
        </label>

        {/* Los chips se desplazan DENTRO de su fila, nunca ensanchan la página. */}
        <div className="cn-cat-ramas">
          <button
            type="button"
            aria-pressed={curation.branchFilter === 'TODAS'}
            onClick={() => curation.setBranchFilter('TODAS')}
            className={`cn-cat-chip${curation.branchFilter === 'TODAS' ? ' cn-cat-chip--activa' : ''}`}
          >
            Todas
          </button>
          {curation.branches.map((b) => (
            <button
              key={b}
              type="button"
              aria-pressed={curation.branchFilter === b}
              onClick={() => curation.setBranchFilter(b)}
              className={`cn-cat-chip${curation.branchFilter === b ? ' cn-cat-chip--activa' : ''}`}
            >
              {branchLabel(b)}
            </button>
          ))}
        </div>
        <div className="cn-cat-ramas">
          <button
            type="button"
            aria-pressed={curation.onlyUnverified}
            onClick={() => curation.setOnlyUnverified(!curation.onlyUnverified)}
            className="cn-cat-chip cn-cat-chip--pendientes"
          >
            Solo sin verificar · {curation.pendientesEnElFiltro}
          </button>
        </div>
      </div>

      <div className="cn-cat-cuerpo">
        {curation.isLoading && (
          <p className="cn-cat-cargando">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Cargando el catálogo…
          </p>
        )}

        {!curation.isLoading && curation.loadError && (
          <div className="cn-cat-error" role="alert">
            <p>{curation.loadError}</p>
            <div className="cn-cat-acciones">
              <button type="button" onClick={() => void curation.reload()} className="cn-cat-boton cn-cat-boton--neutro">
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!curation.isLoading && !curation.loadError && curation.actuaciones.length === 0 && (
          <div className="cn-cat-vacio">
            <p className="cn-cat-vacio-titulo">Ninguna actuación coincide</p>
            <p>Cambie las palabras o elija otra rama.</p>
          </div>
        )}

        {!curation.isLoading && curation.actuaciones.length > 0 && (
          <>
            <p className="cn-cat-rotulo-lista">
              {curation.branchFilter === 'TODAS' ? 'Todas las ramas' : branchLabel(curation.branchFilter)} ·{' '}
              {curation.actuaciones.length} {hayBusqueda ? 'coincidencias' : 'actuaciones'}
            </p>
            <ul className="cn-cat-tarjetas">
              {curation.actuaciones.map((a) => {
                const fila = filaDelCatalogo(a);
                return (
                  <li key={`${a.id}:${a.porRemision?.paraRama ?? ''}`}>
                    <button
                      type="button"
                      onClick={() => setAbierta(a)}
                      className={`cn-cat-tarjeta${fila.estado.tono === 'sin' ? ' cn-cat-tarjeta--sin' : ''}`}
                    >
                      <span className="cn-cat-tarjeta-nombre">{a.exactName}</span>
                      {fila.marca && <span className="cn-cat-tarjeta-marca">{fila.marca}</span>}
                      <span className={`cn-cat-tarjeta-termino cn-cat-tono--${fila.termino.tono}`}>{fila.termino.texto}</span>
                      <span
                        className={`${fila.fundamento.mono ? 'cn-cat-tarjeta-cita' : 'cn-cat-tarjeta-fundamento'} cn-cat-tono--${fila.fundamento.tono}`}
                      >
                        {fila.fundamento.texto}
                      </span>
                      <span className="cn-cat-tarjeta-pie">
                        <span className={`cn-cat-sello cn-cat-sello--${fila.estado.tono}`}>
                          {fila.estado.tono === 'ok' && <span className="cn-cat-punto" aria-hidden="true" />}
                          {fila.estado.texto}
                        </span>
                        {a.verification && <span>Verificó {a.verification.verifiedBy}</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};
