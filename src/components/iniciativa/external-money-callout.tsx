import { ExternalLink, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ExternalMoneyCallout({
  plataforma = "plataformas externas",
  url,
}: {
  plataforma?: string
  url?: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-muted/40 p-4">
      <div className="flex items-start gap-2.5">
        <Info className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Este enlace es de un tercero ({plataforma}).{' '}
          <span className="font-medium text-foreground">
            Convites no recibe ni administra dinero.
          </span>{' '}
          Si prefieres aportar en dinero, lo haces directamente en la plataforma externa.
        </p>
      </div>
      {url ? (
        <Button
          variant="outline"
          size="lg"
          className="mt-3 w-full"
          render={
            <a href={url} target="_blank" rel="noopener noreferrer">
              <span>Aportar dinero en {plataforma}</span>
              <ExternalLink data-icon="inline-end" />
            </a>
          }
        />
      ) : null}
    </div>
  )
}
