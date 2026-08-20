import Link from "next/link"
import type { ApiAvance } from "@/lib/types"

function formatDate(iso: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return ""
  }
}

export function AvancesAsideCard({
  slug,
  avances,
  total,
}: {
  slug: string
  avances: ApiAvance[]
  total: number
}) {
  if (total < 1 || avances.length === 0) return null

  return (
    <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="font-serif text-xl font-semibold text-foreground">
        Avances
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Lo más reciente del convite.
      </p>
      <ul className="mt-4 divide-y divide-border">
        {avances.map((a) => {
          const thumb = a.media?.find((m) => m.tipo === "imagen") ?? a.media?.[0]
          return (
            <li key={a.id} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={`/iniciativa/${slug}/avances/${a.slug}`}
                className="flex gap-3 transition-colors hover:opacity-90"
              >
                {thumb ? (
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
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
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {a.titulo}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(a.publicado_at)}
                    {a.tipo === "item" && a.item
                      ? ` · ${a.item.nombre}${a.porcentaje != null ? ` · ${a.porcentaje}%` : ""}`
                      : " · General"}
                  </p>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
      {total > avances.length ? (
        <Link
          href={`/iniciativa/${slug}/avances`}
          className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Ver más
        </Link>
      ) : (
        <Link
          href={`/iniciativa/${slug}/avances`}
          className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
        >
          Ver todos
        </Link>
      )}
    </div>
  )
}
