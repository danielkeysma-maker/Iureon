import React from 'react';
import { AlertTriangle, ArrowRight, ChevronLeft, Download, Loader2, Trash2 } from 'lucide-react';
import { expedientesApi } from '../services/expedientes.api';
import { VisorDeArchivo } from '../../workspace/components/VisorDeArchivo';

/**
 * LEER UN DOCUMENTO DEL CASO, A PANTALLA COMPLETA.
 *
 * Maqueta: `public/handoff/app-expedientes.html` — lector claro (:322), oscuro
 * (:403) y teléfono (:601); la barra de «Pruebas › Documentales» sale de
 * `app-carpetas-y-vista-previa.html` (:300). Antes era un diálogo L: el papel
 * quedaba en 58 % del alto de un recuadro, dentro de otro recuadro.
 *
 * ─── EL HUECO QUE TAPA ─────────────────────────────────────────────────────
 *
 * Un documento indexado se podía listar y no abrir: el abogado tenía que
 * CREERLE a la aplicación que ahí dentro estaba lo que subió. Y es justo la
 * pregunta que se hace cuando una búsqueda no encuentra algo.
 *
 * ─── DOS PESTAÑAS, Y NO SON DOS PINTURAS DE LO MISMO ───────────────────────
 *
 * «El documento» es el archivo tal como se subió: lo que el abogado reconoce.
 * «El texto indexado» es lo que la aplicación guardó —sin sangrías ni saltos—
 * y es EXACTAMENTE lo que leen la búsqueda y el interrogatorio. La segunda
 * contesta «¿por qué la búsqueda no encontró esto?», que mirar el PDF no dice.
 *
 * ─── LO QUE LA MAQUETA DIBUJA Y AQUÍ NO ESTÁ, CON LA RAZÓN ─────────────────
 *
 *  · Miniaturas de página, «Toque uno para ir a su página» y la búsqueda de
 *    palabra exacta con página: el texto guardado no conserva páginas.
 *  · Citar en un escrito: no hay camino que lleve un pasaje a un borrador.
 *  · «Lo que Iureon leyó aquí»: nadie analiza el documento al indexarlo;
 *    esas tarjetas serían conclusiones inventadas sobre un papel del caso.
 *  · La paginación en la barra: la lleva el visor del archivo (compartido con
 *    el taller), sobre el papel, y solo cuando el PDF tiene más de una página.
 */
export const LeerDocumentoIndexado: React.FC<{
  expedienteId: string;
  documentId: string | null;
  onCerrar: () => void;
  /** Nombre del caso, para el botón de volver. */
  caratula?: string;
  /** «Pruebas › Documentales» o «Raíz del expediente». */
  ubicacion?: string;
  onMover?: () => void;
  onQuitar?: () => void;
}> = ({ expedienteId, documentId, onCerrar, caratula, ubicacion, onMover, onQuitar }) => {
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [doc, setDoc] = React.useState<{ titulo: string; texto: string; fragmentos: number } | null>(null);
  /*
   * EL ENLACE AL ARCHIVO ORIGINAL. `null` cuando ese documento no tiene: se
   * indexó pegando el texto, o antes de que el expediente guardara originales.
   * Se distingue de «todavía no lo he pedido» para no ofrecer un botón muerto
   * ni esconderlo mientras carga.
   */
  const [original, setOriginal] = React.useState<{
    dato: { url: string; nombre: string; tipo: string } | null;
  } | null>(null);
  /* QUÉ SE VE PRIMERO. El original, cuando lo hay: es el documento del abogado. */
  const [vista, setVista] = React.useState<'original' | 'texto'>('original');
  const panel = React.useRef<HTMLDivElement>(null);
  const alCerrarRef = React.useRef(onCerrar);
  React.useEffect(() => {
    alCerrarRef.current = onCerrar;
  });

  React.useEffect(() => {
    if (!documentId) {
      setDoc(null);
      setError('');
      return;
    }
    let vivo = true;
    setCargando(true);
    setError('');
    setDoc(null);
    setOriginal(null);
    setVista('original');
    expedientesApi
      .enlaceAlOriginal(expedienteId, documentId)
      .then((dato) => {
        if (!vivo) return;
        setOriginal({ dato });
        /* Sin archivo guardado no hay pestaña que escoger: se cae al texto. */
        if (!dato) setVista('texto');
      })
      .catch(() => {
        if (vivo) {
          setOriginal({ dato: null });
          setVista('texto');
        }
      });
    expedientesApi
      .textoDelDocumento(expedienteId, documentId)
      .then((d) => {
        if (vivo) setDoc(d);
      })
      .catch((e: unknown) => {
        if (vivo) setError(e instanceof Error ? e.message : 'No se pudo leer el documento.');
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [expedienteId, documentId]);

  /*
   * LA ANATOMÍA DE UN DIÁLOGO, AUNQUE SEA PANTALLA COMPLETA: `Esc` cierra, el
   * foco entra al lector y vuelve a la fila que lo abrió, y el fondo no se
   * desplaza. Es la misma regla de `design/Dialog.tsx`; cambia el tamaño.
   */
  React.useEffect(() => {
    if (!documentId) return;
    const invocador = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') alCerrarRef.current();
    };
    document.addEventListener('keydown', alPulsar);
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', alPulsar);
      document.body.style.overflow = overflowPrevio;
      invocador?.focus?.();
    };
  }, [documentId]);

  if (!documentId) return null;

  /* Una página de escrito ronda las 350 palabras; sirve para que el tamaño se entienda. */
  const palabras = doc ? doc.texto.split(/\s+/).filter(Boolean).length : 0;
  const meta = [
    ubicacion,
    doc ? `${palabras.toLocaleString('es-CO')} palabras` : null,
    doc ? `${doc.fragmentos.toLocaleString('es-CO')} fragmentos buscables` : null
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      ref={panel}
      tabIndex={-1}
      className="cn-exp-lector"
      role="dialog"
      aria-modal="true"
      aria-label={doc?.titulo ?? 'Documento del caso'}
    >
      <header className="cn-exp-lector-barra">
        <button type="button" onClick={onCerrar} className="cn-exp-lector-volver" aria-label="Volver al caso">
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          {caratula && <span className="cn-exp-lector-volver-texto">{caratula}</span>}
        </button>
        <div className="cn-exp-lector-titulos">
          <p className="cn-exp-lector-titulo">{doc?.titulo ?? 'Documento del caso'}</p>
          {meta && <p className="cn-exp-lector-meta">{meta}</p>}
        </div>
        <div className="cn-exp-lector-acciones">
          {original?.dato && (
            <div className="cn-exp-segmento cn-exp-segmento--texto" role="tablist" aria-label="Qué ver">
              {(['original', 'texto'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={vista === v}
                  onClick={() => setVista(v)}
                  className="cn-exp-segmento-boton"
                >
                  {v === 'original' ? 'El documento' : 'El texto indexado'}
                </button>
              ))}
            </div>
          )}
          {original?.dato && (
            <a href={original.dato.url} target="_blank" rel="noreferrer" className="cn-ini-boton cn-ini-boton--suave cn-exp-boton">
              <Download className="h-4 w-4" aria-hidden="true" />
              Descargar
            </a>
          )}
          {onMover && (
            <button type="button" onClick={onMover} className="cn-ini-boton cn-ini-boton--suave cn-exp-boton">
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              Mover
            </button>
          )}
          {onQuitar && (
            <button type="button" onClick={onQuitar} className="cn-ini-boton cn-ini-boton--texto cn-exp-boton">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Quitar del caso
            </button>
          )}
        </div>
      </header>

      <div className="cn-exp-lector-mesa">
        <div className="cn-exp-lector-columna">
          {cargando && (
            <p className="cn-exp-cargando" role="status">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Armando el documento…
            </p>
          )}

          {error && (
            <p className="cn-aviso cn-exp-lector-aviso" role="status">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{error}</span>
            </p>
          )}

          {doc && original && original.dato === null && (
            <p className="cn-exp-nota cn-exp-nota--caja">
              De este documento no se guardó el archivo: se indexó pegando el texto, o antes de que el expediente los
              conservara. Lo de abajo es el texto guardado, que es lo que leen la búsqueda y el interrogatorio.
            </p>
          )}

          {doc && vista === 'original' && original?.dato && (
            <div className="cn-exp-lector-hoja cn-exp-lector-hoja--visor">
              <VisorDeArchivo fuente={{ de: 'enlace', ...original.dato }} />
            </div>
          )}

          {/*
            En la tipografía del documento y con las líneas separadas: son
            varias páginas de prosa jurídica seguidas, y leerlas en la letra de
            interfaz cansa a los dos párrafos.
          */}
          {doc && vista === 'texto' && (
            <div className="cn-exp-lector-hoja">
              <p className="cn-exp-lector-texto whitespace-pre-wrap text-justify font-legal [text-wrap:pretty] [overflow-wrap:anywhere]">
                {doc.texto}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
