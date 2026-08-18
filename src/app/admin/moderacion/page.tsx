import type { Metadata } from "next"
import { ModeracionClient } from "@/app/moderacion/moderacion-client"

export const metadata: Metadata = {
  title: "Moderación | Admin",
}

export default function AdminModeracionPage() {
  return (
    <ModeracionClient
      basePath="/admin/moderacion"
      editPathPrefix="/admin/convites"
      editWithSuffix={false}
      allowedRoles={["admin"]}
    />
  )
}
