/* eslint-disable react-refresh/only-export-components */
'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

interface StoredAuth {
  user: User;
  token: string;
}

const STORAGE_KEY = 'blog_auth';

const REFRESH_DEBOUNCE_MS = 60000; // Refresh at most once per minute

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  isSignUpModalOpen: boolean;
  openSignUpModal: () => void;
  closeSignUpModal: () => void;
  loginLoading: boolean;
  loginError: string | null;
  signUpLoading: boolean;
  signUpError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed?.user && parsed?.token) {
      const user = parsed.user as User;
      return {
        user: { ...user, role: user.role === 'admin' ? 'admin' : 'user' },
        token: parsed.token,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function setStoredAuth(auth: StoredAuth | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (auth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const auth = getStoredAuth();
    if (auth) {
      setUser(auth.user);
      setToken(auth.token);
    }
  }, []);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);
  const [signUpError, setSignUpError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      const userData: User = {
        id: data.id,
        username: data.username,
        role: data.role === 'admin' ? 'admin' : 'user',
      };
      const authData: StoredAuth = { user: userData, token: data.token };
      setUser(userData);
      setToken(data.token);
      setStoredAuth(authData);
      setIsLoginModalOpen(false);
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    setSignUpLoading(true);
    setSignUpError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Sign up failed');
      }
      const userData: User = {
        id: data.id,
        username: data.username,
        role: data.role === 'admin' ? 'admin' : 'user',
      };
      const authData: StoredAuth = { user: userData, token: data.token };
      setUser(userData);
      setToken(data.token);
      setStoredAuth(authData);
      setIsSignUpModalOpen(false);
    } catch (e) {
      setSignUpError(e instanceof Error ? e.message : 'Sign up failed');
    } finally {
      setSignUpLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setStoredAuth(null);
  }, []);

  const refreshToken = useCallback(async () => {
    const currentToken = getStoredAuth()?.token;
    if (!currentToken) return;

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${currentToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        logout();
        return;
      }
      const authData: StoredAuth = {
        user: {
          id: data.id,
          username: data.username,
          role: data.role === 'admin' ? 'admin' : 'user',
        },
        token: data.token,
      };
      setUser(authData.user);
      setToken(data.token);
      setStoredAuth(authData);
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    if (!user || !token) return;

    let lastRefresh = 0;
    const debouncedRefresh = () => {
      const now = Date.now();
      if (now - lastRefresh < REFRESH_DEBOUNCE_MS) return;
      lastRefresh = now;
      refreshToken();
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => window.addEventListener(ev, debouncedRefresh));
    return () => events.forEach((ev) => window.removeEventListener(ev, debouncedRefresh));
  }, [user, token, refreshToken]);

  const openLoginModal = useCallback(() => {
    setLoginError(null);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setLoginError(null);
  }, []);

  const openSignUpModal = useCallback(() => {
    setSignUpError(null);
    setIsSignUpModalOpen(true);
  }, []);

  const closeSignUpModal = useCallback(() => {
    setIsSignUpModalOpen(false);
    setSignUpError(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signUp,
        refreshToken,
        logout,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        isSignUpModalOpen,
        openSignUpModal,
        closeSignUpModal,
        loginLoading,
        loginError,
        signUpLoading,
        signUpError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
