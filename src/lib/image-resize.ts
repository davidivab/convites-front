/** Redimensiona una imagen manteniendo proporción; tope maxPx en el lado mayor. */
export async function resizeImageFile(
  file: File,
  maxPx = 2000,
  quality = 0.85,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxPx / bitmap.width, maxPx / bitmap.height)
    const w = Math.max(1, Math.round(bitmap.width * scale))
    const h = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("No se pudo preparar la imagen")
    ctx.drawImage(bitmap, 0, 0, w, h)
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("No se pudo comprimir la imagen"))),
        "image/jpeg",
        quality,
      )
    })
    return blob
  } finally {
    bitmap.close()
  }
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}
