import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { SelectorDelFormulario } from '../../workspace/components/SelectorDelFormulario';
import { expedientesApi } from '../services/expedientes.api';
import {
  avisoDelRadicado,
  cambiosDelCaso,
  datosDelCaso,
  errorDelCaso,
  hayCambios,
  leerRama,
  opcionesDeRamaParaEditar,
  type CampoDelCaso,
  type DatosDelCaso
} from '../services/datosDelCaso';
import type { Expediente } from '../types';

/**
 * EDITAR LOS DATOS DEL CASO: nombre, radicado, despacho, rama, contraparte y
 * notas.
 *
 * ─── POR QUÉ EXISTE ────────────────────────────────────────────────────────
 *
 * El 14 de septiembre de 2026 el dueño preguntó cómo corregir el nombre, el
 * radicado o la rama que olvidó poner al crear el caso. El servidor lo aceptaba
 * desde el principio; la pantalla solo sabía cambiar el estado y el cliente.
 *
 * ─── LAS DECISIONES ────────────────────────────────────────────────────────
 *
 *  · SOLO VIAJA LO QUE CAMBIÓ (`cambiosDelCaso`). El servidor lee `null` como
 *    «bórrelo», y mandar el formulario entero pone en riesgo lo que nadie tocó.
 *  · LOS MISMOS CAMPOS DE «NUEVO CASO», con las mismas clases y ayudas, más la
 *    rama y las notas, que la creación no pide. Crear y editar se sienten como
 *    la misma ficha.
 *  · EL AVISO DEL RADICADO NO BLOQUEA: orienta. Hay radicados legítimos que no
 *    son de 23 dígitos.
 *  · LA RAMA ESCRITA A MANO SIGUE A LA VISTA como «(registrada a mano)», y
 *    reemplazarla es elegir otra fila. Abrir el diálogo nunca la borra.
 *  · CANCELAR CON CAMBIOS PREGUNTA, con el diálogo de confirmación de la casa y
 *    no con el del navegador.
 *  · ABRE EN EL CAMPO PEDIDO: desde «Sin rama registrada · Agregar» el foco cae
 *    en la rama, no en el nombre.
 */

export const EditarDatosDelCaso: React.FC<{
  expediente: Expediente;
  abierto: boolean;
  /** El campo donde cae el foco al abrir. `null` es el nombre. */
  foco: CampoDelCaso | null;
  onCerrar: () => void;
  /** Lo que devolvió el servidor, para pintarlo sin volver a pedir el caso. */
  onGuardado: (guardado: Expediente) => void;
}> = ({ expediente, abierto, foco, onCerrar, onGuardado }) => {
  const [inicial, setInicial] = React.useState<DatosDelCaso>(() => datosDelCaso(expediente));
  const [datos, setDatos] = React.useState<DatosDelCaso>(inicial);
  const [guardando, setGuardando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [confirmacion, setConfirmacion] = React.useState<Confirmacion | null>(null);
  const cuerpo = React.useRef<HTMLFormElement>(null);

  /*
   * SE PRELLENA AL ABRIR, NO AL MONTAR. El diálogo vive montado junto al caso;
   * si leyera los datos una sola vez, la segunda edición traería lo que había
   * antes de la primera.
   */
  React.useEffect(() => {
    if (!abierto) return;
    const base = datosDelCaso(expediente);
    setInicial(base);
    setDatos(base);
    setError('');
    setConfirmacion(null);
    /*
     * El marco del diálogo lleva el foco a su panel en su propio efecto, que
     * corre DESPUÉS de este. Por eso el foco del campo espera un cuadro.
     */
    const espera = window.requestAnimationFrame(() => {
      const campo = cuerpo.current?.querySelector<HTMLElement>(`[data-campo="${foco ?? 'caratula'}"]`);
      campo?.querySelector<HTMLElement>('input, textarea, select, button')?.focus();
    });
    return () => window.cancelAnimationFrame(espera);
    // Solo al abrir: releer el caso mientras se escribe borraría lo escrito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto]);

  const cambiado = hayCambios(inicial, datos);
  const errorDelNombre = errorDelCaso(datos);
  const avisoRadicado = avisoDelRadicado(datos.radicado);
  const ramaGuardada = leerRama(inicial.rama);
  const opcionesDeRama = React.useMemo(
    () => opcionesDeRamaParaEditar(inicial.rama).map((o) => ({ valor: o.valor, etiqueta: o.etiqueta })),
    [inicial.rama]
  );

  const poner = (campo: CampoDelCaso, valor: string): void => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setError('');
  };

  const intentarCerrar = (): void => {
    /* Con la confirmación abierta, `Esc` es de ella: este diálogo no reacciona. */
    if (confirmacion || guardando) return;
    if (!cambiado) {
      onCerrar();
      return;
    }
    setConfirmacion({
      titulo: 'Descartar los cambios',
      texto: <p className="cn-exp-dlg-texto">Lo que cambió en los datos del caso no se ha guardado y se perderá.</p>,
      etiqueta: 'Descartar los cambios',
      peligro: true,
      onConfirmar: () => onCerrar()
    });
  };

  const guardar = async (e?: React.FormEvent): Promise<void> => {
    e?.preventDefault();
    const bloqueo = errorDelCaso(datos);
    if (bloqueo) {
      setError(bloqueo);
      return;
    }
    const cambios = cambiosDelCaso(inicial, datos);
    if (Object.keys(cambios).length === 0) {
      onCerrar();
      return;
    }
    setGuardando(true);
    setError('');
    try {
      const guardado = await expedientesApi.actualizar(expediente.id, cambios);
      onGuardado(guardado);
    } catch (err) {
      /* El mensaje del servidor, tal cual y dentro del diálogo: lo escrito no se pierde. */
      setError((err as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Dialog
        abierto={abierto}
        onCerrar={intentarCerrar}
        tamano="M"
        titulo="Editar datos del caso"
        subtitulo="Cambie solo lo que haga falta: lo demás queda como está."
        hayCambiosSinGuardar={cambiado}
        onIntentoDeCerrarConCambios={intentarCerrar}
        pieIzquierda={<span className="cn-exp-dlg-pie">Editar los datos no consume saldo.</span>}
        acciones={
          <>
            <button type="button" className="cn-ini-boton cn-ini-boton--texto cn-exp-boton" onClick={intentarCerrar} disabled={guardando}>
              Cancelar
            </button>
            <button
              type="submit"
              form="form-editar-caso"
              className="cn-ini-boton cn-ini-boton--primario cn-exp-boton"
              disabled={guardando || !cambiado}
            >
              {guardando ? 'Guardando…' : 'Guardar los cambios'}
            </button>
          </>
        }
      >
        <form id="form-editar-caso" ref={cuerpo} onSubmit={(e) => void guardar(e)} className="cn-exp-dlg" noValidate>
          {error && (
            <p className="cn-error" role="alert">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <span className="min-w-0 [overflow-wrap:anywhere]">{error}</span>
            </p>
          )}

          <div className="cn-exp-campo" data-campo="caratula">
            <label className="cn-exp-rotulo" htmlFor="editar-caso-caratula">
              Nombre del caso
            </label>
            <input
              id="editar-caso-caratula"
              className="cn-exp-entrada"
              value={datos.caratula}
              onChange={(e) => poner('caratula', e.target.value)}
              placeholder="Cliente vs. contraparte — asunto"
              aria-invalid={errorDelNombre !== null}
              aria-describedby="editar-caso-caratula-ayuda"
            />
            <p id="editar-caso-caratula-ayuda" className={errorDelNombre ? 'cn-exp-ayuda cn-exp-ayuda--error' : 'cn-exp-ayuda'}>
              {errorDelNombre ?? 'Lo único obligatorio. Con lo que usted lo busca después.'}
            </p>
          </div>

          <div className="cn-exp-campos-2">
            <div className="cn-exp-campo" data-campo="radicado">
              <label className="cn-exp-rotulo" htmlFor="editar-caso-radicado">
                Radicado <span className="cn-exp-opcional">(opcional)</span>
              </label>
              <input
                id="editar-caso-radicado"
                className="cn-exp-entrada cn-exp-mono"
                value={datos.radicado}
                onChange={(e) => poner('radicado', e.target.value)}
                placeholder="00000-00-00-000-0000-00000-00"
                inputMode="text"
                autoComplete="off"
                aria-describedby={avisoRadicado ? 'editar-caso-radicado-aviso' : undefined}
              />
              {avisoRadicado && (
                <p id="editar-caso-radicado-aviso" className="cn-exp-ayuda cn-exp-ayuda--aviso" role="status">
                  {avisoRadicado}
                </p>
              )}
            </div>
            <div className="cn-exp-campo" data-campo="despacho">
              <label className="cn-exp-rotulo" htmlFor="editar-caso-despacho">
                Despacho <span className="cn-exp-opcional">(opcional)</span>
              </label>
              <input
                id="editar-caso-despacho"
                className="cn-exp-entrada"
                value={datos.despacho}
                onChange={(e) => poner('despacho', e.target.value)}
                placeholder="Juzgado 00 Civil Municipal"
              />
            </div>
          </div>

          <div className="cn-exp-campo" data-campo="rama">
            <SelectorDelFormulario
              id="editar-caso-rama"
              etiqueta="Rama"
              valor={datos.rama}
              opciones={opcionesDeRama}
              onChange={(v) => poner('rama', v)}
              vacio="Sin rama"
            />
            {ramaGuardada.tipo === 'manual' && datos.rama === ramaGuardada.texto && (
              <p className="cn-exp-ayuda">
                Esta rama se escribió a mano y no es del catálogo. Puede dejarla o reemplazarla por una de la lista.
              </p>
            )}
          </div>

          <div className="cn-exp-campo" data-campo="contraparte">
            <label className="cn-exp-rotulo" htmlFor="editar-caso-contraparte">
              Contraparte <span className="cn-exp-opcional">(opcional)</span>
            </label>
            <input
              id="editar-caso-contraparte"
              className="cn-exp-entrada"
              value={datos.contraparte}
              onChange={(e) => poner('contraparte', e.target.value)}
            />
          </div>

          <div className="cn-exp-campo" data-campo="notas">
            <label className="cn-exp-rotulo" htmlFor="editar-caso-notas">
              Notas <span className="cn-exp-opcional">(opcional)</span>
            </label>
            <textarea
              id="editar-caso-notas"
              className="cn-exp-entrada cn-exp-entrada--area"
              value={datos.notas}
              onChange={(e) => poner('notas', e.target.value)}
              rows={4}
            />
          </div>
        </form>
      </Dialog>

      <ConfirmarDialog confirmacion={confirmacion} onCerrar={() => setConfirmacion(null)} />
    </>
  );
};
