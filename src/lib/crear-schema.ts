import { z } from "zod"
import { isValidPhoneNumber } from "libphonenumber-js"
import { ITEM_UNIDAD_VALUES } from "@/lib/item-unidades"

export const crearStep1Schema = z.object({
  title: z.string().trim().min(5, "Escribe un título más descriptivo"),
  categoriaId: z.string().min(1, "Elige una categoría"),
  urgencia: z.enum(["alta", "media", "baja"]),
  summary: z.string().trim().min(20, "El resumen debe tener al menos 20 caracteres"),
  story: z.string().trim().min(20, "Cuenta un poco más la historia"),
})

export const crearStep2Schema = z.object({
  zonaId: z.string().min(1, "Elige un municipio"),
  lugarConvite: z.string().trim().min(3, "Indica el lugar del convite"),
  lugarExacto: z.string().optional(),
  deadline: z.string().optional(),
  workday: z.string().optional(),
})

export const crearItemSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, "Nombre del ítem"),
  unit: z.enum(ITEM_UNIDAD_VALUES as unknown as [string, ...string[]], {
    message: "Elige el tipo de medida",
  }),
  quantity: z
    .string()
    .trim()
    .refine((v) => Number(v) >= 1, "Cantidad mínima 1"),
})

export const crearStep3Schema = z.object({
  items: z.array(crearItemSchema).min(1, "Agrega al menos un ítem"),
})

/** Multimedia es opcional; si hay enlaces a medias, se validan al continuar. */
export const crearMultimediaSchema = z.object({})

export const crearStep4Schema = z.object({
  responsable: z.string().trim().min(2, "Nombre de quien responde"),
  respaldo: z.string().trim().min(2, "Quién respalda"),
  contacto: z
    .string()
    .trim()
    .refine((v) => isValidPhoneNumber(v), "Teléfono de contacto inválido"),
})

export const crearStep5Schema = z.object({
  aceptaTerminos: z.boolean().refine((v) => v, "Debes aceptar los términos"),
  aceptaDescargo: z.boolean().refine((v) => v, "Debes aceptar el descargo"),
})

export const crearFormSchema = crearStep1Schema
  .and(crearStep2Schema)
  .and(crearStep3Schema)
  .and(crearStep4Schema)
  .and(crearStep5Schema)

export type CrearFormValues = z.infer<typeof crearFormSchema>

export const CREAR_STEP_SCHEMAS = [
  crearStep1Schema,
  crearStep2Schema,
  crearStep3Schema,
  crearMultimediaSchema,
  crearStep4Schema,
  crearFormSchema,
] as const

/**
 * Maps a backend (Laravel) payload field name to the 0-based wizard step
 * index that owns that field in the UI, so an API validation error can be
 * shown on the step where the user can actually fix it.
 *
 * Step indices match `steps` in `crear-client.tsx`:
 *   0 Sobre el convite · 1 Ubicación y fechas · 2 Qué se necesita ·
 *   3 Multimedia · 4 Verificación · 5 Revisar y publicar
 */
export const FIELD_TO_STEP: Record<string, number> = {
  // Step 1: Ubicación y fechas
  zona_id: 1,
  municipio_id: 1,
  lugar_convite: 1,
  lugar_exacto: 1,
  lat: 1,
  lng: 1,
  fecha_convite: 1,
  fecha_limite_aportes: 1,
  fecha_convite_texto: 1,
  puntos_acopio: 1,
  // Step 2: Qué se necesita
  items: 2,
  // Step 3: Multimedia
  enlaces: 3,
  // Step 4: Verificación
  persona_responsable: 4,
  quien_respalda: 4,
  telefono_contacto: 4,
}

/** Prefixes for indexed/nested field names, e.g. `items.0.nombre`. */
const FIELD_PREFIX_TO_STEP: Array<{ prefix: string; step: number }> = [
  { prefix: "puntos_acopio.", step: 1 },
  { prefix: "items.", step: 2 },
  { prefix: "enlaces.", step: 3 },
]

/** Resolves a single backend field name (e.g. `items.0.nombre`) to its owning wizard step. */
export function fieldNameToStep(field: string): number | null {
  if (field in FIELD_TO_STEP) return FIELD_TO_STEP[field]
  for (const { prefix, step } of FIELD_PREFIX_TO_STEP) {
    if (field.startsWith(prefix)) return step
  }
  return null
}

/**
 * Given the raw `errors` object from a failed API call (Laravel 422 body),
 * returns the wizard step index that owns the FIRST errored field, or
 * `null` if unknown / not present in the map.
 */
export function resolveApiErrorStep(
  errors: Record<string, string[]> | undefined | null,
): number | null {
  if (!errors) return null
  const firstField = Object.keys(errors)[0]
  if (!firstField) return null
  return fieldNameToStep(firstField)
}
