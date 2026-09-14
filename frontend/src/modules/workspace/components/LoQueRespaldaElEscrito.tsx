import React, { useMemo } from 'react';
import { ExternalLink, Scale } from 'lucide-react';
import type { ActuacionLookup } from '../../catalog/hooks/useActuacion';
import { esTituloDeTrabajo } from '../../catalog/tituloDeTrabajo';
import { estadoDeLaFicha } from '../services/fichaEnLaLista';
import { seccionesEnElEscrito } from '../services/seccionesEnElEscrito';
import { EstadoDeLaFicha } from './SelectorEnCascada';

/**
 * «Lo que respalda este escrito»: la columna derecha del borrador.
 *
 * Nace del artboard «Borrador» (líneas 756–841 de
 * `public/handoff/app-redaccion-revision.html`) pero NO copia su bloque «De dónde
 * sale cada cosa», y esa es la decisión de fondo.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · «De dónde sale cada cosa», con una tarjeta por afirmación («Los 24 meses
 *   del contrato · está en el contrato, página 1»). Nadie clasifica el escrito
 *   afirmación por afirmación, así que esas tarjetas serían inventadas en la
 *   pantalla donde se decide firmar. Lo que SÍ se sabe es contra qué ficha se
 *   redactó, y eso es lo que se muestra.
 *
 * ─── LO QUE SÍ DICE ─────────────────────────────────────────────────────────
 *
 * La ficha del catálogo tal como está hoy: su nombre, su norma, la autoridad,
 * el término COMPLETO —en letra de lectura, porque es un párrafo con salvedades
 * y recortarlo esconde justo la salvedad— y las secciones que la ficha exige,
 * cada una con lo único que se midió: si su rótulo aparece en el texto. Donde
 * aparece, un salto al párrafo. Reemplaza al contador «Secciones exigidas N/M»,
 * que decía cuántas y no cuáles.
 *
 * El término se pinta como está guardado. Varias fichas escriben en mayúscula
 * la frase que importa («EL RELOJ DEL PARTICULAR…»); pasarlo a minúscula
 * rompería siglas y nombres propios, y no hay transformación que distinga una
 * cosa de la otra.
 */

interface LoQueRespaldaElEscritoProps {
  ficha: ActuacionLookup;
  /** El texto tal como está en el papel, para buscar los rótulos. */
  texto: string;
  jurisprudencia: readonly string[];
  onIrAParrafo: (indice: number) => void;
}

export const LoQueRespaldaElEscrito: React.FC<LoQueRespaldaElEscritoProps> = ({ ficha, texto, jurisprudencia, onIrAParrafo }) => {
  const actuacion = ficha.actuacion;
  const obligatorias = useMemo(() => actuacion?.requiredSections.filter((s) => s.mandatory) ?? [], [actuacion]);
  const secciones = useMemo(() => seccionesEnElEscrito(texto, obligatorias), [texto, obligatorias]);

  return (
    <section className="cn-red-respaldo-cuerpo" aria-label="Lo que respalda este escrito">
      <h2 className="cn-red-respaldo-titulo">Lo que respalda este escrito</h2>

      {ficha.estado === 'CARGANDO' && <p className="cn-red-respaldo-nota">Consultando la ficha del catálogo…</p>}

      {ficha.estado === 'SIN_CATALOGAR' && (
        <p className="cn-red-respaldo-aviso cn-red-respaldo-aviso--sin">
          Esta actuación no está en el catálogo: ninguna ficha verificada respalda el escrito. El término, el artículo y la autoridad
          que aparezcan en el texto hay que confirmarlos contra la norma.
        </p>
      )}

      {ficha.estado === 'ENCONTRADA' && actuacion && (
        <>
          <div className="cn-red-respaldo-bloque">
            <p className="cn-red-respaldo-nombre">{actuacion.exactName}</p>
            <EstadoDeLaFicha estado={estadoDeLaFicha(actuacion, esTituloDeTrabajo(actuacion.exactName))} />
          </div>

          <dl className="cn-red-respaldo-datos">
            <div className="cn-red-respaldo-par">
              <dt className="cn-red-respaldo-rotulo">Norma</dt>
              <dd className="cn-red-respaldo-valor">{actuacion.legalBasis}</dd>
            </div>
            {actuacion.competentAuthority && (
              <div className="cn-red-respaldo-par">
                <dt className="cn-red-respaldo-rotulo">Ante</dt>
                <dd className="cn-red-respaldo-valor">{actuacion.competentAuthority}</dd>
              </div>
            )}
            <div className="cn-red-respaldo-par">
              <dt className="cn-red-respaldo-rotulo">Término</dt>
              {actuacion.term.status === 'NO_VERIFICADO' ? (
                <dd className="cn-red-respaldo-aviso cn-red-respaldo-aviso--sin">
                  Nadie ha comprobado el término de esta ficha. Si el escrito afirma un plazo, confírmelo contra la norma antes de exportar.
                </dd>
              ) : (
                <dd className="cn-red-respaldo-valor">
                  {actuacion.term.status === 'NO_CADUCA' && <span className="cn-red-respaldo-marca">No caduca. </span>}
                  {actuacion.term.description}
                </dd>
              )}
            </div>
          </dl>

          {actuacion.sourceUrl && (
            <a href={actuacion.sourceUrl} target="_blank" rel="noopener noreferrer" className="cn-red-respaldo-enlace">
              Ver la norma
              <ExternalLink className="cn-red-respaldo-svg" strokeWidth={1.8} aria-hidden />
            </a>
          )}

          {secciones.length > 0 && (
            <div className="cn-red-respaldo-bloque">
              <h3 className="cn-red-respaldo-subtitulo">Secciones que pide la ficha</h3>
              <p className="cn-red-respaldo-nota">Se busca el rótulo en el texto; encontrarlo no dice que la sección esté bien escrita.</p>
              <ol className="cn-red-respaldo-secciones">
                {secciones.map(({ seccion, encontrada, parrafo }) => (
                  <li key={seccion.n} className="cn-red-respaldo-seccion">
                    <span className="cn-red-respaldo-seccion-nombre">{seccion.name}</span>
                    <span className="cn-red-respaldo-seccion-fila">
                      <span className={encontrada ? 'cn-red-respaldo-estado cn-red-respaldo-estado--ok' : 'cn-red-respaldo-estado'}>
                        {encontrada ? 'encontrada' : 'no se encontró el rótulo'}
                      </span>
                      {parrafo !== null && (
                        <button type="button" onClick={() => onIrAParrafo(parrafo)} className="cn-red-respaldo-ir">
                          Ir al párrafo
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}

      {jurisprudencia.length > 0 && (
        <div className="cn-red-respaldo-bloque">
          <h3 className="cn-red-respaldo-subtitulo">
            <Scale className="cn-red-respaldo-svg" strokeWidth={1.6} aria-hidden />
            Jurisprudencia usada
          </h3>
          {/* Las providencias sí son citables: van en mono. */}
          <ul className="cn-red-respaldo-juris">
            {jurisprudencia.map((item, idx) => (
              <li key={idx} className="cn-red-respaldo-juris-item">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
