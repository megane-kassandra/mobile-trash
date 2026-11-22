import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
    getSessionUser,
    login,
    logout,
    registerPublicAccount,
} from '@/services/auth-service';
import type { LoginCredentials, PublicRegistrationInput, User } from '@/types/models';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  register: (input: PublicRegistrationInput) => Promise<User>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const sessionUser = await getSessionUser();
      setUser(sessionUser);
      return sessionUser;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const signedInUser = await login(credentials);
    setUser(signedInUser);
    return signedInUser;
  }, []);

  const register = useCallback(async (input: PublicRegistrationInput) => {
    const registeredUser = await registerPublicAccount(input);
    await import('@/services/storage').then(({ saveSessionUserId }) =>
      saveSessionUserId(registeredUser.id),
    );
    setUser(registeredUser);
    return registeredUser;
  }, []);

  const signOut = useCallback(async () => {
    await logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    login: signIn,
    register,
    logout: signOut,
    refreshSession,
  }), [loading, refreshSession, register, signIn, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider.');
  return context;
}
