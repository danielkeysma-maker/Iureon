import { estiloDelLienzo, type FormatoDelEscrito } from '../formatoEnPantalla';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BrainCircuit, ClipboardCheck, Check, Eye, FolderOpen, Pencil, Save, Sparkles } from 'lucide-react';
import DOMPurify from 'dompurify';
import { markdownBoldToHtml } from '../services/documentExport.service';
import { ControlDeLetra, useTamanoDeLetra } from '../../../design/TamanoDeLetra';
import { useFuncionHabilitada } from '../../subscriptions/PlanContext';
import { AVISO_FUNCION_DESHABILITADA } from '../../subscriptions/types';
import type { ActuacionLookup } from '../../catalog/hooks/useActuacion';
import type { ActuacionRole } from '../../catalog/types';
import { EnsenarFormatoDialog } from '../../estilo/components/EnsenarFormatoDialog';
import { JergaDeLaFirma } from '../../estilo/components/JergaDeLaFirma';
import { MENSAJE_SOLO_SOCIO, TEXTO_BOTON_ENSENAR } from '../../estilo/estiloEnPantalla';
import { TEXTO_BOTON_JERGA, type SeleccionDelAbogado } from '../../estilo/jerga';
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
  /** Quién firma el escrito: el rol de la ficha si resolvió, si no el del taller. Decide a qué formato se enseña. */
  rolDelEscrito?: ActuacionRole;
  ramaDelEscrito?: string;
  /** Solo el socio administrador enseña. El servidor lo impone; aquí se apaga el botón y se dice por qué. */
  puedeEnsenarFormato?: boolean;
  /** Tras cobrar «Leer el formato», para que la barra lateral relea el saldo. */
  onSaldoCambiado?: () => void;
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
 * «Aprendido de tu Firma». Se eligió lo honesto: siguen a la vista, APAGADOS y
 * con «Próximamente» escrito debajo. Quitarlos borraría la promesa del README
 * (§2, «el taller conserva todas sus acciones»); dejarlos encendidos seguiría
 * afirmando algo que no ocurre.
 *
 * YA NO ESTÁN CABLEADOS A NADA (14 de septiembre de 2026). El diálogo de
 * sugerencias escritas a mano, el cliente de `learning.api` y las tres rutas
 * del servidor que fingían aprender se borraron: un botón apagado que apunta a
 * un simulacro es un simulacro esperando que alguien quite el `disabled`.
 *
 * «ENSEÑAR ESTE FORMATO» YA ES DE VERDAD (mismo día, más tarde). Abre
 * `EnsenarFormatoDialog`, que lee el formato en el servidor, muestra lo que se
 * guardaría y lo guarda en `estilo_lecciones`. Solo para el socio
 * administrador: a los demás el botón se les muestra apagado y con la razón,
 * porque esconderlo haría creer que la firma no tiene cómo enseñar su formato.
 *
 * «SUGERIR JERGA» TAMBIÉN ES DE VERDAD (mismo día, unidad siguiente), y ya no
 * lleva «Próximamente». Abre «Jerga de su firma» (`JergaDeLaFirma`), que busca
 * en el texto las variantes del glosario que la firma enseñó —sin modelo y sin
 * costo— y reemplaza por posición. Es para todos: leer el glosario no es del
 * socio. El texto nuevo entra por `setEditableText`, el mismo camino que la
 * edición a mano, así que «Guardar» y el guardado al salir lo recogen igual.
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
  ficha = null,
  rolDelEscrito,
  ramaDelEscrito = '',
  puedeEnsenarFormato = false,
  onSaldoCambiado
}) => {
  const [editableText, setEditableText] = useState(draft.legalText);
  const [ensenarAbierto, setEnsenarAbierto] = useState(false);
  const [jergaAbierta, setJergaAbierta] = useState(false);
  const [seleccion, setSeleccion] = useState<SeleccionDelAbogado | null>(null);
  const [avisoDeJerga, setAvisoDeJerga] = useState('');
  const areaRef = useRef<HTMLTextAreaElement>(null);
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
   * LO QUE EL ABOGADO SELECCIONÓ, para que «Jerga de su firma» liste solo eso.
   *
   * En el cuadro de edición hay posiciones exactas. En el papel no: el HTML no
   * trae los `**` del texto, así que se guarda el texto seleccionado y
   * `filtrarPorSeleccion` lo ubica. Una selección que nace o se colapsa FUERA
   * del escrito —pulsar un botón del panel— no borra la anterior: si no, la
   * selección se perdería justo al pedir la jerga.
   */
  const seleccionActual = (): SeleccionDelAbogado | null | undefined => {
    const area = areaRef.current;
    if (area && document.activeElement === area) {
      return area.selectionEnd > area.selectionStart ? { inicio: area.selectionStart, fin: area.selectionEnd } : null;
    }
    const sel = window.getSelection();
    const papel = papelRef.current;
    if (!sel || !papel || sel.rangeCount === 0 || !sel.anchorNode || !papel.contains(sel.anchorNode)) return undefined;
    const t = sel.toString();
    return t.trim() ? { texto: t } : null;
  };
  useEffect(() => {
    if (!jergaAbierta) return;
    const alCambiar = () => {
      const s = seleccionActual();
      if (s !== undefined) setSeleccion(s);
    };
    document.addEventListener('selectionchange', alCambiar);
    return () => document.removeEventListener('selectionchange', alCambiar);
    // `seleccionActual` solo lee refs y el DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jergaAbierta]);

  const alReemplazarJerga = (textoNuevo: string, aviso: string) => {
    setEditableText(textoNuevo);
    setSeleccion(null);
    setAvisoDeJerga(`${aviso} Pulse «Guardar» para dejarlo en el historial de la firma.`);
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

        <button
          type="button"
          onClick={() => setEnsenarAbierto(true)}
          disabled={!puedeEnsenarFormato}
          className="cn-red-trabajar-boton"
          title={puedeEnsenarFormato ? undefined : MENSAJE_SOLO_SOCIO}
        >
          <BrainCircuit className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
          {TEXTO_BOTON_ENSENAR}
        </button>
        {rolDelEscrito && (
          <button
            type="button"
            /* Al pulsar, la selección del papel se colapsa: se lee ANTES, en el mousedown. */
            onMouseDown={() => {
              const s = seleccionActual();
              if (s !== undefined) setSeleccion(s);
            }}
            onClick={() => {
              setJergaAbierta((a) => !a);
              setAvisoDeJerga('');
            }}
            aria-expanded={jergaAbierta}
            aria-controls="cn-jer-panel"
            className={`cn-red-trabajar-boton${jergaAbierta ? ' cn-jer-boton--abierto' : ''}`}
          >
            <Sparkles className="cn-red-herr-icono" strokeWidth={1.8} aria-hidden />
            {TEXTO_BOTON_JERGA}
          </button>
        )}
      </div>
      {!puedeEnsenarFormato && <p className="cn-red-trabajar-nota">{MENSAJE_SOLO_SOCIO}</p>}
      {avisoDeJerga && (
        <p role="status" className="cn-jer-ok">
          <Check className="cn-jer-ok-icono" strokeWidth={2} aria-hidden />
          <span>{avisoDeJerga}</span>
        </p>
      )}
      {jergaAbierta && rolDelEscrito && (
        <JergaDeLaFirma
          texto={editableText}
          citas={draft.jurisprudenciaCitada ?? []}
          rol={rolDelEscrito}
          rama={ramaDelEscrito || null}
          seleccion={seleccion}
          onQuitarSeleccion={() => setSeleccion(null)}
          onReemplazar={alReemplazarJerga}
          onCerrar={() => setJergaAbierta(false)}
        />
      )}
      {rolDelEscrito && (
        <EnsenarFormatoDialog
          abierto={ensenarAbierto}
          onCerrar={() => setEnsenarAbierto(false)}
          texto={editableText}
          documentType={draft.documentType}
          rol={rolDelEscrito}
          rama={ramaDelEscrito || null}
          puedeEnsenar={puedeEnsenarFormato}
          onSaldoCambiado={onSaldoCambiado}
        />
      )}
    </section>
  );

  return (
    <>
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
                ref={areaRef}
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                onSelect={() => {
                  if (!jergaAbierta) return;
                  const s = seleccionActual();
                  if (s !== undefined) setSeleccion(s);
                }}
                className="min-h-[540px] w-full resize-y break-words border-0 bg-transparent font-legal leading-[1.8] text-paper-ink focus:outline-none"
                style={estiloLectura}
              />
            ) : (
              <div
                ref={papelRef}
                className="min-h-[540px] break-words font-legal leading-[1.8] text-paper-ink [text-wrap:pretty]"
                style={estiloLectura}
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
