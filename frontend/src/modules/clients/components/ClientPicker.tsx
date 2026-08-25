import React from 'react';
import { AlertCircle, IdCard, Plus, UserRound } from 'lucide-react';
import { clientsApi, type Client } from '../clients.api';

interface ClientPickerProps {
  /** The client currently attached to this interview, if any. */
  value: string | null;
  onChange: (clientId: string | null) => void;
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
 */
export const ClientPicker: React.FC<ClientPickerProps> = ({ value, onChange }) => {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [error, setError] = React.useState('');
  const [creando, setCreando] = React.useState(false);
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

    try {
      const client = await clientsApi.create(nuevo);
      setClients((actuales) => [client, ...actuales]);
      // Selected immediately: registering a client in this form means this
      // interview is theirs, and asking again in the next dropdown would be
      // asking the same question twice.
      onChange(client.id);
      setNuevo({ fullName: '', documentId: '', email: '', phone: '', notes: '' });
      setCreando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el cliente.');
    }
  };

  const seleccionado = clients.find((c) => c.id === value);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="font-bold text-slate-900 text-xs">Cliente de la entrevista</h4>
          <p className="text-[11px] text-slate-500">
            Para encontrar esta conversación por la persona, no por el nombre del archivo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreando((v) => !v)}
          className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3 h-3" />
          <span>Nuevo cliente</span>
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-800">{error}</p>
        </div>
      )}

      {creando && (
        <form onSubmit={crear} className="space-y-2 border-t border-slate-100 pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              value={nuevo.fullName}
              onChange={(e) => setNuevo({ ...nuevo, fullName: e.target.value })}
              placeholder="Nombre completo"
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-900"
              required
            />
            <input
              value={nuevo.documentId}
              onChange={(e) => setNuevo({ ...nuevo, documentId: e.target.value })}
              placeholder="Cédula"
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono focus:outline-none focus:border-blue-900"
              required
            />
            <input
              type="email"
              value={nuevo.email}
              onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
              placeholder="Correo (opcional)"
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-900"
            />
            <input
              value={nuevo.phone}
              onChange={(e) => setNuevo({ ...nuevo, phone: e.target.value })}
              placeholder="Celular (opcional)"
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono focus:outline-none focus:border-blue-900"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 text-white rounded-lg text-[11px] font-semibold"
            >
              Registrar y usar
            </button>
            <button
              type="button"
              onClick={() => setCreando(false)}
              className="text-[11px] text-slate-500 hover:text-slate-700"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
          <UserRound className="w-4 h-4 text-slate-500" />
        </div>

        <select
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          disabled={cargando}
          className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-blue-900 disabled:opacity-60"
        >
          <option value="">{cargando ? 'Cargando clientes…' : 'Sin cliente asignado'}</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.fullName} · {client.documentId}
            </option>
          ))}
        </select>
      </div>

      {seleccionado && (
        <p className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1 pl-10">
          <span className="flex items-center gap-1">
            <IdCard className="w-3 h-3 text-slate-400" />
            {seleccionado.documentId}
          </span>
          {seleccionado.phone && <span>{seleccionado.phone}</span>}
          {seleccionado.email && <span className="truncate">{seleccionado.email}</span>}
          <span className="text-slate-400">
            {seleccionado.interviews}{' '}
            {seleccionado.interviews === 1 ? 'entrevista' : 'entrevistas'}
          </span>
        </p>
      )}
    </div>
  );
};
