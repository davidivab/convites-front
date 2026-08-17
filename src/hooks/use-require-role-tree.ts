"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  homeForRole,
  resolvePrimaryRole,
  type RoleTree,
} from "@/lib/role-tree"
import { useRequireAuth } from "@/hooks/use-require-auth"

/**
 * Exige sesión y que el rol primario coincida con el árbol de rutas permitido.
 * Admin/moderador que entren a /panel/* son redirigidos a su home.
 */
export function useRequireRoleTree(
  nextPath: string,
  allowed: RoleTree | RoleTree[],
) {
  const auth = useRequireAuth(nextPath)
  const router = useRouter()
  const allowedKey = Array.isArray(allowed) ? allowed.join("|") : allowed

  useEffect(() => {
    if (auth.loading || !auth.token || !auth.user) return
    const primary = resolvePrimaryRole(auth.user)
    if (!primary) return
    const allowedList = allowedKey.split("|") as RoleTree[]
    if (!allowedList.includes(primary)) {
      router.replace(homeForRole(primary))
    }
  }, [auth.loading, auth.token, auth.user, router, allowedKey])

  return auth
}
