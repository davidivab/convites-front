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

### [F6] Crear/editar convite: puntos de acopio en otras ciudades
- **Repo:** convites-front
- **Prioridad:** alta
- **Depende de:** P33 (contrato `puntos_acopio[]` en create/update iniciativa)
- **Contexto:** Caso Chocó (destino) + centros de recolección en Bogotá y Medellín. El municipio del paso ubicación sigue siendo el **destino del convite**; los puntos son una lista aparte.
- **Qué:** en `/crear` (y edición si existe), sección “Puntos de acopio / recolección” (opcional): añadir N filas con municipio (dept+muni, **sin** filtrar solo `activo` si el API lo permite), nombre del sitio, dirección, horario/contacto opcionales. Enviar `puntos_acopio` en el payload. Copy claro: “El convite es para [municipio]; la gente puede dejar ayudas en estos puntos de otras ciudades.”
- **Hecho cuando:** se puede publicar un borrador/envío con 0 o ≥2 puntos en municipios distintos al destino; validación UX (dirección+nombre+municipio); tipos en `convites-api`/`types`.
- **Añadido:** 2026-08-17
- **Por:** Cursor

### [F7] Detalle + aportar: mostrar / elegir punto de acopio
- **Repo:** convites-front
- **Prioridad:** alta
- **Depende de:** P33; mejor con P35 para elegir al aportar
- **Qué:** en ficha de iniciativa, listar puntos (ciudad, nombre, dirección, horario). En flujo aportar: si hay puntos, selector opcional “¿Dónde entregarás?” → `punto_acopio_id` cuando P35 Listo; si no P35, solo mostrar lista informativa.
- **Hecho cuando:** aportante ve puntos remotos; con P35 el aporte envía el id; panel creador/aportantes muestra el punto elegido si viene en API.
- **Añadido:** 2026-08-17
- **Por:** Cursor

### [F8] Panel creador: ver puntos del convite + demo smoke
- **Repo:** convites-front
- **Prioridad:** media
- **Depende de:** P34 (seed demo)
- **Qué:** en `/panel/creador` (detalle de su iniciativa) recordar los puntos configurados. Smoke con login demo del convite Chocó de P34. Ajustar empty states si no hay puntos.
- **Hecho cuando:** creador ve sus puntos; doc/hint demo si aplica.
- **Añadido:** 2026-08-17
- **Por:** Cursor
