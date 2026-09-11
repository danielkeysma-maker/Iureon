import React from 'react';
import { Plus, UserRound } from 'lucide-react';
import { clientsApi, type Client } from '../../clients/clients.api';
import { expedientesApi } from '../services/expedientes.api';
import type { ExpedienteConDetalle } from '../types';

/**
 * DE QUIÉN ES EL ASUNTO.
 *
 * ─── ESTO FALTABA, Y ERA LA MITAD DEL PUNTO DEL EXPEDIENTE ─────────────────
 *
 * La base y la API soportaban el cliente desde el primer día —`cliente_id` es
 * una llave real a `clients`, no un texto— pero el formulario no traía el
 * campo. Así que todo expediente nacía sin cliente, y con él se perdía lo
 * único que el expediente aportaba de nuevo: el puente a las ENTREVISTAS, que
 * cuelgan de `clients` desde antes de que este módulo existiera.
 *
 * ─── SE PUEDE REGISTRAR AQUÍ MISMO, Y NO ES COMODIDAD ──────────────────────
 *
 * El caso que lo pide es el del cliente NUEVO: alguien llega, se abre su
 * asunto, y los papeles van llegando después. Mandarlo a otra pantalla a
 * registrar la persona y volver es exactamente como el vínculo termina no
 * haciéndose nunca — es la misma razón por la que `ClientPicker` deja
 * registrar dentro de la entrevista en vez de mandar a un directorio.
 */
export const ClienteDelExpediente: React.FC<{
  expediente: ExpedienteConDetalle;
  onCambio: () => Promise<void>;
}> = ({ expediente, onCambio }) => {
  const [clientes, setClientes] = React.useState<Client[]>([]);
  const [editando, setEditando] = React.useState(false);
  const [registrando, setRegistrando] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [nuevo, setNuevo] = React.useState({ fullName: '', documentId: '' });

  const cargar = React.useCallback(async () => {
    try {
      setClientes(await clientsApi.list());
    } catch (err) {
      setError((err as Error).message);
    }
  }, []);

  React.useEffect(() => {
    if (editando && clientes.length === 0) void cargar();
  }, [editando, clientes.length, cargar]);

  const atar = async (clienteId: string | null): Promise<void> => {
    setGuardando(true);
    setError('');
    try {
      await expedientesApi.actualizar(expediente.id, { clienteId });
      setEditando(false);
      await onCambio();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const registrarYAtar = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!nuevo.fullName.trim() || !nuevo.documentId.trim()) return;
    setGuardando(true);
    setError('');
    try {
      const creado = await clientsApi.create({
        fullName: nuevo.fullName,
        documentId: nuevo.documentId
      });
      setNuevo({ fullName: '', documentId: '' });
      setRegistrando(false);
      await cargar();
      await atar(creado.id);
    } catch (err) {
      /*
       * El servidor dice CON NOMBRE cuál es el cliente duplicado. Ese mensaje
       * se muestra tal cual: «ya existe» sin decir quién manda al abogado a
       * buscar en una lista a alguien que quizá registró meses atrás.
       */
      setError((err as Error).message);
      setGuardando(false);
    }
  };

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-h3">De quién es el asunto</h2>
          {expediente.clienteNombre ? (
            <p className="mt-1 flex items-center gap-1.5 text-body">
              <UserRound className="h-3.5 w-3.5 shrink-0 text-ink-500" />
              <span className="[overflow-wrap:anywhere]">{expediente.clienteNombre}</span>
            </p>
          ) : (
            <p className="mt-1 text-meta text-ink-500">
              Sin cliente. Átelo y el expediente alcanza sus entrevistas.
            </p>
          )}
        </div>
        <button type="button" onClick={() => setEditando((v) => !v)} className="btn-secondary btn-sm">
          {editando ? 'Cerrar' : expediente.clienteNombre ? 'Cambiar' : 'Atar un cliente'}
        </button>
      </div>

      {editando && (
        <div className="mt-3 space-y-3 rounded-card border border-line-200 bg-canvas p-3">
          <div>
            <label className="field-label" htmlFor="cliente-exp">
              Cliente
            </label>
            <select
              id="cliente-exp"
              className="field"
              value={expediente.clienteId ?? ''}
              disabled={guardando}
              onChange={(e) => void atar(e.target.value || null)}
            >
              <option value="">— sin cliente —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} · {c.documentId}
                </option>
              ))}
            </select>
          </div>

          {registrando ? (
            <form onSubmit={registrarYAtar} className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="nuevo-nombre">
                    Nombre completo
                  </label>
                  <input
                    id="nuevo-nombre"
                    className="field"
                    value={nuevo.fullName}
                    onChange={(e) => setNuevo({ ...nuevo, fullName: e.target.value })}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="nuevo-documento">
                    Documento
                  </label>
                  <input
                    id="nuevo-documento"
                    className="field"
                    value={nuevo.documentId}
                    onChange={(e) => setNuevo({ ...nuevo, documentId: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="btn-primary btn-sm"
                  disabled={guardando || !nuevo.fullName.trim() || !nuevo.documentId.trim()}
                >
                  {guardando ? 'Registrando…' : 'Registrar y atar'}
                </button>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setRegistrando(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setRegistrando(true)} className="btn-ghost btn-sm gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              El cliente es nuevo: registrarlo aquí
            </button>
          )}

          {error && <p className="text-meta text-ink-600 [overflow-wrap:anywhere]">{error}</p>}
        </div>
      )}
    </section>
  );
};
