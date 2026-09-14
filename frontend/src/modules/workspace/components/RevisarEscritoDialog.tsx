import React from 'react';
import { AlertTriangle, ClipboardCheck, Copy, Download, FileText, History, Loader2, Sparkles, Trash2, UploadCloud, X } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { ApiError } from '../../../config/httpClient';
import {
  archivoABase64,
  reviewApi,
  type ConsentimientoDeGuardado,
  type ModoDeRevision,
  type RespuestaDeRevision,
  type RevisionGuardada
} from '../services/review.api';
import { readSession } from '../../auth/session';
import { uploadFileToStorage } from '../../documents/services/storageUpload';
import { exportarInformeAPdf, exportarInformeAWord } from '../services/informeExport.service';
import type { DatosDeExportacion } from '../services/informeLayout';
import type { DatosDelTaller } from './TallerDeRevision';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import type { OpcionEnCascada } from './SelectorEnCascada';
import { EstadoDeLaFicha } from './SelectorEnCascada';
import { SelectorDelFormulario } from './SelectorDelFormulario';
import { estadoDeLaFicha, ordenarParaLaLista } from '../services/fichaEnLaLista';
import { esTituloDeTrabajo } from '../../catalog/tituloDeTrabajo';
import { useCatalogBranchesState } from '../../catalog/hooks/useCatalogBranches';
import { useBranchActuacionesState } from '../../catalog/hooks/useBranchActuaciones';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import { GuiaEligeActuacionDialog } from './GuiaEligeActuacionDialog';
import { ActuacionPropiaDialog } from './ActuacionPropiaDialog';
import { textoDelArchivo } from '../services/textoDelArchivo';
import { etiquetaDeAtaque, puntosDeAtaqueDe } from '../services/ataque';
import { LecturaDelDocumentoRecibido } from './LecturaDelDocumentoRecibido';
import { InformeDelEscritoPropio } from './InformeDelEscritoPropio';
import { lineaDePasajes, lineasDeLaBanda, marcasDelHallazgo, normalizarInforme, rotuloDeMarca } from '../services/comprobaciones';
import type { SeccionDelInforme } from '../services/review.api';
import { PuenteAlAtaque } from './PuenteAlAtaque';
import type { ActuacionRole } from '../../catalog/types';
import { COMO_SE_REPRESENTA, PAPELES_REPRESENTABLES } from '../../expedientes/types';
import { expedientesApi } from '../../expedientes/services/expedientes.api';
import { SelectorDeExpediente } from '../../expedientes/components/SelectorDeExpediente';
import type { PapelEnElExpediente } from '../../expedientes/types';

/**
 * Revisar un escrito ya redactado.
 *
 * ─── QUÉ ES ─────────────────────────────────────────────────────────────────
 *
 * El abogado sube la tutela, la demanda o el recurso que ya escribió y
 * pregunta lo que quiera: debilidades, fortalezas, qué aplicó mal. La
 * respuesta es un informe, no un borrador; el escrito no se reescribe.
 *
 * ─── POR QUÉ VALE MÁS QUE UN CHAT ───────────────────────────────────────────
 *
 * La revisión se hace contra la ficha verificada de la actuación elegida
 * arriba. Lo objetivo —qué secciones exige la norma y cuáles faltan— sale del
 * catálogo; lo valorativo, del modelo. El informe los separa, y la cabecera
 * dice si hubo ficha o no, porque sin ficha lo objetivo pierde respaldo.
 *
 * ─── QUÉ SE GUARDA ──────────────────────────────────────────────────────────
 *
 * El informe, siempre. El texto del escrito y el trabajo del taller —la
 * conversación, los comentarios, las versiones— solo si la firma lo autorizó.
 * Esa autorización se pregunta AQUÍ, antes de la primera revisión de un socio
 * administrador que aún no ha decidido: los abogados olvidaban guardar y
 * perdían saldo y lo ya consultado, y la pregunta en el taller llegaba tarde,
 * cuando el trabajo ya estaba en riesgo. Un abogado sin autoridad no se
 * bloquea nunca: revisa igual y al terminar se le dice qué no se conserva y a
 * quién pedirlo.
 *
 * ─── DOS MODOS, Y LA ELECCIÓN VA ANTES QUE NADA ─────────────────────────────
 *
 * «Un escrito mío, que voy a presentar» y «un documento que recibí». El primero
 * es el de siempre y no cambia en nada. El segundo nació de una pregunta del
 * usuario que no tenía respuesta posible: «si es un auto de un juez, ¿qué tipo
 * de actuación escojo?». Ninguno. Un auto, una sentencia, un oficio o una
 * notificación son papeles que LLEGAN: nadie los va a presentar, no les falta
 * ninguna sección frente a la norma, y pedir su actuación es pedirle al abogado
 * justamente lo que no sabe y lo que no le importa.
 *
 * Por eso la elección está ARRIBA DEL TODO, antes del archivo: decide qué se le
 * pregunta y qué se le responde. Con «un documento que recibí» el bloque «Qué
 * actuación es» desaparece y el botón de revisar se enciende con solo el
 * archivo.
 *
 * ─── DÓNDE VIVE EL «¿Y QUÉ PUEDO HACER?» DEL MODO RECIBIDO ──────────────────
 *
 * No en el motor. El informe del documento recibido solo puede afirmar lo que
 * el documento dice, porque no hay ficha del catálogo detrás de él. La pregunta
 * que sigue —qué actuación procede, con qué término y ante qué autoridad— la
 * responde el catálogo verificado: por eso el informe termina ofreciendo la
 * MISMA guía de actuaciones que ya usa este diálogo, con el texto del documento
 * como hechos, y recordando la agenda de términos. No hay un proponedor nuevo.
 *
 * ─── DE DÓNDE SALE LA ACTUACIÓN ─────────────────────────────────────────────
 *
 * Abierto desde Redacción, la hereda: la barra de configuración ya la tiene
 * elegida y este diálogo solo la usa. Abierto desde «Revisiones» no hay nada
 * que heredar, y ese era el defecto de uso que se reportó: para revisar había
 * que pasar por el panel de Redacción —que enreda, porque no se va a redactar
 * nada— y encima había que saber de antemano CÓMO SE LLAMA en el catálogo el
 * escrito que uno acaba de recibir. Nadie que sube un documento a revisar lo
 * sabe.
 *
 * Con `eligeActuacion` el diálogo se vuelve autosuficiente: trae su propia
 * rama y su propia actuación —las dos leídas del catálogo por API, nunca de
 * listas escritas a mano— y ofrece que la guía las proponga leyendo el texto
 * del archivo en el navegador, sin costo y sin subirlo.
 *
 * LO QUE NO CAMBIA: la petición viaja SIEMPRE con una actuación real escogida
 * por una persona. El servidor sigue respondiendo 400 si falta, y aquí no se
 * inventa ningún valor por defecto: mientras nadie haya elegido, el botón está
 * apagado y dice por qué.
 */

interface RevisarEscritoDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  /**
   * UN DOCUMENTO QUE LLEGA YA LEIDO DESDE OTRA PANTALLA.
   *
   * Orientacion detecta que el papel adjuntado anuncia un termino —que ella no
   * lee— y ofrece traerlo aqui. Llega el texto y el nombre, y el dialogo se
   * abre directamente en «Un documento que recibi»: mandarlo a la puerta
   * correcta y dejarle escoger el modo otra vez seria devolverle el trabajo.
   *
   * `completo` en falso significa que el texto no cupo en el traspaso; el
   * dialogo se abre en el modo correcto, vacio, y lo dice.
   */
  documentoTraido?: { texto: string; nombre: string; completo: boolean } | null;
  documentType: string;
  legalBranch: string;
  precioCop: number;
  /** Avisa a quien pinta el saldo que hubo un cobro: el saldo se reporta, nunca se deriva. */
  onSaldoCambiado?: () => void;
  /** Abre el taller: el escrito con los pasajes marcados, edicion y chat con el revisor. */
  onAbrirTaller?: (datos: DatosDelTaller) => void;
  /**
   * El diálogo elige la actuación por su cuenta, porque no la heredó de ninguna
   * barra de configuración. Lo enciende «Revisiones»; Redacción no lo pasa.
   */
  eligeActuacion?: boolean;
  /**
   * Quién firma. Solo se usa para crear una actuación propia de la firma desde
   * aquí, y es el mismo valor con el que trabaja el espacio de redacción.
   */
  userRole?: ActuacionRole;
  /**
   * Lleva a Redacción la actuación que el abogado escogió tras leer un
   * documento recibido, con sus hechos y la instrucción que haya editado.
   *
   * OPCIONAL, Y SU AUSENCIA ES UNA RESPUESTA: quien monte este diálogo sin
   * saber llevar a Redacción no verá el botón, en vez de verlo y que no haga
   * nada.
   */
  onRedactar?: (exactName: string, rama: string, hechos: string, instruccion: string) => void;
}

/*
 * 15 MB: una tutela con sus anexos escaneados. Hasta EN_CUERPO el archivo viaja
 * dentro del JSON (un viaje, sin almacenamiento); por encima, Vercel no acepta
 * el cuerpo y el archivo sube directo a B2 como el audio de las audiencias: el
 * servidor lo lee desde ahi y lo borra antes de responder.
 */
const MAX_BYTES = 15 * 1024 * 1024;
const EN_CUERPO = 3_500_000;
const pesos = (n: number): string => `$${Math.round(n).toLocaleString('es-CO')}`;

/*
 * LAS SUGERENCIAS SON DE CADA MODO, y no por adorno: las del escrito propio
 * («qué corregiría antes de presentarlo») no se le pueden preguntar a un auto
 * que ya está proferido, y pegadas ahí enseñarían a usar mal el modo nuevo.
 */
const SUGERENCIAS_PROPIO = [
  'Señale debilidades, fortalezas, qué está mal aplicado y qué corregiría antes de presentarlo.',
  '¿La petición es concreta y ejecutable? ¿Qué le falta al escrito frente a lo que exige la norma?',
  '¿Los hechos sostienen las pretensiones? ¿Dónde flaquea la argumentación?'
];

const SUGERENCIAS_RECIBIDO = [
  'Dígame qué es este documento, qué decide, qué me exige y para cuándo, qué queda pendiente y por dónde se ataca.',
  '¿Qué afirmó aquí el juez que no se sostiene contra la norma que el propio auto cita? ¿Qué le pedí y no resolvió?',
  '¿Qué me ordena a mí en concreto y con qué palabras lo dice? ¿Anuncia algún plazo?',
  '¿Qué resolvió y qué queda pendiente del trámite, según lo que el propio documento dice?'
];

const SUGERENCIAS: Record<ModoDeRevision, string[]> = {
  ESCRITO_PROPIO: SUGERENCIAS_PROPIO,
  DOCUMENTO_RECIBIDO: SUGERENCIAS_RECIBIDO
};

export const RevisarEscritoDialog: React.FC<RevisarEscritoDialogProps> = ({
  abierto,
  onCerrar,
  documentoTraido,
  documentType,
  legalBranch,
  precioCop,
  onSaldoCambiado,
  onAbrirTaller,
  eligeActuacion = false,
  userRole = 'LITIGANTE',
  onRedactar
}) => {
  /*
   * EL MODO ES LO PRIMERO QUE SE ELIGE Y LO PRIMERO QUE SE DECLARA. Por defecto
   * el de siempre: quien abría este diálogo antes encuentra exactamente lo que
   * encontraba.
   */
  const [modo, setModo] = React.useState<ModoDeRevision>('ESCRITO_PROPIO');
  /*
   * A quien representa el abogado. Arranca sin declarar, que es lo honesto:
   * suponerle una posicion produciria exactamente el aviso equivocado.
   */
  const [posicion, setPosicion] = React.useState<PapelEnElExpediente>('DESCONOCIDO');
  /*
   * ─── DE QUE CASO ES, Y POR QUE ESO PRELLENA LA POSICION ──────────────────
   *
   * La columna `document_reviews.expediente_id` existia y solo la escribia
   * «Traer al expediente», o sea DESPUES y a mano. Diciendolo aqui, la
   * revision NACE atada: el expediente la cuenta sin que nadie vuelva a
   * buscarla.
   *
   * Y de paso deja de preguntarse algo que la aplicacion ya sabe. Si el
   * expediente tiene registrado a su cliente como actor, su papel ES la
   * posicion; el servidor la deduce y la manda en `posicionSugerida`, con
   * `null` cuando no se puede deducir sin adivinar.
   */
  const [expedienteId, setExpedienteId] = React.useState('');
  const [posicionDeducida, setPosicionDeducida] = React.useState(false);
  const esRecibido = modo === 'DOCUMENTO_RECIBIDO';
  const [archivo, setArchivo] = React.useState<File | null>(null);
  const [texto, setTexto] = React.useState('');
  const [pregunta, setPregunta] = React.useState(SUGERENCIAS_PROPIO[0]);
  /** De qué cliente o proceso es el escrito. Queda en la lista y en el PDF/Word. */
  const [cliente, setCliente] = React.useState('');
  const [ocupado, setOcupado] = React.useState(false);
  const [error, setError] = React.useState('');
  const [respuesta, setRespuesta] = React.useState<RespuestaDeRevision | null>(null);
  const [copiado, setCopiado] = React.useState(false);
  /** Porcentaje de subida cuando el archivo va por almacenamiento; null si no aplica. */
  const [subiendo, setSubiendo] = React.useState<number | null>(null);
  /*
   * LAS REVISIONES ANTERIORES, para volver al informe dias despues. Se listan
   * sin cuerpos y se abren una a una. Es la misma pantalla del informe, con
   * la actuacion y el archivo de aquella vez.
   */
  const [anteriores, setAnteriores] = React.useState<RevisionGuardada[]>([]);
  const [abriendo, setAbriendo] = React.useState<string | null>(null);
  const [tituloDelInforme, setTituloDelInforme] = React.useState(documentType);
  /** El archivo y la fecha del informe en pantalla, para nombrar y fechar la exportación. */
  const [origenDelInforme, setOrigenDelInforme] = React.useState<{ fileName: string; fecha: string; cliente: string; revisadoPor: string }>({
    fileName: '',
    fecha: '',
    cliente: '',
    revisadoPor: ''
  });
  const [exportando, setExportando] = React.useState<'pdf' | 'word' | null>(null);
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
  /** El texto del escrito y la conversacion de la revision en pantalla, para abrir el taller. */
  /** Qué modo leyó el informe que está en pantalla. Puede diferir del elegido arriba al abrir uno anterior. */
  const [modoDelInforme, setModoDelInforme] = React.useState<ModoDeRevision>('ESCRITO_PROPIO');
  const [paraElTaller, setParaElTaller] = React.useState<{ texto: string | null; conversacion: DatosDelTaller['conversacion']; anotaciones: NonNullable<DatosDelTaller['anotaciones']>; versiones: NonNullable<DatosDelTaller['versiones']>; guardaTexto: boolean; revisionId: string | null; archivo: File | null }>({ texto: null, conversacion: [], anotaciones: [], versiones: [], guardaTexto: false, revisionId: null, archivo: null });

  /* ─── LA ACTUACIÓN CUANDO NO SE HEREDA ─────────────────────────────────────
   *
   * Dos estados propios que SOLO mandan con `eligeActuacion`. Sin él, el
   * diálogo sigue leyendo las props tal como venía haciéndolo desde Redacción:
   * esto es aditivo y el recorrido viejo no cambia ni un renglón.
   */
  const [ramaPropia, setRamaPropia] = React.useState(legalBranch);
  const [tipoPropio, setTipoPropio] = React.useState(documentType);
  const rama = eligeActuacion ? ramaPropia : legalBranch;
  const tipo = eligeActuacion ? tipoPropio : documentType;

  /** Sube al crear una actuación propia: obliga a releer la lista de la rama. */
  const [recargaCatalogo, setRecargaCatalogo] = React.useState(0);
  const [guiaAbierta, setGuiaAbierta] = React.useState(false);
  const [propiaAbierta, setPropiaAbierta] = React.useState(false);
  /*
   * LA RAMA, LA CASILLA DE «NO SÉ LA RAMA» Y LA ACTUACIÓN RECONOCIDA DEL MODO
   * RECIBIDO YA NO VIVEN AQUÍ: son de `PuenteAlAtaque`, que es la misma pieza
   * que monta el taller. Mientras vivieron en este diálogo, el pie con el botón
   * hacia la guía existía solo dentro de él y el taller se quedaba sin salida.
   */
  /*
   * Los hechos con los que se consulta el triaje son EL TEXTO DEL ESCRITO. No
   * se le pide al abogado que cuente otra vez lo que ya está en el archivo que
   * acaba de adjuntar.
   */
  const [hechos, setHechos] = React.useState('');
  const [leyendoArchivo, setLeyendoArchivo] = React.useState(false);
  const [avisoDeLectura, setAvisoDeLectura] = React.useState('');
  /*
   * EL ARCHIVO SE LEE UNA SOLA VEZ. Volver a abrir la guía sobre el mismo
   * archivo no vuelve a descomprimir el PDF ni el Word; cambiarlo sí, porque
   * entonces los hechos son otros.
   */
  const archivoLeido = React.useRef<File | null>(null);

  const ramasEstado = useCatalogBranchesState();
  /*
   * SIN FILTRAR POR ROL, a diferencia de la barra de Redacción. Allí el abogado
   * ya declaró quién firma el escrito que va a redactar; aquí está revisando un
   * documento que puede venir de cualquiera —un auto del despacho, un traslado
   * de la secretaría—, y esconderle actuaciones por un rol que nadie eligió
   * sería esconderle justamente la que busca.
   */
  const catalogoDeLaRama = useBranchActuacionesState(rama, undefined, recargaCatalogo);
  /** La guía de este diálogo es la del escrito PROPIO; la del modo recibido la lleva `PuenteAlAtaque`. */
  const ramaDeLaGuia = rama;

  const opcionesRama: OpcionEnCascada[] = React.useMemo(
    () => ramasEstado.ramas.map((b) => ({ valor: b, etiqueta: BRANCH_LABELS[b] ?? b })),
    [ramasEstado.ramas]
  );

  /*
   * Cada actuación con su estado y su término a la vista, como en el selector
   * de Redacción: el abogado tiene que poder ver ANTES de elegir si el plazo
   * está verificado contra la norma, si no caduca o si nadie lo comprobó. Un
   * visto verde en todas afirmaría una verificación que el catálogo no respalda.
   *
   * EL MISMO ORDEN Y LOS MISMOS BLOQUES DE LA BARRA: alfabético español, y lo
   * prestado por remisión debajo, con su advertencia dicha UNA vez en la
   * cabecera del bloque y no repetida en cada fila. Este diálogo no tiene
   * salidas de servicio en la lista: la guía es el botón de abajo.
   */
  const opcionesTipo: OpcionEnCascada[] = React.useMemo(
    () =>
      ordenarParaLaLista(catalogoDeLaRama.actuaciones).map((a): OpcionEnCascada => {
        if (a.porRemision) {
          return {
            valor: a.exactName,
            etiqueta: a.exactName,
            detalleTexto: a.porRemision.marca,
            grupo: { titulo: a.porRemision.marca, aviso: a.porRemision.aviso }
          };
        }
        const estado = estadoDeLaFicha(a, esTituloDeTrabajo(a.exactName));
        const termino = a.term.status === 'VERIFICADO' ? a.term.description ?? '' : '';
        return {
          valor: a.exactName,
          etiqueta: a.exactName,
          detalle: (
            <>
              <EstadoDeLaFicha estado={estado} />
              {termino && <span className="cn-red-fila-termino">{termino}</span>}
            </>
          ),
          detalleTexto: [estado.articulo, estado.texto, termino].filter(Boolean).join(' · ')
        };
      }),
    [catalogoDeLaRama.actuaciones]
  );

  /* La posición es una lista corta y fija: sin lupa, y con la misma fuente en las dos formas. */
  const opcionesPosicion: OpcionEnCascada[] = React.useMemo(
    () => PAPELES_REPRESENTABLES.map((p) => ({ valor: p, etiqueta: COMO_SE_REPRESENTA[p] })),
    []
  );

  /*
   * La autorización de la firma, leída al abrir. `el === null` significa que
   * nadie ha decidido todavía: ni sí ni no. Solo entonces se pregunta.
   */
  const [consentimiento, setConsentimiento] = React.useState<ConsentimientoDeGuardado | null>(null);
  const [preguntaDeGuardado, setPreguntaDeGuardado] = React.useState(false);
  const rol = readSession()?.user.role;
  const puedeAutorizar = rol === 'FIRM_ADMIN' || rol === 'SUPER_ADMIN';
  const firmaSinDecidir = consentimiento !== null && consentimiento.el === null && !consentimiento.guarda;

  /*
   * EL DOCUMENTO QUE VINO DE ORIENTACION SE COLOCA AL ABRIR, una sola vez por
   * apertura. Se pone el modo ANTES que el texto porque `cambiarModo` limpia
   * lo que hubiera: al reves, el texto recien puesto se borraria solo.
   */
  const traidoPuesto = React.useRef(false);
  React.useEffect(() => {
    if (!abierto) {
      traidoPuesto.current = false;
      return;
    }
    if (traidoPuesto.current || !documentoTraido) return;
    traidoPuesto.current = true;
    setModo('DOCUMENTO_RECIBIDO');
    setArchivo(null);
    setTexto(documentoTraido.completo ? documentoTraido.texto : '');
  }, [abierto, documentoTraido]);

  /*
   * AL ESCOGER CASO SE PIDE SU DETALLE Y SE PRELLENA LA POSICION.
   *
   * Solo si el abogado no la habia tocado: una sugerencia que pisa lo que el
   * escribio no es una sugerencia. `posicionDeducida` recuerda que el valor
   * actual lo puso el servidor, asi que cambiar de caso si puede
   * reemplazarlo — pero una eleccion suya, no.
   */
  const eligeExpediente = async (id: string): Promise<void> => {
    setExpedienteId(id);
    if (!id) return;
    try {
      const detalle = await expedientesApi.obtener(id);
      const sugerida = detalle.posicionSugerida;
      if (!sugerida) return;
      if (posicion === 'DESCONOCIDO' || posicionDeducida) {
        setPosicion(sugerida);
        setPosicionDeducida(true);
      }
    } catch {
      /* El detalle es un extra: sin el, el desplegable se llena a mano. */
    }
  };

  React.useEffect(() => {
    if (!abierto) return;
    reviewApi
      .consentimiento()
      .then(setConsentimiento)
      .catch(() => setConsentimiento(null));
  }, [abierto]);

  const cargarAnteriores = React.useCallback(() => {
    reviewApi
      .listar()
      .then(setAnteriores)
      .catch(() => setAnteriores([]));
  }, []);

  React.useEffect(() => {
    if (abierto) cargarAnteriores();
  }, [abierto, cargarAnteriores]);

  const abrirAnterior = async (r: RevisionGuardada) => {
    setAbriendo(r.id);
    setError('');
    try {
      const completa = await reviewApi.obtener(r.id);
      setModoDelInforme(completa.modo ?? 'ESCRITO_PROPIO');
      setTituloDelInforme(completa.documentType);
      setOrigenDelInforme({
        fileName: completa.fileName,
        fecha: new Date(completa.createdAt).toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' }),
        cliente: completa.cliente,
        revisadoPor: completa.userEmail
      });
      /* De una revisión anterior no hay archivo en esta pestaña: el visor se lo pide al servidor por su id. */
      setParaElTaller({ texto: completa.textoTrabajo ?? completa.textoOriginal, conversacion: completa.conversacion, anotaciones: completa.anotaciones ?? [], versiones: completa.versiones ?? [], guardaTexto: Boolean(completa.textoOriginal), revisionId: completa.id, archivo: null });
      setRespuesta({
        id: completa.id,
        guardada: true,
        modo: completa.modo ?? 'ESCRITO_PROPIO',
        informe: completa.informe,
        informeRecibido: completa.informeRecibido ?? null,
        informeLibre: completa.informeLibre,
        conFicha: completa.conFicha,
        truncado: completa.truncado,
        caracteres: completa.caracteres,
        cobradoCop: completa.cobradoCop,
        saldoCop: NaN
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo abrir esa revisión.');
    } finally {
      setAbriendo(null);
    }
  };

  const eliminarAnterior = async (r: RevisionGuardada) => {
    try {
      await reviewApi.eliminar(r.id);
      setAnteriores((xs) => xs.filter((x) => x.id !== r.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  React.useEffect(() => {
    if (abierto) return;
    setModo('ESCRITO_PROPIO');
    setModoDelInforme('ESCRITO_PROPIO');
    setArchivo(null);
    setTexto('');
    setPregunta(SUGERENCIAS_PROPIO[0]);
    setCliente('');
    setError('');
    setRespuesta(null);
    setOcupado(false);
    /*
     * La actuación elegida a mano también se suelta al cerrar: el diálogo que
     * se abre desde «Revisiones» empieza siempre en blanco, y arrastrar la del
     * escrito anterior sería exactamente la trampa que este cambio evita —
     * revisar un documento contra la ficha de otro sin que nadie lo eligiera.
     */
    setRamaPropia(legalBranch);
    setTipoPropio(documentType);
    setHechos('');
    setAvisoDeLectura('');
    archivoLeido.current = null;
    // Las props son la configuración heredada: si cambian con el diálogo
    // cerrado, lo que se restaura es la nueva.
  }, [abierto, legalBranch, documentType]);

  const hayEscrito = archivo !== null || texto.trim().length > 0;
  /*
   * EN EL MODO RECIBIDO NO FALTA NINGUNA ACTUACIÓN, porque no se pide: el botón
   * se enciende con solo el archivo. En el modo propio la exigencia se queda
   * intacta, y el servidor la sigue imponiendo con su 400.
   */
  const sinActuacion = !esRecibido && (!tipo || /^elegir/i.test(tipo));

  /*
   * Cambiar de modo arrastra la pregunta SOLO si era una sugerencia del modo
   * anterior. Lo que el abogado escribió a mano no se le borra por cambiar de
   * casilla: eso ya pasó en otras pantallas y se reportó como pérdida de
   * trabajo.
   */
  const cambiarModo = (nuevo: ModoDeRevision) => {
    if (nuevo === modo) return;
    const eraSugerencia = SUGERENCIAS[modo].includes(pregunta);
    setModo(nuevo);
    if (eraSugerencia) setPregunta(SUGERENCIAS[nuevo][0]);
    setError('');
  };

  const elegirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_BYTES) {
      setError('El archivo supera 15 MB. Quite los anexos o pegue el texto del escrito.');
      return;
    }
    setError('');
    setAvisoDeLectura('');
    setArchivo(f);
  };

  /*
   * ─── QUE LA GUÍA DIGA QUÉ ACTUACIÓN ES ────────────────────────────────────
   *
   * El texto se saca del archivo AQUÍ, en el navegador, con el servicio
   * compartido: ni una subida ni un peso antes de que el abogado decida si
   * sigue. Un PDF escaneado no trae texto y eso se dice con esas palabras, en
   * vez de mandar una cadena vacía al triaje y recibir un «no reconozco nada»
   * que parecería un fallo del catálogo.
   *
   * La guía PROPONE; elige una persona. Este botón no escribe `tipo`: lo
   * escribe el `onElegir` del diálogo, con el nombre exacto del catálogo.
   */
  const pedirLaGuia = async () => {
    if (leyendoArchivo) return;
    setAvisoDeLectura('');
    if (!archivo) {
      /* Texto pegado: ya está leído, no hay archivo que abrir. */
      setHechos(texto.trim());
      setGuiaAbierta(true);
      return;
    }
    if (archivoLeido.current === archivo && hechos) {
      setGuiaAbierta(true);
      return;
    }
    setLeyendoArchivo(true);
    try {
      const leido = await textoDelArchivo(archivo);
      if (!leido.ok) {
        setAvisoDeLectura(leido.motivo);
        return;
      }
      archivoLeido.current = archivo;
      setHechos(leido.texto);
      setGuiaAbierta(true);
    } finally {
      setLeyendoArchivo(false);
    }
  };

  /*
   * Antes de generar, la pregunta que evita perder el trabajo: al socio
   * administrador de una firma que no ha decidido se le pide decidir; a los
   * demás se les revisa sin más.
   */
  const pedirRevision = () => {
    if (!hayEscrito || ocupado) return;
    if (puedeAutorizar && firmaSinDecidir) {
      setPreguntaDeGuardado(true);
      return;
    }
    void revisar();
  };

  const decidirGuardado = async (conservar: boolean) => {
    setPreguntaDeGuardado(false);
    /*
     * LA AUTORIZACIÓN RECIÉN DADA VIAJA A MANO HASTA `revisar`, NO POR EL
     * ESTADO. `setConsentimiento` no cambia la variable que esta función ya
     * capturó: `revisar` seguiría leyendo el «no ha decidido» de antes y
     * mandaría el archivo dentro del cuerpo, sin `conservarOriginal`. El
     * resultado era el defecto que el socio administrador veía en su PRIMERA
     * revisión después de autorizar: el informe salía, el texto se guardaba
     * —eso lo decide el servidor leyendo la base— pero el archivo original no
     * se conservaba, y el visor del taller decía después que «no se conservó»,
     * como si nunca lo hubiera autorizado.
     */
    let vigente = consentimiento;
    try {
      vigente = await reviewApi.autorizarGuardado(conservar);
      setConsentimiento(vigente);
    } catch (err) {
      /* La decisión no se pudo guardar; la revisión sigue y se dice por qué el taller queda solo en la sesión. */
      setError(err instanceof Error ? `${err.message} La revisión continúa; podrá autorizar el guardado desde «Revisiones».` : 'No se pudo guardar la decisión.');
    }
    await revisar(vigente);
  };

  const revisar = async (consentimientoVigente: ConsentimientoDeGuardado | null = consentimiento) => {
    if (!hayEscrito || ocupado) return;
    setOcupado(true);
    setError('');
    setRespuesta(null);
    try {
      /*
       * ─── POR DÓNDE VIAJA EL ARCHIVO ───────────────────────────────────────
       *
       * Pequeño y sin conservar: dentro del cuerpo, un viaje y sin
       * almacenamiento, como siempre. En cuanto la firma autorizó conservar
       * escritos va SIEMPRE por el almacenamiento, aunque quepa: el visor del
       * original necesita el archivo tal como está constituido, y devolverlo a
       * B2 desde la función gastaría su reloj en una subida que el navegador
       * ya sabe hacer. Sin autorización se sigue borrando al leerlo.
       */
      const conservarOriginal = Boolean(consentimientoVigente?.guarda);
      let cuerpo: { fileName: string; contentBase64?: string; storageKey?: string; texto?: string; conservarOriginal?: boolean; contentType?: string };
      if (!archivo) {
        cuerpo = { fileName: 'texto-pegado.txt', texto };
      } else if (archivo.size <= EN_CUERPO && !conservarOriginal) {
        cuerpo = { fileName: archivo.name, contentBase64: await archivoABase64(archivo) };
      } else {
        setSubiendo(0);
        const storageKey = await uploadFileToStorage(archivo, 'revisiones', setSubiendo, 'el escrito');
        setSubiendo(null);
        cuerpo = { fileName: archivo.name, storageKey, conservarOriginal, contentType: archivo.type || undefined };
      }
      setTituloDelInforme(esRecibido ? 'Documento recibido' : tipo);
      setModoDelInforme(modo);
      setOrigenDelInforme({
        fileName: cuerpo.fileName,
        fecha: new Date().toLocaleString('es-CO', { dateStyle: 'long', timeStyle: 'short' }),
        cliente: cliente.trim(),
        revisadoPor: ''
      });
      /*
       * En el modo recibido la actuación y la rama no viajan: no las eligió
       * nadie. Mandar la heredada de la barra de Redacción habría revisado un
       * auto ajeno contra la ficha del escrito que el abogado iba a redactar.
       */
      const r = await reviewApi.revisar(
        esRecibido
          ? {
              modo,
              documentType: '',
              pregunta,
              cliente: cliente.trim(),
              posicion,
              expedienteId: expedienteId || undefined,
              ...cuerpo
            }
          : { modo, documentType: tipo, legalBranch: rama, pregunta, cliente: cliente.trim(), ...cuerpo }
      );
      setParaElTaller({ texto: r.texto ?? null, conversacion: [], anotaciones: [], versiones: [], guardaTexto: Boolean(r.guardaTexto), revisionId: r.id ?? null, archivo });
      setRespuesta(r);
      onSaldoCambiado?.();
      cargarAnteriores();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'No se pudo revisar el escrito.');
    } finally {
      setOcupado(false);
      setSubiendo(null);
    }
  };

  const textoDelInforme = (): string => {
    if (!respuesta) return '';
    const r = respuesta.informeRecibido;
    if (modoDelInforme === 'DOCUMENTO_RECIBIDO') {
      if (!r) return respuesta.informeLibre ?? '';
      const bloque = (t: string, xs: string[]) => (xs.length ? `${t}\n${xs.map((x) => `- ${x}`).join('\n')}\n` : '');
      return [
        `DOCUMENTO RECIBIDO · ${origenDelInforme.fileName || 'documento'}`,
        '',
        r.queEs,
        '',
        bloque(
          'SEGÚN EL PROPIO DOCUMENTO',
          [
            r.quienLoProfirio && `Lo profirió: ${r.quienLoProfirio}`,
            r.radicado && `Radicado: ${r.radicado}`,
            r.fecha && `Fecha del documento: ${r.fecha}`
          ].filter(Boolean) as string[]
        ),
        bloque('QUÉ DECIDE U ORDENA', r.decide),
        r.cargas.length
          ? `QUÉ LE EXIGE Y PARA CUÁNDO\n${r.cargas
              .map(
                (c) =>
                  `- ${c.carga}\n  Plazo: ${c.plazo || 'el documento no anuncia plazo para esta carga'}\n  Dice: «${c.cita}»`
              )
              .join('\n')}\n`
          : 'QUÉ LE EXIGE Y PARA CUÁNDO\n- Del texto de este documento no se desprende ninguna carga a su cargo.\n',
        bloque('QUÉ QUEDA PENDIENTE, SEGÚN EL DOCUMENTO', r.loQueSigue),
        bloque('LO QUE EL DOCUMENTO NO DICE', r.noLoDiceElDocumento),
        puntosDeAtaqueDe(r).length
          ? `POR DÓNDE SE ATACA\n${puntosDeAtaqueDe(r)
              .map((p) =>
                [
                  `- ${etiquetaDeAtaque(p.clase)}`,
                  `  Dice el documento: «${p.cita}»`,
                  p.norma && p.citaDeLaNorma ? `  Norma en que él mismo se apoya, ${p.norma}: «${p.citaDeLaNorma}»` : '',
                  p.lectura ? `  Lectura del revisor: ${p.lectura}` : ''
                ]
                  .filter(Boolean)
                  .join('\n')
              )
              .join('\n')}\n`
          : '',
        'Este informe solo afirma lo que está escrito en el documento. No hay ficha verificada del catálogo detrás de ninguna de sus líneas, y los flancos señalados salen de las citas: no declaran ilegalidad ni nulidad alguna.'
      ]
        .filter((x) => x !== '')
        .join('\n');
    }
    if (!respuesta.informe) return respuesta.informeLibre ?? '';
    /*
     * NORMALIZADO, como la pantalla y el PDF: lo copiado lleva la comprobación
     * en su bloque y junto a cada hallazgo, y un informe guardado con corchetes
     * no los repite dentro del párrafo.
     */
    const normal = normalizarInforme(respuesta.informe);
    const i = normal.informe;
    const marcasEn = (seccion: SeccionDelInforme, k: number): string =>
      marcasDelHallazgo(normal.comprobaciones, seccion, k)
        .map((m) => `\n  Advertencia (${rotuloDeMarca(m)}): ${m.mensaje}`)
        .join('');
    const bloque = (t: string, xs: string[], seccion: SeccionDelInforme) =>
      xs.length ? `${t}\n${xs.map((x, k) => `- ${x}${marcasEn(seccion, k)}`).join('\n')}\n` : '';
    const banda = lineasDeLaBanda(normal);
    const pasajes = lineaDePasajes({ pasajesDelCaso: respuesta.pasajesDelCaso ?? normal.pasajesDelCaso });
    return [
      `REVISIÓN · ${tipo}`,
      pasajes ?? '',
      '',
      banda
        ? [
            banda.titulo.toUpperCase(),
            banda.cuenta.map((x) => `${x.etiqueta}: ${x.cantidad}`).join(' · '),
            banda.nota ?? '',
            ...banda.avisos,
            ...banda.noComprobadas.map((x) => `- Sin respuesta de las fuentes oficiales: ${x}`)
          ]
            .filter(Boolean)
            .join('\n') + '\n'
        : '',
      `${i.resumen}${marcasEn('resumen', 0)}`,
      '',
      bloque('SECCIONES QUE LA NORMA EXIGE Y FALTAN', i.seccionesFaltantes, 'seccionesFaltantes'),
      bloque('FORTALEZAS', i.fortalezas, 'fortalezas'),
      bloque('DEBILIDADES', i.debilidades, 'debilidades'),
      i.erroresDeAplicacion.length
        ? `ERRORES DE APLICACIÓN\n${i.erroresDeAplicacion.map((e, k) => `- ${e.donde}: ${e.problema} → ${e.correccion}${marcasEn('erroresDeAplicacion', k)}`).join('\n')}\n`
        : '',
      (i.correccionesTextuales ?? []).length
        ? `CITAS DEL ESCRITO Y REEMPLAZO PROPUESTO\n${(i.correccionesTextuales ?? []).map((c, k) => `- Dice: «${c.cita}»\n  Problema: ${c.problema}\n  Reemplazo: «${c.reemplazo}»${marcasEn('correccionesTextuales', k)}`).join('\n')}\n`
        : '',
      bloque('RECOMENDACIONES', i.recomendaciones, 'recomendaciones')
    ]
      .filter((s) => s !== '')
      .join('\n');
  };

  /*
   * A PDF Y A WORD, CON LA ESTRUCTURA DEL DIALOGO. Copiar el texto no basta:
   * el abogado guarda el informe junto al expediente o se lo manda a quien
   * redacto el escrito, y ahi tiene que verse como aqui: por secciones, con
   * la letra de la firma.
   *
   * LAS TRES FORMAS SE DESCARGAN. El informe que el revisor no devolvio
   * ordenado por secciones tambien: sale con su texto tal cual y con la nota
   * que lo explica. Hasta hoy los dos botones se quedaban apagados con un
   * «copielo», y era la unica forma de informe que la firma pagaba y no podia
   * archivar junto al expediente.
   */
  const datosParaExportar = (): DatosDeExportacion | null => {
    if (!respuesta) return null;
    const comunes = {
      documentType: tituloDelInforme,
      fileName: origenDelInforme.fileName || 'escrito',
      fecha: origenDelInforme.fecha || new Date().toLocaleDateString('es-CO', { dateStyle: 'long' }),
      caracteres: respuesta.caracteres,
      truncado: respuesta.truncado,
      conFicha: respuesta.conFicha,
      cliente: origenDelInforme.cliente || undefined,
      revisadoPor: origenDelInforme.revisadoPor || undefined
    };
    /* La misma tubería de PDF y Word para las tres formas; solo cambia el cuerpo. */
    if (modoDelInforme === 'DOCUMENTO_RECIBIDO' && respuesta.informeRecibido) {
      return { ...comunes, modo: 'DOCUMENTO_RECIBIDO', informe: respuesta.informeRecibido };
    }
    if (modoDelInforme !== 'DOCUMENTO_RECIBIDO' && respuesta.informe) return { ...comunes, informe: respuesta.informe };
    if (respuesta.informeLibre) {
      return { ...comunes, modo: 'INFORME_LIBRE', origen: modoDelInforme, texto: respuesta.informeLibre };
    }
    return null;
  };

  /** Si hay algo que exportar. Ya no exige secciones: el informe libre sale con su texto tal cual. */
  const informeOrdenado =
    modoDelInforme === 'DOCUMENTO_RECIBIDO'
      ? Boolean(respuesta?.informeRecibido || respuesta?.informeLibre)
      : Boolean(respuesta?.informe || respuesta?.informeLibre);

  const exportar = async (formato: 'pdf' | 'word') => {
    const datos = datosParaExportar();
    if (!datos || exportando) return;
    setExportando(formato);
    setError('');
    try {
      if (formato === 'pdf') await exportarInformeAPdf(datos);
      else await exportarInformeAWord(datos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo exportar el informe.');
    } finally {
      setExportando(null);
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(textoDelInforme());
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1600);
    } catch {
      setError('No se pudo copiar. Seleccione el texto y cópielo a mano.');
    }
  };

  return (
    <Dialog
      abierto={abierto}
      onCerrar={ocupado ? () => undefined : onCerrar}
      tamano="L"
      titulo="Revisar un documento"
      subtitulo={
        esRecibido
          ? `Un documento que recibió · lo que sigue sale del propio texto, citado · ${
              consentimiento?.guarda ? 'el documento y su trabajo se conservan para la firma' : 'el documento no se guarda'
            }`
          : sinActuacion
          ? 'Elija primero la actuación arriba: la revisión objetiva se hace contra su ficha.'
          : `Contra la ficha de «${tipo}» · ${consentimiento?.guarda ? 'el escrito y su trabajo se conservan para la firma' : 'el documento no se guarda'}`
      }
      hayCambiosSinGuardar={ocupado}
      onIntentoDeCerrarConCambios={() => undefined}
      pieIzquierda={
        /*
          «DESDE», NO «CUESTA». La revisión se cobra por el mayor entre el piso
          y lo que midió (`precioDeOperacion` en billing.service): un documento
          largo cuesta más que el piso, y «Cuesta $2.000» prometía un precio
          fijo que el cobro no respeta. Sin mono: un precio no es un dato que
          se cite en un escrito.
        */
        <span className="cn-inf-costo">
          {respuesta ? (
            `Cobrado ${pesos(respuesta.cobradoCop)}${Number.isFinite(respuesta.saldoCop) ? ` · saldo ${pesos(respuesta.saldoCop)}` : ''}${respuesta.guardada === false ? ' · no se pudo guardar' : ''}`
          ) : (
            <>
              Desde <span className="cn-inf-costo-cifra">{pesos(precioCop)}</span> de su saldo
            </>
          )}
        </span>
      }
      acciones={
        respuesta ? (
          <>
            <button type="button" onClick={() => setRespuesta(null)} className="cn-tal-boton cn-tal-boton--fantasma">
              Revisar otro
            </button>
            {onAbrirTaller && paraElTaller.texto && (
              <button
                type="button"
                onClick={() => {
                  onAbrirTaller({
                    revisionId: paraElTaller.revisionId,
                    documentType: tituloDelInforme,
                    legalBranch: rama || null,
                    fileName: origenDelInforme.fileName || 'escrito',
                    cliente: origenDelInforme.cliente,
                    /* El caso escogido arriba viaja al taller y de ahi al borrador. */
                    expedienteId: expedienteId || null,
                    texto: paraElTaller.texto as string,
                    informe: respuesta.informe,
                    /*
                     * EL INFORME DEL DOCUMENTO RECIBIDO TAMBIÉN VIAJA. Se
                     * quedaba aquí, y el taller —que solo conocía la forma del
                     * escrito propio— abría su pestaña «Informe» diciendo que
                     * este escrito no tiene informe, justo después de cobrarlo.
                     */
                    informeRecibido: respuesta.informeRecibido ?? null,
                    informeLibre: respuesta.informeLibre,
                    conFicha: respuesta.conFicha,
                    /* Lo mismo que la exportación de este diálogo usa: el taller descarga por la misma tubería. */
                    modo: modoDelInforme,
                    caracteres: respuesta.caracteres,
                    truncado: respuesta.truncado,
                    fechaDelInforme: origenDelInforme.fecha,
                    revisadoPor: origenDelInforme.revisadoPor || undefined,
                    guardaTexto: paraElTaller.guardaTexto,
                    conversacion: paraElTaller.conversacion,
                    anotaciones: paraElTaller.anotaciones,
                    versiones: paraElTaller.versiones,
                    /* Ya está en esta pestaña: el visor del original lo abre sin volver a bajarlo. */
                    archivoEnSesion: paraElTaller.archivo
                  });
                  onCerrar();
                }}
                className="cn-tal-boton cn-tal-boton--marca"
                title="El escrito con los pasajes marcados, para editarlo y seguir con el revisor"
              >
                <ClipboardCheck className="h-3.5 w-3.5" />
                Abrir en el taller
              </button>
            )}
            <button
              type="button"
              onClick={() => void exportar('word')}
              disabled={!informeOrdenado || exportando !== null}
              className="cn-tal-boton"
              title={informeOrdenado ? 'Descargar el informe en Word, con la letra de la firma' : 'Todavía no hay informe que descargar'}
            >
              <Download className="h-3.5 w-3.5" />
              {exportando === 'word' ? 'Word…' : 'Word'}
            </button>
            <button
              type="button"
              onClick={() => void exportar('pdf')}
              disabled={!informeOrdenado || exportando !== null}
              className="cn-tal-boton"
              title={informeOrdenado ? 'Descargar el informe en PDF, con la letra de la firma' : 'Todavía no hay informe que descargar'}
            >
              <Download className="h-3.5 w-3.5" />
              {exportando === 'pdf' ? 'PDF…' : 'PDF'}
            </button>
            <button type="button" onClick={() => void copiar()} className="cn-tal-boton cn-tal-boton--primario">
              <Copy className="h-3.5 w-3.5" />
              {copiado ? 'Copiado' : 'Copiar informe'}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onCerrar} className="cn-tal-boton cn-tal-boton--fantasma" disabled={ocupado}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={pedirRevision}
              disabled={!hayEscrito || ocupado || sinActuacion}
              className="cn-tal-boton cn-tal-boton--primario"
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
              {ocupado ? (subiendo !== null ? `Enviando · ${subiendo}%` : 'Revisando…') : 'Revisar'}
            </button>
          </>
        )
      }
    >
      {!respuesta ? (
        <div className="cara-nueva cn-inf-form">
          {/*
            LA ESPERA SE VE EN EL CUERPO, NO SOLO EN EL BOTÓN. Dice lo mismo que
            el botón —«Revisando…» o el porcentaje de la subida— y nada más: el
            diseño promete pasos y un minuto que el servidor no reporta.
          */}
          {ocupado && (
            <p className="cn-inf-espera" role="status">
              <Loader2 className="cn-inf-espera-icono animate-spin" />
              {subiendo !== null ? `Enviando · ${subiendo}%` : 'Revisando…'}
            </p>
          )}
          {/* ─── QUÉ ES LO QUE TRAE, Y VA ANTES QUE NADA ───────────────────
              Esta elección decide qué se pregunta y qué se responde, así que no
              puede ir después del archivo ni escondida: es lo primero que se ve
              al abrir. En el teléfono las dos opciones se apilan; en escritorio
              comparten fila. Cada una lleva `[overflow-wrap:anywhere]` porque
              sus descripciones traen palabras largas y un ítem flex no baja del
              ancho mínimo de su contenido. */}
          <div className="cn-inf-bloque">
            <p className="cn-inf-etiqueta">Qué trae</p>
            <div className="cn-inf-modos">
              {(
                [
                  {
                    valor: 'ESCRITO_PROPIO' as ModoDeRevision,
                    titulo: 'Un escrito mío, que voy a presentar',
                    detalle: 'Una tutela, una demanda, un recurso. Se revisa contra la ficha verificada de su actuación: qué le falta, qué está mal aplicado, qué corregiría antes de radicar.'
                  },
                  {
                    valor: 'DOCUMENTO_RECIBIDO' as ModoDeRevision,
                    titulo: 'Un documento que recibí',
                    detalle: 'Un auto, una sentencia, un oficio, una notificación. No hay que decir qué actuación es: se le explica qué dice, qué le exige y para cuándo, citando el propio documento.'
                  }
                ] as const
              ).map((o) => (
                <button
                  key={o.valor}
                  type="button"
                  onClick={() => cambiarModo(o.valor)}
                  aria-pressed={modo === o.valor}
                  className="cn-inf-modo"
                >
                  <span className="cn-inf-modo-titulo">{o.titulo}</span>
                  <span className="cn-inf-modo-detalle">{o.detalle}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ─── A QUIÉN REPRESENTA, Y SOLO EN EL MODO RECIBIDO ──────────── */}
          {/*
            Sobre un escrito PROPIO no tiene sentido: el autor es él y no hay a
            quién atribuirle nada. Sobre uno RECIBIDO lo cambia todo — sin esta
            respuesta, un auto que ordena al demandante subsanar en cinco días
            se le publicaba al apoderado del demandado bajo el rótulo «qué le
            exige y para cuándo».

            NO ES OBLIGATORIO, y por eso el valor por defecto es no decirlo. Un
            campo obligatorio aquí frenaría la lectura del auto —que es lo que
            el abogado vino a hacer— por un dato que solo mejora un aviso.
          */}
          {/*
            EL DOCUMENTO QUE VENIA DE ORIENTACION Y NO CUPO. Solo se dice
            cuando traia nombre: eso prueba que hubo un archivo. Por la puerta
            «Me llego un documento» de Inicio no hay archivo todavia, y
            avisarle de que «no cupo» seria inventarle una perdida.
          */}
          {documentoTraido && !documentoTraido.completo && documentoTraido.nombre && (
            <p className="cn-inf-aviso" role="status">
              <AlertTriangle className="cn-inf-aviso-icono" />
              <span className="min-w-0 text-justify [overflow-wrap:anywhere]">
                «{documentoTraido.nombre}» es demasiado largo para traerlo desde Orientación. El modo ya está
                escogido: vuelva a adjuntarlo aquí.
              </span>
            </p>
          )}

          {/* ─── DE QUÉ CASO ES ──────────────────────────────────────────
            Va ENCIMA de la posición porque es lo que la deduce: escoger el
            caso contesta la pregunta de abajo sin que nadie la responda.

            Solo se pinta si la firma tiene expedientes. Con la cara nueva: el
            selector compartido la trae detrás de `cara="nueva"`, para no
            cambiarles la pantalla a la agenda, el triaje ni las audiencias. */}
          {esRecibido && (
            <SelectorDeExpediente
              cara="nueva"
              valor={expedienteId}
              onCambio={(id) => void eligeExpediente(id)}
              id="expediente-de-la-revision"
              pie="La lectura queda guardada dentro del caso, y si el expediente ya sabe a quién representa usted, lo de abajo se llena solo."
            />
          )}

          {esRecibido && (
            <div className="cn-inf-bloque">
              <SelectorDelFormulario
                id="posicion-procesal"
                etiqueta="A quién representa en este proceso"
                valor={posicion}
                opciones={opcionesPosicion}
                conBusqueda={false}
                onChange={(v) => {
                  setPosicion(v as PapelEnElExpediente);
                  /* Escogida a mano: cambiar de caso ya no la pisa. */
                  setPosicionDeducida(false);
                }}
              />
              <p className="cn-inf-ayuda">
                {posicionDeducida
                  ? 'Tomado del expediente, de quien registró como su cliente. Cámbielo si no es así.'
                  : 'Con esto, el informe separa las cargas que son suyas de las que el documento le impone a la otra parte. Sin esto las muestra todas sin decir de quién son.'}
              </p>
            </div>
          )}

          {/* ─── EL ESCRITO: archivo o texto ─────────────────────────────── */}
          <div className="cn-inf-bloque">
            <p className="cn-inf-etiqueta">
              {esRecibido ? 'El documento que recibió' : 'El escrito'}
            </p>
            {archivo ? (
              <div className="cn-inf-archivo">
                <FileText className="h-5 w-5 shrink-0 text-ink-500" />
                <span className="cn-inf-archivo-nombre">{archivo.name}</span>
                <span className="cn-inf-precio shrink-0">{(archivo.size / 1024).toFixed(0)} KB</span>
                <button
                  type="button"
                  onClick={() => {
                    /* Otro archivo son otros hechos: lo leído del anterior no puede sobrevivirle. */
                    setArchivo(null);
                    setAvisoDeLectura('');
                    archivoLeido.current = null;
                  }}
                  className="cn-tal-icono-boton"
                  aria-label="Quitar archivo"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                {/* Sin borde discontinuo: en esta casa el guion es solo de «sin verificar», y una zona de subir no lo es. */}
                <label className="cn-inf-subir">
                  <input type="file" accept=".pdf,.docx,.doc,.txt" onChange={elegirArchivo} className="hidden" />
                  <UploadCloud className="cn-inf-subir-icono" />
                  <span className="min-w-0 flex-1">
                    <span className="cn-inf-etiqueta">Subir PDF, Word o texto</span>
                    <span className="cn-inf-ayuda block">Hasta 15 MB, con anexos.</span>
                  </span>
                </label>
                <p className="cn-inf-o">o pegue el texto</p>
                {/*
                  AQUI VA EL DOCUMENTO ENTERO, NO LA PREGUNTA, y el marcador de
                  posicion tiene que decirlo con esas palabras. Es la
                  alternativa a subir el archivo —para el PDF escaneado, que no
                  trae texto— y debajo, mas abajo en el formulario, vive «Que
                  quiere saber», que si es la pregunta. Dos cuadros grandes y
                  seguidos se confunden: un abogado leyo «pegue aqui el texto»
                  y pregunto si era el escrito o el encargo.

                  Y en el modo recibido no se dice «el escrito»: el auto del
                  juez no es un escrito suyo, y llamarlo asi contradice al
                  rotulo que esta justo encima.
                */}
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  rows={6}
                  placeholder={
                    esRecibido
                      ? 'Pegue aquí el texto completo del documento que recibió — el auto, la sentencia, el oficio. No la pregunta: ésa va más abajo.'
                      : 'Pegue aquí el texto completo de su escrito. No la pregunta: ésa va más abajo.'
                  }
                  className="cn-inf-campo resize-y"
                />
              </>
            )}
            <p className="cn-inf-ayuda">
              {/* Sin «unas 75 páginas»: la plataforma solo conoce caracteres, y una cuenta de páginas sería una estimación con cara de dato. */}
              Un PDF escaneado no trae texto: si el archivo es una imagen, pegue el texto. Se revisan hasta 300.000 caracteres; lo que pase de ahí se
              declara recortado.
            </p>
          </div>

          {/* ─── QUÉ ACTUACIÓN ES ─────────────────────────────────────────────
              Solo cuando no se heredó. Va DESPUÉS del escrito y no antes,
              porque ese es el orden real de quien revisa: primero tiene el
              documento en la mano, y solo entonces puede decirse —o
              preguntarse— cómo se llama. Al revés era el defecto que se
              reportó: había que saber la actuación antes de poder subir nada.

              EN EL TELÉFONO LOS DOS SELECTORES SE APILAN. Son dos controles con
              nombres largos («Superintendencias (SIC, Salud, Financiera,
              SSPD)») y un ítem flex no baja del ancho mínimo de su contenido:
              en una fila a 320px el segundo quedaría fuera. Cada uno va
              envuelto en `min-w-0 flex-1` para que encoja de verdad, y el botón
              trunca con su nombre completo en el `title`. */}
          {/*
            EL BLOQUE ENTERO DESAPARECE CON «un documento que recibí», y esa es
            la corrección de fondo: no se esconde detrás de un valor por
            defecto ni se deja opcional. Quien acaba de recibir un auto no sabe
            —ni tiene por qué saber— cómo se llama en el catálogo.
          */}
          {eligeActuacion && !esRecibido && (
            <div className="cn-inf-bloque">
              <p className="cn-inf-etiqueta">Qué actuación es</p>
              <p className="cn-inf-ayuda">
                La revisión objetiva se hace contra la ficha verificada de la actuación: por eso hay que decir cuál es. Si no lo sabe
                —que es lo normal cuando el escrito viene de otro—, la guía la propone leyendo el archivo, con el término, el artículo y
                la autoridad a la vista, y usted escoge.
              </p>
              {/*
                UNO DEBAJO DEL OTRO, también en escritorio. Las listas se abren
                en línea, empujando lo de abajo: en dos columnas, la lista de la
                rama abría un hueco bajo la actuación y la dejaba colgando.
              */}
              <div className="mt-2 grid gap-3">
                <div className="min-w-0">
                  <SelectorDelFormulario
                    id="rama-de-la-revision"
                    etiqueta="Rama"
                    valor={rama}
                    opciones={opcionesRama}
                    onChange={(v) => {
                      setRamaPropia(v);
                      /* Una actuación no sobrevive a su rama: la del catálogo anterior no está en esta. */
                      setTipoPropio('');
                    }}
                    vacio="Elegir rama…"
                    cargando={ramasEstado.estado === 'CARGANDO'}
                    pie={
                      ramasEstado.estado === 'ERROR'
                        ? 'No se pudo leer el catálogo. Revise la conexión y vuelva a intentarlo.'
                        : ramasEstado.estado === 'CARGANDO'
                        ? 'Consultando las ramas del catálogo…'
                        : `${ramasEstado.ramas.length} ramas. La rama decide qué actuaciones se ofrecen y con qué término.`
                    }
                  />
                </div>
                <div className="min-w-0">
                  <SelectorDelFormulario
                    id="actuacion-de-la-revision"
                    etiqueta="Actuación"
                    valor={tipo}
                    opciones={opcionesTipo}
                    onChange={setTipoPropio}
                    vacio={rama ? 'Elegir actuación…' : 'Elija primero la rama'}
                    cargando={Boolean(rama) && catalogoDeLaRama.estado === 'CARGANDO'}
                    pie={
                      !rama
                        ? 'Sin rama no hay lista: cada rama tiene su propio catálogo.'
                        : catalogoDeLaRama.estado === 'CARGANDO'
                        ? 'Consultando el catálogo de esta rama…'
                        : catalogoDeLaRama.estado === 'LISTA'
                        ? `${catalogoDeLaRama.nombres.length} actuaciones en esta rama, con el término de cada una.`
                        : 'Esta rama aún no tiene catálogo verificado.'
                    }
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => void pedirLaGuia()}
                disabled={!rama || !hayEscrito || leyendoArchivo}
                className="cn-inf-guia"
              >
                {leyendoArchivo ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-700" />
                ) : (
                  <Sparkles className="h-4 w-4 shrink-0 text-brand-700" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="cn-inf-guia-titulo">
                    {leyendoArchivo ? 'Leyendo el escrito…' : 'Que la guía diga qué actuación es'}
                  </span>
                  <span className="cn-inf-ayuda block">
                    Lee el archivo en su navegador —no lo sube, no cuesta nada— y propone candidatas del catálogo con su ficha.
                  </span>
                </span>
              </button>

              {!rama && (
                <p className="cn-inf-ayuda">
                  Elija la rama para poder pedirle la propuesta a la guía: el catálogo propone dentro de una rama, nunca a ciegas.
                </p>
              )}
              {rama && !hayEscrito && (
                <p className="cn-inf-ayuda">
                  Suba el archivo o pegue el texto: la guía propone sobre lo que dice el escrito, no sobre suposiciones.
                </p>
              )}
              {avisoDeLectura && (
                <p className="cn-inf-nota">
                  {avisoDeLectura} Mientras tanto, la actuación se puede elegir a mano en la lista de arriba.
                </p>
              )}
            </div>
          )}

          {/* ─── DE QUIÉN ES EL ESCRITO ───────────────────────────────────── */}
          <div className="cn-inf-bloque">
            <label htmlFor="cliente-revision" className="cn-inf-etiqueta">
              Cliente o proceso
            </label>
            {/*
              EL EJEMPLO ES UN MOLDE, NO UN CASO. Traía un nombre, una EPS y un
              radicado verosímiles: README-app §3 pide que todo ejemplo se lea
              como relleno a primera vista.
            */}
            <input
              id="cliente-revision"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              maxLength={160}
              placeholder="Nombre del cliente · asunto · rad. 00000-00-00-000-0000-00000-00"
              className="cn-inf-campo"
            />
            <p className="cn-inf-ayuda">
              Para saber de qué asunto es cuando vuelva a la lista. Queda también en el PDF y el Word del informe.
            </p>
          </div>

          {/* ─── LA PREGUNTA ─────────────────────────────────────────────────
              «QUE QUIERE SABER» SE LEIA COMO UN REQUISITO, y no lo es. El
              rotulo, a secas y sobre un cuadro grande, sugiere que si uno no
              escribe nada no se revisa nada; un abogado lo pregunto con esas
              palabras. La verdad es la contraria: el informe trae SIEMPRE sus
              secciones —que es, que decide, que le exige, que queda pendiente,
              por donde se ataca— y este cuadro solo dirige el enfasis. Vacio,
              el servidor pone su propia pregunta y el informe sale igual.

              Asi que el rotulo dice que es opcional y la linea de abajo dice
              que hace, en vez de dejar que cada quien lo adivine. */}
          <div className="cn-inf-bloque">
            <label htmlFor="pregunta-revision" className="cn-inf-etiqueta">
              Qué quiere saber <span className="cn-inf-opcional">· opcional</span>
            </label>
            <p className="cn-inf-ayuda">
              {esRecibido
                ? 'El informe trae siempre lo mismo: qué es el documento, qué decide, qué le exige y para cuándo, qué queda pendiente y por dónde se ataca. Esto solo dirige el énfasis; si lo deja vacío, se revisa el documento completo igual.'
                : 'El informe trae siempre lo mismo: qué exige la ficha de la actuación, qué falta y qué corregiría. Esto solo dirige el énfasis; si lo deja vacío, se revisa el escrito completo igual.'}
            </p>
            <textarea
              id="pregunta-revision"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              rows={2}
              className="cn-inf-campo resize-none"
            />
            <div className="cn-inf-sugerencias">
              {SUGERENCIAS[modo].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPregunta(s)}
                  aria-pressed={pregunta === s}
                  className="cn-inf-sugerencia"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/*
            POR QUE EL BOTON ESTA APAGADO, escrito junto a lo que falta. El
            usuario adjunto el PDF, escribio la pregunta y el boton siguio gris:
            faltaba la actuacion, que se elige ARRIBA, fuera del dialogo, y el
            subtitulo que lo decia paso inadvertido. Un boton mudo se lee como
            un defecto; un boton que dice que le falta se obedece.
          */}
          {!error && sinActuacion && (
            <p className="cn-inf-nota">
              <span className="cn-inf-seleccionado">Falta elegir la actuación.</span>{' '}
              {eligeActuacion
                ? 'Está aquí mismo, en «Qué actuación es»: elíjala de la lista o pídale a la guía que la proponga leyendo el escrito. La revisión objetiva se hace contra la ficha verificada de esa actuación; sin ella no hay contra qué revisar.'
                : 'Está en la barra de arriba, en «Elegir actuación…», después de la rama. La revisión objetiva se hace contra la ficha verificada de esa actuación; sin ella no hay contra qué revisar.'}
            </p>
          )}
          {!error && !sinActuacion && !hayEscrito && (
            <p className="cn-inf-ayuda">
              {esRecibido ? 'Suba el documento o pegue su texto: no hace falta nada más.' : 'Suba el archivo o pegue el texto para habilitar el botón.'}
            </p>
          )}
          {error && (
            <p className="cn-error" role="alert">
              <AlertTriangle className="h-4 w-4" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{error}</span>
            </p>
          )}

          <p className="cn-inf-ayuda">
            {esRecibido
              ? 'El informe solo afirma lo que está escrito en el documento y lo dice citándolo: ni un artículo, ni un plazo, ni una autoridad de memoria. Si el documento no anuncia plazo, se lo dirá con esas palabras. Qué actuación procede lo responde después la guía del catálogo. El informe se guarda para su firma.'
              : 'El informe no cita sentencias: cuando un punto necesite precedente, lo dirá y usted lo verifica. No reescribe el escrito; señala y propone la corrección. El informe se guarda para su firma; el escrito no.'}
          </p>

          {anteriores.length > 0 && (
            <div className="cn-inf-anteriores">
              <p className="cn-inf-etiqueta flex items-center gap-2">
                <History className="h-4 w-4 text-ink-500" />
                Revisiones anteriores de la firma
              </p>
              <ul className="cn-inf-anteriores-lista">
                {anteriores.map((r) => (
                  <li key={r.id} className="cn-inf-anterior">
                    <button
                      type="button"
                      onClick={() => void abrirAnterior(r)}
                      disabled={abriendo !== null}
                      className="cn-inf-anterior-abrir"
                      title="Abrir el informe"
                    >
                      <span className="cn-inf-linea">
                        {r.cliente ? <span className="cn-inf-seleccionado">{r.cliente}</span> : <span className="text-ink-500">Sin cliente indicado</span>}
                        <span className="text-ink-500"> · {r.documentType}</span>
                      </span>
                      <span className="cn-inf-linea cn-inf-linea--meta">
                        {r.fileName} · {new Date(r.createdAt).toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} ·
                        revisión pedida por {r.userEmail}
                        {abriendo === r.id ? ' · abriendo…' : ''}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmacion({
                          titulo: 'Eliminar la revisión',
                          texto: (
                            <span className="cn-inf-dialogo-texto">
                              <span>Se elimina el informe de «{r.fileName}» y, si se guardó, su texto de trabajo y su conversación. No se puede recuperar.</span>
                            </span>
                          ),
                          etiqueta: 'Eliminar',
                          peligro: true,
                          onConfirmar: () => eliminarAnterior(r)
                        })
                      }
                      className="cn-tal-icono-boton cn-inf-borrar"
                      aria-label={`Eliminar el informe de ${r.fileName}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="cara-nueva cn-inf" data-informe>
          {/* Al abogado sin autoridad se le dice qué no se conserva y a quién pedirlo; nunca se le impide revisar. */}
          {!paraElTaller.guardaTexto && !puedeAutorizar && firmaSinDecidir && (
            <div className="cn-inf-aviso" role="status">
              <AlertTriangle className="cn-inf-aviso-icono" />
              <span>
                Su trabajo en el taller no se conserva porque la firma aún no ha autorizado guardar escritos. Pida a su administrador activarlo en
                Revisiones.
              </span>
            </div>
          )}
          <Informe
            respuesta={respuesta}
            documentType={tituloDelInforme}
            modo={modoDelInforme}
            fileName={origenDelInforme.fileName}
            /*
             * EL PIE DEL DOCUMENTO RECIBIDO ES UNA PIEZA, NO UN FRAGMENTO. La
             * misma que monta el taller, con su rama, su guía y su salto a
             * Redacción. Lo que viaja de aquí es solo el material: el texto del
             * documento —el conservado si lo hay, si no el que se acaba de
             * pegar— y la rama con la que se abrió el diálogo.
             */
            textoDelDocumento={paraElTaller.texto ?? texto.trim()}
            ramaInicial={legalBranch}
            userRole={userRole}
            onRedactar={
              onRedactar
                ? (exactName, ramaElegida, hechosDelDocumento, instruccion) => {
                    /* Redacción es otra pantalla: este diálogo se cierra o taparía el borrador. */
                    onCerrar();
                    onRedactar(exactName, ramaElegida, hechosDelDocumento, instruccion);
                  }
                : undefined
            }
          />
        </div>
      )}
      <Dialog
        abierto={preguntaDeGuardado}
        onCerrar={() => {
          /* Cerrar sin decidir no bloquea: se revisa igual y la pregunta vuelve la próxima vez. */
          setPreguntaDeGuardado(false);
          void revisar();
        }}
        tamano="S"
        titulo="¿Conservar el escrito y su trabajo?"
        subtitulo="Se decide una vez, para toda la firma; puede cambiarlo en «Revisiones»."
        acciones={
          <>
            <button type="button" onClick={() => void decidirGuardado(false)} className="cn-tal-boton cn-tal-boton--fantasma">
              Solo el informe
            </button>
            <button type="button" onClick={() => void decidirGuardado(true)} className="cn-tal-boton cn-tal-boton--primario">
              Sí, conservar
            </button>
          </>
        }
      >
        <div className="cara-nueva cn-inf-dialogo-texto">
          <p>
            Con <span className="cn-inf-seleccionado">«Sí, conservar»</span> (recomendado) la firma guarda el texto del escrito,{' '}
            <span className="cn-inf-seleccionado">el archivo tal como usted lo sube</span> —para volver a verlo con su diagramación, sus negritas y sus
            tablas—, la conversación con la guía, los comentarios y las versiones: nada se pierde al cerrar.
          </p>
          <p>
            Con <span className="cn-inf-seleccionado">«Solo el informe»</span> se conserva únicamente el informe. El archivo y el trabajo del taller solo
            viven en esta pestaña: al cerrarla, para volver a ver el documento tal cual habrá que subirlo otra vez.
          </p>
        </div>
      </Dialog>
      {/*
        LOS DOS DIÁLOGOS DE LA ACTUACIÓN CUELGAN DE AQUÍ, y solo existen cuando
        este diálogo es el que elige. Es el MISMO componente que usa la barra de
        Redacción: las candidatas se pintan con su ficha —término, artículo,
        autoridad— y quien elige es una persona. Lo único distinto son los
        hechos: allá los escribe el abogado, aquí salen del texto del escrito
        que acaba de adjuntar.
      */}
      {eligeActuacion && (
        <>
          <GuiaEligeActuacionDialog
            abierto={guiaAbierta}
            onCerrar={() => setGuiaAbierta(false)}
            legalBranch={ramaDeLaGuia}
            hechos={hechos}
            setHechos={setHechos}
            onElegir={(exactName, branch) => {
              /*
               * LA RAMA QUE MANDA ES LA DE LA CANDIDATA, NO LA DEL SELECTOR.
               *
               * Desde que la guía puede buscar en todo el catálogo, la
               * actuación que propone puede vivir en otra rama. Quedándose solo
               * con el nombre pasaba esto: la petición viajaba con la rama que
               * el abogado había elegido al principio, el servidor buscaba la
               * ficha SOLO dentro de esa rama, no la encontraba, y la revisión
               * salía rotulada «sin ficha verificada» — ya cobrada. Y antes de
               * eso el síntoma desconcertaba: el selector se quedaba en gris
               * con «Elegir actuación…», porque el nombre no está en la lista
               * de esa rama, mientras el botón de revisar sí se encendía.
               *
               * El puente del informe ya lo resolvía así; aquí se había quedado
               * el descuido viejo.
               */
              if (branch) setRamaPropia(branch);
              setTipoPropio(exactName);
              setGuiaAbierta(false);
            }}
            onEscribirNombre={() => {
              setGuiaAbierta(false);
              setPropiaAbierta(true);
            }}
          />
          <ActuacionPropiaDialog
            abierto={propiaAbierta}
            onCerrar={() => setPropiaAbierta(false)}
            legalBranch={ramaDeLaGuia}
            userRole={userRole}
            onCreada={(exactName) => {
              /* Primero la lista de nuevo, después la elección: al revés, el selector no la encontraría. */
              setRecargaCatalogo((n) => n + 1);
              setTipoPropio(exactName);
              setPropiaAbierta(false);
            }}
          />
        </>
      )}
      <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
    </Dialog>
  );
};

/* ─── EL INFORME ──────────────────────────────────────────────────────────── */

/*
 * Las secciones del escrito propio se pintan con `SeccionConMarcas`
 * (`ComprobacionAutomatica.tsx`): la misma lista con viñetas de
 * `SeccionDeInforme`, más la marca de la comprobación automática debajo de
 * cada hallazgo afectado.
 */

interface InformeProps {
  respuesta: RespuestaDeRevision;
  documentType: string;
  /** Cuál de los dos se leyó. La pantalla lo ROTULA: no se deduce de la forma del informe. */
  modo: ModoDeRevision;
  fileName: string;
  /** El texto del documento recibido, para que el pie se lo cuente a la guía. */
  textoDelDocumento: string;
  /** Con qué rama nace el selector del pie. */
  ramaInicial: string;
  userRole: ActuacionRole;
  onRedactar?: (exactName: string, rama: string, hechos: string, instruccion: string) => void;
}

const Informe: React.FC<InformeProps> = ({
  respuesta,
  documentType,
  modo,
  fileName,
  textoDelDocumento,
  ramaInicial,
  userRole,
  onRedactar
}) => {
  const esRecibido = modo === 'DOCUMENTO_RECIBIDO';
  /*
   * EL INFORME SE NORMALIZA: la comprobación automática llega como dato desde
   * el 14 de septiembre de 2026, y un informe guardado antes la trae dentro del
   * texto. Las dos formas se dibujan igual —banda arriba, marca junto al
   * hallazgo— y ninguna advertencia se ve dos veces.
   */
  const normal = respuesta.informe ? normalizarInforme(respuesta.informe) : null;
  const r = respuesta.informeRecibido ?? null;
  return (
    <>
      {/*
        EL RÓTULO DICE CUÁL DE LOS DOS SE LEYÓ, y no es decorativo: un informe
        de un documento recibido que se confundiera con la revisión de un
        escrito propio se leería como si el catálogo respaldara sus plazos. Sin
        ficha lleva el borde discontinuo: es un grado de respaldo, no un error.
      */}
      <div className="cn-inf-sellos">
        <span className={`cn-inf-sello ${esRecibido ? 'cn-inf-sello--neutro' : respuesta.conFicha ? 'cn-inf-sello--ok' : 'cn-inf-sello--sin'}`}>
          {esRecibido
            ? `Documento recibido · ${fileName || 'sin nombre'}`
            : respuesta.conFicha
            ? `Revisado contra la ficha de «${documentType}»`
            : 'Sin ficha verificada: lo objetivo va con menos respaldo'}
        </span>
        <span className="cn-inf-sello cn-inf-sello--neutro">
          {respuesta.caracteres.toLocaleString('es-CO')} caracteres{respuesta.truncado ? ' · recortado a 300.000' : ''}
        </span>
      </div>

      {esRecibido ? (
        !r ? (
          <>
            <p className="cn-inf-aviso">
              La lectura no se pudo ordenar por secciones; abajo está el texto completo. El cobro es el mismo y el contenido también.
            </p>
            <pre className="cn-inf-libre">{respuesta.informeLibre}</pre>
          </>
        ) : (
          <LecturaDelDocumentoRecibido
            informe={r}
            pie={
              <PuenteAlAtaque
                key={fileName}
                informe={r}
                textoDelDocumento={textoDelDocumento}
                ramaInicial={ramaInicial}
                userRole={userRole}
                onRedactar={onRedactar}
              />
            }
          />
        )
      ) : !normal ? (
        <>
          {lineaDePasajes({ pasajesDelCaso: respuesta.pasajesDelCaso ?? null }) && (
            <p className="cn-inf-pasajes">{lineaDePasajes({ pasajesDelCaso: respuesta.pasajesDelCaso ?? null })}</p>
          )}
          <p className="cn-inf-aviso">
            El revisor respondió en un formato que no se pudo ordenar por secciones; abajo está su texto completo. El cobro
            es el mismo y el contenido también.
          </p>
          <pre className="cn-inf-libre">{respuesta.informeLibre}</pre>
        </>
      ) : (
        /*
          LOS DOS ESTRATOS, EN LA PIEZA QUE COMPARTE CON EL TALLER. Las
          correcciones van completas: lo que dice el escrito, el problema y la
          redacción propuesta, lista para pegar. La marca va sobre el problema,
          nunca dentro de la cita del abogado.
        */
        <InformeDelEscritoPropio
          normal={normal}
          pasajesDelCaso={respuesta.pasajesDelCaso ?? normal.pasajesDelCaso}
          correcciones="completas"
          conFicha={respuesta.conFicha}
        />
      )}

      <p className="cn-inf-pie">
        {esRecibido
          ? 'Todo lo anterior sale del texto del propio documento y va citado. Ninguna ficha del catálogo respalda estas líneas: no se ha completado de memoria ningún artículo, plazo, autoridad ni recurso, y los flancos señalados no declaran ilegalidad ni nulidad alguna. El informe queda guardado para su firma en «Revisiones anteriores».'
          : 'Lo marcado como exigencia de la norma sale de la ficha verificada; lo demás es criterio profesional del revisor y usted decide. El informe queda guardado para su firma en «Revisiones anteriores»; el escrito y el trabajo del taller, solo si la firma autorizó conservarlos.'}
      </p>
    </>
  );
};

/* ─── LO QUE EL ABOGADO LEE CUANDO SUBE UN AUTO DE UN JUEZ ──────────────────
 *
 * Se pinta con `LecturaDelDocumentoRecibido` y su pie es `PuenteAlAtaque`. Los
 * dos son componentes propios y los monta también el taller: mientras el pie
 * fue un fragmento privado de este archivo, el botón que lleva a la guía de
 * actuaciones existía SOLO aquí, y el taller —donde el abogado vuelve a leer el
 * informe días después— no tenía ninguna salida. Por eso no queda aquí ninguna
 * copia que pueda divergir.
 */