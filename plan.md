# Roadmap plan

**Fase 0 — Alineacion y limpieza**
- /goals: mapa real de modulos; eliminar stubs; normalizar puertos/config; reducir deuda de estructura.
- [ ] Inventariar `backend/src/modules` y `frontend/src/pages` para detectar stubs, duplicados y rutas huerfanas.
- [ ] Consolidar modulos redundantes y mover logica compartida a un dominio unico (inventario/precios/stock).
- [ ] Normalizar puertos y origen de `.env` entre backend, Vite y `run.bat`.
- [ ] Definir catalogo oficial de modulos y retirar exclusiones temporales cuando esten listos.

**Fase 1 — Nucleo de datos y servicios compartidos**
- /goals: modelo de datos consistente; servicios de dominio reutilizables; integracion POS+B2C.
- [ ] Validar el esquema Prisma actual contra SRS y fijar el modelo canonico.
- [ ] Crear servicios de dominio: catalogo, pricing/IVA, stock, FEFO, sucursales.
- [ ] Establecer DTOs y validaciones Zod compartidas para API y UI.
- [ ] Asegurar seeds/migraciones idempotentes y coherentes con el dominio.

**Fase 2 — Seguridad y RBAC**
- /goals: autenticacion unificada; roles SRS; sesiones seguras.
- [ ] Alinear hashing con Argon2id (o formalizar excepcion si se mantiene bcrypt).
- [ ] Implementar RBAC por rol y casos de uso reales (ADMINISTRADOR, FARMACEUTA, AUXILIAR/CAJERO).
- [ ] OAuth Google/Facebook para clientes con linking seguro a cuentas existentes.
- [ ] Rotacion de refresh tokens e invalidacion en Redis.

**Fase 3 — Inventario y Lotes (FEFO)**
- /goals: control de lotes; FEFO automatico; alertas de vencimiento; cumplimiento INVIMA.
- [ ] Logica FEFO centralizada usada por POS y B2C.
- [ ] Bloqueo de venta de lotes vencidos y restriccion de edicion post-venta.
- [ ] Alertas 30/15/0 dias con panel operativo para auxiliares.
- [ ] Movimientos con justificacion y trazabilidad por empleado.

**Fase 4 — Proveedores y Compras**
- /goals: abastecimiento completo; ordenes de compra; recepcion conciliada.
- [ ] CRUD de proveedores con validacion NIT y condiciones comerciales.
- [ ] Ordenes de compra automaticas por stock minimo y manuales.
- [ ] Recepcion de mercancia con actualizacion de lotes y costos.
- [ ] Historial y estados con auditoria.

**Fase 5 — POS y Caja**
- /goals: venta rapida; control de caja; comprobantes; devoluciones.
- [ ] Flujo POS con busqueda/escaneo y respuesta <1.5s.
- [ ] Apertura/cierre de caja con arqueo y justificacion de descuadres.
- [ ] Generacion de PDF de tirilla + export CSV contable.
- [ ] Devoluciones con reintegro de stock y logs inmutables.

**Fase 6 — Tienda B2C**
- /goals: catalogo publico; carrito/checkout; cuenta cliente; fidelizacion.
- [ ] Catalogo con filtros y disponibilidad por sucursal en tiempo real.
- [ ] Carrito y reservas temporales conectadas a stock/FEFO.
- [ ] Cuenta cliente: perfil, favoritos, pedidos, consentimiento Habeas Data.
- [ ] Programa de puntos integrado a ventas y descuentos.

**Fase 7 — Pagos**
- /goals: pagos multipasarela; webhooks; conciliacion fiable.
- [ ] Wompi: intencion, confirmacion, webhook y estados idempotentes.
- [ ] Stripe: PaymentIntent, webhook, manejo de reintentos.
- [ ] MercadoPago: preference, IPN/webhook, conciliacion.
- [ ] Registro de transacciones y anti-fraude basico.

**Fase 8 — Chatbot**
- /goals: consulta de stock; reserva temporal; escalamiento humano; compliance medico.
- [ ] Busqueda por producto/sucursal con latencia <2.5s.
- [ ] Reserva temporal (4h) con expiracion y bloqueo de stock.
- [ ] Escalamiento a humano con registro JSONB de conversacion.
- [ ] Disclaimer obligatorio y bloqueo de prescripcion.

**Fase 9 — Reportes y Auditoria**
- /goals: visibilidad operativa; cumplimiento legal; control financiero.
- [ ] Reportes ventas/inventario/caja en admin con Recharts.
- [ ] Logs de actividad con valores anteriores/nuevos e IP.
- [ ] Alertas de eventos criticos (lotes vencidos, descuadres).
- [ ] Backups programados y verificacion periodica.

**Fase 10 — Modulo de documentacion**
- /goals: documentacion viva; trazabilidad; guia operativa.
- [ ] Crear `docs/` con arquitectura, flujos POS/B2C y mapa de modulos.
- [ ] ADRs para decisiones clave (hashing, roles, pagos, FEFO).
- [ ] Playbooks de operacion (deploy, backups, webhooks, fallos).
- [ ] Actualizar docs en cada fase completada.

**Definition of Done por modulo**
- [ ] Endpoints API + validaciones completas.
- [ ] UI funcional con estados de error y loading.
- [ ] Tests minimos (unit/integration) y seeds listos.
- [ ] Documentacion actualizada en `docs/`.
- [ ] Revision de seguridad y rendimiento.
