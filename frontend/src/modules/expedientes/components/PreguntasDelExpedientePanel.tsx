import React from 'react';
import { AlertCircle, Check, Copy, Download, FolderOpen, Gavel, Loader2, Maximize2, Trash2 } from 'lucide-react';
import { ConfirmarDialog, type Confirmacion } from '../../../design/ConfirmarDialog';
import { useFuncionHabilitada } from '../../subscriptions/PlanContext';
import { AVISO_FUNCION_DESHABILITADA } from '../../subscriptions/types';
import { pesos } from '../../billing/recargaEnPantalla';
import { expedientesApi } from '../services/expedientes.api';
import { PISO_INTERROGATORIO_COP, SUPLEMENTO_POR_PERSONA_COP, pisoDeLaTanda } from '../services/precioDelInterrogatorio';
import {
  exportarPreguntasAPdf,
  exportarPreguntasAWord,
  preguntasComoTexto,
  type ContextoDelInterrogatorio
} from '../services/preguntasExport.service';
import {
  MAX_PERSONAS_POR_TANDA,
  SE_LE_PREGUNTA,
  SIN_CON_QUE,
  interrogatoriosMasNuevoPrimero,
  type ExpedienteConDetalle,
  type InterrogatorioEnLaLista,
  type PreguntasDelExpediente
} from '../types';
import { LecturaAmpliaDelInforme } from '../../workspace/components/LecturaAmpliaDelInforme';
import { LeerDocumentoIndexado } from './LeerDocumentoIndexado';

/**
 * EL INTERROGATORIO, PERSONA POR PERSONA — Y SE QUEDA EN EL EXPEDIENTE.
 *
 * ─── LO QUE ESTA PANTALLA HACE DISTINTO ────────────────────────────────────
 *
 * Las preguntas de audiencia vivían en el taller de revisión y salían de un
 * escrito, en tres cajones fijos: la contraparte, mis testigos, los testigos de
 * la contraparte. Su propio prompt lo decía — «no conoces el expediente, las
 * pruebas, a las partes ni a los testigos»— y por eso sobre un documento
 * recibido la pestaña ni se ofrecía. Ese camino se retiró: éste es su relevo.
 *
 * Aquí se escoge GENTE. La técnica de cada lista la decide el servidor a
 * partir de lo que el abogado ya registró: al propio se le interroga con
 * abiertas, al de enfrente se le contrainterroga con cerradas, al perito se le
 * va por el método. Y por eso funciona igual venga o no de un escrito.
 *
 * ─── LO QUE SE PAGÓ SE QUEDA (16 de septiembre de 2026) ────────────────────
 *
 * Hasta hoy el resultado vivía solo en el estado de este componente: recargar
 * la página lo perdía y el abogado tenía que volver a pagarlo para leer lo que
 * ya había comprado. Ahora cada tanda se guarda en el expediente y se lista
 * arriba, con su fecha, quién la preparó y a quién cubre. «Abrir» la trae del
 * servidor SIN cobrar — no hay un solo POST en ese camino—, y se conservan
 * todas, la más nueva primero: probar dos enfoques para la misma audiencia es
 * trabajo normal, y quedarse solo con el último obligaría a repagar el primero.
 *
 * ─── Y AHORA SE ANTICIPA LA RESPUESTA ──────────────────────────────────────
 *
 * Bajo cada pregunta va lo que esa persona contestará probablemente, la
 * repregunta con la que se sigue si lo hace, y CON QUÉ del expediente se la
 * contradice: el documento y la cita literal. Esa cita la comprobó el servidor
 * contra los pasajes del caso —si no la encontró, la tiró—, así que lo que aquí
 * se lee no hay que volver a dudarlo. Cuando no hay nada con qué, se DICE; un
 * hueco en blanco se lee como «todavía no carga», y con eso el abogado entra a
 * la audiencia creyendo que existe un papel que no existe.
 *
 * ─── ESTO CUESTA SALDO, Y SE DICE ANTES ────────────────────────────────────
 *
 * El aviso del cobro va arriba del botón, no debajo. Un cobro que se descubre
 * después de pulsar es un cobro que el abogado no autorizó. Lo de la lista, en
 * cambio, ya está pagado y se dice también: abrir no vuelve a cobrar.
 *
 * ─── Y SE LLEVA EN LA MANO ─────────────────────────────────────────────────
 *
 * Copiar, Word y PDF, con la respuesta probable, la repregunta y el «con qué»
 * dentro: a una audiencia se entra con la hoja impresa, no con una pestaña
 * abierta, y una hoja con la pregunta y sin lo que va a contestar deja al
 * colega sin la mitad que preparó.
 */

/** La fecha de una tanda, corta y con hora: en un día se preparan varias. */
const cuando = (iso: string): string =>
  new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

/** A quién cubre la tanda, sin dejar la línea colgando si la lista viniera vacía. */
const aQuienCubre = (personas: readonly string[]): string =>
  personas.length > 0 ? personas.join(', ') : 'Sin personas registradas';

/** Lo que hay abierto en el papel de abajo: una tanda nueva o una guardada. */
interface Abierto {
  /** `null` cuando acaba de prepararse y el servidor no la pudo guardar. */
  id: string | null;
  preguntas: PreguntasDelExpediente;
  queSeQueriaProbar: string;
  audiencia: string;
}

/**
 * LA TÉCNICA VIENE DEL SERVIDOR COMO «NOMBRE: la regla entera».
 *
 * Se parte por el primer dos puntos para pintar el nombre como etiqueta y la
 * regla debajo. Si algún día llegara sin dos puntos, la etiqueta se queda con
 * el texto completo y el detalle desaparece: se prefiere una etiqueta larga a
 * una pantalla que pierde la técnica por una coma.
 */
interface ListaDeTurnosProps {
  preguntas: PreguntasDelExpediente;
  /** Si hubo pasajes del caso que mirar: sin ellos no se afirma que no hay con qué. */
  conMaterial: boolean;
  documentosPorTitulo: Map<string, string> | null;
  onLeerDocumento: (documentId: string) => void;
}

/**
 * LAS PREGUNTAS, UNA SOLA VEZ Y EN UN SOLO SITIO.
 *
 * Se saca a su propio componente porque se pinta en DOS lugares —dentro del
 * panel y en «Leer en grande»— y dos copias del mismo marcado divergen: la
 * primera vez que alguien arregle un turno en una sola, el interrogatorio
 * impreso y el de pantalla dejarán de decir lo mismo sin que nada falle.
 */
const ListaDeTurnos: React.FC<ListaDeTurnosProps> = ({ preguntas, conMaterial, documentosPorTitulo, onLeerDocumento }) => (
    <>
      {preguntas.porPersona.map((persona) => (
            <div key={persona.actorId} className="cn-int-persona">
              <h3 className="cn-int-nombre">{persona.nombre}</h3>
              {/*
                LA TÉCNICA SE MUESTRA, y no es adorno. Un abogado que ve
                «contrainterrogatorio: cerradas, una afirmación por pregunta»
                entiende por qué esa lista no se parece a la de al lado, y puede
                corregir el lado del actor si el sistema se equivocó.

                SE PARTE EN DOS PORQUE SE LEE EN DOS MOMENTOS: el nombre de la
                técnica se mira de reojo en plena audiencia; la regla que la
                explica se lee una vez, preparando. Es un corte de presentación
                sobre el mismo texto del servidor, no un texto distinto.
              */}
              <p>
                <span className="cn-int-tecnica">{tituloDeLaTecnica(persona.tecnica)}</span>
              </p>
              {detalleDeLaTecnica(persona.tecnica) && (
                <p className="cn-int-tecnica-detalle">{detalleDeLaTecnica(persona.tecnica)}</p>
              )}
              <ol className="cn-int-preguntas">
                {persona.preguntas.map((p, i) => {
                  const documentId = p.conQue ? (documentosPorTitulo?.get(p.conQue.documento) ?? null) : null;
                  return (
                    <li key={i} className="cn-int-pregunta">
                      {/*
                        CADA TURNO DICE DE QUIÉN ES. «Usted pregunta» y el nombre
                        del declarante son la única orientación que el abogado
                        necesita leyendo a saltos mientras el testigo habla.
                      */}
                      <div className="cn-int-turno">
                        <span className="cn-int-quien">Usted pregunta</span>
                        <p className="cn-int-dicho">
                          <span className="cn-int-numero">{i + 1}</span>
                          {p.pregunta}
                        </p>
                      </div>
                      {p.paraQue && <p className="cn-int-apunte">Para: {p.paraQue}</p>}
                      {p.delMaterial && <p className="cn-int-apunte">Del material: «{p.delMaterial}»</p>}
                      {p.respuestaProbable && (
                        <div className="cn-int-turno">
                          {/*
                            EL NOMBRE, Y NO «PROBABLEMENTE CONTESTE». Con dos o
                            tres personas preparadas en la misma pantalla, el
                            rótulo genérico obligaba a subir hasta la cabecera
                            para saber quién contestaba eso.
                          */}
                          <span className="cn-int-quien">{persona.nombre} probablemente</span>
                          <p className="cn-int-dicho cn-int-dicho--probable">{p.respuestaProbable}</p>
                        </div>
                      )}
                      {p.repregunta && (
                        <div className="cn-int-turno">
                          <span className="cn-int-quien">Usted repregunta</span>
                          <p className="cn-int-dicho">{p.repregunta}</p>
                        </div>
                      )}
                      {p.conQue ? (
                        <div className="cn-int-turno">
                          <span className="cn-int-quien">Con qué</span>
                          <p className="cn-int-dicho cn-int-dicho--cita">
                            {documentId ? (
                              <button
                                type="button"
                                className="cn-exp-conque-doc"
                                onClick={() => onLeerDocumento(documentId)}
                              >
                                {p.conQue.documento}
                              </button>
                            ) : (
                              <span>{p.conQue.documento}</span>
                            )}{' '}
                            — <span className="cn-exp-mono">«{p.conQue.cita}»</span>
                          </p>
                        </div>
                      ) : (
                        /*
                          Solo cuando hubo pasajes que mirar. Sin ellos esta
                          frase sería un hallazgo sobre documentos que nadie
                          leyó: ver `conMaterial`.
                        */
                        conMaterial && <p className="cn-int-apunte">{SIN_CON_QUE}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
      ))}
    </>
);

export const tituloDeLaTecnica = (tecnica: string): string => {
  const corte = tecnica.indexOf(':');
  return corte > 0 ? tecnica.slice(0, corte).trim() : tecnica.trim();
};

export const detalleDeLaTecnica = (tecnica: string): string => {
  const corte = tecnica.indexOf(':');
  return corte > 0 ? tecnica.slice(corte + 1).trim() : '';
};

export const PreguntasDelExpedientePanel: React.FC<{ expediente: ExpedienteConDetalle }> = ({
  expediente
}) => {
  const interrogables = expediente.listaDeActores.filter((a) => SE_LE_PREGUNTA.includes(a.papel));

  const [escogidos, setEscogidos] = React.useState<string[]>([]);
  const [quiereProbar, setQuiereProbar] = React.useState('');
  const [audiencia, setAudiencia] = React.useState('');
  const [pidiendo, setPidiendo] = React.useState(false);
  const [error, setError] = React.useState('');
  const [abierto, setAbierto] = React.useState<Abierto | null>(null);
  const [copiado, setCopiado] = React.useState(false);

  /* `null` = todavía no se ha leído la lista. Vacía = leída y sin tandas. */
  const [guardados, setGuardados] = React.useState<InterrogatorioEnLaLista[] | null>(null);
  const [errorLista, setErrorLista] = React.useState('');
  const [abriendo, setAbriendo] = React.useState<string | null>(null);
  const [porBorrar, setPorBorrar] = React.useState<InterrogatorioEnLaLista | null>(null);
  /* La tanda recién preparada que el servidor NO pudo guardar. Se dice. */
  const [noSeGuardo, setNoSeGuardo] = React.useState(false);

  /*
   * EL DOCUMENTO DE UNA CITA SE ABRE SI SE PUEDE IDENTIFICAR, Y NO SE FINGE.
   * La tanda guarda el NOMBRE del documento, no su identificador: es lo que el
   * motor leyó. Para abrirlo hace falta casar ese nombre con los documentos que
   * el expediente tiene hoy, y puede no casar —lo renombraron, lo quitaron—. En
   * ese caso el nombre se queda como texto: un botón que abre el documento
   * equivocado es peor que ninguno, porque el colega lo lee en voz alta.
   */
  const [documentosPorTitulo, setDocumentosPorTitulo] = React.useState<Map<string, string> | null>(null);
  const [leyendo, setLeyendo] = React.useState<string | null>(null);
  /* «Leer en grande»: el mismo diálogo del taller, con las preguntas y sin nada más. */
  const [lecturaAmplia, setLecturaAmplia] = React.useState(false);

  const habilitado = useFuncionHabilitada('EXPEDIENTES.PREGUNTAS_AUDIENCIA');

  /*
   * LA LISTA SE LEE AL ABRIR EL CASO, no al pulsar nada. Es la mitad visible de
   * la promesa: quien recarga la página tiene que VER que su interrogatorio
   * sigue ahí, sin buscarlo.
   */
  React.useEffect(() => {
    let vigente = true;
    setGuardados(null);
    setErrorLista('');
    setAbierto(null);
    setNoSeGuardo(false);
    void expedientesApi
      .interrogatorios(expediente.id)
      .then((lista) => {
        if (vigente) setGuardados(interrogatoriosMasNuevoPrimero(lista));
      })
      .catch((err: unknown) => {
        if (!vigente) return;
        /*
         * UN FALLO NO SE PINTA COMO «NO HAY NINGUNO». Son cosas distintas, y
         * confundirlas le dice al abogado que perdió lo que pagó.
         */
        setGuardados([]);
        setErrorLista(err instanceof Error ? err.message : 'No se pudieron leer los interrogatorios preparados.');
      });
    return () => {
      vigente = false;
    };
  }, [expediente.id]);

  /* Los documentos del caso, una sola vez y solo cuando hay una cita que abrir. */
  const hayCitas = (abierto?.preguntas.porPersona ?? []).some((p) => p.preguntas.some((q) => q.conQue));
  React.useEffect(() => {
    if (!hayCitas || documentosPorTitulo !== null) return;
    let vigente = true;
    void expedientesApi
      .documentos(expediente.id)
      .then((docs) => {
        if (vigente) setDocumentosPorTitulo(new Map(docs.map((d) => [d.titulo, d.documentId])));
      })
      /* Sin la lista, las citas se quedan como texto. Nada más se pierde. */
      .catch(() => {
        if (vigente) setDocumentosPorTitulo(new Map());
      });
    return () => {
      vigente = false;
    };
  }, [hayCitas, documentosPorTitulo, expediente.id]);

  /*
   * EL ENCABEZADO DE LA HOJA SALE DE LA TANDA ABIERTA, NO DEL FORMULARIO. Al
   * reabrir una de hace tres días, los campos de arriba tienen lo que alguien
   * esté tecleando ahora: imprimir la hoja con ese texto le pondría a un
   * interrogatorio viejo un encargo que no es el suyo.
   */
  const contexto: ContextoDelInterrogatorio = {
    caratula: expediente.caratula,
    radicado: expediente.radicado,
    ...(abierto?.queSeQueriaProbar.trim() ? { quiereProbar: abierto.queSeQueriaProbar.trim() } : {}),
    ...(abierto?.audiencia.trim() ? { audiencia: abierto.audiencia.trim() } : {})
  };

  const copiar = async (r: PreguntasDelExpediente): Promise<void> => {
    try {
      await navigator.clipboard.writeText(preguntasComoTexto(contexto, r));
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError('No se pudo copiar al portapapeles.');
    }
  };

  /* Un fallo al exportar se dice donde ya se dicen los demás errores, no en un diálogo del navegador. */
  const descargar = (formato: 'word' | 'pdf', r: PreguntasDelExpediente): void => {
    const exportar = formato === 'word' ? exportarPreguntasAWord : exportarPreguntasAPdf;
    void exportar(contexto, r).catch((err: unknown) =>
      setError(err instanceof Error ? err.message : `No se pudo descargar en ${formato === 'word' ? 'Word' : 'PDF'}.`)
    );
  };

  const alternar = (id: string): void => {
    setEscogidos((antes) =>
      antes.includes(id) ? antes.filter((x) => x !== id) : [...antes, id].slice(0, MAX_PERSONAS_POR_TANDA)
    );
  };

  const pedir = async (): Promise<void> => {
    setPidiendo(true);
    setError('');
    setNoSeGuardo(false);
    try {
      const r = await expedientesApi.preguntas(expediente.id, {
        actorIds: escogidos,
        quiereProbar: quiereProbar || undefined,
        audiencia: audiencia || undefined
      });
      setAbierto({
        id: r.guardado?.id ?? null,
        preguntas: r.preguntas,
        queSeQueriaProbar: quiereProbar,
        audiencia
      });
      if (r.guardado) {
        const ficha = r.guardado;
        setGuardados((antes) => interrogatoriosMasNuevoPrimero([ficha, ...(antes ?? [])]));
      } else {
        setNoSeGuardo(true);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPidiendo(false);
    }
  };

  /* ABRIR NO COBRA: es un GET de lo que ya se pagó. */
  const abrir = async (ficha: InterrogatorioEnLaLista): Promise<void> => {
    setAbriendo(ficha.id);
    setError('');
    setNoSeGuardo(false);
    try {
      const t = await expedientesApi.abrirInterrogatorio(expediente.id, ficha.id);
      setAbierto({
        id: t.id,
        preguntas: t.preguntas,
        queSeQueriaProbar: t.queSeQueriaProbar ?? '',
        audiencia: t.audiencia ?? ''
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAbriendo(null);
    }
  };

  const confirmacionDeBorrado: Confirmacion | null = porBorrar
    ? {
        titulo: 'Eliminar este interrogatorio',
        texto: (
          /*
           * DOS PÁRRAFOS Y NO UNO, por la fecha: en castellano de Colombia la
           * hora termina en «a. m.» y rematarla con el punto de la frase daba
           * «09:20 a. m..». Se ve descuidado justo en el diálogo que pide
           * confianza para borrar algo que no vuelve.
           */
          <div className="grid gap-2">
            <p className="text-body [text-wrap:pretty]">
              Se eliminará el interrogatorio de{' '}
              <span className="font-medium">{aQuienCubre(porBorrar.personas)}</span>, preparado el{' '}
              {cuando(porBorrar.creadoEl)}
            </p>
            <p className="text-body [text-wrap:pretty]">
              Para volver a tenerlo habría que prepararlo otra vez, y eso consume saldo de la firma.{' '}
              <span className="font-medium">Esto no se deshace.</span>
            </p>
          </div>
        ),
        etiqueta: 'Eliminar',
        peligro: true,
        onConfirmar: async () => {
          try {
            await expedientesApi.borrarInterrogatorio(expediente.id, porBorrar.id);
            setGuardados((antes) => (antes ?? []).filter((x) => x.id !== porBorrar.id));
            /* Si era el que estaba abierto abajo, se cierra: ya no existe. */
            setAbierto((a) => (a && a.id === porBorrar.id ? null : a));
          } catch (err) {
            setError((err as Error).message);
          }
        }
      }
    : null;

  if (interrogables.length === 0) {
    return (
      <section className="cn-exp-panel cn-exp-piel">
        <h2 className="cn-exp-h3">Preparar el interrogatorio</h2>
        <p className="mt-1 text-meta text-ink-500">
          Agregue arriba a las partes, los testigos o el perito —con su lado y sobre qué declaran— y desde
          aquí se prepara el interrogatorio de cada uno. Al juez, al secretario, a los apoderados y al
          intérprete no se les pregunta, así que no cuentan para esto.
        </p>
      </section>
    );
  }

  const tope = escogidos.length >= MAX_PERSONAS_POR_TANDA;
  const conMaterial = abierto?.preguntas.conMaterial === true;

  return (
    <section className="cn-exp-panel cn-exp-piel">
      <h2 className="cn-exp-h3">Preparar el interrogatorio</h2>
      <p className="mt-1 text-meta text-ink-500">
        Escoja a quién va a interrogar. La técnica la pone el sistema según lo que cada persona sea en el
        proceso y de qué lado esté.
      </p>

      {/*
        ─── LO QUE YA ESTÁ PAGADO, ANTES DE OFRECER PAGAR OTRO ─────────────
        La lista va arriba del formulario a propósito: quien vuelve al caso
        viene a leer lo que preparó, no a prepararlo otra vez.
      */}
      {guardados !== null && (guardados.length > 0 || errorLista) && (
        <div className="cn-exp-interrogatorios">
          <h3 className="cn-exp-rotulo">Interrogatorios preparados</h3>
          {errorLista && (
            <p className="mt-1 flex items-start gap-2 text-meta text-ink-700">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="[overflow-wrap:anywhere]">{errorLista}</span>
            </p>
          )}
          <ul className="cn-exp-interrogatorios-lista">
            {guardados.map((g) => (
              <li key={g.id} className="cn-exp-interrogatorio">
                <div className="min-w-0">
                  <p className="text-body font-medium [overflow-wrap:anywhere]">{aQuienCubre(g.personas)}</p>
                  <p className="text-meta text-ink-500 [overflow-wrap:anywhere]">
                    {cuando(g.creadoEl)} · {g.creadoPor}
                    {g.audiencia ? ` · ${g.audiencia}` : ''}
                  </p>
                </div>
                <div className="cn-exp-interrogatorio-acciones">
                  <button
                    type="button"
                    onClick={() => void abrir(g)}
                    className="btn-neutral btn-sm gap-1.5"
                    disabled={abriendo !== null}
                    /* Se dice en el botón, no en una nota al pie: es la duda que frena la mano. */
                    title="Abrir este interrogatorio sin volver a pagarlo"
                  >
                    {abriendo === g.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FolderOpen className="h-3.5 w-3.5" />
                    )}
                    Abrir
                  </button>
                  <button
                    type="button"
                    onClick={() => setPorBorrar(g)}
                    className="btn-ghost btn-sm gap-1.5"
                    aria-label={`Eliminar el interrogatorio del ${cuando(g.creadoEl)}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-meta text-ink-500 [text-wrap:pretty]">
            Abrir uno de estos no consume saldo: ya se pagó cuando se preparó.
          </p>
        </div>
      )}

      <fieldset className="mt-3">
        <legend className="cn-exp-rotulo">A quién</legend>
        <ul className="space-y-1.5">
          {interrogables.map((a) => {
            const marcado = escogidos.includes(a.id);
            return (
              <li key={a.id}>
                <label className="flex items-start gap-2 text-body">
                  <input
                    type="checkbox"
                    className="mt-1 shrink-0"
                    checked={marcado}
                    /* El tope no oculta a nadie: deshabilita lo que no cabe y lo explica. */
                    disabled={!marcado && tope}
                    onChange={() => alternar(a.id)}
                  />
                  <span className="min-w-0">
                    <span className="font-medium [overflow-wrap:anywhere]">{a.nombre}</span>
                    {a.sobreQue && (
                      <span className="block text-meta text-ink-500 [overflow-wrap:anywhere]">
                        {a.sobreQue}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        {tope && (
          <p className="mt-1.5 text-meta text-ink-500">
            {MAX_PERSONAS_POR_TANDA} personas por tanda. Con más, la última lista saldría cortada: pida otra
            tanda para los demás.
          </p>
        )}
      </fieldset>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="cn-exp-rotulo" htmlFor="que-probar">
            Qué quiere probar <span className="cn-exp-opcional">(opcional)</span>
          </label>
          <input
            id="que-probar"
            className="cn-exp-entrada"
            value={quiereProbar}
            onChange={(e) => setQuiereProbar(e.target.value)}
            placeholder="que el inmueble se entregó en mal estado"
          />
        </div>
        <div>
          <label className="cn-exp-rotulo" htmlFor="tipo-audiencia">
            Tipo de audiencia <span className="cn-exp-opcional">(opcional)</span>
          </label>
          <input
            id="tipo-audiencia"
            className="cn-exp-entrada"
            value={audiencia}
            onChange={(e) => setAudiencia(e.target.value)}
            placeholder="audiencia inicial"
          />
        </div>
      </div>

      {/*
        EL AVISO DEL COBRO VA ARRIBA DEL BOTÓN, no debajo, Y CON LA CIFRA. Decir
        «consume saldo» sin decir cuánto obliga a pulsar para averiguarlo, que
        es justo lo que nadie hace con el saldo de la firma. Con personas
        escogidas se dice lo que cuesta ESTA tanda; sin ninguna, la tarifa.
      */}
      <p className="mt-3 text-meta text-ink-500">
        {escogidos.length > 0
          ? `Esta tanda cuesta desde ${pesos(pisoDeLaTanda(escogidos.length))} del saldo de la firma`
          : `Preparar un interrogatorio cuesta desde ${pesos(PISO_INTERROGATORIO_COP)} del saldo de la firma, más ${pesos(
              SUPLEMENTO_POR_PERSONA_COP
            )} por cada persona adicional`}
        . Se cobra una vez por tanda: queda guardada en el expediente y se puede volver a abrir sin
        pagar. Si la tanda resulta más larga de lo que cubre ese piso, se cobra lo que costó.
      </p>

      {!habilitado && (
        <p className="notice mt-1.5 text-meta [text-wrap:pretty] [overflow-wrap:anywhere]">
          {AVISO_FUNCION_DESHABILITADA}
        </p>
      )}

      <button
        type="button"
        onClick={() => void pedir()}
        className="btn-primary btn-sm mt-1.5 gap-1.5"
        disabled={pidiendo || escogidos.length === 0 || !habilitado}
      >
        {pidiendo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Gavel className="h-3.5 w-3.5" />}
        {pidiendo
          ? 'Preparando el interrogatorio…'
          : escogidos.length === 0
            ? 'Escoja al menos a una persona'
            : `Preparar para ${escogidos.length} ${escogidos.length === 1 ? 'persona' : 'personas'} · desde ${pesos(
                pisoDeLaTanda(escogidos.length)
              )}`}
      </button>

      {error && (
        <p className="mt-2 flex items-start gap-2 text-meta text-ink-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="[overflow-wrap:anywhere]">{error}</span>
        </p>
      )}

      {abierto && (
        <div className="mt-4 space-y-4">
          {/*
            NO SE CALLA QUE NO SE PUDO GUARDAR. Si el abogado cierra la pestaña
            creyendo que quedó archivado, vuelve y no lo encuentra: eso se
            parece demasiado a haber pagado dos veces.
          */}
          {noSeGuardo && (
            <p className="notice text-meta [text-wrap:pretty]">
              Este interrogatorio se preparó y se cobró, pero no se pudo guardar en el expediente: no
              aparecerá en la lista de arriba. Descárguelo o cópielo antes de cerrar esta pantalla.
            </p>
          )}

          {/*
            UNA LISTA RECORTADA SE LEE IGUAL QUE UNA LISTA CORTA. Si la
            respuesta del motor llegó cortada, lo que hay sirve —son preguntas
            completas— pero faltan las últimas, y nadie debería descubrirlo en
            la audiencia. Se dice aquí, junto a las preguntas, no en una nota al
            pie.
          */}
          {abierto.preguntas.recortado && (
            <p className="notice text-meta [text-wrap:pretty]">
              Esta lista quedó recortada: el interrogatorio salió más largo de lo que cabía en una
              tanda y las últimas preguntas no llegaron. Las que ve están completas. Si necesita más,
              prepare otra tanda con menos personas.
            </p>
          )}

          {/*
            LLEVARSE EL INTERROGATORIO: Word para seguir trabajándolo, PDF para
            imprimirlo. Los dos salen con la letra del membrete de la firma y
            sin bloque de firma — es material de trabajo, no se radica.
          */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => void copiar(abierto.preguntas)}
              className="btn-neutral btn-sm gap-1.5"
              title="Copiar el interrogatorio completo como texto"
            >
              {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
            <button
              type="button"
              onClick={() => descargar('word', abierto.preguntas)}
              className="btn-neutral btn-sm gap-1.5"
              title="Descargar en Word para seguir trabajándolo"
            >
              <Download className="h-3.5 w-3.5" />
              Word
            </button>
            <button
              type="button"
              onClick={() => descargar('pdf', abierto.preguntas)}
              className="btn-neutral btn-sm gap-1.5"
              title="Descargar en PDF para llevarlo impreso a la audiencia"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
            {/*
              LEER SIN LA PANTALLA DETRÁS. El interrogatorio se repasa entero
              minutos antes de la audiencia, y en el panel convive con el
              formulario de pedir otro, la lista de los ya preparados y el resto
              del expediente. Es el mismo diálogo del taller, por la misma razón
              y con el mismo nombre: quien ya lo usó allí no aprende otro.
            */}
            <button
              type="button"
              onClick={() => setLecturaAmplia(true)}
              className="btn-neutral btn-sm gap-1.5"
              title="Leer el interrogatorio a pantalla completa, sin el resto de la pantalla"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Leer en grande
            </button>
          </div>
          {abierto.preguntas.enfoque && (
            <p className="rounded-card border border-line-200 bg-canvas p-3 text-meta text-ink-700 [overflow-wrap:anywhere]">
              {abierto.preguntas.enfoque}
            </p>
          )}
          <ListaDeTurnos
            preguntas={abierto.preguntas}
            conMaterial={conMaterial}
            documentosPorTitulo={documentosPorTitulo}
            onLeerDocumento={setLeyendo}
          />
        </div>
      )}

      {/*
        SE MONTA AQUÍ, con los demás diálogos del panel y no dentro de la zona
        de la tanda, para que leer un documento del «con qué» ENCIMA de la
        lectura amplia lo resuelva el mismo apilado que en el taller. Cuelga de
        `abierto` porque sin tanda abierta no hay nada que leer.
      */}
      {abierto && (
        <LecturaAmpliaDelInforme
          abierto={lecturaAmplia}
          onCerrar={() => setLecturaAmplia(false)}
          titulo="Interrogatorio"
          detalle={[aQuienCubre(abierto.preguntas.porPersona.map((p) => p.nombre)), expediente.caratula]
            .filter(Boolean)
            .join(' · ')}
          acciones={
            <>
              <button
                type="button"
                onClick={() => void copiar(abierto.preguntas)}
                className="btn-neutral btn-sm gap-1.5"
                title="Copiar el interrogatorio completo como texto"
              >
                {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiado ? 'Copiado' : 'Copiar'}
              </button>
              <button type="button" onClick={() => descargar('word', abierto.preguntas)} className="btn-neutral btn-sm gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Word
              </button>
              <button type="button" onClick={() => descargar('pdf', abierto.preguntas)} className="btn-neutral btn-sm gap-1.5">
                <Download className="h-3.5 w-3.5" />
                PDF
              </button>
            </>
          }
        >
          <div className="cara-nueva cn-exp cn-exp-piel">
            {abierto.preguntas.enfoque && <p className="cn-int-tecnica-detalle">{abierto.preguntas.enfoque}</p>}
            <ListaDeTurnos
              preguntas={abierto.preguntas}
              conMaterial={conMaterial}
              documentosPorTitulo={documentosPorTitulo}
              onLeerDocumento={setLeyendo}
            />
          </div>
        </LecturaAmpliaDelInforme>
      )}

      <ConfirmarDialog confirmacion={confirmacionDeBorrado} onCerrar={() => setPorBorrar(null)} />

      {leyendo && (
        <LeerDocumentoIndexado
          expedienteId={expediente.id}
          documentId={leyendo}
          caratula={expediente.caratula}
          onCerrar={() => setLeyendo(null)}
        />
      )}
    </section>
  );
};
