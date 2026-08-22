import { useAuthStore, formatAuthError } from '../../store/useAuthStore';
import { authService } from '../../services/authService';

jest.mock('../../services/authService', () => ({
  authService: {
    getSession: jest.fn(),
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updatePassword: jest.fn(),
    ensureProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}));

jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}));

describe('useAuthStore Suite - Zustand Authentication Store', () => {
  beforeEach(() => {
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      isLoading: false,
      isInitialized: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  describe('formatAuthError', () => {
    it('maps invalid credentials error', () => {
      expect(formatAuthError('Invalid login credentials')).toBe('Email hoặc mật khẩu không chính xác.');
    });

    it('maps already registered error', () => {
      expect(formatAuthError('User already registered')).toBe(
        'Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập.'
      );
    });

    it('maps weak password error', () => {
      expect(formatAuthError('Password should be at least 6 characters')).toBe(
        'Mật khẩu phải chứa tối thiểu 6 ký tự.'
      );
    });

    it('maps email not confirmed error', () => {
      expect(formatAuthError('Email not confirmed')).toBe(
        'Email chưa được xác thực. Vui lòng kiểm tra hòm thư của bạn.'
      );
    });

    it('maps rate limit error', () => {
      expect(formatAuthError('429 rate limit exceeded')).toBe(
        'Bạn đã gửi yêu cầu quá thường xuyên. Vui lòng thử lại sau ít phút.'
      );
    });

    it('maps network failed error', () => {
      expect(formatAuthError('Network request failed')).toBe(
        'Lỗi kết nối mạng. Vui lòng kiểm tra lại Internet.'
      );
    });

    it('maps null/empty error to default fallback', () => {
      expect(formatAuthError(null)).toBe('Đã xảy ra lỗi không xác định.');
    });
  });

  describe('initAuth', () => {
    it('initializes with active session and fetches profile', async () => {
      const mockUser = { id: 'u1', email: 'u1@test.com' } as any;
      const mockSession = { user: mockUser, access_token: 'token' } as any;
      const mockProfile = { id: 'u1', email: 'u1@test.com', full_name: 'John' } as any;

      (authService.getSession as jest.Mock).mockResolvedValueOnce(mockSession);
      (authService.ensureProfile as jest.Mock).mockResolvedValueOnce(mockProfile);

      await useAuthStore.getState().initAuth();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.profile).toEqual(mockProfile);
    });

    it('initializes as guest when no session present', async () => {
      (authService.getSession as jest.Mock).mockResolvedValueOnce(null);

      await useAuthStore.getState().initAuth();

      const state = useAuthStore.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.user).toBeNull();
      expect(state.profile).toBeNull();
    });
  });

  describe('signUp', () => {
    it('handles successful sign up with session', async () => {
      const mockUser = { id: 'u1', email: 'test@test.com' } as any;
      const mockSession = { access_token: 'token' } as any;
      const mockProfile = { id: 'u1', full_name: 'Bob' } as any;

      (authService.signUp as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      (authService.ensureProfile as jest.Mock).mockResolvedValueOnce(mockProfile);

      const res = await useAuthStore.getState().signUp('test@test.com', 'pwd123', 'Bob');

      expect(res.needEmailConfirmation).toBe(false);
      expect(useAuthStore.getState().user).toEqual(mockUser);
      expect(useAuthStore.getState().profile).toEqual(mockProfile);
    });

    it('detects when email confirmation is required (user created without session)', async () => {
      const mockUser = { id: 'u2', email: 'verify@test.com' } as any;
      (authService.signUp as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
        session: null,
      });

      const res = await useAuthStore.getState().signUp('verify@test.com', 'pwd123');
      expect(res.needEmailConfirmation).toBe(true);
    });

    it('sets error and throws when signup fails', async () => {
      (authService.signUp as jest.Mock).mockRejectedValueOnce(
        new Error('User already registered')
      );

      await expect(
        useAuthStore.getState().signUp('exists@test.com', 'pwd123')
      ).rejects.toThrow('Email này đã được đăng ký');

      expect(useAuthStore.getState().error).toContain('Email này đã được đăng ký');
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('signIn & signOut', () => {
    it('signs in successfully and updates store state', async () => {
      const mockUser = { id: 'u1', email: 'user@test.com' } as any;
      const mockSession = { access_token: 'abc' } as any;
      const mockProfile = { id: 'u1', full_name: 'Alice' } as any;

      (authService.signIn as jest.Mock).mockResolvedValueOnce({
        user: mockUser,
        session: mockSession,
      });
      (authService.ensureProfile as jest.Mock).mockResolvedValueOnce(mockProfile);

      await useAuthStore.getState().signIn('user@test.com', 'correctpassword');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.session).toEqual(mockSession);
      expect(state.profile).toEqual(mockProfile);
    });

    it('handles sign in error', async () => {
      (authService.signIn as jest.Mock).mockRejectedValueOnce(
        new Error('Invalid login credentials')
      );

      await expect(
        useAuthStore.getState().signIn('user@test.com', 'wrong')
      ).rejects.toThrow('Email hoặc mật khẩu không chính xác.');

      expect(useAuthStore.getState().error).toBe('Email hoặc mật khẩu không chính xác.');
    });

    it('signs out and resets user and profile state to null', async () => {
      useAuthStore.setState({
        user: { id: 'u1' } as any,
        session: { access_token: '123' } as any,
        profile: { id: 'u1' } as any,
      });

      (authService.signOut as jest.Mock).mockResolvedValueOnce(undefined);

      await useAuthStore.getState().signOut();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.profile).toBeNull();
    });
  });

  describe('resetPassword, updatePassword, updateProfile, clearError', () => {
    it('resetPassword calls authService.resetPassword', async () => {
      (authService.resetPassword as jest.Mock).mockResolvedValueOnce({});
      await useAuthStore.getState().resetPassword('reset@test.com');
      expect(authService.resetPassword).toHaveBeenCalledWith('reset@test.com');
    });

    it('updatePassword calls authService.updatePassword', async () => {
      (authService.updatePassword as jest.Mock).mockResolvedValueOnce({});
      await useAuthStore.getState().updatePassword('newPassword456');
      expect(authService.updatePassword).toHaveBeenCalledWith('newPassword456');
    });

    it('updateProfile updates profile in state', async () => {
      useAuthStore.setState({ user: { id: 'u1' } as any });
      const updated = { id: 'u1', full_name: 'New Name' } as any;
      (authService.updateProfile as jest.Mock).mockResolvedValueOnce(updated);

      await useAuthStore.getState().updateProfile({ full_name: 'New Name' });
      expect(useAuthStore.getState().profile).toEqual(updated);
    });

    it('clearError resets error to null', () => {
      useAuthStore.setState({ error: 'Some error' });
      useAuthStore.getState().clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
