import { create } from 'zustand';

export type DialogActionType = 'normal' | 'primary' | 'warning' | 'danger';

export interface DialogAction {
  text: string;
  onPress?: () => void;
  type?: DialogActionType;
  pendingActionMs?: number;
}

export interface DialogOptions {
  title?: string;
  content?: string;
  message?: string;
  actions?: DialogAction[];
  focus?: boolean;
  type?: 'info' | 'success' | 'warning' | 'error' | 'none';
  icon?: string;
}

interface DialogState {
  options: DialogOptions | null;
  visible: boolean;
  showDialog: (options: DialogOptions) => void;
  hideDialog: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  options: null,
  visible: false,

  showDialog: (options: DialogOptions) => {
    // Normalize actions: if none provided, provide default "Đóng" button
    const actions: DialogAction[] =
      options.actions && options.actions.length > 0
        ? options.actions
        : [{ text: 'Đóng', type: 'primary', onPress: () => {} }];

    set({
      options: {
        focus: false,
        type: 'none',
        ...options,
        content: options.content || options.message || '',
        actions,
      },
      visible: true,
    });
  },

  hideDialog: () => set({ visible: false }),
}));

export default useDialogStore;

/**
 * Helper function: Show simple Alert dialog
 */
export const showAlertDialog = (title: string, message: string, onOk?: () => void) => {
  useDialogStore.getState().showDialog({
    title,
    content: message,
    actions: [
      {
        text: 'Đã hiểu',
        type: 'primary',
        onPress: () => onOk?.(),
      },
    ],
  });
};

/**
 * Helper function: Show Confirmation dialog
 */
export const showConfirmDialog = ({
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  confirmType = 'primary',
  focus = false,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmType?: DialogActionType;
  focus?: boolean;
}) => {
  useDialogStore.getState().showDialog({
    title,
    content: message,
    focus,
    actions: [
      {
        text: cancelText,
        type: 'normal',
        onPress: () => onCancel?.(),
      },
      {
        text: confirmText,
        type: confirmType,
        onPress: () => onConfirm(),
      },
    ],
  });
};

/**
 * Drop-in global replacement for React Native's Alert.alert
 */
export const globalAlert = (
  title?: string,
  message?: string,
  buttons?: Array<{
    text?: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>
) => {
  if (!buttons || buttons.length === 0) {
    showAlertDialog(title || '', message || '');
    return;
  }

  const actions: DialogAction[] = buttons.map((btn) => {
    let type: DialogActionType = 'normal';
    if (btn.style === 'destructive') {
      type = 'danger';
    } else if (btn.style === 'cancel') {
      type = 'normal';
    } else {
      type = 'primary';
    }

    return {
      text: btn.text || 'OK',
      type,
      onPress: btn.onPress,
    };
  });

  useDialogStore.getState().showDialog({
    title: title || '',
    content: message || '',
    actions,
  });
};
