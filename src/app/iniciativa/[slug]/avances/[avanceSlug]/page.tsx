import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { fetchAvance, fetchIniciativa } from "@/lib/convites-api"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; avanceSlug: string }>
}): Promise<Metadata> {
  const { slug, avanceSlug } = await params
  try {
    const ini = await fetchIniciativa(slug, { server: true })
    if (!ini.uuid) return { title: "Avance" }
    const avance = await fetchAvance(ini.uuid, avanceSlug, { server: true })
    return { title: `${avance.titulo} — ${ini.titulo}` }
  } catch {
    return { title: "Avance" }
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

export default async function IniciativaAvanceDetallePage({
  params,
}: {
  params: Promise<{ slug: string; avanceSlug: string }>
}) {
  const { slug, avanceSlug } = await params

  let ini
  try {
    ini = await fetchIniciativa(slug, { server: true })
  } catch {
    notFound()
  }

  if (!ini.uuid) notFound()

  let avance
  try {
    avance = await fetchAvance(ini.uuid, avanceSlug, { server: true })
  } catch {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <article className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
          <Link
            href={`/iniciativa/${slug}/avances`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Todos los avances
          </Link>

          <p className="mt-6 text-sm text-muted-foreground">
            <Link
              href={`/iniciativa/${slug}`}
              className="hover:text-foreground hover:underline"
            >
              {ini.titulo}
            </Link>
          </p>

          <h1 className="mt-2 font-serif text-3xl text-foreground md:text-4xl">
            {avance.titulo}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {formatDate(avance.publicado_at)}
            {avance.autor?.name ? ` · ${avance.autor.name}` : ""}
            {avance.tipo === "item" && avance.item
              ? ` · ${avance.item.nombre}${avance.porcentaje != null ? ` · ${avance.porcentaje}%` : ""}`
              : " · Avance general"}
          </p>

          {avance.cuerpo ? (
            <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-foreground">
              {avance.cuerpo}
            </div>
          ) : null}

          {avance.media?.length ? (
            <ul className="mt-10 grid gap-4 sm:grid-cols-2">
              {avance.media.map((m) => (
                <li
                  key={m.id}
                  className="overflow-hidden rounded-2xl border border-border bg-muted"
                >
                  {m.tipo === "video" ? (
                    <video
                      src={m.url}
                      controls
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.url}
                      alt=""
                      className="aspect-video w-full object-cover"
                    />
                  )}
                </li>
              ))}
            </ul>
          ) : null}

          {avance.enlace_externo ? (
            <a
              href={avance.enlace_externo}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink className="size-4" />
              Ver enlace externo
            </a>
          ) : null}
        </article>
      </main>
      <SiteFooter />
    </div>
  )
}
