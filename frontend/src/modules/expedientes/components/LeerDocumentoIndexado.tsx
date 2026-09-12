import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
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
          <p className="mb-3 rounded-card border border-line-200 bg-canvas px-3 py-2 text-meta text-ink-500 text-justify [text-wrap:pretty]">
            Esto no es su PDF: el archivo se leyó en su equipo y nunca se envió, así que no hay copia del
            original aquí. Es el texto que la aplicación guardó —sin sangrías ni saltos de página— y es
            exactamente lo que leen la búsqueda y el interrogatorio.
          </p>

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
