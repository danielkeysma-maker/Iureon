import React, { useState } from 'react';
import { Dialog } from '../../../design/Dialog';
import { transcriptionApi } from '../../transcription/services/transcription.api';

/**
 * Cerrar la entrevista: la decisión, con el motivo si se declina.
 *
 * LAS TRES SALIDAS SON OPCIONES DE UNA MISMA LISTA, no tres botones sueltos:
 * es UNA decisión. Y «decidir después» es una opción explícita, no un abandono
 * — la entrevista queda en «esperan decisión» con sus días contándose en la
 * lista, que es lo que impide que un cliente se quede sin respuesta en
 * silencio.
 *
 * DECLINAR EXIGE MOTIVO de una lista corta. La firma necesita saber qué está
 * rechazando y por qué; el consultante merece una respuesta. Y cuando el
 * motivo es un término vencido, se sugiere la constancia por escrito: ahí hay
 * un riesgo profesional real, no una cortesía.
 */

interface CerrarEntrevistaDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  transcriptionId: string;
  titulo: string;
  /** Se llama tras registrar TOMADO: abre la redacción con el relato. */
  onTomarYRedactar?: () => void;
  /** Recarga la lista para que la decisión se vea al volver. */
  onDecidido: () => void;
}

const MOTIVOS = [
  'Fuera de materia',
  'Sin viabilidad',
  'Conflicto de interés',
  'Término vencido',
  'El cliente no volvió',
  'Otro'
] as const;

type Salida = 'TOMAR' | 'DESPUES' | 'DECLINAR';

export const CerrarEntrevistaDialog: React.FC<CerrarEntrevistaDialogProps> = ({
  abierto,
  onCerrar,
  transcriptionId,
  titulo,
  onTomarYRedactar,
  onDecidido
}) => {
  const [salida, setSalida] = useState<Salida | null>(null);
  const [motivo, setMotivo] = useState('');
  const [motivoOtro, setMotivoOtro] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const motivoFinal = motivo === 'Otro' ? motivoOtro.trim() : motivo;
  const listo =
    salida === 'TOMAR' || salida === 'DESPUES' || (salida === 'DECLINAR' && motivoFinal.length > 0);

  const limpiar = () => {
    setSalida(null);
    setMotivo('');
    setMotivoOtro('');
    setError('');
  };

  const confirmar = async () => {
    if (!salida) return;
    setError('');

    /* «Decidir después» no escribe nada: SIN_DECIDIR ya es el estado. */
    if (salida === 'DESPUES') {
      limpiar();
      onCerrar();
      return;
    }

    setGuardando(true);
    const r = await transcriptionApi.decidir(
      transcriptionId,
      salida === 'TOMAR' ? 'TOMADO' : 'DECLINADO',
      salida === 'DECLINAR' ? motivoFinal : undefined
    );
    setGuardando(false);

    if (!r.item) {
      setError(r.error ?? 'No se pudo registrar la decisión.');
      return;
    }

    onDecidido();
    limpiar();
    onCerrar();
    if (salida === 'TOMAR') onTomarYRedactar?.();
  };

  const Opcion: React.FC<{ valor: Salida; titulo: string; detalle: string }> = ({
    valor,
    titulo: t,
    detalle
  }) => (
    <label
      className={`flex cursor-pointer items-start gap-2.5 rounded-card border px-3 py-2.5 transition-colors ${
        salida === valor ? 'border-brand-700 bg-brand-50' : 'border-line-200 hover:bg-canvas'
      }`}
    >
      <input
        type="radio"
        name="salida"
        checked={salida === valor}
        onChange={() => setSalida(valor)}
        className="mt-1"
      />
      <span className="min-w-0">
        <span className="block text-ui font-medium text-ink-900">{t}</span>
        <span className="block text-meta leading-[1.5] text-ink-500">{detalle}</span>
      </span>
    </label>
  );

  return (
    <Dialog
      abierto={abierto}
      onCerrar={() => {
        limpiar();
        onCerrar();
      }}
      tamano="M"
      titulo="Cerrar la entrevista"
      subtitulo={titulo}
      acciones={
        <>
          <button
            onClick={() => {
              limpiar();
              onCerrar();
            }}
            className="btn-neutral btn-sm"
            disabled={guardando}
          >
            Cancelar
          </button>
          <button onClick={() => void confirmar()} className="btn-primary btn-sm" disabled={!listo || guardando}>
            {guardando
              ? 'Registrando…'
              : salida === 'TOMAR'
              ? 'Tomar el caso y redactar'
              : salida === 'DECLINAR'
              ? 'Declinar el caso'
              : 'Confirmar'}
          </button>
        </>
      }
    >
      <div className="space-y-2">
        <Opcion
          valor="TOMAR"
          titulo="Tomar el caso"
          detalle="Queda registrado quién lo tomó y cuándo, y se abre la redacción con lo que la persona narró."
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

        {salida === 'DECLINAR' && (
          <div className="ml-6 space-y-1">
            {MOTIVOS.map((m) => (
              <label
                key={m}
                className="flex cursor-pointer items-center gap-2 rounded-control px-2 py-1 hover:bg-canvas"
              >
                <input type="radio" name="motivo" checked={motivo === m} onChange={() => setMotivo(m)} />
                <span className="text-ui text-ink-900">{m}</span>
              </label>
            ))}

            {motivo === 'Otro' && (
              <input
                value={motivoOtro}
                onChange={(e) => setMotivoOtro(e.target.value)}
                placeholder="El motivo, en una línea"
                autoFocus
                className="field mt-1 w-full"
              />
            )}

            {motivo === 'Término vencido' && (
              <p className="notice mt-1">
                Conviene decírselo al consultante por escrito y conservar constancia: un término
                que venció mientras esperaba respuesta es un riesgo profesional real.
              </p>
            )}
          </div>
        )}

        {error && <p className="notice-unverified">{error}</p>}
      </div>
    </Dialog>
  );
};
