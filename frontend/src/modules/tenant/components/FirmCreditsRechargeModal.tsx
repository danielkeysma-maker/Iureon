import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Wallet, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import type { LawFirmTenant } from './Header';

interface FirmCreditsRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  firm: LawFirmTenant;
  onRechargeSuccess: (addedAmount: number) => void;
}

export const FirmCreditsRechargeModal: React.FC<FirmCreditsRechargeModalProps> = ({
  isOpen,
  onClose,
  firm,
  onRechargeSuccess
}) => {
  const [selectedPackage, setSelectedPackage] = useState<number>(250000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const quickPackages = [
    { amount: 100000, label: '$100.000 COP', description: 'Ideal para 50+ piezas procesales' },
    { amount: 250000, label: '$250.000 COP', description: 'Recomendado para despachos medianos (150+ consultas)' },
    { amount: 500000, label: '$500.000 COP', description: 'Máximo rendimiento corporativo (350+ litigios)' },
    { amount: 1000000, label: '$1.000.000 COP', description: 'Recarga masiva para firmas de alto volumen' }
  ];

  const handleRechargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = customAmount ? parseFloat(customAmount) : selectedPackage;

    if (!finalAmount || finalAmount <= 0) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      onRechargeSuccess(finalAmount);
      setSuccessMessage(`✅ Recarga de $${finalAmount.toLocaleString('es-CO')} COP acreditada exitosamente a ${firm.name}.`);
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1500);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 border border-emerald-600 flex items-center justify-center text-white">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Recargar Saldo de Créditos Procesales</h3>
              <p className="text-[11px] text-slate-300">{firm.name} ({firm.nit})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <form onSubmit={handleRechargeSubmit} className="p-6 space-y-5 text-xs">
          {/* Current Balance Display */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block">Saldo Disponible en Cuenta:</span>
              <span className="text-xl font-black text-slate-900 font-mono">
                ${(firm.creditsBalance || 0).toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cuenta Activa</span>
            </div>
          </div>

          {/* Quick Packages Grid */}
          <div className="space-y-2">
            <label className="font-bold text-slate-900 block text-xs">Selecciona un Paquete de Recarga:</label>
            <div className="grid grid-cols-2 gap-2.5">
              {quickPackages.map((pkg) => {
                const isSelected = selectedPackage === pkg.amount && !customAmount;
                return (
                  <button
                    key={pkg.amount}
                    type="button"
                    onClick={() => {
                      setSelectedPackage(pkg.amount);
                      setCustomAmount('');
                    }}
                    className={`p-3 text-left border rounded-xl transition-all ${
                      isSelected
                        ? 'border-blue-900 bg-blue-50/70 shadow-xs ring-1 ring-blue-900'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-extrabold text-slate-900 text-sm">{pkg.label}</div>
                    <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{pkg.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="font-semibold text-slate-700 block text-[11px] mb-1">O ingresa un monto personalizado (COP):</label>
            <div className="relative">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Ej. 150000"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-900"
              />
            </div>
          </div>

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {isProcessing ? (
              <span>Acreditando saldo...</span>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Abonar Recarga a la Cuenta</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
