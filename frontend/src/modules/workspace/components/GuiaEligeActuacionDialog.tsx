import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarClock, CircleDashed, Landmark, Loader2, MinusCircle } from 'lucide-react';
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
 * ACOTADO A LA RAMA YA ELEGIDA. Quien está en «Laboral» no quiere que se le
 * proponga una tutela; y además el menú completo son unos 37.000 caracteres en
 * cada consulta, contra unos cientos por rama.
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
  /** Con el nombre exacto de la actuación elegida. Cierra el diálogo. */
  onElegir: (exactName: string) => void;
  /** «Ninguna de estas»: abre el diálogo para escribir el nombre. */
  onEscribirNombre: () => void;
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
  onEscribirNombre
}) => {
  const [texto, setTexto] = useState(hechos);
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

  const orientar = async () => {
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
      const respuesta = await triageApi.orientar(limpio, legalBranch as LegalBranch);
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
      subtitulo={`Sobre los hechos que usted escriba, y solo dentro de ${rama}.`}
      tamano="L"
      acciones={
        <>
          <button type="button" onClick={onEscribirNombre} className="btn-neutral">
            Escribir el nombre
          </button>
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
                    onClick={() => onElegir(actuacion.exactName)}
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
            <button type="button" onClick={onEscribirNombre} className="btn-neutral mt-3 self-start">
              Ninguna de estas: escribir el nombre
            </button>
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
