import React from 'react';
import { Check, ChevronRight, Clock, X } from 'lucide-react';
import { DialogoDeAyuda, atraparTabulador } from '../../help/components/DialogoDeAyuda';
import { textoDeDuracion, textoDeLaVisitaCompleta } from './capitulos';
import type { Direccion, VisitaGuiada as EstadoDeVisita } from './useVisitaGuiada';

/**
 * The overlay of the guided tour: the door, a dimmed screen with one lit
 * element and a card beside it, and the closing. No library — a spotlight is a
 * box whose shadow covers the rest of the screen, and everything else is
 * measuring.
 *
 * ─── DE DÓNDE SALE CADA PIEZA ───────────────────────────────────────────────
 *
 * `public/handoff/app-manual-y-soporte.html`: la puerta con los capítulos
 * (:78), el foco sobre el panel (:105), sobre Redactar (:175) y sobre el saldo
 * (:241), el cierre con tres cosas para empezar (:305) y la hoja inferior del
 * teléfono (:334). El artboard «antes» (:566) es lo que se dejó atrás: el globo
 * sobre una pantalla al 45 % de opacidad.
 *
 * ─── EL FOCO DEJA A PLENA LUZ LO QUE EXPLICA ────────────────────────────────
 *
 * El hueco no lleva relleno ni opacidad: lo que queda dentro se ve con sus
 * colores reales, así que su contraste es el de la pantalla y no el de un velo.
 * Lo oscuro es la sombra de la caja, que cubre todo lo DEMÁS. La geometría sale
 * de `getBoundingClientRect` del elemento con un halo uniforme de 6 px, nunca
 * de píxeles puestos a ojo. El anillo va en el azul de marca y no en el oro de
 * la maqueta: el oro marca el módulo activo en la barra, y la visita recorre
 * esa barra.
 *
 * ─── MEASURING, NOT ASSUMING ────────────────────────────────────────────────
 *
 * The stop names its element by `data-visita`; this component waits for it to
 * appear (the module was just opened and may still be mounting), scrolls it
 * into view, then measures. Desktop and phone layouts are both in the DOM and
 * hidden by CSS, so «the element» is the first candidate with a non-empty box.
 * A stop with no visible candidate after a short wait is skipped in the
 * direction the reader was moving — never shown pointing at the void.
 *
 * ─── EN EL TELÉFONO, HOJA INFERIOR Y LA PANTALLA SE MUEVE SOLA ─────────────
 *
 * Un globo anclado a un elemento no cabe en 375 px: taparía lo que explica.
 * La tarjeta es una hoja pegada abajo y es la PANTALLA la que se desplaza hasta
 * dejar el elemento en el espacio libre sobre la hoja. Si el elemento no se
 * puede desplazar —una barra fija abajo— la hoja sube arriba en vez de
 * taparlo. Con «reducir movimiento» el desplazamiento es instantáneo.
 *
 * Keyboard: Esc leaves, ← → move, and Tab stays inside the card. The
 * «Siguiente» button takes focus on every stop.
 */

interface Caja {
  top: number;
  left: number;
  width: number;
  height: number;
}

const MARGEN = 6;
const ANCHO_GLOBO = 420;
const ALTO_ESTIMADO = 300;
const AIRE = 16;
const INTENTOS = 90; // ≈1.5 s at 60 fps: enough for a module to mount, short enough to feel like a skip.

const dosDigitos = (n: number): string => String(n).padStart(2, '0');

const esVisible = (el: Element): boolean => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

const buscarObjetivo = (objetivos: readonly string[]): HTMLElement | null => {
  for (const id of objetivos) {
    const candidatos = document.querySelectorAll<HTMLElement>(`[data-visita="${id}"]`);
    for (const c of candidatos) if (esVisible(c)) return c;
  }
  return null;
};

const medir = (el: HTMLElement): Caja => {
  const r = el.getBoundingClientRect();
  return {
    top: Math.max(0, r.top - MARGEN),
    left: Math.max(0, r.left - MARGEN),
    width: Math.min(window.innerWidth, r.width + MARGEN * 2),
    height: Math.min(window.innerHeight, r.height + MARGEN * 2)
  };
};

const useEsEscritorio = (): boolean => {
  const consulta = React.useMemo(() => window.matchMedia('(min-width: 1024px)'), []);
  const [ancho, setAncho] = React.useState(consulta.matches);
  React.useEffect(() => {
    const alCambiar = (e: MediaQueryListEvent) => setAncho(e.matches);
    consulta.addEventListener('change', alCambiar);
    return () => consulta.removeEventListener('change', alCambiar);
  }, [consulta]);
  return ancho;
};

const prefiereMenosMovimiento = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** El ancestro que realmente se desplaza: en esta aplicación cada módulo tiene el suyo. */
const contenedorQueSeDesplaza = (el: HTMLElement): HTMLElement | null => {
  let nodo = el.parentElement;
  while (nodo && nodo !== document.body) {
    const estilo = window.getComputedStyle(nodo);
    if (/(auto|scroll)/.test(estilo.overflowY) && nodo.scrollHeight > nodo.clientHeight) return nodo;
    nodo = nodo.parentElement;
  }
  return null;
};

/**
 * Desplaza la pantalla para que el elemento quede en el espacio libre sobre la
 * hoja: centrado si cabe, con su borde de arriba a la vista si no.
 */
const desplazarSobreLaHoja = (el: HTMLElement, altoHoja: number): void => {
  const r = el.getBoundingClientRect();
  const libre = window.innerHeight - altoHoja - AIRE * 2;
  if (r.top >= AIRE && r.bottom <= AIRE + libre) return;
  const destino = r.height <= libre ? AIRE + (libre - r.height) / 2 : AIRE;
  const opciones: ScrollToOptions = {
    top: r.top - destino,
    behavior: prefiereMenosMovimiento() ? 'auto' : 'smooth'
  };
  const contenedor = contenedorQueSeDesplaza(el);
  if (contenedor) contenedor.scrollBy(opciones);
  else window.scrollBy(opciones);
};

/** Where the balloon goes on a wide screen, given the lit box and its real height. */
const posicionDelGlobo = (caja: Caja, alto: number): React.CSSProperties => {
  const altoVentana = window.innerHeight;
  const anchoVentana = window.innerWidth;
  const left = Math.min(Math.max(AIRE, caja.left), anchoVentana - ANCHO_GLOBO - AIRE);

  if (caja.top + caja.height + AIRE + alto < altoVentana) {
    return { top: caja.top + caja.height + AIRE, left };
  }
  if (caja.top - AIRE - alto > 0) {
    return { top: caja.top - AIRE - alto, left };
  }
  const derecha = caja.left + caja.width + AIRE;
  const leftLateral =
    derecha + ANCHO_GLOBO < anchoVentana ? derecha : Math.max(AIRE, caja.left - ANCHO_GLOBO - AIRE);
  return { top: Math.min(Math.max(AIRE, caja.top), altoVentana - alto - AIRE), left: leftLateral };
};

/* ─── LA PARADA ────────────────────────────────────────────────────────────── */

const Parada: React.FC<{ visita: EstadoDeVisita }> = ({ visita }) => {
  const { paso, numero, total, capitulo, capitulos, paradaEnCapitulo, siguiente, anterior, saltar, salir } = visita;
  const [caja, setCaja] = React.useState<Caja | null>(null);
  const [altoTarjeta, setAltoTarjeta] = React.useState(ALTO_ESTIMADO);
  const [hojaArriba, setHojaArriba] = React.useState(false);
  const escritorio = useEsEscritorio();
  const direccion = React.useRef<Direccion>(1);
  const botonSiguiente = React.useRef<HTMLButtonElement>(null);
  const tarjeta = React.useRef<HTMLElement>(null);
  const objetivo = React.useRef<HTMLElement | null>(null);
  const idDelTitulo = React.useId();

  /* Find the element, bring it into view, measure; or skip. */
  React.useEffect(() => {
    if (!paso) {
      setCaja(null);
      objetivo.current = null;
      return;
    }
    let intentos = 0;
    let cuadro = 0;
    let cancelado = false;

    const intentar = () => {
      if (cancelado) return;
      const el = buscarObjetivo(paso.objetivos);
      if (el) {
        objetivo.current = el;
        if (escritorio) el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        else desplazarSobreLaHoja(el, tarjeta.current?.offsetHeight ?? ALTO_ESTIMADO);
        // One more frame so the scroll has started before measuring; the scroll listener follows the rest.
        cuadro = window.requestAnimationFrame(() => {
          if (!cancelado) setCaja(medir(el));
        });
        return;
      }
      intentos += 1;
      if (intentos >= INTENTOS) {
        saltar(direccion.current);
        return;
      }
      cuadro = window.requestAnimationFrame(intentar);
    };
    setCaja(null);
    cuadro = window.requestAnimationFrame(intentar);

    return () => {
      cancelado = true;
      window.cancelAnimationFrame(cuadro);
    };
    // `saltar` changes identity with the index; the effect must run per stop only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, escritorio]);

  /* Re-measure on resize and on any scroll: the lit box must follow the element. */
  React.useEffect(() => {
    if (!paso) return;
    const remedir = () => {
      const el = objetivo.current;
      if (el && esVisible(el)) setCaja(medir(el));
    };
    window.addEventListener('resize', remedir);
    document.addEventListener('scroll', remedir, { capture: true, passive: true });
    return () => {
      window.removeEventListener('resize', remedir);
      document.removeEventListener('scroll', remedir, { capture: true });
    };
  }, [paso]);

  /* The card's REAL height decides where the balloon fits, and whether the sheet covers the element. */
  React.useLayoutEffect(() => {
    const alto = tarjeta.current?.offsetHeight;
    if (alto && alto !== altoTarjeta) setAltoTarjeta(alto);
    if (!escritorio && caja) {
      const centro = caja.top + caja.height / 2;
      setHojaArriba(caja.height < window.innerHeight / 2 && centro > window.innerHeight - (alto ?? altoTarjeta));
    }
  }, [caja, paso, escritorio, altoTarjeta]);

  const irSiguiente = React.useCallback(() => {
    direccion.current = 1;
    siguiente();
  }, [siguiente]);
  const irAnterior = React.useCallback(() => {
    direccion.current = -1;
    anterior();
  }, [anterior]);

  React.useEffect(() => {
    if (!paso) return;
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        salir();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        irSiguiente();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        irAnterior();
      } else if (tarjeta.current) {
        atraparTabulador(e, tarjeta.current);
      }
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [paso, salir, irSiguiente, irAnterior]);

  React.useEffect(() => {
    if (caja) botonSiguiente.current?.focus({ preventScroll: true });
  }, [caja]);

  if (!paso || !capitulo) return null;

  const ultimo = numero === total;
  const estiloTarjeta: React.CSSProperties | undefined =
    escritorio && caja ? posicionDelGlobo(caja, altoTarjeta) : undefined;
  const claseTarjeta = escritorio
    ? 'cn-vis-tarjeta cn-vis-globo'
    : `cn-vis-tarjeta cn-vis-hoja${hojaArriba ? ' cn-vis-hoja--arriba' : ''}`;

  return (
    <div className="cara-nueva cn-vis" role="presentation" data-listo={caja ? 'si' : 'no'}>
      {/* The spotlight: its shadow is the dimming. It takes no clicks so the card is the only control. */}
      {caja && (
        <div
          aria-hidden="true"
          className="cn-vis-foco"
          style={{ top: caja.top, left: caja.left, width: caja.width, height: caja.height }}
        />
      )}

      <section
        ref={tarjeta}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idDelTitulo}
        className={claseTarjeta}
        style={estiloTarjeta}
      >
        {!escritorio && <span className="cn-vis-asidero" aria-hidden="true" />}
        <div className="cn-vis-cabeza">
          <p className="cn-vis-capitulo">
            <span className="cn-vis-mono">{dosDigitos(capitulo.numero)}</span>
            <span className="cn-vis-capitulo-nombre">{capitulo.titulo}</span>
          </p>
          <button
            type="button"
            onClick={salir}
            aria-label="Salir de la visita"
            title="Salir (Esc)"
            className="cn-vis-cerrar"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <h2 id={idDelTitulo} className="cn-vis-titulo">
          {paso.titulo}
        </h2>
        <p className="cn-vis-texto">{paso.texto}</p>

        {/* Un segmento por capítulo: el avance se lee por capítulos, que es como se anunció en la puerta. */}
        <div className="cn-vis-avance" aria-hidden="true">
          {capitulos.map((c) => (
            <span key={c.id} className={c.numero <= capitulo.numero ? 'cn-vis-avance-hecho' : undefined} />
          ))}
        </div>

        <div className="cn-vis-botones">
          <button
            ref={botonSiguiente}
            type="button"
            onClick={irSiguiente}
            className="cn-vis-boton cn-vis-boton--primario"
          >
            {ultimo ? 'Terminar' : 'Siguiente'}
          </button>
          <button
            type="button"
            onClick={irAnterior}
            disabled={numero <= 1}
            className="cn-vis-boton cn-vis-boton--suave"
          >
            Anterior
          </button>
          <p className="cn-vis-donde">
            Capítulo {capitulo.numero} de {capitulos.length} · parada {paradaEnCapitulo} de{' '}
            {capitulo.pasos.length}
          </p>
          <button type="button" onClick={salir} className="cn-vis-boton cn-vis-boton--texto">
            Salir
          </button>
        </div>
      </section>
    </div>
  );
};

/* ─── LA VISITA ENTERA ─────────────────────────────────────────────────────── */

export const VisitaGuiada: React.FC<{ visita: EstadoDeVisita }> = ({ visita }) => {
  const { fase, capitulos, paraEmpezar, empezar, irA, iniciar, salir } = visita;
  const idPuerta = React.useId();
  const idCierre = React.useId();
  const segundos = capitulos.reduce((suma, c) => suma + c.segundos, 0);

  return (
    <>
      {/* LA PUERTA: los capítulos con nombre y duración, y se puede entrar por cualquiera. */}
      <DialogoDeAyuda abierto={fase === 'puerta'} onCerrar={salir} tituloId={idPuerta} clase="cn-vis-puerta">
        <div className="cn-vis-dialogo-cuerpo">
          <p className="cn-vis-duracion">
            <Clock aria-hidden="true" />
            {textoDeLaVisitaCompleta(segundos)}
          </p>
          <h2 id={idPuerta} className="cn-vis-h1">
            Le muestro dónde está cada cosa
          </h2>
          <p className="cn-vis-bajada">
            Es un recorrido por la aplicación real, con su firma y su saldo: cada parada abre su
            módulo y señala dónde está. <strong>No cambia nada</strong> y puede salir en cualquier
            momento con Esc.
          </p>

          <h3 className="cn-vis-rotulo">Los capítulos</h3>
          <ol className="cn-vis-capitulos">
            {capitulos.map((c, i) => (
              <li key={c.id}>
                <button type="button" className="cn-vis-capitulo-fila" onClick={() => empezar(i)}>
                  <span className="cn-vis-mono">{dosDigitos(c.numero)}</span>
                  <span className="cn-vis-capitulo-fila-titulo">{c.titulo}</span>
                  <span className="cn-vis-capitulo-fila-duracion">{textoDeDuracion(c.segundos)}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="cn-vis-acciones">
            <button
              type="button"
              data-foco-inicial
              onClick={() => empezar(0)}
              className="cn-vis-boton cn-vis-boton--primario"
            >
              Empezar la visita
            </button>
            <button type="button" onClick={() => irA('manual')} className="cn-vis-boton cn-vis-boton--suave">
              Prefiero leer el manual
            </button>
          </div>
          <p className="cn-vis-pie">
            Cada capítulo lleva su duración estimada, calculada por lo que se lee en él. Puede
            entrar directo al que le interese.
          </p>
        </div>
      </DialogoDeAyuda>

      {fase === 'paso' && <Parada visita={visita} />}

      {/* EL CIERRE: tres cosas concretas para empezar, a módulos que el plan incluye. */}
      <DialogoDeAyuda abierto={fase === 'cierre'} onCerrar={salir} tituloId={idCierre} clase="cn-vis-cierre">
        <div className="cn-vis-dialogo-cuerpo">
          <span className="cn-vis-sello" aria-hidden="true">
            <Check />
          </span>
          <h2 id={idCierre} className="cn-vis-h1">
            Eso es lo que hay que saber para empezar
          </h2>
          <p className="cn-vis-bajada">
            Lo demás se aprende usándolo. Si algo no aparece donde lo busca, el manual está
            organizado por lo que necesita hacer, no por el nombre del módulo.
          </p>

          {paraEmpezar.length > 0 && (
            <>
              <h3 className="cn-vis-rotulo">Por dónde empezar</h3>
              <ul className="cn-vis-puertas">
                {paraEmpezar.map((p) => (
                  <li key={p.destino}>
                    <button type="button" className="cn-vis-puerta-fila" onClick={() => irA(p.destino)}>
                      <span className="cn-vis-puerta-textos">
                        <span className="cn-vis-puerta-titulo">{p.titulo}</span>
                        <span className="cn-vis-puerta-detalle">{p.queHace}</span>
                      </span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="cn-vis-acciones">
            <button type="button" data-foco-inicial onClick={salir} className="cn-vis-boton cn-vis-boton--primario">
              Ir a Inicio
            </button>
            <button type="button" onClick={iniciar} className="cn-vis-boton cn-vis-boton--suave">
              Volver a verla
            </button>
          </div>
          <p className="cn-vis-pie">
            La visita queda en Inicio y en el manual para volver a verla cuando entre alguien nuevo a
            la firma. No se ofrece sola una segunda vez en este navegador.
          </p>
        </div>
      </DialogoDeAyuda>
    </>
  );
};
