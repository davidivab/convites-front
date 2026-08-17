# Recomendaciones — Convites Front (Next.js)

_Generado el 2026-08-16 a partir de una revisión del código, configuración de Docker y preparación para producción (Dokploy)._

## 🔴 Críticas

### Credenciales de demo hardcodeadas en la pantalla de login
`src/app/ingresar/ingresar-client.tsx:89` muestra en texto plano: `Demo: member@convites.test / password`. Si este componente se despliega tal cual a producción, cualquier visitante ve credenciales válidas (o que parecen serlo) para autenticarse contra la API real. Esto debe estar detrás de un flag de entorno (`NODE_ENV !== "production"`) o eliminarse antes de cualquier release.

### Token Sanctum guardado en `localStorage`
`src/lib/api.ts:18-25` y `src/components/auth-provider.tsx:15,44,50` guardan y leen el Bearer token en `localStorage` (`convites_token`). Como el backend usa Sanctum con Bearer token (no cookies), cualquier XSS en el front (una dependencia comprometida, un `<img>`/link mal sanitizado, etc.) permite robar el token completo y todos los permisos asociados (incluye moderación). No hay ninguna mitigación (ni CSP, ver más abajo) que reduzca ese riesgo. Vale la pena evaluar con el backend un modelo de cookie `httpOnly` + `SameSite`, o al menos documentar y aceptar el riesgo conscientemente.

### `NEXT_PUBLIC_API_URL` horneado en build-time, pero anunciado como configurable en runtime
`docker/Dockerfile:12-16` recibe `NEXT_PUBLIC_API_URL` como `ARG`/`ENV` y lo compila dentro del bundle del cliente en `RUN npm run build`. `docker-compose.prod.yml:9-11` además lo vuelve a declarar como `environment:` en el contenedor final — pero eso **no tiene ningún efecto sobre el JS que ya corre en el navegador**, porque Next.js reemplaza `process.env.NEXT_PUBLIC_API_URL` por un literal en build-time. Si en Dokploy alguien cambia esa variable y solo reinicia el contenedor (sin rebuild), el cliente seguirá apuntando a la URL vieja de forma silenciosa — un bug muy difícil de diagnosticar. Hay que documentar explícitamente que **cualquier cambio de `NEXT_PUBLIC_API_URL` exige rebuild de imagen**, o mover la resolución de la URL pública a un mecanismo runtime (endpoint de config, o usar solo `API_URL` server-side + un proxy/rewrite en vez de exponer la URL pública al bundle).

### Sin protección de rutas a nivel de servidor — todo el control de acceso es client-side
No existe `middleware.ts` en el proyecto. Rutas como `/moderacion`, `/crear`, `/panel/*`, `/registro-profesional` resuelven su `page.tsx` como Server Component "vacío" que solo delega a un `*-client.tsx`, y **es ese componente cliente el que decide** si redirige a `/ingresar` (ver `src/app/moderacion/moderacion-client.tsx:50-61`, patrón repetido en 5 archivos). El HTML/JS de la pantalla de moderación se sirve siempre, sin importar el rol del usuario; solo los datos reales están protegidos porque dependen del token en las llamadas a la API. Es una superficie de ataque innecesaria (fuga de estructura/copys internos, flash de contenido antes del redirect) que un `middleware.ts` con verificación de sesión resolvería a nivel de framework.

### `next/image` sin `images.remotePatterns`, pero se le pasan URLs de la API directamente
`next.config.ts` solo define `output: "standalone"` — no hay bloque `images`. Sin embargo, `src/lib/mappers.ts:60` usa `api.imagen_path` (campo que viene del backend Laravel) directo como `src` de `<Image>` en `src/app/iniciativa/[slug]/page.tsx:83-90`. Si `imagen_path` llega a ser una URL absoluta de otro dominio (el más probable, dado el nombre del campo y que el storage vive en el repo del backend), Next.js **lanza un error en runtime** ("Invalid src prop... hostname is not configured") y rompe la página del convite en producción. Hay que confirmar con el backend el formato exacto de `imagen_path` y, si es remoto, agregar `images.remotePatterns` en `next.config.ts`.

## 🟠 Importantes

### El healthcheck del contenedor depende de la API externa
`docker-compose.prod.yml:19-23` hace `wget http://127.0.0.1:3000/` cada 30s. Esa ruta (`src/app/page.tsx:14-23`) llama a `fetchIniciativas(..., { server: true })`, y `apiFetch` fuerza `cache: "no-store"` en todo fetch server-side (`src/lib/api.ts:65`). Es decir: el healthcheck del **front** en realidad valida disponibilidad + latencia del **backend Laravel** en cada ciclo. Si la API está lenta o caída, Dokploy puede marcar el front como no saludable y reiniciarlo innecesariamente, cuando el front en sí está perfectamente sano. Conviene un endpoint dedicado tipo `/api/health` (route handler) que responda `200` sin llamar a servicios externos.

### Cero estrategia de cache/ISR — todo fetch server-side es `no-store`
`getServerApiUrl`/`apiFetch` en `src/lib/api.ts:65` hardcodea `cache: options?.server ? "no-store" : init.cache`, y ningún `page.tsx` define `export const revalidate`. Esto anula por completo el cache de datos de App Router: cada visita a `/`, `/explorar`, `/centros`, etc. dispara una llamada nueva al backend, sin aprovechar ISR ni cache en el edge. Para datos públicos que cambian poco (catálogos de zonas/categorías, centros de acopio) esto es una oportunidad de performance/costo desperdiciada, y aumenta la carga sobre el backend Laravel en producción.

### No hay ningún tipo de testing
No existe carpeta de tests ni configuración de Jest/Vitest/Playwright/Testing Library en el repo (ni en `package.json` ni en el árbol de archivos). Flujos con lógica no trivial —`apiFetch`/manejo de errores, el wizard de `crear-client.tsx`, el guard de auth repetido 5 veces, los mappers API→UI en `src/lib/mappers.ts`— no tienen ninguna red de seguridad ante regresiones.

### No hay CI/CD
No existe `.github/workflows` ni ningún otro pipeline. No hay lint, typecheck (`tsc --noEmit`) ni build automatizados en cada push/PR; todo depende de que el desarrollador corra `npm run lint`/`npm run build` manualmente antes de mergear.

### Guard de autenticación client-side duplicado 5 veces, sin hook compartido
El mismo patrón (`if (authLoading) return; if (!token) router.replace("/ingresar?next=...")`) está copiado en `src/app/panel/aportante/aportante-client.tsx:49`, `src/app/panel/creador/creador-client.tsx:25`, `src/app/registro-profesional/registro-profesional-client.tsx:86`, `src/app/crear/crear-client.tsx:107` y `src/app/moderacion/moderacion-client.tsx:53`. Un `useRequireAuth(nextPath)` compartido en `src/hooks/` eliminaría la duplicación y centralizaría cualquier cambio futuro (p. ej. si se agrega verificación de permisos por ruta).

### Código muerto / datos mock sin limpiar en `src/lib/data.ts`
`INICIATIVAS`, `CENTROS` y `PROFESIONALES` están declarados como arrays vacíos marcados `@deprecated` (líneas 101, 233, 281), y `getIniciativa()` siempre retorna `undefined` (línea 103-105). Son remanentes de una fase con datos mock que ya fue reemplazada por `fetchIniciativas`/`fetchCentros`/`fetchProfesionales` en `convites-api.ts`. Mantenerlos confunde sobre cuál es la fuente de verdad y aumenta el riesgo de que alguien los importe por error.

### README desactualizado respecto al estado real de auth
`README.md:61-67` tiene una sección "Auth (próximo)" que describe `apiFetch` como preparado para login/me, dando a entender que la autenticación **todavía no está implementada**. En realidad `src/components/auth-provider.tsx` ya tiene login, register, logout y refresh completos y en uso en todo el sitio. Documentación desactualizada como esta genera fricción para cualquiera que se sume al proyecto.

### Sin headers de seguridad a nivel de framework
`next.config.ts` no define `headers()`. No hay CSP, `X-Frame-Options`, `Referrer-Policy` ni `Strict-Transport-Security` configurados desde el front. Dado que el token vive en `localStorage` (ver crítica arriba), una CSP razonable sería la mitigación más barata contra XSS de terceros (scripts inyectados, dependencias comprometidas).

## 🟡 Sugeridas

### Formularios multi-step sin librería de validación de esquema
`src/app/crear/crear-client.tsx` maneja un wizard de 5 pasos con ~15 campos de estado local (`useState` por campo, líneas 82-98) y sin `zod`/`react-hook-form` (ninguno está en `package.json`). Funciona, pero a medida que el formulario crezca, validar y sincronizar tantos campos a mano se vuelve difícil de mantener y propenso a bugs de validación inconsistente entre pasos.

### Iconos de Leaflet cargados desde CDN externo en runtime
`src/components/explorar-map.tsx:11-19` apunta `iconUrl`/`shadowUrl` a `https://unpkg.com/leaflet@1.9.4/...` en vez de servir esos assets desde `public/`. Es una dependencia de red externa innecesaria (falla silenciosa si unpkg está caído o bloqueado) y complica el día que se agregue una CSP `img-src` restrictiva.

### `Dockerfile.dev` con un `CMD` que nunca se ejecuta
`docker/Dockerfile.dev:9` define `CMD ["npm", "run", "dev", ...]`, pero `docker-compose.yml:11` siempre lo sobreescribe con `command: sh -c "npm install && npm run dev -- ..."`. El `CMD` del Dockerfile es efectivamente código muerto; vale la pena quitarlo o dejar un comentario que explique que el comando real vive en el compose.

### `<img>` nativo en vez de `next/image` en el hero de login
`src/app/ingresar/ingresar-client.tsx:130-135` usa `<img>` con `eslint-disable-next-line @next/next/no-img-element`, mientras que el resto del sitio (home, detalle de iniciativa) sí usa `next/image` con optimización. Esa imagen de héroe pierde lazy-loading/optimización de formato que sí se aplica en otras páginas.

### `src/components` es plano, sin agrupar por dominio
A diferencia de `src/app` (que sigue bien el patrón `page.tsx` + `*-client.tsx`), los 20 archivos bajo `src/components` conviven sin agrupar por feature (iniciativa, profesional, centro, dashboard). Hoy es manejable, pero si el proyecto sigue creciendo, agrupar en subcarpetas (`components/iniciativa/`, `components/profesional/`, etc.) ayuda a que la estructura "grite" el dominio en vez de ser una lista plana de archivos.

### Sin `error.tsx` / `loading.tsx` / `not-found.tsx` en ningún segmento
Ningún directorio de `src/app` define los archivos especiales de App Router para error boundaries o loading UI a nivel de framework. Cada client component reimplementa su propio `loading`/`error` con `useState` (ver `moderacion-client.tsx`, `crear-client.tsx`, etc.) en vez de aprovechar el streaming y manejo de errores nativo de Next, lo que duplica lógica de UI de estado entre pantallas.
