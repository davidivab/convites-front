import { redirect } from "next/navigation"

/** Unificado en /admin/usuarios?tipo=pendientes (F42). */
export default function AdminSolicitudesRolRedirectPage() {
  redirect("/admin/usuarios?tipo=pendientes")
}
