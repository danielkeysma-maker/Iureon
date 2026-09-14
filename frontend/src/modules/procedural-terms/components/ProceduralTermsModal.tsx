import React, { useState } from 'react';
import { AlertTriangle, CalendarPlus, Check, Copy } from 'lucide-react';
import { termsApi, type TermsCalculationRequest, type TermsCalculationResult, type TermUnit } from '../services/terms.api';
import { exportarExcel, type LibroExcel } from '../../tools/exportarExcel';
import { exportarPdf } from '../../tools/exportarPdf';
import { dejarPendiente } from '../../agenda/pendiente';
import { pendienteDesdeElContador } from '../../agenda/desdeElContador';
import {
  BotonesDeExportacion,
  Caja,
  Campo,
  Cargando,
  ErrorDeHerramienta,
  Opcion,
  PantallaDeHerramienta,
  ResultadoVacio,
  TarjetaDeCifra
} from '../../tools/components/PantallaDeHerramienta';
import { FuentesBox } from '../../tools/components/FuentesBox';

interface ProceduralTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Lleva a la agenda, que ya recibió el pendiente del contador. */
  onPonerEnAgenda?: () => void;
}

type Jurisdiccion = TermsCalculationRequest['jurisdictionType'];

/*
 * LAS CUATRO CLASES DE TÉRMINO. El detalle dice qué hace cada una con los días
 * no hábiles, que es la diferencia que decide la fecha.
 */
const CLASES: Array<{ id: TermUnit; titulo: string; detalle: string; cuantos: string; plural: string }> = [
  { id: 'DIAS_HABILES', titulo: 'Días hábiles', detalle: 'Descuenta fines de semana, festivos y vacancia.', cuantos: 'Días hábiles', plural: 'días hábiles' },
  { id: 'DIAS_CALENDARIO', titulo: 'Días calendario', detalle: 'Cuenta todos los días, sin descontar ninguno.', cuantos: 'Días calendario', plural: 'días calendario' },
  { id: 'MESES', titulo: 'Meses', detalle: 'Mismo día del mes correspondiente (CGP art. 118).', cuantos: 'Meses', plural: 'meses' },
  { id: 'ANIOS', titulo: 'Años', detalle: 'Mismo día del año correspondiente (CGP art. 118).', cuantos: 'Años', plural: 'años' }
];
const claseDe = (id: TermUnit) => CLASES.find((c) => c.id === id) ?? CLASES[0];

/**
 * Contador de términos. Pantalla de `app-herramientas.html` :131, y :297 en el
 * teléfono. Conserva el nombre de archivo de cuando era diálogo para no mover a
 * quien lo monta.
 *
 * ─── EL RESULTADO MUESTRA QUÉ DESCONTÓ Y POR QUÉ ────────────────────────────
 *
 * Un número solo no es defendible ante un juez: el abogado va a verificar el
 * cómputo de todos modos, y la lista de días excluidos —cada sábado, domingo y
 * festivo, con su razón— es lo que le permite hacerlo en un minuto en vez de
 * rehacerlo a mano.
 *
 * ─── LA CLASE DE TÉRMINO SE ELIGE, Y EL RESULTADO DICE CUÁL SE USÓ ──────────
 *
 * Días hábiles es lo de siempre y sigue siendo lo que viene marcado. Días
 * calendario cuenta cada día y lo dice; si el vencimiento cae en un día no
 * hábil NO lo mueve, porque el art. 118 del CGP solo da esa extensión para los
 * términos de meses o de años, y el resultado lo advierte con el guion de lo no
 * verificado. Meses y años siguen la regla de ese mismo artículo. Todo lo
 * calcula el servidor; aquí no se suma un día.
 *
 * ─── «PONER EN LA AGENDA» LLEVA LA CUENTA, NO LA GUARDA ─────────────────────
 *
 * Deja en la agenda los datos que produjeron el resultado —no los que haya en
 * los campos después— y abre su formulario para que el abogado complete el caso
 * y lo revise. Nada se guarda sin su clic. La entrada queda sin verificar: el
 * plazo lo escribió él, no una ficha del catálogo.
 *
 * ─── LO QUE LA MAQUETA DIBUJA Y AQUÍ NO ESTÁ ────────────────────────────────
 *
 * · La casilla de la vacancia judicial: el servidor la descuenta siempre en
 *   días hábiles, y una casilla que no cambia el cálculo enseña a desconfiar de
 *   las que sí lo cambian. Se dice en la ayuda.
 * · «Guardar en un caso»: el caso se elige en la agenda, con su selector de
 *   expediente.
 * · «Quedan N días hábiles»: contarlos desde hoy sería un segundo cómputo hecho
 *   en el navegador, y dos sitios que suman días acaban discrepando.
 * · Las fechas de la vacancia escritas en la ayuda: salen del servidor y el
 *   desglose las lista día por día.
 *
 * ─── LO QUE ESTA CALCULADORA YA NO HACE ─────────────────────────────────────
 *
 * Tenía un «fallback»: si la API fallaba, mostraba una fecha de vencimiento
 * escrita en el código —la misma para cualquier entrada— con la cara de un
 * cálculo hecho. Un plazo inventado es la única cosa que este producto no
 * puede emitir. Ahora, si el servidor no puede calcular, el error se muestra
 * con su razón — incluida la más importante: que el término pise un periodo
 * cuyo calendario de festivos no está cargado, porque contarlo sin festivos
 * daría una fecha equivocada.
 */
export const ProceduralTermsModal: React.FC<ProceduralTermsModalProps> = ({ isOpen, onClose, onPonerEnAgenda }) => {
  const [notifiedDate, setNotifiedDate] = useState('');
  const [termInDays, setTermInDays] = useState(10);
  const [termUnit, setTermUnit] = useState<TermUnit>('DIAS_HABILES');
  const [jurisdictionType, setJurisdictionType] = useState<Jurisdiccion>('LABORAL');
  const [descripcion, setDescripcion] = useState('');
  const [resultado, setResultado] = useState<TermsCalculationResult | null>(null);
  /* Lo que se pidió para ESTE resultado: la agenda recibe esto, no los campos editados después. */
  const [pedido, setPedido] = useState<TermsCalculationRequest | null>(null);
  const [error, setError] = useState('');
  const [calculando, setCalculando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const calcular = async () => {
    if (!notifiedDate || termInDays <= 0) return;
    setCalculando(true);
    setError('');

    try {
      setResultado(await termsApi.calculate({ notifiedDate, termInDays, jurisdictionType, termUnit }));
      setPedido({ notifiedDate, termInDays, jurisdictionType, termUnit });
    } catch (e) {
      setResultado(null);
      setPedido(null);
      setError(e instanceof Error ? e.message : 'No se pudo calcular el término.');
    } finally {
      setCalculando(false);
    }
  };

  const fechaLarga = (iso: string): string =>
    new Date(`${iso}T12:00:00`).toLocaleDateString('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  /* Un servidor anterior al selector no manda la clase: lo que contó fueron días hábiles. */
  const unidadUsada: TermUnit = resultado?.termUnit ?? 'DIAS_HABILES';
  const claseUsada = claseDe(unidadUsada);
  const cantidadUsada = resultado ? (resultado.termAmount ?? resultado.totalBusinessDays) : 0;

  /*
   * The workbook carries the excluded days AND the sources the server used
   * (Ley 51 de 1983, CGP art. 118), so the computation leaves with its evidence.
   */
  /* El mismo objeto para las dos salidas: el Excel y el PDF no pueden diferir. */
  const libro = (): LibroExcel | null => {
    if (!resultado) return null;
    const detalle =
      unidadUsada === 'DIAS_HABILES'
        ? { columnas: ['Fecha excluida', 'Motivo'], filas: resultado.excludedDays.map((d) => [d.date, d.reason]) }
        : unidadUsada === 'DIAS_CALENDARIO'
          ? {
              columnas: ['Fecha contada aunque no es hábil', 'Motivo'],
              filas: (resultado.countedNonBusinessDays ?? []).map((d) => [d.date, d.reason])
            }
          : {
              columnas: ['Fecha inhábil saltada', 'Motivo'],
              filas: (resultado.extensionDays ?? []).map((d) => [d.date, d.reason])
            };
    return {
      archivo: 'contador-de-terminos',
      resultado: [
        ['Fecha de notificación', resultado.notifiedDate],
        ['Empieza a contar', resultado.startDate],
        ['Clase de término', claseUsada.titulo],
        [claseUsada.cuantos, cantidadUsada],
        ...(resultado.nominalDueDate ? [['Mismo día del mes o año', resultado.nominalDueDate] as [string, string]] : []),
        ['Vence', resultado.dueDate],
        ['Hora límite', resultado.dueTime],
        ['Fundamento', resultado.normativeReference]
      ],
      detalle,
      notas: resultado.notes ?? [],
      fuentes: resultado.fuentes ?? [],
      titulo: 'Contador de términos'
    };
  };

  const exportar = () => {
    const l = libro();
    if (l) exportarExcel(l);
  };

  const exportarPapel = async () => {
    const l = libro();
    if (!l) return;
    try {
      await exportarPdf(l);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el PDF.');
    }
  };

  const copiar = async () => {
    if (!resultado) return;
    await navigator.clipboard.writeText(
      `Notificado el ${resultado.notifiedDate}; término de ${cantidadUsada} ${claseUsada.plural} ` +
        `contados desde el ${resultado.startDate} (${resultado.normativeReference}); vence el ${resultado.dueDate}.`
    );
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const ponerEnAgenda = () => {
    if (!resultado || !pedido || !onPonerEnAgenda) return;
    dejarPendiente(pendienteDesdeElContador({
      notifiedDate: pedido.notifiedDate,
      termInDays: pedido.termInDays,
      termUnit: pedido.termUnit ?? 'DIAS_HABILES',
      jurisdictionType: pedido.jurisdictionType,
      dueDate: resultado.dueDate,
      descripcion
    }));
    onPonerEnAgenda();
  };

  if (!isOpen) return null;

  const clase = claseDe(termUnit);

  const primario = (
    <button
      type="button"
      onClick={() => void calcular()}
      disabled={calculando || !notifiedDate || termInDays <= 0}
      className="cn-her-boton cn-her-boton--primario cn-her-boton--ancho"
    >
      {calculando ? 'Contando…' : 'Contar'}
    </button>
  );

  const ayudaDeLaClase =
    termUnit === 'DIAS_HABILES'
      ? 'Cuenta desde el día siguiente a la notificación (CGP art. 118). Descuenta sábados, domingos, los festivos de la Ley 51 de 1983 y la vacancia judicial, con las fechas que calcula el servidor; en penal no descuenta los lunes a miércoles santos.'
      : termUnit === 'DIAS_CALENDARIO'
        ? 'Cuenta todos los días desde el día siguiente a la notificación (CGP art. 118), sin descontar fines de semana, festivos ni vacancia judicial. Si el vencimiento cae en un día no hábil no se mueve: el art. 118 no da esa regla para los días calendario, y el resultado se lo advierte.'
        : 'Corre desde el día siguiente a la notificación y vence el mismo día del mes o año correspondiente; si ese mes no tiene ese día, el último día del mes; si cae en día inhábil, el primer día hábil siguiente (CGP art. 118).';

  return (
    <PantallaDeHerramienta
      titulo="Contador de términos"
      onVolver={onClose}
      primario={primario}
      formulario={
        <>
          <Campo etiqueta="Desde qué fecha" htmlFor="terminos-desde" ayuda="La notificación, el auto o el hecho que abre el plazo.">
            <input
              id="terminos-desde"
              type="date"
              value={notifiedDate}
              onChange={(e) => setNotifiedDate(e.target.value)}
              className="cn-her-campo cn-her-mono"
            />
          </Campo>

          <fieldset className="cn-her-grupo">
            <legend className="cn-her-etiqueta">Clase de término</legend>
            <div className="cn-her-opciones cn-her-opciones--fila">
              {CLASES.map((c) => (
                <Opcion
                  key={c.id}
                  nombre="terminos-clase"
                  marcada={termUnit === c.id}
                  onCambio={() => setTermUnit(c.id)}
                  titulo={c.titulo}
                  detalle={c.detalle}
                />
              ))}
            </div>
          </fieldset>

          <div className="cn-her-rejilla cn-her-rejilla--2">
            <Campo etiqueta={clase.cuantos} htmlFor="terminos-dias">
              <input
                id="terminos-dias"
                type="number"
                min={1}
                value={termInDays}
                onChange={(e) => setTermInDays(Number(e.target.value))}
                className="cn-her-campo cn-her-mono"
              />
            </Campo>
            <Campo etiqueta="Jurisdicción" htmlFor="terminos-jurisdiccion">
              <select
                id="terminos-jurisdiccion"
                value={jurisdictionType}
                onChange={(e) => setJurisdictionType(e.target.value as Jurisdiccion)}
                className="cn-her-campo"
              >
                <option value="LABORAL">Laboral</option>
                <option value="CIVIL">Civil</option>
                <option value="CONSTITUCIONAL">Constitucional</option>
                <option value="PENAL">Penal (atiende lunes a miércoles santos)</option>
              </select>
            </Campo>
          </div>

          <Campo
            etiqueta={<>Qué se vence <span className="cn-her-etiqueta-suave">(opcional)</span></>}
            htmlFor="terminos-que"
            ayuda="No cambia la cuenta: es el nombre con el que llega a la agenda."
          >
            <input
              id="terminos-que"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Contestación de la demanda"
              className="cn-her-campo"
            />
          </Campo>

          {/* El término empieza al día siguiente de la notificación: se dice antes. */}
          <p className="cn-her-nota cn-her-nota--caja">{ayudaDeLaClase}</p>
        </>
      }
      resultado={
        <>
          {error && <ErrorDeHerramienta mensaje={error} />}
          {calculando && !resultado && <Cargando texto="Contando los días…" />}
          {!resultado && !calculando && !error && (
            <ResultadoVacio
              titulo="El vencimiento aparece aquí"
              texto="Con la clase de término usada, cada día que se descontó o se contó, la razón de cada uno y las fuentes del calendario."
            />
          )}

          {resultado && (
            <>
              {/* ─── EL VENCIMIENTO, GRANDE Y CON SU DÍA ─────────────────────── */}
              <TarjetaDeCifra
                rotulo={`Vence el · ${claseUsada.titulo.toLowerCase()}`}
                cifra={resultado.dueDate}
                detalle={
                  <>
                    <span className="cn-her-mayuscula">{fechaLarga(resultado.dueDate)}</span> · {resultado.dueTime}
                  </>
                }
                acciones={
                  <BotonesDeExportacion onExcel={exportar} onPdf={() => void exportarPapel()}>
                    <button type="button" onClick={() => void copiar()} className="cn-her-boton cn-her-boton--texto">
                      {copiado ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}
                      {copiado ? 'Copiado' : 'Copiar'}
                    </button>
                  </BotonesDeExportacion>
                }
              />

              {/* ─── DÍAS CALENDARIO QUE VENCEN EN DÍA NO HÁBIL: SE AVISA, NO SE MUEVE ─── */}
              {unidadUsada === 'DIAS_CALENDARIO' && resultado.dueOnNonBusinessDay && (
                <div className="cn-her-aviso cn-her-aviso--sin-verificar">
                  <p className="cn-her-con-icono">
                    <AlertTriangle aria-hidden="true" size={18} />
                    <span>
                      <b className="cn-her-aviso-titulo-en-linea">Vence en un día no hábil y no se movió.</b>{' '}
                      {(resultado.notes ?? [])[1] ?? resultado.dueOnNonBusinessDay}
                    </span>
                  </p>
                </div>
              )}

              {/* ─── QUÉ DESCONTÓ, QUÉ CONTÓ O CÓMO LLEGÓ ────────────────────── */}
              <Caja
                titulo={
                  unidadUsada === 'DIAS_HABILES'
                    ? 'Qué descontó y por qué'
                    : unidadUsada === 'DIAS_CALENDARIO'
                      ? 'Qué contó'
                      : 'Cómo llegó a la fecha'
                }
              >
                <p className="cn-her-nota cn-her-nota--bajo-titulo">
                  {claseUsada.titulo}: {cantidadUsada} {claseUsada.plural} desde el{' '}
                  <span className="cn-her-mono">{resultado.startDate}</span> · {resultado.normativeReference}
                </p>

                {unidadUsada === 'DIAS_HABILES' &&
                  (resultado.excludedDays.length === 0 ? (
                    <p className="cn-her-nota">No hubo que descontar ningún día.</p>
                  ) : (
                    <ul className="cn-her-tabla">
                      {resultado.excludedDays.map((d) => (
                        <li key={d.date} className="cn-her-tabla-fila cn-her-tabla-fila--fecha">
                          <span className="cn-her-mono cn-her-tenue">{d.date}</span>
                          <span>{d.reason}</span>
                        </li>
                      ))}
                    </ul>
                  ))}

                {unidadUsada === 'DIAS_CALENDARIO' && (
                  <>
                    <p className="cn-her-nota">{(resultado.notes ?? [])[0]}</p>
                    {(resultado.countedNonBusinessDays ?? []).length > 0 && (
                      <ul className="cn-her-tabla" aria-label="Días no hábiles que se contaron">
                        {(resultado.countedNonBusinessDays ?? []).map((d) => (
                          <li key={d.date} className="cn-her-tabla-fila cn-her-tabla-fila--fecha">
                            <span className="cn-her-mono cn-her-tenue">{d.date}</span>
                            <span>Contado · {d.reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {(unidadUsada === 'MESES' || unidadUsada === 'ANIOS') && (
                  <>
                    {(resultado.notes ?? []).map((n) => (
                      <p key={n} className="cn-her-nota">
                        {n}
                      </p>
                    ))}
                    {(resultado.extensionDays ?? []).length > 0 && (
                      <ul className="cn-her-tabla" aria-label="Días inhábiles saltados">
                        {(resultado.extensionDays ?? []).map((d) => (
                          <li key={d.date} className="cn-her-tabla-fila cn-her-tabla-fila--fecha">
                            <span className="cn-her-mono cn-her-tenue">{d.date}</span>
                            <span>{d.reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </Caja>

              {/* ─── LLEVARLO A LA AGENDA, PARA REVISARLO ALLÁ ───────────────── */}
              {onPonerEnAgenda && (
                <Caja titulo="Vigilar este vencimiento">
                  <p className="cn-her-nota cn-her-nota--bajo-titulo">
                    Abre el formulario de la agenda con la fecha de notificación, el plazo y la jurisdicción de esta cuenta. Allí
                    completa el caso y lo revisa antes de guardar. Quedará marcado sin verificar: el plazo lo escribió usted, no
                    una ficha del catálogo.
                  </p>
                  <div className="cn-her-acciones">
                    <button type="button" onClick={ponerEnAgenda} className="cn-her-boton cn-her-boton--primario">
                      <CalendarPlus aria-hidden="true" size={16} />
                      Poner en la agenda
                    </button>
                  </div>
                </Caja>
              )}

              <div className="cn-her-aviso">
                <p className="cn-her-aviso-titulo">Esto cuenta días, no decide el término</p>
                <p>
                  Cuántos días corren, de qué clase y desde cuándo lo fija la norma de la actuación. Si no lo sabe, búsquela en
                  el catálogo: allí el término va con su artículo.
                </p>
              </div>

              <FuentesBox fuentes={resultado.fuentes ?? []} />
            </>
          )}
        </>
      }
    />
  );
};
