import React from 'react';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { Dialog } from '../../../design/Dialog';
import { supportChatApi, type ConversacionConFirma, type Mensaje } from '../../support/supportChat.api';
import { esperanRespuesta } from '../consolaEnPantalla';

/**
 * La bandeja de soporte del operador: todas las firmas, abiertas primero.
 * Cara nueva: `public/handoff/app-consola-de-operacion.html`, artboard 5
 * (primer diálogo: «Soporte · conversaciones de las firmas», «Tres esperan
 * respuesta.», tarjetas por conversación —ámbar la que espera— con la firma, la
 * hora y la última frase entre comillas, y el campo «Responder a la firma…»).
 *
 * ─── LO QUE EL OPERADOR VE Y LO QUE NO ──────────────────────────────────────
 *
 * Ve lo que la firma le ESCRIBIÓ, y nada más: el chat no da acceso al material
 * de la firma. Si para responder necesita ver un escrito, el camino sigue
 * siendo pedir acceso desde la ficha. Aquí no hay enlace a esa ficha a
 * propósito, para que el atajo no exista.
 *
 * ─── LO QUE EL ARTBOARD DICE Y AQUÍ NO SE DICE, con la razón ───────────────
 *
 * «La respuesta le llega a la firma por correo»: `supportChat.service` no
 * importa ningún correo. Avisa con una notificación a los navegadores de la
 * firma que la activaron (`enviarAFirma`), y la respuesta queda en su historial
 * de soporte. La nota del pie dice eso.
 *
 * ─── CERRAR NO ES BLOQUEAR ──────────────────────────────────────────────────
 *
 * Cerrar dice «por ahora está resuelto». Si la firma vuelve a escribir, el hilo
 * se reabre solo. Por eso la confirmación lo dice así y el botón no es de peligro.
 *
 * Sondeo cada 30 segundos mientras la pestaña esté visible, como el resto.
 */

const CADA_MS = 30_000;

const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const hora = (iso: string): string => new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

const mensajeDeError = (err: unknown, porDefecto: string): string =>
  err instanceof Error && err.message ? err.message : porDefecto;

interface BandejaDeSoporteProps {
  onCerrar: () => void;
  /** Cuántas esperan respuesta tras cada lectura; `null` si la bandeja no se pudo leer. */
  onCambio?: (esperan: number | null) => void;
}

export const BandejaDeSoporte: React.FC<BandejaDeSoporteProps> = ({ onCerrar, onCambio }) => {
  const [conversaciones, setConversaciones] = React.useState<ConversacionConFirma[]>([]);
  const [leida, setLeida] = React.useState(false);
  const [abierta, setAbierta] = React.useState<ConversacionConFirma | null>(null);
  const [mensajes, setMensajes] = React.useState<Mensaje[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');
  const [texto, setTexto] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);

  const finDelHilo = React.useRef<HTMLDivElement>(null);
  const hiloAbiertoRef = React.useRef<string | null>(null);
  const alCambiarRef = React.useRef(onCambio);
  React.useEffect(() => {
    alCambiarRef.current = onCambio;
  });

  const cargarBandeja = React.useCallback(async () => {
    try {
      const r = await supportChatApi.bandeja();
      setConversaciones(r.conversaciones);
      setLeida(true);
      setError('');
      alCambiarRef.current?.(esperanRespuesta(r.conversaciones));
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo leer la bandeja de soporte.'));
      alCambiarRef.current?.(null);
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
    setConversaciones((lista) => lista.map((x) => (x.id === c.id ? { ...x, unreadForOperator: 0 } : x)));
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
        <p className="cn-ope-texto">
          «{hilo.subject}» de <strong>{hilo.firmName}</strong> pasa a cerrada y sale de la parte alta de la bandeja. La firma sigue
          viéndola, y si vuelve a escribir se reabre sola. Queda en su auditoría con su correo.
        </p>
      ),
      etiqueta: 'Cerrar la conversación',
      onConfirmar: async () => {
        const cerrada = await supportChatApi.cerrar(hilo.id);
        setAbierta({ ...cerrada, firmName: hilo.firmName });
        await cargarBandeja();
      }
    });
  };

  const esperan = leida ? esperanRespuesta(conversaciones) : null;
  const subtitulo =
    esperan === null
      ? cargando
        ? 'Leyendo la bandeja…'
        : 'La bandeja no se pudo leer.'
      : esperan === 0
        ? 'Ninguna espera respuesta.'
        : `${esperan} ${esperan === 1 ? 'espera' : 'esperan'} respuesta.`;

  return (
    <Dialog abierto onCerrar={onCerrar} titulo="Soporte · conversaciones de las firmas" subtitulo={subtitulo} tamano="L">
      <div className="cn-ope-cuerpo cn-ope-soporte">
        {error && (
          <p role="alert" className="cn-ope-error">
            {error}
          </p>
        )}

        {abierta ? (
          <section className="cn-ope-hilo" aria-labelledby="ope-hilo-asunto">
            <div className="cn-ope-hilo-cabeza">
              <button type="button" className="cn-ope-volver" onClick={volver}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Bandeja
              </button>
              <div className="cn-ope-hilo-titulo">
                <h3 id="ope-hilo-asunto" className="cn-ope-subtitulo">
                  {abierta.subject}
                </h3>
                <p className="cn-ope-secundario">
                  {abierta.firmName} · abrió {abierta.openedByEmail} · {fechaCorta(abierta.createdAt)}
                </p>
              </div>
              <span className={`cn-ope-estado ${abierta.status === 'ABIERTA' ? 'cn-ope-estado--marca' : 'cn-ope-estado--neutro'}`}>
                {abierta.status === 'ABIERTA' ? 'Abierta' : 'Cerrada'}
              </span>
              {abierta.status === 'ABIERTA' && (
                <button type="button" onClick={pedirCierre} className="cn-ope-boton cn-ope-boton--suave">
                  Cerrar la conversación
                </button>
              )}
            </div>

            <div className="cn-ope-mensajes">
              {mensajes.map((m) => {
                const mio = m.authorSide === 'OPERADOR';
                return (
                  <div key={m.id} className={`cn-ope-mensaje ${mio ? 'cn-ope-mensaje--mio' : ''}`}>
                    <p className="cn-ope-mensaje-cuerpo">{m.body}</p>
                    <p className="cn-ope-mensaje-pie">
                      {mio ? 'Usted (soporte)' : m.authorEmail} · {hora(m.createdAt)}
                    </p>
                  </div>
                );
              })}
              {abierta.status === 'CERRADA' && (
                <p className="cn-ope-texto cn-ope-texto--centro">
                  Cerrada{abierta.closedByEmail ? ` por ${abierta.closedByEmail}` : ''}
                  {abierta.closedAt ? ` · ${fechaCorta(abierta.closedAt)}` : ''}. Si la firma escribe, se reabre.
                </p>
              )}
              <div ref={finDelHilo} />
            </div>

            {abierta.status === 'ABIERTA' && (
              <div className="cn-ope-responder">
                <label htmlFor="ope-respuesta" className="cn-ope-solo-lector">
                  Responder a la firma
                </label>
                <textarea
                  id="ope-respuesta"
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
                  className="cn-ope-campo cn-ope-area"
                />
                <button
                  type="button"
                  onClick={() => void responder()}
                  disabled={!texto.trim() || enviando}
                  className="cn-ope-boton cn-ope-boton--primario"
                >
                  {enviando ? 'Enviando…' : 'Responder'}
                </button>
              </div>
            )}
          </section>
        ) : cargando && !leida ? (
          <p className="cn-ope-vacio">Leyendo las conversaciones…</p>
        ) : leida && conversaciones.length === 0 ? (
          <p className="cn-ope-vacio">Ninguna firma ha escrito a soporte desde la aplicación.</p>
        ) : (
          <ul className="cn-ope-conversaciones">
            {conversaciones.map((c) => {
              const espera = c.status === 'ABIERTA' && c.lastAuthor === 'FIRMA';
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => void abrirHilo(c)}
                    className={`cn-ope-conversacion ${espera ? 'cn-ope-conversacion--espera' : ''}`}
                  >
                    <span className="cn-ope-conversacion-cabeza">
                      <span className="cn-ope-principal">{c.firmName}</span>
                      <span className="cn-ope-conversacion-hora">{fechaCorta(c.lastMessageAt ?? c.updatedAt)}</span>
                    </span>
                    <span className="cn-ope-conversacion-asunto">
                      {c.subject}
                      {c.unreadForOperator > 0 && (
                        <span className="cn-ope-contador" aria-label={`${c.unreadForOperator} sin leer`}>
                          {c.unreadForOperator}
                        </span>
                      )}
                      {c.status === 'CERRADA' && <span className="cn-ope-estado cn-ope-estado--neutro">Cerrada</span>}
                    </span>
                    {c.lastMessagePreview && (
                      <span className="cn-ope-conversacion-texto">
                        {c.lastAuthor === 'OPERADOR' ? 'Usted: ' : ''}«{c.lastMessagePreview}»
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <p className="cn-ope-recuadro">
          La respuesta queda en el historial de soporte de la firma y le llega como aviso a los navegadores de la firma que
          activaron las notificaciones. No sale por correo.
        </p>

        <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
      </div>
    </Dialog>
  );
};
