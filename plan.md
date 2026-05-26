# Roadmap plan

> **📍 Mapa de rutas completo:** [docs/api-routes.md](docs/api-routes.md)
> Incluye los 72 endpoints REST, 40+ páginas frontend y la matriz RBAC.

## 🏗️ Roadmap — Antigravity Farmacy (Estándar INVIMA Colombia)

### Fase 0 — Alineación y limpieza ✅
- [x] Inventariar módulos y detectar stubs.
- [x] Normalizar puertos, variables de entorno y origen del `.env`.

### Fase 1 — Núcleo de datos y servicios compartidos ✅
- [x] Validar el esquema Prisma y crear servicios FEFO ("InventarioService").
- [x] Establecer DTOs y validaciones Zod.

### Fase 2 — Seguridad y RBAC ✅
- [x] Implementar control de accesos RBAC y auditoría automatizada en base de datos.
- [x] OAuth Google implementado en código.
- [x] Rotación de refresh tokens de un solo uso y lista negra en Redis.

### Fase 3 — Inventario y Lotes (FEFO) ✅
- [x] Lógica de asignación y despacho FEFO centralizada.
- [x] Alertas automáticas de vencimiento escalonadas (30/15/0 días) vía Job diario.
- [x] Trazabilidad completa de movimientos.

### Fase 4 — Proveedores y Compras ✅
- [x] CRUD de proveedores y detalle de transacciones.
- [x] Órdenes de compra y recepción de mercancía lote por lote.

### ⚡ Fase 5 — Alineación Regulatoria INVIMA + POS ✅

- Schema Prisma con 35+ campos regulatorios INVIMA
- Ruta `/buscar` filtra `esMuestraMedica: false`
- Validación CUM único con manejo Prisma P2002
- Cache Redis para búsquedas públicas (5 min)
- Ficha técnica INVIMA en ProductoDetalle (B2C) con tabs interactivos
- Formulario admin con 7 bloques organizados
- POS con escáner CUM, arqueo de caja, tirilla térmica 80mm
- Reportes de ventas e inventario

### ⚡ Fase 6 — Tienda B2C ✅
- Catálogo público con filtros conectado a PostgreSQL
- Carrito con validación FEFO
- Ficha técnica INVIMA interactiva (3 tabs)
- Área personal: perfil, favoritos, historial

### 🗄️ Fase INVIMA-CSV ✅
- Mini-CSV (56 productos, 14 ATC, 26 KB)
- Scripts de importación y generación de lotes
- 121 lotes generados, costos promedios recalculados

### Fase 7 — Pasarelas de Pago ✅
- **Wompi (sandbox)**: Firma HMAC-SHA256 con integrity key, endpoints crear/webhook
- **Stripe**: PaymentIntents + webhook con verificación HMAC
- **MercadoPago**: Preferencia + webhook, integración con ventaId directo
- **Efectivo**: Registro de venta sin pasarela
- Frontend: Checkout con selector visual, redirect real a cada pasarela
- `PagoTransaccion` con FK formal a `Venta`
- Keys sandbox configuradas para las 3 pasarelas

### Fase 8 — Chatbot Asistente ✅
- FarmaBot con detección de interacciones medicamentosas
- Alertas de seguridad con severidad (ALTA/MEDIA/INFO)
- LLM indicator, respuestas inteligentes

### Fase 9 — Auditoría y Seguridad Final ✅ (con mejoras pendientes)

**Completado:**
- [x] JWT con refresh token rotation + Redis blacklisting
- [x] RBAC (ADMINISTRADOR, FARMACEUTA, AUXILIAR)
- [x] Rate limiting por endpoint
- [x] Auditoría de accesos denegados (logs en DB)
- [x] Google OAuth implementado en código

**Mejoras futuras (post-MVP):**
- [ ] Visor de auditoría de logs en el panel admin
- [ ] Historial de cambios en precios y productos

## 📐 Documentación de Rutas

Ver [docs/api-routes.md](docs/api-routes.md) para el mapa completo:
- **Backend:** 72 endpoints REST en 19 módulos
- **Frontend:** 40+ páginas en 12 secciones
- **RBAC:** Matriz completa de roles por módulo