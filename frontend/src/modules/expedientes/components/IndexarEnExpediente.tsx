import React from 'react';
import { AlertCircle, CheckCircle2, FileText, FileUp, Loader2, X } from 'lucide-react';
import {
  PARA_INDEXAR,
  textoDelArchivo
} from '../../workspace/services/textoDelArchivo';
import { uploadFileToStorage } from '../../documents/services/storageUpload';
import { expedientesApi, type DocumentoIndexado } from '../services/expedientes.api';
import { LeerDocumentoIndexado } from './LeerDocumentoIndexado';
import type { ExpedienteConDetalle } from '../types';

/**
 * EL EXPEDIENTE DE 300 PÁGINAS.
 *
 * ─── POR QUÉ INDEXAR NO ES «SUBIR UN ARCHIVO MÁS» ──────────────────────────
 *
 * La revisión corta el texto en 300.000 caracteres y lo dice. Para un escrito
 * de veinte páginas sobra; para un expediente de trescientas, no alcanza — y
 * ningún motor lee trescientas páginas de un tirón.
 *
 * Indexar es la otra forma de leer: el documento se parte en fragmentos, se
 * vectoriza UNA VEZ, y a partir de ahí el motor recupera los pedazos que vienen
 * al caso. Es lo mismo que sostiene el corpus de jurisprudencia.
 *
 * ─── EL ARCHIVO NO VIAJA: VIAJA SU TEXTO ───────────────────────────────────
 *
 * Se lee aquí, en el navegador, con el mismo lector que ya usan Orientación y
 * la revisión. Dos razones: un PDF de trescientas páginas no cabe bajo el tope
 * de cuerpo de Vercel (4,5 MB), y extraer texto es trabajo de procesador que
 * no tiene por qué gastar el reloj del servidor.
 *
 * Medido con el Código General del Proceso entero, 336 páginas: el texto plano
 * pesa 0,73 MB. Cabe de sobra.
 *
 * ─── SE DICE CUÁNTO SE LEYÓ, ANTES DE MANDARLO ─────────────────────────────
 *
 * Un PDF escaneado no tiene texto: son imágenes. El lector lo dice con esas
 * palabras en vez de devolver una cadena vacía, y aquí se muestra ANTES de
 * indexar. Sin ese aviso, el abogado creería que su expediente quedó buscable
 * y las búsquedas saldrían vacías sin explicación.
 */
export const IndexarEnExpediente: React.FC<{
  expediente: ExpedienteConDetalle;
  onIndexado: () => Promise<void>;
}> = ({ expediente, onIndexado }) => {
  const [abierto, setAbierto] = React.useState(false);
  const [titulo, setTitulo] = React.useState('');
  const [leyendo, setLeyendo] = React.useState(false);
  const [indexando, setIndexando] = React.useState(false);
  const [error, setError] = React.useState('');
  /*
   * EL ARCHIVO, ADEMAS DE SU TEXTO.
   *
   * Hasta hoy solo viajaba el texto: el expediente guardaba lo buscable y NO
   * el documento, asi que no habia nada que abrir ni que descargar. Un
   * expediente sin sus papeles es un indice, no un expediente.
   *
   * El archivo sube DIRECTO a B2 con la misma tuberia que usa la revision:
   * Vercel rechaza cuerpos de mas de 4,5 MB y un escaneado de trescientas
   * paginas pesa mucho mas, asi que no puede pasar por el servidor.
   */
  const [archivo, setArchivo] = React.useState<File | null>(null);
  const [subiendo, setSubiendo] = React.useState(0);
  const [leido, setLeido] = React.useState<{ texto: string; caracteres: number; recortado: boolean } | null>(
    null
  );
  const [hecho, setHecho] = React.useState<{ fragmentos: number; buscable: boolean } | null>(null);

  /*
   * ─── LO QUE YA HAY DENTRO ────────────────────────────────────────────────
   *
   * Un expediente que se llena EN EL TIEMPO —el caso de un cliente nuevo, con
   * los papeles llegando de a poco— necesita mostrar lo que ya tiene. Sin esta
   * lista, indexar decía «295 fragmentos» y después no había forma de saber
   * qué hay dentro: a la tercera semana nadie recuerda si el poder ya se subió,
   * y la salida natural es volver a subirlo. Indexado dos veces, el mismo
   * párrafo sale repetido en la búsqueda y desplaza a otro que sí hacía falta.
   */
  const [documentos, setDocumentos] = React.useState<DocumentoIndexado[]>([]);
  const [quitando, setQuitando] = React.useState<string | null>(null);
  /*
   * EL DOCUMENTO ABIERTO PARA LEERLO. Antes la fila no hacia nada al pulsarla:
   * el abogado veia «56 fragmentos buscables» y tenia que creer que ahi dentro
   * estaba lo suyo. Es la pregunta que se hace cuando una busqueda falla.
   */
  const [leyendoDoc, setLeyendoDoc] = React.useState<string | null>(null);

  const cargarDocumentos = React.useCallback(async () => {
    try {
      setDocumentos(await expedientesApi.documentos(expediente.id));
    } catch (err) {
      setError((err as Error).message);
    }
  }, [expediente.id]);

  React.useEffect(() => {
    void cargarDocumentos();
  }, [cargarDocumentos]);

  const quitar = async (documentId: string): Promise<void> => {
    setQuitando(documentId);
    setError('');
    try {
      await expedientesApi.quitarDocumento(expediente.id, documentId);
      await cargarDocumentos();
      await onIndexado();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setQuitando(null);
    }
  };

  const escoger = async (archivo: File | undefined): Promise<void> => {
    if (!archivo) return;
    setError('');
    setHecho(null);
    setLeido(null);
    setLeyendo(true);
    try {
      /* Con los límites de indexar: el documento entero, no los 40 folios de clasificar. */
      const r = await textoDelArchivo(archivo, PARA_INDEXAR);
      if (!r.ok) {
        setError(r.motivo);
        return;
      }
      setLeido({ texto: r.texto, caracteres: r.caracteres, recortado: r.recortado });
      setArchivo(archivo);
      /* El nombre del archivo es el mejor título por defecto, y se puede cambiar. */
      if (!titulo.trim()) setTitulo(archivo.name.replace(/\.[^.]+$/, ''));
    } finally {
      setLeyendo(false);
    }
  };

  const indexar = async (): Promise<void> => {
    if (!leido || !titulo.trim()) return;
    setIndexando(true);
    setError('');
    setSubiendo(0);
    try {
      /*
       * SE SUBE PRIMERO Y SE INDEXA DESPUES. Si la subida falla, no se indexa:
       * un documento buscable cuyo original nunca llego seria justo la mitad
       * que no se puede reparar despues sin volver a subirlo todo.
       *
       * Si el abogado pego el texto en vez de escoger un archivo, no hay nada
       * que subir y se indexa igual — lo que se pierde es poder volver al
       * original, no la busqueda.
       */
      let claveB2: string | undefined;
      if (archivo) {
        claveB2 = await uploadFileToStorage(archivo, `expedientes/${expediente.id}`, setSubiendo, 'el documento');
      }
      const r = await expedientesApi.indexar(expediente.id, {
        titulo: titulo.trim(),
        texto: leido.texto,
        claveB2,
        contentType: archivo?.type || undefined,
        bytes: archivo?.size
      });
      setHecho({ fragmentos: r.resultado.totalChunksCreated, buscable: r.buscable });
      setLeido(null);
      setArchivo(null);
      setTitulo('');
      await cargarDocumentos();
      await onIndexado();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIndexando(false);
    }
  };

  /* Una página de escrito ronda las 350 palabras; sirve para que el número se entienda. */
  const paginas = leido ? Math.max(1, Math.round(leido.caracteres / 350 / 6)) : 0;

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-h3">Documentos del expediente</h2>
          <p className="text-meta text-ink-500">
            Un expediente largo no se lee de un tirón: se indexa una vez y después el sistema recupera lo
            que viene al caso.
          </p>
        </div>
        <button type="button" onClick={() => setAbierto((v) => !v)} className="btn-secondary btn-sm gap-1.5">
          <FileUp className="h-3.5 w-3.5" />
          {abierto ? 'Cerrar' : 'Indexar un documento'}
        </button>
      </div>

      {/*
        LA LISTA VA ARRIBA DEL FORMULARIO, no debajo. Quien vuelve a esta
        pantalla la semana siguiente viene a ver qué hay, no a subir a ciegas:
        poner primero el formulario invita a subir de nuevo lo que ya está.
      */}
      {documentos.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {documentos.map((d) => (
            <li
              key={d.documentId}
              className="flex items-start justify-between gap-2 rounded-card border border-line-200 p-2.5"
            >
              <button
                type="button"
                onClick={() => setLeyendoDoc(d.documentId)}
                className="min-w-0 text-left"
                title="Leer lo que quedó indexado de este documento"
              >
                <p className="flex items-baseline gap-1.5 text-body">
                  <FileText className="h-3.5 w-3.5 shrink-0 text-ink-500" />
                  <span className="font-medium underline decoration-line-200 underline-offset-2 [overflow-wrap:anywhere]">
                    {d.titulo}
                  </span>
                </p>
                <p className="mt-0.5 text-meta text-ink-500">
                  {d.fragmentos.toLocaleString('es-CO')} fragmentos buscables
                  {d.indexadoEl ? ` · ${d.indexadoEl.slice(0, 10)}` : ''}
                </p>
              </button>
              <button
                type="button"
                onClick={() => void quitar(d.documentId)}
                className="btn-ghost btn-sm shrink-0 px-1.5"
                disabled={quitando === d.documentId}
                aria-label={`Quitar ${d.titulo} del expediente`}
              >
                {quitando === d.documentId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {abierto && (
        <div className="mt-3 space-y-3 rounded-card border border-line-200 bg-canvas p-3">
          <div>
            <label className="field-label" htmlFor="archivo-expediente">
              El archivo
            </label>
            <input
              id="archivo-expediente"
              type="file"
              accept=".pdf,.docx,.txt,.md"
              className="field"
              onChange={(e) => void escoger(e.target.files?.[0])}
              disabled={leyendo || indexando}
            />
            <p className="mt-1 text-meta text-ink-500">
              PDF, Word o texto. Se lee aquí en su equipo: el archivo no se envía, solo su texto.
            </p>
          </div>

          {leyendo && (
            <p className="flex items-center gap-2 text-meta text-ink-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Leyendo el documento…
            </p>
          )}

          {leido && (
            <>
              <p className="text-meta text-ink-700">
                Se leyeron {leido.caracteres.toLocaleString('es-CO')} caracteres (~{paginas} páginas).
                {leido.recortado && ' El documento es más largo y se recortó.'}
              </p>
              <div>
                <label className="field-label" htmlFor="titulo-documento">
                  Con qué nombre lo reconoce
                </label>
                <input
                  id="titulo-documento"
                  className="field"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => void indexar()}
                className="btn-primary btn-sm gap-1.5"
                disabled={indexando || !titulo.trim()}
              >
                {indexando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {indexando
                  ? subiendo > 0 && subiendo < 100
                    ? `Subiendo el documento… ${subiendo}%`
                    : 'Indexando… puede tardar un minuto'
                  : 'Indexar en este expediente'}
              </button>
            </>
          )}

          {error && (
            <p className="flex items-start gap-2 text-meta text-ink-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="[overflow-wrap:anywhere]">{error}</span>
            </p>
          )}

          {hecho && (
            <p className="flex items-start gap-2 text-meta text-ink-700">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                {hecho.buscable
                  ? `Indexado en ${hecho.fragmentos.toLocaleString('es-CO')} fragmentos. Ya se puede buscar dentro de este expediente.`
                  : /*
                     * NO SE CALLA CUANDO NO QUEDÓ BUSCABLE. El documento se leyó
                     * pero no se vectorizó —falta proveedor—, y sin decirlo el
                     * abogado creería que su expediente está listo y las
                     * búsquedas saldrían vacías sin explicación.
                     */
                    `Se leyó el documento (${hecho.fragmentos.toLocaleString('es-CO')} fragmentos) pero NO quedó buscable: el motor de búsqueda no está disponible. Vuelva a intentarlo más tarde.`}
              </span>
            </p>
          )}
        </div>
      )}
      <LeerDocumentoIndexado
        expedienteId={expediente.id}
        documentId={leyendoDoc}
        onCerrar={() => setLeyendoDoc(null)}
      />
    </section>
  );
};
