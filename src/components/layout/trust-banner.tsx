import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TrustBanner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/8 px-4 py-3 sm:items-center',
        className,
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Users className="size-4.5" />
      </span>
      <p className="text-sm leading-snug text-foreground">
        <span className="font-semibold">Somos ciudadanos, no una fundación.</span>{' '}
        <span className="text-muted-foreground">
          Convites no recibe ni administra dinero: lo que suma son manos e insumos.
        </span>
      </p>
    </div>
  )
}
