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
 *
 * LA DIRECCIÓN VA EN EL ENLACE Y NO ESCRITA DEBAJO. La maqueta nombra la fuente
 * y la enlaza; imprimir además la URL completa partía cada fila en tres
 * renglones de caracteres sin sentido. La URL sigue entera en el enlace, en el
 * Excel y en el PDF, que es donde se cita.
 */
export const FuentesBox: React.FC<{ fuentes: Fuente[] }> = ({ fuentes }) => {
  if (fuentes.length === 0) return null;
  return (
    <div className="cn-her-caja">
      <p className="cn-her-caja-titulo">Fuentes</p>
      <ul className="cn-her-fuentes">
        {fuentes.map((f) => (
          <li key={`${f.nombre}-${f.url}`} className="cn-her-fuente">
            <a href={f.url} target="_blank" rel="noreferrer" className="cn-her-enlace">
              {f.nombre}
              <ExternalLink aria-hidden="true" size={14} />
            </a>
            <p className="cn-her-nota">{f.norma}</p>
            <p className="cn-her-nota">
              Consultado el <span className="cn-her-mono">{f.consultadoEl}</span>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
