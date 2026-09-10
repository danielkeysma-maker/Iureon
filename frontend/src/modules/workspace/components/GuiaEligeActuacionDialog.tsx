import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CircleDashed,
  Globe,
  Landmark,
  Link2,
  Loader2,
  MinusCircle
} from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { triageApi, type TriageResponse } from '../../catalog/services/catalog.api';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import type { LegalBranch } from '../../catalog/types';

/**
 * «Que la guía elija la actuación»: de los hechos a la actuación, sin salir de
 * Redacción.
 *
 * ─── POR QUÉ ES UN PANEL Y NO UNA ELECCIÓN AUTOMÁTICA ───────────────────────
 *
 * La primera opción del desplegable podría, en teoría, escoger sola. No lo
 * hace, y esa es la decisión de fondo: el catálogo propone y nunca concluye.
 * A un abogado joven al que se le dice «esto es una tutela» se lo cree, y la
 * actuación decide el artículo, el término y la autoridad del escrito entero.
 * Aquí se muestran las candidatas CON SU FICHA a la vista —término, artículo,
 * autoridad— y la elección la hace una persona.
 *
 * EL MODELO NO ESCRIBE DERECHO. Escoge de la lista cerrada del catálogo, y
 * cualquier nombre que no resuelva se descarta en el servidor. Lo que se lee
 * abajo no es prosa del modelo: es la ficha del catálogo, más la frase con la
 * que el modelo justificó proponerla.
 *
 * ACOTADO A LA RAMA YA ELEGIDA, SALVO QUE EL ABOGADO DIGA QUE NO LA SABE.
 * Quien está en «Laboral» no quiere que se le proponga una tutela; y además el
 * menú completo son 55.624 caracteres en cada consulta, contra unos cientos por
 * rama.
 *
 * PERO ACOTAR TENÍA UN DEFECTO REAL, y no es de precio: con la rama equivocada
 * la plataforma responde «el catálogo no reconoce nada» sobre una actuación que
 * SÍ existe, dos ramas más allá. Y quien no sabe qué actuación es tampoco sabe
 * siempre en qué rama vive — es la misma ignorancia. Por eso se puede decir «no
 * sé la rama»: el triaje corre sobre las 883 fichas de las 28 ramas y cada
 * candidata muestra de dónde viene, que dentro de una rama es un dato de sobra
 * y aquí es el dato que hace falta.
 *
 * SE DICE LO QUE CUESTA. Medido el 9 de septiembre de 2026: la consulta al
 * catálogo entero tarda entre 11 y 14 segundos —contra un par en una rama— y le
 * cuesta a la casa unas cuatro veces más. Vale la pena y por eso está; callarlo
 * sería vender un botón que parece igual de barato que el de al lado.
 *
 * LOS HECHOS SON LOS QUE YA ESCRIBIÓ. Se traen del cuadro de instrucción y se
 * devuelven al cerrar, para que completarlos aquí no obligue a escribirlos dos
 * veces.
 */

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  legalBranch: string;
  /** Lo que el abogado ya escribió en «Qué debe hacer este escrito». */
  hechos: string;
  /** Se llama al pedir la orientación: lo completado aquí no se pierde. */
  setHechos: (texto: string) => void;
  /**
   * Con el nombre exacto de la actuación elegida. Cierra el diálogo.
   *
   * LA RAMA VIAJA CON EL NOMBRE, y no es adorno: buscando en todo el catálogo
   * la candidata puede venir de una rama distinta a la que trajo quien abrió, y
   * un nombre de escrito NO es único entre ramas —el mismo rótulo tiene plazos
   * distintos en dos de ellas—. Sin la rama de la candidata, quien reciba el
   * nombre volvería a resolverlo contra la rama equivocada.
   */
  onElegir: (exactName: string, branch: LegalBranch) => void;
  /** «Ninguna de estas»: abre el diálogo para escribir el nombre. */
  onEscribirNombre: () => void;
  /**
   * «Ni sé cómo se llama»: abre el diálogo que redacta sin nombre.
   *
   * Opcional porque no todos los llamadores redactan. En la revisión de un
   * documento recibido la guía sirve para RECONOCER qué le llegó, y un escrito
   * sin nombre no reconoce nada: allí la salida no existe, y su ausencia es la
   * respuesta correcta, no un olvido.
   */
  onSinNombre?: () => void;
  /**
   * Con qué estado nace la casilla de «no sé la rama».
   *
   * Existe porque en la revisión de un documento recibido la pregunta se hace
   * ANTES de abrir este diálogo —junto al informe, que es donde el abogado está
   * mirando—, y llegar aquí con la casilla en blanco lo obligaría a contestar
   * dos veces lo mismo y a pagar la consulta acotada por el camino.
   */
  sinRamaInicial?: boolean;
}

/** Mínimo para que la orientación signifique algo. Lo impone también el servidor. */
const MINIMO = 20;

export const GuiaEligeActuacionDialog: React.FC<Props> = ({
  abierto,
  onCerrar,
  legalBranch,
  hechos,
  setHechos,
  onElegir,
  onEscribirNombre,
  onSinNombre,
  sinRamaInicial = false
}) => {
  const [texto, setTexto] = useState(hechos);
  /*
   * ARRANCA CON LO QUE DIJO QUIEN ABRE, y de fábrica eso es «sí sé la rama».
   * Nadie que la sepa debería pagar la consulta completa por descuido; quien no
   * la sabe lo dice una vez y el diálogo se acuerda mientras esté abierto.
   */
  const [sinRama, setSinRama] = useState(sinRamaInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<TriageResponse | null>(null);

  /*
   * Al abrir se recoge lo que haya en el cuadro de instrucción. No se limpia el
   * resultado anterior si el diálogo simplemente se reabre con los mismos
   * hechos: releer lo que ya se propuso es gratis y perderlo, no.
   */
  useEffect(() => {
    if (abierto) setTexto(hechos);
  }, [abierto, hechos]);

  /*
   * Al abrir, y al cambiar de rama, la casilla vuelve a lo que dijo quien abre.
   * Cambiar de rama en la barra de Redacción es una pregunta nueva, y la
   * respuesta anterior no vale para ella.
   */
  useEffect(() => {
    setSinRama(sinRamaInicial);
  }, [abierto, legalBranch, sinRamaInicial]);

  /**
   * @param forzarSinRama para el botón que reabre la búsqueda en todo el
   *        catálogo tras un «no reconozco nada». El estado de React se aplica
   *        después del render, así que leerlo aquí buscaría otra vez dentro de
   *        la misma rama y el abogado vería repetirse el mismo «no» — que es
   *        exactamente el defecto que ese botón existe para deshacer.
   */
  const orientar = async (forzarSinRama?: boolean) => {
    const enTodoElCatalogo = forzarSinRama ?? sinRama;
    const limpio = texto.trim();

    if (limpio.length < MINIMO) {
      setError('Cuente los hechos con algo más de detalle: quién, qué pasó y qué se busca.');
      return;
    }

    // Lo completado aquí vuelve al cuadro de instrucción: es el mismo texto con
    // el que después se redacta, y tenerlo que escribir dos veces sería absurdo.
    setHechos(texto);

    setCargando(true);
    setError(null);

    try {
      /*
       * SIN RAMA SE MANDA SIN RAMA, no con una vacía. `triageApi.orientar` deja
       * el campo fuera del cuerpo y el controlador ya sabía tratar su ausencia:
       * el menú se arma con el catálogo entero, y `findByDocumentType` recibe
       * la rama que devuelva el modelo, que es la única que hay.
       */
      const respuesta = await triageApi.orientar(
        limpio,
        enTodoElCatalogo ? undefined : (legalBranch as LegalBranch)
      );
      setResultado(respuesta);
    } catch (e) {
      /*
       * Se dice lo que dijo el servidor, sin inventar una causa. Los dos fallos
       * que el abogado puede resolver —sin saldo, plan vencido— vienen con su
       * mensaje escrito; taparlos con «no se pudo» le quitaría la salida.
       */
      setError(e instanceof Error ? e.message : 'No se pudo consultar el catálogo.');
      setResultado(null);
    } finally {
      setCargando(false);
    }
  };

  const sinCoincidencia = resultado?.status === 'SIN_COINCIDENCIA';
  const rama = BRANCH_LABELS[legalBranch] ?? legalBranch;

  return (
    <Dialog
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Que la guía proponga la actuación"
      subtitulo={
        sinRama
          ? 'Sobre los hechos que usted escriba, en todo el catálogo.'
          : `Sobre los hechos que usted escriba, y solo dentro de ${rama}.`
      }
      tamano="L"
      acciones={
        <>
          <button type="button" onClick={onEscribirNombre} className="btn-neutral">
            Escribir el nombre
          </button>
          {onSinNombre && (
            <button type="button" onClick={onSinNombre} className="btn-neutral">
              No sé cómo se llama
            </button>
          )}
          <button
            type="button"
            onClick={() => void orientar()}
            disabled={cargando}
            className="btn-primary"
          >
            {cargando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {resultado ? 'Volver a proponer' : 'Pedir la orientación'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="field-label" htmlFor="hechos-de-la-guia">
            Los hechos
          </label>
          <textarea
            id="hechos-de-la-guia"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Cuente qué pasó, a quién y qué se busca. En lenguaje corriente: no hace falta redactar."
            className="field-area min-h-[120px]"
          />
          <p className="mt-1 text-right font-mono text-[11px] text-ink-400">
            {texto.trim().length.toLocaleString('es-CO')} caracteres
          </p>
        </div>

        {/*
          «NO SÉ LA RAMA» VA JUNTO AL BOTÓN QUE LA USA, no en un ajuste aparte:
          la duda aparece al pulsar, no antes.
        */}
        <div className="rounded-card border border-line-200 bg-canvas px-3 py-2.5">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={sinRama}
              onChange={(e) => setSinRama(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[rgb(var(--brand-700))]"
            />
            <span className="min-w-0 text-ui leading-snug text-ink-900 [overflow-wrap:anywhere]">
              No sé la rama: buscar en todo el catálogo
            </span>
          </label>
          <p className="mt-1 flex items-start gap-1.5 pl-[22px] text-justify text-meta leading-snug text-ink-500 [text-wrap:pretty] [overflow-wrap:anywhere]">
            <Globe className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="min-w-0">
              {sinRama
                ? 'Se buscará en las 883 actuaciones de las 28 ramas y cada candidata dirá de cuál viene. Tarda más —entre diez y quince segundos, contra un par— y le cuesta a la plataforma unas cuatro veces más que buscar en una sola rama.'
                : `Ahora se busca solo en ${rama}. Si la rama no es esa, el catálogo dirá que no reconoce nada aunque la actuación exista en otra.`}
            </span>
          </p>
        </div>

        {/*
          LA ADVERTENCIA VA ANTES DE LAS PROPUESTAS, no debajo. Leída después de
          una lista de seis candidatas ya no cambia nada: quien llegó al final ya
          eligió.
        */}
        <p className="notice">
          <span className="text-justify [text-wrap:pretty]">
            Esto <b className="font-semibold">propone</b>, no determina de qué se trata el caso. Las
            candidatas salen del catálogo —nunca de lo que el modelo recuerde— y cada una viene con
            su ficha para que usted decida con el término y el artículo a la vista.
          </span>
        </p>

        {error && (
          <p className="rounded-card border border-[rgb(var(--danger-line))] bg-[rgb(var(--danger)/0.06)] px-3 py-2.5 text-ui text-danger">
            {error}
          </p>
        )}

        {resultado?.senales && resultado.senales.elementos.length > 0 && (
          <div className="rounded-card border border-line-200 bg-canvas px-3 py-2.5">
            <p className="field-label mb-1">Lo que el catálogo leyó de sus hechos</p>
            <div className="flex flex-wrap gap-1.5">
              {resultado.senales.elementos.map((e) => (
                <span key={e} className="rounded-full border border-line-200 bg-surface px-2 py-[2px] text-meta text-ink-700">
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        {resultado?.status === 'OK' && (
          <ul className="space-y-2">
            {resultado.suggestions.map(({ actuacion, razon }) => (
              <li
                key={actuacion.id}
                className="rounded-card border border-line-200 bg-surface px-3.5 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-ui font-semibold text-ink-900">{actuacion.exactName}</p>

                    {/*
                      ESTE DIALOGO ESTA ACOTADO A LA RAMA que el abogado ya
                      eligio —lo dice su propio subtitulo— y no pinta la rama de
                      cada candidata. Sin esta linea, una ficha que llega
                      prestada se leeria como propia de su rama, con su articulo
                      del CGP al lado, y el «nadie ha comprobado el termino» de
                      mas abajo parecería un hueco del catalogo en vez de lo que
                      es: un plazo verificado en otra rama.
                    */}
                    {/*
                      LA RAMA SOLO CUANDO SE BUSCÓ SIN ELLA. Dentro de una rama
                      elegida es un dato que todas comparten y que no distingue
                      nada; buscando en las veintiocho es la mitad de la
                      respuesta — dice ante quién y bajo qué código se surte.
                    */}
                    {sinRama && (
                      <p className="mt-1 flex items-start gap-1.5 text-meta leading-snug text-ink-500">
                        <Globe className="mt-0.5 h-3 w-3 shrink-0" />
                        <span className="min-w-0 [overflow-wrap:anywhere]">
                          {BRANCH_LABELS[actuacion.branch] ?? actuacion.branch}
                        </span>
                      </p>
                    )}

                    {actuacion.porRemision && (
                      <p className="mt-1 flex items-start gap-1.5 text-justify text-meta leading-snug text-ink-500 [text-wrap:pretty]">
                        <Link2 className="mt-0.5 h-3 w-3 shrink-0" />
                        {actuacion.porRemision.marca}
                      </p>
                    )}

                    {razon && (
                      <p className="mt-1 text-justify text-meta leading-snug text-ink-500 [text-wrap:pretty]">
                        {razon}
                      </p>
                    )}

                    <p className="mt-1.5 text-justify text-meta leading-snug text-ink-700 [text-wrap:pretty]">
                      {actuacion.legalBasis}
                    </p>

                    {actuacion.competentAuthority && (
                      <p className="mt-1 flex items-start gap-1.5 text-justify text-meta leading-snug text-ink-500 [text-wrap:pretty]">
                        <Landmark className="mt-0.5 h-3 w-3 shrink-0" />
                        {actuacion.competentAuthority}
                      </p>
                    )}

                    <p className="mt-1 flex items-start gap-1.5 text-justify text-meta leading-snug [text-wrap:pretty]">
                      {actuacion.term.status === 'NO_VERIFICADO' ? (
                        <>
                          <CircleDashed className="mt-0.5 h-3 w-3 shrink-0 text-unverified" />
                          <span className="text-unverified">
                            Nadie ha comprobado el término de esta actuación.
                          </span>
                        </>
                      ) : actuacion.term.status === 'NO_CADUCA' ? (
                        <>
                          <MinusCircle className="mt-0.5 h-3 w-3 shrink-0 text-neutral-fact" />
                          <span className="text-ink-700">{actuacion.term.description}</span>
                        </>
                      ) : (
                        <>
                          <CalendarClock className="mt-0.5 h-3 w-3 shrink-0 text-verified" />
                          <span className="text-ink-700">{actuacion.term.description}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onElegir(actuacion.exactName, actuacion.branch)}
                    className="btn-secondary btn-sm shrink-0"
                  >
                    Elegir esta
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {sinCoincidencia && (
          <div className="notice-unverified flex-col items-stretch">
            <p className="flex items-start gap-2 text-justify [text-wrap:pretty]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-unverified" />
              <span>
                {resultado?.reason ??
                  'El catálogo no reconoce una actuación para estos hechos dentro de esta rama.'}
              </span>
            </p>

            {resultado?.preguntas && resultado.preguntas.length > 0 && (
              <ul className="mt-2 space-y-1 pl-6">
                {resultado.preguntas.map((q) => (
                  <li key={q} className="text-justify text-meta leading-snug text-ink-700 [text-wrap:pretty]">
                    {q}
                  </li>
                ))}
              </ul>
            )}

            {/*
              LA SALIDA CUANDO EL CATÁLOGO CALLA. Es el mismo botón del pie, aquí
              otra vez porque este es el momento en que hace falta: quien acaba
              de leer «no reconozco ninguna» no debería tener que buscarla.
            */}
            {/*
              CUANDO SE BUSCÓ EN UNA SOLA RAMA, «no reconozco nada» puede ser la
              respuesta a la pregunta equivocada. Se ofrece repetir en todo el
              catálogo antes de mandar a nadie a escribir un nombre.
            */}
            {!sinRama && (
              <button
                type="button"
                onClick={() => {
                  setSinRama(true);
                  void orientar(true);
                }}
                className="btn-neutral mt-3 self-start"
              >
                Puede que la rama no sea esa: buscar en todo el catálogo
              </button>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={onEscribirNombre} className="btn-neutral">
                Ninguna de estas: escribir el nombre
              </button>
              {onSinNombre && (
                <button type="button" onClick={onSinNombre} className="btn-neutral">
                  No sé cómo se llama: describir qué debe lograr
                </button>
              )}
            </div>
          </div>
        )}

        {resultado && resultado.status !== 'OK' && !sinCoincidencia && (
          <p className="rounded-card border border-line-200 bg-canvas px-3 py-2.5 text-ui text-ink-700">
            {resultado.reason ?? 'La orientación no está disponible ahora mismo.'}
          </p>
        )}
      </div>
    </Dialog>
  );
};
