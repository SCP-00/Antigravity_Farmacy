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

| Eje | Item | Impacto | Esfuerzo |
|---|---|---|---|
| UX | Keyboard shortcuts POS (`F2` cobro, `F4` reset) | 🔴 Alto | 🟢 Bajo |
| UX | Drug-Interaction Alerts en POS | 🔴 Alto | 🟡 Medio |
| UX | B2C Health Profiles con auto-bloqueo/alerta por alérgenos | 🔴 Alto | 🟡 Medio |
| UX | Skeleton loaders + estados vacíos + validación inline mejorada | 🔴 Alto | 🟡 Medio |
| UX | Responsive tablet para POS | 🔴 Alto | 🟡 Medio |
| Seguridad | Visor de auditoría de logs en panel admin | 🔴 Alto | 🟡 Medio |
| Seguridad | Historial de cambios en precios y productos | 🔴 Alto | 🟡 Medio |
| Seguridad | Fix de HEADLESS mode en `run.ps1` | 🟡 Medio | 🟢 Bajo |
| Seguridad | Tests E2E con Playwright para flujos críticos | 🔴 Alto | 🟡 Medio |
| Seguridad | Rate limiting más granular por rol/ruta | 🔴 Alto | 🟡 Medio |
| Seguridad | Validación de CORS de producción | 🔴 Alto | 🟢 Bajo |
| Seguridad | Audit de Helmet / security headers | 🔴 Alto | 🟢 Bajo |
| Seguridad | Sanitización de inputs en chatbot | 🔴 Alto | 🟢 Bajo |
| Seguridad | Secret scanning automation | 🔴 Alto | 🟢 Bajo |
| Interacción dinámica | WebSockets para eventos POS críticos | 🔴 Alto | 🟡 Medio |
| Interacción dinámica | SSE para dashboard en vivo | 🟡 Medio | 🟡 Medio |
| Interacción dinámica | Bull/BullMQ para jobs asíncronos | 🔴 Alto | 🟡 Medio |
| SEO / Deploy | Meta tags + Open Graph + sitemap + robots | 🔴 Alto | 🟢 Bajo |
| SEO / Deploy | Lazy loading de rutas admin | 🟡 Medio | 🟢 Bajo |
| SEO / Deploy | Docker multi-stage build para producción | 🔴 Alto | 🟡 Medio |
| SEO / Deploy | Healthchecks en `docker-compose.yml` | 🔴 Alto | 🟢 Bajo |
| SEO / Deploy | CI/CD con GitHub Actions | 🔴 Alto | 🟡 Medio |

### 🟡 Should have — muy recomendable después del núcleo

| Eje | Item | Impacto | Esfuerzo |
|---|---|---|---|
| UX | Transiciones suaves y polish visual consistente | 🟡 Medio | 🟢 Bajo |
| UX | Modo oscuro | 🟡 Medio | 🟡 Medio |
| Interacción dinámica | WebSocket para chatbot en vivo | 🟡 Medio | 🟡 Medio |
| Interacción dinámica | Notificaciones push para alertas de inventario | 🟡 Medio | 🟡 Medio |
| SEO / Deploy | Pre-render de landing pública o SSR/SSG parcial | 🔴 Alto | 🟡 Medio |
| SEO / Deploy | Compresión Brotli | 🟡 Medio | 🟢 Bajo |
| SEO / Deploy | CDN para assets estáticos | 🟡 Medio | 🟡 Medio |
| SEO / Deploy | Monitoreo operativo básico con rutina de revisión de logs | 🔴 Alto | 🟢 Bajo |

### 🟢 Could have — mejora valiosa, no bloqueante

| Eje | Item | Impacto | Esfuerzo |
|---|---|---|---|
| UX | Modo oscuro extendido a todo admin + tienda | 🟡 Medio | 🟡 Medio |
| Interacción dinámica | Push notifications multi-dispositivo | 🟡 Medio | 🔴 Alto |
| SEO / Deploy | SSR más amplio para catálogo público | 🟡 Medio | 🔴 Alto |
| Seguridad | Allowlist IP por proveedor webhook | 🟡 Medio | 🟡 Medio |
| Seguridad | Alertas automáticas de secretos expuestos en PR | 🟡 Medio | 🟢 Bajo |

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

#### Objetivo
Cerrar huecos operativos y de seguridad de bajo esfuerzo con alto impacto antes de entrar en features visibles.

#### Tareas
- [ ] Revisar `README.md`, `AGENTS.md`, `docs/architecture.md`, `docs/api-routes.md` y `docs/worklog.md` para alinear el estado real del proyecto
- [ ] Corregir **HEADLESS mode** en `run.ps1` (monitoreo de Jobs en lugar de procesos)
- [ ] Auditar configuración de **CORS** para producción real
- [ ] Auditar **Helmet / security headers**
- [ ] Implementar **sanitización de inputs** en chatbot
- [ ] Configurar **secret scanning automation** (Gitleaks / GitHub secret scanning / secretlint)
- [ ] Documentar el flujo de hardening y validación operativa en `AGENTS.md`

#### Validación mínima
- [ ] `run.ps1` funciona en modo normal y headless
- [ ] Verificación manual de headers HTTP
- [ ] Pruebas unitarias / integración del chatbot sanitizado
- [ ] Secret scanning corriendo en local o CI

#### Documentación a actualizar
- [ ] `AGENTS.md` — flujo de hardening, HEADLESS fix, secret scanning
- [ ] `README.md` — si cambian variables de entorno o headers
- [ ] `docs/architecture.md` — si se formalizan cambios de seguridad
- [ ] `docs/worklog.md` — entrada de cierre
---

### Fase 11 — UX core del POS y formularios admin

**Estimación:** 1 semana
**Prioridad:** 🔴 Must have

#### Objetivo
Reducir fricción operativa en caja y mejorar la calidad percibida del panel administrativo.

#### Tareas
- [ ] Implementar **keyboard shortcuts en POS**
  - [ ] `F2` → ir a cobro / confirmar flujo de pago
  - [ ] `F4` → resetear venta actual
  - [ ] Definir guardas para no disparar shortcuts dentro de inputs sensibles
- [ ] Mejorar **validación inline** en formularios admin
  - [ ] Mensajes por campo
  - [ ] Estados `dirty`/`touched`
  - [ ] Scroll/focus al primer error
- [ ] Agregar **skeleton loaders**
  - [ ] Catálogo
  - [ ] Dashboard
  - [ ] Tablas admin
  - [ ] Detalle de producto
- [ ] Diseñar **estados vacíos informativos**
  - [ ] Sin resultados
  - [ ] Sin alertas
  - [ ] Sin ventas / sin compras / sin favoritos
- [ ] Agregar **transiciones suaves** donde aporten claridad
- [ ] Mejorar **responsive design para tablets en POS**

#### Validación mínima
- [ ] Smoke test manual del POS con teclado
- [ ] Tests de componentes / interacción
- [ ] Revisión visual en desktop + tablet
- [ ] Sin regresiones de accesibilidad básicas

#### Documentación a actualizar
- [ ] `docs/architecture.md` — si cambia el patrón de UI/estado
- [ ] `AGENTS.md` — si cambia forma de probar UI
- [ ] `docs/worklog.md`

---

### Fase 12 — UX clínico y seguridad del paciente

**Estimación:** 1 a 1.5 semanas
**Prioridad:** 🔴 Must have

#### Objetivo
Convertir el sistema en una herramienta más segura para la operación farmacéutica real.
**Nota:** El chatbot (Fase 8) ya detecta interacciones vía `POST /chatbot/interacciones`. Esta fase agrega alertas **POS-side** que complementan (no reemplazan) esa funcionalidad.

#### Tareas
- [ ] Implementar **Drug-Interaction Alerts en POS** (POS-side, complementa chatbot existente)
  - [ ] Comparar principios activos de los productos del carrito
  - [ ] Mostrar severidad: alta / media / informativa
  - [ ] Permitir continuar solo con confirmación explícita si aplica
  - [ ] Registrar evento de advertencia en auditoría si corresponde
- [ ] Implementar **B2C Health Profiles**
  - [ ] Perfil de alérgenos del cliente
  - [ ] Auto-bloqueo o advertencia de compra
  - [ ] Mensajes claros sobre por qué se bloquea/advierte
- [ ] Mejorar ficha B2C con feedback clínico contextual si el producto contiene alérgenos/advertencias
- [ ] Definir si el bloqueo es duro o suave según riesgo/regla del negocio

#### Validación mínima
- [ ] Tests unitarios de reglas de interacción
- [ ] Tests de integración para carrito POS
- [ ] Tests de integración para checkout B2C con perfil alérgeno
- [ ] Casos borde documentados

#### Documentación a actualizar
- [ ] `docs/architecture.md`
- [ ] `docs/api-routes.md` — si hay endpoints nuevos de perfil/alérgenos/interacciones
- [ ] `README.md` — si cambia el flujo funcional público
- [ ] `docs/worklog.md`
- [ ] `docs/adr/` — si se formaliza el motor de interacciones

---

### Fase 13 — Auditoría visible y trazabilidad de negocio

**Estimación:** 1 semana
**Prioridad:** 🔴 Must have

#### Objetivo
Hacer auditable lo que hoy ya existe parcialmente a nivel técnico, pero no con visibilidad operativa suficiente.

#### Tareas
- [ ] Crear **visor de auditoría de logs** en panel admin
  - [ ] Filtros por fecha, usuario, módulo, acción, severidad
  - [ ] Vista detalle
  - [ ] Paginación y búsqueda
- [ ] Implementar **historial de cambios en precios y productos**
  - [ ] Quién cambió
  - [ ] Qué cambió (antes / después)
  - [ ] Cuándo cambió
- [ ] Ajustar **rate limiting granular por rol**
  - [ ] Más estricto en auth, chatbot y rutas públicas
  - [ ] Más flexible para usuarios internos autenticados según rol
- [ ] Endurecer seguridad de webhooks
  - [ ] No CSRF clásico de navegador (no aplica a server-to-server)
  - [ ] Sí: firma HMAC, anti-replay por timestamp, idempotencia, validación de origen cuando aplique

#### Validación mínima
- [ ] Tests backend del historial y auditoría
- [ ] Verificación manual desde panel admin
- [ ] Tests de rate limiting por perfil
- [ ] Tests de webhook signature / replay

#### Documentación a actualizar
- [ ] `docs/architecture.md`
- [ ] `docs/api-routes.md`
- [ ] `README.md` — si se agregan env vars o headers
- [ ] `docs/worklog.md`
- [ ] `docs/adr/` — si se modela una tabla/event store específico
---

### Fase 14 — Tiempo real y jobs asíncronos

**Estimación:** 1.5 a 2 semanas
**Prioridad:** 🔴 Must have / 🟡 Should have

#### Objetivo
Eliminar polling innecesario y mover tareas pesadas fuera del request-response clásico.

#### Tareas
- [ ] Implementar **WebSockets para POS**
  - [ ] Notificar apertura/cierre de caja a otros empleados
  - [ ] Notificar stock crítico en vivo
  - [ ] Sincronizar eventos relevantes entre sesiones
- [ ] Implementar **SSE para dashboard en vivo**
  - [ ] Métricas operativas
  - [ ] Alertas recientes
  - [ ] Estado de caja / stock crítico
- [ ] Integrar **Bull/BullMQ** sobre Redis ya existente
  - [ ] Exportación CSV asíncrona
  - [ ] Envío masivo de emails
  - [ ] Reintentos controlados
  - [ ] Trazabilidad de jobs
- [ ] Diseñar contrato de eventos y política de reconexión

#### Tareas opcionales de la fase
- [ ] WebSocket para chatbot en vivo
- [ ] Notificaciones push para alertas de inventario

#### Validación mínima
- [ ] Pruebas manuales con dos sesiones simultáneas
- [ ] Tests de integración para jobs en cola
- [ ] Validación de reconexión y errores
- [ ] Sin degradación visible del servidor HTTP principal

#### Documentación a actualizar
- [ ] `docs/architecture.md`
- [ ] `docs/api-routes.md` — añadir sección de canales/eventos realtime
- [ ] `AGENTS.md` — cómo probar eventos realtime
- [ ] `docs/worklog.md`
- [ ] `docs/adr/` — para WebSocket/SSE/BullMQ

---

### Fase 15 — SEO, performance y experiencia pública

**Estimación:** 1 a 1.5 semanas
**Prioridad:** 🔴 Must have / 🟡 Should have

#### Objetivo
Hacer que la parte pública cargue mejor, se indexe mejor y comunique mejor en buscadores/redes.

#### Tareas
- [ ] Configurar **meta tags** por página pública
- [ ] Configurar **Open Graph / Twitter cards**
- [ ] Generar `sitemap.xml`
- [ ] Generar `robots.txt`
- [ ] Implementar **lazy loading** de rutas admin
- [ ] Implementar **pre-render de landing pública**
  - [ ] O SSR/SSG parcial si el costo sigue siendo razonable
- [ ] Activar **compresión Brotli**
- [ ] Evaluar y configurar **CDN para assets estáticos**
- [ ] Mejorar performance del catálogo y landing
- [ ] Definir umbrales mínimos de Lighthouse para páginas públicas

#### Validación mínima
- [ ] Build de producción correcto
- [ ] Verificación de metadatos en HTML final
- [ ] Lighthouse en landing / catálogo
- [ ] Verificación de sitemap y robots
- [ ] Confirmar split de bundles admin

#### Documentación a actualizar
- [ ] `README.md` — build/deploy y SEO técnico
- [ ] `docs/architecture.md`
- [ ] `docs/worklog.md`
- [ ] `docs/adr/` — si se adopta estrategia formal SSR/pre-render

---

### Fase 16 — Deploy, CI/CD, E2E y operación mínima

**Estimación:** 1 a 1.5 semanas
**Prioridad:** 🔴 Must have

#### Objetivo
Asegurar que el producto se pueda desplegar, validar y operar con una rutina repetible.

#### Tareas
- [ ] Crear **Docker multi-stage build** para producción
- [ ] Agregar **healthchecks** en `docker-compose.yml`
- [ ] Configurar **GitHub Actions**
  - [ ] Install
  - [ ] Typecheck
  - [ ] Tests backend/frontend
  - [ ] Build
  - [ ] Secret scanning
  - [ ] E2E smoke si el entorno lo permite
- [ ] Crear **tests E2E con Playwright**
  - [ ] Login admin
  - [ ] Abrir caja
  - [ ] Flujo POS básico
  - [ ] Navegación pública
  - [ ] Checkout / confirmación
  - [ ] Smoke del dashboard
- [ ] Definir **monitoreo básico**
  - [ ] Qué logs revisar
  - [ ] Cada cuánto revisarlos
  - [ ] Qué errores son críticos
  - [ ] Qué alertas requieren acción manual
- [ ] Documentar checklist de deploy

#### Rutina mínima de monitoreo sugerida

| Periodo | Acción |
|---|---|
| **Primera semana post-deploy** | Revisar logs **2 veces al día** |
| **Semanas 2 a 4** | Revisar logs **1 vez al día** |
| **Luego de estabilización** | Revisar logs **3 veces por semana** |
| **Tras cada release** | Revisar logs y healthchecks durante las primeras **2 horas** |

#### Validación mínima
- [ ] Pipeline CI verde
- [ ] Imagen Docker de producción construye correctamente
- [ ] Healthchecks responden bien
- [ ] E2E smoke estable
- [ ] Checklist de deploy reproducible

#### Documentación a actualizar
- [ ] `README.md`
- [ ] `AGENTS.md`
- [ ] `docs/architecture.md`
- [ ] `docs/worklog.md`

---

### Fase 17 — Polish extendido y mejoras opcionales

**Estimación:** 4 a 6 días
**Prioridad:** 🟡 Should have / 🟢 Could have

#### Objetivo
Cerrar detalles no bloqueantes que elevan la percepción de calidad.

#### Tareas
- [ ] Implementar **modo oscuro**
- [ ] Extender transiciones y consistencia visual
- [ ] Mejorar aún más los estados vacíos e informativos
- [ ] Completar WebSocket del chatbot si quedó pendiente
- [ ] Completar push notifications si quedó pendiente
- [ ] Ajustar performance visual fina tras feedback real

#### Validación mínima
- [ ] Revisión visual completa
- [ ] Smoke manual cross-device
- [ ] Sin regresiones de accesibilidad evidentes

#### Documentación a actualizar
- [ ] `docs/worklog.md`
- [ ] `README.md` — si cambia experiencia pública
- [ ] `docs/architecture.md` — si cambia comportamiento estructural
---

## ✅ Checklist transversal por eje

### 1) UX (polish)
- [ ] Keyboard shortcuts en POS (`F2`, `F4`)
- [ ] Drug-Interaction Alerts en POS
- [ ] B2C Health Profiles
- [ ] Skeleton loaders
- [ ] Transiciones suaves
- [ ] Estados vacíos informativos
- [ ] Validación inline mejorada
- [ ] Responsive tablet para POS
- [ ] Modo oscuro

### 2) Seguridad
- [ ] Visor de auditoría en panel admin
- [ ] Historial de cambios en precios y productos
- [ ] Fix HEADLESS mode en `run.ps1`
- [ ] Tests E2E con Playwright
- [ ] Rate limiting granular por rol
- [ ] CORS de producción validado
- [ ] Audit de security headers con Helmet
- [ ] Seguridad de webhooks con firmas / anti-replay / idempotencia
- [ ] Sanitización de inputs en chatbot
- [ ] Secret scanning automation

### 3) Interacción dinámica
- [ ] WebSockets para POS en tiempo real
- [ ] SSE para dashboard en vivo
- [ ] WebSocket para chatbot en vivo
- [ ] Push notifications para inventario
- [ ] Bull/BullMQ para jobs asíncronos

### 4) SEO / Performance / Deploy
- [ ] Meta tags
- [ ] Open Graph
- [ ] `sitemap.xml`
- [ ] `robots.txt`
- [ ] Pre-render o SSR/SSG parcial público
- [ ] Lazy loading de rutas admin
- [ ] Brotli
- [ ] CDN de assets estáticos
- [ ] Docker multi-stage de producción
- [ ] Healthchecks en compose
- [ ] GitHub Actions
- [ ] Monitoreo básico documentado

---

## 📐 Orden recomendado de ejecución para 1 developer

| Orden | Fase | Razón |
|---|---|---|
| 1 | **Fase 10** — Baseline + hardening | Alto impacto, bajo esfuerzo, reduce riesgos base |
| 2 | **Fase 11** — UX core POS + admin | Mejora inmediata del POS y admin |
| 3 | **Fase 12** — UX clínico (interacciones, health profiles) | Seguridad clínica y valor real de negocio |
| 4 | **Fase 13** — Auditoría + trazabilidad | Auditoría y trazabilidad para operación real |
| 5 | **Fase 14** — Tiempo real + jobs asíncronos | Sin bloquear el core, pero necesario para UX |
| 6 | **Fase 15** — SEO + performance público | Indexación y performance pública |
| 7 | **Fase 16** — Deploy + CI/CD + E2E | Despliegue, CI/CD, E2E y operación |
| 8 | **Fase 17** — Polish extendido | Detalles no bloqueantes |

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
- [ ] Los flujos críticos tengan cobertura **E2E**
- [ ] Exista pipeline **CI/CD** funcional
- [ ] El despliegue en Docker de producción sea reproducible
- [ ] Exista monitoreo básico y rutina documentada
- [ ] La documentación (`plan.md`, `README.md`, `AGENTS.md`, `docs/architecture.md`, `docs/api-routes.md`, `docs/worklog.md`) esté alineada
- [ ] El producto pueda operar con confianza razonable en entorno real sin depender de conocimiento tácito
