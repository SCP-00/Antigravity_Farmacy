const BASE_URL = 'http://127.0.0.1:3000/api/v1';

async function runTests() {
  console.log('🧪 Iniciando pruebas E2E (Fases 0, 1 y 2)...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASSED: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${message}`);
      failed++;
    }
  }

  try {
    // ── 1. HEALTH (Fase 0) ─────────────────────────────────
    const resHealth = await fetch(`${BASE_URL}/health`);
    assert(resHealth.ok, 'El servidor está activo y respondiendo (Fase 0)');

    // ── 2. LOGIN (Fases 1 y 2) ──────────────────────────────
    const resLoginAdmin = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@farmacy.co', password: 'Admin@1234' })
    });
    const dataAdmin = await resLoginAdmin.json();
    assert(resLoginAdmin.ok && dataAdmin.data.token, 'Login exitoso para Admin - Generación de JWT (Fase 2)');
    const adminToken = dataAdmin.data.token;
    const adminRefresh = dataAdmin.data.refreshToken;

    const resLoginFarm = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'farmaceuta@farmacy.co', password: 'Farm@1234' })
    });
    const dataFarm = await resLoginFarm.json();
    const farmToken = dataFarm.data.token;

    // ── 3. RBAC (Fase 2) ────────────────────────────────────
    const resRbacFail = await fetch(`${BASE_URL}/empleados`, {
      headers: { 'Authorization': `Bearer ${farmToken}` }
    });
    assert(resRbacFail.status === 403, 'RBAC: Farmacéuta es bloqueado al intentar ver Empleados (Fase 2)');

    const resRbacPass = await fetch(`${BASE_URL}/empleados`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(resRbacPass.status === 200, 'RBAC: Administrador es autorizado al ver Empleados (Fase 2)');

    // ── 4. ROTACIÓN DE TOKENS (Fase 2) ──────────────────────
    const resRefresh = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: adminRefresh })
    });
    const dataRefresh = await resRefresh.json();
    assert(resRefresh.ok && dataRefresh.data.token, 'Refresh Token: Rotación genera un nuevo par de tokens exitosamente (Fase 2)');
    const newAdminToken = dataRefresh.data.token;

    const resRefreshFail = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: adminRefresh })
    });
    assert(resRefreshFail.status === 401, 'Blacklist (Redis): El Refresh Token viejo fue anulado y no se puede reutilizar (Fase 2)');

    // ── 5. LOGOUT SEGURO (Fase 2) ───────────────────────────
    const resLogout = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${newAdminToken}` }
    });
    assert(resLogout.ok, 'Logout: Sesión cerrada exitosamente (Fase 2)');

    const resMeFail = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${newAdminToken}` }
    });
    assert(resMeFail.status === 401, 'Blacklist (Redis): El Token de Acceso es bloqueado inmediatamente tras hacer Logout (Fase 2)');

    console.log(`\n🎉 Resultados de la prueba: ${passed} exitosos, ${failed} fallidos.`);
    if (failed === 0) {
      console.log('🚀 ¡Tu sistema backend es increíblemente sólido! Listo para la Fase 3.');
    }

  } catch (err) {
    console.error('\n⚠️ Hubo un error de red o de ejecución al correr el test:', err);
  }
}

runTests();
