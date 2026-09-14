import React from 'react';
import { Dialog } from '../../../design/Dialog';
import { billingApi } from '../billing.api';
import { urlDelCheckout } from '../wompiCheckout';
import { escritosQueAlcanzan, guardarRecargaEnCurso, leerMonto, montosSugeridos, pesos } from '../recargaEnPantalla';

/**
 * Recargar saldo. Diálogo M de `app-administrar-y-saldo.html` (artboard 4,
 * primera tarjeta): tres montos, «U otro monto», la nota de Wompi y en el pie
 * el monto elegido con «Ir a pagar».
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ──────────────────
 *
 * · «Los valores mostrados son sin IVA; el IVA se liquida en el pago»: el
 *   servidor firma el monto tal cual y la comisión la absorbe la plataforma.
 *   Anunciar un IVA que no se cobra sería inventar un impuesto.
 * · Los montos $100.000 / $200.000 / $500.000 escritos a mano: salen del mínimo
 *   que responde el servidor (1×, 2× y 5×), para que la opción más barata sea
 *   siempre la que el servidor acepta.
 *
 * ─── LA REFERENCIA SE GUARDA ANTES DE SALTAR ────────────────────────────────
 *
 * Wompi es otra página: la pestaña se va y vuelve por la dirección de retorno
 * sin estado. Guardar la referencia en la pestaña ANTES de navegar es lo que
 * permite que Saldo se reabra solo, al volver, sobre ese intento y su estado.
 */

interface RecargarSaldoDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  /** El mínimo que respondió el servidor. */
  minimo: number;
  /** El costo medio por escrito que calculó el servidor. */
  costoMedio: number;
  /** false = el costo medio es el precio base, porque el mes no tiene escritos. */
  costoMedioEsReal: boolean;
}

export const RecargarSaldoDialog: React.FC<RecargarSaldoDialogProps> = ({
  abierto,
  onCerrar,
  minimo,
  costoMedio,
  costoMedioEsReal
}) => {
  const sugeridos = React.useMemo(() => montosSugeridos(minimo), [minimo]);
  const [valor, setValor] = React.useState(0);
  const [texto, setTexto] = React.useState('');
  const [abriendo, setAbriendo] = React.useState(false);
  const [error, setError] = React.useState('');
  /** La URL ya firmada, ofrecida como enlace si el salto automático no ocurrió. */
  const [enlaceCheckout, setEnlaceCheckout] = React.useState<string | null>(null);

  /* Al abrir se preselecciona el segundo monto, como en el artboard; nada se cobra sin «Ir a pagar». */
  React.useEffect(() => {
    if (!abierto) return;
    setValor(sugeridos[1] ?? sugeridos[0] ?? 0);
    setTexto('');
    setError('');
    setEnlaceCheckout(null);
  }, [abierto, sugeridos]);

  const bajoElMinimo = valor > 0 && valor < minimo;
  const listo = minimo > 0 && valor >= minimo && !abriendo;

  const irAPagar = async () => {
    if (!listo) return;
    setAbriendo(true);
    setError('');
    try {
      const intent = await billingApi.startRecharge(valor);
      guardarRecargaEnCurso(intent.reference);
      const url = urlDelCheckout(intent);
      setEnlaceCheckout(url);
      /*
       * Navegar y no enviar un formulario oculto: en el teléfono un envío
       * programático después de un `await` se frena en silencio. Si en tres
       * segundos seguimos aquí, el enlace de respaldo queda a la vista.
       */
      window.location.assign(url);
      window.setTimeout(() => setAbriendo(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la recarga.');
      setAbriendo(false);
    }
  };

  const escritos = (monto: number): number | null => escritosQueAlcanzan(monto, costoMedio);

  return (
    <div className="cara-nueva cn-adm-dialogos">
      <Dialog
        abierto={abierto}
        onCerrar={onCerrar}
        tamano="M"
        titulo="Recargar saldo"
        subtitulo="El saldo no vence y lo comparten todos los usuarios de la firma."
        pieIzquierda={<span className="cn-adm-pie-monto">{valor >= minimo && minimo > 0 ? pesos(valor) : ''}</span>}
        acciones={
          <>
            <button type="button" onClick={onCerrar} className="cn-adm-boton cn-adm-boton--terciario" disabled={abriendo}>
              Cancelar
            </button>
            <button type="button" onClick={() => void irAPagar()} className="cn-adm-boton cn-adm-boton--primario" disabled={!listo}>
              {abriendo ? 'Abriendo Wompi…' : 'Ir a pagar'}
            </button>
          </>
        }
      >
        <div className="cn-adm-cuerpo">
          {error && (
            <p role="alert" className="cn-adm-error">
              {error}
            </p>
          )}

          {sugeridos.length > 0 ? (
            <div className="cn-adm-montos" role="group" aria-label="Monto a recargar">
              {sugeridos.map((m) => {
                const elegido = texto === '' && valor === m;
                const n = escritos(m);
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={elegido}
                    onClick={() => {
                      setValor(m);
                      setTexto('');
                    }}
                    className={`cn-adm-monto ${elegido ? 'cn-adm-monto--elegido' : ''}`}
                  >
                    <span className="cn-adm-monto-cifra">{pesos(m)}</span>
                    {n !== null && <span className="cn-adm-monto-nota">≈ {n.toLocaleString('es-CO')} escritos</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="cn-adm-vacio">Leyendo el mínimo de recarga…</p>
          )}

          <label className="cn-adm-etiqueta" htmlFor="cn-adm-otro-monto">
            U otro monto
          </label>
          <input
            id="cn-adm-otro-monto"
            type="text"
            inputMode="numeric"
            value={texto}
            onChange={(e) => {
              const digitos = e.target.value.replace(/[^\d]/g, '');
              setTexto(digitos);
              setValor(leerMonto(digitos));
            }}
            placeholder={minimo > 0 ? pesos(minimo).slice(1) : ''}
            className="cn-adm-campo cn-adm-campo--cifra"
          />
          <p className="cn-adm-ayuda">
            {bajoElMinimo ? `El mínimo es ${pesos(minimo)}.` : minimo > 0 ? `Mínimo ${pesos(minimo)}.` : ''}{' '}
            {costoMedio > 0 &&
              (costoMedioEsReal
                ? 'Los escritos se estiman con el costo medio real de su firma este mes.'
                : 'Los escritos se estiman al precio base, porque este mes todavía no hay escritos.')}
          </p>

          <p className="cn-adm-recuadro">
            Paga por <strong>Wompi</strong>: PSE, tarjeta o los medios que la pasarela ofrezca. Iureon no guarda su
            tarjeta y el monto no lo pone el navegador: lo fija y lo firma el servidor.
          </p>

          {enlaceCheckout && !abriendo && (
            <p className="cn-adm-enlace-respaldo">
              Si la pasarela no se abrió sola, <a href={enlaceCheckout}>tóquelo aquí para abrir Wompi</a>. Es el mismo
              pago: no se crea otro intento.
            </p>
          )}
        </div>
      </Dialog>
    </div>
  );
};
