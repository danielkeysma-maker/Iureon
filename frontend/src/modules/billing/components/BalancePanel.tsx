import React from 'react';
import { ArrowDownRight, ArrowUpRight, CreditCard, RefreshCw, X } from 'lucide-react';
import { billingApi, type BillingSummary, type CheckoutIntent, type Movement } from '../billing.api';

interface BalancePanelProps {
  isOpen: boolean;
  onClose: () => void;
  firmName: string;
}

/**
 * The firm's balance, what it has spent, and why.
 *
 * WHAT THIS REPLACES, AND WHY IT HAD TO GO. A recharge modal that waited 800ms
 * on a setTimeout and then announced "✅ Recarga de $500.000 COP acreditada
 * exitosamente". No payment, no server call, no money — a fabricated financial
 * confirmation shown to the person paying. Every other invention in this
 * codebase has been a fabricated fact; this one was a fabricated receipt.
 *
 * WHAT IT SAYS INSTEAD. What the balance actually is, read from the server,
 * with the movements that produced it — and the truth about how credit is
 * added: the operator does it, once payment is confirmed. A firm that wants to
 * top up needs to know who to ask, which is a smaller thing to offer than a
 * checkout that does not exist, and an honest one.
 */

const pesos = (valor: number): string => `$${Math.round(valor).toLocaleString('es-CO')}`;

const fecha = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

export const BalancePanel: React.FC<BalancePanelProps> = ({ isOpen, onClose, firmName }) => {
  const [summary, setSummary] = React.useState<BillingSummary | null>(null);
  // Read from the server rather than written here, so the figure on screen and
  // the rule that enforces it can never say two different things.
  const [minRecharge, setMinRecharge] = React.useState(0);
  const [movements, setMovements] = React.useState<Movement[]>([]);
  const [cargando, setCargando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [monto, setMonto] = React.useState('');
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

  React.useEffect(() => {
    if (isOpen) void cargar();
  }, [isOpen, cargar]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        <header className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-900" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">Saldo de {firmName}</h3>
              <p className="text-[11px] text-slate-500">Consumo de inteligencia artificial</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void cargar()}
              className="text-slate-400 hover:text-slate-700"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="p-5 space-y-4 overflow-y-auto">
          {error && (
            <p className="text-[11px] text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2">
              {error}
            </p>
          )}

          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">
                  Saldo disponible
                </p>
                <p className="text-lg font-black text-emerald-900">{pesos(summary.balance)}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Consumido
                </p>
                <p className="text-lg font-black text-slate-900">{pesos(summary.spentCop)}</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                  Operaciones
                </p>
                <p className="text-lg font-black text-slate-900">{summary.operations}</p>
              </div>
            </div>
          )}

          {/*
            How credit is actually added, said plainly.

            A firm with no balance needs to know what to do next, and the honest
            answer today is "ask us" — the operator credits the account once the
            payment is confirmed. That is smaller than a checkout, and unlike the
            modal it replaces, it is true.

            The minimum is stated HERE, before the firm picks an amount, and not
            as a rejection after it has already decided. A rule a client meets
            by being told costs nothing; the same rule delivered as an error is
            a wasted trip for both sides.
          */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3">
            <p className="text-[11px] font-bold text-blue-950 mb-1">¿Cómo recargo?</p>
            <p className="text-[11px] text-blue-900">
              Escríbenos con el monto que quieres recargar. Confirmamos el pago y acreditamos el
              saldo el mismo día; el movimiento queda registrado abajo con la fecha y quién lo
              aplicó.
            </p>
            {minRecharge > 0 && (
              <p className="text-[11px] text-blue-900 mt-1.5">
                Recarga mínima: <strong>{pesos(minRecharge)}</strong>. El saldo se descuenta
                únicamente por lo que uses, operación por operación.
              </p>
            )}
          </div>

          {/*
            The recharge, for real this time.

            What stood here before was a setTimeout that announced a receipt for
            money nobody had paid. This sends the amount to the server, which
            writes down what it promises to credit BEFORE the client pays and
            signs it, and then hands the browser a checkout it cannot alter.
            Nothing is credited here — the balance moves when Wompi says the
            card went through, and only then.
          */}
          <div className="border border-slate-200 rounded-xl p-3">
            <label className="block text-[11px] font-bold text-slate-900 mb-1.5">
              Recargar saldo
            </label>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">
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
                  className="w-full pl-6 pr-2 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <button
                onClick={() => void recargar()}
                disabled={abriendo || Number(monto) < minRecharge}
                className="px-3 py-1.5 bg-blue-950 text-white text-[11px] font-bold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-900 shrink-0"
              >
                {abriendo ? 'Abriendo…' : 'Pagar'}
              </button>
            </div>

            {/* Says why the button is disabled, instead of leaving it dead. */}
            {monto !== '' && Number(monto) < minRecharge && (
              <p className="text-[10px] text-slate-500 mt-1">
                El mínimo es {pesos(minRecharge)}.
              </p>
            )}
          </div>

          <div>
            <h4 className="text-[11px] font-bold text-slate-900 mb-2">Movimientos</h4>

            {movements.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                Todavía no hay movimientos. Aparecerán aquí las recargas y cada operación que
                consuma saldo.
              </p>
            ) : (
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {movements.map((mov, i) => {
                  const entra = mov.amountCop > 0;

                  return (
                    <div key={`${mov.createdAt}-${i}`} className="flex items-center gap-3 px-3 py-2">
                      {entra ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] text-slate-800 truncate">{mov.description}</p>
                        <p className="text-[10px] text-slate-400">
                          {fecha(mov.createdAt)} · {mov.actorEmail}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p
                          className={`text-[11px] font-bold ${entra ? 'text-emerald-700' : 'text-slate-700'}`}
                        >
                          {entra ? '+' : ''}
                          {pesos(mov.amountCop)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {pesos(mov.balanceAfterCop)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
