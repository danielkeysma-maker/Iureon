import React from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { adminApi, type FirmDetail } from '../admin.api';

/**
 * La zona de riesgo de la ficha: eliminar la firma con todo lo suyo.
 *
 * ES LA ÚNICA ACCIÓN DE LA CONSOLA QUE NO SE DESHACE, y la pantalla lo trata
 * así: va al final de la ficha, separada, en rojo, y su diálogo exige dos
 * cosas que un clic distraído no produce —el motivo, citando quién autorizó
 * el borrado y cuándo, y el nombre exacto de la firma tecleado a mano—. El
 * botón de confirmar no responde hasta que las dos estén.
 *
 * LO QUE SE VA: escritos, revisiones, transcripciones, clientes, pagos,
 * cuentas y saldo. Lo que NO se va es el registro de que ese correo ya usó su
 * prueba gratuita: si borrar la firma lo borrara, pedir el borrado sería la
 * forma de estrenar otra prueba.
 *
 * QUEDA EN LA AUDITORÍA DEL OPERADOR, no en la de la firma: la de la firma se
 * fue con ella. El servidor rechaza la firma del propio operador por diseño.
 */

const MIN_MOTIVO = 10;

interface FirmDangerZoneProps {
  firma: FirmDetail;
  /** Tras el borrado: cerrar la ficha, recargar la lista, mostrar las advertencias. */
  onEliminada: (resultado: { nombre: string; usuariosEliminados: number; advertencias: string[] }) => void;
}

export const FirmDangerZone: React.FC<FirmDangerZoneProps> = ({ firma, onEliminada }) => {
  const [abierto, setAbierto] = React.useState(false);
  const [motivo, setMotivo] = React.useState('');
  const [nombreEscrito, setNombreEscrito] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  /*
   * `ConfirmarDialog` cierra al terminar `onConfirmar` sin distinguir éxito
   * de fallo. Si el servidor rechaza, el diálogo debe quedarse abierto con el
   * motivo a la vista: esta bandera le pide al cierre que no cierre, una vez.
   */
  const mantenerAbiertoRef = React.useRef(false);

  const motivoValido = motivo.replace(/\s+/g, ' ').trim().length >= MIN_MOTIVO;
  const nombreValido = nombreEscrito.trim() !== '' && nombreEscrito.trim() === firma.name.trim();

  const cerrar = () => {
    if (mantenerAbiertoRef.current) {
      mantenerAbiertoRef.current = false;
      return;
    }
    setAbierto(false);
    setMotivo('');
    setNombreEscrito('');
    setError(null);
  };

  const eliminar = async () => {
    setError(null);
    try {
      const r = await adminApi.eliminarFirma(firma.id, {
        motivo: motivo.replace(/\s+/g, ' ').trim(),
        confirmacion: nombreEscrito.trim()
      });
      onEliminada({ nombre: firma.name, usuariosEliminados: r.usuariosEliminados, advertencias: r.advertencias });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la firma.');
      mantenerAbiertoRef.current = true;
    }
  };

  const confirmacion: Confirmacion | null = abierto
    ? {
        titulo: 'Eliminar la firma y todos sus datos',
        etiqueta: 'Eliminar definitivamente',
        peligro: true,
        deshabilitado: !(motivoValido && nombreValido),
        onConfirmar: eliminar,
        texto: (
          <div className="space-y-3">
            <p className="text-justify [text-wrap:pretty]">
              Se borran <b>todos</b> los datos de <b>{firma.name}</b>: escritos, revisiones,
              transcripciones, clientes, pagos, sus {firma.users} {firma.users === 1 ? 'cuenta' : 'cuentas'} y
              el saldo. <b>No se puede deshacer.</b> Hágalo solo con la autorización expresa de la firma.
            </p>
            <label className="block text-[11px] text-ink-500">
              Motivo · queda en su auditoría de operación
              <input
                type="text"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Cite la autorización de la firma: quién la pidió y cuándo"
                className="mt-1 w-full rounded-control border border-line-200 bg-canvas px-2 py-1.5 text-[12px] text-ink-900 focus:border-brand-700 focus:outline-none"
                autoFocus
              />
              {!motivoValido && motivo.length > 0 && (
                <span className="mt-0.5 block text-[10.5px] text-ink-400">Al menos {MIN_MOTIVO} caracteres.</span>
              )}
            </label>
            <label className="block text-[11px] text-ink-500">
              Escriba el nombre exacto de la firma: <b className="text-ink-900">{firma.name}</b>
              <input
                type="text"
                value={nombreEscrito}
                onChange={(e) => setNombreEscrito(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="mt-1 w-full rounded-control border border-line-200 bg-canvas px-2 py-1.5 font-mono text-[12px] text-ink-900 focus:border-brand-700 focus:outline-none"
              />
              {nombreEscrito.length > 0 && !nombreValido && (
                <span className="mt-0.5 block text-[10.5px] text-ink-400">Todavía no coincide.</span>
              )}
            </label>
            {error && <p className="text-[12px] text-danger">{error}</p>}
          </div>
        )
      }
    : null;

  return (
    <section className="rounded-card border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.04)]">
      <header className="flex items-start gap-2 border-b border-[rgb(var(--danger)/0.25)] px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
        <div>
          <h3 className="text-[13px] font-semibold text-danger">Zona de riesgo</h3>
          <p className="mt-0.5 text-justify text-[11px] leading-snug text-ink-500 [text-wrap:pretty]">
            Eliminar la firma borra escritos, revisiones, transcripciones, clientes, pagos, usuarios y
            saldo, y no se puede deshacer. Solo con autorización de la firma; queda en su auditoría de
            operación con el motivo. El registro de la prueba gratuita se conserva.
          </p>
        </div>
      </header>
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => {
            setError(null);
            setAbierto(true);
          }}
          className="btn-danger btn-sm flex items-center gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar la firma y todos sus datos
        </button>
      </div>

      <ConfirmarDialog confirmacion={confirmacion} onCerrar={cerrar} />
    </section>
  );
};
