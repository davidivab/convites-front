import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { fetchAvances, fetchIniciativa } from "@/lib/convites-api"
import type { Metadata } from "next"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  try {
    const ini = await fetchIniciativa(slug, { server: true })
    return { title: `Avances — ${ini.titulo}` }
  } catch {
    return { title: "Avances" }
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

export default async function IniciativaAvancesPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let ini
  try {
    ini = await fetchIniciativa(slug, { server: true })
  } catch {
    notFound()
  }

  if (!ini.uuid) {
    notFound()
  }

  let avances: Awaited<ReturnType<typeof fetchAvances>>["data"] = []
  try {
    const res = await fetchAvances(ini.uuid, { limit: 100, server: true })
    avances = res.data ?? []
  } catch {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
          <Link
            href={`/iniciativa/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver al convite
          </Link>
          <h1 className="mt-6 font-serif text-3xl text-foreground md:text-4xl">
            Avances
          </h1>
          <p className="mt-2 text-muted-foreground">{ini.titulo}</p>

          {avances.length === 0 ? (
            <p className="mt-10 text-sm text-muted-foreground">
              Todavía no hay avances publicados.
            </p>
          ) : (
            <ul className="mt-10 space-y-6">
              {avances.map((a) => {
                const thumb =
                  a.media?.find((m) => m.tipo === "imagen") ?? a.media?.[0]
                return (
                  <li key={a.id}>
                    <Link
                      href={`/iniciativa/${slug}/avances/${a.slug}`}
                      className="flex gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                    >
                      {thumb ? (
                        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-muted">
                          {thumb.tipo === "video" ? (
                            <video
                              src={thumb.url}
                              className="h-full w-full object-cover"
                              muted
                            />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb.url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                      ) : null}
                      <div className="min-w-0">
                        <h2 className="font-serif text-xl text-foreground">
                          {a.titulo}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {formatDate(a.publicado_at)}
                          {a.tipo === "item" && a.item
                            ? ` · ${a.item.nombre}${a.porcentaje != null ? ` · ${a.porcentaje}%` : ""}`
                            : " · General"}
                        </p>
                        {a.cuerpo ? (
                          <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
                            {a.cuerpo}
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
