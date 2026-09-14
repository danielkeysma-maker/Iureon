import React from 'react';
import { AlertCircle, CheckCircle2, FileText, FileUp, Loader2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import {
  PARA_INDEXAR,
  textoDelArchivo
} from '../../workspace/services/textoDelArchivo';
import { uploadFileToStorage } from '../../documents/services/storageUpload';
import { expedientesApi } from '../services/expedientes.api';
import type { ExpedienteConDetalle } from '../types';

/**
 * AGREGAR UN DOCUMENTO AL CASO: EL EXPEDIENTE DE 300 PÁGINAS.
 *
 * Diálogo derivado del sistema de `app-dialogos-y-estados.html` (tamaño M), con
 * el rechazo del escaneado de `app-carpetas-y-vista-previa.html` (:368).
 *
 * ─── POR QUÉ INDEXAR NO ES «SUBIR UN ARCHIVO MÁS» ──────────────────────────
 *
 * La revisión corta el texto en 300.000 caracteres y lo dice. Para un escrito
 * de veinte páginas sobra; para un expediente de trescientas, no alcanza — y
 * ningún motor lee trescientas páginas de un tirón. Indexar es la otra forma
 * de leer: el documento se parte en fragmentos, se vectoriza UNA VEZ, y a
 * partir de ahí el motor recupera los pedazos que vienen al caso.
 *
 * ─── EL TEXTO SE LEE AQUÍ; EL ARCHIVO SE GUARDA APARTE ─────────────────────
 *
 * El texto se saca en el navegador: un PDF de trescientas páginas no cabe bajo
 * el tope de cuerpo de Vercel (4,5 MB) y extraer texto es trabajo de
 * procesador. El archivo original sube DIRECTO al almacenamiento, sin pasar por
 * el servidor, para poder abrirlo y descargarlo después. La ayuda del campo lo
 * decía al revés («el archivo no se envía, solo su texto») desde que empezó a
 * guardarse el original; ya no.
 *
 * ─── LA LISTA DE DOCUMENTOS YA NO VIVE AQUÍ ────────────────────────────────
 *
 * Este panel tenía su propia lista, con leer y quitar, y las carpetas otra con
 * leer y mover: las mismas filas dos veces. Quedó una sola, en las carpetas
 * (el árbol las muestra todas), con leer, mover y quitar —este último, ahora
 * con confirmación—.
 *
 * ─── EL ESCANEADO SE RECHAZA, Y LA PANTALLA DICE SOLO LO QUE EXISTE ────────
 *
 * Un PDF escaneado no trae texto: son imágenes. El lector lo rechaza por debajo
 * de 200 caracteres ANTES de subir nada. La maqueta ofrece «Dejarlo así» y
 * «Escribir un fragmento»: ninguna de las dos existe —no se guarda un documento
 * sin texto ni hay notas por página—, así que se ofrecen las dos salidas reales:
 * pedir el original con texto y reemplazar el archivo.
 */
export const IndexarEnExpediente: React.FC<{
  expediente: ExpedienteConDetalle;
  abierto: boolean;
  onCerrar: () => void;
  onIndexado: () => Promise<void>;
}> = ({ expediente, abierto, onCerrar, onIndexado }) => {
  const [titulo, setTitulo] = React.useState('');
  const [leyendo, setLeyendo] = React.useState(false);
  const [indexando, setIndexando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [archivo, setArchivo] = React.useState<File | null>(null);
  const [subiendo, setSubiendo] = React.useState(0);
  const [leido, setLeido] = React.useState<{ texto: string; caracteres: number; recortado: boolean } | null>(
    null
  );
  /* El archivo rechazado por no traer texto: se nombra en la pantalla del escaneado. */
  const [sinTexto, setSinTexto] = React.useState<string | null>(null);
  const [hecho, setHecho] = React.useState<{ fragmentos: number; buscable: boolean } | null>(null);
  const entrada = React.useRef<HTMLInputElement>(null);

  const reiniciar = (): void => {
    setTitulo('');
    setError('');
    setArchivo(null);
    setSubiendo(0);
    setLeido(null);
    setSinTexto(null);
    setHecho(null);
    if (entrada.current) entrada.current.value = '';
  };

  /* Mientras sube o indexa no se cierra: cortar a la mitad deja un original sin índice. */
  const cerrar = (): void => {
    if (indexando) return;
    reiniciar();
    onCerrar();
  };

  const escoger = async (elegido: File | undefined): Promise<void> => {
    if (!elegido) return;
    setError('');
    setHecho(null);
    setLeido(null);
    setSinTexto(null);
    setLeyendo(true);
    try {
      /* Con los límites de indexar: el documento entero, no los 40 folios de clasificar. */
      const r = await textoDelArchivo(elegido, PARA_INDEXAR);
      if (!r.ok) {
        if (r.sinTexto) setSinTexto(elegido.name);
        else setError(r.motivo);
        return;
      }
      setLeido({ texto: r.texto, caracteres: r.caracteres, recortado: r.recortado });
      setArchivo(elegido);
      /* El nombre del archivo es el mejor título por defecto, y se puede cambiar. */
      setTitulo((t) => (t.trim() ? t : elegido.name.replace(/\.[^.]+$/, '')));
    } finally {
      setLeyendo(false);
      if (entrada.current) entrada.current.value = '';
    }
  };

  const indexar = async (): Promise<void> => {
    if (!leido || !titulo.trim()) return;
    setIndexando(true);
    setError('');
    setSubiendo(0);
    try {
      /*
       * SE SUBE PRIMERO Y SE INDEXA DESPUÉS. Si la subida falla, no se indexa:
       * un documento buscable cuyo original nunca llegó sería justo la mitad
       * que no se puede reparar después sin volver a subirlo todo.
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
      await onIndexado();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIndexando(false);
    }
  };

  /* Una página de escrito ronda las 350 palabras; sirve para que el número se entienda. */
  const paginas = leido ? Math.max(1, Math.round(leido.caracteres / 350 / 6)) : 0;

  const acciones = hecho ? (
    <>
      <button type="button" className="cn-ini-boton cn-ini-boton--suave cn-exp-boton" onClick={reiniciar}>
        Agregar otro
      </button>
      <button type="button" className="cn-ini-boton cn-ini-boton--primario cn-exp-boton" onClick={cerrar}>
        Listo
      </button>
    </>
  ) : leido ? (
    <>
      <button type="button" className="cn-ini-boton cn-ini-boton--texto cn-exp-boton" onClick={cerrar} disabled={indexando}>
        Cancelar
      </button>
      <button
        type="button"
        onClick={() => void indexar()}
        className="cn-ini-boton cn-ini-boton--primario cn-exp-boton"
        disabled={indexando || !titulo.trim()}
      >
        {indexando ? 'Agregando…' : 'Agregar al caso'}
      </button>
    </>
  ) : (
    <button type="button" className="cn-ini-boton cn-ini-boton--texto cn-exp-boton" onClick={cerrar}>
      Cerrar
    </button>
  );

  return (
    <Dialog
      abierto={abierto}
      onCerrar={cerrar}
      tamano="M"
      titulo="Agregar un documento"
      subtitulo="Se lee su texto para poder buscar por dentro, y se guarda el archivo para abrirlo después."
      hayCambiosSinGuardar={Boolean(leido) || indexando}
      onIntentoDeCerrarConCambios={() => undefined}
      acciones={acciones}
    >
      <div className="cn-exp-dlg">
        {/*
          El campo de archivo va SIEMPRE montado y oculto a la vista: lo usan el
          botón de escoger y «Reemplazar el archivo» del escaneado. Oculto con
          `sr-only`, no con `display:none`, para que siga siendo alcanzable.
        */}
        <input
          ref={entrada}
          id="archivo-expediente"
          type="file"
          accept=".pdf,.docx,.txt,.md"
          className="sr-only"
          onChange={(e) => void escoger(e.target.files?.[0])}
          disabled={leyendo || indexando}
        />

        {sinTexto ? (
          <section className="cn-exp-escaneado" aria-label="El archivo no trae texto">
            <div className="cn-exp-escaneado-cabeza">
              <FileText className="cn-exp-fila-icono h-5 w-5" aria-hidden="true" />
              <p className="min-w-0 flex-1 cn-exp-fuerte [overflow-wrap:anywhere]">{sinTexto}</p>
              <span className="cn-exp-chip cn-exp-chip--aviso">No se agregó</span>
            </div>
            <div className="cn-exp-escaneado-aviso">
              <p className="cn-exp-escaneado-titulo">Este archivo no trae texto que se pueda leer</p>
              <p>
                Si es un PDF escaneado o una foto de un papel, son imágenes de páginas. La plataforma solo agrega
                documentos cuyo texto puede leer, así que este no se guardó ni quedó buscable. No se le cobró nada.
              </p>
            </div>
            <p className="cn-exp-h3">Qué puede hacer</p>
            <ol className="cn-exp-opciones">
              <li>
                <span className="cn-exp-opcion-numero" aria-hidden="true">
                  01
                </span>
                <span>
                  <span className="cn-exp-opcion-titulo">Pedir el original con texto</span>
                  <span className="cn-exp-opcion-texto">
                    Un PDF generado por computador —el que descarga del despacho o le envía la contraparte por
                    correo— sí trae texto. Es la salida limpia.
                  </span>
                </span>
              </li>
              <li>
                <span className="cn-exp-opcion-numero" aria-hidden="true">
                  02
                </span>
                <span>
                  <span className="cn-exp-opcion-titulo">Reemplazar el archivo</span>
                  <span className="cn-exp-opcion-texto">Escoja otra versión del mismo documento que sí traiga texto.</span>
                </span>
              </li>
            </ol>
            <div>
              <button
                type="button"
                className="cn-ini-boton cn-ini-boton--primario cn-exp-boton"
                onClick={() => entrada.current?.click()}
              >
                Reemplazar el archivo
              </button>
            </div>
          </section>
        ) : hecho ? (
          <p className={hecho.buscable ? 'cn-exp-hecho' : 'cn-aviso'} role="status">
            {hecho.buscable && <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
            <span>
              {hecho.buscable
                ? `Agregado en ${hecho.fragmentos.toLocaleString('es-CO')} fragmentos. Ya se puede buscar dentro de este caso. Quedó en la raíz del expediente; desde Carpetas lo puede mover.`
                : /*
                   * NO SE CALLA CUANDO NO QUEDÓ BUSCABLE. El documento se leyó
                   * pero no se vectorizó —falta proveedor—, y sin decirlo el
                   * abogado creería que su expediente está listo y las
                   * búsquedas saldrían vacías sin explicación.
                   */
                  `Se leyó el documento (${hecho.fragmentos.toLocaleString('es-CO')} fragmentos) pero NO quedó buscable: el motor de búsqueda no está disponible. Vuelva a intentarlo más tarde.`}
            </span>
          </p>
        ) : leido ? (
          <>
            <p className="cn-exp-dlg-texto">
              Se leyeron {leido.caracteres.toLocaleString('es-CO')} caracteres (~{paginas} páginas).
              {leido.recortado && ' El documento es más largo y se recortó.'}
            </p>
            <div className="cn-exp-campo">
              <label className="cn-exp-rotulo" htmlFor="titulo-documento">
                Con qué nombre lo reconoce
              </label>
              <input
                id="titulo-documento"
                className="cn-exp-entrada"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                disabled={indexando}
              />
              <p className="cn-exp-ayuda">Queda en la raíz del expediente; desde Carpetas lo puede mover.</p>
            </div>
            {indexando && (
              <div className="cn-exp-progreso-caja" role="status">
                <p className="cn-exp-cargando">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {subiendo > 0 && subiendo < 100
                    ? `Subiendo el documento… ${subiendo}%`
                    : 'Indexando… puede tardar un minuto'}
                </p>
                <div className="cn-exp-progreso" aria-hidden="true">
                  <span style={{ width: `${subiendo > 0 && subiendo < 100 ? subiendo : 100}%` }} />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="cn-exp-escoger">
            {leyendo ? (
              <p className="cn-exp-cargando" role="status">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Leyendo el documento…
              </p>
            ) : (
              <>
                <label htmlFor="archivo-expediente" className="cn-ini-boton cn-ini-boton--primario cn-exp-boton">
                  <FileUp className="h-4 w-4" aria-hidden="true" />
                  Escoger el archivo
                </label>
                <p className="cn-exp-ayuda">
                  PDF, Word o texto. El texto se lee aquí, en su equipo; el archivo se guarda en el caso para abrirlo y
                  descargarlo después.
                </p>
              </>
            )}
          </div>
        )}

        {error && (
          <p className="cn-error" role="alert">
            <AlertCircle className="h-4 w-4" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{error}</span>
          </p>
        )}
      </div>
    </Dialog>
  );
};
