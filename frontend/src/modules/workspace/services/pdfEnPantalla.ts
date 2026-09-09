import type { PDFDocumentProxy } from 'pdfjs-dist';

/**
 * Pintar un PDF en el navegador CON su capa de texto encima.
 *
 * ─── POR QUÉ NO BASTA UN `<iframe>` ─────────────────────────────────────────
 *
 * El visor del expediente abre los PDF en un marco y el navegador los pinta
 * con su lector interno. Eso sirve para leer y no sirve aquí: dentro de un
 * marco de otro origen la aplicación no puede leer la selección, así que
 * resaltar o comentar un pasaje sería imposible. La capa de texto de pdf.js es
 * lo que lo resuelve — el lienzo pinta la página tal cual y encima quedan los
 * mismos renglones en texto transparente, seleccionables con el dedo o con el
 * ratón como en cualquier página.
 *
 * ─── LA LIBRERÍA SE CARGA CUANDO SE ABRE UN PDF, NO ANTES ───────────────────
 *
 * `pdfjs-dist` son 450 KB de código y 1,2 MB de proceso de trabajo. Se importa
 * dentro de la función, así que no entra en el paquete inicial: solo lo paga
 * quien abre un original en PDF.
 *
 * ─── LAS FUENTES ESTÁNDAR VIVEN EN `public/pdfjs` ───────────────────────────
 *
 * Muchos PDF de juzgado no incrustan Times ni Helvetica: dan por hecho que el
 * lector las tiene. pdf.js las trae en `standard_fonts`, y sin decirle dónde
 * están sustituye los glifos y el renglón se pinta con otras medidas. Se
 * copiaron a `public/` porque una URL de un CDN sería una dependencia de red
 * en una pantalla que se abre sobre documentos privilegiados.
 */

export interface PaginaPintada {
  /** Ancho y alto en píxeles CSS, para dimensionar el contenedor. */
  ancho: number;
  alto: number;
}

export interface DocumentoPdf {
  paginas: number;
  /** Pinta una página en el lienzo y su texto en la capa. Devuelve la medida final. */
  pintar: (numero: number, lienzo: HTMLCanvasElement, capa: HTMLElement, anchoDisponible: number) => Promise<PaginaPintada>;
  cerrar: () => void;
}

/** Más de esto no mejora nada en pantalla y multiplica la memoria del lienzo. */
const MAX_DPR = 2;

let cargando: Promise<typeof import('pdfjs-dist')> | null = null;

/**
 * Carga la librería una sola vez, con su proceso de trabajo y sus fuentes ya
 * configurados. Se exporta porque leer el TEXTO de un PDF —para proponer la
 * actuación antes de saber cuál es— necesita exactamente el mismo montaje: dos
 * configuraciones separadas terminarían divergiendo en la ruta del trabajador,
 * que es un fallo silencioso (el documento simplemente no abre).
 */
export const cargarPdfjs = async (): Promise<typeof import('pdfjs-dist')> => {
  if (!cargando) {
    cargando = (async () => {
      const pdfjs = await import('pdfjs-dist');
      const { default: urlDelTrabajador } = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
      pdfjs.GlobalWorkerOptions.workerSrc = urlDelTrabajador;
      return pdfjs;
    })();
  }
  return cargando;
};

/**
 * Abre el documento. Los bytes se COPIAN antes de entregarlos: pdf.js
 * transfiere el búfer al proceso de trabajo y lo deja desprendido, así que el
 * original quedaría vacío para cualquier otro uso —descargarlo, por ejemplo—
 * sin que nada lo dijera.
 */
export const abrirPdf = async (bytes: ArrayBuffer): Promise<DocumentoPdf> => {
  const pdfjs = await cargarPdfjs();
  const tarea = pdfjs.getDocument({
    data: bytes.slice(0),
    standardFontDataUrl: `${import.meta.env.BASE_URL}pdfjs/standard_fonts/`
  });
  const documento: PDFDocumentProxy = await tarea.promise;

  /* Un repintado cancela al anterior: cambiar de página deprisa dejaba dos dibujando sobre el mismo lienzo. */
  let enCurso: { cancel: () => void } | null = null;

  return {
    paginas: documento.numPages,

    async pintar(numero, lienzo, capa, anchoDisponible) {
      enCurso?.cancel();
      const pagina = await documento.getPage(numero);
      const natural = pagina.getViewport({ scale: 1 });
      const escala = Math.max(0.1, anchoDisponible / natural.width);
      const vista = pagina.getViewport({ scale: escala });

      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const vistaDelLienzo = pagina.getViewport({ scale: escala * dpr });
      lienzo.width = Math.floor(vistaDelLienzo.width);
      lienzo.height = Math.floor(vistaDelLienzo.height);
      lienzo.style.width = `${Math.floor(vista.width)}px`;
      lienzo.style.height = `${Math.floor(vista.height)}px`;

      const contexto = lienzo.getContext('2d');
      if (!contexto) throw new Error('El navegador no pudo preparar el lienzo para pintar el PDF.');

      const dibujo = pagina.render({ canvas: lienzo, canvasContext: contexto, viewport: vistaDelLienzo });
      enCurso = dibujo;
      await dibujo.promise;
      enCurso = null;

      /*
       * La capa de texto se rehace entera en cada pintado. Reutilizarla con
       * `update()` conserva rangos apuntando a nodos de la página anterior, y
       * un resaltado que sobrevive al cambio de página se pinta en el renglón
       * equivocado — que es peor que perderlo.
       */
      capa.replaceChildren();
      capa.style.setProperty('--total-scale-factor', String(escala));
      pdfjs.setLayerDimensions(capa as HTMLDivElement, vista);
      const capaDeTexto = new pdfjs.TextLayer({
        textContentSource: pagina.streamTextContent(),
        container: capa,
        viewport: vista
      });
      await capaDeTexto.render();

      return { ancho: Math.floor(vista.width), alto: Math.floor(vista.height) };
    },

    cerrar() {
      enCurso?.cancel();
      /* Se destruye la TAREA, que es la dueña del proceso de trabajo; el documento por sí solo no lo suelta. */
      void tarea.destroy();
    }
  };
};
