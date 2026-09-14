import { estiloDelLienzo, type FormatoDelEscrito } from '../formatoEnPantalla';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrainCircuit, ClipboardCheck, Check, Eye, FolderOpen, Pencil, Save, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';
import { JargonSuggestionModal } from './JargonSuggestionModal';
import { markdownBoldToHtml } from '../services/documentExport.service';
import { learningApi } from '../../agent/services/learning.api';
import { ControlDeLetra, useTamanoDeLetra } from '../../../design/TamanoDeLetra';
import { useFuncionHabilitada } from '../../subscriptions/PlanContext';
import { AVISO_FUNCION_DESHABILITADA } from '../../subscriptions/types';
import type { ActuacionLookup } from '../../catalog/hooks/useActuacion';
import { LoQueRespaldaElEscrito } from '../../workspace/components/LoQueRespaldaElEscrito';
import { parrafosDelEscrito } from '../../workspace/services/seccionesEnElEscrito';

export type { GeneratedDraft } from '../types';
import type { GeneratedDraft } from '../types';

interface LegalDraftViewerProps {
  draft: GeneratedDraft;
  onExportPdf?: () => void;
  onExportWord?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  /** Guarda el texto tal como está. Si devuelve un mensaje, se muestra como aviso, nunca como diálogo del navegador. */
  onSaveDraft?: (updatedText: string) => void | string | Promise<string | void>;
  /** Un aviso que viene de fuera (el borrador traído del taller de revisión). Mismo sitio y misma duración que el de «Guardar». */
  avisoExterno?: { texto: string; clave: number } | null;
  /**
   * El texto editado en el lienzo, cuando la pestaña se oculta, se cierra o el
   * visor se desmonta con cambios que aún no se guardaron. Debe salir con keepalive.
   */
  onSalirConCambios?: (texto: string) => void;
  onOpenSavedDraftsModal?: () => void;
  /** Tipografía, tamaño e interlineado de la firma (Membrete · Formato del escrito). Sin él, la serif por defecto. */
  formato?: FormatoDelEscrito | null;
  /** Abre el taller sobre este escrito: marcas, resaltador y chat con la guía. Recibe el texto tal como está en el lienzo. */
  onAbrirTaller?: (textoActual: string) => void;
  /** La ficha del catálogo contra la que se lee el escrito, para la columna «Lo que respalda este escrito». */
  ficha?: ActuacionLookup | null;
}

/**
 * El escrito, sobre papel, con lo que lo respalda al lado. Artboard «Borrador»
 * (líneas 756–841) de `public/handoff/app-redaccion-revision.html`.
 *
 * LO QUE SE RADICA SE LEE COMO DOCUMENTO, no como pantalla: de ahí la letra de
 * la firma y el ancho de una carta. Es la única parte de la aplicación que no
 * usa la tipografía de interfaz, y esa diferencia es deliberada.
 *
 * ─── LA COLUMNA DERECHA ─────────────────────────────────────────────────────
 *
 * A la derecha, la ficha contra la que se redactó y «Trabajar el escrito». En el
 * teléfono y en el modo concentración no hay columna: en el teléfono va debajo
 * del papel, y en concentración solo queda el papel con sus acciones debajo.
 *
 * ─── «ENSEÑAR ESTILO» Y «SUGERIR JERGA», APAGADOS Y DICHO ──────────────────
 *
 * Los dos botones existían y los dos mentían. «Enseñar estilo» respondía
 * «Aprendido» mientras el servidor solo escribía una línea en el registro: no
 * guardaba nada ni lo usaba en el siguiente escrito. «Sugerir jerga» abría tres
 * sugerencias escritas a mano —las mismas para cualquier palabra— con la marca
 * «Aprendido de tu Firma». Se eligió lo honesto: siguen a la vista y cableados a
 * lo mismo, pero APAGADOS y con «Próximamente» escrito debajo, hasta que exista
 * el aprendizaje del formato de la firma. Quitarlos borraría la promesa del
 * README (§2, «el taller conserva todas sus acciones»); dejarlos encendidos
 * seguiría afirmando un aprendizaje que no ocurre.
 *
 * EN MODO OSCURO EL PAPEL SE OSCURECE PERO EL .DOCX NO, y el pie lo dice.
 */
export const LegalDraftViewer: React.FC<LegalDraftViewerProps> = ({
  draft,
  isFocusMode,
  onSaveDraft,
  avisoExterno = null,
  onSalirConCambios,
  onOpenSavedDraftsModal,
  formato,
  onAbrirTaller,
  ficha = null
}) => {
  const [editableText, setEditableText] = useState(draft.legalText);
  const [avisoDeGuardado, setAvisoDeGuardado] = useState('');
  useEffect(() => {
    if (!avisoExterno) return;
    setAvisoDeGuardado(avisoExterno.texto);
    const t = window.setTimeout(() => setAvisoDeGuardado(''), 8000);
    return () => window.clearTimeout(t);
  }, [avisoExterno]);
  /* El taller del borrador es una función de Redacción que el operador puede apagar: el botón queda gris con el aviso. */
  const tallerHabilitado = useFuncionHabilitada('REDACCION.TALLER_BORRADOR');

  const guardar = async () => {
    if (!onSaveDraft) return;
    const mensaje = await onSaveDraft(editableText);
    if (typeof mensaje === 'string' && mensaje) {
      setAvisoDeGuardado(mensaje);
      window.setTimeout(() => setAvisoDeGuardado(''), 5000);
    }
  };

  /*
   * LO EDITADO EN EL LIENZO NO SE PIERDE AL CERRAR. El texto vive aquí hasta que
   * se pulsa «Guardar»; si la pestaña se oculta o se cierra con cambios respecto
   * de lo guardado, salen en el acto con keepalive.
   *
   * Y TAMBIÉN AL DESMONTARSE. Ir a otro módulo, o abrir el taller, quitaba este
   * visor con lo editado dentro y sin aviso: la pestaña seguía visible, así que
   * ninguno de los dos oyentes llegaba a dispararse.
   */
  const ultimoTexto = React.useRef({ editado: editableText, guardado: draft.legalText });
  ultimoTexto.current = { editado: editableText, guardado: draft.legalText };
  /* En ref: App la pasa como flecha nueva en cada render y no debe re-suscribir el oyente. */
  const salirConCambios = React.useRef(onSalirConCambios);
  salirConCambios.current = onSalirConCambios;
  const haySalida = Boolean(onSalirConCambios);
  useEffect(() => {
    if (!haySalida) return;
    const vaciar = () => {
      const { editado, guardado } = ultimoTexto.current;
      if (editado !== guardado) salirConCambios.current?.(editado);
    };
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'hidden') vaciar();
    };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    window.addEventListener('pagehide', vaciar);
    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      window.removeEventListener('pagehide', vaciar);
      vaciar();
    };
  }, [haySalida]);
  const [selectedText, setSelectedText] = useState('');
  const [isJargonModalOpen, setIsJargonModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const renderedHtml = useMemo(() => {
    const raw = markdownBoldToHtml(editableText);
    /* El mismo corte que usa la columna para saltar a un párrafo: ver `parrafosDelEscrito`. */
    const withBreaks = parrafosDelEscrito(raw)
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

  /* Cableado a lo mismo de siempre; el botón está apagado mientras el servidor no aprenda nada (ver arriba). */
  const handleSaveAndTeachStyle = () => {
    void learningApi.teachStyle(draft.legalText, editableText);
  };

  /*
   * IR AL PÁRRAFO. La columna sabe en qué párrafo aparece un rótulo; el papel
   * pinta un `<p>` por párrafo con el mismo corte. Si se está editando, se
   * vuelve a la vista con formato primero: en el cuadro de edición no hay
   * párrafos a los que saltar. El señalado dura lo justo para encontrarlo.
   */
  const papelRef = useRef<HTMLDivElement>(null);
  const irAParrafo = (indice: number) => {
    const buscar = () => {
      const parrafo = papelRef.current?.querySelectorAll(':scope > p')[indice] as HTMLElement | undefined;
      if (!parrafo) return;
      parrafo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      parrafo.classList.add('cn-red-parrafo-senalado');
      window.setTimeout(() => parrafo.classList.remove('cn-red-parrafo-senalado'), 2400);
    };
    if (isEditMode) {
      setIsEditMode(false);
      window.setTimeout(buscar, 80);
    } else {
      buscar();
    }
  };

  /*
   * EN PANTALLA LO MISMO QUE EN EL PAPEL. La firma elige la letra en Membrete y
   * el lienzo la obedece.
   */
  const estiloFormato = estiloDelLienzo(formato) ?? undefined;
  /* TAMAÑO DE LECTURA, no de documento: el de Membrete sigue mandando en el PDF y el Word. */
  const letra = useTamanoDeLetra('borrador');
  const baseDeLetra = estiloFormato?.fontSize ? parseFloat(estiloFormato.fontSize) : 14.5;
  const estiloLectura: React.CSSProperties = { ...estiloFormato, fontSize: `${letra.px(baseDeLetra)}px` };

  const trabajar = (
    <section className="cn-red-trabajar" aria-label="Trabajar el escrito">
      <h2 className="cn-red-trabajar-titulo">Trabajar el escrito</h2>
      <div className="cn-red-trabajar-lista">
        {onAbrirTaller && (
          <button
            type="button"
            onClick={() => onAbrirTaller(editableText)}
            disabled={!tallerHabilitado}
            className="cn-red-trabajar-boton cn-red-trabajar-boton--marca"
            title={tallerHabilitado ? undefined : AVISO_FUNCION_DESHABILITADA}
          >
            <ClipboardCheck className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
            <span className="cn-red-trabajar-textos">
              <span>Taller</span>
              <span className="cn-red-trabajar-detalle">Resaltar, comentar, pedir otra forma de decirlo y preguntar a la guía.</span>
            </span>
          </button>
        )}

        {onOpenSavedDraftsModal && (
          <button type="button" onClick={onOpenSavedDraftsModal} className="cn-red-trabajar-boton">
            <FolderOpen className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
            Mis borradores
          </button>
        )}

        {onSaveDraft && (
          <button
            type="button"
            onClick={() => void guardar()}
            className="cn-red-trabajar-boton cn-red-trabajar-boton--marca"
            title="Guardar en el historial de la firma"
          >
            <Save className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
            Guardar
          </button>
        )}

        <button type="button" onClick={handleSaveAndTeachStyle} disabled className="cn-red-trabajar-boton">
          <BrainCircuit className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
          Enseñar estilo
        </button>
        <button type="button" onClick={() => setIsJargonModalOpen(true)} disabled className="cn-red-trabajar-boton">
          <Sparkles className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
          Sugerir jerga
        </button>
      </div>
      <p className="cn-red-trabajar-nota">Próximamente: aprender el formato y la jerga de su firma. Mientras tanto, esos dos botones no guardan ni proponen nada.</p>
    </section>
  );

  return (
    <>
      <JargonSuggestionModal
        isOpen={isJargonModalOpen}
        onClose={() => setIsJargonModalOpen(false)}
        selectedText={selectedText || 'rechazar'}
        onApplyReplacement={handleApplyReplacement}
      />

      <div className={`cn-red-borrador ${isFocusMode ? 'cn-red-borrador--foco' : ''}`}>
        {/*
          816 px COMO MÁXIMO: el ancho de una carta a 96 dpi. El visor existe para
          ver el escrito COMO SALDRÁ en Word y en PDF —líneas, cortes,
          justificado—, y con otro ancho esa vista miente. Cede si la pantalla no
          alcanza, nunca crece.
        */}
        <div className="cn-red-borrador-hoja">
          {/*
            LA CARA NUEVA TOCA EL MARCO DEL PAPEL, NUNCA SU LETRA. La familia, el
            tamaño y el interlineado siguen llegando de `estiloDelLienzo` y del
            control de letra, en el `style` de abajo.
          */}
          <div className="paper-canvas cn-red-papel relative px-8 pb-8 sm:px-14">
            {/* Editar / ver, la letra y el Taller actúan sobre el TEXTO, así que viven con el texto. */}
            <div className="cn-red-herramientas">
              <ControlDeLetra letra={letra} className="cn-red-letra" />
              {onAbrirTaller && (
                <button
                  type="button"
                  onClick={() => onAbrirTaller(editableText)}
                  disabled={!tallerHabilitado}
                  className="cn-red-herr cn-red-herr--taller"
                  title={tallerHabilitado ? 'Resaltar, comentar y conversar con la guía sobre este escrito' : AVISO_FUNCION_DESHABILITADA}
                >
                  <ClipboardCheck className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
                  Taller
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsEditMode(!isEditMode)}
                className="cn-red-herr"
                title={isEditMode ? 'Ver con formato' : 'Editar el texto'}
              >
                {isEditMode ? (
                  <Eye className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
                ) : (
                  <Pencil className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
                )}
                {isEditMode ? 'Ver' : 'Editar'}
              </button>
            </div>

            {isEditMode ? (
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                onMouseUp={handleSelection}
                onKeyUp={handleSelection}
                className="min-h-[540px] w-full resize-y break-words border-0 bg-transparent font-legal leading-[1.8] text-paper-ink focus:outline-none"
                style={estiloLectura}
              />
            ) : (
              <div
                ref={papelRef}
                className="min-h-[540px] break-words font-legal leading-[1.8] text-paper-ink [text-wrap:pretty]"
                style={estiloLectura}
                onMouseUp={handleSelection}
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            )}
          </div>

          {avisoDeGuardado && (
            <p role="status" className="cn-red-aviso-ok">
              <Check className="cn-red-aviso-ok-icono" strokeWidth={2} aria-hidden />
              <span>{avisoDeGuardado}</span>
            </p>
          )}

          {/* LA EXPORTACIÓN SALE SIEMPRE EN PAPEL BLANCO, y se dice donde alguien se lo pregunta al ver el lienzo oscuro. */}
          <p className="cn-red-exporta">
            El .docx y el PDF se exportan siempre sobre papel blanco y sin marca de Iureon: es un documento de su firma.
          </p>

          {isFocusMode && trabajar}
        </div>

        {!isFocusMode && (
          <aside className="cn-red-respaldo">
            {ficha && (
              <LoQueRespaldaElEscrito ficha={ficha} texto={editableText} jurisprudencia={draft.jurisprudenciaCitada} onIrAParrafo={irAParrafo} />
            )}
            {trabajar}
          </aside>
        )}
      </div>
    </>
  );
};
