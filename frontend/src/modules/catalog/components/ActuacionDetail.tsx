import React from 'react';
import type { Actuacion, RequiredSection } from '../types';
import { branchLabel } from '../branchLabels';

/**
 * La ficha de la actuación: los tres datos y las secciones.
 *
 * Vestida con la cara nueva desde `app-buscador-catalogo.html` (la anatomía de
 * la ficha de providencia, artboard 2: rótulo, prosa, datos en rejilla). Vive
 * dentro de la ficha del escritorio y de la pantalla de detalle del teléfono.
 *
 * ─── TRES BLOQUES, CADA UNO CON SU PROPIO ESTADO ────────────────────────────
 *
 * Término, norma y autoridad definen la actuación: **una ficha puede estar
 * verificada en el término y coja en la autoridad, y eso tiene que verse**. Un
 * único sello arriba escondería justo la mitad que falta — y la autoridad es la
 * que manda al abogado a radicar ante quien no es. El término va a lo ancho
 * porque es prosa larga; norma y autoridad, lado a lado.
 *
 * ─── «TÉRMINO VERIFICADO» NO ES «NORMA VERIFICADA» ──────────────────────────
 *
 * El bloque de la norma decía «Verificada contra su texto oficial» con solo
 * traer una URL. Lo que el catálogo verifica es el TÉRMINO, leído en esa
 * fuente; el artículo se publica como lo trae la ficha. Afirmar que la norma
 * está verificada porque existe un enlace es exactamente la confusión que la
 * doctrina de verificación prohíbe. Hoy dice «Con fuente» y qué significa.
 *
 * ─── LAS SECCIONES EXISTÍAN Y NADIE LAS VEÍA ────────────────────────────────
 *
 * Las fichas traen sus secciones obligatorias y el motor las exige al redactar.
 * Un requisito que la aplicación impone y el abogado no puede leer es un
 * requisito que no puede discutir.
 *
 * ─── LO QUE NO ESTÁ, con la razón ───────────────────────────────────────────
 *
 * · Verificar una sección concreta: `catalog_verifications` guarda UNA fila
 *   por firma y actuación, sin columnas por sección. El curador marcaría la
 *   casilla y al recargar seguiría sin verificar. Peor que no ofrecerlo.
 * · Historia de curaduría: por la misma llave solo sobrevive la última.
 * · «Usada en N escritos»: los borradores no se relacionan con la actuación.
 */

type TonoDelBloque = 'ok' | 'sin' | 'neutro';

interface Estado {
  texto: string;
  tono: TonoDelBloque;
}

const estadoDelTermino = (a: Actuacion): Estado => {
  if (a.term.status === 'VERIFICADO') return { texto: 'Término verificado', tono: 'ok' };
  if (a.term.status === 'NO_CADUCA') return { texto: 'No caduca', tono: 'neutro' };
  return { texto: 'Sin verificar', tono: 'sin' };
};

/*
 * Con fuente es neutro, no verde: la URL dice dónde se leyó el término, no que
 * alguien comprobara el artículo. Sin fuente es «sin comprobar», que no es
 * estar mal, y por eso no va en rojo.
 */
const estadoDeLaNorma = (a: Actuacion): Estado =>
  a.sourceUrl ? { texto: 'Con fuente', tono: 'neutro' } : { texto: 'Sin fuente', tono: 'sin' };

const estadoDeLaAutoridad = (a: Actuacion): Estado =>
  a.competentAuthority ? { texto: 'Declarada', tono: 'neutro' } : { texto: 'Sin declarar', tono: 'sin' };

const Sello: React.FC<{ estado: Estado }> = ({ estado }) => (
  <span className={`cn-cat-sello cn-cat-sello--${estado.tono}`}>
    {estado.tono === 'ok' && <span className="cn-cat-punto" aria-hidden="true" />}
    {estado.texto}
  </span>
);

interface BloqueProps {
  rotulo: string;
  valor: string | null;
  detalle?: string | null;
  estado: Estado;
  ancho?: boolean;
  cita?: boolean;
}

const Bloque: React.FC<BloqueProps> = ({ rotulo, valor, detalle, estado, ancho, cita }) => (
  <div className={`cn-cat-bloque${ancho ? ' cn-cat-bloque--ancho' : ''}`}>
    <div className="cn-cat-bloque-cabeza">
      <h3 className="cn-cat-rotulo">{rotulo}</h3>
      <Sello estado={estado} />
    </div>
    {valor ? (
      <p className={cita ? 'cn-cat-bloque-cita' : 'cn-cat-prosa'}>{valor}</p>
    ) : (
      <p className="cn-cat-nota">No declarada en la ficha</p>
    )}
    {detalle && <p className="cn-cat-nota">{detalle}</p>}
  </div>
);

const Seccion: React.FC<{ seccion: RequiredSection }> = ({ seccion }) => {
  const conArticulo = Boolean(seccion.basis);
  return (
    <li className="cn-cat-seccion">
      <span className="cn-cat-seccion-numero">{String(seccion.n).padStart(2, '0')}</span>
      <div className="min-w-0 flex-1">
        <p className="cn-cat-seccion-nombre">
          {seccion.name}
          {!seccion.mandatory && <span className="cn-cat-nota"> · opcional</span>}
        </p>
        {conArticulo ? (
          <p className="cn-cat-seccion-cita">{seccion.basis}</p>
        ) : (
          <p className="cn-cat-tono--sin">sin artículo confirmado</p>
        )}
      </div>
      <Sello estado={conArticulo ? { texto: 'Con artículo', tono: 'neutro' } : { texto: 'Sin artículo', tono: 'sin' }} />
    </li>
  );
};

interface ActuacionDetailProps {
  actuacion: Actuacion;
}

export const ActuacionDetail: React.FC<ActuacionDetailProps> = ({ actuacion }) => {
  const secciones = [...actuacion.requiredSections].sort((a, b) => a.n - b.n);
  const conArticulo = secciones.filter((s) => s.basis).length;
  const sinArticulo = secciones.length - conArticulo;

  return (
    <div className="cn-cat-detalle">
      {/*
        EL SOBRE VA PRIMERO. Quien abre una ficha que llega por remisión tiene
        que saberlo ANTES de leer «sin verificar» en el término, o lo leería
        como un hueco del catálogo en su rama.
      */}
      {actuacion.porRemision && (
        <p className="cn-cat-sobre">
          Esta ficha es de {branchLabel(actuacion.porRemision.ramaFuente)} y llega a{' '}
          {branchLabel(actuacion.porRemision.paraRama)} por remisión ({actuacion.porRemision.base}).{' '}
          {actuacion.porRemision.aviso}
          {actuacion.porRemision.alcance ? ` ${actuacion.porRemision.alcance}` : ''}
        </p>
      )}

      <div className="cn-cat-bloques">
        <Bloque
          ancho
          rotulo="Término"
          valor={
            actuacion.term.description ??
            (actuacion.term.status === 'NO_CADUCA' ? 'No caduca' : 'Nadie ha comprobado el plazo')
          }
          estado={estadoDelTermino(actuacion)}
        />
        <Bloque
          cita
          rotulo="Norma"
          valor={actuacion.legalBasis || null}
          detalle={
            actuacion.sourceUrl
              ? 'La fuente es donde se leyó el término; el artículo se muestra como lo trae la ficha.'
              : null
          }
          estado={estadoDeLaNorma(actuacion)}
        />
        <Bloque rotulo="Autoridad competente" valor={actuacion.competentAuthority} estado={estadoDeLaAutoridad(actuacion)} />
      </div>

      {actuacion.sourceUrl && (
        <a href={actuacion.sourceUrl} target="_blank" rel="noopener noreferrer" className="cn-cat-enlace">
          Ver el texto oficial de la norma
        </a>
      )}

      <section className="cn-cat-secciones" aria-labelledby={`secciones-${actuacion.id}`}>
        <header className="cn-cat-secciones-cabeza">
          <h3 id={`secciones-${actuacion.id}`} className="cn-cat-rotulo">
            Secciones obligatorias del escrito
          </h3>
          <p className="cn-cat-nota">
            {conArticulo} con artículo
            {sinArticulo > 0 && ` · ${sinArticulo} sin artículo confirmado`}
          </p>
        </header>

        {secciones.length === 0 ? (
          <p className="cn-cat-nota">Esta ficha no declara secciones.</p>
        ) : (
          <ul className="cn-cat-lista-secciones">
            {secciones.map((s) => (
              <Seccion key={s.n} seccion={s} />
            ))}
          </ul>
        )}

        {sinArticulo > 0 && (
          <p className="cn-cat-nota cn-cat-justificado">
            Una sección sin artículo confirmado se le sigue exigiendo al escrito: lo que falta es la cita que la sostiene,
            no el requisito. Confirmarla una por una todavía no se puede guardar —la curaduría se registra por actuación,
            no por sección—, así que se muestra en vez de ofrecerse un botón que no dejaría rastro.
          </p>
        )}
      </section>

      {actuacion.verification && (
        <section className="cn-cat-curaduria">
          <h3 className="cn-cat-rotulo">Curaduría de su firma</h3>
          <dl className="cn-cat-datos">
            <div>
              <dt>Verificó</dt>
              <dd>{actuacion.verification.verifiedBy}</dd>
            </div>
            <div>
              <dt>Fecha</dt>
              <dd>
                {new Date(actuacion.verification.verifiedAt).toLocaleString('es-CO', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </dd>
            </div>
          </dl>
          {actuacion.verification.note && <p className="cn-cat-prosa">{actuacion.verification.note}</p>}
          <p className="cn-cat-nota">
            Se conserva la última curación, no el historial: el catálogo guarda una fila por actuación y firma, así que una
            curación reemplaza a la anterior.
          </p>
        </section>
      )}

      {!actuacion.verification && actuacion.term.status === 'NO_VERIFICADO' && (
        <p className="cn-cat-nota cn-cat-justificado">
          Nadie de su firma ha comprobado esta ficha. Mientras siga así, los escritos advierten en vez de afirmar un plazo
          — que es lo correcto, no un defecto.
        </p>
      )}
    </div>
  );
};
