import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock, Check, Infinity as InfinityIcon, Loader2, RotateCcw, X } from 'lucide-react';
import { useTenant } from '../../tenant/TenantContext';
import type { Actuacion, TermStatus, VerificationInput } from '../types';

interface VerificationFormProps {
  actuacion: Actuacion;
  isSaving: boolean;
  error: string | null;
  onSave: (input: VerificationInput) => Promise<boolean>;
  onRevert: (actuacionId: string) => Promise<boolean>;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: TermStatus; label: string; help: string; icon: typeof CalendarClock }[] = [
  {
    value: 'VERIFICADO',
    label: 'Tiene término',
    help: 'La norma fija un plazo y lo leíste en su texto.',
    icon: CalendarClock
  },
  {
    value: 'NO_CADUCA',
    label: 'No caduca',
    help: 'La norma dice expresamente que puede presentarse en cualquier tiempo.',
    icon: InfinityIcon
  },
  {
    value: 'NO_VERIFICADO',
    label: 'Sin verificar',
    help: 'Nadie lo ha comprobado. La aplicación advertirá en lugar de afirmar.',
    icon: AlertTriangle
  }
];

/**
 * Where a lawyer confirms an actuación's term against the norm, once, for every
 * future draft.
 *
 * The form mirrors the backend's rules instead of trusting them silently: a
 * claimed term needs its wording and its source, and "sin verificar" hides
 * those fields entirely, because a description typed under that status would be
 * precisely the unchecked deadline the catalogue exists to prevent. The server
 * still validates — this only keeps the lawyer from being rejected after typing.
 */
export const VerificationForm: React.FC<VerificationFormProps> = ({
  actuacion,
  isSaving,
  error,
  onSave,
  onRevert,
  onClose
}) => {
  const { currentUserEmail } = useTenant();

  const [termStatus, setTermStatus] = useState<TermStatus>(actuacion.term.status);
  const [termDescription, setTermDescription] = useState(actuacion.term.description ?? '');
  const [legalBasis, setLegalBasis] = useState(actuacion.legalBasis);
  const [sourceUrl, setSourceUrl] = useState(actuacion.sourceUrl ?? '');
  const [note, setNote] = useState(actuacion.verification?.note ?? '');
  const [verifiedBy, setVerifiedBy] = useState(actuacion.verification?.verifiedBy ?? currentUserEmail);

  // Reset when the lawyer moves to another actuación without closing the panel.
  useEffect(() => {
    setTermStatus(actuacion.term.status);
    setTermDescription(actuacion.term.description ?? '');
    setLegalBasis(actuacion.legalBasis);
    setSourceUrl(actuacion.sourceUrl ?? '');
    setNote(actuacion.verification?.note ?? '');
    setVerifiedBy(actuacion.verification?.verifiedBy ?? currentUserEmail);
  }, [actuacion, currentUserEmail]);

  const claimsTerm = termStatus !== 'NO_VERIFICADO';
  const canSubmit =
    verifiedBy.trim().length > 0 &&
    (!claimsTerm || (termDescription.trim().length > 0 && sourceUrl.trim().length > 0));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || isSaving) return;

    const saved = await onSave({
      actuacionId: actuacion.id,
      termStatus,
      termDescription: claimsTerm ? termDescription.trim() : null,
      legalBasis: legalBasis.trim() || null,
      sourceUrl: sourceUrl.trim() || null,
      note: note.trim() || null,
      verifiedBy: verifiedBy.trim()
    });

    if (saved) onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full bg-white">
      <header className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-tight">{actuacion.exactName}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{actuacion.branch}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {actuacion.verification && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-[11px] text-blue-900 leading-snug">
            Verificada por <strong>{actuacion.verification.verifiedBy}</strong> el{' '}
            {new Date(actuacion.verification.verifiedAt).toLocaleDateString('es-CO')}. El catálogo base
            decía: <em>{actuacion.verification.replaced.description ?? 'término no verificado'}</em>.
          </div>
        )}

        <fieldset>
          <legend className="text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-2">
            Estado del término
          </legend>
          <div className="space-y-2">
            {STATUS_OPTIONS.map((option) => {
              const Icon = option.icon;
              const selected = termStatus === option.value;

              return (
                <label
                  key={option.value}
                  className={`flex gap-2.5 items-start rounded-lg border p-2.5 cursor-pointer transition-colors ${
                    selected
                      ? 'border-blue-900 bg-blue-50/60'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="termStatus"
                    className="sr-only"
                    checked={selected}
                    onChange={() => setTermStatus(option.value)}
                  />
                  <Icon
                    className={`w-4 h-4 shrink-0 mt-0.5 ${selected ? 'text-blue-900' : 'text-slate-400'}`}
                  />
                  <span className="min-w-0">
                    <span className="block text-[12px] font-semibold text-slate-900">{option.label}</span>
                    <span className="block text-[11px] text-slate-500 leading-snug">{option.help}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {claimsTerm && (
          <>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                Término, como lo dice la norma
              </label>
              <textarea
                value={termDescription}
                onChange={(e) => setTermDescription(e.target.value)}
                rows={3}
                placeholder="Ej.: Cuatro (4) meses contados a partir del día siguiente a la notificación del acto."
                className="w-full text-[12px] border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 resize-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
                Fuente donde lo verificaste
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://www.suin-juriscol.gov.co/..."
                className="w-full text-[12px] border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
              />
              <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                Obligatoria. Sin fuente no es una verificación, es una afirmación.
              </p>
            </div>
          </>
        )}

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
            Fundamento normativo
          </label>
          <input
            type="text"
            value={legalBasis}
            onChange={(e) => setLegalBasis(e.target.value)}
            placeholder="Ley 1437 de 2011, art. 138"
            className="w-full text-[12px] border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
            Quién verifica
          </label>
          <input
            type="text"
            value={verifiedBy}
            onChange={(e) => setVerifiedBy(e.target.value)}
            className="w-full text-[12px] border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900"
          />
          <p className="text-[10px] text-slate-500 mt-1 leading-snug">
            Queda registrado: toda afirmación sobre un término es atribuible.
          </p>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5">
            Nota interna <span className="font-normal normal-case text-slate-400">(opcional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full text-[12px] border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-900/20 focus:border-blue-900 resize-none"
          />
        </div>

        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] text-rose-900 leading-snug">
            {error}
          </div>
        )}
      </div>

      <footer className="px-5 py-3 border-t border-slate-200 flex items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit || isSaving}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
          Guardar verificación
        </button>

        {actuacion.verification && (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void onRevert(actuacion.id)}
            title="Descartar la verificación de la firma y volver al catálogo base"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-[12px] font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Revertir
          </button>
        )}
      </footer>
    </form>
  );
};
