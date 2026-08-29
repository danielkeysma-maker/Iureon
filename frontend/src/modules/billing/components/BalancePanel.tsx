import React from 'react';
import { ArrowDownRight, ArrowUpRight, Download, RefreshCw } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { billingApi, type BillingSummary, type CheckoutIntent, type Movement } from '../billing.api';

interface BalancePanelProps {
  isOpen: boolean;
  onClose: () => void;
  firmName: string;
  /** El NIT va en la cabecera: la cuenta es de la firma, no de quien mira. */
  firmNit?: string;
}

/**
 * Saldo y recarga. Diálogo tipo 4 —visor— en tamaño L, según el artboard 1k.
 *
 * ─── EL SALDO SE TRADUCE A ESCRITOS ─────────────────────────────────────────
 *
 * «$412.500» no dice si alcanza para el término de mañana; «≈121 escritos» sí.
 * La traducción usa el costo medio REAL de los escritos de esta firma este
 * mes, calculado por el servidor — y cuando el mes no tiene escritos, la cifra
 * se declara «al precio base», porque un promedio de cero escritos no es un
 * promedio.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ──────────────────
 *
 * · El desglose de IVA (19%) sobre la recarga: el servidor firma el monto tal
 *   cual y la comisión de la pasarela la absorbe la plataforma — mostrar un
 *   IVA que no se cobra sería inventar un impuesto.
 * · «Factura electrónica al correo de facturación»: la facturación no existe
 *   todavía; anunciarla sería prometer un documento que no va a llegar.
 * · «Avisar a los socios bajo $120.000»: no hay sistema de avisos. La regla
 *   que SÍ es real se declara abajo: el cobro se reserva al INICIAR el
 *   escrito, así que la generación nunca se corta a mitad de uno.
 *
 * Lo que sí reemplazó esta pantalla desde su primera versión: un modal que
 * anunciaba «✅ Recarga acreditada» tras un setTimeout, sin pago ni servidor.
 * Todo lo de aquí viene del servidor, incluida la firma del checkout de Wompi.
 */

const pesos = (valor: number): string => `$${Math.round(valor).toLocaleString('es-CO')}`;

const fecha = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });

const MES_ACTUAL = new Date().toLocaleDateString('es-CO', { month: 'long' });

/** Los montos que una firma recarga de verdad. «Otro» abre el campo. */
const PRESETS = [100_000, 300_000, 500_000, 1_000_000];

const csv = (valor: string | number | null | undefined): string =>
  `"${String(valor ?? '').replace(/"/g, '""')}"`;

export const BalancePanel: React.FC<BalancePanelProps> = ({
  isOpen,
  onClose,
  firmName,
  firmNit
}) => {
  const [summary, setSummary] = React.useState<BillingSummary | null>(null);
  // Read from the server rather than written here, so the figure on screen and
  // the rule that enforces it can never say two different things.
  const [minRecharge, setMinRecharge] = React.useState(0);
  const [movements, setMovements] = React.useState<Movement[]>([]);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [monto, setMonto] = React.useState('');
  const [otroAbierto, setOtroAbierto] = React.useState(false);
  const [abriendo, setAbriendo] = React.useState(false);

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
  }, []);

  /*
   * Hands the browser off to Wompi's checkout.
   *
   * A form POST and not a fetch, because the client has to LAND on Wompi's page
   * to type their card: an XHR would fetch the checkout HTML into this tab and
   * show nothing. Every field comes from the server's intent — including the
   * signature, which is what makes editing any of them produce a checkout Wompi
   * refuses.
   */
  const irAlCheckout = (intent: CheckoutIntent): void => {
    const form = document.createElement('form');
    form.method = 'GET';
    form.action = 'https://checkout.wompi.co/p/';

    const campos: Record<string, string> = {
      'public-key': intent.publicKey,
      currency: intent.currency,
      'amount-in-cents': String(intent.amountInCents),
      reference: intent.reference,
      'signature:integrity': intent.signature
    };

    // Only when configured: an empty redirect-url sends the client to a blank
    // page after paying, which reads as a failed payment.
    if (intent.redirectUrl) campos['redirect-url'] = intent.redirectUrl;

    Object.entries(campos).forEach(([nombre, valor]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = nombre;
      input.value = valor;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const recargar = async () => {
    const valor = Number(monto);
    if (!valor) return;

    setAbriendo(true);
    setError('');

    try {
      irAlCheckout(await billingApi.startRecharge(valor));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar la recarga.');
      setAbriendo(false);
    }
  };

  /** La tabla tal como se ve, con BOM para que Excel lea los acentos. */
  const exportarCsv = () => {
    const cabecera = ['Fecha', 'Concepto', 'Usuario', 'Valor', 'Saldo'];
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

  React.useEffect(() => {
    if (isOpen) void cargar();
  }, [isOpen, cargar]);

  const valorElegido = Number(monto);
  const mes = summary?.mes;

  return (
    <Dialog
      abierto={isOpen}
      onCerrar={onClose}
      tamano="L"
      titulo="Saldo"
      subtitulo={
        <>
          Cuenta de la firma · {firmName}
          {firmNit && <span className="font-mono"> · {firmNit}</span>}
        </>
      }
      cuerpoEnCanvas
      pieIzquierda={
        /*
         * LA REGLA REAL, donde el usuario la puede verificar: el cobro se
         * reserva al iniciar el escrito, así que la generación nunca se corta
         * a mitad de uno. Sin umbral de aviso — ese sistema no existe aún.
         */
        <span>
          Sin saldo suficiente, un escrito no inicia — pero ninguno se corta a mitad.
        </span>
      }
      acciones={
        <button onClick={() => void cargar()} className="btn-neutral btn-sm" disabled={cargando}>
          <RefreshCw className={`h-3.5 w-3.5 ${cargando ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      }
    >
      <div className="space-y-4">
        {error && <p className="notice-unverified">{error}</p>}

        {/* ─── LAS TRES CIFRAS ────────────────────────────────────────────── */}
        {summary && (
          /*
            LA JERARQUIA DE 5c EN MOVIL: el saldo ocupa el ancho entero y su
            cifra sube a 32px; el consumo del mes y el costo por escrito quedan
            en pareja debajo. En escritorio siguen siendo tres tarjetas iguales,
            que es lo correcto ahi — con ancho de sobra, comparar tres cifras
            del mismo tamaño es mas rapido que jerarquizarlas.

            NO SE PINTA LA BARRA DE PROGRESO DE LA MAQUETA. Marca un 41%, y no
            hay contra que medirlo: el saldo no tiene techo ni cupo declarado en
            los datos. Una barra necesita un denominador, y el unico disponible
            seria inventado — en la pantalla del dinero.
          */
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="col-span-2 rounded-card border border-line-200 bg-surface p-3.5 sm:col-span-1">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Saldo disponible
              </p>
              <p className="mt-1.5 font-mono text-[32px] font-semibold leading-[1.1] text-ink-900 sm:mt-1 sm:text-[22px]">
                {pesos(summary.balance)}
              </p>
              {mes && (
                <p className="mt-0.5 text-meta text-ink-500">
                  ≈ {mes.escritosRestantes.toLocaleString('es-CO')} escritos{' '}
                  {mes.costoMedioEsReal ? 'al consumo de este mes' : 'al precio base'}
                </p>
              )}
            </div>

            <div className="rounded-card border border-line-200 bg-surface p-3.5">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Consumo de {MES_ACTUAL}
              </p>
              <p className="mt-1 font-mono text-[22px] font-semibold text-ink-900">
                {mes ? pesos(mes.cobradoCop) : '—'}
              </p>
              {mes && (
                <p className="mt-0.5 text-meta text-ink-500">
                  {mes.escritos} {mes.escritos === 1 ? 'escrito' : 'escritos'} ·{' '}
                  {mes.transcripciones}{' '}
                  {mes.transcripciones === 1 ? 'transcripción' : 'transcripciones'}
                </p>
              )}
            </div>

            <div className="rounded-card border border-line-200 bg-surface p-3.5">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Costo medio por escrito
              </p>
              <p className="mt-1 font-mono text-[22px] font-semibold text-ink-900">
                {mes ? pesos(mes.costoMedioEscritoCop) : '—'}
              </p>
              <p className="mt-0.5 text-meta text-ink-500">3 modelos, según extensión</p>
            </div>
          </div>
        )}

        {/* ─── RECARGAR ───────────────────────────────────────────────────── */}
        <div className="rounded-card border border-line-200 bg-surface p-4">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="text-ui font-semibold text-ink-900">Recargar</h4>
            {minRecharge > 0 && (
              <span className="text-meta text-ink-500">
                Mínimo {pesos(minRecharge)}. Sin vencimiento.
              </span>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => {
                  setMonto(String(p));
                  setOtroAbierto(false);
                }}
                className={`rounded-control border px-3 py-1.5 font-mono text-[12.5px] font-medium transition-colors ${
                  valorElegido === p && !otroAbierto
                    ? 'border-brand-700 bg-brand-50 text-brand-700'
                    : 'border-line-200 bg-canvas text-ink-700 hover:border-brand-700'
                }`}
              >
                {pesos(p)}
              </button>
            ))}
            <button
              onClick={() => {
                setOtroAbierto(true);
                setMonto('');
              }}
              className={`rounded-control border px-3 py-1.5 text-[12.5px] font-medium ${
                otroAbierto
                  ? 'border-brand-700 bg-brand-50 text-brand-700'
                  : 'border-line-200 bg-canvas text-ink-700 hover:border-brand-700'
              }`}
            >
              Otro valor
            </button>

            {otroAbierto && (
              <div className="relative">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-ink-400">
                  $
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={monto}
                  /* Only digits: a thousands separator typed by hand becomes a
                     different number once parsed, and the amount is money. */
                  onChange={(e) => setMonto(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder={String(minRecharge || 100000)}
                  autoFocus
                  className="field w-[140px] pl-6 font-mono"
                />
              </div>
            )}

            <button
              onClick={() => void recargar()}
              disabled={abriendo || valorElegido < minRecharge}
              className="btn-primary btn-sm ml-auto"
            >
              {abriendo
                ? 'Abriendo…'
                : valorElegido >= minRecharge
                ? `Pagar ${pesos(valorElegido)}`
                : 'Pagar'}
            </button>
          </div>

          {/* Says why the button is disabled, instead of leaving it dead. */}
          {monto !== '' && valorElegido < minRecharge && (
            <p className="mt-1.5 text-meta text-ink-500">El mínimo es {pesos(minRecharge)}.</p>
          )}

          <p className="mt-2 text-meta text-ink-400">
            El pago se hace en la pasarela de Wompi — PSE, tarjeta o los medios que ofrezca. El
            saldo se acredita cuando la pasarela confirma el pago, y el movimiento queda abajo.
          </p>
        </div>

        {/* ─── MOVIMIENTOS · Fecha Concepto Usuario Valor Saldo ──────────── */}
        <div className="overflow-hidden rounded-card border border-line-200 bg-surface">
          <div className="flex items-center justify-between border-b border-line-100 px-4 py-2.5">
            <h4 className="text-ui font-semibold text-ink-900">Movimientos</h4>
            <button
              onClick={exportarCsv}
              className="btn-neutral btn-sm"
              disabled={movements.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              Descargar CSV
            </button>
          </div>

          {movements.length === 0 ? (
            <p className="px-4 py-6 text-center text-meta text-ink-500">
              Todavía no hay movimientos. Aparecerán aquí las recargas y cada operación que
              consuma saldo.
            </p>
          ) : (
            <>
              <div className="t-head hidden items-center gap-3 md:flex">
                <span className="w-[52px] shrink-0">Fecha</span>
                <span className="min-w-0 flex-1">Concepto</span>
                <span className="w-[120px] shrink-0">Usuario</span>
                <span className="w-[90px] shrink-0 text-right">Valor</span>
                <span className="w-[90px] shrink-0 text-right">Saldo</span>
              </div>

              {movements.map((mov, i) => {
                const entra = mov.amountCop > 0;
                return (
                  <div key={`${mov.createdAt}-${i}`} className="t-row flex items-center gap-3">
                    <span className="w-[52px] shrink-0 font-mono text-[11px] text-ink-500">
                      {fecha(mov.createdAt)}
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
                      {entra ? (
                        <ArrowUpRight className="h-3 w-3 shrink-0 text-verified" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 shrink-0 text-ink-400" />
                      )}
                      <span className="truncate text-ui text-ink-900">{mov.description}</span>
                    </span>
                    <span className="hidden w-[120px] shrink-0 truncate text-meta text-ink-500 md:block">
                      {mov.actorEmail.split('@')[0]}
                    </span>
                    {/* En mono: es plata, y la plata se coteja dígito a dígito. */}
                    <span
                      className={`w-[90px] shrink-0 text-right font-mono text-[12px] font-medium ${
                        entra ? 'text-verified' : 'text-ink-900'
                      }`}
                    >
                      {entra ? '+' : ''}
                      {pesos(mov.amountCop)}
                    </span>
                    <span className="w-[90px] shrink-0 text-right font-mono text-[11px] text-ink-400">
                      {pesos(mov.balanceAfterCop)}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
};
