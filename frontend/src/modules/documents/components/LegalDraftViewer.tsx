import { estiloDelLienzo, type FormatoDelEscrito } from '../formatoEnPantalla';
import React, { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Check, ClipboardCheck, Eye, FolderOpen, Pencil, Save, Scale, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';
import { JargonSuggestionModal } from './JargonSuggestionModal';
import { DraftProvenanceBar } from './DraftProvenanceBar';
import { markdownBoldToHtml } from '../services/documentExport.service';
import { learningApi } from '../../agent/services/learning.api';
import { ControlDeLetra, useTamanoDeLetra } from '../../../design/TamanoDeLetra';
import { useFuncionHabilitada } from '../../subscriptions/PlanContext';
import { AVISO_FUNCION_DESHABILITADA } from '../../subscriptions/types';

export type { GeneratedDraft } from '../types';
import type { GeneratedDraft } from '../types';

interface LegalDraftViewerProps {
  draft: GeneratedDraft;
  onExportPdf?: () => void;
  onExportWord?: () => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
  /** Guarda el texto tal como está. Si devuelve un mensaje, se muestra bajo los botones como aviso, nunca como diálogo del navegador. */
  onSaveDraft?: (updatedText: string) => void | string | Promise<string | void>;
  /** Un aviso que viene de fuera (el borrador traído del taller de revisión). Mismo sitio y misma duración que el de «Guardar». */
  avisoExterno?: { texto: string; clave: number } | null;
  /**
   * El texto editado en el lienzo, cuando la pestaña se oculta o se cierra con
   * cambios que aún no se guardaron. Debe salir con keepalive.
   */
  onSalirConCambios?: (texto: string) => void;
  onOpenSavedDraftsModal?: () => void;
  /** Tipografía, tamaño e interlineado de la firma (Membrete · Formato del escrito). Sin él, la serif por defecto. */
  formato?: FormatoDelEscrito | null;
  /** Abre el taller sobre este escrito: marcas, resaltador y chat con la guía. Recibe el texto tal como está en el lienzo. */
  onAbrirTaller?: (textoActual: string) => void;
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
  avisoExterno = null,
  onSalirConCambios,
  onOpenSavedDraftsModal,
  formato,
  onAbrirTaller
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
   * LO EDITADO EN EL LIENZO NO SE PIERDE AL CERRAR. El texto vive aquí hasta
   * que se pulsa «Guardar»; si la pestaña se oculta o se cierra con cambios
   * respecto de lo guardado, salen en el acto con keepalive.
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
    };
  }, [haySalida]);
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

  /*
   * EN PANTALLA LO MISMO QUE EN EL PAPEL. La firma elige la letra en Membrete y
   * el lienzo pintaba siempre Source Serif: el abogado cambiaba a Times y no
   * veia nada, y concluia que la app no dejaba cambiar la tipografia.
   */
  const estiloFormato = estiloDelLienzo(formato) ?? undefined;
  /*
    TAMAÑO DE LECTURA, no de documento: el de Membrete sigue mandando en el
    PDF y el Word; aquí solo se multiplica para leer en pantalla.
  */
  const letra = useTamanoDeLetra('borrador');
  const baseDeLetra = estiloFormato?.fontSize ? parseFloat(estiloFormato.fontSize) : 14.5;
  const estiloLectura: React.CSSProperties = { ...estiloFormato, fontSize: `${letra.px(baseDeLetra)}px` };

  return (
    <>
      <JargonSuggestionModal
        isOpen={isJargonModalOpen}
        onClose={() => setIsJargonModalOpen(false)}
        selectedText={selectedText || 'rechazar'}
        onApplyReplacement={handleApplyReplacement}
      />

      {/*
        816px EN PANTALLA COMPLETA: el ancho de una carta a 96dpi. En pantalla
        completa el escrito se revisa como papel, y el papel tiene un ancho.
      */}
      {/*
        816px EN PANTALLA COMPLETA, Y NO MÁS: es el ancho de una carta a 96dpi.
        Se probó ensancharlo a 1100px para aprovechar la pantalla y se volvió
        atrás el mismo día: el visor existe para ver el escrito COMO SALDRÁ en
        Word y en PDF —líneas, cortes, justificado—, y con otro ancho esa
        vista miente. El espacio sobrante a los lados es el precio de la
        fidelidad, y se paga a propósito.
      */}
      <div className={`mx-auto w-full ${isFocusMode ? 'max-w-[816px]' : 'max-w-[684px]'}`}>
        {/*
          LA BARRA DE REVISION VA ARRIBA DEL PAPEL, no al pie: el visor es donde
          se revisa ANTES de firmar, y una advertencia bajo seis paginas de
          escrito la lee quien ya decidio. Se calla cuando no hay nada que
          advertir — una barra que casi siempre dice «todo bien» se vuelve marco
          y deja de leerse el dia que dice otra cosa.
        */}
        <div className="cn-red-procedencia-caja">
          <DraftProvenanceBar procedencia={draft.procedencia} />
        </div>
        {/*
          EL PAPEL. Sin borde inferior ni radio abajo: se apoya en el fondo del
          lienzo, como una hoja que sigue más allá del recorte. Un rectángulo
          cerrado con sombra alrededor se lee como tarjeta, no como documento.
        */}
        {/*
          LA CARA NUEVA TOCA EL MARCO DEL PAPEL, NUNCA SU LETRA. Radio, sombra y
          el hueco para las herramientas son de la pantalla; la familia, el
          tamaño y el interlineado siguen llegando de `estiloDelLienzo` y del
          control de letra, en el `style` de abajo. Ninguna regla de
          `cara-nueva.css` nombra la letra del papel.
        */}
        <div className="paper-canvas cn-red-papel relative px-8 pb-8 sm:px-14">
          {/* Editar / ver y Taller actúan sobre el TEXTO, así que viven con el
              texto, arriba: el Taller también está en el pie, pero el pie queda
              seis páginas abajo y no se encontraba. */}
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
              className="min-h-[540px] break-words font-legal leading-[1.8] text-paper-ink [text-wrap:pretty]"
              style={estiloLectura}
              onMouseUp={handleSelection}
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          )}
        </div>

        {/* ─── PIE DEL ESCRITO ────────────────────────────────────────────
            Acciones sobre el TEXTO, no sobre el documento: exportar y pantalla
            completa viven arriba. Y la advertencia de la exportación, que el
            diseño exige decir donde se decide. */}
        <div className="cn-red-pie-papel">
          <button type="button" onClick={() => setIsJargonModalOpen(true)} className="cn-red-herr">
            <Sparkles className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
            Sugerir jerga
          </button>

          {onAbrirTaller && (
            <button
              type="button"
              onClick={() => onAbrirTaller(editableText)}
              disabled={!tallerHabilitado}
              className="cn-red-herr cn-red-herr--taller"
              title={tallerHabilitado ? 'Resaltar, tachar y conversar con la guía sobre este escrito' : AVISO_FUNCION_DESHABILITADA}
            >
              <ClipboardCheck className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
              Taller
            </button>
          )}

          <button type="button" onClick={handleSaveAndTeachStyle} className="cn-red-herr">
            {isStyleSaved ? (
              <>
                <Check className="cn-red-herr-icono cn-red-herr-icono--ok" strokeWidth={2} aria-hidden />
                Aprendido
              </>
            ) : (
              <>
                <BrainCircuit className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
                Enseñar estilo
              </>
            )}
          </button>

          {onOpenSavedDraftsModal && (
            <button type="button" onClick={onOpenSavedDraftsModal} className="cn-red-herr">
              <FolderOpen className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
              Mis borradores
            </button>
          )}

          {onSaveDraft && (
            <button
              type="button"
              onClick={() => void guardar()}
              className="cn-red-herr cn-red-herr--guardar"
              title="Guardar en el historial de la firma"
            >
              <Save className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
              Guardar
            </button>
          )}
        </div>

        {avisoDeGuardado && (
          <p role="status" className="cn-red-aviso-ok">
            <Check className="cn-red-aviso-ok-icono" strokeWidth={2} aria-hidden />
            <span>{avisoDeGuardado}</span>
          </p>
        )}

        {/*
          LA EXPORTACIÓN SALE SIEMPRE EN PAPEL BLANCO, y se dice aquí porque es
          donde alguien se lo pregunta al ver el lienzo oscuro. No es una opción:
          nadie quiere radicar un .docx con fondo negro.
        */}
        <p className="cn-red-exporta">
          El .docx y el PDF se exportan siempre sobre papel blanco.
        </p>

        {/* ─── LO QUE EL ESCRITO USÓ ─────────────────────────────────────*/}
        {draft.jurisprudenciaCitada.length > 0 && (
          <div className="cn-red-juris">
            <div className="cn-red-juris-cabeza">
              <Scale className="cn-red-herr-icono" strokeWidth={1.6} aria-hidden />
              <h3 className="cn-red-juris-titulo">Jurisprudencia usada</h3>
            </div>
            {/* Las providencias sí son citables: van en mono. */}
            <ul className="cn-red-juris-lista">
              {draft.jurisprudenciaCitada.map((item, idx) => (
                <li key={idx} className="cn-red-juris-item">
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
