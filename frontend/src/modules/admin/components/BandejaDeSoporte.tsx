import React from 'react';
import { ArrowLeft, CheckCircle2, MessageSquare, RefreshCw, Send } from 'lucide-react';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import {
  supportChatApi,
  type ConversacionConFirma,
  type Mensaje
} from '../../support/supportChat.api';

/**
 * La bandeja de soporte del operador: todas las firmas, abiertas primero.
 *
 * ─── LO QUE EL OPERADOR VE Y LO QUE NO ──────────────────────────────────────
 *
 * Ve lo que la firma le ESCRIBIÓ, y nada más: el chat no da acceso al material
 * de la firma. Si para responder necesita ver un escrito, el camino sigue
 * siendo el acceso de soporte (8a), que pide un socio autorice. Aquí no hay
 * enlace a esa ficha a propósito, para que el atajo no exista.
 *
 * ─── CERRAR NO ES BLOQUEAR ──────────────────────────────────────────────────
 *
 * Cerrar dice «por ahora está resuelto» y saca el hilo de la parte alta de la
 * bandeja. Si la firma vuelve a escribir, el hilo se reabre solo. Por eso el
 * diálogo de confirmación lo dice así y el botón no es de peligro.
 *
 * Sondeo cada 30 segundos mientras la pestaña esté visible, como el resto.
 */

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

export const BandejaDeSoporte: React.FC = () => {
  const [conversaciones, setConversaciones] = React.useState<ConversacionConFirma[]>([]);
  const [totales, setTotales] = React.useState({ abiertas: 0, sinLeer: 0 });
  const [abierta, setAbierta] = React.useState<ConversacionConFirma | null>(null);
  const [mensajes, setMensajes] = React.useState<Mensaje[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');
  const [texto, setTexto] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);

  const finDelHilo = React.useRef<HTMLDivElement>(null);
  const hiloAbiertoRef = React.useRef<string | null>(null);

  const cargarBandeja = React.useCallback(async () => {
    try {
      const r = await supportChatApi.bandeja();
      setConversaciones(r.conversaciones);
      setTotales(r.totales);
      setError('');
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo cargar la bandeja de soporte.'));
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarHilo = React.useCallback(async (id: string) => {
    try {
      const r = await supportChatApi.hiloOperador(id);
      setAbierta(r.conversacion);
      setMensajes(r.mensajes);
      setError('');
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo abrir la conversación.'));
    }
  }, []);

  React.useEffect(() => {
    void cargarBandeja();
  }, [cargarBandeja]);

  React.useEffect(() => {
    const siVisible = () => {
      if (document.visibilityState !== 'visible') return;
      void cargarBandeja();
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
  }, [cargarBandeja, cargarHilo]);

  React.useEffect(() => {
    if (abierta) finDelHilo.current?.scrollIntoView({ block: 'end' });
  }, [mensajes, abierta]);

  const abrirHilo = async (c: ConversacionConFirma) => {
    hiloAbiertoRef.current = c.id;
    setAbierta(c);
    setMensajes([]);
    setTexto('');
    await cargarHilo(c.id);
    // El servidor puso el contador a cero al abrir; la bandeja lo refleja sin otra lectura.
    setConversaciones((lista) =>
      lista.map((x) => (x.id === c.id ? { ...x, unreadForOperator: 0 } : x))
    );
    setTotales((t) => ({ ...t, sinLeer: Math.max(0, t.sinLeer - c.unreadForOperator) }));
  };

  const volver = () => {
    hiloAbiertoRef.current = null;
    setAbierta(null);
    setMensajes([]);
    setTexto('');
    void cargarBandeja();
  };

  const responder = async () => {
    if (!abierta || !texto.trim() || enviando) return;
    setEnviando(true);
    setError('');
    try {
      const r = await supportChatApi.responder(abierta.id, texto);
      setTexto('');
      setMensajes((m) => [...m, r.mensaje]);
      setAbierta({ ...r.conversacion, firmName: abierta.firmName });
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo enviar la respuesta.'));
    } finally {
      setEnviando(false);
    }
  };

  const pedirCierre = () => {
    if (!abierta) return;
    const hilo = abierta;
    setConfirmacion({
      titulo: 'Cerrar la conversación',
      texto: (
        <>
          «{hilo.subject}» de <b>{hilo.firmName}</b> pasa a cerrada y sale de la parte alta de la
          bandeja. La firma sigue viéndola, y si vuelve a escribir se reabre sola. Queda en su
          auditoría con su correo.
        </>
      ),
      etiqueta: 'Cerrar conversación',
      onConfirmar: async () => {
        const cerrada = await supportChatApi.cerrar(hilo.id);
        setAbierta({ ...cerrada, firmName: hilo.firmName });
        await cargarBandeja();
      }
    });
  };

  // ─── El hilo ───────────────────────────────────────────────────────────────
  if (abierta) {
    return (
      <section className="flex min-h-[420px] flex-col rounded-card border border-line-200 bg-surface">
        <header className="flex items-center gap-2.5 border-b border-line-100 px-4 py-3">
          <button type="button" onClick={volver} className="btn-ghost btn-sm" title="Volver a la bandeja">
            <ArrowLeft size={14} strokeWidth={2.2} />
            Bandeja
          </button>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-subtitle text-ink-900">{abierta.subject}</h3>
            <p className="truncate font-mono text-[10px] text-ink-400">
              {abierta.firmName} · abrió {abierta.openedByEmail} · {fechaCorta(abierta.createdAt)}
            </p>
          </div>
          <span className={abierta.status === 'ABIERTA' ? 'chip-curated' : 'chip-neutral'}>
            {abierta.status === 'ABIERTA' ? 'Abierta' : 'Cerrada'}
          </span>
          {abierta.status === 'ABIERTA' && (
            <button type="button" onClick={pedirCierre} className="btn-secondary btn-sm">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Cerrar conversación
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {mensajes.map((m) => {
            const mio = m.authorSide === 'OPERADOR';
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
                  {mio ? 'Usted (soporte)' : m.authorEmail} · {hora(m.createdAt)}
                </p>
              </div>
            );
          })}
          {abierta.status === 'CERRADA' && (
            <p className="text-center font-mono text-[10.5px] text-ink-400">
              Cerrada{abierta.closedByEmail ? ` por ${abierta.closedByEmail}` : ''}
              {abierta.closedAt ? ` · ${fechaCorta(abierta.closedAt)}` : ''}. Si la firma escribe, se
              reabre.
            </p>
          )}
          <div ref={finDelHilo} />
        </div>

        {error && <p className="px-4 pb-1 text-meta text-danger">{error}</p>}

        {abierta.status === 'ABIERTA' && (
          <div className="border-t border-line-100 p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void responder();
                  }
                }}
                rows={2}
                maxLength={4000}
                placeholder="Responder a la firma… (Enter envía, Shift+Enter salta de línea)"
                disabled={enviando}
                className="field-area min-h-[44px] flex-1 resize-none"
              />
              <button
                type="button"
                onClick={() => void responder()}
                disabled={!texto.trim() || enviando}
                className="btn-primary btn-sm h-[44px] disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                Responder
              </button>
            </div>
          </div>
        )}

        <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
      </section>
    );
  }

  // ─── La bandeja ────────────────────────────────────────────────────────────
  return (
    <section className="rounded-card border border-line-200 bg-surface">
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-brand-700" />
          <div>
            <h3 className="text-xs font-bold text-ink-900">Soporte · conversaciones de las firmas</h3>
            <p className="text-[11px] text-ink-500">
              {totales.abiertas} {totales.abiertas === 1 ? 'abierta' : 'abiertas'} ·{' '}
              <span className={totales.sinLeer > 0 ? 'font-semibold text-unverified' : ''}>
                {totales.sinLeer} sin leer
              </span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void cargarBandeja()}
          className="flex items-center gap-1.5 rounded-control border border-line-200 bg-canvas px-3 py-1.5 text-[11px] font-semibold text-ink-700 hover:bg-line-100"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </header>

      {error && <p className="px-4 pb-2 text-[11px] text-danger">{error}</p>}

      {cargando && conversaciones.length === 0 ? (
        <p className="px-4 pb-4 text-[11px] text-ink-500">Cargando conversaciones…</p>
      ) : conversaciones.length === 0 ? (
        <p className="px-4 pb-4 text-[11px] text-ink-500">
          Ninguna firma ha escrito a soporte desde la aplicación.
        </p>
      ) : (
        <div className="overflow-x-auto border-t border-line-100">
          <table className="w-full text-left">
            <thead>
              <tr className="t-head">
                <th className="px-4 py-2">Firma</th>
                <th className="px-2 py-2">Asunto</th>
                <th className="px-2 py-2">Último mensaje</th>
                <th className="px-2 py-2">Fecha</th>
                <th className="px-4 py-2 text-right">Estado</th>
              </tr>
            </thead>
            <tbody>
              {conversaciones.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => void abrirHilo(c)}
                  className="t-row cursor-pointer hover:bg-canvas"
                >
                  <td className="max-w-[180px] truncate px-4 py-2 text-[12px] font-semibold text-ink-900">
                    {c.firmName}
                  </td>
                  <td className="max-w-[260px] px-2 py-2">
                    <span className="flex items-center gap-2">
                      <span className={`truncate text-[12px] text-ink-900 ${c.unreadForOperator > 0 ? 'font-semibold' : ''}`}>
                        {c.subject}
                      </span>
                      {c.unreadForOperator > 0 && (
                        <span className="shrink-0 rounded-full bg-brand-700 px-1.5 font-mono text-[10px] font-semibold text-white">
                          {c.unreadForOperator}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="max-w-[320px] truncate px-2 py-2 text-[11.5px] text-ink-500">
                    {c.lastAuthor === 'OPERADOR' ? 'Usted: ' : c.lastAuthor === 'FIRMA' ? 'Firma: ' : ''}
                    {c.lastMessagePreview ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 font-mono text-[10.5px] text-ink-400">
                    {fechaCorta(c.lastMessageAt ?? c.updatedAt)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className={c.status === 'ABIERTA' ? 'chip-curated' : 'chip-neutral'}>
                      {c.status === 'ABIERTA' ? 'Abierta' : 'Cerrada'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
