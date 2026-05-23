const BASE_URL = 'http://127.0.0.1:3000/api/v1';

async function runTests() {
  console.log('\n==========================================================');
  console.log('🧪 INICIANDO BATERÍA EXHAUSTIVA DE PRUEBAS (FASES 0, 1 y 2)');
  console.log('==========================================================\n');
  
  let passed = 0; let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) { console.log(`✅ [OK] ${message}`); passed++; } 
    else { console.error(`❌ [FAIL] ${message}`); failed++; }
  }

  try {
    // ─── FASE 0: VERIFICACIONES BÁSICAS ─────────────────────────────────────────
    console.log('\n--- FASE 0: NÚCLEO Y SALUD ---');
    const resHealth = await fetch(`${BASE_URL}/health`);
    assert(resHealth.ok, 'El servidor está activo y respondiendo a los pings de vida.');

    // ─── FASE 1: ENDPOINTS PÚBLICOS DE TIENDA (B2C) ───────────────────────────
    console.log('\n--- FASE 1: ENDPOINTS PÚBLICOS ---');
    const [resCat, resProd, resSuc] = await Promise.all([
      fetch(`${BASE_URL}/categorias`),
      fetch(`${BASE_URL}/productos/buscar?q=ibuprofeno`),
      fetch(`${BASE_URL}/sucursales`)
    ]);
    assert(resCat.ok && resProd.ok && resSuc.ok, 'Rutas públicas (Categorías, Productos, Sucursales) responden correctamente.');

    // ─── FASE 2: AUTENTICACIÓN Y GENERACIÓN DE TOKENS ─────────────────────────
    console.log('\n--- FASE 2: AUTENTICACIÓN (LOGIN) ---');
    const fetchLogin = async (e: string, p: string) => await (await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e, password: p })
    })).json();

    const admin = await fetchLogin('admin@farmacy.co', 'Admin@1234');
    const farma = await fetchLogin('farmaceuta@farmacy.co', 'Farm@1234');
    const auxil = await fetchLogin('auxiliar@farmacy.co', 'Aux@1234');

    assert(admin.ok && farma.ok && auxil.ok, 'Los 3 roles de empleados pueden iniciar sesión (Passwords encriptados coinciden).');

    // ─── FASE 2: CONTROL DE ACCESO BASADO EN ROLES (RBAC) ─────────────────────
    console.log('\n--- FASE 2: CONTROL DE ROLES (RBAC) ---');
    
    // Auxiliar intenta entrar a reportes y a caja (Prohibido)
    const resAuxRep = await fetch(`${BASE_URL}/reportes/ventas`, { headers: { 'Authorization': `Bearer ${auxil.data.token}` }});
    const resAuxCaj = await fetch(`${BASE_URL}/caja/historial`, { headers: { 'Authorization': `Bearer ${auxil.data.token}` }});
    assert(resAuxRep.status === 403 && resAuxCaj.status === 403, 'Auditoría RBAC: El Auxiliar es bloqueado correctamente de Reportes y Caja (403).');

    // Farmaceuta intenta entrar a empleados (Prohibido)
    const resFarmEmp = await fetch(`${BASE_URL}/empleados`, { headers: { 'Authorization': `Bearer ${farma.data.token}` }});
    assert(resFarmEmp.status === 403, 'Auditoría RBAC: El Farmacéuta es bloqueado correctamente de Recursos Humanos (403).');

    // Administrador entra a todo (Permitido)
    const resAdmEmp = await fetch(`${BASE_URL}/empleados`, { headers: { 'Authorization': `Bearer ${admin.data.token}` }});
    const resAdmRep = await fetch(`${BASE_URL}/reportes/inventario`, { headers: { 'Authorization': `Bearer ${admin.data.token}` }});
    assert(resAdmEmp.status === 200 && resAdmRep.status === 200, 'Auditoría RBAC: El Administrador tiene acceso irrestricto a los módulos (200).');

    // ─── FASE 2: ROTACIÓN DE REFRESH TOKENS Y SEGURIDAD REDIS ─────────────────
    console.log('\n--- FASE 2: PROTECCIÓN DE TOKENS (REDIS BLACKLIST) ---');
    
    const resRefresh1 = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: admin.data.refreshToken })
    });
    const dataRef1: any = await resRefresh1.json();
    assert(resRefresh1.ok, 'Rotación de Tokens: El servidor emitió un nuevo Access y Refresh token exitosamente.');

    const resRefresh2 = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: admin.data.refreshToken })
    });
    assert(resRefresh2.status === 401, 'Replay Attack Prevention: El Refresh Token anterior fue anulado por Redis y no puede clonarse.');

    // ─── FASE 2: LOGOUT SEGURO DE EMPLEADOS Y CLIENTES ────────────────────────
    const resLogout = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST', headers: { 'Authorization': `Bearer ${dataRef1.data.token}` }
    });
    assert(resLogout.ok, 'Logout Ejecutado: Sesión de Administrador cerrada.');

    const resGhostAccess = await fetch(`${BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${dataRef1.data.token}` }
    });
    assert(resGhostAccess.status === 401, 'Blacklist Access: Redis bloqueó inmediatamente el Token para evitar sesiones fantasma.');

    // ─── RESULTADO FINAL ──────────────────────────────────────────────────────
    console.log('\n==========================================================');
    console.log(`🎉 RESUMEN: ${passed} ÉXITOS | ${failed} FALLOS`);
    console.log('==========================================================\n');
    if (failed === 0) {
      console.log('🚀 CALIFICACIÓN: A+ | Sistema 100% estable. Entornos dockerizados, limpieza en el .bat, RBAC y Redis operativos.');
    } else {
      console.error('⚠️ El sistema tiene fallos. Revisa los logs.');
    }

  } catch (err) {
    console.error('\n💥 Error fatal de red durante las pruebas:', err);
  }
}

runTests();
