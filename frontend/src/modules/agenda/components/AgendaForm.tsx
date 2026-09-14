import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, CalendarClock } from 'lucide-react';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import { useBranchActuacionesState } from '../../catalog/hooks/useBranchActuaciones';
import { useCatalogBranches } from '../../catalog/hooks/useCatalogBranches';
import { readSession } from '../../auth/session';
import { agendaApi } from '../services/agenda.api';
import type { AgendaPendiente } from '../pendiente';
import { avisoDeDiscrepancia, comoQuedaraElTermino, valoresInicialesDelFormulario } from '../desdeElContador';
import { SelectorDeExpediente } from '../../expedientes/components/SelectorDeExpediente';
import type { EntradaDeAgenda, PlazoDeActuacion, TipoDeDias, VencimientoPrevisto } from '../types';
import { Campo, Cargando, ErrorDeHerramienta, Opcion } from '../../tools/components/PantallaDeHerramienta';

/**
 * Poner un término en la agenda. Formulario DERIVADO: la maqueta de
 * Herramientas no lo dibuja; lleva los campos, las opciones en tarjeta y los
 * avisos de las calculadoras de `app-herramientas.html`.
 *
 * ─── EL ORDEN DE LOS CAMPOS ES EL ORDEN DE LA DECISIÓN ──────────────────────
 *
 * Primero el caso (asunto, cliente, radicado), después la actuación —que es lo
 * que fija el plazo—, y solo entonces la fecha de notificación. Pedir la fecha
 * antes de saber qué se vence obligaría a mostrar un cálculo que todavía no se
 * puede hacer.
 *
 * ─── LA FECHA LÍMITE NO ES UN CAMPO, SALVO CUANDO NO HAY OTRA SALIDA ────────
 *
 * Elegida la actuación, la pantalla pregunta al catálogo qué plazo fija. Si lo
 * fija sin ambigüedad, no hay nada que escribir: la fecha aparece calculada,
 * con los días que se descontaron y por qué. Si la ficha no se deja leer, se
 * muestra su término LITERAL y el abogado escribe los días que lee ahí; la
 * fecha se sigue calculando, y la entrada queda marcada «sin verificar» porque
 * la lectura la hizo él. Y solo cuando no hay plazo en días —un término en
 * meses, una actuación sin catalogar— se escribe la fecha a mano.
 *
 * ─── LO QUE TRAE EL CONTADOR DE TÉRMINOS ────────────────────────────────────
 *
 * Nace con la notificación, el plazo y la jurisdicción de la cuenta ya puestos
 * (`desdeElContador.ts`), sin ficha del catálogo y sin buscarla por el nombre:
 * el abogado completa el caso, revisa y guarda él. Si con esos mismos datos la
 * agenda no llega a la fecha que dio el contador, se dice antes de guardar.
 *
 * Nunca se propone una fecha que nadie calculó, y nunca se dice «verificado»
 * de un plazo que el catálogo no comprobó.
 */

interface AgendaFormProps {
  /** Lo que trae el botón «Poner en la agenda» de un borrador, una revisión o el contador. */
  pendiente: AgendaPendiente | null;
  onGuardada: (entrada: EntradaDeAgenda) => void;
}

type Destinatario = 'FIRMA' | 'USTED' | 'OTRA';

const hoyISO = (): string => {
  const ahora = new Date();
  return new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

export const AgendaForm: React.FC<AgendaFormProps> = ({ pendiente, onGuardada }) => {
  const correoPropio = readSession()?.user.email ?? '';
  const ramas = useCatalogBranches();

  /* Los valores con que nace el formulario se deciden una vez y fuera de React: tienen su check. */
  const [inicio] = useState(() => valoresInicialesDelFormulario(pendiente, hoyISO()));

  const [asunto, setAsunto] = useState(inicio.asunto);
  const [cliente, setCliente] = useState(inicio.cliente);
  const [radicado, setRadicado] = useState(inicio.radicado);
  /*
   * ─── DE QUE CASO ES EL VENCIMIENTO ────────────────────────────────────────
   *
   * La columna `agenda_terminos.expediente_id` existia y solo la escribia
   * «Traer al expediente» — despues y a mano. Un termino pertenece a un caso
   * POR NATURALEZA, asi que puede nacer atado.
   *
   * Y si viene de una revision que YA estaba atada, llega heredado: el
   * desplegable aparece con ese caso puesto y nadie vuelve a escogerlo.
   */
  const [expedienteId, setExpedienteId] = useState(inicio.expedienteId);

  const [rama, setRama] = useState(inicio.rama);
  const [actuacionId, setActuacionId] = useState(inicio.actuacionId);
  const [nombreSinCatalogar, setNombreSinCatalogar] = useState(inicio.nombreSinCatalogar);
  const [fechaNotificacion, setFechaNotificacion] = useState(inicio.fechaNotificacion);
  const [dias, setDias] = useState(inicio.dias);
  const [tipoDias, setTipoDias] = useState<TipoDeDias>(inicio.tipoDias);
  const [fechaManual, setFechaManual] = useState(inicio.fechaManual);
  const [destinatario, setDestinatario] = useState<Destinatario>('FIRMA');
  const [correoOtro, setCorreoOtro] = useState('');
  const [notas, setNotas] = useState('');

  const [plazo, setPlazo] = useState<PlazoDeActuacion | null>(null);
  const [consultando, setConsultando] = useState(false);
  const [previsto, setPrevisto] = useState<VencimientoPrevisto | null>(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const listaDeRama = useBranchActuacionesState(rama, undefined);

  /*
   * UNA REVISION TRAE EL NOMBRE DE LA ACTUACION, NO EL ID DE SU FICHA.
   *
   * Se resuelve por nombre exacto dentro de la rama —el mismo contrato que
   * tiene el motor de redaccion— y solo si coincide LITERALMENTE. Un
   * emparejador por parecido escogeria una ficha vecina, y la ficha vecina trae
   * otro termino: el vencimiento que se vigilaria seria el de otra actuacion,
   * con cara de calculo. Si no coincide, el desplegable se queda abierto para
   * que lo elija el abogado.
   *
   * Lo del contador NO se resuelve: el abogado conto su propio plazo, y atarlo
   * a la ficha por el nombre lo reemplazaria por el de la ficha sin pedirselo.
   */
  useEffect(() => {
    if (!inicio.resolverActuacionPorNombre) return;
    if (actuacionId || !pendiente?.actuacionNombre || listaDeRama.estado !== 'LISTA') return;
    const objetivo = pendiente.actuacionNombre.trim().toLowerCase();
    const encontrada = listaDeRama.actuaciones.find((a) => a.exactName.trim().toLowerCase() === objetivo);
    if (encontrada) setActuacionId(encontrada.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listaDeRama.estado, pendiente]);

  /* El catálogo, preguntado al elegir la actuación y no al guardar: lo que
     decide qué campos se ofrecen tiene que saberse antes de ofrecerlos. */
  useEffect(() => {
    if (!actuacionId) {
      setPlazo(null);
      return;
    }
    let vigente = true;
    setConsultando(true);
    setError('');
    agendaApi
      .plazoDe(actuacionId)
      .then((p) => {
        if (vigente) setPlazo(p);
      })
      .catch((e: unknown) => {
        if (vigente) {
          setPlazo(null);
          setError(e instanceof Error ? e.message : 'No se pudo consultar el término.');
        }
      })
      .finally(() => {
        if (vigente) setConsultando(false);
      });
    return () => {
      vigente = false;
    };
  }, [actuacionId]);

  const lecturaLegible = plazo?.lectura.legible === true;
  const diasEfectivos = lecturaLegible && plazo?.lectura.legible ? plazo.lectura.plazo.dias : Number(dias);
  const tipoEfectivo: TipoDeDias =
    lecturaLegible && plazo?.lectura.legible ? plazo.lectura.plazo.tipo : tipoDias;

  /* La cuenta la hace el servidor SIEMPRE, también en la vista previa: dos
     sitios que suman días acaban discrepando, y el que se ve no es el que avisa. */
  useEffect(() => {
    if (!fechaNotificacion || !Number.isFinite(diasEfectivos) || diasEfectivos <= 0) {
      setPrevisto(null);
      return;
    }
    let vigente = true;
    agendaApi
      .previsualizar({ fechaNotificacion, dias: Math.trunc(diasEfectivos), tipoDias: tipoEfectivo, rama: rama || null })
      .then((v) => {
        if (vigente) setPrevisto(v);
      })
      .catch(() => {
        if (vigente) setPrevisto(null);
      });
    return () => {
      vigente = false;
    };
  }, [fechaNotificacion, diasEfectivos, tipoEfectivo, rama]);

  const responsable = useMemo(() => {
    if (destinatario === 'USTED') return correoPropio;
    if (destinatario === 'OTRA') return correoOtro.trim();
    return null;
  }, [destinatario, correoPropio, correoOtro]);

  /* La misma regla que aplicará el servidor al guardar: se muestra antes, no se descubre después. */
  const marca = comoQuedaraElTermino({ actuacionId: actuacionId || null, lecturaLegible, dias: Number(dias), fechaManual });
  const discrepancia = lecturaLegible
    ? null
    : avisoDeDiscrepancia(pendiente, { fechaNotificacion, dias, tipoDias, fechaPrevista: previsto?.fechaLimite ?? null });
  const plazoLargoDelContador =
    pendiente?.origen === 'CONTADOR' && (pendiente.plazo?.unidad === 'MESES' || pendiente.plazo?.unidad === 'ANIOS');

  const puedeGuardar =
    asunto.trim().length > 0 &&
    Boolean(fechaNotificacion) &&
    (Boolean(actuacionId) || nombreSinCatalogar.trim().length > 0) &&
    (lecturaLegible || (Number(dias) > 0 && Boolean(previsto)) || Boolean(fechaManual)) &&
    (destinatario !== 'OTRA' || correoOtro.includes('@'));

  const guardar = async (): Promise<void> => {
    setGuardando(true);
    setError('');
    try {
      const entrada = await agendaApi.crear({
        asunto: asunto.trim(),
        cliente: cliente.trim() || null,
        radicado: radicado.trim() || null,
        actuacionId: actuacionId || null,
        actuacionNombre: actuacionId ? null : nombreSinCatalogar.trim(),
        rama: rama || null,
        fechaNotificacion,
        diasTermino: !lecturaLegible && Number(dias) > 0 ? Number(dias) : null,
        tipoDias: !lecturaLegible && Number(dias) > 0 ? tipoDias : null,
        fechaLimiteManual: !lecturaLegible && !(Number(dias) > 0) ? fechaManual || null : null,
        responsable,
        notas: notas.trim() || null,
        expedienteId: expedienteId || null
      });
      onGuardada(entrada);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la entrada.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="cn-her-formulario-agenda">
      {pendiente && pendiente.origen !== 'CONTADOR' && (
        <p className="cn-her-nota cn-her-nota--caja">
          Viene {pendiente.origen === 'BORRADOR' ? 'de un borrador' : 'de una revisión'}
          {pendiente.actuacionNombre ? ` · ${pendiente.actuacionNombre}` : ''}. Complete la fecha de notificación y
          compruebe el plazo antes de guardar.
        </p>
      )}
      {pendiente?.origen === 'CONTADOR' && (
        <p className="cn-her-nota cn-her-nota--caja">
          Viene del contador de términos, con su fecha de notificación y su plazo. Escriba el asunto y el caso, revise los
          datos y guarde: nada queda en la agenda hasta que usted pulse «Poner en la agenda». Quedará sin verificar, porque
          el plazo lo escribió usted y no una ficha del catálogo.
        </p>
      )}

      {/* ── El caso ─────────────────────────────────────────────────────── */}
      <fieldset className="cn-her-grupo">
        <legend className="cn-her-h2">El caso</legend>
        {/*
          EL EXPEDIENTE VA PRIMERO, y no por jerarquia: es lo unico de este
          bloque que ata el vencimiento a algo. «Asunto», «Cliente» y
          «Radicado» son texto libre que sirve para reconocerlo en la lista;
          el expediente es lo que hace que el caso lo cuente como suyo.

          Solo se pinta si la firma tiene expedientes: un desplegable con
          «sin expediente» y nada mas no ofrece nada.
        */}
        <SelectorDeExpediente
          cara="nueva"
          valor={expedienteId}
          onCambio={setExpedienteId}
          etiqueta="Expediente (opcional)"
          id="expediente-del-termino"
          pie={
            pendiente?.expedienteId
              ? 'Heredado de la revisión de la que viene.'
              : 'Átelo y el vencimiento aparece contado dentro del caso.'
          }
        />
        <Campo etiqueta="Asunto o proceso" htmlFor="agenda-asunto">
          <input
            id="agenda-asunto"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Proceso 00 · Juzgado 00 Civil Municipal"
            className="cn-her-campo"
          />
        </Campo>
        <div className="cn-her-rejilla cn-her-rejilla--2">
          <Campo etiqueta={<>Cliente <span className="cn-her-etiqueta-suave">(opcional)</span></>} htmlFor="agenda-cliente">
            <input id="agenda-cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} className="cn-her-campo" />
          </Campo>
          <Campo etiqueta={<>Radicado <span className="cn-her-etiqueta-suave">(opcional)</span></>} htmlFor="agenda-radicado">
            <input
              id="agenda-radicado"
              value={radicado}
              onChange={(e) => setRadicado(e.target.value)}
              placeholder="00000-00-00-000-0000-00000-00"
              className="cn-her-campo cn-her-mono"
            />
          </Campo>
        </div>
      </fieldset>

      {/* ── La actuación, que es la que fija el plazo ────────────────────── */}
      <fieldset className="cn-her-grupo">
        <legend className="cn-her-h2">La actuación, que fija el plazo</legend>
        <div className="cn-her-rejilla cn-her-rejilla--2">
          <Campo etiqueta="Rama" htmlFor="agenda-rama">
            <select
              id="agenda-rama"
              value={rama}
              onChange={(e) => {
                setRama(e.target.value);
                setActuacionId('');
                setPlazo(null);
              }}
              className="cn-her-campo"
            >
              <option value="">Elija la rama…</option>
              {ramas.map((r) => (
                <option key={r} value={r}>
                  {BRANCH_LABELS[r] ?? r}
                </option>
              ))}
            </select>
          </Campo>

          <Campo etiqueta="Actuación" htmlFor="agenda-actuacion">
            <select
              id="agenda-actuacion"
              value={actuacionId}
              onChange={(e) => setActuacionId(e.target.value)}
              disabled={!rama || listaDeRama.estado === 'CARGANDO'}
              className="cn-her-campo"
            >
              <option value="">
                {listaDeRama.estado === 'CARGANDO' ? 'Cargando el catálogo…' : 'Ninguna: la escribo yo'}
              </option>
              {listaDeRama.actuaciones.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.exactName}
                </option>
              ))}
            </select>
          </Campo>
        </div>

        {!actuacionId && (
          <Campo
            etiqueta="Nombre de la actuación"
            htmlFor="agenda-nombre"
            ayudaEsAviso
            ayuda="Sin ficha del catálogo no hay término verificado: tendrá que escribir el plazo o la fecha, y la entrada quedará marcada sin verificar."
          >
            <input
              id="agenda-nombre"
              value={nombreSinCatalogar}
              onChange={(e) => setNombreSinCatalogar(e.target.value)}
              placeholder="Cómo se llama lo que se vence"
              className="cn-her-campo"
            />
          </Campo>
        )}

        {/* ── Lo que el catálogo dice de su plazo ──────────────────────────── */}
        {consultando && <Cargando texto="Consultando el término en el catálogo…" />}

        {plazo && !consultando && plazo.lectura.legible && (
          <div className="cn-her-sello">
            <p className="cn-her-con-icono">
              <BadgeCheck aria-hidden="true" size={18} />
              <span>
                <b className="cn-her-fuerte-sello">
                  El catálogo fija {plazo.lectura.plazo.dias}{' '}
                  {plazo.lectura.plazo.tipo === 'HABILES' ? 'días hábiles' : 'días de calendario'}.
                </b>{' '}
                {plazo.legalBasis}
                {plazo.curadaPorLaFirma ? ' · curada por su firma' : ''}
              </span>
            </p>
            <p className="cn-her-sello-evidencia">{plazo.lectura.plazo.evidencia}</p>
          </div>
        )}

        {plazo && !consultando && !plazo.lectura.legible && (
          <div className="cn-her-aviso cn-her-aviso--sin-verificar">
            <p className="cn-her-con-icono">
              <AlertTriangle aria-hidden="true" size={18} />
              <span>
                <b className="cn-her-aviso-titulo-en-linea">Este plazo no se puede leer solo.</b> {plazo.lectura.motivo}
              </span>
            </p>
            {plazo.terminoLiteral && (
              <p className="cn-her-aviso-literal">
                <b className="cn-her-fuerte">Dice la ficha:</b> {plazo.terminoLiteral}
              </p>
            )}
          </div>
        )}
      </fieldset>

      {/* ── La fecha de partida y el plazo ───────────────────────────────── */}
      <fieldset className="cn-her-grupo">
        <legend className="cn-her-h2">Desde cuándo corre</legend>
        <div className={`cn-her-rejilla ${lecturaLegible ? 'cn-her-rejilla--2' : 'cn-her-rejilla--3'}`}>
          <Campo etiqueta="Fecha de notificación" htmlFor="agenda-notificacion">
            <input
              id="agenda-notificacion"
              type="date"
              value={fechaNotificacion}
              onChange={(e) => setFechaNotificacion(e.target.value)}
              className="cn-her-campo cn-her-mono"
            />
          </Campo>

          {!lecturaLegible && (
            <>
              <Campo etiqueta="Días del término" htmlFor="agenda-dias">
                <input
                  id="agenda-dias"
                  type="number"
                  min={1}
                  max={3650}
                  value={dias}
                  onChange={(e) => setDias(e.target.value)}
                  placeholder="00"
                  className="cn-her-campo cn-her-mono"
                />
              </Campo>
              <Campo etiqueta="Clase de días" htmlFor="agenda-tipo">
                <select
                  id="agenda-tipo"
                  value={tipoDias}
                  onChange={(e) => setTipoDias(e.target.value as TipoDeDias)}
                  className="cn-her-campo"
                >
                  <option value="HABILES">Hábiles</option>
                  <option value="CALENDARIO">De calendario</option>
                </select>
              </Campo>
            </>
          )}
        </div>

        {/* ── El resultado, o la salida de emergencia ──────────────────────── */}
        {previsto && (
          <div className="cn-her-caja cn-her-caja--previsto">
            <p className="cn-her-con-icono cn-her-previsto">
              <CalendarClock aria-hidden="true" size={18} />
              <span>
                Vence el <b className="cn-her-mono cn-her-fuerte">{previsto.fechaLimite}</b>
              </span>
              {!marca.verificado && <span className="cn-her-chip cn-her-chip--sin-verificar">Plazo escrito por usted</span>}
            </p>
            {previsto.excluidos.length > 0 && (
              <details className="cn-her-desglose">
                <summary>{previsto.excluidos.length} días descontados y por qué</summary>
                <ul className="cn-her-tabla">
                  {previsto.excluidos.map((d) => (
                    <li key={d.fecha} className="cn-her-tabla-fila cn-her-tabla-fila--fecha">
                      <span className="cn-her-mono cn-her-tenue">{d.fecha}</span>
                      <span>{d.motivo}</span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}

        {discrepancia && (
          <p className="cn-her-ayuda cn-her-ayuda--aviso cn-her-con-icono" role="alert">
            <AlertTriangle aria-hidden="true" size={16} />
            {discrepancia}
          </p>
        )}

        {!lecturaLegible && !(Number(dias) > 0) && (
          <Campo
            etiqueta="O escriba la fecha límite"
            htmlFor="agenda-fecha-manual"
            ayudaEsAviso
            ayuda={
              plazoLargoDelContador
                ? 'Es la fecha que dio el contador de términos para un plazo de meses o de años, que la agenda no cuenta. Revísela: la agenda la vigila tal como quede escrita, y la entrada queda marcada sin verificar.'
                : 'Solo cuando el término no se cuenta en días —meses, años o «en cualquier tiempo»—. La aplicación no la calcula: la vigila tal como usted la escriba, y la entrada queda marcada sin verificar.'
            }
          >
            <input
              id="agenda-fecha-manual"
              type="date"
              value={fechaManual}
              onChange={(e) => setFechaManual(e.target.value)}
              className="cn-her-campo cn-her-mono cn-her-campo--corto"
            />
          </Campo>
        )}
      </fieldset>

      {/* ── A quién se avisa ─────────────────────────────────────────────── */}
      <fieldset className="cn-her-grupo">
        <legend className="cn-her-h2">A quién se le avisa</legend>
        <div className="cn-her-opciones cn-her-opciones--fila">
          {(
            [
              ['FIRMA', 'A toda la firma'],
              ['USTED', 'Solo a usted'],
              ['OTRA', 'A otra persona']
            ] as Array<[Destinatario, string]>
          ).map(([valor, etiqueta]) => (
            <Opcion
              key={valor}
              nombre="agenda-destinatario"
              marcada={destinatario === valor}
              onCambio={() => setDestinatario(valor)}
              titulo={etiqueta}
            />
          ))}
        </div>
        {destinatario === 'OTRA' && (
          <Campo etiqueta="Correo de esa persona" htmlFor="agenda-correo">
            <input
              id="agenda-correo"
              value={correoOtro}
              onChange={(e) => setCorreoOtro(e.target.value)}
              placeholder="correo@sufirma.com"
              className="cn-her-campo cn-her-campo--corto"
            />
          </Campo>
        )}
        <p className="cn-her-nota">
          Se avisa cinco días antes, dos días antes y el día del vencimiento, en los dispositivos donde haya activado los
          avisos. Con un responsable, el aviso es solo suyo: compruebe que el correo sea el de su cuenta en Iureon, o no le
          llegará a nadie.
        </p>
      </fieldset>

      <Campo etiqueta={<>Notas <span className="cn-her-etiqueta-suave">(opcional)</span></>} htmlFor="agenda-notas">
        <textarea
          id="agenda-notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className="cn-her-campo cn-her-campo--texto"
        />
      </Campo>

      {error && <ErrorDeHerramienta mensaje={error} />}

      <button
        type="button"
        onClick={() => void guardar()}
        disabled={!puedeGuardar || guardando}
        className="cn-her-boton cn-her-boton--primario cn-her-boton--guardar"
      >
        {guardando ? 'Guardando…' : 'Poner en la agenda'}
      </button>
    </div>
  );
};
