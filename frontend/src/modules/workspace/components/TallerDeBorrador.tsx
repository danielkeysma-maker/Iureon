import React from 'react';
import { reviewApi, type Anotacion, type TurnoDelTaller } from '../services/review.api';
import { TallerDeEscrito } from './TallerDeEscrito';

/**
 * El taller sobre un BORRADOR generado en Redacción: la misma guía, el mismo
 * resaltador, sin informe previo. El borrador ya es de la firma, así que la
 * conversación y las marcas se guardan con él sin autorización aparte — pero
 * solo si el borrador está guardado; si no lo está, la cinta lo dice y ofrece
 * guardarlo, porque un taller sobre un texto que aún no existe en la nube se
 * perdería con la pestaña.
 *
 * «Revisión completa» pide a la guía el informe formal ($2.000) sobre el texto
 * actual: es la misma revisión del módulo de revisiones, sin subir archivo.
 */

export interface DatosDelBorrador {
  titulo: string;
  documentType: string;
  legalBranch: string;
  texto: string;
  conversacion: TurnoDelTaller[];
  anotaciones: Anotacion[];
  /** Id del borrador guardado; null si todavía no se guardó. */
  draftId: string | null;
}

interface TallerDeBorradorProps {
  datos: DatosDelBorrador;
  precioConsultaCop: number;
  precioRevisionCop: number;
  onGuardar: (texto: string, conversacion: TurnoDelTaller[], anotaciones: Anotacion[]) => Promise<boolean>;
  /** Guardar el borrador por primera vez, para que el taller tenga dónde vivir. */
  onGuardarBorradorNuevo: () => Promise<void>;
  onCerrar: (textoFinal: string) => void;
  onSaldoCambiado: () => void;
  onExportarTexto: (formato: 'pdf' | 'word', titulo: string, texto: string) => void;
}

export const TallerDeBorrador: React.FC<TallerDeBorradorProps> = ({
  datos,
  precioConsultaCop,
  precioRevisionCop,
  onGuardar,
  onGuardarBorradorNuevo,
  onCerrar,
  onSaldoCambiado,
  onExportarTexto
}) => (
  <TallerDeEscrito
    datos={{
      titulo: datos.titulo,
      subtitulo: `${datos.documentType} · borrador de Redacción`,
      texto: datos.texto,
      informe: null,
      conversacion: datos.conversacion,
      anotaciones: datos.anotaciones
    }}
    precioConsultaCop={precioConsultaCop}
    precioRevisionCop={precioRevisionCop}
    guardado={{
      activo: datos.draftId !== null,
      aviso:
        datos.draftId !== null ? (
          'Guardado con el borrador, en la nube de su firma: texto, marcas y conversación.'
        ) : (
          <>
            <span className="font-semibold">Borrador sin guardar.</span> Los cambios, las marcas y la conversación viven solo en esta pestaña hasta que lo
            guarde.
          </>
        ),
      accion: datos.draftId === null ? { etiqueta: 'Guardar el borrador', onClick: onGuardarBorradorNuevo } : undefined
    }}
    onGuardar={onGuardar}
    onChat={(mensaje, textoActual, historial) =>
      reviewApi.chatSobreEscrito({ documentType: datos.documentType, legalBranch: datos.legalBranch || undefined, titulo: datos.titulo, mensaje, textoActual, historial })
    }
    onRerevisar={async (textoActual) => {
      const r = await reviewApi.revisar({
        documentType: datos.documentType,
        legalBranch: datos.legalBranch || undefined,
        pregunta: '',
        cliente: '',
        fileName: `${datos.titulo}.txt`,
        texto: textoActual
      });
      return { informe: r.informe, informeLibre: r.informeLibre };
    }}
    onExportarTexto={(formato, texto) => onExportarTexto(formato, datos.titulo, texto)}
    onCerrar={onCerrar}
    onSaldoCambiado={onSaldoCambiado}
  />
);
