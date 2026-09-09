import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, CalendarClock, Loader2 } from 'lucide-react';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import { useBranchActuacionesState } from '../../catalog/hooks/useBranchActuaciones';
import { useCatalogBranches } from '../../catalog/hooks/useCatalogBranches';
import { readSession } from '../../auth/session';
import { agendaApi } from '../services/agenda.api';
import type { AgendaPendiente } from '../pendiente';
import type { EntradaDeAgenda, PlazoDeActuacion, TipoDeDias, VencimientoPrevisto } from '../types';

/**
 * Poner un término en la agenda.
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
 * Nunca se propone una fecha que nadie calculó, y nunca se dice «verificado»
 * de un plazo que el catálogo no comprobó.
 */

interface AgendaFormProps {
  /** Lo que trae el botón «Poner en la agenda» de un borrador o una revisión. */
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

  const [asunto, setAsunto] = useState(pendiente?.asunto ?? '');
  const [cliente, setCliente] = useState(pendiente?.cliente ?? '');
  const [radicado, setRadicado] = useState(pendiente?.radicado ?? '');
  const [rama, setRama] = useState(pendiente?.rama ?? '');
  const [actuacionId, setActuacionId] = useState(pendiente?.actuacionId ?? '');
  const [nombreSinCatalogar, setNombreSinCatalogar] = useState(
    pendiente?.actuacionId ? '' : (pendiente?.actuacionNombre ?? '')
  );
  const [fechaNotificacion, setFechaNotificacion] = useState(hoyISO());
  const [dias, setDias] = useState('');
  const [tipoDias, setTipoDias] = useState<TipoDeDias>('HABILES');
  const [fechaManual, setFechaManual] = useState('');
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
   */
  useEffect(() => {
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
        notas: notas.trim() || null
      });
      onGuardada(entrada);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la entrada.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4 [overflow-wrap:anywhere]">
      {pendiente && (
        <p className="rounded-card border border-line-200 bg-surface px-3 py-2 text-meta text-ink-500">
          Viene {pendiente.origen === 'BORRADOR' ? 'de un borrador' : 'de una revisión'}
          {pendiente.actuacionNombre ? ` · ${pendiente.actuacionNombre}` : ''}. Complete la fecha de
          notificación y compruebe el plazo antes de guardar.
        </p>
      )}

      {/* ── El caso ─────────────────────────────────────────────────────── */}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block min-w-0 sm:col-span-2">
          <span className="field-label">Asunto o proceso</span>
          <input
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            placeholder="Mosquera · Juzgado 12 Laboral de Barranquilla"
            className="field mt-1 w-full"
          />
        </label>
        <label className="block min-w-0">
          <span className="field-label">Cliente (opcional)</span>
          <input value={cliente} onChange={(e) => setCliente(e.target.value)} className="field mt-1 w-full" />
        </label>
        <label className="block min-w-0">
          <span className="field-label">Radicado (opcional)</span>
          <input
            value={radicado}
            onChange={(e) => setRadicado(e.target.value)}
            className="field mt-1 w-full font-mono"
          />
        </label>
      </div>

      {/* ── La actuación, que es la que fija el plazo ────────────────────── */}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block min-w-0">
          <span className="field-label">Rama</span>
          <select
            value={rama}
            onChange={(e) => {
              setRama(e.target.value);
              setActuacionId('');
              setPlazo(null);
            }}
            className="field mt-1 w-full"
          >
            <option value="">Elija la rama…</option>
            {ramas.map((r) => (
              <option key={r} value={r}>
                {BRANCH_LABELS[r] ?? r}
              </option>
            ))}
          </select>
        </label>

        <label className="block min-w-0">
          <span className="field-label">Actuación</span>
          <select
            value={actuacionId}
            onChange={(e) => setActuacionId(e.target.value)}
            disabled={!rama || listaDeRama.estado === 'CARGANDO'}
            className="field mt-1 w-full"
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
        </label>

        {!actuacionId && (
          <label className="block min-w-0 sm:col-span-2">
            <span className="field-label">Nombre de la actuación</span>
            <input
              value={nombreSinCatalogar}
              onChange={(e) => setNombreSinCatalogar(e.target.value)}
              placeholder="Cómo se llama lo que se vence"
              className="field mt-1 w-full"
            />
            <span className="mt-1 block text-meta text-ink-400">
              Sin ficha del catálogo no hay término verificado: tendrá que escribir el plazo o la
              fecha, y la entrada quedará marcada sin verificar.
            </span>
          </label>
        )}
      </div>

      {/* ── Lo que el catálogo dice de su plazo ──────────────────────────── */}
      {consultando && (
        <p className="flex items-center gap-2 text-meta text-ink-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Consultando el término en el catálogo…
        </p>
      )}

      {plazo && !consultando && plazo.lectura.legible && (
        <div className="rounded-card border border-[rgb(var(--verified-line))] bg-[rgb(var(--verified-surf))] px-3 py-2.5 text-verified">
          <p className="flex items-start gap-2 text-[12px] leading-snug">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 text-justify [text-wrap:pretty]">
              <strong className="font-semibold">
                El catálogo fija {plazo.lectura.plazo.dias}{' '}
                {plazo.lectura.plazo.tipo === 'HABILES' ? 'días hábiles' : 'días de calendario'}.
              </strong>{' '}
              {plazo.legalBasis}
              {plazo.curadaPorLaFirma ? ' · curada por su firma' : ''}
            </span>
          </p>
          <p className="mt-1.5 text-justify text-[12px] leading-snug text-ink-500 [text-wrap:pretty]">
            {plazo.lectura.plazo.evidencia}
          </p>
        </div>
      )}

      {plazo && !consultando && !plazo.lectura.legible && (
        <div className="space-y-2 rounded-card border border-[rgb(var(--unverified-line))] bg-[rgb(var(--unverified-surf))] px-3 py-2.5">
          <p className="flex items-start gap-2 text-[12px] leading-snug text-unverified">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="min-w-0 text-justify [text-wrap:pretty]">
              <strong className="font-semibold">Este plazo no se puede leer solo.</strong>{' '}
              {plazo.lectura.motivo}
            </span>
          </p>
          {plazo.terminoLiteral && (
            <p className="text-justify text-[12px] leading-snug text-ink-700 [text-wrap:pretty]">
              <span className="font-semibold">Dice la ficha:</span> {plazo.terminoLiteral}
            </p>
          )}
        </div>
      )}

      {/* ── La fecha de partida y el plazo ───────────────────────────────── */}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block min-w-0">
          <span className="field-label">Fecha de notificación</span>
          <input
            type="date"
            value={fechaNotificacion}
            onChange={(e) => setFechaNotificacion(e.target.value)}
            className="field mt-1 w-full font-mono"
          />
        </label>

        {!lecturaLegible && (
          <>
            <label className="block min-w-0">
              <span className="field-label">Días del término</span>
              <input
                type="number"
                min={1}
                max={3650}
                value={dias}
                onChange={(e) => setDias(e.target.value)}
                placeholder="p. ej. 10"
                className="field mt-1 w-full font-mono"
              />
            </label>
            <label className="block min-w-0">
              <span className="field-label">Clase de días</span>
              <select
                value={tipoDias}
                onChange={(e) => setTipoDias(e.target.value as TipoDeDias)}
                className="field mt-1 w-full"
              >
                <option value="HABILES">Hábiles</option>
                <option value="CALENDARIO">De calendario</option>
              </select>
            </label>
          </>
        )}
      </div>

      {/* ── El resultado, o la salida de emergencia ──────────────────────── */}
      {previsto && (
        <div className="rounded-card border border-line-200 bg-surface px-3 py-2.5">
          <p className="flex items-center gap-2 text-ui text-ink-900">
            <CalendarClock className="h-4 w-4 shrink-0 text-[rgb(var(--rail-gold-ink))]" />
            Vence el <strong className="font-semibold">{previsto.fechaLimite}</strong>
            {!lecturaLegible && (
              <span className="chip-unverified ml-1">Plazo escrito por usted</span>
            )}
          </p>
          {previsto.excluidos.length > 0 && (
            <details className="mt-1.5">
              <summary className="cursor-pointer text-meta text-ink-500">
                {previsto.excluidos.length} días descontados y por qué
              </summary>
              <ul className="mt-1 space-y-0.5">
                {previsto.excluidos.map((d) => (
                  <li key={d.fecha} className="text-meta text-ink-500">
                    <span className="font-mono">{d.fecha}</span> · {d.motivo}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {!lecturaLegible && !(Number(dias) > 0) && (
        <label className="block min-w-0">
          <span className="field-label">O escriba la fecha límite</span>
          <input
            type="date"
            value={fechaManual}
            onChange={(e) => setFechaManual(e.target.value)}
            className="field mt-1 w-full font-mono sm:w-[220px]"
          />
          <span className="mt-1 block text-justify text-meta text-ink-400 [text-wrap:pretty]">
            Solo cuando el término no se cuenta en días —meses, años o «en cualquier tiempo»—. La
            aplicación no la calcula: la vigila tal como usted la escriba, y la entrada queda
            marcada sin verificar.
          </span>
        </label>
      )}

      {/* ── A quién se avisa ─────────────────────────────────────────────── */}
      <div className="min-w-0 space-y-1.5">
        <span className="field-label">A quién se le avisa</span>
        <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1.5">
          {(
            [
              ['FIRMA', 'A toda la firma'],
              ['USTED', 'Solo a usted'],
              ['OTRA', 'A otra persona']
            ] as Array<[Destinatario, string]>
          ).map(([valor, etiqueta]) => (
            <label key={valor} className="flex items-center gap-1.5 text-ui text-ink-700">
              <input
                type="radio"
                checked={destinatario === valor}
                onChange={() => setDestinatario(valor)}
              />
              {etiqueta}
            </label>
          ))}
        </div>
        {destinatario === 'OTRA' && (
          <input
            value={correoOtro}
            onChange={(e) => setCorreoOtro(e.target.value)}
            placeholder="correo@sufirma.com"
            className="field mt-1 w-full sm:w-[280px]"
          />
        )}
        <p className="text-justify text-meta text-ink-400 [text-wrap:pretty]">
          Se avisa cinco días antes, dos días antes y el día del vencimiento, en los dispositivos
          donde haya activado los avisos. Con un responsable, el aviso es solo suyo: compruebe que
          el correo sea el de su cuenta en Iureon, o no le llegará a nadie.
        </p>
      </div>

      <label className="block min-w-0">
        <span className="field-label">Notas (opcional)</span>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          className="field mt-1 w-full"
        />
      </label>

      {error && <p className="notice-unverified">{error}</p>}

      <button
        type="button"
        onClick={() => void guardar()}
        disabled={!puedeGuardar || guardando}
        className="btn-primary w-full sm:w-auto"
      >
        {guardando ? 'Guardando…' : 'Poner en la agenda'}
      </button>
    </div>
  );
};
