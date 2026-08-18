import React from 'react';
import { Lightbulb, Quote, ShieldAlert } from 'lucide-react';
import { ROLE_LABELS, type RoleProposal, type SpeakerRole } from '../types';

interface RoleProposalsProps {
  proposals: RoleProposal[];
  /** Roles already applied, so a confirmed voice stops being offered. */
  assigned: Record<string, SpeakerRole>;
  onAccept: (speakerLabel: string, role: SpeakerRole) => void;
}

const atMinute = (seconds: number | null): string => {
  if (seconds === null) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return ` · min ${m}:${String(s).padStart(2, '0')}`;
};

/**
 * Shows what the app THINKS each voice is, and the phrase it read to think it.
 *
 * The evidence is not decoration. Diarization returns speaker_0 and speaker_1
 * and never names them; these roles are inferred from procedural formulas in
 * the transcript, and a quotation or counsel reading the judge's order aloud
 * will trip the same marker. Printing "JUEZ" alone would look exactly like a
 * verified fact — so the quote travels with it and the lawyer confirms from
 * what was actually said, not from our confidence.
 *
 * Voices with no marker are absent from this panel rather than listed as
 * uncertain: there is nothing to propose, and the role selector on each
 * intervention is already where they get assigned by hand.
 */
export const RoleProposals: React.FC<RoleProposalsProps> = ({ proposals, assigned, onAccept }) => {
  const pending = proposals.filter(
    (proposal) => proposal.matches > 0 && proposal.proposedRole !== 'DESCONOCIDO' && !assigned[proposal.speakerLabel]
  );

  if (pending.length === 0) return null;

  return (
    <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-semibold text-slate-900">Roles sugeridos</p>
          <p className="text-[11px] text-slate-600 leading-snug mt-0.5">
            Deducidos de lo que dijo cada voz. Revise la frase antes de aceptar: la aplicación no
            estuvo en la audiencia.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {pending.map((proposal) => (
          <div
            key={proposal.speakerLabel}
            className="bg-white border border-slate-200/80 rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-slate-700">
                <span className="font-mono text-[11px] text-slate-500">{proposal.speakerLabel}</span>
                <span className="mx-1.5 text-slate-300">→</span>
                <b className="text-slate-900">{ROLE_LABELS[proposal.proposedRole]}</b>
              </span>

              <button
                onClick={() => onAccept(proposal.speakerLabel, proposal.proposedRole)}
                className="px-2.5 py-1 bg-blue-950 hover:bg-blue-900 text-white rounded-md text-[11px] font-semibold flex-shrink-0"
              >
                Confirmar
              </button>
            </div>

            {proposal.evidence.map((evidence, index) => (
              <p
                key={index}
                className="text-[11px] text-slate-600 leading-snug flex items-start gap-1.5 bg-slate-50 rounded p-2"
              >
                <Quote className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                <span>
                  {evidence.phrase}
                  <span className="text-slate-400">{atMinute(evidence.atSeconds)}</span>
                </span>
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/** Warns that a transcript exists only in this tab. */
export const NotPersistedWarning: React.FC = () => (
  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2">
    <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
    <p className="text-[11.5px] text-rose-800 leading-snug">
      <b>Este transcrito no se guardó.</b> La transcripción se completó, pero no pudo almacenarse:
      si cierra esta pestaña lo pierde. Copie el texto ahora.
    </p>
  </div>
);
