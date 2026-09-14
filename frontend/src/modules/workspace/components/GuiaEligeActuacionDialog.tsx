import React, { useEffect, useState } from 'react';
import { AlertTriangle, Globe, Landmark, Link2, Loader2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { triageApi, type TriageResponse } from '../../catalog/services/catalog.api';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import { esTituloDeTrabajo } from '../../catalog/tituloDeTrabajo';
import type { LegalBranch } from '../../catalog/types';
import { estadoDeLaFicha } from '../services/fichaEnLaLista';
import { EstadoDeLaFicha } from './SelectorEnCascada';

/**
 * «No sé cuál es: que la guía la proponga»: de los hechos a la actuación, sin
 * salir de Redacción. Artboard «No sé cómo se llama» (líneas 198–247 de
 * `public/handoff/app-redaccion-revision.html`), con el comportamiento real.
 *
 * ─── POR QUÉ ES UN PANEL Y NO UNA ELECCIÓN AUTOMÁTICA ───────────────────────
 *
 * El catálogo propone y nunca concluye. A un abogado joven al que se le dice
 * «esto es una tutela» se lo cree, y la actuación decide el artículo, el término
 * y la autoridad del escrito entero. Aquí se muestran las candidatas CON SU FICHA
 * a la vista y la elección la hace una persona.
 *
 * EL MODELO NO ESCRIBE DERECHO. Escoge de la lista cerrada del catálogo, y
 * cualquier nombre que no resuelva se descarta en el servidor. Lo que se lee
 * abajo es la ficha del catálogo, más la frase con la que el modelo justificó
 * proponerla.
 *
 * ACOTADO A LA RAMA YA ELEGIDA, SALVO QUE EL ABOGADO DIGA QUE NO LA SABE: con la
 * rama equivocada la plataforma respondería «no reconozco nada» sobre una
 * actuación que sí existe dos ramas más allá. Buscar en todo el catálogo tarda
 * entre diez y quince segundos y le cuesta a la casa unas cuatro veces más, y se
 * dice antes de pulsar.
 *
 * LOS HECHOS SON LOS QUE YA ESCRIBIÓ: se traen del cuadro de instrucción y se
 * devuelven al pedir la orientación.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · «Proponer · $300». La orientación desde Redacción es gratis diez veces al
 *   día y después se cobra del saldo; este diálogo no conoce el cupo de la firma,
 *   así que no afirma ningún precio. Si el servidor rechaza por saldo, su mensaje
 *   se muestra tal cual.
 * · El selector de rama dentro del diálogo. La rama se elige en la cascada, y
 *   dos selectores de la misma cosa en la misma pantalla se contradirían.
 * · «Registrar el hueco del catálogo». No existe ese flujo.
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
   * Con el nombre exacto de la actuación elegida. LA RAMA VIAJA CON EL NOMBRE:
   * buscando en todo el catálogo la candidata puede venir de una rama distinta,
   * y un nombre de escrito NO es único entre ramas.
   */
  onElegir: (exactName: string, branch: LegalBranch) => void;
  /** «No está en la lista: la escribo yo». */
  onEscribirNombre: () => void;
  /**
   * «Redactar sin actuación». Opcional porque no todos los llamadores redactan:
   * en la revisión de un documento recibido la guía sirve para RECONOCER qué le
   * llegó, y un escrito sin actuación no reconoce nada.
   */
  onSinNombre?: () => void;
  /** Con qué estado nace la casilla de «no sé la rama» (la revisión la pregunta antes). */
  sinRamaInicial?: boolean;
  /**
   * Qué pasó con la última consulta, para quien montó este diálogo: el «no
   * reconozco nada» no puede morir al cerrar. `null` cuando sí trajo candidatas.
   */
  onSinCoincidencia?: (info: { razon: string; enTodoElCatalogo: boolean } | null) => void;
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
  sinRamaInicial = false,
  onSinCoincidencia
}) => {
  const [texto, setTexto] = useState(hechos);
  /* ARRANCA CON LO QUE DIJO QUIEN ABRE: nadie que sepa la rama debería pagar la consulta completa por descuido. */
  const [sinRama, setSinRama] = useState(sinRamaInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<TriageResponse | null>(null);

  /* Al abrir se recoge lo que haya en el cuadro de instrucción; releer lo ya propuesto es gratis y perderlo, no. */
  useEffect(() => {
    if (abierto) setTexto(hechos);
  }, [abierto, hechos]);

  /* Cambiar de rama en la cascada es una pregunta nueva, y la respuesta anterior no vale para ella. */
  useEffect(() => {
    setSinRama(sinRamaInicial);
  }, [abierto, legalBranch, sinRamaInicial]);

  /**
   * @param forzarSinRama para el botón que reabre la búsqueda en todo el
   *        catálogo tras un «no reconozco nada»: el estado de React se aplica
   *        después del render, y leerlo aquí buscaría otra vez en la misma rama.
   */
  const orientar = async (forzarSinRama?: boolean) => {
    const enTodoElCatalogo = forzarSinRama ?? sinRama;
    const limpio = texto.trim();

    if (limpio.length < MINIMO) {
      setError('Cuente los hechos con algo más de detalle: quién, qué pasó y qué se busca.');
      return;
    }

    // Lo completado aquí vuelve al cuadro de instrucción: es el mismo texto con el que después se redacta.
    setHechos(texto);
    setCargando(true);
    setError(null);

    try {
      /* SIN RAMA SE MANDA SIN RAMA, no con una vacía: el servidor arma el menú con el catálogo entero. */
      const respuesta = await triageApi.orientar(limpio, enTodoElCatalogo ? undefined : (legalBranch as LegalBranch));
      setResultado(respuesta);
      /* LA RAZÓN QUE SE SACA ES LA DEL SERVIDOR, y solo si no la hay se dice lo único que consta. */
      onSinCoincidencia?.(
        respuesta.status === 'SIN_COINCIDENCIA'
          ? {
              razon:
                respuesta.reason ??
                (enTodoElCatalogo
                  ? 'El catálogo no reconoce una actuación para estos hechos en ninguna de sus ramas.'
                  : 'El catálogo no reconoce una actuación para estos hechos dentro de esta rama.'),
              enTodoElCatalogo
            }
          : null
      );
    } catch (e) {
      /* Se dice lo que dijo el servidor: sin saldo y plan vencido vienen con su mensaje escrito. */
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
      subtitulo={sinRama ? 'Sobre los hechos que usted escriba, en todo el catálogo.' : `Sobre los hechos que usted escriba, y solo dentro de ${rama}.`}
      tamano="L"
      acciones={
        <div className="cara-nueva cn-red-dlg-acciones">
          <button type="button" onClick={onEscribirNombre} className="cn-red-dlg-boton">
            No está en la lista: la escribo yo
          </button>
          {onSinNombre && (
            <button type="button" onClick={onSinNombre} className="cn-red-dlg-boton">
              Redactar sin actuación
            </button>
          )}
          <button type="button" onClick={() => void orientar()} disabled={cargando} className="cn-red-dlg-primario">
            {cargando && <Loader2 className="cn-red-dlg-svg animate-spin" aria-hidden />}
            {resultado ? 'Volver a proponer' : 'Pedir la orientación'}
          </button>
        </div>
      }
    >
      <div className="cara-nueva cn-red-dlg">
        <p className="cn-red-dlg-bajada">Cuente lo que pasó. La guía propone actuaciones del catálogo y usted reconoce la que es.</p>

        <div className="cn-red-dlg-campo">
          <label className="cn-red-dlg-rotulo" htmlFor="hechos-de-la-guia">
            Los hechos
          </label>
          <textarea
            id="hechos-de-la-guia"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Cuente qué pasó, a quién y qué se busca. En lenguaje corriente: no hace falta redactar."
            className="cn-red-dlg-area"
          />
          <p className="cn-red-dlg-contador">{texto.trim().length.toLocaleString('es-CO')} caracteres</p>
        </div>

        {/* «NO SÉ LA RAMA» VA JUNTO AL BOTÓN QUE LA USA: la duda aparece al pulsar, no antes. */}
        <label className="cn-red-dlg-casilla">
          <input type="checkbox" checked={sinRama} onChange={(e) => setSinRama(e.target.checked)} />
          <span className="cn-red-dlg-casilla-textos">
            <span className="cn-red-dlg-casilla-titulo">No sé la rama: buscar en todo el catálogo</span>
            <span className="cn-red-dlg-casilla-detalle">
              {sinRama
                ? 'Se buscará en todas las ramas y cada candidata dirá de cuál viene. Tarda más —entre diez y quince segundos, contra un par— y le cuesta a la plataforma unas cuatro veces más que buscar en una sola rama.'
                : `Ahora se busca solo en ${rama}. Si la rama no es esa, el catálogo dirá que no reconoce nada aunque la actuación exista en otra.`}
            </span>
          </span>
        </label>

        {/* LA ADVERTENCIA VA ANTES DE LAS PROPUESTAS: leída después de seis candidatas ya no cambia nada. */}
        <p className="cn-red-dlg-nota">
          La guía <b className="cn-red-cifra">propone, no determina</b>. Las candidatas salen del catálogo —nunca de lo que el modelo recuerde— y
          cada una viene con su ficha para que usted decida con el término y el artículo a la vista.
        </p>

        {error && <p className="cn-red-dlg-error">{error}</p>}

        {resultado?.senales && resultado.senales.elementos.length > 0 && (
          <div className="cn-red-dlg-campo">
            <p className="cn-red-dlg-seccion">Lo que el catálogo leyó de sus hechos</p>
            <div className="cn-red-dlg-chips">
              {resultado.senales.elementos.map((e) => (
                <span key={e} className="cn-red-dlg-chip">
                  {e}
                </span>
              ))}
            </div>
          </div>
        )}

        {resultado?.status === 'OK' && (
          <div className="cn-red-dlg-campo">
            <p className="cn-red-dlg-seccion">Lo que propone · usted reconoce la que es</p>
            <ul className="cn-red-dlg-candidatas">
              {resultado.suggestions.map(({ actuacion, razon }) => (
                <li key={actuacion.id} className="cn-red-dlg-candidata">
                  <div className="cn-red-dlg-candidata-cabeza">
                    <p className="cn-red-dlg-candidata-nombre">{actuacion.exactName}</p>
                    <EstadoDeLaFicha estado={estadoDeLaFicha(actuacion, esTituloDeTrabajo(actuacion.exactName))} />
                  </div>

                  {/* LA RAMA SOLO CUANDO SE BUSCÓ SIN ELLA: dentro de una rama no distingue nada. */}
                  {sinRama && (
                    <p className="cn-red-dlg-linea cn-red-dlg-linea--tenue">
                      <Globe className="cn-red-dlg-linea-svg" aria-hidden />
                      {BRANCH_LABELS[actuacion.branch] ?? actuacion.branch}
                    </p>
                  )}

                  {actuacion.porRemision && (
                    <p className="cn-red-dlg-linea cn-red-dlg-linea--tenue">
                      <Link2 className="cn-red-dlg-linea-svg" aria-hidden />
                      {actuacion.porRemision.marca}
                    </p>
                  )}

                  {razon && <p className="cn-red-dlg-linea">{razon}</p>}

                  <p className="cn-red-dlg-linea cn-red-dlg-linea--tenue">{actuacion.legalBasis}</p>

                  {actuacion.competentAuthority && (
                    <p className="cn-red-dlg-linea cn-red-dlg-linea--tenue">
                      <Landmark className="cn-red-dlg-linea-svg" aria-hidden />
                      {actuacion.competentAuthority}
                    </p>
                  )}

                  {actuacion.term.status === 'NO_VERIFICADO' ? (
                    <p className="cn-red-dlg-linea cn-red-dlg-linea--sin">Nadie ha comprobado el término de esta actuación.</p>
                  ) : (
                    <p className="cn-red-dlg-linea">
                      <b className="cn-red-cifra">{actuacion.term.status === 'NO_CADUCA' ? 'No caduca. ' : 'Término. '}</b>
                      {actuacion.term.description}
                    </p>
                  )}

                  <button type="button" onClick={() => onElegir(actuacion.exactName, actuacion.branch)} className="cn-red-dlg-elegir">
                    Elegir esta
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {sinCoincidencia && (
          <div className="cn-red-dlg-aviso cn-red-dlg-aviso--sin">
            <p className="cn-red-dlg-aviso-texto">
              <AlertTriangle className="cn-red-dlg-linea-svg" aria-hidden />
              <span>{resultado?.reason ?? 'El catálogo no reconoce una actuación para estos hechos dentro de esta rama.'}</span>
            </p>

            {resultado?.preguntas && resultado.preguntas.length > 0 && (
              <ul className="cn-red-dlg-preguntas">
                {resultado.preguntas.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            )}

            {/* CUANDO SE BUSCÓ EN UNA SOLA RAMA, «no reconozco nada» puede ser la respuesta a la pregunta equivocada. */}
            <div className="cn-red-dlg-fila">
              {!sinRama && (
                <button
                  type="button"
                  onClick={() => {
                    setSinRama(true);
                    void orientar(true);
                  }}
                  className="cn-red-dlg-elegir"
                >
                  Puede que la rama no sea esa: buscar en todo el catálogo
                </button>
              )}
              <button type="button" onClick={onEscribirNombre} className="cn-red-dlg-boton">
                No está en la lista: la escribo yo
              </button>
              {onSinNombre && (
                <button type="button" onClick={onSinNombre} className="cn-red-dlg-boton">
                  Redactar sin actuación
                </button>
              )}
            </div>
          </div>
        )}

        {resultado && resultado.status !== 'OK' && !sinCoincidencia && (
          <p className="cn-red-dlg-nota">{resultado.reason ?? 'La orientación no está disponible ahora mismo.'}</p>
        )}
      </div>
    </Dialog>
  );
};
