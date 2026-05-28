# ══════════════════════════════════════════════════════════
#  FARMACY — Gestión de Secretos y Seguridad
# ══════════════════════════════════════════════════════════

> 🚨 **pnpm-only.** Este proyecto SOLO usa `pnpm`. NO uses `npm` ni `yarn`.

## 📋 Variables de Entorno Sensibles

| Variable | Propósito | Producción |
|---|---|---|
| `DATABASE_URL` | Conexión PostgreSQL | ✅ Rotar contraseña |
| `JWT_SECRET` | Firma tokens empleados | ✅ Mínimo 64 caracteres |
| `JWT_REFRESH_SECRET` | Firma refresh tokens | ✅ Diferente de JWT_SECRET |
| `JWT_CLIENTE_SECRET` | Firma tokens clientes | ✅ Diferente de los anteriores |
| `SMTP_PASS` | Contraseña email | ✅ App password (Gmail) |
| `CLOUDINARY_API_SECRET` | Cloudinary firma | ✅ API Key rotations |
| `WOMPI_PRIVATE_KEY` | Wompi API | ✅ Sandbox / Producción |
| `STRIPE_SECRET_KEY` | Stripe API | ✅ Restringir por IP |
| `MERCADOPAGO_ACCESS_TOKEN` | MercadoPago API | ✅ Sandbox / Producción |
| `SENTRY_DSN` | Error tracking | ✅ Restringir por origen |
| `VAPID_PRIVATE_KEY` | Push notifications | ✅ Generar por entorno |

## 🛡️ Seguridad en Capas

### 1. Transporte (HTTPS)

En **producción**, TODO el tráfico debe ir por HTTPS. El CSP de Helmet ya tiene
`upgradeInsecureRequests` activo. Configurar:

- **Certbot / Let's Encrypt** para certificados SSL
- **Nginx reverse proxy** con redirección 301 HTTP → HTTPS
- **HSTS**: `max-age=31536000; includeSubDomains; preload` (ya configurado en Helmet)

### 2. Autenticación

- **JWT con refresh rotation**: los refresh tokens se rotan en cada uso, el anterior
  se invalida en Redis blacklist (`bl_` / `bl_cli_`).
- **Rate limiting por IP + email**: `limitarLogin` usa `keyGenerator` compuesto
  de IP y email para evitar fuerza bruta.
- **Logout completo**: los tokens se agregan a Redis blacklist con TTL igual al
  tiempo restante del token.

### 3. Webhooks

- **HMAC verification**: Wompi, Stripe y MercadoPago verifican firma HMAC en el body.
- **IP Allowlist** (opcional): Stripe publica sus IPs fijas, configurable vía
  `WEBHOOK_IP_ALLOWLIST`.
- **Anti-replay**: timestamp + nonce en headers para prevenir ataques de replay
  (implementado en webhooks de pagos).
- **Idempotencia**: clave de idempotencia en webhooks para evitar procesamiento
  duplicado.

### 4. API

- **CSP (Content Security Policy)**: Helmet con directivas estrictas para
  scripts, estilos, imágenes y conexiones.
- **CORS**: orígenes permitidos configurados vía `CORS_ORIGINS`.
- **Rate limiting granular**: separado por tipo de endpoint (auth, creación,
  búsqueda, webhook, registro).
- **Validación Zod**: todos los inputs se validan con esquemas Zod antes de
  procesar.

### 5. Base de Datos

- **Prisma Migrate** (en lugar de `db push`): permite rollback y trazabilidad.
- **Auditoría**: modelo `LogActividad` registra cada acción sensible.
- **Historial de cambios**: modelo `HistorialCambio` guarda diff de cada
  modificación en registros críticos.

## 🔐 Buenas Prácticas para Desarrollo

### .env nunca se sube

```
.env.example  → ✅ Se sube (template)
.env          → ❌ No se sube (gitignored)
.env.local    → ❌ No se sube
.env.production → ✅ Se sube (template, sin valores reales)
```

### Generar secrets seguros

```bash
# Linux/macOS
openssl rand -base64 48    # 64 caracteres seguros

# Windows (PowerShell)
[Convert]::ToBase64String([byte[]]::new(64)) | ForEach-Object { $_ -replace '[^a-zA-Z0-9_]', 'X' }
```

### Rotación de Secrets

1. Generar nuevo valor
2. Actualizar `.env.production` (solo en servidor seguro)
3. Reiniciar servicio
4. Verificar logs de error
5. Revocar secreto anterior

## 🔍 Monitoreo de Seguridad

- **Sentry**: errores no manejados y excepciones (desactivado hasta configurar
  `SENTRY_DSN`)
- **Logs de auditoría**: tabla `LogActividad` con IP, acción, módulo y timestamp
- **Logs de aplicación**: Winston con rotación diaria (30 días de retención)
- **Secret Scanning**: GitHub Actions + Gitleaks en cada PR y push a main

## 📚 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Stripe Webhook IPs](https://stripe.com/files/ips/ips_webhooks.txt)
- [Wompi Documentación Seguridad](https://docs.wompi.co/docs/seguridad)
- [MercadoPago Checkout Pro](https://www.mercadopago.com.co/developers)
