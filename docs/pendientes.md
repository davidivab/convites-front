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

### [F39] Fixes de robustez en tab Estadísticas (post-review F38)
- **Repo:** convites-front
- **Prioridad:** media
- **Qué:** Review adversarial de F38 encontró estos issues reales en `src/app/admin/estadisticas/admin-estadisticas-client.tsx` (líneas aprox., pueden haberse corrido):
  1. **Colores de la torta "Convites por estado" inestables entre consultas** (línea ~406): `estadoPie` filtra `total > 0` y colorea por índice post-filtro (`ESTADO_COLORS[i % ESTADO_COLORS.length]`). Si un estado tiene 0 en un rango, todos los siguientes se corren de color respecto a otra consulta donde sí tenía datos — la leyenda deja de ser consistente. **Esto afecta datos reales, no solo el mock.** Fix: mapear `ESTADO_COLORS` como `Record` keyed por `estado` (mismo patrón que `ESTADO_LABEL` dos líneas arriba, o `ESTADO_STYLES` en `src/components/iniciativa/status-badges.tsx`), no por índice.
  2. **Catch genérico no limpia estado stale** (línea ~211): si una carga previa cayó en mock (`usingMock=true`) y el siguiente fetch falla con error genérico (ej. 500 transitorio), solo hace `setError(...)` — nunca resetea `usingMock`/`data`. Se ven a la vez el banner "datos de ejemplo", charts del rango anterior, y el error nuevo. Fix: resetear `usingMock`/`data` (o al menos `usingMock`) en el catch genérico antes de setear el error.
  3. **Rango sin cota cuelga el mock** (líneas ~48-52, ~85): `isYmd` solo valida formato, no que el rango sea razonable. Mientras el endpoint esté caído, un rango absurdo (`start_date=0001-01-01&end_date=9999-12-31`) hace que el `for` de `mockEstadisticas` genere millones de entradas sincrónicamente y cuelgue el tab. Nota: el backend (P51) ya rechaza con 422 rangos de más de 366 días, pero el mock local no pasa por esa validación — clampear el rango también del lado del mock (mismo límite, 366 días, o menor).
  4. **Fecha "hoy" hardcodeada en el mock** (línea ~80): `"2026-08-19"` literal en vez de `new Date().toISOString().slice(0,10)` — el rango de ejemplo queda congelado a esa fecha para siempre.
  5. **Lockfile duplicado**: `pnpm-lock.yaml` sin trackear junto a `package-lock.json` (el que ya usa el repo) — no debería commitearse, genera drift de subdependencias entre `npm ci` y `pnpm install`. Borrar `pnpm-lock.yaml`.
- **Hecho cuando:** los 5 puntos están resueltos y el lockfile duplicado ya no existe en el repo.
- **Añadido:** 2026-08-19
