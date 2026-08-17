"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

/**
 * Redirects to /ingresar when there is no session.
 * Returns the same auth context for convenience.
 */
export function useRequireAuth(nextPath: string) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (auth.loading) return;
    if (!auth.token) {
      const next = encodeURIComponent(nextPath);
      router.replace(`/ingresar?next=${next}`);
    }
  }, [auth.loading, auth.token, router, nextPath]);

  return auth;
}
