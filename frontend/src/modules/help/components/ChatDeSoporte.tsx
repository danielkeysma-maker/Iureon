import React from 'react';
import { ArrowLeft, MessageSquarePlus, Send } from 'lucide-react';
import { supportChatApi, type Conversacion, type Mensaje } from '../../support/supportChat.api';

/**
 * El chat de soporte, lado de la firma.
 *
 * ─── TRES PANTALLAS EN UNA ──────────────────────────────────────────────────
 *
 * La lista de conversaciones de la firma, el formulario para abrir una nueva y
 * el hilo abierto. Es un solo componente con un estado `vista` y no tres rutas
 * porque vive DENTRO de la pantalla de Soporte, al lado de la tarjeta de
 * WhatsApp, y no tiene navegador propio.
 *
 * ─── SE SONDEA, NO SE SUSCRIBE ──────────────────────────────────────────────
 *
 * Cada 30 segundos mientras la pestaña esté visible, y en el acto al volver a
 * ella. Es el mismo mecanismo del saldo en `App.tsx`: una suscripción en vivo
 * exigiría abrir la base al navegador, y para una respuesta que llega en
 * minutos u horas medio minuto de retraso no se nota.
 *
 * ─── LA ADVERTENCIA VA ARRIBA, A TAMAÑO DE LECTURA ──────────────────────────
 *
 * Quién atiende, que no hay tiempo garantizado y qué no se pega aquí. Es la
 * misma regla que la tarjeta de WhatsApp, y por la misma razón: el operador no
 * tiene acceso al material de la firma, y el chat no debe volverse la puerta
 * por la que ese material sale sin que un socio lo autorice.
 */

interface ChatDeSoporteProps {
  firma: string;
  /** El correo de la sesión: distingue «Usted» de otro abogado de la misma firma. */
  correo: string;
}

const CADA_MS = 30_000;

const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

const hora = (iso: string): string =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const mensajeDeError = (err: unknown, porDefecto: string): string =>
  err instanceof Error && err.message ? err.message : porDefecto;

/** Lo que el lector tiene que saber antes de escribir. Compartido por las tres vistas. */
const Aviso: React.FC = () => (
  <p className="rounded-control border border-line-200 bg-canvas px-3 py-2.5 text-meta leading-[1.6] text-ink-700 [text-wrap:pretty]">
    Lo atiende el operador de la plataforma en horario laboral; no hay tiempo de respuesta
    garantizado. No pegue aquí datos de clientes ni documentos del caso.
  </p>
);

const ChipEstado: React.FC<{ status: Conversacion['status'] }> = ({ status }) => (
  <span className={status === 'ABIERTA' ? 'chip-curated' : 'chip-neutral'}>
    {status === 'ABIERTA' ? 'Abierta' : 'Cerrada'}
  </span>
);

export const ChatDeSoporte: React.FC<ChatDeSoporteProps> = ({ firma, correo }) => {
  const [conversaciones, setConversaciones] = React.useState<Conversacion[]>([]);
  const [vista, setVista] = React.useState<'lista' | 'nueva' | 'hilo'>('lista');
  const [abierta, setAbierta] = React.useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = React.useState<Mensaje[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');

  const [asunto, setAsunto] = React.useState('');
  const [texto, setTexto] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);

  const finDelHilo = React.useRef<HTMLDivElement>(null);
  /*
   * El id del hilo abierto en una ref, además del estado: el sondeo corre en
   * un intervalo creado una vez y necesita saber qué hilo refrescar sin
   * recrearse cada vez que el usuario cambia de conversación.
   */
  const hiloAbiertoRef = React.useRef<string | null>(null);

  const cargarLista = React.useCallback(async () => {
    try {
      const r = await supportChatApi.listar();
      setConversaciones(r.conversaciones);
      setError('');
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudieron cargar las conversaciones.'));
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarHilo = React.useCallback(async (id: string) => {
    try {
      const r = await supportChatApi.hilo(id);
      setAbierta(r.conversacion);
      setMensajes(r.mensajes);
      setError('');
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo abrir la conversación.'));
    }
  }, []);

  React.useEffect(() => {
    void cargarLista();
  }, [cargarLista]);

  React.useEffect(() => {
    const siVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void cargarLista();
      if (hiloAbiertoRef.current) void cargarHilo(hiloAbiertoRef.current);
    };
    const intervalo = window.setInterval(siVisible, CADA_MS);
    document.addEventListener('visibilitychange', siVisible);
    window.addEventListener('focus', siVisible);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', siVisible);
      window.removeEventListener('focus', siVisible);
    };
  }, [cargarLista, cargarHilo]);

  React.useEffect(() => {
    if (vista === 'hilo') finDelHilo.current?.scrollIntoView({ block: 'end' });
  }, [mensajes, vista]);

  const abrirHilo = async (c: Conversacion) => {
    hiloAbiertoRef.current = c.id;
    setAbierta(c);
    setMensajes([]);
    setVista('hilo');
    await cargarHilo(c.id);
    // El servidor puso el contador a cero al abrir; la lista lo refleja sin otra lectura.
    setConversaciones((lista) => lista.map((x) => (x.id === c.id ? { ...x, unreadForFirm: 0 } : x)));
  };

  const volver = () => {
    hiloAbiertoRef.current = null;
    setAbierta(null);
    setMensajes([]);
    setTexto('');
    setVista('lista');
    void cargarLista();
  };

  const abrirNueva = async () => {
    if (enviando) return;
    setEnviando(true);
    setError('');
    try {
      const r = await supportChatApi.abrir(asunto, texto);
      setAsunto('');
      setTexto('');
      setConversaciones((lista) => [r.conversacion, ...lista]);
      await abrirHilo(r.conversacion);
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo abrir la conversación.'));
    } finally {
      setEnviando(false);
    }
  };

  const enviar = async () => {
    if (!abierta || !texto.trim() || enviando) return;
    setEnviando(true);
    setError('');
    try {
      const r = await supportChatApi.enviar(abierta.id, texto);
      setTexto('');
      setMensajes((m) => [...m, r.mensaje]);
      setAbierta(r.conversacion);
      setConversaciones((lista) =>
        lista.map((x) => (x.id === r.conversacion.id ? r.conversacion : x))
      );
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo enviar el mensaje.'));
    } finally {
      setEnviando(false);
    }
  };

  const alTeclear = (e: React.KeyboardEvent<HTMLTextAreaElement>, accion: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      accion();
    }
  };

  // ─── El hilo ───────────────────────────────────────────────────────────────
  if (vista === 'hilo' && abierta) {
    return (
      <section className="flex min-h-[420px] flex-col rounded-card border border-line-200 bg-surface">
        <header className="flex items-center gap-2.5 border-b border-line-100 px-4 py-3">
          <button type="button" onClick={volver} className="btn-ghost btn-sm" title="Volver a la lista">
            <ArrowLeft size={14} strokeWidth={2.2} />
            Volver
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-subtitle text-ink-900">{abierta.subject}</h3>
            <p className="font-mono text-[10px] text-ink-400">
              {firma} · abierta el {fechaCorta(abierta.createdAt)}
            </p>
          </div>
          <ChipEstado status={abierta.status} />
        </header>

        <div className="px-4 pt-3">
          <Aviso />
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {mensajes.map((m) => {
            const mio = m.authorSide === 'FIRMA';
            return (
              <div key={m.id} className={`max-w-[88%] ${mio ? 'ml-auto' : ''}`}>
                <div
                  className={`rounded-card px-3 py-2 text-[13px] leading-relaxed ${
                    mio ? 'bg-brand-700 text-white' : 'border border-line-200 bg-canvas text-ink-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">{m.body}</p>
                </div>
                <p className={`mt-0.5 font-mono text-[10px] text-ink-400 ${mio ? 'text-right' : ''}`}>
                  {mio ? (m.authorEmail === correo ? 'Usted' : m.authorEmail) : 'Soporte de Iureon'} ·{' '}
                  {hora(m.createdAt)}
                </p>
              </div>
            );
          })}
          {abierta.status === 'CERRADA' && (
            <p className="text-center font-mono text-[10.5px] text-ink-400">
              Soporte dio esta conversación por resuelta. Si escribe, se reabre.
            </p>
          )}
          <div ref={finDelHilo} />
        </div>

        {error && <p className="px-4 pb-1 text-meta text-danger">{error}</p>}

        <div className="border-t border-line-100 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => alTeclear(e, () => void enviar())}
              rows={2}
              maxLength={4000}
              placeholder="Escriba a soporte… (Enter envía, Shift+Enter salta de línea)"
              disabled={enviando}
              className="field-area min-h-[44px] flex-1 resize-none"
            />
            <button
              type="button"
              onClick={() => void enviar()}
              disabled={!texto.trim() || enviando}
              className="btn-primary btn-sm h-[44px] disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Enviar
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ─── Nueva conversación ────────────────────────────────────────────────────
  if (vista === 'nueva') {
    return (
      <section className="flex flex-col gap-3 rounded-card border border-line-200 bg-surface px-4 py-3">
        <header className="flex items-center gap-2.5">
          <button type="button" onClick={volver} className="btn-ghost btn-sm">
            <ArrowLeft size={14} strokeWidth={2.2} />
            Volver
          </button>
          <h3 className="text-subtitle text-ink-900">Nueva conversación</h3>
        </header>
        <Aviso />
        <label className="flex flex-col gap-1">
          <span className="field-label">Asunto</span>
          <input
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            maxLength={140}
            placeholder="En una línea: qué pasa y en qué pantalla"
            className="field"
            disabled={enviando}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="field-label">Mensaje</span>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={5}
            maxLength={4000}
            placeholder="Si tiene un término que vence hoy o mañana, dígalo en la primera línea."
            className="field-area resize-none"
            disabled={enviando}
          />
        </label>
        {error && <p className="text-meta text-danger">{error}</p>}
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={volver} className="btn-neutral btn-sm" disabled={enviando}>
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void abrirNueva()}
            disabled={asunto.trim().length < 3 || !texto.trim() || enviando}
            className="btn-primary btn-sm disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            {enviando ? 'Enviando…' : 'Abrir conversación'}
          </button>
        </div>
      </section>
    );
  }

  // ─── La lista ──────────────────────────────────────────────────────────────
  return (
    <section className="flex flex-col gap-3 rounded-card border border-line-200 bg-surface px-4 py-3">
      <header className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-subtitle text-ink-900">Sus conversaciones con soporte</h3>
          <p className="text-meta text-ink-500">
            Las ve cualquier abogado de {firma}. Quedan registradas en su cuenta, no en un canal
            externo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError('');
            setVista('nueva');
          }}
          className="btn-primary btn-sm shrink-0"
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Nueva conversación
        </button>
      </header>

      <Aviso />

      {error && <p className="text-meta text-danger">{error}</p>}

      {cargando ? (
        <p className="py-4 text-center text-meta text-ink-500">Cargando…</p>
      ) : conversaciones.length === 0 ? (
        <p className="py-4 text-center text-meta text-ink-500">
          Todavía no ha escrito a soporte desde la aplicación.
        </p>
      ) : (
        <ul className="divide-y divide-line-100">
          {conversaciones.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => void abrirHilo(c)}
                className="flex w-full items-start gap-3 px-1 py-2.5 text-left hover:bg-canvas"
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2">
                    <span className={`truncate text-ui ${c.unreadForFirm > 0 ? 'font-semibold' : ''} text-ink-900`}>
                      {c.subject}
                    </span>
                    {c.unreadForFirm > 0 && (
                      <span className="shrink-0 rounded-full bg-brand-700 px-1.5 font-mono text-[10px] font-semibold text-white">
                        {c.unreadForFirm}
                      </span>
                    )}
                  </p>
                  {c.lastMessagePreview && (
                    <p className="mt-0.5 truncate text-meta text-ink-500">
                      {c.lastAuthor === 'OPERADOR' ? 'Soporte: ' : ''}
                      {c.lastMessagePreview}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <ChipEstado status={c.status} />
                  <span className="font-mono text-[10px] text-ink-400">
                    {fechaCorta(c.lastMessageAt ?? c.updatedAt)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
