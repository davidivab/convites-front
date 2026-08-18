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

### [F35] Explorar: filtros/orden/página vía API (dejar de filtrar en cliente)
- **Repo:** convites-front
- **Prioridad:** media
- **Resuelve:** ack P48 + paginación real en UI
- **Qué:** Hoy `/explorar` guarda query params (`q`, `zona`, `categoria`, `urgencia`, `orden`, `dir`, `seccion`, `vista`) pero **filtra/ordena en memoria** sobre un fetch único `per_page=50`. No hay paginador. El API ya pagina (`page`, `per_page`, meta) y ordena (`orden`: `fecha|avance|nombre`, `dir`: `asc|desc`). Hacer:
  1. Al aplicar filtros / cambiar página, re-fetch `GET /api/iniciativas` y `GET /api/materiales` con esos params (no filtrar en cliente).
  2. Mapear UI `orden=porcentaje` → API `orden=avance` (o renombrar el param de URL a `avance`).
  3. **Zona:** mandar **slug** (`municipio` o `zona` según catálogo), no el label compuesto (“Quibdó, Chocó”). Usar `/api/catalogos/*`.
  4. Añadir `page` a la URL y UI de paginación (prev/next o números) usando `meta.current_page` / `meta.last_page` / `meta.total`.
  5. Vista mapa: seguir usando `/api/iniciativas/mapa` (listado liviano, no paginado) con los mismos filtros geo/categoría/urgencia/q.
- **Hecho cuando:** cambiar filtros o página actualiza URL + datos del server; listados >12 ítems se pueden recorrer con paginador; zona filtra de verdad contra el API.
- **Añadido:** 2026-08-18
