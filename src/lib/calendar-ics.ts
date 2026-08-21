/**
 * Genera .ics (día completo) y URL de Google Calendar para un convite.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

/** YYYY-MM-DD → YYYYMMDD */
export function toIcsDate(isoDate: string): string {
  const d = isoDate.slice(0, 10).replace(/-/g, "")
  return /^\d{8}$/.test(d) ? d : ""
}

/** Fin exclusivo del día siguiente (VALUE=DATE). */
export function nextIcsDate(isoDate: string): string {
  const start = isoDate.slice(0, 10)
  const dt = new Date(`${start}T12:00:00Z`)
  if (Number.isNaN(dt.getTime())) return ""
  dt.setUTCDate(dt.getUTCDate() + 1)
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}`
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

export type ConviteCalendarInput = {
  titulo: string
  /** YYYY-MM-DD */
  fechaISO: string
  lugar: string
  ciudad?: string | null
  descripcion?: string | null
  url?: string | null
  uid?: string | null
}

export function buildConviteIcs(input: ConviteCalendarInput): string | null {
  const dtStart = toIcsDate(input.fechaISO)
  const dtEnd = nextIcsDate(input.fechaISO)
  if (!dtStart || !dtEnd) return null

  const location = [input.lugar, input.ciudad].filter(Boolean).join(", ")
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z")
  const uid =
    input.uid ??
    `convite-${dtStart}-${Math.random().toString(36).slice(2, 10)}@convites.co`

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Convites//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${escapeIcsText(input.titulo)}`,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    input.descripcion
      ? `DESCRIPTION:${escapeIcsText(input.descripcion)}`
      : null,
    input.url ? `URL:${input.url}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((l): l is string => l != null)

  return `${lines.join("\r\n")}\r\n`
}

export function downloadIcs(filename: string, ics: string): void {
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" })
  const href = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = href
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`
  a.click()
  URL.revokeObjectURL(href)
}

/** Enlace “Añadir a Google Calendar” (día completo). */
export function googleCalendarUrl(input: ConviteCalendarInput): string | null {
  const start = toIcsDate(input.fechaISO)
  const end = nextIcsDate(input.fechaISO)
  if (!start || !end) return null

  const location = [input.lugar, input.ciudad].filter(Boolean).join(", ")
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.titulo,
    dates: `${start}/${end}`,
  })
  if (location) params.set("location", location)
  if (input.descripcion) params.set("details", input.descripcion)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
