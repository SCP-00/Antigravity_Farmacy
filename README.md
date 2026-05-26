# 🌿 Farmacy — Sistema de Gestión de Farmacias (SGF)

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-green)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-purple)](https://www.prisma.io/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646CFF)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

**Farmacy** es un sistema de gestión farmacéutica completo con tienda B2C integrada, panel administrativo POS, control de inventario FEFO (*First Expired, First Out*), y múltiples pasarelas de pago. Desarrollado como proyecto académico.

---

## ✨ Características principales

### 🏪 Tienda B2C (pública)
- Catálogo de productos con filtros por categoría, marca, precio y receta médica
- Carrito de compras con reserva temporal de stock
- Autenticación por email + Google OAuth
- Programa de puntos / fidelidad
- Chatbot de atención al cliente con horario configurable

### 🏥 Panel Administrativo (POS)
- **Punto de Venta (POS)** con búsqueda y escaneo de productos
- **Control de Caja**: apertura/cierre con arqueo y descuadres
- **Inventario FEFO**: gestión de lotes con fechas de vencimiento
- **Compras y Proveedores**: órdenes de compra y recepción de mercancía
- **Clientes**: historial de compras, fidelidad, devoluciones
- **Empleados**: gestión de usuarios con roles y permisos
- **Reportes**: ventas, inventario, compras y exportación CSV

### 🔐 Seguridad
- **RBAC** (Control de Acceso Basado en Roles): ADMINISTRADOR, FARMACEUTA, AUXILIAR
- **JWT** con refresh token rotation y blacklisting en Redis
- **Rate limiting** por endpoint
- Auditoría de accesos denegados
- Contraseñas hasheadas con bcryptjs

---

## 🏗️ Arquitectura

```
Farmacy/
├── backend/          # API REST (Express + TypeScript + Prisma)
├── frontend/         # SPA (React + Vite + Tailwind CSS)
├── database/         # Schema Prisma + Seeds + Queries SQL
├── docs/             # Documentación viva del proyecto
├── docker-compose.dev.yml  # Postgres + Redis + pgAdmin
├── docker-compose.yml      # Producción
├── run.bat           # Inicio rápido (Windows)
├── setup.bat         # Setup inicial (Windows)
└── .env.example      # Template de variables de entorno
```

### Backend (`backend/`)
- **Entrypoint**: `src/server.ts`
- **Rutas**: 18 módulos activos en `src/modules/`
- **ORM**: Prisma con PostgreSQL
- **Caché**: Redis (sesiones, rate limiting, blacklist de tokens)
- **Auth**: Passport.js (JWT local + Google OAuth2)
- **Validación**: Zod schemas
- **Jobs**: CRON para alertas de inventario

### Frontend (`frontend/`)
- **Entrypoint**: `src/main.tsx`
- **Framework**: React 18 con TypeScript
- **Build**: Vite 6
- **Estilos**: Tailwind CSS
- **Estado**: Zustand (auth, carrito, UI)
- **Routing**: React Router DOM v6
- **Gráficos**: Recharts
- **HTTP**: Axios con interceptors (refresh token automático)

---

## 🚀 Inicio rápido (Windows)

### Prerrequisitos

| Herramienta | Versión | Cómo verificar |
|---|---|---|
| [Node.js](https://nodejs.org/) | ≥ 18 | `node --version` |
| [pnpm](https://pnpm.io/) | ≥ 8 | `pnpm --version` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Cualquiera | `docker info` |

### Paso a paso

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/farmacy.git
cd farmacy

# 2. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus valores reales (al menos DATABASE_URL y los JWT secrets)

# 3. Iniciar PostgreSQL y Redis con Docker
docker compose -f docker-compose.dev.yml up -d

# 4. Setup automático (instala dependencias, genera Prisma, corre seeds)
setup.bat

# 5. Iniciar backend y frontend
run.bat

# 6. Abrir en el navegador
#    Tienda: http://localhost:5173
#    Admin:  http://localhost:5173/admin/login
```

### Credenciales de desarrollo (seeds)

| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `admin@farmacy.co` | `Admin@1234` |
| Farmacéuta | `farmaceuta@farmacy.co` | `Farm@1234` |
| Auxiliar | `auxiliar@farmacy.co` | `Aux@1234` |
| Cliente | `cliente@ejemplo.co` | `Cliente@1234` |

---

## 🔐 Seguridad y ofuscación — para repositorio público

> ⚠️ **Importante**: Este repositorio está diseñado para ser público. Sigue estas pautas para no exponer datos sensibles.

### ✅ Ya protegido

| Medida | Estado |
|---|---|
| `.env` en `.gitignore` | ✅ Ignorado por git |
| `backend/.env` en `.gitignore` | ✅ Ignorado (patrón global `.env`) |
| `.env.example` con placeholders | ✅ Valores genéricos, seguros para commit |
| Seeds con datos ficticios | ✅ Solo datos demo de desarrollo |
| Sin API keys en código fuente | ✅ Todas las claves vía variables de entorno |

### ⚠️ Recomendaciones antes del push

1. **Rotar el Google Client Secret** usado durante el desarrollo (el compartido en el chat ya fue expuesto). Genera uno nuevo en [Google Cloud Console](https://console.cloud.google.com).

2. **Verificar que no haya secrets en el historial**:
   ```bash
   git log --all --oneline -- .env
   git log --all -p -S "GOCSPX" -- .env
   ```

3. **Usar un hook de pre-commit** para detectar secrets accidentalmente (opcional):
   ```bash
   pnpm install --save-dev secretlint
   ```

4. **Revisar cambios antes de commitear**:
   ```bash
   git diff --cached   # Muestra lo que se va a commitear
   ```

### 🔑 Variables de entorno

Todas las variables sensibles se cargan desde `.env` (excluido de git). El archivo `.env.example` sirve como template con valores placeholder.

**Variables REQUERIDAS para funcionamiento básico:**
- `DATABASE_URL` — Conexión a PostgreSQL
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_CLIENTE_SECRET` — Claves JWT (mín. 32 caracteres)

**Variables OPCIONALES para funcionalidades específicas:**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` — Google OAuth para login social
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` — Envío de emails (verificación, recuperación)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — Subida de imágenes
- `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET` — Pagos Wompi (Colombia)
- `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Pagos Stripe
- `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY` — Pagos MercadoPago

---

## 📁 Estructura del proyecto

```
backend/
├── src/
│   ├── server.ts              # Entrypoint, conexión DB + HTTP
│   ├── app.ts                 # Configuración Express (rutas, middlewares)
│   ├── config/                # Configuraciones (DB, Redis, Passport, env, mailer)
│   ├── middlewares/           # Autenticación, RBAC, validación, rate limiting
│   ├── modules/               # 18 módulos de rutas (auth, productos, ventas, etc.)
│   ├── services/              # Lógica de dominio (InventarioService, VentasService)
│   ├── schemas/               # Validaciones Zod compartidas
│   └── utils/                 # Utilidades (JWT, logger, respuestas)
├── scripts/                   # Scripts de testing E2E
└── package.json

frontend/
├── src/
│   ├── main.tsx               # Entrypoint React
│   ├── app.tsx                # Router principal (público + admin)
│   ├── components/            # Componentes reutilizables (layouts, UI)
│   ├── pages/                 # Páginas (tienda, auth, admin)
│   ├── hooks/                 # Custom hooks (auth, carrito, chatbot, etc.)
│   ├── services/              # Clientes HTTP (Axios)
│   ├── store/                 # Estado global (Zustand + persist)
│   ├── config/                # Configuración (API, constantes)
│   └── types/                 # Tipos TypeScript compartidos
└── package.json

database/
├── prisma/
│   └── schema.prisma          # Modelo de datos (17 modelos)
├── seeds/                     # Datos de prueba (idempotentes)
└── queries/                   # Consultas SQL útiles
```

---

## 🧩 Módulos del Backend (API)

| Módulo | Prefijo | Descripción |
|---|---|---|
| `auth` | `/api/v1/auth` | Login empleados, refresh tokens, logout |
| `auth-cliente` | `/api/v1/clientes/auth` | Registro/login clientes, Google OAuth, recuperación |
| `categorías` | `/api/v1/categorias` | CRUD de categorías de productos |
| `productos` | `/api/v1/productos` | CRUD de productos con búsqueda |
| `lotes` | `/api/v1/lotes` | Gestión de lotes con FEFO |
| `inventario` | `/api/v1/inventario` | Ajustes de stock, movimientos, alertas |
| `ventas` | `/api/v1/ventas` | Registro de ventas, devoluciones |
| `caja` | `/api/v1/caja` | Apertura/cierre de caja, historial |
| `clientes` | `/api/v1/clientes` | CRUD clientes (admin), fidelidad |
| `empleados` | `/api/v1/empleados` | CRUD empleados (solo ADMIN) |
| `proveedores` | `/api/v1/proveedores` | CRUD proveedores |
| `compras` | `/api/v1/compras` | Órdenes de compra, recepción |
| `reportes` | `/api/v1/reportes` | Reportes de ventas/inventario/compras |
| `chatbot` | `/api/v1/chatbot` | Chatbot de atención al cliente |
| `pagos` | `/api/v1/pagos` | Wompi, Stripe, MercadoPago, efectivo |
| `imágenes` | `/api/v1/imagenes` | Subida de imágenes (Cloudinary) |
| `sucursales` | `/api/v1/sucursales` | CRUD sucursales |

---

## 🛠️ Scripts disponibles

### Backend (`cd backend`)
| Comando | Descripción |
|---|---|
| `pnpm run dev` | Inicia servidor en modo desarrollo (nodemon) |
| `pnpm run build` | Compila TypeScript a JavaScript |
| `pnpm run start` | Inicia servidor en producción |
| `pnpm run test` | Ejecuta tests (Vitest) |
| `pnpm run db:seed` | Ejecuta seeds de base de datos |
| `pnpm run db:studio` | Abre Prisma Studio (UI para BD) |
| `pnpm run db:migrate` | Ejecuta migraciones Prisma |

### Frontend (`cd frontend`)
| Comando | Descripción |
|---|---|
| `pnpm run dev` | Inicia servidor de desarrollo Vite |
| `pnpm run build` | Compila para producción |
| `pnpm run preview` | Previsualiza build de producción |
| `pnpm run test` | Ejecuta tests (Vitest) |

---

## 🌱 Roadmap de desarrollo

El proyecto sigue un plan estructurado en 10 fases. El estado actual es:

| Fase | Estado | Descripción |
|---|---|---|
| **0** — Alineación y limpieza | ✅ Completa | Inventario de módulos, normalización de puertos |
| **1** — Núcleo de datos | ✅ Completa | Servicios de dominio (FEFO, VentasService), Zod schemas |
| **2** — Seguridad y RBAC | ✅ Completa | JWT con refresh rotation, Redis blacklisting, OAuth Google |
| **3** — Inventario FEFO | ✅ Completa | Alertas de vencimiento escalonadas, trazabilidad completa |
| **4** — Compras | ✅ Completa | Órdenes de compra + recepción lote por lote |
| **5** — POS y Caja + INVIMA | ✅ Completa | POS con escáner, arqueo, tirilla, 35+ campos regulatorios |
| **6** — Tienda B2C | ✅ Completa | Catálogo real, carrito FEFO, checkout, fidelización |
| **7** — Pagos | ✅ Completa | Wompi, Stripe, MercadoPago, Efectivo (sandbox) |
| **8** — Chatbot | ✅ Completa | FarmaBot con IA, interacciones medicamentosas |
| **9** — Auditoría y Seguridad | ✅ Completa | RBAC, rate limiting, Google OAuth, Redis blacklist |

---

## 🧪 Tests

Actualmente el proyecto tiene:
- **27 archivos de test** (Vitest v3)
- **462 tests — todos pasan** ✅
- **Cobertura global: 83.7%** statements, 83.42% branches, 87.17% functions
- Módulos con 100% coverage: caja, inventario, lotes, sucursales, jwt.utils, respuesta.utils, logger

Para ejecutar los tests:
```bash
cd backend && pnpm test          # 462 tests
cd backend && pnpm test -- --coverage  # Con coverage
```

---

## 🐳 Docker

### Desarrollo
```bash
docker compose -f docker-compose.dev.yml up -d
```
Servicios: PostgreSQL (puerto 5432), Redis (6379), pgAdmin (5050)

### Producción
```bash
docker compose up -d
```

---

## 📚 Documentación adicional

- **[Arquitectura](docs/architecture.md)** — Mapa detallado de módulos y decisiones técnicas
- **[ADR-0001](docs/adr/0001-env-source-of-truth-and-ports.md)** — Política de variables de entorno y puertos
- **[Bitácora de trabajo](docs/worklog.md)** — Historial de cambios por fase
- **[Checklist Fase 0](docs/phase-0-checklist.md)** — Checklist de la fase inicial
- **[Plan de desarrollo](plan.md)** — Roadmap completo con hitos

---

## 🤝 Contribuir

1. Haz fork del proyecto
2. Crea una rama (`git checkout -b feature/mi-feature`)
3. Haz commit de tus cambios (`git commit -m 'feat: agregar mi feature'`)
4. Haz push a la rama (`git push origin feature/mi-feature`)
5. Abre un Pull Request

### Convenciones de código
- TypeScript estricto — sin `any` implícitos
- Nombres de variables en camelCase (backend) y camelCase (frontend)
- Componentes React en PascalCase
- Validaciones con Zod en los archivos de ruta o esquemas
- Commits en inglés o español con prefijo (`feat:`, `fix:`, `docs:`, `refactor:`)

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 🏫 Proyecto académico

Desarrollado como proyecto de gestión farmacéutica para la **Universidad Tecnológica de Pereira (UTP)**.

---
