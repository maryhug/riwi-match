import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSession, login as loginFn, logout as logoutFn } from "./api/auth.functions";

export interface AuthUser {
  id: string;
  name: string;
  last_name: string;
  email: string;
  role: "ADMIN" | "RECRUITER" | "TA_LEADER";
  status: "ACTIVE" | "SUSPENDED";
}

interface AuthCtx {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSession()
      .then((session) => setUser(session.user as AuthUser | null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const result = await loginFn({ data: { email, password } });
    if ("error" in result) {
      return { ok: false as const, error: result.error ?? "No se pudo iniciar sesión." };
    }
    setUser(result.user as AuthUser);
    return { ok: true as const };
  };

  const logout = async () => {
    await logoutFn();
    setUser(null);
  };

  return (
    <Ctx.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
