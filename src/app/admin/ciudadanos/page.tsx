import { redirect } from "next/navigation"

/** Unificado en /admin/usuarios (F42). */
export default function AdminCiudadanosRedirectPage() {
  redirect("/admin/usuarios?tipo=ciudadano")
}
