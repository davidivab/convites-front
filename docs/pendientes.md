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

### [P49/P50] Listo: mapa filtra por municipio/departamento + errores en español
- **Repo:** convites-front
- **Prioridad:** media
- **Resuelve:** P49, P50
- **Qué:**
  - `GET /api/iniciativas/mapa` ya acepta `municipio` y `departamento` (slug), igual que el index — ya no hace falta el fallback a listado paginado cuando el mapa tiene filtro de municipio.
  - Cualquier 422 de la API ahora devuelve `message` y `errors.*` en español legible (ej. `"El campo título es obligatorio."`) en vez de mensajes en inglés o claves crudas sin traducir. Si el front tenía algún mapeo/traducción manual de mensajes de error del back, ya no hace falta — se puede mostrar `errors` directo.
- **Hecho cuando:** el front deja de hacer el fallback de paginado por municipio en el mapa, y no traduce manualmente errores del API.
- **Añadido:** 2026-08-18
