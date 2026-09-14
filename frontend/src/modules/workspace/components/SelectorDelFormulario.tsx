import React from 'react';
import { SelectorEnCascada, type OpcionEnCascada } from './SelectorEnCascada';

/**
 * Un selector de formulario dentro de un diálogo, con la cara nueva.
 *
 * ─── POR QUÉ NO ES `SelectorEnCascada` A SECAS ─────────────────────────────
 *
 * El diálogo es una hoja a pantalla completa por debajo de 640 px (el `sm:` de
 * `Dialog`). Ahí la lista del sistema es mejor que cualquier lista pintada: se
 * abre entera, se desplaza con el dedo y no pelea con el teclado. Es la misma
 * decisión de la barra de Redacción en el teléfono (`WorkshopConfigMobile`), y
 * se pinta igual: `cn-red-select`.
 *
 * En escritorio, en cambio, la lista del sistema es el desplegable azul del
 * sistema operativo, que es exactamente la interfaz vieja que se reportó. Ahí
 * va `SelectorEnCascada` EN LÍNEA: el cuerpo del diálogo se desplaza, y una
 * lista flotante quedaría recortada por él.
 *
 * UNA SOLA FUENTE DE DATOS: las dos formas leen las mismas `opciones`. Lo que
 * cambia con el ancho es la pintura, nunca la lista.
 */

const ANCHO_DE_ESCRITORIO = '(min-width: 640px)';

/** Si la ventana ya no pone el diálogo como hoja de teléfono. Se lee al montar y se sigue. */
export const useVentanaAncha = (): boolean => {
  const [ancha, setAncha] = React.useState(() =>
    typeof window === 'undefined' || typeof window.matchMedia !== 'function' ? true : window.matchMedia(ANCHO_DE_ESCRITORIO).matches
  );
  React.useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const consulta = window.matchMedia(ANCHO_DE_ESCRITORIO);
    const cambio = () => setAncha(consulta.matches);
    cambio();
    consulta.addEventListener('change', cambio);
    return () => consulta.removeEventListener('change', cambio);
  }, []);
  return ancha;
};

interface SelectorDelFormularioProps {
  id: string;
  etiqueta: string;
  valor: string;
  opciones: OpcionEnCascada[];
  onChange: (valor: string) => void;
  vacio?: string;
  /** Lo que se lee con la lista abierta: cuántas hay, por qué no hay. En el teléfono va debajo del campo. */
  pie?: React.ReactNode;
  cargando?: boolean;
  /** Apagada en las listas cortas: una lupa sobre cinco opciones es un paso de más. */
  conBusqueda?: boolean;
}

export const SelectorDelFormulario: React.FC<SelectorDelFormularioProps> = ({
  id,
  etiqueta,
  valor,
  opciones,
  onChange,
  vacio = 'Elegir…',
  pie,
  cargando = false,
  conBusqueda = true
}) => {
  const ancha = useVentanaAncha();

  if (ancha) {
    return (
      <SelectorEnCascada
        etiqueta={etiqueta}
        valor={valor}
        opciones={opciones}
        onChange={onChange}
        vacio={vacio}
        pie={pie}
        cargando={cargando}
        conBusqueda={conBusqueda}
        enLinea
      />
    );
  }

  /*
   * LAS CABECERAS DE GRUPO VIAJAN COMO `<optgroup>`, que el `<select>` trae de
   * fábrica. El aviso largo del grupo no cabe en su rótulo: va en el pie.
   */
  const bloques: { titulo: string | null; filas: OpcionEnCascada[] }[] = [];
  for (const o of opciones) {
    const titulo = o.grupo?.titulo ?? null;
    const ultimo = bloques[bloques.length - 1];
    if (ultimo && ultimo.titulo === titulo) ultimo.filas.push(o);
    else bloques.push({ titulo, filas: [o] });
  }
  const conVacio = !opciones.some((o) => o.valor === valor);
  const fila = (o: OpcionEnCascada) => (
    <option key={o.valor} value={o.valor}>
      {o.busqueda ? `${o.etiqueta} · ${o.busqueda}` : o.etiqueta}
    </option>
  );

  return (
    <div className="cn-red-movil-campo">
      <label htmlFor={id} className="cn-red-rotulo">
        {etiqueta}
      </label>
      <select id={id} value={valor} onChange={(e) => onChange(e.target.value)} disabled={cargando} className="cn-red-select">
        {conVacio && (
          <option value={valor} disabled>
            {cargando ? 'Cargando…' : vacio}
          </option>
        )}
        {bloques.map((b, i) =>
          b.titulo ? (
            <optgroup key={`${b.titulo}-${i}`} label={b.titulo}>
              {b.filas.map(fila)}
            </optgroup>
          ) : (
            <React.Fragment key={`suelto-${i}`}>{b.filas.map(fila)}</React.Fragment>
          )
        )}
      </select>
      {pie && <span className="cn-red-nota">{pie}</span>}
    </div>
  );
};
