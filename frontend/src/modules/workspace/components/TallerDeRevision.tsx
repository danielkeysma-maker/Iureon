import React from 'react';
import { AlertTriangle, ArrowLeft, Check, ClipboardCheck, Download, Eye, PenLine, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import {
  reviewApi,
  type ConsentimientoDeGuardado,
  type EdicionPropuesta,
  type InformeDeRevision,
  type TurnoDelTaller
} from '../services/review.api';
import { aplicarReemplazo, localizarCitas, segmentar } from '../services/marcas';
import { ApiError } from '../../../config/httpClient';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';

/**
 * El taller de revisión: el escrito a la izquierda, el revisor a la derecha.
 *
 * ─── QUÉ HACE ───────────────────────────────────────────────────────────────
 *
 * 1. Muestra el escrito con los pasajes que el informe citó TACHADOS, y al
 *    tocar uno enseña el reemplazo propuesto con un botón «Aplicar».
 * 2. Deja editar el texto (modo Editar: un área de texto plano, sin sorpresas).
 * 3. Un chat con el mismo revisor, que contesta sobre el texto ACTUAL: cada
 *    turno viaja con el escrito tal como está en pantalla. Si la respuesta
 *    trae ediciones, cada una lleva su botón «Aplicar».
 * 4. «Volver a revisar» emite un informe nuevo sobre el texto corregido; las
 *    marcas se recalculan.
 * 5. Descarga el texto corregido en Word o PDF con el membrete y la letra de
 *    la firma, como cualquier escrito.
 *
 * ─── DÓNDE VIVE EL TEXTO ────────────────────────────────────────────────────
 *
 * En el navegador siempre; en el servidor solo si la firma lo autorizó. La
 * cinta de arriba lo dice sin rodeos, porque «se guarda solo» y «se pierde al
 * cerrar» son dos productos distintos y el abogado tiene que saber en cuál
 * está. Un socio administrador puede autorizarlo desde aquí mismo.
 *
 * ─── EL REVISOR NO TOCA EL TEXTO ────────────────────────────────────────────
 *
 * Toda edición pasa por «Aplicar». El texto lo firma el abogado.
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

const pesos = (n: number): string => `$${Math.round(n).toLocaleString('es-CO')}`;

export const TallerDeRevision: React.FC<TallerDeRevisionProps> = ({
  datos,
  esAdminDeFirma,
  precioConsultaCop,
  precioRevisionCop,
  onCerrar,
  onSaldoCambiado,
  onExportarTexto
}) => {
  const [texto, setTexto] = React.useState(datos.texto);
  const [informe, setInforme] = React.useState<InformeDeRevision | null>(datos.informe);
  const [conversacion, setConversacion] = React.useState<TurnoDelTaller[]>(datos.conversacion);
  const [modo, setModo] = React.useState<'marcas' | 'editar'>('marcas');
  const [panel, setPanel] = React.useState<'chat' | 'informe'>('chat');
  const [marcaAbierta, setMarcaAbierta] = React.useState<number | null>(null);
  const [mensaje, setMensaje] = React.useState('');
  const [ocupado, setOcupado] = React.useState<'chat' | 'revision' | null>(null);
  const [error, setError] = React.useState('');
  const [guardado, setGuardado] = React.useState<'nunca' | 'guardando' | 'guardado' | 'sesion'>(datos.guardaTexto ? 'guardado' : 'sesion');
  const [consentimiento, setConsentimiento] = React.useState<ConsentimientoDeGuardado>({ guarda: datos.guardaTexto, por: null, el: null });
  const [autorizando, setAutorizando] = React.useState(false);
  const [vistaMovil, setVistaMovil] = React.useState<'escrito' | 'revisor'>('escrito');
  const finDelChat = React.useRef<HTMLDivElement | null>(null);
  /** La confirmación abierta, si hay: reemplaza al window.confirm del navegador. */
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);

  const citas = React.useMemo(() => (informe?.correccionesTextuales ?? []).map((c) => c.cita), [informe]);
  const { marcas, noLocalizadas } = React.useMemo(() => localizarCitas(texto, citas), [texto, citas]);
  const segmentos = React.useMemo(() => segmentar(texto, marcas), [texto, marcas]);

  /* ─── Autoguardado del texto, solo si la firma lo autorizó ───────────────── */
  const guardaEnServidor = consentimiento.guarda && datos.revisionId !== null;
  React.useEffect(() => {
    if (!guardaEnServidor || texto === datos.texto) return;
    setGuardado('guardando');
    const t = window.setTimeout(() => {
      reviewApi
        .guardarTexto(datos.revisionId as string, texto)
        .then((r) => setGuardado(r.guardado ? 'guardado' : 'sesion'))
        .catch(() => setGuardado('sesion'));
    }, 1500);
    return () => window.clearTimeout(t);
  }, [texto, guardaEnServidor, datos.revisionId, datos.texto]);

  React.useEffect(() => {
    finDelChat.current?.scrollIntoView({ block: 'end' });
  }, [conversacion.length, ocupado]);

  const aplicar = (cita: string, reemplazo: string): boolean => {
    const nuevo = aplicarReemplazo(texto, cita, reemplazo);
    if (nuevo === null) {
      setError('Ese pasaje ya no está en el texto tal como se citó; revise si lo editó a mano.');
      return false;
    }
    setTexto(nuevo);
    setMarcaAbierta(null);
    setError('');
    return true;
  };

  const enviar = async () => {
    const m = mensaje.trim();
    if (!m || ocupado || !datos.revisionId) return;
    setOcupado('chat');
    setError('');
    const turnoAbogado: TurnoDelTaller = { rol: 'abogado', texto: m, fecha: new Date().toISOString() };
    setConversacion((c) => [...c, turnoAbogado]);
    setMensaje('');
    try {
      const r = await reviewApi.chat(datos.revisionId, { mensaje: m, textoActual: texto, historial: conversacion });
      setConversacion((c) => [...c, { rol: 'revisor', texto: r.respuesta, ediciones: r.ediciones, fecha: new Date().toISOString() }]);
      onSaldoCambiado();
    } catch (err) {
      setConversacion((c) => c.filter((t) => t !== turnoAbogado));
      setMensaje(m);
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'No se pudo consultar al revisor.');
    } finally {
      setOcupado(null);
    }
  };

  const volverARevisar = async () => {
    if (ocupado || !datos.revisionId) return;
    setOcupado('revision');
    setError('');
    try {
      const r = await reviewApi.rerevisar(datos.revisionId, texto);
      setInforme(r.informe);
      setConversacion((c) => [
        ...c,
        { rol: 'revisor', texto: r.informe ? `Nueva revisión emitida. ${r.informe.resumen}` : r.informeLibre ?? 'Nueva revisión emitida.', fecha: new Date().toISOString() }
      ]);
      setPanel('informe');
      setMarcaAbierta(null);
      onSaldoCambiado();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'No se pudo revisar de nuevo.');
    } finally {
      setOcupado(null);
    }
  };

  const autorizar = async () => {
    setAutorizando(true);
    setError('');
    try {
      const c = await reviewApi.autorizarGuardado(true);
      setConsentimiento(c);
      if (c.guarda && datos.revisionId) {
        await reviewApi.guardarTexto(datos.revisionId, texto);
        setGuardado('guardado');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la autorización.');
    } finally {
      setAutorizando(false);
    }
  };

  const titulo = `${datos.documentType} corregido`;

  /*
   * Piezas como FUNCIONES de render, no componentes anidados. Un componente
   * definido dentro del render es un tipo nuevo en cada pasada: React lo
   * desmonta y lo vuelve a montar, y el area de texto pierde el foco en cada
   * tecla. Llamarlas como funciones las deja en el mismo arbol.
   */

  const Cinta = () => (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-1.5 text-[11.5px] ${
        guardaEnServidor ? 'border-line-100 bg-canvas text-ink-600' : 'border-amber-200 bg-amber-50 text-amber-900'
      }`}
    >
      {guardaEnServidor ? (
        <>
          <ShieldCheck className="h-3.5 w-3.5 text-verified" />
          <span>
            {guardado === 'guardando' ? 'Guardando…' : guardado === 'guardado' ? 'Guardado en la nube de su firma. Puede cerrar y retomar otro día.' : 'Sin guardar todavía.'}
          </span>
        </>
      ) : (
        <>
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            <span className="font-semibold">Solo en esta sesión.</span> Su firma no ha autorizado conservar escritos: al cerrar se pierden el texto y la conversación; el informe sí queda.
          </span>
          {esAdminDeFirma && datos.revisionId && (
            <button
              type="button"
              onClick={() =>
                setConfirmacion({
                  titulo: 'Autorizar que la firma conserve sus escritos',
                  texto: (
                    <>
                      Iureon conservará el texto de los escritos que su firma revise y la conversación con el revisor, para retomar el trabajo otro
                      día. Aplica a <span className="font-semibold">toda la firma</span> y queda en la auditoría con su correo. Puede retirarla
                      después.
                    </>
                  ),
                  etiqueta: 'Autorizar',
                  onConfirmar: autorizar
                })
              }
              disabled={autorizando}
              className="btn-secondary btn-sm"
            >
              {autorizando ? 'Autorizando…' : 'Autorizar guardado para la firma'}
            </button>
          )}
        </>
      )}
    </div>
  );

  const Escrito = () => (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-line-100 px-4 py-2">
        <div className="flex rounded-control border border-line-200 p-0.5">
          {(['marcas', 'editar'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setModo(m)}
              className={`flex items-center gap-1 rounded-control px-2.5 py-1 text-[12px] ${modo === m ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-600 hover:text-ink-900'}`}
            >
              {m === 'marcas' ? <Eye className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
              {m === 'marcas' ? 'Con marcas' : 'Editar'}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-ink-500">
          {marcas.length} {marcas.length === 1 ? 'pasaje marcado' : 'pasajes marcados'}
          {noLocalizadas.length > 0 && ` · ${noLocalizadas.length} no localizados en el texto actual`}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={() => onExportarTexto('word', titulo, texto)} className="btn-neutral btn-sm" title="Descargar el texto corregido en Word">
            <Download className="h-3.5 w-3.5" />
            Word
          </button>
          <button type="button" onClick={() => onExportarTexto('pdf', titulo, texto)} className="btn-neutral btn-sm" title="Descargar el texto corregido en PDF">
            <Download className="h-3.5 w-3.5" />
            PDF
          </button>
        </div>
      </div>

      {modo === 'editar' ? (
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="min-h-0 flex-1 resize-none border-0 bg-paper px-6 py-5 font-legal text-[14px] leading-[1.8] text-paper-ink focus:outline-none"
          spellCheck
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto bg-paper px-6 py-5 font-legal text-[14px] leading-[1.8] text-paper-ink">
          <p className="whitespace-pre-wrap [text-wrap:pretty]">
            {segmentos.map((s, k) =>
              s.marca === null ? (
                <React.Fragment key={k}>{s.texto}</React.Fragment>
              ) : (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMarcaAbierta(marcaAbierta === s.marca ? null : s.marca)}
                  className={`rounded-sm px-0.5 text-left line-through decoration-danger decoration-2 ${marcaAbierta === s.marca ? 'bg-amber-100' : 'bg-amber-50 hover:bg-amber-100'}`}
                  title="Pasaje citado por el revisor: toque para ver el reemplazo"
                >
                  {s.texto}
                </button>
              )
            )}
          </p>
          {marcaAbierta !== null && informe?.correccionesTextuales?.[marcaAbierta] && (
            <div className="sticky bottom-0 mt-4 rounded-card border border-line-200 bg-surface p-3 shadow-lg">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">Por qué</p>
              <p className="mt-0.5 font-sans text-[12.5px] leading-snug text-ink-700">{informe.correccionesTextuales[marcaAbierta].problema}</p>
              <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-700">Reemplazo propuesto</p>
              <p className="mt-0.5 font-sans text-[13px] leading-snug text-ink-900">«{informe.correccionesTextuales[marcaAbierta].reemplazo}»</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => aplicar(informe.correccionesTextuales![marcaAbierta].cita, informe.correccionesTextuales![marcaAbierta].reemplazo)}
                  className="btn-primary btn-sm"
                >
                  <Check className="h-3.5 w-3.5" />
                  Aplicar reemplazo
                </button>
                <button type="button" onClick={() => setMarcaAbierta(null)} className="btn-neutral btn-sm">
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const Ediciones = (ediciones: EdicionPropuesta[]) => (
    <div className="mt-2 space-y-1.5">
      {ediciones.map((e, k) => {
        const aplicable = localizarCitas(texto, [e.cita]).marcas.length > 0;
        return (
          <div key={k} className="rounded-control border border-line-200 bg-surface px-2.5 py-2 font-sans">
            <p className="text-[11px] italic leading-snug text-ink-500">«{e.cita}»</p>
            <p className="mt-1 text-[12.5px] leading-snug text-ink-900">«{e.reemplazo}»</p>
            <button
              type="button"
              onClick={() => aplicar(e.cita, e.reemplazo)}
              disabled={!aplicable}
              className="btn-secondary btn-sm mt-1.5 disabled:opacity-50"
              title={aplicable ? 'Sustituir el pasaje en el texto' : 'El pasaje citado ya no está en el texto actual'}
            >
              <Check className="h-3 w-3" />
              {aplicable ? 'Aplicar' : 'Ya no está en el texto'}
            </button>
          </div>
        );
      })}
    </div>
  );

  const Chat = () => (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {conversacion.length === 0 && (
          <p className="text-[12.5px] leading-snug text-ink-500">
            Pregúntele al revisor sobre el escrito o pídale redacciones: «reescribe la pretensión tercera como subsidiaria», «¿así queda bien el
            juramento?», «¿cómo va después de mis cambios?». Cada mensaje lleva el texto tal como está ahora y cuesta {pesos(precioConsultaCop)}.
          </p>
        )}
        {conversacion.map((t, k) => (
          <div key={k} className={`max-w-[92%] ${t.rol === 'abogado' ? 'ml-auto' : ''}`}>
            <div className={`rounded-card px-3 py-2 text-[13px] leading-relaxed ${t.rol === 'abogado' ? 'bg-brand-700 text-white' : 'border border-line-200 bg-canvas text-ink-900'}`}>
              <p className="whitespace-pre-wrap">{t.texto}</p>
              {t.rol === 'revisor' && t.ediciones && t.ediciones.length > 0 && Ediciones(t.ediciones)}
            </div>
            <p className={`mt-0.5 font-mono text-[10px] text-ink-400 ${t.rol === 'abogado' ? 'text-right' : ''}`}>
              {t.rol === 'abogado' ? 'Usted' : 'Revisor'} · {new Date(t.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}
        {ocupado === 'chat' && <p className="text-[12px] text-ink-500">El revisor está leyendo el texto actual…</p>}
        <div ref={finDelChat} />
      </div>
      <div className="border-t border-line-100 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void enviar();
              }
            }}
            rows={2}
            placeholder={datos.revisionId ? 'Escriba al revisor… (Enter envía, Shift+Enter salta de línea)' : 'El chat necesita una revisión guardada'}
            disabled={!datos.revisionId || ocupado !== null}
            className="field-area min-h-[44px] flex-1 resize-none"
          />
          <button type="button" onClick={() => void enviar()} disabled={!mensaje.trim() || ocupado !== null || !datos.revisionId} className="btn-primary btn-sm h-[44px]">
            <Send className="h-3.5 w-3.5" />
            {pesos(precioConsultaCop)}
          </button>
        </div>
      </div>
    </div>
  );

  const InformePanel = () => (
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 text-[12.5px]">
      {!informe ? (
        <p className="text-ink-500">El informe no vino por secciones; véalo en «Revisiones anteriores» o pida una nueva revisión.</p>
      ) : (
        <>
          <p className="leading-relaxed text-ink-900">{informe.resumen}</p>
          {(
            [
              ['Secciones que la norma exige y faltan', informe.seccionesFaltantes],
              ['Debilidades', informe.debilidades],
              ['Fortalezas', informe.fortalezas],
              ['Recomendaciones', informe.recomendaciones]
            ] as const
          ).map(([t, items]) =>
            items.length ? (
              <section key={t}>
                <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">{t}</h4>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-ink-800">
                  {items.map((x, k) => (
                    <li key={k}>{x}</li>
                  ))}
                </ul>
              </section>
            ) : null
          )}
          {informe.erroresDeAplicacion.length > 0 && (
            <section>
              <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">Errores de aplicación</h4>
              <ul className="mt-1 space-y-1.5">
                {informe.erroresDeAplicacion.map((e, k) => (
                  <li key={k} className="rounded-control border border-line-100 bg-canvas px-2.5 py-1.5">
                    <span className="font-mono text-[10px] text-ink-500">{e.donde}</span>
                    <p className="text-ink-900">{e.problema}</p>
                    {e.correccion && <p className="text-brand-700">Corrección: {e.correccion}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      {/* ─── Cabecera ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line-200 bg-surface px-4 py-2">
        <button type="button" onClick={onCerrar} className="btn-neutral btn-sm">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-ui font-semibold text-ink-900">
            <ClipboardCheck className="mr-1 inline h-4 w-4 text-brand-700" />
            Taller de revisión · {datos.documentType}
          </p>
          <p className="truncate text-[11px] text-ink-500">
            {datos.cliente ? `${datos.cliente} · ` : ''}
            {datos.fileName}
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setConfirmacion({
              titulo: 'Volver a revisar el escrito',
              texto: (
                <>
                  El revisor emitirá un informe nuevo sobre el texto <span className="font-semibold">tal como está ahora</span>, con sus cambios. El
                  informe anterior queda en la conversación. Se descuentan {pesos(precioRevisionCop)} del saldo de la firma.
                </>
              ),
              etiqueta: `Revisar de nuevo · ${pesos(precioRevisionCop)}`,
              onConfirmar: volverARevisar
            })
          }
          disabled={ocupado !== null || !datos.revisionId}
          className="btn-secondary btn-sm"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${ocupado === 'revision' ? 'animate-spin' : ''}`} />
          {ocupado === 'revision' ? 'Revisando…' : `Volver a revisar · ${pesos(precioRevisionCop)}`}
        </button>
      </div>
      {Cinta()}
      <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
      {error && <p className="border-b border-line-100 bg-surface px-4 py-1.5 text-[12px] text-danger">{error}</p>}

      {/* ─── En el teléfono, dos pestañas; en escritorio, dos columnas ──── */}
      <div className="flex border-b border-line-100 bg-surface lg:hidden">
        {(['escrito', 'revisor'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVistaMovil(v)}
            className={`flex-1 py-2 text-[12.5px] ${vistaMovil === v ? 'border-b-2 border-brand-700 font-semibold text-brand-700' : 'text-ink-500'}`}
          >
            {v === 'escrito' ? 'Escrito' : 'Revisor'}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className={`min-h-0 flex-1 flex-col lg:flex lg:w-[58%] lg:flex-none ${vistaMovil === 'escrito' ? 'flex' : 'hidden'}`}>
          {Escrito()}
        </div>
        <div className={`min-h-0 flex-1 flex-col border-l border-line-200 bg-surface lg:flex ${vistaMovil === 'revisor' ? 'flex' : 'hidden'}`}>
          <div className="flex border-b border-line-100">
            {(['chat', 'informe'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPanel(p)}
                className={`px-4 py-2 text-[12.5px] ${panel === p ? 'border-b-2 border-brand-700 font-semibold text-brand-700' : 'text-ink-500'}`}
              >
                {p === 'chat' ? 'Revisor' : 'Informe'}
              </button>
            ))}
          </div>
          {panel === 'chat' ? Chat() : InformePanel()}
        </div>
      </div>
    </div>
  );
};
