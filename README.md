# skynet-microservices
Arquitectura basada en microservicios para la gestión de clientes, visitas técnicas y notificaciones en SkyNet S.A. Desarrollado con NestJS, Prisma, Keycloak y Next.js.

🛰️ SkyNet Field Ops – Plataforma de Gestión de Visitas Técnicas

Proyecto final — Facultad de Ingeniería en Sistemas de Información

Este proyecto implementa una arquitectura basada en microservicios para la empresa SkyNet S.A., dedicada a soporte técnico y mantenimiento informático a nivel nacional.
El objetivo principal es optimizar la planificación y seguimiento de visitas a clientes mediante un sistema web moderno y escalable.

🧱 Arquitectura General

Backend: NestJS + Prisma + PostgreSQL + Redis

Frontend: Next.js 14 (App Router, TypeScript, OIDC con Keycloak)

Autenticación y roles: Keycloak (Administrador, Supervisor, Técnico)

Infraestructura: Docker Compose

Notificaciones: PDF + Email (BullMQ, Puppeteer, Nodemailer)

⚙️ Módulos principales

Clients Service: CRUD de clientes con geolocalización (Google Maps API)

Visits Service: Planificación y registro de visitas diarias

Notifications Service: Generación y envío de reportes en PDF vía correo electrónico

Frontend: Dashboard con autenticación OIDC, mapa de visitas, check-in/out

🧩 Objetivo académico

Desarrollar un sistema funcional, documentado y desplegable en la nube, aplicando buenas prácticas de análisis, diseño y arquitectura de software.
