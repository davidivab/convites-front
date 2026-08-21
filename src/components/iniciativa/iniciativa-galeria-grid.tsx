"use client"

import Image from "next/image"
import { useState } from "react"
import { Play } from "lucide-react"
import {
  GaleriaLightbox,
  type GaleriaLightboxItem,
} from "@/components/iniciativa/galeria-lightbox"

type GaleriaGridItem = GaleriaLightboxItem & { id: string }

type Props = {
  items: GaleriaGridItem[]
}

/**
 * Grid público de la galería de una iniciativa. Fotos y videos van
 * mezclados en el mismo orden que trae la API (no se separan en secciones).
 * Cada celda es clickeable y abre el lightbox en el índice correspondiente.
 */
export function IniciativaGaleriaGrid({ items }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  if (items.length === 0) return null

  return (
    <>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((g, i) => (
          <li
            key={g.id}
            className="relative aspect-square overflow-hidden rounded-xl bg-muted"
          >
            <button
              type="button"
              className="absolute inset-0 block h-full w-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              onClick={() => setOpenIndex(i)}
              aria-label={g.tipo === "video" ? "Ver video" : "Ver foto"}
            >
              {g.tipo === "video" ? (
                <video
                  src={g.url}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
              ) : (
                <Image
                  src={g.url}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 220px"
                  className="object-cover"
                />
              )}
              {g.tipo === "video" ? (
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/20">
                  <Play className="h-8 w-8 fill-white text-white drop-shadow" />
                </span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>

      <GaleriaLightbox
        items={items}
        initialIndex={openIndex ?? 0}
        open={openIndex != null}
        onOpenChange={(open) => {
          if (!open) setOpenIndex(null)
        }}
      />
    </>
  )
}
