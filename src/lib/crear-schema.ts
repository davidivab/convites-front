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
