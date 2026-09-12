import React from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import {
  cargarOriginal,
  htmlDelDocx,
  porQueNoHayVisor,
  type FuenteDelOriginal,
  type OriginalCargado
} from '../services/originalDelEscrito';
import { CSS_DE_LA_CAPA_DE_TEXTO, abrirPdf, type DocumentoPdf } from '../services/pdfEnPantalla';

/**
 * UN ARCHIVO, TAL COMO ES. El visor pequeño.
 *
 * ─── DOS MODULOS LO USAN, Y POR RAZONES DISTINTAS ──────────────────────────
 *
 * EXPEDIENTES lo abre desde un enlace firmado: el documento se guardó y hay
 * que traerlo. REDACCION lo abre desde el `File` que el abogado acaba de
 * escoger, que ya está en el navegador — ahí no hay red, ni servidor, ni nada
 * guardado, y aun así se ve el documento exacto.
 *
 * Esa segunda es la que contesta una queja concreta: al adjuntar un escrito en
 * Redacción no se veía el documento sino, más tarde, su texto extraído. Para
 * MIRARLO nunca hizo falta guardarlo; hacía falta pintarlo.
 *
 * ─── POR QUÉ NO SE REUSA `VisorDelOriginal` ────────────────────────────────
 *
 * Se intentó. Aquel visor pide `revisionId`, las capas de marcas del taller,
 * el total de anotaciones, un «volver al papel» y una superficie de selección
 * — y además deja REEMPLAZAR el archivo. Nada de eso existe aquí: un
 * expediente no tiene papel al que volver, ni anotaciones que anclar, y
 * cambiar el documento de un caso no es una acción que esta pantalla deba
 * ofrecer.
 *
 * Pasarle nulos a todo eso habría dejado media docena de botones muertos, que
 * es exactamente lo que esta casa no hace.
 *
 * LO QUE SÍ SE COMPARTE ES LA LÓGICA, que es donde estaría el defecto si se
 * duplicara: `cargarOriginal` descarga y clasifica, `abrirPdf` pinta la página
 * con su capa de texto, `htmlDelDocx` convierte el Word, `porQueNoHayVisor`
 * explica los formatos que no se abren. Los dos visores llaman a los mismos
 * servicios; lo único distinto es la carcasa, y las carcasas SON distintas.
 *
 * ─── EL PDF SALE EXACTO; EL WORD NO, Y SE DICE ─────────────────────────────
 *
 * Un PDF se pinta en un lienzo: su formato ES la página, así que se ve igual
 * que en el juzgado. Un `.docx` se convierte a HTML — conserva negritas,
 * tablas y listas, pero pierde centrados, tipografías y saltos de página—, y
 * eso va escrito debajo del documento en vez de dejar creer que se ve todo.
 */
export const VisorDeArchivo: React.FC<{
  /** De dónde salen los bytes: del archivo en memoria, o de un enlace firmado. */
  fuente: FuenteDelOriginal;
}> = ({ fuente }) => {
  const [estado, setEstado] = React.useState<
    | { fase: 'cargando'; porcentaje: number | null }
    | { fase: 'error'; mensaje: string }
    | { fase: 'listo'; original: OriginalCargado }
  >({ fase: 'cargando', porcentaje: null });
  const [pagina, setPagina] = React.useState(1);
  const [totalPaginas, setTotalPaginas] = React.useState(0);
  const [html, setHtml] = React.useState<{ cuerpo: string; avisos: string[] } | null>(null);

  const lienzo = React.useRef<HTMLCanvasElement | null>(null);
  const capa = React.useRef<HTMLDivElement | null>(null);
  const caja = React.useRef<HTMLDivElement | null>(null);
  const pdf = React.useRef<DocumentoPdf | null>(null);

  React.useEffect(() => {
    let vivo = true;
    setEstado({ fase: 'cargando', porcentaje: null });
    setHtml(null);
    setPagina(1);

    cargarOriginal(fuente, (p) => {
      if (vivo) setEstado({ fase: 'cargando', porcentaje: p });
    })
      .then((r) => {
        if (!vivo) return;
        if (!r.hay) {
          setEstado({ fase: 'error', mensaje: r.motivo });
          return;
        }
        setEstado({ fase: 'listo', original: r.original });
      })
      .catch((e: unknown) => {
        if (vivo) setEstado({ fase: 'error', mensaje: e instanceof Error ? e.message : 'No se pudo traer el archivo.' });
      });

    return () => {
      vivo = false;
      /* El documento de pdf.js se cierra: si no, cada apertura deja su copia. */
      pdf.current?.cerrar();
      pdf.current = null;
    };
  }, [fuente]);

  /* El PDF: se abre una vez y se pinta la página pedida. */
  React.useEffect(() => {
    if (estado.fase !== 'listo' || estado.original.clase !== 'pdf') return;
    let vivo = true;
    (async () => {
      try {
        if (!pdf.current) {
          pdf.current = await abrirPdf(estado.original.bytes);
          if (!vivo) return;
          setTotalPaginas(pdf.current.paginas);
        }
        if (!lienzo.current || !capa.current) return;
        const ancho = (caja.current?.clientWidth ?? 800) - 24;
        await pdf.current.pintar(pagina, lienzo.current, capa.current, ancho);
      } catch (e) {
        if (vivo) setEstado({ fase: 'error', mensaje: e instanceof Error ? e.message : 'No se pudo pintar el documento.' });
      }
    })();
    return () => {
      vivo = false;
    };
  }, [estado, pagina]);

  /* La imagen: se pinta desde los bytes ya traidos, no volviendo a pedirlos. */
  const [urlDeImagen, setUrlDeImagen] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (estado.fase !== 'listo' || estado.original.clase !== 'imagen') return;
    const url = URL.createObjectURL(new Blob([estado.original.bytes], { type: estado.original.tipo }));
    setUrlDeImagen(url);
    return () => {
      URL.revokeObjectURL(url);
      setUrlDeImagen(null);
    };
  }, [estado]);

  /* El Word: se convierte una vez. */
  React.useEffect(() => {
    if (estado.fase !== 'listo' || estado.original.clase !== 'docx' || html) return;
    let vivo = true;
    htmlDelDocx(estado.original.bytes)
      .then((r) => {
        if (vivo) setHtml({ cuerpo: r.html, avisos: r.avisos });
      })
      .catch(() => {
        if (vivo) setEstado({ fase: 'error', mensaje: 'No se pudo convertir el documento de Word.' });
      });
    return () => {
      vivo = false;
    };
  }, [estado, html]);

  if (estado.fase === 'cargando') {
    return (
      <p className="flex items-center gap-2 text-meta text-ink-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Trayendo el archivo{estado.porcentaje !== null ? `… ${estado.porcentaje}%` : '…'}
      </p>
    );
  }

  if (estado.fase === 'error') {
    return (
      <p className="notice-unverified" role="status">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-unverified" />
        <span className="min-w-0 text-justify [overflow-wrap:anywhere]">{estado.mensaje}</span>
      </p>
    );
  }

  const { original } = estado;

  return (
    <div ref={caja} className="min-w-0">
      {/*
        La CSS de la capa de texto viene del servicio del PDF, no copiada aquí:
        es el contrato de pdf.js y dos copias se separarían. Sin ella los
        renglones caen fuera de sitio y visibles encima del lienzo — el
        documento se ve con su texto duplicado y descuadrado, sin que nada
        falle ni avise.
      */}
      <style>{CSS_DE_LA_CAPA_DE_TEXTO}</style>
      {original.clase === 'pdf' && (
        <>
          {totalPaginas > 1 && (
            <div className="mb-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={pagina <= 1}
                className="btn-neutral btn-sm disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="font-mono text-[11px] text-ink-500">
                {pagina} de {totalPaginas}
              </span>
              <button
                type="button"
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={pagina >= totalPaginas}
                className="btn-neutral btn-sm disabled:opacity-40"
                aria-label="Página siguiente"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {/*
            El lienzo lleva su capa de texto encima, transparente y con los
            mismos renglones: así el abogado puede seleccionar y copiar del
            documento en vez de mirar una foto de él.
          */}
          <div className="relative mx-auto max-h-[58vh] overflow-auto rounded-card border border-line-200 bg-paper">
            <canvas ref={lienzo} className="block" />
            <div ref={capa} className="textLayer" />
          </div>
        </>
      )}

      {original.clase === 'docx' && (
        <>
          <div
            className="max-h-[58vh] overflow-y-auto rounded-card border border-line-200 bg-paper p-4 font-legal text-[13.5px] leading-[1.7] text-paper-ink"
            dangerouslySetInnerHTML={{ __html: html?.cuerpo ?? '' }}
          />
          {/*
            LO QUE ESTA CONVERSIÓN NO PROMETE, dicho debajo y no escondido. Un
            Word convertido conserva lo semántico y pierde la página: dejar
            creer que se ve exacto es peor que no mostrarlo.
          */}
          <p className="mt-2 text-meta text-ink-500 text-justify [text-wrap:pretty]">
            Es un documento de Word: se conservan negritas, cursivas, títulos, listas y tablas, pero no los
            centrados, las tipografías ni los saltos de página. Solo el PDF se ve exacto.
          </p>
        </>
      )}

      {/*
        LA IMAGEN SE PINTA DESDE LOS BYTES QUE YA SE TRAJERON, no desde la
        fuente: un `File` en memoria no tiene URL, y volver a pedir el enlace
        firmado descargaria el archivo dos veces. `objectURL` se libera al
        desmontar; sin eso, abrir diez adjuntos deja diez copias en memoria.
      */}
      {original.clase === 'imagen' && urlDeImagen && (
        <img
          src={urlDeImagen}
          alt={original.nombre}
          className="mx-auto max-h-[58vh] rounded-card border border-line-200"
        />
      )}

      {(original.clase === 'texto' || original.clase === 'sinVisor') && (
        <p className="notice-unverified" role="status">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-unverified" />
          <span className="min-w-0 text-justify">
            {porQueNoHayVisor(original.tipo, original.nombre)} Puede descargarlo con el botón de arriba.
          </span>
        </p>
      )}

      <p className="mt-2 flex items-center gap-1.5 text-meta text-ink-500">
        <Download className="h-3 w-3 shrink-0" />
        {original.nombre}
      </p>
    </div>
  );
};
