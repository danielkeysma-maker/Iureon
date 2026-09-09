import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { firmActuacionesApi } from '../../catalog/services/catalog.api';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import type { ActuacionRole, LegalBranch } from '../../catalog/types';

/**
 * «Ninguna de estas: escribir el nombre…»
 *
 * ─── POR QUÉ ESTO NO CONTRADICE AL CATÁLOGO ─────────────────────────────────
 *
 * La regla de la casa es que un término afirmado sin comprobar es peor que su
 * ausencia. Aquí no se afirma ninguno: se guarda un NOMBRE. El artículo, el
 * término y las secciones quedan declarados como no verificados en la lista, en
 * la barra sobre el papel y en las instrucciones que recibe el modelo, que
 * tiene prohibido inventarlos.
 *
 * La alternativa real, cuando la rama no trae la actuación, no era una ficha
 * mejor: era redactar bajo la ficha equivocada —que sí afirma un plazo, y el de
 * otro— o no redactar.
 *
 * NO SE PIDE EL TÉRMINO AQUÍ, y es deliberado. Un campo de plazo en el momento
 * de crear invita a escribir el que uno recuerda, sin abrir la norma; y un
 * plazo tecleado de memoria es indistinguible de uno verificado en cuanto queda
 * guardado. El término se escribe en «Catálogo», con su fuente al lado, que es
 * el mismo sitio y el mismo formulario con el que la firma cura cualquier otra
 * ficha.
 */

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  legalBranch: string;
  userRole: ActuacionRole;
  /** Con el nombre exacto guardado: queda elegido en el acto. */
  onCreada: (exactName: string) => void;
}

const MIN = 4;
const MAX = 120;

export const ActuacionPropiaDialog: React.FC<Props> = ({
  abierto,
  onCerrar,
  legalBranch,
  userRole,
  onCreada
}) => {
  const [nombre, setNombre] = useState('');
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setNombre('');
      setNota('');
      setError(null);
    }
  }, [abierto]);

  const limpio = nombre.trim().replace(/\s+/g, ' ');
  const valido = limpio.length >= MIN && limpio.length <= MAX;

  const guardar = async () => {
    if (!valido) return;

    setGuardando(true);
    setError(null);

    try {
      const respuesta = await firmActuacionesApi.crear({
        area: legalBranch as LegalBranch,
        exactName: limpio,
        role: userRole,
        note: nota.trim() || null
      });

      onCreada(respuesta.actuacion.exactName);
    } catch (e) {
      /*
       * El servidor responde 409 con el nombre de la actuación publicada que ya
       * cubre lo que se pidió. Ese mensaje es LO ÚTIL —dice cuál elegir— así
       * que se muestra tal cual en vez de un «no se pudo guardar».
       */
      setError(e instanceof Error ? e.message : 'La actuación no pudo guardarse.');
    } finally {
      setGuardando(false);
    }
  };

  const rama = BRANCH_LABELS[legalBranch] ?? legalBranch;

  return (
    <Dialog
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Escribir el nombre de la actuación"
      subtitulo={`Quedará en la lista de ${rama}, para toda su firma.`}
      hayCambiosSinGuardar={limpio.length > 0}
      onIntentoDeCerrarConCambios={() => setError('Guarde la actuación o cierre con la ×.')}
      acciones={
        <>
          <button type="button" onClick={onCerrar} className="btn-neutral">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={!valido || guardando}
            className="btn-primary"
          >
            {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar y elegirla
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="field-label" htmlFor="nombre-actuacion-propia">
            Nombre de la actuación
          </label>
          <input
            id="nombre-actuacion-propia"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={MAX}
            placeholder="Como la nombraría en el escrito"
            className="field"
            autoFocus
          />
          <p className="mt-1 flex justify-between text-meta text-ink-400">
            <span>Entre {MIN} y {MAX} caracteres.</span>
            <span className="font-mono">{limpio.length}</span>
          </p>
        </div>

        <div>
          <label className="field-label" htmlFor="nota-actuacion-propia">
            Nota para su firma <span className="normal-case text-ink-400">(opcional)</span>
          </label>
          <textarea
            id="nota-actuacion-propia"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={400}
            placeholder="Para qué la usan, ante quién se radica, qué conviene recordar."
            className="field-area min-h-[80px]"
          />
        </div>

        {/*
          EL AVISO NO ES LETRA PEQUEÑA: es la condición de lo que se está
          creando, y va con el mismo tratamiento ámbar con el que el resto de la
          aplicación marca lo no verificado.
        */}
        <p className="notice-unverified">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-unverified" />
          <span className="text-justify [text-wrap:pretty]">
            <b className="font-semibold">Ninguna norma verificada la respaldará.</b> El escrito se
            redactará sin artículo ni término comprobados, y la guía tiene prohibido inventarlos: lo
            dirá en el propio documento. Cuando alguien de su firma lea la norma, escriba el término
            y su fuente en <b className="font-semibold">Catálogo</b> y la advertencia desaparece.
          </span>
        </p>

        {error && (
          <p className="rounded-card border border-[rgb(var(--danger-line))] bg-[rgb(var(--danger)/0.06)] px-3 py-2.5 text-justify text-ui text-danger [text-wrap:pretty]">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
};
