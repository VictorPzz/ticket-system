# 🎫 Sistema de Gestión de Tickets - Soporte Técnico

[![Node.js](https://img.shields.io/badge/Node.js-18-green)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6-green)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistema web para la gestión de incidencias y tickets de soporte técnico, desarrollado con arquitectura MVC y desplegado con Docker.

## 📋 Descripción

Aplicación web completa para la gestión de tickets de soporte técnico en empresas. Permite a los empleados reportar incidencias y al equipo de TI darles seguimiento de manera organizada y eficiente.

### Características principales

- **Sistema de roles** (Empleado, Técnico, Administrador)
- **CRUD completo** de tickets con prioridades y categorías
- **Notificaciones en tiempo real** para asignaciones y cambios de estado
- **Dashboard con estadísticas** y métricas de rendimiento
- **SLA integrado** con seguimiento de tiempos de respuesta
- **Búsqueda y filtros** avanzados
- **Archivos adjuntos** (imágenes, documentos, logs)
- **Exportación a PDF y Excel**
- **Sistema de comentarios** por ticket
- **Historial completo** de cambios
- **Rate limiting** para protección contra abuso
- **Validación de contraseñas** seguras

## 🛠️ Tecnologías utilizadas

| Componente | Tecnología |
|------------|------------|
| Backend | Node.js + Express |
| Base de datos | MongoDB + Mongoose |
| Frontend | HTML5, CSS3, JavaScript vanilla |
| Autenticación | JWT (JSON Web Tokens) |
| Contenedores | Docker + Docker Compose |
| Seguridad | bcrypt, rate-limiting, helmet |

## 🚀 Instalación

### Requisitos previos

- [Docker](https://www.docker.com/) instalado y ejecutándose

### Pasos

1. Clonar el repositorio
```bash
git clone https://github.com/VictorPzz/ticket-system.git
cd ticket-system
```

2. Iniciar los contenedores
```bash
docker-compose up -d
```

3. Abrir en el navegador
```
http://localhost:3000
```

## 🔧 Funcionalidades por rol

### Empleado
- Crear tickets de soporte
- Ver el estado de sus tickets
- Agregar comentarios
- Ver qué técnico está asignado

### Técnico
- Ver todos los tickets disponibles
- Auto-asignarse tickets
- Cambiar estado de tickets asignados
- Subir archivos adjuntos
- Recibir notificaciones

### Administrador
- Ver dashboard con estadísticas
- Asignar tickets a técnicos
- Gestionar usuarios y roles
- Exportar reportes (PDF/Excel)
- Ver métricas de SLA

## 📝 Licencia

Este proyecto está bajo la licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**VictorPzz** - [GitHub](https://github.com/VictorPzz)
