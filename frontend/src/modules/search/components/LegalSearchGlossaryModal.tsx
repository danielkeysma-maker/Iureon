import React, { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Search } from 'lucide-react';
import { useTenant } from '../../tenant/TenantContext';
import { searchGlossary } from '../services/legalSearch.api';
import type { GlossaryTerm } from '../services/legalSearch.api';
import { Cargando, PantallaDeHerramienta } from '../../tools/components/PantallaDeHerramienta';

/**
 * Glosario jurídico, leído del catálogo verificado. Pantalla de
 * `app-herramientas.html` :445.
 *
 * What this replaced is worth recording. The modal carried two glossary
 * entries, one "sentencia" and three "web precedents", all written by hand:
 *
 *  - the prescripción trienal entry cited an article of the CPTSS and offered a
 *    ready-to-paste sentence built on it. The CPTSS was replaced by Ley 2452 de
 *    2025, in force since 2 April 2026, with every article renumbered — the
 *    citation it handed the lawyer pointed at a repealed code.
 *  - one item cited a labour-chamber ruling with a summary of its holding.
 *  - another offered, as a citation, a description of a 2024 ruling wearing the
 *    shape of one.
 *
 * Everything shown here now comes from the catalogue, where each term was read
 * in the norm and carries the URL it was read at. Jurisprudence lives in the
 * search view, which queries the ingested corpus; it is not duplicated here.
 *
 * ─── LO QUE LA MAQUETA DIBUJA Y AQUÍ NO ESTÁ ────────────────────────────────
 *
 * La marca «Cada actuación tiene el suyo: mírelo en el catálogo» de algunas
 * entradas: el término del catálogo no dice si su plazo depende de la
 * actuación, y ponerla a ojo sería clasificar a mano lo que el catálogo no
 * clasifica. Tampoco se copian las cuatro definiciones de ejemplo: las que se
 * leen son las del servidor.
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
    <PantallaDeHerramienta
      forma="lista"
      titulo="Glosario jurídico"
      bajada="Los términos del oficio, con la norma que los define. Sin costo."
      onVolver={onClose}
    >
      <div className="cn-her-bloques">
        <div className="cn-her-buscar">
          <Search aria-hidden="true" size={17} strokeWidth={1.5} className="cn-her-buscar-icono" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar un término, una norma o un artículo"
            aria-label="Buscar en el glosario"
            className="cn-her-buscar-campo"
          />
        </div>

        {isLoading && <Cargando texto="Leyendo el glosario…" />}

        {/* Un vacío que dice por qué: el servidor explica si no hay coincidencias o si no pudo leer. */}
        {!isLoading && items.length === 0 && (
          <div className="cn-her-aviso">
            <p>{reason ?? 'No hay términos verificados que coincidan con la búsqueda.'}</p>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <ul className="cn-her-terminos">
            {items.map((item) => (
              <li key={item.id} className="cn-her-termino">
                <div className="cn-her-termino-cabeza">
                  <h2 className="cn-her-termino-nombre">{item.term}</h2>
                  <span className="cn-her-termino-ref cn-her-mono">{item.colombianNormativeRef}</span>
                </div>
                <p className="cn-her-termino-definicion">{item.definition}</p>
                <div className="cn-her-termino-pie">
                  <span className="cn-her-chip cn-her-chip--neutro">{item.category}</span>
                  {item.sourceUrl && (
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="cn-her-enlace">
                      Ver el texto oficial
                      <ExternalLink aria-hidden="true" size={14} />
                    </a>
                  )}
                  <button type="button" onClick={() => handleCopy(item)} className="cn-her-boton cn-her-boton--texto">
                    {copiedId === item.id ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
                    {copiedId === item.id ? 'Copiado' : 'Copiar norma'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="cn-her-nota">
          Cada definición sale del catálogo verificado y cita la norma que la sostiene, con la dirección oficial donde se
          leyó.
        </p>
      </div>
    </PantallaDeHerramienta>
  );
};
