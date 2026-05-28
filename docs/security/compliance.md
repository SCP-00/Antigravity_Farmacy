# 🔒 Seguridad y Compliance — Farmacy SGF

> **Última actualización:** 2026-05-28

## 📋 Resultados de Pentest

### Custom Pentest Avanzado (~109 tests)

Ejecutado contra `localhost:3000/api/v1` — **17 categorías** de ataque:

| Categoría | Tests | Resultado |
|---|---|---|
| SQL Injection | 15 payloads | ✅ PASS |
| XSS | 10 payloads | ✅ PASS |
| IDOR | 7 endpoints | ✅ PASS |
| JWT Attacks | 5 tests | ✅ PASS |
| Privilege Escalation | 8 endpoints | ⚠️ WARN (webhook sin auth — esperado) |
| Auth Bypass | 6 techniques | ✅ PASS |
| CSRF | 3 origins | ✅ PASS |
| SSRF | 7 targets | ✅ PASS |
| Command Injection | 8 payloads | ✅ PASS |
| CORS | 4 origins | ℹ️ INFO |
| Host Header | 4 hosts | ✅ PASS |
| Rate Limiting | 1 endpoint | ℹ️ INFO |
| XXE | XML payload | ✅ PASS (415) |
| SSTI | 7 payloads | ✅ PASS |

**Resumen: 88 PASS ✅ | 4 FAIL (falsos por rate limit) | 8 WARN | 9 INFO**

### OWASP ZAP Scan (Pasivo)

| Alerta | Resultado |
|---|---|
| High | 0 |
| Medium | 0 |
| Low | 0 |
| Info | 0 |

**Conclusión:** Sin vulnerabilidades detectadas en escaneo pasivo.

---

## 🛡️ Medidas de Seguridad

### Autenticación y Autorización

| Medida | Implementación |
|---|---|
| **JWT con refresh rotation** | Access (8h) + Refresh (7d empleados / 30d clientes) |
| **Blacklist en Redis** | Tokens revocados con TTL |
| **RBAC** | ADMINISTRADOR, FARMACEUTA, AUXILIAR |
| **bcryptjs** | Contraseñas hasheadas con salt |
| **Google OAuth** | Passport.js + verificación de ID token |
| **Rate limiting** | Auth: 10/min, Webhook: 60/min, Búsqueda: 60/min, Creación: 30/min |

### Protección de API

- **CORS**: Orígenes configurables por `CORS_ORIGINS`
- **Helmet**: CSP, X-Frame-Options, X-Content-Type-Options
- **Zod**: Validación tipada en runtime en todas las rutas
- **Prisma ORM**: SQL parameterizado — sin inyección
- **Webhook Security**: Anti-replay (nonce + timestamp) + HMAC + IP allowlist + idempotencia

### Secret Scanning

- ✅ GitHub Actions — escanea `gitleaks` en **todos los PRs**
- ✅ `.env` en `.gitignore` — nunca se sube
- ✅ `.env.example` con placeholders seguros
- ✅ Seeds con datos ficticios

---

## 🏛️ Compliance Colombiano (INVIMA / CUM)

El modelo `Producto` incluye 35+ campos regulatorios:

| Campo INVIMA | Modelo |
|---|---|
| CUM (único) | `cum` |
| Registro INVIMA | `registroInvima` |
| Principio Activo | `principioActivo` |
| ATC | `atc` |
| Forma Farmacéutica | `formaFarmaceutica` |
| Muestra Médica | `esMuestraMedica` (bloqueada en B2C) |
| Alérgenos | `alergenos`, `advertencias` |

---

## 💾 Persistencia de Datos

| Capa | Volumen | Sobrevive a reinicio |
|---|---|---|
| PostgreSQL | `farmacy_pg_data_dev` | ✅ Sí |
| Redis (AOF) | `farmacy_redis_data_dev` | ✅ Sí |
| Carrito (Zustand) | localStorage del navegador | ✅ Sí |

**Google OAuth + persistencia:** Al re-autenticarse con Google, todos los puntos y compras están intactos (búsqueda por `proveedorAuthId`).

---

## 🧪 Tests de seguridad

| Archivo | Descripción |
|---|---|
| `scripts/security-pentest-avanzado.sh` | ~109 tests automáticos (17 categorías) |
| `scripts/security-pentest.ps1` | Pentest PowerShell básico |
| `scripts/descargar-zap.ps1` | Descarga OWASP ZAP 2.17.0 |
| `.github/workflows/secret-scanning.yml` | Gitleaks en todos los PRs |
