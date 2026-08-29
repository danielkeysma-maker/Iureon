import React from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Info,
  LifeBuoy,
  Minus,
  Search
} from 'lucide-react';
import {
  ENTRADAS,
  MANUAL,
  MINUTOS_TOTALES,
  TOTAL_ARTICULOS,
  buscar,
  entradaPorId,
  minutosDeLectura
} from '../content/manual';
import type { ManualBlock, ManualEntry } from '../types';
import { useManualReads } from '../useManualReads';

/**
 * The manual, read the way it was written: by task, not by module.
 *
 * ─── WHY THE INDEX IS GROUPED BY VERB ───────────────────────────────────────
 *
 * "Primeros 20 minutos", "Redactar", "Grabar", "Para socios". A reader opens
 * help to DO something, not to tour the menu. Grouping by module would have
 * produced an index that is only useful to whoever already knows where the
 * feature lives — which is precisely not this reader.
 *
 * ─── WHAT THE 9a ARTBOARD ASKS FOR AND IS NOT DRAWN HERE ────────────────────
 *
 * · Reading state: the ✓ per article, the "6/13" progress bar and the "Marcar
 *   leído" button. The artboard's own note explains what it is for — a partner
 *   wants to know whether the new lawyer read the verification article before
 *   being handed curation rights. That is a per-user record on the server, and
 *   there is no table, no endpoint and no route for it. Keeping it in this
 *   browser would answer the partner's question with something only this
 *   browser knows, on the one screen whose whole subject is not trusting
 *   unverified claims. The index footer says so instead.
 *
 * · "¿Le resolvió la duda?" (Sí / No). Two buttons that record nothing are a
 *   survey nobody reads. The bridge to support survives, because navigating to
 *   Soporte is real.
 *
 * · "Imprimir". The shell is a full-height pane with its own scrolling, so the
 *   browser's print would emit one clipped page. A button that produces a
 *   broken document is worse than no button.
 *
 * Reading times come from `minutosDeLectura`, computed over the words actually
 * written, so they cannot drift the way a hand-typed "3 min" does.
 */

interface ManualViewProps {
  /** Article to open on mount — how Soporte hands a reader to the manual. */
  articuloInicial?: string;
  onSoporte: () => void;
}

/* ─── THE THREE STATES, DRAWN WITH THE SAME SHAPES AS THE APP ──────────────── */

interface EstadoSpec {
  nombre: string;
  texto: React.ReactNode;
  seVeAsi: string;
  icono: React.ElementType;
  /* Tokens, never literals: dark mode falls out of `tokens.css` on its own. */
  color: string;
  borde: string;
  fondo: string;
  discontinuo: boolean;
}

const ESTADOS: EstadoSpec[] = [
  {
    nombre: 'Verificado',
    texto:
      'Un abogado de su firma comprobó el dato contra el texto oficial de la norma y firmó esa comprobación con su nombre y la fecha. Puede citarlo sin volver a mirar la ley.',
    seVeAsi: 'Se ve así: subrayado continuo verde y un visto junto al dato.',
    icono: CheckCircle2,
    color: 'rgb(var(--verified))',
    borde: 'rgb(var(--verified-line))',
    fondo: 'rgb(var(--verified-surf))',
    discontinuo: false
  },
  {
    nombre: 'Sin verificar',
    texto: (
      <>
        El modelo lo propuso, pero <strong className="font-semibold">nadie lo ha comprobado</strong>.
        Puede ser correcto y suele serlo; aun así no lo lleve a un juzgado sin abrir la norma.
        Verificarlo toma unos dos minutos y queda hecho para toda la firma.
      </>
    ),
    seVeAsi: 'Se ve así: subrayado discontinuo ámbar, fondo con trama y un triángulo de aviso.',
    icono: AlertTriangle,
    color: 'rgb(var(--unverified))',
    borde: 'rgb(var(--unverified-line))',
    fondo: 'rgb(var(--unverified-surf))',
    discontinuo: true
  },
  {
    nombre: 'No caduca',
    texto:
      'La norma no fija término, y eso también está comprobado. No es un dato faltante: es un hecho verificado sin cifra, como en la acción de tutela.',
    seVeAsi: 'Se ve así: subrayado punteado gris y una raya horizontal.',
    icono: Minus,
    color: 'rgb(var(--neutral-fact))',
    borde: 'rgb(var(--neutral-line))',
    fondo: 'rgb(var(--neutral-surf))',
    discontinuo: false
  }
];

const BloqueEstados: React.FC = () => (
  <div className="mt-4 flex flex-col gap-3">
    {ESTADOS.map((e) => {
      const Icono = e.icono;
      return (
        <div
          key={e.nombre}
          className="flex gap-3 rounded-card border bg-surface px-4 py-3.5"
          style={{
            borderColor: e.borde,
            borderStyle: e.discontinuo ? 'dashed' : 'solid',
            borderLeft: `3px solid ${e.color}`,
            background: e.discontinuo ? e.fondo : undefined
          }}
        >
          <Icono size={20} strokeWidth={2.2} className="mt-0.5 shrink-0" style={{ color: e.color }} />
          <div className="min-w-0">
            <p className="text-subtitle text-ink-900">{e.nombre}</p>
            <p className="mt-1 text-body leading-[1.65] text-ink-700 [text-wrap:pretty]">{e.texto}</p>
            <p className="mt-1.5 font-mono text-meta text-ink-500">{e.seVeAsi}</p>
          </div>
        </div>
      );
    })}
  </div>
);

/**
 * The same three markings, on a sentence that reads like a filing.
 *
 * Serif on paper, because that is what the reader will be looking at when they
 * have to recognise them. A manual that explains in words what the interface
 * says in shape is not remembered.
 */
const BloqueEjemplo: React.FC = () => (
  <div className="mt-4 overflow-hidden rounded-card border border-line-200 bg-surface">
    <div className="card-head">
      <span className="text-meta font-semibold text-ink-900">Cómo se ve en el escrito</span>
      <span className="ml-auto text-meta text-ink-400">el mismo marcado que usa el taller</span>
    </div>
    <div className="bg-canvas p-4">
      <p className="paper-canvas rounded-control border border-line-200 px-5 py-4 text-[15px] leading-[1.85] [text-wrap:pretty]">
        La demanda se presenta dentro del término de{' '}
        <span
          style={{ borderBottom: '1.5px solid rgb(var(--verified))' }}
          className="whitespace-nowrap"
        >
          cuatro (4) meses
        </span>{' '}
        previsto en el artículo 164 del CPACA. El requisito de{' '}
        <span
          style={{
            borderBottom: '1.5px dashed rgb(var(--unverified))',
            background: 'rgb(var(--unverified-surf))'
          }}
        >
          conciliación prejudicial
        </span>{' '}
        se entiende satisfecho, y la tutela{' '}
        <span style={{ borderBottom: '1.5px dotted rgb(var(--neutral-fact))' }}>
          no está sujeta a caducidad
        </span>
        .
      </p>
    </div>
  </div>
);

/**
 * Se exporta para que la pantalla móvil (9d) renderice los bloques con ESTA
 * función y no con una copia. Un artículo que en el teléfono pierda sus pasos
 * numerados —o los pinte como párrafos— sería el mismo manual diciendo dos
 * cosas distintas según el aparato.
 */
export const Bloque: React.FC<{ bloque: ManualBlock }> = ({ bloque }) => {
  switch (bloque.kind) {
    case 'parrafo':
      return (
        <p className="mt-4 text-body leading-[1.75] text-ink-700 text-justify [text-wrap:pretty]">
          {bloque.texto}
        </p>
      );

    case 'subtitulo':
      return <h2 className="mt-6 text-subtitle text-ink-900">{bloque.texto}</h2>;

    case 'pasos':
      return (
        <ol className="mt-4 flex flex-col gap-2.5">
          {bloque.pasos.map((paso, i) => (
            <li key={paso} className="flex gap-3">
              <span className="mt-[3px] w-5 shrink-0 font-mono text-meta font-semibold text-brand-700">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-body leading-[1.7] text-ink-700 [text-wrap:pretty]">{paso}</span>
            </li>
          ))}
        </ol>
      );

    case 'lista':
      return (
        <ul className="mt-4 flex flex-col gap-2">
          {bloque.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-400" />
              <span className="text-body leading-[1.7] text-ink-700 [text-wrap:pretty]">{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'nota':
      return (
        <div className="notice mt-4">
          <Info size={15} strokeWidth={2.2} className="mt-0.5 shrink-0 text-brand-700" />
          <div className="min-w-0">
            <p className="text-ui font-semibold text-ink-900">{bloque.titulo}</p>
            <p className="mt-1 text-ui leading-[1.6] text-ink-700 [text-wrap:pretty]">
              {bloque.texto}
            </p>
          </div>
        </div>
      );

    case 'aviso':
      return (
        <div className="notice-unverified mt-4">
          <AlertTriangle size={15} strokeWidth={2.2} className="mt-0.5 shrink-0 text-unverified" />
          <p className="text-ui leading-[1.6] text-ink-700 [text-wrap:pretty]">{bloque.texto}</p>
        </div>
      );

    case 'estados':
      return <BloqueEstados />;

    case 'ejemplo':
      return <BloqueEjemplo />;

    case 'todavia-no':
      return (
        <div className="mt-4 flex items-start gap-2 rounded-card border border-line-200 bg-canvas px-3 py-2.5">
          <Minus size={15} strokeWidth={2.4} className="mt-0.5 shrink-0 text-ink-400" />
          <div className="min-w-0">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-400">
              Todavía no existe
            </p>
            <p className="mt-1 text-ui leading-[1.6] text-ink-700 [text-wrap:pretty]">
              {bloque.texto}
            </p>
          </div>
        </div>
      );

    default:
      return null;
  }
};

/* ─── THE INDEX ────────────────────────────────────────────────────────────── */

const Indice: React.FC<{
  consulta: string;
  onConsulta: (valor: string) => void;
  activo: string;
  onAbrir: (id: string) => void;
}> = ({ consulta, onConsulta, activo, onAbrir }) => {
  const encontradas = React.useMemo(() => new Set(buscar(consulta).map((e) => e.articulo.id)), [
    consulta
  ]);
  const numeroDe = React.useMemo(
    () => new Map(ENTRADAS.map((e) => [e.articulo.id, e.numero])),
    []
  );

  return (
    <aside className="flex w-[268px] shrink-0 flex-col border-r border-line-200 bg-surface">
      <div className="shrink-0 border-b border-line-100 px-3.5 py-3.5">
        <h1 className="text-subtitle text-ink-900">Manual de uso</h1>
        <label className="mt-2.5 flex h-[34px] items-center gap-2 rounded-control border border-line-200 bg-surface px-2.5 focus-within:border-brand-700">
          <Search size={13} strokeWidth={2.2} className="shrink-0 text-ink-400" />
          <input
            type="search"
            value={consulta}
            onChange={(ev) => onConsulta(ev.target.value)}
            placeholder="Buscar en el manual"
            className="min-w-0 flex-1 bg-transparent text-meta text-ink-900 placeholder:text-ink-400 focus:outline-none"
          />
        </label>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {MANUAL.map((grupo) => {
          const visibles = grupo.articulos.filter((a) => encontradas.has(a.id));
          if (visibles.length === 0) return null;

          return (
            <div key={grupo.titulo} className="mb-4 last:mb-0">
              <p className="px-2 pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                {grupo.titulo}
              </p>
              {visibles.map((articulo) => {
                const esActivo = articulo.id === activo;
                return (
                  <button
                    key={articulo.id}
                    type="button"
                    onClick={() => onAbrir(articulo.id)}
                    className={`flex w-full items-start gap-2.5 rounded-control px-2.5 py-1.5 text-left ${
                      esActivo
                        ? 'bg-brand-50 text-ink-900 shadow-[inset_2px_0_0_rgb(var(--brand-700))]'
                        : 'text-ink-700 hover:bg-canvas'
                    }`}
                  >
                    <span
                      className={`mt-[2px] w-4 shrink-0 text-center font-mono text-[11px] font-semibold ${
                        esActivo ? 'text-brand-700' : 'text-ink-400'
                      }`}
                    >
                      {String(numeroDe.get(articulo.id) ?? 0).padStart(2, '0')}
                    </span>
                    <span className={`text-ui leading-[1.4] ${esActivo ? 'font-semibold' : ''}`}>
                      {articulo.titulo}
                    </span>
                  </button>
                );
              })}
            </div>
          );
        })}

        {encontradas.size === 0 && (
          <p className="px-2 text-meta leading-[1.6] text-ink-500">
            Ningún artículo menciona eso. Pruebe con una palabra del oficio —«término»,
            «transcrito», «membrete»— o escríbale a soporte.
          </p>
        )}
      </nav>

      <div className="shrink-0 border-t border-line-100 px-3.5 py-3">
        <p className="text-meta leading-[1.55] text-ink-500 [text-wrap:pretty]">
          {TOTAL_ARTICULOS} artículos · lectura completa ≈ {MINUTOS_TOTALES} min. Viaja con la
          aplicación, así que se puede leer aunque nada más cargue.
        </p>
        {/*
          LA DECLARACIÓN DEL HUECO, dicha donde el artboard dibujaba el avance.
          El estado de lectura por persona es un registro del servidor y no
          existe todavía; guardarlo solo en este navegador respondería la
          pregunta del socio con un dato que nadie más puede ver.
        */}
        <p className="mt-2 border-t border-line-100 pt-2 font-mono text-[10.5px] leading-[1.5] text-ink-400 [text-wrap:pretty]">
          El avance de lectura por persona se agregará cuando exista en el servidor. Hasta
          entonces el manual no marca artículos leídos.
        </p>
      </div>
    </aside>
  );
};

/* ─── THE VIEW ─────────────────────────────────────────────────────────────── */

export const ManualView: React.FC<ManualViewProps> = ({ articuloInicial, onSoporte }) => {
  /* El MISMO registro que la pantalla movil: una marca, no dos. */
  const lectura = useManualReads();
  const inicial = (articuloInicial && entradaPorId(articuloInicial)) || ENTRADAS[0];
  const [activo, setActivo] = React.useState<string>(inicial.articulo.id);
  const [consulta, setConsulta] = React.useState('');
  const cuerpo = React.useRef<HTMLDivElement>(null);

  /* Soporte can hand over a different article while this view is already up. */
  React.useEffect(() => {
    if (articuloInicial && entradaPorId(articuloInicial)) setActivo(articuloInicial);
  }, [articuloInicial]);

  const entrada: ManualEntry = entradaPorId(activo) ?? ENTRADAS[0];
  const { articulo, grupo, numero } = entrada;
  const anterior = numero > 1 ? ENTRADAS[numero - 2] : undefined;
  const siguiente = numero < TOTAL_ARTICULOS ? ENTRADAS[numero] : undefined;

  const abrir = React.useCallback((id: string) => {
    setActivo(id);
    cuerpo.current?.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-1 bg-canvas font-sans">
      <Indice consulta={consulta} onConsulta={setConsulta} activo={activo} onAbrir={abrir} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center gap-2.5 border-b border-line-200 bg-surface px-6">
          <span className="shrink-0 text-meta text-ink-500">{grupo}</span>
          <ChevronRight size={12} strokeWidth={2.4} className="shrink-0 text-ink-400" />
          <span className="truncate text-meta font-semibold text-ink-900">{articulo.titulo}</span>
          <span className="ml-auto shrink-0 font-mono text-meta text-ink-400">
            ≈ {minutosDeLectura(articulo)} min de lectura
          </span>
        </header>

        <div ref={cuerpo} className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <article className="mx-auto w-full max-w-[704px] pb-10">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              Artículo {String(numero).padStart(2, '0')} de {TOTAL_ARTICULOS}
            </p>
            <h1 className="mt-1.5 text-display text-ink-900 [text-wrap:pretty]">
              {articulo.titulo}
            </h1>
            <p className="mt-2.5 text-[15px] leading-[1.7] text-ink-700 [text-wrap:pretty]">
              {articulo.entradilla}
            </p>

            {articulo.bloques.map((bloque, i) => (
              <Bloque key={`${bloque.kind}-${i}`} bloque={bloque} />
            ))}

            {/*
              MARCAR AL FINAL, no en el indice: la marca dice «lo lei», y
              ofrecerla junto al titulo invita a marcarlo sin abrirlo. Aqui hay
              que haber bajado hasta el final del articulo.
            */}
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line-200 pt-4">
              <button
                type="button"
                onClick={() => lectura.alternar(articulo.id)}
                className={`btn btn-sm ${
                  lectura.leidos.has(articulo.id)
                    ? 'border border-[rgb(var(--verified-line))] bg-[rgb(var(--verified-surf))] text-verified'
                    : 'btn-secondary'
                }`}
              >
                <CheckCircle2 size={13} strokeWidth={2.4} />
                {lectura.leidos.has(articulo.id) ? 'Marcado como leído' : 'Marcar como leído'}
              </button>
              <p className="text-meta text-ink-400">
                Queda registrado con su cuenta. Dice que usted lo leyó — no que el sistema haya
                comprobado que lo entendió.
              </p>
            </div>

            <nav className="mt-4 flex items-center gap-3 border-t border-line-200 pt-4">
              {anterior && (
                <button type="button" className="btn-neutral" onClick={() => abrir(anterior.articulo.id)}>
                  <ChevronLeft size={13} strokeWidth={2.2} />
                  <span className="max-w-[220px] truncate">{anterior.articulo.titulo}</span>
                </button>
              )}
              {siguiente && (
                <button
                  type="button"
                  className="btn-primary ml-auto"
                  onClick={() => abrir(siguiente.articulo.id)}
                >
                  <span className="max-w-[260px] truncate">
                    Siguiente · {siguiente.articulo.titulo}
                  </span>
                  <ChevronRight size={13} strokeWidth={2.2} />
                </button>
              )}
            </nav>

            <div className="mt-3.5 flex flex-wrap items-center gap-2.5 rounded-card border border-line-200 bg-surface px-3.5 py-3">
              <LifeBuoy size={15} strokeWidth={2.2} className="shrink-0 text-ink-400" />
              <span className="text-ui text-ink-700">
                ¿El artículo no resolvió su duda?
              </span>
              <button
                type="button"
                className="btn-secondary btn-sm ml-auto"
                onClick={onSoporte}
              >
                Escribir a soporte
              </button>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
};
