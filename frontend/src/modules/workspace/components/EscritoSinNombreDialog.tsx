import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { firmActuacionesApi } from '../../catalog/services/catalog.api';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import { MAX_OBJETIVO, MIN_OBJETIVO, tituloDeTrabajo } from '../../catalog/tituloDeTrabajo';
import type { ActuacionRole, LegalBranch } from '../../catalog/types';

/**
 * «Redactar sin actuación»: describir qué debe lograr el escrito.
 *
 * NO HAY ARTBOARD PARA ESTE DIÁLOGO. Se deriva de «Escribir la actuación yo»
 * (líneas 463–486 de `public/handoff/app-redaccion-revision.html`): la misma
 * anatomía —lo que esto implica primero, el campo después— porque la situación
 * es la misma, no hay ficha; lo único que cambia es que tampoco hay nombre.
 *
 * ─── EL HUECO QUE CIERRA ────────────────────────────────────────────────────
 *
 * «No está en la lista: la escribo yo» resuelve la actuación que el catálogo no
 * trae, y falla exactamente para quien no sabe cómo se llama. Un campo de nombre
 * obligatorio no le da un nombre: le pide que lo invente.
 *
 * ─── LA LÍNEA QUE NO SE CRUZA ───────────────────────────────────────────────
 *
 * «Recurso de reposición» es una figura del derecho: trae su artículo, su
 * término y su autoridad, y bautizar así un escrito sin ficha afirma las tres de
 * un golpe. Lo que se escribe aquí es un TÍTULO DE TRABAJO —qué se busca—,
 * rotulado como tal en la pantalla, en la lista y en las instrucciones que
 * recibe el motor, que tiene prohibido ponerle nombre de figura.
 *
 * SIGUE SIENDO CURABLE: se guarda por el mismo camino que una actuación propia,
 * y en «Catálogo» se le puede escribir el término con su fuente.
 */

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  legalBranch: string;
  userRole: ActuacionRole;
  /** Con el título de trabajo guardado: queda elegido en el acto. */
  onCreada: (exactName: string) => void;
  /** «Sé cómo se llama»: abre el diálogo de escribir la actuación. */
  onEscribirNombre: () => void;
}

export const EscritoSinNombreDialog: React.FC<Props> = ({ abierto, onCerrar, legalBranch, userRole, onCreada, onEscribirNombre }) => {
  const [objetivo, setObjetivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (abierto) {
      setObjetivo('');
      setError(null);
    }
  }, [abierto]);

  const limpio = objetivo.trim().replace(/\s+/g, ' ');
  const valido = limpio.length >= MIN_OBJETIVO && limpio.length <= MAX_OBJETIVO;

  const guardar = async () => {
    if (!valido) return;

    setGuardando(true);
    setError(null);

    try {
      const respuesta = await firmActuacionesApi.crear({
        area: legalBranch as LegalBranch,
        /*
         * EL PREFIJO VIAJA DENTRO DEL NOMBRE, no en un campo aparte:
         * `firm_actuaciones` no tiene una columna que diga «esto no es una
         * denominación jurídica», así que una marca fuera del nombre dejaría la
         * lista, la franja, el título y el motor pintándolo como una figura.
         */
        exactName: tituloDeTrabajo(limpio),
        role: userRole,
        note: null
      });

      onCreada(respuesta.actuacion.exactName);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'El escrito no pudo registrarse.');
    } finally {
      setGuardando(false);
    }
  };

  const rama = BRANCH_LABELS[legalBranch] ?? legalBranch;

  return (
    <Dialog
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Redactar sin actuación"
      subtitulo={`Describa qué debe lograr el escrito, sin nombre de figura. Quedará en ${rama}, para toda su firma.`}
      tamano="M"
      hayCambiosSinGuardar={limpio.length > 0}
      onIntentoDeCerrarConCambios={() => setError('Guarde la descripción o cierre con la ×.')}
      acciones={
        <div className="cara-nueva cn-red-dlg-acciones">
          <button type="button" onClick={onEscribirNombre} className="cn-red-dlg-boton">
            Sé cómo se llama: la escribo yo
          </button>
          <button type="button" onClick={() => void guardar()} disabled={!valido || guardando} className="cn-red-dlg-primario">
            {guardando && <Loader2 className="cn-red-dlg-svg animate-spin" aria-hidden />}
            Guardar y redactar
          </button>
        </div>
      }
    >
      <div className="cara-nueva cn-red-dlg">
        <div className="cn-red-dlg-aviso cn-red-dlg-aviso--sin">
          <p className="cn-red-dlg-aviso-titulo">Lo que esto implica</p>
          <p className="cn-red-dlg-aviso-texto">
            Ninguna ficha verificada respaldará este escrito. Saldrá sin artículo, sin término y sin autoridad comprobados; la guía tiene
            prohibido inventarlos y tampoco le pondrá nombre de figura, y el documento lo dirá. Cuando alguien de su firma sepa cuál es la
            actuación y lea la norma, puede escribir el término y su fuente en «Catálogo».
          </p>
        </div>

        <div className="cn-red-dlg-campo">
          <label className="cn-red-dlg-rotulo" htmlFor="objetivo-del-escrito">
            ¿Qué debe lograr este escrito?
          </label>
          <textarea
            id="objetivo-del-escrito"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            maxLength={MAX_OBJETIVO}
            placeholder="Que el despacho levante la medida sobre este bien porque la ley lo protege"
            className="cn-red-dlg-area cn-red-dlg-area--baja"
            autoFocus
          />
          <p className="cn-red-dlg-contador">
            <span>
              En sus palabras, sin nombre de figura. Entre {MIN_OBJETIVO} y {MAX_OBJETIVO} caracteres.
            </span>
            <span>{limpio.length}</span>
          </p>
        </div>

        {/*
          LO QUE SE VA A GUARDAR, A LA VISTA Y CON SU RÓTULO. El abogado tiene que
          ver el «Sin nombre —» ANTES de guardar: si aparece por primera vez en la
          lista, parecerá un defecto de la aplicación.
        */}
        {limpio.length > 0 && (
          <div className="cn-red-dlg-vista">
            <p className="cn-red-dlg-seccion">Quedará en la lista como</p>
            <p className="cn-red-dlg-vista-nombre">{tituloDeTrabajo(limpio)}</p>
            <p className="cn-red-dlg-nota">Es un título de trabajo, no el nombre de una figura jurídica. Sirve para encontrar el escrito; no dice qué actuación es.</p>
          </div>
        )}

        {error && <p className="cn-red-dlg-error">{error}</p>}
      </div>
    </Dialog>
  );
};
