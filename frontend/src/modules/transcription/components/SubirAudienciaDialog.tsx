import React, { useEffect, useState } from 'react';
import { AlertTriangle, Cpu, FileAudio, Upload } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { billingApi } from '../../billing/billing.api';
import { SUPPORTED_AUDIO_EXTENSIONS } from '../types';

/**
 * Subir audio de audiencia. Diálogo tipo 2 —formulario— en tamaño M.
 *
 * ─── «QUÉ VA A PASAR» PROMETE SOLO LO QUE SE CUMPLE ─────────────────────────
 *
 * La lista de cuatro puntos es la promesa central del producto aplicada al
 * audio: las voces se separan y se numeran, el abogado les pone nombre una
 * sola vez, los fragmentos poco claros SE MARCAN Y NO SE INVENTAN, y la
 * transcripción queda «Por revisar» hasta que alguien la lea. Cada punto es
 * verificable en la pantalla siguiente; ninguno es publicidad.
 *
 * ─── EL COSTO SE DICE ANTES, Y VIENE DEL SERVIDOR ───────────────────────────
 *
 * En una plataforma de saldo prepagado, una hora de audio no puede procesarse
 * sin decir cuánto cuesta. El precio se pide a /billing/summary y no se
 * escribe aquí: este archivo ya vivió la lección del «máximo 25 MB» que siguió
 * anunciando el límite del proveedor viejo meses después del cambio. Si el
 * servidor no responde, no se muestra un número inventado — se muestra nada.
 */

interface SubirAudienciaDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  maxAudioBytes: number;
  isUploading: boolean;
  isTranscribing: boolean;
  error: string | null;
  onTranscribir: (archivo: File, contexto: string) => void;
}

const megabytes = (bytes: number): string => (bytes / (1024 * 1024)).toFixed(1);

export const SubirAudienciaDialog: React.FC<SubirAudienciaDialogProps> = ({
  abierto,
  onCerrar,
  maxAudioBytes,
  isUploading,
  isTranscribing,
  error,
  onTranscribir
}) => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [contexto, setContexto] = useState('');
  const [precio, setPrecio] = useState<number | null>(null);

  const trabajando = isUploading || isTranscribing;

  /* El precio, del servidor y solo cuando el diálogo se abre. */
  useEffect(() => {
    if (!abierto || precio !== null) return;
    billingApi
      .summary()
      .then((r) => setPrecio(r.prices?.TRANSCRIPCION ?? null))
      .catch(() => setPrecio(null));
  }, [abierto, precio]);

  return (
    <Dialog
      abierto={abierto}
      onCerrar={trabajando ? () => undefined : onCerrar}
      tamano="M"
      titulo="Subir audio de audiencia"
      subtitulo={`${SUPPORTED_AUDIO_EXTENSIONS.join(', ').toUpperCase()} · máximo ${megabytes(maxAudioBytes)} MB`}
      hayCambiosSinGuardar={Boolean(archivo) || trabajando}
      onIntentoDeCerrarConCambios={() => undefined}
      pieIzquierda={
        precio !== null ? (
          <span className="font-mono text-[11px]">
            Costo: ${precio.toLocaleString('es-CO')}
            {/* El piso, no una tarifa plana: un audio muy largo cuesta lo que consumió. */}
            <span className="text-ink-400"> · más si el audio es muy largo</span>
          </span>
        ) : undefined
      }
      acciones={
        <>
          <button onClick={onCerrar} className="btn-neutral btn-sm" disabled={trabajando}>
            Cancelar
          </button>
          {/* El primario lleva la cifra: la sorpresa del costo es la que genera reclamos. */}
          <button
            onClick={() => archivo && onTranscribir(archivo, contexto)}
            disabled={!archivo || trabajando}
            className="btn-primary btn-sm"
          >
            {isUploading ? (
              <>
                <Upload className="h-3.5 w-3.5 animate-pulse" />
                Enviando la grabación…
              </>
            ) : isTranscribing ? (
              <>
                <Cpu className="h-3.5 w-3.5 animate-spin" />
                Transcribiendo…
              </>
            ) : (
              <>Transcribir{precio !== null ? ` · $${precio.toLocaleString('es-CO')}` : ''}</>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {/* ─── EL ARCHIVO ──────────────────────────────────────────────────── */}
        <div className="relative flex flex-col items-center rounded-card border-2 border-dashed border-line-200 bg-canvas p-6 text-center transition-colors hover:border-brand-700">
          <input
            type="file"
            accept={SUPPORTED_AUDIO_EXTENSIONS.map((e) => `.${e}`).join(',')}
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            disabled={trabajando}
            className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          />
          <FileAudio className="mb-2 h-7 w-7 text-brand-700" />
          {archivo ? (
            <>
              <span className="block font-mono text-[12px] font-semibold text-ink-900">
                {archivo.name}
              </span>
              <span className="font-mono text-[11px] text-verified">
                {megabytes(archivo.size)} MB
              </span>
            </>
          ) : (
            <>
              <span className="text-ui font-medium text-ink-900">Arrastre el archivo aquí</span>
              <span className="text-meta text-ink-500">o haga clic para buscarlo en su equipo</span>
            </>
          )}
        </div>

        {/* ─── EL PROCESO ──────────────────────────────────────────────────── */}
        <label className="block">
          <span className="field-label">Proceso al que pertenece</span>
          <input
            value={contexto}
            onChange={(e) => setContexto(e.target.value)}
            placeholder="Juzgado 18 Laboral de Bogotá · Mosquera vs. Colpensiones · rad. 2026-00904"
            disabled={trabajando}
            className="field mt-1 w-full"
          />
          <span className="mt-1 block text-meta text-ink-500">
            Partes, juzgado y radicado. No es adorno: con ese contexto los términos jurídicos se
            transcriben bien.
          </span>
        </label>

        {/* ─── QUÉ VA A PASAR ──────────────────────────────────────────────── */}
        <div className="rounded-card border border-line-200 bg-canvas px-4 py-3">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Qué va a pasar
          </p>
          <ul className="mt-2 space-y-1.5 text-ui leading-[1.5] text-ink-900">
            <li>· Se separan las voces y se numeran.</li>
            <li>· Usted les pone nombre una sola vez.</li>
            <li>
              · El audio de sala suele traer fragmentos poco claros:{' '}
              <span className="font-medium">se marcan, no se inventan</span>.
            </li>
            <li>· Queda «Por revisar» hasta que alguien la lea.</li>
          </ul>
        </div>

        {/*
          LO QUE PASA CON EL MATERIAL, dicho donde se decide y no en una página
          legal: el texto queda en la cuenta de la firma y se puede borrar; la
          grabación se borra apenas termina de transcribirse.
        */}
        <p className="text-meta leading-[1.6] text-ink-500">
          El texto de la transcripción queda guardado en su firma y puede borrarlo cuando quiera.{' '}
          <span className="font-medium text-ink-700">La grabación no se guarda</span>: se borra del
          almacenamiento apenas termina de transcribirse.
        </p>

        {error && (
          <p className="flex items-start gap-2 rounded-control border border-[rgb(var(--danger)/0.35)] bg-[rgb(var(--danger)/0.06)] p-2.5 text-ui text-danger">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
};
