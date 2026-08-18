"use client"

import Link from "next/link"
import { DashboardShell } from "@/components/layout/dashboard-shell"
import { Button } from "@/components/ui/button"
import { RolIntroColumnas } from "@/components/roles/rol-intro-columnas"
import { useRequireRoleTree } from "@/hooks/use-require-role-tree"
import {
  canAccessProfesionalPanel,
  perfilTabsForRole,
} from "@/lib/role-tree"

/**
 * Pestaña ciudadano: explicar rol profesional + enlace al formulario de registro.
 * Si ya tiene el rol, enlaza al panel operativo.
 */
export function SolicitudProfesionalClient() {
  const { user, token, loading } = useRequireRoleTree(
    "/panel/roles/profesional",
    ["aportante", "moderador", "profesional"],
  )
  const tabs = perfilTabsForRole(user, "/panel/roles/profesional")
  const yaProf = canAccessProfesionalPanel(user)

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando…
      </div>
    )
  }
  if (!token || !user) return null

  return (
    <DashboardShell
      title="Ser profesional"
      subtitle="Ofrece apoyo gratuito —psicología, legal, arquitectura, nutrición u otras áreas— a familias y comunidades. Verificamos título y certificados antes de publicar tu perfil."
      tabs={tabs}
    >
      <RolIntroColumnas
        porQueTitulo="¿Por qué necesitamos profesionales?"
        porQue={[
          "Después de una emergencia o en el día a día de un convite, a veces hace falta más que materiales: una escucha, un consejo legal, una mirada sobre la vivienda o la alimentación.",
          "Los profesionales voluntarios ponen su oficio al servicio de la comunidad, sin cobrar. Así la ayuda también llega con conocimiento y cuidado.",
          "Tu perfil se revisa con cariño y rigor: cuando queda aprobado, la gente puede encontrarte en Manos profesionales y pedirte una mano con confianza.",
        ]}
        funcionesTitulo="Qué hace un profesional"
        funciones={[
          "Apareces en el directorio de Manos profesionales",
          "Recibes solicitudes de contacto de la comunidad",
          "El rol se activa cuando un admin o moderador aprueba tu perfil (no al enviar el formulario)",
        ]}
      />

      {yaProf ? (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <p className="font-medium text-foreground">
            Ya tienes perfil profesional activo.
          </p>
          <Button className="mt-4" render={<Link href="/panel/profesional" />}>
            Ir a mi panel profesional
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5 md:p-6">
          <h2 className="font-serif text-xl text-foreground">
            Completar solicitud
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            El formulario pide tus datos, área, modalidad y documentos. Al
            enviarlo queda <strong>pendiente</strong>: el rol profesional solo se
            activa cuando un admin/moderador aprueba el perfil.
          </p>
          <Button
            className="mt-5"
            render={<Link href="/panel/roles/profesional/registro" />}
          >
            Crear registro profesional
          </Button>
        </div>
      )}
    </DashboardShell>
  )
}
