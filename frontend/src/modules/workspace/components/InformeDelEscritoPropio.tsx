import React from 'react';
import { marcasDelHallazgo, type InformeNormalizado } from '../services/comprobaciones';
import { BandaDeComprobacion, MarcasDelHallazgo, SeccionConMarcas, anclaDelHallazgo } from './ComprobacionAutomatica';

/**
 * EL INFORME DEL ESCRITO PROPIO, EN SUS DOS ESTRATOS. Presentacional; lo usan
 * el diálogo de revisión y la pestaña «Informe» del taller.
 *
 * ─── POR QUÉ UNA PIEZA Y NO DOS COPIAS ──────────────────────────────────────
 *
 * Los dos sitios pintaban las mismas secciones con dibujos distintos, y en
 * órdenes distintos. La separación entre lo que exige la norma y lo que opina
 * quien revisa solo se decía en el pie. Aquí vive una vez:
 *
 *   · «Lo que exige la norma»: secciones que faltan, errores de aplicación y
 *     correcciones textuales;
 *   · «Criterio del revisor»: debilidades, fortalezas y recomendaciones, sobre
 *     una superficie propia.
 *
 * Cada grupo se rotula UNA vez. El informe no trae una etiqueta por hallazgo, y
 * no se le inventa.
 *
 * ─── LO QUE CAMBIA ENTRE LOS DOS SITIOS ─────────────────────────────────────
 *
 * Las correcciones textuales. En el diálogo se leen enteras. En el taller viven
 * sobre el papel —se tocan y se aplican allí—, así que aquí solo se listan las
 * que llevan advertencia: un reemplazo cuya cita ya no está en el texto no se
 * puede tocar, y su advertencia se perdería.
 */

export interface InformeDelEscritoPropioProps {
  normal: InformeNormalizado;
  pasajesDelCaso?: number | null;
  correcciones: 'completas' | 'solo-con-advertencia';
  /** Solo el diálogo lo sabe. Sin él, el estrato de la norma no afirma de dónde sale. */
  conFicha?: boolean;
}

export const InformeDelEscritoPropio: React.FC<InformeDelEscritoPropioProps> = ({ normal, pasajesDelCaso, correcciones, conFicha }) => {
  const i = normal.informe;
  const c = normal.comprobaciones;
  const conAdvertencia = (i.correccionesTextuales ?? [])
    .map((correccion, k) => ({ correccion, k }))
    .filter(({ k }) => marcasDelHallazgo(c, 'correccionesTextuales', k).length > 0);
  const hayCriterio = i.debilidades.length + i.fortalezas.length + i.recomendaciones.length > 0;

  return (
    <>
      {/* La comprobación automática va ARRIBA: es lo que dice qué del informe no se puede usar tal cual. */}
      <BandaDeComprobacion normal={normal} pasajesDelCaso={pasajesDelCaso} />

      <section className="cn-inf-resumen cn-inf-hallazgo" data-hallazgo={anclaDelHallazgo('resumen', 0)} tabIndex={-1}>
        <p className="cn-inf-kicker">Resumen</p>
        <p className="cn-inf-resumen-texto">{i.resumen}</p>
        <MarcasDelHallazgo comprobaciones={c} seccion="resumen" indice={0} />
      </section>

      <section className="cn-inf-estrato">
        <h3 className="cn-inf-h2">Lo que exige la norma</h3>
        {conFicha !== undefined && (
          <p className="cn-inf-bajada">
            {conFicha
              ? 'Sale de la ficha verificada de la actuación.'
              : 'Sin ficha verificada detrás: esto también es lectura del revisor, y va con menos respaldo.'}
          </p>
        )}
        <SeccionConMarcas titulo="Secciones que la norma exige y faltan" items={i.seccionesFaltantes} seccion="seccionesFaltantes" comprobaciones={c} estrato="norma" />

        <h4 className="cn-inf-h3">Errores de aplicación</h4>
        {i.erroresDeAplicacion.length === 0 ? (
          <p className="cn-inf-vacio">Sin hallazgos en esta sección</p>
        ) : (
          <ul className="cn-inf-lista">
            {i.erroresDeAplicacion.map((e, k) => (
              <li key={k} data-hallazgo={anclaDelHallazgo('erroresDeAplicacion', k)} tabIndex={-1} className="cn-inf-hallazgo cn-inf-tarjeta">
                {e.donde && (
                  <>
                    <span className="cn-inf-rotulo">Dónde</span>
                    <p className="cn-inf-valor">{e.donde}</p>
                  </>
                )}
                <span className="cn-inf-rotulo">Qué está mal</span>
                <p className="cn-inf-valor">{e.problema}</p>
                <MarcasDelHallazgo comprobaciones={c} seccion="erroresDeAplicacion" indice={k} />
                {e.correccion && (
                  <>
                    <span className="cn-inf-rotulo">Cómo debería quedar</span>
                    <p className="cn-inf-valor">{e.correccion}</p>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}

        {correcciones === 'completas' ? (
          /*
            LO QUE DICE Y LO QUE DEBERÍA DECIR, palabra por palabra. Un informe
            viejo no trae el campo: ahí la sección no se pinta, porque decir «sin
            hallazgos» afirmaría que se buscó lo que esa revisión nunca pidió.
          */
          i.correccionesTextuales !== undefined && (
            <>
              <h4 className="cn-inf-h3">Correcciones textuales</h4>
              {i.correccionesTextuales.length === 0 ? (
                <p className="cn-inf-vacio">Sin hallazgos en esta sección</p>
              ) : (
                <ul className="cn-inf-lista">
                  {i.correccionesTextuales.map((co, k) => (
                    <li key={k} data-hallazgo={anclaDelHallazgo('correccionesTextuales', k)} tabIndex={-1} className="cn-inf-hallazgo cn-inf-tarjeta">
                      <span className="cn-inf-rotulo">Dice el escrito</span>
                      {/* La cita es del abogado: nunca lleva marca. */}
                      <blockquote className="cn-inf-cita font-legal">«{co.cita}»</blockquote>
                      {co.problema && (
                        <>
                          <span className="cn-inf-rotulo">El problema</span>
                          <p className="cn-inf-valor">{co.problema}</p>
                        </>
                      )}
                      <MarcasDelHallazgo comprobaciones={c} seccion="correccionesTextuales" indice={k} />
                      {co.reemplazo && (
                        <>
                          <span className="cn-inf-rotulo cn-inf-rotulo--marca">Reemplazo propuesto</span>
                          <p className="cn-inf-reemplazo font-legal">«{co.reemplazo}»</p>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )
        ) : (
          conAdvertencia.length > 0 && (
            <>
              <h4 className="cn-inf-h3">Citas del escrito con advertencia</h4>
              <ul className="cn-inf-lista">
                {conAdvertencia.map(({ correccion, k }) => (
                  <li key={k} data-hallazgo={anclaDelHallazgo('correccionesTextuales', k)} tabIndex={-1} className="cn-inf-hallazgo cn-inf-tarjeta">
                    <blockquote className="cn-inf-cita font-legal">
                      «{correccion.cita.length > 140 ? `${correccion.cita.slice(0, 140)}…` : correccion.cita}»
                    </blockquote>
                    <MarcasDelHallazgo comprobaciones={c} seccion="correccionesTextuales" indice={k} />
                  </li>
                ))}
              </ul>
            </>
          )
        )}
      </section>

      {hayCriterio && (
        <section className="cn-inf-estrato cn-inf-estrato--criterio">
          <h3 className="cn-inf-h2">Criterio del revisor</h3>
          <p className="cn-inf-bajada">Valoración profesional de quien revisó: no sale de la ficha, y usted decide.</p>
          <SeccionConMarcas titulo="Debilidades" items={i.debilidades} seccion="debilidades" comprobaciones={c} estrato="criterio" />
          <SeccionConMarcas titulo="Fortalezas" items={i.fortalezas} seccion="fortalezas" comprobaciones={c} estrato="criterio" />
          <SeccionConMarcas titulo="Recomendaciones" items={i.recomendaciones} seccion="recomendaciones" comprobaciones={c} estrato="criterio" numerada />
        </section>
      )}
    </>
  );
};
