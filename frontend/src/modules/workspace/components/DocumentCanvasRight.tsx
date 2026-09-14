import type { FormatoDelEscrito } from '../../documents/formatoEnPantalla';
import React from 'react';
import { FileText, FolderOpen } from 'lucide-react';
import { PdfViewerCanvas } from '../../documents/components/PdfViewerCanvas';
import { LegalDraftViewer } from '../../documents/components/LegalDraftViewer';
import { DraftProvenanceBar } from '../../documents/components/DraftProvenanceBar';
import { useActuacionLookup } from '../../catalog/hooks/useActuacion';
import type { GeneratedDraft } from '../../documents/types';

interface DocumentCanvasRightProps {
  rightView: 'pdf' | 'draft';
  setRightView: (view: 'pdf' | 'draft') => void;
  generatedDraft: GeneratedDraft | null;
  /** Lo decide App: con el asistente a la vista el lienzo se oculta, no se desmonta. */
  oculto?: boolean;
  isFocusMode?: boolean;
  onSaveDraft?: (updatedText: string) => void | string | Promise<string | void>;
  /** Un aviso que llega de fuera —el borrador recién traído del taller—; se pinta donde el de «Guardar». */
  avisoExterno?: { texto: string; clave: number } | null;
  /** El texto editado, cuando la pestaña se oculta, se cierra o el visor se desmonta con cambios sin guardar. */
  onSalirConCambios?: (texto: string) => void;
  onOpenSavedDraftsModal?: () => void;
  /** Para leer la ficha del catálogo contra la que se redactó. */
  documentType?: string;
  legalBranch?: string;
  /** Formato del escrito de la firma, para que el lienzo se vea como el papel. */
  formato?: FormatoDelEscrito | null;
  onAbrirTaller?: (textoActual: string) => void;
}

/**
 * El lienzo del borrador: la franja de procedencia, las pestañas y la mesa.
 *
 * ─── LA FRANJA VA A TODO LO ANCHO, ARRIBA ──────────────────────────────────
 *
 * Vivía encima del papel, en su columna. El artboard del borrador la pone bajo
 * la barra y a todo lo ancho, sobre el papel Y sobre la columna de lo que lo
 * respalda, porque advierte sobre las dos cosas. Se calla cuando no hay nada
 * que advertir, y entonces la franja no ocupa sitio.
 *
 * ─── EL CONTADOR «SECCIONES EXIGIDAS N/M» SE FUE ───────────────────────────
 *
 * Decía cuántas secciones aparecían y no cuáles. La columna «Lo que respalda
 * este escrito» dice cuáles, con un salto al párrafo de cada una. Tampoco queda
 * el chip «Sin verificar»: la franja y la columna ya lo dicen con su razón, y
 * una tercera marca igual enseña a no mirar ninguna.
 *
 * LOS CONTADORES SE MIDEN, NO SE DECLARAN: lo que no se puede computar del
 * borrador real y de la ficha no se pinta.
 */
export const DocumentCanvasRight: React.FC<DocumentCanvasRightProps> = ({
  rightView,
  setRightView,
  generatedDraft,
  isFocusMode,
  onSaveDraft,
  avisoExterno = null,
  onSalirConCambios,
  onOpenSavedDraftsModal,
  documentType = '',
  legalBranch = '',
  oculto = false,
  formato = null,
  onAbrirTaller
}) => {
  const lookup = useActuacionLookup(documentType, legalBranch);
  const texto = generatedDraft?.legalText ?? '';
  const palabras = texto ? texto.split(/\s+/).filter(Boolean).length : 0;

  const Pestana: React.FC<{ valor: 'draft' | 'pdf'; children: React.ReactNode }> = ({ valor, children }) => (
    <button
      type="button"
      onClick={() => setRightView(valor)}
      aria-pressed={rightView === valor}
      className={`cn-red-lienzo-pestana ${rightView === valor ? 'cn-red-lienzo-pestana--activa' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <section className={`cn-red-lienzo h-full min-w-0 flex-1 flex-col overflow-hidden ${oculto ? 'hidden' : 'flex'}`}>
      {rightView === 'draft' && generatedDraft && (
        <div className="cn-red-franja">
          <DraftProvenanceBar procedencia={generatedDraft.procedencia} />
        </div>
      )}

      {/* Documento contra expediente: pestañas del lienzo, y solo aquí. */}
      <div className="cn-red-lienzo-barra">
        <Pestana valor="draft">Documento</Pestana>
        <Pestana valor="pdf">Expediente</Pestana>

        <div className="cn-red-lienzo-derecha">
          {/* Conteos en la letra de interfaz: no son citables, son una medida de esta pantalla. */}
          {palabras > 0 && <span className="cn-red-lienzo-dato">{palabras.toLocaleString('es-CO')} palabras</span>}
        </div>
      </div>

      {/*
        CON BORRADOR, LA MESA NO SE DESPLAZA ENTERA EN ESCRITORIO: el papel y la
        columna llevan cada uno su desplazamiento. Con una sola barra, en un
        portátil de 768 px la columna fija quedaba más alta que lo visible y su
        final —«Guardar»— no se alcanzaba nunca.
      */}
      <div className={`scroll-documento cn-red-mesa flex-1 overflow-y-auto ${rightView === 'draft' && generatedDraft ? 'cn-red-mesa--borrador' : ''}`}>
        {rightView === 'draft' ? (
          generatedDraft ? (
            <LegalDraftViewer
              draft={generatedDraft}
              isFocusMode={isFocusMode}
              onSaveDraft={onSaveDraft}
              avisoExterno={avisoExterno}
              onSalirConCambios={onSalirConCambios}
              onOpenSavedDraftsModal={onOpenSavedDraftsModal}
              formato={formato}
              onAbrirTaller={onAbrirTaller}
              ficha={lookup}
            />
          ) : (
            /*
              EL VACÍO AFIRMA EL HECHO Y OFRECE LA ACCIÓN. Con el asistente casi no
              se llega aquí —el lienzo aparece cuando hay borrador—, pero si el
              escrito se pierde a mitad de camino esto es lo que queda a la vista.
            */
            <div className="cn-red-vacio">
              <FileText className="cn-red-vacio-icono" strokeWidth={1.5} aria-hidden />
              <h3 className="cn-red-vacio-titulo">Aún no hay borrador</h3>
              <p className="cn-red-vacio-texto">Vuelva a «Redactar», describa qué debe hacer el escrito y genérelo. Aparecerá aquí, sobre papel.</p>
              {onOpenSavedDraftsModal && (
                <button type="button" onClick={onOpenSavedDraftsModal} className="cn-red-boton-sec">
                  <FolderOpen className="cn-red-boton-icono" strokeWidth={1.8} aria-hidden />
                  Abrir un borrador guardado
                </button>
              )}
            </div>
          )
        ) : (
          <PdfViewerCanvas draftText={generatedDraft?.legalText} draftTitle={generatedDraft?.title} />
        )}
      </div>
    </section>
  );
};
