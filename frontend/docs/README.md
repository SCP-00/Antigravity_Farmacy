# Farmacy Frontend

Documentación técnica del frontend de Farmacy — sistema de gestión farmacéutica con tienda B2C, POS, inventario y chatbot IA.

## Stack

| Tecnología | Versión |
|---|---|
| React | 19.2.6 |
| TypeScript | 6.0 |
| Vite | 6.4 |
| Tailwind CSS | 4.3 |
| Zustand | 4.5 |
| React Query | 5.100 |
| React Router | 6.30 |

## Arquitectura

```
src/
├── components/       # Componentes React (layout, shared, tienda)
├── hooks/            # Custom hooks reutilizables
├── store/            # Estado global (Zustand + persist)
├── services/         # Servicios HTTP (API calls)
├── types/            # Interfaces y tipos compartidos
├── config/           # Configuración (API, constantes)
├── utils/            # Utilidades (fuzzy search, etc.)
├── data/             # Datos mock (catálogo local)
├── pages/            # Páginas del router
└── main.tsx          # Entry point
```

## Categorías de documentación

### Componentes
- **Layouts** — Estructuras de página (AdminLayout, PublicLayout, AuthLayout, ProtectedRoute)
- **Shared** — Componentes reutilizables (InputField, Skeleton, SEOHead, LazyImage, etc.)
- **Tienda** — Componentes B2C (ProductCard, CarritoDrawer, ChatbotWidget, Header, Footer)

### Hooks
- Autenticación (useAuth, useAuthCliente)
- Carrito (useCarrito)
- Chatbot (useChatbot)
- Push notifications (usePushNotifications)
- PWA install (usePWAInstall)
- Barcode scanner (useScanner)
- Real-time SSE/WS (useSSE, useWS)
- Utilidades (useDebounce, useFormateo, useLocalStorage, usePermisos, useProductosBusqueda, useCategorias)

### Stores (Zustand)
- authStore — Sesión de empleados (persistida)
- authClienteStore — Sesión de clientes B2C (persistida)
- carritoStore — Carrito de compras (persistido en localStorage)
- uiStore — UI global (sidebar, chatbot, dark mode)

### Servicios
- authService, authClienteService — Autenticación
- productosService, categoriasService — Catálogo
- inventarioService — Inventario y lotes
- ventasService — Ventas
- cajaService — Caja POS
- comprasService — Órdenes de compra
- proveedoresService — Proveedores
- clientesService — Gestión de clientes
- empleadosService — Gestión de empleados
- sucursalesService — Sucursales
- reportesService — Reportes
- auditoriaService — Logs de auditoría
- chatbotService — Chatbot IA
- pushService — Push notifications
- pagosService — Pasarelas de pago

### Tipos
- ProductoCatalogo, CarritoProducto, CategoriaCatalogo, SedeCatalogo
