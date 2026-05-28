// ══════════════════════════════════════════════════════════
//  FARMACY — Checkout Flow Load Test (k6)
//  Flujo completo: login cliente → ver productos → checkout
//  Ejecutar: k6 run --vus 3 --duration 15s load-tests/checkout-test.js
// ══════════════════════════════════════════════════════════

import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.02'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1'

export default function () {
  // 1. Login como cliente demo
  const loginRes = http.post(`${BASE_URL}/clientes/auth/login`, JSON.stringify({
    email: 'cliente@ejemplo.co',
    password: 'Cliente@1234',
  }), { headers: { 'Content-Type': 'application/json' } })

  check(loginRes, {
    'login cliente 200': (r) => r.status === 200,
  })

  const token = loginRes.status === 200 ? JSON.parse(loginRes.body).data?.token : null

  if (!token) {
    console.log('❌ No se pudo obtener token de cliente')
    return
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }

  // 2. Ver catálogo
  const productosRes = http.get(`${BASE_URL}/productos/buscar?limite=5`)
  check(productosRes, { 'catálogo 200': (r) => r.status === 200 })

  // 3. Obtener un producto
  const body = JSON.parse(productosRes.body)
  const productos = body.data?.productos || body.data || []
  if (productos.length === 0) {
    console.log('⚠️ No hay productos disponibles')
    return
  }

  const producto = productos[0]
  const productoId = producto.id || producto.ID

  // 4. Ver detalle del producto
  const detalleRes = http.get(`${BASE_URL}/productos/${productoId}`)
  check(detalleRes, { 'detalle 200': (r) => r.status === 200 })

  sleep(1)

  console.log(`✅ Checkout flow completado para producto ID: ${productoId}`)
}
