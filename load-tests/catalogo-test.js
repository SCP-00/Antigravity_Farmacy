// ══════════════════════════════════════════════════════════
//  FARMACY — Catálogo Load Test (k6)
//  Evalúa rendimiento de endpoints públicos del catálogo
//  Ejecutar: k6 run --vus 10 --duration 30s load-tests/catalogo-test.js
// ══════════════════════════════════════════════════════════

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1'

// Palabras de búsqueda variadas
const BUSQUEDAS = ['ibuprofeno', 'acetaminofén', 'vitamina', 'crema', 'jarabe', 'antibiótico', '']

export default function () {
  // 1. Listar productos (paginado)
  const pagina = Math.floor(Math.random() * 5) + 1
  const prodRes = http.get(`${BASE_URL}/productos/buscar?pagina=${pagina}&limite=20`)
  check(prodRes, {
    'productos status 200': (r) => r.status === 200,
  })

  // 2. Buscar producto aleatorio
  const busqueda = BUSQUEDAS[Math.floor(Math.random() * BUSQUEDAS.length)]
  if (busqueda) {
    const searchRes = http.get(`${BASE_URL}/productos/buscar?q=${encodeURIComponent(busqueda)}`)
    check(searchRes, {
      'búsqueda status 200': (r) => r.status === 200,
    })
  }

  // 3. Categorías
  const catRes = http.get(`${BASE_URL}/categorias`)
  check(catRes, {
    'categorías status 200': (r) => r.status === 200,
  })

  sleep(0.5 + Math.random())
}
