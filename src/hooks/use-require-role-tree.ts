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
 * Ciudadanos con rol moderador/profesional aditivo siguen pudiendo entrar a /panel/*
 * si `allowed` incluye "aportante" o su rol primario.
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
    // Admin solo donde se permita admin.
    if (primary === "admin" && !allowedList.includes("admin")) {
      router.replace(homeForRole(primary))
      return
    }
    // Ciudadano (aportante/moderador/profesional): acceso si allowed incluye aportante
    // o su primary (paneles operativos de mod/prof).
    if (primary !== "admin") {
      if (
        allowedList.includes(primary) ||
        allowedList.includes("aportante")
      ) {
        return
      }
      router.replace(homeForRole(primary))
      return
    }
    if (!allowedList.includes(primary)) {
      router.replace(homeForRole(primary))
    }
  }, [auth.loading, auth.token, auth.user, router, allowedKey])

  return auth
}
