import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import {
  lineaDePasajes,
  lineasDeLaBanda,
  marcasDelHallazgo,
  rotuloDeMarca,
  type InformeNormalizado
} from '../services/comprobaciones';
import type { ClaseDeComprobacion, ComprobacionesDelInforme, LugarDelInforme, SeccionDelInforme } from '../services/review.api';

/**
 * LA COMPROBACIÓN AUTOMÁTICA, DIBUJADA. Presentacional: lo que dice lo decide
 * `services/comprobaciones.ts`, que también alimenta el PDF y el Word.
 *
 * Nació el 14 de septiembre de 2026 («opción 2») como la versión mínima: el
 * servidor dejó de escribir la comprobación dentro del texto, así que algo
 * tenía que mostrarla, y en los dos sitios donde se lee el informe —el diálogo
 * y el taller— la misma pieza. Hoy lleva la cara de
 * `public/handoff/app-informe-de-revision.html`: una banda con una fila por
 * clase y la marca sobre el hallazgo afectado.
 *
 * El ámbar es el de «sin verificar» que el sistema ya tenía: no se inventa un
 * tono para esto, y el rojo del diseño no se copia —es de lo destructivo—.
 */

/**
 * «IR AL PUNTO» SOLO CUANDO HAY PUNTO. El dato trae `dondeAparece` por
 * artículo; se busca el primer lugar donde esa clase tiene marca DIBUJADA
 * —`marcasDelHallazgo` decide qué se marca, así que se le pregunta a ella y no
 * se repite su regla aquí—. Lo no comprobado nunca se marca sobre un hallazgo,
 * de modo que su fila no ofrece salto: saltar a un párrafo sin nada que ver
 * enseñaría a desconfiar del botón. Un artículo sin lugar se cuenta igual.
 */
export const primerLugarMarcado = (c: ComprobacionesDelInforme | null, clase: ClaseDeComprobacion): LugarDelInforme | null => {
  if (!c) return null;
  for (const a of c.articulos) {
    for (const l of a.dondeAparece) {
      if (marcasDelHallazgo(c, l.seccion, l.indice).some((m) => m.clase === clase)) return l;
    }
  }
  return null;
};

/** El ancla que el hallazgo lleva en `data-hallazgo`. Una sola función para los dos lados del salto. */
export const anclaDelHallazgo = (seccion: SeccionDelInforme, indice: number): string => `${seccion}-${indice}`;

/**
 * El salto, dentro del informe que contiene el botón y no en todo el documento:
 * el diálogo y el taller no se montan a la vez, pero si algún día lo hicieran,
 * cada banda llevaría a su propio informe.
 */
const irAlPunto = (e: React.MouseEvent<HTMLButtonElement>, lugar: LugarDelInforme) => {
  const raiz = e.currentTarget.closest('[data-informe]');
  const destino = raiz?.querySelector<HTMLElement>(`[data-hallazgo="${anclaDelHallazgo(lugar.seccion, lugar.indice)}"]`);
  if (!destino) return;
  destino.scrollIntoView({ block: 'center', behavior: 'smooth' });
  destino.focus({ preventScroll: true });
  destino.classList.add('cn-inf-hallazgo--destacado');
  window.setTimeout(() => destino.classList.remove('cn-inf-hallazgo--destacado'), 1600);
};

/*
 * LA GRAVEDAD SIN ROJO. Derogada y «no lo dice el artículo» dicen que el apoyo
 * no existe: ámbar sólido. Modulada y fuentes en desacuerdo piden leer antes de
 * usar: ámbar suave. Lo no comprobado es ausencia de respuesta, no un error del
 * escrito: gris con el borde discontinuo que en esta casa significa «sin
 * verificar».
 */
const TONO_DE_CLASE: Record<ClaseDeComprobacion, 'fuerte' | 'media' | 'neutra'> = {
  DEROGADA: 'fuerte',
  NO_LO_DICE_EL_ARTICULO: 'fuerte',
  MODULADA: 'media',
  FUENTES_EN_DESACUERDO: 'media',
  NO_COMPROBADA: 'neutra'
};

/** La banda: una fila por clase con su conteo, los avisos de siempre, lo no comprobado y los pasajes del caso. */
export const BandaDeComprobacion: React.FC<{ normal: InformeNormalizado; pasajesDelCaso?: number | null }> = ({ normal, pasajesDelCaso }) => {
  const banda = lineasDeLaBanda(normal);
  const pasajes = lineaDePasajes({ pasajesDelCaso: pasajesDelCaso ?? normal.pasajesDelCaso });
  if (!banda && !pasajes) return null;
  const hayQueMirar = Boolean(banda && (banda.cuenta.length > 0 || banda.avisos.length > 0));

  return (
    <>
      {pasajes && <p className="cn-inf-pasajes">{pasajes}</p>}
      {banda && (
        <section aria-label={banda.titulo} className={`cn-inf-banda ${hayQueMirar ? '' : 'cn-inf-banda--quieta'}`}>
          <h4 className="cn-inf-banda-titulo">
            <span className="cn-inf-banda-punto" aria-hidden="true" />
            {banda.titulo}
          </h4>
          {banda.nota && (
            <p className="cn-inf-banda-nota">
              {!hayQueMirar && banda.nota.includes('ninguno requiere atención') && <CheckCircle2 className="cn-inf-banda-nota-icono" aria-hidden="true" />}
              <span>{banda.nota}</span>
            </p>
          )}
          {banda.cuenta.length > 0 && (
            <ul className="cn-inf-banda-filas">
              {banda.cuenta.map((x) => {
                const tono = TONO_DE_CLASE[x.clase];
                const lugar = primerLugarMarcado(normal.comprobaciones, x.clase);
                return (
                  <li key={x.clase} className={`cn-inf-banda-fila ${tono === 'neutra' ? 'cn-inf-banda-fila--no-comprobada' : ''}`}>
                    <span className={`cn-inf-clase cn-inf-clase--${tono}`}>{x.etiqueta}</span>
                    <span className="cn-inf-banda-cuenta">
                      {x.cantidad} {x.cantidad === 1 ? 'artículo' : 'artículos'}
                    </span>
                    {lugar && (
                      <button type="button" className="cn-inf-ir" onClick={(e) => irAlPunto(e, lugar)}>
                        Ir al punto
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {banda.avisos.map((a, k) => (
            <p key={k} className="cn-inf-banda-aviso">
              {a}
            </p>
          ))}
          {banda.noComprobadas.length > 0 && (
            <div>
              <p className="cn-inf-banda-sub">Sin respuesta de las fuentes oficiales:</p>
              <ul className="cn-inf-banda-lista">
                {banda.noComprobadas.map((x, k) => (
                  <li key={k}>{x}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </>
  );
};

/**
 * La marca junto a un hallazgo: clase, artículo y el mensaje de siempre. Nada
 * cuando el hallazgo no nombra ningún artículo señalado. Nunca va dentro de la
 * cita del abogado: se pinta debajo de lo que dice el revisor.
 */
export const MarcasDelHallazgo: React.FC<{
  comprobaciones: ComprobacionesDelInforme | null;
  seccion: SeccionDelInforme;
  indice: number;
}> = ({ comprobaciones, seccion, indice }) => {
  const marcas = marcasDelHallazgo(comprobaciones, seccion, indice);
  if (marcas.length === 0) return null;
  return (
    <div className="cn-inf-marcas">
      {marcas.map((m, k) => (
        <div key={k} className="cn-inf-marca">
          <p className="cn-inf-marca-rotulo">
            <AlertTriangle className="cn-inf-marca-icono" aria-hidden="true" />
            {rotuloDeMarca(m)}
          </p>
          <p className="cn-inf-marca-texto">{m.mensaje}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * Una sección del informe con la marca debajo de cada hallazgo, y el ancla del
 * salto en cada uno.
 *
 * `estrato` decide la forma: en «lo que exige la norma» cada hallazgo es una
 * tarjeta; en «criterio del revisor», que ya va sobre su propia superficie, un
 * renglón. `vacio` es la decisión sobre las secciones sin hallazgos: en la
 * norma se dice («Sin hallazgos en esta sección»), porque ahí el silencio
 * informa que no se halló nada exigible sin cumplir; en el criterio la sección
 * no se pinta, porque «sin fortalezas» no informa y suena a reproche.
 */
export const SeccionConMarcas: React.FC<{
  titulo: string;
  items: string[];
  seccion: SeccionDelInforme;
  comprobaciones: ComprobacionesDelInforme | null;
  estrato: 'norma' | 'criterio';
  /** Recomendaciones: numeradas en el orden en que llegan. */
  numerada?: boolean;
}> = ({ titulo, items, seccion, comprobaciones, estrato, numerada = false }) => {
  if (items.length === 0 && estrato === 'criterio') return null;
  return (
    <>
      <h4 className="cn-inf-h3">{titulo}</h4>
      {items.length === 0 ? (
        <p className="cn-inf-vacio">Sin hallazgos en esta sección</p>
      ) : (
        <ul className="cn-inf-lista">
          {items.map((it, i) => (
            <li
              key={i}
              data-hallazgo={anclaDelHallazgo(seccion, i)}
              tabIndex={-1}
              className={`cn-inf-hallazgo ${estrato === 'norma' ? 'cn-inf-tarjeta' : ''}`}
            >
              <div className="cn-inf-punto">
                {numerada ? (
                  <span className="cn-inf-numero">{String(i + 1).padStart(2, '0')}</span>
                ) : (
                  <span className={`cn-inf-guion ${estrato === 'norma' ? 'cn-inf-guion--norma' : ''}`} aria-hidden="true" />
                )}
                <span className="cn-inf-punto-texto">{it}</span>
              </div>
              <MarcasDelHallazgo comprobaciones={comprobaciones} seccion={seccion} indice={i} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
};
