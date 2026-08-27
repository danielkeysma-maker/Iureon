import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Check, Eye, FolderOpen, Pencil, Save, Scale, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';
import { JargonSuggestionModal } from './JargonSuggestionModal';
import { markdownBoldToHtml } from '../services/documentExport.service';
import { learningApi } from '../../agent/services/learning.api';

export type { GeneratedDraft } from '../types';
import type { GeneratedDraft } from '../types';

interface LegalDraftViewerProps {
  draft: GeneratedDraft;
  onExportPdf?: () => void;
  onExportWord?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  onSaveDraft?: (updatedText: string) => void;
  onOpenSavedDraftsModal?: () => void;
}

/**
 * El escrito, sobre papel.
 *
 * LO QUE SE RADICA SE LEE COMO DOCUMENTO, no como pantalla: de ahí la serif, el
 * ancho fijo de 684px y el interlineado de 1,8. Es la única parte de la
 * aplicación que no usa la tipografía de interfaz, y esa diferencia es
 * deliberada — separa lo que el abogado va a firmar de los controles que lo
 * rodean.
 *
 * SU CABECERA SE FUE ARRIBA. Tenía su propia barra con el título, el conteo de
 * palabras y seis botones, que duplicaba la barra superior de la aplicación:
 * dos títulos del mismo documento, dos sitios donde exportar, y el "Pantalla
 * Central" repetido en ambos. Ahora los contadores viven en la barra de
 * pestañas del lienzo y las acciones de documento en la barra superior; aquí
 * quedan solo las que actúan sobre el TEXTO.
 *
 * EN MODO OSCURO EL PAPEL SE OSCURECE PERO EL .DOCX NO. El token `paper` cambia
 * en pantalla y la exportación sale siempre en blanco — nadie quiere radicar un
 * .docx con fondo negro, y el pie del taller lo dice.
 */
export const LegalDraftViewer: React.FC<LegalDraftViewerProps> = ({
  draft,
  isFocusMode,
  onSaveDraft,
  onOpenSavedDraftsModal
}) => {
  const [editableText, setEditableText] = useState(draft.legalText);
  const [selectedText, setSelectedText] = useState('');
  const [isJargonModalOpen, setIsJargonModalOpen] = useState(false);
  const [isStyleSaved, setIsStyleSaved] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const renderedHtml = useMemo(() => {
    const raw = markdownBoldToHtml(editableText);
    const withBreaks = raw
      .split('\n\n')
      .map((p) => `<p style="margin-bottom:14px;text-align:justify;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');
    return DOMPurify.sanitize(withBreaks);
  }, [editableText]);

  useEffect(() => {
    setEditableText(draft.legalText);
  }, [draft.legalText]);

  const handleSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleApplyReplacement = (replacement: string) => {
    if (!selectedText) {
      setEditableText((prev) => `${prev}\n\n${replacement}`);
      return;
    }
    setEditableText((prev) => prev.replace(selectedText, replacement));
  };

  const handleSaveAndTeachStyle = async () => {
    setIsStyleSaved(true);
    try {
      await learningApi.teachStyle(draft.legalText, editableText);
    } finally {
      setTimeout(() => setIsStyleSaved(false), 3000);
    }
  };

  return (
    <>
      <JargonSuggestionModal
        isOpen={isJargonModalOpen}
        onClose={() => setIsJargonModalOpen(false)}
        selectedText={selectedText || 'rechazar'}
        onApplyReplacement={handleApplyReplacement}
      />

      <div className={`mx-auto w-full ${isFocusMode ? 'max-w-[860px]' : 'max-w-[684px]'}`}>
        {/*
          EL PAPEL. Sin borde inferior ni radio abajo: se apoya en el fondo del
          lienzo, como una hoja que sigue más allá del recorte. Un rectángulo
          cerrado con sombra alrededor se lee como tarjeta, no como documento.
        */}
        <div className="paper-canvas relative rounded-t-card border border-b-0 border-line-200 px-8 py-8 shadow-e1 sm:px-14">
          {/* Editar / ver: actúa sobre el TEXTO, así que vive con el texto. */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className="btn-neutral btn-sm absolute right-3 top-3"
            title={isEditMode ? 'Ver con formato' : 'Editar el texto'}
          >
            {isEditMode ? <Eye className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
            {isEditMode ? 'Ver' : 'Editar'}
          </button>

          {isEditMode ? (
            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              onMouseUp={handleSelection}
              onKeyUp={handleSelection}
              className="min-h-[540px] w-full resize-y break-words border-0 bg-transparent font-legal text-[14.5px] leading-[1.8] text-paper-ink focus:outline-none"
            />
          ) : (
            <div
              className="min-h-[540px] break-words font-legal text-[14.5px] leading-[1.8] text-paper-ink [text-wrap:pretty]"
              onMouseUp={handleSelection}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}
        </div>

        {/* ─── PIE DEL ESCRITO ────────────────────────────────────────────
            Acciones sobre el TEXTO, no sobre el documento: exportar y pantalla
            completa viven arriba. Y la advertencia de la exportación, que el
            diseño exige decir donde se decide. */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-b-card border border-t-0 border-line-200 bg-surface px-4 py-2.5">
          <button onClick={() => setIsJargonModalOpen(true)} className="btn-neutral btn-sm">
            <Sparkles className="h-3 w-3 text-ink-400" />
            Sugerir jerga
          </button>

          <button onClick={handleSaveAndTeachStyle} className="btn-neutral btn-sm">
            {isStyleSaved ? (
              <>
                <Check className="h-3 w-3 text-verified" />
                Aprendido
              </>
            ) : (
              <>
                <BrainCircuit className="h-3 w-3 text-ink-400" />
                Enseñar estilo
              </>
            )}
          </button>

          {onOpenSavedDraftsModal && (
            <button onClick={onOpenSavedDraftsModal} className="btn-neutral btn-sm">
              <FolderOpen className="h-3 w-3 text-ink-400" />
              Mis borradores
            </button>
          )}

          {onSaveDraft && (
            <button
              onClick={() => onSaveDraft(editableText)}
              className="btn-secondary btn-sm ml-auto"
              title="Guardar en el historial de la firma"
            >
              <Save className="h-3 w-3" />
              Guardar
            </button>
          )}
        </div>

        {/*
          LA EXPORTACIÓN SALE SIEMPRE EN PAPEL BLANCO, y se dice aquí porque es
          donde alguien se lo pregunta al ver el lienzo oscuro. No es una opción:
          nadie quiere radicar un .docx con fondo negro.
        */}
        <p className="mt-2 text-center text-meta text-ink-400">
          El .docx y el PDF se exportan siempre sobre papel blanco.
        </p>

        {/* ─── LO QUE EL ESCRITO USÓ ─────────────────────────────────────*/}
        {draft.jurisprudenciaCitada.length > 0 && (
          <div className="card mt-4 p-4">
            <div className="flex items-center gap-2">
              <Scale className="h-3.5 w-3.5 text-ink-400" />
              <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Jurisprudencia usada
              </h3>
            </div>
            <ul className="mt-2 space-y-1">
              {draft.jurisprudenciaCitada.map((item, idx) => (
                <li key={idx} className="font-mono text-meta text-ink-700">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
};
