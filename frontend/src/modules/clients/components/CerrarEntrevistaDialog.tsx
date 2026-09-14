import React, { useState } from 'react';
import { Dialog } from '../../../design/Dialog';
import { transcriptionApi } from '../../transcription/services/transcription.api';
import { MOTIVOS_DE_DECLINAR, motivoDelDeclinado } from '../entrevistaEnPantalla';

/**
 * Cerrar la entrevista: la decisión, con el motivo si se declina.
 *
 * LAS TRES SALIDAS SON OPCIONES DE UNA MISMA LISTA, no tres botones sueltos:
 * es UNA decisión. Y «decidir después» es una opción explícita, no un abandono
 * — la entrevista queda en «esperan decisión» con sus días contándose en la
 * lista, que es lo que impide que un cliente se quede sin respuesta en
 * silencio.
 *
 * DECLINAR EXIGE MOTIVO. La firma necesita saber qué está rechazando y por
 * qué; el consultante merece una respuesta. Y cuando el motivo es un término
 * vencido, se sugiere la constancia por escrito: ahí hay un riesgo profesional
 * real, no una cortesía.
 *
 * ─── DOS MODOS, UN SOLO DIÁLOGO ────────────────────────────────────────────
 *
 * `decidir` es el cierre del teléfono («Cerrar y usar»): las tres salidas.
 * `declinar` es la maqueta «¿Por qué declina el caso?»
 * (`app-audiencias-entrevistas.html:230`), que abren el detalle y la lista
 * cuando la decisión ya está tomada y solo falta el motivo. Antes la lista
 * tenía su propio diálogo con su propia copia de los motivos; dos copias de
 * una lista corta divergen en cuanto alguien añade uno.
 */

interface CerrarEntrevistaDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  transcriptionId: string;
  titulo: string;
  modo?: 'decidir' | 'declinar';
  /** Se llama tras registrar TOMADO: abre la redacción con el relato. */
  onTomarYRedactar?: () => void;
  /** Recarga la lista para que la decisión se vea al volver. */
  onDecidido: () => void;
}

type Salida = 'TOMAR' | 'DESPUES' | 'DECLINAR';

export const CerrarEntrevistaDialog: React.FC<CerrarEntrevistaDialogProps> = ({
  abierto,
  onCerrar,
  transcriptionId,
  titulo,
  modo = 'decidir',
  onTomarYRedactar,
  onDecidido
}) => {
  const [salida, setSalida] = useState<Salida | null>(null);
  const [chip, setChip] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const efectiva: Salida | null = modo === 'declinar' ? 'DECLINAR' : salida;
  const motivo = motivoDelDeclinado(chip, texto);
  const listo = efectiva === 'TOMAR' || efectiva === 'DESPUES' || (efectiva === 'DECLINAR' && motivo !== null);

  const limpiar = () => {
    setSalida(null);
    setChip(null);
    setTexto('');
    setError('');
  };

  const cerrar = () => {
    if (guardando) return;
    limpiar();
    onCerrar();
  };

  const confirmar = async () => {
    if (!efectiva) return;
    setError('');

    /* «Decidir después» no escribe nada: SIN_DECIDIR ya es el estado. */
    if (efectiva === 'DESPUES') {
      limpiar();
      onCerrar();
      return;
    }

    setGuardando(true);
    const r = await transcriptionApi.decidir(
      transcriptionId,
      efectiva === 'TOMAR' ? 'TOMADO' : 'DECLINADO',
      efectiva === 'DECLINAR' ? motivo ?? undefined : undefined
    );
    setGuardando(false);

    if (!r.item) {
      setError(r.error ?? 'No se pudo registrar la decisión.');
      return;
    }

    onDecidido();
    limpiar();
    onCerrar();
    if (efectiva === 'TOMAR') onTomarYRedactar?.();
  };

  const Opcion: React.FC<{ valor: Salida; titulo: string; detalle: string }> = ({ valor, titulo: t, detalle }) => (
    <label className={`cn-ent-salida ${salida === valor ? 'cn-ent-salida--activa' : ''}`}>
      <input type="radio" name="salida" checked={salida === valor} onChange={() => setSalida(valor)} />
      <span className="cn-ent-salida-texto">
        <span className="cn-ent-salida-titulo">{t}</span>
        <span className="cn-ent-salida-detalle">{detalle}</span>
      </span>
    </label>
  );

  const motivos = (
    <div className="cn-ent-motivos">
      {modo === 'declinar' && (
        <p className="cn-ent-dlg-texto">
          Una línea basta. Su firma necesita saber qué está dejando pasar, y el consultante merece una
          respuesta.
        </p>
      )}
      <div className="cn-ent-chips" role="group" aria-label="Motivo">
        {MOTIVOS_DE_DECLINAR.map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={chip === m}
            onClick={() => setChip(chip === m ? null : m)}
            className={`cn-ent-opcion-chip ${chip === m ? 'cn-ent-opcion-chip--activa' : ''}`}
          >
            {m}
          </button>
        ))}
      </div>
      <label className="cn-ent-campo">
        <span className="cn-ent-oculto">El motivo con sus palabras</span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="O escríbalo con sus palabras…"
          rows={3}
          className="cn-ent-entrada cn-ent-entrada--larga"
        />
      </label>
      {chip === 'Término vencido' && (
        <p className="cn-ent-aviso cn-ent-aviso--aviso">
          Conviene decírselo al consultante por escrito y conservar constancia: un término que venció
          mientras esperaba respuesta es un riesgo profesional real.
        </p>
      )}
    </div>
  );

  return (
    <Dialog
      abierto={abierto}
      onCerrar={cerrar}
      tamano="M"
      titulo={modo === 'declinar' ? '¿Por qué declina el caso?' : 'Cerrar la entrevista'}
      subtitulo={titulo}
      acciones={
        <>
          <button type="button" onClick={cerrar} className="cn-ini-boton cn-ini-boton--texto cn-ent-boton" disabled={guardando}>
            {modo === 'declinar' ? 'Volver' : 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={() => void confirmar()}
            className={`cn-ini-boton cn-ent-boton ${efectiva === 'DECLINAR' ? 'cn-ent-boton--tinta' : 'cn-ini-boton--primario'}`}
            disabled={!listo || guardando}
          >
            {guardando
              ? 'Registrando…'
              : efectiva === 'TOMAR'
                ? onTomarYRedactar
                  ? 'Tomar el caso y redactar'
                  : 'Tomar el caso'
                : efectiva === 'DECLINAR'
                  ? 'Declinar el caso'
                  : 'Confirmar'}
          </button>
        </>
      }
    >
      <div className="cn-ent-dlg">
        {modo === 'decidir' ? (
          <>
            <div className="cn-ent-salidas">
              <Opcion
                valor="TOMAR"
                titulo="Tomar el caso"
                detalle={
                  onTomarYRedactar
                    ? 'Queda registrado quién lo tomó y cuándo, y se abre la redacción con lo que la persona narró.'
                    : 'Queda registrado quién lo tomó y cuándo.'
                }
              />
              <Opcion
                valor="DESPUES"
                titulo="Decidir después"
                detalle="Queda en «esperan decisión», con los días de espera a la vista en la lista."
              />
              <Opcion
                valor="DECLINAR"
                titulo="Declinar el caso"
                detalle="Se registra con su motivo: la firma necesita saber qué rechaza, y el consultante merece una respuesta."
              />
            </div>
            {salida === 'DECLINAR' && motivos}
          </>
        ) : (
          motivos
        )}

        {error && <p className="cn-ent-aviso cn-ent-aviso--peligro">{error}</p>}
      </div>
    </Dialog>
  );
};
