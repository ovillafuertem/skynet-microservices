# Visits Service

API NestJS que gestiona el ciclo completo de una visita técnica: planificación, cambio de estado, registro de tiempos, emisión de reportes y publicación de eventos cuando se concluye la visita. Trabaja junto a `clients-service`, `notifications-service` y el frontend.

---

## 🧱 Stack

- NestJS + TypeScript
- Prisma sobre PostgreSQL (`schema.prisma`)
- Redis para colas BullMQ
- Puppeteer para generar PDFs
- Validación y autorización basada en Keycloak (roles `ADMIN`, `SUPERVISOR`, `TECNICO`)
- Zona horaria definida por `TZ=America/Guatemala` para alinear la UI, correos y base de datos

---

## 🚀 Ejecución local

```bash
cd services/visits-service
npm install
npm run start:dev
```

Variables mínimas (la plantilla `.env` ya las incluye):

```
PORT=3001
DATABASE_URL=postgresql://skynet:skynet_pass@postgres:5432/skynet_visits?schema=public
REDIS_HOST=redis
REDIS_PORT=6379
NOTIFICATIONS_QUEUE=visit.completed
KEYCLOAK_ISSUER=http://localhost:8080/realms/skynet
KEYCLOAK_JWKS_URI=http://keycloak:8080/realms/skynet/protocol/openid-connect/certs
KEYCLOAK_AUDIENCE=skynet-api
TZ=America/Guatemala
```

Si corres el servicio fuera de Docker cambia `REDIS_HOST=127.0.0.1` y asegúrate de que Keycloak esté disponible con el mismo issuer.

---

## 🔑 Endpoints principales

| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| `GET /visits` | Listado con filtros (`from`, `to`, `status`, `technicianId`, etc.) | `SUPERVISOR`, `ADMIN` |
| `POST /visits` | Crea una visita planificada | `SUPERVISOR`, `ADMIN` |
| `PATCH /visits/:id/status` | Cambia estado (`PLANNED`, `IN_PROGRESS`, `DONE`, `CANCELLED`) y registra check-in/out | `TECNICO`, `SUPERVISOR`, `ADMIN` |
| `GET /reports/visits` | Reporte tabular (JSON) con totales y métricas | `SUPERVISOR`, `ADMIN` |
| `GET /reports/visits/pdf` | Mismo reporte en PDF (HTML → Puppeteer) | `SUPERVISOR`, `ADMIN` |

Ejemplo de consumo:

```bash
TOKEN=$(node ../../scripts/get-token.js super1 Super123!)
curl "http://localhost:3002/reports/visits?status=DONE" \
  -H "Authorization: Bearer $TOKEN"
```

Descarga del PDF:

```bash
curl -L "http://localhost:3002/reports/visits/pdf?from=2025-10-01T00:00:00Z" \
  -H "Authorization: Bearer $TOKEN" -o visitas.pdf
```

---

## 🔁 Integraciones

- **Redis + BullMQ**: cuando una visita pasa a `DONE`, se encola `visit.completed`. `notifications-service` consume el evento y envía el correo con PDF.
- **frontend**: usa un proxy autenticado para interactuar con estos endpoints y manejar la geolocalización.
- **clients-service**: proporciona datos de clientes y técnicos que se referencian con IDs.

---

## 🧪 Scripts de demostración

```bash
npm run demo:complete-visit   # crea datos demo, realiza check-in/out y dispara la notificación
npm run demo:report           # genera un PDF en ./tmp-visits-report.pdf con visitas de ejemplo
```

Ambos scripts esperan que `docker compose up` haya levantado PostgreSQL, Redis y Mailhog. Sirven para presentar el proyecto en clase sin crear datos manualmente.

---

## 🧯 Problemas frecuentes

- **Visitas aparecen un día después**: verifica la variable `TZ`. Todos los contenedores deben compartir la misma zona horaria; recrea los servicios tras cambiarla.
- **Puppeteer no arranca**: realiza `docker compose build visits` para instalar Chromium dentro de la imagen o revisa recursos asignados a Docker Desktop.
- **401/403 al consumir APIs**: confirma que el token incluye el audience `skynet-api` (se agrega mediante un mapper en Keycloak).
- **No se envían correos**: revisa la cola en Redis (`docker compose logs -f notifications`) y Mailhog (`http://localhost:8025`).

---

Este README resume el comportamiento del microservicio de visitas, sus dependencias externas y las pruebas más comunes que puedes realizar al presentar SkyNet Field Ops.
