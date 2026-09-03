import React from 'react';
import { AlertTriangle, ArrowLeft, Check, ClipboardCheck, Download, Eraser, Eye, Highlighter, PenLine, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import type { Anotacion, EdicionPropuesta, InformeDeRevision, RespuestaDelChat, TurnoDelTaller } from '../services/review.api';
import { aplicarReemplazo, localizarCitas, marcasDeAnotaciones, segmentarCapas, type MarcaEnCapa } from '../services/marcas';
import { ApiError } from '../../../config/httpClient';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';

/**
 * El taller: el escrito a la izquierda, la guía a la derecha. Sirve igual para
 * un escrito revisado (con informe) y para un borrador generado en Redacción
 * (sin informe): quien lo monta le pasa cómo conversar, cómo guardar y qué
 * decir sobre dónde vive el texto.
 *
 * ─── TRES CAPAS DE MARCAS SOBRE EL MISMO TEXTO ──────────────────────────────
 *
 * · Citas del informe: tachado rojo sobre ámbar; al tocar, el reemplazo con
 *   «Aplicar».
 * · Referencias de la última respuesta de la guía: subrayado azul. Cuando la
 *   guía dice «el párrafo de hechos está bien», ese párrafo se ilumina; la
 *   siguiente respuesta las sustituye.
 * · Resaltador del abogado: cuatro colores y tachado, a mano, seleccionando
 *   texto en la vista con marcas. Se anclan al texto citado, no a posiciones,
 *   así sobreviven a las ediciones; si el pasaje desaparece, la marca también.
 *
 * ─── LAS PIEZAS SON FUNCIONES, NO COMPONENTES ───────────────────────────────
 *
 * Un componente definido dentro del render es un tipo nuevo en cada pasada:
 * React lo remonta y el área de texto pierde el foco en cada tecla.
 */

export type ColorDeResaltado = Anotacion['color'];

export interface DatosDelEscrito {
  /** Título de la cabecera: «Acción de tutela», «Derecho de petición corregido»… */
  titulo: string;
  subtitulo: string;
  texto: string;
  informe: InformeDeRevision | null;
  conversacion: TurnoDelTaller[];
  anotaciones: Anotacion[];
}

export interface TallerDeEscritoProps {
  datos: DatosDelEscrito;
  precioConsultaCop: number;
  /** Si existe, aparece «Volver a revisar» con este precio. */
  precioRevisionCop?: number;
  /** Qué dice la cinta sobre dónde vive el texto, y si se guarda solo. */
  guardado: { activo: boolean; aviso: React.ReactNode; accion?: { etiqueta: string; onClick: () => Promise<void> | void } };
  onGuardar?: (texto: string, conversacion: TurnoDelTaller[], anotaciones: Anotacion[]) => Promise<boolean>;
  onChat: (mensaje: string, textoActual: string, historial: TurnoDelTaller[]) => Promise<RespuestaDelChat>;
  onRerevisar?: (textoActual: string) => Promise<{ informe: InformeDeRevision | null; informeLibre: string | null }>;
  onExportarTexto: (formato: 'pdf' | 'word', texto: string) => void;
  onCerrar: (textoFinal: string) => void;
  onSaldoCambiado: () => void;
}

const pesos = (n: number): string => `$${Math.round(n).toLocaleString('es-CO')}`;

const COLORES: { id: ColorDeResaltado; nombre: string; clase: string }[] = [
  { id: 'amarillo', nombre: 'Amarillo', clase: 'bg-yellow-200/80' },
  { id: 'verde', nombre: 'Verde', clase: 'bg-green-200/80' },
  { id: 'azul', nombre: 'Azul', clase: 'bg-sky-200/80' },
  { id: 'rosa', nombre: 'Rosa', clase: 'bg-pink-200/80' },
  { id: 'tachado', nombre: 'Tachar', clase: 'line-through decoration-ink-700 decoration-2' }
];

const claseDeCapas = (capas: MarcaEnCapa[], abierta: number | null): string => {
  const clases: string[] = [];
  for (const c of capas) {
    if (c.capa === 'cita') clases.push(`line-through decoration-danger decoration-2 ${abierta === c.indice ? 'bg-amber-200' : 'bg-amber-50'}`);
    else if (c.capa === 'referencia') clases.push('underline decoration-sky-500 decoration-2 underline-offset-4');
    else {
      const color = COLORES.find((x) => x.id === c.capa);
      if (color) clases.push(color.clase);
    }
  }
  return clases.join(' ');
};

export const TallerDeEscrito: React.FC<TallerDeEscritoProps> = ({
  datos,
  precioConsultaCop,
  precioRevisionCop,
  guardado,
  onGuardar,
  onChat,
  onRerevisar,
  onExportarTexto,
  onCerrar,
  onSaldoCambiado
}) => {
  const [texto, setTexto] = React.useState(datos.texto);
  const [informe, setInforme] = React.useState<InformeDeRevision | null>(datos.informe);
  const [conversacion, setConversacion] = React.useState<TurnoDelTaller[]>(datos.conversacion);
  const [anotaciones, setAnotaciones] = React.useState<Anotacion[]>(datos.anotaciones);
  const [referencias, setReferencias] = React.useState<string[]>([]);
  const [modo, setModo] = React.useState<'marcas' | 'editar'>('marcas');
  const [panel, setPanel] = React.useState<'chat' | 'informe'>(datos.informe ? 'chat' : 'chat');
  const [citaAbierta, setCitaAbierta] = React.useState<number | null>(null);
  const [mensaje, setMensaje] = React.useState('');
  const [ocupado, setOcupado] = React.useState<'chat' | 'revision' | null>(null);
  const [error, setError] = React.useState('');
  const [estadoGuardado, setEstadoGuardado] = React.useState<'quieto' | 'guardando' | 'guardado' | 'fallo'>('quieto');
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
  const [vistaMovil, setVistaMovil] = React.useState<'escrito' | 'revisor'>('escrito');
  const [seleccion, setSeleccion] = React.useState<{ texto: string; x: number; y: number } | null>(null);
  const finDelChat = React.useRef<HTMLDivElement | null>(null);
  const lienzo = React.useRef<HTMLParagraphElement | null>(null);

  /* ─── Las marcas, en sus capas ───────────────────────────────────────────── */
  const citas = React.useMemo(() => (informe?.correccionesTextuales ?? []).map((c) => c.cita), [informe]);
  const marcasDeCitas = React.useMemo(() => localizarCitas(texto, citas), [texto, citas]);
  const marcas: MarcaEnCapa[] = React.useMemo(
    () => [
      ...marcasDeCitas.marcas.map((m) => ({ ...m, capa: 'cita' })),
      ...localizarCitas(texto, referencias).marcas.map((m) => ({ ...m, capa: 'referencia' })),
      ...marcasDeAnotaciones(texto, anotaciones)
    ],
    [texto, marcasDeCitas, referencias, anotaciones]
  );
  const segmentos = React.useMemo(() => segmentarCapas(texto, marcas), [texto, marcas]);

  /* ─── Guardado con retardo ───────────────────────────────────────────────── */
  const primeraPasada = React.useRef(true);
  React.useEffect(() => {
    if (primeraPasada.current) {
      primeraPasada.current = false;
      return;
    }
    if (!onGuardar || !guardado.activo) return;
    setEstadoGuardado('guardando');
    const t = window.setTimeout(() => {
      onGuardar(texto, conversacion, anotaciones)
        .then((ok) => setEstadoGuardado(ok ? 'guardado' : 'fallo'))
        .catch(() => setEstadoGuardado('fallo'));
    }, 1500);
    return () => window.clearTimeout(t);
  }, [texto, conversacion, anotaciones, onGuardar, guardado.activo]);

  React.useEffect(() => {
    finDelChat.current?.scrollIntoView({ block: 'end' });
  }, [conversacion.length, ocupado]);

  /* ─── Selección para el resaltador ───────────────────────────────────────── */
  const capturarSeleccion = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !lienzo.current || !sel.anchorNode || !lienzo.current.contains(sel.anchorNode)) {
      setSeleccion(null);
      return;
    }
    const t = sel.toString().replace(/\s+/g, ' ').trim();
    if (t.length < 2) {
      setSeleccion(null);
      return;
    }
    const r = sel.getRangeAt(0).getBoundingClientRect();
    const caja = lienzo.current.getBoundingClientRect();
    setSeleccion({ texto: t, x: r.left - caja.left + r.width / 2, y: r.top - caja.top });
  };

  const resaltar = (color: ColorDeResaltado) => {
    if (!seleccion) return;
    setAnotaciones((xs) => [...xs.filter((a) => a.cita !== seleccion.texto), { cita: seleccion.texto, color }]);
    setSeleccion(null);
    window.getSelection()?.removeAllRanges();
  };

  const quitarMarcaEn = (segmentoCapas: MarcaEnCapa[]) => {
    const propias = segmentoCapas.filter((c) => c.capa !== 'cita' && c.capa !== 'referencia');
    if (!propias.length) return;
    setAnotaciones((xs) => xs.filter((_, k) => !propias.some((p) => p.indice === k)));
  };

  /* ─── Acciones ───────────────────────────────────────────────────────────── */
  const aplicar = (cita: string, reemplazo: string) => {
    const nuevo = aplicarReemplazo(texto, cita, reemplazo);
    if (nuevo === null) {
      setError('Ese pasaje ya no está en el texto tal como se citó; revise si lo editó a mano.');
      return;
    }
    setTexto(nuevo);
    setCitaAbierta(null);
    setError('');
  };

  const enviar = async () => {
    const m = mensaje.trim();
    if (!m || ocupado) return;
    setOcupado('chat');
    setError('');
    const turnoAbogado: TurnoDelTaller = { rol: 'abogado', texto: m, fecha: new Date().toISOString() };
    setConversacion((c) => [...c, turnoAbogado]);
    setMensaje('');
    try {
      const r = await onChat(m, texto, conversacion);
      setConversacion((c) => [...c, { rol: 'revisor', texto: r.respuesta, ediciones: r.ediciones, referencias: r.referencias, fecha: new Date().toISOString() }]);
      setReferencias(r.referencias ?? []);
      onSaldoCambiado();
    } catch (err) {
      setConversacion((c) => c.filter((t) => t !== turnoAbogado));
      setMensaje(m);
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'No se pudo consultar a la guía.');
    } finally {
      setOcupado(null);
    }
  };

  const rerevisar = async () => {
    if (!onRerevisar || ocupado) return;
    setOcupado('revision');
    setError('');
    try {
      const r = await onRerevisar(texto);
      setInforme(r.informe);
      setConversacion((c) => [
        ...c,
        { rol: 'revisor', texto: r.informe ? `Nueva revisión emitida. ${r.informe.resumen}` : (r.informeLibre ?? 'Nueva revisión emitida.'), fecha: new Date().toISOString() }
      ]);
      setPanel('informe');
      setCitaAbierta(null);
      onSaldoCambiado();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'No se pudo revisar de nuevo.');
    } finally {
      setOcupado(null);
    }
  };

  /* ─── Piezas (funciones de render) ───────────────────────────────────────── */

  const Cinta = () => (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-1.5 text-[11.5px] ${guardado.activo ? 'border-line-100 bg-canvas text-ink-600' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
      {guardado.activo ? <ShieldCheck className="h-3.5 w-3.5 text-verified" /> : <AlertTriangle className="h-3.5 w-3.5" />}
      <span>
        {guardado.aviso}
        {guardado.activo && estadoGuardado === 'guardando' && ' · guardando…'}
        {guardado.activo && estadoGuardado === 'fallo' && ' · el último cambio no se pudo guardar'}
      </span>
      {guardado.accion && (
        <button type="button" onClick={() => void guardado.accion?.onClick()} className="btn-secondary btn-sm">
          {guardado.accion.etiqueta}
        </button>
      )}
    </div>
  );

  const Escrito = () => (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line-100 px-4 py-2">
        <div className="flex rounded-control border border-line-200 p-0.5">
          {(['marcas', 'editar'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setModo(m);
                setSeleccion(null);
              }}
              className={`flex items-center gap-1 rounded-control px-2.5 py-1 text-[12px] ${modo === m ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-600 hover:text-ink-900'}`}
            >
              {m === 'marcas' ? <Eye className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
              {m === 'marcas' ? 'Con marcas' : 'Editar'}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-ink-500">
          {modo === 'marcas' ? (
            <>
              <Highlighter className="mr-1 inline h-3 w-3" />
              Seleccione texto para resaltar o tachar
              {marcasDeCitas.marcas.length > 0 && ` · ${marcasDeCitas.marcas.length} ${marcasDeCitas.marcas.length === 1 ? 'pasaje citado' : 'pasajes citados'}`}
              {anotaciones.length > 0 && ` · ${anotaciones.length} ${anotaciones.length === 1 ? 'marca suya' : 'marcas suyas'}`}
            </>
          ) : (
            'Edite el texto; las marcas se reubican solas al volver a «Con marcas».'
          )}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {anotaciones.length > 0 && modo === 'marcas' && (
            <button type="button" onClick={() => setAnotaciones([])} className="btn-neutral btn-sm" title="Quitar todos sus resaltados y tachados">
              <Eraser className="h-3.5 w-3.5" />
              Limpiar marcas
            </button>
          )}
          <button type="button" onClick={() => onExportarTexto('word', texto)} className="btn-neutral btn-sm" title="Descargar el texto en Word">
            <Download className="h-3.5 w-3.5" />
            Word
          </button>
          <button type="button" onClick={() => onExportarTexto('pdf', texto)} className="btn-neutral btn-sm" title="Descargar el texto en PDF">
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
        <div className="relative min-h-0 flex-1 overflow-y-auto bg-paper px-6 py-5 font-legal text-[14px] leading-[1.8] text-paper-ink" onMouseUp={capturarSeleccion} onTouchEnd={capturarSeleccion}>
          {seleccion && (
            <div
              className="absolute z-10 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-card border border-line-200 bg-surface p-1 shadow-lg"
              style={{ left: Math.max(90, seleccion.x + 24), top: Math.max(0, seleccion.y + 12) }}
              onMouseDown={(e) => e.preventDefault()}
            >
              {COLORES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => resaltar(c.id)}
                  className={`h-7 min-w-7 rounded-control border border-line-200 px-1.5 font-sans text-[11px] text-ink-900 ${c.id === 'tachado' ? '' : c.clase}`}
                  title={c.nombre}
                >
                  {c.id === 'tachado' ? <span className="line-through">abc</span> : ''}
                </button>
              ))}
              <button type="button" onClick={() => setSeleccion(null)} className="h-7 rounded-control px-1.5 font-sans text-[11px] text-ink-500" title="Cancelar">
                ✕
              </button>
            </div>
          )}
          <p ref={lienzo} className="whitespace-pre-wrap [text-wrap:pretty]">
            {segmentos.map((s, k) => {
              if (s.capas.length === 0) return <React.Fragment key={k}>{s.texto}</React.Fragment>;
              const cita = s.capas.find((c) => c.capa === 'cita');
              const propias = s.capas.some((c) => c.capa !== 'cita' && c.capa !== 'referencia');
              return (
                <span
                  key={k}
                  role={cita || propias ? 'button' : undefined}
                  tabIndex={cita || propias ? 0 : undefined}
                  onClick={() => {
                    if (cita) setCitaAbierta(citaAbierta === cita.indice ? null : cita.indice);
                  }}
                  onDoubleClick={() => quitarMarcaEn(s.capas)}
                  className={`rounded-sm ${claseDeCapas(s.capas, citaAbierta)} ${cita ? 'cursor-pointer' : propias ? 'cursor-text' : ''}`}
                  title={cita ? 'Pasaje citado por la guía: toque para ver el reemplazo' : propias ? 'Su marca · doble clic para quitarla' : 'La guía se refiere a este pasaje'}
                >
                  {s.texto}
                </span>
              );
            })}
          </p>
          {citaAbierta !== null && informe?.correccionesTextuales?.[citaAbierta] && (
            <div className="sticky bottom-0 mt-4 rounded-card border border-line-200 bg-surface p-3 font-sans shadow-lg">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">Por qué</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-ink-700">{informe.correccionesTextuales[citaAbierta].problema}</p>
              <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-700">Reemplazo propuesto</p>
              <p className="mt-0.5 text-[13px] leading-snug text-ink-900">«{informe.correccionesTextuales[citaAbierta].reemplazo}»</p>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => aplicar(informe.correccionesTextuales![citaAbierta].cita, informe.correccionesTextuales![citaAbierta].reemplazo)} className="btn-primary btn-sm">
                  <Check className="h-3.5 w-3.5" />
                  Aplicar reemplazo
                </button>
                <button type="button" onClick={() => setCitaAbierta(null)} className="btn-neutral btn-sm">
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
            <button type="button" onClick={() => aplicar(e.cita, e.reemplazo)} disabled={!aplicable} className="btn-secondary btn-sm mt-1.5 disabled:opacity-50" title={aplicable ? 'Sustituir el pasaje en el texto' : 'El pasaje citado ya no está en el texto actual'}>
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
            Pregúntele a la guía sobre el escrito o pídale redacciones: «reescribe la pretensión tercera como subsidiaria», «¿está bien el juramento?»,
            «¿cómo va después de mis cambios?». Cada mensaje lleva el texto tal como está ahora y cuesta {pesos(precioConsultaCop)}. Los pasajes de los que
            hable se subrayan en azul en el escrito.
          </p>
        )}
        {conversacion.map((t, k) => (
          <div key={k} className={`max-w-[92%] ${t.rol === 'abogado' ? 'ml-auto' : ''}`}>
            <div className={`rounded-card px-3 py-2 text-[13px] leading-relaxed ${t.rol === 'abogado' ? 'bg-brand-700 text-white' : 'border border-line-200 bg-canvas text-ink-900'}`}>
              <p className="whitespace-pre-wrap">{t.texto}</p>
              {t.rol === 'revisor' && t.ediciones && t.ediciones.length > 0 && Ediciones(t.ediciones)}
              {t.rol === 'revisor' && t.referencias && t.referencias.length > 0 && (
                <button type="button" onClick={() => setReferencias(t.referencias ?? [])} className="mt-1.5 text-[11px] text-sky-700 underline underline-offset-2">
                  Ver en el escrito los {t.referencias.length} {t.referencias.length === 1 ? 'pasaje' : 'pasajes'} de los que habla
                </button>
              )}
            </div>
            <p className={`mt-0.5 font-mono text-[10px] text-ink-400 ${t.rol === 'abogado' ? 'text-right' : ''}`}>
              {t.rol === 'abogado' ? 'Usted' : 'Guía'} · {new Date(t.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        ))}
        {ocupado === 'chat' && <p className="text-[12px] text-ink-500">La guía está leyendo el texto actual…</p>}
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
            placeholder="Escriba a la guía… (Enter envía, Shift+Enter salta de línea)"
            disabled={ocupado !== null}
            className="field-area min-h-[44px] flex-1 resize-none"
          />
          <button type="button" onClick={() => void enviar()} disabled={!mensaje.trim() || ocupado !== null} className="btn-primary btn-sm h-[44px]">
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
        <p className="text-ink-500">Este escrito no tiene informe de revisión. Puede pedir uno con «Volver a revisar» o conversar con la guía.</p>
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
      <div className="flex flex-wrap items-center gap-2 border-b border-line-200 bg-surface px-4 py-2">
        <button type="button" onClick={() => onCerrar(texto)} className="btn-neutral btn-sm">
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-ui font-semibold text-ink-900">
            <ClipboardCheck className="mr-1 inline h-4 w-4 text-brand-700" />
            Taller · {datos.titulo}
          </p>
          <p className="truncate text-[11px] text-ink-500">{datos.subtitulo}</p>
        </div>
        {onRerevisar && precioRevisionCop !== undefined && (
          <button
            type="button"
            onClick={() =>
              setConfirmacion({
                titulo: informe ? 'Volver a revisar el escrito' : 'Pedir una revisión completa',
                texto: (
                  <>
                    La guía emitirá un informe {informe ? 'nuevo ' : ''}sobre el texto <span className="font-semibold">tal como está ahora</span>, con sus cambios.
                    {informe ? ' El informe anterior queda en la conversación.' : ''} Se descuentan {pesos(precioRevisionCop)} del saldo de la firma.
                  </>
                ),
                etiqueta: `${informe ? 'Revisar de nuevo' : 'Revisar'} · ${pesos(precioRevisionCop)}`,
                onConfirmar: rerevisar
              })
            }
            disabled={ocupado !== null}
            className="btn-secondary btn-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${ocupado === 'revision' ? 'animate-spin' : ''}`} />
            {ocupado === 'revision' ? 'Revisando…' : informe ? `Volver a revisar · ${pesos(precioRevisionCop)}` : `Revisión completa · ${pesos(precioRevisionCop)}`}
          </button>
        )}
      </div>
      {Cinta()}
      <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
      {error && <p className="border-b border-line-100 bg-surface px-4 py-1.5 text-[12px] text-danger">{error}</p>}

      <div className="flex border-b border-line-100 bg-surface lg:hidden">
        {(['escrito', 'revisor'] as const).map((v) => (
          <button key={v} type="button" onClick={() => setVistaMovil(v)} className={`flex-1 py-2 text-[12.5px] ${vistaMovil === v ? 'border-b-2 border-brand-700 font-semibold text-brand-700' : 'text-ink-500'}`}>
            {v === 'escrito' ? 'Escrito' : 'Guía'}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className={`min-h-0 flex-1 flex-col lg:flex lg:w-[58%] lg:flex-none ${vistaMovil === 'escrito' ? 'flex' : 'hidden'}`}>{Escrito()}</div>
        <div className={`min-h-0 flex-1 flex-col border-l border-line-200 bg-surface lg:flex ${vistaMovil === 'revisor' ? 'flex' : 'hidden'}`}>
          <div className="flex border-b border-line-100">
            {(['chat', 'informe'] as const).map((p) => (
              <button key={p} type="button" onClick={() => setPanel(p)} className={`px-4 py-2 text-[12.5px] ${panel === p ? 'border-b-2 border-brand-700 font-semibold text-brand-700' : 'text-ink-500'}`}>
                {p === 'chat' ? 'Guía' : 'Informe'}
              </button>
            ))}
          </div>
          {panel === 'chat' ? Chat() : InformePanel()}
        </div>
      </div>
    </div>
  );
};
