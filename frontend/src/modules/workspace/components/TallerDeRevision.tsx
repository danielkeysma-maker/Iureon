import React from 'react';
import { reviewApi, type Anotacion, type ConsentimientoDeGuardado, type InformeDeRevision, type TurnoDelTaller, type VersionDelTexto } from '../services/review.api';
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
}

interface TallerDeRevisionProps {
  datos: DatosDelTaller;
  esAdminDeFirma: boolean;
  precioConsultaCop: number;
  precioRevisionCop: number;
  onCerrar: () => void;
  onSaldoCambiado: () => void;
  onExportarTexto: (formato: 'pdf' | 'word', titulo: string, texto: string) => void;
}

export const TallerDeRevision: React.FC<TallerDeRevisionProps> = ({
  datos,
  esAdminDeFirma,
  precioConsultaCop,
  precioRevisionCop,
  onCerrar,
  onSaldoCambiado,
  onExportarTexto
}) => {
  const [consentimiento, setConsentimiento] = React.useState<ConsentimientoDeGuardado>({ guarda: datos.guardaTexto, por: null, el: null });
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
  const [errorAutorizacion, setErrorAutorizacion] = React.useState('');
  /** Lo último que el taller tenía, para guardarlo en el acto cuando la firma autoriza. */
  const ultimoEstado = React.useRef<{ texto: string; anotaciones: Anotacion[]; versiones: VersionDelTexto[] }>({ texto: datos.texto, anotaciones: datos.anotaciones ?? [], versiones: datos.versiones ?? [] });

  const guardaEnServidor = consentimiento.guarda && datos.revisionId !== null;

  const autorizar = async () => {
    setErrorAutorizacion('');
    try {
      const c = await reviewApi.autorizarGuardado(true);
      setConsentimiento(c);
      if (c.guarda && datos.revisionId) await reviewApi.guardarTexto(datos.revisionId, ultimoEstado.current.texto, ultimoEstado.current.anotaciones, ultimoEstado.current.versiones);
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
            'Guardado en la nube de su firma: texto, marcas y conversación. Puede cerrar y retomar otro día.'
          ) : (
            <>
              <span className="font-semibold">Solo en esta sesión.</span> Su firma no ha autorizado conservar escritos: al cerrar se pierden el texto, las
              marcas y la conversación; el informe sí queda.{' '}
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
            ? async (texto, _conversacion, anotaciones, versiones) => {
                ultimoEstado.current = { texto, anotaciones, versiones };
                const r = await reviewApi.guardarTexto(datos.revisionId as string, texto, anotaciones, versiones);
                return r.guardado;
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
      />
      <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
    </>
  );
};
