import { Check, Hammer, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { progresoItem, type ItemNecesario } from '@/lib/data'

export function ItemProgressRow({
  item,
  className,
}: {
  item: ItemNecesario
  className?: string
}) {
  const pct = progresoItem(item)
  const completo = pct >= 100
  const Icon = completo ? Check : item.nombre.toLowerCase().includes('comida') ? Package : Hammer

  return (
    <div className={cn('py-3', className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-lg',
              completo ? 'bg-accent/12 text-accent' : 'bg-muted text-muted-foreground',
            )}
          >
            <Icon className="size-4" />
          </span>
          <span className="truncate text-sm font-medium text-foreground">{item.nombre}</span>
        </div>
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{item.aportado}</span> / {item.meta}{' '}
          {item.unidad}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${item.nombre}: ${pct}% completado`}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all',
              completo ? 'bg-accent' : 'bg-primary',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
          {pct}%
        </span>
      </div>
    </div>
  )
}
