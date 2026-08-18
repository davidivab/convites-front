/** Tipos de medida clásicos para ítems del convite */
export const ITEM_UNIDAD_OPTIONS = [
  { value: "unidades", label: "Unidades" },
  { value: "horas", label: "Horas" },
  { value: "días", label: "Días" },
  { value: "docenas", label: "Docenas" },
  { value: "cajas", label: "Cajas" },
  { value: "bultos", label: "Bultos" },
  { value: "sacos", label: "Sacos" },
  { value: "kilos", label: "Kilos" },
  { value: "metros", label: "Metros" },
  { value: "litros", label: "Litros" },
  { value: "personas", label: "Personas" },
] as const

export type ItemUnidadValue = (typeof ITEM_UNIDAD_OPTIONS)[number]["value"]

export const ITEM_UNIDAD_VALUES: ItemUnidadValue[] = ITEM_UNIDAD_OPTIONS.map(
  (o) => o.value,
)
