# Roadmap plan

**Fase 0 — Alineación y limpieza**
- [x] Inventariar módulos y detectar stubs.
- [x] Normalizar puertos, variables de entorno y origen del `.env`.

**Fase 1 — Núcleo de datos y servicios compartidos**
- [x] Validar el esquema Prisma y crear servicios FEFO ("InventarioService").
- [x] Establecer DTOs y validaciones Zod.

**Fase 2 — Seguridad y RBAC**
- [x] Implementar control de accesos RBAC y auditoría automatizada en base de datos.
- [x] OAuth Google implementado en código.
- [x] Rotación de refresh tokens de un solo uso y lista negra en Redis.

**Fase 3 — Inventario y Lotes (FEFO)**
- [x] Lógica de asignación y despacho FEFO centralizada.
- [x] Alertas automáticas de vencimiento escalonadas (30/15/0 días) vía Job diario.
- [x] Trazabilidad completa de movimientos.

**Fase 4 — Proveedores y Compras**
- [x] CRUD de proveedores y detalle de transacciones.
- [x] Órdenes de compra y recepción de mercancía lote por lote.

**Fase 5 — POS, Caja, Fidelidad y Alineación Regulatoria (COMPLETADO)**
- [x] Flujo POS con búsqueda interactiva y soporte para escáner de códigos de barras.
- [x] Apertura y cierre de turnos de caja con arqueo físico, descuadres y observaciones.
- [x] Generación de tirilla de venta térmica para impresoras de 80mm con opción de impresión directa.
- [x] Integración del estándar regulatorio colombiano del **INVIMA** y **CUM** como identificador comercial.
- [x] Bloqueo comercial y ético a la venta de muestras médicas ("esMuestraMedica").
- [x] Visualización destacada de advertencias de uso seguro y alérgenos críticos (ej. Lactosa, Tartrazina, Sorbitol) de cara al paciente.
- [x] Formulario administrativo de productos adaptado para ingresar y editar todos los campos regulatorios de farmacovigilancia.
- [x] Construcción de páginas de administración: Devoluciones, Clientes, DetalleCliente, ProgramaFidelidad y ListaEmpleados.
- [x] Reportes base: ReporteVentas y ReporteInventario (con listado de lotes próximos a vencer).
- [ ] **Mejora de UX en POS (Planificado):** Atajos de teclado rápidos para operaciones comunes (F2 Cobrar, F4 Limpiar), advertencia visual de interacciones medicamentosas en tiempo real al agregar productos incompatibles, y optimización de legibilidad para turnos nocturnos.

**Fase 6 — Tienda B2C (COMPLETADO)**
- [x] Catálogo público conectado a PostgreSQL con filtros avanzados.
- [x] Carrito y validación de existencias FEFO.
- [x] Ficha técnica interactiva del INVIMA, alérgenos y advertencias para uso seguro en la página de detalles del producto.
- [x] Área personal del cliente: perfil, favoritos e historial de pedidos con opción de solicitar devolución.
- [ ] **Mejora de UX en B2C (Planificado):** Buscador predictivo con autocompletado y resaltado de principio activo, selector de "Alérgenos del Cliente" en la configuración de "Mi Cuenta" para auto-bloquear o advertir compras de medicamentos que los contengan, y optimización de accesibilidad móvil (WCAG AA).

**Fase 7 — Pasarelas de Pago (Siguiente Prioridad)**
- [ ] Integración del widget de Wompi (tarjetas de crédito, PSE) de forma directa en el Checkout.
- [ ] Integración del SDK de Stripe Elements para pagos internacionales.
- [ ] Sincronización final de los Webhooks de pago para transicionar los pedidos de "PENDIENTE" a "PAGO_CONFIRMADO".

**Fase 8 — Chatbot Asistente**
- [ ] Enlace del FarmaBot con modelos de lenguaje natural (LLM/OpenAI) para realizar recomendaciones cruzadas inteligentes basadas en excipientes y síntomas de forma segura.

**Fase 9 — Auditoría Final**
- [ ] Visor de auditoría de seguridad y logs de acceso en el panel para administradores.