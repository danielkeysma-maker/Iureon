import React from 'react';
import { Check, Copy, ExternalLink, Loader2, X } from 'lucide-react';
import { IconoBuscar } from '../../../design/ArtboardIcons';
import { searchPrecedents, type CorpusPrecedent, type CorpusStatus } from '../services/legalSearch.api';
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
 * El Buscador en el teléfono. Artboard 5 de `public/handoff/app-buscador-catalogo.html`
 * (375 px): campo de 48, pestañas «Leídas · N» / «Sin leer · N» / filtros, y
 * tarjetas de radio 14.
 *
 * ─── LAS PESTAÑAS SON LA SEPARACIÓN ─────────────────────────────────────────
 *
 * En 375 px no caben dos bloques con su explicación sin que el segundo quede a
 * tres pantallas del primero, y el pulgar toca lo primero que aparece. Por eso
 * el artboard no apila: muestra UN corpus a la vez y deja el otro a una
 * pestaña, con su cuenta a la vista. Nunca hay una lista con los dos. Lo que
 * nadie leyó no ofrece copiar la cita.
 *
 * ─── DOS DEFECTOS QUE ESTA PANTALLA TENÍA, CORREGIDOS AL VESTIRLA ──────────
 *
 * · NO APLICABA EL UMBRAL. El escritorio calla por debajo de 0,60 porque ahí
 *   lo más cercano es ruido; el teléfono lo presentaba como resultado. Ahora
 *   las dos pasan por `alcanzanLaConsulta`.
 * · OFRECÍA «CONSEJO_DE_ESTADO», etiqueta que el corpus no usa (archiva
 *   `CONSEJO_ESTADO`): elegirla vaciaba la lista. La lista es la de `dosCorpus`.
 * · Un fallo de red quedaba sin atrapar y la pantalla se congelaba en «Buscar».
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · El título «Buscador» en la pantalla: lo pone la cabecera móvil de la
 *   aplicación, y dos títulos seguidos se leen como un error.
 * · «Curada por C. Restrepo · citada en 3 escritos» y la nota del curador: no
 *   hay curaduría de jurisprudencia por firma (ver `SearchView`).
 * · La búsqueda en las relatorías oficiales cuando el corpus no alcanza: en el
 *   teléfono no se ha construido, y la pantalla lo dice en vez de callarlo.
 */

type Pestana = 'leidas' | 'sinLeer';

const ESTADOS_QUE_NO_RESPONDEN: ReadonlyArray<CorpusStatus> = ['NOT_SEEDED', 'NO_PROVIDER', 'NO_INDEX', 'FAILED'];

const procedenciaDe = (item: CorpusPrecedent): string => {
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
  onCitar: (item: CorpusPrecedent) => void;
}

const TarjetaLeida: React.FC<TarjetaLeidaProps> = ({ item, copiada, onCitar }) => {
  const ficha = leerFicha(item.contentChunk);
  return (
    <article className="cn-bus-tarjeta">
      <div className="cn-bus-tarjeta-cabeza">
        <span className="cn-bus-tarjeta-cita">{item.providencia ?? 'Fragmento sin providencia registrada'}</span>
        <span className="cn-bus-sello cn-bus-sello--leida">
          <span className="cn-bus-punto" aria-hidden="true" />
          Leída
        </span>
      </div>
      <p className="cn-bus-procedencia">{procedenciaDe(item)}</p>
      <p className="cn-bus-tarjeta-texto">{ficha.ratio ? `Ratio: ${ficha.ratio}` : ficha.texto.slice(0, 280)}</p>
      <p className="cn-bus-procedencia">{parecidoEnPalabras(item.similarity)}</p>
      <div className="cn-bus-acciones">
        <button type="button" onClick={() => onCitar(item)} disabled={!item.providencia} className="cn-bus-boton cn-bus-boton--suave">
          {copiada ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          {copiada ? 'Cita copiada' : 'Copiar la cita'}
        </button>
        {item.sourceUrl && (
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="cn-bus-boton cn-bus-boton--fantasma">
            Fuente oficial
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </article>
  );
};

/* SIN BOTÓN DE COPIAR: nadie de la firma leyó esto. El check lo vigila. */
const TarjetaSinLeer: React.FC<{ item: CorpusPrecedent }> = ({ item }) => {
  return (
    <article className="cn-bus-tarjeta cn-bus-tarjeta--sin">
      <div className="cn-bus-tarjeta-cabeza">
        <span className="cn-bus-tarjeta-cita">{item.providencia ?? 'Fragmento sin providencia registrada'}</span>
        <span className="cn-bus-sello cn-bus-sello--sin">Sin leer</span>
      </div>
      <p className="cn-bus-procedencia">{procedenciaDe(item)}</p>
      <blockquote className="cn-bus-fragmento cn-bus-fragmento--sin">{leerFicha(item.contentChunk).texto.slice(0, 300)}</blockquote>
      <p className="cn-bus-procedencia">{parecidoEnPalabras(item.similarity)}</p>
      {item.sourceUrl && (
        <div className="cn-bus-acciones">
          <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="cn-bus-boton cn-bus-boton--fantasma">
            Leer en la fuente oficial
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      )}
    </article>
  );
};

export const SearchMobileView: React.FC = () => {
  const [consulta, setConsulta] = React.useState('');
  const [buscando, setBuscando] = React.useState(false);
  const [resultados, setResultados] = React.useState<CorpusPrecedent[]>([]);
  const [cercania, setCercania] = React.useState<number | null>(null);
  const [estado, setEstado] = React.useState<CorpusStatus | null>(null);
  const [motivo, setMotivo] = React.useState<string | undefined>(undefined);
  const [corporacion, setCorporacion] = React.useState<string>('TODAS');
  const [anio, setAnio] = React.useState<string>('TODOS');
  const [pestana, setPestana] = React.useState<Pestana>('leidas');
  const [filtrosAbiertos, setFiltrosAbiertos] = React.useState(false);
  const [copiada, setCopiada] = React.useState<string | null>(null);
  const campo = React.useRef<HTMLInputElement>(null);

  const buscar = async () => {
    if (!consulta.trim() || buscando) return;
    setBuscando(true);
    try {
      const r = await searchPrecedents(consulta.trim());
      const items = r.items ?? [];
      const relevantes = alcanzanLaConsulta(items);
      setResultados(relevantes);
      setCercania(relevantes.length > 0 ? null : cercaniaMaxima(items));
      setEstado(r.status);
      setMotivo(r.reason);
      /* Se abre la pestaña que tiene algo: abrir en «Leídas» vacía escondería lo único que hay. */
      const dos = resultadosVisibles(relevantes, { corporacion, anio, soloLeidas: false });
      setPestana(dos.leidas.length === 0 && dos.sinLeer.length > 0 ? 'sinLeer' : 'leidas');
    } catch (error) {
      setResultados([]);
      setCercania(null);
      setEstado('FAILED');
      setMotivo(error instanceof Error ? error.message : 'La búsqueda no pudo completarse.');
    } finally {
      setBuscando(false);
    }
  };

  const { leidas, sinLeer } = resultadosVisibles(resultados, { corporacion, anio, soloLeidas: false });
  const anios = aniosDisponibles(resultados);
  /* Cuenta filtros REALES aplicados, no un número fijo como en la maqueta. */
  const filtrosActivos = (corporacion === 'TODAS' ? 0 : 1) + (anio === 'TODOS' ? 0 : 1);
  const corpusNoResponde = estado !== null && ESTADOS_QUE_NO_RESPONDEN.includes(estado);

  const citar = (item: CorpusPrecedent) => {
    const cita = citaCopiable(item);
    if (!cita) return;
    void navigator.clipboard.writeText(cita);
    setCopiada(item.id);
    window.setTimeout(() => setCopiada(null), 2000);
  };

  return (
    <div data-visita="vista-search" className="cara-nueva cn-bus cn-bus--movil flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="cn-bus-cabeza">
        <form
          className="cn-bus-busqueda"
          onSubmit={(e) => {
            e.preventDefault();
            void buscar();
          }}
        >
          <label className="cn-bus-campo-envoltura">
            <span className="sr-only">Consulta</span>
            <IconoBuscar className="cn-bus-campo-icono" />
            <input
              ref={campo}
              type="search"
              enterKeyHint="search"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Problema jurídico o sentencia"
              className="cn-bus-campo"
            />
          </label>
          <button type="submit" disabled={!consulta.trim() || buscando} className="cn-bus-boton cn-bus-boton--primario">
            {buscando ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Buscando" /> : 'Buscar'}
          </button>
        </form>

        <div className="cn-bus-pestanas" role="group" aria-label="Qué corpus ver">
          <button
            type="button"
            aria-pressed={pestana === 'leidas'}
            onClick={() => setPestana('leidas')}
            className={`cn-bus-chip cn-bus-pestana${pestana === 'leidas' ? ' cn-bus-pestana--activa' : ''}`}
          >
            Leídas · {leidas.length}
          </button>
          <button
            type="button"
            aria-pressed={pestana === 'sinLeer'}
            onClick={() => setPestana('sinLeer')}
            className={`cn-bus-chip cn-bus-pestana${pestana === 'sinLeer' ? ' cn-bus-pestana--activa' : ''}`}
          >
            Sin leer · {sinLeer.length}
          </button>
          <button type="button" onClick={() => setFiltrosAbiertos(true)} className="cn-bus-chip cn-bus-pestana">
            Filtros{filtrosActivos > 0 ? ` · ${filtrosActivos}` : ''}
          </button>
        </div>
      </div>

      <div className="cn-bus-cuerpo">
        {estado === null && !buscando && (
          <div className="cn-bus-vacio">
            <h2 className="cn-bus-vacio-titulo">Escriba una consulta</h2>
            <p>Se busca en el corpus curado. Lo que una persona leyó y lo que nadie ha leído se muestran por separado.</p>
          </div>
        )}

        {buscando && (
          <p className="cn-bus-cargando">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Buscando en el corpus curado…
          </p>
        )}

        {!buscando && corpusNoResponde && (
          <div className="cn-bus-aviso" role="status">
            <p className="cn-bus-aviso-titulo">El corpus no pudo responder</p>
            <p>{motivo ?? 'La búsqueda no pudo completarse.'}</p>
          </div>
        )}

        {!buscando && estado !== null && !corpusNoResponde && resultados.length === 0 && (
          <div className="cn-bus-vacio">
            <h2 className="cn-bus-vacio-titulo">
              {cercania !== null ? 'Nada suficientemente cercano' : 'Sin coincidencias en el corpus curado'}
            </h2>
            <p>
              {cercania !== null
                ? 'Lo más cercano quedó lejos, y mostrarlo sería sugerir un parecido que no existe.'
                : 'El corpus curado no devolvió nada para esta consulta.'}{' '}
              En el teléfono se consulta solo el corpus; las relatorías oficiales se consultan desde el escritorio.
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

        {!buscando && resultados.length > 0 && pestana === 'leidas' && (
          <section className="cn-bus-bloque" aria-label="Lo que una persona leyó">
            <p className="cn-bus-bloque-bajada">
              Lo que una persona leyó antes de indexarlo. Lleva sus hechos y su ratio. El orden es por parecido del texto,
              no por autoridad.
            </p>
            {leidas.length === 0 && <p className="cn-bus-nota">Ninguna leída coincide con esta consulta y estos filtros.</p>}
            <div className="cn-bus-lista">
              {leidas.map((r) => (
                <TarjetaLeida key={r.id} item={r} copiada={copiada === r.id} onCitar={citar} />
              ))}
              {sinLeer.length > 0 && (
                <div className="cn-bus-nadie">
                  <p>
                    <b>
                      Hay {sinLeer.length} sin leer.
                    </b>{' '}
                    Son igual de reales, pero nadie de la firma las ha leído: no pasan por leídas.
                  </p>
                  <button type="button" className="cn-bus-boton cn-bus-boton--fantasma" onClick={() => setPestana('sinLeer')}>
                    Ver las que nadie leyó
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {!buscando && resultados.length > 0 && pestana === 'sinLeer' && (
          <section className="cn-bus-bloque" aria-label="Encontrado automáticamente">
            <div className="cn-bus-nadie">
              <p>
                <b>Nadie de la firma ha leído esto.</b> Es igual de real que lo leído y no es lo mismo: hacerlo pasar por
                curado sería promoverlo en silencio.
              </p>
            </div>
            {sinLeer.length === 0 && <p className="cn-bus-nota">No hay nada sin leer para esta consulta y estos filtros.</p>}
            <div className="cn-bus-lista">
              {sinLeer.map((r) => (
                <TarjetaSinLeer key={r.id} item={r} />
              ))}
            </div>
          </section>
        )}
      </div>

      {filtrosAbiertos && (
        <div className="cn-bus-hoja-capa" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="cn-bus-velo" onClick={() => setFiltrosAbiertos(false)} aria-hidden="true" />
          {/* Hoja inferior: 20 px arriba y 0 abajo, la de toda hoja de la casa. */}
          <section className="cn-bus-hoja">
            <span className="cn-bus-asidero" aria-hidden="true" />
            <header className="cn-bus-hoja-cabeza">
              <h2 className="cn-bus-h2">Filtros</h2>
              <button type="button" aria-label="Cerrar" className="cn-bus-cerrar" onClick={() => setFiltrosAbiertos(false)}>
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </header>
            <div className="cn-bus-hoja-cuerpo">
              <p className="cn-bus-hoja-rotulo">Corporación</p>
              {CORPORACIONES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={corporacion === c.id}
                  onClick={() => setCorporacion(c.id)}
                  className={`cn-bus-opcion${corporacion === c.id ? ' cn-bus-opcion--activa' : ''}`}
                >
                  {c.label}
                  {corporacion === c.id && <Check className="h-4 w-4" aria-hidden="true" />}
                </button>
              ))}
              {anios.length > 1 && (
                <>
                  <p className="cn-bus-hoja-rotulo">Año de la providencia</p>
                  {['TODOS', ...anios].map((a) => (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={anio === a}
                      onClick={() => setAnio(a)}
                      className={`cn-bus-opcion${anio === a ? ' cn-bus-opcion--activa' : ''}`}
                    >
                      {a === 'TODOS' ? 'Todos los años' : a}
                      {anio === a && <Check className="h-4 w-4" aria-hidden="true" />}
                    </button>
                  ))}
                </>
              )}
            </div>
            <footer className="cn-bus-hoja-pie">
              <button type="button" className="cn-bus-boton cn-bus-boton--primario" onClick={() => setFiltrosAbiertos(false)}>
                Ver resultados
              </button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
};
