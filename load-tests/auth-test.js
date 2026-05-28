// ══════════════════════════════════════════════════════════
//  FARMACY — Auth Load Test (k6)
//  Evalúa rendimiento de login y autenticación
//  Ejecutar: k6 run --vus 5 --duration 20s load-tests/auth-test.js
// ══════════════════════════════════════════════════════════

import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.02'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1'

export default function () {
  // 1. Login exitoso (admin)
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'admin@farmacy.co',
    password: 'Admin@1234',
  }), { headers: { 'Content-Type': 'application/json' } })

  check(loginRes, {
    'login admin 200': (r) => r.status === 200,
    'login admin token presente': (r) => JSON.parse(r.body).data?.token !== undefined,
  })

  if (loginRes.status === 200) {
    const token = JSON.parse(loginRes.body).data.token

    // 2. Acceder a ruta protegida con token
    const perfilRes = http.get(`${BASE_URL}/empleados/perfil`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    check(perfilRes, {
      'perfil 200': (r) => r.status === 200,
    })

    // 3. Logout
    const logoutRes = http.post(`${BASE_URL}/auth/logout`, null, {
      headers: { Authorization: `Bearer ${token}` },
    })
    check(logoutRes, {
      'logout 200': (r) => r.status === 200,
    })
  }

  // 4. Login con credenciales incorrectas (validación)
  const badLoginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'fake@email.com',
    password: 'wrongpassword123!',
  }), { headers: { 'Content-Type': 'application/json' } })

  check(badLoginRes, {
    'bad login 401': (r) => r.status === 401,
  })

  sleep(1 + Math.random() * 2)
}
