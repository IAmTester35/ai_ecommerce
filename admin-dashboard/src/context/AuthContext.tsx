import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Profile, UserRole } from '../types';
import { authService } from '../services/authService';
import { hasPermission as checkPermission, type AppPermission } from '../lib/permissions';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  currentUser: Profile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isOwner: boolean;
  isManager: boolean;
  can: (permission: AppPermission) => boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUpAdmin: (email: string, password: string, fullName: string, role: UserRole, phone?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session and auth state
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const initialSession = await authService.getSession();
        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            const profile = await authService.ensureProfile(initialSession.user);
            if (mounted) {
              setCurrentUser(profile);
            }
          } else {
            setSession(null);
            setUser(null);
            setCurrentUser(null);
          }
        }
      } catch (err) {
        console.warn('[AuthProvider] Initialization error:', err);
        if (mounted) {
          setSession(null);
          setUser(null);
          setCurrentUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    // Listen to real-time auth changes
    const { data: authListener } = authService.onAuthStateChange((newSession, newProfile) => {
      if (mounted) {
        setSession(newSession);
        setUser(newSession?.user || null);
        setCurrentUser(newProfile);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user?.id) {
      const refreshed = await authService.getProfile(user.id);
      if (refreshed) {
        setCurrentUser(refreshed);
      }
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const { data, profile } = await authService.signIn(email, password);
      
      if (!profile) {
        throw new Error('Không thể tải thông tin hồ sơ tài khoản.');
      }

      // Check if user is authorized for admin access
      if (profile.role !== 'owner' && profile.role !== 'manager') {
        // Sign out immediately if unauthorized
        await authService.signOut();
        setSession(null);
        setUser(null);
        setCurrentUser(null);
        return {
          success: false,
          error: 'Tài khoản của bạn là khách hàng (User), không có quyền truy cập cổng Quản Trị.',
        };
      }

      setSession(data.session);
      setUser(data.user);
      setCurrentUser(profile);
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Email hoặc mật khẩu không chính xác.';
      return {
        success: false,
        error: msg,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signUpAdmin = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const { data, profile } = await authService.signUpAdmin(email, password, fullName, role, phone);
      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        setCurrentUser(profile);
      }
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tạo tài khoản quản trị.';
      return {
        success: false,
        error: msg,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      await authService.signOut();
      setSession(null);
      setUser(null);
      setCurrentUser(null);
    } catch (err) {
      console.warn('[AuthProvider] SignOut error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const role = currentUser?.role || null;
  const isOwner = role === 'owner';
  const isManager = role === 'manager' || role === 'owner';
  const isAuthenticated = !!session && !!currentUser && (isOwner || role === 'manager');

  const can = (permission: AppPermission): boolean => {
    return checkPermission(role, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        currentUser,
        role,
        isLoading,
        isAuthenticated,
        isOwner,
        isManager,
        can,
        signIn,
        signUpAdmin,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
