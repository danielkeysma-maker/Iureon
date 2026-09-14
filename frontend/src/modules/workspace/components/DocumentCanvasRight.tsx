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
  onSaveDraft?: (updatedText: string) => void | string | Promise<string | void>;
  /** Un aviso que llega de fuera —el borrador recién traído del taller—; se pinta donde el de «Guardar». */
  avisoExterno?: { texto: string; clave: number } | null;
  /** El texto editado, cuando la pestaña se oculta o se cierra con cambios sin guardar. */
  onSalirConCambios?: (texto: string) => void;
  onOpenSavedDraftsModal?: () => void;
  /** Para poder contar secciones obligatorias contra la ficha del catálogo. */
  documentType?: string;
  legalBranch?: string;
  /** Formato del escrito de la firma, para que el lienzo se vea como el papel. */
  formato?: FormatoDelEscrito | null;
  onAbrirTaller?: (textoActual: string) => void;
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
  avisoExterno = null,
  onSalirConCambios,
  onOpenSavedDraftsModal,
  documentType = '',
  legalBranch = '',
  ocultoEnMovil = false,
  formato = null,
  onAbrirTaller
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
      className={`cn-red-lienzo-pestana ${rightView === valor ? 'cn-red-lienzo-pestana--activa' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <section
      className={`cn-red-lienzo h-full min-w-0 flex-1 flex-col overflow-hidden ${
        ocultoEnMovil ? 'hidden lg:flex' : 'flex'
      }`}
    >
      {/* ─── BARRA DE CONTADORES · 38px ────────────────────────────────────*/}
      {/*
        LA BARRA DEL LIENZO NO CABE EN UN TELÉFONO DE 320, y lo que se pierde
        es lo de la derecha: el conteo de palabras quedaba seis píxeles fuera
        del borde, cortado por el recorte de la columna. Son cinco cosas en una
        fila que no envuelve —dos pestañas, las secciones exigidas, el aviso de
        sin verificar y el conteo—, así que se estrechan el relleno y la
        separación en el teléfono y la fila lleva desplazamiento propio; en
        `sm:` vuelven las medidas de siempre y el escritorio no cambia.
      */}
      <div className="cn-red-lienzo-barra">
        <Pestana valor="draft">Documento</Pestana>
        <Pestana valor="pdf">Expediente</Pestana>

        {/* Conteos en la letra de interfaz: no son citables, son una medida de esta pantalla. */}
        {generatedDraft && exigidas.length > 0 && (
          <span className="cn-red-lienzo-dato">
            Secciones exigidas{' '}
            <b
              className={`cn-red-cifra ${
                encontradas === exigidas.length ? 'cn-red-cifra--ok' : 'cn-red-cifra--sin'
              }`}
            >
              {encontradas}/{exigidas.length}
            </b>{' '}
            encontradas
          </span>
        )}

        <div className="cn-red-lienzo-derecha">
          {sinVerificar && (
            <span className="cn-red-estado cn-red-estado--sin" title={sinVerificar}>
              <TriangleAlert className="cn-red-estado-icono" strokeWidth={2} aria-hidden />
              Sin verificar
            </span>
          )}
          {palabras > 0 && (
            <span className="cn-red-lienzo-dato">
              {palabras.toLocaleString('es-CO')} palabras
            </span>
          )}
        </div>
      </div>

      {/* ─── EL DOCUMENTO ──────────────────────────────────────────────────*/}
      <div className="scroll-documento cn-red-mesa flex-1 overflow-y-auto">

        {rightView === 'draft' ? (
          generatedDraft ? (
            <LegalDraftViewer
              draft={generatedDraft}
              onExportPdf={onExportPdf}
              onExportWord={onExportWord}
              isFocusMode={isFocusMode}
              onToggleFocusMode={onToggleFocusMode}
              onSaveDraft={onSaveDraft}
              avisoExterno={avisoExterno}
              onSalirConCambios={onSalirConCambios}
              onOpenSavedDraftsModal={onOpenSavedDraftsModal}
              formato={formato}
              onAbrirTaller={onAbrirTaller}
            />
          ) : (
            /*
              EL VACÍO AFIRMA EL HECHO Y OFRECE LA ACCIÓN, nunca una ilustración.
              El anterior tenía un ícono pulsando y un párrafo que explicaba el
              pipeline de tres motores — información sobre nosotros, en el sitio
              donde el abogado esperaba su documento.
            */
            <div className="cn-red-vacio">
              <FileText className="cn-red-vacio-icono" strokeWidth={1.5} aria-hidden />
              <h3 className="cn-red-vacio-titulo">Aún no hay borrador</h3>
              <p className="cn-red-vacio-texto">
                Describa a la izquierda qué debe hacer el escrito y genérelo. Aparecerá aquí, sobre
                papel y listo para editar.
              </p>
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
