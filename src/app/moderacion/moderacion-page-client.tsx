"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ModeracionClient } from "./moderacion-client"
import { useAuth } from "@/components/auth/auth-provider"
import { resolvePrimaryRole } from "@/lib/role-tree"

/** Moderadores ciudadanos. Admin va a /admin/moderacion. */
export function ModeracionPageClient() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const primary = resolvePrimaryRole(user)

  useEffect(() => {
    if (loading) return
    if (primary === "admin") {
      router.replace("/admin/moderacion")
    }
  }, [loading, primary, router])

  if (loading || primary === "admin") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }

  return (
    <ModeracionClient
      basePath="/moderacion"
      editPathPrefix="/moderacion/convites"
      editWithSuffix
      allowedRoles={["moderador"]}
    />
  )
}
