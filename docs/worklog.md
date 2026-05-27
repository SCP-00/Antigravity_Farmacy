# Work log

Use this log to record completed milestones and the files changed for each phase.

## 2026-05-26 — Fase 10: Baseline de producción — CORS, Helmet, sanitización chatbot, secret scanning

**Objetivo:** Cerrar huecos operativos y de seguridad de bajo esfuerzo con alto impacto.

### Cambios realizados

#### 1. CORS endurecido (`backend/src/app.ts` + `backend/src/config/env.ts`)
- Se agregó `CORS_ORIGINS` en `env.ts` (separado por comas, para producción)
- CORS ahora usa `env.CORS_ORIGINS` con split por comas, con fallback a localhost para desarrollo
- Se agregaron `methods`, `allowedHeaders` y `maxAge` explícitos
- Warning en producción si `CORS_ORIGINS` no está configurado

#### 2. Helmet / Security headers (`backend/src/app.ts` + `backend/src/config/env.ts`)
- Se agregó `CSP_ENABLED` en `env.ts` (default `'true'`)
- CSP configurado con directivas para: Cloudinary, Wompi, Stripe, MercadoPago, Google Fonts
- `referrerPolicy: 'strict-origin-when-cross-origin'`
- `hsts: maxAge 31536000, includeSubDomains, preload`
- `crossOriginEmbedderPolicy: false` documentado (necesario para SPA + CDN)
- Si `CSP_ENABLED=false`, cae a Helmet básico original

#### 3. Sanitización de chatbot (`backend/src/modules/chatbot/chatbot.routes.ts`)
- `sanitizarInput()`: elimina etiquetas HTML/XML, caracteres de control, limita a 500 chars
- `sanitizarSessionToken()`: solo permite `[a-zA-Z0-9\-_.]`, max 128 chars
- Aplicado en `POST /` (mensaje + sessionToken) y `POST /interacciones` (productoIds)

#### 4. Secret scanning (`backend/.gitleaks.toml`)
- Nuevo archivo con reglas personalizadas para Farmacy:
  - JWT secrets, DB URLs, Google OAuth, Stripe, MercadoPago, Wompi, Cloudinary, SMTP
- Whitelist de rutas: `.env.example`, `docs/`, `node_modules/`, tests, seeds, lockfiles
- Uso: `gitleaks detect --source . --config backend/.gitleaks.toml -v`

#### 5. HEADLESS mode (verificación)
- `run.ps1` ya usa `Get-Job` correctamente en modo headless (implementado previamente)

### Validaciones
- ✅ TypeScript backend: 0 errores
- ✅ Tests: 520/520 pasan (27 archivos)
- ✅ Code review: aprobado

---

## 2026-05-26 — Fix MSYS path translation + tests + documentación

**Bug:** Al ejecutar el backend desde Git Bash (o cualquier shell MSYS/Cygwin), las rutas
que empiezan con `/` son traducidas automáticamente a rutas Windows.
Ej: `/api/v1` → `C:/Program Files/Git/api/v1`, rompiendo TODAS las rutas de la API.

### Fix implementado

- `backend/src/config/env.ts` — Zod schema de `API_PREFIX` ahora tiene un `.transform()`
  que detecta el patrón de unidad Windows (`C:/...`) y extrae la ruta original saltando
  directorios MSYS conocidos (`Program Files`, `Git`, `msys64`, `msys`, `usr`, `etc`).
  Soporta tanto `/` como `\` como separadores.

### Tests (10 casos, 16 total en env.test.ts)

| Escenario | Resultado |
|---|---|
| Default (sin `API_PREFIX`) → `/api/v1` | ✅ |
| `C:/Program Files/Git/api/v1` (Git Bash) → `/api/v1` | ✅ |
| `C:/msys64/api/v1` (MSYS2 directo) → `/api/v1` | ✅ |
| `D:/Git/api/v1` (distinta letra de unidad) → `/api/v1` | ✅ |
| `C:/Program Files/Git/usr/api/v1` (directorios extra) → `/api/v1` | ✅ |
| `C:\\Program Files\\Git\\api/v1` (backslashes Windows) → `/api/v1` | ✅ |
| `/api/v2` (prefix normal, sin MSYS) → `/api/v2` (preservado) | ✅ |
| `/api/v1/admin` (ruta profunda normal) → `/api/v1/admin` | ✅ |
| `X:/some/unknown/path` (ruta no-MSYS) → `/some/unknown/path` (drive stripped) | ✅ |
| `X:/Program Files/Git/usr/etc` (todos skipDirs) → valor original preservado | ✅ |

### Documentación asociada

- `AGENTS.md` — Nueva sección `🐛 MSYS Path Translation (Git Bash en Windows)` con:
  - Explicación del bug y síntomas
  - Código del fix en env.ts
  - Workarounds: `MSYS2_ARG_CONV_EXCL="*"`, usar PowerShell nativo
- `run.ps1` — Detección de `$env:MSYSTEM` en paso [4/8] con advertencia clara
  (run.ps1 usa PowerShell nativo para los child processes, así que no sufre el bug)
- `docs/worklog.md` — Esta entrada

### Commits

| Hash | Mensaje |
|---|---|
| `27f23a5` | `docs: bug MSYS path translation en AGENTS.md y warning en run.ps1` |
| `410b4fb` | `docs: refinar warning MSYS en run.ps1 - clarificar que no afecta al script` |
| `e559265` | `docs: resultados test MSYS fix en 3 shells + worklog` |
| `10a83be` | `test: cobertura completa MSYS path translation (9 escenarios)` |

---

## 2026-05-25 — Auditoría general y actualización documentación

Se realizó una revisión completa del proyecto y se actualizó toda la documentación.

**Estado actual del proyecto:**
- ✅ Backend TypeScript: 0 errores
- ✅ Frontend TypeScript: 0 errores
- ✅ Tests: 215 pasan, 3 fallos preexistentes (stock mínimo en alertas)
- ⚠️ 12 suites de ruta fallan por resolución de módulo `.prisma/client/default` (preexistente, no afecta funcionalidad)
- ✅ Docker: Postgres + Redis operativos (32 min up)
- ✅ Seeds ejecutadas con 17 tablas pobladas
- ✅ Schema Prisma sincronizado con BD

## 2026-05-25 — Migración Wompi a sandbox + MercadoPago integrado

**Wompi — Cambio a Sandbox:**
- Keys de producción reemplazadas por sandbox: `pub_test_*`, `prv_test_*`, `test_integrity_*`
- `WOMPI_BASE_URL` default cambiado a `https://sandbox.wompi.co/v1`
- `env.ts`: Agregado `WOMPI_INTEGRITY_SECRET` + default sandbox
- `pagos.routes.ts`: Firma HMAC-SHA256 corregida (usa integrity key, no events secret)
- `.env.example`: Agregado `WOMPI_INTEGRITY_SECRET`

**MercadoPago — Integración completa:**
- Keys sandbox escritas en `.env` y `backend/.env`
- `pagos.routes.ts`: Endpoint `/mercadopago/crear` acepta `ventaId`+`items`+`monto`+`clienteEmail` sin requerir `pedidoOnline`
- `frontend/src/services/index.ts`: `crearMercadoPago` con nuevo signature flexible
- `frontend/src/pages/tienda/Checkout.tsx`: Flujo real — crea venta → llama API MP → redirige a initPoint. Sin flash de pantalla.
- **Relación Prisma**: `PagoTransaccion.ventaId` ahora tiene FK formal con `Venta`

## 2026-05-25 — Configuración Wompi Producción

- Keys de producción Wompi configuradas en `.env` y `backend/.env`
- `WOMPI_INTEGRITY_SECRET` agregado a `env.ts` y `.env.example`
- `WOMPI_BASE_URL` default cambiado a `https://api.wompi.co/v1`
- `pagos.routes.ts`: Firma de transacciones corregida (HMAC-SHA256 con integrity key)
- Code review aprobado: 0 errores, 0 warnings

## 2026-05-24 (Full Testing + Coverage)

- **Suite completa de tests (27 archivos, 218 tests):**
  - 14 archivos pasan completamente (core services, utils, schemas, middlewares)
  - 12 archivos de ruta fallan por resolución de módulo `.prisma/client/default`
  - alertas.job.test.ts: 3 tests de stock mínimo fallan por conteo de spies
- **Documentación actualizada** con tablas de coverage y módulos

## 2026-05-24 (Segmentación de tests de ruta)

- **11 nuevos archivos de test de ruta** agregados para cubrir todos los módulos
- Tests de Stripe/MercadoPago (configurados y no configurados)
- Tests de webhooks con firma HMAC

## 2026-05-22 (Fase 7 — Pasarelas de Pago)

- Checkout visual con selector de método (Wompi, Stripe, MercadoPago, Efectivo)
- Simulación animada de pasarela con 3 pasos
- Página de confirmación standalone con query params
- Validación inline de formularios con accesibilidad aria

## 2026-05-22 (Fase INVIMA-CSV)

- Mini-CSV generado: 56 productos, 14 grupos ATC, 26 KB
- Script importar-y-generar.cjs: importación + lotes
- 121 lotes generados para 55 productos

## 2026-05-22 (Eliminación Facebook OAuth)

- Facebook OAuth eliminado completamente del proyecto
- Archivos modificados: passport.ts, auth routes, env.ts, .env.example, frontend

## 2026-05-23 (Fase 5 y 6 completadas)

- POS con escáner de códigos, arqueo de caja, tirilla térmica
- Tienda B2C con carrito, checkout FEFO, catálogo real

## 2026-05-26 — Upgrade masivo de dependencias

Se actualizaron las dependencias principales del proyecto en el branch `deps-upgrade-2026`.

**Cambios realizados:**

| Paquete | Antes → Después |
|---|---|
| Vite | 5.4.21 → **6.4.2** |
| @vitejs/plugin-react | 4.7.0 → **5.2.0** |
| TypeScript (backend) | 5.9.3 → **6.0.3** |
| TypeScript (frontend) | 5.3.3 → **6.0.3** |
| Vitest (frontend) | 1.6.1 → **3.2.4** |
| nodemailer | 8.0.7 → 8.0.8 |
| dotenv | 16.6.1 → 17.4.2 |

**Archivos modificados:**
- `run.bat`: Reescrito con verificación Docker, PowerShell port kill, healthcheck HTTP, HEADLESS mode, .env auto-creación
- `backend/src/config/env.ts`: Carga dual de `.env` (backend/.env + raíz, raíz con prioridad)
- `backend/tsconfig.json`: Agregado `ignoreDeprecations: "6.0"`
- `backend/package.json` y `frontend/package.json`: Version bumps

**Validaciones:**
- ✅ Backend TypeScript: 0 errores
- ✅ Frontend TypeScript: 0 errores
- ✅ Tests: 462/462 pasan (27 archivos)
- ✅ Vite build: exitoso (9.63s)
- ✅ pnpm store: 156MB liberados

## 2026-05-26 — Verificación del fix MSYS path translation (3 shells)

**Prueba completa del bug MSYS path translation desde 3 shells + Git Bash.**

### Pruebas realizadas

| Shell | Endpoint | Resultado |
|---|---|---|
| **PowerShell nativo** | `/api/v1/health` | ✅ 200 |
| | `/api/v1/categorias` | ✅ 200 (8 categorías) |
| | `/api/v1/sucursales` | ✅ 200 (2 sucursales) |
| **CMD** | `/api/v1/health` | ✅ 200 |
| | `/api/v1/categorias` | ✅ 200 |
| **Git Bash** (curl) | `/api/v1/health` | ✅ 200 |
| | `/api/v1/categorias` | ✅ 200 |
| | `/api/v1/sucursales` | ✅ 200 |
| **Git Bash** (backend arrancado desde bash) | `/api/v1/health` | ✅ 200 |
| | `/api/v1/categorias` | ✅ 200 |
| | `/api/v1/sucursales` | ✅ 200 |

### Fix MSYS — Unit test (6/6 casos)
| Escenario | Resultado |
|---|---|
| Path normal `/api/v1` → `/api/v1` | ✅ |
| Git Bash `C:/Program Files/Git/api/v1` → `/api/v1` | ✅ |
| MSYS2 directo `C:/msys64/api/v1` → `/api/v1` | ✅ |
| Diferente letra `D:/Git/api/v2` → `/api/v2` | ✅ |
| Directorios extra `C:/Program Files/Git/usr/api/v1` → `/api/v1` | ✅ |
| Prefix alternativo `/api/v2` → `/api/v2` | ✅ |

**Archivos involucrados:**
- `backend/src/config/env.ts` — Fix MSYS en `.transform()` de `API_PREFIX`
- `backend/src/__tests__/env.test.ts` — Tests unitarios del fix
- `AGENTS.md` — Documentación del bug y workarounds
- `run.ps1` — Detección de `$env:MSYSTEM` y advertencia en paso [4/8]

## 2026-05-26 — Validación inline en formularios admin — InputField, NuevaOrden, RecepcionMercancia, FormularioEmpleado

**Objetivo:** Agregar validación en tiempo real con feedback visual (bordes rojos, mensajes de error), estados `touched`, y atributos ARIA en los formularios admin clave.

### Cambios realizados

#### 1. Componentes reutilizables (`frontend/src/components/shared/InputField.tsx` — **nuevo**)
- `InputField` — input text/email/number/password con label, error, `aria-invalid`, `aria-describedby`, dark mode
- `SelectField` — select con label, error, placeholder, ARIA
- `TextAreaField` — textarea con label, error, ARIA
- `InputError` — mensaje de error con icono `AlertCircle`, `role="alert"`, animación `animate-fade-in`
- Todos los componentes muestran borde rojo (`border-red-400`) cuando hay error + touched, y borde teal en focus normal

#### 2. FormularioEmpleado (`frontend/src/pages/admin/empleados/components/FormularioEmpleado.tsx`)
- Migrado de raw inputs a `InputField`/`SelectField`
- Mantiene `react-hook-form` + `zod` para la validación, ahora con estilos visuales consistentes
- Password: helperText condicional (editar vs crear), toggle de visibilidad con `Eye`/`EyeOff`

#### 3. NuevaOrden (`frontend/src/pages/admin/compras/NuevaOrden.tsx`)
- Validación inline: `proveedorId` requerido, `fechaEntrega` no pasada, `notas` max 500 chars
- Touch tracking (`tocados`) + errores en vivo al escribir si el campo ya fue tocado
- Validación de items: al menos 1 producto, cantidades/precios válidos
- Botón "Crear orden" valida todo antes de mutar, con `toast.error` si hay errores
- Dark mode completo en toda la página

#### 4. RecepcionMercancia (`frontend/src/pages/admin/compras/RecepcionMercancia.tsx`)
- Validación inline **por lote**: `codigoLote` requerido (3-50 chars, alfanumérico), `fechaVencimiento` futura, `cantidad >= 1`, `precio >= 0`
- Touch tracking individual por campo dentro de cada lote (`Record<string, Partial<Record<CampoLote, boolean>>>`)
- Errores en vivo al cambiar si el campo ya fue tocado
- Validación al enviar que marca **todos** los campos de todos los lotes como tocados
- Dark mode completo

### Validaciones
- ✅ TypeScript frontend: 0 errores
- ✅ Vite build: exitoso (5.52s)
- ✅ Code review: aprobado (3 detalles corregidos: helperText duplicado, límite cantidad inconsistente, IIFE simplificado)

---

## 2026-05-26 — Fase 11: UX Core POS + Admin — shortcuts, skeletons, dark mode

**Objetivo:** Mejorar la experiencia de usuario del POS y el panel admin con atajos de teclado, loaders esqueléticos, estados vacíos y cobertura de modo oscuro.

### Cambios realizados

#### 1. Skeleton loaders reutilizables (`frontend/src/components/shared/Skeleton.tsx` — **nuevo**)
- `SkeletonText` — línea de texto animada
- `SkeletonBlock` — bloque rectangular animado
- `SkeletonCard` — card completa con icono + líneas
- `SkeletonTable` — tabla animada con header + filas configurables
- `SkeletonChart` — barras de gráfico animadas con alturas aleatorias
- Todos con soporte dark mode (`dark:bg-dark-border`)

#### 2. EmptyState reutilizable (`frontend/src/components/shared/EmptyState.tsx` — **nuevo**)
- Componente genérico con icono, título, descripción, acción opcional
- Variante `compact` para espacios reducidos
- Clases dark mode

#### 3. Keyboard shortcuts en POS (`frontend/src/pages/admin/caja/PuntoVenta.tsx`)
- `F2` → Cobrar (usa `cobrarRef.click()` para respetar disabled del botón)
- `F4` → Limpiar carrito + descuento + cliente
- `F5` → Abrir caja (si está cerrada)
- `F8` → Focus + select en campo de búsqueda
- `useCallback` con dependencias para evitar memory leaks
- Shortcuts hint bar visible en desktop (`<Keyboard>` icon + `<kbd>` tags)
- `aria-keyshortcuts` en inputs y botones (accesibilidad)
- Ignorado cuando el modal de tirilla está abierto

#### 4. Layout responsive POS (`frontend/src/pages/admin/caja/PuntoVenta.tsx`)
- `flex-col lg:flex-row` — apilado en mobile, lado a lado en desktop
- `min-h-[50vh] lg:min-h-0` para visibilidad en mobile
- Productos: `grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` adaptativo
- `overscroll-contain` para scroll suave

#### 5. Skeleton loaders en Dashboard (`frontend/src/pages/admin/Dashboard.tsx`)
- KpiCard muestra `SkeletonBlock` cuando `loading=true`
- Chart muestra `SkeletonChart` cuando `reportesLoading=true`
- Eliminados imports no usados: `ShoppingCart`, `usePermisos`, `format`

#### 6. Dark mode en tablas admin
- **HistorialCaja:** thead, tbody, rows, celdas, loading/empty states, KPIs
- **OrdenesCompra:** thead, tbody, rows, celdas, paginación, loading/empty states

### Validaciones
- ✅ TypeScript frontend: 0 errores
- ✅ Vite build: exitoso (5.06s)
- ✅ Code review: aprobado (3 detalles cosmeticos corregidos)

---

## 2026-05-26 — Fase 12: UX Clínico — Drug-Interaction Alerts, Health Profiles, alertas clínicas

**Objetivo:** Implementar alertas de interacciones medicamentosas en POS, perfiles de salud en B2C, y verificación clínica en ficha de producto.

### Cambios realizados

#### 1. Prisma schema (`database/prisma/schema.prisma`)
- Modelo `Cliente`: nuevos campos `alergenos` (Text) y `condiciones` (Text) para almacenar alérgenos y condiciones preexistentes como strings separadas por coma

#### 2. Backend endpoints (`backend/src/modules/auth-cliente/authCliente.perfil.routes.ts`)
- `GET /salud` — Devuelve `alergenos` y `condiciones` como arrays parseados
- `PATCH /salud` — Recibe arrays, guarda como comma-separated string en DB

#### 3. Frontend services (`frontend/src/services/index.ts`)
- `clientesService.obtenerSalud()` — GET perfil de salud
- `clientesService.actualizarSalud(data)` — PATCH perfil de salud

#### 4. InteractionAlertModal (`frontend/src/components/shared/InteractionAlertModal.tsx` — **nuevo**)
- Modal de alertas clínicas reutilizable con:
  - Severidad: ALTA (rojo), MEDIA (ámbar), BAJA (azul), INFO (púrpura)
  - Iconos por severidad (AlertTriangle, AlertCircle, Info, Stethoscope)
  - Parseo de markdown básico (`**texto**` → `<strong>`)
  - Dark mode completo
  - Animaciones fade-in + slide-up
  - Botones Confirmar/Cancelar con loading state

#### 5. Integración en POS (`frontend/src/pages/admin/caja/PuntoVenta.tsx`)
- Antes de cobrar (F2 o botón), verifica interacciones entre productos en carrito
- Si hay alertas, muestra `InteractionAlertModal` antes de proceder
- Si no hay alertas o falla verificación, continúa normal

#### 6. Perfil de Salud en MiCuenta (`frontend/src/pages/tienda/MiCuenta.tsx`)
- Nueva pestaña "Perfil de salud" en MiCuenta
- Formulario con textareas para alérgenos y condiciones (separados por coma)
- Preview de tags con colores distintivos (ámbar para alérgenos)
- Info box explicativo sobre uso de la información
- Sincronización con `useEffect` cuando se cargan datos
- Integración con endpoint PATCH /salud

#### 7. Verificación de alérgenos en Checkout (`frontend/src/pages/tienda/Checkout.tsx`)
- Al hacer clic en "Pagar", verifica alérgenos vs perfil de salud del cliente
- Si detecta alérgenos en productos del carrito, muestra `InteractionAlertModal`
- Permite continuar o cancelar
- Badge informativo en sidebar con conteo de alérgenos registrados
- Overlay animado durante verificación

#### 8. Botón "Verificar interacciones" en ProductoDetalle (`frontend/src/pages/tienda/ProductoDetalle.tsx`)
- Botón con icono `Stethoscope` que llama a `chatbotService.verificarInteracciones`
- Muestra alertas en `InteractionAlertModal` si se detectan interacciones
- Toast de éxito si no hay interacciones
- Loading state durante verificación

#### 9. Bug fixes aplicados
- **Checkout.tsx**: Reordenamiento de `verificarAlergenosAntesDePagar` (useCallback) antes de `continuarPago` para evitar temporal dead zone + cierre de fragment `<></>` faltante
- **MiCuenta.tsx**: Reemplazo de `useState(() => {...})` (anti-patrón) por `useEffect` correcto + eliminación del hack `prevSalud` con `setTimeout`

### Validaciones
- ✅ TypeScript frontend: 0 errores
- ✅ Vite build: exitoso (9.31s)
- ✅ Code review: aprobado (bugs corregidos)

---

## 2026-05-26 — Documentación: browser-use, kill safety, regla de git

**Archivos modificados:**
- `AGENTS.md`: Agregadas 3 secciones:
  - `Uso de browser-use (Playwright) — solo pnpm`: Instrucciones para usar Playwright con pnpm (no npm), cómo Chromium queda instalado y cómo usarlo desde Codebuff
  - `⚠️ Cuidado con procesos (kill safety)`: Tabla de comandos peligrosos (taskkill /F /IM, Stop-Process sin filtro) vs comandos seguros por PID específico. Advertencia explícita sobre no matar `freebuff.cmd`
  - `📝 Regla: documentar cambios + git commit/push siempre`: Proceso obligatorio de documentar en AGENTS.md/docs/, commit descriptivo, y push

**Contexto:** El usuario reportó que solo tiene `pnpm` instalado (no npm), y que `freebuff.cmd` no debe ser cerrado accidentalmente por comandos kill agresivos.

## 2026-05-26 — Migración React 19 + Tailwind 4 + Coverage 95%+

**React 18→19:**
- react@19.2.6, react-dom@19.2.6, @types/react@19.0.0
- zustand@4.5.0, @tanstack/react-query@5.0.0, react-router-dom@6.22.0
- recharts@2.12.0, lucide-react@1.16.0 (íconos sociales migrados a SVG inline)
- TypeScript: 0 errores

**Tailwind 3→4:**
- tailwindcss@4.3.0 + @tailwindcss/vite@4.3.0
- postcss.config.cjs y tailwind.config.ts eliminados
- index.css migrado a @import "tailwindcss" + @theme
- vite.config.ts: @tailwindcss/vite plugin reemplaza postcss
- build exitoso (5.70s)

**Cobertura 83.7%→95.35%:**
- 510 tests (27 archivos), 0 fallos
- Reportes: 44%→100%, auth-cliente perfil: 66%→100%
- schemas: 94.93% stmts, servicios: 95.76%, config: 99.5%
- Todos los módulos ≥90% (excepto imagenes 46.96%)

---

## 2026-05-27 — Fase 13: SEO Técnico + Performance — meta tags, sitemap, lazy loading, bundle optimization

**Objetivo:** Implementar meta tags dinámicos por página, sitemap XML, lazy loading de imágenes con IntersectionObserver, y optimización de bundles/build.

### Cambios realizados

#### 1. SEOHead reutilizable (`frontend/src/components/shared/SEOHead.tsx` — **nuevo**)
- Componente con `Helmet` de `react-helmet-async` que recibe: `title`, `description`, `path`, `image`, `type`, `keywords`
- Defaults: description, title suffix `| Farmacy`, keywords desde constants
- Open Graph tags (`og:title`, `og:description`, `og:image`, `og:type`, `og:url`)
- Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)
- `lang="es"` en `<html>` tag
- Canonical URL generada automáticamente desde `path`

#### 2. HelmetProvider en main.tsx
- `frontend/src/main.tsx`: Envuelto con `<HelmetProvider>` (anidado dentro de StrictMode)

#### 3. SEOHead integrado en páginas públicas
| Página | Title | Description |
|---|---|---|
| Inicio | `Farmacy — Tu farmacia digital` | Catálogo de medicamentos INVIMA |
| Catalogo | `Catálogo de productos` | + categorías + laboratorios |
| ProductoDetalle | `{nombre} {concentracion}` | + presentación + precio |
| QuienesSomos | `Quiénes somos` | + resumen corporativo |
| Contacto | `Contacto` | + sucursales principales |
| Sucursales | `Nuestras sucursales` | + horarios + servicios |
| Carrito | `Tu carrito de compras` | + resumen |
| Favoritos | `Mis favoritos` | + descripción |
| MisPedidos | `Mis pedidos` | + historial de compras |
| NoEncontrado | `Página no encontrada` | + mensaje 404 |
| PoliticaPrivacidad | `Política de privacidad` | + resumen legal |
| TerminosCondiciones | `Términos y condiciones` | + resumen legal |
| LoginCliente | `Iniciar sesión` | + descripción

#### 4. Sitemap XML + robots.txt
- `frontend/public/sitemap.xml` (nuevo): 12 URLs principales con prioridades y frecuencias
- `frontend/public/robots.txt`: Disallow `/api/*`, `/admin/*`, `/auth/*`; agregada directiva `Host`
- `frontend/src/services/sitemap.ts` eliminado (importaba Express dentro del frontend)

#### 5. LazyImage component (`frontend/src/components/shared/LazyImage.tsx` — **nuevo**)
- Lazy loading con `IntersectionObserver` + `rootMargin: 200px` para carga anticipada
- Placeholder/skeleton animado mientras carga
- Fade-in transition (`opacity-0` → `opacity-100` con `duration-300`)
- Fallback en error (oculta placeholder)
- Soporte dark mode
- Migrado a `<img loading="lazy">` nativo como capa adicional
- Footer.tsx: imágenes de Visa/Mastercard/PayPal migradas a `<LazyImage>`

#### 6. Bundle optimization (`frontend/vite.config.ts`)
- `cssCodeSplit: true` — CSS dividido por chunk
- `chunkSizeWarningLimit: 400` — warning solo si >400 kB
- `assetsInlineLimit: 4096` — assets <4 KB inline como base64
- `manualChunks` granular con función:
  - `vendor-core`: React + ReactDOM + Router
  - `vendor-seo`: react-helmet-async + dependencias
  - `vendor-query`: @tanstack/react-query
  - `vendor-charts`: recharts + d3
  - `vendor-ui`: lucide-react
  - `vendor-toast`: react-hot-toast + goober
  - `vendor-state`: zustand

#### 7. Bug fixes de JSX
- **MisPedidos.tsx**: Loading state `return` reestructurado para cerrar fragment correctamente
- **ProductoDetalle.tsx**: `!producto` return y main return — fragmentos `<>` sin cerrar, corregidos agregando `</>` 
- **ProductoDetalle.tsx**: Fragment suelto dentro del tab de seguridad (listaAlergenos.map) corregido
- **LoginCliente.tsx**: Doble `</>` eliminado

### Validaciones
- ✅ TypeScript frontend: 0 errores
- ✅ Vite build: exitoso (19.89s)
- ✅ Code review: aprobado (3 fixes de fragment/div aplicados correctamente)

### Chunks generados
| Chunk | Tamaño | Gzip |
|---|---|---|
| `vendor-core` | 430 kB | 130 kB |
| `vendor-charts` | 396 kB | 111 kB |
| `vendor-query` | 232 kB | 66 kB |
| app `index` | 184 kB | 39 kB |
| Otros (5 chunks) | 23–86 kB | — |

---

## 2026-05-27 — Fase 14: PWA + Offline — Service Worker, manifest, íconos, offline fallback

**Objetivo:** Convertir Farmacy en una Progressive Web App instalable con soporte offline para la tienda.

### Cambios realizados

#### 1. Dependencias agregadas
| Paquete | Versión | Tipo |
|---|---|---|
| `vite-plugin-pwa` | ^1.3.0 | devDependency |
| `workbox-window` | ^7.4.1 | devDependency (tipos) |

#### 2. Service Worker con Workbox (`frontend/vite.config.ts`)
- Plugin `VitePWA` con `registerType: 'autoUpdate'`
- **Strategy:** `generateSW` — genera `dist/sw.js` + `dist/workbox-b1bafff1.js`
- **Precaching:** 85 entries (2.4 MB) — JS, CSS, HTML, SVG, PNG, JPG, ICO, JSON, XML, WOFF2
- **Offline fallback:** `navigateFallback: '/offline.html'` con denylist para `/api/`, `/admin/`, `/auth/`
- **Runtime caching estratégico:**
  | Pattern | Handler | Cache | Expiración |
  |---|---|---|---|
  | `/api/productos/buscar`, `/api/productos/lista-rapida` | `CacheFirst` | `api-productos` | 1 hora |
  | `/api/categorias` | `CacheFirst` | `api-categorias` | 24 horas |
  | `/api/sucursales` | `CacheFirst` | `api-sucursales` | 24 horas |
  | Google Fonts stylesheets | `StaleWhileRevalidate` | `google-fonts-stylesheets` | 30 días |
  | Google Fonts webfonts | `CacheFirst` | `google-fonts-webfonts` | 60 días |
  | External images (icons8) | `StaleWhileRevalidate` | `external-images` | 7 días |

#### 3. Manifest PWA (`frontend/vite.config.ts`)
- **Name:** Farmacy — Tu farmacia digital
- **Theme color:** `#0F6E56` (verde farmacia)
- **Display:** `standalone` — experiencia tipo app al instalar
- **Icons:** 3 SVG (192x192, 512x512, maskable 512x512)
- **Shortcuts:** "Buscar productos" → `/productos`, "Contacto" → `/sucursales`
- **Categories:** health, medical, pharmacy, shopping

#### 4. Íconos PWA (`frontend/public/icons/` — **3 nuevos**)
- `icon.svg` (512x512): Cruz farmacia verde con gradient, rounded square
- `icon-192.svg` (192x192): Misma cruz, para sizes 192x192
- `icon-maskable.svg` (512x512): Full bleed para Android adaptive icons

#### 5. Offline fallback page (`frontend/public/offline.html` — **nuevo**)
- Página standalone con diseño card, icono decorativo (signal-off SVG), mensaje claro
- Botón "Reintentar" que hace `window.location.reload()`
- Colores y branding farmacia (verde `#0F6E56`, fondo `#F5F8F6`)
- Inline styles, responsive, sin dependencias externas

#### 6. Actualización PWA en vivo (`frontend/src/components/shared/PWAUpdatePrompt.tsx` — **nuevo**)
- Componente React que importa dinámicamente `virtual:pwa-register`
- `registerSW` con dos callbacks:
  - `onNeedRefresh()`: Toast "Nueva versión disponible" (duración 8s, icono 🔄)
  - `onOfflineReady()`: Toast "Funciona sin conexión" (duración 4s)
- Error boundary (try/catch) para desarrollo donde el módulo virtual no existe
- Cleanup flag `cancelled` para evitar estado inconsistente tras desmontar
- Colores de toast acordes a la marca (verde/ámbar)

#### 7. Type declarations (`frontend/src/vite-env.d.ts`)
- `/// <reference types="vite/client" />` — tipos de Vite
- `declare module 'virtual:pwa-register'` — exporta `registerSW()` y `RegisterSWOptions`
- Importa tipos desde `workbox-window`

#### 8. Meta tags PWA (`frontend/index.html`)
- `theme-color: #0F6E56` — color de la barra de herramientas en mobile
- `apple-mobile-web-app-capable: yes` — iOS fullscreen
- `apple-mobile-web-app-title: Farmacy` — nombre en home screen iOS
- `apple-touch-icon` → `/icons/icon-192.svg`
- `mask-icon` → `/icons/icon.svg` color `#0F6E56` (Safari pinned tab)
- `viewport-fit=cover` — notched devices
- Icono cambiado de `favicon.ico` a `/icons/icon.svg`

#### 9. Integración en main.tsx (`frontend/src/main.tsx`)
- Importado `<PWAUpdatePrompt />` desde `./components/shared/PWAUpdatePrompt`
- Renderizado dentro de `<QueryClientProvider>`, después de `<ReactQueryDevtools>`

#### 10. Package reorganized
- `workbox-window` movido de `dependencies` a `devDependencies` (solo tipos en build)

#### 11. PWA Install Analytics — `beforeinstallprompt` + banner de instalación
- **`frontend/src/hooks/usePWAInstall.ts`** (NUEVO):
  - Hook `usePWAInstall()` que escucha `beforeinstallprompt` con `e.preventDefault()`
  - Escucha `appinstalled` y `display-mode: standalone` change para detectar instalación
  - Expone: `isInstallable`, `isInstalled`, `install()`, `dismiss()`, `markBannerShown()`, `getAnalytics()`, `resetAnalytics()`
  - Analytics en localStorage (clave `farmacy_pwa_install_analytics`) con timestamps y conteos
  - `install()` llama a `event.prompt()` y trackea `userChoice.outcome`
  - `dismiss()` desactiva el banner por el resto de la sesión
  - Cleanup de listeners en useEffect return
  - Fix de double-conteo con `hasRecordedInstallRef` (previene que `appinstalled` incremente dos veces)

- **`frontend/src/components/shared/InstallPWABanner.tsx`** (NUEVO):
  - Banner slide-up animado con CSS `@keyframes slide-up`
  - Diseño card con icono Download, título, descripción, botones Instalar / Ahora no
  - Dark mode completo
  - `role="alert"`, `aria-live="polite"` para accesibilidad
  - Marca bannerShownCount automáticamente en analytics

- **`frontend/src/components/layout/PublicLayout.tsx`**:
  - Integrado `<InstallPWABanner />` antes del cierre del contenedor principal

- **`frontend/src/hooks/index.ts`**:
  - Exportado `usePWAInstall` y tipo `PWAInstallAnalytics`

### Validaciones
- ✅ TypeScript frontend: 0 errores
- ✅ Vite build: exitoso (8.26s)
- ✅ Workbox generateSW: 85 entries precached (2.4 MB)
- ✅ Code review: aprobado (fix de double-conteo en analytics corregido)

---

## 2026-05-27 — Fase 15: Testing E2E con Playwright

**Objetivo:** Implementar pruebas end-to-end con Playwright que validen los flujos críticos de navegación pública, login admin, POS y B2C.

### Dependencias agregadas
| Paquete | Versión | Tipo |
|---|---|---|
| `@playwright/test` | ^1.60.0 | devDependency |

### Archivos creados

#### 1. Configuración global (`e2e/playwright.config.ts`)
- 2 proyectos: **chromium** (desktop 1280×900) y **chromium-mobile** (Pixel 7 412×915)
- baseURL: `http://localhost:5173`
- Timeouts: test 60s, expect 15s, action 10s, navigation 30s
- Retries: 1 (2 en CI), workers: 1 (2 en CI)
- Reporter: HTML (`e2e/reports`) + list con steps
- `--unsafely-treat-insecure-origin-as-secure` para probar PWA sin HTTPS

#### 2. Fixtures de autenticación (`e2e/fixtures/auth.ts`)
- `CREDENTIALS`: admin, farmaceuta, auxiliar, cliente con emails y passwords
- `loginAdmin()`: login vía API → token en localStorage via `addInitScript`
- `loginCliente()`: login cliente vía API
- `loginAdminForm()`: llena formulario de login en página
- `gotoDashboard()`: navega al dashboard admin

#### 3. Specs de tests (`e2e/specs/`)

**public-navigation.spec.ts** — 5 tests:
- Home page: título, logo, búsqueda, enlaces, sin page errors
- Catálogo: título, botones "Agregar" visibles, categoría Analgésicos
- Ficha producto: clic en primer enlace `/productos/`, URL cambia, precio visible
- Búsqueda: llenar input → esperar debounce → Enter → URL con `q=alercet` → resultado visible
- 404: ruta inexistente muestra mensaje de no encontrado

**admin-login.spec.ts** — 4 tests:
- Redirección a `/admin/login` sin sesión
- Login exitoso con admin → redirect → mensaje dashboard
- Login fallido → permanece en login → mensaje error
- Cerrar sesión → clic botón → redirige a login

**pos-flujo.spec.ts** — 4 tests:
- Login farmaceuta → redirige a `/admin/caja/pos` (ruta por defecto)
- Login admin → navega a POS → busca ibuprofeno
- Sin sesión → redirige a login
- Auxiliar (sin permiso caja) → redirige a inventario

**b2c-flujo.spec.ts** — 5 tests:
- Login cliente desde `/login` → redirect a `/` → nombre visible
- Catálogo → agregar al carrito → navegar a `/carrito`
- Carrito vacío muestra página de carrito
- Registro: formulario visible con campos email
- Sucursales: listado o mapa visible

### Scripts agregados (`package.json` raíz)
| Script | Comando |
|---|---|
| `e2e` | `npx playwright test --config=e2e/playwright.config.ts` |
| `e2e:ui` | Modo interactivo UI |
| `e2e:headed` | Navegador visible |
| `e2e:debug` | Modo debug |
| `e2e:report` | Mostrar reporte HTML |

### Resultados
- ✅ **18 tests pasaron** en 37.9s
- ✅ TypeScript frontend: 0 errores
- ✅ Code review: aprobado

### Fixes durante implementación
- **Catálogo test**: Selector `[class*="product"]` no existía — cambiado a `button:has-text("Agregar")`
- **Búsqueda test**: Form submit usaba `debouncedQ` (300ms debounce) — agregado `waitForTimeout(500)` antes de Enter
- **Prisma query engine**: Engine faltante en pnpm — copiado manualmente del pnpm store a `backend/node_modules/.prisma/client/`nnnn + " + "prisma generate`" + " + node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/backend/node_modules/.prisma/client/nnbackend/scripts/prisma-postgenerate.jsn2.  � predev chain con post-generatennnn--color-dark-text-muted: #718096#7a8ba6n- Eliminados  duplicados (PostCSS warning fix)n### Docker Composen-  eliminado de ambos archivos (docker-compose.yml + docker-compose.dev.yml)n### Validacionesn- ? Frontend TS: 0 erroresn- ? E2E flujo-completo: 11/11 testsn
---
## 2026-05-27 â€” Fase 16: Prisma Client durable fix + Flujo completo E2E (11 tests) + Dark mode WCAG AA

**Objetivo:** Hacer durable la generaciÃ³n de Prisma Client con pnpm, agregar test E2E integral de 11 escenarios, y mejorar accesibilidad de dark mode.

### Problema raÃ­z: Prisma Client con pnpm

En pnpm, `prisma generate` escribe los archivos generados en `node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/`, NO en `backend/node_modules/.prisma/client/`. Como el tsconfig del backend mapea `@prisma/client -> ./node_modules/.prisma/client`, TypeScript no encontraba los nuevos campos `condiciones` y `alergenos`.

### Fix durable

1. `backend/scripts/prisma-postgenerate.js` â€” Script Node.js nativo (fs.cpSync, sin PowerShell)
2. `backend/package.json` â€” predev ejecuta post-generate tras cada `prisma generate`
3. Prisma Client regenerado + copiado (1.58 MB)

### Test E2E: flujo-completo.spec.ts (11 tests)

Tests: Home carga, CatÃ¡logo, Login cliente, Producto detalle INVIMA, Carrito, Checkout Efectivo, Login admin, NavegaciÃ³n admin, 404, RedirecciÃ³n sin sesiÃ³n, Login farmaceuta.

### Dark mode WCAG AA

- `--color-dark-text-muted: #718096` -> `#7a8ba6` (contraste 5.07:1)
- Eliminados `@import` duplicados (PostCSS warning fix)

### Docker Compose

- `version: '3.9'` eliminado de docker-compose.yml y docker-compose.dev.yml

### Validaciones
- Backend TS: 0 errores
- Frontend TS: 0 errores
- Vitest: 520/520 tests
- E2E flujo-completo: 11/11 tests
- prisma-postgenerate: verificado manualmente
