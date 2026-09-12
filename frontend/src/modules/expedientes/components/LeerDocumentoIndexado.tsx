import React from 'react';
import { AlertTriangle, Download, Loader2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { expedientesApi } from '../services/expedientes.api';

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
  const [original, setOriginal] = React.useState<{ url: string | null } | null>(null);

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
    expedientesApi
      .enlaceAlOriginal(expedienteId, documentId)
      .then((url) => {
        if (vivo) setOriginal({ url });
      })
      .catch(() => {
        /* El texto se lee igual: el original es un extra, no la pantalla. */
        if (vivo) setOriginal({ url: null });
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
            SE DICE QUÉ ES ESTO, Y AHORA HAY DOS RESPUESTAS DISTINTAS.

            Con el archivo guardado, el botón lo abre tal cual: es el documento
            del abogado, con su diagramación. Sin él, no hay original que abrir
            y decirlo es lo único honesto — ofrecer un botón que no descarga
            nada sería peor que no ofrecerlo.
          */}
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2 rounded-card border border-line-200 bg-canvas px-3 py-2">
            <p className="min-w-0 flex-1 text-meta text-ink-500 text-justify [text-wrap:pretty]">
              Lo de abajo es el texto que la aplicación guardó —sin sangrías ni saltos de página— y es
              exactamente lo que leen la búsqueda y el interrogatorio.
              {original && original.url === null
                ? ' De este documento no se guardó el archivo: se indexó pegando el texto, o antes de que el expediente los conservara.'
                : ''}
            </p>
            {original?.url && (
              <a
                href={original.url}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary btn-sm shrink-0 gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Abrir el original
              </a>
            )}
          </div>

          {/*
            En la tipografía del documento y con las líneas separadas: son
            varias páginas de prosa jurídica seguidas, y leerlas en la letra de
            interfaz cansa a los dos párrafos.
          */}
          <div className="max-h-[60vh] overflow-y-auto rounded-card border border-line-200 bg-paper p-4">
            <p className="whitespace-pre-wrap text-justify font-legal text-[13.5px] leading-[1.75] text-paper-ink [text-wrap:pretty] [overflow-wrap:anywhere]">
              {doc.texto}
            </p>
          </div>
        </>
      )}
    </Dialog>
  );
};
