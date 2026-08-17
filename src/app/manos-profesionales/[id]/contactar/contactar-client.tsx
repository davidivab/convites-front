"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AREA_PROFESIONAL,
  type Profesional,
} from "@/lib/data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/components/auth/auth-provider"
import { DepartamentoMunicipioSelect } from "@/components/ui/departamento-municipio-select"
import { PhoneInput, isPhoneValid } from "@/components/ui/phone-input"
import { ApiError } from "@/lib/api"
import { contactarProfesional } from "@/lib/convites-api"
import {
  ArrowLeft,
  MapPin,
  Clock,
  Monitor,
  CheckCircle2,
  ShieldCheck,
  Send,
  Phone,
  Mail,
} from "lucide-react"

type Preferencia = "llamada" | "whatsapp" | "correo"

const PREFERENCIAS: { value: Preferencia; label: string; icon: typeof Phone }[] = [
  { value: "llamada", label: "Llamada", icon: Phone },
  { value: "whatsapp", label: "WhatsApp", icon: Phone },
  { value: "correo", label: "Correo", icon: Mail },
]

export function ContactarClient({ profesional }: { profesional: Profesional }) {
  const { token, user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [celular, setCelular] = useState("")
  const [correo, setCorreo] = useState("")
  const [municipioId, setMunicipioId] = useState("")
  const [preferencia, setPreferencia] = useState<Preferencia>("whatsapp")
  const [mensaje, setMensaje] = useState("")
  const [enviado, setEnviado] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      setNombre((prev) => prev || user.name || "")
      setCorreo((prev) => prev || user.email || "")
    }
  }, [user])

  const valido =
    nombre.trim() !== "" &&
    isPhoneValid(celular, true) &&
    mensaje.trim() !== ""

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valido || submitting) return

    if (!token) {
      router.push(
        `/ingresar?next=${encodeURIComponent(`/manos-profesionales/${profesional.id}/contactar`)}`,
      )
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await contactarProfesional(token, profesional.id, {
        nombre: nombre.trim(),
        celular: celular.trim(),
        email: correo.trim() || null,
        municipio_id: municipioId ? Number(municipioId) : null,
        preferencia_contacto: preferencia,
        mensaje: mensaje.trim(),
      })
      setEnviado(true)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.body.message || "No pudimos enviar la solicitud."
          : "No pudimos enviar la solicitud.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (enviado) {
    return (
      <section className="mx-auto w-full max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-7 text-primary" />
          </span>
          <h1 className="mt-5 font-serif text-2xl text-foreground">
            Tu solicitud fue enviada
          </h1>
          <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">
            Le enviamos tus datos a{" "}
            <span className="font-medium text-foreground">{profesional.nombre}</span>. La
            persona revisará tu caso y te contactará directamente por el medio que
            elegiste. No tienes que hacer nada más.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button render={<Link href="/manos-profesionales" />}>
              Volver a profesionales
            </Button>
            <Button variant="outline" render={<Link href="/" />}>
              Ir al inicio
            </Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 md:py-14">
      <Link
        href="/manos-profesionales"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a Manos profesionales
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Formulario */}
        <div className="order-2 lg:order-1">
          <p className="text-sm font-medium text-primary">Solicitar contacto</p>
          <h1 className="mt-2 text-balance font-serif text-3xl leading-tight text-foreground md:text-4xl">
            Cuéntale a {profesional.nombre.split(" ")[0]} cómo te puede ayudar
          </h1>
          <p className="mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Déjanos tus datos y una breve descripción de lo que necesitas. Se los haremos
            llegar y será la persona quien te contacte directamente.
          </p>

          {!authLoading && !token ? (
            <p className="mt-4 rounded-xl border border-border bg-sidebar/60 px-4 py-3 text-sm text-muted-foreground">
              Necesitas{" "}
              <Link
                href={`/ingresar?next=${encodeURIComponent(`/manos-profesionales/${profesional.id}/contactar`)}`}
                className="font-medium text-primary underline"
              >
                iniciar sesión
              </Link>{" "}
              para enviar la solicitud.
            </p>
          ) : null}

          <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="nombre">
                  Tu nombre <span className="text-primary">*</span>
                </Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre y apellido"
                  required
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <PhoneInput
                  id="celular"
                  label="Celular"
                  value={celular}
                  onChange={setCelular}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="correo">Correo (opcional)</Label>
                <Input
                  id="correo"
                  type="email"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tucorreo@correo.com"
                />
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <DepartamentoMunicipioSelect
                  municipioId={municipioId}
                  onMunicipioChange={setMunicipioId}
                  optional
                  departamentoLabel="Tu departamento"
                  municipioLabel="Tu municipio"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>¿Cómo prefieres que te contacten?</Label>
              <div className="flex flex-wrap gap-2">
                {PREFERENCIAS.map((p) => {
                  const Icon = p.icon
                  const active = preferencia === p.value
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPreferencia(p.value)}
                      className={
                        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors " +
                        (active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground")
                      }
                    >
                      <Icon className="size-3.5" />
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="mensaje">
                ¿Qué necesitas? <span className="text-primary">*</span>
              </Label>
              <Textarea
                id="mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Describe brevemente tu situación para que la persona sepa cómo ayudarte."
                rows={5}
                required
              />
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-border bg-secondary/40 p-4">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed text-foreground/80">
                Tus datos solo se comparten con este profesional para que pueda
                contactarte. Convites no cobra ni intermedia en esta ayuda.
              </p>
            </div>

            {error ? <p className="text-sm text-destructive">{error}</p> : null}

            <Button
              type="submit"
              size="lg"
              disabled={!valido || submitting}
              className="w-full sm:w-auto"
            >
              <Send className="size-4" />
              {submitting ? "Enviando…" : "Enviar solicitud"}
            </Button>
            {!valido && (
              <p className="text-xs text-muted-foreground">
                Completa tu nombre, celular y el mensaje para enviar.
              </p>
            )}
          </form>
        </div>

        {/* Resumen del profesional */}
        <aside className="order-1 lg:order-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-24">
            <div className="flex items-center gap-3">
              <span
                className="inline-flex size-12 items-center justify-center rounded-full bg-primary/10 font-serif text-lg text-primary"
                aria-hidden="true"
              >
                {profesional.inicial}
              </span>
              <div className="min-w-0">
                <h2 className="truncate font-serif text-lg text-foreground">
                  {profesional.nombre}
                </h2>
                <p className="truncate text-sm text-muted-foreground">
                  {profesional.titulo}
                </p>
              </div>
            </div>

            <span className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              {AREA_PROFESIONAL[profesional.area].label}
            </span>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {profesional.descripcion}
            </p>

            <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-foreground/80">{profesional.zona}</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-foreground/80">{profesional.modalidad}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <span className="text-foreground/80">{profesional.disponibilidad}</span>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  )
}
