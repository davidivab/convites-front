"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DepartamentoMunicipioSelect } from "@/components/ui/departamento-municipio-select"
import { PhoneInput, isPhoneValid } from "@/components/ui/phone-input"
import { AceptacionesLegales } from "@/components/auth/aceptaciones-legales"
import { APTITUD_FISICA, GENEROS } from "@/lib/data"
import { ApiError } from "@/lib/api"
import {
  fetchCatalogos,
  fetchProfile,
  updateProfile,
} from "@/lib/convites-api"
import type {
  ApiDisponibilidad,
  ApiHabilidad,
  ApiProfile,
  AuthUser,
} from "@/lib/types"
import { Check } from "lucide-react"

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-full border px-3.5 py-2 text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

export function PerfilEditor({
  user,
  token,
  onboarding = false,
  onSaved,
}: {
  user: AuthUser
  token: string
  onboarding?: boolean
  onSaved?: () => void | Promise<void>
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(user.name)
  const [celular, setCelular] = useState("")
  const [departamentoId, setDepartamentoId] = useState("")
  const [municipioId, setMunicipioId] = useState("")
  const [barrio, setBarrio] = useState("")
  const [genero, setGenero] = useState("")
  const [edad, setEdad] = useState("")
  const [aptitud, setAptitud] = useState("media")
  const [notasSalud, setNotasSalud] = useState("")
  const [habilidadIds, setHabilidadIds] = useState<number[]>([])
  const [disponibilidadIds, setDisponibilidadIds] = useState<number[]>([])
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [aceptaDescargo, setAceptaDescargo] = useState(false)

  const [habilidades, setHabilidades] = useState<ApiHabilidad[]>([])
  const [disponibilidades, setDisponibilidades] = useState<ApiDisponibilidad[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [catalogos, profile] = await Promise.all([
          fetchCatalogos(false),
          fetchProfile(token),
        ])
        if (cancelled) return
        setHabilidades(catalogos.habilidades)
        setDisponibilidades(catalogos.disponibilidades)
        applyProfile(profile)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.body.message || "No pudimos cargar tu perfil."
              : "No pudimos cargar tu perfil.",
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [token])

  function applyProfile(profile: ApiProfile) {
    setName(profile.name || user.name)
    setCelular(profile.celular || "")
    setMunicipioId(profile.municipio_id ? String(profile.municipio_id) : "")
    setDepartamentoId(
      profile.municipio?.departamento?.id
        ? String(profile.municipio.departamento.id)
        : "",
    )
    setBarrio(profile.barrio || "")
    setGenero(profile.genero || "")
    setEdad(profile.edad != null ? String(profile.edad) : "")
    setAptitud(profile.aptitud_fisica || "media")
    setNotasSalud(profile.notas_salud || "")
    setHabilidadIds(profile.habilidades.map((h) => h.id))
    setDisponibilidadIds(profile.disponibilidades.map((d) => d.id))
  }

  const manuales = useMemo(
    () => habilidades.filter((h) => h.tipo === "manual"),
    [habilidades],
  )
  const conocimiento = useMemo(
    () => habilidades.filter((h) => h.tipo === "conocimiento"),
    [habilidades],
  )

  function toggleId(
    id: number,
    list: number[],
    setList: (v: number[]) => void,
  ) {
    setSaved(false)
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
  }

  async function onSave() {
    if (onboarding && (!aceptaTerminos || !aceptaDescargo)) {
      setError("Debes aceptar los términos y el descargo para terminar tu registro.")
      return
    }
    if (celular.trim() && !isPhoneValid(celular, false)) {
      setError("Revisa el celular: el indicativo y el número no son válidos.")
      return
    }
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const profile = await updateProfile(token, {
        name: name.trim(),
        celular: celular.trim() || null,
        municipio_id: municipioId ? Number(municipioId) : null,
        barrio: barrio.trim() || null,
        genero: genero || null,
        edad: edad ? Number(edad) : null,
        aptitud_fisica: aptitud || null,
        notas_salud: notasSalud.trim() || null,
        habilidad_ids: habilidadIds,
        disponibilidad_ids: disponibilidadIds,
        ...(onboarding
          ? { acepta_terminos: true, acepta_descargo: true }
          : {}),
      })
      applyProfile(profile)
      setSaved(true)
      await onSaved?.()
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos guardar los cambios."
          : "No pudimos guardar los cambios.",
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Cargando tu perfil…
      </p>
    )
  }

  return (
    <>
      <section
        id="editar"
        className="scroll-mt-32 rounded-xl border border-border bg-card p-6"
      >
        <h2 className="font-serif text-xl text-foreground">Datos personales</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={name}
              onChange={(e) => {
                setSaved(false)
                setName(e.target.value)
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="correo">Correo</Label>
            <Input id="correo" type="email" value={user.email} disabled />
          </div>
          <div className="grid gap-2 sm:col-span-2">
            <PhoneInput
              id="tel"
              label="Celular"
              value={celular}
              onChange={(v) => {
                setSaved(false)
                setError(null)
                setCelular(v)
              }}
              optional
            />
          </div>
        </div>

        <div className="mt-5 space-y-5">
          <DepartamentoMunicipioSelect
            departamentoId={departamentoId}
            onDepartamentoChange={(id) => {
              setSaved(false)
              setDepartamentoId(id)
            }}
            municipioId={municipioId}
            onMunicipioChange={(id) => {
              setSaved(false)
              setMunicipioId(id)
            }}
            municipioLabel="Ciudad"
            optional
          />
          <div className="grid gap-2">
            <Label htmlFor="barrio">Barrio</Label>
            <Textarea
              id="barrio"
              rows={2}
              placeholder="Ej: Villa Santana, Boston, Centro…"
              value={barrio}
              onChange={(e) => {
                setSaved(false)
                setBarrio(e.target.value)
              }}
            />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl text-foreground">Sobre mí</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Datos opcionales y privados. Nos ayudan a asignarte tareas seguras.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="genero">Género</Label>
            <Select
              value={genero || undefined}
              onValueChange={(v) => {
                setSaved(false)
                setGenero(v ?? "")
              }}
              items={GENEROS.map((g) => ({
                value: g.value,
                label: g.label,
              }))}
            >
              <SelectTrigger id="genero">
                <SelectValue placeholder="Elige una opción" />
              </SelectTrigger>
              <SelectContent>
                {GENEROS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edad">Edad</Label>
            <Input
              id="edad"
              type="number"
              min={14}
              max={110}
              value={edad}
              onChange={(e) => {
                setSaved(false)
                setEdad(e.target.value)
              }}
            />
          </div>
        </div>

        <fieldset className="mt-5 space-y-3">
          <legend className="text-sm font-medium text-foreground">
            Tipo de labores que puedo hacer
          </legend>
          <div className="grid gap-3">
            {APTITUD_FISICA.map((a) => (
              <label
                key={a.value}
                className={[
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
                  aptitud === a.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="aptitud-perfil"
                  value={a.value}
                  checked={aptitud === a.value}
                  onChange={() => {
                    setSaved(false)
                    setAptitud(a.value)
                  }}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="block font-medium text-foreground">
                    {a.label}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {a.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-5 grid gap-2">
          <Label htmlFor="salud">Condición de salud a tener en cuenta</Label>
          <Input
            id="salud"
            placeholder="Ej: problema de espalda, movilidad reducida..."
            value={notasSalud}
            onChange={(e) => {
              setSaved(false)
              setNotasSalud(e.target.value)
            }}
          />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl text-foreground">Cómo puedo ayudar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Mantén esto al día para que te avisemos de los convites que van contigo.
        </p>

        <fieldset className="mt-5 space-y-3">
          <legend className="text-sm font-medium text-foreground">
            Habilidades manuales
          </legend>
          <div className="flex flex-wrap gap-2">
            {manuales.map((h) => (
              <Chip
                key={h.id}
                active={habilidadIds.includes(h.id)}
                onClick={() => toggleId(h.id, habilidadIds, setHabilidadIds)}
              >
                {h.nombre}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6 space-y-3">
          <legend className="text-sm font-medium text-foreground">
            Conocimientos
          </legend>
          <div className="flex flex-wrap gap-2">
            {conocimiento.map((h) => (
              <Chip
                key={h.id}
                active={habilidadIds.includes(h.id)}
                onClick={() => toggleId(h.id, habilidadIds, setHabilidadIds)}
              >
                {h.nombre}
              </Chip>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6 space-y-3">
          <legend className="text-sm font-medium text-foreground">
            Disponibilidad
          </legend>
          <div className="flex flex-wrap gap-2">
            {disponibilidades.map((d) => (
              <Chip
                key={d.id}
                active={disponibilidadIds.includes(d.id)}
                onClick={() =>
                  toggleId(d.id, disponibilidadIds, setDisponibilidadIds)
                }
              >
                {d.nombre}
              </Chip>
            ))}
          </div>
        </fieldset>
      </section>

      {onboarding ? (
        <section className="mt-6 rounded-xl border border-border bg-card p-6">
          <h2 className="font-serif text-xl text-foreground">Aceptaciones</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Necesarias para cerrar el registro que quedó a medias.
          </p>
          <div className="mt-4">
            <AceptacionesLegales
              aceptaTerminos={aceptaTerminos}
              aceptaDescargo={aceptaDescargo}
              onTerminosChange={setAceptaTerminos}
              onDescargoChange={setAceptaDescargo}
              mostrarDescargo
            />
          </div>
        </section>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => void onSave()}
          disabled={
            saving || (onboarding && (!aceptaTerminos || !aceptaDescargo))
          }
          className="gap-2"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" /> Cambios guardados
            </>
          ) : saving ? (
            "Guardando…"
          ) : (
            "Guardar cambios"
          )}
        </Button>
        <Button variant="ghost" render={<Link href="/panel/aportante" />}>
          Ir a mi panel
        </Button>
      </div>
    </>
  )
}
