import React, { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useTenant } from '../../tenant/TenantContext';
import type { Actuacion, LegalBranch, TermStatus, VerificationInput } from '../types';

interface VerificationFormProps {
  actuacion: Actuacion;
  isSaving: boolean;
  error: string | null;
  onSave: (input: VerificationInput) => Promise<boolean>;
  onRevert: (actuacionId: string, rama?: LegalBranch | null) => Promise<boolean>;
  onClose: () => void;
  /** La franja que repite término, norma y autoridad. Se apaga donde ya se muestra la ficha completa. */
  conResumen?: boolean;
  /** La cabecera con el nombre. Se apaga dentro de la ficha, que ya tiene la suya. */
  conCabecera?: boolean;
}

/*
 * «NO CADUCA» AL MISMO NIVEL QUE «TIENE TÉRMINO». Son tres respuestas del mismo
 * peso a una misma pregunta, y ninguna se esconde detrás de otra: quien lee la
 * norma y encuentra que no fija plazo tiene una respuesta verificada, no un
 * hueco.
 */
const STATUS_OPTIONS: { value: TermStatus; label: string; help: string }[] = [
  {
    value: 'VERIFICADO',
    label: 'Tiene término',
    help: 'La norma fija un plazo y usted lo leyó en su texto.'
  },
  {
    value: 'NO_CADUCA',
    label: 'No caduca',
    help: 'La norma dice expresamente que puede presentarse en cualquier tiempo.'
  },
  {
    value: 'NO_VERIFICADO',
    label: 'Sin verificar',
    help: 'Nadie lo ha comprobado. La aplicación advertirá en lugar de afirmar.'
  }
];

/**
 * Donde un abogado confirma el término de una actuación contra la norma, una
 * vez, para todos los escritos posteriores de su firma.
 *
 * Artboard 4 de `app-buscador-catalogo.html` («Verificar una actuación del
 * catálogo») para la entrada, y la anatomía del formulario de curaduría del
 * mismo artboard: etiqueta encima, campo sobre gris, primario abajo a la
 * derecha.
 *
 * El formulario refleja las reglas del backend en vez de confiar en ellas en
 * silencio: un término afirmado necesita su texto y su fuente, y «sin
 * verificar» esconde esos campos, porque un plazo escrito bajo ese estado sería
 * justo el plazo sin comprobar que el catálogo existe para impedir. El servidor
 * valida igual; esto evita que el abogado escriba para ser rechazado después.
 */
export const VerificationForm: React.FC<VerificationFormProps> = ({
  actuacion,
  isSaving,
  error,
  onSave,
  onRevert,
  onClose,
  conResumen = true,
  conCabecera = true
}) => {
  const { currentUserEmail } = useTenant();

  const [termStatus, setTermStatus] = useState<TermStatus>(actuacion.term.status);
  const [termDescription, setTermDescription] = useState(actuacion.term.description ?? '');
  const [legalBasis, setLegalBasis] = useState(actuacion.legalBasis);
  const [sourceUrl, setSourceUrl] = useState(actuacion.sourceUrl ?? '');
  const [note, setNote] = useState(actuacion.verification?.note ?? '');
  const [verifiedBy, setVerifiedBy] = useState(actuacion.verification?.verifiedBy ?? currentUserEmail);

  // Se reinicia cuando el abogado pasa a otra actuación sin cerrar el panel.
  useEffect(() => {
    setTermStatus(actuacion.term.status);
    setTermDescription(actuacion.term.description ?? '');
    setLegalBasis(actuacion.legalBasis);
    setSourceUrl(actuacion.sourceUrl ?? '');
    setNote(actuacion.verification?.note ?? '');
    setVerifiedBy(actuacion.verification?.verifiedBy ?? currentUserEmail);
  }, [actuacion, currentUserEmail]);

  const claimsTerm = termStatus !== 'NO_VERIFICADO';
  const canSubmit =
    verifiedBy.trim().length > 0 &&
    (!claimsTerm || (termDescription.trim().length > 0 && sourceUrl.trim().length > 0));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit || isSaving) return;

    const saved = await onSave({
      actuacionId: actuacion.id,
      /*
       * LA RAMA EN LA QUE SE VERIFICA, y solo cuando la ficha llegó aquí
       * prestada. Sin ella, el término que el socio acaba de leer para familia
       * se guardaría contra la ficha civil y reemplazaría su plazo, que es otro
       * y ya está verificado.
       */
      rama: actuacion.porRemision?.paraRama ?? null,
      termStatus,
      termDescription: claimsTerm ? termDescription.trim() : null,
      legalBasis: legalBasis.trim() || null,
      sourceUrl: sourceUrl.trim() || null,
      note: note.trim() || null,
      verifiedBy: verifiedBy.trim()
    });

    if (saved) onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="cn-cat-form">
      {conCabecera && (
        <header className="cn-cat-form-cabeza">
          <div className="min-w-0">
            <h2 className="cn-cat-form-titulo">{actuacion.exactName}</h2>
            <p className="cn-cat-nota">Verificar el término contra la norma</p>
          </div>
          <button type="button" onClick={onClose} className="cn-cat-cerrar" aria-label="Cerrar">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
      )}

      {/*
        EL RESUMEN SE APAGA DONDE YA ESTÁ LA FICHA. Duplicado, empujaba los
        campos fuera de la pantalla y el abogado veía dos veces lo que ya sabía
        y ni una el formulario que venía a llenar.
      */}
      {conResumen && (
        <dl className="cn-cat-resumen">
          <div>
            <dt>Término</dt>
            <dd>
              {actuacion.term.status === 'NO_CADUCA'
                ? 'No caduca'
                : actuacion.term.description
                  ? actuacion.term.description.length > 90
                    ? `${actuacion.term.description.slice(0, 90)}…`
                    : actuacion.term.description
                  : 'Sin término registrado'}
            </dd>
          </div>
          <div>
            <dt>Norma</dt>
            <dd className="cn-cat-resumen-cita">{actuacion.legalBasis || 'Sin artículo'}</dd>
          </div>
        </dl>
      )}

      <div className="cn-cat-form-cuerpo">
        {actuacion.verification && (
          <p className="cn-cat-sobre">
            Verificada por <b>{actuacion.verification.verifiedBy}</b> el{' '}
            {new Date(actuacion.verification.verifiedAt).toLocaleDateString('es-CO')}. El catálogo base decía:{' '}
            <em>{actuacion.verification.replaced.description ?? 'término no verificado'}</em>.
          </p>
        )}

        <fieldset className="cn-cat-opciones">
          <legend className="cn-cat-etiqueta">Estado del término</legend>
          {STATUS_OPTIONS.map((option) => {
            const selected = termStatus === option.value;
            return (
              <label key={option.value} className={`cn-cat-opcion${selected ? ' cn-cat-opcion--activa' : ''}`}>
                <input
                  type="radio"
                  name="termStatus"
                  className="sr-only"
                  checked={selected}
                  onChange={() => setTermStatus(option.value)}
                />
                <span className="cn-cat-opcion-marca" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="cn-cat-opcion-titulo">{option.label}</span>
                  <span className="cn-cat-opcion-ayuda">{option.help}</span>
                </span>
              </label>
            );
          })}
        </fieldset>

        {claimsTerm && (
          <>
            <label className="cn-cat-campo-grupo">
              <span className="cn-cat-etiqueta">Término, como lo dice la norma</span>
              <textarea
                value={termDescription}
                onChange={(e) => setTermDescription(e.target.value)}
                rows={3}
                placeholder="Cópielo del artículo: el plazo, sus unidades y desde cuándo corre."
                className="cn-cat-area"
              />
            </label>

            <label className="cn-cat-campo-grupo">
              <span className="cn-cat-etiqueta">Fuente donde lo verificó</span>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://… (el texto oficial de la norma)"
                className="cn-cat-entrada"
              />
              <span className="cn-cat-nota">Obligatoria. Sin fuente no es una verificación, es una afirmación.</span>
            </label>
          </>
        )}

        <label className="cn-cat-campo-grupo">
          <span className="cn-cat-etiqueta">Fundamento normativo</span>
          <input
            type="text"
            value={legalBasis}
            onChange={(e) => setLegalBasis(e.target.value)}
            placeholder="Norma y artículo, como aparecen en el texto oficial"
            className="cn-cat-entrada"
          />
        </label>

        <label className="cn-cat-campo-grupo">
          <span className="cn-cat-etiqueta">Quién verifica</span>
          <input type="text" value={verifiedBy} onChange={(e) => setVerifiedBy(e.target.value)} className="cn-cat-entrada" />
          <span className="cn-cat-nota">Queda registrado: toda afirmación sobre un término es atribuible.</span>
        </label>

        <label className="cn-cat-campo-grupo">
          <span className="cn-cat-etiqueta">
            Nota interna <span className="cn-cat-nota">(opcional)</span>
          </span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="cn-cat-area" />
        </label>

        {error && (
          <p className="cn-cat-error" role="alert">
            {error}
          </p>
        )}
      </div>

      <footer className="cn-cat-form-pie">
        {actuacion.verification && (
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void onRevert(actuacion.id, actuacion.porRemision?.paraRama ?? null)}
            title="Descartar la verificación de la firma y volver al catálogo base"
            className="cn-cat-boton cn-cat-boton--fantasma"
          >
            Revertir al catálogo base
          </button>
        )}
        <span className="cn-cat-separa" aria-hidden="true" />
        <button type="button" onClick={onClose} disabled={isSaving} className="cn-cat-boton cn-cat-boton--neutro">
          Cancelar
        </button>
        <button type="submit" disabled={!canSubmit || isSaving} className="cn-cat-boton cn-cat-boton--primario">
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Guardar verificación
        </button>
      </footer>
    </form>
  );
};
