import React, { useState } from 'react';
import {
  BookMarked,
  CalendarClock,
  ChevronDown,
  Infinity as InfinityIcon,
  AlertTriangle,
  Landmark,
  ExternalLink
} from 'lucide-react';
import type { Actuacion, TermStatus } from '../types';

interface ActuacionInfoPanelProps {
  actuacion: Actuacion;
}

/**
 * Visual treatment per term status.
 *
 * The three states are deliberately not interchangeable. A verified caducidad
 * is urgent information, "does not expire" is reassurance, and "not verified"
 * is a warning to go and check. Rendering the last two alike would let a
 * lawyer read an unchecked deadline as no deadline.
 */
const TERM_STYLES: Record<
  TermStatus,
  { wrapper: string; icon: typeof CalendarClock; iconColor: string; heading: string }
> = {
  VERIFICADO: {
    wrapper: 'bg-rose-50 border-rose-200 text-rose-900',
    icon: CalendarClock,
    iconColor: 'text-rose-600',
    heading: 'Término de caducidad'
  },
  NO_CADUCA: {
    wrapper: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: InfinityIcon,
    iconColor: 'text-emerald-600',
    heading: 'Sin caducidad'
  },
  NO_VERIFICADO: {
    wrapper: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    heading: 'Término no verificado'
  }
};

/**
 * Procedural facts for the selected actuación, shown before the draft is
 * generated: the norm it rests on, its deadline, and the sections the norm
 * requires.
 *
 * This is the same data handed to the drafting engine, so what the lawyer sees
 * is what the model was told.
 */
export const ActuacionInfoPanel: React.FC<ActuacionInfoPanelProps> = ({ actuacion }) => {
  const [showSections, setShowSections] = useState(false);

  const termStyle = TERM_STYLES[actuacion.term.status];
  const TermIcon = termStyle.icon;
  const mandatoryCount = actuacion.requiredSections.filter((s) => s.mandatory).length;

  return (
    <div className="px-4 py-3 border-b border-slate-100 space-y-2.5">
      <div className="flex items-start gap-2">
        <BookMarked className="w-3.5 h-3.5 text-blue-900 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[12px] font-semibold text-slate-900 leading-tight">
            {actuacion.exactName}
          </p>
          <p className="text-[11px] text-slate-500 leading-tight mt-0.5">{actuacion.legalBasis}</p>
        </div>
      </div>

      {/* Term — the field most likely to change what the lawyer does next */}
      <div className={`border rounded-lg p-2.5 ${termStyle.wrapper}`}>
        <div className="flex items-center gap-1.5 mb-0.5">
          <TermIcon className={`w-3.5 h-3.5 shrink-0 ${termStyle.iconColor}`} />
          <span className="text-[11px] font-bold">{termStyle.heading}</span>
        </div>
        <p className="text-[11px] leading-snug">
          {actuacion.term.status === 'NO_VERIFICADO'
            ? 'El catálogo no tiene este término confirmado contra la norma. Verifícalo antes de radicar: no asumas que no hay plazo.'
            : actuacion.term.description}
        </p>

        {/* Who supplied the fact matters as much as the fact. A term the firm
            curated must never read as one that shipped verified. */}
        {actuacion.verification && (
          <p className="text-[10px] mt-1.5 pt-1.5 border-t border-current/15 opacity-80 leading-snug">
            Verificado por tu firma ({actuacion.verification.verifiedBy}) el{' '}
            {new Date(actuacion.verification.verifiedAt).toLocaleDateString('es-CO')}.
          </p>
        )}
      </div>

      {actuacion.competentAuthority && (
        <div className="flex items-start gap-1.5 text-[11px] text-slate-600">
          <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span className="leading-snug">{actuacion.competentAuthority}</span>
        </div>
      )}

      {actuacion.requiredSections.length > 0 && (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowSections(!showSections)}
            className="w-full px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
          >
            <span className="text-[11px] font-semibold text-slate-700">
              Estructura exigida por la norma
              {mandatoryCount > 0 && (
                <span className="ml-1.5 text-rose-700">({mandatoryCount} obligatorias)</span>
              )}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showSections ? 'rotate-180' : ''}`}
            />
          </button>

          {showSections && (
            <ol className="p-2.5 space-y-1 bg-white">
              {actuacion.requiredSections.map((section) => (
                <li key={section.n} className="text-[11px] leading-snug flex gap-1.5">
                  <span className="text-slate-400 shrink-0">{section.n}.</span>
                  <span className={section.mandatory ? 'text-slate-900 font-semibold' : 'text-slate-600'}>
                    {section.name}
                    {section.mandatory && (
                      <span className="ml-1 text-[10px] text-rose-700 font-bold">OBLIGATORIA</span>
                    )}
                    {section.basis && (
                      <span className="ml-1 text-[10px] text-slate-400 font-normal">
                        ({section.basis})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {actuacion.sourceUrl && (
        <a
          href={actuacion.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-slate-400 hover:text-blue-900 flex items-center gap-1 transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          <span>Fuente normativa verificada</span>
        </a>
      )}
    </div>
  );
};
