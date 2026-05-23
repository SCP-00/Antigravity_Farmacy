# Architecture overview

## Monorepo layout
- \backend/: Express + TypeScript API, Prisma ORM, auth, POS, inventory, payments. Capas separadas de schemas y services.
- \frontend/: React + Vite + Tailwind UI for B2C store and admin console.
- database/: Prisma schema and seeds.
- Root scripts: setup.bat, \run.bat, docker-compose.dev.yml.

## Entry points
- Backend: \backend/src/server.ts
- Frontend: \frontend/src/main.tsx

## Estándar Regulatorio Colombiano (INVIMA / CUM / ATC)
- **CUM como SKU real:** La farmacia gestiona su stock mediante el CUM exacto (`expedientecum + "-" + consecutivocum`) asegurando un control riguroso de cada presentación comercial independiente.
- **Seguridad en Alérgenos y Excipientes:** El modelo posee los campos `alergenos` y `advertencias` en la tabla `productos` para advertir sobre trazas o excipientes sensibles (ej. *Lactosa, Tartrazina*) en la visualización del público B2C.
- **Muestras Médicas Protegidas:** Se define la columna `esMuestraMedica`. El backend rechaza y excluye estos productos de cualquier consulta pública comercial para evitar la comercialización ilegal de muestras.

## Backend module catalog (verified)
| Module | Route prefix | File | Status |
|---|---|---|---|
| auth | /api/v1/auth | \backend/src/modules/auth/auth.routes.ts | active |
| auth-cliente | /api/v1/clientes/auth | \backend/src/modules/auth-cliente/authCliente.routes.ts | active |
| auth-cliente perfil | /api/v1/clientes/auth | \backend/src/modules/auth-cliente/authCliente.perfil.routes.ts | active |
| categorias | /api/v1/categorias | \backend/src/modules/categorias/categorias.routes.ts | active |
| sucursales | /api/v1/sucursales | \backend/src/modules/sucursales/sucursales.routes.ts | active |
| productos | /api/v1/productos | \backend/src/modules/productos/productos.routes.ts | active |
| lotes | /api/v1/lotes | \backend/src/modules/lotes/lotes.routes.ts | active |
| inventario | /api/v1/inventario | \backend/src/modules/inventario/inventario.routes.ts | active |
| ventas | /api/v1/ventas | \backend/src/modules/ventas/ventas.routes.ts | active |
| caja | /api/v1/caja | \backend/src/modules/caja/caja.routes.ts | active |
| clientes (admin) | /api/v1/clientes | \backend/src/modules/clientes/clientes.admin.routes.ts | active |
| empleados | /api/v1/empleados | \backend/src/modules/empleados/empleados.routes.ts | active |
| proveedores | /api/v1/proveedores | \backend/src/modules/proveedores/proveedores.routes.ts | active |
| compras | /api/v1/compras | \backend/src/modules/compras/compras.routes.ts | active |
| reportes | /api/v1/reportes | \backend/src/modules/reportes/reportes.routes.ts | active |
| chatbot | /api/v1/chatbot | \backend/src/modules/chatbot/chatbot.routes.ts | active |
| pagos | /api/v1/pagos | \backend/src/modules/pagos/pagos.routes.ts | active |
| imagenes | /api/v1/imagenes | \backend/src/modules/imagenes/imagenes.routes.ts | active |

## Services (dominio)
- \backend/src/services/inventario.service.ts: Lógica FEFO (First Expired, First Out) y cálculo de costo promedio.
- \backend/src/services/ventas.service.ts: Registro de ventas con integración FEFO y puntos de fidelidad.

## Validaciones Zod
- \backend/src/schemas/inventario.schema.ts: Schemas para creación de lotes y ajustes de inventario.
- \backend/src/schemas/productos.schema.ts: Schemas para creación/actualización de productos (Con validación estricta de CUM e INVIMA).
- Todos exportados centralizadamente desde \backend/src/schemas/index.ts.

## Jobs (CRON)
- \backend/src/jobs/alertas.ts: Verificación diaria (7:00 AM) de lotes próximos a vencer con umbrales escalonados (30/15/0 días) y stock crítico. Crea alertas en BD, notifica admins por email.