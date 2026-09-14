import React from 'react';
import { AlertTriangle, CheckCircle2, MapPin, Minus, Sparkles } from 'lucide-react';
import { IconoBuscar, IconoVerificado, IconoVolver } from '../../../design/ArtboardIcons';
import {
  ENTRADAS,
  MANUAL,
  MINUTOS_TOTALES,
  TOTAL_ARTICULOS,
  buscar,
  entradaPorId,
  minutosDeLectura,
  separarRuta
} from '../content/manual';
import { ETIQUETA_DE_COSTO, FRECUENTES } from '../content/frecuentes';
import { NOVEDADES_ID } from '../content/novedades';
import { PANTALLAS, recordado, recordar } from '../../tenant/pantallaRecordada';
import { PASOS_DE_VISITA } from '../../inicio/visitaGuiada/pasos';
import { agruparEnCapitulos, textoDeLaVisitaCompleta } from '../../inicio/visitaGuiada/capitulos';
import type { ManualBlock, ManualEntry } from '../types';
import { useManualReads } from '../useManualReads';
import { useAperturaNovedades, useNovedadesNuevas } from '../useNovedades';
import { NovedadesPanel } from './NovedadesPanel';

/**
 * El manual con la cara nueva: índice por lo que se necesita hacer, artículo
 * como página propia, y la misma página en el escritorio y en el teléfono.
 *
 * ─── DE DÓNDE SALE LA FORMA ─────────────────────────────────────────────────
 *
 * `public/handoff/app-manual-y-soporte.html`: el índice (:384) —título de 34,
 * buscador sobre gris de 48 px, «Lo que más se pregunta» en dos columnas, la
 * lista por grupos con su rango en mono y la invitación a la visita al final—,
 * el artículo (:451) —«‹ Manual», chips, pasos con círculo oscuro de 28 px, el
 * aparte ámbar y «Siga leyendo»— y el índice del teléfono (:598), con el
 * recuadro «¿Algo no funcionó?». Antes el manual era un índice lateral fijo con
 * el artículo al lado; la maqueta los separa porque quien abre la ayuda busca
 * primero QUÉ leer, y un índice apretado en 268 px no deja buscar.
 *
 * ─── UNA PÁGINA, DOS ANCHOS ─────────────────────────────────────────────────
 *
 * El teléfono y el escritorio montan ESTA página con `movil`. Antes eran dos
 * componentes, y el del teléfono tenía que importar los bloques del otro para
 * no pintar los pasos como párrafos: el mismo manual diciendo dos cosas según
 * el aparato. Ahora no hay dos que puedan separarse.
 *
 * ─── LO QUE LA MAQUETA PIDE Y AQUÍ NO ESTÁ, con la razón ─────────────────────
 *
 * · «Consume $2.000» / «Consume $300» en las tarjetas: el precio de un escrito
 *   es «desde» y crece con lo que mide, y la orientación va por cupo diario. Se
 *   dice si la tarea toca el saldo; la cifra la da el botón que cobra
 *   (`content/frecuentes.ts`).
 * · «Por módulo» con «Consumen saldo» por grupo de la barra: el manual está
 *   agrupado por TAREA, no por módulo, y un grupo de la barra mezcla módulos
 *   que cobran con otros que no. Se muestran los grupos del manual.
 * · La cifra de «Módulos 01 y 03» en el artículo: los artículos no declaran sus
 *   módulos por número; su ruta sí dice por dónde pasan, y esa va arriba.
 *
 * Reading times come from `minutosDeLectura`, computed over the words actually
 * written, so they cannot drift the way a hand-typed "3 min" does.
 */

interface PaginaDelManualProps {
  movil: boolean;
  /** Article to open on mount — how Soporte hands a reader to the manual. */
  articuloInicial?: string;
  onSoporte: () => void;
  /** Launches the guided tour. Absent = no invitation. */
  onVisitaGuiada?: () => void;
}

const dosDigitos = (n: number): string => String(n).padStart(2, '0');

/* La duración que la puerta de la visita anunciará, calculada con las mismas paradas. */
const SEGUNDOS_DE_LA_VISITA = agruparEnCapitulos(PASOS_DE_VISITA).reduce((s, c) => s + c.segundos, 0);

/* ─── THE THREE STATES, DRAWN WITH THE SAME SHAPES AS THE APP ──────────────── */

const ESTADOS = [
  {
    clase: 'verificado',
    nombre: 'Verificado',
    icono: CheckCircle2,
    texto:
      'Un abogado de su firma comprobó el dato contra el texto oficial de la norma y firmó esa comprobación con su nombre y la fecha. Puede citarlo sin volver a mirar la ley.',
    seVeAsi: 'Se ve así: subrayado continuo verde y un visto junto al dato.'
  },
  {
    clase: 'sin-verificar',
    nombre: 'Sin verificar',
    icono: AlertTriangle,
    texto:
      'El modelo lo propuso, pero nadie lo ha comprobado. Puede ser correcto y suele serlo; aun así no lo lleve a un juzgado sin abrir la norma. Verificarlo toma unos dos minutos y queda hecho para toda la firma.',
    seVeAsi: 'Se ve así: subrayado discontinuo ámbar, fondo con trama y un triángulo de aviso.'
  },
  {
    clase: 'no-caduca',
    nombre: 'No caduca',
    icono: Minus,
    texto:
      'La norma no fija término, y eso también está comprobado. No es un dato faltante: es un hecho verificado sin cifra, como en la acción de tutela.',
    seVeAsi: 'Se ve así: subrayado punteado gris y una raya horizontal.'
  }
] as const;

/**
 * The breadcrumb of UI locations: chips joined by ›. The article header draws
 * its opening route in this shape — the reader should see WHERE before WHAT.
 */
export const Ruta: React.FC<{ camino: readonly string[] }> = ({ camino }) => (
  <div className="cn-man-ruta" aria-label="Dónde se hace esto en la aplicación">
    <MapPin className="cn-man-ruta-icono" aria-hidden="true" />
    {camino.map((tramo, i) => (
      <React.Fragment key={`${tramo}-${i}`}>
        {i > 0 && (
          <span className="cn-man-ruta-separador" aria-hidden="true">
            ›
          </span>
        )}
        <span className="cn-man-ruta-tramo">{tramo}</span>
      </React.Fragment>
    ))}
  </div>
);

/**
 * Cada bloque del artículo, con una sola anatomía por clase. Los apartes
 * comparten forma —rótulo, título, texto— y cambian solo de color, así que el
 * lector aprende la gramática una vez: azul es una regla práctica, verde un
 * atajo, ámbar lo que puede costar un término, gris lo que todavía no existe.
 * El trazo discontinuo queda SOLO para «sin verificar»; antes el aviso ámbar y
 * «todavía no existe» también lo usaban, y así el trazo dejaba de significar.
 */
export const Bloque: React.FC<{ bloque: ManualBlock }> = ({ bloque }) => {
  switch (bloque.kind) {
    case 'parrafo':
      return <p className="cn-man-parrafo">{bloque.texto}</p>;

    case 'subtitulo':
      return <h2 className="cn-man-subtitulo">{bloque.texto}</h2>;

    case 'pasos':
      return (
        <ol className="cn-man-pasos">
          {bloque.pasos.map((paso, i) => (
            <li key={`${i}-${paso.slice(0, 24)}`} className="cn-man-paso">
              <span className="cn-man-paso-numero" aria-hidden="true">
                {i + 1}
              </span>
              <p className="cn-man-paso-texto">{paso}</p>
            </li>
          ))}
        </ol>
      );

    case 'lista':
      return (
        <ul className="cn-man-lista">
          {bloque.items.map((item) => (
            <li key={item}>
              <span className="cn-man-lista-marca" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'nota':
      return (
        <aside className="cn-man-aparte cn-man-aparte--nota">
          <p className="cn-man-aparte-rotulo">Para tener en cuenta</p>
          <p className="cn-man-aparte-titulo">{bloque.titulo}</p>
          <p className="cn-man-aparte-texto">{bloque.texto}</p>
        </aside>
      );

    case 'aviso':
      return (
        <aside className="cn-man-aparte cn-man-aparte--aviso">
          <p className="cn-man-aparte-rotulo">Atención</p>
          <p className="cn-man-aparte-texto">{bloque.texto}</p>
        </aside>
      );

    case 'consejo':
      return (
        <aside className="cn-man-aparte cn-man-aparte--consejo">
          <p className="cn-man-aparte-rotulo">Consejo</p>
          <p className="cn-man-aparte-texto">{bloque.texto}</p>
        </aside>
      );

    case 'todavia-no':
      return (
        <aside className="cn-man-aparte cn-man-aparte--pendiente">
          <p className="cn-man-aparte-rotulo">Todavía no existe</p>
          <p className="cn-man-aparte-texto">{bloque.texto}</p>
        </aside>
      );

    case 'ruta':
      return <Ruta camino={bloque.camino} />;

    case 'estados':
      return (
        <div className="cn-man-estados">
          {ESTADOS.map((e) => {
            const Icono = e.icono;
            return (
              <div key={e.clase} className={`cn-man-estado cn-man-estado--${e.clase}`}>
                <Icono className="cn-man-estado-icono" aria-hidden="true" />
                <div className="cn-man-estado-textos">
                  <p className="cn-man-estado-nombre">{e.nombre}</p>
                  <p className="cn-man-estado-texto">{e.texto}</p>
                  <p className="cn-man-estado-forma">{e.seVeAsi}</p>
                </div>
              </div>
            );
          })}
        </div>
      );

    /*
     * The same three markings, on a sentence that reads like a filing. Serif on
     * paper, because that is what the reader will be looking at when they have
     * to recognise them. Paper stays white in dark mode, like the exported filing.
     */
    case 'ejemplo':
      return (
        <figure className="cn-man-ejemplo">
          <figcaption className="cn-man-ejemplo-rotulo">Cómo se ve en el escrito · el mismo marcado que usa el taller</figcaption>
          <p className="cn-man-ejemplo-papel">
            La demanda se presenta dentro del término de{' '}
            <span className="cn-man-marca cn-man-marca--verificado">cuatro (4) meses</span> previsto en
            el artículo 164 del CPACA. El requisito de{' '}
            <span className="cn-man-marca cn-man-marca--sin-verificar">conciliación prejudicial</span> se
            entiende satisfecho, y la tutela{' '}
            <span className="cn-man-marca cn-man-marca--no-caduca">no está sujeta a caducidad</span>.
          </p>
        </figure>
      );

    default:
      return null;
  }
};

/* ─── UNA FILA DE ARTÍCULO ─────────────────────────────────────────────────── */

const FilaDeArticulo: React.FC<{ entrada: ManualEntry; leido: boolean; onAbrir: (id: string) => void }> = ({
  entrada,
  leido,
  onAbrir
}) => (
  <li>
    <button type="button" className="cn-man-fila" onClick={() => onAbrir(entrada.articulo.id)}>
      <span className="cn-man-mono cn-man-fila-numero">{dosDigitos(entrada.numero)}</span>
      <span className="cn-man-fila-titulo">{entrada.articulo.titulo}</span>
      <span className="cn-man-fila-meta">
        {leido && (
          <span className="cn-man-fila-leido">
            <IconoVerificado className="cn-man-icono-pequeno" aria-hidden="true" />
            Leído
          </span>
        )}
        <span className="cn-man-mono">{minutosDeLectura(entrada.articulo)} min</span>
      </span>
    </button>
  </li>
);

/** Los grupos del manual en su orden, con las entradas que quedan visibles. */
const porGrupo = (entradas: readonly ManualEntry[]) =>
  MANUAL.map((g) => ({ titulo: g.titulo, entradas: entradas.filter((e) => e.grupo === g.titulo) })).filter(
    (g) => g.entradas.length > 0
  );

/* ─── LA PÁGINA ────────────────────────────────────────────────────────────── */

export const PaginaDelManual: React.FC<PaginaDelManualProps> = ({
  movil,
  articuloInicial,
  onSoporte,
  onVisitaGuiada
}) => {
  const lectura = useManualReads();
  const nuevas = useNovedadesNuevas();
  const raiz = React.useRef<HTMLDivElement>(null);

  /*
   * What Soporte handed over wins; otherwise what was open before the reload;
   * otherwise the index. An id no longer in the manual falls back to the index,
   * never to an empty pane. It is recorded on NAVIGATION, never on mount.
   */
  const [activo, setActivo] = React.useState<string | null>(() => {
    if (articuloInicial && entradaPorId(articuloInicial)) return articuloInicial;
    const guardado = recordado(PANTALLAS.manual);
    if (guardado && (guardado === NOVEDADES_ID || entradaPorId(guardado))) return guardado;
    return null;
  });
  const [consulta, setConsulta] = React.useState('');

  const abrir = React.useCallback((id: string | null) => {
    setActivo(id);
    recordar(PANTALLAS.manual, id);
    raiz.current?.scrollTo({ top: 0 });
  }, []);

  /* Soporte can hand over a different article while this page is already up. */
  React.useEffect(() => {
    if (articuloInicial && entradaPorId(articuloInicial)) abrir(articuloInicial);
  }, [articuloInicial, abrir]);

  /* El sello de versión de la barra lateral abre Manual → Novedades por aquí. */
  const abrirNovedades = React.useCallback(() => abrir(NOVEDADES_ID), [abrir]);
  useAperturaNovedades(abrirNovedades);

  const entrada = activo && activo !== NOVEDADES_ID ? entradaPorId(activo) : undefined;

  /* ─── Novedades ─────────────────────────────────────────────────────────── */
  if (activo === NOVEDADES_ID) {
    return (
      <div ref={raiz} data-visita="vista-manual" className={`cara-nueva cn-man${movil ? ' cn-man--movil' : ''}`}>
        <div className="cn-man-pagina cn-man-pagina--lectura">
          <button type="button" className="cn-man-volver" onClick={() => abrir(null)}>
            <IconoVolver className="cn-man-icono" aria-hidden="true" />
            Manual
          </button>
          <h1 className="cn-man-titulo">Novedades</h1>
          <p className="cn-man-entradilla">Qué cambió en la aplicación y cuándo.</p>
          <div className="cn-man-novedades-lista">
            <NovedadesPanel compacto={movil} />
          </div>
        </div>
      </div>
    );
  }

  /* ─── El artículo ───────────────────────────────────────────────────────── */
  if (entrada) {
    const { articulo, grupo, numero } = entrada;
    const { ruta, cuerpo } = separarRuta(articulo);
    const leido = lectura.leidos.has(articulo.id);
    /*
     * «SIGA LEYENDO»: el siguiente del orden de lectura primero, y luego los
     * demás de su grupo. Sustituye a la pareja «anterior / siguiente» de la
     * pantalla vieja por lo que dibuja la maqueta, sin perder la lectura en
     * orden.
     */
    const siguiente = ENTRADAS[numero];
    const delGrupo = ENTRADAS.filter((e) => e.grupo === grupo && e.articulo.id !== articulo.id);
    const siga = [siguiente, ...delGrupo]
      .filter((e): e is ManualEntry => Boolean(e))
      .filter((e, i, todas) => todas.findIndex((x) => x.articulo.id === e.articulo.id) === i)
      .slice(0, 3);

    return (
      <div ref={raiz} data-visita="vista-manual" className={`cara-nueva cn-man${movil ? ' cn-man--movil' : ''}`}>
        <article className="cn-man-pagina cn-man-pagina--lectura">
          <button type="button" className="cn-man-volver" onClick={() => abrir(null)}>
            <IconoVolver className="cn-man-icono" aria-hidden="true" />
            Manual
          </button>
          <div className="cn-man-chips">
            <span className="cn-man-chip">{grupo}</span>
            <span className="cn-man-chip">
              Artículo <span className="cn-man-mono">{dosDigitos(numero)}</span> de {TOTAL_ARTICULOS}
            </span>
            <span className="cn-man-chip">≈ {minutosDeLectura(articulo)} min de lectura</span>
            {leido && <span className="cn-man-chip cn-man-chip--leido">Leído</span>}
          </div>
          <h1 className="cn-man-titulo">{articulo.titulo}</h1>
          <p className="cn-man-entradilla">{articulo.entradilla}</p>
          {/* WHERE, before WHAT: the opening route is part of the header. */}
          {ruta && <Ruta camino={ruta} />}

          <div className="cn-man-bloques">
            {cuerpo.map((bloque, i) => (
              <Bloque key={`${bloque.kind}-${i}`} bloque={bloque} />
            ))}
          </div>

          {/*
            MARCAR AL FINAL, no en el índice: la marca dice «lo leí», y
            ofrecerla junto al título invita a marcarlo sin abrirlo.
          */}
          <div className="cn-man-leido">
            <button
              type="button"
              onClick={() => lectura.alternar(articulo.id)}
              className={`cn-man-boton ${leido ? 'cn-man-boton--leido' : 'cn-man-boton--suave'}`}
            >
              <IconoVerificado className="cn-man-icono" aria-hidden="true" />
              {leido ? 'Marcado como leído' : 'Marcar como leído'}
            </button>
            <p className="cn-man-nota">
              Queda registrado con su cuenta. Dice que usted lo leyó — no que el sistema haya
              comprobado que lo entendió.
            </p>
          </div>

          {siga.length > 0 && (
            <nav className="cn-man-siga" aria-labelledby="manual-siga-leyendo">
              <p id="manual-siga-leyendo" className="cn-man-siga-titulo">
                Siga leyendo
              </p>
              <ul className="cn-man-siga-lista">
                {siga.map((e) => (
                  <li key={e.articulo.id}>
                    <button type="button" className="cn-man-enlace" onClick={() => abrir(e.articulo.id)}>
                      {e.articulo.titulo}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          )}

          <div className="cn-man-recuadro">
            <div className="cn-man-recuadro-textos">
              <p className="cn-man-recuadro-titulo">¿El artículo no resolvió su duda?</p>
              <p className="cn-man-recuadro-texto">
                La conversación con soporte queda guardada en su cuenta.
              </p>
            </div>
            <button type="button" className="cn-man-boton cn-man-boton--suave" onClick={onSoporte}>
              Escribir a soporte
            </button>
          </div>
        </article>
      </div>
    );
  }

  /* ─── El índice ─────────────────────────────────────────────────────────── */
  const buscando = consulta.trim().length > 0;
  const resultados = buscar(consulta);

  return (
    <div ref={raiz} data-visita="vista-manual" className={`cara-nueva cn-man${movil ? ' cn-man--movil' : ''}`}>
      <div className="cn-man-pagina">
        <header className="cn-man-cabeza">
          <h1 className="cn-man-h1">Manual de uso</h1>
          {!movil && (
            <p className="cn-man-bajada">
              Qué hace cada cosa y cómo se hace, paso a paso. Empiece por lo que necesita hacer.
            </p>
          )}
          <label className="cn-man-buscar">
            <IconoBuscar className="cn-man-buscar-icono" aria-hidden="true" />
            <span className="cn-man-sr">Buscar en el manual</span>
            <input
              type="search"
              value={consulta}
              onChange={(ev) => setConsulta(ev.target.value)}
              placeholder="¿Qué necesita hacer?"
              className="cn-man-buscar-campo"
            />
          </label>
        </header>

        {buscando ? (
          <section className="cn-man-seccion" aria-live="polite">
            {resultados.length === 0 ? (
              <div className="cn-man-vacio">
                <h2 className="cn-man-h2">Ningún artículo menciona «{consulta.trim()}»</h2>
                <p className="cn-man-vacio-texto">
                  Pruebe con una palabra del oficio —«término», «transcrito», «membrete»— o escríbale a
                  soporte.
                </p>
                <button type="button" className="cn-man-boton cn-man-boton--suave" onClick={onSoporte}>
                  Escribir a soporte
                </button>
              </div>
            ) : (
              <>
                <h2 className="cn-man-h2">
                  {resultados.length === 1
                    ? 'Un artículo lo menciona'
                    : `${resultados.length} artículos lo mencionan`}
                </h2>
                <ul className="cn-man-filas">
                  {resultados.map((e) => (
                    <FilaDeArticulo
                      key={e.articulo.id}
                      entrada={e}
                      leido={lectura.leidos.has(e.articulo.id)}
                      onAbrir={abrir}
                    />
                  ))}
                </ul>
              </>
            )}
          </section>
        ) : (
          <>
            {/*
              NOVEDADES ARRIBA, fuera de los grupos: no es un artículo que se lea
              una vez sino una lista que crece. Se oculta al buscar.
            */}
            <button type="button" className="cn-man-novedades" onClick={() => abrir(NOVEDADES_ID)}>
              <Sparkles className="cn-man-icono" aria-hidden="true" />
              <span className="cn-man-novedades-textos">
                <span className="cn-man-novedades-titulo">Novedades</span>
                <span className="cn-man-novedades-detalle">Qué cambió en la aplicación y cuándo</span>
              </span>
              {nuevas > 0 && (
                <span
                  className="cn-man-contador"
                  title={`${nuevas} ${nuevas === 1 ? 'cambio nuevo' : 'cambios nuevos'} desde su última visita`}
                >
                  {nuevas}
                </span>
              )}
            </button>

            <section className="cn-man-seccion" aria-labelledby="manual-frecuentes">
              <h2 id="manual-frecuentes" className="cn-man-h2">
                Lo que más se pregunta
              </h2>
              <ul className="cn-man-frecuentes">
                {FRECUENTES.filter((f) => entradaPorId(f.articuloId)).map((f) => (
                  <li key={f.articuloId}>
                    <button type="button" className="cn-man-frecuente" onClick={() => abrir(f.articuloId)}>
                      <span className="cn-man-frecuente-pregunta">{f.pregunta}</span>
                      {!movil && <span className="cn-man-frecuente-detalle">{f.detalle}</span>}
                      <span className={`cn-man-costo cn-man-costo--${f.costo}`}>{ETIQUETA_DE_COSTO[f.costo]}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {movil && (
              <div className="cn-man-recuadro">
                <div className="cn-man-recuadro-textos">
                  <p className="cn-man-recuadro-titulo">¿Algo no funcionó?</p>
                  <p className="cn-man-recuadro-texto">
                    Escriba a soporte desde aquí. La conversación queda guardada en su cuenta.
                  </p>
                </div>
                <button type="button" className="cn-man-boton cn-man-boton--primario" onClick={onSoporte}>
                  Escribir a soporte
                </button>
              </div>
            )}

            <section className="cn-man-seccion" aria-labelledby="manual-por-tema">
              <h2 id="manual-por-tema" className="cn-man-h2">
                Por tema
              </h2>
              {porGrupo(ENTRADAS).map((g) => (
                <div key={g.titulo} className="cn-man-grupo">
                  <div className="cn-man-grupo-cabeza">
                    <span className="cn-man-mono cn-man-grupo-rango">
                      {dosDigitos(g.entradas[0].numero)}—{dosDigitos(g.entradas[g.entradas.length - 1].numero)}
                    </span>
                    <h3 className="cn-man-grupo-titulo">{g.titulo}</h3>
                  </div>
                  <ul className="cn-man-filas">
                    {g.entradas.map((e) => (
                      <FilaDeArticulo
                        key={e.articulo.id}
                        entrada={e}
                        leido={lectura.leidos.has(e.articulo.id)}
                        onAbrir={abrir}
                      />
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            {onVisitaGuiada && (
              <div className="cn-man-recuadro">
                <div className="cn-man-recuadro-textos">
                  <p className="cn-man-recuadro-titulo">¿Prefiere que se lo muestren?</p>
                  <p className="cn-man-recuadro-texto">
                    La visita guiada recorre cada módulo y dice para qué sirve.{' '}
                    {textoDeLaVisitaCompleta(SEGUNDOS_DE_LA_VISITA)}.
                  </p>
                </div>
                <button type="button" className="cn-man-boton cn-man-boton--primario" onClick={onVisitaGuiada}>
                  Empezar la visita
                </button>
              </div>
            )}

            {!movil && (
              <div className="cn-man-recuadro">
                <div className="cn-man-recuadro-textos">
                  <p className="cn-man-recuadro-titulo">¿Algo no funcionó?</p>
                  <p className="cn-man-recuadro-texto">
                    Escriba a soporte desde la aplicación. La conversación queda guardada en su cuenta.
                  </p>
                </div>
                <button type="button" className="cn-man-boton cn-man-boton--suave" onClick={onSoporte}>
                  Escribir a soporte
                </button>
              </div>
            )}

            <p className="cn-man-pie">
              {TOTAL_ARTICULOS} artículos · lectura completa ≈ {MINUTOS_TOTALES} min ·{' '}
              {lectura.leidos.size} marcados como leídos con su cuenta. El manual viaja con la
              aplicación, así que se puede leer aunque nada más cargue.
            </p>
          </>
        )}
      </div>
    </div>
  );
};
