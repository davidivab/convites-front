import { redirect } from "next/navigation"

/** Ruta pública legacy → formulario interno del panel. */
export default function RegistroProfesionalRedirectPage() {
  redirect("/panel/roles/profesional/registro")
}
