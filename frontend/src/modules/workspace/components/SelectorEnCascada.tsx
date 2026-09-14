import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import type { EstadoDeFicha } from '../services/fichaEnLaLista';

/**
 * Un selector de la cascada de Redacción, con la cara nueva.
 *
 * ─── POR QUÉ NO ES EL `Combobox` ───────────────────────────────────────────
 *
 * El `Combobox` lo comparten el selector de expediente, el puente al ataque y
 * el diálogo de revisión, que todavía no cambiaron de cara: reestilizarlo
 * cambiaría cuatro pantallas que nadie pidió tocar. Y le falta lo que el
 * diseño exige aquí (README-app §2, «Los selectores de Redacción»):
 *
 *  · CABECERAS DE GRUPO. Las fichas «por remisión» repetían su advertencia en
 *    cada fila, y una advertencia repetida catorce veces no la lee nadie. Aquí
 *    se dice UNA vez, encima del bloque, con el texto que manda el servidor.
 *  · UN BLOQUE ANTES DE LA LISTA que no es una opción ni se filtra: «que la guía
 *    la proponga» es otra forma de llegar, no una actuación más.
 *  · EL ESTADO COMO NODO. El detalle de la fila era texto plano en mono; el
 *    estado de una ficha es una píldora con su silueta —el guion de «sin
 *    verificar»— y el artículo en mono, que es lo único citable de la fila.
 *
 * El comportamiento es el mismo del `Combobox`: lupa, cierre al hacer clic
 * fuera o con Escape, el filtro se limpia al cerrar y el botón trunca sin
 * empujar a sus vecinos. Solo cambia la pintura.
 */

export interface GrupoDeOpciones {
  /** Lo que se dice una vez encima del bloque. */
  titulo: string;
  aviso?: string;
}

export interface OpcionEnCascada {
  valor: string;
  etiqueta: string;
  /** Lo que va bajo el nombre: el estado de la ficha, el aviso de la opción. */
  detalle?: React.ReactNode;
  /** El detalle en texto, para el `title`. */
  detalleTexto?: string;
  icono?: React.ReactNode;
  /** Filas consecutivas con el mismo grupo comparten una sola cabecera. */
  grupo?: GrupoDeOpciones;
}

interface SelectorEnCascadaProps {
  etiqueta: string;
  valor: string;
  opciones: OpcionEnCascada[];
  onChange: (valor: string) => void;
  vacio?: string;
  pie?: React.ReactNode;
  cargando?: boolean;
  conBusqueda?: boolean;
  /** Un bloque sobre la lista que no es una opción y no se filtra. Recibe cómo cerrar. */
  antesDeLaLista?: (cerrar: () => void) => React.ReactNode;
  /** Clase de ancho del campo dentro de la fila. */
  anchoCampo?: string;
}

export const SelectorEnCascada: React.FC<SelectorEnCascadaProps> = ({
  etiqueta,
  valor,
  opciones,
  onChange,
  vacio = 'Elegir…',
  pie,
  cargando = false,
  conBusqueda = true,
  antesDeLaLista,
  anchoCampo = ''
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

  // Reabrir con la búsqueda anterior puesta hace creer que la lista se quedó corta.
  useEffect(() => {
    if (!abierto) setFiltro('');
  }, [abierto]);

  return (
    <div ref={contenedor} className={`cn-red-campo ${anchoCampo}`}>
      <span className="cn-red-rotulo">{etiqueta}</span>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        title={elegida?.etiqueta ?? vacio}
        aria-expanded={abierto}
        aria-label={etiqueta}
        className={`cn-red-disparador ${abierto ? 'cn-red-disparador--abierto' : ''}`}
      >
        <span className={`cn-red-disparador-texto ${elegida ? '' : 'cn-red-disparador-vacio'}`}>
          {elegida?.etiqueta ?? vacio}
        </span>
        <ChevronDown className="cn-red-disparador-chevron" strokeWidth={1.8} aria-hidden />
      </button>

      {abierto && (
        <div className="cn-red-lista">
          {conBusqueda && (
            <div className="cn-red-buscar-caja">
              <Search className="cn-red-buscar-lupa" strokeWidth={1.6} aria-hidden />
              <input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Escriba para filtrar…"
                aria-label={`Filtrar ${etiqueta.toLowerCase()}`}
                autoFocus
                className="cn-red-buscar"
              />
              <span className="cn-red-buscar-cuenta">
                {visibles.length} de {opciones.length}
              </span>
            </div>
          )}

          {antesDeLaLista?.(() => setAbierto(false))}

          <div className="cn-red-filas">
            {cargando && <p className="cn-red-lista-nota">Cargando…</p>}

            {!cargando && visibles.length === 0 && (
              <p className="cn-red-lista-nota">
                {opciones.length === 0
                  ? 'No hay opciones para esta combinación.'
                  : 'Ninguna coincide con ese texto.'}
              </p>
            )}

            {visibles.map((o, i) => {
              /* La cabecera sale donde el grupo empieza, también con la lista filtrada. */
              const anterior = visibles[i - 1];
              const abreGrupo = o.grupo && anterior?.grupo?.titulo !== o.grupo.titulo;
              const actual = o.valor === valor;
              return (
                <React.Fragment key={o.valor}>
                  {abreGrupo && o.grupo && (
                    <div className="cn-red-grupo" role="presentation">
                      <p className="cn-red-grupo-titulo">{o.grupo.titulo}</p>
                      {o.grupo.aviso && <p className="cn-red-grupo-aviso">{o.grupo.aviso}</p>}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.valor);
                      setAbierto(false);
                    }}
                    title={o.detalleTexto ? `${o.etiqueta} — ${o.detalleTexto}` : o.etiqueta}
                    className={`cn-red-fila ${actual ? 'cn-red-fila--elegida' : ''}`}
                  >
                    <span className="cn-red-fila-icono">
                      {actual ? <Check className="cn-red-fila-visto" strokeWidth={2.2} aria-hidden /> : o.icono}
                    </span>
                    <span className="cn-red-fila-textos">
                      <span className="cn-red-fila-nombre">{o.etiqueta}</span>
                      {o.detalle && <span className="cn-red-fila-detalle">{o.detalle}</span>}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {pie && <div className="cn-red-lista-pie">{pie}</div>}
        </div>
      )}
    </div>
  );
};

/** La píldora del estado de una ficha: el guion es solo de lo que no está verificado. */
export const EstadoDeLaFicha: React.FC<{ estado: EstadoDeFicha }> = ({ estado }) => (
  <span className={`cn-red-estado cn-red-estado--${estado.tono}`}>
    {estado.tono === 'ok' && <span className="cn-red-punto" aria-hidden />}
    {estado.articulo && (
      <>
        <span className="cn-red-mono">{estado.articulo}</span>
        {' · '}
      </>
    )}
    {estado.texto}
  </span>
);
