# Clients Service

Microservicio NestJS encargado de administrar la libreta de clientes de SkyNet Field Ops. Expone un CRUD protegido con Keycloak, geocodifica direcciones y ofrece información que consume el visits-service (para asignar visitas) y el frontend (mapas y listados).

---

## ⚙️ Stack técnico

- **NestJS 10** con TypeScript.
- **Prisma ORM** apuntando a la base `skynet_db`.
- **Keycloak** como Identity Provider (valida tokens RS256).
- **Zod** para validar DTOs y respuestas.
- **Axios + Google Maps API** para convertir direcciones a coordenadas cuando se crean o actualizan clientes.

---

## 🚀 Levantar el servicio en local

```bash
cd services/clients-service
npm install
npm run start:dev
```

Variables indispensables (incluidas en `.env` y automáticamente inyectadas por Docker):

```
PORT=3000
DATABASE_URL=postgresql://skynet:skynet_pass@postgres:5432/skynet_clients?schema=public
KEYCLOAK_ISSUER=http://localhost:8080/realms/skynet
KEYCLOAK_JWKS_URI=http://keycloak:8080/realms/skynet/protocol/openid-connect/certs
KEYCLOAK_CLIENT_ID=skynet-api
TZ=America/Guatemala
```

Si ejecutas el servicio desde tu máquina (sin Docker), cambia el host de la base de datos a `localhost` y asegúrate de que Keycloak esté expuesto en `http://localhost:8080`.

---

## 🚪 Endpoints destacados

| Método | Ruta | Descripción | Roles permitidos |
|--------|------|-------------|------------------|
| `GET /clients` | Listado paginado y filtrable | `ADMIN`, `SUPERVISOR` |
| `POST /clients` | Crea un cliente y geolocaliza la dirección si hay datos suficientes | `ADMIN`, `SUPERVISOR` |
| `PATCH /clients/:id` | Actualiza información general y coordenadas | `ADMIN`, `SUPERVISOR` |
| `DELETE /clients/:id` | Marca el cliente como inactivo (soft delete) | `ADMIN` |
| `GET /clients/:id/visits` | Devuelve visitas relacionadas (proxy a visits-service) | `ADMIN`, `SUPERVISOR` |

Todos los endpoints exigen un token Bearer emitido por Keycloak. El guard `KeycloakAuthGuard` verifica la firma y opcionalmente el rol requerido.

---

## 📍 Geocodificación

Al crear o editar un cliente se intenta obtener latitud/longitud utilizando la API de Google Maps:

1. Si se dispone de `googlePlaceId`, se consulta directamente el Place Details API.
2. En caso contrario se arma una cadena con la dirección y se usa Geocoding API.
3. Los errores de geocodificación no detienen el guardado; el log indica qué ocurrió.

Configura la variable `GOOGLE_MAPS_API_KEY` si deseas habilitar este comportamiento fuera de Docker.

---

## 🔐 Seguridad y pruebas

- Usa el endpoint de salud `GET /health` para comprobar que el servicio responde (no requiere token).
- Para probar con cURL:
  ```bash
  TOKEN=$(node ../scripts/get-token.js admin1 Admin123!)
  curl http://localhost:3000/clients \
    -H "Authorization: Bearer $TOKEN"
  ```
  (El script `scripts/get-token.js` intercambia credenciales demo por un token Keycloak).

- Los tests unitarios básicos se ejecutan con:
  ```bash
  npm run test
  ```

---

## 🔁 Interacción con otros servicios

- **visits-service** consume este microservicio para obtener clientes al crear una visita.
- **frontend** usa el proxy `/api/gateway/clients/*` para mostrar listados y mapas.
- **notifications-service** reutiliza los datos del cliente para armar el correo de resumen.

La separación favorece que en un despliegue real se pueda escalar el CRUD de clientes de forma independiente.

---

## 🧯 Troubleshooting

- **401/403 inesperados**: revisa que el `KEYCLOAK_ISSUER` del contenedor coincida con el `iss` configurado en Keycloak (en este proyecto es `http://localhost:8080/realms/skynet`).
- **Errores de Prisma**: ejecuta `npx prisma generate` dentro de la carpeta si cambiaste el esquema; las migraciones están ubicadas en `prisma/migrations`.
- **Sin coordenadas**: asegúrate de tener una API key válida o agrega `lat` y `lng` manualmente en las mutaciones.

---

Con esto tienes la información necesaria para comprender, ejecutar y mantener el clients-service dentro del ecosistema de SkyNet Field Ops.
