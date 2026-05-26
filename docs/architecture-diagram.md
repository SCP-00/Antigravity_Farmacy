# 🏗️ Diagrama de Arquitectura — Antigravity Farmacy

```mermaid
---
title: Antigravity Farmacy — Arquitectura del Sistema
---
graph TB
    %% ═══════════════════════════════════════════════════
    %% ESTILOS
    %% ═══════════════════════════════════════════════════
    classDef frontend fill:#e0f2fe,stroke:#0284c7,color:#0f172a
    classDef backend  fill:#fef3c7,stroke:#d97706,color:#0f172a
    classDef database fill:#dcfce7,stroke:#16a34a,color:#0f172a
    classDef external fill:#f3e8ff,stroke:#7c3aed,color:#0f172a
    classDef infra    fill:#f1f5f9,stroke:#64748b,color:#0f172a
    classDef devtools fill:#ffe4e6,stroke:#e11d48,color:#0f172a
    
    %% ═══════════════════════════════════════════════════
    %% USUARIO
    %% ═══════════════════════════════════════════════════
    Usuario(("👤 Cliente"))
    Admin(("👤 Admin / Farm."))
    
    %% ═══════════════════════════════════════════════════
    %% DEV SCRIPTS
    %% ═══════════════════════════════════════════════════
    DevScripts["🛠️ Dev Tooling
    ─────────────
    run.ps1 — Script de inicio
    setup.bat — Instalación inicial
    pnpm workspace — Monorepo"]
    
    %% ═══════════════════════════════════════════════════
    %% FRONTEND — React 19 + Vite 6 + Tailwind 4
    %% ═══════════════════════════════════════════════════
    subgraph FE["📱 Frontend — localhost:5173"]
        direction TB
        
        FE_Layouts["Layouts"]
        FE_Pages["Paginas (40+)
        Tienda | Auth | Admin"]
        FE_Components["Componentes
        Header, Footer, ProductCard,
        CarritoDrawer, ChatbotWidget"]
        FE_Store["Zustand Store
        authStore | carritoStore | uiStore"]
        FE_Services["API Service
        axios + 510 tests Vitest"]
        FE_Router["react-router-dom v6
        /productos/:slug
        /admin/inventario/..."]
        
        FE_Layouts --> FE_Pages
        FE_Pages --> FE_Components
        FE_Pages --> FE_Store
        FE_Pages --> FE_Services
        FE_Router --> FE_Pages
    end
    
    %% ═══════════════════════════════════════════════════
    %% BACKEND — Express + TypeScript 6
    %% ═══════════════════════════════════════════════════
    subgraph BE["⚙️ Backend API — localhost:3000/api/v1"]
        direction TB
        
        BE_Middleware["Middleware Stack
        helmet | cors | rate-limit
        passport JWT | logger | error handler"]
        
        BE_Routes["Router — 72 endpoints / 19 modulos
        Detalle completo: docs/api-routes.md
        
        Publicos: health, productos/buscar,
        chatbot, categorias, auth clientes
        
        Autenticados (Token): productos, lotes,
        inventario, ventas, caja, empleados,
        proveedores, compras, reportes
        
        Webhooks: wompi, stripe, mercadopago"]
        
        BE_Schemas["Schemas Zod
        productos | inventario | ventas"]
        
        BE_Services["Domain Services
        InventarioService (FEFO, costo prom.)
        VentasService (registro + fidelidad)
        interacciones.service"]
        
        BE_Config["Config (30+ env vars)
        env.ts | database.ts | redis.ts
        passport.ts | mailer.ts"]
        
        BE_Routes --> BE_Schemas
        BE_Routes --> BE_Services
        BE_Routes -.-> BE_Middleware
        BE_Middleware --> BE_Config
        BE_Services --> BE_Config
    end
    
    %% ═══════════════════════════════════════════════════
    %% BASE DE DATOS
    %% ═══════════════════════════════════════════════════
    subgraph DB["Base de Datos"]
        direction TB
        
        DB_Postgres[(PostgreSQL 15
        17+ tablas: productos, lotes,
        ventas, caja, empleados,
        clientes, proveedores, compras,
        pagos, alertas, favoritos,
        devoluciones, log_actividad)]
        
        DB_Redis[(Redis 7
        Cache (5 min busquedas)
        Blacklist JWT (8h-30d)
        Refresh token rotacion
        Sesiones chatbot)]
        
        DB_Prisma[Prisma ORM
        schema.prisma + seeds + migraciones]
        
        DB_Seeds[Seeds / Importacion
        INVIMA-MINI.csv (56 prod.)
        121 lotes generados
        costos promedios recalculados]
    end
    
    %% ═══════════════════════════════════════════════════
    %% SERVICIOS EXTERNOS
    %% ═══════════════════════════════════════════════════
    subgraph EXT["Servicios Externos"]
        direction TB
        
        EXT_Pagos["Pasarelas de Pago
        Wompi (sandbox) — Colombia
        Stripe (test) — Internacional
        MercadoPago (sandbox) — LatAm
        Efectivo — POS"]
        
        EXT_OAuth[Google OAuth
        Login con Gmail]
        
        EXT_Cloudinary[Cloudinary
        Imagenes productos]
        
        EXT_Email[SMTP — Nodemailer
        Verificacion email
        Reset password
        Notificaciones]
    end
    
    %% ═══════════════════════════════════════════════════
    %% INFRAESTRUCTURA DOCKER
    %% ═══════════════════════════════════════════════════
    subgraph DOCKER["Docker Compose — dev"]
        direction LR
        DOCKER_PG[PostgreSQL 15 — puerto: 5432]
        DOCKER_RD[Redis 7 — puerto: 6379]
        DOCKER_PA[pgAdmin — puerto: 5050]
    end
    
    %% ═══════════════════════════════════════════════════
    %% CONEXIONES
    %% ═══════════════════════════════════════════════════
    Usuario -->|HTTP :5173| FE
    Admin -->|HTTP :5173| FE
    DevScripts -->|pnpm run dev| FE
    DevScripts -->|pnpm run dev| BE
    DevScripts -->|docker compose up| DOCKER
    
    FE -->|axios /api/v1/*| BE
    
    BE -->|Prisma ORM| DB_Prisma
    BE -->|ioredis| DB_Redis
    DB_Prisma -->|SQL| DB_Postgres
    DB_Seeds -.-> DB_Postgres
    
    BE -->|HTTP| EXT_Pagos
    BE -->|Cloudinary SDK| EXT_Cloudinary
    BE -->|Nodemailer| EXT_Email
    EXT_OAuth -->|callback| BE
    
    DOCKER_PG -.->|contiene| DB_Postgres
    DOCKER_RD -.->|contiene| DB_Redis
    
    %% ═══════════════════════════════════════════════════
    %% APLICAR ESTILOS
    %% ═══════════════════════════════════════════════════
    class FE,FE_Layouts,FE_Pages,FE_Components,FE_Store,FE_Services,FE_Router frontend
    class BE,BE_Middleware,BE_Routes,BE_Schemas,BE_Services,BE_Config backend
    class DB_Postgres,DB_Redis,DB_Prisma,DB_Seeds database
    class EXT_Pagos,EXT_OAuth,EXT_Cloudinary,EXT_Email external
    class DOCKER_PG,DOCKER_RD,DOCKER_PA infra
    class DevScripts devtools
```

---

## 📋 Leyenda

| Color | Capa | Tecnologías |
|-------|------|-------------|
| 🔵 Azul | **Frontend** | React 19, Vite 6, Tailwind 4, TS 6, Zustand, react-router-dom v6 |
| 🟡 Amarillo | **Backend** | Express, TS 6, Zod, Prisma, Passport JWT, Vitest |
| 🟢 Verde | **Base de Datos** | PostgreSQL 15, Redis 7, Prisma ORM |
| 🟣 Morado | **Externos** | Wompi, Stripe, MercadoPago, Google OAuth, Cloudinary, SMTP |
| ⚪ Gris | **Infraestructura** | Docker Compose (dev): PostgreSQL, Redis, pgAdmin |
| 🔴 Rosa | **Dev Tooling** | run.ps1, setup.bat, pnpm workspace |

---

## 🔄 Flujo de Datos Principal

```
Usuario → Browser → Vite dev server (:5173)
                       ↓
              React App → Zustand Store
                       ↓
              API Service (axios)
                       ↓
        ┌─── Express API (:3000) ──────────┐
        │  Middleware (JWT / CORS / Logger) │
        │  Router → Zod Schema Validation   │
        │  Service → Business Logic (FEFO)  │
        └──────────┬────────────────────────┘
                   │
        ┌──────────┼──────────────┐
        v          v              v
    PostgreSQL   Redis      Pasarelas Pago
    (Prisma)   (Cache)   (Wompi/Stripe/MP)
```

---

## 📊 Estadísticas del Sistema

| Componente | Métrica |
|-----------|---------|
| **Frontend** | 40+ páginas · 510 tests · 0 TS errors |
| **Backend** | 72 endpoints · 19 módulos · 0 TS errors |
| **Tests** | 510/510 pasan (27 archivos) · 95.35% cobertura |
| **BD** | PostgreSQL 15 · Redis 7 · 17+ tablas |
| **Pasarelas** | 4 (Wompi, Stripe, MercadoPago, Efectivo) |
| **Dev Stack** | Docker Compose · pnpm workspace · React 19 · Vite 6 · Tailwind 4 |
