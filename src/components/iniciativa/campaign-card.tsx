import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import { StatusBadge, UrgencyBadge } from '@/components/iniciativa/status-badges'
import { CATEGORIAS, progresoTotal, type Iniciativa } from '@/lib/data'

export function CampaignCard({ iniciativa }: { iniciativa: Iniciativa }) {
  const pct = progresoTotal(iniciativa.items)

  return (
    <Link
      href={`/iniciativa/${iniciativa.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-foreground/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={iniciativa.imagen || '/placeholder.svg'}
          alt={iniciativa.titulo}
          fill
          sizes="(max-width: 768px) 100vw, 400px"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <UrgencyBadge urgencia={iniciativa.urgencia} className="bg-background/90 backdrop-blur-sm" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">
            {CATEGORIAS[iniciativa.categoria]}
          </span>
          <StatusBadge estado={iniciativa.estado} />
        </div>

        <h3 className="font-serif text-lg leading-snug font-semibold text-balance text-foreground">
          {iniciativa.titulo}
        </h3>

        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            {iniciativa.zona}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" />
            {iniciativa.fechaConvite}
          </span>
        </div>

        <div className="mt-auto pt-1">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-foreground">Lo que ya suma la comunidad</span>
            <span className="font-semibold tabular-nums text-primary">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
