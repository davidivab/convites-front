"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

/** Opaque session flag — not the Sanctum secret (that lives in httpOnly cookie). */
const SESSION_FLAG = "session";

type AuthState = {
  user: AuthUser | null;
  /** Truthy when httpOnly session cookie exists (value is never the API token). */
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
};

const AuthContext = createContext<AuthState | null>(null);

async function bffJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    let body: { message?: string; errors?: Record<string, string[]> } = {};
    try {
      body = await response.json();
    } catch {
      // ignore
    }
    throw new ApiError(response.status, body);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await bffJson<{ user: AuthUser }>("/api/auth/me");
      setUser(res.user);
      setToken(SESSION_FLAG);
    } catch {
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await bffJson<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(res.user);
    setToken(SESSION_FLAG);
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      password_confirmation: string;
    }) => {
      const res = await bffJson<{ user: AuthUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setUser(res.user);
      setToken(SESSION_FLAG);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await bffJson("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setToken(null);
  }, []);

  const hasPermission = useCallback(
    (permission: string) => Boolean(user?.permissions?.includes(permission)),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      refresh,
      hasPermission,
    }),
    [user, token, loading, login, register, logout, refresh, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** @deprecated Prefer useAuth(); token is never in localStorage. */
export function getStoredToken(): string | null {
  return null;
}
