import React from 'react';
import { AlertCircle, Plus, UserRound } from 'lucide-react';
import { clientsApi, type Client } from '../../clients/clients.api';
import { SelectorDelFormulario } from '../../workspace/components/SelectorDelFormulario';
import { expedientesApi } from '../services/expedientes.api';
import { opcionesDeCliente } from '../services/datosDelCaso';
import type { ExpedienteConDetalle } from '../types';

/*
 * El tipo de la opción se deduce del componente que se compone, en vez de
 * importarlo del archivo de otro módulo (ver `SelectorDeExpediente`).
 */
type OpcionEnCascada = React.ComponentProps<typeof SelectorDelFormulario>['opciones'][number];

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
 *
 * ─── LA CARA NUEVA (14 de septiembre de 2026) ──────────────────────────────
 *
 * El dueño abrió «Cambiar» en producción y vio el rótulo «CLIENTE» en mono y
 * mayúsculas y la lista azul del sistema operativo con «— sin cliente —». Hoy
 * es `SelectorDelFormulario`: en escritorio la lista en cascada EN LÍNEA —el
 * panel vive dentro de una columna que se desplaza y una lista flotante
 * quedaría recortada—, con búsqueda por nombre o por documento con o sin
 * puntos (`opcionesDeCliente`) y el documento en mono como segunda línea; en
 * el teléfono, la lista del sistema con la pintura de la casa.
 */
export const ClienteDelExpediente: React.FC<{
  expediente: ExpedienteConDetalle;
  onCambio: () => Promise<void>;
}> = ({ expediente, onCambio }) => {
  const [clientes, setClientes] = React.useState<Client[]>([]);
  const [cargando, setCargando] = React.useState(false);
  const [editando, setEditando] = React.useState(false);
  const [registrando, setRegistrando] = React.useState(false);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [nuevo, setNuevo] = React.useState({ fullName: '', documentId: '' });

  const cargar = React.useCallback(async () => {
    setCargando(true);
    try {
      setClientes(await clientsApi.list());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCargando(false);
    }
  }, []);

  React.useEffect(() => {
    if (editando && clientes.length === 0) void cargar();
  }, [editando, clientes.length, cargar]);

  const opciones: OpcionEnCascada[] = React.useMemo(
    () =>
      opcionesDeCliente(clientes).map((o) => ({
        valor: o.valor,
        etiqueta: o.etiqueta,
        detalle: o.documento ? <span className="cn-exp-mono">{o.documento}</span> : undefined,
        detalleTexto: o.documento,
        busqueda: o.busqueda
      })),
    [clientes]
  );

  const atar = async (clienteId: string | null): Promise<void> => {
    if (guardando) return;
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
      setGuardando(false);
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
    <section className="cn-exp-panel cn-exp-piel">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="cn-exp-h3">De quién es el asunto</h2>
          {expediente.clienteNombre ? (
            <p className="mt-1 flex items-center gap-1.5 text-body">
              <UserRound className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
              <span className="[overflow-wrap:anywhere]">{expediente.clienteNombre}</span>
            </p>
          ) : (
            <p className="mt-1 text-meta text-ink-500">
              Sin cliente. Átelo y el expediente alcanza sus entrevistas.
            </p>
          )}
        </div>
        <button type="button" onClick={() => setEditando((v) => !v)} className="cn-ini-boton cn-ini-boton--suave cn-exp-boton">
          {editando ? 'Cerrar' : expediente.clienteNombre ? 'Cambiar' : 'Atar un cliente'}
        </button>
      </div>

      {editando && (
        <div className="cn-exp-subform">
          <SelectorDelFormulario
            id="cliente-exp"
            etiqueta="Cliente"
            valor={expediente.clienteId ?? ''}
            opciones={opciones}
            onChange={(v) => void atar(v || null)}
            vacio="Sin cliente"
            cargando={cargando}
            pie={
              clientes.length > 0
                ? `${clientes.length} ${clientes.length === 1 ? 'cliente' : 'clientes'} de la firma. Busque por el nombre o por la cédula.`
                : undefined
            }
          />
          {guardando && (
            <p className="cn-exp-ayuda" role="status">
              Guardando…
            </p>
          )}

          {registrando ? (
            <form onSubmit={registrarYAtar} className="cn-exp-subform-cuerpo">
              <div className="cn-exp-campos-2">
                <div className="cn-exp-campo">
                  <label className="cn-exp-rotulo" htmlFor="nuevo-nombre">
                    Nombre completo
                  </label>
                  <input
                    id="nuevo-nombre"
                    className="cn-exp-entrada"
                    value={nuevo.fullName}
                    onChange={(e) => setNuevo({ ...nuevo, fullName: e.target.value })}
                    autoFocus
                  />
                </div>
                <div className="cn-exp-campo">
                  <label className="cn-exp-rotulo" htmlFor="nuevo-documento">
                    Documento
                  </label>
                  <input
                    id="nuevo-documento"
                    className="cn-exp-entrada cn-exp-mono"
                    value={nuevo.documentId}
                    onChange={(e) => setNuevo({ ...nuevo, documentId: e.target.value })}
                    inputMode="numeric"
                    autoComplete="off"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="cn-ini-boton cn-ini-boton--primario cn-exp-boton"
                  disabled={guardando || !nuevo.fullName.trim() || !nuevo.documentId.trim()}
                >
                  {guardando ? 'Registrando…' : 'Registrar y atar'}
                </button>
                <button type="button" className="cn-ini-boton cn-ini-boton--texto cn-exp-boton" onClick={() => setRegistrando(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setRegistrando(true)} className="cn-ini-boton cn-ini-boton--texto cn-exp-boton cn-exp-con-icono">
              <Plus className="h-4 w-4" aria-hidden="true" />
              El cliente es nuevo: registrarlo aquí
            </button>
          )}

          {error && (
            <p className="cn-error" role="alert">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{error}</span>
            </p>
          )}
        </div>
      )}
    </section>
  );
};
