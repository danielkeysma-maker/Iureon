import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileUp, Printer, X, ZoomIn, ZoomOut } from 'lucide-react';
import DOMPurify from 'dompurify';
import { markdownBoldToHtml } from '../services/documentExport.service';

/**
 * La pestaña Expediente: el borrador como se imprime, o un PDF del proceso.
 *
 * LO QUE ESTA PANTALLA DEJÓ DE AFIRMAR. La versión anterior decía «Bóveda
 * Cifrada · Rama Judicial» bajo el nombre del archivo — dos afirmaciones que
 * nada en el sistema respalda: aquí no hay bóveda, no hay cifrado propio y la
 * Rama Judicial no tiene nada que ver con un PDF que el abogado subió. Es la
 * misma clase de adorno que la pastilla de «Cifrado» que se quitó de la barra
 * lateral: prometía seguridad que nadie medía.
 *
 * LA PAGINACIÓN FALSA TAMBIÉN SE FUE. El texto se cortaba cada 3.000
 * caracteres y eso se llamaba «Página 2 de 6» — pero un corte por conteo de
 * caracteres no coincide con ninguna página real: el Word y el PDF exportados
 * paginan distinto. Un abogado que cite «página 3» mirando este visor citaría
 * una página que no existe en lo que radicó. El escrito se lee continuo, como
 * en la pestaña Documento, y los números de página reales los pone la
 * exportación.
 *
 * ADJUNTAR UN PDF AHORA ES POSIBLE. El estado vacío llevaba meses invitando a
 * «adjuntar un expediente PDF» sin que existiera ningún botón para hacerlo: la
 * promesa estaba escrita y el mecanismo no. El archivo se abre localmente con
 * un object URL — no se sube a ningún servidor, y eso también se dice, porque
 * un expediente judicial es exactamente el documento que un abogado no quiere
 * subir a ciegas.
 */

interface PdfViewerCanvasProps {
  draftText?: string;
  draftTitle?: string;
}

export const PdfViewerCanvas: React.FC<PdfViewerCanvasProps> = ({ draftText, draftTitle }) => {
  const [zoom, setZoom] = useState(100);
  const [pdf, setPdf] = useState<{ url: string; nombre: string } | null>(null);
  const inputArchivo = useRef<HTMLInputElement>(null);

  /*
   * El object URL se libera al reemplazarlo y al desmontar. Sin esto, cada PDF
   * abierto en la sesión queda vivo en memoria hasta cerrar la pestaña — y los
   * expedientes escaneados pesan cientos de megas.
   */
  useEffect(() => {
    return () => {
      if (pdf) URL.revokeObjectURL(pdf.url);
    };
  }, [pdf]);

  const abrirPdf = (archivo: File) => {
    if (pdf) URL.revokeObjectURL(pdf.url);
    setPdf({ url: URL.createObjectURL(archivo), nombre: archivo.name });
  };

  const html = useMemo(() => {
    if (!draftText) return '';
    const limpio = draftText.replace(/^#{1,6}\s+/gm, '').replace(/^-{3,}$/gm, '');
    return DOMPurify.sanitize(
      markdownBoldToHtml(limpio)
        .split('\n\n')
        .map((p) => `<p style="margin-bottom:12px;text-align:justify;">${p.replace(/\n/g, '<br/>')}</p>`)
        .join('')
    );
  }, [draftText]);

  const imprimir = () => {
    const ventana = window.open('', '_blank');
    if (!ventana || !draftText) return;
    ventana.document.write(`
      <html>
        <head>
          <title>${draftTitle || 'Escrito'}</title>
          <style>
            @page { margin: 2.54cm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.8; color: #000; }
            p { margin: 0 0 10px; text-align: justify; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  /* El selector de archivo, compartido por el estado vacío y la barra. */
  const selector = (
    <input
      ref={inputArchivo}
      type="file"
      accept="application/pdf"
      className="hidden"
      onChange={(e) => {
        const archivo = e.target.files?.[0];
        if (archivo) abrirPdf(archivo);
        // Permite volver a elegir el mismo archivo tras cerrarlo.
        e.target.value = '';
      }}
    />
  );

  /* ─── PDF ADJUNTO: ocupa el panel entero ───────────────────────────────── */
  if (pdf) {
    return (
      /*
       * `-mx-4 -mt-5` cancela el padding del lienzo: un PDF se lee a sangre,
       * no como una tarjeta flotando. El alto es de la ventana y no `h-full`
       * porque este panel vive dentro de un contenedor con scroll — ahi
       * `h-full` mas el padding produce un desborde de 20px que deja una
       * barra de scroll fantasma.
       */
      <div className="-mx-4 -mt-5 flex flex-col">
        {selector}
        <div className="flex shrink-0 items-center gap-2 border-b border-line-200 bg-surface px-4 py-2">
          <span className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-900" title={pdf.nombre}>
            {pdf.nombre}
          </span>
          {/*
            SE DICE DÓNDE ESTÁ EL ARCHIVO. Un expediente judicial es lo último
            que un abogado quiere subir a ciegas; que no salga de su equipo es
            información, no letra pequeña.
          */}
          <span className="shrink-0 text-meta text-ink-400">
            Se abre en este equipo · no se sube a ningún servidor
          </span>
          <button
            onClick={() => {
              URL.revokeObjectURL(pdf.url);
              setPdf(null);
            }}
            className="btn-neutral btn-sm shrink-0"
          >
            <X className="h-3 w-3" />
            Cerrar
          </button>
        </div>
        <iframe src={pdf.url} title={pdf.nombre} className="h-[calc(100vh-140px)] w-full border-0" />
      </div>
    );
  }

  /* ─── SIN BORRADOR NI PDF ──────────────────────────────────────────────── */
  if (!draftText) {
    return (
      <div className="mx-auto w-full max-w-[560px] px-4 py-10">
        {selector}
        <div className="card flex flex-col items-center gap-2 py-10 text-center">
          <FileUp className="h-8 w-8 text-ink-400" />
          <p className="text-ui text-ink-900">Aquí se examina el expediente.</p>
          <p className="max-w-sm text-meta leading-[1.6] text-ink-500">
            Abra el PDF de un proceso para leerlo junto al escrito, o genere un borrador en el
            panel de la izquierda y véalo aquí como se imprime.
          </p>
          <button onClick={() => inputArchivo.current?.click()} className="btn-secondary btn-sm mt-2">
            <FileUp className="h-3.5 w-3.5" />
            Abrir un PDF
          </button>
          <p className="text-meta text-ink-400">Se abre en este equipo, no se sube.</p>
        </div>
      </div>
    );
  }

  /* ─── EL BORRADOR, COMO SE IMPRIME ─────────────────────────────────────── */
  return (
    <div className="mx-auto w-full max-w-[816px] px-4 pb-8">
      {selector}
      <div className="sticky top-0 z-10 -mx-4 mb-3 flex flex-wrap items-center gap-2 border-b border-line-200 bg-canvas px-4 py-2">
        <span className="min-w-0 flex-1 truncate text-ui font-medium text-ink-900">
          {draftTitle || 'Escrito sin título'}
        </span>

        <div className="flex items-center gap-0.5 rounded-control border border-line-200 bg-surface px-1 py-0.5">
          <button
            onClick={() => setZoom((z) => Math.max(z - 15, 70))}
            className="rounded p-1 text-ink-500 hover:bg-canvas hover:text-ink-900"
            aria-label="Alejar"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="w-[42px] text-center font-mono text-[11px] text-ink-700">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(z + 15, 160))}
            className="rounded p-1 text-ink-500 hover:bg-canvas hover:text-ink-900"
            aria-label="Acercar"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>

        <button onClick={() => inputArchivo.current?.click()} className="btn-neutral btn-sm">
          <FileUp className="h-3.5 w-3.5" />
          Abrir PDF
        </button>
        <button onClick={imprimir} className="btn-secondary btn-sm">
          <Printer className="h-3.5 w-3.5" />
          Imprimir
        </button>
      </div>

      {/*
        SIN NÚMEROS DE PÁGINA A PROPÓSITO. Los números reales los pone la
        exportación; inventarlos aquí cortando por caracteres hacía citar
        páginas que no existen en lo radicado.
      */}
      <div
        className="paper-canvas rounded-card border border-line-200 px-10 py-10 font-legal text-paper-ink shadow-e1 sm:px-14"
        style={{ fontSize: `${Math.round(14.5 * (zoom / 100))}px`, lineHeight: 1.8 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <p className="mt-2 text-center text-meta text-ink-400">
        Vista de lectura. La impresión y la exportación salen siempre sobre papel blanco.
      </p>
    </div>
  );
};
