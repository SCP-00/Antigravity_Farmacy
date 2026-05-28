// ══════════════════════════════════════════════════════════
//  FARMACY — Smoke Test (k6)
//  Verifica que los endpoints críticos respondan correctamente
//  Ejecutar: k6 run load-tests/smoke-test.js
// ══════════════════════════════════════════════════════════

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_duration: ['p(95)<5000'], // 5s máximo para smoke test
    http_req_failed: ['rate<0.01'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1'

export default function () {
  // 1. Health check
  const healthRes = http.get(`${BASE_URL}/health`)
  check(healthRes, {
    'health status 200': (r) => r.status === 200,
    'health ok': (r) => JSON.parse(r.body).ok === true,
  })
  console.log(`✅ Health: ${healthRes.status}`)

  // 2. Catálogo de productos
  const productosRes = http.get(`${BASE_URL}/productos/buscar?limite=5`)
  check(productosRes, {
    'productos status 200': (r) => r.status === 200,
    'productos tiene data': (r) => JSON.parse(r.body).ok === true,
  })
  console.log(`✅ Productos: ${productosRes.status}`)

  // 3. Categorías
  const categoriasRes = http.get(`${BASE_URL}/categorias`)
  check(categoriasRes, {
    'categorias status 200': (r) => r.status === 200,
  })
  console.log(`✅ Categorías: ${categoriasRes.status}`)

  // 4. Sucursales
  const sucursalesRes = http.get(`${BASE_URL}/sucursales`)
  check(sucursalesRes, {
    'sucursales status 200': (r) => r.status === 200,
  })
  console.log(`✅ Sucursales: ${sucursalesRes.status}`)

  // 5. Login fallido (validación de errores)
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'noexiste@test.com',
    password: 'wrong',
  }), { headers: { 'Content-Type': 'application/json' } })
  check(loginRes, {
    'login fallido 401': (r) => r.status === 401,
  })
  console.log(`✅ Login fallido: ${loginRes.status} (esperado 401)`)

  // 6. Chatbot
  const chatRes = http.post(`${BASE_URL}/chatbot`, JSON.stringify({
    mensaje: 'hola',
  }), { headers: { 'Content-Type': 'application/json' } })
  check(chatRes, {
    'chatbot status 200': (r) => r.status === 200,
  })
  console.log(`✅ Chatbot: ${chatRes.status}`)

  console.log('\n🎯 Smoke test completado — todos los endpoints responden')
}
