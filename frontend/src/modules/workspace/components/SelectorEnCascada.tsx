import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import type { EstadoDeFicha } from '../services/fichaEnLaLista';
import { ordenDelDesplegable } from '../services/ordenDelDesplegable';

/**
 * Un selector de la cascada de Redacción, con la cara nueva.
 *
 * ─── POR QUÉ NO ES EL `Combobox` ───────────────────────────────────────────
 *
 * El `Combobox` lo comparten el selector de expediente y el diálogo de
 * revisión, que todavía no cambiaron de cara: reestilizarlo cambiaría
 * pantallas que nadie pidió tocar. Y le falta lo que el diseño exige aquí
 * (README-app §2, «Los selectores de Redacción»):
 *
 *  · CABECERAS DE GRUPO. Las fichas «por remisión» repetían su advertencia en
 *    cada fila, y una advertencia repetida catorce veces no la lee nadie. Aquí
 *    se dice UNA vez, encima del bloque, con el texto que manda el servidor.
 *  · UN BLOQUE APARTE DE LA LISTA que no es una opción ni se filtra: «que la
 *    guía la proponga» es otra forma de llegar, no una actuación más. Sin texto
 *    en el filtro va antes de las filas; con texto, después de las que
 *    coinciden (`ordenDelDesplegable`).
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
  /**
   * Texto que también encuentra la fila al filtrar, además del nombre. Es para
   * el radicado de un caso: va como detalle en mono, pero es justamente lo que
   * el abogado escribe al buscar. Sin él, la fila se filtra solo por su nombre.
   */
  busqueda?: string;
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
  /** Un bloque aparte de la lista que no es una opción y no se filtra. Recibe cómo cerrar. */
  antesDeLaLista?: (cerrar: () => void) => React.ReactNode;
  /** Clase de ancho del campo dentro de la fila. */
  anchoCampo?: string;
  /**
   * La lista se abre DENTRO DEL FLUJO, empujando lo de abajo, en vez de flotar.
   * Es para los selectores que viven en un panel que se desplaza: ahí una lista
   * absoluta queda recortada por el contenedor y sus últimas filas no se ven.
   */
  enLinea?: boolean;
  /**
   * EL LLAMADOR SE QUEDA CON LA BÚSQUEDA, y entonces también con el filtrado.
   *
   * ─── POR QUÉ HIZO FALTA ──────────────────────────────────────────────────
   *
   * El filtro de esta lista es un «contiene» sobre el nombre y sobre
   * `busqueda`. Para una actuación del catálogo eso es exacto. Para un caso no:
   * una cédula se busca por dígitos y desde el principio, un radicado por
   * segmentos y con o sin guiones, y el nombre de un testigo no está en la
   * etiqueta de la fila. Esas reglas ya existen, probadas, en el módulo de
   * Expedientes; meterlas aquí sería una segunda copia que se queda vieja.
   *
   * Con esta prop, el llamador entrega `opciones` YA FILTRADAS y esta lista no
   * vuelve a filtrar —filtrar dos veces con reglas distintas descarta filas que
   * la primera sí encontró—, pinta la caja de búsqueda contra su estado, y
   * puede poner una fila suya bajo la lupa y su propio texto de «no hay
   * ninguna». Sin la prop, todo sigue exactamente como estaba.
   */
  busquedaControlada?: {
    valor: string;
    onCambio: (texto: string) => void;
    /** Cuántas opciones hay sin filtrar, solo para el contador «N de M». */
    total: number;
    /**
     * Una fila del llamador justo bajo la lupa: un filtro de rama, el aviso de
     * que nada coincide. Va ahí porque el llamador es el único que sabe POR QUÉ
     * no quedó ninguna, y porque un filtro que salta debajo de los resultados
     * deja de parecer un filtro.
     */
    encima?: React.ReactNode;
  };
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
  anchoCampo = '',
  enLinea = false,
  busquedaControlada
}) => {
  const [abierto, setAbierto] = useState(false);
  const [filtroPropio, setFiltroPropio] = useState('');
  const filtro = busquedaControlada ? busquedaControlada.valor : filtroPropio;
  const setFiltro = busquedaControlada ? busquedaControlada.onCambio : setFiltroPropio;
  const contenedor = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLDivElement>(null);

  const elegida = opciones.find((o) => o.valor === valor);

  /* Con `busquedaControlada`, `opciones` ya viene filtrada: filtrar otra vez con
     una regla distinta descartaría filas que la primera sí encontró. */
  const visibles = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (busquedaControlada || !q) return opciones;
    return opciones.filter((o) => o.etiqueta.toLowerCase().includes(q) || Boolean(o.busqueda?.toLowerCase().includes(q)));
  }, [opciones, filtro, busquedaControlada]);

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
    /* `setFiltro` cambia de identidad con la prop del llamador; el disparo lo
       manda `abierto`, y añadirla aquí limpiaría el filtro en cada render. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  /*
   * EN LÍNEA, EL PANEL SE MUEVE HASTA LA LISTA. Solo en ese modo: la lista
   * flotante de Redacción vive en una pantalla que no se desplaza, y
   * `scrollIntoView` movería ancestros con `overflow: hidden` que nadie debe mover.
   */
  useEffect(() => {
    if (abierto && enLinea) lista.current?.scrollIntoView({ block: 'nearest' });
  }, [abierto, enLinea]);

  /*
   * LA LISTA FLOTANTE NO PASA DEL BORDE INFERIOR DE LA VENTANA. El tope fijo
   * (`100dvh - 190px`) suponía la barra arriba de la pantalla; en el asistente
   * de Redactar el selector quedó a media altura y en 1366×768 la lista acababa
   * 250 px por debajo del borde, con el pie y parte de las filas fuera de vista.
   * Se mide el sitio que queda bajo el campo al abrir; nunca menos de 320 px,
   * que es lo que necesitan la lupa, una fila y el pie para servir de algo.
   *
   * SI ARRIBA HAY MÁS SITIO, ABRE HACIA ARRIBA. Con el selector de caso encima,
   * la actuación quedó a 510 px en una ventana de 768: abajo cabían 190 px y el
   * mínimo de 320 volvía a sacar la lista por el borde. Arriba cabían 460.
   */
  const [espacio, setEspacio] = useState<{ alto: number; arriba: boolean } | null>(null);
  useEffect(() => {
    if (!abierto || enLinea || !contenedor.current) return;
    const caja = contenedor.current.getBoundingClientRect();
    const abajo = window.innerHeight - caja.bottom - 22;
    const arriba = caja.top - 22;
    const haciaArriba = abajo < 320 && arriba > abajo;
    setEspacio({ alto: Math.max(320, Math.floor(haciaArriba ? arriba : abajo)), arriba: haciaArriba });
  }, [abierto, enLinea]);

  const bloqueAparte = antesDeLaLista?.(() => setAbierto(false));

  const filas = (
    <div className="cn-red-filas">
      {cargando && <p className="cn-red-lista-nota">Cargando…</p>}

      {!cargando && visibles.length === 0 && (
        <p className="cn-red-lista-nota">
          {opciones.length === 0 ? 'No hay opciones para esta combinación.' : 'Ninguna coincide con ese texto.'}
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
  );

  return (
    <div ref={contenedor} className={`cn-red-campo ${enLinea ? 'cn-red-campo--en-linea' : ''} ${anchoCampo}`}>
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
        <div
          ref={lista}
          className={`cn-red-lista ${espacio?.arriba ? 'cn-red-lista--arriba' : ''}`}
          style={espacio ? ({ '--cn-red-espacio': `${espacio.alto}px` } as React.CSSProperties) : undefined}
        >
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
                {visibles.length} de {busquedaControlada?.total ?? opciones.length}
              </span>
            </div>
          )}

          {/* La fila del llamador va PEGADA A LA LUPA y no se mueve al escribir:
              un control de filtro que salta debajo de los resultados deja de
              parecer un filtro. */}
          {busquedaControlada?.encima}

          {/*
            EL ORDEN LO DECIDE EL FILTRO. Sin texto, el bloque aparte va antes de
            las filas; con texto, las coincidencias van primero, bajo la lupa, y
            el bloque después. La caja de búsqueda no se mueve, así que el foco
            sigue en ella mientras se escribe.
          */}
          {ordenDelDesplegable(filtro).map((zona) => (
            <React.Fragment key={zona}>{zona === 'filas' ? filas : bloqueAparte}</React.Fragment>
          ))}

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
