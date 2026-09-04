import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ClipboardCheck,
  Download,
  Eraser,
  Eye,
  History,
  Highlighter,
  Maximize2,
  MessageSquare,
  MessageSquarePlus,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  PenLine,
  RefreshCw,
  Save,
  Send,
  ShieldCheck
} from 'lucide-react';
import type { Anotacion, EdicionPropuesta, InformeDeRevision, RespuestaDelChat, TurnoDelTaller, VersionDelTexto } from '../services/review.api';
import { aplicarReemplazo, capasTipograficas, esCapaTipografica, localizarCitas, marcasDeAnotaciones, segmentarCapas, type MarcaEnCapa } from '../services/marcas';
import { diferencias, resumenDeCambios } from '../services/diff';
import { ApiError } from '../../../config/httpClient';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { ControlDeLetra, useTamanoDeLetra } from '../../../design/TamanoDeLetra';

/**
 * El taller: el escrito a la izquierda, la guía a la derecha. Sirve igual para
 * un escrito revisado (con informe) y para un borrador generado en Redacción
 * (sin informe): quien lo monta le pasa cómo conversar, cómo guardar y qué
 * decir sobre dónde vive el texto.
 *
 * ─── EL PAPEL, COMO EN REDACCIÓN ────────────────────────────────────────────
 *
 * El escrito se lee sobre una hoja centrada de ancho fijo, con la serif del
 * lienzo de Redacción; hay pantalla completa (tapa la barra lateral) y se
 * puede plegar la guía para leer a todo lo ancho. Es la misma decisión que el
 * lienzo: lo que se firma se lee como documento, no como pantalla.
 *
 * ─── TRES CAPAS DE MARCAS SOBRE EL MISMO TEXTO ──────────────────────────────
 *
 * · Citas del informe: tachado rojo sobre ámbar; al tocar, el reemplazo con
 *   «Aplicar».
 * · Referencias de la última respuesta de la guía: subrayado azul.
 * · Resaltador del abogado: cuatro colores y tachado, a mano. Se anclan al
 *   texto citado, no a posiciones, así sobreviven a las ediciones. Y VIAJAN
 *   CON CADA MENSAJE: la guía sabe qué está en amarillo y qué está tachado,
 *   así que «revisa lo que resalté en verde» significa algo.
 *
 * ─── VERSIONES ──────────────────────────────────────────────────────────────
 *
 * Una instantánea del texto se toma sola antes de una revisión nueva y antes
 * de cada consulta a la guía si el texto cambió desde la anterior; y a mano
 * con «Guardar versión». La pestaña Versiones las lista, muestra qué cambió
 * palabra por palabra frente al texto actual y permite restaurar cualquiera
 * (restaurar también deja versión). Se conservan las últimas quince.
 *
 * ─── LAS PIEZAS SON FUNCIONES, NO COMPONENTES ───────────────────────────────
 *
 * Un componente definido dentro del render es un tipo nuevo en cada pasada:
 * React lo remonta y el área de texto pierde el foco en cada tecla.
 */

export type ColorDeResaltado = Anotacion['color'];

export interface DatosDelEscrito {
  titulo: string;
  subtitulo: string;
  texto: string;
  informe: InformeDeRevision | null;
  conversacion: TurnoDelTaller[];
  anotaciones: Anotacion[];
  versiones: VersionDelTexto[];
}

export interface TallerDeEscritoProps {
  datos: DatosDelEscrito;
  precioConsultaCop: number;
  precioRevisionCop?: number;
  guardado: { activo: boolean; aviso: React.ReactNode; accion?: { etiqueta: string; onClick: () => Promise<void> | void } };
  onGuardar?: (texto: string, conversacion: TurnoDelTaller[], anotaciones: Anotacion[], versiones: VersionDelTexto[]) => Promise<boolean>;
  onChat: (mensaje: string, textoActual: string, historial: TurnoDelTaller[], anotaciones: Anotacion[]) => Promise<RespuestaDelChat>;
  onRerevisar?: (textoActual: string) => Promise<{ informe: InformeDeRevision | null; informeLibre: string | null }>;
  onExportarTexto: (formato: 'pdf' | 'word', texto: string) => void;
  onCerrar: (textoFinal: string) => void;
  onSaldoCambiado: () => void;
}

const pesos = (n: number): string => `$${Math.round(n).toLocaleString('es-CO')}`;
const MAX_VERSIONES = 15;

const COLORES: { id: ColorDeResaltado; nombre: string; clase: string; muestra: string }[] = [
  { id: 'amarillo', nombre: 'Amarillo', clase: 'bg-yellow-200/80', muestra: 'bg-yellow-300' },
  { id: 'verde', nombre: 'Verde', clase: 'bg-green-200/80', muestra: 'bg-green-300' },
  { id: 'azul', nombre: 'Azul', clase: 'bg-sky-200/80', muestra: 'bg-sky-300' },
  { id: 'rosa', nombre: 'Rosa', clase: 'bg-pink-200/80', muestra: 'bg-pink-300' },
  { id: 'tachado', nombre: 'Tachar', clase: 'line-through decoration-ink-700 decoration-2', muestra: '' }
];

const claseDeCapas = (capas: MarcaEnCapa[], abierta: number | null): string => {
  const clases: string[] = [];
  for (const c of capas) {
    if (c.capa === 'cita') clases.push(`line-through decoration-danger decoration-2 ${abierta === c.indice ? 'bg-amber-200' : 'bg-amber-50'}`);
    else if (c.capa === 'referencia') clases.push('underline decoration-sky-500 decoration-2 underline-offset-4');
    else if (c.capa === 'comentario') clases.push('border-b-2 border-dotted border-brand-700 bg-brand-50/70');
    else if (c.capa === 'negrita') clases.push('font-bold');
    else if (c.capa === 'marcador') clases.push('font-normal opacity-30');
    else {
      const color = COLORES.find((x) => x.id === c.capa);
      if (color) clases.push(color.clase);
    }
  }
  return clases.join(' ');
};

const fechaCorta = (iso: string): string => new Date(iso).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

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
  const [versiones, setVersiones] = React.useState<VersionDelTexto[]>(datos.versiones);
  const [referencias, setReferencias] = React.useState<string[]>([]);
  const [modo, setModo] = React.useState<'marcas' | 'editar'>('marcas');
  /** Tamaño de lectura en pantalla; no toca el documento exportado. */
  const letra = useTamanoDeLetra('taller');
  const [panel, setPanel] = React.useState<'chat' | 'informe' | 'versiones' | 'comentarios'>('chat');
  const [citaAbierta, setCitaAbierta] = React.useState<number | null>(null);
  const [versionAbierta, setVersionAbierta] = React.useState<number | null>(null);
  const [mensaje, setMensaje] = React.useState('');
  const [ocupado, setOcupado] = React.useState<'chat' | 'revision' | null>(null);
  const [error, setError] = React.useState('');
  const [estadoGuardado, setEstadoGuardado] = React.useState<'quieto' | 'guardando' | 'guardado' | 'fallo'>('quieto');
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
  const [vistaMovil, setVistaMovil] = React.useState<'escrito' | 'revisor'>('escrito');
  const [pantallaCompleta, setPantallaCompleta] = React.useState(false);
  const [guiaVisible, setGuiaVisible] = React.useState(true);
  const [seleccion, setSeleccion] = React.useState<{ texto: string; x: number; y: number } | null>(null);
  /** Un comentario que se está escribiendo (nuevo, sobre la selección) o abriendo (índice en anotaciones). */
  const [comentario, setComentario] = React.useState<{ indice: number | null; cita: string; nota: string } | null>(null);
  const finDelChat = React.useRef<HTMLDivElement | null>(null);
  const lienzo = React.useRef<HTMLParagraphElement | null>(null);
  const contenedor = React.useRef<HTMLDivElement | null>(null);
  const textoDeUltimaVersion = React.useRef<string>(datos.versiones.length ? datos.versiones[datos.versiones.length - 1].texto : datos.texto);

  /* ─── Las marcas, en sus capas ───────────────────────────────────────────── */
  const citas = React.useMemo(() => (informe?.correccionesTextuales ?? []).map((c) => c.cita), [informe]);
  const marcasDeCitas = React.useMemo(() => localizarCitas(texto, citas), [texto, citas]);
  const marcas: MarcaEnCapa[] = React.useMemo(
    () => [
      ...marcasDeCitas.marcas.map((m) => ({ ...m, capa: 'cita' })),
      ...localizarCitas(texto, referencias).marcas.map((m) => ({ ...m, capa: 'referencia' })),
      ...marcasDeAnotaciones(texto, anotaciones),
      ...capasTipograficas(texto)
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
      onGuardar(texto, conversacion, anotaciones, versiones)
        .then((ok) => setEstadoGuardado(ok ? 'guardado' : 'fallo'))
        .catch(() => setEstadoGuardado('fallo'));
    }, 1500);
    return () => window.clearTimeout(t);
  }, [texto, conversacion, anotaciones, versiones, onGuardar, guardado.activo]);

  React.useEffect(() => {
    finDelChat.current?.scrollIntoView({ block: 'end' });
  }, [conversacion.length, ocupado]);

  React.useEffect(() => {
    if (!pantallaCompleta) return;
    const salir = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPantallaCompleta(false);
    };
    window.addEventListener('keydown', salir);
    return () => window.removeEventListener('keydown', salir);
  }, [pantallaCompleta]);

  /* ─── Versiones ──────────────────────────────────────────────────────────── */
  const tomarVersion = (motivo: string, resumen?: string): boolean => {
    if (texto === textoDeUltimaVersion.current) return false;
    const nueva: VersionDelTexto = { fecha: new Date().toISOString(), motivo, texto, resumen };
    setVersiones((v) => [...v, nueva].slice(-MAX_VERSIONES));
    textoDeUltimaVersion.current = texto;
    return true;
  };

  const restaurar = (v: VersionDelTexto) => {
    tomarVersion('antes de restaurar');
    setTexto(v.texto);
    textoDeUltimaVersion.current = v.texto;
    setVersiones((xs) => [...xs, { fecha: new Date().toISOString(), motivo: `restaurada la versión de ${fechaCorta(v.fecha)}`, texto: v.texto }].slice(-MAX_VERSIONES));
    setVersionAbierta(null);
    setModo('marcas');
  };

  /* ─── Selección para el resaltador ───────────────────────────────────────── */
  const capturarSeleccion = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !lienzo.current || !contenedor.current || !sel.anchorNode || !lienzo.current.contains(sel.anchorNode)) {
      setSeleccion(null);
      return;
    }
    const t = sel.toString().replace(/\s+/g, ' ').trim();
    if (t.length < 2) {
      setSeleccion(null);
      return;
    }
    const r = sel.getRangeAt(0).getBoundingClientRect();
    const caja = contenedor.current.getBoundingClientRect();
    /*
     * La barra se centra sobre la selección, pero NUNCA se sale del contenedor:
     * cerca del margen izquierdo se cortaba. Mitad de la barra (~150 px) de
     * holgura a cada lado, y si la selección está pegada arriba, la barra va
     * debajo en vez de encima.
     */
    const mitad = 150;
    const x = Math.min(Math.max(r.left - caja.left + r.width / 2, mitad + 8), caja.width - mitad - 8);
    const arriba = r.top - caja.top + contenedor.current.scrollTop;
    const y = arriba < 56 ? arriba + r.height + 44 : arriba - 8;
    setSeleccion({ texto: t, x, y });
  };

  const resaltar = (color: ColorDeResaltado) => {
    if (!seleccion) return;
    setAnotaciones((xs) => [...xs.filter((a) => a.cita !== seleccion.texto), { cita: seleccion.texto, color }]);
    setSeleccion(null);
    window.getSelection()?.removeAllRanges();
  };

  const comentarios = anotaciones.map((a, indice) => ({ a, indice })).filter(({ a }) => a.color === 'comentario');

  const abrirComentarioNuevo = () => {
    if (!seleccion) return;
    setComentario({ indice: null, cita: seleccion.texto, nota: '' });
    setSeleccion(null);
    window.getSelection()?.removeAllRanges();
  };

  const guardarComentario = () => {
    if (!comentario || !comentario.nota.trim()) return;
    const nuevo = { cita: comentario.cita, color: 'comentario' as const, nota: comentario.nota.trim(), fecha: new Date().toISOString() };
    setAnotaciones((xs) => (comentario.indice === null ? [...xs, nuevo] : xs.map((a, k) => (k === comentario.indice ? { ...a, nota: nuevo.nota } : a))));
    setComentario(null);
  };

  const resolverComentario = (indice: number) => {
    setAnotaciones((xs) => xs.filter((_, k) => k !== indice));
    setComentario(null);
  };

  const preguntarSobreComentario = (a: Anotacion) => {
    setPanel('chat');
    setVistaMovil('revisor');
    setMensaje(`Sobre mi comentario en «${a.cita}» (${a.nota ?? ''}): `);
    setComentario(null);
  };

  const irAlPasaje = (cita: string) => {
    setModo('marcas');
    setVersionAbierta(null);
    setVistaMovil('escrito');
    window.setTimeout(() => {
      const objetivo = lienzo.current?.querySelector<HTMLElement>(`[data-cita="${CSS.escape(cita.slice(0, 80))}"]`);
      objetivo?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 50);
  };

  const quitarMarcaEn = (segmentoCapas: MarcaEnCapa[]) => {
    const propias = segmentoCapas.filter((c) => c.capa !== 'cita' && c.capa !== 'referencia' && c.capa !== 'comentario' && !esCapaTipografica(c.capa));
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
    tomarVersion('antes de consultar a la guía');
    const turnoAbogado: TurnoDelTaller = { rol: 'abogado', texto: m, fecha: new Date().toISOString() };
    setConversacion((c) => [...c, turnoAbogado]);
    setMensaje('');
    try {
      const r = await onChat(m, texto, conversacion, anotaciones);
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
    tomarVersion('antes de una revisión nueva', informe?.resumen);
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

  const Papel = (children: React.ReactNode) => (
    <div ref={contenedor} className="scroll-documento relative min-h-0 flex-1 overflow-y-auto bg-canvas px-3 py-4 sm:px-6" onMouseUp={capturarSeleccion} onTouchEnd={capturarSeleccion}>
      {seleccion && modo === 'marcas' && (
        <div
          className="absolute z-10 flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-card border border-line-200 bg-surface p-1 shadow-lg"
          style={{ left: seleccion.x, top: seleccion.y }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <span className="px-1 font-sans text-[10px] uppercase tracking-[0.08em] text-ink-400">Marcar</span>
          {COLORES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => resaltar(c.id)}
              className={`h-7 min-w-7 rounded-control border border-line-200 px-1.5 font-sans text-[11px] text-ink-900 ${c.id === 'tachado' ? 'bg-surface' : c.muestra}`}
              title={c.nombre}
            >
              {c.id === 'tachado' ? <span className="line-through">abc</span> : ''}
            </button>
          ))}
          <button type="button" onClick={abrirComentarioNuevo} className="flex h-7 items-center gap-1 rounded-control border border-brand-700 px-2 font-sans text-[11px] text-brand-700" title="Dejar un comentario sobre este pasaje">
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Comentar
          </button>
          <button type="button" onClick={() => setSeleccion(null)} className="h-7 rounded-control px-1.5 font-sans text-[11px] text-ink-500" title="Cancelar">
            ✕
          </button>
        </div>
      )}
      {comentario && (
        <div className="absolute inset-x-3 top-3 z-20 mx-auto max-w-[560px] rounded-card border border-line-200 bg-surface p-3 font-sans shadow-lg sm:inset-x-6">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">{comentario.indice === null ? 'Nuevo comentario' : 'Comentario'}</p>
          <p className="mt-0.5 text-[12px] italic leading-snug text-ink-500">«{comentario.cita}»</p>
          <textarea
            value={comentario.nota}
            onChange={(e) => setComentario({ ...comentario, nota: e.target.value })}
            rows={3}
            autoFocus
            placeholder="Su nota sobre este pasaje: una duda, algo para revisar después, una corrección a la guía…"
            className="field-area mt-2 w-full resize-none"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <button type="button" onClick={guardarComentario} disabled={!comentario.nota.trim()} className="btn-primary btn-sm disabled:opacity-50">
              {comentario.indice === null ? 'Guardar comentario' : 'Guardar cambios'}
            </button>
            {comentario.indice !== null && (
              <>
                <button type="button" onClick={() => preguntarSobreComentario(anotaciones[comentario.indice as number])} className="btn-secondary btn-sm">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Preguntar a la guía
                </button>
                <button type="button" onClick={() => resolverComentario(comentario.indice as number)} className="btn-neutral btn-sm">
                  Resolver
                </button>
              </>
            )}
            <button type="button" onClick={() => setComentario(null)} className="btn-neutral btn-sm ml-auto">
              Cancelar
            </button>
          </div>
        </div>
      )}
      <div className="mx-auto w-full max-w-[816px] rounded-card border border-line-200 bg-paper px-8 py-8 shadow-sm sm:px-12 sm:py-10">{children}</div>
    </div>
  );

  const Escrito = () => (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-line-100 bg-surface px-4 py-2">
        <div className="flex rounded-control border border-line-200 p-0.5">
          {(['marcas', 'editar'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setModo(m);
                setSeleccion(null);
                setVersionAbierta(null);
              }}
              className={`flex items-center gap-1 rounded-control px-2.5 py-1 text-[12px] ${modo === m && versionAbierta === null ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-600 hover:text-ink-900'}`}
            >
              {m === 'marcas' ? <Eye className="h-3.5 w-3.5" /> : <PenLine className="h-3.5 w-3.5" />}
              {m === 'marcas' ? 'Con marcas' : 'Editar'}
            </button>
          ))}
        </div>
        <ControlDeLetra letra={letra} />
        <span className="hidden text-[11px] text-ink-500 md:inline">
          {versionAbierta !== null ? (
            'Viendo una versión anterior: lo quitado en rojo, lo añadido en verde.'
          ) : modo === 'marcas' ? (
            <>
              <Highlighter className="mr-1 inline h-3 w-3" />
              Seleccione texto para resaltar o tachar
              {marcasDeCitas.marcas.length > 0 && ` · ${marcasDeCitas.marcas.length} ${marcasDeCitas.marcas.length === 1 ? 'pasaje citado' : 'pasajes citados'}`}
              {anotaciones.filter((a) => a.color !== 'comentario').length > 0 && ` · ${anotaciones.filter((a) => a.color !== 'comentario').length} ${anotaciones.filter((a) => a.color !== 'comentario').length === 1 ? 'marca suya' : 'marcas suyas'}`}
              {comentarios.length > 0 && ` · ${comentarios.length} ${comentarios.length === 1 ? 'comentario' : 'comentarios'}`}
            </>
          ) : (
            'Las marcas se reubican solas al volver a «Con marcas».'
          )}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => tomarVersion('guardada a mano') || setError('El texto no cambió desde la última versión.')} className="btn-neutral btn-sm" title="Guardar una versión del texto tal como está">
            <Save className="h-3.5 w-3.5" />
            Guardar versión
          </button>
          {anotaciones.some((a) => a.color !== 'comentario') && modo === 'marcas' && (
            <button type="button" onClick={() => setAnotaciones((xs) => xs.filter((a) => a.color === 'comentario'))} className="btn-neutral btn-sm" title="Quitar todos sus resaltados y tachados (los comentarios se conservan)">
              <Eraser className="h-3.5 w-3.5" />
              Limpiar
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

      {versionAbierta !== null && versiones[versionAbierta] ? (
        Papel(
          <>
            {(() => {
              const v = versiones[versionAbierta];
              const { tramos, fino } = diferencias(v.texto, texto);
              const r = resumenDeCambios(tramos);
              return (
                <>
                  <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-line-100 pb-3 font-sans text-[12px] text-ink-600">
                    <History className="h-3.5 w-3.5" />
                    <span>
                      Versión de {fechaCorta(v.fecha)} · {v.motivo}
                      {v.resumen ? ` · ${v.resumen}` : ''}
                    </span>
                    <span className="text-ink-400">
                      · frente al texto actual: <span className="text-green-700">+{r.anadidas}</span> / <span className="text-danger">−{r.quitadas}</span> palabras
                      {!fino ? ' (comparado por párrafos)' : ''}
                    </span>
                    <button type="button" onClick={() => restaurar(v)} className="btn-secondary btn-sm ml-auto">
                      Restaurar esta versión
                    </button>
                    <button type="button" onClick={() => setVersionAbierta(null)} className="btn-neutral btn-sm">
                      Volver al actual
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-justify font-legal leading-[1.8] text-paper-ink [text-wrap:pretty]" style={{ fontSize: letra.px(14) }}>
                    {tramos.map((t, k) =>
                      t.tipo === 'igual' ? (
                        <React.Fragment key={k}>{t.texto}</React.Fragment>
                      ) : (
                        <span key={k} className={t.tipo === 'quitado' ? 'bg-red-100 text-red-800 line-through decoration-red-500' : 'bg-green-100 text-green-900'}>
                          {t.texto}
                        </span>
                      )
                    )}
                  </p>
                </>
              );
            })()}
          </>
        )
      ) : modo === 'editar' ? (
        Papel(
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="min-h-[70vh] w-full resize-y border-0 bg-transparent p-0 font-legal leading-[1.8] text-paper-ink focus:outline-none"
            style={{ fontSize: letra.px(14) }}
            spellCheck
          />
        )
      ) : (
        Papel(
          <>
            <p ref={lienzo} className="whitespace-pre-wrap text-justify font-legal leading-[1.8] text-paper-ink [text-wrap:pretty]" style={{ fontSize: letra.px(14) }}>
              {segmentos.map((s, k) => {
                if (s.capas.length === 0) return <React.Fragment key={k}>{s.texto}</React.Fragment>;
                if (s.capas.every((c) => esCapaTipografica(c.capa))) {
                  return (
                    <span key={k} className={claseDeCapas(s.capas, citaAbierta)}>
                      {s.texto}
                    </span>
                  );
                }
                const cita = s.capas.find((c) => c.capa === 'cita');
                const conComentario = s.capas.find((c) => c.capa === 'comentario');
                const propias = s.capas.some((c) => c.capa !== 'cita' && c.capa !== 'referencia' && c.capa !== 'comentario' && !esCapaTipografica(c.capa));
                const anclaje = s.capas.map((c) => (c.capa === 'comentario' ? anotaciones[c.indice]?.cita : null)).find(Boolean);
                return (
                  <span
                    key={k}
                    data-cita={anclaje ? anclaje.slice(0, 80) : undefined}
                    role={cita || propias || conComentario ? 'button' : undefined}
                    tabIndex={cita || propias || conComentario ? 0 : undefined}
                    onClick={() => {
                      if (conComentario) {
                        const a = anotaciones[conComentario.indice];
                        setComentario({ indice: conComentario.indice, cita: a.cita, nota: a.nota ?? '' });
                        return;
                      }
                      if (cita) setCitaAbierta(citaAbierta === cita.indice ? null : cita.indice);
                    }}
                    onDoubleClick={() => quitarMarcaEn(s.capas)}
                    className={`rounded-sm ${claseDeCapas(s.capas, citaAbierta)} ${cita || conComentario ? 'cursor-pointer' : propias ? 'cursor-text' : ''}`}
                    title={conComentario ? `Comentario: ${anotaciones[conComentario.indice]?.nota ?? ''}` : cita ? 'Pasaje citado por la guía: toque para ver el reemplazo' : propias ? 'Su marca · doble clic para quitarla' : 'La guía se refiere a este pasaje'}
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
          </>
        )
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
            Pregúntele a la guía sobre el escrito o pídale redacciones: «reescribe la pretensión tercera como subsidiaria», «revisa lo que resalté en
            amarillo», «mira mi comentario sobre la jurisprudencia», «¿cómo va después de mis cambios?». Cada mensaje lleva el texto tal como está ahora, sus marcas de colores y sus comentarios, y cuesta{' '}
            {pesos(precioConsultaCop)}. Los pasajes de los que hable se subrayan en azul.
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
        <p className="text-ink-500">Este escrito no tiene informe de revisión. Puede pedir uno con «Revisión completa» o conversar con la guía.</p>
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

  const ComentariosPanel = () => (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-[12.5px]">
      {comentarios.length === 0 ? (
        <p className="text-ink-500">
          Seleccione un pasaje del escrito y elija «Comentar» para dejar una nota: algo que revisar después, una duda, o una corrección a la guía. Los
          comentarios viajan con cada mensaje, así que puede pedirle «mira mi comentario sobre la jurisprudencia».
        </p>
      ) : (
        <ul className="space-y-2">
          {comentarios.map(({ a, indice }) => (
            <li key={indice} className="rounded-control border border-line-200 bg-canvas px-3 py-2">
              <button type="button" onClick={() => irAlPasaje(a.cita)} className="block w-full text-left text-[11px] italic leading-snug text-ink-500 hover:text-brand-700" title="Ir al pasaje">
                «{a.cita.length > 140 ? `${a.cita.slice(0, 140)}…` : a.cita}»
              </button>
              <p className="mt-1 whitespace-pre-wrap leading-snug text-ink-900">{a.nota}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {a.fecha && <span className="font-mono text-[10px] text-ink-400">{fechaCorta(a.fecha)}</span>}
                <button type="button" onClick={() => setComentario({ indice, cita: a.cita, nota: a.nota ?? '' })} className="btn-neutral btn-sm ml-auto">
                  Editar
                </button>
                <button type="button" onClick={() => preguntarSobreComentario(a)} className="btn-secondary btn-sm">
                  <MessageSquare className="h-3 w-3" />
                  Preguntar a la guía
                </button>
                <button type="button" onClick={() => resolverComentario(indice)} className="btn-neutral btn-sm">
                  Resolver
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const VersionesPanel = () => (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-[12.5px]">
      {versiones.length === 0 ? (
        <p className="text-ink-500">
          Todavía no hay versiones. Se guarda una sola antes de cada revisión nueva y antes de cada consulta a la guía si el texto cambió; también con
          «Guardar versión». Se conservan las últimas {MAX_VERSIONES}.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {[...versiones]
            .map((v, k) => ({ v, k }))
            .reverse()
            .map(({ v, k }) => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => {
                    setVersionAbierta(k);
                    setVistaMovil('escrito');
                  }}
                  className={`w-full rounded-control border px-3 py-2 text-left ${versionAbierta === k ? 'border-brand-700 bg-brand-50' : 'border-line-200 bg-canvas hover:border-brand-700'}`}
                >
                  <span className="block text-ink-900">{fechaCorta(v.fecha)}</span>
                  <span className="block text-[11px] text-ink-500">
                    {v.motivo}
                    {v.resumen ? ` · ${v.resumen}` : ''} · {(v.texto.match(/\S+/g) ?? []).length.toLocaleString('es-CO')} palabras
                  </span>
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className={`flex min-h-0 flex-1 flex-col bg-canvas ${pantallaCompleta ? 'fixed inset-0 z-50' : ''}`}>
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
        <button type="button" onClick={() => setGuiaVisible((v) => !v)} className="btn-neutral btn-sm hidden lg:inline-flex" title={guiaVisible ? 'Ocultar la guía para leer a todo lo ancho' : 'Mostrar la guía'}>
          {guiaVisible ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
          {guiaVisible ? 'Ocultar guía' : 'Mostrar guía'}
        </button>
        <button type="button" onClick={() => setPantallaCompleta((v) => !v)} className="btn-neutral btn-sm" title={pantallaCompleta ? 'Salir de pantalla completa (Esc)' : 'Pantalla completa'}>
          {pantallaCompleta ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{pantallaCompleta ? 'Salir' : 'Pantalla completa'}</span>
        </button>
        {onRerevisar && precioRevisionCop !== undefined && (
          <button
            type="button"
            onClick={() =>
              setConfirmacion({
                titulo: informe ? 'Volver a revisar el escrito' : 'Pedir una revisión completa',
                texto: (
                  <>
                    La guía emitirá un informe {informe ? 'nuevo ' : ''}sobre el texto <span className="font-semibold">tal como está ahora</span>, con sus cambios.
                    {informe ? ' El informe anterior queda en la conversación y el texto de ahora, en Versiones.' : ''} Se descuentan {pesos(precioRevisionCop)} del saldo de la firma.
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
      {error && (
        <p className="border-b border-line-100 bg-surface px-4 py-1.5 text-[12px] text-danger">
          {error}{' '}
          <button type="button" onClick={() => setError('')} className="underline">
            cerrar
          </button>
        </p>
      )}

      <div className="flex border-b border-line-100 bg-surface lg:hidden">
        {(['escrito', 'revisor'] as const).map((v) => (
          <button key={v} type="button" onClick={() => setVistaMovil(v)} className={`flex-1 py-2 text-[12.5px] ${vistaMovil === v ? 'border-b-2 border-brand-700 font-semibold text-brand-700' : 'text-ink-500'}`}>
            {v === 'escrito' ? 'Escrito' : 'Guía'}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <div className={`min-h-0 flex-1 flex-col lg:flex ${guiaVisible ? 'lg:w-[58%] lg:flex-none' : 'lg:w-full'} ${vistaMovil === 'escrito' ? 'flex' : 'hidden'}`}>{Escrito()}</div>
        <div className={`min-h-0 flex-1 flex-col border-l border-line-200 bg-surface ${guiaVisible ? 'lg:flex' : 'lg:hidden'} ${vistaMovil === 'revisor' ? 'flex' : 'hidden'}`}>
          <div className="flex border-b border-line-100">
            {(['chat', 'comentarios', 'informe', 'versiones'] as const).map((p) => (
              <button key={p} type="button" onClick={() => setPanel(p)} className={`px-3 py-2 text-[12.5px] ${panel === p ? 'border-b-2 border-brand-700 font-semibold text-brand-700' : 'text-ink-500'}`}>
                {p === 'chat'
                  ? 'Guía'
                  : p === 'comentarios'
                    ? `Comentarios${comentarios.length ? ` (${comentarios.length})` : ''}`
                    : p === 'informe'
                      ? 'Informe'
                      : `Versiones${versiones.length ? ` (${versiones.length})` : ''}`}
              </button>
            ))}
          </div>
          {panel === 'chat' ? Chat() : panel === 'comentarios' ? ComentariosPanel() : panel === 'informe' ? InformePanel() : VersionesPanel()}
        </div>
      </div>
    </div>
  );
};
