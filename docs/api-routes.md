# 📍 Mapa de Rutas — Antigravity Farmacy

> 🚨 **pnpm-only.** Este proyecto SOLO usa `pnpm`. NO uses `npm` ni `yarn`.

> **Última actualización:** 2026-05-26
> **API Prefix:** `/api/v1`
> **Frontend:** `http://localhost:5173`

---

## 🔙 Backend — API REST

**Prefijo base:** `http://localhost:3000/api/v1`

### Salud y Sistema

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/health` | ❌ | Health check del servidor |

---

### 🔐 Auth — Empleados (Panel Admin)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/auth/login` | ❌ | Login empleado (email + password) |
| `POST` | `/auth/refresh` | ❌ | Rotación de refresh tokens |
| `POST` | `/auth/logout` | ✅ Token | Logout + blacklist tokens |
| `GET` | `/auth/me` | ✅ Token | Perfil del empleado autenticado |

---

### 🔐 Auth — Clientes (Tienda B2C)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/clientes/auth/registro` | ❌ | Registro de nuevo cliente |
| `POST` | `/clientes/auth/login` | ❌ | Login cliente |
| `GET` | `/clientes/auth/google` | ❌ | Iniciar OAuth Google |
| `GET` | `/clientes/auth/google/callback` | ❌ | Callback OAuth Google |
| `POST` | `/clientes/auth/verificar-email` | ❌ | Verificar email con token |
| `POST` | `/clientes/auth/recuperar-password` | ❌ | Solicitar reset de password |
| `POST` | `/clientes/auth/reset-password` | ❌ | Resetear password con token |
| `GET` | `/clientes/auth/me` | ✅ Cliente | Perfil del cliente autenticado |
| `POST` | `/clientes/auth/logout` | ✅ Cliente | Logout cliente |
| `GET` | `/clientes/auth/pedidos` | ✅ Cliente | Historial de pedidos del cliente |
| `POST` | `/clientes/auth/pedidos/:id/devolucion-request` | ✅ Cliente | Solicitar devolución |
| `POST` | `/clientes/auth/favoritos` | ✅ Cliente | Toggle favorito (add/remove) |

### Perfil Cliente (auth-cliente perfil)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `PATCH` | `/clientes/auth/me` | ✅ Cliente | Actualizar perfil |
| `GET` | `/clientes/auth/favoritos` | ✅ Cliente | Listar favoritos |

---

### 🏪 Productos

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `GET` | `/productos/buscar` | ❌ | — | Búsqueda pública (excluye muestras médicas) |
| `GET` | `/productos` | ✅ Token | — | Listado admin completo |
| `GET` | `/productos/:id` | ❌ | — | Detalle producto (público) |
| `POST` | `/productos` | ✅ Token | ADMIN, AUXILIAR | Crear producto |
| `PATCH` | `/productos/:id` | ✅ Token | ADMIN, AUXILIAR | Actualizar producto |
| `DELETE` | `/productos/:id` | ✅ Token | ADMIN | Desactivar producto |

> **Nota:** `GET /buscar` filtra automáticamente `esMuestraMedica: false` (cumplimiento INVIMA).

---

### 🗂️ Categorías

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `GET` | `/categorias` | ❌ | — | Listar categorías activas (cacheado 1h) |
| `POST` | `/categorias` | ✅ Token | ADMIN | Crear categoría |
| `PATCH` | `/categorias/:id` | ✅ Token | ADMIN | Actualizar categoría |

---

### 🏢 Sucursales

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `GET` | `/sucursales` | ❌ | — | Listar sucursales activas |
| `POST` | `/sucursales` | ✅ Token | ADMIN | Crear sucursal |
| `PATCH` | `/sucursales/:id` | ✅ Token | ADMIN | Actualizar sucursal |

---

### 💬 Chatbot — FarmaBot

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/chatbot` | ❌ | Enviar mensaje (menú contextual por estado) |
| `GET` | `/chatbot/horario` | ❌ | Horario de atención humana |
| `POST` | `/chatbot/interacciones` | ❌ | Verificar interacciones medicamentosas |
| `GET` | `/chatbot/producto/:id` | ❌ | Detalle completo de producto |

---

### 🖼️ Imágenes (Cloudinary)

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `POST` | `/imagenes/subir` | ✅ Token | ADMIN, AUXILIAR | Subir imagen (max 5MB) |
| `DELETE` | `/imagenes/:publicId` | ✅ Token | ADMIN | Eliminar imagen de Cloudinary |

---

### 📦 Lotes

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `GET` | `/lotes` | ✅ Token | ADMIN, AUXILIAR | Listar lotes (filtro: sucursalId, productoId, proximosVencer) |
| `POST` | `/lotes` | ✅ Token | ADMIN, AUXILIAR | Crear lote (recalcula costo promedio) |

---

### 📊 Inventario

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `POST` | `/inventario/ajuste` | ✅ Token | ADMIN, AUXILIAR | Ajuste de inventario (+/-) |
| `GET` | `/inventario/movimientos` | ✅ Token | — | Historial de movimientos |
| `GET` | `/inventario/alertas` | ✅ Token | — | Alertas de inventario (filtro: leidas) |
| `PATCH` | `/inventario/alertas/:id/leer` | ✅ Token | — | Marcar alerta como leída |

---

### 💰 Ventas

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `GET` | `/ventas/dashboard` | ✅ Token | ADMIN, FARMACEUTA | Dashboard (ventas hoy, stock crítico, por vencer) |
| `GET` | `/ventas` | ✅ Token | ADMIN, FARMACEUTA | Listar ventas (filtro: desde, hasta, estado) |
| `POST` | `/ventas` | ✅ Token | ADMIN, FARMACEUTA | Registrar venta (atomico FEFO) |
| `POST` | `/ventas/:id/devolucion` | ✅ Token | ADMIN, FARMACEUTA | Procesar devolución (max 15 días) |

---

### 💵 Caja

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `GET` | `/caja/actual` | ✅ Token | ADMIN, FARMACEUTA | Caja abierta del empleado |
| `POST` | `/caja/abrir` | ✅ Token | ADMIN, FARMACEUTA | Abrir caja |
| `POST` | `/caja/:id/cerrar` | ✅ Token | ADMIN, FARMACEUTA | Cerrar caja con arqueo |
| `GET` | `/caja/historial` | ✅ Token | ADMIN, FARMACEUTA | Historial de cierres |

---

### 👥 Clientes (Admin)

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `GET` | `/clientes` | ✅ Token | ADMIN, FARMACEUTA | Listar clientes (búsqueda por q) |
| `GET` | `/clientes/:id` | ✅ Token | ADMIN, FARMACEUTA | Detalle cliente + últimas ventas |
| `GET` | `/clientes/:id/compras` | ✅ Token | ADMIN, FARMACEUTA | Historial completo de compras |

---

### 👤 Empleados

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `GET` | `/empleados` | ✅ Token | ADMIN | Listar empleados |
| `POST` | `/empleados` | ✅ Token | ADMIN | Crear empleado |
| `PATCH` | `/empleados/:id` | ✅ Token | ADMIN | Actualizar empleado |
| `PATCH` | `/empleados/:id/estado` | ✅ Token | ADMIN | Activar/desactivar empleado |

---

### 🤝 Proveedores

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `GET` | `/proveedores` | ✅ Token | ADMIN, AUXILIAR | Listar proveedores (búsqueda por q) |
| `POST` | `/proveedores` | ✅ Token | ADMIN, AUXILIAR | Crear proveedor |
| `GET` | `/proveedores/:id` | ✅ Token | ADMIN, AUXILIAR | Detalle proveedor |
| `PATCH` | `/proveedores/:id` | ✅ Token | ADMIN, AUXILIAR | Actualizar proveedor |

---

### 📋 Compras / Órdenes de Compra

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `GET` | `/compras` | ✅ Token | ADMIN, AUXILIAR | Listar órdenes de compra (filtro: estado) |
| `POST` | `/compras` | ✅ Token | ADMIN, AUXILIAR | Crear orden de compra |
| `GET` | `/compras/:id` | ✅ Token | ADMIN, AUXILIAR | Detalle orden de compra |
| `POST` | `/compras/:id/recibir` | ✅ Token | ADMIN, AUXILIAR | Recibir mercancía (crea lotes) |

---

### 📈 Reportes

| Método | Ruta | Auth | RBAC | Descripción |
|--------|------|------|------|-------------|
| `GET` | `/reportes/ventas` | ✅ Token | ADMIN | Reporte de ventas (desde, hasta, sucursalId) |
| `GET` | `/reportes/inventario` | ✅ Token | ADMIN | Reporte de inventario |
| `GET` | `/reportes/compras` | ✅ Token | ADMIN | Reporte de compras (desde, hasta) |
| `GET` | `/reportes/:tipo/csv` | ✅ Token | ADMIN | Exportar CSV (ventas/compras/inventario) |

---

### 💳 Pagos — Pasarelas

#### Wompi (Colombia)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/pagos/wompi/crear` | ✅ Cliente | Crear transacción Wompi |
| `POST` | `/pagos/wompi/webhook` | ❌ | Webhook (firma HMAC) |

#### Stripe

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/pagos/stripe/crear-intent` | ✅ Cliente | Crear PaymentIntent |
| `POST` | `/pagos/stripe/webhook` | ❌ | Webhook (raw body, firma HMAC) |

> **Nota:** Stripe webhook usa `raw({ type: 'application/json' })` **antes** de `express.json()`.

#### MercadoPago

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/pagos/mercadopago/crear` | ✅ Cliente | Crear preferencia MP |
| `POST` | `/pagos/mercadopago/webhook` | ❌ | Webhook notificaciones MP |

#### Efectivo (POS)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/pagos/efectivo/registrar` | ✅ Token | Registrar pago en efectivo |

---

## 📱 Frontend — Rutas de la Aplicación

### 🏪 Tienda Pública (`PublicLayout`)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | `Inicio` | Landing page |
| `/productos` | `Catalogo` | Catálogo con filtros |
| `/catalogo` | ↳ `Catalogo` | Redirect a `/productos` |
| `/productos/:slug` | `ProductoDetalle` | Ficha técnica INVIMA |
| `/carrito` | `Carrito` | Carrito de compras |
| `/sucursales` | `Sucursales` | Sedes y horarios |
| `/contacto` | `Contacto` | Formulario de contacto |
| `/quienes-somos` | `QuienesSomos` | Información de la empresa |
| `/nosotros` | ↳ `QuienesSomos` | Redirect a `/quienes-somos` |
| `/privacidad` | `PoliticaPrivacidad` | Política de privacidad |
| `/terminos` | `TerminosCondiciones` | Términos y condiciones |

### 🔑 Auth (`AuthLayout`)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/login` | `LoginCliente` | Login clientes |
| `/registro` | `RegistroCliente` | Registro clientes |
| `/recuperar-password` | `RecuperarPassword` | Solicitar recuperación |
| `/reset-password` | `ResetPassword` | Resetear contraseña |
| `/verificar-email` | `VerificarEmail` | Verificar email |
| `/admin/login` | `LoginAdmin` | Login empleados (admin) |

### 🛒 Cliente Autenticado (`ProtectedRoute tipo="cliente"` + `PublicLayout`)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/checkout` | `Checkout` | Checkout con selector de pago |
| `/pago/confirmacion` | `ConfirmacionPago` | Confirmación post-pago |
| `/cuenta` | `MiCuenta` | Perfil del cliente |
| `/cuenta/pedidos` | `MisPedidos` | Historial de pedidos |
| `/cuenta/favoritos` | `Favoritos` | Productos favoritos |

### ⚙️ Panel Admin (`ProtectedRoute tipo="empleado"` + `AdminLayout`)

#### Dashboard (todos los roles)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin` | `Dashboard` | Dashboard principal |

#### 💵 Caja — `ADMINISTRADOR`, `FARMACEUTA`

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/caja/pos` | `PuntoVenta` | Punto de venta (POS) |
| `/admin/caja/historial` | `HistorialCaja` | Historial de cierres |
| `/admin/caja/devoluciones` | `Devoluciones` | Gestión de devoluciones |

#### 📦 Inventario — `ADMINISTRADOR`, `AUXILIAR`

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/inventario/productos` | `ListaProductos` | Listado de productos |
| `/admin/inventario/productos/:id` | `DetalleProductoAdmin` | Detalle/edición producto |
| `/admin/inventario/lotes` | `GestionLotes` | Gestión de lotes FEFO |
| `/admin/inventario/alertas` | `AlertasInventario` | Alertas de inventario |
| `/admin/inventario/movimientos` | `Movimientos` | Historial de movimientos |

#### 📋 Compras — `ADMINISTRADOR`, `AUXILIAR`

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/compras/ordenes` | `OrdenesCompra` | Órdenes de compra |
| `/admin/compras/nueva` | `NuevaOrden` | Nueva orden de compra |
| `/admin/compras/recepcion` | `RecepcionMercancia` | Recepción de mercancía |

#### 👥 Clientes (Admin) — `ADMINISTRADOR`, `FARMACEUTA`

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/clientes` | `ListaClientes` | Listado de clientes |
| `/admin/clientes/fidelidad` | `ProgramaFidelidad` | Programa de fidelidad |
| `/admin/clientes/:id` | `DetalleCliente` | Detalle del cliente |

#### 🤝 Proveedores — `ADMINISTRADOR`, `AUXILIAR`

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/proveedores` | `ListaProveedores` | Listado de proveedores |
| `/admin/proveedores/:id` | `DetalleProveedor` | Detalle del proveedor |

#### 👤 Empleados — Solo `ADMINISTRADOR`

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/empleados` | `ListaEmpleados` | Listado de empleados |
| `/admin/empleados/:id` | `DetalleEmpleado` | Detalle del empleado |

#### 📊 Reportes — Solo `ADMINISTRADOR`

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/reportes/ventas` | `ReporteVentas` | Reporte de ventas |
| `/admin/reportes/inventario` | `ReporteInventario` | Reporte de inventario |
| `/admin/reportes/compras` | `ReporteCompras` | Reporte de compras |
| `/admin/reportes/clientes` | `ReporteClientes` | Reporte de clientes |

#### ⚙️ Configuración — Solo `ADMINISTRADOR`

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/admin/configuracion` | `ConfigGeneral` | Configuración general |
| `/admin/configuracion/usuarios` | `ConfigUsuarios` | Gestión de usuarios |
| `/admin/configuracion/sucursales` | `ConfigSucursales` | Gestión de sucursales |
| `/admin/configuracion/seguridad` | `ConfigSeguridad` | Seguridad y auditoría |

### 🔄 Otras

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/auth/callback` | `AuthCallback` | Callback OAuth (layout propio) |
| `*` | `NoEncontrado` | 404 — Ruta no encontrada |

---

## 🧩 Resumen de Módulos

### Backend (50+ endpoints)

| Módulo | Archivo | Endpoints | Auth |
|--------|---------|-----------|------|
| Health | `app.ts` | 1 | ❌ |
| Auth Admin | `auth.routes.ts` | 4 | 1 ❌, 3 ✅ |
| Auth Cliente | `authCliente.routes.ts` | 12 | 6 ❌, 6 ✅ |
| Perfil Cliente | `authCliente.perfil.routes.ts` | 2 | ✅ |
| Categorías | `categorias.routes.ts` | 3 | 1 ❌, 2 ✅ |
| Sucursales | `sucursales.routes.ts` | 3 | 1 ❌, 2 ✅ |
| Chatbot | `chatbot.routes.ts` | 4 | ❌ |
| Imágenes | `imagenes.routes.ts` | 2 | ✅ |
| Productos | `productos.routes.ts` | 6 | 2 ❌, 4 ✅ |
| Lotes | `lotes.routes.ts` | 2 | ✅ |
| Inventario | `inventario.routes.ts` | 4 | ✅ |
| Ventas | `ventas.routes.ts` | 4 | ✅ |
| Caja | `caja.routes.ts` | 4 | ✅ |
| Clientes Admin | `clientes.admin.routes.ts` | 3 | ✅ |
| Empleados | `empleados.routes.ts` | 4 | ✅ |
| Proveedores | `proveedores.routes.ts` | 4 | ✅ |
| Compras | `compras.routes.ts` | 4 | ✅ |
| Reportes | `reportes.routes.ts` | 4 | ✅ |
| Pagos | `pagos.routes.ts` | 7 | 3 ❌, 3 ✅ Cliente, 1 ✅ Token |
| **Total** | **19 módulos** | **72 endpoints** | — |

### Frontend (40+ páginas)

| Sección | Páginas | Layout | Protección |
|---------|---------|--------|-----------|
| Tienda pública | 11 | `PublicLayout` | ❌ |
| Auth | 7 | `AuthLayout` | ❌ |
| Cliente autenticado | 5 | `PublicLayout` | `tipo="cliente"` |
| Admin Dashboard | 1 | `AdminLayout` | `tipo="empleado"` |
| Admin Caja | 3 | `AdminLayout` | ADMIN, FARMACEUTA |
| Admin Inventario | 5 | `AdminLayout` | ADMIN, AUXILIAR |
| Admin Compras | 3 | `AdminLayout` | ADMIN, AUXILIAR |
| Admin Clientes | 3 | `AdminLayout` | ADMIN, FARMACEUTA |
| Admin Proveedores | 2 | `AdminLayout` | ADMIN, AUXILIAR |
| Admin Empleados | 2 | `AdminLayout` | ADMIN |
| Admin Reportes | 4 | `AdminLayout` | ADMIN |
| Admin Config | 4 | `AdminLayout` | ADMIN |
| Auth Callback | 1 | _ninguno_ | ❌ |
| 404 | 1 | _ninguno_ | ❌ |

---

## 🔐 Roles y Permisos (RBAC)

| Rol | Acceso |
|-----|--------|
| `ADMINISTRADOR` | Acceso total: reportes, empleados, configuración (4 módulos exclusivos) |
| `FARMACEUTA` | Caja, ventas, clientes, dashboard |
| `AUXILIAR` | Inventario, lotes, compras, proveedores, productos, imágenes |

### Matriz de Módulos por Rol

| Módulo | ADMIN | FARMACEUTA | AUXILIAR |
|--------|-------|------------|----------|
| Dashboard | ✅ | ✅ | ✅ |
| Caja / POS | ✅ | ✅ | ❌ |
| Ventas | ✅ | ✅ | ❌ |
| Productos (CRUD) | ✅ | ❌ | ✅ |
| Lotes | ✅ | ❌ | ✅ |
| Inventario (ajustes) | ✅ | ❌ | ✅ |
| Compras | ✅ | ❌ | ✅ |
| Proveedores | ✅ | ❌ | ✅ |
| Clientes | ✅ | ✅ | ❌ |
| Imágenes | ✅ | ❌ | ✅ |
| Empleados | ✅ | ❌ | ❌ |
| Reportes | ✅ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ |
