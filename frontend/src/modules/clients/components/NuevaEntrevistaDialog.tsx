import React from 'react';
import { Check, Upload } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { ClientPicker } from './ClientPicker';
import type { Client } from '../clients.api';
import { RAZON_AUTORIZACION, TEXTO_AUTORIZACION } from '../useAutorizacionDeGrabacion';
import { horaEnPalabras, type PermisoDeGrabar } from '../entrevistaEnPantalla';
import { SUPPORTED_AUDIO_EXTENSIONS } from '../../transcription/types';

/**
 * «Nueva entrevista». Maqueta `app-audiencias-entrevistas.html:78`.
 *
 * ─── LO QUE SE TOMÓ DE LA MAQUETA Y LO QUE NO ──────────────────────────────
 *
 * Se tomó el FLUJO: un diálogo que se llena ANTES de grabar, con quién consulta
 * arriba, la autorización debajo y el botón de empezar apagado hasta que la
 * casilla esté marcada. Es la frase del README-app: «la autorización se
 * pregunta antes de grabar».
 *
 * NO se tomó lo que el producto no hace, porque aquí se leería igual que lo que
 * sí hace:
 *   · la segunda casilla, «firmó la autorización de tratamiento de datos», con
 *     su «puede firmarla después»: no existe esa constancia, solo la de
 *     grabación, y pintarla le diría al abogado que hay un documento que nadie
 *     guarda;
 *   · «Otras personas presentes» y «Sobre qué viene»: no hay dónde guardarlos
 *     y el guion no se arma con ellos;
 *   · «Grabar no consume saldo; transcribir sí»: transcribir es gratis
 *     (`billing.service.ts`, TRANSCRIPCION 0), así que el pie dice eso.
 *
 * El botón de empezar va en azul y no en el rojo de la maqueta: el rojo de
 * este sistema es de lo que destruye, y grabar no destruye nada. El rojo queda
 * para el punto de «grabando», que es un estado.
 */

interface NuevaEntrevistaDialogProps {
  abierto: boolean;
  onCerrar: () => void;
  clientId: string | null;
  onCliente: (id: string | null, ficha: Client | null) => void;
  autorizado: boolean;
  autorizadoEl: string | null;
  /** La hora la sella el gancho compartido, no este diálogo. */
  onAutorizar: (valor: boolean) => void;
  permiso: PermisoDeGrabar;
  onEmpezar: () => void;
  /** Una llamada grabada en el teléfono también es una entrevista. */
  onSubir?: (file: File) => void;
  maxAudioBytes: number;
  onPrivacidad?: () => void;
}

export const NuevaEntrevistaDialog: React.FC<NuevaEntrevistaDialogProps> = ({
  abierto,
  onCerrar,
  clientId,
  onCliente,
  autorizado,
  autorizadoEl,
  onAutorizar,
  permiso,
  onEmpezar,
  onSubir,
  maxAudioBytes,
  onPrivacidad
}) => {
  const archivo = React.useRef<HTMLInputElement>(null);
  const hora = horaEnPalabras(autorizadoEl);

  return (
    <Dialog
      abierto={abierto}
      onCerrar={onCerrar}
      tamano="M"
      titulo="Nueva entrevista"
      subtitulo="Antes de empezar a grabar, deje constancia de con quién es y de que autorizó la grabación."
      pieIzquierda={<span className="cn-ent-pie-nota">Grabar y transcribir no consumen saldo.</span>}
      acciones={
        <>
          <button type="button" onClick={onCerrar} className="cn-ini-boton cn-ini-boton--texto cn-ent-boton">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onEmpezar}
            disabled={!permiso.puede}
            title={permiso.razon ?? undefined}
            className="cn-ini-boton cn-ini-boton--primario cn-ent-boton"
          >
            Empezar a grabar
          </button>
        </>
      }
    >
      <div className="cn-ent-dlg">
        <div className="cn-ent-campo">
          <span className="cn-ent-rotulo">
            Quién consulta <span className="cn-ent-opcional">(opcional)</span>
          </span>
          <ClientPicker value={clientId} onChange={onCliente} />
        </div>

        <div className="cn-ent-campo">
          <span className="cn-ent-rotulo">Autorización</span>
          {/*
            LA CASILLA ES UN `input` DE VERDAD, pintado encima. Un `span` con
            aspecto de casilla no se marca con el teclado ni lo anuncia un
            lector de pantalla, y esta es la constancia que la ley exige.
          */}
          <label className={`cn-ent-autorizacion ${autorizado ? 'cn-ent-autorizacion--hecha' : 'cn-ent-autorizacion--pendiente'}`}>
            <span className="cn-ent-casilla">
              <input
                type="checkbox"
                checked={autorizado}
                onChange={(e) => onAutorizar(e.target.checked)}
              />
              <Check size={14} strokeWidth={3} aria-hidden="true" />
            </span>
            <span className="cn-ent-autorizacion-texto">
              <span className="cn-ent-autorizacion-titulo">{TEXTO_AUTORIZACION}</span>
              <span className="cn-ent-autorizacion-razon">{RAZON_AUTORIZACION}</span>
              {hora && (
                <span className="cn-ent-autorizacion-hora">
                  Registrada a las <span className="cn-ent-mono">{hora}</span>
                </span>
              )}
            </span>
          </label>
        </div>

        {onPrivacidad && (
          <p className="cn-ent-ayuda">
            Si el consultante pregunta quién más ve esto, la respuesta está en{' '}
            <button type="button" onClick={onPrivacidad} className="cn-ent-enlace">
              el registro de subencargados
            </button>
            : quién procesa sus datos, para qué y dónde.
          </p>
        )}

        <div className="cn-ent-subir">
          <div className="cn-ent-subir-texto">
            <span className="cn-ent-subir-titulo">¿Ya tiene la grabación?</span>
            <span className="cn-ent-ayuda">
              {SUPPORTED_AUDIO_EXTENSIONS.join(', ')} · máximo {(maxAudioBytes / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
          <input
            ref={archivo}
            type="file"
            accept="audio/*,video/mp4"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onSubir) onSubir(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => archivo.current?.click()}
            disabled={!permiso.puede || !onSubir}
            className="cn-ini-boton cn-ini-boton--blanco cn-ent-boton"
          >
            <Upload size={16} aria-hidden="true" />
            Subir un archivo
          </button>
        </div>

        <p className="cn-ent-nota cn-ent-nota--caja">
          <span className="cn-ent-fuerte">Qué se guarda:</span> el texto queda guardado en su firma y
          puede borrarlo cuando quiera. <span className="cn-ent-fuerte">La grabación no se guarda</span>: se
          borra del almacenamiento apenas termina de transcribirse.
        </p>

        {!permiso.puede && permiso.razon && <p className="cn-ent-aviso cn-ent-aviso--aviso">{permiso.razon}</p>}
      </div>
    </Dialog>
  );
};
