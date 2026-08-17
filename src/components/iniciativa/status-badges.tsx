import { Circle, Clock, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ESTADO_LABEL, URGENCIA_LABEL, type EstadoIniciativa, type Urgencia } from '@/lib/data'

const ESTADO_STYLES: Record<EstadoIniciativa, string> = {
  borrador: 'bg-muted text-muted-foreground border-border',
  'en-revision': 'bg-warning/15 text-warning-foreground border-warning/30',
  publicada: 'bg-secondary text-secondary-foreground border-transparent',
  'en-curso': 'bg-accent/12 text-accent border-accent/25',
  cerrada: 'bg-muted text-muted-foreground border-border',
  rechazada: 'bg-destructive/10 text-destructive border-destructive/25',
}

const ESTADO_ICON: Record<EstadoIniciativa, typeof Circle> = {
  borrador: Circle,
  'en-revision': Clock,
  publicada: CheckCircle2,
  'en-curso': Loader2,
  cerrada: Circle,
  rechazada: AlertTriangle,
}

export function StatusBadge({
  estado,
  className,
}: {
  estado: EstadoIniciativa
  className?: string
}) {
  const Icon = ESTADO_ICON[estado]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        ESTADO_STYLES[estado],
        className,
      )}
    >
      <Icon className="size-3" />
      {ESTADO_LABEL[estado]}
    </span>
  )
}

const URGENCIA_STYLES: Record<Urgencia, string> = {
  alta: 'bg-primary/10 text-primary border-primary/25',
  media: 'bg-warning/15 text-warning-foreground border-warning/30',
  baja: 'bg-muted text-muted-foreground border-border',
}

export function UrgencyBadge({
  urgencia,
  className,
}: {
  urgencia: Urgencia
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        URGENCIA_STYLES[urgencia],
        className,
      )}
    >
      {urgencia === 'alta' && <AlertTriangle className="size-3" />}
      {URGENCIA_LABEL[urgencia]}
    </span>
  )
}
