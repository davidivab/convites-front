"use client"

import { useCallback, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import "react-easy-crop/react-easy-crop.css"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { isImageFile } from "@/lib/image-resize"
import { ImagePlus, Trash2 } from "lucide-react"

const ASPECT = 16 / 9

async function cropToBlob(
  imageSrc: string,
  crop: Area,
  outW = 1600,
  outH = 900,
): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.addEventListener("load", () => resolve(img))
    img.addEventListener("error", () => reject(new Error("No se pudo cargar la imagen")))
    img.src = imageSrc
  })

  const canvas = document.createElement("canvas")
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("No se pudo preparar el recorte")

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outW,
    outH,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("No se pudo guardar el recorte"))),
      "image/jpeg",
      0.88,
    )
  })
}

type Props = {
  previewUrl: string | null
  onCropped: (blob: Blob) => Promise<void> | void
  onClear: () => void
  busy?: boolean
}

/**
 * Portada 16:9: el usuario mueve/zoom la foto dentro del marco (sin deformar).
 */
export function PortadaCrop({ previewUrl, onCropped, onClear, busy }: Props) {
  const [localSrc, setLocalSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const workingSrc = localSrc

  const onFile = (file: File | null) => {
    setError(null)
    if (!file) return
    if (!isImageFile(file)) {
      setError("Solo se permiten archivos de imagen (JPG, PNG, WebP…).")
      return
    }
    if (localSrc) URL.revokeObjectURL(localSrc)
    setLocalSrc(URL.createObjectURL(file))
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedArea(pixels)
  }, [])

  async function confirmCrop() {
    if (!workingSrc || !croppedArea) return
    setSaving(true)
    setError(null)
    try {
      const blob = await cropToBlob(workingSrc, croppedArea)
      await onCropped(blob)
      URL.revokeObjectURL(workingSrc)
      setLocalSrc(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar la portada.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Imagen de portada</Label>
        {(previewUrl || workingSrc) && !workingSrc ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={onClear}
            disabled={busy || saving}
          >
            <Trash2 className="h-3.5 w-3.5" /> Quitar
          </Button>
        ) : null}
      </div>
      <p className="text-sm text-muted-foreground">
        Elige una foto y encuádrala en el rectángulo horizontal (16:9), el mismo
        formato de las tarjetas y la ficha del convite. Arrastra y usa el zoom.
      </p>

      {workingSrc ? (
        <div className="space-y-3">
          <div className="relative h-56 w-full overflow-hidden rounded-xl bg-muted sm:h-72">
            <Cropper
              image={workingSrc}
              crop={crop}
              zoom={zoom}
              aspect={ASPECT}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              showGrid={false}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="portada-zoom" className="text-xs text-muted-foreground">
              Acercar
            </Label>
            <input
              id="portada-zoom"
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() => void confirmCrop()}
              disabled={saving || busy}
            >
              {saving || busy ? "Guardando…" : "Usar esta foto"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (localSrc) URL.revokeObjectURL(localSrc)
                setLocalSrc(null)
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : previewUrl ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Portada del convite"
            className="h-full w-full object-cover"
          />
          <label className="absolute inset-x-0 bottom-0 cursor-pointer bg-background/90 px-3 py-2 text-center text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-background">
            Cambiar foto
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      ) : (
        <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/60">
          <ImagePlus className="h-8 w-8 text-primary" />
          <span className="font-medium text-foreground">Subir imagen de portada</span>
          <span>JPG, PNG o WebP · se recorta a 16:9</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
