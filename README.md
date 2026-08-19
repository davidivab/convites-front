# Convites Front

Frontend Next.js para Convites. Consume la API Laravel del repo `convites`.

## Stack

- Next.js 16 (App Router) + React 19 + Tailwind 4
- `output: "standalone"` para Docker/Dokploy
- API: Sanctum Bearer token (`NEXT_PUBLIC_API_URL`)

## Diseño (colores y tipografía)

**Carta única:** [`src/styles/design-tokens.css`](src/styles/design-tokens.css) — guía en [`docs/DESIGN.md`](docs/DESIGN.md).

Tokens genéricos (`--color-primary`, `--color-secondary`, `--font-display`, …).
Para rebrand o fork: edita solo ese archivo. En componentes usa `bg-primary`,
`font-serif`, etc. — nunca hex/lab sueltos.

## Puertos locales (sin pisar otros stacks)

| Servicio | Puerto |
|----------|--------|
| Front (este repo) | **3095** |
| API (`convites`) | **8095** |

## Local con Docker (recomendado)

```bash
cp .env.example .env.local
docker compose up -d --build
```

App: http://localhost:3095

La API debe estar corriendo en http://localhost:8095.

## Local sin Docker

```bash
cp .env.example .env.local
npm install
npm run dev -- --port 3095
```

Tests: `npm test` (Vitest — mappers / apiFetch).

## Producción (Dokploy)

Template GitHub → compose:

```bash
NEXT_PUBLIC_API_URL=https://api.convites.co \
docker compose -f docker-compose.production.yml up -d --build
```

(`docker-compose.prod.yml` es el mismo stack, nombre legacy. Imagen: `Dockerfile.dokploy` multi-stage → user `nextjs`.)

Variables:

- `NEXT_PUBLIC_API_URL` — URL pública de la API (ej. `https://api.convites.co`). **Se hornea en build-time**: cualquier cambio exige **rebuild** de la imagen (`docker compose … --build`), no basta reiniciar el contenedor.
- `API_URL` — URL interna si el front y la API están en la misma red Docker (opcional; solo server-side / SSR)
- `FRONT_PORT` — puerto publicado (Dokploy suele mapear 80/443)

Healthcheck: `GET /api/health` (no llama a Laravel).

El front es **stateless**: no necesita volúmenes persistentes. La DB y el storage viven solo en el repo API.

## Diseño

- Traer pantallas desde **v0** (React/Next)
- Reusar patrones de **sinubot** (shell, banners, progress, wizard, moderación)

## Auth

Sanctum Bearer en la API, expuesto al navegador vía **BFF de Next** (cookie `httpOnly` `convites_token`).
El JS **no** lee el token (no `localStorage`). Login/register/logout/me: `/api/auth/*`.
Llamadas autenticadas del cliente: `/api/proxy/api/...` (el proxy adjunta el Bearer).

El `proxy` (antes middleware) redirige rutas privadas si falta la cookie httpOnly.
La API sigue siendo la fuente de verdad de autorización.
