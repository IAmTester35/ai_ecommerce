import {
  useDialogStore,
  showAlertDialog,
  showConfirmDialog,
  globalAlert,
} from '../../store/useDialogStore';

describe('useDialogStore Suite - Global Dialog & Alert Management', () => {
  beforeEach(() => {
    useDialogStore.setState({
      options: null,
      visible: false,
    });
  });

  it('showDialog sets options and marks visible to true', () => {
    useDialogStore.getState().showDialog({
      title: 'Thông báo',
      content: 'Nội dung tin nhắn',
    });

    const state = useDialogStore.getState();
    expect(state.visible).toBe(true);
    expect(state.options?.title).toBe('Thông báo');
    expect(state.options?.content).toBe('Nội dung tin nhắn');
    expect(state.options?.actions).toHaveLength(1); // Default "Đóng" button
  });

  it('hideDialog sets visible to false', () => {
    useDialogStore.getState().showDialog({ title: 'Test' });
    expect(useDialogStore.getState().visible).toBe(true);

    useDialogStore.getState().hideDialog();
    expect(useDialogStore.getState().visible).toBe(false);
  });

  it('showAlertDialog opens alert with single confirmation button', () => {
    const okSpy = jest.fn();
    showAlertDialog('Cảnh báo', 'Vui lòng điền đủ thông tin', okSpy);

    const state = useDialogStore.getState();
    expect(state.visible).toBe(true);
    expect(state.options?.title).toBe('Cảnh báo');
    expect(state.options?.actions?.[0].text).toBe('Đã hiểu');

    state.options?.actions?.[0].onPress?.();
    expect(okSpy).toHaveBeenCalled();
  });

  it('showConfirmDialog opens dialog with confirm and cancel buttons', () => {
    const confirmSpy = jest.fn();
    const cancelSpy = jest.fn();

    showConfirmDialog({
      title: 'Xác nhận xóa',
      message: 'Bạn có chắc chắn?',
      onConfirm: confirmSpy,
      onCancel: cancelSpy,
      confirmText: 'Xóa ngay',
      cancelText: 'Bỏ qua',
      confirmType: 'danger',
    });

    const state = useDialogStore.getState();
    expect(state.visible).toBe(true);
    expect(state.options?.actions).toHaveLength(2);

    const [cancelBtn, confirmBtn] = state.options!.actions!;
    expect(cancelBtn.text).toBe('Bỏ qua');
    expect(confirmBtn.text).toBe('Xóa ngay');
    expect(confirmBtn.type).toBe('danger');

    confirmBtn.onPress?.();
    expect(confirmSpy).toHaveBeenCalled();

    cancelBtn.onPress?.();
    expect(cancelSpy).toHaveBeenCalled();
  });

  describe('globalAlert (React Native Alert drop-in replacement)', () => {
    it('handles globalAlert with no buttons provided', () => {
      globalAlert('Thông báo', 'Chào mừng');
      expect(useDialogStore.getState().visible).toBe(true);
      expect(useDialogStore.getState().options?.title).toBe('Thông báo');
    });

    it('handles globalAlert with custom buttons and button styles', () => {
      const deleteSpy = jest.fn();
      const cancelSpy = jest.fn();

      globalAlert('Cảnh báo', 'Xóa mục này?', [
        { text: 'Hủy bỏ', style: 'cancel', onPress: cancelSpy },
        { text: 'Xóa', style: 'destructive', onPress: deleteSpy },
      ]);

      const state = useDialogStore.getState();
      expect(state.visible).toBe(true);
      expect(state.options?.actions).toHaveLength(2);

      const [cancelBtn, deleteBtn] = state.options!.actions!;
      expect(cancelBtn.type).toBe('normal');
      expect(deleteBtn.type).toBe('danger');

      deleteBtn.onPress?.();
      expect(deleteSpy).toHaveBeenCalled();
    });
  });
});
