"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type PageIntroSectionProps = {
  title: string;
  description?: ReactNode;
  /** Línea corta encima del título (ej. “Directorio de emergencia”). */
  eyebrow?: ReactNode;
  children?: ReactNode;
  /** Clases del `<section>` visible al abrir. */
  className?: string;
  /** Empieza abierto. Por defecto cerrado. */
  defaultOpen?: boolean;
};

/**
 * Encabezado de página colapsable.
 * Cerrado: solo el título en tamaño reducido + chevron fuera.
 * Abierto: section completa (eyebrow, título, descripción, children) + chevron fuera.
 */
export function PageIntroSection({
  title,
  description,
  eyebrow,
  children,
  className,
  defaultOpen = false,
}: PageIntroSectionProps) {
  const [abierto, setAbierto] = useState(defaultOpen);
  const panelId = useId();

  return (
    <>
      {abierto ? (
        <section
          id={panelId}
          className={cn("border-b border-border bg-sidebar/60", className)}
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:py-8">
            {eyebrow ? (
              <p className="text-sm font-medium text-primary">{eyebrow}</p>
            ) : null}
            <h1
              className={cn(
                "font-serif text-3xl font-semibold text-balance text-foreground md:text-4xl",
                eyebrow && "mt-2",
              )}
            >
              {title}
            </h1>
            {description ? (
              <div className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
                {description}
              </div>
            ) : null}
            {children ? <div className="mt-6 max-w-2xl">{children}</div> : null}
          </div>
        </section>
      ) : (
        <div
          className={cn(
            "border-b border-border bg-sidebar/60",
            className,
          )}
        >
          <div className="mx-auto w-full max-w-6xl px-4 py-3">
            <p className="font-serif text-base font-semibold text-foreground md:text-lg">
              {title}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-controls={panelId}
        className="flex w-full flex-col items-center py-2.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="sr-only">
          {abierto ? `Ocultar ${title}` : `Mostrar ${title}`}
        </span>
        <ChevronDown
          className={cn(
            "size-6 transition-transform duration-200",
            abierto && "rotate-180",
          )}
        />
      </button>
    </>
  );
}
