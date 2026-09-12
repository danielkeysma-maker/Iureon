import React from 'react';
import { AlertTriangle, Download, Loader2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { expedientesApi } from '../services/expedientes.api';
import { OriginalDelExpediente } from './OriginalDelExpediente';

/**
 * LEER UN DOCUMENTO INDEXADO.
 *
 * ─── EL HUECO QUE TAPA ─────────────────────────────────────────────────────
 *
 * Un documento indexado se podía listar y no abrir. La pantalla mostraba su
 * nombre y sus «56 fragmentos buscables», y al pulsarlo no pasaba nada: el
 * abogado tenía que CREERLE a la aplicación que ahí dentro estaba lo que él
 * subió, sin forma de comprobarlo.
 *
 * Y esa es justo la pregunta que se hace cuando una búsqueda no encuentra
 * algo: «¿de verdad quedó esto adentro?». Sin poder mirar, la única salida era
 * volver a indexar por si acaso — y un documento indexado dos veces sale
 * repetido en las búsquedas y desplaza a otro que sí hacía falta.
 *
 * ─── LO QUE MUESTRA NO ES EL PDF, Y SE DICE ANTES ──────────────────────────
 *
 * El archivo NUNCA sale del navegador: se lee ahí y solo viaja su texto. Así
 * que no hay copia del original en el servidor y no hay nada que
 * previsualizar. Llamar a esto «vista previa del documento» sería prometer una
 * fidelidad que no existe.
 *
 * Lo que se muestra es el texto tal como la aplicación lo guardó, sin saltos
 * de párrafo ni sangría —el troceo parte por espacios en blanco—. Y eso, que
 * suena a limitación, es la respuesta correcta a la pregunta de arriba: es
 * EXACTAMENTE lo que ven la búsqueda y el interrogatorio. Un visor bonito que
 * mostrara el PDF original no diría nada sobre lo que el motor tiene.
 */
export const LeerDocumentoIndexado: React.FC<{
  expedienteId: string;
  documentId: string | null;
  onCerrar: () => void;
}> = ({ expedienteId, documentId, onCerrar }) => {
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
  /*
   * QUE SE VE PRIMERO. El original, cuando lo hay: es el documento del
   * abogado. El texto extraido es lo que ve el MOTOR, y esa es otra pregunta
   * —util, pero segunda—. Sin archivo guardado solo queda el texto.
   */
  const [vista, setVista] = React.useState<'original' | 'texto'>('original');

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

  /* Una página de escrito ronda las 350 palabras; sirve para que el tamaño se entienda. */
  const palabras = doc ? doc.texto.split(/\s+/).filter(Boolean).length : 0;

  return (
    <Dialog
      abierto={documentId !== null}
      onCerrar={onCerrar}
      titulo={doc?.titulo ?? 'Documento del expediente'}
      subtitulo={
        doc
          ? `${palabras.toLocaleString('es-CO')} palabras · ${doc.fragmentos.toLocaleString('es-CO')} fragmentos buscables`
          : 'Lo que la aplicación guardó de este documento'
      }
      tamano="L"
    >
      {cargando && (
        <p className="flex items-center gap-2 text-meta text-ink-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Armando el documento…
        </p>
      )}

      {error && (
        <p className="notice-unverified" role="status">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-unverified" />
          <span className="min-w-0 text-justify [overflow-wrap:anywhere]">{error}</span>
        </p>
      )}

      {doc && (
        <>
          {/*
            SE DICE QUÉ ES ESTO ANTES DE LEERLO. Quien abra esperando su PDF y
            encuentre un bloque de texto sin sangrías concluirá que la
            aplicación le estropeó el documento. Lo que ve es lo que el motor
            tiene, que es otra cosa y es la que importa aquí.
          */}
          {/*
            DOS PESTANAS, Y NO SON DOS PINTURAS DE LO MISMO.

            «El documento» es el archivo tal como se subio: es lo que el
            abogado reconoce y lo que veria el juez. «El texto indexado» es lo
            que la aplicacion guardo — sin sangrias ni saltos— y es
            EXACTAMENTE lo que leen la busqueda y el interrogatorio.

            La segunda existe porque contesta una pregunta que la primera no
            puede: «¿por que la busqueda no encontro esto?». Mirar el PDF no lo
            dice; mirar lo indexado, si.
          */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="flex overflow-hidden rounded-control border border-line-200">
              {(['original', 'texto'] as const)
                .filter((v) => v !== 'original' || Boolean(original?.dato))
                .map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVista(v)}
                    className={`px-3 py-1 text-[12px] ${
                      vista === v ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-700 hover:text-ink-900'
                    }`}
                  >
                    {v === 'original' ? 'El documento' : 'El texto indexado'}
                  </button>
                ))}
            </div>
            {original?.dato && (
              <a
                href={original.dato.url}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary btn-sm ml-auto gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Descargar
              </a>
            )}
          </div>

          {original && original.dato === null && (
            <p className="mb-3 rounded-card border border-line-200 bg-canvas px-3 py-2 text-meta text-ink-500 text-justify [text-wrap:pretty]">
              De este documento no se guardó el archivo: se indexó pegando el texto, o antes de que el
              expediente los conservara. Lo de abajo es el texto guardado, que es lo que leen la búsqueda y
              el interrogatorio.
            </p>
          )}

          {vista === 'original' && original?.dato && <OriginalDelExpediente fuente={original.dato} />}

          {/*
            En la tipografía del documento y con las líneas separadas: son
            varias páginas de prosa jurídica seguidas, y leerlas en la letra de
            interfaz cansa a los dos párrafos.
          */}
          {vista === 'texto' && (
          <div className="max-h-[60vh] overflow-y-auto rounded-card border border-line-200 bg-paper p-4">
            <p className="whitespace-pre-wrap text-justify font-legal text-[13.5px] leading-[1.75] text-paper-ink [text-wrap:pretty] [overflow-wrap:anywhere]">
              {doc.texto}
            </p>
          </div>
          )}
        </>
      )}
    </Dialog>
  );
};
