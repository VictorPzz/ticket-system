# 🎫 Sistema de Tickets - Soporte Técnico

Proyecto pequeño de práctica para gestión de incidencias y tickets de soporte técnico.

## ¿Qué hace?

Aplicación web donde los empleados pueden reportar problemas técnicos y el equipo de TI los resuelve de forma organizada.

## Tecnologías

- **Backend:** Node.js + Express
- **Base de datos:** MongoDB
- **Frontend:** HTML, CSS, JavaScript
- **Contenedores:** Docker

## Cómo usarlo

```bash
# Clonar
git clone https://github.com/VictorPzz/ticket-system.git
cd ticket-system

# Ejecutar
docker-compose up -d

# Abrir
http://localhost:3000
```

## Usuarios de prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@example.com | admin123 |
| Técnico | tecnico@example.com | tecnico123 |
| Empleado | usuario@example.com | usuario123 |

## Funcionalidades

- Crear y gestionar tickets
- Sistema de roles (Empleado, Técnico, Admin)
- Notificaciones
- Dashboard con estadísticas
- Búsqueda y filtros
- Archivos adjuntos
- Exportar a PDF/Excel

---

*Proyecto de práctica desarrollado para aprender desarrollo web fullstack.*
