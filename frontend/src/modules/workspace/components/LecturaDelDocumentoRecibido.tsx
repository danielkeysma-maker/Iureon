import React from 'react';
import { AlertTriangle, UserX } from 'lucide-react';
import type { InformeDeDocumentoRecibido } from '../services/review.api';
import { etiquetaDeAtaque, puntosDeAtaqueDe } from '../services/ataque';

/**
 * LA LECTURA DE UN DOCUMENTO RECIBIDO, PINTADA UNA SOLA VEZ.
 *
 * ─── POR QUÉ SE SACÓ DEL DIÁLOGO ────────────────────────────────────────────
 *
 * El informe del documento recibido nació dentro de `RevisarEscritoDialog` y
 * solo se veía ahí. Pero el mismo informe tiene que verse en la pestaña
 * «Informe» del taller —el abogado abre el taller y espera encontrar lo que
 * acaba de pagar—, y el taller no puede importar el diálogo sin arrastrar
 * medio catálogo. Duplicar el dibujo habría sido peor: son secciones que
 * declaran QUÉ ESTÁ RESPALDADO Y QUÉ NO, y dos copias divergen en la primera
 * palabra que alguien cambie en una sola de ellas.
 *
 * ─── LO QUE ESTE COMPONENTE NO TRAE ─────────────────────────────────────────
 *
 * El «¿y qué puedo hacer?» —la guía de actuaciones con su rama, y el salto a
 * Redacción— NO vive aquí. Vive en `PuenteAlAtaque`, que es un componente
 * propio y no un fragmento de ninguna pantalla, y entra por `pie`. Antes ese
 * pie lo escribía el diálogo de revisión y solo existía allí: el taller montaba
 * este mismo componente SIN pie, así que en la pantalla donde el abogado
 * vuelve a leer el informe días después no había ningún botón. Sigue entrando
 * por `pie` —una lectura puede necesitar mostrarse sin salidas— pero lo que se
 * le pasa es la misma pieza en los dos sitios.
 *
 * ─── LA CARA ────────────────────────────────────────────────────────────────
 *
 * La de `public/handoff/app-informe-de-revision.html` (artboards 4 y 5). Se
 * pinta dentro de un contenedor `cn-inf`, que pone la rejilla y los tokens.
 */

/**
 * Una lista con viñetas y su rótulo; vacía no se dibuja.
 *
 * `tono="aviso"` es lo que el documento calla: va en tarjetas sobre gris y no
 * con el icono rojo de antes, porque una ausencia declarada no es un error.
 */
export const SeccionDeInforme: React.FC<{ titulo: string; items: string[]; tono?: 'ok' | 'aviso' | 'neutro'; bajada?: string }> = ({
  titulo,
  items,
  tono = 'neutro',
  bajada
}) => {
  if (items.length === 0) return null;
  return (
    <section className="cn-inf-estrato">
      <h4 className="cn-inf-h2">{titulo}</h4>
      {bajada && <p className="cn-inf-bajada">{bajada}</p>}
      <ul className="cn-inf-lista">
        {items.map((it, i) => (
          <li key={i} className={tono === 'aviso' ? 'cn-inf-nota' : ''}>
            <div className="cn-inf-punto">
              <span className="cn-inf-guion" aria-hidden="true" />
              <span className="cn-inf-punto-texto">{it}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};

export interface LecturaDelDocumentoRecibidoProps {
  informe: InformeDeDocumentoRecibido;
  /** El «¿y qué puedo hacer?» de quien la monta: el diálogo trae la guía; el taller, un recordatorio. */
  pie?: React.ReactNode;
}

/* ─── LO QUE EL ABOGADO LEE CUANDO SUBE UN AUTO DE UN JUEZ ──────────────────
 *
 * Cuatro cosas, en el orden en que las necesita: qué es y quién lo profirió,
 * qué decide, QUÉ LE EXIGE Y PARA CUÁNDO —con las palabras del documento al
 * lado— y qué queda pendiente. Después, lo que el documento calla, y por
 * dónde se ataca.
 */
export const LecturaDelDocumentoRecibido: React.FC<LecturaDelDocumentoRecibidoProps> = ({ informe, pie }) => {
  const puntos = puntosDeAtaqueDe(informe);
  /*
   * SI SE SABE QUÉ PARTE ES EL LECTOR. Falta en todo informe anterior a este
   * campo y cuando el abogado prefirió no decirlo; en los dos casos la
   * pantalla deja de hablar en segunda persona en vez de suponerla.
   */
  const seSabeLaPosicion = Boolean(informe.posicion) && informe.posicion !== 'DESCONOCIDO';
  /* El radicado y la fecha son citables: van en mono. Quién lo profirió es un nombre. */
  const identificacion = [
    informe.quienLoProfirio && { etiqueta: 'Lo profirió', valor: informe.quienLoProfirio, mono: false },
    informe.radicado && { etiqueta: 'Radicado', valor: informe.radicado, mono: true },
    informe.fecha && { etiqueta: 'Fecha del documento', valor: informe.fecha, mono: true }
  ].filter(Boolean) as { etiqueta: string; valor: string; mono: boolean }[];

  return (
    <>
      {informe.queEs && <p className="cn-inf-que-es">{informe.queEs}</p>}

      {identificacion.length > 0 && (
        <section className="cn-inf-estrato">
          <h4 className="cn-inf-h2">Según el propio documento</h4>
          <dl className="cn-inf-datos">
            {identificacion.map((x) => (
              <div key={x.etiqueta} className="cn-inf-dato">
                <dt className="cn-inf-dato-etiqueta">{x.etiqueta}</dt>
                <dd className={`cn-inf-dato-valor ${x.mono ? 'cn-inf-mono' : ''}`}>{x.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <SeccionDeInforme titulo="Qué decide u ordena" items={informe.decide} />

      <section className="cn-inf-estrato">
        {/*
          EL RÓTULO CAMBIA SEGÚN SE SEPA A QUIÉN, y no es cosmético. «Qué LE
          exige» afirma que la carga es del lector; mientras no se sepa qué
          parte es, esa afirmación no se puede hacer y el rótulo se limita a lo
          que sí consta: qué exige el documento.
        */}
        <h4 className="cn-inf-h2">{seSabeLaPosicion ? 'Qué le exige y para cuándo' : 'Qué exige el documento y para cuándo'}</h4>
        {informe.cargas.length === 0 ? (
          <p className="cn-inf-vacio">
            {/*
              «Ninguna carga A SU CARGO» decía de quién no era la carga sin
              saber quién era el lector. Sin posición declarada se dice lo
              único comprobado: que el documento no impone ninguna.
            */}
            {seSabeLaPosicion
              ? 'Del texto de este documento no se desprende ninguna carga a su cargo.'
              : 'Del texto de este documento no se desprende ninguna carga.'}
          </p>
        ) : (
          <ul className="cn-inf-lista">
            {informe.cargas.map((c, k) => (
              <li key={k} className={`cn-inf-carga ${c.deQuienEs === 'DE_OTRO' ? 'cn-inf-carga--ajena' : ''}`}>
                {c.carga && <p className="cn-inf-carga-titulo">{c.carga}</p>}
                {/*
                  DE QUIÉN ES, cuando se puede decir. El veredicto lo calcula
                  el servidor comparando a quién se la impone el documento con
                  la posición que el abogado declaró; aquí solo se pinta.

                  «No es suya» va primero y destacado porque es el que evita
                  trabajo y evita el susto. «Es suya» va discreto: confirma sin
                  gritar. Y sin veredicto se muestra el destinatario tal cual
                  lo escribió el documento, que informa sin atribuir.
                */}
                {c.deQuienEs === 'DE_OTRO' && (
                  <p className="cn-inf-atribucion">
                    <UserX className="cn-inf-atribucion-icono" aria-hidden="true" />
                    <span className="min-w-0 text-justify">
                      <span className="cn-inf-seleccionado">Esta carga no es suya.</span> El documento se la impone a{' '}
                      <span className="[overflow-wrap:anywhere]">{c.aQuien}</span>.
                    </span>
                  </p>
                )}
                {c.deQuienEs === 'SUYA' && <p className="cn-inf-atribucion">El documento se la impone a {c.aQuien}: le corresponde a usted.</p>}
                {c.deQuienEs !== 'DE_OTRO' && c.deQuienEs !== 'SUYA' && c.aQuien && (
                  <p className="cn-inf-atribucion [overflow-wrap:anywhere]">El documento se la impone a {c.aQuien}.</p>
                )}
                {/*
                  EL PLAZO AUSENTE SE DICE CON TODAS SUS LETRAS. Callarlo dejaría
                  al abogado suponiendo que no hay plazo —que es lo contrario de
                  lo que se sabe— y rellenarlo con uno recordado sería la cita
                  fabricada que esta casa tiene prohibida. La respuesta de dónde
                  sale ese plazo está en el catálogo verificado.
                */}
                {c.plazo ? (
                  /*
                    EL PLAZO AJENO NO SE PINTA EN EL COLOR DE FIRMA. Es el mismo
                    dato y no es la misma noticia: en el color del plazo propio
                    vuelve a ser una alarma, que es justo lo que esta sección
                    existe para no hacer.
                  */
                  <p className={`cn-inf-plazo ${c.deQuienEs === 'DE_OTRO' ? 'cn-inf-plazo--ajeno' : ''}`}>Plazo que anuncia el documento: {c.plazo}</p>
                ) : c.deQuienEs === 'DE_OTRO' ? (
                  /*
                    Y SI LA CARGA ES AJENA, NO FALTA NINGÚN PLAZO SUYO. El aviso
                    de abajo manda a buscar el término al catálogo, que es
                    consejo para quien tiene que cumplir: sobre la carga de la
                    contraparte es ruido que compite con los avisos de verdad.
                  */
                  null
                ) : (
                  /* Sin plazo anunciado es exactamente «sin verificar»: por eso lleva el borde discontinuo. */
                  <p className="cn-inf-sin-plazo" role="status">
                    <AlertTriangle className="cn-inf-aviso-icono" aria-hidden="true" />
                    <span className="min-w-0">
                      El documento no anuncia plazo para esta carga. No se le pone uno de memoria: consúltelo en la guía de actuaciones, donde el
                      término viene con su artículo y su autoridad verificados.
                    </span>
                  </p>
                )}
                {c.cita && (
                  <div>
                    <span className="cn-inf-rotulo">Dice el documento</span>
                    <blockquote className="cn-inf-cita font-legal">«{c.cita}»</blockquote>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <SeccionDeInforme titulo="Qué queda pendiente, según el documento" items={informe.loQueSigue} />
      <SeccionDeInforme titulo="Lo que el documento no dice" items={informe.noLoDiceElDocumento} tono="aviso" />

      {/* ─── POR DÓNDE SE ATACA ───────────────────────────────────────────
        *
        * La mitad que faltaba. Y la más delicada de pintar, porque aquí no hay
        * ficha detrás de nada: lo único que sostiene un flanco es la cita del
        * propio documento. Por eso cada punto se dibuja en dos planos VISIBLES
        * —las palabras del documento, entre comillas; debajo, rotulada y sobre
        * otra superficie, la lectura del revisor—, igual que el informe del
        * escrito propio separa lo que exige la norma de lo que opina quien
        * revisa. Un punto sin cita no llega hasta aquí: el servidor lo descarta
        * al leer la respuesta.
        */}
      {puntos.length > 0 && (
        <section className="cn-inf-estrato">
          <h4 className="cn-inf-h2">Por dónde se ataca</h4>
          <p className="cn-inf-bajada">
            {/*
              QUÉ SON Y PARA QUÉ SIRVEN, EN UNA LÍNEA. Se reportó que «solo hay
              unas descripciones de por dónde se ataca pero no se entiende cómo
              usarlas»: la sección mostraba citas y lecturas sin decir nunca que
              son el material con el que se funda el escrito que viene después.
              Va primero, antes de las reglas de lectura, porque el para qué es
              lo que decide si alguien sigue leyendo.
            */}
            Estos son los puntos por los que este documento se puede controvertir: son el material con el que se sustenta
            el escrito que usted presente en su contra, y abajo puede llevarlos a la guía de actuaciones y de ahí a
            Redacción. Cada punto se apoya en las palabras del propio documento, que van citadas. Lo rotulado como
            lectura del revisor es criterio, no texto del documento: aquí se señala el flanco y concluye usted.
          </p>
          <ul className="cn-inf-lista">
            {puntos.map((p, k) => (
              <li key={k} className="cn-inf-flanco">
                <div className="cn-inf-flanco-cabeza">
                  <span className="cn-inf-numero">{String(k + 1).padStart(2, '0')}</span>
                  <span className="cn-inf-flanco-clase">{etiquetaDeAtaque(p.clase)}</span>
                </div>
                <div className="cn-inf-flanco-cuerpo">
                  <div>
                    <span className="cn-inf-rotulo">Dice el documento</span>
                    <blockquote className="cn-inf-cita font-legal">«{p.cita}»</blockquote>
                  </div>
                  {/*
                    LA NORMA SOLO APARECE CON SU TEXTO AL LADO. Nombrar el artículo
                    sin lo que el documento dice que ordena invitaría a completarlo
                    de memoria, que es justo lo prohibido; el servidor ya vacía el
                    nombre cuando falta la transcripción, y aquí se exige de nuevo.
                  */}
                  {p.norma && p.citaDeLaNorma && (
                    <div className="cn-inf-norma">
                      <span className="cn-inf-rotulo">Norma en que el propio documento se apoya · {p.norma}</span>
                      <blockquote className="cn-inf-cita font-legal">«{p.citaDeLaNorma}»</blockquote>
                    </div>
                  )}
                  {p.lectura && (
                    <div className="cn-inf-lectura">
                      <span className="cn-inf-rotulo cn-inf-rotulo--marca">Lectura del revisor</span>
                      <p className="cn-inf-valor">{p.lectura}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pie}
    </>
  );
};
