import { useCallback, useState } from 'react';

export interface ConfirmationRequest {
  title: string;
  message: string;
  confirmText: string;
  variant: 'danger' | 'primary' | 'success';
  onConfirm: () => void;
}

interface ConfirmationState extends ConfirmationRequest {
  isOpen: boolean;
}

const CLOSED: ConfirmationState = {
  isOpen: false,
  title: '',
  message: '',
  confirmText: 'Confirmar',
  variant: 'danger',
  onConfirm: () => {}
};

/**
 * Drives the shared ActionConfirmationModal.
 *
 * Every destructive or state-changing tenant operation goes through `confirm`,
 * so the modal is closed centrally once the action runs and callers never have
 * to remember to dismiss it themselves.
 */
export const useActionConfirmation = () => {
  const [state, setState] = useState<ConfirmationState>(CLOSED);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const confirm = useCallback((request: ConfirmationRequest) => {
    setState({ ...request, isOpen: true });
  }, []);

  const modalProps = {
    isOpen: state.isOpen,
    title: state.title,
    message: state.message,
    confirmText: state.confirmText,
    confirmVariant: state.variant,
    onConfirm: () => {
      state.onConfirm();
      close();
    },
    onCancel: close
  };

  return { confirm, modalProps };
};
