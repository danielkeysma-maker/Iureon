import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { Fuente } from '../types';

/**
 * The «Fuentes» box every calculator prints under its result.
 *
 * A figure next to its source is a figure the lawyer can defend; the same
 * figure alone is a claim. The box lists the exact norm or act, the official
 * URL and the date it was consulted — the three things a judge or a counterpart
 * will ask for. It renders nothing when the server sent no sources, because an
 * empty box titled «Fuentes» would suggest sources exist and were omitted.
 */
export const FuentesBox: React.FC<{ fuentes: Fuente[] }> = ({ fuentes }) => {
  if (fuentes.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-card border border-line-200 bg-surface">
      <p className="t-head">Fuentes</p>
      {fuentes.map((f) => (
        <div key={`${f.nombre}-${f.url}`} className="t-row">
          <p className="text-ui text-ink-900">{f.nombre}</p>
          <p className="mt-0.5 text-meta text-ink-500">{f.norma}</p>
          <a
            href={f.url}
            target="_blank"
            rel="noreferrer"
            className="mt-0.5 inline-flex max-w-full items-center gap-1 font-mono text-[11px] text-brand-700 hover:underline"
          >
            <span className="truncate">{f.url}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
          <p className="mt-0.5 font-mono text-[10.5px] text-ink-400">Consultado el {f.consultadoEl}</p>
        </div>
      ))}
    </div>
  );
};
