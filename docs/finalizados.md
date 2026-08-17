# Finalizados — Front Convites

Ítems completados (más recientes arriba). Incluir fecha y nota breve.
Sesión agente 2026-08-16 (loop 5h + trabajo previo en la misma chat).

---

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
