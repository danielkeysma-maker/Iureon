import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, ExternalLink, Loader2, X } from 'lucide-react';
import { IconoBuscar } from '../../../design/ArtboardIcons';
import {
  searchPrecedents,
  fetchOfficialRuling,
  buscarDisciplinaria,
  discoverRulings,
  indexDiscovered,
  citationShape
} from '../services/legalSearch.api';
import type {
  CorpusPrecedent,
  CorpusStatus,
  OfficialRuling,
  DiscoveryResponse
} from '../services/legalSearch.api';
import {
  CORPORACIONES,
  alcanzanLaConsulta,
  aniosDisponibles,
  cercaniaMaxima,
  citaCopiable,
  corporacionEnPalabras,
  leerFicha,
  parecidoEnPalabras,
  resultadosVisibles
} from '../dosCorpus';

/**
 * El Buscador de escritorio. Artboards 1, 2 y 4 de
 * `public/handoff/app-buscador-catalogo.html`: la pantalla con sus dos bloques,
 * la ficha de la providencia leída y el estado «nada suficientemente cercano».
 *
 * ─── LAS DOS REGLAS QUE ESTA PANTALLA EXISTE PARA CUMPLIR ───────────────────
 *
 * Esta pantalla llegó a tener diecisiete providencias escritas a mano, una de
 * ellas inexistente. De ahí:
 *
 *  1. Nada se pinta que el servidor no haya traído con su fuente. Si el corpus
 *     está vacío, se dice; nunca se rellena el hueco.
 *  2. Un fragmento no es una providencia. No hay «sentencia completa» aquí:
 *     tener mil caracteres y llamarlos providencia sería la misma mentira en
 *     otro sitio. La tarjeta lleva a la fuente oficial.
 *
 * ─── DOS BLOQUES QUE NO SE MEZCLAN ──────────────────────────────────────────
 *
 * Lo que una persona leyó antes de indexarlo, con sus hechos y su ratio, va
 * arriba y con tarjeta blanca. Todo lo que nadie leyó —lo indexado por el
 * descubrimiento, la sentencia traída porque se nombró, lo confirmado contra el
 * registro oficial, la relatoría disciplinaria— va en el segundo bloque, más
 * apagado, con su sello «Sin leer» discontinuo y SIN botón de copiar la cita:
 * citar algo que nadie leyó tiene que costar un clic más. La separación la
 * hace `resultadosVisibles`, que el check prueba; aquí no se filtra a mano.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · «Curada por C. Restrepo», «Citada en 3 escritos», la nota del curador, el
 *   botón «Corregir la curaduría» y el formulario «Curar esta providencia».
 *   No existe curaduría de jurisprudencia por firma: el corpus curado lo leyó
 *   una persona ANTES de indexarlo y guarda sus hechos y su ratio, no un autor,
 *   una nota ni los escritos que la citan. Pintarlo sería atribuirle a la firma
 *   una lectura que no hizo. Exige una tabla de curaduría por firma.
 * · «Lo que alguien de su firma leyó» se dice «Lo que una persona leyó», por
 *   lo mismo.
 * · El título descriptivo de la providencia («Estabilidad laboral reforzada
 *   de…»). El corpus no guarda un título: se muestra la ratio que sí guarda.
 * · «Leerla y curarla» en lo automático, y «Buscar también sin curar» en el
 *   estado vacío: lo primero no tiene dónde guardarse; lo segundo ya ocurre
 *   solo, porque cuando el corpus no alcanza la pantalla sale a las relatorías.
 * · El conteo en mono: la cara nueva reserva el mono para lo citable.
 */

/** Qué decirle al abogado cuando el corpus no pudo responder, por estado. */
const mensajeDeEstado = (status: CorpusStatus, reason: string | undefined): string => {
  switch (status) {
    case 'NOT_SEEDED':
      return reason ?? 'El corpus de jurisprudencia todavía no tiene providencias indexadas.';
    case 'NO_PROVIDER':
      return reason ?? 'No hay un proveedor de embeddings configurado, así que la consulta no se puede convertir en vector.';
    case 'NO_INDEX':
      return reason ?? 'La base de datos no está configurada, así que no hay índice sobre el cual buscar.';
    default:
      return reason ?? 'La búsqueda no pudo completarse.';
  }
};

const ESTADOS_QUE_NO_RESPONDEN: ReadonlyArray<CorpusStatus> = ['NOT_SEEDED', 'NO_PROVIDER', 'NO_INDEX', 'FAILED'];

const procedenciaDe = (item: CorpusPrecedent): string => {
  /* Un concepto nunca se presenta como providencia: se nombra su entidad. */
  if (item.sourceKind === 'CONCEPTO') return ['Concepto', item.entidad].filter(Boolean).join(' · ');
  return (
    [corporacionEnPalabras(item.corporacion), item.magistradoPonente && `M.P. ${item.magistradoPonente}`]
      .filter(Boolean)
      .join(' · ') || 'Procedencia no registrada'
  );
};

interface TarjetaLeidaProps {
  item: CorpusPrecedent;
  copiada: boolean;
  onAbrir: (item: CorpusPrecedent) => void;
  onCitar: (item: CorpusPrecedent) => void;
}

const TarjetaLeida: React.FC<TarjetaLeidaProps> = ({ item, copiada, onAbrir, onCitar }) => {
  const ficha = leerFicha(item.contentChunk);
  return (
    <article className="cn-bus-tarjeta">
      <button type="button" className="cn-bus-tarjeta-abrir" onClick={() => onAbrir(item)}>
        <span className="cn-bus-tarjeta-cabeza">
          <span className="min-w-0">
            <span className="cn-bus-tarjeta-linea">
              <span className="cn-bus-tarjeta-cita">{item.providencia ?? 'Fragmento sin providencia registrada'}</span>
              <span className="cn-bus-procedencia">{procedenciaDe(item)}</span>
            </span>
          </span>
          <span className="cn-bus-sello cn-bus-sello--leida">
            <span className="cn-bus-punto" aria-hidden="true" />
            Leída antes de indexar
          </span>
        </span>
        <span className="cn-bus-tarjeta-texto">
          {ficha.ratio ? `Ratio: ${ficha.ratio}` : ficha.texto.slice(0, 320)}
        </span>
      </button>
      <div className="cn-bus-tarjeta-pie">
        <span>{parecidoEnPalabras(item.similarity)}</span>
        {item.outcome && <span>Resultado registrado: {item.outcome.toLowerCase()}</span>}
        <span className="cn-bus-separa" aria-hidden="true" />
        {item.sourceUrl && (
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="cn-bus-enlace">
            Leer en la fuente oficial
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
        <button
          type="button"
          onClick={() => onCitar(item)}
          disabled={!item.providencia}
          className="cn-bus-boton cn-bus-boton--suave"
        >
          {copiada ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copiada ? 'Cita copiada' : 'Copiar la cita'}
        </button>
      </div>
    </article>
  );
};

interface TarjetaSinLeerProps {
  cita: string;
  origen: string;
  procedencia: string;
  texto: string;
  sourceUrl: string | null;
  enlace: string;
  detalle?: string | null;
}

/*
 * SIN BOTÓN DE COPIAR. Nadie de la firma ha leído esto: el único camino es la
 * fuente. El check lee este componente y falla si aparece.
 */
const TarjetaSinLeer: React.FC<TarjetaSinLeerProps> = ({ cita, origen, procedencia, texto, sourceUrl, enlace, detalle }) => {
  return (
    <article className="cn-bus-tarjeta cn-bus-tarjeta--sin">
      <div className="cn-bus-tarjeta-cabeza">
        <div className="min-w-0">
          <div className="cn-bus-tarjeta-linea">
            <span className="cn-bus-tarjeta-cita">{cita}</span>
            <span className="cn-bus-procedencia">{origen}</span>
          </div>
          {procedencia && <p className="cn-bus-procedencia">{procedencia}</p>}
        </div>
        <span className="cn-bus-sello cn-bus-sello--sin">Sin leer</span>
      </div>
      <blockquote className="cn-bus-fragmento cn-bus-fragmento--sin">{texto}</blockquote>
      <div className="cn-bus-tarjeta-pie">
        {detalle && <span>{detalle}</span>}
        <span className="cn-bus-separa" aria-hidden="true" />
        {sourceUrl && (
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="cn-bus-boton cn-bus-boton--fantasma">
            {enlace}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
};

export const SearchView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [corporacion, setCorporacion] = useState('TODAS');
  const [anio, setAnio] = useState('TODOS');
  const [soloLeidas, setSoloLeidas] = useState(false);
  /* Cuánto tardó la última búsqueda, medido aquí — no un adorno inventado. */
  const [duracionMs, setDuracionMs] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  const [results, setResults] = useState<CorpusPrecedent[]>([]);
  /* Lo más parecido cuando nada alcanzó el umbral: para decir que quedó lejos. */
  const [cercania, setCercania] = useState<number | null>(null);
  const [status, setStatus] = useState<CorpusStatus | null>(null);
  const [reason, setReason] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [abierta, setAbierta] = useState<CorpusPrecedent | null>(null);
  /*
   * Una sentencia traída del sitio oficial vive aparte de los resultados del
   * corpus, y esa separación es el punto: se descargó hace dos segundos porque
   * el abogado la nombró. En la misma lista parecería curada.
   */
  const [ruling, setRuling] = useState<OfficialRuling | null>(null);
  const [rulingError, setRulingError] = useState('');
  const [loadingRuling, setLoadingRuling] = useState(false);
  /*
   * El descubrimiento se dispara SOLO cuando el corpus no alcanza. Ese vacío es
   * la señal de demanda; buscar en cada consulta gastaría en preguntas que el
   * corpus ya responde.
   */
  const [discovery, setDiscovery] = useState<DiscoveryResponse | null>(null);
  const [disciplinarias, setDisciplinarias] = useState<OfficialRuling[]>([]);
  const [buscandoDisciplinaria, setBuscandoDisciplinaria] = useState(false);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [indexed, setIndexed] = useState(0);

  const runSearch = async () => {
    const query = searchQuery.trim();
    /*
     * Antes también exigía una firma y volvía EN SILENCIO sin ella: el abogado
     * escribía, pulsaba Buscar y no pasaba nada. El corpus es conocimiento
     * compartido del producto; leerlo no pide firma.
     */
    if (!query) return;

    setIsLoading(true);
    const inicioConsulta = performance.now();
    setRuling(null);
    setRulingError('');
    setDiscovery(null);
    setDisciplinarias([]);
    setIndexed(0);
    setCercania(null);
    setAbierta(null);

    try {
      const response = await searchPrecedents(query);

      /*
       * ─── EL CORPUS NO ALCANZA AUNQUE DEVUELVA FILAS ────────────────────
       * La búsqueda vectorial siempre devuelve vecinos. Por debajo del umbral
       * medido lo más cercano es ruido, y ESTO es lo que tenía apagado el
       * descubrimiento: la salida al registro oficial esperaba un corpus
       * vacío, y el corpus casi nunca contesta vacío: contesta ruido.
       */
      const items = response.items ?? [];
      const relevantes = alcanzanLaConsulta(items);
      const corpusAlcanza = relevantes.length > 0;

      setResults(relevantes);
      setStatus(corpusAlcanza || items.length > 0 ? (corpusAlcanza ? response.status : 'EMPTY') : response.status);
      setCercania(corpusAlcanza ? null : cercaniaMaxima(items));
      setReason(corpusAlcanza || items.length > 0 ? undefined : response.reason);

      /*
       * El corpus no tuvo nada y la consulta no es una cita: se busca en las
       * relatorías. Lo que vuelva se confirma contra el registro oficial antes
       * de mostrarse — el buscador solo apunta.
       */
      if (!corpusAlcanza && !citationShape(query)) {
        /*
         * LA CNDJ SE CONSULTA EN PARALELO, no después: son fuentes distintas
         * que no compiten. Falla en silencio porque es un extra.
         */
        setBuscandoDisciplinaria(true);
        void buscarDisciplinaria(query)
          .then((r) => setDisciplinarias(r.rulings ?? []))
          .catch(() => setDisciplinarias([]))
          .finally(() => setBuscandoDisciplinaria(false));

        setLoadingDiscovery(true);
        try {
          const hallazgo = await discoverRulings(query);
          setDiscovery(hallazgo);

          /*
           * Se indexa en una petición APARTE, después de mostrar: una función
           * sin servidor se congela al responder, y una ingesta a medias deja
           * media sentencia en el corpus. Solo viajan las citas.
           */
          if (hallazgo.status === 'OK' && hallazgo.found.length > 0) {
            try {
              const { results: indexados } = await indexDiscovered(hallazgo.found.map((f) => f.ruling.citation));
              setIndexed(indexados.filter((r) => r.status === 'INDEXED').length);
            } catch {
              // No indexar no invalida lo encontrado: sigue en pantalla con su fuente.
            }
          }
        } catch {
          // El descubrimiento es un extra: si falla, lo dicho del corpus sigue siendo verdad.
        } finally {
          setLoadingDiscovery(false);
        }
      }

      /*
       * Si la consulta tiene forma de cita, se pide también al sitio oficial:
       * el corpus tiene una fracción de lo publicado, y decir «no hay nada»
       * cuando la Corte la publica sería falso.
       */
      if (citationShape(query)) {
        setLoadingRuling(true);
        try {
          const { ruling: traida } = await fetchOfficialRuling(query);
          setRuling(traida);
        } catch (err) {
          // El servidor distingue «no existe» de «no se pudo consultar».
          setRulingError(err instanceof Error ? err.message : 'No se pudo traer la sentencia.');
        } finally {
          setLoadingRuling(false);
        }
      }
    } catch (error) {
      setResults([]);
      setStatus('FAILED');
      setReason(error instanceof Error ? error.message : 'La búsqueda no pudo completarse.');
    } finally {
      setDuracionMs(performance.now() - inicioConsulta);
      setIsLoading(false);
    }
  };

  const { leidas, sinLeer } = resultadosVisibles(results, { corporacion, anio, soloLeidas });
  const anios = aniosDisponibles(results);

  const citar = (item: CorpusPrecedent) => {
    const cita = citaCopiable(item);
    if (!cita) return;
    void navigator.clipboard.writeText(cita);
    setCopiedId(item.id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  /* Esc cierra la ficha, como todo diálogo de la casa. */
  const panelFicha = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!abierta) return;
    panelFicha.current?.focus();
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierta(null);
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [abierta]);

  /*
   * EL BLOQUE AUTOMÁTICO SUMA TODO LO QUE NADIE LEYÓ, venga de donde venga:
   * lo indexado sin lectura, la sentencia nombrada, lo confirmado en el
   * registro y la relatoría disciplinaria. Cada tarjeta dice su procedencia.
   */
  const automaticos =
    sinLeer.length + (ruling ? 1 : 0) + (discovery?.status === 'OK' ? discovery.found.length : 0) + disciplinarias.length;
  const ocultasPorElFiltro = soloLeidas
    ? resultadosVisibles(results, { corporacion, anio, soloLeidas: false }).sinLeer.length +
      (ruling ? 1 : 0) +
      (discovery?.status === 'OK' ? discovery.found.length : 0) +
      disciplinarias.length
    : 0;
  const esperandoFuera = loadingRuling || loadingDiscovery || buscandoDisciplinaria;
  const corpusNoResponde = status !== null && ESTADOS_QUE_NO_RESPONDEN.includes(status);
  const hayConsulta = status !== null && !isLoading;

  const fichaAbierta = abierta ? leerFicha(abierta.contentChunk) : null;

  return (
    <div data-visita="vista-search" className="cara-nueva cn-bus flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="cn-bus-cabeza">
        <h1 className="cn-bus-h1">Buscador</h1>
        <p className="cn-bus-bajada">
          Jurisprudencia y conceptos: primero lo que una persona leyó; cuando no alcanza, las relatorías oficiales. No
          consume saldo.
        </p>

        <form
          className="cn-bus-busqueda"
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch();
          }}
        >
          <label className="cn-bus-campo-envoltura">
            <span className="sr-only">Consulta</span>
            <IconoBuscar className="cn-bus-campo-icono" />
            <input
              ref={campo}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Escriba el problema jurídico o nombre una sentencia"
              className="cn-bus-campo"
            />
          </label>
          <button type="submit" disabled={isLoading || !searchQuery.trim()} className="cn-bus-boton cn-bus-boton--primario">
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            {isLoading ? 'Buscando' : 'Buscar'}
          </button>
        </form>

        <div className="cn-bus-filtros">
          <label className="cn-bus-selector">
            <span className="sr-only">Corporación</span>
            <select value={corporacion} onChange={(e) => setCorporacion(e.target.value)}>
              {CORPORACIONES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id === 'TODAS' ? 'Corporación: todas' : c.label}
                </option>
              ))}
            </select>
          </label>
          {/* El año, leído de las providencias que la búsqueda trajo. */}
          {anios.length > 1 && (
            <label className="cn-bus-selector">
              <span className="sr-only">Año</span>
              <select value={anio} onChange={(e) => setAnio(e.target.value)}>
                <option value="TODOS">Año: todos</option>
                {anios.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>
          )}
          <span className="cn-bus-divisor" aria-hidden="true" />
          <label className={`cn-bus-chip cn-bus-interruptor${soloLeidas ? ' cn-bus-interruptor--activo' : ''}`}>
            <input type="checkbox" checked={soloLeidas} onChange={(e) => setSoloLeidas(e.target.checked)} />
            <span className="cn-bus-casilla" aria-hidden="true">
              {soloLeidas && <Check className="h-3.5 w-3.5" />}
            </span>
            Solo lo que alguien leyó
          </label>
          {hayConsulta && duracionMs !== null && (
            <span className="cn-bus-estado">
              {leidas.length} {leidas.length === 1 ? 'leída' : 'leídas'} · {automaticos} sin leer ·{' '}
              {(duracionMs / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 })} s
            </span>
          )}
        </div>
      </div>

      <div className="cn-bus-cuerpo">
        {status === null && !isLoading && (
          <div className="cn-bus-vacio">
            <h2 className="cn-bus-vacio-titulo">Escriba una consulta</h2>
            <p>
              Se busca primero en el corpus curado: providencias que una persona leyó en la fuente oficial antes de
              indexarlas. Si no alcanza, se consulta en las relatorías oficiales, y lo que llegue de allí se muestra aparte,
              marcado como sin leer.
            </p>
          </div>
        )}

        {isLoading && (
          <p className="cn-bus-cargando">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Buscando en el corpus curado…
          </p>
        )}

        {hayConsulta && corpusNoResponde && (
          <div className="cn-bus-aviso" role="status">
            <p className="cn-bus-aviso-titulo">El corpus no pudo responder</p>
            <p>{mensajeDeEstado(status, reason)}</p>
          </div>
        )}

        {/* ─── ARTBOARD 4 · NADA SUFICIENTEMENTE CERCANO ─────────────────── */}
        {hayConsulta && !corpusNoResponde && results.length === 0 && (
          <div className="cn-bus-vacio">
            <h2 className="cn-bus-vacio-titulo">
              {cercania !== null ? 'Nada suficientemente cercano' : 'Sin coincidencias en el corpus curado'}
            </h2>
            <p>
              {cercania !== null
                ? 'Lo que una persona ha leído no tiene nada parecido a esta consulta. Lo más cercano quedó lejos, y mostrarlo sería sugerir un parecido que no existe.'
                : 'El corpus curado no devolvió ninguna providencia para esta consulta.'}{' '}
              {citationShape(searchQuery)
                ? 'Como la consulta nombra una sentencia, se pidió a la relatoría oficial.'
                : 'Se consultan las relatorías oficiales; lo que llegue aparece abajo, aparte.'}
            </p>
            <div className="cn-bus-acciones">
              <button
                type="button"
                className="cn-bus-boton cn-bus-boton--suave"
                onClick={() => {
                  campo.current?.focus();
                  campo.current?.select();
                }}
              >
                Cambiar las palabras
              </button>
            </div>
          </div>
        )}

        {/* ─── BLOQUE 1 · LO QUE UNA PERSONA LEYÓ ────────────────────────── */}
        {leidas.length > 0 && (
          <section className="cn-bus-bloque" aria-labelledby="cn-bus-leidas">
            <div className="cn-bus-bloque-cabeza">
              <h2 id="cn-bus-leidas" className="cn-bus-h2">
                Lo que una persona leyó
              </h2>
              <span className="cn-bus-cuenta">{leidas.length}</span>
            </div>
            <p className="cn-bus-bloque-bajada">
              Corpus curado: alguien abrió la providencia en la fuente oficial antes de indexarla y dejó sus hechos y su
              ratio. El orden es por parecido del texto con su consulta, no por autoridad: una sentencia que fija una regla
              puede quedar detrás de las que la citan.
            </p>
            <div className="cn-bus-lista">
              {leidas.map((item) => (
                <TarjetaLeida
                  key={item.id}
                  item={item}
                  copiada={copiedId === item.id}
                  onAbrir={setAbierta}
                  onCitar={citar}
                />
              ))}
            </div>
          </section>
        )}

        {hayConsulta && soloLeidas && ocultasPorElFiltro > 0 && (
          <p className="cn-bus-nota">
            Hay {ocultasPorElFiltro} {ocultasPorElFiltro === 1 ? 'encontrada' : 'encontradas'} automáticamente que nadie ha
            leído. Quite «Solo lo que alguien leyó» para verlas, aparte.
          </p>
        )}

        {/* ─── BLOQUE 2 · ENCONTRADO AUTOMÁTICAMENTE ─────────────────────── */}
        {!soloLeidas && (automaticos > 0 || esperandoFuera || rulingError || (discovery && hayConsulta)) && (
          <section className="cn-bus-bloque" aria-labelledby="cn-bus-sin-leer">
            <div className="cn-bus-bloque-cabeza">
              <h2 id="cn-bus-sin-leer" className="cn-bus-h2">
                Encontrado automáticamente
              </h2>
              <span className="cn-bus-cuenta">{automaticos}</span>
            </div>
            <div className="cn-bus-nadie">
              <p>
                <b>Nadie de la firma ha leído esto.</b> Es igual de real que lo curado y no es lo mismo: lo curado lo leyó
                una persona y lleva sus hechos y su ratio. Hacer pasar esto por curado sería promoverlo en silencio.
              </p>
            </div>

            {loadingRuling && (
              <p className="cn-bus-cargando">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Buscando la sentencia en la relatoría oficial…
              </p>
            )}
            {loadingDiscovery && (
              <p className="cn-bus-cargando">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Consultando las relatorías oficiales…
              </p>
            )}
            {buscandoDisciplinaria && (
              <p className="cn-bus-cargando">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Consultando la relatoría de Disciplina Judicial…
              </p>
            )}

            {rulingError && !loadingRuling && (
              <div className="cn-bus-aviso" role="status">
                <p>{rulingError}</p>
              </div>
            )}

            {/*
              EL DESCUBRIMIENTO QUE NO ENCUENTRA TAMBIÉN SE DICE. Solo se
              pintaba el caso con hallazgos, y sin llave o con el servicio caído
              la pantalla quedaba muda: una capacidad que calla al fallar se lee
              como que nunca estuvo.
            */}
            {discovery && discovery.status !== 'OK' && (
              <div className="cn-bus-aviso" role="status">
                <p className="cn-bus-aviso-titulo">
                  {discovery.status === 'NO_PROVIDER'
                    ? 'La búsqueda fuera del corpus no está configurada'
                    : 'No se pudo consultar el registro oficial'}
                </p>
                <p>
                  {discovery.reason ??
                    (discovery.status === 'NO_PROVIDER'
                      ? 'Falta la llave del buscador. Mientras tanto solo se consulta el corpus indexado.'
                      : 'El servicio no respondió. Vuelva a intentarlo en unos minutos.')}
                </p>
              </div>
            )}

            {discovery?.status === 'OK' && discovery.found.length === 0 && !loadingDiscovery && (
              <div className="cn-bus-vacio cn-bus-vacio--compacto">
                <h3 className="cn-bus-vacio-titulo">El registro oficial tampoco tiene nada para esta consulta</h3>
                <p>
                  Se buscó en la relatoría de la Corte Constitucional, en el buscador de la Corte Suprema —Civil, Laboral,
                  Penal y Tutelas— y en la relatoría del Consejo de Estado, y ninguna candidata pasó la verificación
                  {discovery.descartadas.length > 0
                    ? `: ${discovery.descartadas.length} ${discovery.descartadas.length === 1 ? 'propuesta fue descartada' : 'propuestas fueron descartadas'}.`
                    : '.'}{' '}
                  Si el asunto es de un tribunal o un juzgado, no vive en ninguna de esas relatorías.
                </p>
              </div>
            )}

            {indexed > 0 && (
              <p className="cn-bus-nota">
                {indexed} {indexed === 1 ? 'quedó' : 'quedaron'} en el corpus, todavía sin leer: la próxima consulta sobre
                esto responde al instante.
              </p>
            )}

            <div className="cn-bus-lista">
              {ruling && (
                <TarjetaSinLeer
                  cita={`Sentencia ${ruling.citation}`}
                  origen="Traída de la relatoría porque usted la nombró"
                  procedencia={[ruling.proceso, ruling.sala, ruling.fecha, ruling.magistrado && `M.P. ${ruling.magistrado}`]
                    .filter(Boolean)
                    .join(' · ')}
                  texto={`${ruling.text.slice(0, 1600)}${ruling.text.length > 1600 ? '…' : ''}`}
                  sourceUrl={ruling.sourceUrl}
                  enlace="Abrir en la relatoría"
                  detalle={
                    ruling.text.length > 1600
                      ? `Se muestran 1.600 de ${ruling.text.length.toLocaleString('es-CO')} caracteres`
                      : null
                  }
                />
              )}

              {sinLeer.map((item) => (
                <TarjetaSinLeer
                  key={item.id}
                  cita={item.providencia ?? 'Fragmento sin providencia registrada'}
                  origen="Indexada por el descubrimiento automático"
                  procedencia={procedenciaDe(item)}
                  texto={leerFicha(item.contentChunk).texto.slice(0, 600)}
                  sourceUrl={item.sourceUrl}
                  enlace="Abrir la fuente oficial"
                  detalle={parecidoEnPalabras(item.similarity)}
                />
              ))}

              {discovery?.status === 'OK' &&
                discovery.found.map(({ ruling: r, motivo }) => (
                  <TarjetaSinLeer
                    key={r.citation}
                    cita={`Sentencia ${r.citation}`}
                    origen="Confirmada contra el registro oficial y descargada"
                    procedencia={[r.proceso, r.sala, r.fecha, r.magistrado && `M.P. ${r.magistrado}`].filter(Boolean).join(' · ')}
                    texto={`${r.text.slice(0, 900)}${r.text.length > 900 ? '…' : ''}`}
                    sourceUrl={r.sourceUrl}
                    enlace="Abrir la fuente oficial"
                    detalle={motivo || null}
                  />
                ))}

              {/*
                LO DISCIPLINARIO, CON SU PROCEDENCIA A LA VISTA. Viene de la
                relatoría de la Comisión Nacional de Disciplina Judicial y NO pasa
                por el registro abierto del Estado, porque para esta corporación no
                existe uno. Quien va a citar necesita saberlo antes.
              */}
              {disciplinarias.map((r) => (
                <TarjetaSinLeer
                  key={r.sourceUrl}
                  cita={`Radicación ${r.citation}`}
                  origen="Relatoría de la Comisión Nacional de Disciplina Judicial"
                  procedencia={[r.sala, r.fecha].filter(Boolean).join(' · ')}
                  texto={`${r.text.slice(0, 900)}${r.text.length > 900 ? '…' : ''}`}
                  sourceUrl={r.sourceUrl}
                  enlace="Ver el PDF oficial"
                  detalle="Sin registro externo que la confirme"
                />
              ))}
            </div>

            {/*
              Lo que el buscador propuso y el registro rechazó, a propósito: es la
              única forma de juzgar si el motor apunta bien.
            */}
            {discovery?.status === 'OK' && discovery.found.length > 0 && discovery.descartadas.length > 0 && (
              <details className="cn-bus-descartadas">
                <summary>
                  {discovery.descartadas.length}{' '}
                  {discovery.descartadas.length === 1 ? 'propuesta que el registro oficial rechazó' : 'propuestas que el registro oficial rechazó'}
                </summary>
                <ul>
                  {discovery.descartadas.map((d) => (
                    <li key={d.cita}>
                      <span className="cn-bus-descartada-cita">{d.cita}</span> — {d.razon}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        )}
      </div>

      {/* ─── ARTBOARD 2 · LA FICHA DE LA PROVIDENCIA LEÍDA ───────────────── */}
      {abierta && fichaAbierta && (
        <div className="cn-bus-ficha" role="dialog" aria-modal="true" aria-label={abierta.providencia ?? 'Providencia'}>
          <div className="cn-bus-velo" onClick={() => setAbierta(null)} aria-hidden="true" />
          <section ref={panelFicha} tabIndex={-1} className="cn-bus-ficha-panel">
            <header className="cn-bus-ficha-cabeza">
              <div className="min-w-0">
                <p className="cn-bus-procedencia">{procedenciaDe(abierta)}</p>
                <h2 className="cn-bus-ficha-cita">{abierta.providencia ?? 'Fragmento sin providencia registrada'}</h2>
              </div>
              <button type="button" aria-label="Cerrar" className="cn-bus-cerrar" onClick={() => setAbierta(null)}>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>
            <div className="cn-bus-ficha-cuerpo">
              {fichaAbierta.hechos && (
                <div>
                  <h3 className="cn-bus-ficha-rotulo">Los hechos, según quien la leyó</h3>
                  <p className="cn-bus-prosa">{fichaAbierta.hechos}</p>
                </div>
              )}
              {fichaAbierta.ratio && (
                <div>
                  <h3 className="cn-bus-ficha-rotulo">La ratio</h3>
                  <p className="cn-bus-prosa">{fichaAbierta.ratio}</p>
                </div>
              )}
              {!fichaAbierta.hechos && !fichaAbierta.ratio && (
                <p className="cn-bus-nota">Este fragmento no trae hechos ni ratio registrados.</p>
              )}
              <div>
                <h3 className="cn-bus-ficha-rotulo">El fragmento que encontró la búsqueda</h3>
                <blockquote className="cn-bus-fragmento">{fichaAbierta.texto}</blockquote>
              </div>
              {abierta.sourceKind === 'CONCEPTO' && (
                <div className="cn-bus-nadie">
                  <p>
                    <b>Es un concepto, no una providencia.</b>{' '}
                    {abierta.bindingScope
                      ? `Alcance registrado: ${abierta.bindingScope}.`
                      : 'No hay un alcance verificado de a quién obliga.'}
                  </p>
                </div>
              )}
              <dl className="cn-bus-datos">
                <div>
                  <dt>Parecido con su consulta</dt>
                  <dd>{parecidoEnPalabras(abierta.similarity)}</dd>
                </div>
                <div>
                  <dt>Resultado registrado</dt>
                  <dd>{abierta.outcome ? abierta.outcome.toLowerCase() : 'No registrado'}</dd>
                </div>
              </dl>
            </div>
            <footer className="cn-bus-ficha-pie">
              {abierta.sourceUrl ? (
                <a href={abierta.sourceUrl} target="_blank" rel="noopener noreferrer" className="cn-bus-enlace cn-bus-enlace--grande">
                  Leer la providencia en la fuente oficial
                </a>
              ) : (
                <span className="cn-bus-nota">Este fragmento no registró su fuente.</span>
              )}
              <button
                type="button"
                onClick={() => citar(abierta)}
                disabled={!abierta.providencia}
                className="cn-bus-boton cn-bus-boton--primario"
              >
                {copiedId === abierta.id ? 'Cita copiada' : 'Copiar la cita'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};
