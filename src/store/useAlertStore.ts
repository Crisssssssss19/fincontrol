import { create } from 'zustand';
import { useLanguageStore } from './useLanguageStore';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface ConfirmOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: AlertType;
}

interface AlertState {
  isOpen: boolean;
  message: string;
  title: string;
  type: AlertType;
  isConfirm: boolean;
  confirmText: string;
  cancelText: string;
  confirmResolve: ((value: boolean) => void) | null;
  showAlert: (message: string, options?: { title?: string; type?: AlertType }) => void;
  showConfirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  handleConfirm: (value: boolean) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  isOpen: false,
  message: '',
  title: '',
  type: 'info',
  isConfirm: false,
  confirmText: '',
  cancelText: '',
  confirmResolve: null,

  showAlert: (message, options = {}) => {
    const lang = useLanguageStore.getState().language || 'es';
    
    // Auto-detect type based on message content
    let detectedType: AlertType = options.type || 'info';
    if (!options.type) {
      const lower = message.toLowerCase();
      if (
        lower.includes('éxito') || 
        lower.includes('exito') || 
        lower.includes('success') || 
        lower.includes('guardad') || 
        lower.includes('actualizad') ||
        lower.includes('cread') ||
        lower.includes('eliminad') ||
        lower.includes('bienvenido')
      ) {
        detectedType = 'success';
      } else if (
        lower.includes('error') || 
        lower.includes('fail') || 
        lower.includes('incorrect') || 
        lower.includes('límite') || 
        lower.includes('limite') || 
        lower.includes('supera') ||
        lower.includes('excede') ||
        lower.includes('no coincide')
      ) {
        detectedType = 'error';
      } else if (
        lower.includes('conexión') || 
        lower.includes('conexion') || 
        lower.includes('offline') || 
        lower.includes('noConnection') ||
        lower.includes('advertencia') ||
        lower.includes('warning')
      ) {
        detectedType = 'warning';
      }
    }

    // Auto-detect title based on type
    let detectedTitle = options.title || '';
    if (!detectedTitle) {
      if (detectedType === 'success') {
        detectedTitle = lang === 'es' ? 'Operación Exitosa' : 'Success';
      } else if (detectedType === 'error') {
        detectedTitle = lang === 'es' ? 'Hubo un Error' : 'Error Occurred';
      } else if (detectedType === 'warning') {
        detectedTitle = lang === 'es' ? 'Atención' : 'Attention';
      } else {
        detectedTitle = lang === 'es' ? 'Aviso' : 'Information';
      }
    }

    set({
      isOpen: true,
      message,
      title: detectedTitle,
      type: detectedType,
      isConfirm: false,
      confirmResolve: null,
    });
  },

  showConfirm: (message, options = {}) => {
    const lang = useLanguageStore.getState().language || 'es';
    
    const detectedTitle = options.title || (lang === 'es' ? '¿Confirmar Acción?' : 'Are you sure?');
    const detectedConfirmText = options.confirmText || (lang === 'es' ? 'Confirmar' : 'Confirm');
    const detectedCancelText = options.cancelText || (lang === 'es' ? 'Cancelar' : 'Cancel');
    const detectedType = options.type || 'warning';

    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        message,
        title: detectedTitle,
        type: detectedType,
        isConfirm: true,
        confirmText: detectedConfirmText,
        cancelText: detectedCancelText,
        confirmResolve: resolve,
      });
    });
  },

  handleConfirm: (value) => {
    const resolve = get().confirmResolve;
    if (resolve) {
      resolve(value);
    }
    set({ isOpen: false, confirmResolve: null });
  },

  hideAlert: () => {
    const resolve = get().confirmResolve;
    if (resolve) {
      resolve(false);
    }
    set({ isOpen: false, confirmResolve: null });
  },
}));
