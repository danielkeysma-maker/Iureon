import React from 'react';
import { User } from 'lucide-react';
import {
  ROLE_LABELS,
  ROLE_OPTIONS,
  type SpeakerRole,
  type TranscriptionKind,
  type TranscriptionResult
} from '../types';

interface TranscriptSegmentsProps {
  result: TranscriptionResult;
  kind: TranscriptionKind;
  onAssignRole: (speakerLabel: string, role: SpeakerRole) => void;
}

/** Colour per speaker so a long hearing stays readable at a glance. */
const SPEAKER_STYLES = [
  'border-l-blue-700 bg-blue-50/40',
  'border-l-emerald-700 bg-emerald-50/40',
  'border-l-amber-700 bg-amber-50/40',
  'border-l-purple-700 bg-purple-50/40',
  'border-l-rose-700 bg-rose-50/40',
  'border-l-cyan-700 bg-cyan-50/40'
];

const formatTimestamp = (seconds: number | null): string => {
  if (seconds === null) return '';

  const total = Math.floor(seconds);
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');

  return `${mm}:${ss}`;
};

/**
 * The transcript itself, plus the control that maps each diarized speaker to a
 * procedural role.
 *
 * The mapping is the step that makes a transcript citable: "speaker_1 dijo" is
 * useless in a filing, "el Juez dijo" is not.
 */
export const TranscriptSegments: React.FC<TranscriptSegmentsProps> = ({
  result,
  kind,
  onAssignRole
}) => {
  const styleFor = (speakerLabel: string): string =>
    SPEAKER_STYLES[result.speakerLabels.indexOf(speakerLabel) % SPEAKER_STYLES.length];

  const roleOf = (speakerLabel: string): SpeakerRole =>
    result.segments.find((s) => s.speakerLabel === speakerLabel)?.role ?? 'DESCONOCIDO';

  return (
    <div className="space-y-4">
      {/* Speaker role assignment */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <h4 className="font-bold text-slate-900 text-xs mb-1">Identifica a los interlocutores</h4>
        <p className="text-[11px] text-slate-500 mb-3">
          El motor detectó {result.speakerLabels.length} voces distintas pero no sabe quién es
          quién. Asigna el rol procesal de cada una.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {result.speakerLabels.map((label) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg border-l-4 ${styleFor(label)} flex items-center justify-center shrink-0`}
              >
                <User className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <span className="text-[11px] font-mono text-slate-500 w-20 shrink-0">{label}</span>
              <select
                value={roleOf(label)}
                onChange={(e) => onAssignRole(label, e.target.value as SpeakerRole)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-[11px] text-slate-900 focus:outline-none focus:border-blue-900"
              >
                {ROLE_OPTIONS[kind].map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Transcript */}
      <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
        {result.segments.map((segment, index) => (
          <div
            key={`${segment.speakerLabel}-${index}`}
            className={`border-l-4 ${styleFor(segment.speakerLabel)} p-3`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-slate-800">
                {ROLE_LABELS[segment.role]}
              </span>
              {segment.role === 'DESCONOCIDO' && (
                <span className="text-[10px] font-mono text-slate-400">{segment.speakerLabel}</span>
              )}
              {segment.startSeconds !== null && (
                <span className="text-[10px] font-mono text-slate-400 ml-auto">
                  {formatTimestamp(segment.startSeconds)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">{segment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
