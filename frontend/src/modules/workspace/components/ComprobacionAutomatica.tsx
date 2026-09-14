import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  lineaDePasajes,
  lineasDeLaBanda,
  marcasDelHallazgo,
  rotuloDeMarca,
  type InformeNormalizado
} from '../services/comprobaciones';
import type { ComprobacionesDelInforme, SeccionDelInforme } from '../services/review.api';

/**
 * LA COMPROBACIÓN AUTOMÁTICA, DIBUJADA. Presentacional: lo que dice lo decide
 * `services/comprobaciones.ts`, que también alimenta el PDF y el Word.
 *
 * Es la versión mínima del 14 de septiembre de 2026 («opción 2»): el servidor
 * dejó de escribir la comprobación dentro del texto, así que algo tiene que
 * mostrarla, y en los dos sitios donde se lee el informe —el diálogo y el
 * taller— la misma pieza. El rediseño de la banda llega después; lo que no
 * puede pasar mientras tanto es que el abogado deje de ver una advertencia
 * que antes veía.
 *
 * El ámbar es el de «sin verificar» que el sistema ya tenía: no se inventa un
 * tono para esto.
 */

/** La banda: conteos por clase, los avisos de siempre, lo no comprobado y los pasajes del caso. */
export const BandaDeComprobacion: React.FC<{ normal: InformeNormalizado; pasajesDelCaso?: number | null }> = ({ normal, pasajesDelCaso }) => {
  const banda = lineasDeLaBanda(normal);
  const pasajes = lineaDePasajes({ pasajesDelCaso: pasajesDelCaso ?? normal.pasajesDelCaso });
  if (!banda && !pasajes) return null;
  const hayQueMirar = Boolean(banda && (banda.cuenta.length > 0 || banda.avisos.length > 0));

  return (
    <div className="space-y-2">
      {pasajes && <p className="text-meta text-ink-500">{pasajes}</p>}
      {banda && (
        <section
          aria-label={banda.titulo}
          className={`rounded-control border px-3 py-2.5 ${
            hayQueMirar ? 'border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))]' : 'border-line-200 bg-canvas'
          }`}
        >
          <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">{banda.titulo}</h4>
          {banda.cuenta.length > 0 && (
            <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
              {banda.cuenta.map((x) => (
                <li key={x.clase} className="text-[12px] font-semibold text-unverified">
                  {x.etiqueta}: {x.cantidad}
                </li>
              ))}
            </ul>
          )}
          {banda.nota && (
            <p className="mt-1 flex gap-1.5 text-[12px] leading-snug text-ink-700 text-justify [text-wrap:pretty]">
              {!hayQueMirar && banda.nota.includes('ninguno requiere atención') && <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-verified" />}
              <span>{banda.nota}</span>
            </p>
          )}
          {banda.avisos.map((a, k) => (
            <p key={k} className="mt-1.5 text-[12px] leading-snug text-ink-900 text-justify [text-wrap:pretty]">
              {a}
            </p>
          ))}
          {banda.noComprobadas.length > 0 && (
            <div className="mt-1.5">
              <p className="text-[11px] font-semibold text-ink-500">Sin respuesta de las fuentes oficiales:</p>
              <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-[12px] leading-snug text-ink-700">
                {banda.noComprobadas.map((x, k) => (
                  <li key={k} className="text-justify [text-wrap:pretty]">{x}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

/**
 * La marca junto a un hallazgo: clase, artículo y el mensaje de siempre. Nada
 * cuando el hallazgo no nombra ningún artículo señalado. Nunca va dentro de la
 * cita del abogado: se pinta debajo de la tarjeta.
 */
export const MarcasDelHallazgo: React.FC<{
  comprobaciones: ComprobacionesDelInforme | null;
  seccion: SeccionDelInforme;
  indice: number;
}> = ({ comprobaciones, seccion, indice }) => {
  const marcas = marcasDelHallazgo(comprobaciones, seccion, indice);
  if (marcas.length === 0) return null;
  return (
    <div className="mt-1 space-y-1">
      {marcas.map((m, k) => (
        <div key={k} className="rounded-control border border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] px-2 py-1.5">
          <p className="flex items-center gap-1 text-[11px] font-semibold leading-snug text-unverified">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            {rotuloDeMarca(m)}
          </p>
          <p className="mt-0.5 text-[12px] leading-snug text-ink-700 text-justify [text-wrap:pretty]">{m.mensaje}</p>
        </div>
      ))}
    </div>
  );
};

/** Una sección con viñetas, como `SeccionDeInforme`, con la marca debajo de cada hallazgo. */
export const SeccionConMarcas: React.FC<{
  titulo: string;
  items: string[];
  seccion: SeccionDelInforme;
  comprobaciones: ComprobacionesDelInforme | null;
  tono?: 'ok' | 'aviso' | 'neutro';
}> = ({ titulo, items, seccion, comprobaciones, tono = 'neutro' }) => {
  if (items.length === 0) return null;
  const Icono = tono === 'ok' ? CheckCircle2 : tono === 'aviso' ? AlertTriangle : null;
  return (
    <section>
      <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">{titulo}</h4>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="text-ui leading-snug text-ink-900">
            <div className="flex gap-2">
              {Icono ? (
                <Icono className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tono === 'ok' ? 'text-verified' : 'text-danger'}`} />
              ) : (
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-400" />
              )}
              <span className="text-justify [text-wrap:pretty]">{it}</span>
            </div>
            <MarcasDelHallazgo comprobaciones={comprobaciones} seccion={seccion} indice={i} />
          </li>
        ))}
      </ul>
    </section>
  );
};
