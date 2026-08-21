"use client"

import { useState } from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

export type GaleriaLightboxItem = {
  tipo: "imagen" | "video"
  url: string
  ancho?: number | null
  alto?: number | null
  duracionSegundos?: number | null
}

type GaleriaLightboxProps = {
  items: GaleriaLightboxItem[]
  initialIndex: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Lightbox fullscreen reutilizable para la galería de una iniciativa.
 * Muestra imágenes y videos a su tamaño/aspect ratio real (sin recortar),
 * con navegación prev/next (click y teclado) y wrap-around en los extremos.
 *
 * Usa Dialog.Root de @base-ui/react en modo modal: por defecto ya atrapa el
 * foco dentro del popup, cierra con Escape, y devuelve el foco al elemento
 * que abrió el lightbox al cerrarse — no hay que reimplementar nada de eso.
 */
export function GaleriaLightbox({
  items,
  initialIndex,
  open,
  onOpenChange,
}: GaleriaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Resincronizamos el índice cuando el lightbox pasa de cerrado a abierto
  // (o cambia el índice inicial mientras está abierto), ajustando el estado
  // durante el render en vez de en un efecto — así evitamos el render extra
  // que produciría un setState síncrono dentro de un useEffect, y de paso
  // no perdemos la posición de navegación en cada re-render del padre.
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setCurrentIndex(initialIndex)
  }

  const hasMultiple = items.length > 1
  const current = items[currentIndex]

  function goPrev() {
    setCurrentIndex((i) => (i - 1 + items.length) % items.length)
  }

  function goNext() {
    setCurrentIndex((i) => (i + 1) % items.length)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!hasMultiple) return
    if (e.key === "ArrowLeft") {
      e.preventDefault()
      goPrev()
    } else if (e.key === "ArrowRight") {
      e.preventDefault()
      goNext()
    }
  }

  if (!current) return null

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange} modal>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-foreground/80" />
        <DialogPrimitive.Popup
          onKeyDown={onKeyDown}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            Galería multimedia
          </DialogPrimitive.Title>

          <DialogPrimitive.Close
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 rounded-full bg-background/90 p-2 text-foreground shadow transition-colors hover:bg-background"
          >
            <X className="h-5 w-5" />
          </DialogPrimitive.Close>

          {hasMultiple ? (
            <button
              type="button"
              aria-label="Anterior"
              onClick={goPrev}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 text-foreground shadow transition-colors hover:bg-background sm:left-4"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          ) : null}

          {hasMultiple ? (
            <button
              type="button"
              aria-label="Siguiente"
              onClick={goNext}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/90 p-2 text-foreground shadow transition-colors hover:bg-background sm:right-4"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          ) : null}

          <div className="flex max-h-[90vh] max-w-[90vw] items-center justify-center">
            {current.tipo === "video" ? (
              <video
                key={current.url}
                src={current.url}
                controls
                autoPlay={false}
                loop={false}
                className="max-h-[90vh] max-w-[90vw] object-contain"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- necesitamos el aspect ratio real, sin recorte
              <img
                key={current.url}
                src={current.url}
                alt=""
                className="max-h-[90vh] max-w-[90vw] object-contain"
              />
            )}
          </div>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
