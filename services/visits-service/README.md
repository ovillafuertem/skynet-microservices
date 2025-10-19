# Visits Service

Servicio NestJS responsable de la planificación y seguimiento de visitas. Expone APIs protegidas con JWT/roles, integra Prisma como ORM y ahora incluye endpoints de reportes.

## Scripts útiles

```bash
npm run demo:complete-visit   # crea datos de muestra y marca una visita como DONE (dispara notificación)
npm run demo:report           # genera un PDF con todas las visitas y lo deja en ./tmp-*.pdf
```

## Endpoints clave

- `GET /visits` y `PATCH /visits/:id/status` (requiere JWT) — APIs existentes para operar visitas.
- `GET /reports/visits` — Devuelve información tabular + resumen.
- `GET /reports/visits/pdf` — Descarga el PDF con el mismo contenido formateado.

### Parámetros disponibles

`from`, `to`, `status`, `technicianId`, `clientId`, `search` (todos opcionales). Ejemplo:

```bash
curl "http://localhost:3002/reports/visits?from=2025-10-01T00:00:00Z&status=DONE" -H "Authorization: Bearer <token>"
```

Para el PDF:

```bash
curl -L "http://localhost:3002/reports/visits/pdf?status=DONE" -H "Authorization: Bearer <token>" -o visits-report.pdf
```

## Dependencias relevantes

- `bullmq`: publicar eventos `visit.completed` hacia `notifications-service`.
- `puppeteer`: generar reportes PDF desde HTML.
- `@nestjs/config`: lectura de variables (`REPORTS_COMPANY_NAME`, Redis, etc.).

## Variables de entorno

```
REPORTS_COMPANY_NAME=SkyNet S.A.
REDIS_HOST=localhost
REDIS_PORT=6379
NOTIFICATIONS_QUEUE=visit.completed
```

El `docker-compose.yml` del proyecto carga automáticamente Redis y MailHog; al reconstruir la imagen (`docker compose build visits`) se instalan los binarios necesarios para Puppeteer.
