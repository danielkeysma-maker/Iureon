import React from 'react';
import { Loader2 } from 'lucide-react';
import { IconoBuscar } from '../../../design/ArtboardIcons';
import { searchPrecedents, type CorpusPrecedent, type CorpusStatus } from '../services/legalSearch.api';

/**
 * El buscador en móvil. Artboard 5c, con las medidas copiadas de su HTML.
 *
 * ─── LO QUE DICE LA MAQUETA, CITADO ─────────────────────────────────────────
 *
 *     cabecera:   padding:8px 16px 12px · campo con `border:1px solid #17456B`
 *                 y `box-shadow:0 0 0 3px rgba(23,69,107,.10)` · radius 8
 *     conteo:     «38 resultados» 400 11.5px MONO #8B96A6 + «Filtros · 2»
 *     cuerpo:     padding:12px 16px; gap:9px
 *     rótulo:     600 9.5px MONO tracking .1em uppercase + filete
 *                 curadas → texto #17456B, filete #CBD9E4
 *                 automático → texto #8B96A6, filete #E3E7EC
 *     curada:     border #CBD9E4 + `border-left:3px solid #17456B`
 *                 providencia 600 14px MONO · cita en serif 13/1.7 con filete
 *                 SÓLIDO de 2px · botones «Citar» y «Texto completo» de 44px
 *     automático: border #E3E7EC + `border-left:3px solid #CFD6E0`
 *                 providencia 600 13.5px MONO en #2B3542 —más apagada— y la
 *                 cita con filete PUNTEADO. Sin botón de citar.
 *
 * ─── LA SEPARACIÓN ES LA PANTALLA, NO UN FILTRO ─────────────────────────────
 *
 * 1h ya lo decía y 5c lo conserva en 390px: curado y automático son **dos
 * bloques con encabezado propio**, no un chip perdido. Lo curado lo leyó una
 * persona y lleva sus hechos y su ratio; lo automático lo trajo el registro
 * oficial y **nadie lo ha leído**. Por eso el segundo va más bajo en contraste,
 * con filete punteado, y **sin botón de citar**: citar algo que nadie leyó debe
 * costar un clic más.
 *
 * En una pantalla pequeña esa diferencia importa más, no menos — hay menos
 * espacio para matices y más tentación de tocar el primer botón que aparezca.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · «Anotada por D. Cárdenas» y su nota. `CorpusPrecedent` no tiene campo de
 *   anotador: el corpus guarda el fragmento y su procedencia, no quién lo
 *   comentó. Es construible —una tabla de anotaciones por firma— y queda
 *   anotado como tal, no como imposible.
 * · «Podría ir en contra de su tesis». Exige comparar la providencia con la
 *   tesis del escrito, y ni el corpus ni la búsqueda saben cuál es la tesis.
 * · «Filtros · 2» abre las corporaciones y el año. Aquí el botón existe y lleva
 *   a esa hoja; el contador cuenta filtros REALES aplicados, no un número fijo.
 */

const CORPORACIONES = [
  { id: 'TODAS', label: 'Todas' },
  { id: 'CORTE_CONSTITUCIONAL', label: 'Corte Constitucional' },
  { id: 'CORTE_SUPREMA', label: 'Corte Suprema' },
  { id: 'CONSEJO_DE_ESTADO', label: 'Consejo de Estado' }
] as const;

const limpiar = (texto: string): string =>
  texto.replace(/\s+/g, ' ').replace(/^[^A-ZÁÉÍÓÚÑ«"]*/u, '').trim();

interface TarjetaProps {
  item: CorpusPrecedent;
  curada: boolean;
  onCitar: (item: CorpusPrecedent) => void;
  copiada: boolean;
}

const Tarjeta: React.FC<TarjetaProps> = ({ item, curada, onCitar, copiada }) => (
  <article
    className={`rounded-[8px] px-3 py-[11px] ${
      curada ? 'border border-brand-line bg-surface' : 'border border-line-200 bg-surface'
    }`}
    style={{
      borderLeft: `3px solid ${curada ? 'rgb(var(--brand-700))' : 'rgb(var(--neutral-line))'}`
    }}
  >
    <div className="flex items-baseline gap-2">
      <h3
        className={`min-w-0 flex-1 font-mono font-semibold ${
          curada ? 'text-[14px] text-ink-900' : 'text-[13.5px] text-ink-700'
        }`}
      >
        {item.providencia ?? 'Fragmento sin providencia registrada'}
      </h3>
      <span
        className={`shrink-0 font-mono text-[9.5px] font-semibold uppercase tracking-[0.07em] ${
          curada ? 'text-brand-700' : 'text-ink-500'
        }`}
      >
        {curada ? 'Curada' : 'Automático'}
      </span>
    </div>

    <p className="mt-[3px] text-[11.5px] leading-snug text-ink-500">
      {[item.corporacion?.replace(/_/g, ' '), item.magistradoPonente && `M.P. ${item.magistradoPonente}`]
        .filter(Boolean)
        .join(' · ') || 'Procedencia no registrada'}
    </p>

    {/*
      LA CITA EN SERIF CON FILETE: solido cuando alguien la leyo, PUNTEADO
      cuando la trajo el registro y nadie la ha leido. La textura dice lo mismo
      que el color, para quien no distingue el contraste.
    */}
    <blockquote
      className={`mt-2 pl-2.5 font-legal text-[13px] leading-[1.7] ${
        curada
          ? 'border-l-2 border-line-200 text-ink-900'
          : 'border-l-2 border-dotted border-neutral-line text-ink-700'
      }`}
    >
      {limpiar(item.contentChunk).slice(0, curada ? 400 : 300)}
    </blockquote>

    {curada ? (
      <div className="mt-2.5 flex gap-[7px]">
        <button
          type="button"
          onClick={() => onCitar(item)}
          disabled={!item.providencia}
          className="h-11 flex-1 rounded-[6px] bg-brand-700 text-[13px] font-semibold text-on-brand disabled:opacity-50"
        >
          {copiada ? 'Copiada' : 'Citar'}
        </button>
        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 flex-1 items-center justify-center rounded-[6px] border border-line-200 bg-surface text-[13px] font-medium text-ink-700"
          >
            Texto completo
          </a>
        )}
      </div>
    ) : (
      /*
        SIN BOTON DE CITAR. Nadie ha leido esto: el unico camino es abrirlo en
        la fuente. Citar algo que nadie leyo debe costar un clic mas, y en el
        telefono —donde el pulgar toca lo primero que aparece— esa friccion es
        justamente la que protege.
      */
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-ink-400">Sin lectura humana</span>
        {item.sourceUrl && (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11.5px] font-semibold text-brand-700 underline underline-offset-2"
          >
            Leer en la fuente oficial
          </a>
        )}
      </div>
    )}
  </article>
);

const Rotulo: React.FC<{ texto: string; curada: boolean }> = ({ texto, curada }) => (
  <div className="flex items-center gap-[7px]">
    <span
      className={`shrink-0 font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] ${
        curada ? 'text-brand-700' : 'text-ink-400'
      }`}
    >
      {texto}
    </span>
    <div className={`h-px flex-1 ${curada ? 'bg-brand-line' : 'bg-line-200'}`} />
  </div>
);

export const SearchMobileView: React.FC = () => {
  const [consulta, setConsulta] = React.useState('');
  const [buscando, setBuscando] = React.useState(false);
  const [resultados, setResultados] = React.useState<CorpusPrecedent[]>([]);
  const [estado, setEstado] = React.useState<CorpusStatus | null>(null);
  const [motivo, setMotivo] = React.useState<string | undefined>(undefined);
  const [corporacion, setCorporacion] = React.useState<string>('TODAS');
  const [filtrosAbiertos, setFiltrosAbiertos] = React.useState(false);
  const [copiada, setCopiada] = React.useState<string | null>(null);

  const buscar = async () => {
    if (!consulta.trim() || buscando) return;
    setBuscando(true);
    try {
      const r = await searchPrecedents(consulta.trim());
      setResultados(r.items ?? []);
      setEstado(r.status);
      setMotivo(r.reason);
    } finally {
      setBuscando(false);
    }
  };

  const visibles = resultados.filter(
    (r) => corporacion === 'TODAS' || r.corporacion === corporacion
  );
  const curadas = visibles.filter((r) => r.curado !== false);
  const automaticas = visibles.filter((r) => r.curado === false);
  /* Cuenta filtros REALES aplicados, no un numero fijo como en la maqueta. */
  const filtrosActivos = corporacion === 'TODAS' ? 0 : 1;

  const citar = (item: CorpusPrecedent) => {
    const partes = [
      item.providencia,
      item.corporacion?.replace(/_/g, ' '),
      item.magistradoPonente && `M.P. ${item.magistradoPonente}`
    ];
    const cita = partes.filter(Boolean).join(', ');
    if (!cita) return;
    void navigator.clipboard.writeText(cita);
    setCopiada(item.id);
    window.setTimeout(() => setCopiada(null), 2000);
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-canvas">
      <header className="shrink-0 border-b border-line-200 bg-surface px-4 pb-3 pt-2">
        <div className="relative">
          <IconoBuscar className="pointer-events-none absolute left-3 top-[13px] h-3.5 w-3.5 text-ink-400" />
          <textarea
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void buscar();
              }
            }}
            rows={2}
            placeholder="Estabilidad laboral reforzada, despido sin permiso del inspector…"
            className="field-area w-full resize-none pl-9 text-[13.5px] leading-[1.6]"
          />
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <span className="font-mono text-[11.5px] text-ink-400">
            {estado === null
              ? 'Sin buscar'
              : `${visibles.length} ${visibles.length === 1 ? 'resultado' : 'resultados'}`}
          </span>
          <button
            type="button"
            onClick={() => setFiltrosAbiertos(true)}
            className="rounded-[6px] border border-line-200 bg-canvas px-2.5 py-1 text-[11.5px] font-medium text-ink-700"
          >
            Filtros{filtrosActivos > 0 ? ` · ${filtrosActivos}` : ''}
          </button>
          <button
            type="button"
            onClick={() => void buscar()}
            disabled={!consulta.trim() || buscando}
            className="btn-primary ml-auto h-9 px-4 disabled:opacity-50"
          >
            {buscando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Buscar'}
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="flex flex-col gap-[9px]">
          {estado !== null && visibles.length === 0 && (
            <p className="rounded-[8px] border border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] px-3.5 py-3 text-justify text-[12.5px] leading-snug text-unverified [text-wrap:pretty]">
              {motivo ?? `Sin coincidencias para «${consulta.trim()}» en el corpus indexado.`}
            </p>
          )}

          {curadas.length > 0 && (
            <>
              <Rotulo texto={`Curadas por la firma · ${curadas.length}`} curada />
              {curadas.map((r) => (
                <Tarjeta
                  key={r.id}
                  item={r}
                  curada
                  onCitar={citar}
                  copiada={copiada === r.id}
                />
              ))}
            </>
          )}

          {automaticas.length > 0 && (
            <>
              <div className="mt-1">
                <Rotulo
                  texto={`Descubrimiento automático · ${automaticas.length}`}
                  curada={false}
                />
              </div>
              {automaticas.map((r) => (
                <Tarjeta
                  key={r.id}
                  item={r}
                  curada={false}
                  onCitar={citar}
                  copiada={false}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {filtrosAbiertos && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end lg:hidden">
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setFiltrosAbiertos(false)}
            className="flex-1 bg-black/40"
          />
          <div className="rounded-t-card border-t border-line-200 bg-surface pb-[env(safe-area-inset-bottom)]">
            <header className="border-b border-line-200 px-4 py-3">
              <h2 className="text-[14px] font-semibold text-ink-900">Corporación</h2>
            </header>
            <div className="p-2">
              {CORPORACIONES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setCorporacion(c.id);
                    setFiltrosAbiertos(false);
                  }}
                  className={`flex min-h-[48px] w-full items-center rounded-control px-3 text-left text-[13.5px] ${
                    corporacion === c.id ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-900'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
