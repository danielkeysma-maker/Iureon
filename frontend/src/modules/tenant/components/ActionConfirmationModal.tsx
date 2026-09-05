import React, { useEffect, useRef } from 'react';
import { AlertTriangle, LogOut, type LucideIcon } from 'lucide-react';

/**
 * Confirmación de una acción, con el lenguaje visual del resto de la aplicación.
 *
 * LO QUE HABÍA: un triángulo de alerta rojo y un botón carmesí para cerrar
 * sesión, como si salir fuera destruir algo. No lo es —el trabajo está en la
 * nube de la firma— y el rojo enseñaba a dudar de un botón inocuo. Ahora la
 * confirmación dice qué pasa y qué no pasa, en dos frases, con el icono de la
 * acción y el azul de marca; el rojo queda reservado a lo que sí borra.
 *
 * Comportamiento que un diálogo profesional debe tener y este no tenía: Esc
 * cierra, clic fuera cierra, el foco entra al botón seguro (Cancelar), y en el
 * teléfono se presenta como hoja anclada abajo, a la mano del pulgar.
 */

interface ActionConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  /** Segunda línea, más suave: contexto (quién, dónde). */
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  /** `primary` para acciones inocuas (salir); `danger` solo para lo que borra. */
  confirmVariant?: 'danger' | 'primary';
  icon?: LucideIcon;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  detail,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'primary',
  icon,
  onConfirm,
  onCancel
}) => {
  const cancelar = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    cancelar.current?.focus();
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const Icono = icon ?? (confirmVariant === 'danger' ? AlertTriangle : LogOut);
  const peligro = confirmVariant === 'danger';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-[rgb(var(--ink-900)/0.45)] p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmacion-titulo"
        aria-describedby="confirmacion-texto"
        className="w-full max-w-[440px] overflow-hidden rounded-t-card border border-line-200 bg-surface shadow-e2 motion-safe:animate-[aparecer_.22s_ease-out] sm:rounded-card"
      >
        {/* Filete superior de marca: identifica el diálogo como de la aplicación, no del navegador. */}
        <div className={`h-1 w-full ${peligro ? 'bg-danger' : 'bg-gradient-to-r from-brand-700 to-[rgb(var(--nav-accent))]'}`} />

        <div className="px-6 pb-6 pt-6 sm:px-7">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                peligro ? 'bg-[rgb(var(--danger)/0.08)] text-danger' : 'bg-brand-50 text-brand-700'
              }`}
            >
              <Icono className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <h4 id="confirmacion-titulo" className="text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink-900">
                {title}
              </h4>
              <p id="confirmacion-texto" className="mt-1.5 text-[13.5px] leading-[1.6] text-ink-700 [text-wrap:pretty]">
                {message}
              </p>
              {detail && <p className="mt-2 text-[12px] leading-snug text-ink-500">{detail}</p>}
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button ref={cancelar} type="button" onClick={onCancel} className="btn-neutral h-11 justify-center sm:h-10">
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`h-11 justify-center sm:h-10 ${peligro ? 'btn-danger' : 'btn-primary'}`}
            >
              <Icono className="h-3.5 w-3.5" />
              {confirmText}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes aparecer{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
};
