"use client"

import Link from "next/link"

type Props = {
  aceptaTerminos: boolean
  aceptaDescargo?: boolean
  onTerminosChange: (value: boolean) => void
  onDescargoChange?: (value: boolean) => void
  /** En login solo tiene sentido términos; en registro también el descargo. */
  mostrarDescargo?: boolean
}

export function AceptacionesLegales({
  aceptaTerminos,
  aceptaDescargo = false,
  onTerminosChange,
  onDescargoChange,
  mostrarDescargo = true,
}: Props) {
  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
        <input
          type="checkbox"
          checked={aceptaTerminos}
          onChange={(e) => onTerminosChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />
        <span className="text-sm leading-relaxed text-muted-foreground">
          He leído y acepto las{" "}
          <Link
            href="/terminos"
            target="_blank"
            className="font-medium text-primary transition-colors hover:text-primary/80"
          >
            reglas y términos
          </Link>{" "}
          de Convites.
        </span>
      </label>
      {mostrarDescargo ? (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <input
            type="checkbox"
            checked={aceptaDescargo}
            onChange={(e) => onDescargoChange?.(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span className="text-sm leading-relaxed text-muted-foreground">
            Declaro que los datos que entrego son veraces y de mi responsabilidad, y
            acepto el{" "}
            <Link
              href="/descargo-de-responsabilidad"
              target="_blank"
              className="font-medium text-primary transition-colors hover:text-primary/80"
            >
              descargo de responsabilidad
            </Link>
            . Entiendo que Convites es solo una herramienta de coordinación y que la
            plataforma y su desarrollador quedan liberados de toda responsabilidad por
            los acuerdos, aportes o datos entregados entre las partes.
          </span>
        </label>
      ) : null}
    </div>
  )
}
