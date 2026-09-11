import React from 'react';
import { AlertCircle, Check, Copy, Download, Gavel, Loader2 } from 'lucide-react';
import { useFuncionHabilitada } from '../../subscriptions/PlanContext';
import { AVISO_FUNCION_DESHABILITADA } from '../../subscriptions/types';
import { expedientesApi } from '../services/expedientes.api';
import {
  exportarPreguntasAPdf,
  exportarPreguntasAWord,
  preguntasComoTexto,
  type ContextoDelInterrogatorio
} from '../services/preguntasExport.service';
import {
  MAX_PERSONAS_POR_TANDA,
  SE_LE_PREGUNTA,
  type ExpedienteConDetalle,
  type PreguntasDelExpediente
} from '../types';

/**
 * EL INTERROGATORIO, PERSONA POR PERSONA.
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
 * ─── ESTO CUESTA SALDO, Y SE DICE ANTES ────────────────────────────────────
 *
 * El botón lleva el precio y la advertencia va arriba, no debajo. Un cobro que
 * se descubre después de pulsar es un cobro que el abogado no autorizó.
 *
 * ─── Y SE LLEVA EN LA MANO ─────────────────────────────────────────────────
 *
 * Copiar, Word y PDF. Vinieron con la mudanza desde el taller de revisión, y
 * no son adorno: a una audiencia se entra con la hoja impresa, no con una
 * pestaña abierta. Pintar el interrogatorio solo en pantalla obligaba a
 * seleccionarlo con el ratón y pegarlo en otra parte, perdiendo la técnica y
 * los «para qué» por el camino.
 */
export const PreguntasDelExpedientePanel: React.FC<{ expediente: ExpedienteConDetalle }> = ({
  expediente
}) => {
  const interrogables = expediente.listaDeActores.filter((a) => SE_LE_PREGUNTA.includes(a.papel));

  const [escogidos, setEscogidos] = React.useState<string[]>([]);
  const [quiereProbar, setQuiereProbar] = React.useState('');
  const [audiencia, setAudiencia] = React.useState('');
  const [pidiendo, setPidiendo] = React.useState(false);
  const [error, setError] = React.useState('');
  const [resultado, setResultado] = React.useState<PreguntasDelExpediente | null>(null);
  const [copiado, setCopiado] = React.useState(false);

  /*
   * El operador puede apagar el interrogatorio dejando el módulo encendido:
   * es lo caro de Expedientes. La pantalla lo dice y no ofrece el botón; el
   * servidor rechaza igual con 403 si la petición llega por fuera de aquí.
   */
  const habilitado = useFuncionHabilitada('EXPEDIENTES.PREGUNTAS_AUDIENCIA');

  /* Lo que titula y encabeza la hoja exportada; el radicado sale del expediente, no de un formulario. */
  const contexto: ContextoDelInterrogatorio = {
    caratula: expediente.caratula,
    radicado: expediente.radicado,
    ...(quiereProbar.trim() ? { quiereProbar: quiereProbar.trim() } : {}),
    ...(audiencia.trim() ? { audiencia: audiencia.trim() } : {})
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
    try {
      const r = await expedientesApi.preguntas(expediente.id, {
        actorIds: escogidos,
        quiereProbar: quiereProbar || undefined,
        audiencia: audiencia || undefined
      });
      setResultado(r.preguntas);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPidiendo(false);
    }
  };

  if (interrogables.length === 0) {
    return (
      <section className="card p-4">
        <h2 className="text-h3">Preparar el interrogatorio</h2>
        <p className="mt-1 text-meta text-ink-500">
          Agregue arriba a las partes, los testigos o el perito —con su lado y sobre qué declaran— y desde
          aquí se prepara el interrogatorio de cada uno. Al juez, al secretario, a los apoderados y al
          intérprete no se les pregunta, así que no cuentan para esto.
        </p>
      </section>
    );
  }

  const tope = escogidos.length >= MAX_PERSONAS_POR_TANDA;

  return (
    <section className="card p-4">
      <h2 className="text-h3">Preparar el interrogatorio</h2>
      <p className="mt-1 text-meta text-ink-500">
        Escoja a quién va a interrogar. La técnica la pone el sistema según lo que cada persona sea en el
        proceso y de qué lado esté.
      </p>

      <fieldset className="mt-3">
        <legend className="field-label">A quién</legend>
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
          <label className="field-label" htmlFor="que-probar">
            Qué quiere probar <span className="font-normal text-ink-500">(opcional)</span>
          </label>
          <input
            id="que-probar"
            className="field"
            value={quiereProbar}
            onChange={(e) => setQuiereProbar(e.target.value)}
            placeholder="que el inmueble se entregó en mal estado"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="tipo-audiencia">
            Tipo de audiencia <span className="font-normal text-ink-500">(opcional)</span>
          </label>
          <input
            id="tipo-audiencia"
            className="field"
            value={audiencia}
            onChange={(e) => setAudiencia(e.target.value)}
            placeholder="audiencia inicial"
          />
        </div>
      </div>

      {/* El aviso del cobro va ARRIBA del botón, no debajo. */}
      <p className="mt-3 text-meta text-ink-500">
        Preparar el interrogatorio consume saldo de la firma, una vez por tanda.
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
            : `Preparar para ${escogidos.length} persona(s)`}
      </button>

      {error && (
        <p className="mt-2 flex items-start gap-2 text-meta text-ink-700">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span className="[overflow-wrap:anywhere]">{error}</span>
        </p>
      )}

      {resultado && (
        <div className="mt-4 space-y-4">
          {/*
            LLEVARSE EL INTERROGATORIO: Word para seguir trabajándolo, PDF para
            imprimirlo. Los dos salen con la letra del membrete de la firma y
            sin bloque de firma — es material de trabajo, no se radica.
          */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => void copiar(resultado)}
              className="btn-neutral btn-sm gap-1.5"
              title="Copiar el interrogatorio completo como texto"
            >
              {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
            <button
              type="button"
              onClick={() => descargar('word', resultado)}
              className="btn-neutral btn-sm gap-1.5"
              title="Descargar en Word para seguir trabajándolo"
            >
              <Download className="h-3.5 w-3.5" />
              Word
            </button>
            <button
              type="button"
              onClick={() => descargar('pdf', resultado)}
              className="btn-neutral btn-sm gap-1.5"
              title="Descargar en PDF para llevarlo impreso a la audiencia"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
          {resultado.enfoque && (
            <p className="rounded-card border border-line-200 bg-canvas p-3 text-meta text-ink-700 [overflow-wrap:anywhere]">
              {resultado.enfoque}
            </p>
          )}
          {resultado.porPersona.map((persona) => (
            <div key={persona.actorId} className="rounded-card border border-line-200 p-3">
              <h3 className="text-body font-medium [overflow-wrap:anywhere]">{persona.nombre}</h3>
              {/*
                LA TÉCNICA SE MUESTRA, y no es adorno. Un abogado que ve
                «contrainterrogatorio: cerradas, una afirmación por pregunta»
                entiende por qué esa lista no se parece a la de al lado, y puede
                corregir el lado del actor si el sistema se equivocó.
              */}
              <p className="mt-0.5 text-meta text-ink-500 [overflow-wrap:anywhere]">{persona.tecnica}</p>
              <ol className="mt-2 space-y-2">
                {persona.preguntas.map((p, i) => (
                  <li key={i} className="text-body">
                    <p className="[overflow-wrap:anywhere]">
                      <span className="text-ink-500">{i + 1}. </span>
                      {p.pregunta}
                    </p>
                    {p.paraQue && (
                      <p className="text-meta text-ink-500 [overflow-wrap:anywhere]">Para: {p.paraQue}</p>
                    )}
                    {p.delMaterial && (
                      <p className="text-meta text-ink-500 [overflow-wrap:anywhere]">
                        Del material: «{p.delMaterial}»
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
