import React, { useEffect, useState } from 'react';
import { AlertTriangle, CalendarDays, CalendarPlus, Check, FileText, Trash2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { toolsApi } from '../../tools/services/tools.api';
import type { CalendarioAnual } from '../../tools/types';
import { agendaApi } from '../services/agenda.api';
import { tomarPendiente, type AgendaPendiente } from '../pendiente';
import type { EntradaDeAgenda } from '../types';
import { MESES, moverMes, type MesVisto } from '../mesDelCalendario';
import { entradasParaExportar, type FiltroDeExportacion } from '../agendaExportable';
import { exportarAgendaIcs, exportarAgendaPdf } from '../exportarAgenda';
import { AgendaForm } from './AgendaForm';
import { CalendarioDelMes } from './CalendarioDelMes';
import { Cargando, ErrorDeHerramienta, Opcion, PantallaDeHerramienta } from '../../tools/components/PantallaDeHerramienta';

/**
 * LA AGENDA DE TÉRMINOS DE LA FIRMA. Pantalla de `app-herramientas.html` :253
 * (el calendario judicial con los términos de la firma encima); «Lo que viene»
 * y «Añadir» se derivan de esa misma cabecera y de las tarjetas del sistema.
 *
 * ─── POR QUÉ ESTA PANTALLA ABRE DESDE EL CALENDARIO JUDICIAL ────────────────
 *
 * La tarjeta del calendario prometía «el calendario judicial con los términos
 * de la firma encima» y solo entregaba la primera mitad: festivos, vacancia y
 * días hábiles, iguales para todo el mundo. La segunda mitad —«este día se me
 * viene este proceso y tengo tantos días para responder»— no existía en ninguna
 * parte del producto. Es lo que hay aquí, y por eso ocupa el sitio de la
 * tarjeta que la prometía en vez de nacer como un módulo aparte.
 *
 * ─── TRES CEJILLAS, EN EL ORDEN EN QUE SE USA ───────────────────────────────
 *
 * «Lo que viene» es lo primero porque es la pregunta diaria. «El calendario»
 * sirve para ver la carga repartida y encontrar la semana imposible antes de
 * aceptar un caso. «Añadir» va al final porque se usa una vez por término.
 *
 * ─── BORRAR PREGUNTA ────────────────────────────────────────────────────────
 *
 * «Borrar» quitaba la entrada de un clic, junto a «Cumplida», que es el botón
 * que se pulsa a diario. Un término borrado deja de avisar a toda la firma, y
 * el dedo que buscaba «Cumplida» no debería poder hacerlo. Pregunta con el
 * diálogo del sistema (`app-dialogos-y-estados.html` :234) y el rojo va solo en
 * el botón que borra.
 *
 * ─── EL DETALLE DE LOS FESTIVOS SIGUE DONDE ESTABA ──────────────────────────
 *
 * Con su tabla, su regla por fila y sus dos exportaciones: no se rehace aquí,
 * se abre desde la cabecera con `onVerFestivos`. Duplicar esa tabla habría
 * creado dos sitios donde arreglar el mismo dato.
 *
 * ─── EXPORTAR SALE DE LO QUE SE ESTÁ VIENDO ─────────────────────────────────
 *
 * Desde «Lo que viene», la lista; desde «El calendario», el mes visto. Solo lo
 * pendiente, salvo que se pida incluir lo cumplido. Dos salidas: el PDF con el
 * membrete de la firma, para imprimir, y el .ics, para que cada vencimiento
 * aparezca en el calendario del teléfono. No va al final de la cabecera, como
 * lo dibuja la maqueta, sino junto a la vista, porque lo que exporta depende de
 * la cejilla y del mes, y un botón lejos de su filtro exporta a ciegas.
 *
 * ─── LO QUE VIENE DEL CONTADOR TERMINA EN UNA CONFIRMACIÓN ──────────────────
 *
 * Guardado lo que trajo el contador de términos, la pantalla no salta a la
 * lista en silencio: dice que quedó, con su fecha, y ofrece verlo en la agenda
 * o volver al contador, que conserva su resultado.
 */

type Cejilla = 'proximos' | 'calendario' | 'nuevo';

const CEJILLAS: Array<{ id: Cejilla; etiqueta: string }> = [
  { id: 'proximos', etiqueta: 'Lo que viene' },
  { id: 'calendario', etiqueta: 'El calendario' },
  { id: 'nuevo', etiqueta: 'Añadir' }
];

const DIA_MS = 24 * 60 * 60 * 1000;

/** Días que faltan, contados sobre el día local del navegador. */
const faltan = (fechaLimite: string): number => {
  const ahora = new Date();
  const hoy = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
  return Math.round((Date.parse(`${fechaLimite}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / DIA_MS);
};

const comoQuedan = (dias: number): string => {
  if (dias < 0) return `Venció hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'Vence hoy';
  if (dias === 1) return 'Queda 1 día';
  return `Quedan ${dias} días`;
};

interface AgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Abre el detalle de festivos y vacancia del año, con sus exportaciones. */
  onVerFestivos: () => void;
  /** Vuelve al contador de términos, tras guardar lo que trajo. */
  onVolverAlContador?: () => void;
}

export const AgendaModal: React.FC<AgendaModalProps> = ({ isOpen, onClose, onVerFestivos, onVolverAlContador }) => {
  const [cejilla, setCejilla] = useState<Cejilla>('proximos');
  const [entradas, setEntradas] = useState<EntradaDeAgenda[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [visto, setVisto] = useState<MesVisto>(() => ({ anio: new Date().getFullYear(), mes: new Date().getMonth() }));
  const [calendario, setCalendario] = useState<CalendarioAnual | null>(null);
  const [sinCalendario, setSinCalendario] = useState(false);
  const [pendiente, setPendiente] = useState<AgendaPendiente | null>(null);
  const [porBorrar, setPorBorrar] = useState<EntradaDeAgenda | null>(null);
  const [borrando, setBorrando] = useState(false);
  /*
   * EL FORMULARIO NACE DE NUEVO CON CADA PENDIENTE. Toma sus valores al montar;
   * si la cejilla ya era «Añadir», el pendiente llegaría a un formulario montado
   * que no lo leería. La clave lo obliga a nacer con él.
   */
  const [claveFormulario, setClaveFormulario] = useState(0);
  const [guardada, setGuardada] = useState<EntradaDeAgenda | null>(null);
  const [incluirCumplidas, setIncluirCumplidas] = useState(false);
  const [exportando, setExportando] = useState(false);

  /*
   * LO QUE TRAE UN BORRADOR SE CONSUME AL ABRIR, y solo una vez. Dejarlo en el
   * almacenamiento haría que el formulario naciera con el caso de la semana
   * pasada cada vez que alguien abre la agenda.
   */
  useEffect(() => {
    if (!isOpen) return;
    setGuardada(null);
    const traido = tomarPendiente();
    if (traido) {
      setPendiente(traido);
      setClaveFormulario((k) => k + 1);
      setCejilla('nuevo');
    }
  }, [isOpen]);

  const recargar = (): void => {
    setCargando(true);
    setError('');
    agendaApi
      .listar('TODAS')
      .then(setEntradas)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'No se pudo leer la agenda.'))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    if (isOpen) recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* El calendario se pide por AÑO: pasar de un mes a otro dentro del mismo año no vuelve a llamar. */
  useEffect(() => {
    if (!isOpen || cejilla !== 'calendario') return;
    let vigente = true;
    setSinCalendario(false);
    toolsApi
      .calendario(visto.anio, true)
      .then((c) => {
        if (vigente) setCalendario(c);
      })
      .catch(() => {
        /* Sin el calendario del año se pintan los vencimientos igual; lo que se
           pierde es el fondo de días no hábiles, no el dato de la firma. Y se
           dice, para que un mes sin gris no se lea como un mes sin festivos. */
        if (vigente) {
          setCalendario(null);
          setSinCalendario(true);
        }
      });
    return () => {
      vigente = false;
    };
  }, [isOpen, cejilla, visto.anio]);

  const pendientes = entradas
    .filter((e) => e.estado === 'PENDIENTE')
    .sort((a, b) => a.fechaLimite.localeCompare(b.fechaLimite));

  const marcarCumplida = async (entrada: EntradaDeAgenda): Promise<void> => {
    try {
      const actualizada = await agendaApi.editar(entrada.id, { estado: 'CUMPLIDA' });
      setEntradas((previas) => previas.map((e) => (e.id === actualizada.id ? actualizada : e)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo marcar como cumplida.');
    }
  };

  const borrar = async (entrada: EntradaDeAgenda): Promise<void> => {
    setBorrando(true);
    try {
      await agendaApi.borrar(entrada.id);
      setEntradas((previas) => previas.filter((e) => e.id !== entrada.id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo borrar la entrada.');
    } finally {
      setBorrando(false);
      setPorBorrar(null);
    }
  };

  /* Lo que sale es lo que se está viendo: la lista entera o el mes del calendario. */
  const filtro: FiltroDeExportacion = { incluirCumplidas, mes: cejilla === 'calendario' ? visto : null };
  const aExportar = entradasParaExportar(entradas, filtro);

  const exportarPapel = async (): Promise<void> => {
    setExportando(true);
    setError('');
    try {
      await exportarAgendaPdf(aExportar, filtro);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el PDF de la agenda.');
    } finally {
      setExportando(false);
    }
  };

  const exportarCalendario = (): void => {
    setError('');
    try {
      exportarAgendaIcs(aExportar, filtro);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el archivo de calendario.');
    }
  };

  if (!isOpen) return null;

  const deQue =
    cejilla === 'calendario' ? `los términos de ${MESES[visto.mes].toLowerCase()} de ${visto.anio}` : 'la lista';
  const cuantos = aExportar.length;

  const barraDeExportacion = (
    <div className="cn-her-caja">
      <p className="cn-her-caja-titulo">Exportar {deQue}</p>
      <div className="cn-her-opciones">
        <Opcion
          tipo="checkbox"
          marcada={incluirCumplidas}
          onCambio={() => setIncluirCumplidas((v) => !v)}
          titulo="Incluir cumplidos"
          detalle="Sin marcar, solo salen los términos pendientes."
        />
      </div>
      <p className="cn-her-nota">
        {cuantos === 0
          ? 'No hay términos que exportar con este filtro.'
          : `Saldrán ${cuantos} ${cuantos === 1 ? 'término' : 'términos'}, ordenados por fecha límite.`}
      </p>
      <div className="cn-her-acciones">
        <button
          type="button"
          disabled={cuantos === 0 || exportando}
          onClick={() => void exportarPapel()}
          className="cn-her-boton cn-her-boton--suave"
        >
          <FileText aria-hidden="true" size={16} />
          {exportando ? 'Preparando el PDF…' : 'Exportar a PDF'}
        </button>
        <button
          type="button"
          disabled={cuantos === 0}
          onClick={exportarCalendario}
          className="cn-her-boton cn-her-boton--suave"
        >
          <CalendarPlus aria-hidden="true" size={16} />
          Exportar al calendario (.ics)
        </button>
      </div>
      <p className="cn-her-nota">
        El PDF lleva el membrete de su firma. El archivo .ics se importa en Google Calendar, Outlook o el calendario del
        iPhone: un evento de día completo por término, en su fecha límite, con el aviso de «sin verificar» cuando
        corresponde. No lleva el cliente ni las notas.
      </p>
    </div>
  );

  return (
    <PantallaDeHerramienta
      forma="lista"
      titulo="Agenda de términos"
      bajada="Lo que se le vence a la firma, con la cuenta hecha por el motor de términos y el aviso al teléfono."
      onVolver={onClose}
      acciones={
        <button type="button" onClick={onVerFestivos} className="cn-her-boton cn-her-boton--suave">
          <CalendarDays aria-hidden="true" size={16} />
          Festivos y vacancia del año
        </button>
      }
    >
      <div className="cn-her-bloques">
        {/* El segmentado se desplaza en vez de encoger: una cejilla medio
            borrada a 320px es peor que una a la que hay que deslizarse. */}
        <div className="cn-her-segmento" role="tablist" aria-label="Vistas de la agenda">
          {CEJILLAS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={cejilla === c.id}
              onClick={() => {
                setCejilla(c.id);
                setGuardada(null);
              }}
              className="cn-her-segmento-boton"
            >
              {c.etiqueta}
              {c.id === 'proximos' && !cargando && <span className="cn-her-cuenta cn-her-mono">{pendientes.length}</span>}
            </button>
          ))}
        </div>

        {error && <ErrorDeHerramienta mensaje={error} />}

        {cejilla === 'proximos' && (
          <div className="cn-her-bloques">
            {cargando && <Cargando texto="Leyendo la agenda…" />}

            {!cargando && !error && pendientes.length === 0 && (
              /* Un vacío que ANUNCIA: una capacidad que no se presenta no existe. */
              <div className="cn-her-vacio">
                <p className="cn-her-vacio-titulo">Todavía no hay términos en la agenda</p>
                <p className="cn-her-vacio-texto">
                  Ponga uno en «Añadir»: elija la actuación del catálogo y escriba la fecha de notificación. La aplicación
                  calcula el vencimiento con el mismo motor del contador de términos y le avisa cinco días antes, dos días
                  antes y el día del vencimiento.
                </p>
                <button type="button" onClick={() => setCejilla('nuevo')} className="cn-her-boton cn-her-boton--primario">
                  Añadir el primero
                </button>
              </div>
            )}

            {pendientes.length > 0 && (
              <ul className="cn-her-entradas">
                {pendientes.map((e) => {
                  const dias = faltan(e.fechaLimite);
                  const urgente = dias <= 2;
                  return (
                    <li
                      key={e.id}
                      className={`cn-her-entrada${dias < 0 ? ' cn-her-entrada--vencida' : urgente ? ' cn-her-entrada--urgente' : ''}`}
                    >
                      <div className="cn-her-entrada-cuando">
                        <span className={urgente ? 'cn-her-entrada-plazo cn-her-entrada-plazo--urgente' : 'cn-her-entrada-plazo'}>
                          {comoQuedan(dias)}
                        </span>
                        <span className="cn-her-mono cn-her-tenue">{e.fechaLimite}</span>
                        {!e.terminoVerificado && (
                          <span className="cn-her-chip cn-her-chip--sin-verificar">
                            {e.origenFecha === 'MANUAL' ? 'Fecha escrita a mano' : 'Plazo sin verificar'}
                          </span>
                        )}
                      </div>

                      <p className="cn-her-entrada-asunto">{e.asunto}</p>
                      <p className="cn-her-nota">
                        {e.actuacionNombre}
                        {e.cliente ? ` · ${e.cliente}` : ''}
                        {e.radicado ? (
                          <>
                            {' · '}
                            <span className="cn-her-mono">{e.radicado}</span>
                          </>
                        ) : (
                          ''
                        )}
                      </p>
                      <p className="cn-her-nota">
                        Notificado el <span className="cn-her-mono">{e.fechaNotificacion}</span>
                        {e.diasTermino ? ` · ${e.diasTermino} días ${e.tipoDias === 'HABILES' ? 'hábiles' : 'de calendario'}` : ''}
                        {e.responsable ? ` · avisa solo a ${e.responsable}` : ' · avisa a toda la firma'}
                      </p>

                      {e.notas && <p className="cn-her-nota cn-her-nota--texto">{e.notas}</p>}

                      {!e.terminoVerificado && (
                        <p className="cn-her-ayuda cn-her-ayuda--aviso cn-her-con-icono">
                          <AlertTriangle aria-hidden="true" size={16} />
                          {e.origenFecha === 'MANUAL'
                            ? 'Esta fecha no la calculó la aplicación: la escribió quien creó la entrada.'
                            : 'El plazo lo escribió quien creó la entrada, no el catálogo verificado.'}
                        </p>
                      )}

                      <div className="cn-her-entrada-acciones">
                        <button type="button" onClick={() => void marcarCumplida(e)} className="cn-her-boton cn-her-boton--suave">
                          <Check aria-hidden="true" size={16} />
                          Cumplida
                        </button>
                        <button type="button" onClick={() => setPorBorrar(e)} className="cn-her-boton cn-her-boton--texto-tenue">
                          <Trash2 aria-hidden="true" size={16} />
                          Borrar
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {!cargando && entradas.some((e) => e.estado !== 'ARCHIVADA') && barraDeExportacion}
          </div>
        )}

        {cejilla === 'calendario' && (
          <div className="cn-her-bloques">
            <CalendarioDelMes
              visto={visto}
              onMover={(delta) => setVisto((v) => moverMes(v, delta))}
              calendario={calendario}
              entradas={pendientes}
            />
            {sinCalendario && (
              <p className="cn-her-ayuda cn-her-ayuda--aviso">
                No se pudo leer el calendario de {visto.anio}: los vencimientos están, pero sin marcar festivos ni vacancia.
              </p>
            )}
            <p className="cn-her-nota cn-her-nota--caja">
              Los festivos se calculan de la <b className="cn-her-fuerte">Ley 51 de 1983</b> con la regla de traslado de cada
              fecha, no de una tabla copiada año por año; la vacancia y la Semana Santa las calcula el mismo servidor, con
              sus fuentes en el detalle del año. Los términos que aparecen aquí los puso su firma: Iureon no consulta el
              estado de sus procesos.
            </p>
            {!cargando && barraDeExportacion}
          </div>
        )}

        {cejilla === 'nuevo' && guardada && (
          <div className="cn-her-sello" role="status">
            <p className="cn-her-con-icono">
              <Check aria-hidden="true" size={18} />
              <span>
                <b className="cn-her-fuerte-sello">Quedó en la agenda.</b> Vence el{' '}
                <span className="cn-her-mono">{guardada.fechaLimite}</span> · {guardada.asunto}
              </span>
            </p>
            {!guardada.terminoVerificado && (
              <p>
                <span className="cn-her-chip cn-her-chip--sin-verificar">
                  {guardada.origenFecha === 'MANUAL' ? 'Fecha escrita a mano' : 'Plazo sin verificar'}
                </span>
              </p>
            )}
            <div className="cn-her-acciones">
              <button
                type="button"
                onClick={() => {
                  setGuardada(null);
                  setCejilla('proximos');
                }}
                className="cn-her-boton cn-her-boton--primario"
              >
                Ver en la agenda
              </button>
              {onVolverAlContador && (
                <button
                  type="button"
                  onClick={() => {
                    setGuardada(null);
                    onVolverAlContador();
                  }}
                  className="cn-her-boton cn-her-boton--suave"
                >
                  Volver al contador
                </button>
              )}
            </div>
          </div>
        )}

        {cejilla === 'nuevo' && !guardada && (
          <AgendaForm
            key={claveFormulario}
            pendiente={pendiente}
            onGuardada={(entrada) => {
              setEntradas((previas) => [...previas, entrada]);
              const venia = pendiente?.origen;
              setPendiente(null);
              if (venia === 'CONTADOR') {
                setGuardada(entrada);
              } else {
                setCejilla('proximos');
              }
            }}
          />
        )}
      </div>

      <div className="cn-her-dialogos">
        <Dialog
          abierto={porBorrar !== null}
          onCerrar={() => setPorBorrar(null)}
          tamano="S"
          titulo="¿Borrar este término de la agenda?"
          acciones={
            <>
              <button type="button" onClick={() => setPorBorrar(null)} className="cn-her-boton cn-her-boton--suave">
                No, dejarlo
              </button>
              <button
                type="button"
                disabled={borrando}
                onClick={() => {
                  if (porBorrar) void borrar(porBorrar);
                }}
                className="cn-her-boton cn-her-boton--peligro"
              >
                {borrando ? 'Borrando…' : 'Sí, borrarlo'}
              </button>
            </>
          }
        >
          <p className="cn-her-dlg-texto">
            «{porBorrar?.asunto}» sale de la agenda y deja de avisar a quien tenía que avisar. Si ya se cumplió, márquelo
            como cumplido en lugar de borrarlo.
          </p>
        </Dialog>
      </div>
    </PantallaDeHerramienta>
  );
};
