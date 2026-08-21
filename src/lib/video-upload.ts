/**
 * Utilidades para subir video a la galería de una iniciativa.
 * Mismo criterio y técnica que src/components/iniciativa/avances-editor-panel.tsx:
 * la duración se lee client-side cargando el archivo en un <video> oculto y
 * esperando el evento `loadedmetadata`.
 */

export const MAX_VIDEO_SECONDS = 120
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/")
}

export async function videoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement("video")
    video.preload = "metadata"
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(video.duration) ? video.duration : 0)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("No se pudo leer el video"))
    }
    video.src = url
  })
}
