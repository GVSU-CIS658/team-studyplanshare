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
  completeRedirectAuth,
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

  useEffect(() => {
    let isActive = true;
    let unsubscribe: (() => void) | null = null;

    // Subscribe to auth state changes first
    unsubscribe = onAuthStateChangedListener(async (nextUser) => {
      if (!isActive) return;

      console.log("[AUTH] State changed:", nextUser?.uid || "null");

      try {
        setUser(nextUser);
        if (nextUser) {
          const token = await getCurrentIdToken();
          if (!isActive) return;
          setIdToken(token);
        } else {
          setIdToken(null);
        }
      } catch (error) {
        console.error("[AUTH] Token error:", error);
      } finally {
        setLoading(false);
      }
    });

    // Check for OAuth redirect result (completes the redirect flow)
    completeRedirectAuth().catch((error) => {
      console.error("[AUTH] Redirect auth error:", error);
    });

    return () => {
      isActive = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const nextUser = await loginWithEmail(email, password);
    const token = await getCurrentIdToken();
    setUser(nextUser);
    setIdToken(token);
  }, []);

  const loginWithGoogleAccount = useCallback(async () => {
    await loginWithGoogle();
  }, []);

  const loginWithGithubAccount = useCallback(async () => {
    await loginWithGithub();
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
    setIdToken(null);
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const nextUser = await registerWithEmail(email, password);
    const token = await getCurrentIdToken(true);
    setUser(nextUser);
    setIdToken(token);
  }, []);

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
    [user, idToken, loading, login, loginWithGithubAccount, loginWithGoogleAccount, logout, register],
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
