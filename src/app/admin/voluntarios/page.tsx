import { redirect } from "next/navigation"

/** Unificado en /admin/usuarios (F42). */
export default function AdminVoluntariosRedirectPage() {
  redirect("/admin/usuarios?tipo=voluntario")
}
