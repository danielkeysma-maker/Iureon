import React from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Download, FileUp, Highlighter, Loader2, ZoomIn, ZoomOut } from 'lucide-react';
import {
  claseDelOriginal,
  cargarOriginal,
  conservarOriginalDeRevision,
  formatoDeBytes,
  htmlDelDocx,
  porQueNoHayVisor,
  textoPlanoDelOriginal,
  tipoPorNombre,
  type FuenteDelOriginal,
  type OriginalCargado
} from '../services/originalDelEscrito';
import { abrirPdf, type DocumentoPdf } from '../services/pdfEnPantalla';
import { borrarCapas, hayResaltadoNativo, pintarCapas, type CapaDeResaltado } from '../services/resaltadoNativo';

/**
 * El escrito TAL COMO ESTÁ CONSTITUIDO: su diagramación, sus negritas, sus
 * tablas, su numeración.
 *
 * ─── POR QUÉ EXISTE ─────────────────────────────────────────────────────────
 *
 * El papel del taller muestra el texto extraído y reflujado. Eso sirve para
 * corregir palabras y no sirve para revisar: lo primero que un litigante lee
 * es la FORMA —qué va en negrita, qué es un título, qué es una tabla, qué es
 * una nota al pie— y la extracción la tira entera. Para revisar bien hay que
 * ver el documento como lo verá el juez.
 *
 * ─── SE SELECCIONA IGUAL QUE EN EL PAPEL ────────────────────────────────────
 *
 * Un PDF se pinta en un lienzo y encima va su capa de texto: los mismos
 * renglones, transparentes, seleccionables. Un Word se convierte a HTML y su
 * texto es texto. En los dos casos la selección es la del navegador, así que
 * la misma barra de resaltar y comentar del taller funciona aquí sin cambiar
 * nada: las anotaciones se anclan por TEXTO, no por posición.
 *
 * ─── LO QUE ESTE VISOR NO PROMETE ───────────────────────────────────────────
 *
 * El PDF sale exacto porque su formato ES la página. El Word no: la conversión
 * es semántica y conserva negritas, cursivas, subrayados, títulos, listas,
 * tablas, imágenes y notas al pie, pero NO centrados, tipografías ni saltos de
 * página. Está escrito en la pantalla, debajo del documento, en vez de dejar
 * creer que se ve todo. Y un `.doc` de Word 97 no se abre: es un binario OLE
 * sin lector en el navegador, y también se dice.
 */

export interface SuperficieDeSeleccion {
  /** El elemento cuyo texto cuenta como selección del escrito. */
  lienzo: HTMLElement | null;
  /** El contenedor con desplazamiento, contra el que se coloca la barra flotante. */
  caja: HTMLElement | null;
}

export interface VisorDelOriginalProps {
  /** De dónde salen los bytes: del archivo en memoria o del almacenamiento. */
  fuente: FuenteDelOriginal | null;
  /** Sin revisión guardada no hay dónde atar un archivo nuevo. */
  revisionId: string | null;
  /** Si la firma autorizó conservar escritos: decide si subir otro lo guarda o solo lo abre aquí. */
  puedeConservar: boolean;
  /** Las marcas a pintar encima, por capa. Se localizan por texto, igual que en el papel. */
  capas: CapaDeResaltado[];
  /** Cuántas marcas hay en total: se anuncian cuando el navegador no sabe pintarlas. */
  totalDeMarcas: number;
  /** Volver al papel, que es donde las marcas se ven siempre. */
  onIrAlPapel: () => void;
  /** La barra de resaltar y comentar del taller, para que viva dentro de este contenedor. */
  barraDeMarcado?: React.ReactNode;
  /** Entrega la superficie seleccionable al taller. Se llama con nulls al desmontar. */
  onSuperficie: (superficie: SuperficieDeSeleccion) => void;
  /** Avisa de que el archivo cambió, para que quien abrió el taller recargue lo suyo. */
  onOriginalCambiado?: (file: File) => void;
}

type Estado =
  | { fase: 'inicial' }
  | { fase: 'cargando'; porcentaje: number | null }
  | { fase: 'sin'; motivo: string; puedeConservarlo: boolean }
  | { fase: 'error'; mensaje: string }
  | { fase: 'listo'; original: OriginalCargado };

const ZOOM_MIN = 60;
const ZOOM_MAX = 250;
const PASO_DE_ZOOM = 20;
/** Margen del lienzo dentro del contenedor: el papel no se pega a los bordes. */
const MARGEN = 24;

/** Prefijo propio: `CSS.highlights` es un registro de toda la página. */
const PREFIJO = 'iureon-original';

const EXTENSIONES = '.pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp';

export const VisorDelOriginal: React.FC<VisorDelOriginalProps> = ({
  fuente,
  revisionId,
  puedeConservar,
  capas,
  totalDeMarcas,
  onIrAlPapel,
  barraDeMarcado,
  onSuperficie,
  onOriginalCambiado
}) => {
  const [estado, setEstado] = React.useState<Estado>({ fase: 'inicial' });
  const [zoom, setZoom] = React.useState(100);
  const [pagina, setPagina] = React.useState(1);
  const [totalPaginas, setTotalPaginas] = React.useState(0);
  const [html, setHtml] = React.useState<{ cuerpo: string; avisos: string[] } | null>(null);
  const [pintado, setPintado] = React.useState<{ pintadas: number; noLocalizadas: number } | null>(null);
  const [subiendo, setSubiendo] = React.useState<number | null>(null);
  const [avisoDeSubida, setAvisoDeSubida] = React.useState('');

  const caja = React.useRef<HTMLDivElement | null>(null);
  const lienzoPdf = React.useRef<HTMLCanvasElement | null>(null);
  const capaDeTexto = React.useRef<HTMLDivElement | null>(null);
  const cuerpoHtml = React.useRef<HTMLDivElement | null>(null);
  const documento = React.useRef<DocumentoPdf | null>(null);
  const entrada = React.useRef<HTMLInputElement | null>(null);
  const [anchoDeCaja, setAnchoDeCaja] = React.useState(0);

  const nombresDeCapa = React.useMemo(() => capas.map((c) => c.nombre), [capas]);

  /* ─── Las marcas, encima, sin tocar el documento ─────────────────────────── */
  const repintarMarcas = React.useCallback(() => {
    const contenedor = capaDeTexto.current ?? cuerpoHtml.current;
    if (!contenedor) return;
    const r = pintarCapas(contenedor, capas, PREFIJO);
    setPintado({ pintadas: Object.values(r.pintadas).reduce((a, b) => a + b, 0), noLocalizadas: r.noLocalizadas });
  }, [capas]);

  /*
   * UN `blob:` VIVE HASTA QUE SE LE SUELTA. Crear la URL dentro del render
   * fabricaría una nueva en cada pasada y ninguna se liberaría: un escaneo de
   * diez megas quedaría multiplicado en memoria hasta cerrar la pestaña.
   */
  const original = estado.fase === 'listo' ? estado.original : null;
  const urlDelArchivo = React.useMemo(() => {
    if (!original || original.clase === 'pdf' || original.clase === 'docx') return null;
    return URL.createObjectURL(new Blob([original.bytes], { type: original.tipo || 'application/octet-stream' }));
  }, [original]);
  React.useEffect(() => {
    if (!urlDelArchivo) return;
    return () => URL.revokeObjectURL(urlDelArchivo);
  }, [urlDelArchivo]);

  /* ─── Traer el archivo ───────────────────────────────────────────────────── */
  /*
   * SE VIGILA LA IDENTIDAD DEL ARCHIVO, NO LA DEL OBJETO. Quien monta el visor
   * arma `fuente` con un literal dentro del render, así que es un objeto nuevo
   * en cada pasada: un efecto que dependiera de él se dispararía, cambiaría el
   * estado, provocaría otra pasada y volvería a dispararse — un bucle que no
   * falla, solo consume la máquina y vuelve a descargar el archivo sin parar.
   * La clave describe QUÉ archivo es; el objeto se lee por referencia.
   */
  const fuenteVigente = React.useRef(fuente);
  fuenteVigente.current = fuente;
  const claveDeFuente = !fuente
    ? ''
    : fuente.de === 'sesion'
      ? `sesion:${fuente.file.name}:${fuente.file.size}:${fuente.file.lastModified}`
      : `servidor:${fuente.revisionId}`;

  React.useEffect(() => {
    const actual = fuenteVigente.current;
    if (!actual) {
      setEstado({ fase: 'sin', motivo: 'No hay archivo original de este escrito: se revisó a partir de texto pegado.', puedeConservarlo: false });
      return;
    }
    let vigente = true;
    setEstado({ fase: 'cargando', porcentaje: null });
    setHtml(null);
    cargarOriginal(actual, (p) => {
      if (vigente) setEstado({ fase: 'cargando', porcentaje: p });
    })
      .then((r) => {
        if (!vigente) return;
        if (!r.hay) setEstado({ fase: 'sin', motivo: r.motivo, puedeConservarlo: r.puedeConservarlo });
        else setEstado({ fase: 'listo', original: r.original });
      })
      .catch((err) => {
        if (vigente) setEstado({ fase: 'error', mensaje: err instanceof Error ? err.message : 'No se pudo abrir el archivo original.' });
      });
    return () => {
      vigente = false;
    };
  }, [claveDeFuente]);

  /* ─── El ancho del contenedor manda: aquí nace el «ajustar a la pantalla» ── */
  React.useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;
    const medir = () => setAnchoDeCaja(nodo.clientWidth);
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(nodo);
    return () => observador.disconnect();
  }, [estado.fase]);

  /* ─── PDF: abrir el documento ────────────────────────────────────────────── */
  React.useEffect(() => {
    if (!original || original.clase !== 'pdf') return;
    let vigente = true;
    abrirPdf(original.bytes)
      .then((doc) => {
        if (!vigente) {
          doc.cerrar();
          return;
        }
        documento.current = doc;
        setTotalPaginas(doc.paginas);
        setPagina(1);
      })
      .catch((err) => {
        if (vigente) setEstado({ fase: 'error', mensaje: err instanceof Error ? `No se pudo abrir el PDF: ${err.message}` : 'No se pudo abrir el PDF.' });
      });
    return () => {
      vigente = false;
      documento.current?.cerrar();
      documento.current = null;
    };
  }, [original]);

  /* ─── PDF: pintar la página en curso ─────────────────────────────────────── */
  React.useEffect(() => {
    const doc = documento.current;
    if (!doc || !lienzoPdf.current || !capaDeTexto.current || !anchoDeCaja) return;
    let vigente = true;
    const disponible = Math.max(200, (anchoDeCaja - MARGEN) * (zoom / 100));
    doc
      .pintar(pagina, lienzoPdf.current, capaDeTexto.current, disponible)
      .then(() => {
        if (vigente) repintarMarcas();
      })
      .catch((err) => {
        // Cancelar un dibujo al cambiar de página no es un fallo que deba verse.
        if (vigente && !/cancel/i.test(String(err?.message ?? ''))) setAvisoDeSubida(`No se pudo pintar la página ${pagina}.`);
      });
    return () => {
      vigente = false;
    };
  }, [pagina, zoom, anchoDeCaja, totalPaginas, repintarMarcas]);

  /* ─── Word: convertir a HTML ─────────────────────────────────────────────── */
  React.useEffect(() => {
    if (!original || original.clase !== 'docx') return;
    let vigente = true;
    htmlDelDocx(original.bytes)
      .then((r) => {
        if (vigente) setHtml({ cuerpo: r.html, avisos: r.avisos });
      })
      .catch((err) => {
        if (vigente) {
          setEstado({
            fase: 'error',
            mensaje: `No se pudo convertir el Word: ${err instanceof Error ? err.message : 'error desconocido'}. Si es un .doc de Word 97, guárdelo como .docx.`
          });
        }
      });
    return () => {
      vigente = false;
    };
  }, [original]);

  React.useEffect(() => {
    if (html) repintarMarcas();
  }, [html, repintarMarcas]);

  React.useEffect(() => () => borrarCapas(nombresDeCapa, PREFIJO), [nombresDeCapa]);

  /* ─── La superficie que el taller vigila para la selección ───────────────── */
  React.useEffect(() => {
    onSuperficie({ lienzo: capaDeTexto.current ?? cuerpoHtml.current, caja: caja.current });
    return () => onSuperficie({ lienzo: null, caja: null });
  }, [onSuperficie, estado.fase, html, totalPaginas]);

  /* ─── Subir otro archivo ─────────────────────────────────────────────────── */
  const elegirArchivo = async (file: File) => {
    setAvisoDeSubida('');
    const clase = claseDelOriginal(file.type || tipoPorNombre(file.name), file.name);
    if (clase === 'sinVisor') {
      setAvisoDeSubida(porQueNoHayVisor(file.type, file.name));
      return;
    }
    onOriginalCambiado?.(file);
    setEstado({ fase: 'listo', original: { nombre: file.name, tipo: file.type || tipoPorNombre(file.name), bytes: await file.arrayBuffer(), clase, conservado: false } });
    if (!revisionId || !puedeConservar) {
      setAvisoDeSubida(
        puedeConservar
          ? 'El archivo se abre en esta pestaña. No hay una revisión guardada a la que atarlo, así que al cerrar se pierde.'
          : 'El archivo se abre en esta pestaña. Su firma no ha autorizado conservar escritos, así que no se guarda: al cerrar, se pierde.'
      );
      return;
    }
    try {
      setSubiendo(0);
      await conservarOriginalDeRevision(revisionId, file, setSubiendo);
      setAvisoDeSubida('El archivo quedó guardado con esta revisión.');
    } catch (err) {
      setAvisoDeSubida(err instanceof Error ? `No se pudo conservar el archivo: ${err.message} Se puede leer aquí, pero al cerrar se pierde.` : 'No se pudo conservar el archivo.');
    } finally {
      setSubiendo(null);
    }
  };

  const selector = (
    <input
      ref={entrada}
      type="file"
      accept={EXTENSIONES}
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (f) void elegirArchivo(f);
      }}
    />
  );

  const esPdf = original?.clase === 'pdf';

  /* ─── Barra ──────────────────────────────────────────────────────────────── */
  const Barra = (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-line-100 bg-surface px-3 py-2 sm:px-4">
      {selector}
      <span className="min-w-0 flex-1 truncate text-[12px] text-ink-900" title={original?.nombre}>
        {original ? original.nombre : 'Original'}
        {original ? <span className="ml-1.5 font-mono text-[11px] text-ink-400">{formatoDeBytes(original.bytes.byteLength)}</span> : null}
      </span>

      {esPdf && totalPaginas > 0 && (
        <div className="flex shrink-0 items-center gap-0.5 rounded-control border border-line-200 bg-canvas px-1 py-0.5">
          <button
            type="button"
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina <= 1}
            className="rounded p-1 text-ink-500 hover:text-ink-900 disabled:opacity-40"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[54px] text-center font-mono text-[11px] text-ink-700">
            {pagina} / {totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            disabled={pagina >= totalPaginas}
            className="rounded p-1 text-ink-500 hover:text-ink-900 disabled:opacity-40"
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {original && original.clase !== 'sinVisor' && (
        <div className="flex shrink-0 items-center gap-0.5 rounded-control border border-line-200 bg-canvas px-1 py-0.5">
          <button type="button" onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - PASO_DE_ZOOM))} className="rounded p-1 text-ink-500 hover:text-ink-900" aria-label="Alejar">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setZoom(100)} className="w-[46px] text-center font-mono text-[11px] text-ink-700" title="Ajustar al ancho">
            {zoom}%
          </button>
          <button type="button" onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + PASO_DE_ZOOM))} className="rounded p-1 text-ink-500 hover:text-ink-900" aria-label="Acercar">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <button type="button" onClick={() => entrada.current?.click()} className="btn-neutral btn-sm shrink-0" title="Abrir otro archivo como original de este escrito">
        <FileUp className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{original ? 'Otro archivo' : 'Subir el archivo'}</span>
      </button>
    </div>
  );

  /* ─── Avisos: qué se ve, qué no, y dónde están las marcas ────────────────── */
  const Avisos = (
    <>
      {subiendo !== null && (
        <p className="border-b border-line-100 bg-canvas px-4 py-1.5 text-[11.5px] text-ink-600">Guardando el archivo con la revisión · {subiendo}%</p>
      )}
      {avisoDeSubida && (
        <p className="border-b border-line-100 bg-canvas px-4 py-1.5 text-[11.5px] text-ink-600 text-justify [text-wrap:pretty]">
          {avisoDeSubida}{' '}
          <button type="button" onClick={() => setAvisoDeSubida('')} className="underline">
            cerrar
          </button>
        </p>
      )}
      {original && totalDeMarcas > 0 && (
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 border-b border-line-100 bg-canvas px-4 py-1.5 text-[11.5px] text-ink-600">
          <Highlighter className="h-3.5 w-3.5 shrink-0" />
          {!hayResaltadoNativo() ? (
            <span className="min-w-0 text-justify [text-wrap:pretty]">
              Este navegador no sabe pintar marcas sobre un documento sin modificarlo, así que aquí no se ven. Hay {totalDeMarcas}{' '}
              {totalDeMarcas === 1 ? 'marca' : 'marcas'} sobre el escrito.
            </span>
          ) : (
            <span className="min-w-0 text-justify [text-wrap:pretty]">
              {pintado ? `${pintado.pintadas} de ${totalDeMarcas} ${totalDeMarcas === 1 ? 'marca' : 'marcas'} se ven aquí` : `${totalDeMarcas} marcas`}
              {esPdf ? ' en esta página' : ''}
              {pintado && pintado.noLocalizadas > 0
                ? '. Las demás no se encontraron en el archivo: el texto que se revisó salió de la extracción y no siempre coincide letra por letra con el original.'
                : '.'}
            </span>
          )}
          <button type="button" onClick={onIrAlPapel} className="shrink-0 underline">
            ver en el papel
          </button>
        </p>
      )}
    </>
  );

  /* ─── Cuerpo ─────────────────────────────────────────────────────────────── */
  const Cuerpo = () => {
    if (estado.fase === 'cargando') {
      return (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
          <p className="text-[12.5px] text-ink-500">
            Trayendo el archivo original{estado.porcentaje !== null ? ` · ${estado.porcentaje}%` : '…'}
          </p>
        </div>
      );
    }

    if (estado.fase === 'error') {
      return (
        <div className="mx-auto max-w-[560px] py-12">
          <div className="card flex flex-col items-center gap-2 py-8 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <p className="text-[12.5px] leading-snug text-ink-700 text-justify [text-wrap:pretty]">{estado.mensaje}</p>
            <button type="button" onClick={() => entrada.current?.click()} className="btn-secondary btn-sm mt-1">
              <FileUp className="h-3.5 w-3.5" />
              Subir el archivo
            </button>
          </div>
        </div>
      );
    }

    if (estado.fase === 'sin' || estado.fase === 'inicial') {
      const motivo = estado.fase === 'sin' ? estado.motivo : 'Cargando…';
      return (
        <div className="mx-auto max-w-[560px] py-12">
          <div className="card flex flex-col items-center gap-2 py-8 text-center">
            <FileUp className="h-7 w-7 text-ink-400" />
            <p className="text-ui text-ink-900">Aquí se ve el escrito tal como está constituido.</p>
            <p className="max-w-[46ch] text-[12.5px] leading-[1.6] text-ink-500 text-justify [text-wrap:pretty]">{motivo}</p>
            <button type="button" onClick={() => entrada.current?.click()} className="btn-secondary btn-sm mt-1">
              <FileUp className="h-3.5 w-3.5" />
              Subir el archivo
            </button>
            <button type="button" onClick={onIrAlPapel} className="text-[12px] text-ink-500 underline">
              Seguir en el papel
            </button>
          </div>
        </div>
      );
    }

    const o = estado.original;

    if (o.clase === 'pdf') {
      return (
        <div className="relative mx-auto" style={{ width: 'fit-content' }}>
          {/*
            El lienzo pinta la página; la capa de texto va exactamente encima,
            transparente. `position:relative` en el envoltorio es lo que ancla
            la capa: sin él, los renglones se irían a la esquina del documento.
          */}
          <canvas ref={lienzoPdf} className="block rounded-card border border-line-200 bg-paper shadow-sm" />
          <div ref={capaDeTexto} className="textLayer" />
        </div>
      );
    }

    if (o.clase === 'docx') {
      if (!html) {
        return (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
            <p className="text-[12.5px] text-ink-500">Convirtiendo el documento de Word…</p>
          </div>
        );
      }
      return (
        <>
          <div
            className="original-docx mx-auto w-full max-w-[816px] rounded-card border border-line-200 bg-paper px-5 py-8 shadow-sm sm:px-12 sm:py-10"
            style={{ fontSize: `${Math.round(14.5 * (zoom / 100))}px` }}
          >
            <div ref={cuerpoHtml} dangerouslySetInnerHTML={{ __html: html.cuerpo }} />
          </div>
          <p className="mx-auto mt-3 max-w-[816px] text-[11.5px] leading-[1.6] text-ink-500 text-justify [text-wrap:pretty]">
            Del Word se conservan negritas, cursivas, subrayados, títulos, listas, tablas, imágenes y notas al pie. No se conservan los centrados, la
            tipografía ni los saltos de página: la conversión lee la estructura del documento, no su maquetación. Para verlo exactamente como se
            imprime, exporte el archivo a PDF y ábralo aquí.
            {html.avisos.length > 0 ? ` El conversor no supo traducir: ${html.avisos.join('; ')}.` : ''}
          </p>
        </>
      );
    }

    if (o.clase === 'imagen') {
      return (
        <>
          <img
            src={urlDelArchivo ?? ''}
            alt={o.nombre}
            className="mx-auto block rounded-card border border-line-200 bg-paper shadow-sm"
            style={{ width: `${Math.min(100, zoom)}%`, maxWidth: '100%' }}
          />
          <p className="mx-auto mt-3 max-w-[816px] text-[11.5px] leading-[1.6] text-ink-500 text-justify [text-wrap:pretty]">
            Es una imagen: se ve tal cual, pero no tiene texto que seleccionar. Para resaltar y comentar, vuelva al papel — el texto que se revisó salió
            de ahí.
          </p>
        </>
      );
    }

    if (o.clase === 'texto') {
      return (
        <div
          ref={cuerpoHtml}
          className="original-docx mx-auto w-full max-w-[816px] whitespace-pre-wrap rounded-card border border-line-200 bg-paper px-5 py-8 font-legal leading-[1.8] text-paper-ink shadow-sm [overflow-wrap:anywhere] sm:px-12 sm:py-10"
          style={{ fontSize: `${Math.round(14.5 * (zoom / 100))}px` }}
        >
          {textoPlanoDelOriginal(o.bytes)}
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-[560px] py-12">
        <div className="card flex flex-col items-center gap-2 py-8 text-center">
          <AlertTriangle className="h-6 w-6 text-amber-600" />
          <p className="max-w-[46ch] text-[12.5px] leading-[1.6] text-ink-700 text-justify [text-wrap:pretty]">{porQueNoHayVisor(o.tipo, o.nombre)}</p>
          <a href={urlDelArchivo ?? '#'} download={o.nombre} className="btn-secondary btn-sm mt-1">
            <Download className="h-3.5 w-3.5" />
            Descargar el archivo
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <style>{ESTILOS}</style>
      {Barra}
      {Avisos}
      {/*
        UN CONTENEDOR CON DESPLAZAMIENTO PROPIO EN LOS DOS EJES. Con el zoom por
        encima del ancho de la pantalla —y con la tabla de un Word que no cabe—
        el documento mide más que el teléfono, y eso no es un corte: es el
        desplazamiento que ANCHO-EN-MOVIL declara legítimo. Lo que no puede
        pasar es que el ancho del documento empuje a la columna del taller, y
        por eso `min-w-0` va en cada nivel.
      */}
      <div ref={caja} className="scroll-documento relative min-h-0 min-w-0 flex-1 overflow-auto bg-canvas px-3 py-4 sm:px-6">
        {barraDeMarcado}
        {Cuerpo()}
      </div>
    </div>
  );
};

/*
 * ─── LOS ESTILOS QUE NO PUEDEN SER CLASES ───────────────────────────────────
 *
 * Tres cosas viven aquí y no en Tailwind, cada una por su razón:
 *
 *  1. `.textLayer` es el contrato de pdf.js: sus renglones se colocan con
 *     variables CSS que la librería escribe en cada `<span>`. Se copian planas
 *     —sin anidar— porque el postcss de este proyecto no lleva anidamiento.
 *  2. `::highlight(...)` es la única forma de pintar un rango sin tocar el
 *     documento, y solo admite color, fondo y decoración de texto.
 *  3. El HTML de un Word llega sin estilo y el `preflight` de Tailwind deja los
 *     títulos, las listas y las tablas sin ninguna forma. Se les devuelve la
 *     mínima para que un escrito se lea como un escrito.
 */
const ESTILOS = `
.textLayer{position:absolute;inset:0;overflow:clip;line-height:1;text-align:initial;opacity:1;
  -webkit-text-size-adjust:none;text-size-adjust:none;forced-color-adjust:none;transform-origin:0 0;z-index:0;
  --min-font-size:1;--text-scale-factor:calc(var(--total-scale-factor) * var(--min-font-size));--min-font-size-inv:calc(1 / var(--min-font-size));}
.textLayer span,.textLayer br{color:transparent;position:absolute;white-space:pre;cursor:text;transform-origin:0% 0%;-webkit-user-select:text;user-select:text;}
.textLayer > :not(.markedContent),.textLayer .markedContent span:not(.markedContent){z-index:1;--font-height:0;
  font-size:calc(var(--text-scale-factor) * var(--font-height));--scale-x:1;--rotate:0deg;
  transform:rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));}
.textLayer .markedContent{display:contents;}

::highlight(iureon-original-amarillo){background-color:rgb(253 224 71 / .55);}
::highlight(iureon-original-verde){background-color:rgb(134 239 172 / .55);}
::highlight(iureon-original-azul){background-color:rgb(125 211 252 / .55);}
::highlight(iureon-original-rosa){background-color:rgb(249 168 212 / .55);}
::highlight(iureon-original-tachado){text-decoration:line-through 2px;}
::highlight(iureon-original-comentario){background-color:rgb(203 217 228 / .5);text-decoration:underline dotted 2px;}
::highlight(iureon-original-cita){background-color:rgb(253 230 138 / .6);text-decoration:line-through 2px;}
::highlight(iureon-original-referencia){text-decoration:underline 2px;}

.original-docx{line-height:1.7;}
.original-docx p{margin:0 0 .7em;text-align:justify;text-wrap:pretty;overflow-wrap:anywhere;}
.original-docx h1,.original-docx h2,.original-docx h3,.original-docx h4,.original-docx h5,.original-docx h6{font-weight:700;margin:1.2em 0 .5em;line-height:1.3;overflow-wrap:anywhere;}
.original-docx h1{font-size:1.35em;}
.original-docx h2{font-size:1.2em;}
.original-docx h3{font-size:1.08em;}
.original-docx strong,.original-docx b{font-weight:700;}
.original-docx em,.original-docx i{font-style:italic;}
.original-docx u{text-decoration:underline;}
.original-docx s{text-decoration:line-through;}
.original-docx ul,.original-docx ol{margin:0 0 .7em 1.4em;padding:0;}
.original-docx ul{list-style:disc;}
.original-docx ol{list-style:decimal;}
.original-docx li{margin:.2em 0;text-align:justify;overflow-wrap:anywhere;}
.original-docx table{display:block;overflow-x:auto;max-width:100%;border-collapse:collapse;margin:.8em 0;font-size:.94em;}
.original-docx td,.original-docx th{border:1px solid rgb(var(--line-200));padding:.35em .5em;vertical-align:top;text-align:left;}
.original-docx th{font-weight:700;background:rgb(var(--canvas));}
.original-docx img{max-width:100%;height:auto;}
.original-docx a{color:rgb(var(--brand-700));text-decoration:underline;overflow-wrap:anywhere;}
.original-docx sup{font-size:.72em;vertical-align:super;}
.original-docx hr{border:0;border-top:1px solid rgb(var(--line-200));margin:1em 0;}
`;
