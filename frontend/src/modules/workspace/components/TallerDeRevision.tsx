import React from 'react';
import type { FormatoDelEscrito } from '../../documents/formatoEnPantalla';
import { reviewApi, type Anotacion, type ConsentimientoDeGuardado, type InformeDeDocumentoRecibido, type InformeDeRevision, type ModoDeRevision, type PreguntasAudienciaGuardadas, type TurnoDelTaller, type VersionDelTexto } from '../services/review.api';
import { exportarInformeAPdf, exportarInformeAWord } from '../services/informeExport.service';
import type { DatosDeExportacion } from '../services/informeLayout';
import { exportarPreguntasAPdf, exportarPreguntasAWord } from '../services/preguntasExport.service';
import { TallerDeEscrito } from './TallerDeEscrito';
import { PuenteAlAtaque } from './PuenteAlAtaque';
import type { ActuacionRole } from '../../catalog/types';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { usePlan, usePlanSoloLectura } from '../../subscriptions/PlanContext';

/**
 * El taller sobre un escrito REVISADO: el genérico (TallerDeEscrito) con lo
 * que la revisión aporta — el informe, el chat con id, «Volver a revisar» y la
 * regla de guardado de la firma.
 *
 * ─── DÓNDE VIVE EL TEXTO ────────────────────────────────────────────────────
 *
 * En el navegador siempre; en el servidor solo si la firma lo autorizó. La
 * cinta lo dice sin rodeos, porque «se guarda solo» y «se pierde al cerrar»
 * son dos productos distintos y el abogado tiene que saber en cuál está. Un
 * socio administrador puede autorizarlo desde aquí mismo; queda en la
 * auditoría con su correo.
 */

export interface DatosDelTaller {
  revisionId: string | null;
  documentType: string;
  /** La rama con que se revisó; viaja al borrador cuando el escrito se lleva a Redacción. */
  legalBranch: string | null;
  fileName: string;
  cliente: string;
  texto: string;
  informe: InformeDeRevision | null;
  /**
   * El informe cuando lo revisado fue un DOCUMENTO RECIBIDO. Vive en la misma
   * columna del servidor y se distingue por su FORMA, así que son dos campos
   * distintos aquí: quien reciba estos datos no tiene que adivinar cuál llegó.
   */
  informeRecibido?: InformeDeDocumentoRecibido | null;
  informeLibre: string | null;
  conFicha: boolean;
  /*
   * ─── LO QUE EL INFORME NECESITA PARA SALIR EN PAPEL ───────────────────────
   *
   * La cabecera del Word y del PDF lleva la fecha de la revisión, quién la
   * pidió, si el escrito se recortó y en qué modo se leyó. Son OPCIONALES
   * porque el taller de un borrador no tiene nada de esto y porque un dato
   * ausente se declara —la exportación escribe la fecha de hoy y omite el
   * resto— antes que inventarse un autor o una fecha.
   */
  /** Cuál de los dos se leyó. Cuando falta, se deduce de la forma del informe. */
  modo?: ModoDeRevision;
  /** Cuántos caracteres tenía el escrito y si se recortó a 300.000. */
  caracteres?: number;
  truncado?: boolean;
  /** Cuándo se emitió el informe, ya formateado por quien abre el taller. */
  fechaDelInforme?: string;
  /** Correo de quien pidió la revisión. */
  revisadoPor?: string;
  guardaTexto: boolean;
  conversacion: TurnoDelTaller[];
  anotaciones?: Anotacion[];
  versiones?: VersionDelTexto[];
  /** Si quien abre el taller ya las tiene; si falta, el taller las pide al servidor. */
  preguntasAudiencia?: PreguntasAudienciaGuardadas | null;
  /**
   * El archivo tal como se subió, cuando todavía está en esta pestaña: quien
   * acaba de pedir la revisión lo tiene en memoria y el visor lo abre sin
   * volver a bajarlo. Si falta, se le pregunta al servidor por la revisión.
   */
  archivoEnSesion?: File | null;
}

interface TallerDeRevisionProps {
  datos: DatosDelTaller;
  esAdminDeFirma: boolean;
  precioConsultaCop: number;
  precioRevisionCop: number;
  onCerrar: () => void;
  onSaldoCambiado: () => void;
  onExportarTexto: (formato: 'pdf' | 'word', titulo: string, texto: string) => void;
  /**
   * Guarda el texto del taller como borrador de la firma y abre Redacción con
   * él. Recibe el texto tal como está; el título, la rama y la actuación los
   * pone quien lo implementa a partir de `datos`.
   */
  onLlevarARedaccion: (texto: string) => Promise<void>;
  formatoDeFirma?: FormatoDelEscrito | null;
  /** Quién firma. Solo para poder escribir una actuación propia de la firma desde el pie. */
  userRole: ActuacionRole;
  /**
   * De un documento recibido a un borrador empezado: la actuación que el
   * abogado escogió en el catálogo, su rama, los hechos y la instrucción.
   *
   * ES OTRO CAMINO QUE «LLEVAR A REDACCIÓN». Aquel copia el texto del taller
   * como borrador; este abre Redacción para escribir el escrito que ATACA lo
   * leído, que es una actuación distinta y no una copia de nada.
   */
  onRedactarActuacion?: (exactName: string, rama: string, hechos: string, instruccion: string) => void;
}

export const TallerDeRevision: React.FC<TallerDeRevisionProps> = ({
  datos,
  esAdminDeFirma,
  precioConsultaCop,
  precioRevisionCop,
  onCerrar,
  onSaldoCambiado,
  onExportarTexto,
  onLlevarARedaccion,
  formatoDeFirma,
  userRole,
  onRedactarActuacion
}) => {
  /* Con el plan vencido el servidor rechaza crear borradores; el botón lo dice en vez de fallar al pulsarlo. */
  const soloLectura = usePlanSoloLectura();
  const [consentimiento, setConsentimiento] = React.useState<ConsentimientoDeGuardado>({ guarda: datos.guardaTexto, por: null, el: null });
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
  /*
   * El archivo en esta pestaña. Empieza siendo el que se acaba de subir y se
   * reemplaza si el abogado abre otro desde el visor: se guarda aquí para que
   * cambiar de pestaña y volver no obligue a bajarlo de nuevo.
   */
  const [archivoDeLaSesion, setArchivoDeLaSesion] = React.useState<File | null>(datos.archivoEnSesion ?? null);
  const [errorAutorizacion, setErrorAutorizacion] = React.useState('');
  /** Lo último que el taller tenía, para guardarlo en el acto cuando la firma autoriza. */
  const ultimoEstado = React.useRef<{ texto: string; conversacion: TurnoDelTaller[]; anotaciones: Anotacion[]; versiones: VersionDelTexto[] }>({
    texto: datos.texto,
    conversacion: datos.conversacion,
    anotaciones: datos.anotaciones ?? [],
    versiones: datos.versiones ?? []
  });

  const guardaEnServidor = consentimiento.guarda && datos.revisionId !== null;

  /*
   * ─── QUÉ SE LEYÓ: UN ESCRITO PROPIO O UN DOCUMENTO QUE LLEGÓ ──────────────
   *
   * Una condición con NOMBRE, no un `if` mudo repetido: de ella cuelgan la
   * cabecera del informe descargado, la pestaña «Audiencia» y el pie del
   * puente al ataque, y las tres tienen que decidir lo mismo.
   *
   * El modo viaja cuando quien abre el taller lo sabe; si no, se deduce de la
   * FORMA del informe, que es como el resto del módulo lo distingue. La forma
   * sola no basta: un documento recibido cuyo revisor no devolvió secciones
   * llega como informe libre y seguiría pareciendo un escrito propio.
   */
  const esDocumentoRecibido = datos.modo === 'DOCUMENTO_RECIBIDO' || datos.informeRecibido != null;

  /*
   * DESCARGAR EL INFORME DESDE EL TALLER, por la misma tubería del diálogo.
   * `informeLayout` arma el papel y `informeExport` lo descarga; aquí solo se
   * reúnen los datos, con el informe VIGENTE que el taller entrega —el que
   * dejó «Volver a revisar», si se volvió a revisar—.
   */
  const descargarInforme = async (formato: 'pdf' | 'word', vigente: { informe: InformeDeRevision | null; informeLibre: string | null }) => {
    const comunes = {
      documentType: datos.documentType,
      fileName: datos.fileName || 'escrito',
      /* Sin fecha guardada se pone la de hoy, que es cuando se emite este papel; nunca una inventada. */
      fecha: datos.fechaDelInforme || new Date().toLocaleDateString('es-CO', { dateStyle: 'long' }),
      caracteres: datos.caracteres ?? 0,
      truncado: datos.truncado ?? false,
      conFicha: datos.conFicha,
      cliente: datos.cliente || undefined,
      revisadoPor: datos.revisadoPor || undefined
    };
    /* LAS TRES FORMAS. El estructurado del documento recibido, el del escrito propio, y el que no se pudo ordenar. */
    const d: DatosDeExportacion | null = datos.informeRecibido
      ? { ...comunes, modo: 'DOCUMENTO_RECIBIDO', informe: datos.informeRecibido }
      : vigente.informe
        ? { ...comunes, informe: vigente.informe }
        : vigente.informeLibre
          ? { ...comunes, modo: 'INFORME_LIBRE', origen: esDocumentoRecibido ? 'DOCUMENTO_RECIBIDO' : 'ESCRITO_PROPIO', texto: vigente.informeLibre }
          : null;
    if (!d) throw new Error('Este escrito todavía no tiene informe que descargar.');
    if (formato === 'pdf') await exportarInformeAPdf(d);
    else await exportarInformeAWord(d);
  };

  /*
   * Las preguntas para la audiencia guardadas con la revisión. Quien abre el
   * taller arma los datos desde la lista (sin cuerpos), así que se piden aquí
   * una vez; un fallo de red deja la pestaña vacía y no bloquea nada.
   */
  const [preguntasGuardadas, setPreguntasGuardadas] = React.useState<PreguntasAudienciaGuardadas | null>(datos.preguntasAudiencia ?? null);
  /* Las funciones de Revisiones que el operador puede apagar para esta firma: sin pestaña «Audiencia», sin entrada de chat, sin «Volver a revisar». */
  const { funcionHabilitada } = usePlan();
  const preguntasHabilitadas = funcionHabilitada('REVISIONES.PREGUNTAS_AUDIENCIA');

  /*
   * ─── LAS PREGUNTAS DE AUDIENCIA NO SE OFRECEN SOBRE UN DOCUMENTO RECIBIDO ──
   *
   * El encargo que sale al servidor está escrito para el ESCRITO DEL ABOGADO:
   * pide preguntas para interrogar a la contraparte y a los testigos a partir
   * de lo que ese escrito afirma. Sobre un auto o una sentencia produce
   * preguntas dirigidas al juez que lo profirió, que no se interroga, y COBRA
   * saldo por ellas. No cobrar por algo que no sirve es más urgente que
   * hacerlo servir: hasta que el encargo se adapte —eso es trabajo de
   * servidor—, la pestaña no se ofrece y se dice por qué.
   */
  const preguntasOfrecidas = Boolean(datos.revisionId) && preguntasHabilitadas && !esDocumentoRecibido;

  React.useEffect(() => {
    if (datos.preguntasAudiencia !== undefined || !datos.revisionId) return;
    let vigente = true;
    reviewApi
      .obtener(datos.revisionId)
      .then((r) => {
        if (vigente && r.preguntasAudiencia) setPreguntasGuardadas(r.preguntasAudiencia);
      })
      .catch(() => undefined);
    return () => {
      vigente = false;
    };
  }, [datos.revisionId, datos.preguntasAudiencia]);

  const autorizar = async () => {
    setErrorAutorizacion('');
    try {
      const c = await reviewApi.autorizarGuardado(true);
      setConsentimiento(c);
      /* Con la conversación: los turnos de antes de autorizar solo existían en esta pestaña. */
      if (c.guarda && datos.revisionId) {
        const u = ultimoEstado.current;
        await reviewApi.guardarTexto(datos.revisionId, u.texto, u.anotaciones, u.versiones, u.conversacion);
      }
    } catch (err) {
      setErrorAutorizacion(err instanceof Error ? err.message : 'No se pudo guardar la autorización.');
    }
  };

  const pedirAutorizacion = () =>
    setConfirmacion({
      titulo: 'Autorizar que la firma conserve sus escritos',
      texto: (
        <>
          Iureon conservará el texto de los escritos que su firma revise, sus marcas y la conversación con la guía, para retomar el trabajo otro día.
          Aplica a <span className="font-semibold">toda la firma</span> y queda en la auditoría con su correo. Puede retirarla después.
        </>
      ),
      etiqueta: 'Autorizar',
      onConfirmar: autorizar
    });

  return (
    <>
      <TallerDeEscrito
        original={{
          /*
           * De la pestaña si el archivo sigue aquí; del almacenamiento si no.
           * Sin revisión guardada tampoco hay a quién preguntarle, y el visor
           * lo dice y ofrece subirlo.
           */
          fuente: archivoDeLaSesion ? { de: 'sesion', file: archivoDeLaSesion } : datos.revisionId ? { de: 'servidor', revisionId: datos.revisionId } : null,
          revisionId: datos.revisionId,
          puedeConservar: consentimiento.guarda,
          onArchivoCambiado: setArchivoDeLaSesion
        }}
        datos={{
          titulo: datos.documentType,
          subtitulo: [datos.cliente, datos.fileName].filter(Boolean).join(' · '),
          texto: datos.texto,
          informe: datos.informe,
          informeRecibido: datos.informeRecibido ?? null,
          informeLibre: datos.informeLibre,
          conversacion: datos.conversacion,
          anotaciones: datos.anotaciones ?? [],
          versiones: datos.versiones ?? []
        }}
        precioConsultaCop={precioConsultaCop}
        /*
          EL PIE SOLO EXISTE CUANDO LO LEÍDO FUE UN DOCUMENTO RECIBIDO. Sobre un
          escrito propio no hay nada que atacar, y ofrecer ahí la guía de
          actuaciones propondría redactar contra el escrito del propio abogado.
        */
        pieDelInformeRecibido={
          datos.informeRecibido ? (
            <PuenteAlAtaque
              informe={datos.informeRecibido}
              textoDelDocumento={datos.texto}
              ramaInicial={datos.legalBranch ?? ''}
              userRole={userRole}
              onRedactar={onRedactarActuacion}
            />
          ) : undefined
        }
        precioRevisionCop={datos.revisionId ? precioRevisionCop : undefined}
        guardado={{
          activo: guardaEnServidor,
          aviso: guardaEnServidor ? (
            'Se guarda solo, en la nube de su firma: texto, conversación, marcas y versiones. Puede cerrar y retomar otro día.'
          ) : (
            <>
              {/*
                SE NOMBRA EL ARCHIVO ORIGINAL, no solo «el texto». La pestaña
                «Original» es lo primero que se echa en falta al volver otro
                día, y hasta ahora este aviso no decía que también dependía de
                esta autorización: parecía un fallo del visor.
              */}
              <span className="font-semibold">Solo en esta sesión.</span> Su firma no ha autorizado conservar escritos: al cerrar se pierden el texto, el
              archivo tal como se subió —el de la pestaña «Original»—, las marcas, la conversación y las versiones; el informe sí queda.{' '}
              {esAdminDeFirma
                ? 'Puede autorizarlo aquí, una vez, para toda la firma.'
                : 'Puede autorizarlo un socio administrador de su firma, desde este mismo aviso o desde el módulo Revisiones.'}
              {errorAutorizacion ? ` ${errorAutorizacion}` : ''}
            </>
          ),
          accion: !guardaEnServidor && esAdminDeFirma && datos.revisionId ? { etiqueta: 'Autorizar guardado para la firma', onClick: pedirAutorizacion } : undefined
        }}
        onGuardar={
          datos.revisionId
            ? async (texto, conversacion, anotaciones, versiones) => {
                ultimoEstado.current = { texto, conversacion, anotaciones, versiones };
                const r = await reviewApi.guardarTexto(datos.revisionId as string, texto, anotaciones, versiones, conversacion);
                return r.guardado;
              }
            : undefined
        }
        onGuardarAlSalir={
          datos.revisionId
            ? (texto, conversacion, anotaciones, versiones) => {
                ultimoEstado.current = { texto, conversacion, anotaciones, versiones };
                void reviewApi.guardarTextoAlSalir(datos.revisionId as string, texto, anotaciones, versiones, conversacion);
              }
            : undefined
        }
        onChat={async (mensaje, textoActual, historial, anotaciones) => {
          if (!datos.revisionId) throw new Error('El chat necesita una revisión guardada.');
          return reviewApi.chat(datos.revisionId, { mensaje, textoActual, historial, anotaciones });
        }}
        /*
         * «VOLVER A REVISAR» NO SE OFRECE SOBRE UN DOCUMENTO RECIBIDO. El
         * servidor rerevisa SIEMPRE con el prompt del escrito propio, así que
         * pulsarlo cobraría una revisión y reemplazaría la lectura del auto
         * por un informe de otra clase. Y de todos modos no tiene sentido:
         * un auto de un juez ya está proferido y no se corrige aquí.
         */
        onRerevisar={datos.revisionId && !datos.informeRecibido ? (textoActual) => reviewApi.rerevisar(datos.revisionId as string, textoActual) : undefined}
        onExportarTexto={(formato, texto) => onExportarTexto(formato, `${datos.documentType} corregido`, texto)}
        llevarARedaccion={{
          onClick: onLlevarARedaccion,
          deshabilitado: soloLectura ? 'Con el plan vencido no se crean borradores. Renueve el plan para llevar el escrito a Redacción.' : null
        }}
        onCerrar={() => onCerrar()}
        onSaldoCambiado={onSaldoCambiado}
        formato={formatoDeFirma}
        cerradas={{ chat: !funcionHabilitada('REVISIONES.CHAT_GUIA'), rerevisar: !funcionHabilitada('REVISIONES.REREVISAR') }}
        descargarInforme={descargarInforme}
        preguntasNoOfrecidas={
          esDocumentoRecibido && preguntasHabilitadas ? (
            <>
              No hay pestaña <span className="font-semibold">«Audiencia»</span> sobre un documento recibido: las preguntas se preparan a partir del
              escrito de usted, para interrogar a la contraparte y a los testigos, y de un auto o una sentencia saldrían preguntas dirigidas a quien lo
              profirió. Prepare la audiencia desde la revisión del escrito propio con el que actúe en ella.
            </>
          ) : undefined
        }
        preguntas={
          preguntasOfrecidas
            ? {
                precioCop: precioConsultaCop,
                guardadas: preguntasGuardadas,
                onGenerar: (parametros, textoActual) => reviewApi.preguntasParaAudiencia(datos.revisionId as string, { ...parametros, textoActual }),
                onExportarWord: (generadas) => exportarPreguntasAWord(datos.documentType, generadas),
                onExportarPdf: (generadas) => exportarPreguntasAPdf(datos.documentType, generadas)
              }
            : undefined
        }
      />
      <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
    </>
  );
};
