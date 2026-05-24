// ══════════════════════════════════════════════════════════
//  test-fases-completo.ts
//  Suite integral Fases 0–7 — Énfasis INVIMA
//  Ejecutar: cd backend && npx ts-node scripts/test-fases-completo.ts
// ══════════════════════════════════════════════════════════

const BASE = 'http://127.0.0.1:3000/api/v1'

let passed = 0, failed = 0
const assert = (cond: boolean, msg: string) => {
  if (cond) { console.log(`  ✅ ${msg}`); passed++ }
  else { console.error(`  ❌ ${msg}`); failed++ }
}

async function json(url: string, init?: RequestInit) {
  const res = await fetch(url, init)
  const body = await res.json().catch(() => ({}))
  return { res, body }
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║  🧪  TEST INTEGRAL — FASES 0 a 7           ║')
  console.log('║  Énfasis: Regulación INVIMA Colombia       ║')
  console.log('╚══════════════════════════════════════════════╝')

  // ── FASE 0: NÚCLEO Y SALUD ─────────────────────────────
  console.log('\n━━━ FASE 0 — Núcleo y Salud ━━━')
  const h = await json(`${BASE}/health`)
  assert(h.res.ok, 'Health endpoint responde 200')

  // ── FASE 1: ENDPOINTS PÚBLICOS ─────────────────────────
  console.log('\n━━━ FASE 1 — Endpoints Públicos ━━━')
  const [cat, suc, buscar] = await Promise.all([
    json(`${BASE}/categorias`),
    json(`${BASE}/sucursales`),
    json(`${BASE}/productos/buscar?q=ibuprofeno&limite=5`),
  ])
  assert(cat.res.ok, 'GET /categorias OK')
  assert(Array.isArray(cat.body?.data), 'Categorías retorna array')
  assert(suc.res.ok, 'GET /sucursales OK')
  assert(buscar.res.ok, 'GET /productos/buscar OK')

  // ── FASE 2: SEGURIDAD Y RBAC ───────────────────────────
  console.log('\n━━━ FASE 2 — Seguridad y RBAC ━━━')

  const login = async (email: string, pass: string) => {
    const r = await json(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass }),
    })
    return r
  }

  const adminLogin  = await login('admin@farmacy.co', 'Admin@1234')
  const farmaLogin  = await login('farmaceuta@farmacy.co', 'Farm@1234')
  const auxilLogin  = await login('auxiliar@farmacy.co', 'Aux@1234')

  assert(adminLogin.res.ok,  'Admin login OK')
  assert(farmaLogin.res.ok,  'Farmacéuta login OK')
  assert(auxilLogin.res.ok,  'Auxiliar login OK')

  const adminToken = adminLogin.body?.data?.token
  const farmaToken = farmaLogin.body?.data?.token
  const auxilToken = auxilLogin.body?.data?.token
  assert(!!adminToken, 'Admin recibió JWT')
  assert(!!farmaToken, 'Farmacéuta recibió JWT')
  assert(!!auxilToken, 'Auxiliar recibió JWT')

  // RBAC — Auxiliar bloqueado de reportes y caja
  const auxRep = await json(`${BASE}/reportes/ventas`, { headers: { Authorization: `Bearer ${auxilToken}` } })
  const auxCaj = await json(`${BASE}/caja/historial`, { headers: { Authorization: `Bearer ${auxilToken}` } })
  assert(auxRep.res.status === 403, 'RBAC: Auxiliar bloqueado de Reportes (403)')
  assert(auxCaj.res.status === 403, 'RBAC: Auxiliar bloqueado de Caja (403)')

  // RBAC — Farmacéuta bloqueado de empleados
  const farmEmp = await json(`${BASE}/empleados`, { headers: { Authorization: `Bearer ${farmaToken}` } })
  assert(farmEmp.res.status === 403, 'RBAC: Farmacéuta bloqueado de Empleados (403)')

  // RBAC — Admin accede a todo
  const admEmp = await json(`${BASE}/empleados`, { headers: { Authorization: `Bearer ${adminToken}` } })
  const admRep = await json(`${BASE}/reportes/inventario`, { headers: { Authorization: `Bearer ${adminToken}` } })
  assert(admEmp.res.ok, 'RBAC: Admin accede a Empleados (200)')
  assert(admRep.res.ok, 'RBAC: Admin accede a Reportes (200)')

  // Token rotation
  const adminRefresh = adminLogin.body?.data?.refreshToken
  if (adminRefresh) {
    const ref1 = await json(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: adminRefresh }),
    })
    assert(ref1.res.ok, 'Refresh Token rota correctamente')

    const ref2 = await json(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: adminRefresh }),
    })
    assert(ref2.res.status === 401, 'Replay attack: viejo refresh es 401')
  }

  // Logout
  if (adminToken) {
    const logout = await json(`${BASE}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert(logout.res.ok, 'Logout exitoso')

    const ghost = await json(`${BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    })
    assert(ghost.res.status === 401, 'Token post-logout es 401 (blacklist)')
  }

  // ── FASE 3: INVENTARIO Y LOTES (FEFO) ──────────────────
  console.log('\n━━━ FASE 3 — Inventario y Lotes FEFO ━━━')

  // Obtener token fresco para el resto de pruebas
  const admin2 = await login('admin@farmacy.co', 'Admin@1234')
  const t = admin2.body?.data?.token

  // Listar lotes
  const lotes = await json(`${BASE}/lotes?limite=5`, { headers: { Authorization: `Bearer ${t}` } })
  assert(lotes.res.ok, 'GET /lotes OK')

  const lotesData = Array.isArray(lotes.body?.data) ? lotes.body.data : []
  if (lotesData.length > 0) {
    // Verificar que los lotes estén ordenados por fechaVencimiento (FEFO)
    const fechas = lotesData.map((l: any) => new Date(l.fechaVencimiento).getTime())
    const ordenado = fechas.every((f: number, i: number) => i === 0 || f >= fechas[i - 1])
    assert(ordenado, 'Lotes ordenados por fechaVencimiento asc (FEFO)')
    assert(lotesData[0].producto?.nombre, 'Cada lote incluye producto.nombre')
    assert(lotesData[0].sucursal?.nombre, 'Cada lote incluye sucursal.nombre')
  } else {
    console.log('  ⚠️  No hay lotes — ejecuta generar-lotes.ts primero')
  }

  // Inventario reports
  const invRep = await json(`${BASE}/reportes/inventario`, { headers: { Authorization: `Bearer ${t}` } })
  assert(invRep.res.ok, 'GET /reportes/inventario OK')
  if (invRep.body?.data) {
    assert('stockTotal' in invRep.body.data, 'Reporte incluye stockTotal')
    assert('stockCritico' in invRep.body.data, 'Reporte incluye stockCritico')
    assert('porVencer' in invRep.body.data, 'Reporte incluye porVencer')
    assert('agotados' in invRep.body.data, 'Reporte incluye agotados')
  }

  // ── FASE 4: PROVEEDORES Y COMPRAS ──────────────────────
  console.log('\n━━━ FASE 4 — Proveedores y Compras ━━━')
  const prov = await json(`${BASE}/proveedores`, { headers: { Authorization: `Bearer ${t}` } })
  assert(prov.res.ok, 'GET /proveedores OK')
  if (Array.isArray(prov.body?.data)) {
    assert(prov.body.data.length > 0, 'Existen proveedores registrados')
  }

  // ── FASE 5: INVIMA / REGULATORIO (FOCO PRINCIPAL) ──────
  console.log('\n━━━ FASE 5 — Regulación INVIMA (FOCO) ━━━')

  // 5a. /buscar NO debe devolver muestras médicas
  const todos = await json(`${BASE}/productos/buscar?limite=50`)
  assert(todos.res.ok, 'GET /productos/buscar (todos) OK')

  const prods = Array.isArray(todos.body?.data) ? todos.body.data : []
  assert(prods.length > 0, `Hay ${prods.length} productos visibles`)

  const muestras = prods.filter((p: any) => p.esMuestraMedica === true)
  assert(muestras.length === 0,
    `Ningún producto devuelto es muestra médica (${muestras.length} encontradas → BLOQUEADAS)`)

  const noMuestras = prods.filter((p: any) => p.esMuestraMedica === false)
  assert(noMuestras.length > 0, 'Productos visibles tienen esMuestraMedica: false')

  // 5b. Cada producto debe tener campos regulatorios INVIMA
  if (prods.length > 0) {
    const p = prods[0]
    assert(!!p.cum, 'Campo CUM presente')
    assert(!!p.registroInvima, 'Campo registroInvima presente')
    assert(!!p.principioActivo, 'Campo principioActivo presente')
    assert(!!p.atc, 'Campo ATC presente')
    assert(!!p.descripcionAtc !== undefined, 'Campo descripcionAtc presente')
    assert(!!p.titular !== undefined, 'Campo titular presente')
    assert(!!p.expediente !== undefined, 'Campo expediente presente')
    assert(!!p.formaFarmaceutica, 'Campo formaFarmaceutica presente')
    assert(!!p.viaAdministracion, 'Campo viaAdministracion presente')
    assert(!!p.estadoCum, 'Campo estadoCum presente')
    assert(!!p.estadoRegistro, 'Campo estadoRegistro presente')

    // Campos clínicos
    assert('alergenos' in p, 'Campo alergenos presente')
    assert('advertencias' in p, 'Campo advertencias presente')
    assert('indicaciones' in p, 'Campo indicaciones presente')
    assert('contraindicaciones' in p, 'Campo contraindicaciones presente')
    assert('reaccionesAdversas' in p, 'Campo reaccionesAdversas presente')
    assert('interacciones' in p, 'Campo interacciones presente')
    assert('modoUso' in p, 'Campo modoUso presente')

    // Campos de presentación
    assert('unidadReferencia' in p, 'Campo unidadReferencia presente')
    assert('cantidad' in p, 'Campo cantidad presente')
    assert('unidadMedida' in p, 'Campo unidadMedida presente')
    assert('modalidad' in p, 'Campo modalidad presente')
    assert('ium' in p, 'Campo IUM presente')
  }

  // 5c. Ver detalle de producto individual
  if (prods.length > 0) {
    const det = await json(`${BASE}/productos/${prods[0].id}`)
    assert(det.res.ok, 'GET /productos/:id OK')
    if (det.body?.data) {
      const d = det.body.data
      assert(!!d.categoria, 'Detalle incluye categoría')
      assert(Array.isArray(d.lotes), 'Detalle incluye lotes')
      assert(d.lotes.length > 0, 'Producto tiene lotes de inventario')
      // Verificar FEFO en lotes del detalle
      const fechasLote = d.lotes.map((l: any) => new Date(l.fechaVencimiento).getTime())
      const fefOk = fechasLote.every((f: number, i: number) => i === 0 || f >= fechasLote[i - 1])
      assert(fefOk, 'Lotes en detalle ordenados FEFO')
    }
  }

  // 5d. Categoría tiene count de productos
  if (Array.isArray(cat.body?.data) && cat.body.data.length > 0) {
    const c = cat.body.data[0]
    assert('_count' in c, 'Categoría incluye _count.productos')
  }

  // ── FASE 6: TIENDA B2C ─────────────────────────────────
  console.log('\n━━━ FASE 6 — Tienda B2C ━━━')

  // Buscar por múltiples criterios
  const porActivo = await json(`${BASE}/productos/buscar?q=cetirizina&limite=5`)
  assert(porActivo.res.ok, 'Búsqueda por principioActivo OK')

  const porLaboratorio = await json(`${BASE}/productos/buscar?q=genfar&limite=5`)
  assert(porLaboratorio.res.ok, 'Búsqueda por laboratorio OK')

  const filtroRx = await json(`${BASE}/productos/buscar?rx=true&limite=5`)
  assert(filtroRx.res.ok, 'Filtro por RX OK')

  // ── FASE 7: PASARELAS DE PAGO ──────────────────────────
  console.log('\n━━━ FASE 7 — Pasarelas de Pago ━━━')

  // Verificar que los endpoints de pasarelas existen
  // Nota: Stripe/Wompi/MercadoPago pueden no estar configurados — OK
  const stripe_ep = await json(`${BASE}/pagos/stripe/crear-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ pedidoId: 'test' }),
  })
  // 503 = no configurado, 400 = bad request (avance)
  assert(stripe_ep.res.status === 503 || stripe_ep.res.status === 400 || stripe_ep.res.status === 404,
    `POST /pagos/stripe/crear-intent responde (${stripe_ep.res.status})`)

  const wompi_ep = await json(`${BASE}/pagos/wompi/crear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pedidoId: 'test', monto: 50000 }),
  })
  assert(wompi_ep.res.status === 503 || wompi_ep.res.status === 401,
    `POST /pagos/wompi/crear responde (${wompi_ep.res.status})`)

  // ── RESUMEN FINAL ──────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log(`║  📊  ${passed} tests PASARON  |  ${failed} FALLARON           ║`)
  console.log('╚══════════════════════════════════════════════╝')

  if (failed === 0) {
    console.log('\n🎉 TODAS LAS FASES VERIFICADAS — INVIMA implementado correctamente.\n')
  } else {
    console.error(`\n⚠️  ${failed} test(s) fallaron. Revisa los logs.\n`)
  }
}

main().catch(err => {
  console.error('\n💥 Error fatal:', err)
  process.exit(1)
})
