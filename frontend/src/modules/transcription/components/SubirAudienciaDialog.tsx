import React, { useEffect, useState } from 'react';
import { Dialog } from '../../../design/Dialog';
import { billingApi } from '../../billing/billing.api';
import { SUPPORTED_AUDIO_EXTENSIONS } from '../types';
import { SelectorDeExpediente } from '../../expedientes/components/SelectorDeExpediente';
import { esperaDeTranscripcion, limiteDeSubida, megabytesEnPalabras } from '../audienciaEnPantalla';

/**
 * Subir una grabación. Artboard `app-audiencias-entrevistas.html`:158.
 *
 * ─── LO QUE SE ADOPTA Y LO QUE NO ──────────────────────────────────────────
 *
 * Se adopta la forma: la franja de soltar el archivo con «Elegir archivo», dos
 * campos lado a lado y el pie con la línea de estado a la izquierda. No se
 * adopta nada que el producto no haga:
 *   · «Hasta 500 MB · mp3, m4a, wav, mp4» → el límite que manda el SERVIDOR y
 *     los formatos de `SUPPORTED_AUDIO_EXTENSIONS`, que incluyen webm y mpga;
 *   · «Cómo la llama» y las fichas de «Quiénes intervienen» → no existen; el
 *     campo real es el CONTEXTO en texto libre, que viaja al motor;
 *   · «Se cobra por duración… $6.000» → transcribir no se cobra. El pie lo dice
 *     solo cuando el servidor informa precio cero, y calla si no responde.
 *
 * ─── LA ESPERA ES ESTE MISMO DIÁLOGO ───────────────────────────────────────
 *
 * Artboard :248 pinta «Transcribiendo» con pasos y avance parcial. Transcribir
 * es una sola llamada: aquí se ven los dos estados reales del gancho —enviando
 * con su porcentaje, transcribiendo sin cifra— en el lugar donde se pidió, y
 * el diálogo no se deja cerrar mientras dura, porque cerrarlo no cancela nada.
 */

interface SubirAudienciaDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  maxAudioBytes: number;
  isUploading: boolean;
  /** De 0 a 99. La espera no se acorta, pero deja de parecer un cuelgue. */
  uploadProgress?: number;
  isTranscribing: boolean;
  error: string | null;
  /** El tercer argumento es el caso, vacío cuando la firma no tiene expedientes o no escogió. */
  onTranscribir: (archivo: File, contexto: string, expedienteId: string) => void;
}

export const SubirAudienciaDialog: React.FC<SubirAudienciaDialogProps> = ({
  abierto,
  onCerrar,
  maxAudioBytes,
  isUploading,
  uploadProgress = 0,
  isTranscribing,
  error,
  onTranscribir
}) => {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [contexto, setContexto] = useState('');
  /*
   * DE QUÉ CASO ES LA GRABACIÓN. Una audiencia pertenece a un proceso, así que
   * puede nacer atada en vez de jalarse después desde Expedientes.
   */
  const [expedienteId, setExpedienteId] = useState('');
  const [precio, setPrecio] = useState<number | null>(null);
  /*
   * Si hubo un envío APARTE de la transcripción. Por la ruta de almacenamiento
   * el archivo viaja primero y luego se transcribe; por la directa las dos
   * cosas son la misma petición, y pintar «Enviar la grabación» como un paso
   * cumplido sería afirmar algo que no se observó.
   */
  const [huboEnvio, setHuboEnvio] = useState(false);

  const trabajando = isUploading || isTranscribing;
  const espera = esperaDeTranscripcion({ subiendo: isUploading, progreso: uploadProgress, transcribiendo: isTranscribing });

  useEffect(() => {
    if (isUploading) setHuboEnvio(true);
    if (!trabajando && !isUploading) setHuboEnvio(false);
  }, [isUploading, trabajando]);

  /*
   * EL PRECIO, DEL SERVIDOR, Y SOLO PARA DECIR QUE NO HAY. Transcribir dejó de
   * cobrarse; «Transcribir no consume saldo» se escribe únicamente cuando el
   * servidor lo confirma con un cero. Si no responde, el pie calla: una cifra
   * o una gratuidad supuestas son la misma clase de mentira.
   */
  useEffect(() => {
    if (!abierto || precio !== null) return;
    billingApi
      .summary()
      .then((r) => setPrecio(typeof r.prices?.TRANSCRIPCION === 'number' ? r.prices.TRANSCRIPCION : null))
      .catch(() => setPrecio(null));
  }, [abierto, precio]);

  const pesaDemasiado = Boolean(archivo && archivo.size > maxAudioBytes);

  return (
    <div className="cn-aud-dialogos">
      <Dialog
        abierto={abierto}
        onCerrar={trabajando ? () => undefined : onCerrar}
        tamano="M"
        titulo="Subir una grabación"
        subtitulo="La del despacho o la suya. Iureon separa a cada interlocutor y propone su rol."
        hayCambiosSinGuardar={Boolean(archivo) || trabajando}
        onIntentoDeCerrarConCambios={() => undefined}
        pieIzquierda={!trabajando && precio === 0 ? <span className="cn-aud-pie-nota">Transcribir no consume saldo.</span> : <span />}
        acciones={
          <>
            <button type="button" onClick={onCerrar} className="cn-ini-boton cn-ini-boton--texto cn-aud-boton" disabled={trabajando}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => archivo && onTranscribir(archivo, contexto, expedienteId)}
              disabled={!archivo || trabajando || pesaDemasiado}
              className="cn-ini-boton cn-ini-boton--primario cn-aud-boton"
            >
              {trabajando ? 'Un momento…' : 'Subir y transcribir'}
            </button>
          </>
        }
      >
        {espera ? (
          <div className="cn-aud-espera" role="status" aria-live="polite">
            <div className="cn-aud-espera-cabeza">
              <span className="cn-aud-giro" aria-hidden="true" />
              <div>
                <p className="cn-aud-espera-titulo">{espera.titulo}</p>
                {archivo && (
                  <p className="cn-aud-nota">
                    {archivo.name} · {megabytesEnPalabras(archivo.size)}
                  </p>
                )}
              </div>
            </div>

            {huboEnvio ? (
              <ol className="cn-aud-pasos">
                <li className={espera.paso === 'enviando' ? 'cn-aud-paso cn-aud-paso--actual' : 'cn-aud-paso cn-aud-paso--hecho'}>
                  {espera.paso === 'enviando' ? `Enviando la grabación · ${espera.detalle}` : 'Grabación enviada'}
                </li>
                <li className={espera.paso === 'transcribiendo' ? 'cn-aud-paso cn-aud-paso--actual' : 'cn-aud-paso'}>
                  Transcribir y separar las voces
                </li>
              </ol>
            ) : null}

            {espera.paso === 'transcribiendo' && <p className="cn-aud-nota">{espera.detalle}</p>}
            <p className="cn-aud-nota">
              Al terminar, la grabación se borra del almacenamiento y se abre el transcrito.
            </p>
          </div>
        ) : (
          <div className="cn-aud-dlg">
            {/* ─── EL ARCHIVO ──────────────────────────────────────────────── */}
            <div className={`cn-aud-soltar${archivo ? ' cn-aud-soltar--lleno' : ''}`}>
              <input
                type="file"
                aria-label="Elegir la grabación"
                accept={SUPPORTED_AUDIO_EXTENSIONS.map((e) => `.${e}`).join(',')}
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="cn-aud-soltar-entrada"
              />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="cn-aud-soltar-icono">
                <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
                <polyline points="8 9 12 5 16 9" />
                <line x1="12" y1="5" x2="12" y2="16" />
              </svg>
              <div className="cn-aud-soltar-textos">
                <p className="cn-aud-soltar-titulo">
                  {archivo ? `${archivo.name} · ${megabytesEnPalabras(archivo.size)}` : 'Suelte aquí el audio o el video de la audiencia'}
                </p>
                <p className="cn-aud-nota">{limiteDeSubida(maxAudioBytes, SUPPORTED_AUDIO_EXTENSIONS)}</p>
              </div>
              <span className="cn-ini-boton cn-ini-boton--blanco cn-aud-boton cn-aud-soltar-boton" aria-hidden="true">
                {archivo ? 'Cambiar' : 'Elegir archivo'}
              </span>
            </div>

            {pesaDemasiado && archivo && (
              <p className="cn-aud-nota cn-aud-nota--aviso">
                Este archivo pesa {megabytesEnPalabras(archivo.size)} y el límite es {megabytesEnPalabras(maxAudioBytes)}.
                Divida la grabación en partes y súbalas por separado.
              </p>
            )}

            <div className="cn-aud-campos">
              {/* ─── EL CONTEXTO ─────────────────────────────────────────── */}
              <div className="cn-aud-campo">
                <label className="cn-aud-rotulo" htmlFor="contexto-de-la-audiencia">
                  Proceso al que pertenece <span className="cn-aud-opcional">(opcional)</span>
                </label>
                <input
                  id="contexto-de-la-audiencia"
                  value={contexto}
                  onChange={(e) => setContexto(e.target.value)}
                  placeholder="Juzgado 00 Civil Municipal · Demandante vs. Demandado · rad. 00000-00-00-000-0000-00000-00"
                  className="cn-aud-entrada"
                />
                <p className="cn-aud-nota">
                  Partes, juzgado y radicado. Con ese contexto los nombres y los términos jurídicos se transcriben
                  mejor.
                </p>
              </div>

              {/*
                EL CASO VA APARTE DEL CONTEXTO, y son cosas distintas aunque lo
                parezcan. El contexto es TEXTO que viaja al motor; el expediente
                es la ATADURA, y no cambia una sola palabra del transcrito.
                Juntarlos haría que escoger el caso pareciera mejorar la
                transcripción, que no.
              */}
              <div className="cn-aud-campo">
                <SelectorDeExpediente
                  cara="nueva"
                  valor={expedienteId}
                  onCambio={setExpedienteId}
                  etiqueta="Caso (opcional)"
                  id="expediente-de-la-audiencia"
                  pie="La audiencia queda contada dentro del caso, y desde ahí se prepara el interrogatorio."
                />
              </div>
            </div>

            {/*
              LO QUE PASA CON EL MATERIAL, dicho donde se decide y no en una
              página legal. La maqueta dice que el audio se guarda en la cuenta
              de la firma; el servidor lo borra antes de responder.
            */}
            <p className="cn-aud-nota cn-aud-nota--caja">
              <span className="cn-aud-fuerte">La grabación no se guarda:</span> se borra del almacenamiento apenas
              termina de transcribirse. El texto queda en su firma y puede borrarlo cuando quiera.
            </p>

            {error && (
              <div className="cn-aud-aviso cn-aud-aviso--peligro" role="alert">
                <p className="cn-aud-aviso-titulo">No se pudo transcribir</p>
                <p className="cn-aud-aviso-texto">{error}</p>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};
