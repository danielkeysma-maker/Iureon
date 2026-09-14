import React, { useEffect, useRef, useState } from 'react';
import { useTranscription } from '../hooks/useTranscription';
import { QuienHabla, Intervenciones } from './TranscriptSegments';
import { TranscriptSummary } from './TranscriptSummary';
import { AudioPreview } from './AudioPreview';
import { NotPersistedWarning } from './RoleProposals';
import { AudienciasList } from './AudienciasList';
import { SubirAudienciaDialog } from './SubirAudienciaDialog';
import { Dialog } from '../../../design/Dialog';
import { usePlanSoloLectura } from '../../subscriptions/PlanContext';
import { transcriptionApi } from '../services/transcription.api';
import { PANTALLAS, recordado, recordar } from '../../tenant/pantallaRecordada';
import { buildSpeakerNames } from '../speakerNames';
import { toPlainText } from '../toPlainText';
import {
  conPocaCerteza,
  duracionEnPalabras,
  intervencionesEnPalabras,
  nombreLegible,
  vocesEnPalabras,
  certezaDeIntervencion
} from '../audienciaEnPantalla';
import { ROLE_LABELS, SUPPORTED_AUDIO_EXTENSIONS, type SpeakerRole, type TranscriptionKind } from '../types';

interface TranscriptionViewProps {
  kind?: TranscriptionKind;
  /**
   * Lleva la transcripcion al panel de redaccion como hechos del caso.
   *
   * ES EL PRIMARIO DE ESTA PANTALLA, no exportar: lo que un juez dijo en
   * audiencia es exactamente el material del proximo escrito.
   */
  onUsarEnRedaccion?: (texto: string) => void;
}

type Pestana = 'transcrito' | 'voces' | 'resumen';

/**
 * Audiencias, con la cara nueva. `public/handoff/app-audiencias-entrevistas.html`:
 * lista :438, subir :158, estados :248, transcrito :287, teléfono :535.
 *
 * The recording is uploaded — a court publishes it and the lawyer downloads it
 * afterwards — separated by speaker, and the lawyer names each voice. Client
 * interviews are their own screen (modules/clients/InterviewView): they share
 * this engine and nothing of the flow, because a hearing arrives as a file and
 * an interview happens in the room.
 *
 * ─── UNA SOLA VISTA PARA ESCRITORIO Y TELÉFONO ─────────────────────────────
 *
 * El escritorio tiene «Quién habla» como columna fija y dos pestañas
 * (Transcrito · Resumen y hechos); el teléfono pone las voces como TERCERA
 * pestaña y el acta como botón anclado abajo. Es la misma información en otra
 * disposición, así que la decide el CSS con `data-pestana` y no un segundo
 * componente que se desincronice del primero.
 */
export const TranscriptionView: React.FC<TranscriptionViewProps> = ({ kind = 'AUDIENCIA', onUsarEnRedaccion }) => {
  const {
    hasFirm,
    isAvailable,
    isUploading,
    uploadProgress,
    isTranscribing,
    result,
    error,
    roleProposals,
    persisted,
    maxAudioBytes,
    transcribe,
    marcarRevisada,
    marcarHechoClave,
    assignRole,
    editSegment,
    splitSegment,
    reassignSpeaker,
    voiceConflicts,
    nameProposals,
    assignSpeakerName,
    stored,
    isLoadingStored,
    loadStored,
    openStored,
    deleteStored,
    canEdit,
    reset,
    transcriptionId
  } = useTranscription(kind);

  /**
   * El archivo que el abogado eligió, mientras siga en esta pestaña. Es lo único
   * que permite escuchar: la grabación se borra del almacenamiento al
   * transcribirse.
   */
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  /** Voces confirmadas en esta sesión: su sugerencia deja de ofrecerse. */
  const [confirmed, setConfirmed] = useState<Record<string, SpeakerRole>>({});
  const [saltarA, setSaltarA] = useState<{ segundos: number; vez: number } | null>(null);
  const [pestana, setPestana] = useState<Pestana>('transcrito');
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [exportarAbierto, setExportarAbierto] = useState(false);

  useEffect(() => {
    void loadStored();
  }, [loadStored]);

  /* Con el plan vencido la lista se lee y se exporta; subir audio nuevo no se ofrece. */
  const soloLectura = usePlanSoloLectura();
  const [copied, setCopied] = useState(false);
  const [subirAbierto, setSubirAbierto] = useState(false);

  /*
   * EL NOMBRE QUE LLEVA EL ACTA. El título guardado cuando se reabrió desde la
   * lista, y el nombre del archivo tras transcribir. El título va primero: si
   * el abogado abre su copia local para escuchar, el acta no debe pasar a
   * llamarse como ese archivo.
   */
  const [openedTitle, setOpenedTitle] = useState('');
  const exportTitle = openedTitle || selectedFile?.name || 'transcripcion';

  /*
   * After a reload the hearing that was open comes back, through the same path
   * as a click on its row — once the list is here, once per mount, and only if
   * it is still in the list.
   */
  const restaurada = useRef(false);
  useEffect(() => {
    if (restaurada.current || stored.length === 0) return;
    restaurada.current = true;
    if (result) return;
    const id = recordado(PANTALLAS.transcripcion(kind));
    if (!id) return;
    const item = stored.find((i) => i.id === id);
    if (!item) {
      recordar(PANTALLAS.transcripcion(kind), null);
      return;
    }
    setOpenedTitle(item.title);
    openStored(item);
  }, [stored, result, kind, openStored]);

  /*
   * EL DIÁLOGO DE SUBIR SE CIERRA CUANDO HAY TRANSCRITO, NO CUANDO LA PROMESA
   * TERMINA. `transcribe` atrapa su propio error y resuelve igual: cerrarlo en
   * el `.then` escondía el mensaje de fallo justo cuando había que leerlo.
   */
  useEffect(() => {
    if (result && subirAbierto) setSubirAbierto(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  /* Otra audiencia empieza en su transcrito, no en la pestaña que dejó la anterior. */
  useEffect(() => {
    setPestana('transcrito');
    setMenuAbierto(false);
  }, [transcriptionId]);

  /*
   * LAS VARIANTES DEL ACTA. Por defecto CON minutos: el minuto es lo que hace
   * citable una intervención. «Solo las marcadas» no se ofrece mientras nadie
   * haya marcado nada: saldría un acta vacía.
   */
  const [conMarcasDeTiempo, setConMarcasDeTiempo] = useState(true);
  const [soloClave, setSoloClave] = useState(false);
  const hayClaves = (result?.segments ?? []).some((s) => s.hechoClave);
  const variante = { conMarcasDeTiempo, soloClave: soloClave && hayClaves };

  /*
   * El ACTA con datos reales — y SIN RED. Todo sale de la fila que la lista ya
   * tiene en memoria: la hora de autorización, quién revisó, y el resumen si
   * alguna vez se generó.
   */
  const armarActa = () => {
    if (!transcriptionId) return undefined;
    const fila = stored.find((i) => i.id === transcriptionId);
    return {
      autorizadoEl: fila?.autorizo_grabacion_el ?? null,
      revisadaPor: fila?.revisada_por ?? null,
      actaLista: fila?.estado_revision === 'ACTA_LISTA',
      hechosClave: fila?.resumen?.hechos,
      decision: fila?.decision,
      decisionMotivo: fila?.decision_motivo ?? null
    };
  };

  const textoPlano = (): string =>
    result ? toPlainText(result.segments, buildSpeakerNames(result.segments, ROLE_LABELS)) : '';

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(textoPlano());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportar = (formato: 'word' | 'pdf') => {
    if (!result) return;
    void import('../transcriptExport').then((m) =>
      formato === 'word'
        ? m.exportTranscriptToWord(result, exportTitle, armarActa(), variante)
        : m.exportTranscriptToPdf(result, exportTitle, armarActa(), variante)
    );
    setExportarAbierto(false);
  };

  const handleStartOver = () => {
    reset();
    setSelectedFile(null);
    setOpenedTitle('');
    setSaltarA(null);
    // Cleared too, or the next recording opens with the previous hearing's
    // confirmations already applied and its suggestions hidden.
    setConfirmed({});
  };

  const modulo = kind === 'AUDIENCIA' ? 'Audiencias' : 'Entrevistas';

  /* ─── LA LISTA ───────────────────────────────────────────────────────── */
  const lista = (
    <div className="cn-aud-pantalla">
      <div className="cn-aud-marco">
        <header className="cn-aud-cabeza">
          <div className="cn-aud-cabeza-textos">
            <h1 className="cn-aud-h1">{modulo}</h1>
            <p className="cn-aud-bajada">Suba la grabación y reciba el transcrito con cada interlocutor separado.</p>
          </div>
          {/*
            El primario del módulo: la audiencia es un archivo que LLEGA — el
            juzgado la publica y el abogado la trae —, no un evento que se
            inicia. Por eso aquí se sube, y en Entrevistas se graba.
          */}
          {!soloLectura && (
            <button
              type="button"
              onClick={() => {
                reset();
                setSubirAbierto(true);
              }}
              className="cn-ini-boton cn-ini-boton--primario cn-aud-boton cn-aud-subir"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
                <polyline points="8 9 12 5 16 9" />
                <line x1="12" y1="5" x2="12" y2="16" />
              </svg>
              Subir una grabación
            </button>
          )}
        </header>

        {/*
          Dos problemas distintos, dos mensajes. Uno solo nombraba el
          equivocado: sin firma el estado volvía 401 y la pantalla pedía
          configurar una llave que ya estaba bien.
        */}
        {isAvailable === false && (
          <div className="cn-aud-aviso cn-aud-aviso--advertencia" role="status">
            <p className="cn-aud-aviso-titulo">El motor de transcripción no está configurado en el servidor</p>
            <p className="cn-aud-aviso-texto">
              Falta la variable <span className="cn-aud-mono">DEEPGRAM_API_KEY</span>. Puede preparar el envío, pero la
              transcripción fallará hasta que se configure.
            </p>
          </div>
        )}
        {isAvailable && !hasFirm && (
          <div className="cn-aud-aviso cn-aud-aviso--advertencia" role="status">
            <p className="cn-aud-aviso-titulo">Todavía no hay una firma registrada</p>
            <p className="cn-aud-aviso-texto">
              El motor está listo, pero la transcripción necesita una firma para guardarse: regístrela desde el menú
              lateral.
            </p>
          </div>
        )}
        {error && !subirAbierto && (
          <div className="cn-aud-aviso cn-aud-aviso--peligro" role="alert">
            <p className="cn-aud-aviso-texto">{error}</p>
          </div>
        )}

        <AudienciasList
          items={stored}
          isLoading={isLoadingStored}
          onOpen={(item) => {
            setOpenedTitle(item.title);
            /* La copia local era de otra grabación: escucharla aquí sonaría a otra audiencia. */
            setSelectedFile(null);
            setSaltarA(null);
            openStored(item);
          }}
          onDelete={deleteStored}
          onRefresh={() => void loadStored()}
          onMarcarRevision={(id, estado) => {
            void transcriptionApi.marcarRevision(id, estado).then(() => void loadStored());
          }}
          onSubir={
            soloLectura
              ? undefined
              : () => {
                  reset();
                  setSubirAbierto(true);
                }
          }
        />
      </div>
    </div>
  );

  /* ─── EL TRANSCRITO ──────────────────────────────────────────────────── */
  const pocas = result ? conPocaCerteza(result.segments) : 0;
  const irALaPrimeraDudosa = () => {
    if (!result) return;
    const i = result.segments.findIndex((s) => certezaDeIntervencion(s).baja);
    setPestana('transcrito');
    window.setTimeout(() => document.getElementById(`intervencion-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
  };

  const pestanaBoton = (id: Pestana, texto: string, soloMovil = false) => (
    <button
      key={id}
      type="button"
      role="tab"
      aria-selected={pestana === id}
      onClick={() => setPestana(id)}
      className={`cn-aud-pestana${soloMovil ? ' cn-aud-pestana--movil' : ''}`}
    >
      {texto}
    </button>
  );

  const detalle = result ? (
    <div className="cn-aud-detalle">
      <header className="cn-aud-barra">
        <button type="button" onClick={handleStartOver} className="cn-aud-volver" aria-label={`Volver a ${modulo}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span className="cn-aud-volver-texto">{modulo}</span>
        </button>

        <div className="cn-aud-barra-titulos">
          <p className="cn-aud-barra-titulo">{nombreLegible(exportTitle)}</p>
          <p className="cn-aud-barra-meta">
            <span className="cn-aud-solo-escritorio">
              {[
                new Date(result.transcribedAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }),
                duracionEnPalabras(result.durationSeconds),
                intervencionesEnPalabras(result.segments.length)
              ]
                .filter(Boolean)
                .join(' · ')}
            </span>
            <span className="cn-aud-solo-movil">
              {vocesEnPalabras(result.speakerLabels.length)} · {intervencionesEnPalabras(result.segments.length)}
            </span>
          </p>
        </div>

        <div className="cn-aud-pestanas" role="tablist" aria-label="Vista del transcrito">
          {pestanaBoton('transcrito', 'Transcrito')}
          {pestanaBoton('voces', `Quién habla · ${result.speakerLabels.length}`, true)}
          {pestanaBoton('resumen', 'Resumen y hechos')}
        </div>

        <div className="cn-aud-barra-acciones">
          <button type="button" onClick={() => void handleCopy()} className="cn-ini-boton cn-ini-boton--suave cn-aud-boton">
            {copied ? 'Copiado' : 'Copiar el texto'}
          </button>
          <button type="button" onClick={() => setExportarAbierto(true)} className="cn-ini-boton cn-ini-boton--suave cn-aud-boton">
            Exportar acta
          </button>
          {onUsarEnRedaccion && (
            <button
              type="button"
              onClick={() => onUsarEnRedaccion(textoPlano())}
              className="cn-ini-boton cn-ini-boton--primario cn-aud-boton"
            >
              Usar en redacción
            </button>
          )}
        </div>

        <div className="cn-aud-mas">
          <button
            type="button"
            className="cn-aud-icono"
            aria-label="Más opciones"
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <circle cx="12" cy="5" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="12" cy="19" r="1.7" />
            </svg>
          </button>
          {menuAbierto && (
            <>
              <button type="button" className="cn-aud-menu-velo" aria-label="Cerrar el menú" onClick={() => setMenuAbierto(false)} />
              <span className="cn-aud-menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="cn-aud-menu-item"
                  onClick={() => {
                    setMenuAbierto(false);
                    void handleCopy();
                  }}
                >
                  {copied ? 'Copiado' : 'Copiar el texto'}
                </button>
                {onUsarEnRedaccion && (
                  <button
                    type="button"
                    role="menuitem"
                    className="cn-aud-menu-item"
                    onClick={() => {
                      setMenuAbierto(false);
                      onUsarEnRedaccion(textoPlano());
                    }}
                  >
                    Usar en redacción
                  </button>
                )}
              </span>
            </>
          )}
        </div>
      </header>

      <div className="cn-aud-cuerpo">
        <aside className="cn-aud-voces" aria-label="Quién habla">
          <QuienHabla
            result={result}
            kind={kind}
            onAssignRole={assignRole}
            nameProposals={nameProposals}
            onAssignSpeakerName={canEdit ? assignSpeakerName : undefined}
            roleProposals={roleProposals}
            rolesConfirmados={confirmed}
            onConfirmarRol={(speakerLabel, role) => {
              assignRole(speakerLabel, role);
              setConfirmed((current) => ({ ...current, [speakerLabel]: role }));
            }}
          />
        </aside>

        <div className="cn-aud-principal">
          <section className="cn-aud-zona cn-aud-zona--transcrito" aria-label="Transcrito">
            {/*
              LA ADVERTENCIA VA ENCIMA DEL TEXTO, no al pie: se lee antes de
              citar, no después de haber citado.
            */}
            <div className="cn-aud-franja">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <line x1="12" y1="8" x2="12" y2="13" />
                <circle cx="12" cy="16.4" r=".7" fill="currentColor" />
              </svg>
              <p>
                Transcripción automática. <span className="cn-aud-fuerte">No sustituye el acta oficial del despacho ni la grabación</span>, que prevalecen. Lo subrayado con onda es una intervención que el motor entendió con poca certeza: vuelva a escucharla antes de citarla.
              </p>
            </div>

            <div className="cn-aud-zona-cuerpo">
              {!persisted && <NotPersistedWarning onCopiar={() => void handleCopy()} onExportar={() => setExportarAbierto(true)} />}

              {/*
                LOS ERRORES DE UNA CORRECCIÓN, UN CORTE O UN ROL, AQUÍ. El único
                otro lugar donde se pintaban era el diálogo de subir, que no
                existe con un transcrito abierto: la edición quedaba en pantalla
                con cara de guardada mientras el servidor tenía el texto viejo.
              */}
              {error && (
                <div className="cn-aud-aviso cn-aud-aviso--peligro" role="alert">
                  <p className="cn-aud-aviso-texto">{error} La pantalla se devolvió a lo último que sí quedó guardado.</p>
                </div>
              )}

              {/*
                POCA CERTEZA, CONTADA (artboard :248, «El audio está demasiado
                bajo»). Sin «tramos ininteligibles» —el motor no los produce— y
                sin «se le cobró la duración procesada» —no se cobra—.
              */}
              {pocas > 0 && (
                <div className="cn-aud-aviso cn-aud-aviso--advertencia">
                  <p className="cn-aud-aviso-titulo">
                    {pocas === 1 ? '1 intervención quedó con poca certeza' : `${pocas} intervenciones quedaron con poca certeza`}
                  </p>
                  <p className="cn-aud-aviso-texto">
                    Están subrayadas con onda y llevan su porcentaje. Vuelva a escucharlas antes de citarlas.
                  </p>
                  <div className="cn-aud-aviso-botones">
                    <button type="button" className="cn-ini-boton cn-ini-boton--blanco cn-aud-boton" onClick={irALaPrimeraDudosa}>
                      Ir a la primera
                    </button>
                  </div>
                </div>
              )}

              <Intervenciones
                result={result}
                kind={kind}
                onEditSegment={canEdit ? editSegment : undefined}
                onSplitSegment={canEdit ? splitSegment : undefined}
                onReassignSpeaker={canEdit ? reassignSpeaker : undefined}
                onMarcarRevisada={canEdit ? marcarRevisada : undefined}
                onMarcarHechoClave={marcarHechoClave}
                voiceConflicts={voiceConflicts}
                onEscucharDesde={selectedFile ? (segundos) => setSaltarA({ segundos, vez: Date.now() }) : undefined}
              />
            </div>
          </section>

          <section className="cn-aud-zona cn-aud-zona--resumen" aria-label="Resumen y hechos">
            <div className="cn-aud-zona-cuerpo">
              {transcriptionId ? (
                <TranscriptSummary transcriptionId={transcriptionId} kind={kind} />
              ) : (
                <p className="cn-aud-nota cn-aud-nota--caja">
                  El resumen se genera sobre el transcrito guardado, y este no se pudo guardar.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>

      {/*
        EL REPRODUCTOR, ANCLADO ABAJO, solo con la copia local. Sin ella se dice
        que la grabación no se conserva y se ofrece abrir el archivo de este
        equipo, que se reproduce aquí y no se sube a ninguna parte.
      */}
      <div className="cn-aud-escucha">
        {selectedFile ? (
          <AudioPreview file={selectedFile} anclado saltarA={saltarA} />
        ) : (
          <div className="cn-aud-sin-grabacion">
            <p className="cn-aud-nota">
              La grabación no se conserva: se borró al transcribirse. Si tiene el archivo en este equipo, ábralo para
              escucharlo mientras revisa; no se sube a ninguna parte.
            </p>
            <label className="cn-ini-boton cn-ini-boton--texto cn-aud-boton">
              Abrir el archivo de este equipo
              <input
                type="file"
                className="cn-aud-sr"
                accept={SUPPORTED_AUDIO_EXTENSIONS.map((e) => `.${e}`).join(',')}
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        )}
      </div>

      <div className="cn-aud-pie-movil">
        <button type="button" onClick={() => setExportarAbierto(true)} className="cn-ini-boton cn-ini-boton--primario cn-aud-boton cn-aud-boton--ancho">
          Exportar acta
        </button>
      </div>

      {/* ─── EXPORTAR EL ACTA (derivada de las variantes que ya existían) ─── */}
      <div className="cn-aud-dialogos">
        <Dialog
          abierto={exportarAbierto}
          onCerrar={() => setExportarAbierto(false)}
          tamano="S"
          titulo="Exportar el acta"
          subtitulo="Word para editarla; PDF para anexarla al expediente."
          acciones={
            <>
              <button type="button" className="cn-ini-boton cn-ini-boton--suave cn-aud-boton" onClick={() => exportar('word')}>
                Word
              </button>
              <button type="button" className="cn-ini-boton cn-ini-boton--primario cn-aud-boton" onClick={() => exportar('pdf')}>
                PDF
              </button>
            </>
          }
        >
          <div className="cn-aud-dlg">
            <label className="cn-aud-casilla">
              <input type="checkbox" checked={conMarcasDeTiempo} onChange={(e) => setConMarcasDeTiempo(e.target.checked)} />
              <span>
                <span className="cn-aud-casilla-titulo">Con minutos</span>
                <span className="cn-aud-nota">El minuto es lo que hace citable cada intervención.</span>
              </span>
            </label>
            <label className={`cn-aud-casilla${hayClaves ? '' : ' cn-aud-casilla--apagada'}`}>
              <input type="checkbox" checked={soloClave && hayClaves} disabled={!hayClaves} onChange={(e) => setSoloClave(e.target.checked)} />
              <span>
                <span className="cn-aud-casilla-titulo">Solo los hechos clave</span>
                <span className="cn-aud-nota">
                  {hayClaves
                    ? 'Solo las intervenciones que alguien marcó como decisivas.'
                    : 'Marque alguna intervención como hecho clave para poder exportar solo esas.'}
                </span>
              </span>
            </label>
          </div>
        </Dialog>
      </div>
    </div>
  ) : null;

  const contenido = (
    <>
      {result ? detalle : lista}
      <SubirAudienciaDialog
        abierto={subirAbierto}
        onCerrar={() => setSubirAbierto(false)}
        maxAudioBytes={maxAudioBytes}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        isTranscribing={isTranscribing}
        error={error}
        onTranscribir={(archivo, contexto, expedienteId) => {
          setSelectedFile(archivo);
          setOpenedTitle('');
          void transcribe(archivo, contexto, undefined, expedienteId || undefined);
        }}
      />
    </>
  );

  /*
   * LA VISITA GUIADA BUSCA EL ATRIBUTO LITERAL. Con una plantilla —
   * `vista-${…}`— el marcado servido es el mismo, pero ningún check puede leer
   * en el código qué pantalla lleva qué ancla, y un renombre la rompería sin
   * que nada lo dijera. Dos raíces con el valor escrito.
   */
  return kind === 'AUDIENCIA' ? (
    <div data-visita="vista-audiencias" className="cara-nueva cn-aud" data-pestana={pestana} data-con-transcrito={result ? 'si' : 'no'}>
      {contenido}
    </div>
  ) : (
    <div data-visita="vista-entrevistas" className="cara-nueva cn-aud" data-pestana={pestana} data-con-transcrito={result ? 'si' : 'no'}>
      {contenido}
    </div>
  );
};
