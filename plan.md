# Roadmap plan — Hacia producción real

> **📍 Mapa de rutas completo:** [docs/api-routes.md](docs/api-routes.md) — 72 endpoints REST, 40+ páginas frontend y matriz RBAC
> **🏗️ Arquitectura actual:** [docs/architecture.md](docs/architecture.md)
> **🤖 Guía operativa para agentes/devs:** [AGENTS.md](AGENTS.md)
> **📝 Bitácora viva:** [docs/worklog.md](docs/worklog.md)

---

## 🧭 Roadmap — Antigravity Farmacy hacia producción real

Este plan reemplaza el roadmap de MVP (Fases 0–9, ya completadas) y se enfoca en llevar **Antigravity Farmacy** de un sistema funcional y testeado a un producto **listo para producción real**, manteniendo el alcance **realista para un solo developer**.

### Estado base actual

El MVP ya cubre:

| Aspecto | Estado |
|---|---|
| Backend REST (19 módulos, 72 endpoints, 50+ rutas) | ✅ Completo |
| RBAC + JWT con refresh rotation + Redis | ✅ Completo |
| FEFO Inventory + alertas vencimiento | ✅ Completo |
| POS + Caja + tirilla térmica | ✅ Completo |
| Tienda B2C (catálogo, carrito, checkout) | ✅ Completo |
| Pasarelas de pago (Wompi, Stripe, MercadoPago, Efectivo) | ✅ Completo |
| Chatbot FarmaBot | ✅ Completo |
| Documentación técnica viva (`docs/`) | ✅ Presente |
| Script de arranque PowerShell (`run.ps1`) | ✅ Funcional |
| Tests (500+, 95%+ cobertura) | ✅ Pasando |
| Auditoría base + rate limiting | ✅ Implementado |

> Este plan **no rehace** lo ya implementado; lo **endurece, pule y operacionaliza**.

---

## 🎯 Definición de "listo para producción real"

La aplicación se considerará "lista para producción real" cuando cumpla simultáneamente estos criterios:

| Eje | Criterio mínimo |
|---|---|
| **UX** | Flujos críticos sin fricción: POS, checkout, alertas clínicas, estados de carga, vacíos, errores y responsive tablet |
| **Seguridad** | Auditoría visible, trazabilidad de cambios, hardening de headers/CORS, sanitización, secret scanning y validación E2E |
| **Interacción dinámica** | Eventos en vivo para POS/dashboard y cola asíncrona para tareas pesadas |
| **SEO / Performance / Deploy** | Metadata pública, lazy loading, compresión, Docker de producción, CI/CD, healthchecks y monitoreo operativo básico |
| **Documentación** | `plan.md`, `README.md`, `AGENTS.md`, `docs/` y `docs/worklog.md` alineados con cada fase completada |

---

## ⏱️ Estimación global

| Modalidad | Estimación |
|---|---|
| **1 developer full-time** | **8 a 11 semanas** |
| **1 developer part-time** | **12 a 16 semanas** |

> Orden recomendado: primero **Must have**, luego **Should have**, después **Could have**.
> Los **Won't have** quedan explícitamente fuera para evitar sobre-ingeniería.

---

## 📝 Regla de documentación para todas las fases

Cada fase completada debe actualizar **siempre** estos archivos:

| Archivo | Cuándo actualizar |
|---|---|
| **`plan.md`** | Marcar checkboxes completados; ajustar prioridad/estimaciones si cambia el alcance |
| **`docs/worklog.md`** | Registrar fecha, objetivo, archivos modificados, validaciones ejecutadas, riesgos/resoluciones |

Y **cuando aplique**:

| Archivo | Cuándo actualizar |
|---|---|
| **`docs/architecture.md`** | Cambios estructurales: WebSockets, SSE, BullMQ, SSR/pre-render, CDN, CI/CD, monitoreo, seguridad |
| **`docs/api-routes.md`** | Nuevos endpoints, webhooks, rutas admin, o canales realtime documentados (añadir subsección "Realtime channels / eventos") |
| **`AGENTS.md`** | Cambios en flujo operativo: Playwright, `run.ps1`, seguridad shell, secret scanning, deploy, monitoreo |
| **`README.md`** | Cambios en onboarding, despliegue, variables de entorno, build de producción o CI/CD |
| **`docs/adr/`** | Decisiones estructurales relevantes (Socket.IO vs WS nativo, SSE, BullMQ, SSR, política de webhooks, estrategia de deploy) |
| **`docs/spec/`** | Si se implementan cambios que specs abiertos documentan (ej: HEADLESS fix en `run.ps1` afecta spec existente) |

### Regla operativa por fase

1. ✅ Implementar
2. ✅ Validar (typecheck + tests + smoke)
3. ✅ Documentar (actualizar archivos según tabla)
4. ✅ Commit (mensaje descriptivo)
5. ✅ Push
---

## 📊 Priorización MoSCoW

### 🔴 Must have — imprescindible para producción real

| Eje | Item | Impacto | Esfuerzo | Estado |
|---|---|---|---|---|
| UX | Keyboard shortcuts POS (`F2` cobro, `F4` reset) | 🔴 Alto | 🟢 Bajo | ✅ |
| UX | Drug-Interaction Alerts en POS | 🔴 Alto | 🟡 Medio | ✅ |
| UX | B2C Health Profiles con auto-bloqueo/alerta por alérgenos | 🔴 Alto | 🟡 Medio | ✅ |
| UX | Skeleton loaders + estados vacíos + validación inline mejorada | 🔴 Alto | 🟡 Medio | ✅ |
| UX | Responsive tablet para POS | 🔴 Alto | 🟡 Medio | ✅ |
| Seguridad | Visor de auditoría de logs en panel admin | 🔴 Alto | 🟡 Medio | ⏳ Pendiente |
| Seguridad | Historial de cambios en precios y productos | 🔴 Alto | 🟡 Medio | ⏳ Pendiente |
| Seguridad | Fix de HEADLESS mode en `run.ps1` | 🟡 Medio | 🟢 Bajo | ✅ |
| Seguridad | Tests E2E con Playwright para flujos críticos | 🔴 Alto | 🟡 Medio | ✅ (29 tests) |
| Seguridad | Rate limiting más granular por rol/ruta | 🔴 Alto | 🟡 Medio | ⏳ Pendiente |
| Seguridad | Validación de CORS de producción | 🔴 Alto | 🟢 Bajo | ✅ |
| Seguridad | Audit de Helmet / security headers | 🔴 Alto | 🟢 Bajo | ✅ |
| Seguridad | Sanitización de inputs en chatbot | 🔴 Alto | 🟢 Bajo | ✅ |
| Seguridad | Secret scanning automation | 🔴 Alto | 🟢 Bajo | ✅ |
| Interacción dinámica | WebSockets para eventos POS críticos | 🔴 Alto | 🟡 Medio | ⏳ Pendiente |
| Interacción dinámica | SSE para dashboard en vivo | 🟡 Medio | 🟡 Medio | ⏳ Pendiente |
| Interacción dinámica | Bull/BullMQ para jobs asíncronos | 🔴 Alto | 🟡 Medio | ⏳ Pendiente |
| SEO / Deploy | Meta tags + Open Graph + sitemap + robots | 🔴 Alto | 🟢 Bajo | ✅ |
| SEO / Deploy | PWA + Service Worker + offline fallback | 🔴 Alto | 🟡 Medio | ✅ |
| SEO / Deploy | Lazy loading de rutas admin | 🟡 Medio | 🟢 Bajo | ✅ |
| SEO / Deploy | Docker multi-stage build para producción | 🔴 Alto | 🟡 Medio | ✅ |
| SEO / Deploy | Healthchecks en `docker-compose.yml` | 🔴 Alto | 🟢 Bajo | ✅ |
| SEO / Deploy | CI/CD con GitHub Actions | 🔴 Alto | 🟡 Medio | ⏳ Pendiente |

### 🟡 Should have — muy recomendable después del núcleo

| Eje | Item | Impacto | Esfuerzo | Estado |
|---|---|---|---|---|
| UX | Transiciones suaves y polish visual consistente | 🟡 Medio | 🟢 Bajo | ✅ |
| UX | Modo oscuro | 🟡 Medio | 🟡 Medio | ✅ |
| Interacción dinámica | WebSocket para chatbot en vivo | 🟡 Medio | 🟡 Medio | ✅ |
| Interacción dinámica | Notificaciones push para alertas de inventario | 🟡 Medio | 🟡 Medio | ⏳ Pendiente |
| SEO / Deploy | Pre-render de landing pública o SSR/SSG parcial | 🔴 Alto | 🟡 Medio | ⏳ Pendiente (futuro) |
| SEO / Deploy | Compresión Brotli | 🟡 Medio | 🟢 Bajo | ✅ |
| SEO / Deploy | CDN para assets estáticos | 🟡 Medio | 🟡 Medio | ✅ |
| SEO / Deploy | Monitoreo operativo básico con rutina de revisión de logs | 🔴 Alto | 🟢 Bajo | ✅ |

### 🟢 Could have — mejora valiosa, no bloqueante

| Eje | Item | Impacto | Esfuerzo | Estado |
|---|---|---|---|---|
| UX | Modo oscuro extendido a todo admin + tienda | 🟡 Medio | 🟡 Medio | ✅ |
| Interacción dinámica | Push notifications multi-dispositivo | 🟡 Medio | 🔴 Alto | ⏳ Pendiente |
| SEO / Deploy | SSR más amplio para catálogo público | 🟡 Medio | 🔴 Alto | ⏳ Pendiente |
| Seguridad | Allowlist IP por proveedor webhook | 🟡 Medio | 🟡 Medio | ⏳ Pendiente |
| Seguridad | Alertas automáticas de secretos expuestos en PR | 🟡 Medio | 🟢 Bajo | ⏳ Pendiente |

### ⚪ Won't have (por ahora)

| Item | Motivo |
|---|---|
| SSR completo de toda la app (incluyendo admin) | Alto costo para 1 developer, poco retorno inmediato |
| Microservicios | Complejidad innecesaria para el tamaño actual |
| App móvil nativa | Fuera del objetivo actual |
| Observabilidad enterprise (SIEM/APM avanzado) | Sobredimensionado para esta etapa |
| Reescritura total del chatbot | No aporta tanto valor como endurecer el flujo existente |

---

## 🗺️ Fases de ejecución

### Fase 10 — Baseline de producción, documentación y hardening inicial

**Estimación:** 3 a 4 días
**Prioridad:** 🔴 Must have
**Estado:** ✅ COMPLETADA (2026-05-26)

#### Objetivo
Cerrar huecos operativos y de seguridad de bajo esfuerzo con alto impacto antes de entrar en features visibles.

#### Tareas
- [x] Revisar `README.md`, `AGENTS.md`, `docs/architecture.md`, `docs/api-routes.md` y `docs/worklog.md` para alinear el estado real del proyecto
- [x] Corregir **HEADLESS mode** en `run.ps1` (monitoreo de Jobs en lugar de procesos)
- [x] Auditar configuración de **CORS** para producción real
- [x] Auditar **Helmet / security headers**
- [x] Implementar **sanitización de inputs** en chatbot
- [x] Configurar **secret scanning automation** (Gitleaks / GitHub secret scanning / secretlint)
- [x] Documentar el flujo de hardening y validación operativa en `AGENTS.md`

#### Validación mínima
- [x] `run.ps1` funciona en modo normal y headless
- [x] Verificación manual de headers HTTP
- [x] Pruebas unitarias / integración del chatbot sanitizado
- [x] Secret scanning corriendo en local o CI

#### Documentación a actualizar
- [x] `AGENTS.md` — flujo de hardening, HEADLESS fix, secret scanning
- [x] `README.md` — si cambian variables de entorno o headers
- [x] `docs/architecture.md` — si se formalizan cambios de seguridad
- [x] `docs/worklog.md` — entrada de cierre
---

### Fase 11 — UX core del POS y formularios admin

**Estimación:** 1 semana
**Prioridad:** 🔴 Must have
**Estado:** ✅ COMPLETADA (2026-05-26)

#### Objetivo
Reducir fricción operativa en caja y mejorar la calidad percibida del panel administrativo.

#### Tareas
- [x] Implementar **keyboard shortcuts en POS**
  - [x] `F2` → ir a cobro / confirmar flujo de pago
  - [x] `F4` → resetear venta actual
  - [x] Definir guardas para no disparar shortcuts dentro de inputs sensibles
- [x] Mejorar **validación inline** en formularios admin
  - [x] Mensajes por campo
  - [x] Estados `dirty`/`touched`
  - [x] Scroll/focus al primer error
- [x] Agregar **skeleton loaders**
  - [x] Catálogo
  - [x] Dashboard
  - [x] Tablas admin
  - [x] Detalle de producto
- [x] Diseñar **estados vacíos informativos**
  - [x] Sin resultados
  - [x] Sin alertas
  - [x] Sin ventas / sin compras / sin favoritos
- [x] Agregar **transiciones suaves** donde aporten claridad
- [x] Mejorar **responsive design para tablets en POS**

#### Validación mínima
- [x] Smoke test manual del POS con teclado
- [x] Tests de componentes / interacción
- [x] Revisión visual en desktop + tablet
- [x] Sin regresiones de accesibilidad básicas

#### Documentación a actualizar
- [x] `docs/architecture.md` — si cambia el patrón de UI/estado
- [x] `AGENTS.md` — si cambia forma de probar UI
- [x] `docs/worklog.md`

---

### Fase 12 — UX clínico y seguridad del paciente

**Estimación:** 1 a 1.5 semanas
**Prioridad:** 🔴 Must have
**Estado:** ✅ COMPLETADA (2026-05-26)

#### Objetivo
Convertir el sistema en una herramienta más segura para la operación farmacéutica real.
**Nota:** El chatbot (Fase 8) ya detecta interacciones vía `POST /chatbot/interacciones`. Esta fase agrega alertas **POS-side** que complementan (no reemplazan) esa funcionalidad.

#### Tareas
- [x] Implementar **Drug-Interaction Alerts en POS** (POS-side, complementa chatbot existente)
  - [x] Comparar principios activos de los productos del carrito
  - [x] Mostrar severidad: alta / media / informativa
  - [x] Permitir continuar solo con confirmación explícita si aplica
  - [ ] Registrar evento de advertencia en auditoría si corresponde
- [x] Implementar **B2C Health Profiles**
  - [x] Perfil de alérgenos del cliente
  - [x] Auto-bloqueo o advertencia de compra
  - [x] Mensajes claros sobre por qué se bloquea/advierte
- [x] Mejorar ficha B2C con feedback clínico contextual si el producto contiene alérgenos/advertencias
- [x] Definir si el bloqueo es duro o suave según riesgo/regla del negocio

#### Validación mínima
- [x] Tests unitarios de reglas de interacción
- [x] Tests de integración para carrito POS
- [x] Tests de integración para checkout B2C con perfil alérgeno
- [x] Casos borde documentados

---

### Fase 13 — SEO Técnico + Performance

**Estimación:** 1 a 1.5 semanas
**Prioridad:** 🔴 Must have
**Estado:** ✅ COMPLETADA (2026-05-27)

> **Nota:** Esta fase reemplazó a la original "Auditoría visible y trazabilidad" (movida a fase posterior). Ver worklog para detalle.

#### Objetivo
Hacer que la parte pública cargue mejor, se indexe mejor y comunique mejor en buscadores/redes.

#### Tareas
- [x] Configurar **meta tags** por página pública (SEOHead component)
- [x] Configurar **Open Graph / Twitter cards**
- [x] Generar `sitemap.xml`
- [x] Generar `robots.txt`
- [x] Implementar **lazy loading** de rutas admin
- [x] Implementar **PWA + manifest + service worker**
  - [x] Service Worker con Workbox (generateSW)
  - [x] Runtime caching para API productos, categorías, sucursales
  - [x] Offline fallback (`/offline.html`)
  - [x] Manifest con íconos SVG
  - [x] PWA install banner + analytics
- [x] Optimización de bundles (manualChunks: vendor-core, vendor-charts, vendor-query, etc.)

#### Validación mínima
- [x] Build de producción correcto
- [x] Verificación de metadatos en HTML final
- [x] Workbox generateSW: 85 entries precached (2.4 MB)
- [x] Confirmar split de bundles admin

---

### Fase 14 — Testing E2E con Playwright

**Estimación:** 1 semana
**Prioridad:** 🔴 Must have
**Estado:** ✅ COMPLETADA (2026-05-27)

#### Objetivo
Implementar pruebas end-to-end con Playwright que validen los flujos críticos.

#### Tareas
- [x] Configurar Playwright (proyectos chromium + chromium-mobile)
- [x] Fixtures de autenticación (admin, cliente vía API)
- [x] Tests de navegación pública (5 tests)
- [x] Tests de login admin (4 tests)
- [x] Tests de flujo POS (4 tests)
- [x] Tests de flujo B2C (5 tests)
- [x] Tests de flujo completo (11 tests — checkout, carrito, catálogo, etc.)
- [x] Tests de Google OAuth (18 tests — botón, callback, protección rutas, persistencia)
- [x] Agregar scripts E2E en package.json raíz

#### Validación mínima
- [x] 29+ tests E2E pasando
- [x] TypeScript frontend: 0 errores

---

### Fase 15 — Docker producción + Configuración deploy

**Estimación:** 3 a 4 días
**Prioridad:** 🔴 Must have
**Estado:** ✅ COMPLETADA (2026-05-27)

#### Objetivo
Asegurar que el producto se pueda desplegar con Docker de producción.

#### Tareas
- [x] Crear **Docker multi-stage build** backend (tsc → node:22-alpine)
- [x] Crear **Docker multi-stage build** frontend (Vite → Nginx:1.27-alpine)
- [x] Crear `.env.production.example` con placeholders seguros
- [x] Agregar **healthchecks** en `docker-compose.yml`
- [x] Nginx config: SPA routing, proxy `/api/` a backend, gzip, cache assets
- [x] Redis con `requirepass` en producción
- [x] Backend bind `127.0.0.1:3000` (solo localhost)
- [x] Prisma postgenerate script para pnpm compatibility

#### Validación mínima
- [x] TypeScript backend: 0 errores
- [x] TypeScript frontend: 0 errores
- [x] Vitest: 520/520 tests

---

### Fase 16 — Auditoría visible y trazabilidad de negocio ✅

**Estimación:** 1 semana
**Prioridad:** 🔴 Must have
**Estado:** ✅ COMPLETADA (2026-05-27)

#### Objetivo
Hacer auditable lo que hoy ya existe parcialmente a nivel técnico, pero no con visibilidad operativa suficiente.

#### Tareas
- [x] Crear **visor de auditoría de logs** en panel admin
  - [x] Filtros por fecha, usuario, módulo, acción, severidad
  - [x] Vista detalle
  - [x] Paginación y búsqueda
- [x] Implementar **historial de cambios en precios y productos**
  - [x] Quién cambió
  - [x] Qué cambió (antes / después)
  - [x] Cuándo cambió
- [x] Ajustar **rate limiting granular por rol**
  - [x] Más estricto en auth, chatbot y rutas públicas
  - [x] Más flexible para usuarios internos autenticados según rol
- [x] Endurecer seguridad de webhooks
  - [x] Firma HMAC, anti-replay por timestamp, idempotencia, validación de origen

---

### Fase 17 — Tiempo real y jobs asíncronos ✅

**Estimación:** 1.5 a 2 semanas
**Prioridad:** 🔴 Must have / 🟡 Should have
**Estado:** ✅ COMPLETADA (2026-05-27)

#### Objetivo
Eliminar polling innecesario y mover tareas pesadas fuera del request-response clásico mediante EventBus, SSE, WebSockets y BullMQ.

#### Tareas
- [x] Implementar **WebSockets para POS**
  - [x] Notificar apertura/cierre de caja a otros empleados
  - [x] Notificar stock crítico en vivo
  - [x] Sincronizar eventos relevantes entre sesiones
- [x] Implementar **SSE para dashboard en vivo**
  - [x] Métricas operativas
  - [x] Alertas recientes
  - [x] Estado de caja / stock crítico
- [x] Integrar **Bull/BullMQ** sobre Redis ya existente
  - [x] Exportación CSV asíncrona
  - [x] Envío masivo de emails (queue definida, worker futuro)
  - [x] Reintentos controlados
  - [x] Trazabilidad de jobs
- [x] Diseñar contrato de eventos y política de reconexión

#### Tareas opcionales de la fase
- [ ] WebSocket para chatbot en vivo (pendiente)
- [ ] Notificaciones push para alertas de inventario (pendiente)

---

### Fase 18 — CI/CD, Deploy y monitoreo ✅

**Estimación:** 1 semana
**Prioridad:** 🔴 Must have
**Estado:** ✅ COMPLETADA (2026-05-28)

#### Objetivo
Automatizar la validación y despliegue, y definir rutina operativa de monitoreo.

#### Tareas
- [x] Configurar **GitHub Actions** (3 workflows)
  - [x] CI: typecheck + tests + build (back + front + prisma)
  - [x] Secret scanning con Gitleaks en PR y push a main
  - [x] E2E smoke con Playwright (manual o con label `e2e-smoke`)
- [x] Definir **monitoreo básico** en `docs/monitoreo.md`
  - [x] Qué logs revisar y dónde
  - [x] Frecuencia de revisión escalonada
  - [x] Errores críticos vs no críticos
  - [x] Alertas que requieren acción manual
- [x] Documentar checklist de deploy completo (antes/durante/después/post-mortem)

---

### Fase 19 — Polish extendido y mejoras opcionales ✅

**Estimación:** 4 a 6 días
**Prioridad:** 🟡 Should have / 🟢 Could have
**Estado:** ✅ COMPLETADA (2026-05-28)

#### Objetivo
Cerrar detalles no bloqueantes que elevan la percepción de calidad.

#### Tareas
- [x] Implementar **modo oscuro** (parcial — mayormente cubierto)
- [x] **Compresión Brotli** en Vite build + backend Express
- [x] **CDN base path** configurable en Vite
- [x] **WebSocket chatbot** — conexión en vivo con el backend
- [x] **Transiciones y consistencia visual** en páginas admin
- [x] **Limpieza:** scripts test muertos, spec obsoleto, artefactos E2E
- [ ] Pre-render de landing pública o SSR/SSG parcial (futuro)
- [ ] Push notifications multi-dispositivo (futuro)

---

## ✅ Checklist transversal por eje

### 1) UX (polish)
- [x] Keyboard shortcuts en POS (`F2`, `F4`)
- [x] Drug-Interaction Alerts en POS
- [x] B2C Health Profiles
- [x] Skeleton loaders
- [x] Transiciones suaves
- [x] Estados vacíos informativos
- [x] Validación inline mejorada
- [x] Responsive tablet para POS
- [x] Modo oscuro

### 2) Seguridad
- [x] Visor de auditoría en panel admin
- [x] Historial de cambios en precios y productos
- [x] Fix HEADLESS mode en `run.ps1`
- [x] Tests E2E con Playwright
- [x] Rate limiting granular por rol
- [x] CORS de producción validado
- [x] Audit de security headers con Helmet
- [x] Seguridad de webhooks con firmas HMAC + anti-replay + idempotencia
- [x] Sanitización de inputs en chatbot
- [x] Secret scanning automation (`.gitleaks.toml`)

### 3) Interacción dinámica
- [x] WebSockets para POS en tiempo real
- [x] SSE para dashboard en vivo
- [x] WebSocket para chatbot en vivo
- [ ] Push notifications para inventario
- [x] Bull/BullMQ para jobs asíncronos

### 4) SEO / Performance / Deploy
- [x] Meta tags
- [x] Open Graph / Twitter Cards
- [x] `sitemap.xml` + `robots.txt`
- [ ] Pre-render o SSR/SSG parcial público
- [x] Lazy loading de rutas admin
- [x] Brotli
- [x] CDN de assets estáticos
- [x] Docker multi-stage de producción
- [x] Healthchecks en compose
- [x] GitHub Actions (CI/CD)
- [x] PWA + Service Worker + offline fallback
- [x] Monitoreo básico documentado

---

## 📐 Orden recomendado de ejecución para 1 developer

| Orden | Fase | Razón |
|---|---|---|
| 1 | **Fase 10** — Baseline + hardening | ✅ COMPLETADA |
| 2 | **Fase 11** — UX core POS + admin | ✅ COMPLETADA |
| 3 | **Fase 12** — UX clínico (interacciones, health profiles) | ✅ COMPLETADA |
| 4 | **Fase 13** — SEO + Performance + PWA | ✅ COMPLETADA |
| 5 | **Fase 14** — Testing E2E con Playwright | ✅ COMPLETADA |
| 6 | **Fase 15** — Docker producción + deploy | ✅ COMPLETADA |
| 7 | **Fase 16** — Auditoría + trazabilidad | ✅ COMPLETADA |
| 8 | **Fase 17** — Tiempo real + jobs asíncronos | ✅ COMPLETADA |
| 9 | **Fase 18** — CI/CD + monitoreo | ✅ COMPLETADA |
| 10 | **Fase 19** — Polish extendido | ✅ COMPLETADA |

---

## 🚫 Límites de alcance para no frenar la salida a producción

Para mantener este roadmap ejecutable por una sola persona:

- **No** hacer SSR completo del panel admin
- **No** dividir el backend en microservicios
- **No** introducir infraestructura enterprise avanzada antes de validar uso real
- **No** reescribir módulos ya estables solo por preferencia técnica
- **Sí** priorizar hardening, DX, seguridad clínica, deploy y observabilidad básica

---

## 📋 Criterio final de cierre del roadmap

Se considerará esta etapa terminada cuando:

- [ ] Todos los **Must have** estén implementados
- [x] Los flujos críticos tengan cobertura **E2E**
- [x] Exista pipeline **CI/CD** funcional
- [x] El despliegue en Docker de producción sea reproducible
- [x] Exista monitoreo básico y rutina documentada
- [x] La documentación (`plan.md`, `README.md`, `AGENTS.md`, `docs/architecture.md`, `docs/api-routes.md`, `docs/worklog.md`) esté alineada
- [ ] El producto pueda operar con confianza razonable en entorno real sin depender de conocimiento tácito
