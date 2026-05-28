# 🏪 Módulo B2C — Tienda en Línea

> **Última actualización:** 2026-05-28

## Vista general

El módulo B2C (Business-to-Consumer) es la tienda en línea pública de Farmacy. Permite a los clientes navegar el catálogo, gestionar su perfil, acumular y canjear puntos de fidelidad, y realizar compras con múltiples métodos de pago.

---

## 🔐 Autenticación y persistencia de datos

### ¿Los datos persisten tras una caída del servidor?

**Sí, completamente.** La arquitectura garantiza persistencia en 3 capas:

| Capa | Tecnología | Persistencia |
|---|---|---|
| **PostgreSQL** | Docker volume `farmacy_pg_data_dev` (desarrollo) o `farmacy_pg_data_prod` (producción) | ✅ **Datos guardados en disco del host**. Al reiniciar Docker, todos los datos (clientes, ventas, puntos, productos, lotes) están intactos. |
| **Redis** | Docker volume `farmacy_redis_data_dev` con `--appendonly yes` | ✅ Persistencia en disco. Al reiniciar, sesiones JWT blacklist, rate limits y cachés se restauran. |
| **JWT Refresh Tokens** | Redis (blacklist de tokens revocados) + PostgreSQL (sesiones activas) | ✅ Los refresh tokens persisten. Al reiniciar, los clientes autenticados no pierden sesión (a menos que el token expire). |

### ⚙️ Verificación manual de persistencia

```bash
# 1. Verificar que los volúmenes existen
docker volume ls | grep farmacy

# 2. Forzar reinicio de contenedores (simula caída)
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d

# 3. Verificar que datos anteriores están intactos
curl http://localhost:3000/api/v1/clientes/auth/me -H "Authorization: Bearer <token>"
# → Debería retornar los mismos puntos, perfil y datos que antes
```

### Google OAuth + persistencia

Cuando un cliente se autentica con Google OAuth:

1. **Registro automático**: Si es la primera vez, se crea un `Cliente` con `proveedorAuth: 'google'` y `emailVerificado: true`
2. **Login subsecuente**: Se busca por `proveedorAuthId` (Google sub) — siempre encuentra el mismo registro
3. **Puntos y compras**: Almacenados en la misma tabla `Clientes` en PostgreSQL. **No se pierden** al reiniciar servidores ni al cerrar sesión.
4. **Re-login con Google**: Al volver a autenticarse, todos los puntos acumulados, historial de compras y perfil de salud están intactos.

---

## 💰 Programa de Puntos / Fidelidad

### Esquema de puntos

| Concepto | Valor |
|---|---|
| **Ganancia** | 1 punto por cada $100 COP pagados en el TOTAL FINAL |
| **Canje** | 1 punto = $1 COP de descuento |
| **Expiración** | 1 año después de la última compra |
| **Límite por compra** | Solo se pueden usar puntos disponibles (`puntosAcumulados` en `Cliente`) |
| **Redondeo** | `Math.floor(total / 100)` — siempre hacia abajo |

### Flujo de asignación

La asignación de puntos ocurre **en la misma transacción** que el registro de la venta (Prisma `$transaction`), garantizando atomicidad:

```typescript
// ventas.service.ts — dentro de registrarVenta()
if (data.clienteId) {
  // 1. Restar puntos usados (si el cliente canjeó)
  if (puntosDescontados > 0) {
    await tx.cliente.update({
      where: { id: data.clienteId },
      data: { puntosAcumulados: { decrement: puntosDescontados } }
    })
  }
  // 2. Sumar nuevos puntos generados
  const puntosGanados = Math.floor(total / 100)
  if (puntosGanados > 0) {
    await tx.cliente.update({
      where: { id: data.clienteId },
      data: {
        puntosAcumulados: { increment: puntosGanados },
        puntosExpiranEn: expira,  // +1 año
      },
    })
  }
}
```

### Pago contra entrega (Efectivo en sede / Cash)

#### 🔴 Problema identificado

Cuando un cliente **paga en efectivo contra entrega**:
1. La venta se registra en el POS por un empleado (`POST /ventas` → `VentasService.registrarVenta()`)
2. Se debe asociar el `clienteId` en la venta para que los puntos se asignen
3. El pago en efectivo se registra por separado (`POST /pagos/efectivo/registrar`)

#### ✅ Solución: Cómo asignar puntos correctamente

Para que un cliente reciba puntos en una compra en efectivo:

1. El empleado **debe seleccionar al cliente** en el POS antes de cobrar
2. El POS envía `clienteId` en el body de `POST /ventas`
3. `VentasService.registrarVenta()` detecta `clienteId` y asigna/actualiza puntos automáticamente
4. El pago en efectivo se registra después como `POST /pagos/efectivo/registrar` con el `ventaId`

**Si el cliente no está seleccionado en el POS, no recibe puntos.** Esta es una decisión de diseño deliberada: sin identificación del cliente, no hay fidelización.

#### 🟢 Validación de que la compra fue realmente realizada

| Método de pago | Validación |
|---|---|
| **Efectivo en POS** | El empleado autenticado (JWT + rol) confirma el pago. Queda registro en `PagoTransaccion` con `pasarela: 'EFECTIVO'`, `estado: 'APROBADO'`, y `respuestaPasarela` con monto recibido. |
| **Tarjeta (Stripe/Wompi/MercadoPago)** | Webhook de la pasarela confirma el pago. `estado: 'APROBADO'` solo si la pasarela responde OK. |
| **Transferencia** | Pendiente de implementar — actualmente se mapea como EFECTIVO. |

**Flujo completo de validación:**

```
1. Venta creada → estado PAGADO (confianza inicial del empleado)
2. Pago registrado → PagoTransaccion con estado APROBADO
3. (Opcional) Webhook → si es pasarela, confirma externamente
4. Descuento de inventario FEFO → lotes descontados atómicamente
5. Puntos asignados → si hay clienteId
```

---

## 🛒 Flujo de Compra B2C

### Catálogo público
- Filtros por categoría, laboratorio, precio
- Búsqueda por nombre, principio activo, CUM
- Productos con receta médica (`requiereRx: true`) muestran advertencia
- Muestras médicas (`esMuestraMedica: true`) NO aparecen en búsqueda pública
- **SEO**: Pre-renderizado SSG para top 100 productos + categorías populares

### Carrito de compras
- Reserva temporal de stock (no persistente — se verifica al pagar)
- Descuento FEFO: prioriza lotes próximos a vencer
- Validación de alérgenos contra perfil de salud del cliente
- Soporte para códigos de descuento

### Checkout
- Selector de método de pago: Wompi (PSE/Nequi), Stripe (tarjeta), MercadoPago, Efectivo
- Verificación de interacciones medicamentosas contra productos en carrito
- Redirección a pasarela o confirmación de efectivo

---

## 📊 Resumen de datos persistentes

| Dato | Dónde persiste | Se pierde al reiniciar Docker |
|---|---|---|
| Clientes (perfil, puntos) | PostgreSQL | ❌ No |
| Ventas e historial | PostgreSQL | ❌ No |
| Productos y lotes | PostgreSQL | ❌ No |
| Sesiones JWT (activas) | Redis | ❌ No (persiste en disco) |
| Tokens revocados (blacklist) | Redis | ❌ No |
| Carrito de compras (no finalizado) | Zustand (localStorage) | ❌ No (persiste en navegador) |
| Preferencias UI (dark mode) | Zustand (localStorage) | ❌ No |

---

## 🧪 Tests relacionados

| Archivo | Tests | Cobertura |
|---|---|---|
| `backend/src/__tests__/auth-cliente.routes.test.ts` | 45 | Login, registro, Google OAuth, perfil |
| `backend/src/__tests__/ventas.service.test.ts` | Puntos | Asignación, canje, expiración |
| `backend/src/__tests__/ventas.routes.test.ts` | Ventas | CRUD, estados |
| `backend/src/__tests__/pagos.routes.test.ts` | Pagos | Wompi, Stripe, MP, efectivo |
| `e2e/specs/b2c-flujo.spec.ts` | 5 E2E | Navegación, login, carrito |
| `e2e/specs/flujo-completo.spec.ts` | 11 E2E | Flujo completo B2C + admin |
