# Deploy en Dokploy — convites-front

La guía completa (backend + front, arquitectura, checklist pre-deploy, variables de entorno, orden de deploy, rollback y troubleshooting) vive en un solo documento del repo del API para no duplicar contenido entre los dos repos:

**→ [`convites/docs/DEPLOY_DOKPLOY.md`](../../convites/docs/DEPLOY_DOKPLOY.md)**

Sección específica de este repo: **§4 (Frontend — paso a paso)**.

Puntos clave a tener presentes al tocar el deploy de este repo puntualmente:

- `NEXT_PUBLIC_API_URL` se hornea en **build time** (`ARG` en `Dockerfile.dokploy`) — cambiar la URL de la API requiere rebuild de la imagen, no alcanza con reiniciar el contenedor ni con cambiar la env var en Dokploy sin redeploy.
- El compose de producción **no publica** puerto en el host (`expose: 3000` solo); Dokploy/Traefik usa Container Port **3000**. Evita `port is already allocated` en `:3000`.
- El healthcheck (`GET /api/health`, en `docker-compose.production.yml`) debe estar verde antes de exponer el dominio.
- Deploy el backend **antes** que este front (el front necesita la URL final de la API en build time).

_Última actualización: 2026-08-18._
