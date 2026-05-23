# Roadmap plan

**Fase 0 — Alineacion y limpieza**
- [x] Inventariar modulos y detectar stubs.
- [x] Normalizar puertos y origen de .env.

**Fase 1 — Nucleo de datos y servicios compartidos**
- [x] Validar el esquema Prisma y crear servicios FEFO.
- [x] Establecer DTOs y validaciones Zod.

**Fase 2 — Seguridad y RBAC**
- [x] Implementar RBAC por rol y auditoría.
- [x] OAuth Google implementado.
- [x] Rotacion de refresh tokens y Blacklisting en Redis.

**Fase 3 — Inventario y Lotes (FEFO)**
- [x] Logica FEFO centralizada.
- [x] Alertas 30/15/0 dias (job diario).
- [x] Movimientos con trazabilidad.

**Fase 4 — Proveedores y Compras**
- [x] CRUD de proveedores.
- [x] Ordenes de compra y recepcion de mercancia.

**Fase 5 — POS, Caja, Fidelidad y Erradicación de Placeholders**
- [x] Flujo POS con busqueda/escaneo y respuesta <1.5s.
- [x] Apertura/cierre de caja con arqueo y justificacion.
- [x] Generacion de PDF de tirilla (InvoicePreview).
- [x] Sistema de Puntos (Cashback $100 = 1pto = $1) y UI de Descuentos.
- [x] Construir página: Devoluciones (Admin).
- [x] Construir páginas: Clientes, DetalleCliente y ProgramaFidelidad (Admin).
- [x] Construir página: ListaEmpleados.
- [ ] Construir página: DetalleEmpleado (Admin).
- [x] Construir página: ReporteVentas.
- [x] Construir página: ReporteInventario.
- [ ] Construir páginas: ReporteCompras y ReporteClientes.
- [x] Construir página: Configuración de Sucursales.
- [ ] Construir páginas: Configuración (General, Usuarios, Seguridad).
- [x] Modelado de Datos Regulatorios de Colombia (CUM / INVIMA / ATC / Exclusión de Muestras Médicas / Warning de Alérgenos en Interfaz).

**Fase 6 — Tienda B2C**
- [x] Catalogo publico con filtros conectados a BD.
- [x] Carrito y validacion FEFO.
- [x] Cuenta cliente: perfil, favoritos, pedidos.
- [x] Ficha técnica del INVIMA interactiva con advertencias de uso seguro y alérgenos de cara al público.
- [ ] Politica de Privacidad y Terminos (Páginas publicas).

**Fase 7 — Pagos**
- [ ] Wompi, Stripe, MercadoPago (Intencion, Webhooks).

**Fase 8 — Chatbot**
- [ ] Escalamiento a humano y memoria LLM.

**Fase 9 — Auditoria Final**
- [ ] Logs de actividad completos y revision de rendimiento.