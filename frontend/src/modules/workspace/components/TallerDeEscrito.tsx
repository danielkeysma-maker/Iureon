import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ClipboardCheck,
  Copy,
  Download,
  Gavel,
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
import type { Anotacion, EdicionPropuesta, InformeDeRevision, ParametrosDePreguntas, PreguntasAudienciaGuardadas, RespuestaDePreguntas, RespuestaDelChat, SeccionDePreguntas, TurnoDelTaller, VersionDelTexto } from '../services/review.api';
import { TITULOS as SECCIONES_DE_PREGUNTAS, preguntasComoTexto, seccionesPedidas } from '../services/preguntasExport.service';
import { aplicarReemplazo, capasTipograficas, esCapaTipografica, localizarCitas, marcasDeAnotaciones, reflujoDeSecciones, segmentarCapas, type MarcaEnCapa } from '../services/marcas';
import { diferencias, resumenDeCambios } from '../services/diff';
import { ApiError } from '../../../config/httpClient';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { ControlDeLetra, useTamanoDeLetra } from '../../../design/TamanoDeLetra';
import { estiloDelLienzo, type FormatoDelEscrito } from '../../documents/formatoEnPantalla';
import { AVISO_FUNCION_DESHABILITADA } from '../../subscriptions/types';

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
  /**
   * El último guardado cuando la pestaña se oculta o se cierra con un cambio
   * todavía en el retardo. Debe salir con keepalive: una petición corriente
   * lanzada en `pagehide` muere con la página. Sin él, ese cambio se pierde.
   */
  onGuardarAlSalir?: (texto: string, conversacion: TurnoDelTaller[], anotaciones: Anotacion[], versiones: VersionDelTexto[]) => void;
  onChat: (mensaje: string, textoActual: string, historial: TurnoDelTaller[], anotaciones: Anotacion[]) => Promise<RespuestaDelChat>;
  onRerevisar?: (textoActual: string) => Promise<{ informe: InformeDeRevision | null; informeLibre: string | null }>;
  onExportarTexto: (formato: 'pdf' | 'word', texto: string) => void;
  onCerrar: (textoFinal: string) => void;
  onSaldoCambiado: () => void;
  /** Formato de la firma (Membrete): familia, cuerpo e interlineado. El papel del taller se lee con la misma letra que el visor y el PDF. */
  formato?: FormatoDelEscrito | null;
  /** Solo en el taller de una revisión guardada: la pestaña «Audiencia» con las tres listas de preguntas. */
  preguntas?: PreguntasDelTaller;
  /**
   * Funciones que el operador apagó para esta firma: el padre las decide con
   * `funcionHabilitada` (la del chat cambia según el taller sea de una revisión
   * o de un borrador). La entrada se cambia por el aviso; el servidor rechaza
   * igual con 403 si la petición llega por fuera de la pantalla.
   */
  cerradas?: { chat?: boolean; rerevisar?: boolean };
}

export interface PreguntasDelTaller {
  precioCop: number;
  /** Lo último generado para esta revisión, si el servidor lo conservó. */
  guardadas: PreguntasAudienciaGuardadas | null;
  onGenerar: (parametros: ParametrosDePreguntas, textoActual: string) => Promise<RespuestaDePreguntas>;
  onExportarWord: (generadas: PreguntasAudienciaGuardadas) => Promise<void>;
  /** El mismo juego, en PDF: a la audiencia se llega con la hoja impresa. */
  onExportarPdf: (generadas: PreguntasAudienciaGuardadas) => Promise<void>;
}

type PosicionFija = 'Demandante' | 'Demandado' | 'Otro';
const posicionInicial = (g: PreguntasAudienciaGuardadas | null): { tipo: PosicionFija; otra: string } => {
  const p = g?.parametros.posicion ?? '';
  if (p === 'Demandante' || p === 'Demandado') return { tipo: p, otra: '' };
  return { tipo: p ? 'Otro' : 'Demandante', otra: p };
};

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

/**
 * Turnos guardados ANTES de que el servidor reparara el JSON cortado: quedaron
 * en la conversación como `{"respuesta":"…\n…` y así se leerían para siempre.
 * Se rescata el valor de «respuesta» al pintar; los nuevos ya llegan limpios.
 */
const textoLegible = (texto: string): string => {
  const m = /^\s*\{\s*"respuesta"\s*:\s*"/.exec(texto);
  if (!m) return texto;
  let cuerpo = texto.slice(m[0].length);
  const corte = cuerpo.search(/"\s*,\s*"(ediciones|referencias)"\s*:/);
  cuerpo = corte !== -1 ? cuerpo.slice(0, corte) : cuerpo.replace(/"\s*\}?\s*$/, '');
  cuerpo = cuerpo.replace(/\\+$/, '');
  try {
    return (JSON.parse(`"${cuerpo}"`) as string).trim() || texto;
  } catch {
    return cuerpo.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim() || texto;
  }
};

/**
 * La respuesta de la guía viene como texto plano con su propia estructura:
 * «2) SOBRE LA FORMA DE LA CITA. Aquí…», «a) La misma sentencia…», y a veces
 * «**negrita**». Se pinta esa estructura en vez de mostrarla cruda: el
 * marcador y el encabezado de cada punto van en negrita, y los asteriscos de
 * Markdown se convierten en negrita real. Nada más se toca.
 */
const MARCADOR_DE_PUNTO = /^(\d{1,2}[.)]|[a-z][.)]|[ivx]{1,4}[.)]|[A-Z][.)]|[-•–])\s+/;

const conNegritasMarkdown = (texto: string, clave: string): React.ReactNode[] => {
  const partes = texto.split(/(\*\*[^*\n]+\*\*)/g);
  return partes.map((p, i) =>
    /^\*\*[^*\n]+\*\*$/.test(p) ? (
      <strong key={`${clave}-b${i}`} className="font-semibold">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={`${clave}-t${i}`}>{p}</React.Fragment>
    )
  );
};

const formatoDelChat = (texto: string): React.ReactNode[] => {
  const lineas = texto.split('\n');
  return lineas.flatMap((linea, i) => {
    const nodos: React.ReactNode[] = [];
    const m = MARCADOR_DE_PUNTO.exec(linea);
    if (m) {
      const resto = linea.slice(m[0].length);
      /* El encabezado del punto: hasta el primer «.» o «:» si empieza en mayúscula y es corto; si no, solo el marcador. */
      const enc = /^([^.:\n]{2,80}[.:])(\s|$)/.exec(resto);
      const esTitulo = enc && /^[\p{Lu}«"]/u.test(resto) && (/^[^a-záéíóúñ]{0,3}[\p{Lu}\s«»"'\d.,;:()-]+$/u.test(enc[1]) || enc[1].length <= 60);
      if (esTitulo && enc) {
        nodos.push(
          <strong key={`l${i}-m`} className="font-semibold">
            {m[0]}
            {enc[1]}
          </strong>
        );
        nodos.push(...conNegritasMarkdown(resto.slice(enc[1].length), `l${i}`));
      } else {
        nodos.push(
          <strong key={`l${i}-m`} className="font-semibold">
            {m[0]}
          </strong>
        );
        nodos.push(...conNegritasMarkdown(resto, `l${i}`));
      }
    } else {
      nodos.push(...conNegritasMarkdown(linea, `l${i}`));
    }
    if (i < lineas.length - 1) nodos.push(<React.Fragment key={`l${i}-n`}>{'\n'}</React.Fragment>);
    return nodos;
  });
};

export const TallerDeEscrito: React.FC<TallerDeEscritoProps> = ({
  datos,
  precioConsultaCop,
  precioRevisionCop,
  guardado,
  onGuardar,
  onGuardarAlSalir,
  onChat,
  onRerevisar,
  onExportarTexto,
  onCerrar,
  onSaldoCambiado,
  formato,
  preguntas,
  cerradas
}) => {
  /*
   * Los escritos revisados antes del 5 de septiembre de 2026 se guardaron sin
   * saltos de párrafo (la preparación del texto los colapsaba). Se les devuelve
   * la estructura por sus encabezados y ordinales al abrirlos; los nuevos ya
   * llegan con sus saltos y el reflujo no los toca.
   */
  const [texto, setTexto] = React.useState(() => reflujoDeSecciones(datos.texto));
  const [informe, setInforme] = React.useState<InformeDeRevision | null>(datos.informe);
  const [conversacion, setConversacion] = React.useState<TurnoDelTaller[]>(datos.conversacion);
  const [anotaciones, setAnotaciones] = React.useState<Anotacion[]>(datos.anotaciones);
  const [versiones, setVersiones] = React.useState<VersionDelTexto[]>(datos.versiones);
  const [referencias, setReferencias] = React.useState<string[]>([]);
  const [modo, setModo] = React.useState<'marcas' | 'editar'>('marcas');
  /** Tamaño de lectura en pantalla; no toca el documento exportado. */
  const letra = useTamanoDeLetra('taller');
  /* La letra de la firma manda; el control de lectura solo la escala. Sin formato, la serif del lienzo a 14 px. */
  const estiloDeFirma = estiloDelLienzo(formato);
  const baseDeLetra = estiloDeFirma ? parseFloat(estiloDeFirma.fontSize) : 14;
  const estiloDelPapel: React.CSSProperties = { ...estiloDeFirma, fontSize: letra.px(baseDeLetra) };
  const [panel, setPanel] = React.useState<'chat' | 'informe' | 'versiones' | 'comentarios' | 'preguntas'>('chat');
  const [citaAbierta, setCitaAbierta] = React.useState<number | null>(null);
  const [versionAbierta, setVersionAbierta] = React.useState<number | null>(null);
  const [mensaje, setMensaje] = React.useState('');
  const [ocupado, setOcupado] = React.useState<'chat' | 'revision' | 'preguntas' | null>(null);
  /* ─── Preguntas para la audiencia: el formulario vive aquí, no en la pieza, para que el área de texto no pierda el foco. */
  const [preguntasGeneradas, setPreguntasGeneradas] = React.useState<PreguntasAudienciaGuardadas | null>(preguntas?.guardadas ?? null);
  const [formularioDePreguntas, setFormularioDePreguntas] = React.useState<boolean>(!preguntas?.guardadas);
  const [posicionTipo, setPosicionTipo] = React.useState<PosicionFija>(() => posicionInicial(preguntas?.guardadas ?? null).tipo);
  const [posicionOtra, setPosicionOtra] = React.useState(() => posicionInicial(preguntas?.guardadas ?? null).otra);
  const [quiereProbar, setQuiereProbar] = React.useState(preguntas?.guardadas?.parametros.quiereProbar ?? '');
  const [tipoDeAudiencia, setTipoDeAudiencia] = React.useState(preguntas?.guardadas?.parametros.audiencia ?? '');
  /* A quién preguntar. Por defecto a los tres; el abogado quita los que no le interesan. */
  const [publicos, setPublicos] = React.useState<SeccionDePreguntas[]>(
    () => preguntas?.guardadas?.parametros.publicos?.length ? preguntas.guardadas.parametros.publicos : SECCIONES_DE_PREGUNTAS.map((s) => s.clave)
  );
  const alternarPublico = (clave: SeccionDePreguntas) =>
    setPublicos((prev) => (prev.includes(clave) ? prev.filter((p) => p !== clave) : [...prev, clave]));
  const [copiadas, setCopiadas] = React.useState(false);
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
  /*
   * TODO LO QUE EL TALLER PRODUCE SE GUARDA SOLO: texto, conversación, marcas
   * y versiones, 1,5 s después del último cambio. `pendiente` recuerda que hay
   * un cambio que aún no llegó al servidor —en el retardo o en vuelo— para que
   * al ocultar o cerrar la pestaña salga en el acto con keepalive. El abogado
   * que cierra el portátil a mitad de una corrección no la pierde.
   */
  const primeraPasada = React.useRef(true);
  const pendiente = React.useRef(false);
  const estadoActual = React.useRef({ texto, conversacion, anotaciones, versiones });
  estadoActual.current = { texto, conversacion, anotaciones, versiones };
  /*
   * Los padres pasan estas funciones como flechas nuevas en cada render. Si
   * fueran dependencias, cualquier render —teclear en el chat— reiniciaría el
   * retardo y pintaría «Guardando…» sin que nada hubiera cambiado. Van en refs
   * y los efectos dependen solo de lo que de verdad cambia.
   */
  const guardar = React.useRef(onGuardar);
  guardar.current = onGuardar;
  const guardarAlSalir = React.useRef(onGuardarAlSalir);
  guardarAlSalir.current = onGuardarAlSalir;
  const hayGuardado = Boolean(onGuardar) && guardado.activo;
  React.useEffect(() => {
    if (primeraPasada.current) {
      primeraPasada.current = false;
      return;
    }
    if (!hayGuardado) return;
    pendiente.current = true;
    setEstadoGuardado('guardando');
    const t = window.setTimeout(() => {
      const instantanea = estadoActual.current;
      const fn = guardar.current;
      if (!fn) return;
      fn(instantanea.texto, instantanea.conversacion, instantanea.anotaciones, instantanea.versiones)
        .then((ok) => {
          /* Solo se da por guardado lo que sigue siendo lo último; si cambió en vuelo, el efecto siguiente ya lo tiene. */
          if (estadoActual.current === instantanea) pendiente.current = !ok;
          setEstadoGuardado(ok ? 'guardado' : 'fallo');
        })
        .catch(() => setEstadoGuardado('fallo'));
    }, 1500);
    return () => window.clearTimeout(t);
  }, [texto, conversacion, anotaciones, versiones, hayGuardado]);

  React.useEffect(() => {
    if (!hayGuardado) return;
    const vaciar = () => {
      const fn = guardarAlSalir.current;
      if (!pendiente.current || !fn) return;
      const { texto: t, conversacion: c, anotaciones: a, versiones: v } = estadoActual.current;
      fn(t, c, a, v);
      pendiente.current = false;
    };
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === 'hidden') vaciar();
    };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    window.addEventListener('pagehide', vaciar);
    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      window.removeEventListener('pagehide', vaciar);
      /* Al desmontar el taller (cerrar, cambiar de módulo) también se vacía lo pendiente. */
      vaciar();
    };
  }, [hayGuardado]);

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

  /*
   * Las guardadas pueden llegar después de montar (quien abre el taller las
   * pide aparte). Se adoptan solo si aquí no se ha generado nada todavía.
   */
  const guardadasDelServidor = preguntas?.guardadas ?? null;
  React.useEffect(() => {
    if (!guardadasDelServidor) return;
    setPreguntasGeneradas((actuales) => actuales ?? guardadasDelServidor);
    setFormularioDePreguntas(false);
    const ini = posicionInicial(guardadasDelServidor);
    setPosicionTipo(ini.tipo);
    setPosicionOtra(ini.otra);
    setQuiereProbar(guardadasDelServidor.parametros.quiereProbar ?? '');
    setTipoDeAudiencia(guardadasDelServidor.parametros.audiencia ?? '');
  }, [guardadasDelServidor]);

  const posicionElegida = (posicionTipo === 'Otro' ? posicionOtra : posicionTipo).trim();

  const generarPreguntas = async () => {
    if (!preguntas || ocupado) return;
    if (!posicionElegida) {
      setError('Indique su posición en el proceso: Demandante, Demandado u otra.');
      return;
    }
    if (publicos.length === 0) {
      setError('Marque al menos a quién quiere preguntar.');
      return;
    }
    setOcupado('preguntas');
    setError('');
    try {
      const r = await preguntas.onGenerar(
        {
          posicion: posicionElegida,
          ...(quiereProbar.trim() ? { quiereProbar: quiereProbar.trim() } : {}),
          ...(tipoDeAudiencia.trim() ? { audiencia: tipoDeAudiencia.trim() } : {}),
          ...(publicos.length > 0 && publicos.length < SECCIONES_DE_PREGUNTAS.length ? { publicos } : {})
        },
        texto
      );
      setPreguntasGeneradas({ parametros: r.parametros, preguntas: r.preguntas, generadoEl: r.generadoEl, por: r.por });
      setFormularioDePreguntas(false);
      onSaldoCambiado();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : 'No se pudieron generar las preguntas.');
    } finally {
      setOcupado(null);
    }
  };

  const copiarPreguntas = async () => {
    if (!preguntasGeneradas) return;
    try {
      await navigator.clipboard.writeText(preguntasComoTexto(datos.titulo, preguntasGeneradas));
      setCopiadas(true);
      window.setTimeout(() => setCopiadas(false), 2000);
    } catch {
      setError('No se pudo copiar al portapapeles.');
    }
  };

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
        {guardado.activo && estadoGuardado === 'guardando' && ' · Guardando…'}
        {guardado.activo && estadoGuardado === 'guardado' && ' · Guardado hace un momento'}
        {guardado.activo && estadoGuardado === 'fallo' && <span className="font-semibold text-danger"> · No se pudo guardar el último cambio</span>}
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
                  <p className="whitespace-pre-wrap break-words text-justify font-legal leading-[1.8] text-paper-ink [text-wrap:pretty]" style={estiloDelPapel}>
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
            style={estiloDelPapel}
            spellCheck
          />
        )
      ) : (
        Papel(
          <>
            <p ref={lienzo} className="whitespace-pre-wrap break-words text-justify font-legal leading-[1.8] text-paper-ink [text-wrap:pretty]" style={estiloDelPapel}>
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
              <p className="whitespace-pre-wrap break-words text-justify [text-wrap:pretty]">{formatoDelChat(textoLegible(t.texto))}</p>
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
        {preguntas && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setPanel('preguntas')}
              className="inline-flex items-center gap-1 rounded-full border border-line-200 bg-canvas px-2.5 py-1 text-[11.5px] text-ink-700 hover:border-brand-700 hover:text-brand-700"
              title="Tres listas de preguntas para la audiencia a partir del escrito"
            >
              <Gavel className="h-3 w-3" />
              Preguntas para la audiencia
            </button>
          </div>
        )}
        {cerradas?.chat ? (
          <p className="notice text-ui leading-[1.5] [text-wrap:pretty]">{AVISO_FUNCION_DESHABILITADA}</p>
        ) : (
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
        )}
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
              <p className="mt-1 whitespace-pre-wrap break-words leading-snug text-ink-900">{a.nota}</p>
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

  const PreguntasPanel = () => {
    if (!preguntas) return null;
    const g = preguntasGeneradas;
    const total = g ? g.preguntas.contraparte.length + g.preguntas.misTestigos.length + g.preguntas.testigosContraparte.length : 0;
    return (
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 text-[12.5px]">
        {formularioDePreguntas || !g ? (
          <>
            <p className="text-justify leading-snug text-ink-700 [text-wrap:pretty]">
              <span className="font-semibold text-ink-900">¿Qué preguntas hacer en la audiencia?</span> La guía lee este escrito y le propone las preguntas, numeradas y listas para leer en voz alta, cada una con para qué sirve y el pasaje del escrito del que sale. Marque a quién quiere preguntar, diga de qué lado está y pida las preguntas.
            </p>
            <div>
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">1 · ¿A quién quiere preguntar?</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {SECCIONES_DE_PREGUNTAS.map((s) => {
                  const activo = publicos.includes(s.clave);
                  return (
                    <button
                      key={s.clave}
                      type="button"
                      onClick={() => alternarPublico(s.clave)}
                      aria-pressed={activo}
                      title={s.nota}
                      className={`inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1 text-[12px] ${activo ? 'border-brand-300 bg-brand-50 font-semibold text-brand-700' : 'border-line-200 text-ink-600 hover:text-ink-900'}`}
                    >
                      <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border ${activo ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-300'}`}>
                        {activo && <Check className="h-2.5 w-2.5" />}
                      </span>
                      {s.titulo}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">2 · ¿De qué lado está usted?</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <div className="flex rounded-control border border-line-200 p-0.5">
                  {(['Demandante', 'Demandado', 'Otro'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setPosicionTipo(t)} className={`rounded-control px-2.5 py-1 text-[12px] ${posicionTipo === t ? 'bg-brand-50 font-semibold text-brand-700' : 'text-ink-600 hover:text-ink-900'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                {posicionTipo === 'Otro' && (
                  <input
                    type="text"
                    value={posicionOtra}
                    onChange={(e) => setPosicionOtra(e.target.value)}
                    maxLength={80}
                    placeholder="Ministerio Público, tercero, apoderado de la víctima…"
                    className="field min-w-[200px] flex-1"
                    autoFocus
                  />
                )}
              </div>
            </div>
            <div>
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">3 · ¿Qué quiere probar? (opcional)</p>
              <textarea value={quiereProbar} onChange={(e) => setQuiereProbar(e.target.value)} rows={3} maxLength={1000} placeholder="Por ejemplo: que el pago se hizo antes del plazo y la contraparte lo recibió." className="field-area mt-1 w-full resize-none" />
            </div>
            <div>
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">4 · Tipo de audiencia (opcional)</p>
              <input type="text" value={tipoDeAudiencia} onChange={(e) => setTipoDeAudiencia(e.target.value)} maxLength={120} placeholder="Audiencia inicial, de instrucción y juzgamiento, de juicio oral…" className="field mt-1 w-full" />
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void generarPreguntas()} disabled={ocupado !== null || !posicionElegida || publicos.length === 0} className="btn-primary btn-sm disabled:opacity-50" title="La guía lee el escrito y devuelve las preguntas; se descuenta del saldo solo si responde">
                <RefreshCw className={`h-3.5 w-3.5 ${ocupado === 'preguntas' ? 'animate-spin' : ''}`} />
                {ocupado === 'preguntas' ? 'La guía está leyendo el escrito…' : `Pedir las preguntas · ${pesos(preguntas.precioCop)}`}
              </button>
              <span className="self-center text-[11px] text-ink-500">Se descuenta del saldo de la firma; si la guía no responde, no se cobra.</span>
              {g && (
                <button type="button" onClick={() => setFormularioDePreguntas(false)} disabled={ocupado !== null} className="btn-neutral btn-sm">
                  Ver las anteriores
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {g.preguntas.enfoque && (
              <p className="notice text-ui leading-[1.5] [text-wrap:pretty]" title="Lo que esta actuación exige probar, según su ficha, y la audiencia en la que se pregunta">
                <span className="font-semibold text-ink-900">Enfoque · </span>
                {g.preguntas.enfoque}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="min-w-0 flex-1 text-[11px] leading-snug text-ink-500">
                {total} preguntas · posición: <span className="text-ink-800">{g.parametros.posicion}</span>
                {g.parametros.audiencia ? ` · ${g.parametros.audiencia}` : ''}
                {g.generadoEl ? ` · ${fechaCorta(g.generadoEl)}` : ''}
              </p>
              <button type="button" onClick={() => void copiarPreguntas()} className="btn-neutral btn-sm" title="Copiar las tres listas como texto">
                {copiadas ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiadas ? 'Copiadas' : 'Copiar'}
              </button>
              <button type="button" onClick={() => void preguntas.onExportarWord(g).catch((err: unknown) => setError(err instanceof Error ? err.message : 'No se pudo exportar a Word.'))} className="btn-neutral btn-sm" title="Descargar en Word para seguir trabajándolas">
                <Download className="h-3 w-3" />
                Word
              </button>
              <button type="button" onClick={() => void preguntas.onExportarPdf(g).catch((err: unknown) => setError(err instanceof Error ? err.message : 'No se pudo exportar a PDF.'))} className="btn-neutral btn-sm" title="Descargar en PDF para llevarlas impresas">
                <Download className="h-3 w-3" />
                PDF
              </button>
              <button type="button" onClick={() => setFormularioDePreguntas(true)} disabled={ocupado !== null} className="btn-secondary btn-sm" title="Pedir un juego nuevo con otros parámetros o sobre el texto corregido">
                <RefreshCw className="h-3 w-3" />
                Volver a generar
              </button>
            </div>
            {g.parametros.quiereProbar && <p className="text-[11.5px] italic leading-snug text-ink-600">Quiere probar: {g.parametros.quiereProbar}</p>}
            {seccionesPedidas(g).map((s) => {
              const lista = g.preguntas[s.clave];
              return (
                <section key={s.clave}>
                  <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">{s.titulo}</h4>
                  <p className="text-[11px] italic text-ink-500">{s.nota}</p>
                  {lista.length === 0 ? (
                    <p className="mt-1 text-ink-500">La guía no encontró en el escrito sustento para preguntas de esta lista.</p>
                  ) : (
                    <ol className="mt-1.5 space-y-2">
                      {lista.map((q, i) => (
                        <li key={i} className="rounded-control border border-line-100 bg-canvas px-2.5 py-2">
                          <p className="leading-snug text-ink-900">
                            <span className="font-semibold">{i + 1}.</span> {q.pregunta}
                          </p>
                          {q.paraQue && (
                            <p className="mt-1 text-[11.5px] leading-snug text-ink-600">
                              <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink-400">Para qué</span> {q.paraQue}
                            </p>
                          )}
                          {q.delEscrito && (
                            <button type="button" onClick={() => setReferencias([q.delEscrito as string])} className="mt-1 block w-full border-l-2 border-line-200 pl-2 text-left text-[11.5px] italic leading-snug text-ink-500 hover:border-sky-500 hover:text-ink-700" title="Subrayar este pasaje en el escrito">
                              «{q.delEscrito}»
                            </button>
                          )}
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
              );
            })}
            <p className="border-t border-line-100 pt-2 text-[11px] leading-snug text-ink-500">
              La guía solo conoce el escrito: no el expediente, las pruebas ni a las personas. Pese cada pregunta antes de formularla.
            </p>
          </>
        )}
      </div>
    );
  };

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
            disabled={ocupado !== null || Boolean(cerradas?.rerevisar)}
            title={cerradas?.rerevisar ? AVISO_FUNCION_DESHABILITADA : undefined}
            className="btn-secondary btn-sm disabled:cursor-not-allowed disabled:opacity-60"
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
            {(['chat', 'comentarios', 'informe', 'versiones', ...(preguntas ? (['preguntas'] as const) : [])] as const).map((p) => (
              <button key={p} type="button" onClick={() => setPanel(p)} className={`px-3 py-2 text-[12.5px] ${panel === p ? 'border-b-2 border-brand-700 font-semibold text-brand-700' : 'text-ink-500'}`} title={p === 'preguntas' ? 'Preguntas para la audiencia' : undefined}>
                {p === 'chat'
                  ? 'Guía'
                  : p === 'comentarios'
                    ? `Comentarios${comentarios.length ? ` (${comentarios.length})` : ''}`
                    : p === 'informe'
                      ? 'Informe'
                      : p === 'versiones'
                        ? `Versiones${versiones.length ? ` (${versiones.length})` : ''}`
                        : 'Audiencia'}
              </button>
            ))}
          </div>
          {panel === 'chat' ? Chat() : panel === 'comentarios' ? ComentariosPanel() : panel === 'informe' ? InformePanel() : panel === 'preguntas' ? PreguntasPanel() : VersionesPanel()}
        </div>
      </div>
    </div>
  );
};
