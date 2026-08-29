import React, { useEffect, useState } from 'react';
import { X, Search, BookOpen, Check, Copy, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { useTenant } from '../../tenant/TenantContext';
import { searchGlossary } from '../services/legalSearch.api';
import type { GlossaryTerm } from '../services/legalSearch.api';

/**
 * Glosario jurídico, leído del catálogo verificado.
 *
 * What this replaced is worth recording. The modal carried two glossary
 * entries, one "sentencia" and three "web precedents", all written by hand:
 *
 *  - the prescripción trienal entry cited "Art. 151 CPTSS" and offered a
 *    ready-to-paste sentence built on it. The CPTSS was replaced by Ley 2452 de
 *    2025, in force since 2 April 2026, with every article renumbered — the
 *    citation it handed the lawyer pointed at a repealed code.
 *  - one item cited "Sentencia SL-4102-2023" with a summary of its holding.
 *  - another offered, as a citation, the string "Corte Suprema de Justicia,
 *    Sala Laboral, Sentencia 2024 (Reconocimiento Horas Extras Teletrabajo)",
 *    which is not a citation at all — it is a description wearing the shape of
 *    one.
 *
 * Everything shown here now comes from the catalogue, where each term was read
 * in the norm and carries the URL it was read at. Jurisprudence lives in the
 * search view, which queries the ingested corpus; it is not duplicated here.
 */

interface LegalSearchGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCitation?: (citation: string) => void;
}

export const LegalSearchGlossaryModal: React.FC<LegalSearchGlossaryModalProps> = ({
  isOpen,
  onClose,
  onInsertCitation
}) => {
  const { firmId } = useTenant();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [items, setItems] = useState<GlossaryTerm[]>([]);
  const [reason, setReason] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !firmId) return;

    const controller = new AbortController();
    setIsLoading(true);

    searchGlossary(searchQuery.trim(), 'TODAS', controller.signal)
      .then((response) => {
        setItems(response.items ?? []);
        setReason(response.reason);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setItems([]);
        setReason(error instanceof Error ? error.message : 'No se pudo cargar el glosario.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [isOpen, firmId, searchQuery]);

  if (!isOpen) return null;

  const handleCopy = (item: GlossaryTerm) => {
    // The normative reference as catalogued — not a sentence composed here.
    navigator.clipboard.writeText(item.colombianNormativeRef);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
    onInsertCitation?.(item.colombianNormativeRef);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-card shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-line-200">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-4 h-4 text-brand-700" />
            <div>
              <h2 className="font-bold text-ink-900 text-[15px]">Glosario jurídico</h2>
              <p className="text-[11px] text-ink-400">
                Términos del catálogo verificados contra la norma vigente
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-canvas rounded-control transition-colors">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        <div className="p-4 border-b border-line-100">
          <div className="relative">
            <Search className="w-4 h-4 text-ink-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar un término, una norma o un artículo..."
              className="w-full bg-canvas/70 border border-line-200 rounded-card pl-10 pr-4 py-2.5 text-ink-900 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-900/20 focus:border-brand-700/40"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-ink-400 text-[13px]">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Cargando</span>
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-card p-5 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-justify text-[13px] leading-relaxed text-amber-900 [text-wrap:pretty]">
                {reason ?? 'No hay términos verificados que coincidan con la búsqueda.'}
              </p>
            </div>
          )}

          {!isLoading &&
            items.map((item) => (
              <div key={item.id} className="bg-surface border border-line-200 rounded-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-ink-900 text-[13.5px] leading-tight">{item.term}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-canvas text-ink-500 flex-shrink-0">
                    {item.category}
                  </span>
                </div>

                <p className="text-justify text-[12px] leading-relaxed text-ink-500 [text-wrap:pretty]">{item.definition}</p>

                <div className="flex items-center justify-between pt-1.5 border-t border-line-100">
                  <span className="text-[11px] text-ink-500 font-medium truncate pr-2">
                    {item.colombianNormativeRef}
                  </span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-canvas rounded-control transition-colors"
                        title="Abrir la norma en su fuente"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                      </a>
                    )}
                    <button
                      onClick={() => handleCopy(item)}
                      className="px-2.5 py-1.5 bg-canvas hover:bg-line-100/80 text-ink-700 rounded-control text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-ink-400" />}
                      <span>{copiedId === item.id ? 'Copiado' : 'Copiar norma'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
