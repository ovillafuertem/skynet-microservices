# SkyNet Frontend (Next.js)

Frontend Next.js 14 (App Router + TypeScript) para SkyNet Field Ops. Se integra con Keycloak vía OIDC, aplica control de acceso por roles y consume los microservicios de visitas, clientes y notificaciones con el token Bearer del usuario. Incluye soporte para mapas de Google, geolocalización del navegador y experiencia responsive.

## Requisitos previos

- Node.js 20+
- npm 10+
- Servicios backend corriendo (clients-service, visits-service, notifications-service, Redis, etc.).
- Keycloak con realm `skynet` y client confidential `skynet-web` configurado.
- API key de Google Maps habilitada para Maps JavaScript API y Places.

## Variables de entorno

Crea un archivo `.env.local` basado en `.env.local.example`:

```
NEXTAUTH_URL=http://localhost:3006
NEXTAUTH_SECRET=<cadena-aleatoria>
KEYCLOAK_ISSUER=http://localhost:8081/realms/skynet
KEYCLOAK_CLIENT_ID=skynet-web
KEYCLOAK_CLIENT_SECRET=<secreto-del-client>
API_VISITS_BASE=http://localhost:3001
API_CLIENTS_BASE=http://localhost:3000
API_NOTIFS_BASE=http://localhost:3003
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<api-key>
```

> En Keycloak define `Valid redirect URIs` con `http://localhost:3006/api/auth/callback/keycloak` y expón los roles realm (`admin`, `supervisor`, `tecnico`) en los tokens (realm roles o access token mapper).

## Instalación y ejecución local

```bash
npm install
npm run dev -- --port 3006
```

- Accede a `http://localhost:3006`.
- Usa el botón **Ingresar** (Keycloak) para autenticar.
- Las APIs se consumen mediante rutas internas `/api/gateway/*` que reenvían el token Bearer al servicio correspondiente.

## Estructura relevante

- `src/lib/auth.ts`: Configuración de NextAuth + refresco de tokens.
- `src/app/api/gateway/...`: Proxy autenticado hacia visitas, clientes y notificaciones.
- `src/app/tecnico`, `src/app/supervisor`, `src/app/clientes`: páginas protegidas por rol.
- `src/components/maps/client-map.tsx`: Integración con Google Maps.

## Docker (opcional)

Build y ejecución:

```bash
docker build -t skynet-frontend .
docker run --rm -it -p 3006:3000 --env-file .env.local skynet-frontend
```

El contenedor expone el puerto 3000. Ajusta las variables de entorno con las URLs accesibles desde el contenedor.

## Lista de pruebas manuales sugeridas

1. **Flujo técnico**: iniciar sesión con rol `tecnico`, revisar “Mis visitas de hoy”, ejecutar **Check-in**, **Check-out** y abrir “Cómo llegar”.
2. **Finalizar visita**: tras Check-out, pulsar “Finalizar visita” y validar en logs del notifications-service que se dispara el evento (PDF/email).
3. **Flujo supervisor**: iniciar sesión con rol `supervisor`, revisar KPIs, tabla y crear una visita. Confirmar que la visita aparece en “hoy” para el técnico asignado.
4. **Manejo de errores**: bloquear geolocalización en el navegador y ejecutar Check-in para ver el mensaje correspondiente; caducar el token (o usar un token inválido) y validar mensaje de “No autorizado”.
5. **Mapas**: revisar detalle de un cliente con coordenadas (mapa visible) y otro sin coordenadas (mensaje informativo y mapa oculto).

## Troubleshooting

- **No aparecen roles en la sesión**: verifica los mappers en Keycloak (realm roles en Access Token o ID Token) y que el client `skynet-web` envíe `realm_access`.
- **Respuestas 401/403**: comprueba el issuer, secreto, redirect URI y sincronización de reloj entre frontend, Keycloak y servicios.
- **Geolocalización bloqueada**: el navegador exige HTTPS (o `http://localhost`). Habilita permisos de ubicación manualmente.
- **Mapa en blanco**: revisa que `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` sea válido y que el dominio/puerto esté permitido en la consola de Google Cloud.
- **Errores CORS desde backend**: habilita CORS en los microservicios para el origen del frontend si accedes sin el proxy.

## Definition of Done

- Autenticación OIDC con roles disponibles en `session.user.roles` y token expuesto en `session.access_token`.
- Rutas `/tecnico`, `/supervisor` y `/clientes` protegidas con mensajes de acceso claros.
- Acciones de técnico (Check-in/Check-out/Finalizar) con geolocalización, loaders y feedback.
- Mapas de Google con pin y botón “Cómo llegar” cuando existen coordenadas.
- Consumo de APIs mediante Bearer token y manejo de estados 401/403.
- Documentación de entorno, ejecución y resolución de problemas incluida.
