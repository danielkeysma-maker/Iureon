import React from 'react';
import { Dialog } from '../../../design/Dialog';
import { billingApi, type BillingSummary, type Movement, type Recharge } from '../billing.api';
import { firmUsersApi, type UsuarioDeFirma } from '../../tenant/services/firmUsers.api';
import { ExtractoDelPeriodo } from './ExtractoDelPeriodo';
import { RecargarSaldoDialog } from './RecargarSaldoDialog';
import {
  buscarIntento,
  estadoDeRecarga,
  leerRecargaEnCurso,
  olvidarRecargaEnCurso,
  pesos,
  textoDelEstado
} from '../recargaEnPantalla';

interface BalancePanelProps {
  isOpen: boolean;
  onClose: () => void;
  firmName: string;
  /** El NIT va en la cabecera: la cuenta es de la firma, no de quien mira. */
  firmNit?: string;
  /**
   * Solo el socio ve «Quién consumió»: sale de la lista de usuarios, que el
   * servidor niega con 403 a un abogado. Recargar, en cambio, lo puede
   * cualquiera — el servidor no le pone puerta de rol.
   */
  esAdministrador?: boolean;
  /** «Escribir a soporte» tras un pago rechazado. */
  onSoporte?: () => void;
}

/**
 * Saldo de la firma. Pantalla de `app-administrar-y-saldo.html` (artboard 3):
 * la cifra disponible en la tarjeta oscura con «Recargar», lo cobrado y el
 * costo medio al lado, quién consumió, y los movimientos en tabla.
 *
 * ─── EL SALDO SE TRADUCE A ESCRITOS ─────────────────────────────────────────
 *
 * «$412.500» no dice si alcanza para el término de mañana; «≈121 escritos» sí.
 * La traducción usa el costo medio REAL de los escritos de esta firma este
 * mes, calculado por el servidor — y cuando el mes no tiene escritos, se
 * declara «al precio base», porque un promedio de cero escritos no es uno.
 *
 * ─── LOS ESTADOS DEL PAGO SON LOS DEL SERVIDOR ──────────────────────────────
 *
 * Antes no había ninguno: se volvía de Wompi a una aplicación que no sabía que
 * hubo un pago. Ahora la referencia se guarda en la pestaña al saltar, Saldo se
 * reabre al volver y consulta `GET /billing/recharges` cada cinco segundos
 * mientras el intento siga PENDING. Lo que se pinta —esperando, recargado,
 * rechazado, anulado, fallido— es lo que el webhook escribió, nunca un
 * temporizador que finge (el modal original anunciaba «Recarga acreditada» a
 * los 800 ms sin pago ni servidor).
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ──────────────────
 *
 * · «Descargar en Excel»: lo que se descarga es un CSV (con BOM, Excel lo abre
 *   con acentos). El botón dice lo que entrega.
 * · «La factura electrónica… llegará al correo de facturación»: no existe
 *   todavía; se dice que no se emite, sin prometer cuándo.
 * · Un estado «vencido» del pago: el servidor no vence intenciones.
 * · Los nombres «C. Restrepo» en movimientos: el libro guarda el correo de
 *   quien consumió, y eso es lo que se muestra.
 */

const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });

const csv = (valor: string | number | null | undefined): string => `"${String(valor ?? '').replace(/"/g, '""')}"`;

const CADA_CUANTO_SE_CONSULTA_MS = 5000;

export const BalancePanel: React.FC<BalancePanelProps> = ({
  isOpen,
  onClose,
  firmName,
  firmNit,
  esAdministrador = false,
  onSoporte
}) => {
  const [summary, setSummary] = React.useState<BillingSummary | null>(null);
  // Leído del servidor y no escrito aquí: la cifra en pantalla y la regla que la impone no pueden discrepar.
  const [minRecharge, setMinRecharge] = React.useState(0);
  const [movements, setMovements] = React.useState<Movement[]>([]);
  const [consumo, setConsumo] = React.useState<UsuarioDeFirma[] | null>(null);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [recargaAbierta, setRecargaAbierta] = React.useState(false);
  const [referencia, setReferencia] = React.useState<string | null>(null);
  const [intento, setIntento] = React.useState<Recharge | null>(null);
  const movimientosRef = React.useRef<HTMLElement>(null);

  const cargar = React.useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const [{ summary: resumen, minRecharge: minimo }, movs] = await Promise.all([
        billingApi.summary(),
        billingApi.movements()
      ]);
      setSummary(resumen);
      setMinRecharge(minimo);
      setMovements(movs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el saldo.');
    } finally {
      setCargando(false);
    }
    /* Quién consumió: solo para el socio. Si falla, la tarjeta no se pinta; el saldo no depende de ella. */
    if (esAdministrador) {
      firmUsersApi.list().then(setConsumo).catch(() => setConsumo(null));
    }
  }, [esAdministrador]);

  React.useEffect(() => {
    if (!isOpen) return;
    void cargar();
    setReferencia(leerRecargaEnCurso());
  }, [isOpen, cargar]);

  /*
   * LA ESPERA CONSULTA AL SERVIDOR. Mientras el intento siga PENDING (o todavía
   * no aparezca en la lista) se vuelve a preguntar; al aprobarse se relee el
   * saldo para que la cifra nueva sea la del servidor.
   */
  React.useEffect(() => {
    if (!isOpen || !referencia) return;
    let vigente = true;
    let temporizador: number | undefined;

    const consultar = async (): Promise<void> => {
      try {
        const hallado = buscarIntento(await billingApi.recharges(), referencia);
        if (!vigente) return;
        setIntento(hallado);
        const estado = hallado ? estadoDeRecarga(hallado.status) : null;
        if (estado === null || estado === 'esperando') {
          temporizador = window.setTimeout(() => void consultar(), CADA_CUANTO_SE_CONSULTA_MS);
          return;
        }
        if (estado === 'aprobada') void cargar();
      } catch {
        if (vigente) temporizador = window.setTimeout(() => void consultar(), CADA_CUANTO_SE_CONSULTA_MS);
      }
    };

    void consultar();
    return () => {
      vigente = false;
      window.clearTimeout(temporizador);
    };
  }, [isOpen, referencia, cargar]);

  const olvidarIntento = () => {
    olvidarRecargaEnCurso();
    setReferencia(null);
    setIntento(null);
  };

  /* Un intento ya resuelto se olvida al cerrar; uno que sigue esperando se conserva para la próxima apertura. */
  const cerrar = () => {
    if (intento && estadoDeRecarga(intento.status) !== 'esperando') olvidarIntento();
    onClose();
  };

  /** La tabla tal como se ve, con BOM para que Excel lea los acentos. */
  const exportarCsv = () => {
    const cabecera = ['Fecha', 'Concepto', 'Usuario', 'Monto', 'Saldo después'];
    const filas = movements.map((m) =>
      [csv(fecha(m.createdAt)), csv(m.description), csv(m.actorEmail), csv(m.amountCop), csv(m.balanceAfterCop)].join(',')
    );
    const blob = new Blob(['﻿' + [cabecera.map(csv).join(','), ...filas].join('\r\n')], {
      type: 'text/csv;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movimientos-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const mes = summary?.mes;
  const consumidores = (consumo ?? [])
    .filter((u) => u.consumoMesCop > 0)
    .sort((a, b) => b.consumoMesCop - a.consumoMesCop);

  const estado = intento ? estadoDeRecarga(intento.status) : null;
  const textos = estado ? textoDelEstado(estado) : null;
  const fallido = estado === 'rechazada' || estado === 'anulada' || estado === 'fallida';

  return (
    /*
      DOS ENVOLTORIOS A PROPÓSITO. El de afuera abre el alcance y viste todo
      diálogo de dentro; el de adentro (`cn-adm-pantalla`) solo a esta pantalla,
      para que el diálogo de recarga que cuelga de ella no herede el título
      grande.
    */
    <div className="cara-nueva cn-adm-dialogos">
      <div className="cn-adm-pantalla">
      <Dialog
        abierto={isOpen}
        onCerrar={cerrar}
        tamano="L"
        titulo="Saldo de la firma"
        subtitulo={
          <>
            {firmName} · se comparte entre sus usuarios y se paga por consumo, aparte del plan.
            {firmNit && (
              <>
                {' '}NIT <span className="cn-adm-mono">{firmNit}</span>
              </>
            )}
          </>
        }
        cuerpoEnCanvas
        pieIzquierda={<span>Sin saldo suficiente, un escrito no inicia; ninguno se corta a mitad.</span>}
        acciones={
          <button type="button" onClick={() => void cargar()} className="cn-adm-boton cn-adm-boton--suave" disabled={cargando}>
            {cargando ? 'Actualizando…' : 'Actualizar'}
          </button>
        }
      >
        <div className="cn-adm-cuerpo">
          {error && (
            <p role="alert" className="cn-adm-error">
              {error}
            </p>
          )}

          {/* ─── EL PAGO QUE ESTA PESTAÑA INICIÓ, con el estado que escribió el servidor ─── */}
          {intento && estado && textos && (
            <section className={`cn-adm-pago cn-adm-pago--${estado}`} aria-live="polite">
              <div className="cn-adm-pago-cabeza">
                {estado === 'esperando' && <span className="cn-adm-giro" aria-hidden="true" />}
                {estado === 'aprobada' && (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <polyline points="8 12.5 11 15.5 16 9" />
                  </svg>
                )}
                <div className="cn-adm-pago-textos">
                  <p className="cn-adm-pago-titulo">{textos.titulo}</p>
                  <p className="cn-adm-pago-detalle">
                    {estado === 'aprobada' && summary ? (
                      <>
                        Entraron <span className="cn-adm-mono">{pesos(intento.amountCop)}</span>. Su saldo queda en{' '}
                        <span className="cn-adm-mono">{pesos(summary.balance)}</span>
                        {mes && (
                          <>
                            {' '}— alcanza para unos {mes.escritosRestantes.toLocaleString('es-CO')} escritos
                            {mes.costoMedioEsReal ? '' : ' al precio base'}
                          </>
                        )}
                        .
                      </>
                    ) : (
                      textos.detalle
                    )}
                  </p>
                </div>
              </div>

              {estado !== 'aprobada' && (
                <p className="cn-adm-recuadro">
                  Referencia <span className="cn-adm-mono">{intento.reference}</span> · si algo falla, esta es la
                  referencia que hay que dar en soporte.
                </p>
              )}

              <div className="cn-adm-pago-acciones">
                {estado === 'aprobada' && (
                  <button
                    type="button"
                    className="cn-adm-boton cn-adm-boton--suave"
                    onClick={() => movimientosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    Ver el movimiento
                  </button>
                )}
                {fallido && (
                  <>
                    <button
                      type="button"
                      className="cn-adm-boton cn-adm-boton--peligro"
                      onClick={() => {
                        olvidarIntento();
                        setRecargaAbierta(true);
                      }}
                    >
                      Intentar de nuevo
                    </button>
                    {onSoporte && (
                      <button
                        type="button"
                        className="cn-adm-boton cn-adm-boton--terciario cn-adm-boton--texto-peligro"
                        onClick={() => {
                          olvidarIntento();
                          onSoporte();
                        }}
                      >
                        Escribir a soporte
                      </button>
                    )}
                  </>
                )}
                {estado === 'esperando' && (
                  <button type="button" className="cn-adm-boton cn-adm-boton--terciario" onClick={olvidarIntento}>
                    Ocultar este aviso
                  </button>
                )}
              </div>
            </section>
          )}

          {/* ─── LAS CIFRAS ────────────────────────────────────────────────── */}
          {summary ? (
            <div className="cn-adm-cifras">
              <div className="cn-adm-saldo">
                <p className="cn-adm-saldo-rotulo">Disponible ahora</p>
                <p className="cn-adm-saldo-cifra">{pesos(summary.balance)}</p>
                {mes && (
                  <p className="cn-adm-saldo-nota">
                    ≈ {mes.escritosRestantes.toLocaleString('es-CO')} escritos,{' '}
                    {mes.costoMedioEsReal ? 'con el costo medio real de su firma' : 'al precio base de un escrito'}
                  </p>
                )}
                <button type="button" onClick={() => setRecargaAbierta(true)} className="cn-adm-boton cn-adm-boton--claro">
                  Recargar
                </button>
              </div>

              <div className="cn-adm-tarjeta">
                <p className="cn-adm-tarjeta-rotulo">Cobrado este mes</p>
                <p className="cn-adm-tarjeta-cifra">{mes ? pesos(mes.cobradoCop) : '—'}</p>
                <p className="cn-adm-tarjeta-rotulo">Costo medio por escrito</p>
                <p className="cn-adm-tarjeta-cifra cn-adm-tarjeta-cifra--menor">{mes ? pesos(mes.costoMedioEscritoCop) : '—'}</p>
                {mes && (
                  <p className="cn-adm-tarjeta-nota">
                    {mes.escritos} {mes.escritos === 1 ? 'escrito' : 'escritos'} · {mes.transcripciones}{' '}
                    {mes.transcripciones === 1 ? 'transcripción' : 'transcripciones'}
                  </p>
                )}
              </div>

              {esAdministrador && consumo && (
                <div className="cn-adm-tarjeta">
                  <p className="cn-adm-tarjeta-rotulo">Quién consumió</p>
                  {consumidores.length === 0 ? (
                    <p className="cn-adm-tarjeta-nota">Nadie ha consumido saldo este mes.</p>
                  ) : (
                    <ul className="cn-adm-consumo">
                      {consumidores.slice(0, 6).map((u) => (
                        <li key={u.id}>
                          <span className="cn-adm-consumo-quien" title={u.email}>
                            {u.nombre ?? u.email.split('@')[0]}
                          </span>
                          <span className="cn-adm-mono">{pesos(u.consumoMesCop)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ) : (
            cargando && <p className="cn-adm-vacio">Leyendo el saldo de la firma…</p>
          )}

          {/* ─── MOVIMIENTOS · Fecha · Concepto · Usuario · Monto · Saldo después ─── */}
          <section ref={movimientosRef} className="cn-adm-seccion" aria-labelledby="cn-adm-movimientos-titulo">
            <div className="cn-adm-seccion-cabeza">
              <h3 id="cn-adm-movimientos-titulo" className="cn-adm-seccion-titulo">
                Movimientos
              </h3>
              <button
                type="button"
                onClick={exportarCsv}
                className="cn-adm-boton cn-adm-boton--suave"
                disabled={movements.length === 0}
              >
                Descargar CSV
              </button>
            </div>

            {movements.length === 0 ? (
              <p className="cn-adm-vacio">
                {cargando
                  ? 'Leyendo los movimientos…'
                  : 'Todavía no hay movimientos. Aparecerán aquí las recargas y cada operación que consuma saldo.'}
              </p>
            ) : (
              <div className="cn-adm-tabla cn-adm-tabla--movimientos" role="table" aria-label="Movimientos del saldo">
                <div className="cn-adm-tabla-cabeza" role="row">
                  <span role="columnheader">Fecha</span>
                  <span role="columnheader">Concepto</span>
                  <span role="columnheader">Usuario</span>
                  <span role="columnheader" className="cn-adm-derecha">Monto</span>
                  <span role="columnheader" className="cn-adm-derecha">Saldo después</span>
                </div>
                {movements.map((mov, i) => {
                  const entra = mov.amountCop > 0;
                  return (
                    <div key={`${mov.createdAt}-${i}`} className="cn-adm-fila" role="row">
                      <span role="cell" className="cn-adm-mono cn-adm-fila-fecha">
                        {fecha(mov.createdAt)}
                      </span>
                      <span role="cell" className="cn-adm-fila-concepto">
                        {mov.description}
                      </span>
                      <span role="cell" className="cn-adm-fila-quien">
                        {mov.actorEmail.split('@')[0]}
                      </span>
                      {/* En mono: es plata, y la plata se coteja dígito a dígito. */}
                      <span
                        role="cell"
                        className={`cn-adm-mono cn-adm-fila-monto ${entra ? 'cn-adm-fila-monto--entra' : 'cn-adm-fila-monto--sale'}`}
                      >
                        {entra ? '+' : ''}
                        {pesos(mov.amountCop)}
                      </span>
                      <span role="cell" className="cn-adm-mono cn-adm-fila-saldo">
                        <span className="cn-adm-rotulo-movil">Saldo después </span>
                        {pesos(mov.balanceAfterCop)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="cn-adm-pie-nota">
              El saldo no vence. Iureon todavía no emite factura electrónica por las recargas; el extracto de abajo es
              un comprobante informativo de movimientos.
            </p>
          </section>

          {/* ─── EXTRACTO DEL PERÍODO · sumado por el servidor, imprimible ──── */}
          <ExtractoDelPeriodo activo={isOpen} firmName={firmName} firmNit={firmNit} />
        </div>
      </Dialog>
      </div>

      <RecargarSaldoDialog
        abierto={recargaAbierta}
        onCerrar={() => setRecargaAbierta(false)}
        minimo={minRecharge}
        costoMedio={mes?.costoMedioEscritoCop ?? 0}
        costoMedioEsReal={mes?.costoMedioEsReal ?? false}
      />
    </div>
  );
};
