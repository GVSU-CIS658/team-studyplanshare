import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AuthUser,
  getCurrentIdToken,
  loginWithGithub,
  loginWithGoogle,
  loginWithEmail,
  logout as authLogout,
  onAuthStateChangedListener,
  registerWithEmail,
} from "../services/authService";

export interface AuthContextValue {
  user: AuthUser | null;
  idToken: string | null;
  sessionKey: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const setAuthenticatedUser = useCallback(async (nextUser: AuthUser | null, forceRefresh = false) => {
    setUser(nextUser);
    if (nextUser) {
      const token = await getCurrentIdToken(forceRefresh);
      setIdToken(token);
    } else {
      setIdToken(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (nextUser) => {
      await setAuthenticatedUser(nextUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setAuthenticatedUser]);

  const login = useCallback(async (email: string, password: string) => {
    const nextUser = await loginWithEmail(email, password);
    await setAuthenticatedUser(nextUser);
  }, [setAuthenticatedUser]);

  const loginWithGoogleAccount = useCallback(async () => {
    const nextUser = await loginWithGoogle();
    await setAuthenticatedUser(nextUser);
  }, [setAuthenticatedUser]);

  const loginWithGithubAccount = useCallback(async () => {
    const nextUser = await loginWithGithub();
    await setAuthenticatedUser(nextUser);
  }, [setAuthenticatedUser]);

  const logout = useCallback(async () => {
    await authLogout();
    await setAuthenticatedUser(null);
  }, [setAuthenticatedUser]);

  const register = useCallback(async (email: string, password: string) => {
    const nextUser = await registerWithEmail(email, password);
    await setAuthenticatedUser(nextUser, true);
  }, [setAuthenticatedUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      idToken,
      sessionKey: user?.uid ?? "guest",
      loading,
      login,
      loginWithGithub: loginWithGithubAccount,
      loginWithGoogle: loginWithGoogleAccount,
      logout,
      register,
    }),
    [
      user,
      idToken,
      loading,
      login,
      loginWithGithubAccount,
      loginWithGoogleAccount,
      logout,
      register,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
