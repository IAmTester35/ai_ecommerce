import React, { createContext, useContext, useState } from 'react';
import type { Profile, UserRole } from '../types';
import { mockProfiles } from '../lib/mockData';

interface AuthContextType {
  currentUser: Profile;
  setCurrentUser: (user: Profile) => void;
  switchRole: (role: UserRole) => void;
  isOwner: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Owner (Super Admin)
  const [currentUser, setCurrentUser] = useState<Profile>(mockProfiles[0]);

  const switchRole = (role: UserRole) => {
    const found = mockProfiles.find((p) => p.role === role);
    if (found) {
      setCurrentUser(found);
    } else {
      setCurrentUser((prev) => ({ ...prev, role }));
    }
  };

  const isOwner = currentUser.role === 'owner';
  const isManager = currentUser.role === 'manager' || currentUser.role === 'owner';

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, switchRole, isOwner, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
