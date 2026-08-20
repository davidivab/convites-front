"use client"

import { useCallback, useEffect, useState } from "react"
import { PortadaCrop } from "@/components/iniciativa/portada-crop"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { apiErrorMessage } from "@/lib/api"
import {
  createAvance,
  deleteAvance,
  deleteAvanceMedia,
  fetchAvances,
  updateAvance,
  uploadAvanceMedia,
} from "@/lib/convites-api"
import type { ApiAvance, ApiIniciativaItem } from "@/lib/types"
import { ImagePlus, Trash2 } from "lucide-react"

const MAX_VIDEO_SECONDS = 120

async function videoDurationSeconds(file: File): Promise<number> {
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

function formatDate(iso: string | null): string {
  if (!iso) return "Borrador"
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

type Props = {
  token: string
  iniciativaUuid: string | null | undefined
  items: ApiIniciativaItem[]
}

export function AvancesEditorPanel({
  token,
  iniciativaUuid,
  items,
}: Props) {
  const [list, setList] = useState<ApiAvance[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiMissing, setApiMissing] = useState(false)

  const [titulo, setTitulo] = useState("")
  const [cuerpo, setCuerpo] = useState("")
  const [tipo, setTipo] = useState<"general" | "item">("general")
  const [itemId, setItemId] = useState("")
  const [porcentaje, setPorcentaje] = useState("")
  const [enlace, setEnlace] = useState("")
  const [notificar, setNotificar] = useState(false)
  const [publicado, setPublicado] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [pendingCropFor, setPendingCropFor] = useState<number | null>(null)

  const reload = useCallback(async () => {
    if (!iniciativaUuid) {
      setList([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetchAvances(iniciativaUuid, { limit: 50 })
      setList(res.data ?? [])
      setApiMissing(false)
    } catch (err) {
      const status =
        err && typeof err === "object" && "status" in err
          ? Number((err as { status: number }).status)
          : 0
      if (status === 404 || status === 501) {
        setApiMissing(true)
        setList([])
      } else {
        setError(apiErrorMessage(err, "No pudimos cargar los avances."))
      }
    } finally {
      setLoading(false)
    }
  }, [iniciativaUuid])

  useEffect(() => {
    void reload()
  }, [reload])

  function resetForm() {
    setTitulo("")
    setCuerpo("")
    setTipo("general")
    setItemId("")
    setPorcentaje("")
    setEnlace("")
    setNotificar(false)
    setPublicado(true)
    setEditingId(null)
  }

  function loadIntoForm(a: ApiAvance) {
    setEditingId(a.id)
    setTitulo(a.titulo)
    setCuerpo(a.cuerpo ?? "")
    setTipo(a.tipo)
    setItemId(a.iniciativa_item_id ? String(a.iniciativa_item_id) : "")
    setPorcentaje(a.porcentaje != null ? String(a.porcentaje) : "")
    setEnlace(a.enlace_externo ?? "")
    setNotificar(Boolean(a.notificar_aportantes))
    setPublicado(Boolean(a.publicado_at))
  }

  async function onSave() {
    if (!iniciativaUuid || busy) return
    if (!titulo.trim()) {
      setError("Escribe un título para el avance.")
      return
    }
    if (tipo === "item") {
      if (!itemId) {
        setError("Elige el ítem del avance.")
        return
      }
      const pct = Number(porcentaje)
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        setError("El porcentaje debe estar entre 0 y 100.")
        return
      }
    }

    setBusy(true)
    setError(null)
    const payload = {
      titulo: titulo.trim(),
      cuerpo: cuerpo.trim() || null,
      tipo,
      iniciativa_item_id: tipo === "item" ? Number(itemId) : null,
      porcentaje: tipo === "item" ? Number(porcentaje) : null,
      enlace_externo: enlace.trim() || null,
      notificar_aportantes: notificar,
      publicado,
    }
    try {
      if (editingId) {
        await updateAvance(token, iniciativaUuid, editingId, payload)
      } else {
        const created = await createAvance(token, iniciativaUuid, payload)
        setPendingCropFor(created.id)
      }
      resetForm()
      await reload()
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos guardar el avance."))
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(id: number) {
    if (!iniciativaUuid || busy) return
    if (!confirm("¿Eliminar este avance?")) return
    setBusy(true)
    try {
      await deleteAvance(token, iniciativaUuid, id)
      await reload()
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos eliminar el avance."))
    } finally {
      setBusy(false)
    }
  }

  async function onPhotoCropped(avanceId: number, blob: Blob) {
    if (!iniciativaUuid) return
    setBusy(true)
    setError(null)
    try {
      await uploadAvanceMedia(token, iniciativaUuid, avanceId, blob, "foto.jpg")
      setPendingCropFor(null)
      await reload()
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos subir la foto."))
    } finally {
      setBusy(false)
    }
  }

  async function onVideoFile(avanceId: number, file: File | null) {
    if (!file || !iniciativaUuid) return
    setBusy(true)
    setError(null)
    try {
      const secs = await videoDurationSeconds(file)
      if (secs > MAX_VIDEO_SECONDS) {
        setError("El video no puede durar más de 2 minutos.")
        return
      }
      await uploadAvanceMedia(
        token,
        iniciativaUuid,
        avanceId,
        file,
        file.name || "video.mp4",
      )
      await reload()
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos subir el video."))
    } finally {
      setBusy(false)
    }
  }

  async function onRemoveMedia(avanceId: number, mediaId: number) {
    if (!iniciativaUuid || busy) return
    setBusy(true)
    try {
      await deleteAvanceMedia(token, iniciativaUuid, avanceId, mediaId)
      await reload()
    } catch (err) {
      setError(apiErrorMessage(err, "No pudimos quitar el archivo."))
    } finally {
      setBusy(false)
    }
  }

  if (!iniciativaUuid) {
    return (
      <p className="text-sm text-muted-foreground">
        Este convite aún no tiene UUID de API. Cuando Claude cierre P54 (uuid en
        iniciativas), podrás publicar avances aquí.
      </p>
    )
  }

  if (apiMissing) {
    return (
      <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-foreground">
        El endpoint de avances (P54) todavía no está disponible en el API. La
        pestaña quedará lista en cuanto se despliegue.
      </p>
    )
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h2 className="font-serif text-xl text-foreground">Reportar avance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuenta cómo va el convite. El porcentaje de un ítem es solo
          informativo: no cambia la barra de “Lo que falta”.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-5 rounded-xl border border-border bg-card p-4 md:p-5">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground">Tipo</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="avance-tipo"
                checked={tipo === "general"}
                onChange={() => setTipo("general")}
              />
              Avance general
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="avance-tipo"
                checked={tipo === "item"}
                onChange={() => setTipo("item")}
              />
              De un ítem
            </label>
          </div>
        </fieldset>

        {tipo === "item" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Ítem</Label>
              <Select
                value={itemId || undefined}
                onValueChange={(v) => setItemId(v ?? "")}
                items={items.map((it) => ({
                  value: String(it.id),
                  label: it.nombre,
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige un ítem" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((it) => (
                    <SelectItem key={it.id} value={String(it.id)}>
                      {it.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="avance-pct">Porcentaje (0–100)</Label>
              <Input
                id="avance-pct"
                type="number"
                min={0}
                max={100}
                value={porcentaje}
                onChange={(e) => setPorcentaje(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="avance-titulo">Título</Label>
          <Input
            id="avance-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Levantamos las paredes del primer piso"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avance-cuerpo">Detalle (opcional)</Label>
          <Textarea
            id="avance-cuerpo"
            rows={4}
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="avance-link">Link externo (opcional)</Label>
          <Input
            id="avance-link"
            type="url"
            value={enlace}
            onChange={(e) => setEnlace(e.target.value)}
            placeholder="https://…"
          />
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={notificar}
            onChange={(e) => setNotificar(e.target.checked)}
          />
          <span>
            Notificar a aportantes
            <span className="block text-muted-foreground">
              Apagado por defecto. Si lo marcas, se envía un correo a quienes
              ya aportaron.
            </span>
          </span>
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={publicado}
            onChange={(e) => setPublicado(e.target.checked)}
          />
          Publicar ahora (visible en la página del convite)
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy} onClick={() => void onSave()}>
            {editingId ? "Actualizar avance" : "Guardar avance"}
          </Button>
          {editingId ? (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={resetForm}
            >
              Cancelar edición
            </Button>
          ) : null}
        </div>
      </div>

      {pendingCropFor ? (
        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-sm font-medium text-foreground">
            Agregar foto al avance (recorte 16:9)
          </p>
          <PortadaCrop
            previewUrl={null}
            busy={busy}
            onCropped={(blob) => onPhotoCropped(pendingCropFor, blob)}
            onClear={() => setPendingCropFor(null)}
          />
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="font-serif text-lg text-foreground">Avances guardados</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no hay avances.</p>
        ) : (
          <ul className="space-y-3">
            {list.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{a.titulo}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(a.publicado_at)}
                      {a.tipo === "item" && a.item
                        ? ` · ${a.item.nombre}${a.porcentaje != null ? ` · ${a.porcentaje}%` : ""}`
                        : " · General"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => loadIntoForm(a)}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => setPendingCropFor(a.id)}
                    >
                      <ImagePlus className="mr-1 h-3.5 w-3.5" />
                      Foto
                    </Button>
                    <label className="inline-flex cursor-pointer items-center rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                      Video
                      <input
                        type="file"
                        accept="video/*"
                        className="sr-only"
                        disabled={busy}
                        onChange={(e) => {
                          void onVideoFile(a.id, e.target.files?.[0] ?? null)
                          e.target.value = ""
                        }}
                      />
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void onDelete(a.id)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {a.media?.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {a.media.map((m) => (
                      <li
                        key={m.id}
                        className="group relative h-16 w-24 overflow-hidden rounded-lg border border-border bg-muted"
                      >
                        {m.tipo === "video" ? (
                          <video
                            src={m.url}
                            className="h-full w-full object-cover"
                            muted
                          />
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          className="absolute right-1 top-1 rounded-full bg-background/90 p-1 opacity-0 group-hover:opacity-100"
                          aria-label="Quitar media"
                          onClick={() => void onRemoveMedia(a.id, m.id)}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
