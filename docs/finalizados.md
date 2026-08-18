# Finalizados — Front Convites

Ítems completados (más recientes arriba). Incluir fecha y nota breve.
Sesión agente 2026-08-16 (loop 5h + trabajo previo en la misma chat).

---

### [F33] Explorar: intro colapsable + filtros en selects/URL — 2026-08-18
- Intro “Convites abiertos en Risaralda” oculta completa; chevron **fuera** de la section
- Filtros: selects + botón Filtrar; estado en query (`q`, `zona`, `categoria`, `urgencia`, `orden`, `dir`, `seccion`, `vista`)
- Filtrado aún en cliente → pedido API **P48** (sort + zona slug + server-side)
- UX: barra compacta (buscar + Filtros con badge); selects en **drawer lateral** derecha (overlay, Escape, Limpiar)

### [F32] Landing: copy, CTA e ilustración (Patricia) — 2026-08-18
- Copy hero/footer/Cómo funciona recortado; CTA principal “Crear un convite” (header/footer/crear/quiénes somos)
- Sección “¿Tu barrio…?” solo con crear (sin “quiénes somos”)
- Ilustración en Cómo funciona (`public/images/como-funciona-convite.png`)
- Alerta de compromiso serio antes de confirmar aporte

### [F34] Pestaña Materiales en Explorar — 2026-08-18
- `GET /api/materiales` + `fetchMateriales` / `ApiMaterial` / `MaterialCard`
- Tabs Convites | Materiales; mismos filtros (zona/categoría/urgencia/q); click → `/iniciativa/{slug}`

### [F31] Google login → registrarse si no hay cuenta — 2026-08-17
- Ack P47: `intent`, `needs_registration`, BFF `completar-registro`, `/registrarse` sin password
- Smoke E2E real requiere `GOOGLE_*` configurado

### [F29] Solicitudes moderador/voluntario (UI + client) — 2026-08-17
- Ack Claude P46 completo (3/3): pestañas `/panel/roles/*`, cola admin, copy profesional = pendiente hasta aprobar
- Rol profesional solo tras moderación (P46-3)

### [F30] Menú unificado en header (dropdown cuenta) — 2026-08-17
- Sacada barra PanelMenu duplicada del `DashboardShell`
- Dropdown desde el nombre: secciones por rol + Cerrar sesión; un solo “Mi perfil”

### [F29-parcial] Esqueleto solicitudes de rol (espera P46) — 2026-08-17
- Nav ciudadano: Moderador / Profesional / Voluntario; páginas solicitud; admin cola
- Client `solicitudes-rol`; admin ya no crea mod/vol con email/password
- Smoke E2E bloqueado por API P46

### [F27] Checkbox términos/descargo en /ingresar y /registrarse — 2026-08-17
- `AceptacionesLegales` compartido; gate Google + correo/Continuar hasta marcar ambos

### [F28] Panel cuentas demo en /ingresar (dev) — 2026-08-17
- Tabla CUENTAS_DEMO + botón Usar (autocompleta email/password); `NODE_ENV !== "production"`

### [F26] Puntos de censo de afectaciones en /centros — 2026-08-17
- Ack P45: filtro `censo`, banner portal sospereira.com, links `urlExterna` en cada punto

### [F20] Login Google en /ingresar (+ registrarse) — 2026-08-17
- Ack P42: BFF `redirect`/`exchange`, callback `/auth/google/callback`, `GoogleButton` real
- Cookie httpOnly; `completeGoogleLogin` en AuthProvider
- Smoke E2E requiere `GOOGLE_*` + `GOOGLE_FRONTEND_CALLBACK_URL` → front (ej. `:3095/auth/google/callback`)

### [P39] UI quitar evidencia de aporte — 2026-08-17
- Ack Claude DELETE `/aportes/{id}/evidencia`; botón en `AportanteRow` (creador/admin/mod editar)

### [F23] Panel profesional: solicitudes estado + notas — 2026-08-17
- Ack P44: tabs Perfil/Solicitudes; PATCH estado + nota acumulable; `patchSolicitudProfesional`

### [F25] Creador detener/cerrar convite — 2026-08-17
- Ack P43: botón **Detener** en panel creador + editar (`cerrarIniciativa`)

### [P38] Admin list search + contacto — 2026-08-17 (Cursor)
- `q` ≥3 busca título/resumen/slug/tel/responsable/creador; index trae `verificacion` (admin); front F12 usa tel

### [F19]+[P41] Moderador editar convite — 2026-08-17
- API: PUT middleware `update_own|moderate` + `ModeratorIniciativaUpdateTest` (2)
- Front: `/moderacion/convites/[slug]/editar` + link en cola; `IniciativaEditarClient` compartido

### [F24] Nav/guards staff (ack Claude) — 2026-08-17
- Ya resuelto en F15–F18: decisión producto = mod/admin **no** ven aportante/organizador
- Admin entra a `/moderacion` y `/perfil`; perfilTabs + dashboardItemsForRole

### [F21]+[F22] Panel creador: editar + pestaña aportantes — 2026-08-17
- `/panel/creador/[slug]/editar` con tabs Datos / Aportantes + `updateIniciativa`
- Botón Editar en listado; API `verificacion` en resource para owner/mod (Cursor)
- Cerrar/detener owner sigue en P43

### [F14] Admin editar convite — 2026-08-17
- `/admin/convites/[slug]/editar` + `updateIniciativa` (PUT + version)
- Formulario: título, resumen, historia, urgencia, cat/municipio, lugar, fechas, verificación

### [F13] Admin detalle: aportes + evidencias — 2026-08-17
- `AportanteRow` compartido; recepción/evidencia vía `POST /aportes/{id}/recepcion` en `/admin/convites/[slug]`
- Link a editar (F14); delete evidencia espera P39

### [F12] Admin convites: paginador + búsqueda ≥3 + columnas — 2026-08-17
- Debounce desde 3ª letra → `q`; paginación `meta`; columnas Evolución % y Contacto (creador; tel vía P38)
- `fetchAdminIniciativas` acepta `page`

### [F15]+[F16]+[F17]+[F18] Nav / role-tree staff — 2026-08-17
- `dashboardItemsForRole` + `perfilTabsForRole`: admin/mod solo ven sus paneles
- `/moderacion` admite admin+moderador; `/perfil` abre a todos los árboles
- Tabs muertos de aportante/organizador quitados en moderación
- Tests role-tree 12 passed

### [P35] Smoke aporte con punto de acopio — 2026-08-17
- Confirmado service: aportante2 → Quibdó demo con punto Bogotá; selector F7 ya cableado

### [F8] Panel creador: puntos de acopio + demo Quibdó — 2026-08-17
- Lista puntos en cada convite del panel; aportantes muestran `punto_acopio` si viene del API
- Demo seed: `techos-para-quibdo-acopio-remoto` (2 puntos) confirmado en BD
- Ack P34 Listo

### [F6]+[F7] Puntos de acopio en crear / detalle / aportar — 2026-08-17
- `/crear`: sección opcional multi-ciudad (`incluirInactivos`); envía `puntos_acopio[]`
- Ficha iniciativa: lista puntos; aportar: selector opcional `punto_acopio_id` (espera P35 API)
- Mapper + tipos `ApiPuntoAcopio`

### [P31] Upload certificados en registro profesional — 2026-08-17
- `registrarProfesional` envía multipart `documentos[]` (PDF/JPG/PNG, máx 5×5MB)
- UI guarda `File`, copy alineado con API; panel profesional lista certificados con link
- Ack Claude P32: seed demo `aportante1` ya trae rol `profesional`

### [P26] Panel profesional `/panel/profesional` — 2026-08-16
- Consume `GET/PUT /api/mi-perfil-profesional` + solicitudes; nav en dashboards
- Rol aditivo: member+profesional sigue en árbol aportante; profesional puro → home panel
- Pedido API P32: seed asigne rol profesional a users vinculados

### [F3] data.ts sin mocks muertos — 2026-08-16
- Confirmado: ya no hay `INICIATIVAS`/`CENTROS`/`PROFESIONALES` vacíos ni `getIniciativa`; quitado `ZONAS` sin usos
- Ack Claude P28 (contrato notifications) — F2 ya integrado

### [F5] Flujo profesional usable + P27 remotePatterns — 2026-08-16
- Registro: certificados opcionales (API aún no sube archivos → P31)
- Manos profesionales: CTA + hint demo; reseede `DatabaseSeeder` (3 aprobados)
- `next.config` remotePatterns S3 para `imagen_path` absoluto (P27)

### [F4] Home voluntario territorial — 2026-08-16
- Banner en `/panel/aportante` y `/panel/creador`: rol sin moderar, municipios asignados (vía catálogo), CTAs explorar/crear

### [F2] Inbox notificaciones moderador — 2026-08-16
- Sección Avisos en `/moderacion`: lista `GET /api/notifications`, mark read / read-all, link a iniciativa si hay slug

### [F1] Panel admin auditoría de convites — 2026-08-16
- `/admin/convites` listado + filtros; `/admin/convites/[slug]` detalle (verificación, historial, aportes anónimos)
- Fetchers `fetchAdminIniciativas|Iniciativa|Aportes`; tabs Admin Usuarios/Convites

### [P25] Separación estricta de rutas por rol — 2026-08-16
- `resolvePrimaryRole` / `homeForRole` (admin > moderador > aportante)
- `useRequireRoleTree` en `/admin`, `/moderacion`, `/panel/*`, `/perfil`
- Admin/moderador fuera de panel → redirect a su home; tests `role-tree.test.ts`

### [P18]+[P21]+[P22] PhoneInput, Select labels, checkboxes /crear — 2026-08-16
- P21: `Select` wrapper reenvía `items` a Base UI; call sites pasan `{value,label}`
- P22: checkboxes de términos/descargo en paso final con UI explícita (caja + check visible)
- P18: `PhoneInput` + `libphonenumber-js` (CO default, países en español) en contactar, registro profesional, registrarse, crear

### [P20] Panel admin + moderación por municipio — 2026-08-16
- `/admin`: crear moderador/voluntario + multi-select municipios activos
- Nav Admin (`users.manage`); cola moderación scoped en API (copy actualizado)
- `AuthUser.municipio_ids`; mapper muestra municipio de la iniciativa

### [P14]+[P15]+[P16]+[P17] Geo cascada + aportantes + anónimo + evidencia — 2026-08-16
- `<DepartamentoMunicipioSelect>` en contactar, registro profesional, registrarse y crear
- Panel creador: listado aportantes + marcar recibido / no recibido + upload evidencia
- Checkbox aporte anónimo en `/iniciativa/[slug]/aportar`

### [P1]+[P2]+[P8]+[P9] Auth httpOnly BFF, Vitest, zod/RHF, components — 2026-08-16
- BFF: `/api/auth/*` + `/api/proxy/[...path]` con cookie httpOnly `convites_token` (sin localStorage)
- Middleware lee cookie real; AuthProvider solo hidrata `user`
- Vitest: mappers + apiFetch (`npm test` + CI)
- Crear: `crear-schema.ts` (zod) + `useForm`/resolver; validación por paso
- `src/components/{auth,iniciativa,layout,map,marketing,perfil,ui}/`

### [P5] Dokploy compose + Dockerfile.dokploy — 2026-08-16
- `docker-compose.production.yml` + `Dockerfile.dokploy` (Next standalone multi-stage, user `nextjs`)
- Healthcheck `/api/health`; README con flujo Dokploy y rebuild de `NEXT_PUBLIC_API_URL`
- Tipos/mapper: `version` de iniciativa (para futuro PUT con optimistic lock)

### [F11] Cancelar aporte en panel — tick 11
- `cancelarAporte` + botón en compromisos activos (`confirmado`)

### [F10] Flujos demo + perfil real + tuteo — tick 10
- Historial aportante usa `cumplido` (bug: antes `completado`)
- `PerfilEditor` carga/guarda vía API
- Tuteo en aportar / crear / cómo funciona / mapa
- Empty state en manos profesionales

### [F9] CSP + revalidate — tick 9
- `Content-Security-Policy` en `next.config.ts`
- `revalidate = 120` en centros y profesionales

### [F8] Perfil UI + Image login + ISR + CI — tick 8
- `/perfil` con user + aportes reales
- Hero login con `next/image`
- `apiFetch` con `revalidate`; home con ISR
- GitHub Actions: lint + `tsc`

### [F7] Middleware + App Router shells — tick 7
- `middleware.ts` + cookie soft `convites_has_session`
- `loading.tsx` / `error.tsx` / `not-found.tsx`
- Doc: `NEXT_PUBLIC_API_URL` exige rebuild

### [F5/F6] Headers + Leaflet local + images — tick 6
- Headers seguridad + `images.remotePatterns`
- Iconos Leaflet en `public/leaflet/` (sin unpkg)

### [F3/F4] useRequireAuth + limpia mocks — tick 5
- Hook compartido en paneles/crear/moderación/registro
- Arrays mock vacíos fuera de `data.ts`
- README auth actualizado

### [F2] `/api/health` — tick 4
- Healthcheck compose sin depender de Laravel

### [F1] Credenciales demo ocultas en prod — tick 3
- Hint demo solo si `NODE_ENV !== "production"`

### En código (tick 12)
- Panel creador: botón “Enviar a revisión” + nota de moderación
