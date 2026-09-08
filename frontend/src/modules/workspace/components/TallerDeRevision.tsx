import React from 'react';
import type { FormatoDelEscrito } from '../../documents/formatoEnPantalla';
import { reviewApi, type Anotacion, type ConsentimientoDeGuardado, type InformeDeRevision, type PreguntasAudienciaGuardadas, type TurnoDelTaller, type VersionDelTexto } from '../services/review.api';
import { exportarPreguntasAWord } from '../services/preguntasExport.service';
import { TallerDeEscrito } from './TallerDeEscrito';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';

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
  fileName: string;
  cliente: string;
  texto: string;
  informe: InformeDeRevision | null;
  informeLibre: string | null;
  conFicha: boolean;
  guardaTexto: boolean;
  conversacion: TurnoDelTaller[];
  anotaciones?: Anotacion[];
  versiones?: VersionDelTexto[];
  /** Si quien abre el taller ya las tiene; si falta, el taller las pide al servidor. */
  preguntasAudiencia?: PreguntasAudienciaGuardadas | null;
}

interface TallerDeRevisionProps {
  datos: DatosDelTaller;
  esAdminDeFirma: boolean;
  precioConsultaCop: number;
  precioRevisionCop: number;
  onCerrar: () => void;
  onSaldoCambiado: () => void;
  onExportarTexto: (formato: 'pdf' | 'word', titulo: string, texto: string) => void;
  formatoDeFirma?: FormatoDelEscrito | null;
}

export const TallerDeRevision: React.FC<TallerDeRevisionProps> = ({
  datos,
  esAdminDeFirma,
  precioConsultaCop,
  precioRevisionCop,
  onCerrar,
  onSaldoCambiado,
  onExportarTexto,
  formatoDeFirma
}) => {
  const [consentimiento, setConsentimiento] = React.useState<ConsentimientoDeGuardado>({ guarda: datos.guardaTexto, por: null, el: null });
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
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
   * Las preguntas para la audiencia guardadas con la revisión. Quien abre el
   * taller arma los datos desde la lista (sin cuerpos), así que se piden aquí
   * una vez; un fallo de red deja la pestaña vacía y no bloquea nada.
   */
  const [preguntasGuardadas, setPreguntasGuardadas] = React.useState<PreguntasAudienciaGuardadas | null>(datos.preguntasAudiencia ?? null);
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
        datos={{
          titulo: datos.documentType,
          subtitulo: [datos.cliente, datos.fileName].filter(Boolean).join(' · '),
          texto: datos.texto,
          informe: datos.informe,
          conversacion: datos.conversacion,
          anotaciones: datos.anotaciones ?? [],
          versiones: datos.versiones ?? []
        }}
        precioConsultaCop={precioConsultaCop}
        precioRevisionCop={datos.revisionId ? precioRevisionCop : undefined}
        guardado={{
          activo: guardaEnServidor,
          aviso: guardaEnServidor ? (
            'Se guarda solo, en la nube de su firma: texto, conversación, marcas y versiones. Puede cerrar y retomar otro día.'
          ) : (
            <>
              <span className="font-semibold">Solo en esta sesión.</span> Su firma no ha autorizado conservar escritos: al cerrar se pierden el texto, las
              marcas, la conversación y las versiones; el informe sí queda.{' '}
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
        onRerevisar={datos.revisionId ? (textoActual) => reviewApi.rerevisar(datos.revisionId as string, textoActual) : undefined}
        onExportarTexto={(formato, texto) => onExportarTexto(formato, `${datos.documentType} corregido`, texto)}
        onCerrar={() => onCerrar()}
        onSaldoCambiado={onSaldoCambiado}
        formato={formatoDeFirma}
        preguntas={
          datos.revisionId
            ? {
                precioCop: precioConsultaCop,
                guardadas: preguntasGuardadas,
                onGenerar: (parametros, textoActual) => reviewApi.preguntasParaAudiencia(datos.revisionId as string, { ...parametros, textoActual }),
                onExportarWord: (generadas) => exportarPreguntasAWord(datos.documentType, generadas)
              }
            : undefined
        }
      />
      <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
    </>
  );
};
