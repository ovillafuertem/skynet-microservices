# SkyNet Field Ops – Plataforma Académica de Visitas Técnicas

Proyecto integrador para la Facultad de Ingeniería en Sistemas de Información. El sistema replica la operación diaria de SkyNet S.A., empresa ficticia dedicada al soporte técnico y mantenimiento informático en sitio.

La solución completa se ejecuta con Docker Compose y está dividida en microservicios NestJS que se comunican entre sí mediante REST y Redis. El frontend es una aplicación Next.js con autenticación OIDC mediante Keycloak.

---

## 🔭 Panorama general

| Componente | Tecnologías principales | Rol dentro del proyecto |
|------------|------------------------|--------------------------|
| **clients-service** | NestJS · Prisma · PostgreSQL | CRUD de clientes, geocodificación y datos básicos para visitas. |
| **visits-service** | NestJS · Prisma · Redis | Programación, check-in/out y reportes PDF de visitas. |
| **notifications-service** | NestJS · BullMQ · Puppeteer | Envía correos con resúmenes en PDF cuando una visita termina. |
| **frontend** | Next.js 14 · NextAuth · Google Maps | Dashboard web para técnicos y supervisores. |
| **Keycloak** | Realm `skynet` | Gestión de identidad con roles `ADMIN`, `SUPERVISOR` y `TECNICO`. |
| **Infraestructura** | Docker Compose · Traefik · Mailhog | Orquestación, reverse proxy, base de datos y correo de pruebas. |

Todas las fechas se manejan en la zona horaria `America/Guatemala`. Esta variable (`TZ`) se inyecta a los contenedores relevantes para evitar desfases entre servicios y lo reflejado en la interfaz.

---

## 🧰 Requisitos previos

- Docker 24+ y Docker Compose 2+
- 8 GB de RAM recomendados (Puppeteer y Keycloak consumen memoria adicional)
- Puerto 8080 libre en la máquina anfitriona (Keycloak)
- Puerto 8083 libre (Traefik)
- Clave de API de Google Maps con permisos para Maps JavaScript API y Places (se configura en `frontend/.env.docker`)

---

## 🚀 Puesta en marcha rápida

1. **Clona el repositorio**  
   ```bash
   git clone https://github.com/<usuario>/skynet-microservices.git
   cd skynet-microservices
   ```

2. **Configura las variables de entorno**

   - `.env` (raíz) ya incluye las versiones de imágenes y credenciales demo.
   - `frontend/.env.docker` define la integración con Keycloak y las URLs de los microservicios.
   - Cada servicio tiene un `.env` propio dentro de `services/**`. Estos archivos contienen contraseñas demo y la zona horaria configurada.

3. **Construye e inicializa toda la plataforma**
   ```bash
   docker compose build
   docker compose up -d
   ```

   El primer arranque descarga Chromium para Puppeteer y puede tardar varios minutos.

4. **Importa el realm de Keycloak (solo primera vez)**

   El contenedor de Keycloak importa automáticamente `infra/keycloak/realm-export/skynet-realm.json` cuando el volumen está vacío. Si necesitas resetearlo:
   ```bash
   docker compose down
   docker volume rm skynet_keycloak_db_data
   docker compose up -d
   ```

5. **Accede a los servicios**

   | Servicio | URL | Notas |
   |----------|-----|-------|
   | Frontend (Next.js) | http://localhost:3006 | Roles según usuario. |
   | Keycloak admin | http://localhost:8080/admin | Usuario `admin` · contraseña `admin`. |
   | Mailhog | http://localhost:8025 | Correos de prueba. |
   | Traefik dashboard | http://localhost:8083 | Proxy inverso. |
   | PgAdmin | http://localhost:5051 | Credenciales en `.env`. |

   Usuarios demo incluidos en el realm:

   | Usuario | Rol | Contraseña |
   |---------|-----|------------|
   | `admin1` | ADMIN | `Admin123!` |
   | `super1` | SUPERVISOR | `Super123!` |
   | `tec1`   | TECNICO | `Tec123!` |

---

## 👣 Flujos sugeridos para la demostración

1. **Autenticación**
   - Ingresa al frontend como `admin1`, `super1` o `tec1`.
   - La sesión se obtiene de Keycloak y aparece en la interfaz según el rol.

2. **Registrar una visita**
   - Como supervisor, crea una visita y asigna un técnico y un cliente.
   - Verifica en la vista de técnico que la visita aparece con la fecha correcta (revisa el filtro de “Hoy”).

3. **Ejecutar la visita**
   - Desde la cuenta del técnico realiza check-in, check-out y finaliza la visita.
   - Revisa Mailhog para confirmar la recepción del correo con PDF.

4. **Reportes**
   - Desde supervisor consulta el listado de visitas, usa filtros y descarga el PDF en la sección de reportes (`visits-service`).

5. **Cerrar sesión**
   - Pulsa **Salir** en el frontend; la sesión de Keycloak se invalida y al intentar ingresar se solicitan credenciales nuevamente.

---

## ⚙️ Estructura de carpetas

```
.
├── docker-compose.yml           # Orquesta toda la plataforma
├── infra/keycloak/realm-export  # Realm y clientes de Keycloak
├── services/
│   ├── clients-service/          # Microservicio de clientes (NestJS)
│   ├── visits-service/           # Microservicio de visitas
│   └── notifications-service/    # Microservicio de notificaciones
├── frontend/                     # Aplicación Next.js 14
└── docker/                       # Configuraciones extra (Traefik, Keycloak stand-alone, etc.)
```

Cada submódulo tiene su propio `README.md` con detalles de endpoints, scripts y variables específicas.

---

## 🐳 Variables relevantes en Docker Compose

| Variable | Descripción |
|----------|-------------|
| `TZ` | Zona horaria utilizada en los contenedores (por defecto `America/Guatemala`). |
| `TRAEFIK_HTTP_PORT` | Puerto de exposición de Traefik (8083). |
| `POSTGRES_*` | Credenciales de la base principal (`skynet_db`). |
| `REDIS_PORT` | Puerto de Redis (6379). |
| `RABBIT_*` | Parámetros del broker RabbitMQ (si se habilitan colas adicionales). |

> Si ejecutas los servicios fuera de Docker, asegúrate de replicar estas variables para mantener coherencia de tiempos y credenciales.

---

## 🛠️ Scripts útiles

- `docker compose logs -f <servicio>` – Sigue los logs (por ejemplo `visits`, `notifications`, `keycloak`).
- `npm run demo:complete-visit` dentro de `services/visits-service` – Genera una visita de prueba y dispara la notificación.
- `npm run demo:report` dentro de `services/visits-service` – Produce un PDF con el reporte del día.
- `make clean` – Limpia contenedores e imágenes relacionados (requiere GNU Make).

---

## 🧪 Pruebas manuales recomendadas

- **Autenticación y roles**: Inicia sesión con cada tipo de usuario para comprobar los guardas de Next.js.
- **Check-in / Check-out**: Bloquea la geolocalización en el navegador y prueba el flujo para validar los mensajes de error.
- **Generación de PDF**: Marca una visita como `DONE` y revisa Mailhog; descarga el PDF y verifica su contenido.
- **Consistencia de horarios**: Tras actualizar `TZ`, revisa que las horas mostradas en frontend, base de datos y correos coincidan.
- **Proxy interno**: Apaga un microservicio (`docker compose stop visits`) para ver cómo el frontend muestra mensajes de indisponibilidad.

---

## 🧯 Troubleshooting

- **Keycloak no inicia / puerto 8080 ocupado**  
  Comprueba si otro proceso usa el puerto (incluido un Keycloak previo). Cambia `TRAEFIK_HTTP_PORT` o libera el puerto y reinicia con `docker compose up -d`.

- **Sigue apareciendo la sesión tras “Salir”**  
  Las sesiones anteriores quedan en memoria del navegador. Prueba limpiar cookies del dominio `localhost`. Asegúrate de haber reiniciado la pila después de cambiar el realm.

- **Tiempos desplazados un día**  
  Revisa que cada servicio tenga definida la variable `TZ=America/Guatemala` y vuelve a crear los contenedores. Verifica la hora del sistema anfitrión.

- **Timeout al generar PDF**  
  Puppeteer requiere ~200 MB extra. Si el contenedor se queda sin RAM o swap, aumenta los recursos asignados a Docker.

---

## 📚 Documentación por servicio

- [`services/clients-service/README.md`](services/clients-service/README.md)
- [`services/visits-service/README.md`](services/visits-service/README.md)
- [`services/notifications-service/README.md`](services/notifications-service/README.md)
- [`frontend/README.md`](frontend/README.md)

Cada documento cubre endpoints, variables y scripts específicos de esa pieza.

---

## 📄 Licencia

Uso académico. El código puede reutilizarse como base para proyectos estudiantiles siempre que se cite la autoría original de SkyNet Field Ops.

---

¡Listo! Con estos pasos puedes levantar la plataforma completa, recorrer los flujos principales y presentarla en clase o evaluaciones sin perder tiempo configurando manualmente cada componente.
