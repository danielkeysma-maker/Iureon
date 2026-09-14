import React from 'react';
import { Plus, UserRound } from 'lucide-react';
import { clientsApi, type Client } from '../clients.api';

interface ClientPickerProps {
  /** The client currently attached to this interview, if any. */
  value: string | null;
  /**
   * El segundo argumento es la ficha completa, no solo el id: el acta de
   * entrevista (14b) imprime «Consultante: nombre — C.C. documento» y su
   * linea de firma, y pedirle al llamador que vuelva a buscar por id lo que
   * este componente ya tiene en memoria es un viaje de red por nada.
   */
  onChange: (clientId: string | null, client: Client | null) => void;
}

/**
 * Who this interview is with.
 *
 * WHY AN INTERVIEW NEEDS THIS AND A HEARING DOES NOT. A hearing is found by its
 * radicado, which is in the recording's own filename. An interview is found by
 * the person: months later, when the case moves, the lawyer looks for what the
 * client told them — not for a file called `audio_2026-08-18.m4a`.
 *
 * Registering happens here rather than on a screen of its own because this is
 * the moment the client exists for the firm. Sending somebody to a directory,
 * fill a form and come back is how the link ends up never being made.
 *
 * LA CARA NUEVA (maqueta «Nueva entrevista», campo «Quién consulta»): campo
 * sobre gris sin contorno y botones sin borde. Las clases `cn-ent-*` solo
 * pintan dentro de `.cara-nueva`, y las dos pantallas que montan este
 * componente la llevan en su raíz.
 */
export const ClientPicker: React.FC<ClientPickerProps> = ({ value, onChange }) => {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');
  const [creando, setCreando] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [nuevo, setNuevo] = React.useState({
    fullName: '',
    documentId: '',
    email: '',
    phone: '',
    notes: ''
  });

  const cargar = React.useCallback(async () => {
    setCargando(true);
    try {
      setClients(await clientsApi.list());
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los clientes.');
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGuardando(true);

    try {
      const client = await clientsApi.create(nuevo);
      setClients((actuales) => [client, ...actuales]);
      // Selected immediately: registering a client in this form means this
      // interview is theirs, and asking again in the next dropdown would be
      // asking the same question twice.
      onChange(client.id, client);
      setNuevo({ fullName: '', documentId: '', email: '', phone: '', notes: '' });
      setCreando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el cliente.');
    } finally {
      setGuardando(false);
    }
  };

  const seleccionado = clients.find((c) => c.id === value);

  /*
   * No card of its own: the caller decides the frame.
   *
   * It used to carry a heading and a border, so inside the numbered step it
   * became a box within a box with two titles saying the same thing. A
   * component that assumes its own chrome can only ever be placed one way.
   */
  return (
    <div className="cn-ent-picker">
      <div className="cn-ent-picker-fila">
        <label className="cn-ent-picker-select">
          <span className="cn-ent-oculto">Quién consulta</span>
          <UserRound className="cn-ent-picker-icono" aria-hidden="true" size={18} />
          <select
            value={value ?? ''}
            onChange={(e) => {
              const id = e.target.value || null;
              onChange(id, clients.find((c) => c.id === id) ?? null);
            }}
            disabled={cargando}
            className="cn-ent-entrada cn-ent-entrada--con-icono"
          >
            <option value="">{cargando ? 'Cargando clientes…' : 'Sin cliente asignado'}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fullName} · {client.documentId}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => setCreando((v) => !v)}
          aria-expanded={creando}
          className="cn-ini-boton cn-ini-boton--suave cn-ent-boton"
        >
          <Plus size={16} aria-hidden="true" />
          Nuevo cliente
        </button>
      </div>

      {error && <p className="cn-ent-aviso cn-ent-aviso--peligro">{error}</p>}

      {/*
        LA FICHA ELEGIDA, con lo que tiene y nada más: un rótulo con una raya
        al lado no informa de nada. La cédula va en mono porque es lo citable
        de la persona; el resto en la letra de interfaz.
      */}
      {seleccionado && !creando && (
        <p className="cn-ent-ficha">
          <span className="cn-ent-mono">C.C. {seleccionado.documentId}</span>
          {seleccionado.phone && <span>{seleccionado.phone}</span>}
          {seleccionado.email && <span className="cn-ent-ficha-correo">{seleccionado.email}</span>}
          <span>
            {seleccionado.interviews === 0
              ? 'Cliente nuevo'
              : `${seleccionado.interviews} ${seleccionado.interviews === 1 ? 'entrevista previa' : 'entrevistas previas'}`}
          </span>
        </p>
      )}

      {creando && (
        <form onSubmit={crear} className="cn-ent-picker-nuevo">
          <p className="cn-ent-ayuda">
            Para encontrar esta conversación por la persona, no por el nombre del archivo. El acta
            imprime su nombre y su cédula.
          </p>
          <div className="cn-ent-campos-2">
            <label className="cn-ent-campo">
              <span className="cn-ent-rotulo">Nombre completo</span>
              <input
                value={nuevo.fullName}
                onChange={(e) => setNuevo({ ...nuevo, fullName: e.target.value })}
                className="cn-ent-entrada"
                required
              />
            </label>
            <label className="cn-ent-campo">
              <span className="cn-ent-rotulo">Cédula</span>
              <input
                value={nuevo.documentId}
                onChange={(e) => setNuevo({ ...nuevo, documentId: e.target.value })}
                inputMode="numeric"
                className="cn-ent-entrada cn-ent-mono"
                required
              />
            </label>
            <label className="cn-ent-campo">
              <span className="cn-ent-rotulo">
                Correo <span className="cn-ent-opcional">(opcional)</span>
              </span>
              <input
                type="email"
                value={nuevo.email}
                onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
                className="cn-ent-entrada"
              />
            </label>
            <label className="cn-ent-campo">
              <span className="cn-ent-rotulo">
                Celular <span className="cn-ent-opcional">(opcional)</span>
              </span>
              <input
                value={nuevo.phone}
                onChange={(e) => setNuevo({ ...nuevo, phone: e.target.value })}
                inputMode="tel"
                className="cn-ent-entrada cn-ent-mono"
              />
            </label>
          </div>

          <div className="cn-ent-botones">
            <button type="button" onClick={() => setCreando(false)} className="cn-ini-boton cn-ini-boton--texto cn-ent-boton">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="cn-ini-boton cn-ini-boton--primario cn-ent-boton">
              {guardando ? 'Registrando…' : 'Registrar y usar'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
