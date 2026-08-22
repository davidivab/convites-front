/** Contacto WhatsApp público de Convites (sin +; wa.me). */
export const WHATSAPP_E164 = "573219064617";

/** Número legible para UI. */
export const WHATSAPP_DISPLAY = "+57 321 906 4617";

export const WHATSAPP_PREFILL =
  "Hola, quisiera recibir más información de Convites";

export function whatsappHref(text: string = WHATSAPP_PREFILL): string {
  return `https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(text)}`;
}
