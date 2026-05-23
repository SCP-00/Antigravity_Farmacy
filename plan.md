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

**Fase 5 — POS, Caja, Fidelidad y Erradicación de Placeholders (ACTUAL - PRIORIDAD)**
- /goals: venta rapida; caja; sistema de puntos/descuentos; construir TODAS las paginas faltantes.
- [x] Flujo POS con busqueda/escaneo y respuesta <1.5s.
- [x] Apertura/cierre de caja con arqueo y justificacion.
- [x] Generacion de PDF de tirilla.
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
*Sugerencia Arquitectónica: Para "Configuración General", recomiendo crear una tabla de clave-valor (ej. ConfiguracionGlobal) en BD para guardar IVA, nombre de empresa y metas, o manejarlo limpiamente vía variables de entorno si el negocio no muta mucho.*

**Fase 6 — Tienda B2C**
- [x] Catalogo publico con filtros conectados a BD.
- [x] Carrito y validacion FEFO.
- [x] Cuenta cliente: perfil, favoritos, pedidos.
- [ ] Politica de Privacidad y Terminos (Páginas publicas).
*Sugerencia de UI: Reemplazar estos placeholders por textos legales enriquecidos utilizando la clase '.surface' y HTML semántico puro sin peticiones de red.*

**Fase 7 — Pagos**
- [ ] Wompi, Stripe, MercadoPago (Intencion, Webhooks).
*Sugerencia Arquitectónica: El backend ya procesa los Webhooks y la creación de intenciones (pagos.routes.ts). El paso a seguir es incrustar el Widget de Wompi y el Elements de Stripe directamente en Checkout.tsx del frontend para capturar las tarjetas de forma segura (PCI-DSS).*

**Fase 8 — Chatbot**
- [ ] Escalamiento a humano y memoria LLM.
*Sugerencia Tecnológica: Integrar la API de OpenAI (ChatGPT) u otra alternativa Open Source. En vez de depender del filtro por tokens actual, inyectarle el esquema JSON del inventario al LLM mediante function calling para que de recomendaciones de venta cruzada ("Veo que llevas analgésicos, ¿necesitas agua o algo más?").*

**Fase 9 — Auditoria Final**
- [ ] Logs de actividad completos y revision de rendimiento.
*Sugerencia Funcional: Construir un visor de "Logs de Auditoría" en la Configuración de Seguridad para que el Administrador Principal pueda revisar la tabla 'logs_actividad' y detectar ingresos denegados.*
