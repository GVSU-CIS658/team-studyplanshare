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
  loginWithEmail,
  logout as authLogout,
  onAuthStateChangedListener,
  registerWithEmail,
} from "../services/authService";

export interface AuthContextValue {
  user: AuthUser | null;
  idToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AUTH_TOKEN_KEY = "sps.auth.idToken";
const AUTH_UID_KEY = "sps.auth.uid";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const persistAuth = (user: AuthUser | null, token: string | null) => {
  if (user && token) {
    localStorage.setItem(AUTH_UID_KEY, user.uid);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    return;
  }
  localStorage.removeItem(AUTH_UID_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(
    localStorage.getItem(AUTH_TOKEN_KEY),
  );
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChangedListener(async (nextUser) => {
      setUser(nextUser);

      if (nextUser) {
        const token = await getCurrentIdToken();
        setIdToken(token);
        persistAuth(nextUser, token);
      } else {
        setIdToken(null);
        persistAuth(null, null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const nextUser = await loginWithEmail(email, password);
    const token = await getCurrentIdToken();
    setUser(nextUser);
    setIdToken(token);
    persistAuth(nextUser, token);
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
    setIdToken(null);
    persistAuth(null, null);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const nextUser = await registerWithEmail(email, password);
    const token = await getCurrentIdToken(true);
    setUser(nextUser);
    setIdToken(token);
    persistAuth(nextUser, token);
  }, []);
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      idToken,
      loading,
      login,
      logout,
      register,
    }),
    [user, idToken, register, login, logout, loading],
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
