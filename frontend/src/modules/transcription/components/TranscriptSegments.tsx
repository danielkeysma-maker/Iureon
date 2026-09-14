import React from 'react';
import { buildSpeakerNames } from '../speakerNames';
import { ControlDeLetra, useTamanoDeLetra } from '../../../design/TamanoDeLetra';
import { Dialog } from '../../../design/Dialog';
import { colorForSpeaker } from '../speakerColors';
import { SugerenciaDeRol } from './RoleProposals';
import {
  certezaDeIntervencion,
  conPocaCerteza,
  intervencionesEnPalabras,
  marcaDeTiempo,
  revisionDe,
  vocesEnPalabras
} from '../audienciaEnPantalla';

import {
  ROLE_LABELS,
  ROLE_OPTIONS,
  type RoleProposal,
  type SpeakerRole,
  type TranscriptionKind,
  type TranscriptionResult,
  type SpeakerNameProposal,
  type VoiceConflict
} from '../types';

/*
 * EL TRANSCRITO CON LA CARA NUEVA, EN DOS PIEZAS Y UNA COMPOSICIÓN.
 *
 * `public/handoff/app-audiencias-entrevistas.html`:287 pone «Quién habla» en una
 * columna propia a la izquierda y el texto a la derecha, con las pestañas
 * Transcrito / Resumen arriba. Esa disposición la arma TranscriptionView, así
 * que aquí se exportan las dos piezas por separado —`QuienHabla` e
 * `Intervenciones`— y `TranscriptSegments` las compone apiladas para quien las
 * usa sin esa columna: la entrevista, que es otra pantalla con otro dueño.
 *
 * CADA PIEZA ABRE SU PROPIO ALCANCE `.cara-nueva`. Así se ve igual dentro de la
 * vista de Audiencias y dentro de una pantalla que todavía no cambió de cara; si
 * dependiera de la raíz de quien la monta, la entrevista la recibiría sin
 * estilos.
 */

interface TranscriptSegmentsProps {
  result: TranscriptionResult;
  kind: TranscriptionKind;
  onAssignRole: (speakerLabel: string, role: SpeakerRole) => void;
  /** Absent when the transcript could not be stored: there is nothing to save into. */
  onEditSegment?: (segmentIndex: number, text: string) => void;
  /** Cuts an intervention that holds two voices. Same storage requirement. */
  onSplitSegment?: (segmentIndex: number, charOffset: number, speakerLabel: string) => void;
  /**
   * Hands a whole intervention to another voice.
   *
   * Distinct from the cut on purpose: the cut solves two people inside one
   * intervention, this solves two people the engine filed under one label.
   */
  onReassignSpeaker?: (segmentIndex: number, speakerLabel: string) => void;
  /** Marca una intervención como leída por un humano. La fracción hace el acta. */
  onMarcarRevisada?: (segmentIndex: number, revisada: boolean) => void;
  /**
   * Marca una intervención como DECISIVA. Distinta de la revisión: revisada
   * dice «la leí y está bien transcrita», hecho clave dice «esto decide el
   * caso».
   */
  onMarcarHechoClave?: (segmentIndex: number, hechoClave: boolean) => void;
  /** Labels whose own words claim two different people. Server-computed. */
  voiceConflicts?: VoiceConflict[];
  /** The name each voice gave for itself, read out of the transcript. */
  nameProposals?: SpeakerNameProposal[];
  /** Sets who a voice is. An empty name clears it. */
  onAssignSpeakerName?: (speakerLabel: string, name: string) => void;
  /** Lo que el proponedor dedujo de cada voz, con su frase. Solo tras transcribir. */
  roleProposals?: RoleProposal[];
  /** Voces ya confirmadas en esta sesión: su sugerencia deja de ofrecerse. */
  rolesConfirmados?: Record<string, SpeakerRole>;
  onConfirmarRol?: (speakerLabel: string, role: SpeakerRole) => void;
  /**
   * Salta el reproductor al minuto de una intervención. SOLO existe mientras el
   * archivo elegido sigue en esta pestaña: la grabación se borra del
   * almacenamiento al transcribirse, así que sin copia local no hay nada que
   * escuchar y el botón no se pinta.
   */
  onEscucharDesde?: (segundos: number) => void;
}

/** El color de la voz viaja como variable: el mismo de las exportaciones Word y PDF. */
const colorDeVoz = (label: string, labels: string[]): React.CSSProperties =>
  ({ '--aud-voz': `#${colorForSpeaker(label, labels).hex}` }) as React.CSSProperties;

/* ─── QUIÉN HABLA ───────────────────────────────────────────────────────── */

type QuienHablaProps = Pick<
  TranscriptSegmentsProps,
  | 'result'
  | 'kind'
  | 'onAssignRole'
  | 'nameProposals'
  | 'onAssignSpeakerName'
  | 'roleProposals'
  | 'rolesConfirmados'
  | 'onConfirmarRol'
>;

/**
 * Las voces: nombre, rol procesal, cuántas veces habló, la sugerencia con su
 * frase y la revisión del acta. Artboard :287, columna «Quién habla».
 */
export const QuienHabla: React.FC<QuienHablaProps> = ({
  result,
  kind,
  onAssignRole,
  nameProposals = [],
  onAssignSpeakerName,
  roleProposals = [],
  rolesConfirmados = {},
  onConfirmarRol
}) => {
  const speakerNames = buildSpeakerNames(result.segments, ROLE_LABELS);

  /*
   * Lo escrito en cada caja antes de guardarse. Se guarda al salir del campo o
   * con Enter y no por tecla: un nombre se escribe de una vez, y una petición
   * por letra pelearía con quien escribe.
   */
  const [borradores, setBorradores] = React.useState<Record<string, string>>({});

  const roleOf = (label: string): SpeakerRole =>
    result.segments.find((s) => s.speakerLabel === label)?.role ?? 'DESCONOCIDO';
  const nameOf = (label: string): string =>
    result.segments.find((s) => s.speakerLabel === label)?.speakerName ?? '';
  const propuestaDeNombre = (label: string): SpeakerNameProposal | undefined =>
    nameProposals.find((p) => p.speakerLabel === label);

  const guardarNombre = (label: string, valor: string): void => {
    if (valor.trim() === nameOf(label)) return;
    onAssignSpeakerName?.(label, valor.trim());
  };

  const revision = revisionDe(result.segments);
  const pocas = conPocaCerteza(result.segments);

  return (
    <div className="cara-nueva cn-aud-quien">
      <div className="cn-aud-quien-cabeza">
        <h2 className="cn-aud-h2">Quién habla</h2>
        <p className="cn-aud-nota">
          {onAssignSpeakerName
            ? 'Póngales nombre una vez y se aplica a todo el transcrito.'
            : 'El motor separó las voces; no sabe quién es quién.'}
        </p>
      </div>

      <ul className="cn-aud-voces-lista">
        {result.speakerLabels.map((label, i) => {
          const cuenta = result.segments.filter((s) => s.speakerLabel === label).length;
          const propuesta = propuestaDeNombre(label);
          /*
           * La sugerencia se ofrece, nunca se aplica, y trae la frase que la
           * produjo: el proponedor lee fórmulas de la audiencia y una cita
           * leída en voz alta dispara el mismo marcador. Sin marcador no se
           * pinta «Sin rol sugerido»: al reabrir una audiencia las propuestas
           * no viajan, y ese rótulo acusaría a una voz de algo que nadie midió.
           */
          const sugerencia = roleProposals.find(
            (p) =>
              p.speakerLabel === label &&
              p.matches > 0 &&
              p.proposedRole !== 'DESCONOCIDO' &&
              !rolesConfirmados[label] &&
              roleOf(label) !== p.proposedRole
          );
          const idRol = `rol-${kind}-${label}`;

          return (
            <li key={label} className="cn-aud-voz" style={colorDeVoz(label, result.speakerLabels)}>
              <div className="cn-aud-voz-cabeza">
                <span className="cn-aud-punto" aria-hidden="true" />
                <span className="cn-aud-voz-nombre">Voz {i + 1}</span>
                {/*
                  CUÁNTAS VECES HABLÓ. No es estadística: la voz de dos
                  intervenciones casi siempre es el secretario o un testigo
                  puntual, y la de veintitrés es quien preside. Orienta la
                  asignación que se hace justo aquí.
                */}
                <span className="cn-aud-mono cn-aud-voz-cuenta" title="Intervenciones de esta voz">
                  {cuenta}
                </span>
              </div>

              {/*
                EL NOMBRE, QUE ES LO QUE HACE CITABLE UN TRANSCRITO. Nunca se
                llena solo: un nombre inventado por la aplicación sería una
                atribución fabricada en un documento que un juez puede cotejar
                con la grabación.
              */}
              {onAssignSpeakerName ? (
                <input
                  className="cn-aud-entrada"
                  aria-label={`Nombre de la voz ${i + 1}`}
                  value={borradores[label] ?? nameOf(label)}
                  onChange={(e) => setBorradores({ ...borradores, [label]: e.target.value })}
                  onBlur={(e) => guardarNombre(label, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                  placeholder={propuesta?.name ?? 'Nombre (opcional)'}
                />
              ) : (
                <p className="cn-aud-voz-fijo">{speakerNames[label] ?? label}</p>
              )}

              <label className="cn-aud-rotulo" htmlFor={idRol}>
                Rol procesal
              </label>
              <select
                id={idRol}
                className="cn-aud-select"
                value={roleOf(label)}
                onChange={(e) => onAssignRole(label, e.target.value as SpeakerRole)}
              >
                {ROLE_OPTIONS[kind].map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>

              {sugerencia && onConfirmarRol && (
                <SugerenciaDeRol
                  propuesta={sugerencia}
                  onConfirmar={() => onConfirmarRol(label, sugerencia.proposedRole)}
                />
              )}

              {onAssignSpeakerName && !nameOf(label) && propuesta && (
                <div className="cn-aud-sugerencia">
                  <p className="cn-aud-sugerencia-frase">
                    Se presentó como <span className="cn-aud-fuerte">{propuesta.name}</span>
                    {propuesta.atSeconds !== null && (
                      <span className="cn-aud-mono"> · {marcaDeTiempo(propuesta.atSeconds)}</span>
                    )}{' '}
                    — «{propuesta.phrase}»
                  </p>
                  <button
                    type="button"
                    className="cn-aud-accion cn-aud-accion--marca"
                    onClick={() => onAssignSpeakerName(label, propuesta.name)}
                  >
                    Usar este nombre
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/*
        LA REVISIÓN, QUE SEPARA UNA TRANSCRIPCIÓN DE UN ACTA. La fracción se
        cuenta de las marcas reales; la maqueta dice «El acta dice cuántas
        revisó usted», y aquí se dice lo que hay que hacer para que suba.
      */}
      <div className="cn-aud-revision">
        <div className="cn-aud-revision-fila">
          <span>Revisadas</span>
          <span className="cn-aud-mono cn-aud-revision-cifra">
            {revision.revisadas} / {revision.total}
          </span>
        </div>
        <div
          className="cn-aud-progreso"
          role="progressbar"
          aria-label="Intervenciones revisadas"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={revision.porcentaje}
        >
          <span style={{ width: `${revision.porcentaje}%` }} />
        </div>
        <p className="cn-aud-nota">Marque cada intervención cuando la haya leído.</p>
        {pocas > 0 && (
          <p className="cn-aud-nota cn-aud-nota--aviso">
            {pocas === 1 ? '1 intervención quedó' : `${pocas} intervenciones quedaron`} con poca certeza.
          </p>
        )}
      </div>
    </div>
  );
};

/* ─── LAS INTERVENCIONES ────────────────────────────────────────────────── */

type IntervencionesProps = Pick<
  TranscriptSegmentsProps,
  | 'result'
  | 'kind'
  | 'onEditSegment'
  | 'onSplitSegment'
  | 'onReassignSpeaker'
  | 'onMarcarRevisada'
  | 'onMarcarHechoClave'
  | 'voiceConflicts'
  | 'onEscucharDesde'
>;

type Dialogo = { tipo: 'corregir' | 'mover' | 'dividir'; index: number };

const NUEVA = '__nueva__';

/** Las voces como opciones de radio, con su color. Sirve a mover y a dividir. */
const OpcionesDeVoz: React.FC<{
  nombre: string;
  labels: string[];
  excluir?: string;
  valor: string;
  onCambio: (v: string) => void;
  nombres: Record<string, string>;
}> = ({ nombre, labels, excluir, valor, onCambio, nombres }) => (
  <div className="cn-aud-opciones" role="radiogroup">
    {labels
      .filter((l) => l !== excluir)
      .map((l) => (
        <label key={l} className="cn-aud-opcion" style={colorDeVoz(l, labels)}>
          <input
            type="radio"
            name={nombre}
            className="cn-aud-radio"
            checked={valor === l}
            onChange={() => onCambio(l)}
          />
          {/* Sin nombre calculado se dice «Voz N», como en «Quién habla»: la etiqueta del motor no es para leerse. */}
          <span className="cn-aud-opcion-texto">{nombres[l] ?? `Voz ${labels.indexOf(l) + 1}`}</span>
          <span className="cn-aud-punto" aria-hidden="true" />
        </label>
      ))}
    <label className="cn-aud-opcion">
      <input
        type="radio"
        name={nombre}
        className="cn-aud-radio"
        checked={valor === NUEVA}
        onChange={() => onCambio(NUEVA)}
      />
      <span className="cn-aud-opcion-texto">Otra persona (voz nueva)</span>
    </label>
  </div>
);

/** Recorta para la vista previa del corte sin partir el sentido de la frase por la mitad de una palabra. */
const recorte = (texto: string, desdeElFinal: boolean): string => {
  const limpio = texto.trim();
  if (limpio.length <= 90) return limpio;
  return desdeElFinal ? `…${limpio.slice(-90).replace(/^\S*\s/, '')}` : `${limpio.slice(0, 90).replace(/\s\S*$/, '')}…`;
};

export const Intervenciones: React.FC<IntervencionesProps> = ({
  result,
  kind,
  onEditSegment,
  onSplitSegment,
  onReassignSpeaker,
  onMarcarRevisada,
  onMarcarHechoClave,
  voiceConflicts = [],
  onEscucharDesde
}) => {
  const speakerNames = buildSpeakerNames(result.segments, ROLE_LABELS);
  /** Tamaño de lectura del transcrito, por pantalla: una audiencia se lee una hora seguida. */
  const letra = useTamanoDeLetra(kind === 'AUDIENCIA' ? 'audiencia' : 'entrevista');

  const [dialogo, setDialogo] = React.useState<Dialogo | null>(null);
  const [borrador, setBorrador] = React.useState('');
  const [destino, setDestino] = React.useState('');
  const [corte, setCorte] = React.useState<number | null>(null);
  /**
   * La intervención que acaba de guardarse. Una corrección invisible es
   * indistinguible de ninguna, y en un transcrito que se cita la duda es peor
   * que la errata.
   */
  const [recienGuardada, setRecienGuardada] = React.useState<number | null>(null);

  /*
   * Si el servidor reescribió los segmentos mientras el diálogo estaba abierto
   * —otro corte, otra voz— el índice ya no señala lo mismo, y el diálogo se
   * cierra en vez de operar sobre la intervención equivocada.
   */
  const segmento = dialogo ? result.segments[dialogo.index] : undefined;
  const abierto = Boolean(dialogo && segmento);

  const abrir = (tipo: Dialogo['tipo'], index: number): void => {
    setDialogo({ tipo, index });
    setBorrador(result.segments[index]?.text ?? '');
    setDestino('');
    setCorte(null);
  };
  const cerrar = (): void => setDialogo(null);

  /*
   * EL CORTE SE LEE DEL CUADRO DEL DIÁLOGO, NO DE LA SELECCIÓN DE LA PÁGINA.
   *
   * La versión anterior seguía el cursor sobre el párrafo con
   * `window.getSelection()`, que es global: pulsar Dividir en una intervención
   * con el cursor puesto en otra cortaba por una posición que nadie eligió. Y
   * el panel se abría junto al texto: en una intervención de tres mil
   * caracteres quedaba fuera de la vista y Dividir «no hacía nada». Un cuadro
   * de solo lectura dentro del diálogo resuelve las dos cosas: `selectionStart`
   * es de ESE cuadro, y la respuesta aparece donde se pulsó.
   */
  const leerCorte = (el: HTMLTextAreaElement): void => {
    const o = el.selectionStart;
    setCorte(o > 0 && o < el.value.length ? o : null);
  };

  const guardarCorreccion = (): void => {
    if (!dialogo || !segmento || !onEditSegment) return;
    /* Una intervención es un párrafo por definición: el salto de línea no entra al registro. */
    const nuevo = borrador.replace(/\s*\n+\s*/g, ' ').trim();
    if (nuevo && nuevo !== segmento.text) {
      onEditSegment(dialogo.index, nuevo);
      const index = dialogo.index;
      setRecienGuardada(index);
      window.setTimeout(() => setRecienGuardada((actual) => (actual === index ? null : actual)), 2500);
    }
    cerrar();
  };

  const nombreDe = (label: string, role: SpeakerRole): string => speakerNames[label] ?? ROLE_LABELS[role];
  const certezaAbierta = segmento ? certezaDeIntervencion(segmento) : null;

  return (
    <div className="cara-nueva cn-aud-texto-zona" style={{ '--aud-letra': `${letra.px(16)}px` } as React.CSSProperties}>
      <div className="cn-aud-herramientas">
        <p className="cn-aud-nota">
          {intervencionesEnPalabras(result.segments.length)} · {vocesEnPalabras(result.speakerLabels.length)}
        </p>
        <span className="cn-aud-piel">
          <ControlDeLetra letra={letra} />
        </span>
      </div>

      {/*
        UNA ETIQUETA, DOS PERSONAS — dicho en voz alta y con la evidencia. La
        diarización junta voces que no distingue, y en una audiencia cada quien
        se identifica en el registro: el texto delata la fusión. Nunca separa
        nada por sí sola.
      */}
      {voiceConflicts.map((conflict) => (
        <div key={conflict.speakerLabel} className="cn-aud-aviso cn-aud-aviso--advertencia">
          <p className="cn-aud-aviso-titulo">
            La voz {speakerNames[conflict.speakerLabel] ?? conflict.speakerLabel} parece contener a{' '}
            {conflict.identities.length} personas distintas
          </p>
          <ul className="cn-aud-conflicto">
            {conflict.identities.map((identity) => (
              <li key={`${identity.segmentIndex}-${identity.name}`}>
                <span className="cn-aud-fuerte">{identity.name}</span>
                {identity.atSeconds !== null && (
                  <span className="cn-aud-mono"> · {marcaDeTiempo(identity.atSeconds)}</span>
                )}{' '}
                — «{identity.phrase}»
              </li>
            ))}
          </ul>
          <p className="cn-aud-aviso-texto">
            Cada quien se presentó con su propio nombre. Busque la intervención que no corresponde y use
            «Es de otra persona» para dársela a quien la dijo, o corrija el nombre si la transcripción lo
            oyó mal. Si esta voz es un intérprete que habla por otras personas, asígnele el rol de
            Intérprete y este aviso se retira.
          </p>
        </div>
      ))}

      <ol className="cn-aud-intervenciones">
        {result.segments.map((segment, index) => {
          const certeza = certezaDeIntervencion(segment);
          const inicio = segment.startSeconds;
          return (
            <li
              key={`${segment.speakerLabel}-${index}`}
              id={`intervencion-${index}`}
              className={`cn-aud-intervencion${certeza.baja ? ' cn-aud-intervencion--poca-certeza' : ''}`}
              style={colorDeVoz(segment.speakerLabel, result.speakerLabels)}
            >
              {/*
                DOS COLUMNAS FIJAS EN ESCRITORIO: quién y cuándo · lo dicho. El
                abogado corrige leyendo en vertical y necesita que el texto
                empiece siempre en la misma x. En el teléfono la voz y la hora
                van arriba y el texto a lo ancho (artboard :535).
              */}
              <div className="cn-aud-dijo">
                <span className="cn-aud-dijo-nombre">{nombreDe(segment.speakerLabel, segment.role)}</span>
                {segment.speakerName && segment.role !== 'DESCONOCIDO' && (
                  <span className="cn-aud-dijo-rol">{ROLE_LABELS[segment.role]}</span>
                )}
                <span className="cn-aud-mono cn-aud-dijo-tiempo">{marcaDeTiempo(inicio)}</span>
                {segment.revisada && <span className="cn-aud-dijo-marca cn-aud-dijo-marca--ok">Revisada</span>}
                {segment.hechoClave && <span className="cn-aud-dijo-marca">Hecho clave</span>}
              </div>

              <div className="cn-aud-dicho">
                {/*
                  LA MARCA DE POCA CERTEZA ES DE LA INTERVENCIÓN ENTERA, con su
                  porcentaje. El proveedor no mide palabra por palabra: pegarle
                  «61 %» a tres palabras, como la maqueta, sería una precisión
                  inventada. Subrayado ondulado, no teñido —teñir vuelve difícil
                  de leer justo lo que hay que leer con cuidado—, y la raya de
                  la voz pasa a discontinua, la trama de lo no comprobado.
                */}
                <p className={`cn-aud-texto${certeza.baja ? ' cn-aud-texto--poca-certeza' : ''}`}>{segment.text}</p>

                {certeza.baja && (
                  <p className="cn-aud-certeza">
                    <span className="cn-aud-mono cn-aud-certeza-cifra">{certeza.porcentaje} %</span> de certeza en
                    esta intervención: vuélvala a escuchar antes de citarla.
                  </p>
                )}

                {recienGuardada === index && <p className="cn-aud-guardada">Corrección guardada</p>}

                <div className="cn-aud-acciones">
                  {certeza.baja && onEscucharDesde && inicio !== null && (
                    <button
                      type="button"
                      className="cn-aud-accion cn-aud-accion--aviso"
                      onClick={() => onEscucharDesde(inicio)}
                    >
                      Volver a escuchar desde {marcaDeTiempo(inicio)}
                    </button>
                  )}
                  {onMarcarRevisada && (
                    <button
                      type="button"
                      className={`cn-aud-accion${segment.revisada ? ' cn-aud-accion--hecha' : ' cn-aud-accion--marca'}`}
                      aria-pressed={Boolean(segment.revisada)}
                      onClick={() => onMarcarRevisada(index, !segment.revisada)}
                    >
                      {segment.revisada ? 'Quitar revisada' : 'Marcar revisada'}
                    </button>
                  )}
                  {onEditSegment && (
                    <button type="button" className="cn-aud-accion" onClick={() => abrir('corregir', index)}>
                      Corregir el texto
                    </button>
                  )}
                  {onReassignSpeaker && (
                    <button type="button" className="cn-aud-accion" onClick={() => abrir('mover', index)}>
                      Es de otra persona
                    </button>
                  )}
                  {onSplitSegment && segment.text.length > 1 && (
                    <button type="button" className="cn-aud-accion" onClick={() => abrir('dividir', index)}>
                      Dividir
                    </button>
                  )}
                  {onMarcarHechoClave && (
                    <button
                      type="button"
                      className="cn-aud-accion"
                      aria-pressed={Boolean(segment.hechoClave)}
                      onClick={() => onMarcarHechoClave(index, !segment.hechoClave)}
                    >
                      {segment.hechoClave ? 'Quitar hecho clave' : 'Marcar hecho clave'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="cn-aud-fin">Fin del transcrito · {intervencionesEnPalabras(result.segments.length)}</p>

      {/* ─── DIÁLOGOS (artboard :190) ─────────────────────────────────────── */}
      <div className="cn-aud-dialogos">
        <Dialog
          abierto={abierto && dialogo?.tipo === 'corregir'}
          onCerrar={cerrar}
          tamano="M"
          titulo="Corregir lo que se entendió"
          subtitulo={
            segmento
              ? [
                  nombreDe(segmento.speakerLabel, segmento.role),
                  marcaDeTiempo(segmento.startSeconds),
                  certezaAbierta?.baja ? `el motor entendió esta intervención con ${certezaAbierta.porcentaje} % de certeza` : ''
                ]
                  .filter(Boolean)
                  .join(' · ')
              : undefined
          }
          hayCambiosSinGuardar={Boolean(segmento && borrador !== segmento.text)}
          onIntentoDeCerrarConCambios={() => undefined}
          acciones={
            <>
              <button type="button" className="cn-ini-boton cn-ini-boton--texto cn-aud-boton" onClick={cerrar}>
                Cancelar
              </button>
              <button
                type="button"
                className="cn-ini-boton cn-ini-boton--primario cn-aud-boton"
                onClick={guardarCorreccion}
                disabled={!segmento || !borrador.trim() || borrador === segmento.text}
              >
                Guardar la corrección
              </button>
            </>
          }
        >
          {segmento && (
            <div className="cn-aud-dlg">
              <label className="cn-aud-sr" htmlFor="correccion-intervencion">
                Texto de la intervención
              </label>
              <textarea
                id="correccion-intervencion"
                className="cn-aud-area"
                value={borrador}
                onChange={(e) => setBorrador(e.target.value)}
                spellCheck={false}
                autoFocus
              />
              {onEscucharDesde && segmento.startSeconds !== null ? (
                <button
                  type="button"
                  className="cn-aud-escuchar"
                  onClick={() => onEscucharDesde(segmento.startSeconds as number)}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="11 5 6 9 3 9 3 15 6 15 11 19" />
                    <path d="M15.5 8.5a5 5 0 010 7" />
                  </svg>
                  Escuchar desde {marcaDeTiempo(segmento.startSeconds)}
                </button>
              ) : (
                <p className="cn-aud-nota cn-aud-nota--caja">
                  La grabación no se conserva: se borró al transcribirse. Para volver a oír este tramo necesita
                  el archivo original en este equipo.
                </p>
              )}
              {/*
                LO QUE PASA CON EL TEXTO DE ANTES, dicho como es: la corrección
                lo REEMPLAZA. La maqueta promete «el texto original se conserva»
                y el servidor sobrescribe el segmento; prometer un historial que
                no existe haría que alguien corrija confiado en poder volver.
              */}
              <p className="cn-aud-nota">La corrección reemplaza el texto de esta intervención para toda la firma.</p>
            </div>
          )}
        </Dialog>

        <Dialog
          abierto={abierto && dialogo?.tipo === 'mover'}
          onCerrar={cerrar}
          tamano="S"
          titulo="¿Quién dice esto?"
          subtitulo={
            segmento
              ? `Está atribuida a ${nombreDe(segmento.speakerLabel, segmento.role)}${
                  segmento.startSeconds !== null ? ` desde el minuto ${marcaDeTiempo(segmento.startSeconds)}` : ''
                }.`
              : undefined
          }
          acciones={
            <>
              <button type="button" className="cn-ini-boton cn-ini-boton--texto cn-aud-boton" onClick={cerrar}>
                Cancelar
              </button>
              <button
                type="button"
                className="cn-ini-boton cn-ini-boton--primario cn-aud-boton"
                disabled={!destino}
                onClick={() => {
                  if (dialogo && destino) onReassignSpeaker?.(dialogo.index, destino);
                  cerrar();
                }}
              >
                Reasignar
              </button>
            </>
          }
        >
          {segmento && (
            <div className="cn-aud-dlg">
              <OpcionesDeVoz
                nombre="voz-destino"
                labels={result.speakerLabels}
                excluir={segmento.speakerLabel}
                valor={destino}
                onCambio={setDestino}
                nombres={speakerNames}
              />
              {/*
                SOLO ESTA INTERVENCIÓN, Y SIN CASILLA. La maqueta ofrece «Y todo
                lo que sigue de esta voz», que no existe: el servidor mueve una
                intervención por vez. Una casilla con una sola opción posible
                sugiere que hay otra.
              */}
              <p className="cn-aud-alcance">Solo esta intervención</p>
              <p className="cn-aud-nota">
                Las demás intervenciones de esta voz no cambian. El rol lo toma de la voz a la que pasa.
              </p>
            </div>
          )}
        </Dialog>

        <Dialog
          abierto={abierto && dialogo?.tipo === 'dividir'}
          onCerrar={cerrar}
          tamano="M"
          titulo="Dividir la intervención"
          subtitulo={
            segmento
              ? [nombreDe(segmento.speakerLabel, segmento.role), marcaDeTiempo(segmento.startSeconds)]
                  .filter(Boolean)
                  .join(' · ')
              : undefined
          }
          acciones={
            <>
              <button type="button" className="cn-ini-boton cn-ini-boton--texto cn-aud-boton" onClick={cerrar}>
                Cancelar
              </button>
              <button
                type="button"
                className="cn-ini-boton cn-ini-boton--primario cn-aud-boton"
                disabled={corte === null || !destino}
                onClick={() => {
                  if (dialogo && corte !== null && destino) onSplitSegment?.(dialogo.index, corte, destino);
                  cerrar();
                }}
              >
                Dividir aquí
              </button>
            </>
          }
        >
          {segmento && (
            <div className="cn-aud-dlg">
              <p className="cn-aud-dlg-texto">
                Haga clic en el texto justo donde empieza a hablar la otra persona. Sirve cuando dos voces
                quedaron dentro de una misma intervención.
              </p>
              <label className="cn-aud-sr" htmlFor="corte-intervencion">
                Texto de la intervención
              </label>
              <textarea
                id="corte-intervencion"
                className="cn-aud-area cn-aud-area--corte"
                value={segmento.text}
                readOnly
                onClick={(e) => leerCorte(e.currentTarget)}
                onKeyUp={(e) => leerCorte(e.currentTarget)}
                onSelect={(e) => leerCorte(e.currentTarget)}
              />
              {corte === null ? (
                <p className="cn-aud-nota">Todavía no ha marcado dónde cortar.</p>
              ) : (
                <div className="cn-aud-corte">
                  <p>
                    <span className="cn-aud-fuerte">Se queda con {nombreDe(segmento.speakerLabel, segmento.role)}:</span>{' '}
                    «{recorte(segmento.text.slice(0, corte), true)}»
                  </p>
                  <p>
                    <span className="cn-aud-fuerte">Pasa a quien elija:</span> «{recorte(segmento.text.slice(corte), false)}»
                  </p>
                </div>
              )}
              <p className="cn-aud-rotulo">Lo que sigue lo dice</p>
              <OpcionesDeVoz
                nombre="voz-del-corte"
                labels={result.speakerLabels}
                valor={destino}
                onCambio={setDestino}
                nombres={speakerNames}
              />
            </div>
          )}
        </Dialog>
      </div>
    </div>
  );
};

/**
 * Las dos piezas apiladas, para quien no arma la columna de «Quién habla»: la
 * entrevista la monta así desde su propia pantalla.
 */
export const TranscriptSegments: React.FC<TranscriptSegmentsProps> = (props) => (
  <div className="cn-aud-mesa">
    <QuienHabla {...props} />
    <Intervenciones {...props} />
  </div>
);
