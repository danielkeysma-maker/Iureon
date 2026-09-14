import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { IconoBuscar } from '../../../design/ArtboardIcons';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { firmActuacionesApi } from '../services/catalog.api';
import { useCatalogCuration } from '../hooks/useCatalogCuration';
import { VerificationForm } from './VerificationForm';
import { ActuacionDetail } from './ActuacionDetail';
import { InvitacionAVerificar } from './InvitacionAVerificar';
import { branchLabel } from '../branchLabels';
import { censoDelCatalogo, filaDelCatalogo } from '../estadoEnElCatalogo';
import { esTituloDeTrabajo } from '../tituloDeTrabajo';
import type { Actuacion, ActuacionRole } from '../types';

/**
 * El Catálogo de escritorio. Artboard 3 de `public/handoff/app-buscador-catalogo.html`:
 * cabecera con el censo a la derecha, buscador, ramas en chips con «ver todas»,
 * el filtro de lo que falta por verificar, y la TABLA de cuatro columnas
 * —actuación, término, fundamento, estado—.
 *
 * ─── LA FICHA PASA DE PANEL LATERAL A DIÁLOGO (derivada) ────────────────────
 *
 * La tabla ocupa el ancho entero: un panel fijo de 460 px al lado la dejaba en
 * dos columnas y el término —lo que se viene a consultar— se cortaba. La ficha
 * se abre con la anatomía del artboard 2 (ficha de providencia, 860 px:
 * cabecera con la cita, cuerpo en prosa, pie gris con las acciones) y, cuando
 * el término está sin verificar, con la tarjeta ámbar del artboard 4 arriba. La
 * verificación ocurre DENTRO de la misma ficha, sin perder de vista de qué
 * actuación se trata.
 *
 * ─── LAS CIFRAS SE CUENTAN ──────────────────────────────────────────────────
 *
 * La maqueta imprime «883 actuaciones de 28 ramas» y «550 con artículo
 * comprobado». Aquí salen de `censoDelCatalogo`, y la cifra de la derecha dice
 * «con término verificado»: lo que el catálogo verifica es el término, y el
 * artículo del fundamento se publica como lo trae la ficha. Llamarlo «artículo
 * comprobado» sería afirmar lo que nadie comprobó.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · Las ramas con su conteo en el chip: el catálogo no se pide por rama al
 *   cargar (una sola lista), así que cada chip lo contaría sobre la lista
 *   visible y cambiaría al buscar. No aporta y confunde.
 * · Verificar sección por sección e historia de curaduría: ver `ActuacionDetail`.
 */

const ROLES: Record<ActuacionRole, string> = {
  LITIGANTE: 'Litigante',
  DESPACHO: 'Despacho',
  SECRETARIA: 'Secretaría'
};

/* Cinco a la vista y el resto a un clic: veintitantos chips en fila son una pared. */
const RAMAS_A_LA_VISTA = 5;

/*
 * La misma ficha puede estar dos veces en la lista: como propia de su rama y
 * como prestada a otra. Son dos curadurías distintas y se distinguen así.
 */
const mismaFicha = (a: Actuacion, b: Actuacion): boolean =>
  a.id === b.id && (a.porRemision?.paraRama ?? null) === (b.porRemision?.paraRama ?? null);
const claveDe = (a: Actuacion): string => `${a.id}:${a.porRemision?.paraRama ?? ''}`;

type Modo = 'ficha' | 'verificar';

export const CatalogCurationView: React.FC = () => {
  const curation = useCatalogCuration();
  const [selected, setSelected] = useState<Actuacion | null>(null);
  const [modo, setModo] = useState<Modo>('ficha');
  const [verTodasLasRamas, setVerTodasLasRamas] = useState(false);
  /** Retirar una actuación propia se pregunta: se la quita a toda la firma. */
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const [errorPropia, setErrorPropia] = useState<string | null>(null);
  const panel = useRef<HTMLElement>(null);
  const hayConfirmacion = useRef(false);
  hayConfirmacion.current = confirmacion !== null;

  const censo = censoDelCatalogo(curation.todas, curation.branches);

  // Sigue el filtro de rama: leer las advertencias de todas a la vez es no leer ninguna.
  const huecos = curation.meta
    .filter((m) => curation.branchFilter === 'TODAS' || m.branch === curation.branchFilter)
    .flatMap((m) => m.gaps.map((text) => ({ branch: m.branch, text })));

  /*
   * La lista se recarga tras cada escritura, así que la ficha abierta se relee
   * de los datos frescos. Se busca también en el catálogo sin filtros: con
   * «solo sin verificar» activo, la ficha recién verificada sale de la lista
   * visible y la ficha quedaría mostrando la copia vieja.
   */
  const abierta = selected
    ? [...curation.actuaciones, ...curation.todas].find((a) => mismaFicha(a, selected)) ?? selected
    : null;

  const cerrar = () => {
    setSelected(null);
    setModo('ficha');
    setErrorPropia(null);
  };

  const claveAbierta = abierta ? claveDe(abierta) : null;
  useEffect(() => {
    if (!claveAbierta) return;
    panel.current?.focus();
    const alPulsar = (e: KeyboardEvent) => {
      /* Con la confirmación encima, Esc es de ella: cerrar las dos a la vez perdería la ficha. */
      if (e.key === 'Escape' && !hayConfirmacion.current) cerrar();
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [claveAbierta]);

  const ramasVisibles = verTodasLasRamas
    ? curation.branches
    : curation.branches.filter(
        (b, i) => i < RAMAS_A_LA_VISTA || b === curation.branchFilter
      );

  return (
    <div data-visita="vista-catalogo" className="cara-nueva cn-cat cn-cat-dialogos flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="cn-cat-cabeza">
        <div className="cn-cat-titular">
          <div className="min-w-0">
            <h1 className="cn-cat-h1">Catálogo</h1>
            <p className="cn-cat-bajada">
              {curation.isLoading || censo.total === 0
                ? 'Las actuaciones con su término, su norma y su autoridad.'
                : `${censo.total} actuaciones en ${censo.ramas} ${censo.ramas === 1 ? 'rama' : 'ramas'}. Lo que su firma verifica aquí queda para todos sus escritos: se verifica una vez, no documento por documento.`}
            </p>
          </div>
          {!curation.isLoading && censo.total > 0 && (
            <div className="cn-cat-cifra">
              <div className="cn-cat-cifra-numero">{censo.conTerminoVerificado}</div>
              <div className="cn-cat-cifra-rotulo">con término verificado</div>
            </div>
          )}
        </div>

        {curation.curation === 'UNAVAILABLE' && (
          <p className="cn-cat-aviso cn-cat-aviso--peligro" role="status">
            No se pudieron leer las verificaciones de su firma. Lo que ve es el catálogo base: puede no incluir correcciones
            que su firma ya hizo. No lo tome como vigente.
          </p>
        )}
        {curation.curation === 'NOT_CONFIGURED' && (
          <p className="cn-cat-aviso" role="status">
            La base de datos no está configurada, así que las verificaciones no pueden guardarse todavía. Puede consultar el
            catálogo base.
          </p>
        )}

        {/*
          LO QUE EL CATÁLOGO DECLARA QUE NO CUBRE. Dejarlo en un archivo de
          investigación haría parecer completo el catálogo.
        */}
        {huecos.length > 0 && (
          <details className="cn-cat-huecos">
            <summary>
              Lo que este catálogo no cubre · {huecos.length} {huecos.length === 1 ? 'advertencia' : 'advertencias'}
            </summary>
            <ul>
              {huecos.map((h) => (
                <li key={h.branch + h.text}>
                  <span className="cn-cat-hueco-rama">{branchLabel(h.branch)}</span>
                  {h.text}
                </li>
              ))}
            </ul>
          </details>
        )}

        <label className="cn-cat-busqueda">
          <span className="sr-only">Buscar una actuación</span>
          <IconoBuscar className="cn-cat-campo-icono" />
          <input
            type="search"
            value={curation.query}
            onChange={(e) => curation.setQuery(e.target.value)}
            placeholder="Buscar una actuación por su nombre o su norma"
            className="cn-cat-campo"
          />
        </label>

        <div className="cn-cat-ramas">
          <button
            type="button"
            aria-pressed={curation.branchFilter === 'TODAS'}
            onClick={() => curation.setBranchFilter('TODAS')}
            className={`cn-cat-chip${curation.branchFilter === 'TODAS' ? ' cn-cat-chip--activa' : ''}`}
          >
            Todas
          </button>
          {ramasVisibles.map((b) => (
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
          {curation.branches.length > RAMAS_A_LA_VISTA && (
            <button
              type="button"
              aria-expanded={verTodasLasRamas}
              onClick={() => setVerTodasLasRamas((v) => !v)}
              className="cn-cat-chip cn-cat-chip--mas"
            >
              {verTodasLasRamas ? 'Ver menos ramas' : `Ver las ${curation.branches.length} ramas`}
            </button>
          )}
          <button
            type="button"
            aria-pressed={curation.onlyUnverified}
            onClick={() => curation.setOnlyUnverified(!curation.onlyUnverified)}
            className="cn-cat-chip cn-cat-chip--pendientes"
          >
            Solo las que faltan por verificar · {curation.pendientesEnElFiltro}
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
            <p>Cambie las palabras de la búsqueda o elija otra rama.</p>
          </div>
        )}

        {!curation.isLoading && curation.actuaciones.length > 0 && (
          <>
            <div className="cn-cat-tabla-cabeza" aria-hidden="true">
              <span>Actuación</span>
              <span>Término</span>
              <span className="cn-cat-col-fundamento">Fundamento</span>
              <span>Estado</span>
            </div>
            <ul className="cn-cat-filas">
              {curation.actuaciones.map((a) => {
                const fila = filaDelCatalogo(a);
                const sub = [
                  fila.marca ?? (a.firmDefined ? 'Añadida por su firma' : a.competentAuthority ?? 'Autoridad no declarada'),
                  a.verification ? 'Verificó su firma' : null
                ]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <li key={claveDe(a)}>
                    <button
                      type="button"
                      className="cn-cat-fila"
                      onClick={() => {
                        setSelected(a);
                        setModo('ficha');
                      }}
                    >
                      <span className="cn-cat-fila-nombre">
                        <span className="cn-cat-fila-titulo">{a.exactName}</span>
                        <span className="cn-cat-fila-sub">{sub}</span>
                      </span>
                      <span className={`cn-cat-fila-termino cn-cat-tono--${fila.termino.tono}`}>{fila.termino.texto}</span>
                      <span
                        className={`cn-cat-col-fundamento ${fila.fundamento.mono ? 'cn-cat-fila-cita' : 'cn-cat-fila-fundamento'} cn-cat-tono--${fila.fundamento.tono}`}
                      >
                        {fila.fundamento.texto}
                      </span>
                      <span>
                        <span className={`cn-cat-sello cn-cat-sello--${fila.estado.tono}`}>
                          {fila.estado.tono === 'ok' && <span className="cn-cat-punto" aria-hidden="true" />}
                          {fila.estado.texto}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="cn-cat-pie-nota">
              «Sin verificar» no quiere decir que la actuación no exista: quiere decir que nadie ha leído su término en el
              texto oficial. Su firma puede verificarlo y esa verificación queda con su nombre. «Término verificado» se
              refiere al plazo; el artículo del fundamento se muestra como lo trae la ficha.
            </p>
          </>
        )}
      </div>

      {abierta && (
        <div className="cn-cat-ficha" role="dialog" aria-modal="true" aria-label={abierta.exactName}>
          <div className="cn-cat-velo" onClick={cerrar} aria-hidden="true" />
          <section ref={panel} tabIndex={-1} className="cn-cat-ficha-panel">
            <header className="cn-cat-ficha-cabeza">
              <div className="min-w-0">
                <p className="cn-cat-ficha-meta">
                  {[
                    branchLabel(abierta.porRemision?.paraRama ?? abierta.branch),
                    ROLES[abierta.role],
                    modo === 'verificar' ? 'Verificar el término' : null
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <h2 className="cn-cat-ficha-titulo">{abierta.exactName}</h2>
              </div>
              <button type="button" aria-label="Cerrar" className="cn-cat-cerrar" onClick={cerrar}>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>

            {modo === 'verificar' ? (
              <div className="cn-cat-ficha-contenido">
                <VerificationForm
                  actuacion={abierta}
                  conResumen={false}
                  conCabecera={false}
                  isSaving={curation.isSaving}
                  error={curation.saveError}
                  onSave={curation.save}
                  onRevert={async (id, rama) => {
                    const hecho = await curation.revert(id, rama);
                    if (hecho) setModo('ficha');
                    return hecho;
                  }}
                  onClose={() => setModo('ficha')}
                />
              </div>
            ) : (
              <>
                <div className="cn-cat-ficha-cuerpo">
                  {esTituloDeTrabajo(abierta.exactName) && (
                    <p className="cn-cat-sobre">
                      Es un título de trabajo: describe lo que el escrito debe lograr, en palabras de su firma. No es el
                      nombre de una figura del derecho, y por eso no trae artículo, término ni autoridad.
                    </p>
                  )}

                  {/*
                    LO QUE ESTA PANTALLA LE APORTA A UNA ACTUACIÓN PROPIA: nació
                    sin norma y aquí deja de estarlo, con el MISMO formulario con
                    que se cura una ficha de fábrica.
                  */}
                  {abierta.firmDefined && (
                    <div className="cn-cat-propia">
                      <p>
                        Esta actuación la añadió su firma; el catálogo no la trae.{' '}
                        {abierta.term.status === 'NO_VERIFICADO'
                          ? 'Ninguna norma verificada la respalda.'
                          : 'El término que lleva lo verificó su firma, no el catálogo.'}
                      </p>
                      {errorPropia && (
                        <p className="cn-cat-error" role="alert">
                          {errorPropia}
                        </p>
                      )}
                      <div className="cn-cat-acciones">
                        <button
                          type="button"
                          className="cn-cat-boton cn-cat-boton--peligro"
                          onClick={() =>
                            setConfirmacion({
                              titulo: 'Retirar la actuación de la lista',
                              texto: (
                                <>
                                  «{abierta.exactName}» dejará de ofrecerse en esta rama a todos los abogados de su firma.
                                  Los escritos ya redactados con ella no cambian.
                                </>
                              ),
                              etiqueta: 'Retirar',
                              peligro: true,
                              onConfirmar: async () => {
                                setErrorPropia(null);
                                try {
                                  await firmActuacionesApi.eliminar(abierta.id);
                                  cerrar();
                                  await curation.reload();
                                } catch (e) {
                                  setErrorPropia(e instanceof Error ? e.message : 'No se pudo retirar la actuación.');
                                }
                              }
                            })
                          }
                        >
                          Retirar de la lista de la firma
                        </button>
                      </div>
                    </div>
                  )}

                  <InvitacionAVerificar actuacion={abierta} onAnotar={() => setModo('verificar')} />

                  <ActuacionDetail actuacion={abierta} />

                  {abierta.porRemision?.terminoEnLaRamaFuente.description && (
                    <p className="cn-cat-sobre">
                      <b>Lo que dice en {branchLabel(abierta.porRemision.ramaFuente)}, como referencia:</b>{' '}
                      {abierta.porRemision.terminoEnLaRamaFuente.description}
                    </p>
                  )}
                </div>

                <footer className="cn-cat-ficha-pie">
                  <span className="cn-cat-separa" aria-hidden="true" />
                  <button type="button" onClick={cerrar} className="cn-cat-boton cn-cat-boton--neutro">
                    Cerrar
                  </button>
                  {abierta.term.status !== 'NO_VERIFICADO' && (
                    <button type="button" onClick={() => setModo('verificar')} className="cn-cat-boton cn-cat-boton--primario">
                      {abierta.verification ? 'Revisar la verificación' : 'Verificar contra la norma'}
                    </button>
                  )}
                </footer>
              </>
            )}
          </section>
        </div>
      )}

      <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
    </div>
  );
};
