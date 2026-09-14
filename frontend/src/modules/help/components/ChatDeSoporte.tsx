import React from 'react';
import { AlertTriangle, MessageSquarePlus, Send, X } from 'lucide-react';
import { IconoVolver } from '../../../design/ArtboardIcons';
import { supportChatApi, type Conversacion, type Mensaje } from '../../support/supportChat.api';
import { DialogoDeAyuda } from './DialogoDeAyuda';

/**
 * El chat de soporte, lado de la firma.
 *
 * ─── TRES PANTALLAS EN UNA ──────────────────────────────────────────────────
 *
 * La lista de conversaciones de la firma, el diálogo para abrir una nueva y el
 * hilo abierto. Es un solo componente con un estado `vista` y no tres rutas
 * porque vive DENTRO de la pantalla de Soporte y no tiene navegador propio.
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
 * Quién atiende, que no hay tiempo garantizado y qué no se pega aquí. El
 * operador no tiene acceso al material de la firma, y el chat no debe volverse
 * la puerta por la que ese material sale sin que un socio lo autorice.
 *
 * ─── EL ESTADO QUE SE PINTA ES EL QUE EL SERVIDOR GUARDA ────────────────────
 *
 * La maqueta tiene «Le respondieron», «En curso» y «Cerrada». El servidor
 * guarda dos estados —abierta y cerrada— y quién escribió de último. «Abierta»
 * y «Cerrada» siguen siendo las palabras del estado, que el manual nombra; que
 * soporte respondió se dice aparte, porque es otro dato y no un tercer estado.
 */

interface ChatDeSoporteProps {
  firma: string;
  /** El correo de la sesión: distingue «Usted» de otro abogado de la misma firma. */
  correo: string;
  /** Lo que va debajo de la lista; en el hilo abierto no se muestra. */
  pie?: React.ReactNode;
}

const CADA_MS = 30_000;

/*
 * «QUÉ PASÓ», LA PRIMERA LÍNEA DEL ASUNTO. La maqueta ofrece cuatro motivos. El
 * servidor no guarda categorías, así que el motivo no se inventa como campo:
 * escribe el comienzo del asunto, que el abogado completa.
 */
const MOTIVOS = ['Algo no funcionó', 'Un cobro que no entiendo', 'Una duda de uso', 'Falta algo en el catálogo'] as const;

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
  <p className="cn-sop-aviso">
    Lo atiende el operador de la plataforma en horario laboral; no hay tiempo de respuesta
    garantizado. No pegue aquí datos de clientes ni documentos del caso.
  </p>
);

const Estado: React.FC<{ status: Conversacion['status'] }> = ({ status }) => (
  <span className={`cn-sop-estado cn-sop-estado--${status === 'ABIERTA' ? 'abierta' : 'cerrada'}`}>
    {status === 'ABIERTA' ? 'Abierta' : 'Cerrada'}
  </span>
);

export const ChatDeSoporte: React.FC<ChatDeSoporteProps> = ({ firma, correo, pie }) => {
  const [conversaciones, setConversaciones] = React.useState<Conversacion[]>([]);
  const [vista, setVista] = React.useState<'lista' | 'hilo'>('lista');
  const [abierta, setAbierta] = React.useState<Conversacion | null>(null);
  const [mensajes, setMensajes] = React.useState<Mensaje[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [cargandoHilo, setCargandoHilo] = React.useState(false);
  const [error, setError] = React.useState('');

  const [dialogoAbierto, setDialogoAbierto] = React.useState(false);
  const [asunto, setAsunto] = React.useState('');
  const [texto, setTexto] = React.useState('');
  const [enviando, setEnviando] = React.useState(false);
  const [errorAlAbrir, setErrorAlAbrir] = React.useState('');
  const campoAsunto = React.useRef<HTMLInputElement>(null);
  const idDialogo = React.useId();
  const idLista = React.useId();
  const idRespuesta = React.useId();

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
    } finally {
      setCargandoHilo(false);
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
    setTexto('');
    setError('');
    setCargandoHilo(true);
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
    setError('');
    setVista('lista');
    void cargarLista();
  };

  const abrirDialogo = () => {
    setAsunto('');
    setTexto('');
    setErrorAlAbrir('');
    setDialogoAbierto(true);
  };

  const cerrarDialogo = () => {
    if (enviando) return;
    setDialogoAbierto(false);
  };

  const elegirMotivo = (motivo: string) => {
    setAsunto(`${motivo}: `);
    campoAsunto.current?.focus();
  };

  const abrirNueva = async () => {
    if (enviando || asunto.trim().length < 3 || !texto.trim()) return;
    setEnviando(true);
    setErrorAlAbrir('');
    try {
      const r = await supportChatApi.abrir(asunto, texto);
      setConversaciones((lista) => [r.conversacion, ...lista]);
      setDialogoAbierto(false);
      setAsunto('');
      setTexto('');
      await abrirHilo(r.conversacion);
    } catch (err) {
      setErrorAlAbrir(mensajeDeError(err, 'No se pudo abrir la conversación.'));
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
      setError(mensajeDeError(err, 'No se pudo enviar el mensaje. No se guardó.'));
    } finally {
      setEnviando(false);
    }
  };

  const alTeclear = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void enviar();
    }
  };

  // ─── El hilo ───────────────────────────────────────────────────────────────
  if (vista === 'hilo' && abierta) {
    return (
      <section className="cn-sop-hilo" aria-labelledby={idRespuesta}>
        <button type="button" onClick={volver} className="cn-sop-volver">
          <IconoVolver className="cn-sop-icono-linea" aria-hidden="true" />
          Soporte
        </button>
        <header className="cn-sop-hilo-cabeza">
          <div className="cn-sop-hilo-textos">
            <h1 id={idRespuesta} className="cn-sop-h1 cn-sop-h1--hilo">
              {abierta.subject}
            </h1>
            <p className="cn-sop-meta">
              {firma} · abierta el {fechaCorta(abierta.createdAt)}
            </p>
          </div>
          <Estado status={abierta.status} />
        </header>

        <Aviso />

        {cargandoHilo && mensajes.length === 0 ? (
          <p className="cn-sop-calma" role="status">
            <span className="cn-sop-giro" aria-hidden="true" />
            Cargando la conversación…
          </p>
        ) : (
          <ol className="cn-sop-mensajes">
            {mensajes.map((m) => {
              const mio = m.authorSide === 'FIRMA';
              return (
                <li key={m.id} className={`cn-sop-mensaje cn-sop-mensaje--${mio ? 'firma' : 'soporte'}`}>
                  <p className="cn-sop-mensaje-cuerpo">{m.body}</p>
                  <p className="cn-sop-mensaje-pie">
                    {mio ? (m.authorEmail === correo ? 'Usted' : m.authorEmail) : 'Soporte de Iureon'} ·{' '}
                    <time className="cn-sop-mono" dateTime={m.createdAt}>
                      {hora(m.createdAt)}
                    </time>
                  </p>
                </li>
              );
            })}
          </ol>
        )}
        {abierta.status === 'CERRADA' && (
          <p className="cn-sop-calma">Soporte dio esta conversación por resuelta. Si escribe, se reabre.</p>
        )}
        {/* El final del hilo guarda distancia con el cuadro de escribir, que va pegado abajo y lo taparía. */}
        <div ref={finDelHilo} className="cn-sop-fin" />

        {error && (
          <p className="cn-sop-error" role="alert">
            {error}
          </p>
        )}

        <form
          className="cn-sop-redactar"
          onSubmit={(e) => {
            e.preventDefault();
            void enviar();
          }}
        >
          <label className="cn-sop-sr" htmlFor={`${idRespuesta}-texto`}>
            Mensaje
          </label>
          <textarea
            id={`${idRespuesta}-texto`}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={alTeclear}
            rows={3}
            maxLength={4000}
            placeholder="Escriba a soporte… Enter envía, Shift+Enter salta de línea."
            disabled={enviando}
            className="cn-sop-entrada cn-sop-entrada--area"
          />
          <button
            type="submit"
            disabled={!texto.trim() || enviando}
            className="cn-sop-boton cn-sop-boton--primario"
          >
            <Send className="cn-sop-icono-linea" aria-hidden="true" />
            {enviando ? 'Enviando…' : 'Enviar'}
          </button>
        </form>
      </section>
    );
  }

  // ─── La lista ──────────────────────────────────────────────────────────────
  const hayCambios = asunto.trim().length > 0 || texto.trim().length > 0;

  return (
    <>
      <header className="cn-sop-cabeza">
        <div className="cn-sop-cabeza-textos">
          <h1 className="cn-sop-h1">Soporte</h1>
          <p className="cn-sop-bajada">Sus conversaciones y las de su firma.</p>
        </div>
        <button type="button" onClick={abrirDialogo} className="cn-sop-boton cn-sop-boton--primario">
          <MessageSquarePlus className="cn-sop-icono-linea" aria-hidden="true" />
          Nueva conversación
        </button>
      </header>

      <Aviso />

      <section className="cn-sop-seccion" aria-labelledby={idLista}>
        <div className="cn-sop-seccion-cabeza">
          <h2 id={idLista} className="cn-sop-h2">
            Sus conversaciones con soporte
          </h2>
          <p className="cn-sop-meta">
            Las ve cualquier abogado de {firma}. Quedan registradas en su cuenta, no en un canal externo.
          </p>
        </div>

        {/* Un fallo de lectura se dice: no se pinta como «todavía no ha escrito». */}
        {error && (
          <div className="cn-sop-fallo" role="alert">
            <AlertTriangle className="cn-sop-icono-linea" aria-hidden="true" />
            <p>{error}</p>
            <button type="button" className="cn-sop-boton cn-sop-boton--suave" onClick={() => void cargarLista()}>
              Volver a intentar
            </button>
          </div>
        )}

        {cargando ? (
          <p className="cn-sop-calma" role="status">
            <span className="cn-sop-giro" aria-hidden="true" />
            Cargando sus conversaciones…
          </p>
        ) : conversaciones.length === 0 ? (
          !error && (
            <div className="cn-sop-vacio">
              <p className="cn-sop-vacio-titulo">Todavía no ha escrito a soporte desde la aplicación.</p>
              <p className="cn-sop-vacio-texto">
                Cuando abra una conversación quedará aquí, con su estado y lo último que se escribió.
              </p>
            </div>
          )
        ) : (
          <ul className="cn-sop-lista">
            {conversaciones.map((c) => {
              const cerrada = c.status === 'CERRADA';
              const respondio = !cerrada && c.lastAuthor === 'OPERADOR';
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => void abrirHilo(c)}
                    className={`cn-sop-conversacion${cerrada ? ' cn-sop-conversacion--cerrada' : ''}`}
                  >
                    <span className="cn-sop-conversacion-cabeza">
                      <span className="cn-sop-conversacion-textos">
                        <span
                          className={`cn-sop-conversacion-asunto${c.unreadForFirm > 0 ? ' cn-sop-conversacion-asunto--sin-leer' : ''}`}
                        >
                          {c.subject}
                        </span>
                        <span className="cn-sop-conversacion-meta">
                          Abierta el {fechaCorta(c.createdAt)} · {c.openedByEmail}
                        </span>
                      </span>
                      <span className="cn-sop-conversacion-marcas">
                        <Estado status={c.status} />
                        {respondio && <span className="cn-sop-respondio">Soporte respondió</span>}
                        {c.unreadForFirm > 0 && (
                          <span className="cn-sop-sin-leer">
                            <span className="cn-sop-mono">{c.unreadForFirm}</span> sin leer
                          </span>
                        )}
                      </span>
                    </span>
                    {c.lastMessagePreview && (
                      <span className="cn-sop-conversacion-ultimo">
                        {c.lastAuthor === 'OPERADOR' ? 'Soporte: ' : 'Su firma: '}«{c.lastMessagePreview}»
                      </span>
                    )}
                    <span className="cn-sop-conversacion-fecha">
                      Último mensaje · <span className="cn-sop-mono">{fechaCorta(c.lastMessageAt ?? c.updatedAt)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {pie}

      {/* ─── Nueva conversación: el diálogo «Escribir a soporte» de la maqueta ─── */}
      <DialogoDeAyuda
        abierto={dialogoAbierto}
        onCerrar={cerrarDialogo}
        tituloId={idDialogo}
        clase="cn-sop-escribir"
        cierraConVelo={!hayCambios}
      >
        <form
          className="cn-sop-escribir-cuerpo"
          onSubmit={(e) => {
            e.preventDefault();
            void abrirNueva();
          }}
        >
          <div className="cn-sop-escribir-cabeza">
            <div>
              <h2 id={idDialogo} className="cn-sop-h2 cn-sop-h2--grande">
                Nueva conversación
              </h2>
              <p className="cn-sop-bajada-2">
                Queda guardada en su cuenta y la respuesta aparece en esta pantalla.
              </p>
            </div>
            <button type="button" onClick={cerrarDialogo} aria-label="Cerrar sin enviar" className="cn-sop-icono">
              <X aria-hidden="true" />
            </button>
          </div>

          <fieldset className="cn-sop-motivos">
            <legend className="cn-sop-etiqueta">Qué pasó</legend>
            <div className="cn-sop-motivos-lista">
              {MOTIVOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={asunto.startsWith(m)}
                  className="cn-sop-motivo"
                  onClick={() => elegirMotivo(m)}
                  disabled={enviando}
                >
                  {m}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="cn-sop-campo">
            <span className="cn-sop-etiqueta">Asunto</span>
            <input
              ref={campoAsunto}
              data-foco-inicial
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              maxLength={140}
              placeholder="En una línea: qué pasa y en qué pantalla"
              className="cn-sop-entrada"
              disabled={enviando}
            />
          </label>
          <label className="cn-sop-campo">
            <span className="cn-sop-etiqueta">Mensaje</span>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Con sus palabras, qué esperaba que pasara. Si tiene un término que vence hoy o mañana, dígalo en la primera línea."
              className="cn-sop-entrada cn-sop-entrada--area"
              disabled={enviando}
            />
          </label>

          <p className="cn-sop-aviso">
            No pegue aquí datos de clientes ni documentos del caso. Soporte no ve su material por
            escribirle; si hace falta verlo, se pide por el acceso de soporte, que autoriza un socio.
          </p>

          {errorAlAbrir && (
            <p className="cn-sop-error" role="alert">
              {errorAlAbrir} No se abrió la conversación.
            </p>
          )}

          <div className="cn-sop-escribir-pie">
            <p className="cn-sop-meta">
              Lo atiende el operador de la plataforma en horario laboral. Escribir a soporte no consume
              saldo.
            </p>
            <div className="cn-sop-escribir-botones">
              <button type="button" onClick={cerrarDialogo} className="cn-sop-boton cn-sop-boton--texto" disabled={enviando}>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={asunto.trim().length < 3 || !texto.trim() || enviando}
                className="cn-sop-boton cn-sop-boton--primario"
              >
                <Send className="cn-sop-icono-linea" aria-hidden="true" />
                {enviando ? 'Enviando…' : 'Abrir conversación'}
              </button>
            </div>
          </div>
        </form>
      </DialogoDeAyuda>
    </>
  );
};
