import type { FormatoDelEscrito } from '../../documents/formatoEnPantalla';
import React from 'react';
import { FileText, FolderOpen, TriangleAlert } from 'lucide-react';
import { PdfViewerCanvas } from '../../documents/components/PdfViewerCanvas';
import { LegalDraftViewer } from '../../documents/components/LegalDraftViewer';
import { useActuacionLookup } from '../../catalog/hooks/useActuacion';
import type { GeneratedDraft } from '../../documents/types';

interface DocumentCanvasRightProps {
  rightView: 'pdf' | 'draft';
  setRightView: (view: 'pdf' | 'draft') => void;
  generatedDraft: GeneratedDraft | null;
  /** Lo decide App: en movil solo se ve un panel a la vez. */
  ocultoEnMovil?: boolean;
  copied: boolean;
  onOpenBrandingModal: () => void;
  onCopyText: () => void;
  onExportWord: () => void;
  onExportPdf: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onSaveDraft?: (updatedText: string) => void;
  onOpenSavedDraftsModal?: () => void;
  /** Para poder contar secciones obligatorias contra la ficha del catálogo. */
  documentType?: string;
  legalBranch?: string;
  /** Formato del escrito de la firma, para que el lienzo se vea como el papel. */
  formato?: FormatoDelEscrito | null;
}

/**
 * El lienzo: la barra de contadores y el documento.
 *
 * LOS CONTADORES SE MIDEN, NO SE DECLARAN. El diseño muestra "Fuentes 12",
 * "Secciones obligatorias 9/9", "2 sin verificar" y "1.912 palabras". Aquí solo
 * se pinta lo que se puede computar del borrador real y de la ficha del
 * catálogo; lo que no se puede medir no se pinta.
 *
 * Eso importa más de lo que parece: un "9/9" que en realidad nadie comprobó le
 * dice al abogado que su escrito está completo, y es exactamente la clase de
 * afirmación por la que este producto existe para no hacer.
 */
export const DocumentCanvasRight: React.FC<DocumentCanvasRightProps> = ({
  rightView,
  setRightView,
  generatedDraft,
  onExportWord,
  onExportPdf,
  isFocusMode,
  onToggleFocusMode,
  onSaveDraft,
  onOpenSavedDraftsModal,
  documentType = '',
  legalBranch = '',
  ocultoEnMovil = false,
  formato = null
}) => {
  const lookup = useActuacionLookup(documentType, legalBranch);
  const actuacion = lookup.actuacion;
  const texto = generatedDraft?.legalText ?? '';

  const palabras = texto ? texto.split(/\s+/).filter(Boolean).length : 0;

  /*
   * SECCIONES OBLIGATORIAS PRESENTES, comprobadas contra el texto.
   *
   * Se busca el nombre de cada sección exigida dentro del borrador, sin tildes
   * ni mayúsculas. No es una comprobación jurídica —una sección puede estar con
   * otro encabezado— y por eso el rótulo dice "encontradas" y no "cumplidas":
   * afirma lo que de verdad se midió.
   */
  const normalizar = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');

  const exigidas = actuacion?.requiredSections.filter((s) => s.mandatory) ?? [];
  const cuerpo = normalizar(texto);
  const encontradas = texto
    ? exigidas.filter((s) => cuerpo.includes(normalizar(s.name))).length
    : 0;

  /*
   * "SIN VERIFICAR" — lo que de verdad sabemos que no está comprobado.
   *
   * El diseño muestra un contador de afirmaciones sin verificar dentro del
   * escrito, y eso exigiría marcar cada afirmación al generarla: el pipeline no
   * lo hace todavía. Lo que SÍ se sabe es si la actuación misma está catalogada
   * y si su término está verificado — y eso es lo que se dice, sin inventar un
   * número que nadie contó.
   */
  const sinVerificar =
    lookup.estado === 'SIN_CATALOGAR'
      ? 'La actuación no está en el catálogo'
      : actuacion?.term.status === 'NO_VERIFICADO'
      ? 'El término de esta actuación no está verificado'
      : null;

  const Pestana: React.FC<{ valor: 'draft' | 'pdf'; children: React.ReactNode }> = ({
    valor,
    children
  }) => (
    <button
      onClick={() => setRightView(valor)}
      className={`flex h-full items-center border-b-2 text-[12.5px] transition-colors ${
        rightView === valor
          ? 'border-brand-700 font-semibold text-brand-700'
          : 'border-transparent font-medium text-ink-500 hover:text-ink-900'
      }`}
    >
      {children}
    </button>
  );

  return (
    <section
      className={`h-full min-w-0 flex-1 flex-col overflow-hidden bg-canvas font-sans ${
        ocultoEnMovil ? 'hidden lg:flex' : 'flex'
      }`}
    >
      {/* ─── BARRA DE CONTADORES · 38px ────────────────────────────────────*/}
      <div className="flex h-[38px] shrink-0 items-center gap-4 border-b border-line-200 bg-surface px-5">
        <Pestana valor="draft">Documento</Pestana>
        <Pestana valor="pdf">Expediente</Pestana>

        {generatedDraft && exigidas.length > 0 && (
          <span className="text-[12.5px] font-medium text-ink-500">
            Secciones exigidas{' '}
            <span
              className={`font-mono text-[11px] ${
                encontradas === exigidas.length ? 'text-verified' : 'text-unverified'
              }`}
            >
              {encontradas}/{exigidas.length}
            </span>{' '}
            <span className="text-ink-400">encontradas</span>
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          {sinVerificar && (
            <span className="chip-unverified" title={sinVerificar}>
              <TriangleAlert className="h-3 w-3" strokeWidth={2.4} />
              Sin verificar
            </span>
          )}
          {palabras > 0 && (
            <span className="font-mono text-[11.5px] text-ink-400">
              {palabras.toLocaleString('es-CO')} palabras
            </span>
          )}
        </div>
      </div>

      {/* ─── EL DOCUMENTO ──────────────────────────────────────────────────*/}
      <div className="flex-1 overflow-y-auto px-4 pt-5">
        {rightView === 'draft' ? (
          generatedDraft ? (
            <LegalDraftViewer
              draft={generatedDraft}
              onExportPdf={onExportPdf}
              onExportWord={onExportWord}
              isFocusMode={isFocusMode}
              onToggleFocusMode={onToggleFocusMode}
              onSaveDraft={onSaveDraft}
              onOpenSavedDraftsModal={onOpenSavedDraftsModal}
              formato={formato}
            />
          ) : (
            /*
              EL VACÍO AFIRMA EL HECHO Y OFRECE LA ACCIÓN, nunca una ilustración.
              El anterior tenía un ícono pulsando y un párrafo que explicaba el
              pipeline de tres motores — información sobre nosotros, en el sitio
              donde el abogado esperaba su documento.
            */
            <div className="mx-auto mt-16 max-w-[420px] text-center">
              <FileText className="mx-auto h-6 w-6 text-ink-400" strokeWidth={1.6} />
              <h3 className="mt-3 text-subtitle text-ink-900">Aún no hay borrador</h3>
              <p className="mt-1 text-ui leading-[1.6] text-ink-500">
                Describa a la izquierda qué debe hacer el escrito y genérelo. Aparecerá aquí, sobre
                papel y listo para editar.
              </p>
              {onOpenSavedDraftsModal && (
                <button onClick={onOpenSavedDraftsModal} className="btn-secondary mt-4">
                  <FolderOpen className="h-3.5 w-3.5" />
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
