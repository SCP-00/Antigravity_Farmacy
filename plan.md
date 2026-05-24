# Roadmap plan

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

#### Modelo de Datos (Prisma)
- [x] Schema con **35+ campos regulatorios** INVIMA: cum (único), registroInvima, principioActivo, atc, descripcionAtc, titular, expediente, formaFarmaceutica, viaAdministracion, estadoCum, estadoRegistro, fechaExpedicion, fechaVencimientoRegistro, fechaActivoCum, fechaInactivoCum, esMuestraMedica, alergenos, advertencias, indicaciones, contraindicaciones, reaccionesAdversas, interacciones, modoUso, unidadReferencia, cantidad, unidadMedida, modalidad, ium

#### Backend (Express + Prisma)
- [x] Ruta `/buscar` filtra `esMuestraMedica: false` — bloqueo legal de muestras médicas
- [x] Validación CUM único con manejo de error Prisma P2002
- [x] Cache en Redis para búsquedas públicas (5 min)
- [x] Búsqueda por principioActivo, laboratorio, nombre, concentracion (mode insensitive)
- [x] Todos los campos INVIMA expuestos en endpoints públicos y admin
- [x] Zod schemas actualizados con validación completa

#### Frontend - ProductoDetalle (B2C)
- [x] Ficha técnica INVIMA con tabs: Registro Sanitario | Seguridad | Clínica
- [x] Visualización de: CUM, Registro INVIMA, ATC, Forma Farmacéutica, Vía, Concentración
- [x] Alertas visuales semánticas: 🟥 RX (rojo), 🟨 Alérgenos (ámbar), 🟦 Precauciones (azul), 🟪 Interacciones (púrpura)
- [x] Sección clínica expandible: Indicaciones, Modo de Uso, Contraindicaciones, Reacciones Adversas, Interacciones
- [x] Badges de estado: CUM Activo/Inactivo, Muestra Médica, RX

#### Frontend - ListaProductos (Admin)
- [x] Formulario completo con 7 bloques organizados: Registro Sanitario → ATC → Comerciales → Estado Regulatorio → Forma Farmacéutica → Clínica → Farmacovigilancia
- [x] Checkbox de Muestra Médica con bloqueo comercial
- [x] Fechas con input type="date"
- [x] Validación Zod completa para todos los campos INVIMA

#### Frontend - DetalleProductoAdmin
- [x] Vista detallada tipo ficha técnica completa
- [x] Sidebar con precios, stock, farmacovigilancia, lotes y metadatos

#### POS (Punto de Venta)
- [x] Flujo POS con búsqueda interactiva y soporte para escáner de códigos de barras (CUM)
- [x] Apertura y cierre de turnos de caja con arqueo físico
- [x] Tirilla de venta térmica para impresoras 80mm
- [ ] **Mejora UX Planificada:** Atajos de teclado (F2 Cobrar, F4 Limpiar), alerta de interacciones en tiempo real, optimización nocturna

#### Otras páginas admin
- [x] Devoluciones, Clientes, DetalleCliente, ProgramaFidelidad, ListaEmpleados
- [x] Reportes: ReporteVentas, ReporteInventario (lotes próximos a vencer)

### ⚡ Fase 6 — Tienda B2C (Catálogo INVIMA) ✅
- [x] Catálogo público con filtros avanzados conectado a PostgreSQL
- [x] Carrito con validación de existencias FEFO
- [x] Ficha técnica INVIMA interactiva (3 tabs)
- [x] Área personal: perfil, favoritos, historial, devoluciones
- [ ] **Mejora UX Planificada:** Buscador predictivo con autocompletado, selector de alérgenos del cliente, accesibilidad WCAG AA

### 🗄️ Fase INVIMA-CSV — Mini-CSV + Lotes de Inventario ✅
- [x] Mini-CSV generado: 56 productos representativos de 14 grupos ATC (26 KB)
- [x] Script `backend/scripts/generar-mini-csv.mjs`: Filtra solo activos + comerciales, 4 por ATC
- [x] Script `database/scripts/importar-y-generar.cjs`: Importa productos + genera lotes (todo en uno)
- [x] Lotes generados: 121 lotes con fechas de vencimiento variadas
- [x] Precios de compra/venta realistas: $368,490 compra / $817,937 venta total
- [x] Recálculo de costos promedios automático

### Fase 7 — Pasarelas de Pago ✅
- [x] Selector visual de método de pago (Wompi, Stripe, MercadoPago, Efectivo) con cards informativas
- [x] Simulación de flujo de pasarela con animación progresiva (3 pasos por método)
- [x] Página de confirmación standalone con query params (estado/pedido)
- [x] Flujo completo: selección → simulación → registro de venta → confirmación con puntos
- [x] Modo Sandbox/Demo — conectado al backend real para registro de ventas

### Fase 8 — Chatbot Asistente ⏳
- [ ] Enlace del FarmaBot con LLM/OpenAI para recomendaciones cruzadas inteligentes
- [ ] Alertas de interacciones medicamentosas y excipientes alérgenos

### Fase 9 — Auditoría y Seguridad Final ⏳
- [ ] Visor de auditoría de logs de acceso en el panel admin
- [ ] Historial de cambios en precios y productos