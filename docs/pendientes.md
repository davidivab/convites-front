# Pendientes — Front Convites

Cola de mejoras. Cursor ejecuta aquí; Claude puede añadir ítems para el front.

## Formato

```md
### [F#] Título corto
- **Repo:** convites-front
- **Prioridad:** alta | media | baja
- **Qué:** …
- **Hecho cuando:** …
- **Añadido:** YYYY-MM-DD
```

---

## Cola

### [F37] Pestaña "Ciudadanos" en admin — ver todos los registrados
- **Repo:** convites-front
- **Prioridad:** media
- **Por:** Claude (pedido del usuario: la pestaña "Usuarios" solo muestra moderador/voluntario por diseño, pero se esperaba ver a TODOS los ciudadanos registrados)
- **Qué:** Agregar una pestaña/vista nueva "Ciudadanos" (junto a Usuarios/Moderadores/Voluntarios/Solicitudes en el admin) que liste **todos** los usuarios registrados, incluidos los que todavía no tienen ningún rol especial (`member`).
  - Endpoint ya listo: `GET /api/admin/users?todos=1` — sin este parámetro, el endpoint sigue devolviendo solo moderador/voluntario (comportamiento actual sin cambios, no se rompe nada de las pestañas existentes).
  - Búsqueda: agregar `&q=texto` — busca por nombre, correo o celular (coincide con el campo de búsqueda "Nombre, correo o celular" que ya existe en la UI).
  - Combinable con `role=` si se quiere filtrar un rol específico dentro de "todos".
  - Respuesta: mismo shape que ya usan Usuarios/Moderadores/Voluntarios (`AdminUserResource`: `id, name, email, celular, inicial, roles[], municipios[], created_at`) — para ciudadanos sin rol especial, `roles` viene vacío (`[]`) y `municipios` también (`[]`, ya que solo se les asignan municipios a moderador/voluntario).
- **Hecho cuando:** existe una pestaña/vista donde el admin ve a todos los ciudadanos registrados (no solo mod/voluntario), con la misma búsqueda por nombre/correo/celular que ya tienen las otras pestañas.
- **Añadido:** 2026-08-18

### [P49/P50] Listo: mapa filtra por municipio/departamento + errores en español
- **Repo:** convites-front
- **Prioridad:** media
- **Resuelve:** P49, P50
- **Qué:**
  - `GET /api/iniciativas/mapa` ya acepta `municipio` y `departamento` (slug), igual que el index — ya no hace falta el fallback a listado paginado cuando el mapa tiene filtro de municipio.
  - Cualquier 422 de la API ahora devuelve `message` y `errors.*` en español legible (ej. `"El campo título es obligatorio."`) en vez de mensajes en inglés o claves crudas sin traducir. Si el front tenía algún mapeo/traducción manual de mensajes de error del back, ya no hace falta — se puede mostrar `errors` directo.
- **Hecho cuando:** el front deja de hacer el fallback de paginado por municipio en el mapa, y no traduce manualmente errores del API.
- **Añadido:** 2026-08-18
