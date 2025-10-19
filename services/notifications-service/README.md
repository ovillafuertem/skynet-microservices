# Notifications Service

Servicio NestJS encargado de generar notificaciones por correo electrónico y adjuntar reportes PDF cuando una visita es marcada como `DONE`.

## Configuración

- Variables de entorno principales:
  - `REDIS_URL` (o `REDIS_HOST` / `REDIS_PORT`)
  - `SMTP_HOST`, `SMTP_PORT`, `MAIL_FROM`
  - `PDF_COMPANY_NAME`
- El contenedor está preparado con Puppeteer/Chromium y depende de Redis y MailHog.

## Pruebas manuales

1. Realice un `POST` manual al endpoint de pruebas:

   ```bash
   curl -X POST http://localhost:3003/notifications/visit-completed \
     -H "Content-Type: application/json" \
     -d '{
       "visitId": "demo",
       "completedAtIso": "2025-10-15T12:00:00.000Z",
       "client": { "name": "Cliente Demo", "email": "cliente@skynet.local" },
       "technician": { "name": "Técnico Demo" },
       "notes": "Visita de prueba" }
   '
   ```

2. Revise MailHog (`http://localhost:8025`) para comprobar el correo y descargar el PDF adjunto.

## Prueba end-to-end desde visits-service

Existe un script que crea datos demo y marca una visita como `DONE`, provocando que el servicio encole el `visit.completed` automáticamente:

```bash
cd services/visits-service
npm run demo:complete-visit
```

Este comando:

1. Crea un cliente y un técnico en la base de datos `postgres`.
2. Inserta una visita con estado `PLANNED`.
3. Invoca `VisitsService.updateStatus()` con rol de `ADMIN` y marca la visita como `DONE`.
4. El flujo normal encola el evento y `notifications-service` genera y envía el correo.

Verifique la notificación en MailHog (`visita` con asunto *Visita completada*). También puede observar los logs de ambos servicios:

```bash
docker compose logs -f visits
docker compose logs -f notifications
```

## Observaciones

- Si levanta el servicio fuera de Docker (`npm run start`), ajuste `REDIS_HOST=127.0.0.1` para encontrar la instancia de Redis que corre en el host.
- Puppeteer utiliza la caché ubicada en `/home/node/.cache/puppeteer` dentro del contenedor; no es necesario descargar Chromium manualmente.
