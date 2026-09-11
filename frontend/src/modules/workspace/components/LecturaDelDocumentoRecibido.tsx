import React from 'react';
import { AlertTriangle, CheckCircle2, UserX } from 'lucide-react';
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
 */

/** Una lista con viñetas y su rótulo; vacía no se dibuja. */
export const SeccionDeInforme: React.FC<{ titulo: string; items: string[]; tono?: 'ok' | 'aviso' | 'neutro' }> = ({ titulo, items, tono = 'neutro' }) => {
  if (items.length === 0) return null;
  const Icono = tono === 'ok' ? CheckCircle2 : tono === 'aviso' ? AlertTriangle : null;
  return (
    <section>
      <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">{titulo}</h4>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-ui leading-snug text-ink-900">
            {Icono ? (
              <Icono className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tono === 'ok' ? 'text-verified' : 'text-danger'}`} />
            ) : (
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-400" />
            )}
            <span>{it}</span>
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
  const identificacion = [
    informe.quienLoProfirio && { etiqueta: 'Lo profirió', valor: informe.quienLoProfirio },
    informe.radicado && { etiqueta: 'Radicado', valor: informe.radicado },
    informe.fecha && { etiqueta: 'Fecha del documento', valor: informe.fecha }
  ].filter(Boolean) as { etiqueta: string; valor: string }[];

  return (
    <>
      {informe.queEs && <p className="text-[14px] leading-relaxed text-ink-900 text-justify [text-wrap:pretty]">{informe.queEs}</p>}

      {identificacion.length > 0 && (
        <section>
          <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">Según el propio documento</h4>
          <dl className="mt-1.5 space-y-1">
            {identificacion.map((x) => (
              <div key={x.etiqueta} className="flex flex-col gap-0.5 sm:flex-row sm:gap-2">
                <dt className="min-w-0 shrink-0 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-400 sm:w-40">{x.etiqueta}</dt>
                <dd className="min-w-0 flex-1 text-ui leading-snug text-ink-900">{x.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <SeccionDeInforme titulo="Qué decide u ordena" items={informe.decide} />

      <section>
        {/*
          EL RÓTULO CAMBIA SEGÚN SE SEPA A QUIÉN, y no es cosmético. «Qué LE
          exige» afirma que la carga es del lector; mientras no se sepa qué
          parte es, esa afirmación no se puede hacer y el rótulo se limita a lo
          que sí consta: qué exige el documento.
        */}
        <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">
          {seSabeLaPosicion ? 'Qué le exige y para cuándo' : 'Qué exige el documento y para cuándo'}
        </h4>
        {informe.cargas.length === 0 ? (
          <p className="mt-1.5 text-ui leading-snug text-ink-900 text-justify">
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
          <div className="mt-1.5 space-y-2.5">
            {informe.cargas.map((c, k) => (
              <div key={k} className="rounded-control border border-line-200 bg-canvas px-3 py-2.5">
                {c.carga && <p className="text-ui leading-snug text-ink-900 text-justify [text-wrap:pretty]">{c.carga}</p>}
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
                  <p className="mt-1.5 flex items-start gap-1.5 text-ui leading-snug text-ink-700">
                    <UserX className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
                    <span className="min-w-0 text-justify">
                      <span className="font-semibold">Esta carga no es suya.</span> El documento se la impone a{' '}
                      <span className="[overflow-wrap:anywhere]">{c.aQuien}</span>.
                    </span>
                  </p>
                )}
                {c.deQuienEs === 'SUYA' && (
                  <p className="mt-1.5 text-meta text-ink-500">
                    El documento se la impone a {c.aQuien}: le corresponde a usted.
                  </p>
                )}
                {c.deQuienEs !== 'DE_OTRO' && c.deQuienEs !== 'SUYA' && c.aQuien && (
                  <p className="mt-1.5 text-meta text-ink-500 [overflow-wrap:anywhere]">
                    El documento se la impone a {c.aQuien}.
                  </p>
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
                    EL PLAZO AJENO NO SE PINTA EN ROJO DE FIRMA. Es el mismo
                    dato y no es la misma noticia: en el color del plazo propio
                    vuelve a ser una alarma, que es justo lo que esta sección
                    existe para no hacer.
                  */
                  <p
                    className={`mt-1.5 text-ui leading-snug ${
                      c.deQuienEs === 'DE_OTRO' ? 'text-ink-600' : 'font-semibold text-brand-700'
                    }`}
                  >
                    Plazo que anuncia el documento: {c.plazo}
                  </p>
                ) : c.deQuienEs === 'DE_OTRO' ? (
                  /*
                    Y SI LA CARGA ES AJENA, NO FALTA NINGÚN PLAZO SUYO. El aviso
                    de abajo manda a buscar el término al catálogo, que es
                    consejo para quien tiene que cumplir: sobre la carga de la
                    contraparte es ruido que compite con los avisos de verdad.
                  */
                  null
                ) : (
                  <p className="notice-unverified mt-1.5" role="status">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-unverified" />
                    <span className="min-w-0 text-justify">
                      El documento no anuncia plazo para esta carga. No se le pone uno de memoria: consúltelo en la guía de actuaciones, donde el
                      término viene con su artículo y su autoridad verificados.
                    </span>
                  </p>
                )}
                {c.cita && (
                  <>
                    <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">Dice el documento</p>
                    <blockquote className="mt-0.5 border-l-2 border-line-200 pl-2.5 text-ui italic leading-snug text-ink-700 text-justify">
                      «{c.cita}»
                    </blockquote>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <SeccionDeInforme titulo="Qué queda pendiente, según el documento" items={informe.loQueSigue} />
      <SeccionDeInforme titulo="Lo que el documento no dice" items={informe.noLoDiceElDocumento} tono="aviso" />

      {/* ─── POR DÓNDE SE ATACA ───────────────────────────────────────────
        *
        * La mitad que faltaba. Y la más delicada de pintar, porque aquí no hay
        * ficha detrás de nada: lo único que sostiene un flanco es la cita del
        * propio documento. Por eso cada punto se dibuja en dos planos VISIBLES
        * —las palabras del documento, entre comillas y en cursiva; debajo,
        * rotulada, la lectura del revisor—, igual que el informe del escrito
        * propio separa lo que exige la norma de lo que opina quien revisa. Un
        * punto sin cita no llega hasta aquí: el servidor lo descarta al leer la
        * respuesta.
        */}
      {puntos.length > 0 && (
        <section>
          <h4 className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-400">Por dónde se ataca</h4>
          <p className="mt-1 text-[12px] leading-snug text-ink-500 text-justify [text-wrap:pretty]">
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
          <div className="mt-1.5 space-y-2.5">
            {puntos.map((p, k) => (
              <div key={k} className="rounded-control border border-line-200 bg-canvas px-3 py-2.5">
                <p className="font-mono text-[10.5px] font-semibold text-ink-500">{etiquetaDeAtaque(p.clase)}</p>
                <p className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">Dice el documento</p>
                <blockquote className="mt-0.5 border-l-2 border-line-200 pl-2.5 text-ui italic leading-snug text-ink-700 text-justify">
                  «{p.cita}»
                </blockquote>
                {/*
                  LA NORMA SOLO APARECE CON SU TEXTO AL LADO. Nombrar el artículo
                  sin lo que el documento dice que ordena invitaría a completarlo
                  de memoria, que es justo lo prohibido; el servidor ya vacía el
                  nombre cuando falta la transcripción, y aquí se exige de nuevo.
                */}
                {p.norma && p.citaDeLaNorma && (
                  <>
                    <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                      Norma en que el propio documento se apoya · {p.norma}
                    </p>
                    <blockquote className="mt-0.5 border-l-2 border-line-200 pl-2.5 text-ui italic leading-snug text-ink-700 text-justify">
                      «{p.citaDeLaNorma}»
                    </blockquote>
                  </>
                )}
                {p.lectura && (
                  <>
                    <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-brand-700">Lectura del revisor</p>
                    <p className="mt-0.5 text-ui leading-snug text-ink-900 text-justify [text-wrap:pretty]">{p.lectura}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {pie}
    </>
  );
};
