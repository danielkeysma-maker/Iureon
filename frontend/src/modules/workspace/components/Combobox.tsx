import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

/**
 * Un selector con lupa, y con el estado de cada opción a la vista.
 *
 * POR QUÉ NO ES UN `<select>` NATIVO. Con veintidós ramas y hasta noventa
 * actuaciones por rama, un desplegable nativo obliga a recorrerlas todas con la
 * rueda del ratón; y sobre todo NO PUEDE mostrar si una actuación está
 * verificada, que es justo lo que el abogado necesita saber ANTES de elegir.
 *
 * POR QUÉ LA LUPA TAMBIÉN EN LA RAMA. Veintidós no parecen muchas hasta que hay
 * que encontrar "Superintendencias (SIC, Salud, Financiera, SSPD)" leyendo una
 * por una. Escribir "super" es más rápido que buscar con la vista, y quien ya
 * sabe cuál quiere no debería tener que mirar la lista.
 *
 * EL BOTÓN TRUNCA Y NUNCA EMPUJA. La versión anterior ponía el nombre completo
 * en una fila de 42px sin límite de ancho, así que "Civil & Comercial (CGP)" se
 * montaba sobre el término y sobre el botón de al lado. Aquí el ancho está
 * acotado y el texto se corta con puntos suspensivos; el nombre completo vive en
 * el `title` y en la propia lista.
 */

export interface OpcionCombobox {
  valor: string;
  etiqueta: string;
  /** Lo que va a la derecha en la lista: término, cuenta, lo que aplique. */
  detalle?: string;
  /** El ícono de estado, con su silueta propia. Opcional. */
  icono?: React.ReactNode;
}

interface ComboboxProps {
  /** Va sobre el control cuando está abierto. Nunca dentro del botón. */
  etiqueta: string;
  valor: string;
  opciones: OpcionCombobox[];
  onChange: (valor: string) => void;
  /** Se muestra cuando no hay nada elegido. */
  vacio?: string;
  /** Bajo la lista: lo que hay que saber de este conjunto. */
  pie?: React.ReactNode;
  cargando?: boolean;
  /** Ancho máximo del botón cerrado. Es lo que impide que la barra se desborde. */
  anchoBoton?: string;
  /** Sin lupa cuando hay tres opciones y buscar sobra. */
  conBusqueda?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  etiqueta,
  valor,
  opciones,
  onChange,
  vacio = 'Elegir…',
  pie,
  cargando = false,
  anchoBoton = 'max-w-[200px]',
  conBusqueda = true
}) => {
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState('');
  const contenedor = useRef<HTMLDivElement>(null);

  const elegida = opciones.find((o) => o.valor === valor);

  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return opciones;
    return opciones.filter((o) => o.etiqueta.toLowerCase().includes(q));
  }, [opciones, filtro]);

  /*
   * Cerrar al hacer clic fuera y con Escape.
   *
   * Sin esto quedan tres desplegables abiertos a la vez tapando el documento, y
   * la única salida es elegir algo — que obliga a cambiar la configuración para
   * poder cerrarla.
   */
  useEffect(() => {
    if (!abierto) return;

    const fuera = (e: MouseEvent) => {
      if (!contenedor.current?.contains(e.target as Node)) setAbierto(false);
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAbierto(false);
    };

    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', escape);
    };
  }, [abierto]);

  // El filtro se limpia al cerrar: reabrir con la búsqueda anterior puesta hace
  // creer que la lista se quedó corta.
  useEffect(() => {
    if (!abierto) setFiltro('');
  }, [abierto]);

  /*
   * `min-w-0` y sin `shrink-0`: es lo que permite que el control se encoja
   * cuando la barra queda estrecha, en vez de empujar a los de al lado fuera de
   * la pantalla.
   */
  return (
    <div ref={contenedor} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        title={elegida?.etiqueta ?? vacio}
        aria-expanded={abierto}
        aria-label={etiqueta}
        className={`flex w-full ${anchoBoton} items-center gap-1.5 rounded-control border bg-canvas px-2.5 py-1 text-[12.5px] font-medium transition-colors ${
          abierto ? 'border-brand-700 bg-surface' : 'border-line-200 hover:bg-surface'
        }`}
      >
        <span className={`min-w-0 truncate ${elegida ? 'text-ink-900' : 'text-ink-400'}`}>
          {elegida?.etiqueta ?? vacio}
        </span>
        {elegida?.icono}
        <ChevronDown className="h-3 w-3 shrink-0 text-ink-400" strokeWidth={2.4} />
      </button>

      {abierto && (
        <div className="surface-raised absolute left-0 top-full z-40 mt-1 w-[340px] max-w-[80vw] overflow-hidden">
          <p className="border-b border-line-100 px-3 py-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            {etiqueta}
          </p>

          {conBusqueda && (
            <div className="relative border-b border-line-100">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
              <input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Escriba para filtrar…"
                autoFocus
                className="w-full border-0 bg-transparent py-2 pl-8 pr-16 text-ui text-ink-900 placeholder:text-ink-400 focus:outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-400">
                {visibles.length} de {opciones.length}
              </span>
            </div>
          )}

          <div className="max-h-[300px] overflow-y-auto">
            {cargando && <p className="px-3 py-4 text-meta text-ink-400">Cargando…</p>}

            {!cargando && visibles.length === 0 && (
              <p className="px-3 py-4 text-meta text-ink-500">
                {opciones.length === 0
                  ? 'No hay opciones para esta combinación.'
                  : 'Ninguna coincide con ese texto.'}
              </p>
            )}

            {visibles.map((o) => (
              <button
                key={o.valor}
                type="button"
                onClick={() => {
                  onChange(o.valor);
                  setAbierto(false);
                }}
                title={o.detalle ? `${o.etiqueta} — ${o.detalle}` : o.etiqueta}
                className={`flex w-full items-start gap-2 border-b border-line-100 px-3 py-2 text-left last:border-0 ${
                  o.valor === valor ? 'bg-brand-50' : 'hover:bg-canvas'
                }`}
              >
                {/*
                  DOS RENGLONES, CON EL NOMBRE ARRIBA.
                  
                  Estaban en uno solo, nombre a la izquierda y detalle a la
                  derecha, y el detalle llevaba `shrink-0`. Los términos de este
                  catálogo NO son "4 meses": son párrafos —«Dentro de los diez
                  (10) días siguientes a la presentación de la solicitud el juez
                  proferirá el fallo…»— así que el detalle se comía la fila
                  entera y aplastaba el nombre a cero. La lista mostraba términos
                  donde debía mostrar actuaciones.
                */}
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-ui ${
                      o.valor === valor ? 'font-medium text-brand-700' : 'text-ink-900'
                    }`}
                  >
                    {o.etiqueta}
                  </span>
                  {o.detalle && (
                    <span className="mt-0.5 block truncate font-mono text-[11px] text-ink-500">
                      {o.detalle}
                    </span>
                  )}
                </span>

                <span className="mt-0.5 flex shrink-0 items-center gap-1.5">
                  {o.icono}
                  {o.valor === valor && (
                    <Check className="h-3.5 w-3.5 text-brand-700" strokeWidth={2.6} />
                  )}
                </span>
              </button>
            ))}
          </div>

          {pie && <div className="border-t border-line-100 px-3 py-2 text-meta text-ink-500">{pie}</div>}
        </div>
      )}
    </div>
  );
};
