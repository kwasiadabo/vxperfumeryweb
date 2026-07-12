import { create } from 'zustand';

// A single pending confirm request, rendered by <ConfirmDialog /> in App.jsx.
// confirmDialog() replaces window.confirm() with a branded modal and
// resolves the same way — true if the user confirmed, false otherwise.
export const useDialogStore = create((set, get) => ({
  request: null,
  resolve: (result) => {
    get().request?.resolve(result);
    set({ request: null });
  },
  _open: (options) =>
    new Promise((resolve) => {
      set({
        request: {
          title: options.title || 'Please Confirm',
          message: options.message,
          confirmLabel: options.confirmLabel || 'Confirm',
          cancelLabel: options.cancelLabel || 'Cancel',
          danger: Boolean(options.danger),
          resolve,
        },
      });
    }),
}));

export function confirmDialog(options) {
  return useDialogStore.getState()._open(typeof options === 'string' ? { message: options } : options);
}
