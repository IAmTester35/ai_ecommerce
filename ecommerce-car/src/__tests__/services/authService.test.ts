import { authService } from '../../services/authService';
import { supabase } from '../../api/supabaseClient';

// Mock supabaseClient
jest.mock('../../api/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('AuthService Suite - Authentication & Profile Management', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    // HAPPY CASES
    it('signs up a user and upserts profile when session is created', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockSession = { access_token: 'token-123' };

      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const upsertMock = jest.fn().mockResolvedValueOnce({ data: null, error: null });
      (supabase.from as jest.Mock).mockReturnValueOnce({
        upsert: upsertMock,
      });

      const res = await authService.signUp('test@example.com', 'password123', 'John Doe', '0912345678');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'John Doe',
            phone: '0912345678',
          },
        },
      });

      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(upsertMock).toHaveBeenCalledWith({
        id: 'user-123',
        email: 'test@example.com',
        full_name: 'John Doe',
        phone: '0912345678',
        role: 'user',
      });

      expect(res.user?.id).toBe('user-123');
    });

    // UNHAPPY / ERROR CASES
    it('throws error when signUp fails in Supabase', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('User already registered'),
      });

      await expect(authService.signUp('existing@example.com', 'pwd')).rejects.toThrow(
        'User already registered'
      );
    });
  });

  describe('signIn', () => {
    // HAPPY CASES
    it('signs in with password and ensures profile provision', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      // Mock ensureProfile (from profiles select)
      const maybeSingleMock = jest.fn().mockResolvedValueOnce({
        data: { id: 'user-123', email: 'test@example.com', full_name: 'John Doe', role: 'user' },
        error: null,
      });
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            maybeSingle: maybeSingleMock,
          }),
        }),
      });

      const res = await authService.signIn('test@example.com', 'password123');
      expect(res.user?.id).toBe('user-123');
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // UNHAPPY CASES
    it('throws error on invalid credentials', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValueOnce({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials'),
      });

      await expect(authService.signIn('bad@example.com', 'wrong')).rejects.toThrow(
        'Invalid login credentials'
      );
    });
  });

  describe('ensureProfile', () => {
    it('returns existing profile if found in DB', async () => {
      const user = { id: 'u1', email: 'u1@test.com' } as any;
      const existingProfile = { id: 'u1', email: 'u1@test.com', full_name: 'Existing User', role: 'user' };

      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            maybeSingle: jest.fn().mockResolvedValueOnce({ data: existingProfile, error: null }),
          }),
        }),
      });

      const profile = await authService.ensureProfile(user);
      expect(profile).toEqual(existingProfile);
    });

    it('creates and returns profile if not yet in DB', async () => {
      const user = {
        id: 'u2',
        email: 'u2@test.com',
        user_metadata: { full_name: 'Newbie', phone: '123' },
      } as any;

      // 1. select returns null
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            maybeSingle: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
          }),
        }),
      });

      // 2. upsert returns created
      const createdProfile = { id: 'u2', email: 'u2@test.com', full_name: 'Newbie', role: 'user' };
      (supabase.from as jest.Mock).mockReturnValueOnce({
        upsert: jest.fn().mockReturnValueOnce({
          select: jest.fn().mockReturnValueOnce({
            single: jest.fn().mockResolvedValueOnce({ data: createdProfile, error: null }),
          }),
        }),
      });

      const profile = await authService.ensureProfile(user);
      expect(profile).toEqual(createdProfile);
    });
  });

  describe('signOut, resetPassword, updatePassword, getSession, updateProfile', () => {
    it('signOut calls supabase.auth.signOut', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValueOnce({ error: null });
      await expect(authService.signOut()).resolves.toBeUndefined();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('resetPassword sends reset request', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValueOnce({
        data: {},
        error: null,
      });
      await authService.resetPassword('reset@test.com');
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'reset@test.com',
        expect.objectContaining({ redirectTo: 'automatch://reset-password' })
      );
    });

    it('updatePassword updates auth user password', async () => {
      (supabase.auth.updateUser as jest.Mock).mockResolvedValueOnce({
        data: { user: { id: 'u1' } },
        error: null,
      });
      await authService.updatePassword('newPassword123');
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newPassword123' });
    });

    it('getSession returns current session', async () => {
      const mockSession = { access_token: 'token123' } as any;
      (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
        data: { session: mockSession },
        error: null,
      });
      const session = await authService.getSession();
      expect(session).toBe(mockSession);
    });

    it('getProfile fetches profile by ID', async () => {
      const mockProfile = { id: 'u1', email: 'u1@test.com', full_name: 'Alice' };
      (supabase.from as jest.Mock).mockReturnValueOnce({
        select: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            maybeSingle: jest.fn().mockResolvedValueOnce({ data: mockProfile, error: null }),
          }),
        }),
      });
      const profile = await authService.getProfile('u1');
      expect(profile).toEqual(mockProfile);
    });

    it('updateProfile updates and returns modified profile', async () => {
      const updatedProfile = { id: 'u1', email: 'u1@test.com', full_name: 'Alice Cooper' };
      (supabase.from as jest.Mock).mockReturnValueOnce({
        update: jest.fn().mockReturnValueOnce({
          eq: jest.fn().mockReturnValueOnce({
            select: jest.fn().mockReturnValueOnce({
              single: jest.fn().mockResolvedValueOnce({ data: updatedProfile, error: null }),
            }),
          }),
        }),
      });
      const res = await authService.updateProfile('u1', { full_name: 'Alice Cooper' });
      expect(res).toEqual(updatedProfile);
    });
  });
});
