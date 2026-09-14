import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { firmActuacionesApi } from '../../catalog/services/catalog.api';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import type { ActuacionRole, LegalBranch } from '../../catalog/types';

/**
 * «No está en la lista: la escribo yo». Artboard «Escribir la actuación yo»
 * (líneas 463–486 de `public/handoff/app-redaccion-revision.html`).
 *
 * ─── POR QUÉ ESTO NO CONTRADICE AL CATÁLOGO ─────────────────────────────────
 *
 * La regla de la casa es que un término afirmado sin comprobar es peor que su
 * ausencia. Aquí no se afirma ninguno: se guarda un NOMBRE. El artículo, el
 * término y las secciones quedan declarados como no verificados en la lista, en
 * la franja sobre el papel y en las instrucciones que recibe el modelo, que
 * tiene prohibido inventarlos.
 *
 * NO SE PIDE EL TÉRMINO AQUÍ, y es deliberado: un plazo tecleado de memoria es
 * indistinguible de uno verificado en cuanto queda guardado. El término se
 * escribe en «Catálogo», con su fuente al lado.
 *
 * «LO QUE ESTO IMPLICA» VA PRIMERO, como en el artboard: es la condición de lo
 * que se crea, y leída después del campo ya no cambia la decisión.
 *
 * ─── LO QUE EL ARTBOARD PIDE Y AQUÍ NO ESTÁ, con la razón ───────────────────
 *
 * · El selector «Rama (para clasificarla)». La rama es la de la cascada: una
 *   segunda elección aquí podría guardar la actuación en una rama y dejar el
 *   escrito resolviéndose en otra. Se dice en el subtítulo dónde queda.
 * · «Qué debe llevar el escrito». La actuación de la firma no guarda secciones.
 * · «Proponerla al catálogo de Iureon». No existe ese flujo.
 * · «Volver a buscar en el catálogo». Cerrar con «Cancelar» o la × ya devuelve
 *   a la lista; un tercer botón para lo mismo obligaría a preguntarse la diferencia.
 * · «Es un título de trabajo, no la denominación jurídica…». Eso describe a
 *   «Redactar sin actuación»; aquí el abogado sí escribe un nombre.
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

export const ActuacionPropiaDialog: React.FC<Props> = ({ abierto, onCerrar, legalBranch, userRole, onCreada }) => {
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
       * cubre lo que se pidió. Ese mensaje es LO ÚTIL —dice cuál elegir—.
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
      titulo="Escribir la actuación yo"
      subtitulo={`Para lo que el catálogo todavía no trae. Quedará en la lista de ${rama}, para toda su firma.`}
      hayCambiosSinGuardar={limpio.length > 0}
      onIntentoDeCerrarConCambios={() => setError('Guarde la actuación o cierre con la ×.')}
      acciones={
        <div className="cara-nueva cn-red-dlg-acciones">
          <button type="button" onClick={onCerrar} className="cn-red-dlg-boton">
            Cancelar
          </button>
          <button type="button" onClick={() => void guardar()} disabled={!valido || guardando} className="cn-red-dlg-primario">
            {guardando && <Loader2 className="cn-red-dlg-svg animate-spin" aria-hidden />}
            Guardar y elegirla
          </button>
        </div>
      }
    >
      <div className="cara-nueva cn-red-dlg">
        <div className="cn-red-dlg-aviso cn-red-dlg-aviso--sin">
          <p className="cn-red-dlg-aviso-titulo">Lo que esto implica</p>
          <p className="cn-red-dlg-aviso-texto">
            Ninguna norma comprobada respaldará su artículo ni su estructura, y la guía tiene prohibido inventarlos. El escrito lo dirá arriba, y
            si afirma un plazo, ese plazo no vendrá del catálogo: tendrá que confirmarlo usted contra la norma. Cuando alguien de su firma lea la
            norma, escriba el término y su fuente en «Catálogo» y la advertencia desaparece.
          </p>
        </div>

        <div className="cn-red-dlg-campo">
          <label className="cn-red-dlg-rotulo" htmlFor="nombre-actuacion-propia">
            Cómo la llama
          </label>
          <input
            id="nombre-actuacion-propia"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={MAX}
            placeholder="Como la nombraría en el escrito"
            className="cn-red-dlg-entrada"
            autoFocus
          />
          <p className="cn-red-dlg-contador">
            <span>
              Entre {MIN} y {MAX} caracteres.
            </span>
            <span>{limpio.length}</span>
          </p>
        </div>

        <div className="cn-red-dlg-campo">
          <label className="cn-red-dlg-rotulo" htmlFor="nota-actuacion-propia">
            Nota para su firma <span className="cn-red-dlg-opcional">(opcional)</span>
          </label>
          <textarea
            id="nota-actuacion-propia"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            maxLength={400}
            placeholder="Para qué la usan, ante quién se radica, qué conviene recordar."
            className="cn-red-dlg-area cn-red-dlg-area--baja"
          />
        </div>

        {error && <p className="cn-red-dlg-error">{error}</p>}
      </div>
    </Dialog>
  );
};
