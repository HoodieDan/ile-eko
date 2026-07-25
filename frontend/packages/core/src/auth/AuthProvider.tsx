import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Role, User } from '../types';
import { clearToken, getToken, setToken } from './storage';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
}

export interface AuthContextValue extends AuthState {
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: React.ReactNode;
  loginFn?: (input: LoginInput) => Promise<{ token: string; user: User }>;
  registerFn?: (input: RegisterInput) => Promise<{ token: string; user: User }>;
  /** Hydrate the user from a stored token on boot; return null if the token is invalid. */
  sessionFn?: () => Promise<User | null>;
}

async function defaultLoginStub(input: LoginInput): Promise<{ token: string; user: User }> {
  return {
    token: `mock-token-${Date.now()}`,
    user: {
      id: 'u_mock',
      name: input.email.split('@')[0] ?? 'User',
      email: input.email,
      role: 'landlord',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

async function defaultRegisterStub(input: RegisterInput): Promise<{ token: string; user: User }> {
  return {
    token: `mock-token-${Date.now()}`,
    user: {
      id: 'u_mock',
      name: input.name,
      email: input.email,
      role: input.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

export function AuthProvider({
  children,
  loginFn = defaultLoginStub,
  registerFn = defaultRegisterStub,
  sessionFn,
}: AuthProviderProps): React.ReactElement {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    status: 'loading',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (cancelled) return;
      if (!token) {
        setState({ user: null, token: null, status: 'unauthenticated' });
        return;
      }
      // Hydrate the user from the token; clear it if the session is invalid.
      if (sessionFn) {
        const user = await sessionFn();
        if (cancelled) return;
        if (user) {
          setState({ user, token, status: 'authenticated' });
        } else {
          await clearToken();
          setState({ user: null, token: null, status: 'unauthenticated' });
        }
      } else {
        setState({ user: null, token, status: 'authenticated' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionFn]);

  const login = useCallback(
    async (input: LoginInput) => {
      setState((s) => ({ ...s, status: 'loading' }));
      const { token, user } = await loginFn(input);
      await setToken(token);
      setState({ token, user, status: 'authenticated' });
    },
    [loginFn],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      setState((s) => ({ ...s, status: 'loading' }));
      const { token, user } = await registerFn(input);
      await setToken(token);
      setState({ token, user, status: 'authenticated' });
    },
    [registerFn],
  );

  const logout = useCallback(async () => {
    await clearToken();
    setState({ user: null, token: null, status: 'unauthenticated' });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, register, logout }),
    [state, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an <AuthProvider>');
  return ctx;
}
