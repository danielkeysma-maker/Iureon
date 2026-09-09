import React, { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Dialog } from '../../../design/Dialog';
import { firmActuacionesApi } from '../../catalog/services/catalog.api';
import { BRANCH_LABELS } from '../../catalog/branchLabels';
import { MAX_OBJETIVO, MIN_OBJETIVO, tituloDeTrabajo } from '../../catalog/tituloDeTrabajo';
import type { ActuacionRole, LegalBranch } from '../../catalog/types';

/**
 * «No sé cómo se llama: describir qué debe lograr el escrito».
 *
 * ─── EL HUECO QUE CIERRA ────────────────────────────────────────────────────
 *
 * «Ninguna de estas: escribir el nombre…» resolvió la actuación que el catálogo
 * no trae, y falla exactamente para quien no sabe cómo se llama — que es el
 * abogado para el que se construyó todo esto. Un campo de nombre obligatorio no
 * le da un nombre: le pide que lo invente.
 *
 * ─── POR QUÉ EL NOMBRE NO ERA LO QUE FALTABA ────────────────────────────────
 *
 * Lo que Redacción consume de una ficha son cuatro cosas: las secciones
 * obligatorias, la autoridad competente, el fundamento y el término. Sin ficha
 * no hay ninguna de las cuatro, y ningún nombre —tecleado por el abogado o
 * propuesto por un modelo— aporta una sola. Lo único que cambia al exigirlo es
 * que aparece en el escrito una denominación que nadie comprobó.
 *
 * ─── LA LÍNEA QUE NO SE CRUZA ───────────────────────────────────────────────
 *
 * «Recurso de reposición» es una figura del derecho: trae su artículo, su
 * término y su autoridad, y bautizar así un escrito sin ficha afirma las tres
 * de un golpe. Lo que se escribe aquí es un TÍTULO DE TRABAJO —qué se busca—,
 * rotulado como tal en la pantalla, en la lista y en las instrucciones que
 * recibe el motor, que tiene prohibido ponerle nombre de figura.
 *
 * ─── SIGUE SIENDO CURABLE ───────────────────────────────────────────────────
 *
 * Se guarda por el mismo camino que una actuación propia (`firm_actuaciones`),
 * así que después alguien de la firma puede abrirla en «Catálogo», leer la
 * norma, escribir el término con su fuente y convertirla en ficha de verdad.
 * No es un callejón sin salida: es el mismo circuito, entrando sin nombre.
 */

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  legalBranch: string;
  userRole: ActuacionRole;
  /** Con el título de trabajo guardado: queda elegido en el acto. */
  onCreada: (exactName: string) => void;
  /** «Sí sé cómo se llama»: abre el diálogo de escribir el nombre. */
  onEscribirNombre: () => void;
}

export const EscritoSinNombreDialog: React.FC<Props> = ({
  abierto,
  onCerrar,
  legalBranch,
  userRole,
  onCreada,
  onEscribirNombre
}) => {
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
         * EL PREFIJO VIAJA DENTRO DEL NOMBRE, no en un campo aparte, y esa es
         * la decisión de fondo. `firm_actuaciones` no tiene una columna que
         * diga «esto no es una denominación jurídica», así que una marca fuera
         * del nombre habría dejado el desplegable, la barra de procedencia, el
         * título del documento y las instrucciones del motor pintando el
         * título de trabajo como si fuera el nombre de una figura.
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
      titulo="Describir qué debe lograr el escrito"
      subtitulo={`Sin ponerle nombre de actuación. Quedará en ${rama}, para toda su firma.`}
      tamano="M"
      hayCambiosSinGuardar={limpio.length > 0}
      onIntentoDeCerrarConCambios={() => setError('Guarde la descripción o cierre con la ×.')}
      acciones={
        <>
          <button type="button" onClick={onEscribirNombre} className="btn-neutral">
            Sí sé cómo se llama
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={!valido || guardando}
            className="btn-primary"
          >
            {guardando && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Guardar y redactar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="field-label" htmlFor="objetivo-del-escrito">
            ¿Qué debe lograr este escrito?
          </label>
          <textarea
            id="objetivo-del-escrito"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            maxLength={MAX_OBJETIVO}
            placeholder="Que el juez levante el embargo sobre este bien porque es inembargable"
            className="field-area min-h-[80px]"
            autoFocus
          />
          <p className="mt-1 flex justify-between text-meta text-ink-400">
            <span className="min-w-0 [overflow-wrap:anywhere]">
              En sus palabras, sin nombre de figura. Entre {MIN_OBJETIVO} y {MAX_OBJETIVO} caracteres.
            </span>
            <span className="shrink-0 font-mono">{limpio.length}</span>
          </p>
        </div>

        {/*
          LO QUE SE VA A GUARDAR, A LA VISTA Y CON SU RÓTULO. El abogado tiene
          que ver el «Sin nombre —» ANTES de guardar, porque es lo que va a leer
          después en el desplegable y en la barra del borrador: si aparece por
          primera vez ahí, parecerá un defecto de la aplicación.
        */}
        {limpio.length > 0 && (
          <div className="rounded-card border border-line-200 bg-canvas px-3 py-2.5">
            <p className="field-label mb-1">Quedará en la lista como</p>
            <p className="text-ui font-semibold text-ink-900 [overflow-wrap:anywhere]">
              {tituloDeTrabajo(limpio)}
            </p>
            <p className="mt-1 text-justify text-meta leading-snug text-ink-500 [text-wrap:pretty] [overflow-wrap:anywhere]">
              Es un título de trabajo, no el nombre de una figura jurídica. Sirve para encontrar el
              escrito; no dice qué actuación es.
            </p>
          </div>
        )}

        {/*
          EL AVISO NO ES LETRA PEQUEÑA: es la condición de lo que se está
          creando, y es la MISMA advertencia de «escribir el nombre», porque la
          situación es la misma — no hay ficha —. Lo único que cambia es que
          aquí tampoco hay nombre.
        */}
        <p className="notice-unverified">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-unverified" />
          <span className="text-justify [text-wrap:pretty] [overflow-wrap:anywhere]">
            <b className="font-semibold">Ninguna ficha verificada respaldará este escrito.</b> Se
            redactará sin artículo, sin término y sin autoridad comprobados, la guía tiene prohibido
            inventarlos y tampoco le pondrá nombre de figura: lo dirá en el propio documento. Cuando
            alguien de su firma sepa cuál es la actuación y lea la norma, escriba el término y su
            fuente en <b className="font-semibold">Catálogo</b> y la advertencia desaparece.
          </span>
        </p>

        {error && (
          <p className="rounded-card border border-[rgb(var(--danger-line))] bg-[rgb(var(--danger)/0.06)] px-3 py-2.5 text-justify text-ui text-danger [text-wrap:pretty] [overflow-wrap:anywhere]">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
};
