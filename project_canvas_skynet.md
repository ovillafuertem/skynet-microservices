# 🎯 Project Canvas — Sistema de Gestión de Visitas (SkyNet S.A.)


## 🧩 Problema

La empresa **SkyNet S.A.** gestiona actualmente sus visitas a clientes mediante hojas de papel o archivos de Excel.
Esto genera:

* Pérdida de información.
* Dificultad para planificar visitas.
* Retrasos y descontento de clientes.
* Falta de reportes y trazabilidad.

---

## 💡 Solución Propuesta

Diseñar e implementar una **solución informática basada en microservicios** que:

* Digitalice la planificación y seguimiento de visitas.
* Permita a **supervisores** y **técnicos** acceder a información en tiempo real.
* Incluya **un dashboard interactivo** para control de visitas.
* Genere **reportes automáticos** y **envíos de correos electrónicos** tras cada visita.

---

## ⚙️ Arquitectura y Tecnologías

* **Arquitectura:** Microservicios + API REST
* **Front-end:** Web App (framework libre elección, e.g. Angular, React o Vue)
* **Back-end:** Libre elección (recomendado: Java, Node.js, Spring Boot, NestJS)
* **Base de Datos:** Cloud-hosted (e.g. PostgreSQL, MongoDB o Firebase)
* **Infraestructura:** Servidor web y servidor de aplicaciones en la nube
* **Integraciones:**

  * Google Maps (geolocalización y rutas)
  * Email Service (notificación automática al cliente)

---

## 👥 Roles y Usuarios

| Rol               | Función principal                                        |
| ----------------- | -------------------------------------------------------- |
| **Administrador** | Gestión global del sistema y configuraciones.            |
| **Supervisor**    | Planificación de visitas y seguimiento de técnicos.      |
| **Técnico**       | Registro de visitas diarias, geolocalización e informes. |

---

## 🧱 Módulos Principales

1. **Usuarios y Roles**
2. **Clientes** (con coordenadas geográficas)
3. **Visitas** (planificación, registro y control)
4. **Configuraciones del Sistema**
5. **Reportes en pantalla y PDF**

---

## 📊 Flujo General del Sistema

1. Supervisor crea visitas asignadas a técnicos.
2. Técnico inicia y finaliza visitas desde el sistema.
3. Sistema registra fecha, hora y coordenadas.
4. Cliente recibe correo con resumen de visita.
5. Supervisor visualiza estados y reportes en dashboard.

---

## 🧪 Entregables

* **Documentación funcional (30%)**

  * Requerimientos, factibilidad, BPMN, ERD, diagramas, prototipos, costos.
* **Prototipo funcional (70%)**

  * Repositorio GitLab/Bitbucket
  * Script SQL de la base de datos
  * Despliegue en la nube para presentación remota.

---

## 🚫 Sanciones (Académicas)

* Diagramas copiados o descargados de Internet: −50%
* Plagio de código o documentación: −100%
* Archivos corruptos o con virus: −100%

---

## 🧭 Objetivo General

> Implementar una solución web basada en microservicios que permita la **gestión integral de visitas técnicas** para SkyNet S.A., optimizando la planificación, ejecución y supervisión de actividades en tiempo real.

---

¿Quieres que te lo deje en un archivo `.md` descargable (por ejemplo `Project_Canvas_SkyNet.md`)?
Así puedes subirlo directo a un repositorio o usarlo como contexto inicial para Codex.
