import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuthUser, Role } from "@/services/api";
import { authService } from "@/services/api";

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role?: Role) => Promise<AuthUser>;
  register: (payload: { name: string; email: string; role: Role }) => Promise<AuthUser>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const STORAGE = "ehc.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (u) window.localStorage.setItem(STORAGE, JSON.stringify(u));
    else window.localStorage.removeItem(STORAGE);
  };

  const login: AuthCtx["login"] = async (email, password, role = "patient") => {
    const u = await authService.login(email, password, role);
    persist(u);
    window.localStorage.setItem("ehc.token", "mock-token-" + u.id);
    return u;
  };

  const register: AuthCtx["register"] = async (payload) => {
    const u = await authService.register(payload);
    persist(u);
    window.localStorage.setItem("ehc.token", "mock-token-" + u.id);
    return u;
  };

  const logout = () => {
    persist(null);
    window.localStorage.removeItem("ehc.token");
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}
