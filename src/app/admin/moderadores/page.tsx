import { redirect } from "next/navigation"

/** Unificado en /admin/usuarios (F42). */
export default function AdminModeradoresRedirectPage() {
  redirect("/admin/usuarios?tipo=moderador")
}
