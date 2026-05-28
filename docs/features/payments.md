# 💳 Módulo de Pagos — Pasarelas, Efectivo y Fidelización

> **Última actualización:** 2026-05-28

## Vista general

El sistema soporta **4 métodos de pago**: Wompi (Colombia), Stripe, MercadoPago y Efectivo. Cada uno con su propio flujo de creación de transacción, webhook de confirmación y manejo de idempotencia.

### Arquitectura de pagos

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend   │────▶│  Backend (API)   │────▶│   Pasarela      │
│  (React)     │     │  /api/v1/pagos/  │     │  (Wompi/Stripe/ │
│              │◀────│  *               │◀────│   MercadoPago)  │
└──────────────┘     └────────┬─────────┘     └─────────────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │   PostgreSQL     │
                     │  PagoTransaccion │
                     │  + Venta         │
                     │  + PedidoOnline  │
                     └──────────────────┘
```

---

## 💵 Pago en Efectivo (POS / Contra Entrega)

### Endpoint

`POST /api/v1/pagos/efectivo/registrar` — Solo empleados autenticados (JWT + rol)

### Flujo completo

```
1. Empleado selecciona productos en POS
2. (Opcional) Selecciona cliente de la lista → se asocia clienteId a la venta
3. Registra venta: POST /ventas → VentasService.registrarVenta()
   └── Si hay clienteId: asigna puntos automáticamente (1 punto por cada $100 COP)
4. Registra pago: POST /pagos/efectivo/registrar { ventaId, monto }
   └── Crea PagoTransaccion con pasarela: 'EFECTIVO', estado: 'APROBADO'
   └── Guarda montoRecibido en respuestaPasarela
5. (Opcional) Imprime tirilla / recibo
```

### ✅ Validación de que la compra fue realmente realizada

| Método de pago | Validación en backend |
|---|---|
| **Efectivo (POS)** | Empleado autenticado → `Venta.estado = 'PAGADO'` → `PagoTransaccion.estado = 'APROBADO'` con `respuestaPasarela.metodo = 'EFECTIVO'`. Trazabilidad: `empleadoId` + `creadoEn` |
| **Tarjeta (Wompi/Stripe/MP)** | Webhook de pasarela confirma → `estado = 'APROBADO'` solo si la pasarela responde OK. Anti-replay con HMAC + nonce + timestamp |
| **Transferencia** | Pendiente de implementar — actualmente se mapea como EFECTIVO |

### 🔴 Problema: Puntos en pago contra entrega

**Problema:** Cuando un cliente paga en efectivo contra entrega, ¿cómo aseguramos que recibe sus puntos?

**Solución implementada:**
1. En el POS, el empleado **debe seleccionar al cliente** antes de cobrar
2. El `clienteId` se envía en el body de `POST /ventas`
3. `VentasService.registrarVenta()` ejecuta en una **sola transacción atómica** (Prisma `$transaction`):
   - Descuenta inventario FEFO
   - Crea la venta con `clienteId`
   - **Resta puntos usados** (si el cliente canjeó)
   - **Suma nuevos puntos** (`Math.floor(total / 100)`) y actualiza `puntosExpiranEn` (+1 año)
4. El pago en efectivo se registra después en `POST /pagos/efectivo/registrar`

**Transacción atómica:** Si falla el pago, no se registra la venta ni se asignan puntos.

### 📊 Código relevante

```typescript
// backend/src/services/ventas.service.ts — VentasService.registrarVenta()
return await prisma.$transaction(async (tx: any) => {
  // ... descontar FEFO, calcular total ...
  
  // Registrar venta
  const venta = await tx.venta.create({ data: { ... } })
  
  // Manejo de puntos (Fidelidad)
  if (data.clienteId) {
    if (puntosDescontados > 0) {
      await tx.cliente.update({
        where: { id: data.clienteId },
        data: { puntosAcumulados: { decrement: puntosDescontados } }
      })
    }
    const puntosGanados = Math.floor(total / 100)
    if (puntosGanados > 0) {
      const expira = new Date()
      expira.setFullYear(expira.getFullYear() + 1)
      await tx.cliente.update({
        where: { id: data.clienteId },
        data: {
          puntosAcumulados: { increment: puntosGanados },
          puntosExpiranEn: expira,
        },
      })
    }
  }
  return venta
})
```

---

## 🔐 Seguridad en Webhooks

### Medidas de seguridad implementadas para TODAS las pasarelas

| Medida | Implementación |
|---|---|
| **Anti-replay (nonce)** | Set en memoria con TTL de 5 min |
| **Anti-replay (timestamp)** | Validación ±5 min |
| **Idempotencia** | Cache en memoria de 24h |
| **Firma HMAC** | Wompi: `x-event-checksum`; Stripe: `stripe-signature`; MP: `x-signature` |
| **IP allowlist** | `WEBHOOK_IP_ALLOWLIST` |
| **Rate limiting** | `limitarWebhook` — 60 req/min por IP |

### Flujo de validación (ej. Wompi)

```
1. ¿IP permitida? → verificarIpWebhook
2. ¿Rate limit ok? → limitarWebhook
3. ¿Timestamp válido? → validarTimestampWebhook (±5 min)
4. ¿Nonce único? → validarNonce
5. ¿Firma HMAC válida? → crypto.createHmac + compare
6. ¿Idempotencia? → verificarIdempotencia (cache 24h)
7. Procesar → cachear idempotencia
```

---

## 🏪 Pasarelas de Pago

### Wompi (Colombia — sandbox)

| Propiedad | Valor |
|---|---|
| **Endpoint creación** | `POST /pagos/wompi/crear` |
| **Endpoint webhook** | `POST /pagos/wompi/webhook` |
| **Firma** | HMAC-SHA256 con `WOMPI_INTEGRITY_SECRET` |
| **Anti-replay** | `x-event-timestamp`, `x-event-nonce`, `x-event-checksum` |
| **Variables** | `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_INTEGRITY_SECRET` |

**Flujo:** Frontend → crear transacción → firma HMAC → redirect a Wompi Checkout → webhook → actualizar estado

### Stripe

| Propiedad | Valor |
|---|---|
| **Endpoint creación** | `POST /pagos/stripe/crear-intent` |
| **Endpoint webhook** | `POST /pagos/stripe/webhook` |
| **Firma** | `stripe-signature` (Stripe SDK) |
| **Idempotencia** | `Idempotency-Key` header |
| **Variables** | `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |

**Flujo:** Frontend → crear PaymentIntent → confirmar con clientSecret → webhook → APROBADO/RECHAZADO

### MercadoPago

| Propiedad | Valor |
|---|---|
| **Endpoint creación** | `POST /pagos/mercadopago/crear` |
| **Endpoint webhook** | `POST /pagos/mercadopago/webhook` |
| **Soporte** | Acepta `pedidoId` y `ventaId` |
| **Variables** | `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_PUBLIC_KEY` |

**Flujo:** Frontend → crear preferencia MP → redirect a `initPoint` → webhook → consultar API MP → actualizar estado

### Efectivo (POS)

| Propiedad | Valor |
|---|---|
| **Endpoint** | `POST /pagos/efectivo/registrar` |
| **Auth** | JWT empleado + RBAC |
| **Estado inicial** | `APROBADO` (confianza del empleado autenticado) |
| **Variables** | Ninguna |

**Flujo:** Empleado registra venta → registra pago → `PagoTransaccion` con `pasarela: 'EFECTIVO'`, `estado: 'APROBADO'`

---

## 💰 Programa de Puntos / Fidelidad

| Concepto | Valor |
|---|---|
| **Ganancia** | 1 punto por cada $100 COP del total final |
| **Canje** | 1 punto = $1 COP de descuento |
| **Expiración** | 1 año después de la última compra |
| **Redondeo** | `Math.floor(total / 100)` |
| **Persistencia** | ✅ PostgreSQL + Docker volume — no se pierde al reiniciar |

---

## 🔄 Resumen de estados de pago

```
PENDIENTE → APROBADO
         → RECHAZADO
         → REEMBOLSADO (solo pasarelas)
```

---

## 🧪 Tests

| Archivo | Descripción |
|---|---|
| `backend/src/__tests__/pagos.routes.test.ts` | Wompi — creación, webhook, estados |
| `backend/src/__tests__/pagos-pasarelas.routes.test.ts` | Stripe + MP |
| `backend/src/__tests__/ventas.service.test.ts` | Puntos fidelidad |
| `frontend/src/__tests__/Carrito.test.tsx` | Checkout |
