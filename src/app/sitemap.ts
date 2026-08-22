import type { MetadataRoute } from "next"
import { fetchIniciativasPage } from "@/lib/convites-api"
import { absoluteUrl } from "@/lib/site-url"

/** Regenera el sitemap como máximo cada 7 días (ISR). */
export const revalidate = 604800

const STATIC_PATHS: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/convites", changeFrequency: "daily", priority: 0.95 },
  { path: "/crear", changeFrequency: "monthly", priority: 0.85 },
  { path: "/centros", changeFrequency: "weekly", priority: 0.9 },
  { path: "/manos-profesionales", changeFrequency: "weekly", priority: 0.85 },
  { path: "/quienes-somos", changeFrequency: "monthly", priority: 0.7 },
  { path: "/terminos", changeFrequency: "yearly", priority: 0.3 },
  { path: "/descargo-de-responsabilidad", changeFrequency: "yearly", priority: 0.3 },
]

async function allIniciativaSlugs(): Promise<
  Array<{ slug: string; lastModified?: string | Date }>
> {
  const out: Array<{ slug: string; lastModified?: string | Date }> = []
  let page = 1
  let lastPage = 1
  do {
    const res = await fetchIniciativasPage({
      page,
      per_page: 50,
      server: true,
      revalidate: 604800,
    })
    for (const ini of res.data) {
      out.push({
        slug: ini.slug,
        lastModified: ini.fechaISO ?? undefined,
      })
    }
    lastPage = res.meta.last_page
    page += 1
  } while (page <= lastPage && page <= 40)
  return out
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((item) => ({
    url: absoluteUrl(item.path),
    lastModified: now,
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }))

  try {
    const iniciativas = await allIniciativaSlugs()
    for (const ini of iniciativas) {
      entries.push({
        url: absoluteUrl(`/iniciativa/${ini.slug}`),
        lastModified: ini.lastModified ?? now,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    }
  } catch {
    // API caída: sitemap estático igual sirve
  }

  return entries
}
